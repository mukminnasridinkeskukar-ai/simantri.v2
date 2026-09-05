/* ============================================================================
 * SIMANTRI v3 — Page: Data Fasyankes & Praktik Mandiri (grid card view)
 * ============================================================================ */

(function () {
  'use strict';

  window.SIMANTRI_PAGES = window.SIMANTRI_PAGES || {};

  window.SIMANTRI_PAGES['data-fasyankes'] = {
    html: function () {
      return `
        <div class="space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 class="text-2xl font-extrabold text-ink-900 tracking-tight">Data Fasyankes &amp; Praktik Mandiri</h2>
              <p class="mt-1 text-sm text-ink-500 max-w-2xl">Daftar rumah sakit, puskesmas, klinik, apotek, dan praktik mandiri pada wilayah kerja.</p>
            </div>
            <div class="flex items-center gap-2">
              <button class="btn btn-outline btn-sm" data-action="refresh" type="button">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                Refresh
              </button>
              <button class="btn btn-primary btn-sm role-admin-only" data-action="add" type="button" data-role-action="add">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                Tambah Fasyankes
              </button>
            </div>
          </div>

          <!-- Filter bar -->
          <div class="card p-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div class="md:col-span-2">
                <label class="label" for="df-search">Pencarian</label>
                <div class="relative">
                  <svg class="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <input type="search" id="df-search" class="input" style="padding-left:2.25rem;" placeholder="Cari nama atau alamat fasyankes..." />
                </div>
              </div>
              <div>
                <label class="label" for="df-jenis">Jenis</label>
                <select id="df-jenis" class="select">
                  <option value="">Semua Jenis</option>
                  <option value="RS">Rumah Sakit</option>
                  <option value="Puskesmas">Puskesmas</option>
                  <option value="Klinik Utama">Klinik Utama</option>
                  <option value="Apotek">Apotek</option>
                  <option value="Praktik Mandiri">Praktik Mandiri</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Grid -->
          <div id="df-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div class="skeleton h-56"></div>
            <div class="skeleton h-56"></div>
            <div class="skeleton h-56"></div>
          </div>
        </div>
      `;
    },

    init: async function () {
      const utils = window.SIMANTRI_UTILS;
      const data = window.SIMANTRI_DATA;
      const db = window.SIMANTRI_DB;

      let _allFasyankes = [];
      let _allNakes = [];
      let _allPraktik = [];
      let _search = '';
      let _jenis = '';

      // Bind
      const searchInput = document.getElementById('df-search');
      if (searchInput) {
        searchInput.addEventListener('input', utils.debounce(function (e) {
          _search = e.target.value.trim();
          renderGrid();
        }, 250));
      }
      const jenisSel = document.getElementById('df-jenis');
      if (jenisSel) {
        jenisSel.addEventListener('change', function (e) {
          _jenis = e.target.value;
          renderGrid();
        });
      }
      const addBtn = document.querySelector('[data-action="add"]');
      if (addBtn) addBtn.addEventListener('click', function () {
        utils.toast('Form tambah fasyankes akan tersedia di modul produksi', 'info');
      });
      const refreshBtn = document.querySelector('[data-action="refresh"]');
      if (refreshBtn) refreshBtn.addEventListener('click', async function () {
        utils.toast('Memuat ulang...', 'info');
        await load();
      });

      // Open fasyankes event
      document.addEventListener('simantri:open-fasyankes', function (e) {
        const id = e.detail && e.detail.id;
        if (id) {
          const f = _allFasyankes.find(function (x) { return x.id === id; });
          if (f) openDetail(f);
        }
      });

      async function load() {
        try {
          const [fasyankes, nakes, praktik] = await Promise.all([
            data.loadFasyankes(),
            data.loadNakes(),
            data.loadPraktik(),
          ]);
          _allFasyankes = fasyankes;
          _allNakes = nakes;
          _allPraktik = praktik;
          renderGrid();
        } catch (err) {
          utils.toast('Gagal memuat fasyankes: ' + err.message, 'error');
          console.error(err);
        }
      }

      function getFiltered() {
        return _allFasyankes.filter(function (f) {
          if (_jenis && f.jenis !== _jenis) return false;
          if (_search) {
            const q = _search.toLowerCase();
            if ((f.nama || '').toLowerCase().indexOf(q) < 0 && (f.alamat || '').toLowerCase().indexOf(q) < 0) return false;
          }
          return true;
        });
      }

      function nakesCount(fasyankesId) {
        return _allNakes.filter(function (n) { return n.fasyankes_id === fasyankesId; }).length;
      }

      function sipAktifCount(fasyankesId) {
        return _allPraktik.filter(function (p) {
          return p.fasyankes_id === fasyankesId && (p.expire_status || db.calcExpireStatus(p.tgl_akhir_sip)) === db.STATUS.AKTIF;
        }).length;
      }

      function jenisMeta(jenis) {
        const map = {
          'RS': { color: '#0D9488', bg: 'bg-teal-50', text: 'text-teal-700', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Rumah Sakit' },
          'Puskesmas': { color: '#84CC16', bg: 'bg-lime-50', text: 'text-lime-700', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', label: 'Puskesmas' },
          'Klinik Utama': { color: '#F59E0B', bg: 'bg-amber-50', text: 'text-amber-700', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Klinik Utama' },
          'Apotek': { color: '#F43F5E', bg: 'bg-rose-50', text: 'text-rose-700', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', label: 'Apotek' },
          'Praktik Mandiri': { color: '#475569', bg: 'bg-ink-100', text: 'text-ink-700', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: 'Praktik Mandiri' },
        };
        return map[jenis] || { color: '#0D9488', bg: 'bg-teal-50', text: 'text-teal-700', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3', label: jenis };
      }

      function renderGrid() {
        const grid = document.getElementById('df-grid');
        if (!grid) return;
        const filtered = getFiltered();
        if (!filtered.length) {
          grid.innerHTML = emptyState('Tidak ada fasyankes yang cocok', 'hospital');
          return;
        }
        grid.innerHTML = filtered.map(function (f) {
          const meta = jenisMeta(f.jenis);
          const nakes = nakesCount(f.id);
          const sip = sipAktifCount(f.id);
          return '<button type="button" data-fasyankes-id="' + utils.escapeHtml(f.id) + '" class="card card-hover p-5 text-left flex flex-col">'
               + '<div class="flex items-start justify-between mb-3">'
               + '<div class="w-12 h-12 rounded-xl ' + meta.bg + ' ' + meta.text + ' flex items-center justify-center flex-shrink-0">'
               + '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="' + meta.icon + '"/></svg>'
               + '</div>'
               + '<span class="badge ' + (f.status === 'aktif' ? 'badge-teal' : 'badge-rose') + '">' + utils.escapeHtml(f.status === 'aktif' ? 'Aktif' : 'Nonaktif') + '</span>'
               + '</div>'
               + '<h3 class="text-base font-bold text-ink-900 leading-tight line-clamp-2">' + utils.escapeHtml(f.nama) + '</h3>'
               + '<p class="text-xs text-ink-500 mt-1">' + utils.escapeHtml(meta.label) + '</p>'
               + '<p class="text-xs text-ink-600 mt-2 line-clamp-2 flex-1">' + utils.escapeHtml(f.alamat || '-') + '</p>'
               + '<div class="mt-4 pt-4 border-t border-ink-100 grid grid-cols-2 gap-2 text-center">'
               + '<div>'
               + '<p class="text-lg font-extrabold text-ink-900 tabular-nums">' + nakes + '</p>'
               + '<p class="text-[10px] text-ink-500 uppercase tracking-wider">Nakes</p>'
               + '</div>'
               + '<div>'
               + '<p class="text-lg font-extrabold text-ink-900 tabular-nums">' + sip + '</p>'
               + '<p class="text-[10px] text-ink-500 uppercase tracking-wider">SIP Aktif</p>'
               + '</div>'
               + '</div>'
               + '</button>';
        }).join('');

        grid.querySelectorAll('[data-fasyankes-id]').forEach(function (card) {
          card.addEventListener('click', function () {
            const id = card.dataset.fasyankesId;
            const f = _allFasyankes.find(function (x) { return x.id === id; });
            if (f) openDetail(f);
          });
        });
      }

      function emptyState(message, icon) {
        const iconPath = ({
          hospital: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
        })[icon];
        return '<div class="col-span-full text-center py-12 px-4">'
             + '<div class="w-14 h-14 mx-auto rounded-xl bg-ink-100 text-ink-400 flex items-center justify-center mb-3">'
             + '<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="' + iconPath + '"/></svg>'
             + '</div>'
             + '<p class="text-sm font-semibold text-ink-700">' + utils.escapeHtml(message) + '</p>'
             + '<p class="text-xs text-ink-500 mt-1">Coba ubah kata kunci atau filter</p>'
             + '</div>';
      }

      function openDetail(f) {
        const nakesList = _allNakes.filter(function (n) { return n.fasyankes_id === f.id; });
        const praktikList = _allPraktik.filter(function (p) { return p.fasyankes_id === f.id; });
        const meta = jenisMeta(f.jenis);
        const sipAktif = praktikList.filter(function (p) { return (p.expire_status || db.calcExpireStatus(p.tgl_akhir_sip)) === db.STATUS.AKTIF; }).length;
        const sipHampir = praktikList.filter(function (p) { return (p.expire_status || db.calcExpireStatus(p.tgl_akhir_sip)) === db.STATUS.HAMPIR_EXPIRED; }).length;
        const sipExpired = praktikList.filter(function (p) { return (p.expire_status || db.calcExpireStatus(p.tgl_akhir_sip)) === db.STATUS.EXPIRED; }).length;

        const nakesRowsHtml = nakesList.length ? nakesList.map(function (n) {
          const status = n.expire_status || db.calcExpireStatus(n.tgl_akhir_str);
          const colorAvatar = utils.avatarColor(n.nama);
          return '<tr class="cursor-pointer" data-nakes-id="' + utils.escapeHtml(n.id) + '">'
               + '<td><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-full ' + colorAvatar + ' text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">' + utils.escapeHtml(utils.initials(n.nama)) + '</div><div class="min-w-0"><p class="text-xs font-semibold text-ink-900 truncate">' + utils.escapeHtml(n.nama) + '</p><p class="text-[10px] text-ink-500 truncate">' + utils.escapeHtml(n.profesi || '-') + '</p></div></div></td>'
               + '<td><span class="text-[10px] font-mono text-ink-600">' + utils.escapeHtml(n.no_str || '-') + '</span></td>'
               + '<td><span class="badge ' + db.statusBadgeClass(status) + '">' + db.statusLabel(status) + '</span></td>'
               + '</tr>';
        }).join('') : '<tr><td colspan="3" class="text-center text-xs text-ink-500 py-6">Belum ada nakes terdaftar</td></tr>';

        const modalHtml = `
          <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" data-modal>
            <div class="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" data-modal-close></div>
            <div class="relative card w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto" style="border-radius:1.25rem;">
              <div class="sticky top-0 bg-white p-5 border-b border-ink-100 flex items-start justify-between gap-3 z-10">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-12 h-12 rounded-xl ` + meta.bg + ` ` + meta.text + ` flex items-center justify-center flex-shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="` + meta.icon + `"/></svg>
                  </div>
                  <div class="min-w-0">
                    <h3 class="text-lg font-bold text-ink-900 truncate">` + utils.escapeHtml(f.nama) + `</h3>
                    <p class="text-xs text-ink-500">` + utils.escapeHtml(meta.label) + `</p>
                  </div>
                </div>
                <button class="btn btn-ghost btn-sm" data-modal-close aria-label="Tutup">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <div class="p-5 space-y-5">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="rounded-xl bg-ink-50 p-3">
                    <p class="text-[10px] font-semibold text-ink-500 uppercase tracking-wider">Alamat</p>
                    <p class="text-sm text-ink-800 mt-0.5">` + utils.escapeHtml(f.alamat || '-') + `</p>
                  </div>
                  <div class="rounded-xl bg-ink-50 p-3">
                    <p class="text-[10px] font-semibold text-ink-500 uppercase tracking-wider">Koordinat</p>
                    <p class="text-sm font-mono text-ink-800 mt-0.5">` + utils.escapeHtml(f.lat_lng || '-') + `</p>
                  </div>
                  <div class="rounded-xl bg-ink-50 p-3">
                    <p class="text-[10px] font-semibold text-ink-500 uppercase tracking-wider">Status</p>
                    <p class="mt-0.5"><span class="badge ` + (f.status === 'aktif' ? 'badge-teal' : 'badge-rose') + `">` + (f.status === 'aktif' ? 'Aktif' : 'Nonaktif') + `</span></p>
                  </div>
                  <div class="rounded-xl bg-ink-50 p-3">
                    <p class="text-[10px] font-semibold text-ink-500 uppercase tracking-wider">Total Nakes</p>
                    <p class="text-sm font-bold text-ink-800 mt-0.5">` + nakesList.length + ` tenaga kesehatan</p>
                  </div>
                </div>

                <div>
                  <h4 class="text-sm font-bold text-ink-900 mb-3">Statistik SIP</h4>
                  <div class="grid grid-cols-3 gap-2">
                    <div class="rounded-xl bg-teal-50 p-3 text-center">
                      <p class="text-2xl font-extrabold text-teal-700">` + sipAktif + `</p>
                      <p class="text-[10px] text-teal-700/80 font-semibold uppercase tracking-wide">Aktif</p>
                    </div>
                    <div class="rounded-xl bg-amber-50 p-3 text-center">
                      <p class="text-2xl font-extrabold text-amber-700">` + sipHampir + `</p>
                      <p class="text-[10px] text-amber-700/80 font-semibold uppercase tracking-wide">Hampir</p>
                    </div>
                    <div class="rounded-xl bg-rose-50 p-3 text-center">
                      <p class="text-2xl font-extrabold text-rose-700">` + sipExpired + `</p>
                      <p class="text-[10px] text-rose-700/80 font-semibold uppercase tracking-wide">Expired</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 class="text-sm font-bold text-ink-900 mb-3">Daftar Nakes (` + nakesList.length + `)</h4>
                  <div class="overflow-x-auto rounded-xl border border-ink-100">
                    <table class="data-table">
                      <thead><tr><th>Nama</th><th>No. STR</th><th>Status</th></tr></thead>
                      <tbody>` + nakesRowsHtml + `</tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div class="sticky bottom-0 bg-white p-4 border-t border-ink-100 flex justify-end gap-2">
                <button class="btn btn-outline btn-sm" data-modal-close>Tutup</button>
                <button class="btn btn-primary btn-sm" data-action="view-map" data-id="` + utils.escapeHtml(f.id) + `">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
                  Lihat di Peta
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
        const mapBtn = portal.querySelector('[data-action="view-map"]');
        if (mapBtn) {
          mapBtn.addEventListener('click', function () {
            closeModal();
            window.SIMANTRI.navigateTo('peta-sebaran');
          });
        }
        portal.querySelectorAll('[data-nakes-id]').forEach(function (tr) {
          tr.addEventListener('click', function () {
            closeModal();
            window.SIMANTRI.navigateTo('data-nakes');
            setTimeout(function () {
              document.dispatchEvent(new CustomEvent('simantri:open-nakes', { detail: { id: tr.dataset.nakesId } }));
            }, 200);
          });
        });
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

      await load();
    },
  };
})();
