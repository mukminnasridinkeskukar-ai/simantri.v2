/**
 * ============================================================
 * SECURITY MODULE - security-headers.js
 * ============================================================
 * FITUR 9: Security headers.
 *
 * KEJUJURAN ARSITEKTUR (PENTING):
 * Header keamanan yang EFEKTIF (CSP, HSTS, X-Content-Type-Options,
 * Referrer-Policy, Permissions-Policy, frame-ancestors) harus
 * dipasang DI LEVEL SERVER sebagai HTTP response header.
 * <meta http-equiv> hanya mengatasi sebagian direktif dan TIDAK
 * menggantikan header asli.
 *
 * Modul ini menyediakan:
 * - getMetaTagsHTML(): generator meta tag (untuk aplikasi statis)
 * - injectMetaCSP(): opsi konfigurasi (default MATI agar tidak
 *   merusak aplikasi yang sudah berjalan)
 * - Konfigurasi header server ada di server/security-server.js
 *   dan contoh Express/Nginx ada di README.
 * ============================================================
 */

import { isBrowser } from './utils.js';

let config = null;

export function initSecurityHeaders(cfg) {
  config = cfg;
  if (!config?.HEADERS?.enabled) return;
  if (config.HEADERS.injectMetaCSP) {
    injectMetaCSP(config.HEADERS.csp);
  }
}

/**
 * Suntikkan meta CSP ke <head> halaman.
 * Default MATI (HEADERS.injectMetaCSP = false) karena meta CSP
 * tidak mendukung frame-ancestors, report-uri, dsb., dan bisa
 * merusak aplikasi yang memakai inline script.
 */
export function injectMetaCSP(csp) {
  if (!isBrowser() || !csp) return;
  if (document.querySelector('meta[http-equiv="Content-Security-Policy"]')) return; // jangan dobel
  const meta = document.createElement('meta');
  meta.setAttribute('http-equiv', 'Content-Security-Policy');
  meta.setAttribute('content', csp);
  document.head.appendChild(meta);
}

/**
 * Hasilkan string meta tag untuk ditempel manual di <head> HTML.
 * Berguna untuk situs statis tanpa akses server.
 */
export function getMetaTagsHTML() {
  const csp = config?.HEADERS?.csp ||
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'";
  return [
    `<meta http-equiv="Content-Security-Policy" content="${csp}">`,
    '<meta name="referrer" content="strict-origin-when-cross-origin">',
  ].join('\n  ');
}

/**
 * Daftar header yang WAJIB dipasang di server (panduan + pemakaian
 * oleh security-server.js). Dirangkum di sini agar ada satu
 * sumber kebenaran.
 */
export const REQUIRED_SERVER_HEADERS = Object.freeze({
  'Content-Security-Policy': 'default-src \'self\'; ... (sesuaikan dengan aplikasi Anda)',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  // Catatan: frame-ancestors 'none' pada CSP modern menggantikan X-Frame-Options
});
