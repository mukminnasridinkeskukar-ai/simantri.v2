/* ============================================================================
 * /security/access-control.js — PROTEKSI HALAMAN (LAPISAN FRONTEND)
 * ----------------------------------------------------------------------------
 * ⚠ PRINSIP UTAMA: frontend HANYA lapisan tambahan. Keamanan sesungguhnya
 * (authentication + authorization) WAJIB diverifikasi di backend/API/database
 * untuk SETIAP request data. Menyembunyikan menu dengan CSS tidak pernah
 * cukup — halaman ini memastikan halaman protected diredirect bila session
 * tidak valid, dan role tidak sesuai.
 *
 * Yang dilakukan modul ini:
 *  1. Saat halaman protected dibuka: pastikan session divalidasi (server).
 *  2. Session tidak valid / dicabut -> redirect ke login (oleh Session).
 *  3. Aturan ROLE_RULES per path (config) -> bila role tidak memenuhi,
 *     tampilkan "Akses ditolak" dan kembalikan ke HOME_URL.
 *  4. Elemen beratribut data-security-requires-role="admin,operator"
 *     disembunyikan bila role tidak cocok (opsional, opt-in via markup).
 *
 * ACCESS_FAIL_CLOSED (default false): bila true, kegagalan jaringan saat
 * validasi membuat halaman ditolak (fail-closed). Default fail-open agar
 * aplikasi existing tidak rusak ketika server sesaat tidak reachable.
 * Untuk SPA, panggil AppSecurity.recheckRoute() setiap ganti route.
 * ==========================================================================*/
(function (global) {
  'use strict';

  var NS = global.AppSecurity = global.AppSecurity || {};
  var CFG = global.SECURITY_CONFIG || {};
  var U = NS.utils || {};
  var log = NS.log || function () {};
  var audit = function (ev, det, sev) { return NS.audit && NS.audit(ev, det, sev); };

  function rulesFor(path) {
    var rules = CFG.ROLE_RULES || [];
    var matched = [];
    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      if (rule && rule.pattern && U.matchesPath(path, [rule.pattern])) {
        matched = matched.concat(rule.roles || []);
      }
    }
    return matched; // array kosong = tidak ada syarat role khusus
  }

  function rolesIntersect(required, owned) {
    if (!required || !required.length) { return true; }
    if (!owned || !owned.length) { return false; }
    for (var i = 0; i < required.length; i++) {
      if (owned.indexOf(required[i]) !== -1) { return true; }
    }
    return false;
  }

  function denyAccess(reason, requiredRoles) {
    audit(NS.AuditLog ? NS.AuditLog.EVENTS.SENSITIVE_ACTION : 'SENSITIVE_ACTION',
      { action: 'ACCESS_DENIED', path: global.location.pathname, reason: reason, requiredRoles: requiredRoles }, 'warn');
    U.overlay && U.overlay({
      title: 'Akses Ditolak',
      message: 'Anda tidak memiliki izin untuk membuka halaman ini.',
      buttons: [{
        label: 'Kembali ke Beranda', primary: true, onClick: function () {
          global.location.href = CFG.HOME_URL || '/';
        }
      }]
    });
    setTimeout(function () {
      if (global.location.pathname !== (CFG.HOME_URL || '/')) {
        global.location.href = CFG.HOME_URL || '/';
      }
    }, 6000);
  }

  /* ----------------------------- Pemeriksaan ------------------------------ */
  function enforce() {
    if (CFG.ACCESS_CONTROL_ENABLED === false) { return Promise.resolve(true); }
    if (!U.isProtectedPage || !U.isProtectedPage()) { return Promise.resolve(true); }

    var path = global.location.pathname;
    var requiredRoles = rulesFor(path);

    return NS.Session.validate().then(function (result) {
      // Session tidak valid sudah ditangani Session (redirect login).
      if (result && result.valid === false) { return false; }

      if (result && result.unknown) {
        // Validasi tidak dapat dipastikan (endpoint kosong / network error)
        if (CFG.ACCESS_FAIL_CLOSED === true) {
          denyAccess('validation_unavailable', requiredRoles);
          return false;
        }
        log('access-control: validasi tidak tersedia — fail-open (config)');
      }

      if (requiredRoles.length) {
        var owned = NS.Session.getRoles();
        if (!rolesIntersect(requiredRoles, owned)) {
          log('role tidak memenuhi:', owned, 'butuh', requiredRoles);
          denyAccess('role_insufficient', requiredRoles);
          return false;
        }
      }
      applyElementVisibility();
      return true;
    }).catch(function () {
      if (CFG.ACCESS_FAIL_CLOSED === true) {
        denyAccess('validation_error', requiredRoles);
        return false;
      }
      return true;
    });
  }

  /* --------------- Visibilitas elemen (opt-in via markup) ----------------- */
  function applyElementVisibility() {
    try {
      var els = document.querySelectorAll('[data-security-requires-role]');
      var owned = NS.Session.getRoles() || [];
      for (var i = 0; i < els.length; i++) {
        var needed = (els[i].getAttribute('data-security-requires-role') || '')
          .split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        if (needed.length && !rolesIntersect(needed, owned)) {
          els[i].style.display = 'none';          // hanya kosmetik; backend tetap wajib memeriksa!
        }
      }
    } catch (e) { log('element visibility error:', e && e.message); }
  }

  /* -------------------------------- Init ---------------------------------- */
  function init() {
    if (CFG.ACCESS_CONTROL_ENABLED === false) { log('access-control nonaktif (config)'); return; }
    enforce();
  }

  function recheckRoute() {
    // Untuk SPA: panggil setiap kali route berubah (React Router, dsb.)
    enforce();
  }

  function requireRole(roles) {
    var owned = NS.Session.getRoles() || [];
    var ok = rolesIntersect(roles || [], owned);
    if (!ok) { denyAccess('require_role', roles); }
    return ok;
  }

  NS.AccessControl = {
    init: init,
    recheckRoute: recheckRoute,
    requireRole: requireRole,
    rulesFor: rulesFor
  };
})(window);
