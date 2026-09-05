// SIMANTRI — Pengaturan & Audit Log page logic
import { isDemoMode } from '../assets/js/supabase.js';
import { fmtDate, fmtDateLong, relativeFromNow, initials, avatarColor, escapeHtml, toast, debounce } from '../assets/js/utils.js';
import { getProfile, isDinkes } from '../assets/js/auth.js';

let auditLogs = [];
let filters = { from: '', to: '', user: '', action: '' };

// Mock audit log — di production diambil dari table audit_log via Supabase
const MOCK_AUDIT_LOGS = [
  { id: 'a-001', timestamp: '2025-09-15T08:30:00Z', user: 'admin.dinkes@simantri.id', user_name: 'Dr. Bambang Wijaya', action: 'LOGIN', entity: 'auth', detail: 'Login berhasil dari Chrome/Windows', ip: '103.10.51.22' },
  { id: 'a-002', timestamp: '2025-09-15T09:14:00Z', user: 'admin.dinkes@simantri.id', user_name: 'Dr. Bambang Wijaya', action: 'UPDATE', entity: 'tenaga_kesehatan', detail: 'Update data Dr. Budi Santoso — field: no_str, tgl_akhir_str', ip: '103.10.51.22' },
  { id: 'a-003', timestamp: '2025-09-15T10:02:00Z', user: 'verifikator.dinkes@simantri.id', user_name: 'Dr. Endang Susilowati', action: 'UPDATE', entity: 'praktik', detail: 'Verifikasi SIP/007/2023 — status: pending → diverifikasi', ip: '103.10.51.45' },
  { id: 'a-004', timestamp: '2025-09-14T14:20:00Z', user: 'verifikator.dinkes@simantri.id', user_name: 'Dr. Endang Susilowati', action: 'CREATE', entity: 'notifications', detail: 'Kirim notifikasi expired ke 4 nakes', ip: '103.10.51.45' },
  { id: 'a-005', timestamp: '2025-09-14T11:45:00Z', user: 'admin.puskesmas.gundih@simantri.id', user_name: 'Ns. Rina Marlina', action: 'CREATE', entity: 'tenaga_kesehatan', detail: 'Tambah nakes baru: Yuni Astuti, Amd.Keb', ip: '36.71.232.18' },
  { id: 'a-006', timestamp: '2025-09-13T16:30:00Z', user: 'admin.rsud.soetomo@simantri.id', user_name: 'Budi Hartono', action: 'DELETE', entity: 'praktik', detail: 'Hapus SIP/009/2022 (duplicate entry)', ip: '36.71.232.42' },
  { id: 'a-007', timestamp: '2025-09-13T09:00:00Z', user: 'admin.dinkes@simantri.id', user_name: 'Dr. Bambang Wijaya', action: 'UPDATE', entity: 'profiles', detail: 'Reset password user: Apt. Joko Susanto', ip: '103.10.51.22' },
  { id: 'a-008', timestamp: '2025-09-12T13:30:00Z', user: 'admin.apotek.kimfar@simantri.id', user_name: 'Apt. Joko Susanto', action: 'LOGIN', entity: 'auth', detail: 'Login gagal — password salah (3x)', ip: '36.71.232.55' },
];

export async function initPengaturan() {
  // Bind tabs
  document.getElementById('tab-settings')?.addEventListener('click', () => switchTab('settings'));
  document.getElementById('tab-audit')?.addEventListener('click', () => switchTab('audit'));

  // Bind actions
  document.querySelector('[data-action="refresh"]')?.addEventListener('click', () => {
    toast('Memuat ulang...', 'info');
    renderProfile();
    renderAuditLog();
  });
  document.querySelector('[data-action="edit-profile"]')?.addEventListener('click', () => toast('Form edit profil akan dibuka', 'info'));
  document.querySelector('[data-action="save-pref"]')?.addEventListener('click', savePreferences);
  document.querySelector('[data-action="save-system"]')?.addEventListener('click', saveSystemSettings);
  document.querySelector('[data-action="change-password"]')?.addEventListener('click', () => toast('Membuka form ubah password', 'info'));
  document.querySelector('[data-action="enable-2fa"]')?.addEventListener('click', () => toast('Setup 2FA akan dimulai (scan QR)', 'info'));
  document.querySelector('[data-action="view-sessions"]')?.addEventListener('click', () => toast('Memuat daftar sesi aktif...', 'info'));

  // Bind toggles (Dinkes-only)
  bindToggle('toggle-auto-disable');
  bindToggle('toggle-email');
  bindToggle('toggle-wa');

  // Bind audit filters
  document.getElementById('audit-from')?.addEventListener('change', (e) => { filters.from = e.target.value; renderAuditLog(); });
  document.getElementById('audit-to')?.addEventListener('change', (e) => { filters.to = e.target.value; renderAuditLog(); });
  document.getElementById('audit-user')?.addEventListener('input', debounce((e) => { filters.user = e.target.value.trim(); renderAuditLog(); }, 250));
  document.getElementById('audit-action')?.addEventListener('change', (e) => { filters.action = e.target.value; renderAuditLog(); });

  // Show/hide system settings for Dinkes
  if (isDinkes()) {
    document.getElementById('system-settings')?.classList.remove('hidden');
  }

  // Initial render
  renderProfile();
  auditLogs = isDemoMode ? [...MOCK_AUDIT_LOGS] : await loadAuditFromSupabase();
  renderAuditLog();
}

