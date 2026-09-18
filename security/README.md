# 🛡️ SECURITY MODULE (Modul Keamanan Terpisah / Drop-in)

Modul keamanan **mandiri** dalam satu folder `/security/` — dirancang untuk
diletakkan di aplikasi yang SUDAH BERJALAN **tanpa mengubah, memindahkan,
atau menghapus satu pun file aplikasi yang ada**. Perubahan maksimum yang
dibutuhkan: **satu blok `<script>` (atau satu baris `require`) di entry point**.

> **Prinsip utama:** modular, secure-by-default, satu konfigurasi terpusat,
> tanpa backdoor, tanpa kredensial hardcoded, tanpa URL bypass, tanpa token permanen.

---

## 1. Struktur File & Fungsi Masing-Masing

```
/security/
├── security.js            ← SATU-SATUNYA TITIK MASUK: initSecurity()
├── config.js              ← SEMUA konfigurasi terpusat (satu tempat)
├── session.js             ← Validasi sesi, rotasi sessionId, logout aman
├── auto-logout.js         ← FITUR: auto logout 15 menit + peringatan 2 menit
├── login-protection.js    ← FITUR: 3x gagal login → blokir sementara 5 menit
├── tab-protection.js      ← FITUR: tab baru (sesi sama) diizinkan; tab sesi lama dicabut
├── browser-session.js     ← FITUR: single session (login baru menggantikan yang lama)
├── access-control.js      ← FITUR: gerbang halaman /dashboard, /admin, dll.
├── csrf.js                ← FITUR: token CSRF (double-submit) + patch fetch/XHR
├── xss.js                 ← FITUR: escapeHTML, safeText, safeHTML, safeURL, sanitizer
├── security-headers.js    ← FITUR: meta CSP (opsional) + daftar header wajib server
├── audit-log.js           ← FITUR: audit log (redaksi otomatis, cache 7 hari, batch ke server)
├── utils.js               ← Helper internal (storage aman, event bus, overlay)
├── server/
│   └── security-server.js ← Guard server Node.js TANPA dependensi (headers,
│                             rate limit login, single-session, endpoint audit)
├── demo/                  ← Halaman uji coba (BUKAN bagian dari aplikasi produksi)
│   ├── index.html         ←   login demo + simulasi 3x gagal & cooldown
│   ├── dashboard.html     ←   dashboard demo + timer auto-logout + uji XSS
│   └── admin.html         ←   halaman role-admin demo
└── README.md              ← File ini
```

---

## 2. Cara Mengaktifkan

### A. Aplikasi front-end (HTML/JS apa pun, termasuk SPA)

Salin folder `security/` ke root web Anda, lalu tambahkan **satu blok script**
di entry point (mis. `index.html`, `layout utama`, atau file `app.js`):

```html
<script type="module">
  import { initSecurity } from '/security/security.js';
  initSecurity();
</script>
```

Selesai — semua fitur aktif dengan default aman. **Tidak ada file lain yang
perlu diubah.** Aplikasi Anda tidak perlu tahu isi modul; jika ingin
berinteraksi, semua tersedia via `window.SecurityAPI`.

### B. Aplikasi dengan backend Node.js (Express / http murni) — OPSIONAL namun DISARANKAN

Front-end saja TIDAK CUKUP untuk keamanan penuh (lihat Bagian 7). Guard server
disertakan dan **tidak butuh `npm install` apa pun**:

```js
// app.js (Express) — tambahan: 2 baris
const { createSecurity } = require('/security/server/security-server.js');
const sec = createSecurity({ loginPaths: ['/api/login'] });

app.use(express.json());
app.use(sec.applyExpress());              // 1) headers + endpoint /security/*
app.post('/api/login', sec.loginGuard(), loginHandler);  // 2) rate limit login
```

```js
// server.js (http murni) — tambahan: 2 baris
const { createSecurity } = require('/security/server/security-server.js');
createSecurity({}).attachTo(server);
```

### C. Mematikan seluruh modul (darurat / rollback)

