// SIMANTRI — Data Tenaga Kesehatan page logic
import { loadNakes, loadFasyankes, DEMO_PRAKTIK } from '../assets/js/demo-data.js';
import { calcExpireStatus, STATUS, statusBadgeClass, statusLabel } from '../assets/js/supabase.js';
import { fmtDate, fmtDateLong, daysUntil, initials, avatarColor, escapeHtml, toast, progressPercent, progressColorClass, debounce, fmtNumber } from '../assets/js/utils.js';

const JENIS_TENKES = ['Perawat', 'Bidan', 'Apoteker', 'TTK', 'ATLM', 'Gizi', 'Kesling'];

// Konfigurasi warna & ikon per profesi
const PROFESI_META = {
  Perawat:   { color: 'bg-teal-50 text-teal-700 ring-teal-200',   icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  Bidan:     { color: 'bg-rose-50 text-rose-700 ring-rose-200',     icon: 'M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12ZM12 7v5l3 3' },
  Apoteker:  { color: 'bg-lime-50 text-lime-700 ring-lime-200',    icon: 'M19 11H5m14 4H5m14-8H5m2-4h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V3a2 2 0 012-2z' },
  TTK:       { color: 'bg-amber-50 text-amber-700 ring-amber-200', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 5h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2z' },
  ATLM:      { color: 'bg-ink-100 text-ink-700 ring-ink-200',      icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
  Gizi:      { color: 'bg-lime-50 text-lime-700 ring-lime-200',    icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
  Kesling:   { color: 'bg-teal-50 text-teal-700 ring-teal-200',    icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
};

let allNakes = [];
let allFasyankes = [];
let filtered = [];
let filters = { search: '', fasyankesId: '', status: '', jenis: JENIS_TENKES };

export async function initDataTenagaKesehatan() {
  // Bind search input
  const searchInput = document.getElementById('tenkes-search');
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      filters.search = e.target.value.trim();
      applyFilter();
    }, 250));
  }
  document.getElementById('tenkes-filter-fasyankes')?.addEventListener('change', (e) => {
    filters.fasyankesId = e.target.value;
    applyFilter();
  });
  document.getElementById('tenkes-filter-status')?.addEventListener('change', (e) => {
    filters.status = e.target.value;
    applyFilter();
  });
  document.querySelector('[data-action="add-nakes"]')?.addEventListener('click', () => {
    toast('Form tambah tenaga kesehatan akan dibuka (perlu integrasi form modal)', 'info');
  });
  document.querySelector('[data-action="export-csv"]')?.addEventListener('click', exportCsv);
  document.querySelector('[data-modal-close]')?.addEventListener('click', closeModal);

  // Listen for "open nakes" event from global search
  document.addEventListener('simantri:open-nakes', (e) => {
    const id = e.detail?.id;
    if (id) {
      const n = allNakes.find((x) => x.id === id);
      if (n) openModal(n);
    }
  });

  // Load
  allFasyankes = await loadFasyankes();
  populateFasyankesFilter();
  await refresh();
}

function populateFasyankesFilter() {
  const sel = document.getElementById('tenkes-filter-fasyankes');
  if (!sel) return;
  sel.innerHTML = '<option value="">Semua Fasyankes</option>' +
    allFasyankes.map((f) => `<option value="${f.id}">${escapeHtml(f.nama)}</option>`).join('');
}

async function refresh() {
  try {
    allNakes = await loadNakes();
    renderProfesiChips();
    applyFilter();
  } catch (err) {
    console.error(err);
    toast('Gagal memuat data: ' + err.message, 'error');
  }
}

function renderProfesiChips() {
  const c = document.getElementById('profesi-chips');
  if (!c) return;
  c.innerHTML = JENIS_TENKES.map((j) => {
    const list = allNakes.filter((n) => n.jenis === j);
    const aktif = list.filter((n) => n.expire_status === STATUS.AKTIF).length;
    const meta = PROFESI_META[j] ?? PROFESI_META.ATLM;
    return `
      <button data-profesi="${j}" class="card p-3.5 text-left hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 group">
        <div class="flex items-center justify-between">
          <div class="w-9 h-9 rounded-lg ring-1 ${meta.color} flex items-center justify-center">
            <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="width:1.1rem;height:1.1rem"><path stroke-linecap="round" stroke-linejoin="round" d="${meta.icon}"/></svg>
          </div>
          <span class="text-2xl font-extrabold text-ink-900 tabular-nums">${list.length}</span>
        </div>
        <p class="mt-2 text-sm font-semibold text-ink-800">${escapeHtml(j)}</p>
        <p class="text-[10px] text-ink-500 mt-0.5">${aktif} aktif • ${list.length - aktif} perlu tindak lanjut</p>
      </button>
    `;
  }).join('');

  c.querySelectorAll('[data-profesi]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const j = btn.dataset.profesi;
      filters.jenis = [j];
      // visual hint
      c.querySelectorAll('[data-profesi]').forEach((b) => b.classList.remove('ring-2', 'ring-teal-500'));
      btn.classList.add('ring-2', 'ring-teal-500');
      // reset when clicking again? toggle behaviour
      applyFilter();
      toast(`Filter profesi: ${j}`, 'info');
    });
  });
}

