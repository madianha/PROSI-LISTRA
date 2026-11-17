import { Router } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

// GET /api/alat-musik
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id_alat_musik, nama_alat_musik, jumlah FROM alat_musik ORDER BY id_alat_musik ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memuat data alat musik.' });
  }
});

// POST /api/alat-musik
router.post('/', async (req, res) => {
  try {
    const { nama_alat_musik, jumlah } = req.body;
    if (!nama_alat_musik || !nama_alat_musik.trim()) {
      return res.status(400).json({ error: 'Nama alat musik wajib diisi.' });
    }

    const jml = jumlah ? parseInt(jumlah, 10) : 1;
    if (isNaN(jml) || jml < 1) {
      return res.status(400).json({ error: 'Jumlah alat musik minimal 1.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO alat_musik (nama_alat_musik, jumlah)
       VALUES ($1, $2)
       RETURNING id_alat_musik, nama_alat_musik, jumlah`,
      [nama_alat_musik.trim(), jml]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Alat musik dengan nama tersebut sudah ada.' });
    }
    res.status(500).json({ error: 'Gagal menambahkan alat musik.' });
  }
});

// PUT /api/alat-musik/:id (Ubah jumlah / nama)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_alat_musik, jumlah } = req.body;

    const fields = [];
    const values = [];

    if (nama_alat_musik !== undefined) {
      if (!nama_alat_musik.trim()) {
        return res.status(400).json({ error: 'Nama alat musik tidak boleh kosong.' });
      }
      values.push(nama_alat_musik.trim());
      fields.push(`nama_alat_musik = $${values.length}`);
    }

    if (jumlah !== undefined) {
      const jml = parseInt(jumlah, 10);
      if (isNaN(jml) || jml < 1) {
        return res.status(400).json({ error: 'Jumlah alat musik minimal 1.' });
      }
      values.push(jml);
      fields.push(`jumlah = $${values.length}`);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Tidak ada data yang diperbarui.' });
    }

    values.push(id);
    const { rows } = await pool.query(
      `UPDATE alat_musik
       SET ${fields.join(', ')}
       WHERE id_alat_musik = $${values.length}
       RETURNING id_alat_musik, nama_alat_musik, jumlah`,
      values
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Alat musik tidak ditemukan.' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Alat musik dengan nama tersebut sudah ada.' });
    }
    res.status(500).json({ error: 'Gagal memperbarui alat musik.' });
  }
});

// DELETE /api/alat-musik/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query(
      'DELETE FROM alat_musik WHERE id_alat_musik = $1',
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Alat musik tidak ditemukan.' });
    }

    res.json({ message: 'Alat musik berhasil dihapus.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menghapus alat musik.' });
  }
});

export default router;
