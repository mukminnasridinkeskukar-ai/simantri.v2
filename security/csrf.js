/* ============================================================================
 * /security/csrf.js — PROTEKSI CSRF
 * ----------------------------------------------------------------------------
 * Aktif relevan untuk AUTENTIKASI BERBASIS COOKIE. Bila AUTH_MODE = 'jwt'
 * (token dikirim via header Authorization), risiko CSRF jauh lebih rendah
 * dan modul ini otomatis nonaktif agar tidak bertentangan dengan sistem
 * autentikasi existing.
 *
 * CARA KERJA (frontend):
 *  1. Token diambil berurutan dari:
 *     a. <meta name="csrf-token" content="...">  (bila aplikasi meletakkannya)
 *     b. Cookie CSRF_COOKIE_NAME (pola double-submit cookie)
 *     c. GET CSRF_TOKEN_ENDPOINT -> JSON { token: "..." }
 *  2. Semua request state-changing (CSRF_METHODS) SAME-ORIGIN otomatis
 *     diberi header CSRF_HEADER_NAME.
 *
 * KOMPATIBILITAS:
 *  - Header TIDAK ditambahkan bila aplikasi sudah mengirim header dengan
 *    nama yang sama (tidak menimpa mekanisme CSRF existing).
 *  - CSRF_EXCLUDE_PATHS dapat membebaskan path tertentu.
 *  - Verifikasi token dilakukan di SERVER (lihat /security/server/).
 * ==========================================================================*/
(function (global) {
  'use strict';

  var NS = global.AppSecurity = global.AppSecurity || {};
  var CFG = global.SECURITY_CONFIG || {};
  var U = NS.utils || {};
  var log = NS.log || function () {};

  var token = '';
  var fetchAttempted = false;

  function readMetaTag() {
    try {
      var meta = document.querySelector('meta[name="csrf-token"]');
      return meta ? (meta.getAttribute('content') || '') : '';
    } catch (e) { return ''; }
  }

  function readCookie(name) {
    try {
      var parts = String(document.cookie || '').split(';');
      for (var i = 0; i < parts.length; i++) {
        var kv = parts[i].trim();
        var eq = kv.indexOf('=');
        if (eq === -1) { continue; }
        if (kv.slice(0, eq) === name) { return decodeURIComponent(kv.slice(eq + 1)); }
      }
    } catch (e) { /* noop */ }
    return '';
  }

  function fetchFromEndpoint() {
    if (fetchAttempted || !CFG.CSRF_TOKEN_ENDPOINT || !U.netFetch) { return Promise.resolve(''); }
    fetchAttempted = true;
    return U.netFetch(CFG.CSRF_TOKEN_ENDPOINT, { method: 'GET' })
      .then(function (resp) {
        if (!resp || !resp.ok) { return ''; }
        return resp.json();
      })
      .then(function (data) {
        var t = (data && (data.token || data.csrfToken || data.csrf)) || '';
        if (t) { setToken(t); }
        return t;
      })
      .catch(function () { return ''; });
  }

  function getToken() { return token; }

  function setToken(t) {
    token = String(t || '');
    if (token) { log('CSRF token diperbarui'); }
  }

  // Panggil ulang bila server melakukan rotasi token (mis. setelah login).
  function refreshToken() {
    fetchAttempted = false;
    return fetchFromEndpoint();
  }

  function isExcluded(path) {
    return U.matchesPath ? U.matchesPath(path, CFG.CSRF_EXCLUDE_PATHS || []) : false;
  }

  /* ------------------------- Hook request global ------------------------- */
  function installRequestHook() {
    if (!U.Interceptors) { return; }
    U.Interceptors.addRequestHook(function (ctx) {
      try {
        if (!token) { return; }                                    // belum ada token
        if (CFG.CSRF_METHODS.indexOf(ctx.method) === -1) { return; }
        if (!ctx.isSameOrigin) { return; }
        if (isExcluded(U.normalizeUrl ? U.normalizeUrl(ctx.url) : ctx.url)) { return; }
        ctx.setHeader(CFG.CSRF_HEADER_NAME, token);                 // tidak menimpa header aplikasi
      } catch (e) { log('csrf hook error:', e && e.message); }
    });
  }

  /* ------------------------------- Init ---------------------------------- */
  function init() {
    if (CFG.CSRF_PROTECTION === false) { log('CSRF nonaktif (config)'); return; }
    if (CFG.AUTH_MODE === 'jwt') {
      log('AUTH_MODE=jwt — CSRF dinonaktifkan (bearer token tidak rentan CSRF)');
      return;
    }
    // 1) meta tag  2) cookie double-submit
    var t = readMetaTag() || readCookie(CFG.CSRF_COOKIE_NAME);
    if (t) { setToken(t); }
    else { fetchFromEndpoint(); }
    installRequestHook();
    log('csrf siap');
  }

  NS.CSRF = {
    init: init,
    getToken: getToken,
    setToken: setToken,
    refreshToken: refreshToken
  };
})(window);
