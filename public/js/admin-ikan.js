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
        tbody.innerHTML = '';
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.setAttribute('colspan','5');
        td.className = 'text-center text-muted';
        td.textContent = 'Belum ada data ikan';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }
    tbody.innerHTML = '';
    data.forEach(item => {
        const tr = document.createElement('tr');

        const tdFoto = document.createElement('td');
        if (item.foto) {
            const img = document.createElement('img');
            img.src = item.foto;
            img.alt = item.nama_ikan || '';
            img.style.maxWidth = '50px';
            img.style.maxHeight = '50px';
            img.style.borderRadius = '4px';
            tdFoto.appendChild(img);
        } else {
            const span = document.createElement('span');
            span.className = 'badge bg-secondary';
            span.textContent = 'Tidak ada foto';
            tdFoto.appendChild(span);
        }
        tr.appendChild(tdFoto);

        const tdNama = document.createElement('td');
        const strong = document.createElement('strong');
        strong.textContent = item.nama_ikan || '-';
        tdNama.appendChild(strong);
        tr.appendChild(tdNama);

        const tdJumlah = document.createElement('td');
        tdJumlah.className = 'text-end';
        tdJumlah.textContent = (item.jumlah || 0) + ' ekor';
        tr.appendChild(tdJumlah);

        const tdTanggal = document.createElement('td');
        const tanggal = new Date(item.created_at).toLocaleDateString('id-ID', {
            year: 'numeric', month: 'short', day: '2-digit'
        });
        tdTanggal.textContent = tanggal;
        tr.appendChild(tdTanggal);

        const tdAction = document.createElement('td');
        tdAction.className = 'text-center';
        const btnEdit = document.createElement('button');
        btnEdit.className = 'btn btn-primary btn-sm';
        btnEdit.type = 'button';
        btnEdit.textContent = '✎ Edit';
        btnEdit.addEventListener('click', () => editIkan(item.id));
        const btnDel = document.createElement('button');
        btnDel.className = 'btn btn-danger btn-sm ms-1';
        btnDel.type = 'button';
        btnDel.textContent = '🗑 Hapus';
        btnDel.addEventListener('click', () => deleteIkan(item.id));
        tdAction.appendChild(btnEdit);
        tdAction.appendChild(btnDel);
        tr.appendChild(tdAction);

        tbody.appendChild(tr);
    });
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
            previewDiv.innerHTML = '';
            const wrapper = document.createElement('div');
            wrapper.className = 'mb-3';
            const label = document.createElement('label');
            label.className = 'text-muted';
            label.textContent = 'Foto saat ini:';
            const img = document.createElement('img');
            img.src = data.foto;
            img.alt = data.nama_ikan || '';
            img.style.maxWidth = '150px';
            img.style.maxHeight = '150px';
            img.style.borderRadius = '4px';
            img.style.marginTop = '0.5rem';
            wrapper.appendChild(label);
            wrapper.appendChild(img);
            previewDiv.appendChild(wrapper);
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
    document.getElementById('previewFoto').textContent = '';
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
            previewDiv.innerHTML = '';
            const wrapper = document.createElement('div');
            wrapper.className = 'mb-3';
            const label = document.createElement('label');
            label.className = 'text-muted';
            label.textContent = 'Preview Foto:';
            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = 'preview';
            img.style.maxWidth = '150px';
            img.style.maxHeight = '150px';
            img.style.borderRadius = '4px';
            img.style.marginTop = '0.5rem';
            wrapper.appendChild(label);
            wrapper.appendChild(img);
            previewDiv.appendChild(wrapper);
        };
        reader.readAsDataURL(file);
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

    if (type !== 'danger') {
        setTimeout(() => {
            const el = wrapper;
            if (el && el.parentNode) el.parentNode.removeChild(el);
        }, 5000);
    }
}
