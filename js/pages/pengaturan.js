/* ============================================================================
 * SIMANTRI v3 — Page: Pengaturan & Audit Log
 * Schema v1.1 — two tabs: Audit Log (filter + table) and Info Sistem
 * (about card, db stats, quick actions: reset demo / export CSV).
 * ============================================================================ */

(function () {
  'use strict';

  window.SIMANTRI_PAGES = window.SIMANTRI_PAGES || {};

  const AKSI_OPTS = [
    'LOGIN', 'LOGOUT',
    'ADD_PENGUMUMAN', 'UPDATE_PENGUMUMAN', 'DELETE_PENGUMUMAN',
    'ADD_PROFIL', 'UPDATE_PROFIL', 'DELETE_PROFIL',
    'ADD_VERVAL_IZIN', 'UPDATE_VERVAL_IZIN', 'DELETE_VERVAL_IZIN',
    'ADD_VERVAL_FASYANKES', 'UPDATE_VERVAL_FASYANKES', 'DELETE_VERVAL_FASYANKES',
    'ADD_IZIN', 'UPDATE_IZIN', 'DELETE_IZIN', 'APPROVE_IZIN', 'REJECT_IZIN',
    'ADD_USER', 'UPDATE_USER', 'DELETE_USER',
  ];

  function optionsHtml(opts) {
    return opts.map(function (o) {
      return '<option value="' + window.SIMANTRI_UTILS.escapeHtml(o) + '">' + window.SIMANTRI_UTILS.escapeHtml(o) + '</option>';
    }).join('');
  }

  function aksiBadgeClass(aksi) {
    if (!aksi) return 'badge-ink';
    if (aksi.indexOf('ADD_') === 0) return 'badge-teal';
    if (aksi.indexOf('UPDATE_') === 0) return 'badge-amber';
    if (aksi.indexOf('DELETE_') === 0) return 'badge-rose';
    if (aksi.indexOf('APPROVE_') === 0) return 'badge-teal';
    if (aksi.indexOf('REJECT_') === 0) return 'badge-rose';
    if (aksi === 'LOGIN' || aksi === 'LOGOUT') return 'badge-ink';
    return 'badge-ink';
  }

  window.SIMANTRI_PAGES['pengaturan'] = {
    html: function () {
      return ''
        + '<div class="space-y-6">'
        +   '<div>'
        +     '<h2 class="text-2xl font-extrabold text-ink-900 tracking-tight">Pengaturan &amp; Audit Log</h2>'
        +     '<p class="mt-1 text-sm text-ink-500 max-w-2xl">Pantau aktivitas sistem dan informasi aplikasi SIMANTRI.</p>'
        +   '</div>'

        // Tabs
        +   '<div class="flex items-center gap-1 border-b border-ink-200">'
        +     '<button type="button" class="pg-tab px-4 py-2.5 text-sm font-semibold border-b-2 border-teal-600 text-teal-700" data-tab="audit">Audit Log</button>'
        +     '<button type="button" class="pg-tab px-4 py-2.5 text-sm font-semibold border-b-2 border-transparent text-ink-500 hover:text-ink-800" data-tab="info">Info Sistem</button>'
        +   '</div>'

        // Tab: Audit Log
        +   '<div id="pg-audit-tab" class="space-y-4">'
        +     '<div class="card p-4">'
        +       '<div class="grid grid-cols-1 md:grid-cols-3 gap-3">'
        +         '<div class="md:col-span-2">'
        +           '<label class="label" for="pg-log-search">Pencarian</label>'
        +           '<div class="relative">'
        +             '<svg class="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>'
        +             '<input type="search" id="pg-log-search" class="input" style="padding-left:2.25rem;" placeholder="Cari username / aksi / detail..." />'
        +           '</div>'
        +         '</div>'
        +         '<div>'
        +           '<label class="label" for="pg-log-aksi">Aksi</label>'
        +           '<select id="pg-log-aksi" class="select"><option value="">Semua</option>' + optionsHtml(AKSI_OPTS) + '</select>'
        +         '</div>'
        +       '</div>'
        +     '</div>'

        +     '<div class="card overflow-hidden">'
        +       '<div class="overflow-x-auto">'
        +         '<table class="data-table table-sticky">'
        +           '<thead>'
        +             '<tr>'
        +               '<th>Timestamp</th>'
        +               '<th>Username</th>'
        +               '<th>Aksi</th>'
        +               '<th>Detail</th>'
        +               '<th>IP Address</th>'
        +             '</tr>'
        +           '</thead>'
        +           '<tbody id="pg-log-tbody">'
        +             '<tr><td colspan="5" class="text-center text-ink-500 py-8"><div class="skeleton h-8"></div></td></tr>'
        +           '</tbody>'
        +         '</table>'
        +       '</div>'
        +     '</div>'
        +   '</div>'

        // Tab: Info Sistem
        +   '<div id="pg-info-tab" class="hidden space-y-4">'
        // About app
        +     '<div class="card p-5">'
        +       '<div class="flex items-center gap-2 mb-3">'
        +         '<svg class="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
        +         '<h3 class="text-base font-bold text-ink-900">Tentang Aplikasi</h3>'
        +       '</div>'
        +       '<dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">'
        +         '<div><dt class="text-xs text-ink-400 uppercase tracking-wide font-semibold">Nama</dt><dd class="text-ink-800 font-semibold">SIMANTRI</dd></div>'
        +         '<div><dt class="text-xs text-ink-400 uppercase tracking-wide font-semibold">Versi</dt><dd class="text-ink-800 font-mono">v1.1</dd></div>'
        +         '<div><dt class="text-xs text-ink-400 uppercase tracking-wide font-semibold">Instansi</dt><dd class="text-ink-800">Dinas Kesehatan Kutai Kartanegara</dd></div>'
        +         '<div><dt class="text-xs text-ink-400 uppercase tracking-wide font-semibold">Schema</dt><dd class="text-ink-800 font-mono">v1.1 (SIMANTRI v1.1)</dd></div>'
        +         '<div class="sm:col-span-2"><dt class="text-xs text-ink-400 uppercase tracking-wide font-semibold">Deskripsi</dt><dd class="text-ink-700 mt-0.5">Sistem Informasi &amp; Manajemen Praktik Tenaga Medis dan Tenaga Kesehatan di Fasyankes &amp; Praktik Mandiri wilayah kerja Dinkes Kukar.</dd></div>'
        +       '</dl>'
        +     '</div>'

        // DB Stats
        +     '<div class="card p-5">'
        +       '<div class="flex items-center gap-2 mb-3">'
        +         '<svg class="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/></svg>'
        +         '<h3 class="text-base font-bold text-ink-900">Statistik Database</h3>'
        +       '</div>'
        +       '<div id="pg-db-stats" class="grid grid-cols-2 sm:grid-cols-4 gap-3">'
        +         '<div class="skeleton h-20"></div>'
        +         '<div class="skeleton h-20"></div>'
        +         '<div class="skeleton h-20"></div>'
        +         '<div class="skeleton h-20"></div>'
        +       '</div>'
        +     '</div>'

        // Quick Actions
        +     '<div class="card p-5">'
        +       '<div class="flex items-center gap-2 mb-3">'
        +         '<svg class="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>'
        +         '<h3 class="text-base font-bold text-ink-900">Aksi Cepat</h3>'
        +       '</div>'
        +       '<div class="flex flex-wrap gap-2">'
        +         '<button type="button" class="btn btn-outline btn-sm" data-action="reset-demo">'
        +           '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>'
        +           'Reset Demo Data'
        +         '</button>'
        +         '<button type="button" class="btn btn-outline btn-sm" data-action="export-log" data-role-action="export">'
        +           '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>'
        +           'Export Audit Log CSV'
        +         '</button>'
        +       '</div>'
        +       '<p class="mt-3 text-xs text-ink-500">Reset demo data akan memuat ulang seluruh data mock ke kondisi awal. Export Audit Log menghasilkan file CSV berisi seluruh entri log.</p>'
        +     '</div>'
        +   '</div>'
        + '</div>';
    },

    init: async function () {
      const utils = window.SIMANTRI_UTILS;
      const data = window.SIMANTRI_DATA;
      const auth = window.SIMANTRI_AUTH;

      let _logFilters = { search: '', aksi: '' };
      let _logsCache = [];

      // Tab switching
      document.querySelectorAll('.pg-tab').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const tab = btn.getAttribute('data-tab');
          document.querySelectorAll('.pg-tab').forEach(function (b) {
            const isActive = b === btn;
            b.classList.toggle('border-teal-600', isActive);
            b.classList.toggle('text-teal-700', isActive);
            b.classList.toggle('border-transparent', !isActive);
            b.classList.toggle('text-ink-500', !isActive);
            b.classList.toggle('hover:text-ink-800', !isActive);
          });
          const auditTab = document.getElementById('pg-audit-tab');
          const infoTab = document.getElementById('pg-info-tab');
          if (auditTab) auditTab.classList.toggle('hidden', tab !== 'audit');
          if (infoTab) infoTab.classList.toggle('hidden', tab !== 'info');
          if (tab === 'info') renderDbStats();
        });
      });

      // Audit log filter
      const logSearch = document.getElementById('pg-log-search');
      if (logSearch) {
        logSearch.addEventListener('input', utils.debounce(function (e) {
          _logFilters.search = e.target.value.trim();
          renderLogs();
        }, 300));
      }
      const logAksi = document.getElementById('pg-log-aksi');
      if (logAksi) {
        logAksi.addEventListener('change', function (e) {
          _logFilters.aksi = e.target.value;
          renderLogs();
        });
      }

      // Quick actions
      const resetBtn = document.querySelector('[data-action="reset-demo"]');
      if (resetBtn) {
        resetBtn.addEventListener('click', function () {
          if (confirm('Reset seluruh data demo ke kondisi awal? Perubahan yang belum tersimpan akan hilang.')) {
            utils.toast('Halaman akan dimuat ulang untuk mereset data demo.', 'info');
            setTimeout(function () { window.location.reload(); }, 800);
          }
        });
      }
      const exportBtn = document.querySelector('[data-action="export-log"]');
      if (exportBtn) {
        exportBtn.addEventListener('click', async function () {
          try {
            const logs = await data.loadLogs({});
            const rows = [['Timestamp', 'Username', 'Aksi', 'Detail', 'IP Address']];
            logs.forEach(function (l) {
              rows.push([
                l.created_at || '',
                l.username || '',
                l.aksi || '',
                (l.detail || '').replace(/"/g, '""'),
                l.ip_address || '',
              ]);
            });
            const csv = rows.map(function (r) {
              return r.map(function (c) { return '"' + String(c) + '"'; }).join(',');
            }).join('\n');
            utils.downloadFile('simantri-audit-log-' + Date.now() + '.csv', csv, 'text/csv');
            utils.toast('Audit log diexport ke CSV (' + logs.length + ' entri)', 'success');
          } catch (err) {
            utils.toast('Gagal export: ' + err.message, 'error');
            console.error('[pengaturan] export error:', err);
          }
        });
      }

      async function renderLogs() {
        const tbody = document.getElementById('pg-log-tbody');
        if (!tbody) return;
        try {
          const list = await data.loadLogs(_logFilters);
          _logsCache = list;
          if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="5">' + emptyStateRow('Belum ada log aktivitas.') + '</td></tr>';
            return;
          }
          tbody.innerHTML = list.map(function (l) {
            const badge = aksiBadgeClass(l.aksi);
            return '<tr>'
                 +   '<td class="whitespace-nowrap text-xs text-ink-500">' + utils.fmtDate(l.created_at, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + '</td>'
                 +   '<td class="font-mono font-semibold text-ink-900">' + utils.escapeHtml(l.username || '-') + '</td>'
                 +   '<td><span class="badge ' + badge + '">' + utils.escapeHtml(l.aksi || '-') + '</span></td>'
                 +   '<td class="text-ink-600 text-xs max-w-md">' + utils.escapeHtml(l.detail || '-') + '</td>'
                 +   '<td class="font-mono text-xs text-ink-500">' + utils.escapeHtml(l.ip_address || '-') + '</td>'
                 + '</tr>';
          }).join('');
        } catch (err) {
          utils.toast('Gagal memuat log: ' + err.message, 'error');
          console.error('[pengaturan] renderLogs error:', err);
          tbody.innerHTML = '<tr><td colspan="5">' + emptyStateRow('Gagal memuat data.') + '</td></tr>';
        }
      }

      function emptyStateRow(message) {
        return '<div class="text-center py-8 text-sm text-ink-500">' + utils.escapeHtml(message) + '</div>';
      }

      async function renderDbStats() {
        const container = document.getElementById('pg-db-stats');
        if (!container) return;
        try {
          const [users, profil, vervalIzin, vervalFasyankes, izin, pengumuman, logs] = await Promise.all([
            data.loadUsers({}),
            data.loadProfilSdmk({}),
            data.loadVervalIzin({}),
            data.loadVervalFasyankes({}),
            data.loadIzin({}),
            data.loadPengumuman({}),
            data.loadLogs({}),
          ]);
          const cards = [
            { label: 'Users', value: users.length, color: 'teal' },
            { label: 'Profil SDMK', value: profil.length, color: 'teal' },
            { label: 'Verval Izin', value: vervalIzin.length, color: 'lime' },
            { label: 'Verval Fasyankes', value: vervalFasyankes.length, color: 'lime' },
            { label: 'Pengajuan Izin', value: izin.length, color: 'amber' },
            { label: 'Pengumuman', value: pengumuman.length, color: 'amber' },
            { label: 'Logs', value: logs.length, color: 'ink' },
            { label: 'Total Records', value: users.length + profil.length + vervalIzin.length + vervalFasyankes.length + izin.length + pengumuman.length + logs.length, color: 'teal' },
          ];
          const colorClass = {
            teal: 'bg-teal-50 text-teal-700',
            lime: 'bg-lime-50 text-lime-700',
            amber: 'bg-amber-50 text-amber-700',
            ink: 'bg-ink-100 text-ink-700',
          };
          container.innerHTML = cards.map(function (c) {
            return '<div class="rounded-xl border border-ink-100 p-4 text-center">'
                 + '<p class="text-2xl font-extrabold tabular-nums ' + (colorClass[c.color] || colorClass.ink) + '">' + utils.fmtNumber(c.value) + '</p>'
                 + '<p class="text-xs text-ink-500 font-semibold uppercase tracking-wide mt-1">' + utils.escapeHtml(c.label) + '</p>'
                 + '</div>';
          }).join('');
        } catch (err) {
          utils.toast('Gagal memuat statistik: ' + err.message, 'error');
          console.error('[pengaturan] renderDbStats error:', err);
          container.innerHTML = '<div class="col-span-full text-center py-4 text-sm text-ink-500">Gagal memuat statistik database.</div>';
        }
      }

      await renderLogs();
    },
  };
})();
