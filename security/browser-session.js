/* ============================================================================
 * /security/browser-session.js — BROWSER / DEVICE SESSION
 * ----------------------------------------------------------------------------
 * Membedakan "tab baru dalam session yang sama" vs "session baru yang tidak
 * sah" — dengan bantuan ID perangkat + keputusan SERVER (server adalah hakim).
 *
 * PERILAKU (sesuai konfigurasi):
 *  - ALLOW_MULTIPLE_SESSIONS = false  -> login baru di perangkat lain BOLEH
 *    menyebabkan session lama dicabut server. Browser lama akan menerima
 *    status 409 dari endpoint validasi -> ditampilkan pesan ramah dan
 *    diarahkan ke login. Browser baru TIDAK dianggap serangan.
 *  - ALLOW_MULTIPLE_SESSIONS = true   -> session boleh berjalan paralel
 *    sesuai batasan yang ditegakkan server.
 *
 * ID perangkat adalah nilai acak lokal (BUKAN fingerprint invasif), dikirim
 * sebagai header X-Device-Id pada request login & validasi agar backend
 * dapat mengikat session ke perangkat. Jangan jadikan satu-satunya dasar
 * keputusan keamanan — gunakan bersama cookie session di server.
 * ==========================================================================*/
(function (global) {
  'use strict';

  var NS = global.AppSecurity = global.AppSecurity || {};
  var CFG = global.SECURITY_CONFIG || {};
  var U = NS.utils || {};
  var log = NS.log || function () {};

  var DEVICE_KEY = CFG.DEVICE_ID_STORAGE_KEY || 'security_device_id';

  function getDeviceId() {
    var id = U.storage ? U.storage.get(DEVICE_KEY) : null;
    if (!id) {
      id = 'dev-' + (U.randomId ? U.randomId(16) : String(Date.now()));
      U.storage && U.storage.set(DEVICE_KEY, id);
    }
    return id;
  }

  /* --------------- Header X-Device-Id untuk login & validasi -------------- */
  function installRequestHook() {
    if (!U.Interceptors || CFG.SEND_DEVICE_ID_HEADER === false) { return; }
    var interesting = [];
    try {
      if (CFG.LOGIN_ENDPOINT) { interesting.push(U.normalizeUrl(CFG.LOGIN_ENDPOINT)); }
      if (CFG.SESSION_VALIDATE_ENDPOINT) { interesting.push(U.normalizeUrl(CFG.SESSION_VALIDATE_ENDPOINT)); }
      if (CFG.SESSION_LOGOUT_ENDPOINT) { interesting.push(U.normalizeUrl(CFG.SESSION_LOGOUT_ENDPOINT)); }
    } catch (e) { /* noop */ }

    U.Interceptors.addRequestHook(function (ctx) {
      try {
        if (!ctx.isSameOrigin) { return; }
        var path = U.normalizeUrl ? U.normalizeUrl(ctx.url) : ctx.url;
        for (var i = 0; i < interesting.length; i++) {
          if (path && path.indexOf(interesting[i]) === 0) {
            ctx.setHeader(CFG.DEVICE_ID_HEADER || 'X-Device-Id', getDeviceId());
            return;
          }
        }
      } catch (e) { log('device hook error:', e && e.message); }
    });
  }

  function init() {
    getDeviceId();                      // pastikan ID ada sejak awal
    installRequestHook();
    log('browser-session siap (multi-session: ' + (CFG.ALLOW_MULTIPLE_SESSIONS ? 'diizinkan' : 'tidak') + ')');
  }

  NS.BrowserSession = {
    init: init,
    getDeviceId: getDeviceId
  };
})(window);
