/* ============================================================================
 * SIMANTRI v3 — Page: Peta Sebaran Praktik
 * ============================================================================ */

(function () {
  'use strict';

  window.SIMANTRI_PAGES = window.SIMANTRI_PAGES || {};

  window.SIMANTRI_PAGES['peta-sebaran'] = {
    html: function () {
      return `
        <div class="space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 class="text-2xl font-extrabold text-ink-900 tracking-tight">Peta Sebaran Praktik</h2>
              <p class="mt-1 text-sm text-ink-500 max-w-2xl">Visualisasi sebaran fasyankes &amp; praktik mandiri pada wilayah kerja Dinkes.</p>
            </div>
            <div class="flex items-center gap-2">
              <select id="map-filter" class="select" style="width:auto;">
                <option value="">Semua Jenis</option>
                <option value="RS">Rumah Sakit</option>
                <option value="Puskesmas">Puskesmas</option>
                <option value="Klinik Utama">Klinik Utama</option>
                <option value="Apotek">Apotek</option>
                <option value="Praktik Mandiri">Praktik Mandiri</option>
              </select>
              <button class="btn btn-outline btn-sm" data-action="refresh" type="button">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                Refresh
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Map -->
            <div class="card p-5 lg:col-span-2">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="text-base font-bold text-ink-900">Wilayah Surabaya</h3>
                  <p class="text-xs text-ink-500 mt-0.5">Klik marker untuk detail</p>
                </div>
                <span class="badge badge-teal" id="map-count">0 lokasi</span>
              </div>
              <div id="map-canvas" class="relative rounded-xl overflow-hidden border border-ink-100" style="height:440px;background:linear-gradient(135deg,#E0F2FE 0%,#F0FDFA 50%,#ECFCCB 100%);">
                <!-- Grid overlay -->
                <div class="absolute inset-0" style="background-image:linear-gradient(rgba(15,23,42,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(15,23,42,0.04) 1px,transparent 1px);background-size:32px 32px;"></div>
                <!-- River / road decorations -->
                <div class="absolute" style="top:30%;left:0;right:0;height:4px;background:linear-gradient(90deg,transparent,#7DD3FC,transparent);opacity:0.5;"></div>
                <div class="absolute" style="top:0;bottom:0;left:60%;width:4px;background:linear-gradient(180deg,transparent,#A1A1AA,transparent);opacity:0.3;"></div>
                <div class="absolute" style="top:0;bottom:0;left:30%;width:4px;background:linear-gradient(180deg,transparent,#A1A1AA,transparent);opacity:0.3;"></div>
                <!-- Markers injected here -->
                <div id="map-markers" class="absolute inset-0"></div>
                <!-- Empty state overlay -->
                <div id="map-empty" class="hidden absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div class="text-center text-ink-500">
                    <svg class="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
                    <p class="text-sm">Belum ada lokasi pada filter ini</p>
                  </div>
                </div>
              </div>
              <!-- Legend -->
              <div class="mt-4 flex flex-wrap gap-3 text-xs">
                <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full" style="background:#0D9488;"></span><span class="text-ink-600">RS</span></div>
                <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full" style="background:#84CC16;"></span><span class="text-ink-600">Puskesmas</span></div>
                <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full" style="background:#F59E0B;"></span><span class="text-ink-600">Klinik</span></div>
                <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full" style="background:#F43F5E;"></span><span class="text-ink-600">Apotek</span></div>
                <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full" style="background:#475569;"></span><span class="text-ink-600">Praktik Mandiri</span></div>
              </div>
            </div>

            <!-- Side panel -->
            <div class="card p-5">
              <h3 class="text-base font-bold text-ink-900 mb-1">Ringkasan Wilayah</h3>
              <p class="text-xs text-ink-500 mb-4">Sebaran fasyankes per jenis</p>

              <div id="map-summary" class="space-y-2 mb-5">
                <div class="skeleton h-8"></div>
                <div class="skeleton h-8"></div>
                <div class="skeleton h-8"></div>
              </div>

              <div class="border-t border-ink-100 pt-4">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="text-sm font-bold text-ink-900">Daftar Fasyankes</h4>
                  <span class="text-xs text-ink-500" id="map-list-count">0</span>
                </div>
                <div id="map-list" class="space-y-2 max-h-72 overflow-y-auto pr-1">
                  <div class="skeleton h-16"></div>
                  <div class="skeleton h-16"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    init: async function () {
      const utils = window.SIMANTRI_UTILS;
      const data = window.SIMANTRI_DATA;

      let _allFasyankes = [];
      let _allNakes = [];
      let _filter = '';

      // Bind
      const filterSel = document.getElementById('map-filter');
      if (filterSel) filterSel.addEventListener('change', function (e) {
        _filter = e.target.value;
        renderMap();
        renderSummary();
        renderList();
      });

      const refreshBtn = document.querySelector('[data-action="refresh"]');
      if (refreshBtn) refreshBtn.addEventListener('click', async function () {
        utils.toast('Memuat ulang...', 'info');
        await load();
      });

      async function load() {
        try {
          const [fasyankes, nakes] = await Promise.all([
            data.loadFasyankes(),
            data.loadNakes(),
          ]);
          _allFasyankes = fasyankes;
          _allNakes = nakes;
          renderMap();
          renderSummary();
          renderList();
        } catch (err) {
          utils.toast('Gagal memuat peta: ' + err.message, 'error');
          console.error(err);
        }
      }

      function getFiltered() {
        return _allFasyankes.filter(function (f) {
          return !_filter || f.jenis === _filter;
        });
      }

      function nakesCountFor(fasyankesId) {
        return _allNakes.filter(function (n) { return n.fasyankes_id === fasyankesId; }).length;
      }

      // Pseudo-lat/lng normalization. Sample range Surabaya.
      // Lat: -7.25 to -7.28, Lng: 112.74 to 112.78
      function normalizeCoords(latLng) {
        if (!latLng) return { x: 50, y: 50 };
        const parts = String(latLng).split(',').map(function (s) { return parseFloat(s); });
        if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return { x: 50, y: 50 };
        const lat = parts[0];
        const lng = parts[1];
        // Surabaya bbox
        const latMin = -7.30, latMax = -7.24;
        const lngMin = 112.73, lngMax = 112.79;
        const x = ((lng - lngMin) / (lngMax - lngMin)) * 100;
        const y = ((latMax - lat) / (latMax - latMin)) * 100;
        return {
          x: Math.max(5, Math.min(95, x)),
          y: Math.max(5, Math.min(95, y)),
        };
      }

      function colorForJenis(jenis) {
        switch (jenis) {
          case 'RS': return '#0D9488';
          case 'Puskesmas': return '#84CC16';
          case 'Klinik Utama': return '#F59E0B';
          case 'Apotek': return '#F43F5E';
          case 'Praktik Mandiri': return '#475569';
          default: return '#0D9488';
        }
      }

      function iconPathForJenis(jenis) {
        const map = {
          'RS': 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
          'Puskesmas': 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
          'Klinik Utama': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
          'Apotek': 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
          'Praktik Mandiri': 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
        };
        return map[jenis] || map['Puskesmas'];
      }

      function renderMap() {
        const container = document.getElementById('map-markers');
        const empty = document.getElementById('map-empty');
        const countEl = document.getElementById('map-count');
        if (!container) return;
        const filtered = getFiltered();
        if (countEl) countEl.textContent = filtered.length + ' lokasi';
        if (!filtered.length) {
          container.innerHTML = '';
          if (empty) empty.classList.remove('hidden');
          return;
        }
        if (empty) empty.classList.add('hidden');

        container.innerHTML = filtered.map(function (f) {
          const pos = normalizeCoords(f.lat_lng);
          const color = colorForJenis(f.jenis);
          const count = nakesCountFor(f.id);
          return '<button type="button" data-fasyankes-id="' + utils.escapeHtml(f.id) + '" '
               + 'class="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none" '
               + 'style="left:' + pos.x + '%;top:' + pos.y + '%;" '
               + 'aria-label="' + utils.escapeHtml(f.nama) + '">'
               + '<span class="block w-7 h-7 rounded-full shadow-lg ring-2 ring-white flex items-center justify-center text-white" style="background:' + color + ';">'
               + '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="' + iconPathForJenis(f.jenis) + '"/></svg>'
               + '</span>'
               + '<span class="absolute left-1/2 -translate-x-1/2 mt-1 px-2 py-1 rounded-md bg-ink-900 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style="top:100%;">' + utils.escapeHtml(f.nama) + ' &middot; ' + count + ' nakes</span>'
               + '<span class="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-white text-ink-700 text-[10px] font-bold flex items-center justify-center ring-1 ring-ink-200">' + count + '</span>'
               + '</button>';
        }).join('');

        container.querySelectorAll('[data-fasyankes-id]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            const id = btn.dataset.fasyankesId;
            window.SIMANTRI.navigateTo('data-fasyankes');
            setTimeout(function () {
              document.dispatchEvent(new CustomEvent('simantri:open-fasyankes', { detail: { id: id } }));
            }, 200);
          });
        });
      }

      function renderSummary() {
        const container = document.getElementById('map-summary');
        if (!container) return;
        const filtered = getFiltered();
        const grouped = {};
        filtered.forEach(function (f) {
          grouped[f.jenis] = (grouped[f.jenis] || 0) + 1;
        });
        const total = filtered.length || 1;
        const order = ['RS', 'Puskesmas', 'Klinik Utama', 'Apotek', 'Praktik Mandiri'];
        const rows = order.filter(function (k) { return grouped[k]; });
        if (!rows.length) {
          container.innerHTML = '<p class="text-xs text-ink-500 py-4 text-center">Tidak ada data</p>';
          return;
        }
        container.innerHTML = rows.map(function (k) {
          const count = grouped[k];
          const pct = Math.round((count / total) * 100);
          const color = colorForJenis(k);
          return '<div class="flex items-center gap-3">'
               + '<span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:' + color + ';"></span>'
               + '<span class="text-sm text-ink-700 flex-1">' + utils.escapeHtml(k) + '</span>'
               + '<div class="progress-track w-24"><div class="progress-fill" style="width:' + pct + '%;background:' + color + ';"></div></div>'
               + '<span class="text-sm font-semibold text-ink-900 tabular-nums w-6 text-right">' + count + '</span>'
               + '</div>';
        }).join('');
      }

      function renderList() {
        const container = document.getElementById('map-list');
        const countEl = document.getElementById('map-list-count');
        if (!container) return;
        const filtered = getFiltered();
        if (countEl) countEl.textContent = filtered.length;
        if (!filtered.length) {
          container.innerHTML = '<p class="text-xs text-ink-500 py-4 text-center">Tidak ada fasyankes pada filter ini</p>';
          return;
        }
        container.innerHTML = filtered.map(function (f) {
          const count = nakesCountFor(f.id);
          const color = colorForJenis(f.jenis);
          return '<button type="button" data-fasyankes-id="' + utils.escapeHtml(f.id) + '" class="w-full text-left p-3 rounded-xl border border-ink-100 hover:border-teal-300 hover:bg-teal-50/40 transition-colors">'
               + '<div class="flex items-start gap-3">'
               + '<span class="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0" style="background:' + color + ';">'
               + '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="' + iconPathForJenis(f.jenis) + '"/></svg>'
               + '</span>'
               + '<div class="flex-1 min-w-0">'
               + '<p class="text-sm font-semibold text-ink-900 truncate">' + utils.escapeHtml(f.nama) + '</p>'
               + '<p class="text-xs text-ink-500 truncate">' + utils.escapeHtml(f.alamat || '-') + '</p>'
               + '<div class="mt-1 flex items-center gap-2">'
               + '<span class="badge badge-ink">' + utils.escapeHtml(f.jenis) + '</span>'
               + '<span class="text-[11px] text-ink-500">' + count + ' nakes</span>'
               + '</div>'
               + '</div>'
               + '</div>'
               + '</button>';
        }).join('');

        container.querySelectorAll('[data-fasyankes-id]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            window.SIMANTRI.navigateTo('data-fasyankes');
            setTimeout(function () {
              document.dispatchEvent(new CustomEvent('simantri:open-fasyankes', { detail: { id: btn.dataset.fasyankesId } }));
            }, 200);
          });
        });
      }

      await load();
    },
  };
})();
