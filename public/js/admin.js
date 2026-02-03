// ==========================================
// INITIALIZE
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
    loadLaporanData();
    
    // Setup navbar
    const username = localStorage.getItem('adminUsername') || 'Admin';
    const navbarBrand = document.querySelector('.navbar-brand small');
    if (navbarBrand && username !== 'Admin') {
        navbarBrand.textContent = `Selamat datang, ${username}`;
    }
});

// ==========================================
// LOAD LAPORAN DATA
// ==========================================
async function loadLaporanData() {
    try {
        const response = await fetch('/api/laporan-harian');
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        const data = result.data.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        displayLaporanTable(data);

    } catch (error) {
        console.error('Error:', error);
        showAlert('Gagal memuat data: ' + error.message, 'danger');
    }
}

// ==========================================
// DISPLAY LAPORAN TABLE
// ==========================================
function displayLaporanTable(data) {
    const tbody = document.getElementById('tableLaporanBody');

    // Clear existing
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.setAttribute('colspan', '8');
        td.className = 'text-center text-muted';
        td.textContent = 'Belum ada data';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    data.forEach(item => {
        const tr = document.createElement('tr');

        const tdTanggal = document.createElement('td');
        const strong = document.createElement('strong');
        strong.textContent = formatDate(item.tanggal);
        tdTanggal.appendChild(strong);
        tr.appendChild(tdTanggal);

        const addNumberCell = (value, className) => {
            const td = document.createElement('td');
            if (className) td.className = className;
            td.textContent = value != null ? value : 0;
            tr.appendChild(td);
        };

        addNumberCell(item.stblkk || 0, 'text-end');
        addNumberCell(item.pb || 0, 'text-end');
        addNumberCell(item.asuransi_baru || 0, 'text-end');
        addNumberCell(item.asuransi_lama || 0, 'text-end');
        addNumberCell(item.bbm_subsidi_surat || 0, 'text-end');
        addNumberCell(item.bbm_non_surat || 0, 'text-end');

        const tdAction = document.createElement('td');
        tdAction.className = 'text-center';
        const btnEdit = document.createElement('button');
        btnEdit.className = 'btn btn-primary btn-sm';
        btnEdit.textContent = '✎ Edit';
        btnEdit.type = 'button';
        btnEdit.addEventListener('click', () => editData(item.tanggal));

        const btnDelete = document.createElement('button');
        btnDelete.className = 'btn btn-danger btn-sm ms-1';
        btnDelete.textContent = '🗑 Hapus';
        btnDelete.type = 'button';
        btnDelete.addEventListener('click', () => deleteData(item.tanggal));

        tdAction.appendChild(btnEdit);
        tdAction.appendChild(btnDelete);
        tr.appendChild(tdAction);

        tbody.appendChild(tr);
    });
}

// ==========================================
// SUBMIT FORM
// ==========================================
async function submitForm(event) {
    event.preventDefault();

    try {
        const tanggal = document.getElementById('tanggal').value;
        const stblkk = parseInt(document.getElementById('stblkk').value) || 0;
        const pb = parseInt(document.getElementById('pb').value) || 0;
        const asuransiBaru = parseInt(document.getElementById('asuransiBaru').value) || 0;
        const asuransiLama = parseInt(document.getElementById('asuransiLama').value) || 0;
        const bbmSubsidi = parseInt(document.getElementById('bbmSubsidi').value) || 0;
        const bbmNonSurat = parseInt(document.getElementById('bbmNonSurat').value) || 0;

        if (!tanggal) {
            alert('Tanggal harus diisi!');
            return;
        }

        const payload = {
            tanggal,
            stblkk,
            pb,
            asuransi_baru: asuransiBaru,
            asuransi_lama: asuransiLama,
            bbm_subsidi_surat: bbmSubsidi,
            bbm_non_surat: bbmNonSurat
        };

        const response = await fetch('/api/laporan-harian', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        showAlert('✅ Data berhasil disimpan!', 'success');
        document.getElementById('formLaporan').reset();
        loadLaporanData();

    } catch (error) {
        console.error('Error:', error);
        showAlert('❌ Error: ' + error.message, 'danger');
    }
}

// ==========================================
// EDIT DATA
// ==========================================
async function editData(tanggal) {
    try {
        const response = await fetch(`/api/laporan-harian/detail/${tanggal}`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        const data = result.data;

        // Populate form
        document.getElementById('tanggal').value = data.tanggal;
        document.getElementById('stblkk').value = data.stblkk || 0;
        document.getElementById('pb').value = data.pb || 0;
        document.getElementById('asuransiBaru').value = data.asuransi_baru || 0;
        document.getElementById('asuransiLama').value = data.asuransi_lama || 0;
        document.getElementById('bbmSubsidi').value = data.bbm_subsidi_surat || 0;
        document.getElementById('bbmNonSurat').value = data.bbm_non_surat || 0;

        // Scroll to form
        document.getElementById('formLaporan').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Error:', error);
        showAlert('Gagal memuat data: ' + error.message, 'danger');
    }
}

// ==========================================
// DELETE DATA
// ==========================================
async function deleteData(tanggal) {
    if (!confirm(`Hapus data ${formatDate(tanggal)}?`)) {
        return;
    }

    try {
        const response = await fetch(`/api/laporan-harian/${tanggal}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        showAlert('✅ Data berhasil dihapus!', 'success');
        loadLaporanData();

    } catch (error) {
        console.error('Error:', error);
        showAlert('❌ Error: ' + error.message, 'danger');
    }
}

// ==========================================
// SHOW ALERT
// ==========================================
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    const wrapper = document.createElement('div');
    wrapper.className = `alert alert-${type} alert-dismissible fade show`;
    wrapper.setAttribute('role', 'alert');

    const text = document.createElement('span');
    text.textContent = message;
    wrapper.appendChild(text);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-close';
    btn.setAttribute('data-bs-dismiss','alert');
    btn.setAttribute('aria-label','Close');
    wrapper.appendChild(btn);

    alertContainer.appendChild(wrapper);

    // Auto remove after 5 seconds for non-danger
    if (type !== 'danger') {
        setTimeout(() => {
            if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
        }, 5000);
    }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: '2-digit'
    });
}
