// SIMANTRI — Jadwal Praktik page logic
import { loadNakes, loadFasyankes, loadPraktik } from '../assets/js/demo-data.js';
import { calcExpireStatus, STATUS, statusBadgeClass, statusLabel } from '../assets/js/supabase.js';
import { fmtDate, fmtDateLong, daysUntil, initials, avatarColor, escapeHtml, toast, debounce, fmtNumber } from '../assets/js/utils.js';

const DAYS = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
const DAY_LABELS = { senin: 'Senin', selasa: 'Selasa', rabu: 'Rabu', kamis: 'Kamis', jumat: 'Jumat', sabtu: 'Sabtu', minggu: 'Minggu' };

// Slot jam untuk grid view
const TIME_SLOTS = [
  { label: '07:00 - 09:00', start: 7, end: 9 },
  { label: '09:00 - 11:00', start: 9, end: 11 },
  { label: '11:00 - 13:00', start: 11, end: 13 },
  { label: '13:00 - 15:00', start: 13, end: 15 },
  { label: '15:00 - 17:00', start: 15, end: 17 },
  { label: '17:00 - 19:00', start: 17, end: 19 },
  { label: '19:00 - 21:00', start: 19, end: 21 },
];

let allNakes = [];
let allFasyankes = [];
let allPraktik = [];
let filters = { search: '', fasyankesId: '' };
let weekStart = getMonday(new Date());

export async function initJadwalPraktik() {
  // Bind UI
  const searchInput = document.getElementById('jadwal-search');
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      filters.search = e.target.value.trim();
      renderGrid();
      renderList();
    }, 250));
  }
  document.getElementById('jadwal-filter-fasyankes')?.addEventListener('change', (e) => {
    filters.fasyankesId = e.target.value;
    renderGrid();
    renderList();
  });
  document.querySelector('[data-action="prev-week"]')?.addEventListener('click', () => {
    weekStart = new Date(weekStart);
    weekStart.setDate(weekStart.getDate() - 7);
    renderGrid();
    renderList();
    updateRangeLabel();
  });
  document.querySelector('[data-action="next-week"]')?.addEventListener('click', () => {
    weekStart = new Date(weekStart);
    weekStart.setDate(weekStart.getDate() + 7);
    renderGrid();
    renderList();
    updateRangeLabel();
  });
  document.querySelector('[data-action="today"]')?.addEventListener('click', () => {
    weekStart = getMonday(new Date());
    renderGrid();
    renderList();
    updateRangeLabel();
    toast('Menampilkan minggu ini', 'info');
  });
  document.querySelector('[data-action="add-jadwal"]')?.addEventListener('click', () => {
    toast('Form tambah jadwal praktik akan dibuka (perlu integrasi form modal)', 'info');
  });
  document.querySelector('[data-modal-close]')?.addEventListener('click', closeModal);

  await refresh();
}

function getMonday(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay(); // 0=Min, 1=Sen
  const diff = day === 0 ? -6 : 1 - day; // Senin sebagai hari pertama
  date.setDate(date.getDate() + diff);
  return date;
}

async function refresh() {
  try {
    [allNakes, allFasyankes, allPraktik] = await Promise.all([
      loadNakes(),
      loadFasyankes(),
      loadPraktik(),
    ]);
    populateFasyankesFilter();
    renderStats();
    renderGrid();
    renderList();
    updateRangeLabel();
  } catch (err) {
    console.error(err);
    toast('Gagal memuat jadwal: ' + err.message, 'error');
  }
}

function populateFasyankesFilter() {
  const sel = document.getElementById('jadwal-filter-fasyankes');
  if (!sel) return;
  sel.innerHTML = '<option value="">Semua Fasyankes</option>' +
    allFasyankes.map((f) => `<option value="${f.id}">${escapeHtml(f.nama)}</option>`).join('');
}

