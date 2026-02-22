// ==========================================
// GLOBAL VARIABLES
// ==========================================
let chartHarian, chartBulanan, chartTahunan;
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const CHART_SERIES = [
    { key: 'stblkk', label: 'STBLKK', short: 'STBLKK', background: '#1e3a8a', border: '#1a2d6b' },
    { key: 'pb', label: 'PB', short: 'PB', background: '#3b82f6', border: '#1e40af' },
    { key: 'asuransi_baru', label: 'Asuransi Baru', short: 'Asuransi B', background: '#10b981', border: '#059669' },
    { key: 'asuransi_lama', label: 'Asuransi Lama', short: 'Asuransi L', background: '#f59e0b', border: '#d97706' },
    { key: 'bbm_subsidi_surat', label: 'BBM Subsidi', short: 'BBM Subsidi', background: '#ef4444', border: '#dc2626' },
    { key: 'bbm_non_surat', label: 'BBM Non-Surat', short: 'BBM Non', background: '#8b5cf6', border: '#6d28d9' }
];

const PAGE_SIZE = 10;
const tableState = {
    harian: { data: [], page: 1 },
    bulanan: { data: [], page: 1 },
    tahunan: { data: [], page: 1 }
};

// ==========================================
// INITIALIZE
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
    const currentYear = new Date().getFullYear();
    const yearInput = document.getElementById('filterYear');
    const yearOnlyInput = document.getElementById('filterYearOnly');
    if (yearInput) yearInput.value = currentYear;
    if (yearOnlyInput) yearOnlyInput.value = currentYear;

    const startInput = document.getElementById('filterStartDate');
    const endInput = document.getElementById('filterEndDate');
    const daySelector = document.getElementById('daySelector');
    const monthSelector = document.getElementById('monthSelector');
    const yearSelector = document.getElementById('yearSelector');

    if (daySelector) {
        daySelector.value = new Date().toISOString().split('T')[0];
        daySelector.addEventListener('change', () => {
            if (!daySelector.value) return;
            activateTab('tab-harian');
            loadDashboardData(daySelector.value, daySelector.value);
        });
    }

    if (monthSelector) {
        monthSelector.value = new Date().toISOString().slice(0, 7);
        monthSelector.addEventListener('change', () => {
            if (!monthSelector.value) return;
            const [year, month] = monthSelector.value.split('-');
            activateTab('tab-bulanan');
            loadDataBulanan(year, month);
        });
    }

    if (yearSelector) {
        yearSelector.value = currentYear;
        yearSelector.addEventListener('change', () => {
            if (!yearSelector.value) return;
            activateTab('tab-tahunan');
            loadDataTahunan(yearSelector.value);
        });
    }

    const autoApplyHarian = () => {
        const startDate = startInput?.value;
        const endDate = endInput?.value;
        if (startDate && endDate) {
            activateTab('tab-harian');
            applyFilter();
        }
    };
    if (startInput) startInput.addEventListener('change', autoApplyHarian);
    if (endInput) endInput.addEventListener('change', autoApplyHarian);

    // Wait untuk canvas element available
    setTimeout(() => {
        loadDashboardData();
    }, 100);
    
    // Reload data saat tab berubah
    const tabsElement = document.getElementById('dashboardTabs');
    if (tabsElement) {
        tabsElement.addEventListener('shown.bs.tab', function (e) {
            if (e.target.id === 'tabBulanan-tab' || e.target.id === 'tab-bulanan') {
                setTimeout(() => {
                    const monthSelector = document.getElementById('monthSelector');
                    if (monthSelector?.value) {
                        const [year, month] = monthSelector.value.split('-');
                        loadDataBulanan(year, month);
                    } else {
                        loadDataBulanan();
                    }
                }, 100);
            } else if (e.target.id === 'tabTahunan-tab' || e.target.id === 'tab-tahunan') {
                setTimeout(() => {
                    const yearSelector = document.getElementById('yearSelector');
                    if (yearSelector?.value) {
                        loadDataTahunan(yearSelector.value);
                    } else {
                        loadDataTahunan();
                    }
                }, 100);
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

function activateTab(tabId) {
    const tabEl = document.getElementById(tabId);
    if (!tabEl) return;
    if (typeof bootstrap !== 'undefined' && bootstrap.Tab) {
        const tab = bootstrap.Tab.getOrCreateInstance(tabEl);
        tab.show();
    } else {
        tabEl.click();
    }
}

// ==========================================
// CHART HELPERS
// ==========================================
function buildDatasets(data, borderWidth = 1) {
    return CHART_SERIES.map(series => ({
        label: series.short,
        fullLabel: series.label,
        data: data.map(item => parseInt(item[series.key]) || 0),
        backgroundColor: series.background,
        borderColor: series.border,
        borderWidth,
        borderRadius: 10,
        borderSkipped: false
    }));
}

function buildLineDatasets(data) {
    return CHART_SERIES.map(series => ({
        label: series.short,
        fullLabel: series.label,
        data: data.map(item => parseInt(item[series.key]) || 0),
        borderColor: series.border,
        backgroundColor: series.background,
        borderWidth: 2,
        fill: false,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 5
    }));
}

function buildCategorySummary(data) {
    const labels = CHART_SERIES.map(series => series.label);
    const values = CHART_SERIES.map(series =>
        data.reduce((sum, item) => sum + (parseInt(item[series.key]) || 0), 0)
    );
    const colors = CHART_SERIES.map(series => series.background);
    return { labels, values, colors };
}

function getChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false
        },
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 12,
                    boxWidth: 10,
                    font: {
                        size: 12,
                        weight: 'bold'
                    },
                    color: '#1f2937'
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
                },
                ticks: {
                    padding: 8
                }
            },
            x: {
                stacked: false,
                grid: {
                    display: false
                },
                ticks: {
                    padding: 8
                },
                categoryPercentage: 0.7,
                barPercentage: 0.8
            }
        }
    };
}

