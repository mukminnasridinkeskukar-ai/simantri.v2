/* ============================================================================
 * SIMANTRI v3 — Demo data & CRUD store
 * Mock data mengikuti schema SIMANTRI v1.1 (Dinkes Kutai Kartanegara):
 *   - pengumuman
 *   - verval_izin_praktik (27 fields)
 *   - verval_fasyankes + verval_fasyankes_sdm + sdm_standar_fasyankes
 *   - profil_sdmk
 *   - users, logs, izin
 *
 * Demo mode: in-memory store (mutable)
 * Production: Supabase via window.SIMANTRI_DB
 * ============================================================================ */

(function () {
  'use strict';

  const db = window.SIMANTRI_DB;
  const utils = window.SIMANTRI_UTILS;

  // ============================================================================
  // MOCK DATA (match schema v1.1)
  // ============================================================================

  const DEMO_PENGUMUMAN = [
    { id: 'PENG-001', tanggal: '2025-05-01', judul: 'Pembaruan Sistem SIMANTRI v1.2', isi: 'Mulai 1 Juni 2025 seluruh pengajuan izin praktik wajib menggunakan formulir digital baru.', is_penting: 1, created_by: 'admin', created_at: '2025-05-01T08:00:00Z', updated_at: '2025-05-01T08:00:00Z' },
    { id: 'PENG-002', tanggal: '2025-04-20', judul: 'Jadwal Verval Triwulan II', isi: 'Verval izin praktik periode April-Juni dilaksanakan secara bertahap.', is_penting: 0, created_by: 'admin', created_at: '2025-04-20T08:00:00Z', updated_at: '2025-04-20T08:00:00Z' },
    { id: 'PENG-003', tanggal: '2025-04-10', judul: 'Sosialisasi SatuSehat', isi: 'Pelatihan integrasi SatuSehat untuk seluruh admin fasyankes tanggal 25 April 2025.', is_penting: 1, created_by: 'admin', created_at: '2025-04-10T08:00:00Z', updated_at: '2025-04-10T08:00:00Z' },
  ];

  const DEMO_PROFIL_SDMK = [
    { no: 1, nik: '3275012345678901', nama_lengkap: 'dr. Andi Wijaya, Sp.PD', jenis_kelamin: 'Laki-laki', jenis_tenaga: 'Dokter', kode_unit: 'FK-001', nama_unit: 'RSUD Dr. Soetomo', status_pegawai: 'PNS', nomor_str: 'STR.12345.2023', status_str: 'Aktif', nomor_sip: 'SIP/2024/001234', tgl_terbit_sip: '2024-01-15', tgl_berakhir_sip: '2027-01-15', keterangan: 'Spesialis Penyakit Dalam', created_at: '2025-01-15T08:00:00Z', updated_at: '2025-01-15T08:00:00Z' },
    { no: 2, nik: '3275023456789012', nama_lengkap: 'drg. Siti Rahayu', jenis_kelamin: 'Perempuan', jenis_tenaga: 'Dokter Gigi', kode_unit: 'FK-002', nama_unit: 'Klinik Sehat Buah', status_pegawai: 'Swasta', nomor_str: 'STR.23456.2022', status_str: 'Aktif', nomor_sip: 'SIP/2024/002345', tgl_terbit_sip: '2024-03-20', tgl_berakhir_sip: '2026-03-20', keterangan: '', created_at: '2025-01-20T08:00:00Z', updated_at: '2025-01-20T08:00:00Z' },
    { no: 3, nik: '3275034567890123', nama_lengkap: 'Ns. Budi Santoso, S.Kep', jenis_kelamin: 'Laki-laki', jenis_tenaga: 'Perawat', kode_unit: 'FK-001', nama_unit: 'RSUD Dr. Soetomo', status_pegawai: 'PNS', nomor_str: 'STR.34567.2023', status_str: 'Aktif', nomor_sip: 'SIP/2024/003456', tgl_terbit_sip: '2024-02-10', tgl_berakhir_sip: '2026-02-10', keterangan: '', created_at: '2025-01-25T08:00:00Z', updated_at: '2025-01-25T08:00:00Z' },
    { no: 4, nik: '3275045678901234', nama_lengkap: 'Bdn. Dewi Lestari, Amd.Keb', jenis_kelamin: 'Perempuan', jenis_tenaga: 'Bidan', kode_unit: 'FK-003', nama_unit: 'Puskesmas Tenggarong', status_pegawai: 'PPNPN', nomor_str: 'STR.45678.2022', status_str: 'Expired', nomor_sip: '-', tgl_terbit_sip: null, tgl_berakhir_sip: '2025-03-15', keterangan: 'Menunggu perpanjangan STR', created_at: '2025-02-01T08:00:00Z', updated_at: '2025-02-01T08:00:00Z' },
    { no: 5, nik: '3275056789012345', nama_lengkap: 'Apt. Joko Susanto, M.Farm', jenis_kelamin: 'Laki-laki', jenis_tenaga: 'Apoteker', kode_unit: 'FK-004', nama_unit: 'Apotek Sehat Sentosa', status_pegawai: 'Swasta', nomor_str: 'STR.56789.2021', status_str: 'Expired', nomor_sip: '-', tgl_terbit_sip: null, tgl_berakhir_sip: '2025-08-09', keterangan: 'STR expired', created_at: '2025-02-05T08:00:00Z', updated_at: '2025-02-05T08:00:00Z' },
  ];

  const DEMO_VERVAL_IZIN = [
    { id: 1, timestamp: '2025-04-15T10:30:00Z', nik: '3275012345678901', nama_lengkap: 'dr. Andi Wijaya, Sp.PD', jenis_kelamin: 'Laki-laki', tempat_lahir: 'Surabaya', tanggal_lahir: '1985-05-10', alamat_ktp: 'Jl. Pahlawan 10, Samarinda', nomor_str: 'STR.12345.2023', status_str: 'Aktif', status_sip: 'Aktif', nomor_sip: 'SIP/2024/001234', masa_berlaku_sip: '2027-01-15', unit_kerja: 'RSUD Dr. Soetomo', alamat_unit: 'Jl. Mayjen Soetomo 1, Samarinda', desa_kelurahan: 'Sungai Pinang', status_satu_sehat: 'Sudah', sop_pelayanan: 'Ada', sop_profesi: 'Ada', sop_etika: 'Ada', sdmk_named: 'Ada', sdmk_nakes: 'Ada', sdmk_admin: 'Ada', jam_operasional: 'Senin-Jumat 08.00-16.00', catatan_rekomendasi: 'Layak', pendidikan_str: 'S1 Kedokteran - Sp.PD', nip: '198505102010011001', jenis_tenaga: 'Dokter Spesialis', golongan_pangkat: 'IV/a', jabatan: 'Dokter Spesialis', tanggal_terbit_str: '2023-01-15', tanggal_berlaku_str: '2026-01-15', tanggal_terbit_sip: '2024-01-15', tanggal_berlaku_sip: '2027-01-15', alamat_kerja: 'Jl. Mayjen Soetomo 1, Samarinda', kecamatan: 'Samarinda Ulu', kabupaten: 'Samarinda', id_satu_sehat: 'SS-0012345', status_verifikasi: 'Sah', tanggal_verifikasi: '2025-04-20', verifikator: 'admin', catatan: 'Verifikasi lengkap', created_at: '2025-04-15T10:30:00Z', updated_at: '2025-04-15T10:30:00Z' },
    { id: 2, timestamp: '2025-04-12T09:15:00Z', nik: '3275023456789012', nama_lengkap: 'drg. Siti Rahayu', jenis_kelamin: 'Perempuan', tempat_lahir: 'Banjarmasin', tanggal_lahir: '1990-08-20', alamat_ktp: 'Jl. Merdeka 5, Samarinda', nomor_str: 'STR.23456.2022', status_str: 'Aktif', status_sip: 'Aktif', nomor_sip: 'SIP/2024/002345', masa_berlaku_sip: '2026-03-20', unit_kerja: 'Klinik Sehat Buah', alamat_unit: 'Jl. Kesuma 2, Samarinda', desa_kelurahan: 'Karang Asam', status_satu_sehat: 'Belum', sop_pelayanan: 'Ada', sop_profesi: 'Ada', sop_etika: 'Tidak Ada', sdmk_named: 'Ada', sdmk_nakes: 'Ada', sdmk_admin: 'Tidak Ada', jam_operasional: 'Senin-Sabtu 09.00-17.00', catatan_rekomendasi: 'Perbaikan SOP etika', pendidikan_str: 'S1 Kedokteran Gigi', nip: '', jenis_tenaga: 'Dokter Gigi', golongan_pangkat: '-', jabatan: 'Dokter Gigi', tanggal_terbit_str: '2022-03-20', tanggal_berlaku_str: '2025-03-20', tanggal_terbit_sip: '2024-03-20', tanggal_berlaku_sip: '2026-03-20', alamat_kerja: 'Jl. Kesuma 2, Samarinda', kecamatan: 'Samarinda Ilir', kabupaten: 'Samarinda', id_satu_sehat: '', status_verifikasi: 'Pending', tanggal_verifikasi: null, verifikator: '', catatan: 'Menunggu kelengkapan SOP etika', created_at: '2025-04-12T09:15:00Z', updated_at: '2025-04-12T09:15:00Z' },
    { id: 3, timestamp: '2025-04-08T14:00:00Z', nik: '3275045678901234', nama_lengkap: 'Bdn. Dewi Lestari, Amd.Keb', jenis_kelamin: 'Perempuan', tempat_lahir: 'Samarinda', tanggal_lahir: '1992-12-05', alamat_ktp: 'Jl. Gajah Mada 8, Samarinda', nomor_str: 'STR.45678.2022', status_str: 'Expired', status_sip: 'Tidak Ada', nomor_sip: '', masa_berlaku_sip: null, unit_kerja: 'Puskesmas Tenggarong', alamat_unit: 'Jl. Cipta Karya 3, Tenggarong', desa_kelurahan: 'Tenggarang', status_satu_sehat: 'Belum', sop_pelayanan: 'Tidak Ada', sop_profesi: 'Tidak Ada', sop_etika: 'Tidak Ada', sdmk_named: 'Tidak Ada', sdmk_nakes: 'Tidak Ada', sdmk_admin: 'Tidak Ada', jam_operasional: 'Senin-Jumat 08.00-14.00', catatan_rekomendasi: 'Tidak Layak - STR expired', pendidikan_str: 'D3 Kebidanan', nip: '', jenis_tenaga: 'Bidan', golongan_pangkat: '-', jabatan: 'Bidan', tanggal_terbit_str: '2022-03-15', tanggal_berlaku_str: '2025-03-15', tanggal_terbit_sip: null, tanggal_berlaku_sip: null, alamat_kerja: 'Jl. Cipta Karya 3, Tenggarong', kecamatan: 'Tenggarong', kabupaten: 'Kutai Kartanegara', id_satu_sehat: '', status_verifikasi: 'Kadarluasa', tanggal_verifikasi: '2025-04-10', verifikator: 'admin', catatan: 'STR expired, perlu perpanjangan', created_at: '2025-04-08T14:00:00Z', updated_at: '2025-04-10T10:00:00Z' },
  ];

  const DEMO_VERVAL_FASYANKES = [
    { id: 'VF-20250420-00001', tanggal: '2025-04-20', nomor_unit: 'UNIT-001', nama_fasyankes: 'RSUD Dr. Soetomo', jenis_fasyankes: 'Rumah Sakit', nama_pemilik: 'Pemprov Kaltim', penanggung_jawab: 'dr. Andi Wijaya', alamat_lengkap: 'Jl. Mayjen Soetomo 1, Samarinda', kelurahan: 'Sungai Pinang', kecamatan: 'Samarinda Ulu', nomor_hp: '081234567890', email: 'rsud.soetomo@dinkes.go.id', sdm_kesehatan: 'Dokter Spesialis; Dokter Umum; Perawat; Bidan', status_verifikasi: 'Layak', catatan_verifikasi: 'Semua standar terpenuhi', verifikator: 'admin', created_at: '2025-04-20T10:00:00Z', updated_at: '2025-04-20T10:00:00Z' },
    { id: 'VF-20250418-00002', tanggal: '2025-04-18', nomor_unit: 'UNIT-002', nama_fasyankes: 'Klinik Sehat Buah', jenis_fasyankes: 'Klinik', nama_pemilik: 'PT Sehat Sejahtera', penanggung_jawab: 'drg. Siti Rahayu', alamat_lengkap: 'Jl. Kesuma 2, Samarinda', kelurahan: 'Karang Asam', kecamatan: 'Samarinda Ilir', nomor_hp: '081234567891', email: 'klinik.sehatbuah@gmail.com', sdm_kesehatan: 'Dokter Gigi; Perawat; Bidan', status_verifikasi: 'Perbaikan', catatan_verifikasi: 'Tidak ada SOP etika, perlu dilengkapi', verifikator: 'admin', created_at: '2025-04-18T09:00:00Z', updated_at: '2025-04-18T09:00:00Z' },
    { id: 'VF-20250415-00003', tanggal: '2025-04-15', nomor_unit: 'UNIT-003', nama_fasyankes: 'Puskesmas Tenggarong', jenis_fasyankes: 'Puskesmas', nama_pemilik: 'Pemkab Kukar', penanggung_jawab: 'dr. Bambang Sutrisno', alamat_lengkap: 'Jl. Cipta Karya 3, Tenggarong', kelurahan: 'Tenggarang', kecamatan: 'Tenggarong', nomor_hp: '081234567892', email: 'puskesmas.tenggarong@dinkes.go.id', sdm_kesehatan: 'Dokter Umum; Perawat; Bidan; Ahli Gizi', status_verifikasi: 'Pending', catatan_verifikasi: 'Menunggu kelengkapan dokumen', verifikator: '', created_at: '2025-04-15T11:00:00Z', updated_at: '2025-04-15T11:00:00Z' },
    { id: 'VF-20250410-00004', tanggal: '2025-04-10', nomor_unit: 'UNIT-004', nama_fasyankes: 'Apotek Sehat Sentosa', jenis_fasyankes: 'Apotik', nama_pemilik: 'PT Sentosa Farma', penanggung_jawab: 'Apt. Joko Susanto', alamat_lengkap: 'Jl. Pahlawan 10, Samarinda', kelurahan: 'Sungai Dama', kecamatan: 'Samarinda Ulu', nomor_hp: '081234567893', email: 'apotek.sentosafarma@gmail.com', sdm_kesehatan: 'Apoteker; Asisten Apoteker', status_verifikasi: 'Tidak Layak', catatan_verifikasi: 'Apoteker STR expired', verifikator: 'admin', created_at: '2025-04-10T13:00:00Z', updated_at: '2025-04-10T13:00:00Z' },
  ];

  const DEMO_VERVAL_FASYANKES_SDM = [
    { id: 1, verval_id: 'VF-20250420-00001', jenis_sdm: 'Dokter Spesialis', created_at: '2025-04-20T10:00:00Z' },
    { id: 2, verval_id: 'VF-20250420-00001', jenis_sdm: 'Dokter Umum', created_at: '2025-04-20T10:00:00Z' },
    { id: 3, verval_id: 'VF-20250420-00001', jenis_sdm: 'Perawat', created_at: '2025-04-20T10:00:00Z' },
    { id: 4, verval_id: 'VF-20250420-00001', jenis_sdm: 'Bidan', created_at: '2025-04-20T10:00:00Z' },
    { id: 5, verval_id: 'VF-20250418-00002', jenis_sdm: 'Dokter Gigi', created_at: '2025-04-18T09:00:00Z' },
    { id: 6, verval_id: 'VF-20250418-00002', jenis_sdm: 'Perawat', created_at: '2025-04-18T09:00:00Z' },
  ];

  const DEMO_SDM_STANDAR = [
    // RS
    { id: 1, jenis_fasyankes: 'Rumah Sakit', jenis_sdm: 'Dokter Spesialis', urutan: 1 },
    { id: 2, jenis_fasyankes: 'Rumah Sakit', jenis_sdm: 'Dokter Umum', urutan: 2 },
    { id: 3, jenis_fasyankes: 'Rumah Sakit', jenis_sdm: 'Perawat', urutan: 3 },
    { id: 4, jenis_fasyankes: 'Rumah Sakit', jenis_sdm: 'Bidan', urutan: 4 },
    { id: 5, jenis_fasyankes: 'Rumah Sakit', jenis_sdm: 'Ahli Gizi', urutan: 5 },
    // Puskesmas
    { id: 6, jenis_fasyankes: 'Puskesmas', jenis_sdm: 'Dokter Umum', urutan: 1 },
    { id: 7, jenis_fasyankes: 'Puskesmas', jenis_sdm: 'Perawat', urutan: 2 },
    { id: 8, jenis_fasyankes: 'Puskesmas', jenis_sdm: 'Bidan', urutan: 3 },
    { id: 9, jenis_fasyankes: 'Puskesmas', jenis_sdm: 'Ahli Gizi', urutan: 4 },
    // Klinik
    { id: 10, jenis_fasyankes: 'Klinik', jenis_sdm: 'Dokter Umum', urutan: 1 },
    { id: 11, jenis_fasyankes: 'Klinik', jenis_sdm: 'Dokter Gigi', urutan: 2 },
    { id: 12, jenis_fasyankes: 'Klinik', jenis_sdm: 'Perawat', urutan: 3 },
    { id: 13, jenis_fasyankes: 'Klinik', jenis_sdm: 'Bidan', urutan: 4 },
    // Apotik
    { id: 14, jenis_fasyankes: 'Apotik', jenis_sdm: 'Apoteker', urutan: 1 },
    { id: 15, jenis_fasyankes: 'Apotik', jenis_sdm: 'Asisten Apoteker', urutan: 2 },
  ];

  const DEMO_IZIN = [
    { id: 'IZIN-001', nik: '3275012345678901', nama_lengkap: 'dr. Andi Wijaya, Sp.PD', jenis_izin: 'Perpanjangan', tgl_usulan: '2025-04-01', status: 'Disetujui', nomor_sip: 'SIP/2024/001234', unit_kerja: 'RSUD Dr. Soetomo', masa_berlaku: '2024-01-15 s.d 2027-01-15', created_at: '2025-04-01T08:00:00Z', updated_at: '2025-04-05T10:00:00Z' },
    { id: 'IZIN-002', nik: '3275023456789012', nama_lengkap: 'drg. Siti Rahayu', jenis_izin: 'Baru', tgl_usulan: '2025-04-10', status: 'Proses', nomor_sip: '-', unit_kerja: 'Klinik Sehat Buah', masa_berlaku: '', created_at: '2025-04-10T08:00:00Z', updated_at: '2025-04-10T08:00:00Z' },
    { id: 'IZIN-003', nik: '3275045678901234', nama_lengkap: 'Bdn. Dewi Lestari, Amd.Keb', jenis_izin: 'Perpanjangan', tgl_usulan: '2025-03-20', status: 'Ditolak', nomor_sip: '-', unit_kerja: 'Puskesmas Tenggarong', masa_berlaku: '', created_at: '2025-03-20T08:00:00Z', updated_at: '2025-03-25T14:00:00Z' },
    { id: 'IZIN-004', nik: '3275056789012345', nama_lengkap: 'Apt. Joko Susanto, M.Farm', jenis_izin: 'Perpanjangan', tgl_usulan: '2025-04-15', status: 'Pending', nomor_sip: '-', unit_kerja: 'Apotek Sehat Sentosa', masa_berlaku: '', created_at: '2025-04-15T08:00:00Z', updated_at: '2025-04-15T08:00:00Z' },
  ];

  const DEMO_USERS_LIST = [
    { username: 'admin', password: 'admin123', role: 'admin', full_name: 'Administrator SIMANTRI', is_active: true, created_at: '2025-01-01T08:00:00Z', updated_at: new Date().toISOString() },
    { username: 'operator', password: 'operator123', role: 'operator', full_name: 'Operator Verval', is_active: true, created_at: '2025-01-01T08:00:00Z', updated_at: new Date(Date.now() - 86400000).toISOString() },
    { username: 'admin2', password: 'admin123', role: 'admin', full_name: 'Dr. Andi Pratama', is_active: true, created_at: '2025-02-01T08:00:00Z', updated_at: new Date(Date.now() - 86400000 * 3).toISOString() },
    { username: 'op2', password: 'operator123', role: 'operator', full_name: 'Budi Operator', is_active: false, created_at: '2025-02-15T08:00:00Z', updated_at: new Date(Date.now() - 86400000 * 7).toISOString() },
  ];

  const DEMO_LOGS = [
    { id: 1, username: 'admin', aksi: 'LOGIN', detail: 'Login berhasil dari IP 127.0.0.1', ip_address: '127.0.0.1', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 2, username: 'admin', aksi: 'ADD_PENGUMUMAN', detail: 'Tambah pengumuman: Pembaruan Sistem SIMANTRI v1.2', ip_address: '127.0.0.1', created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: 3, username: 'admin', aksi: 'SUBMIT_VERVAL', detail: 'Submit verval izin praktik NIK 3275012345678901', ip_address: '127.0.0.1', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 4, username: 'operator', aksi: 'LOGIN', detail: 'Login berhasil dari IP 127.0.0.1', ip_address: '127.0.0.1', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 5, username: 'admin', aksi: 'UPDATE_PROFIL', detail: 'Update profil SDMK: dr. Andi Wijaya', ip_address: '127.0.0.1', created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
    { id: 6, username: 'admin', aksi: 'DELETE_VERVAL_FASYANKES', detail: 'Hapus verval fasyankes: Klinik Lama', ip_address: '127.0.0.1', created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
    { id: 7, username: 'admin', aksi: 'APPROVE_IZIN', detail: 'Setujui izin praktik IZIN-001', ip_address: '127.0.0.1', created_at: new Date(Date.now() - 86400000 * 7).toISOString() },
  ];

  // ============================================================================
  // HELPERS
  // ============================================================================

  function genId(prefix) {
    return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
  }

  function genVfId() {
    const d = new Date();
    const ymd = d.getFullYear() + '' + String(d.getMonth() + 1).padStart(2, '0') + '' + String(d.getDate()).padStart(2, '0');
    return 'VF-' + ymd + '-' + String(Math.floor(Math.random() * 99999) + 1).padStart(5, '0');
  }

  // ============================================================================
  // LOAD FUNCTIONS
  // ============================================================================

  async function loadDashboardStats() {
    if (db.isDemoMode()) {
      // Hitung dari mock data
      const totalProfil = DEMO_PROFIL_SDMK.length;
      const totalVervalIzin = DEMO_VERVAL_IZIN.length;
      const totalVervalFasyankes = DEMO_VERVAL_FASYANKES.length;
      const totalPengumuman = DEMO_PENGUMUMAN.length;
      const totalIzin = DEMO_IZIN.length;
      const izinProses = DEMO_IZIN.filter(function (i) { return i.status === 'Proses'; }).length;
      const izinDisetujui = DEMO_IZIN.filter(function (i) { return i.status === 'Disetujui'; }).length;
      const izinPending = DEMO_IZIN.filter(function (i) { return i.status === 'Pending'; }).length;
      const izinDitolak = DEMO_IZIN.filter(function (i) { return i.status === 'Ditolak'; }).length;
      const vfLayak = DEMO_VERVAL_FASYANKES.filter(function (v) { return v.status_verifikasi === 'Layak'; }).length;
      const vfTidakLayak = DEMO_VERVAL_FASYANKES.filter(function (v) { return ['Tidak Layak', 'Tidak Valid'].indexOf(v.status_verifikasi) >= 0; }).length;
      const vfPending = DEMO_VERVAL_FASYANKES.filter(function (v) { return ['Perbaikan', 'Pending'].indexOf(v.status_verifikasi) >= 0; }).length;
      // SDMK per jenis
      const perJenis = {};
      DEMO_PROFIL_SDMK.forEach(function (p) { perJenis[p.jenis_tenaga] = (perJenis[p.jenis_tenaga] || 0) + 1; });
      // Status izin
      const statusIzin = {};
      DEMO_IZIN.forEach(function (i) { statusIzin[i.status] = (statusIzin[i.status] || 0) + 1; });
      // SDMK per unit
      const perUnit = {};
      DEMO_PROFIL_SDMK.forEach(function (p) {
        const u = p.nama_unit || 'Tidak diketahui';
        perUnit[u] = (perUnit[u] || 0) + 1;
      });
      return {
        total_profil_sdmk: totalProfil,
        total_pengajuan_izin: totalIzin,
        izin_diproses: izinProses,
        izin_disetujui: izinDisetujui,
        izin_pending: izinPending,
        izin_ditolak: izinDitolak,
        total_verval_izin: totalVervalIzin,
        total_verval_fasyankes: totalVervalFasyankes,
        total_pengumuman: totalPengumuman,
        vf_layak: vfLayak,
        vf_tidak_layak: vfTidakLayak,
        vf_pending: vfPending,
        per_jenis: perJenis,
        status_izin: statusIzin,
        per_unit: perUnit,
      };
    }
    // Production: pakai view v_dashboard_stats, v_vf_summary, v_sdmk_per_jenis, v_status_izin, v_sdmk_per_unit
    const client = db.getClient();
    const [stats, vfSum, perJenis, statusIzin, perUnit] = await Promise.all([
      client.from('v_dashboard_stats').select('*').limit(1).maybeSingle(),
      client.from('v_vf_summary').select('*').limit(1).maybeSingle(),
      client.from('v_sdmk_per_jenis').select('*'),
      client.from('v_status_izin').select('*'),
      client.from('v_sdmk_per_unit').select('*'),
    ]);
    return {
      total_profil_sdmk: (stats.data && stats.data.total_profil_sdmk) || 0,
      total_pengajuan_izin: (stats.data && stats.data.total_pengajuan_izin) || 0,
      izin_diproses: (stats.data && stats.data.izin_diproses) || 0,
      total_verval_izin: (stats.data && stats.data.total_verval_izin) || 0,
      total_verval_fasyankes: (stats.data && stats.data.total_verval_fasyankes) || 0,
      total_pengumuman: (stats.data && stats.data.total_pengumuman) || 0,
      vf_layak: (vfSum.data && vfSum.data.layak) || 0,
      vf_tidak_layak: (vfSum.data && vfSum.data.tidak_layak) || 0,
      vf_pending: (vfSum.data && vfSum.data.pending_perbaikan) || 0,
      per_jenis: arrayToObject(perJenis.data || [], 'label', 'jumlah'),
      status_izin: arrayToObject(statusIzin.data || [], 'label', 'jumlah'),
      per_unit: arrayToObject(perUnit.data || [], 'label', 'jumlah'),
    };
  }

  function arrayToObject(arr, keyField, valField) {
    const obj = {};
    arr.forEach(function (x) { obj[x[keyField]] = parseInt(x[valField], 10) || 0; });
    return obj;
  }

  // === PENGUMUMAN ===
  async function loadPengumuman(opts) {
    opts = opts || {};
    if (db.isDemoMode()) {
      let data = DEMO_PENGUMUMAN.slice();
      if (opts.search) {
        const q = opts.search.toLowerCase();
        data = data.filter(function (p) {
          return (p.judul || '').toLowerCase().indexOf(q) >= 0 || (p.isi || '').toLowerCase().indexOf(q) >= 0;
        });
      }
      return data.sort(function (a, b) { return new Date(b.tanggal) - new Date(a.tanggal); });
    }
    let q = db.getClient().from('pengumuman').select('*');
    if (opts.search) q = q.or('judul.ilike.%' + opts.search + '%,isi.ilike.%' + opts.search + '%');
    const { data, error } = await q.order('tanggal', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function addPengumuman(payload) {
    if (db.isDemoMode()) {
      const item = Object.assign({ id: genId('PENG'), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, payload);
      DEMO_PENGUMUMAN.unshift(item);
      return item;
    }
    return await db.insertRow('pengumuman', payload);
  }

  async function updatePengumuman(id, payload) {
    if (db.isDemoMode()) {
      const idx = DEMO_PENGUMUMAN.findIndex(function (p) { return p.id === id; });
      if (idx < 0) throw new Error('Pengumuman tidak ditemukan');
      DEMO_PENGUMUMAN[idx] = Object.assign({}, DEMO_PENGUMUMAN[idx], payload, { updated_at: new Date().toISOString() });
      return DEMO_PENGUMUMAN[idx];
    }
    return await db.updateRow('pengumuman', id, payload);
  }

  async function deletePengumuman(id) {
    if (db.isDemoMode()) {
      const idx = DEMO_PENGUMUMAN.findIndex(function (p) { return p.id === id; });
      if (idx < 0) throw new Error('Pengumuman tidak ditemukan');
      return DEMO_PENGUMUMAN.splice(idx, 1)[0];
    }
    return await db.deleteRow('pengumuman', id);
  }

  // === PROFIL SDMK ===
  async function loadProfilSdmk(opts) {
    opts = opts || {};
    if (db.isDemoMode()) {
      let data = DEMO_PROFIL_SDMK.slice();
      if (opts.search) {
        const q = opts.search.toLowerCase();
        data = data.filter(function (p) {
          return (p.nama_lengkap || '').toLowerCase().indexOf(q) >= 0 ||
                 (p.nik || '').indexOf(q) >= 0 ||
                 (p.nama_unit || '').toLowerCase().indexOf(q) >= 0;
        });
      }
      if (opts.jenis_tenaga) data = data.filter(function (p) { return p.jenis_tenaga === opts.jenis_tenaga; });
      if (opts.status_str) data = data.filter(function (p) { return p.status_str === opts.status_str; });
      return data;
    }
    let q = db.getClient().from('profil_sdmk').select('*');
    if (opts.search) q = q.or('nama_lengkap.ilike.%' + opts.search + '%,nik.ilike.%' + opts.search + '%,nama_unit.ilike.%' + opts.search + '%');
    if (opts.jenis_tenaga) q = q.eq('jenis_tenaga', opts.jenis_tenaga);
    if (opts.status_str) q = q.eq('status_str', opts.status_str);
    const { data, error } = await q.order('no', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function addProfilSdmk(payload) {
    if (db.isDemoMode()) {
      const maxNo = DEMO_PROFIL_SDMK.reduce(function (m, p) { return Math.max(m, p.no || 0); }, 0);
      const item = Object.assign({ no: maxNo + 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, payload);
      DEMO_PROFIL_SDMK.push(item);
      return item;
    }
    return await db.insertRow('profil_sdmk', payload);
  }

  async function updateProfilSdmk(nik, payload) {
    if (db.isDemoMode()) {
      const idx = DEMO_PROFIL_SDMK.findIndex(function (p) { return p.nik === nik; });
      if (idx < 0) throw new Error('Profil tidak ditemukan');
      DEMO_PROFIL_SDMK[idx] = Object.assign({}, DEMO_PROFIL_SDMK[idx], payload, { updated_at: new Date().toISOString() });
      return DEMO_PROFIL_SDMK[idx];
    }
    const client = db.getClient();
    const { data, error } = await client.from('profil_sdmk').update(Object.assign({}, payload, { updated_at: new Date().toISOString() })).eq('nik', nik).select().single();
    if (error) throw error;
    return data;
  }

  async function deleteProfilSdmk(nik) {
    if (db.isDemoMode()) {
      const idx = DEMO_PROFIL_SDMK.findIndex(function (p) { return p.nik === nik; });
      if (idx < 0) throw new Error('Profil tidak ditemukan');
      return DEMO_PROFIL_SDMK.splice(idx, 1)[0];
    }
    const client = db.getClient();
    const { error } = await client.from('profil_sdmk').delete().eq('nik', nik);
    if (error) throw error;
    return { nik: nik };
  }

  // === VERVAL IZIN PRAKTIK ===
  async function loadVervalIzin(opts) {
    opts = opts || {};
    if (db.isDemoMode()) {
      let data = DEMO_VERVAL_IZIN.slice();
      if (opts.search) {
        const q = opts.search.toLowerCase();
        data = data.filter(function (v) {
          return (v.nama_lengkap || '').toLowerCase().indexOf(q) >= 0 ||
                 (v.nik || '').indexOf(q) >= 0 ||
                 (v.unit_kerja || '').toLowerCase().indexOf(q) >= 0;
        });
      }
      if (opts.nik) data = data.filter(function (v) { return v.nik === opts.nik; });
      return data.sort(function (a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });
    }
    let q = db.getClient().from('v_verval_izin_detail').select('*');
    if (opts.search) q = q.or('nama_lengkap.ilike.%' + opts.search + '%,nik.ilike.%' + opts.search + '%,unit_kerja.ilike.%' + opts.search + '%');
    if (opts.nik) q = q.eq('nik', opts.nik);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function addVervalIzin(payload) {
    if (db.isDemoMode()) {
      const maxId = DEMO_VERVAL_IZIN.reduce(function (m, v) { return Math.max(m, v.id || 0); }, 0);
      const item = Object.assign({ id: maxId + 1, timestamp: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, payload);
      DEMO_VERVAL_IZIN.unshift(item);
      return item;
    }
    return await db.insertRow('verval_izin_praktik', payload);
  }

  async function updateVervalIzin(id, payload) {
    if (db.isDemoMode()) {
      const idx = DEMO_VERVAL_IZIN.findIndex(function (v) { return v.id === parseInt(id, 10); });
      if (idx < 0) throw new Error('Verval tidak ditemukan');
      DEMO_VERVAL_IZIN[idx] = Object.assign({}, DEMO_VERVAL_IZIN[idx], payload, { updated_at: new Date().toISOString() });
      return DEMO_VERVAL_IZIN[idx];
    }
    return await db.updateRow('verval_izin_praktik', id, payload);
  }

  async function deleteVervalIzin(id) {
    if (db.isDemoMode()) {
      const idx = DEMO_VERVAL_IZIN.findIndex(function (v) { return v.id === parseInt(id, 10); });
      if (idx < 0) throw new Error('Verval tidak ditemukan');
      return DEMO_VERVAL_IZIN.splice(idx, 1)[0];
    }
    return await db.deleteRow('verval_izin_praktik', id);
  }

  // === VERVAL FASYANKES ===
  async function loadVervalFasyankes(opts) {
    opts = opts || {};
    if (db.isDemoMode()) {
      let data = DEMO_VERVAL_FASYANKES.slice();
      if (opts.search) {
        const q = opts.search.toLowerCase();
        data = data.filter(function (v) {
          return (v.nama_fasyankes || '').toLowerCase().indexOf(q) >= 0 ||
                 (v.nomor_unit || '').toLowerCase().indexOf(q) >= 0 ||
                 (v.kecamatan || '').toLowerCase().indexOf(q) >= 0;
        });
      }
      if (opts.jenis_fasyankes) data = data.filter(function (v) { return v.jenis_fasyankes === opts.jenis_fasyankes; });
      if (opts.status_verifikasi) data = data.filter(function (v) { return v.status_verifikasi === opts.status_verifikasi; });
      return data.sort(function (a, b) { return new Date(b.tanggal) - new Date(a.tanggal); });
    }
    let q = db.getClient().from('verval_fasyankes').select('*');
    if (opts.search) q = q.or('nama_fasyankes.ilike.%' + opts.search + '%,nomor_unit.ilike.%' + opts.search + '%,kecamatan.ilike.%' + opts.search + '%');
    if (opts.jenis_fasyankes) q = q.eq('jenis_fasyankes', opts.jenis_fasyankes);
    if (opts.status_verifikasi) q = q.eq('status_verifikasi', opts.status_verifikasi);
    const { data, error } = await q.order('tanggal', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function addVervalFasyankes(payload) {
    if (db.isDemoMode()) {
      const item = Object.assign({ id: genVfId(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, payload);
      DEMO_VERVAL_FASYANKES.unshift(item);
      return item;
    }
    return await db.insertRow('verval_fasyankes', payload);
  }

  async function updateVervalFasyankes(id, payload) {
    if (db.isDemoMode()) {
      const idx = DEMO_VERVAL_FASYANKES.findIndex(function (v) { return v.id === id; });
      if (idx < 0) throw new Error('Verval fasyankes tidak ditemukan');
      DEMO_VERVAL_FASYANKES[idx] = Object.assign({}, DEMO_VERVAL_FASYANKES[idx], payload, { updated_at: new Date().toISOString() });
      return DEMO_VERVAL_FASYANKES[idx];
    }
    return await db.updateRow('verval_fasyankes', id, payload);
  }

  async function deleteVervalFasyankes(id) {
    if (db.isDemoMode()) {
      const idx = DEMO_VERVAL_FASYANKES.findIndex(function (v) { return v.id === id; });
      if (idx < 0) throw new Error('Verval fasyankes tidak ditemukan');
      // Hapus juga SDM child
      for (let i = DEMO_VERVAL_FASYANKES_SDM.length - 1; i >= 0; i--) {
        if (DEMO_VERVAL_FASYANKES_SDM[i].verval_id === id) DEMO_VERVAL_FASYANKES_SDM.splice(i, 1);
      }
      return DEMO_VERVAL_FASYANKES.splice(idx, 1)[0];
    }
    return await db.deleteRow('verval_fasyankes', id);
  }

  async function loadSdmStandar(jenisFasyankes) {
    if (db.isDemoMode()) {
      let data = DEMO_SDM_STANDAR.slice();
      if (jenisFasyankes) data = data.filter(function (s) { return s.jenis_fasyankes === jenisFasyankes; });
      return data.sort(function (a, b) { return a.urutan - b.urutan; });
    }
    let q = db.getClient().from('sdm_standar_fasyankes').select('*');
    if (jenisFasyankes) q = q.eq('jenis_fasyankes', jenisFasyankes);
    const { data, error } = await q.order('urutan', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  // === IZIN (Pengajuan Izin) ===
  async function loadIzin(opts) {
    opts = opts || {};
    if (db.isDemoMode()) {
      let data = DEMO_IZIN.slice();
      if (opts.search) {
        const q = opts.search.toLowerCase();
        data = data.filter(function (i) {
          return (i.nama_lengkap || '').toLowerCase().indexOf(q) >= 0 ||
                 (i.nik || '').indexOf(q) >= 0;
        });
      }
      if (opts.status) data = data.filter(function (i) { return i.status === opts.status; });
      return data.sort(function (a, b) { return new Date(b.tgl_usulan) - new Date(a.tgl_usulan); });
    }
    let q = db.getClient().from('izin').select('*');
    if (opts.search) q = q.or('nama_lengkap.ilike.%' + opts.search + '%,nik.ilike.%' + opts.search + '%');
    if (opts.status) q = q.eq('status', opts.status);
    const { data, error } = await q.order('tgl_usulan', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function addIzin(payload) {
    if (db.isDemoMode()) {
      const item = Object.assign({ id: genId('IZIN'), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, payload);
      DEMO_IZIN.unshift(item);
      return item;
    }
    return await db.insertRow('izin', payload);
  }

  async function updateIzin(id, payload) {
    if (db.isDemoMode()) {
      const idx = DEMO_IZIN.findIndex(function (i) { return i.id === id; });
      if (idx < 0) throw new Error('Izin tidak ditemukan');
      DEMO_IZIN[idx] = Object.assign({}, DEMO_IZIN[idx], payload, { updated_at: new Date().toISOString() });
      return DEMO_IZIN[idx];
    }
    return await db.updateRow('izin', id, payload);
  }

  async function deleteIzin(id) {
    if (db.isDemoMode()) {
      const idx = DEMO_IZIN.findIndex(function (i) { return i.id === id; });
      if (idx < 0) throw new Error('Izin tidak ditemukan');
      return DEMO_IZIN.splice(idx, 1)[0];
    }
    return await db.deleteRow('izin', id);
  }

  // === USERS ===
  async function loadUsers(opts) {
    opts = opts || {};
    if (db.isDemoMode()) {
      let data = DEMO_USERS_LIST.slice();
      if (opts.search) {
        const q = opts.search.toLowerCase();
        data = data.filter(function (u) {
          return (u.username || '').toLowerCase().indexOf(q) >= 0 ||
                 (u.full_name || '').toLowerCase().indexOf(q) >= 0;
        });
      }
      if (opts.role) data = data.filter(function (u) { return u.role === opts.role; });
      return data;
    }
    let q = db.getClient().from('users').select('*');
    if (opts.role) q = q.eq('role', opts.role);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function addUser(payload) {
    if (db.isDemoMode()) {
      const exists = DEMO_USERS_LIST.find(function (u) { return u.username === payload.username; });
      if (exists) throw new Error('Username sudah dipakai');
      const item = Object.assign({ created_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_active: true }, payload);
      DEMO_USERS_LIST.push(item);
      return item;
    }
    return await db.insertRow('users', payload);
  }

  async function updateUser(username, payload) {
    if (db.isDemoMode()) {
      const idx = DEMO_USERS_LIST.findIndex(function (u) { return u.username === username; });
      if (idx < 0) throw new Error('User tidak ditemukan');
      DEMO_USERS_LIST[idx] = Object.assign({}, DEMO_USERS_LIST[idx], payload, { updated_at: new Date().toISOString() });
      return DEMO_USERS_LIST[idx];
    }
    const client = db.getClient();
    const { data, error } = await client.from('users').update(Object.assign({}, payload, { updated_at: new Date().toISOString() })).eq('username', username).select().single();
    if (error) throw error;
    return data;
  }

  async function deleteUser(username) {
    if (db.isDemoMode()) {
      const idx = DEMO_USERS_LIST.findIndex(function (u) { return u.username === username; });
      if (idx < 0) throw new Error('User tidak ditemukan');
      return DEMO_USERS_LIST.splice(idx, 1)[0];
    }
    const client = db.getClient();
    const { error } = await client.from('users').delete().eq('username', username);
    if (error) throw error;
    return { username: username };
  }

  // === LOGS (audit) ===
  async function loadLogs(opts) {
    opts = opts || {};
    if (db.isDemoMode()) {
      let data = DEMO_LOGS.slice();
      if (opts.search) {
        const q = opts.search.toLowerCase();
        data = data.filter(function (l) {
          return (l.username || '').toLowerCase().indexOf(q) >= 0 ||
                 (l.aksi || '').toLowerCase().indexOf(q) >= 0 ||
                 (l.detail || '').toLowerCase().indexOf(q) >= 0;
        });
      }
      if (opts.aksi) data = data.filter(function (l) { return l.aksi === opts.aksi; });
      return data.sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
    }
    let q = db.getClient().from('logs').select('*');
    if (opts.aksi) q = q.eq('aksi', opts.aksi);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function addLog(payload) {
    if (db.isDemoMode()) {
      const maxId = DEMO_LOGS.reduce(function (m, l) { return Math.max(m, l.id || 0); }, 0);
      const item = Object.assign({ id: maxId + 1, created_at: new Date().toISOString(), ip_address: '127.0.0.1' }, payload);
      DEMO_LOGS.unshift(item);
      return item;
    }
    return await db.insertRow('logs', payload);
  }

  // === Notifikasi Expired (derived from profil_sdmk where status_str = 'Expired' or tgl_berakhir_sip < today) ===
  async function loadExpiredNotifications() {
    if (db.isDemoMode()) {
      const today = new Date();
      const items = [];
      DEMO_PROFIL_SDMK.forEach(function (p) {
        if (p.status_str === 'Expired' || (p.tgl_berakhir_sip && new Date(p.tgl_berakhir_sip) < today)) {
          items.push({
            id: 'exp-' + p.nik,
            type: p.status_str === 'Expired' ? 'str_expired' : 'sip_expired',
            nama: p.nama_lengkap,
            profesi: p.jenis_tenaga,
            unit: p.nama_unit,
            nik: p.nik,
            no_str: p.nomor_str,
            no_sip: p.nomor_sip,
            tgl_berakhir: p.tgl_berakhir_sip,
            is_read: false,
          });
        }
      });
      return items;
    }
    // Production: query profil_sdmk where status_str = 'Expired' OR tgl_berakhir_sip < now()
    const client = db.getClient();
    const { data, error } = await client.from('profil_sdmk')
      .select('*')
      .or('status_str.eq.Expired,tgl_berakhir_sip.lt.' + new Date().toISOString().split('T')[0]);
    if (error) throw error;
    return (data || []).map(function (p) {
      return {
        id: 'exp-' + p.nik,
        type: p.status_str === 'Expired' ? 'str_expired' : 'sip_expired',
        nama: p.nama_lengkap,
        profesi: p.jenis_tenaga,
        unit: p.nama_unit,
        nik: p.nik,
        no_str: p.nomor_str,
        no_sip: p.nomor_sip,
        tgl_berakhir: p.tgl_berakhir_sip,
        is_read: false,
      };
    });
  }

  // === Expose ===
  window.SIMANTRI_DATA = {
    // Mock data (for reference)
    DEMO_PENGUMUMAN: DEMO_PENGUMUMAN,
    DEMO_PROFIL_SDMK: DEMO_PROFIL_SDMK,
    DEMO_VERVAL_IZIN: DEMO_VERVAL_IZIN,
    DEMO_VERVAL_FASYANKES: DEMO_VERVAL_FASYANKES,
    DEMO_IZIN: DEMO_IZIN,
    DEMO_USERS_LIST: DEMO_USERS_LIST,
    DEMO_LOGS: DEMO_LOGS,
    // Dashboard
    loadDashboardStats: loadDashboardStats,
    // Pengumuman
    loadPengumuman: loadPengumuman,
    addPengumuman: addPengumuman,
    updatePengumuman: updatePengumuman,
    deletePengumuman: deletePengumuman,
    // Profil SDMK
    loadProfilSdmk: loadProfilSdmk,
    addProfilSdmk: addProfilSdmk,
    updateProfilSdmk: updateProfilSdmk,
    deleteProfilSdmk: deleteProfilSdmk,
    // Verval Izin Praktik
    loadVervalIzin: loadVervalIzin,
    addVervalIzin: addVervalIzin,
    updateVervalIzin: updateVervalIzin,
    deleteVervalIzin: deleteVervalIzin,
    // Verval Fasyankes
    loadVervalFasyankes: loadVervalFasyankes,
    addVervalFasyankes: addVervalFasyankes,
    updateVervalFasyankes: updateVervalFasyankes,
    deleteVervalFasyankes: deleteVervalFasyankes,
    loadSdmStandar: loadSdmStandar,
    // Izin
    loadIzin: loadIzin,
    addIzin: addIzin,
    updateIzin: updateIzin,
    deleteIzin: deleteIzin,
    // Users
    loadUsers: loadUsers,
    addUser: addUser,
    updateUser: updateUser,
    deleteUser: deleteUser,
    // Logs
    loadLogs: loadLogs,
    addLog: addLog,
    // Notifications
    loadExpiredNotifications: loadExpiredNotifications,
  };
})();
