/* ============================================================================
 * SIMANTRI v3 — Konfigurasi Aplikasi
 * ============================================================================
 *
 * File ini berisi semua konfigurasi yang mungkin perlu Anda ubah.
 * Edit nilai di bawah sesuai kebutuhan.
 *
 * CARA PAKAI:
 *   1. Untuk DEMO MODE (tanpa Supabase): biarkan SUPABASE_URL kosong ('').
 *      Aplikasi akan pakai data contoh (mock) — cocok untuk preview UI.
 *
 *   2. Untuk PRODUCTION (dengan Supabase):
 *      - Isi SUPABASE_URL dengan URL project Supabase Anda
 *        (contoh: https://abcd1234.supabase.co)
 *      - Isi SUPABASE_ANON_KEY dengan "anon public" key
 *        (BUKAN service_role key! Lihat dashboard Supabase → Settings → API)
 *      - Jalankan supabase/schema.sql di SQL Editor Supabase
 *
 * KEAMANAN:
 *   - Anon key AMAN di-expose di frontend — keamanan data dijamin oleh RLS
 *     (Row Level Security) yang sudah dikonfigurasi di schema.sql
 *   - JANGAN PERNAH taruh service_role key di sini!
 * ============================================================================ */

window.SIMANTRI_CONFIG = {
  // === SUPABASE ===
  // Dapatkan dari: Supabase Dashboard → Project Settings → API
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',

  // === APP INFO ===
  APP_NAME: 'SIMANTRI',
  APP_TAGLINE: 'Sistem Informasi & Manajemen Praktik Nakes',
  APP_VERSION: '3.0.0',

  // === NOTIFICATION ===
  // Threshold hari untuk warning expired (default: 90 hari = H-90)
  EXPIRY_WARNING_DAYS: 90,

  // === DEMO MODE ===
  // Jika true, pakai data mock meskipun Supabase sudah dikonfigurasi
  FORCE_DEMO_MODE: false,
};
