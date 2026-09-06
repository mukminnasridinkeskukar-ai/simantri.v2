-- ============================================================================
-- SIMANTRI v1.1 -- SKEMA DATABASE LENGKAP (PostgreSQL / Supabase)
-- Platform Digital Pengelolaan Izin Praktik
-- Dinas Kesehatan Kutai Kartanegara
-- ----------------------------------------------------------------------------
-- PEMETAAN MENU SIDEBAR -> OBJEK DATABASE:
--   1. Dashboard                 -> VIEW: v_dashboard_stats, v_vf_summary,
--                                   v_sdmk_per_jenis, v_status_izin,
--                                   v_sdmk_per_unit, v_verval_izin_detail
--   2. Pengumuman                -> TABEL: pengumuman
--   3. Verval Izin Praktik       -> TABEL: verval_izin_praktik
--   4. Verval Fasyankes          -> TABEL: verval_fasyankes,
--                                   verval_fasyankes_sdm,
--                                   sdm_standar_fasyankes (master opsi SDM)
--   5. Data Verval Fasyankes     -> TABEL: verval_fasyankes (+ indeks & view)
--   6. Profil SDMK               -> TABEL: profil_sdmk
--   7. Data Verval Izin Praktik  -> TABEL: verval_izin_praktik (indeks NIK)
--   8. Panel Admin               -> TABEL: users, logs, izin
-- ----------------------------------------------------------------------------
-- CATATAN DESAIN:
--   * Nama kolom mengikuti PERSIS key payload snake_case yang dikirim
--     frontend, agar backend (Supabase Edge Function "super-service") cukup
--     memetakan 1:1 tanpa transformasi.
--   * Constraint memakai VARCHAR + CHECK (bukan ENUM) agar data lama dari
--     spreadsheet tetap kompatibel dan mudah diubah (ALTER TABLE ... DROP).
--   * "timestamp" dan "no" adalah keyword -- selalu diapit kutip ganda.
--   * Aplikasi ini adalah satu-satunya sumber tulis; skema aman dijalankan
--     berulang (IF NOT EXISTS / ON CONFLICT DO NOTHING).
-- ============================================================================


