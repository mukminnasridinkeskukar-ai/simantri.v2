-- =========================================================
-- SIMANTRI — SEED DATA (OPSIONAL, khusus DEMO)
-- ---------------------------------------------------------
-- Jalankan HANYA bila ingin mengisi contoh data untuk
-- melihat dashboard, grafik, dan peta. Data ini MASUK ke
-- Supabase (bukan mock di kode), sehingga aplikasi tetap
-- membaca live dari Supabase.
-- Aman dijalankan berulang (id eksplisit + overriding system value +
-- on conflict do nothing + sinkronisasi sequence setelah tiap tabel).
-- Sejak v1.2.1: tanpa NIK & lokasi demo Kab. Kutai Kartanegara.
-- =========================================================

-- ---------- FASYANKES ----------
insert into public.fasyankes
  (id, nama_fasyankes, jenis, alamat, kecamatan, latitude, longitude, status_verifikasi)
overriding system value
values
  (1, 'RSUD Tenggarong', 'RS', 'Jl. Gajah Mada No. 1', 'Tenggarong', -0.4419, 117.0861, 'disetujui'),
  (2, 'RS Pratama Loa Janan', 'RS', 'Jl. Poros Mahakam', 'Loa Janan', -0.5210, 117.1360, 'disetujui'),
  (3, 'RS Dirgahayu Tenggarong', 'RS', 'Jl. Panglima Batur No. 3', 'Tenggarong', -0.4440, 117.0890, 'disetujui'),
  (4, 'Puskesmas Tenggarong', 'Puskesmas', 'Jl. Tembaga Raya', 'Tenggarong', -0.4390, 117.0880, 'disetujui'),
  (5, 'Puskesmas Tenggarong Seberang', 'Puskesmas', 'Jl. Yos Sudarso', 'Tenggarong Seberang', -0.4265, 117.1010, 'disetujui'),
  (6, 'Puskesmas Muara Jawa', 'Puskesmas', 'Jl. Cempaka, Muara Jawa', 'Muara Jawa', -0.5880, 117.2370, 'disetujui'),
  (7, 'Puskesmas Loa Kulu', 'Puskesmas', 'Jl. M. Yamin', 'Loa Kulu', -0.5580, 117.0920, 'disetujui'),
  (8, 'Klinik Pratama Harapan Bunda', 'Klinik', 'Jl. Gajah Mada', 'Tenggarong', -0.4425, 117.0850, 'disetujui'),
  (9, 'Klinik Pratama Sehat Sentosa', 'Klinik', 'Jl. Ir. H. Juanda', 'Tenggarong', -0.4450, 117.0910, 'pending'),
  (10, 'Klinik Gigi Niaga', 'Klinik', 'Jl. Bhayangkara', 'Tenggarong', -0.4430, 117.0840, 'ditolak')
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
  (1, 'Praktik Bidan Rosnani', 'Rosnani, S.Tr.Keb', 'Jl. Solihin MS', 'Praktik Bidan', 'Loa Janan', -0.5205, 117.1355, 'disetujui'),
  (2, 'Praktik Dokter Gigi Smile', 'drg. Andi Prasetyo', 'Jl. Dr. Sutomo', 'Praktik Dokter Gigi', 'Tenggarong', -0.4405, 117.0875, 'disetujui'),
  (3, 'Praktik Dokter dr. Hj. Aminah', 'dr. Hj. Aminah', 'Jl. Pangeran Diponegoro', 'Praktik Dokter', 'Tenggarong', -0.4435, 117.0850, 'disetujui'),
  (4, 'Praktik Bidan Syarifah', 'Syarifah, A.Md.Keb', 'Jl. Sp. Paradiso', 'Praktik Bidan', 'Tenggarong Seberang', -0.4275, 117.1030, 'disetujui'),
  (5, 'Praktik Perawat Kasih Ibu', 'Yuliani, S.Kep', 'Jl. Karya Baru', 'Praktik Perawat', 'Loa Kulu', -0.5570, 117.0910, 'pending'),
  (6, 'Praktik Fisioterapi Activa', 'Budi Hartono, S.Ft', 'Jl. Kesuma Bangsa', 'Praktik Fisioterapi', 'Tenggarong', -0.4455, 117.0890, 'pending'),
  (7, 'Praktik Bidan Mukarlina', 'Mukarlina, S.Tr.Keb', 'Jl. Sisingamangaraja', 'Praktik Bidan', 'Samboja', -1.0365, 117.2575, 'disetujui'),
  (8, 'Praktik Dokter dr. Rahmat', 'dr. Rahmat Hidayat', 'Jl. PAI Sumbu', 'Praktik Dokter', 'Sanga Sanga', -0.6605, 117.1515, 'ditolak')
