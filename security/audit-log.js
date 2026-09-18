/* ============================================================================
 * /security/audit-log.js — AUDIT LOG
 * ----------------------------------------------------------------------------
 * Mencatat event keamanan penting:
 *   LOGIN_SUCCESS, LOGIN_FAILED, LOGIN_BLOCKED, LOGOUT, AUTO_LOGOUT,
 *   SESSION_EXPIRED, SESSION_REVOKED, PASSWORD_CHANGED, ROLE_CHANGED,
 *   SENSITIVE_ACTION
 *
 * KEBIJAKAN DATA:
 *  - TIDAK PERNAH mencatat: password, access token, refresh token, secret
 *    key, API secret, database password. Setiap field pada `details`
 *    otomatis DIREDAKSI bila namanya terindikasi sensitif.
 *  - Penyimpanan: ring buffer localStorage (maks AUDIT_LOCAL_MAX entri,
 *    kedaluwarsa AUDIT_LOCAL_RETENTION_DAYS hari) + pengiriman batch ke
 *    AUDIT_REMOTE_ENDPOINT bila tersedia (best-effort, tidak pernah
 *    memblokir aplikasi).
 * ==========================================================================*/
(function (global) {
  'use strict';

  var NS = global.AppSecurity = global.AppSecurity || {};
  var CFG = global.SECURITY_CONFIG || {};
  var U = NS.utils || {};
  var log = NS.log || function () {};

  var EVENTS = {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILED: 'LOGIN_FAILED',
    LOGIN_BLOCKED: 'LOGIN_BLOCKED',
    LOGOUT: 'LOGOUT',
    AUTO_LOGOUT: 'AUTO_LOGOUT',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    SESSION_REVOKED: 'SESSION_REVOKED',
    PASSWORD_CHANGED: 'PASSWORD_CHANGED',
    ROLE_CHANGED: 'ROLE_CHANGED',
    SENSITIVE_ACTION: 'SENSITIVE_ACTION'
  };

  var LS_KEY = 'security_audit_buffer';
  var buffer = [];
  var flushTimer = null;
  var sending = false;

  /* ------------------------- Redaksi data sensitif ----------------------- */
  var SENSITIVE_KEY_RE = /pass(word)?|pwd|token|secret|authorization|auth|credential|api[_-]?key|apikey|db[_-]?pass(word)?|private[_-]?key|session[_-]?id|cookie/i;

  function scrub(value, depth) {
    depth = depth || 0;
    if (depth > 6) { return '[DEEP]'; }
    if (value === null || value === undefined) { return value; }
    if (typeof value === 'string') { return value.length > 300 ? value.slice(0, 300) + '…' : value; }
    if (typeof value === 'number' || typeof value === 'boolean') { return value; }
    if (value instanceof Error) { return { name: value.name, message: String(value.message).slice(0, 200) }; }
    if (Array.isArray(value)) {
      return value.slice(0, 20).map(function (item) { return scrub(item, depth + 1); });
    }
    if (typeof value === 'object') {
      var clean = {};
      try {
        Object.keys(value).forEach(function (key) {
          if (SENSITIVE_KEY_RE.test(key)) {
            clean[key] = '[REDACTED]';            // JANGAN PERNAH mencatat nilainya
          } else {
            clean[key] = scrub(value[key], depth + 1);
          }
        });
      } catch (e) { return '[UNSERIALIZABLE]'; }
      return clean;
    }
    return String(value);
  }

  /* ------------------------------ Buffer --------------------------------- */
  function loadBuffer() {
    var stored = U.storage ? U.storage.getJson(LS_KEY, []) : [];
    buffer = Array.isArray(stored) ? stored : [];
    purgeExpired();
  }

  function purgeExpired() {
    var cutoff = Date.now() - (CFG.AUDIT_LOCAL_RETENTION_DAYS || 7) * 86400000;
    var kept = [];
    for (var i = 0; i < buffer.length; i++) {
      var ts = Date.parse(buffer[i].ts);
      if (isNaN(ts) || ts >= cutoff) { kept.push(buffer[i]); }
    }
    buffer = kept;
  }

  function persist() {
    try {
      if (buffer.length > (CFG.AUDIT_LOCAL_MAX || 200)) {
        buffer = buffer.slice(buffer.length - (CFG.AUDIT_LOCAL_MAX || 200));
      }
      U.storage && U.storage.setJson(LS_KEY, buffer);
    } catch (e) { log('audit persist gagal:', e && e.message); }
  }

  /* ------------------------------ Kirim ---------------------------------- */
  function sendBeacon(entries) {
    try {
      if (!CFG.AUDIT_REMOTE_ENDPOINT) { return false; }
      var url = CFG.AUDIT_REMOTE_ENDPOINT;
      if (global.navigator && typeof global.navigator.sendBeacon === 'function') {
        var blob = new global.Blob([JSON.stringify(entries)], { type: 'application/json' });
        if (global.navigator.sendBeacon(url, blob)) { return true; }
      }
      U.netFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entries),
        keepalive: true
      }).catch(function () { /* best-effort */ });
      return true;
    } catch (e) { return false; }
  }

  function flush(force) {
    if (!CFG.AUDIT_REMOTE_ENDPOINT || sending) { return; }
    if (!buffer.length) { return; }
    if (!force && buffer.length < 10) { return; }
    sending = true;
    var batch = buffer.slice(0, 50);
    var rest = buffer.slice(batch.length);
    U.netFetch(CFG.AUDIT_REMOTE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch)
    }).then(function (resp) {
      sending = false;
      if (resp && resp.ok) {
        buffer = rest;
        persist();
      }
      // gagal (4xx/5xx/offline): biarkan di buffer, dicoba lagi nanti
    }).catch(function () {
      sending = false; // offline — coba lagi pada interval berikutnya
    });
  }

  /* ------------------------------ API ------------------------------------ */
  // severity: 'info' | 'warn' | 'critical'
  function audit(event, details, severity) {
    if (CFG.AUDIT_LOG === false) { return null; }
    var entry = {
      ts: U.nowIso ? U.nowIso() : String(Date.now()),
      event: String(event || 'UNKNOWN'),
      severity: severity || 'info',
      page: (global.location && global.location.pathname) || '',
      device: NS.BrowserSession ? NS.BrowserSession.getDeviceId() : '',
      details: scrub(details || {})
    };
    buffer.push(entry);
    persist();
    log('audit:', entry.event);
    flush(false);
    return entry;
  }

  function init() {
    loadBuffer();
    try {
      global.addEventListener('pagehide', function () {
        if (buffer.length) { sendBeacon(buffer.slice(-50)); }
      });
    } catch (e) { /* noop */ }
    var interval = Math.max(5, CFG.AUDIT_FLUSH_INTERVAL_SECONDS || 30) * 1000;
    flushTimer = setInterval(function () { flush(true); }, interval);
    log('audit-log siap');
  }

  NS.audit = audit;
  NS.AuditLog = {
    EVENTS: EVENTS,
    init: init,
    audit: audit,
    flush: function () { flush(true); },
    // Untuk debugging/admin saja — JANGAN ditampilkan ke pengguna umum
    recent: function (n) { return buffer.slice(-(n || 20)); },
    clearLocal: function () { buffer = []; persist(); }
  };
})(window);
