/**
 * ============================================================
 * SECURITY MODULE - config.js
 * ============================================================
 * SATU-SATUNYA sumber konfigurasi untuk seluruh modul keamanan.
 *
 * Semua fitur AKTIF secara default (secure-by-default).
 * Cara mengubah nilai:
 *   1. Edit langsung file ini, ATAU
 *   2. Kirim override saat inisialisasi:
 *        initSecurity({ INACTIVITY_TIMEOUT: 10 * 60 * 1000 })
 *
 * PENTING: Modul TIDAK memiliki konfigurasi tersembunyi.
 * Semua yang dapat dikontrol ada di file ini.
 * ============================================================
 */

import { deepMerge } from './utils.js';

export const SECURITY_VERSION = '1.0.0';

export const DEFAULT_CONFIG = {

  // ----------------------------------------------------------
  // MASTER SWITCH - satu saklar untuk seluruh modul keamanan
  // ----------------------------------------------------------
  SECURITY_ENABLED: true,

  // ----------------------------------------------------------
  // [FITUR 1] AUTO LOGOUT - 15 menit tanpa aktivitas
  // ----------------------------------------------------------
  INACTIVITY_TIMEOUT: 15 * 60 * 1000,    // 15 menit tanpa aktivitas -> auto logout
  WARNING_BEFORE_LOGOUT: 2 * 60 * 1000,  // notifikasi peringatan muncul 2 menit sebelum logout (1-2 menit sesuai spesifikasi)
  REDIRECT_DELAY: 1500,                  // jeda (ms) sebelum redirect ke halaman login agar pesan sempat terlihat

  // ----------------------------------------------------------
  // [FITUR 2] LOGIN PROTECTION - 3x gagal -> blokir sementara
  // ----------------------------------------------------------
  MAX_LOGIN_ATTEMPTS: 3,                 // jumlah percobaan gagal sebelum diblokir
  LOGIN_COOLDOWN: 5 * 60 * 1000,         // durasi blokir SEMENTARA (5 menit). WAJIB berhingga - tidak ada blokir permanen.
  ATTEMPT_WINDOW: 15 * 60 * 1000,        // jendela waktu penghitungan percobaan gagal

  // ----------------------------------------------------------
  // [FITUR 3] SESSION SECURITY
  // ----------------------------------------------------------
  SESSION_DURATION: 60 * 60 * 1000,      // masa berlaku absolut sesi (1 jam)
  SESSION_ROTATION_INTERVAL: 30 * 60 * 1000, // rotasi sessionId minimal tiap 30 menit
  SERVER: {
    // Endpoint opsional di backend Anda (jika diisi, modul akan memakainya).
    // Biarkan null jika backend belum terintegrasi - modul tetap berjalan.
    heartbeatEndpoint: null,  // contoh: '/security/heartbeat'  (cek sesi masih valid / belum dicabut)
    logoutEndpoint: null,     // contoh: '/security/logout'     (hancurkan sesi di server)
    auditEndpoint: null,      // contoh: '/security/audit'      (kirim log audit batch ke server)
    heartbeatInterval: 30 * 1000, // interval cek heartbeat ke server (ms)
  },

  // ----------------------------------------------------------
  // [FITUR 4 & 5] TAB PROTECTION & SINGLE SESSION
  // ----------------------------------------------------------
  SINGLE_SESSION_MODE: true,             // login baru mengakhiri sesi lama (mode satu sesi)
  ALLOW_MULTIPLE_SESSIONS: false,        // false = perangkat/browser lain otomatis dicabut sesinya
  HEARTBEAT_INTERVAL: 10 * 1000,         // interval detak antar-tab di browser yang sama (ms)

  // ----------------------------------------------------------
  // [FITUR 6] ACCESS CONTROL - pelindung halaman
  // ----------------------------------------------------------
  PROTECTED_ROUTES: ['/dashboard', '/admin'], // path yang wajib punya sesi valid
  ADMIN_ROUTES: ['/admin'],                   // path khusus role 'admin'
  LOGIN_PAGE: '/login.html',                  // tujuan redirect saat sesi tidak valid

  // ----------------------------------------------------------
  // [FITUR 7] XSS PROTECTION
  // ----------------------------------------------------------
  XSS: {
    enabled: true,
    warnOnDangerousAPI: false,           // true = console.warn setiap ada kode yang memakai innerHTML/document.write (mode audit dev)
    allowedTags: [                       // tag yang diizinkan sanitizer bawaan (fallback jika DOMPurify tidak ada)
      'a', 'b', 'strong', 'i', 'em', 'u', 'br', 'p', 'span', 'div',
      'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'table', 'thead', 'tbody', 'tr', 'td', 'th', 'blockquote', 'code', 'pre',
    ],
    allowedAttrs: ['href', 'title', 'alt', 'class', 'target', 'rel'],
  },

  // ----------------------------------------------------------
  // [FITUR 8] CSRF PROTECTION (double-submit cookie)
  // Hanya relevan jika autentikasi berbasis cookie.
  // ----------------------------------------------------------
  CSRF: {
    enabled: true,
    cookieName: 'sec_csrf',
    headerName: 'X-CSRF-Token',
    protectedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  },

  // ----------------------------------------------------------
  // [FITUR 9] SECURITY HEADERS (client: meta CSP terbatas;
  // header asli wajib dipasang di server - lihat README)
  // ----------------------------------------------------------
  HEADERS: {
    enabled: true,
    injectMetaCSP: false,                // default false: CSP via <meta> lebih lemah & bisa merusak aplikasi; pasang di server.
    csp: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
  },

  // ----------------------------------------------------------
  // [FITUR 10] AUDIT LOG
  // ----------------------------------------------------------
  AUDIT: {
    enabled: true,
    ttlMs: 7 * 24 * 60 * 60 * 1000,      // entri cache lokal kedaluwarsa setelah 7 hari
    maxEntries: 500,                     // batas entri di penyimpanan lokal (ring buffer)
    endpoint: null,                      // sama dengan SERVER.auditEndpoint (bisa diisi salah satu)
    flushIntervalMs: 30 * 1000,          // kirim batch tiap 30 detik jika endpoint diisi
    batchSize: 20,                       // atau langsung kirim saat antrean penuh
    consoleMirror: false,                // true = tampilkan juga di console (mode dev)
  },

  // ----------------------------------------------------------
  // PESAN PENGGUNA (Bahasa Indonesia)
  // ----------------------------------------------------------
  MESSAGES: {
    SESSION_TIMEOUT: 'Sesi Anda telah berakhir karena tidak ada aktivitas selama {minutes} menit. Silakan login kembali.',
    SESSION_WARNING: 'Sesi Anda akan berakhir dalam {seconds} detik karena tidak ada aktivitas. Klik "Tetap Masuk" untuk melanjutkan.',
    SESSION_REVOKED: 'Sesi Anda diakhiri karena akun ini digunakan untuk login dari perangkat atau browser lain.',
    SESSION_EXPIRED: 'Sesi Anda telah berakhir. Silakan login kembali.',
    LOGIN_BLOCKED: 'Terlalu banyak percobaan login gagal. Silakan coba lagi dalam {time}.',
    LOGGED_OUT: 'Anda telah keluar dengan aman.',
    ACCESS_FORBIDDEN: 'Anda tidak memiliki izin untuk mengakses halaman ini.',
  },
};

