/* ============================================================================
 * /security/security-headers.js — SECURITY HEADERS (lapisan browser)
 * ----------------------------------------------------------------------------
 * ⚠ FAKTA TEKNIS: header HTTP (CSP, HSTS, X-Frame-Options, dst.) HANYA bisa
 * diset lewat SERVER/hosting. JavaScript tidak dapat menyetel header respons
 * untuk halaman itu sendiri. File ini adalah LAPISAN TAMBAHAN:
 *
 *  1. FRAMEBUST        — keluar dari iframe (mitigasi clickjacking) bila
 *                        halaman disematkan oleh situs lain.
 *  2. META_CSP         — bila diisi di config, sisipkan <meta http-equiv=
 *                        "Content-Security-Policy">. CATATAN: meta CSP
 *                        terbatas (tanpa frame-ancestors, tanpa report-uri)
 *                        dan diterapkan terlambat bila script dimuat defer.
 *                        Default KOSONG supaya aplikasi existing tidak rusak.
 *
 * Header sebenarnya dikonfigurasi di server — lihat:
 *   /security/server/security-server.js  (Express: securityHeaders middleware)
 *   README bagian 9 (checklist wajib server + snippet Nginx/Apache)
 * ==========================================================================*/
(function (global) {
  'use strict';

  var NS = global.AppSecurity = global.AppSecurity || {};
  var CFG = global.SECURITY_CONFIG || {};
  var log = NS.log || function () {};

  /* ------------------------------- Framebust ------------------------------ */
  function installFramebust() {
    try {
      if (global.self !== global.top) {
        // Halaman sedang di-frame oleh halaman lain.
        try {
          global.top.location = global.self.location;   // keluar dari frame
        } catch (e) {
          // Cross-origin top tidak bisa dinavigasi (mis. sandbox) —
          // kosongkan halaman sebagai pengaman terakhir.
          try { document.documentElement.style.display = 'none'; } catch (e2) { /* noop */ }
        }
      }
    } catch (e) { /* noop */ }
  }

  /* ------------------------------- Meta CSP ------------------------------- */
  function installMetaCsp() {
    if (!CFG.META_CSP) { return; }                     // kosong = jangan sentuh
    try {
      var existing = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (existing) { return; }                        // aplikasi sudah punya CSP — hormati
      if (!document.head) { return; }
      var meta = document.createElement('meta');
      meta.setAttribute('http-equiv', 'Content-Security-Policy');
      meta.setAttribute('content', CFG.META_CSP);
      document.head.insertBefore(meta, document.head.firstChild);
      log('meta CSP dipasang');
    } catch (e) { log('meta CSP gagal:', e && e.message); }
  }

  /* ------------------------- Checklist (debug/audit) ---------------------- */
  // Bukan pengukur header aktual — daftar bantu untuk audit konfigurasi server.
  function report() {
    return {
      note: 'Header HTTP sebenarnya harus diset di server (lihat README bagian 9).',
      recommended: {
        'Content-Security-Policy': "default-src 'self'; ... (uji dulu sebelum produksi)",
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        'X-Frame-Options': 'SAMEORIGIN (atau gunakan CSP frame-ancestors)'
      },
      moduleLayer: {
        framebust: CFG.FRAMEBUST !== false,
        metaCsp: CFG.META_CSP || '(tidak di-set — diset lewat server)'
      }
    };
  }

  function init() {
    if (CFG.SECURITY_HEADERS === false) { log('security-headers nonaktif (config)'); return; }
    if (CFG.FRAMEBUST !== false) { installFramebust(); }
    installMetaCsp();
    log('security-headers (lapisan browser) siap');
  }

  NS.SecurityHeaders = {
    init: init,
    report: report
  };
})(window);
