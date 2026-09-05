// SIMANTRI — header behavior
import { toast } from '../../assets/js/utils.js';

export function initHeader({ navigateTo, getProfile, signOut }) {
  const profile = getProfile();
  const nameEl = document.getElementById('header-user-name');
  const roleEl = document.getElementById('header-user-role');
  const avatarEl = document.getElementById('header-avatar');

  if (profile) {
    if (nameEl) nameEl.textContent = profile.full_name ?? 'Pengguna';
    if (roleEl) {
      const roleText = ({ dinkes: 'Admin Dinkes', fasyankes: 'Admin Fasyankes', nakes: 'Tenaga Kesehatan' })[profile.role] ?? profile.role;
      roleEl.textContent = roleText;
    }
    if (avatarEl) {
      const initials = (profile.full_name ?? profile.email ?? '?').trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? '').join('');
      avatarEl.textContent = initials;
    }
  }

  // Mobile menu
  const menuBtn = document.getElementById('header-menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      const drawer = document.getElementById('sidebar-drawer');
      const content = document.getElementById('sidebar-drawer-content');
      if (!drawer || !content) return;
      // Clone sidebar
      const sidebarSlot = document.getElementById('sidebar-slot');
      if (sidebarSlot) content.innerHTML = sidebarSlot.innerHTML;
      drawer.classList.toggle('hidden');
    });
  }

  // Drawer close
  document.querySelectorAll('[data-drawer-close]').forEach((el) => {
    el.addEventListener('click', () => {
      document.getElementById('sidebar-drawer')?.classList.add('hidden');
    });
  });

  // Bell → notifikasi page
  const bell = document.getElementById('header-bell');
  if (bell) {
    bell.addEventListener('click', () => navigateTo('notifikasi-expired'));
  }

  // Search dropdown
  const searchInput = document.getElementById('header-search');
  const searchDropdown = document.getElementById('search-dropdown');
  const searchResults = document.getElementById('search-results');

  if (searchInput) {
    let debounceT;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceT);
      const q = e.target.value.trim();
      if (q.length < 2) {
        searchDropdown?.classList.add('hidden');
        return;
      }
      debounceT = setTimeout(() => doSearch(q), 200);
    });

    // Cmd+K / Ctrl+K
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
      if (e.key === 'Escape') {
        searchDropdown?.classList.add('hidden');
        searchInput.blur();
      }
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchDropdown?.contains(e.target)) {
        searchDropdown?.classList.add('hidden');
      }
    });
  }

  async function doSearch(q) {
    if (!searchResults || !searchDropdown) return;
    searchResults.innerHTML = `<div class="px-3 py-4 text-sm text-ink-500">Mencari "<strong>${escape(q)}</strong>"...</div>`;
    searchDropdown.classList.remove('hidden');

    try {
      const { supabase, isDemoMode } = await import('../../assets/js/supabase.js');
      if (isDemoMode) {
        // Demo: tampilkan quick-link routes
        const routes = ['dashboard', 'data-nakes', 'data-fasyankes', 'verifikasi', 'notifikasi-expired'];
        const matches = routes.filter((r) => r.toLowerCase().includes(q.toLowerCase()));
        searchResults.innerHTML = matches.length
          ? matches.map((r) => `<button data-quick-route="${r}" class="w-full text-left px-3 py-2.5 rounded-lg hover:bg-teal-50 text-sm flex items-center gap-2"><svg class="w-4 h-4 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>Buka <strong class="capitalize">${escape(r.replace(/-/g, ' '))}</strong></button>`).join('')
          : `<div class="px-3 py-4 text-sm text-ink-500">Tidak ada hasil</div>`;
        searchResults.querySelectorAll('[data-quick-route]').forEach((btn) => {
          btn.addEventListener('click', () => {
            navigateTo(btn.dataset.quickRoute);
            searchDropdown.classList.add('hidden');
            searchInput.value = '';
          });
        });
        return;
      }

      const { data, error } = await supabase
        .from('tenaga_kesehatan')
        .select('id, nama, nik, profesi, no_str')
        .or(`nama.ilike.%${q}%,nik.ilike.%${q}%,no_str.ilike.%${q}%`)
        .limit(8);

      if (error) throw error;

      if (!data?.length) {
        searchResults.innerHTML = `<div class="px-3 py-4 text-sm text-ink-500">Tidak ada hasil untuk "<strong>${escape(q)}</strong>"</div>`;
        return;
      }

      searchResults.innerHTML = data.map((n) => `
        <button data-nakes-id="${n.id}" class="w-full text-left px-3 py-2.5 rounded-lg hover:bg-teal-50 text-sm flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">${escape((n.nama ?? '?')[0])}</div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-ink-800 truncate">${escape(n.nama)}</p>
            <p class="text-xs text-ink-500 truncate">${escape(n.profesi ?? '-')} • NIK: ${escape(n.nik ?? '-')}</p>
          </div>
        </button>
      `).join('');

      searchResults.querySelectorAll('[data-nakes-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
          navigateTo('data-nakes');
          searchDropdown.classList.add('hidden');
          searchInput.value = '';
          // Pass ID via global event
          document.dispatchEvent(new CustomEvent('simantri:open-nakes', { detail: { id: btn.dataset.nakesId } }));
        });
      });
    } catch (err) {
      console.error(err);
      searchResults.innerHTML = `<div class="px-3 py-4 text-sm text-rose-600">Gagal mencari: ${escape(err.message)}</div>`;
    }
  }
}

function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
