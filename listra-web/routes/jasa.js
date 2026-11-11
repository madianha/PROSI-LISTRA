import { Router } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

// GET /api/jasa
// Optional query params: ?tipe=tari|musik  &  ?kultur=Jawa|Bali|Sumatera  &  ?id_kecocokan=1|2|3
router.get('/', async (req, res) => {
  try {
    const conditions = ['j.is_aktif = TRUE'];
    const params = [];

    if (req.query.tipe) {
      params.push(req.query.tipe);
      conditions.push(`j.tipe_jasa = $${params.length}`);
    }
    if (req.query.kultur) {
      params.push(req.query.kultur);
      conditions.push(`j.kultur = $${params.length}`);
    }
    if (req.query.id_kecocokan) {
      params.push(req.query.id_kecocokan);
      conditions.push(`j.id_kecocokan = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const { rows } = await pool.query(
      `SELECT j.*, k.nama_kecocokan
         FROM jasa j
         LEFT JOIN kecocokan k ON j.id_kecocokan = k.id_kecocokan
       ${where}
       ORDER BY j.id_jasa`,
      params,
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memuat data jasa.' });
  }
});

// GET /api/jasa/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT j.*, k.nama_kecocokan
         FROM jasa j
         LEFT JOIN kecocokan k ON j.id_kecocokan = k.id_kecocokan
       WHERE j.id_jasa = $1`,
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: 'Jasa tidak ditemukan.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memuat data jasa.' });
  }
});

export default router;

