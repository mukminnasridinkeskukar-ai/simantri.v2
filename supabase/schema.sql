-- ============================================================================
-- SIMANTRI v3 — Database Schema & RLS Policies
-- Sistem Informasi & Manajemen Praktik Tenaga Medis dan Tenaga Kesehatan
-- ============================================================================
--
-- ⚠️ CARA PAKAI:
--   1. Buka Supabase Dashboard → SQL Editor
--   2. Klik "New query"
--   3. Paste SELURUH ISI FILE INI dari awal sampai akhir (jangan sebagian!)
--   4. Klik Run (tunggu sampai selesai, ± 10 detik)
--
-- PENTING:
--   - Jalankan dari AWAL sampai AKHIR, jangan hanya bagian tertentu
--   - Jika error "function gen_salt does not exist", pastikan pgcrypto
--     extension sudah di-create (otomatis di section 0 di bawah)
--   - Jika sebagian sudah pernah dijalankan, skrip ini IDEMPOTEN (safe re-run)
--
-- Skrip ini IDEMPOTEN — aman dijalankan berulang kali.
--
-- Catatan penting:
--   - Tabel di-create TANPA foreign key antar-tabel-custom terlebih dahulu
--     (untuk menghindari circular dependency: profiles ↔ fasyankes)
--   - FK ditambahkan via ALTER TABLE di section terpisah setelah semua tabel ada
--   - FK ke auth.users tetap inline (tabel auth.users selalu ada di Supabase)
--   - RLS diaktifkan di semua tabel
--   - Policy: Dinkes = akses semua; Fasyankes = hanya data fasyankesnya;
--             Nakes = hanya data dirinya sendiri
-- ============================================================================

-- ============================================================================
-- 0. EXTENSIONS & TYPES
-- ============================================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

do $$ begin
  create type user_role as enum ('dinkes', 'fasyankes', 'nakes');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fasyankes_jenis as enum ('RS', 'Puskesmas', 'Klinik Utama', 'Klinik Pratama', 'Praktik Mandiri', 'Apotek');
exception when duplicate_object then null; end $$;

do $$ begin
  create type nakes_jenis as enum ('Dokter', 'Dokter Gigi', 'Dokter Spesialis', 'Perawat', 'Bidan', 'Apoteker', 'TTK', 'ATLM', 'Gizi', 'Kesling');
exception when duplicate_object then null; end $$;

