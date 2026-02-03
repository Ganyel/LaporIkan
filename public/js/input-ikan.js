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
        const tbody = document.getElementById('tableIkanBody');
        tbody.innerHTML = '';
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.setAttribute('colspan', '5');
        td.className = 'text-center text-danger';
        td.textContent = `Error: ${error.message}`;
        tr.appendChild(td);
        tbody.appendChild(tr);
        showAlert('Gagal memuat data ikan: ' + error.message, 'danger');
    }
}

// ==========================================
// DISPLAY IKAN TABLE
// ==========================================
function displayIkanTable(data) {
    const tbody = document.getElementById('tableIkanBody');
    
    // Clear
    tbody.innerHTML = '';
    if (!data || data.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.setAttribute('colspan','5');
        td.className = 'text-center text-muted py-4';
        td.textContent = 'Belum ada data ikan';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

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
        const strongJumlah = document.createElement('strong');
        strongJumlah.textContent = item.jumlah || 0;
        tdJumlah.appendChild(strongJumlah);
        tdJumlah.appendChild(document.createTextNode(' ekor'));
        tr.appendChild(tdJumlah);

        const tdTanggal = document.createElement('td');
        const tanggal = new Date(item.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: '2-digit' });
        const small = document.createElement('small');
        small.textContent = tanggal;
        tdTanggal.appendChild(small);
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
            previewDiv.innerHTML = '';
            const wrapper = document.createElement('div');
            wrapper.className = 'mb-3';
            const label = document.createElement('label');
            label.className = 'form-label';
            label.textContent = 'Foto saat ini:';
            const holder = document.createElement('div');
            holder.style.position = 'relative';
            holder.style.display = 'inline-block';
            const img = document.createElement('img');
            img.src = data.foto;
            img.alt = data.nama_ikan || '';
            img.style.maxWidth = '100%';
            img.style.maxHeight = '200px';
            img.style.borderRadius = '4px';
            img.style.marginTop = '0.5rem';
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn btn-danger btn-sm';
            btn.style.position = 'absolute';
            btn.style.top = '0';
            btn.style.right = '0';
            btn.textContent = '✕';
            btn.addEventListener('click', removeFoto);
            holder.appendChild(img);
            holder.appendChild(btn);
            wrapper.appendChild(label);
            wrapper.appendChild(holder);
            previewDiv.appendChild(wrapper);
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
    document.getElementById('previewFoto').textContent = '';
    document.getElementById('editInfo').style.display = 'none';
    const info = document.getElementById('infoContent');
    if (info) {
        info.innerHTML = '';
        const p = document.createElement('p');
        p.className = 'text-muted';
        p.textContent = 'Isi form di sebelah kiri untuk melihat preview data';
        const div = document.createElement('div');
        div.style.fontSize = '4rem';
        div.style.color = '#ccc';
        div.textContent = '🐟';
        info.appendChild(p);
        info.appendChild(div);
    }
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
            label.className = 'form-label';
            label.textContent = 'Preview Foto:';
            wrapper.appendChild(label);
            const holder = document.createElement('div');
            holder.style.position = 'relative';
            holder.style.display = 'inline-block';
            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = 'preview';
            img.style.maxWidth = '100%';
            img.style.maxHeight = '200px';
            img.style.borderRadius = '4px';
            img.style.marginTop = '0.5rem';
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn btn-danger btn-sm';
            btn.style.position = 'absolute';
            btn.style.top = '0';
            btn.style.right = '0';
            btn.textContent = '✕';
            btn.addEventListener('click', removeFoto);
            holder.appendChild(img);
            holder.appendChild(btn);
            wrapper.appendChild(holder);
            previewDiv.appendChild(wrapper);
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
        const info = document.getElementById('infoContent');
        if (info) {
            info.innerHTML = '';
            const p = document.createElement('p');
            p.className = 'text-muted';
            p.textContent = 'Isi form untuk melihat preview data';
            const div = document.createElement('div');
            div.style.fontSize = '4rem';
            div.style.color = '#ccc';
            div.textContent = '🐟';
            info.appendChild(p);
            info.appendChild(div);
        }
        return;
    }

    const info = document.getElementById('infoContent');
    info.innerHTML = '';
    const icon = document.createElement('div');
    icon.style.fontSize = '3rem';
    icon.style.marginBottom = '1rem';
    icon.textContent = '🐟';
    const h5 = document.createElement('h5');
    h5.textContent = namaIkan;
    const countDiv = document.createElement('div');
    countDiv.style.fontSize = '2.5rem';
    countDiv.style.fontWeight = 'bold';
    countDiv.style.color = '#10b981';
    countDiv.style.margin = '1rem 0';
    countDiv.textContent = jumlahIkan;
    const small = document.createElement('small');
    small.className = 'text-muted';
    small.textContent = 'ekor ikan';
    info.appendChild(icon);
    info.appendChild(h5);
    info.appendChild(countDiv);
    info.appendChild(small);
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
            if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
        }, 5000);
    }
}
