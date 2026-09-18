# Security Module — Folder `/security/`

Sistem pengamanan **dalam satu folder terpisah** untuk dipasang pada aplikasi yang sudah
berjalan **tanpa mengubah file aplikasi utama** (cukup satu baris `<script>`).
Modul bersifat: modular (tiap fitur bisa ON/OFF dari satu konfigurasi), reuse, dan
jujur terhadap batasannya — fungsi yang tidak mungkin diamankan dari frontend
**disediakan sebagai middleware server** di `/security/server/`.

> **PRINSIP:** Folder `/security/` adalah *lapisan tambahan* (tambahan UX/cegah-cegah),
> bukan pengganti keamanan backend. Rate limiting, validasi session, otorisasi, dan
> proteksi database tetap WAJIB di server (lihat [Bagian 7](#7-limitasi-keamanan--wajib-di-backend)).

---

## 1. Struktur Folder & Fungsi Tiap File

```text
/security/
├── config.js               # KONFIGURASI TERPUSAT — satu-satunya tempat mengubah perilaku
├── security.js             # ENTRY POINT — 1 script tag; memuat & menjalankan semua modul
├── utils.js                # Helper bersama: interceptor fetch/XHR, storage, toast/overlay, channel antar-tab
├── session.js              # Validasi session, expiry, konflik, logout terpusat, pengamat 401
├── auto-logout.js          # Auto logout ketidaktifan 15 menit + peringatan 2 menit + hitung mundur
├── login-protection.js     # 3x salah password → blokir sementara (cooldown, eskalasi, tanpa permanent lock)
├── tab-protection.js       # Tab baru session sama diizinkan; opsional single-active-tab; sinkron logout/aktivitas
├── browser-session.js      # ID perangkat (X-Device-Id) + perilaku multi-session sesuai konfigurasi
├── access-control.js       # Guard halaman protected + aturan role (lapisan frontend; backend tetap wajib)
├── csrf.js                 # Token CSRF (meta/cookie/endpoint) + header otomatis untuk request state-changing
├── xss.js                  # escapeHtml, sanitizeHtml (allowlist), safeText/safeHtml, DOM guard, safeFileName
├── security-headers.js     # Framebust + meta CSP opsional (header HTTP asli diset di server)
├── audit-log.js            # Event audit dengan auto-redaksi data sensitif; buffer lokal + batch ke server
├── README.md               # Dokumen ini
├── server/
│   └── security-server.js  # Middleware Node/Express (0 dependensi): loginGuard, session registry,
│                           #   CSRF verify, security headers, audit JSONL, rate limit
└── demo/
    ├── index.html          # Sandbox uji: login 3x salah, auto-logout dipercepat, XSS, audit
    └── app.html            # Contoh halaman protected (role admin)
```

**Catatan struktur:** spesifikasi awal mencontohkan `config/security-config.js`. Sesuai
prinsip *"jangan menyebarkan konfigurasi ke banyak file"* dan *"jangan membuat file yang
tidak diperlukan"*, seluruh konfigurasi ada di **satu** `config.js`.

---

## 2. Cara Mengaktifkan (perubahan minimal pada aplikasi)

### A. Aplikasi statis / multi-halaman (HTML/JS/PHP)

Tambahkan **SATU baris** di `<head>` setiap halaman (paling awal, sebelum script aplikasi):

```html
<script src="/security/security.js" defer></script>
```

Selesai. Tidak ada file existing yang dihapus/dipindah/diubah selain menambah baris ini.

### B. Aplikasi dengan backend Node/Express (sangat disarankan)

Di entry point backend (`app.js` / `server.js`) — tambahan, bukan perubahan:

```js
const security = require('./security/server/security-server').createSecurity({
  // singleSession: true,        // default: login baru mencabut session lama
  // sessionTtlMinutes: 30,
});

app.use(security.securityHeaders);          // header HTTP asli (CSP/HSTS/…)
app.use('/security', security.router);      // endpoint csrf/validate/logout/audit

// Bungkus endpoint login EXISTING (satu-satunya perubahan kecil pada routing):
app.post('/api/auth/login', security.loginGuard(), loginHandlerLama);
// Di dalam handler login lama, saat kredensial valid:
security.helpers.issueSession(req, res, user.username, user.roles);
```

### C. Halaman mana yang "protected"?

Isi `PROTECTED_PATTERNS` di `config.js` dengan pola path aplikasi Anda
(default mengikuti contoh spesifikasi: `/dashboard/**`, `/admin/**`, `/operator/**`,
`/superadmin/**`, `/data/**`, `/settings/**`). Halaman yang tidak cocok pola mana pun
diperlakukan publik (guard session tidak aktif di sana — aplikasi tidak akan terganggu).

### D. SPA (React/Vue/Next)

Panggil `window.AppSecurity.recheckRoute()` setiap pergantian route, dan pastikan
script entry dimuat sekali di `index.html`. Untuk Next.js, muat melalui
`pages/_app.js` / `app/layout.js` dengan `<Script src="/security/security.js" strategy="afterInteractive">`.

---

## 3. Konfigurasi Terpusat — Semua di `config.js`

Tabel opsi yang paling sering diubah (daftar lengkap + komentar ada di `config.js`):

| Opsi | Default | Arti |
|---|---|---|
| `SECURITY_ENABLED` | `true` | Master switch — `false` = seluruh modul mati |
| `INACTIVITY_TIMEOUT_MINUTES` | `15` | Timeout auto-logout (menit) |
| `WARNING_BEFORE_MINUTES` | `2` | Peringatan sebelum logout (1–2 menit disarankan) |
| `MAX_LOGIN_ATTEMPTS` | `3` | Batas salah password sebelum blokir |
| `LOGIN_COOLDOWN` | `true` | Aktifkan cooldown sementara (bukan permanent lock) |
| `LOGIN_COOLDOWN_MINUTES` | `5` | Durasi cooldown pertama |
| `LOGIN_COOLDOWN_ESCALATION` | `true` | Blokir berulang → cooldown ×2 (maks 30 menit) |
| `SINGLE_SESSION_MODE` | `true` | Kebijakan satu session per akun |
| `ALLOW_MULTIPLE_SESSIONS` | `false` | `false` = login baru mencabut session lama (ditegakkan server) |
| `TAB_PROTECTION` / `TAB_POLICY` | `true` / `allow-same-session` | Tab dalam session sama diizinkan; `'single-active-tab'` = satu tab saja |
| `CSRF_PROTECTION` | `true` | Header CSRF otomatis (mode cookie) |
| `XSS_PROTECTION` | `true` | Sanitizer + DOM guard |
| `SECURITY_HEADERS` / `FRAMEBUST` | `true` | Lapisan browser; header asli di server |
| `AUDIT_LOG` | `true` | Pencatatan event (dengan auto-redaksi) |
| `AUTH_MODE` | `'cookie'` | `'cookie'` atau `'jwt'` |
| `ACCESS_FAIL_CLOSED` | `false` | `true` = validasi gagal (network) → tolak akses (fail-closed) |

**Menonaktifkan satu modul tanpa menyentuh yang lain:** set flag modul terkait `false`
(mis. `TAB_PROTECTION: false`). Kegagalan satu modul juga otomatis dilewati saat boot —
tidak akan menjatuhkan modul lain maupun aplikasi.

### 3.1 Cara mengubah timeout auto-logout

```js
// config.js
INACTIVITY_TIMEOUT_MINUTES: 15,   // → mis. 30
WARNING_BEFORE_MINUTES: 2,        // → peringatan 2 menit sebelum logout
```

### 3.2 Cara mengubah batas login

```js
MAX_LOGIN_ATTEMPTS: 3,            // percobaan gagal sebelum diblokir
LOGIN_COOLDOWN_MINUTES: 5,        // durasi blokir pertama
LOGIN_COOLDOWN_MAX_MINUTES: 30,   // batas atas eskalasi
```

### 3.3 Cara mengaktifkan single session

```js
SINGLE_SESSION_MODE: true,
ALLOW_MULTIPLE_SESSIONS: false,   // login baru → session lama dicabut (server-side)
```
Penegakan sebenarnya di server: `createSecurity({ singleSession: true })` — session lama
diberi status *superseded*; browser lama menerima **409** saat validasi dan menampilkan
pesan: *"Akun Anda digunakan di perangkat/browser lain. Sesi ini telah dicabut."*

### 3.4 Override per halaman (tanpa menyentuh config.js)

```html
<script>window.SECURITY_CONFIG_OVERRIDES = { INACTIVITY_TIMEOUT_MINUTES: 30 };</script>
<script src="/security/security.js" defer></script>
```

---

## 4. Integrasi dengan Backend

Frontend mengkomunikasikan diri dengan server melalui kontrak endpoint berikut
(semua sudah disediakan oleh `/security/server/security-server.js`; URL bisa diganti
bila backend Anda sudah punya endpoint sendiri — cukup ubah `config.js`):

| Endpoint (default) | Metode | Dipakai oleh | Kontrak |
|---|---|---|---|
| `/security/session/validate` | GET | session.js, access-control.js | `200` `{valid,user,roles,expiresAt}` · `401` invalid · `409` dicabut (device lain) |
| `/security/session/logout` | POST | session.js | `200`; server menghapus session + cookie HttpOnly |
| `/security/session/heartbeat` | POST | session.js (opsional) | `200` perpanjang sesi |
| `/security/csrf` | GET | csrf.js | `{ token }` + cookie double-submit `XSRF-TOKEN` |
| `/security/audit` | POST | audit-log.js | body: array event (sudah teredaksi) |
| `/api/auth/login` | POST | login-protection.js (pengamat) | endpoint login EXISTING aplikasi Anda |

**Cookie session yang disarankan di server:** `HttpOnly` + `Secure` + `SameSite=Lax`
(atau `Strict`) + `Max-Age`. Middleware bawaan sudah mengatur semua ini otomatis.

**Mode JWT:** set `AUTH_MODE: 'jwt'` dan `JWT_STORAGE_KEY: 'namaKeyAnda'`.
Modul memeriksa `exp` secara lokal (advisory) — **verifikasi tanda tangan tetap
wajib di backend**. CSRF otomatis dinonaktifkan di mode ini (bearer token tidak
rentan CSRF).

**Auto-redaksi audit:** modul menghapus nilai untuk kunci yang terindikasi
`password / token / secret / authorization / credential / api key / cookie / session id`
baik di frontend maupun di middleware server — event tetap tercatat, nilainya tidak.

---

## 5. Matriks Kemampuan — Jujur Terhadap Arsitektur

```text
FITUR                                  │ Dari /security/ │ Perlu entry point │ Wajib di backend/server
───────────────────────────────────────┼─────────────────┼───────────────────┼────────────────────────
Auto logout 15 menit + peringatan      │        ✔        │  1 script tag     │  endpoint logout (disediakan)
Blokir 3x salah password (UX)          │        ✔        │  —                │  loginGuard (WAJIB, disediakan)
Blokir 3x salah password (tegas)       │        ✖        │  1 baris route    │  ✔ loginGuard — tak bisa dilewati
Validasi session                       │     cermin      │  —                │  ✔ endpoint validate (disediakan)
Invalidasi session / single session    │        ✖        │  —                │  ✔ (disediakan)
Tab: sinkronisasi & single-active-tab  │        ✔        │  —                │  validasi ulang tetap di server
Multi-device (ALLOW_MULTIPLE_SESSIONS) │    perilaku UI  │  —                │  ✔ keputusan di server (409)
Guard halaman + role (frontend)        │        ✔        │  —                │  ✔ otorisasi API/DB tetap wajib
XSS: escape/sanitize/DOM guard         │        ✔        │  —                │  escaping render + validasi upload
CSRF: header otomatis                  │        ✔        │  —                │  ✔ verifikasi token (disediakan)
Security header HTTP (CSP/HSTS/…)      │  framebust saja │  —                │  ✔ middleware (disediakan)
Audit log                              │  buffer lokal   │  —                │  ✔ penyimpanan (disediakan)
Otorisasi database / RLS               │        ✖        │        ✖          │  ✔ 100% di database/server
```

Kesimpulan praktis: pasang frontend (`1 script tag`) **dan** backend (`require` +
2 middleware). Tanpa backend, modul tetap berjalan dalam mode degradasi
(tidak error), namun proteksi tegas (rate limit, invalidasi session, otorisasi)
**belum ada** — lihat bagian berikut.

---

## 6. Limitasi Keamanan (Wajib Dibaca)

1. **Frontend bisa dibuka/diubah oleh pengguna.** Hitungan login di browser hanya UX;
   penegakan sebenarnya `loginGuard` di server. Jangan pernah mengandalkan JS saja.
2. **Halaman protected frontend bukan brankas.** Seluruh API/halaman dinamis WAJIB
   memeriksa session & role per-request (`requireAuth()`, `requireRoles()`).
3. **Tanpa backend, tidak ada yang bisa:**
   rate limiting tegas, invalidasi session, pencabutan session perangkat lain,
   verifikasi JWT, otorisasi, proteksi database/RLS. Modul akan mencatat peringatan
   di console (aktifkan `DEBUG: true`).
4. **Mode degradasi dirancang tidak merusak:** endpoint kosong/network gagal ⇒
   akses tidak diblokir (fail-open, `ACCESS_FAIL_CLOSED: false`). Untuk data sangat
   sensitif set `ACCESS_FAIL_CLOSED: true` dan pastikan endpoint selalu sehat.
5. **Meta CSP terbatas.** CSP sebenarnya via header server; isi `META_CSP` hanya bila
   tak mungkin menyentuh server, dan uji dulu.
6. **DOM guard bukan sandbox.** Ia menghapus `<script>` yang disisipkan dinamis;
   kompleks HTML tetap gunakan `sanitizeHtml` (atau DOMPurify) saat merender.
7. **ID perangkat bukan fingerprint kriptografis** — pendukung UX keamanan, bukan
   dasar tunggal keputusan.

---

## 7. Tidak Ada Backdoor (Pernyataan)

Kode ini **tidak** memuat: backdoor, master password, password admin hard-coded,
akun tersembunyi, secret URL bypass login, token permanen, credential di
JS/HTML/repository. Tidak ada jalur login selain mekanisme autentikasi aplikasi
Anda sendiri. Kunci `resetState()` pada login-protection hanya mengosongkan
*counter lokal browser itu sendiri* — status blokir di server hanya bisa
dihapus oleh waktu (cooldown) atau kode operasional di server Anda.

---

## 8. Cara Testing (Manual + Demo)

**Demo cepat:** buka `/security/demo/index.html` melalui web server
(`python3 -m http.server` → `http://localhost:8000/security/demo/`).
Password demo: `demo123`. Halaman `app.html` adalah contoh halaman protected.

| Uji | Langkah | Hasil diharapkan |
|---|---|---|
| Auto logout | Buka `app.html`, diamkan ±30 detik | Peringatan hitung mundur → logout → toast *"Sesi Anda telah berakhir karena tidak ada aktivitas selama … menit"* |
| Tetap Masuk | Klik **Tetap Masuk** saat peringatan | Timer reset, tidak logout |
| 3x salah | Salah password 3x di demo login | Percobaan ke-3 diblokir; form dicegah submit; pesan sisa waktu |
| Cooldown pulih | Tunggu masa cooldown berakhir | Login bisa lagi (tanpa permanent lock); blokir ke-2 durasi ×2 |
| Audit | Lihat panel Audit / `AppSecurity.AuditLog.recent(10)` | LOGIN_FAILED, LOGIN_BLOCKED, LOGOUT, AUTO_LOGOUT tercatat |
| XSS | Tombol *Render DENGAN sanitize* pada payload uji | `onerror`/`<script>` dibuang; teks aman tetap tampil |
| Tab (default) | Buka `app.html` di 2 tab | Kedua tab jalan; logout di satu tab → tab lain ikut logout |
| Tab ketat | Set `TAB_POLICY:'single-active-tab'` | Tab kedua ditolak tanpa meng-logout tab pertama |
| Multi-device | `ALLOW_MULTIPLE_SESSIONS:false` + 2 browser login berurutan (backend aktif) | Browser lama mendapat 409 → pesan dicabut → redirect login |
| Session mati | Endpoint validate mengembalikan 401 (backend) | Logout otomatis + redirect login |
| API 401 global | Sembarang API mengembalikan 401 (backend) | Logout otomatis (pengamat 401) |
| Nonaktif per modul | Set `TAB_PROTECTION:false` | Modul lain tetap jalan |
| Master off | Set `SECURITY_ENABLED:false` | Tidak ada efek apa pun pada aplikasi |

**Smoke test kompatibilitas:** setelah dipasang di aplikasi nyata, cek: menu utama,
login/logout, unggah file, editor, panggilan API lama, dan routing existing.
Seluruh interceptor bersifat *pass-through* — bila modul error, request aplikasi
tetap lanjut tanpa diubah (lihat `DEBUG: true` untuk log internal).

---

## 9. Checklist Wajib di Server

Dilakukan/dipastikan di server — **tidak dapat digantikan folder `/security/`**:

- [ ] Rate limiting login terpasang: `security.loginGuard()` (atau setara) — batas 3, cooldown 5 menit, eskalasi.
- [ ] Session disimpan server-side dan **cookie** berflag `HttpOnly` + `Secure` + `SameSite` + `Max-Age`.
- [ ] Logout server benar-benar menghapus/menginvalidasi session (bukan hanya hapus cookie).
- [ ] Endpoint validate/logout/heartbeat/audit dipasang (`app.use('/security', security.router)`).
- [ ] Verifikasi CSRF untuk semua request state-changing (`security.csrfProtect()` bila cookie-auth).
- [ ] Otorisasi per endpoint: `security.requireAuth()`, `security.requireRoles('admin')`.
- [ ] Security header di semua respons: `securityHeaders` middleware (CSP diuji bertahap, mulai `report-only` bila perlu).
- [ ] Password di-hashing (bcrypt/argon2), kredensial di env/server, bukan di repo.
- [ ] Database: user khusus berhak minimum, koneksi TLS, dan RLS/row-level permission bila memakai Postgres/BaaS.
- [ ] HTTPS wajib (HSTS otomatis aktif saat request https).
- [ ] Backup & pemantauan file audit `security/logs/audit-*.jsonl`.

Snippet header (bila di luar Express):

```nginx
# Nginx
add_header X-Content-Type-Options nosniff always;
add_header X-Frame-Options SAMEORIGIN always;
add_header Referrer-Policy strict-origin-when-cross-origin always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
# Content-Security-Policy: uji bertahap — jangan langsung mematikan resource existing
```

```apache
# Apache (.htaccess)
Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "SAMEORIGIN"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains" expr=%{HTTPS}e
```

---

## 10. Pemecahan Masalah Cepat

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| Auto-logout tidak jalan | Halaman tidak cocok `PROTECTED_PATTERNS` | Sesuaikan pola; pastikan session ada (`DEBUG: true`) |
| Halaman protected langsung redirect login | Endpoint validate mengembalikan 401 | Periksa endpoint/session server |
| Semua halaman terasa "publik" | `PROTECTED_PATTERNS` kosong/salah | Perbaiki pola di `config.js` |
| Modul terlihat dobel jalan | security.js dimuat dua kali | Modul idempotent — cukup hapus include dobel |
| Request API lama gagal setelah dipasang | (jarang) header tambahan ditolak server | Endpoint CORS/allowlist di server; atau matikan modul terkait sementara |
| Aplikasi memasang header CSRF sendiri | Bentrok token | Aplikasi punya prioritas (header tidak ditimpa); atau `CSRF_PROTECTION:false` |

