/* ============================================================================
 * SIMANTRI v3 — Page: Data Tenaga Medis (Dokter / Dokter Gigi / Spesialis)
 * ============================================================================ */

(function () {
  'use strict';

  window.SIMANTRI_PAGES = window.SIMANTRI_PAGES || {};

  window.SIMANTRI_PAGES['data-nakes'] = {
    html: function () {
      return `
        <div class="space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 class="text-2xl font-extrabold text-ink-900 tracking-tight">Data Tenaga Medis</h2>
              <p class="mt-1 text-sm text-ink-500 max-w-2xl">Daftar dokter, dokter gigi, dan dokter spesialis beserta status legalitas STR &amp; SIP.</p>
            </div>
            <div class="flex items-center gap-2">
              <button class="btn btn-outline btn-sm" data-action="export" type="button">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                Export CSV
              </button>
              <button class="btn btn-primary btn-sm" data-action="add" type="button">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                Tambah Nakes
              </button>
            </div>
          </div>

          <!-- Filters -->
          <div class="card p-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div class="md:col-span-2">
                <label class="label" for="dn-search">Pencarian</label>
                <div class="relative">
                  <svg class="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <input type="search" id="dn-search" class="input" style="padding-left:2.25rem;" placeholder="Cari nama, NIK, no STR, profesi..." />
                </div>
              </div>
              <div>
                <label class="label" for="dn-fasyankes">Fasyankes</label>
                <select id="dn-fasyankes" class="select"><option value="">Semua Fasyankes</option></select>
              </div>
              <div>
                <label class="label" for="dn-status">Status STR</label>
                <select id="dn-status" class="select">
                  <option value="">Semua Status</option>
                  <option value="aktif">Aktif</option>
                  <option value="hampir_expired">Hampir Expired</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Table -->
          <div class="card overflow-hidden">
            <div class="overflow-x-auto" style="max-height:560px;">
              <table class="data-table table-sticky">
                <thead>
                  <tr>
                    <th>Nakes</th>
                    <th>NIK</th>
                    <th>No. STR</th>
                    <th class="w-44">Masa Berlaku STR</th>
                    <th>Fasyankes</th>
                    <th>Status</th>
                    <th class="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody id="dn-tbody">
                  <tr><td colspan="7" class="text-center text-ink-500 py-8">Memuat data...</td></tr>
                </tbody>
              </table>
            </div>
            <div class="p-4 border-t border-ink-100 flex items-center justify-between text-xs text-ink-500">
              <span id="dn-info">0 dari 0 ditampilkan</span>
              <span id="dn-page-info"></span>
            </div>
          </div>
        </div>
      `;
    },

    init: async function () {
      const utils = window.SIMANTRI_UTILS;
      const data = window.SIMANTRI_DATA;
      const db = window.SIMANTRI_DB;
      const components = window.SIMANTRI_COMPONENTS;

      const JENIS_FILTER = ['Dokter', 'Dokter Gigi', 'Dokter Spesialis'];

      let _allNakes = [];
      let _allPraktik = [];
      let _allFasyankes = [];
      let _search = '';
      let _fasyankesId = '';
      let _status = '';

      // Bind controls
      const searchInput = document.getElementById('dn-search');
      if (searchInput) {
        searchInput.addEventListener('input', utils.debounce(function (e) {
          _search = e.target.value.trim();
          renderTable();
        }, 250));
      }
      const fasyankesSel = document.getElementById('dn-fasyankes');
      if (fasyankesSel) {
        fasyankesSel.addEventListener('change', function (e) {
          _fasyankesId = e.target.value;
          renderTable();
        });
      }
      const statusSel = document.getElementById('dn-status');
      if (statusSel) {
        statusSel.addEventListener('change', function (e) {
          _status = e.target.value;
          renderTable();
        });
      }
      const addBtn = document.querySelector('[data-action="add"]');
      if (addBtn) addBtn.addEventListener('click', function () {
        utils.toast('Form tambah nakes akan tersedia di modul produksi', 'info');
      });
      const exportBtn = document.querySelector('[data-action="export"]');
      if (exportBtn) exportBtn.addEventListener('click', exportCsv);

      // Listen for open-nakes event (from global search)
      document.addEventListener('simantri:open-nakes', function (e) {
        const id = e.detail && e.detail.id;
        if (id) {
          const n = _allNakes.find(function (x) { return x.id === id; });
          if (n) openDetail(n);
        }
      });

      async function load() {
        try {
          const [nakes, praktik, fasyankes] = await Promise.all([
            data.loadNakes({ jenis: JENIS_FILTER }),
            data.loadPraktik(),
            data.loadFasyankes(),
          ]);
          _allNakes = nakes;
          _allPraktik = praktik;
          _allFasyankes = fasyankes;

          // Populate fasyankes filter
          if (fasyankesSel) {
            fasyankesSel.innerHTML = '<option value="">Semua Fasyankes</option>'
              + fasyankes.map(function (f) {
                return '<option value="' + utils.escapeHtml(f.id) + '">' + utils.escapeHtml(f.nama) + '</option>';
              }).join('');
          }

          renderTable();
        } catch (err) {
          utils.toast('Gagal memuat data: ' + err.message, 'error');
          console.error(err);
        }
      }

      function getFiltered() {
        return _allNakes.filter(function (n) {
          if (_fasyankesId && n.fasyankes_id !== _fasyankesId) return false;
          if (_status) {
            const s = n.expire_status || db.calcExpireStatus(n.tgl_akhir_str);
            if (s !== _status) return false;
          }
          if (_search) {
            const q = _search.toLowerCase();
            if ((n.nama || '').toLowerCase().indexOf(q) < 0
              && (n.nik || '').indexOf(q) < 0
              && (n.no_str || '').toLowerCase().indexOf(q) < 0
              && (n.profesi || '').toLowerCase().indexOf(q) < 0) return false;
          }
          return true;
        });
      }

      function fasyankesName(id) {
        const f = _allFasyankes.find(function (x) { return x.id === id; });
        return f ? f.nama : '-';
      }

      function renderTable() {
        const tbody = document.getElementById('dn-tbody');
        if (!tbody) return;
        const filtered = getFiltered();
        const info = document.getElementById('dn-info');
        if (info) info.textContent = filtered.length + ' dari ' + _allNakes.length + ' ditampilkan';

        if (!filtered.length) {
          tbody.innerHTML = '<tr><td colspan="7">' + emptyStateRow('Tidak ada data nakes yang cocok', 'doctor') + '</td></tr>';
          return;
        }

        tbody.innerHTML = filtered.map(function (n) {
          const status = n.expire_status || db.calcExpireStatus(n.tgl_akhir_str);
          const pct = utils.progressPercent(n.tgl_terbit_str, n.tgl_akhir_str);
          const colorClass = utils.progressColorClass(pct);
          const colorHex = utils.progressColorHex(pct);
          const badgeClass = db.statusBadgeClass(status);
          const statusLabel = db.statusLabel(status);
          const colorAvatar = utils.avatarColor(n.nama);
          return '<tr class="cursor-pointer" data-nakes-id="' + utils.escapeHtml(n.id) + '">'
               + '<td>'
               + '<div class="flex items-center gap-3">'
               + '<div class="w-9 h-9 rounded-full ' + colorAvatar + ' text-white flex items-center justify-center text-xs font-bold flex-shrink-0">' + utils.escapeHtml(utils.initials(n.nama)) + '</div>'
               + '<div class="min-w-0">'
               + '<p class="text-sm font-semibold text-ink-900 truncate">' + utils.escapeHtml(n.nama) + '</p>'
               + '<p class="text-xs text-ink-500 truncate">' + utils.escapeHtml(n.profesi || '-') + '</p>'
               + '</div>'
               + '</div>'
               + '</td>'
               + '<td><span class="text-xs font-mono text-ink-600">' + utils.escapeHtml(n.nik || '-') + '</span></td>'
               + '<td><span class="text-xs font-mono text-ink-600">' + utils.escapeHtml(n.no_str || '-') + '</span></td>'
               + '<td>'
               + '<div class="flex items-center gap-2">'
               + '<div class="progress-track flex-1"><div class="progress-fill" style="width:' + pct + '%;background:' + colorHex + ';"></div></div>'
               + '<span class="text-[11px] font-semibold tabular-nums ' + (pct >= 80 ? 'text-rose-600' : pct >= 60 ? 'text-amber-600' : 'text-teal-600') + '">' + pct + '%</span>'
               + '</div>'
               + '<p class="text-[10px] text-ink-400 mt-0.5">s/d ' + utils.fmtDate(n.tgl_akhir_str) + '</p>'
               + '</td>'
               + '<td><span class="text-xs text-ink-700">' + utils.escapeHtml(fasyankesName(n.fasyankes_id)) + '</span></td>'
               + '<td><span class="badge ' + badgeClass + '">' + statusLabel + '</span></td>'
               + '<td class="text-right">'
               + '<button class="btn btn-ghost btn-sm" data-action="detail" data-id="' + utils.escapeHtml(n.id) + '" aria-label="Detail">'
               + '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>'
               + '</button>'
               + '</td>'
               + '</tr>';
        }).join('');

        tbody.querySelectorAll('tr[data-nakes-id]').forEach(function (tr) {
          tr.addEventListener('click', function (e) {
            if (e.target.closest('[data-action="detail"]')) return;
            const id = tr.dataset.nakesId;
            const n = _allNakes.find(function (x) { return x.id === id; });
            if (n) openDetail(n);
          });
        });
        tbody.querySelectorAll('[data-action="detail"]').forEach(function (btn) {
          btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const id = btn.dataset.id;
            const n = _allNakes.find(function (x) { return x.id === id; });
            if (n) openDetail(n);
          });
        });
      }

      function emptyStateRow(message, icon) {
        const iconPath = (components.ICONS[icon] || components.ICONS['doctor']);
        return '<div class="text-center py-10 px-4">'
             + '<div class="w-12 h-12 mx-auto rounded-xl bg-ink-100 text-ink-400 flex items-center justify-center mb-3">'
             + '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="' + iconPath + '"/></svg>'
             + '</div>'
             + '<p class="text-sm font-semibold text-ink-700">' + utils.escapeHtml(message) + '</p>'
             + '<p class="text-xs text-ink-500 mt-1">Coba ubah kata kunci atau filter</p>'
             + '</div>';
      }

      function openDetail(n) {
        const praktik = _allPraktik.filter(function (p) { return p.tenaga_id === n.id; });
        const fasyankes = _allFasyankes.find(function (f) { return f.id === n.fasyankes_id; });
        const strStatus = db.calcExpireStatus(n.tgl_akhir_str);
        const strDays = utils.daysUntil(n.tgl_akhir_str);
        const colorAvatar = utils.avatarColor(n.nama);

        // Build timeline
        const timeline = [];
        timeline.push({ label: 'STR Diterbitkan', date: n.tgl_terbit_str, desc: 'No. ' + (n.no_str || '-'), color: 'teal' });
        if (praktik.length) {
          praktik.forEach(function (p) {
            timeline.push({ label: 'SIP Diterbitkan', date: p.tgl_terbit_sip, desc: 'No. ' + (p.no_sip || '-') + ' &middot; ' + fasyankesName(p.fasyankes_id), color: 'lime' });
          });
        }
        timeline.sort(function (a, b) { return new Date(a.date) - new Date(b.date); });

        const timelineHtml = timeline.length ? timeline.map(function (t, i) {
          const dotColor = t.color === 'teal' ? 'bg-teal-500' : t.color === 'lime' ? 'bg-lime-500' : 'bg-ink-400';
          const isLast = i === timeline.length - 1;
          return '<div class="flex gap-3">'
               + '<div class="flex flex-col items-center">'
               + '<span class="w-2.5 h-2.5 rounded-full ' + dotColor + ' mt-1.5"></span>'
               + (!isLast ? '<span class="flex-1 w-px bg-ink-200 min-h-[24px]"></span>' : '')
               + '</div>'
               + '<div class="pb-4">'
               + '<p class="text-sm font-semibold text-ink-900">' + utils.escapeHtml(t.label) + '</p>'
               + '<p class="text-xs text-ink-500">' + utils.fmtDateLong(t.date) + '</p>'
               + '<p class="text-xs text-ink-600 mt-0.5">' + t.desc + '</p>'
               + '</div>'
               + '</div>';
        }).join('') : '<p class="text-xs text-ink-500">Belum ada riwayat perizinan.</p>';

        const modalHtml = `
          <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" data-modal>
            <div class="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" data-modal-close></div>
            <div class="relative card w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto" style="border-radius:1.25rem;">
              <div class="sticky top-0 bg-white p-5 border-b border-ink-100 flex items-start justify-between gap-3 z-10">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-12 h-12 rounded-full ` + colorAvatar + ` text-white flex items-center justify-center text-base font-bold flex-shrink-0">` + utils.escapeHtml(utils.initials(n.nama)) + `</div>
                  <div class="min-w-0">
                    <h3 class="text-lg font-bold text-ink-900 truncate">` + utils.escapeHtml(n.nama) + `</h3>
                    <p class="text-xs text-ink-500 truncate">` + utils.escapeHtml(n.profesi || '-') + `</p>
                  </div>
                </div>
                <button class="btn btn-ghost btn-sm" data-modal-close aria-label="Tutup">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <div class="p-5 space-y-5">
                <div class="grid grid-cols-2 gap-3">
                  <div class="rounded-xl bg-ink-50 p-3">
                    <p class="text-[10px] font-semibold text-ink-500 uppercase tracking-wider">NIK</p>
                    <p class="text-sm font-mono text-ink-800 mt-0.5">` + utils.escapeHtml(n.nik || '-') + `</p>
                  </div>
                  <div class="rounded-xl bg-ink-50 p-3">
                    <p class="text-[10px] font-semibold text-ink-500 uppercase tracking-wider">Jenis</p>
                    <p class="text-sm text-ink-800 mt-0.5">` + utils.escapeHtml(n.jenis || '-') + `</p>
                  </div>
                  <div class="rounded-xl bg-ink-50 p-3">
                    <p class="text-[10px] font-semibold text-ink-500 uppercase tracking-wider">Fasyankes</p>
                    <p class="text-sm text-ink-800 mt-0.5 truncate">` + utils.escapeHtml(fasyankes ? fasyankes.nama : '-') + `</p>
                  </div>
                  <div class="rounded-xl bg-ink-50 p-3">
                    <p class="text-[10px] font-semibold text-ink-500 uppercase tracking-wider">Status</p>
                    <p class="mt-0.5"><span class="badge ` + db.statusBadgeClass(strStatus) + `">` + db.statusLabel(strStatus) + `</span></p>
                  </div>
                </div>

                <div>
                  <h4 class="text-sm font-bold text-ink-900 mb-3">Detail STR</h4>
                  <div class="rounded-xl border border-ink-100 p-4 space-y-2.5">
                    <div class="flex justify-between text-sm"><span class="text-ink-500">Nomor STR</span><span class="font-mono text-ink-800">` + utils.escapeHtml(n.no_str || '-') + `</span></div>
                    <div class="flex justify-between text-sm"><span class="text-ink-500">Tanggal Terbit</span><span class="text-ink-800">` + utils.fmtDateLong(n.tgl_terbit_str) + `</span></div>
                    <div class="flex justify-between text-sm"><span class="text-ink-500">Berakhir</span><span class="text-ink-800">` + utils.fmtDateLong(n.tgl_akhir_str) + `</span></div>
                    <div class="flex justify-between text-sm"><span class="text-ink-500">Sisa Waktu</span><span class="font-semibold ` + (strDays < 0 ? 'text-rose-600' : strDays < 90 ? 'text-amber-600' : 'text-teal-600') + `">` + utils.relativeFromNow(n.tgl_akhir_str) + `</span></div>
                  </div>
                </div>

                ` + (praktik.length ? `
                <div>
                  <h4 class="text-sm font-bold text-ink-900 mb-3">SIP Aktif (` + praktik.length + `)</h4>
                  <div class="space-y-2">
                    ` + praktik.map(function (p) {
                      const sStatus = db.calcExpireStatus(p.tgl_akhir_sip);
                      return '<div class="rounded-xl border border-ink-100 p-3 flex items-center justify-between">'
                           + '<div>'
                           + '<p class="text-sm font-semibold text-ink-800">No. ' + utils.escapeHtml(p.no_sip || '-') + '</p>'
                           + '<p class="text-xs text-ink-500">' + utils.escapeHtml(fasyankesName(p.fasyankes_id)) + ' &middot; s/d ' + utils.fmtDate(p.tgl_akhir_sip) + '</p>'
                           + '</div>'
                           + '<span class="badge ' + db.statusBadgeClass(sStatus) + '">' + db.statusLabel(sStatus) + '</span>'
                           + '</div>';
                    }).join('') + `
                  </div>
                </div>` : '') + `

                <div>
                  <h4 class="text-sm font-bold text-ink-900 mb-3">Timeline Perizinan</h4>
                  ` + timelineHtml + `
                </div>
              </div>

              <div class="sticky bottom-0 bg-white p-4 border-t border-ink-100 flex justify-end gap-2">
                <button class="btn btn-outline btn-sm" data-modal-close>Tutup</button>
                <button class="btn btn-primary btn-sm" data-action="perpanjang-detail" data-tenaga-id="` + utils.escapeHtml(n.id) + `">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  Ajukan Perpanjangan
                </button>
              </div>
            </div>
          </div>
        `;

        const portal = document.getElementById('modal-portal');
        if (!portal) return;
        portal.innerHTML = modalHtml;

        portal.querySelectorAll('[data-modal-close]').forEach(function (el) {
          el.addEventListener('click', closeModal);
        });
        const perpanjangBtn = portal.querySelector('[data-action="perpanjang-detail"]');
        if (perpanjangBtn) {
          perpanjangBtn.addEventListener('click', function () {
            closeModal();
            window.SIMANTRI.navigateTo('perpanjangan');
            setTimeout(function () {
              document.dispatchEvent(new CustomEvent('simantri:start-perpanjangan', { detail: { tenagaId: n.id, tipe: 'STR' } }));
            }, 200);
          });
        }

        document.addEventListener('keydown', escClose);
      }

      function escClose(e) {
        if (e.key === 'Escape') closeModal();
      }

      function closeModal() {
        const portal = document.getElementById('modal-portal');
        if (portal) portal.innerHTML = '';
        document.removeEventListener('keydown', escClose);
      }

      function exportCsv() {
        try {
          const filtered = getFiltered();
          const headers = ['Nama', 'Profesi', 'Jenis', 'NIK', 'No STR', 'Fasyankes', 'Tgl Terbit STR', 'Tgl Akhir STR', 'Status'];
          const rows = [headers];
          filtered.forEach(function (n) {
            const status = n.expire_status || db.calcExpireStatus(n.tgl_akhir_str);
            rows.push([
              '"' + (n.nama || '').replace(/"/g, '""') + '"',
              '"' + (n.profesi || '').replace(/"/g, '""') + '"',
              '"' + (n.jenis || '').replace(/"/g, '""') + '"',
              n.nik || '',
              n.no_str || '',
              '"' + fasyankesName(n.fasyankes_id).replace(/"/g, '""') + '"',
              n.tgl_terbit_str || '',
              n.tgl_akhir_str || '',
              status,
            ]);
          });
          const csv = rows.map(function (r) { return r.join(','); }).join('\n');
          utils.downloadFile('simantri-data-nakes-' + Date.now() + '.csv', csv, 'text/csv');
          utils.toast('Data nakes diexport (' + filtered.length + ' baris)', 'success');
        } catch (e) {
          utils.toast('Gagal export: ' + e.message, 'error');
        }
      }

      await load();
    },
  };
})();
