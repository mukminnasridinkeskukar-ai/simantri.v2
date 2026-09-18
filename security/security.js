/* ============================================================================
 * /security/security.js — ENTRY POINT TUNGGAL SECURITY MODULE
 * ----------------------------------------------------------------------------
 * Aplikasi hanya perlu SATU baris (di <head> setiap halaman, paling awal):
 *
 *     <script src="/security/security.js" defer></script>
 *
 * File ini yang:
 *  1. Menemukan lokasi folder /security/ secara otomatis (dari src sendiri)
 *  2. Memuat seluruh modul secara BERURUTAN (config -> utils -> modul-modul)
 *  3. Membaca halaman ini public/protected lalu menjalankan modul yang perlu
 *  4. Menyediakan API global: window.AppSecurity
 *
 * Idempotent: dipanggil dua kali (double include) tidak akan dobel inisialisasi.
 * Semua inisialisasi dibungkus try/catch — kegagalan satu modul tidak
 * menghentikan modul lain, dan tidak pernah merusak aplikasi existing.
 * ==========================================================================*/
(function (global) {
  'use strict';

  var NS = global.AppSecurity = global.AppSecurity || {};
  if (NS.__booted) { return; }            // cegah double-init

  var VERSION = '1.0.0';

  /* ------------------- Tentukan BASE folder /security/ ------------------- */
  function detectBase() {
    try {
      var script = document.currentScript;
      if (!script) {
        var scripts = document.getElementsByTagName('script');
        for (var i = scripts.length - 1; i >= 0; i--) {
          if (scripts[i].src && scripts[i].src.indexOf('security.js') !== -1) { script = scripts[i]; break; }
        }
      }
      if (script && script.src) {
        return script.src.slice(0, script.src.lastIndexOf('/'));
      }
    } catch (e) { /* noop */ }
    return '/security';                    // fallback lokasi standar
  }
  var BASE = detectBase();

  /* ------------------------- Urutan pemuatan ------------------------------ */
  // config & utils WAJIB lebih dulu; sisanya mengikuti dependensi.
  var LOAD_ORDER = [
    'config.js',
    'utils.js',
    'audit-log.js',
    'browser-session.js',
    'xss.js',
    'csrf.js',
    'session.js',
    'tab-protection.js',
    'auto-logout.js',
    'login-protection.js',
    'access-control.js',
    'security-headers.js'
  ];

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var el = document.createElement('script');
      el.src = src;
      el.async = false;
      el.onload = function () { resolve(); };
      el.onerror = function () { reject(new Error('gagal memuat ' + src)); };
      (document.head || document.documentElement).appendChild(el);
    });
  }

  function loadAll() {
    var chain = Promise.resolve();
    LOAD_ORDER.forEach(function (file) {
      chain = chain.then(function () { return loadScript(BASE + '/' + file); });
    });
    return chain;
  }

  /* ------------------------------ Booting -------------------------------- */
  function boot() {
    var CFG = global.SECURITY_CONFIG || {};
    var U = NS.utils || {};
    var log = NS.log || function () {};
    var warn = NS.warn || function () {};

    NS.__booted = true;
    NS.version = VERSION;
    NS.config = CFG;      // API publik: baca konfigurasi efektif (read-only disarankan)

    if (CFG.SECURITY_ENABLED === false) {
      log('SECURITY_ENABLED=false — security module dimatikan sepenuhnya');
      return;
    }

    // 1) Pasang interceptor SEKALI sebelum modul lain mendaftarkan hook
    try { NS.Interceptors && NS.Interceptors.install(); } catch (e) { warn('interceptor gagal:', e); }

    // 2) Modul yang berjalan di SEMUA halaman (public maupun protected)
    var always = [
      ['AuditLog', 'init'], ['BrowserSession', 'init'], ['XSS', 'init'],
      ['CSRF', 'init'], ['SecurityHeaders', 'init'], ['LoginProtection', 'init']
    ];
    // 3) Modul tambahan untuk halaman protected (butuh session)
    var protectedOnly = [
      ['Session', 'init'], ['TabProtection', 'init'],
      ['AutoLogout', 'init'], ['AccessControl', 'init']
    ];
    var isProtected = U.isProtectedPage ? U.isProtectedPage() : false;
    var plan = always.concat(isProtected ? protectedOnly : []);

    plan.forEach(function (pair) {
      var mod = NS[pair[0]];
      if (mod && typeof mod[pair[1]] === 'function') {
        try { mod[pair[1]](); }
        catch (e) { warn('modul ' + pair[0] + ' gagal init (dilewati, aplikasi tetap jalan):', e && e.message); }
      }
    });

    // 4) Tampilkan notifikasi yang menunggu di halaman tujuan (mis. login)
    try {
      U.onReady(function () {
        try {
          var notice = U.storage.sessionGet(CFG.NOTICE_KEY || 'security_notice');
          if (notice) {
            U.storage.sessionRemove(CFG.NOTICE_KEY || 'security_notice');
            U.toast(notice, 'warn', 9000);
          }
        } catch (e) { /* noop */ }
      });
    } catch (e) { warn('notice gagal:', e && e.message); }

    log('security module v' + VERSION + ' aktif (' + (isProtected ? 'protected' : 'public') + ' page)');
  }

  /* --------------------------- API publik -------------------------------- */
  // Semua yang mungkin dibutuhkan aplikasi existing tersedia di sini.
  NS.initSecurity = boot;
  NS.logout = function (reason) {
    NS.Session && NS.Session.logout({ reason: reason || 'user' });
  };
  NS.recheckRoute = function () {
    // Untuk SPA (React/Vue): panggil setiap pergantian route
    NS.AccessControl && NS.AccessControl.recheckRoute();
  };
  NS.audit = function (event, details, severity) {
    NS.AuditLog && NS.AuditLog.audit(event, details, severity);
  };

  /* ------------------------------- Mulai ---------------------------------- */
  var start = function () {
    loadAll().then(boot).catch(function (err) {
      // Kegagalan memuat modul TIDAK BOLEH merusak aplikasi.
      try { (NS.warn || console.warn)('security module gagal dimuat:', err && err.message); }
      catch (e) { /* noop */ }
    });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})(window);
