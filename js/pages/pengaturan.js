/* ============================================================================
 * SIMANTRI v3 — Page: Pengaturan & Audit Log
 * ============================================================================ */

(function () {
  'use strict';

  window.SIMANTRI_PAGES = window.SIMANTRI_PAGES || {};

  window.SIMANTRI_PAGES['pengaturan'] = {
    html: function () {
      return `
        <div class="space-y-6">
          <div>
            <h2 class="text-2xl font-extrabold text-ink-900 tracking-tight">Pengaturan &amp; Audit Log</h2>
            <p class="mt-1 text-sm text-ink-500 max-w-2xl">Kelola profil, preferensi notifikasi, pengaturan sistem, dan riwayat aktivitas (audit log).</p>
          </div>

          <!-- Tabs -->
          <div class="flex items-center gap-1 border-b border-ink-200">
            <button type="button" class="pg-tab px-4 py-2.5 text-sm font-semibold border-b-2 border-teal-600 text-teal-700" data-tab="settings">Pengaturan</button>
            <button type="button" class="pg-tab px-4 py-2.5 text-sm font-semibold border-b-2 border-transparent text-ink-500 hover:text-ink-800" data-tab="audit">Audit Log</button>
          </div>

          <!-- Tab: Settings -->
          <div id="pg-settings-tab" class="space-y-6">
            <!-- Profil user -->
            <div class="card p-5">
              <div class="flex items-center gap-2 mb-4">
                <svg class="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                <h3 class="text-base font-bold text-ink-900">Profil Pengguna</h3>
              </div>
              <form id="pg-profile-form" class="space-y-4">
                <div class="flex items-center gap-4">
                  <div id="pg-avatar" class="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-ink-900" style="background:linear-gradient(135deg,#0D9488 0%,#84CC16 100%);">?</div>
                  <div>
                    <button type="button" class="btn btn-outline btn-sm">Ubah Avatar</button>
                    <p class="text-xs text-ink-500 mt-1">JPG/PNG, maks 2 MB</p>
                  </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="label" for="pg-full-name">Nama Lengkap</label>
                    <input type="text" id="pg-full-name" class="input" />
                  </div>
                  <div>
                    <label class="label" for="pg-email">Email</label>
                    <input type="email" id="pg-email" class="input" readonly />
                  </div>
                  <div>
                    <label class="label" for="pg-role">Role</label>
                    <input type="text" id="pg-role" class="input" readonly />
                  </div>
                  <div>
                    <label class="label" for="pg-fasyankes">Fasyankes</label>
                    <input type="text" id="pg-fasyankes" class="input" readonly />
                  </div>
                </div>
                <div class="flex justify-end">
                  <button type="submit" class="btn btn-primary btn-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                    Simpan Profil
                  </button>
                </div>
              </form>
            </div>

            <!-- Preferensi notifikasi -->
            <div class="card p-5">
              <div class="flex items-center gap-2 mb-4">
                <svg class="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                <h3 class="text-base font-bold text-ink-900">Preferensi Notifikasi</h3>
              </div>
              <div class="space-y-3">
                <label class="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" id="pg-notif-email" class="mt-0.5 w-4 h-4 rounded text-teal-600" checked />
                  <div>
                    <p class="text-sm font-semibold text-ink-800">Notifikasi via Email</p>
                    <p class="text-xs text-ink-500">Kirim email saat STR/SIP akan expired atau ada pengajuan baru</p>
                  </div>
                </label>
                <label class="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" id="pg-notif-push" class="mt-0.5 w-4 h-4 rounded text-teal-600" checked />
                  <div>
                    <p class="text-sm font-semibold text-ink-800">Notifikasi In-App</p>
                    <p class="text-xs text-ink-500">Tampilkan badge &amp; toast di header aplikasi</p>
                  </div>
                </label>
                <label class="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" id="pg-notif-warning" class="mt-0.5 w-4 h-4 rounded text-teal-600" checked />
                  <div>
                    <p class="text-sm font-semibold text-ink-800">Pengingat H-90, H-30, H-7</p>
                    <p class="text-xs text-ink-500">Kirim pengingat bertahap sebelum tanggal expired</p>
                  </div>
                </label>
                <label class="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" id="pg-notif-daily" class="mt-0.5 w-4 h-4 rounded text-teal-600" />
                  <div>
                    <p class="text-sm font-semibold text-ink-800">Rekap Harian</p>
                    <p class="text-xs text-ink-500">Ringkasan aktivitas harian dikirim setiap pagi</p>
                  </div>
                </label>
              </div>
              <div class="flex justify-end mt-4">
                <button type="button" class="btn btn-primary btn-sm" data-action="save-notif">Simpan Preferensi</button>
              </div>
            </div>

            <!-- Pengaturan sistem (Dinkes only) -->
            <div id="pg-system-settings" class="card p-5 hidden role-dinkes-only">
              <div class="flex items-center gap-2 mb-4">
                <svg class="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/></svg>
                <h3 class="text-base font-bold text-ink-900">Pengaturan Sistem</h3>
                <span class="badge badge-amber">DINKES ONLY</span>
              </div>
              <div class="space-y-4">
                <div>
                  <label class="label" for="pg-warning-days">Threshold Warning Expired (hari)</label>
                  <input type="number" id="pg-warning-days" class="input" min="7" max="365" value="90" />
                  <p class="text-xs text-ink-500 mt-1">Berapa hari sebelum expired suatu dokumen dianggap "hampir expired"</p>
                </div>
                <div>
                  <label class="label" for="pg-app-name">Nama Aplikasi</label>
                  <input type="text" id="pg-app-name" class="input" value="SIMANTRI" />
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="pg-maintenance" class="w-4 h-4 rounded text-teal-600" />
                    <span class="text-sm text-ink-700">Mode Maintenance</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="pg-registration" class="w-4 h-4 rounded text-teal-600" checked />
                    <span class="text-sm text-ink-700">Izinkan Registrasi Mandiri</span>
                  </label>
                </div>
                <div class="flex justify-end">
                  <button type="button" class="btn btn-primary btn-sm" data-action="save-system">Simpan Pengaturan Sistem</button>
                </div>
              </div>
            </div>

            <!-- Keamanan -->
            <div class="card p-5">
              <div class="flex items-center gap-2 mb-4">
                <svg class="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                <h3 class="text-base font-bold text-ink-900">Keamanan</h3>
              </div>
              <div class="space-y-4">
                <div>
                  <label class="label" for="pg-current-pass">Password Saat Ini</label>
                  <input type="password" id="pg-current-pass" class="input" placeholder="••••••••" />
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="label" for="pg-new-pass">Password Baru</label>
                    <input type="password" id="pg-new-pass" class="input" placeholder="Minimal 8 karakter" />
                  </div>
                  <div>
                    <label class="label" for="pg-confirm-pass">Konfirmasi Password Baru</label>
                    <input type="password" id="pg-confirm-pass" class="input" placeholder="Ulangi password baru" />
                  </div>
                </div>
                <p class="field-error hidden" id="pg-pass-err"></p>
                <div class="flex justify-end">
                  <button type="button" class="btn btn-primary btn-sm" data-action="change-pass">Ubah Password</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab: Audit Log -->
          <div id="pg-audit-tab" class="hidden space-y-4">
            <div class="card p-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label class="label" for="pg-audit-search">Pencarian</label>
                  <div class="relative">
                    <svg class="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    <input type="search" id="pg-audit-search" class="input" style="padding-left:2.25rem;" placeholder="Cari aktivitas / user..." />
                  </div>
                </div>
                <div>
                  <label class="label" for="pg-audit-action">Jenis Aksi</label>
                  <select id="pg-audit-action" class="select">
                    <option value="">Semua Aksi</option>
                    <option value="login">Login</option>
                    <option value="logout">Logout</option>
                    <option value="create">Create</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                    <option value="approve">Approve</option>
                    <option value="reject">Reject</option>
                  </select>
                </div>
                <div>
                  <label class="label" for="pg-audit-date">Tanggal</label>
                  <input type="date" id="pg-audit-date" class="input" />
                </div>
              </div>
            </div>

            <div class="card overflow-hidden">
              <div class="overflow-x-auto" style="max-height:560px;">
                <table class="data-table table-sticky">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>User</th>
                      <th>Aksi</th>
                      <th>Modul</th>
                      <th>Detail</th>
                      <th>IP</th>
                    </tr>
                  </thead>
                  <tbody id="pg-audit-tbody">
                    <tr><td colspan="6" class="text-center text-ink-500 py-8">Memuat audit log...</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    init: async function () {
      const utils = window.SIMANTRI_UTILS;
      const auth = window.SIMANTRI_AUTH;
      const data = window.SIMANTRI_DATA;

      let _activeTab = 'settings';
      let _auditSearch = '';
      let _auditAction = '';
      let _auditDate = '';
      let _auditLogs = [];

      // Tabs
      document.querySelectorAll('.pg-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
          _activeTab = tab.dataset.tab;
          document.querySelectorAll('.pg-tab').forEach(function (t) {
            const isActive = t === tab;
            t.classList.toggle('border-teal-600', isActive);
            t.classList.toggle('text-teal-700', isActive);
            t.classList.toggle('border-transparent', !isActive);
            t.classList.toggle('text-ink-500', !isActive);
          });
          const settingsEl = document.getElementById('pg-settings-tab');
          const auditEl = document.getElementById('pg-audit-tab');
          if (settingsEl) settingsEl.classList.toggle('hidden', _activeTab !== 'settings');
          if (auditEl) auditEl.classList.toggle('hidden', _activeTab !== 'audit');
        });
      });

      // Profile form
      const profile = auth.getProfile();
      const fullNameInput = document.getElementById('pg-full-name');
      const emailInput = document.getElementById('pg-email');
      const roleInput = document.getElementById('pg-role');
      const fasyankesInput = document.getElementById('pg-fasyankes');
      const avatarEl = document.getElementById('pg-avatar');

      if (profile) {
        if (fullNameInput) fullNameInput.value = profile.full_name || '';
        if (emailInput) emailInput.value = profile.email || '';
        if (roleInput) {
          roleInput.value = ({ dinkes: 'Admin Dinkes', fasyankes: 'Admin Fasyankes', nakes: 'Tenaga Kesehatan' })[profile.role] || profile.role || '-';
        }
        if (avatarEl) avatarEl.textContent = utils.initials(profile.full_name || profile.email || '?');
      }

      // Load fasyankes name
      async function loadFasyankes() {
        try {
          const fasyankes = await data.loadFasyankes();
          if (profile && profile.fasyankes_id && fasyankesInput) {
            const f = fasyankes.find(function (x) { return x.id === profile.fasyankes_id; });
            fasyankesInput.value = f ? f.nama : '-';
          } else if (fasyankesInput) {
            fasyankesInput.value = '-';
          }
        } catch (e) { /* ignore */ }
      }

      const profileForm = document.getElementById('pg-profile-form');
      if (profileForm) {
        profileForm.addEventListener('submit', function (e) {
          e.preventDefault();
          const newName = fullNameInput.value.trim();
          if (!newName) {
            utils.toast('Nama lengkap wajib diisi', 'error');
            return;
          }
          if (profile) profile.full_name = newName;
          if (avatarEl) avatarEl.textContent = utils.initials(newName);
          utils.toast('Profil berhasil disimpan', 'success');
          // Update sidebar
          const sidebarName = document.getElementById('sidebar-user-name');
          const headerName = document.getElementById('header-user-name');
          const sidebarAvatar = document.getElementById('sidebar-avatar');
          const headerAvatar = document.getElementById('header-avatar');
          if (sidebarName) sidebarName.textContent = newName;
          if (headerName) headerName.textContent = newName;
          if (sidebarAvatar) sidebarAvatar.textContent = utils.initials(newName);
          if (headerAvatar) headerAvatar.textContent = utils.initials(newName);
        });
      }

      // Load settings from store and populate form
      async function loadSettingsForm() {
        try {
          const s = await data.loadSettings();
          const setChk = function (id, val) { const el = document.getElementById(id); if (el) el.checked = !!val; };
          const setVal = function (id, val) { const el = document.getElementById(id); if (el) el.value = val != null ? val : ''; };
          setChk('pg-notif-email', s.notifikasi_h90_str || s.notifikasi_h90_sip);
          setChk('pg-notif-push', s.notifikasi_h30);
          setChk('pg-notif-warning', s.notifikasi_h90_str || s.notifikasi_h90_sip || s.notifikasi_h30);
          setChk('pg-notif-daily', s.email_digest === 'daily');
          setVal('pg-warning-days', s.expiry_threshold_days || 90);
          setChk('pg-maintenance', s.auto_disable_expired === true && s.expiry_threshold_days === -1);
          setChk('pg-registration', s.integrasi_email !== false ? false : true);
        } catch (e) {
          /* ignore — keep defaults */
        }
      }

      // Save notification preferences
      const saveNotifBtn = document.querySelector('[data-action="save-notif"]');
      if (saveNotifBtn) {
        saveNotifBtn.addEventListener('click', async function () {
          const notifEmail = document.getElementById('pg-notif-email') ? document.getElementById('pg-notif-email').checked : true;
          const notifPush = document.getElementById('pg-notif-push') ? document.getElementById('pg-notif-push').checked : true;
          const notifWarning = document.getElementById('pg-notif-warning') ? document.getElementById('pg-notif-warning').checked : true;
          const notifDaily = document.getElementById('pg-notif-daily') ? document.getElementById('pg-notif-daily').checked : false;
          const payload = {
            notifikasi_h90_str: notifWarning,
            notifikasi_h90_sip: notifWarning,
            notifikasi_h30: notifPush,
            email_digest: notifDaily ? 'daily' : 'off',
            integrasi_email: notifEmail
          };
          try {
            await data.saveSettings(payload);
            const profile = auth.getProfile();
            await data.addAuditLog({
              user_id: profile.id,
              user_name: profile.full_name,
              action: 'UPDATE',
              entity: 'settings',
              entity_id: '-',
              detail: 'Update preferensi notifikasi'
            });
            utils.toast('Preferensi notifikasi disimpan', 'success');
          } catch (e) {
            utils.toast('Error: ' + e.message, 'error');
          }
        });
      }

      // Show system settings for Dinkes
      if (auth.isDinkes()) {
        const sysSettings = document.getElementById('pg-system-settings');
        if (sysSettings) sysSettings.classList.remove('hidden');
      }
      const saveSystemBtn = document.querySelector('[data-action="save-system"]');
      if (saveSystemBtn) {
        saveSystemBtn.addEventListener('click', async function () {
          const warningDays = parseInt(document.getElementById('pg-warning-days') ? document.getElementById('pg-warning-days').value : '90', 10);
          const appName = document.getElementById('pg-app-name') ? document.getElementById('pg-app-name').value : 'SIMANTRI';
          const maintenance = document.getElementById('pg-maintenance') ? document.getElementById('pg-maintenance').checked : false;
          const registration = document.getElementById('pg-registration') ? document.getElementById('pg-registration').checked : true;
          const payload = {
            expiry_threshold_days: isNaN(warningDays) ? 90 : warningDays,
            app_name: appName,
            auto_disable_expired: maintenance,
            allow_registration: registration
          };
          try {
            await data.saveSettings(payload);
            const profile = auth.getProfile();
            await data.addAuditLog({
              user_id: profile.id,
              user_name: profile.full_name,
              action: 'UPDATE',
              entity: 'settings',
              entity_id: '-',
              detail: 'Update pengaturan sistem (threshold=' + payload.expiry_threshold_days + ' hari)'
            });
            utils.toast('Pengaturan sistem disimpan', 'success');
          } catch (e) {
            utils.toast('Error: ' + e.message, 'error');
          }
        });
      }

      // Change password
      const changePassBtn = document.querySelector('[data-action="change-pass"]');
      if (changePassBtn) {
        changePassBtn.addEventListener('click', async function () {
          const current = document.getElementById('pg-current-pass').value;
          const newP = document.getElementById('pg-new-pass').value;
          const confirmP = document.getElementById('pg-confirm-pass').value;
          const errEl = document.getElementById('pg-pass-err');
          if (errEl) errEl.classList.add('hidden');
          if (!current || !newP || !confirmP) {
            if (errEl) { errEl.textContent = 'Semua field password wajib diisi'; errEl.classList.remove('hidden'); }
            utils.toast('Lengkapi semua field password', 'error');
            return;
          }
          if (newP.length < 8) {
            if (errEl) { errEl.textContent = 'Password baru minimal 8 karakter'; errEl.classList.remove('hidden'); }
            utils.toast('Password baru terlalu pendek', 'error');
            return;
          }
          if (newP !== confirmP) {
            if (errEl) { errEl.textContent = 'Konfirmasi password tidak cocok'; errEl.classList.remove('hidden'); }
            utils.toast('Konfirmasi password tidak cocok', 'error');
            return;
          }
          try {
            const profile = auth.getProfile();
            await data.addAuditLog({
              user_id: profile.id,
              user_name: profile.full_name,
              action: 'UPDATE',
              entity: 'auth',
              entity_id: profile.id || '-',
              detail: 'Ubah password user'
            });
            utils.toast('Password berhasil diubah', 'success');
            document.getElementById('pg-current-pass').value = '';
            document.getElementById('pg-new-pass').value = '';
            document.getElementById('pg-confirm-pass').value = '';
          } catch (e) {
            utils.toast('Error: ' + e.message, 'error');
          }
        });
      }

      // Audit log filters
      const auditSearch = document.getElementById('pg-audit-search');
      if (auditSearch) {
        auditSearch.addEventListener('input', utils.debounce(function (e) {
          _auditSearch = e.target.value.trim();
          renderAudit();
        }, 250));
      }
      const auditActionSel = document.getElementById('pg-audit-action');
      if (auditActionSel) {
        auditActionSel.addEventListener('change', function (e) {
          _auditAction = e.target.value;
          renderAudit();
        });
      }
      const auditDate = document.getElementById('pg-audit-date');
      if (auditDate) {
        auditDate.addEventListener('change', function (e) {
          _auditDate = e.target.value;
          renderAudit();
        });
      }

      function actionBadge(action) {
        const a = String(action || '').toLowerCase();
        const map = {
          login: 'badge-teal',
          logout: 'badge-ink',
          create: 'badge-lime',
          update: 'badge-amber',
          delete: 'badge-rose',
          approve: 'badge-teal',
          reject: 'badge-rose'
        };
        return map[a] || 'badge-ink';
      }
      function actionLabel(action) {
        const a = String(action || '').toLowerCase();
        const map = {
          login: 'Login',
          logout: 'Logout',
          create: 'Create',
          update: 'Update',
          delete: 'Delete',
          approve: 'Approve',
          reject: 'Reject'
        };
        return map[a] || (action || '-');
      }

      async function loadAudit() {
        try {
          const opts = {};
          if (_auditAction) opts.action = _auditAction.toUpperCase();
          if (_auditSearch) opts.search = _auditSearch;
          const items = await data.loadAuditLog(opts);
          _auditLogs = (items || []).map(function (l) {
            return {
              id: l.id,
              timestamp: l.created_at,
              user: l.user_name || l.user_id || '-',
              action: String(l.action || '').toLowerCase(),
              module: l.entity || '-',
              detail: l.detail || '-',
              ip: l.ip_address || '-'
            };
          });
        } catch (e) {
          utils.toast('Gagal memuat audit log: ' + e.message, 'error');
          _auditLogs = [];
        }
        renderAudit();
      }

      function renderAudit() {
        const tbody = document.getElementById('pg-audit-tbody');
        if (!tbody) return;
        let filtered = _auditLogs.slice();
        if (_auditAction) filtered = filtered.filter(function (l) { return l.action === _auditAction; });
        if (_auditDate) {
          filtered = filtered.filter(function (l) {
            const d = new Date(l.timestamp);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return (y + '-' + m + '-' + dd) === _auditDate;
          });
        }
        if (_auditSearch) {
          const q = _auditSearch.toLowerCase();
          filtered = filtered.filter(function (l) {
            return (l.user || '').toLowerCase().indexOf(q) >= 0
              || (l.detail || '').toLowerCase().indexOf(q) >= 0
              || (l.module || '').toLowerCase().indexOf(q) >= 0;
          });
        }
        if (!filtered.length) {
          tbody.innerHTML = '<tr><td colspan="6"><div class="text-center py-10">'
            + '<div class="w-12 h-12 mx-auto rounded-xl bg-ink-100 text-ink-400 flex items-center justify-center mb-3">'
            + '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>'
            + '</div>'
            + '<p class="text-sm font-semibold text-ink-700">Tidak ada audit log yang cocok</p>'
            + '</div></td></tr>';
          return;
        }
        tbody.innerHTML = filtered.map(function (l) {
          const colorAvatar = utils.avatarColor(l.user);
          return '<tr>'
               + '<td><div class="text-xs text-ink-700">' + utils.fmtDate(l.timestamp) + '</div><div class="text-[10px] text-ink-400">' + new Date(l.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + '</div></td>'
               + '<td><div class="flex items-center gap-2"><div class="w-6 h-6 rounded-full ' + colorAvatar + ' text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">' + utils.escapeHtml(utils.initials(l.user)) + '</div><span class="text-xs font-medium text-ink-800 truncate">' + utils.escapeHtml(l.user) + '</span></div></td>'
               + '<td><span class="badge ' + actionBadge(l.action) + '">' + actionLabel(l.action) + '</span></td>'
               + '<td><span class="text-xs text-ink-700">' + utils.escapeHtml(l.module || '-') + '</span></td>'
               + '<td><span class="text-xs text-ink-600">' + utils.escapeHtml(l.detail || '-') + '</span></td>'
               + '<td><span class="text-xs font-mono text-ink-500">' + utils.escapeHtml(l.ip || '-') + '</span></td>'
               + '</tr>';
        }).join('');
      }

      await loadFasyankes();
      await loadSettingsForm();
      await loadAudit();
    },
  };
})();
