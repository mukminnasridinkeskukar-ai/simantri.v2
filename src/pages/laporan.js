// SIMANTRI — Laporan & Rekap Dinkes page logic
import { loadNakes, loadFasyankes, loadPraktik, loadDashboardStats, DEMO_FASYANKES, DEMO_NAKES, DEMO_PRAKTIK } from '../assets/js/demo-data.js';
import { calcExpireStatus, STATUS, statusBadgeClass, statusLabel } from '../assets/js/supabase.js';
import { fmtDate, fmtDateLong, fmtNumber, daysUntil, initials, avatarColor, escapeHtml, toast, progressColorClass } from '../assets/js/utils.js';

let chartTren = null;
let allNakes = [];
let allFasyankes = [];
let allPraktik = [];
let filters = { bulan: '', tahun: '2025', jenis: '', fasyankesId: '' };

export async function initLaporan() {
  // Bind filters
  document.getElementById('lap-bulan')?.addEventListener('change', (e) => { filters.bulan = e.target.value; render(); });
  document.getElementById('lap-tahun')?.addEventListener('change', (e) => { filters.tahun = e.target.value; render(); });
  document.getElementById('lap-jenis')?.addEventListener('change', (e) => { filters.jenis = e.target.value; render(); });
  document.getElementById('lap-fasyankes')?.addEventListener('change', (e) => { filters.fasyankesId = e.target.value; render(); });

  // Action buttons
  document.querySelector('[data-action="refresh"]')?.addEventListener('click', () => { toast('Memuat ulang data laporan...', 'info'); render(); });
  document.querySelector('[data-action="export-pdf"]')?.addEventListener('click', () => exportPdf());
  document.querySelector('[data-action="export-excel"]')?.addEventListener('click', () => exportExcel());
  document.querySelector('[data-action="cetak"]')?.addEventListener('click', () => window.print());

  // Load fasyankes filter
  allFasyankes = await loadFasyankes();
  populateFasyankesFilter();

  await render();
}

function populateFasyankesFilter() {
  const sel = document.getElementById('lap-fasyankes');
  if (!sel) return;
  sel.innerHTML = '<option value="">Semua Fasyankes</option>' +
    allFasyankes.map((f) => `<option value="${f.id}">${escapeHtml(f.nama)}</option>`).join('');
}

async function render() {
  try {
    const [nakes, praktik] = await Promise.all([loadNakes(), loadPraktik()]);
    allNakes = nakes;
    allPraktik = praktik;

    // Apply fasyankes filter to dataset
    const nakesFiltered = filters.fasyankesId ? nakes.filter((n) => n.fasyankes_id === filters.fasyankesId) : nakes;
    const praktikFiltered = filters.fasyankesId ? praktik.filter((p) => p.fasyankes_id === filters.fasyankesId) : praktik;

    renderStatCards(nakesFiltered, praktikFiltered);
    await renderTrenChart();
    renderSummaryTable(nakesFiltered, praktikFiltered);
    renderInsights(nakesFiltered, praktikFiltered);
  } catch (err) {
    console.error(err);
    toast('Gagal memuat laporan: ' + err.message, 'error');
  }
}

