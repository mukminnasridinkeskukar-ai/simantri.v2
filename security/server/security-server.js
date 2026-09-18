/**
 * ============================================================
 * SECURITY MODULE (server) - security-server.js
 * ============================================================
 * Guard server TANPA dependensi eksternal (Node.js murni).
 *
 * Integrasi Express (cara paling umum) - DUA baris saja:
 *
 *   const { createSecurity } = require('/security/server/security-server.js');
 *   const sec = createSecurity({ loginPaths: ['/api/login'] });
 *   app.use(sec.applyExpress());          // header + endpoint /security/*
 *   app.post('/api/login', sec.loginGuard(), loginHandler);
 *
 * Integrasi Node http murni:
 *
 *   const sec = createSecurity({});
 *   sec.attachTo(server);                 // header + endpoint otomatis
 *
 * Yang dilakukan file ini:
 * 1. Security headers di SEMUA response (CSP opsional, default
 *    hanya header "aman" agar tidak merusak aplikasi yang ada).
 * 2. Rate limit login: 3x gagal -> cooldown 5 menit (SEMENTARA,
 *    tidak pernah permanen), per IP+username, memori internal.
 * 3. Verifikasi token sesi HMAC-SHA256 (opsional) ATAU delegasi
 *    ke fungsi verifySession milik aplikasi Anda.
 * 4. Registry sesi single-session: login baru menggantikan sesi
 *    lama; heartbeat endpoint menjawab {valid:false,...}.
 * 5. Endpoint: POST /security/heartbeat, POST /security/audit,
 *    POST /security/logout (path prefix bisa diubah).
 * 6. Sink audit log dari browser (redaksi dilakukan di client;
 *    file ini melakukan redaksi LAYER-2 sebagai jaring pengaman).
 *
 * CATATAN JUJUR: penyimpanan in-memory hilang saat proses
 * restart dan tidak dibagi antar instance cluster. Untuk
 * produksi multi-instance, ganti store dengan Redis (lihat
 * README bagian "Integrasi Backend").
 * ============================================================
 */

'use strict';

const crypto = require('crypto');

const DEFAULTS = {
  // Rute login aplikasi yang dilindungi rate limit
  loginPaths: ['/api/login', '/login'],
  maxAttempts: 3,
  cooldownMs: 5 * 60 * 1000,      // SEMENTARA - tidak pernah permanen
  attemptWindowMs: 15 * 60 * 1000,
  failureStatuses: [401, 403],

  // Header keamanan
  headers: {
    enabled: true,
    csp: null,                    // isi string CSP saat aplikasi siap; null = tidak dikirim
    hsts: 'max-age=31536000; includeSubDomains', // hanya dikirim via https
    xContentTypeOptions: 'nosniff',
    frameOptions: 'DENY',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: 'camera=(), microphone=(), geolocation=()',
  },

  // Endpoint modul
  apiPrefix: '/security',         // => /security/heartbeat, /security/audit, /security/logout

  // Single-session
  singleSession: true,            // login baru menggantikan sesi lama per user

  // CSRF (double-submit) - default MODE LAPOR agar tidak merusak API yang ada
  csrf: {
    enabled: false,               // true = tolak request mutasi tanpa header yang cocok
    cookieName: 'sec_csrf',
    headerName: 'X-CSRF-Token',
    reportOnly: true,             // true = catat pelanggaran saja, jangan tolak
  },

  // Verifikasi sesi
  sessionSecret: process.env.SECURITY_SESSION_SECRET || null, // kunci HMAC (opsional)
  verifySession: null,            // alternatif: fungsi async(req) => {valid, userId, role}

  // Audit
  onAudit: null,                  // callback (entry) => void; log juga disimpan di memori
  auditMaxMemory: 1000,
};

// ============================================================
// Store in-memory (ganti dengan Redis untuk produksi multi-instance)
// ============================================================
function createMemoryStore() {
  return {
    loginAttempts: new Map(),  // key "ip|user" -> { failures: number[], blockedUntil: number }
    sessions: new Map(),       // userId -> sessionId terbaru (single session)
    revoked: new Set(),        // sessionId yang dicabut
    audit: [],
  };
}

// ============================================================
// Token sesi HMAC (opsional - untuk aplikasi tanpa auth sendiri)
// Format: base64url(payload).base64url(hmac)
// ============================================================
function signSession(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifySessionToken(token, secret) {
  try {
    const [body, sig] = String(token || '').split('.');
    if (!body || !sig) return { valid: false, reason: 'MALFORMED' };
    const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { valid: false, reason: 'BAD_SIGNATURE' };
    }
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return { valid: false, reason: 'SESSION_EXPIRED' };
    }
    return { valid: true, payload };
  } catch {
    return { valid: false, reason: 'MALFORMED' };
  }
}