function getFallbackHarian() {
    const today = new Date();
    const labels = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        labels.push(d.toISOString().split('T')[0]);
        data.push({
            tanggal: d.toISOString().split('T')[0],
            stblkk: 12 + i,
            pb: 18 + i,
            asuransi_baru: 25 + i,
            asuransi_lama: 28 + i,
            bbm_subsidi_surat: 35 + i,
            bbm_non_surat: 30 + i
        });
    }
    return data;
}

function getFallbackBulanan(year) {
    return Array.from({ length: 6 }, (_, idx) => ({
        bulan: idx + 1,
        stblkk: 40 + idx * 3,
        pb: 35 + idx * 2,
        asuransi_baru: 50 + idx * 3,
        asuransi_lama: 28 + idx * 2,
        bbm_subsidi_surat: 60 + idx * 3,
        bbm_non_surat: 55 + idx * 2,
        tahun: year
    }));
}

function getFallbackTahunan() {
    const year = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, idx) => ({
        tahun: year - (4 - idx),
        stblkk: 420 + idx * 25,
        pb: 360 + idx * 20,
        asuransi_baru: 520 + idx * 28,
        asuransi_lama: 280 + idx * 18,
        bbm_subsidi_surat: 640 + idx * 30,
        bbm_non_surat: 580 + idx * 26
    }));
}

function renderChartToggles(chart, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !chart) return;

    container.innerHTML = '';
    chart.data.datasets.forEach((dataset, index) => {
        const label = document.createElement('label');
        label.className = 'chart-toggle';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = chart.isDatasetVisible(index);
        input.addEventListener('change', () => {
            chart.setDatasetVisibility(index, input.checked);
            chart.update();
        });

        const text = document.createElement('span');
        text.textContent = dataset.fullLabel || dataset.label;

        label.appendChild(input);
        label.appendChild(text);
        container.appendChild(label);
    });
}

// ==========================================
// FILTER FUNCTION
// ==========================================
async function applyFilter() {
    const isHarian = document.getElementById('filter-harian-tab')?.classList.contains('active')
        || document.getElementById('tab-harian')?.classList.contains('active');
    const isBulanan = document.getElementById('filter-bulanan-tab')?.classList.contains('active')
        || document.getElementById('tab-bulanan')?.classList.contains('active');
    const isTahunan = document.getElementById('filter-tahunan-tab')?.classList.contains('active')
        || document.getElementById('tab-tahunan')?.classList.contains('active');
    const daySelector = document.getElementById('daySelector');

    if (isHarian) {
        if (daySelector && daySelector.value) {
            activateTab('tab-harian');
            await loadDashboardData(daySelector.value, daySelector.value);
            return;
        }

        const startDate = document.getElementById('filterStartDate').value;
        const endDate = document.getElementById('filterEndDate').value;

        if (!startDate || !endDate) {
            alert('Pilih rentang tanggal terlebih dahulu');
            return;
        }

        activateTab('tab-harian');
        await loadDashboardData(startDate, endDate);
        return;
    }

    if (isBulanan) {
        const month = document.getElementById('filterMonth')?.value || 'all';
        const year = document.getElementById('filterYear')?.value || new Date().getFullYear();
        await loadDataBulanan(year, month);
        return;
    }

    if (isTahunan) {
        const year = document.getElementById('filterYearOnly')?.value || '';
        await loadDataTahunan(year);
    }
}

