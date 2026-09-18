/**
 * ============================================================
 * SECURITY MODULE - access-control.js
 * ============================================================
 * FITUR 6: Kontrol akses halaman.
 * - Halaman dalam PROTECTED_ROUTES wajib memiliki sesi valid;
 *   jika tidak -> redirect ke LOGIN_PAGE dengan parameter ?next=
 *   agar pengguna kembali ke halaman semula setelah login.
 * - Halaman dalam ADMIN_ROUTES wajib role 'admin'.
 *
 * KEJUJURAN ARSITEKTUR (WAJIB DIBACA):
 * Pemeriksaan di browser HANYA lapisan UX. Siapa pun dapat
 * membuka DevTools. Perlindungan SEBENARNYA wajib di server:
 * setiap API/halaman terlindungi harus memverifikasi sesi
 * (cookie/JWT) di backend. Gunakan server/security-server.js
 * (verifySession) atau middleware autentikasi yang sudah ada.
 * ============================================================
 */

import { isBrowser } from './utils.js';
import { audit, AUDIT_EVENTS } from './audit-log.js';
import { isSessionValid, getActiveSession } from './session.js';

let config = null;

export function initAccessControl(cfg) {
  config = cfg;
  if (!isBrowser()) return;

  const path = window.location.pathname;

  // Gerbang 1: halaman terlindungi butuh sesi valid
  if (isProtectedPath(path) && !isSessionValid()) {
    audit(AUDIT_EVENTS.SENSITIVE_ACTION, {
      action: 'ACCESS_DENIED',
      path,
      reason: 'NO_VALID_SESSION',
    });
    redirectToLogin();
    return;
  }

  // Gerbang 2: halaman admin butuh role admin
  if (isAdminPath(path)) {
    const session = getActiveSession();
    if (session && isSessionValid() && session.role !== 'admin') {
      audit(AUDIT_EVENTS.SENSITIVE_ACTION, {
        action: 'ADMIN_ACCESS_DENIED',
        path,
        role: session.role,
      });
      showForbidden();
    }
  }
}

/** Apakah path masuk daftar halaman terlindungi? */
export function isProtectedPath(path) {
  if (!config) return false;
  return config.PROTECTED_ROUTES.some((route) => {
    const r = String(route);
    return path === r || path.startsWith(r + '/') || path === r + '/' || path.endsWith(r);
  });
}

/** Apakah path masuk daftar halaman admin? */
export function isAdminPath(path) {
  if (!config) return false;
  return config.ADMIN_ROUTES.some((route) => {
    const r = String(route);
    return path === r || path.startsWith(r + '/') || path === r + '/' || path.endsWith(r);
  });
}

/**
 * Boleh akses path ini dengan sesi saat ini? (untuk menu/nav UI)
 * @returns {boolean}
 */
export function canAccess(path) {
  if (!config) return true;
  if (!isProtectedPath(path)) return true;
  if (!isSessionValid()) return false;
  if (isAdminPath(path)) {
    const s = getActiveSession();
    return !!s && s.role === 'admin';
  }
  return true;
}

// ------------------------------------------------------------ internal ----

function redirectToLogin() {
  if (!isBrowser() || !config) return;
  try {
    const url = new URL(config.LOGIN_PAGE, window.location.origin);
    url.searchParams.set('reason', 'login_required');
    // Simpan tujuan awal agar setelah login bisa kembali
    url.searchParams.set('next', window.location.pathname + window.location.search);
    window.location.replace(url.toString());
  } catch {
    window.location.replace(config.LOGIN_PAGE);
  }
}

function showForbidden() {
  const message = config?.MESSAGES?.ACCESS_FORBIDDEN || 'Akses ditolak.';
  // Tampilkan pesan, lalu kembalikan pengguna ke halaman sebelumnya
  const overlay = document.createElement('div');
  overlay.setAttribute('data-security-overlay', 'true');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.55);';
  const box = document.createElement('div');
  box.style.cssText = 'background:#fff;border-radius:12px;padding:32px;max-width:420px;text-align:center;font-family:system-ui,sans-serif;';
  const title = document.createElement('div');
  title.textContent = 'Akses Ditolak';
  title.style.cssText = 'font-size:20px;font-weight:700;color:#8a1a12;margin-bottom:10px;';
  const msg = document.createElement('div');
  msg.textContent = message; // textContent = aman
  msg.style.cssText = 'font-size:14px;color:#444;line-height:1.6;';
  box.appendChild(title);
  box.appendChild(msg);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  setTimeout(() => {
    if (window.history.length > 1) window.history.back();
    else window.location.replace('/');
  }, 2500);
}
