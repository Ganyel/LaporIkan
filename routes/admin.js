const express = require('express');
const router = express.Router();

/**
 * Default admin credentials
 * IMPORTANTE: Seharusnya disimpan di database dengan hash password!
 * Ini hanya contoh sederhana
 */
const DEFAULT_ADMIN = {
    username: 'admin',
    password: 'password'
};

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
    try {
        const { username, password } = req.body;

        // Validasi input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username dan password tidak boleh kosong'
            });
        }

        // Verifikasi username dan password
        // TODO: Seharusnya query dari database dan compare password hash!
        if (username === DEFAULT_ADMIN.username && password === DEFAULT_ADMIN.password) {
            // Generate simple token (dalam production, gunakan JWT!)
            const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');

            return res.json({
                success: true,
                token: token,
                message: 'Login berhasil'
            });
        }

        // Username atau password salah
        return res.status(401).json({
            success: false,
            message: 'Username atau password salah'
        });

    } catch (error) {
        console.error('Error di login endpoint:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

/**
 * GET /api/admin/verify
 * 
 * Verify apakah token masih valid
 */
router.get('/verify', (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token tidak ditemukan'
            });
        }

        // Simple token verification (dalam production, gunakan JWT verification!)
        try {
            const decoded = Buffer.from(token, 'base64').toString();
            const [username] = decoded.split(':');

            if (username === DEFAULT_ADMIN.username) {
                return res.json({
                    success: true,
                    username: username,
                    message: 'Token valid'
                });
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
