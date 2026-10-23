import type { Request, Response } from "express";
import * as beritaRepository from "../repositories/beritaRepository";
import { validateBerita } from "../validation/beritaValidation";

const TIDAK_DITEMUKAN = { message: "Berita tidak ditemukan." };
const ERROR_SERVER = { message: "Terjadi kesalahan pada server." };

/** id harus bilangan bulat positif; selain itu dianggap tidak ditemukan. */
function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return id > 0 && Number.isSafeInteger(id) ? id : null;
}

/**
 * ?semua=1 ikut menampilkan draf (dipakai Kelola Berita).
 * Catatan: belum ada login, jadi siapa pun yang tahu ?semua=1 bisa melihat draf.
 * Nanti tambahkan pengecekan login di sini.
 */
function opsiBaca(req: Request): beritaRepository.OpsiBaca {
  return { semua: req.query.semua === "1" };
}

export async function listBerita(req: Request, res: Response): Promise<void> {
  try {
    res.json(await beritaRepository.listBerita(opsiBaca(req)));
  } catch (error) {
    console.error("Gagal mengambil daftar berita:", error);
    res.status(500).json(ERROR_SERVER);
  }
}

export async function getBerita(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(404).json(TIDAK_DITEMUKAN);
    return;
  }
  try {
    const berita = await beritaRepository.getBerita(id, opsiBaca(req));
    if (!berita) {
      res.status(404).json(TIDAK_DITEMUKAN);
      return;
    }
    res.json(berita);
  } catch (error) {
    console.error("Gagal mengambil berita:", error);
    res.status(500).json(ERROR_SERVER);
  }
}

const PESAN_IS_PUBLIK = { message: "is_publik wajib bernilai true atau false." };

export async function createBerita(req: Request, res: Response): Promise<void> {
  const hasil = validateBerita(req.body);
  if (!hasil.ok) {
    res.status(400).json({ message: hasil.message });
    return;
  }
  const isPublik = req.body?.is_publik;
  if (typeof isPublik !== "boolean") {
    res.status(400).json(PESAN_IS_PUBLIK);
    return;
  }
  try {
    res.status(201).json(await beritaRepository.createBerita(hasil.data, isPublik));
  } catch (error) {
    console.error("Gagal menyimpan berita:", error);
    res.status(500).json(ERROR_SERVER);
  }
}

export async function updateBerita(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(404).json(TIDAK_DITEMUKAN);
    return;
  }
  const hasil = validateBerita(req.body);
  if (!hasil.ok) {
    res.status(400).json({ message: hasil.message });
    return;
  }
  try {
    const berita = await beritaRepository.updateBerita(id, hasil.data);
    if (!berita) {
      res.status(404).json(TIDAK_DITEMUKAN);
      return;
    }
    res.json(berita);
  } catch (error) {
    console.error("Gagal memperbarui berita:", error);
    res.status(500).json(ERROR_SERVER);
  }
}

/** PATCH /api/berita/:id/publik, body { is_publik: boolean } (toggle di Kelola Berita). */
export async function setPublik(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(404).json(TIDAK_DITEMUKAN);
    return;
  }
  const isPublik = req.body?.is_publik;
  if (typeof isPublik !== "boolean") {
    res.status(400).json(PESAN_IS_PUBLIK);
    return;
  }
  try {
    const berita = await beritaRepository.setPublik(id, isPublik);
    if (!berita) {
      res.status(404).json(TIDAK_DITEMUKAN);
      return;
    }
    res.json(berita);
  } catch (error) {
    console.error("Gagal mengubah status publik berita:", error);
    res.status(500).json(ERROR_SERVER);
  }
}

export async function deleteBerita(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(404).json(TIDAK_DITEMUKAN);
    return;
  }
  try {
    const terhapus = await beritaRepository.deleteBerita(id);
    if (!terhapus) {
      res.status(404).json(TIDAK_DITEMUKAN);
      return;
    }
    res.status(204).end();
  } catch (error) {
    console.error("Gagal menghapus berita:", error);
    res.status(500).json(ERROR_SERVER);
  }
}
