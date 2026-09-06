/* ============================================================================
 * SIMANTRI v3 — Page: Input Profil SDMK (Admin only — add/edit/delete)
 * Schema v1.1 — profil_sdmk keyed by NIK (16 digit numeric).
 * ============================================================================ */

(function () {
  'use strict';

  window.SIMANTRI_PAGES = window.SIMANTRI_PAGES || {};

  const JENIS_TENAGA_OPTS = ['Dokter', 'Dokter Gigi', 'Dokter Spesialis', 'Perawat', 'Bidan', 'Apoteker', 'Asisten Apoteker', 'Ahli Gizi', 'Sanitarian', 'Analis Kesehatan', 'Elektromedis', 'Tenaga Kefarmasian'];
  const STATUS_PEGAWAI_OPTS = ['PNS', 'PPNPN', 'Swasta'];
  const STATUS_STR_OPTS = ['Aktif', 'Expired'];

  function optionsHtml(opts) {
    return opts.map(function (o) { return '<option value="' + window.SIMANTRI_UTILS.escapeHtml(o) + '">' + window.SIMANTRI_UTILS.escapeHtml(o) + '</option>'; }).join('');
  }

  window.SIMANTRI_PAGES['input-profil-sdmk'] = {
    html: function () {
      return ''
        + '<div class="space-y-6">'
        +   '<div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">'
        +     '<div>'
        +       '<h2 class="text-2xl font-extrabold text-ink-900 tracking-tight">Input Profil SDMK</h2>'
        +       '<p class="mt-1 text-sm text-ink-500 max-w-2xl">Daftar profil Sumber Daya Manusia Kesehatan terdaftar di wilayah kerja Dinkes Kukar.</p>'
        +     '</div>'
        +     '<button class="btn btn-primary btn-sm" data-action="add" type="button" data-role-action="add">'
        +       '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>'
        +       'Tambah Profil'
        +     '</button>'
        +   '</div>'

        // Filter
        +   '<div class="card p-4">'
        +     '<div class="grid grid-cols-1 md:grid-cols-3 gap-3">'
        +       '<div class="md:col-span-3">'
        +         '<label class="label" for="ips-search">Pencarian</label>'
        +         '<div class="relative">'
        +           '<svg class="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>'
        +           '<input type="search" id="ips-search" class="input" style="padding-left:2.25rem;" placeholder="Cari nama / NIK / unit kerja..." />'
        +         '</div>'
        +       '</div>'
        +       '<div>'
        +         '<label class="label" for="ips-jenis">Jenis Tenaga</label>'
        +         '<select id="ips-jenis" class="select"><option value="">Semua</option>' + optionsHtml(JENIS_TENAGA_OPTS) + '</select>'
        +       '</div>'
        +       '<div>'
        +         '<label class="label" for="ips-status-str">Status STR</label>'
        +         '<select id="ips-status-str" class="select"><option value="">Semua</option>' + optionsHtml(STATUS_STR_OPTS) + '</select>'
        +       '</div>'
        +     '</div>'
        +   '</div>'

        // Table
        +   '<div class="card overflow-hidden">'
        +     '<div class="overflow-x-auto">'
        +       '<table class="data-table table-sticky">'
        +         '<thead>'
        +           '<tr>'
        +             '<th>No</th>'
        +             '<th>NIK</th>'
        +             '<th>Nama Lengkap</th>'
        +             '<th>Jenis Kelamin</th>'
        +             '<th>Jenis Tenaga</th>'
        +             '<th>Nama Unit</th>'
        +             '<th>Status Pegawai</th>'
        +             '<th>No. STR</th>'
        +             '<th>Status STR</th>'
        +             '<th>No. SIP</th>'
        +             '<th>Tgl Berakhir SIP</th>'
        +             '<th class="text-right">Aksi</th>'
        +           '</tr>'
        +         '</thead>'
        +         '<tbody id="ips-tbody">'
        +           '<tr><td colspan="12" class="text-center text-ink-500 py-8"><div class="skeleton h-8"></div></td></tr>'
        +         '</tbody>'
        +       '</table>'
        +     '</div>'
        +   '</div>'
        + '</div>';
    },

    init: async function () {
      const utils = window.SIMANTRI_UTILS;
      const data = window.SIMANTRI_DATA;
      const auth = window.SIMANTRI_AUTH;

      let _filters = { search: '', jenis_tenaga: '', status_str: '' };

      const addBtn = document.querySelector('[data-action="add"]');
      if (addBtn) {
        addBtn.addEventListener('click', function () { openFormModal(null); });
      }

      const searchInput = document.getElementById('ips-search');
      if (searchInput) {
        searchInput.addEventListener('input', utils.debounce(function (e) {
          _filters.search = e.target.value.trim();
          render();
        }, 300));
      }

      const jenisSel = document.getElementById('ips-jenis');
      if (jenisSel) jenisSel.addEventListener('change', function (e) { _filters.jenis_tenaga = e.target.value; render(); });

      const statusSel = document.getElementById('ips-status-str');
      if (statusSel) statusSel.addEventListener('change', function (e) { _filters.status_str = e.target.value; render(); });

      async function render() {
        const tbody = document.getElementById('ips-tbody');
        if (!tbody) return;
        try {
          const list = await data.loadProfilSdmk(_filters);
          if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="12">' + emptyStateRow('Belum ada profil SDMK. Klik "Tambah Profil" untuk menambahkan.') + '</td></tr>';
            return;
          }
          tbody.innerHTML = list.map(function (p) {
            const strBadge = p.status_str === 'Aktif' ? 'badge-teal' : 'badge-rose';
            return '<tr>'
                 +   '<td class="text-ink-500 tabular-nums">' + utils.escapeHtml(p.no || '-') + '</td>'
                 +   '<td class="font-mono text-xs">' + utils.escapeHtml(p.nik || '-') + '</td>'
                 +   '<td class="font-semibold text-ink-900 whitespace-nowrap">' + utils.escapeHtml(p.nama_lengkap || '-') + '</td>'
                 +   '<td class="whitespace-nowrap">' + utils.escapeHtml(p.jenis_kelamin || '-') + '</td>'
                 +   '<td class="whitespace-nowrap">' + utils.escapeHtml(p.jenis_tenaga || '-') + '</td>'
                 +   '<td class="whitespace-nowrap">' + utils.escapeHtml(p.nama_unit || '-') + '</td>'
                 +   '<td class="whitespace-nowrap">' + utils.escapeHtml(p.status_pegawai || '-') + '</td>'
                 +   '<td class="font-mono text-xs">' + utils.escapeHtml(p.nomor_str || '-') + '</td>'
                 +   '<td><span class="badge ' + strBadge + '">' + utils.escapeHtml(p.status_str || '-') + '</span></td>'
                 +   '<td class="font-mono text-xs">' + utils.escapeHtml(p.nomor_sip || '-') + '</td>'
                 +   '<td class="whitespace-nowrap">' + utils.fmtDate(p.tgl_berakhir_sip) + '</td>'
                 +   '<td class="text-right whitespace-nowrap">'
                 +     '<button class="btn btn-ghost btn-sm" data-action="edit" data-nik="' + utils.escapeHtml(p.nik) + '" data-role-action="edit" title="Edit">'
                 +       '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>'
                 +       'Edit'
                 +     '</button>'
                 +     '<button class="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-50" data-action="delete" data-nik="' + utils.escapeHtml(p.nik) + '" data-nama="' + utils.escapeHtml(p.nama_lengkap) + '" data-role-action="delete" title="Hapus">'
                 +       '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>'
                 +       'Hapus'
                 +     '</button>'
                 +   '</td>'
                 + '</tr>';
          }).join('');

          tbody.querySelectorAll('[data-action="edit"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              const nik = btn.getAttribute('data-nik');
              const item = list.find(function (x) { return x.nik === nik; });
              if (item) openFormModal(item);
            });
          });
          tbody.querySelectorAll('[data-action="delete"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              const nik = btn.getAttribute('data-nik');
              const nama = btn.getAttribute('data-nama');
              handleDelete(nik, nama);
            });
          });
        } catch (err) {
          utils.toast('Gagal memuat profil SDMK: ' + err.message, 'error');
          console.error('[input-profil-sdmk] render error:', err);
          tbody.innerHTML = '<tr><td colspan="12">' + emptyStateRow('Gagal memuat data.') + '</td></tr>';
        }
      }

      function emptyStateRow(message) {
        return '<div class="text-center py-8 text-sm text-ink-500">' + utils.escapeHtml(message) + '</div>';
      }

      // === Form Modal ===
      function openFormModal(existing) {
        const isEdit = !!existing;
        const p = isEdit ? existing : {
          nik: '', nama_lengkap: '', jenis_kelamin: 'Laki-laki', jenis_tenaga: 'Dokter', kode_unit: '',
          nama_unit: '', status_pegawai: 'PNS', nomor_str: '', status_str: 'Aktif', nomor_sip: '',
          tgl_terbit_sip: '', tgl_berakhir_sip: '', keterangan: '',
        };

        const portal = document.getElementById('modal-portal');
        if (!portal) return;
        portal.innerHTML = ''
          + '<div class="fixed inset-0 z-[80] flex items-center justify-center p-4" data-modal-root>'
          +   '<div class="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" data-modal-close></div>'
          +   '<div class="card relative w-full max-w-2xl max-h-[90vh] overflow-y-auto" data-modal-content>'
          +     '<div class="p-5 border-b border-ink-100 flex items-center justify-between sticky top-0 bg-white z-10">'
          +       '<div>'
          +         '<h3 class="text-base font-bold text-ink-900">' + (isEdit ? 'Edit Profil SDMK' : 'Tambah Profil SDMK') + '</h3>'
          +         '<p class="text-xs text-ink-500 mt-0.5">' + (isEdit ? 'Perbarui data SDMK' : 'Tambah SDMK baru') + '</p>'
          +       '</div>'
          +       '<button type="button" class="btn btn-ghost btn-sm" data-modal-close aria-label="Tutup">'
          +         '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>'
          +       '</button>'
          +     '</div>'
          +     '<form id="ips-form" class="p-5 space-y-4">'
          +       '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">'
          +         '<div>'
          +           '<label class="label" for="ips-nik">NIK <span class="text-rose-600">*</span></label>'
          +           '<input type="text" id="ips-nik" class="input font-mono" maxlength="16" pattern="[0-9]{16}" inputmode="numeric" required ' + (isEdit ? 'readonly' : '') + ' value="' + utils.escapeHtml(p.nik || '') + '" placeholder="16 digit angka" />'
          +           '<p class="field-error hidden" data-error="nik"></p>'
          +         '</div>'
          +         '<div>'
          +           '<label class="label" for="ips-nama">Nama Lengkap <span class="text-rose-600">*</span></label>'
          +           '<input type="text" id="ips-nama" class="input" required maxlength="200" value="' + utils.escapeHtml(p.nama_lengkap || '') + '" placeholder="Nama lengkap dengan gelar" />'
          +           '<p class="field-error hidden" data-error="nama_lengkap"></p>'
          +         '</div>'
          +         '<div>'
          +           '<label class="label" for="ips-jk">Jenis Kelamin</label>'
          +           '<select id="ips-jk" class="select">'
          +             '<option value="Laki-laki"' + (p.jenis_kelamin === 'Laki-laki' ? ' selected' : '') + '>Laki-laki</option>'
          +             '<option value="Perempuan"' + (p.jenis_kelamin === 'Perempuan' ? ' selected' : '') + '>Perempuan</option>'
          +           '</select>'
          +         '</div>'
          +         '<div>'
          +           '<label class="label" for="ips-jt">Jenis Tenaga <span class="text-rose-600">*</span></label>'
          +           '<select id="ips-jt" class="select" required>' + JENIS_TENAGA_OPTS.map(function (o) { return '<option value="' + utils.escapeHtml(o) + '"' + (p.jenis_tenaga === o ? ' selected' : '') + '>' + utils.escapeHtml(o) + '</option>'; }).join('') + '</select>'
          +         '</div>'
          +         '<div>'
          +           '<label class="label" for="ips-ku">Kode Unit</label>'
          +           '<input type="text" id="ips-ku" class="input" maxlength="50" value="' + utils.escapeHtml(p.kode_unit || '') + '" placeholder="FK-001" />'
          +         '</div>'
          +         '<div>'
          +           '<label class="label" for="ips-nu">Nama Unit</label>'
          +           '<input type="text" id="ips-nu" class="input" maxlength="200" value="' + utils.escapeHtml(p.nama_unit || '') + '" placeholder="RSUD / Puskesmas / Klinik" />'
          +         '</div>'
          +         '<div>'
          +           '<label class="label" for="ips-sp">Status Pegawai</label>'
          +           '<select id="ips-sp" class="select">' + STATUS_PEGAWAI_OPTS.map(function (o) { return '<option value="' + utils.escapeHtml(o) + '"' + (p.status_pegawai === o ? ' selected' : '') + '>' + utils.escapeHtml(o) + '</option>'; }).join('') + '</select>'
          +         '</div>'
          +         '<div>'
          +           '<label class="label" for="ips-nstr">No. STR</label>'
          +           '<input type="text" id="ips-nstr" class="input font-mono" maxlength="100" value="' + utils.escapeHtml(p.nomor_str || '') + '" placeholder="STR.12345.2024" />'
          +         '</div>'
          +         '<div>'
          +           '<label class="label" for="ips-sstr">Status STR</label>'
          +           '<select id="ips-sstr" class="select">' + STATUS_STR_OPTS.map(function (o) { return '<option value="' + utils.escapeHtml(o) + '"' + (p.status_str === o ? ' selected' : '') + '>' + utils.escapeHtml(o) + '</option>'; }).join('') + '</select>'
          +         '</div>'
          +         '<div>'
          +           '<label class="label" for="ips-nsip">No. SIP</label>'
          +           '<input type="text" id="ips-nsip" class="input font-mono" maxlength="100" value="' + utils.escapeHtml(p.nomor_sip || '') + '" placeholder="SIP/2024/001234 atau -" />'
          +         '</div>'
          +         '<div>'
          +           '<label class="label" for="ips-ttsip">Tgl Terbit SIP</label>'
          +           '<input type="date" id="ips-ttsip" class="input" value="' + utils.escapeHtml(p.tgl_terbit_sip || '') + '" />'
          +         '</div>'
          +         '<div>'
          +           '<label class="label" for="ips-tbsip">Tgl Berakhir SIP</label>'
          +           '<input type="date" id="ips-tbsip" class="input" value="' + utils.escapeHtml(p.tgl_berakhir_sip || '') + '" />'
          +         '</div>'
          +       '</div>'
          +       '<div>'
          +         '<label class="label" for="ips-ket">Keterangan</label>'
          +         '<textarea id="ips-ket" class="textarea" rows="2" placeholder="Catatan tambahan...">' + utils.escapeHtml(p.keterangan || '') + '</textarea>'
          +       '</div>'
          +       '<div class="flex items-center justify-end gap-2 pt-2 border-t border-ink-100">'
          +         '<button type="button" class="btn btn-outline btn-sm" data-modal-close>Batal</button>'
          +         '<button type="submit" class="btn btn-primary btn-sm" id="ips-submit">'
          +           '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>'
          +           (isEdit ? 'Simpan Perubahan' : 'Tambah Profil')
          +         '</button>'
          +       '</div>'
          +     '</form>'
          +   '</div>'
          + '</div>';

        portal.querySelectorAll('[data-modal-close]').forEach(function (el) {
          el.addEventListener('click', closeModal);
        });

        const form = document.getElementById('ips-form');
        if (form) {
          form.addEventListener('submit', async function (e) {
            e.preventDefault();
            await handleSubmit(isEdit, existing);
          });
        }

        // NIK numeric only
        const nikInput = document.getElementById('ips-nik');
        if (nikInput) {
          nikInput.addEventListener('input', function (e) {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 16);
          });
        }

        document.addEventListener('keydown', onEscKey);
        setTimeout(function () {
          const focusTarget = isEdit ? document.getElementById('ips-nama') : document.getElementById('ips-nik');
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

      async function handleSubmit(isEdit, existing) {
        const nik = document.getElementById('ips-nik').value.trim();
        const nama_lengkap = document.getElementById('ips-nama').value.trim();
        const jenis_kelamin = document.getElementById('ips-jk').value;
        const jenis_tenaga = document.getElementById('ips-jt').value;
        const kode_unit = document.getElementById('ips-ku').value.trim();
        const nama_unit = document.getElementById('ips-nu').value.trim();
        const status_pegawai = document.getElementById('ips-sp').value;
        const nomor_str = document.getElementById('ips-nstr').value.trim();
        const status_str = document.getElementById('ips-sstr').value;
        const nomor_sip = document.getElementById('ips-nsip').value.trim();
        const tgl_terbit_sip = document.getElementById('ips-ttsip').value.trim();
        const tgl_berakhir_sip = document.getElementById('ips-tbsip').value.trim();
        const keterangan = document.getElementById('ips-ket').value.trim();

        const errNik = document.querySelector('[data-error="nik"]');
        const errNama = document.querySelector('[data-error="nama_lengkap"]');
        if (errNik) { errNik.classList.add('hidden'); errNik.textContent = ''; }
        if (errNama) { errNama.classList.add('hidden'); errNama.textContent = ''; }

        if (!isEdit) {
          if (!/^[0-9]{16}$/.test(nik)) {
            if (errNik) { errNik.textContent = 'NIK harus 16 digit angka'; errNik.classList.remove('hidden'); }
            utils.toast('NIK harus 16 digit angka', 'warning');
            return;
          }
        }
        if (!nama_lengkap) {
          if (errNama) { errNama.textContent = 'Nama lengkap wajib diisi'; errNama.classList.remove('hidden'); }
          return;
        }
        if (!jenis_tenaga) {
          utils.toast('Jenis tenaga wajib dipilih', 'warning');
          return;
        }

        const profile = auth.getProfile() || {};
        const payload = {
          nik: nik,
          nama_lengkap: nama_lengkap,
          jenis_kelamin: jenis_kelamin,
          jenis_tenaga: jenis_tenaga,
          kode_unit: kode_unit,
          nama_unit: nama_unit,
          status_pegawai: status_pegawai,
          nomor_str: nomor_str,
          status_str: status_str,
          nomor_sip: nomor_sip || '-',
          tgl_terbit_sip: tgl_terbit_sip || null,
          tgl_berakhir_sip: tgl_berakhir_sip || null,
          keterangan: keterangan,
        };

        const submitBtn = document.getElementById('ips-submit');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9"/></svg> Menyimpan...';
        }

        try {
          if (isEdit) {
            await data.updateProfilSdmk(existing.nik, payload);
            await data.addLog({ username: profile.username || 'admin', aksi: 'UPDATE_PROFIL', detail: 'Update profil SDMK: ' + nama_lengkap + ' (NIK ' + nik + ')', ip_address: '127.0.0.1' });
            utils.toast('Profil SDMK diperbarui', 'success');
          } else {
            await data.addProfilSdmk(payload);
            await data.addLog({ username: profile.username || 'admin', aksi: 'ADD_PROFIL', detail: 'Tambah profil SDMK: ' + nama_lengkap + ' (NIK ' + nik + ')', ip_address: '127.0.0.1' });
            utils.toast('Profil SDMK ditambahkan', 'success');
          }
          closeModal();
          await render();
        } catch (err) {
          utils.toast('Gagal menyimpan: ' + err.message, 'error');
          console.error('[input-profil-sdmk] submit error:', err);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' + (isEdit ? 'Simpan Perubahan' : 'Tambah Profil');
          }
        }
      }

      async function handleDelete(nik, nama) {
        if (!confirm('Hapus profil SDMK "' + nama + '" (NIK: ' + nik + ')? Tindakan ini tidak dapat dibatalkan.')) return;
        try {
          await data.deleteProfilSdmk(nik);
          const profile = auth.getProfile() || {};
          await data.addLog({ username: profile.username || 'admin', aksi: 'DELETE_PROFIL', detail: 'Hapus profil SDMK: ' + nama + ' (NIK ' + nik + ')', ip_address: '127.0.0.1' });
          utils.toast('Profil SDMK dihapus', 'success');
          await render();
        } catch (err) {
          utils.toast('Gagal menghapus: ' + err.message, 'error');
          console.error('[input-profil-sdmk] delete error:', err);
        }
      }

      await render();
    },
  };
})();