-- ============================================================================
-- 0. FUNGSI BANTU: updated_at OTOMATIS
-- ============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 1. MENU: PENGUMUMAN  ->  tabel `pengumuman`
--    Sumber: renderPengumuman(), savePengumuman(), showAddPengumumanModal()
--    Aksi API: getPengumuman, addPengumuman, updatePengumuman, deletePengumuman
-- ============================================================================
CREATE TABLE IF NOT EXISTS pengumuman (
  id          VARCHAR(30)  PRIMARY KEY,               -- 'PENG-001' / generateId('PENG')
  tanggal     DATE         NOT NULL DEFAULT CURRENT_DATE,
  judul       VARCHAR(200) NOT NULL,
  isi         TEXT         NOT NULL,
  is_penting  SMALLINT     NOT NULL DEFAULT 0
              CHECK (is_penting IN (0, 1)),           -- 1 = tampil badge PENTING
  created_by  VARCHAR(60)  NOT NULL DEFAULT 'system', -- username pembuat
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- 2. MENU: VERVAL IZIN PRAKTIK (menu 3) + DATA VERVAL IZIN PRAKTIK (menu 7)
--    -> tabel `verval_izin_praktik`
--    Sumber: renderVerval() form 27 field, collectVervalData(),
--            searchVervalByNik(), showVervalIzinPraktikDetail()
--    Aksi API: submitVerval, getAllVerval, getVervalByNik, searchNamaVerval,
--              updateVervalByNik
-- ============================================================================
CREATE TABLE IF NOT EXISTS verval_izin_praktik (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- ---- (a) 25 field yang dikirim formulir verval (collectVervalData) ----
  "timestamp"         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),  -- form kirim string locale id-ID
  nik                 VARCHAR(16)  NOT NULL CHECK (nik ~ '^[0-9]{16}$'),
  nama_lengkap        VARCHAR(150) NOT NULL,
  jenis_kelamin       VARCHAR(12)  CHECK (jenis_kelamin IN ('Laki-laki','Perempuan')),
  tempat_lahir        VARCHAR(100),
  tanggal_lahir       DATE,
  alamat_ktp          TEXT,                                 -- alamat sesuai KTP
  nomor_str           VARCHAR(60)  NOT NULL,
  status_str          VARCHAR(15)  NOT NULL DEFAULT 'Aktif'
                      CHECK (status_str IN ('Aktif','Tidak Aktif','Expired')),
  status_sip          VARCHAR(15)  NOT NULL DEFAULT 'Aktif'
                      CHECK (status_sip IN ('Aktif','Proses','Expired','Tidak Ada')),
  nomor_sip           VARCHAR(60),
  masa_berlaku_sip    DATE,
  unit_kerja          VARCHAR(150) NOT NULL,                -- nama fasyankes tempat praktik
  alamat_unit         TEXT,                                 -- alamat unit kerja
  desa_kelurahan      VARCHAR(100),                         -- desa/kelurahan unit kerja
  status_satu_sehat   VARCHAR(8)   DEFAULT 'Belum'
                      CHECK (status_satu_sehat IN ('Sudah','Belum')), -- status unit di SatuSehat
  sop_pelayanan       VARCHAR(10)  DEFAULT 'Tidak Ada'
                      CHECK (sop_pelayanan IN ('Ada','Tidak Ada')),
  sop_profesi         VARCHAR(10)  DEFAULT 'Tidak Ada'
                      CHECK (sop_profesi IN ('Ada','Tidak Ada')),
  sop_etika           VARCHAR(10)  DEFAULT 'Tidak Ada'
                      CHECK (sop_etika IN ('Ada','Tidak Ada')),
  sdmk_named          VARCHAR(10)  DEFAULT 'Tidak Ada'
                      CHECK (sdmk_named IN ('Ada','Tidak Ada')),
  sdmk_nakes          VARCHAR(10)  DEFAULT 'Tidak Ada'
                      CHECK (sdmk_nakes IN ('Ada','Tidak Ada')),
  sdmk_admin          VARCHAR(10)  DEFAULT 'Tidak Ada'
                      CHECK (sdmk_admin IN ('Ada','Tidak Ada')),
  jam_operasional     VARCHAR(100),                         -- contoh: 'Senin-Jumat 08.00-16.00'
  catatan_rekomendasi TEXT,                                 -- catatan verifikator
  pendidikan_str      VARCHAR(150),                         -- pendidikan sesuai STR
  -- Catatan: 2 field readonly duplikat pada form (v-str-duplicate dan
  -- v-sip-duplicate) TIDAK disimpan karena hanya salinan tampilan dari
  -- nomor_str dan nomor_sip. Total field form tetap 27 sesuai badge UI.

  -- ---- (b) field tambahan yang ditampilkan halaman "Data Verval Izin ----
  -- ----     Praktik" (showVervalIzinPraktikDetail), diisi saat       ----
  -- ----     verifikasi lanjutan / migrasi data sheet                 ----
  nip                 VARCHAR(30),                          -- NIP/NRP pegawai
  jenis_tenaga        VARCHAR(60),
  golongan_pangkat    VARCHAR(40),
  jabatan             VARCHAR(100),
  tanggal_terbit_str  DATE,
  tanggal_berlaku_str DATE,
  tanggal_terbit_sip  DATE,
  tanggal_berlaku_sip DATE,
  alamat_kerja        TEXT,
  kecamatan           VARCHAR(100),
  kabupaten           VARCHAR(100),
  id_satu_sehat       VARCHAR(60),                          -- ID akun SatuSehat
  status_verifikasi   VARCHAR(50),                          -- bebas: 'Sah','Pending','Kadarluasa', dst.
  tanggal_verifikasi  DATE,
  verifikator         VARCHAR(150),
  catatan             TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- Opsi relasi (aktifkan bila data NIK selalu terdaftar di Profil SDMK):
  -- , CONSTRAINT fk_verval_profil FOREIGN KEY (nik) REFERENCES profil_sdmk (nik)
);