function renderStats() {
  const c = document.getElementById('jadwal-stats');
  if (!c) return;

  const today = new Date();
  const todayKey = DAYS[(today.getDay() + 6) % 7]; // 0->minggu mapping: Senin=0

  // Hitung jadwal untuk hari ini
  const todayCount = countTodaySchedules(todayKey);
  const totalJadwal = allPraktik.reduce((sum, p) => {
    try {
      const j = JSON.parse(p.jadwal_json || '{}');
      return sum + Object.keys(j).length;
    } catch { return sum; }
  }, 0);

  c.innerHTML = `
    <div class="card p-5">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold text-ink-500 uppercase tracking-wider">Total Jadwal</p>
          <p class="mt-2 text-3xl font-extrabold text-ink-900 tabular-nums">${fmtNumber(totalJadwal)}</p>
          <p class="mt-1.5 text-xs text-ink-500">slot praktik terdaftar</p>
        </div>
        <div class="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
        </div>
      </div>
    </div>
    <div class="card p-5">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold text-ink-500 uppercase tracking-wider">Jadwal Hari Ini</p>
          <p class="mt-2 text-3xl font-extrabold text-amber-600 tabular-nums">${fmtNumber(todayCount)}</p>
          <p class="mt-1.5 text-xs text-ink-500">${DAY_LABELS[todayKey]}, ${fmtDate(today.toISOString())}</p>
        </div>
        <div class="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
      </div>
    </div>
    <div class="card p-5">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold text-ink-500 uppercase tracking-wider">Total Praktik Aktif</p>
          <p class="mt-2 text-3xl font-extrabold text-teal-600 tabular-nums">${fmtNumber(allPraktik.filter((p) => calcExpireStatus(p.tgl_akhir_sip) === STATUS.AKTIF).length)}</p>
          <p class="mt-1.5 text-xs text-ink-500">SIP aktif terdaftar</p>
        </div>
        <div class="w-11 h-11 rounded-xl bg-lime-50 text-lime-600 flex items-center justify-center">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
        </div>
      </div>
    </div>
  `;
}

function countTodaySchedules(dayKey) {
  const nakesMap = Object.fromEntries(allNakes.map((n) => [n.id, n]));
  return allPraktik.filter((p) => {
    if (filters.fasyankesId && p.fasyankes_id !== filters.fasyankesId) return false;
    if (filters.search) {
      const n = nakesMap[p.tenaga_id];
      if (!n || !n.nama.toLowerCase().includes(filters.search.toLowerCase())) return false;
    }
    try {
      const j = JSON.parse(p.jadwal_json || '{}');
      // Cek apakah dayKey ada sebagai key atau bagian dari range (cth. senin_jumat)
      return Object.keys(j).some((k) => k.includes(dayKey));
    } catch { return false; }
  }).length;
}

function updateRangeLabel() {
  const label = document.getElementById('jadwal-range-label');
  if (!label) return;
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  label.textContent = `${fmtDate(weekStart.toISOString())} - ${fmtDate(end.toISOString())}`;

  // Update tanggal di header kolom
  DAYS.forEach((day, i) => {
    const head = document.querySelector(`.jadwal-day-head[data-day="${day}"]`);
    if (!head) return;
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const isToday = d.toDateString() === new Date().toDateString();
    head.querySelector('.jadwal-day-date').textContent = fmtDate(d.toISOString(), { day: 'numeric', month: 'short' });
    head.classList.toggle('bg-teal-50', isToday);
    head.querySelector('p').classList.toggle('text-teal-700', isToday);
  });
}

function parseJadwal(jadwalJson) {
  try { return JSON.parse(jadwalJson || '{}'); } catch { return {}; }
}

function getJadwalForDay(jadwal, dayKey) {
  // Cari key yang match persis atau mengandung dayKey (untuk range seperti senin_jumat)
  const result = [];
  for (const [k, v] of Object.entries(jadwal)) {
    const days = k.split('_');
    if (days.includes(dayKey)) {
      result.push({ ...v, pattern: k });
    }
  }
  return result;
}

