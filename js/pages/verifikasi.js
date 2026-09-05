/* ============================================================================
 * SIMANTRI v3 — Page: Verifikasi STR & SIP (3-col Kanban)
 * ============================================================================ */

(function () {
  'use strict';

  window.SIMANTRI_PAGES = window.SIMANTRI_PAGES || {};

  window.SIMANTRI_PAGES['verifikasi'] = {
    html: function () {
      return `
        <div class="space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 class="text-2xl font-extrabold text-ink-900 tracking-tight">Verifikasi STR &amp; SIP</h2>
              <p class="mt-1 text-sm text-ink-500 max-w-2xl">Verifikasi pengajuan STR &amp; SIP dari nakes. Approve atau reject dengan catatan.</p>
            </div>
            <button class="btn btn-outline btn-sm" data-action="refresh" type="button">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Refresh
            </button>
          </div>

          <!-- Stat cards -->
          <div id="vk-stats" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="skeleton h-28"></div>
            <div class="skeleton h-28"></div>
            <div class="skeleton h-28"></div>
            <div class="skeleton h-28"></div>
          </div>

          <!-- Kanban -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <!-- Menunggu -->
            <div class="card overflow-hidden">
              <div class="p-4 border-b border-ink-100 bg-amber-50/50 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <h3 class="text-sm font-bold text-ink-900">Menunggu Verifikasi</h3>
                </div>
                <span class="badge badge-amber" id="count-pending">0</span>
              </div>
              <div id="col-pending" class="p-3 space-y-2 max-h-[640px] overflow-y-auto">
                <div class="skeleton h-24"></div>
                <div class="skeleton h-24"></div>
              </div>
            </div>

            <!-- Diverifikasi -->
            <div class="card overflow-hidden">
              <div class="p-4 border-b border-ink-100 bg-teal-50/50 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                  <h3 class="text-sm font-bold text-ink-900">Diverifikasi</h3>
                </div>
                <span class="badge badge-teal" id="count-verified">0</span>
              </div>
              <div id="col-verified" class="p-3 space-y-2 max-h-[640px] overflow-y-auto">
                <div class="skeleton h-24"></div>
              </div>
            </div>

            <!-- Ditolak -->
            <div class="card overflow-hidden">
              <div class="p-4 border-b border-ink-100 bg-rose-50/50 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <h3 class="text-sm font-bold text-ink-900">Ditolak</h3>
                </div>
                <span class="badge badge-rose" id="count-rejected">0</span>
              </div>
              <div id="col-rejected" class="p-3 space-y-2 max-h-[640px] overflow-y-auto">
                <div class="skeleton h-24"></div>
              </div>
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

      let _items = [];

      const refreshBtn = document.querySelector('[data-action="refresh"]');
      if (refreshBtn) refreshBtn.addEventListener('click', async function () {
        utils.toast('Memuat ulang...', 'info');
        await load();
      });

      async function load() {
        try {
          const [nakes, praktik] = await Promise.all([
            data.loadNakes(),
            data.loadPraktik(),
          ]);

          // Build mock verification queue from nakes & praktik data
          const items = [];
          nakes.forEach(function (n, i) {
            // 3 most recent as pending, others as verified
            const status = i < 3 ? db.STATUS.PENDING : (i % 7 === 0 ? db.STATUS.DITOLAK : db.STATUS.DIVERIFIKASI);
            items.push({
              id: 'ver-str-' + n.id,
              tenaga_id: n.id,
              nama: n.nama,
              profesi: n.profesi,
              fasyankes_id: n.fasyankes_id,
              tipe: 'STR',
              no_dok: n.no_str,
              tgl_terbit: n.tgl_terbit_str,
              tgl_akhir: n.tgl_akhir_str,
              status: status,
              submitted_at: n.tgl_terbit_str,
              catatan: status === db.STATUS.DITOLAK ? 'Berkas tidak lengkap, mohon unggah ulang scan STR yang jelas.' : '',
            });
          });
          praktik.forEach(function (p, i) {
            const n = nakes.find(function (x) { return x.id === p.tenaga_id; });
            // 2 as pending
            const status = i < 2 ? db.STATUS.PENDING : db.STATUS.DIVERIFIKASI;
            items.push({
              id: 'ver-sip-' + p.id,
              tenaga_id: p.tenaga_id,
              nama: n ? n.nama : 'Nakes',
              profesi: n ? n.profesi : '-',
              fasyankes_id: p.fasyankes_id,
              tipe: 'SIP',
              no_dok: p.no_sip,
              tgl_terbit: p.tgl_terbit_sip,
              tgl_akhir: p.tgl_akhir_sip,
              status: status,
              submitted_at: p.tgl_terbit_sip,
              catatan: '',
            });
          });
          _items = items;
          renderStats();
          renderKanban();
        } catch (err) {
          utils.toast('Gagal memuat verifikasi: ' + err.message, 'error');
          console.error(err);
        }
      }

      function fasyankesName(id) {
        const f = data.DEMO_FASYANKES.find(function (x) { return x.id === id; });
        return f ? f.nama : '-';
      }

      function renderStats() {
        const container = document.getElementById('vk-stats');
        if (!container) return;
        container.innerHTML = '';
        const total = _items.length;
        const pending = _items.filter(function (i) { return i.status === db.STATUS.PENDING; }).length;
        const verified = _items.filter(function (i) { return i.status === db.STATUS.DIVERIFIKASI; }).length;
        const rejected = _items.filter(function (i) { return i.status === db.STATUS.DITOLAK; }).length;
        const cards = [
          { label: 'Total Pengajuan', value: utils.fmtNumber(total), icon: 'shield-check', variant: 'teal' },
          { label: 'Menunggu', value: utils.fmtNumber(pending), icon: 'bell', variant: 'amber' },
          { label: 'Diverifikasi', value: utils.fmtNumber(verified), icon: 'shield-check', variant: 'lime' },
          { label: 'Ditolak', value: utils.fmtNumber(rejected), icon: 'refresh', variant: 'rose' },
        ];
        cards.forEach(function (c) {
          const div = document.createElement('div');
          container.appendChild(div);
          components.renderStatCard(div, c);
        });
      }

      function renderKanban() {
        const set = function (id, v) { const e = document.getElementById(id); if (e) e.textContent = v; };
        const pending = _items.filter(function (i) { return i.status === db.STATUS.PENDING; });
        const verified = _items.filter(function (i) { return i.status === db.STATUS.DIVERIFIKASI; });
        const rejected = _items.filter(function (i) { return i.status === db.STATUS.DITOLAK; });
        set('count-pending', pending.length);
        set('count-verified', verified.length);
        set('count-rejected', rejected.length);

        renderColumn('col-pending', pending, true);
        renderColumn('col-verified', verified, false);
        renderColumn('col-rejected', rejected, false);
      }

      function renderColumn(colId, items, showActions) {
        const col = document.getElementById(colId);
        if (!col) return;
        if (!items.length) {
          col.innerHTML = '<p class="text-xs text-ink-500 text-center py-8">Tidak ada item</p>';
          return;
        }
        col.innerHTML = items.map(function (it) {
          const colorAvatar = utils.avatarColor(it.nama);
          const tipeBadge = it.tipe === 'STR' ? 'badge-teal' : 'badge-lime';
          let actionsHtml = '';
          if (showActions) {
            actionsHtml = '<div class="mt-2 pt-2 border-t border-ink-100 flex gap-1.5">'
              + '<button class="btn btn-accent btn-sm flex-1" data-action="approve" data-id="' + utils.escapeHtml(it.id) + '">'
              + '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>'
              + 'Approve</button>'
              + '<button class="btn btn-danger btn-sm flex-1" data-action="reject" data-id="' + utils.escapeHtml(it.id) + '">'
              + '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>'
              + 'Reject</button>'
              + '</div>';
          }
          const catatanHtml = it.catatan ? '<div class="mt-2 p-2 rounded-md bg-rose-50 text-xs text-rose-700"><span class="font-semibold">Catatan:</span> ' + utils.escapeHtml(it.catatan) + '</div>' : '';
          return '<div class="rounded-xl border border-ink-100 p-3 hover:border-teal-300 transition-colors" data-item-id="' + utils.escapeHtml(it.id) + '">'
               + '<div class="flex items-start gap-2">'
               + '<div class="w-9 h-9 rounded-full ' + colorAvatar + ' text-white flex items-center justify-center text-xs font-bold flex-shrink-0">' + utils.escapeHtml(utils.initials(it.nama)) + '</div>'
               + '<div class="flex-1 min-w-0">'
               + '<p class="text-sm font-semibold text-ink-900 truncate">' + utils.escapeHtml(it.nama) + '</p>'
               + '<p class="text-[11px] text-ink-500 truncate">' + utils.escapeHtml(it.profesi || '-') + '</p>'
               + '</div>'
               + '<span class="badge ' + tipeBadge + '">' + it.tipe + '</span>'
               + '</div>'
               + '<div class="mt-2 space-y-1 text-[11px] text-ink-600">'
               + '<p><span class="text-ink-400">No. Dok:</span> <span class="font-mono">' + utils.escapeHtml(it.no_dok || '-') + '</span></p>'
               + '<p><span class="text-ink-400">Fasyankes:</span> ' + utils.escapeHtml(fasyankesName(it.fasyankes_id)) + '</p>'
               + '<p><span class="text-ink-400">Berakhir:</span> ' + utils.fmtDate(it.tgl_akhir) + '</p>'
               + '</div>'
               + catatanHtml
               + actionsHtml
               + '</div>';
        }).join('');

        col.querySelectorAll('[data-action="approve"]').forEach(function (btn) {
          btn.addEventListener('click', function (e) {
            e.stopPropagation();
            handleAction(btn.dataset.id, db.STATUS.DIVERIFIKASI, '');
          });
        });
        col.querySelectorAll('[data-action="reject"]').forEach(function (btn) {
          btn.addEventListener('click', function (e) {
            e.stopPropagation();
            openRejectModal(btn.dataset.id);
          });
        });
      }

      function handleAction(id, newStatus, catatan) {
        const it = _items.find(function (x) { return x.id === id; });
        if (!it) return;
        it.status = newStatus;
        it.catatan = catatan || '';
        const label = newStatus === db.STATUS.DIVERIFIKASI ? 'diverifikasi' : 'ditolak';
        utils.toast('Pengajuan ' + it.tipe + ' ' + it.nama + ' ' + label, newStatus === db.STATUS.DIVERIFIKASI ? 'success' : 'warning');
        renderStats();
        renderKanban();
      }

      function openRejectModal(itemId) {
        const it = _items.find(function (x) { return x.id === itemId; });
        if (!it) return;
        const modalHtml = `
          <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" data-modal>
            <div class="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" data-modal-close></div>
            <div class="relative card w-full sm:max-w-md" style="border-radius:1.25rem;">
              <div class="p-5 border-b border-ink-100 flex items-center justify-between">
                <h3 class="text-base font-bold text-ink-900">Tolak Pengajuan</h3>
                <button class="btn btn-ghost btn-sm" data-modal-close aria-label="Tutup">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div class="p-5 space-y-3">
                <p class="text-sm text-ink-600">Anda akan menolak pengajuan <strong>` + utils.escapeHtml(it.tipe) + `</strong> dari <strong>` + utils.escapeHtml(it.nama) + `</strong>. Berikan alasan penolakan:</p>
                <div>
                  <label class="label" for="reject-catatan">Catatan Penolakan</label>
                  <textarea id="reject-catatan" class="textarea" rows="4" placeholder="Contoh: Berkas tidak lengkap, mohon unggul scan STR yang jelas..."></textarea>
                  <p class="field-error hidden" id="reject-error">Catatan wajib diisi</p>
                </div>
              </div>
              <div class="p-4 border-t border-ink-100 flex justify-end gap-2">
                <button class="btn btn-outline btn-sm" data-modal-close>Batal</button>
                <button class="btn btn-danger btn-sm" data-action="confirm-reject" data-id="` + utils.escapeHtml(itemId) + `">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  Konfirmasi Tolak
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
        const confirmBtn = portal.querySelector('[data-action="confirm-reject"]');
        if (confirmBtn) {
          confirmBtn.addEventListener('click', function () {
            const textarea = portal.querySelector('#reject-catatan');
            const errEl = portal.querySelector('#reject-error');
            const catatan = textarea ? textarea.value.trim() : '';
            if (!catatan) {
              if (errEl) errEl.classList.remove('hidden');
              return;
            }
            handleAction(confirmBtn.dataset.id, db.STATUS.DITOLAK, catatan);
            closeModal();
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

      await load();
    },
  };
})();
