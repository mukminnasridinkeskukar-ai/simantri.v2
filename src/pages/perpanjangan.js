// SIMANTRI — Perpanjangan & Rekomendasi page logic
import { loadNakes, loadPraktik } from '../assets/js/demo-data.js';
import { calcExpireStatus, STATUS, statusBadgeClass, statusLabel } from '../assets/js/supabase.js';
import { fmtDate, fmtDateLong, daysUntil, relativeFromNow, initials, avatarColor, escapeHtml, toast, debounce, fmtNumber } from '../assets/js/utils.js';

let allNakes = [];
let pengajuanList = [];
let filters = { search: '', status: '', jenis: '' };
let selectedFile = null;

export async function initPerpanjangan() {
  // Bind tabs
  document.getElementById('tab-list')?.addEventListener('click', () => switchTab('list'));
  document.getElementById('tab-form')?.addEventListener('click', () => switchTab('form'));

  // Bind filters
  const searchInput = document.getElementById('perpanjangan-search');
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      filters.search = e.target.value.trim();
      renderList();
    }, 250));
  }
  document.getElementById('perpanjangan-filter-status')?.addEventListener('change', (e) => {
    filters.status = e.target.value;
    renderList();
  });
  document.getElementById('perpanjangan-filter-jenis')?.addEventListener('change', (e) => {
    filters.jenis = e.target.value;
    renderList();
  });

  // Bind form
  bindForm();

  // Bind refresh
  document.querySelector('[data-action="refresh"]')?.addEventListener('click', async () => {
    toast('Memuat ulang data...', 'info');
    await refresh();
  });
  document.querySelector('[data-modal-close]')?.addEventListener('click', closeModal);

  await refresh();
}

async function refresh() {
  try {
    allNakes = await loadNakes();
    const praktik = await loadPraktik();
    buildInitialPengajuan(praktik);
    populateNakesSelect();
    renderStats();
    renderList();
  } catch (err) {
    console.error(err);
    toast('Gagal memuat data: ' + err.message, 'error');
  }
}

function buildInitialPengajuan(praktik) {
  pengajuanList = [];

  // STR yang hampir/expired -> pengajuan pending
  allNakes.forEach((n, idx) => {
    const s = calcExpireStatus(n.tgl_akhir_str);
    if (s === STATUS.HAMPIR_EXPIRED || s === STATUS.EXPIRED) {
      pengajuanList.push({
        id: `pen-str-${n.id}`,
        nakesId: n.id,
        nama: n.nama,
        profesi: n.profesi,
        jenis: 'STR',
        noDokLama: n.no_str,
        tglAkhirLama: n.tgl_akhir_str,
        tglDiajukan: getRecentDate(idx),
        status: 'pending',
        catatan: '',
        fileName: null,
        fileSize: null,
      });
    }
  });

  // SIP yang hampir/expired -> pengajuan pending
  praktik.forEach((p, idx) => {
    const s = calcExpireStatus(p.tgl_akhir_sip);
    if (s === STATUS.HAMPIR_EXPIRED || s === STATUS.EXPIRED) {
      const n = allNakes.find((x) => x.id === p.tenaga_id);
      if (!n) return;
      pengajuanList.push({
        id: `pen-sip-${p.id}`,
        nakesId: p.tenaga_id,
        nama: n.nama,
        profesi: n.profesi,
        jenis: 'SIP',
        noDokLama: p.no_sip,
        tglAkhirLama: p.tgl_akhir_sip,
        tglDiajukan: getRecentDate(idx + 2),
        status: idx % 4 === 0 ? 'diverifikasi' : 'pending',
        catatan: idx % 4 === 0 ? 'Berkas lengkap, siap diproses lebih lanjut.' : '',
        fileName: null,
        fileSize: null,
      });
    }
  });

  // Tambah beberapa pengajuan yang sudah selesai untuk variasi
  if (allNakes.length > 2) {
    const n = allNakes[2];
    pengajuanList.push({
      id: `pen-done-1`,
      nakesId: n.id,
      nama: n.nama,
      profesi: n.profesi,
      jenis: 'Rekomendasi',
      noDokLama: 'REC/001/2023',
      tglAkhirLama: '2025-08-01',
      tglDiajukan: getRecentDate(15),
      status: 'selesai',
      catatan: 'Perpanjangan rekomendasi telah diterbitkan.',
      fileName: null,
      fileSize: null,
    });
  }
}

function getRecentDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().slice(0, 10);
}

function populateNakesSelect() {
  const sel = document.getElementById('form-nakes');
  if (!sel) return;
  sel.innerHTML = '<option value="">Pilih nakes...</option>' +
    allNakes.map((n) => `<option value="${n.id}" data-nama="${escapeHtml(n.nama)}" data-no-str="${escapeHtml(n.no_str ?? '')}" data-tgl-akhir="${escapeHtml(n.tgl_akhir_str ?? '')}">${escapeHtml(n.nama)} — ${escapeHtml(n.profesi)}</option>`).join('');

  sel.addEventListener('change', (e) => {
    const opt = e.target.selectedOptions[0];
    const hint = document.getElementById('form-nakes-hint');
    if (opt && opt.value) {
      const noStr = opt.dataset.noStr;
      const tglAkhir = opt.dataset.tglAkhir;
      hint.textContent = `STR saat ini: ${noStr || '-'} • Berakhir: ${fmtDate(tglAkhir)}`;
      hint.classList.remove('text-ink-500');
      hint.classList.add('text-teal-700', 'font-medium');

      // Auto-fill no dok lama & tgl akhir lama jika jenis STR
      const jenisSel = document.getElementById('form-jenis');
      if (jenisSel.value === 'STR' || !jenisSel.value) {
        document.getElementById('form-no-lama').value = noStr || '';
        document.getElementById('form-tgl-akhir-lama').value = tglAkhir || '';
      }
    } else {
      hint.textContent = 'Pilih nakes yang akan mengajukan perpanjangan.';
      hint.classList.add('text-ink-500');
      hint.classList.remove('text-teal-700', 'font-medium');
    }
  });
}

function renderStats() {
  const c = document.getElementById('perpanjangan-stats');
  if (!c) return;

  const pending = pengajuanList.filter((p) => p.status === 'pending').length;
  const diverifikasi = pengajuanList.filter((p) => p.status === 'diverifikasi').length;
  const selesai = pengajuanList.filter((p) => p.status === 'selesai').length;
  const ditolak = pengajuanList.filter((p) => p.status === 'ditolak').length;

  c.innerHTML = `
    <div class="card p-4">
      <p class="text-[10px] font-semibold text-ink-500 uppercase tracking-wider">Pending</p>
      <p class="mt-1 text-2xl font-extrabold text-amber-600 tabular-nums">${fmtNumber(pending)}</p>
    </div>
    <div class="card p-4">
      <p class="text-[10px] font-semibold text-ink-500 uppercase tracking-wider">Diverifikasi</p>
      <p class="mt-1 text-2xl font-extrabold text-teal-600 tabular-nums">${fmtNumber(diverifikasi)}</p>
    </div>
    <div class="card p-4">
      <p class="text-[10px] font-semibold text-ink-500 uppercase tracking-wider">Selesai</p>
      <p class="mt-1 text-2xl font-extrabold text-lime-600 tabular-nums">${fmtNumber(selesai)}</p>
    </div>
    <div class="card p-4">
      <p class="text-[10px] font-semibold text-ink-500 uppercase tracking-wider">Ditolak</p>
      <p class="mt-1 text-2xl font-extrabold text-rose-600 tabular-nums">${fmtNumber(ditolak)}</p>
    </div>
  `;
}