/**
 * Gabungkan konfigurasi default dengan override pengguna,
 * lalu validasi & kunci (freeze) hasilnya.
 * @param {object} userConfig - override parsial, mis. { INACTIVITY_TIMEOUT: 300000 }
 * @returns {object} konfigurasi final (frozen)
 */
export function configure(userConfig = {}) {
  const base = JSON.parse(JSON.stringify(DEFAULT_CONFIG)); // deep clone
  const cfg = deepMerge(base, userConfig);

  // ---- Validasi pencegahan konfigurasi berbahaya ----
  // Peringatan harus lebih pendek dari timeout itu sendiri.
  if (cfg.WARNING_BEFORE_LOGOUT >= cfg.INACTIVITY_TIMEOUT) {
    cfg.WARNING_BEFORE_LOGOUT = Math.max(60 * 1000, Math.floor(cfg.INACTIVITY_TIMEOUT / 3));
  }
  if (cfg.WARNING_BEFORE_LOGOUT < 15 * 1000) {
    cfg.WARNING_BEFORE_LOGOUT = 15 * 1000; // minimal 15 detik agar manusia sempat membaca
  }

  // Batas login tidak boleh 0/negatif, dan cooldown WAJIB berhingga
  // (prinsip: hanya blokir sementara, tidak pernah permanen).
  if (!Number.isFinite(cfg.MAX_LOGIN_ATTEMPTS) || cfg.MAX_LOGIN_ATTEMPTS < 1) {
    cfg.MAX_LOGIN_ATTEMPTS = 3;
  }
  if (!Number.isFinite(cfg.LOGIN_COOLDOWN) || cfg.LOGIN_COOLDOWN <= 0) {
    cfg.LOGIN_COOLDOWN = 5 * 60 * 1000;
  }
  if (!Number.isFinite(cfg.SESSION_DURATION) || cfg.SESSION_DURATION < 5 * 60 * 1000) {
    cfg.SESSION_DURATION = 60 * 60 * 1000;
  }
  if (!Array.isArray(cfg.PROTECTED_ROUTES)) cfg.PROTECTED_ROUTES = DEFAULT_CONFIG.PROTECTED_ROUTES.slice();
  if (!Array.isArray(cfg.ADMIN_ROUTES)) cfg.ADMIN_ROUTES = DEFAULT_CONFIG.ADMIN_ROUTES.slice();
  if (!cfg.LOGIN_PAGE) cfg.LOGIN_PAGE = '/login.html';

  // Sinkronkan endpoint audit ganda
  if (!cfg.AUDIT.endpoint && cfg.SERVER.auditEndpoint) {
    cfg.AUDIT.endpoint = cfg.SERVER.auditEndpoint;
  }

  return Object.freeze(cfg);
}
