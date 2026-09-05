# SIMANTRI v2 — Sistem Informasi & Manajemen Praktik Nakes

> **SIMANTRI** = Sistem Informasi dan Manajemen Praktik Tenaga Medis dan Tenaga Kesehatan di Fasyankes dan Praktik Mandiri.
>
> Platform digital untuk **Dinas Kesehatan**, **Admin Fasyankes** (RS / Puskesmas / Klinik / Apotek / Praktik Mandiri), dan **Tenaga Kesehatan** untuk mendata, memverifikasi, dan memonitoring legalitas praktik.

Dibangun dengan **Vite + Tailwind CSS + Supabase**. Dirancang untuk **deploy statis di GitHub Pages** — pengguna cukup membuka URL di browser, **tidak perlu install Node.js atau menjalankan server lokal**.

---

## 🚀 Cara Pakai untuk Pengguna Akhir (End User)

Pengguna **TIDAK perlu** melakukan setup teknis. Cukup:

1. Buka URL GitHub Pages di browser (Chrome / Edge / Firefox):
   ```
   https://USERNAME.github.io/simantri-nakes-v2/
   ```
2. Aplikasi langsung tampil dan siap dipakai.

> Jika Supabase belum dikonfigurasi oleh admin, aplikasi otomatis masuk **Demo Mode** dengan data contoh — tetap bisa dijelajahi tanpa error.

---

## 🛠️ Setup untuk Developer / Admin (sekali saja)

Berikut langkah-langkah untuk deploy aplikasi ke GitHub Pages. Dilakukan **sekali** oleh developer/admin, setelah itu pengguna cukup buka URL.

### Langkah 1: Upload Project ke GitHub

```bash
# Inisialisasi repo lokal
cd simantri-v2
git init
git add .
git commit -m "feat: SIMANTRI v2 — initial deploy"

# Buat repo di GitHub bernama "simantri-nakes-v2" (atau nama lain)
# Lalu push
git branch -M main
git remote add origin https://github.com/USERNAME/simantri-nakes-v2.git
git push -u origin main
```

> 💡 Anda juga bisa upload via GitHub web UI (drag-drop folder) jika belum terbiasa dengan git.

### Langkah 2: Aktifkan GitHub Pages

1. Buka repo di GitHub → **Settings** → **Pages**
2. Pada bagian **Build and deployment → Source**, pilih **GitHub Actions**
3. Selesai. Workflow akan otomatis jalan setiap Anda push ke branch `main`.

### Langkah 3: Tambahkan Supabase Credentials (opsional)

Jika ingin menggunakan backend Supabase asli (bukan Demo Mode):

