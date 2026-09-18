/* ============================================================================
 * /security/config.js — KONFIGURASI TERPUSAT SECURITY MODULE
 * ============================================================================
 * SELURUH pengaturan keamanan ada di file INI SAJA.
 * Jangan mencari/mengubah angka konfigurasi di file modul lain.
 *
 * Cara cepat mengubah:
 *   - Timeout auto-logout      -> INACTIVITY_TIMEOUT_MINUTES
 *   - Batas salah password     -> MAX_LOGIN_ATTEMPTS
 *   - Cooldown blokir login    -> LOGIN_COOLDOWN_MINUTES
 *   - Single session           -> SINGLE_SESSION_MODE / ALLOW_MULTIPLE_SESSIONS
 *   - Matikan modul tertentu   -> ubah flag <NAMA_MODUL>_ENABLED menjadi false
 *
 * CATATAN STRUKTUR: contoh struktur pada spesifikasi memiliki
 * config/security-config.js. Sesuai prinsip "jangan menyebarkan konfigurasi
 * ke banyak file" dan "jangan membuat file yang tidak diperlukan", file
 * tersebut TIDAK dibuat — config.js ini adalah sumber kebenaran tunggal.
 *
 * OVERRIDE PER HALAMAN (opsional, tanpa menyentuh file ini):
 *   Definisikan window.SECURITY_CONFIG_OVERRIDES SEBELUM script security.js
 *   dimuat, contoh:
 *   <script>window.SECURITY_CONFIG_OVERRIDES = { INACTIVITY_TIMEOUT_MINUTES: 30 };</script>
 * ==========================================================================*/
