/* ============================================================================
 * SIMANTRI v3 — Demo data (fallback saat Supabase belum dikonfigurasi)
 * Plain JS. Supaya UI tetap bisa di-preview tanpa backend.
 * ============================================================================ */

(function () {
  'use strict';

  const DEMO_FASYANKES = [
    { id: 'f-001', nama: 'RSUD Dr. Soetomo', jenis: 'RS', alamat: 'Jl. Mayjen Prof. Dr. Moestopo 6-8, Surabaya', lat_lng: '-7.2756,112.7423', status: 'aktif' },
    { id: 'f-002', nama: 'Puskesmas Gundih', jenis: 'Puskesmas', alamat: 'Jl. Gundih 11, Surabaya', lat_lng: '-7.2589,112.7467', status: 'aktif' },
    { id: 'f-003', nama: 'Klinik Utama Sehat Sentosa', jenis: 'Klinik Utama', alamat: 'Jl. Raya Gubeng 99, Surabaya', lat_lng: '-7.2645,112.7551', status: 'aktif' },
    { id: 'f-004', nama: 'Apotek Kimia Farma Gubeng', jenis: 'Apotek', alamat: 'Jl. Gubeng Raya 12, Surabaya', lat_lng: '-7.2671,112.7542', status: 'aktif' },
    { id: 'f-005', nama: 'Praktik Mandiri Dr. Andi', jenis: 'Praktik Mandiri', alamat: 'Jl. Dharmahusada 88, Surabaya', lat_lng: '-7.2644,112.7702', status: 'aktif' },
  ];

  const DEMO_NAKES = [
    { id: 'n-001', nik: '3501010101900001', nama: 'Dr. Budi Santoso, Sp.PD', profesi: 'Dokter Spesialis Penyakit Dalam', jenis: 'Dokter Spesialis', no_str: 'STR/12345/2023', tgl_terbit_str: '2023-01-15', tgl_akhir_str: '2026-12-31', file_str_url: null, fasyankes_id: 'f-001', status: 'aktif' },
    { id: 'n-002', nik: '3501020202950002', nama: 'Dr. Siti Aminah', profesi: 'Dokter Umum', jenis: 'Dokter', no_str: 'STR/23456/2024', tgl_terbit_str: '2024-03-10', tgl_akhir_str: '2026-11-20', file_str_url: null, fasyankes_id: 'f-002', status: 'aktif' },
    { id: 'n-003', nik: '3501030303880003', nama: 'Dr. Andi Wijaya, Sp.B', profesi: 'Dokter Spesialis Bedah', jenis: 'Dokter Spesialis', no_str: 'STR/34567/2022', tgl_terbit_str: '2022-05-20', tgl_akhir_str: '2026-09-10', file_str_url: null, fasyankes_id: 'f-005', status: 'aktif' },
    { id: 'n-004', nik: '3501040404900004', nama: 'Ns. Rina Marlina, S.Kep', profesi: 'Perawat', jenis: 'Perawat', no_str: 'STR/45678/2023', tgl_terbit_str: '2023-07-01', tgl_akhir_str: '2026-07-30', file_str_url: null, fasyankes_id: 'f-001', status: 'aktif' },
    { id: 'n-005', nik: '3501050505850005', nama: 'Bdn. Dewi Lestari, Amd.Keb', profesi: 'Bidan', jenis: 'Bidan', no_str: 'STR/56789/2023', tgl_terbit_str: '2023-02-15', tgl_akhir_str: '2026-02-14', file_str_url: null, fasyankes_id: 'f-002', status: 'aktif' },
    { id: 'n-006', nik: '3501060606780006', nama: 'Apt. Joko Susanto, M.Farm', profesi: 'Apoteker', jenis: 'Apoteker', no_str: 'STR/67890/2021', tgl_terbit_str: '2021-08-10', tgl_akhir_str: '2025-08-09', file_str_url: null, fasyankes_id: 'f-004', status: 'aktif' },
    { id: 'n-007', nik: '3501070701920007', nama: 'Dr. Maya Sari, Sp.OG', profesi: 'Dokter Spesialis Obstetri & Ginekologi', jenis: 'Dokter Spesialis', no_str: 'STR/78901/2022', tgl_terbit_str: '2022-11-30', tgl_akhir_str: '2026-09-25', file_str_url: null, fasyankes_id: 'f-001', status: 'aktif' },
    { id: 'n-008', nik: '3501080803950008', nama: 'Rahmat Hidayat, Amd.AK', profesi: 'Analis Kesehatan', jenis: 'ATLM', no_str: 'STR/89012/2024', tgl_terbit_str: '2024-01-20', tgl_akhir_str: '2027-01-19', file_str_url: null, fasyankes_id: 'f-001', status: 'aktif' },
    { id: 'n-009', nik: '3501090904870009', nama: 'Wati Ningsih, S.Gz', profesi: 'Ahli Gizi', jenis: 'Gizi', no_str: 'STR/90123/2023', tgl_terbit_str: '2023-06-12', tgl_akhir_str: '2026-09-30', file_str_url: null, fasyankes_id: 'f-002', status: 'aktif' },
    { id: 'n-010', nik: '3501101005890010', nama: 'Slamet Riyadi', profesi: 'Sanitarian', jenis: 'Kesling', no_str: 'STR/01234/2022', tgl_terbit_str: '2022-04-01', tgl_akhir_str: '2025-04-01', file_str_url: null, fasyankes_id: 'f-003', status: 'nonaktif' },
    { id: 'n-011', nik: '3501111106900011', nama: 'Dr. Putri Anggraini', profesi: 'Dokter Gigi', jenis: 'Dokter Gigi', no_str: 'STR/11111/2023', tgl_terbit_str: '2023-09-05', tgl_akhir_str: '2026-09-05', file_str_url: null, fasyankes_id: 'f-003', status: 'aktif' },
    { id: 'n-012', nik: '3501121207860012', nama: 'Yuni Astuti, Amd.Keb', profesi: 'Bidan', jenis: 'Bidan', no_str: 'STR/22222/2021', tgl_terbit_str: '2021-10-10', tgl_akhir_str: '2025-09-15', file_str_url: null, fasyankes_id: 'f-005', status: 'aktif' },
  ];

  const DEMO_PRAKTIK = [
    { id: 'p-001', tenaga_id: 'n-001', fasyankes_id: 'f-001', no_sip: 'SIP/001/2024', tgl_terbit_sip: '2024-01-10', tgl_akhir_sip: '2026-12-31', jadwal_json: '{"senin":{"mulai":"08:00","selesai":"14:00"},"rabu":{"mulai":"08:00","selesai":"14:00"},"jumat":{"mulai":"13:00","selesai":"19:00"}}', status: 'aktif' },
    { id: 'p-002', tenaga_id: 'n-002', fasyankes_id: 'f-002', no_sip: 'SIP/002/2024', tgl_terbit_sip: '2024-02-15', tgl_akhir_sip: '2026-11-20', jadwal_json: '{"senin_jumat":{"mulai":"07:30","selesai":"13:00"}}', status: 'aktif' },
    { id: 'p-003', tenaga_id: 'n-003', fasyankes_id: 'f-005', no_sip: 'SIP/003/2023', tgl_terbit_sip: '2023-03-20', tgl_akhir_sip: '2026-09-10', jadwal_json: '{"selasa":{"mulai":"15:00","selesai":"20:00"},"kamis":{"mulai":"15:00","selesai":"20:00"}}', status: 'aktif' },
    { id: 'p-004', tenaga_id: 'n-004', fasyankes_id: 'f-001', no_sip: 'SIP/004/2024', tgl_terbit_sip: '2024-04-01', tgl_akhir_sip: '2026-07-30', jadwal_json: '{"shift_pagi":{"mulai":"07:00","selesai":"14:00"},"shift_sore":{"mulai":"14:00","selesai":"21:00"}}', status: 'aktif' },
    { id: 'p-005', tenaga_id: 'n-005', fasyankes_id: 'f-002', no_sip: 'SIP/005/2024', tgl_terbit_sip: '2024-02-20', tgl_akhir_sip: '2026-02-14', jadwal_json: '{"senin_sabtu":{"mulai":"08:00","selesai":"15:00"}}', status: 'aktif' },
    { id: 'p-006', tenaga_id: 'n-006', fasyankes_id: 'f-004', no_sip: 'SIK/006/2024', tgl_terbit_sip: '2024-01-15', tgl_akhir_sip: '2027-01-14', jadwal_json: '{"senin_sabtu":{"mulai":"09:00","selesai":"17:00"}}', status: 'aktif' },
    { id: 'p-007', tenaga_id: 'n-007', fasyankes_id: 'f-001', no_sip: 'SIP/007/2023', tgl_terbit_sip: '2023-05-10', tgl_akhir_sip: '2026-09-25', jadwal_json: '{"senin":{"mulai":"09:00","selesai":"15:00"},"rabu":{"mulai":"09:00","selesai":"15:00"}}', status: 'aktif' },
    { id: 'p-008', tenaga_id: 'n-011', fasyankes_id: 'f-003', no_sip: 'SIP/008/2024', tgl_terbit_sip: '2024-09-10', tgl_akhir_sip: '2026-09-05', jadwal_json: '{"senin_jumat":{"mulai":"10:00","selesai":"18:00"}}', status: 'aktif' },
    { id: 'p-009', tenaga_id: 'n-012', fasyankes_id: 'f-005', no_sip: 'SIP/009/2022', tgl_terbit_sip: '2022-11-01', tgl_akhir_sip: '2025-09-15', jadwal_json: '{"senin_sabtu":{"mulai":"08:00","selesai":"14:00"}}', status: 'hampir_expired' },
  ];

  const DEMO_NOTIFICATIONS = [
    { id: 'notif-001', tenaga_id: 'n-006', type: 'str_expired', title: 'STR Apt. Joko Susanto telah EXPIRED', message: 'STR berakhir 9 Agt 2025. Segera lakukan perpanjangan.', created_at: '2025-08-10T02:00:00Z', is_read: false },
    { id: 'notif-002', tenaga_id: 'n-010', type: 'str_expired', title: 'STR Slamet Riyadi telah EXPIRED', message: 'STR berakhir 1 Apr 2025. Status nakes di-nonaktifkan.', created_at: '2025-04-02T02:00:00Z', is_read: false },
    { id: 'notif-003', tenaga_id: 'n-012', type: 'sip_hampir_expired', title: 'SIP Yuni Astuti akan expired dalam 10 hari', message: 'SIP berakhir 15 Sep 2025.', created_at: '2025-09-05T02:00:00Z', is_read: false },
    { id: 'notif-004', tenaga_id: 'n-005', type: 'str_hampir_expired', title: 'STR Bdn. Dewi Lestari akan expired dalam 30 hari', message: 'STR berakhir 14 Feb 2026.', created_at: '2025-09-01T02:00:00Z', is_read: true },
  ];

  // === Loaders (work for both demo & prod) ===
  const db = window.SIMANTRI_DB;
  const STATUS = db.STATUS;

  function attachExpireStatus(arr, dateField) {
    return arr.map(function (x) {
      x.expire_status = db.calcExpireStatus(x[dateField]);
      return x;
    });
  }

  async function loadNakes(opts) {
    opts = opts || {};
    if (db.isDemoMode()) {
      let data = DEMO_NAKES.slice();
      if (opts.search) {
        const q = opts.search.toLowerCase();
        data = data.filter(function (n) {
          return (n.nama || '').toLowerCase().indexOf(q) >= 0 ||
                 (n.nik || '').indexOf(q) >= 0 ||
                 (n.no_str || '').toLowerCase().indexOf(q) >= 0 ||
                 (n.profesi || '').toLowerCase().indexOf(q) >= 0;
        });
      }
      if (opts.fasyankesId) data = data.filter(function (n) { return n.fasyankes_id === opts.fasyankesId; });
      if (opts.jenis) {
        const jenisArr = Array.isArray(opts.jenis) ? opts.jenis : [opts.jenis];
        data = data.filter(function (n) { return jenisArr.indexOf(n.jenis) >= 0; });
      }
      if (opts.status) data = data.filter(function (n) { return db.calcExpireStatus(n.tgl_akhir_str) === opts.status; });
      return attachExpireStatus(data, 'tgl_akhir_str');
    }
    let q = db.getClient().from('tenaga_kesehatan').select('*');
    if (opts.search) {
      q = q.or('nama.ilike.%' + opts.search + '%,nik.ilike.%' + opts.search + '%,no_str.ilike.%' + opts.search + '%,profesi.ilike.%' + opts.search + '%');
    }
    if (opts.fasyankesId) q = q.eq('fasyankes_id', opts.fasyankesId);
    if (opts.jenis) {
      const j = Array.isArray(opts.jenis) ? opts.jenis : [opts.jenis];
      q = q.in('jenis', j);
    }
    const { data, error } = await q.order('nama', { ascending: true });
    if (error) throw error;
    return attachExpireStatus(data || [], 'tgl_akhir_str');
  }

  async function loadFasyankes(opts) {
    opts = opts || {};
    if (db.isDemoMode()) {
      let data = DEMO_FASYANKES.slice();
      if (opts.search) {
        const q = opts.search.toLowerCase();
        data = data.filter(function (f) {
          return (f.nama || '').toLowerCase().indexOf(q) >= 0 || (f.alamat || '').toLowerCase().indexOf(q) >= 0;
        });
      }
      if (opts.jenis) data = data.filter(function (f) { return f.jenis === opts.jenis; });
      return data;
    }
    let q = db.getClient().from('fasyankes').select('*');
    if (opts.search) q = q.or('nama.ilike.%' + opts.search + '%,alamat.ilike.%' + opts.search + '%');
    if (opts.jenis) q = q.eq('jenis', opts.jenis);
    const { data, error } = await q.order('nama', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function loadPraktik(opts) {
    opts = opts || {};
    if (db.isDemoMode()) {
      let data = DEMO_PRAKTIK.slice();
      if (opts.tenagaId) data = data.filter(function (p) { return p.tenaga_id === opts.tenagaId; });
      if (opts.fasyankesId) data = data.filter(function (p) { return p.fasyankes_id === opts.fasyankesId; });
      if (opts.status) data = data.filter(function (p) { return p.status === opts.status; });
      return attachExpireStatus(data, 'tgl_akhir_sip');
    }
    let q = db.getClient().from('praktik').select('*, tenaga_kesehatan(*), fasyankes(*)');
    if (opts.tenagaId) q = q.eq('tenaga_id', opts.tenagaId);
    if (opts.fasyankesId) q = q.eq('fasyankes_id', opts.fasyankesId);
    if (opts.status) q = q.eq('status', opts.status);
    const { data, error } = await q.order('tgl_akhir_sip', { ascending: true });
    if (error) throw error;
    return attachExpireStatus(data || [], 'tgl_akhir_sip');
  }

  async function loadDashboardStats() {
    if (db.isDemoMode()) {
      const nakes = DEMO_NAKES;
      const praktik = DEMO_PRAKTIK;
      const tenagaMedis = nakes.filter(function (n) { return ['Dokter', 'Dokter Gigi', 'Dokter Spesialis'].indexOf(n.jenis) >= 0; }).length;
      const tenagaKesehatan = nakes.length - tenagaMedis;
      return {
        totalNakes: nakes.length,
        totalFasyankes: DEMO_FASYANKES.length,
        totalPraktik: praktik.length,
        tenagaMedis: tenagaMedis,
        tenagaKesehatan: tenagaKesehatan,
        str: {
          aktif: nakes.filter(function (n) { return db.calcExpireStatus(n.tgl_akhir_str) === STATUS.AKTIF; }).length,
          hampir: nakes.filter(function (n) { return db.calcExpireStatus(n.tgl_akhir_str) === STATUS.HAMPIR_EXPIRED; }).length,
          expired: nakes.filter(function (n) { return db.calcExpireStatus(n.tgl_akhir_str) === STATUS.EXPIRED; }).length,
        },
        sip: {
          aktif: praktik.filter(function (p) { return db.calcExpireStatus(p.tgl_akhir_sip) === STATUS.AKTIF; }).length,
          hampir: praktik.filter(function (p) { return db.calcExpireStatus(p.tgl_akhir_sip) === STATUS.HAMPIR_EXPIRED; }).length,
          expired: praktik.filter(function (p) { return db.calcExpireStatus(p.tgl_akhir_sip) === STATUS.EXPIRED; }).length,
        },
        byJenis: countBy(nakes, 'jenis'),
        byFasyankes: countBy(nakes, 'fasyankes_id'),
      };
    }
    // Production: multiple queries
    const client = db.getClient();
    const [nakes, fasyankes, praktik] = await Promise.all([
      client.from('tenaga_kesehatan').select('id, jenis, tgl_akhir_str'),
      client.from('fasyankes').select('id'),
      client.from('praktik').select('id, tgl_akhir_sip'),
    ]);
    if (nakes.error) throw nakes.error;
    const nakesData = nakes.data || [];
    const tenagaMedis = nakesData.filter(function (n) { return ['Dokter', 'Dokter Gigi', 'Dokter Spesialis'].indexOf(n.jenis) >= 0; }).length;
    return {
      totalNakes: nakesData.length,
      totalFasyankes: (fasyankes.data || []).length,
      totalPraktik: (praktik.data || []).length,
      tenagaMedis: tenagaMedis,
      tenagaKesehatan: nakesData.length - tenagaMedis,
      str: {
        aktif: nakesData.filter(function (n) { return db.calcExpireStatus(n.tgl_akhir_str) === STATUS.AKTIF; }).length,
        hampir: nakesData.filter(function (n) { return db.calcExpireStatus(n.tgl_akhir_str) === STATUS.HAMPIR_EXPIRED; }).length,
        expired: nakesData.filter(function (n) { return db.calcExpireStatus(n.tgl_akhir_str) === STATUS.EXPIRED; }).length,
      },
      sip: {
        aktif: (praktik.data || []).filter(function (p) { return db.calcExpireStatus(p.tgl_akhir_sip) === STATUS.AKTIF; }).length,
        hampir: (praktik.data || []).filter(function (p) { return db.calcExpireStatus(p.tgl_akhir_sip) === STATUS.HAMPIR_EXPIRED; }).length,
        expired: (praktik.data || []).filter(function (p) { return db.calcExpireStatus(p.tgl_akhir_sip) === STATUS.EXPIRED; }).length,
      },
      byJenis: countBy(nakesData, 'jenis'),
      byFasyankes: countBy(nakesData, 'fasyankes_id'),
    };
  }

  function countBy(arr, key) {
    const m = {};
    arr.forEach(function (x) { m[x[key]] = (m[x[key]] || 0) + 1; });
    return m;
  }

  // === Expose ===
  window.SIMANTRI_DATA = {
    DEMO_FASYANKES: DEMO_FASYANKES,
    DEMO_NAKES: DEMO_NAKES,
    DEMO_PRAKTIK: DEMO_PRAKTIK,
    DEMO_NOTIFICATIONS: DEMO_NOTIFICATIONS,
    loadNakes: loadNakes,
    loadFasyankes: loadFasyankes,
    loadPraktik: loadPraktik,
    loadDashboardStats: loadDashboardStats,
    loadNotifications: async function (opts) {
      opts = opts || {};
      if (db.isDemoMode()) {
        let data = DEMO_NOTIFICATIONS.slice();
        if (opts.unreadOnly) data = data.filter(function (n) { return !n.is_read; });
        return data.sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
      }
      let q = db.getClient().from('notifications').select('*, tenaga_kesehatan(nama, profesi, no_str)');
      if (opts.unreadOnly) q = q.eq('is_read', false);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  };

  // ============================================================================
  // CRUD STORE (in-memory untuk demo mode; production pakai Supabase)
  // ============================================================================
  // Data disimpan di array mutable — perubahan langsung terlihat saat reload.
  // Untuk production (Supabase configured), fungsi CRUD ini otomatis pakai
  // insertRow/updateRow/deleteRow dari SIMANTRI_DB.

  function genId(prefix) {
    prefix = prefix || 'id';
    return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
  }

  // === NAKES CRUD ===
  async function addNakes(payload) {
    if (db.isDemoMode()) {
      const item = Object.assign({ id: genId('n') }, payload);
      DEMO_NAKES.push(item);
      return item;
    }
    return await db.insertRow('tenaga_kesehatan', payload);
  }

  async function updateNakes(id, payload) {
    if (db.isDemoMode()) {
      const idx = DEMO_NAKES.findIndex(function (n) { return n.id === id; });
      if (idx < 0) throw new Error('Nakes tidak ditemukan');
      DEMO_NAKES[idx] = Object.assign({}, DEMO_NAKES[idx], payload);
      return DEMO_NAKES[idx];
    }
    return await db.updateRow('tenaga_kesehatan', id, payload);
  }

  async function deleteNakes(id) {
    if (db.isDemoMode()) {
      const idx = DEMO_NAKES.findIndex(function (n) { return n.id === id; });
      if (idx < 0) throw new Error('Nakes tidak ditemukan');
      // Hapus juga praktik terkait
      for (let i = DEMO_PRAKTIK.length - 1; i >= 0; i--) {
        if (DEMO_PRAKTIK[i].tenaga_id === id) DEMO_PRAKTIK.splice(i, 1);
      }
      return DEMO_NAKES.splice(idx, 1)[0];
    }
    return await db.deleteRow('tenaga_kesehatan', id);
  }

  // === FASYANKES CRUD ===
  async function addFasyankes(payload) {
    if (db.isDemoMode()) {
      const item = Object.assign({ id: genId('f') }, payload);
      DEMO_FASYANKES.push(item);
      return item;
    }
    return await db.insertRow('fasyankes', payload);
  }

  async function updateFasyankes(id, payload) {
    if (db.isDemoMode()) {
      const idx = DEMO_FASYANKES.findIndex(function (f) { return f.id === id; });
      if (idx < 0) throw new Error('Fasyankes tidak ditemukan');
      DEMO_FASYANKES[idx] = Object.assign({}, DEMO_FASYANKES[idx], payload);
      return DEMO_FASYANKES[idx];
    }
    return await db.updateRow('fasyankes', id, payload);
  }

  async function deleteFasyankes(id) {
    if (db.isDemoMode()) {
      const idx = DEMO_FASYANKES.findIndex(function (f) { return f.id === id; });
      if (idx < 0) throw new Error('Fasyankes tidak ditemukan');
      // Set null untuk nakes & praktik yang refer ke fasyankes ini
      DEMO_NAKES.forEach(function (n) { if (n.fasyankes_id === id) n.fasyankes_id = null; });
      // Hapus praktik di fasyankes ini
      for (let i = DEMO_PRAKTIK.length - 1; i >= 0; i--) {
        if (DEMO_PRAKTIK[i].fasyankes_id === id) DEMO_PRAKTIK.splice(i, 1);
      }
      return DEMO_FASYANKES.splice(idx, 1)[0];
    }
    return await db.deleteRow('fasyankes', id);
  }

  // === PRAKTIK CRUD ===
  async function addPraktik(payload) {
    if (db.isDemoMode()) {
      const item = Object.assign({ id: genId('p') }, payload);
      DEMO_PRAKTIK.push(item);
      return item;
    }
    return await db.insertRow('praktik', payload);
  }

  async function updatePraktik(id, payload) {
    if (db.isDemoMode()) {
      const idx = DEMO_PRAKTIK.findIndex(function (p) { return p.id === id; });
      if (idx < 0) throw new Error('Praktik tidak ditemukan');
      DEMO_PRAKTIK[idx] = Object.assign({}, DEMO_PRAKTIK[idx], payload);
      return DEMO_PRAKTIK[idx];
    }
    return await db.updateRow('praktik', id, payload);
  }

  async function deletePraktik(id) {
    if (db.isDemoMode()) {
      const idx = DEMO_PRAKTIK.findIndex(function (p) { return p.id === id; });
      if (idx < 0) throw new Error('Praktik tidak ditemukan');
      return DEMO_PRAKTIK.splice(idx, 1)[0];
    }
    return await db.deleteRow('praktik', id);
  }

  // === NOTIFICATION CRUD ===
  async function addNotification(payload) {
    if (db.isDemoMode()) {
      const item = Object.assign({
        id: genId('notif'),
        created_at: new Date().toISOString(),
        is_read: false,
      }, payload);
      DEMO_NOTIFICATIONS.push(item);
      return item;
    }
    return await db.insertRow('notifications', payload);
  }

  async function markNotificationRead(id) {
    if (db.isDemoMode()) {
      const idx = DEMO_NOTIFICATIONS.findIndex(function (n) { return n.id === id; });
      if (idx >= 0) DEMO_NOTIFICATIONS[idx].is_read = true;
      return DEMO_NOTIFICATIONS[idx];
    }
    return await db.updateRow('notifications', id, { is_read: true });
  }

  async function markAllNotificationsRead() {
    if (db.isDemoMode()) {
      DEMO_NOTIFICATIONS.forEach(function (n) { n.is_read = true; });
      return;
    }
    const client = db.getClient();
    const { error } = await client.from('notifications').update({ is_read: true }).eq('is_read', false);
    if (error) throw error;
  }

  // === AUDIT LOG ===
  const DEMO_AUDIT_LOG = [
    { id: 'a-001', user_id: 'demo-dinkes', user_name: 'Dr. Admin Dinkes', action: 'LOGIN', entity: 'auth', entity_id: '-', detail: 'Login berhasil', ip_address: '127.0.0.1', user_agent: 'Chrome 130', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 'a-002', user_id: 'demo-dinkes', user_name: 'Dr. Admin Dinkes', action: 'CREATE', entity: 'tenaga_kesehatan', entity_id: 'n-001', detail: 'Tambah nakes: Dr. Budi Santoso', ip_address: '127.0.0.1', user_agent: 'Chrome 130', created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: 'a-003', user_id: 'demo-dinkes', user_name: 'Dr. Admin Dinkes', action: 'UPDATE', entity: 'praktik', entity_id: 'p-001', detail: 'Update jadwal praktik', ip_address: '127.0.0.1', user_agent: 'Chrome 130', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 'a-004', user_id: 'demo-dinkes', user_name: 'Dr. Admin Dinkes', action: 'APPROVE', entity: 'tenaga_kesehatan', entity_id: 'n-002', detail: 'Verifikasi STR Dr. Siti Aminah', ip_address: '127.0.0.1', user_agent: 'Chrome 130', created_at: new Date(Date.now() - 1800000).toISOString() },
    { id: 'a-005', user_id: 'demo-dinkes', user_name: 'Dr. Admin Dinkes', action: 'DELETE', entity: 'fasyankes', entity_id: 'f-old', detail: 'Hapus fasyankes tidak aktif', ip_address: '127.0.0.1', user_agent: 'Chrome 130', created_at: new Date(Date.now() - 600000).toISOString() },
  ];

  async function loadAuditLog(opts) {
    opts = opts || {};
    if (db.isDemoMode()) {
      let data = DEMO_AUDIT_LOG.slice();
      if (opts.action) data = data.filter(function (a) { return a.action === opts.action; });
      if (opts.search) {
        const q = opts.search.toLowerCase();
        data = data.filter(function (a) {
          return (a.user_name || '').toLowerCase().indexOf(q) >= 0 ||
                 (a.entity || '').toLowerCase().indexOf(q) >= 0 ||
                 (a.detail || '').toLowerCase().indexOf(q) >= 0;
        });
      }
      return data.sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
    }
    let q = db.getClient().from('audit_log').select('*');
    if (opts.action) q = q.eq('action', opts.action);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function addAuditLog(payload) {
    if (db.isDemoMode()) {
      const item = Object.assign({
        id: genId('a'),
        created_at: new Date().toISOString(),
        ip_address: '127.0.0.1',
        user_agent: navigator.userAgent.substring(0, 100),
      }, payload);
      DEMO_AUDIT_LOG.unshift(item);
      return item;
    }
    return await db.insertRow('audit_log', payload);
  }

  // === USERS (Manajemen User) ===
  const DEMO_USERS_LIST = [
    { id: 'u-001', email: 'dinkes@simantri.demo', full_name: 'Dr. Admin Dinkes', role: 'dinkes', fasyankes_id: null, fasyankes_nama: '-', is_active: true, last_login: new Date(Date.now() - 3600000).toISOString(), created_at: new Date(Date.now() - 86400000 * 30).toISOString() },
    { id: 'u-002', email: 'dinkes2@simantri.demo', full_name: 'Dr. Andi Pratama', role: 'dinkes', fasyankes_id: null, fasyankes_nama: '-', is_active: true, last_login: new Date(Date.now() - 86400000 * 2).toISOString(), created_at: new Date(Date.now() - 86400000 * 25).toISOString() },
    { id: 'u-003', email: 'rsud.admin@simantri.demo', full_name: 'Admin RSUD Soetomo', role: 'dinkes', fasyankes_id: 'f-001', fasyankes_nama: 'RSUD Dr. Soetomo', is_active: true, last_login: new Date(Date.now() - 86400000).toISOString(), created_at: new Date(Date.now() - 86400000 * 20).toISOString() },
    { id: 'u-004', email: 'puskesmas.gundih@simantri.demo', full_name: 'Admin Puskesmas Gundih', role: 'dinkes', fasyankes_id: 'f-002', fasyankes_nama: 'Puskesmas Gundih', is_active: false, last_login: new Date(Date.now() - 86400000 * 10).toISOString(), created_at: new Date(Date.now() - 86400000 * 15).toISOString() },
  ];

  async function loadUsers(opts) {
    opts = opts || {};
    if (db.isDemoMode()) {
      let data = DEMO_USERS_LIST.slice();
      if (opts.search) {
        const q = opts.search.toLowerCase();
        data = data.filter(function (u) {
          return (u.email || '').toLowerCase().indexOf(q) >= 0 ||
                 (u.full_name || '').toLowerCase().indexOf(q) >= 0;
        });
      }
      if (opts.role) data = data.filter(function (u) { return u.role === opts.role; });
      return data;
    }
    // Production: query dari tabel profiles
    const client = db.getClient();
    let q = client.from('profiles').select('*');
    if (opts.role) q = q.eq('role', opts.role);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;
    let users = data || [];
    if (opts.search) {
      const s = opts.search.toLowerCase();
      users = users.filter(function (u) {
        return (u.email || '').toLowerCase().indexOf(s) >= 0 ||
               (u.full_name || '').toLowerCase().indexOf(s) >= 0;
      });
    }
    return users;
  }

  async function addUser(payload) {
    if (db.isDemoMode()) {
      const item = Object.assign({
        id: genId('u'),
        is_active: true,
        created_at: new Date().toISOString(),
        last_login: null,
      }, payload);
      DEMO_USERS_LIST.push(item);
      return item;
    }
    // Production: insert ke tabel profiles
    // Password di-hash via RPC hash_password
    const client = db.getClient();
    // Dapatkan hash password
    const { data: hashData, error: hashErr } = await client.rpc('hash_password', { plain: payload.password });
    if (hashErr) throw new Error('Gagal hash password: ' + hashErr.message);
    const insertPayload = {
      id: payload.id || (window.crypto && crypto.randomUUID ? crypto.randomUUID() : genId('u')),
      email: payload.email,
      full_name: payload.full_name,
      role: payload.role || 'dinkes',
      fasyankes_id: payload.fasyankes_id || null,
      password_hash: hashData,
      is_active: payload.is_active !== false,
    };
    const { data, error } = await client.from('profiles').insert(insertPayload).select().single();
    if (error) throw new Error('Gagal tambah user: ' + error.message);
    return data;
  }

  async function updateUser(id, payload) {
    if (db.isDemoMode()) {
      const idx = DEMO_USERS_LIST.findIndex(function (u) { return u.id === id; });
      if (idx < 0) throw new Error('User tidak ditemukan');
      DEMO_USERS_LIST[idx] = Object.assign({}, DEMO_USERS_LIST[idx], payload);
      return DEMO_USERS_LIST[idx];
    }
    // Production: update tabel profiles
    const client = db.getClient();
    const updatePayload = Object.assign({}, payload);
    delete updatePayload.id;
    delete updatePayload.created_at;
    // Jika ada password baru, hash dulu
    if (updatePayload.password) {
      const { data: hashData, error: hashErr } = await client.rpc('hash_password', { plain: updatePayload.password });
      if (hashErr) throw new Error('Gagal hash password: ' + hashErr.message);
      updatePayload.password_hash = hashData;
      delete updatePayload.password;
    }
    const { data, error } = await client.from('profiles').update(updatePayload).eq('id', id).select().single();
    if (error) throw new Error('Gagal update user: ' + error.message);
    return data;
  }

  async function deleteUser(id) {
    if (db.isDemoMode()) {
      const idx = DEMO_USERS_LIST.findIndex(function (u) { return u.id === id; });
      if (idx < 0) throw new Error('User tidak ditemukan');
      return DEMO_USERS_LIST.splice(idx, 1)[0];
    }
    // Production: delete dari tabel profiles
    const client = db.getClient();
    const { error } = await client.from('profiles').delete().eq('id', id);
    if (error) throw new Error('Gagal hapus user: ' + error.message);
    return { id: id };
  }

  // === PERPANJANGAN (Pengajuan) ===
  const DEMO_PERPANJANGAN = [
    { id: 'pp-001', tenaga_id: 'n-006', tenaga_nama: 'Apt. Joko Susanto, M.Farm', jenis_dok: 'STR', no_dok_lama: 'STR/67890/2021', tgl_berakhir_lama: '2025-08-09', status: 'pending', catatan: 'Pengajuan perpanjangan STR', created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
    { id: 'pp-002', tenaga_id: 'n-010', tenaga_nama: 'Slamet Riyadi', jenis_dok: 'STR', no_dok_lama: 'STR/01234/2022', tgl_berakhir_lama: '2025-04-01', status: 'pending', catatan: 'STR sudah expired, pengajuan ulang', created_at: new Date(Date.now() - 86400000).toISOString() },
  ];

  async function loadPerpanjangan(opts) {
    opts = opts || {};
    let data = DEMO_PERPANJANGAN.slice();
    if (opts.status) data = data.filter(function (p) { return p.status === opts.status; });
    return data.sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
  }

  async function addPerpanjangan(payload) {
    const item = Object.assign({
      id: genId('pp'),
      status: 'pending',
      created_at: new Date().toISOString(),
    }, payload);
    DEMO_PERPANJANGAN.unshift(item);
    return item;
  }

  async function updatePerpanjangan(id, payload) {
    const idx = DEMO_PERPANJANGAN.findIndex(function (p) { return p.id === id; });
    if (idx < 0) throw new Error('Pengajuan tidak ditemukan');
    DEMO_PERPANJANGAN[idx] = Object.assign({}, DEMO_PERPANJANGAN[idx], payload);
    return DEMO_PERPANJANGAN[idx];
  }

  async function deletePerpanjangan(id) {
    const idx = DEMO_PERPANJANGAN.findIndex(function (p) { return p.id === id; });
    if (idx < 0) throw new Error('Pengajuan tidak ditemukan');
    return DEMO_PERPANJANGAN.splice(idx, 1)[0];
  }

  // === VERIFIKASI (antrian verifikasi STR/SIP) ===
  // Derived from nakes & praktik with verifikasi_status = 'pending'
  // Tapi bisa juga add/update/delete manual
  const DEMO_VERIFIKASI_EXTRA = []; // Tambahan verifikasi yang di-create manual

  async function loadVerifikasiQueue(opts) {
    opts = opts || {};
    if (!db.isDemoMode()) {
      // Production: query dari tenaga_kesehatan & praktik where verifikasi_status = 'pending'
      const client = db.getClient();
      const [nakes, praktik] = await Promise.all([
        client.from('tenaga_kesehatan').select('*').eq('verifikasi_status', 'pending'),
        client.from('praktik').select('*, tenaga_kesehatan(nama, profesi)').eq('verifikasi_status', 'pending'),
      ]);
      const items = [];
      (nakes.data || []).forEach(function (n) {
        items.push({ id: 'v-n-' + n.id, entity_type: 'STR', entity_id: n.id, nama: n.nama, profesi: n.profesi, no_dok: n.no_str, tgl_terbit: n.tgl_terbit_str, tgl_akhir: n.tgl_akhir_str, status: 'pending' });
      });
      (praktik.data || []).forEach(function (p) {
        items.push({ id: 'v-p-' + p.id, entity_type: 'SIP', entity_id: p.id, nama: p.tenaga_kesehatan ? p.tenaga_kesehatan.nama : '-', profesi: p.tenaga_kesehatan ? p.tenaga_kesehatan.profesi : '-', no_dok: p.no_sip, tgl_terbit: p.tgl_terbit_sip, tgl_akhir: p.tgl_akhir_sip, status: 'pending' });
      });
      return items;
    }
    // Demo mode: derive dari DEMO_NAKES & DEMO_PRAKTIK
    const items = [];
    DEMO_NAKES.forEach(function (n) {
      if (n.verifikasi_status === 'pending' || !n.verifikasi_status) {
        items.push({
          id: 'v-n-' + n.id,
          entity_type: 'STR',
          entity_id: n.id,
          nama: n.nama,
          profesi: n.profesi,
          no_dok: n.no_str,
          tgl_terbit: n.tgl_terbit_str,
          tgl_akhir: n.tgl_akhir_str,
          status: 'pending',
          fasyankes_id: n.fasyankes_id,
        });
      }
    });
    DEMO_PRAKTIK.forEach(function (p) {
      if (p.verifikasi_status === 'pending' || !p.verifikasi_status) {
        const n = DEMO_NAKES.find(function (x) { return x.id === p.tenaga_id; });
        items.push({
          id: 'v-p-' + p.id,
          entity_type: 'SIP',
          entity_id: p.id,
          nama: n ? n.nama : '-',
          profesi: n ? n.profesi : '-',
          no_dok: p.no_sip,
          tgl_terbit: p.tgl_terbit_sip,
          tgl_akhir: p.tgl_akhir_sip,
          status: 'pending',
          fasyankes_id: p.fasyankes_id,
        });
      }
    });
    // Include extras (yang sudah di-approve/reject, untuk history)
    DEMO_VERIFIKASI_EXTRA.forEach(function (v) { items.push(v); });
    if (opts.status) return items.filter(function (v) { return v.status === opts.status; });
    return items;
  }

  async function approveVerifikasi(id, opts) {
    opts = opts || {};
    // First, find the item in the current queue (before mutating the source)
    let sourceItem = null;
    const queue = await loadVerifikasiQueue();
    sourceItem = queue.find(function (v) { return v.id === id; });
    // Parse entity_type & entity_id dari id
    if (id.startsWith('v-n-')) {
      const nakesId = id.substring(4);
      if (db.isDemoMode()) {
        const idx = DEMO_NAKES.findIndex(function (n) { return n.id === nakesId; });
        if (idx >= 0) DEMO_NAKES[idx].verifikasi_status = 'diverifikasi';
      } else {
        await db.updateRow('tenaga_kesehatan', nakesId, { verifikasi_status: 'diverifikasi', verified_by: null, verified_at: new Date().toISOString() });
      }
    } else if (id.startsWith('v-p-')) {
      const praktikId = id.substring(4);
      if (db.isDemoMode()) {
        const idx = DEMO_PRAKTIK.findIndex(function (p) { return p.id === praktikId; });
        if (idx >= 0) DEMO_PRAKTIK[idx].verifikasi_status = 'diverifikasi';
      } else {
        await db.updateRow('praktik', praktikId, { verifikasi_status: 'diverifikasi', verified_by: null, verified_at: new Date().toISOString() });
      }
    }
    // Add to extras dengan status diverifikasi
    const existing = DEMO_VERIFIKASI_EXTRA.find(function (v) { return v.id === id; });
    if (existing) {
      existing.status = 'diverifikasi';
      existing.catatan = opts.catatan || '';
      existing.processed_at = new Date().toISOString();
    } else if (sourceItem) {
      DEMO_VERIFIKASI_EXTRA.push(Object.assign({}, sourceItem, {
        status: 'diverifikasi',
        catatan: opts.catatan || '',
        processed_at: new Date().toISOString(),
      }));
    }
    return { success: true };
  }

  async function rejectVerifikasi(id, opts) {
    opts = opts || {};
    // First, find the item in the current queue (before mutating the source)
    let sourceItem = null;
    const queue = await loadVerifikasiQueue();
    sourceItem = queue.find(function (v) { return v.id === id; });
    if (id.startsWith('v-n-')) {
      const nakesId = id.substring(4);
      if (db.isDemoMode()) {
        const idx = DEMO_NAKES.findIndex(function (n) { return n.id === nakesId; });
        if (idx >= 0) DEMO_NAKES[idx].verifikasi_status = 'ditolak';
      } else {
        await db.updateRow('tenaga_kesehatan', nakesId, { verifikasi_status: 'ditolak', verified_by: null, verified_at: new Date().toISOString() });
      }
    } else if (id.startsWith('v-p-')) {
      const praktikId = id.substring(4);
      if (db.isDemoMode()) {
        const idx = DEMO_PRAKTIK.findIndex(function (p) { return p.id === praktikId; });
        if (idx >= 0) DEMO_PRAKTIK[idx].verifikasi_status = 'ditolak';
      } else {
        await db.updateRow('praktik', praktikId, { verifikasi_status: 'ditolak', verified_by: null, verified_at: new Date().toISOString() });
      }
    }
    const existing = DEMO_VERIFIKASI_EXTRA.find(function (v) { return v.id === id; });
    if (existing) {
      existing.status = 'ditolak';
      existing.catatan = opts.catatan || '';
      existing.processed_at = new Date().toISOString();
    } else if (sourceItem) {
      DEMO_VERIFIKASI_EXTRA.push(Object.assign({}, sourceItem, {
        status: 'ditolak',
        catatan: opts.catatan || '',
        processed_at: new Date().toISOString(),
      }));
    }
    return { success: true };
  }

  // === SETTINGS (Pengaturan) ===
  const DEMO_SETTINGS = {
    notifikasi_h90_str: true,
    notifikasi_h90_sip: true,
    notifikasi_h30: true,
    email_digest: 'daily',
    expiry_threshold_days: 90,
    auto_disable_expired: true,
    integrasi_email: false,
    integrasi_whatsapp: false,
  };

  async function loadSettings() {
    return Object.assign({}, DEMO_SETTINGS);
  }

  async function saveSettings(payload) {
    Object.assign(DEMO_SETTINGS, payload);
    return Object.assign({}, DEMO_SETTINGS);
  }

  // === Expose CRUD ===
  Object.assign(window.SIMANTRI_DATA, {
    // Nakes
    addNakes: addNakes,
    updateNakes: updateNakes,
    deleteNakes: deleteNakes,
    // Fasyankes
    addFasyankes: addFasyankes,
    updateFasyankes: updateFasyankes,
    deleteFasyankes: deleteFasyankes,
    // Praktik
    addPraktik: addPraktik,
    updatePraktik: updatePraktik,
    deletePraktik: deletePraktik,
    // Notifications
    addNotification: addNotification,
    markNotificationRead: markNotificationRead,
    markAllNotificationsRead: markAllNotificationsRead,
    // Audit log
    loadAuditLog: loadAuditLog,
    addAuditLog: addAuditLog,
    // Users
    loadUsers: loadUsers,
    addUser: addUser,
    updateUser: updateUser,
    deleteUser: deleteUser,
    // Perpanjangan
    loadPerpanjangan: loadPerpanjangan,
    addPerpanjangan: addPerpanjangan,
    updatePerpanjangan: updatePerpanjangan,
    deletePerpanjangan: deletePerpanjangan,
    // Verifikasi
    loadVerifikasiQueue: loadVerifikasiQueue,
    approveVerifikasi: approveVerifikasi,
    rejectVerifikasi: rejectVerifikasi,
    // Settings
    loadSettings: loadSettings,
    saveSettings: saveSettings,
  });
})();
