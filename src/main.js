// SIMANTRI — entry point
import './styles/main.css';
import { initApp, navigateTo } from './assets/js/app.js';
import { initAuth, onAuthReady } from './assets/js/auth.js';

// Bootstrap
(async () => {
  // Init Supabase client (no network call — safe to call sync)
  initAuth();

  // Wait for auth state to settle (session restore)
  await onAuthReady();

  // Init router + load default view
  await initApp();

  // Expose for debugging / inline onclick handlers
  window.SIMANTRI = { navigateTo };
})();