function renderStatCards(nakes, praktik) {
  const c = document.getElementById('laporan-stats');
  if (!c) return;
  const totalNakesAktif = nakes.filter((n) => n.expire_status === STATUS.AKTIF).length;
  const totalSipTerbit = praktik.length;
  const totalExpired = nakes.filter((n) => n.expire_status === STATUS.EXPIRED).length +
                       praktik.filter((p) => p.expire_status === STATUS.EXPIRED).length;
  const totalPending = 0; // TODO: integrate with verifikasi queue

  const cards = [
    { label: 'Total Nakes Aktif', value: fmtNumber(totalNakesAktif), sub: `${fmtNumber(nakes.length)} total terdaftar`, icon: 'users', color: 'teal' },
    { label: 'Total SIP Terbit', value: fmtNumber(totalSipTerbit), sub: 'Surat Izin Praktik aktif', icon: 'shield', color: 'lime' },
    { label: 'Total Expired', value: fmtNumber(totalExpired), sub: 'STR & SIP sudah lewat', icon: 'alert', color: 'rose' },
    { label: 'Total Pending Verifikasi', value: fmtNumber(totalPending), sub: 'Menunggu review Dinkes', icon: 'clock', color: 'amber' },
  ];

  c.innerHTML = cards.map((card) => {
    const iconSvg = iconPath(card.icon);
    const colorMap = {
      teal: 'bg-teal-50 text-teal-600 border-l-teal-500',
      lime: 'bg-lime-50 text-lime-600 border-l-lime-500',
      amber: 'bg-amber-50 text-amber-600 border-l-amber-500',
      rose: 'bg-rose-50 text-rose-600 border-l-rose-500',
    };
    return `
      <div class="card p-5 border-l-4 ${colorMap[card.color]}">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-xl ${colorMap[card.color].split(' ').slice(0, 2).join(' ')} flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="${iconSvg}"/></svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-ink-500 uppercase tracking-wider">${escapeHtml(card.label)}</p>
            <p class="text-2xl font-extrabold text-ink-900 mt-0.5 tabular-nums">${card.value}</p>
            <p class="text-[11px] text-ink-500 mt-0.5 truncate">${escapeHtml(card.sub)}</p>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function iconPath(name) {
  const m = {
    users: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2a4 4 0 11-8 0 4 4 0 018 0zm6-3a3 3 0 11-6 0 3 3 0 016 0z',
    shield: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    alert: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  };
  return m[name] ?? m.users;
}

async function renderTrenChart() {
  // Build 6-month trend: terbit & expired counts per month based on tgl_terbit_str/sip & tgl_akhir_*
  const now = new Date();
  const labels = [];
  const terbitData = [];
  const expiredData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth(); // 0-indexed
    labels.push(d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }));
    let terbit = 0;
    let expired = 0;
    // Apply fasyankes filter
    const f = filters.fasyankesId;
    const nakes = f ? DEMO_NAKES.filter((n) => n.fasyankes_id === f) : DEMO_NAKES;
    const praktik = f ? DEMO_PRAKTIK.filter((p) => p.fasyankes_id === f) : DEMO_PRAKTIK;

    // Apply jenis filter
    const includeStr = !filters.jenis || filters.jenis === 'STR';
    const includeSip = !filters.jenis || filters.jenis === 'SIP';

    if (includeStr) {
      nakes.forEach((n) => {
        if (sameMonth(n.tgl_terbit_str, y, m)) terbit++;
        if (sameMonth(n.tgl_akhir_str, y, m) && calcExpireStatus(n.tgl_akhir_str) === STATUS.EXPIRED) expired++;
      });
    }
    if (includeSip) {
      praktik.forEach((p) => {
        if (sameMonth(p.tgl_terbit_sip, y, m)) terbit++;
        if (sameMonth(p.tgl_akhir_sip, y, m) && calcExpireStatus(p.tgl_akhir_sip) === STATUS.EXPIRED) expired++;
      });
    }
    terbitData.push(terbit);
    expiredData.push(expired);
  }

  const canvas = document.getElementById('chart-tren');
  if (!canvas) return;
  const Chart = (await import('chart.js')).default;
  chartTren?.destroy();
  chartTren = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Terbit', data: terbitData, backgroundColor: '#0D9488', hoverBackgroundColor: '#14B8A6', borderRadius: 6, maxBarThickness: 36 },
        { label: 'Expired', data: expiredData, backgroundColor: '#F43F5E', hoverBackgroundColor: '#FB7185', borderRadius: 6, maxBarThickness: 36 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: '#0F172A', padding: 10, cornerRadius: 8 },
      },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0, color: '#64748B' }, grid: { color: '#F1F5F9' } },
        x: { ticks: { color: '#64748B', font: { size: 11 } }, grid: { display: false } },
      },
    },
  });
}

function sameMonth(iso, y, m) {
  if (!iso) return false;
  const d = new Date(iso);
  return d.getFullYear() === y && d.getMonth() === m;
}

function renderSummaryTable(nakes, praktik) {
  const tbody = document.getElementById('laporan-tbody');
  const countEl = document.getElementById('lap-fasyankes-count');
  if (!tbody) return;

  const fasyankesMap = Object.fromEntries(allFasyankes.map((f) => [f.id, f]));
  const rows = [];

  // Group by fasyankes
  const grouped = {};
  for (const n of nakes) {
    const fid = n.fasyankes_id ?? '—';
    if (!grouped[fid]) grouped[fid] = { nakes: 0, expired: 0 };
    grouped[fid].nakes++;
    if (n.expire_status === STATUS.EXPIRED) grouped[fid].expired++;
  }
  const sipByFasyankes = {};
  for (const p of praktik) {
    const fid = p.fasyankes_id ?? '—';
    sipByFasyankes[fid] = (sipByFasyankes[fid] ?? 0) + 1;
  }

  for (const fid of Object.keys(grouped)) {
    const f = fasyankesMap[fid];
    rows.push({
      nama: f?.nama ?? fid,
      jenis: f?.jenis ?? '—',
      totalNakes: grouped[fid].nakes,
      totalSip: sipByFasyankes[fid] ?? 0,
      totalExpired: grouped[fid].expired,
      compliance: grouped[fid].nakes > 0
        ? Math.round(((grouped[fid].nakes - grouped[fid].expired) / grouped[fid].nakes) * 100)
        : 0,
    });
  }
  rows.sort((a, b) => b.totalNakes - a.totalNakes);

  countEl.textContent = rows.length;

  if (!rows.length) {
    tbody.innerHTML = `
      <tr><td colspan="7" class="text-center py-12">
        <div class="inline-flex flex-col items-center text-ink-500">
          <svg class="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          <p class="font-semibold">Tidak ada data</p>
          <p class="text-sm mt-1">Coba ubah filter periode atau fasyankes</p>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map((r, i) => {
    const pct = r.compliance;
    const colorClass = pct >= 90 ? 'bg-teal-500' : pct >= 70 ? 'bg-amber-500' : 'bg-rose-500';
    const textClass = pct >= 90 ? 'text-teal-700' : pct >= 70 ? 'text-amber-700' : 'text-rose-700';
    return `
      <tr>
        <td class="text-ink-400 text-xs font-mono">${String(i + 1).padStart(2, '0')}</td>
        <td>
          <p class="font-semibold text-ink-800">${escapeHtml(r.nama)}</p>
        </td>
        <td><span class="badge-ink !text-[10px]">${escapeHtml(r.jenis)}</span></td>
        <td class="text-center font-semibold text-ink-800 tabular-nums">${fmtNumber(r.totalNakes)}</td>
        <td class="text-center font-semibold text-ink-800 tabular-nums">${fmtNumber(r.totalSip)}</td>
        <td class="text-center">
          <span class="${r.totalExpired > 0 ? 'badge-rose' : 'badge-teal'} !text-xs">${fmtNumber(r.totalExpired)}</span>
        </td>
        <td class="text-center">
          <div class="flex items-center gap-2 justify-center">
            <div class="w-16 progress-track"><div class="progress-fill ${colorClass}" style="width:${pct}%"></div></div>
            <span class="text-xs font-bold ${textClass} tabular-nums w-9 text-right">${pct}%</span>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderInsights(nakes, praktik) {
  const container = document.getElementById('laporan-insight');
  if (!container) return;

  const insights = [];
  const fasyankesMap = Object.fromEntries(allFasyankes.map((f) => [f.id, f]));

  // Insight 1: fasyankes dengan SIP hampir expired dalam 30 hari
  const expiringByFasyankes = {};
  const allDocs = [
    ...nakes.map((n) => ({ tgl: n.tgl_akhir_str, fid: n.fasyankes_id, type: 'STR', nama: n.nama })),
    ...praktik.map((p) => ({ tgl: p.tgl_akhir_sip, fid: p.fasyankes_id, type: 'SIP', nama: nakes.find((n) => n.id === p.tenaga_id)?.nama ?? '' })),
  ];
  for (const d of allDocs) {
    const days = daysUntil(d.tgl);
    if (days !== null && days >= 0 && days <= 30) {
      const fname = fasyankesMap[d.fid]?.nama ?? '—';
      if (!expiringByFasyankes[fname]) expiringByFasyankes[fname] = 0;
      expiringByFasyankes[fname]++;
    }
  }
  for (const [fname, count] of Object.entries(expiringByFasyankes)) {
    insights.push({
      type: 'warning',
      text: `<strong>${escapeHtml(fname)}</strong> memiliki <strong>${count}</strong> dokumen ${filters.jenis || 'STR/SIP'} akan expired dalam 30 hari. Disarankan segera menghubungi nakes terkait untuk perpanjangan.`,
    });
  }

  // Insight 2: total expired
  const totalExpired = nakes.filter((n) => n.expire_status === STATUS.EXPIRED).length +
                       praktik.filter((p) => p.expire_status === STATUS.EXPIRED).length;
  if (totalExpired > 0) {
    insights.push({
      type: 'danger',
      text: `Terdapat <strong>${totalExpired}</strong> dokumen yang sudah <strong>expired</strong>. Status nakes terkait sebaiknya dinonaktifkan hingga perpanjangan selesai.`,
    });
  }

  // Insight 3: fasyankes dengan kepatuhan terendah
  const grouped = {};
  for (const n of nakes) {
    const fid = n.fasyankes_id ?? '—';
    if (!grouped[fid]) grouped[fid] = { total: 0, expired: 0 };
    grouped[fid].total++;
    if (n.expire_status === STATUS.EXPIRED) grouped[fid].expired++;
  }
  const complianceList = Object.entries(grouped).map(([fid, v]) => ({
    nama: fasyankesMap[fid]?.nama ?? fid,
    pct: v.total > 0 ? Math.round(((v.total - v.expired) / v.total) * 100) : 100,
  }));
  complianceList.sort((a, b) => a.pct - b.pct);
  if (complianceList[0] && complianceList[0].pct < 90) {
    insights.push({
      type: 'info',
      text: `Tingkat kepatuhan terendah dimiliki <strong>${escapeHtml(complianceList[0].nama)}</strong> (${complianceList[0].pct}%). Perlu pembinaan & monitoring lebih intensif.`,
    });
  }

  // Insight 4: jika tidak ada masalah
  if (!insights.length) {
    insights.push({
      type: 'success',
      text: `Status legalitas seluruh nakes pada periode ini dalam kondisi <strong>baik</strong>. Tidak ada dokumen yang akan expired dalam 30 hari.`,
    });
  }

  // Insight 5: total nakes
  insights.push({
    type: 'info',
    text: `Total <strong>${fmtNumber(nakes.length)}</strong> nakes terdaftar pada <strong>${fmtNumber(Object.keys(grouped).length)}</strong> fasyankes dengan <strong>${fmtNumber(praktik.length)}</strong> SIP aktif.`,
  });

  const styleMap = {
    warning: { wrap: 'bg-amber-50 border-amber-200', icon: 'bg-amber-100 text-amber-700', path: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    danger: { wrap: 'bg-rose-50 border-rose-200', icon: 'bg-rose-100 text-rose-700', path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    success: { wrap: 'bg-teal-50 border-teal-200', icon: 'bg-teal-100 text-teal-700', path: 'M5 13l4 4L19 7' },
    info: { wrap: 'bg-ink-50 border-ink-200', icon: 'bg-ink-100 text-ink-700', path: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  };

  container.innerHTML = insights.map((it) => {
    const s = styleMap[it.type];
    return `
      <div class="flex items-start gap-3 p-3.5 rounded-xl border ${s.wrap}">
        <div class="w-8 h-8 rounded-lg ${s.icon} flex items-center justify-center flex-shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="${s.path}"/></svg>
        </div>
        <p class="text-sm text-ink-700 leading-relaxed flex-1">${it.text}</p>
      </div>
    `;
  }).join('');
}

function exportExcel() {
  // CSV with .xls extension so Excel opens it
  const headers = ['No', 'Fasyankes', 'Jenis', 'Total Nakes', 'Total SIP', 'Total Expired', 'Kepatuhan %'];
  const fasyankesMap = Object.fromEntries(allFasyankes.map((f) => [f.id, f]));
  const grouped = {};
  for (const n of allNakes) {
    const fid = n.fasyankes_id ?? '—';
    if (!grouped[fid]) grouped[fid] = { nakes: 0, expired: 0 };
    grouped[fid].nakes++;
    if (n.expire_status === STATUS.EXPIRED) grouped[fid].expired++;
  }
  const sipByFasyankes = {};
  for (const p of allPraktik) {
    const fid = p.fasyankes_id ?? '—';
    sipByFasyankes[fid] = (sipByFasyankes[fid] ?? 0) + 1;
  }
  const rows = Object.entries(grouped).map(([fid, v], i) => {
    const f = fasyankesMap[fid];
    const pct = v.nakes > 0 ? Math.round(((v.nakes - v.expired) / v.nakes) * 100) : 0;
    return [i + 1, f?.nama ?? fid, f?.jenis ?? '', v.nakes, sipByFasyankes[fid] ?? 0, v.expired, pct];
  });
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join('\t')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `laporan-dinkes-${filters.tahun}.xls`;
  a.click();
  URL.revokeObjectURL(url);
  toast('File Excel berhasil diunduh', 'success');
}

function exportPdf() {
  toast('Export PDF sedang diproses...', 'info');
  // Trigger print dialog as PDF fallback
  setTimeout(() => window.print(), 400);
}
