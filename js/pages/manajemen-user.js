/* ============================================================================
 * SIMANTRI v3 — Page: Manajemen User (Admin only — full CRUD on users table)
 * Schema v1.1 — users keyed by username. Role: admin / operator.
 * ============================================================================ */

(function () {
  'use strict';

  window.SIMANTRI_PAGES = window.SIMANTRI_PAGES || {};

  const ROLE_OPTS = ['admin', 'operator'];

  function optionsHtml(opts, selected) {
    return opts.map(function (o) {
      return '<option value="' + window.SIMANTRI_UTILS.escapeHtml(o) + '"' + (selected === o ? ' selected' : '') + '>' + window.SIMANTRI_UTILS.escapeHtml(o) + '</option>';
    }).join('');
  }

  function roleBadgeClass(r) {
    return r === 'admin' ? 'badge-teal' : 'badge-lime';
  }

  window.SIMANTRI_PAGES['manajemen-user'] = {
    html: function () {
      return ''
        + '<div class="space-y-6">'
        +   '<div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">'
        +     '<div>'
        +       '<h2 class="text-2xl font-extrabold text-ink-900 tracking-tight">Manajemen User</h2>'
        +       '<p class="mt-1 text-sm text-ink-500 max-w-2xl">Kelola akun pengguna, peran, dan hak akses pada SIMANTRI.</p>'
        +     '</div>'
        +     '<button class="btn btn-primary btn-sm" data-action="add" type="button" data-role-action="manage-user">'
        +       '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>'
        +       'Tambah User'
        +     '</button>'
        +   '</div>'

        // Filter
        +   '<div class="card p-4">'
        +     '<div class="grid grid-cols-1 md:grid-cols-3 gap-3">'
        +       '<div class="md:col-span-2">'
        +         '<label class="label" for="mu-search">Pencarian</label>'
        +         '<div class="relative">'
        +           '<svg class="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>'
        +           '<input type="search" id="mu-search" class="input" style="padding-left:2.25rem;" placeholder="Cari username / nama lengkap..." />'
        +         '</div>'
        +       '</div>'
        +       '<div>'
        +         '<label class="label" for="mu-role">Role</label>'
        +         '<select id="mu-role" class="select"><option value="">Semua</option>' + optionsHtml(ROLE_OPTS) + '</select>'
        +       '</div>'
        +     '</div>'
        +   '</div>'

        // Table
        +   '<div class="card overflow-hidden">'
        +     '<div class="overflow-x-auto">'
        +       '<table class="data-table table-sticky">'
        +         '<thead>'
        +           '<tr>'
        +             '<th>Username</th>'
        +             '<th>Full Name</th>'
        +             '<th>Role</th>'
        +             '<th>Active</th>'
        +             '<th>Created At</th>'
        +             '<th>Updated At</th>'
        +             '<th class="text-right">Aksi</th>'
        +           '</tr>'
        +         '</thead>'
        +         '<tbody id="mu-tbody">'
        +           '<tr><td colspan="7" class="text-center text-ink-500 py-8"><div class="skeleton h-8"></div></td></tr>'
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

      let _filters = { search: '', role: '' };

      const addBtn = document.querySelector('[data-action="add"]');
      if (addBtn) addBtn.addEventListener('click', function () { openFormModal(null); });

      const searchInput = document.getElementById('mu-search');
      if (searchInput) {
        searchInput.addEventListener('input', utils.debounce(function (e) {
          _filters.search = e.target.value.trim();
          render();
        }, 300));
      }
      const roleSel = document.getElementById('mu-role');
      if (roleSel) roleSel.addEventListener('change', function (e) { _filters.role = e.target.value; render(); });

      async function render() {
        const tbody = document.getElementById('mu-tbody');
        if (!tbody) return;
        try {
          const list = await data.loadUsers(_filters);
          if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="7">' + emptyStateRow('Belum ada user. Klik "Tambah User" untuk membuat akun.') + '</td></tr>';
            return;
          }
          tbody.innerHTML = list.map(function (u) {
            const roleBadge = roleBadgeClass(u.role);
            const activeBadge = u.is_active ? 'badge-teal' : 'badge-rose';
            const activeLabel = u.is_active ? 'Aktif' : 'Nonaktif';
            const currentUsername = (auth.getProfile() || {}).username;
            const isSelf = currentUsername === u.username;
            return '<tr>'
                 +   '<td class="font-mono font-semibold text-ink-900">' + utils.escapeHtml(u.username || '-') + (isSelf ? ' <span class="text-xs text-teal-600">(anda)</span>' : '') + '</td>'
                 +   '<td class="text-ink-700">' + utils.escapeHtml(u.full_name || '-') + '</td>'
                 +   '<td><span class="badge ' + roleBadge + '">' + utils.escapeHtml(u.role || '-') + '</span></td>'
                 +   '<td><span class="badge ' + activeBadge + '">' + activeLabel + '</span></td>'
                 +   '<td class="whitespace-nowrap text-xs text-ink-500">' + utils.fmtDate(u.created_at) + '</td>'
                 +   '<td class="whitespace-nowrap text-xs text-ink-500">' + utils.fmtDate(u.updated_at) + '</td>'
                 +   '<td class="text-right whitespace-nowrap">'
                 +     '<button class="btn btn-ghost btn-sm" data-action="edit" data-username="' + utils.escapeHtml(u.username) + '" data-role-action="manage-user" title="Edit">'
                 +       '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>'
                 +       'Edit'
                 +     '</button>'
                 +     '<button class="btn btn-ghost btn-sm" data-action="toggle-active" data-username="' + utils.escapeHtml(u.username) + '" data-nama="' + utils.escapeHtml(u.full_name) + '" data-active="' + (u.is_active ? '1' : '0') + '" data-role-action="manage-user" title="' + (u.is_active ? 'Nonaktifkan' : 'Aktifkan') + '">'
                 +       '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"/></svg>'
                 +       (u.is_active ? 'Nonaktifkan' : 'Aktifkan')
                 +     '</button>'
                 +     '<button class="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-50" data-action="delete" data-username="' + utils.escapeHtml(u.username) + '" data-nama="' + utils.escapeHtml(u.full_name) + '" data-role-action="manage-user" title="Hapus"' + (isSelf ? ' disabled' : '') + '>'
                 +       '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>'
                 +       'Hapus'
                 +     '</button>'
                 +   '</td>'
                 + '</tr>';
          }).join('');

          tbody.querySelectorAll('[data-action="edit"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              const username = btn.getAttribute('data-username');
              const item = list.find(function (x) { return x.username === username; });
              if (item) openFormModal(item);
            });
          });
          tbody.querySelectorAll('[data-action="toggle-active"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              const username = btn.getAttribute('data-username');
              const nama = btn.getAttribute('data-nama');
              const active = btn.getAttribute('data-active') === '1';
              handleToggleActive(username, nama, active);
            });
          });
          tbody.querySelectorAll('[data-action="delete"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              if (btn.disabled) return;
              const username = btn.getAttribute('data-username');
              const nama = btn.getAttribute('data-nama');
              handleDelete(username, nama);
            });
          });
        } catch (err) {
          utils.toast('Gagal memuat user: ' + err.message, 'error');
          console.error('[manajemen-user] render error:', err);
          tbody.innerHTML = '<tr><td colspan="7">' + emptyStateRow('Gagal memuat data.') + '</td></tr>';
        }
      }

      function emptyStateRow(message) {
        return '<div class="text-center py-8 text-sm text-ink-500">' + utils.escapeHtml(message) + '</div>';
      }

      // === Form Modal ===
      function openFormModal(existing) {
        const isEdit = !!existing;
        const u = isEdit ? existing : {
          username: '', password: '', full_name: '', role: 'operator', is_active: true,
        };

        const portal = document.getElementById('modal-portal');
        if (!portal) return;
        portal.innerHTML = ''
          + '<div class="fixed inset-0 z-[80] flex items-center justify-center p-4" data-modal-root>'
          +   '<div class="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" data-modal-close></div>'
          +   '<div class="card relative w-full max-w-md max-h-[90vh] overflow-y-auto" data-modal-content>'
          +     '<div class="p-5 border-b border-ink-100 flex items-center justify-between sticky top-0 bg-white z-10">'
          +       '<div>'
          +         '<h3 class="text-base font-bold text-ink-900">' + (isEdit ? 'Edit User' : 'Tambah User') + '</h3>'
          +         '<p class="text-xs text-ink-500 mt-0.5">' + (isEdit ? 'Perbarui data user' : 'Buat akun user baru') + '</p>'
          +       '</div>'
          +       '<button type="button" class="btn btn-ghost btn-sm" data-modal-close aria-label="Tutup">'
          +         '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>'
          +       '</button>'
          +     '</div>'
          +     '<form id="mu-form" class="p-5 space-y-4">'
          +       '<div>'
          +         '<label class="label" for="mu-username">Username <span class="text-rose-600">*</span></label>'
          +         '<input type="text" id="mu-username" class="input font-mono" required maxlength="50" pattern="[a-zA-Z0-9_]+" ' + (isEdit ? 'readonly' : '') + ' value="' + utils.escapeHtml(u.username || '') + '" placeholder="huruf, angka, underscore" />'
          +         '<p class="field-error hidden" data-error="username"></p>'
          +         (isEdit ? '<p class="text-xs text-ink-400 mt-1">Username tidak dapat diubah.</p>' : '')
          +       '</div>'
          +       '<div>'
          +         '<label class="label" for="mu-password">Password <span class="text-rose-600">*</span></label>'
          +         '<input type="text" id="mu-password" class="input font-mono" required maxlength="100" value="' + (isEdit ? (u.password || '') : '') + '" placeholder="' + (isEdit ? 'Kosongkan jika tidak diubah' : 'Min. 6 karakter') + '" />'
          +         '<p class="field-error hidden" data-error="password"></p>'
          +         (isEdit ? '<p class="text-xs text-ink-400 mt-1">Isi password baru untuk mengganti.</p>' : '')
          +       '</div>'
          +       '<div>'
          +         '<label class="label" for="mu-fullname">Full Name <span class="text-rose-600">*</span></label>'
          +         '<input type="text" id="mu-fullname" class="input" required maxlength="200" value="' + utils.escapeHtml(u.full_name || '') + '" placeholder="Nama lengkap user" />'
          +         '<p class="field-error hidden" data-error="full_name"></p>'
          +       '</div>'
          +       '<div>'
          +         '<label class="label" for="mu-role-form">Role</label>'
          +         '<select id="mu-role-form" class="select">' + optionsHtml(ROLE_OPTS, u.role) + '</select>'
          +       '</div>'
          +       '<label class="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-ink-200 hover:bg-teal-50/40">'
          +         '<input type="checkbox" id="mu-is-active" class="mt-0.5 w-4 h-4 rounded text-teal-600" ' + (u.is_active ? 'checked' : '') + ' />'
          +         '<div>'
          +           '<p class="text-sm font-semibold text-ink-800">Akun Aktif</p>'
          +           '<p class="text-xs text-ink-500">User nonaktif tidak dapat login ke sistem.</p>'
          +         '</div>'
          +       '</label>'
          +       '<div class="flex items-center justify-end gap-2 pt-3 border-t border-ink-100">'
          +         '<button type="button" class="btn btn-outline btn-sm" data-modal-close>Batal</button>'
          +         '<button type="submit" class="btn btn-primary btn-sm" id="mu-submit">'
          +           '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>'
          +           (isEdit ? 'Simpan Perubahan' : 'Tambah User')
          +         '</button>'
          +       '</div>'
          +     '</form>'
          +   '</div>'
          + '</div>';

        portal.querySelectorAll('[data-modal-close]').forEach(function (el) {
          el.addEventListener('click', closeModal);
        });

        const form = document.getElementById('mu-form');
        if (form) {
          form.addEventListener('submit', async function (e) {
            e.preventDefault();
            await handleSubmit(isEdit, existing);
          });
        }

        document.addEventListener('keydown', onEscKey);
        setTimeout(function () {
          const focusTarget = isEdit ? document.getElementById('mu-fullname') : document.getElementById('mu-username');
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
        const username = document.getElementById('mu-username').value.trim();
        const password = document.getElementById('mu-password').value;
        const full_name = document.getElementById('mu-fullname').value.trim();
        const role = document.getElementById('mu-role-form').value;
        const is_active = document.getElementById('mu-is-active').checked;

        const errU = document.querySelector('[data-error="username"]');
        const errP = document.querySelector('[data-error="password"]');
        const errF = document.querySelector('[data-error="full_name"]');
        [errU, errP, errF].forEach(function (el) { if (el) { el.classList.add('hidden'); el.textContent = ''; } });

        if (!isEdit) {
          if (!username) { if (errU) { errU.textContent = 'Username wajib diisi'; errU.classList.remove('hidden'); } return; }
          if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            if (errU) { errU.textContent = 'Username hanya boleh huruf, angka, underscore'; errU.classList.remove('hidden'); }
            return;
          }
          if (!password || password.length < 6) {
            if (errP) { errP.textContent = 'Password minimal 6 karakter'; errP.classList.remove('hidden'); }
            return;
          }
        } else {
          // Edit: password boleh kosong (=tidak diubah)
          if (password && password.length < 6) {
            if (errP) { errP.textContent = 'Password minimal 6 karakter'; errP.classList.remove('hidden'); }
            return;
          }
        }
        if (!full_name) { if (errF) { errF.textContent = 'Full name wajib diisi'; errF.classList.remove('hidden'); } return; }

        // Unique check (demo mode): cek konflik username saat add
        if (!isEdit) {
          try {
            const all = await data.loadUsers({});
            if (all.find(function (x) { return x.username.toLowerCase() === username.toLowerCase(); })) {
              if (errU) { errU.textContent = 'Username sudah dipakai'; errU.classList.remove('hidden'); }
              utils.toast('Username sudah dipakai', 'warning');
              return;
            }
          } catch (e) { /* ignore */ }
        }

        const profile = auth.getProfile() || {};
        const payload = {
          username: username,
          password: password || (existing ? existing.password : ''),
          full_name: full_name,
          role: role,
          is_active: is_active,
        };

        const submitBtn = document.getElementById('mu-submit');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9"/></svg> Menyimpan...';
        }

        try {
          if (isEdit) {
            const updatePayload = { full_name: full_name, role: role, is_active: is_active };
            if (password) updatePayload.password = password;
            await data.updateUser(existing.username, updatePayload);
            await data.addLog({ username: profile.username || 'admin', aksi: 'UPDATE_USER', detail: 'Update user: ' + username + ' (' + full_name + ')', ip_address: '127.0.0.1' });
            utils.toast('User diperbarui', 'success');
          } else {
            await data.addUser(payload);
            await data.addLog({ username: profile.username || 'admin', aksi: 'ADD_USER', detail: 'Tambah user: ' + username + ' (' + full_name + ')', ip_address: '127.0.0.1' });
            utils.toast('User ditambahkan', 'success');
          }
          closeModal();
          await render();
        } catch (err) {
          utils.toast('Gagal menyimpan: ' + err.message, 'error');
          console.error('[manajemen-user] submit error:', err);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' + (isEdit ? 'Simpan Perubahan' : 'Tambah User');
          }
        }
      }

      async function handleToggleActive(username, nama, currentlyActive) {
        const action = currentlyActive ? 'Nonaktifkan' : 'Aktifkan';
        if (!confirm(action + ' user "' + nama + '" (' + username + ')?')) return;
        try {
          await data.updateUser(username, { is_active: !currentlyActive });
          const profile = auth.getProfile() || {};
          await data.addLog({ username: profile.username || 'admin', aksi: 'UPDATE_USER', detail: action + ' user: ' + username + ' (' + nama + ')', ip_address: '127.0.0.1' });
          utils.toast('User ' + action.toLowerCase(), 'success');
          await render();
        } catch (err) {
          utils.toast('Gagal mengubah status: ' + err.message, 'error');
          console.error('[manajemen-user] toggle error:', err);
        }
      }

      async function handleDelete(username, nama) {
        const currentUsername = (auth.getProfile() || {}).username;
        if (username === currentUsername) {
          utils.toast('Anda tidak dapat menghapus akun sendiri', 'warning');
          return;
        }
        if (!confirm('Hapus user "' + nama + '" (' + username + ')? Tindakan ini tidak dapat dibatalkan.')) return;
        try {
          await data.deleteUser(username);
          const profile = auth.getProfile() || {};
          await data.addLog({ username: profile.username || 'admin', aksi: 'DELETE_USER', detail: 'Hapus user: ' + username + ' (' + nama + ')', ip_address: '127.0.0.1' });
          utils.toast('User dihapus', 'success');
          await render();
        } catch (err) {
          utils.toast('Gagal menghapus: ' + err.message, 'error');
          console.error('[manajemen-user] delete error:', err);
        }
      }

      await render();
    },
  };
})();
