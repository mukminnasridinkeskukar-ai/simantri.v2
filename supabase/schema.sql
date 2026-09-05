-- ============================================================================
-- SIMANTRI v2 — Database Schema & RLS Policies
-- Sistem Informasi & Manajemen Praktik Tenaga Medis dan Tenaga Kesehatan
-- ============================================================================
--
-- Cara pakai:
--   1. Buka Supabase Dashboard → SQL Editor
--   2. Paste seluruh isi file ini
--   3. Klik Run
--
-- Catatan:
--   - Menggunakan Supabase Auth (auth.users) sebagai sumber identitas
--   - profiles.id = auth.users.id (one-to-one)
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
-- 1. PROFILES
-- ============================================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  full_name    text not null default 'Pengguna Baru',
  role         user_role not null default 'nakes',
  fasyankes_id uuid references public.fasyankes(id) on delete set null,
  avatar_url   text,
  phone        text,
  is_active    boolean not null default true,
  last_login   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_fasyankes on public.profiles(fasyankes_id);

-- ============================================================================
-- 2. FASYANKES
-- ============================================================================
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
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_fasyankes_jenis on public.fasyankes(jenis);
create index if not exists idx_fasyankes_kabupaten on public.fasyankes(kabupaten);

-- ============================================================================
-- 3. TENAGA_KESEHATAN
-- ============================================================================
create table if not exists public.tenaga_kesehatan (
  id              uuid primary key default uuid_generate_v4(),
  nik             text unique not null,
  nama            text not null,
  profesi         text not null,
  jenis           nakes_jenis not null,
  no_str          text unique not null,
  tgl_terbit_str  date not null,
  tgl_akhir_str   date not null,
  file_str_url    text,
  foto_url        text,
  phone           text,
  email           text,
  fasyankes_id    uuid references public.fasyankes(id) on delete set null,
  user_id         uuid references public.profiles(id) on delete set null,
  status          praktik_status not null default 'aktif',
  verifikasi_status verifikasi_status not null default 'pending',
  verified_by     uuid references public.profiles(id),
  verified_at     timestamptz,
  metadata        jsonb default '{}'::jsonb,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint chk_tgl_str check (tgl_akhir_str > tgl_terbit_str),
  constraint chk_nik_format check (nik ~ '^[0-9]{16}$')
);

create index if not exists idx_nakes_nama on public.tenaga_kesehatan(nama);
create index if not exists idx_nakes_jenis on public.tenaga_kesehatan(jenis);
create index if not exists idx_nakes_fasyankes on public.tenaga_kesehatan(fasyankes_id);
create index if not exists idx_nakes_str_akhir on public.tenaga_kesehatan(tgl_akhir_str);
create index if not exists idx_nakes_status on public.tenaga_kesehatan(status);
create index if not exists idx_nakes_search on public.tenaga_kesehatan using gin (to_tsvector('simple', nama || ' ' || coalesce(nik, '') || ' ' || coalesce(no_str, '') || ' ' || coalesce(profesi, '')));

-- ============================================================================
-- 4. PRAKTIK (SIP / SIK / Rekomendasi)
-- ============================================================================
create table if not exists public.praktik (
  id              uuid primary key default uuid_generate_v4(),
  tenaga_id       uuid not null references public.tenaga_kesehatan(id) on delete cascade,
  fasyankes_id    uuid not null references public.fasyankes(id) on delete restrict,
  no_sip          text unique not null,
  jenis_dok       text not null default 'SIP', -- SIP / SIK / Rekomendasi
  tgl_terbit_sip  date not null,
  tgl_akhir_sip   date not null,
  jadwal_json     jsonb default '{}'::jsonb,
  status          praktik_status not null default 'aktif',
  verifikasi_status verifikasi_status not null default 'pending',
  verified_by     uuid references public.profiles(id),
  verified_at     timestamptz,
  file_sip_url    text,
  catatan         text,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint chk_tgl_sip check (tgl_akhir_sip > tgl_terbit_sip)
);

create index if not exists idx_praktik_tenaga on public.praktik(tenaga_id);
create index if not exists idx_praktik_fasyankes on public.praktik(fasyankes_id);
create index if not exists idx_praktik_sip_akhir on public.praktik(tgl_akhir_sip);
create index if not exists idx_praktik_status on public.praktik(status);

-- ============================================================================
-- 5. NOTIFICATIONS
-- ============================================================================
create table if not exists public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  tenaga_id   uuid references public.tenaga_kesehatan(id) on delete cascade,
  praktik_id  uuid references public.praktik(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  type        notif_type not null,
  title       text not null,
  message     text not null,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notif_user on public.notifications(user_id);
create index if not exists idx_notif_unread on public.notifications(is_read, created_at desc);

-- ============================================================================
-- 6. AUDIT_LOG
-- ============================================================================
create table if not exists public.audit_log (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete set null,
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

-- ============================================================================
-- 7. TRIGGERS — auto-update updated_at
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
-- 8. AUTO-CREATE PROFILE on signup
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role, fasyankes_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Pengguna Baru'),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'nakes'),
    nullif(new.raw_user_meta_data->>'fasyankes_id', '')::uuid
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 9. HELPER FUNCTIONS — untuk RLS
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

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS)
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
    or (role = 'fasyankes' and fasyankes_id = public.current_user_fasyankes())
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
-- 11. STORAGE BUCKETS (untuk file STR/SIP)
-- ============================================================================
-- insert into storage.buckets (id, name, public) values ('str-files', 'str-files', false)
--   on conflict (id) do nothing;
-- insert into storage.buckets (id, name, public) values ('sip-files', 'sip-files', false)
--   on conflict (id) do nothing;
--
-- Storage RLS policies (jalankan terpisah jika bucket belum ada):
-- create policy "Authenticated users can read str-files"
--   on storage.objects for select to authenticated
--   using (bucket_id = 'str-files' or bucket_id = 'sip-files');
-- create policy "Users can upload own str-files"
--   on storage.objects for insert to authenticated
--   with check ((bucket_id = 'str-files' or bucket_id = 'sip-files') and auth.uid() is not null);

-- ============================================================================
-- 12. SEED DATA — contoh (opsional, hapus untuk produksi)
-- ============================================================================
-- Setelah buat akun via Supabase Auth, jalankan:
--
-- update public.profiles set role = 'dinkes' where email = 'admin@dinkes.go.id';
--
-- Insert contoh fasyankes:
-- insert into public.fasyankes (nama, jenis, alamat, lat_lng) values
--   ('RSUD Demo', 'RS', 'Jl. Demo 1', '-7.2756,112.7423'),
--   ('Puskesmas Demo', 'Puskesmas', 'Jl. Demo 2', '-7.2589,112.7467');

-- ============================================================================
-- SELESAI
-- ============================================================================
