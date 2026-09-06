-- =========================================================
-- SIMANTRI — SKEMA DATABASE SUPABASE
-- Sistem Informasi dan Manajemen Praktik Tenaga Medis dan
-- Tenaga Kesehatan di Fasyankes dan Praktik Mandiri
-- ---------------------------------------------------------
-- CARA PAKAI:
--   1. Buka Supabase Dashboard → SQL Editor → New query
--   2. Salin SELURUH isi file ini → klik Run
--   3. (Opsional) jalankan sql/seed.sql untuk data demo
--
-- Script ini IDEMPOTENT: aman dijalankan berulang kali.
-- Semua tabel punya created_at & diaktifkan RLS.
-- =========================================================

-- =========================================================
-- 1. TABEL PROFILES (id = auth.users.id)
--    ⚠ DIBUAT PALING AWAL: fungsi bantu & kebijakan RLS di
--    bawah ini merujuk ke tabel profiles, sehingga tabel
--    wajib ada lebih dulu (mencegah error 42P01
--    "relation public.profiles does not exist").
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

-- =========================================================
-- 2. FUNGSI BANTU (untuk kebijakan RLS berbasis role)
-- =========================================================

-- Ambil role pengguna yang sedang login dari tabel profiles.
-- SECURITY DEFINER agar tidak terjadi rekursi RLS pada profiles.
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

-- admin / verifikator (untuk aksi verifikasi)
create or replace function public.is_verifikator()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((select role from public.profiles where id = auth.uid()) in ('admin', 'verifikator'), false)
$$;

-- admin / operator (untuk input & edit data)
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
-- 3. TABEL TENAGA MEDIS
-- =========================================================

