/* =========================================================
 * SIMANTRI — app.js
 * Router hash + Auth multi-role + CRUD live Supabase
 * ---------------------------------------------------------
 * Semua data diambil LIVE dari Supabase (tanpa mock data,
 * tanpa localStorage untuk data). Role: admin / verifikator /
 * operator. Keamanan ditegakkan RLS di sisi database.
 * ========================================================= */

import { supabase, SUPABASE_TERKONFIGURASI } from './supabase.js?v=1.2.0';

/* =========================================================
 * 1. KONSTANTA & STATE
 * ========================================================= */

const KECAMATAN_SAMARINDA = [
  'Samarinda Ulu', 'Samarinda Kota', 'Samarinda Ilir', 'Samarinda Tengah',
  'Samarinda Utara', 'Samarinda Seberang', 'Samarinda Induk', 'Loa Janan Ilir',
  'Palaran', 'Muara Jawa',
];

const PROFESI_TK = [
  'Perawat', 'Bidan', 'Apoteker', 'Asisten Apoteker', 'Ahli Gizi', 'Nutrisionis',
  'Fisioterapis', 'Tenaga Teknis Kefarmasian', 'Teknologi Laboratorium Medik (ATLM)',
  'Teknisi Radiologi', 'Sanitarian', 'Lainnya',
];

const JENIS_FASKES = ['RS', 'Puskesmas', 'Klinik', 'Lainnya'];
const JENIS_PRAKTIK = ['Praktik Dokter', 'Praktik Dokter Gigi', 'Praktik Bidan', 'Praktik Perawat', 'Praktik Fisioterapi', 'Lainnya'];

const state = {
  user: null,       // objek user dari Supabase Auth
  profile: null,    // baris profiles { id, email, nama, role }
  route: '',
  map: null,        // instance Leaflet aktif
  chart: null,      // instance Chart.js aktif
};

const ROLE_BADGE = {
  admin: 'bg-teal-100 text-teal-700 ring-1 ring-teal-200',
  verifikator: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  operator: 'bg-sky-100 text-sky-700 ring-1 ring-sky-200',
};

const BADGES = {
  'aktif': 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  'nonaktif': 'bg-slate-200 text-slate-600 ring-1 ring-slate-300',
  'pending': 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  'disetujui': 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  'ditolak': 'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
};

/* =========================================================
 * 2. IKON SVG INLINE (stroke, 24x24)
 * ========================================================= */

const ICONS = {
  dashboard: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
  petunjuk: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5V5.5"/><path d="M9 8h7M9 11.5h5"/>',
  peta: '<path d="M12 21s-6.5-5.4-6.5-10a6.5 6.5 0 0 1 13 0C18.5 15.6 12 21 12 21z"/><circle cx="12" cy="10.6" r="2.4"/>',
  expired: '<path d="M6 9.5a6 6 0 0 1 12 0c0 4 1.6 5.4 2 6H4c.4-.6 2-2 2-6z"/><path d="M10 19a2.2 2.2 0 0 0 4 0"/>',
  medis: '<circle cx="12" cy="7.5" r="3.5"/><path d="M5 20c.9-3.7 3.7-5.5 7-5.5s6.1 1.8 7 5.5"/><path d="M19 4.5v4M17 6.5h4"/>',
  kes: '<path d="M12 20.5C7 16.5 4 13.6 4 10.2 4 7.9 5.9 6 8.2 6c1.5 0 2.9.8 3.8 2 .9-1.2 2.3-2 3.8-2C18.1 6 20 7.9 20 10.2c0 3.4-3 6.3-8 10.3z"/><path d="M7.5 12h3l1.2-2.4 1.6 4 1.2-1.6h2"/>',
  faskes: '<rect x="4.5" y="4" width="15" height="16" rx="2"/><path d="M12 8.5v6M9 11.5h6"/><path d="M9.5 20v-2.5h5V20"/>',
  praktik: '<path d="M4.5 10.5 12 4l7.5 6.5"/><path d="M6.5 9.5V20h11V9.5"/><path d="M12 12v4.5M9.75 14.25h4.5"/>',
  verif: '<path d="M12 3l7 2.8v5.4c0 4.5-3 7.9-7 9.3-4-1.4-7-4.8-7-9.3V5.8z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  cek: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.4-4.4"/>',
  monev: '<rect x="5" y="4.5" width="14" height="16" rx="2"/><path d="M9 3.5h6v3H9z"/><path d="M8.5 11h7M8.5 14.5h7M8.5 18h4"/>',
  users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19.5c.7-3 2.9-4.7 5.5-4.7s4.8 1.7 5.5 4.7"/><circle cx="16.8" cy="9.5" r="2.5"/><path d="M16.5 14.8c2.2.2 3.7 1.7 4.2 4.2"/>',
  login: '<path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14"/><path d="m10 8 4 4-4 4M14 12H4"/>',
  logout: '<path d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10"/><path d="m15 8 4 4-4 4M19 12H9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  pencil: '<path d="m14.5 5.5 4 4L8 20H4v-4z"/><path d="m12.5 7.5 4 4"/>',
  trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M7 7l.8 12.5A1.5 1.5 0 0 0 9.3 21h5.4a1.5 1.5 0 0 0 1.5-1.5L17 7"/><path d="M10 11v6M14 11v6"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3.5v4M16 3.5v4"/>',
  image: '<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m5.5 17.5 4.5-4 3.5 3 2.5-2 3 3"/>',
  alert: '<path d="M12 4 21 19.5H3z"/><path d="M12 10v4M12 16.8v.4"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.4-4.4"/>',
  shield: '<path d="M12 3l7 2.8v5.4c0 4.5-3 7.9-7 9.3-4-1.4-7-4.8-7-9.3V5.8z"/>',
  check: '<path d="m5 13 4.5 4.5L19 7"/>',
  upload: '<path d="M12 16V5M7.5 9.5 12 5l4.5 4.5"/><path d="M4.5 16v2.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V16"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 7.8v.4"/>',
  save: '<rect x="4.5" y="4.5" width="15" height="15" rx="2.5"/><path d="M8 4.5V9h7V4.5"/><path d="M8 20v-6h8v6"/>',
  send: '<path d="M20.5 3.5 10 14"/><path d="M20.5 3.5 14 20.5l-4-6.5-6.5-4z"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  undo: '<path d="M4 9h10a6 6 0 0 1 0 12h-3"/><path d="M8 5 4 9l4 4"/>',
};

function icon(name, cls = 'w-5 h-5') {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

/* =========================================================
 * 3. UTILITAS
 * ========================================================= */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

const cap = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');

function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(String(s).length === 10 ? `${s}T00:00:00` : s);
  return isNaN(d) ? s : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(s) {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d) ? s : d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/** Selisih hari (positif = belum berakhir) sejak hari ini ke tanggal YYYY-MM-DD */
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const d = new Date(`${dateStr}T00:00:00`);
  if (isNaN(d)) return null;
  return Math.round((d.getTime() - t.getTime()) / 86400000);
}

const todayISO = () => {
  const t = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`;
};

function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

const trunc = (s, n = 60) => {
  const t = String(s ?? '');
  return t.length > n ? esc(t.slice(0, n)) + '…' : esc(t);
};

function badge(v) {
  const c = BADGES[v] || 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
  return `<span class="badge ${c}">${esc(cap(v || '-'))}</span>`;
}

/* ---------- Toast ---------- */
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const ic = type === 'success' ? 'check' : type === 'error' ? 'alert' : 'info';
  el.innerHTML = `${icon(ic, 'w-4 h-4 mt-0.5 flex-none')}<span>${esc(msg)}</span>`;
  $('#toast-root').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 350); }, 3800);
}

/* ---------- Pesan error ramah pengguna ---------- */
function friendlyError(err) {
  const m = String(err?.message || err || 'Terjadi kesalahan');
  if (m.includes('row-level security')) return 'Akses ditolak: role Anda tidak memiliki izin untuk aksi ini (RLS).';
  if (m.includes('Failed to fetch') || m.includes('NetworkError')) return 'Gagal terhubung ke Supabase. Periksa koneksi internet / konfigurasi.';
  if (m.includes('Invalid login credentials')) return 'Email atau kata sandi salah.';
  if (m.includes('belum dikonfigurasi')) return 'Supabase belum dikonfigurasi — isi js/config.js terlebih dahulu.';
  if (m.includes('duplicate key')) return 'Data sudah ada (duplikat).';
  if (m.includes('Password should be at least')) return 'Kata sandi minimal 6 karakter.';
  if (m.includes('User already registered')) return 'Email sudah terdaftar. Gunakan email lain.';
  if (m.includes('unable to find valid credential')) return 'Email atau kata sandi salah.';
  return m;
}

/* ---------- Blok HTML bantu ---------- */
function setupNotice() {
  return `<div class="card p-5 border-amber-300 bg-amber-50 mb-4">
    <div class="flex gap-3 items-start">
      ${icon('alert', 'w-5 h-5 text-amber-500 mt-0.5 flex-none')}
      <div class="text-sm text-amber-900">
        <p class="font-bold mb-1">Supabase belum dikonfigurasi</p>
        <p class="leading-relaxed">Isi <code class="bg-amber-100 rounded px-1.5 py-0.5 text-[.78rem]">SUPABASE_URL</code> dan
        <code class="bg-amber-100 rounded px-1.5 py-0.5 text-[.78rem]">SUPABASE_ANON_KEY</code> pada berkas <b>js/config.js</b>,
        lalu jalankan <b>sql/schema.sql</b> di SQL Editor Supabase.
        Lihat halaman <a class="underline font-bold" href="#petunjuk">Petunjuk Penggunaan</a>.</p>
      </div>
    </div></div>`;
}

function errorBlock(e) {
  if (!SUPABASE_TERKONFIGURASI) return setupNotice();
  return `<div class="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-700 flex gap-2.5 items-start">
    ${icon('alert', 'w-4 h-4 mt-0.5 flex-none')}
    <div><p class="font-bold mb-0.5">Gagal memuat data</p><p>${esc(friendlyError(e))}</p></div></div>`;
}

function emptyState(msg) {
  return `<div class="py-10 text-center">
    <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-300 grid place-items-center mx-auto mb-2">${icon('search', 'w-6 h-6')}</div>
    <p class="text-xs text-slate-400">${msg}</p></div>`;
}

function skeletonRows(n = 5) {
  return `<div class="space-y-2">${Array(n).fill('<div class="skeleton h-10"></div>').join('')}</div>`;
}

/* ---------- Data helper (live dari Supabase) ---------- */
async function fetchRows(table, opts = {}) {
  if (!SUPABASE_TERKONFIGURASI) throw new Error('Supabase belum dikonfigurasi');
  let q = supabase.from(table).select(opts.select || '*');
  if (opts.eq) for (const [c, v] of Object.entries(opts.eq)) q = q.eq(c, v);
  if (opts.search && opts.searchCols?.length) {
    const safe = String(opts.search).replace(/[,()%]/g, ' ').trim();
    if (safe) q = q.or(opts.searchCols.map((c) => `${c}.ilike.%${safe}%`).join(','));
  }
  q = q.order(opts.orderBy || 'created_at', { ascending: !!opts.asc });
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

const countRows = async (table, where = null) => {
  if (!SUPABASE_TERKONFIGURASI) return 0;
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  if (where) for (const [c, op, v] of where) q = q[`${op}`](c, v);
  const { count, error } = await q;
  if (error) throw error;
  return count || 0;
};

/* =========================================================
 * 4. SISTEM MODAL & KONFIRMASI
 * ========================================================= */

function openModal({ title, body, footer = '', size = 'md', onOpen = null }) {
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  const root = $('#modal-root');
  root.innerHTML = `
    <div class="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center sm:p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] modal-backdrop-anim" data-close="1"></div>
      <div class="modal-card relative w-full ${sizes[size] || sizes.md} bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92vh]">
        <div class="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 flex-none">
          <h3 class="font-extrabold text-slate-800 text-[.95rem] leading-snug">${title}</h3>
          <button class="icon-btn" data-close="1" aria-label="Tutup">${icon('x', 'w-4 h-4')}</button>
        </div>
        <div class="overflow-y-auto px-5 py-4 text-sm" id="modal-body">${body}</div>
        ${footer ? `<div class="px-5 py-3.5 border-t border-slate-100 bg-slate-50/80 rounded-b-2xl flex flex-wrap justify-end gap-2 flex-none">${footer}</div>` : ''}
      </div>
    </div>`;
  root.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeModal));
  document.body.style.overflow = 'hidden';
  if (onOpen) onOpen(root);
}

function closeModal() {
  $('#modal-root').innerHTML = '';
  document.body.style.overflow = '';
}

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

function confirmDialog({ title = 'Konfirmasi', message, danger = true, onYes }) {
  openModal({
    title, size: 'sm',
    body: `<div class="flex gap-3 items-start">
        <div class="w-10 h-10 rounded-full ${danger ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'} grid place-items-center flex-none">${icon('alert', 'w-5 h-5')}</div>
        <p class="text-slate-600 leading-relaxed">${message}</p></div>`,
    footer: `<button class="btn btn-ghost" data-close="1">Batal</button>
             <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="btn-yes">Ya, Lanjutkan</button>`,
    onOpen: (root) => root.querySelector('#btn-yes').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true; btn.textContent = 'Memproses…';
      try { await onYes(); closeModal(); }
      catch (err) { toast(friendlyError(err), 'error'); btn.disabled = false; btn.textContent = 'Ya, Lanjutkan'; }
    }),
  });
}

/* =========================================================
 * 5. AUTH MULTI-USER (Supabase Auth)
 * ========================================================= */

const isAdmin = () => state.profile?.role === 'admin';
const isVerifikator = () => state.profile?.role === 'verifikator';
const isOperator = () => state.profile?.role === 'operator';
const canInput = () => isAdmin() || isOperator();
const canVerify = () => isAdmin() || isVerifikator();

async function loadProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) { console.warn('loadProfile:', error.message); return null; }
  return data;
}

function renderTopbarUser() {
  const box = $('#topbar-user');
  if (state.user && state.profile) {
    const nama = state.profile.nama || state.user.email || 'Pengguna';
    box.innerHTML = `
      <div class="hidden md:block text-right leading-tight">
        <p class="text-xs font-bold text-slate-700">${esc(nama)}</p>
        <span class="text-[.62rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${ROLE_BADGE[state.profile.role] || ''}">${esc(state.profile.role)}</span>
      </div>
      <div class="w-9 h-9 rounded-full bg-teal-600 text-white grid place-items-center text-sm font-extrabold uppercase" title="${esc(state.user.email || '')}">${esc(nama.slice(0, 1))}</div>
      <button id="btn-logout" class="btn btn-ghost !px-2.5" title="Keluar">${icon('logout', 'w-4 h-4')}<span class="hidden sm:inline">Keluar</span></button>`;
    $('#btn-logout').addEventListener('click', doLogout);
  } else {
    box.innerHTML = `<button id="btn-login" class="btn btn-primary">${icon('login', 'w-4 h-4')} Masuk</button>`;
    $('#btn-login')?.addEventListener('click', openLoginModal);
  }
}

function openLoginModal() {
  openModal({
    title: 'Masuk SIMANTRI', size: 'sm',
    body: `
      <div class="text-center mb-4">
        <img src="assets/logo.svg" alt="Logo SIMANTRI" class="w-14 h-14 mx-auto mb-2">
        <p class="text-xs text-slate-500 leading-relaxed">Akun resmi Dinas Kesehatan Kota Samarinda.<br>Hubungi admin untuk mendapatkan akses.</p>
      </div>
      <form id="login-form" class="space-y-3" novalidate>
        <div><label class="lbl" for="login-email">Email</label>
          <input id="login-email" type="email" class="input" required placeholder="nama@dinkes.go.id" autocomplete="username"></div>
        <div><label class="lbl" for="login-pass">Kata Sandi</label>
          <input id="login-pass" type="password" class="input" required placeholder="••••••••" autocomplete="current-password"></div>
        <p id="login-err" class="hidden text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2"></p>
        <button class="btn btn-primary w-full !py-2.5" type="submit">${icon('login', 'w-4 h-4')} Masuk</button>
      </form>`,
    onOpen: (root) => {
      root.querySelector('#login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = root.querySelector('#login-err');
        err.classList.add('hidden');
        const btn = e.target.querySelector('button[type=submit]');
        btn.disabled = true; btn.textContent = 'Memproses…';
        const { error } = await supabase.auth.signInWithPassword({
          email: root.querySelector('#login-email').value.trim(),
          password: root.querySelector('#login-pass').value,
        });
        btn.disabled = false; btn.innerHTML = `${icon('login', 'w-4 h-4')} Masuk`;
        if (error) { err.textContent = friendlyError(error); err.classList.remove('hidden'); return; }
        closeModal();
        toast('Berhasil masuk. Selamat datang di SIMANTRI!');
      });
    },
  });
}

async function doLogout() {
  try { await supabase.auth.signOut(); } catch (e) { console.warn(e); }
  toast('Anda telah keluar.', 'info');
}

/** Sinkronisasi state auth + rebuild UI (nav, topbar, guard) */
async function refreshAuth(session) {
  state.user = session?.user ?? null;
  state.profile = state.user ? await loadProfile(state.user.id) : null;
  buildNav();
  renderTopbarUser();
  if (!state.user && state.route) router(); // re-guard halaman terproteksi
}

/* =========================================================
 * 6. NAVIGASI SIDEBAR (4 BAGIAN)
 * ========================================================= */

const NAV_SECTIONS = [
  {
    label: 'Bagian 1 — Overview',
    items: [
      { id: 'beranda', label: 'Dashboard', icon: 'dashboard' },
      { id: 'petunjuk', label: 'Petunjuk Penggunaan', icon: 'petunjuk' },
      { id: 'peta', label: 'Peta Sebaran Praktik', icon: 'peta' },
      { id: 'expired', label: 'Notifikasi Expired', icon: 'expired' },
    ],
  },
  {
    label: 'Bagian 2 — Manajemen Data',
    items: [
      { id: 'tenaga-medis', label: 'Data Tenaga Medis', icon: 'medis' },
      { id: 'tenaga-kesehatan', label: 'Data Tenaga Kesehatan', icon: 'kes' },
      { id: 'fasyankes', label: 'Data Fasyankes', icon: 'faskes' },
      { id: 'praktik-mandiri', label: 'Data Praktik Mandiri', icon: 'praktik' },
    ],
  },
  {
    label: 'Bagian 3 — Perizinan',
    items: [
      { id: 'verifikasi-praktik', label: 'Verifikasi Praktik', icon: 'verif' },
      { id: 'verifikasi-faskes', label: 'Verifikasi Faskes', icon: 'shield' },
      { id: 'cek-verifikasi', label: 'Cek Hasil Verifikasi', icon: 'cek' },
      { id: 'monev', label: 'Monev Izin', icon: 'monev' },
    ],
  },
  {
    label: 'Bagian 4 — Manajemen User',
    adminOnly: true,
    items: [
      { id: 'pengguna', label: 'Kelola Pengguna', icon: 'users' },
    ],
  },
];

function buildNav() {
  const nav = $('#sidebar-nav');
  let html = '';
  for (const sec of NAV_SECTIONS) {
    if (sec.adminOnly && !isAdmin()) continue; // Bagian 4 hanya untuk admin login
    html += `<div class="nav-section"><p class="nav-section-title">${esc(sec.label)}</p>`;
    for (const it of sec.items) {
      html += `<a class="nav-link" data-route="${it.id}" href="#${it.id}">${icon(it.icon)}<span>${esc(it.label)}</span></a>`;
    }
    html += `</div>`;
  }
  nav.innerHTML = html;
}

/* =========================================================
 * 7. ROUTER HASH (#beranda, #peta, #tenaga-medis, dst.)
 * ========================================================= */

function forbiddenCard() {
  return `<div class="card p-8 text-center max-w-md mx-auto mt-10">
    <div class="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 grid place-items-center mx-auto mb-3">${icon('shield', 'w-7 h-7')}</div>
    <h3 class="font-extrabold text-slate-800 mb-1">Akses Ditolak</h3>
    <p class="text-sm text-slate-500 leading-relaxed">Halaman ini hanya untuk <b>Admin</b>. Masuk dengan akun admin untuk mengelola pengguna.</p>
    <a href="#beranda" class="btn btn-soft mt-4">Kembali ke Dashboard</a></div>`;
}

function notFoundCard() {
  return `<div class="card p-8 text-center max-w-md mx-auto mt-10">
    <div class="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 grid place-items-center mx-auto mb-3">${icon('peta', 'w-7 h-7')}</div>
    <h3 class="font-extrabold text-slate-800 mb-1">Halaman Tidak Ditemukan</h3>
    <p class="text-sm text-slate-500">Alamat <code class="bg-slate-100 rounded px-1.5">${esc(location.hash || '#')}</code> tidak dikenali SIMANTRI.</p>
    <a href="#beranda" class="btn btn-soft mt-4">Kembali ke Dashboard</a></div>`;
}

function router() {
  const id = (location.hash || '#beranda').replace('#', '').replace(/^\/+/, '');
  const r = ROUTES[id];

  if (!r) {
    state.route = '';
    $$('#sidebar-nav .nav-link').forEach((a) => a.classList.remove('active'));
    $('#page-title').textContent = 'Tidak Ditemukan';
    $('#page-sub').textContent = '';
    $('#page-content').innerHTML = notFoundCard();
    return;
  }
  if (r.adminOnly && !isAdmin()) {
    state.route = id;
    $('#page-title').textContent = r.t;
    $('#page-sub').textContent = r.s || '';
    $('#page-content').innerHTML = forbiddenCard();
    return;
  }

  state.route = id;
  $$('#sidebar-nav .nav-link').forEach((a) => a.classList.toggle('active', a.dataset.route === id));
  $('#page-title').textContent = r.t;
  $('#page-sub').textContent = r.s || '';
  document.title = `${r.t} • SIMANTRI`;

  // Bersihkan instance peta/grafik sebelumnya
  if (state.chart) { state.chart.destroy(); state.chart = null; }
  if (state.map) { state.map.remove(); state.map = null; }

  // Tutup sidebar mobile
  $('#sidebar').classList.remove('open');
  $('#sidebar-overlay').classList.remove('show');

  r.render();
  window.scrollTo({ top: 0 });
}

function bindShell() {
  $('#btn-menu').addEventListener('click', () => {
    $('#sidebar').classList.add('open');
    $('#sidebar-overlay').classList.add('show');
  });
  const close = () => {
    $('#sidebar').classList.remove('open');
    $('#sidebar-overlay').classList.remove('show');
  };
  $('#sidebar-close').addEventListener('click', close);
  $('#sidebar-overlay').addEventListener('click', close);
}

/* =========================================================
 * 8. HALAMAN: DASHBOARD
 * ========================================================= */

const STAT_CARDS = [
  { id: 'tenaga-medis', label: 'Tenaga Medis', icon: 'medis', color: 'bg-teal-50 text-teal-600', table: 'tenaga_medis' },
  { id: 'tenaga-kesehatan', label: 'Tenaga Kesehatan', icon: 'kes', color: 'bg-sky-50 text-sky-600', table: 'tenaga_kesehatan' },
  { id: 'fasyankes', label: 'Fasyankes', icon: 'faskes', color: 'bg-indigo-50 text-indigo-600', table: 'fasyankes' },
  { id: 'praktik-mandiri', label: 'Praktik Mandiri', icon: 'praktik', color: 'bg-amber-50 text-amber-600', table: 'praktik_mandiri' },
  { id: 'izin-expired', label: 'Izin Expired', icon: 'expired', color: 'bg-rose-50 text-rose-600', special: true },
];

const STAT_SRC = {
  'tenaga-medis': {
    title: 'Data Tenaga Medis', table: 'tenaga_medis',
    headers: ['Nama', 'Spesialisasi', 'Tempat Praktik', 'Status'],
    map: (r) => [esc(r.nama_lengkap), esc(r.spesialisasi || '—'), esc(r.tempat_praktik || '—'), badge(r.status)],
  },
  'tenaga-kesehatan': {
    title: 'Data Tenaga Kesehatan', table: 'tenaga_kesehatan',
    headers: ['Nama', 'Profesi', 'Tempat Praktik', 'Status'],
    map: (r) => [esc(r.nama_lengkap), esc(r.profesi || '—'), esc(r.tempat_praktik || '—'), badge(r.status)],
  },
  'fasyankes': {
    title: 'Data Fasyankes', table: 'fasyankes',
    headers: ['Nama Fasyankes', 'Jenis', 'Kecamatan', 'Verifikasi'],
    map: (r) => [esc(r.nama_fasyankes), esc(r.jenis || '—'), esc(r.kecamatan || '—'), badge(r.status_verifikasi)],
  },
  'praktik-mandiri': {
    title: 'Data Praktik Mandiri', table: 'praktik_mandiri',
    headers: ['Nama Praktik', 'Pemilik', 'Kecamatan', 'Verifikasi'],
    map: (r) => [esc(r.nama_praktik), esc(r.pemilik || '—'), esc(r.kecamatan || '—'), badge(r.status_verifikasi)],
  },
  'izin-expired': {
    title: 'SIP/STR Expired & Menuju H-30', special: true,
    headers: ['Nama', 'Sumber', 'Tempat Praktik', 'Masa Berlaku', 'Sisa Waktu'],
    map: (r) => [esc(r.nama_lengkap), esc(r._sumber), esc(r.tempat_praktik || '—'), fmtDate(r.masa_berlaku_sip), sisaBadge(r._d, r._kat)],
  },
};

function miniTable(headers, cellsRows, emptyMsg) {
  if (!cellsRows.length) return emptyState(emptyMsg);
  return `<div class="table-wrap"><table class="sim-table">
    <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${cellsRows.map((cells) => `<tr>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>
  <p class="text-[.68rem] text-slate-400 mt-2">Menampilkan ${cellsRows.length} data &bull; live dari Supabase</p>`;
}

async function openStatModal(id) {
  const src = STAT_SRC[id];
  if (!src) return;
  openModal({ title: src.title, size: 'xl', body: '<div class="skeleton h-44"></div>' });
  try {
    let rows;
    if (src.special) {
      rows = (await loadExpiredRows()).filter((x) => x._kat !== 'hijau');
    } else {
      rows = await fetchRows(src.table, { limit: 300 });
    }
    $('#modal-body').innerHTML = miniTable(src.headers, rows.map(src.map), 'Belum ada data.');
  } catch (e) {
    $('#modal-body').innerHTML = errorBlock(e);
  }
}

async function mountDashboard() {
  $('#page-content').innerHTML = `
    ${SUPABASE_TERKONFIGURASI ? '' : setupNotice()}
    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 mb-5" id="stat-grid">
      ${Array(5).fill('<div class="card p-4"><div class="skeleton h-14"></div></div>').join('')}
    </div>
    <div class="grid lg:grid-cols-3 gap-4">
      <div class="card p-5 lg:col-span-2">
        <h3 class="font-extrabold text-slate-800 text-sm mb-1">Sebaran per Kecamatan</h3>
        <p class="text-xs text-slate-400 mb-3">Jumlah fasyankes &amp; praktik mandiri terdaftar per kecamatan Kota Samarinda</p>
        <div class="h-72 relative"><canvas id="chart-sebaran"></canvas></div>
      </div>
      <div class="card p-5">
        <h3 class="font-extrabold text-slate-800 text-sm mb-3">Aksi Cepat</h3>
        <div id="quick-panel" class="space-y-2.5"></div>
      </div>
    </div>`;

  if (!SUPABASE_TERKONFIGURASI) {
    // Placeholder kartu statistik (tidak menghilang — agar layout tetap utuh)
    $('#stat-grid').innerHTML = STAT_CARDS.map((c) => `
      <div class="card p-4 flex items-center gap-3 opacity-50">
        <div class="w-11 h-11 rounded-xl grid place-items-center flex-none ${c.color}">${icon(c.icon, 'w-5 h-5')}</div>
        <div class="min-w-0">
          <p class="text-2xl font-extrabold text-slate-300 leading-none">&ndash;</p>
          <p class="text-[.7rem] text-slate-400 mt-1 truncate">${esc(c.label)}</p>
        </div>
      </div>`).join('');
    $('#chart-sebaran').closest('.h-72').innerHTML =
      emptyState('Grafik akan tampil otomatis setelah js/config.js diisi dan sql/schema.sql dijalankan.');
    $('#quick-panel').innerHTML =
      '<p class="text-xs text-slate-400 leading-relaxed">Panel aksi cepat akan aktif setelah koneksi Supabase berhasil.</p>';
    return;
  }

  // Kartu statistik — klik kartu membuka modal detail table dari Supabase
  $('#stat-grid').innerHTML = STAT_CARDS.map((c) => `
    <button class="stat-card card p-4 text-left flex items-center gap-3" data-stat="${c.id}" aria-label="Lihat detail ${esc(c.label)}">
      <div class="w-11 h-11 rounded-xl grid place-items-center flex-none ${c.color}">${icon(c.icon, 'w-5 h-5')}</div>
      <div class="min-w-0">
        <p class="text-2xl font-extrabold text-slate-800 leading-none" id="stat-${c.id}">–</p>
        <p class="text-[.7rem] text-slate-500 mt-1 truncate">${esc(c.label)}</p>
      </div>
    </button>`).join('');
  $$('#stat-grid [data-stat]').forEach((b) => b.addEventListener('click', () => openStatModal(b.dataset.stat)));

  try {
    const [nMedis, nKes, nFas, nPrak] = await Promise.all([
      countRows('tenaga_medis'), countRows('tenaga_kesehatan'),
      countRows('fasyankes'), countRows('praktik_mandiri'),
    ]);
    const expiredRows = (await loadExpiredRows()).filter((x) => x._d < 0).length;
    const vals = { 'tenaga-medis': nMedis, 'tenaga-kesehatan': nKes, 'fasyankes': nFas, 'praktik-mandiri': nPrak, 'izin-expired': expiredRows };
    for (const [id, v] of Object.entries(vals)) {
      const el = $(`#stat-${id}`);
      if (el) el.textContent = v;
    }
  } catch (e) {
    $('#stat-grid').innerHTML = errorBlock(e);
  }

  // Grafik bar sebaran per kecamatan (grouped: fasyankes vs praktik mandiri)
  try {
    const [fas, prak] = await Promise.all([
      fetchRows('fasyankes', { select: 'kecamatan' }),
      fetchRows('praktik_mandiri', { select: 'kecamatan' }),
    ]);
    const hitung = (rows) => {
      const m = {};
      rows.forEach((r) => { const k = (r.kecamatan || 'Tidak diisi').trim(); m[k] = (m[k] || 0) + 1; });
      return m;
    };
    const mF = hitung(fas), mP = hitung(prak);
    const labels = [...KECAMATAN_SAMARINDA, 'Tidak diisi',
      ...Object.keys(mF).filter((k) => !KECAMATAN_SAMARINDA.includes(k) && k !== 'Tidak diisi'),
      ...Object.keys(mP).filter((k) => !KECAMATAN_SAMARINDA.includes(k) && k !== 'Tidak diisi' && !mF[k]),
    ];
    if (typeof Chart !== 'undefined') {
      state.chart = new Chart($('#chart-sebaran'), {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'Fasyankes', data: labels.map((k) => mF[k] || 0), backgroundColor: '#0d9488', borderRadius: 6, maxBarThickness: 26 },
            { label: 'Praktik Mandiri', data: labels.map((k) => mP[k] || 0), backgroundColor: '#f59e0b', borderRadius: 6, maxBarThickness: 26 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, boxHeight: 12, font: { family: 'Plus Jakarta Sans' } } } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } },
        },
      });
    } else {
      $('#chart-sebaran').closest('div').innerHTML = '<p class="text-xs text-slate-400 py-10 text-center">Chart.js gagal dimuat (periksa koneksi CDN).</p>';
    }
  } catch (e) {
    $('#chart-sebaran').closest('div').innerHTML = errorBlock(e);
  }

  // Panel aksi cepat
  try {
    const [fpend, ppend] = await Promise.all([
      countRows('fasyankes', [['eq', 'status_verifikasi', 'pending']]),
      countRows('praktik_mandiri', [['eq', 'status_verifikasi', 'pending']]),
    ]);
    const item = (href, ic, title, sub, color) => `
      <a href="${href}" class="flex items-center gap-3 rounded-xl border border-slate-100 p-3 hover:border-teal-200 hover:bg-teal-50/50 transition">
        <div class="w-9 h-9 rounded-lg ${color} grid place-items-center flex-none">${icon(ic, 'w-4 h-4')}</div>
        <div class="flex-1 min-w-0"><p class="text-xs font-bold text-slate-700">${title}</p><p class="text-[.68rem] text-slate-400">${sub}</p></div>
        ${icon('chevron', 'w-4 h-4 text-slate-300 -rotate-90')}
      </a>`;
    $('#quick-panel').innerHTML = `
      ${item('#verifikasi-faskes', 'verif', 'Verifikasi Fasyankes', `${fpend} pengajuan menunggu`, 'bg-teal-50 text-teal-600')}
      ${item('#verifikasi-praktik', 'shield', 'Verifikasi Praktik Mandiri', `${ppend} pengajuan menunggu`, 'bg-amber-50 text-amber-600')}
      ${item('#expired', 'clock', 'Notifikasi Expired', 'SIP/STR H-30 & expired', 'bg-rose-50 text-rose-600')}
      ${item('#monev', 'monev', 'Isi Monev Izin', 'Kunjungan, temuan, tindak lanjut', 'bg-sky-50 text-sky-600')}`;
  } catch (e) {
    $('#quick-panel').innerHTML = errorBlock(e);
  }
}

