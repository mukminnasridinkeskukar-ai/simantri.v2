/* ============================================================================
 * SIMANTRI v3 — Page: Input Verval Izin Praktik (Admin only — add/edit/delete)
 * Schema v1.1 — verval_izin_praktik with 27+ fields across 7 sections.
 * ============================================================================ */

(function () {
  'use strict';

  window.SIMANTRI_PAGES = window.SIMANTRI_PAGES || {};

  const STATUS_VERIF_OPTS = ['Sah', 'Pending', 'Kadarluasa', 'Tidak Sah'];
  const YA_TIDAK_OPTS = ['Ada', 'Tidak Ada'];
  const SUDAH_BELUM_OPTS = ['Sudah', 'Belum'];
  const AKTIF_TIDAK_OPTS = ['Aktif', 'Tidak Ada', 'Expired'];
  const JENIS_TENAGA_OPTS = ['Dokter', 'Dokter Gigi', 'Dokter Spesialis', 'Perawat', 'Bidan', 'Apoteker', 'Ahli Gizi', 'Sanitarian', 'Analis Kesehatan', 'Elektromedis'];

  function optionsHtml(opts, selected) {
    return opts.map(function (o) {
      return '<option value="' + window.SIMANTRI_UTILS.escapeHtml(o) + '"' + (selected === o ? ' selected' : '') + '>' + window.SIMANTRI_UTILS.escapeHtml(o) + '</option>';
    }).join('');
  }

  function verifBadgeClass(s) {
    switch (s) {
      case 'Sah': return 'badge-teal';
      case 'Pending': return 'badge-amber';
      case 'Kadarluasa': return 'badge-rose';
      case 'Tidak Sah': return 'badge-rose';
      default: return 'badge-ink';
    }
  }

  window.SIMANTRI_PAGES['input-verval-izin'] = {
    html: function () {
      return ''
        + '<div class="space-y-6">'
        +   '<div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">'
        +     '<div>'
        +       '<h2 class="text-2xl font-extrabold text-ink-900 tracking-tight">Input Verval Izin Praktik</h2>'
        +       '<p class="mt-1 text-sm text-ink-500 max-w-2xl">Verifikasi &amp; validasi izin praktik tenaga kesehatan. Formulir lengkap 27+ field.</p>'
        +     '</div>'
        +     '<button class="btn btn-primary btn-sm" data-action="add" type="button" data-role-action="add">'
        +       '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>'
        +       'Tambah Verval'
        +     '</button>'
        +   '</div>'

        // Filter
        +   '<div class="card p-4">'
        +     '<div class="grid grid-cols-1 md:grid-cols-3 gap-3">'
        +       '<div class="md:col-span-3">'
        +         '<label class="label" for="ivi-search">Pencarian</label>'
        +         '<div class="relative">'
        +           '<svg class="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>'
        +           '<input type="search" id="ivi-search" class="input" style="padding-left:2.25rem;" placeholder="Cari nama / NIK / unit kerja..." />'
        +         '</div>'
        +       '</div>'
        +     '</div>'
        +   '</div>'

        // Table
        +   '<div class="card overflow-hidden">'
        +     '<div class="overflow-x-auto">'
        +       '<table class="data-table table-sticky">'
        +         '<thead>'
        +           '<tr>'
        +             '<th>Timestamp</th>'
        +             '<th>NIK</th>'
        +             '<th>Nama</th>'
        +             '<th>Jenis Tenaga</th>'
        +             '<th>No. STR</th>'
        +             '<th>Status STR</th>'
        +             '<th>No. SIP</th>'
        +             '<th>Status SIP</th>'
        +             '<th>Unit Kerja</th>'
        +             '<th>Status Verifikasi</th>'
        +             '<th class="text-right">Aksi</th>'
        +           '</tr>'
        +         '</thead>'
        +         '<tbody id="ivi-tbody">'
        +           '<tr><td colspan="11" class="text-center text-ink-500 py-8"><div class="skeleton h-8"></div></td></tr>'
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

      let _search = '';

      const addBtn = document.querySelector('[data-action="add"]');
      if (addBtn) addBtn.addEventListener('click', function () { openFormModal(null); });

      const searchInput = document.getElementById('ivi-search');
      if (searchInput) {
        searchInput.addEventListener('input', utils.debounce(function (e) {
          _search = e.target.value.trim();
          render();
        }, 300));
      }

      async function render() {
        const tbody = document.getElementById('ivi-tbody');
        if (!tbody) return;
        try {
          const list = await data.loadVervalIzin({ search: _search });
          if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="11">' + emptyStateRow('Belum ada data verval. Klik "Tambah Verval" untuk menambahkan.') + '</td></tr>';
            return;
          }
          tbody.innerHTML = list.map(function (v) {
            const verifBadge = verifBadgeClass(v.status_verifikasi);
            return '<tr>'
                 +   '<td class="whitespace-nowrap text-xs text-ink-500">' + utils.fmtDate(v.timestamp) + '</td>'
                 +   '<td class="font-mono text-xs">' + utils.escapeHtml(v.nik || '-') + '</td>'
                 +   '<td class="font-semibold text-ink-900 whitespace-nowrap">' + utils.escapeHtml(v.nama_lengkap || '-') + '</td>'
                 +   '<td class="whitespace-nowrap">' + utils.escapeHtml(v.jenis_tenaga || '-') + '</td>'
                 +   '<td class="font-mono text-xs">' + utils.escapeHtml(v.nomor_str || '-') + '</td>'
                 +   '<td><span class="badge ' + (v.status_str === 'Aktif' ? 'badge-teal' : 'badge-rose') + '">' + utils.escapeHtml(v.status_str || '-') + '</span></td>'
                 +   '<td class="font-mono text-xs">' + utils.escapeHtml(v.nomor_sip || '-') + '</td>'
                 +   '<td><span class="badge ' + (v.status_sip === 'Aktif' ? 'badge-teal' : 'badge-amber') + '">' + utils.escapeHtml(v.status_sip || '-') + '</span></td>'
                 +   '<td class="whitespace-nowrap">' + utils.escapeHtml(v.unit_kerja || '-') + '</td>'
                 +   '<td><span class="badge ' + verifBadge + '">' + utils.escapeHtml(v.status_verifikasi || '-') + '</span></td>'
                 +   '<td class="text-right whitespace-nowrap">'
                 +     '<button class="btn btn-ghost btn-sm" data-action="edit" data-id="' + utils.escapeHtml(String(v.id)) + '" data-role-action="edit" title="Edit">'
                 +       '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>'
                 +       'Edit'
                 +     '</button>'
                 +     '<button class="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-50" data-action="delete" data-id="' + utils.escapeHtml(String(v.id)) + '" data-nama="' + utils.escapeHtml(v.nama_lengkap) + '" data-role-action="delete" title="Hapus">'
                 +       '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>'
                 +       'Hapus'
                 +     '</button>'
                 +   '</td>'
                 + '</tr>';
          }).join('');

          tbody.querySelectorAll('[data-action="edit"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              const id = btn.getAttribute('data-id');
              const item = list.find(function (x) { return String(x.id) === String(id); });
              if (item) openFormModal(item);
            });
          });
          tbody.querySelectorAll('[data-action="delete"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              const id = btn.getAttribute('data-id');
              const nama = btn.getAttribute('data-nama');
              handleDelete(id, nama);
            });
          });
        } catch (err) {
          utils.toast('Gagal memuat verval izin: ' + err.message, 'error');
          console.error('[input-verval-izin] render error:', err);
          tbody.innerHTML = '<tr><td colspan="11">' + emptyStateRow('Gagal memuat data.') + '</td></tr>';
        }
      }

      function emptyStateRow(message) {
        return '<div class="text-center py-8 text-sm text-ink-500">' + utils.escapeHtml(message) + '</div>';
      }

      // === Field config for the form ===
      function fieldText(id, label, value, opts) {
        opts = opts || {};
        return '<div>'
          + '<label class="label" for="' + id + '">' + label + (opts.required ? ' <span class="text-rose-600">*</span>' : '') + '</label>'
          + '<input type="' + (opts.type || 'text') + '" id="' + id + '" class="input' + (opts.mono ? ' font-mono' : '') + '" value="' + utils.escapeHtml(value || '') + '"'
            + (opts.placeholder ? ' placeholder="' + utils.escapeHtml(opts.placeholder) + '"' : '')
            + (opts.maxlength ? ' maxlength="' + opts.maxlength + '"' : '')
            + (opts.readonly ? ' readonly' : '') + ' />'
          + '</div>';
      }
      function fieldSelect(id, label, opts, selected) {
        return '<div>'
          + '<label class="label" for="' + id + '">' + label + '</label>'
          + '<select id="' + id + '" class="select">' + optionsHtml(opts, selected) + '</select>'
          + '</div>';
      }
      function fieldTextarea(id, label, value, rows) {
        return '<div>'
          + '<label class="label" for="' + id + '">' + label + '</label>'
          + '<textarea id="' + id + '" class="textarea" rows="' + (rows || 2) + '">' + utils.escapeHtml(value || '') + '</textarea>'
          + '</div>';
      }
      function section(letter, title, subtitle, bodyHtml) {
        return '<fieldset class="border border-ink-200 rounded-xl p-4">'
          + '<legend class="px-2 text-xs font-bold uppercase tracking-wider text-teal-700">Section ' + letter + ' &middot; ' + title + '</legend>'
          + (subtitle ? '<p class="text-xs text-ink-500 mb-3 -mt-1">' + subtitle + '</p>' : '')
          + '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">' + bodyHtml + '</div>'
          + '</fieldset>';
      }

      // === Form Modal ===
      function openFormModal(existing) {
        const isEdit = !!existing;
        const v = isEdit ? existing : {
          nik: '', nama_lengkap: '', jenis_kelamin: 'Laki-laki', tempat_lahir: '', tanggal_lahir: '', alamat_ktp: '',
          nomor_str: '', status_str: 'Aktif', status_sip: 'Aktif', nomor_sip: '', masa_berlaku_sip: '',
          unit_kerja: '', alamat_unit: '', desa_kelurahan: '', kecamatan: '', kabupaten: '',
          status_satu_sehat: 'Belum', sop_pelayanan: 'Ada', sop_profesi: 'Ada', sop_etika: 'Ada', sdmk_named: 'Ada', sdmk_nakes: 'Ada', sdmk_admin: 'Ada', jam_operasional: '',
          nip: '', jenis_tenaga: 'Dokter', golongan_pangkat: '', jabatan: '', pendidikan_str: '',
          tanggal_terbit_str: '', tanggal_berlaku_str: '', tanggal_terbit_sip: '', tanggal_berlaku_sip: '',
          status_verifikasi: 'Pending', tanggal_verifikasi: '', verifikator: '', catatan: '', catatan_rekomendasi: '',
        };

        const portal = document.getElementById('modal-portal');
        if (!portal) return;

        const formHtml = ''
          // Section A - Data Pribadi
          + section('A', 'Data Pribadi', 'Identitas pemegang izin praktik',
              fieldText('ivi-nik', 'NIK', v.nik, { required: true, mono: true, maxlength: 16, placeholder: '16 digit angka', readonly: isEdit })
            + fieldText('ivi-nama', 'Nama Lengkap', v.nama_lengkap, { required: true, maxlength: 200, placeholder: 'Nama lengkap dengan gelar' })
            + fieldSelect('ivi-jk', 'Jenis Kelamin', ['Laki-laki', 'Perempuan'], v.jenis_kelamin)
            + fieldText('ivi-tempat-lahir', 'Tempat Lahir', v.tempat_lahir, { placeholder: 'Kota kelahiran' })
            + fieldText('ivi-tgl-lahir', 'Tanggal Lahir', v.tanggal_lahir, { type: 'date' })
            + fieldText('ivi-alamat-ktp', 'Alamat KTP', v.alamat_ktp, { placeholder: 'Alamat sesuai KTP' })
            )
          // Section B - STR & SIP
          + section('B', 'STR & SIP', 'Nomor & status registrasi',
              fieldText('ivi-nomor-str', 'Nomor STR', v.nomor_str, { mono: true, placeholder: 'STR.12345.2024' })
            + fieldSelect('ivi-status-str', 'Status STR', AKTIF_TIDAK_OPTS, v.status_str)
            + fieldSelect('ivi-status-sip', 'Status SIP', AKTIF_TIDAK_OPTS, v.status_sip)
            + fieldText('ivi-nomor-sip', 'Nomor SIP', v.nomor_sip, { mono: true, placeholder: 'SIP/2024/001234' })
            + fieldText('ivi-masa-berlaku-sip', 'Masa Berlaku SIP', v.masa_berlaku_sip, { type: 'date' })
            )
          // Section C - Unit Kerja
          + section('C', 'Unit Kerja', 'Lokasi praktik',
              fieldText('ivi-unit-kerja', 'Unit Kerja', v.unit_kerja, { placeholder: 'RSUD / Puskesmas / Klinik' })
            + fieldText('ivi-alamat-unit', 'Alamat Unit', v.alamat_unit, { placeholder: 'Alamat lengkap unit kerja' })
            + fieldText('ivi-desa-kel', 'Desa/Kelurahan', v.desa_kelurahan)
            + fieldText('ivi-kecamatan', 'Kecamatan', v.kecamatan)
            + fieldText('ivi-kabupaten', 'Kabupaten', v.kabupaten)
            )
          // Section D - Status & SOP
          + section('D', 'Status & SOP', 'Kepatuhan SatuSehat dan SOP',
              fieldSelect('ivi-satu-sehat', 'Status SatuSehat', SUDAH_BELUM_OPTS, v.status_satu_sehat)
            + fieldSelect('ivi-sop-pelayanan', 'SOP Pelayanan', YA_TIDAK_OPTS, v.sop_pelayanan)
            + fieldSelect('ivi-sop-profesi', 'SOP Profesi', YA_TIDAK_OPTS, v.sop_profesi)
            + fieldSelect('ivi-sop-etika', 'SOP Etika', YA_TIDAK_OPTS, v.sop_etika)
            + fieldSelect('ivi-sdmk-named', 'SDMK Named', YA_TIDAK_OPTS, v.sdmk_named)
            + fieldSelect('ivi-sdmk-nakes', 'SDMK Nakes', YA_TIDAK_OPTS, v.sdmk_nakes)
            + fieldSelect('ivi-sdmk-admin', 'SDMK Admin', YA_TIDAK_OPTS, v.sdmk_admin)
            + fieldText('ivi-jam-operasional', 'Jam Operasional', v.jam_operasional, { placeholder: 'Senin-Jumat 08.00-16.00' })
            )
          // Section E - Pegawai
          + section('E', 'Pegawai', 'Data kepegawaian',
              fieldText('ivi-nip', 'NIP', v.nip, { mono: true, maxlength: 30 })
            + fieldSelect('ivi-jenis-tenaga', 'Jenis Tenaga', JENIS_TENAGA_OPTS, v.jenis_tenaga)
            + fieldText('ivi-golongan', 'Golongan/Pangkat', v.golongan_pangkat, { placeholder: 'IV/a' })
            + fieldText('ivi-jabatan', 'Jabatan', v.jabatan)
            + fieldText('ivi-pendidikan', 'Pendidikan STR', v.pendidikan_str, { placeholder: 'S1 Kedokteran' })
            )
          // Section F - Tanggal
          + section('F', 'Tanggal', 'Tanggal terbit & berlaku dokumen',
              fieldText('ivi-tgl-terbit-str', 'Tanggal Terbit STR', v.tanggal_terbit_str, { type: 'date' })
            + fieldText('ivi-tgl-berlaku-str', 'Tanggal Berlaku STR', v.tanggal_berlaku_str, { type: 'date' })
            + fieldText('ivi-tgl-terbit-sip', 'Tanggal Terbit SIP', v.tanggal_terbit_sip, { type: 'date' })
            + fieldText('ivi-tgl-berlaku-sip', 'Tanggal Berlaku SIP', v.tanggal_berlaku_sip, { type: 'date' })
            )
          // Section G - Verifikasi
          + section('G', 'Verifikasi', 'Hasil verifikasi & rekomendasi',
              fieldSelect('ivi-status-verif', 'Status Verifikasi', STATUS_VERIF_OPTS, v.status_verifikasi)
            + fieldText('ivi-tgl-verif', 'Tanggal Verifikasi', v.tanggal_verifikasi, { type: 'date' })
            + fieldText('ivi-verifikator', 'Verifikator', v.verifikator, { placeholder: 'Nama verifikator' })
            + fieldTextarea('ivi-catatan', 'Catatan', v.catatan, 3)
            + fieldTextarea('ivi-catatan-rek', 'Catatan Rekomendasi', v.catatan_rekomendasi, 3)
            );

        portal.innerHTML = ''
          + '<div class="fixed inset-0 z-[80] flex items-center justify-center p-4" data-modal-root>'
          +   '<div class="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" data-modal-close></div>'
          +   '<div class="card relative w-full max-w-3xl max-h-[92vh] overflow-y-auto" data-modal-content>'
          +     '<div class="p-5 border-b border-ink-100 flex items-center justify-between sticky top-0 bg-white z-10">'
          +       '<div>'
          +         '<h3 class="text-base font-bold text-ink-900">' + (isEdit ? 'Edit Verval Izin Praktik' : 'Tambah Verval Izin Praktik') + '</h3>'
          +         '<p class="text-xs text-ink-500 mt-0.5">Formulir lengkap 7 section &middot; 27+ field</p>'
          +       '</div>'
          +       '<button type="button" class="btn btn-ghost btn-sm" data-modal-close aria-label="Tutup">'
          +         '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>'
          +       '</button>'
          +     '</div>'
          +     '<form id="ivi-form" class="p-5 space-y-4">'
          +       formHtml
          +       '<div class="flex items-center justify-end gap-2 pt-3 border-t border-ink-100 sticky bottom-0 bg-white">'
          +         '<button type="button" class="btn btn-outline btn-sm" data-modal-close>Batal</button>'
          +         '<button type="submit" class="btn btn-primary btn-sm" id="ivi-submit">'
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

        const form = document.getElementById('ivi-form');
        if (form) {
          form.addEventListener('submit', async function (e) {
            e.preventDefault();
            await handleSubmit(isEdit, existing);
          });
        }

        // NIK numeric only
        const nikInput = document.getElementById('ivi-nik');
        if (nikInput) {
          nikInput.addEventListener('input', function (e) {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 16);
          });
        }

        document.addEventListener('keydown', onEscKey);
        setTimeout(function () {
          const focusTarget = isEdit ? document.getElementById('ivi-nama') : document.getElementById('ivi-nik');
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
        const nik = getVal('ivi-nik');
        const nama_lengkap = getVal('ivi-nama');
        if (!isEdit && !/^[0-9]{16}$/.test(nik)) {
          utils.toast('NIK harus 16 digit angka', 'warning');
          return;
        }
        if (!nama_lengkap) {
          utils.toast('Nama lengkap wajib diisi', 'warning');
          return;
        }

        const profile = auth.getProfile() || {};
        const payload = {
          nik: nik,
          nama_lengkap: nama_lengkap,
          jenis_kelamin: getVal('ivi-jk'),
          tempat_lahir: getVal('ivi-tempat-lahir'),
          tanggal_lahir: getVal('ivi-tgl-lahir') || null,
          alamat_ktp: getVal('ivi-alamat-ktp'),
          nomor_str: getVal('ivi-nomor-str'),
          status_str: getVal('ivi-status-str'),
          status_sip: getVal('ivi-status-sip'),
          nomor_sip: getVal('ivi-nomor-sip'),
          masa_berlaku_sip: getVal('ivi-masa-berlaku-sip') || null,
          unit_kerja: getVal('ivi-unit-kerja'),
          alamat_unit: getVal('ivi-alamat-unit'),
          desa_kelurahan: getVal('ivi-desa-kel'),
          kecamatan: getVal('ivi-kecamatan'),
          kabupaten: getVal('ivi-kabupaten'),
          status_satu_sehat: getVal('ivi-satu-sehat'),
          sop_pelayanan: getVal('ivi-sop-pelayanan'),
          sop_profesi: getVal('ivi-sop-profesi'),
          sop_etika: getVal('ivi-sop-etika'),
          sdmk_named: getVal('ivi-sdmk-named'),
          sdmk_nakes: getVal('ivi-sdmk-nakes'),
          sdmk_admin: getVal('ivi-sdmk-admin'),
          jam_operasional: getVal('ivi-jam-operasional'),
          nip: getVal('ivi-nip'),
          jenis_tenaga: getVal('ivi-jenis-tenaga'),
          golongan_pangkat: getVal('ivi-golongan'),
          jabatan: getVal('ivi-jabatan'),
          pendidikan_str: getVal('ivi-pendidikan'),
          tanggal_terbit_str: getVal('ivi-tgl-terbit-str') || null,
          tanggal_berlaku_str: getVal('ivi-tgl-berlaku-str') || null,
          tanggal_terbit_sip: getVal('ivi-tgl-terbit-sip') || null,
          tanggal_berlaku_sip: getVal('ivi-tgl-berlaku-sip') || null,
          status_verifikasi: getVal('ivi-status-verif'),
          tanggal_verifikasi: getVal('ivi-tgl-verif') || null,
          verifikator: getVal('ivi-verifikator') || (profile.username || ''),
          catatan: getVal('ivi-catatan'),
          catatan_rekomendasi: getVal('ivi-catatan-rek'),
        };

        const submitBtn = document.getElementById('ivi-submit');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9"/></svg> Menyimpan...';
        }

        try {
          if (isEdit) {
            await data.updateVervalIzin(existing.id, payload);
            await data.addLog({ username: profile.username || 'admin', aksi: 'UPDATE_VERVAL_IZIN', detail: 'Update verval izin: ' + nama_lengkap + ' (NIK ' + nik + ')', ip_address: '127.0.0.1' });
            utils.toast('Verval izin diperbarui', 'success');
          } else {
            await data.addVervalIzin(payload);
            await data.addLog({ username: profile.username || 'admin', aksi: 'ADD_VERVAL_IZIN', detail: 'Tambah verval izin: ' + nama_lengkap + ' (NIK ' + nik + ')', ip_address: '127.0.0.1' });
            utils.toast('Verval izin ditambahkan', 'success');
          }
          closeModal();
          await render();
        } catch (err) {
          utils.toast('Gagal menyimpan: ' + err.message, 'error');
          console.error('[input-verval-izin] submit error:', err);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' + (isEdit ? 'Simpan Perubahan' : 'Tambah Verval');
          }
        }
      }

      async function handleDelete(id, nama) {
        if (!confirm('Hapus verval izin untuk "' + nama + '"? Tindakan ini tidak dapat dibatalkan.')) return;
        try {
          await data.deleteVervalIzin(id);
          const profile = auth.getProfile() || {};
          await data.addLog({ username: profile.username || 'admin', aksi: 'DELETE_VERVAL_IZIN', detail: 'Hapus verval izin: ' + nama + ' (ID ' + id + ')', ip_address: '127.0.0.1' });
          utils.toast('Verval izin dihapus', 'success');
          await render();
        } catch (err) {
          utils.toast('Gagal menghapus: ' + err.message, 'error');
          console.error('[input-verval-izin] delete error:', err);
        }
      }

      await render();
    },
  };
})();