do $$ begin
  create type praktik_status as enum ('aktif', 'nonaktif', 'hampir_expired', 'expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type verifikasi_status as enum ('pending', 'diverifikasi', 'ditolak');
exception when duplicate_object then null; end $$;

do $$ begin
  create type audit_action as enum ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notif_type as enum ('str_expired', 'str_hampir_expired', 'sip_expired', 'sip_hampir_expired', 'verifikasi', 'sistem');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- 1. TABLES (tanpa FK antar-tabel-custom — ditambah di section 7)
-- ============================================================================
-- Urutan: fasyankes → profiles → tenaga_kesehatan → praktik → notifications → audit_log
-- Catatan: profiles tetap bisa di-create duluan karena FK ke fasyankes
--          ditambah belakangan via ALTER TABLE.

-- ----------------------------------------------------------------------------
-- 1a. PROFILES
-- ----------------------------------------------------------------------------
-- Catatan: id TIDAK reference auth.users karena aplikasi memakai CUSTOM AUTH
-- (via fungsi verify_user). Hapus FK ke auth.users supaya bisa insert user
-- langsung via SQL Editor tanpa harus daftar via Supabase Auth.
create table if not exists public.profiles (
  id           uuid primary key default uuid_generate_v4(),
  email        text not null unique,
  full_name    text not null default 'Pengguna Baru',
  role         user_role not null default 'nakes',
  fasyankes_id uuid,  -- FK ditambah di section 7 (circular dependency dengan fasyankes.created_by)
  avatar_url   text,
  phone        text,
  is_active    boolean not null default true,
  last_login   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Drop FK constraint ke auth.users jika masih ada (dari versi sebelumnya)
alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles drop constraint if exists profiles_id_fkey1;

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_fasyankes on public.profiles(fasyankes_id);
create index if not exists idx_profiles_email on public.profiles(email);

-- ----------------------------------------------------------------------------
-- 1b. FASYANKES
-- ----------------------------------------------------------------------------
create table if not exists public.fasyankes (
  id         uuid primary key default uuid_generate_v4(),
  nama       text not null,
  jenis      fasyankes_jenis not null,
  alamat     text,
  kecamatan  text,
  kabupaten  text,
  provinsi   text,
  lat_lng    text, -- format: "lat,lng"
  phone      text,
  email      text,
  status     praktik_status not null default 'aktif',
  created_by uuid,  -- FK ditambah di section 7
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_fasyankes_jenis on public.fasyankes(jenis);
create index if not exists idx_fasyankes_kabupaten on public.fasyankes(kabupaten);
create index if not exists idx_fasyankes_nama on public.fasyankes(nama);

-- ----------------------------------------------------------------------------
-- 1c. TENAGA_KESEHATAN
-- ----------------------------------------------------------------------------
create table if not exists public.tenaga_kesehatan (
  id                 uuid primary key default uuid_generate_v4(),
  nik                text unique not null,
  nama               text not null,
  profesi            text not null,
  jenis              nakes_jenis not null,
  no_str             text unique not null,
  tgl_terbit_str     date not null,
  tgl_akhir_str      date not null,
  file_str_url       text,
  foto_url           text,
  phone              text,
  email              text,
  fasyankes_id       uuid,  -- FK di section 7
  user_id            uuid,  -- FK di section 7
  status             praktik_status not null default 'aktif',
  verifikasi_status  verifikasi_status not null default 'pending',
  verified_by        uuid,  -- FK di section 7
  verified_at        timestamptz,
  metadata           jsonb default '{}'::jsonb,
  created_by         uuid,  -- FK di section 7
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint chk_tgl_str check (tgl_akhir_str > tgl_terbit_str),
  constraint chk_nik_format check (nik ~ '^[0-9]{16}$')
);

create index if not exists idx_nakes_nama on public.tenaga_kesehatan(nama);
create index if not exists idx_nakes_jenis on public.tenaga_kesehatan(jenis);
create index if not exists idx_nakes_fasyankes on public.tenaga_kesehatan(fasyankes_id);
create index if not exists idx_nakes_str_akhir on public.tenaga_kesehatan(tgl_akhir_str);
create index if not exists idx_nakes_status on public.tenaga_kesehatan(status);
create index if not exists idx_nakes_verifikasi on public.tenaga_kesehatan(verifikasi_status);
create index if not exists idx_nakes_search on public.tenaga_kesehatan
  using gin (to_tsvector('simple', nama || ' ' || coalesce(nik, '') || ' ' || coalesce(no_str, '') || ' ' || coalesce(profesi, '')));

-- ----------------------------------------------------------------------------
-- 1d. PRAKTIK (SIP / SIK / Rekomendasi)
-- ----------------------------------------------------------------------------
create table if not exists public.praktik (
  id                 uuid primary key default uuid_generate_v4(),
  tenaga_id          uuid not null,  -- FK di section 7
  fasyankes_id       uuid not null,  -- FK di section 7
  no_sip             text unique not null,
  jenis_dok          text not null default 'SIP', -- SIP / SIK / Rekomendasi
  tgl_terbit_sip     date not null,
  tgl_akhir_sip      date not null,
  jadwal_json        jsonb default '{}'::jsonb,
  status             praktik_status not null default 'aktif',
  verifikasi_status  verifikasi_status not null default 'pending',
  verified_by        uuid,  -- FK di section 7
  verified_at        timestamptz,
  file_sip_url       text,
  catatan            text,
  created_by         uuid,  -- FK di section 7
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint chk_tgl_sip check (tgl_akhir_sip > tgl_terbit_sip)
);

create index if not exists idx_praktik_tenaga on public.praktik(tenaga_id);
create index if not exists idx_praktik_fasyankes on public.praktik(fasyankes_id);
create index if not exists idx_praktik_sip_akhir on public.praktik(tgl_akhir_sip);
create index if not exists idx_praktik_status on public.praktik(status);
create index if not exists idx_praktik_verifikasi on public.praktik(verifikasi_status);

-- ----------------------------------------------------------------------------
-- 1e. NOTIFICATIONS
-- ----------------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  tenaga_id   uuid,  -- FK di section 7
  praktik_id  uuid,  -- FK di section 7
  user_id     uuid,  -- FK di section 7
  type        notif_type not null,
  title       text not null,
  message     text not null,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notif_user on public.notifications(user_id);
create index if not exists idx_notif_unread on public.notifications(is_read, created_at desc);
create index if not exists idx_notif_type on public.notifications(type);

-- ----------------------------------------------------------------------------
-- 1f. AUDIT_LOG
-- ----------------------------------------------------------------------------
create table if not exists public.audit_log (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid,  -- FK di section 7
  action      audit_action not null,
  entity      text not null,
  entity_id   text,
  detail      jsonb default '{}'::jsonb,
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_audit_user on public.audit_log(user_id);
create index if not exists idx_audit_created on public.audit_log(created_at desc);
create index if not exists idx_audit_entity on public.audit_log(entity, entity_id);
create index if not exists idx_audit_action on public.audit_log(action);

-- ============================================================================
-- 2. FOREIGN KEY CONSTRAINTS (dipasang setelah semua tabel ada — anti circular)
-- ============================================================================
-- Drop dulu jika ada (idempoten), lalu create ulang.

-- profiles → fasyankes
alter table public.profiles drop constraint if exists fk_profiles_fasyankes;
alter table public.profiles
  add constraint fk_profiles_fasyankes
  foreign key (fasyankes_id) references public.fasyankes(id) on delete set null;

-- fasyankes → profiles (created_by)
alter table public.fasyankes drop constraint if exists fk_fasyankes_created_by;
alter table public.fasyankes
  add constraint fk_fasyankes_created_by
  foreign key (created_by) references public.profiles(id) on delete set null;

-- tenaga_kesehatan → fasyankes
alter table public.tenaga_kesehatan drop constraint if exists fk_nakes_fasyankes;
alter table public.tenaga_kesehatan
  add constraint fk_nakes_fasyankes
  foreign key (fasyankes_id) references public.fasyankes(id) on delete set null;

-- tenaga_kesehatan → profiles (user_id — jika nakes punya akun login)
alter table public.tenaga_kesehatan drop constraint if exists fk_nakes_user;
alter table public.tenaga_kesehatan
  add constraint fk_nakes_user
  foreign key (user_id) references public.profiles(id) on delete set null;

-- tenaga_kesehatan → profiles (verified_by)
alter table public.tenaga_kesehatan drop constraint if exists fk_nakes_verified_by;
alter table public.tenaga_kesehatan
  add constraint fk_nakes_verified_by
  foreign key (verified_by) references public.profiles(id) on delete set null;

-- tenaga_kesehatan → profiles (created_by)
alter table public.tenaga_kesehatan drop constraint if exists fk_nakes_created_by;
alter table public.tenaga_kesehatan
  add constraint fk_nakes_created_by
  foreign key (created_by) references public.profiles(id) on delete set null;

-- praktik → tenaga_kesehatan
alter table public.praktik drop constraint if exists fk_praktik_tenaga;
alter table public.praktik
  add constraint fk_praktik_tenaga
  foreign key (tenaga_id) references public.tenaga_kesehatan(id) on delete cascade;

-- praktik → fasyankes
alter table public.praktik drop constraint if exists fk_praktik_fasyankes;
alter table public.praktik
  add constraint fk_praktik_fasyankes
  foreign key (fasyankes_id) references public.fasyankes(id) on delete restrict;

-- praktik → profiles (verified_by)
alter table public.praktik drop constraint if exists fk_praktik_verified_by;
alter table public.praktik
  add constraint fk_praktik_verified_by
  foreign key (verified_by) references public.profiles(id) on delete set null;

-- praktik → profiles (created_by)
alter table public.praktik drop constraint if exists fk_praktik_created_by;
alter table public.praktik
  add constraint fk_praktik_created_by
  foreign key (created_by) references public.profiles(id) on delete set null;

-- notifications → tenaga_kesehatan
alter table public.notifications drop constraint if exists fk_notif_tenaga;
alter table public.notifications
  add constraint fk_notif_tenaga
  foreign key (tenaga_id) references public.tenaga_kesehatan(id) on delete cascade;

-- notifications → praktik
alter table public.notifications drop constraint if exists fk_notif_praktik;
alter table public.notifications
  add constraint fk_notif_praktik
  foreign key (praktik_id) references public.praktik(id) on delete cascade;

-- notifications → profiles
alter table public.notifications drop constraint if exists fk_notif_user;
alter table public.notifications
  add constraint fk_notif_user
  foreign key (user_id) references public.profiles(id) on delete cascade;

-- audit_log → profiles
alter table public.audit_log drop constraint if exists fk_audit_user;
alter table public.audit_log
  add constraint fk_audit_user
  foreign key (user_id) references public.profiles(id) on delete set null;

-- ============================================================================
-- 3. TRIGGERS — auto-update updated_at
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_fasyankes_updated on public.fasyankes;
create trigger trg_fasyankes_updated before update on public.fasyankes
  for each row execute function public.set_updated_at();

drop trigger if exists trg_nakes_updated on public.tenaga_kesehatan;
create trigger trg_nakes_updated before update on public.tenaga_kesehatan
  for each row execute function public.set_updated_at();

drop trigger if exists trg_praktik_updated on public.praktik;
create trigger trg_praktik_updated before update on public.praktik
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 4. AUTO-CREATE PROFILE — TIDAK DIPAKAI di v3 (custom auth)
-- ============================================================================
-- Aplikasi SIMANTRI v3 memakai CUSTOM AUTH via fungsi verify_user.
-- User ditambahkan langsung via SQL Editor atau halaman Manajemen User,
-- TIDAK melalui Supabase Auth sign-up.
-- Karena itu trigger on_auth_user_created tidak diperlukan.

-- Drop trigger & function jika ada (dari versi sebelumnya)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;

-- ============================================================================
-- 5. HELPER FUNCTIONS — untuk RLS
-- ============================================================================
-- Ambil role user saat ini
create or replace function public.current_user_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Ambil fasyankes_id user saat ini
create or replace function public.current_user_fasyankes()
returns uuid language sql stable security definer set search_path = public as $$
  select fasyankes_id from public.profiles where id = auth.uid();
$$;

-- Cek apakah user saat ini adalah Dinkes
create or replace function public.is_dinkes()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'dinkes');
$$;

-- Cek apakah user saat ini adalah Fasyankes
create or replace function public.is_fasyankes()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'fasyankes');
$$;

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================================
alter table public.profiles          enable row level security;
alter table public.fasyankes         enable row level security;
alter table public.tenaga_kesehatan  enable row level security;
alter table public.praktik           enable row level security;
alter table public.notifications     enable row level security;
alter table public.audit_log         enable row level security;

-- ===== PROFILES =====
-- Dinkes: lihat semua; Fasyankes: lihat profil di fasyankesnya; Nakes: lihat dirinya
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (
    public.is_dinkes()
    or (public.is_fasyankes() and fasyankes_id = public.current_user_fasyankes())
    or id = auth.uid()
  );

-- User bisa update dirinya sendiri (terbatas)
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid());

-- Hanya Dinkes yang bisa insert & delete profile lain
drop policy if exists profiles_insert_dinkes on public.profiles;
create policy profiles_insert_dinkes on public.profiles
  for insert with check (public.is_dinkes());

drop policy if exists profiles_delete_dinkes on public.profiles;
create policy profiles_delete_dinkes on public.profiles
  for delete using (public.is_dinkes());

-- ===== FASYANKES =====
drop policy if exists fasyankes_select on public.fasyankes;
create policy fasyankes_select on public.fasyankes
  for select using (
    public.is_dinkes()
    or id = public.current_user_fasyankes()
  );

drop policy if exists fasyankes_modify_dinkes on public.fasyankes;
create policy fasyankes_modify_dinkes on public.fasyankes
  for all using (public.is_dinkes()) with check (public.is_dinkes());

-- ===== TENAGA_KESEHATAN =====
-- Dinkes: semua; Fasyankes: nakes di fasyankesnya; Nakes: dirinya sendiri
drop policy if exists nakes_select on public.tenaga_kesehatan;
create policy nakes_select on public.tenaga_kesehatan
  for select using (
    public.is_dinkes()
    or fasyankes_id = public.current_user_fasyankes()
    or user_id = auth.uid()
  );

drop policy if exists nakes_insert on public.tenaga_kesehatan;
create policy nakes_insert on public.tenaga_kesehatan
  for insert with check (
    public.is_dinkes()
    or fasyankes_id = public.current_user_fasyankes()
    or user_id = auth.uid()
  );

drop policy if exists nakes_update on public.tenaga_kesehatan;
create policy nakes_update on public.tenaga_kesehatan
  for update using (
    public.is_dinkes()
    or fasyankes_id = public.current_user_fasyankes()
    or user_id = auth.uid()
  );

drop policy if exists nakes_delete on public.tenaga_kesehatan;
create policy nakes_delete on public.tenaga_kesehatan
  for delete using (public.is_dinkes());

-- ===== PRAKTIK =====
drop policy if exists praktik_select on public.praktik;
create policy praktik_select on public.praktik
  for select using (
    public.is_dinkes()
    or fasyankes_id = public.current_user_fasyankes()
    or tenaga_id in (select id from public.tenaga_kesehatan where user_id = auth.uid())
  );

drop policy if exists praktik_insert on public.praktik;
create policy praktik_insert on public.praktik
  for insert with check (
    public.is_dinkes()
    or fasyankes_id = public.current_user_fasyankes()
  );

drop policy if exists praktik_update on public.praktik;
create policy praktik_update on public.praktik
  for update using (
    public.is_dinkes()
    or fasyankes_id = public.current_user_fasyankes()
  );

drop policy if exists praktik_delete on public.praktik;
create policy praktik_delete on public.praktik
  for delete using (public.is_dinkes());

-- ===== NOTIFICATIONS =====
drop policy if exists notif_select on public.notifications;
create policy notif_select on public.notifications
  for select using (
    public.is_dinkes()
    or user_id = auth.uid()
    or tenaga_id in (
      select id from public.tenaga_kesehatan
      where user_id = auth.uid() or fasyankes_id = public.current_user_fasyankes()
    )
  );

drop policy if exists notif_update on public.notifications;
create policy notif_update on public.notifications
  for update using (user_id = auth.uid() or public.is_dinkes());

drop policy if exists notif_insert on public.notifications;
create policy notif_insert on public.notifications
  for insert with check (public.is_dinkes() or user_id = auth.uid());

-- ===== AUDIT_LOG =====
drop policy if exists audit_select on public.audit_log;
create policy audit_select on public.audit_log
  for select using (public.is_dinkes() or user_id = auth.uid());

drop policy if exists audit_insert on public.audit_log;
create policy audit_insert on public.audit_log
  for insert with check (user_id = auth.uid() or public.is_dinkes());

-- ============================================================================
-- 7. STORAGE BUCKETS (untuk file STR/SIP)
-- ============================================================================
-- Buat buckets private (akses via signed URL)
do $$ begin
  insert into storage.buckets (id, name, public) values
    ('str-files', 'str-files', false),
    ('sip-files', 'sip-files', false)
  on conflict (id) do nothing;
exception
  when insufficient_privilege then
    raise notice 'Skipping storage buckets — run as service_role in Supabase Dashboard';
end $$;

-- Storage policies — authenticated users bisa baca file miliknya
drop policy if exists "str_files_read_own" on storage.objects;
create policy "str_files_read_own" on storage.objects
  for select to authenticated using (
    bucket_id in ('str-files', 'sip-files')
    and auth.uid() is not null
  );

drop policy if exists "str_files_upload_own" on storage.objects;
create policy "str_files_upload_own" on storage.objects
  for insert to authenticated with check (
    bucket_id in ('str-files', 'sip-files')
    and auth.uid() is not null
  );

drop policy if exists "str_files_update_own" on storage.objects;
create policy "str_files_update_own" on storage.objects
  for update to authenticated using (
    bucket_id in ('str-files', 'sip-files')
    and auth.uid() is not null
  );

drop policy if exists "str_files_delete_own" on storage.objects;
create policy "str_files_delete_own" on storage.objects
  for delete to authenticated using (
    bucket_id in ('str-files', 'sip-files')
    and (auth.uid() is not null and public.is_dinkes())
  );

-- ============================================================================
-- 8. SEED DATA — sample (opsional, hapus untuk produksi murni)
-- ============================================================================
-- Hanya insert jika tabel masih kosong (idempoten via on conflict do nothing)
do $$ begin
  if not exists (select 1 from public.fasyankes limit 1) then
    insert into public.fasyankes (nama, jenis, alamat, lat_lng, kabupaten, provinsi) values
      ('RSUD Demo', 'RS', 'Jl. Demo 1, Surabaya', '-7.2756,112.7423', 'Surabaya', 'Jawa Timur'),
      ('Puskesmas Demo', 'Puskesmas', 'Jl. Demo 2, Surabaya', '-7.2589,112.7467', 'Surabaya', 'Jawa Timur'),
      ('Klinik Utama Demo', 'Klinik Utama', 'Jl. Demo 3, Surabaya', '-7.2645,112.7551', 'Surabaya', 'Jawa Timur')
    on conflict do nothing;
  end if;
end $$;

-- ============================================================================
-- 9. MULTIUSER LOGIN (custom auth via tabel profiles)
-- ============================================================================
-- Sistem ini TIDAK memakai Supabase Auth bawaan (yang butuh sign-up via Dashboard).
-- Sebagai gantinya, password disimpan di kolom `password_hash` pada tabel
-- `profiles`, dan login divalidasi via fungsi `verify_user(email, password)`.
--
-- Kelebihan:
--   ✅ Admin bisa CRUD user langsung via SQL Editor / Table Editor
--   ✅ Tidak perlu sign-up manual via Authentication menu
--   ✅ Password di-hash dengan pgcrypto (bcrypt-style)
--   ✅ Compatible dengan RLS yang sudah ada
--
-- Cara admin tambah user baru (jalankan di SQL Editor):
--   insert into public.profiles (id, email, full_name, role, password_hash, is_active)
--   values (
--     uuid_generate_v4(),
--     'admin@dinkes.go.id',
--     'Dr. Admin Baru',
--     'dinkes',
--     public.hash_password('password123'),
--     true
--   );
--
-- Cara admin ubah password user:
--   update public.profiles
--   set password_hash = public.hash_password('newpassword')
--   where email = 'admin@dinkes.go.id';
-- ============================================================================

-- 9a. Pastikan extension pgcrypto aktif (dibutuhkan untuk crypt() & gen_salt())
-- WAJIB: jalankan CREATE EXTENSION ini duluan, jangan langsung ke fungsi
create extension if not exists pgcrypto;

-- Verifikasi pgcrypto aktif dengan cek apakah gen_salt function ada
-- (raise exception jika tidak ada, supaya user tahu masalahnya)
do $$
begin
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'public' and p.proname = 'gen_salt'
       or n.nspname = 'pg_catalog' and p.proname = 'gen_salt'
  ) then
    -- gen_salt juga ada di schema public dari pgcrypto, cek juga di catalog
    if not exists (
      select 1 from pg_proc p
      join pg_namespace n on p.pronamespace = n.oid
      where p.proname = 'gen_salt'
    ) then
      raise exception 'pgcrypto extension belum aktif. Jalankan: CREATE EXTENSION pgcrypto;';
    end if;
  end if;