(function (global) {
  'use strict';

  var SECURITY_CONFIG = {

    /* ------------------------------------------------------------------
     * MASTER SWITCH
     * ------------------------------------------------------------------ */
    // false = seluruh security module nonaktif (tidak melakukan apa pun).
    SECURITY_ENABLED: true,
    DEBUG: false,                    // true = log internal modul ke console
    ENVIRONMENT: 'production',       // 'production' | 'development'

    /* ------------------------------------------------------------------
     * HALAMAN & NAVIGASI
     * Pola mendukung glob: '/admin/**' (semua kedalaman), '/data/*'
     * (satu tingkat), awalan "**" + "/" untuk login.html di lokasi mana pun,
     * '/' (root exact).
     * PROTECTED_PATTERNS menentukan halaman yang butuh session valid.
     * Sesuaikan dengan routing aplikasi Anda (lihat README bagian 3).
     * ------------------------------------------------------------------ */
    LOGIN_URL: '/login.html',
    HOME_URL: '/',
    PROTECTED_PATTERNS: [
      '/dashboard/**',
      '/admin/**',
      '/operator/**',
      '/superadmin/**',
      '/data/**',
      '/settings/**'
    ],
    PUBLIC_PATTERNS: [
      '/',
      '/index.html',
      '**/login.html',
      '**/login',
      '**/login.php',
      '**/register*',
      '**/forgot-password*',
      '**/404*',
      '**/error*'
    ],

    /* ------------------------------------------------------------------
     * AUTENTIKASI
     * AUTH_MODE 'cookie' : session cookie server (HttpOnly) — CSRF aktif.
     * AUTH_MODE 'jwt'    : token di localStorage/storage lain; validasi
     *                      tetap WAJIB dilakukan backend. CSRF otomatis
     *                      dinonaktifkan (bearer token tidak rentan CSRF).
     * JWT_STORAGE_KEY    : nama key localStorage yang menyimpan JWT
     *                      (contoh: 'accessToken'). Kosong bila tidak JWT.
     * ------------------------------------------------------------------ */
    AUTH_MODE: 'cookie',
    JWT_STORAGE_KEY: '',

    /* ------------------------------------------------------------------
     * AUTO LOGOUT (ketidaktifan)
     * Jika pengguna tidak beraktivitas selama INACTIVITY_TIMEOUT_MINUTES:
     * session divalidasi -> diinvalidasi -> user diarahkan ke login ->
     * notifikasi ditampilkan. Peringatan muncul WARNING_BEFORE_MINUTES
     * sebelum logout (silakan 1–2 menit).
     * ------------------------------------------------------------------ */
    AUTO_LOGOUT_ENABLED: true,
    INACTIVITY_TIMEOUT_MINUTES: 15,
    WARNING_BEFORE_MINUTES: 2,
    // true = saat pengguna beraktivitas, kirim heartbeat agar server
    // memperpanjang umur session server (jika endpoint disediakan).
    HEARTBEAT_ON_ACTIVITY: false,

    /* ------------------------------------------------------------------
     * LOGIN PROTECTION (salah password)
     * Percobaan 1 gagal -> 2 gagal -> ke-3: BLOKIR SEMENTARA (cooldown),
     * TIDAK permanent lock. Client-side hanya lapisan UX; penegakan
     * sebenarnya WAJIB di server (lihat /security/server/security-server.js).
     * ------------------------------------------------------------------ */
    LOGIN_PROTECTION_ENABLED: true,
    LOGIN_ENDPOINT: '/api/auth/login',   // endpoint login EXISTING aplikasi
    MAX_LOGIN_ATTEMPTS: 3,
    LOGIN_COOLDOWN: true,
    LOGIN_COOLDOWN_MINUTES: 5,
    LOGIN_COOLDOWN_ESCALATION: true,     // blokir berulang -> cooldown x2
    LOGIN_COOLDOWN_MAX_MINUTES: 30,      // batas atas cooldown (menit)
    // Kode status HTTP yang dianggap "login gagal" dari endpoint login.
    LOGIN_FAIL_STATUS: [400, 401, 403, 429],

    /* ------------------------------------------------------------------
     * SESSION SECURITY
     * Endpoint mengikuti middleware di /security/server/ (bila dipasang).
     * Bila backend Anda sudah punya endpoint sendiri, cukup ganti URL-nya.
     * Kosongkan ('') endpoint yang belum tersedia — modul akan berjalan
     * dalam mode degradasi tanpa error (lihat README bagian Limitasi).
     * ------------------------------------------------------------------ */
    SESSION_VALIDATION_ENABLED: true,
    SESSION_VALIDATE_ENDPOINT: '/security/session/validate',
    SESSION_LOGOUT_ENDPOINT: '/security/session/logout',
    SESSION_HEARTBEAT_ENDPOINT: '/security/session/heartbeat',
    SESSION_CHECK_INTERVAL_SECONDS: 60,  // polling validasi berkala
    SESSION_CACHE_SECONDS: 30,           // cache hasil validasi (hindari spam)

    SINGLE_SESSION_MODE: true,           // kebijakan single session
    ALLOW_MULTIPLE_SESSIONS: false,      // false = login baru mencabut session lama
    WATCH_401: true,                     // respons 401 global -> logout otomatis

    /* ------------------------------------------------------------------
     * TAB PROTECTION
     * 'allow-same-session' : beberapa tab dalam session sama DIIZINKAN
     *                        (hanya sinkronisasi logout/aktivitas).
     * 'single-active-tab'  : hanya satu tab aktif; tab kedua diblokir.
     * Validasi utama tab/device tetap dilakukan server.
     * ------------------------------------------------------------------ */
    TAB_PROTECTION: true,
    TAB_POLICY: 'allow-same-session',

    /* ------------------------------------------------------------------
     * CSRF (untuk AUTH_MODE 'cookie')
     * Token diambil dari: meta tag <meta name="csrf-token">, cookie
     * CSRF_COOKIE_NAME (double-submit), atau CSRF_TOKEN_ENDPOINT.
     * Header TIDAK ditambahkan bila aplikasi sudah mengirim header
     * dengan nama yang sama (tidak bertabrakan dengan system existing).
     * ------------------------------------------------------------------ */
    CSRF_PROTECTION: true,
    CSRF_TOKEN_ENDPOINT: '/security/csrf',
    CSRF_COOKIE_NAME: 'XSRF-TOKEN',
    CSRF_HEADER_NAME: 'X-CSRF-Token',
    CSRF_METHODS: ['POST', 'PUT', 'PATCH', 'DELETE'],
    CSRF_EXCLUDE_PATHS: [],              // pola path yang dikecualikan

    /* ------------------------------------------------------------------
     * XSS
     * XSS_DOM_GUARD: hapus <script> yang disisipkan DINAMIS ke DOM
     * setelah halaman dimuat (statis milik aplikasi tidak disentuh).
     * ------------------------------------------------------------------ */
    XSS_PROTECTION: true,
    XSS_DOM_GUARD: true,

    /* ------------------------------------------------------------------
     * SECURITY HEADERS
     * Header HTTP sebenarnya harus diset di SERVER (lihat
     * /security/server/ + README bagian 9). File security-headers.js
     * hanya lapisan tambahan: framebust + meta CSP (opsional).
     * META_CSP kosong = TIDAK di-set (hindari merusak aplikasi existing).
     * ------------------------------------------------------------------ */
    SECURITY_HEADERS: true,
    FRAMEBUST: true,
    META_CSP: '',

    /* ------------------------------------------------------------------
     * ACCESS CONTROL (lapisan frontend — backend tetap wajib memverifikasi)
     * ROLE_RULES contoh:
     *   [ { pattern: '/admin/**',      roles: ['admin'] },
     *     { pattern: '/operator/**',   roles: ['admin', 'operator'] },
     *     { pattern: '/superadmin/**', roles: ['superadmin'] } ]
     * ACCESS_FAIL_CLOSED true  = validasi gagal (network error) -> tolak akses
     * ACCESS_FAIL_CLOSED false = fail-open agar aplikasi tidak rusak (default)
     * ------------------------------------------------------------------ */
    ACCESS_CONTROL_ENABLED: true,
    ACCESS_FAIL_CLOSED: false,
    ROLE_RULES: [],

    /* ------------------------------------------------------------------
     * AUDIT LOG
     * Event di-cache lokal lalu dikirim batch ke AUDIT_REMOTE_ENDPOINT.
     * Modul TIDAK PERNAH mencatat password/token/secret (auto-redaksi).
     * ------------------------------------------------------------------ */
    AUDIT_LOG: true,
    AUDIT_REMOTE_ENDPOINT: '/security/audit',
    AUDIT_FLUSH_INTERVAL_SECONDS: 30,
    AUDIT_LOCAL_MAX: 200,
    AUDIT_LOCAL_RETENTION_DAYS: 7,

    /* ------------------------------------------------------------------
     * DEVICE / BROWSER SESSION
     * ID perangkat acak (bukan fingerprint invasif) dikirim sebagai
     * header saat login/validasi agar server bisa membedakan perangkat.
     * ------------------------------------------------------------------ */
    DEVICE_ID_STORAGE_KEY: 'security_device_id',
    SEND_DEVICE_ID_HEADER: true,
    DEVICE_ID_HEADER: 'X-Device-Id',

    /* ------------------------------------------------------------------
     * PENGHAPUSAN SAAT LOGOUT
     * Hanya kunci storage milik aplikasi yang AMAN untuk dihapus.
     * Jangan memasukkan data non-credential di sini. Cookie HttpOnly
     * dihapus oleh SERVER melalui endpoint logout (bukan dari JS).
     * ------------------------------------------------------------------ */
    CLEAR_ON_LOGOUT_KEYS: [],            // contoh: ['accessToken', 'refreshToken']

    /* ------------------------------------------------------------------
     * INTERNAL (tidak perlu diubah)
     * ------------------------------------------------------------------ */
    NOTICE_KEY: 'security_notice',
    SESSION_INFO_KEY: 'security_session_info',
    AL_DEADLINE_KEY: 'security_al_deadline',
    CHANNEL_NAME: 'app-security-channel'
  };

  /* --------------------------------------------------------------------
   * Deep merge sederhana untuk SECURITY_CONFIG_OVERRIDES
   * ------------------------------------------------------------------ */
  function mergeOverride(target, source) {
    if (!source || typeof source !== 'object') { return target; }
    Object.keys(source).forEach(function (key) {
      var value = source[key];
      if (Array.isArray(value)) {
        target[key] = value.slice();           // array: ganti utuh
      } else if (value && typeof value === 'object') {
        if (!target[key] || typeof target[key] !== 'object') { target[key] = {}; }
        mergeOverride(target[key], value);
      } else if (typeof value !== 'undefined') {
        target[key] = value;
      }
    });
    return target;
  }

  try {
    if (global.SECURITY_CONFIG_OVERRIDES && typeof global.SECURITY_CONFIG_OVERRIDES === 'object') {
      mergeOverride(SECURITY_CONFIG, global.SECURITY_CONFIG_OVERRIDES);
    }
  } catch (e) { /* abaikan — jangan pernah merusak halaman */ }

  global.SECURITY_CONFIG = SECURITY_CONFIG;
})(window);