async function loadAuditFromSupabase() {
  // const { supabase } = await import('../assets/js/supabase.js');
  // const { data, error } = await supabase.from('audit_log').select('*').order('timestamp', { ascending: false }).limit(200);
  // if (error) throw error;
  // return data ?? [];
  return [...MOCK_AUDIT_LOGS];
}

function switchTab(tab) {
  const settings = document.getElementById('tab-settings');
  const audit = document.getElementById('tab-audit');
  const panelSettings = document.getElementById('panel-settings');
  const panelAudit = document.getElementById('panel-audit');

  if (tab === 'settings') {
    settings?.classList.add('bg-teal-600', 'text-white');
    settings?.classList.remove('text-ink-600', 'hover:bg-ink-50');
    audit?.classList.remove('bg-teal-600', 'text-white');
    audit?.classList.add('text-ink-600', 'hover:bg-ink-50');
    panelSettings?.classList.remove('hidden');
    panelAudit?.classList.add('hidden');
  } else {
    audit?.classList.add('bg-teal-600', 'text-white');
    audit?.classList.remove('text-ink-600', 'hover:bg-ink-50');
    settings?.classList.remove('bg-teal-600', 'text-white');
    settings?.classList.add('text-ink-600', 'hover:bg-ink-50');
    panelAudit?.classList.remove('hidden');
    panelSettings?.classList.add('hidden');
  }
}

function renderProfile() {
  const profile = getProfile();
  if (!profile) return;
  const avatarEl = document.getElementById('profile-avatar');
  const nameEl = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');
  const roleEl = document.getElementById('profile-role');
  const fasyankesEl = document.getElementById('profile-fasyankes');

  if (avatarEl) {
    avatarEl.className = `w-20 h-20 rounded-2xl ${avatarColor(profile.full_name ?? profile.email ?? '')} text-white flex items-center justify-center text-2xl font-bold flex-shrink-0`;
    avatarEl.textContent = initials(profile.full_name ?? profile.email ?? 'U');
  }
  if (nameEl) nameEl.textContent = profile.full_name ?? 'Pengguna';
  if (emailEl) emailEl.textContent = profile.email ?? '—';
  if (roleEl) {
    const label = roleLabelText(profile.role);
    roleEl.textContent = label;
  }
  if (fasyankesEl) {
    if (profile.fasyankes_id) {
      fasyankesEl.textContent = 'Fasyankes terdaftar';
      fasyankesEl.classList.remove('hidden');
    } else {
      fasyankesEl.textContent = profile.role === 'dinkes' ? 'Akses seluruh wilayah' : '—';
    }
  }
}

function roleLabelText(role) {
  switch (role) {
    case 'dinkes': return 'Admin Dinkes';
    case 'fasyankes': return 'Admin Fasyankes';
    case 'nakes': return 'Tenaga Kesehatan';
    default: return role ?? '—';
  }
}

function savePreferences() {
  const prefs = {
    notifStr90: document.getElementById('pref-str-90')?.checked ?? false,
    notifSip90: document.getElementById('pref-sip-90')?.checked ?? false,
    notifH30: document.getElementById('pref-h-30')?.checked ?? false,
    digest: document.querySelector('input[name="pref-digest"]:checked')?.value ?? 'off',
  };
  // In production: persist via supabase.from('profiles').update({ preferences: prefs })
  toast('Preferensi notifikasi tersimpan', 'success');
  console.log('[SIMANTRI] Saved preferences:', prefs);
}

