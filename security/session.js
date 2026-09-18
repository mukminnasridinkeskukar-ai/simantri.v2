/**
 * ============================================================
 * SECURITY MODULE - session.js
 * ============================================================
 * FITUR 3: Keamanan sesi.
 * - createSession(): catat sesi baru setelah login berhasil
 * - isSessionValid() / getActiveSession(): validasi kedaluwarsa
 * - rotateSession(): rotasi sessionId & ticket berkala
 * - endSession(): logout aman (hapus kredensial lokal, audit,
 *   broadcast ke tab lain, lapor server, redirect ke login)
 *
 * Kredensial yang disimpan di browser HANYA berupa metadata
 * sesi (sessionId, ticket, userId, role, waktu) - BUKAN
 * password, BUKAN token server. Token akses milik aplikasi
 * tidak pernah disentuh modul ini.
 *
 * KEJUJURAN ARSITEKTUR:
 * - Validasi struktur & kedaluwarsa di sini bersifat lokal.
 * - Verifikasi keaslian sesi WAJIB di server (JWT/cookie
 *   diverifikasi backend). Gunakan SERVER.heartbeatEndpoint
 *   agar client mengecek sesi ke server secara berkala.
 * ============================================================
 */

import {
  KEYS, SECURITY_EVENTS, on, emit, isBrowser, generateId,
  jsonGet, jsonSet, jsonRemove,
  showSecurityOverlay,
} from './utils.js';
import { audit, AUDIT_EVENTS } from './audit-log.js';
import { clearLoginAttempts } from './login-protection.js';

let config = null;
let serverVerifyTimer = null;

/** Alasan akhir sesi -> event audit */
const REASON_TO_AUDIT = Object.freeze({
  LOGOUT: AUDIT_EVENTS.LOGOUT,
  AUTO_LOGOUT: AUDIT_EVENTS.AUTO_LOGOUT,
  SESSION_EXPIRED: AUDIT_EVENTS.SESSION_EXPIRED,
  SESSION_REVOKED: AUDIT_EVENTS.SESSION_REVOKED,
});

/** Pesan overlay per alasan */
const REASON_TO_MESSAGE = Object.freeze({
  LOGOUT: 'LOGGED_OUT',
  AUTO_LOGOUT: 'SESSION_TIMEOUT',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_REVOKED: 'SESSION_REVOKED',
});

export function initSessionSecurity(cfg) {
  if (config) return; // idempoten
  config = cfg;
  startServerVerificationIfConfigured();
}

// ------------------------------------------------------------
// Membuat & membaca sesi
// ------------------------------------------------------------

/**
 * Catat sesi baru SETELAH autentikasi berhasil di server.
 * @param {object} data - { userId, role } (opsional)
 * @returns {object} rekaman sesi
 */
export function createSession(data = {}) {
  if (!isBrowser()) return null;

  // "Login terbaru menang": naikkan versi sesi global.
  // Tab/perangkat lain yang memakai versi lebih lama akan
  // mendeteksi ketidakcocokan dan mencabut sesinya sendiri.
  const prevVersion = parseInt(localStorage.getItem(KEYS.SESSION_VERSION) || '0', 10) || 0;
  const version = prevVersion + 1;

  const now = Date.now();
  const session = {
    sessionId: generateId(24),
    ticket: generateId(32),
    userId: data.userId || null,
    role: data.role || 'user',
    loginAt: now,
    expiresAt: now + (config ? config.SESSION_DURATION : 60 * 60 * 1000),
    version,
    createdOn: location.hostname,
  };

  localStorage.setItem(KEYS.SESSION_VERSION, String(version));
  jsonSet(KEYS.SESSION, session);
  // Tiket per-tab: tab ini sah. Tab BARU nanti boleh mengklaim
  // sesi yang sama (bukan dianggap serangan) - lihat tab-protection.js
  // PENTING: simpan tiket sebagai STRING MENTAH (bukan JSON) agar
  // perbandingan dengan sessionStorage.getItem() selalu konsisten.
  sessionStorage.setItem(KEYS.TAB_TICKET, session.ticket);

  clearLoginAttempts(); // login sukses -> reset penghitung gagal
  audit(AUDIT_EVENTS.LOGIN_SUCCESS, { role: session.role }, { userId: session.userId });
  emit(SECURITY_EVENTS.SESSION_CREATED, { ...session });
  return session;
}

