/**
 * ============================================================
 * SECURITY MODULE - browser-session.js
 * ============================================================
 * FITUR 5: Kebijakan sesi per browser/perangkat.
 *
 * SINGLE_SESSION_MODE = true, ALLOW_MULTIPLE_SESSIONS = false:
 * - Login BARU (tab mana pun / browser mana pun pada akun yang
 *   sama secara logika) menggantikan sesi lama -> tab yang
 *   memegang sesi LAMA dicabut (SESSION_REVOKED).
 * - Browser berbeda memiliki storage terpisah: penegakan
 *   lintas-perangkat yang SEBENARNYA memerlukan server
 *   (SERVER.heartbeatEndpoint + server/security-server.js).
 *
 * GARIS BATAS yang dijamin modul ini:
 * - Tab BARU pada sesi yang sama TIDAK PERnah di-logout
 *   (sessionId sama -> diabaikan).
 * ============================================================
 */

import {
  KEYS, SECURITY_EVENTS, on, isBrowser, jsonGet,
} from './utils.js';
import {
  getActiveSession, isSessionValid, endSession,
} from './session.js';

let config = null;
let bound = false;
let watchTimer = null;

export function initBrowserSession(cfg) {
  if (!isBrowser() || bound) return;
  bound = true;
  config = cfg;

  // 1) Reaksi cepat: perubahan localStorage di tab lain
  window.addEventListener('storage', handleStorageChange);

  // 2) Jaring pengaman: pemeriksaan berkala (event storage
  //    kadang tidak terkirim di beberapa skenario)
  watchTimer = setInterval(periodicCheck, config.HEARTBEAT_INTERVAL || 10 * 1000);

  // 3) Sesi kedaluwarsa berdasarkan waktu juga dicek berkala
  on(SECURITY_EVENTS.SESSION_CREATED, () => periodicCheck());
}

/**
 * Handler event 'storage': dipicu di tab LAIN saat key berubah.
 */
function handleStorageChange(ev) {
  if (ev.key !== KEYS.SESSION) return;

  const oldSession = safeParse(ev.oldValue);
  const newSession = safeParse(ev.newValue);

  // Kasus A: sesi dihapus di tab lain (logout manual)
  if (!ev.newValue) {
    if (oldSession && isThisOurSession(oldSession)) {
      endSessionWithoutDoubleAudit('LOGOUT');
    }
    return;
  }

  // Kasus B: rekaman sesi DIGANTI.
  // Keputusan memakai TIKET (bukan sessionId):
  // - tiket SAMA   = sesi "keluarga" yang sama (mis. rotasi sessionId)
  //                  -> tab saudara TIDAK di-logout.
  // - tiket BEDA   = login BARU menggantikan sesi lama
  //                  -> tab yang memegang tiket lama dicabut.
  const myTicket = sessionStorage.getItem(KEYS.TAB_TICKET);
  if (
    config.SINGLE_SESSION_MODE &&
    !config.ALLOW_MULTIPLE_SESSIONS &&
    myTicket &&
    newSession &&
    newSession.ticket &&
    newSession.ticket !== myTicket
  ) {
    endSessionWithoutDoubleAudit('SESSION_REVOKED');
  }
  // Kasus C: tiket sama (sesi sama) -> BUKAN alasan logout.
  // Tab baru dalam sesi sama tidak pernah terdampak.
}

/** Pemeriksaan berkala di tab ini. */
function periodicCheck() {
  const session = getActiveSession();

  // Sesi ada tapi sudah kedaluwarsa -> akhiri
  if (session && !isSessionValid()) {
    endSession('SESSION_EXPIRED');
    return;
  }

  // Tidak ada sesi & tidak ada yang perlu dilakukan
  if (!session) return;

  // Tiket tab tidak cocok dengan sesi global -> sesi diganti login baru
  const myTicket = sessionStorage.getItem(KEYS.TAB_TICKET);
  if (myTicket && myTicket !== session.ticket) {
    if (config.SINGLE_SESSION_MODE && !config.ALLOW_MULTIPLE_SESSIONS) {
      endSessionWithoutDoubleAudit('SESSION_REVOKED');
    }
  }
}

// ---- internal ----

function isThisOurSession(oldSession) {
  // Event storage hanya relevan jika tab ini sempat memakai sesi itu
  const current = getActiveSession();
  return !!current && current.sessionId === oldSession.sessionId;
}

function endSessionWithoutDoubleAudit(reason) {
  // endSession() menghapus localStorage (sudah kosong) dan tetap
  // mencatat audit + menampilkan notifikasi. Itulah yang kita mau:
  // tab pasif ikut diarahkan ke login dengan pesan yang benar.
  endSession(reason);
}

function safeParse(raw) {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
