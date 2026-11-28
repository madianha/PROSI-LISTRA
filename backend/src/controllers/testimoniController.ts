import type { Request, Response } from "express";
import { bacaPengguna } from "../middleware/wajibLogin";
import * as repo from "../repositories/testimoniRepository";
import { verifikasiRecaptcha } from "../services/recaptcha";
import { STATUS_TESTIMONI, SUMBER_TESTIMONI, validateTestimoni } from "../validation/testimoniValidation";

const TIDAK_DITEMUKAN = { message: "Testimoni tidak ditemukan." };
const ERROR_SERVER = { message: "Terjadi kesalahan pada server." };

/** id harus bilangan bulat positif; selain itu dianggap tidak ditemukan. */
function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return id > 0 && Number.isSafeInteger(id) ? id : null;
}

/** Sumber yang dipilih pengurus (tambah maupun ubah): kosong = "web"; null = tidak sah. */
function sumberPengurus(body: Request["body"]): string | null {
  const sumber = body?.sumber ?? "web";
  return SUMBER_TESTIMONI.includes(sumber) ? sumber : null;
}
const SUMBER_TIDAK_SAH = { message: "Sumber harus web atau whatsapp." };

/** GET /api/testimoni: yang tampil di website (disetujui + aktif). */
export async function listPublik(_req: Request, res: Response): Promise<void> {
  try {
    res.json(await repo.listPublik());
  } catch (error) {
    console.error("Gagal mengambil testimoni:", error);
    res.status(500).json(ERROR_SERVER);
  }
}

/** GET /api/testimoni/semua (login): semua testimoni untuk halaman internal. */
export async function listSemua(_req: Request, res: Response): Promise<void> {
  try {
    res.json(await repo.listSemua());
  } catch (error) {
    console.error("Gagal mengambil semua testimoni:", error);
    res.status(500).json(ERROR_SERVER);
  }
}

/**
 * POST /api/testimoni
 * Semua testimoni baru masuk antrean: "menunggu" dan tidak tampil sampai diterima pengurus.
 * Pengunjung (tanpa login): wajib lolos Google reCAPTCHA, sumber selalu "web".
 * Pengurus yang login (mis. menyalin testimoni dari WhatsApp): tanpa reCAPTCHA, sumber boleh dipilih.
 */
export async function createTestimoni(req: Request, res: Response): Promise<void> {
  const hasil = validateTestimoni(req.body);
  if (!hasil.ok) {
    res.status(400).json({ message: hasil.message });
    return;
  }

  let extra = { status: "menunggu", sumber: "web", is_aktif: false };
  if (!bacaPengguna(req)) {
    // pengunjung wajib lolos pemeriksaan bot (Google reCAPTCHA); pengurus yang login tidak perlu
    let lolos: boolean;
    try {
      lolos = await verifikasiRecaptcha(req.body?.captcha_token, req.ip);
    } catch (error) {
      // mis. RECAPTCHA_SECRET_KEY belum diisi di production
      console.error("reCAPTCHA belum dikonfigurasi:", error);
      res.status(500).json(ERROR_SERVER);
      return;
    }
    if (!lolos) {
      res.status(400).json({ message: "Verifikasi \"bukan robot\" gagal. Centang ulang lalu kirim lagi." });
      return;
    }
  } else {
    const sumber = sumberPengurus(req.body);
    if (!sumber) {
      res.status(400).json(SUMBER_TIDAK_SAH);
      return;
    }
    extra = { ...extra, sumber };
  }

  try {
    res.status(201).json(await repo.createTestimoni(hasil.data, extra));
  } catch (error) {
    console.error("Gagal menyimpan testimoni:", error);
    res.status(500).json(ERROR_SERVER);
  }
}

/**
 * PUT /api/testimoni/:id (login): ubah testimoni yang ditolak.
 * Setelah diubah, testimoni masuk antrean lagi ("menunggu", tidak tampil); tanggal_input tetap.
 */
export async function updateTestimoni(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(404).json(TIDAK_DITEMUKAN);
    return;
  }
  const hasil = validateTestimoni(req.body);
  if (!hasil.ok) {
    res.status(400).json({ message: hasil.message });
    return;
  }
  const sumber = sumberPengurus(req.body);
  if (!sumber) {
    res.status(400).json(SUMBER_TIDAK_SAH);
    return;
  }

  try {
    const lama = await repo.getTestimoni(id);
    if (!lama) {
      res.status(404).json(TIDAK_DITEMUKAN);
      return;
    }
    if (lama.status !== "ditolak") {
      res.status(400).json({ message: "Hanya testimoni yang ditolak yang bisa diubah." });
      return;
    }
    const baru = await repo.updateTestimoni(id, hasil.data, { status: "menunggu", sumber, is_aktif: false });
    if (!baru) {
      res.status(404).json(TIDAK_DITEMUKAN);
      return;
    }
    res.json(baru);
  } catch (error) {
    console.error("Gagal mengubah testimoni:", error);
    res.status(500).json(ERROR_SERVER);
  }
}

/** PATCH /api/testimoni/:id/status (login), body { status: "menunggu" | "disetujui" | "ditolak" } */
export async function setStatus(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(404).json(TIDAK_DITEMUKAN);
    return;
  }
  const status = req.body?.status;
  if (!STATUS_TESTIMONI.includes(status)) {
    res.status(400).json({ message: "Status harus menunggu, disetujui, atau ditolak." });
    return;
  }
  try {
    const baru = await repo.setStatus(id, status);
    if (!baru) {
      res.status(404).json(TIDAK_DITEMUKAN);
      return;
    }
    res.json(baru);
  } catch (error) {
    console.error("Gagal mengubah status testimoni:", error);
    res.status(500).json(ERROR_SERVER);
  }
}

/** PATCH /api/testimoni/:id/aktif (login), body { is_aktif: true | false } */
export async function setAktif(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(404).json(TIDAK_DITEMUKAN);
    return;
  }
  const isAktif = req.body?.is_aktif;
  if (typeof isAktif !== "boolean") {
    res.status(400).json({ message: "is_aktif wajib bernilai true atau false." });
    return;
  }
  try {
    const baru = await repo.setAktif(id, isAktif);
    if (baru === null) {
      res.status(404).json(TIDAK_DITEMUKAN);
      return;
    }
    if (baru === "belum_disetujui") {
      res.status(400).json({ message: "Setujui testimoni ini dulu sebelum ditampilkan." });
      return;
    }
    res.json(baru);
  } catch (error) {
    console.error("Gagal mengubah tampil testimoni:", error);
    res.status(500).json(ERROR_SERVER);
  }
}

/** DELETE /api/testimoni/:id (login): hanya yang ditolak; yang diterima cukup disembunyikan. */
export async function deleteTestimoni(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(404).json(TIDAK_DITEMUKAN);
    return;
  }
  try {
    const lama = await repo.getTestimoni(id);
    if (!lama) {
      res.status(404).json(TIDAK_DITEMUKAN);
      return;
    }
    if (lama.status !== "ditolak") {
      res.status(400).json({ message: "Hanya testimoni yang ditolak yang bisa dihapus." });
      return;
    }
    if (!(await repo.deleteTestimoni(id))) {
      res.status(404).json(TIDAK_DITEMUKAN);
      return;
    }
    res.status(204).end();
  } catch (error) {
    console.error("Gagal menghapus testimoni:", error);
    res.status(500).json(ERROR_SERVER);
  }
}
