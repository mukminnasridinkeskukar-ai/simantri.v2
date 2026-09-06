-- =========================================================
-- SIMANTRI — SEED DATA (OPSIONAL, khusus DEMO)
-- ---------------------------------------------------------
-- Jalankan HANYA bila ingin mengisi contoh data untuk
-- melihat dashboard, grafik, dan peta. Data ini MASUK ke
-- Supabase (bukan mock di kode), sehingga aplikasi tetap
-- membaca live dari Supabase.
-- Aman dijalankan berulang (id eksplisit + overriding system value +
-- on conflict do nothing + sinkronisasi sequence setelah tiap tabel).
-- =========================================================

-- ---------- FASYANKES ----------
insert into public.fasyankes
  (id, nama_fasyankes, jenis, alamat, kecamatan, latitude, longitude, status_verifikasi)
overriding system value
values
  (1, 'RSUD Samarinda', 'RS', 'Jl. Milono No. 1', 'Samarinda Ilir', -0.4905, 117.1462, 'disetujui'),
  (2, 'RS Islam Sakinah', 'RS', 'Jl. WR Supratman No. 1', 'Samarinda Ulu', -0.4780, 117.1540, 'disetujui'),
  (3, 'RS Dirgahayu Samarinda', 'RS', 'Jl. Panglima Batur No. 3', 'Samarinda Ilir', -0.4980, 117.1470, 'disetujui'),
  (4, 'Puskesmas Samarinda Ulu', 'Puskesmas', 'Jl. Tembaga Raya', 'Samarinda Ulu', -0.4783, 117.1520, 'disetujui'),
  (5, 'Puskesmas Samarinda Seberang', 'Puskesmas', 'Jl. Yos Sudarso', 'Samarinda Seberang', -0.5040, 117.1450, 'disetujui'),
  (6, 'Puskesmas Lempake', 'Puskesmas', 'Jl. Cempaka, Lempake', 'Samarinda Utara', -0.4460, 117.1960, 'disetujui'),
  (7, 'Puskesmas Loa Janan Ilir', 'Puskesmas', 'Jl. M. Yamin', 'Loa Janan Ilir', -0.5180, 117.1310, 'disetujui'),
  (8, 'Klinik Pratama Harapan Bunda', 'Klinik', 'Jl. Gajah Mada', 'Samarinda Kota', -0.4960, 117.1440, 'disetujui'),
  (9, 'Klinik Pratama Sehat Sentosa', 'Klinik', 'Jl. Ir. H. Juanda', 'Samarinda Tengah', -0.4930, 117.1495, 'pending'),
  (10, 'Klinik Gigi Niaga', 'Klinik', 'Jl. Bhayangkara', 'Samarinda Kota', -0.4945, 117.1430, 'ditolak')
on conflict (id) do nothing;

-- Sinkronkan sequence kolom identity agar insert berikutnya dari
-- aplikasi tidak bertabrakan (duplicate key) dengan id hasil seed.
select setval(pg_get_serial_sequence('public.fasyankes', 'id'),
              coalesce((select max(id) from public.fasyankes), 0) + 1, false);

-- Contoh catatan verifikasi
update public.fasyankes set
  catatan_verifikasi = 'Nomor izin klinik belum dilampirkan. Mohon lengkapi berkas.',
  verified_by = 'verifikator@dinkes.go.id',
  verified_at = now() - interval '2 days'
where id = 10;

-- ---------- PRAKTIK MANDIRI ----------
insert into public.praktik_mandiri
  (id, nama_praktik, pemilik, alamat, jenis_praktik, kecamatan, latitude, longitude, status_verifikasi)