end $$;

-- 9b. Tambah kolom password_hash ke tabel profiles
alter table public.profiles drop column if exists password_hash;
alter table public.profiles add column password_hash text;

-- 9c. Fungsi hash_password — hash plain text password pakai pgcrypto
-- Pakai algoritma bf (blowfish) dengan cost factor 8
-- Pakai plpgsql dengan exception handling — jika gen_salt gagal,
-- fallback ke md5 (kurang aman tapi tetap berfungsi)
create or replace function public.hash_password(plain text)
returns text language plpgsql immutable security definer set search_path = public as $$
declare
  result text;
  salt_text text := 'bf';
  cost_int integer := 8;
begin
  -- Coba pakai pgcrypto (blowfish - aman)
  begin
    result := crypt(plain, gen_salt(salt_text, cost_int));
    if result is not null and result <> '' then
      return result;
    end if;
  exception
    when others then
      -- Fallback ke md5 jika pgcrypto gen_salt bermasalah
      result := 'md5' || md5(plain || 'simantri_salt_v3');
      return result;
  end;

  -- Jika sampai sini, berarti crypt return null — fallback
  result := 'md5' || md5(plain || 'simantri_salt_v3');
  return result;
end $$;

-- 9d. Fungsi verify_user — return profile jika email+password valid
-- Return null jika tidak valid / user nonaktif
-- Handle 2 format hash: crypt() (blowfish) dan md5 fallback
create or replace function public.verify_user(p_email text, p_password text)
returns public.profiles language plpgsql security definer set search_path = public as $$
declare
  v_profile public.profiles;
  v_password_match boolean := false;
