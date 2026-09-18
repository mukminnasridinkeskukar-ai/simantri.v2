/* ============================================================================
 * /security/login-protection.js — PROTEKSI SALAH PASSWORD (3x -> blokir)
 * ----------------------------------------------------------------------------
 * Aturan (default):
 *   Percobaan 1 gagal -> dicatat
 *   Percobaan 2 gagal -> dicatat
 *   Percobaan 3 gagal -> BLOKIR SEMENTARA (cooldown LOGIN_COOLDOWN_MINUTES)
 * Blokir berulang -> cooldown digandakan (eskalasi, maks 30 menit).
 * TIDAK ADA permanent lock — pemulihan otomatis lewat waktu.
 *
 * ⚠ BATASAN PENTING (jujur sesuai spesifikasi #5):
 *   Penghitungan di frontend HANYA lapisan UX — bisa dilewati pihak yang
 *   membuka DevTools. PENEGAKAN SEBENARNYA WAJIB DI SERVER:
 *   gunakan loginGuard dari /security/server/security-server.js atau
 *   rate limiting bawaan backend Anda.
 *
 * CARA DETEKSI (tanpa mengubah kode aplikasi):
 *   - Modul memantau respons fetch/XHR menuju LOGIN_ENDPOINT.
 *     Status dalam LOGIN_FAIL_STATUS (400/401/403/429) -> gagal.
 *     Status 2xx -> sukses (counter di-reset).
 *   - Saat terblokir, submit form login dicegah (preventDefault) dan
 *     pesan sisa waktu ditampilkan.
 *   - Untuk alur login kustom, panggil manual:
 *       AppSecurity.LoginProtection.recordFailure();
 *       AppSecurity.LoginProtection.recordSuccess();
 * ==========================================================================*/