/** Ambil sesi aktif (tanpa memvalidasi kedaluwarsa). */
export function getActiveSession() {
  if (!isBrowser()) return null;
  const s = jsonGet(KEYS.SESSION);
  if (!s || typeof s !== 'object' || !s.sessionId) return null;
  return s;
}

/** Struktur sesi sah? (validasi lokal, bukan pengganti verifikasi server) */
export function verifySessionStructure(s) {
  return !!s
    && typeof s.sessionId === 'string' && s.sessionId.length >= 16
    && typeof s.ticket === 'string' && s.ticket.length >= 16
    && Number.isFinite(s.expiresAt)
    && Number.isFinite(s.version);
}

/** Sesi aktif dan belum kedaluwarsa? */
export function isSessionValid() {
  const s = getActiveSession();
  if (!s || !verifySessionStructure(s)) return false;
  return Date.now() < s.expiresAt;
}

/** Sisa masa berlaku sesi (ms). */
export function getSessionRemainingMs() {
  const s = getActiveSession();
  return s ? Math.max(0, s.expiresAt - Date.now()) : 0;
}

// ------------------------------------------------------------
// Klaim tiket per-tab (FITUR 4 - bagian 1)
// ------------------------------------------------------------

/**
 * Klaim sesi untuk tab ini.
 * - Tab baru (sessionStorage kosong) pada sesi yang masih sah
 *   -> BOLEH klaim (membuka tab baru BUKAN serangan).
 * - Sesi tidak ada / kedaluwarsa -> tidak ada yang bisa diklaim.
 * @returns {boolean} true jika tab ini kini memiliki sesi sah
 */
export function claimSessionForTab() {
  if (!isBrowser()) return false;
  const session = getActiveSession();
  if (!session || !isSessionValid()) return false;

  const myTicket = sessionStorage.getItem(KEYS.TAB_TICKET);
  if (myTicket === session.ticket) return true;   // tab ini sudah sah
  if (myTicket && myTicket !== session.ticket) {
    // Tiket tab tidak cocok dengan sesi global saat ini:
    // sesi sudah diganti login yang lebih baru -> tab ini dicabut.
    endSession('SESSION_REVOKED');
    return false;
  }
  // Tab baru yang sah: klaim tiket sesi global (string mentah, bukan JSON)
  sessionStorage.setItem(KEYS.TAB_TICKET, session.ticket);
  return true;
}

// ------------------------------------------------------------
// Rotasi sesi
// ------------------------------------------------------------

/**
 * Rotasi sessionId & ticket (mempertahankan identitas & expiry).
 * Dipanggil berkala oleh initSessionSecurity. Rotasi ID sesi
 * yang SEBENARNYA (cookie/JWT baru) harus dilakukan server.
 * @param {boolean} force - paksa rotasi walau belum waktunya
 */
export function rotateSession(force = false) {
  const s = getActiveSession();
  if (!s || !isSessionValid()) return false;

  const interval = config ? config.SESSION_ROTATION_INTERVAL : 30 * 60 * 1000;
  const age = Date.now() - (s.lastRotatedAt || s.loginAt);
  if (!force && age < interval) return false;

  s.sessionId = generateId(24); // rotasi ID sesi
  // CATATAN: ticket SENGAJA tidak diubah — tiket adalah "identitas keluarga
  // sesi" agar tab-tab lain dalam sesi yang sama tidak tercabut oleh rotasi.
  // Login BARU selalu membuat tiket baru (itulah pembedanya).
  s.lastRotatedAt = Date.now();
  jsonSet(KEYS.SESSION, s);

  audit(AUDIT_EVENTS.SENSITIVE_ACTION, { action: 'SESSION_ROTATED' }, { userId: s.userId });
  emit(SECURITY_EVENTS.SESSION_ROTATED, { sessionId: s.sessionId });
  return true;
}

// ------------------------------------------------------------
// Mengakhiri sesi (logout manual / otomatis / dicabut)
// ------------------------------------------------------------

/**
 * Akhiri sesi dengan aman.
 * @param {'LOGOUT'|'AUTO_LOGOUT'|'SESSION_EXPIRED'|'SESSION_REVOKED'} reason
 * @param {object} opts - { notify: boolean=true, redirect: boolean=true }
 */
