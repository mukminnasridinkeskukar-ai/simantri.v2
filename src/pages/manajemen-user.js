// SIMANTRI — Manajemen User & Role page logic
import { loadFasyankes, DEMO_FASYANKES } from '../assets/js/demo-data.js';
import { isDemoMode } from '../assets/js/supabase.js';
import { fmtDate, fmtDateLong, relativeFromNow, initials, avatarColor, escapeHtml, toast, debounce, uid } from '../assets/js/utils.js';
import { getProfile, isDinkes } from '../assets/js/auth.js';

let allUsers = [];
let allFasyankes = [];
let filtered = [];
let filters = { search: '', role: '', status: '' };
let editTarget = null;

// Mock users — di production diambil dari table profiles via Supabase
const MOCK_USERS = [
  { id: 'u-001', email: 'admin.dinkes@simantri.id', full_name: 'Dr. Bambang Wijaya, M.Kes', role: 'dinkes', fasyankes_id: null, last_login: '2025-09-15T08:30:00Z', status: 'active' },
  { id: 'u-002', email: 'verifikator.dinkes@simantri.id', full_name: 'Dr. Endang Susilowati', role: 'dinkes', fasyankes_id: null, last_login: '2025-09-14T14:20:00Z', status: 'active' },
  { id: 'u-003', email: 'admin.rsud.soetomo@simantri.id', full_name: 'Budi Hartono, S.KM', role: 'fasyankes', fasyankes_id: 'f-001', last_login: '2025-09-15T06:15:00Z', status: 'active' },
  { id: 'u-004', email: 'admin.puskesmas.gundih@simantri.id', full_name: 'Ns. Rina Marlina, S.Kep', role: 'fasyankes', fasyankes_id: 'f-002', last_login: '2025-09-13T11:45:00Z', status: 'active' },
  { id: 'u-005', email: 'admin.klinik.sehat@simantri.id', full_name: 'Dr. Andi Saputra', role: 'fasyankes', fasyankes_id: 'f-003', last_login: '2025-09-10T09:00:00Z', status: 'active' },
  { id: 'u-006', email: 'admin.apotek.kimfar@simantri.id', full_name: 'Apt. Joko Susanto, M.Farm', role: 'fasyankes', fasyankes_id: 'f-004', last_login: '2025-09-12T13:30:00Z', status: 'disabled' },
  { id: 'u-007', email: 'budi.santoso@simantri.id', full_name: 'Dr. Budi Santoso, Sp.PD', role: 'nakes', fasyankes_id: 'f-001', last_login: '2025-09-15T07:00:00Z', status: 'active' },
  { id: 'u-008', email: 'siti.aminah@simantri.id', full_name: 'Dr. Siti Aminah', role: 'nakes', fasyankes_id: 'f-002', last_login: '2025-09-14T16:00:00Z', status: 'active' },
  { id: 'u-009', email: 'maya.sari@simantri.id', full_name: 'Dr. Maya Sari, Sp.OG', role: 'nakes', fasyankes_id: 'f-001', last_login: '2025-09-11T10:00:00Z', status: 'active' },
  { id: 'u-010', email: 'dewi.lestari@simantri.id', full_name: 'Bdn. Dewi Lestari, Amd.Keb', role: 'nakes', fasyankes_id: 'f-002', last_login: '2025-09-09T08:00:00Z', status: 'active' },
  { id: 'u-011', email: 'putri.anggraini@simantri.id', full_name: 'Dr. Putri Anggraini', role: 'nakes', fasyankes_id: 'f-003', last_login: null, status: 'disabled' },
  { id: 'u-012', email: 'yuni.astuti@simantri.id', full_name: 'Yuni Astuti, Amd.Keb', role: 'nakes', fasyankes_id: 'f-005', last_login: '2025-09-08T14:00:00Z', status: 'active' },
];

export async function initManajemenUser() {
  // Bind filters
  const searchInput = document.getElementById('user-search');
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      filters.search = e.target.value.trim();
      applyFilter();
    }, 250));
  }
  document.getElementById('user-filter-role')?.addEventListener('change', (e) => { filters.role = e.target.value; applyFilter(); });
  document.getElementById('user-filter-status')?.addEventListener('change', (e) => { filters.status = e.target.value; applyFilter(); });

  // Action buttons
  document.querySelector('[data-action="refresh"]')?.addEventListener('click', () => { toast('Memuat ulang data user...', 'info'); refresh(); });
  document.querySelector('[data-action="add-user"]')?.addEventListener('click', () => openModal(null));
  document.querySelector('[data-modal-close]')?.addEventListener('click', closeModal);

  // Load data
  allFasyankes = await loadFasyankes();
  await refresh();
  renderPermissionsMatrix();
}

