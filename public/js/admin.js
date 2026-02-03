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
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Belum ada data</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(item => `
        <tr>
            <td><strong>${formatDate(item.tanggal)}</strong></td>
            <td class="text-end">${item.stblkk || 0}</td>
            <td class="text-end">${item.pb || 0}</td>
            <td class="text-end">${item.asuransi_baru || 0}</td>
            <td class="text-end">${item.asuransi_lama || 0}</td>
            <td class="text-end">${item.bbm_subsidi_surat || 0}</td>
            <td class="text-end">${item.bbm_non_surat || 0}</td>
            <td class="text-center">
                <button class="btn btn-primary btn-sm" onclick="editData('${item.tanggal}')">✎ Edit</button>
                <button class="btn btn-danger btn-sm ms-1" onclick="deleteData('${item.tanggal}')">🗑 Hapus</button>
            </td>
        </tr>
    `).join('');
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
    const alertId = 'alert-' + Date.now();
    
    const alertHtml = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;

    alertContainer.insertAdjacentHTML('beforeend', alertHtml);

    // Auto remove after 5 seconds
    setTimeout(() => {
        const element = document.getElementById(alertId);
        if (element) {
            element.remove();
        }
    }, 5000);
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
