# SIMANTRI v3 — Sistem Informasi & Manajemen Praktik Nakes

> Platform Digital Pengelolaan Izin Praktik untuk **Dinas Kesehatan Kutai Kartanegara**.
> Sesuai schema database v1.1 dengan tabel: `pengumuman`, `verval_izin_praktik`, `verval_fasyankes`, `profil_sdmk`, `users`, `logs`, `izin`.

**Versi 3** — No-build, plain HTML/CSS/JS. **Bisa langsung dibuka di browser dengan double-click** tanpa `npm install`, tanpa Vite, tanpa server lokal.

---

## ✨ Cara Pakai Paling Sederhana

### Opsi A: Buka langsung di komputer Anda
1. Extract file ZIP ke folder mana saja
2. Double-click file `index.html`
3. Browser terbuka → **langsung tampil beranda** dengan data publik ✅
4. (Opsional) Klik tombol **"Login Admin"** di header untuk akses input data

### Opsi B: Upload ke GitHub Pages
1. Upload semua file ke repository GitHub (drag-drop via web UI juga bisa)
2. Settings → Pages → **Source: Deploy from a branch** → pilih `main` / `/ (root)`
3. Tunggu 1-2 menit
4. Buka `https://USERNAME.github.io/NAMA-REPO/` → **langsung tampil beranda**

---

## 👥 Dua Mode Akses

### 1. Mode Pengunjung (Public Viewer) — DEFAULT saat buka aplikasi
- ✅ Bisa lihat seluruh data di **Bagian 1 (Overview)**: Dashboard, Pengumuman, Notifikasi Expired
- ❌ TIDAK bisa akses Bagian 2 (Input Data) & Bagian 3 (Sistem) — akan diminta login

### 2. Mode Admin/Operator — setelah klik "Login Admin"
- **Admin** (`admin` / `admin123`): Full access — bisa lihat semua + CRUD di Bagian 2 & 3
- **Operator** (`operator` / `operator123`): View-only — bisa lihat Bagian 2 & 3 tapi TIDAK bisa tambah/edit/hapus

### Cara Login
1. Klik tombol **"Login Admin"** di pojok kanan header
2. Muncul modal login
3. Klik kartu akun demo (auto-fill) atau ketik manual:
   - Username: `admin` atau `operator`
   - Password: `admin123` atau `operator123`
4. Klik **"Masuk"** → mendapat akses sesuai role
5. Untuk logout: klik icon logout di header

---

## 📋 Struktur Menu

### BAGIAN 1: OVERVIEW (Public + Admin)
- **Dashboard Monitoring** — 5 stat cards + 3 charts + Ringkasan Verval Fasyankes + Pengumuman Terbaru
- **Pengumuman** — list pengumuman (read-only)
- **Notifikasi Expired** — daftar STR/SIP yang sudah expired

### BAGIAN 2: INPUT DATA (Admin/Operator only)
Data yang diinput di sini akan otomatis tampil di Bagian 1:
- **Input Pengumuman** — CRUD pengumuman (judul, isi, is_penting)
- **Input Profil SDMK** — CRUD profil SDMK (NIK, nama, jenis tenaga, STR, SIP, unit kerja)
- **Input Verval Izin Praktik** — CRUD verval izin (27 fields dalam 7 sections)
- **Input Verval Fasyankes** — CRUD verval fasyankes + SDM
- **Input Pengajuan Izin** — CRUD pengajuan izin (Baru/Perpanjangan, status approval)

### BAGIAN 3: SISTEM (Admin only)
- **Manajemen User** — CRUD user (username, password, role, is_active)
- **Pengaturan & Audit Log** — lihat audit log + info sistem

---

## 🔐 Akun Demo

| Username | Password | Role | Akses |
|---|---|---|---|
| `admin` | `admin123` | admin | Full access — semua menu & semua aksi CRUD |
| `operator` | `operator123` | operator | View-only di Bagian 2 & 3 (tidak bisa CRUD) |

> Login memakai **username** (bukan email). Akun ini sudah di-seed di `supabase/schema.sql` section 10a.

### Session tidak persisten
Aplikasi **TIDAK menyimpan session** di localStorage. Refresh browser = kembali ke Mode Pengunjung.

---

## 🗄️ Schema Database (v1.1)

Mengikuti schema yang sudah disediakan Dinkes Kutai Kartanegara. Lihat `supabase/schema.sql` untuk detail lengkap.

