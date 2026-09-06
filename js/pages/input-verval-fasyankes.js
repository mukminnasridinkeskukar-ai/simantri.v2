/* ============================================================================
 * SIMANTRI v3 — Page: Input Verval Fasyankes (Admin only — add/edit/delete)
 * Schema v1.1 — verval_fasyankes. Card grid view.
 * ============================================================================ */

(function () {
  'use strict';

  window.SIMANTRI_PAGES = window.SIMANTRI_PAGES || {};

  const JENIS_FASYANKES_OPTS = ['Rumah Sakit', 'Puskesmas', 'Klinik', 'Apotik', 'Toko Obat', 'Optik', 'PBF', 'Tempat Praktik Mandiri'];
  const STATUS_VERIF_OPTS = ['Layak', 'Tidak Layak', 'Perbaikan', 'Pending', 'Tidak Valid'];

  function optionsHtml(opts, selected) {
    return opts.map(function (o) {
      return '<option value="' + window.SIMANTRI_UTILS.escapeHtml(o) + '"' + (selected === o ? ' selected' : '') + '>' + window.SIMANTRI_UTILS.escapeHtml(o) + '</option>';
    }).join('');
  }

  function verifBadgeClass(s) {
    switch (s) {
      case 'Layak': return 'badge-teal';
      case 'Tidak Layak': return 'badge-rose';
      case 'Tidak Valid': return 'badge-rose';
      case 'Perbaikan': return 'badge-amber';
      case 'Pending': return 'badge-amber';
      default: return 'badge-ink';
    }
  }

  function jenisBadgeClass(s) {
    switch (s) {
      case 'Rumah Sakit': return 'badge-teal';
      case 'Puskesmas': return 'badge-lime';
      case 'Klinik': return 'badge-amber';
      case 'Apotik': case 'Toko Obat': return 'badge-ink';
      case 'Optik': return 'badge-ink';
      case 'PBF': return 'badge-ink';
      case 'Tempat Praktik Mandiri': return 'badge-amber';
      default: return 'badge-ink';
    }
  }

  window.SIMANTRI_PAGES['input-verval-fasyankes'] = {
    html: function () {
      return ''
        + '<div class="space-y-6">'
        +   '<div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">'
        +     '<div>'
        +       '<h2 class="text-2xl font-extrabold text-ink-900 tracking-tight">Input Verval Fasyankes</h2>'
        +       '<p class="mt-1 text-sm text-ink-500 max-w-2xl">Verifikasi &amp; validasi fasilitas pelayanan kesehatan (fasyankes).</p>'
        +     '</div>'
        +     '<button class="btn btn-primary btn-sm" data-action="add" type="button" data-role-action="add">'
        +       '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>'
        +       'Tambah Verval Fasyankes'
        +     '</button>'
        +   '</div>'

        // Filter
        +   '<div class="card p-4">'
        +     '<div class="grid grid-cols-1 md:grid-cols-3 gap-3">'
        +       '<div class="md:col-span-3">'
        +         '<label class="label" for="ivf-search">Pencarian</label>'
        +         '<div class="relative">'
        +           '<svg class="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>'
        +           '<input type="search" id="ivf-search" class="input" style="padding-left:2.25rem;" placeholder="Cari nama fasyankes / nomor unit / kecamatan..." />'
        +         '</div>'
        +       '</div>'
        +       '<div>'
        +         '<label class="label" for="ivf-jenis">Jenis Fasyankes</label>'
        +         '<select id="ivf-jenis" class="select"><option value="">Semua</option>' + optionsHtml(JENIS_FASYANKES_OPTS) + '</select>'
        +       '</div>'
        +       '<div>'
        +         '<label class="label" for="ivf-status">Status Verifikasi</label>'
        +         '<select id="ivf-status" class="select"><option value="">Semua</option>' + optionsHtml(STATUS_VERIF_OPTS) + '</select>'
        +       '</div>'
        +     '</div>'
        +   '</div>'

        // Card grid
        +   '<div id="ivf-grid" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">'
        +     '<div class="skeleton h-56"></div>'
        +     '<div class="skeleton h-56"></div>'
        +     '<div class="skeleton h-56"></div>'
        +   '</div>'
        + '</div>';
    },

    init: async function () {
      const utils = window.SIMANTRI_UTILS;
      const data = window.SIMANTRI_DATA;
      const auth = window.SIMANTRI_AUTH;

      let _filters = { search: '', jenis_fasyankes: '', status_verifikasi: '' };

      const addBtn = document.querySelector('[data-action="add"]');
      if (addBtn) addBtn.addEventListener('click', function () { openFormModal(null); });

      const searchInput = document.getElementById('ivf-search');
      if (searchInput) {
        searchInput.addEventListener('input', utils.debounce(function (e) {
          _filters.search = e.target.value.trim();
          render();
        }, 300));
      }
      const jenisSel = document.getElementById('ivf-jenis');
      if (jenisSel) jenisSel.addEventListener('change', function (e) { _filters.jenis_fasyankes = e.target.value; render(); });
      const statusSel = document.getElementById('ivf-status');
      if (statusSel) statusSel.addEventListener('change', function (e) { _filters.status_verifikasi = e.target.value; render(); });

      async function render() {
        const grid = document.getElementById('ivf-grid');
        if (!grid) return;
        try {
          const list = await data.loadVervalFasyankes(_filters);
          if (!list.length) {
            grid.innerHTML = emptyState('Belum ada data verval fasyankes. Klik "Tambah Verval Fasyankes" untuk menambahkan.', 'hospital');
            return;
          }
          grid.innerHTML = list.map(function (v) {
            const verifBadge = verifBadgeClass(v.status_verifikasi);
            const jenisBadge = jenisBadgeClass(v.jenis_fasyankes);
            return '<article class="card card-hover p-5 flex flex-col">'
                 +   '<div class="flex items-start justify-between gap-2">'
                 +     '<div class="min-w-0 flex-1">'
                 +       '<p class="text-xs font-mono text-ink-400">' + utils.escapeHtml(v.nomor_unit || '-') + '</p>'
                 +       '<h3 class="mt-1 text-base font-bold text-ink-900 leading-tight">' + utils.escapeHtml(v.nama_fasyankes || '-') + '</h3>'
                 +     '</div>'
                 +     '<span class="badge ' + jenisBadge + ' flex-shrink-0">' + utils.escapeHtml(v.jenis_fasyankes || '-') + '</span>'
                 +   '</div>'
                 +   '<div class="mt-3 space-y-1.5 text-xs text-ink-600 flex-1">'
                 +     '<p><span class="text-ink-400 font-semibold uppercase tracking-wide">Pemilik:</span> ' + utils.escapeHtml(v.nama_pemilik || '-') + '</p>'
                 +     '<p><span class="text-ink-400 font-semibold uppercase tracking-wide">Penanggung Jawab:</span> ' + utils.escapeHtml(v.penanggung_jawab || '-') + '</p>'
                 +     '<p><span class="text-ink-400 font-semibold uppercase tracking-wide">Alamat:</span> ' + utils.escapeHtml(v.alamat_lengkap || '-') + '</p>'
                 +     '<p><span class="text-ink-400 font-semibold uppercase tracking-wide">SDM:</span> ' + utils.escapeHtml(v.sdm_kesehatan || '-') + '</p>'
                 +   '</div>'
                 +   '<div class="mt-3 pt-3 border-t border-ink-100 flex items-center justify-between gap-2">'
                 +     '<div class="flex items-center gap-2">'
                 +       '<span class="badge ' + verifBadge + '">' + utils.escapeHtml(v.status_verifikasi || '-') + '</span>'
                 +       '<span class="text-xs text-ink-400">Oleh: ' + utils.escapeHtml(v.verifikator || '-') + '</span>'
                 +     '</div>'
                 +     '<div class="flex items-center gap-1">'
                 +       '<button class="btn btn-ghost btn-sm" data-action="edit" data-id="' + utils.escapeHtml(v.id) + '" data-role-action="edit" title="Edit">'
                 +         '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>'
                 +       '</button>'
                 +       '<button class="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-50" data-action="delete" data-id="' + utils.escapeHtml(v.id) + '" data-nama="' + utils.escapeHtml(v.nama_fasyankes) + '" data-role-action="delete" title="Hapus">'
                 +         '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>'
                 +       '</button>'
                 +     '</div>'
                 +   '</div>'
                 + '</article>';
          }).join('');

          grid.querySelectorAll('[data-action="edit"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              const id = btn.getAttribute('data-id');
              const item = list.find(function (x) { return x.id === id; });
              if (item) openFormModal(item);
            });
          });
          grid.querySelectorAll('[data-action="delete"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              const id = btn.getAttribute('data-id');
              const nama = btn.getAttribute('data-nama');
              handleDelete(id, nama);
            });
          });
        } catch (err) {
          utils.toast('Gagal memuat verval fasyankes: ' + err.message, 'error');
          console.error('[input-verval-fasyankes] render error:', err);
          grid.innerHTML = emptyState('Gagal memuat data. Coba refresh halaman.', 'alert');
        }
      }

      function emptyState(message, icon) {
        const iconPath = (window.SIMANTRI_COMPONENTS.ICONS[icon] || window.SIMANTRI_COMPONENTS.ICONS['hospital']);
        return '<div class="col-span-full card p-10 text-center">'
             + '<div class="w-14 h-14 mx-auto rounded-xl bg-ink-100 text-ink-400 flex items-center justify-center mb-3">'
             + '<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="' + iconPath + '"/></svg>'
             + '</div>'
             + '<p class="text-sm text-ink-500 max-w-md mx-auto">' + utils.escapeHtml(message) + '</p>'
             + '</div>';
      }

      // === Form Modal ===
      function openFormModal(existing) {
        const isEdit = !!existing;
        const v = isEdit ? existing : {
          nomor_unit: '', nama_fasyankes: '', jenis_fasyankes: 'Rumah Sakit', nama_pemilik: '', penanggung_jawab: '',
          alamat_lengkap: '', kelurahan: '', kecamatan: '', nomor_hp: '', email: '', sdm_kesehatan: '',
          status_verifikasi: 'Pending', catatan_verifikasi: '', verifikator: '',
        };

        const portal = document.getElementById('modal-portal');
        if (!portal) return;
        portal.innerHTML = ''
          + '<div class="fixed inset-0 z-[80] flex items-center justify-center p-4" data-modal-root>'
          +   '<div class="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" data-modal-close></div>'
          +   '<div class="card relative w-full max-w-2xl max-h-[92vh] overflow-y-auto" data-modal-content>'
          +     '<div class="p-5 border-b border-ink-100 flex items-center justify-between sticky top-0 bg-white z-10">'
          +       '<div>'
          +         '<h3 class="text-base font-bold text-ink-900">' + (isEdit ? 'Edit Verval Fasyankes' : 'Tambah Verval Fasyankes') + '</h3>'
          +         '<p class="text-xs text-ink-500 mt-0.5">' + (isEdit ? 'Perbarui data verifikasi' : 'Formulir verifikasi fasyankes baru') + '</p>'
          +       '</div>'
          +       '<button type="button" class="btn btn-ghost btn-sm" data-modal-close aria-label="Tutup">'
          +         '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>'
          +       '</button>'
          +     '</div>'
          +     '<form id="ivf-form" class="p-5 space-y-4">'
          +       '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">'
          +         '<div>'
          +           '<label class="label" for="ivf-nomor-unit">Nomor Unit <span class="text-rose-600">*</span></label>'
          +           '<input type="text" id="ivf-nomor-unit" class="input font-mono" required maxlength="50" value="' + utils.escapeHtml(v.nomor_unit || '') + '" placeholder="UNIT-001" />'
          +         '</div>'
          +         '<div>'
          +           '<label class="label" for="ivf-nama-fasyankes">Nama Fasyankes <span class="text-rose-600">*</span></label>'
          +           '<input type="text" id="ivf-nama-fasyankes" class="input" required maxlength="200" value="' + utils.escapeHtml(v.nama_fasyankes || '') + '" placeholder="RSUD / Puskesmas / Klinik" />'
          +         '</div>'
          +         '<div>'
          +           '<label class="label" for="ivf-jenis-fasyankes">Jenis Fasyankes <span class="text-rose-600">*</span></label>'
          +           '<select id="ivf-jenis-fasyankes" class="select" required>' + optionsHtml(JENIS_FASYANKES_OPTS, v.jenis_fasyankes) + '</select>'
          +         '</div>'
          +         '<div>'
          +           '<label class="label" for="ivf-nama-pemilik">Nama Pemilik</label>'
          +           '<input type="text" id="ivf-nama-pemilik" class="input" maxlength="200" value="' + utils.escapeHtml(v.nama_pemilik || '') + '" />'
          +         '</div>'
          +         '<div>'
          +           '<label class="label" for="ivf-penanggung-jawab">Penanggung Jawab</label>'
          +           '<input type="text" id="ivf-penanggung-jawab" class="input" maxlength="200" value="' + utils.escapeHtml(v.penanggung_jawab || '') + '" />'
          +         '</div>'
          +         '<div>'
          +           '<label class="label" for="ivf-nomor-hp">Nomor HP</label>'
          +           '<input type="text" id="ivf-nomor-hp" class="input font-mono" maxlength="30" value="' + utils.escapeHtml(v.nomor_hp || '') + '" placeholder="08xxxxxxxxxx" />'
          +         '</div>'
          +         '<div>'
          +           '<label class="label" for="ivf-email">Email</label>'
          +           '<input type="email" id="ivf-email" class="input" maxlength="200" value="' + utils.escapeHtml(v.email || '') + '" placeholder="email@fasyankes.go.id" />'
          +         '</div>'
          +         '<div>'
          +           '<label class="label" for="ivf-kelurahan">Kelurahan/Desa</label>'
          +           '<input type="text" id="ivf-kelurahan" class="input" maxlength="200" value="' + utils.escapeHtml(v.kelurahan || '') + '" />'
          +         '</div>'
          +         '<div>'
          +           '<label class="label" for="ivf-kecamatan">Kecamatan</label>'
          +           '<input type="text" id="ivf-kecamatan" class="input" maxlength="200" value="' + utils.escapeHtml(v.kecamatan || '') + '" />'
          +         '</div>'
          +         '<div class="sm:col-span-2">'
          +           '<label class="label" for="ivf-alamat-lengkap">Alamat Lengkap</label>'
          +           '<textarea id="ivf-alamat-lengkap" class="textarea" rows="2">' + utils.escapeHtml(v.alamat_lengkap || '') + '</textarea>'
          +         '</div>'
          +         '<div class="sm:col-span-2">'
          +           '<label class="label" for="ivf-sdm">SDM Kesehatan <span class="text-ink-400 font-normal">(pisahkan dengan titik koma ";")</span></label>'
          +           '<input type="text" id="ivf-sdm" class="input" maxlength="500" value="' + utils.escapeHtml(v.sdm_kesehatan || '') + '" placeholder="Dokter Umum; Perawat; Bidan" />'
          +         '</div>'
          +         '<div>'
          +           '<label class="label" for="ivf-status-verifikasi">Status Verifikasi</label>'
          +           '<select id="ivf-status-verifikasi" class="select">' + optionsHtml(STATUS_VERIF_OPTS, v.status_verifikasi) + '</select>'
          +         '</div>'
          +         '<div>'
          +           '<label class="label" for="ivf-verifikator">Verifikator</label>'
          +           '<input type="text" id="ivf-verifikator" class="input" maxlength="100" value="' + utils.escapeHtml(v.verifikator || '') + '" placeholder="Nama verifikator" />'
          +         '</div>'
          +         '<div class="sm:col-span-2">'
          +           '<label class="label" for="ivf-catatan-verifikasi">Catatan Verifikasi</label>'
          +           '<textarea id="ivf-catatan-verifikasi" class="textarea" rows="3" placeholder="Catatan dari verifikator...">' + utils.escapeHtml(v.catatan_verifikasi || '') + '</textarea>'
          +         '</div>'
          +       '</div>'
          +       '<div class="flex items-center justify-end gap-2 pt-3 border-t border-ink-100">'
          +         '<button type="button" class="btn btn-outline btn-sm" data-modal-close>Batal</button>'
          +         '<button type="submit" class="btn btn-primary btn-sm" id="ivf-submit">'
          +           '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>'
          +           (isEdit ? 'Simpan Perubahan' : 'Tambah Verval')
          +         '</button>'
          +       '</div>'
          +     '</form>'
          +   '</div>'
          + '</div>';

        portal.querySelectorAll('[data-modal-close]').forEach(function (el) {
          el.addEventListener('click', closeModal);
        });

        const form = document.getElementById('ivf-form');
        if (form) {
          form.addEventListener('submit', async function (e) {
            e.preventDefault();
            await handleSubmit(isEdit, existing);
          });
        }

        document.addEventListener('keydown', onEscKey);
        setTimeout(function () {
          const focusTarget = isEdit ? document.getElementById('ivf-nama-fasyankes') : document.getElementById('ivf-nomor-unit');
          if (focusTarget) focusTarget.focus();
        }, 80);
      }

      function onEscKey(e) {
        if (e.key === 'Escape') closeModal();
      }

      function closeModal() {
        const portal = document.getElementById('modal-portal');
        if (portal) portal.innerHTML = '';
        document.removeEventListener('keydown', onEscKey);
      }

      function getVal(id) {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
      }

      async function handleSubmit(isEdit, existing) {
        const nomor_unit = getVal('ivf-nomor-unit');
        const nama_fasyankes = getVal('ivf-nama-fasyankes');
        const jenis_fasyankes = getVal('ivf-jenis-fasyankes');
        if (!nomor_unit) { utils.toast('Nomor unit wajib diisi', 'warning'); return; }
        if (!nama_fasyankes) { utils.toast('Nama fasyankes wajib diisi', 'warning'); return; }
        if (!jenis_fasyankes) { utils.toast('Jenis fasyankes wajib dipilih', 'warning'); return; }

        const email = getVal('ivf-email');
        if (email && !utils.isEmail(email)) {
          utils.toast('Format email tidak valid', 'warning');
          return;
        }

        const profile = auth.getProfile() || {};
        const payload = {
          nomor_unit: nomor_unit,
          nama_fasyankes: nama_fasyankes,
          jenis_fasyankes: jenis_fasyankes,
          nama_pemilik: getVal('ivf-nama-pemilik'),
          penanggung_jawab: getVal('ivf-penanggung-jawab'),
          alamat_lengkap: getVal('ivf-alamat-lengkap'),
          kelurahan: getVal('ivf-kelurahan'),
          kecamatan: getVal('ivf-kecamatan'),
          nomor_hp: getVal('ivf-nomor-hp'),
          email: email,
          sdm_kesehatan: getVal('ivf-sdm'),
          status_verifikasi: getVal('ivf-status-verifikasi'),
          catatan_verifikasi: getVal('ivf-catatan-verifikasi'),
          verifikator: getVal('ivf-verifikator') || (profile.username || ''),
        };

        const submitBtn = document.getElementById('ivf-submit');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9"/></svg> Menyimpan...';
        }

        try {
          if (isEdit) {
            await data.updateVervalFasyankes(existing.id, payload);
            await data.addLog({ username: profile.username || 'admin', aksi: 'UPDATE_VERVAL_FASYANKES', detail: 'Update verval fasyankes: ' + nama_fasyankes + ' (' + nomor_unit + ')', ip_address: '127.0.0.1' });
            utils.toast('Verval fasyankes diperbarui', 'success');
          } else {
            await data.addVervalFasyankes(payload);
            await data.addLog({ username: profile.username || 'admin', aksi: 'ADD_VERVAL_FASYANKES', detail: 'Tambah verval fasyankes: ' + nama_fasyankes + ' (' + nomor_unit + ')', ip_address: '127.0.0.1' });
            utils.toast('Verval fasyankes ditambahkan', 'success');
          }
          closeModal();
          await render();
        } catch (err) {
          utils.toast('Gagal menyimpan: ' + err.message, 'error');
          console.error('[input-verval-fasyankes] submit error:', err);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' + (isEdit ? 'Simpan Perubahan' : 'Tambah Verval');
          }
        }
      }

      async function handleDelete(id, nama) {
        if (!confirm('Hapus verval fasyankes "' + nama + '"? Tindakan ini tidak dapat dibatalkan.')) return;
        try {
          await data.deleteVervalFasyankes(id);
          const profile = auth.getProfile() || {};
          await data.addLog({ username: profile.username || 'admin', aksi: 'DELETE_VERVAL_FASYANKES', detail: 'Hapus verval fasyankes: ' + nama + ' (ID ' + id + ')', ip_address: '127.0.0.1' });
          utils.toast('Verval fasyankes dihapus', 'success');
          await render();
        } catch (err) {
          utils.toast('Gagal menghapus: ' + err.message, 'error');
          console.error('[input-verval-fasyankes] delete error:', err);
        }
      }

      await render();
    },
  };
})();