// ============================================================
// Redaksi layer-2 (jaring pengaman di server)
// ============================================================
const FORBIDDEN = ['password', 'passwd', 'pwd', 'token', 'secret', 'apikey',
  'credential', 'authorization', 'cookie', 'privatekey', 'creditcard'];

function scrub(obj, depth = 0) {
  if (depth > 6 || obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((v) => scrub(v, depth + 1));
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const nk = String(k).toLowerCase().replace(/[^a-z0-9]/g, '');
    out[k] = FORBIDDEN.some((f) => nk.includes(f)) ? '[REDACTED]' : scrub(v, depth + 1);
  }
  return out;
}

// ============================================================
// Factory utama
// ============================================================
function createSecurity(options = {}) {
  const o = mergeOptions(DEFAULTS, options);
  const store = createMemoryStore();
  const startedAt = new Date().toISOString();

  // ---------- Rate limit login ----------
  function attemptKey(req) {
    const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
      .toString().split(',')[0].trim();
    const user = String((req.body && req.body.username) || req.headers['x-username'] || '').toLowerCase();
    return `${ip}|${user}`;
  }

  function isBlocked(key) {
    const rec = store.loginAttempts.get(key);
    if (!rec) return { blocked: false };
    const now = Date.now();
    if (rec.blockedUntil && now < rec.blockedUntil) {
      return { blocked: true, retryAfterMs: rec.blockedUntil - now };
    }
    if (rec.blockedUntil && now >= rec.blockedUntil) {
      store.loginAttempts.delete(key); // cooldown lewat -> reset penuh
    }
    return { blocked: false };
  }

  function recordFailure(key) {
    const now = Date.now();
    const rec = store.loginAttempts.get(key) || { failures: [], blockedUntil: null };
    rec.failures = rec.failures.filter((t) => now - t < o.attemptWindowMs);
    rec.failures.push(now);
    if (rec.failures.length >= o.maxAttempts) {
      // HANYA cooldown berhingga (sesuai spesifikasi: tanpa blokir permanen)
      rec.blockedUntil = now + o.cooldownMs;
      rec.failures = [];
      store.loginAttempts.set(key, rec);
      pushAudit('LOGIN_BLOCKED', { key: hashKey(key), until: new Date(rec.blockedUntil).toISOString() });
      return { blocked: true };
    }
    store.loginAttempts.set(key, rec);
    pushAudit('LOGIN_FAILED', { key: hashKey(key) });
    return { blocked: false };
  }

  function recordSuccess(key) {
    store.loginAttempts.delete(key);
  }

  // ---------- Single-session registry ----------
  function registerSession(userId, sessionId) {
    if (!o.singleSession || !userId || !sessionId) return;
    const prev = store.sessions.get(userId);
    if (prev && prev !== sessionId) store.revoked.add(prev); // sesi lama dicabut
    store.sessions.set(userId, sessionId);
  }

  function revokeUser(userId) {
    const sid = store.sessions.get(userId);
    if (sid) store.revoked.add(sid);
    store.sessions.delete(userId);
    pushAudit('SESSION_REVOKED', { userId: hashKey(String(userId)) });
  }

  function heartbeat(userId, sessionId) {
    // Tidak terdaftar = aplikasi belum memakai registry -> dianggap valid
    // agar modul TIDAK pernah merusak autentikasi yang sudah ada.
    const latest = userId ? store.sessions.get(String(userId)) : undefined;
    if (latest === undefined && !store.revoked.has(sessionId)) {
      return { valid: true };
    }
    if (store.revoked.has(sessionId)) {
      return { valid: false, reason: 'SESSION_REVOKED' };
    }
    if (o.singleSession && latest && latest !== sessionId) {
      return { valid: false, reason: 'SESSION_REVOKED' };
    }
    return { valid: true };
  }

  // ---------- Audit ----------
  function pushAudit(event, detail) {
    const entry = scrub({ ts: new Date().toISOString(), event, detail, source: 'server' });
    store.audit.push(entry);
    if (store.audit.length > o.auditMaxMemory) store.audit.shift();
    if (typeof o.onAudit === 'function') {
      try { o.onAudit(entry); } catch { /* callback user error tidak boleh menjatuhkan server */ }
    }
  }

  function receiveBrowserLogs(logs) {
    if (!Array.isArray(logs)) return 0;
    let n = 0;
    for (const log of logs.slice(0, 100)) {
      if (!log || typeof log !== 'object') continue;
      const entry = scrub({ ...log, receivedAt: new Date().toISOString(), source: 'browser' });
      store.audit.push(entry);
      if (store.audit.length > o.auditMaxMemory) store.audit.shift();
      if (typeof o.onAudit === 'function') { try { o.onAudit(entry); } catch { /* noop */ } }
      n += 1;
    }
    return n;
  }

  // ---------- Security headers ----------
  function applyHeaders(res, req) {
    if (!o.headers.enabled) return;
    const h = res.setHeader ? res.setHeader.bind(res) : () => {};
    if (o.headers.csp) h('Content-Security-Policy', o.headers.csp);
    if (o.headers.hsts && isHttps(req)) h('Strict-Transport-Security', o.headers.hsts);
    if (o.headers.xContentTypeOptions) h('X-Content-Type-Options', o.headers.xContentTypeOptions);
    if (o.headers.frameOptions) h('X-Frame-Options', o.headers.frameOptions);
    if (o.headers.referrerPolicy) h('Referrer-Policy', o.headers.referrerPolicy);
    if (o.headers.permissionsPolicy) h('Permissions-Policy', o.headers.permissionsPolicy);
  }

  function isHttps(req) {
    return !!(
      req.socket?.encrypted ||
      (req.headers['x-forwarded-proto'] || '').toString().includes('https')
    );
  }

  // ---------- CSRF ----------
  function checkCsrf(req) {
    if (!o.csrf.enabled) return { ok: true };
    const method = (req.method || 'GET').toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return { ok: true };
    const cookies = parseCookies(req.headers.cookie || '');
    // Hanya berlaku bila autentikasi cookie terdeteksi
    const hasSessionCookie = Object.keys(cookies).some((c) => /sess|auth|token|jwt/i.test(c));
    if (!hasSessionCookie) return { ok: true };

    const cookieTok = cookies[o.csrf.cookieName];
    const headerTok = req.headers[o.csrf.headerName.toLowerCase()];
    const ok = !!cookieTok && !!headerTok && cookieTok === headerTok;
    if (ok) return { ok: true };
    if (o.csrf.reportOnly) {
      pushAudit('CSRF_VIOLATION_REPORT', { path: req.url });
      return { ok: true };
    }
    pushAudit('CSRF_VIOLATION_BLOCKED', { path: req.url });
    return { ok: false };
  }

  // ============================================================
  // Express middlewares
  // ============================================================

  /** Pasang di paling atas: headers + endpoint /security/* */
  function applyExpress() {
    return function securityExpressMiddleware(req, res, next) {
      applyHeaders(res, req);

      // Endpoint internal modul (sebelum handler aplikasi)
      if (req.path && req.path.startsWith(o.apiPrefix + '/')) {
        return handleApi(req, res, () => next());
      }

      // Header saja - jangan sentuh request lain
      return next();
    };
  }

  /** Pasang pada rute login: rate limit + pencatatan otomatis hasil login */
  function loginGuard() {
    return function loginGuardMiddleware(req, res, next) {
      const key = attemptKey(req);
      const block = isBlocked(key);
      if (block.blocked) {
        const secs = Math.ceil(block.retryAfterMs / 1000);
        res.setHeader('Retry-After', String(secs));
        return res.status(429).json({
          error: 'LOGIN_BLOCKED',
          message: `Terlalu banyak percobaan login gagal. Coba lagi dalam ${Math.floor(secs / 60)} menit ${secs % 60} detik.`,
          retryAfter: secs,
        });
      }

      // Catat hasil otomatis dari status response (tanpa mengubah handler login)
      res.on('finish', () => {
        if (o.failureStatuses.includes(res.statusCode)) {
          recordFailure(key);
        } else if (res.statusCode >= 200 && res.statusCode < 300) {
          recordSuccess(key);
          pushAudit('LOGIN_SUCCESS', { key: hashKey(key) });
          // Jika handler login menandai userId, daftarkan sesi single-session
          const uid = res.getHeader && res.getHeader('x-user-id');
          if (uid) registerSession(String(uid), req.headers['x-session-id'] || key);
        }
      });

      return next();
    };
  }

  /** Verifikasi sesi untuk rute terlindungi (opsional). */
  function requireSession() {
    return async function requireSessionMiddleware(req, res, next) {
      // 1) Delegasi ke verifier aplikasi jika ada
      if (typeof o.verifySession === 'function') {
        try {
          const verdict = await o.verifySession(req);
          if (verdict && verdict.valid) return next();
          return res.status(401).json({ error: 'SESSION_INVALID', reason: verdict && verdict.reason });
        } catch (err) {
          return res.status(500).json({ error: 'VERIFY_ERROR' });
        }
      }
      // 2) Verifikasi HMAC bawaan (butuh sessionSecret)
      if (o.sessionSecret) {
        const token = extractToken(req);
        const verdict = verifySessionToken(token, o.sessionSecret);
        if (verdict.valid) {
          req.securitySession = verdict.payload;
          return next();
        }
        return res.status(401).json({ error: 'SESSION_INVALID', reason: verdict.reason });
      }
      // 3) Tidak dikonfigurasi: JANGAN blokir (agar tidak merusak app),
      //    cukup beri peringatan sekali.
      warnOnce('requireSession dipasang tanpa sessionSecret/verifySession - verifikasi dilewati.');
      return next();
    };
  }

  // ============================================================
  // Endpoint internal (dipakai oleh Express applyExpress & attachTo)
  // ============================================================
  function handleApi(req, res, next) {
    const path = (req.url || '').split('?')[0];
    const isExpressPath = typeof req.path === 'string' ? req.path.startsWith(o.apiPrefix + '/') : false;
    const sub = isExpressPath
      ? req.path.slice(o.apiPrefix.length)
      : path.slice(o.apiPrefix.length);

    if (req.method === 'POST' && sub === '/heartbeat') {
      return readJson(req, (body) => {
        const verdict = heartbeat(body && body.userId, body && body.sessionId);
        return sendJson(res, 200, verdict);
      });
    }
    if (req.method === 'POST' && sub === '/audit') {
      return readJson(req, (body) => {
        const n = receiveBrowserLogs(body && body.logs);
        return sendJson(res, 204, null);
      });
    }
    if (req.method === 'POST' && sub === '/logout') {
      return readJson(req, (body) => {
        if (body && body.sessionId) store.revoked.add(String(body.sessionId));
        pushAudit('LOGOUT', { sessionId: body ? hashKey(String(body.sessionId || '')) : '-' });
        return sendJson(res, 200, { ok: true });
      });
    }
    if (req.method === 'GET' && sub === '/health') {
      return sendJson(res, 200, { ok: true, since: startedAt });
    }
    if (typeof next === 'function') return next();
    return sendJson(res, 404, { error: 'NOT_FOUND' });
  }

  // ============================================================
  // Integrasi Node http murni
  // ============================================================
  function attachTo(server) {
    const listeners = server.listeners('request').slice();
    // Hapus listener lama, pasang wrapper kami di depan
    server.removeAllListeners('request');
    server.addListener('request', (req, res) => {
      applyHeaders(res, req);

      const url = (req.url || '').split('?')[0];
      if (url.startsWith(o.apiPrefix + '/')) {
        return handleApi(req, res, () => {
          for (const l of listeners) l.call(server, req, res);
        });
      }

      for (const l of listeners) l.call(server, req, res);
    });
    return server;
  }

  // ---------- API programmatik ----------
  return {
    // Express
    applyExpress,
    loginGuard,
    requireSession,
    // Node murni
    attachTo,
    // Programmatik (untuk dipanggil dari handler login aplikasi)
    registerSession,
    revokeUser,
    revokeSession: (sessionId) => store.revoked.add(String(sessionId)),
    heartbeat,
    verifySessionToken: (token) => o.sessionSecret ? verifySessionToken(token, o.sessionSecret) : { valid: false, reason: 'NO_SECRET' },
    signSession: (payload) => o.sessionSecret ? signSession({ ...payload, iat: Date.now(), exp: Date.now() + 60 * 60 * 1000 }, o.sessionSecret) : null,
    // Audit
    getAuditLogs: () => store.audit.slice(),
    clearAuditLogs: () => { store.audit.length = 0; },
    // Util
    _store: store, // untuk pengujian
  };
}