Satu flag di `config.js`:

```js
SECURITY_ENABLED: false   // seluruh modul pasif, nol efek ke aplikasi
```

---

## 3. Mengubah Timeout (Auto Logout)

**Semua** lewat `config.js` (atau override saat `initSecurity`):

```js
initSecurity({
  INACTIVITY_TIMEOUT: 10 * 60 * 1000,   // 10 menit (dalam milidetik)
  WARNING_BEFORE_LOGOUT: 1 * 60 * 1000, // peringatan 1 menit sebelumnya
});
```

| Opsi | Default | Arti |
|---|---|---|
| `INACTIVITY_TIMEOUT` | `15 * 60 * 1000` | Durasi tanpa aktivitas sebelum auto logout |
| `WARNING_BEFORE_LOGOUT` | `2 * 60 * 1000` | Peringatan tampil 1–2 menit sebelum logout |
| `SESSION_DURATION` | `60 * 60 * 1000` | Masa berlaku absolut sesi (walau aktif) |
| `SESSION_ROTATION_INTERVAL` | `30 * 60 * 1000` | Rotasi sessionId berkala |

---

## 4. Mengubah Batasan Login (3x Gagal)

```js
initSecurity({
  MAX_LOGIN_ATTEMPTS: 5,              // jumlah gagal sebelum diblokir
  LOGIN_COOLDOWN: 10 * 60 * 1000,     // durasi blokir (SEMENTARA, tak pernah permanen)
  ATTEMPT_WINDOW: 30 * 60 * 1000,     // jendela penghitungan gagal
});
```

> ⚠️ **Desain terkunci:** modul MENOLAK blokir permanen. `LOGIN_COOLDOWN` wajib
> berhingga — jika diisi `0`/negatif/`Infinity`, otomatis dikembalikan ke 5 menit.

**Integrasi ke form login yang sudah ada** (tanpa mengubah logika auth):

```js
// SEBELUM kirim kredensial:
const check = sec.login.checkAllowed();
if (!check.allowed) { tampilkan(sec.login.getBlockedMessage()); return; }

// Server menolak (401):
sec.login.recordFailure();

// Server menerima:
sec.session.create({ userId: 'budi', role: 'user' }); // reset penghitung + audit LOGIN_SUCCESS
```

---

## 5. Mengaktifkan / Mengatur Single Session

Default sudah **AKTIF** (`SINGLE_SESSION_MODE: true`,
`ALLOW_MULTIPLE_SESSIONS: false`):

- Login baru pada "sesi yang sama secara logika" menggantikan sesi lama →
  tab/perangkat lama otomatis dicabut dengan pesan
  *"Sesi Anda diakhiri karena akun ini digunakan untuk login dari perangkat atau browser lain."*
- **Membuka tab baru TIDAK PERNAH me-logout** — tab baru pada sesi yang sama
  mengklaim tiket sesi yang sah (inilah pembeda "tab normal" vs "sesi ilegal").

Untuk mengizinkan banyak sesi sekaligus:

```js
initSecurity({
  SINGLE_SESSION_MODE: false,
  ALLOW_MULTIPLE_SESSIONS: true,
});
```

> ⚠️ Penegakan lintas-perangkat yang SEBENARNYA butuh server: isi
> `SERVER.heartbeatEndpoint: '/security/heartbeat'` (endpoint sudah disediakan
> oleh `security-server.js`). Tanpa itu, penegakan hanya bekerja antar-tab
> dalam browser yang sama.

---

## 6. Integrasi Backend

### Endpoint yang disediakan `security-server.js` (prefix bisa diubah via `apiPrefix`)

| Endpoint | Metode | Fungsi |
|---|---|---|
| `/security/heartbeat` | POST | Client menanyakan validitas sesi; menjawab `{valid:false, reason:'SESSION_REVOKED'}` bila login lebih baru menggantikan |
| `/security/audit` | POST | Menerima batch audit log dari browser (sudah diredaksi layer-2 di server) |
| `/security/logout` | POST | Mencabut sessionId di registry server |
| `/security/health` | GET | Cek modul hidup |

