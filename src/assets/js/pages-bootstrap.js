// ============================================
// SIMANTRI — page bootstrap
// Dipanggil dari app.js setiap kali page selesai dimuat.
// ============================================
const PAGE_INITS = {
  'pages/dashboard':             () => import('../../pages/dashboard.js').then((m) => m.initDashboard()),
  'pages/peta-sebaran':          () => import('../../pages/peta-sebaran.js').then((m) => m.initPetaSebaran()),
  'pages/notifikasi-expired':    () => import('../../pages/notifikasi-expired.js').then((m) => m.initNotifikasiExpired()),
  'pages/data-nakes':            () => import('../../pages/data-nakes.js').then((m) => m.initDataNakes()),
  'pages/data-tenaga-kesehatan': () => import('../../pages/data-tenaga-kesehatan.js').then((m) => m.initDataTenagaKesehatan()),
  'pages/data-fasyankes':        () => import('../../pages/data-fasyankes.js').then((m) => m.initDataFasyankes()),
  'pages/jadwal-praktik':        () => import('../../pages/jadwal-praktik.js').then((m) => m.initJadwalPraktik()),
  'pages/verifikasi':            () => import('../../pages/verifikasi.js').then((m) => m.initVerifikasi()),
  'pages/perpanjangan':          () => import('../../pages/perpanjangan.js').then((m) => m.initPerpanjangan()),
  'pages/laporan':               () => import('../../pages/laporan.js').then((m) => m.initLaporan()),
  'pages/manajemen-user':        () => import('../../pages/manajemen-user.js').then((m) => m.initManajemenUser()),
  'pages/pengaturan':            () => import('../../pages/pengaturan.js').then((m) => m.initPengaturan()),
};

export function bootstrapPage(routePath) {
  const init = PAGE_INITS[routePath];
  if (!init) return Promise.resolve();
  return init().catch((err) => {
    console.error('[bootstrap]', routePath, err);
    const slot = document.getElementById('view-slot');
    if (slot) {
      const errDiv = document.createElement('div');
      errDiv.className = 'card p-6 border-l-4 border-l-rose-500 bg-rose-50/50';
      errDiv.innerHTML = `
        <p class="font-bold text-rose-700">Gagal memuat halaman</p>
        <p class="text-sm text-rose-600 mt-1">${err.message}</p>
        <button onclick="location.reload()" class="btn-outline btn-sm mt-3">Muat ulang</button>
      `;
      slot.prepend(errDiv);
    }
  });
}
