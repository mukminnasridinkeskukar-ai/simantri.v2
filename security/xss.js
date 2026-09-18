/* ============================================================================
 * /security/xss.js — PROTEKSI XSS
 * ----------------------------------------------------------------------------
 * Lapisan perlindungan XSS di sisi browser (frontend). Cakupan:
 *  1. escapeHtml(text)     — keluarkan data sebagai teks murni (paling aman)
 *  2. sanitizeHtml(html)   — bila HTML memang diperlukan (pengumuman/komentar)
 *  3. safeText/safeHtml    — setter DOM yang aman (ganti innerHTML = ...)
 *  4. XSS_DOM_GUARD        — buang <script> yang disisipkan DINAMIS ke DOM
 *  5. safeFileName         — aman untuk nama file upload
 *
 * PENTING:
 *  - Input pengguna TIDAK diubah saat disimpan (escaping dilakukan saat
 *    OUTPUT). Mengubah input mentah bisa merusak data legitim.
 *  - Data dari sumber mana pun (form, URL, database, pengumuman, komentar,
 *    nama pengguna, data admin, upload) harus lewat helper ini saat
 *    dirender. Untuk HTML kompleks, gunakan DOMPurify (lebih lengkap).
 *  - Proteksi XSS server-side (escaping saat render framework, CSP, dan
 *    validasi upload) TETAP WAJIB — lihat README bagian Limitasi.
 * ==========================================================================*/