async function refresh() {
  try {
    allUsers = isDemoMode ? [...MOCK_USERS] : await loadUsersFromSupabase();
    applyFilter();
    renderRoleStats();
  } catch (err) {
    console.error(err);
    toast('Gagal memuat data user: ' + err.message, 'error');
  }
}

async function loadUsersFromSupabase() {
  // const { supabase } = await import('../assets/js/supabase.js');
  // const { data, error } = await supabase.from('profiles').select('*').order('full_name', { ascending: true });
  // if (error) throw error;
  // return data ?? [];
  return [...MOCK_USERS]; // fallback
}

function renderRoleStats() {
  const c = document.getElementById('role-stats');
  if (!c) return;
  const dinkesCount = allUsers.filter((u) => u.role === 'dinkes').length;
  const fasyankesCount = allUsers.filter((u) => u.role === 'fasyankes').length;
  const nakesCount = allUsers.filter((u) => u.role === 'nakes').length;
  const cards = [
    { label: 'Admin Dinkes', value: dinkesCount, sub: 'Akses penuh seluruh sistem', color: 'teal', icon: 'shield' },
    { label: 'Admin Fasyankes', value: fasyankesCount, sub: 'Kelola data fasyankes terkait', color: 'lime', icon: 'hospital' },
    { label: 'Tenaga Kesehatan', value: nakesCount, sub: 'Lihat & ajukan perpanjangan', color: 'amber', icon: 'users' },
  ];
  c.innerHTML = cards.map((card) => {
    const iconSvg = iconPath(card.icon);
    const colorMap = {
      teal: { wrap: 'border-l-teal-500', icon: 'bg-teal-50 text-teal-600', text: 'text-teal-700' },
      lime: { wrap: 'border-l-lime-500', icon: 'bg-lime-50 text-lime-600', text: 'text-lime-700' },
      amber: { wrap: 'border-l-amber-500', icon: 'bg-amber-50 text-amber-600', text: 'text-amber-700' },
    };
    const s = colorMap[card.color];
    return `
      <div class="card p-5 border-l-4 ${s.wrap}">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl ${s.icon} flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="${iconSvg}"/></svg>
          </div>
          <div>
            <p class="text-xs font-semibold text-ink-500 uppercase tracking-wider">${escapeHtml(card.label)}</p>
            <p class="text-2xl font-extrabold ${s.text} tabular-nums">${card.value}</p>
            <p class="text-[11px] text-ink-500 mt-0.5">${escapeHtml(card.sub)}</p>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function iconPath(name) {
  const m = {
    shield: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    hospital: 'M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v3m4-3v3m4-3v3',
    users: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2a4 4 0 11-8 0 4 4 0 018 0zm6-3a3 3 0 11-6 0 3 3 0 016 0z',
  };
  return m[name] ?? m.users;
}

function applyFilter() {
  filtered = allUsers.filter((u) => {
    if (filters.role && u.role !== filters.role) return false;
    if (filters.status && u.status !== filters.status) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const hay = `${u.full_name} ${u.email}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  renderTable();
}

function renderTable() {
  const tbody = document.getElementById('user-tbody');
  if (!tbody) return;
  document.getElementById('user-total').textContent = allUsers.length;
  document.getElementById('user-showing').textContent = filtered.length;

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr><td colspan="7" class="text-center py-12">
        <div class="inline-flex flex-col items-center text-ink-500">
          <svg class="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          <p class="font-semibold">Tidak ada user</p>
          <p class="text-sm mt-1">Coba ubah kata kunci atau filter</p>
        </div>
      </td></tr>`;
    return;
  }

  const fasyankesMap = Object.fromEntries(allFasyankes.map((f) => [f.id, f.nama]));
  tbody.innerHTML = filtered.map((u, idx) => {
    const roleBadge = roleBadgeClass(u.role);
    const roleLabel = roleLabelText(u.role);
    const isActive = u.status === 'active';
    const lastLogin = u.last_login ? relativeFromNow(u.last_login) : 'Belum pernah';
    const fasyankes = u.fasyankes_id ? (fasyankesMap[u.fasyankes_id] ?? '—') : '—';
    return `
      <tr>
        <td class="text-ink-400 text-xs font-mono">${String(idx + 1).padStart(2, '0')}</td>
        <td>
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full ${avatarColor(u.full_name)} flex items-center justify-center text-white font-bold text-xs flex-shrink-0">${initials(u.full_name)}</div>
            <div class="min-w-0">
              <p class="font-semibold text-ink-800 truncate">${escapeHtml(u.full_name)}</p>
              <p class="text-xs text-ink-500 truncate">${escapeHtml(u.email)}</p>
            </div>
          </div>
        </td>
        <td><span class="${roleBadge}">${roleLabel}</span></td>
        <td class="text-xs text-ink-600">${escapeHtml(fasyankes)}</td>
        <td class="text-xs text-ink-500">${escapeHtml(lastLogin)}</td>
        <td>
          ${isActive
            ? `<span class="badge-teal !text-xs">Aktif</span>`
            : `<span class="badge-rose !text-xs">Nonaktif</span>`}
        </td>
        <td class="text-right">
          <div class="inline-flex items-center gap-1">
            <button data-action="edit" data-user-id="${u.id}" class="btn-ghost btn-sm !px-2" title="Edit" aria-label="Edit user">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button data-action="reset" data-user-id="${u.id}" class="btn-ghost btn-sm !px-2" title="Reset Password" aria-label="Reset password">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
            </button>
            <button data-action="toggle" data-user-id="${u.id}" class="btn-ghost btn-sm !px-2" title="${isActive ? 'Nonaktifkan' : 'Aktifkan'}" aria-label="Toggle status">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
            </button>
            <button data-action="delete" data-user-id="${u.id}" class="btn-ghost btn-sm !px-2 text-rose-600 hover:bg-rose-50" title="Hapus" aria-label="Hapus user">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Bind actions
  tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const u = allUsers.find((x) => x.id === btn.dataset.userId);
      if (u) openModal(u);
    });
  });
  tbody.querySelectorAll('[data-action="reset"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const u = allUsers.find((x) => x.id === btn.dataset.userId);
      if (u) {
        if (confirm(`Kirim email reset password ke ${u.email}?`)) {
          toast(`Email reset password dikirim ke ${u.email}`, 'success');
        }
      }
    });
  });
  tbody.querySelectorAll('[data-action="toggle"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const u = allUsers.find((x) => x.id === btn.dataset.userId);
      if (!u) return;
      u.status = u.status === 'active' ? 'disabled' : 'active';
      toast(`User ${u.full_name} ${u.status === 'active' ? 'diaktifkan' : 'dinonaktifkan'}`, 'success');
      renderTable();
      renderRoleStats();
    });
  });
  tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const u = allUsers.find((x) => x.id === btn.dataset.userId);
      if (!u) return;
      if (confirm(`Hapus user ${u.full_name}? Tindakan ini tidak dapat dibatalkan.`)) {
        allUsers = allUsers.filter((x) => x.id !== u.id);
        toast(`User ${u.full_name} dihapus`, 'success');
        applyFilter();
        renderRoleStats();
      }
    });
  });
}