function switchTab(tab) {
  const listTab = document.getElementById('tab-list');
  const formTab = document.getElementById('tab-form');
  const listPanel = document.getElementById('panel-list');
  const formPanel = document.getElementById('panel-form');

  if (tab === 'list') {
    listTab.classList.add('bg-teal-600', 'text-white');
    listTab.classList.remove('text-ink-600', 'hover:bg-ink-50');
    formTab.classList.remove('bg-teal-600', 'text-white');
    formTab.classList.add('text-ink-600', 'hover:bg-ink-50');
    listPanel.classList.remove('hidden');
    formPanel.classList.add('hidden');
  } else {
    formTab.classList.add('bg-teal-600', 'text-white');
    formTab.classList.remove('text-ink-600', 'hover:bg-ink-50');
    listTab.classList.remove('bg-teal-600', 'text-white');
    listTab.classList.add('text-ink-600', 'hover:bg-ink-50');
    formPanel.classList.remove('hidden');
    listPanel.classList.add('hidden');
  }
}

function getFiltered() {
  return pengajuanList.filter((p) => {
    if (filters.status && p.status !== filters.status) return false;
    if (filters.jenis && p.jenis !== filters.jenis) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const hay = `${p.nama} ${p.noDokLama} ${p.profesi}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function renderList() {
  const tbody = document.getElementById('perpanjangan-tbody');
  if (!tbody) return;

  const filtered = getFiltered();
  document.getElementById('perpanjangan-count').textContent = filtered.length;

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr><td colspan="8" class="text-center py-12">
        <div class="inline-flex flex-col items-center text-ink-500">
          <svg class="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
          <p class="font-semibold">Tidak ada pengajuan</p>
          <p class="text-sm mt-1">Belum ada pengajuan perpanjangan yang sesuai filter</p>
        </div>
      </td></tr>`;
    return;
  }

  // Sort: pending first, then by date
  filtered.sort((a, b) => {
    const order = { pending: 0, diverifikasi: 1, ditolak: 2, selesai: 3 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return new Date(b.tglDiajukan) - new Date(a.tglDiajukan);
  });

  tbody.innerHTML = filtered.map((p, idx) => {
    const dokBadge = p.jenis === 'STR' ? 'badge-lime' : (p.jenis === 'SIP' ? 'badge-teal' : 'badge-ink');
    const d = daysUntil(p.tglAkhirLama);
    return `
      <tr data-pengajuan-id="${p.id}" class="cursor-pointer">
        <td class="text-ink-400 text-xs font-mono">${String(idx + 1).padStart(2, '0')}</td>
        <td>
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full ${avatarColor(p.nama)} flex items-center justify-center text-white font-bold text-xs flex-shrink-0">${initials(p.nama)}</div>
            <div class="min-w-0">
              <p class="font-semibold text-ink-800 truncate">${escapeHtml(p.nama)}</p>
              <p class="text-xs text-ink-500 truncate">${escapeHtml(p.profesi)}</p>
            </div>
          </div>
        </td>
        <td><span class="${dokBadge} !text-[10px]">${p.jenis}</span></td>
        <td class="font-mono text-xs"><span class="bg-ink-100 px-1.5 py-0.5 rounded">${escapeHtml(p.noDokLama ?? '-')}</span></td>
        <td class="text-xs text-ink-700 tabular-nums">${fmtDate(p.tglDiajukan)}</td>
        <td>
          <div class="text-xs font-semibold text-ink-700 tabular-nums">${fmtDate(p.tglAkhirLama)}</div>
          <div class="text-[10px] ${d < 0 ? 'text-rose-600' : d < 90 ? 'text-amber-600' : 'text-ink-500'}">${d !== null ? (d < 0 ? `${-d} hari lalu` : `${d} hari lagi`) : ''}</div>
        </td>
        <td><span class="${statusBadgeClass(p.status)}">${statusLabel(p.status)}</span></td>
        <td class="text-right">
          <div class="inline-flex gap-1">
            <button data-action="view" data-id="${p.id}" class="btn-ghost btn-sm !px-2" aria-label="Lihat detail">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            </button>
            ${p.status === 'pending' ? `
              <button data-action="cancel" data-id="${p.id}" class="btn-ghost btn-sm !px-2 text-rose-600 hover:bg-rose-50" aria-label="Batalkan">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Bind row click & actions
  tbody.querySelectorAll('tr[data-pengajuan-id]').forEach((tr) => {
    tr.addEventListener('click', (e) => {
      if (e.target.closest('[data-action]')) return;
      const p = pengajuanList.find((x) => x.id === tr.dataset.pengajuanId);
      if (p) openModal(p);
    });
  });
  tbody.querySelectorAll('[data-action="view"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const p = pengajuanList.find((x) => x.id === btn.dataset.id);
      if (p) openModal(p);
    });
  });
  tbody.querySelectorAll('[data-action="cancel"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const p = pengajuanList.find((x) => x.id === btn.dataset.id);
      if (p && confirm(`Batalkan pengajuan ${p.jenis} untuk ${p.nama}?`)) {
        pengajuanList = pengajuanList.filter((x) => x.id !== p.id);
        toast('Pengajuan dibatalkan', 'success');
        renderStats();
        renderList();
      }
    });
  });
}

