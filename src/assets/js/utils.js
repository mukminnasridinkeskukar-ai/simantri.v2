// ============================================
// SIMANTRI — utils
// ============================================

/** Format tanggal ID — "5 Sep 2026" */
export function fmtDate(iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', opts).format(d);
}

/** Format tanggal lengkap — "5 September 2026" */
export function fmtDateLong(iso) {
  return fmtDate(iso, { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Hitung hari sampai tanggal akhir. Negative = sudah lewat. */
export function daysUntil(iso) {
  if (!iso) return null;
  const end = new Date(iso);
  end.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

/** "23 hari lagi" / "3 hari lalu" / "hari ini" */
export function relativeFromNow(iso) {
  const d = daysUntil(iso);
  if (d === null) return '-';
  if (d === 0) return 'hari ini';
  if (d > 0) return `${d} hari lagi`;
  return `${-d} hari lalu`;
}

/** Inisial nama — "Budi Santoso" → "BS" */
export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');
}

/** Avatar warna deterministik berdasarkan string */
export function avatarColor(seed = '') {
  const colors = [
    'bg-teal-600', 'bg-lime-500', 'bg-amber-500', 'bg-rose-500',
    'bg-ink-700', 'bg-teal-700', 'bg-lime-600',
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return colors[h % colors.length];
}

/** Debounce sederhana untuk search input */
export function debounce(fn, wait = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/** Escape HTML — untuk mencegah XSS saat inject string ke innerHTML */
export function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Toas notifikasi */
export function toast(message, type = 'info', duration = 3500) {
  const portal = document.getElementById('toast-portal');
  if (!portal) return;
  const styles = {
    info: 'bg-ink-800 text-white',
    success: 'bg-teal-600 text-white',
    warning: 'bg-amber-500 text-ink-900',
    error: 'bg-rose-500 text-white',
  };
  const icons = { info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', success: 'M5 13l4 4L19 7', warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', error: 'M6 18L18 6M6 6l12 12' };
  const el = document.createElement('div');
  el.className = `${styles[type]} px-4 py-3 rounded-xl shadow-card text-sm font-medium flex items-center gap-2.5 max-w-sm animate-fade-in`;
  el.innerHTML = `
    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="${icons[type]}"/></svg>
    <span class="flex-1">${escapeHtml(message)}</span>
  `;
  portal.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    el.style.transition = 'all .25s';
    setTimeout(() => el.remove(), 250);
  }, duration);
}

/** Format angka ribuan — 12000 → "12.000" */
export function fmtNumber(n) {
  return new Intl.NumberFormat('id-ID').format(n ?? 0);
}

/** Slugify — "Data Nakes" → "data-nakes" */
export function slugify(s = '') {
  return s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

/** Progress % — clamp 0..100 */
export function progressPercent(start, end) {
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const now = Date.now();
  if (e <= s) return 0;
  const pct = ((now - s) / (e - s)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

/** Class warna progress bar berdasarkan % */
export function progressColorClass(pct) {
  if (pct >= 80) return 'bg-rose-500';
  if (pct >= 60) return 'bg-amber-500';
  return 'bg-teal-500';
}

/** ID unik singkat untuk key React-like lists */
export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}
