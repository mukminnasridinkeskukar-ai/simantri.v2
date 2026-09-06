/* ============================================================================
 * SIMANTRI v3 — Page: Pengumuman (read-only public view)
 * ============================================================================ */

(function () {
  'use strict';

  window.SIMANTRI_PAGES = window.SIMANTRI_PAGES || {};

  window.SIMANTRI_PAGES['pengumuman'] = {
    html: function () {
      return ''
        + '<div class="space-y-6">'
        +   '<div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">'
        +     '<div>'
        +       '<h2 class="text-2xl font-extrabold text-ink-900 tracking-tight">Pengumuman</h2>'
        +       '<p class="mt-1 text-sm text-ink-500 max-w-2xl">Informasi resmi dari Dinas Kesehatan Kutai Kartanegara terkait SDMK, verval, dan izin praktik.</p>'
        +     '</div>'
        +   '</div>'

        // Filter
        +   '<div class="card p-4">'
        +     '<div class="grid grid-cols-1 md:grid-cols-3 gap-3">'
        +       '<div class="md:col-span-3">'
        +         '<label class="label" for="pg-search">Pencarian</label>'
        +         '<div class="relative">'
        +           '<svg class="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>'
        +           '<input type="search" id="pg-search" class="input" style="padding-left:2.25rem;" placeholder="Cari judul atau isi pengumuman..." />'
        +         '</div>'
        +       '</div>'
        +     '</div>'
        +   '</div>'

        // List
        +   '<div id="pg-list" class="space-y-3">'
        +     '<div class="skeleton h-32"></div>'
        +     '<div class="skeleton h-32"></div>'
        +     '<div class="skeleton h-32"></div>'
        +   '</div>'
        + '</div>';
    },

    init: async function () {
      const utils = window.SIMANTRI_UTILS;
      const data = window.SIMANTRI_DATA;

      let _search = '';

      const searchInput = document.getElementById('pg-search');
      if (searchInput) {
        searchInput.addEventListener('input', utils.debounce(function (e) {
          _search = e.target.value.trim();
          render();
        }, 300));
      }

      async function render() {
        const container = document.getElementById('pg-list');
        if (!container) return;
        container.innerHTML = '<div class="skeleton h-32"></div><div class="skeleton h-32"></div>';
        try {
          const list = await data.loadPengumuman({ search: _search });
          if (!list.length) {
            container.innerHTML = emptyState(_search ? 'Tidak ada pengumuman yang cocok dengan pencarian Anda.' : 'Belum ada pengumuman.', 'bell');
            return;
          }
          container.innerHTML = list.map(function (p) {
            const penting = p.is_penting === 1 || p.is_penting === true;
            return '<article class="card card-hover p-5">'
                 +   '<div class="flex items-start justify-between gap-3 flex-wrap">'
                 +     '<div class="flex items-center gap-2 flex-wrap">'
                 +       '<span class="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700">'
                 +         '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>'
                 +         utils.fmtDateLong(p.tanggal)
                 +       '</span>'
                 +       (penting ? '<span class="badge badge-rose">PENTING</span>' : '<span class="badge badge-ink">Umum</span>')
                 +     '</div>'
                 +     '<span class="text-xs text-ink-400">Oleh: ' + utils.escapeHtml(p.created_by || '-') + '</span>'
                 +   '</div>'
                 +   '<h3 class="mt-3 text-lg font-bold text-ink-900">' + utils.escapeHtml(p.judul) + '</h3>'
                 +   '<p class="mt-2 text-sm text-ink-600 whitespace-pre-line">' + utils.escapeHtml(p.isi || '') + '</p>'
                 + '</article>';
          }).join('');
        } catch (err) {
          utils.toast('Gagal memuat pengumuman: ' + err.message, 'error');
          console.error('[pengumuman] render error:', err);
          container.innerHTML = emptyState('Gagal memuat data. Coba refresh halaman.', 'alert');
        }
      }

      function emptyState(message, icon) {
        const iconPath = (window.SIMANTRI_COMPONENTS.ICONS[icon] || window.SIMANTRI_COMPONENTS.ICONS['bell']);
        return '<div class="card p-10 text-center">'
             + '<div class="w-14 h-14 mx-auto rounded-xl bg-ink-100 text-ink-400 flex items-center justify-center mb-3">'
             + '<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="' + iconPath + '"/></svg>'
             + '</div>'
             + '<p class="text-sm text-ink-500 max-w-md mx-auto">' + utils.escapeHtml(message) + '</p>'
             + '</div>';
      }

      await render();
    },
  };
})();