overriding system value
values
  (1, 'Praktik Bidan Rosnani', 'Rosnani, S.Tr.Keb', 'Jl. Solihin MS', 'Praktik Bidan', 'Loa Janan Ilir', -0.5220, 117.1280, 'disetujui'),
  (2, 'Praktik Dokter Gigi Smile', 'drg. Andi Prasetyo', 'Jl. Dr. Sutomo', 'Praktik Dokter Gigi', 'Samarinda Tengah', -0.4925, 117.1490, 'disetujui'),
  (3, 'Praktik Dokter dr. Hj. Aminah', 'dr. Hj. Aminah', 'Jl. Pangeran Diponegoro', 'Praktik Dokter', 'Samarinda Kota', -0.4975, 117.1435, 'disetujui'),
  (4, 'Praktik Bidan Syarifah', 'Syarifah, A.Md.Keb', 'Jl. Sp. Paradiso', 'Praktik Bidan', 'Samarinda Utara', -0.4590, 117.1710, 'disetujui'),
  (5, 'Praktik Perawat Kasih Ibu', 'Yuliani, S.Kep', 'Jl. Karya Baru', 'Praktik Perawat', 'Samarinda Seberang', -0.5060, 117.1465, 'pending'),
  (6, 'Praktik Fisioterapi Activa', 'Budi Hartono, S.Ft', 'Jl. Kesuma Bangsa', 'Praktik Fisioterapi', 'Samarinda Ulu', -0.4750, 117.1580, 'pending'),
  (7, 'Praktik Bidan Mukarlina', 'Mukarlina, S.Tr.Keb', 'Jl. Sisingamangaraja', 'Praktik Bidan', 'Palaran', -0.5410, 117.1840, 'disetujui'),
  (8, 'Praktik Dokter dr. Rahmat', 'dr. Rahmat Hidayat', 'Jl. PAI Sumbu', 'Praktik Dokter', 'Samarinda Induk', -0.4330, 117.2250, 'ditolak')
on conflict (id) do nothing;

select setval(pg_get_serial_sequence('public.praktik_mandiri', 'id'),
              coalesce((select max(id) from public.praktik_mandiri), 0) + 1, false);

update public.praktik_mandiri set
  catatan_verifikasi = 'Alamat praktik tidak sesuai dengan data SIP.',
  verified_by = 'verifikator@dinkes.go.id',
  verified_at = now() - interval '1 day'
where id = 8;

-- ---------- TENAGA MEDIS ----------
insert into public.tenaga_medis
  (id, nik, nama_lengkap, no_str, no_sip, spesialisasi, tempat_praktik, masa_berlaku_sip, status)
overriding system value
values
  (1, '6472010101900001', 'dr. Ahmad Fauzi, Sp.PD', '30.1.4.31.01725', '446/STR/2024', 'Penyakit Dalam', 'RSUD Samarinda', '2026-08-20', 'aktif'),
  (2, '6472010102910002', 'dr. Siti Rahmawati, Sp.A', '30.1.4.31.01902', '512/STR/2024', 'Anak', 'RS Islam Sakinah', '2026-09-18', 'aktif'),
  (3, '6472010103850003', 'drg. Budi Santoso', '30.2.2.31.01221', '477/SIP/2025', 'Konservasi Gigi', 'Klinik Pratama Harapan Bunda', '2026-10-05', 'aktif'),
  (4, '6472010104880004', 'dr. Maria Ulfa', '30.1.4.31.02011', '530/STR/2025', 'Umum', 'RS Dirgahayu Samarinda', '2027-03-15', 'aktif'),
  (5, '6472010105750005', 'dr. H. Muhammad Yusran, Sp.B', '30.1.4.31.00988', '390/STR/2023', 'Bedah', 'RSUD Samarinda', '2027-01-20', 'aktif'),
  (6, '6472010106950006', 'dr. Intan Permatasari', '30.1.4.31.02150', '548/STR/2026', 'Umum', 'Praktik Mandiri Samarinda Ulu', '2026-09-10', 'aktif'),
  (7, '6472010107800007', 'dr. Kurniawan, Sp.OG', '30.1.4.31.01540', '455/STR/2024', 'Obstetri & Ginekologi', 'RS Islam Sakinah', '2027-06-30', 'aktif')
on conflict (id) do nothing;

select setval(pg_get_serial_sequence('public.tenaga_medis', 'id'),
              coalesce((select max(id) from public.tenaga_medis), 0) + 1, false);

-- ---------- TENAGA KESEHATAN ----------
insert into public.tenaga_kesehatan
  (id, nik, nama_lengkap, no_str, no_sip, profesi, tempat_praktik, masa_berlaku_sip, status)
overriding system value
values
  (1, '6472020101900001', 'Ni Luh Putu Ayu, S.Kep', '30.3.4.31.02201', 'SIP-N/118', 'Perawat', 'Klinik Pratama Harapan Bunda', '2026-09-30', 'aktif'),
  (2, '6472020102920002', 'Rahmawati, A.Md.Keb', '30.5.4.31.01877', 'SIP-B/204', 'Bidan', 'Praktik Bidan Rosnani', '2027-05-10', 'aktif'),
  (3, '6472020103850003', 'Joko Prasetyo, S.Farm', '30.4.4.31.01203', 'SIP-A/95', 'Apoteker', 'Apotek Sejahtera Samarinda', '2026-08-01', 'aktif'),
  (4, '6472020104930004', 'Dewi Sartika, S.Ft', '30.6.4.31.02110', 'SIP-F/77', 'Fisioterapis', 'Praktik Fisioterapi Activa', '2027-08-01', 'aktif'),
  (5, '6472020105990005', 'Siti Aminah, A.Md.AK', '30.7.4.31.01988', 'SIP-G/61', 'Teknologi Laboratorium Medik (ATLM)', 'Laboratorium Klinik Prama', '2026-10-28', 'aktif')
