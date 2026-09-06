/* ============================================================================
 * SIMANTRI v3 — Page: Input Pengumuman (Admin only — add/edit/delete)
 * ============================================================================ */

(function () {
  'use strict';

  window.SIMANTRI_PAGES = window.SIMANTRI_PAGES || {};

  window.SIMANTRI_PAGES['input-pengumuman'] = {
    html: function () {
      return ''
        + '<div class="space-y-6">'
        +   '<div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">'
        +     '<div>'
        +       '<h2 class="text-2xl font-extrabold text-ink-900 tracking-tight">Input Pengumuman</h2>'
        +       '<p class="mt-1 text-sm text-ink-500 max-w-2xl">Kelola pengumuman resmi Dinas Kesehatan Kutai Kartanegara.</p>'
        +     '</div>'
        +     '<button class="btn btn-primary btn-sm" data-action="add" type="button" data-role-action="add">'
        +       '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>'
        +       'Tambah Pengumuman'
        +     '</button>'
        +   '</div>'

        // Filter
        +   '<div class="card p-4">'
        +     '<div class="grid grid-cols-1 md:grid-cols-3 gap-3">'
        +       '<div class="md:col-span-3">'
        +         '<label class="label" for="ip-search">Pencarian</label>'
        +         '<div class="relative">'
        +           '<svg class="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>'
        +           '<input type="search" id="ip-search" class="input" style="padding-left:2.25rem;" placeholder="Cari judul atau isi pengumuman..." />'
        +         '</div>'
        +       '</div>'
        +     '</div>'
        +   '</div>'

        // Table
        +   '<div class="card overflow-hidden">'
        +     '<div class="overflow-x-auto">'
        +       '<table class="data-table table-sticky">'
        +         '<thead>'
        +           '<tr>'
        +             '<th>Tanggal</th>'
        +             '<th>Judul</th>'
        +             '<th>Isi</th>'
        +             '<th>Penting</th>'
        +             '<th>Created By</th>'
        +             '<th class="text-right">Aksi</th>'
        +           '</tr>'
        +         '</thead>'
        +         '<tbody id="ip-tbody">'
        +           '<tr><td colspan="6" class="text-center text-ink-500 py-8"><div class="skeleton h-8"></div></td></tr>'
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

      let _search = '';

      const addBtn = document.querySelector('[data-action="add"]');
      if (addBtn) {
        addBtn.addEventListener('click', function () {
          openFormModal(null);
        });
      }

      const searchInput = document.getElementById('ip-search');
      if (searchInput) {
        searchInput.addEventListener('input', utils.debounce(function (e) {
          _search = e.target.value.trim();
          render();
        }, 300));
      }

      async function render() {
        const tbody = document.getElementById('ip-tbody');
        if (!tbody) return;
        try {
          const list = await data.loadPengumuman({ search: _search });
          if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="6">' + emptyStateRow(_search ? 'Tidak ada pengumuman yang cocok.' : 'Belum ada pengumuman. Klik "Tambah Pengumuman" untuk membuat.') + '</td></tr>';
            return;
          }
          tbody.innerHTML = list.map(function (p) {
            const penting = p.is_penting === 1 || p.is_penting === true;
            const isi = (p.isi || '');
            const isiTrunc = isi.length > 80 ? isi.slice(0, 80) + '...' : isi;
            return '<tr>'
                 +   '<td class="whitespace-nowrap">' + utils.fmtDate(p.tanggal) + '</td>'
                 +   '<td class="font-semibold text-ink-900">' + utils.escapeHtml(p.judul) + '</td>'
                 +   '<td class="text-ink-600 max-w-xs"><span class="line-clamp-2">' + utils.escapeHtml(isiTrunc) + '</span></td>'
                 +   '<td>' + (penting ? '<span class="badge badge-rose">PENTING</span>' : '<span class="badge badge-ink">Umum</span>') + '</td>'
                 +   '<td class="text-ink-500">' + utils.escapeHtml(p.created_by || '-') + '</td>'
                 +   '<td class="text-right whitespace-nowrap">'
                 +     '<button class="btn btn-ghost btn-sm" data-action="edit" data-id="' + utils.escapeHtml(p.id) + '" data-role-action="edit" title="Edit">'
                 +       '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>'
                 +       'Edit'
                 +     '</button>'
                 +     '<button class="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-50" data-action="delete" data-id="' + utils.escapeHtml(p.id) + '" data-judul="' + utils.escapeHtml(p.judul) + '" data-role-action="delete" title="Hapus">'
                 +       '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>'
                 +       'Hapus'
                 +     '</button>'
                 +   '</td>'
                 + '</tr>';
          }).join('');

          // Bind edit/delete
          tbody.querySelectorAll('[data-action="edit"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              const id = btn.getAttribute('data-id');
              const item = list.find(function (x) { return String(x.id) === String(id); });
              if (item) openFormModal(item);
            });
          });
          tbody.querySelectorAll('[data-action="delete"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              const id = btn.getAttribute('data-id');
              const judul = btn.getAttribute('data-judul');
              handleDelete(id, judul);
            });
          });
        } catch (err) {
          utils.toast('Gagal memuat pengumuman: ' + err.message, 'error');
          console.error('[input-pengumuman] render error:', err);
          tbody.innerHTML = '<tr><td colspan="6">' + emptyStateRow('Gagal memuat data.') + '</td></tr>';
        }
      }

      function emptyStateRow(message) {
        return '<div class="text-center py-8 text-sm text-ink-500">' + utils.escapeHtml(message) + '</div>';
      }

      // === Form Modal ===
      function openFormModal(existing) {
        const isEdit = !!existing;
        const today = new Date().toISOString().split('T')[0];
        const payload = isEdit ? existing : {
          tanggal: today, judul: '', isi: '', is_penting: 0, created_by: (auth.getProfile() || {}).username || 'admin',
        };

        const portal = document.getElementById('modal-portal');
        if (!portal) return;
        portal.innerHTML = ''
          + '<div class="fixed inset-0 z-[80] flex items-center justify-center p-4" data-modal-root>'
          +   '<div class="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" data-modal-close></div>'
          +   '<div class="card relative w-full max-w-lg max-h-[90vh] overflow-y-auto" data-modal-content>'
          +     '<div class="p-5 border-b border-ink-100 flex items-center justify-between sticky top-0 bg-white z-10">'
          +       '<div>'
          +         '<h3 class="text-base font-bold text-ink-900">' + (isEdit ? 'Edit Pengumuman' : 'Tambah Pengumuman') + '</h3>'
          +         '<p class="text-xs text-ink-500 mt-0.5">' + (isEdit ? 'Perbarui data pengumuman' : 'Buat pengumuman baru') + '</p>'
          +       '</div>'
          +       '<button type="button" class="btn btn-ghost btn-sm" data-modal-close aria-label="Tutup">'
          +         '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>'
          +       '</button>'
          +     '</div>'
          +     '<form id="ip-form" class="p-5 space-y-4">'
          +       '<div>'
          +         '<label class="label" for="ip-tanggal">Tanggal <span class="text-rose-600">*</span></label>'
          +         '<input type="date" id="ip-tanggal" class="input" required value="' + utils.escapeHtml(payload.tanggal || today) + '" />'
          +       '</div>'
          +       '<div>'
          +         '<label class="label" for="ip-judul">Judul <span class="text-rose-600">*</span></label>'
          +         '<input type="text" id="ip-judul" class="input" required maxlength="200" placeholder="Judul pengumuman" value="' + utils.escapeHtml(payload.judul || '') + '" />'
          +         '<p class="field-error hidden" data-error="judul"></p>'
          +       '</div>'
          +       '<div>'
          +         '<label class="label" for="ip-isi">Isi <span class="text-rose-600">*</span></label>'
          +         '<textarea id="ip-isi" class="textarea" required rows="5" placeholder="Tulis isi pengumuman...">' + utils.escapeHtml(payload.isi || '') + '</textarea>'
          +         '<p class="field-error hidden" data-error="isi"></p>'
          +       '</div>'
          +       '<label class="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-ink-200 hover:bg-teal-50/40">'
          +         '<input type="checkbox" id="ip-penting" class="mt-0.5 w-4 h-4 rounded text-teal-600" ' + ((payload.is_penting === 1 || payload.is_penting === true) ? 'checked' : '') + ' />'
          +         '<div>'
          +           '<p class="text-sm font-semibold text-ink-800">Tandai sebagai PENTING</p>'
          +           '<p class="text-xs text-ink-500">Pengumuman akan ditampilkan dengan badge "PENTING" di dashboard &amp; halaman publik.</p>'
          +         '</div>'
          +       '</label>'
          +       '<div class="flex items-center justify-end gap-2 pt-2 border-t border-ink-100">'
          +         '<button type="button" class="btn btn-outline btn-sm" data-modal-close>Batal</button>'
          +         '<button type="submit" class="btn btn-primary btn-sm" id="ip-submit">'
          +           '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>'
          +           (isEdit ? 'Simpan Perubahan' : 'Tambah Pengumuman')
          +         '</button>'
          +       '</div>'
          +     '</form>'
          +   '</div>'
          + '</div>';

        // Bind close
        portal.querySelectorAll('[data-modal-close]').forEach(function (el) {
          el.addEventListener('click', closeModal);
        });

        // Bind form submit
        const form = document.getElementById('ip-form');
        if (form) {
          form.addEventListener('submit', async function (e) {
            e.preventDefault();
            await handleSubmit(isEdit, existing);
          });
        }

        // ESC
        document.addEventListener('keydown', onEscKey);

        // Focus
        setTimeout(function () {
          const judulInput = document.getElementById('ip-judul');
          if (judulInput) judulInput.focus();
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
        const tanggal = document.getElementById('ip-tanggal').value.trim();
        const judul = document.getElementById('ip-judul').value.trim();
        const isi = document.getElementById('ip-isi').value.trim();
        const is_penting = document.getElementById('ip-penting').checked ? 1 : 0;

        // Reset errors
        const errJudul = document.querySelector('[data-error="judul"]');
        const errIsi = document.querySelector('[data-error="isi"]');
        if (errJudul) { errJudul.classList.add('hidden'); errJudul.textContent = ''; }
        if (errIsi) { errIsi.classList.add('hidden'); errIsi.textContent = ''; }

        if (!tanggal) { utils.toast('Tanggal wajib diisi', 'warning'); return; }
        if (!judul) {
          if (errJudul) { errJudul.textContent = 'Judul wajib diisi'; errJudul.classList.remove('hidden'); }
          return;
        }
        if (!isi) {
          if (errIsi) { errIsi.textContent = 'Isi wajib diisi'; errIsi.classList.remove('hidden'); }
          return;
        }

        const profile = auth.getProfile() || {};
        const payload = {
          tanggal: tanggal,
          judul: judul,
          isi: isi,
          is_penting: is_penting,
          created_by: profile.username || 'admin',
        };

        const submitBtn = document.getElementById('ip-submit');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9"/></svg> Menyimpan...';
        }

        try {
          if (isEdit) {
            await data.updatePengumuman(existing.id, payload);
            await data.addLog({ username: profile.username || 'admin', aksi: 'UPDATE_PENGUMUMAN', detail: 'Update pengumuman: ' + judul, ip_address: '127.0.0.1' });
            utils.toast('Pengumuman diperbarui', 'success');
          } else {
            await data.addPengumuman(payload);
            await data.addLog({ username: profile.username || 'admin', aksi: 'ADD_PENGUMUMAN', detail: 'Tambah pengumuman: ' + judul, ip_address: '127.0.0.1' });
            utils.toast('Pengumuman ditambahkan', 'success');
          }
          closeModal();
          await render();
        } catch (err) {
          utils.toast('Gagal menyimpan: ' + err.message, 'error');
          console.error('[input-pengumuman] submit error:', err);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' + (isEdit ? 'Simpan Perubahan' : 'Tambah Pengumuman');
          }
        }
      }

      async function handleDelete(id, judul) {
        if (!confirm('Hapus pengumuman "' + judul + '"? Tindakan ini tidak dapat dibatalkan.')) return;
        try {
          await data.deletePengumuman(id);
          const profile = auth.getProfile() || {};
          await data.addLog({ username: profile.username || 'admin', aksi: 'DELETE_PENGUMUMAN', detail: 'Hapus pengumuman: ' + judul, ip_address: '127.0.0.1' });
          utils.toast('Pengumuman dihapus', 'success');
          await render();
        } catch (err) {
          utils.toast('Gagal menghapus: ' + err.message, 'error');
          console.error('[input-pengumuman] delete error:', err);
        }
      }

      await render();
    },
  };
})();
