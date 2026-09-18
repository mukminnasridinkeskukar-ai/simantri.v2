/**
 * ============================================================
 * SECURITY MODULE - login-protection.js
 * ============================================================
 * FITUR 2: Setelah 3x gagal login, percobaan login DIBLOKIR
 * SEMENTARA (cooldown 5 menit default). TIDAK ADA blokir
 * permanen - sesuai spesifikasi.
 *
 * PENTING (kejujuran arsitektur):
 * - Pemblokiran di sisi BROWSER (file ini) hanya lapisan UX;
 *   penyerang bisa menghapus localStorage.
 * - Pemblokiran yang SEBENARNYA wajib di server:
 *   gunakan server/security-server.js (loginGuard) - sudah
 *   disertakan dalam modul ini.
 * ============================================================
 */

import { KEYS, SECURITY_EVENTS, emit, jsonGet, jsonSet, jsonRemove, formatDuration, isBrowser } from './utils.js';
import { audit, AUDIT_EVENTS } from './audit-log.js';

let config = null;

/** Struktur data: { failures: number[], blockedUntil: number|null } */
function load() {
  const data = jsonGet(KEYS.LOGIN_ATTEMPTS);
  if (!data || !Array.isArray(data.failures)) {
    return { failures: [], blockedUntil: null };
  }
  return { failures: data.failures, blockedUntil: data.blockedUntil || null };
}

function save(state) {
  jsonSet(KEYS.LOGIN_ATTEMPTS, state);
}

function prune(state) {
  const cutoff = Date.now() - config.ATTEMPT_WINDOW;
  state.failures = state.failures.filter((t) => t > cutoff);
}

/**
 * Inisialisasi modul (dipanggil oleh security.js).
 * @param {object} cfg
 */
export function initLoginProtection(cfg) {
  config = cfg;
}

/**
 * Bolehkah mencoba login sekarang?
 * @returns {{ allowed: boolean, retryAfterMs: number, remainingAttempts: number }}
 */
export function checkLoginAllowed() {
  if (!config) return { allowed: true, retryAfterMs: 0, remainingAttempts: config ? config.MAX_LOGIN_ATTEMPTS : 3 };
  const state = pruneAndLoad();
  const now = Date.now();

  if (state.blockedUntil && now < state.blockedUntil) {
    return {
      allowed: false,
      retryAfterMs: state.blockedUntil - now,
      remainingAttempts: 0,
    };
  }

  // Cooldown sudah lewat -> reset
  if (state.blockedUntil && now >= state.blockedUntil) {
    jsonRemove(KEYS.LOGIN_ATTEMPTS);
    return { allowed: true, retryAfterMs: 0, remainingAttempts: config.MAX_LOGIN_ATTEMPTS };
  }

  return {
    allowed: true,
    retryAfterMs: 0,
    remainingAttempts: Math.max(0, config.MAX_LOGIN_ATTEMPTS - state.failures.length),
  };
}

/** Status lengkap untuk UI. */
export function getLoginStatus() {
  if (!config) {
    return { allowed: true, retryAfterMs: 0, remainingAttempts: 3, blocked: false, blockedUntil: null, failureCount: 0, maxAttempts: 3 };
  }
  const check = checkLoginAllowed();
  const state = pruneAndLoad();
  return {
    ...check,
    blocked: !check.allowed,
    blockedUntil: state.blockedUntil,
    failureCount: state.failures.length,
    maxAttempts: config ? config.MAX_LOGIN_ATTEMPTS : 3,
  };
}

/**
 * Catat SATU kegagalan login. Panggil setiap auth server menolak kredensial.
 * @returns {{ blocked: boolean, blockedUntil: number|null, remainingAttempts: number }}
 */
