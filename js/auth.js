/* ============================================================================
 * SIMANTRI v3 — Auth helpers
 * Plain JS. Pakai window.SIMANTRI_DB.getClient() untuk auth Supabase.
 *
 * Sistem auth memakai tabel `users` dari schema SIMANTRI v1.1:
 *   - username (PK)
 *   - password (plaintext untuk demo; production harusnya hash)
 *   - role ('admin' atau 'operator')
 *   - full_name
 *   - is_active
 *
 * Login divalidasi via fungsi verify_user(username, password) di Supabase,
 * atau query langsung di demo mode.
 * ============================================================================ */

(function () {
  'use strict';

  const db = window.SIMANTRI_DB;
  const utils = window.SIMANTRI_UTILS;

  let _session = null;
  let _profile = null;
  let _ready = false;
  let _readyResolvers = [];

  // === Demo users (match schema seed: admin/admin123, operator/operator123) ===
  const DEMO_USERS = [
    { username: 'admin', password: 'admin123', full_name: 'Administrator SIMANTRI', role: 'admin', is_active: true },
    { username: 'operator', password: 'operator123', full_name: 'Operator Verval', role: 'operator', is_active: true },
  ];

  const PUBLIC_VIEWER_PROFILE = {
    id: null,
    username: null,
    email: null,
    full_name: 'Pengunjung',
    role: 'public',
  };

  // === Init — tidak ada session restore ===
  function initAuth() {
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

  // === Sign in ===
  async function signIn(username, password) {
    if (db.isDemoMode()) {
      const user = DEMO_USERS.find(function (u) {
        return u.username.toLowerCase() === (username || '').toLowerCase() && u.password === password && u.is_active;
      });
      if (!user) {
        throw new Error('Username atau password salah. Gunakan: admin / admin123');
      }
      _profile = {
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active,
      };
      document.dispatchEvent(new CustomEvent('simantri:auth-change', { detail: { profile: _profile } }));
      return _profile;
    }

    // Production: query tabel users
    const client = db.getClient();
    try {
      const { data, error } = await client
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        throw new Error('Gagal verifikasi login: ' + error.message);
      }
      if (!data) {
        throw new Error('Username atau password salah, atau akun tidak aktif.');
      }

      // Update last_login (kolom updated_at dipakai sebagai proxy)
      await client.from('users').update({ updated_at: new Date().toISOString() }).eq('username', username);

      _profile = {
        username: data.username,
        full_name: data.full_name,
        role: data.role,
        is_active: data.is_active,
      };
      document.dispatchEvent(new CustomEvent('simantri:auth-change', { detail: { profile: _profile } }));
      return _profile;
    } catch (err) {
      console.error('[SIMANTRI] signIn error:', err);
      throw err;
    }
  }

  async function signOut() {
    _profile = null;
    _session = null;
    document.dispatchEvent(new CustomEvent('simantri:auth-change', { detail: { profile: null } }));
  }

  // === Getters ===
  function getSession() { return _session; }
  function getProfile() { return _profile || PUBLIC_VIEWER_PROFILE; }
  function isAuthenticated() { return !!_profile; }
  function isPublicViewer() { return !isAuthenticated(); }
  function getRole() { return _profile ? _profile.role : 'public'; }

  // === Role checks ===
  // Hanya 'admin' yang boleh input data di Bagian 2
  // 'operator' bisa lihat Bagian 2 tapi TIDAK bisa tambah/edit/hapus
  // Public viewer hanya bisa lihat Bagian 1
  function isAdmin()     { return isAuthenticated() && _profile.role === 'admin'; }
  function isOperator()  { return isAuthenticated() && _profile.role === 'operator'; }
  function canViewAll()  { return true; } // Public bisa lihat data

  // === Permission helpers ===
  // Bagian 2 (Input Data) hanya untuk admin & operator
  // Tambah/Edit/Hapus HANYA untuk admin
  function canAccessSection2() { return isAdmin() || isOperator(); }
  function canAccessSection3() { return isAdmin() || isOperator(); }
  function canAdd()       { return isAdmin(); }
  function canEdit()      { return isAdmin(); }
  function canDelete()    { return isAdmin(); }
  function canDownload()  { return isAdmin() || isOperator(); }
  function canPrint()     { return isAdmin() || isOperator(); }
  function canVerify()    { return isAdmin(); }
  function canApprove()   { return isAdmin(); }
  function canReject()    { return isAdmin(); }
  function canManageUser() { return isAdmin(); }
  function canExport()    { return isAdmin() || isOperator(); }

  function can(action) {
    if (!isAuthenticated()) return false;
    switch (action) {
      case 'add': case 'edit': case 'delete': case 'verify':
      case 'approve': case 'reject': case 'manage-user':
        return isAdmin();
      case 'download': case 'print': case 'export':
        return isAdmin() || isOperator();
      default:
        return false;
    }
  }

  // === Expose ===
  window.SIMANTRI_AUTH = {
    initAuth: initAuth,
    onAuthReady: onAuthReady,
    signIn: signIn,
    signOut: signOut,
    getSession: getSession,
    getProfile: getProfile,
    isAuthenticated: isAuthenticated,
    isPublicViewer: isPublicViewer,
    getRole: getRole,
    isAdmin: isAdmin,
    isOperator: isOperator,
    canViewAll: canViewAll,
    canAccessSection2: canAccessSection2,
    canAccessSection3: canAccessSection3,
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