on conflict (id) do nothing;

select setval(pg_get_serial_sequence('public.tenaga_kesehatan', 'id'),
              coalesce((select max(id) from public.tenaga_kesehatan), 0) + 1, false);

-- ---------- MONEV IZIN ----------
insert into public.monev_izin
  (id, tanggal_kunjungan, sasaran_jenis, sasaran_nama, petugas, temuan, tindak_lanjut, created_by)
overriding system value
values
  (1, '2026-08-25', 'Fasyankes', 'Klinik Pratama Harapan Bunda', 'Tim Monev Dinkes',
   'Arsip SIP tenaga medis tidak lengkap untuk 1 dokter.', 'Surat rekomendasi pelengkapan berkas dalam 14 hari.',
   'operator@dinkes.go.id'),
  (2, '2026-09-02', 'Praktik Mandiri', 'Praktik Bidan Rosnani', 'Tim Monev Dinkes',
   'Ruang praktik bersih, alat PWS-KIA lengkap dan terkalibrasi.', 'Tidak ada; pertahankan standar pelayanan.',
   'operator@dinkes.go.id')
on conflict (id) do nothing;

select setval(pg_get_serial_sequence('public.monev_izin', 'id'),
              coalesce((select max(id) from public.monev_izin), 0) + 1, false);

-- ---------- VERVAL IZIN PRAKTIK ----------
insert into public.verval_izin_praktik
  (id, nik, nama_lengkap, jenis_kelamin, tempat_lahir, tanggal_lahir, alamat_ktp,
   nomor_str, status_str, status_sip, nomor_sip, masa_berlaku_sip,
   unit_kerja, alamat_unit, desa_kelurahan, kecamatan, status_satu_sehat,
   sop_pelayanan, sop_profesi, sop_etika, sdmk_named, sdmk_nakes, sdmk_admin,
   jam_operasional, catatan_rekomendasi, pendidikan_str, kode_verifikasi, verifikator)
overriding system value
values
  (1, '6472010101900001', 'dr. Ahmad Fauzi, Sp.PD', 'Laki-laki', 'Samarinda', '1990-01-01',
   'Jl. Cempaka No. 25, Samarinda Ilir',
   '30.1.4.31.01725', 'Aktif', 'Aktif', '446/STR/2024', '2026-08-20',
   'RSUD Samarinda', 'Jl. Milono No. 1', 'Sidodamai', 'Samarinda Ilir', 'Sudah',
   'Ada', 'Ada', 'Ada', 'Ada', 'Ada', 'Ada',
   'Senin-Jumat 07.30-16.00', 'SIP masih berlaku, lengkapi pembaruan STR tahun depan.',
   'S1 Kedokteran - Sp. Penyakit Dalam', 'SIMANTRI-VERVAL-6472010101900001-DEMO', 'verifikator@dinkes.go.id'),
  (2, '6472020101900001', 'Ni Luh Putu Ayu, S.Kep', 'Perempuan', 'Denpasar', '1991-02-10',
   'Jl. Karang Mumus Raya No. 8, Samarinda',
   '30.3.4.31.02201', 'Aktif', 'Aktif', 'SIP-N/118', '2026-09-30',
   'Klinik Pratama Harapan Bunda', 'Jl. Gajah Mada No. 12', 'Pelabuhan', 'Samarinda Kota', 'Belum',
   'Ada', 'Ada', 'Tidak Ada', 'Ada', 'Ada', 'Belum',
   'Senin-Sabtu 08.00-20.00', 'Registrasi SatuSehat SDMK dan SOP etika perlu dilengkapi.',
   'D3 Keperawatan / S1 Ners', 'SIMANTRI-VERVAL-6472020101900001-DEMO', 'verifikator@dinkes.go.id')
on conflict (id) do nothing;

select setval(pg_get_serial_sequence('public.verval_izin_praktik', 'id'),
              coalesce((select max(id) from public.verval_izin_praktik), 0) + 1, false);