### Menghubungkan client ke server

```js
initSecurity({
  SERVER: {
    heartbeatEndpoint: '/security/heartbeat',
    logoutEndpoint: '/security/logout',
    auditEndpoint: '/security/audit',
  },
});
```

### Verifikasi sesi di rute terlindungi (pilih salah satu)

```js
// 1) Delegasi ke verifier aplikasi Anda (paling umum)
sec = createSecurity({
  verifySession: async (req) => {
    // verifikasi cookie/JWT Anda sendiri
    return { valid: true, userId: 'budi', role: 'user' };
  },
});

// 2) Token HMAC bawaan (tanpa database)
// set env: SECURITY_SESSION_SECRET=<string acak panjang>
app.get('/api/rahasia', sec.requireSession(), handler);
```

### Single-session di server (dipanggil dari handler login Anda)

```js
res.setHeader('x-user-id', user.id);          // opsi otomatis via loginGuard
// ATAU eksplisit:
sec.registerSession(user.id, sessionId);
```

### Production multi-instance

Rate limit & registry di `security-server.js` memakai memori proses
(hilang saat restart, tidak dibagi antar instance cluster). Untuk produksi
serius, ganti store dengan Redis atau pasang reverse-proxy yang sama —
struktur kode dibuat agar titik gantinya jelas (`store` di `createSecurity`).

---

## 7. Batasan Keamanan (Kejujuran Penuh — WAJIB DIBACA)

| Fitur | Cukup dari `/security/` | Butuh entry point | Wajib backend |
|---|---|---|---|
| 1. Auto logout 15 menit + peringatan | ✅ Penuh | — | — |
| 2. Blokir 3x gagal login | ⚠️ UX saja (client bisa dimanipulasi) | — | ✅ `sec.loginGuard()` (disertakan) |
| 3. Validasi sesi | ⚠️ Struktur & kedaluwarsa lokal | — | ✅ Verifikasi JWT/cookie server |
| 3b. Rotasi sesi | ⚠️ Rotasi ID lokal | — | ✅ Cookie/JWT baru dari server |
| 4. Tab protection | ✅ Antar-tab di browser sama | — | — |
| 5. Single session | ⚠️ Antar-tab di browser sama | — | ✅ Heartbeat + registry (disertakan) |
| 6. Access control halaman | ⚠️ UX (redirect) | — | ✅ Middleware `requireSession()` |
| 7. XSS | ⚠️ Defense-in-depth browser | — | ✅ Encoding output + CSP server |
| 8. CSRF | ⚠️ Token client + patch fetch | — | ✅ `csrf.enabled` di server |
| 9. Security headers | ❌ Meta CSP terbatas saja | — | ✅ `applyExpress()` / Nginx |
| 10. Audit log | ✅ Lokal (7 hari) | — | ✅ `/security/audit` (disertakan) |

**Kesimpulan jujur:** dengan hanya menyalin folder + 1 blok script, Anda
mendapat auto logout penuh, proteksi tab, audit lokal, dan lapisan UX semua
fitur. **Keamanan yang tidak bisa dilewati penyerang selalu berada di
server** — guard server tanpa dependensi sudah disertakan, tinggal 2 baris.

---

## 8. Cara Testing (Checklist Manual)

Cara tercepat: jalankan server demo statis dari root proyek:

```bash
npx serve .          # atau: python3 -m http.server 8000
# buka http://localhost:8000/security/demo/index.html
```

Halaman demo **bukan** autentikasi nyata (simulasi lokal, password `demo123`,
user `admin` = role admin, user lain = role user).

