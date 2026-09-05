/* ============================================================================
 * SIMANTRI v3 — Utility functions
 * Plain JS (no modules). Attach ke window.SIMANTRI_UTILS
 * ============================================================================ */

(function () {
  'use strict';

  const utils = {
    /** Format tanggal ID — "5 Sep 2026" */
    fmtDate(iso, opts) {
      opts = opts || { day: 'numeric', month: 'short', year: 'numeric' };
      if (!iso) return '-';
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '-';
      return new Intl.DateTimeFormat('id-ID', opts).format(d);
    },

    /** Format tanggal lengkap — "5 September 2026" */
    fmtDateLong(iso) {
      return utils.fmtDate(iso, { day: 'numeric', month: 'long', year: 'numeric' });
    },

    /** Hitung hari sampai tanggal akhir. Negative = sudah lewat. */
    daysUntil(iso) {
      if (!iso) return null;
      const end = new Date(iso);
      end.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return Math.round((end.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
    },

    /** "23 hari lagi" / "3 hari lalu" / "hari ini" */
    relativeFromNow(iso) {
      const d = utils.daysUntil(iso);
      if (d === null) return '-';
      if (d === 0) return 'hari ini';
      if (d > 0) return d + ' hari lagi';
      return (-d) + ' hari lalu';
    },

    /** Inisial nama — "Budi Santoso" → "BS" */
    initials(name) {
      if (!name) return '?';
      return name.trim().split(/\s+/).slice(0, 2).map(function (s) { return (s[0] || '').toUpperCase(); }).join('');
    },

    /** Avatar warna deterministik berdasarkan string */
    avatarColor(seed) {
      seed = seed || '';
      const colors = [
        'bg-teal-600', 'bg-lime-500', 'bg-amber-500', 'bg-rose-500',
        'bg-ink-700', 'bg-teal-700', 'bg-lime-600',
      ];
      let h = 0;
      for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
      return colors[h % colors.length];
    },

    /** Debounce */
    debounce(fn, wait) {
      wait = wait || 250;
      let t;
      return function () {
        const ctx = this, args = arguments;
        clearTimeout(t);
        t = setTimeout(function () { fn.apply(ctx, args); }, wait);
      };
    },

    /** Escape HTML — prevent XSS */
    escapeHtml(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    /** Toast notification */
    toast(message, type, duration) {
      type = type || 'info';
      duration = duration || 3500;
      const portal = document.getElementById('toast-portal');
      if (!portal) return;
      const styles = {
        info: 'background:#1E293B;color:white;',
        success: 'background:#0D9488;color:white;',
        warning: 'background:#F59E0B;color:#0F172A;',
        error: 'background:#F43F5E;color:white;',
      };
      const icons = {
        info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        success: 'M5 13l4 4L19 7',
        warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
        error: 'M6 18L18 6M6 6l12 12',
      };
      const el = document.createElement('div');
      el.setAttribute('style', styles[type] + 'padding:0.75rem 1rem;border-radius:0.75rem;box-shadow:0 10px 30px -10px rgba(15,23,42,0.10);font-size:0.875rem;font-weight:500;display:flex;align-items:center;gap:0.625rem;max-width:24rem;animation:fadeIn 0.4s cubic-bezier(0.16,1,0.3,1) both;');
      el.innerHTML =
        '<svg style="width:1.25rem;height:1.25rem;flex-shrink:0;" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="' + icons[type] + '"/></svg>' +
        '<span style="flex:1;">' + utils.escapeHtml(message) + '</span>';
      portal.appendChild(el);
      setTimeout(function () {
        el.style.opacity = '0';
        el.style.transform = 'translateY(8px)';
        el.style.transition = 'all .25s';
        setTimeout(function () { el.remove(); }, 250);
      }, duration);
    },

    /** Format angka ribuan — 12000 → "12.000" */
    fmtNumber(n) {
      return new Intl.NumberFormat('id-ID').format(n || 0);
    },

    /** Progress % — clamp 0..100 */
    progressPercent(start, end) {
      if (!start || !end) return 0;
      const s = new Date(start).getTime();
      const e = new Date(end).getTime();
      const now = Date.now();
      if (e <= s) return 0;
      const pct = ((now - s) / (e - s)) * 100;
      return Math.max(0, Math.min(100, Math.round(pct)));
    },

    /** Class warna progress bar berdasarkan % */
    progressColorClass(pct) {
      if (pct >= 80) return 'bg-rose-500';
      if (pct >= 60) return 'bg-amber-500';
      return 'bg-teal-500';
    },

    /** Progress warna hex (untuk inline style) */
    progressColorHex(pct) {
      if (pct >= 80) return '#F43F5E';
      if (pct >= 60) return '#F59E0B';
      return '#14B8A6';
    },

    /** ID unik singkat */
    uid(prefix) {
      prefix = prefix || 'id';
      return prefix + '_' + Math.random().toString(36).slice(2, 9);
    },

    /** Query string parser */
    parseQuery(qs) {
      const params = {};
      (qs || window.location.search || '').replace(/^\?/, '').split('&').forEach(function (pair) {
        if (!pair) return;
        const [k, v] = pair.split('=');
        params[decodeURIComponent(k)] = decodeURIComponent(v || '');
      });
      return params;
    },

    /** Validate email format */
    isEmail(s) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s || '');
    },

    /** Download text as file (for CSV export) */
    downloadFile(filename, content, mime) {
      mime = mime || 'text/plain';
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 100);
    },
  };

  window.SIMANTRI_UTILS = utils;
})();
