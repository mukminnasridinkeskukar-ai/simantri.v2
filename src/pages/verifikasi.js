// SIMANTRI — Verifikasi STR & SIP page logic
import { loadNakes, loadPraktik } from '../assets/js/demo-data.js';
import { calcExpireStatus, STATUS, statusBadgeClass, statusLabel } from '../assets/js/supabase.js';
import { fmtDate, fmtDateLong, daysUntil, relativeFromNow, initials, avatarColor, escapeHtml, toast, debounce, fmtNumber } from '../assets/js/utils.js';

// Buat data verifikasi mock berdasarkan nakes & praktik yang ada
let verifikasiData = [];
let allNakes = [];
let filters = { search: '', jenis: '', from: '', to: '' };

export async function initVerifikasi() {
  // Bind UI
  const searchInput = document.getElementById('verifikasi-search');
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      filters.search = e.target.value.trim();
      render();
    }, 250));
  }
  document.getElementById('verifikasi-filter-jenis')?.addEventListener('change', (e) => {
    filters.jenis = e.target.value;
    render();
  });
  document.getElementById('verifikasi-filter-from')?.addEventListener('change', (e) => {
    filters.from = e.target.value;
    render();
  });
  document.getElementById('verifikasi-filter-to')?.addEventListener('change', (e) => {
    filters.to = e.target.value;
    render();
  });
  document.querySelector('[data-action="refresh"]')?.addEventListener('click', async () => {
    toast('Memuat ulang antrian verifikasi...', 'info');
    await refresh();
  });
  document.querySelector('[data-action="export"]')?.addEventListener('click', () => exportCsv());
  document.querySelector('[data-modal-close]')?.addEventListener('click', closeModal);

  await refresh();
}

async function refresh() {
  try {
    allNakes = await loadNakes();
    const praktik = await loadPraktik();
    buildVerifikasiData(praktik);
    renderStats();
    render();
  } catch (err) {
    console.error(err);
    toast('Gagal memuat data verifikasi: ' + err.message, 'error');
  }
}

function buildVerifikasiData(praktik) {
  verifikasiData = [];

  // Beberapa nakes dengan STR hampir/expired -> pending
  // Beberapa nakes dengan STR aktif -> diverifikasi
  // Beberapa -> ditolak
  allNakes.forEach((n, idx) => {
    const s = calcExpireStatus(n.tgl_akhir_str);
    let status;
    if (s === STATUS.EXPIRED || s === STATUS.HAMPIR_EXPIRED) {
      status = idx % 5 === 0 ? 'ditolak' : 'pending';
    } else if (idx % 3 === 0) {
      status = 'diverifikasi';
    } else {
      status = 'pending';
    }

    verifikasiData.push({
      id: `ver-str-${n.id}`,
      nakesId: n.id,
      nama: n.nama,
      profesi: n.profesi,
      jenis: n.jenis,
      dokType: 'STR',
      noDok: n.no_str,
      tglAkhir: n.tgl_akhir_str,
      tglTerbit: n.tgl_terbit_str,
      tglDiajukan: getRecentDate(idx),
      status,
      catatan: status === 'ditolak' ? 'Berkas tidak lengkap - foto STR buram, mohon unggah ulang.' : '',
      processedAt: status === 'diverifikasi' ? getRecentDate(idx + 1) : (status === 'ditolak' ? getRecentDate(idx + 2) : null),
      processingHours: status === 'diverifikasi' || status === 'ditolak' ? (2 + (idx % 18)) : null,
    });
  });

  // Tambah beberapa verifikasi SIP dari praktik
  praktik.forEach((p, idx) => {
    const n = allNakes.find((x) => x.id === p.tenaga_id);
    if (!n) return;
    const s = calcExpireStatus(p.tgl_akhir_sip);
    let status;
    if (s === STATUS.EXPIRED || s === STATUS.HAMPIR_EXPIRED) {
      status = 'pending';
    } else if (idx % 4 === 0) {
      status = 'diverifikasi';
    } else if (idx % 7 === 0) {
      status = 'ditolak';
    } else {
      status = 'pending';
    }

    verifikasiData.push({
      id: `ver-sip-${p.id}`,
      nakesId: p.tenaga_id,
      nama: n.nama,
      profesi: n.profesi,
      jenis: n.jenis,
      dokType: 'SIP',
      noDok: p.no_sip,
      tglAkhir: p.tgl_akhir_sip,
      tglTerbit: p.tgl_terbit_sip,
      tglDiajukan: getRecentDate(idx + 3),
      status,
      catatan: status === 'ditolak' ? 'Lokasi praktik tidak sesuai domisili SIP.' : '',
      processedAt: status === 'diverifikasi' || status === 'ditolak' ? getRecentDate(idx + 5) : null,
      processingHours: status === 'diverifikasi' || status === 'ditolak' ? (3 + (idx % 24)) : null,
    });
  });
}

function getRecentDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().slice(0, 10);
}

function getFiltered() {
  return verifikasiData.filter((v) => {
    if (filters.jenis && v.dokType !== filters.jenis) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const hay = `${v.nama} ${v.noDok} ${v.profesi}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.from && v.tglDiajukan < filters.from) return false;
    if (filters.to && v.tglDiajukan > filters.to) return false;
    return true;
  });
}

function renderStats() {
  const c = document.getElementById('verifikasi-stats');
  if (!c) return;

  const today = new Date().toISOString().slice(0, 10);
  const pending = verifikasiData.filter((v) => v.status === 'pending').length;
  const approvedToday = verifikasiData.filter((v) => v.status === 'diverifikasi' && v.processedAt === today).length;
  const rejectedToday = verifikasiData.filter((v) => v.status === 'ditolak' && v.processedAt === today).length;
  const processedItems = verifikasiData.filter((v) => v.processingHours !== null);
  const avgHours = processedItems.length
    ? (processedItems.reduce((s, v) => s + v.processingHours, 0) / processedItems.length).toFixed(1)
    : '0.0';

  c.innerHTML = `
    <div class="card p-5">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold text-ink-500 uppercase tracking-wider">Pending</p>
          <p class="mt-2 text-3xl font-extrabold text-amber-600 tabular-nums">${fmtNumber(pending)}</p>
          <p class="mt-1.5 text-xs text-ink-500">menunggu review</p>
        </div>
        <div class="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
      </div>
    </div>
    <div class="card p-5">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold text-ink-500 uppercase tracking-wider">Approved Hari Ini</p>
          <p class="mt-2 text-3xl font-extrabold text-teal-600 tabular-nums">${fmtNumber(approvedToday)}</p>
          <p class="mt-1.5 text-xs text-ink-500">dokumen diverifikasi</p>
        </div>
        <div class="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
        </div>
      </div>
    </div>
    <div class="card p-5">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold text-ink-500 uppercase tracking-wider">Rejected Hari Ini</p>
          <p class="mt-2 text-3xl font-extrabold text-rose-600 tabular-nums">${fmtNumber(rejectedToday)}</p>
          <p class="mt-1.5 text-xs text-ink-500">dokumen ditolak</p>
        </div>
        <div class="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </div>
      </div>
    </div>
    <div class="card p-5">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold text-ink-500 uppercase tracking-wider">Rata-rata Proses</p>
          <p class="mt-2 text-3xl font-extrabold text-ink-900 tabular-nums">${avgHours}<span class="text-base font-bold text-ink-500">jam</span></p>
          <p class="mt-1.5 text-xs text-ink-500">waktu respons verifikator</p>
        </div>
        <div class="w-11 h-11 rounded-xl bg-ink-100 text-ink-700 flex items-center justify-center">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
        </div>
      </div>
    </div>
  `;
}

function render() {
  const filtered = getFiltered();
  const pending = filtered.filter((v) => v.status === 'pending');
  const verified = filtered.filter((v) => v.status === 'diverifikasi');
  const rejected = filtered.filter((v) => v.status === 'ditolak');

  document.getElementById('count-pending').textContent = pending.length;
  document.getElementById('count-verified').textContent = verified.length;
  document.getElementById('count-rejected').textContent = rejected.length;

  renderColumn('col-pending', pending, 'pending');
  renderColumn('col-verified', verified, 'verified');
  renderColumn('col-rejected', rejected, 'rejected');
}

function renderColumn(colId, items, kind) {
  const col = document.getElementById(colId);
  if (!col) return;

  if (!items.length) {
    col.innerHTML = `
      <div class="text-center py-12 text-ink-400">
        <svg class="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        <p class="text-xs font-medium">Tidak ada dokumen</p>
      </div>
    `;
    return;
  }

  col.innerHTML = items.map((v) => renderCard(v, kind)).join('');

  // Bind buttons
  col.querySelectorAll('[data-action="view"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const v = verifikasiData.find((x) => x.id === btn.dataset.id);
      if (v) openModal(v);
    });
  });
  col.querySelectorAll('[data-action="approve"]').forEach((btn) => {
    btn.addEventListener('click', () => handleAction(btn.dataset.id, 'diverifikasi'));
  });
  col.querySelectorAll('[data-action="reject"]').forEach((btn) => {
    btn.addEventListener('click', () => handleAction(btn.dataset.id, 'ditolak'));
  });
}

function renderCard(v, kind) {
  const dokBadge = v.dokType === 'STR' ? 'badge-lime' : (v.dokType === 'SIP' ? 'badge-teal' : 'badge-ink');
  const dokColor = v.dokType === 'STR' ? 'bg-lime-100 text-lime-700' : (v.dokType === 'SIP' ? 'bg-teal-100 text-teal-700' : 'bg-ink-100 text-ink-700');
  const d = daysUntil(v.tglAkhir);

  let actionsHtml = '';
  if (kind === 'pending') {
    actionsHtml = `
      <div class="grid grid-cols-2 gap-2 mt-3">
        <button data-action="approve" data-id="${v.id}" class="btn-primary btn-sm !py-1.5 !text-xs">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          Approve
        </button>
        <button data-action="reject" data-id="${v.id}" class="btn-outline btn-sm !py-1.5 !text-xs !text-rose-600 !border-rose-200 hover:!bg-rose-50">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          Reject
        </button>
      </div>
    `;
  } else if (kind === 'diverifikasi') {
    actionsHtml = `
      <div class="mt-3 flex items-center gap-2 text-[10px] text-teal-600">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
        Diverifikasi ${relativeFromNow(v.processedAt)} • ${v.processingHours} jam
      </div>
    `;
  } else if (kind === 'ditolak') {
    actionsHtml = `
      <div class="mt-3 text-[10px] text-rose-600 bg-rose-50 rounded-md p-2">
        <p class="font-semibold">Alasan: ${escapeHtml(v.catatan || 'Tidak memenuhi syarat')}</p>
        <p class="mt-0.5 opacity-70">Ditolak ${relativeFromNow(v.processedAt)} • ${v.processingHours} jam</p>
      </div>
    `;
  }

  return `
    <div class="bg-white rounded-xl border border-ink-100 shadow-sm hover:shadow-card transition-shadow p-3.5 cursor-pointer" data-action="view" data-id="${v.id}">
      <div class="flex items-start gap-3">
        <div class="w-9 h-9 rounded-full ${avatarColor(v.nama)} flex items-center justify-center text-white font-bold text-xs flex-shrink-0">${initials(v.nama)}</div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-sm text-ink-800 truncate">${escapeHtml(v.nama)}</p>
          <p class="text-[10px] text-ink-500 truncate">${escapeHtml(v.profesi)}</p>
        </div>
        <span class="${dokBadge} !text-[10px] !px-1.5 !py-0.5 flex-shrink-0">${v.dokType}</span>
      </div>
      <div class="mt-2.5 space-y-1 text-xs">
        <div class="flex items-center justify-between">
          <span class="text-ink-500">No. Dok:</span>
          <code class="font-mono text-[10px] ${dokColor} px-1.5 py-0.5 rounded">${escapeHtml(v.noDok)}</code>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-ink-500">Tgl Akhir:</span>
          <span class="font-semibold text-ink-700 tabular-nums">${fmtDate(v.tglAkhir)}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-ink-500">Diajukan:</span>
          <span class="text-ink-600 tabular-nums">${fmtDate(v.tglDiajukan)}</span>
        </div>
      </div>
      ${actionsHtml}
    </div>
  `;
}

function handleAction(id, newStatus) {
  const v = verifikasiData.find((x) => x.id === id);
  if (!v) return;
  v.status = newStatus;
  v.processedAt = new Date().toISOString().slice(0, 10);
  v.processingHours = 1 + Math.floor(Math.random() * 12);
  if (newStatus === 'ditolak' && !v.catatan) {
    v.catatan = 'Dokumen tidak memenuhi persyaratan verifikasi.';
  }
  toast(`Dokumen ${v.dokType} ${v.nama} ${newStatus === 'diverifikasi' ? 'diverifikasi' : 'ditolak'}`, newStatus === 'diverifikasi' ? 'success' : 'warning');
  renderStats();
  render();
}

function openModal(v) {
  const modal = document.getElementById('verifikasi-modal');
  const content = document.getElementById('verifikasi-modal-content');
  if (!modal || !content) return;

  const d = daysUntil(v.tglAkhir);
  const dokColor = v.dokType === 'STR' ? 'bg-lime-100 text-lime-700' : (v.dokType === 'SIP' ? 'bg-teal-100 text-teal-700' : 'bg-ink-100 text-ink-700');
  const statusColor = v.status === 'pending' ? 'badge-amber' : (v.status === 'diverifikasi' ? 'badge-teal' : 'badge-rose');

  content.innerHTML = `
    <!-- Header -->
    <div class="p-6 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-t-xl2">
      <div class="flex items-start gap-4">
        <div class="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-xl font-bold flex-shrink-0">${initials(v.nama)}</div>
        <div class="flex-1 min-w-0">
          <h3 class="text-xl font-bold">${escapeHtml(v.nama)}</h3>
          <p class="text-teal-100 text-sm mt-0.5">${escapeHtml(v.profesi)}</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <span class="badge bg-white/20 text-white">${v.dokType}</span>
            <span class="${statusColor} !bg-white/20 !text-white !ring-white/30">${statusLabel(v.status)}</span>
          </div>
        </div>
        <button data-modal-close class="text-white/70 hover:text-white p-1" aria-label="Tutup">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    </div>

    <!-- Body -->
    <div class="p-6 space-y-5">
      <!-- Info dokumen -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p class="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">Jenis Dokumen</p>
          <p class="text-sm font-semibold text-ink-800">${v.dokType === 'STR' ? 'Surat Tanda Registrasi' : v.dokType === 'SIP' ? 'Surat Izin Praktik' : 'Rekomendasi'}</p>
        </div>
        <div>
          <p class="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">No. Dokumen</p>
          <p class="text-sm font-mono font-semibold text-ink-800">${escapeHtml(v.noDok)}</p>
        </div>
        <div>
          <p class="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">Tanggal Terbit</p>
          <p class="text-sm font-semibold text-ink-800">${fmtDateLong(v.tglTerbit)}</p>
        </div>
        <div>
          <p class="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">Tanggal Akhir</p>
          <p class="text-sm font-semibold text-ink-800">${fmtDateLong(v.tglAkhir)}</p>
          <p class="text-[10px] ${d < 0 ? 'text-rose-600' : d < 90 ? 'text-amber-600' : 'text-teal-600'} mt-0.5">${d !== null ? (d < 0 ? `${-d} hari lalu` : `${d} hari lagi`) : ''}</p>
        </div>
        <div>
          <p class="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">Tanggal Diajukan</p>
          <p class="text-sm font-semibold text-ink-800">${fmtDateLong(v.tglDiajukan)}</p>
        </div>
        <div>
          <p class="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">Status Saat Ini</p>
          <span class="${statusColor} !text-xs">${statusLabel(v.status)}</span>
        </div>
      </div>

      <!-- Catatan (jika ditolak) -->
      ${v.catatan ? `
        <div class="rounded-xl bg-rose-50 border border-rose-200 p-4">
          <p class="text-xs font-bold text-rose-700 uppercase tracking-wider mb-1">Catatan Penolakan</p>
          <p class="text-sm text-rose-800">${escapeHtml(v.catatan)}</p>
        </div>
      ` : ''}

      <!-- Berkas preview placeholder -->
      <div class="rounded-xl border-2 border-dashed border-ink-200 p-6 text-center">
        <svg class="w-10 h-10 mx-auto text-ink-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        <p class="text-sm font-semibold text-ink-700">Berkas ${v.dokType}.pdf</p>
        <p class="text-xs text-ink-500 mt-0.5">Klik untuk pratinjau dokumen</p>
        <button class="btn-outline btn-sm mt-3" data-action="preview">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          Lihat Berkas
        </button>
      </div>

      <!-- Actions -->
      ${v.status === 'pending' ? `
        <div class="flex flex-wrap gap-2 pt-4 border-t border-ink-100">
          <button class="btn-primary btn-sm flex-1" data-action="approve-modal" data-id="${v.id}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            Approve
          </button>
          <button class="btn-outline btn-sm flex-1 !text-rose-600 !border-rose-200 hover:!bg-rose-50" data-action="reject-modal" data-id="${v.id}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            Reject
          </button>
        </div>
      ` : `
        <div class="pt-4 border-t border-ink-100">
          <button class="btn-outline btn-sm w-full" data-action="reopen" data-id="${v.id}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Buka Ulang untuk Review
          </button>
        </div>
      `}
    </div>
  `;

  modal.classList.remove('hidden');
  content.querySelector('[data-modal-close]')?.addEventListener('click', closeModal);
  content.querySelector('[data-action="preview"]')?.addEventListener('click', () => toast('Pratinjau berkas akan dibuka di tab baru', 'info'));
  content.querySelector('[data-action="approve-modal"]')?.addEventListener('click', () => {
    handleAction(v.id, 'diverifikasi');
    closeModal();
  });
  content.querySelector('[data-action="reject-modal"]')?.addEventListener('click', () => {
    handleAction(v.id, 'ditolak');
    closeModal();
  });
  content.querySelector('[data-action="reopen"]')?.addEventListener('click', () => {
    handleAction(v.id, 'pending');
    closeModal();
  });
}

function closeModal() {
  document.getElementById('verifikasi-modal')?.classList.add('hidden');
}

function exportCsv() {
  const filtered = getFiltered();
  if (!filtered.length) { toast('Tidak ada data untuk diekspor', 'warning'); return; }
  const headers = ['Nama', 'Profesi', 'Jenis Dok', 'No Dok', 'Tgl Terbit', 'Tgl Akhir', 'Tgl Diajukan', 'Status', 'Catatan'];
  const rows = filtered.map((v) => [
    v.nama, v.profesi, v.dokType, v.noDok,
    v.tglTerbit, v.tglAkhir, v.tglDiajukan,
    statusLabel(v.status), v.catatan,
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `verifikasi-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast('CSV diekspor', 'success');
}