1. Buat project gratis di [supabase.com](https://supabase.com)
2. Buka **Project Settings → API** → copy **Project URL** dan **anon public key**
3. Di repo GitHub → **Settings → Secrets and variables → Actions → New repository secret**:
   - Name: `VITE_SUPABASE_URL` → Value: URL Supabase Anda
   - Name: `VITE_SUPABASE_ANON_KEY` → Value: anon key Supabase Anda
4. Setup database: buka **Supabase Dashboard → SQL Editor** → paste isi [`supabase/schema.sql`](./supabase/schema.sql) → klik **Run**
5. Buat akun admin: di **Authentication → Users → Add user** (centang "Auto Confirm"), lalu jalankan SQL:
   ```sql
   update public.profiles
   set role = 'dinkes', full_name = 'Admin Dinkes'
   where email = 'email-anda@domain.go.id';
   ```

> ⚠️ **PENTING**: Jangan pernah tambahkan `service_role` key ke Repository Secrets frontend. Hanya `anon key` yang aman — keamanan data dijamin oleh **Row Level Security (RLS)** yang sudah dikonfigurasi di `schema.sql`.

### Langkah 4: Tunggu GitHub Actions Selesai

1. Buka repo → tab **Actions**
2. Tunggu workflow **"Deploy to GitHub Pages"** selesai (± 1-2 menit)
3. Lihat URL production di: **Settings → Pages** atau pada output workflow

### Langkah 5: Buka URL di Browser

```
https://USERNAME.github.io/simantri-nakes-v2/
```

Selesai. Aplikasi live dan bisa diakses siapa pun.

---

## 📁 Struktur Proyek

```
simantri-nakes-v2/
├── index.html                          # Shell utama
├── package.json                        # Dependencies + scripts
├── vite.config.js                      # Vite config (base path dinamis untuk GitHub Pages)
├── tailwind.config.js
├── postcss.config.js
├── .env.example                        # Template env vars
├── .gitignore
├── README.md
│
├── .github/workflows/
│   └── deploy.yml                      # Auto build + deploy ke GitHub Pages
│
├── public/
│   ├── favicon.svg
│   └── 404.html                        # SPA fallback (menghindari 404 saat refresh)
│
├── supabase/
│   └── schema.sql                      # Database schema + RLS policies
│
└── src/
    ├── main.js                         # Entry point
    ├── styles/main.css                 # Tailwind + custom components
    ├── components/layout/              # Sidebar, Header, StatCard
    ├── pages/                          # 12 halaman modular (HTML + JS)
    └── assets/js/
        ├── supabase.js                 # Supabase client (anon key dari env)
        ├── auth.js                     # Auth helper
        ├── app.js                      # Router + loadComponent
        ├── pages-bootstrap.js
        ├── demo-data.js                # Fallback mock data (Demo Mode)
        └── utils.js
```

---

## ✨ Fitur Aplikasi

- **Dashboard Monitoring** — ringkasan real-time: total nakes, fasyankes, status STR/SIP
- **Peta Sebaran Praktik** — visualisasi geografis lokasi fasyankes
- **Notifikasi Expired** — peringatan dini STR/SIP H-90 (warna amber)
- **Data Tenaga Medis** — Dokter, Dokter Gigi, Dokter Spesialis + modal detail + timeline perizinan
- **Data Tenaga Kesehatan** — Perawat, Bidan, Apoteker, TTK, ATLM, Gizi, Kesling
- **Data Fasyankes** — RS, Puskesmas, Klinik, Apotek, Praktik Mandiri
- **Jadwal Praktik** — tampilan mingguan
- **Verifikasi STR & SIP** — kanban board approve/reject
- **Perpanjangan & Rekomendasi** — form dengan validasi + dropzone file
- **Laporan & Rekap Dinkes** — chart 6 bulan + insight + export
- **Manajemen User & Role** — Dinkes-only, dengan matrix permission
- **Pengaturan & Audit Log** — preferensi notifikasi + log audit

---

## 🎨 Design System

**Style**: Clean Health + Energetic SaaS (referensi: Vercel + Doctolib)

| Token | Warna | Penggunaan |
|---|---|---|
| `teal-600`  | `#0D9488` | Primary |
| `lime-500`  | `#84CC16` | Accent |
| `amber-500` | `#F59E0B` | Alert (H-90 expired) |
| `rose-500`  | `#F43F5E` | Danger (expired) |
| `ink-900`   | `#0F172A` | Sidebar, body text |
| `white`     | `#FFFFFF` | Base |

---

## 🔒 Konfigurasi Deployment (GitHub Pages)

### Base Path

`vite.config.js` otomatis menyesuaikan base path:

| Mode | Base | Contoh URL |
|---|---|---|
| Dev lokal | `/` | `http://localhost:5173/` |
| User/Org page | `/` | `https://USERNAME.github.io/` |
| Project page | `/REPO_NAME/` | `https://USERNAME.github.io/simantri-nakes-v2/` |

GitHub Actions **otomatis detect** jenis page dari nama repo — Anda tidak perlu set manual.

### SPA Routing (anti-404)

- Router memakai **hash-based routing** (`#/dashboard`, `#/data-nakes`, dst.)
- Refresh halaman manapun **tidak akan 404** karena hash tidak dikirim ke server
- Tambahan: `public/404.html` sebagai safety net untuk URL non-hash yang ter-share

### Asset Paths

Semua asset (CSS, JS, SVG, favicon) dirujuk dengan **relative path** (`./favicon.svg`, `./src/main.js`) atau di-rewrite otomatis oleh Vite menggunakan `import.meta.env.BASE_URL` — kompatibel di subpath manapun.

---

## 🧱 Arsitektur

### Component Loading — `loadComponent(id, path)`

`src/assets/js/app.js` menyediakan fungsi pemuat fragmen HTML modular:

```js
import { loadComponent } from '@/assets/js/app.js';
await loadComponent('view-slot', 'pages/dashboard');
```

Implementasi: `import.meta.glob('/src/**/*.html', { query: '?raw', eager: true })` — semua HTML di-bundle ke JS saat build time. Hasil: 1 request JS, tanpa runtime fetch yang bisa gagal di GitHub Pages subpath.

### Role-Based Access (RBAC)

| Role | Lihat Semua | Lihat Fasyankes Sendiri | Lihat Diri Sendiri | Manajemen User |
|---|---|---|---|---|
| `dinkes`     | ✅ | ✅ | ✅ | ✅ |
| `fasyankes`  | ❌ | ✅ | ✅ | ❌ |
| `nakes`      | ❌ | ❌ | ✅ | ❌ |

Diterapkan via **Supabase RLS** di `supabase/schema.sql` + helper function `is_dinkes()` & `current_user_fasyankes()`.

---

## 🗃️ Skema Database

Lihat lengkap di [`supabase/schema.sql`](./supabase/schema.sql). Tabel utama:

- `profiles` — user dengan role (dinkes/fasyankes/nakes)
- `fasyankes` — RS/Puskesmas/Klinik/Apotek/Praktik Mandiri
- `tenaga_kesehatan` — data nakes + STR + status verifikasi
- `praktik` — SIP/SIK/Rekomendasi + jadwal praktik
- `notifications` — notifikasi expired
- `audit_log` — log aktivitas user

---

## 📦 Scripts

| Command | Description |
|---|---|
| `npm run dev`     | Dev server lokal (hot reload) |
| `npm run build`   | Build production ke `dist/` |
| `npm run preview` | Preview build production |
| `npm run deploy:gh` | Build + deploy via gh-pages (alternatif) |

> **Catatan**: Pengguna akhir **TIDAK perlu** menjalankan command di atas. Command ini hanya untuk developer. End user cukup buka URL GitHub Pages.

---

## 🆘 Troubleshooting

**Q: Setelah deploy, halaman blank / asset 404**
A: Cek `vite.config.js` base path. Untuk project page, harus `/REPO_NAME/`. GitHub Actions sudah auto-set ini — pastikan workflow berhasil (tab Actions).

**Q: Refresh halaman 404**
A: Tidak akan terjadi — router pakai hash. Jika tetap 404, pastikan `public/404.html` ikut ter-build (cek folder `dist/`).

**Q: Aplikasi tampil tapi data kosong / "Memuat..." terus**
A: Aplikasi jalan di **Demo Mode** karena `VITE_SUPABASE_URL` belum di-set. Tambahkan sebagai Repository Secret di GitHub (lihat Langkah 3 di atas).

**Q: Login gagal setelah Supabase dikonfigurasi**
A: Pastikan user sudah di-create di Supabase Auth dan profile-nya ada di tabel `profiles` (auto-created via trigger saat signup). Untuk jadi Dinkes, jalankan SQL update `role = 'dinkes'`.

**Q: RLS memblokir akses data**
A: Cek di Supabase Dashboard → Table Editor. Pastikan user login dan role-nya benar. Debug dengan SQL:
```sql
select public.is_dinkes(), public.current_user_role(), public.current_user_fasyankes();
```

**Q: Workflow GitHub Actions gagal**
A: Buka tab Actions → klik workflow yang gagal → lihat log. Pastikan:
- `package-lock.json` sudah di-commit (untuk `npm ci`)
- Repository Secrets `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY` sudah ditambahkan (atau hapus baris tersebut di `deploy.yml` untuk Demo Mode)
- Source: **Settings → Pages → Source: GitHub Actions**

---

## 📄 Lisensi

MIT License — bebas digunakan untuk keperluan pemerintah & non-profit.

---

Dibuat untuk Pemerintah Indonesia • **SIMANTRI v2.0** • 2026