on conflict (id) do nothing;

select setval(pg_get_serial_sequence('public.praktik_mandiri', 'id'),
              coalesce((select max(id) from public.praktik_mandiri), 0) + 1, false);

update public.praktik_mandiri set
  catatan_verifikasi = 'Alamat praktik tidak sesuai dengan data SIP.',
  verified_by = 'verifikator@dinkes.go.id',
  verified_at = now() - interval '1 day'
where id = 8;

-- ---------- TENAGA MEDIS (tanpa NIK sejak v1.2.1) ----------
insert into public.tenaga_medis
  (id, nama_lengkap, no_str, no_sip, spesialisasi, tempat_praktik, masa_berlaku_sip, status)
overriding system value
values
  (1, 'dr. Ahmad Fauzi, Sp.PD', '30.1.4.31.01725', '446/STR/2024', 'Penyakit Dalam', 'RSUD Tenggarong', '2026-08-20', 'aktif'),
  (2, 'dr. Siti Rahmawati, Sp.A', '30.1.4.31.01902', '512/STR/2024', 'Anak', 'RS Pratama Loa Janan', '2026-09-18', 'aktif'),
  (3, 'drg. Budi Santoso', '30.2.2.31.01221', '477/SIP/2025', 'Konservasi Gigi', 'Klinik Pratama Harapan Bunda', '2026-10-05', 'aktif'),
  (4, 'dr. Maria Ulfa', '30.1.4.31.02011', '530/STR/2025', 'Umum', 'RS Dirgahayu Tenggarong', '2027-03-15', 'aktif'),
  (5, 'dr. H. Muhammad Yusran, Sp.B', '30.1.4.31.00988', '390/STR/2023', 'Bedah', 'RSUD Tenggarong', '2027-01-20', 'aktif'),
  (6, 'dr. Intan Permatasari', '30.1.4.31.02150', '548/STR/2026', 'Umum', 'Praktik Mandiri Tenggarong', '2026-09-10', 'aktif'),
  (7, 'dr. Kurniawan, Sp.OG', '30.1.4.31.01540', '455/STR/2024', 'Obstetri & Ginekologi', 'RS Pratama Loa Janan', '2027-06-30', 'aktif')
on conflict (id) do nothing;

select setval(pg_get_serial_sequence('public.tenaga_medis', 'id'),
              coalesce((select max(id) from public.tenaga_medis), 0) + 1, false);

-- ---------- TENAGA KESEHATAN (tanpa NIK sejak v1.2.1) ----------
insert into public.tenaga_kesehatan
  (id, nama_lengkap, no_str, no_sip, profesi, tempat_praktik, masa_berlaku_sip, status)
overriding system value
values
  (1, 'Ni Luh Putu Ayu, S.Kep', '30.3.4.31.02201', 'SIP-N/118', 'Perawat', 'Klinik Pratama Harapan Bunda', '2026-09-30', 'aktif'),
  (2, 'Rahmawati, A.Md.Keb', '30.5.4.31.01877', 'SIP-B/204', 'Bidan', 'Praktik Bidan Rosnani', '2027-05-10', 'aktif'),
  (3, 'Joko Prasetyo, S.Farm', '30.4.4.31.01203', 'SIP-A/95', 'Apoteker', 'Apotek Sejahtera Tenggarong', '2026-08-01', 'aktif'),
  (4, 'Dewi Sartika, S.Ft', '30.6.4.31.02110', 'SIP-F/77', 'Fisioterapis', 'Praktik Fisioterapi Activa', '2027-08-01', 'aktif'),
  (5, 'Siti Aminah, A.Md.AK', '30.7.4.31.01988', 'SIP-G/61', 'Teknologi Laboratorium Medik (ATLM)', 'Laboratorium Klinik Prama', '2026-10-28', 'aktif')
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

