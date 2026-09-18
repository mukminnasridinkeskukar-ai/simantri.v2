/**
 * ============================================================
 * SECURITY MODULE - utils.js
 * ============================================================
 * Helper umum tanpa dependensi eksternal.
 * Semua penyimpanan memakai prefix "sec_" agar tidak pernah
 * menabrak data aplikasi yang sudah ada.
 * ============================================================
 */

/** Kunci penyimpanan terpusat (localStorage / sessionStorage). */
export const KEYS = Object.freeze({
  SESSION: 'sec_session',            // localStorage - rekaman sesi aktif
  SESSION_VERSION: 'sec_session_version', // localStorage - penanda "login terbaru menang"
  LOGIN_ATTEMPTS: 'sec_login_attempts',   // localStorage - riwayat gagal login
  AUDIT_LOG: 'sec_audit_log',        // localStorage - cache log audit
  CSRF_TOKEN: 'sec_csrf_token',      // localStorage - cadangan token csrf
  TAB_TICKET: 'sec_tab_ticket',      // sessionStorage - bukti tab sah (per-tab)
});

/** Nama event internal antar-submodul (event bus kecil). */
export const SECURITY_EVENTS = Object.freeze({
  SESSION_CREATED: 'session:created',
  SESSION_ROTATED: 'session:rotated',
  SESSION_EXPIRED: 'session:expired',
  SESSION_REVOKED: 'session:revoked',
  LOGOUT: 'logout',
  AUTOLOGOUT_WARNING: 'autologout:warning',
  AUTOLOGOUT_TRIGGER: 'autologout:trigger',
  LOGIN_BLOCKED: 'login:blocked',
});

// ------------------------------------------------------------
// Event bus mini (on / off / emit)
// ------------------------------------------------------------
const listeners = new Map();

export function on(event, cb) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(cb);
  return () => off(event, cb);
}

export function off(event, cb) {
  const set = listeners.get(event);
  if (set) set.delete(cb);
}

export function emit(event, payload) {
  const set = listeners.get(event);
  if (!set) return;
  for (const cb of Array.from(set)) {
    try { cb(payload); } catch (err) {
      // Kegagalan satu listener tidak boleh menjatuhkan modul keamanan.
      console.warn('[security] listener error:', err);
    }
  }
}

// ------------------------------------------------------------
// Lingkungan & ID
// ------------------------------------------------------------

export function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined' && typeof localStorage !== 'undefined';
}

/** ID acak yang aman secara kriptografis (hex, panjang = len). */
export function generateId(len = 24) {
  const size = Math.ceil(len / 2);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(size);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, len);
  }
  let out = '';
  while (out.length < len) out += Math.random().toString(16).slice(2);
  return out.slice(0, len);
}

// ------------------------------------------------------------
// Penyimpanan aman (semua dibungkus try/catch agar modul tidak
// pernah menjatuhkan aplikasi karena storage penuh / diblokir)
// ------------------------------------------------------------

export function jsonGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

export function jsonSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}

export function jsonRemove(key) {
  try { localStorage.removeItem(key); } catch { /* noop */ }
}

export function sessionJsonGet(key, fallback = null) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

export function sessionJsonSet(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}

export function sessionJsonRemove(key) {
  try { sessionStorage.removeItem(key); } catch { /* noop */ }
}

/** Simpan nilai dengan kedaluwarsa (TTL). */
export function setWithTTL(key, value, ttlMs) {
  return jsonSet(key, { v: value, exp: Date.now() + ttlMs });
}

/** Ambil nilai TTL; null jika kedaluwarsa (dan otomatis dihapus). */
export function getWithTTL(key) {
  const wrapped = jsonGet(key);
  if (!wrapped || typeof wrapped !== 'object' || !('exp' in wrapped)) return null;
  if (Date.now() > wrapped.exp) { jsonRemove(key); return null; }
  return wrapped.v;
}

// ------------------------------------------------------------
// Utilitas umum
// ------------------------------------------------------------