export function endSession(reason = 'LOGOUT', opts = {}) {
  if (!isBrowser()) return;

  const session = getActiveSession();
  const myTicket = sessionStorage.getItem(KEYS.TAB_TICKET);

  // 1) Hapus jejak kredensial lokal.
    // Rekaman sesi global dihapus HANYA jika sesi itu milik tab ini.
  // Saat tab ini dicabut KARENA login baru menggantikan (SESSION_REVOKED),
  // rekaman global adalah milik login baru — TIDAK boleh dihapus,
  // agar tab yang melakukan login baru tetap sah.
  if (!session || (myTicket && session.ticket === myTicket)) {
    jsonRemove(KEYS.SESSION);
  }
  // Tiket tab ini selalu dihapus (identitas per-tab milik kita).
  sessionStorage.removeItem(KEYS.TAB_TICKET);
  // Apakah tab ini pemilik rekaman sesi global?
  // - Ya  -> logout bersama: rekaman dihapus & saudara se-session ikut diakhiri.
  // - Tidak -> tab ini HANYA dicabut karena login baru menggantikan;
  //   rekaman global (milik login baru) tidak disentuh dan TIDAK
  //   boleh menyiarkan "logout" atas nama sesi milik orang lain.
  const ownedGlobal = !session || !!(myTicket && session.ticket === myTicket);
  const mySessionId = session ? session.sessionId : null;

  // 2) Audit (SEBELUM emit, agar listener yang melakukan navigasi tetap aman)
  const auditEvent = REASON_TO_AUDIT[reason] || AUDIT_EVENTS.LOGOUT;
  audit(auditEvent, { reason }, { userId: session ? session.userId : null });

  // 3) Beri tahu tab lain. Untuk revoke eksternal (bukan pemilik rekaman
  //    global), broadcast tidak diperlukan — storage event sudah
  //    menjangkau tab-tab saudara yang memegang sesi lama.
  emit(SECURITY_EVENTS.LOGOUT, { reason, sessionId: mySessionId, ownedGlobal });

  // 4) Laporkan ke server (opsional, tidak menunggu jawaban)
  const logoutEndpoint = config?.SERVER?.logoutEndpoint;
  if (ownedGlobal && logoutEndpoint && typeof navigator.sendBeacon === 'function') {
    try {
      const blob = new Blob([JSON.stringify({ reason, sessionId: mySessionId })], { type: 'application/json' });
      navigator.sendBeacon(logoutEndpoint, blob);
    } catch { /* noop */ }
  }

  // 5) Notifikasi + redirect ke halaman login
  const notify = opts.notify !== false;
  const redirect = opts.redirect !== false;
  const messageKey = REASON_TO_MESSAGE[reason] || 'LOGGED_OUT';
  const message = (config?.MESSAGES?.[messageKey] || config?.MESSAGES?.LOGGED_OUT || 'Anda telah keluar.');

  if (notify) {
    const tone = reason === 'SESSION_REVOKED' || reason === 'SESSION_EXPIRED' ? 'danger' : 'info';
    showSecurityOverlay(message, {
      title: 'Keamanan Sesi',
      tone,
    });
  }

  if (redirect && config) {
    const delay = opts.redirectDelay !== undefined ? opts.redirectDelay : config.REDIRECT_DELAY;
    setTimeout(() => {
      try {
        const url = new URL(config.LOGIN_PAGE, location.origin);
        url.searchParams.set('reason', reason.toLowerCase());
        window.location.assign(url.toString());
      } catch {
        window.location.assign(config.LOGIN_PAGE);
      }
    }, delay);
  }
}

// ------------------------------------------------------------
// Verifikasi sesi ke server (opsional namun disarankan)
// ------------------------------------------------------------

/**
 * Jika SERVER.heartbeatEndpoint diisi, client bertanya ke server
 * secara berkala: "apakah sesi ini masih sah?" Server menjawab
 * { valid: false, reason: 'SESSION_REVOKED' } jika login lebih
 * baru telah menggantikan sesi ini (single session lintas
 * perangkat yang SEBENARNYA).
 */
function startServerVerificationIfConfigured() {
  if (serverVerifyTimer) return;
  const endpoint = config?.SERVER?.heartbeatEndpoint;
  if (!endpoint) return; // belum terintegrasi backend -> lewati diam-diam

  serverVerifyTimer = setInterval(async () => {
    const s = getActiveSession();
    if (!s || !isSessionValid()) return;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ sessionId: s.sessionId, userId: s.userId }),
      });
      if (!res.ok) return; // server bermasalah: JANGAN logout karena error jaringan
      const data = await res.json().catch(() => null);
      if (data && data.valid === false) {
        endSession(data.reason === 'SESSION_EXPIRED' ? 'SESSION_EXPIRED' : 'SESSION_REVOKED');
      }
    } catch { /* offline: abaikan */ }
  }, config.SERVER.heartbeatInterval || 30 * 1000);
}
