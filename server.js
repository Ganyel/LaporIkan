const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Import routes
const laporanHarianRoutes = require('./routes/laporanHarian');
const ikanRoutes = require('./routes/ikan');
const googleSheetsRoutes = require('./routes/googleSheets');
const adminRoutes = require('./routes/admin');
const googleSheetsDebug = require('./routes/googleSheetsDebug');
const googleAuthRoutes = require('./routes/googleAuth');

// Create uploads folder if not exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// Middleware untuk cek admin login
function checkAdminAuth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1] || req.query.token;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token tidak ditemukan'
        });
    }

    // Simple verification (dalam production gunakan JWT!)
    try {
        const decoded = Buffer.from(token, 'base64').toString();
        const [username] = decoded.split(':');

        if (username === 'admin') {
            req.adminUsername = username;
            return next();
        }
    } catch (e) {
        // Token invalid
    }

    return res.status(401).json({
        success: false,
        message: 'Token tidak valid atau expired'
    });
}

// API Routes
app.use('/api/laporan-harian', laporanHarianRoutes);
app.use('/api/ikan', ikanRoutes);
app.use('/api/data-sheet', googleSheetsRoutes);
app.use('/api/admin', adminRoutes);
// Debug route for Google Sheets connectivity
app.use(googleSheetsDebug);

// Google OAuth routes (starts at /auth/google)
app.use('/', googleAuthRoutes);

// Main Pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/laporan-ikan', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'laporan-ikan.html'));
});

app.get('/input-ikan', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'input-ikan.html'));
});

app.get('/input-laporan-harian', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'input-laporan-harian.html'));
});

app.get('/admin-google-sheets', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-google-sheets.html'));
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route tidak ditemukan' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server', error: err.message });
});

// Start Server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ Server berjalan di http://localhost:${PORT}`);
    console.log(`\n📊 Akses Aplikasi:`);
    console.log(`   Dashboard: http://localhost:${PORT}`);
    console.log(`   Admin: http://localhost:${PORT}/admin\n`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} sudah digunakan!`);
        console.error('Solusi: Stop proses lain atau ubah PORT di .env\n');
    } else {
        console.error(`\n❌ Server Error: ${err.message}\n`);
    }
    process.exit(1);
});

module.exports = app;
