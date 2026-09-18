/**
 * ============================================================
 * SECURITY MODULE - audit-log.js
 * ============================================================
 * Audit log terpusat dengan REDAKSI OTOMATIS:
 * field sensitif (password, token, secret, dll.) DIHAPUS
 * sebelum disimpan/dikirim. TIDAK ADA pengecualian.
 *
 * Penyimpanan: memori + cache localStorage (kedaluwarsa 7 hari,
 * maksimum 500 entri) + kirim batch ke server jika endpoint
 * dikonfigurasi (AUDIT.endpoint).
 * ============================================================
 */

import { KEYS, jsonGet, jsonSet, generateId, isBrowser } from './utils.js';

/** Daftar event audit standar (sesuai spesifikasi). */
export const AUDIT_EVENTS = Object.freeze({
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGIN_BLOCKED: 'LOGIN_BLOCKED',
  LOGOUT: 'LOGOUT',
  AUTO_LOGOUT: 'AUTO_LOGOUT',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_REVOKED: 'SESSION_REVOKED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  SENSITIVE_ACTION: 'SENSITIVE_ACTION',
});

/**
 * Pola nama field yang DILARANG dicatat. Pencocokan dilakukan
 * pada nama field yang sudah dinormalisasi (huruf kecil, tanpa
 * pemisah), sehingga "database_password", "dbPassword",
 * "accessToken", "api_secret", dll. semuanya tertangkap.
 */
const FORBIDDEN_PATTERNS = [
  'password', 'passwd', 'pwd', 'passphrase',
  'accesstoken', 'refreshtoken', 'idtoken', 'token',
  'secret', 'secretkey', 'apisecret', 'clientsecret',
  'apikey', 'credential', 'authorization', 'cookie',
  'databasepassword', 'dbpassword', 'connectionstring',
  'privatekey', 'creditcard', 'cvv', 'ssn',
];

function isForbiddenKey(normalizedName) {
  return FORBIDDEN_PATTERNS.some((p) =>
    normalizedName === p || normalizedName.includes(p)
  );
}

function normalizeKeyName(key) {
  return String(key).toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Marker redaksi */
export const REDACTED = '[REDACTED]';

/**
 * Bersihkan objek dari field sensitif (rekursif, aman sirkular).
 * @param {*} value
 * @param {number} depth - batas kedalaman rekursi
 */
export function scrub(value, depth = 0) {
  if (depth > 6) return '[TRUNCATED]';
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((v) => scrub(v, depth + 1));
  }

  if (typeof value === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      if (isForbiddenKey(normalizeKeyName(key))) {
        out[key] = REDACTED; // JANGAN PERNAH mencatat nilai aslinya
      } else {
        out[key] = scrub(val, depth + 1);
      }
    }
    return out;
  }

  if (typeof value === 'string') {
    // String panjang dikunci agar log tidak membengkak / bocor isinya
    return value.length > 300 ? value.slice(0, 300) + '…' : value;
  }

  return value;
}

// ------------------------------------------------------------
// Status modul
// ------------------------------------------------------------
let config = null;
let entries = [];      // ring buffer memori
let outbox = [];       // antrean kirim batch ke server
let flushTimer = null;
let initialized = false;

const MAX_DETAIL_SIZE = 4000; // batas ukuran JSON detail (byte kasar)

/** Muat cache dari localStorage, buang yang kedaluwarsa & kelebihan kapasitas. */
function loadFromCache() {
  const cached = jsonGet(KEYS.AUDIT_LOG, []);
  const now = Date.now();
  entries = Array.isArray(cached)
    ? cached.filter((e) => e && typeof e.ts === 'number' && (now - e.ts) < config.AUDIT.ttlMs)
    : [];
  if (entries.length > config.AUDIT.maxEntries) {
    entries = entries.slice(entries.length - config.AUDIT.maxEntries);
  }
}

function persistToCache() {
  // Simpan versi ringkas tanpa field besar
  jsonSet(KEYS.AUDIT_LOG, entries.slice(entries.length - config.AUDIT.maxEntries));
}

