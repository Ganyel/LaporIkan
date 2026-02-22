const express = require('express');
const router = express.Router();
const pool = require('../db');
const adminAuth = require('../middleware/adminAuth');

let ikanSchemaCache = null;

async function getIkanSchema(connection) {
    if (ikanSchemaCache) return ikanSchemaCache;

    const [columns] = await connection.query('SHOW COLUMNS FROM ikan');
    const colNames = columns.map((col) => col.Field.toLowerCase());
    const has = (name) => colNames.includes(String(name).toLowerCase());

    const qtyColumn = has('jumlah')
        ? 'jumlah'
        : has('jumlah_ikan')
            ? 'jumlah_ikan'
            : has('stok')
                ? 'stok'
                : null;

    const fotoColumn = has('foto')
        ? 'foto'
        : has('foto_ikan')
            ? 'foto_ikan'
            : has('gambar')
                ? 'gambar'
                : null;

    ikanSchemaCache = { qtyColumn, fotoColumn };
    return ikanSchemaCache;
}

function normalizeIkanRow(row) {
    if (!row) return row;
    row.jumlah = row.jumlah ?? row.jumlah_ikan ?? row.stok ?? 0;
    let fotoValue = row.foto ?? row.foto_ikan ?? row.gambar ?? null;
    if (typeof fotoValue === 'string') {
        let trimmed = fotoValue.trim();
        const isDataUrl = trimmed.startsWith('data:image/');
        if (isDataUrl) {
            trimmed = trimmed.replace(/\s+/g, '');
            if (trimmed.length < 1000) {
                fotoValue = null;
            } else {
                fotoValue = trimmed;
            }
        }
    }
    row.foto = fotoValue || null;
    return row;
}

/**
 * GET /api/ikan
 * Ambil semua data ikan
 */
router.get('/', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM ikan ORDER BY created_at DESC');
        connection.release();

        const data = rows.map(normalizeIkanRow);
        return res.json({ success: true, data });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/ikan/:id
 * Ambil detail ikan
 */
router.get('/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM ikan WHERE id = ?', [id]);
        connection.release();

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Ikan tidak ditemukan' });
        }

        return res.json({ success: true, data: normalizeIkanRow(rows[0]) });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/ikan
 * Tambah ikan baru
 */
router.post('/', adminAuth, async (req, res) => {
    try {
        const { nama_ikan, jumlah, foto } = req.body;

        // Validasi
        if (!nama_ikan || !jumlah) {
            return res.status(400).json({ success: false, message: 'Nama ikan dan jumlah harus diisi' });
        }

        const connection = await pool.getConnection();
        const schema = await getIkanSchema(connection);

        if (!schema.qtyColumn) {
            connection.release();
            return res.status(500).json({ success: false, message: 'Kolom jumlah ikan tidak ditemukan di database.' });
        }

        const columns = ['nama_ikan', schema.qtyColumn];
        const values = [nama_ikan, jumlah];

        if (schema.fotoColumn) {
            columns.push(schema.fotoColumn);
            values.push(foto || null);
        }

        const placeholders = columns.map(() => '?').join(', ');
        await connection.query(
            `INSERT INTO ikan (${columns.join(', ')}) VALUES (${placeholders})`,
            values
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
router.put('/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_ikan, jumlah, foto } = req.body;

        // Validasi
        if (!nama_ikan || !jumlah) {
            return res.status(400).json({ success: false, message: 'Nama ikan dan jumlah harus diisi' });
        }

        const connection = await pool.getConnection();
        const schema = await getIkanSchema(connection);

        if (!schema.qtyColumn) {
            connection.release();
            return res.status(500).json({ success: false, message: 'Kolom jumlah ikan tidak ditemukan di database.' });
        }

        const updates = ['nama_ikan = ?', `${schema.qtyColumn} = ?`];
        const params = [nama_ikan, jumlah];

        if (schema.fotoColumn && foto !== undefined) {
            updates.push(`${schema.fotoColumn} = ?`);
            params.push(foto || null);
        }

        params.push(id);

        const [result] = await connection.query(
            `UPDATE ikan SET ${updates.join(', ')} WHERE id = ?`,
            params
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
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await pool.getConnection();

        const schema = await getIkanSchema(connection);
        const fotoColumn = schema.fotoColumn;

        // Ambil data foto terlebih dahulu
        const [rows] = await connection.query(
            `SELECT ${fotoColumn ? `${fotoColumn} AS foto` : 'NULL AS foto'} FROM ikan WHERE id = ?`,
            [id]
        );
        
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
