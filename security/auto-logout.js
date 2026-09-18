/**
 * ============================================================
 * SECURITY MODULE - auto-logout.js
 * ============================================================
 * FITUR 1: Logout otomatis setelah 15 menit tanpa aktivitas.
 * - Aktivitas: klik, ketikan, gerak mouse (di-throttle), scroll,
 *   sentuhan. Aktivitas APAPUN mengatur ulang timer.
 * - 2 menit (default) sebelum logout: tampil peringatan dengan
 *   hitungan mundur + tombol "Tetap Masuk".
 * - Saat logout: sesi dihapus, kredensial lokal dibersihkan,
 *   dicatat di audit, pengguna diarahkan ke halaman login
 *   dengan pesan sesuai spesifikasi.
 * ============================================================
 */

import {
  SECURITY_EVENTS, on, emit, isBrowser, throttle, showSecurityOverlay,
} from './utils.js';
import {
  isSessionValid, endSession,
} from './session.js';

let config = null;
let inactivityTimer = null;   // timer menuju auto logout
let warningTimer = null;      // timer menuju peringatan
let countdownInterval = null; // hitungan mundur di overlay peringatan
let lastActivity = Date.now();
let paused = false;
let overlay = null;           // overlay peringatan aktif
let bound = false;

/** Event yang dianggap "aktivitas pengguna". */
const ACTIVITY_EVENTS = [
  'click', 'keydown', 'mousedown', 'pointerdown',
  'touchstart', 'scroll', 'pointermove', 'wheel',
];

export function initAutoLogout(cfg) {
  if (!isBrowser()) return;
  if (bound) return; // idempoten
  bound = true;
  config = cfg;

  bindActivityListeners();

  // Mulai timer begitu sesi ada; berhenti saat sesi berakhir.
  on(SECURITY_EVENTS.SESSION_CREATED, () => resetInactivityTimer());
  on(SECURITY_EVENTS.LOGOUT, () => stopAllTimers());

  // Jika halaman dimuat saat sesi sudah ada (refresh), mulai sekarang.
  if (isSessionValid()) resetInactivityTimer();

  // Tab berpindah ke belakang: jangan hitung sebagai aktivitas,
  // biarkan timer jalan sesuai waktu nyata.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isSessionValid() && !paused) {
      // Saat kembali, perbarui UI jika sedang peringatan
      if (overlay) {
        // biarkan countdown berjalan; tidak ada reset otomatis
      }
    }
  });
}

/** Pasang listener aktivitas (sekali saja, dengan throttle). */
function bindActivityListeners() {
  const handler = throttle(() => resetInactivityTimer(), 2000);
  for (const evt of ACTIVITY_EVENTS) {
    window.addEventListener(evt, handler, { passive: true, capture: true });
  }
}

/**
 * Atur ulang timer tidak-aktif (dipanggil oleh aktivitas pengguna
 * atau oleh aplikasi melalui API publik).
 */
export function resetInactivityTimer() {
  if (!config || paused || !isSessionValid()) return;
  lastActivity = Date.now();
  clearTimers();

  const timeout = config.INACTIVITY_TIMEOUT;
  const warnAt = timeout - config.WARNING_BEFORE_LOGOUT;

  warningTimer = setTimeout(showWarning, warnAt);
  inactivityTimer = setTimeout(() => doAutoLogout(), timeout);
}

/** Sisa waktu (ms) sebelum auto logout (tanpa aktivitas baru). */
export function getRemainingMs() {
  return Math.max(0, config.INACTIVITY_TIMEOUT - (Date.now() - lastActivity));
}

/** Hentikan sementara (mis. pengguna sedang mengisi formulir panjang). */
export function pauseAutoLogout() {
  paused = true;
  clearTimers();
}

/** Lanjutkan penghitungan dari awal. */
export function resumeAutoLogout() {
  paused = false;
  resetInactivityTimer();
}

// ------------------------------------------------------------ internal ----

function showWarning() {
  if (!isSessionValid() || overlay) return;
  emit(SECURITY_EVENTS.AUTOLOGOUT_WARNING, {});

  const total = Math.ceil(config.WARNING_BEFORE_LOGOUT / 1000);
  let remaining = total;

  overlay = showSecurityOverlay(
    config.MESSAGES.SESSION_WARNING.replace('{seconds}', String(remaining)),
    {
      title: 'Sesi Segera Berakhir',
      tone: 'warn',
      actionLabel: 'Tetap Masuk',
      onAction: () => stayLoggedIn(),
    },
  );

  countdownInterval = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      doAutoLogout();
      return;
    }
    if (overlay) {
      overlay.setMessage(config.MESSAGES.SESSION_WARNING.replace('{seconds}', String(remaining)));
    }
  }, 1000);
}

function stayLoggedIn() {
  clearTimers();
  if (overlay) { overlay.close(); overlay = null; }
  resetInactivityTimer(); // aktivitas baru: hitung ulang dari 0
}

function doAutoLogout() {
  clearTimers();
  if (overlay) { overlay.close(); overlay = null; }
  emit(SECURITY_EVENTS.AUTOLOGOUT_TRIGGER, {});
  // endSession menangani: hapus sesi, audit AUTO_LOGOUT,
  // notifikasi pesan spesifikasi, lalu redirect ke halaman login.
  endSession('AUTO_LOGOUT');
}

function clearTimers() {
  if (inactivityTimer) { clearTimeout(inactivityTimer); inactivityTimer = null; }
  if (warningTimer) { clearTimeout(warningTimer); warningTimer = null; }
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
}

function stopAllTimers() {
  clearTimers();
  if (overlay) { overlay.close(); overlay = null; }
}