-- ---------- VERVAL IZIN PRAKTIK (tanpa NIK sejak v1.2.1) ----------
insert into public.verval_izin_praktik
  (id, nama_lengkap, jenis_kelamin, tempat_lahir, tanggal_lahir, alamat_ktp,
   nomor_str, status_str, status_sip, nomor_sip, masa_berlaku_sip,
   unit_kerja, alamat_unit, desa_kelurahan, kecamatan, status_satu_sehat,
   sop_pelayanan, sop_profesi, sop_etika, sdmk_named, sdmk_nakes, sdmk_admin,
   jam_operasional, catatan_rekomendasi, pendidikan_str, kode_verifikasi, verifikator)
overriding system value
values
  (1, 'dr. Ahmad Fauzi, Sp.PD', 'Laki-laki', 'Tenggarong', '1990-01-01',
   'Jl. Gajah Mada No. 25, Tenggarong',
   '30.1.4.31.01725', 'Aktif', 'Aktif', '446/STR/2024', '2026-08-20',
   'RSUD Tenggarong', 'Jl. Gajah Mada No. 1', 'Dam Setui', 'Tenggarong', 'Sudah',
   'Ada', 'Ada', 'Ada', 'Ada', 'Ada', 'Ada',
   'Senin-Jumat 07.30-16.00', 'SIP masih berlaku, lengkapi pembaruan STR tahun depan.',
   'S1 Kedokteran - Sp. Penyakit Dalam', 'SIMANTRI-VERVAL-1788220800001', 'verifikator@dinkes.go.id'),
  (2, 'Ni Luh Putu Ayu, S.Kep', 'Perempuan', 'Denpasar', '1991-02-10',
   'Jl. Kesuma Bangsa No. 8, Tenggarong',
   '30.3.4.31.02201', 'Aktif', 'Aktif', 'SIP-N/118', '2026-09-30',
   'Klinik Pratama Harapan Bunda', 'Jl. Gajah Mada No. 12', 'Pemuda', 'Tenggarong', 'Belum',
   'Ada', 'Ada', 'Tidak Ada', 'Ada', 'Ada', 'Belum',
   'Senin-Sabtu 08.00-20.00', 'Registrasi SatuSehat SDMK dan SOP etika perlu dilengkapi.',
   'D3 Keperawatan / S1 Ners', 'SIMANTRI-VERVAL-1788403200002', 'verifikator@dinkes.go.id')
on conflict (id) do nothing;

select setval(pg_get_serial_sequence('public.verval_izin_praktik', 'id'),
              coalesce((select max(id) from public.verval_izin_praktik), 0) + 1, false);

-- ---------- VERVAL FASYANKES ----------
insert into public.verval_fasyankes
  (id, kode_verval, tanggal_verval, nomor_unit, nama_fasyankes, jenis_fasyankes,
   nama_pemilik, penanggung_jawab, alamat_lengkap, kelurahan, kecamatan, nomor_hp,
   email, sdm_kesehatan, status_verifikasi, catatan_verifikasi, verifikator)
overriding system value
values
  (1, 'VF-20260901-DEMO1', '2026-09-01', '446/RS/2020', 'RSUD Tenggarong', 'Rumah Sakit',
   'Pemerintah Kabupaten Kutai Kartanegara', 'drg. Ida Farida, M.Kes',
   'Jl. Gajah Mada No. 1', 'Dam Setui', 'Tenggarong', '0541234567', 'rsud@kukarkab.go.id',
   'Dokter Umum; Dokter Spesialis; Dokter Gigi; Perawat; Apoteker; ATLM',
   'Layak', 'Fasilitas lengkap, SDM sesuai standar, arsip izin tertib.',
   'verifikator@dinkes.go.id'),
  (2, 'VF-20260903-DEMO2', '2026-09-03', 'KLN-221/2024', 'Klinik Pratama Sehat Sentosa', 'Klinik',
   'CV Sehat Sentosa', 'dr. Rina Kartika',
   'Jl. Ir. H. Juanda No. 45', 'Pemuda', 'Tenggarong', '081250012345', 'sehatsentosa@mail.com',
   'Dokter; Perawat',
   'Perbaikan', 'SIP satu perawat belum diperbarui; apoteker belum tersedia tetap.',
   'verifikator@dinkes.go.id')
on conflict (id) do nothing;

select setval(pg_get_serial_sequence('public.verval_fasyankes', 'id'),
              coalesce((select max(id) from public.verval_fasyankes), 0) + 1, false);
