/* ============================================================================
 * SIMANTRI v3 — Auth helpers
 * Plain JS. Pakai window.SIMANTRI_DB.getClient() untuk auth Supabase.
 *
 * Demo mode: 3 user predefined (dinkes, fasyankes, nakes) — login pakai password
 * Production: pakai Supabase Auth (signInWithPassword)
 * ============================================================================ */

(function () {
  'use strict';

  const db = window.SIMANTRI_DB;
  const utils = window.SIMANTRI_UTILS;

  let _session = null;
  let _profile = null;
  let _ready = false;
  let _readyResolvers = [];

  // === Demo users — predefined untuk demo mode ===
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
    {
      id: 'demo-fasyankes',
      email: 'fasyankes@simantri.demo',
      password: 'fasyankes123',
      full_name: 'Admin Puskesmas Gundih',
      role: 'fasyankes',
      fasyankes_id: 'f-002', // Puskesmas Gundih
      avatar_url: null,
    },
    {
      id: 'demo-nakes',
      email: 'nakes@simantri.demo',
      password: 'nakes123',
      full_name: 'Dr. Siti Aminah',
      role: 'nakes',
      fasyankes_id: 'f-002',
      avatar_url: null,
    },
  ];

  // === Init — subscribe auth state change (production only) ===
  function initAuth() {
    // Cek apakah ada session demo yang tersimpan di localStorage
    const savedDemo = localStorage.getItem('simantri_demo_session');
    if (savedDemo) {
      try {
        const userId = JSON.parse(savedDemo).id;
        _profile = DEMO_USERS.find(function (u) { return u.id === userId; }) || null;
      } catch (e) { _profile = null; }
    }

    if (db.isDemoMode()) {
      _markReady();
      return;
    }

    const client = db.getClient();
    if (!client) {
      _markReady();
      return;
    }
    client.auth.onAuthStateChange(async function (_event, session) {
      _session = session;
      if (session && session.user) {
        _profile = await loadProfile(session.user.id);
      } else {
        _profile = null;
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
          role: meta.role || 'nakes',
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
      // Demo mode: cari user di DEMO_USERS
      const user = DEMO_USERS.find(function (u) {
        return u.email.toLowerCase() === (email || '').toLowerCase() && u.password === password;
      });
      if (!user) {
        throw new Error('Email atau password salah. Coba akun demo yang tersedia di bawah.');
      }
      // Buat profile tanpa password
      const profile = {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        fasyankes_id: user.fasyankes_id,
        avatar_url: user.avatar_url,
      };
      _profile = profile;
      localStorage.setItem('simantri_demo_session', JSON.stringify({ id: user.id }));
      document.dispatchEvent(new CustomEvent('simantri:auth-change', { detail: { profile: _profile } }));
      return _profile;
    }
    // Production: Supabase Auth
    const client = db.getClient();
    const { data, error } = await client.auth.signInWithPassword({ email: email, password: password });
    if (error) throw error;
    return data;
  }

  async function signUp(opts) {
    if (db.isDemoMode()) throw new Error('Sign-up tidak tersedia di mode demo. Hubungi admin Dinkes untuk dibuatkan akun.');
    const client = db.getClient();
    const { data, error } = await client.auth.signUp({
      email: opts.email,
      password: opts.password,
      options: { data: { full_name: opts.fullName, role: opts.role || 'nakes', fasyankes_id: opts.fasyankesId || null } },
    });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    if (db.isDemoMode()) {
      _profile = null;
      localStorage.removeItem('simantri_demo_session');
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
  function getProfile() { return _profile; }
  function isAuthenticated() {
    if (db.isDemoMode()) return !!_profile;
    return !!_session;
  }
  function getRole() { return _profile ? _profile.role : null; }
  function getFasyankesId() { return _profile ? _profile.fasyankes_id : null; }
  function isDinkes() { return _profile && _profile.role === 'dinkes'; }
  function isFasyankes() { return _profile && _profile.role === 'fasyankes'; }
  function isNakes() { return _profile && _profile.role === 'nakes'; }
  function canViewAll() { return isDinkes(); }

  // === PERMISSION HELPERS — untuk hide/show action buttons ===
  // Dinkes: semua bisa
  // Fasyankes: bisa add/edit data di fasyankesnya, bisa print laporan, TIDAK bisa download CSV regional, TIDAK bisa manajemen user
  // Nakes: VIEW ONLY — tidak bisa add/download/print/verify/approve/delete

  function canAdd()       { return isDinkes() || isFasyankes(); }
  function canEdit()      { return isDinkes() || isFasyankes(); }
  function canDelete()    { return isDinkes(); }
  function canDownload()  { return isDinkes(); }
  function canPrint()     { return isDinkes() || isFasyankes(); }
  function canVerify()    { return isDinkes(); }
  function canApprove()   { return isDinkes(); }
  function canReject()    { return isDinkes(); }
  function canManageUser() { return isDinkes(); }
  function canExport()    { return isDinkes(); }

  /**
   * Cek apakah user boleh melakukan aksi tertentu.
   * Action: 'add' | 'edit' | 'delete' | 'download' | 'print' | 'verify' | 'approve' | 'reject' | 'manage-user' | 'export'
   */
  function can(action) {
    switch (action) {
      case 'add':         return canAdd();
      case 'edit':        return canEdit();
      case 'delete':      return canDelete();
      case 'download':    return canDownload();
      case 'print':       return canPrint();
      case 'verify':      return canVerify();
      case 'approve':     return canApprove();
      case 'reject':      return canReject();
      case 'manage-user': return canManageUser();
      case 'export':      return canExport();
      default:            return false;
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
  };
})();
