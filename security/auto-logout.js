/* ============================================================================
 * /security/auto-logout.js — AUTO LOGOUT KETIDAKTIFAN (default 15 menit)
 * ----------------------------------------------------------------------------
 * Alur sesuai spesifikasi, ketika pengguna tidak beraktivitas selama
 * INACTIVITY_TIMEOUT_MINUTES (default 15):
 *   1. Session divalidasi (ke server)
 *   2. Session diinvalidasi sesuai mekanisme backend (endpoint logout)
 *   3. Credential/token yang aman dihapus dibersihkan
 *   4. User di-logout
 *   5. User diarahkan ke halaman login
 *   6. Notifikasi ditampilkan:
 *      "Sesi Anda telah berakhir karena tidak ada aktivitas selama 15 menit.
 *       Silakan login kembali."
 *
 * Peringatan (overlay dengan hitung mundur) muncul WARNING_BEFORE_MINUTES
 * (default 2 menit) sebelum logout, dengan tombol [Tetap Masuk] dan
 * [Logout Sekarang].
 *
 * LINTAS TAB: deadline disimpan bersama (localStorage) dan aktivitas di tab
 * mana pun me-reset timer di semua tab (via BroadcastChannel).
 * ==========================================================================*/
(function (global) {
  'use strict';

  var NS = global.AppSecurity = global.AppSecurity || {};
  var CFG = global.SECURITY_CONFIG || {};
  var U = NS.utils || {};
  var log = NS.log || function () {};

  var fullMs = Math.max(1, Number(CFG.INACTIVITY_TIMEOUT_MINUTES) || 15) * 60000;
  var warnMs = Math.min(fullMs - 5000, Math.max(0, Number(CFG.WARNING_BEFORE_MINUTES) || 0) * 60000);
  var ticking = null;
  var warningShown = false;
  var overlayEl = null;
  var countdownEl = null;
  var loggingOut = false;

  /* --------------------------- Deadline bersama --------------------------- */
  function readDeadline() {
    var raw = U.storage ? U.storage.get(CFG.AL_DEADLINE_KEY || 'security_al_deadline') : null;
    var n = raw ? parseInt(raw, 10) : NaN;
    return isNaN(n) ? 0 : n;
  }
  var writeDeadline = U.throttle ? U.throttle(function (deadline) {
    U.storage && U.storage.set(CFG.AL_DEADLINE_KEY || 'security_al_deadline', String(deadline));
  }, 800) : function (d) { U.storage && U.storage.set(CFG.AL_DEADLINE_KEY, String(d)); };

  function resetTimer(silent) {
    var deadline = Date.now() + fullMs;
    writeDeadline(deadline);
    hideWarning();
    if (!silent) { log('auto-logout timer di-reset'); }
  }

  /* ------------------------------ Aktivitas ------------------------------- */
  var onActivityThrottled = U.throttle ? U.throttle(function () {
    // Reset deadline hanya bila ada tab yang masih berstatus "aktif session"
    var deadline = readDeadline();
    var remaining = deadline - Date.now();
    if (remaining < fullMs - 1500 || deadline === 0) {
      resetTimer(true);
      if (NS.TabProtection) { NS.TabProtection.broadcastActivity(); }
    }
  }, 1000) : function () {};

  function installActivityListeners() {
    var opts = { capture: true, passive: true };
    var events = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    for (var i = 0; i < events.length; i++) {
      try { document.addEventListener(events[i], onActivityThrottled, opts); } catch (e) { /* noop */ }
    }
    // pointermove & scroll sangat sering — throttle lebih longgar
    var slow = U.throttle ? U.throttle(onActivityThrottled, 10000) : onActivityThrottled;
    try {
      document.addEventListener('pointermove', slow, opts);
      document.addEventListener('scroll', slow, opts);
    } catch (e) { /* noop */ }
  }

  /* ------------------------------ Peringatan ------------------------------ */
  function showWarning(remainingMs) {
    warningShown = true;
    var totalSec = Math.max(0, Math.round(remainingMs / 1000));
    var mins = Math.floor(totalSec / 60);
    var secs = totalSec % 60;
    var countdown = (mins > 0 ? mins + ':' : '') + (mins > 0 ? ('0' + secs).slice(-2) : secs + ' detik');

    if (!overlayEl) {
      overlayEl = U.overlay({
        title: 'Sesi Segera Berakhir',
        message: 'Anda tidak melakukan aktivitas. Sesi akan berakhir otomatis dalam:',
        buttons: [
          {
            label: 'Tetap Masuk', primary: true, onClick: function () {
              resetTimer(true);
              if (CFG.HEARTBEAT_ON_ACTIVITY && NS.Session) { NS.Session.heartbeat(); }
              if (NS.TabProtection) { NS.TabProtection.broadcastActivity(); }
            }
          },
          {
            label: 'Logout Sekarang', onClick: function () {
              doLogout(true);
            }
          }
        ]
      });
      countdownEl = null;
      if (overlayEl) {
        countdownEl = overlayEl.querySelector('div');
        // Sisipkan baris countdown di bawah pesan
        var cd = document.createElement('div');
        cd.id = 'security-al-countdown';
        cd.style.cssText = 'font-size:22px;font-weight:800;color:#ffd166;margin:6px 0 4px;';
        overlayEl.firstChild && overlayEl.firstChild.appendChild(cd);
        countdownEl = cd;
      }
    }
    if (countdownEl) { countdownEl.textContent = countdown; }
  }

  function hideWarning() {
    warningShown = false;
    overlayEl = null;
    countdownEl = null;
    U.closeOverlay && U.closeOverlay();
  }

  /* ------------------------------- Logout --------------------------------- */
  function buildNotice() {
    var minutes = Math.max(1, Math.round(Number(CFG.INACTIVITY_TIMEOUT_MINUTES) || 15));
    return 'Sesi Anda telah berakhir karena tidak ada aktivitas selama ' + minutes +
      ' menit. Silakan login kembali.';
  }

  function doLogout(byUser) {
    if (loggingOut) { return; }
    loggingOut = true;
    hideWarning();
    if (byUser) {
      NS.Session && NS.Session.logout({ reason: 'user' });
      return;
    }
    // Alur spesifikasi: (1) validasi dulu — bila ternyata session sudah
    // mati, Session menangani logout dengan alasan SESSION_EXPIRED/REVOKED;
    // bila masih valid, lanjut auto-logout penuh (LANGKAH 2-6).
    var done = false;
    var performLogout = function () {
      if (done) { return; }
      done = true;
      NS.Session && NS.Session.logout({
        reason: 'inactivity',
        auditEvent: NS.AuditLog && NS.AuditLog.EVENTS.AUTO_LOGOUT,
        notice: buildNotice()
      });
    };
    var guard = setTimeout(performLogout, 3000); // pengaman bila validate menggantung
    if (NS.Session) {
      NS.Session.validate(true).then(function (result) {
        clearTimeout(guard);
        if (result && result.valid === false) {
          return; // Session.validate sudah memicu logout (expired/revoked)
        }
        performLogout();
      }).catch(function () {
        clearTimeout(guard);
        performLogout();
      });
    } else {
      clearTimeout(guard);
      performLogout();
    }
  }

  /* -------------------------------- Tick ---------------------------------- */
  function startTicking() {
    if (ticking) { clearInterval(ticking); }
    ticking = setInterval(function () {
      if (loggingOut) { return; }
      // Pengguna belum login di halaman ini? jangan jalankan logout kosong.
      var hasSession = NS.Session && (NS.Session.isValid() || NS.Session.hasLocalMarker());
      if (!hasSession) { return; }

      var deadline = readDeadline();
      if (!deadline) { resetTimer(true); return; }
      var remaining = deadline - Date.now();

      if (remaining <= 0) {
        doLogout(false);
      } else if (remaining <= warnMs && warnMs > 0) {
        showWarning(remaining);
      } else if (warningShown && remaining > warnMs) {
        hideWarning();
      }
    }, 1000);
  }

  /* ------------------------- Panggilan lintas tab ------------------------- */
  function notifyExternalActivity() {
    // Aktivitas terjadi di tab lain → reset di sini (deadline sudah ditulis
    // tab pengirim ke localStorage; sinkronkan UI saja).
    hideWarning();
  }

  /* -------------------------------- Init ---------------------------------- */
  function init() {
    if (CFG.AUTO_LOGOUT_ENABLED === false) { log('auto-logout nonaktif (config)'); return; }
    var deadline = readDeadline();
    if (!deadline || deadline - Date.now() > fullMs + 60000) { resetTimer(true); }
    installActivityListeners();
    startTicking();
    log('auto-logout siap (' + (fullMs / 60000) + ' menit, peringatan ' + (warnMs / 60000) + ' menit sebelumnya)');
  }

  NS.AutoLogout = {
    init: init,
    resetTimer: resetTimer,
    notifyExternalActivity: notifyExternalActivity,
    getRemainingMs: function () {
      var d = readDeadline();
      return d ? Math.max(0, d - Date.now()) : fullMs;
    }
  };
})(window);