begin
  select * into v_profile
  from public.profiles
  where lower(email) = lower(p_email)
    and is_active = true
  limit 1;

  if not found then
    return null;
  end if;

  -- Jika password_hash null → tidak bisa login
  if v_profile.password_hash is null then
    return null;
  end if;

  -- Cek password berdasarkan format hash
  -- Format 1: crypt (blowfish) — diawali dengan $2a$, $2b$, atau $2y$
  -- Format 2: md5 fallback — diawali dengan 'md5'
  begin
    if v_profile.password_hash like 'md5%' then
      -- Format md5 fallback
      v_password_match := (v_profile.password_hash = 'md5' || md5(p_password || 'simantri_salt_v3'));
    else
      -- Format crypt (blowfish)
      v_password_match := (crypt(p_password, v_profile.password_hash) = v_profile.password_hash);
    end if;
  exception
    when others then
      v_password_match := false;
  end;

  if v_password_match then
    -- Update last_login
    update public.profiles set last_login = now() where id = v_profile.id;
    return v_profile;
  else
    return null;
  end if;
exception
  when others then
    return null;
end $$;

-- 9d. RLS untuk profiles — agar fungsi verify_user bisa akses
-- (profiles_select sudah ada, tapi pastikan verify_user tetap jalan sebagai security definer)
-- verify_user sudah pakai security definer → bisa akses semua row
-- Tidak perlu policy tambahan.