function getSlotColor(start, end) {
  const avg = (start + end) / 2;
  if (avg < 12) return 'bg-teal-100 border-teal-300 text-teal-800';
  if (avg < 15) return 'bg-amber-100 border-amber-300 text-amber-800';
  return 'bg-rose-100 border-rose-300 text-rose-800';
}

function getFilteredPraktik() {
  const nakesMap = Object.fromEntries(allNakes.map((n) => [n.id, n]));
  return allPraktik.filter((p) => {
    if (filters.fasyankesId && p.fasyankes_id !== filters.fasyankesId) return false;
    if (filters.search) {
      const n = nakesMap[p.tenaga_id];
      if (!n || !n.nama.toLowerCase().includes(filters.search.toLowerCase())) return false;
    }
    return true;
  });
}

function renderGrid() {
  const grid = document.getElementById('jadwal-grid');
  if (!grid) return;

  const nakesMap = Object.fromEntries(allNakes.map((n) => [n.id, n]));
  const fasyankesMap = Object.fromEntries(allFasyankes.map((f) => [f.id, f.nama]));
  const praktikFiltered = getFilteredPraktik();

  // Build rows
  let html = '';
  TIME_SLOTS.forEach((slot) => {
    html += `<div class="grid grid-cols-8 border-b border-ink-100 last:border-b-0">`;
    html += `<div class="p-3 text-xs font-semibold text-ink-600 bg-ink-50/30 flex items-center justify-center tabular-nums">${slot.label}</div>`;
    DAYS.forEach((day) => {
      const items = [];
      for (const p of praktikFiltered) {
        const jadwal = parseJadwal(p.jadwal_json);
        const daySlots = getJadwalForDay(jadwal, day);
        for (const ds of daySlots) {
          if (!ds.mulai || !ds.selesai) continue;
          const start = parseInt(ds.mulai.split(':')[0], 10);
          const end = parseInt(ds.selesai.split(':')[0], 10);
          if (start < slot.end && end > slot.start) {
            const n = nakesMap[p.tenaga_id];
            items.push({
              id: p.id,
              nama: n?.nama ?? '—',
              profesi: n?.profesi ?? '',
              fasyankes: fasyankesMap[p.fasyankes_id] ?? '—',
              mulai: ds.mulai,
              selesai: ds.selesai,
              no_sip: p.no_sip,
              tgl_akhir_sip: p.tgl_akhir_sip,
            });
          }
        }
      }
      html += `<div class="border-l border-ink-100 p-1.5 min-h-[80px] ${items.length > 1 ? 'bg-teal-50/20' : ''}">`;
      if (items.length === 0) {
        html += `<div class="h-full flex items-center justify-center text-[10px] text-ink-300">—</div>`;
      } else {
        items.slice(0, 3).forEach((it) => {
          const color = getSlotColor(parseInt(it.mulai.split(':')[0], 10), parseInt(it.selesai.split(':')[0], 10));
          html += `
            <button data-jadwal-id="${it.id}" class="block w-full text-left p-1.5 rounded-md border ${color} mb-1 hover:shadow-sm transition-shadow">
              <p class="text-[10px] font-bold leading-tight truncate">${escapeHtml(it.nama)}</p>
              <p class="text-[9px] opacity-80 leading-tight truncate">${escapeHtml(it.mulai)} - ${escapeHtml(it.selesai)}</p>
            </button>
          `;
        });
        if (items.length > 3) {
          html += `<p class="text-[9px] text-ink-500 text-center mt-0.5">+${items.length - 3} lainnya</p>`;
        }
      }
      html += `</div>`;
    });
    html += `</div>`;
  });

  grid.innerHTML = html;

  // Bind click on jadwal cells
  grid.querySelectorAll('[data-jadwal-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = allPraktik.find((x) => x.id === btn.dataset.jadwalId);
      if (p) openModal(p);
    });
  });
}