// ============================================================
// Helper Node murni
// ============================================================
function readJson(req, cb) {
  let data = '';
  req.on('data', (c) => {
    data += c;
    if (data.length > 1e6) req.destroy(); // batas 1MB
  });
  req.on('end', () => {
    try { cb(data ? JSON.parse(data) : {}); }
    catch { cb({}); }
  });
}

function sendJson(res, status, obj) {
  if (res.headersSent) return;
  if (status === 204) { res.statusCode = 204; return res.end(); }
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(obj || {}));
}

function parseCookies(header) {
  const out = {};
  for (const part of String(header).split(';')) {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function extractToken(req) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  const cookies = parseCookies(req.headers.cookie || '');
  return cookies.sec_session_token || '';
}

function hashKey(key) {
  // Jangan catat IP/username mentah di log server
  return crypto.createHash('sha256').update(String(key)).digest('hex').slice(0, 16);
}

let warned = false;
function warnOnce(msg) {
  if (warned) return;
  warned = true;
  console.warn('[security-server]', msg);
}

function mergeOptions(base, override) {
  const out = JSON.parse(JSON.stringify(base));
  if (!override || typeof override !== 'object') return out;
  for (const [k, v] of Object.entries(override)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object') {
      out[k] = { ...out[k], ...v };
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out;
}

module.exports = {
  createSecurity,
  signSession,
  verifySessionToken,
  DEFAULT_SECURITY_OPTIONS: DEFAULTS,
};
