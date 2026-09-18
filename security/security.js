/**
 * ============================================================
 * SECURITY MODULE - security.js  (SATU-SATUNYA TITIK MASUK)
 * ============================================================
 * CARA PAKAI (1 baris di entry point aplikasi):
 *
 *   <script type="module">
 *     import { initSecurity } from '/security/security.js';
 *     initSecurity();
 *   </script>
 *
 * Dengan override (opsional):
 *   initSecurity({ INACTIVITY_TIMEOUT: 10 * 60 * 1000 })
 *
 * TANPA SECURITY_ENABLED = true, tidak ada file lain yang
 * dijalankan. Mematikan seluruh modul cukup dengan satu flag.
 * ============================================================
 */

import { configure, SECURITY_VERSION } from './config.js';
import { isBrowser } from './utils.js';

import { initAuditLog, audit, getAuditLogs, clearAuditLogs, flushAudit, AUDIT_EVENTS } from './audit-log.js';
import {
  initSessionSecurity, createSession, getActiveSession, isSessionValid,
  getSessionRemainingMs, rotateSession, endSession, claimSessionForTab,
} from './session.js';
import {
  initAutoLogout, resetInactivityTimer, getRemainingMs, pauseAutoLogout, resumeAutoLogout,
} from './auto-logout.js';
import {
  initLoginProtection, checkLoginAllowed, recordLoginFailure, recordLoginSuccess,
  getLoginStatus, getBlockedMessage, attachLoginForm,
} from './login-protection.js';
import { initTabProtection } from './tab-protection.js';
import { initBrowserSession } from './browser-session.js';
import { initAccessControl, canAccess, isProtectedPath } from './access-control.js';
import { initCsrf, getCsrfToken, secureFetch } from './csrf.js';
import {
  initXss, escapeHTML, safeText, safeHTML, safeURL, sanitizeHTML, sanitizeInput,
} from './xss.js';
import { initSecurityHeaders, getMetaTagsHTML } from './security-headers.js';

let booted = false;
let API = null;

/**
 * Inisialisasi seluruh modul keamanan.
 * @param {object} userConfig - override konfigurasi (opsional)
 * @returns {object} API publik modul
 */
export function initSecurity(userConfig = {}) {
  const config = configure(userConfig);
  const api = { version: SECURITY_VERSION, enabled: false, config };

  // Master switch: satu flag mematikan SEMUA fitur.
  if (!config.SECURITY_ENABLED) {
    return api;
  }

  // Lingkungan non-browser (SSR/node script): modul pasif, tidak error.
  if (!isBrowser()) {
    return api;
  }

  if (!booted) {
    booted = true;

    // Urutan penting:
    initAuditLog(config);        // 1. audit siap lebih dulu (modul lain mencatat)
    initSessionSecurity(config); // 2. fondasi sesi
    initLoginProtection(config); // 3. penghitung gagal login
    initTabProtection(config);   // 4. tab ini klaim sesi (tab baru sah)
    initBrowserSession(config);  // 5. deteksi sesi diganti/dicabut
    initAccessControl(config);   // 6. gerbang halaman terlindungi
    initAutoLogout(config);      // 7. timer tidak-aktif
    initCsrf(config);            // 8. patch fetch/XHR (same-origin saja)
    initXss(config, {            // 9. utilitas XSS (dengan audit untuk mode dev)
      auditWarn: (d) => audit(AUDIT_EVENTS.SENSITIVE_ACTION, { action: 'DANGEROUS_API_USED', ...d }),
    });
    initSecurityHeaders(config); // 10. meta CSP (opsional)
  }

  // ---------- API publik (satu pintu untuk seluruh aplikasi) ----------
  api.enabled = true;
  api.session = {
    create: createSession,            // panggil SETELAH login server sukses
    get: getActiveSession,
    isValid: isSessionValid,
    remainingMs: getSessionRemainingMs,
    rotate: rotateSession,
    claimTab: claimSessionForTab,
    logout: (reason = 'LOGOUT', opts = {}) => endSession(reason, opts),
  };
  api.login = {
    checkAllowed: checkLoginAllowed,  // panggil SEBELUM kirim kredensial
    recordFailure: recordLoginFailure, // panggil saat server menolak
    recordSuccess: recordLoginSuccess,
    getStatus: getLoginStatus,
    getBlockedMessage,
    attachForm: attachLoginForm,
  };
  api.audit = {
    log: audit,
    events: AUDIT_EVENTS,
    get: getAuditLogs,
    flush: flushAudit,
    clear: clearAuditLogs,
  };
  api.autoLogout = {
    reset: resetInactivityTimer,
    getRemainingMs,
    pause: pauseAutoLogout,
    resume: resumeAutoLogout,
  };
  api.access = { canAccess, isProtectedPath };
  api.xss = { escapeHTML, safeText, safeHTML, safeURL, sanitizeHTML, sanitizeInput };
  api.csrf = { getToken: getCsrfToken, secureFetch };
  api.headers = { getMetaTagsHTML };

  // Pintu debug global (read-only untuk aplikasi; TIDAK ada mekanisme bypass)
  try {
    window.SecurityAPI = Object.freeze(api);
  } catch { /* noop */ }

  return api;
}

/** Akses API bila modul sudah pernah diinisialisasi. */
export function getSecurityAPI() {
  return API || (typeof window !== 'undefined' ? window.SecurityAPI : null) || null;
}

export default initSecurity;
