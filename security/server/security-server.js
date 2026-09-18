/* ============================================================================
 * /security/server/security-server.js — SECURITY MIDDLEWARE (Node/Express)
 * ----------------------------------------------------------------------------
 * Lapisan SERVER-SIDE yang melengkapi /security/ frontend. Murni Node.js +
 * Express — TANPA dependensi tambahan (crypto/fs/path bawaan).
 *
 * ⚠ INI LAPISAN YANG SESUNGGUHNYA untuk:
 *   - Rate limiting salah password (3x -> cooldown)  [tidak bisa dilewati]
 *   - Validasi & invalidasi session                  [sumber kebenaran]
 *   - Single session (login baru mencabut session lama -> 409)
 *   - Verifikasi CSRF
 *   - Security header HTTP asli (CSP, HSTS, dst.)
 *   - Penyimpanan audit log ke file JSONL
 *
 * PEMASANGAN MINIMAL (satu baris + opsional):
 *   const security = require('./security/server/security-server')
 *                      .createSecurity({ ...opsi sesuai kebutuhan... });
 *   app.use(express.json());                    // agar blokir per-username akurat
 *   app.use(security.securityHeaders);          // header HTTP
 *   app.use('/security', security.router);      // endpoint bawaan
 *
 *   // Bungkus endpoint login EXISTING (ubah 1 baris di route login):
 *   app.post('/api/auth/login', security.loginGuard(), loginHandlerLama);
 *   // Di dalam loginHandlerLama, saat kredensial valid:
 *   security.helpers.issueSession(req, res, user.username, user.roles);
 *
 * Endpoint bawaan (sesuai config.js frontend):
 *   GET  /security/csrf                  -> { token }
 *   GET  /security/session/validate      -> 200 | 401 | 409 (dicabut)
 *   POST /security/session/logout        -> 200 (hapus session + cookie)
 *   POST /security/session/heartbeat     -> 200 (perpanjang sesi)
 *   POST /security/audit                 -> simpan batch audit (JSONL)
 * ==========================================================================*/
'use strict';

var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var express = require('express');

/* ------------------------------ Utilitas -------------------------------- */
function randomToken() {
  return crypto.randomBytes(32).toString('hex');
}
function parseCookies(header) {
  var out = {};
  if (!header) { return out; }
  String(header).split(';').forEach(function (part) {
    var eq = part.indexOf('=');
    if (eq === -1) { return; }
    out[part.slice(0, eq).trim()] = decodeURIComponent(part.slice(eq + 1).trim());
  });
  return out;
}
var SENSITIVE_KEY_RE = /pass(word)?|pwd|token|secret|authorization|auth|credential|api[_-]?key|apikey|db[_-]?pass(word)?|private[_-]?key|cookie/i;
function scrub(value, depth) {
  depth = depth || 0;
  if (depth > 6) { return '[DEEP]'; }
  if (value === null || value === undefined) { return value; }
  if (typeof value === 'string') { return value.length > 300 ? value.slice(0, 300) : value; }
  if (typeof value === 'number' || typeof value === 'boolean') { return value; }
  if (Array.isArray(value)) { return value.slice(0, 20).map(function (v) { return scrub(v, depth + 1); }); }
  if (typeof value === 'object') {
    var clean = {};
    Object.keys(value).forEach(function (key) {
      clean[key] = SENSITIVE_KEY_RE.test(key) ? '[REDACTED]' : scrub(value[key], depth + 1);
    });
    return clean;
  }
  return String(value);
}

