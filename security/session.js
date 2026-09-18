/* ============================================================================
 * /security/session.js — SESSION SECURITY
 * ----------------------------------------------------------------------------
 * Tanggung jawab:
 *  - Memeriksa & memvalidasi session (berkala + saat halaman dibuka)
 *  - Memeriksa expiration (cookie session: lewat server; JWT: cek exp lokal
 *    bersifat advisory — VALIDASI SEBENARNYA SELALU DI BACKEND)
 *  - Mendeteksi session tidak valid / kedaluwarsa / dicabut (conflict)
 *  - Menangani logout terpusat (server + pembersihan + audit + redirect)
 *  - Menolak halaman protected tanpa session valid (bersama access-control)
 *  - Notifikasi rotasi session (bila server memberi tanda `rotated`)
 *
 * Cookie session yang disarankan di server: Secure; HttpOnly; SameSite=Lax
 * (atau Strict); dengan expiration sesuai kebutuhan. JS TIDAK bisa membaca
 * cookie HttpOnly — justru itu yang aman; validasi dilakukan via endpoint.
 * ==========================================================================*/
(function (global) {
  'use strict';

  var NS = global.AppSecurity = global.AppSecurity || {};
  var CFG = global.SECURITY_CONFIG || {};
  var U = NS.utils || {};
  var log = NS.log || function () {};
  var audit = function (ev, det, sev) { return NS.audit && NS.audit(ev, det, sev); };

  var state = {
    status: 'unknown',            // 'unknown' | 'valid' | 'invalid' | 'revoked'
    info: null,                   // { user, roles, expiresAt, ... } tanpa token!
    lastCheck: 0,
    checkTimer: null,
    checking: false
  };
  var logoutInProgress = false;
  var rotationListeners = [];

  /* ------------------------- Info session lokal -------------------------- */
  // Disimpan di sessionStorage (per tab, hilang saat browser ditutup).
  // HANYA metadata non-sensitif: nama/role/waktu kedaluwarsa. TANPA token.
  function saveInfo(info) {
    state.info = info || null;
    U.storage && U.storage.sessionSet(CFG.SESSION_INFO_KEY, JSON.stringify(info || {}));
  }
  function loadInfo() {
    var raw = U.storage ? U.storage.sessionGet(CFG.SESSION_INFO_KEY) : null;
    if (!raw) { return null; }
    try { return JSON.parse(raw); } catch (e) { return null; }
  }
  function clearInfo() {
    state.info = null;
    U.storage && U.storage.sessionRemove(CFG.SESSION_INFO_KEY);
  }

  /* --------------------------- JWT (advisory) ----------------------------- */
  function decodeJwtPayload(jwt) {
    try {
      var part = String(jwt).split('.')[1];
      if (!part) { return null; }
      var b64 = part.replace(/-/g, '+').replace(/_/g, '/');
      var json = decodeURIComponent(escape(atob(b64)));
      return JSON.parse(json);
    } catch (e) { return null; }
  }
  // HANYA cek waktu kedaluwarsa lokal. Tanda tangan & keabsahan token
  // DIVALIDASI DI BACKEND — lokal tidak pernah bisa dipercaya.
  function jwtExpired() {
    if (CFG.AUTH_MODE !== 'jwt' || !CFG.JWT_STORAGE_KEY) { return false; }
    var token = U.storage ? U.storage.get(CFG.JWT_STORAGE_KEY) : null;
    if (!token) { return true; }                 // tidak ada token = tidak valid
    var payload = decodeJwtPayload(token);
    if (!payload || !payload.exp) { return false; } // tak bisa dibaca → serahkan ke server
    return (payload.exp * 1000) <= Date.now();
  }

  /* ----------------------------- Validasi -------------------------------- */
  function validate(force) {
    // Cek cepat tanpa jaringan
    if (!force) {
      if (jwtExpired()) {
        handleUnauthorized('token_expired');
        return Promise.resolve({ valid: false, reason: 'token_expired' });
      }
      var cachedAge = (Date.now() - state.lastCheck) / 1000;
      if (state.status === 'valid' && cachedAge < (CFG.SESSION_CACHE_SECONDS || 30)) {
        return Promise.resolve({ valid: true, cached: true, info: state.info });
      }
    }
    if (!CFG.SESSION_VALIDATE_ENDPOINT) {
      // Mode degradasi: endpoint belum tersedia. Jangan blokir aplikasi;
      // andalkan penanda lokal (masih dianggap "belum terverifikasi" —
      // keandalan penuh tetap ditangguhkan ke backend, lihat README).
      var hasMarker = !!(U.storage && U.storage.sessionGet(CFG.SESSION_INFO_KEY));
      log('validate dilewati: SESSION_VALIDATE_ENDPOINT kosong');
      return Promise.resolve({ valid: hasMarker || state.status === 'valid', unknown: true });
    }
    if (state.checking) {
      return Promise.resolve({ valid: state.status === 'valid', pending: true });
    }
    state.checking = true;
    return U.netFetch(CFG.SESSION_VALIDATE_ENDPOINT, { method: 'GET' })
      .then(function (resp) {
        state.lastCheck = Date.now();
        if (resp.status === 200) {
          return resp.json().catch(function () { return {}; }).then(function (data) {
            state.status = 'valid';
            saveInfo({
              user: (data && (data.user || data.username)) || null,
              roles: (data && data.roles) || [],
              expiresAt: (data && data.expiresAt) || null,
              ts: Date.now()
            });
            if (data && data.rotated && rotationListeners.length) {
              rotationListeners.forEach(function (cb) {
                try { cb(); } catch (e) { log('rotation listener error:', e); }
              });
            }
            return { valid: true, info: state.info };
          });
        }
        if (resp.status === 409 || resp.status === 423) {
          state.status = 'revoked';
          handleUnauthorized('revoked');                 // session conflict / device lain
          return { valid: false, reason: 'revoked' };
        }
        if (resp.status === 401 || resp.status === 403) {
          state.status = 'invalid';
          handleUnauthorized('expired');
          return { valid: false, reason: 'expired' };
        }
        // 5xx / lainnya: jangan logout (server bermasalah, bukan session)
        log('validate status tak terduga:', resp.status);
        return { valid: state.status === 'valid', unknown: true };
      })
      .catch(function () {
        // Network error / offline: JANGAN logout agar aplikasi tidak rusak.
        log('validate gagal (network) — diulang pada interval berikutnya');
        return { valid: state.status === 'valid', unknown: true };
      })
      .then(function (result) {
        state.checking = false;
        return result;
      });
  }

  /* ------------------------- Pengamat 401 global -------------------------- */
  function installHttpWatcher() {
    if (!U.Interceptors || CFG.WATCH_401 === false) { return; }
    U.Interceptors.addResponseHook(function (ctx) {
      try {
        if (!ctx.isSameOrigin) { return; }
        if (ctx.status !== 401) { return; }
        var path = U.normalizeUrl ? U.normalizeUrl(ctx.rawUrl || ctx.url) : ctx.url;
        // Abaikan endpoint yang jelas bukan indikasi session mati
        if (path && CFG.LOGIN_ENDPOINT && path.indexOf(U.normalizeUrl(CFG.LOGIN_ENDPOINT)) === 0) { return; }
        if (path && CFG.SESSION_VALIDATE_ENDPOINT && path.indexOf(U.normalizeUrl(CFG.SESSION_VALIDATE_ENDPOINT)) === 0) { return; }
        if (path && CFG.SESSION_LOGOUT_ENDPOINT && path.indexOf(U.normalizeUrl(CFG.SESSION_LOGOUT_ENDPOINT)) === 0) { return; }
        if (state.status === 'valid' || state.status === 'unknown') {
          log('HTTP 401 terdeteksi dari', path, '— session dianggap berakhir');
          state.status = 'invalid';
          handleUnauthorized('http401');
        }
      } catch (e) { log('401 watcher error:', e && e.message); }
    });
  }

  /* ------------------------------ Logout ---------------------------------- */
  // Alur sesuai spesifikasi: validasi -> invalidasi server -> bersihkan
  // credential aman -> logout -> redirect -> notifikasi.
  function logout(options) {
    options = options || {};
    if (logoutInProgress) { return; }
    logoutInProgress = true;
    var reason = options.reason || 'user';           // 'user'|'inactivity'|'expired'|'revoked'|'remote'
    var notice = options.notice || '';

    try { audit(options.auditEvent || NS.AuditLog.EVENTS.LOGOUT, { reason: reason }, reason === 'inactivity' ? 'warn' : 'info'); } catch (e) { /* noop */ }

    // 1) Invalidasi session di server (fire-and-forget, maks 3 detik)
    if (CFG.SESSION_LOGOUT_ENDPOINT) {
      try {
        U.netFetch(CFG.SESSION_LOGOUT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: reason })
        }).catch(function () { /* best-effort */ });
      } catch (e) { /* noop */ }
    }

    // 2) Bersihkan credential/token yang AMAN dihapus dari sisi browser
    try {
      (CFG.CLEAR_ON_LOGOUT_KEYS || []).forEach(function (key) {
        U.storage && U.storage.remove(key);
        U.storage && U.storage.sessionRemove(key);
      });
      if (CFG.AUTH_MODE === 'jwt' && CFG.JWT_STORAGE_KEY) {
        U.storage && U.storage.remove(CFG.JWT_STORAGE_KEY);
        U.storage && U.storage.sessionRemove(CFG.JWT_STORAGE_KEY);
      }
    } catch (e) { /* noop */ }
    clearInfo();

    // 3) Perintahkan tab lain ikut logout (sinkron antar-tab)
    try { NS.TabProtection && NS.TabProtection.broadcastLogout(notice); } catch (e) { /* noop */ }

    // 4) Notifikasi ditampilkan di halaman tujuan
    if (notice) { U.storage && U.storage.sessionSet(CFG.NOTICE_KEY, notice); }

    // 5) Redirect ke halaman login (bawa URL asal agar bisa kembali)
    var loginUrl = CFG.LOGIN_URL || '/';
    if (U.isPublicPage && U.isPublicPage()) {
      logoutInProgress = false;                      // sudah di halaman publik
      if (notice) { U.toast(notice, 'warn'); }
      return;
    }
    try {
      var next = encodeURIComponent(global.location.pathname + global.location.search);
      var sep = loginUrl.indexOf('?') === -1 ? '?' : '&';
      global.location.href = loginUrl + sep + 'reason=' + encodeURIComponent(reason) + '&next=' + next;
    } catch (e) {
      global.location.href = loginUrl;
    }
  }

  function applyRemoteLogout(notice) {
    // Dipanggil dari tab lain (TabProtection) — server sudah/p akan
    // menginvalidasi session; di sini cukup bersihkan & redirect.
    if (logoutInProgress) { return; }
    logoutInProgress = true;
    clearInfo();
    try {
      (CFG.CLEAR_ON_LOGOUT_KEYS || []).forEach(function (key) {
        U.storage && U.storage.remove(key);
        U.storage && U.storage.sessionRemove(key);
      });
    } catch (e) { /* noop */ }
    if (notice) { U.storage && U.storage.sessionSet(CFG.NOTICE_KEY, notice); }
    global.location.href = CFG.LOGIN_URL || '/';
  }

  /* --------------------- Penanganan tidak valid --------------------------- */
  var REASON_NOTICES = {
    expired: 'Sesi Anda telah berakhir. Silakan login kembali.',
    token_expired: 'Sesi Anda telah berakhir. Silakan login kembali.',
    http401: 'Sesi Anda tidak lagi valid. Silakan login kembali.',
    revoked: 'Akun Anda digunakan di perangkat/browser lain. Sesi ini telah dicabut. Silakan login kembali.'
  };
  function handleUnauthorized(type) {
    if (logoutInProgress) { return; }
    var eventMap = {
      expired: NS.AuditLog && NS.AuditLog.EVENTS.SESSION_EXPIRED,
      token_expired: NS.AuditLog && NS.AuditLog.EVENTS.SESSION_EXPIRED,
      http401: NS.AuditLog && NS.AuditLog.EVENTS.SESSION_EXPIRED,
      revoked: NS.AuditLog && NS.AuditLog.EVENTS.SESSION_REVOKED
    };
    var notice = REASON_NOTICES[type] || REASON_NOTICES.expired;
    logout({
      reason: type === 'revoked' ? 'revoked' : 'expired',
      notice: notice,
      auditEvent: eventMap[type] || (NS.AuditLog && NS.AuditLog.EVENTS.SESSION_EXPIRED)
    });
  }

  /* ------------------------------- Init ----------------------------------- */
  function init() {
    // Halaman protected: validasi awal + polling berkala
    if (U.isProtectedPage && U.isProtectedPage()) {
      // Info cache milik tab ini? bila ada, anggap valid sementara (hindari
      // kedipan UI); server tetap menjadi hakim lewat polling.
      var cached = loadInfo();
      if (cached && cached.ts) { state.status = 'unknown'; }

      if (CFG.SESSION_VALIDATION_ENABLED !== false) {
        validate(true);
        var intervalMs = Math.max(15, CFG.SESSION_CHECK_INTERVAL_SECONDS || 60) * 1000;
        state.checkTimer = setInterval(function () { validate(true); }, intervalMs);
      }
      installHttpWatcher();
    }
    log('session siap');
  }

  /* -------------------------------- API ----------------------------------- */
  NS.Session = {
    init: init,
    validate: validate,
    logout: logout,
    applyRemoteLogout: applyRemoteLogout,
    handleUnauthorized: handleUnauthorized,
    isValid: function () { return state.status === 'valid'; },
    getStatus: function () { return state.status; },
    getUser: function () { return (state.info && state.info.user) || (loadInfo() || {}).user || null; },
    getRoles: function () {
      if (state.info && state.info.roles) { return state.info.roles; }
      return (loadInfo() || {}).roles || [];
    },
    hasLocalMarker: function () { return !!loadInfo(); },
    markLocalSession: function (info) {
      // Dipakai halaman login (mis. demo) setelah login sukses; info nyata
      // tetap dikonfirmasi server lewat validate().
      saveInfo(Object.assign({ ts: Date.now() }, info || {}));
      state.status = 'valid';
    },
    onSessionRotated: function (cb) {
      if (typeof cb === 'function') { rotationListeners.push(cb); }
    },
    heartbeat: function () {
      if (!CFG.SESSION_HEARTBEAT_ENDPOINT) { return Promise.resolve(false); }
      return U.netFetch(CFG.SESSION_HEARTBEAT_ENDPOINT, { method: 'POST' })
        .then(function (r) { return !!(r && r.ok); })
        .catch(function () { return false; });
    }
  };
})(window);
