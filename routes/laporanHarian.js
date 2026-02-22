const express = require('express');
const router = express.Router();
const pool = require('../db');
const adminAuth = require('../middleware/adminAuth');

/**
 * POST /api/laporan-harian
 * Tambah atau update data harian
 */
router.post('/', adminAuth, async (req, res) => {
    try {
        const { tanggal, stblkk, pb, asuransi_baru, asuransi_lama, bbm_subsidi_surat, bbm_non_surat } = req.body;

        // Validasi input
        if (!tanggal) {
            return res.status(400).json({ success: false, message: 'Tanggal harus diisi' });
        }

        const connection = await pool.getConnection();

        // Cek apakah data sudah ada
        const [existing] = await connection.query(
            'SELECT id FROM laporan_harian WHERE tanggal = ?',
            [tanggal]
        );

        if (existing.length > 0) {
            // Update jika sudah ada
            await connection.query(
                `UPDATE laporan_harian SET 
                    stblkk = ?, pb = ?, asuransi_baru = ?, asuransi_lama = ?, 
                    bbm_subsidi_surat = ?, bbm_non_surat = ?
                WHERE tanggal = ?`,
                [
                    stblkk || 0, pb || 0, asuransi_baru || 0, asuransi_lama || 0,
                    bbm_subsidi_surat || 0, bbm_non_surat || 0, tanggal
                ]
            );
        } else {
            // Insert jika belum ada
            await connection.query(
                `INSERT INTO laporan_harian 
                (tanggal, stblkk, pb, asuransi_baru, asuransi_lama, bbm_subsidi_surat, bbm_non_surat)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    tanggal, stblkk || 0, pb || 0, asuransi_baru || 0, asuransi_lama || 0,
                    bbm_subsidi_surat || 0, bbm_non_surat || 0
                ]
            );
        }

        connection.release();

        return res.json({
            success: true,
            message: 'Data berhasil disimpan',
            data: { tanggal, stblkk, pb, asuransi_baru, asuransi_lama, bbm_subsidi_surat, bbm_non_surat }
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/laporan-harian?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Ambil data harian berdasarkan range tanggal
 */
router.get('/', async (req, res) => {
    try {
        const { start, end } = req.query;
        const connection = await pool.getConnection();

        let query = 'SELECT * FROM laporan_harian';
        const params = [];

        if (start && end) {
            query += ' WHERE tanggal BETWEEN ? AND ?';
            params.push(start, end);
        } else if (start) {
            query += ' WHERE tanggal >= ?';
            params.push(start);
        } else if (end) {
            query += ' WHERE tanggal <= ?';
            params.push(end);
        }

        query += ' ORDER BY tanggal DESC';

        const [rows] = await connection.query(query, params);
        connection.release();

        return res.json({ success: true, data: rows });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/laporan-harian/detail/:tanggal
 * Ambil data satu hari spesifik
 */
router.get('/detail/:tanggal', adminAuth, async (req, res) => {
    try {
        const { tanggal } = req.params;
        const connection = await pool.getConnection();

        const [rows] = await connection.query(
            'SELECT * FROM laporan_harian WHERE tanggal = ?',
            [tanggal]
        );

        connection.release();

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
        }

        return res.json({ success: true, data: rows[0] });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * DELETE /api/laporan-harian/:tanggal
 * Hapus data harian
 */
router.delete('/:tanggal', adminAuth, async (req, res) => {
    try {
        const { tanggal } = req.params;
        const connection = await pool.getConnection();

        const [result] = await connection.query(
            'DELETE FROM laporan_harian WHERE tanggal = ?',
            [tanggal]
        );

        connection.release();

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
        }

        return res.json({ success: true, message: 'Data berhasil dihapus' });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/laporan-harian/rekap/bulanan/:tahun
 * Rekap per bulan dari data harian
 */
router.get('/rekap/bulanan/:tahun', async (req, res) => {
    try {
        const { tahun } = req.params;
        const connection = await pool.getConnection();

        const query = `
            SELECT 
                MONTH(tanggal) as bulan,
                SUM(stblkk) as stblkk,
                SUM(pb) as pb,
                SUM(asuransi_baru) as asuransi_baru,
                SUM(asuransi_lama) as asuransi_lama,
                SUM(bbm_subsidi_surat) as bbm_subsidi_surat,
                SUM(bbm_non_surat) as bbm_non_surat
            FROM laporan_harian
            WHERE YEAR(tanggal) = ?
            GROUP BY MONTH(tanggal)
            ORDER BY bulan ASC
        `;

        const [rows] = await connection.query(query, [tahun]);
        connection.release();

        return res.json({ success: true, data: rows });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/laporan-harian/rekap/tahunan
 * Rekap per tahun
 */
router.get('/rekap/tahunan', async (req, res) => {
    try {
        const connection = await pool.getConnection();

        const query = `
            SELECT 
                YEAR(tanggal) as tahun,
                SUM(stblkk) as stblkk,
                SUM(pb) as pb,
                SUM(asuransi_baru) as asuransi_baru,
                SUM(asuransi_lama) as asuransi_lama,
                SUM(bbm_subsidi_surat) as bbm_subsidi_surat,
                SUM(bbm_non_surat) as bbm_non_surat
            FROM laporan_harian
            GROUP BY YEAR(tanggal)
            ORDER BY tahun DESC
        `;

        const [rows] = await connection.query(query);
        connection.release();

        return res.json({ success: true, data: rows });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