function renderList() {
  const list = document.getElementById('jadwal-list');
  if (!list) return;

  const nakesMap = Object.fromEntries(allNakes.map((n) => [n.id, n]));
  const fasyankesMap = Object.fromEntries(allFasyankes.map((f) => [f.id, f.nama]));
  const praktikFiltered = getFilteredPraktik();

  // Group by day
  const byDay = {};
  DAYS.forEach((d) => (byDay[d] = []));

  for (const p of praktikFiltered) {
    const jadwal = parseJadwal(p.jadwal_json);
    const n = nakesMap[p.tenaga_id];
    for (const [pattern, slot] of Object.entries(jadwal)) {
      const days = pattern.split('_');
      days.forEach((d) => {
        if (byDay[d]) {
          byDay[d].push({
            id: p.id,
            nama: n?.nama ?? '—',
            profesi: n?.profesi ?? '',
            fasyankes: fasyankesMap[p.fasyankes_id] ?? '—',
            mulai: slot.mulai,
            selesai: slot.selesai,
            no_sip: p.no_sip,
            pattern,
          });
        }
      });
    }
  }

  // Today highlight
  const today = new Date();
  const todayKey = DAYS[(today.getDay() + 6) % 7];

  let html = '';
  let hasAny = false;
  DAYS.forEach((day) => {
    const items = byDay[day];
    if (!items.length) return;
    hasAny = true;
    items.sort((a, b) => (a.mulai || '').localeCompare(b.mulai || ''));
    const isToday = day === todayKey;
    html += `
      <div class="p-5 ${isToday ? 'bg-amber-50/40' : ''}">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <h4 class="font-bold text-ink-900">${DAY_LABELS[day]}</h4>
            ${isToday ? `<span class="badge-amber !text-[10px]">Hari ini</span>` : ''}
          </div>
          <span class="text-xs text-ink-500">${items.length} jadwal</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          ${items.map((it) => {
            const color = getSlotColor(parseInt(it.mulai?.split(':')[0] ?? '0', 10), parseInt(it.selesai?.split(':')[0] ?? '0', 10));
            return `
              <button data-jadwal-id="${it.id}" class="text-left p-3 rounded-xl border ${color} hover:shadow-card transition-shadow">
                <div class="flex items-center gap-2 mb-1">
                  <div class="w-7 h-7 rounded-full ${avatarColor(it.nama)} flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">${initials(it.nama)}</div>
                  <p class="text-xs font-bold text-ink-800 truncate flex-1">${escapeHtml(it.nama)}</p>
                </div>
                <p class="text-[10px] opacity-80 truncate">${escapeHtml(it.profesi)}</p>
                <div class="flex items-center justify-between mt-1.5">
                  <span class="text-[10px] font-bold tabular-nums">${escapeHtml(it.mulai)} - ${escapeHtml(it.selesai)}</span>
                  <span class="text-[9px] opacity-70 truncate max-w-[100px]">${escapeHtml(it.fasyankes)}</span>
                </div>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  });

  if (!hasAny) {
    list.innerHTML = `
      <div class="p-12 text-center">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-ink-100 text-ink-400 mb-3">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
        </div>
        <p class="font-bold text-ink-800">Tidak ada jadwal praktik</p>
        <p class="text-sm text-ink-500 mt-1">Coba ubah filter atau tambah jadwal baru</p>
      </div>
    `;
    return;
  }

  list.innerHTML = html;
  list.querySelectorAll('[data-jadwal-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = allPraktik.find((x) => x.id === btn.dataset.jadwalId);
      if (p) openModal(p);
    });
  });
}