// ==========================================
// LOAD DASHBOARD DATA (HARIAN)
// ==========================================
async function loadDashboardData(startDate = null, endDate = null) {
    try {
        if (!startDate || !endDate) {
            const daySelector = document.getElementById('daySelector');
            const selectedDay = daySelector?.value;
            if (selectedDay) {
                startDate = selectedDay;
                endDate = selectedDay;
            } else {
                const startInput = document.getElementById('filterStartDate');
                const endInput = document.getElementById('filterEndDate');
                const inputStart = startInput?.value;
                const inputEnd = endInput?.value;
                if (!inputStart || !inputEnd) {
                    updateStatistics([]);
                    displayTableHarian([]);
                    drawChartHarian([]);
                    return;
                }
                startDate = inputStart;
                endDate = inputEnd;
            }
        }

        const response = await fetch(`/api/laporan-harian?start=${startDate}&end=${endDate}`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        const data = result.data || [];

        // Update statistics
        updateStatistics(data);

        // Load and display harian data
        await loadDataHarian(startDate, endDate);

    } catch (error) {
        console.error('Error:', error);
        updateStatistics([]);
        displayTableHarian([]);
        drawChartHarian([]);
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
// TABLE RENDERING + PAGINATION
// ==========================================
const tableConfig = {
    harian: {
        tbodyId: 'tableHarianBody',
        paginationId: 'paginationHarian',
        colspan: 7,
        renderRow: (item) => {
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

            return tr;
        }
    },
    bulanan: {
        tbodyId: 'tableBulanBody',
        paginationId: 'paginationBulanan',
        colspan: 5,
        renderRow: (item) => {
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

            return tr;
        }
    },
    tahunan: {
        tbodyId: 'tableTahunBody',
        paginationId: 'paginationTahunan',
        colspan: 5,
        renderRow: (item) => {
            const tr = document.createElement('tr');
            const asuransi = (parseInt(item.asuransi_baru) || 0) + (parseInt(item.asuransi_lama) || 0);
            const bbm = (parseInt(item.bbm_subsidi_surat) || 0) + (parseInt(item.bbm_non_surat) || 0);

            const tdTahun = document.createElement('td'); tdTahun.textContent = item.tahun; tr.appendChild(tdTahun);
            const tdStbl = document.createElement('td'); tdStbl.className = 'text-end'; tdStbl.textContent = item.stblkk || 0; tr.appendChild(tdStbl);
            const tdPb = document.createElement('td'); tdPb.className = 'text-end'; tdPb.textContent = item.pb || 0; tr.appendChild(tdPb);
            const tdAs = document.createElement('td'); tdAs.className = 'text-end'; tdAs.textContent = asuransi; tr.appendChild(tdAs);
            const tdBbm = document.createElement('td'); tdBbm.className = 'text-end'; tdBbm.textContent = bbm; tr.appendChild(tdBbm);

            return tr;
        }
    }
};

function setTableData(key, data) {
    tableState[key].data = data || [];
    tableState[key].page = 1;
    renderTable(key);
}

function renderTable(key) {
    const config = tableConfig[key];
    const state = tableState[key];
    const tbody = document.getElementById(config.tbodyId);
    const pagination = document.getElementById(config.paginationId);

    tbody.innerHTML = '';

    if (!state.data || state.data.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.setAttribute('colspan', String(config.colspan));
        td.className = 'table-empty';
        td.innerHTML = '<div class="empty-state"><div class="empty-state-title">Belum ada data</div><div class="empty-state-text">Silakan ubah filter atau coba lagi nanti.</div></div>';
        tr.appendChild(td);
        tbody.appendChild(tr);
        if (pagination) pagination.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(state.data.length / PAGE_SIZE);
    const start = (state.page - 1) * PAGE_SIZE;
    const pageData = state.data.slice(start, start + PAGE_SIZE);

    pageData.forEach(item => {
        tbody.appendChild(config.renderRow(item));
    });

    renderPagination(pagination, totalPages, state.page, (page) => {
        tableState[key].page = page;
        renderTable(key);
    });
}

function renderPagination(container, totalPages, currentPage, onPageChange) {
    if (!container) return;
    container.innerHTML = '';

    if (totalPages <= 1) return;

    const createButton = (label, page, disabled, active) => {
        const button = document.createElement('button');
        button.className = 'page-btn' + (active ? ' active' : '');
        button.textContent = label;
        button.disabled = disabled;
        if (!disabled) {
            button.addEventListener('click', () => onPageChange(page));
        }
        container.appendChild(button);
    };

    createButton('Prev', Math.max(1, currentPage - 1), currentPage === 1, false);

    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    for (let page = startPage; page <= endPage; page++) {
        createButton(String(page), page, false, page === currentPage);
    }

    createButton('Next', Math.min(totalPages, currentPage + 1), currentPage === totalPages, false);
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

        let data = result.data || [];

        // Update statistics
        updateStatistics(data);

        // Display table
        displayTableHarian(data);

        // Draw chart
        drawChartHarian(data);

    } catch (error) {
        console.error('Error:', error);
        displayTableHarian([]);
        drawChartHarian([]);
    }
}

// ==========================================
// DISPLAY TABLE HARIAN
// ==========================================
function displayTableHarian(data) {
    setTableData('harian', data);
}

// ==========================================
// DRAW CHART HARIAN
// ==========================================
function drawChartHarian(data) {
    try {
        const canvas = ensureCanvas('chartHarian');
        if (!canvas) return;

        const summary = buildCategorySummary(data);
        const ctx = canvas.getContext('2d');
        
        if (chartHarian) {
            chartHarian.destroy();
        }

        chartHarian = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: summary.labels,
                datasets: [
                    {
                        label: 'Total Harian',
                        data: summary.values,
                        backgroundColor: summary.colors,
                        borderRadius: 10,
                        borderSkipped: false
                    }
                ]
            },
            options: getChartOptions()
        });

        const controls = document.getElementById('chartHarianControls');
        if (controls) controls.innerHTML = '';
    } catch (error) {
        console.error('Error drawing chart harian:', error);
    }
}