function roleBadgeClass(role) {
  switch (role) {
    case 'dinkes': return 'badge-teal';
    case 'fasyankes': return 'badge-lime';
    case 'nakes': return 'badge-amber';
    default: return 'badge-ink';
  }
}

function roleLabelText(role) {
  switch (role) {
    case 'dinkes': return 'Dinkes';
    case 'fasyankes': return 'Fasyankes';
    case 'nakes': return 'Nakes';
    default: return role;
  }
}

function openModal(user) {
  editTarget = user;
  const modal = document.getElementById('user-modal');
  const content = document.getElementById('user-modal-content');
  if (!modal || !content) return;
  const isEdit = !!user;
  const profile = getProfile();
  const canManageFasyankes = isDinkes();

  const fasyankesOptions = allFasyankes.map((f) =>
    `<option value="${f.id}" ${user?.fasyankes_id === f.id ? 'selected' : ''}>${escapeHtml(f.nama)}</option>`
  ).join('');

  content.innerHTML = `
    <div class="p-6 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-t-xl">
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-bold">${isEdit ? 'Edit User' : 'Tambah User Baru'}</h3>
          <p class="text-teal-100 text-xs mt-0.5">${isEdit ? 'Perbarui informasi & role pengguna' : 'Daftarkan akun baru untuk mengakses SIMANTRI'}</p>
        </div>
        <button data-modal-close class="text-white/70 hover:text-white p-1" aria-label="Tutup">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
    <form id="user-form" class="p-6 space-y-4" novalidate>
      <div>
        <label class="label" for="form-email">Email <span class="text-rose-500">*</span></label>
        <input type="email" id="form-email" class="input" value="${escapeHtml(user?.email ?? '')}" placeholder="nama@example.com" required ${isEdit ? 'disabled' : ''} />
        <p class="text-[10px] text-ink-500 mt-1" data-error="email"></p>
      </div>
      <div>
        <label class="label" for="form-nama">Nama Lengkap <span class="text-rose-500">*</span></label>
        <input type="text" id="form-nama" class="input" value="${escapeHtml(user?.full_name ?? '')}" placeholder="Dr. Budi Santoso" required />
        <p class="text-[10px] text-ink-500 mt-1" data-error="nama"></p>
      </div>
      ${!isEdit ? `
        <div>
          <label class="label" for="form-password">Password <span class="text-rose-500">*</span></label>
          <input type="password" id="form-password" class="input" placeholder="Minimal 8 karakter" required minlength="8" />
          <p class="text-[10px] text-ink-500 mt-1">Minimal 8 karakter, kombinasi huruf &amp; angka disarankan.</p>
          <p class="text-[10px] text-rose-500 mt-1" data-error="password"></p>
        </div>
      ` : ''}
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="label" for="form-role">Role <span class="text-rose-500">*</span></label>
          <select id="form-role" class="select" required>
            <option value="">Pilih role...</option>
            <option value="dinkes" ${user?.role === 'dinkes' ? 'selected' : ''}>Dinkes</option>
            <option value="fasyankes" ${user?.role === 'fasyankes' ? 'selected' : ''}>Fasyankes</option>
            <option value="nakes" ${user?.role === 'nakes' ? 'selected' : ''}>Nakes</option>
          </select>
          <p class="text-[10px] text-ink-500 mt-1" data-error="role"></p>
        </div>
        <div id="form-fasyankes-wrap" class="${user?.role === 'dinkes' || !user?.role ? 'hidden' : ''}">
          <label class="label" for="form-fasyankes">Fasyankes <span class="text-rose-500">*</span></label>
          <select id="form-fasyankes" class="select">
            <option value="">Pilih fasyankes...</option>
            ${fasyankesOptions}
          </select>
          <p class="text-[10px] text-ink-500 mt-1">Wajib untuk role Fasyankes &amp; Nakes.</p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2 pt-4 border-t border-ink-100">
        <button type="button" data-modal-close class="btn-outline btn-sm">Batal</button>
        <button type="submit" class="btn-primary btn-sm ml-auto">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          ${isEdit ? 'Simpan Perubahan' : 'Daftarkan User'}
        </button>
      </div>
    </form>
  `;

  modal.classList.remove('hidden');
  content.querySelector('[data-modal-close]')?.addEventListener('click', closeModal);
  content.querySelector('#form-role')?.addEventListener('change', (e) => {
    const wrap = content.querySelector('#form-fasyankes-wrap');
    if (e.target.value === 'dinkes' || !e.target.value) wrap.classList.add('hidden');
    else wrap.classList.remove('hidden');
  });
  content.querySelector('#user-form')?.addEventListener('submit', handleSubmit);
}

