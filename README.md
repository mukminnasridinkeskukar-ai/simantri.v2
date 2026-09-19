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
│   ├── buku_pelihat.js # Halaman Buku 1 (Petunjuk Pembaca) sebagai gambar flipbook baca-saja (dibuat otomatis)
│   └── app.js          # Router hash + auth + CRUD + verifikasi + peta + grafik
├── docs/
│   └── petunjuk-admin-simantri.pdf  # Buku 2 — Petunjuk untuk Admin (di Panel Admin → tab Petunjuk Admin)
├── assets/
│   └── logo.svg        # Logo SIMANTRI
├── sql/
│   ├── schema.sql           # SEMUA tabel + RLS + trigger + bucket (WAJIB untuk database baru) — selaras menu v1.6.0
│   ├── migrasi_v1.6.0.sql   # PERBAIKAN database lama/berubah: membuat tabel & kolom yang hilang, menyelaraskan RLS + aturan akses Perizinan — data lama dijaga
│   └── seed.sql             # Data demo opsional (fasyankes/praktik Kab. Kutai Kartanegara + koordinat, tanpa NIK)
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

> **Database sudah berjalan dari versi lama, atau pernah berubah (tabel/kolom terhapus, tidak sinkron)?** Tidak perlu menjalankan ulang `schema.sql` — cukup jalankan `sql/migrasi_v1.6.0.sql` sekali. Script ini MEMERIKSA seluruh struktur yang dibutuhkan aplikasi v1.6.0 (9 tabel, seluruh kolom, fungsi, trigger, index, RLS termasuk **aturan akses Perizinan terbaru**), MEMBUAT yang hilang, dan MENYELARASKAN yang berbeda — tanpa menghapus data apa pun. Idempotent: aman dijalankan berulang. Wajib dijalankan agar **Bagian 3 — Perizinan** berfungsi untuk akun Admin/Operator (policy verval & monev diperbarui).

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
4. Selanjutnya admin dapat menambah/mengubah pengguna langsung dari **Panel Admin** (Bagian 4) — tab **Pengguna** — di aplikasi.

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
| Melihat dashboard, peta, tabel, cek verifikasi (Bagian 1–2) | ✅ | ✅ | ✅ |
| **Membuka menu Bagian 3 — Perizinan (v1.6.0, wajib login)** | ✅ | — | ✅ |
| Menambah data (Bagian 2) | ✅ | — | ✅ |
| Mengedit data (Bagian 2) | ✅ | hanya status verifikasi* | ✅ |
| Mengedit catatan verval (praktik & faskes) | ✅ | — | ✅ |
| Menghapus data | ✅ | — | — |
| Setujui / Tolak pengajuan (Bagian 3) | ✅ | — | ✅ |
| Mengisi & mengirim Formulir Verval Izin Praktik | ✅ | — | ✅ |
| Mengisi & mengirim Formulir Verval Fasyankes | ✅ | — | ✅ |
| Melihat riwayat & detail verval (praktik & faskes) | ✅ | — | ✅ |
| Menghapus catatan verval (praktik & faskes) | ✅ | — | — |
| Menambah & mengedit catatan Monev Izin | ✅ | — | ✅ |
| Kelola pengguna & assign role (Bagian 4) | ✅ | — | — |

\* hak edit lama di policy Bagian 2 dipertahankan demi data lama, namun sejak v1.6.0 halaman Perizinan tidak dapat dibuka oleh verifikator (kartu "Akses Ditolak").

> **Aturan akses v1.6.0:** seluruh menu **Bagian 3 — Perizinan** (Verifikasi Praktik, Verifikasi Faskes, Monev Izin) **wajib login** dan hanya untuk **Admin & Operator** — ditegakkan di sidebar, router (kartu Wajib Masuk / Akses Ditolak), tombol aksi, dan policy RLS `can_input()`. Policy `SELECT` tetap publik agar **Dashboard/Peta/Cek Hasil Verifikasi** (Bagian 1) dapat dibuka tanpa login — pengunjung umum tetap dapat mengecek hasil verifikasi tanpa melihat menu Perizinan.

---

## Fitur

