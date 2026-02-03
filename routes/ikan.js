const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * GET /api/ikan
 * Ambil semua data ikan
 */
router.get('/', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM ikan ORDER BY created_at DESC');
        connection.release();

        return res.json({ success: true, data: rows });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/ikan/:id
 * Ambil detail ikan
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM ikan WHERE id = ?', [id]);
        connection.release();

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Ikan tidak ditemukan' });
        }

        return res.json({ success: true, data: rows[0] });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/ikan
 * Tambah ikan baru
 */
router.post('/', async (req, res) => {
    try {
        const { nama_ikan, jumlah, foto } = req.body;

        // Validasi
        if (!nama_ikan || !jumlah) {
            return res.status(400).json({ success: false, message: 'Nama ikan dan jumlah harus diisi' });
        }

        const connection = await pool.getConnection();
        await connection.query(
            'INSERT INTO ikan (nama_ikan, jumlah, foto) VALUES (?, ?, ?)',
            [nama_ikan, jumlah, foto || null]
        );
        connection.release();

        return res.json({
            success: true,
            message: 'Ikan berhasil ditambahkan',
            data: { nama_ikan, jumlah, foto }
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * PUT /api/ikan/:id
 * Update ikan
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_ikan, jumlah, foto } = req.body;

        // Validasi
        if (!nama_ikan || !jumlah) {
            return res.status(400).json({ success: false, message: 'Nama ikan dan jumlah harus diisi' });
        }

        const connection = await pool.getConnection();
        const [result] = await connection.query(
            'UPDATE ikan SET nama_ikan = ?, jumlah = ?, foto = ? WHERE id = ?',
            [nama_ikan, jumlah, foto || null, id]
        );
        connection.release();

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Ikan tidak ditemukan' });
        }

        return res.json({
            success: true,
            message: 'Ikan berhasil diupdate',
            data: { id, nama_ikan, jumlah, foto }
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * DELETE /api/ikan/:id
 * Hapus ikan
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await pool.getConnection();

        // Ambil data foto terlebih dahulu
        const [rows] = await connection.query('SELECT foto FROM ikan WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            connection.release();
            return res.status(404).json({ success: false, message: 'Ikan tidak ditemukan' });
        }

        // Hapus data
        const [result] = await connection.query('DELETE FROM ikan WHERE id = ?', [id]);
        connection.release();

        // Hapus file foto jika ada
        if (rows[0].foto) {
            const fs = require('fs');
            const path = require('path');
            const filePath = path.join(__dirname, '..', 'public', rows[0].foto);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        return res.json({ success: true, message: 'Ikan berhasil dihapus' });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
