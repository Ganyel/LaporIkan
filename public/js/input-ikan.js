// ==========================================
// INITIALIZE
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
    loadIkanDataList();
    
    // Setup navbar
    const username = localStorage.getItem('adminUsername') || 'Admin';
    const navbarBrand = document.querySelector('.navbar-brand small');
    if (navbarBrand && username !== 'Admin') {
        navbarBrand.textContent = `Selamat datang, ${username}`;
    }
    
    // Event listener untuk preview foto
    document.getElementById('fotoIkan').addEventListener('change', function (e) {
        previewFoto(e);
    });

    // Update preview saat user mengetik
    document.getElementById('namaIkan').addEventListener('input', updatePreview);
    document.getElementById('jumlahIkan').addEventListener('input', updatePreview);
});

// ==========================================
// SUBMIT FORM IKAN
// ==========================================
async function submitFormIkan(event) {
    event.preventDefault();

    try {
        const namaIkan = document.getElementById('namaIkan').value.trim();
        const jumlahIkan = parseInt(document.getElementById('jumlahIkan').value);
        const fotoInput = document.getElementById('fotoIkan');
        const idIkanEdit = document.getElementById('formIkan').getAttribute('data-id-edit');

        // Validasi
        if (!namaIkan) {
            showAlert('❌ Nama ikan tidak boleh kosong!', 'danger');
            return;
        }

        if (jumlahIkan <= 0) {
            showAlert('❌ Jumlah ikan harus lebih dari 0!', 'danger');
            return;
        }

        let foto = null;

        // Handle file upload jika ada
        if (fotoInput.files.length > 0) {
            const file = fotoInput.files[0];
            
            // Validasi ukuran (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showAlert('❌ Ukuran foto terlalu besar (max 5MB)', 'danger');
                return;
            }

            // Convert ke base64
            const reader = new FileReader();
            foto = await new Promise((resolve) => {
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(file);
            });
        }

        const payload = {
            nama_ikan: namaIkan,
            jumlah: jumlahIkan,
            foto: foto
        };

        let response, method = 'POST', url = '/api/ikan';

        // Jika edit mode
        if (idIkanEdit) {
            method = 'PUT';
            url = `/api/ikan/${idIkanEdit}`;
        }

        response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        showAlert(
            idIkanEdit 
                ? '✅ Data ikan berhasil diupdate!' 
                : '✅ Data ikan berhasil ditambahkan!', 
            'success'
        );
        resetFormIkan();
        loadIkanDataList();

    } catch (error) {
        console.error('Error:', error);
        showAlert('❌ Error: ' + error.message, 'danger');
    }
}

