import { Router } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

// GET /api/kontak
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM kontak LIMIT 1');
    if (!rows.length) return res.status(404).json({ error: 'Data kontak belum ada.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memuat data kontak.' });
  }
});

// PUT /api/kontak
router.put('/', async (req, res) => {
  try {
    const { nomor_wa, nama_humas, template_pesan } = req.body;
    const { rows } = await pool.query(
      `UPDATE kontak
         SET nomor_wa = $1, nama_humas = $2, template_pesan = $3
       WHERE id = (SELECT id FROM kontak LIMIT 1)
       RETURNING *`,
      [nomor_wa, nama_humas, template_pesan],
    );
    if (!rows.length) return res.status(404).json({ error: 'Data kontak belum ada.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menyimpan data kontak.' });
  }
});

export default router;