(function (global) {
  'use strict';

  var NS = global.AppSecurity = global.AppSecurity || {};
  var CFG = global.SECURITY_CONFIG || {};
  var U = NS.utils || {};
  var log = NS.log || function () {};
  var audit = function (ev, det, sev) { return NS.audit && NS.audit(ev, det, sev); };

  var LS_KEY = 'security_login_state';
  var state = { count: 0, blockedUntil: 0, escalations: 0 };
  var formsHooked = [];
  var countdownTimer = null;

  /* ------------------------------ State ---------------------------------- */
  function load() {
    var saved = U.storage ? U.storage.getJson(LS_KEY, null) : null;
    if (saved && typeof saved === 'object') { state = saved; }
  }
  function save() { U.storage && U.storage.setJson(LS_KEY, state); }

  function isBlocked() {
    return !!state.blockedUntil && Date.now() < state.blockedUntil;
  }
  function remainingMs() {
    return isBlocked() ? Math.max(0, state.blockedUntil - Date.now()) : 0;
  }

  function cooldownMs() {
    var base = Math.max(1, Number(CFG.LOGIN_COOLDOWN_MINUTES) || 5) * 60000;
    if (CFG.LOGIN_COOLDOWN_ESCALATION === false) { return base; }
    var factor = Math.pow(2, Math.max(0, state.escalations || 0));
    var maxMs = (Number(CFG.LOGIN_COOLDOWN_MAX_MINUTES) || 30) * 60000;
    return Math.min(base * factor, maxMs);
  }

  function formatRemaining(ms) {
    var totalSec = Math.ceil(ms / 1000);
    var m = Math.floor(totalSec / 60);
    var s = totalSec % 60;
    if (m > 0) { return m + ' menit ' + s + ' detik'; }
    return s + ' detik';
  }

  /* --------------------------- Catat hasil login -------------------------- */
  function recordFailure() {
    if (isBlocked()) { return; }
    state.count = (state.count || 0) + 1;
    log('login gagal ke-', state.count);
    audit(NS.AuditLog ? NS.AuditLog.EVENTS.LOGIN_FAILED : 'LOGIN_FAILED',
      { attempts: state.count }, state.count >= (Number(CFG.MAX_LOGIN_ATTEMPTS) || 3) ? 'warn' : 'info');

    if (state.count >= (Number(CFG.MAX_LOGIN_ATTEMPTS) || 3)) {
      if (CFG.LOGIN_COOLDOWN !== false) {
        state.blockedUntil = Date.now() + cooldownMs();
        state.escalations = (state.escalations || 0) + 1;
        audit(NS.AuditLog ? NS.AuditLog.EVENTS.LOGIN_BLOCKED : 'LOGIN_BLOCKED',
          { cooldownMinutes: Math.round(cooldownMs() / 60000) }, 'warn');
        showMessage('Terlalu banyak percobaan login gagal. Coba lagi dalam ' +
          formatRemaining(remainingMs()) + '.');
        startCountdown();
      }
      state.count = 0;                     // hitung ulang setelah masa blokir
    }
    save();
  }

  function recordSuccess() {
    state = { count: 0, blockedUntil: 0, escalations: 0 };
    save();
    stopCountdown();
    clearMessage();
    audit(NS.AuditLog ? NS.AuditLog.EVENTS.LOGIN_SUCCESS : 'LOGIN_SUCCESS', {}, 'info');
  }

  /* ------------------------------ UI pesan -------------------------------- */
  function showMessage(text) {
    U.toast && U.toast(text, 'error', 10000);
    // Sisipkan juga pesan inline di atas form login (bila ada)
    try {
      var form = formsHooked[0] || document.querySelector('form');
      if (!form) { return; }
      var box = document.getElementById('security-login-msg');
      if (!box) {
        box = document.createElement('div');
        box.id = 'security-login-msg';
        box.style.cssText = 'margin:0 0 10px;padding:10px 14px;border-radius:8px;font-size:13px;' +
          'background:#fdecea;color:#8f1d14;border:1px solid #f5c6c0;';
        form.parentNode && form.parentNode.insertBefore(box, form);
      }
      box.textContent = text;
    } catch (e) { /* noop */ }
  }
  function clearMessage() {
    try {
      var box = document.getElementById('security-login-msg');
      if (box && box.parentNode) { box.parentNode.removeChild(box); }
    } catch (e) { /* noop */ }
  }
  function startCountdown() {
    stopCountdown();
    countdownTimer = setInterval(function () {
      if (!isBlocked()) {
        state.blockedUntil = 0;
        save();
        stopCountdown();
        clearMessage();
        return;
      }
      showMessage('Terlalu banyak percobaan login gagal. Coba lagi dalam ' +
        formatRemaining(remainingMs()) + '.');
    }, 15000);
  }
  function stopCountdown() {
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
  }

  /* --------------------------- Intersepsi submit -------------------------- */
  function looksLikeLoginForm(form) {
    try {
      return !!(form && form.querySelector && form.querySelector('input[type="password"]'));
    } catch (e) { return false; }
  }

  function onSubmitCapture(e) {
    try {
      var form = e.target;
      if (!form || form.nodeName !== 'FORM' || !looksLikeLoginForm(form)) { return; }
      hookForm(form);
      if (isBlocked()) {
        e.preventDefault();
        e.stopPropagation();
        showMessage('Terlalu banyak percobaan login gagal. Coba lagi dalam ' +
          formatRemaining(remainingMs()) + '.');
        audit(NS.AuditLog ? NS.AuditLog.EVENTS.LOGIN_BLOCKED : 'LOGIN_BLOCKED',
          { stage: 'submit-blocked' }, 'warn');
      }
    } catch (err) { log('submit guard error:', err && err.message); }
  }

  function hookForm(form) {
    if (formsHooked.indexOf(form) !== -1) { return; }
    formsHooked.push(form);
    log('form login terdeteksi & diawasi');
  }

  /* --------------------- Pengamat respons endpoint login ------------------ */
  function installResponseWatcher() {
    if (!U.Interceptors) { return; }
    var loginPath = CFG.LOGIN_ENDPOINT ? (U.normalizeUrl ? U.normalizeUrl(CFG.LOGIN_ENDPOINT) : CFG.LOGIN_ENDPOINT) : '';
    U.Interceptors.addResponseHook(function (ctx) {
      try {
        if (!ctx.isSameOrigin || !loginPath) { return; }
        var path = U.normalizeUrl ? U.normalizeUrl(ctx.rawUrl || ctx.url) : ctx.url;
        if (!path || path.indexOf(loginPath) !== 0) { return; }
        var status = ctx.status;
        if (status >= 200 && status < 300) { recordSuccess(); return; }
        if ((CFG.LOGIN_FAIL_STATUS || [400, 401, 403, 429]).indexOf(status) !== -1) {
          recordFailure();
          if (status === 429) {
            // Server sedang menegakkan blokir — selaraskan hitungan lokal
            state.count = Number(CFG.MAX_LOGIN_ATTEMPTS) || 3;
            if (!isBlocked()) {
              state.blockedUntil = Date.now() + cooldownMs();
              save();
              startCountdown();
              showMessage('Terlalu banyak percobaan login. Silakan coba lagi nanti.');
            }
          }
        }
      } catch (e) { log('login watcher error:', e && e.message); }
    });
  }

  /* -------------------------------- Init ---------------------------------- */
  function init() {
    if (CFG.LOGIN_PROTECTION_ENABLED === false) { log('login-protection nonaktif (config)'); return; }
    load();
    // Pulihkan status blokir yang masih berlaku
    if (isBlocked()) { startCountdown(); }
    installResponseWatcher();
    try {
      document.addEventListener('submit', onSubmitCapture, true); // capture — sebelum handler aplikasi
    } catch (e) { /* noop */ }
    log('login-protection siap (maks ' + (Number(CFG.MAX_LOGIN_ATTEMPTS) || 3) + ' percobaan)');
  }

  NS.LoginProtection = {
    init: init,
    recordFailure: recordFailure,
    recordSuccess: recordSuccess,
    isBlocked: isBlocked,
    remainingMs: remainingMs,
    attachForm: hookForm,
    // Reset manual (khusus operasional/admin via server, bukan backdoor)
    resetState: function () { state = { count: 0, blockedUntil: 0, escalations: 0 }; save(); }
  };
})(window);
