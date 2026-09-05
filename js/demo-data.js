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
})();