function bindForm() {
  const form = document.getElementById('perpanjangan-form');
  if (!form) return;

  // Auto-fill when jenis dokumen changes
  document.getElementById('form-jenis')?.addEventListener('change', (e) => {
    const nakesSel = document.getElementById('form-nakes');
    const opt = nakesSel?.selectedOptions[0];
    if (!opt || !opt.value) return;
    const noStr = opt.dataset.noStr;
    const tglAkhir = opt.dataset.tglAkhir;
    if (e.target.value === 'STR') {
      document.getElementById('form-no-lama').value = noStr || '';
      document.getElementById('form-tgl-akhir-lama').value = tglAkhir || '';
    } else if (e.target.value === 'SIP') {
      // Cari SIP dari praktik (memerlukan loadPraktik - ambil dari cache via dispatch)
      // Untuk simplicity, kosongkan agar user isi manual
      document.getElementById('form-no-lama').value = '';
      document.getElementById('form-tgl-akhir-lama').value = '';
    } else {
      document.getElementById('form-no-lama').value = '';
      document.getElementById('form-tgl-akhir-lama').value = '';
    }
  });

  // Dropzone behavior
  const dropzone = document.getElementById('form-dropzone');
  const fileInput = document.getElementById('form-file');
  const fileInfo = document.getElementById('form-file-info');
  const fileName = document.getElementById('form-file-name');
  const fileSize = document.getElementById('form-file-size');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('border-teal-400', 'bg-teal-50/50');
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('border-teal-400', 'bg-teal-50/50');
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('border-teal-400', 'bg-teal-50/50');
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length) handleFileSelect(e.target.files[0]);
    });
  }

  document.querySelector('[data-action="remove-file"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    selectedFile = null;
    fileInput.value = '';
    fileInfo.classList.add('hidden');
    dropzone.classList.remove('hidden');
  });

  function handleFileSelect(file) {
    // Validate size < 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast(`Ukuran file ${formatBytes(file.size)} melebihi 5MB`, 'error');
      fileInput.value = '';
      return;
    }
    // Validate type
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      toast('Format file tidak didukung. Gunakan PDF, JPG, atau PNG.', 'error');
      fileInput.value = '';
      return;
    }
    selectedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatBytes(file.size);
    fileInfo.classList.remove('hidden');
    dropzone.classList.add('hidden');
    toast('File siap diunggah', 'success', 2000);
  }

  // Form submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validateForm()) {
      submitForm();
    }
  });

  // Reset
  form.addEventListener('reset', () => {
    selectedFile = null;
    fileInfo.classList.add('hidden');
    dropzone.classList.remove('hidden');
    document.getElementById('form-nakes-hint').textContent = 'Pilih nakes yang akan mengajukan perpanjangan.';
    document.getElementById('form-nakes-hint').classList.add('text-ink-500');
    document.getElementById('form-nakes-hint').classList.remove('text-teal-700', 'font-medium');
  });
}

