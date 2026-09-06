/* ============================================================================
 * SIMANTRI v3 — Auth helpers
 * Plain JS. Pakai window.SIMANTRI_DB.getClient() untuk auth Supabase.
 *
 * SINGLE ROLE: Admin Dinkes saja (full access)
 * Demo mode: 1 user predefined (dinkes)
 * Production: pakai Supabase Auth
 *
 * TIDAK ADA PENYIMPANAN SESSION — refresh browser = logout
 * (Sesuai kebutuhan: pakai mock data, integrasi Supabase saja)
 * ============================================================================ */

(function () {
  'use strict';

  const db = window.SIMANTRI_DB;
  const utils = window.SIMANTRI_UTILS;

  let _session = null;
  let _profile = null;       // In-memory only — TIDAK disimpan ke localStorage
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

  // === Init — subscribe auth state change (production only) ===
  function initAuth() {
    if (db.isDemoMode()) {
      // Demo mode: tidak restore session. User harus login setiap kali buka aplikasi.
      _markReady();
      return;
    }

    const client = db.getClient();
    if (!client) {
      _markReady();
      return;
    }

    // Production: Supabase auth state change
    // Catatan: persistSession sudah diset false di supabase.js — refresh = logout
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
          role: 'dinkes', // Default ke dinkes (single-role system)
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
        throw new Error('Email atau password salah. Gunakan akun demo: dinkes@simantri.demo / dinkes123');
      }
      // Set profile in-memory (TIDAK disimpan ke localStorage)
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
      options: { data: { full_name: opts.fullName, role: 'dinkes', fasyankes_id: opts.fasyankesId || null } },
    });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    if (db.isDemoMode()) {
      // Demo mode: clear in-memory only (tidak ada localStorage untuk dihapus)
      _profile = null;
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

  // === ROLE CHECKS — semua user adalah Dinkes (single-role) ===
  // Dipertahankan untuk kompatibilitas dengan kode existing, tapi selalu sama
  function isDinkes()     { return isAuthenticated(); }
  function isFasyankes()  { return false; } // Role ini sudah dihapus
  function isNakes()      { return false; } // Role ini sudah dihapus
  function canViewAll()   { return isAuthenticated(); }

  // === PERMISSION HELPERS — semua user (Dinkes) punya full access ===
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
   * Single-role: semua user adalah Dinkes → semua aksi diizinkan jika login.
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
