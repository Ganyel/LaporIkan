const express = require('express');
const router = express.Router();
const googleSheetsAPI = require('../googleSheets');

// Debug endpoint to check Google Sheets connectivity and surface errors
router.get('/api/data-sheet/check', async (req, res) => {
    try {
        // try a lightweight read
        const result = await googleSheetsAPI.getData('Laporan Harian!A1:A1');
        res.json({ success: true, message: 'Connected to Google Sheets', data: result.data || [] });
    } catch (err) {
        console.error('Google Sheets debug error:', err);
        res.status(500).json({ success: false, message: 'Google Sheets connection failed', error: err.message, stack: err.stack });
    }
});

module.exports = router;
