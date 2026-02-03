// ==========================================
// INITIALIZE
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
    loadIkanData();
    
    // Event listener untuk preview foto
    document.getElementById('fotoIkan').addEventListener('change', function (e) {
        previewFoto(e);
    });
});

// ==========================================
// LOAD IKAN DATA
// ==========================================
async function loadIkanData() {
    try {
        const response = await fetch('/api/ikan');
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        const data = result.data;
        displayIkanTable(data);

    } catch (error) {
        console.error('Error:', error);
        showAlert('Gagal memuat data ikan: ' + error.message, 'danger');
    }
}

// ==========================================
// DISPLAY IKAN TABLE
// ==========================================
function displayIkanTable(data) {
    const tbody = document.getElementById('tableIkanBody');
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Belum ada data ikan</td></tr>';
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
                <td class="text-end">${item.jumlah} ekor</td>
                <td>${tanggal}</td>
                <td class="text-center">
                    <button class="btn btn-primary btn-sm" onclick="editIkan(${item.id})">✎ Edit</button>
                    <button class="btn btn-danger btn-sm ms-1" onclick="deleteIkan(${item.id})">🗑 Hapus</button>
                </td>
            </tr>
        `;
    }).join('');
}

// ==========================================
// SUBMIT FORM IKAN
// ==========================================
async function submitFormIkan(event) {
    event.preventDefault();

    try {
        const namaIkan = document.getElementById('namaIkan').value;
        const jumlahIkan = parseInt(document.getElementById('jumlahIkan').value);
        const fotoInput = document.getElementById('fotoIkan');
        const idIkanEdit = document.getElementById('formIkan').getAttribute('data-id-edit');

        let foto = null;

        // Handle file upload jika ada
        if (fotoInput.files.length > 0) {
            const file = fotoInput.files[0];
            
            // Validasi ukuran (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showAlert('Ukuran foto terlalu besar (max 5MB)', 'danger');
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

        showAlert(idIkanEdit ? '✅ Ikan berhasil diupdate!' : '✅ Ikan berhasil ditambahkan!', 'success');
        resetFormIkan();
        loadIkanData();

    } catch (error) {
        console.error('Error:', error);
        showAlert('❌ Error: ' + error.message, 'danger');
    }
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

        // Preview foto jika ada
        if (data.foto) {
            const previewDiv = document.getElementById('previewFoto');
            previewDiv.innerHTML = `
                <div class="mb-3">
                    <label class="text-muted">Foto saat ini:</label>
                    <img src="${data.foto}" alt="${data.nama_ikan}" style="max-width: 150px; max-height: 150px; border-radius: 4px; margin-top: 0.5rem;">
                </div>
            `;
        }

        // Scroll ke form
        document.getElementById('formIkan').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Error:', error);
        showAlert('Gagal memuat data: ' + error.message, 'danger');
    }
}

// ==========================================
// DELETE IKAN
// ==========================================
async function deleteIkan(id) {
    if (!confirm('Hapus ikan ini?')) {
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
        loadIkanData();

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
                    <label class="text-muted">Preview Foto:</label>
                    <img src="${e.target.result}" alt="preview" style="max-width: 150px; max-height: 150px; border-radius: 4px; margin-top: 0.5rem;">
                </div>
            `;
        };
        reader.readAsDataURL(file);
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
