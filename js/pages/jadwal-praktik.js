/* ============================================================================
 * SIMANTRI v3 — Page: Jadwal Praktik
 * ============================================================================ */

(function () {
  'use strict';

  window.SIMANTRI_PAGES = window.SIMANTRI_PAGES || {};

  window.SIMANTRI_PAGES['jadwal-praktik'] = {
    html: function () {
      return `
        <div class="space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 class="text-2xl font-extrabold text-ink-900 tracking-tight">Jadwal Praktik</h2>
              <p class="mt-1 text-sm text-ink-500 max-w-2xl">Jadwal praktik tenaga kesehatan pada fasyankes. Pilih fasyankes untuk memfilter.</p>
            </div>
            <div class="flex items-center gap-2">
              <select id="jp-fasyankes" class="select" style="width:auto;"><option value="">Semua Fasyankes</option></select>
              <button class="btn btn-outline btn-sm" data-action="refresh" type="button">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                Refresh
              </button>
            </div>
          </div>

          <!-- View toggle -->
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-ink-500 uppercase tracking-wider mr-1">Tampilan:</span>
            <button type="button" class="btn btn-primary btn-sm jp-view-btn" data-view="week">Mingguan</button>
            <button type="button" class="btn btn-outline btn-sm jp-view-btn" data-view="list">Daftar</button>
          </div>

          <!-- Week view -->
          <div id="jp-week" class="card p-5">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-base font-bold text-ink-900">Kalender Mingguan</h3>
                <p class="text-xs text-ink-500 mt-0.5">Senin sampai Minggu, pukul 07.00 - 21.00 WIB</p>
              </div>
              <span class="badge badge-teal" id="jp-total">0 sesi</span>
            </div>
            <div class="overflow-x-auto">
              <div id="jp-week-grid" class="min-w-[800px]">
                <div class="skeleton h-96"></div>
              </div>
            </div>
          </div>

          <!-- List view -->
          <div id="jp-list" class="hidden card p-5">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-base font-bold text-ink-900">Daftar Jadwal per Hari</h3>
                <p class="text-xs text-ink-500 mt-0.5">Diurutkan berdasarkan hari &amp; jam mulai</p>
              </div>
            </div>
            <div id="jp-list-content" class="space-y-4">
              <div class="skeleton h-24"></div>
              <div class="skeleton h-24"></div>
            </div>
          </div>
        </div>
      `;
    },

    init: async function () {
      const utils = window.SIMANTRI_UTILS;
      const data = window.SIMANTRI_DATA;
      const db = window.SIMANTRI_DB;

      const DAYS = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
      const DAY_LABELS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
      const DAY_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
      const START_HOUR = 7;
      const END_HOUR = 21;

      let _allPraktik = [];
      let _allNakes = [];
      let _allFasyankes = [];
      let _fasyankesId = '';
      let _view = 'week';

      const fasyankesSel = document.getElementById('jp-fasyankes');
      if (fasyankesSel) {
        fasyankesSel.addEventListener('change', function (e) {
          _fasyankesId = e.target.value;
          render();
        });
      }
      document.querySelectorAll('.jp-view-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          _view = btn.dataset.view;
          document.querySelectorAll('.jp-view-btn').forEach(function (b) {
            b.classList.remove('btn-primary', 'btn-outline');
            b.classList.add(b === btn ? 'btn-primary' : 'btn-outline');
          });
          toggleView();
        });
      });
      const refreshBtn = document.querySelector('[data-action="refresh"]');
      if (refreshBtn) refreshBtn.addEventListener('click', async function () {
        utils.toast('Memuat ulang jadwal...', 'info');
        await load();
      });

      function toggleView() {
        const weekEl = document.getElementById('jp-week');
        const listEl = document.getElementById('jp-list');
        if (weekEl) weekEl.classList.toggle('hidden', _view !== 'week');
        if (listEl) listEl.classList.toggle('hidden', _view !== 'list');
      }

      async function load() {
        try {
          const [praktik, nakes, fasyankes] = await Promise.all([
            data.loadPraktik(),
            data.loadNakes(),
            data.loadFasyankes(),
          ]);
          _allPraktik = praktik;
          _allNakes = nakes;
          _allFasyankes = fasyankes;

          if (fasyankesSel) {
            fasyankesSel.innerHTML = '<option value="">Semua Fasyankes</option>'
              + fasyankes.map(function (f) {
                return '<option value="' + utils.escapeHtml(f.id) + '">' + utils.escapeHtml(f.nama) + '</option>';
              }).join('');
          }
          render();
        } catch (err) {
          utils.toast('Gagal memuat jadwal: ' + err.message, 'error');
          console.error(err);
        }
      }

      function getFilteredPraktik() {
        return _allPraktik.filter(function (p) {
          if (_fasyankesId && p.fasyankes_id !== _fasyankesId) return false;
          return true;
        });
      }

      function nakesName(id) {
        const n = _allNakes.find(function (x) { return x.id === id; });
        return n ? n.nama : 'Nakes';
      }
      function nakesProfesi(id) {
        const n = _allNakes.find(function (x) { return x.id === id; });
        return n ? n.profesi : '-';
      }
      function fasyankesName(id) {
        const f = _allFasyankes.find(function (x) { return x.id === id; });
        return f ? f.nama : '-';
      }

      // Parse jadwal_json → returns array of { dayIdx, mulai, selesai, label, color }
      function parseJadwal(jadwalJson) {
        if (!jadwalJson) return [];
        let obj;
        try {
          obj = typeof jadwalJson === 'string' ? JSON.parse(jadwalJson) : jadwalJson;
        } catch (e) { return []; }
        if (!obj || typeof obj !== 'object') return [];

        const result = [];
        Object.keys(obj).forEach(function (key) {
          const slot = obj[key];
          if (!slot || !slot.mulai || !slot.selesai) return;
          const days = resolveDays(key);
          days.forEach(function (dayIdx) {
            result.push({
              dayIdx: dayIdx,
              mulai: slot.mulai,
              selesai: slot.selesai,
              key: key,
              label: key.replace(/_/g, ' '),
            });
          });
        });
        return result;
      }

      function resolveDays(key) {
        // Single day
        const idx = DAYS.indexOf(key);
        if (idx >= 0) return [idx];
        // Range: start_end (e.g. senin_jumat)
        const parts = key.split('_');
        if (parts.length === 2) {
          const startIdx = DAYS.indexOf(parts[0]);
          const endIdx = DAYS.indexOf(parts[1]);
          if (startIdx >= 0 && endIdx >= 0 && startIdx <= endIdx) {
            const arr = [];
            for (let i = startIdx; i <= endIdx; i++) arr.push(i);
            return arr;
          }
        }
        // Shifts: shift_pagi, shift_sore → apply weekdays (Senin-Jumat)
        if (key === 'shift_pagi' || key === 'shift_sore') {
          return [0, 1, 2, 3, 4];
        }
        return [];
      }

      function timeToMinutes(t) {
        if (!t) return 0;
        const parts = String(t).split(':');
        return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
      }

      function render() {
        const praktik = getFilteredPraktik();
        // Build sessions array
        const sessions = [];
        praktik.forEach(function (p) {
          const slots = parseJadwal(p.jadwal_json);
          slots.forEach(function (s) {
            sessions.push({
              praktikId: p.id,
              tenagaId: p.tenaga_id,
              fasyankesId: p.fasyankes_id,
              noSip: p.no_sip,
              dayIdx: s.dayIdx,
              mulai: s.mulai,
              selesai: s.selesai,
              label: s.label,
            });
          });
        });

        renderWeek(sessions);
        renderList(sessions);

        const totalEl = document.getElementById('jp-total');
        if (totalEl) totalEl.textContent = sessions.length + ' sesi';
      }

      function renderWeek(sessions) {
        const grid = document.getElementById('jp-week-grid');
        if (!grid) return;

        // Group sessions by dayIdx
        const byDay = [[], [], [], [], [], [], []];
        sessions.forEach(function (s) { byDay[s.dayIdx].push(s); });

        // Build grid header
        const palette = ['#0D9488', '#84CC16', '#F59E0B', '#F43F5E', '#475569', '#0F766E', '#4D7C0F', '#B45309'];
        const colorForFasyankes = {};
        let colorIdx = 0;
        _allFasyankes.forEach(function (f) {
          colorForFasyankes[f.id] = palette[colorIdx % palette.length];
          colorIdx++;
        });

        // Header row
        let html = '<div class="grid" style="grid-template-columns:60px repeat(7, minmax(110px, 1fr)); gap:4px;">';
        html += '<div></div>';
        DAY_LABELS.forEach(function (lab, i) {
          const count = byDay[i].length;
          html += '<div class="text-center pb-2">'
               + '<p class="text-sm font-bold text-ink-900">' + lab + '</p>'
               + '<p class="text-[10px] text-ink-500">' + count + ' sesi</p>'
               + '</div>';
        });

        // Time rows
        for (let h = START_HOUR; h <= END_HOUR; h++) {
          html += '<div class="text-right pr-2 text-[10px] text-ink-500 font-mono pt-1">' + String(h).padStart(2, '0') + ':00</div>';
          for (let d = 0; d < 7; d++) {
            // Find sessions active at this hour
            const active = byDay[d].filter(function (s) {
              const sStart = timeToMinutes(s.mulai);
              const sEnd = timeToMinutes(s.selesai);
              const hMin = h * 60;
              return sStart <= hMin && sEnd > hMin;
            });
            const isHourStart = true; // each cell is one hour
            // For first cell of a session, render the full block
            const starts = byDay[d].filter(function (s) {
              return timeToMinutes(s.mulai) === h * 60;
            });
            let cellHtml = '<div class="relative border-t border-ink-100" style="min-height:36px;">';
            // Render sessions that start at this hour
            starts.forEach(function (s, idx) {
              const startMin = timeToMinutes(s.mulai);
              const endMin = timeToMinutes(s.selesai);
              const duration = endMin - startMin;
              const heightPx = (duration / 60) * 36 - 2;
              const color = colorForFasyankes[s.fasyankesId] || '#0D9488';
              const top = idx * 4;
              cellHtml += '<div class="absolute left-0.5 right-0.5 rounded-md text-white text-[10px] leading-tight px-1.5 py-1 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" '
                       + 'style="top:' + top + 'px;height:' + heightPx + 'px;background:' + color + ';" '
                       + 'data-praktik-id="' + utils.escapeHtml(s.praktikId) + '" data-tenaga-id="' + utils.escapeHtml(s.tenagaId) + '" '
                       + 'title="' + utils.escapeHtml(nakesName(s.tenagaId)) + '">'
                       + '<p class="font-semibold truncate">' + utils.escapeHtml(nakesName(s.tenagaId)) + '</p>'
                       + '<p class="opacity-90">' + utils.escapeHtml(s.mulai) + '-' + utils.escapeHtml(s.selesai) + '</p>'
                       + '</div>';
            });
            cellHtml += '</div>';
            html += cellHtml;
          }
        }
        html += '</div>';

        if (!sessions.length) {
          html = '<div class="text-center py-12">'
               + '<div class="w-14 h-14 mx-auto rounded-xl bg-ink-100 text-ink-400 flex items-center justify-center mb-3">'
               + '<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>'
               + '</div>'
               + '<p class="text-sm font-semibold text-ink-700">Belum ada jadwal praktik</p>'
               + '<p class="text-xs text-ink-500 mt-1">Pilih fasyankes lain atau tambah data praktik</p>'
               + '</div>';
        }

        grid.innerHTML = html;

        grid.querySelectorAll('[data-praktik-id]').forEach(function (el) {
          el.addEventListener('click', function () {
            const tenagaId = el.dataset.tenagaId;
            utils.toast('Membuka detail nakes...', 'info');
            window.SIMANTRI.navigateTo('data-nakes');
            setTimeout(function () {
              document.dispatchEvent(new CustomEvent('simantri:open-nakes', { detail: { id: tenagaId } }));
            }, 200);
          });
        });
      }

      function renderList(sessions) {
        const container = document.getElementById('jp-list-content');
        if (!container) return;
        if (!sessions.length) {
          container.innerHTML = '<div class="text-center py-12">'
              + '<div class="w-14 h-14 mx-auto rounded-xl bg-ink-100 text-ink-400 flex items-center justify-center mb-3">'
              + '<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>'
              + '</div>'
              + '<p class="text-sm font-semibold text-ink-700">Belum ada jadwal praktik</p>'
              + '</div>';
          return;
        }

        // Group by day
        const grouped = [[], [], [], [], [], [], []];
        sessions.forEach(function (s) { grouped[s.dayIdx].push(s); });

        container.innerHTML = DAY_LABELS.map(function (lab, dayIdx) {
          const items = grouped[dayIdx].slice().sort(function (a, b) {
            return timeToMinutes(a.mulai) - timeToMinutes(b.mulai);
          });
          if (!items.length) return '';
          return '<div class="rounded-xl border border-ink-100 overflow-hidden">'
               + '<div class="bg-ink-50 px-4 py-2 flex items-center justify-between">'
               + '<h4 class="text-sm font-bold text-ink-900">' + lab + '</h4>'
               + '<span class="badge badge-ink">' + items.length + ' sesi</span>'
               + '</div>'
               + '<div class="divide-y divide-ink-100">'
               + items.map(function (s) {
                 const colorAvatar = utils.avatarColor(nakesName(s.tenagaId));
                 return '<div class="p-3 flex items-center gap-3 hover:bg-teal-50/40 transition-colors cursor-pointer" data-tenaga-id="' + utils.escapeHtml(s.tenagaId) + '">'
                      + '<div class="text-center flex-shrink-0 w-16">'
                      + '<p class="text-xs font-bold text-ink-900">' + utils.escapeHtml(s.mulai) + '</p>'
                      + '<p class="text-[10px] text-ink-400">-</p>'
                      + '<p class="text-xs font-bold text-ink-900">' + utils.escapeHtml(s.selesai) + '</p>'
                      + '</div>'
                      + '<div class="w-9 h-9 rounded-full ' + colorAvatar + ' text-white flex items-center justify-center text-xs font-bold flex-shrink-0">' + utils.escapeHtml(utils.initials(nakesName(s.tenagaId))) + '</div>'
                      + '<div class="flex-1 min-w-0">'
                      + '<p class="text-sm font-semibold text-ink-900 truncate">' + utils.escapeHtml(nakesName(s.tenagaId)) + '</p>'
                      + '<p class="text-xs text-ink-500 truncate">' + utils.escapeHtml(nakesProfesi(s.tenagaId)) + ' &middot; ' + utils.escapeHtml(fasyankesName(s.fasyankesId)) + '</p>'
                      + '</div>'
                      + '<span class="badge badge-lime">SIP ' + utils.escapeHtml(s.noSip || '-') + '</span>'
                      + '</div>';
               }).join('')
               + '</div>'
               + '</div>';
        }).filter(Boolean).join('');

        container.querySelectorAll('[data-tenaga-id]').forEach(function (el) {
          el.addEventListener('click', function () {
            const tenagaId = el.dataset.tenagaId;
            window.SIMANTRI.navigateTo('data-nakes');
            setTimeout(function () {
              document.dispatchEvent(new CustomEvent('simantri:open-nakes', { detail: { id: tenagaId } }));
            }, 200);
          });
        });
      }

      await load();
    },
  };
})();