(function (global) {
  'use strict';

  var NS = global.AppSecurity = global.AppSecurity || {};
  var CFG = global.SECURITY_CONFIG || {};
  var log = NS.log || function () {};

  /* ------------------------------ escapeHtml ----------------------------- */
  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/`/g, '&#96;');
  }

  /* -------------------------------- URL aman ----------------------------- */
  // Blokir javascript:, vbscript:, data: (kecuali gambar bila diizinkan).
  function isSafeUrl(url) {
    var u = String(url == null ? '' : url).trim();
    if (!u) { return true; }                       // kosong = tidak berbahaya
    var lower = u.toLowerCase().replace(/[\s\x00-\x1f]/g, '');
    if (/^(javascript|vbscript|file|about):/.test(lower)) { return false; }
    if (/^data:/.test(lower) && !/^data:image\/(png|gif|jpe?g|webp);/i.test(lower)) { return false; }
    return true;
  }

  /* ----------------------------- sanitizeHtml ---------------------------- */
  var ALLOWED_TAGS = {
    a: true, b: true, i: true, em: true, strong: true, u: true, s: true,
    p: true, br: true, hr: true, span: true, div: true,
    ul: true, ol: true, li: true, blockquote: true, code: true, pre: true,
    h1: true, h2: true, h3: true, h4: true, h5: true, h6: true,
    table: true, thead: true, tbody: true, tfoot: true, tr: true,
    td: true, th: true, img: true
  };
  var ALLOWED_ATTRS = { href: true, src: true, alt: true, title: true, colspan: true, rowspan: true };
  var VOID_TAGS = { br: true, hr: true, img: true };

  function sanitizeNode(node, out) {
    for (var child = node.firstChild; child; child = child.nextSibling) {
      if (child.nodeType === 3) {                       // text
        out.push(escapeHtml(child.nodeValue));
        continue;
      }
      if (child.nodeType !== 1) { continue; }           // komentar dll: buang
      var tag = child.nodeName.toLowerCase();
      if (!ALLOWED_TAGS[tag]) {                          // script/iframe/style/... : buang
        continue;
      }
      var attrs = '';
      try {
        for (var i = 0; i < child.attributes.length; i++) {
          var attr = child.attributes[i];
          var name = attr.name.toLowerCase();
          if (!ALLOWED_ATTRS[name]) { continue; }        // on*, style, dsb: buang
          var value = attr.value;
          if ((name === 'href' || name === 'src') && !isSafeUrl(value)) { continue; }
          attrs += ' ' + name + '="' + escapeHtml(value) + '"';
        }
      } catch (e) { /* noop */ }
      if (VOID_TAGS[tag]) {
        out.push('<' + tag + attrs + '>');
      } else {
        out.push('<' + tag + attrs + '>');
        sanitizeNode(child, out);
        out.push('</' + tag + '>');
      }
    }
  }

  function sanitizeHtml(html) {
    if (CFG.XSS_PROTECTION === false) { return html; }
    try {
      var parsed = new DOMParser().parseFromString(String(html == null ? '' : html), 'text/html');
      var out = [];
      sanitizeNode(parsed.body, out);
      return out.join('');
    } catch (e) {
      log('sanitizeHtml gagal, fallback escape:', e && e.message);
      return escapeHtml(html);
    }
  }

  /* --------------------------- Setter DOM aman --------------------------- */
  // Pengganti innerHTML — gunakan di seluruh aplikasi untuk data eksternal.
  function safeText(el, text) {
    if (!el) { return el; }
    try { el.textContent = text == null ? '' : String(text); } catch (e) { /* noop */ }
    return el;
  }
  function safeHtml(el, html) {
    if (!el) { return el; }
    try { el.innerHTML = sanitizeHtml(html); } catch (e) { /* noop */ }
    return el;
  }

  /* ------------------------------ DOM guard ------------------------------ */
  // Hanya menyentuh node yang DIBUAT SETELAH halaman siap — script statis
  // milik aplikasi existing tidak pernah disentuh.
  function installDomGuard() {
    if (typeof MutationObserver === 'undefined') { return; }
    try {
      var observer = new MutationObserver(function (mutations) {
        for (var m = 0; m < mutations.length; m++) {
          var added = mutations[m].addedNodes;
          if (!added) { continue; }
          for (var i = 0; i < added.length; i++) {
            var node = added[i];
            if (!node || node.nodeType !== 1) { continue; }
            var tag = node.nodeName.toLowerCase();
            if (tag === 'script') {
              var src = (node.getAttribute && node.getAttribute('src')) || '';
              log('DOM guard: <script> dinamis dihapus', src || '(inline)');
              if (node.parentNode) { node.parentNode.removeChild(node); }
            } else if (tag === 'iframe' || tag === 'object' || tag === 'embed') {
              var u = (node.getAttribute && node.getAttribute('src')) || '';
              if (!isSafeUrl(u)) {
                log('DOM guard: embed berbahaya dihapus:', u);
                if (node.parentNode) { node.parentNode.removeChild(node); }
              }
            } else if (node.querySelectorAll) {
              // script bersarang di dalam fragmen yang disisipkan
              var nested = node.querySelectorAll('script');
              for (var j = 0; j < nested.length; j++) {
                if (nested[j].parentNode) { nested[j].parentNode.removeChild(nested[j]); }
              }
            }
          }
        }
      });
      observer.observe(document.documentElement || document, { childList: true, subtree: true });
    } catch (e) { log('DOM guard gagal:', e && e.message); }
  }

  /* ----------------------------- Nama file ------------------------------- */
  // Untuk upload: buang path traversal & karakter berbahaya dari NAMA file.
  // Validasi tipe/ukuran/konten file tetap WAJIB dilakukan di server.
  function safeFileName(name) {
    var base = String(name == null ? '' : name);
    base = base.split(/[\\/]/).pop();                 // buang komponen direktori
    base = base.replace(/[\x00-\x1f]/g, '');          // kontrol chars
    base = base.replace(/^[.\s]+/, '');               // awalan titik (hidden)
    base = base.replace(/[<>:"|?*]/g, '_');           // karakter ilegal
    return base.slice(0, 180) || 'file';
  }

  /* -------------------------------- Init --------------------------------- */
  function init() {
    if (CFG.XSS_PROTECTION !== false && CFG.XSS_DOM_GUARD !== false) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', installDomGuard, { once: true });
      } else {
        installDomGuard();
      }
    }
    log('xss siap');
  }

  NS.XSS = {
    init: init,
    escapeHtml: escapeHtml,
    sanitizeHtml: sanitizeHtml,
    isSafeUrl: isSafeUrl,
    safeText: safeText,
    safeHtml: safeHtml,
    safeFileName: safeFileName
  };
})(window);
