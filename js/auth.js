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

  // === Init — tidak ada session restore (refresh = public viewer) ===
  function initAuth() {
    // Baik demo maupun production: TIDAK restore session saat load
    // User harus login setiap kali buka aplikasi
    _markReady();
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

  // === Profile loader (production) — tidak dipakai karena pakai custom auth ===
  // Profile sudah di-set langsung dari hasil verify_user RPC
  async function loadProfile(userId) {
    // Tidak dipakai —保留 untuk kompatibilitas
    return _profile;
  }

  // === Sign in ===
  async function signIn(email, password) {
    if (db.isDemoMode()) {
      // Demo mode: pakai DEMO_USERS hardcoded
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

    // Production mode: panggil RPC verify_user di Supabase
    // (TIDAK memakai Supabase Auth bawaan — pakai custom auth via tabel profiles)
    const client = db.getClient();
    try {
      const { data, error } = await client.rpc('verify_user', {
        p_email: email,
        p_password: password,
      });

      if (error) {
        console.error('[SIMANTRI] verify_user RPC error:', error);
        throw new Error('Gagal memverifikasi login: ' + error.message);
      }

      if (!data) {
        throw new Error('Email atau password salah. Atau akun tidak aktif.');
      }

      // data adalah profile row dari tabel profiles
      _profile = {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        fasyankes_id: data.fasyankes_id,
        avatar_url: data.avatar_url,
      };
      document.dispatchEvent(new CustomEvent('simantri:auth-change', { detail: { profile: _profile } }));
      return _profile;
    } catch (err) {
      console.error('[SIMANTRI] signIn error:', err);
      throw err;
    }
  }

  async function signUp(opts) {
    // Sign-up via UI tidak didukung — admin harus tambah user via SQL Editor
    // atau via halaman Manajemen User (yang insert ke tabel profiles)
    if (db.isDemoMode()) throw new Error('Sign-up tidak tersedia di mode demo.');
    throw new Error('Sign-up tidak didukung. Admin tambah user via halaman Manajemen User atau SQL Editor Supabase.');
  }

  async function signOut() {
    // Clear in-memory profile (kembali ke public viewer)
    _profile = null;
    _session = null;
    document.dispatchEvent(new CustomEvent('simantri:auth-change', { detail: { profile: null } }));
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
