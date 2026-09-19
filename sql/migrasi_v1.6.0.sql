-- =========================================================
-- SIMANTRI — MIGRASI PERBAIKAN KE STRUKTUR v1.6.0
-- ---------------------------------------------------------
-- UNTUK APA?
--   Database Supabase yang SUDAH BERJALAN dari versi lama,
--   atau yang PERNAH BERUBAH (tabel/kolom terhapus, dibuat
--   manual, atau tidak sinkron dengan aplikasi). Script ini
--   MEMERIKSA & MENYELARASKAN seluruh struktur database ke
--   bentuk yang dibutuhkan aplikasi SIMANTRI v1.6.0:
--     • tabel hilang          → dibuat utuh
--     • kolom hilang          → ditambahkan
--     • fungsi/trigger/policy → dibuat ulang
--     • ATURAN AKSES BARU v1.6.0: Bagian 3 — Perizinan wajib
--       login & hanya Admin + Operator (policy verval & monev
--       memakai can_input; is_verifikator dipertahankan utk
--       kompatibilitas tapi tidak lagi dipakai policy)
--   SELURUH DATA LAMA DIJAGA — tidak ada drop/delete data.
--
-- CARA PAKAI:
--   1. Buka Supabase Dashboard → SQL Editor → New query
--   2. Salin SELURUH isi file ini → klik Run
--   3. Selesai. Aplikasi langsung dapat dipakai.
--
-- Script IDEMPOTENT: aman dijalankan berulang kali, pada
-- database kosong maupun yang sudah berisi data.
-- =========================================================