/* ============================ createSecurity ============================== */
function createSecurity(options) {
  var opts = Object.assign({
    cookieName: 'app_session',          // nama cookie session
    sessionTtlMinutes: 30,              // masa berlaku (sliding)
    singleSession: true,                // login baru mencabut session lama
    csrfCookieName: 'XSRF-TOKEN',
    csrfHeaderName: 'x-csrf-token',
    maxLoginAttempts: 3,
    loginCooldownMs: 5 * 60000,
    loginEscalation: true,
    loginCooldownMaxMs: 30 * 60000,
    loginFailStatus: [400, 401, 403, 429],
    csrfProtectMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
    csrfExemptPaths: ['/security/csrf', '/security/audit'],
    setSecurityHeaders: true,
    csp: null,                          // string CSP — ISI SETELAH DIUJI (lihat README)
    hsts: true,                         // hanya efektif via HTTPS
    sameSite: 'lax',                    // 'lax' | 'strict'
    secure: 'auto',                     // 'auto' | true | false
    basePath: '/security',
    auditDir: path.join(process.cwd(), 'security', 'logs')
  }, options || {});

  /* ------------------------------- Stores --------------------------------- */
  var sessions = new Map();   // sid -> {user, roles, deviceId, createdAt, lastSeen, expiresAt, superseded}
  var byUser = new Map();     // user -> Set<sid>
  var attempts = new Map();   // "ip|user" -> {count, blockedUntil, escalations, updatedAt}
  var csrfTokens = new Map(); // token -> expiresAt

  function cleanup() {
    var now = Date.now();
    sessions.forEach(function (s, sid) {
      if (s.expiresAt < now) {
        sessions.delete(sid);
        var set = byUser.get(s.user);
        if (set) { set.delete(sid); if (!set.size) { byUser.delete(s.user); } }
      }
    });
    csrfTokens.forEach(function (exp, tok) { if (exp < now) { csrfTokens.delete(tok); } });
    attempts.forEach(function (a, key) {
      if (a.updatedAt < now - 3600000) { attempts.delete(key); }
    });
  }
  var cleanupTimer = setInterval(cleanup, 5 * 60000);
  if (cleanupTimer.unref) { cleanupTimer.unref(); }

  /* -------------------------------- Audit --------------------------------- */
  function writeAudit(event, details, severity) {
    try {
      var entry = {
        ts: new Date().toISOString(),
        event: String(event || 'UNKNOWN'),
        severity: severity || 'info',
        ip: (details && details.ip) || '',
        details: scrub(details || {})
      };
      fs.mkdirSync(opts.auditDir, { recursive: true });
      var file = path.join(opts.auditDir, 'audit-' + entry.ts.slice(0, 10) + '.jsonl');
      fs.appendFileSync(file, JSON.stringify(entry) + '\n');
    } catch (e) {
      console.warn('[security] audit gagal ditulis:', e.message);
    }
  }

  /* ------------------------------- Cookie --------------------------------- */
  function isSecureReq(req) {
    if (opts.secure === true) { return true; }
    if (opts.secure === false) { return false; }
    return req.secure || req.headers['x-forwarded-proto'] === 'https';
  }
  function setSessionCookie(req, res, sid, maxAgeMs) {
    var flags = [
      opts.cookieName + '=' + sid,
      'Path=/',
      'HttpOnly',
      'SameSite=' + (opts.sameSite === 'strict' ? 'Strict' : 'Lax'),
      'Max-Age=' + Math.floor(maxAgeMs / 1000)
    ];
    if (isSecureReq(req)) { flags.push('Secure'); }   // Secure; HttpOnly; SameSite
    res.setHeader('Set-Cookie', flags.join('; '));
  }
  function clearSessionCookie(res) {
    res.setHeader('Set-Cookie', opts.cookieName + '=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  }

  /* ------------------------------ Session --------------------------------- */
  function issueSession(req, res, user, roles, meta) {
    var sid = randomToken();
    var now = Date.now();
    var session = {
      user: String(user || 'unknown'),
      roles: Array.isArray(roles) ? roles : [],
      deviceId: req.headers['x-device-id'] || '',
      createdAt: now,
      lastSeen: now,
      expiresAt: now + opts.sessionTtlMinutes * 60000,
      superseded: false
    };
    if (meta) { session.meta = scrub(meta); }

    // SINGLE SESSION: login baru (device lain) mencabut session lama user.
    // Browser lama akan menerima 409 pada validate -> tampil pesan ramah.
    if (opts.singleSession) {
      var oldSet = byUser.get(session.user);
      if (oldSet) {
        oldSet.forEach(function (oldSid) {
          if (oldSid !== sid && sessions.has(oldSid)) {
            sessions.get(oldSid).superseded = true;
            sessions.get(oldSid).expiresAt = now + 60000; // beri waktu singkat
          }
        });
      }
    }
    sessions.set(sid, session);
    if (!byUser.has(session.user)) { byUser.set(session.user, new Set()); }
    byUser.get(session.user).add(sid);
    setSessionCookie(req, res, sid, opts.sessionTtlMinutes * 60000);
    writeAudit('LOGIN_SUCCESS', { user: session.user, ip: req.ip, deviceId: session.deviceId });
    return sid;
  }

  function revoke(sid, reason) {
    var s = sessions.get(sid);
    if (!s) { return false; }
    sessions.delete(sid);
    var set = byUser.get(s.user);
    if (set) { set.delete(sid); if (!set.size) { byUser.delete(s.user); } }
    writeAudit('LOGOUT', { user: s.user, reason: reason || 'user' });
    return true;
  }

  function getSession(req) {
    var cookies = parseCookies(req.headers.cookie);
    var sid = cookies[opts.cookieName];
    if (!sid) { return null; }
    var s = sessions.get(sid);
    if (!s) { return null; }
    var now = Date.now();
    if (s.expiresAt < now) {
      revoke(sid, 'expired');
      return null;
    }
    // Sliding expiration
    s.lastSeen = now;
    s.expiresAt = now + opts.sessionTtlMinutes * 60000;
    return { sid: sid, session: s };
  }

  /* -------------------------- Login rate limiting -------------------------- */
  function attemptKey(req) {
    var bodyUser = '';
    try {
      bodyUser = (req.body && (req.body.username || req.body.email || req.body.user)) || '';
    } catch (e) { /* noop */ }
    return (req.ip || 'unknown') + '|' + String(bodyUser).toLowerCase();
  }
  function loginGuard() {
    return function (req, res, next) {
      var key = attemptKey(req);
      var a = attempts.get(key) || { count: 0, blockedUntil: 0, escalations: 0, updatedAt: Date.now() };
      var now = Date.now();

      if (a.blockedUntil > now) {
        writeAudit('LOGIN_BLOCKED', { ip: req.ip, retryInMs: a.blockedUntil - now }, 'warn');
        res.setHeader('Retry-After', Math.ceil((a.blockedUntil - now) / 1000));
        return res.status(429).json({
          success: false,
          error: 'TOO_MANY_ATTEMPTS',
          message: 'Terlalu banyak percobaan login gagal. Coba lagi nanti.',
          retryAfterSeconds: Math.ceil((a.blockedUntil - now) / 1000)
        });
      }
      if (a.blockedUntil && a.blockedUntil <= now) { a.count = 0; a.blockedUntil = 0; }

      // Tegakkan hasil lewat event 'finish' — status respons menentukan gagal/sukses
      res.on('finish', function () {
        var status = res.statusCode;
        var cur = attempts.get(key) || a;
        cur.updatedAt = Date.now();
        if (opts.loginFailStatus.indexOf(status) !== -1) {
          cur.count += 1;
          writeAudit('LOGIN_FAILED', { ip: req.ip, attempts: cur.count },
            cur.count >= opts.maxLoginAttempts ? 'warn' : 'info');
          if (cur.count >= opts.maxLoginAttempts) {
            var base = opts.loginCooldownMs;
            var factor = opts.loginEscalation ? Math.pow(2, cur.escalations || 0) : 1;
            cur.blockedUntil = Date.now() + Math.min(base * factor, opts.loginCooldownMaxMs);
            cur.escalations = (cur.escalations || 0) + 1;
            cur.count = 0;
            writeAudit('LOGIN_BLOCKED', {
              ip: req.ip,
              cooldownMinutes: Math.round((cur.blockedUntil - Date.now()) / 60000)
            }, 'warn');
          }
          attempts.set(key, cur);
        } else if (status >= 200 && status < 300) {
          attempts.delete(key);   // sukses -> reset penuh (TIDAK permanent lock)
        }
      });
      next();
    };
  }

  /* ------------------------------ CSRF ------------------------------------ */
  function issueCsrf(req, res) {
    var token = randomToken();
    var ttl = 2 * 3600000; // 2 jam
    csrfTokens.set(token, Date.now() + ttl);
    res.setHeader('Set-Cookie', opts.csrfCookieName + '=' + token +
      '; Path=/; SameSite=' + (opts.sameSite === 'strict' ? 'Strict' : 'Lax') +
      (isSecureReq(req) ? '; Secure' : '') + '; Max-Age=' + Math.floor(ttl / 1000));
    // Cookie CSRF TIDAK HttpOnly (pola double-submit); bukan credential.
    res.json({ token: token });
  }
  function csrfProtect() {
    return function (req, res, next) {
      if (opts.csrfProtectMethods.indexOf(req.method) === -1) { return next(); }
      var p = req.path;
      for (var i = 0; i < opts.csrfExemptPaths.length; i++) {
        if (p.indexOf(opts.csrfExemptPaths[i]) === 0) { return next(); }
      }
      var header = req.headers[opts.csrfHeaderName];
      var cookies = parseCookies(req.headers.cookie);
      var cookieToken = cookies[opts.csrfCookieName];
      // Double-submit: header harus cocok dengan cookie; token harus dikenal.
      if (header && cookieToken && header === cookieToken && csrfTokens.has(header)) {
        return next();
      }
      return res.status(403).json({ success: false, error: 'CSRF_INVALID' });
    };
  }

  /* --------------------------- Security headers --------------------------- */
  function securityHeaders(req, res, next) {
    if (opts.setSecurityHeaders === false) { return next(); }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (opts.csp) { res.setHeader('Content-Security-Policy', opts.csp); }
    if (opts.hsts && isSecureReq(req)) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  }

  /* --------------------------- Rate limit umum ---------------------------- */
  function rateLimit(windowMs, max, keyFn) {
    var hits = new Map();
    windowMs = windowMs || 60000;
    max = max || 100;
    return function (req, res, next) {
      var key = keyFn ? keyFn(req) : (req.ip || 'unknown');
      var now = Date.now();
      var rec = hits.get(key) || { count: 0, resetAt: now + windowMs };
      if (now > rec.resetAt) { rec.count = 0; rec.resetAt = now + windowMs; }
      rec.count += 1;
      hits.set(key, rec);
      if (rec.count > max) {
        res.setHeader('Retry-After', Math.ceil((rec.resetAt - now) / 1000));
        return res.status(429).json({ success: false, error: 'RATE_LIMITED' });
      }
      next();
    };
  }

  /* ------------------------------- Router --------------------------------- */
  var router = express.Router();
  router.use(express.json({ limit: '64kb' }));

  router.get('/csrf', function (req, res) { issueCsrf(req, res); });

  router.get('/session/validate', function (req, res) {
    var found = getSession(req);
    if (!found) { return res.status(401).json({ valid: false, reason: 'expired' }); }
    if (found.session.superseded) {
      revoke(found.sid, 'superseded');
      writeAudit('SESSION_REVOKED', { user: found.session.user, reason: 'superseded' }, 'warn');
      return res.status(409).json({ valid: false, reason: 'superseded' });
    }
    res.json({
      valid: true,
      user: found.session.user,
      roles: found.session.roles,
      expiresAt: new Date(found.session.expiresAt).toISOString()
    });
  });

  router.post('/session/logout', function (req, res) {
    var found = getSession(req);
    if (found) { revoke(found.sid, (req.body && req.body.reason) || 'user'); }
    clearSessionCookie(res);
    res.json({ success: true });
  });

  router.post('/session/heartbeat', function (req, res) {
    var found = getSession(req);
    if (!found) { return res.status(401).json({ valid: false }); }
    if (found.session.superseded) {
      return res.status(409).json({ valid: false, reason: 'superseded' });
    }
    res.json({ valid: true, expiresAt: new Date(found.session.expiresAt).toISOString() });
  });

  router.post('/audit', function (req, res) {
    var batch = Array.isArray(req.body) ? req.body : [req.body];
    batch.forEach(function (entry) {
      if (entry && entry.event) {
        writeAudit(entry.event, Object.assign({ ip: req.ip }, entry.details || {}), entry.severity);
      }
    });
    res.json({ success: true });
  });

  /* -------------------------- requireAuth/requireRoles -------------------- */
  function requireAuth() {
    return function (req, res, next) {
      var found = getSession(req);
      if (!found) { return res.status(401).json({ success: false, error: 'UNAUTHENTICATED' }); }
      if (found.session.superseded) {
        return res.status(409).json({ success: false, error: 'SESSION_SUPERSEDED' });
      }
      req.securitySession = found.session;
      req.securitySid = found.sid;
      next();
    };
  }
  function requireRoles() {
    var roles = Array.prototype.slice.call(arguments);
    return function (req, res, next) {
      if (!req.securitySession) { return res.status(401).json({ success: false, error: 'UNAUTHENTICATED' }); }
      var owned = req.securitySession.roles || [];
      var ok = roles.some(function (r) { return owned.indexOf(r) !== -1; });
      if (!ok) {
        writeAudit('ROLE_CHANGED', { user: req.securitySession.user, denied: roles, path: req.path }, 'warn');
        return res.status(403).json({ success: false, error: 'FORBIDDEN' });
      }
      next();
    };
  }

  /* ------------------------------- Cleanup on exit ------------------------ */
  var api = {
    router: router,
    securityHeaders: securityHeaders,
    loginGuard: loginGuard,
    csrfProtect: csrfProtect,
    requireAuth: requireAuth,
    requireRoles: requireRoles,
    rateLimit: rateLimit,
    helpers: {
      issueSession: issueSession,
      revoke: revoke,
      revokeAllForUser: function (user, reason) {
        var set = byUser.get(String(user));
        if (!set) { return 0; }
        var n = 0;
        Array.from(set).forEach(function (sid) { if (revoke(sid, reason || 'revoked')) { n++; } });
        return n;
      },
      audit: writeAudit,
      getSession: function (req) { var f = getSession(req); return f ? f.session : null; }
    },
    _stores: { sessions: sessions, attempts: attempts, csrfTokens: csrfTokens } // untuk testing
  };
  return api;
}

module.exports = { createSecurity: createSecurity };
