/* ============================================================================
 * SIMANTRI v3 — App router & bootstrap
 * Plain JS. Load LAST (after all pages).
 *
 * FLOW:
 *   1. Saat aplikasi dibuka → user adalah "public viewer"
 *      - Bisa lihat seluruh data & navigasi semua halaman
 *      - TIDAK bisa add/edit/delete/download/print/verify (tombol di-hide)
 *   2. User klik "Login Admin" di header → muncul modal login
 *   3. Login sukses → dapat full access (Admin Dinkes)
 *   4. Logout → kembali ke public viewer mode
 *
 * TIDAK ADA PENYIMPANAN SESSION — refresh browser = kembali ke public viewer
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
    // Permission check: manajemen-user hanya untuk admin yang sudah login
    if (route.dinkesOnly && !auth.isAuthenticated()) {
      utils.toast('Akses ditolak: halaman ini hanya untuk Admin Dinkes. Silakan login terlebih dahulu.', 'warning');
      openLoginModal();
      return;
    }

    _currentRouteId = routeId;

    if (window.location.hash !== '#/' + routeId) {
      history.replaceState(null, '', '#/' + routeId);
    }

    components.setActiveRoute(routeId);

    const titleEl = document.getElementById('header-title');
    if (titleEl) titleEl.textContent = route.label;

    const viewSlot = document.getElementById('view-slot');
    if (!viewSlot) return;

    const page = window.SIMANTRI_PAGES && window.SIMANTRI_PAGES[routeId];
    if (!page) {
      viewSlot.innerHTML = '<div class="card p-8 text-center text-ink-500"><p class="font-semibold">Halaman belum tersedia</p><p class="text-sm mt-1">Konten untuk <code>' + routeId + '</code> akan segera hadir.</p></div>';
      return;
    }

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

    // Apply role-based permissions (hide/show tombol berdasarkan status login)
    applyRolePermissions(viewSlot);

    viewSlot.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const drawer = document.getElementById('sidebar-drawer');
    if (drawer) drawer.classList.add('hidden');

    if (typeof page.init === 'function') {
      try {
        await page.init();
        // Apply lagi setelah init (sebab init mungkin add tombol dinamis)
        applyRolePermissions(viewSlot);
      } catch (err) {
        console.error('[SIMANTRI] Page init error (' + routeId + '):', err);
        utils.toast('Gagal memuat halaman: ' + err.message, 'error');
      }
    }

    document.dispatchEvent(new CustomEvent('simantri:page-loaded', { detail: { route: route } }));
  }

  // === ROLE PERMISSIONS — sembunyikan tombol yang tidak diizinkan ===
  function applyRolePermissions(scope) {
    scope = scope || document;
    const buttons = scope.querySelectorAll('[data-role-action]');
    buttons.forEach(function (el) {
      const action = el.getAttribute('data-role-action');
      if (!action) return;
      const allowed = auth.can(action);
      if (allowed) {
        el.style.display = '';
        el.removeAttribute('aria-hidden');
        el.removeAttribute('disabled');
      } else {
        el.style.display = 'none';
        el.setAttribute('aria-hidden', 'true');
        if (el.tagName === 'BUTTON') el.setAttribute('disabled', 'disabled');
      }
    });

    const dinkesOnlyEls = scope.querySelectorAll('.role-dinkes-only');
    dinkesOnlyEls.forEach(function (el) {
      el.style.display = auth.isAuthenticated() ? '' : 'none';
    });
    const adminOnlyEls = scope.querySelectorAll('.role-admin-only');
    adminOnlyEls.forEach(function (el) {
      el.style.display = auth.isAuthenticated() ? '' : 'none';
    });
  }

  // === LOGIN MODAL ===
  function openLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
      modal.classList.remove('hidden');
      // Focus ke email input setelah render
      setTimeout(function () {
        const emailInput = document.getElementById('login-email');
        if (emailInput) emailInput.focus();
      }, 100);
    }
  }

  function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.classList.add('hidden');
    // Reset form
    const emailInput = document.getElementById('login-email');
    const pwdInput = document.getElementById('login-password');
    const errBox = document.getElementById('login-error');
    if (emailInput) emailInput.value = '';
    if (pwdInput) pwdInput.value = '';
    if (errBox) errBox.classList.add('hidden');
  }

  function bindLoginHandlers() {
    if (document.body.getAttribute('data-login-bound')) return;
    document.body.setAttribute('data-login-bound', '1');

    const form = document.getElementById('login-form');
    const errBox = document.getElementById('login-error');
    const submitBtn = document.getElementById('login-submit');

    if (form) {
      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        if (!email || !password) {
          if (errBox) {
            errBox.textContent = 'Email dan password wajib diisi';
            errBox.classList.remove('hidden');
          }
          return;
        }
        if (errBox) errBox.classList.add('hidden');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9"/></svg> Memproses...';
        }
        try {
          await auth.signIn(email, password);
          utils.toast('Selamat datang, ' + (auth.getProfile().full_name || 'Admin'), 'success');
          closeLoginModal();
          // Re-render sidebar & header untuk update UI (ganti tombol "Login Admin" jadi user info)
          components.renderSidebar('sidebar-slot');
          components.renderHeader('header-slot', components.ROUTES.find(function (r) { return r.id === _currentRouteId; }) || components.ROUTES[0]);
          // Re-navigate untuk apply permissions
          await navigateTo(_currentRouteId || 'dashboard');
        } catch (err) {
          if (errBox) {
            errBox.textContent = err.message;
            errBox.classList.remove('hidden');
          }
          console.error('[SIMANTRI] Login error:', err);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg> Masuk';
          }
        }
      });
    }

    // Toggle password
    const toggleBtn = document.getElementById('toggle-password');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        const input = document.getElementById('login-password');
        if (input) input.type = input.type === 'password' ? 'text' : 'password';
      });
    }

    // Demo account quick-fill
    document.querySelectorAll('.demo-account').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const email = btn.getAttribute('data-email');
        const password = btn.getAttribute('data-password');
        const emailInput = document.getElementById('login-email');
        const pwdInput = document.getElementById('login-password');
        if (emailInput) emailInput.value = email;
        if (pwdInput) pwdInput.value = password;
        if (errBox) errBox.classList.add('hidden');
        if (form) form.dispatchEvent(new Event('submit', { cancelable: true }));
      });
    });

    // Close modal handlers
    document.querySelectorAll('[data-login-close]').forEach(function (el) {
      el.addEventListener('click', closeLoginModal);
    });

    // ESC to close
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        const modal = document.getElementById('login-modal');
        if (modal && !modal.classList.contains('hidden')) {
          closeLoginModal();
        }
      }
    });
  }

  // === Init app — main entry ===
  async function initApp() {
    auth.initAuth();
    await auth.onAuthReady();

    // Hide initial loader
    if (typeof window.SIMANTRI_HIDE_LOADER === 'function') {
      window.SIMANTRI_HIDE_LOADER();
    }

    // Bind login handlers (sekali saja)
    bindLoginHandlers();

    // Render sidebar & header (langsung tampil — public viewer mode)
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

    // Listen for auth state changes (login / logout)
    document.addEventListener('simantri:auth-change', function (e) {
      const profile = e.detail && e.detail.profile;
      // Re-render sidebar & header untuk update UI
      components.renderSidebar('sidebar-slot');
      components.renderHeader('header-slot', components.ROUTES.find(function (r) { return r.id === _currentRouteId; }) || components.ROUTES[0]);
      // Re-apply permissions
      applyRolePermissions(document);
      if (profile) {
        console.log('%c[SIMANTRI] Login berhasil sebagai: ' + profile.full_name, 'color:#0D9488;font-weight:bold;');
      } else {
        console.log('%c[SIMANTRI] Logout → kembali ke public viewer', 'color:#64748B;font-weight:bold;');
      }
    });

    console.log('%c[SIMANTRI] App ready ✓ — Public viewer mode', 'color:#0D9488;font-weight:bold;');
    if (db.isDemoMode()) {
      console.info('%c[SIMANTRI] DEMO MODE — pakai data mock', 'color:#F59E0B;font-weight:bold;');
    }
    console.info('[SIMANTRI] Klik "Login Admin" di header untuk akses penuh');
  }

  // === Bootstrap ===
  (async function () {
    try {
      await initApp();
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
    applyRolePermissions: applyRolePermissions,
    openLoginModal: openLoginModal,
    closeLoginModal: closeLoginModal,
  };
})();