function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.querySelector('#form-email').value.trim();
  const nama = form.querySelector('#form-nama').value.trim();
  const password = form.querySelector('#form-password')?.value ?? '';
  const role = form.querySelector('#form-role').value;
  const fasyankesId = form.querySelector('#form-fasyankes')?.value ?? '';

  // Reset errors
  form.querySelectorAll('[data-error]').forEach((el) => { el.textContent = ''; });
  form.querySelectorAll('.field-error').forEach((el) => el.classList.remove('field-error'));

  let hasError = false;
  const setError = (name, msg) => {
    const el = form.querySelector(`[data-error="${name}"]`);
    if (el) el.textContent = msg;
    const input = form.querySelector(`#form-${name}`);
    input?.classList.add('field-error');
    hasError = true;
  };

  // Email validation
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) setError('email', 'Email wajib diisi.');
  else if (!emailRe.test(email)) setError('email', 'Format email tidak valid.');

  // Nama validation
  if (!nama) setError('nama', 'Nama lengkap wajib diisi.');

  // Password validation (only for new user)
  if (!editTarget) {
    if (!password) setError('password', 'Password wajib diisi.');
    else if (password.length < 8) setError('password', 'Password minimal 8 karakter.');
  }

  // Role validation
  if (!role) setError('role', 'Role wajib dipilih.');
  else if ((role === 'fasyankes' || role === 'nakes') && !fasyankesId) {
    toast('Fasyankes wajib dipilih untuk role Fasyankes/Nakes', 'warning');
    hasError = true;
  }

  if (hasError) {
    toast('Periksa kembali isian form', 'error');
    return;
  }

  if (editTarget) {
    // Update existing
    editTarget.full_name = nama;
    editTarget.role = role;
    editTarget.fasyankes_id = role === 'dinkes' ? null : fasyankesId;
    toast(`Data user "${nama}" diperbarui`, 'success');
  } else {
    // Create new
    const newUser = {
      id: uid('u'),
      email,
      full_name: nama,
      role,
      fasyankes_id: role === 'dinkes' ? null : fasyankesId,
      last_login: null,
      status: 'active',
    };
    allUsers.unshift(newUser);
    toast(`User baru "${nama}" berhasil didaftarkan`, 'success');
  }
  closeModal();
  applyFilter();
  renderRoleStats();
}

