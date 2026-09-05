// ============================================
// SIMANTRI — Supabase client & helpers
// ============================================
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON || SUPABASE_URL.includes('YOUR-PROJECT-REF')) {
  // eslint-disable-next-line no-console
  console.warn(
    '[SIMANTRI] Supabase env belum di-set. Salin .env.example ke .env lalu isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(SUPABASE_URL ?? 'https://placeholder.supabase.co', SUPABASE_ANON ?? 'placeholder-anon', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: { params: { eventsPerSecond: 5 } },
});

// ============================================
// Table helpers
// ============================================
export const TABLES = Object.freeze({
  PROFILES: 'profiles',
  TENAGA_KESEHATAN: 'tenaga_kesehatan',
  FASYANKES: 'fasyankes',
  PRAKTIK: 'praktik',
  AUDIT_LOG: 'audit_log',
  NOTIFICATIONS: 'notifications',
});

// ============================================
// Status helpers — untuk badge warna
// ============================================
export const STATUS = Object.freeze({
  AKTIF: 'aktif',
  HAMPIR_EXPIRED: 'hampir_expired',
  EXPIRED: 'expired',
  NONAKTIF: 'nonaktif',
  PENDING: 'pending',
  DIVERIFIKASI: 'diverifikasi',
  DITOLAK: 'ditolak',
});

/**
 * Hitung status masa berlaku berdasarkan tanggal akhir.
 * H < 90 hari = hampir_expired; H < 0 = expired; sisanya aktif.
 */
export function calcExpireStatus(tglAkhir, thresholdDays = 90) {
  if (!tglAkhir) return STATUS.NONAKTIF;
  const end = new Date(tglAkhir).getTime();
  const now = Date.now();
  const diff = end - now;
  if (diff < 0) return STATUS.EXPIRED;
  if (diff < thresholdDays * 24 * 60 * 60 * 1000) return STATUS.HAMPIR_EXPIRED;
  return STATUS.AKTIF;
}

export function statusBadgeClass(status) {
  switch (status) {
    case STATUS.AKTIF:
    case STATUS.DIVERIFIKASI:
      return 'badge-teal';
    case STATUS.HAMPIR_EXPIRED:
    case STATUS.PENDING:
      return 'badge-amber';
    case STATUS.EXPIRED:
    case STATUS.DITOLAK:
    case STATUS.NONAKTIF:
      return 'badge-rose';
    default:
      return 'badge-ink';
  }
}

export function statusLabel(status) {
  return ({
    [STATUS.AKTIF]: 'Aktif',
    [STATUS.HAMPIR_EXPIRED]: 'Hampir Expired',
    [STATUS.EXPIRED]: 'Expired',
    [STATUS.NONAKTIF]: 'Nonaktif',
    [STATUS.PENDING]: 'Menunggu Verifikasi',
    [STATUS.DIVERIFIKASI]: 'Diverifikasi',
    [STATUS.DITOLAK]: 'Ditolak',
  })[status] ?? status;
}

// ============================================
// Generic data fetch — dengan error normalisasi
// ============================================
export async function fetchAll(table, { select = '*', filter, order, limit } = {}) {
  let q = supabase.from(table).select(select);
  if (filter) q = filter(q);
  if (order) q = q.order(order.column, { ascending: order.ascending ?? false });
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw new Error(`[${table}] ${error.message}`);
  return data ?? [];
}

export async function fetchOne(table, id, { select = '*' } = {}) {
  const { data, error } = await supabase.from(table).select(select).eq('id', id).maybeSingle();
  if (error) throw new Error(`[${table}] ${error.message}`);
  return data;
}

export async function insertRow(table, payload) {
  const { data, error } = await supabase.from(table).insert(payload).select().single();
  if (error) throw new Error(`[${table}] ${error.message}`);
  return data;
}

export async function updateRow(table, id, payload) {
  const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().single();
  if (error) throw new Error(`[${table}] ${error.message}`);
  return data;
}

export async function deleteRow(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw new Error(`[${table}] ${error.message}`);
  return true;
}

// ============================================
// Storage helpers — file STR/SIP upload
// ============================================
export async function uploadFile(bucket, path, file) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });
  if (error) throw new Error(`[storage:${bucket}] ${error.message}`);
  return data;
}

export function publicFileUrl(bucket, path) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

// ============================================
// Demo fallback data — dipakai jika env belum di-set
// (Supaya UI tetap bisa di-preview tanpa backend)
// ============================================
export const isDemoMode = !SUPABASE_URL || SUPABASE_URL.includes('placeholder') || SUPABASE_URL.includes('YOUR-PROJECT-REF');
