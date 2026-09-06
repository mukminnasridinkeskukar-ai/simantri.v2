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
              <button class="btn btn-outline btn-sm" data-action="export" type="button" data-role-action="download">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                Export CSV
              </button>
              <button class="btn btn-primary btn-sm" data-action="add" type="button" data-role-action="add">
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
      const auth = window.SIMANTRI_AUTH;
      const components = window.SIMANTRI_COMPONENTS;

      const JENIS_OPTIONS = ['Dokter', 'Dokter Gigi', 'Dokter Spesialis'];
      const JENIS_FILTER = JENIS_OPTIONS.slice();

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
      if (addBtn) addBtn.addEventListener('click', function () { openFormModal(); });
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
               + '<div class="flex items-center justify-end gap-1">'
               + '<button class="btn btn-ghost btn-sm" data-action="detail" data-id="' + utils.escapeHtml(n.id) + '" aria-label="Detail">'
               + '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>'
               + '</button>'
               + '<button class="btn btn-ghost btn-sm" data-action="edit" data-id="' + utils.escapeHtml(n.id) + '" data-role-action="edit" aria-label="Edit">'
               + '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>'
               + '</button>'
               + '<button class="btn btn-ghost btn-sm" data-action="delete" data-id="' + utils.escapeHtml(n.id) + '" data-role-action="delete" aria-label="Hapus">'
               + '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"/></svg>'
               + '</button>'
               + '</div>'
               + '</td>'
               + '</tr>';
        }).join('');

        tbody.querySelectorAll('tr[data-nakes-id]').forEach(function (tr) {
          tr.addEventListener('click', function (e) {
            if (e.target.closest('[data-action]')) return;
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
        tbody.querySelectorAll('[data-action="edit"]').forEach(function (btn) {
          btn.addEventListener('click', function (e) {
            e.stopPropagation();
            openFormModal(btn.dataset.id);
          });
        });
        tbody.querySelectorAll('[data-action="delete"]').forEach(function (btn) {
          btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const n = _allNakes.find(function (x) { return x.id === btn.dataset.id; });
            if (n) handleDelete(n);
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

      function openFormModal(id) {
        const isEdit = !!id;
        const n = isEdit ? _allNakes.find(function (x) { return x.id === id; }) : null;
        const fasyankesOptions = '<option value="">-- Pilih Fasyankes --</option>'
          + _allFasyankes.map(function (f) {
              const sel = n && n.fasyankes_id === f.id ? ' selected' : '';
              return '<option value="' + utils.escapeHtml(f.id) + '"' + sel + '>' + utils.escapeHtml(f.nama) + '</option>';
            }).join('');
        const jenisOptions = JENIS_OPTIONS.map(function (j) {
          const sel = n && n.jenis === j ? ' selected' : '';
          return '<option value="' + utils.escapeHtml(j) + '"' + sel + '>' + utils.escapeHtml(j) + '</option>';
        }).join('');

        const modalHtml = `
          <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" data-modal>
            <div class="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" data-modal-close></div>
            <div class="relative card w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto" style="border-radius:1.25rem;">
              <div class="sticky top-0 bg-white p-5 border-b border-ink-100 flex items-center justify-between z-10">
                <h3 class="text-base font-bold text-ink-900">` + (isEdit ? 'Edit Nakes' : 'Tambah Nakes') + `</h3>
                <button class="btn btn-ghost btn-sm" data-modal-close aria-label="Tutup">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <form id="dn-form" class="p-5 space-y-4" novalidate>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="sm:col-span-2">
                    <label class="label" for="dn-nama">Nama Lengkap <span class="text-rose-500">*</span></label>
                    <input type="text" id="dn-nama" class="input" value="` + utils.escapeHtml(n ? n.nama : '') + `" required />
                    <p class="field-error hidden" id="dn-nama-err">Nama wajib diisi</p>
                  </div>
                  <div>
                    <label class="label" for="dn-nik">NIK (16 digit) <span class="text-rose-500">*</span></label>
                    <input type="text" id="dn-nik" class="input" maxlength="16" inputmode="numeric" value="` + utils.escapeHtml(n ? n.nik : '') + `" required />
                    <p class="field-error hidden" id="dn-nik-err">NIK harus 16 digit angka</p>
                  </div>
                  <div>
                    <label class="label" for="dn-jenis">Jenis <span class="text-rose-500">*</span></label>
                    <select id="dn-jenis" class="select" required>` + jenisOptions + `</select>
                  </div>
                  <div>
                    <label class="label" for="dn-profesi">Profesi <span class="text-rose-500">*</span></label>
                    <input type="text" id="dn-profesi" class="input" value="` + utils.escapeHtml(n ? n.profesi : '') + `" required />
                    <p class="field-error hidden" id="dn-profesi-err">Profesi wajib diisi</p>
                  </div>
                  <div>
                    <label class="label" for="dn-no-str">No. STR <span class="text-rose-500">*</span></label>
                    <input type="text" id="dn-no-str" class="input" value="` + utils.escapeHtml(n ? n.no_str : '') + `" required />
                    <p class="field-error hidden" id="dn-no-str-err">No. STR wajib diisi</p>
                  </div>
                  <div>
                    <label class="label" for="dn-tgl-terbit">Tanggal Terbit STR <span class="text-rose-500">*</span></label>
                    <input type="date" id="dn-tgl-terbit" class="input" value="` + utils.escapeHtml(n ? n.tgl_terbit_str : '') + `" required />
                    <p class="field-error hidden" id="dn-tgl-terbit-err">Tanggal terbit wajib diisi</p>
                  </div>
                  <div>
                    <label class="label" for="dn-tgl-akhir">Tanggal Akhir STR <span class="text-rose-500">*</span></label>
                    <input type="date" id="dn-tgl-akhir" class="input" value="` + utils.escapeHtml(n ? n.tgl_akhir_str : '') + `" required />
                    <p class="field-error hidden" id="dn-tgl-akhir-err">Tanggal akhir harus setelah tanggal terbit</p>
                  </div>
                  <div class="sm:col-span-2">
                    <label class="label" for="dn-fasyankes-form">Fasyankes <span class="text-rose-500">*</span></label>
                    <select id="dn-fasyankes-form" class="select" required>` + fasyankesOptions + `</select>
                    <p class="field-error hidden" id="dn-fasyankes-err">Fasyankes wajib dipilih</p>
                  </div>
                  <div>
                    <label class="label" for="dn-phone">No. Telepon</label>
                    <input type="tel" id="dn-phone" class="input" value="` + utils.escapeHtml(n ? (n.phone || '') : '') + `" />
                  </div>
                  <div>
                    <label class="label" for="dn-email">Email</label>
                    <input type="email" id="dn-email" class="input" value="` + utils.escapeHtml(n ? (n.email || '') : '') + `" />
                    <p class="field-error hidden" id="dn-email-err">Format email tidak valid</p>
                  </div>
                  <div class="sm:col-span-2">
                    <label class="label" for="dn-status-form">Status</label>
                    <select id="dn-status-form" class="select">
                      <option value="aktif"` + (!n || n.status === 'aktif' ? ' selected' : '') + `>Aktif</option>
                      <option value="nonaktif"` + (n && n.status === 'nonaktif' ? ' selected' : '') + `>Nonaktif</option>
                    </select>
                  </div>
                </div>
                <div class="flex justify-end gap-2 pt-3 border-t border-ink-100">
                  <button type="button" class="btn btn-outline btn-sm" data-modal-close>Batal</button>
                  <button type="submit" class="btn btn-primary btn-sm">` + (isEdit ? 'Simpan Perubahan' : 'Tambah Nakes') + `</button>
                </div>
              </form>
            </div>
          </div>
        `;

        const portal = document.getElementById('modal-portal');
        if (!portal) return;
        portal.innerHTML = modalHtml;
        portal.querySelectorAll('[data-modal-close]').forEach(function (el) {
          el.addEventListener('click', closeModal);
        });
        const form = portal.querySelector('#dn-form');
        if (form) {
          form.addEventListener('submit', function (e) {
            e.preventDefault();
            handleSubmit(id);
          });
        }
        const nikInput = portal.querySelector('#dn-nik');
        if (nikInput) {
          nikInput.addEventListener('input', function (e) {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 16);
          });
        }
        document.addEventListener('keydown', escClose);
      }

      function handleSubmit(id) {
        const portal = document.getElementById('modal-portal');
        if (!portal) return;
        const val = function (sel) { const el = portal.querySelector(sel); return el ? el.value.trim() : ''; };
        const nama = val('#dn-nama');
        const nik = val('#dn-nik');
        const profesi = val('#dn-profesi');
        const jenis = val('#dn-jenis');
        const noStr = val('#dn-no-str');
        const tglTerbitEl = portal.querySelector('#dn-tgl-terbit');
        const tglAkhirEl = portal.querySelector('#dn-tgl-akhir');
        const tglTerbit = tglTerbitEl ? tglTerbitEl.value : '';
        const tglAkhir = tglAkhirEl ? tglAkhirEl.value : '';
        const fasyankesId = val('#dn-fasyankes-form');
        const phone = val('#dn-phone');
        const email = val('#dn-email');
        const status = val('#dn-status-form');

        portal.querySelectorAll('.field-error').forEach(function (el) { el.classList.add('hidden'); });
        let valid = true;
        const err = function (sel) { const el = portal.querySelector(sel); if (el) el.classList.remove('hidden'); };
        if (!nama) { err('#dn-nama-err'); valid = false; }
        if (!/^\d{16}$/.test(nik)) { err('#dn-nik-err'); valid = false; }
        if (!profesi) { err('#dn-profesi-err'); valid = false; }
        if (!noStr) { err('#dn-no-str-err'); valid = false; }
        if (!tglTerbit) { err('#dn-tgl-terbit-err'); valid = false; }
        if (!tglAkhir || !tglTerbit || new Date(tglAkhir) <= new Date(tglTerbit)) { err('#dn-tgl-akhir-err'); valid = false; }
        if (!fasyankesId) { err('#dn-fasyankes-err'); valid = false; }
        if (email && !utils.isEmail(email)) { err('#dn-email-err'); valid = false; }

        if (!valid) {
          utils.toast('Periksa kembali isian form', 'error');
          return;
        }

        const payload = {
          nama: nama,
          nik: nik,
          profesi: profesi,
          jenis: jenis,
          no_str: noStr,
          tgl_terbit_str: tglTerbit,
          tgl_akhir_str: tglAkhir,
          fasyankes_id: fasyankesId,
          phone: phone || null,
          email: email || null,
          status: status
        };

        (async function () {
          try {
            const profile = auth.getProfile();
            if (id) {
              await data.updateNakes(id, payload);
              await data.addAuditLog({
                user_id: profile.id,
                user_name: profile.full_name,
                action: 'UPDATE',
                entity: 'tenaga_kesehatan',
                entity_id: id,
                detail: 'Update nakes: ' + nama
              });
              utils.toast('Data berhasil diperbarui', 'success');
            } else {
              const item = await data.addNakes(payload);
              await data.addAuditLog({
                user_id: profile.id,
                user_name: profile.full_name,
                action: 'CREATE',
                entity: 'tenaga_kesehatan',
                entity_id: item.id,
                detail: 'Tambah nakes: ' + nama
              });
              utils.toast('Data berhasil ditambahkan', 'success');
            }
            closeModal();
            await load();
          } catch (e) {
            utils.toast('Error: ' + e.message, 'error');
          }
        })();
      }

      async function handleDelete(n) {
        if (!confirm('Hapus nakes "' + n.nama + '"? Tindakan ini tidak dapat dibatalkan.')) return;
        try {
          await data.deleteNakes(n.id);
          const profile = auth.getProfile();
          await data.addAuditLog({
            user_id: profile.id,
            user_name: profile.full_name,
            action: 'DELETE',
            entity: 'tenaga_kesehatan',
            entity_id: n.id,
            detail: 'Hapus nakes: ' + n.nama
          });
          utils.toast('Data nakes dihapus', 'success');
          await load();
        } catch (e) {
          utils.toast('Error: ' + e.message, 'error');
        }
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
