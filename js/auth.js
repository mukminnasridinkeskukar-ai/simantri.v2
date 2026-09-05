/* ============================================================================
 * SIMANTRI v3 — Auth helpers
 * Plain JS. Pakai window.SIMANTRI_DB.getClient() untuk auth Supabase.
 * ============================================================================ */

(function () {
  'use strict';

  const db = window.SIMANTRI_DB;
  const utils = window.SIMANTRI_UTILS;

  let _session = null;
  let _profile = null;
  let _ready = false;
  let _readyResolvers = [];

  // Demo profile (fallback saat Supabase belum dikonfigurasi)
  const DEMO_PROFILE = {
    id: 'demo-user',
    email: 'admin.dinkes@simantri.demo',
    full_name: 'Dr. Demo Admin Dinkes',
    role: 'dinkes',
    fasyankes_id: null,
    avatar_url: null,
  };

  // === Init — subscribe auth state change ===
  function initAuth() {
    if (db.isDemoMode()) {
      _profile = DEMO_PROFILE;
      _markReady();
      return;
    }
    const client = db.getClient();
    if (!client) {
      _profile = DEMO_PROFILE;
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

  // === Profile loader ===
  async function loadProfile(userId) {
    try {
      const client = db.getClient();
      const { data, error } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (error) throw error;
      if (!data) {
        // Profile belum ada — buat default
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

  // === Sign in / out / signup ===
  async function signIn(email, password) {
    if (db.isDemoMode()) {
      _profile = DEMO_PROFILE;
      document.dispatchEvent(new CustomEvent('simantri:auth-change', { detail: { profile: _profile } }));
      utils.toast('Masuk sebagai demo (mode preview)', 'info');
      return _profile;
    }
    const client = db.getClient();
    const { data, error } = await client.auth.signInWithPassword({ email: email, password: password });
    if (error) throw error;
    return data;
  }

  async function signUp(opts) {
    if (db.isDemoMode()) throw new Error('Sign-up tidak tersedia di mode demo');
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
  function isAuthenticated() { return db.isDemoMode() ? !!_profile : !!_session; }
  function getRole() { return _profile ? _profile.role : null; }
  function getFasyankesId() { return _profile ? _profile.fasyankes_id : null; }
  function isDinkes() { return _profile && _profile.role === 'dinkes'; }
  function isFasyankes() { return _profile && _profile.role === 'fasyankes'; }
  function isNakes() { return _profile && _profile.role === 'nakes'; }
  function canViewAll() { return isDinkes(); }

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
    DEMO_PROFILE: DEMO_PROFILE,
  };
})();
