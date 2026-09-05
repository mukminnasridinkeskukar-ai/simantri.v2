// SIMANTRI — Dashboard page logic
// Dipanggil otomatis saat page dimuat (lihat src/assets/js/pages-bootstrap.js)
import { loadDashboardStats, loadNakes, loadPraktik } from '../assets/js/demo-data.js';
import { renderStatCard } from '../components/layout/stat-card.js';
import { calcExpireStatus, STATUS, statusBadgeClass, statusLabel } from '../assets/js/supabase.js';
import { fmtDate, fmtNumber, relativeFromNow, daysUntil, initials, avatarColor, escapeHtml, toast } from '../assets/js/utils.js';

let chartFasyankes = null;
let chartJenis = null;

export async function initDashboard() {
  const statsContainer = document.getElementById('dashboard-stats');
  const refreshBtn = document.querySelector('[data-action="refresh"]');
  const exportBtn = document.querySelector('[data-action="export"]');
  const seeAllBtn = document.querySelector('[data-action="see-all-expired"]');

  refreshBtn?.addEventListener('click', () => { toast('Memuat ulang data...', 'info'); render(); });
  exportBtn?.addEventListener('click', () => toast('Export laporan — fitur ini akan generate PDF/Excel', 'info'));
  seeAllBtn?.addEventListener('click', () => window.SIMANTRI.navigateTo('notifikasi-expired'));

  await render();
}

async function render() {
  try {
    const stats = await loadDashboardStats();

    // Stat cards
    const c = document.getElementById('dashboard-stats');
    c.innerHTML = '';
    const cards = [
      { label: 'Total Nakes', value: fmtNumber(stats.totalNakes), sub: `${stats.tenagaMedis} medis • ${stats.tenagaKesehatan} kesehatan`, icon: 'users', variant: 'teal', trend: { direction: 'up', value: '12%', label: 'vs bulan lalu' } },
      { label: 'Total Fasyankes', value: fmtNumber(stats.totalFasyankes), sub: 'RS, Puskesmas, Klinik, Apotek', icon: 'hospital', variant: 'lime' },
      { label: 'Praktik Aktif', value: fmtNumber(stats.totalPraktik), sub: 'SIP terdaftar di sistem', icon: 'shield', variant: 'amber' },
      { label: 'Perlu Tindak Lanjut', value: fmtNumber(stats.str.hampir + stats.str.expired + stats.sip.hampir + stats.sip.expired), sub: 'STR/SIP hampir/expired', icon: 'alert', variant: 'rose', trend: { direction: 'down', value: '5%', label: 'minggu ini' } },
    ];
    cards.forEach((opt) => {
      const div = document.createElement('div');
      c.appendChild(div);
      renderStatCard(div, opt);
    });

    // Status panels
    document.getElementById('str-aktif').textContent = fmtNumber(stats.str.aktif);
    document.getElementById('str-hampir').textContent = fmtNumber(stats.str.hampir);
    document.getElementById('str-expired').textContent = fmtNumber(stats.str.expired);
    document.getElementById('str-total').textContent = `Total: ${fmtNumber(stats.str.aktif + stats.str.hampir + stats.str.expired)}`;
    document.getElementById('sip-aktif').textContent = fmtNumber(stats.sip.aktif);
    document.getElementById('sip-hampir').textContent = fmtNumber(stats.sip.hampir);
    document.getElementById('sip-expired').textContent = fmtNumber(stats.sip.expired);
    document.getElementById('sip-total').textContent = `Total: ${fmtNumber(stats.sip.aktif + stats.sip.hampir + stats.sip.expired)}`;

    // Charts
    await renderFasyankesChart(stats.byFasyankes);
    await renderJenisChart(stats.byJenis);

    // Expiring soon list
    await renderExpiringList();
  } catch (err) {
    console.error(err);
    toast('Gagal memuat dashboard: ' + err.message, 'error');
  }
}

