/* ============================================================================
 * SIMANTRI v3 — App router & bootstrap
 * Plain JS. Load LAST (after all pages).
 * ============================================================================ */

(function () {
  'use strict';

  const utils = window.SIMANTRI_UTILS;
  const auth = window.SIMANTRI_AUTH;
  const components = window.SIMANTRI_COMPONENTS;
  const db = window.SIMANTRI_DB;

  let _currentRouteId = null;

  // === navigateTo ===
  async function navigateTo(routeId) {
    const route = components.ROUTES.find(function (r) { return r.id === routeId; });
    if (!route) {
      console.warn('[navigateTo] route "' + routeId + '" tidak ditemukan');
      return;
    }
    // Permission check
    if (route.dinkesOnly && !auth.isDinkes()) {
      utils.toast('Akses ditolak: halaman ini hanya untuk Dinkes', 'error');
      return;
    }

    _currentRouteId = routeId;

    // Update URL hash (anti refresh-404)
    if (window.location.hash !== '#/' + routeId) {
      history.replaceState(null, '', '#/' + routeId);
    }

    // Update sidebar active state
    components.setActiveRoute(routeId);

    // Update header title
    const titleEl = document.getElementById('header-title');
    if (titleEl) titleEl.textContent = route.label;

    // Render page
    const viewSlot = document.getElementById('view-slot');
    if (!viewSlot) return;

    const page = window.SIMANTRI_PAGES && window.SIMANTRI_PAGES[routeId];
    if (!page) {
      viewSlot.innerHTML = '<div class="card p-8 text-center text-ink-500"><p class="font-semibold">Halaman belum tersedia</p><p class="text-sm mt-1">Konten untuk <code>' + routeId + '</code> akan segera hadir.</p></div>';
      return;
    }

    // Inject HTML
    if (typeof page.html === 'function') {
      viewSlot.innerHTML = page.html();
    } else if (typeof page.html === 'string') {
      viewSlot.innerHTML = page.html;
    } else {
      viewSlot.innerHTML = '<div class="card p-8 text-center text-ink-500"><p class="font-semibold">Format halaman tidak valid</p></div>';
      return;
    }

    viewSlot.classList.add('animate-fade-in');
    setTimeout(function () { viewSlot.classList.remove('animate-fade-in'); }, 500);

    // Scroll to top
    viewSlot.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Close mobile drawer
    const drawer = document.getElementById('sidebar-drawer');
    if (drawer) drawer.classList.add('hidden');

    // Init page logic
    if (typeof page.init === 'function') {
      try {
        await page.init();
      } catch (err) {
        console.error('[SIMANTRI] Page init error (' + routeId + '):', err);
        utils.toast('Gagal memuat halaman: ' + err.message, 'error');
      }
    }

    // Dispatch event
    document.dispatchEvent(new CustomEvent('simantri:page-loaded', { detail: { route: route } }));
  }

  // === Init app ===
  async function initApp() {
    // Init auth
    auth.initAuth();
    await auth.onAuthReady();

    // Render sidebar & header
    components.renderSidebar('sidebar-slot');
    components.renderHeader('header-slot', components.ROUTES[0]);

    // Initial route from hash
    const hash = window.location.hash.replace(/^#\//, '');
    const initialRoute = components.ROUTES.find(function (r) { return r.id === hash; }) || components.ROUTES[0];
    await navigateTo(initialRoute.id);

    // Hash change listener
    window.addEventListener('hashchange', function () {
      const h = window.location.hash.replace(/^#\//, '');
      if (h && h !== _currentRouteId) navigateTo(h);
    });
  }

  // === Bootstrap ===
  (async function () {
    try {
      await initApp();
      // Hide loader
      if (typeof window.SIMANTRI_HIDE_LOADER === 'function') {
        window.SIMANTRI_HIDE_LOADER();
      }
      console.log('%c[SIMANTRI] App ready ✓', 'color:#0D9488;font-weight:bold;');
      if (db.isDemoMode()) {
        console.info('%c[SIMANTRI] DEMO MODE aktif — edit config.js untuk pakai Supabase', 'color:#F59E0B;font-weight:bold;');
      }
    } catch (err) {
      console.error('[SIMANTRI] Bootstrap error:', err);
      const loader = document.getElementById('initial-loader');
      if (loader) loader.style.display = 'none';
      const errBox = document.getElementById('load-error');
      const detail = document.getElementById('error-detail');
      if (errBox) errBox.style.display = 'flex';
      if (detail) detail.textContent = 'Bootstrap error: ' + (err.message || err) + '\n\nStack:\n' + (err.stack || '');
    }
  })();

  // === Expose ===
  window.SIMANTRI = {
    navigateTo: navigateTo,
    getCurrentRouteId: function () { return _currentRouteId; },
  };
})();
