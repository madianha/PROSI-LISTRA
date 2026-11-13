import { Router } from "express";
import { pool } from "../db";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id_testimoni, nama_klien, instansi, nama_acara, is_acara_privat,
              isi_testimoni, rating, tanggal_input
       FROM testimoni
       WHERE status = 'disetujui' AND is_aktif = TRUE
       ORDER BY tanggal_input DESC, id_testimoni DESC`,
    );
    res.json(rows);
  } catch (error) {
    console.error("Gagal memuat testimoni", error);
    res.status(500).json({ message: "Gagal memuat data testimoni." });
  }
});

router.post("/", async (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const nama = typeof body.nama_klien === "string" ? body.nama_klien.trim() : "";
  const instansi = typeof body.instansi === "string" ? body.instansi.trim() : "";
  const acara = typeof body.nama_acara === "string" ? body.nama_acara.trim() : "";
  const isi = typeof body.isi_testimoni === "string" ? body.isi_testimoni.trim() : "";
  const privat = body.is_acara_privat === true;
  const rating = body.rating == null || body.rating === "" ? null : Number(body.rating);
  const captchaToken = typeof body.captcha_token === "string" ? body.captcha_token : "";

  if (!nama || nama.length > 100) {
    return res.status(400).json({ message: "Nama wajib diisi (maksimal 100 karakter)." });
  }
  if (instansi.length > 150 || acara.length > 150) {
    return res.status(400).json({ message: "Instansi dan nama acara maksimal 150 karakter." });
  }
  if (!isi || isi.length > 3000) {
    return res.status(400).json({ message: "Testimoni wajib diisi (maksimal 3000 karakter)." });
  }
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return res.status(400).json({ message: "Rating harus antara 1 dan 5." });
  }
  if (!captchaToken) {
    return res.status(400).json({ message: "Verifikasi CAPTCHA wajib dilakukan." });
  }

  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    return res.status(503).json({ message: "Verifikasi CAPTCHA belum dikonfigurasi di server." });
  }

  try {
    const verification = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: captchaToken }),
    });
    const result = await verification.json() as { success?: boolean };
    if (!verification.ok || !result.success) {
      return res.status(400).json({ message: "Verifikasi CAPTCHA gagal. Silakan coba lagi." });
    }

    await pool.query(
      `INSERT INTO testimoni
         (nama_klien, instansi, nama_acara, is_acara_privat, isi_testimoni, rating, status, sumber, is_aktif)
       VALUES ($1, $2, $3, $4, $5, $6, 'menunggu', 'web', FALSE)`,
      [nama, instansi || null, acara || null, privat, isi, rating],
    );
    return res.status(201).json({ message: "Testimoni berhasil dikirim untuk ditinjau." });
  } catch (error) {
    console.error("Gagal menerima testimoni", error);
    return res.status(500).json({ message: "Testimoni gagal dikirim. Silakan coba lagi." });
  }
});

export default router;
