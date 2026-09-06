/* ============================================================================
 * SIMANTRI v3 — Page: Dashboard Monitoring
 * Schema v1.1: stat cards + 3 charts (per_jenis, status_izin, per_unit)
 *              + Ringkasan Verval Fasyankes + Pengumuman Terbaru.
 * ============================================================================ */

(function () {
  'use strict';

  window.SIMANTRI_PAGES = window.SIMANTRI_PAGES || {};

  window.SIMANTRI_PAGES['dashboard'] = {
    html: function () {
      return ''
        + '<div class="space-y-6">'
        // Header row
        +   '<div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">'
        +     '<div>'
        +       '<h2 class="text-2xl font-extrabold text-ink-900 tracking-tight">Dashboard Monitoring</h2>'
        +       '<p class="mt-1 text-sm text-ink-500 max-w-2xl">Pantau legalitas praktik tenaga medis &amp; kesehatan secara real-time di seluruh fasyankes wilayah kerja Dinas Kesehatan Kutai Kartanegara.</p>'
        +     '</div>'
        +     '<div class="flex items-center gap-2">'
        +       '<button class="btn btn-outline btn-sm" data-action="refresh" type="button">'
        +         '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>'
        +         'Refresh'
        +       '</button>'
        +     '</div>'
        +   '</div>'

        // Stat cards (5)
        +   '<div id="stat-cards" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">'
        +     '<div class="skeleton h-32"></div>'
        +     '<div class="skeleton h-32"></div>'
        +     '<div class="skeleton h-32"></div>'
        +     '<div class="skeleton h-32"></div>'
        +     '<div class="skeleton h-32"></div>'
        +   '</div>'

        // Charts row (2 bar + 1 donut)
        +   '<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">'
        +     '<div class="card p-5 lg:col-span-2">'
        +       '<div class="flex items-center justify-between mb-4">'
        +         '<div>'
        +           '<h3 class="text-base font-bold text-ink-900">SDMK per Jenis Tenaga</h3>'
        +           '<p class="text-xs text-ink-500 mt-0.5">Sebaran profesi tenaga kesehatan</p>'
        +         '</div>'
        +         '<span class="badge badge-teal">Real-time</span>'
        +       '</div>'
        +       '<div class="relative" style="height:280px;">'
        +         '<canvas id="chart-jenis"></canvas>'
        +       '</div>'
        +     '</div>'

        +     '<div class="card p-5">'
        +       '<div class="mb-4">'
        +         '<h3 class="text-base font-bold text-ink-900">Status Izin Praktik</h3>'
        +         '<p class="text-xs text-ink-500 mt-0.5">Distribusi status pengajuan</p>'
        +       '</div>'
        +       '<div class="relative" style="height:220px;">'
        +         '<canvas id="chart-status"></canvas>'
        +       '</div>'
        +       '<div id="chart-status-legend" class="mt-4 space-y-1.5"></div>'
        +     '</div>'
        +   '</div>'

        // Distribusi unit kerja
        +   '<div class="card p-5">'
        +     '<div class="flex items-center justify-between mb-4">'
        +       '<div>'
        +         '<h3 class="text-base font-bold text-ink-900">Distribusi Unit Kerja</h3>'
        +         '<p class="text-xs text-ink-500 mt-0.5">Jumlah SDMK pada tiap unit kerja</p>'
        +       '</div>'
        +     '</div>'
        +     '<div class="relative" style="height:300px;">'
        +       '<canvas id="chart-unit"></canvas>'
        +     '</div>'
        +   '</div>'

        // Ringkasan Verval Fasyankes + Pengumuman Terbaru
        +   '<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">'
        +     '<div class="card p-5">'
        +       '<div class="mb-4">'
        +         '<h3 class="text-base font-bold text-ink-900">Ringkasan Verval Fasyankes</h3>'
        +         '<p class="text-xs text-ink-500 mt-0.5">Status verifikasi fasyankes</p>'
        +       '</div>'
        +       '<div class="grid grid-cols-3 gap-3">'
        +         '<div class="rounded-xl bg-teal-50 p-4 text-center">'
        +           '<p class="text-3xl font-extrabold text-teal-700 tabular-nums" id="vf-layak">0</p>'
        +           '<p class="text-[11px] text-teal-700/80 font-semibold uppercase tracking-wide mt-1">Layak</p>'
        +         '</div>'
        +         '<div class="rounded-xl bg-rose-50 p-4 text-center">'
        +           '<p class="text-3xl font-extrabold text-rose-700 tabular-nums" id="vf-tidak-layak">0</p>'
        +           '<p class="text-[11px] text-rose-700/80 font-semibold uppercase tracking-wide mt-1">Tidak Layak</p>'
        +         '</div>'
        +         '<div class="rounded-xl bg-amber-50 p-4 text-center">'
        +           '<p class="text-3xl font-extrabold text-amber-700 tabular-nums" id="vf-pending">0</p>'
        +           '<p class="text-[11px] text-amber-700/80 font-semibold uppercase tracking-wide mt-1">Pending</p>'
        +         '</div>'
        +       '</div>'
        +       '<div class="mt-4 pt-4 border-t border-ink-100">'
        +         '<p class="text-xs text-ink-500">Total Verval Fasyankes: <span class="font-semibold text-ink-800" id="vf-total">0</span> dokumen</p>'
        +       '</div>'
        +     '</div>'

        +     '<div class="card p-5">'
        +       '<div class="flex items-center justify-between mb-4">'
        +         '<div>'
        +           '<h3 class="text-base font-bold text-ink-900">Pengumuman Terbaru</h3>'
        +           '<p class="text-xs text-ink-500 mt-0.5">3 pengumuman terkini</p>'
        +         '</div>'
        +         '<button class="btn btn-ghost btn-sm" data-action="see-all-pengumuman" type="button">Lihat semua</button>'
        +       '</div>'
        +       '<div id="pengumuman-terbaru" class="space-y-3">'
        +         '<div class="skeleton h-16"></div>'
        +         '<div class="skeleton h-16"></div>'
        +         '<div class="skeleton h-16"></div>'
        +       '</div>'
        +     '</div>'
        +   '</div>'
        + '</div>';
    },

    init: async function () {
      const utils = window.SIMANTRI_UTILS;
      const components = window.SIMANTRI_COMPONENTS;
      const data = window.SIMANTRI_DATA;

      let _chartJenis = null;
      let _chartStatus = null;
      let _chartUnit = null;

      // Bind buttons
      const refreshBtn = document.querySelector('[data-action="refresh"]');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', async function () {
          utils.toast('Memuat ulang data...', 'info');
          await render();
        });
      }

      const seeAllBtn = document.querySelector('[data-action="see-all-pengumuman"]');
      if (seeAllBtn) {
        seeAllBtn.addEventListener('click', function () {
          window.SIMANTRI.navigateTo('pengumuman');
        });
      }

      async function render() {
        try {
          const [stats, pengumumanList] = await Promise.all([
            data.loadDashboardStats(),
            data.loadPengumuman({}),
          ]);
          renderStatCards(stats);
          renderJenisChart(stats);
          renderStatusChart(stats);
          renderUnitChart(stats);
          renderVervalSummary(stats);
          renderPengumumanTerbaru(pengumumanList);
        } catch (err) {
          utils.toast('Gagal memuat dashboard: ' + err.message, 'error');
          console.error('[dashboard] render error:', err);
        }
      }

      function renderStatCards(stats) {
        const container = document.getElementById('stat-cards');
        if (!container) return;
        container.innerHTML = '';
        const cards = [
          { label: 'Total Profil SDMK', value: utils.fmtNumber(stats.total_profil_sdmk), sub: 'Tenaga kesehatan terdaftar', icon: 'users', variant: 'teal' },
          { label: 'Pengajuan Izin', value: utils.fmtNumber(stats.total_pengajuan_izin), sub: 'Total seluruh pengajuan', icon: 'document', variant: 'lime' },
          { label: 'Izin Diproses', value: utils.fmtNumber(stats.izin_diproses), sub: 'Sedang dalam proses', icon: 'refresh', variant: 'amber' },
          { label: 'Verval Izin', value: utils.fmtNumber(stats.total_verval_izin), sub: 'Verifikasi & validasi', icon: 'shield-check', variant: 'teal' },
          { label: 'Verval Fasyankes', value: utils.fmtNumber(stats.total_verval_fasyankes), sub: 'Verifikasi fasyankes', icon: 'hospital', variant: 'lime' },
        ];
        cards.forEach(function (c) {
          const div = document.createElement('div');
          container.appendChild(div);
          components.renderStatCard(div, c);
        });
      }

      function renderJenisChart(stats) {
        const canvas = document.getElementById('chart-jenis');
        if (!canvas || typeof window.Chart === 'undefined') return;
        if (_chartJenis) _chartJenis.destroy();

        const entries = Object.entries(stats.per_jenis || {}).sort(function (a, b) { return b[1] - a[1]; });
        const labels = entries.map(function (e) { return e[0]; });
        const values = entries.map(function (e) { return e[1]; });
        const palette = ['#0D9488', '#84CC16', '#F59E0B', '#F43F5E', '#0F766E', '#4D7C0F', '#B45309', '#475569'];

        const ctx = canvas.getContext('2d');
        _chartJenis = new window.Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Jumlah SDMK',
              data: values,
              backgroundColor: labels.map(function (_, i) { return palette[i % palette.length]; }),
              borderRadius: 8,
              maxBarThickness: 48,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#0F172A',
                padding: 12,
                cornerRadius: 8,
                titleFont: { size: 12, weight: 'bold' },
                bodyFont: { size: 12 },
              },
            },
            scales: {
              y: { beginAtZero: true, ticks: { precision: 0, color: '#94A3B8' }, grid: { color: '#F1F5F9' } },
              x: { ticks: { color: '#475569', font: { size: 11 }, maxRotation: 30, minRotation: 0 }, grid: { display: false } },
            },
          },
        });
      }

      function renderStatusChart(stats) {
        const canvas = document.getElementById('chart-status');
        if (!canvas || typeof window.Chart === 'undefined') return;
        if (_chartStatus) _chartStatus.destroy();

        const raw = stats.status_izin || {};
        const colorMap = {
          Disetujui: '#0D9488',
          Proses: '#F59E0B',
          Pending: '#FCD34D',
          Ditolak: '#F43F5E',
        };
        const entries = Object.entries(raw);
        const labels = entries.map(function (e) { return e[0]; });
        const values = entries.map(function (e) { return e[1]; });
        const colors = labels.map(function (l) { return colorMap[l] || '#94A3B8'; });

        const ctx = canvas.getContext('2d');
        _chartStatus = new window.Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: labels,
            datasets: [{
              data: values,
              backgroundColor: colors,
              borderColor: '#FFFFFF',
              borderWidth: 3,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#0F172A',
                padding: 12,
                cornerRadius: 8,
              },
            },
          },
        });

        const legendEl = document.getElementById('chart-status-legend');
        if (legendEl) {
          const total = values.reduce(function (a, b) { return a + b; }, 0) || 1;
          legendEl.innerHTML = labels.map(function (lab, i) {
            const pct = Math.round((values[i] / total) * 100);
            return '<div class="flex items-center justify-between text-xs">'
                 + '<div class="flex items-center gap-2 min-w-0">'
                 + '<span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:' + colors[i] + ';"></span>'
                 + '<span class="text-ink-700 truncate">' + utils.escapeHtml(lab) + '</span>'
                 + '</div>'
                 + '<span class="font-semibold text-ink-900 tabular-nums">' + values[i] + ' <span class="text-ink-400 font-normal">(' + pct + '%)</span></span>'
                 + '</div>';
          }).join('');
        }
      }

      function renderUnitChart(stats) {
        const canvas = document.getElementById('chart-unit');
        if (!canvas || typeof window.Chart === 'undefined') return;
        if (_chartUnit) _chartUnit.destroy();

        const entries = Object.entries(stats.per_unit || {}).sort(function (a, b) { return b[1] - a[1]; });
        const labels = entries.map(function (e) { return e[0]; });
        const values = entries.map(function (e) { return e[1]; });
        const palette = ['#0D9488', '#14B8A6', '#84CC16', '#A3E635', '#F59E0B', '#0F766E', '#4D7C0F', '#B45309', '#475569'];

        const ctx = canvas.getContext('2d');
        _chartUnit = new window.Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Jumlah SDMK',
              data: values,
              backgroundColor: labels.map(function (_, i) { return palette[i % palette.length]; }),
              borderRadius: 8,
              maxBarThickness: 48,
            }],
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#0F172A',
                padding: 12,
                cornerRadius: 8,
              },
            },
            scales: {
              x: { beginAtZero: true, ticks: { precision: 0, color: '#94A3B8' }, grid: { color: '#F1F5F9' } },
              y: { ticks: { color: '#475569', font: { size: 11 } }, grid: { display: false } },
            },
          },
        });
      }

      function renderVervalSummary(stats) {
        const set = function (id, val) {
          const el = document.getElementById(id);
          if (el) el.textContent = val;
        };
        set('vf-layak', stats.vf_layak || 0);
        set('vf-tidak-layak', stats.vf_tidak_layak || 0);
        set('vf-pending', stats.vf_pending || 0);
        set('vf-total', utils.fmtNumber(stats.total_verval_fasyankes || 0));
      }

      function renderPengumumanTerbaru(list) {
        const container = document.getElementById('pengumuman-terbaru');
        if (!container) return;
        if (!list || !list.length) {
          container.innerHTML = emptyState('Belum ada pengumuman', 'bell');
          return;
        }
        const top = list.slice(0, 3);
        container.innerHTML = top.map(function (p) {
          const penting = p.is_penting === 1 || p.is_penting === true;
          return '<div class="flex items-start gap-3 p-3 rounded-xl border border-ink-100 hover:bg-teal-50/40 transition-colors">'
               + '<div class="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">'
               +   '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>'
               + '</div>'
               + '<div class="flex-1 min-w-0">'
               +   '<div class="flex items-center gap-2 flex-wrap">'
               +     '<p class="text-sm font-semibold text-ink-900 truncate">' + utils.escapeHtml(p.judul) + '</p>'
               +     (penting ? '<span class="badge badge-rose">PENTING</span>' : '')
               +   '</div>'
               +   '<p class="text-xs text-ink-500 mt-0.5">' + utils.fmtDate(p.tanggal) + '</p>'
               +   '<p class="text-xs text-ink-600 mt-1 line-clamp-2">' + utils.escapeHtml(p.isi || '') + '</p>'
               + '</div>'
               + '</div>';
        }).join('');
      }

      function emptyState(message, icon) {
        const iconPath = (components.ICONS && components.ICONS[icon]) || components.ICONS['bell'];
        return '<div class="text-center py-6 px-4">'
             + '<div class="w-12 h-12 mx-auto rounded-xl bg-ink-100 text-ink-400 flex items-center justify-center mb-3">'
             + '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="' + iconPath + '"/></svg>'
             + '</div>'
             + '<p class="text-sm text-ink-500">' + utils.escapeHtml(message) + '</p>'
             + '</div>';
      }

      await render();
    },
  };
})();
