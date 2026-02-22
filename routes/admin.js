const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pool = require('../db');

let adminTableReady = false;
const DEFAULT_ADMIN_USERNAME = 'p3tegalsari@gmail.com';
const DEFAULT_ADMIN_PASSWORD = 'ppntegalsari';

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

    const connection = await pool.getConnection();
    try {
        await connection.query(createSql);
        const [rows] = await connection.query(
            'SELECT id FROM admin_users WHERE username = ? LIMIT 1',
            [DEFAULT_ADMIN_USERNAME]
        );

        if (rows.length === 0) {
            await connection.query(
                'INSERT INTO admin_users (username, password_hash, is_active) VALUES (?, SHA2(?, 256), 1)',
                [DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_PASSWORD]
            );
        } else {
            await connection.query(
                'UPDATE admin_users SET password_hash = SHA2(?, 256), is_active = 1 WHERE username = ?',
                [DEFAULT_ADMIN_PASSWORD, DEFAULT_ADMIN_USERNAME]
            );
        }
        adminTableReady = true;
    } finally {
        connection.release();
    }
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * POST /api/admin/login
 * 
 * Login endpoint untuk admin panel
 * 
 * Body:
 * {
 *   username: string,
 *   password: string
 * }
 * 
 * Response (sukses):
 * {
 *   success: true,
 *   token: "jwt_token_here",
 *   message: "Login berhasil"
 * }
 * 
 * Response (gagal):
 * {
 *   success: false,
 *   message: "Username atau password salah"
 * }
 */
router.post('/login', (req, res) => {
    (async () => {
        try {
            const { username, password } = req.body;

            // Validasi input
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Username dan password tidak boleh kosong'
                });
            }

            await ensureAdminTable();

            const connection = await pool.getConnection();
            try {
                const [rows] = await connection.query(
                    'SELECT username, password_hash, is_active FROM admin_users WHERE username = ? LIMIT 1',
                    [username]
                );

                if (rows.length === 0) {
                    return res.status(401).json({
                        success: false,
                        field: 'username',
                        message: 'Username tidak ditemukan'
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
                if (hashed !== user.password_hash) {
                    return res.status(401).json({
                        success: false,
                        field: 'password',
                        message: 'Password salah'
                    });
                }

                // Generate simple token (dalam production, gunakan JWT!)
                const token = Buffer.from(`${user.username}:${Date.now()}`).toString('base64');

                return res.json({
                    success: true,
                    token: token,
                    message: 'Login berhasil'
                });
            } finally {
                connection.release();
            }

        } catch (error) {
            console.error('Error di login endpoint:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan server'
            });
        }
    })();
});

/**
 * GET /api/admin/verify
 * 
 * Verify apakah token masih valid
 */
router.get('/verify', (req, res) => {
    (async () => {
        try {
            const token = req.headers.authorization?.split(' ')[1];

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Token tidak ditemukan'
                });
            }

            await ensureAdminTable();

            // Simple token verification (dalam production, gunakan JWT verification!)
            try {
                const decoded = Buffer.from(token, 'base64').toString();
                const [username] = decoded.split(':');

                const connection = await pool.getConnection();
                try {
                    const [rows] = await connection.query(
                        'SELECT username, is_active FROM admin_users WHERE username = ? LIMIT 1',
                        [username]
                    );

                    if (rows.length && rows[0].is_active) {
                        return res.json({
                            success: true,
                            username: username,
                            message: 'Token valid'
                        });
                    }
                } finally {
                    connection.release();
                }
            } catch (e) {
                // Token invalid
            }

            return res.status(401).json({
                success: false,
                message: 'Token tidak valid'
            });

        } catch (error) {
            console.error('Error di verify endpoint:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan server'
            });
        }
    })();
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
