-- =========================================================
-- SIMANTRI — MIGRASI v1.1.0 + v1.2.0: FORMULIR VERVAL
-- ---------------------------------------------------------
-- Jalankan file ini HANYA JIKA sql/schema.sql versi lama
-- (sebelum v1.1.0) sudah pernah dijalankan dan Anda tidak
-- ingin menjalankan ulang schema.sql dari awal.
--
--   Database BARU/kosong        → jalankan schema.sql saja
--   Database SUDAH berjalan     → jalankan file ini sekali
--
-- Script ini IDEMPOTENT: aman dijalankan berulang.
-- Isi:
--   1-5   (v1.1.0) tabel verval izin praktik + draft + RLS
--   6     (v1.2.0) tabel verval fasyankes + draf multi-form
-- =========================================================

-- =========================================================
-- 1. TABEL VERVAL IZIN PRAKTIK
--    Hasil pengisian Formulir Verval Izin Praktik pada menu
--    Verifikasi Praktik (28 field, 1 baris = 1 verval nakes).
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
-- 2. TABEL VERVAL DRAFT (draf formulir per pengguna)
--    Pengganti localStorage: draf form tersinkron otomatis
--    ke Supabase sehingga aman dibuka lintas perangkat.
-- =========================================================

create table if not exists public.verval_draft (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- =========================================================
-- 3. TRIGGER updated_at untuk kedua tabel baru
-- =========================================================

do $$
declare t text;
begin
  foreach t in array array['verval_izin_praktik', 'verval_draft']
  loop
    execute format('drop trigger if exists trg_updated_at on public.%I', t);
    execute format('create trigger trg_updated_at before update on public.%I
                    for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- =========================================================
-- 4. INDEX
-- =========================================================

create index if not exists idx_verval_nik  on public.verval_izin_praktik (nik);
create index if not exists idx_verval_nama on public.verval_izin_praktik (nama_lengkap);
create index if not exists idx_verval_unit on public.verval_izin_praktik (unit_kerja);

-- =========================================================
-- 5. ROW LEVEL SECURITY
-- =========================================================

alter table public.verval_izin_praktik enable row level security;
alter table public.verval_draft    enable row level security;

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

-- =========================================================
-- SELESAI (v1.1.0). Lanjut ke bagian 6 untuk fitur v1.2.0.
-- =========================================================

-- =========================================================
-- 6. (v1.2.0) TABEL VERVAL FASYANKES
--    Hasil pengisian Formulir Verval Fasyankes pada menu
--    Verifikasi Faskes (1 baris = 1 verval fasilitas).
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

do $$
declare t text;
begin
  foreach t in array array['verval_fasyankes']
  loop
    execute format('drop trigger if exists trg_updated_at on public.%I', t);
    execute format('create trigger trg_updated_at before update on public.%I
                    for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

create index if not exists idx_vervalfas_nama      on public.verval_fasyankes (nama_fasyankes);
create index if not exists idx_vervalfas_status    on public.verval_fasyankes (status_verifikasi);
create index if not exists idx_vervalfas_kecamatan on public.verval_fasyankes (kecamatan);

alter table public.verval_fasyankes enable row level security;

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

-- ---------------------------------------------------------
-- 6b. (v1.2.0) DRAF MULTI-FORM: kolom `form` + PK komposit
--     Kolom `form` memisahkan draf "praktik" dan "faskes".
--     Draf praktik lama otomatis diberi form = 'praktik'.
-- ---------------------------------------------------------

alter table public.verval_draft add column if not exists form text not null default 'praktik';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'verval_draft_form_pkey') then
    alter table public.verval_draft drop constraint if exists verval_draft_pkey;
    alter table public.verval_draft add constraint verval_draft_form_pkey primary key (user_id, form);
  end if;
end $$;

-- =========================================================
-- SELESAI. Tidak perlu restart apa pun — menu Verifikasi
-- Praktik & Verifikasi Faskes langsung dapat digunakan.
-- =========================================================