-- ============================================================================
-- 3. MENU: VERVAL FASYANKES (menu 4) + DATA VERVAL FASYANKES (menu 5)
--    -> tabel `verval_fasyankes` + child `verval_fasyankes_sdm`
--       + master `sdm_standar_fasyankes`
--    Sumber: renderVervalFasyankes(), submitVervalFasyankesForm(),
--            konstanta SDM_FASYANKES, renderDataVervalFasyankes(),
--            viewVFDetail(), exportVFCSV/PDF
--    Aksi API: submitVervalFasyankes, getAllVervalFasyankes
-- ============================================================================
CREATE TABLE IF NOT EXISTS verval_fasyankes (
  id                 VARCHAR(40)  PRIMARY KEY,   -- auto-generate 'VF-YYYYMMDD-XXXXX'
  tanggal            DATE         NOT NULL DEFAULT CURRENT_DATE,
  nomor_unit         VARCHAR(100) NOT NULL,      -- No. Izin Operasional / UNIT-001
  nama_fasyankes     VARCHAR(200) NOT NULL,
  jenis_fasyankes    VARCHAR(40)  NOT NULL
                     CHECK (jenis_fasyankes IN (
                       'Rumah Sakit','Puskesmas','Klinik','Apotik','Toko Obat',
                       'Optik','PBF (Pedagang Besar Farmasi)',
                       'Tempat Praktik Mandiri')),
  nama_pemilik       VARCHAR(150) NOT NULL,
  penanggung_jawab   VARCHAR(150) NOT NULL,      -- penanggung jawab operasional
  alamat_lengkap     TEXT         NOT NULL,
  kelurahan          VARCHAR(100) NOT NULL,      -- Kelurahan/Desa
  kecamatan          VARCHAR(100) NOT NULL,
  nomor_hp           VARCHAR(20)  NOT NULL,      -- HP / WhatsApp
  email              VARCHAR(150),
  sdm_kesehatan      TEXT,                       -- LEGACY: daftar SDM dipisah '; '
                                                 -- contoh: 'Dokter Umum; Perawat; Bidan'
  status_verifikasi  VARCHAR(20)  NOT NULL
                     CHECK (status_verifikasi IN
                       ('Layak','Tidak Layak','Perbaikan','Pending','Tidak Valid')),
  catatan_verifikasi TEXT,                       -- temuan lapangan & rekomendasi
  verifikator        VARCHAR(150) NOT NULL,      -- nama verifikator Dinkes
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Child tabel (bentuk normal): SDM kesehatan yang terverifikasi per fasyankes.
-- Diisi paralel dengan kolom legacy `sdm_kesehatan` untuk data baru.
CREATE TABLE IF NOT EXISTS verval_fasyankes_sdm (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  verval_id   VARCHAR(40) NOT NULL
              REFERENCES verval_fasyankes (id) ON DELETE CASCADE,
  jenis_sdm   VARCHAR(80) NOT NULL,               -- contoh: 'Dokter Spesialis'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (verval_id, jenis_sdm)
);

-- Master opsi SDM standar per jenis fasyankes (pindahan konstanta
-- SDM_FASYANKES dari frontend, dipakai checkbox dinamis Section 3 form).
CREATE TABLE IF NOT EXISTS sdm_standar_fasyankes (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  jenis_fasyankes VARCHAR(40) NOT NULL,
  jenis_sdm       VARCHAR(80) NOT NULL,
  urutan          SMALLINT    NOT NULL DEFAULT 0,  -- urutan tampil di form
  UNIQUE (jenis_fasyankes, jenis_sdm)
);


-- ============================================================================
-- 4. MENU: PROFIL SDMK (menu 6)  ->  tabel `profil_sdmk`
--    Sumber: renderProfil(), showAddProfilModal(), saveProfil(),
--            editProfilRow(), deleteProfilRow(), seedDemoData()
--    Aksi API: getProfil, addProfil, updateProfil, deleteProfil
--    Kunci utama edit/hapus pada aplikasi = NIK.
-- ============================================================================
CREATE TABLE IF NOT EXISTS profil_sdmk (
  "no"             BIGINT GENERATED BY DEFAULT AS IDENTITY UNIQUE, -- kolom 'No' tabel UI
  nik              VARCHAR(16)  PRIMARY KEY CHECK (nik ~ '^[0-9]{16}$'),
  nama_lengkap     VARCHAR(150) NOT NULL,
  jenis_kelamin    VARCHAR(12)  CHECK (jenis_kelamin IN ('Laki-laki','Perempuan')),
  jenis_tenaga     VARCHAR(60)  NOT NULL,
  -- Nilai umum pada UI: Dokter, Dokter Gigi, Perawat, Bidan, Apoteker,
  --                     Analis Kesehatan, Fisioterapis, Lainnya
  kode_unit        VARCHAR(30),                 -- contoh: 'FK-001'
  nama_unit        VARCHAR(200),                -- contoh: 'RSUD Dr. Soetomo'
  status_pegawai   VARCHAR(10)  CHECK (status_pegawai IN ('PNS','PPNPN','Swasta')),
  nomor_str        VARCHAR(60),
  status_str       VARCHAR(10)  DEFAULT 'Aktif'
                   CHECK (status_str IN ('Aktif','Expired')),
  nomor_sip        VARCHAR(60),
  tgl_terbit_sip   DATE,
  tgl_berakhir_sip DATE,                        -- dipakai filter Status STR & ekspirasi
  keterangan       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- 5. MENU: PANEL ADMIN (menu 8)  ->  tabel `users`, `logs`, `izin`
-- ============================================================================
-- 5a. users -- Manajemen User (tabel user + tombol Tambah/Hapus di Panel Admin)
--     Sumber: resetDataStore(), renderAdmin(), showAddUserModal(),
--             saveNewUser(), deleteUser(), login()
CREATE TABLE IF NOT EXISTS users (
  username   VARCHAR(40)  PRIMARY KEY,
  password   VARCHAR(100) NOT NULL,
  -- PENTING: frontend saat ini menyimpan plaintext (admin123 / operator123).
  -- Untuk production ganti ke hash bcrypt/argon2 dan autentikasi via Edge Function.
  role       VARCHAR(10)  NOT NULL CHECK (role IN ('admin','operator')),
  full_name  VARCHAR(150) NOT NULL,
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 5b. logs -- jejak audit (array `logs` pada dataStore frontend; saat ini
--     belum ditulis aplikasi, tabel disiapkan untuk backend)
CREATE TABLE IF NOT EXISTS logs (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username   VARCHAR(40),
  aksi       VARCHAR(60) NOT NULL,   -- contoh: LOGIN, ADD_PROFIL, SUBMIT_VERVAL
  detail     TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5c. izin -- Pengajuan Izin Praktik (statistik kartu Dashboard & chart Status
--     Izin; store `izin` frontend)
--     Aksi API: getIzin, addIzin, searchByNik
CREATE TABLE IF NOT EXISTS izin (
  id           VARCHAR(30)  PRIMARY KEY,   -- generateId('IZIN') -> 'IZIN-xxxxx'
  nik          VARCHAR(16)  NOT NULL CHECK (nik ~ '^[0-9]{16}$'),
  nama_lengkap VARCHAR(150) NOT NULL,
  jenis_izin   VARCHAR(15)  NOT NULL CHECK (jenis_izin IN ('Baru','Perpanjangan')),
  tgl_usulan   DATE         NOT NULL DEFAULT CURRENT_DATE,
  status       VARCHAR(12)  NOT NULL DEFAULT 'Pending'
               CHECK (status IN ('Pending','Proses','Disetujui','Ditolak')),
  nomor_sip    VARCHAR(60)  DEFAULT '-',
  unit_kerja   VARCHAR(200),
  masa_berlaku VARCHAR(60),                -- teks '2024-01-15 s.d 2027-01-15'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- Opsi relasi:
  -- , CONSTRAINT fk_izin_profil FOREIGN KEY (nik) REFERENCES profil_sdmk (nik)
);

-- ============================================================================
-- 6. INDEKS -- mendukung pencarian & filter pada setiap menu
-- ============================================================================
-- Menu 6: Profil SDMK (filter unit, jenis tenaga, status STR + pencarian)
CREATE INDEX IF NOT EXISTS idx_profil_unit  ON profil_sdmk (nama_unit);
CREATE INDEX IF NOT EXISTS idx_profil_jenis ON profil_sdmk (jenis_tenaga);
CREATE INDEX IF NOT EXISTS idx_profil_str   ON profil_sdmk (status_str);
CREATE INDEX IF NOT EXISTS idx_profil_nama  ON profil_sdmk (nama_lengkap);

-- Menu 3 & 7: Verval Izin Praktik (cari NIK, autocomplete nama, filter SIP)
CREATE INDEX IF NOT EXISTS idx_verval_nik  ON verval_izin_praktik (nik);
CREATE INDEX IF NOT EXISTS idx_verval_nama ON verval_izin_praktik (nama_lengkap);
CREATE INDEX IF NOT EXISTS idx_verval_unit ON verval_izin_praktik (unit_kerja);
CREATE INDEX IF NOT EXISTS idx_verval_sip  ON verval_izin_praktik (status_sip);
CREATE INDEX IF NOT EXISTS idx_verval_tgl  ON verval_izin_praktik ("timestamp" DESC);

-- Menu 5: Data Verval Fasyankes (filter jenis/status/kecamatan + pencarian)
CREATE INDEX IF NOT EXISTS idx_vf_nama       ON verval_fasyankes (nama_fasyankes);
CREATE INDEX IF NOT EXISTS idx_vf_jenis      ON verval_fasyankes (jenis_fasyankes);
CREATE INDEX IF NOT EXISTS idx_vf_status     ON verval_fasyankes (status_verifikasi);
CREATE INDEX IF NOT EXISTS idx_vf_kec        ON verval_fasyankes (kecamatan);
CREATE INDEX IF NOT EXISTS idx_vf_sdm_verval ON verval_fasyankes_sdm (verval_id);
CREATE INDEX IF NOT EXISTS idx_sdm_standar   ON sdm_standar_fasyankes (jenis_fasyankes);

-- Menu 2: Pengumuman (urut tanggal terbaru, pengumuman penting)
CREATE INDEX IF NOT EXISTS idx_pengumuman_tgl     ON pengumuman (tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_pengumuman_penting ON pengumuman (is_penting);

-- Menu 8: Izin (cari NIK + chart status)
CREATE INDEX IF NOT EXISTS idx_izin_nik    ON izin (nik);
CREATE INDEX IF NOT EXISTS idx_izin_status ON izin (status);


-- ============================================================================
-- 7. MENU: DASHBOARD (menu 1)  ->  VIEW agregasi statistik real-time
--    Sumber: loadDashboardData(), initDashboardCharts(), updateDashboardUI()
-- ============================================================================
-- Kartu statistik utama: Total Profil SDMK, Pengajuan Izin, Data Verval,
-- Verval Fasyankes + jumlah pengumuman
CREATE OR REPLACE VIEW v_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM profil_sdmk)                     AS total_profil_sdmk,
  (SELECT COUNT(*) FROM izin)                            AS total_pengajuan_izin,
  (SELECT COUNT(*) FROM izin WHERE status = 'Proses')    AS izin_diproses,
  (SELECT COUNT(*) FROM verval_izin_praktik)             AS total_verval_izin,
  (SELECT COUNT(*) FROM verval_fasyankes)                AS total_verval_fasyankes,
  (SELECT COUNT(*) FROM pengumuman)                      AS total_pengumuman;

-- Panel "Ringkasan Verval Fasyankes" (vf-total, vf-layak, vf-tidak, vf-pending)
-- dan kartu statistik halaman Data Verval Fasyankes
CREATE OR REPLACE VIEW v_vf_summary AS
SELECT
  COUNT(*)                                                                AS total_fasyankes,
  COUNT(*) FILTER (WHERE status_verifikasi = 'Layak')                     AS layak,
  COUNT(*) FILTER (WHERE status_verifikasi IN ('Tidak Layak','Tidak Valid')) AS tidak_layak,
  COUNT(*) FILTER (WHERE status_verifikasi IN ('Perbaikan','Pending'))    AS pending_perbaikan
FROM verval_fasyankes;

-- Grafik 1 "SDMK per Jenis Tenaga" (canvas chart-jenis)
CREATE OR REPLACE VIEW v_sdmk_per_jenis AS
SELECT jenis_tenaga AS label, COUNT(*) AS jumlah
FROM profil_sdmk
GROUP BY jenis_tenaga
ORDER BY jumlah DESC;

-- Grafik 2 "Status Izin Praktik" (canvas chart-status)
CREATE OR REPLACE VIEW v_status_izin AS
SELECT status AS label, COUNT(*) AS jumlah
FROM izin
GROUP BY status
ORDER BY jumlah DESC;

-- Grafik 3 "Distribusi Unit Kerja" (canvas chart-unit)
CREATE OR REPLACE VIEW v_sdmk_per_unit AS
SELECT COALESCE(NULLIF(nama_unit, ''), 'Tidak diketahui') AS label,
       COUNT(*) AS jumlah
FROM profil_sdmk
GROUP BY 1
ORDER BY jumlah DESC;

-- Detail gabungan untuk halaman "Data Verval Izin Praktik" (menu 7, pencarian
-- NIK + kartu detail showVervalIzinPraktikDetail) -- nama kolom mengikuti
-- field yang dibaca frontend.
CREATE OR REPLACE VIEW v_verval_izin_detail AS
SELECT
  v.id,
  v."timestamp",
  v.nik,
  v.nama_lengkap,
  v.jenis_kelamin,
  v.tempat_lahir,
  v.tanggal_lahir,
  v.nip,
  v.jenis_tenaga,
  v.golongan_pangkat,
  v.jabatan,
  v.nomor_str,
  v.tanggal_terbit_str,
  v.tanggal_berlaku_str,
  v.status_str,
  v.nomor_sip,
  v.tanggal_terbit_sip,
  v.tanggal_berlaku_sip,
  v.status_sip,
  v.unit_kerja,
  v.alamat_unit                 AS alamat_kerja,
  v.kecamatan,
  v.kabupaten,
  v.id_satu_sehat,
  v.status_satu_sehat,
  v.status_verifikasi,
  v.tanggal_verifikasi,
  v.verifikator,
  COALESCE(v.catatan, v.catatan_rekomendasi) AS catatan,
  v.masa_berlaku_sip,
  v.jam_operasional,
  v.created_at
FROM verval_izin_praktik v;

-- Record verval TERBARU per NIK (dipakai aksi API getVervalByNik yang
-- mengembalikan `latest`):
CREATE OR REPLACE VIEW v_verval_izin_latest AS
SELECT DISTINCT ON (nik)
  *
FROM verval_izin_praktik
ORDER BY nik, "timestamp" DESC, id DESC;


-- ============================================================================
-- 8. TRIGGER updated_at OTOMATIS (PostgreSQL 14+ / Supabase PG15 -- aman)
-- ============================================================================
CREATE OR REPLACE TRIGGER trg_pengumuman_updated
  BEFORE UPDATE ON pengumuman          FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_verval_updated
  BEFORE UPDATE ON verval_izin_praktik FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_vf_updated
  BEFORE UPDATE ON verval_fasyankes    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_profil_updated
  BEFORE UPDATE ON profil_sdmk         FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_users_updated
  BEFORE UPDATE ON users               FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_izin_updated
  BEFORE UPDATE ON izin                FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- 9. ROW LEVEL SECURITY (Supabase)
-- ----------------------------------------------------------------------------
-- Frontend TIDAK mengakses tabel secara langsung; semua request melewati
-- Edge Function "super-service" (GAS_WEB_APP_URL). Pilih salah satu opsi:
--
-- OPSI A -- REKOMENDASI (default-deny):
--   Cukup ENABLE RLS tanpa policy. Edge Function yang memakai service_role
--   tetap lolos, sedangkan anon key tidak bisa baca/tulis langsung.
--
-- OPSI B -- akses langsung dari klien dengan anon key (HANYA untuk
--   pengembangan; HAPUS sebelum production):
--   aktifkan contoh policy di bawah untuk setiap tabel.
-- ============================================================================
ALTER TABLE pengumuman            ENABLE ROW LEVEL SECURITY;
ALTER TABLE verval_izin_praktik   ENABLE ROW LEVEL SECURITY;
ALTER TABLE verval_fasyankes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE verval_fasyankes_sdm  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdm_standar_fasyankes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profil_sdmk           ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE izin                  ENABLE ROW LEVEL SECURITY;

-- Contoh OPSI B (ulangi per tabel; JANGAN dipakai di production):
-- CREATE POLICY "dev_full_access_pengumuman" ON pengumuman
--   FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);


-- ============================================================================
-- 10. DATA AWAL (SEED)
-- ============================================================================
-- 10a. User default -- sama dengan resetDataStore() pada frontend.
--      Segera ganti password setelah login pertama!
INSERT INTO users (username, password, role, full_name) VALUES
  ('admin',    'admin123',    'admin',    'Administrator SIMANTRI'),
  ('operator', 'operator123', 'operator', 'Operator Verval')
ON CONFLICT (username) DO NOTHING;

-- 10b. Master SDM standar per jenis fasyankes -- pindahan konstanta
--      SDM_FASYANKES pada frontend (checkbox dinamis form Verval Fasyankes)
INSERT INTO sdm_standar_fasyankes (jenis_fasyankes, jenis_sdm, urutan) VALUES
  -- Rumah Sakit (14)
  ('Rumah Sakit','Dokter Spesialis', 1),
  ('Rumah Sakit','Dokter Umum', 2),
  ('Rumah Sakit','Perawat', 3),
  ('Rumah Sakit','Bidan', 4),
  ('Rumah Sakit','Ahli Gizi', 5),
  ('Rumah Sakit','Farmapis', 6),
  ('Rumah Sakit','Radiografer', 7),
  ('Rumah Sakit','Laboran', 8),
  ('Rumah Sakit','Fisioterapis', 9),
  ('Rumah Sakit','Elektromedik', 10),
  ('Rumah Sakit','Sanitarian', 11),
  ('Rumah Sakit','Rekam Medis', 12),
  ('Rumah Sakit','Nutritionist', 13),
  ('Rumah Sakit','OK Assistant', 14),
  -- Puskesmas (9)
  ('Puskesmas','Dokter Umum', 1),
  ('Puskesmas','Perawat', 2),
  ('Puskesmas','Bidan', 3),
  ('Puskesmas','Ahli Gizi', 4),
  ('Puskesmas','Sanitarian', 5),
  ('Puskesmas','Epidemiolog', 6),
  ('Puskesmas','Promosi Kesehatan', 7),
  ('Puskesmas','Entomologist', 8),
  ('Puskesmas','Admin Kesehatan', 9),
  -- Klinik (7)
  ('Klinik','Dokter Umum', 1),
  ('Klinik','Dokter Gigi', 2),
  ('Klinik','Perawat', 3),
  ('Klinik','Bidan', 4),
  ('Klinik','Asisten Apoteker', 5),
  ('Klinik','Ahli Gizi', 6),
  ('Klinik','Fisioterapis', 7),
  -- Apotik (3)
  ('Apotik','Apoteker', 1),
  ('Apotik','Asisten Apoteker', 2),
  ('Apotik','Teknis Kefarmasian', 3),
  -- Toko Obat (2)
  ('Toko Obat','Asisten Apoteker', 1),
  ('Toko Obat','Tenaga Teknis Kefarmasian', 2),
  -- Optik (3)
  ('Optik','Optometris', 1),
  ('Optik','Optisian', 2),
  ('Optik','Tenaga Teknis Optisi', 3),
  -- PBF (4)
  ('PBF (Pedagang Besar Farmasi)','Apoteker', 1),
  ('PBF (Pedagang Besar Farmasi)','Staff Penjualan', 2),
  ('PBF (Pedagang Besar Farmasi)','Quality Control', 3),
  ('PBF (Pedagang Besar Farmasi)','Gudang Farmasi', 4),
  -- Tempat Praktik Mandiri (8)
  ('Tempat Praktik Mandiri','Dokter Spesialis', 1),
  ('Tempat Praktik Mandiri','Dokter Umum', 2),
  ('Tempat Praktik Mandiri','Dokter Gigi', 3),
  ('Tempat Praktik Mandiri','Bidan', 4),
  ('Tempat Praktik Mandiri','Perawat', 5),
  ('Tempat Praktik Mandiri','Psikolog', 6),
  ('Tempat Praktik Mandiri','Fisioterapis', 7),
  ('Tempat Praktik Mandiri','Akupunturis', 8)
ON CONFLICT (jenis_fasyankes, jenis_sdm) DO NOTHING;

-- 10c. Contoh data demo (opsional -- hapus komentar bila diperlukan):
--
-- INSERT INTO pengumuman (id, tanggal, judul, isi, is_penting, created_by) VALUES
--   ('PENG-001', '2025-05-01', 'Pembaruan Sistem SIMANTRI v1.2',
--    'Mulai 1 Juni 2025 seluruh pengajuan izin praktik wajib menggunakan formulir digital baru.',
--    1, 'admin'),
--   ('PENG-002', '2025-04-20', 'Jadwal Verval Triwulan II',
--    'Verval izin praktik periode April-Juni dilaksanakan secara bertahap.',
--    0, 'admin')
-- ON CONFLICT (id) DO NOTHING;
--
-- INSERT INTO profil_sdmk
--   (nik, nama_lengkap, jenis_kelamin, jenis_tenaga, kode_unit, nama_unit,
--    status_pegawai, nomor_str, status_str, nomor_sip, tgl_terbit_sip,
--    tgl_berakhir_sip, keterangan)
-- VALUES
--   ('3275012345678901', 'dr. Andi Wijaya, Sp.PD', 'Laki-laki', 'Dokter',
--    'FK-001', 'RSUD Dr. Soetomo', 'PNS', 'STR.12345.2023', 'Aktif',
--    'SIP/2024/001234', '2024-01-15', '2027-01-15', 'Spesialis Penyakit Dalam'),
--   ('3275023456789012', 'drg. Siti Rahayu', 'Perempuan', 'Dokter Gigi',
--    'FK-002', 'Klinik Sehat Buah', 'Swasta', 'STR.23456.2022', 'Aktif',
--    'SIP/2024/002345', '2024-03-20', '2026-03-20', NULL)
-- ON CONFLICT (nik) DO NOTHING;
