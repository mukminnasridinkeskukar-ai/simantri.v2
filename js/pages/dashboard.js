/* ============================================================================
 * SIMANTRI v3 — Page: Dashboard Monitoring
 * ============================================================================ */

(function () {
  'use strict';

  window.SIMANTRI_PAGES = window.SIMANTRI_PAGES || {};

  window.SIMANTRI_PAGES['dashboard'] = {
    html: function () {
      return `
        <div class="space-y-6">
          <!-- Header row -->
          <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 class="text-2xl font-extrabold text-ink-900 tracking-tight">Dashboard Monitoring</h2>
              <p class="mt-1 text-sm text-ink-500 max-w-2xl">Pantau legalitas praktik tenaga medis &amp; kesehatan secara real-time di seluruh fasyankes wilayah kerja.</p>
            </div>
            <div class="flex items-center gap-2">
              <button class="btn btn-outline btn-sm" data-action="refresh" type="button">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                Refresh
              </button>
              <button class="btn btn-primary btn-sm" data-action="export" type="button">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                Export
              </button>
            </div>
          </div>

          <!-- Stat cards -->
          <div id="stat-cards" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="skeleton h-32"></div>
            <div class="skeleton h-32"></div>
            <div class="skeleton h-32"></div>
            <div class="skeleton h-32"></div>
          </div>

          <!-- Charts row -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Bar chart -->
            <div class="card p-5 lg:col-span-2">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="text-base font-bold text-ink-900">Distribusi Nakes per Fasyankes</h3>
                  <p class="text-xs text-ink-500 mt-0.5">Jumlah tenaga kesehatan aktif pada tiap fasyankes</p>
                </div>
                <span class="badge badge-teal">Real-time</span>
              </div>
              <div class="relative" style="height:280px;">
                <canvas id="chart-fasyankes"></canvas>
              </div>
            </div>

            <!-- Donut chart -->
            <div class="card p-5">
              <div class="mb-4">
                <h3 class="text-base font-bold text-ink-900">Komposisi Jenis Nakes</h3>
                <p class="text-xs text-ink-500 mt-0.5">Sebaran profesi</p>
              </div>
              <div class="relative" style="height:200px;">
                <canvas id="chart-jenis"></canvas>
              </div>
              <div id="chart-jenis-legend" class="mt-4 space-y-1.5"></div>
            </div>
          </div>

          <!-- Status + Expiring list -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Status panel -->
            <div class="card p-5">
              <h3 class="text-base font-bold text-ink-900 mb-1">Status Legalitas</h3>
              <p class="text-xs text-ink-500 mb-4">Ringkasan STR &amp; SIP</p>

              <div class="space-y-4">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-semibold text-ink-700">STR (Surat Tanda Registrasi)</span>
                    <span class="text-xs text-ink-500" id="str-total">0 total</span>
                  </div>
                  <div class="grid grid-cols-3 gap-2">
                    <div class="rounded-xl bg-teal-50 p-2.5 text-center">
                      <p class="text-xl font-extrabold text-teal-700" id="str-aktif">0</p>
                      <p class="text-[10px] text-teal-700/80 font-semibold uppercase tracking-wide">Aktif</p>
                    </div>
                    <div class="rounded-xl bg-amber-50 p-2.5 text-center">
                      <p class="text-xl font-extrabold text-amber-700" id="str-hampir">0</p>
                      <p class="text-[10px] text-amber-700/80 font-semibold uppercase tracking-wide">Hampir</p>
                    </div>
                    <div class="rounded-xl bg-rose-50 p-2.5 text-center">
                      <p class="text-xl font-extrabold text-rose-700" id="str-expired">0</p>
                      <p class="text-[10px] text-rose-700/80 font-semibold uppercase tracking-wide">Expired</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-semibold text-ink-700">SIP (Surat Izin Praktik)</span>
                    <span class="text-xs text-ink-500" id="sip-total">0 total</span>
                  </div>
                  <div class="grid grid-cols-3 gap-2">
                    <div class="rounded-xl bg-teal-50 p-2.5 text-center">
                      <p class="text-xl font-extrabold text-teal-700" id="sip-aktif">0</p>
                      <p class="text-[10px] text-teal-700/80 font-semibold uppercase tracking-wide">Aktif</p>
                    </div>
                    <div class="rounded-xl bg-amber-50 p-2.5 text-center">
                      <p class="text-xl font-extrabold text-amber-700" id="sip-hampir">0</p>
                      <p class="text-[10px] text-amber-700/80 font-semibold uppercase tracking-wide">Hampir</p>
                    </div>
                    <div class="rounded-xl bg-rose-50 p-2.5 text-center">
                      <p class="text-xl font-extrabold text-rose-700" id="sip-expired">0</p>
                      <p class="text-[10px] text-rose-700/80 font-semibold uppercase tracking-wide">Expired</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Expiring list -->
            <div class="card p-5 lg:col-span-2">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="text-base font-bold text-ink-900">Akan Expired dalam 90 Hari</h3>
                  <p class="text-xs text-ink-500 mt-0.5">Perlu tindak lanjut segera</p>
                </div>
                <button class="btn btn-ghost btn-sm" data-action="see-all" type="button">Lihat semua</button>
              </div>
              <div id="expiring-list" class="space-y-2">
                <div class="skeleton h-14"></div>
                <div class="skeleton h-14"></div>
                <div class="skeleton h-14"></div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    init: async function () {
      const utils = window.SIMANTRI_UTILS;
      const components = window.SIMANTRI_COMPONENTS;
      const data = window.SIMANTRI_DATA;
      const db = window.SIMANTRI_DB;

      let _chartFasyankes = null;
      let _chartJenis = null;
      let _statsSnapshot = { str: { aktif: 0, hampir: 0, expired: 0 }, sip: { aktif: 0, hampir: 0, expired: 0 } };

      // Bind buttons
      const refreshBtn = document.querySelector('[data-action="refresh"]');
      if (refreshBtn) refreshBtn.addEventListener('click', async function () {
        utils.toast('Memuat ulang data...', 'info');
        await render();
      });

      const exportBtn = document.querySelector('[data-action="export"]');
      if (exportBtn) exportBtn.addEventListener('click', function () {
        exportCsv();
      });

      const seeAllBtn = document.querySelector('[data-action="see-all"]');
      if (seeAllBtn) seeAllBtn.addEventListener('click', function () {
        window.SIMANTRI.navigateTo('notifikasi-expired');
      });

      async function render() {
        try {
          const [stats, nakesList, praktikList] = await Promise.all([
            data.loadDashboardStats(),
            data.loadNakes(),
            data.loadPraktik(),
          ]);
          _statsSnapshot = stats;
          renderStatCards(stats);
          renderStatusPanel(stats);
          renderFasyankesChart(stats);
          renderJenisChart(stats);
          renderExpiringList(nakesList, praktikList);
        } catch (err) {
          utils.toast('Gagal memuat dashboard: ' + err.message, 'error');
          console.error(err);
        }
      }

      function renderStatCards(stats) {
        const container = document.getElementById('stat-cards');
        if (!container) return;
        container.innerHTML = '';
        const tindakLanjut = (stats.str.hampir + stats.str.expired + stats.sip.hampir + stats.sip.expired);
        const cards = [
          { label: 'Total Nakes', value: utils.fmtNumber(stats.totalNakes), sub: stats.tenagaMedis + ' medis / ' + stats.tenagaKesehatan + ' kesehatan', icon: 'doctor', variant: 'teal', trend: { direction: 'up', value: '+3', label: 'bulan ini' } },
          { label: 'Total Fasyankes', value: utils.fmtNumber(stats.totalFasyankes), sub: 'Terdaftar di wilayah kerja', icon: 'hospital', variant: 'lime' },
          { label: 'Praktik Aktif', value: utils.fmtNumber(stats.totalPraktik), sub: 'SIP terbit & aktif', icon: 'shield-check', variant: 'teal' },
          { label: 'Perlu Tindak Lanjut', value: utils.fmtNumber(tindakLanjut), sub: 'STR/SIP hampir/expired', icon: 'bell', variant: 'amber' },
        ];
        cards.forEach(function (c) {
          const div = document.createElement('div');
          container.appendChild(div);
          components.renderStatCard(div, c);
        });
      }

      function renderStatusPanel(stats) {
        const set = function (id, val) {
          const el = document.getElementById(id);
          if (el) el.textContent = val;
        };
        set('str-aktif', stats.str.aktif);
        set('str-hampir', stats.str.hampir);
        set('str-expired', stats.str.expired);
        set('str-total', (stats.str.aktif + stats.str.hampir + stats.str.expired) + ' total');
        set('sip-aktif', stats.sip.aktif);
        set('sip-hampir', stats.sip.hampir);
        set('sip-expired', stats.sip.expired);
        set('sip-total', (stats.sip.aktif + stats.sip.hampir + stats.sip.expired) + ' total');
      }

      function renderFasyankesChart(stats) {
        const canvas = document.getElementById('chart-fasyankes');
        if (!canvas || typeof window.Chart === 'undefined') return;
        if (_chartFasyankes) _chartFasyankes.destroy();

        const fasyankes = data.DEMO_FASYANKES;
        const labels = fasyankes.map(function (f) { return f.nama; });
        const values = fasyankes.map(function (f) {
          return stats.byFasyankes[f.id] || 0;
        });

        const ctx = canvas.getContext('2d');
        _chartFasyankes = new window.Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Jumlah Nakes',
              data: values,
              backgroundColor: ['#0D9488', '#14B8A6', '#84CC16', '#A3E635', '#F59E0B'],
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
              x: { ticks: { color: '#475569', font: { size: 11 }, maxRotation: 30, minRotation: 0, autoSkip: false }, grid: { display: false } },
            },
          },
        });
      }

      function renderJenisChart(stats) {
        const canvas = document.getElementById('chart-jenis');
        if (!canvas || typeof window.Chart === 'undefined') return;
        if (_chartJenis) _chartJenis.destroy();

        const entries = Object.entries(stats.byJenis).sort(function (a, b) { return b[1] - a[1]; });
        const labels = entries.map(function (e) { return e[0]; });
        const values = entries.map(function (e) { return e[1]; });
        const palette = ['#0D9488', '#84CC16', '#F59E0B', '#F43F5E', '#0F766E', '#4D7C0F', '#B45309', '#475569'];
        const colors = labels.map(function (_, i) { return palette[i % palette.length]; });

        const ctx = canvas.getContext('2d');
        _chartJenis = new window.Chart(ctx, {
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

        const legendEl = document.getElementById('chart-jenis-legend');
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

      function renderExpiringList(nakesList, praktikList) {
        const container = document.getElementById('expiring-list');
        if (!container) return;

        const items = [];
        nakesList.forEach(function (n) {
          const status = n.expire_status || db.calcExpireStatus(n.tgl_akhir_str);
          if (status === db.STATUS.HAMPIR_EXPIRED || status === db.STATUS.EXPIRED) {
            items.push({
              id: n.id,
              nama: n.nama,
              profesi: n.profesi,
              tipe: 'STR',
              no_dok: n.no_str,
              tgl_akhir: n.tgl_akhir_str,
              status: status,
            });
          }
        });
        praktikList.forEach(function (p) {
          const status = p.expire_status || db.calcExpireStatus(p.tgl_akhir_sip);
          if (status === db.STATUS.HAMPIR_EXPIRED || status === db.STATUS.EXPIRED) {
            const n = nakesList.find(function (x) { return x.id === p.tenaga_id; });
            items.push({
              id: p.id,
              nama: n ? n.nama : 'Nakes',
              profesi: n ? n.profesi : '-',
              tipe: 'SIP',
              no_dok: p.no_sip,
              tgl_akhir: p.tgl_akhir_sip,
              status: status,
            });
          }
        });

        items.sort(function (a, b) { return new Date(a.tgl_akhir) - new Date(b.tgl_akhir); });

        if (!items.length) {
          container.innerHTML = emptyState('Tidak ada dokumen yang akan expired dalam 90 hari', 'shield-check');
          return;
        }

        container.innerHTML = items.slice(0, 6).map(function (it) {
          const days = utils.daysUntil(it.tgl_akhir);
          const isExpired = days < 0;
          const badgeClass = isExpired ? 'badge-rose' : 'badge-amber';
          const dayText = isExpired ? 'Expired ' + (-days) + ' hari lalu' : 'H-' + days;
          const colorClass = utils.avatarColor(it.nama);
          return '<div class="flex items-center gap-3 p-3 rounded-xl border border-ink-100 hover:bg-teal-50/40 transition-colors cursor-pointer" data-notif-id="' + utils.escapeHtml(it.id) + '">'
               + '<div class="w-10 h-10 rounded-full ' + colorClass + ' text-white flex items-center justify-center text-sm font-bold flex-shrink-0">' + utils.escapeHtml(utils.initials(it.nama)) + '</div>'
               + '<div class="flex-1 min-w-0">'
               + '<div class="flex items-center gap-2">'
               + '<p class="text-sm font-semibold text-ink-900 truncate">' + utils.escapeHtml(it.nama) + '</p>'
               + '<span class="badge ' + (it.tipe === 'STR' ? 'badge-teal' : 'badge-lime') + '">' + it.tipe + '</span>'
               + '</div>'
               + '<p class="text-xs text-ink-500 truncate">' + utils.escapeHtml(it.profesi || '-') + '</p>'
               + '</div>'
               + '<div class="text-right flex-shrink-0">'
               + '<span class="badge ' + badgeClass + '">' + dayText + '</span>'
               + '<p class="text-[11px] text-ink-400 mt-1">' + utils.fmtDate(it.tgl_akhir) + '</p>'
               + '</div>'
               + '</div>';
        }).join('');

        container.querySelectorAll('[data-notif-id]').forEach(function (el) {
          el.addEventListener('click', function () {
            window.SIMANTRI.navigateTo('notifikasi-expired');
          });
        });
      }

      function emptyState(message, icon) {
        const iconPath = (components.ICONS[icon] || components.ICONS['shield-check']);
        return '<div class="text-center py-8 px-4">'
             + '<div class="w-12 h-12 mx-auto rounded-xl bg-ink-100 text-ink-400 flex items-center justify-center mb-3">'
             + '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="' + iconPath + '"/></svg>'
             + '</div>'
             + '<p class="text-sm text-ink-500">' + utils.escapeHtml(message) + '</p>'
             + '</div>';
      }

      function exportCsv() {
        try {
          const s = _statsSnapshot;
          const rows = [
            ['Kategori', 'Aktif', 'Hampir Expired', 'Expired'],
            ['STR', s.str.aktif, s.str.hampir, s.str.expired],
            ['SIP', s.sip.aktif, s.sip.hampir, s.sip.expired],
          ];
          const csv = rows.map(function (r) { return r.join(','); }).join('\n');
          utils.downloadFile('simantri-dashboard-' + Date.now() + '.csv', csv, 'text/csv');
          utils.toast('Dashboard diexport ke CSV', 'success');
        } catch (e) {
          utils.toast('Gagal export: ' + e.message, 'error');
        }
      }

      await render();
    },
  };
})();
