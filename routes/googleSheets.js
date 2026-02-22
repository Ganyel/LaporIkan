const express = require('express');
const router = express.Router();
const googleSheetsAPI = require('../googleSheets');
const fs = require('fs');
const path = require('path');
const adminAuth = require('../middleware/adminAuth');

router.use(adminAuth);

function extractSpreadsheetId(input) {
    if (!input) return '';
    const trimmed = String(input).trim();
    const urlMatch = trimmed.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch && urlMatch[1]) return urlMatch[1];
    const idMatch = trimmed.match(/^[a-zA-Z0-9-_]{15,}$/);
    if (idMatch) return trimmed;
    return '';
}

function upsertEnvValue(filePath, key, value) {
    let envContent = '';
    if (fs.existsSync(filePath)) {
        envContent = fs.readFileSync(filePath, 'utf-8');
    }

    const line = `${key}=${value}`;
    if (envContent.match(new RegExp(`^${key}=`, 'm'))) {
        envContent = envContent.replace(new RegExp(`^${key}=.*$`, 'm'), line);
    } else {
        envContent = envContent.trimEnd() + (envContent.endsWith('\n') || envContent.length === 0 ? '' : '\n') + line + '\n';
    }

    fs.writeFileSync(filePath, envContent, 'utf-8');
}

// Update Spreadsheet ID from Admin UI
router.post('/config', async (req, res) => {
    try {
        const { sheetUrl, sheetId } = req.body || {};
        const extractedId = extractSpreadsheetId(sheetId || sheetUrl);

        if (!extractedId) {
            return res.status(400).json({
                success: false,
                message: 'Spreadsheet ID/URL tidak valid'
            });
        }

        const envPath = path.join(__dirname, '..', '.env');
        upsertEnvValue(envPath, 'GOOGLE_SPREADSHEET_ID', extractedId);

        process.env.GOOGLE_SPREADSHEET_ID = extractedId;
        googleSheetsAPI.spreadsheetId = extractedId;
        if (!googleSheetsAPI.sheets && typeof googleSheetsAPI.initAuth === 'function') {
            googleSheetsAPI.initAuth();
        }

        return res.json({
            success: true,
            message: 'Spreadsheet ID berhasil disimpan',
            data: { spreadsheetId: extractedId }
        });
    } catch (error) {
        console.error('Error update config:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal menyimpan Spreadsheet ID',
            error: error.message
        });
    }
});

// Route untuk sync laporan harian ke Google Sheets
router.post('/sync-laporan-harian', async (req, res) => {
    try {
        const { id, tanggal, dataTangkapan, dataLayanan, catatan } = req.body;

        const values = [
            [
                new Date().toLocaleString('id-ID'),
                tanggal,
                JSON.stringify(dataTangkapan),
                JSON.stringify(dataLayanan),
                catatan || '-'
            ]
        ];

        const result = await googleSheetsAPI.appendData('Laporan Harian!A:E', values);

        res.json({
            success: true,
            message: 'Data berhasil disync ke Google Sheets',
            data: result
        });
    } catch (error) {
        console.error('Error sync laporan harian:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal sync ke Google Sheets',
            error: error.message
        });
    }
});

// Route untuk sync data ikan ke Google Sheets
router.post('/sync-ikan', async (req, res) => {
    try {
        const { id, namaIkan, hargaEstimasi, stok, asal } = req.body;

        const values = [
            [
                new Date().toLocaleString('id-ID'),
                id,
                namaIkan,
                hargaEstimasi || '-',
                stok || '-',
                asal || '-'
            ]
        ];

        const result = await googleSheetsAPI.appendData('Data Ikan!A:F', values);

        res.json({
            success: true,
            message: 'Data ikan berhasil disync ke Google Sheets',
            data: result
        });
    } catch (error) {
        console.error('Error sync ikan:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal sync data ikan ke Google Sheets',
            error: error.message
        });
    }
});

// Route untuk mendapatkan data dari Google Sheets
router.get('/laporan-harian', async (req, res) => {
    try {
        const result = await googleSheetsAPI.getData('Laporan Harian!A:E');

        res.json({
            success: true,
            data: result.data || []
        });
    } catch (error) {
        console.error('Error get laporan harian:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data laporan harian dari Google Sheets',
            error: error.message
        });
    }
});

// Route untuk mendapatkan data ikan dari Google Sheets
router.get('/ikan', async (req, res) => {
    try {
        const result = await googleSheetsAPI.getData('Data Ikan!A:F');

        res.json({
            success: true,
            data: result.data || []
        });
    } catch (error) {
        console.error('Error get data ikan:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data ikan dari Google Sheets',
            error: error.message
        });
    }
});

// Route untuk update data di Google Sheets
router.put('/update-laporan', async (req, res) => {
    try {
        const { range, values } = req.body;

        if (!range || !values) {
            return res.status(400).json({
                success: false,
                message: 'range dan values diperlukan'
            });
        }

        const result = await googleSheetsAPI.updateData(range, values);

        res.json({
            success: true,
            message: 'Data berhasil diupdate di Google Sheets',
            data: result
        });
    } catch (error) {
        console.error('Error update laporan:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal update data di Google Sheets',
            error: error.message
        });
    }
});

// Route untuk clear data di Google Sheets
router.delete('/clear/:sheetName', async (req, res) => {
    try {
        const { sheetName } = req.params;
        const result = await googleSheetsAPI.clearData(`${sheetName}!A:Z`);

        res.json({
            success: true,
            message: `Sheet ${sheetName} berhasil dikosongkan`,
            data: result
        });
    } catch (error) {
        console.error('Error clear data:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal clear data',
            error: error.message
        });
    }
});

module.exports = router;