function openModal(p) {
  const modal = document.getElementById('jadwal-modal');
  const content = document.getElementById('jadwal-modal-content');
  if (!modal || !content) return;

  const n = allNakes.find((x) => x.id === p.tenaga_id);
  const f = allFasyankes.find((x) => x.id === p.fasyankes_id);
  const s = calcExpireStatus(p.tgl_akhir_sip);
  const d = daysUntil(p.tgl_akhir_sip);
  const jadwal = parseJadwal(p.jadwal_json);

  const jadwalRows = Object.entries(jadwal).map(([k, v]) => {
    const days = k.split('_').map((d) => DAY_LABELS[d] ?? d).join(', ');
    return `
      <div class="flex items-center justify-between p-3 rounded-lg bg-ink-50">
        <div>
          <p class="text-sm font-semibold text-ink-800 capitalize">${escapeHtml(days)}</p>
          <p class="text-xs text-ink-500 mt-0.5">Pola: <code class="text-[10px] bg-ink-100 px-1 rounded">${escapeHtml(k)}</code></p>
        </div>
        <div class="text-right">
          <p class="text-sm font-bold text-teal-700 tabular-nums">${escapeHtml(v.mulai)} - ${escapeHtml(v.selesai)}</p>
          <p class="text-[10px] text-ink-500">${calcDuration(v.mulai, v.selesai)} jam</p>
        </div>
      </div>
    `;
  }).join('');

  content.innerHTML = `
    <!-- Header -->
    <div class="p-6 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-t-xl2">
      <div class="flex items-start gap-4">
        <div class="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-xl font-bold flex-shrink-0">${n ? initials(n.nama) : '?'}</div>
        <div class="flex-1 min-w-0">
          <h3 class="text-xl font-bold">${escapeHtml(n?.nama ?? '—')}</h3>
          <p class="text-teal-100 text-sm mt-0.5">${escapeHtml(n?.profesi ?? '')}</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <span class="badge bg-white/20 text-white">No. SIP: ${escapeHtml(p.no_sip)}</span>
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
      <!-- Info -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p class="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">Fasyankes</p>
          <p class="text-sm font-semibold text-ink-800">${escapeHtml(f?.nama ?? '-')}</p>
        </div>
        <div>
          <p class="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">Masa Berlaku SIP</p>
          <p class="text-sm font-semibold text-ink-800">${fmtDate(p.tgl_terbit_sip)} - ${fmtDate(p.tgl_akhir_sip)}</p>
          <p class="text-[10px] text-ink-500 mt-0.5">${d !== null ? (d < 0 ? `${-d} hari lalu` : `${d} hari lagi`) : '-'}</p>
        </div>
      </div>

      <!-- Jadwal -->
      <div>
        <h4 class="font-bold text-ink-800 mb-3 flex items-center gap-2">
          <svg class="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          Detail Jadwal Praktik
        </h4>
        ${jadwalRows ? `<div class="space-y-2">${jadwalRows}</div>` : `<p class="text-sm text-ink-500 italic">Belum ada jadwal tercatat</p>`}
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap gap-2 pt-4 border-t border-ink-100">
        <button class="btn-primary btn-sm" data-action="edit">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          Edit Jadwal
        </button>
        <button class="btn-outline btn-sm" data-action="view-nakes">Lihat Nakes</button>
        <button class="btn-ghost btn-sm text-rose-600 hover:bg-rose-50" data-action="delete">Hapus Jadwal</button>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  content.querySelector('[data-modal-close]')?.addEventListener('click', closeModal);
  content.querySelector('[data-action="edit"]')?.addEventListener('click', () => toast('Form edit jadwal akan dibuka', 'info'));
  content.querySelector('[data-action="view-nakes"]')?.addEventListener('click', () => {
    closeModal();
    document.dispatchEvent(new CustomEvent('simantri:open-nakes', { detail: { id: p.tenaga_id } }));
    window.SIMANTRI.navigateTo('data-nakes');
  });
  content.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
    if (confirm(`Hapus jadwal praktik ${n?.nama ?? ''}?`)) toast('Jadwal dihapus (demo)', 'success');
  });
}

function calcDuration(start, end) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const hours = (eh + em / 60) - (sh + sm / 60);
  return hours.toFixed(1);
}

function closeModal() {
  document.getElementById('jadwal-modal')?.classList.add('hidden');
}