// ==========================================
// LOAD DATA BULANAN
// ==========================================
async function loadDataBulanan(yearParam = null, monthParam = 'all') {
    try {
        const year = yearParam || document.getElementById('filterYear').value || new Date().getFullYear();
        const response = await fetch(`/api/laporan-harian/rekap/bulanan/${year}`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        let data = result.data || [];
        if (monthParam && monthParam !== 'all') {
            const monthValue = parseInt(monthParam, 10);
            data = data.filter(item => item.bulan === monthValue);
        }

        // Update statistics
        updateStatistics(data);

        // Display table
        displayTableBulanan(data);

        // Draw chart
        drawChartBulanan(data);

    } catch (error) {
        console.error('Error:', error);
        displayTableBulanan([]);
        drawChartBulanan([]);
    }
}

// ==========================================
// DISPLAY TABLE BULANAN
// ==========================================
function displayTableBulanan(data) {
    setTableData('bulanan', data);
}

// ==========================================
// DRAW CHART BULANAN
// ==========================================
function drawChartBulanan(data) {
    try {
        const canvas = ensureCanvas('chartBulanan');
        if (!canvas) return;

        const summary = buildCategorySummary(data);
        const ctx = canvas.getContext('2d');
        
        if (chartBulanan) {
            chartBulanan.destroy();
        }

        chartBulanan = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: summary.labels,
                datasets: [
                    {
                        label: 'Total Bulanan',
                        data: summary.values,
                        backgroundColor: summary.colors,
                        borderRadius: 10,
                        borderSkipped: false
                    }
                ]
            },
            options: getChartOptions()
        });

        const controls = document.getElementById('chartBulananControls');
        if (controls) controls.innerHTML = '';
    } catch (error) {
        console.error('Error drawing chart bulanan:', error);
    }
}

// ==========================================
// LOAD DATA TAHUNAN
// ==========================================
async function loadDataTahunan(yearParam = '') {
    try {
        const response = await fetch('/api/laporan-harian/rekap/tahunan');
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        let data = result.data || [];
        if (yearParam) {
            const yearValue = parseInt(yearParam, 10);
            if (!Number.isNaN(yearValue)) {
                data = data.filter(item => parseInt(item.tahun, 10) === yearValue);
            }
        }

        // Update statistics
        updateStatistics(data);

        // Display table
        displayTableTahunan(data);

        // Draw chart
        drawChartTahunan(data);

    } catch (error) {
        console.error('Error:', error);
        displayTableTahunan([]);
        drawChartTahunan([]);
    }
}

// ==========================================
// DISPLAY TABLE TAHUNAN
// ==========================================
function displayTableTahunan(data) {
    setTableData('tahunan', data);
}

// ==========================================
// DRAW CHART TAHUNAN
// ==========================================
function drawChartTahunan(data) {
    try {
        const canvas = ensureCanvas('chartTahunan');
        if (!canvas) return;

        const sorted = [...data].sort((a, b) => (parseInt(a.tahun, 10) || 0) - (parseInt(b.tahun, 10) || 0));
        const labels = sorted.map(item => item.tahun);
        const datasets = buildLineDatasets(sorted);
        const ctx = canvas.getContext('2d');
        
        if (chartTahunan) {
            chartTahunan.destroy();
        }

        const options = getChartOptions();
        if (options.scales && options.scales.x) {
            delete options.scales.x.categoryPercentage;
            delete options.scales.x.barPercentage;
        }

        chartTahunan = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets
            },
            options
        });

        const controls = document.getElementById('chartTahunanControls');
        if (controls) controls.innerHTML = '';
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
