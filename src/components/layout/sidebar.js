// SIMANTRI — sidebar behavior
import { getProfile, isDinkes, isFasyankes, isNakes } from '../../assets/js/auth.js';
import { initials, avatarColor } from '../../assets/js/utils.js';

// ============================================
// Icon set — minimal inline SVG (stroke)
// ============================================
const ICONS = {
  dashboard:    'M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z M4 9h16 M9 4v16',
  map:           'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  bell:          'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  doctor:        'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  health:        'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  hospital:      'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  calendar:      'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  'shield-check': 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  refresh:       'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  report:        'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  users:         'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-2-5.24',
  cog:           'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
};

function renderIcon(name, extraClass = 'w-5 h-5 nav-icon flex-shrink-0') {
  const path = ICONS[name] ?? ICONS.dashboard;
  return `<svg class="${extraClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="${path}"/></svg>`;
}

// ============================================
// Init
// ============================================
export function initSidebar({ navigateTo, routes, groupLabels }) {
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;

  // Group routes
  const grouped = {};
  for (const r of routes) {
    if (!grouped[r.group]) grouped[r.group] = [];
    grouped[r.group].push(r);
  }

  // Render
  let html = '';
  const order = ['overview', 'data', 'izin'];
  for (const g of order) {
    if (!grouped[g]) continue;
    html += `<div class="section-label">${escapeAttr(groupLabels[g] ?? g)}</div>`;
    html += `<div class="px-2 space-y-0.5">`;
    for (const r of grouped[g]) {
      html += `
        <a href="#/${r.id}"
           data-route="${r.id}"
           class="nav-item"
           role="menuitem"
           aria-label="${escapeAttr(r.label)}">
          ${renderIcon(r.icon)}
          <span class="flex-1 truncate">${escapeText(r.label)}</span>
          ${r.dinkesOnly ? '<span class="badge-amber !px-1.5 !py-0 !text-[9px]">DINKES</span>' : ''}
        </a>`;
    }
    html += `</div>`;
  }
  nav.innerHTML = html;

  // Click handlers
  nav.querySelectorAll('[data-route]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(el.dataset.route);
    });
  });

  // User mini-card
  renderUserCard();
  const logoutBtn = document.querySelector('[data-action="logout"]');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm('Anda yakin ingin keluar?')) {
        const { signOut } = await import('../../assets/js/auth.js');
        await signOut();
        location.reload();
      }
    });
  }
}

function renderUserCard() {
  const p = getProfile();
  const nameEl = document.getElementById('sidebar-user-name');
  const roleEl = document.getElementById('sidebar-user-role');
  const avatarEl = document.getElementById('sidebar-avatar');
  if (!p) return;
  if (nameEl) nameEl.textContent = p.full_name ?? 'Pengguna';
  if (roleEl) {
    const roleText = ({ dinkes: 'Admin Dinkes', fasyankes: 'Admin Fasyankes', nakes: 'Tenaga Kesehatan' })[p.role] ?? p.role;
    roleEl.textContent = roleText;
  }
  if (avatarEl) {
    avatarEl.textContent = initials(p.full_name ?? p.email ?? '?');
    avatarEl.className = `w-9 h-9 rounded-full ${avatarColor(p.full_name ?? p.email ?? '?')} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`;
  }
}

// Helpers
function escapeText(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
function escapeAttr(s) { return escapeText(s); }
