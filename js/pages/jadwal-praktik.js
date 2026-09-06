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
      const auth = window.SIMANTRI_AUTH;

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

      // Inject "Tambah Jadwal" button if not exists (single role: Admin Dinkes)
      const headerActions = document.querySelector('#jp-fasyankes') ? document.querySelector('#jp-fasyankes').parentElement : null;
      let addJadwalBtn = null;
      if (headerActions) {
        addJadwalBtn = document.createElement('button');
        addJadwalBtn.className = 'btn btn-primary btn-sm role-dinkes-only';
        addJadwalBtn.setAttribute('type', 'button');
        addJadwalBtn.setAttribute('data-role-action', 'add');
        addJadwalBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg> Tambah Jadwal';
        headerActions.insertBefore(addJadwalBtn, headerActions.firstChild);
        addJadwalBtn.addEventListener('click', function () { openFormModal(); });
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
          el.addEventListener('click', function (e) {
            e.stopPropagation();
            const id = el.dataset.praktikId;
            openFormModal(id);
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
                 return '<div class="p-3 flex items-center gap-3 hover:bg-teal-50/40 transition-colors cursor-pointer" data-tenaga-id="' + utils.escapeHtml(s.tenagaId) + '" data-praktik-id="' + utils.escapeHtml(s.praktikId) + '">'
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
          el.addEventListener('click', function (e) {
            // Find the parent session row and locate its praktik id via dataset on the row
            const row = e.currentTarget;
            const praktikId = row.getAttribute('data-praktik-id');
            if (praktikId) {
              openFormModal(praktikId);
            } else {
              const tenagaId = el.dataset.tenagaId;
              window.SIMANTRI.navigateTo('data-nakes');
              setTimeout(function () {
                document.dispatchEvent(new CustomEvent('simantri:open-nakes', { detail: { id: tenagaId } }));
              }, 200);
            }
          });
        });
      }

      function openFormModal(id) {
        const isEdit = !!id;
        const p = isEdit ? _allPraktik.find(function (x) { return x.id === id; }) : null;
        const tenagaOptions = '<option value="">-- Pilih Nakes --</option>'
          + _allNakes.map(function (n) {
              const sel = p && p.tenaga_id === n.id ? ' selected' : '';
              return '<option value="' + utils.escapeHtml(n.id) + '"' + sel + '>' + utils.escapeHtml(n.nama) + ' · ' + utils.escapeHtml(n.profesi || '-') + '</option>';
            }).join('');
        const fasyankesOptions = '<option value="">-- Pilih Fasyankes --</option>'
          + _allFasyankes.map(function (f) {
              const sel = p && p.fasyankes_id === f.id ? ' selected' : '';
              return '<option value="' + utils.escapeHtml(f.id) + '"' + sel + '>' + utils.escapeHtml(f.nama) + '</option>';
            }).join('');
        const jenisDokOptions = ['SIP', 'SIK', 'Rekomendasi'].map(function (j) {
          const sel = p && p.jenis_dok === j ? ' selected' : '';
          return '<option value="' + utils.escapeHtml(j) + '"' + sel + '>' + utils.escapeHtml(j) + '</option>';
        }).join('');
        const statusOptions = ['aktif', 'nonaktif'].map(function (s) {
          const sel = p && p.status === s ? ' selected' : (!p && s === 'aktif' ? ' selected' : '');
          return '<option value="' + s + '"' + sel + '>' + (s === 'aktif' ? 'Aktif' : 'Nonaktif') + '</option>';
        }).join('');
        const jadwalValue = p && p.jadwal_json ? (typeof p.jadwal_json === 'string' ? p.jadwal_json : JSON.stringify(p.jadwal_json, null, 2)) : '{\n  "senin_jumat": { "mulai": "08:00", "selesai": "14:00" }\n}';

        const modalHtml = `
          <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" data-modal>
            <div class="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" data-modal-close></div>
            <div class="relative card w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto" style="border-radius:1.25rem;">
              <div class="sticky top-0 bg-white p-5 border-b border-ink-100 flex items-center justify-between z-10">
                <h3 class="text-base font-bold text-ink-900">` + (isEdit ? 'Edit Jadwal Praktik' : 'Tambah Jadwal Praktik') + `</h3>
                <button class="btn btn-ghost btn-sm" data-modal-close aria-label="Tutup">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <form id="jp-form" class="p-5 space-y-4" novalidate>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="sm:col-span-2">
                    <label class="label" for="jp-tenaga">Tenaga Kesehatan <span class="text-rose-500">*</span></label>
                    <select id="jp-tenaga" class="select" required>` + tenagaOptions + `</select>
                    <p class="field-error hidden" id="jp-tenaga-err">Tenaga kesehatan wajib dipilih</p>
                  </div>
                  <div class="sm:col-span-2">
                    <label class="label" for="jp-fasyankes-form">Fasyankes <span class="text-rose-500">*</span></label>
                    <select id="jp-fasyankes-form" class="select" required>` + fasyankesOptions + `</select>
                    <p class="field-error hidden" id="jp-fasyankes-err">Fasyankes wajib dipilih</p>
                  </div>
                  <div>
                    <label class="label" for="jp-no-sip">No. SIP/SIK <span class="text-rose-500">*</span></label>
                    <input type="text" id="jp-no-sip" class="input" value="` + utils.escapeHtml(p ? (p.no_sip || '') : '') + `" required />
                    <p class="field-error hidden" id="jp-no-sip-err">No. SIP/SIK wajib diisi</p>
                  </div>
                  <div>
                    <label class="label" for="jp-jenis-dok">Jenis Dokumen <span class="text-rose-500">*</span></label>
                    <select id="jp-jenis-dok" class="select" required>` + jenisDokOptions + `</select>
                  </div>
                  <div>
                    <label class="label" for="jp-tgl-terbit-sip">Tanggal Terbit <span class="text-rose-500">*</span></label>
                    <input type="date" id="jp-tgl-terbit-sip" class="input" value="` + utils.escapeHtml(p ? (p.tgl_terbit_sip || '') : '') + `" required />
                    <p class="field-error hidden" id="jp-tgl-terbit-sip-err">Tanggal terbit wajib diisi</p>
                  </div>
                  <div>
                    <label class="label" for="jp-tgl-akhir-sip">Tanggal Akhir <span class="text-rose-500">*</span></label>
                    <input type="date" id="jp-tgl-akhir-sip" class="input" value="` + utils.escapeHtml(p ? (p.tgl_akhir_sip || '') : '') + `" required />
                    <p class="field-error hidden" id="jp-tgl-akhir-sip-err">Tanggal akhir harus setelah tanggal terbit</p>
                  </div>
                  <div>
                    <label class="label" for="jp-status-form">Status</label>
                    <select id="jp-status-form" class="select">` + statusOptions + `</select>
                  </div>
                  <div class="sm:col-span-2">
                    <label class="label" for="jp-jadwal-json">Jadwal (JSON) <span class="text-rose-500">*</span></label>
                    <textarea id="jp-jadwal-json" class="textarea font-mono text-xs" rows="5">` + utils.escapeHtml(jadwalValue) + `</textarea>
                    <p class="text-xs text-ink-500 mt-1">Format: {"senin_jumat":{"mulai":"08:00","selesai":"14:00"}}</p>
                    <p class="field-error hidden" id="jp-jadwal-json-err">JSON tidak valid</p>
                  </div>
                </div>
                <div class="flex justify-between gap-2 pt-3 border-t border-ink-100">
                  ` + (isEdit ? '<button type="button" class="btn btn-danger btn-sm" data-action="delete-praktik" data-id="' + utils.escapeHtml(id) + '"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"/></svg>Hapus</button>' : '') + `
                  <div class="flex gap-2 ml-auto">
                    <button type="button" class="btn btn-outline btn-sm" data-modal-close>Batal</button>
                    <button type="submit" class="btn btn-primary btn-sm">` + (isEdit ? 'Simpan Perubahan' : 'Tambah Jadwal') + `</button>
                  </div>
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
        const form = portal.querySelector('#jp-form');
        if (form) {
          form.addEventListener('submit', function (e) {
            e.preventDefault();
            handleSubmit(id);
          });
        }
        const delBtn = portal.querySelector('[data-action="delete-praktik"]');
        if (delBtn) {
          delBtn.addEventListener('click', function () {
            const praktikId = delBtn.dataset.id;
            const target = _allPraktik.find(function (x) { return x.id === praktikId; });
            if (target) {
              closeModal();
              handleDelete(target);
            }
          });
        }
        document.addEventListener('keydown', escClose);
      }

      function handleSubmit(id) {
        const portal = document.getElementById('modal-portal');
        if (!portal) return;
        const val = function (sel) { const el = portal.querySelector(sel); return el ? el.value.trim() : ''; };
        const tenagaId = val('#jp-tenaga');
        const fasyankesId = val('#jp-fasyankes-form');
        const noSip = val('#jp-no-sip');
        const jenisDok = val('#jp-jenis-dok');
        const tglTerbit = portal.querySelector('#jp-tgl-terbit-sip') ? portal.querySelector('#jp-tgl-terbit-sip').value : '';
        const tglAkhir = portal.querySelector('#jp-tgl-akhir-sip') ? portal.querySelector('#jp-tgl-akhir-sip').value : '';
        const status = val('#jp-status-form');
        const jadwalRaw = portal.querySelector('#jp-jadwal-json') ? portal.querySelector('#jp-jadwal-json').value : '';

        portal.querySelectorAll('.field-error').forEach(function (el) { el.classList.add('hidden'); });
        let valid = true;
        const err = function (sel) { const el = portal.querySelector(sel); if (el) el.classList.remove('hidden'); };
        if (!tenagaId) { err('#jp-tenaga-err'); valid = false; }
        if (!fasyankesId) { err('#jp-fasyankes-err'); valid = false; }
        if (!noSip) { err('#jp-no-sip-err'); valid = false; }
        if (!tglTerbit) { err('#jp-tgl-terbit-sip-err'); valid = false; }
        if (!tglAkhir || !tglTerbit || new Date(tglAkhir) <= new Date(tglTerbit)) { err('#jp-tgl-akhir-sip-err'); valid = false; }
        let jadwalObj = null;
        if (jadwalRaw) {
          try {
            jadwalObj = JSON.parse(jadwalRaw);
          } catch (e2) {
            err('#jp-jadwal-json-err'); valid = false;
          }
        } else {
          err('#jp-jadwal-json-err'); valid = false;
        }

        if (!valid) {
          utils.toast('Periksa kembali isian form', 'error');
          return;
        }

        const payload = {
          tenaga_id: tenagaId,
          fasyankes_id: fasyankesId,
          no_sip: noSip,
          jenis_dok: jenisDok,
          tgl_terbit_sip: tglTerbit,
          tgl_akhir_sip: tglAkhir,
          jadwal_json: typeof jadwalObj === 'string' ? jadwalObj : JSON.stringify(jadwalObj),
          status: status
        };

        (async function () {
          try {
            const profile = auth.getProfile();
            if (id) {
              await data.updatePraktik(id, payload);
              await data.addAuditLog({
                user_id: profile.id,
                user_name: profile.full_name,
                action: 'UPDATE',
                entity: 'praktik',
                entity_id: id,
                detail: 'Update jadwal praktik SIP ' + noSip
              });
              utils.toast('Jadwal berhasil diperbarui', 'success');
            } else {
              const item = await data.addPraktik(payload);
              await data.addAuditLog({
                user_id: profile.id,
                user_name: profile.full_name,
                action: 'CREATE',
                entity: 'praktik',
                entity_id: item.id,
                detail: 'Tambah jadwal praktik SIP ' + noSip
              });
              utils.toast('Jadwal berhasil ditambahkan', 'success');
            }
            closeModal();
            await load();
          } catch (e) {
            utils.toast('Error: ' + e.message, 'error');
          }
        })();
      }

      async function handleDelete(p) {
        if (!confirm('Hapus jadwal praktik (SIP ' + (p.no_sip || '-') + ')? Tindakan ini tidak dapat dibatalkan.')) return;
        try {
          await data.deletePraktik(p.id);
          const profile = auth.getProfile();
          await data.addAuditLog({
            user_id: profile.id,
            user_name: profile.full_name,
            action: 'DELETE',
            entity: 'praktik',
            entity_id: p.id,
            detail: 'Hapus jadwal praktik SIP ' + (p.no_sip || '-')
          });
          utils.toast('Jadwal praktik dihapus', 'success');
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

      await load();
    },
  };
})();