-- =========================================================
-- 1. TABEL PROFILES + FUNGSI BANTU (fondasi RLS)
-- =========================================================

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text        not null,
  nama       text        not null default '',
  role       text        not null default 'operator'
             check (role in ('admin', 'verifikator', 'operator')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tambahkan kolom yang mungkin hilang pada database lama
alter table public.profiles add column if not exists email      text;
alter table public.profiles add column if not exists nama       text not null default '';
alter table public.profiles add column if not exists role       text not null default 'operator';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((select role from public.profiles where id = auth.uid()) = 'admin', false)
$$;

-- dipertahankan utk kompatibilitas role lama; sejak v1.6.0
-- policy verval memakai can_input (admin + operator)
create or replace function public.is_verifikator()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((select role from public.profiles where id = auth.uid()) in ('admin', 'verifikator'), false)
$$;

create or replace function public.can_input()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((select role from public.profiles where id = auth.uid()) in ('admin', 'operator'), false)
$$;

-- =========================================================
-- 2. TABEL TENAGA MEDIS & TENAGA KESEHATAN
--    (Menu: Panel Admin → Tenaga Medis / Tenaga Kesehatan;
--     dibaca publik oleh Dashboard, Peta, Expired, Cek Verifikasi)
-- =========================================================

create table if not exists public.tenaga_medis (
  id               bigint generated always as identity primary key,
  nik              varchar(16),
  nama_lengkap     text        not null,
  no_str           text,
  no_sip           text,
  spesialisasi     text,
  tempat_praktik   text,
  masa_berlaku_sip date,
  status           text        not null default 'aktif'
                   check (status in ('aktif', 'nonaktif')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.tenaga_medis add column if not exists nik              varchar(16);
alter table public.tenaga_medis add column if not exists nama_lengkap     text;
alter table public.tenaga_medis add column if not exists no_str           text;
alter table public.tenaga_medis add column if not exists no_sip           text;
alter table public.tenaga_medis add column if not exists spesialisasi     text;
alter table public.tenaga_medis add column if not exists tempat_praktik   text;
alter table public.tenaga_medis add column if not exists masa_berlaku_sip date;
alter table public.tenaga_medis add column if not exists status           text not null default 'aktif';
alter table public.tenaga_medis add column if not exists created_at       timestamptz not null default now();
alter table public.tenaga_medis add column if not exists updated_at       timestamptz not null default now();

create table if not exists public.tenaga_kesehatan (
  id               bigint generated always as identity primary key,
  nik              varchar(16),
  nama_lengkap     text        not null,
  no_str           text,
  no_sip           text,
  profesi          text        not null
                   check (profesi in (
                     'Perawat', 'Bidan', 'Apoteker', 'Asisten Apoteker',
                     'Ahli Gizi', 'Nutrisionis', 'Fisioterapis',
                     'Tenaga Teknis Kefarmasian',
                     'Teknologi Laboratorium Medik (ATLM)',
                     'Teknisi Radiologi', 'Sanitarian', 'Lainnya')),
  tempat_praktik   text,
  masa_berlaku_sip date,
  status           text        not null default 'aktif'
                   check (status in ('aktif', 'nonaktif')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.tenaga_kesehatan add column if not exists nik              varchar(16);
alter table public.tenaga_kesehatan add column if not exists nama_lengkap     text;
alter table public.tenaga_kesehatan add column if not exists no_str           text;
alter table public.tenaga_kesehatan add column if not exists no_sip           text;
alter table public.tenaga_kesehatan add column if not exists profesi          text;
alter table public.tenaga_kesehatan add column if not exists tempat_praktik   text;
alter table public.tenaga_kesehatan add column if not exists masa_berlaku_sip date;
alter table public.tenaga_kesehatan add column if not exists status           text not null default 'aktif';
alter table public.tenaga_kesehatan add column if not exists created_at       timestamptz not null default now();
alter table public.tenaga_kesehatan add column if not exists updated_at       timestamptz not null default now();

-- =========================================================
-- 3. TABEL FASYANKES & PRAKTIK MANDIRI
--    (Menu: Bagian 2 → Data Fasyankes / Data Praktik Mandiri;
--     Bagian 3 → tab Pengajuan; publik: Dashboard/Peta/Cek)
-- =========================================================

create table if not exists public.fasyankes (
  id                 bigint generated always as identity primary key,
  nama_fasyankes     text not null,
  jenis              text not null
                     check (jenis in ('RS', 'Puskesmas', 'Klinik', 'Lainnya')),
  alamat             text,
  kecamatan          text,
  latitude           numeric(10, 7),
  longitude          numeric(10, 7),
  status_verifikasi  text not null default 'pending'
                     check (status_verifikasi in ('pending', 'disetujui', 'ditolak')),
  catatan_verifikasi text,
  verified_by        text,
  verified_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.fasyankes add column if not exists nama_fasyankes     text;
alter table public.fasyankes add column if not exists jenis              text;
alter table public.fasyankes add column if not exists alamat             text;
alter table public.fasyankes add column if not exists kecamatan          text;
alter table public.fasyankes add column if not exists latitude           numeric(10, 7);
alter table public.fasyankes add column if not exists longitude          numeric(10, 7);
alter table public.fasyankes add column if not exists status_verifikasi  text not null default 'pending';
alter table public.fasyankes add column if not exists catatan_verifikasi text;
alter table public.fasyankes add column if not exists verified_by        text;
alter table public.fasyankes add column if not exists verified_at        timestamptz;
alter table public.fasyankes add column if not exists created_at         timestamptz not null default now();
alter table public.fasyankes add column if not exists updated_at         timestamptz not null default now();

create table if not exists public.praktik_mandiri (
  id                 bigint generated always as identity primary key,
  nama_praktik       text not null,
  pemilik            text not null,
  alamat             text,
  jenis_praktik      text not null
                     check (jenis_praktik in (
                       'Praktik Dokter', 'Praktik Dokter Gigi', 'Praktik Bidan',
                       'Praktik Perawat', 'Praktik Fisioterapi', 'Lainnya')),
  kecamatan          text,
  latitude           numeric(10, 7),
  longitude          numeric(10, 7),
  status_verifikasi  text not null default 'pending'
                     check (status_verifikasi in ('pending', 'disetujui', 'ditolak')),
  catatan_verifikasi text,
  verified_by        text,
  verified_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.praktik_mandiri add column if not exists nama_praktik       text;
alter table public.praktik_mandiri add column if not exists pemilik            text;
alter table public.praktik_mandiri add column if not exists alamat             text;
alter table public.praktik_mandiri add column if not exists jenis_praktik      text;
alter table public.praktik_mandiri add column if not exists kecamatan          text;
alter table public.praktik_mandiri add column if not exists latitude           numeric(10, 7);
alter table public.praktik_mandiri add column if not exists longitude          numeric(10, 7);
alter table public.praktik_mandiri add column if not exists status_verifikasi  text not null default 'pending';
alter table public.praktik_mandiri add column if not exists catatan_verifikasi text;
alter table public.praktik_mandiri add column if not exists verified_by        text;
alter table public.praktik_mandiri add column if not exists verified_at        timestamptz;
alter table public.praktik_mandiri add column if not exists created_at         timestamptz not null default now();
alter table public.praktik_mandiri add column if not exists updated_at         timestamptz not null default now();

-- =========================================================
-- 4. TABEL MONEV IZIN (Menu: Bagian 3 → Monev Izin)
-- =========================================================

create table if not exists public.monev_izin (
  id                bigint generated always as identity primary key,
  tanggal_kunjungan date        not null default current_date,
  sasaran_jenis     text        not null
                    check (sasaran_jenis in ('Fasyankes', 'Praktik Mandiri')),
  sasaran_nama      text        not null,
  petugas           text,
  temuan            text,
  tindak_lanjut     text,
  foto_url          text,
  created_by        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.monev_izin add column if not exists tanggal_kunjungan date not null default current_date;
alter table public.monev_izin add column if not exists sasaran_jenis     text;
alter table public.monev_izin add column if not exists sasaran_nama      text;
alter table public.monev_izin add column if not exists petugas           text;
alter table public.monev_izin add column if not exists temuan            text;
alter table public.monev_izin add column if not exists tindak_lanjut     text;
alter table public.monev_izin add column if not exists foto_url          text;
alter table public.monev_izin add column if not exists created_by        text;
alter table public.monev_izin add column if not exists created_at        timestamptz not null default now();
alter table public.monev_izin add column if not exists updated_at        timestamptz not null default now();

-- =========================================================
-- 5. TABEL VERVAL IZIN PRAKTIK
--    (Menu: Bagian 3 → Verifikasi Praktik; Panel Admin →
--     Verval Praktik / Cek Verifikasi)
-- =========================================================

create table if not exists public.verval_izin_praktik (
  id                 bigint generated always as identity primary key,
  nik                varchar(16),
  nama_lengkap       text        not null,
  jenis_kelamin      text check (jenis_kelamin in ('Laki-laki', 'Perempuan')),
  tempat_lahir       text,
  tanggal_lahir      date,
  alamat_ktp         text,
  nomor_str          text        not null,
  status_str         text check (status_str in ('Aktif', 'Tidak Aktif', 'Expired')),
  status_sip         text check (status_sip in ('Aktif', 'Proses', 'Expired', 'Tidak Ada')),
  nomor_sip          text,
  masa_berlaku_sip   date,
  unit_kerja         text        not null,
  alamat_unit        text,
  desa_kelurahan     text,
  kecamatan          text,
  status_satu_sehat  text check (status_satu_sehat in ('Sudah', 'Belum')),
  sop_pelayanan      text check (sop_pelayanan in ('Ada', 'Tidak Ada')),
  sop_profesi        text check (sop_profesi in ('Ada', 'Tidak Ada')),
  sop_etika          text check (sop_etika in ('Ada', 'Tidak Ada')),
  sdmk_named         text check (sdmk_named in ('Ada', 'Tidak Ada')),
  sdmk_nakes         text check (sdmk_nakes in ('Ada', 'Tidak Ada')),
  sdmk_admin         text check (sdmk_admin in ('Ada', 'Tidak Ada')),
  jam_operasional    text,
  catatan_rekomendasi text,
  pendidikan_str     text,
  kode_verifikasi    text unique,
  verifikator        text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.verval_izin_praktik add column if not exists nik                 varchar(16);
alter table public.verval_izin_praktik add column if not exists nama_lengkap        text;
alter table public.verval_izin_praktik add column if not exists jenis_kelamin       text;
alter table public.verval_izin_praktik add column if not exists tempat_lahir        text;
alter table public.verval_izin_praktik add column if not exists tanggal_lahir       date;
alter table public.verval_izin_praktik add column if not exists alamat_ktp          text;
alter table public.verval_izin_praktik add column if not exists nomor_str           text;
alter table public.verval_izin_praktik add column if not exists status_str          text;
alter table public.verval_izin_praktik add column if not exists status_sip          text;
alter table public.verval_izin_praktik add column if not exists nomor_sip           text;
alter table public.verval_izin_praktik add column if not exists masa_berlaku_sip    date;
alter table public.verval_izin_praktik add column if not exists unit_kerja          text;
alter table public.verval_izin_praktik add column if not exists alamat_unit         text;
alter table public.verval_izin_praktik add column if not exists desa_kelurahan      text;
alter table public.verval_izin_praktik add column if not exists kecamatan           text;
alter table public.verval_izin_praktik add column if not exists status_satu_sehat   text;
alter table public.verval_izin_praktik add column if not exists sop_pelayanan       text;
alter table public.verval_izin_praktik add column if not exists sop_profesi         text;
alter table public.verval_izin_praktik add column if not exists sop_etika           text;
alter table public.verval_izin_praktik add column if not exists sdmk_named          text;
alter table public.verval_izin_praktik add column if not exists sdmk_nakes          text;
alter table public.verval_izin_praktik add column if not exists sdmk_admin          text;
alter table public.verval_izin_praktik add column if not exists jam_operasional     text;
alter table public.verval_izin_praktik add column if not exists catatan_rekomendasi text;
alter table public.verval_izin_praktik add column if not exists pendidikan_str      text;
alter table public.verval_izin_praktik add column if not exists kode_verifikasi     text;
alter table public.verval_izin_praktik add column if not exists verifikator         text;
alter table public.verval_izin_praktik add column if not exists created_at          timestamptz not null default now();
alter table public.verval_izin_praktik add column if not exists updated_at          timestamptz not null default now();

-- =========================================================
-- 6. TABEL VERVAL DRAFT (draf otomatis multi-form praktik/faskes)
-- =========================================================

create table if not exists public.verval_draft (
  user_id    uuid not null references auth.users (id) on delete cascade,
  form       text not null default 'praktik',
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, form)
);

alter table public.verval_draft add column if not exists form       text not null default 'praktik';
alter table public.verval_draft add column if not exists data       jsonb not null default '{}'::jsonb;
alter table public.verval_draft add column if not exists updated_at timestamptz not null default now();

-- Pastikan PK komposit (user_id, form) ada (database lama
-- memakai PK tunggal user_id)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'verval_draft_form_pkey') then
    alter table public.verval_draft drop constraint if exists verval_draft_pkey;
    alter table public.verval_draft add constraint verval_draft_form_pkey primary key (user_id, form);
  end if;
end $$;

-- =========================================================
-- 7. TABEL VERVAL FASYANKES (Menu: Bagian 3 → Verifikasi Faskes)
-- =========================================================

create table if not exists public.verval_fasyankes (
  id                 bigint generated always as identity primary key,
  kode_verval        text unique,
  tanggal_verval     date        not null default current_date,
  nomor_unit         text        not null,
  nama_fasyankes     text        not null,
  jenis_fasyankes    text        not null
                     check (jenis_fasyankes in (
                       'Rumah Sakit', 'Puskesmas', 'Klinik', 'Apotik', 'Toko Obat',
                       'Optik', 'PBF (Pedagang Besar Farmasi)', 'Tempat Praktik Mandiri')),
  nama_pemilik       text        not null,
  penanggung_jawab   text        not null,
  alamat_lengkap     text        not null,
  kelurahan          text        not null,
  kecamatan          text        not null,
  nomor_hp           text        not null,
  email              text,
  sdm_kesehatan      text,
  status_verifikasi  text not null default 'Pending'
                     check (status_verifikasi in ('Layak', 'Tidak Layak', 'Perbaikan', 'Pending', 'Tidak Valid')),
  catatan_verifikasi text,
  verifikator        text        not null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.verval_fasyankes add column if not exists kode_verval        text;
alter table public.verval_fasyankes add column if not exists tanggal_verval     date not null default current_date;
alter table public.verval_fasyankes add column if not exists nomor_unit         text;
alter table public.verval_fasyankes add column if not exists nama_fasyankes     text;
alter table public.verval_fasyankes add column if not exists jenis_fasyankes    text;
alter table public.verval_fasyankes add column if not exists nama_pemilik       text;
alter table public.verval_fasyankes add column if not exists penanggung_jawab   text;
alter table public.verval_fasyankes add column if not exists alamat_lengkap     text;
alter table public.verval_fasyankes add column if not exists kelurahan          text;
alter table public.verval_fasyankes add column if not exists kecamatan          text;
alter table public.verval_fasyankes add column if not exists nomor_hp           text;
alter table public.verval_fasyankes add column if not exists email              text;
alter table public.verval_fasyankes add column if not exists sdm_kesehatan      text;
alter table public.verval_fasyankes add column if not exists status_verifikasi  text not null default 'Pending';
alter table public.verval_fasyankes add column if not exists catatan_verifikasi text;
alter table public.verval_fasyankes add column if not exists verifikator        text;
alter table public.verval_fasyankes add column if not exists created_at         timestamptz not null default now();
alter table public.verval_fasyankes add column if not exists updated_at         timestamptz not null default now();

-- =========================================================
-- 8. NIK TIDAK LAGI WAJIB (sejak v1.2.1; kolom dipertahankan
--    hanya agar data lama tidak hilang)
-- =========================================================

alter table public.tenaga_medis        alter column nik drop not null;
alter table public.tenaga_kesehatan    alter column nik drop not null;
alter table public.verval_izin_praktik alter column nik drop not null;

-- =========================================================
-- 9. TRIGGER updated_at (semua tabel)
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles', 'tenaga_medis', 'tenaga_kesehatan',
                           'fasyankes', 'praktik_mandiri', 'monev_izin',
                           'verval_izin_praktik', 'verval_draft', 'verval_fasyankes']
  loop
    execute format('drop trigger if exists trg_updated_at on public.%I', t);
    execute format('create trigger trg_updated_at before update on public.%I
                    for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- Trigger profil otomatis saat user baru mendaftar
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, nama, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'nama', split_part(coalesce(new.email, 'pengguna'), '@', 1)),
    'operator'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- 10. INDEX
-- =========================================================

create index if not exists idx_tm_nik        on public.tenaga_medis (nik);
create index if not exists idx_tm_nama       on public.tenaga_medis (nama_lengkap);
create index if not exists idx_tm_masa_sip   on public.tenaga_medis (masa_berlaku_sip);
create index if not exists idx_tk_nik        on public.tenaga_kesehatan (nik);
create index if not exists idx_tk_nama       on public.tenaga_kesehatan (nama_lengkap);
create index if not exists idx_tk_masa_sip   on public.tenaga_kesehatan (masa_berlaku_sip);
create index if not exists idx_fas_kecamatan on public.fasyankes (kecamatan);
create index if not exists idx_fas_status    on public.fasyankes (status_verifikasi);
create index if not exists idx_prak_kecamatan on public.praktik_mandiri (kecamatan);
create index if not exists idx_prak_status   on public.praktik_mandiri (status_verifikasi);
create index if not exists idx_monev_tanggal on public.monev_izin (tanggal_kunjungan);
create index if not exists idx_verval_nik on public.verval_izin_praktik (nik);
create index if not exists idx_verval_nama on public.verval_izin_praktik (nama_lengkap);
create index if not exists idx_verval_unit on public.verval_izin_praktik (unit_kerja);
create index if not exists idx_vervalfas_nama      on public.verval_fasyankes (nama_fasyankes);
create index if not exists idx_vervalfas_status    on public.verval_fasyankes (status_verifikasi);
create index if not exists idx_vervalfas_kecamatan on public.verval_fasyankes (kecamatan);

-- =========================================================
-- 11. ROW LEVEL SECURITY (identik dengan schema.sql v1.6.0)
--     Bagian 3 — Perizinan: insert/update verval & monev
--     hanya Admin + Operator (can_input); select tetap publik
--     utk Cek Hasil Verifikasi (Bagian 1).
-- =========================================================

alter table public.profiles            enable row level security;
alter table public.tenaga_medis        enable row level security;
alter table public.tenaga_kesehatan    enable row level security;
alter table public.fasyankes           enable row level security;
alter table public.praktik_mandiri     enable row level security;
alter table public.monev_izin          enable row level security;
alter table public.verval_izin_praktik enable row level security;
alter table public.verval_draft        enable row level security;
alter table public.verval_fasyankes    enable row level security;

-- ---------- profiles ----------
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_admin" on public.profiles;
create policy "profiles_insert_admin"
  on public.profiles for insert
  with check (public.is_admin());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.get_my_role());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  using (public.is_admin());

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin"
  on public.profiles for delete
  using (public.is_admin());

-- ---------- tenaga_medis ----------
drop policy if exists "tm_select" on public.tenaga_medis;
create policy "tm_select" on public.tenaga_medis for select using (true);

drop policy if exists "tm_insert" on public.tenaga_medis;
create policy "tm_insert" on public.tenaga_medis for insert
  with check (auth.uid() is not null and public.can_input());

drop policy if exists "tm_update" on public.tenaga_medis;
create policy "tm_update" on public.tenaga_medis for update
  using (auth.uid() is not null and (public.can_input() or public.is_verifikator()));

drop policy if exists "tm_delete" on public.tenaga_medis;
create policy "tm_delete" on public.tenaga_medis for delete
  using (public.is_admin());

-- ---------- tenaga_kesehatan ----------
drop policy if exists "tk_select" on public.tenaga_kesehatan;
create policy "tk_select" on public.tenaga_kesehatan for select using (true);

drop policy if exists "tk_insert" on public.tenaga_kesehatan;
create policy "tk_insert" on public.tenaga_kesehatan for insert
  with check (auth.uid() is not null and public.can_input());

drop policy if exists "tk_update" on public.tenaga_kesehatan;
create policy "tk_update" on public.tenaga_kesehatan for update
  using (auth.uid() is not null and (public.can_input() or public.is_verifikator()));

drop policy if exists "tk_delete" on public.tenaga_kesehatan;
create policy "tk_delete" on public.tenaga_kesehatan for delete
  using (public.is_admin());

-- ---------- fasyankes ----------
drop policy if exists "fas_select" on public.fasyankes;
create policy "fas_select" on public.fasyankes for select using (true);

drop policy if exists "fas_insert" on public.fasyankes;
create policy "fas_insert" on public.fasyankes for insert
  with check (auth.uid() is not null and public.can_input());

drop policy if exists "fas_update" on public.fasyankes;
create policy "fas_update" on public.fasyankes for update
  using (auth.uid() is not null and (public.can_input() or public.is_verifikator()));

drop policy if exists "fas_delete" on public.fasyankes;
create policy "fas_delete" on public.fasyankes for delete
  using (public.is_admin());

-- ---------- praktik_mandiri ----------
drop policy if exists "prak_select" on public.praktik_mandiri;
create policy "prak_select" on public.praktik_mandiri for select using (true);

drop policy if exists "prak_insert" on public.praktik_mandiri;
create policy "prak_insert" on public.praktik_mandiri for insert
  with check (auth.uid() is not null and public.can_input());

drop policy if exists "prak_update" on public.praktik_mandiri;
create policy "prak_update" on public.praktik_mandiri for update
  using (auth.uid() is not null and (public.can_input() or public.is_verifikator()));

drop policy if exists "prak_delete" on public.praktik_mandiri;
create policy "prak_delete" on public.praktik_mandiri for delete
  using (public.is_admin());

-- ---------- monev_izin (Bagian 3 — hanya Admin/Operator) ----------
drop policy if exists "monev_select" on public.monev_izin;
create policy "monev_select" on public.monev_izin for select using (true);

drop policy if exists "monev_insert" on public.monev_izin;
create policy "monev_insert" on public.monev_izin for insert
  with check (auth.uid() is not null and public.can_input());

drop policy if exists "monev_update" on public.monev_izin;
create policy "monev_update" on public.monev_izin for update
  using (auth.uid() is not null and public.can_input());

drop policy if exists "monev_delete" on public.monev_izin;
create policy "monev_delete" on public.monev_izin for delete
  using (public.is_admin());

-- ---------- verval_izin_praktik (Bagian 3 — hanya Admin/Operator) ----------
drop policy if exists "verval_select" on public.verval_izin_praktik;
create policy "verval_select" on public.verval_izin_praktik for select using (true);

drop policy if exists "verval_insert" on public.verval_izin_praktik;
create policy "verval_insert" on public.verval_izin_praktik for insert
  with check (auth.uid() is not null and public.can_input());

drop policy if exists "verval_update" on public.verval_izin_praktik;
create policy "verval_update" on public.verval_izin_praktik for update
  using (auth.uid() is not null and public.can_input());

drop policy if exists "verval_delete" on public.verval_izin_praktik;
create policy "verval_delete" on public.verval_izin_praktik for delete
  using (public.is_admin());

-- ---------- verval_draft ----------
drop policy if exists "verval_draft_select" on public.verval_draft;
create policy "verval_draft_select" on public.verval_draft for select
  using (user_id = auth.uid());

drop policy if exists "verval_draft_insert" on public.verval_draft;
create policy "verval_draft_insert" on public.verval_draft for insert
  with check (user_id = auth.uid());

drop policy if exists "verval_draft_update" on public.verval_draft;
create policy "verval_draft_update" on public.verval_draft for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "verval_draft_delete" on public.verval_draft;
create policy "verval_draft_delete" on public.verval_draft for delete
  using (user_id = auth.uid());

-- ---------- verval_fasyankes (Bagian 3 — hanya Admin/Operator) ----------
drop policy if exists "vervalfas_select" on public.verval_fasyankes;
create policy "vervalfas_select" on public.verval_fasyankes for select using (true);

drop policy if exists "vervalfas_insert" on public.verval_fasyankes;
create policy "vervalfas_insert" on public.verval_fasyankes for insert
  with check (auth.uid() is not null and public.can_input());

drop policy if exists "vervalfas_update" on public.verval_fasyankes;
create policy "vervalfas_update" on public.verval_fasyankes for update
  using (auth.uid() is not null and public.can_input());

drop policy if exists "vervalfas_delete" on public.verval_fasyankes;
create policy "vervalfas_delete" on public.verval_fasyankes for delete
  using (public.is_admin());

-- =========================================================
-- 12. STORAGE BUCKET "monev"
-- =========================================================

insert into storage.buckets (id, name, public)
values ('monev', 'monev', true)
on conflict (id) do update set public = true;

drop policy if exists "monev_storage_read" on storage.objects;
create policy "monev_storage_read"
  on storage.objects for select
  using (bucket_id = 'monev');

drop policy if exists "monev_storage_insert" on storage.objects;
create policy "monev_storage_insert"
  on storage.objects for insert
  with check (bucket_id = 'monev' and auth.uid() is not null);

drop policy if exists "monev_storage_update" on storage.objects;
create policy "monev_storage_update"
  on storage.objects for update
  using (bucket_id = 'monev' and auth.uid() is not null);

drop policy if exists "monev_storage_delete" on storage.objects;
create policy "monev_storage_delete"
  on storage.objects for delete
  using (bucket_id = 'monev' and (auth.uid() is not null or public.is_admin()));

-- =========================================================
-- 13. VERIFIKASI HASIL MIGRASI (opsional, hanya membaca)
--     Jalankan blok SELECT di bawah bila ingin memastikan
--     seluruh struktur sudah lengkap. Output diharapkan 9 baris
--     dengan status OK.
-- =========================================================

-- select t.nama, c.jumlah_kolom,
--        case when c.jumlah_kolom >= 5 then 'OK' else 'PERIKSA' end as status
-- from (values ('profiles'), ('tenaga_medis'), ('tenaga_kesehatan'),
--              ('fasyankes'), ('praktik_mandiri'), ('monev_izin'),
--              ('verval_izin_praktik'), ('verval_draft'),
--              ('verval_fasyankes')) as t(nama)
-- left join (
--   select table_name, count(*) as jumlah_kolom
--   from information_schema.columns
--   where table_schema = 'public'
--   group by table_name
-- ) c on c.table_name = t.nama;

-- =========================================================
-- SELESAI. Struktur database kini selaras dengan aplikasi
-- v1.5.1. Tidak perlu restart apa pun — buka aplikasi, hard
-- refresh (Ctrl+Shift+R); console wajib menampilkan
-- "[SIMANTRI] v1.5.1".
-- =========================================================
