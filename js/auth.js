/* ============================================================================
 * SIMANTRI v3 — Auth helpers
 * Plain JS. Pakai window.SIMANTRI_DB.getClient() untuk auth Supabase.
 *
 * FLOW:
 *   - Saat aplikasi dibuka → user adalah "public viewer" (bisa lihat data,
 *     tapi tidak bisa add/edit/delete/download/print/verify)
 *   - User klik "Login Admin" di header → muncul modal login
 *   - Login sukses → dapat full access (Admin Dinkes)
 *   - Logout → kembali ke public viewer mode
 *
 * TIDAK ADA PENYIMPANAN SESSION — refresh browser = kembali ke public viewer
 * ============================================================================ */

(function () {
  'use strict';

  const db = window.SIMANTRI_DB;
  const utils = window.SIMANTRI_UTILS;

  let _session = null;
  let _profile = null;       // null = public viewer; set = admin (Dinkes)
  let _ready = false;
  let _readyResolvers = [];

  // === Demo user — hanya Admin Dinkes ===
  const DEMO_USERS = [
    {
      id: 'demo-dinkes',
      email: 'dinkes@simantri.demo',
      password: 'dinkes123',
      full_name: 'Dr. Admin Dinkes',
      role: 'dinkes',
      fasyankes_id: null,
      avatar_url: null,
    },
  ];

  // === Public viewer profile (untuk display di sidebar/header saat belum login) ===
  const PUBLIC_VIEWER_PROFILE = {
    id: null,
    email: null,
    full_name: 'Pengunjung',
    role: 'public',
    fasyankes_id: null,
    avatar_url: null,
  };

  // === Init — subscribe auth state change (production only) ===
  function initAuth() {
    if (db.isDemoMode()) {
      // Demo mode: default ke public viewer (no session restore)
      _markReady();
      return;
    }

    const client = db.getClient();
    if (!client) {
      _markReady();
      return;
    }

    // Production: Supabase auth state change
    // persistSession: false → refresh = kembali ke public viewer
    client.auth.onAuthStateChange(async function (_event, session) {
      _session = session;
      if (session && session.user) {
        _profile = await loadProfile(session.user.id);
      } else {
        _profile = null; // Public viewer
      }
      _markReady();
      document.dispatchEvent(new CustomEvent('simantri:auth-change', { detail: { session: session, profile: _profile } }));
    });
  }

  function _markReady() {
    _ready = true;
    _readyResolvers.forEach(function (r) { r(); });
    _readyResolvers = [];
  }

  function onAuthReady() {
    if (_ready) return Promise.resolve();
    return new Promise(function (res) { _readyResolvers.push(res); });
  }

  // === Profile loader (production) ===
  async function loadProfile(userId) {
    try {
      const client = db.getClient();
      const { data, error } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (error) throw error;
      if (!data) {
        const { data: user } = await client.auth.getUser();
        const meta = (user && user.user && user.user.user_metadata) || {};
        const newProfile = {
          id: userId,
          email: (user && user.user && user.user.email) || '',
          full_name: meta.full_name || meta.name || 'Pengguna Baru',
          role: 'dinkes',
          fasyankes_id: meta.fasyankes_id || null,
          avatar_url: meta.avatar_url || null,
        };
        const { data: inserted, error: insErr } = await client.from('profiles').insert(newProfile).select().single();
        if (insErr) throw insErr;
        return inserted;
      }
      return data;
    } catch (err) {
      console.error('[SIMANTRI] loadProfile:', err);
      return null;
    }
  }

  // === Sign in ===
  async function signIn(email, password) {
    if (db.isDemoMode()) {
      const user = DEMO_USERS.find(function (u) {
        return u.email.toLowerCase() === (email || '').toLowerCase() && u.password === password;
      });
      if (!user) {
        throw new Error('Email atau password salah. Gunakan akun demo: dinkes@simantri.demo / dinkes123');
      }
      _profile = {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        fasyankes_id: user.fasyankes_id,
        avatar_url: user.avatar_url,
      };
      document.dispatchEvent(new CustomEvent('simantri:auth-change', { detail: { profile: _profile } }));
      return _profile;
    }
    const client = db.getClient();
    const { data, error } = await client.auth.signInWithPassword({ email: email, password: password });
    if (error) throw error;
    return data;
  }

  async function signUp(opts) {
    if (db.isDemoMode()) throw new Error('Sign-up tidak tersedia di mode demo.');
    const client = db.getClient();
    const { data, error } = await client.auth.signUp({
      email: opts.email,
      password: opts.password,
      options: { data: { full_name: opts.fullName, role: 'dinkes', fasyankes_id: opts.fasyankesId || null } },
    });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    if (db.isDemoMode()) {
      _profile = null; // Kembali ke public viewer
      document.dispatchEvent(new CustomEvent('simantri:auth-change', { detail: { profile: null } }));
      return;
    }
    const client = db.getClient();
    await client.auth.signOut();
    _session = null;
    _profile = null;
  }

  // === Getters ===
  function getSession() { return _session; }

  /**
   * Get profile — return real profile if admin, atau PUBLIC_VIEWER_PROFILE jika public
   */
  function getProfile() {
    return _profile || PUBLIC_VIEWER_PROFILE;
  }

  /**
   * isAuthenticated — true hanya jika sudah login sebagai admin
   * Public viewer = false
   */
  function isAuthenticated() {
    if (db.isDemoMode()) return !!_profile;
    return !!_session;
  }

  /**
   * isPublicViewer — true jika belum login (bisa lihat data tapi tidak bisa aksi)
   */
  function isPublicViewer() {
    return !isAuthenticated();
  }

  function getRole() {
    if (!isAuthenticated()) return 'public';
    return _profile ? _profile.role : null;
  }
  function getFasyankesId() { return _profile ? _profile.fasyankes_id : null; }

  // === ROLE CHECKS ===
  function isDinkes()     { return isAuthenticated() && _profile && _profile.role === 'dinkes'; }
  function isFasyankes()  { return false; } // Role dihapus
  function isNakes()      { return false; } // Role dihapus
  function canViewAll()   { return true; } // Public viewer & admin bisa lihat semua data

  // === PERMISSION HELPERS — hanya admin (Dinkes) yang bisa aksi ===
  // Public viewer: TIDAK bisa add/edit/delete/download/print/verify/approve/manage-user
  function canAdd()       { return isAuthenticated(); }
  function canEdit()      { return isAuthenticated(); }
  function canDelete()    { return isAuthenticated(); }
  function canDownload()  { return isAuthenticated(); }
  function canPrint()     { return isAuthenticated(); }
  function canVerify()    { return isAuthenticated(); }
  function canApprove()   { return isAuthenticated(); }
  function canReject()    { return isAuthenticated(); }
  function canManageUser() { return isAuthenticated(); }
  function canExport()    { return isAuthenticated(); }

  /**
   * Cek apakah user boleh melakukan aksi tertentu.
   * Public viewer = false untuk semua aksi.
   * Admin (Dinkes) = true untuk semua aksi.
   */
  function can(action) {
    if (!isAuthenticated()) return false;
    switch (action) {
      case 'add': case 'edit': case 'delete': case 'download':
      case 'print': case 'verify': case 'approve': case 'reject':
      case 'manage-user': case 'export':
        return true;
      default:
        return false;
    }
  }

  // === Expose ===
  window.SIMANTRI_AUTH = {
    initAuth: initAuth,
    onAuthReady: onAuthReady,
    signIn: signIn,
    signUp: signUp,
    signOut: signOut,
    getSession: getSession,
    getProfile: getProfile,
    isAuthenticated: isAuthenticated,
    isPublicViewer: isPublicViewer,
    getRole: getRole,
    getFasyankesId: getFasyankesId,
    isDinkes: isDinkes,
    isFasyankes: isFasyankes,
    isNakes: isNakes,
    canViewAll: canViewAll,
    // Permissions
    can: can,
    canAdd: canAdd,
    canEdit: canEdit,
    canDelete: canDelete,
    canDownload: canDownload,
    canPrint: canPrint,
    canVerify: canVerify,
    canApprove: canApprove,
    canReject: canReject,
    canManageUser: canManageUser,
    canExport: canExport,
    DEMO_USERS: DEMO_USERS,
    PUBLIC_VIEWER_PROFILE: PUBLIC_VIEWER_PROFILE,
  };
})();
