# SIMANTRI

**Sistem Informasi dan Manajemen Praktik Tenaga Medis dan Tenaga Kesehatan di Fasyankes dan Praktik Mandiri — Kota Samarinda**

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
│   ├── schema.sql      # SEMUA tabel + RLS + trigger + bucket (WAJIB dijalankan)
│   └── seed.sql        # Data demo opsional (fasyankes/praktik Samarinda + koordinat)
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
3. (Opsional) Salin isi `sql/seed.sql` → **Run** untuk data demo (RSUD Samarinda, Puskesmas, praktik bidan, dll. — lengkap dengan koordinat agar peta langsung tampil).

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
| Kelola pengguna & assign role (Bagian 4) | ✅ | — | — |

> Polisi `SELECT` saat ini **publik** agar dashboard/peta dapat dibuka tanpa login (sesuai alur landing → `#beranda`). Untuk menutupnya, ubah `using (true)` pada policy select menjadi `using (auth.uid() is not null)` di `sql/schema.sql`.

---

## Fitur

- **Landing splash** 3 detik dengan logo + progress bar → fade otomatis ke `#beranda` tanpa reload.
- **Layout**: sidebar kiri fixed 280px (collapsible di mobile) + topbar + content.
- **Bagian 1 — Overview**: Dashboard (5 kartu statistik pop-up + grafik bar sebaran per kecamatan), Petunjuk Penggunaan (accordion), Peta Sebaran Praktik (Leaflet, pusat −0.502, 117.154), Notifikasi Expired SIP/STR (badge merah/kuning/hijau, H-30).
- **Bagian 2 — Manajemen Data**: CRUD penuh Tenaga Medis, Tenaga Kesehatan, Fasyankes, Praktik Mandiri — form tambah/edit via modal, klik baris → modal detail.
- **Bagian 3 — Perizinan**: Verifikasi Praktik & Faskes (approve/reject + catatan), Cek Hasil Verifikasi (NIK/nama), Monev Izin (kunjungan, temuan, tindak lanjut, upload foto ke Supabase Storage).
- **Bagian 4 — Manajemen User**: hanya admin — CRUD pengguna, assign role (admin/verifikator/operator).
- Semua kartu statistik & baris tabel membuka **modal detail live** dari Supabase (bukan alert).
