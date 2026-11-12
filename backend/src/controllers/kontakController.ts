import type { Request, Response } from "express";
import * as kontakRepository from "../repositories/kontakRepository";

export async function getKontak(_req: Request, res: Response): Promise<void> {
  try {
    const kontak = await kontakRepository.getKontak();
    if (!kontak) {
      res.status(404).json({ message: "Kontak WhatsApp tidak ditemukan." });
      return;
    }
    res.json(kontak);
  } catch (error) {
    console.error("Gagal mengambil kontak WhatsApp:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
}

export async function updateKontak(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const rawNomor = body.nomor_tujuan || body.nomor_wa || body.nomor_whatsapp || body.no_telepon;
    const rawNama = body.nama_humas !== undefined ? body.nama_humas : body.nama;
    const rawTemplate = body.template_pesan;

    if (
      typeof rawNomor !== "string" ||
      rawNomor.trim() === "" ||
      typeof rawTemplate !== "string" ||
      rawTemplate.trim() === ""
    ) {
      res.status(400).json({
        message: "Field nomor kontak dan template_pesan wajib diisi.",
      });
      return;
    }

    const namaToSave = typeof rawNama === "string" ? rawNama.trim() : null;

    const updated = await kontakRepository.updateKontak(
      rawNomor.trim(),
      namaToSave,
      rawTemplate,
    );

    if (!updated) {
      res.status(404).json({ message: "Kontak WhatsApp tidak ditemukan." });
      return;
    }

    res.json(updated);
  } catch (error) {
    console.error("Gagal memperbarui kontak WhatsApp:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
}
