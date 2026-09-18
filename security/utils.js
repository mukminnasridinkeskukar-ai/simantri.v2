/* ============================================================================
 * /security/utils.js — HELPER BERSAMA SECURITY MODULE
 * ----------------------------------------------------------------------------
 * Berisi infrastruktur yang dipakai semua modul:
 *  - Logger debug           - Safe storage wrapper
 *  - Pencocokan pola path   - Toast & overlay (UI minimal, tanpa file CSS)
 *  - Interceptor fetch/XHR  - BroadcastChannel (dengan fallback)
 *  - netFetch               - panggilan internal yang TIDAK ikut interceptor
 *
 * PRINSIP KOMPATIBILITAS: semua wrapper bersifat pass-through. Bila terjadi
 * error apa pun di dalam hook security, request aplikasi TETAP dilanjutkan
 * tanpa diubah (fail-open), sehingga aplikasi existing tidak bisa rusak.
 * ==========================================================================*/
(function (global) {
  'use strict';

  var NS = global.AppSecurity = global.AppSecurity || {};
  var CFG = global.SECURITY_CONFIG || {};

  /* ------------------------------ Logger -------------------------------- */
  var log = NS.log = function () {
    if (!CFG.DEBUG) { return; }
    try {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('[Security]');
      (global.console && global.console.log || function () {}).apply(global.console, args);
    } catch (e) { /* noop */ }
  };
  var warn = NS.warn = function () {
    try {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('[Security]');
      (global.console && global.console.warn || function () {}).apply(global.console, args);
    } catch (e) { /* noop */ }
  };

  /* ------------------------------ DOM ready ----------------------------- */
  function onReady(fn) {
    try {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn, { once: true });
      } else {
        setTimeout(fn, 0);
      }
    } catch (e) { try { fn(); } catch (e2) { /* noop */ } }
  }
  NS.onReady = onReady;

  /* ------------------------------ Throttle ------------------------------ */
  function throttle(fn, waitMs) {
    var last = 0, timer = null;
    return function () {
      var now = Date.now();
      var remaining = waitMs - (now - last);
      var ctx = this, args = arguments;
      if (remaining <= 0) {
        last = now;
        try { fn.apply(ctx, args); } catch (e) { /* noop */ }
      } else if (!timer) {
        timer = setTimeout(function () {
          timer = null; last = Date.now();
          try { fn.apply(ctx, args); } catch (e) { /* noop */ }
        }, remaining);
      }
    };
  }
  NS.throttle = throttle;

  /* --------------------------- Safe storage ----------------------------- */
  var storage = {
    get: function (key) {
      try { return global.localStorage.getItem(key); } catch (e) { return null; }
    },
    set: function (key, value) {
      try { global.localStorage.setItem(key, value); return true; } catch (e) { return false; }
    },
    remove: function (key) {
      try { global.localStorage.removeItem(key); } catch (e) { /* noop */ }
    },
    sessionGet: function (key) {
      try { return global.sessionStorage.getItem(key); } catch (e) { return null; }
    },
    sessionSet: function (key, value) {
      try { global.sessionStorage.setItem(key, value); return true; } catch (e) { return false; }
    },
    sessionRemove: function (key) {
      try { global.sessionStorage.removeItem(key); } catch (e) { /* noop */ }
    },
    getJson: function (key, fallback) {
      var raw = storage.get(key);
      if (!raw) { return fallback; }
      try { return JSON.parse(raw); } catch (e) { return fallback; }
    },
    setJson: function (key, obj) {
      try { return storage.set(key, JSON.stringify(obj)); } catch (e) { return false; }
    }
  };
  NS.storage = storage;

  /* --------------------------- Path matching ---------------------------- */
  // Pola: '/admin/**' (semua kedalaman), '/data/*' (satu tingkat),
  //       '**/login.html' (di mana pun), '/' (exact root).
  function segToRegex(seg) {
    var out = '';
    for (var i = 0; i < seg.length; i++) {
      if (seg[i] === '*') { out += '[^/]*'; }
      else { out += seg[i].replace(/[.+?^${}()|[\]\\]/g, '\\$&'); }
    }
    return out;
  }
  function globToRegex(pattern) {
    var parts = String(pattern).split('/');
    var re = '';
    for (var i = 0; i < parts.length; i++) {
      var seg = parts[i];
      var isLast = (i === parts.length - 1);
      if (seg === '**') {
        // '/admin/**' -> cocok '/admin' DAN '/admin/a/b'; '**' di tengah -> n atau lebih segmen
        re += isLast ? '(?:/.*)?' : '(?:/[^/]+)*';
      } else if (seg === '*') {
        re += '/[^/]+';                       // satu tingkat, wajib ada
      } else if (seg !== '') {
        re += '/' + segToRegex(seg);
      }
      // seg === '' -> garis miring depan, lewati
    }
    return new RegExp('^' + re + '/?$', 'i');
  }
  function patternToRegex(pattern) {
    var p = String(pattern);
    // '**/x' -> di awal path mana pun yang berakhiran pola
    if (p.indexOf('**/') === 0) {
      var tailSource = globToRegex(p.slice(3)).source;
      // RegExp.source meng-escape '/' menjadi '\/' — buang '^' + '\/' depan,
      // lalu ubah '\/?$' akhir menjadi '$' (disumbukan oleh '(^|/)')
      tailSource = tailSource.replace(/^\^\\?\/?/, '').replace(/^\^/, '');
      tailSource = tailSource.replace(/\\?\/\?\$$/, '$');
      return new RegExp('(^|/)' + tailSource, 'i');
    }
    return globToRegex(p);
  }
  function matchesPath(path, patterns) {
    if (!patterns || !patterns.length) { return false; }
    var norm = ('/' + String(path || '/').replace(/^\/+|\/+$/g, '')).replace(/\/$/, '') || '/';
    for (var i = 0; i < patterns.length; i++) {
      var pat = patterns[i];
      if (pat === '/') {
        if (norm === '/' || norm === '') { return true; }
        continue;
      }
      try { if (patternToRegex(pat).test(norm)) { return true; } }
      catch (e) { if (norm.indexOf(pat) === 0) { return true; } }
    }
    return false;
  }
  NS.matchesPath = matchesPath;

  function isPublicPage() {
    return matchesPath(global.location.pathname, CFG.PUBLIC_PATTERNS) &&
      !matchesPath(global.location.pathname, CFG.PROTECTED_PATTERNS);
  }
  function isProtectedPage() {
    return matchesPath(global.location.pathname, CFG.PROTECTED_PATTERNS) &&
      !matchesPath(global.location.pathname, CFG.PUBLIC_PATTERNS);
  }
  NS.isPublicPage = isPublicPage;
  NS.isProtectedPage = isProtectedPage;

  /* ------------------------------ Misc ---------------------------------- */
  function randomId(len) {
    var bytes = len || 16, out = '';
    try {
      var arr = new Uint8Array(bytes);
      (global.crypto || global.msCrypto).getRandomValues(arr);
      for (var i = 0; i < arr.length; i++) { out += ('0' + arr[i].toString(16)).slice(-2); }
      return out;
    } catch (e) {
      return 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    }
  }
  NS.randomId = randomId;

  function nowIso() {
    try { return new Date().toISOString(); } catch (e) { return String(Date.now()); }
  }
  NS.nowIso = nowIso;

  function sameOrigin(url) {
    try {
      if (!url) { return true; }
      var u = String(url);
      if (u.indexOf('/') === 0 || u.indexOf('?') === 0 || u.indexOf('#') === 0) { return true; }
      return new URL(u, global.location.href).origin === global.location.origin;
    } catch (e) { return true; }
  }
  NS.sameOrigin = sameOrigin;

  function normalizeUrl(url) {
    try { return new URL(String(url), global.location.href).pathname; }
    catch (e) { return String(url || ''); }
  }
  NS.normalizeUrl = normalizeUrl;

  /* --------------------------- Toast & Overlay -------------------------- */
  // Notifikasi kecil di atas layar — tidak mengubah layout aplikasi.
  NS.toast = function (message, type, durationMs) {
    try {
      var old = document.getElementById('security-toast');
      if (old && old.parentNode) { old.parentNode.removeChild(old); }
      var el = document.createElement('div');
      el.id = 'security-toast';
      el.setAttribute('role', 'alert');
      el.textContent = String(message || '');
      el.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);' +
        'z-index:2147483647;max-width:min(92vw,560px);padding:14px 18px;border-radius:10px;' +
        'font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;' +
        'color:#fff;box-shadow:0 8px 30px rgba(0,0,0,.25);' +
        'background:' + (type === 'error' ? '#b3261e' : type === 'warn' ? '#9a6b00' : '#1f6f43') + ';';
      (document.body || document.documentElement).appendChild(el);
      setTimeout(function () {
        if (el && el.parentNode) { el.parentNode.removeChild(el); }
      }, durationMs || 8000);
    } catch (e) { log('toast gagal:', e && e.message); }
  };

  // Layar blokir penuh — dipakai untuk peringatan logout / akses ditolak.
  NS.overlay = function (options) {
    try {
      var o = options || {};
      var old = document.getElementById('security-overlay');
      if (old && old.parentNode) { old.parentNode.removeChild(old); }
      var wrap = document.createElement('div');
      wrap.id = 'security-overlay';
      wrap.setAttribute('role', 'dialog');
      wrap.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;' +
        'align-items:center;justify-content:center;background:rgba(10,14,20,.86);' +
        'font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color:#e8eef7;';
      var card = document.createElement('div');
      card.style.cssText = 'background:#141b26;border:1px solid #2a3648;border-radius:14px;' +
        'padding:28px 30px;max-width:min(92vw,460px);text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.5);';
      var title = document.createElement('div');
      title.textContent = o.title || 'Pemberitahuan Keamanan';
      title.style.cssText = 'font-size:17px;font-weight:700;margin-bottom:10px;color:#fff;';
      card.appendChild(title);
      var msg = document.createElement('div');
      msg.textContent = o.message || '';
      msg.style.marginBottom = o.buttons && o.buttons.length ? '18px' : '0';
      card.appendChild(msg);
      if (o.buttons && o.buttons.length) {
        o.buttons.forEach(function (btn) {
          var b = document.createElement('button');
          b.textContent = btn.label;
          b.type = 'button';
          b.style.cssText = 'margin:4px 6px;padding:9px 18px;border:0;border-radius:8px;cursor:pointer;' +
            'font-size:14px;font-weight:600;background:' + (btn.primary ? '#2f81f7' : '#2a3648') + ';color:#fff;';
          b.addEventListener('click', function () {
            try { btn.onClick && btn.onClick(); } catch (e) { log('overlay onClick error:', e); }
            if (btn.closeOnClick !== false && wrap.parentNode) { wrap.parentNode.removeChild(wrap); }
          });
          card.appendChild(b);
        });
      }
      wrap.appendChild(card);
      (document.body || document.documentElement).appendChild(wrap);
      return wrap;
    } catch (e) { log('overlay gagal:', e && e.message); return null; }
  };
  NS.closeOverlay = function () {
    try {
      var el = document.getElementById('security-overlay');
      if (el && el.parentNode) { el.parentNode.removeChild(el); }
    } catch (e) { /* noop */ }
  };

  /* ------------------- Interceptor fetch/XHR (shared) ------------------- */
  // Registry hook. Semua modul mendaftar di sini; wrapper fetch/XHR global
  // dipasang SEKALI agar tidak menumpuk wrapper (kompatibel dengan wrapper
  // milik aplikasi — order apapun tetap berjalan).
  var hooks = { request: [], response: [] };

  function addRequestHook(fn) { hooks.request.push(fn); }
  function addResponseHook(fn) { hooks.response.push(fn); }

  var INTERNAL_HEADER = 'X-Security-Internal';

  function isInternal(init) {
    try {
      if (init && init.headers) {
        var h = init.headers;
        if (h instanceof global.Headers) { return h.has(INTERNAL_HEADER); }
        if (typeof h === 'object') {
          return Object.keys(h).some(function (k) {
            return k.toLowerCase() === INTERNAL_HEADER.toLowerCase();
          });
        }
      }
    } catch (e) { /* noop */ }
    return false;
  }

  function runRequestHooks(ctx) {
    for (var i = 0; i < hooks.request.length; i++) {
      try { hooks.request[i](ctx); } catch (e) { log('request hook error:', e && e.message); }
    }
  }
  function runResponseHooks(ctx) {
    for (var i = 0; i < hooks.response.length; i++) {
      try { hooks.response[i](ctx); } catch (e) { log('response hook error:', e && e.message); }
    }
  }

  function headerHasKey(headers, name) {
    try {
      if (!headers) { return false; }
      if (headers instanceof global.Headers) { return headers.has(name); }
      return Object.keys(headers).some(function (k) { return k.toLowerCase() === name.toLowerCase(); });
    } catch (e) { return false; }
  }

  function wrapFetch() {
    if (typeof global.fetch !== 'function' || global.fetch.__securityWrapped) { return; }
    var origFetch = global.fetch;
    var wrapped = function (input, init) {
      var ctx = { url: '', method: 'GET', isSameOrigin: true, skip: false };
      try {
        ctx.url = typeof input === 'string' ? input : (input && input.url) || String(input);
        ctx.method = ((init && init.method) || (input && input.method) || 'GET').toUpperCase();
        ctx.isSameOrigin = sameOrigin(ctx.url);
        if (isInternal(init) || !ctx.isSameOrigin) { ctx.skip = true; }
        if (!ctx.skip) {
          // Hook menandai header yang ingin ditambah; penerapan ditunda
          // hingga sebelum pemanggilan fetch asli (lihat bawah).
          ctx.pending = {};
          ctx.pendingKeys = [];
          ctx.setHeader = function (name, value) {
            try {
              // Hormati header yang SUDAH diset aplikasi (init atau Request)
              if (headerHasKey(init && init.headers, name)) { return false; }
              if (input && typeof input === 'object' && input.headers) {
                if (headerHasKey(input.headers, name)) { return false; }
              }
              if (ctx.pendingKeys.indexOf(name) === -1) {
                ctx.pendingKeys.push(name);
                ctx.pending[name] = value;
              }
              return true;
            } catch (e) { return false; }
          };
          runRequestHooks(ctx);
        }
      } catch (e) {
        log('fetch hook error:', e && e.message);
        return origFetch.apply(global, arguments); // fail-open
      }
      // Terapkan header yang minta ditambahkan hook (lazily, aman untuk
      // input berupa Request maupun init biasa — header aplikasi utama
      // tidak pernah ditimpa).
      try {
        if (ctx.pending && ctx.pendingKeys.length) {
          var base;
          try {
            base = new global.Headers((init && init.headers) || (input && input.headers) || {});
          } catch (e2) { base = (init && init.headers) || {}; }
          ctx.pendingKeys.forEach(function (k) {
            try { base.set(k, ctx.pending[k]); } catch (e3) { /* noop */ }
          });
          init = Object.assign({}, init || {}, { headers: base });
        }
      } catch (e) { log('apply pending header gagal:', e && e.message); }

      var promise = origFetch.call(global, input, init);
      if (!ctx.skip) {
        try {
          promise.then(function (resp) {
            runResponseHooks({
              url: normalizeUrl((resp && resp.url) || ctx.url),
              rawUrl: (resp && resp.url) || ctx.url,
              method: ctx.method,
              status: resp ? resp.status : 0,
              isSameOrigin: ctx.isSameOrigin,
              isLoginEndpoint: false
            });
          }).catch(function () { /* network error — biarkan aplikasi menangani */ });
        } catch (e) { /* noop */ }
      }
      return promise;
    };
    wrapped.__securityWrapped = true;
    global.fetch = wrapped;
  }

  function wrapXHR() {
    if (typeof global.XMLHttpRequest === 'undefined' || global.XMLHttpRequest.prototype.__securityWrapped) { return; }
    var XHR = global.XMLHttpRequest;
    var proto = XHR.prototype;
    var origOpen = proto.open;
    var origSend = proto.send;

    proto.open = function (method, url) {
      try {
        this.__secMethod = String(method || 'GET').toUpperCase();
        this.__secUrl = String(url || '');
      } catch (e) { /* noop */ }
      return origOpen.apply(this, arguments);
    };

    proto.send = function () {
      var xhr = this;
      var ctx = { url: xhr.__secUrl || '', method: xhr.__secMethod || 'GET', isSameOrigin: true, skip: false };
      try {
        ctx.isSameOrigin = sameOrigin(ctx.url);
        if (!ctx.isSameOrigin) { ctx.skip = true; }
        if (!ctx.skip) {
          ctx.setHeader = function (name, value) {
            try { xhr.setRequestHeader(name, value); } catch (e) { log('xhr setHeader gagal:', e && e.message); }
          };
          // Catatan: pada XHR kita tidak bisa mendeteksi header yang sudah
          // diset aplikasi, sehingga hook bertanggung jawab sendiri (mis.
          // CSRF hanya mengirim bila aplikasi memanggil CSRF.getToken()).
          runRequestHooks(ctx);
        }
      } catch (e) {
        log('xhr hook error:', e && e.message);
        return origSend.apply(this, arguments); // fail-open
      }
      try {
        xhr.addEventListener('load', function () {
          if (ctx.skip) { return; }
          try {
            runResponseHooks({
              url: normalizeUrl(xhr.responseURL || ctx.url),
              rawUrl: (xhr.responseURL || ctx.url),
              method: ctx.method,
              status: xhr.status,
              isSameOrigin: ctx.isSameOrigin
            });
          } catch (e) { /* noop */ }
        });
      } catch (e) { /* noop */ }
      return origSend.apply(this, arguments);
    };

    proto.__securityWrapped = true;
  }

  NS.Interceptors = {
    addRequestHook: addRequestHook,
    addResponseHook: addResponseHook,
    install: function () {
      try { wrapFetch(); } catch (e) { warn('wrapFetch gagal:', e && e.message); }
      try { wrapXHR(); } catch (e) { warn('wrapXHR gagal:', e && e.message); }
    }
  };

  /* ------------------------- netFetch (internal) ------------------------ */
  // Panggilan milik security module sendiri; melewati semua hook agar tidak
  // terjadi rekursi (mis. audit endpoint tidak diaudit).
  NS.netFetch = function (url, options) {
    options = options || {};
    try {
      var headers = options.headers = options.headers || {};
      if (headers instanceof global.Headers) { headers.set(INTERNAL_HEADER, '1'); }
      else { headers[INTERNAL_HEADER] = '1'; }
    } catch (e) { /* noop */ }
    options.credentials = options.credentials || 'same-origin';
    options.cache = options.cache || 'no-store';
    return global.fetch(url, options);
  };

  /* ----------------------- BroadcastChannel wrapper --------------------- */
  function Channel(name) {
    this.name = name;
    this.handlers = [];
    var self = this;
    this._bc = null;
    try {
      if (typeof global.BroadcastChannel === 'function') {
        this._bc = new global.BroadcastChannel(name);
        this._bc.onmessage = function (evt) { self._receive(evt.data); };
      }
    } catch (e) { this._bc = null; }
    if (!this._bc) {
      // Fallback: localStorage 'storage' event (lintas tab, browser lama)
      this._key = '__sec_msg__' + name;
      try {
        global.addEventListener('storage', function (evt) {
          if (evt.key === self._key && evt.newValue) {
            try { self._receive(JSON.parse(evt.newValue)); } catch (e) { /* noop */ }
          }
        });
      } catch (e) { /* noop */ }
    }
  }
  Channel.prototype._receive = function (data) {
    if (!data || data.__sender === this._id) { return; }
    for (var i = 0; i < this.handlers.length; i++) {
      try { this.handlers[i](data); } catch (e) { log('channel handler error:', e); }
    }
  };
  Channel.prototype._id = randomId(8);
  Channel.prototype.on = function (fn) { this.handlers.push(fn); };
  Channel.prototype.post = function (data) {
    try {
      data = data || {};
      data.__sender = this._id;
      data.__ts = Date.now();
      if (this._bc) { this._bc.postMessage(data); }
      else if (this._key) { storage.set(this._key, JSON.stringify(data)); }
    } catch (e) { log('channel post error:', e); }
  };
  NS.Channel = Channel;

  /* --------------------------- Helper lainnya --------------------------- */
  NS.formatMinutes = function (minutes) {
    var totalSec = Math.round(minutes * 60);
    var m = Math.floor(totalSec / 60), s = totalSec % 60;
    return (m > 0 ? m + ' menit ' : '') + (s > 0 ? s + ' detik' : (m > 0 ? '' : '0 detik'));
  };

  NS.setTimeoutMs = function () { return setTimeout; }; // kompatibilitas lama
  NS.isObject = function (v) { return v !== null && typeof v === 'object'; };

  /* ------------------------------------------------------------------
   * Objek agregat NS.utils — dipakai semua modul via `var U = NS.utils`.
   * Harus ada supaya modul lain tidak membaca undefined.
   * ------------------------------------------------------------------ */
  NS.utils = {
    log: log,
    warn: warn,
    onReady: onReady,
    throttle: throttle,
    storage: storage,
    matchesPath: matchesPath,
    isPublicPage: isPublicPage,
    isProtectedPage: isProtectedPage,
    randomId: randomId,
    nowIso: nowIso,
    sameOrigin: sameOrigin,
    normalizeUrl: normalizeUrl,
    toast: NS.toast,
    overlay: NS.overlay,
    closeOverlay: NS.closeOverlay,
    netFetch: NS.netFetch,
    Channel: NS.Channel,
    Interceptors: NS.Interceptors,
    formatMinutes: NS.formatMinutes,
    isObject: NS.isObject
  };

  log('utils siap');
})(window);
