# SIMANTRI

**Sistem Informasi dan Manajemen Praktik Tenaga Medis dan Tenaga Kesehatan di Fasyankes dan Praktik Mandiri — Kabupaten Kutai Kartanegara**

Aplikasi web ringan (HTML + Tailwind CSS CDN + Vanilla JS) dengan backend **Supabase** murni — semua data live dari Supabase via `supabase-js v2`. Tanpa mock data, tanpa localStorage untuk data. Siap deploy ke **GitHub Pages**.

---

## Struktur Folder

```
/
├── index.html          # Entry point (splash 3 detik + shell aplikasi)
├── css/
│   └── style.css       # Tema custom (emerald #0d9488, rounded-2xl, shadow soft)
├── js/
│   ├── config.js       # ← ISI SUPABASE_URL & ANON KEY DI SINI
│   ├── supabase.js     # Klien supabase-js v2 (ESM via CDN)
│   └── app.js          # Router hash + auth + CRUD + verifikasi + peta + grafik
├── assets/
│   └── logo.svg        # Logo SIMANTRI
├── sql/
│   ├── schema.sql            # SEMUA tabel + RLS + trigger + bucket (WAJIB untuk database baru)
│   ├── migrasi_verval.sql    # Migrasi v1.1.0+v1.2.0+v1.2.1: tabel verval praktik & fasyankes + nik nullable (untuk database yang SUDAH berjalan)
│   ├── migrasi_hapus_nik.sql # Migrasi v1.2.1 saja: kolom nik tidak wajib (database lama, tanpa rerun migrasi lengkap)
│   └── seed.sql              # Data demo opsional (fasyankes/praktik Kab. Kutai Kartanegara + koordinat, tanpa NIK)
└── README.md
```

---

## Langkah Setup (± 10 menit)