/* =========================================================
 * 9. HALAMAN: PETA SEBARAN PRAKTIK (Leaflet.js)
 * ========================================================= */

function pinIcon(color) {
  return L.divIcon({
    className: 'sim-pin',
    html: `<svg width="28" height="40" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z" fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="14" cy="14" r="5" fill="#fff"/></svg>`,
    iconSize: [28, 40], iconAnchor: [14, 38], popupAnchor: [0, -34],
  });
}

async function mountPeta() {
  $('#page-content').innerHTML = `
    ${SUPABASE_TERKONFIGURASI ? '' : setupNotice()}
    <div class="card p-4 sm:p-5">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h3 class="font-extrabold text-slate-800 text-sm">Peta Sebaran Praktik</h3>
          <p class="text-xs text-slate-400">Pusat: Kota Samarinda (−0.502, 117.154) &bull; klik marker untuk detail</p>
        </div>
        <div class="flex gap-3 text-[.7rem] font-semibold text-slate-600">
          <span class="inline-flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-teal-600 inline-block"></span>Fasyankes</span>
          <span class="inline-flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>Praktik Mandiri</span>
        </div>
      </div>
      <div id="peta-map" class="h-[420px] rounded-xl bg-slate-200 relative z-0"></div>
      <p id="peta-note" class="text-xs text-slate-400 mt-2"></p>
    </div>`;

  if (!SUPABASE_TERKONFIGURASI) return;
  if (typeof L === 'undefined') {
    $('#peta-map').innerHTML = '<p class="p-6 text-center text-xs text-slate-500">Leaflet gagal dimuat — periksa koneksi CDN.</p>';
    return;
  }

  if (state.map) { state.map.remove(); state.map = null; }
  const map = L.map('peta-map').setView([-0.502, 117.154], 12);
  state.map = map;
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  try {
    const [fas, prak] = await Promise.all([
      fetchRows('fasyankes', { orderBy: 'nama_fasyankes', asc: true }),
      fetchRows('praktik_mandiri', { orderBy: 'nama_praktik', asc: true }),
    ]);
    let n = 0, tanpaKoordinat = 0;
    const tambah = (r, warna, nama, sub) => {
      const lat = parseFloat(r.latitude), lng = parseFloat(r.longitude);
      if (!isFinite(lat) || !isFinite(lng)) { tanpaKoordinat++; return; }
      L.marker([lat, lng], { icon: pinIcon(warna) }).addTo(map)
        .bindPopup(`<div class="text-[.78rem] leading-snug" style="min-width:180px">
          <p class="font-extrabold text-slate-800">${esc(nama)}</p>
          <p class="text-slate-500">${esc(sub || '')}</p>
          <p class="text-slate-500">${esc(r.alamat || '')}</p>
          <p class="text-slate-400 text-[.68rem] mt-1">${esc(r.kecamatan || '—')} &bull; ${badge(r.status_verifikasi)}</p></div>`);
      n++;
    };
    fas.forEach((r) => tambah(r, '#0d9488', r.nama_fasyankes, r.jenis));
    prak.forEach((r) => tambah(r, '#f59e0b', r.nama_praktik, r.jenis_praktik));
    $('#peta-note').textContent = `${n} lokasi tampil di peta${tanpaKoordinat ? ` • ${tanpaKoordinat} data belum memiliki koordinat (isi Latitude & Longitude pada form data untuk menampilkannya)` : ''}`;
    setTimeout(() => map.invalidateSize(), 250);
  } catch (e) {
    $('#peta-note').innerHTML = errorBlock(e);
  }
}

/* =========================================================
 * 10. HALAMAN: NOTIFIKASI EXPIRED (SIP/STR H-30)
 * ========================================================= */

async function loadExpiredRows() {
  const [medis, kes] = await Promise.all([
    fetchRows('tenaga_medis', { orderBy: 'masa_berlaku_sip', asc: true }),
    fetchRows('tenaga_kesehatan', { orderBy: 'masa_berlaku_sip', asc: true }),
  ]);
  const rows = [];
  const push = (r, sumber) => {
    if (!r.masa_berlaku_sip) return;
    const d = daysUntil(r.masa_berlaku_sip);
    if (d === null) return;
    rows.push({ ...r, _sumber: sumber, _d: d, _kat: d < 0 ? 'merah' : d <= 30 ? 'kuning' : 'hijau' });
  };
  medis.forEach((r) => push(r, 'Tenaga Medis'));
  kes.forEach((r) => push(r, 'Tenaga Kesehatan'));
  rows.sort((a, b) => a._d - b._d);
  return rows;
}

function sisaBadge(d, kat) {
  if (kat === 'merah') return `<span class="badge bg-rose-100 text-rose-700 ring-1 ring-rose-200">Expired ${Math.abs(d)} hari lalu</span>`;
  const cls = kat === 'kuning' ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' : 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200';
  return `<span class="badge ${cls}">H-${d}</span>`;
}

async function mountExpired() {
  $('#page-content').innerHTML = `
    ${SUPABASE_TERKONFIGURASI ? '' : setupNotice()}
    <div class="card p-4 sm:p-5">
      <div class="flex flex-wrap items-center justify-between gap-2.5 mb-3.5">
        <div>
          <p class="text-sm font-extrabold text-slate-800">Notifikasi Expired SIP/STR</p>
          <p class="text-xs text-slate-400">Merah = telah expired &bull; Kuning = menuju H-30 &bull; Hijau = masih aman</p>
        </div>
        <div class="flex flex-wrap gap-2" id="ex-tabs"></div>
      </div>
      <div id="ex-list">${skeletonRows(6)}</div>
    </div>`;

  if (!SUPABASE_TERKONFIGURASI) { $('#ex-list').innerHTML = ''; return; }

  let rows = [], tab = 'semua';
  try { rows = await loadExpiredRows(); } catch (e) { $('#ex-list').innerHTML = errorBlock(e); return; }

  const hitung = { semua: rows.length, merah: 0, kuning: 0, hijau: 0 };
  rows.forEach((r) => { hitung[r._kat]++; });
  const TABS = [
    ['semua', 'Semua'], ['merah', 'Expired'], ['kuning', 'H-30'], ['hijau', 'Aman'],
  ];
  $('#ex-tabs').innerHTML = TABS.map(([k, l]) => `<button class="chip ${tab === k ? 'active' : ''}" data-tab="${k}">${l} <span class="opacity-70">(${hitung[k]})</span></button>`).join('');
  $$('#ex-tabs [data-tab]').forEach((b) => b.addEventListener('click', () => {
    tab = b.dataset.tab;
    $$('#ex-tabs [data-tab]').forEach((x) => x.classList.toggle('active', x.dataset.tab === tab));
    renderList();
  }));

  function renderList() {
    const data = tab === 'semua' ? rows : rows.filter((r) => r._kat === tab);
    if (!data.length) { $('#ex-list').innerHTML = emptyState('Tidak ada data pada kategori ini.'); return; }
    $('#ex-list').innerHTML = `<div class="table-wrap"><table class="sim-table">
      <thead><tr><th>Nama</th><th>No. SIP</th><th>Tempat Praktik</th><th>Masa Berlaku</th><th>Sisa Waktu</th></tr></thead>
      <tbody>${data.map((r) => `<tr data-id="${r.id}">
        <td><span class="font-semibold text-slate-700">${esc(r.nama_lengkap)}</span><br><span class="text-[.68rem] text-slate-400">${esc(r._sumber)}${r.spesialisasi ? ' • ' + esc(r.spesialisasi) : r.profesi ? ' • ' + esc(r.profesi) : ''}</span></td>
        <td>${esc(r.no_sip || '—')}</td>
        <td>${esc(r.tempat_praktik || '—')}</td>
        <td>${fmtDate(r.masa_berlaku_sip)}</td>
        <td>${sisaBadge(r._d, r._kat)}</td>
      </tr>`).join('')}</tbody></table></div>`;
    $$('#ex-list tbody tr').forEach((tr) => tr.addEventListener('click', () => {
      const row = data.find((r) => String(r.id) === tr.dataset.id);
      if (row) openDetailExpired(row);
    }));
  }
  renderList();
}

