/* ============================================================================
 * SIMANTRI v3 — Page: Input Pengajuan Izin (Admin only — add/edit/delete)
 * Schema v1.1 — izin (pengajuan izin praktik). Includes quick action buttons
 * for status transitions: Setujui / Tolak / Proses.
 * ============================================================================ */

(function () {
  'use strict';

  window.SIMANTRI_PAGES = window.SIMANTRI_PAGES || {};

  const STATUS_IZIN_OPTS = ['Pending', 'Proses', 'Disetujui', 'Ditolak'];
  const JENIS_IZIN_OPTS = ['Baru', 'Perpanjangan'];

  function optionsHtml(opts, selected) {
    return opts.map(function (o) {
      return '<option value="' + window.SIMANTRI_UTILS.escapeHtml(o) + '"' + (selected === o ? ' selected' : '') + '>' + window.SIMANTRI_UTILS.escapeHtml(o) + '</option>';
    }).join('');
  }

  function statusBadgeClass(s) {
    switch (s) {
      case 'Disetujui': return 'badge-teal';
      case 'Proses': return 'badge-amber';
      case 'Pending': return 'badge-amber';
      case 'Ditolak': return 'badge-rose';
      default: return 'badge-ink';
    }
  }

  function jenisBadgeClass(s) {
    switch (s) {
      case 'Baru': return 'badge-lime';
      case 'Perpanjangan': return 'badge-teal';
      default: return 'badge-ink';
    }
  }

  window.SIMANTRI_PAGES['input-izin-praktik'] = {
    html: function () {
      return ''
        + '<div class="space-y-6">'
        +   '<div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">'
        +     '<div>'
        +       '<h2 class="text-2xl font-extrabold text-ink-900 tracking-tight">Input Pengajuan Izin</h2>'
        +       '<p class="mt-1 text-sm text-ink-500 max-w-2xl">Kelola pengajuan izin praktik tenaga kesehatan (SIP).</p>'
        +     '</div>'
        +     '<button class="btn btn-primary btn-sm" data-action="add" type="button" data-role-action="add">'
        +       '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>'
        +       'Tambah Pengajuan'
        +     '</button>'
        +   '</div>'

        // Filter
        +   '<div class="card p-4">'
        +     '<div class="grid grid-cols-1 md:grid-cols-3 gap-3">'
        +       '<div class="md:col-span-2">'
        +         '<label class="label" for="iip-search">Pencarian</label>'
        +         '<div class="relative">'
        +           '<svg class="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>'
        +           '<input type="search" id="iip-search" class="input" style="padding-left:2.25rem;" placeholder="Cari nama / NIK..." />'
        +         '</div>'
        +       '</div>'
        +       '<div>'
        +         '<label class="label" for="iip-status">Status</label>'
        +         '<select id="iip-status" class="select"><option value="">Semua</option>' + optionsHtml(STATUS_IZIN_OPTS) + '</select>'
        +       '</div>'
        +     '</div>'
        +   '</div>'

        // Table
        +   '<div class="card overflow-hidden">'
        +     '<div class="overflow-x-auto">'
        +       '<table class="data-table table-sticky">'
        +         '<thead>'
        +           '<tr>'
        +             '<th>ID</th>'
        +             '<th>NIK</th>'
        +             '<th>Nama</th>'
        +             '<th>Jenis Izin</th>'
        +             '<th>Tgl Usulan</th>'
        +             '<th>Status</th>'
        +             '<th>No. SIP</th>'
        +             '<th>Unit Kerja</th>'
        +             '<th>Masa Berlaku</th>'
        +             '<th class="text-right">Aksi</th>'
        +           '</tr>'
        +         '</thead>'
        +         '<tbody id="iip-tbody">'
        +           '<tr><td colspan="10" class="text-center text-ink-500 py-8"><div class="skeleton h-8"></div></td></tr>'
        +         '</tbody>'
        +       '</table>'
        +     '</div>'
        +   '</div>'
        + '</div>';
    },

    init: async function () {
      const utils = window.SIMANTRI_UTILS;
      const data = window.SIMANTRI_DATA;
      const auth = window.SIMANTRI_AUTH;

      let _filters = { search: '', status: '' };

      const addBtn = document.querySelector('[data-action="add"]');
      if (addBtn) addBtn.addEventListener('click', function () { openFormModal(null); });

      const searchInput = document.getElementById('iip-search');
      if (searchInput) {
        searchInput.addEventListener('input', utils.debounce(function (e) {
          _filters.search = e.target.value.trim();
          render();
        }, 300));
      }
      const statusSel = document.getElementById('iip-status');
      if (statusSel) statusSel.addEventListener('change', function (e) { _filters.status = e.target.value; render(); });

      async function render() {
        const tbody = document.getElementById('iip-tbody');
        if (!tbody) return;
        try {
          const list = await data.loadIzin(_filters);
          if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="10">' + emptyStateRow('Belum ada pengajuan izin. Klik "Tambah Pengajuan" untuk membuat.') + '</td></tr>';
            return;
          }
          tbody.innerHTML = list.map(function (i) {
            const statusBadge = statusBadgeClass(i.status);
            const jenisBadge = jenisBadgeClass(i.jenis_izin);
            const showQuickActions = i.status === 'Pending' || i.status === 'Proses';
            const quickActions = showQuickActions
              ? '<div class="flex items-center gap-1 mb-1">'
                + (i.status !== 'Proses' ? '<button class="btn btn-ghost btn-sm text-amber-700 hover:bg-amber-50" data-action="quick-proses" data-id="' + utils.escapeHtml(i.id) + '" data-role-action="approve" title="Proses"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>Proses</button>' : '')
                + '<button class="btn btn-ghost btn-sm text-teal-700 hover:bg-teal-50" data-action="quick-approve" data-id="' + utils.escapeHtml(i.id) + '" data-nama="' + utils.escapeHtml(i.nama_lengkap) + '" data-role-action="approve" title="Setujui"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>Setujui</button>'
                + '<button class="btn btn-ghost btn-sm text-rose-700 hover:bg-rose-50" data-action="quick-reject" data-id="' + utils.escapeHtml(i.id) + '" data-nama="' + utils.escapeHtml(i.nama_lengkap) + '" data-role-action="reject" title="Tolak"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>Tolak</button>'
                + '</div>'
              : '';
            return '<tr>'
                 +   '<td class="font-mono text-xs">' + utils.escapeHtml(i.id || '-') + '</td>'
                 +   '<td class="font-mono text-xs">' + utils.escapeHtml(i.nik || '-') + '</td>'
                 +   '<td class="font-semibold text-ink-900 whitespace-nowrap">' + utils.escapeHtml(i.nama_lengkap || '-') + '</td>'
                 +   '<td><span class="badge ' + jenisBadge + '">' + utils.escapeHtml(i.jenis_izin || '-') + '</span></td>'
                 +   '<td class="whitespace-nowrap">' + utils.fmtDate(i.tgl_usulan) + '</td>'
                 +   '<td><span class="badge ' + statusBadge + '">' + utils.escapeHtml(i.status || '-') + '</span></td>'
                 +   '<td class="font-mono text-xs">' + utils.escapeHtml(i.nomor_sip || '-') + '</td>'
                 +   '<td class="whitespace-nowrap">' + utils.escapeHtml(i.unit_kerja || '-') + '</td>'
                 +   '<td class="text-xs text-ink-600 max-w-[180px]">' + utils.escapeHtml(i.masa_berlaku || '-') + '</td>'
                 +   '<td class="text-right whitespace-nowrap">'
                 +     quickActions
                 +     '<div class="flex items-center justify-end gap-1">'
                 +       '<button class="btn btn-ghost btn-sm" data-action="edit" data-id="' + utils.escapeHtml(i.id) + '" data-role-action="edit" title="Edit">'
                 +         '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>'
                 +         'Edit'
                 +       '</button>'
                 +       '<button class="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-50" data-action="delete" data-id="' + utils.escapeHtml(i.id) + '" data-nama="' + utils.escapeHtml(i.nama_lengkap) + '" data-role-action="delete" title="Hapus">'
                 +         '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>'
                 +       '</button>'
                 +     '</div>'
                 +   '</td>'
                 + '</tr>';
          }).join('');

          tbody.querySelectorAll('[data-action="edit"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              const id = btn.getAttribute('data-id');
              const item = list.find(function (x) { return x.id === id; });
              if (item) openFormModal(item);
            });
          });
          tbody.querySelectorAll('[data-action="delete"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              const id = btn.getAttribute('data-id');
              const nama = btn.getAttribute('data-nama');
              handleDelete(id, nama);
            });
          });
          tbody.querySelectorAll('[data-action="quick-proses"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              handleQuickStatus(btn.getAttribute('data-id'), 'Proses');
            });
          });
          tbody.querySelectorAll('[data-action="quick-approve"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              handleQuickStatus(btn.getAttribute('data-id'), 'Disetujui', btn.getAttribute('data-nama'));
            });
          });
          tbody.querySelectorAll('[data-action="quick-reject"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              handleQuickStatus(btn.getAttribute('data-id'), 'Ditolak', btn.getAttribute('data-nama'));
            });
          });
        } catch (err) {
          utils.toast('Gagal memuat pengajuan izin: ' + err.message, 'error');
          console.error('[input-izin-praktik] render error:', err);
          tbody.innerHTML = '<tr><td colspan="10">' + emptyStateRow('Gagal memuat data.') + '</td></tr>';
        }
      }

      function emptyStateRow(message) {
        return '<div class="text-center py-8 text-sm text-ink-500">' + utils.escapeHtml(message) + '</div>';
      }

      // === Form Modal ===
      function openFormModal(existing) {
        const isEdit = !!existing;
        const today = new Date().toISOString().split('T')[0];
        const i = isEdit ? existing : {
          nik: '', nama_lengkap: '', jenis_izin: 'Baru', tgl_usulan: today, status: 'Pending',
          nomor_sip: '', unit_kerja: '', masa_berlaku: '',
        };

        const portal = document.getElementById('modal-portal');
        if (!portal) return;
        portal.innerHTML = ''
          + '<div class="fixed inset-0 z-[80] flex items-center justify-center p-4" data-modal-root>'
          +   '<div class="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" data-modal-close></div>'
          +   '<div class="card relative w-full max-w-xl max-h-[90vh] overflow-y-auto" data-modal-content>'
          +     '<div class="p-5 border-b border-ink-100 flex items-center justify-between sticky top-0 bg-white z-10">'
          +       '<div>'
          +         '<h3 class="text-base font-bold text-ink-900">' + (isEdit ? 'Edit Pengajuan Izin' : 'Tambah Pengajuan Izin') + '</h3>'
          +         '<p class="text-xs text-ink-500 mt-0.5">' + (isEdit ? 'Perbarui data pengajuan' : 'Buat pengajuan izin praktik baru') + '</p>'
          +       '</div>'
          +       '<button type="button" class="btn btn-ghost btn-sm" data-modal-close aria-label="Tutup">'
          +         '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>'
          +       '</button>'
          +     '</div>'
          +     '<form id="iip-form" class="p-5 space-y-4">'
          +       '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">'
          +         '<div>'
          +           '<label class="label" for="iip-nik">NIK <span class="text-rose-600">*</span></label>'
          +           '<input type="text" id="iip-nik" class="input font-mono" maxlength="16" pattern="[0-9]{16}" inputmode="numeric" required value="' + utils.escapeHtml(i.nik || '') + '" placeholder="16 digit angka" />'
          +           '<p class="field-error hidden" data-error="nik"></p>'
          +         '</div>'
          +         '<div>'
          +           '<label class="label" for="iip-nama">Nama Lengkap <span class="text-rose-600">*</span></label>'
          +           '<input type="text" id="iip-nama" class="input" required maxlength="200" value="' + utils.escapeHtml(i.nama_lengkap || '') + '" placeholder="Nama lengkap dengan gelar" />'
          +         '</div>'
          +         '<div>'
          +           '<label class="label" for="iip-jenis-izin">Jenis Izin</label>'
          +           '<select id="iip-jenis-izin" class="select">' + optionsHtml(JENIS_IZIN_OPTS, i.jenis_izin) + '</select>'
          +         '</div>'
          +         '<div>'
          +           '<label class="label" for="iip-tgl-usulan">Tgl Usulan <span class="text-rose-600">*</span></label>'
          +           '<input type="date" id="iip-tgl-usulan" class="input" required value="' + utils.escapeHtml(i.tgl_usulan || today) + '" />'
          +         '</div>'
          +         '<div>'
          +           '<label class="label" for="iip-status-form">Status</label>'
          +           '<select id="iip-status-form" class="select">' + optionsHtml(STATUS_IZIN_OPTS, i.status) + '</select>'
          +         '</div>'
          +         '<div>'
          +           '<label class="label" for="iip-no-sip">No. SIP</label>'
          +           '<input type="text" id="iip-no-sip" class="input font-mono" maxlength="100" value="' + utils.escapeHtml(i.nomor_sip || '') + '" placeholder="SIP/2024/001234 atau -" />'
          +         '</div>'
          +         '<div>'
          +           '<label class="label" for="iip-unit-kerja">Unit Kerja</label>'
          +           '<input type="text" id="iip-unit-kerja" class="input" maxlength="200" value="' + utils.escapeHtml(i.unit_kerja || '') + '" placeholder="RSUD / Puskesmas / Klinik" />'
          +         '</div>'
          +         '<div class="sm:col-span-2">'
          +           '<label class="label" for="iip-masa-berlaku">Masa Berlaku</label>'
          +           '<input type="text" id="iip-masa-berlaku" class="input" maxlength="200" value="' + utils.escapeHtml(i.masa_berlaku || '') + '" placeholder="2024-01-15 s.d 2027-01-15" />'
          +         '</div>'
          +       '</div>'
          +       '<div class="flex items-center justify-end gap-2 pt-3 border-t border-ink-100">'
          +         '<button type="button" class="btn btn-outline btn-sm" data-modal-close>Batal</button>'
          +         '<button type="submit" class="btn btn-primary btn-sm" id="iip-submit">'
          +           '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>'
          +           (isEdit ? 'Simpan Perubahan' : 'Tambah Pengajuan')
          +         '</button>'
          +       '</div>'
          +     '</form>'
          +   '</div>'
          + '</div>';

        portal.querySelectorAll('[data-modal-close]').forEach(function (el) {
          el.addEventListener('click', closeModal);
        });

        const form = document.getElementById('iip-form');
        if (form) {
          form.addEventListener('submit', async function (e) {
            e.preventDefault();
            await handleSubmit(isEdit, existing);
          });
        }

        const nikInput = document.getElementById('iip-nik');
        if (nikInput) {
          nikInput.addEventListener('input', function (e) {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 16);
          });
        }

        document.addEventListener('keydown', onEscKey);
        setTimeout(function () {
          const focusTarget = isEdit ? document.getElementById('iip-nama') : document.getElementById('iip-nik');
          if (focusTarget) focusTarget.focus();
        }, 80);
      }

      function onEscKey(e) {
        if (e.key === 'Escape') closeModal();
      }

      function closeModal() {
        const portal = document.getElementById('modal-portal');
        if (portal) portal.innerHTML = '';
        document.removeEventListener('keydown', onEscKey);
      }

      async function handleSubmit(isEdit, existing) {
        const nik = document.getElementById('iip-nik').value.trim();
        const nama_lengkap = document.getElementById('iip-nama').value.trim();
        const jenis_izin = document.getElementById('iip-jenis-izin').value;
        const tgl_usulan = document.getElementById('iip-tgl-usulan').value.trim();
        const status = document.getElementById('iip-status-form').value;
        const nomor_sip = document.getElementById('iip-no-sip').value.trim();
        const unit_kerja = document.getElementById('iip-unit-kerja').value.trim();
        const masa_berlaku = document.getElementById('iip-masa-berlaku').value.trim();

        const errNik = document.querySelector('[data-error="nik"]');
        if (errNik) { errNik.classList.add('hidden'); errNik.textContent = ''; }

        if (!/^[0-9]{16}$/.test(nik)) {
          if (errNik) { errNik.textContent = 'NIK harus 16 digit angka'; errNik.classList.remove('hidden'); }
          utils.toast('NIK harus 16 digit angka', 'warning');
          return;
        }
        if (!nama_lengkap) { utils.toast('Nama lengkap wajib diisi', 'warning'); return; }
        if (!tgl_usulan) { utils.toast('Tanggal usulan wajib diisi', 'warning'); return; }

        const profile = auth.getProfile() || {};
        const payload = {
          nik: nik,
          nama_lengkap: nama_lengkap,
          jenis_izin: jenis_izin,
          tgl_usulan: tgl_usulan,
          status: status,
          nomor_sip: nomor_sip || '-',
          unit_kerja: unit_kerja,
          masa_berlaku: masa_berlaku,
        };

        const submitBtn = document.getElementById('iip-submit');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9"/></svg> Menyimpan...';
        }

        try {
          if (isEdit) {
            await data.updateIzin(existing.id, payload);
            await data.addLog({ username: profile.username || 'admin', aksi: 'UPDATE_IZIN', detail: 'Update pengajuan izin: ' + nama_lengkap + ' (NIK ' + nik + ', ID ' + existing.id + ')', ip_address: '127.0.0.1' });
            utils.toast('Pengajuan izin diperbarui', 'success');
          } else {
            await data.addIzin(payload);
            await data.addLog({ username: profile.username || 'admin', aksi: 'ADD_IZIN', detail: 'Tambah pengajuan izin: ' + nama_lengkap + ' (NIK ' + nik + ')', ip_address: '127.0.0.1' });
            utils.toast('Pengajuan izin ditambahkan', 'success');
          }
          closeModal();
          await render();
        } catch (err) {
          utils.toast('Gagal menyimpan: ' + err.message, 'error');
          console.error('[input-izin-praktik] submit error:', err);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' + (isEdit ? 'Simpan Perubahan' : 'Tambah Pengajuan');
          }
        }
      }

      async function handleQuickStatus(id, newStatus, nama) {
        const profile = auth.getProfile() || {};
        let confirmMsg = '';
        let aksi = '';
        if (newStatus === 'Disetujui') {
          confirmMsg = 'Setujui pengajuan izin untuk "' + nama + '"?';
          aksi = 'APPROVE_IZIN';
        } else if (newStatus === 'Ditolak') {
          confirmMsg = 'Tolak pengajuan izin untuk "' + nama + '"?';
          aksi = 'REJECT_IZIN';
        } else if (newStatus === 'Proses') {
          confirmMsg = 'Ubah status pengajuan menjadi "Proses"?';
          aksi = 'UPDATE_IZIN';
        } else {
          return;
        }
        if (!confirm(confirmMsg)) return;
        try {
          await data.updateIzin(id, { status: newStatus });
          await data.addLog({ username: profile.username || 'admin', aksi: aksi, detail: 'Status pengajuan izin ID ' + id + ' diubah ke "' + newStatus + '"', ip_address: '127.0.0.1' });
          utils.toast('Status pengajuan diubah ke "' + newStatus + '"', 'success');
          await render();
        } catch (err) {
          utils.toast('Gagal mengubah status: ' + err.message, 'error');
          console.error('[input-izin-praktik] quick status error:', err);
        }
      }

      async function handleDelete(id, nama) {
        if (!confirm('Hapus pengajuan izin untuk "' + nama + '" (ID: ' + id + ')? Tindakan ini tidak dapat dibatalkan.')) return;
        try {
          await data.deleteIzin(id);
          const profile = auth.getProfile() || {};
          await data.addLog({ username: profile.username || 'admin', aksi: 'DELETE_IZIN', detail: 'Hapus pengajuan izin: ' + nama + ' (ID ' + id + ')', ip_address: '127.0.0.1' });
          utils.toast('Pengajuan izin dihapus', 'success');
          await render();
        } catch (err) {
          utils.toast('Gagal menghapus: ' + err.message, 'error');
          console.error('[input-izin-praktik] delete error:', err);
        }
      }

      await render();
    },
  };
})();
