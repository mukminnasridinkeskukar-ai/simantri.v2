// SIMANTRI — Peta Sebaran page logic
import { loadFasyankes, loadNakes } from '../assets/js/demo-data.js';
import { fmtNumber, escapeHtml, toast, initials, avatarColor } from '../assets/js/utils.js';

const COLOR_BY_JENIS = {
  'RS': '#0D9488',
  'Puskesmas': '#84CC16',
  'Klinik Utama': '#F59E0B',
  'Klinik Pratama': '#F59E0B',
  'Praktik Mandiri': '#F43F5E',
  'Apotek': '#F43F5E',
};

export async function initPetaSebaran() {
  const filterEl = document.getElementById('peta-filter-jenis');
  filterEl?.addEventListener('change', () => render(filterEl.value));

  await render();
}

async function render(jenisFilter = '') {
  try {
    const [fasyankes, nakes] = await Promise.all([loadFasyankes({ jenis: jenisFilter || null }), loadNakes()]);
    const nakesByFasyankes = {};
    for (const n of nakes) {
      nakesByFasyankes[n.fasyankes_id] = (nakesByFasyankes[n.fasyankes_id] ?? 0) + 1;
    }

    // Render markers — pseudo-random position within map area based on lat_lng
    const markersContainer = document.getElementById('map-markers');
    if (markersContainer) {
      // Clear placeholder loading
      const placeholder = markersContainer.parentElement.querySelector('.absolute.inset-0.flex.items-center.justify-center');
      if (placeholder) placeholder.style.display = 'none';

      markersContainer.innerHTML = '';
      fasyankes.forEach((f, idx) => {
        const [lat, lng] = (f.lat_lng ?? '0,0').split(',').map(Number);
        // Map lat/lng to x/y percent (Surabaya area demo: lat -7.20..-7.30, lng 112.70..112.80)
        const x = ((lng - 112.70) / 0.10) * 100;
        const y = ((-7.20 + lat) / 0.10) * 100 + 50; // flip
        const color = COLOR_BY_JENIS[f.jenis] ?? '#64748B';
        const count = nakesByFasyankes[f.id] ?? 0;

        const marker = document.createElement('div');
        marker.className = 'absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer';
        marker.style.left = `${Math.max(8, Math.min(92, x))}%`;
        marker.style.top = `${Math.max(10, Math.min(90, y))}%`;
        marker.innerHTML = `
          <div class="relative">
            <span class="absolute -inset-2 rounded-full opacity-30 animate-ping" style="background:${color}"></span>
            <span class="relative block w-5 h-5 rounded-full border-2 border-white shadow-card" style="background:${color}"></span>
            <div class="absolute left-1/2 -translate-x-1/2 top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-ink-900 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap z-10 pointer-events-none">
              <strong>${escapeHtml(f.nama)}</strong> • ${count} nakes
            </div>
          </div>
        `;
        marker.addEventListener('click', () => showFasyankes(f, count));
        markersContainer.appendChild(marker);
      });
    }

    // Summary
    const summary = document.getElementById('peta-summary');
    if (summary) {
      const byJenis = {};
      fasyankes.forEach((f) => { byJenis[f.jenis] = (byJenis[f.jenis] ?? 0) + 1; });
      summary.innerHTML = `
        <div class="flex items-center justify-between">
          <span class="text-sm text-ink-600">Total Fasyankes</span>
          <span class="font-bold text-ink-900">${fmtNumber(fasyankes.length)}</span>
        </div>
        ${Object.entries(byJenis).map(([jenis, count]) => `
          <div class="flex items-center justify-between text-sm">
            <span class="flex items-center gap-2 text-ink-600">
              <span class="w-2.5 h-2.5 rounded-full" style="background:${COLOR_BY_JENIS[jenis] ?? '#64748B'}"></span>
              ${escapeHtml(jenis)}
            </span>
            <span class="font-semibold text-ink-800">${fmtNumber(count)}</span>
          </div>
        `).join('')}
        <div class="flex items-center justify-between pt-2 border-t border-ink-100">
          <span class="text-sm text-ink-600">Total Nakes Tersebar</span>
          <span class="font-bold text-teal-700">${fmtNumber(nakes.length)}</span>
        </div>
      `;
    }

    // List
    const list = document.getElementById('peta-list');
    if (list) {
      list.innerHTML = fasyankes.map((f) => {
        const count = nakesByFasyankes[f.id] ?? 0;
        const color = COLOR_BY_JENIS[f.jenis] ?? '#64748B';
        return `
          <button data-fasyankes-id="${f.id}" class="w-full text-left p-2.5 rounded-lg hover:bg-ink-50 transition-colors flex items-center gap-3">
            <span class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background:${color}20;color:${color}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </span>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm text-ink-800 truncate">${escapeHtml(f.nama)}</p>
              <p class="text-xs text-ink-500 truncate">${escapeHtml(f.jenis)} • ${count} nakes</p>
            </div>
          </button>
        `;
      }).join('');
      list.querySelectorAll('[data-fasyankes-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const f = fasyankes.find((x) => x.id === btn.dataset.fasyankesId);
          if (f) showFasyankes(f, nakesByFasyankes[f.id] ?? 0);
        });
      });
    }
  } catch (err) {
    console.error(err);
    toast('Gagal memuat peta: ' + err.message, 'error');
  }
}

function showFasyankes(f, count) {
  toast(`${f.nama} • ${count} nakes terdaftar`, 'info', 4500);
}
