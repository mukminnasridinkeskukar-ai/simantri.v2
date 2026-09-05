// ============================================
// SIMANTRI — Auth wrapper (Supabase)
// ============================================
import { supabase, isDemoMode } from './supabase.js';
import { toast } from './utils.js';

// ============================================
// State
// ============================================
let _session = null;
let _profile = null;
let _readyResolvers = [];
let _ready = false;

// Demo profile (fallback saat env belum di-set)
const DEMO_PROFILE = {
  id: 'demo-user',
  email: 'admin.dinkes@simantri.demo',
  full_name: 'Dr. Demo Admin Dinkes',
  role: 'dinkes',
  fasyankes_id: null,
  avatar_url: null,
};

// ============================================
// Init — subscribe ke auth state change
// ============================================
export function initAuth() {
  if (isDemoMode) {
    _session = null;
    _profile = DEMO_PROFILE;
    _markReady();
    return;
  }

  supabase.auth.onAuthStateChange(async (_event, session) => {
    _session = session;
    if (session?.user) {
      _profile = await loadProfile(session.user.id);
    } else {
      _profile = null;
    }
    _markReady();
    document.dispatchEvent(new CustomEvent('simantri:auth-change', { detail: { session, profile: _profile } }));
  });
}

function _markReady() {
  _ready = true;
  _readyResolvers.forEach((r) => r());
  _readyResolvers = [];
}

/** Promise yang resolve saat auth state pertama kali selesai restore */
export function onAuthReady() {
  if (_ready) return Promise.resolve();
  return new Promise((res) => _readyResolvers.push(res));
}

// ============================================
// Profile loader
// ============================================
async function loadProfile(userId) {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    if (!data) {
      // Profile belum ada — buat default role: nakes
      const { data: user } = await supabase.auth.getUser();
      const meta = user?.user?.user_metadata ?? {};
      const newProfile = {
        id: userId,
        email: user?.user?.email ?? '',
        full_name: meta.full_name ?? meta.name ?? 'Pengguna Baru',
        role: meta.role ?? 'nakes',
        fasyankes_id: meta.fasyankes_id ?? null,
        avatar_url: meta.avatar_url ?? null,
      };
      const { data: inserted, error: insErr } = await supabase.from('profiles').insert(newProfile).select().single();
      if (insErr) throw insErr;
      return inserted;
    }
    return data;
  } catch (err) {
    console.error('[SIMANTRI] loadProfile:', err);
    return null;
  }
}

// ============================================
// Sign in / out / signup
// ============================================
export async function signIn(email, password) {
  if (isDemoMode) {
    _profile = DEMO_PROFILE;
    document.dispatchEvent(new CustomEvent('simantri:auth-change', { detail: { profile: _profile } }));
    toast('Masuk sebagai demo (mode preview)', 'info');
    return _profile;
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp({ email, password, fullName, role = 'nakes', fasyankesId = null }) {
  if (isDemoMode) throw new Error('Sign-up tidak tersedia di mode demo');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role, fasyankes_id: fasyankesId } },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (isDemoMode) {
    _profile = null;
    document.dispatchEvent(new CustomEvent('simantri:auth-change', { detail: { profile: null } }));
    return;
  }
  await supabase.auth.signOut();
  _session = null;
  _profile = null;
}

// ============================================
// Getters
// ============================================
export function getSession() { return _session; }
export function getProfile() { return _profile; }
export function isAuthenticated() { return isDemoMode ? !!_profile : !!_session; }
export function getRole() { return _profile?.role ?? null; }
export function getFasyankesId() { return _profile?.fasyankes_id ?? null; }

/**
 * Role helper — true jika user adalah Dinkes (super-admin)
 */
export function isDinkes() { return _profile?.role === 'dinkes'; }
export function isFasyankes() { return _profile?.role === 'fasyankes'; }
export function isNakes() { return _profile?.role === 'nakes'; }

/** Cek apakah user boleh melihat semua data (hanya Dinkes) */
export function canViewAll() { return isDinkes(); }
