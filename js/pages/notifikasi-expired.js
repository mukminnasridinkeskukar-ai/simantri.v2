/* ============================================================================
 * SIMANTRI v3 — Page: Notifikasi Expired (read-only for all roles)
 * Schema v1.1 — derived from profil_sdmk where status_str='Expired' or
 * tgl_berakhir_sip < today. Each notification tagged "STR EXPIRED" or
 * "SIP EXPIRED".
 * ============================================================================ */

(function () {
  'use strict';

  window.SIMANTRI_PAGES = window.SIMANTRI_PAGES || {};

  window.SIMANTRI_PAGES['notifikasi-expired'] = {
    html: function () {
      return ''
        + '<div class="space-y-6">'
        +   '<div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">'
        +     '<div>'
        +       '<h2 class="text-2xl font-extrabold text-ink-900 tracking-tight">Notifikasi Expired</h2>'
        +       '<p class="mt-1 text-sm text-ink-500 max-w-2xl">Daftar SDMK dengan STR atau SIP yang sudah expired. Segera lakukan perpanjangan dokumen.</p>'
        +     '</div>'
        +     '<button class="btn btn-outline btn-sm" data-action="refresh" type="button">'
        +       '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>'
        +       'Refresh'
        +     '</button>'
        +   '</div>'

        // Banner summary
        +   '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">'
        +     '<div class="card p-5 border-l-4" style="border-left-color:#F43F5E;">'
        +       '<div class="flex items-center justify-between">'
        +         '<div>'
        +           '<p class="text-xs font-semibold text-ink-500 uppercase tracking-wider">STR Expired</p>'
        +           '<p class="mt-2 text-3xl font-extrabold text-rose-600 tabular-nums" id="ne-str-count">0</p>'
        +           '<p class="text-xs text-ink-500 mt-1">SDMK dengan STR kadaluarsa</p>'
        +         '</div>'
        +         '<div class="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">'
        +           '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>'
        +         '</div>'
        +       '</div>'
        +     '</div>'
        +     '<div class="card p-5 border-l-4" style="border-left-color:#F59E0B;">'
        +       '<div class="flex items-center justify-between">'
        +         '<div>'
        +           '<p class="text-xs font-semibold text-ink-500 uppercase tracking-wider">SIP Expired</p>'
        +           '<p class="mt-2 text-3xl font-extrabold text-amber-600 tabular-nums" id="ne-sip-count">0</p>'
        +           '<p class="text-xs text-ink-500 mt-1">SDMK dengan SIP kadaluarsa</p>'
        +         '</div>'
        +         '<div class="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">'
        +           '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
        +         '</div>'
        +       '</div>'
        +     '</div>'
        +   '</div>'

        // List
        +   '<div id="ne-list" class="space-y-3">'
        +     '<div class="skeleton h-20"></div>'
        +     '<div class="skeleton h-20"></div>'
        +     '<div class="skeleton h-20"></div>'
        +   '</div>'
        + '</div>';
    },

    init: async function () {
      const utils = window.SIMANTRI_UTILS;
      const data = window.SIMANTRI_DATA;

      const refreshBtn = document.querySelector('[data-action="refresh"]');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', async function () {
          utils.toast('Memuat ulang data...', 'info');
          await render();
        });
      }

      async function render() {
        const container = document.getElementById('ne-list');
        if (!container) return;
        container.innerHTML = '<div class="skeleton h-20"></div><div class="skeleton h-20"></div>';
        try {
          const items = await data.loadExpiredNotifications();
          // Banner counts
          const strCount = items.filter(function (it) { return it.type === 'str_expired'; }).length;
          const sipCount = items.filter(function (it) { return it.type === 'sip_expired'; }).length;
          const strEl = document.getElementById('ne-str-count');
          const sipEl = document.getElementById('ne-sip-count');
          if (strEl) strEl.textContent = strCount;
          if (sipEl) sipEl.textContent = sipCount;

          if (!items.length) {
            container.innerHTML = emptyState('Tidak ada notifikasi expired. Semua dokumen STR/SIP masih aktif.', 'shield-check');
            return;
          }

          // Sort: oldest expiring first
          items.sort(function (a, b) {
            return new Date(a.tgl_berakhir || 0) - new Date(b.tgl_berakhir || 0);
          });

          container.innerHTML = items.map(function (it) {
            const isStr = it.type === 'str_expired';
            const typeLabel = isStr ? 'STR EXPIRED' : 'SIP EXPIRED';
            const typeBadge = isStr ? 'badge-rose' : 'badge-amber';
            const days = utils.daysUntil(it.tgl_berakhir);
            const isPast = days !== null && days < 0;
            const statusLabel = isPast ? ('Expired ' + (-days) + ' hari lalu') : (days === 0 ? 'Hari ini' : 'H-' + days);
            const statusBadge = isPast ? 'badge-rose' : 'badge-amber';
            const iconBg = isStr ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600';
            const iconPath = isStr
              ? 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
              : 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';

            return '<div class="card p-4">'
                 +   '<div class="flex items-start gap-3">'
                 +     '<div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ' + iconBg + '">'
                 +       '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="' + iconPath + '"/></svg>'
                 +     '</div>'
                 +     '<div class="flex-1 min-w-0">'
                 +       '<div class="flex items-start justify-between gap-2 flex-wrap">'
                 +         '<div class="min-w-0">'
                 +           '<p class="text-sm font-bold text-ink-900 truncate">' + utils.escapeHtml(it.nama || '-') + '</p>'
                 +           '<p class="text-xs text-ink-500 mt-0.5">' + utils.escapeHtml(it.profesi || '-') + ' &middot; ' + utils.escapeHtml(it.unit || '-') + '</p>'
                 +         '</div>'
                 +         '<span class="badge ' + typeBadge + '">' + typeLabel + '</span>'
                 +       '</div>'
                 +       '<div class="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">'
                 +         '<div>'
                 +           '<p class="text-ink-400 uppercase tracking-wide font-semibold">NIK</p>'
                 +           '<p class="text-ink-700 font-mono">' + utils.escapeHtml(it.nik || '-') + '</p>'
                 +         '</div>'
                 +         '<div>'
                 +           '<p class="text-ink-400 uppercase tracking-wide font-semibold">No. ' + (isStr ? 'STR' : 'SIP') + '</p>'
                 +           '<p class="text-ink-700 font-mono">' + utils.escapeHtml((isStr ? it.no_str : it.no_sip) || '-') + '</p>'
                 +         '</div>'
                 +         '<div>'
                 +           '<p class="text-ink-400 uppercase tracking-wide font-semibold">Tgl Berakhir</p>'
                 +           '<p class="text-ink-700">' + utils.fmtDate(it.tgl_berakhir) + '</p>'
                 +         '</div>'
                 +       '</div>'
                 +       '<div class="mt-3 flex items-center gap-2">'
                 +         '<span class="badge ' + statusBadge + '">' + statusLabel + '</span>'
                 +         '<span class="text-xs text-ink-500">Mohon segera lakukan perpanjangan dokumen.</span>'
                 +       '</div>'
                 +     '</div>'
                 +   '</div>'
                 + '</div>';
          }).join('');
        } catch (err) {
          utils.toast('Gagal memuat notifikasi: ' + err.message, 'error');
          console.error('[notifikasi-expired] render error:', err);
          container.innerHTML = emptyState('Gagal memuat data. Coba refresh halaman.', 'alert');
        }
      }

      function emptyState(message, icon) {
        const iconPath = (window.SIMANTRI_COMPONENTS.ICONS[icon] || window.SIMANTRI_COMPONENTS.ICONS['shield-check']);
        return '<div class="card p-10 text-center">'
             + '<div class="w-14 h-14 mx-auto rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">'
             + '<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="' + iconPath + '"/></svg>'
             + '</div>'
             + '<p class="text-sm text-ink-500 max-w-md mx-auto">' + utils.escapeHtml(message) + '</p>'
             + '</div>';
      }

      await render();
    },
  };
})();