function validateForm() {
  const nakes = document.getElementById('form-nakes').value;
  const jenis = document.getElementById('form-jenis').value;
  const noLama = document.getElementById('form-no-lama').value.trim();
  const tglAkhirLama = document.getElementById('form-tgl-akhir-lama').value;
  const errors = [];

  if (!nakes) errors.push('Nakes wajib dipilih');
  if (!jenis) errors.push('Jenis dokumen wajib dipilih');
  if (!noLama) errors.push('No. dokumen lama wajib diisi');
  if (!tglAkhirLama) {
    errors.push('Tanggal berakhir lama wajib diisi');
  } else {
    // Must be future date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tgl = new Date(tglAkhirLama);
    tgl.setHours(0, 0, 0, 0);
    if (tgl <= today) {
      errors.push('Tanggal berakhir lama harus di masa depan');
    }
  }
  if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
    errors.push('Ukuran file melebihi 5MB');
  }

  if (errors.length) {
    errors.forEach((msg, i) => setTimeout(() => toast(msg, 'error'), i * 200));
    return false;
  }
  return true;
}

function submitForm() {
  const nakesSel = document.getElementById('form-nakes');
  const opt = nakesSel.selectedOptions[0];
  const nakesId = opt.value;
  const nakesNama = opt.dataset.nama;

  const newPengajuan = {
    id: `pen-new-${Date.now()}`,
    nakesId,
    nama: nakesNama,
    profesi: allNakes.find((n) => n.id === nakesId)?.profesi ?? '',
    jenis: document.getElementById('form-jenis').value,
    noDokLama: document.getElementById('form-no-lama').value.trim(),
    tglAkhirLama: document.getElementById('form-tgl-akhir-lama').value,
    tglDiajukan: new Date().toISOString().slice(0, 10),
    status: 'pending',
    catatan: document.getElementById('form-catatan').value.trim(),
    fileName: selectedFile?.name ?? null,
    fileSize: selectedFile?.size ?? null,
  };

  pengajuanList.unshift(newPengajuan);
  toast(`Pengajuan ${newPengajuan.jenis} untuk ${newPengajuan.nama} berhasil dikirim`, 'success');

  // Reset form
  document.getElementById('perpanjangan-form').reset();
  selectedFile = null;
  document.getElementById('form-file-info')?.classList.add('hidden');
  document.getElementById('form-dropzone')?.classList.remove('hidden');
  document.getElementById('form-nakes-hint').textContent = 'Pilih nakes yang akan mengajukan perpanjangan.';
  document.getElementById('form-nakes-hint').classList.add('text-ink-500');
  document.getElementById('form-nakes-hint').classList.remove('text-teal-700', 'font-medium');

  // Switch to list tab & re-render
  renderStats();
  renderList();
  switchTab('list');
}

