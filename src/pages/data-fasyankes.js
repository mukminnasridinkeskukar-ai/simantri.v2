// SIMANTRI — Data Fasyankes page logic
import { loadNakes, loadFasyankes, loadPraktik } from '../assets/js/demo-data.js';
import { calcExpireStatus, STATUS, statusBadgeClass, statusLabel } from '../assets/js/supabase.js';
import { fmtDate, fmtDateLong, daysUntil, initials, avatarColor, escapeHtml, toast, debounce, fmtNumber } from '../assets/js/utils.js';
import { renderStatCard } from '../components/layout/stat-card.js';

// Konfigurasi warna & ikon per jenis fasyankes
const JENIS_META = {
  'RS':              { color: 'bg-teal-50 text-teal-700 ring-teal-200',   icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Rumah Sakit' },
  'Puskesmas':       { color: 'bg-lime-50 text-lime-700 ring-lime-200',   icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', label: 'Puskesmas' },
  'Klinik Utama':    { color: 'bg-amber-50 text-amber-700 ring-amber-200', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Klinik Utama' },
  'Klinik Pratama':  { color: 'bg-amber-50 text-amber-700 ring-amber-200', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Klinik Pratama' },
  'Praktik Mandiri': { color: 'bg-rose-50 text-rose-700 ring-rose-200',   icon: 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9', label: 'Praktik Mandiri' },
  'Apotek':          { color: 'bg-ink-100 text-ink-700 ring-ink-200',     icon: 'M19 11H5m14 4H5m14-8H5m2-4h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V3a2 2 0 012-2z', label: 'Apotek' },
};

let allFasyankes = [];
let allNakes = [];
let allPraktik = [];
let filtered = [];
let filters = { search: '', jenis: '' };

export async function initDataFasyankes() {
  // Bind UI
  const searchInput = document.getElementById('fasyankes-search');
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      filters.search = e.target.value.trim();
      applyFilter();
    }, 250));
  }
  document.getElementById('fasyankes-filter-jenis')?.addEventListener('change', (e) => {
    filters.jenis = e.target.value;
    applyFilter();
  });
  document.querySelector('[data-action="refresh"]')?.addEventListener('click', async () => {
    toast('Memuat ulang data...', 'info');
    await refresh();
  });
  document.querySelector('[data-action="add-fasyankes"]')?.addEventListener('click', openFormModal);
  document.querySelector('[data-modal-close]')?.addEventListener('click', closeModal);
  document.querySelector('[data-form-close]')?.addEventListener('click', closeFormModal);
  document.querySelector('[data-view="map"]')?.addEventListener('click', () => {
    window.SIMANTRI.navigateTo('peta-sebaran');
  });

  await refresh();
}

async function refresh() {
  try {
    [allFasyankes, allNakes, allPraktik] = await Promise.all([
      loadFasyankes(),
      loadNakes(),
      loadPraktik(),
    ]);
    renderStats();
    applyFilter();
  } catch (err) {
    console.error(err);
    toast('Gagal memuat data: ' + err.message, 'error');
  }
}

function renderStats() {
  const c = document.getElementById('fasyankes-stats');
  if (!c) return;
  c.innerHTML = '';
  const totalFasyankes = allFasyankes.length;
  const totalNakes = allNakes.length;
  const totalPraktikAktif = allPraktik.filter((p) => calcExpireStatus(p.tgl_akhir_sip) === STATUS.AKTIF).length;
  const perluTindakLanjut = allPraktik.filter((p) => {
    const s = calcExpireStatus(p.tgl_akhir_sip);
    return s === STATUS.HAMPIR_EXPIRED || s === STATUS.EXPIRED;
  }).length + allNakes.filter((n) => {
    const s = calcExpireStatus(n.tgl_akhir_str);
    return s === STATUS.HAMPIR_EXPIRED || s === STATUS.EXPIRED;
  }).length;

  const cards = [
    { label: 'Total Fasyankes', value: fmtNumber(totalFasyankes), sub: 'RS, Puskesmas, klinik, apotek, praktik', icon: 'hospital', variant: 'teal' },
    { label: 'Total Nakes', value: fmtNumber(totalNakes), sub: 'Terdaftar di seluruh fasyankes', icon: 'users', variant: 'lime' },
    { label: 'Total Praktik Aktif', value: fmtNumber(totalPraktikAktif), sub: `${allPraktik.length} total SIP tercatat`, icon: 'shield', variant: 'amber' },
    { label: 'Perlu Tindak Lanjut', value: fmtNumber(perluTindakLanjut), sub: 'STR/SIP hampir/expired', icon: 'alert', variant: 'rose' },
  ];
  cards.forEach((opt) => {
    const div = document.createElement('div');
    c.appendChild(div);
    renderStatCard(div, opt);
  });
}

function applyFilter() {
  filtered = allFasyankes.filter((f) => {
    if (filters.jenis && f.jenis !== filters.jenis) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const hay = `${f.nama} ${f.alamat ?? ''} ${f.jenis}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  renderGrid();
}

function renderGrid() {
  const grid = document.getElementById('fasyankes-grid');
  if (!grid) return;

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="col-span-full card p-12 text-center">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-ink-100 text-ink-400 mb-3">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5"/></svg>
        </div>
        <p class="font-bold text-ink-800">Tidak ada fasyankes ditemukan</p>
        <p class="text-sm text-ink-500 mt-1">Coba ubah kata kunci atau filter jenis</p>
        <button class="btn-outline btn-sm mt-4" data-action="add-fasyankes-empty">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
          Tambah Fasyankes Baru
        </button>
      </div>
    `;
    grid.querySelector('[data-action="add-fasyankes-empty"]')?.addEventListener('click', openFormModal);
    return;
  }

  grid.innerHTML = filtered.map((f) => {
    const meta = JENIS_META[f.jenis] ?? JENIS_META['Apotek'];
    const nakesList = allNakes.filter((n) => n.fasyankes_id === f.id);
    const praktikList = allPraktik.filter((p) => p.fasyankes_id === f.id);
    const sipAktif = praktikList.filter((p) => calcExpireStatus(p.tgl_akhir_sip) === STATUS.AKTIF).length;
    const perluTindakLanjut = nakesList.filter((n) => {
      const s = calcExpireStatus(n.tgl_akhir_str);
      return s === STATUS.HAMPIR_EXPIRED || s === STATUS.EXPIRED;
    }).length;

    return `
      <div class="card p-5 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 cursor-pointer" data-fasyankes-id="${f.id}">
        <!-- Header -->
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-11 h-11 rounded-xl ring-1 ${meta.color} flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="${meta.icon}"/></svg>
            </div>
            <div class="min-w-0">
              <p class="font-bold text-ink-900 leading-tight truncate">${escapeHtml(f.nama)}</p>
              <p class="text-xs text-ink-500 mt-0.5">${escapeHtml(meta.label ?? f.jenis)}</p>
            </div>
          </div>
          <span class="badge-teal !text-[10px] flex-shrink-0">${escapeHtml(f.jenis)}</span>
        </div>

        <!-- Alamat -->
        <div class="flex items-start gap-1.5 text-xs text-ink-600 mb-4 min-h-[2.5rem]">
          <svg class="w-3.5 h-3.5 text-ink-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          <span class="line-clamp-2">${escapeHtml(f.alamat ?? 'Alamat tidak tersedia')}</span>
        </div>

        <!-- Stats row -->
        <div class="grid grid-cols-3 gap-2 pt-3 border-t border-ink-100">
          <div class="text-center">
            <p class="text-lg font-bold text-ink-900 tabular-nums">${nakesList.length}</p>
            <p class="text-[10px] text-ink-500 uppercase tracking-wider">Nakes</p>
          </div>
          <div class="text-center">
            <p class="text-lg font-bold text-teal-600 tabular-nums">${sipAktif}</p>
            <p class="text-[10px] text-ink-500 uppercase tracking-wider">SIP Aktif</p>
          </div>
          <div class="text-center">
            <p class="text-lg font-bold ${perluTindakLanjut > 0 ? 'text-amber-600' : 'text-ink-300'} tabular-nums">${perluTindakLanjut}</p>
            <p class="text-[10px] text-ink-500 uppercase tracking-wider">Tindak Lanjut</p>
          </div>
        </div>

        <!-- Status footer -->
        <div class="mt-3 pt-3 border-t border-ink-100 flex items-center justify-between">
          <span class="inline-flex items-center gap-1.5 text-xs text-ink-600">
            <span class="w-1.5 h-1.5 rounded-full ${f.status === 'aktif' ? 'bg-teal-500 animate-pulse-dot' : 'bg-ink-300'}"></span>
            ${f.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
          </span>
          <span class="text-xs font-semibold text-teal-600 inline-flex items-center gap-1">
            Lihat detail
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </span>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('[data-fasyankes-id]').forEach((card) => {
    card.addEventListener('click', () => {
      const f = allFasyankes.find((x) => x.id === card.dataset.fasyankesId);
      if (f) openModal(f);
    });
  });
}

function openModal(f) {
  const modal = document.getElementById('fasyankes-modal');
  const content = document.getElementById('fasyankes-modal-content');
  if (!modal || !content) return;

  const meta = JENIS_META[f.jenis] ?? JENIS_META['Apotek'];
  const nakesList = allNakes.filter((n) => n.fasyankes_id === f.id);
  const praktikList = allPraktik.filter((p) => p.fasyankes_id === f.id);
  const sipAktif = praktikList.filter((p) => calcExpireStatus(p.tgl_akhir_sip) === STATUS.AKTIF).length;
  const sipHampir = praktikList.filter((p) => calcExpireStatus(p.tgl_akhir_sip) === STATUS.HAMPIR_EXPIRED).length;
  const sipExpired = praktikList.filter((p) => calcExpireStatus(p.tgl_akhir_sip) === STATUS.EXPIRED).length;

  content.innerHTML = `
    <!-- Header -->
    <div class="p-6 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-t-xl2">
      <div class="flex items-start gap-4">
        <div class="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="${meta.icon}"/></svg>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-xl font-bold">${escapeHtml(f.nama)}</h3>
          <p class="text-teal-100 text-sm mt-0.5">${escapeHtml(meta.label ?? f.jenis)}</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <span class="badge bg-white/20 text-white">${escapeHtml(f.jenis)}</span>
            <span class="badge ${f.status === 'aktif' ? 'bg-teal-400/30 text-white' : 'bg-rose-400/30 text-white'}">${f.status === 'aktif' ? 'Aktif' : 'Nonaktif'}</span>
          </div>
        </div>
        <button data-modal-close class="text-white/70 hover:text-white p-1" aria-label="Tutup">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    </div>

    <!-- Body -->
    <div class="p-6 space-y-5">
      <!-- Info grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="sm:col-span-2">
          <p class="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">Alamat</p>
          <p class="text-sm font-semibold text-ink-800">${escapeHtml(f.alamat ?? '-')}</p>
        </div>
        <div>
          <p class="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">Koordinat (Lat/Lng)</p>
          <p class="text-sm font-mono font-semibold text-ink-800">${escapeHtml(f.lat_lng ?? '-')}</p>
        </div>
        <div>
          <p class="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">ID Fasyankes</p>
          <p class="text-sm font-mono font-semibold text-ink-800">${escapeHtml(f.id)}</p>
        </div>
      </div>

      <!-- Statistik ringkasan -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="rounded-xl bg-teal-50 p-3 text-center">
          <p class="text-2xl font-extrabold text-teal-700 tabular-nums">${nakesList.length}</p>
          <p class="text-[10px] text-teal-600 font-semibold uppercase tracking-wider mt-0.5">Total Nakes</p>
        </div>
        <div class="rounded-xl bg-lime-50 p-3 text-center">
          <p class="text-2xl font-extrabold text-lime-700 tabular-nums">${sipAktif}</p>
          <p class="text-[10px] text-lime-600 font-semibold uppercase tracking-wider mt-0.5">SIP Aktif</p>
        </div>
        <div class="rounded-xl bg-amber-50 p-3 text-center">
          <p class="text-2xl font-extrabold text-amber-700 tabular-nums">${sipHampir}</p>
          <p class="text-[10px] text-amber-600 font-semibold uppercase tracking-wider mt-0.5">Hampir Expired</p>
        </div>
        <div class="rounded-xl bg-rose-50 p-3 text-center">
          <p class="text-2xl font-extrabold text-rose-700 tabular-nums">${sipExpired}</p>
          <p class="text-[10px] text-rose-600 font-semibold uppercase tracking-wider mt-0.5">SIP Expired</p>
        </div>
      </div>

      <!-- Daftar nakes -->
      <div>
        <h4 class="font-bold text-ink-800 mb-3 flex items-center gap-2">
          <svg class="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-2-5.24"/></svg>
          Daftar Nakes Terdaftar (${nakesList.length})
        </h4>
        ${nakesList.length === 0
          ? `<div class="rounded-xl bg-ink-50 p-6 text-center text-sm text-ink-500 italic">Belum ada nakes terdaftar di fasyankes ini</div>`
          : `<div class="space-y-2">${nakesList.map((n) => {
              const s = n.expire_status ?? calcExpireStatus(n.tgl_akhir_str);
              const d = daysUntil(n.tgl_akhir_str);
              return `
                <div class="flex items-center gap-3 p-3 rounded-xl border border-ink-100 hover:border-ink-200 hover:bg-ink-50/50 transition-colors">
                  <div class="w-9 h-9 rounded-full ${avatarColor(n.nama)} flex items-center justify-center text-white font-bold text-xs flex-shrink-0">${initials(n.nama)}</div>
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-sm text-ink-800 truncate">${escapeHtml(n.nama)}</p>
                    <p class="text-xs text-ink-500 truncate">${escapeHtml(n.profesi)} • STR berakhir ${fmtDate(n.tgl_akhir_str)}</p>
                  </div>
                  <span class="${statusBadgeClass(s)} flex-shrink-0 !text-[10px]">${statusLabel(s)}</span>
                </div>
              `;
            }).join('')}</div>`
        }
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap gap-2 pt-4 border-t border-ink-100">
        <button class="btn-primary btn-sm" data-action="edit">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          Edit Fasyankes
        </button>
        <button class="btn-outline btn-sm" data-action="view-nakes">Lihat Semua Nakes</button>
        <button class="btn-ghost btn-sm text-rose-600 hover:bg-rose-50" data-action="delete">Nonaktifkan</button>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  content.querySelector('[data-modal-close]')?.addEventListener('click', closeModal);
  content.querySelector('[data-action="edit"]')?.addEventListener('click', () => toast('Form edit fasyankes akan dibuka', 'info'));
  content.querySelector('[data-action="view-nakes"]')?.addEventListener('click', () => {
    closeModal();
    window.SIMANTRI.navigateTo('data-nakes');
  });
  content.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
    if (confirm(`Nonaktifkan ${f.nama}?`)) toast('Fasyankes dinonaktifkan (demo)', 'success');
  });
}

function openFormModal() {
  const modal = document.getElementById('fasyankes-form-modal');
  const content = document.getElementById('fasyankes-form-content');
  if (!modal || !content) return;

  content.innerHTML = `
    <!-- Header -->
    <div class="px-6 py-5 border-b border-ink-100 flex items-center justify-between">
      <div>
        <h3 class="font-bold text-ink-900">Tambah Fasyankes Baru</h3>
        <p class="text-xs text-ink-500 mt-0.5">Lengkapi data fasyankes/praktik mandiri</p>
      </div>
      <button data-form-close class="text-ink-400 hover:text-ink-700 p-1" aria-label="Tutup">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>

    <!-- Form -->
    <form id="fasyankes-add-form" class="p-6 space-y-4">
      <div>
        <label class="label" for="form-nama">Nama Fasyankes <span class="text-rose-500">*</span></label>
        <input type="text" id="form-nama" class="input" placeholder="cth. RSUD Dr. Soetomo" required />
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="label" for="form-jenis">Jenis <span class="text-rose-500">*</span></label>
          <select id="form-jenis" class="select" required>
            <option value="">Pilih jenis...</option>
            <option value="RS">Rumah Sakit</option>
            <option value="Puskesmas">Puskesmas</option>
            <option value="Klinik Utama">Klinik Utama</option>
            <option value="Klinik Pratama">Klinik Pratama</option>
            <option value="Praktik Mandiri">Praktik Mandiri</option>
            <option value="Apotek">Apotek</option>
          </select>
        </div>
        <div>
          <label class="label" for="form-status">Status <span class="text-rose-500">*</span></label>
          <select id="form-status" class="select" required>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>
        </div>
      </div>
      <div>
        <label class="label" for="form-alamat">Alamat Lengkap <span class="text-rose-500">*</span></label>
        <textarea id="form-alamat" class="textarea" rows="2" placeholder="Jalan, nomor, kota, kode pos" required></textarea>
      </div>
      <div>
        <label class="label" for="form-latlng">Koordinat (Latitude, Longitude)</label>
        <input type="text" id="form-latlng" class="input font-mono" placeholder="-7.2756,112.7423" />
        <p class="text-[10px] text-ink-500 mt-1">Opsional. Boleh dikosongkan, akan diambil dari alamat.</p>
      </div>

      <div class="flex justify-end gap-2 pt-4 border-t border-ink-100">
        <button type="button" class="btn-outline btn-sm" data-form-close>Batal</button>
        <button type="submit" class="btn-primary btn-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          Simpan Fasyankes
        </button>
      </div>
    </form>
  `;

  modal.classList.remove('hidden');
  content.querySelector('[data-form-close]')?.addEventListener('click', closeFormModal);
  content.querySelector('#fasyankes-add-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nama = content.querySelector('#form-nama').value.trim();
    if (!nama) { toast('Nama fasyankes wajib diisi', 'error'); return; }
    toast(`Fasyankes "${nama}" berhasil ditambahkan (demo)`, 'success');
    closeFormModal();
    // Untuk demo, kita tidak benar-benar menambah ke list. Refresh tetap aman.
    refresh();
  });
}

function closeModal() {
  document.getElementById('fasyankes-modal')?.classList.add('hidden');
}

function closeFormModal() {
  document.getElementById('fasyankes-form-modal')?.classList.add('hidden');
}
