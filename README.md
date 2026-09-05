# SIMANTRI v3 — Sistem Informasi & Manajemen Praktik Nakes

> **SIMANTRI** = Sistem Informasi dan Manajemen Praktik Tenaga Medis dan Tenaga Kesehatan di Fasyankes dan Praktik Mandiri.
>
> Platform digital untuk **Dinas Kesehatan**, **Admin Fasyankes** (RS / Puskesmas / Klinik / Apotek / Praktik Mandiri), dan **Tenaga Kesehatan** untuk mendata, memverifikasi, dan memonitoring legalitas praktik.

**Versi 3** — No-build, plain HTML/CSS/JS. **Bisa langsung dibuka di browser dengan double-click** tanpa `npm install`, tanpa Vite, tanpa server lokal.

---

## ✨ Cara Pakai Paling Sederhana

### Opsi A: Buka langsung di komputer Anda
1. Extract file ZIP ke folder mana saja
2. Double-click file `index.html`
3. Browser terbuka → **muncul halaman login**
4. Login dengan akun demo (lihat di bawah) atau akun Supabase Anda
5. Aplikasi langsung tampil ✅

### Opsi B: Upload ke GitHub Pages
1. Upload semua file ke repository GitHub (drag-drop via web UI juga bisa)
2. Settings → Pages → **Source: Deploy from a branch** → pilih `main` / `/ (root)`
3. Tunggu 1-2 menit
4. Buka `https://USERNAME.github.io/NAMA-REPO/`
5. **Muncul halaman login** → login dengan akun Anda

**Tidak perlu**:
- ❌ `npm install`
- ❌ `npm run dev` / `npm run build`
- ❌ Node.js
- ❌ Command line
- ❌ Server lokal

---

## 🔐 Akun Demo (untuk testing)

Saat aplikasi pertama dibuka, akan muncul **halaman login**. Klik salah satu akun demo di bawah untuk isi otomatis:

| Role | Email | Password | Akses |
|---|---|---|---|
| **Admin Dinkes** | `dinkes@simantri.demo` | `dinkes123` | Full access — semua menu, semua aksi (add, edit, delete, download, print, verify, approve, manajemen user) |
| **Admin Fasyankes** | `fasyankes@simantri.demo` | `fasyankes123` | Akses terbatas — bisa add & edit data, bisa print laporan. TIDAK bisa: download CSV regional, verifikasi, approve/reject, manajemen user, pengaturan sistem |
| **Tenaga Kesehatan** | `nakes@simantri.demo` | `nakes123` | View only — lihat data saja. TIDAK bisa: add, edit, delete, download, print, verify, approve/reject, manajemen user, pengaturan sistem |

> **Tip**: Klik kartu akun demo di halaman login → form terisi otomatis → klik "Masuk"

---

## 🎯 Kenapa v3 Berbeda dari v2?

| Aspek | v2 (lama) | v3 (baru) |
|---|---|---|
| Build tool | Vite + Tailwind CLI | **Tidak ada** (no-build) |
| Module system | ES Modules (`import/export`) | **Plain JS** (`window.*` globals) |
| Tailwind | Build-time compile | **Play CDN** (runtime) |
| Supabase client | npm package | **CDN UMD** |
| Buka via `file://` | ❌ Tidak bisa | ✅ **Bisa** |
| Double-click index.html | ❌ Error MIME | ✅ **Langsung jalan** |
| GitHub Pages setup | GitHub Actions | **Deploy from branch** (lebih simpel) |
| Edit cepat | Perlu build ulang | **Save & refresh** browser |

---

## 📁 Struktur Proyek

```
simantri-v3/
├── index.html                  # Shell utama — TINGGAL DIBUKA di browser
├── config.js                   # Konfigurasi Supabase (edit di sini)
├── .nojekyll                   # Disable Jekyll di GitHub Pages
│
├── css/
│   └── style.css               # Custom styles (components, badges, table)
│
├── js/
│   ├── utils.js                # Helper: fmtDate, escapeHtml, toast, dll
│   ├── supabase.js             # Supabase client & helpers
│   ├── auth.js                 # Auth (sign in/out/signup + role check)
│   ├── demo-data.js            # Mock data + loaders (demo & prod)
│   ├── components.js           # Sidebar, Header, StatCard
│   ├── app.js                  # Router & bootstrap (load terakhir)
│   └── pages/                  # 12 halaman modular
│       ├── dashboard.js
│       ├── peta-sebaran.js
│       ├── notifikasi-expired.js
│       ├── data-nakes.js
│       ├── data-tenaga-kesehatan.js
│       ├── data-fasyankes.js
│       ├── jadwal-praktik.js
│       ├── verifikasi.js
│       ├── perpanjangan.js
│       ├── laporan.js
│       ├── manajemen-user.js
│       └── pengaturan.js
│
└── supabase/
    └── schema.sql              # Database schema + RLS (jalankan di Supabase)
```

