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
  SUPABASE_URL: 'https://GANTI-DENGAN-PROJECT-URL.supabase.co',
  SUPABASE_ANON_KEY: 'GANTI-DENGAN-ANON-KEY',
};
