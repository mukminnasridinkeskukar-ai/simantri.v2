-- =========================================================
-- SIMANTRI — MIGRASI v1.2.1: NIK TIDAK LAGI DIISI APLIKASI
-- ---------------------------------------------------------
-- Sejak v1.2.1 aplikasi TIDAK lagi mengumpulkan / menampilkan
-- data NIK (semua formulir, tabel, dan hasil pencarian sudah
-- bersih dari NIK). Kolom `nik` TETAP ADA di database agar
-- data lama tidak hilang, tetapi tidak wajib lagi (nullable).
--
-- Jalankan SEKALI di Supabase SQL Editor bila database Anda
-- dibuat dengan schema versi lama (nik NOT NULL).
-- Aman dijalankan berulang (DROP NOT NULL bersifat idempotent).
--
-- Catatan: bila Anda menjalankan sql/migrasi_verval.sql versi
-- terbaru, section 7 di dalamnya sudah mencakup perubahan ini
-- — script ini tidak lagi diperlukan.
-- =========================================================

alter table public.tenaga_medis        alter column nik drop not null;
alter table public.tenaga_kesehatan    alter column nik drop not null;
alter table public.verval_izin_praktik alter column nik drop not null;

-- Selesai. Aplikasi v1.2.1 langsung dapat dipakai:
-- upload ulang seluruh isi folder aplikasi, lalu hard refresh
-- (Ctrl+Shift+R). Console harus menampilkan "[SIMANTRI] v1.2.1".
