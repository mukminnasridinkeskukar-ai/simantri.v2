/* ============================================================================
 * /security/tab-protection.js — TAB PROTECTION
 * ----------------------------------------------------------------------------
 * Membedakan dua situasi (validasi utama tetap di server):
 *   1. Tab baru dalam session YANG SAMA  -> diizinkan (policy default)
 *   2. Session baru yang tidak sah       -> server menolak saat validasi
 *
 * Policy (config TAB_POLICY):
 *  - 'allow-same-session' (default):
 *      Beberapa tab boleh terbuka bersamaan. Modul hanya melakukan
 *      SINKRONISASI: logout di satu tab meng-logout tab lain; aktivitas di
 *      satu tab me-reset timer auto-logout di tab lain. TIDAK ADA pemblokiran.
 *  - 'single-active-tab':
 *      Hanya satu tab aplikasi aktif. Tab kedua diberi tahu dan DITOLAK
 *      (tanpa meng-logout session milik tab pertama). Bila tab aktif
 *      ditutup, tab berikutnya boleh mengambil alih setelah beberapa detik.
 * ==========================================================================*/
(function (global) {
  'use strict';

  var NS = global.AppSecurity = global.AppSecurity || {};
  var CFG = global.SECURITY_CONFIG || {};
  var U = NS.utils || {};
  var log = NS.log || function () {};

  var TAB_ID = (U.randomId ? U.randomId(6) : 't' + Date.now());
  var channel = null;
  var mode = CFG.TAB_POLICY || 'allow-same-session';
  var blocked = false;
  var hbTimer = null;
  var lastPeerSeen = 0;

  /* --------------------------- Sinkronisasi ------------------------------- */
  function broadcastLogout(notice) {
    if (channel) { channel.post({ t: 'lo', notice: notice || '', id: TAB_ID }); }
  }
  function broadcastActivity() {
    if (channel) { channel.post({ t: 'act', id: TAB_ID }); }
  }

  function handleMessage(msg) {
    try {
      if (!msg || !msg.t) { return; }
      if (msg.t === 'lo') {
        // Logout terjadi di tab lain — ikut logout tanpa memanggil server lagi
        NS.Session && NS.Session.applyRemoteLogout(msg.notice);
        return;
      }
      if (msg.t === 'act') {
        // Aktivitas di tab lain — reset timer auto-logout di tab ini
        NS.AutoLogout && NS.AutoLogout.notifyExternalActivity();
        return;
      }
      if (msg.t === 'hb') {
        lastPeerSeen = Date.now();
        return;
      }
      if (msg.t === 'claim') {
        // Tab baru bertanya: ada tab aktif lain? bila saya aktif, jawab.
        if (!blocked && !isStale()) { channel && channel.post({ t: 'hb', id: TAB_ID }); }
        return;
      }
    } catch (e) { log('tab handler error:', e && e.message); }
  }

  /* ------------------------ Policy: single-active-tab --------------------- */
  function isStale() {
    return lastPeerSeen > 0 && (Date.now() - lastPeerSeen) > 6000;
  }

  function startHeartbeat() {
    if (hbTimer) { clearInterval(hbTimer); }
    hbTimer = setInterval(function () {
      channel && channel.post({ t: 'hb', id: TAB_ID });
    }, 2000);
    channel && channel.post({ t: 'hb', id: TAB_ID });
  }

  function blockThisTab() {
    blocked = true;
    log('single-active-tab: tab kedua diblokir');
    var overlay = U.overlay && U.overlay({
      title: 'Aplikasi sudah terbuka di tab lain',
      message: 'Untuk keamanan, aplikasi hanya boleh terbuka dalam satu tab. Silakan gunakan tab yang sudah terbuka, atau tutup tab lain terlebih dahulu.',
      buttons: [{ label: 'Tutup Tab Ini', primary: true, onClick: function () { global.close(); } }]
    });
    // Coba tutup otomatis (hanya berhasil bila tab dibuka oleh script)
    setTimeout(function () { try { global.close(); } catch (e) { /* noop */ } }, 800);
    // Bila tab aktif lain tutup/lenyap, izinkan tab ini mengambil alih
    var watcher = setInterval(function () {
      if (!blocked) { clearInterval(watcher); return; }
      if (isStale() || lastPeerSeen === 0) {
        // Tidak ada tab aktif lain → tab ini boleh jadi aktif
        blocked = false;
        if (overlay && overlay.parentNode) { overlay.parentNode.removeChild(overlay); }
        U.closeOverlay && U.closeOverlay();
        startHeartbeat();
        clearInterval(watcher);
      }
    }, 2000);
  }

  function enforceSingleActiveTab() {
    if (!channel) { return; }
    // Tanya dulu: apakah ada tab aktif lain?
    lastPeerSeen = 0;
    channel.post({ t: 'claim', id: TAB_ID });
    setTimeout(function () {
      var peerAlive = lastPeerSeen > 0 && (Date.now() - lastPeerSeen) < 4000;
      if (peerAlive) { blockThisTab(); }
      else { startHeartbeat(); }
    }, 1200);
  }

  /* -------------------------------- Init ---------------------------------- */
  function init() {
    if (CFG.TAB_PROTECTION === false) { log('tab-protection nonaktif (config)'); return; }
    try { channel = new U.Channel(CFG.CHANNEL_NAME || 'app-security-channel'); } catch (e) {
      log('channel gagal dibuat:', e && e.message);
      return;
    }
    channel.on(handleMessage);

    if (mode === 'single-active-tab') {
      enforceSingleActiveTab();
    } else {
      // allow-same-session: tidak ada pemblokiran apa pun.
      // Tab baru memvalidasi session-nya sendiri via Session (server hakim).
      log('tab-protection: allow-same-session (sinkronisasi saja)');
    }
  }

  NS.TabProtection = {
    init: init,
    broadcastLogout: broadcastLogout,
    broadcastActivity: broadcastActivity,
    getTabId: function () { return TAB_ID; },
    isBlocked: function () { return blocked; }
  };
})(window);