| # | Skenario | Hasil yang diharapkan |
|---|---|---|
| 1 | Login `admin`/`demo123` | Redirect ke dashboard, audit `LOGIN_SUCCESS` |
| 2 | Salahkan password 3x | Pesan sisa percobaan → blokir + hitung mundur 5 menit |
| 3 | Buka `dashboard.html?fast=1`, diamkan 40 detik | Peringatan 20 detik + tombol **Tetap Masuk** → logout otomatis dengan pesan spesifikasi |
| 4 | Klik **Tetap Masuk** saat peringatan | Timer reset, tidak logout |
| 5 | Buka dashboard di **tab baru** | Tetap login (bukan logout) |
| 6 | Di tab baru, login sebagai user lain → kembali ke tab lama | Tab lama dicabut: pesan *login dari perangkat lain* + audit `SESSION_REVOKED` |
| 7 | Buka `/security/demo/admin.html` sebagai user `budi` | Overlay **Akses Ditolak** |
| 8 | Tombol XSS **safeHTML** | Tag `<b>` tampil, `onerror` hilang; versi **innerHTML** memicu alert (bukti bedanya) |
| 9 | Tabel audit di dashboard | Semua event tercatat; field sensitif selalu `[REDACTED]` |
| 10 | `logout()` dari tombol Keluar | Audit `LOGOUT`, redirect login dengan pesan "keluar dengan aman" |

Uji guard server cepat:

```bash
node -e "const{createSecurity}=require('./security/server/security-server.js');const s=createSecurity({});console.log('OK:',Object.keys(s).length,'API tersedia')"
```

---

## 9. Wajib Dikonfigurasi di Server (Produksi)

1. **HTTPS wajib** — tanpa HTTPS, cookie `Secure` & HSTS tidak berlaku.
2. **Security headers** — pasang via `sec.applyExpress()` ATAU Nginx:
   ```nginx
   add_header Content-Security-Policy "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'" always;
   add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
   add_header X-Content-Type-Options "nosniff" always;
   add_header X-Frame-Options "DENY" always;
   add_header Referrer-Policy "strict-origin-when-cross-origin" always;
   add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
   ```
   > Catatan: modul sengaja TIDAK memaksa CSP agresif default agar tidak
   > merusak aplikasi yang ada — CSP diaktifkan bertahap (mulai
   > `Content-Security-Policy-Report-Only`).
3. **Cookie sesi aplikasi** — pastikan `HttpOnly; Secure; SameSite=Lax`
   (ditetapkan server saat login, bukan oleh modul ini).
4. **Ganti store in-memory** dengan Redis bila multi-instance (Bagian 6).
5. **Simpan `SECURITY_SESSION_SECRET`** di env var, bukan di kode.
6. **Endpoint audit ke penyimpanan permanen** — set `onAudit` callback untuk
   menulis ke file/database; cache browser hanya 7 hari & maksimum 500 entri.

---

## 10. Jaminan Kompatibilitas (Apa yang TIDAK Disentuh Modul)

Modul ini **tidak akan**:

- ❌ Menghapus, memindahkan, atau menimpa file aplikasi mana pun
- ❌ Mengubah skema database atau menjalankan migrasi
- ❌ Mengubah menu, tampilan, atau styling aplikasi
- ❌ Mengganti / memodifikasi sistem autentikasi yang sudah ada
- ❌ Mengubah routing aplikasi (hanya redirect *browser* saat sesi tidak valid)
- ❌ Mengganggu upload, API pihak ketiga, atau fetch lintas-origin
- ❌ Mencatat password / token / secret di audit log (redaksi otomatis 2 layer)
- ❌ Memuat dependensi eksternal (nol `npm install`, nol CDN)

Satu-satunya perubahan pada aplikasi: **satu blok `<script>` (atau satu
`require`) di entry point**, dan itu pun opsional untuk rollback
(`SECURITY_ENABLED: false` mematikan semuanya tanpa menghapus baris tersebut).

## 11. Garanti Anti-Backdoor

Modul ini **tidak berisi dan tidak akan pernah berisi**: master password,
akun tersembunyi, URL bypass, token permanen, kredensial hardcoded,
atau mekanisme apa pun yang melewati pemeriksaan keamanan. Seluruh kode
dapat diaudit — tidak ada minifikasi, tidak ada pemanggilan jaringan
selain endpoint yang Anda konfigurasikan sendiri.