function applyFilter() {
  filtered = allNakes.filter((n) => {
    if (!filters.jenis.includes(n.jenis)) return false;
    if (filters.fasyankesId && n.fasyankes_id !== filters.fasyankesId) return false;
    if (filters.status && n.expire_status !== filters.status) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const hay = `${n.nama} ${n.nik} ${n.no_str} ${n.profesi}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  renderTable();
}

function renderTable() {
  const tbody = document.getElementById('tenkes-tbody');
  if (!tbody) return;

  document.getElementById('tenkes-total').textContent = allNakes.filter((n) => JENIS_TENKES.includes(n.jenis)).length;
  document.getElementById('tenkes-showing').textContent = filtered.length;

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr><td colspan="8" class="text-center py-12">
        <div class="inline-flex flex-col items-center text-ink-500">
          <svg class="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <p class="font-semibold">Tidak ada data</p>
          <p class="text-sm mt-1">Coba ubah kata kunci atau filter</p>
        </div>
      </td></tr>`;
    return;
  }

  const fasyankesMap = Object.fromEntries(allFasyankes.map((f) => [f.id, f.nama]));
  tbody.innerHTML = filtered.map((n, idx) => {
    const s = n.expire_status;
    const d = daysUntil(n.tgl_akhir_str);
    const pct = progressPercent(n.tgl_terbit_str, n.tgl_akhir_str);
    const fasyankes = fasyankesMap[n.fasyankes_id] ?? '—';
    return `
      <tr data-nakes-id="${n.id}" class="cursor-pointer">
        <td class="text-ink-400 text-xs font-mono">${String(idx + 1).padStart(2, '0')}</td>
        <td>
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full ${avatarColor(n.nama)} flex items-center justify-center text-white font-bold text-xs flex-shrink-0">${initials(n.nama)}</div>
            <div class="min-w-0">
              <p class="font-semibold text-ink-800 truncate">${escapeHtml(n.nama)}</p>
              <p class="text-xs text-ink-500 truncate">${escapeHtml(n.profesi)}</p>
            </div>
          </div>
        </td>
        <td class="font-mono text-xs text-ink-600">${escapeHtml(n.nik ?? '-')}</td>
        <td class="font-mono text-xs"><span class="bg-ink-100 px-1.5 py-0.5 rounded">${escapeHtml(n.no_str ?? '-')}</span></td>
        <td>
          <div class="text-xs font-semibold text-ink-700">${fmtDate(n.tgl_akhir_str)}</div>
          <div class="mt-1 w-28">
            <div class="progress-track"><div class="progress-fill ${progressColorClass(pct)}" style="width:${pct}%"></div></div>
          </div>
          <div class="text-[10px] text-ink-500 mt-0.5">${d !== null ? (d < 0 ? `${-d} hari lalu` : `${d} hari lagi`) : '-'}</div>
        </td>
        <td class="text-xs text-ink-600">${escapeHtml(fasyankes)}</td>
        <td><span class="${statusBadgeClass(s)}">${statusLabel(s)}</span></td>
        <td class="text-right">
          <button data-action="view" data-nakes-id="${n.id}" class="btn-ghost btn-sm !px-2" aria-label="Lihat detail">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Row click
  tbody.querySelectorAll('tr[data-nakes-id]').forEach((tr) => {
    tr.addEventListener('click', (e) => {
      if (e.target.closest('[data-action]')) return;
      const n = allNakes.find((x) => x.id === tr.dataset.nakesId);
      if (n) openModal(n);
    });
  });
  tbody.querySelectorAll('[data-action="view"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const n = allNakes.find((x) => x.id === btn.dataset.nakesId);
      if (n) openModal(n);
    });
  });
}

async function openModal(n) {
  const modal = document.getElementById('tenkes-modal');
  const content = document.getElementById('tenkes-modal-content');
  if (!modal || !content) return;

  // Find related praktik
  const praktikList = DEMO_PRAKTIK.filter((p) => p.tenaga_id === n.id);
  const fasyankes = allFasyankes.find((f) => f.id === n.fasyankes_id);
  const s = n.expire_status;
  const d = daysUntil(n.tgl_akhir_str);
  const pct = progressPercent(n.tgl_terbit_str, n.tgl_akhir_str);
  const meta = PROFESI_META[n.jenis] ?? PROFESI_META.ATLM;

  content.innerHTML = `
    <!-- Header -->
    <div class="p-6 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-t-xl2">
      <div class="flex items-start gap-4">
        <div class="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold flex-shrink-0">${initials(n.nama)}</div>
        <div class="flex-1 min-w-0">
          <h3 class="text-xl font-bold">${escapeHtml(n.nama)}</h3>
          <p class="text-teal-100 text-sm mt-0.5">${escapeHtml(n.profesi)}</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <span class="badge bg-white/20 text-white">${escapeHtml(n.jenis)}</span>
            <span class="${statusBadgeClass(s)} !bg-white/20 !text-white !ring-white/30">${statusLabel(s)}</span>
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
        ${infoItem('NIK', n.nik, true)}
        ${infoItem('No. STR', n.no_str, true)}
        ${infoItem('Tanggal Terbit STR', fmtDateLong(n.tgl_terbit_str))}
        ${infoItem('Tanggal Akhir STR', fmtDateLong(n.tgl_akhir_str))}
        ${infoItem('Fasyankes', fasyankes?.nama ?? '-')}
        ${infoItem('Alamat Fasyankes', fasyankes?.alamat ?? '-')}
      </div>

      <!-- Progress STR -->
      <div class="bg-ink-50 rounded-xl p-4">
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm font-semibold text-ink-700">Progress Masa Berlaku STR</p>
          <span class="text-xs font-bold ${d < 0 ? 'text-rose-600' : d < 90 ? 'text-amber-600' : 'text-teal-600'}">${d < 0 ? `${-d} hari lalu` : `${d} hari lagi`}</span>
        </div>
        <div class="progress-track !h-2"><div class="progress-fill ${progressColorClass(pct)}" style="width:${pct}%"></div></div>
        <div class="flex justify-between text-[10px] text-ink-500 mt-1">
          <span>${fmtDate(n.tgl_terbit_str)}</span>
          <span>${pct}%</span>
          <span>${fmtDate(n.tgl_akhir_str)}</span>
        </div>
      </div>

      <!-- Profesi info -->
      <div class="rounded-xl ring-1 ${meta.color} p-4 flex items-start gap-3">
        <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="${meta.icon}"/></svg>
        <div class="text-sm">
          <p class="font-semibold">Profesi: ${escapeHtml(n.jenis)}</p>
          <p class="text-xs text-ink-600 mt-0.5">Termasuk kategori Tenaga Kesehatan (bukan Tenaga Medis). Terdaftar di Kemenkes sesuai profesi masing-masing.</p>
        </div>
      </div>

      <!-- Timeline perizinan -->
      <div>
        <h4 class="font-bold text-ink-800 mb-3 flex items-center gap-2">
          <svg class="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
          Timeline Perizinan & Praktik
        </h4>
        ${praktikList.length === 0
          ? `<p class="text-sm text-ink-500 italic">Belum ada riwayat praktik tercatat</p>`
          : `<div class="space-y-3">${praktikList.map((p, i) => renderTimelineItem(p, i === praktikList.length - 1)).join('')}</div>`
        }
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap gap-2 pt-4 border-t border-ink-100">
        <button class="btn-primary btn-sm" data-action="extend">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          Perpanjang STR
        </button>
        <button class="btn-outline btn-sm" data-action="edit">Edit Data</button>
        <button class="btn-ghost btn-sm text-rose-600 hover:bg-rose-50" data-action="delete">Hapus</button>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  content.querySelector('[data-modal-close]')?.addEventListener('click', closeModal);
  content.querySelector('[data-action="extend"]')?.addEventListener('click', () => {
    closeModal();
    toast('Membuka form perpanjangan...', 'info');
    window.SIMANTRI.navigateTo('perpanjangan');
  });
  content.querySelector('[data-action="edit"]')?.addEventListener('click', () => toast('Form edit akan dibuka', 'info'));
  content.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
    if (confirm(`Hapus ${n.nama}?`)) toast('Data dihapus (demo)', 'success');
  });
}

function renderTimelineItem(p, isLast) {
  let jadwal = '-';
  try { jadwal = Object.keys(JSON.parse(p.jadwal_json || '{}')).join(', '); } catch {}
  const s = calcExpireStatus(p.tgl_akhir_sip);
  return `
    <div class="flex gap-3">
      <div class="flex flex-col items-center flex-shrink-0">
        <div class="w-8 h-8 rounded-full ${p.status === 'aktif' ? 'bg-teal-100 text-teal-700' : 'bg-ink-100 text-ink-500'} flex items-center justify-center">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        ${!isLast ? `<div class="w-px h-full bg-ink-200 flex-1 my-1"></div>` : ''}
      </div>
      <div class="flex-1 pb-4">
        <div class="flex items-center gap-2 flex-wrap">
          <p class="font-semibold text-sm text-ink-800">No. SIP: <code class="text-xs bg-ink-100 px-1.5 py-0.5 rounded">${escapeHtml(p.no_sip)}</code></p>
          <span class="${statusBadgeClass(s)} !text-[10px]">${statusLabel(s)}</span>
        </div>
        <p class="text-xs text-ink-600 mt-1">Terbit ${fmtDate(p.tgl_terbit_sip)} • Berakhir ${fmtDate(p.tgl_akhir_sip)}</p>
        <p class="text-xs text-ink-500 mt-0.5">Jadwal: ${escapeHtml(jadwal)}</p>
      </div>
    </div>
  `;
}

function infoItem(label, value, mono = false) {
  return `
    <div>
      <p class="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">${escapeHtml(label)}</p>
      <p class="${mono ? 'font-mono text-xs' : 'text-sm'} font-semibold text-ink-800">${escapeHtml(value ?? '-')}</p>
    </div>
  `;
}

function closeModal() {
  document.getElementById('tenkes-modal')?.classList.add('hidden');
}

function exportCsv() {
  if (!filtered.length) { toast('Tidak ada data untuk diekspor', 'warning'); return; }
  const headers = ['Nama', 'Profesi', 'Jenis', 'NIK', 'No STR', 'Tgl Terbit STR', 'Tgl Akhir STR', 'Fasyankes', 'Status'];
  const rows = filtered.map((n) => [
    n.nama, n.profesi, n.jenis, n.nik, n.no_str,
    n.tgl_terbit_str, n.tgl_akhir_str,
    allFasyankes.find((f) => f.id === n.fasyankes_id)?.nama ?? '',
    statusLabel(n.expire_status),
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `data-tenaga-kesehatan-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast('CSV diekspor', 'success');
}
