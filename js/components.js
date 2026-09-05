/* ============================================================================
 * SIMANTRI v3 — Components (sidebar, header, stat-card)
 * Plain JS. Render ke DOM via window.SIMANTRI_COMPONENTS.render*
 * ============================================================================ */

(function () {
  'use strict';

  const utils = window.SIMANTRI_UTILS;
  const auth = window.SIMANTRI_AUTH;

  // === ICONS ===
  const ICONS = {
    dashboard: 'M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z M4 9h16 M9 4v16',
    map: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
    bell: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
    doctor: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    health: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    hospital: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    'shield-check': 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    report: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    users: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-2-5.24',
    cog: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
  };

  function iconSvg(name, extraClass) {
    const path = ICONS[name] || ICONS.dashboard;
    extraClass = extraClass || 'w-5 h-5 nav-icon flex-shrink-0';
    return '<svg class="' + extraClass + '" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="' + path + '"/></svg>';
  }

  // === ROUTES (shared with app.js) ===
  const ROUTES = [
    { id: 'dashboard', label: 'Dashboard Monitoring', group: 'overview', icon: 'dashboard' },
    { id: 'peta-sebaran', label: 'Peta Sebaran Praktik', group: 'overview', icon: 'map' },
    { id: 'notifikasi-expired', label: 'Notifikasi Expired', group: 'overview', icon: 'bell' },
    { id: 'data-nakes', label: 'Data Tenaga Medis', group: 'data', icon: 'doctor' },
    { id: 'data-tenaga-kesehatan', label: 'Data Tenaga Kesehatan', group: 'data', icon: 'health' },
    { id: 'data-fasyankes', label: 'Data Fasyankes & Praktik', group: 'data', icon: 'hospital' },
    { id: 'jadwal-praktik', label: 'Jadwal Praktik', group: 'data', icon: 'calendar' },
    { id: 'verifikasi', label: 'Verifikasi STR & SIP', group: 'izin', icon: 'shield-check' },
    { id: 'perpanjangan', label: 'Perpanjangan & Rekomendasi', group: 'izin', icon: 'refresh' },
    { id: 'laporan', label: 'Laporan & Rekap Dinkes', group: 'izin', icon: 'report' },
    { id: 'manajemen-user', label: 'Manajemen User & Role', group: 'izin', icon: 'users', dinkesOnly: true },
    { id: 'pengaturan', label: 'Pengaturan & Audit Log', group: 'izin', icon: 'cog' },
  ];

  const GROUP_LABELS = {
    overview: 'Overview',
    data: 'Manajemen Data Inti',
    izin: 'Perizinan & Sistem',
  };

  // === SIDEBAR ===
  function renderSidebar(slotId) {
    const slot = document.getElementById(slotId);
    if (!slot) return;
    slot.innerHTML = `
      <div class="h-full w-64 bg-ink-900 text-white flex flex-col fixed lg:relative inset-y-0 left-0 z-40">
        <div class="px-5 py-5 flex items-center gap-3 border-b border-white/10">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-glow flex-shrink-0" style="background:linear-gradient(135deg,#0D9488 0%,#84CC16 100%);">
            <svg class="w-6 h-6" fill="none" stroke="#0F172A" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
          </div>
          <div class="leading-tight">
            <p class="font-bold text-base tracking-tight">SIMANTRI</p>
            <p class="text-[10px] text-ink-400 font-medium uppercase tracking-wider">v3 • Nakes Platform</p>
          </div>
        </div>
        <nav class="flex-1 overflow-y-auto py-3 no-scrollbar" id="sidebar-nav" aria-label="Navigasi utama"></nav>
        <div class="p-3 border-t border-white/10">
          <div class="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer" id="sidebar-user">
            <div id="sidebar-avatar" class="w-9 h-9 rounded-full flex items-center justify-center text-ink-900 font-bold text-sm flex-shrink-0" style="background:linear-gradient(135deg,#0D9488 0%,#84CC16 100%);">?</div>
            <div class="flex-1 min-w-0">
              <p id="sidebar-user-name" class="text-sm font-semibold truncate">—</p>
              <p id="sidebar-user-role" class="text-xs text-ink-400 capitalize">—</p>
            </div>
            <button data-action="logout" class="text-ink-400 hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-white/5" aria-label="Logout">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;

    // Render nav items
    const nav = slot.querySelector('#sidebar-nav');
    const grouped = {};
    ROUTES.forEach(function (r) {
      if (!grouped[r.group]) grouped[r.group] = [];
      grouped[r.group].push(r);
    });

    let html = '';
    ['overview', 'data', 'izin'].forEach(function (g) {
      if (!grouped[g]) return;
      html += '<div class="section-label">' + utils.escapeHtml(GROUP_LABELS[g] || g) + '</div>';
      html += '<div class="px-2 space-y-0.5">';
      grouped[g].forEach(function (r) {
        const isDinkesOnly = r.dinkesOnly;
        html += '<a href="#/' + r.id + '" data-route="' + r.id + '" class="nav-item" role="menuitem" aria-label="' + utils.escapeHtml(r.label) + '">'
              + iconSvg(r.icon)
              + '<span class="flex-1 truncate">' + utils.escapeHtml(r.label) + '</span>'
              + (isDinkesOnly ? '<span class="badge-amber" style="padding:0 0.375rem;font-size:9px;">DINKES</span>' : '')
              + '</a>';
      });
      html += '</div>';
    });
    nav.innerHTML = html;

    // User card
    const p = auth.getProfile();
    if (p) {
      const nameEl = slot.querySelector('#sidebar-user-name');
      const roleEl = slot.querySelector('#sidebar-user-role');
      const avatarEl = slot.querySelector('#sidebar-avatar');
      if (nameEl) nameEl.textContent = p.full_name || 'Pengguna';
      if (roleEl) {
        const roleText = ({ dinkes: 'Admin Dinkes', fasyankes: 'Admin Fasyankes', nakes: 'Tenaga Kesehatan' })[p.role] || p.role;
        roleEl.textContent = roleText;
      }
      if (avatarEl) {
        avatarEl.textContent = utils.initials(p.full_name || p.email || '?');
      }
    }

    // Logout
    const logoutBtn = slot.querySelector('[data-action="logout"]');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async function (e) {
        e.stopPropagation();
        if (confirm('Anda yakin ingin keluar?')) {
          await auth.signOut();
          location.reload();
        }
      });
    }
  }

  // === HEADER ===
  function renderHeader(slotId, currentRoute) {
    const slot = document.getElementById(slotId);
    if (!slot) return;
    const route = currentRoute || {};
    slot.innerHTML = `
      <header class="glass-header sticky top-0 z-30">
        <div class="px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
          <button id="header-menu-btn" class="lg:hidden btn-ghost" style="padding:0.5rem;" aria-label="Buka menu">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <div class="flex-1 min-w-0">
            <h1 id="header-title" class="text-lg sm:text-xl font-bold text-ink-900 truncate">${utils.escapeHtml(route.label || 'Dashboard')}</h1>
            <p id="header-subtitle" class="text-xs text-ink-500 truncate hidden sm:block">Pantau legalitas praktik tenaga medis & kesehatan secara real-time</p>
          </div>
          <div class="hidden md:flex items-center relative">
            <svg class="w-4 h-4 text-ink-400 absolute left-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="search" id="header-search" placeholder="Cari Nakes / NIK / STR..." class="input" style="padding-left:2.25rem;width:20rem;" aria-label="Pencarian global" />
          </div>
          <button class="btn-ghost" style="padding:0.5rem;position:relative;" id="header-bell" aria-label="Notifikasi">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            <span class="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse-dot"></span>
          </button>
          <div class="hidden sm:block w-px h-6 bg-ink-200"></div>
          <div class="flex items-center gap-2.5" id="header-user">
            <div id="header-avatar" class="w-9 h-9 rounded-full flex items-center justify-center text-ink-900 font-bold text-sm" style="background:linear-gradient(135deg,#0D9488 0%,#84CC16 100%);">?</div>
            <div class="hidden sm:block leading-tight">
              <p id="header-user-name" class="text-sm font-semibold text-ink-800 max-w-[140px] truncate">—</p>
              <p id="header-user-role" class="text-[11px] text-ink-500 capitalize">—</p>
            </div>
          </div>
        </div>
        <div id="search-dropdown" class="hidden absolute right-4 sm:right-6 lg:right-8 top-14 card p-2 z-40" style="width:min(640px,calc(100vw - 2rem));">
          <div class="text-xs text-ink-500 px-3 py-2 font-semibold uppercase tracking-wider">Hasil cepat</div>
          <div id="search-results" class="max-h-80 overflow-y-auto"></div>
        </div>
      </header>
    `;

    // User info
    const p = auth.getProfile();
    if (p) {
      const nameEl = slot.querySelector('#header-user-name');
      const roleEl = slot.querySelector('#header-user-role');
      const avatarEl = slot.querySelector('#header-avatar');
      if (nameEl) nameEl.textContent = p.full_name || 'Pengguna';
      if (roleEl) {
        const roleText = ({ dinkes: 'Admin Dinkes', fasyankes: 'Admin Fasyankes', nakes: 'Tenaga Kesehatan' })[p.role] || p.role;
        roleEl.textContent = roleText;
      }
      if (avatarEl) avatarEl.textContent = utils.initials(p.full_name || p.email || '?');
    }

    // Bell → notifikasi page
    const bell = slot.querySelector('#header-bell');
    if (bell) bell.addEventListener('click', function () { window.SIMANTRI.navigateTo('notifikasi-expired'); });

    // Mobile menu
    const menuBtn = slot.querySelector('#header-menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', function () {
        const drawer = document.getElementById('sidebar-drawer');
        const content = document.getElementById('sidebar-drawer-content');
        if (!drawer || !content) return;
        const sidebarSlot = document.getElementById('sidebar-slot');
        if (sidebarSlot) content.innerHTML = sidebarSlot.innerHTML;
        drawer.classList.toggle('hidden');
      });
    }

    // Drawer close
    document.querySelectorAll('[data-drawer-close]').forEach(function (el) {
      el.addEventListener('click', function () {
        document.getElementById('sidebar-drawer').classList.add('hidden');
      });
    });

    // Search
    const searchInput = slot.querySelector('#header-search');
    const searchDropdown = slot.querySelector('#search-dropdown');
    const searchResults = slot.querySelector('#search-results');
    if (searchInput) {
      let debounceT;
      searchInput.addEventListener('input', function (e) {
        clearTimeout(debounceT);
        const q = e.target.value.trim();
        if (q.length < 2) {
          searchDropdown.classList.add('hidden');
          return;
        }
        debounceT = setTimeout(function () { doSearch(q); }, 200);
      });
      document.addEventListener('keydown', function (e) {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          searchInput.focus();
          searchInput.select();
        }
        if (e.key === 'Escape') {
          searchDropdown.classList.add('hidden');
          searchInput.blur();
        }
      });
      document.addEventListener('click', function (e) {
        if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
          searchDropdown.classList.add('hidden');
        }
      });
    }

    async function doSearch(q) {
      if (!searchResults || !searchDropdown) return;
      searchResults.innerHTML = '<div class="px-3 py-4 text-sm text-ink-500">Mencari "<strong>' + utils.escapeHtml(q) + '</strong>"...</div>';
      searchDropdown.classList.remove('hidden');

      try {
        const data = await window.SIMANTRI_DATA.loadNakes({ search: q });
        if (!data.length) {
          // Show route suggestions
          const routes = ['dashboard', 'data-nakes', 'data-fasyankes', 'verifikasi', 'notifikasi-expired'];
          const matches = routes.filter(function (r) { return r.toLowerCase().indexOf(q.toLowerCase()) >= 0; });
          if (matches.length) {
            searchResults.innerHTML = matches.map(function (r) {
              return '<button data-quick-route="' + r + '" class="w-full text-left px-3 py-2.5 rounded-lg hover:bg-teal-50 text-sm flex items-center gap-2"><svg class="w-4 h-4 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>Buka <strong class="capitalize">' + utils.escapeHtml(r.replace(/-/g, ' ')) + '</strong></button>';
            }).join('');
            searchResults.querySelectorAll('[data-quick-route]').forEach(function (btn) {
              btn.addEventListener('click', function () {
                window.SIMANTRI.navigateTo(btn.dataset.quickRoute);
                searchDropdown.classList.add('hidden');
                searchInput.value = '';
              });
            });
          } else {
            searchResults.innerHTML = '<div class="px-3 py-4 text-sm text-ink-500">Tidak ada hasil untuk "<strong>' + utils.escapeHtml(q) + '</strong>"</div>';
          }
          return;
        }
        searchResults.innerHTML = data.slice(0, 8).map(function (n) {
          return '<button data-nakes-id="' + n.id + '" class="w-full text-left px-3 py-2.5 rounded-lg hover:bg-teal-50 text-sm flex items-center gap-3">'
               + '<div class="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">' + utils.escapeHtml((n.nama || '?')[0]) + '</div>'
               + '<div class="flex-1 min-w-0"><p class="font-semibold text-ink-800 truncate">' + utils.escapeHtml(n.nama) + '</p>'
               + '<p class="text-xs text-ink-500 truncate">' + utils.escapeHtml(n.profesi || '-') + ' • NIK: ' + utils.escapeHtml(n.nik || '-') + '</p></div></button>';
        }).join('');
        searchResults.querySelectorAll('[data-nakes-id]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            window.SIMANTRI.navigateTo('data-nakes');
            searchDropdown.classList.add('hidden');
            searchInput.value = '';
            document.dispatchEvent(new CustomEvent('simantri:open-nakes', { detail: { id: btn.dataset.nakesId } }));
          });
        });
      } catch (err) {
        console.error(err);
        searchResults.innerHTML = '<div class="px-3 py-4 text-sm text-rose-600">Gagal mencari: ' + utils.escapeHtml(err.message) + '</div>';
      }
    }
  }

  // === STAT CARD ===
  function renderStatCard(container, opts) {
    opts = opts || {};
    const iconPath = ICONS[opts.icon] || ICONS.users;
    const variantClass = ({
      teal: 'bg-teal-50 text-teal-600',
      lime: 'bg-lime-50 text-lime-600',
      amber: 'bg-amber-50 text-amber-600',
      rose: 'bg-rose-50 text-rose-600',
      ink: 'bg-ink-100 text-ink-700',
    })[opts.variant || 'teal'] || 'bg-teal-50 text-teal-600';

    let trendHtml = '';
    if (opts.trend) {
      const dir = opts.trend.direction === 'up';
      trendHtml = '<div class="mt-3 flex items-center gap-1.5 text-xs">'
        + '<span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ' + (dir ? 'bg-teal-50 text-teal-700' : 'bg-rose-50 text-rose-700') + ' font-semibold">'
        + '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="' + (dir ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3') + '"/></svg>'
        + utils.escapeHtml(opts.trend.value)
        + '</span><span class="text-ink-500">' + utils.escapeHtml(opts.trend.label || 'vs periode lalu') + '</span></div>';
    }

    container.innerHTML = `
      <div class="card card-hover p-5 h-full">
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-ink-500 uppercase tracking-wider">${utils.escapeHtml(opts.label || 'Stat')}</p>
            <p class="mt-2 text-3xl font-extrabold text-ink-900 tabular-nums">${utils.escapeHtml(opts.value || '0')}</p>
            ${opts.sub ? '<p class="mt-1.5 text-xs text-ink-500">' + utils.escapeHtml(opts.sub) + '</p>' : ''}
          </div>
          <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${variantClass}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="${iconPath}"/></svg>
          </div>
        </div>
        ${trendHtml}
      </div>
    `;
  }

  // === SIDEBAR ACTIVE STATE ===
  function setActiveRoute(routeId) {
    document.querySelectorAll('[data-route]').forEach(function (el) {
      el.classList.toggle('active', el.dataset.route === routeId);
    });
  }

  // === EXPOSE ===
  window.SIMANTRI_COMPONENTS = {
    ICONS: ICONS,
    ROUTES: ROUTES,
    GROUP_LABELS: GROUP_LABELS,
    iconSvg: iconSvg,
    renderSidebar: renderSidebar,
    renderHeader: renderHeader,
    renderStatCard: renderStatCard,
    setActiveRoute: setActiveRoute,
  };
})();
