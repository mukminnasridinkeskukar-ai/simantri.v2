/* ============================================================================
 * SIMANTRI v3 — Page: Laporan & Rekap Dinkes
 * ============================================================================ */

(function () {
  'use strict';

  window.SIMANTRI_PAGES = window.SIMANTRI_PAGES || {};

  window.SIMANTRI_PAGES['laporan'] = {
    html: function () {
      return `
        <div class="space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 class="text-2xl font-extrabold text-ink-900 tracking-tight">Laporan &amp; Rekap Dinkes</h2>
              <p class="mt-1 text-sm text-ink-500 max-w-2xl">Rekapitulasi data nakes, fasyankes, dan perizinan untuk pelaporan Dinkes.</p>
            </div>
            <div class="flex items-center gap-2 role-admin-only">
              <button class="btn btn-outline btn-sm" data-action="export-csv" type="button" data-role-action="download">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                Export CSV
              </button>
              <button class="btn btn-primary btn-sm" data-action="export-pdf" type="button" data-role-action="print">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Cetak PDF
              </button>
            </div>
          </div>

          <!-- Filter bar -->
          <div class="card p-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label class="label" for="lp-periode">Periode</label>
                <select id="lp-periode" class="select">
                  <option value="6">6 Bulan Terakhir</option>
                  <option value="12">12 Bulan Terakhir</option>
                  <option value="3">3 Bulan Terakhir</option>
                </select>
              </div>
              <div>
                <label class="label" for="lp-fasyankes">Fasyankes</label>
                <select id="lp-fasyankes" class="select"><option value="">Semua Fasyankes</option></select>
              </div>
              <div>
                <label class="label" for="lp-jenis">Jenis Nakes</label>
                <select id="lp-jenis" class="select">
                  <option value="">Semua Jenis</option>
                  <option value="medis">Tenaga Medis</option>
                  <option value="kesehatan">Tenaga Kesehatan</option>
                </select>
              </div>
              <div>
                <label class="label" for="lp-status">Status</label>
                <select id="lp-status" class="select">
                  <option value="">Semua Status</option>
                  <option value="aktif">Aktif</option>
                  <option value="hampir_expired">Hampir Expired</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Stat cards -->
          <div id="lp-stats" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="skeleton h-28"></div>
            <div class="skeleton h-28"></div>
            <div class="skeleton h-28"></div>
            <div class="skeleton h-28"></div>
          </div>

          <!-- Chart -->
          <div class="card p-5">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-base font-bold text-ink-900">Tren Perizinan 6 Bulan</h3>
                <p class="text-xs text-ink-500 mt-0.5">Jumlah STR &amp; SIP terbit per bulan</p>
              </div>
              <div class="flex items-center gap-3 text-xs">
                <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm" style="background:#0D9488;"></span><span class="text-ink-600">STR</span></div>
                <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm" style="background:#84CC16;"></span><span class="text-ink-600">SIP</span></div>
              </div>
            </div>
            <div class="relative" style="height:320px;">
              <canvas id="chart-tren"></canvas>
            </div>
          </div>

          <!-- Summary table per fasyankes -->
          <div class="card overflow-hidden">
            <div class="p-5 border-b border-ink-100">
              <h3 class="text-base font-bold text-ink-900">Rekap per Fasyankes</h3>
              <p class="text-xs text-ink-500 mt-0.5">Distribusi nakes &amp; status perizinan per fasyankes</p>
            </div>
            <div class="overflow-x-auto">
              <table class="data-table table-sticky">
                <thead>
                  <tr>
                    <th>Fasyankes</th>
                    <th>Jenis</th>
                    <th class="text-center">Total Nakes</th>
                    <th class="text-center">STR Aktif</th>
                    <th class="text-center">STR Hampir</th>
                    <th class="text-center">STR Expired</th>
                    <th class="text-center">SIP Aktif</th>
                    <th class="text-center">Perlu Tindak Lanjut</th>
                  </tr>
                </thead>
                <tbody id="lp-tbody">
                  <tr><td colspan="8" class="text-center text-ink-500 py-8">Memuat data...</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Insights -->
          <div class="card p-5">
            <div class="flex items-center gap-2 mb-3">
              <svg class="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
              <h3 class="text-base font-bold text-ink-900">Insight &amp; Rekomendasi</h3>
            </div>
            <ul id="lp-insights" class="space-y-2">
              <li class="skeleton h-6"></li>
              <li class="skeleton h-6"></li>
            </ul>
          </div>
        </div>
      `;
    },

    init: async function () {
      const utils = window.SIMANTRI_UTILS;
      const data = window.SIMANTRI_DATA;
      const db = window.SIMANTRI_DB;
      const components = window.SIMANTRI_COMPONENTS;

      let _chart = null;
      let _allNakes = [];
      let _allPraktik = [];
      let _allFasyankes = [];
      let _filters = { periode: '6', fasyankesId: '', jenis: '', status: '' };

      // Bind filters
      ['lp-periode', 'lp-fasyankes', 'lp-jenis', 'lp-status'].forEach(function (id) {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('change', function (e) {
            const key = id === 'lp-periode' ? 'periode' : id === 'lp-fasyankes' ? 'fasyankesId' : id === 'lp-jenis' ? 'jenis' : 'status';
            _filters[key] = e.target.value;
            render();
          });
        }
      });

      const exportCsvBtn = document.querySelector('[data-action="export-csv"]');
      if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportCsv);
      const exportPdfBtn = document.querySelector('[data-action="export-pdf"]');
      if (exportPdfBtn) exportPdfBtn.addEventListener('click', function () {
        utils.toast('Menyiapkan PDF...', 'info');
        setTimeout(function () { window.print(); }, 500);
      });

      async function load() {
        try {
          const [nakes, praktik, fasyankes] = await Promise.all([
            data.loadNakes(),
            data.loadPraktik(),
            data.loadFasyankes(),
          ]);
          _allNakes = nakes;
          _allPraktik = praktik;
          _allFasyankes = fasyankes;

          const fasyankesSel = document.getElementById('lp-fasyankes');
          if (fasyankesSel) {
            fasyankesSel.innerHTML = '<option value="">Semua Fasyankes</option>'
              + fasyankes.map(function (f) {
                return '<option value="' + utils.escapeHtml(f.id) + '">' + utils.escapeHtml(f.nama) + '</option>';
              }).join('');
          }
          render();
        } catch (err) {
          utils.toast('Gagal memuat laporan: ' + err.message, 'error');
          console.error(err);
        }
      }

      function getFilteredNakes() {
        return _allNakes.filter(function (n) {
          if (_filters.fasyankesId && n.fasyankes_id !== _filters.fasyankesId) return false;
          if (_filters.jenis === 'medis' && ['Dokter', 'Dokter Gigi', 'Dokter Spesialis'].indexOf(n.jenis) < 0) return false;
          if (_filters.jenis === 'kesehatan' && ['Dokter', 'Dokter Gigi', 'Dokter Spesialis'].indexOf(n.jenis) >= 0) return false;
          if (_filters.status) {
            const s = n.expire_status || db.calcExpireStatus(n.tgl_akhir_str);
            if (s !== _filters.status) return false;
          }
          return true;
        });
      }
      function getFilteredPraktik() {
        return _allPraktik.filter(function (p) {
          if (_filters.fasyankesId && p.fasyankes_id !== _filters.fasyankesId) return false;
          if (_filters.status) {
            const s = p.expire_status || db.calcExpireStatus(p.tgl_akhir_sip);
            if (s !== _filters.status) return false;
          }
          return true;
        });
      }

      function render() {
        const nakes = getFilteredNakes();
        const praktik = getFilteredPraktik();
        renderStats(nakes, praktik);
        renderChart();
        renderTable();
        renderInsights(nakes, praktik);
      }

      function renderStats(nakes, praktik) {
        const container = document.getElementById('lp-stats');
        if (!container) return;
        container.innerHTML = '';
        const strAktif = nakes.filter(function (n) { return (n.expire_status || db.calcExpireStatus(n.tgl_akhir_str)) === db.STATUS.AKTIF; }).length;
        const strHampir = nakes.filter(function (n) { return (n.expire_status || db.calcExpireStatus(n.tgl_akhir_str)) === db.STATUS.HAMPIR_EXPIRED; }).length;
        const strExpired = nakes.filter(function (n) { return (n.expire_status || db.calcExpireStatus(n.tgl_akhir_str)) === db.STATUS.EXPIRED; }).length;
        const sipAktif = praktik.filter(function (p) { return (p.expire_status || db.calcExpireStatus(p.tgl_akhir_sip)) === db.STATUS.AKTIF; }).length;
        const tindakLanjut = strHampir + strExpired + praktik.filter(function (p) {
          const s = p.expire_status || db.calcExpireStatus(p.tgl_akhir_sip);
          return s === db.STATUS.HAMPIR_EXPIRED || s === db.STATUS.EXPIRED;
        }).length;

        const cards = [
          { label: 'Total Nakes', value: utils.fmtNumber(nakes.length), sub: 'Terdaftar di periode', icon: 'doctor', variant: 'teal' },
          { label: 'STR Aktif', value: utils.fmtNumber(strAktif), sub: strHampir + ' hampir / ' + strExpired + ' expired', icon: 'shield-check', variant: 'lime' },
          { label: 'SIP Aktif', value: utils.fmtNumber(sipAktif), sub: 'dari ' + praktik.length + ' total', icon: 'refresh', variant: 'teal' },
          { label: 'Perlu Tindak Lanjut', value: utils.fmtNumber(tindakLanjut), sub: 'STR & SIP hampir/expired', icon: 'bell', variant: 'amber' },
        ];
        cards.forEach(function (c) {
          const div = document.createElement('div');
          container.appendChild(div);
          components.renderStatCard(div, c);
        });
      }

      function renderChart() {
        const canvas = document.getElementById('chart-tren');
        if (!canvas || typeof window.Chart === 'undefined') return;
        if (_chart) _chart.destroy();

        const months = parseInt(_filters.periode, 10) || 6;
        const labels = [];
        const strData = [];
        const sipData = [];
        const today = new Date();
        for (let i = months - 1; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const label = new Intl.DateTimeFormat('id-ID', { month: 'short', year: '2-digit' }).format(d);
          labels.push(label);

          // Count STR issued in this month
          const strCount = _allNakes.filter(function (n) {
            if (!n.tgl_terbit_str) return false;
            const t = new Date(n.tgl_terbit_str);
            return t.getFullYear() === d.getFullYear() && t.getMonth() === d.getMonth();
          }).length;
          // Count SIP issued in this month
          const sipCount = _allPraktik.filter(function (p) {
            if (!p.tgl_terbit_sip) return false;
            const t = new Date(p.tgl_terbit_sip);
            return t.getFullYear() === d.getFullYear() && t.getMonth() === d.getMonth();
          }).length;
          strData.push(strCount);
          sipData.push(sipCount);
        }

        const ctx = canvas.getContext('2d');
        _chart = new window.Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              { label: 'STR', data: strData, backgroundColor: '#0D9488', borderRadius: 6, maxBarThickness: 32 },
              { label: 'SIP', data: sipData, backgroundColor: '#84CC16', borderRadius: 6, maxBarThickness: 32 },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { backgroundColor: '#0F172A', padding: 12, cornerRadius: 8 },
            },
            scales: {
              y: { beginAtZero: true, ticks: { precision: 0, color: '#94A3B8' }, grid: { color: '#F1F5F9' } },
              x: { ticks: { color: '#475569', font: { size: 11 } }, grid: { display: false } },
            },
          },
        });
      }

      function renderTable() {
        const tbody = document.getElementById('lp-tbody');
        if (!tbody) return;
        const fasyankesList = _filters.fasyankesId
          ? _allFasyankes.filter(function (f) { return f.id === _filters.fasyankesId; })
          : _allFasyankes;

        if (!fasyankesList.length) {
          tbody.innerHTML = '<tr><td colspan="8" class="text-center text-ink-500 py-8">Tidak ada data</td></tr>';
          return;
        }

        tbody.innerHTML = fasyankesList.map(function (f) {
          const nakes = _allNakes.filter(function (n) { return n.fasyankes_id === f.id; });
          const praktik = _allPraktik.filter(function (p) { return p.fasyankes_id === f.id; });
          const strAktif = nakes.filter(function (n) { return (n.expire_status || db.calcExpireStatus(n.tgl_akhir_str)) === db.STATUS.AKTIF; }).length;
          const strHampir = nakes.filter(function (n) { return (n.expire_status || db.calcExpireStatus(n.tgl_akhir_str)) === db.STATUS.HAMPIR_EXPIRED; }).length;
          const strExpired = nakes.filter(function (n) { return (n.expire_status || db.calcExpireStatus(n.tgl_akhir_str)) === db.STATUS.EXPIRED; }).length;
          const sipAktif = praktik.filter(function (p) { return (p.expire_status || db.calcExpireStatus(p.tgl_akhir_sip)) === db.STATUS.AKTIF; }).length;
          const tindakLanjut = strHampir + strExpired + praktik.filter(function (p) {
            const s = p.expire_status || db.calcExpireStatus(p.tgl_akhir_sip);
            return s === db.STATUS.HAMPIR_EXPIRED || s === db.STATUS.EXPIRED;
          }).length;
          const tindakBadge = tindakLanjut > 0 ? 'badge-amber' : 'badge-teal';
          return '<tr>'
               + '<td><p class="text-sm font-semibold text-ink-900">' + utils.escapeHtml(f.nama) + '</p><p class="text-[11px] text-ink-500 truncate">' + utils.escapeHtml(f.alamat || '-') + '</p></td>'
               + '<td><span class="badge badge-ink">' + utils.escapeHtml(f.jenis) + '</span></td>'
               + '<td class="text-center"><span class="text-sm font-bold text-ink-900 tabular-nums">' + nakes.length + '</span></td>'
               + '<td class="text-center"><span class="text-sm text-teal-700 font-semibold tabular-nums">' + strAktif + '</span></td>'
               + '<td class="text-center"><span class="text-sm text-amber-700 font-semibold tabular-nums">' + strHampir + '</span></td>'
               + '<td class="text-center"><span class="text-sm text-rose-700 font-semibold tabular-nums">' + strExpired + '</span></td>'
               + '<td class="text-center"><span class="text-sm text-teal-700 font-semibold tabular-nums">' + sipAktif + '</span></td>'
               + '<td class="text-center"><span class="badge ' + tindakBadge + '">' + tindakLanjut + '</span></td>'
               + '</tr>';
        }).join('');
      }

      function renderInsights(nakes, praktik) {
        const container = document.getElementById('lp-insights');
        if (!container) return;
        const insights = [];

        const strHampir = nakes.filter(function (n) { return (n.expire_status || db.calcExpireStatus(n.tgl_akhir_str)) === db.STATUS.HAMPIR_EXPIRED; }).length;
        const strExpired = nakes.filter(function (n) { return (n.expire_status || db.calcExpireStatus(n.tgl_akhir_str)) === db.STATUS.EXPIRED; }).length;
        const sipHampir = praktik.filter(function (p) { return (p.expire_status || db.calcExpireStatus(p.tgl_akhir_sip)) === db.STATUS.HAMPIR_EXPIRED; }).length;
        const sipExpired = praktik.filter(function (p) { return (p.expire_status || db.calcExpireStatus(p.tgl_akhir_sip)) === db.STATUS.EXPIRED; }).length;

        if (strHampir > 0) {
          insights.push({ type: 'warning', text: 'Terdapat ' + strHampir + ' STR yang akan expired dalam 90 hari. Disarankan mengirim pengingat perpanjangan kepada nakes terkait.' });
        }
        if (strExpired > 0) {
          insights.push({ type: 'danger', text: strExpired + ' STR sudah expired dan perlu segera diperpanjang. Pertimbangkan menonaktifkan nakes bersangkutan hingga perpanjangan selesai.' });
        }
        if (sipHampir > 0) {
          insights.push({ type: 'warning', text: sipHampir + ' SIP akan expired dalam 90 hari. Koordinasikan dengan fasyankes untuk pengurusan SIP baru.' });
        }
        if (sipExpired > 0) {
          insights.push({ type: 'danger', text: sipExpired + ' SIP sudah expired. Pastikan tidak ada praktik yang berjalan tanpa SIP aktif.' });
        }
        if (nakes.length > 0) {
          const jenisCount = {};
          nakes.forEach(function (n) { jenisCount[n.jenis] = (jenisCount[n.jenis] || 0) + 1; });
          const topJenis = Object.entries(jenisCount).sort(function (a, b) { return b[1] - a[1]; })[0];
          if (topJenis) {
            insights.push({ type: 'info', text: 'Jenis nakes terbanyak: ' + topJenis[0] + ' (' + topJenis[1] + ' orang, ' + Math.round((topJenis[1] / nakes.length) * 100) + '% dari total).' });
          }
        }
        if (!insights.length) {
          insights.push({ type: 'success', text: 'Semua dokumen legalitas dalam status baik. Tidak ada tindakan mendesek diperlukan.' });
        }

        const iconPaths = {
          warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
          danger: 'M6 18L18 6M6 6l12 12',
          info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
          success: 'M5 13l4 4L19 7',
        };
        const colorMap = {
          warning: 'text-amber-600',
          danger: 'text-rose-600',
          info: 'text-teal-600',
          success: 'text-teal-600',
        };
        container.innerHTML = insights.map(function (it) {
          return '<li class="flex items-start gap-2.5 text-sm">'
               + '<svg class="w-5 h-5 ' + colorMap[it.type] + ' flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="' + iconPaths[it.type] + '"/></svg>'
               + '<span class="text-ink-700">' + utils.escapeHtml(it.text) + '</span>'
               + '</li>';
        }).join('');
      }

      function exportCsv() {
        try {
          const fasyankesList = _filters.fasyankesId
            ? _allFasyankes.filter(function (f) { return f.id === _filters.fasyankesId; })
            : _allFasyankes;
          const headers = ['Fasyankes', 'Jenis', 'Total Nakes', 'STR Aktif', 'STR Hampir', 'STR Expired', 'SIP Aktif', 'Perlu Tindak Lanjut'];
          const rows = [headers];
          fasyankesList.forEach(function (f) {
            const nakes = _allNakes.filter(function (n) { return n.fasyankes_id === f.id; });
            const praktik = _allPraktik.filter(function (p) { return p.fasyankes_id === f.id; });
            const strAktif = nakes.filter(function (n) { return (n.expire_status || db.calcExpireStatus(n.tgl_akhir_str)) === db.STATUS.AKTIF; }).length;
            const strHampir = nakes.filter(function (n) { return (n.expire_status || db.calcExpireStatus(n.tgl_akhir_str)) === db.STATUS.HAMPIR_EXPIRED; }).length;
            const strExpired = nakes.filter(function (n) { return (n.expire_status || db.calcExpireStatus(n.tgl_akhir_str)) === db.STATUS.EXPIRED; }).length;
            const sipAktif = praktik.filter(function (p) { return (p.expire_status || db.calcExpireStatus(p.tgl_akhir_sip)) === db.STATUS.AKTIF; }).length;
            const tindakLanjut = strHampir + strExpired + praktik.filter(function (p) {
              const s = p.expire_status || db.calcExpireStatus(p.tgl_akhir_sip);
              return s === db.STATUS.HAMPIR_EXPIRED || s === db.STATUS.EXPIRED;
            }).length;
            rows.push([
              '"' + f.nama.replace(/"/g, '""') + '"',
              '"' + f.jenis + '"',
              nakes.length, strAktif, strHampir, strExpired, sipAktif, tindakLanjut,
            ]);
          });
          const csv = rows.map(function (r) { return r.join(','); }).join('\n');
          utils.downloadFile('simantri-laporan-' + Date.now() + '.csv', csv, 'text/csv');
          utils.toast('Laporan diexport ke CSV', 'success');
        } catch (e) {
          utils.toast('Gagal export: ' + e.message, 'error');
        }
      }

      await load();
    },
  };
})();
