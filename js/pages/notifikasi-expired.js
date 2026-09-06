/* ============================================================================
 * SIMANTRI v3 — Page: Notifikasi Expired
 * ============================================================================ */

(function () {
  'use strict';

  window.SIMANTRI_PAGES = window.SIMANTRI_PAGES || {};

  window.SIMANTRI_PAGES['notifikasi-expired'] = {
    html: function () {
      return `
        <div class="space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 class="text-2xl font-extrabold text-ink-900 tracking-tight">Notifikasi Expired</h2>
              <p class="mt-1 text-sm text-ink-500 max-w-2xl">Daftar dokumen STR/SIP yang hampir atau sudah expired serta status tindak lanjut.</p>
            </div>
            <button class="btn btn-outline btn-sm" data-action="refresh" type="button">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Refresh
            </button>
          </div>

          <!-- Filter chips -->
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-semibold text-ink-500 uppercase tracking-wider mr-1">Filter:</span>
            <button type="button" class="badge badge-ink chip" data-chip="all" data-active="true">Semua</button>
            <button type="button" class="badge badge-ink chip" data-chip="str">STR</button>
            <button type="button" class="badge badge-ink chip" data-chip="sip">SIP</button>
            <button type="button" class="badge badge-ink chip" data-chip="hampir">Hampir Expired</button>
            <button type="button" class="badge badge-ink chip" data-chip="expired">Sudah Expired</button>
            <button type="button" class="badge badge-ink chip" data-chip="ditindaklanjuti">Ditindaklanjuti</button>
          </div>

          <!-- Banner cards -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="card p-5 border-l-4" style="border-left-color:#F59E0B;">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-semibold text-ink-500 uppercase tracking-wider">Hampir Expired</p>
                  <p class="mt-2 text-3xl font-extrabold text-amber-600 tabular-nums" id="count-hampir">0</p>
                  <p class="text-xs text-ink-500 mt-1">akan expired &le; 90 hari</p>
                </div>
                <div class="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
              </div>
            </div>
            <div class="card p-5 border-l-4" style="border-left-color:#F43F5E;">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-semibold text-ink-500 uppercase tracking-wider">Sudah Expired</p>
                  <p class="mt-2 text-3xl font-extrabold text-rose-600 tabular-nums" id="count-expired">0</p>
                  <p class="text-xs text-ink-500 mt-1">harus segera diperpanjang</p>
                </div>
                <div class="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                </div>
              </div>
            </div>
            <div class="card p-5 border-l-4" style="border-left-color:#0D9488;">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-semibold text-ink-500 uppercase tracking-wider">Ditindaklanjuti</p>
                  <p class="mt-2 text-3xl font-extrabold text-teal-600 tabular-nums" id="count-ditindaklanjuti">0</p>
                  <p class="text-xs text-ink-500 mt-1">pengajuan perpanjangan tercatat</p>
                </div>
                <div class="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                </div>
              </div>
            </div>
          </div>

          <!-- List -->
          <div class="card">
            <div class="p-5 border-b border-ink-100 flex items-center justify-between">
              <div>
                <h3 class="text-base font-bold text-ink-900">Daftar Notifikasi</h3>
                <p class="text-xs text-ink-500 mt-0.5" id="list-subtitle">Menampilkan semua notifikasi</p>
              </div>
              <span class="badge badge-ink" id="list-count">0 item</span>
            </div>
            <div id="notif-list" class="divide-y divide-ink-100">
              <div class="p-5 space-y-3">
                <div class="skeleton h-16"></div>
                <div class="skeleton h-16"></div>
                <div class="skeleton h-16"></div>
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
      const auth = window.SIMANTRI_AUTH;

      let _allItems = [];
      let _nakesCache = [];
      let _praktikCache = [];
      let _activeChip = 'all';

      // Inject "Tandai semua dibaca" button if not exists
      const headerActions = document.querySelector('[data-action="refresh"]') ? document.querySelector('[data-action="refresh"]').parentElement : null;
      let markAllBtn = null;
      if (headerActions) {
        markAllBtn = document.createElement('button');
        markAllBtn.className = 'btn btn-outline btn-sm role-dinkes-only';
        markAllBtn.setAttribute('type', 'button');
        markAllBtn.setAttribute('data-role-action', 'edit');
        markAllBtn.setAttribute('data-action', 'mark-all-read');
        markAllBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg> Tandai semua dibaca';
        headerActions.appendChild(markAllBtn);
        markAllBtn.addEventListener('click', async function () {
          try {
            await data.markAllNotificationsRead();
            const profile = auth.getProfile();
            await data.addAuditLog({
              user_id: profile.id,
              user_name: profile.full_name,
              action: 'UPDATE',
              entity: 'notifications',
              entity_id: '-',
              detail: 'Tandai semua notifikasi sebagai dibaca'
            });
            utils.toast('Semua notifikasi ditandai dibaca', 'success');
            await load();
          } catch (e) {
            utils.toast('Error: ' + e.message, 'error');
          }
        });
      }

      // Bind chips
      document.querySelectorAll('.chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
          _activeChip = chip.dataset.chip;
          document.querySelectorAll('.chip').forEach(function (c) {
            c.classList.remove('badge-teal', 'badge-amber', 'badge-rose', 'badge-lime');
            c.classList.add('badge-ink');
            c.removeAttribute('data-active');
          });
          chip.classList.remove('badge-ink');
          const cls = ({ all: 'badge-teal', str: 'badge-teal', sip: 'badge-lime', hampir: 'badge-amber', expired: 'badge-rose', ditindaklanjuti: 'badge-teal' })[_activeChip] || 'badge-ink';
          chip.classList.add(cls);
          chip.setAttribute('data-active', 'true');
          renderList();
        });
      });
      // Initial active chip styling
      const initialChip = document.querySelector('.chip[data-active="true"]');
      if (initialChip) {
        initialChip.classList.remove('badge-ink');
        initialChip.classList.add('badge-teal');
      }

      const refreshBtn = document.querySelector('[data-action="refresh"]');
      if (refreshBtn) refreshBtn.addEventListener('click', async function () {
        utils.toast('Memuat ulang notifikasi...', 'info');
        await load();
      });

      async function load() {
        try {
          const [nakes, praktik, notifs] = await Promise.all([
            data.loadNakes(),
            data.loadPraktik(),
            data.loadNotifications(),
          ]);
          _nakesCache = nakes || [];
          _praktikCache = praktik || [];

          // Build display items from notifications
          const items = (notifs || []).map(function (notif) {
            const tipe = (notif.type || '').indexOf('sip') === 0 ? 'SIP' : 'STR';
            const isExpired = (notif.type || '').indexOf('expired') >= 0 && (notif.type || '').indexOf('hampir') < 0;
            const status = isExpired ? db.STATUS.EXPIRED : db.STATUS.HAMPIR_EXPIRED;
            // Find related nakes & dokumen info
            const n = _nakesCache.find(function (x) { return x.id === notif.tenaga_id; });
            const p = _praktikCache.find(function (x) { return x.id === notif.tenaga_id || x.tenaga_id === notif.tenaga_id; });
            let noDok = '-';
            let tglAkhir = null;
            if (tipe === 'STR' && n) {
              noDok = n.no_str || '-';
              tglAkhir = n.tgl_akhir_str;
            } else if (tipe === 'SIP' && p) {
              noDok = p.no_sip || '-';
              tglAkhir = p.tgl_akhir_sip;
            } else if (n) {
              noDok = n.no_str || '-';
              tglAkhir = n.tgl_akhir_str;
            }
            return {
              id: notif.id,
              tenaga_id: notif.tenaga_id,
              nama: n ? n.nama : (notif.title || 'Nakes').replace(/^(STR|SIP)\s+/i, '').replace(/\s+(telah|akan).*$/i, ''),
              profesi: n ? n.profesi : '-',
              tipe: tipe,
              no_dok: noDok,
              tgl_akhir: tglAkhir,
              status: status,
              isRead: !!notif.is_read,
              title: notif.title,
              message: notif.message,
              created_at: notif.created_at
            };
          });

          items.sort(function (a, b) {
            // Unread first, then by date asc
            if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
            return new Date(a.tgl_akhir || a.created_at) - new Date(b.tgl_akhir || b.created_at);
          });
          _allItems = items;
          renderCounts();
          renderList();
        } catch (err) {
          utils.toast('Gagal memuat notifikasi: ' + err.message, 'error');
          console.error(err);
        }
      }

      function renderCounts() {
        const hampir = _allItems.filter(function (i) { return i.status === db.STATUS.HAMPIR_EXPIRED && !i.isRead; }).length;
        const expired = _allItems.filter(function (i) { return i.status === db.STATUS.EXPIRED && !i.isRead; }).length;
        const ditindak = _allItems.filter(function (i) { return i.isRead; }).length;
        const set = function (id, v) { const e = document.getElementById(id); if (e) e.textContent = v; };
        set('count-hampir', hampir);
        set('count-expired', expired);
        set('count-ditindaklanjuti', ditindak);
      }

      function getFiltered() {
        return _allItems.filter(function (it) {
          switch (_activeChip) {
            case 'str': return it.tipe === 'STR';
            case 'sip': return it.tipe === 'SIP';
            case 'hampir': return it.status === db.STATUS.HAMPIR_EXPIRED && !it.isRead;
            case 'expired': return it.status === db.STATUS.EXPIRED && !it.isRead;
            case 'ditindaklanjuti': return it.isRead;
            default: return true;
          }
        });
      }

      function renderList() {
        const container = document.getElementById('notif-list');
        const countEl = document.getElementById('list-count');
        const subtitle = document.getElementById('list-subtitle');
        if (!container) return;
        const filtered = getFiltered();
        if (countEl) countEl.textContent = filtered.length + ' item';
        if (subtitle) {
          const label = ({ all: 'semua notifikasi', str: 'notifikasi STR', sip: 'notifikasi SIP', hampir: 'hampir expired', expired: 'sudah expired', ditindaklanjuti: 'ditindaklanjuti' })[_activeChip];
          subtitle.textContent = 'Menampilkan ' + (label || 'semua');
        }
        if (!filtered.length) {
          container.innerHTML = emptyState('Tidak ada notifikasi pada filter ini', 'bell');
          return;
        }
        container.innerHTML = filtered.map(function (it) {
          const days = utils.daysUntil(it.tgl_akhir);
          const isExpired = days < 0;
          const badgeClass = isExpired ? 'badge-rose' : 'badge-amber';
          const dayText = it.tgl_akhir ? (isExpired ? 'Expired ' + (-days) + ' hari lalu' : 'H-' + days) : '-';
          const colorClass = utils.avatarColor(it.nama);
          const unreadDot = !it.isRead ? '<span class="w-2 h-2 rounded-full bg-rose-500 inline-block" title="Belum dibaca"></span>' : '';
          const actionBtn = it.isRead
            ? '<span class="badge badge-teal">Dibaca</span>'
            : '<button class="btn btn-primary btn-sm" data-action="perpanjang" data-id="' + utils.escapeHtml(it.id) + '" data-tenaga-id="' + utils.escapeHtml(it.tenaga_id) + '" data-tipe="' + it.tipe + '"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>Perpanjang</button>';
          return '<div class="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 ' + (!it.isRead ? 'bg-amber-50/30' : '') + '">'
               + '<div class="flex items-center gap-2 flex-shrink-0">'
               + '<div class="w-10 h-10 rounded-full ' + colorClass + ' text-white flex items-center justify-center text-sm font-bold">' + utils.escapeHtml(utils.initials(it.nama)) + '</div>'
               + unreadDot
               + '</div>'
               + '<div class="flex-1 min-w-0">'
               + '<div class="flex flex-wrap items-center gap-2">'
               + '<p class="text-sm font-semibold text-ink-900">' + utils.escapeHtml(it.nama) + '</p>'
               + '<span class="badge ' + (it.tipe === 'STR' ? 'badge-teal' : 'badge-lime') + '">' + it.tipe + '</span>'
               + '<span class="badge ' + badgeClass + '">' + dayText + '</span>'
               + '</div>'
               + '<p class="text-xs text-ink-500 mt-0.5">' + utils.escapeHtml(it.profesi || '-') + ' &middot; No. ' + utils.escapeHtml(it.no_dok || '-') + (it.tgl_akhir ? ' &middot; Berakhir ' + utils.fmtDate(it.tgl_akhir) : '') + '</p>'
               + (it.message ? '<p class="text-xs text-ink-600 mt-1">' + utils.escapeHtml(it.message) + '</p>' : '')
               + '</div>'
               + '<div class="flex items-center gap-2 flex-shrink-0">'
               + '<button class="btn btn-outline btn-sm" data-action="detail" data-id="' + utils.escapeHtml(it.id) + '" data-tenaga-id="' + utils.escapeHtml(it.tenaga_id) + '" data-tipe="' + it.tipe + '"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>Detail</button>'
               + actionBtn
               + '</div>'
               + '</div>';
        }).join('');

        container.querySelectorAll('[data-action="detail"]').forEach(function (btn) {
          btn.addEventListener('click', async function () {
            const id = btn.dataset.id;
            const tenagaId = btn.dataset.tenagaId;
            const tipe = btn.dataset.tipe;
            try {
              await data.markNotificationRead(id);
              const profile = auth.getProfile();
              await data.addAuditLog({
                user_id: profile.id,
                user_name: profile.full_name,
                action: 'UPDATE',
                entity: 'notifications',
                entity_id: id,
                detail: 'Tandai notifikasi ' + tipe + ' sebagai dibaca'
              });
              utils.toast('Notifikasi ditandai dibaca', 'success');
            } catch (e) {
              utils.toast('Error: ' + e.message, 'error');
            }
            // Navigate to data-nakes
            setTimeout(function () {
              window.SIMANTRI.navigateTo('data-nakes');
              setTimeout(function () {
                document.dispatchEvent(new CustomEvent('simantri:open-nakes', { detail: { id: tenagaId } }));
              }, 200);
            }, 200);
          });
        });

        container.querySelectorAll('[data-action="perpanjang"]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            const tenagaId = btn.dataset.tenagaId;
            const tipe = btn.dataset.tipe;
            utils.toast('Mengarahkan ke perpanjangan ' + tipe + '...', 'info');
            setTimeout(function () {
              window.SIMANTRI.navigateTo('perpanjangan');
              setTimeout(function () {
                document.dispatchEvent(new CustomEvent('simantri:start-perpanjangan', { detail: { tenagaId: tenagaId, tipe: tipe } }));
              }, 200);
            }, 400);
          });
        });
      }

      function emptyState(message, icon) {
        const iconPath = ({
          bell: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
          'shield-check': 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
        })[icon || 'bell'];
        return '<div class="text-center py-12 px-4">'
             + '<div class="w-14 h-14 mx-auto rounded-xl bg-ink-100 text-ink-400 flex items-center justify-center mb-3">'
             + '<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="' + iconPath + '"/></svg>'
             + '</div>'
             + '<p class="text-sm text-ink-500">' + utils.escapeHtml(message) + '</p>'
             + '</div>';
      }

      await load();
    },
  };
})();
