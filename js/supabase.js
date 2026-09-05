/* ============================================================================
 * SIMANTRI v3 — Supabase client & helpers
 * Plain JS. Pakai window.supabase (dari CDN UMD).
 * ============================================================================ */

(function () {
  'use strict';

  const cfg = window.SIMANTRI_CONFIG || {};
  const utils = window.SIMANTRI_UTILS;

  // === State ===
  let _client = null;
  let _isDemoMode = !cfg.SUPABASE_URL || cfg.SUPABASE_URL === '' || cfg.FORCE_DEMO_MODE;

  // === Constants ===
  const TABLES = {
    PROFILES: 'profiles',
    TENAGA_KESEHATAN: 'tenaga_kesehatan',
    FASYANKES: 'fasyankes',
    PRAKTIK: 'praktik',
    AUDIT_LOG: 'audit_log',
    NOTIFICATIONS: 'notifications',
  };

  const STATUS = {
    AKTIF: 'aktif',
    HAMPIR_EXPIRED: 'hampir_expired',
    EXPIRED: 'expired',
    NONAKTIF: 'nonaktif',
    PENDING: 'pending',
    DIVERIFIKASI: 'diverifikasi',
    DITOLAK: 'ditolak',
  };

  // === Init client ===
  function getClient() {
    if (_client) return _client;
    if (_isDemoMode) return null;
    if (typeof window.supabase === 'undefined') {
      console.error('[SIMANTRI] supabase-js CDN belum load. Cek koneksi internet.');
      _isDemoMode = true;
      return null;
    }
    try {
      _client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        realtime: { params: { eventsPerSecond: 5 } },
      });
      console.log('[SIMANTRI] Supabase client initialized:', cfg.SUPABASE_URL);
    } catch (e) {
      console.error('[SIMANTRI] Gagal init Supabase:', e);
      _isDemoMode = true;
    }
    return _client;
  }

  // === Helpers ===
  function calcExpireStatus(tglAkhir, thresholdDays) {
    thresholdDays = thresholdDays || (cfg.EXPIRY_WARNING_DAYS || 90);
    if (!tglAkhir) return STATUS.NONAKTIF;
    const end = new Date(tglAkhir).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff < 0) return STATUS.EXPIRED;
    if (diff < thresholdDays * 24 * 60 * 60 * 1000) return STATUS.HAMPIR_EXPIRED;
    return STATUS.AKTIF;
  }

  function statusBadgeClass(status) {
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

  function statusLabel(status) {
    const map = {
      [STATUS.AKTIF]: 'Aktif',
      [STATUS.HAMPIR_EXPIRED]: 'Hampir Expired',
      [STATUS.EXPIRED]: 'Expired',
      [STATUS.NONAKTIF]: 'Nonaktif',
      [STATUS.PENDING]: 'Menunggu Verifikasi',
      [STATUS.DIVERIFIKASI]: 'Diverifikasi',
      [STATUS.DITOLAK]: 'Ditolak',
    };
    return map[status] || status;
  }

  // === Generic data fetch (production only — demo pakai demo-data.js) ===
  async function fetchAll(table, options) {
    options = options || {};
    const client = getClient();
    if (!client) throw new Error('Supabase not configured (demo mode)');

    let q = client.from(table).select(options.select || '*');
    if (options.filter) q = options.filter(q);
    if (options.order) q = q.order(options.order.column, { ascending: options.order.ascending || false });
    if (options.limit) q = q.limit(options.limit);

    const { data, error } = await q;
    if (error) throw new Error('[' + table + '] ' + error.message);
    return data || [];
  }

  async function insertRow(table, payload) {
    const client = getClient();
    if (!client) throw new Error('Supabase not configured');
    const { data, error } = await client.from(table).insert(payload).select().single();
    if (error) throw new Error('[' + table + '] ' + error.message);
    return data;
  }

  async function updateRow(table, id, payload) {
    const client = getClient();
    if (!client) throw new Error('Supabase not configured');
    const { data, error } = await client.from(table).update(payload).eq('id', id).select().single();
    if (error) throw new Error('[' + table + '] ' + error.message);
    return data;
  }

  async function deleteRow(table, id) {
    const client = getClient();
    if (!client) throw new Error('Supabase not configured');
    const { error } = await client.from(table).delete().eq('id', id);
    if (error) throw new Error('[' + table + '] ' + error.message);
    return true;
  }

  // === Storage ===
  async function uploadFile(bucket, path, file) {
    const client = getClient();
    if (!client) throw new Error('Supabase not configured');
    const { data, error } = await client.storage.from(bucket).upload(path, file, {
      cacheControl: '3600', upsert: true,
    });
    if (error) throw new Error('[storage:' + bucket + '] ' + error.message);
    return data;
  }

  function publicFileUrl(bucket, path) {
    const client = getClient();
    if (!client) return '';
    return client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  // === Expose ===
  window.SIMANTRI_DB = {
    TABLES: TABLES,
    STATUS: STATUS,
    isDemoMode: function () { return _isDemoMode; },
    getClient: getClient,
    calcExpireStatus: calcExpireStatus,
    statusBadgeClass: statusBadgeClass,
    statusLabel: statusLabel,
    fetchAll: fetchAll,
    fetchOne: async function (table, id, opts) {
      const client = getClient();
      if (!client) throw new Error('demo mode');
      const { data, error } = await client.from(table).select(opts?.select || '*').eq('id', id).maybeSingle();
      if (error) throw new Error('[' + table + '] ' + error.message);
      return data;
    },
    insertRow: insertRow,
    updateRow: updateRow,
    deleteRow: deleteRow,
    uploadFile: uploadFile,
    publicFileUrl: publicFileUrl,
  };

  // Log demo mode
  if (_isDemoMode) {
    console.info('%c[SIMANTRI] DEMO MODE aktif — pakai data mock', 'color:#0D9488;font-weight:bold;');
    console.info('[SIMANTRI] Untuk production: edit config.js, isi SUPABASE_URL & SUPABASE_ANON_KEY');
  }
})();