function openDetailExpired(r) {
  openModal({
    title: esc(r.nama_lengkap || 'Detail'),
    size: 'md',
    body: `<div class="detail-grid">
      <div class="detail-label">Sumber Data</div><div class="detail-value">${esc(r._sumber)}</div>
      <div class="detail-label">NIK</div><div class="detail-value">${esc(r.nik || '—')}</div>
      <div class="detail-label">No. STR</div><div class="detail-value">${esc(r.no_str || '—')}</div>
      <div class="detail-label">No. SIP</div><div class="detail-value">${esc(r.no_sip || '—')}</div>
      ${r.spesialisasi ? `<div class="detail-label">Spesialisasi</div><div class="detail-value">${esc(r.spesialisasi)}</div>` : ''}
      ${r.profesi ? `<div class="detail-label">Profesi</div><div class="detail-value">${esc(r.profesi)}</div>` : ''}
      <div class="detail-label">Tempat Praktik</div><div class="detail-value">${esc(r.tempat_praktik || '—')}</div>
      <div class="detail-label">Masa Berlaku SIP</div><div class="detail-value">${fmtDate(r.masa_berlaku_sip)}</div>
      <div class="detail-label">Sisa Waktu</div><div class="detail-value">${sisaBadge(r._d, r._kat)}</div>
      <div class="detail-label">Status</div><div class="detail-value">${badge(r.status)}</div>
      <div class="detail-label">Terdaftar</div><div class="detail-value">${fmtDateTime(r.created_at)}</div>
    </div>`,
    footer: `<button class="btn btn-primary" data-close="1">Tutup</button>`,
  });
}

/* =========================================================
 * 11. HALAMAN: PETUNJUK PENGGUNAAN (accordion)
 * ========================================================= */

function renderPetunjuk() {
  const items = [
    {
      t: '1. Persiapan Backend Supabase',
      c: `<p>Buat akun & project baru di <b>supabase.com</b>, lalu buka <b>SQL Editor → New query</b>, salin seluruh isi berkas <b>sql/schema.sql</b> dari folder aplikasi ini dan klik <b>Run</b>. Script akan membuat tabel, RLS, trigger, dan bucket penyimpanan foto monev secara otomatis.</p><p>Opsional: jalankan <b>sql/seed.sql</b> bila ingin mengisi contoh data demo untuk melihat peta & grafik.</p>`,
    },
    {
      t: '2. Konfigurasi Aplikasi (js/config.js)',
      c: `<p>Buka <b>Project Settings → API</b> di dashboard Supabase, salin <b>Project URL</b> dan <b>anon / public key</b>, lalu isi keduanya pada berkas <b>js/config.js</b>. Kredensial tidak ditulis di index.html agar mudah dipindah antar lingkungan.</p><p>anon key aman dipakai di frontend karena keamanan diatur Row Level Security (RLS). Jangan pernah menaruh service_role key di aplikasi ini.</p>`,
    },
    {
      t: '3. Membuat Akun Admin Pertama',
      c: `<p>Di dashboard Supabase buka <b>Authentication → Users → Add user</b>, isi email &amp; kata sandi (nonaktifkan opsi konfirmasi email bila ada). Profil otomatis dibuat dengan role <b>operator</b> oleh trigger.</p><p>Untuk menjadikan akun tersebut admin, jalankan di SQL Editor: <code class="bg-slate-100 rounded px-1">update profiles set role='admin' where email='email-anda';</code></p><p>Setelah itu masuk lewat tombol <b>Masuk</b> di kanan atas. Admin dapat menambah pengguna lain langsung dari menu <b>Kelola Pengguna</b>.</p>`,
    },
    {
      t: '4. Manajemen Data (Bagian 2 Sidebar)',
      c: `<p>Empat menu data (Tenaga Medis, Tenaga Kesehatan, Fasyankes, Praktik Mandiri) mendukung CRUD penuh: klik <b>Tambah</b> untuk input baru, klik baris tabel untuk melihat <b>detail lengkap</b>, lalu gunakan tombol <b>Edit</b> atau <b>Hapus</b> di dalam modal detail.</p><p>Operator &amp; admin dapat menambah/mengubah data; hanya admin yang dapat menghapus. Pencarian tersedia di setiap halaman data.</p>`,
    },
    {
      t: '5. Verifikasi Perizinan (Bagian 3)',
      c: `<p>Menu <b>Verifikasi Praktik</b> memiliki tiga tab: <b>Formulir Verval</b> — 28 field verifikasi &amp; validasi izin praktik dengan pencarian NIK otomatis (mengisi form dari data verval/tenaga medis sebelumnya) serta <b>draf otomatis</b> yang tersinkron ke database per pengguna; <b>Riwayat Verval</b> — seluruh hasil verval, klik baris untuk detail lengkap (admin dapat menghapus); dan <b>Pengajuan Praktik</b> — setujui/tolak pengajuan beserta catatan.</p><p>Menu <b>Verifikasi Faskes</b> juga tiga tab: <b>Formulir Verval Fasyankes</b> — ID verval otomatis (VF-tanggal-kode), data fasilitas, alamat &amp; kontak, daftar <b>SDM Kesehatan dinamis</b> mengikuti jenis fasyankes (RS, Puskesmas, Klinik, Apotik, Toko Obat, Optik, PBF, Praktik Mandiri), hasil verifikasi Layak/Tidak Layak/Perbaikan/Pending/Tidak Valid, plus draf otomatis; <b>Riwayat Verval</b> (detail lengkap, hapus khusus admin); dan <b>Pengajuan Faskes</b> (setujui/tolak). Masyarakat/petugas dapat mengecek status melalui menu <b>Cek Hasil Verifikasi</b> dengan memasukkan NIK atau nama.</p>`,
    },
    {
      t: '6. Monev Izin & Upload Foto',
      c: `<p>Menu <b>Monev Izin</b> merekam hasil monitoring &amp; evaluasi: tanggal kunjungan, sasaran, petugas, temuan, tindak lanjut, dan <b>foto dokumentasi</b> yang terunggah ke Supabase Storage (bucket <b>monev</b>). Klik baris untuk melihat detail lengkap termasuk foto.</p>`,
    },
    {
      t: '7. Peta & Notifikasi Expired',
      c: `<p>Peta menampilkan marker fasyankes (teal) dan praktik mandiri (kuning) yang memiliki koordinat. Isi <b>Latitude/Longitude</b> pada form data agar lokasi tampil di peta (pusat peta: Samarinda −0.502, 117.154).</p><p>Menu <b>Notifikasi Expired</b> memantau masa berlaku SIP: badge <span class="badge bg-rose-100 text-rose-700">merah</span> = sudah expired, <span class="badge bg-amber-100 text-amber-700">kuning</span> = menuju H-30, <span class="badge bg-emerald-100 text-emerald-700">hijau</span> = aman.</p>`,
    },
    {
      t: '8. Deploy ke GitHub Pages',
      c: `<p>Unggah seluruh isi folder aplikasi (index.html, css/, js/, assets/) ke repository GitHub, lalu aktifkan <b>Settings → Pages → Source: Deploy from a branch</b> pilih cabang <b>main</b> dan folder <b>/ (root)</b>. Aplikasi akan terbit pada alamat https://username.github.io/nama-repo/</p><p>Untuk uji lokal, jalankan server statis sederhana, contoh: <code class="bg-slate-100 rounded px-1">python3 -m http.server 8080</code> — ES module tidak berjalan via file:// langsung.</p>`,
    },
  ];
  const accItem = (it, i) => `
    <div class="acc-item ${i === 0 ? 'open' : ''}" data-acc>
      <button class="acc-head" type="button"><span>${it.t}</span>${icon('chevron', 'w-4 h-4 text-slate-400 acc-chevron')}</button>
      <div class="acc-body"><div class="px-5 pb-4 text-[.82rem] text-slate-600 leading-relaxed space-y-1.5">${it.c}</div></div>
    </div>`;
  $('#page-content').innerHTML = `
    <div class="max-w-3xl mx-auto">
      <div class="card p-5 mb-4 flex gap-3 items-start bg-teal-50/60 border-teal-100">
        <div class="w-10 h-10 rounded-xl bg-teal-600 text-white grid place-items-center flex-none">${icon('petunjuk', 'w-5 h-5')}</div>
        <div class="text-sm">
          <p class="font-extrabold text-teal-900">Selamat datang di SIMANTRI</p>
          <p class="text-teal-800/70 text-xs leading-relaxed mt-0.5">Sistem Informasi dan Manajemen Praktik Tenaga Medis dan Tenaga Kesehatan di Fasyankes dan Praktik Mandiri Kota Samarinda. Ikuti langkah-langkah berikut untuk mengoperasikan aplikasi.</p>
        </div>
      </div>
      <div class="space-y-2.5" id="acc-root">${items.map(accItem).join('')}</div>
    </div>`;
  $$('#acc-root [data-acc] .acc-head').forEach((h) => h.addEventListener('click', () => h.parentElement.classList.toggle('open')));
}

/* =========================================================
 * 12. CRUD GENERIK (Bagian 2 — Manajemen Data)
 * ========================================================= */

let currentCrudReload = null; // fungsi reload daftar halaman aktif (dipakai modal)

const CRUD = {
  'tenaga-medis': {
    key: 'tenaga-medis', table: 'tenaga_medis', title: 'Data Tenaga Medis',
    desc: 'Dokter & dokter gigi yang praktik di Kota Samarinda',
    searchCols: ['nama_lengkap', 'nik', 'no_str', 'no_sip', 'spesialisasi', 'tempat_praktik'],
    rowTitle: (r) => r.nama_lengkap,
    columns: [
      { k: 'nama_lengkap', label: 'Nama Lengkap', render: (v, r) => `<span class="font-semibold text-slate-700">${esc(v)}</span><br><span class="text-[.68rem] text-slate-400">${esc(r.spesialisasi || '')}</span>` },
      { k: 'nik', label: 'NIK' },
      { k: 'no_str', label: 'STR / SIP', render: (v, r) => `${esc(v || '—')}<br><span class="text-[.68rem] text-slate-400">${esc(r.no_sip || '')}</span>` },
      { k: 'tempat_praktik', label: 'Tempat Praktik' },
      { k: 'masa_berlaku_sip', label: 'Masa Berlaku SIP', render: (v) => fmtDate(v) },
      { k: 'status', label: 'Status', render: (v) => badge(v) },
    ],
    form: [
      { k: 'nik', label: 'NIK', required: true, max: 16 },
      { k: 'nama_lengkap', label: 'Nama Lengkap', required: true },
      { k: 'no_str', label: 'No. STR' },
      { k: 'no_sip', label: 'No. SIP' },
      { k: 'spesialisasi', label: 'Spesialisasi', placeholder: 'cth: Penyakit Dalam, Anak, Bedah…' },
      { k: 'tempat_praktik', label: 'Tempat Praktik', placeholder: 'cth: RSUD Samarinda' },
      { k: 'masa_berlaku_sip', label: 'Masa Berlaku SIP', type: 'date' },
      { k: 'status', label: 'Status', type: 'select', options: ['aktif', 'nonaktif'] },
    ],
    detail: (r) => [
      ['NIK', esc(r.nik || '—')], ['Nama Lengkap', esc(r.nama_lengkap || '—')],
      ['No. STR', esc(r.no_str || '—')], ['No. SIP', esc(r.no_sip || '—')],
      ['Spesialisasi', esc(r.spesialisasi || '—')], ['Tempat Praktik', esc(r.tempat_praktik || '—')],
      ['Masa Berlaku SIP', fmtDate(r.masa_berlaku_sip)], ['Status', badge(r.status)],
      ['Terdaftar', fmtDateTime(r.created_at)],
    ],
  },
  'tenaga-kesehatan': {
    key: 'tenaga-kesehatan', table: 'tenaga_kesehatan', title: 'Data Tenaga Kesehatan',
    desc: 'Perawat, bidan, dan profesi tenaga kesehatan lainnya',
    searchCols: ['nama_lengkap', 'nik', 'no_str', 'no_sip', 'profesi', 'tempat_praktik'],
    rowTitle: (r) => r.nama_lengkap,
    columns: [
      { k: 'nama_lengkap', label: 'Nama Lengkap', render: (v, r) => `<span class="font-semibold text-slate-700">${esc(v)}</span><br><span class="text-[.68rem] text-slate-400">${esc(r.profesi || '')}</span>` },
      { k: 'nik', label: 'NIK' },
      { k: 'no_str', label: 'STR / SIP', render: (v, r) => `${esc(v || '—')}<br><span class="text-[.68rem] text-slate-400">${esc(r.no_sip || '')}</span>` },
      { k: 'tempat_praktik', label: 'Tempat Praktik' },
      { k: 'masa_berlaku_sip', label: 'Masa Berlaku SIP', render: (v) => fmtDate(v) },
      { k: 'status', label: 'Status', render: (v) => badge(v) },
    ],
    form: [
      { k: 'nik', label: 'NIK', required: true, max: 16 },
      { k: 'nama_lengkap', label: 'Nama Lengkap', required: true },
      { k: 'no_str', label: 'No. STR' },
      { k: 'no_sip', label: 'No. SIP' },
      { k: 'profesi', label: 'Profesi', type: 'select', options: PROFESI_TK, required: true },
      { k: 'tempat_praktik', label: 'Tempat Praktik' },
      { k: 'masa_berlaku_sip', label: 'Masa Berlaku SIP', type: 'date' },
      { k: 'status', label: 'Status', type: 'select', options: ['aktif', 'nonaktif'] },
    ],
    detail: (r) => [
      ['NIK', esc(r.nik || '—')], ['Nama Lengkap', esc(r.nama_lengkap || '—')],
      ['No. STR', esc(r.no_str || '—')], ['No. SIP', esc(r.no_sip || '—')],
      ['Profesi', esc(r.profesi || '—')], ['Tempat Praktik', esc(r.tempat_praktik || '—')],
      ['Masa Berlaku SIP', fmtDate(r.masa_berlaku_sip)], ['Status', badge(r.status)],
      ['Terdaftar', fmtDateTime(r.created_at)],
    ],
  },
  'fasyankes': {
    key: 'fasyankes', table: 'fasyankes', title: 'Data Fasyankes',
    desc: 'Rumah sakit, puskesmas, dan klinik di Kota Samarinda',
    searchCols: ['nama_fasyankes', 'jenis', 'alamat', 'kecamatan'],
    rowTitle: (r) => r.nama_fasyankes,
    columns: [
      { k: 'nama_fasyankes', label: 'Nama Fasyankes', render: (v, r) => `<span class="font-semibold text-slate-700">${esc(v)}</span><br><span class="text-[.68rem] text-slate-400">${esc(r.jenis || '')}</span>` },
      { k: 'alamat', label: 'Alamat / Kecamatan', render: (v, r) => `<span class="block max-w-[240px]">${esc(v || '—')}</span><span class="text-[.68rem] text-slate-400">${esc(r.kecamatan || '')}</span>` },
      { k: 'latitude', label: 'Koordinat', render: (v, r) => (isFinite(parseFloat(r.latitude)) && isFinite(parseFloat(r.longitude))) ? `<span class="text-[.7rem] text-slate-500">${parseFloat(r.latitude).toFixed(4)}, ${parseFloat(r.longitude).toFixed(4)}</span>` : '<span class="text-[.7rem] text-slate-300">belum diisi</span>' },
      { k: 'status_verifikasi', label: 'Verifikasi', render: (v) => badge(v) },
    ],
    form: [
      { k: 'nama_fasyankes', label: 'Nama Fasyankes', required: true, wide: true },
      { k: 'jenis', label: 'Jenis', type: 'select', options: JENIS_FASKES, required: true },
      { k: 'kecamatan', label: 'Kecamatan', type: 'select', options: KECAMATAN_SAMARINDA },
      { k: 'alamat', label: 'Alamat', type: 'textarea', wide: true },
      { k: 'latitude', label: 'Latitude (untuk peta)', type: 'number', placeholder: 'cth: -0.4905' },
      { k: 'longitude', label: 'Longitude (untuk peta)', type: 'number', placeholder: 'cth: 117.1462' },
    ],
    detail: (r) => [
      ['Nama Fasyankes', esc(r.nama_fasyankes || '—')], ['Jenis', esc(r.jenis || '—')],
      ['Alamat', esc(r.alamat || '—')], ['Kecamatan', esc(r.kecamatan || '—')],
      ['Latitude', r.latitude ?? '—'], ['Longitude', r.longitude ?? '—'],
      ['Status Verifikasi', badge(r.status_verifikasi)],
      ['Catatan Verifikator', esc(r.catatan_verifikasi || '—')],
      ['Diverifikasi Oleh', esc(r.verified_by || '—')], ['Waktu Verifikasi', fmtDateTime(r.verified_at)],
      ['Terdaftar', fmtDateTime(r.created_at)],
    ],
  },
  'praktik-mandiri': {
    key: 'praktik-mandiri', table: 'praktik_mandiri', title: 'Data Praktik Mandiri',
    desc: 'Praktik mandiri tenaga medis & kesehatan',
    searchCols: ['nama_praktik', 'pemilik', 'jenis_praktik', 'alamat', 'kecamatan'],
    rowTitle: (r) => r.nama_praktik,
    columns: [
      { k: 'nama_praktik', label: 'Nama Praktik', render: (v, r) => `<span class="font-semibold text-slate-700">${esc(v)}</span><br><span class="text-[.68rem] text-slate-400">${esc(r.jenis_praktik || '')}</span>` },
      { k: 'pemilik', label: 'Pemilik' },
      { k: 'alamat', label: 'Alamat / Kecamatan', render: (v, r) => `<span class="block max-w-[240px]">${esc(v || '—')}</span><span class="text-[.68rem] text-slate-400">${esc(r.kecamatan || '')}</span>` },
      { k: 'status_verifikasi', label: 'Verifikasi', render: (v) => badge(v) },
    ],
    form: [
      { k: 'nama_praktik', label: 'Nama Praktik', required: true, wide: true },
      { k: 'pemilik', label: 'Pemilik', required: true },
      { k: 'jenis_praktik', label: 'Jenis Praktik', type: 'select', options: JENIS_PRAKTIK, required: true },
      { k: 'kecamatan', label: 'Kecamatan', type: 'select', options: KECAMATAN_SAMARINDA },
      { k: 'alamat', label: 'Alamat', type: 'textarea', wide: true },
      { k: 'latitude', label: 'Latitude (untuk peta)', type: 'number', placeholder: 'cth: -0.5220' },
      { k: 'longitude', label: 'Longitude (untuk peta)', type: 'number', placeholder: 'cth: 117.1280' },
    ],
    detail: (r) => [
      ['Nama Praktik', esc(r.nama_praktik || '—')], ['Pemilik', esc(r.pemilik || '—')],
      ['Jenis Praktik', esc(r.jenis_praktik || '—')], ['Alamat', esc(r.alamat || '—')],
      ['Kecamatan', esc(r.kecamatan || '—')],
      ['Latitude', r.latitude ?? '—'], ['Longitude', r.longitude ?? '—'],
      ['Status Verifikasi', badge(r.status_verifikasi)],
      ['Catatan Verifikator', esc(r.catatan_verifikasi || '—')],
      ['Diverifikasi Oleh', esc(r.verified_by || '—')], ['Waktu Verifikasi', fmtDateTime(r.verified_at)],
      ['Terdaftar', fmtDateTime(r.created_at)],
    ],
  },
};

