// ==========================================
// GLOBAL VARIABLES
// ==========================================
let allIkanData = [];
let chartIkan, chartProporsi;

// ==========================================
// INITIALIZE
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
    loadIkanData();
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

        allIkanData = result.data;
        updateStatistics(allIkanData);
        displayIkanTable(allIkanData);
        displayGridView(allIkanData);
        drawCharts(allIkanData);

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
    }
}

// ==========================================
// UPDATE STATISTICS
// ==========================================
function updateStatistics(data) {
    if (data.length === 0) {
        document.getElementById('statJenis').textContent = '0';
        document.getElementById('statTotal').textContent = '0';
        document.getElementById('statRata').textContent = '0';
        document.getElementById('statTerbanyak').textContent = '-';
        return;
    }

    // Total jenis
    const totalJenis = data.length;
    
    // Total ekor
    const totalEkor = data.reduce((sum, item) => sum + parseInt(item.jumlah), 0);
    
    // Rata-rata
    const rataRata = Math.round(totalEkor / totalJenis);
    
    // Jenis terbanyak
    const terbanyak = data.reduce((max, item) => 
        parseInt(item.jumlah) > parseInt(max.jumlah) ? item : max
    );

    document.getElementById('statJenis').textContent = totalJenis;
    document.getElementById('statTotal').textContent = totalEkor.toLocaleString('id-ID');
    document.getElementById('statRata').textContent = rataRata;
    document.getElementById('statTerbanyak').textContent = terbanyak.nama_ikan;
}

// ==========================================
// DISPLAY GRID VIEW
// ==========================================
function displayGridView(data) {
    const gridDiv = document.getElementById('gridIkan');
    gridDiv.innerHTML = '';
    if (!data || data.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'col-12 text-center text-muted';
        empty.textContent = 'Tidak ada data ikan';
        gridDiv.appendChild(empty);
        return;
    }

    data.forEach(item => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 mb-4';

        const card = document.createElement('div');
        card.className = 'card h-100';
        card.style.border = 'none';
        card.style.boxShadow = 'var(--shadow-md)';
        card.style.transition = 'all 0.3s ease';

        if (item.foto) {
            const img = document.createElement('img');
            img.src = item.foto;
            img.alt = item.nama_ikan || '';
            img.style.width = '100%';
            img.style.height = '150px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '8px 8px 0 0';
            card.appendChild(img);
        } else {
            const placeholder = document.createElement('div');
            placeholder.style.width = '100%';
            placeholder.style.height = '150px';
            placeholder.style.background = 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)';
            placeholder.style.borderRadius = '8px 8px 0 0';
            placeholder.style.display = 'flex';
            placeholder.style.alignItems = 'center';
            placeholder.style.justifyContent = 'center';
            placeholder.style.color = 'white';
            placeholder.style.fontSize = '2rem';
            placeholder.textContent = '🐟';
            card.appendChild(placeholder);
        }

        const body = document.createElement('div');
        body.className = 'card-body';
        const h5 = document.createElement('h5');
        h5.className = 'card-title text-primary';
        h5.textContent = item.nama_ikan;
        const p = document.createElement('p');
        p.className = 'card-text mb-2';
        const strong = document.createElement('strong');
        strong.textContent = item.jumlah;
        p.appendChild(strong);
        const span = document.createElement('span');
        span.className = 'text-muted';
        span.textContent = ' ekor';
        p.appendChild(span);
        const small = document.createElement('small');
        small.className = 'text-muted';
        small.textContent = 'Input: ' + formatDate(item.created_at);

        body.appendChild(h5);
        body.appendChild(p);
        body.appendChild(small);
        card.appendChild(body);

        col.appendChild(card);
        gridDiv.appendChild(col);
    });
}

