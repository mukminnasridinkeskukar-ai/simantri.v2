/* ============================================================================
 * SIMANTRI v3 — Page: Data Tenaga Kesehatan
 * (Perawat, Bidan, Apoteker, TTK, ATLM, Gizi, Kesling)
 * ============================================================================ */

(function () {
  'use strict';

  window.SIMANTRI_PAGES = window.SIMANTRI_PAGES || {};

  window.SIMANTRI_PAGES['data-tenaga-kesehatan'] = {
    html: function () {
      return `
        <div class="space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 class="text-2xl font-extrabold text-ink-900 tracking-tight">Data Tenaga Kesehatan</h2>
              <p class="mt-1 text-sm text-ink-500 max-w-2xl">Daftar perawat, bidan, apoteker, dan tenaga kesehatan pendukung beserta status legalitas.</p>
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

          <!-- Profesi chips -->
          <div class="card p-4">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-semibold text-ink-500 uppercase tracking-wider">Filter Profesi</span>
              <button class="text-xs text-teal-600 font-semibold hover:underline" data-action="reset-chips" type="button">Reset</button>
            </div>
            <div class="flex flex-wrap gap-2" id="dtk-chips"></div>
          </div>

          <!-- Filters -->
          <div class="card p-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div class="md:col-span-2">
                <label class="label" for="dtk-search">Pencarian</label>
                <div class="relative">
                  <svg class="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <input type="search" id="dtk-search" class="input" style="padding-left:2.25rem;" placeholder="Cari nama, NIK, no STR, profesi..." />
                </div>
              </div>
              <div>
                <label class="label" for="dtk-fasyankes">Fasyankes</label>
                <select id="dtk-fasyankes" class="select"><option value="">Semua Fasyankes</option></select>
              </div>
              <div>
                <label class="label" for="dtk-status">Status STR</label>
                <select id="dtk-status" class="select">
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
                <tbody id="dtk-tbody">
                  <tr><td colspan="7" class="text-center text-ink-500 py-8">Memuat data...</td></tr>
                </tbody>
              </table>
            </div>
            <div class="p-4 border-t border-ink-100 flex items-center justify-between text-xs text-ink-500">
              <span id="dtk-info">0 dari 0 ditampilkan</span>
              <span id="dtk-page-info"></span>
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

      const JENIS_OPTIONS = ['Perawat', 'Bidan', 'Apoteker', 'TTK', 'ATLM', 'Gizi', 'Kesling'];
      const JENIS_FILTER = JENIS_OPTIONS.slice();
      // chip definitions with icon paths
      const CHIPS = [
        { jenis: 'Perawat', label: 'Perawat', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
        { jenis: 'Bidan', label: 'Bidan', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        { jenis: 'Apoteker', label: 'Apoteker', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
        { jenis: 'TTK', label: 'TTK', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
        { jenis: 'ATLM', label: 'ATLM', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
        { jenis: 'Gizi', label: 'Gizi', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
        { jenis: 'Kesling', label: 'Kesling', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
      ];

      let _allNakes = [];
      let _allPraktik = [];
      let _allFasyankes = [];
      let _search = '';
      let _fasyankesId = '';
      let _status = '';
      let _activeJenis = new Set(JENIS_FILTER);

      // Render chips
      const chipsContainer = document.getElementById('dtk-chips');
      if (chipsContainer) {
        chipsContainer.innerHTML = CHIPS.map(function (c) {
          return '<button type="button" class="chip-jenis inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all" data-jenis="' + utils.escapeHtml(c.jenis) + '">'
               + '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="' + c.icon + '"/></svg>'
               + '<span>' + utils.escapeHtml(c.label) + '</span>'
               + '<span class="chip-count ml-1 text-[10px] opacity-70"></span>'
               + '</button>';
        }).join('');
        chipsContainer.querySelectorAll('.chip-jenis').forEach(function (chip) {
          chip.addEventListener('click', function () {
            const j = chip.dataset.jenis;
            if (_activeJenis.has(j)) {
              _activeJenis.delete(j);
            } else {
              _activeJenis.add(j);
            }
            updateChipStyles();
            renderTable();
          });
        });
      }
      updateChipStyles();

      const resetChipsBtn = document.querySelector('[data-action="reset-chips"]');
      if (resetChipsBtn) {
        resetChipsBtn.addEventListener('click', function () {
          _activeJenis = new Set(JENIS_FILTER);
          updateChipStyles();
          renderTable();
        });
      }

      function updateChipStyles() {
        document.querySelectorAll('.chip-jenis').forEach(function (chip) {
          const j = chip.dataset.jenis;
          const active = _activeJenis.has(j);
          chip.classList.toggle('bg-teal-600', active);
          chip.classList.toggle('text-white', active);
          chip.classList.toggle('border-teal-600', active);
          chip.classList.toggle('bg-white', !active);
          chip.classList.toggle('text-ink-700', !active);
          chip.classList.toggle('border-ink-200', !active);
          const count = _allNakes.filter(function (n) { return n.jenis === j; }).length;
          const countEl = chip.querySelector('.chip-count');
          if (countEl) countEl.textContent = '(' + count + ')';
        });
      }

      const searchInput = document.getElementById('dtk-search');
      if (searchInput) {
        searchInput.addEventListener('input', utils.debounce(function (e) {
          _search = e.target.value.trim();
          renderTable();
        }, 250));
      }
      const fasyankesSel = document.getElementById('dtk-fasyankes');
      if (fasyankesSel) {
        fasyankesSel.addEventListener('change', function (e) {
          _fasyankesId = e.target.value;
          renderTable();
        });
      }
      const statusSel = document.getElementById('dtk-status');
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
          if (fasyankesSel) {
            fasyankesSel.innerHTML = '<option value="">Semua Fasyankes</option>'
              + fasyankes.map(function (f) {
                return '<option value="' + utils.escapeHtml(f.id) + '">' + utils.escapeHtml(f.nama) + '</option>';
              }).join('');
          }
          updateChipStyles();
          renderTable();
        } catch (err) {
          utils.toast('Gagal memuat data: ' + err.message, 'error');
          console.error(err);
        }
      }

      function getFiltered() {
        return _allNakes.filter(function (n) {
          if (!_activeJenis.has(n.jenis)) return false;
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
        const tbody = document.getElementById('dtk-tbody');
        if (!tbody) return;
        const filtered = getFiltered();
        const info = document.getElementById('dtk-info');
        if (info) info.textContent = filtered.length + ' dari ' + _allNakes.length + ' ditampilkan';

        if (!filtered.length) {
          tbody.innerHTML = '<tr><td colspan="7">' + emptyStateRow('Tidak ada data nakes yang cocok', 'health') + '</td></tr>';
          return;
        }

        tbody.innerHTML = filtered.map(function (n) {
          const status = n.expire_status || db.calcExpireStatus(n.tgl_akhir_str);
          const pct = utils.progressPercent(n.tgl_terbit_str, n.tgl_akhir_str);
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
        const iconPath = (components.ICONS[icon] || components.ICONS['health']);
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
        const colorAvatar = utils.avatarColor(n.nama);

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
                    <p class="text-[10px] font-semibold text-ink-500 uppercase tracking-wider">Status STR</p>
                    <p class="mt-0.5"><span class="badge ` + db.statusBadgeClass(strStatus) + `">` + db.statusLabel(strStatus) + `</span></p>
                  </div>
                </div>
                <div>
                  <h4 class="text-sm font-bold text-ink-900 mb-3">Detail STR</h4>
                  <div class="rounded-xl border border-ink-100 p-4 space-y-2.5">
                    <div class="flex justify-between text-sm"><span class="text-ink-500">Nomor STR</span><span class="font-mono text-ink-800">` + utils.escapeHtml(n.no_str || '-') + `</span></div>
                    <div class="flex justify-between text-sm"><span class="text-ink-500">Tanggal Terbit</span><span class="text-ink-800">` + utils.fmtDateLong(n.tgl_terbit_str) + `</span></div>
                    <div class="flex justify-between text-sm"><span class="text-ink-500">Berakhir</span><span class="text-ink-800">` + utils.fmtDateLong(n.tgl_akhir_str) + `</span></div>
                    <div class="flex justify-between text-sm"><span class="text-ink-500">Sisa Waktu</span><span class="font-semibold ` + (utils.daysUntil(n.tgl_akhir_str) < 0 ? 'text-rose-600' : utils.daysUntil(n.tgl_akhir_str) < 90 ? 'text-amber-600' : 'text-teal-600') + `">` + utils.relativeFromNow(n.tgl_akhir_str) + `</span></div>
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
                <h3 class="text-base font-bold text-ink-900">` + (isEdit ? 'Edit Tenaga Kesehatan' : 'Tambah Tenaga Kesehatan') + `</h3>
                <button class="btn btn-ghost btn-sm" data-modal-close aria-label="Tutup">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <form id="dtk-form" class="p-5 space-y-4" novalidate>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="sm:col-span-2">
                    <label class="label" for="dtk-nama">Nama Lengkap <span class="text-rose-500">*</span></label>
                    <input type="text" id="dtk-nama" class="input" value="` + utils.escapeHtml(n ? n.nama : '') + `" required />
                    <p class="field-error hidden" id="dtk-nama-err">Nama wajib diisi</p>
                  </div>
                  <div>
                    <label class="label" for="dtk-nik">NIK (16 digit) <span class="text-rose-500">*</span></label>
                    <input type="text" id="dtk-nik" class="input" maxlength="16" inputmode="numeric" value="` + utils.escapeHtml(n ? n.nik : '') + `" required />
                    <p class="field-error hidden" id="dtk-nik-err">NIK harus 16 digit angka</p>
                  </div>
                  <div>
                    <label class="label" for="dtk-jenis">Jenis <span class="text-rose-500">*</span></label>
                    <select id="dtk-jenis" class="select" required>` + jenisOptions + `</select>
                  </div>
                  <div>
                    <label class="label" for="dtk-profesi">Profesi <span class="text-rose-500">*</span></label>
                    <input type="text" id="dtk-profesi" class="input" value="` + utils.escapeHtml(n ? n.profesi : '') + `" required />
                    <p class="field-error hidden" id="dtk-profesi-err">Profesi wajib diisi</p>
                  </div>
                  <div>
                    <label class="label" for="dtk-no-str">No. STR <span class="text-rose-500">*</span></label>
                    <input type="text" id="dtk-no-str" class="input" value="` + utils.escapeHtml(n ? n.no_str : '') + `" required />
                    <p class="field-error hidden" id="dtk-no-str-err">No. STR wajib diisi</p>
                  </div>
                  <div>
                    <label class="label" for="dtk-tgl-terbit">Tanggal Terbit STR <span class="text-rose-500">*</span></label>
                    <input type="date" id="dtk-tgl-terbit" class="input" value="` + utils.escapeHtml(n ? n.tgl_terbit_str : '') + `" required />
                    <p class="field-error hidden" id="dtk-tgl-terbit-err">Tanggal terbit wajib diisi</p>
                  </div>
                  <div>
                    <label class="label" for="dtk-tgl-akhir">Tanggal Akhir STR <span class="text-rose-500">*</span></label>
                    <input type="date" id="dtk-tgl-akhir" class="input" value="` + utils.escapeHtml(n ? n.tgl_akhir_str : '') + `" required />
                    <p class="field-error hidden" id="dtk-tgl-akhir-err">Tanggal akhir harus setelah tanggal terbit</p>
                  </div>
                  <div class="sm:col-span-2">
                    <label class="label" for="dtk-fasyankes-form">Fasyankes <span class="text-rose-500">*</span></label>
                    <select id="dtk-fasyankes-form" class="select" required>` + fasyankesOptions + `</select>
                    <p class="field-error hidden" id="dtk-fasyankes-err">Fasyankes wajib dipilih</p>
                  </div>
                  <div>
                    <label class="label" for="dtk-phone">No. Telepon</label>
                    <input type="tel" id="dtk-phone" class="input" value="` + utils.escapeHtml(n ? (n.phone || '') : '') + `" />
                  </div>
                  <div>
                    <label class="label" for="dtk-email">Email</label>
                    <input type="email" id="dtk-email" class="input" value="` + utils.escapeHtml(n ? (n.email || '') : '') + `" />
                    <p class="field-error hidden" id="dtk-email-err">Format email tidak valid</p>
                  </div>
                  <div class="sm:col-span-2">
                    <label class="label" for="dtk-status-form">Status</label>
                    <select id="dtk-status-form" class="select">
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
        const form = portal.querySelector('#dtk-form');
        if (form) {
          form.addEventListener('submit', function (e) {
            e.preventDefault();
            handleSubmit(id);
          });
        }
        const nikInput = portal.querySelector('#dtk-nik');
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
        const nama = val('#dtk-nama');
        const nik = val('#dtk-nik');
        const profesi = val('#dtk-profesi');
        const jenis = val('#dtk-jenis');
        const noStr = val('#dtk-no-str');
        const tglTerbitEl = portal.querySelector('#dtk-tgl-terbit');
        const tglAkhirEl = portal.querySelector('#dtk-tgl-akhir');
        const tglTerbit = tglTerbitEl ? tglTerbitEl.value : '';
        const tglAkhir = tglAkhirEl ? tglAkhirEl.value : '';
        const fasyankesId = val('#dtk-fasyankes-form');
        const phone = val('#dtk-phone');
        const email = val('#dtk-email');
        const status = val('#dtk-status-form');

        portal.querySelectorAll('.field-error').forEach(function (el) { el.classList.add('hidden'); });
        let valid = true;
        const err = function (sel) { const el = portal.querySelector(sel); if (el) el.classList.remove('hidden'); };
        if (!nama) { err('#dtk-nama-err'); valid = false; }
        if (!/^\d{16}$/.test(nik)) { err('#dtk-nik-err'); valid = false; }
        if (!profesi) { err('#dtk-profesi-err'); valid = false; }
        if (!noStr) { err('#dtk-no-str-err'); valid = false; }
        if (!tglTerbit) { err('#dtk-tgl-terbit-err'); valid = false; }
        if (!tglAkhir || !tglTerbit || new Date(tglAkhir) <= new Date(tglTerbit)) { err('#dtk-tgl-akhir-err'); valid = false; }
        if (!fasyankesId) { err('#dtk-fasyankes-err'); valid = false; }
        if (email && !utils.isEmail(email)) { err('#dtk-email-err'); valid = false; }

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
          utils.downloadFile('simantri-data-tenaga-kesehatan-' + Date.now() + '.csv', csv, 'text/csv');
          utils.toast('Data diexport (' + filtered.length + ' baris)', 'success');
        } catch (e) {
          utils.toast('Gagal export: ' + e.message, 'error');
        }
      }

      await load();
    },
  };
})();