function fieldHTML(f, val) {
  const v = val ?? '';
  const req = f.required ? 'required' : '';
  let ctrl;
  if (f.type === 'select') {
    ctrl = `<select class="input" name="${f.k}" ${req}><option value="">— Pilih —</option>${f.options.map((o) => `<option value="${esc(o)}" ${String(v) === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  } else if (f.type === 'textarea') {
    ctrl = `<textarea class="input" name="${f.k}" rows="2" placeholder="${esc(f.placeholder || '')}" ${req}>${esc(v)}</textarea>`;
  } else if (f.type === 'date') {
    ctrl = `<input type="date" class="input" name="${f.k}" value="${esc(v)}" ${req}>`;
  } else if (f.type === 'number') {
    ctrl = `<input type="number" step="any" class="input" name="${f.k}" value="${esc(v)}" placeholder="${esc(f.placeholder || '')}" ${req}>`;
  } else {
    ctrl = `<input type="text" class="input" name="${f.k}" value="${esc(v)}" placeholder="${esc(f.placeholder || '')}" ${req} ${f.max ? `maxlength="${f.max}"` : ''}>`;
  }
  return `<div class="${f.wide ? 'sm:col-span-2' : ''}"><label class="lbl">${esc(f.label)}${f.required ? ' <span class="text-rose-500">*</span>' : ''}</label>${ctrl}</div>`;
}

function openFormCrud(cfg, row) {
  const isEdit = !!row;
  if (!canInput()) { toast('Tambah/Edit data memerlukan akun Operator atau Admin.', 'info'); return; }
  const judul = cfg.title.replace(/^Data /, '');
  openModal({
    title: `${isEdit ? 'Edit' : 'Tambah'} ${esc(judul)}`,
    size: 'lg',
    body: `<form id="crud-form" class="grid grid-cols-1 sm:grid-cols-2 gap-3.5" novalidate>
        ${cfg.form.map((f) => fieldHTML(f, row?.[f.k])).join('')}
      </form>
      <p class="text-[.68rem] text-slate-400 mt-3">* wajib diisi. Data disimpan langsung ke Supabase (live).</p>`,
    footer: `<button class="btn btn-ghost" data-close="1">Batal</button>
             <button class="btn btn-primary" id="btn-save">${icon('check', 'w-4 h-4')} Simpan</button>`,
    onOpen: (root) => {
      root.querySelector('#btn-save').addEventListener('click', async (e) => {
        const form = root.querySelector('#crud-form');
        if (!form.reportValidity()) return;
        const payload = {};
        cfg.form.forEach((f) => {
          const el = form.elements[f.k];
          if (!el) return;
          const v = el.value.trim();
          payload[f.k] = v === '' ? null : v;
        });
        const btn = e.currentTarget;
        btn.disabled = true; btn.textContent = 'Menyimpan…';
        try {
          const { error } = isEdit
            ? await supabase.from(cfg.table).update(payload).eq('id', row.id)
            : await supabase.from(cfg.table).insert([payload]);
          if (error) throw error;
          closeModal();
          toast(isEdit ? 'Data berhasil diperbarui.' : 'Data berhasil ditambahkan.');
          currentCrudReload?.();
        } catch (err) {
          toast(friendlyError(err), 'error');
          btn.disabled = false; btn.textContent = 'Simpan';
        }
      });
    },
  });
}

function openDetailCrud(cfg, row) {
  openModal({
    title: esc(cfg.rowTitle(row) || 'Detail'),
    size: 'md',
    body: `<div class="detail-grid">${cfg.detail(row).map(([l, v]) => `<div class="detail-label">${l}</div><div class="detail-value">${v ?? '—'}</div>`).join('')}</div>`,
    footer: `
      ${isAdmin() ? `<button class="btn btn-danger mr-auto" id="btn-del">${icon('trash', 'w-4 h-4')} Hapus</button>` : ''}
      ${canInput() ? `<button class="btn btn-soft" id="btn-edit">${icon('pencil', 'w-4 h-4')} Edit</button>` : ''}
      <button class="btn btn-primary" data-close="1">Tutup</button>`,
    onOpen: (root) => {
      root.querySelector('#btn-edit')?.addEventListener('click', () => { closeModal(); openFormCrud(cfg, row); });
      root.querySelector('#btn-del')?.addEventListener('click', () => {
        confirmDialog({
          title: 'Hapus Data',
          message: `Yakin ingin menghapus <b>${esc(cfg.rowTitle(row))}</b>? Tindakan ini tidak dapat dibatalkan.`,
          onYes: async () => {
            const { error } = await supabase.from(cfg.table).delete().eq('id', row.id);
            if (error) throw error;
            toast('Data berhasil dihapus.');
            currentCrudReload?.();
          },
        });
      });
    },
  });
}

async function mountCrud(key) {
  const cfg = CRUD[key];
  $('#page-content').innerHTML = `
    ${SUPABASE_TERKONFIGURASI ? '' : setupNotice()}
    <div class="flex flex-wrap items-center justify-between gap-2.5 mb-4">
      <div>
        <p class="text-sm font-extrabold text-slate-800">${cfg.title}</p>
        <p class="text-xs text-slate-400">${cfg.desc}</p>
      </div>
      ${canInput() ? `<button id="btn-add" class="btn btn-primary">${icon('plus', 'w-4 h-4')} Tambah</button>` : ''}
    </div>
    <div class="card p-4 sm:p-5">
      <div class="flex flex-wrap items-center gap-2.5 mb-3.5">
        <div class="search-box">${icon('search', 'w-4 h-4 text-slate-400')}<input id="crud-search" placeholder="Cari nama / NIK / no. STR…"></div>
        <span id="crud-count" class="count-chip">…</span>
        ${!state.user ? '<span class="text-[.68rem] text-slate-400">Masuk untuk menambah / mengubah data</span>' : ''}
      </div>
      <div id="crud-list">${skeletonRows(6)}</div>
    </div>`;

  if (!SUPABASE_TERKONFIGURASI) { $('#crud-list').innerHTML = ''; return; }

  let q = '';
  const search = $('#crud-search');
  search.addEventListener('input', debounce(() => { q = search.value.trim(); loadList(); }, 350));
  $('#btn-add')?.addEventListener('click', () => openFormCrud(cfg, null));

  async function loadList() {
    const box = $('#crud-list');
    if (!box) return;
    try {
      const rows = await fetchRows(cfg.table, { search: q, searchCols: cfg.searchCols });
      currentCrudReload = loadList;
      $('#crud-count').textContent = `${rows.length} data`;
      if (!rows.length) {
        box.innerHTML = emptyState(q ? 'Tidak ada data yang cocok dengan pencarian.' : 'Belum ada data. Klik "Tambah" untuk mengisi.');
        return;
      }
      box.innerHTML = `<div class="table-wrap"><table class="sim-table">
        <thead><tr><th class="w-8">#</th>${cfg.columns.map((c) => `<th>${c.label}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((r, i) => `<tr data-id="${r.id}" title="Klik untuk detail">
          <td class="text-slate-400">${i + 1}</td>
          ${cfg.columns.map((c) => `<td>${c.render ? c.render(r[c.k], r) : esc(r[c.k] ?? '—')}</td>`).join('')}
        </tr>`).join('')}</tbody></table></div>
        <p class="text-[.68rem] text-slate-400 mt-2">Klik baris untuk membuka detail lengkap.</p>`;
      $$('#crud-list tbody tr').forEach((tr) => tr.addEventListener('click', () => {
        const row = rows.find((r) => String(r.id) === tr.dataset.id);
        if (row) openDetailCrud(cfg, row);
      }));
    } catch (e) {
      box.innerHTML = errorBlock(e);
    }
  }
  await loadList();
}

/* =========================================================
 * 13. HALAMAN: VERIFIKASI PRAKTIK & FASKES
 * ========================================================= */

function verifyModal(table, nameKey, row, status) {
  const setuju = status === 'disetujui';
  openModal({
    title: `${setuju ? 'Setujui' : 'Tolak'}: ${esc(row[nameKey])}`,
    size: 'sm',
    body: `<p class="text-xs text-slate-500 mb-3">${setuju
      ? 'Catatan bersifat opsional. Status pengajuan akan berubah menjadi disetujui.'
      : 'Isi alasan penolakan agar pemohon dapat memperbaiki pengajuannya.'}</p>
      <textarea id="verif-catatan" class="input" rows="3" placeholder="Catatan verifikator…">${esc(row.catatan_verifikasi || '')}</textarea>`,
    footer: `<button class="btn btn-ghost" data-close="1">Batal</button>
             <button class="btn ${setuju ? 'btn-success' : 'btn-danger'}" id="btn-verif">${setuju ? 'Setujui Pengajuan' : 'Tolak Pengajuan'}</button>`,
    onOpen: (root) => root.querySelector('#btn-verif').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true; btn.textContent = 'Memproses…';
      try {
        const { error } = await supabase.from(table).update({
          status_verifikasi: status,
          catatan_verifikasi: root.querySelector('#verif-catatan').value.trim() || null,
          verified_at: new Date().toISOString(),
          verified_by: state.user?.email || null,
        }).eq('id', row.id);
        if (error) throw error;
        closeModal();
        toast(`Pengajuan berhasil ${setuju ? 'disetujui' : 'ditolak'}.`);
        currentCrudReload?.();
      } catch (err) {
        toast(friendlyError(err), 'error');
        btn.disabled = false; btn.textContent = setuju ? 'Setujui Pengajuan' : 'Tolak Pengajuan';
      }
    }),
  });
}

async function mountVerifikasi(kind, target = '#page-content') {
  const isPraktik = kind === 'praktik';
  const table = isPraktik ? 'praktik_mandiri' : 'fasyankes';
  const nameKey = isPraktik ? 'nama_praktik' : 'nama_fasyankes';
  const subKey = isPraktik ? 'jenis_praktik' : 'jenis';
  const cfgT = CRUD[isPraktik ? 'praktik-mandiri' : 'fasyankes'];

  $(target).innerHTML = `
    ${SUPABASE_TERKONFIGURASI ? '' : setupNotice()}
    <div class="card p-4 sm:p-5">
      <div class="flex flex-wrap items-center justify-between gap-2.5 mb-3.5">
        <div>
          <p class="text-sm font-extrabold text-slate-800">${isPraktik ? 'Verifikasi Pengajuan Praktik Mandiri' : 'Verifikasi Pengajuan Fasyankes'}</p>
          <p class="text-xs text-slate-400">Setujui atau tolak pengajuan beserta catatan. Klik baris untuk detail lengkap.</p>
        </div>
        <div class="flex flex-wrap gap-2" id="vf-tabs"></div>
      </div>
      ${canVerify() ? '' : `<div class="rounded-xl bg-sky-50 border border-sky-200 p-3.5 text-xs text-sky-800 flex gap-2.5 items-start mb-3.5">
        ${icon('info', 'w-4 h-4 mt-0.5 flex-none')}
        <span>Verifikasi memerlukan akun <b>Verifikator</b> atau <b>Admin</b>. Gunakan tombol <b>Masuk</b> di kanan atas.</span></div>`}
      <div id="vf-list">${skeletonRows(5)}</div>
    </div>`;

  if (!SUPABASE_TERKONFIGURASI) { $('#vf-list').innerHTML = ''; return; }

  let rows = [], tab = 'pending';
  try { rows = await fetchRows(table); } catch (e) { $('#vf-list').innerHTML = errorBlock(e); return; }
  currentCrudReload = mount;

  const hitung = { pending: 0, disetujui: 0, ditolak: 0 };
  rows.forEach((r) => { hitung[r.status_verifikasi] = (hitung[r.status_verifikasi] || 0) + 1; });
  const TABS = [['pending', 'Menunggu'], ['disetujui', 'Disetujui'], ['ditolak', 'Ditolak'], ['semua', 'Semua']];
  $('#vf-tabs').innerHTML = TABS.map(([k, l]) => `<button class="chip ${tab === k ? 'active' : ''}" data-tab="${k}">${l} <span class="opacity-70">(${k === 'semua' ? rows.length : hitung[k] || 0})</span></button>`).join('');
  $$('#vf-tabs [data-tab]').forEach((b) => b.addEventListener('click', () => {
    tab = b.dataset.tab;
    $$('#vf-tabs [data-tab]').forEach((x) => x.classList.toggle('active', x.dataset.tab === tab));
    renderList();
  }));

  function mount() { router(); }
  function renderList() {
    const data = tab === 'semua' ? rows : rows.filter((r) => r.status_verifikasi === tab);
    if (!data.length) { $('#vf-list').innerHTML = emptyState('Tidak ada pengajuan pada kategori ini.'); return; }
    $('#vf-list').innerHTML = `<div class="space-y-2.5">${data.map((r) => `
      <div class="vf-row card p-3.5 flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer hover:border-teal-200 transition" data-id="${r.id}">
        <div class="w-10 h-10 rounded-xl ${isPraktik ? 'bg-amber-50 text-amber-600' : 'bg-teal-50 text-teal-600'} grid place-items-center flex-none">${icon(isPraktik ? 'praktik' : 'faskes', 'w-5 h-5')}</div>
        <div class="flex-1 min-w-0">
          <p class="font-bold text-[.84rem] text-slate-700">${esc(r[nameKey])}</p>
          <p class="text-xs text-slate-500 truncate">${esc(r[subKey] || '—')} • ${esc(r.kecamatan || '—')} • ${esc(r.alamat || '—')}</p>
          ${r.catatan_verifikasi ? `<p class="text-[.7rem] text-slate-400 mt-0.5">Catatan: ${trunc(r.catatan_verifikasi, 90)}</p>` : ''}
          <p class="text-[.66rem] text-slate-400 mt-0.5">Diajukan: ${fmtDateTime(r.created_at)}${r.verified_by ? ` • Verifikator: ${esc(r.verified_by)}` : ''}</p>
        </div>
        <div class="flex items-center gap-2 flex-none flex-wrap">
          ${badge(r.status_verifikasi)}
          ${canVerify() && r.status_verifikasi === 'pending' ? `
            <button class="btn btn-success !py-1.5 !px-2.5" data-act="disetujui">${icon('check', 'w-3.5 h-3.5')} Setujui</button>
            <button class="btn btn-danger !py-1.5 !px-2.5" data-act="ditolak">${icon('x', 'w-3.5 h-3.5')} Tolak</button>` : ''}
        </div>
      </div>`).join('')}</div>`;

    $$('#vf-list .vf-row').forEach((el) => el.addEventListener('click', () => {
      const row = data.find((r) => String(r.id) === el.dataset.id);
      if (row) openDetailCrud(cfgT, row);
    }));
    $$('#vf-list [data-act]').forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation();
      const row = data.find((r) => String(r.id) === b.closest('.vf-row').dataset.id);
      if (row) verifyModal(table, nameKey, row, b.dataset.act);
    }));
  }
  renderList();
}

/* =========================================================
 * 13B. VERIFIKASI PRAKTIK — FORMULIR VERVAL IZIN PRAKTIK
 *      28 field • draf otomatis tersinkron ke tabel
 *      verval_draft (per pengguna) • hasil ke verval_izin_praktik
 * ========================================================= */

let vpTab = 'form';
let vervalDraftTimer = null;

const VERVAL_SIP_BADGE = {
  'Aktif': 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  'Proses': 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  'Expired': 'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
  'Tidak Ada': 'bg-slate-200 text-slate-600 ring-1 ring-slate-300',
};

/* Pasangan kolom-DB → label (dipakai preview & detail riwayat) */
const VERVAL_FIELDS = [
  ['nik', 'NIK'], ['nama_lengkap', 'Nama Lengkap'], ['jenis_kelamin', 'Jenis Kelamin'],
  ['tempat_lahir', 'Tempat Lahir'], ['tanggal_lahir', 'Tanggal Lahir'], ['alamat_ktp', 'Alamat Sesuai KTP'],
  ['nomor_str', 'Nomor STR'], ['status_str', 'Status STR'], ['status_sip', 'Status SIP'],
  ['nomor_sip', 'Nomor SIP'], ['masa_berlaku_sip', 'Masa Berlaku SIP'],
  ['pendidikan_str', 'Pendidikan Sesuai STR'],
  ['unit_kerja', 'Unit Kerja / Fasyankes'], ['alamat_unit', 'Alamat Unit Kerja'],
  ['desa_kelurahan', 'Desa / Kelurahan'], ['kecamatan', 'Kecamatan'],
  ['jam_operasional', 'Jam Operasional / Praktik'], ['status_satu_sehat', 'Status Unit di SatuSehat SDMK'],
  ['sop_pelayanan', 'SOP Pelayanan'], ['sop_profesi', 'SOP Profesi'], ['sop_etika', 'SOP Etika'],
  ['sdmk_named', 'SDMK Named'], ['sdmk_nakes', 'SDMK Nakes'], ['sdmk_admin', 'SDMK Admin'],
  ['catatan_rekomendasi', 'Catatan Rekomendasi'],
  ['kode_verifikasi', 'Kode Verifikasi'], ['verifikator', 'Verifikator'], ['created_at', 'Waktu Verval'],
];

/* Kolom DB → id elemen form (untuk prefill hasil pencarian NIK) */
const VERVAL_DB_TO_FORM = {
  nik: 'v-nik', nama_lengkap: 'v-nama', jenis_kelamin: 'v-jk', tempat_lahir: 'v-tempat-lahir',
  tanggal_lahir: 'v-tgl-lahir', alamat_ktp: 'v-alamat-ktp', nomor_str: 'v-nomor-str',
  status_str: 'v-status-str', status_sip: 'v-status-sip', nomor_sip: 'v-nomor-sip',
  masa_berlaku_sip: 'v-masa-sip', unit_kerja: 'v-unit-kerja', alamat_unit: 'v-alamat-unit',
  desa_kelurahan: 'v-desa', kecamatan: 'v-kecamatan', status_satu_sehat: 'v-satu-sehat',
  sop_pelayanan: 'v-sop-pelayanan', sop_profesi: 'v-sop-profesi', sop_etika: 'v-sop-etika',
  sdmk_named: 'v-sdmk-named', sdmk_nakes: 'v-sdmk-nakes', sdmk_admin: 'v-sdmk-admin',
  jam_operasional: 'v-jam', catatan_rekomendasi: 'v-catatan', pendidikan_str: 'v-pendidikan-str',
};

const optSimple = (opts, def) => opts.map((o) => `<option ${o === def ? 'selected' : ''}>${o}</option>`).join('');

function setDraftStatus(html, mode = 'ok') {
  const st = $('#draft-status');
  if (!st) return;
  st.classList.toggle('saving', mode === 'saving');
  st.classList.toggle('verval-status-warn', mode === 'warn');
  st.innerHTML = html;
}

function vervalLoginNotice() {
  return `<div class="rounded-xl bg-sky-50 border border-sky-200 p-3.5 text-xs text-sky-800 flex gap-2.5 items-start mb-4">
    ${icon('info', 'w-4 h-4 mt-0.5 flex-none')}
    <span>Formulir ini untuk kegiatan <b>verifikasi &amp; validasi</b> oleh petugas berwenang. Masuk dengan akun
    <b>Verifikator</b> atau <b>Admin</b> (tombol <b>Masuk</b> di kanan atas) untuk mengirim data.
    Riwayat &amp; detail verval tetap dapat dilihat tanpa masuk.</span></div>`;
}

/* ---------- Halaman Verifikasi Praktik (3 tab) ---------- */

async function mountVervalPraktik() {
  const tabs = [
    ['form', 'Formulir Verval', 'verif'],
    ['riwayat', 'Riwayat Verval', 'cek'],
    ['pengajuan', 'Pengajuan Praktik', 'praktik'],
  ];
  $('#page-content').innerHTML = `
    ${SUPABASE_TERKONFIGURASI ? '' : setupNotice()}
    <div class="flex flex-wrap items-center gap-2 mb-4" id="vp-tabs">
      ${tabs.map(([k, l, ic]) => `<button class="chip ${vpTab === k ? 'active' : ''}" data-tab="${k}">${icon(ic, 'w-4 h-4')} ${l}</button>`).join('')}
    </div>
    <div id="vp-content"></div>`;
  $$('#vp-tabs [data-tab]').forEach((b) => b.addEventListener('click', () => {
    if (vpTab === b.dataset.tab) return;
    vpTab = b.dataset.tab;
    $$('#vp-tabs [data-tab]').forEach((x) => x.classList.toggle('active', x.dataset.tab === vpTab));
    renderVpTab();
  }));
  renderVpTab();
}

function renderVpTab() {
  if (vpTab === 'riwayat') return renderRiwayatVerval();
  if (vpTab === 'pengajuan') return mountVerifikasi('praktik', '#vp-content');
  renderVervalForm();
}

/* ---------- Tab 1: FORMULIR VERVAL ---------- */

function renderVervalForm() {
  const now = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
  $('#vp-content').innerHTML = `
    ${canVerify() ? '' : vervalLoginNotice()}
    <div class="card p-5 sm:p-7">
      <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div class="flex items-start gap-3 min-w-0">
          <div class="w-11 h-11 rounded-xl bg-teal-600 text-white grid place-items-center flex-none">${icon('verif', 'w-5 h-5')}</div>
          <div class="min-w-0">
            <p class="text-lg font-extrabold text-teal-800 leading-tight">Formulir Verval Izin Praktik</p>
            <p class="text-xs text-slate-500 mt-0.5">Verifikasi &amp; Validasi Tenaga Medis / Tenaga Kesehatan &bull; SIMANTRI Dinkes Kota Samarinda</p>
          </div>
        </div>
        <span class="badge bg-teal-100 text-teal-700 ring-1 ring-teal-200">28 Field &bull; Auto-Draft</span>
      </div>

      <div id="draft-status" class="draft-status mb-4"></div>

      <form id="verval-form" autocomplete="off" novalidate>
        <div class="verval-grid">

          <div class="verval-section"><span class="verval-section-title">A &bull; Data Pribadi Nakes</span></div>

          <div class="verval-field">
            <label>Timestamp</label>
            <input type="text" id="v-timestamp" class="input input-readonly" value="${esc(now)}" readonly>
            <small class="verval-hint">Terisi otomatis oleh sistem</small>
          </div>

          <div class="verval-field">
            <label>NIK (16 digit) <span class="req">*</span></label>
            <div class="flex gap-2">
              <input type="text" id="v-nik" class="input" inputmode="numeric" maxlength="16" placeholder="6472xxxxxxxxxxxx">
              <button type="button" class="btn btn-soft flex-none" id="btn-verval-cari">${icon('cek', 'w-4 h-4')} Cari</button>
            </div>
            <small id="nik-status" class="verval-hint">Isi 16 digit lalu klik Cari untuk isi otomatis</small>
          </div>

          <div class="verval-field"><label>Nama Lengkap (dengan gelar) <span class="req">*</span></label><input type="text" id="v-nama" class="input" placeholder="dr. Nama Lengkap, Sp.XX"></div>
          <div class="verval-field"><label>Jenis Kelamin <span class="req">*</span></label><select id="v-jk" class="input"><option value="">— Pilih —</option><option>Laki-laki</option><option>Perempuan</option></select></div>
          <div class="verval-field"><label>Tempat Lahir</label><input type="text" id="v-tempat-lahir" class="input" placeholder="Samarinda"></div>
          <div class="verval-field"><label>Tanggal Lahir</label><input type="date" id="v-tgl-lahir" class="input"></div>
          <div class="verval-field verval-span"><label>Alamat Sesuai KTP</label><textarea id="v-alamat-ktp" class="input" rows="2" placeholder="Jl. ... RT/RW ..."></textarea></div>

          <div class="verval-section"><span class="verval-section-title">B &bull; STR &amp; SIP</span></div>

          <div class="verval-field"><label>Nomor STR <span class="req">*</span></label><input type="text" id="v-nomor-str" class="input" placeholder="30.1.4.31.01725"></div>
          <div class="verval-field"><label>Status STR</label><select id="v-status-str" class="input">${optSimple(['Aktif', 'Tidak Aktif', 'Expired'], 'Aktif')}</select></div>
          <div class="verval-field"><label>Status SIP</label><select id="v-status-sip" class="input">${optSimple(['Aktif', 'Proses', 'Expired', 'Tidak Ada'], 'Aktif')}</select></div>
          <div class="verval-field"><label>Nomor SIP</label><input type="text" id="v-nomor-sip" class="input" placeholder="446/STR/2024"></div>
          <div class="verval-field"><label>Masa Berlaku SIP</label><input type="date" id="v-masa-sip" class="input"></div>
          <div class="verval-field"><label>Pendidikan Sesuai STR</label><input type="text" id="v-pendidikan-str" class="input" placeholder="S1 Kedokteran / D3 Keperawatan / dst"></div>
          <div class="verval-field"><label>Nomor STR (Duplikat Otomatis)</label><input type="text" id="v-str-duplicate" class="input input-readonly" readonly><small class="verval-hint">Mengikuti isian Nomor STR</small></div>
          <div class="verval-field"><label>Nomor SIP (Duplikat Otomatis)</label><input type="text" id="v-sip-duplicate" class="input input-readonly" readonly><small class="verval-hint">Mengikuti isian Nomor SIP</small></div>

          <div class="verval-section"><span class="verval-section-title">C &bull; Unit Kerja / Tempat Praktik</span></div>

          <div class="verval-field"><label>Unit Kerja / Fasyankes <span class="req">*</span></label><input type="text" id="v-unit-kerja" class="input" placeholder="Puskesmas / Klinik / Praktik Mandiri"></div>
          <div class="verval-field verval-span"><label>Alamat Unit Kerja</label><textarea id="v-alamat-unit" class="input" rows="2"></textarea></div>
          <div class="verval-field"><label>Desa / Kelurahan Unit Kerja</label><input type="text" id="v-desa" class="input"></div>
          <div class="verval-field"><label>Kecamatan Unit Kerja</label><select id="v-kecamatan" class="input"><option value="">— Pilih Kecamatan —</option>${KECAMATAN_SAMARINDA.map((k) => `<option>${k}</option>`).join('')}</select></div>
          <div class="verval-field"><label>Status Unit Praktik di SatuSehat SDMK</label><select id="v-satu-sehat" class="input">${optSimple(['Sudah', 'Belum'], 'Sudah')}</select></div>
          <div class="verval-field"><label>Jam Operasional / Praktik</label><input type="text" id="v-jam" class="input" placeholder="Senin-Jumat 08.00-16.00"></div>

          <div class="verval-section"><span class="verval-section-title">D &bull; Kelengkapan SOP &amp; SDMK</span></div>

          <div class="verval-field"><label>SOP Pelayanan</label><select id="v-sop-pelayanan" class="input">${optSimple(['Ada', 'Tidak Ada'], 'Ada')}</select></div>
          <div class="verval-field"><label>SOP Profesi</label><select id="v-sop-profesi" class="input">${optSimple(['Ada', 'Tidak Ada'], 'Ada')}</select></div>
          <div class="verval-field"><label>SOP Etika</label><select id="v-sop-etika" class="input">${optSimple(['Ada', 'Tidak Ada'], 'Ada')}</select></div>
          <div class="verval-field"><label>SDMK Named</label><select id="v-sdmk-named" class="input">${optSimple(['Ada', 'Tidak Ada'], 'Ada')}</select></div>
          <div class="verval-field"><label>SDMK Nakes</label><select id="v-sdmk-nakes" class="input">${optSimple(['Ada', 'Tidak Ada'], 'Ada')}</select></div>
          <div class="verval-field"><label>SDMK Admin</label><select id="v-sdmk-admin" class="input">${optSimple(['Ada', 'Tidak Ada'], 'Ada')}</select></div>

          <div class="verval-section"><span class="verval-section-title">E &bull; Catatan Rekomendasi</span></div>

          <div class="verval-field verval-span"><label>Catatan Rekomendasi Verifikator</label><textarea id="v-catatan" class="input" rows="3" placeholder="Catatan verifikator…"></textarea></div>
        </div>

        <div class="verval-actions">
          <button type="button" class="btn btn-ghost" id="btn-verval-preview">${icon('eye', 'w-4 h-4')} Preview Data</button>
          <button type="submit" class="btn btn-primary btn-submit" ${canVerify() ? '' : 'disabled title="Masuk sebagai Verifikator/Admin dulu"'}>${icon('send', 'w-4 h-4')} Simpan &amp; Kirim Verval</button>
          <button type="button" class="btn btn-ghost" id="btn-verval-reset">${icon('undo', 'w-4 h-4')} Reset</button>
        </div>
      </form>
    </div>
    <p class="text-center text-[.7rem] text-slate-400 mt-3">Data tersimpan ke tabel <b>verval_izin_praktik</b> &bull; draf formulir otomatis tersinkron ke database per pengguna</p>`;

  const form = $('#verval-form');
  form.addEventListener('submit', (e) => { e.preventDefault(); submitVerval(); });
  $('#btn-verval-preview').addEventListener('click', previewVerval);
  $('#btn-verval-reset').addEventListener('click', resetFormVerval);
  $('#btn-verval-cari').addEventListener('click', () => cariVervalByNik());
  $('#v-nik').addEventListener('input', validateVervalNikInput);
  $('#v-nik').addEventListener('input', debounce(() => {
    const v = $('#v-nik').value.trim();
    if (v.length === 16 && !$('#v-nama').value.trim()) cariVervalByNik();
  }, 700));
  $('#v-nomor-str').addEventListener('input', mirrorDuplikatStrSip);
  $('#v-nomor-sip').addEventListener('input', mirrorDuplikatStrSip);
  form.addEventListener('input', jadwalkanDraftVerval);
  form.addEventListener('change', jadwalkanDraftVerval);
  muatDraftVerval();
}

function validateVervalNikInput() {
  const el = $('#v-nik');
  el.value = el.value.replace(/\D/g, '').slice(0, 16);
  const st = $('#nik-status');
  if (!st) return;
  if (el.value.length === 16) {
    el.style.borderColor = 'var(--primary)';
    st.textContent = 'Format NIK valid ✓';
    st.className = 'verval-hint verval-status-ok';
  } else {
    el.style.borderColor = '';
    st.textContent = el.value.length ? `${el.value.length}/16 digit` : 'Isi 16 digit lalu klik Cari untuk isi otomatis';
    st.className = 'verval-hint';
  }
}

function mirrorDuplikatStrSip() {
  const str = $('#v-nomor-str'), dup = $('#v-str-duplicate');
  if (str && dup) dup.value = str.value;
  const sip = $('#v-nomor-sip'), dupS = $('#v-sip-duplicate');
  if (sip && dupS) dupS.value = sip.value;
}

/** Isi form dari objek kolom-DB. onlyEmpty=true → hanya field yang masih kosong. */
function isiFormDariData(d, onlyEmpty = false) {
  for (const [col, id] of Object.entries(VERVAL_DB_TO_FORM)) {
    const el = document.getElementById(id);
    if (!el || d[col] == null || String(d[col]).trim() === '') continue;
    const val = String(d[col]);
    if (onlyEmpty && el.value.trim() !== '') continue;
    if (el.tagName === 'SELECT') {
      const ada = Array.from(el.options).some((o) => o.value === val || o.textContent === val);
      if (ada) el.value = val;
    } else {
      el.value = val;
    }
  }
  mirrorDuplikatStrSip();
}

/** Cari data berdasarkan NIK: verval sebelumnya → tenaga medis → tenaga kesehatan. */
async function cariVervalByNik() {
  const st = $('#nik-status');
  const setSt = (txt, cls = '') => { if (st) { st.textContent = txt; st.className = cls ? `verval-hint ${cls}` : 'verval-hint'; } };
  const nik = $('#v-nik')?.value.trim() || '';
  if (nik.length !== 16) { setSt('NIK harus tepat 16 digit.', 'verval-status-warn'); return; }
  if (!SUPABASE_TERKONFIGURASI) { setSt('Supabase belum dikonfigurasi — isi js/config.js.', 'verval-status-warn'); return; }
  setSt('Mencari data…');
  try {
    const { data: verval, error } = await supabase.from('verval_izin_praktik')
      .select('*').eq('nik', nik).order('created_at', { ascending: false }).limit(1);
    if (error) throw error;
    if (verval?.length) {
      isiFormDariData(verval[0], false);
      setSt('Data verval sebelumnya ditemukan ✓ formulir terisi otomatis', 'verval-status-ok');
      toast('Data verval sebelumnya ditemukan & diisi otomatis.');
      return;
    }
    const { data: tm } = await supabase.from('tenaga_medis').select('*').eq('nik', nik).limit(1);
    if (tm?.length) {
      isiFormDariData({
        nama_lengkap: tm[0].nama_lengkap, nomor_str: tm[0].no_str, nomor_sip: tm[0].no_sip,
        unit_kerja: tm[0].tempat_praktik, masa_berlaku_sip: tm[0].masa_berlaku_sip,
      }, true);
      setSt('Cocok dengan Data Tenaga Medis ✓ field kosong terisi', 'verval-status-ok');
      toast('Data cocok dengan Data Tenaga Medis — field kosong terisi otomatis.');
      return;
    }
    const { data: tk } = await supabase.from('tenaga_kesehatan').select('*').eq('nik', nik).limit(1);
    if (tk?.length) {
      isiFormDariData({
        nama_lengkap: tk[0].nama_lengkap, nomor_str: tk[0].no_str, nomor_sip: tk[0].no_sip,
        unit_kerja: tk[0].tempat_praktik, masa_berlaku_sip: tk[0].masa_berlaku_sip,
      }, true);
      setSt('Cocok dengan Data Tenaga Kesehatan ✓ field kosong terisi', 'verval-status-ok');
      toast('Data cocok dengan Data Tenaga Kesehatan — field kosong terisi otomatis.');
      return;
    }
    setSt('NIK baru — silakan lengkapi formulir.');
  } catch (e) {
    setSt('Pencarian gagal: ' + friendlyError(e), 'verval-status-warn');
  }
}

/* ---------- Draf otomatis (tabel verval_draft, bukan localStorage) ---------- */

function jadwalkanDraftVerval() {
  clearTimeout(vervalDraftTimer);
  vervalDraftTimer = setTimeout(simpanDraftVerval, 1500);
}

async function simpanDraftVerval() {
  const form = $('#verval-form');
  if (!form) return;
  if (!SUPABASE_TERKONFIGURASI || !state.user) {
    setDraftStatus(`${icon('info', 'w-3.5 h-3.5')} Masuk untuk mengaktifkan simpan-otomatis draf`, 'warn');
    return;
  }
  const data = {};
  form.querySelectorAll('input, select, textarea').forEach((el) => {
    if (el.id && el.id !== 'v-timestamp') data[el.id] = el.value;
  });
  setDraftStatus(`${icon('save', 'w-3.5 h-3.5')} Menyimpan draf…`, 'saving');
  try {
    const { error } = await supabase.from('verval_draft')
      .upsert({ user_id: state.user.id, form: 'praktik', data, updated_at: new Date().toISOString() }, { onConflict: 'user_id,form' });
    if (error) throw error;
    setDraftStatus(`${icon('check', 'w-3.5 h-3.5')} Draf tersimpan otomatis • ${new Date().toLocaleTimeString('id-ID')}`);
  } catch (e) {
    console.warn('Draft verval gagal:', e.message);
    setDraftStatus(`${icon('alert', 'w-3.5 h-3.5')} Draf gagal tersimpan: ${esc(friendlyError(e))}`, 'warn');
  }
}

async function muatDraftVerval() {
  if (!SUPABASE_TERKONFIGURASI || !state.user) {
    setDraftStatus(`${icon('info', 'w-3.5 h-3.5')} Masuk sebagai verifikator/admin untuk mengaktifkan draf otomatis`, 'warn');
    return;
  }
  try {
    const { data, error } = await supabase.from('verval_draft')
      .select('data, updated_at').eq('user_id', state.user.id).eq('form', 'praktik').maybeSingle();
    if (error) throw error;
    if (data?.data && Object.keys(data.data).length) {
      Object.entries(data.data).forEach(([id, v]) => {
        const el = document.getElementById(id);
        if (el && v != null) el.value = v;
      });
      mirrorDuplikatStrSip();
      setDraftStatus(`${icon('check', 'w-3.5 h-3.5')} Draf dipulihkan otomatis • tersimpan ${fmtDateTime(data.updated_at)}`);
    } else {
      setDraftStatus(`${icon('save', 'w-3.5 h-3.5')} Simpan-otomatis draf aktif (tersinkron ke database)`);
    }
  } catch (e) {
    console.warn('Muat draft verval gagal:', e.message);
    setDraftStatus(`${icon('alert', 'w-3.5 h-3.5')} Draf tidak dapat dimuat`, 'warn');
  }
}

async function hapusDraftVerval(silent = false) {
  if (!SUPABASE_TERKONFIGURASI || !state.user) return;
  try {
    await supabase.from('verval_draft').delete().eq('user_id', state.user.id).eq('form', 'praktik');
  } catch (e) {
    if (!silent) toast(friendlyError(e), 'error');
  }
}

function resetFormVerval() {
  confirmDialog({
    title: 'Reset Formulir Verval',
    message: 'Seluruh isian formulir dan draf yang tersimpan akan dihapus. Lanjutkan?',
    onYes: async () => {
      await hapusDraftVerval(true);
      renderVervalForm();
      toast('Formulir dikosongkan.');
    },
  });
}

/* ---------- Kumpul, preview & submit ---------- */

function kumpulDataVerval() {
  const g = (id) => document.getElementById(id)?.value.trim() || '';
  const orNull = (v) => (v === '' ? null : v);
  return {
    nik: g('v-nik'), nama_lengkap: g('v-nama'), jenis_kelamin: orNull(g('v-jk')),
    tempat_lahir: orNull(g('v-tempat-lahir')), tanggal_lahir: orNull(g('v-tgl-lahir')),
    alamat_ktp: orNull(g('v-alamat-ktp')), nomor_str: g('v-nomor-str'),
    status_str: orNull(g('v-status-str')), status_sip: orNull(g('v-status-sip')),
    nomor_sip: orNull(g('v-nomor-sip')), masa_berlaku_sip: orNull(g('v-masa-sip')),
    unit_kerja: g('v-unit-kerja'), alamat_unit: orNull(g('v-alamat-unit')),
    desa_kelurahan: orNull(g('v-desa')), kecamatan: orNull(g('v-kecamatan')),
    status_satu_sehat: orNull(g('v-satu-sehat')), sop_pelayanan: orNull(g('v-sop-pelayanan')),
    sop_profesi: orNull(g('v-sop-profesi')), sop_etika: orNull(g('v-sop-etika')),
    sdmk_named: orNull(g('v-sdmk-named')), sdmk_nakes: orNull(g('v-sdmk-nakes')),
    sdmk_admin: orNull(g('v-sdmk-admin')), jam_operasional: orNull(g('v-jam')),
    catatan_rekomendasi: orNull(g('v-catatan')), pendidikan_str: orNull(g('v-pendidikan-str')),
  };
}

function previewVerval() {
  const d = kumpulDataVerval();
  if (!/^\d{16}$/.test(d.nik)) { toast('Lengkapi NIK 16 digit sebelum preview.', 'error'); return; }
  if (!d.nama_lengkap || !d.unit_kerja) { toast('Nama Lengkap dan Unit Kerja wajib diisi sebelum preview.', 'error'); return; }
  const rows = VERVAL_FIELDS
    .filter(([k]) => !['kode_verifikasi', 'verifikator', 'created_at'].includes(k))
    .map(([k, label]) => {
      const v = (k === 'tanggal_lahir' || k === 'masa_berlaku_sip') ? fmtDate(d[k]) : d[k];
      return `<div class="detail-label">${label}</div><div class="detail-value">${esc(v || '—')}</div>`;
    }).join('');
  openModal({
    title: 'Preview Data Verval', size: 'lg',
    body: `<p class="text-xs text-slate-400 mb-3">Periksa kembali seluruh isian sebelum dikirim ke database SIMANTRI.</p>
           <div class="detail-grid">${rows}</div>`,
    footer: `<button class="btn btn-ghost" data-close="1">Kembali Edit</button>
             <button class="btn btn-primary" id="btn-verval-kirim">${icon('send', 'w-4 h-4')} Ya, Kirim Sekarang</button>`,
    onOpen: (root) => root.querySelector('#btn-verval-kirim').addEventListener('click', () => {
      closeModal();
      submitVerval();
    }),
  });
}

async function submitVerval() {
  const d = kumpulDataVerval();
  if (!/^\d{16}$/.test(d.nik)) { toast('NIK harus tepat 16 digit angka.', 'error'); return; }
  if (!d.nama_lengkap) { toast('Nama Lengkap wajib diisi.', 'error'); return; }
  if (!d.nomor_str) { toast('Nomor STR wajib diisi.', 'error'); return; }
  if (!d.unit_kerja) { toast('Unit Kerja / Fasyankes wajib diisi.', 'error'); return; }
  if (!SUPABASE_TERKONFIGURASI) { toast('Supabase belum dikonfigurasi — isi js/config.js.', 'error'); return; }
  if (!canVerify()) { toast('Hanya Verifikator/Admin yang dapat mengirim verval. Silakan masuk dahulu.', 'error'); return; }

  const btns = $$('#verval-form button');
  btns.forEach((b) => { b.disabled = true; });
  try {
    const kode = `SIMANTRI-VERVAL-${d.nik}-${Date.now()}`;
    const { error } = await supabase.from('verval_izin_praktik')
      .insert({ ...d, kode_verifikasi: kode, verifikator: state.user?.email || null });
    if (error) throw error;
    await hapusDraftVerval(true);
    toast('Data verval berhasil dikirim ke database.');
    showVervalSukses(d, kode);
  } catch (err) {
    toast(friendlyError(err), 'error');
    btns.forEach((b) => { b.disabled = false; });
  }
}

function showVervalSukses(d, kode) {
  const ts = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' });
  openModal({
    title: 'Verval Berhasil Disimpan', size: 'sm',
    body: `<div class="text-center py-2">
      <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center mx-auto mb-3">${icon('check', 'w-8 h-8')}</div>
      <p class="font-extrabold text-slate-800 mb-1">Data verval berhasil disimpan!</p>
      <p class="text-xs text-slate-500 leading-relaxed mb-4">Data telah terkirim ke database SIMANTRI untuk tindak lanjut persetujuan izin praktik.</p>
      <div class="rounded-xl bg-slate-50 border border-slate-100 p-4 text-left text-[.78rem] space-y-1.5">
        <p><span class="text-slate-400">NIK:</span> <b>${esc(d.nik)}</b></p>
        <p><span class="text-slate-400">Nama:</span> <b>${esc(d.nama_lengkap)}</b></p>
        <p><span class="text-slate-400">Unit Kerja:</span> ${esc(d.unit_kerja)}</p>
        <p><span class="text-slate-400">Waktu:</span> ${esc(ts)}</p>
        <p class="pt-1"><span class="text-slate-400">Kode Verifikasi:</span><br><span class="kode-chip break-all">${esc(kode)}</span></p>
      </div>
    </div>`,
    footer: `<button class="btn btn-primary" id="btn-verval-selesai">Isi Formulir Baru</button>`,
    onOpen: (root) => root.querySelector('#btn-verval-selesai').addEventListener('click', () => {
      closeModal();
      renderVervalForm();
    }),
  });
}

/* ---------- Tab 2: RIWAYAT VERVAL ---------- */

function renderRiwayatVerval() {
  $('#vp-content').innerHTML = `
    <div class="card p-4 sm:p-5">
      <div class="flex flex-wrap items-center justify-between gap-2.5 mb-3.5">
        <div>
          <p class="text-sm font-extrabold text-slate-800">Riwayat Verval Izin Praktik</p>
          <p class="text-xs text-slate-400">Seluruh hasil pengisian formulir verval. Klik baris untuk detail lengkap.</p>
        </div>
        <div class="search-box">${icon('search', 'w-4 h-4 text-slate-400')}<input id="rv-q" placeholder="Cari NIK / nama / unit kerja…"></div>
      </div>
      <div id="rv-count"></div>
      <div id="rv-list">${skeletonRows(4)}</div>
    </div>`;
  const q = $('#rv-q');
  q.addEventListener('input', debounce(() => muatRiwayatVerval(q.value.trim()), 350));
  muatRiwayatVerval('');
}

async function muatRiwayatVerval(q) {
  const list = $('#rv-list');
  if (!list) return;
  try {
    const rows = await fetchRows('verval_izin_praktik', {
      search: q, searchCols: ['nik', 'nama_lengkap', 'unit_kerja'], limit: 100,
    });
    const cnt = $('#rv-count');
    if (cnt) cnt.innerHTML = `<p class="text-[.7rem] text-slate-400 mb-2">Menampilkan ${rows.length} catatan verval${q ? ` untuk pencarian “${esc(q)}”` : ''}.</p>`;
    if (!rows.length) { list.innerHTML = emptyState('Belum ada catatan verval.'); return; }
    list.innerHTML = `<div class="space-y-2.5">${rows.map((r) => `
      <div class="rv-row card p-3.5 flex flex-col sm:flex-row sm:items-center gap-3" data-id="${r.id}">
        <div class="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 grid place-items-center flex-none">${icon('verif', 'w-5 h-5')}</div>
        <div class="flex-1 min-w-0">
          <p class="font-bold text-[.84rem] text-slate-700">${esc(r.nama_lengkap)}</p>
          <p class="text-xs text-slate-500 truncate">NIK ${esc(r.nik)} &bull; ${esc(r.unit_kerja)}${r.kecamatan ? ' • ' + esc(r.kecamatan) : ''}</p>
          <p class="text-[.66rem] text-slate-400 mt-0.5">Verval: ${fmtDateTime(r.created_at)}${r.verifikator ? ' • oleh ' + esc(r.verifikator) : ''}</p>
        </div>
        <div class="flex items-center gap-2 flex-none flex-wrap">
          <span class="badge ${VERVAL_SIP_BADGE[r.status_sip] || 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'}">SIP ${esc(r.status_sip || '-')}</span>
          <span class="kode-chip">${esc(trunc(r.kode_verifikasi || '-', 26))}</span>
        </div>
      </div>`).join('')}</div>`;
    $$('#rv-list .rv-row').forEach((el) => el.addEventListener('click', () => {
      const row = rows.find((r) => String(r.id) === el.dataset.id);
      if (row) detailVervalModal(row, () => muatRiwayatVerval($('#rv-q')?.value.trim() || ''));
    }));
  } catch (e) {
    list.innerHTML = errorBlock(e);
  }
}

function detailVervalModal(r, onDeleted = null) {
  const rows = VERVAL_FIELDS.map(([k, label]) => {
    let v = r[k];
    if (k === 'tanggal_lahir' || k === 'masa_berlaku_sip') v = fmtDate(v);
    if (k === 'created_at') v = fmtDateTime(v);
    if (k === 'kode_verifikasi' && v) return `<div class="detail-label">${label}</div><div class="detail-value"><span class="kode-chip">${esc(v)}</span></div>`;
    return `<div class="detail-label">${label}</div><div class="detail-value">${esc(v || '—')}</div>`;
  }).join('');
  openModal({
    title: `Detail Verval: ${esc(r.nama_lengkap)}`, size: 'xl',
    body: `<div class="detail-grid">${rows}</div>`,
    footer: `${isAdmin() ? `<button class="btn btn-danger" id="btn-del-verval">${icon('trash', 'w-4 h-4')} Hapus</button>` : ''}
             <button class="btn btn-ghost" data-close="1">Tutup</button>`,
    onOpen: (root) => {
      const del = root.querySelector('#btn-del-verval');
      if (del) del.addEventListener('click', () => confirmDialog({
        title: 'Hapus Catatan Verval',
        message: `Yakin menghapus verval <b>${esc(r.nama_lengkap)}</b> (NIK ${esc(r.nik)})? Tindakan ini tidak dapat dibatalkan.`,
        onYes: async () => {
          const { error } = await supabase.from('verval_izin_praktik').delete().eq('id', r.id);
          if (error) throw error;
          toast('Catatan verval dihapus.');
          if (onDeleted) onDeleted();
        },
      }));
    },
  });
}

/* =========================================================
 * 13C. VERIFIKASI FASKES — FORMULIR VERVAL FASYANKES
 *      ID otomatis VF-YYYYMMDD-XXXXX • SDM Kesehatan dinamis
 *      per jenis • draf tersinkron ke verval_draft (form=faskes)
 *      • hasil ke tabel verval_fasyankes
 * ========================================================= */

let vfTab = 'form';
let vfDraftTimer = null;

const VERVAL_FAS_BADGE = {
  'Layak': 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  'Tidak Layak': 'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
  'Perbaikan': 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  'Pending': 'bg-sky-100 text-sky-700 ring-1 ring-sky-200',
  'Tidak Valid': 'bg-slate-200 text-slate-700 ring-1 ring-slate-300',
};

/* Standar SDM Kesehatan per jenis fasyankes (dinamis mengikuti pilihan jenis) */
const SDM_FASYANKES = {
  'Rumah Sakit': ['Dokter Umum', 'Dokter Spesialis', 'Dokter Gigi', 'Perawat', 'Bidan', 'Apoteker', 'ATLM', 'Nutrisionis / Ahli Gizi', 'Fisioterapis', 'Sanitarian'],
  'Puskesmas': ['Dokter', 'Dokter Gigi', 'Perawat', 'Bidan', 'Apoteker / TTF', 'ATLM', 'Nutrisionis / Ahli Gizi', 'Sanitarian', 'Petugas Promosi Kesehatan'],
  'Klinik': ['Dokter', 'Dokter Gigi', 'Perawat', 'Bidan', 'Apoteker', 'ATLM', 'Nutrisionis / Ahli Gizi', 'Fisioterapis'],
  'Apotik': ['Apoteker', 'Tenaga Teknis Farmasi (TTF)'],
  'Toko Obat': ['Tenaga Teknis Farmasi (TTF)'],
  'Optik': ['Optometris', 'Tenaga Teknis Alat Kesehatan'],
  'PBF (Pedagang Besar Farmasi)': ['Apoteker PBF', 'Tenaga Teknis Farmasi (TTF)'],
  'Tempat Praktik Mandiri': ['Dokter', 'Dokter Gigi', 'Bidan', 'Perawat', 'Fisioterapis'],
};

/* Pasangan kolom-DB → label (untuk modal detail riwayat) */
const VERVAL_FAS_FIELDS = [
  ['kode_verval', 'ID Verval'], ['tanggal_verval', 'Tanggal Verval'],
  ['nomor_unit', 'Nomor Unit'], ['nama_fasyankes', 'Nama Fasyankes'],
  ['jenis_fasyankes', 'Jenis Fasyankes'], ['nama_pemilik', 'Nama Pemilik'],
  ['penanggung_jawab', 'Penanggung Jawab'], ['alamat_lengkap', 'Alamat Lengkap'],
  ['kelurahan', 'Kelurahan / Desa'], ['kecamatan', 'Kecamatan'],
  ['nomor_hp', 'Nomor HP/WA'], ['email', 'Email'],
  ['sdm_kesehatan', 'SDM Kesehatan Terverifikasi'],
  ['status_verifikasi', 'Hasil Verifikasi'], ['catatan_verifikasi', 'Catatan Verifikasi'],
  ['verifikator', 'Verifikator'], ['created_at', 'Waktu Disimpan'],
];

function genKodeVf() {
  const n = new Date();
  const p = (x) => String(x).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `VF-${n.getFullYear()}${p(n.getMonth() + 1)}${p(n.getDate())}-${rand}`;
}

function setDraftStatusVf(html, mode = 'ok') {
  const st = $('#draft-status-vf');
  if (!st) return;
  st.classList.toggle('saving', mode === 'saving');
  st.classList.toggle('verval-status-warn', mode === 'warn');
  st.innerHTML = html;
}

/* ---------- Halaman Verifikasi Faskes (3 tab) ---------- */

async function mountVervalFaskes() {
  const tabs = [
    ['form', 'Formulir Verval', 'faskes'],
    ['riwayat', 'Riwayat Verval', 'cek'],
    ['pengajuan', 'Pengajuan Faskes', 'shield'],
  ];
  $('#page-content').innerHTML = `
    ${SUPABASE_TERKONFIGURASI ? '' : setupNotice()}
    <div class="flex flex-wrap items-center gap-2 mb-4" id="vfc-tabs">
      ${tabs.map(([k, l, ic]) => `<button class="chip ${vfTab === k ? 'active' : ''}" data-tab="${k}">${icon(ic, 'w-4 h-4')} ${l}</button>`).join('')}
    </div>
    <div id="vfc-content"></div>`;
  $$('#vfc-tabs [data-tab]').forEach((b) => b.addEventListener('click', () => {
    if (vfTab === b.dataset.tab) return;
    vfTab = b.dataset.tab;
    $$('#vfc-tabs [data-tab]').forEach((x) => x.classList.toggle('active', x.dataset.tab === vfTab));
    renderVfTab();
  }));
  renderVfTab();
}

function renderVfTab() {
  if (vfTab === 'riwayat') return renderRiwayatVf();
  if (vfTab === 'pengajuan') return mountVerifikasi('faskes', '#vfc-content');
  renderVfForm();
}

/* ---------- Tab 1: FORMULIR VERVAL FASYANKES ---------- */

function renderVfForm() {
  const kode = genKodeVf();
  const now = new Date();
  const tglPanjang = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const verifikatorAwal = esc(state.profile?.nama || state.user?.email || '');
  $('#vfc-content').innerHTML = `
    ${canVerify() ? '' : vervalLoginNotice()}
    <div class="card p-5 sm:p-7">
      <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div class="flex items-start gap-3 min-w-0">
          <div class="w-11 h-11 rounded-xl bg-teal-600 text-white grid place-items-center flex-none">${icon('faskes', 'w-5 h-5')}</div>
          <div class="min-w-0">
            <p class="text-lg font-extrabold text-teal-800 leading-tight">Formulir Verval Fasyankes</p>
            <p class="text-xs text-slate-500 mt-0.5">Verifikasi &amp; Validasi Fasilitas Pelayanan Kesehatan &bull; SIMANTRI Dinkes Kota Samarinda</p>
          </div>
        </div>
        <span class="vf-id-badge">ID Verval<br><code>${kode}</code></span>
      </div>

      <div class="vf-info-panel">
        <div>
          <p class="vf-info-label">ID Pendaftaran</p>
          <p class="vf-info-value">${kode}</p>
        </div>
        <div class="vf-info-sep"></div>
        <div>
          <p class="vf-info-label">Tanggal Input</p>
          <p class="vf-info-value tanggal">${esc(tglPanjang)}</p>
        </div>
      </div>

      <div id="draft-status-vf" class="draft-status mb-4"></div>

      <form id="vf-form" autocomplete="off" novalidate>
        <div class="verval-grid">

          <div class="verval-section"><span class="verval-section-title">1 &bull; Data Fasilitas Kesehatan</span></div>

          <div class="verval-field"><label>Nomor Unit <span class="req">*</span></label><input type="text" id="vf-nomor-unit" class="input" placeholder="Contoh: UNIT-001 / No. Izin Operasional"></div>
          <div class="verval-field"><label>Nama Fasyankes <span class="req">*</span></label><input type="text" id="vf-nama-fasyankes" class="input" placeholder="Nama lengkap fasilitas kesehatan"></div>
          <div class="verval-field"><label>Jenis Fasyankes <span class="req">*</span></label><select id="vf-jenis-fasyankes" class="input">
            <option value="">— Pilih Jenis Fasyankes —</option>
            ${Object.keys(SDM_FASYANKES).map((j) => `<option value="${esc(j)}">${esc(j)}</option>`).join('')}
          </select></div>
          <div class="verval-field"><label>Nama Pemilik <span class="req">*</span></label><input type="text" id="vf-pemilik" class="input" placeholder="Nama lengkap pemilik/usaha"></div>
          <div class="verval-field"><label>Nama Penanggung Jawab <span class="req">*</span></label><input type="text" id="vf-pj" class="input" placeholder="Nama penanggung jawab operasional"></div>

          <div class="verval-section"><span class="verval-section-title">2 &bull; Alamat &amp; Kontak</span></div>

          <div class="verval-field verval-span"><label>Alamat Lengkap <span class="req">*</span></label><textarea id="vf-alamat" class="input" rows="2" placeholder="Jalan, RT/RW, kelompok perumahan, dll."></textarea></div>
          <div class="verval-field"><label>Kelurahan / Desa <span class="req">*</span></label><input type="text" id="vf-kelurahan" class="input" placeholder="Nama Kelurahan/Desa"></div>
          <div class="verval-field"><label>Kecamatan <span class="req">*</span></label><input type="text" id="vf-kecamatan" class="input" list="daftar-kecamatan" placeholder="Nama Kecamatan">
            <datalist id="daftar-kecamatan">${KECAMATAN_SAMARINDA.map((k) => `<option value="${esc(k)}"></option>`).join('')}</datalist>
            <small class="verval-hint">Ketik untuk saran kecamatan di Kota Samarinda</small>
          </div>
          <div class="verval-field"><label>Nomor HP/WA <span class="req">*</span></label><input type="tel" id="vf-hp" class="input" placeholder="08xxxxxxxxxx"></div>
          <div class="verval-field"><label>Email</label><input type="email" id="vf-email" class="input" placeholder="email@contoh.com"></div>

          <div class="verval-section"><span class="verval-section-title">3 &bull; Data SDM Kesehatan</span></div>

          <div class="verval-field verval-span">
            <label>SDM Kesehatan Terverifikasi <span class="verval-hint" style="display:inline;margin-left:.35rem;font-style:italic">sesuai standar jenis fasyankes</span></label>
            <div class="vf-sdm-box" id="vf-sdm-container"></div>
          </div>

          <div class="verval-section"><span class="verval-section-title">4 &bull; Hasil Verifikasi</span></div>

          <div class="verval-field"><label>Hasil Verifikasi <span class="req">*</span></label><select id="vf-status-verifikasi" class="input">
            <option value="">— Pilih Hasil Verifikasi —</option>
            <option value="Layak">Layak / Memenuhi Syarat</option>
            <option value="Tidak Layak">Tidak Layak / Tidak Memenuhi Syarat</option>
            <option value="Perbaikan">Perbaikan / Revisi Data</option>
            <option value="Pending">Pending / Menunggu Kelengkapan</option>
            <option value="Tidak Valid">Tidak Valid / Data Palsu</option>
          </select></div>
          <div class="verval-field"><label>Nama Verifikator Dinkes <span class="req">*</span></label><input type="text" id="vf-verifikator" class="input" value="${verifikatorAwal}" placeholder="Nama lengkap verifikator"></div>
          <div class="verval-field verval-span"><label>Catatan Verifikasi</label><textarea id="vf-catatan" class="input" rows="3" placeholder="Temuan di lapangan, rekomendasi, atau hal yang perlu diperbaiki…"></textarea></div>
        </div>

        <input type="hidden" id="vf-id" value="${kode}">
        <input type="hidden" id="vf-tanggal" value="${todayISO()}">

        <div class="verval-actions">
          <button type="submit" class="btn btn-primary btn-submit" ${canVerify() ? '' : 'disabled title="Masuk sebagai Verifikator/Admin dulu"'}>${icon('save', 'w-4 h-4')} Simpan &amp; Kirim Verval Fasyankes</button>
          <button type="button" class="btn btn-ghost" id="btn-vf-reset">${icon('undo', 'w-4 h-4')} Reset Formulir</button>
        </div>
      </form>
    </div>
    <p class="text-center text-[.7rem] text-slate-400 mt-3">Data tersimpan ke tabel <b>verval_fasyankes</b> &bull; draf formulir otomatis tersinkron ke database per pengguna</p>`;

  renderSdmVf('');
  const form = $('#vf-form');
  form.addEventListener('submit', (e) => { e.preventDefault(); submitVfForm(); });
  $('#vf-jenis-fasyankes').addEventListener('change', () => renderSdmVf($('#vf-jenis-fasyankes').value));
  $('#btn-vf-reset').addEventListener('click', resetVfForm);
  form.addEventListener('input', jadwalkanDraftVf);
  form.addEventListener('change', jadwalkanDraftVf);
  muatDraftVf();
}

/* Daftar SDM Kesehatan dinamis mengikuti jenis fasyankes terpilih */
function renderSdmVf(jenis, checked = []) {
  const box = $('#vf-sdm-container');
  if (!box) return;
  if (!jenis || !SDM_FASYANKES[jenis]) {
    box.innerHTML = `<p class="text-xs text-slate-400 italic">Pilih <b>Jenis Fasyankes</b> terlebih dahulu — daftar standar SDM Kesehatan yang wajib diverifikasi akan tampil otomatis di sini.</p>`;
    return;
  }
  box.innerHTML = `
    <p class="text-[.68rem] text-slate-400 mb-2">Centang SDM Kesehatan yang terverifikasi sesuai standar <b>${esc(jenis)}</b>:</p>
    <div class="vf-sdm-grid">${SDM_FASYANKES[jenis].map((o) => `
      <label class="vf-sdm-item"><input type="checkbox" name="sdm-faskes" value="${esc(o)}" ${checked.includes(o) ? 'checked' : ''}><span>${esc(o)}</span></label>`).join('')}</div>`;
}

/* ---------- Draf otomatis (verval_draft, form='faskes') ---------- */

function jadwalkanDraftVf() {
  clearTimeout(vfDraftTimer);
  vfDraftTimer = setTimeout(simpanDraftVf, 1500);
}

async function simpanDraftVf() {
  const form = $('#vf-form');
  if (!form) return;
  if (!SUPABASE_TERKONFIGURASI || !state.user) {
    setDraftStatusVf(`${icon('info', 'w-3.5 h-3.5')} Masuk untuk mengaktifkan simpan-otomatis draf`, 'warn');
    return;
  }
  const data = {};
  form.querySelectorAll('input, select, textarea').forEach((el) => {
    if (!el.id || ['vf-id', 'vf-tanggal'].includes(el.id)) return;
    if (el.type === 'checkbox') return;
    data[el.id] = el.value;
  });
  data['__sdm'] = $$('input[name="sdm-faskes"]:checked').map((c) => c.value).join('; ');
  setDraftStatusVf(`${icon('save', 'w-3.5 h-3.5')} Menyimpan draf…`, 'saving');
  try {
    const { error } = await supabase.from('verval_draft')
      .upsert({ user_id: state.user.id, form: 'faskes', data, updated_at: new Date().toISOString() }, { onConflict: 'user_id,form' });
    if (error) throw error;
    setDraftStatusVf(`${icon('check', 'w-3.5 h-3.5')} Draf tersimpan otomatis • ${new Date().toLocaleTimeString('id-ID')}`);
  } catch (e) {
    console.warn('Draft verval faskes gagal:', e.message);
    setDraftStatusVf(`${icon('alert', 'w-3.5 h-3.5')} Draf gagal tersimpan: ${esc(friendlyError(e))}`, 'warn');
  }
}

async function muatDraftVf() {
  if (!SUPABASE_TERKONFIGURASI || !state.user) {
    setDraftStatusVf(`${icon('info', 'w-3.5 h-3.5')} Masuk sebagai verifikator/admin untuk mengaktifkan draf otomatis`, 'warn');
    return;
  }
  try {
    const { data, error } = await supabase.from('verval_draft')
      .select('data, updated_at').eq('user_id', state.user.id).eq('form', 'faskes').maybeSingle();
    if (error) throw error;
    if (data?.data && Object.keys(data.data).length) {
      const saved = data.data;
      Object.entries(saved).forEach(([id, v]) => {
        if (id === '__sdm') return;
        const el = document.getElementById(id);
        if (el && v != null) el.value = v;
      });
      renderSdmVf(document.getElementById('vf-jenis-fasyankes')?.value || '', String(saved['__sdm'] || '').split('; ').filter(Boolean));
      setDraftStatusVf(`${icon('check', 'w-3.5 h-3.5')} Draf dipulihkan otomatis • tersimpan ${fmtDateTime(data.updated_at)}`);
    } else {
      setDraftStatusVf(`${icon('save', 'w-3.5 h-3.5')} Simpan-otomatis draf aktif (tersinkron ke database)`);
    }
  } catch (e) {
    console.warn('Muat draft verval faskes gagal:', e.message);
    setDraftStatusVf(`${icon('alert', 'w-3.5 h-3.5')} Draf tidak dapat dimuat`, 'warn');
  }
}

async function hapusDraftVf(silent = false) {
  if (!SUPABASE_TERKONFIGURASI || !state.user) return;
  try {
    await supabase.from('verval_draft').delete().eq('user_id', state.user.id).eq('form', 'faskes');
  } catch (e) {
    if (!silent) toast(friendlyError(e), 'error');
  }
}

function resetVfForm() {
  confirmDialog({
    title: 'Reset Formulir Verval Fasyankes',
    message: 'Seluruh isian formulir dan draf yang tersimpan akan dihapus, ID verval diperbarui. Lanjutkan?',
    onYes: async () => {
      await hapusDraftVf(true);
      renderVfForm();
      toast('Formulir dikosongkan dengan ID baru.');
    },
  });
}

/* ---------- Kumpul & submit ---------- */

function kumpulDataVf() {
  const g = (id) => document.getElementById(id)?.value.trim() || '';
  return {
    kode_verval: g('vf-id'), tanggal_verval: g('vf-tanggal') || todayISO(),
    nomor_unit: g('vf-nomor-unit'), nama_fasyankes: g('vf-nama-fasyankes'),
    jenis_fasyankes: g('vf-jenis-fasyankes'), nama_pemilik: g('vf-pemilik'),
    penanggung_jawab: g('vf-pj'), alamat_lengkap: g('vf-alamat'),
    kelurahan: g('vf-kelurahan'), kecamatan: g('vf-kecamatan'),
    nomor_hp: g('vf-hp'), email: g('vf-email') || null,
    sdm_kesehatan: $$('input[name="sdm-faskes"]:checked').map((c) => c.value).join('; ') || null,
    status_verifikasi: g('vf-status-verifikasi'),
    catatan_verifikasi: g('vf-catatan') || null,
    verifikator: g('vf-verifikator'),
  };
}

async function submitVfForm() {
  const d = kumpulDataVf();
  const errors = [];
  if (!d.nomor_unit) errors.push('Nomor Unit wajib diisi');
  if (!d.nama_fasyankes) errors.push('Nama Fasyankes wajib diisi');
  if (!d.jenis_fasyankes) errors.push('Jenis Fasyankes wajib dipilih');
  if (!d.nama_pemilik) errors.push('Nama Pemilik wajib diisi');
  if (!d.penanggung_jawab) errors.push('Penanggung Jawab wajib diisi');
  if (!d.alamat_lengkap) errors.push('Alamat Lengkap wajib diisi');
  if (!d.kelurahan) errors.push('Kelurahan/Desa wajib diisi');
  if (!d.kecamatan) errors.push('Kecamatan wajib diisi');
  if (!d.nomor_hp) errors.push('Nomor HP wajib diisi');
  if (!d.status_verifikasi) errors.push('Hasil Verifikasi wajib dipilih');
  if (!d.verifikator) errors.push('Nama Verifikator wajib diisi');
  if (errors.length) { toast(errors.join(' • '), 'error'); return; }
  if (!SUPABASE_TERKONFIGURASI) { toast('Supabase belum dikonfigurasi — isi js/config.js.', 'error'); return; }
  if (!canVerify()) { toast('Hanya Verifikator/Admin yang dapat mengirim verval. Silakan masuk dahulu.', 'error'); return; }

  const btns = $$('#vf-form button');
  btns.forEach((b) => { b.disabled = true; });
  try {
    const { error } = await supabase.from('verval_fasyankes').insert(d);
    if (error) throw error;
    await hapusDraftVf(true);
    toast('Data verval fasyankes berhasil disimpan ke database.');
    showVfSukses(d);
  } catch (err) {
    toast(friendlyError(err), 'error');
    btns.forEach((b) => { b.disabled = false; });
  }
}

function showVfSukses(d) {
  openModal({
    title: 'Verval Fasyankes Berhasil Disimpan', size: 'sm',
    body: `<div class="text-center py-2">
      <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center mx-auto mb-3">${icon('check', 'w-8 h-8')}</div>
      <p class="font-extrabold text-slate-800 mb-1">Data verval fasyankes berhasil disimpan!</p>
      <p class="text-xs text-slate-500 leading-relaxed mb-4">Hasil verifikasi tercatat di database SIMANTRI dan dapat dilihat pada tab Riwayat Verval.</p>
      <div class="rounded-xl bg-slate-50 border border-slate-100 p-4 text-left text-[.78rem] space-y-1.5">
        <p><span class="text-slate-400">ID Verval:</span> <span class="kode-chip">${esc(d.kode_verval)}</span></p>
        <p><span class="text-slate-400">Fasyankes:</span> <b>${esc(d.nama_fasyankes)}</b></p>
        <p><span class="text-slate-400">Jenis:</span> ${esc(d.jenis_fasyankes)}</p>
        <p><span class="text-slate-400">Hasil:</span> <b>${esc(d.status_verifikasi)}</b></p>
        <p><span class="text-slate-400">Tanggal:</span> ${fmtDate(d.tanggal_verval)}</p>
      </div>
    </div>`,
    footer: `<button class="btn btn-primary" id="btn-vf-selesai">Isi Formulir Baru</button>`,
    onOpen: (root) => root.querySelector('#btn-vf-selesai').addEventListener('click', () => {
      closeModal();
      renderVfForm();
    }),
  });
}

/* ---------- Tab 2: RIWAYAT VERVAL FASYANKES ---------- */

function renderRiwayatVf() {
  $('#vfc-content').innerHTML = `
    <div class="card p-4 sm:p-5">
      <div class="flex flex-wrap items-center justify-between gap-2.5 mb-3.5">
        <div>
          <p class="text-sm font-extrabold text-slate-800">Riwayat Verval Fasyankes</p>
          <p class="text-xs text-slate-400">Seluruh hasil pengisian formulir verval fasyankes. Klik baris untuk detail lengkap.</p>
        </div>
        <div class="search-box">${icon('search', 'w-4 h-4 text-slate-400')}<input id="rvf-q" placeholder="Cari nama / nomor unit / kecamatan…"></div>
      </div>
      <div id="rvf-count"></div>
      <div id="rvf-list">${skeletonRows(4)}</div>
    </div>`;
  const q = $('#rvf-q');
  q.addEventListener('input', debounce(() => muatRiwayatVf(q.value.trim()), 350));
  muatRiwayatVf('');
}

async function muatRiwayatVf(q) {
  const list = $('#rvf-list');
  if (!list) return;
  try {
    const rows = await fetchRows('verval_fasyankes', {
      search: q, searchCols: ['nama_fasyankes', 'nomor_unit', 'kecamatan'], limit: 100,
    });
    const cnt = $('#rvf-count');
    if (cnt) cnt.innerHTML = `<p class="text-[.7rem] text-slate-400 mb-2">Menampilkan ${rows.length} catatan verval fasyankes${q ? ` untuk pencarian “${esc(q)}”` : ''}.</p>`;
    if (!rows.length) { list.innerHTML = emptyState('Belum ada catatan verval fasyankes.'); return; }
    list.innerHTML = `<div class="space-y-2.5">${rows.map((r) => `
      <div class="rv-row card p-3.5 flex flex-col sm:flex-row sm:items-center gap-3" data-id="${r.id}">
        <div class="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 grid place-items-center flex-none">${icon('faskes', 'w-5 h-5')}</div>
        <div class="flex-1 min-w-0">
          <p class="font-bold text-[.84rem] text-slate-700">${esc(r.nama_fasyankes)}</p>
          <p class="text-xs text-slate-500 truncate">${esc(r.jenis_fasyankes)} &bull; ${esc(r.kelurahan || '—')}, ${esc(r.kecamatan || '—')} &bull; PJ: ${esc(r.penanggung_jawab || '—')}</p>
          <p class="text-[.66rem] text-slate-400 mt-0.5">${esc(r.kode_verval || '-')} &bull; ${fmtDate(r.tanggal_verval)}${r.verifikator ? ' • verifikator: ' + esc(r.verifikator) : ''}</p>
        </div>
        <div class="flex items-center gap-2 flex-none flex-wrap">
          <span class="badge ${VERVAL_FAS_BADGE[r.status_verifikasi] || 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'}">${esc(r.status_verifikasi || '-')}</span>
        </div>
      </div>`).join('')}</div>`;
    $$('#rvf-list .rv-row').forEach((el) => el.addEventListener('click', () => {
      const row = rows.find((r) => String(r.id) === el.dataset.id);
      if (row) detailVfModal(row, () => muatRiwayatVf($('#rvf-q')?.value.trim() || ''));
    }));
  } catch (e) {
    list.innerHTML = errorBlock(e);
  }
}

function detailVfModal(r, onDeleted = null) {
  const rows = VERVAL_FAS_FIELDS.map(([k, label]) => {
    let v = r[k];
    if (k === 'tanggal_verval') v = fmtDate(v);
    if (k === 'created_at') v = fmtDateTime(v);
    if (k === 'status_verifikasi' && v) return `<div class="detail-label">${label}</div><div class="detail-value"><span class="badge ${VERVAL_FAS_BADGE[v] || ''}">${esc(v)}</span></div>`;
    if (k === 'kode_verval' && v) return `<div class="detail-label">${label}</div><div class="detail-value"><span class="kode-chip">${esc(v)}</span></div>`;
    if (k === 'sdm_kesehatan' && v) return `<div class="detail-label">${label}</div><div class="detail-value">${v.split('; ').map((s) => `<span class="badge bg-teal-50 text-teal-700 ring-1 ring-teal-100" style="margin:0 .25rem .35rem 0">${esc(s)}</span>`).join('')}</div>`;
    return `<div class="detail-label">${label}</div><div class="detail-value">${esc(v || '—')}</div>`;
  }).join('');
  openModal({
    title: `Detail Verval: ${esc(r.nama_fasyankes)}`, size: 'xl',
    body: `<div class="detail-grid">${rows}</div>`,
    footer: `${isAdmin() ? `<button class="btn btn-danger" id="btn-del-vf">${icon('trash', 'w-4 h-4')} Hapus</button>` : ''}
             <button class="btn btn-ghost" data-close="1">Tutup</button>`,
    onOpen: (root) => {
      const del = root.querySelector('#btn-del-vf');
      if (del) del.addEventListener('click', () => confirmDialog({
        title: 'Hapus Catatan Verval Fasyankes',
        message: `Yakin menghapus verval <b>${esc(r.nama_fasyankes)}</b> (${esc(r.kode_verval || '-')})? Tindakan ini tidak dapat dibatalkan.`,
        onYes: async () => {
          const { error } = await supabase.from('verval_fasyankes').delete().eq('id', r.id);
          if (error) throw error;
          toast('Catatan verval fasyankes dihapus.');
          if (onDeleted) onDeleted();
        },
      }));
    },
  });
}

/* =========================================================
 * 14. HALAMAN: CEK HASIL VERIFIKASI (search NIK / Nama)
 * ========================================================= */

function mountCekVerifikasi() {
  $('#page-content').innerHTML = `
    ${SUPABASE_TERKONFIGURASI ? '' : setupNotice()}
    <div class="max-w-3xl mx-auto">
      <div class="card p-4 sm:p-5 mb-4">
        <p class="text-sm font-extrabold text-slate-800 mb-1">Cek Hasil Verifikasi</p>
        <p class="text-xs text-slate-400 mb-3">Masukkan <b>NIK</b> atau <b>Nama</b> untuk melihat status data &amp; verifikasi praktik.</p>
        <div class="flex gap-2">
          <div class="search-box flex-1 !max-w-none">${icon('search', 'w-4 h-4 text-slate-400')}
            <input id="cek-input" placeholder="cth: NIK 6472… atau nama: dr. Ahmad"></div>
          <button id="cek-btn" class="btn btn-primary">${icon('cek', 'w-4 h-4')} Cari</button>
        </div>
      </div>
      <div id="cek-result">${emptyState('Masukkan NIK atau nama, lalu tekan Cari.')}</div>
    </div>`;

  if (!SUPABASE_TERKONFIGURASI) return;
  const input = $('#cek-input');
  const btn = $('#cek-btn');
  btn.addEventListener('click', cari);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });

  async function cari() {
    const q = input.value.trim().replace(/[,()%]/g, ' ');
    if (q.length < 2) { toast('Masukkan minimal 2 karakter untuk mencari.', 'info'); return; }
    $('#cek-result').innerHTML = skeletonRows(4);
    try {
      const [tm, tk, f, p] = await Promise.all([
        fetchRows('tenaga_medis', { search: q, searchCols: ['nik', 'nama_lengkap'] }),
        fetchRows('tenaga_kesehatan', { search: q, searchCols: ['nik', 'nama_lengkap'] }),
        fetchRows('fasyankes', { search: q, searchCols: ['nama_fasyankes'] }),
        fetchRows('praktik_mandiri', { search: q, searchCols: ['nama_praktik', 'pemilik'] }),
      ]);
      const kartu = (ic, warna, judul, sub, meta, bdg, catatan) => `
        <div class="card p-3.5 flex items-start gap-3">
          <div class="w-9 h-9 rounded-lg ${warna} grid place-items-center flex-none">${icon(ic, 'w-4 h-4')}</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap"><p class="font-bold text-[.84rem] text-slate-700">${esc(judul)}</p>${bdg}</div>
            <p class="text-xs text-slate-500">${esc(sub)}</p>
            <p class="text-[.68rem] text-slate-400">${meta}</p>
            ${catatan ? `<p class="text-[.7rem] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mt-1.5">Catatan: ${trunc(catatan, 120)}</p>` : ''}
          </div>
        </div>`;
      const sections = [];
      if (tm.length) sections.push(`<p class="text-[.7rem] font-bold uppercase tracking-wider text-slate-400 mb-2 mt-1">Tenaga Medis (${tm.length})</p>` + tm.map((r) =>
        kartu('medis', 'bg-teal-50 text-teal-600', r.nama_lengkap, `${r.spesialisasi || 'Dokter'} • ${r.tempat_praktik || '—'}`, `NIK ${esc(r.nik || '—')} • Masa berlaku SIP: ${fmtDate(r.masa_berlaku_sip)}`, badge(r.status), null)).join(''));
      if (tk.length) sections.push(`<p class="text-[.7rem] font-bold uppercase tracking-wider text-slate-400 mb-2 mt-1">Tenaga Kesehatan (${tk.length})</p>` + tk.map((r) =>
        kartu('kes', 'bg-sky-50 text-sky-600', r.nama_lengkap, `${r.profesi || '—'} • ${r.tempat_praktik || '—'}`, `NIK ${esc(r.nik || '—')} • Masa berlaku SIP: ${fmtDate(r.masa_berlaku_sip)}`, badge(r.status), null)).join(''));
      if (f.length) sections.push(`<p class="text-[.7rem] font-bold uppercase tracking-wider text-slate-400 mb-2 mt-1">Fasyankes (${f.length})</p>` + f.map((r) =>
        kartu('faskes', 'bg-indigo-50 text-indigo-600', r.nama_fasyankes, `${r.jenis || '—'} • ${r.alamat || '—'}`, `${esc(r.kecamatan || '—')} • Diverifikasi: ${esc(r.verified_by || 'belum')}`, badge(r.status_verifikasi), r.catatan_verifikasi)).join(''));
      if (p.length) sections.push(`<p class="text-[.7rem] font-bold uppercase tracking-wider text-slate-400 mb-2 mt-1">Praktik Mandiri (${p.length})</p>` + p.map((r) =>
        kartu('praktik', 'bg-amber-50 text-amber-600', r.nama_praktik, `${r.jenis_praktik || '—'} • ${r.alamat || '—'}`, `Pemilik: ${esc(r.pemilik || '—')} • Diverifikasi: ${esc(r.verified_by || 'belum')}`, badge(r.status_verifikasi), r.catatan_verifikasi)).join(''));
      $('#cek-result').innerHTML = sections.length
        ? `<div class="space-y-2">${sections.join('')}</div>`
        : emptyState('Tidak ditemukan data dengan kata kunci tersebut.');
    } catch (e) {
      $('#cek-result').innerHTML = errorBlock(e);
    }
  }
}

/* =========================================================
 * 15. HALAMAN: MONEV IZIN (Monitoring & Evaluasi + foto)
 * ========================================================= */

async function uploadFotoMonev(file) {
  const aman = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `monev/${Date.now()}_${aman}`;
  const { error } = await supabase.storage.from('monev').upload(path, file, { upsert: false });
  if (error) throw error;
  return supabase.storage.from('monev').getPublicUrl(path).data.publicUrl;
}

async function mountMonev() {
  $('#page-content').innerHTML = `
    ${SUPABASE_TERKONFIGURASI ? '' : setupNotice()}
    <div class="flex flex-wrap items-center justify-between gap-2.5 mb-4">
      <div>
        <p class="text-sm font-extrabold text-slate-800">Monev Izin</p>
        <p class="text-xs text-slate-400">Monitoring &amp; evaluasi praktik: kunjungan, temuan, tindak lanjut, dokumentasi foto</p>
      </div>
      ${state.user ? `<button id="btn-add-monev" class="btn btn-primary">${icon('plus', 'w-4 h-4')} Tambah Kunjungan</button>` : '<span class="text-[.68rem] text-slate-400">Masuk untuk mengisi monev</span>'}
    </div>
    <div class="card p-4 sm:p-5">
      <div class="flex flex-wrap items-center gap-2.5 mb-3.5">
        <div class="search-box">${icon('search', 'w-4 h-4 text-slate-400')}<input id="monev-search" placeholder="Cari sasaran / petugas…"></div>
        <span id="monev-count" class="count-chip">…</span>
      </div>
      <div id="monev-list">${skeletonRows(5)}</div>
    </div>`;

  if (!SUPABASE_TERKONFIGURASI) { $('#monev-list').innerHTML = ''; return; }

  let rows = [], q = '';
  const search = $('#monev-search');
  search.addEventListener('input', debounce(() => { q = search.value.trim(); loadList(); }, 350));
  $('#btn-add-monev')?.addEventListener('click', () => openFormMonev(null));

  async function loadList() {
    try {
      rows = await fetchRows('monev_izin', { orderBy: 'tanggal_kunjungan', asc: false, search: q, searchCols: ['sasaran_nama', 'petugas', 'temuan', 'tindak_lanjut'] });
      currentCrudReload = loadList;
      $('#monev-count').textContent = `${rows.length} catatan`;
      if (!rows.length) { $('#monev-list').innerHTML = emptyState(q ? 'Tidak ada catatan yang cocok.' : 'Belum ada catatan monev. Klik "Tambah Kunjungan".'); return; }
      $('#monev-list').innerHTML = `<div class="table-wrap"><table class="sim-table">
        <thead><tr><th>Tanggal</th><th>Sasaran</th><th>Petugas</th><th>Temuan</th><th>Tindak Lanjut</th><th>Foto</th></tr></thead>
        <tbody>${rows.map((r) => `<tr data-id="${r.id}" title="Klik untuk detail">
          <td class="whitespace-nowrap">${fmtDate(r.tanggal_kunjungan)}</td>
          <td><span class="font-semibold text-slate-700">${esc(r.sasaran_nama)}</span><br><span class="text-[.68rem] text-slate-400">${esc(r.sasaran_jenis)}</span></td>
          <td>${esc(r.petugas || '—')}</td>
          <td class="max-w-[200px]">${trunc(r.temuan, 70) || '—'}</td>
          <td class="max-w-[200px]">${trunc(r.tindak_lanjut, 70) || '—'}</td>
          <td>${r.foto_url ? `<img src="${esc(r.foto_url)}" alt="Foto monev" class="thumb" loading="lazy">` : '<span class="text-slate-300 text-xs">—</span>'}</td>
        </tr>`).join('')}</tbody></table></div>
        <p class="text-[.68rem] text-slate-400 mt-2">Klik baris untuk membuka detail lengkap.</p>`;
      $$('#monev-list tbody tr').forEach((tr) => tr.addEventListener('click', () => {
        const row = rows.find((r) => String(r.id) === tr.dataset.id);
        if (row) openDetailMonev(row);
      }));
    } catch (e) {
      $('#monev-list').innerHTML = errorBlock(e);
    }
  }

  function openDetailMonev(r) {
    openModal({
      title: `Monev: ${esc(r.sasaran_nama)}`,
      size: 'md',
      body: `<div class="detail-grid">
        <div class="detail-label">Tanggal Kunjungan</div><div class="detail-value">${fmtDate(r.tanggal_kunjungan)}</div>
        <div class="detail-label">Sasaran</div><div class="detail-value">${esc(r.sasaran_jenis)} — ${esc(r.sasaran_nama)}</div>
        <div class="detail-label">Petugas</div><div class="detail-value">${esc(r.petugas || '—')}</div>
        <div class="detail-label">Temuan</div><div class="detail-value">${esc(r.temuan || '—')}</div>
        <div class="detail-label">Tindak Lanjut</div><div class="detail-value">${esc(r.tindak_lanjut || '—')}</div>
        <div class="detail-label">Dokumentasi</div><div class="detail-value">${r.foto_url ? `<a href="${esc(r.foto_url)}" target="_blank" rel="noopener"><img src="${esc(r.foto_url)}" alt="Foto dokumentasi monev" class="rounded-xl max-w-full border border-slate-200"></a>` : '—'}</div>
        <div class="detail-label">Diinput Oleh</div><div class="detail-value">${esc(r.created_by || '—')}</div>
        <div class="detail-label">Waktu</div><div class="detail-value">${fmtDateTime(r.created_at)}</div>
      </div>`,
      footer: `
        ${isAdmin() ? `<button class="btn btn-danger mr-auto" id="btn-monev-del">${icon('trash', 'w-4 h-4')} Hapus</button>` : ''}
        ${state.user ? `<button class="btn btn-soft" id="btn-monev-edit">${icon('pencil', 'w-4 h-4')} Edit</button>` : ''}
        <button class="btn btn-primary" data-close="1">Tutup</button>`,
      onOpen: (root) => {
        root.querySelector('#btn-monev-edit')?.addEventListener('click', () => { closeModal(); openFormMonev(r); });
        root.querySelector('#btn-monev-del')?.addEventListener('click', () => {
          confirmDialog({
            title: 'Hapus Catatan Monev',
            message: `Yakin ingin menghapus catatan monev untuk <b>${esc(r.sasaran_nama)}</b>?`,
            onYes: async () => {
              const { error } = await supabase.from('monev_izin').delete().eq('id', r.id);
              if (error) throw error;
              toast('Catatan monev dihapus.');
              currentCrudReload?.();
            },
          });
        });
      },
    });
  }

  async function openFormMonev(row) {
    // Datalist sasaran dari tabel fasyankes & praktik mandiri (live)
    let opsiSasaran = [];
    try {
      const [f, p] = await Promise.all([
        fetchRows('fasyankes', { select: 'nama_fasyankes', orderBy: 'nama_fasyankes', asc: true }),
        fetchRows('praktik_mandiri', { select: 'nama_praktik', orderBy: 'nama_praktik', asc: true }),
      ]);
      opsiSasaran = [...f.map((x) => x.nama_fasyankes), ...p.map((x) => x.nama_praktik)].filter(Boolean);
    } catch (e) { /* datalist opsional */ }

    openModal({
      title: row ? 'Edit Catatan Monev' : 'Tambah Kunjungan Monev',
      size: 'lg',
      body: `<form id="monev-form" class="grid grid-cols-1 sm:grid-cols-2 gap-3.5" novalidate>
          <div><label class="lbl">Tanggal Kunjungan <span class="text-rose-500">*</span></label>
            <input type="date" class="input" name="tanggal_kunjungan" value="${row ? esc(row.tanggal_kunjungan) : todayISO()}" required></div>
          <div><label class="lbl">Sasaran Jenis <span class="text-rose-500">*</span></label>
            <select class="input" name="sasaran_jenis" required>
              <option value="">— Pilih —</option>
              ${['Fasyankes', 'Praktik Mandiri'].map((o) => `<option ${row?.sasaran_jenis === o ? 'selected' : ''}>${o}</option>`).join('')}
            </select></div>
          <div class="sm:col-span-2"><label class="lbl">Nama Sasaran <span class="text-rose-500">*</span></label>
            <input type="text" class="input" name="sasaran_nama" list="dl-sasaran" value="${esc(row?.sasaran_nama || '')}" required placeholder="Ketik nama fasyankes / praktik…">
            <datalist id="dl-sasaran">${opsiSasaran.map((o) => `<option value="${esc(o)}">`).join('')}</datalist></div>
          <div><label class="lbl">Petugas</label>
            <input type="text" class="input" name="petugas" value="${esc(row?.petugas || '')}" placeholder="Nama petugas pengunjung"></div>
          <div><label class="lbl">Foto Dokumentasi</label>
            <input type="file" class="input !py-1.5" id="monev-foto" accept="image/*">
            ${row?.foto_url ? `<p class="text-[.66rem] text-slate-400 mt-1">Sudah ada foto — unggah baru bila ingin mengganti.</p>` : ''}</div>
          <div class="sm:col-span-2"><label class="lbl">Temuan</label>
            <textarea class="input" name="temuan" rows="2" placeholder="Hasil pengamatan di lapangan…">${esc(row?.temuan || '')}</textarea></div>
          <div class="sm:col-span-2"><label class="lbl">Tindak Lanjut</label>
            <textarea class="input" name="tindak_lanjut" rows="2" placeholder="Rekomendasi / langkah tindak lanjut…">${esc(row?.tindak_lanjut || '')}</textarea></div>
        </form>`,
      footer: `<button class="btn btn-ghost" data-close="1">Batal</button>
               <button class="btn btn-primary" id="btn-monev-save">${icon('check', 'w-4 h-4')} Simpan</button>`,
      onOpen: (root) => {
        const fileInput = root.querySelector('#monev-foto');
        fileInput.addEventListener('change', () => {
          if (fileInput.files[0] && fileInput.files[0].size > 5 * 1024 * 1024) {
            toast('Ukuran foto maksimal 5 MB.', 'error');
            fileInput.value = '';
          }
        });
        root.querySelector('#btn-monev-save').addEventListener('click', async (e) => {
          const form = root.querySelector('#monev-form');
          if (!form.reportValidity()) return;
          const btnS = e.currentTarget;
          btnS.disabled = true; btnS.textContent = 'Menyimpan…';
          try {
            const payload = {
              tanggal_kunjungan: form.elements.tanggal_kunjungan.value || null,
              sasaran_jenis: form.elements.sasaran_jenis.value || null,
              sasaran_nama: form.elements.sasaran_nama.value.trim() || null,
              petugas: form.elements.petugas.value.trim() || null,
              temuan: form.elements.temuan.value.trim() || null,
              tindak_lanjut: form.elements.tindak_lanjut.value.trim() || null,
            };
            const file = fileInput.files[0];
            if (file) payload.foto_url = await uploadFotoMonev(file);
            const { error } = row
              ? await supabase.from('monev_izin').update(payload).eq('id', row.id)
              : await supabase.from('monev_izin').insert([{ ...payload, created_by: state.user?.email || null }]);
            if (error) throw error;
            closeModal();
            toast(row ? 'Catatan monev diperbarui.' : 'Catatan monev ditambahkan.');
            currentCrudReload?.();
          } catch (err) {
            toast(friendlyError(err), 'error');
            btnS.disabled = false; btnS.textContent = 'Simpan';
          }
        });
      },
    });
  }

  await loadList();
}

/* =========================================================
 * 16. HALAMAN: MANAJEMEN PENGGUNA (khusus admin)
 * ========================================================= */

async function mountPengguna() {
  if (!SUPABASE_TERKONFIGURASI) {
    $('#page-content').innerHTML = setupNotice();
    return;
  }
  if (!isAdmin()) { $('#page-content').innerHTML = forbiddenCard(); return; }

  $('#page-content').innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-2.5 mb-4">
      <div>
        <p class="text-sm font-extrabold text-slate-800">Manajemen Pengguna</p>
        <p class="text-xs text-slate-400">Kelola akun &amp; role: admin, verifikator, operator</p>
      </div>
      <button id="btn-add-user" class="btn btn-primary">${icon('plus', 'w-4 h-4')} Tambah Pengguna</button>
    </div>
    <div class="card p-3.5 mb-4 text-xs text-slate-500 flex gap-2.5 items-start bg-slate-50 border-slate-200">
      ${icon('info', 'w-4 h-4 mt-0.5 flex-none text-sky-500')}
      <span>Tips: pastikan opsi <b>Confirm email</b> dinonaktifkan di Supabase (Authentication → Providers → Email) agar pembuatan akun lewat form ini berjalan mulus. Profil baru otomatis dibuat oleh trigger dengan role <b>operator</b>. Penghapusan akun Auth permanen dilakukan lewat Dashboard Supabase → Authentication → Users.</span>
    </div>
    <div class="card p-4 sm:p-5">
      <div id="user-list">${skeletonRows(4)}</div>
    </div>`;

  $('#btn-add-user').addEventListener('click', () => openFormUser(null));
  await loadUsers();

  async function loadUsers() {
    try {
      const rows = await fetchRows('profiles', { orderBy: 'created_at', asc: true });
      currentCrudReload = loadUsers;
      if (!rows.length) { $('#user-list').innerHTML = emptyState('Belum ada pengguna terdaftar.'); return; }
      $('#user-list').innerHTML = `<div class="table-wrap"><table class="sim-table">
        <thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Dibuat</th><th class="text-right">Aksi</th></tr></thead>
        <tbody>${rows.map((r) => `<tr data-id="${r.id}">
          <td><span class="font-semibold text-slate-700">${esc(r.nama || '—')}</span>${r.id === state.user?.id ? ' <span class="badge bg-teal-100 text-teal-700 ring-1 ring-teal-200">Anda</span>' : ''}</td>
          <td>${esc(r.email || '—')}</td>
          <td><span class="badge ${ROLE_BADGE[r.role] || ''}">${esc(r.role)}</span></td>
          <td class="whitespace-nowrap">${fmtDateTime(r.created_at)}</td>
          <td class="text-right whitespace-nowrap">
            <button class="icon-btn !w-8 !h-8" data-act="edit" title="Edit">${icon('pencil', 'w-4 h-4')}</button>
            ${r.id !== state.user?.id ? `<button class="icon-btn !w-8 !h-8 text-rose-500" data-act="del" title="Hapus">${icon('trash', 'w-4 h-4')}</button>` : ''}
          </td>
        </tr>`).join('')}</tbody></table></div>`;
      $$('#user-list [data-act]').forEach((b) => b.addEventListener('click', (e) => {
        e.stopPropagation();
        const row = rows.find((r) => String(r.id) === b.closest('tr').dataset.id);
        if (!row) return;
        if (b.dataset.act === 'edit') openFormUser(row);
        else {
          confirmDialog({
            title: 'Hapus Pengguna',
            message: `Hapus profil <b>${esc(row.nama || row.email)}</b> dari tabel profiles? Akun Auth-nya tetap ada — hapus permanen lewat Dashboard Supabase bila perlu.`,
            onYes: async () => {
              const { error } = await supabase.from('profiles').delete().eq('id', row.id);
              if (error) throw error;
              toast('Profil pengguna dihapus.');
              loadUsers();
            },
          });
        }
      }));
    } catch (e) {
      $('#user-list').innerHTML = errorBlock(e);
    }
  }

  function openFormUser(row) {
    const isEdit = !!row;
    openModal({
      title: isEdit ? `Edit Pengguna: ${esc(row.nama || row.email)}` : 'Tambah Pengguna',
      size: 'sm',
      body: `<form id="user-form" class="space-y-3" novalidate>
          <div><label class="lbl">Nama ${isEdit ? '' : '<span class="text-rose-500">*</span>'}</label>
            <input type="text" class="input" id="u-nama" value="${esc(row?.nama || '')}" ${isEdit ? '' : 'required'}></div>
          ${isEdit ? '' : `<div><label class="lbl">Email <span class="text-rose-500">*</span></label>
            <input type="email" class="input" id="u-email" required placeholder="nama@dinkes.go.id"></div>
          <div><label class="lbl">Kata Sandi <span class="text-rose-500">*</span></label>
            <input type="password" class="input" id="u-pass" required minlength="6" placeholder="Minimal 6 karakter"></div>`}
          <div><label class="lbl">Role</label>
            <select class="input" id="u-role">
              ${['operator', 'verifikator', 'admin'].map((o) => `<option value="${o}" ${row?.role === o ? 'selected' : ''}>${o}</option>`).join('')}
            </select></div>
        </form>`,
      footer: `<button class="btn btn-ghost" data-close="1">Batal</button>
               <button class="btn btn-primary" id="btn-user-save">${icon('check', 'w-4 h-4')} Simpan</button>`,
      onOpen: (root) => root.querySelector('#btn-user-save').addEventListener('click', async (e) => {
        const form = root.querySelector('#user-form');
        if (!form.reportValidity()) return;
        const btnS = e.currentTarget;
        btnS.disabled = true; btnS.textContent = 'Menyimpan…';
        try {
          if (isEdit) {
            const { error } = await supabase.from('profiles').update({
              nama: root.querySelector('#u-nama').value.trim(),
              role: root.querySelector('#u-role').value,
            }).eq('id', row.id);
            if (error) throw error;
          } else {
            // Buat akun Auth baru, lalu pulihkan sesi admin (agar admin tidak ter-logout)
            const before = (await supabase.auth.getSession()).data?.session ?? null;
            const email = root.querySelector('#u-email').value.trim();
            const pass = root.querySelector('#u-pass').value;
            const { data: su, error } = await supabase.auth.signUp({ email, password: pass });
            if (error) throw error;
            const after = (await supabase.auth.getSession()).data?.session ?? null;
            if (before && after && after.access_token !== before.access_token) {
              await supabase.auth.setSession({ access_token: before.access_token, refresh_token: before.refresh_token });
            }
            if (su.user) {
              const { error: e2 } = await supabase.from('profiles').update({
                nama: root.querySelector('#u-nama').value.trim() || email,
                role: root.querySelector('#u-role').value,
              }).eq('id', su.user.id);
              if (e2) throw e2;
            }
          }
          closeModal();
          toast(isEdit ? 'Pengguna diperbarui.' : 'Pengguna baru berhasil dibuat.');
          loadUsers();
        } catch (err) {
          toast(friendlyError(err), 'error');
          btnS.disabled = false; btnS.textContent = 'Simpan';
        }
      }),
    });
  }
}

/* =========================================================
 * 17. ROUTES & BOOT
 * ========================================================= */

const ROUTES = {
  'beranda': { t: 'Dashboard', s: 'Ringkasan data kesehatan Kota Samarinda', render: mountDashboard },
  'petunjuk': { t: 'Petunjuk Penggunaan', s: 'Panduan langkah demi langkah', render: renderPetunjuk },
  'peta': { t: 'Peta Sebaran Praktik', s: 'Fasyankes & praktik mandiri berdasarkan koordinat', render: mountPeta },
  'expired': { t: 'Notifikasi Expired', s: 'SIP/STR yang expired dan menuju H-30', render: mountExpired },
  'tenaga-medis': { t: 'Data Tenaga Medis', s: 'Kelola data dokter & dokter gigi', render: () => mountCrud('tenaga-medis') },
  'tenaga-kesehatan': { t: 'Data Tenaga Kesehatan', s: 'Kelola data perawat, bidan & profesi lain', render: () => mountCrud('tenaga-kesehatan') },
  'fasyankes': { t: 'Data Fasyankes', s: 'Kelola data RS, Puskesmas & Klinik', render: () => mountCrud('fasyankes') },
  'praktik-mandiri': { t: 'Data Praktik Mandiri', s: 'Kelola data pengajuan praktik mandiri', render: () => mountCrud('praktik-mandiri') },
  'verifikasi-praktik': { t: 'Verifikasi Praktik', s: 'Formulir verval izin praktik, riwayat & persetujuan pengajuan', render: mountVervalPraktik },
  'verifikasi-faskes': { t: 'Verifikasi Faskes', s: 'Formulir verval fasyankes, riwayat & persetujuan pengajuan', render: mountVervalFaskes },
  'cek-verifikasi': { t: 'Cek Hasil Verifikasi', s: 'Pencarian status berdasarkan NIK / Nama', render: mountCekVerifikasi },
  'monev': { t: 'Monev Izin', s: 'Monitoring & evaluasi dengan dokumentasi foto', render: mountMonev },
  'pengguna': { t: 'Manajemen Pengguna', s: 'Kelola akun & role (khusus admin)', render: mountPengguna, adminOnly: true },
};

const VERSI_SIMANTRI = '1.2.0';

async function boot() {
  // Penanda versi: bila baris ini TIDAK muncul di console,
  // berarti peramban masih memuat file lama (cache).
  console.info(`[SIMANTRI] v${VERSI_SIMANTRI} — file terbaru berhasil dimuat`);
  bindShell();
  buildNav();
  renderTopbarUser();

  if (SUPABASE_TERKONFIGURASI) {
    try {
      const { data } = await supabase.auth.getSession();
      await refreshAuth(data?.session ?? null);
      supabase.auth.onAuthStateChange((ev, session) => {
        if (['INITIAL_SESSION', 'SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(ev)) {
          refreshAuth(session);
        }
      });
    } catch (e) {
      console.warn('Init auth gagal:', e);
    }
  }

  window.addEventListener('hashchange', router);

  // Landing: splash 3 detik → fade → redirect ke #beranda (tanpa reload)
  setTimeout(() => {
    const sp = $('#splash');
    sp.classList.add('splash-out');
    $('#app').classList.remove('hidden');
    $('#app').classList.add('app-enter');
    setTimeout(() => sp.remove(), 700);
    if (!location.hash) history.replaceState(null, '', '#beranda');
    router();
  }, 3000);
}

boot().catch((e) => {
  console.error('[SIMANTRI] Gagal memuat aplikasi:', e);
  const sp = document.querySelector('#splash');
  if (sp) {
    sp.innerHTML =
      '<div style="max-width:440px;text-align:center;padding:2rem;font-family:inherit">' +
      '<p style="font-weight:800;color:#0f766e;font-size:1.05rem;margin:0 0 .5rem">SIMANTRI gagal dimuat</p>' +
      '<p style="font-size:.875rem;color:#475569;margin:0">' + String((e && e.message) || e) + '</p>' +
      '<p style="font-size:.75rem;color:#94a3b8;margin:1rem 0 0">Pastikan seluruh file (index.html, css/, js/, assets/) terunggah lengkap, ' +
      'lalu muat ulang dengan Ctrl+Shift+R (hard refresh).</p>' +
      '</div>';
  }
});