### 1. Buat Project Supabase
1. Daftar/masuk ke [supabase.com](https://supabase.com) → **New project**.
2. Tunggu hingga project selesai dibuat.

### 2. Jalankan Skema Database
1. Buka **SQL Editor → New query**.
2. Salin seluruh isi `sql/schema.sql` → klik **Run**.
3. (Opsional) Salin isi `sql/seed.sql` → **Run** untuk data demo (RSUD Tenggarong, Puskesmas, praktik bidan, dll. — lengkap dengan koordinat agar peta langsung tampil).

> **Database sudah berjalan dari versi lama (≤ v1.1.0)?** Tidak perlu menjalankan ulang `schema.sql` — cukup jalankan `sql/migrasi_verval.sql` sekali untuk menambah tabel **verval_izin_praktik**, **verval_fasyankes**, **verval_draft** (draf otomatis multi-form) beserta RLS-nya, sekaligus membuat kolom `nik` tidak wajib (v1.2.1). Script ini idempotent — aman juga dijalankan pada database yang sudah pernah dimigrasi sebagian.
>
> **Database dari versi lama dan hanya ingin efek v1.2.1 (NIK tidak wajib)?** Jalankan `sql/migrasi_hapus_nik.sql` saja.

### 3. Konfigurasi Auth
1. Buka **Authentication → Sign In / Providers → Email**.
2. **Nonaktifkan** opsi *Confirm email* agar pembuatan akun oleh admin berjalan tanpa konfirmasi email.

### 4. Buat Admin Pertama
1. **Authentication → Users → Add user** → isi email & password.
2. Profil otomatis dibuat oleh trigger dengan role `operator`.
3. Promosikan ke admin via **SQL Editor**:
   ```sql
   update profiles set role = 'admin' where email = 'email-anda@contoh.com';
   ```
4. Selanjutnya admin dapat menambah/mengubah pengguna langsung dari menu **Kelola Pengguna** di aplikasi.

### 5. Isi Konfigurasi Aplikasi
Buka `js/config.js`, isi dari **Project Settings → API**:

```js
window.SIMANTRI_CONFIG = {
  SUPABASE_URL: 'https://xxxxxxxxxxxx.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOi...(anon / public)',
};
```

> **Catatan keamanan:** `anon key` memang dipublikasikan di frontend — bukan `service_role`. Keamanan ditegakkan **Row Level Security** di database (lihat `sql/schema.sql`). Jangan pernah menaruh `service_role key` di aplikasi ini.

### 6. Uji Lokal
ES module tidak berjalan lewat `file://` langsung, gunakan server statis:

```bash
python3 -m http.server 8080
# lalu buka http://localhost:8080
```

---

## Deploy ke GitHub Pages

1. Buat repository GitHub, mis. `simantri`.
2. Unggah **seluruh isi folder aplikasi** (bukan foldernya) ke root repo:
   ```bash
   git init
   git add .
   git commit -m "SIMANTRI v1.0"
   git branch -M main
   git remote add origin https://github.com/USERNAME/simantri.git
   git push -u origin main
   ```
3. Buka **Settings → Pages → Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **main** / folder: **/ (root)**
4. Aplikasi terbit di: `https://USERNAME.github.io/simantri/`

---

## Role & Hak Akses (ditegakkan RLS di database)

| Aksi | Admin | Verifikator | Operator |
|---|:---:|:---:|:---:|
| Melihat dashboard, peta, tabel, cek verifikasi | ✅ | ✅ | ✅ |
| Menambah data (Bagian 2) & monev | ✅ | — | ✅ |
| Mengedit data | ✅ | hanya status verifikasi | ✅ |
| Menghapus data | ✅ | — | — |
| Setujui / Tolak pengajuan (Bagian 3) | ✅ | ✅ | — |
| Mengisi & mengirim Formulir Verval Izin Praktik | ✅ | ✅ | — |
| Mengisi & mengirim Formulir Verval Fasyankes | ✅ | ✅ | — |
| Melihat riwayat & detail verval (praktik & faskes) | ✅ | ✅ | ✅ |
| Menghapus catatan verval (praktik & faskes) | ✅ | — | — |
| Kelola pengguna & assign role (Bagian 4) | ✅ | — | — |

> Polisi `SELECT` saat ini **publik** agar dashboard/peta dapat dibuka tanpa login (sesuai alur landing → `#beranda`). Untuk menutupnya, ubah `using (true)` pada policy select menjadi `using (auth.uid() is not null)` di `sql/schema.sql`.

---

## Fitur

- **Landing splash** 3 detik dengan logo + progress bar → fade otomatis ke `#beranda` tanpa reload.
- **Layout**: sidebar kiri fixed 280px (collapsible di mobile) + topbar + content.
- **Bagian 1 — Overview**: Dashboard (5 kartu statistik pop-up + grafik bar sebaran per kecamatan), Petunjuk Penggunaan (accordion), Peta Sebaran Praktik (Leaflet, pusat Tenggarong −0.4419, 117.0861), Notifikasi Expired SIP/STR (badge merah/kuning/hijau, H-30).
- **Bagian 2 — Manajemen Data**: CRUD penuh Tenaga Medis, Tenaga Kesehatan, Fasyankes, Praktik Mandiri — form tambah/edit via modal, klik baris → modal detail.
- **Bagian 3 — Perizinan**: **Verifikasi Praktik** (3 tab: *Formulir Verval* 27 field — tanpa data NIK, draf tersimpan otomatis ke tabel `verval_draft` per pengguna, preview sebelum kirim, kode verifikasi unik; *Riwayat Verval* — daftar + detail lengkap + pencarian, hapus khusus admin; *Pengajuan Praktik* — approve/reject + catatan) dan **Verifikasi Faskes** (3 tab: *Formulir Verval Fasyankes* — ID verval otomatis `VF-YYYYMMDD-XXXXX`, data fasilitas + alamat/kontak + **SDM Kesehatan dinamis sesuai jenis fasyankes** (RS, Puskesmas, Klinik, Apotik, Toko Obat, Optik, PBF, Praktik Mandiri), hasil verifikasi Layak/Tidak Layak/Perbaikan/Pending/Tidak Valid, draf otomatis; *Riwayat Verval* + detail & hapus admin; *Pengajuan Faskes* — approve/reject), Cek Hasil Verifikasi (nama), Monev Izin (kunjungan, temuan, tindak lanjut, upload foto ke Supabase Storage).
- **Bagian 4 — Manajemen User**: hanya admin — CRUD pengguna, assign role (admin/verifikator/operator).
- Semua kartu statistik & baris tabel membuka **modal detail live** dari Supabase (bukan alert).

---

## Riwayat Versi

- **v1.2.1** — Pembersihan data NIK: seluruh form/tabel/riwayat/pencarian tidak lagi mengumpulkan atau menampilkan NIK (kolom `nik` di DB menjadi opsional — jalankan `sql/migrasi_hapus_nik.sql` atau `sql/migrasi_verval.sql` terbaru pada database lama), kode verifikasi menjadi `SIMANTRI-VERVAL-<timestamp>`, dan seluruh penamaan wilayah diganti dari Kota Samarinda ke **Kabupaten Kutai Kartanegara** (20 kecamatan resmi, pusat peta Tenggarong, data demo seed disesuaikan).
- **v1.2.0** — Menu Verifikasi Faskes dikembangkan: Formulir Verval Fasyankes (ID otomatis VF-, SDM Kesehatan dinamis per jenis fasyankes, 5 hasil verifikasi), tabel baru `verval_fasyankes`, tabel `verval_draft` menjadi multi-form (praktik & faskes, PK komposit user_id+form), data demo verval fasyankes pada `seed.sql`.
- **v1.1.0** — Menu Verifikasi Praktik dikembangkan: Formulir Verval Izin Praktik 28 field (adaptasi formulir verval SatuSehat SDMK), tabel baru `verval_izin_praktik` + `verval_draft` (draf otomatis per pengguna — pengganti localStorage), migrasi terpisah `sql/migrasi_verval.sql`, data demo verval pada `seed.sql`.
- **v1.0.3** — Perbaikan seed.sql (overriding system value + sinkronisasi sequence identity).
- **v1.0.2** — Perbaikan empty-state dashboard; cache-buster anti file lama.
- **v1.0.1** — Perbaikan error file lama/404; penanda versi console.
- **v1.0.0** — Rilis awal (13 halaman, 3 role, dashboard, peta, expired H-30, CRUD, verifikasi, monev, manajemen pengguna).
