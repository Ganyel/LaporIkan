// ==========================================
// GLOBAL VARIABLES
// ==========================================
let chartHarian, chartBulanan, chartTahunan;
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// ==========================================
// INITIALIZE
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
    // Wait untuk canvas element available
    setTimeout(() => {
        loadDashboardData();
    }, 100);
    
    // Reload data saat tab berubah
    const tabsElement = document.getElementById('dashboardTabs');
    if (tabsElement) {
        tabsElement.addEventListener('shown.bs.tab', function (e) {
            if (e.target.id === 'tabBulanan-tab') {
                setTimeout(() => loadDataBulanan(), 100);
            } else if (e.target.id === 'tabTahunan-tab') {
                setTimeout(() => loadDataTahunan(), 100);
            }
        });
    }
});

// ==========================================
// HELPER: Check Canvas Element
// ==========================================
function ensureCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas dengan id '${canvasId}' tidak ditemukan`);
        return null;
    }
    return canvas;
}

// ==========================================
// FILTER FUNCTION
// ==========================================
async function applyFilter() {
    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;

    if (!startDate || !endDate) {
        alert('Pilih rentang tanggal terlebih dahulu');
        return;
    }

    await loadDashboardData(startDate, endDate);
}

// ==========================================
// LOAD DASHBOARD DATA (HARIAN)
// ==========================================
async function loadDashboardData(startDate = null, endDate = null) {
    try {
        // Set default range jika tidak ada filter
        if (!startDate || !endDate) {
            const today = new Date();
            endDate = today.toISOString().split('T')[0];
            
            const start = new Date(today);
            start.setDate(start.getDate() - 30);
            startDate = start.toISOString().split('T')[0];
            
            document.getElementById('filterStartDate').value = startDate;
            document.getElementById('filterEndDate').value = endDate;
        }

        const response = await fetch(`/api/laporan-harian?start=${startDate}&end=${endDate}`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        const data = result.data;

        // Update statistics
        updateStatistics(data);

        // Load and display harian data
        await loadDataHarian(startDate, endDate);

    } catch (error) {
        console.error('Error:', error);
        alert('Gagal memuat data: ' + error.message);
    }
}

// ==========================================
// UPDATE STATISTICS
// ==========================================
function updateStatistics(data) {
    const stats = {
        stblkk: 0,
        pb: 0,
        asuransi: 0,
        bbm: 0
    };

    data.forEach(item => {
        stats.stblkk += parseInt(item.stblkk) || 0;
        stats.pb += parseInt(item.pb) || 0;
        stats.asuransi += (parseInt(item.asuransi_baru) || 0) + (parseInt(item.asuransi_lama) || 0);
        stats.bbm += (parseInt(item.bbm_subsidi_surat) || 0) + (parseInt(item.bbm_non_surat) || 0);
    });

    document.getElementById('statSTBLKK').textContent = stats.stblkk.toLocaleString('id-ID');
    document.getElementById('statPB').textContent = stats.pb.toLocaleString('id-ID');
    document.getElementById('statAsuransi').textContent = stats.asuransi.toLocaleString('id-ID');
    document.getElementById('statBBM').textContent = stats.bbm.toLocaleString('id-ID');
}

// ==========================================
// LOAD DATA HARIAN
// ==========================================
async function loadDataHarian(startDate, endDate) {
    try {
        const response = await fetch(`/api/laporan-harian?start=${startDate}&end=${endDate}`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        const data = result.data;

        // Display table
        displayTableHarian(data);

        // Draw chart
        drawChartHarian(data);

    } catch (error) {
        console.error('Error:', error);
    }
}

// ==========================================
// DISPLAY TABLE HARIAN
// ==========================================
function displayTableHarian(data) {
    const tbody = document.getElementById('tableHarianBody');
    tbody.innerHTML = '';
    if (!data || data.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.setAttribute('colspan','7');
        td.className = 'text-center text-muted';
        td.textContent = 'Tidak ada data';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    data.forEach(item => {
        const tr = document.createElement('tr');
        const tdTanggal = document.createElement('td');
        tdTanggal.textContent = formatDate(item.tanggal);
        tr.appendChild(tdTanggal);

        const addNumberCell = (value) => {
            const td = document.createElement('td');
            td.className = 'text-end';
            td.textContent = value || 0;
            tr.appendChild(td);
        };

        addNumberCell(item.stblkk || 0);
        addNumberCell(item.pb || 0);
        addNumberCell(item.asuransi_baru || 0);
        addNumberCell(item.asuransi_lama || 0);
        addNumberCell(item.bbm_subsidi_surat || 0);
        addNumberCell(item.bbm_non_surat || 0);

        tbody.appendChild(tr);
    });
}

// ==========================================
// DRAW CHART HARIAN
// ==========================================
function drawChartHarian(data) {
    try {
        const canvas = ensureCanvas('chartHarian');
        if (!canvas) return;

        const dates = data.map(item => formatDate(item.tanggal));
        
        // Extract data per kolom
        const stblkk = data.map(item => parseInt(item.stblkk) || 0);
        const pb = data.map(item => parseInt(item.pb) || 0);
        const asuransiBaru = data.map(item => parseInt(item.asuransi_baru) || 0);
        const asuransiLama = data.map(item => parseInt(item.asuransi_lama) || 0);
        const bbmSubsidi = data.map(item => parseInt(item.bbm_subsidi_surat) || 0);
        const bbmNonSurat = data.map(item => parseInt(item.bbm_non_surat) || 0);

        const ctx = canvas.getContext('2d');
        
        if (chartHarian) {
            chartHarian.destroy();
        }

        chartHarian = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'STBLKK',
                        data: stblkk,
                        backgroundColor: '#1e3a8a',
                        borderColor: '#1a2d6b',
                        borderWidth: 2
                    },
                    {
                        label: 'PB',
                        data: pb,
                        backgroundColor: '#3b82f6',
                        borderColor: '#1e40af',
                        borderWidth: 2
                    },
                    {
                        label: 'Asuransi Baru',
                        data: asuransiBaru,
                        backgroundColor: '#10b981',
                        borderColor: '#059669',
                        borderWidth: 2
                    },
                    {
                        label: 'Asuransi Lama',
                        data: asuransiLama,
                        backgroundColor: '#f59e0b',
                        borderColor: '#d97706',
                        borderWidth: 2
                    },
                    {
                        label: 'BBM Subsidi',
                        data: bbmSubsidi,
                        backgroundColor: '#ef4444',
                        borderColor: '#dc2626',
                        borderWidth: 2
                    },
                    {
                        label: 'BBM Non-Surat',
                        data: bbmNonSurat,
                        backgroundColor: '#8b5cf6',
                        borderColor: '#6d28d9',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
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
                        bodyFont: { size: 13 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        stacked: false,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        stacked: false,
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error drawing chart harian:', error);
    }
}

// ==========================================
// LOAD DATA BULANAN
// ==========================================
async function loadDataBulanan() {
    try {
        const year = document.getElementById('filterYear').value || new Date().getFullYear();
        const response = await fetch(`/api/laporan-harian/rekap/bulanan/${year}`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        const data = result.data;

        // Display table
        displayTableBulanan(data);

        // Draw chart
        drawChartBulanan(data);

    } catch (error) {
        console.error('Error:', error);
    }
}

// ==========================================
// DISPLAY TABLE BULANAN
// ==========================================
function displayTableBulanan(data) {
    const tbody = document.getElementById('tableBulanBody');
    tbody.innerHTML = '';
    if (!data || data.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.setAttribute('colspan','5');
        td.className = 'text-center text-muted';
        td.textContent = 'Tidak ada data';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    data.forEach(item => {
        const tr = document.createElement('tr');
        const bulan = monthNames[item.bulan - 1];
        const asuransi = (parseInt(item.asuransi_baru) || 0) + (parseInt(item.asuransi_lama) || 0);
        const bbm = (parseInt(item.bbm_subsidi_surat) || 0) + (parseInt(item.bbm_non_surat) || 0);

        const tdBulan = document.createElement('td');
        tdBulan.textContent = bulan;
        tr.appendChild(tdBulan);

        const tdStbl = document.createElement('td'); tdStbl.className = 'text-end'; tdStbl.textContent = item.stblkk || 0; tr.appendChild(tdStbl);
        const tdPb = document.createElement('td'); tdPb.className = 'text-end'; tdPb.textContent = item.pb || 0; tr.appendChild(tdPb);
        const tdAs = document.createElement('td'); tdAs.className = 'text-end'; tdAs.textContent = asuransi; tr.appendChild(tdAs);
        const tdBbm = document.createElement('td'); tdBbm.className = 'text-end'; tdBbm.textContent = bbm; tr.appendChild(tdBbm);

        tbody.appendChild(tr);
    });
}

// ==========================================
// DRAW CHART BULANAN
// ==========================================
function drawChartBulanan(data) {
    try {
        const canvas = ensureCanvas('chartBulanan');
        if (!canvas) return;

        const months = data.map(item => monthNames[item.bulan - 1]);
        
        const stblkk = data.map(item => parseInt(item.stblkk) || 0);
        const pb = data.map(item => parseInt(item.pb) || 0);
        const asuransiBaru = data.map(item => parseInt(item.asuransi_baru) || 0);
        const asuransiLama = data.map(item => parseInt(item.asuransi_lama) || 0);
        const bbmSubsidi = data.map(item => parseInt(item.bbm_subsidi_surat) || 0);
        const bbmNonSurat = data.map(item => parseInt(item.bbm_non_surat) || 0);

        const ctx = canvas.getContext('2d');
        
        if (chartBulanan) {
            chartBulanan.destroy();
        }

        chartBulanan = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'STBLKK',
                        data: stblkk,
                        backgroundColor: '#1e3a8a',
                        borderColor: '#1a2d6b',
                        borderWidth: 1
                    },
                    {
                        label: 'PB',
                        data: pb,
                        backgroundColor: '#3b82f6',
                        borderColor: '#1e40af',
                        borderWidth: 1
                    },
                    {
                        label: 'Asuransi Baru',
                        data: asuransiBaru,
                        backgroundColor: '#10b981',
                        borderColor: '#059669',
                        borderWidth: 1
                    },
                    {
                        label: 'Asuransi Lama',
                        data: asuransiLama,
                        backgroundColor: '#f59e0b',
                        borderColor: '#d97706',
                        borderWidth: 1
                    },
                    {
                        label: 'BBM Subsidi',
                        data: bbmSubsidi,
                        backgroundColor: '#ef4444',
                        borderColor: '#dc2626',
                        borderWidth: 1
                    },
                    {
                        label: 'BBM Non-Surat',
                        data: bbmNonSurat,
                        backgroundColor: '#8b5cf6',
                        borderColor: '#6d28d9',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
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
                        bodyFont: { size: 13 }
                    }
                },
                scales: {
                    y: {
                        stacked: false,
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        stacked: false,
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error drawing chart bulanan:', error);
    }
}

// ==========================================
// LOAD DATA TAHUNAN
// ==========================================
async function loadDataTahunan() {
    try {
        const response = await fetch('/api/laporan-harian/rekap/tahunan');
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        const data = result.data;

        // Display table
        displayTableTahunan(data);

        // Draw chart
        drawChartTahunan(data);

    } catch (error) {
        console.error('Error:', error);
    }
}

// ==========================================
// DISPLAY TABLE TAHUNAN
// ==========================================
function displayTableTahunan(data) {
    const tbody = document.getElementById('tableTahunBody');
    tbody.innerHTML = '';
    if (!data || data.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.setAttribute('colspan','5');
        td.className = 'text-center text-muted';
        td.textContent = 'Tidak ada data';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    data.forEach(item => {
        const tr = document.createElement('tr');
        const asuransi = (parseInt(item.asuransi_baru) || 0) + (parseInt(item.asuransi_lama) || 0);
        const bbm = (parseInt(item.bbm_subsidi_surat) || 0) + (parseInt(item.bbm_non_surat) || 0);

        const tdTahun = document.createElement('td'); tdTahun.textContent = item.tahun; tr.appendChild(tdTahun);
        const tdStbl = document.createElement('td'); tdStbl.className = 'text-end'; tdStbl.textContent = item.stblkk || 0; tr.appendChild(tdStbl);
        const tdPb = document.createElement('td'); tdPb.className = 'text-end'; tdPb.textContent = item.pb || 0; tr.appendChild(tdPb);
        const tdAs = document.createElement('td'); tdAs.className = 'text-end'; tdAs.textContent = asuransi; tr.appendChild(tdAs);
        const tdBbm = document.createElement('td'); tdBbm.className = 'text-end'; tdBbm.textContent = bbm; tr.appendChild(tdBbm);

        tbody.appendChild(tr);
    });
}

// ==========================================
// DRAW CHART TAHUNAN
// ==========================================
function drawChartTahunan(data) {
    try {
        const canvas = ensureCanvas('chartTahunan');
        if (!canvas) return;

        const years = data.map(item => item.tahun);
        
        const stblkk = data.map(item => parseInt(item.stblkk) || 0);
        const pb = data.map(item => parseInt(item.pb) || 0);
        const asuransiBaru = data.map(item => parseInt(item.asuransi_baru) || 0);
        const asuransiLama = data.map(item => parseInt(item.asuransi_lama) || 0);
        const bbmSubsidi = data.map(item => parseInt(item.bbm_subsidi_surat) || 0);
        const bbmNonSurat = data.map(item => parseInt(item.bbm_non_surat) || 0);

        const ctx = canvas.getContext('2d');
        
        if (chartTahunan) {
            chartTahunan.destroy();
        }

        chartTahunan = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'STBLKK',
                        data: stblkk,
                        backgroundColor: '#1e3a8a',
                        borderColor: '#1a2d6b',
                        borderWidth: 1
                    },
                    {
                        label: 'PB',
                        data: pb,
                        backgroundColor: '#3b82f6',
                        borderColor: '#1e40af',
                        borderWidth: 1
                    },
                    {
                        label: 'Asuransi Baru',
                        data: asuransiBaru,
                        backgroundColor: '#10b981',
                        borderColor: '#059669',
                        borderWidth: 1
                    },
                    {
                        label: 'Asuransi Lama',
                        data: asuransiLama,
                        backgroundColor: '#f59e0b',
                        borderColor: '#d97706',
                        borderWidth: 1
                    },
                    {
                        label: 'BBM Subsidi',
                        data: bbmSubsidi,
                        backgroundColor: '#ef4444',
                        borderColor: '#dc2626',
                        borderWidth: 1
                    },
                    {
                        label: 'BBM Non-Surat',
                        data: bbmNonSurat,
                        backgroundColor: '#8b5cf6',
                        borderColor: '#6d28d9',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
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
                        bodyFont: { size: 13 }
                    }
                },
                scales: {
                    y: {
                        stacked: false,
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        stacked: false,
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error drawing chart tahunan:', error);
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
