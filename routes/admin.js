const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { pool } = require('../db');

let adminTableReady = false;
const DEFAULT_ADMIN_USERNAME = process.env.ADMIN_DEFAULT_USERNAME || 'admin';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD;
const SHOULD_AUTO_SEED_ADMIN = process.env.ADMIN_AUTO_SEED === 'true';
const SHOW_ERROR_DETAILS = process.env.ADMIN_SHOW_ERROR_DETAILS === 'true';
const TOKEN_TTL_SECONDS = Number(process.env.ADMIN_TOKEN_TTL_SECONDS || 60 * 60 * 12);
const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || '';

async function ensureAdminTable() {
    if (adminTableReady) return;

    const createSql = `
        CREATE TABLE IF NOT EXISTS admin_users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            password_hash CHAR(64) NOT NULL,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await pool.query(createSql);
    if (SHOULD_AUTO_SEED_ADMIN) {
        if (!DEFAULT_ADMIN_PASSWORD) {
            throw new Error('ADMIN_AUTO_SEED aktif tapi ADMIN_DEFAULT_PASSWORD belum di-set');
        }

        const [rows] = await pool.query(
            'SELECT id FROM admin_users WHERE username = ? LIMIT 1',
            [DEFAULT_ADMIN_USERNAME]
        );

        if (rows.length === 0) {
            await pool.query(
                'INSERT INTO admin_users (username, password_hash, is_active) VALUES (?, SHA2(?, 256), 1)',
                [DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_PASSWORD]
            );
            console.log(`✅ Admin default dibuat: ${DEFAULT_ADMIN_USERNAME}`);
        }
    }

    adminTableReady = true;
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function getSigningSecret() {
    if (TOKEN_SECRET && TOKEN_SECRET.length >= 32) {
        return TOKEN_SECRET;
    }

    if (process.env.NODE_ENV === 'production') {
        throw new Error('ADMIN_TOKEN_SECRET wajib di-set minimal 32 karakter di production');
    }

    return 'dev-only-insecure-secret-change-this';
}

function toBase64Url(value) {
    return Buffer.from(value)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}

function fromBase64Url(value) {
    const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
    const padding = normalized.length % 4;
    const padded = padding ? normalized + '='.repeat(4 - padding) : normalized;
    return Buffer.from(padded, 'base64').toString();
}

function createSignedToken(username) {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        sub: username,
        iat: now,
        exp: now + TOKEN_TTL_SECONDS,
        jti: crypto.randomBytes(16).toString('hex')
    };

    const encodedPayload = toBase64Url(JSON.stringify(payload));
    const secret = getSigningSecret();
    const signature = crypto
        .createHmac('sha256', secret)
        .update(encodedPayload)
        .digest('base64url');

    return `${encodedPayload}.${signature}`;
}

function verifySignedToken(token) {
    const [encodedPayload, signature] = String(token || '').split('.');
    if (!encodedPayload || !signature) {
        return null;
    }

    const secret = getSigningSecret();
    const expected = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');

    const signatureBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expected);
    if (signatureBuf.length !== expectedBuf.length) {
        return null;
    }

    if (!crypto.timingSafeEqual(signatureBuf, expectedBuf)) {
        return null;
    }

    const payloadRaw = fromBase64Url(encodedPayload);
    const payload = JSON.parse(payloadRaw);
    if (!payload?.sub || !payload?.exp) {
        return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
        return null;
    }

    return payload;
}

function safeEqualHexHash(candidateHex, storedHex) {
    if (!/^[a-f0-9]{64}$/i.test(candidateHex) || !/^[a-f0-9]{64}$/i.test(storedHex)) {
        return false;
    }
    const a = Buffer.from(candidateHex, 'hex');
    const b = Buffer.from(storedHex, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function sendServerError(res, context, error) {
    const errorId = crypto.randomBytes(6).toString('hex');
    console.error(`Error di ${context} [${errorId}]:`, {
        message: error?.message,
        code: error?.code,
        stack: error?.stack
    });

    const dbUnavailableCodes = ['ECONNREFUSED', 'PROTOCOL_CONNECTION_LOST', 'ER_CON_COUNT_ERROR', 'DB_NOT_READY'];
    const dbConfigCodes = ['ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR'];

    let statusCode = Number(error?.statusCode || error?.status) || 500;
    if (dbUnavailableCodes.includes(error?.code)) statusCode = 503;
    if (dbConfigCodes.includes(error?.code)) statusCode = 500;

    const errorMessage = error?.message || String(error);
    const response = {
        success: false,
        message: statusCode === 503 ? 'Layanan database sedang tidak tersedia' : 'Terjadi kesalahan server',
        errorId
    };

    if (SHOW_ERROR_DETAILS && error) {
        response.error = errorMessage;
        if (error.code) response.code = error.code;
    }

    return res.status(statusCode).json(response);
}

function normalizeUsername(username) {
    return String(username || '').trim().toLowerCase();
}

function isValidUsername(username) {
    return /^[a-z0-9._@-]{3,100}$/.test(username);
}


router.post('/login', async (req, res) => {
    try {
        const username = normalizeUsername(req.body?.username);
        const password = String(req.body?.password || '');

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username dan password tidak boleh kosong'
            });
        }

        if (!isValidUsername(username)) {
            return res.status(400).json({
                success: false,
                field: 'username',
                message: 'Format username tidak valid'
            });
        }

        if (password.length < 4 || password.length > 256) {
            return res.status(400).json({
                success: false,
                field: 'password',
                message: 'Format password tidak valid'
            });
        }

        await ensureAdminTable();

        const [rows] = await pool.query(
            'SELECT username, password_hash, is_active FROM admin_users WHERE username = ? LIMIT 1',
            [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            });
        }

        const user = rows[0];
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Akun tidak aktif'
            });
        }

        const hashed = hashPassword(password);
        const storedHash = String(user.password_hash || '').toLowerCase();
        if (!safeEqualHexHash(hashed, storedHash)) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            });
        }

        const token = createSignedToken(user.username);

        return res.json({
            success: true,
            token,
            username: user.username,
            message: 'Login berhasil'
        });
    } catch (error) {
        return sendServerError(res, 'login endpoint', error);
    }
});

/**
 * GET /api/admin/verify
 * 
 * Verify apakah token masih valid
 */
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token tidak ditemukan'
            });
        }

        await ensureAdminTable();

        try {
            const payload = verifySignedToken(token);
            const username = normalizeUsername(payload?.sub);
            if (!username) {
                return res.status(401).json({
                    success: false,
                    message: 'Token tidak valid'
                });
            }

            const [rows] = await pool.query(
                'SELECT username, is_active FROM admin_users WHERE username = ? LIMIT 1',
                [username]
            );

            if (rows.length && rows[0].is_active) {
                return res.json({
                    success: true,
                    username,
                    message: 'Token valid'
                });
            }
        } catch (e) {
            if (SHOW_ERROR_DETAILS) {
                console.warn('Token verify gagal:', e?.message || e);
            }
        }

        return res.status(401).json({
            success: false,
            message: 'Token tidak valid'
        });
    } catch (error) {
        return sendServerError(res, 'verify endpoint', error);
    }
});

/**
 * POST /api/admin/logout
 * 
 * Logout (frontend akan hapus token dari localStorage)
 */
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logout berhasil'
    });
});

module.exports = router;
