/* ============================================================================
 * SIMANTRI v3 — Page: Manajemen User & Role (Dinkes only)
 * ============================================================================ */

(function () {
  'use strict';

  window.SIMANTRI_PAGES = window.SIMANTRI_PAGES || {};

  window.SIMANTRI_PAGES['manajemen-user'] = {
    html: function () {
      return `
        <div class="space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 class="text-2xl font-extrabold text-ink-900 tracking-tight">Manajemen User &amp; Role</h2>
              <p class="mt-1 text-sm text-ink-500 max-w-2xl">Kelola akun pengguna, peran, dan hak akses pada SIMANTRI.</p>
            </div>
            <button class="btn btn-primary btn-sm" data-action="add-user" type="button" data-role-action="manage-user">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
              Tambah User
            </button>
          </div>

          <!-- Role distribution cards -->
          <div id="mu-role-cards" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="skeleton h-28"></div>
            <div class="skeleton h-28"></div>
            <div class="skeleton h-28"></div>
          </div>

          <!-- Filter -->
          <div class="card p-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div class="md:col-span-2">
                <label class="label" for="mu-search">Pencarian</label>
                <div class="relative">
                  <svg class="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <input type="search" id="mu-search" class="input" style="padding-left:2.25rem;" placeholder="Cari nama atau email..." />
                </div>
              </div>
              <div>
                <label class="label" for="mu-role">Role</label>
                <select id="mu-role" class="select">
                  <option value="">Semua Role</option>
                  <option value="dinkes">Admin Dinkes</option>
                  <option value="fasyankes">Admin Fasyankes</option>
                  <option value="nakes">Tenaga Kesehatan</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Table -->
          <div class="card overflow-hidden">
            <div class="overflow-x-auto" style="max-height:520px;">
              <table class="data-table table-sticky">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Fasyankes</th>
                    <th>Login Terakhir</th>
                    <th>Status</th>
                    <th class="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody id="mu-tbody">
                  <tr><td colspan="7" class="text-center text-ink-500 py-8">Memuat data...</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Permissions matrix -->
          <div class="card p-5">
            <div class="flex items-center gap-2 mb-4">
              <svg class="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              <h3 class="text-base font-bold text-ink-900">Matriks Hak Akses (Permissions)</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Modul</th>
                    <th class="text-center">Dinkes</th>
                    <th class="text-center">Fasyankes</th>
                    <th class="text-center">Nakes</th>
                  </tr>
                </thead>
                <tbody id="mu-matrix">
                  <tr><td colspan="4" class="text-center text-ink-500 py-4">Memuat...</td></tr>
                </tbody>
              </table>
            </div>
            <p class="text-xs text-ink-500 mt-3">Keterangan: <span class="badge badge-teal">Lihat</span> <span class="badge badge-lime">Edit</span> <span class="badge badge-amber">Approve</span> <span class="badge badge-rose">Tidak</span></p>
          </div>
        </div>
      `;
    },

    init: async function () {
      const utils = window.SIMANTRI_UTILS;
      const data = window.SIMANTRI_DATA;
      const components = window.SIMANTRI_COMPONENTS;
      const auth = window.SIMANTRI_AUTH;

      // Guard: Dinkes only
      if (!auth.isDinkes()) {
        const viewSlot = document.getElementById('view-slot');
        if (viewSlot) {
          viewSlot.innerHTML = '<div class="card p-8 text-center">'
            + '<div class="w-14 h-14 mx-auto rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">'
            + '<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>'
            + '</div>'
            + '<h3 class="text-lg font-bold text-ink-900">Akses Ditolak</h3>'
            + '<p class="text-sm text-ink-500 mt-1">Halaman ini hanya untuk Admin Dinkes.</p>'
            + '</div>';
        }
        return;
      }

      // Mock user list (in production, fetch from profiles table)
      const DEMO_USERS = [
        { id: 'u-001', full_name: 'Dr. Demo Admin Dinkes', email: 'admin.dinkes@simantri.demo', role: 'dinkes', fasyankes_id: null, status: 'aktif', last_login: '2025-09-05T08:30:00Z' },
        { id: 'u-002', full_name: 'Budi Fasyankes', email: 'admin.rsud@simantri.demo', role: 'fasyankes', fasyankes_id: 'f-001', status: 'aktif', last_login: '2025-09-04T14:20:00Z' },
        { id: 'u-003', full_name: 'Siti Puskesmas', email: 'admin.puskesmas@simantri.demo', role: 'fasyankes', fasyankes_id: 'f-002', status: 'aktif', last_login: '2025-09-05T07:10:00Z' },
        { id: 'u-004', full_name: 'Dr. Budi Santoso, Sp.PD', email: 'budi.santoso@simantri.demo', role: 'nakes', fasyankes_id: 'f-001', status: 'aktif', last_login: '2025-09-03T11:00:00Z' },
        { id: 'u-005', full_name: 'Dr. Siti Aminah', email: 'siti.aminah@simantri.demo', role: 'nakes', fasyankes_id: 'f-002', status: 'aktif', last_login: '2025-09-02T16:45:00Z' },
        { id: 'u-006', full_name: 'Ns. Rina Marlina, S.Kep', email: 'rina.marlina@simantri.demo', role: 'nakes', fasyankes_id: 'f-001', status: 'nonaktif', last_login: '2025-08-15T09:00:00Z' },
        { id: 'u-007', full_name: 'Klinik Sehat', email: 'admin.klinik@simantri.demo', role: 'fasyankes', fasyankes_id: 'f-003', status: 'aktif', last_login: '2025-09-05T06:30:00Z' },
        { id: 'u-008', full_name: 'Apt. Joko Susanto', email: 'joko.susanto@simantri.demo', role: 'nakes', fasyankes_id: 'f-004', status: 'aktif', last_login: '2025-09-01T10:00:00Z' },
      ];

      let _users = DEMO_USERS.slice();
      let _allFasyankes = [];
      let _search = '';
      let _roleFilter = '';

      const searchInput = document.getElementById('mu-search');
      if (searchInput) {
        searchInput.addEventListener('input', utils.debounce(function (e) {
          _search = e.target.value.trim();
          renderTable();
        }, 250));
      }
      const roleSel = document.getElementById('mu-role');
      if (roleSel) {
        roleSel.addEventListener('change', function (e) {
          _roleFilter = e.target.value;
          renderTable();
        });
      }
      const addBtn = document.querySelector('[data-action="add-user"]');
      if (addBtn) addBtn.addEventListener('click', openAddModal);

      async function load() {
        try {
          _allFasyankes = await data.loadFasyankes();
          renderRoleCards();
          renderTable();
          renderMatrix();
        } catch (err) {
          utils.toast('Gagal memuat data: ' + err.message, 'error');
          console.error(err);
        }
      }

      function fasyankesName(id) {
        if (!id) return '-';
        const f = _allFasyankes.find(function (x) { return x.id === id; });
        return f ? f.nama : '-';
      }

      function roleLabel(role) {
        return ({ dinkes: 'Admin Dinkes', fasyankes: 'Admin Fasyankes', nakes: 'Tenaga Kesehatan' })[role] || role;
      }
      function roleBadgeClass(role) {
        return ({ dinkes: 'badge-teal', fasyankes: 'badge-lime', nakes: 'badge-ink' })[role] || 'badge-ink';
      }

      function renderRoleCards() {
        const container = document.getElementById('mu-role-cards');
        if (!container) return;
        container.innerHTML = '';
        const cards = [
          { label: 'Admin Dinkes', value: _users.filter(function (u) { return u.role === 'dinkes'; }).length, sub: 'Akses penuh sistem', icon: 'shield-check', variant: 'teal' },
          { label: 'Admin Fasyankes', value: _users.filter(function (u) { return u.role === 'fasyankes'; }).length, sub: 'Kelola fasyankes sendiri', icon: 'hospital', variant: 'lime' },
          { label: 'Tenaga Kesehatan', value: _users.filter(function (u) { return u.role === 'nakes'; }).length, sub: 'Akses data pribadi', icon: 'users', variant: 'amber' },
        ];
        cards.forEach(function (c) {
          const div = document.createElement('div');
          container.appendChild(div);
          components.renderStatCard(div, c);
        });
      }

      function getFiltered() {
        return _users.filter(function (u) {
          if (_roleFilter && u.role !== _roleFilter) return false;
          if (_search) {
            const q = _search.toLowerCase();
            if ((u.full_name || '').toLowerCase().indexOf(q) < 0 && (u.email || '').toLowerCase().indexOf(q) < 0) return false;
          }
          return true;
        });
      }

      function renderTable() {
        const tbody = document.getElementById('mu-tbody');
        if (!tbody) return;
        const filtered = getFiltered();
        if (!filtered.length) {
          tbody.innerHTML = '<tr><td colspan="7"><div class="text-center py-10">'
            + '<div class="w-12 h-12 mx-auto rounded-xl bg-ink-100 text-ink-400 flex items-center justify-center mb-3">'
            + '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-2-5.24"/></svg>'
            + '</div>'
            + '<p class="text-sm font-semibold text-ink-700">Tidak ada user yang cocok</p>'
            + '<p class="text-xs text-ink-500 mt-1">Coba ubah kata kunci atau filter</p>'
            + '</div></td></tr>';
          return;
        }
        tbody.innerHTML = filtered.map(function (u) {
          const colorAvatar = utils.avatarColor(u.full_name || u.email);
          const statusBadge = u.status === 'aktif' ? 'badge-teal' : 'badge-rose';
          const statusLabel = u.status === 'aktif' ? 'Aktif' : 'Nonaktif';
          return '<tr data-user-id="' + utils.escapeHtml(u.id) + '">'
               + '<td>'
               + '<div class="flex items-center gap-2">'
               + '<div class="w-8 h-8 rounded-full ' + colorAvatar + ' text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">' + utils.escapeHtml(utils.initials(u.full_name || u.email)) + '</div>'
               + '<p class="text-sm font-semibold text-ink-900 truncate">' + utils.escapeHtml(u.full_name || '-') + '</p>'
               + '</div>'
               + '</td>'
               + '<td><span class="text-xs text-ink-600">' + utils.escapeHtml(u.email || '-') + '</span></td>'
               + '<td><span class="badge ' + roleBadgeClass(u.role) + '">' + roleLabel(u.role) + '</span></td>'
               + '<td><span class="text-xs text-ink-600 truncate">' + utils.escapeHtml(fasyankesName(u.fasyankes_id)) + '</span></td>'
               + '<td><span class="text-xs text-ink-600">' + utils.fmtDate(u.last_login) + '</span></td>'
               + '<td><span class="badge ' + statusBadge + '">' + statusLabel + '</span></td>'
               + '<td class="text-right">'
               + '<button class="btn btn-ghost btn-sm" data-action="edit" data-id="' + utils.escapeHtml(u.id) + '" data-role-action="manage-user" aria-label="Edit">'
               + '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>'
               + '</button>'
               + '<button class="btn btn-ghost btn-sm" data-action="toggle" data-id="' + utils.escapeHtml(u.id) + '" data-role-action="manage-user" aria-label="Aktif/Nonaktif">'
               + '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>'
               + '</button>'
               + '</td>'
               + '</tr>';
        }).join('');

        tbody.querySelectorAll('[data-action="edit"]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            const u = _users.find(function (x) { return x.id === btn.dataset.id; });
            if (u) openEditModal(u);
          });
        });
        tbody.querySelectorAll('[data-action="toggle"]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            const u = _users.find(function (x) { return x.id === btn.dataset.id; });
            if (u) {
              u.status = u.status === 'aktif' ? 'nonaktif' : 'aktif';
              utils.toast('User ' + u.full_name + ' di' + (u.status === 'aktif' ? 'aktifkan' : 'nonaktifkan'), 'success');
              renderTable();
              renderRoleCards();
            }
          });
        });
      }

      function renderMatrix() {
        const tbody = document.getElementById('mu-matrix');
        if (!tbody) return;
        const modules = [
          { name: 'Dashboard Monitoring', dinkes: 'edit', fasyankes: 'lihat', nakes: 'lihat' },
          { name: 'Data Nakes & Tenaga Kesehatan', dinkes: 'edit', fasyankes: 'edit', nakes: 'lihat' },
          { name: 'Data Fasyankes', dinkes: 'edit', fasyankes: 'lihat', nakes: 'tidak' },
          { name: 'Verifikasi STR & SIP', dinkes: 'approve', fasyankes: 'edit', nakes: 'tidak' },
          { name: 'Perpanjangan & Rekomendasi', dinkes: 'approve', fasyankes: 'edit', nakes: 'edit' },
          { name: 'Laporan & Rekap', dinkes: 'edit', fasyankes: 'lihat', nakes: 'tidak' },
          { name: 'Manajemen User', dinkes: 'edit', fasyankes: 'tidak', nakes: 'tidak' },
          { name: 'Pengaturan & Audit Log', dinkes: 'edit', fasyankes: 'lihat', nakes: 'lihat' },
        ];
        const badgeFor = function (perm) {
          switch (perm) {
            case 'edit': return '<span class="badge badge-lime">Edit</span>';
            case 'approve': return '<span class="badge badge-amber">Approve</span>';
            case 'lihat': return '<span class="badge badge-teal">Lihat</span>';
            default: return '<span class="badge badge-rose">Tidak</span>';
          }
        };
        tbody.innerHTML = modules.map(function (m) {
          return '<tr>'
               + '<td><span class="text-sm font-medium text-ink-800">' + utils.escapeHtml(m.name) + '</span></td>'
               + '<td class="text-center">' + badgeFor(m.dinkes) + '</td>'
               + '<td class="text-center">' + badgeFor(m.fasyankes) + '</td>'
               + '<td class="text-center">' + badgeFor(m.nakes) + '</td>'
               + '</tr>';
        }).join('');
      }

      function openAddModal() {
        const modalHtml = buildUserModal(null);
        const portal = document.getElementById('modal-portal');
        if (!portal) return;
        portal.innerHTML = modalHtml;
        bindUserModal(null);
      }

      function openEditModal(u) {
        const modalHtml = buildUserModal(u);
        const portal = document.getElementById('modal-portal');
        if (!portal) return;
        portal.innerHTML = modalHtml;
        bindUserModal(u);
      }

      function buildUserModal(existing) {
        const isEdit = !!existing;
        const u = existing || { full_name: '', email: '', role: 'nakes', fasyankes_id: '', status: 'aktif' };
        const fasyankesOptions = '<option value="">-- Tidak terikat --</option>'
          + _allFasyankes.map(function (f) {
              return '<option value="' + utils.escapeHtml(f.id) + '"' + (f.id === u.fasyankes_id ? ' selected' : '') + '>' + utils.escapeHtml(f.nama) + '</option>';
            }).join('');
        return `
          <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" data-modal>
            <div class="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" data-modal-close></div>
            <div class="relative card w-full sm:max-w-lg max-h-[92vh] overflow-y-auto" style="border-radius:1.25rem;">
              <div class="sticky top-0 bg-white p-5 border-b border-ink-100 flex items-center justify-between z-10">
                <h3 class="text-base font-bold text-ink-900">` + (isEdit ? 'Edit User' : 'Tambah User Baru') + `</h3>
                <button class="btn btn-ghost btn-sm" data-modal-close aria-label="Tutup">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <form id="mu-form" class="p-5 space-y-4" novalidate>
                <div>
                  <label class="label" for="mu-full-name">Nama Lengkap <span class="text-rose-500">*</span></label>
                  <input type="text" id="mu-full-name" class="input" value="` + utils.escapeHtml(u.full_name) + `" required />
                  <p class="field-error hidden" id="mu-full-name-err">Nama lengkap wajib diisi</p>
                </div>
                <div>
                  <label class="label" for="mu-email">Email <span class="text-rose-500">*</span></label>
                  <input type="email" id="mu-email" class="input" value="` + utils.escapeHtml(u.email) + `" ` + (isEdit ? 'readonly' : 'required') + ` />
                  <p class="field-error hidden" id="mu-email-err">Email valid wajib diisi</p>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="label" for="mu-role-sel">Role <span class="text-rose-500">*</span></label>
                    <select id="mu-role-sel" class="select" required>
                      <option value="dinkes"` + (u.role === 'dinkes' ? ' selected' : '') + `>Admin Dinkes</option>
                      <option value="fasyankes"` + (u.role === 'fasyankes' ? ' selected' : '') + `>Admin Fasyankes</option>
                      <option value="nakes"` + (u.role === 'nakes' ? ' selected' : '') + `>Tenaga Kesehatan</option>
                    </select>
                  </div>
                  <div>
                    <label class="label" for="mu-fasyankes-sel">Fasyankes</label>
                    <select id="mu-fasyankes-sel" class="select">` + fasyankesOptions + `</select>
                  </div>
                </div>
                ` + (isEdit ? `
                <div>
                  <label class="label" for="mu-status-sel">Status</label>
                  <select id="mu-status-sel" class="select">
                    <option value="aktif"` + (u.status === 'aktif' ? ' selected' : '') + `>Aktif</option>
                    <option value="nonaktif"` + (u.status === 'nonaktif' ? ' selected' : '') + `>Nonaktif</option>
                  </select>
                </div>` : '') + `
                <div class="rounded-xl bg-ink-50 p-3 text-xs text-ink-600 flex items-start gap-2">
                  <svg class="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <span>` + (isEdit ? 'Perubahan akan disimpan ke database.' : 'User baru akan menerima email aktivasi sebelum dapat login.') + `</span>
                </div>
                <div class="flex justify-end gap-2 pt-3 border-t border-ink-100">
                  <button type="button" class="btn btn-outline btn-sm" data-modal-close>Batal</button>
                  <button type="submit" class="btn btn-primary btn-sm">` + (isEdit ? 'Simpan Perubahan' : 'Tambah User') + `</button>
                </div>
              </form>
            </div>
          </div>
        `;
      }

      function bindUserModal(existing) {
        const portal = document.getElementById('modal-portal');
        if (!portal) return;
        portal.querySelectorAll('[data-modal-close]').forEach(function (el) {
          el.addEventListener('click', closeModal);
        });
        const form = portal.querySelector('#mu-form');
        if (form) {
          form.addEventListener('submit', function (e) {
            e.preventDefault();
            handleSubmit(existing);
          });
        }
        document.addEventListener('keydown', escClose);
      }

      function handleSubmit(existing) {
        const portal = document.getElementById('modal-portal');
        if (!portal) return;
        const fullName = portal.querySelector('#mu-full-name').value.trim();
        const email = portal.querySelector('#mu-email').value.trim();
        const role = portal.querySelector('#mu-role-sel').value;
        const fasyankesId = portal.querySelector('#mu-fasyankes-sel').value;
        const statusSel = portal.querySelector('#mu-status-sel');
        const status = statusSel ? statusSel.value : 'aktif';

        // Validate
        let valid = true;
        const errName = portal.querySelector('#mu-full-name-err');
        const errEmail = portal.querySelector('#mu-email-err');
        if (errName) errName.classList.add('hidden');
        if (errEmail) errEmail.classList.add('hidden');
        if (!fullName) { if (errName) errName.classList.remove('hidden'); valid = false; }
        if (!email || !utils.isEmail(email)) { if (errEmail) { errEmail.textContent = !email ? 'Email wajib diisi' : 'Format email tidak valid'; errEmail.classList.remove('hidden'); } valid = false; }

        if (!valid) {
          utils.toast('Periksa kembali isian form', 'error');
          return;
        }

        // Check email uniqueness
        const exists = _users.some(function (u) { return u.email.toLowerCase() === email.toLowerCase() && u.id !== (existing && existing.id); });
        if (exists) {
          if (errEmail) { errEmail.textContent = 'Email sudah terdaftar'; errEmail.classList.remove('hidden'); }
          utils.toast('Email sudah terdaftar', 'error');
          return;
        }

        if (existing) {
          existing.full_name = fullName;
          existing.email = email;
          existing.role = role;
          existing.fasyankes_id = fasyankesId || null;
          existing.status = status;
          utils.toast('User ' + fullName + ' diperbarui', 'success');
        } else {
          _users.unshift({
            id: 'u-' + Date.now(),
            full_name: fullName,
            email: email,
            role: role,
            fasyankes_id: fasyankesId || null,
            status: 'aktif',
            last_login: null,
          });
          utils.toast('User ' + fullName + ' ditambahkan', 'success');
        }
        closeModal();
        renderRoleCards();
        renderTable();
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