function closeModal() {
  document.getElementById('user-modal')?.classList.add('hidden');
  editTarget = null;
}

function renderPermissionsMatrix() {
  const tbody = document.getElementById('permissions-tbody');
  if (!tbody) return;
  const rows = [
    { module: 'Dashboard Monitoring', dinkes: 'full', fasyankes: 'full', nakes: 'limited' },
    { module: 'Data Nakes (CRUD)', dinkes: 'full', fasyankes: 'full', nakes: 'view-self' },
    { module: 'Data Fasyankes (CRUD)', dinkes: 'full', fasyankes: 'view-self', nakes: 'none' },
    { module: 'Verifikasi STR/SIP', dinkes: 'full', fasyankes: 'submit', nakes: 'submit-self' },
    { module: 'Perpanjangan Dokumen', dinkes: 'review', fasyankes: 'submit', nakes: 'submit-self' },
    { module: 'Laporan & Rekap', dinkes: 'full', fasyankes: 'view-own', nakes: 'none' },
    { module: 'Manajemen User', dinkes: 'full', fasyankes: 'none', nakes: 'none' },
    { module: 'Pengaturan Sistem', dinkes: 'full', fasyankes: 'none', nakes: 'none' },
    { module: 'Audit Log', dinkes: 'full', fasyankes: 'view-own', nakes: 'none' },
  ];

  const labelMap = {
    'full': { text: 'Penuh', cls: 'badge-teal' },
    'limited': { text: 'Terbatas', cls: 'badge-amber' },
    'view-self': { text: 'Lihat Sendiri', cls: 'badge-ink' },
    'view-own': { text: 'Lihat Miliknya', cls: 'badge-ink' },
    'submit': { text: 'Ajukan', cls: 'badge-lime' },
    'submit-self': { text: 'Ajukan Sendiri', cls: 'badge-lime' },
    'review': { text: 'Review', cls: 'badge-teal' },
    'none': { text: 'Tidak Ada', cls: 'badge-rose' },
  };

  tbody.innerHTML = rows.map((r) => {
    const d = labelMap[r.dinkes];
    const f = labelMap[r.fasyankes];
    const n = labelMap[r.nakes];
    return `
      <tr>
        <td class="font-semibold text-ink-800">${escapeHtml(r.module)}</td>
        <td class="text-center"><span class="${d.cls} !text-xs">${d.text}</span></td>
        <td class="text-center"><span class="${f.cls} !text-xs">${f.text}</span></td>
        <td class="text-center"><span class="${n.cls} !text-xs">${n.text}</span></td>
      </tr>
    `;
  }).join('');
}