function saveSystemSettings() {
  const threshold = document.getElementById('sys-threshold')?.value;
  const autoDisable = document.getElementById('toggle-auto-disable')?.getAttribute('aria-checked') === 'true';
  const email = document.getElementById('toggle-email')?.getAttribute('aria-checked') === 'true';
  const wa = document.getElementById('toggle-wa')?.getAttribute('aria-checked') === 'true';
  toast(`Pengaturan sistem tersimpan (threshold ${threshold} hari)`, 'success');
  console.log('[SIMANTRI] Saved system settings:', { threshold, autoDisable, email, wa });
}

function bindToggle(id) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.addEventListener('click', () => {
    const checked = btn.getAttribute('aria-checked') === 'true';
    const next = !checked;
    btn.setAttribute('aria-checked', String(next));
    if (next) {
      btn.classList.remove('bg-ink-300');
      btn.classList.add('bg-teal-600');
      btn.querySelector('span').classList.remove('translate-x-1');
      btn.querySelector('span').classList.add('translate-x-6');
      btn.parentElement.querySelector('span.text-sm').textContent = 'Aktif';
    } else {
      btn.classList.add('bg-ink-300');
      btn.classList.remove('bg-teal-600');
      btn.querySelector('span').classList.add('translate-x-1');
      btn.querySelector('span').classList.remove('translate-x-6');
      btn.parentElement.querySelector('span.text-sm').textContent = 'Nonaktif';
    }
  });
}

function renderAuditLog() {
  const tbody = document.getElementById('audit-tbody');
  const countEl = document.getElementById('audit-count');
  if (!tbody) return;

  let filtered = auditLogs.filter((log) => {
    if (filters.from) {
      const from = new Date(filters.from);
      from.setHours(0, 0, 0, 0);
      if (new Date(log.timestamp) < from) return false;
    }
    if (filters.to) {
      const to = new Date(filters.to);
      to.setHours(23, 59, 59, 999);
      if (new Date(log.timestamp) > to) return false;
    }
    if (filters.action && log.action !== filters.action) return false;
    if (filters.user) {
      const q = filters.user.toLowerCase();
      const hay = `${log.user} ${log.user_name ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  countEl.textContent = filtered.length;

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr><td colspan="6" class="text-center py-12">
        <div class="inline-flex flex-col items-center text-ink-500">
          <svg class="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          <p class="font-semibold">Tidak ada entri audit</p>
          <p class="text-sm mt-1">Coba ubah filter tanggal atau user</p>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((log) => {
    const actionBadge = actionBadgeClass(log.action);
    return `
      <tr>
        <td>
          <p class="text-xs font-semibold text-ink-800">${escapeHtml(fmtDate(log.timestamp, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }))}</p>
          <p class="text-[10px] text-ink-500">${escapeHtml(relativeFromNow(log.timestamp))}</p>
        </td>
        <td>
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-full ${avatarColor(log.user_name ?? log.user)} flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">${initials(log.user_name ?? log.user)}</div>
            <div class="min-w-0">
              <p class="text-xs font-semibold text-ink-800 truncate">${escapeHtml(log.user_name ?? log.user)}</p>
              <p class="text-[10px] text-ink-500 truncate">${escapeHtml(log.user)}</p>
            </div>
          </div>
        </td>
        <td><span class="${actionBadge} !text-xs">${escapeHtml(log.action)}</span></td>
        <td><code class="text-xs bg-ink-100 px-1.5 py-0.5 rounded">${escapeHtml(log.entity)}</code></td>
        <td class="text-xs text-ink-600">${escapeHtml(log.detail)}</td>
        <td class="font-mono text-xs text-ink-500">${escapeHtml(log.ip)}</td>
      </tr>
    `;
  }).join('');
}

function actionBadgeClass(action) {
  switch (action) {
    case 'CREATE': return 'badge-teal';
    case 'UPDATE': return 'badge-amber';
    case 'DELETE': return 'badge-rose';
    case 'LOGIN': return 'badge-lime';
    case 'LOGOUT': return 'badge-ink';
    default: return 'badge-ink';
  }
}
