/* =========================================================
 * SIMANTRI — Koneksi Supabase (supabase-js v2 via CDN ESM)
 * ---------------------------------------------------------
 * Semua data aplikasi diambil LIVE dari Supabase.
 * TIDAK ADA mock data dan TIDAK ADA localStorage untuk data
 * aplikasi. (persistSession hanya menyimpan sesi login/token
 * milik Supabase Auth — bukan data SIMANTRI.)
 * ========================================================= */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const cfg = window.SIMANTRI_CONFIG || {};
const url = String(cfg.SUPABASE_URL || '').trim();
const key = String(cfg.SUPABASE_ANON_KEY || '').trim();

/** true bila config.js sudah diisi dengan kredensial asli */
export const SUPABASE_TERKONFIGURASI =
  !!url && !!key && !url.includes('GANTI-DENGAN') && !key.includes('GANTI-DENGAN');

/** Klien Supabase (null bila config belum diisi) */
export const supabase = SUPABASE_TERKONFIGURASI
  ? createClient(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
