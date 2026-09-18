/**
 * ============================================================
 * SECURITY MODULE - tab-protection.js
 * ============================================================
 * FITUR 4: Proteksi tab.
 *
 * PRINSIP PENTING (sesuai spesifikasi):
 * - Membuka TAB BARU dalam sesi yang sama = NORMAL, TIDAK
 *   menyebabkan logout. Tab baru mengklaim tiket sesi global
 *   (localStorage) ke sessionStorage miliknya sendiri.
 * - "Sesi ilegal" adalah saat sesi global sudah DIGANTI oleh
 *   login lain (tiket tidak cocok) -> tab lama dicabut.
 *   Deteksi ini dilakukan oleh browser-session.js; modul ini
 *   menangani identitas per-tab & komunikasi antar-tab.
 *
 * Komunikasi antar-tab memakai BroadcastChannel (fallback:
 * event storage otomatis dari localStorage).
 * ============================================================
 */

import {
  KEYS, SECURITY_EVENTS, on, isBrowser,
} from './utils.js';
import {
  claimSessionForTab, getActiveSession, endSession, isSessionValid,
} from './session.js';

let config = null;
let channel = null;
let bound = false;

const CHANNEL_NAME = 'sec_bus';

export function initTabProtection(cfg) {
  if (!isBrowser() || bound) return;
  bound = true;
  config = cfg;

  // 1) Klaim sesi untuk tab ini (aman untuk tab baru yang sah)
  claimSessionForTab();

  // 2) Komunikasi antar-tab (jika browser mendukung)
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (ev) => handleChannelMessage(ev.data || {});
    } catch {
      channel = null; // fallback: storage event tetap bekerja
    }
  }

  // 3) Saat tab ini logout, beri tahu tab lain dalam sesi yang sama.
  //    PENTING: revoke EKSTERNAL (tab dicabut karena login baru) TIDAK
  //    menyiarkan logout — storage event sudah menjangkau tab saudara,
  //    dan menyiarkan sessionId milik login baru akan salah sasaran.
  on(SECURITY_EVENTS.LOGOUT, (payload) => {
    if (payload && payload.ownedGlobal === false) return;
    broadcast({ type: 'logout', sessionId: payload?.sessionId, reason: payload?.reason });
  });

  // 4) Jika halaman di-refresh, sessionStorage bertahan -> tab tetap sah.
  //    Jika sessionStorage hilang (tab benar-benar baru), klaim ulang.
  window.addEventListener('pageshow', () => {
    if (isSessionValid()) claimSessionForTab();
  });
}

/** Kirim pesan ke tab-tab lain dalam sesi yang sama. */
export function broadcast(message) {
  if (channel) {
    try { channel.postMessage(message); } catch { /* noop */ }
  }
  // Tanpa BroadcastChannel: penghapusan/penulisan localStorage
  // otomatis memicu event 'storage' di tab lain (ditangani
  // browser-session.js), sehingga fallback tetap aman.
}

/** Tangani pesan dari tab lain. */
function handleChannelMessage(msg) {
  if (msg.type === 'logout') {
    const session = getActiveSession();
    // Hanya cabut jika pesan merujuk sesi yang sedang kita pakai
    if (session && msg.sessionId && session.sessionId === msg.sessionId) {
      endSession(msg.reason || 'LOGOUT');
    }
  }
  // 'ping' / 'heartbeat' tidak perlu tindakan - kehadiran tab lain
  // tidak pernah menjadi alasan logout.
}