create table if not exists public.tenaga_medis (
  id               bigint generated always as identity primary key,
  nik              varchar(16) not null,
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

-- =========================================================
-- 4. TABEL TENAGA KESEHATAN
-- =========================================================

create table if not exists public.tenaga_kesehatan (
  id               bigint generated always as identity primary key,
  nik              varchar(16) not null,
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

-- =========================================================
-- 5. TABEL FASYANKES
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

-- =========================================================
-- 6. TABEL PRAKTIK MANDIRI
-- =========================================================

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

-- =========================================================
-- 7. TABEL MONEV IZIN (Monitoring & Evaluasi)
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

-- =========================================================
-- 7B. TABEL VERVAL IZIN PRAKTIK (Verifikasi & Validasi)
--     Hasil pengisian Formulir Verval Izin Praktik pada menu
--     Verifikasi Praktik (28 field, 1 baris = 1 verval nakes).
-- =========================================================

create table if not exists public.verval_izin_praktik (
  id                 bigint generated always as identity primary key,
  nik                varchar(16) not null,
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

-- =========================================================
-- 7C. TABEL VERVAL DRAFT (draf formulir per pengguna per form)
--     Pengganti localStorage: draf form tersinkron otomatis
--     ke Supabase sehingga aman dibuka lintas perangkat.
--     Kolom `form` memisahkan draf "praktik" dan "faskes".
-- =========================================================

create table if not exists public.verval_draft (
  user_id    uuid not null references auth.users (id) on delete cascade,
  form       text not null default 'praktik',
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, form)
);

-- =========================================================
-- 7D. TABEL VERVAL FASYANKES (Verifikasi & Validasi Faskes)
--     Hasil pengisian Formulir Verval Fasyankes pada menu
--     Verifikasi Faskes (1 baris = 1 verval fasilitas).
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

-- =========================================================
-- 8. TRIGGER updated_at (semua tabel)
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

-- =========================================================
-- 9. TRIGGER PROFIL OTOMATIS saat user baru mendaftar
--    (profile dibuat dengan role default: operator)
-- =========================================================

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
-- 10. INDEX (mempercepat pencarian & agregasi)
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
-- 11. ROW LEVEL SECURITY
-- ---------------------------------------------------------
-- Ringkasan hak akses:
--   SELECT  : publik (anon + authenticated) agar dashboard,
--             peta, dan cek verifikasi bisa diakses tanpa login.
--             (Bila ingin menutup, ganti `using (true)` menjadi
--              `using (auth.uid() is not null)`.)
--   INSERT  : admin & operator (can_input)
--   UPDATE  : admin & operator (edit data) + verifikator
--             (mengubah status_verifikasi)
--   DELETE  : hanya admin
--   profiles: select/edit data sendiri; kelola semua hanya admin.
-- =========================================================

alter table public.profiles        enable row level security;
alter table public.tenaga_medis    enable row level security;
alter table public.tenaga_kesehatan enable row level security;
alter table public.fasyankes       enable row level security;
alter table public.praktik_mandiri enable row level security;
alter table public.monev_izin      enable row level security;
alter table public.verval_izin_praktik enable row level security;
alter table public.verval_draft    enable row level security;
alter table public.verval_fasyankes enable row level security;

-- ---------- profiles ----------
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_admin" on public.profiles;
create policy "profiles_insert_admin"
  on public.profiles for insert
  with check (public.is_admin());

-- pengguna boleh memperbarui data sendiri TANPA bisa mengubah role sendiri
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

-- ---------- monev_izin ----------
drop policy if exists "monev_select" on public.monev_izin;
create policy "monev_select" on public.monev_izin for select using (true);

drop policy if exists "monev_insert" on public.monev_izin;
create policy "monev_insert" on public.monev_izin for insert
  with check (auth.uid() is not null);

drop policy if exists "monev_update" on public.monev_izin;
create policy "monev_update" on public.monev_izin for update
  using (auth.uid() is not null);

drop policy if exists "monev_delete" on public.monev_izin;
create policy "monev_delete" on public.monev_izin for delete
  using (public.is_admin());

-- ---------- verval_izin_praktik ----------
-- Hasil verval dapat dilihat publik (konsisten dgn cek verifikasi);
-- penulisan hanya oleh verifikator/admin; hapus hanya admin.
drop policy if exists "verval_select" on public.verval_izin_praktik;
create policy "verval_select" on public.verval_izin_praktik for select using (true);

drop policy if exists "verval_insert" on public.verval_izin_praktik;
create policy "verval_insert" on public.verval_izin_praktik for insert
  with check (auth.uid() is not null and public.is_verifikator());

drop policy if exists "verval_update" on public.verval_izin_praktik;
create policy "verval_update" on public.verval_izin_praktik for update
  using (auth.uid() is not null and public.is_verifikator());

drop policy if exists "verval_delete" on public.verval_izin_praktik;
create policy "verval_delete" on public.verval_izin_praktik for delete
  using (public.is_admin());

-- ---------- verval_draft (draf milik pengguna sendiri) ----------
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

-- ---------- verval_fasyankes ----------
-- Hasil verval fasyankes dapat dilihat publik; penulisan hanya oleh
-- verifikator/admin; hapus hanya admin.
drop policy if exists "vervalfas_select" on public.verval_fasyankes;
create policy "vervalfas_select" on public.verval_fasyankes for select using (true);

drop policy if exists "vervalfas_insert" on public.verval_fasyankes;
create policy "vervalfas_insert" on public.verval_fasyankes for insert
  with check (auth.uid() is not null and public.is_verifikator());

drop policy if exists "vervalfas_update" on public.verval_fasyankes;
create policy "vervalfas_update" on public.verval_fasyankes for update
  using (auth.uid() is not null and public.is_verifikator());

drop policy if exists "vervalfas_delete" on public.verval_fasyankes;
create policy "vervalfas_delete" on public.verval_fasyankes for delete
  using (public.is_admin());

-- =========================================================
-- 12. STORAGE BUCKET "monev" (foto dokumentasi monev)
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
-- SELESAI. Langkah selanjutnya:
--   1. Buat user admin pertama via Authentication → Users → Add user
--   2. Promosikan: update profiles set role='admin' where email='...';
--   3. Isi js/config.js dengan Project URL & anon key.
-- =========================================================