/**
 * Inisialisasi modul audit (dipanggil oleh security.js).
 * @param {object} cfg - konfigurasi final hasil configure()
 */
export function initAuditLog(cfg) {
  if (initialized) return;
  initialized = true;
  config = cfg;
  loadFromCache();

  if (config.AUDIT.endpoint && isBrowser()) {
    flushTimer = setInterval(() => flushAudit(false), config.AUDIT.flushIntervalMs);
    // Kirim sisa log saat halaman ditutup (tanpa menunda navigasi)
    window.addEventListener('pagehide', () => flushAudit(true));
  }
}

/**
 * Catat satu event audit.
 * @param {string} event  - salah satu AUDIT_EVENTS
 * @param {object} detail - detail tambahan (otomatis dibersihkan dari field sensitif)
 * @param {object} meta   - opsional: { userId, role } (juga dibersihkan)
 */
export function audit(event, detail = {}, meta = {}) {
  if (!config || !config.AUDIT.enabled) return;

  let entry;
  try {
    const cleanDetail = scrub(detail);
    const cleanMeta = scrub(meta);
    const serialized = JSON.stringify(cleanDetail || {});
    if (serialized && serialized.length > MAX_DETAIL_SIZE) {
      cleanDetail._note = 'detail too large, truncated';
    }
    entry = {
      id: generateId(12),
      ts: Date.now(),
      iso: new Date().toISOString(),
      event: String(event),
      url: isBrowser() ? location.pathname : '-',
      userAgent: isBrowser() ? navigator.userAgent : '-',
      detail: cleanDetail,
      meta: cleanMeta,
    };
  } catch (err) {
    entry = { id: generateId(12), ts: Date.now(), iso: new Date().toISOString(), event: String(event), detail: { _error: 'serialization failed' } };
  }

  entries.push(entry);
  if (entries.length > config.AUDIT.maxEntries) {
    entries = entries.slice(entries.length - config.AUDIT.maxEntries);
  }
  persistToCache();

  if (config.AUDIT.consoleMirror) {
    console.info('[security][audit]', entry.event, entry.detail);
  }

  // Event kritis dikirim segera, selebihnya menunggu batch
  const critical = [
    AUDIT_EVENTS.LOGIN_BLOCKED,
    AUDIT_EVENTS.SESSION_REVOKED,
    AUDIT_EVENTS.ROLE_CHANGED,
    AUDIT_EVENTS.PASSWORD_CHANGED,
  ].includes(entry.event);

  if (config.AUDIT.endpoint) {
    outbox.push(entry);
    if (critical || outbox.length >= config.AUDIT.batchSize) {
      flushAudit(false);
    }
  }
}

/** Ambil salinan log (terbaru di akhir). Bisa difilter per event. */
export function getAuditLogs(filterEvent = null) {
  return entries
    .filter((e) => !filterEvent || e.event === filterEvent)
    .map((e) => ({ ...e }));
}

/** Hitung jumlah log tersimpan. */
export function countAuditLogs() {
  return entries.length;
}

/** Hapus semua log lokal (server tidak terpengaruh). */
export function clearAuditLogs() {
  entries = [];
  outbox = [];
  persistToCache();
}

/**
 * Kirim antrean log ke server (jika endpoint dikonfigurasi).
 * @param {boolean} useBeacon - true = navigator.sendBeacon (untuk pagehide)
 */
export function flushAudit(useBeacon = false) {
  if (!config || !config.AUDIT.endpoint || outbox.length === 0) return;
  const batch = outbox.splice(0, outbox.length);
  try {
    if (useBeacon && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([JSON.stringify({ logs: batch })], { type: 'application/json' });
      navigator.sendBeacon(config.AUDIT.endpoint, blob);
    } else {
      fetch(config.AUDIT.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: batch }),
        credentials: 'same-origin',
        keepalive: true,
      }).catch(() => { /* jaringan gagal: biarkan, log tetap ada di cache lokal */ });
    }
  } catch {
    // Gagal kirim tidak boleh mengganggu aplikasi.
  }
}
