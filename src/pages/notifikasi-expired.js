// SIMANTRI — Notifikasi Expired page logic
import { loadNakes, loadPraktik, DEMO_NOTIFICATIONS } from '../assets/js/demo-data.js';
import { calcExpireStatus, STATUS, statusBadgeClass, statusLabel } from '../assets/js/supabase.js';
import { fmtDate, fmtDateLong, relativeFromNow, daysUntil, initials, avatarColor, escapeHtml, toast } from '../assets/js/utils.js';

let currentFilter = 'all';

export async function initNotifikasiExpired() {
  document.querySelectorAll('[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach((b) => {
        b.classList.remove('badge-ink', '!bg-ink-800', '!text-white');
        b.classList.add('bg-white', 'border', 'border-ink-200');
      });
      btn.classList.add('badge-ink', '!bg-ink-800', '!text-white');
      btn.classList.remove('bg-white', 'border', 'border-ink-200');
      render();
    });
  });

  document.querySelector('[data-action="mark-all-read"]')?.addEventListener('click', () => {
    toast('Semua notifikasi ditandai dibaca (demo)', 'success');
  });

  await render();
}

async function render() {
  try {
    const [nakes, praktik] = await Promise.all([loadNakes(), loadPraktik()]);
    const nakesMap = Object.fromEntries(nakes.map((n) => [n.id, n]));

    // Build unified list
    const items = [];
    for (const n of nakes) {
      const s = calcExpireStatus(n.tgl_akhir_str);
      if (s === STATUS.HAMPIR_EXPIRED || s === STATUS.EXPIRED) {
        items.push({
          id: `str-${n.id}`,
          type: 'str',
          typeLabel: 'STR',
          nama: n.nama,
          profesi: n.profesi,
          noDok: n.no_str,
          tglAkhir: n.tgl_akhir_str,
          status: s,
          nakesId: n.id,
        });
      }
    }
    for (const p of praktik) {
      const s = calcExpireStatus(p.tgl_akhir_sip);
      if (s === STATUS.HAMPIR_EXPIRED || s === STATUS.EXPIRED) {
        const n = nakesMap[p.tenaga_id];
        items.push({
          id: `sip-${p.id}`,
          type: 'sip',
          typeLabel: 'SIP',
          nama: n?.nama ?? '—',
          profesi: n?.profesi ?? '',
          noDok: p.no_sip,
          tglAkhir: p.tgl_akhir_sip,
          status: s,
          nakesId: p.tenaga_id,
        });
      }
    }

    // Sort by tglAkhir ascending (paling urgent di atas)
    items.sort((a, b) => new Date(a.tglAkhir) - new Date(b.tglAkhir));

    // Filter
    const filtered = items.filter((it) => {
      if (currentFilter === 'all') return true;
      if (currentFilter === 'str') return it.type === 'str';
      if (currentFilter === 'sip') return it.type === 'sip';
      if (currentFilter === 'hampir') return it.status === STATUS.HAMPIR_EXPIRED;
      if (currentFilter === 'expired') return it.status === STATUS.EXPIRED;
      return true;
    });

    // Banners
    document.getElementById('banner-hampir').textContent = items.filter((i) => i.status === STATUS.HAMPIR_EXPIRED).length;
    document.getElementById('banner-expired').textContent = items.filter((i) => i.status === STATUS.EXPIRED).length;
    document.getElementById('banner-done').textContent = '0';
    document.getElementById('notif-count').textContent = filtered.length;

    // Render list
    const list = document.getElementById('notif-list');
    if (!filtered.length) {
      list.innerHTML = `
        <div class="p-12 text-center">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-teal-50 text-teal-600 mb-3">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          </div>
          <p class="font-bold text-ink-800">Tidak ada notifikasi</p>
          <p class="text-sm text-ink-500 mt-1">Semua STR & SIP dalam status aktif</p>
        </div>`;
      return;
    }

    list.innerHTML = filtered.map((it) => {
      const d = daysUntil(it.tglAkhir);
      const isExpired = it.status === STATUS.EXPIRED;
      const iconColor = isExpired ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600';
      const iconPath = isExpired
        ? 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
        : 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
      return `
        <div class="p-4 sm:p-5 hover:bg-ink-50/50 transition-colors flex items-start gap-4">
          <div class="w-11 h-11 rounded-xl ${iconColor} flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="${iconPath}"/></svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="badge ${it.type === 'str' ? 'badge-lime' : 'badge-teal'} !text-[10px]">${it.typeLabel}</span>
              <span class="${statusBadgeClass(it.status)}">${statusLabel(it.status)}</span>
              <span class="text-xs text-ink-500">${relativeFromNow(it.tglAkhir)} • ${fmtDateLong(it.tglAkhir)}</span>
            </div>
            <p class="mt-1.5 font-semibold text-ink-800">${escapeHtml(it.nama)}</p>
            <p class="text-sm text-ink-600">${escapeHtml(it.profesi)} • No. ${escapeHtml(it.typeLabel)}: <code class="text-xs bg-ink-100 px-1.5 py-0.5 rounded">${escapeHtml(it.noDok ?? '-')}</code></p>
            <p class="text-xs text-ink-500 mt-1">${isExpired ? `Berakhir ${fmtDate(it.tglAkhir)} (${-d} hari lalu)` : `Akan berakhir dalam ${d} hari`}</p>
          </div>
          <div class="flex sm:flex-col gap-2 flex-shrink-0">
            <button class="btn-outline btn-sm" data-action="detail" data-nakes-id="${it.nakesId}">
              Detail
            </button>
            <button class="btn-primary btn-sm" data-action="perpanjang" data-nakes-id="${it.nakesId}">
              Perpanjang
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Bind actions
    list.querySelectorAll('[data-action="detail"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('simantri:open-nakes', { detail: { id: btn.dataset.nakesId } }));
        window.SIMANTRI.navigateTo('data-nakes');
      });
    });
    list.querySelectorAll('[data-action="perpanjang"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        toast('Membuka form perpanjangan...', 'info');
        window.SIMANTRI.navigateTo('perpanjangan');
      });
    });
  } catch (err) {
    console.error(err);
    toast('Gagal memuat notifikasi: ' + err.message, 'error');
  }
}
