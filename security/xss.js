/**
 * ============================================================
 * SECURITY MODULE - xss.js
 * ============================================================
 * FITUR 7: Proteksi XSS (defense-in-depth di sisi browser).
 *
 * Utilitas yang tersedia:
 * - escapeHTML(text)  : escape karakter berbahaya untuk konteks HTML
 * - safeText(el, txt) : tulis teks aman memakai textContent
 * - safeHTML(el, html): tulis HTML SETELAH disanitasi
 * - safeURL(url)      : validasi URL (tolak javascript:, data:, vbscript:)
 * - sanitizeHTML(dirty): bersihkan string HTML via allowlist
 *
 * KEJUJURAN ARSITEKTUR (WAJIB DIPAHAMI):
 * - Perlindungan XSS utama adalah ENCODING OUTPUT DI SERVER dan
 *   CSP. Modul ini adalah lapisan PENDUKUNG untuk kode front-end
 *   yang menulis ke DOM (terutama konten dari pengguna/URL/database).
 * - Sanitizer bawaan sengaja KONSERVATIF. Untuk kebutuhan HTML
 *   kaya, gunakan DOMPurify (modul otomatis memakainya jika ada
 *   di window.DOMPurify).
 * ============================================================
 */

import { isBrowser } from './utils.js';

let config = null;
let auditWarnFn = null;

export function initXss(cfg, hooks = {}) {
  config = cfg;
  auditWarnFn = hooks.auditWarn || null;
  if (!config?.XSS?.enabled) return;

  if (config.XSS.warnOnDangerousAPI) {
    warnDangerousAPIs();
  }
}

/** Escape string untuk konteks elemen/atribut HTML. */
export function escapeHTML(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Tulis teks ke elemen dengan cara AMAN (textContent).
 * Ini adalah metode yang direkomendasikan untuk SEMUA data dinamis.
 */
export function safeText(el, text) {
  if (!el) return;
  el.textContent = String(text ?? '');
}

/** URL aman untuk atribut href/src; kembalikan '#' jika berbahaya. */
export function safeURL(url) {
  const s = String(url ?? '').trim();
  const dangerous = /^(javascript|data(?!:image\/(png|jpeg|gif|webp))|vbscript|file):/i;
  if (dangerous.test(s.replace(/\s+/g, ''))) return '#';
  // Protokol relatif // dan http(s), mailto, tel, anchor, path relatif: diizinkan
  return s;
}

/**
 * Tulis HTML ke elemen SETELAH disanitasi.
 * Memakai DOMPurify jika tersedia (direkomendasikan), jika tidak
 * memakai sanitizer allowlist bawaan.
 */
export function safeHTML(el, dirtyHTML) {
  if (!el) return;
  if (isBrowser() && window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
    el.innerHTML = window.DOMPurify.sanitize(dirtyHTML);
    return;
  }
  el.innerHTML = sanitizeHTML(dirtyHTML);
}

/**
 * Sanitizer allowlist bawaan.
 * Hanya tag & atribut dalam XSS.allowedTags / XSS.allowedAttrs
 * yang dipertahankan; semua yang lain (script, iframe, handler
 * on*, javascript:, dst.) dibuang.
 */
export function sanitizeHTML(dirty) {
  if (!isBrowser()) return String(dirty ?? '');
  const allowedTags = new Set((config?.XSS?.allowedTags || []).map((t) => t.toLowerCase()));
  const allowedAttrs = new Set((config?.XSS?.allowedAttrs || []).map((a) => a.toLowerCase()));

  const doc = new DOMParser().parseFromString(String(dirty ?? ''), 'text/html');
  clean(doc.body);
  return doc.body.innerHTML;

  function clean(node) {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) continue;

      if (child.nodeType !== Node.ELEMENT_NODE) {
        child.remove(); // komentar, doctype, dll.
        continue;
      }

      const tag = child.tagName.toLowerCase();
      if (!allowedTags.has(tag)) {
        // Ganti dengan isi teksnya (bukan hapus total, agar konten tidak hilang semua)
        const text = document.createTextNode(child.textContent || '');
        child.replaceWith(text);
        continue;
      }

      // Bersihkan atribut
      for (const attr of Array.from(child.attributes)) {
        const name = attr.name.toLowerCase();
        const isAllowed = allowedAttrs.has(name) && !name.startsWith('on');
        if (!isAllowed) {
          child.removeAttribute(attr.name);
          continue;
        }
        if (name === 'href' || name === 'src') {
          const safe = safeURL(attr.value);
          if (safe === '#') child.removeAttribute(attr.name);
          else child.setAttribute(name, safe);
        }
      }

      // Hapus <a target="_blank"> tanpa rel noopener (reverse tabnabbing)
      if (tag === 'a' && child.getAttribute('target') === '_blank') {
        child.setAttribute('rel', 'noopener noreferrer');
      }

      clean(child);
    }
  }
}

/**
 * Sanitasi input form (normalisasi + buang karakter kontrol).
 * CATATAN: ini BUKAN pengganti validasi/encoding server.
 */
export function sanitizeInput(str) {
  // eslint-disable-next-line no-control-regex
  return String(str ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

/**
 * (Opsional, mode dev) Peringatkan setiap penggunaan API berbahaya
 * yang masih ada di kode aplikasi: innerHTML, outerHTML, document.write.
 * Tidak mengubah perilaku - hanya console.warn (mode audit).
 */
function warnDangerousAPIs() {
  try {
    const warn = (prop) => {
      const proto = Object.getPrototypeOf(document.body);
      const desc = Object.getOwnPropertyDescriptor(prop.includes('Element') ? Element.prototype : proto, prop);
      if (!desc || !desc.set) return;
      Object.defineProperty(prop.includes('Element') ? Element.prototype : proto, prop, {
        ...desc,
        set(value) {
          console.warn(`[security] Penggunaan ${prop} terdeteksi - pastikan kontennya disanitasi:`, value);
          if (typeof auditWarnFn === 'function') auditWarnFn({ api: prop });
          return desc.set.call(this, value);
        },
      });
    };
    warn('innerHTML');
    warn('outerHTML');
  } catch { // lingkungan tidak mendukung - abaikan
  }
}