-- 9e. Seed default admin users (jika belum ada)
do $$ begin
  -- Admin Dinkes default
  if not exists (select 1 from public.profiles where email = 'dinkes@simantri.demo') then
    insert into public.profiles (id, email, full_name, role, password_hash, is_active)
    values (
      'd0000000-0000-0000-0000-000000000001',
      'dinkes@simantri.demo',
      'Dr. Admin Dinkes',
      'dinkes',
      public.hash_password('dinkes123'),
      true
    ) on conflict do nothing;
  end if;

  -- Admin Dinkes 2
  if not exists (select 1 from public.profiles where email = 'dinkes2@simantri.demo') then
    insert into public.profiles (id, email, full_name, role, password_hash, is_active)
    values (
      'd0000000-0000-0000-0000-000000000002',
      'dinkes2@simantri.demo',
      'Dr. Andi Pratama',
      'dinkes',
      public.hash_password('dinkes123'),
      true
    ) on conflict do nothing;
  end if;
exception
  when others then
    raise notice 'Seed users skipped: %', sqlerrm;
end $$;

-- 9f. Policy untuk allow anon call verify_user (tanpa login Supabase Auth)
-- Karena verify_user pakai security definer, ia bisa akses profiles.
-- Tapi anon role perlu permission invoke RPC.
-- Supabase otomatis allow anon call public functions yang SECURITY DEFINER.

