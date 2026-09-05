// ============================================
// SIMANTRI — Application shell & router
// ============================================
//loadComponent(id, path) — fungsi pemuat fragmen HTML modular.
// Memakai import.meta.glob ?raw (ESM) supaya:
//   - HTML tetap di /src (sesuai spec arsitektur)
//   - Di-bundle pada build time → tidak perlu runtime fetch
//     (lebih cepat & kompatibel GitHub Pages)
//   - API tetap mirip fetch-based: loadComponent('view-slot', 'pages/dashboard')

import { isAuthenticated, getProfile, isDinkes, isFasyankes, isNakes, signOut } from './auth.js';
import { toast } from './utils.js';
import { bootstrapPage } from './pages-bootstrap.js';

// ============================================
// Bundle semua HTML fragments di /src sebagai raw string
// ============================================
const fragmentModules = import.meta.glob('/src/**/*.html', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** Ambil HTML string by logical path (e.g. 'pages/dashboard', 'components/layout/sidebar') */
function getFragment(logicalPath) {
  // Coba beberapa kemungkinan key
  const candidates = [
    `/src/${logicalPath}.html`,
    `/src/${logicalPath}/index.html`,
  ];
  for (const k of candidates) {
    if (fragmentModules[k]) return fragmentModules[k];
  }
  // Fallback: cari yang mengandung path
  const key = Object.keys(fragmentModules).find((k) => k.includes(logicalPath));
  return key ? fragmentModules[key] : null;
}

/**
 * loadComponent — inject HTML fragment ke elemen target.
 * @param {string} targetId — id elemen DOM tujuan
 * @param {string} logicalPath — path relatif tanpa ekstensi (mis. 'pages/dashboard')
 * @returns {Promise<string>} HTML string yang di-inject
 */
export async function loadComponent(targetId, logicalPath) {
  const el = document.getElementById(targetId);
  if (!el) {
    console.warn(`[loadComponent] target #${targetId} tidak ditemukan`);
    return '';
  }
  let html = getFragment(logicalPath);
  if (!html) {
    // Fallback fetch (untuk dev mode tambahan / debugging)
    // Pakai import.meta.env.BASE_URL supaya kompatibel di subpath GitHub Pages
    try {
      const base = import.meta.env.BASE_URL || '/';
      const url = `${base}src/${logicalPath}.html`.replace(/([^:])\/{2,}/g, '$1/');
      const res = await fetch(url);
      if (res.ok) html = await res.text();
    } catch (e) {
      // ignore
    }
  }
  if (!html) {
    el.innerHTML = `<div class="card p-8 text-center text-ink-500">
      <p class="font-semibold">Komponen tidak ditemukan</p>
      <p class="text-sm mt-1"><code>${logicalPath}.html</code></p>
    </div>`;
    return '';
  }
  el.innerHTML = html;
  el.classList.add('animate-fade-in');
  return html;
}

// ============================================
// Page registry — definisi route & permission
// ============================================
export const ROUTES = [
  // ===== BAGIAN 1: OVERVIEW =====
  { id: 'dashboard',           label: 'Dashboard Monitoring',     group: 'overview', icon: 'dashboard',      page: 'pages/dashboard' },
  { id: 'peta-sebaran',        label: 'Peta Sebaran Praktik',     group: 'overview', icon: 'map',            page: 'pages/peta-sebaran' },
  { id: 'notifikasi-expired',  label: 'Notifikasi Expired',       group: 'overview', icon: 'bell',           page: 'pages/notifikasi-expired' },

  // ===== BAGIAN 2: MANAJEMEN DATA INTI =====
  { id: 'data-nakes',          label: 'Data Tenaga Medis',        group: 'data',     icon: 'doctor',         page: 'pages/data-nakes' },
  { id: 'data-tenaga-kesehatan', label: 'Data Tenaga Kesehatan',  group: 'data',     icon: 'health',         page: 'pages/data-tenaga-kesehatan' },
  { id: 'data-fasyankes',      label: 'Data Fasyankes & Praktik', group: 'data',     icon: 'hospital',       page: 'pages/data-fasyankes' },
  { id: 'jadwal-praktik',      label: 'Jadwal Praktik',           group: 'data',     icon: 'calendar',       page: 'pages/jadwal-praktik' },

  // ===== BAGIAN 3: PERIZINAN & SISTEM =====
  { id: 'verifikasi',          label: 'Verifikasi STR & SIP',     group: 'izin',     icon: 'shield-check',   page: 'pages/verifikasi' },
  { id: 'perpanjangan',        label: 'Perpanjangan & Rekomendasi', group: 'izin',   icon: 'refresh',        page: 'pages/perpanjangan' },
  { id: 'laporan',             label: 'Laporan & Rekap Dinkes',   group: 'izin',     icon: 'report',         page: 'pages/laporan' },
  { id: 'manajemen-user',      label: 'Manajemen User & Role',    group: 'izin',     icon: 'users',          page: 'pages/manajemen-user',    dinkesOnly: true },
  { id: 'pengaturan',          label: 'Pengaturan & Audit Log',   group: 'izin',     icon: 'cog',            page: 'pages/pengaturan' },
];

export const GROUP_LABELS = {
  overview: 'Overview',
  data: 'Manajemen Data Inti',
  izin: 'Perizinan & Sistem',
};

// ============================================
// Router
// ============================================
let _currentRouteId = null;

export function getCurrentRoute() {
  return ROUTES.find((r) => r.id === _currentRouteId) ?? null;
}

export async function navigateTo(routeId) {
  const route = ROUTES.find((r) => r.id === routeId);
  if (!route) {
    console.warn(`[navigateTo] route "${routeId}" tidak ditemukan`);
    return;
  }
  // Permission check
  if (route.dinkesOnly && !isDinkes()) {
    toast('Akses ditolak: halaman ini hanya untuk Dinkes', 'error');
    return;
  }

  _currentRouteId = routeId;

  // Update URL hash
  if (window.location.hash !== `#/${routeId}`) {
    history.replaceState(null, '', `#/${routeId}`);
  }

  // Update sidebar active state
  document.querySelectorAll('[data-route]').forEach((el) => {
    el.classList.toggle('active', el.dataset.route === routeId);
  });

  // Update header title
  const titleEl = document.getElementById('header-title');
  if (titleEl) titleEl.textContent = route.label;

  // Load page fragment
  await loadComponent('view-slot', route.page);

  // Bootstrap page-specific JS
  await bootstrapPage(route.page);

  // Scroll to top
  document.getElementById('view-slot')?.scrollTo?.({ top: 0, behavior: 'smooth' });
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Dispatch event — pages can hook into this to init their JS
  document.dispatchEvent(new CustomEvent('simantri:page-loaded', { detail: { route } }));

  // Close mobile drawer
  document.getElementById('sidebar-drawer')?.classList.add('hidden');
}

// ============================================
// Init app shell
// ============================================
export async function initApp() {
  // Load sidebar + header
  await Promise.all([
    loadComponent('sidebar-slot', 'components/layout/sidebar'),
    loadComponent('header-slot', 'components/layout/header'),
  ]);

  // Load sidebar.js behavior (attach event listeners)
  const sidebarMod = await import('../../components/layout/sidebar.js');
  sidebarMod.initSidebar({ navigateTo, routes: ROUTES, groupLabels: GROUP_LABELS });

  const headerMod = await import('../../components/layout/header.js');
  headerMod.initHeader({ navigateTo, getProfile, signOut });

  // Initial route from hash
  const hash = window.location.hash.replace(/^#\//, '');
  const initialRoute = ROUTES.find((r) => r.id === hash) ?? ROUTES[0];
  await navigateTo(initialRoute.id);

  // Hash change listener
  window.addEventListener('hashchange', () => {
    const h = window.location.hash.replace(/^#\//, '');
    if (h && h !== _currentRouteId) navigateTo(h);
  });
}
