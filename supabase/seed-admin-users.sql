-- ============================================================================
-- SIMANTRI v3 — Seed Admin Users
-- ============================================================================
-- File ini khusus untuk menambah akun admin ke tabel profiles.
-- Aman dijalankan berulang kali (idempoten via ON CONFLICT).
--
-- CARA PAKAI:
--   1. Buka Supabase Dashboard → SQL Editor
--   2. Paste seluruh isi file ini
--   3. Klik Run
--   4. Login di aplikasi dengan salah satu akun di bawah
-- ============================================================================

-- Pastikan fungsi hash_password tersedia (dari schema.sql utama)
-- Jika belum ada, jalankan schema.sql utama terlebih dahulu.
-- Untuk safety, kita buat inline jika belum ada:

-- Extension pgcrypto (untuk crypt & gen_salt)
create extension if not exists pgcrypto;

-- Buat fungsi hash_password jika belum ada
create or replace function public.hash_password(plain text)
returns text language plpgsql immutable security definer set search_path = public as $$
declare
  result text;
  salt_text text := 'bf';
  cost_int integer := 8;
begin
  begin
    result := crypt(plain, gen_salt(salt_text, cost_int));
    if result is not null and result <> '' then
      return result;
    end if;
  exception
    when others then
      result := 'md5' || md5(plain || 'simantri_salt_v3');
      return result;
  end;
  result := 'md5' || md5(plain || 'simantri_salt_v3');
  return result;
end $$;

-- ============================================================================
-- PENTING: HAPUS FK ke auth.users
-- ============================================================================
-- Aplikasi SIMANTRI v3 memakai CUSTOM AUTH (via fungsi verify_user), bukan
-- Supabase Auth bawaan. Karena itu, kita perlu hapus FK constraint
-- profiles.id → auth.users.id supaya bisa insert user langsung via SQL.
--
-- Jika constraint ini masih ada, insert akan error:
--   "violates foreign key constraint profiles_id_fkey"
--   "Key (id)=... is not present in table users"

alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles drop constraint if exists profiles_id_fkey1;

-- Sekarang profiles.id adalah plain UUID (tidak harus ada di auth.users)

-- ============================================================================
-- 1. AKUN ADMIN DEFAULT (3 akun)
-- ============================================================================

-- Admin Dinkes utama
insert into public.profiles (id, email, full_name, role, password_hash, is_active, created_at)
values (
  'd0000000-0000-0000-0000-000000000001',
  'dinkes@simantri.demo',
  'Dr. Admin Dinkes',
  'dinkes',
  public.hash_password('dinkes123'),
  true,
  now()
)
on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role,
  password_hash = excluded.password_hash,
  is_active = excluded.is_active;

-- Admin Dinkes 2
insert into public.profiles (id, email, full_name, role, password_hash, is_active, created_at)
values (
  'd0000000-0000-0000-0000-000000000002',
  'dinkes2@simantri.demo',
  'Dr. Andi Pratama',
  'dinkes',
  public.hash_password('dinkes123'),
  true,
  now()
)
on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role,
  password_hash = excluded.password_hash,
  is_active = excluded.is_active;

-- Admin RSUD
insert into public.profiles (id, email, full_name, role, password_hash, is_active, fasyankes_id, created_at)
values (
  'd0000000-0000-0000-0000-000000000003',
  'rsud.admin@simantri.demo',
  'Admin RSUD Soetomo',
  'dinkes',
  public.hash_password('admin123'),
  true,
  null,
  now()
)
on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role,
  password_hash = excluded.password_hash,
  is_active = excluded.is_active;

-- ============================================================================
-- 2. AKUN ADMIN TAMBAHAN (ubah sesuai kebutuhan)
-- ============================================================================

-- Contoh: Admin Puskesmas
-- Hapus tanda -- di bawah untuk mengaktifkan
-- insert into public.profiles (id, email, full_name, role, password_hash, is_active, created_at)
-- values (
--   'd0000000-0000-0000-0000-000000000004',
--   'puskesmas.admin@simantri.demo',
--   'Admin Puskesmas Gundih',
--   'dinkes',
--   public.hash_password('puskesmas123'),
--   true,
--   now()
-- )
-- on conflict (id) do update set
--   email = excluded.email,
--   full_name = excluded.full_name,
--   password_hash = excluded.password_hash,
--   is_active = excluded.is_active;

-- ============================================================================
-- 3. VERIFIKASI
-- ============================================================================

-- Tampilkan semua akun admin yang ada di database
select
  id,
  email,
  full_name,
  role,
  is_active,
  case when password_hash is not null then '✅ Ada' else '❌ Tidak Ada' end as has_password,
  last_login,
  created_at
from public.profiles
order by created_at;

-- ============================================================================
-- DAFTAR AKUN YANG TERSEDIA (setelah file ini dijalankan):
-- ============================================================================
-- | Email                    | Password    | Nama               |
-- |--------------------------|-------------|--------------------|
-- | dinkes@simantri.demo     | dinkes123   | Dr. Admin Dinkes   |
-- | dinkes2@simantri.demo    | dinkes123   | Dr. Andi Pratama   |
-- | rsud.admin@simantri.demo | admin123    | Admin RSUD Soetomo |
-- ============================================================================

-- ============================================================================
-- CARA TAMBAH USER BARU (copy & paste, ubah nilainya):
-- ============================================================================
-- insert into public.profiles (id, email, full_name, role, password_hash, is_active, created_at)
-- values (
--   'd0000000-0000-0000-0000-000000000099',  -- ganti dengan UUID unik
--   'email.baru@domain.go.id',                -- ganti email
--   'Nama Lengkap User',                      -- ganti nama
--   'dinkes',                                 -- role: dinkes
--   public.hash_password('passwordBaru123'),  -- ganti password
--   true,                                     -- is_active
--   now()
-- )
-- on conflict (id) do update set
--   email = excluded.email,
--   full_name = excluded.full_name,
--   password_hash = excluded.password_hash;
-- ============================================================================

-- ============================================================================
-- CARA UBAH PASSWORD USER:
-- ============================================================================
-- update public.profiles
-- set password_hash = public.hash_password('passwordBaru')
-- where email = 'dinkes@simantri.demo';
-- ============================================================================

-- ============================================================================
-- CARA HAPUS USER:
-- ============================================================================
-- delete from public.profiles where email = 'email. yang.dihapus@domain.go.id';
-- ============================================================================