function openModal(p) {
  const modal = document.getElementById('perpanjangan-modal');
  const content = document.getElementById('perpanjangan-modal-content');
  if (!modal || !content) return;

  const d = daysUntil(p.tglAkhirLama);
  const dokColor = p.jenis === 'STR' ? 'bg-lime-100 text-lime-700' : (p.jenis === 'SIP' ? 'bg-teal-100 text-teal-700' : 'bg-ink-100 text-ink-700');

  content.innerHTML = `
    <!-- Header -->
    <div class="p-6 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-t-xl2">
      <div class="flex items-start gap-4">
        <div class="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-xl font-bold flex-shrink-0">${initials(p.nama)}</div>
        <div class="flex-1 min-w-0">
          <h3 class="text-xl font-bold">${escapeHtml(p.nama)}</h3>
          <p class="text-teal-100 text-sm mt-0.5">${escapeHtml(p.profesi)}</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <span class="badge bg-white/20 text-white">Pengajuan ${p.jenis}</span>
            <span class="${statusBadgeClass(p.status)} !bg-white/20 !text-white !ring-white/30">${statusLabel(p.status)}</span>
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
          <p class="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">Jenis Dokumen</p>
          <p class="text-sm font-semibold text-ink-800">${p.jenis === 'STR' ? 'Surat Tanda Registrasi' : p.jenis === 'SIP' ? 'Surat Izin Praktik' : 'Rekomendasi'}</p>
        </div>
        <div>
          <p class="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">No. Dokumen Lama</p>
          <p class="text-sm font-mono font-semibold text-ink-800">${escapeHtml(p.noDokLama)}</p>
        </div>
        <div>
          <p class="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">Tgl Berakhir Lama</p>
          <p class="text-sm font-semibold text-ink-800">${fmtDateLong(p.tglAkhirLama)}</p>
          <p class="text-[10px] ${d < 0 ? 'text-rose-600' : d < 90 ? 'text-amber-600' : 'text-teal-600'} mt-0.5">${d !== null ? (d < 0 ? `${-d} hari lalu` : `${d} hari lagi`) : ''}</p>
        </div>
        <div>
          <p class="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">Tgl Diajukan</p>
          <p class="text-sm font-semibold text-ink-800">${fmtDateLong(p.tglDiajukan)}</p>
          <p class="text-[10px] text-ink-500 mt-0.5">${relativeFromNow(p.tglDiajukan)}</p>
        </div>
      </div>

      <!-- File uploaded -->
      ${p.fileName ? `
        <div class="rounded-xl border border-ink-200 p-4 flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg ${dokColor} flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-ink-800 truncate">${escapeHtml(p.fileName)}</p>
            <p class="text-xs text-ink-500">${p.fileSize ? formatBytes(p.fileSize) : '-'}</p>
          </div>
          <button class="btn-outline btn-sm" data-action="download">Unduh</button>
        </div>
      ` : `
        <div class="rounded-xl border-2 border-dashed border-ink-200 p-4 text-center text-xs text-ink-500 italic">
          Tidak ada berkas diunggah
        </div>
      `}

      <!-- Catatan -->
      ${p.catatan ? `
        <div class="rounded-xl bg-ink-50 p-4">
          <p class="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">Catatan</p>
          <p class="text-sm text-ink-800">${escapeHtml(p.catatan)}</p>
        </div>
      ` : ''}

      <!-- Actions -->
      <div class="flex flex-wrap gap-2 pt-4 border-t border-ink-100">
        ${p.status === 'pending' ? `
          <button class="btn-ghost btn-sm text-rose-600 hover:bg-rose-50" data-action="cancel-modal" data-id="${p.id}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            Batalkan Pengajuan
          </button>
        ` : ''}
        <button class="btn-outline btn-sm" data-action="edit">Edit Pengajuan</button>
        <button class="btn-primary btn-sm" data-action="track">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          Lacak Status
        </button>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  content.querySelector('[data-modal-close]')?.addEventListener('click', closeModal);
  content.querySelector('[data-action="download"]')?.addEventListener('click', () => toast('Mengunduh berkas...', 'info'));
  content.querySelector('[data-action="edit"]')?.addEventListener('click', () => {
    closeModal();
    switchTab('form');
    // Pre-fill
    document.getElementById('form-nakes').value = p.nakesId;
    document.getElementById('form-nakes').dispatchEvent(new Event('change'));
    document.getElementById('form-jenis').value = p.jenis;
    document.getElementById('form-no-lama').value = p.noDokLama;
    document.getElementById('form-tgl-akhir-lama').value = p.tglAkhirLama;
    document.getElementById('form-catatan').value = p.catatan;
    toast('Memuat data ke form untuk diedit', 'info');
  });
  content.querySelector('[data-action="track"]')?.addEventListener('click', () => {
    toast(`Status pengajuan: ${statusLabel(p.status)}`, 'info');
  });
  content.querySelector('[data-action="cancel-modal"]')?.addEventListener('click', () => {
    if (confirm(`Batalkan pengajuan ${p.jenis} untuk ${p.nama}?`)) {
      pengajuanList = pengajuanList.filter((x) => x.id !== p.id);
      toast('Pengajuan dibatalkan', 'success');
      closeModal();
      renderStats();
      renderList();
    }
  });
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function closeModal() {
  document.getElementById('perpanjangan-modal')?.classList.add('hidden');
}
