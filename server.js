const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
require('dotenv').config({
    path: path.join(__dirname, '.env')
});

const app = express();
const parsedPort = Number(process.env.PORT);
const PORT = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 3000;
const isProduction = process.env.NODE_ENV === 'production';
const SHOW_ERROR_DETAILS = process.env.ADMIN_SHOW_ERROR_DETAILS === 'true';
const SHOW_HEALTH_DETAILS = process.env.HEALTH_SHOW_DETAILS === 'true';

app.disable('x-powered-by');

// Import routes
const laporanHarianRoutes = require('./routes/laporanHarian');
const ikanRoutes = require('./routes/ikan');
const googleSheetsRoutes = require('./routes/googleSheets');
const adminRoutes = require('./routes/admin');
const googleSheetsDebug = require('./routes/googleSheetsDebug');
const googleAuthRoutes = require('./routes/googleAuth');
const { testConnection, getDbStatus } = require('./db');

// Create uploads folder if not exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public'), {
    index: false,
    etag: true,
    maxAge: isProduction ? '5m' : 0
}));

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
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/admin', (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
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

app.get('/api/health', (req, res) => {
    const dbStatus = getDbStatus();
    const statusCode = dbStatus.connected ? 200 : 503;
    const response = {
        success: dbStatus.connected,
        app: 'ok',
        db: dbStatus.connected ? 'up' : 'down',
        timestamp: new Date().toISOString()
    };

    if (!isProduction || SHOW_HEALTH_DETAILS) {
        response.dbError = dbStatus.lastError || null;
    }

    return res.status(statusCode).json({
        ...response
    });
});

// 404 Handler
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ success: false, message: 'Route tidak ditemukan' });
    }

    return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Error Handler
app.use((err, req, res, next) => {
    const errorId = require('crypto').randomBytes(6).toString('hex');
    console.error('Unhandled error:', {
        errorId,
        message: err?.message,
        code: err?.code,
        stack: err?.stack
    });

    const response = {
        success: false,
        message: 'Terjadi kesalahan server',
        errorId
    };

    if ((!isProduction || SHOW_ERROR_DETAILS) && err) {
        response.error = err.message || String(err);
        if (err.code) response.code = err.code;
    }

    res.status(err?.statusCode || 500).json(response);
});

async function startServer() {
    let dbConnectedAtBoot = false;
    try {
        await testConnection();
        dbConnectedAtBoot = true;
        console.log('✅ Database terkoneksi');
    } catch (error) {
        console.error('\n⚠️ Database belum siap saat startup, server tetap dijalankan.');
        console.error('Detail:', {
            message: error?.message,
            code: error?.code,
            errno: error?.errno,
            sqlState: error?.sqlState
        });
    }

    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n✅ Server berjalan di http://localhost:${PORT}`);
        console.log('\n📊 Akses Aplikasi:');
        console.log(`   Dashboard: http://localhost:${PORT}`);
        console.log(`   Admin: http://localhost:${PORT}/admin`);
        console.log(`   Health: http://localhost:${PORT}/api/health\n`);
        if (!dbConnectedAtBoot) {
            console.log('ℹ️ Cek /api/health untuk status database.');
        }
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

    setInterval(async () => {
        try {
            await testConnection();
        } catch (_) {
            // Status DB disimpan di db.js; tidak perlu crash server.
        }
    }, Number(process.env.DB_HEALTHCHECK_INTERVAL_MS || 30000));
}

startServer();

module.exports = app;