// ==========================================
// DISPLAY IKAN TABLE
// ==========================================
function displayIkanTable(data) {
    const tbody = document.getElementById('tableIkanBody');
    tbody.innerHTML = '';
    if (!data || data.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.setAttribute('colspan','5');
        td.className = 'text-center text-muted';
        td.textContent = 'Tidak ada data ikan';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    const totalEkor = data.reduce((sum, item) => sum + parseInt(item.jumlah), 0);

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
        tdJumlah.textContent = item.jumlah;
        tr.appendChild(tdJumlah);

        const tdPersen = document.createElement('td');
        tdPersen.className = 'text-end';
        const persentase = ((parseInt(item.jumlah) / totalEkor) * 100).toFixed(1);
        tdPersen.textContent = persentase + '%';
        tr.appendChild(tdPersen);

        const tdTanggal = document.createElement('td');
        const tanggal = new Date(item.created_at).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        });
        tdTanggal.textContent = tanggal;
        tr.appendChild(tdTanggal);

        tbody.appendChild(tr);
    });
}

// ==========================================
// DRAW CHARTS
// ==========================================
function drawCharts(data) {
    if (data.length === 0) return;

    const labels = data.map(item => item.nama_ikan);
    const values = data.map(item => parseInt(item.jumlah));

    // Chart Bar - Perbandingan Jumlah
    drawBarChart(labels, values);

    // Chart Pie - Proporsi
    drawPieChart(labels, values);
}

// ==========================================
// DRAW BAR CHART
// ==========================================
function drawBarChart(labels, values) {
    const ctx = document.getElementById('chartIkan').getContext('2d');
    
    if (chartIkan) {
        chartIkan.destroy();
    }

    const colors = [
        '#1e3a8a', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
        '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#84cc16'
    ];

    chartIkan = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Jumlah Ikan (ekor)',
                data: values,
                backgroundColor: colors.slice(0, labels.length).map((c, i) => {
                    // Gradient colors
                    return c;
                }),
                borderColor: colors.slice(0, labels.length).map(c => c.replace('8', '9')),
                borderWidth: 2,
                borderRadius: 8,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: labels.length > 6 ? 'y' : 'x',
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 13,
                            weight: 'bold'
                        },
                        color: '#333'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: 12,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y + ' ekor';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: true
                    },
                    ticks: {
                        callback: function(value) {
                            return value;
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ==========================================
// DRAW PIE CHART
// ==========================================
function drawPieChart(labels, values) {
    const ctx = document.getElementById('chartProporsi').getContext('2d');
    
    if (chartProporsi) {
        chartProporsi.destroy();
    }

    const colors = [
        '#1e3a8a', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
        '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#84cc16',
        '#f97316', '#06b6d4', '#a855f7', '#d946ef'
    ];

    chartProporsi = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, labels.length),
                borderColor: 'white',
                borderWidth: 3,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        color: '#333'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: 12,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return context.label + ': ' + context.parsed + ' ekor (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

// ==========================================
// APPLY SEARCH
// ==========================================
function applySearch() {
    const searchTerm = document.getElementById('searchIkan').value.toLowerCase();
    
    if (!searchTerm) {
        loadIkanData();
        return;
    }

    const filtered = allIkanData.filter(item => 
        item.nama_ikan.toLowerCase().includes(searchTerm)
    );

    updateStatistics(filtered);
    displayIkanTable(filtered);
    displayGridView(filtered);
    drawCharts(filtered);
}

// ==========================================
// SORT DATA
// ==========================================
function sortData() {
    const sortValue = document.getElementById('sortIkan').value;
    let sorted = [...allIkanData];

    if (sortValue === 'asc') {
        sorted.sort((a, b) => parseInt(a.jumlah) - parseInt(b.jumlah));
    } else if (sortValue === 'desc') {
        sorted.sort((a, b) => parseInt(b.jumlah) - parseInt(a.jumlah));
    } else if (sortValue === 'nama') {
        sorted.sort((a, b) => a.nama_ikan.localeCompare(b.nama_ikan));
    }

    displayIkanTable(sorted);
    displayGridView(sorted);
    drawCharts(sorted);
}

// ==========================================
// FORMAT DATE
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