export function recordLoginFailure() {
  if (!config || !isBrowser()) return { blocked: false, blockedUntil: null, remainingAttempts: 3 };

  const state = pruneAndLoad();
  state.failures.push(Date.now());

  if (state.failures.length >= config.MAX_LOGIN_ATTEMPTS) {
    // BLOKIR SEMENTARA - selalu berhingga, tidak pernah permanen
    state.blockedUntil = Date.now() + config.LOGIN_COOLDOWN;
    state.failures = []; // hitungan baru setelah cooldown
    save(state);

    audit(AUDIT_EVENTS.LOGIN_BLOCKED, {
      cooldownMs: config.LOGIN_COOLDOWN,
      blockedUntil: new Date(state.blockedUntil).toISOString(),
    });

    emit(SECURITY_EVENTS.LOGIN_BLOCKED, { blockedUntil: state.blockedUntil });
    return { blocked: true, blockedUntil: state.blockedUntil, remainingAttempts: 0 };
  }

  save(state);
  audit(AUDIT_EVENTS.LOGIN_FAILED, {
    attempt: state.failures.length,
    remainingAttempts: config.MAX_LOGIN_ATTEMPTS - state.failures.length,
  });
  return {
    blocked: false,
    blockedUntil: null,
    remainingAttempts: config.MAX_LOGIN_ATTEMPTS - state.failures.length,
  };
}

/**
 * Catat login BERHASIL (reset penghitung gagal).
 * Catatan: event audit LOGIN_SUCCESS dicatat oleh session.createSession(),
 * bukan di sini, agar tidak dobel.
 */
export function recordLoginSuccess() {
  jsonRemove(KEYS.LOGIN_ATTEMPTS);
}

/** Reset penghitung gagal (dipakai internal oleh session.js). */
export function clearLoginAttempts() {
  jsonRemove(KEYS.LOGIN_ATTEMPTS);
}

/** Pesan blokir siap tampil ke pengguna, mis. "Terlalu banyak percobaan login gagal. Silakan coba lagi dalam 4 menit 59 detik." */
export function getBlockedMessage() {
  const status = getLoginStatus();
  if (!status.blocked) return null;
  return (config?.MESSAGES?.LOGIN_BLOCKED || 'Terlalu banyak percobaan login gagal. Coba lagi nanti.')
    .replace('{time}', formatDuration(status.retryAfterMs));
}

/**
 * Helper opsional: pasang proteksi pada <form> login yang sudah ada
 * TANPA mengubah logika auth aplikasi.
 *
 * @param {HTMLFormElement} formEl
 * @param {Function} doAuthenticate - async (formData) => {ok: boolean} hasil auth dari aplikasi/server
 *
 * Contoh pemakaian di halaman login:
 *   attachLoginForm(loginForm, async (fd) => {
 *     const res = await fetch('/api/login', {method:'POST', body: fd});
 *     return { ok: res.ok };
 *   });
 */
export function attachLoginForm(formEl, doAuthenticate) {
  if (!formEl || typeof doAuthenticate !== 'function') return () => {};
  const handler = async (ev) => {
    ev.preventDefault();
    const check = checkLoginAllowed();
    if (!check.allowed) {
      window.alert(getBlockedMessage() || 'Login diblokir sementara.');
      return;
    }
    const formData = new FormData(formEl);
    try {
      const result = await doAuthenticate(formData);
      if (result && result.ok) {
        recordLoginSuccess();
      } else {
        const after = recordLoginFailure();
        if (after.blocked) window.alert(getBlockedMessage() || 'Login diblokir sementara.');
        else window.alert(`Kredensial salah. Sisa percobaan: ${after.remainingAttempts}.`);
      }
    } catch (err) {
      console.warn('[security] authenticate error:', err);
    }
  };
  formEl.addEventListener('submit', handler);
  return () => formEl.removeEventListener('submit', handler);
}

// ---- internal ----
function pruneAndLoad() {
  const state = load();
  const cutoff = Date.now() - config.ATTEMPT_WINDOW;
  state.failures = state.failures.filter((t) => t > cutoff);
  return state;
}