// ==========================================
// LOAD IKAN DATA LIST
// ==========================================
async function loadIkanDataList() {
    try {
        const response = await fetch('/api/ikan');
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        const data = result.data;
        displayIkanTable(data);
        updateStatistics(data);

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('tableIkanBody').innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">Error: ${error.message}</td>
            </tr>
        `;
        showAlert('Gagal memuat data ikan: ' + error.message, 'danger');
    }
}

// ==========================================
// DISPLAY IKAN TABLE
// ==========================================
function displayIkanTable(data) {
    const tbody = document.getElementById('tableIkanBody');
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Belum ada data ikan</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(item => {
        const fotoHtml = item.foto 
            ? `<img src="${item.foto}" alt="${item.nama_ikan}" style="max-width: 50px; max-height: 50px; border-radius: 4px;">`
            : '<span class="badge bg-secondary">Tidak ada foto</span>';
        
        const tanggal = new Date(item.created_at).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        });

        return `
            <tr>
                <td>${fotoHtml}</td>
                <td><strong>${item.nama_ikan}</strong></td>
                <td class="text-end"><strong>${item.jumlah}</strong> ekor</td>
                <td><small>${tanggal}</small></td>
                <td class="text-center">
                    <button class="btn btn-primary btn-sm" onclick="editIkan(${item.id})">✎ Edit</button>
                    <button class="btn btn-danger btn-sm ms-1" onclick="deleteIkan(${item.id})">🗑 Hapus</button>
                </td>
            </tr>
        `;
    }).join('');
}

// ==========================================
// UPDATE STATISTICS
// ==========================================
function updateStatistics(data) {
    const totalJenis = data.length;
    const totalEkor = data.reduce((sum, item) => sum + parseInt(item.jumlah), 0);

    document.getElementById('statTotal').textContent = totalJenis;
    document.getElementById('statEkor').textContent = totalEkor.toLocaleString('id-ID');
}

// ==========================================
// EDIT IKAN
// ==========================================
async function editIkan(id) {
    try {
        const response = await fetch(`/api/ikan/${id}`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        const data = result.data;

        // Populate form
        document.getElementById('namaIkan').value = data.nama_ikan;
        document.getElementById('jumlahIkan').value = data.jumlah;
        document.getElementById('formIkan').setAttribute('data-id-edit', id);

        // Tampilkan info edit
        document.getElementById('editInfo').style.display = 'block';

        // Preview foto jika ada
        if (data.foto) {
            const previewDiv = document.getElementById('previewFoto');
            previewDiv.innerHTML = `
                <div class="mb-3">
                    <label class="form-label">Foto saat ini:</label>
                    <div style="position: relative; display: inline-block;">
                        <img src="${data.foto}" alt="${data.nama_ikan}" style="max-width: 100%; max-height: 200px; border-radius: 4px; margin-top: 0.5rem;">
                        <button type="button" class="btn btn-danger btn-sm" style="position: absolute; top: 0; right: 0;" onclick="removeFoto()">✕</button>
                    </div>
                </div>
            `;
        }

        updatePreview();

        // Scroll ke form
        document.getElementById('formIkan').scrollIntoView({ behavior: 'smooth' });
        showAlert('✏️ Mode Edit - Ubah data dan klik Simpan', 'info');

    } catch (error) {
        console.error('Error:', error);
        showAlert('Gagal memuat data: ' + error.message, 'danger');
    }
}

// ==========================================
// DELETE IKAN
// ==========================================
async function deleteIkan(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus ikan ini? Tindakan ini tidak dapat dibatalkan.')) {
        return;
    }

    try {
        const response = await fetch(`/api/ikan/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        showAlert('✅ Ikan berhasil dihapus!', 'success');
        loadIkanDataList();

    } catch (error) {
        console.error('Error:', error);
        showAlert('❌ Error: ' + error.message, 'danger');
    }
}

// ==========================================
// RESET FORM IKAN
// ==========================================
function resetFormIkan() {
    document.getElementById('formIkan').reset();
    document.getElementById('formIkan').removeAttribute('data-id-edit');
    document.getElementById('previewFoto').innerHTML = '';
    document.getElementById('editInfo').style.display = 'none';
    document.getElementById('infoContent').innerHTML = `
        <p class="text-muted">Isi form di sebelah kiri untuk melihat preview data</p>
        <div style="font-size: 4rem; color: #ccc;">🐟</div>
    `;
}

// ==========================================
// PREVIEW FOTO
// ==========================================
function previewFoto(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const previewDiv = document.getElementById('previewFoto');
            previewDiv.innerHTML = `
                <div class="mb-3">
                    <label class="form-label">Preview Foto:</label>
                    <div style="position: relative; display: inline-block;">
                        <img src="${e.target.result}" alt="preview" style="max-width: 100%; max-height: 200px; border-radius: 4px; margin-top: 0.5rem;">
                        <button type="button" class="btn btn-danger btn-sm" style="position: absolute; top: 0; right: 0;" onclick="removeFoto()">✕</button>
                    </div>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }
}

// ==========================================
// REMOVE FOTO
// ==========================================
function removeFoto() {
    document.getElementById('fotoIkan').value = '';
    document.getElementById('previewFoto').innerHTML = '';
}

// ==========================================
// UPDATE PREVIEW INFO
// ==========================================
function updatePreview() {
    const namaIkan = document.getElementById('namaIkan').value.trim();
    const jumlahIkan = document.getElementById('jumlahIkan').value;

    if (!namaIkan || !jumlahIkan) {
        document.getElementById('infoContent').innerHTML = `
            <p class="text-muted">Isi form untuk melihat preview data</p>
            <div style="font-size: 4rem; color: #ccc;">🐟</div>
        `;
        return;
    }

    document.getElementById('infoContent').innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 1rem;">🐟</div>
        <h5>${namaIkan}</h5>
        <div style="font-size: 2.5rem; font-weight: bold; color: #10b981; margin: 1rem 0;">
            ${jumlahIkan}
        </div>
        <small class="text-muted">ekor ikan</small>
    `;
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