- **Landing splash** 3 detik dengan logo + progress bar → fade otomatis ke `#beranda` tanpa reload.
- **Layout**: sidebar kiri fixed 280px (collapsible di mobile) + topbar + content.
- **Bagian 1 — Overview**: Dashboard (5 kartu statistik pop-up + grafik bar sebaran per kecamatan), Petunjuk Penggunaan (dua tab: **Buku Petunjuk Pembaca** — flipbook baca-saja tanpa unduh — dan **Ringkasan Cepat** accordion), Peta Sebaran Praktik (Leaflet, pusat Tenggarong −0.4419, 117.0861), Notifikasi Expired SIP/STR (badge merah/kuning/hijau, H-30), **Cek Hasil Verifikasi** (pencarian status berdasarkan nama). Nomor STR otomatis **disembunyikan dari pengunjung yang belum masuk** (privasi pembaca; penuh hanya untuk pengguna login).
- **Bagian 2 — Manajemen Data**: CRUD penuh Fasyankes & Praktik Mandiri — form tambah/edit via modal, klik baris → modal detail. Data **Tenaga Medis & Tenaga Kesehatan dikelola melalui Panel Admin** (Bagian 4, tab Tenaga Medis & Tenaga Kesehatan).
- **Bagian 3 — Perizinan (WAJIB LOGIN — hanya Admin & Operator sejak v1.6.0)**: menu tidak tampil bagi pengunjung/verifikator; akses langsung via URL menampilkan kartu **Wajib Masuk**/**Akses Ditolak**. **Verifikasi Praktik** (3 tab: *Formulir Verval* 27 field — tanpa data NIK, draf tersimpan otomatis ke tabel `verval_draft` per pengguna, preview sebelum kirim, kode verifikasi unik; *Riwayat Verval* — daftar + detail lengkap + pencarian, hapus khusus admin; *Pengajuan Praktik* — approve/reject + catatan), **Verifikasi Faskes** (3 tab: *Formulir Verval Fasyankes* — ID verval otomatis `VF-YYYYMMDD-XXXXX`, data fasilitas + alamat/kontak + **SDM Kesehatan dinamis sesuai jenis fasyankes** (RS, Puskesmas, Klinik, Apotik, Toko Obat, Optik, PBF, Praktik Mandiri), hasil verifikasi Layak/Tidak Layak/Perbaikan/Pending/Tidak Valid, draf otomatis; *Riwayat Verval* + detail & hapus admin; *Pengajuan Faskes* — approve/reject) dan Monev Izin (kunjungan, temuan, tindak lanjut, upload foto ke Supabase Storage). Masyarakat tetap dapat mengecek status melalui **Cek Hasil Verifikasi** (Bagian 1) tanpa login.
- **Bagian 4 — Panel Admin**: hanya admin — **seluruh menu aplikasi tersedia sebagai tab terpisah dalam satu konten** (ringkasan, tenaga medis, tenaga kesehatan, fasyankes, praktik mandiri, verval praktik & faskes, cek verifikasi, monev, izin expired, peta, petunjuk, **petunjuk admin**, pengguna) + **kolom Aksi berisi tombol Edit/Hapus pada setiap baris** semua tabel yang berfungsi lengkap ke Supabase, termasuk **edit catatan verval izin praktik & verval fasyankes** (SDM kesehatan dinamis ikut dapat diedit). Tab **Petunjuk Admin** menyajikan Buku 2 (PDF) yang dapat dibaca langsung maupun diunduh.
- Semua kartu statistik & baris tabel membuka **modal detail live** dari Supabase (bukan alert).

---

## Riwayat Versi

- **v1.6.0** — **Penguatan akses Bagian 3 — Perizinan**: seluruh menu perizinan (Verifikasi Praktik, Verifikasi Faskes, Monev Izin) kini **wajib login dan hanya untuk Admin & Operator** — tidak diperkenankan bagi pengunjung umum maupun role lain. Ditegakkan berlapis: (1) sidebar — Bagian 3 disembunyikan bagi yang tidak berhak; (2) router — akses langsung via URL menampilkan kartu **Wajib Masuk** (belum login, tombol masuk tersedia) atau **Akses Ditolak** (login tapi bukan Admin/Operator); (3) tombol aksi — kirim verval, edit catatan verval, setujui/tolak pengajuan, tambah/edit monev kini memakai gerbang Admin/Operator; (4) **RLS database** — policy INSERT/UPDATE `verval_izin_praktik`, `verval_fasyankes` & `monev_izin` (schema.sql + `migrasi_v1.6.0.sql`) kini memakai `can_input()` (admin+operator); `SELECT` tetap publik agar Cek Hasil Verifikasi (Bagian 1) tetap berfungsi tanpa login. `migrasi_v1.5.0.sql` digabung ke `migrasi_v1.6.0.sql` (sekali jalan, idempotent, data dijaga). Petunjuk dalam aplikasi & README disesuaikan.
- **v1.5.1** — **Pembangunan ulang folder `sql/` agar selaras dengan struktur menu terbaru (v1.5.1)**: (1) `schema.sql` ditulis ulang — dokumentasi akses per Bagian menu (Bagian 1 publik baca 7 tabel data; Bagian 2–3 CRUD sesuai role; Bagian 4 Panel Admin), 9 tabel lengkap dengan fungsi bantu, trigger, index, RLS & bucket storage, tetap idempotent; (2) `sql/migrasi_v1.5.0.sql` baru — **satu script perbaikan** untuk database lama/berubah: membuat tabel & kolom yang hilang (`add column if not exists`), memastikan PK komposit draf, menyelaraskan RLS — tanpa menghapus data (menggantikan `migrasi_verval.sql` + `migrasi_hapus_nik.sql` yang diarsipkan); (3) **Perbaikan bug `seed.sql`**: baris demo verval praktik no. 2 memuat `sdmk_admin='Belum'` yang melanggar CHECK constraint (`'Ada'/'Tidak Ada'`) sehingga seed GAGAL dijalankan — kini `'Tidak Ada'`; seluruh 47 nilai enum seed tervalidasi otomatis terhadap constraint schema. Konsistensi SQL ↔ aplikasi diverifikasi silang (tabel/kolom `.from()` app.js, konstanta `PROFESI_TK`/`JENIS_FASKES`/`JENIS_PRAKTIK` vs CHECK, 9× RLS, bucket monev).

- **v1.5.0** — **Dua buku petunjuk PDF terpisah**: (1) **Buku 1 — Petunjuk untuk Pembaca** (10 halaman): tersaji sebagai **flipbook baca-saja** pada menu Petunjuk Penggunaan — halaman disajikan sebagai gambar dan **tidak ada berkas PDF di hosting sehingga tidak dapat diunduh** (klik kanan & seret dinonaktifkan, navigasi tombol/panah/lompat halaman); (2) **Buku 2 — Petunjuk untuk Admin** (14 halaman): tersedia di **Panel Admin → tab Petunjuk Admin** dengan pratinjau tersemat + tombol **Unduh PDF** (berkas di `docs/petunjuk-admin-simantri.pdf`). Kedua buku memakai sampul & palet teal resmi (Penyusun: Mukmin Nasri, S.Kep) dan sudah disesuaikan dengan struktur menu v1.4.0.

- **v1.4.0** — Penataan ulang menu: (1) **Cek Hasil Verifikasi dipindah ke Bagian 1 — Overview** (ikut di dashboard aksi cepat); (2) **No. STR disembunyikan dari pembaca yang belum login** — termasuk detail Notifikasi Expired & detail Riwayat Verval (mask `••••••••`, penuh hanya untuk pengguna masuk); (3) **Menu Data Tenaga Medis & Data Tenaga Kesehatan dihapus dari Bagian 2** — pengelolaan data tenaga kini melalui **Panel Admin (Bagian 4)** tab Tenaga Medis & Tenaga Kesehatan (CRUD lengkap tetap berfungsi). Petunjuk penggunaan di dalam aplikasi disesuaikan.

- **v1.3.0** — Pengembangan Bagian 4 menjadi **Panel Admin**: seluruh menu (13 halaman) kini tersedia sebagai **tab berbeda dalam satu konten** pada satu halaman khusus admin. Setiap tabel di seluruh aplikasi diakhiri **kolom Aksi (Edit/Hapus per baris)** yang berfungsi lengkap — termasuk edit langsung catatan verval izin praktik & verval fasyankes (verifikator/admin) dan edit data SIP dari daftar expired. Perbaikan: halaman aktif kini otomatis di-render ulang setelah login/logout (kartu "Akses Ditolak" langsung terbuka setelah masuk sebagai admin).

- **v1.2.1** — Pembersihan data NIK: seluruh form/tabel/riwayat/pencarian tidak lagi mengumpulkan atau menampilkan NIK (kolom `nik` di DB menjadi opsional — untuk database lama kini cukup `sql/migrasi_v1.5.0.sql`; file `migrasi_hapus_nik.sql`/`migrasi_verval.sql` lama sudah digabung ke dalamnya), kode verifikasi menjadi `SIMANTRI-VERVAL-<timestamp>`, dan seluruh penamaan wilayah diganti dari Kota Samarinda ke **Kabupaten Kutai Kartanegara** (20 kecamatan resmi, pusat peta Tenggarong, data demo seed disesuaikan).
- **v1.2.0** — Menu Verifikasi Faskes dikembangkan: Formulir Verval Fasyankes (ID otomatis VF-, SDM Kesehatan dinamis per jenis fasyankes, 5 hasil verifikasi), tabel baru `verval_fasyankes`, tabel `verval_draft` menjadi multi-form (praktik & faskes, PK komposit user_id+form), data demo verval fasyankes pada `seed.sql`.
- **v1.1.0** — Menu Verifikasi Praktik dikembangkan: Formulir Verval Izin Praktik 28 field (adaptasi formulir verval SatuSehat SDMK), tabel baru `verval_izin_praktik` + `verval_draft` (draf otomatis per pengguna — pengganti localStorage), migrasi terpisah `sql/migrasi_verval.sql`, data demo verval pada `seed.sql`.
- **v1.0.3** — Perbaikan seed.sql (overriding system value + sinkronisasi sequence identity).
- **v1.0.2** — Perbaikan empty-state dashboard; cache-buster anti file lama.
- **v1.0.1** — Perbaikan error file lama/404; penanda versi console.
- **v1.0.0** — Rilis awal (13 halaman, 3 role, dashboard, peta, expired H-30, CRUD, verifikasi, monev, manajemen pengguna).
