/* ============================================================================
 * SIMANTRI v3 — Page: Perpanjangan & Rekomendasi
 * ============================================================================ */

(function () {
  'use strict';

  window.SIMANTRI_PAGES = window.SIMANTRI_PAGES || {};

  window.SIMANTRI_PAGES['perpanjangan'] = {
    html: function () {
      return `
        <div class="space-y-6">
          <div>
            <h2 class="text-2xl font-extrabold text-ink-900 tracking-tight">Perpanjangan &amp; Rekomendasi</h2>
            <p class="mt-1 text-sm text-ink-500 max-w-2xl">Ajukan perpanjangan STR/SIP sebelum masa berlaku habis. Lampirkan dokumen pendukung.</p>
          </div>

          <!-- Tabs -->
          <div class="flex items-center gap-1 border-b border-ink-200">
            <button type="button" class="pp-tab px-4 py-2.5 text-sm font-semibold border-b-2 border-teal-600 text-teal-700" data-tab="list">Daftar Pengajuan</button>
            <button type="button" class="pp-tab px-4 py-2.5 text-sm font-semibold border-b-2 border-transparent text-ink-500 hover:text-ink-800" data-tab="form">Ajukan Baru</button>
          </div>

          <!-- Tab: List -->
          <div id="pp-list-tab" class="space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div class="flex items-center gap-2">
                <select id="pp-filter-status" class="select" style="width:auto;">
                  <option value="">Semua Status</option>
                  <option value="pending">Menunggu</option>
                  <option value="diverifikasi">Diproses</option>
                  <option value="ditolak">Ditolak</option>
                  <option value="aktif">Selesai</option>
                </select>
              </div>
              <button class="btn btn-primary btn-sm" data-action="goto-form" type="button">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                Ajukan Perpanjangan
              </button>
            </div>

            <div class="card overflow-hidden">
              <div class="overflow-x-auto" style="max-height:560px;">
                <table class="data-table table-sticky">
                  <thead>
                    <tr>
                      <th>Nakes</th>
                      <th>Tipe</th>
                      <th>No. Dok Lama</th>
                      <th>Tgl Berakhir</th>
                      <th>Tgl Pengajuan</th>
                      <th>Status</th>
                      <th class="text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody id="pp-tbody">
                    <tr><td colspan="7" class="text-center text-ink-500 py-8">Memuat data...</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Tab: Form -->
          <div id="pp-form-tab" class="hidden">
            <div class="card p-6 max-w-2xl">
              <div class="mb-5">
                <h3 class="text-base font-bold text-ink-900">Form Pengajuan Perpanjangan</h3>
                <p class="text-xs text-ink-500 mt-0.5">Lengkapi data di bawah. Field bertanda * wajib diisi.</p>
              </div>

              <form id="pp-form" class="space-y-4" novalidate>
                <div>
                  <label class="label" for="pp-nakes">Nakes <span class="text-rose-500">*</span></label>
                  <select id="pp-nakes" class="select" required>
                    <option value="">-- Pilih Nakes --</option>
                  </select>
                  <p class="field-error hidden" id="pp-nakes-err">Nakes wajib dipilih</p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="label" for="pp-jenis">Jenis Dokumen <span class="text-rose-500">*</span></label>
                    <select id="pp-jenis" class="select" required>
                      <option value="">-- Pilih Jenis --</option>
                      <option value="STR">STR (Surat Tanda Registrasi)</option>
                      <option value="SIP">SIP (Surat Izin Praktik)</option>
                    </select>
                    <p class="field-error hidden" id="pp-jenis-err">Jenis dokumen wajib dipilih</p>
                  </div>
                  <div>
                    <label class="label" for="pp-no-lama">No. Dok Lama <span class="text-rose-500">*</span></label>
                    <input type="text" id="pp-no-lama" class="input" placeholder="Contoh: STR/12345/2023" required />
                    <p class="field-error hidden" id="pp-no-lama-err">Nomor dokumen lama wajib diisi</p>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="label" for="pp-tgl-berakhir">Tanggal Berakhir Dok Lama <span class="text-rose-500">*</span></label>
                    <input type="date" id="pp-tgl-berakhir" class="input" required />
                    <p class="field-error hidden" id="pp-tgl-berakhir-err">Tanggal berakhir harus diisi dan tanggal masa depan</p>
                  </div>
                  <div>
                    <label class="label" for="pp-tgl-pengajuan">Tanggal Pengajuan</label>
                    <input type="date" id="pp-tgl-pengajuan" class="input" readonly />
                  </div>
                </div>

                <div>
                  <label class="label">Dokumen Pendukung <span class="text-rose-500">*</span></label>
                  <div id="pp-dropzone" class="border-2 border-dashed border-ink-200 rounded-xl p-6 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-colors" tabindex="0">
                    <svg class="w-10 h-10 mx-auto text-ink-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                    <p class="text-sm font-semibold text-ink-700">Klik atau seret file ke sini</p>
                    <p class="text-xs text-ink-500 mt-1">Format: PDF, JPG, PNG. Maks 5 MB</p>
                    <input type="file" id="pp-file" class="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                  </div>
                  <div id="pp-file-info" class="hidden mt-2 p-3 rounded-lg bg-teal-50 flex items-center gap-2">
                    <svg class="w-5 h-5 text-teal-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold text-ink-900 truncate" id="pp-file-name">file.pdf</p>
                      <p class="text-xs text-ink-500" id="pp-file-size">0 KB</p>
                    </div>
                    <button type="button" class="text-rose-500 hover:text-rose-700" data-action="remove-file" aria-label="Hapus file">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                  <p class="field-error hidden" id="pp-file-err">Dokumen pendukung wajib diunggah (maks 5 MB)</p>
                </div>

                <div>
                  <label class="label" for="pp-catatan">Catatan</label>
                  <textarea id="pp-catatan" class="textarea" rows="3" placeholder="Catatan tambahan untuk reviewer (opsional)"></textarea>
                </div>

                <div class="flex items-center justify-end gap-2 pt-3 border-t border-ink-100">
                  <button type="button" class="btn btn-outline btn-sm" data-action="reset-form">Reset</button>
                  <button type="submit" class="btn btn-primary btn-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                    Kirim Pengajuan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      `;
    },

    init: async function () {
      const utils = window.SIMANTRI_UTILS;
      const data = window.SIMANTRI_DATA;
      const db = window.SIMANTRI_DB;

      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

      let _allNakes = [];
      let _allPraktik = [];
      let _allFasyankes = [];
      let _pengajuan = [];
      let _selectedFile = null;
      let _activeTab = 'list';
      let _statusFilter = '';

      // Tabs
      document.querySelectorAll('.pp-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
          _activeTab = tab.dataset.tab;
          document.querySelectorAll('.pp-tab').forEach(function (t) {
            const isActive = t === tab;
            t.classList.toggle('border-teal-600', isActive);
            t.classList.toggle('text-teal-700', isActive);
            t.classList.toggle('border-transparent', !isActive);
            t.classList.toggle('text-ink-500', !isActive);
          });
          const listEl = document.getElementById('pp-list-tab');
          const formEl = document.getElementById('pp-form-tab');
          if (listEl) listEl.classList.toggle('hidden', _activeTab !== 'list');
          if (formEl) formEl.classList.toggle('hidden', _activeTab !== 'form');
        });
      });

      const gotoFormBtn = document.querySelector('[data-action="goto-form"]');
      if (gotoFormBtn) gotoFormBtn.addEventListener('click', function () {
        document.querySelector('.pp-tab[data-tab="form"]').click();
      });

      const statusFilter = document.getElementById('pp-filter-status');
      if (statusFilter) {
        statusFilter.addEventListener('change', function (e) {
          _statusFilter = e.target.value;
          renderList();
        });
      }

      // Form bindings
      const nakesSel = document.getElementById('pp-nakes');
      const jenisSel = document.getElementById('pp-jenis');
      const noLamaInput = document.getElementById('pp-no-lama');
      const tglBerakhirInput = document.getElementById('pp-tgl-berakhir');
      const tglPengajuanInput = document.getElementById('pp-tgl-pengajuan');
      const catatanInput = document.getElementById('pp-catatan');
      const fileInput = document.getElementById('pp-file');
      const dropzone = document.getElementById('pp-dropzone');
      const fileInfo = document.getElementById('pp-file-info');
      const fileName = document.getElementById('pp-file-name');
      const fileSize = document.getElementById('pp-file-size');

      if (nakesSel) {
        nakesSel.addEventListener('change', function () {
          autoFillFromNakes();
        });
      }
      if (jenisSel) {
        jenisSel.addEventListener('change', function () {
          autoFillFromNakes();
        });
      }

      function autoFillFromNakes() {
        const nakesId = nakesSel && nakesSel.value;
        const jenis = jenisSel && jenisSel.value;
        if (!nakesId || !jenis) return;
        if (jenis === 'STR') {
          const n = _allNakes.find(function (x) { return x.id === nakesId; });
          if (n) {
            if (noLamaInput) noLamaInput.value = n.no_str || '';
            if (tglBerakhirInput) tglBerakhirInput.value = n.tgl_akhir_str || '';
          }
        } else if (jenis === 'SIP') {
          const p = _allPraktik.find(function (x) { return x.tenaga_id === nakesId; });
          if (p) {
            if (noLamaInput) noLamaInput.value = p.no_sip || '';
            if (tglBerakhirInput) tglBerakhirInput.value = p.tgl_akhir_sip || '';
          }
        }
      }

      // Dropzone
      if (dropzone) {
        dropzone.addEventListener('click', function () { if (fileInput) fileInput.click(); });
        dropzone.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (fileInput) fileInput.click(); }
        });
        dropzone.addEventListener('dragover', function (e) {
          e.preventDefault();
          dropzone.classList.add('border-teal-400', 'bg-teal-50/40');
        });
        dropzone.addEventListener('dragleave', function (e) {
          e.preventDefault();
          dropzone.classList.remove('border-teal-400', 'bg-teal-50/40');
        });
        dropzone.addEventListener('drop', function (e) {
          e.preventDefault();
          dropzone.classList.remove('border-teal-400', 'bg-teal-50/40');
          if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
          }
        });
      }
      if (fileInput) {
        fileInput.addEventListener('change', function (e) {
          if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
        });
      }
      const removeFileBtn = document.querySelector('[data-action="remove-file"]');
      if (removeFileBtn) {
        removeFileBtn.addEventListener('click', function (e) {
          e.preventDefault();
          clearFile();
        });
      }

      function handleFile(file) {
        const errEl = document.getElementById('pp-file-err');
        if (errEl) errEl.classList.add('hidden');
        if (file.size > MAX_FILE_SIZE) {
          if (errEl) {
            errEl.textContent = 'Ukuran file melebihi 5 MB (' + Math.round(file.size / 1024 / 1024) + ' MB)';
            errEl.classList.remove('hidden');
          }
          utils.toast('File terlalu besar. Maks 5 MB', 'error');
          clearFile();
          return;
        }
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (allowedTypes.indexOf(file.type) < 0) {
          if (errEl) {
            errEl.textContent = 'Format file tidak didukung. Gunakan PDF, JPG, atau PNG';
            errEl.classList.remove('hidden');
          }
          utils.toast('Format file tidak didukung', 'error');
          clearFile();
          return;
        }
        _selectedFile = file;
        if (fileInfo) fileInfo.classList.remove('hidden');
        if (fileName) fileName.textContent = file.name;
        if (fileSize) fileSize.textContent = formatFileSize(file.size);
      }

      function clearFile() {
        _selectedFile = null;
        if (fileInput) fileInput.value = '';
        if (fileInfo) fileInfo.classList.add('hidden');
      }

      function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
        return (bytes / 1024 / 1024).toFixed(2) + ' MB';
      }

      // Set today's date for pengajuan
      if (tglPengajuanInput) {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        tglPengajuanInput.value = y + '-' + m + '-' + d;
      }

      const form = document.getElementById('pp-form');
      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          handleSubmit();
        });
      }
      const resetBtn = document.querySelector('[data-action="reset-form"]');
      if (resetBtn) {
        resetBtn.addEventListener('click', function () {
          form.reset();
          clearFile();
          clearErrors();
          if (tglPengajuanInput) {
            const today = new Date();
            const y = today.getFullYear();
            const m = String(today.getMonth() + 1).padStart(2, '0');
            const d = String(today.getDate()).padStart(2, '0');
            tglPengajuanInput.value = y + '-' + m + '-' + d;
          }
          utils.toast('Form direset', 'info');
        });
      }

      function clearErrors() {
        document.querySelectorAll('#pp-form .field-error').forEach(function (el) {
          el.classList.add('hidden');
        });
      }

      function showError(errId, msg) {
        const el = document.getElementById(errId);
        if (el) {
          if (msg) el.textContent = msg;
          el.classList.remove('hidden');
        }
      }

      function handleSubmit() {
        clearErrors();
        let valid = true;

        if (!nakesSel.value) {
          showError('pp-nakes-err');
          valid = false;
        }
        if (!jenisSel.value) {
          showError('pp-jenis-err');
          valid = false;
        }
        if (!noLamaInput.value.trim()) {
          showError('pp-no-lama-err');
          valid = false;
        }
        const tglBerakhir = tglBerakhirInput.value;
        if (!tglBerakhir) {
          showError('pp-tgl-berakhir-err', 'Tanggal berakhir wajib diisi');
          valid = false;
        } else {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const end = new Date(tglBerakhir);
          end.setHours(0, 0, 0, 0);
          if (end <= today) {
            showError('pp-tgl-berakhir-err', 'Tanggal berakhir harus tanggal masa depan');
            valid = false;
          }
        }
        if (!_selectedFile) {
          showError('pp-file-err');
          valid = false;
        }

        if (!valid) {
          utils.toast('Periksa kembali isian form', 'error');
          return;
        }

        // Create pengajuan
        const n = _allNakes.find(function (x) { return x.id === nakesSel.value; });
        const newPengajuan = {
          id: 'pp-' + Date.now(),
          tenaga_id: nakesSel.value,
          nama: n ? n.nama : 'Nakes',
          profesi: n ? n.profesi : '-',
          tipe: jenisSel.value,
          no_dok_lama: noLamaInput.value.trim(),
          tgl_berakhir_lama: tglBerakhir,
          tgl_pengajuan: tglPengajuanInput.value,
          catatan: catatanInput.value.trim(),
          file_name: _selectedFile.name,
          status: db.STATUS.PENDING,
        };
        _pengajuan.unshift(newPengajuan);

        utils.toast('Pengajuan perpanjangan ' + newPengajuan.tipe + ' berhasil dikirim', 'success');
        form.reset();
        clearFile();
        if (tglPengajuanInput) {
          const today = new Date();
          const y = today.getFullYear();
          const m = String(today.getMonth() + 1).padStart(2, '0');
          const d = String(today.getDate()).padStart(2, '0');
          tglPengajuanInput.value = y + '-' + m + '-' + d;
        }
        renderList();
        // Switch to list tab
        const listTab = document.querySelector('.pp-tab[data-tab="list"]');
        if (listTab) listTab.click();
      }

      // Listen for start-perpanjangan events
      document.addEventListener('simantri:start-perpanjutan', function (e) {
        // typo guard
      });
      document.addEventListener('simantri:start-perpanjangan', function (e) {
        const detail = e.detail || {};
        const formTab = document.querySelector('.pp-tab[data-tab="form"]');
        if (formTab) formTab.click();
        if (detail.tenagaId && nakesSel) {
          nakesSel.value = detail.tenagaId;
        }
        if (detail.tipe && jenisSel) {
          jenisSel.value = detail.tipe;
        }
        autoFillFromNakes();
      });

      async function load() {
        try {
          const [nakes, praktik, fasyankes] = await Promise.all([
            data.loadNakes(),
            data.loadPraktik(),
            data.loadFasyankes(),
          ]);
          _allNakes = nakes;
          _allPraktik = praktik;
          _allFasyankes = fasyankes;

          // Populate nakes select
          if (nakesSel) {
            nakesSel.innerHTML = '<option value="">-- Pilih Nakes --</option>'
              + nakes.map(function (n) {
                return '<option value="' + utils.escapeHtml(n.id) + '">' + utils.escapeHtml(n.nama) + ' &middot; ' + utils.escapeHtml(n.profesi || '-') + '</option>';
              }).join('');
          }

          // Generate mock pengajuan from data
          const mockPengajuan = [];
          // Some pending from nakes with hampir_expired STR
          nakes.forEach(function (n, i) {
            const status = n.expire_status || db.calcExpireStatus(n.tgl_akhir_str);
            if (status === db.STATUS.HAMPIR_EXPIRED && i < 5) {
              mockPengajuan.push({
                id: 'pp-mock-' + n.id,
                tenaga_id: n.id,
                nama: n.nama,
                profesi: n.profesi,
                tipe: 'STR',
                no_dok_lama: n.no_str,
                tgl_berakhir_lama: n.tgl_akhir_str,
                tgl_pengajuan: '2025-09-01',
                catatan: 'Perpanjangan rutin',
                file_name: 'STR_' + n.id + '.pdf',
                status: db.STATUS.PENDING,
              });
            }
          });
          praktik.forEach(function (p) {
            const status = p.expire_status || db.calcExpireStatus(p.tgl_akhir_sip);
            if (status === db.STATUS.HAMPIR_EXPIRED) {
              const n = nakes.find(function (x) { return x.id === p.tenaga_id; });
              mockPengajuan.push({
                id: 'pp-mock-sip-' + p.id,
                tenaga_id: p.tenaga_id,
                nama: n ? n.nama : 'Nakes',
                profesi: n ? n.profesi : '-',
                tipe: 'SIP',
                no_dok_lama: p.no_sip,
                tgl_berakhir_lama: p.tgl_akhir_sip,
                tgl_pengajuan: '2025-09-02',
                catatan: '',
                file_name: 'SIP_' + p.id + '.pdf',
                status: db.STATUS.DIVERIFIKASI,
              });
            }
          });
          _pengajuan = mockPengajuan;
          renderList();
        } catch (err) {
          utils.toast('Gagal memuat data: ' + err.message, 'error');
          console.error(err);
        }
      }

      function renderList() {
        const tbody = document.getElementById('pp-tbody');
        if (!tbody) return;
        let items = _pengajuan;
        if (_statusFilter) items = items.filter(function (p) { return p.status === _statusFilter; });

        if (!items.length) {
          tbody.innerHTML = '<tr><td colspan="7"><div class="text-center py-10 px-4">'
            + '<div class="w-12 h-12 mx-auto rounded-xl bg-ink-100 text-ink-400 flex items-center justify-center mb-3">'
            + '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>'
            + '</div>'
            + '<p class="text-sm font-semibold text-ink-700">Belum ada pengajuan</p>'
            + '<p class="text-xs text-ink-500 mt-1">Klik "Ajukan Perpanjangan" untuk membuat baru</p>'
            + '</div></td></tr>';
          return;
        }

        tbody.innerHTML = items.map(function (p) {
          const badgeClass = db.statusBadgeClass(p.status);
          const statusLabel = db.statusLabel(p.status);
          const colorAvatar = utils.avatarColor(p.nama);
          const days = utils.daysUntil(p.tgl_berakhir_lama);
          const dayText = days < 0 ? 'Expired ' + (-days) + ' hari lalu' : 'H-' + days;
          return '<tr data-pengajuan-id="' + utils.escapeHtml(p.id) + '">'
               + '<td>'
               + '<div class="flex items-center gap-2">'
               + '<div class="w-8 h-8 rounded-full ' + colorAvatar + ' text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">' + utils.escapeHtml(utils.initials(p.nama)) + '</div>'
               + '<div class="min-w-0">'
               + '<p class="text-sm font-semibold text-ink-900 truncate">' + utils.escapeHtml(p.nama) + '</p>'
               + '<p class="text-[11px] text-ink-500 truncate">' + utils.escapeHtml(p.profesi || '-') + '</p>'
               + '</div>'
               + '</div>'
               + '</td>'
               + '<td><span class="badge ' + (p.tipe === 'STR' ? 'badge-teal' : 'badge-lime') + '">' + p.tipe + '</span></td>'
               + '<td><span class="text-xs font-mono text-ink-600">' + utils.escapeHtml(p.no_dok_lama || '-') + '</span></td>'
               + '<td>'
               + '<p class="text-xs text-ink-700">' + utils.fmtDate(p.tgl_berakhir_lama) + '</p>'
               + '<p class="text-[10px] text-ink-500">' + dayText + '</p>'
               + '</td>'
               + '<td><span class="text-xs text-ink-600">' + utils.fmtDate(p.tgl_pengajuan) + '</span></td>'
               + '<td><span class="badge ' + badgeClass + '">' + statusLabel + '</span></td>'
               + '<td class="text-right">'
               + '<button class="btn btn-ghost btn-sm" data-action="view" data-id="' + utils.escapeHtml(p.id) + '" aria-label="Lihat detail">'
               + '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>'
               + '</button>'
               + '</td>'
               + '</tr>';
        }).join('');

        tbody.querySelectorAll('[data-action="view"]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            const id = btn.dataset.id;
            const p = _pengajuan.find(function (x) { return x.id === id; });
            if (p) openDetail(p);
          });
        });
      }

      function openDetail(p) {
        const colorAvatar = utils.avatarColor(p.nama);
        const badgeClass = db.statusBadgeClass(p.status);
        const statusLabel = db.statusLabel(p.status);
        const modalHtml = `
          <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" data-modal>
            <div class="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" data-modal-close></div>
            <div class="relative card w-full sm:max-w-lg" style="border-radius:1.25rem;">
              <div class="p-5 border-b border-ink-100 flex items-start justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-12 h-12 rounded-full ` + colorAvatar + ` text-white flex items-center justify-center text-base font-bold flex-shrink-0">` + utils.escapeHtml(utils.initials(p.nama)) + `</div>
                  <div class="min-w-0">
                    <h3 class="text-base font-bold text-ink-900 truncate">` + utils.escapeHtml(p.nama) + `</h3>
                    <p class="text-xs text-ink-500">Pengajuan ` + utils.escapeHtml(p.tipe) + `</p>
                  </div>
                </div>
                <button class="btn btn-ghost btn-sm" data-modal-close aria-label="Tutup">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div class="p-5 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs text-ink-500 uppercase tracking-wider">Status</span>
                  <span class="badge ` + badgeClass + `">` + statusLabel + `</span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                  <div class="rounded-xl bg-ink-50 p-3">
                    <p class="text-[10px] font-semibold text-ink-500 uppercase tracking-wider">Jenis Dok</p>
                    <p class="text-ink-800 mt-0.5">` + utils.escapeHtml(p.tipe) + `</p>
                  </div>
                  <div class="rounded-xl bg-ink-50 p-3">
                    <p class="text-[10px] font-semibold text-ink-500 uppercase tracking-wider">No. Lama</p>
                    <p class="font-mono text-ink-800 mt-0.5 text-xs">` + utils.escapeHtml(p.no_dok_lama || '-') + `</p>
                  </div>
                  <div class="rounded-xl bg-ink-50 p-3">
                    <p class="text-[10px] font-semibold text-ink-500 uppercase tracking-wider">Tgl Berakhir</p>
                    <p class="text-ink-800 mt-0.5">` + utils.fmtDateLong(p.tgl_berakhir_lama) + `</p>
                  </div>
                  <div class="rounded-xl bg-ink-50 p-3">
                    <p class="text-[10px] font-semibold text-ink-500 uppercase tracking-wider">Tgl Pengajuan</p>
                    <p class="text-ink-800 mt-0.5">` + utils.fmtDateLong(p.tgl_pengajuan) + `</p>
                  </div>
                </div>
                <div class="rounded-xl border border-ink-100 p-3 flex items-center gap-3">
                  <svg class="w-8 h-8 text-teal-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-ink-900 truncate">` + utils.escapeHtml(p.file_name || '-') + `</p>
                    <p class="text-xs text-ink-500">Dokumen pendukung</p>
                  </div>
                </div>
                ` + (p.catatan ? '<div class="rounded-xl bg-ink-50 p-3"><p class="text-[10px] font-semibold text-ink-500 uppercase tracking-wider mb-1">Catatan</p><p class="text-sm text-ink-700">' + utils.escapeHtml(p.catatan) + '</p></div>' : '') + `
              </div>
              <div class="p-4 border-t border-ink-100 flex justify-end gap-2">
                <button class="btn btn-outline btn-sm" data-modal-close>Tutup</button>
                ` + (p.status === db.STATUS.PENDING ? '<button class="btn btn-danger btn-sm" data-action="cancel" data-id="' + utils.escapeHtml(p.id) + '" data-role-action="delete"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"/></svg>Batalkan</button>' : '') + `
              </div>
            </div>
          </div>
        `;
        const portal = document.getElementById('modal-portal');
        if (!portal) return;
        portal.innerHTML = modalHtml;
        portal.querySelectorAll('[data-modal-close]').forEach(function (el) {
          el.addEventListener('click', closeModal);
        });
        const cancelBtn = portal.querySelector('[data-action="cancel"]');
        if (cancelBtn) {
          cancelBtn.addEventListener('click', function () {
            const id = cancelBtn.dataset.id;
            _pengajuan = _pengajuan.filter(function (x) { return x.id !== id; });
            utils.toast('Pengajuan dibatalkan', 'info');
            closeModal();
            renderList();
          });
        }
        document.addEventListener('keydown', escClose);
      }

      function escClose(e) {
        if (e.key === 'Escape') closeModal();
      }
      function closeModal() {
        const portal = document.getElementById('modal-portal');
        if (portal) portal.innerHTML = '';
        document.removeEventListener('keydown', escClose);
      }

      await load();
    },
  };
})();
