/**
 * ============================================================
 * SECURITY MODULE - csrf.js
 * ============================================================
 * FITUR 8: Proteksi CSRF (double-submit cookie).
 *
 * Cara kerja:
 * 1. Pastikan cookie CSRF acak ada (dibuat lokal, HttpOnly tidak
 *    mungkin dari JS - server sebaiknya mengatur cookie aslinya).
 * 2. Patch window.fetch & XMLHttpRequest agar otomatis menyertakan
 *    header X-CSRF-Token pada request MUTASI same-origin.
 * 3. Server (security-server.js / backend Anda) membandingkan
 *    header vs cookie -> cocok baru diproses.
 *
 * KEJUJURAN ARSITEKTUR:
 * - Hanya relevan untuk autentikasi berbasis cookie. Jika aplikasi
 *   memakai Authorization header (Bearer), CSRF tidak menjadi
 *   vektor utama - modul tetap aman dipasang.
 * - Patch dibuat selektif (same-origin saja) agar TIDAK
 *   mengganggu API pihak ketiga yang sudah ada.
 * ============================================================
 */

import { generateId, isBrowser } from './utils.js';

let config = null;
let patched = false;

export function initCsrf(cfg) {
  if (!isBrowser() || patched) return;
  config = cfg;
  if (!config.CSRF.enabled) return;
  getCsrfToken(); // pastikan cookie token CSRF sudah ada sejak awal
  patchFetch();
  patchXHR();
  patched = true;
}

/** Ambil token CSRF (buat jika belum ada). */
export function getCsrfToken() {
  if (!isBrowser()) return '';
  let token = readCookie(config?.CSRF?.cookieName || 'sec_csrf');
  if (!token) {
    token = generateId(32);
    // Cookie dibaca JS (bukan HttpOnly) karena pola double-submit.
    // Keamanan token ini tidak rahasia - yang penting server
    // membandingkan cookie vs header (attacker situs lain tidak
    // bisa MEMBACA cookie -> tidak bisa menempel header).
    document.cookie = `${config?.CSRF?.cookieName || 'sec_csrf'}=${token}; path=/; SameSite=Lax`;
  }
  return token;
}

/**
 * Wrapper fetch yang PASTI menyertakan header CSRF
 * (untuk kode baru; fetch global sudah dipatch otomatis).
 */
export function secureFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set(config?.CSRF?.headerName || 'X-CSRF-Token', getCsrfToken());
  return fetch(url, { ...options, headers, credentials: options.credentials || 'same-origin' });
}

// ------------------------------------------------------------ internal ----

function readCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name.replace(/[-_]/g, '\\$&') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function isSameOrigin(url) {
  try {
    const u = new URL(url, location.href);
    return u.origin === location.origin;
  } catch { return false; }
}

function needsCsrfHeader(url, method) {
  if (!config?.CSRF?.enabled) return false;
  const m = (method || 'GET').toUpperCase();
  if (!config.CSRF.protectedMethods.includes(m)) return false;
  if (!isSameOrigin(url)) return false; // API pihak ketiga: jangan disentuh
  return true;
}

function patchFetch() {
  if (typeof window.fetch !== 'function') return;
  const originalFetch = window.fetch.bind(window);
  const headerName = config.CSRF.headerName;

  window.fetch = function patchedFetch(input, init) {
    try {
      let url = '';
      let method = init?.method;

      if (typeof input === 'string' || input instanceof URL) {
        url = String(input);
      } else if (input instanceof Request) {
        url = input.url;
        method = method || input.method;
      }

      if (needsCsrfHeader(url, method)) {
        init = init ? { ...init } : {};
        const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
        if (!headers.has(headerName)) {
          headers.set(headerName, getCsrfToken());
        }
        init.headers = headers;
      }
    } catch { /* bermasalah? lanjutkan tanpa header - jangan pecahkan aplikasi */ }

    return originalFetch(input, init);
  };
}

function patchXHR() {
  if (typeof XMLHttpRequest === 'undefined') return;
  const headerName = config.CSRF.headerName;
  const origOpen = XMLHttpRequest.prototype.open;

  XMLHttpRequest.prototype.open = function patchedOpen(method, url, ...rest) {
    this.__secUrl = url;
    this.__secMethod = method;
    return origOpen.call(this, method, url, ...rest);
  };

  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function patchedSend(body) {
    try {
      if (needsCsrfHeader(this.__secUrl, this.__secMethod)) {
        this.setRequestHeader(headerName, getCsrfToken());
      }
    } catch { /* noop */ }
    return origSend.call(this, body);
  };
}
