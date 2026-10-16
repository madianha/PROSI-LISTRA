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
    const { nomor_wa, nama_humas, template_pesan } = req.body as Record<
      string,
      unknown
    >;

    if (
      typeof nomor_wa !== "string" ||
      nomor_wa.trim() === "" ||
      typeof nama_humas !== "string" ||
      nama_humas.trim() === "" ||
      typeof template_pesan !== "string" ||
      template_pesan.trim() === ""
    ) {
      res.status(400).json({
        message: "Field nomor_wa, nama_humas, dan template_pesan wajib diisi.",
      });
      return;
    }

    const updated = await kontakRepository.updateKontak(
      nomor_wa.trim(),
      nama_humas.trim(),
      template_pesan,
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