export function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return target;
  for (const key of Object.keys(source)) {
    const sVal = source[key];
    const tVal = target[key];
    if (Array.isArray(sVal)) {
      target[key] = sVal.slice(); // array: override penuh (bukan gabung)
    } else if (sVal && typeof sVal === 'object') {
      target[key] = (tVal && typeof tVal === 'object' && !Array.isArray(tVal))
        ? deepMerge({ ...tVal }, sVal)
        : deepMerge({}, sVal);
    } else if (sVal !== undefined) {
      target[key] = sVal;
    }
  }
  return target;
}

export function throttle(fn, waitMs) {
  let last = 0;
  let timer = null;
  return function throttled(...args) {
    const now = Date.now();
    const remaining = waitMs - (now - last);
    if (remaining <= 0) {
      last = now;
      fn.apply(this, args);
    } else if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        last = Date.now();
        fn.apply(this, args);
      }, remaining);
    }
  };
}

export function clampMs(value, fallback) {
  return (Number.isFinite(value) && value > 0) ? value : fallback;
}

/** Format durasi: 272000 -> "4 menit 32 detik" */
export function formatDuration(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  const parts = [];
  if (m > 0) parts.push(`${m} menit`);
  if (s > 0 || parts.length === 0) parts.push(`${s} detik`);
  return parts.join(' ');
}

// ------------------------------------------------------------
// Overlay notifikasi keamanan (tanpa CSS eksternal)
// ------------------------------------------------------------

/**
 * Tampilkan overlay peringatan keamanan di atas semua elemen.
 * @param {string} message
 * @param {object} opts { title, countdown=false, actionLabel, onAction, tone: 'warn'|'danger'|'info' }
 * @returns {{ close: Function, setMessage: Function, setCountdown: Function }}
 */
export function showSecurityOverlay(message, opts = {}) {
  if (!isBrowser()) return { close() {}, setMessage() {}, setCountdown() {} };

  const tone = opts.tone || 'warn';
  const colors = {
    warn: { bg: '#fff8e1', border: '#f5a623', accent: '#8a5a00' },
    danger: { bg: '#fdecea', border: '#d93025', accent: '#8a1a12' },
    info: { bg: '#e8f0fe', border: '#1a73e8', accent: '#0b47a1' },
  }[tone];

  const wrap = document.createElement('div');
  wrap.setAttribute('role', 'alertdialog');
  wrap.setAttribute('aria-modal', 'true');
  wrap.setAttribute('data-security-overlay', 'true');
  wrap.style.cssText = [
    'position:fixed', 'top:20px', 'left:50%', 'transform:translateX(-50%)',
    'z-index:2147483647', 'max-width:480px', 'width:calc(100% - 32px)',
    'background:' + colors.bg, `border:2px solid ${colors.border}`,
    'border-radius:10px', 'padding:18px 20px', 'font-family:system-ui,sans-serif',
    'box-shadow:0 8px 30px rgba(0,0,0,.25)', 'text-align:center',
  ].join(';');

  const title = document.createElement('div');
  title.textContent = opts.title || 'Pemberitahuan Keamanan';
  title.style.cssText = `font-weight:700;color:${colors.accent};margin-bottom:8px;font-size:15px;`;

  const msg = document.createElement('div');
  msg.textContent = message; // textContent = aman dari XSS
  msg.style.cssText = 'font-size:14px;color:#333;line-height:1.5;';

  wrap.appendChild(title);
  wrap.appendChild(msg);

  if (opts.actionLabel && typeof opts.onAction === 'function') {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = opts.actionLabel;
    btn.style.cssText = [
      'margin-top:14px', 'padding:10px 22px', 'border:none', 'border-radius:6px',
      'background:' + colors.border, 'color:#fff', 'font-size:14px',
      'font-weight:600', 'cursor:pointer',
    ].join(';');
    btn.addEventListener('click', () => opts.onAction());
    wrap.appendChild(btn);
  }

  document.body.appendChild(wrap);

  return {
    close() { try { wrap.remove(); } catch { /* noop */ } },
    setMessage(text) { msg.textContent = text; },
    setCountdown(seconds) {
      msg.textContent = String(seconds);
    },
  };
}
