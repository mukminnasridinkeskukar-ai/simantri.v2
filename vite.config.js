import { defineConfig } from 'vite';
import { resolve } from 'path';

// ============================================================================
// SIMANTRI — Vite config (GitHub Pages ready)
// ============================================================================
//
// Base path strategy:
//   - Development (npm run dev)             → base: '/'  (Vite default)
//   - Production user/organization page     → base: '/'  (https://USERNAME.github.io/)
//   - Production project page (recommended) → base: '/REPO_NAME/'  (https://USERNAME.github.io/REPO/)
//
// Untuk kemudahan, base diambil dari env VITE_BASE_PATH.
// Jika env tidak di-set, fallback ke './' (relative) yang kompatibel di mana saja.
//
// Cara pakai:
//   - Dev lokal:        TIDAK perlu set VITE_BASE_PATH (otomatis '/')
//   - Build untuk project page:  VITE_BASE_PATH=/simantri-nakes-v2/ npm run build
//   - Build untuk user page:     VITE_BASE_PATH=/ npm run build
//   - GitHub Actions: lihat .github/workflows/deploy.yml (auto-detect dari nama repo)
// ============================================================================

const envBase = process.env.VITE_BASE_PATH;
const isDev = process.env.NODE_ENV !== 'production';

// Dev: selalu '/' supaya HMR jalan
// Prod: pakai env jika ada, fallback './' (relative paling aman)
const base = isDev ? '/' : (envBase || './');

export default defineConfig({
  base,
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@assets': resolve(__dirname, 'src/assets'),
    },
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    // Pastikan asset naming stabil & cache-friendly
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          supabase: ['@supabase/supabase-js'],
          chart: ['chart.js'],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
});
