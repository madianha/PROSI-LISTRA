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

type HasilKontak = { ok: true; nomor: string; nama: string; template: string } | { ok: false; message: string };

/** Validasi sesuai tabel kontak_whatsapp: nomor_wa 8-15 angka, nama_humas wajib (maks. 100). */
export function validasiKontak(body: Record<string, unknown>): HasilKontak {
  const rawNomor = body.nomor_wa ?? body.nomor_tujuan ?? body.nomor_whatsapp ?? body.no_telepon;
  const rawNama = body.nama_humas ?? body.nama;
  // spasi, tanda hubung, dan "+" boleh diketik; yang disimpan hanya angka
  const nomor = typeof rawNomor === "string" || typeof rawNomor === "number" ? String(rawNomor).replace(/[\s\-+]/g, "") : "";
  const nama = typeof rawNama === "string" ? rawNama.trim() : "";
  const template = typeof body.template_pesan === "string" ? body.template_pesan.trim() : "";

  if (!/^[0-9]{8,15}$/.test(nomor)) {
    return { ok: false, message: "Nomor WhatsApp harus 8-15 angka, diawali kode negara (mis. 628123456789)." };
  }
  if (!nama) return { ok: false, message: "Nama Humas wajib diisi." };
  if (nama.length > 100) return { ok: false, message: "Nama Humas maksimal 100 karakter." };
  if (!template) return { ok: false, message: "Template pesan wajib diisi." };
  return { ok: true, nomor, nama, template };
}

/** POST (201) dan PUT (200): simpan kontak; dibuat bila belum ada, diperbarui bila sudah ada. */
export function simpanKontak(statusBerhasil: number) {
  return async (req: Request, res: Response): Promise<void> => {
    const hasil = validasiKontak((req.body ?? {}) as Record<string, unknown>);
    if (!hasil.ok) {
      res.status(400).json({ message: hasil.message });
      return;
    }
    try {
      res.status(statusBerhasil).json(await kontakRepository.simpanKontak(hasil.nomor, hasil.nama, hasil.template));
    } catch (error) {
      console.error("Gagal menyimpan kontak WhatsApp:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
  };
}
