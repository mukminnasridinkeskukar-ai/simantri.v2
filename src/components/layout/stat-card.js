// SIMANTRI — stat-card helper
// Render stat-card ke dalam container.
// Usage:
//   renderStatCard(el, { label, value, sub, icon, variant, trend })

const ICONS = {
  users:    'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-2-5.24',
  hospital: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  shield:   'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  alert:    'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  clock:    'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  check:    'M5 13l4 4L19 7',
  document: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
};

const VARIANTS = {
  teal:  'bg-teal-50 text-teal-600',
  lime:  'bg-lime-50 text-lime-600',
  amber: 'bg-amber-50 text-amber-600',
  rose:  'bg-rose-50 text-rose-600',
  ink:   'bg-ink-100 text-ink-700',
};

export function renderStatCard(container, opts = {}) {
  const {
    label = 'Stat',
    value = '0',
    sub = '',
    icon = 'users',
    variant = 'teal',
    trend = null,
  } = opts;

  const iconPath = ICONS[icon] ?? ICONS.users;
  const variantClass = VARIANTS[variant] ?? VARIANTS.teal;

  container.innerHTML = `
    <div class="card card-hover p-5 h-full">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <p class="text-xs font-semibold text-ink-500 uppercase tracking-wider">${escape(label)}</p>
          <p class="mt-2 text-3xl font-extrabold text-ink-900 tabular-nums">${escape(value)}</p>
          ${sub ? `<p class="mt-1.5 text-xs text-ink-500">${escape(sub)}</p>` : ''}
        </div>
        <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${variantClass}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="${iconPath}"/>
          </svg>
        </div>
      </div>
      ${trend ? `
      <div class="mt-3 flex items-center gap-1.5 text-xs">
        <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${trend.direction === 'up' ? 'bg-teal-50 text-teal-700' : 'bg-rose-50 text-rose-700'} font-semibold">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="${trend.direction === 'up' ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'}"/>
          </svg>
          ${escape(trend.value)}
        </span>
        <span class="text-ink-500">${escape(trend.label ?? 'vs periode lalu')}</span>
      </div>` : ''}
    </div>
  `;
}

function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