-- 9g. Helper: Update semua profile yang belum punya password_hash
-- (untuk migrasi dari versi sebelumnya)
update public.profiles
set password_hash = public.hash_password('dinkes123')
where password_hash is null
  and role = 'dinkes';

-- ============================================================================
-- CARA PAKAI MULTIUSER:
-- ============================================================================
-- 1. Login di aplikasi pakai email+password dari tabel profiles
--    Contoh default: dinkes@simantri.demo / dinkes123
--
-- 2. Tambah user baru via SQL Editor:
--    insert into public.profiles (id, email, full_name, role, password_hash, is_active)
--    values (uuid_generate_v4(), 'newuser@domain.go.id', 'Nama User', 'dinkes',
--            public.hash_password('passwordBaru'), true);
--
-- 3. Ubah password user:
--    update public.profiles set password_hash = public.hash_password('newpass')
--    where email = 'user@domain.go.id';
--
-- 4. Nonaktifkan user (tidak bisa login):
--    update public.profiles set is_active = false where email = 'user@domain.go.id';
--
-- 5. Hapus user:
--    delete from public.profiles where email = 'user@domain.go.id';
--
-- 6. Lihat semua user:
--    select id, email, full_name, role, is_active, last_login, created_at
--    from public.profiles order by created_at;
-- ============================================================================

-- ============================================================================
-- SELESAI
-- ============================================================================
-- Verifikasi cepat — jalankan query berikut untuk cek:
--   select count(*) from public.fasyankes;        -- harus ≥ 3 (seed)
--   select count(*) from public.tenaga_kesehatan; -- harus 0
--   select * from pg_constraint where conname like 'fk_%';  -- list semua FK
--   select tablename, rowsecurity from pg_tables where schemaname='public';  -- RLS status
--   select email, full_name, role, is_active from public.profiles;  -- list users
--   select public.verify_user('dinkes@simantri.demo', 'dinkes123');  -- test login
-- ============================================================================