async function renderFasyankesChart(byFasyankes) {
  const { DEMO_FASYANKES } = await import('../assets/js/demo-data.js');
  const fasyankesMap = Object.fromEntries(DEMO_FASYANKES.map((f) => [f.id, f.nama]));
  const labels = Object.keys(byFasyankes).map((id) => fasyankesMap[id] ?? id);
  const values = Object.values(byFasyankes);

  const canvas = document.getElementById('chart-fasyankes');
  if (!canvas) return;
  const Chart = (await import('chart.js')).default;
  chartFasyankes?.destroy();
  chartFasyankes = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Jumlah Nakes',
        data: values,
        backgroundColor: '#0D9488',
        hoverBackgroundColor: '#14B8A6',
        borderRadius: 8,
        maxBarThickness: 48,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0F172A', padding: 10, cornerRadius: 8 } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0, color: '#64748B' }, grid: { color: '#F1F5F9' } },
        x: { ticks: { color: '#64748B', font: { size: 11 } }, grid: { display: false } },
      },
    },
  });
}

async function renderJenisChart(byJenis) {
  const labels = Object.keys(byJenis);
  const values = Object.values(byJenis);
  const colors = ['#0D9488', '#84CC16', '#F59E0B', '#F43F5E', '#6366F1', '#14B8A6', '#A3E635', '#FBBF24'];

  const canvas = document.getElementById('chart-jenis');
  if (!canvas) return;
  const Chart = (await import('chart.js')).default;
  chartJenis?.destroy();
  chartJenis = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 0,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: { color: '#475569', font: { size: 11 }, padding: 12, boxWidth: 10, boxHeight: 10 } },
        tooltip: { backgroundColor: '#0F172A', padding: 10, cornerRadius: 8 },
      },
    },
  });
}

async function renderExpiringList() {
  const list = document.getElementById('expiring-list');
  if (!list) return;
  const nakes = await loadNakes();
  const praktik = await loadPraktik();

  const items = [];
  for (const n of nakes) {
    const s = calcExpireStatus(n.tgl_akhir_str);
    if (s === STATUS.HAMPIR_EXPIRED || s === STATUS.EXPIRED) {
      items.push({ type: 'STR', nama: n.nama, profesi: n.profesi, tglAkhir: n.tgl_akhir_str, status: s, id: n.id });
    }
  }
  for (const p of praktik) {
    const s = calcExpireStatus(p.tgl_akhir_sip);
    if (s === STATUS.HAMPIR_EXPIRED || s === STATUS.EXPIRED) {
      // find nakes name
      const n = (await loadNakes()).find((x) => x.id === p.tenaga_id);
      items.push({ type: 'SIP', nama: n?.nama ?? '—', profesi: n?.profesi ?? '', tglAkhir: p.tgl_akhir_sip, status: s, id: p.id });
    }
  }

  items.sort((a, b) => new Date(a.tglAkhir) - new Date(b.tglAkhir));
  const top = items.slice(0, 5);

  if (!top.length) {
    list.innerHTML = `<div class="text-center py-8 text-ink-500 text-sm">Tidak ada yang akan expired dalam 90 hari</div>`;
    return;
  }

  list.innerHTML = top.map((it) => {
    const d = daysUntil(it.tglAkhir);
    const isExpired = it.status === STATUS.EXPIRED;
    return `
      <div class="flex items-center gap-3 p-3 rounded-xl border border-ink-100 hover:border-ink-200 hover:bg-ink-50/50 transition-colors">
        <div class="w-10 h-10 rounded-xl ${avatarColor(it.nama)} flex items-center justify-center text-white font-bold text-xs flex-shrink-0">${initials(it.nama)}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="font-semibold text-sm text-ink-800 truncate">${escapeHtml(it.nama)}</p>
            <span class="badge ${it.type === 'STR' ? 'badge-lime' : 'badge-teal'} !px-1.5 !py-0 !text-[10px]">${it.type}</span>
          </div>
          <p class="text-xs text-ink-500 truncate">${escapeHtml(it.profesi)} • Berakhir ${fmtDate(it.tglAkhir)}</p>
        </div>
        <span class="${statusBadgeClass(it.status)} flex-shrink-0">
          ${isExpired ? 'Expired' : d + ' hari lagi'}
        </span>
      </div>
    `;
  }).join('');
}