### Tabel utama:
| Tabel | Fungsi | Menu terkait |
|---|---|---|
| `pengumuman` | Pengumuman sistem | Dashboard, Pengumuman, Input Pengumuman |
| `profil_sdmk` | Profil SDMK (NIK, STR, SIP) | Dashboard, Input Profil SDMK |
| `verval_izin_praktik` | Verval izin praktik (27 fields) | Dashboard, Input Verval Izin |
| `verval_fasyankes` | Verval fasyankes | Dashboard, Input Verval Fasyankes |
| `verval_fasyankes_sdm` | SDM per fasyankes (child) | Input Verval Fasyankes |
| `sdm_standar_fasyankes` | Master SDM standar per jenis fasyankes | Input Verval Fasyankes (checkbox dinamis) |
| `izin` | Pengajuan izin praktik | Dashboard, Input Pengajuan Izin |
| `users` | Manajemen user (username/password/role) | Login, Manajemen User |
| `logs` | Audit log | Pengaturan & Audit Log |

### Views untuk dashboard:
- `v_dashboard_stats` — agregasi statistik utama
- `v_vf_summary` — ringkasan verval fasyankes
- `v_sdmk_per_jenis` — distribusi SDMK per jenis tenaga
- `v_status_izin` — distribusi status izin
- `v_sdmk_per_unit` — distribusi SDMK per unit kerja
- `v_verval_izin_detail` — detail verval izin untuk halaman pencarian

---

## 🚀 Setup Production (Opsional — untuk pakai Supabase asli)

Aplikasi sudah jalan di **Demo Mode** tanpa setup. Untuk pakai Supabase asli:

### 1. Buat project Supabase
- Daftar gratis di [supabase.com](https://supabase.com)
- Buat project baru

### 2. Setup database
- Buka **SQL Editor** di dashboard Supabase
- Paste seluruh isi `supabase/schema.sql`
- Klik **Run** — semua tabel, view, trigger, RLS, dan seed data ter-create

### 3. Edit `config.js`
```javascript
window.SIMANTRI_CONFIG = {
  SUPABASE_URL: 'https://YOUR-PROJECT.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR-ANON-KEY',
  // ...
};
```

### 4. Login
Setelah schema.sql dijalankan, 2 user default sudah tersedia:
- `admin` / `admin123`
- `operator` / `operator123`

### 5. Tambah user baru (via SQL Editor):
```sql
INSERT INTO users (username, password, role, full_name, is_active)
VALUES ('userbaru', 'password123', 'operator', 'Nama User Baru', true);
```

---

## 🛠️ Troubleshooting

**Q: Buka aplikasi, langsung tampil beranda?**
A: Ya, itu Mode Pengunjung. Bisa lihat data tanpa login. Klik "Login Admin" untuk CRUD.

**Q: Setelah login, sidebar bertambah?**
A: Ya, dari 3 menu (Overview) jadi 10 menu (+5 Input Data +2 Sistem).

**Q: Operator tidak bisa tambah data?**
A: Ya, hanya admin yang bisa CRUD. Operator view-only. Tombol Tambah/Edit/Hapus otomatis di-hidden.

**Q: Data input tidak muncul di Dashboard?**
A: Refresh halaman Dashboard setelah input data. Atau klik tombol Refresh di Dashboard.

**Q: Login gagal?**
A: Pastikan username & password benar. Demo: `admin` / `admin123` (case-sensitive). Untuk production, pastikan schema.sql sudah dijalankan.

---

## 📦 Struktur Proyek

```
simantri-v3/
├── index.html              # Shell + login modal
├── config.js               # Konfigurasi Supabase
├── .nojekyll               # GitHub Pages
├── README.md
├── css/style.css           # Custom styles
├── supabase/schema.sql     # Schema v1.1 Dinkes Kukar
└── js/
    ├── app.js              # Router + bootstrap
    ├── auth.js             # Auth (username/password via tabel users)
    ├── components.js       # Sidebar + Header + StatCard
    ├── demo-data.js        # Mock data + 27 CRUD functions
    ├── supabase.js         # Supabase client
    ├── utils.js            # Helper utilities
    └── pages/              # 10 halaman modular
        ├── dashboard.js
        ├── pengumuman.js
        ├── notifikasi-expired.js
        ├── input-pengumuman.js
        ├── input-profil-sdmk.js
        ├── input-verval-izin.js
        ├── input-verval-fasyankes.js
        ├── input-izin-praktik.js
        ├── manajemen-user.js
        └── pengaturan.js
```

---

## 📄 Lisensi

MIT License — bebas digunakan untuk keperluan pemerintah & non-profit.

---

Dibuat untuk **Dinas Kesehatan Kutai Kartanegara** • **SIMANTRI v3.0** • 2026
