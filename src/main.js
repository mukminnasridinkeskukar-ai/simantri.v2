// SIMANTRI — entry point
import './styles/main.css';
import { initApp, navigateTo } from './assets/js/app.js';
import { initAuth, onAuthReady } from './assets/js/auth.js';

// Bootstrap
(async () => {
  try {
    // Init Supabase client (no network call — safe to call sync)
    initAuth();

    // Wait for auth state to settle (session restore)
    await onAuthReady();

    // Init router + load default view
    await initApp();

    // Expose for debugging / inline onclick handlers
    window.SIMANTRI = { navigateTo };

    // Sembunyikan loading screen setelah app siap
    if (typeof window.SIMANTRI_HIDE_LOADER === 'function') {
      window.SIMANTRI_HIDE_LOADER();
    }
  } catch (err) {
    console.error('[SIMANTRI] Bootstrap error:', err);

    // Sembunyikan loader, tampilkan error
    const loader = document.getElementById('initial-loader');
    if (loader) loader.classList.add('hidden');

    const errBox = document.getElementById('load-error');
    const detail = document.getElementById('error-detail');
    if (errBox) errBox.classList.add('show');
    if (detail) {
      detail.textContent =
        'Bootstrap error: ' + (err.message || err) + '\n\n' +
        'Stack trace:\n' + (err.stack || '(tidak tersedia)');
    }
  }
})();
