/* =========================================================
 * SIMANTRI — KONFIGURASI SUPABASE
 * ---------------------------------------------------------
 * Cara mengisi:
 * 1. Buat project di https://supabase.com
 * 2. Buka Project Settings → API:
 *    - "Project URL"            → isi ke SUPABASE_URL
 *    - "anon / public" key      → isi ke SUPABASE_ANON_KEY
 * 3. Simpan file ini. TIDAK perlu mengubah file lain.
 *
 * Catatan keamanan:
 * - anon key memang dipublikasikan di frontend (bukan
 *   service_role). Keamanan data diatur lewat Row Level
 *   Security (RLS) — lihat sql/schema.sql.
 * - JANGAN pernah menaruh service_role key di file ini.
 * ========================================================= */

window.SIMANTRI_CONFIG = {
  SUPABASE_URL: 'https://kyxclotcblbkzrilldru.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5eGNsb3RjYmxia3pyaWxsZHJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyODIzMjcsImV4cCI6MjEwMTg1ODMyN30.aUrEK8JLCia3vkg8nxin0wmgJw_o92Kia2T5zZM7Gwo',
};