---

## 🚀 Setup Production (Opsional — untuk pakai Supabase asli)

Aplikasi sudah jalan di **Demo Mode** tanpa setup apapun. Untuk pakai backend Supabase asli:

### 1. Buat project Supabase
- Daftar gratis di [supabase.com](https://supabase.com)
- Buat project baru, tunggu ± 2 menit

### 2. Setup database
- Buka **SQL Editor** di dashboard Supabase
- Paste seluruh isi `supabase/schema.sql`
- Klik **Run** — semua tabel, RLS, trigger ter-create

### 3. Edit `config.js`
Buka file `config.js` dengan text editor (Notepad / VS Code), isi:

```javascript
window.SIMANTRI_CONFIG = {
  SUPABASE_URL: 'https://abcd1234.supabase.co',           // ← ganti
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...',   // ← ganti
  // ...lainnya biarkan default
};
```

Ambil URL & anon key dari: **Supabase Dashboard → Project Settings → API**

### 4. Buat akun admin Dinkes
- Di Supabase → **Authentication → Users → Add user**
- Isi email + password, centang "Auto Confirm User"
- Jalankan SQL:
  ```sql
  update public.profiles
  set role = 'dinkes', full_name = 'Admin Dinkes'
  where email = 'email-anda@domain.go.id';
  ```

### 5. Save & refresh
- Save `config.js`
- Refresh browser — aplikasi otomatis pakai Supabase (bukan demo lagi)

---

## 🌐 Deploy ke GitHub Pages

### Cara cepat (2 menit)

1. **Buat repo baru** di GitHub (nama bebas, mis. `simantri-nakes-v3`)
2. **Upload semua file**:
   - Via web: klik "uploading an existing file" → drag-drop semua file dari ZIP
   - Atau via git:
     ```bash
     git init
     git add .
     git commit -m "SIMANTRI v3"
     git remote add origin https://github.com/USERNAME/simantri-nakes-v3.git
     git push -u origin main
     ```
3. **Aktifkan Pages**:
   - Repo → **Settings → Pages**
   - Source: **Deploy from a branch**
   - Branch: `main` / `(root)`
   - Save
4. **Tunggu 1-2 menit**, lalu buka:
   ```
   https://USERNAME.github.io/simantri-nakes-v3/
   ```

### Catatan tentang file `.nojekyll`

File `.nojekyll` (kosong, tanpa ekstensi) **WAJIB ada** di root repo. Fungsinya:
- Memberitahu GitHub Pages: "Jangan proses dengan Jekyll"
- Mencegah file dengan underscore (`_`) atau nama aneh di-drop
- Pastikan semua file JS/CSS tersaji apa adanya

Sudah include di project ini ✅

---

## 🔒 Keamanan

### Yang AMAN di frontend:
- ✅ **Anon key** Supabase — dirancang untuk di-expose. Data dilindungi oleh RLS.
- ✅ Konfigurasi Tailwind via Play CDN
- ✅ Library Supabase JS & Chart.js via CDN

### Yang TIDAK boleh di frontend:
- ❌ **Service role key** Supabase — hanya untuk server/Edge Functions
- ❌ Password database
- ❌ Token rahasia lainnya

### Row Level Security (RLS)
Sudah dikonfigurasi di `supabase/schema.sql`:

| Role | Lihat Semua | Lihat Fasyankes Sendiri | Lihat Diri Sendiri | Manajemen User |
|---|---|---|---|---|
| `dinkes`     | ✅ | ✅ | ✅ | ✅ |
| `fasyankes`  | ❌ | ✅ | ✅ | ❌ |
| `nakes`      | ❌ | ❌ | ✅ | ❌ |

---

## ✨ Fitur Aplikasi

12 halaman modular:

1. **Dashboard Monitoring** — ringkasan real-time: total nakes, fasyankes, status STR/SIP
2. **Peta Sebaran Praktik** — visualisasi geografis lokasi fasyankes
3. **Notifikasi Expired** — peringatan dini STR/SIP H-90 (warna amber)
4. **Data Tenaga Medis** — Dokter, Dokter Gigi, Dokter Spesialis + modal detail + timeline
5. **Data Tenaga Kesehatan** — Perawat, Bidan, Apoteker, TTK, ATLM, Gizi, Kesling
6. **Data Fasyankes** — RS, Puskesmas, Klinik, Apotek, Praktik Mandiri (grid view)
7. **Jadwal Praktik** — tampilan mingguan
8. **Verifikasi STR & SIP** — kanban board approve/reject
9. **Perpanjangan & Rekomendasi** — form dengan validasi + dropzone file
10. **Laporan & Rekap Dinkes** — chart 6 bulan + insight + export CSV
11. **Manajemen User & Role** — Dinkes-only, dengan matrix permission
12. **Pengaturan & Audit Log** — preferensi notifikasi + log audit

---

## 🎨 Design System

**Style**: Clean Health + Energetic SaaS (referensi: Vercel + Doctolib)

| Token | Warna | Penggunaan |
|---|---|---|
| `teal-600`  | `#0D9488` | Primary — tombol, link, active state |
| `lime-500`  | `#84CC16` | Accent — highlight, badge special |
| `amber-500` | `#F59E0B` | Alert — H-90 expired warning |
| `rose-500`  | `#F43F5E` | Danger — expired, error |
| `ink-900`   | `#0F172A` | Sidebar background, body text |
| `white`     | `#FFFFFF` | Base background, card |

---

## 🆘 Troubleshooting

**Q: Buka `index.html` tapi blank / error MIME type**
A: Tidak akan terjadi di v3. Pastikan Anda membuka `index.html` yang ada di folder `simantri-v3/` (bukan dari v2).

**Q: Aplikasi tampil tapi data kosong / "Memuat..." terus**
A: Aplikasi jalan di **Demo Mode** karena `SUPABASE_URL` belum di-set di `config.js`. Ini normal — Anda masih bisa menjelajahi seluruh UI dengan data contoh. Untuk pakai data asli, ikuti langkah "Setup Production" di atas.

**Q: Setelah edit config.js, aplikasi masih demo mode**
A: Hard refresh browser (Ctrl+Shift+R atau Cmd+Shift+R). Cache mungkin menyimpan versi lama.

**Q: Login gagal setelah Supabase dikonfigurasi**
A: Pastikan user sudah di-create di Supabase → Authentication → Users. Profile akan auto-create via trigger saat pertama login. Untuk jadi Dinkes, jalankan SQL update `role = 'dinkes'`.

**Q: RLS memblokir akses data**
A: Cek dengan SQL:
```sql
select public.is_dinkes(), public.current_user_role(), public.current_user_fasyankes();
```
Pastikan user login dan role-nya benar.

**Q: Tailwind warning di Console: "should not be used in production"**
A: Ini hanya warning — Play CDN memang dirancang untuk development/prototyping. Aplikasi tetap berfungsi normal. Jika ingin optimasi production (bundle CSS lebih kecil), lihat bagian "Optimasi Production" di bawah.

**Q: Setelah deploy ke GitHub Pages, halaman blank**
A: Pastikan:
- File `.nojekyll` ada di root repo
- Settings → Pages → Source: **Deploy from a branch** (bukan GitHub Actions)
- Branch: `main` (atau `master`) / folder: `/ (root)`
- Tunggu 1-2 menit setelah upload

---

## 🔧 Optimasi Production (Opsional)

Setup v3 sudah cukup untuk production skala kecil-menengah. Jika ingin lebih optimal:

### Bundle Tailwind CSS (kurangi ukuran dari ~3MB ke ~50KB)
```bash
# Install Tailwind CLI
npm install -D tailwindcss@3

# Generate CSS only dengan class yang dipakai
npx tailwindcss -i ./input.css -o ./css/tailwind-bundle.css --minify

# Hapus <script src="https://cdn.tailwindcss.com"></script> dari index.html
# Tambahkan: <link rel="stylesheet" href="./css/tailwind-bundle.css">
```

### Self-host Supabase JS (jika ingin tanpa CDN)
```bash
# Download file UMD
curl -o js/vendor/supabase.js https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js

# Ganti tag di index.html
<script src="./js/vendor/supabase.js"></script>
```

Tapi untuk mayoritas kasus — **setup default v3 sudah cukup**.

---

## 📄 Lisensi

MIT License — bebas digunakan untuk keperluan pemerintah & non-profit.

---

## 🆚 Changelog v3 vs v2

### v3.0.0 (versi ini)
- ✨ No-build architecture (plain JS, no Vite, no ES modules)
- ✨ Double-click `index.html` langsung jalan
- ✨ Tailwind via Play CDN
- ✨ Supabase & Chart.js via CDN UMD
- ✨ GitHub Pages: deploy from branch (no Actions needed)
- ✨ `.nojekyll` untuk pastikan semua file tersaji
- ✨ Config via `config.js` (user edit langsung, no env vars)
- ✨ Demo mode otomatis jika Supabase belum dikonfigurasi

### v2.0.0 (versi lama)
- Vite + Tailwind CLI build
- ES Modules (`import/export`)
- GitHub Actions deploy
- `.env` files
- Memerlukan `npm install` + `npm run build` sebelum deploy

---

Dibuat untuk Pemerintah Indonesia • **SIMANTRI v3.0** • 2026
