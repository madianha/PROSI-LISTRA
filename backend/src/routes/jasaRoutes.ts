import { Router } from "express";
import { pool } from "../db";

const router = Router();

router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         j.id_jasa,
         j.nama,
         j.tipe_jasa,
         j.deskripsi,
         j.durasi,
         j.harga_minimum,
         j.harga_maximum,
         j.min_performer,
         j.link_media,
         j.link_image,
         j.is_aktif,
         p.nama_provinsi AS kultur,
         p.pulau AS culture,
         kecocokan.nama_kecocokan
       FROM jasa j
       LEFT JOIN provinsi p ON p.id_provinsi = j.id_provinsi
       LEFT JOIN LATERAL (
         SELECT string_agg(k.nama_kecocokan, ', ' ORDER BY k.id_kecocokan) AS nama_kecocokan
         FROM jasa_kecocokan jk
         JOIN kecocokan k ON k.id_kecocokan = jk.id_kecocokan
         WHERE jk.id_jasa = j.id_jasa
       ) kecocokan ON TRUE
       WHERE j.id_jasa = $1 AND j.is_aktif = TRUE`,
      [req.params.id],
    );

    if (!rows.length) return res.status(404).json({ message: "Jasa tidak ditemukan." });
    return res.json(rows[0]);
  } catch (error) {
    console.error("Gagal memuat detail jasa", error);
    return res.status(500).json({ message: "Gagal memuat detail jasa." });
  }
});

// Data yang dibutuhkan CatalogueCard dan filter katalog publik.
router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         j.id_jasa,
         j.nama,
         j.tipe_jasa,
         j.deskripsi,
         j.durasi,
         j.harga_minimum,
         j.harga_maximum,
         j.min_performer,
         j.link_media,
         j.link_image,
         j.is_aktif,
         p.nama_provinsi AS kultur,
         p.pulau AS culture,
         kecocokan.nama_kecocokan
       FROM jasa j
       LEFT JOIN provinsi p ON p.id_provinsi = j.id_provinsi
       LEFT JOIN LATERAL (
         SELECT string_agg(k.nama_kecocokan, ', ' ORDER BY k.id_kecocokan) AS nama_kecocokan
         FROM jasa_kecocokan jk
         JOIN kecocokan k ON k.id_kecocokan = jk.id_kecocokan
         WHERE jk.id_jasa = j.id_jasa
       ) kecocokan ON TRUE
       WHERE j.is_aktif = TRUE
       ORDER BY j.id_jasa`,
    );

    res.json(rows);
  } catch (error) {
    console.error("Gagal memuat katalog jasa", error);
    res.status(500).json({ message: "Gagal memuat data jasa." });
  }
});

export default router;
