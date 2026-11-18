import type { Request, Response } from "express";
import * as acaraRepo from "../repositories/acaraRepository";
import { isTanggalValid, validateAcaraPayload, type AcaraInput } from "../validation/acaraValidation";

const TIDAK_DITEMUKAN = { message: "Event tidak ditemukan." };
const ERROR_SERVER = { message: "Terjadi kesalahan pada server." };

function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return id > 0 && Number.isSafeInteger(id) ? id : null;
}

/** ?dari=YYYY-MM-DD&sampai=YYYY-MM-DD (keduanya opsional). */
function bacaRentang(req: Request): { ok: true; rentang: acaraRepo.RentangTanggal } | { ok: false; message: string } {
  const rentang: acaraRepo.RentangTanggal = {};
  for (const key of ["dari", "sampai"] as const) {
    const value = req.query[key];
    if (value === undefined || value === "") continue;
    if (!isTanggalValid(value)) return { ok: false, message: `Parameter ${key} harus berformat YYYY-MM-DD.` };
    rentang[key] = value;
  }
  if (rentang.dari && rentang.sampai && rentang.sampai < rentang.dari) {
    return { ok: false, message: "Parameter sampai tidak boleh sebelum dari." };
  }
  return { ok: true, rentang };
}

// PJ: anggota aktif berperan Kepengurusan (bukan Alumni, bukan akun Admin).
// Performer: anggota aktif Kepengurusan atau Alumni (SRS 2.3.2 no. 5 & 8).
const BUKAN_PJ = ["admin", "alumni"];
const BUKAN_PERFORMER = ["admin"];

/**
 * Cek PJ & performer ke tabel anggota. Anggota yang sudah tercatat di event ini (pengecualian)
 * tidak dicek lagi, supaya event lama tetap bisa diubah walau anggotanya sudah nonaktif.
 */
async function cekAnggota(data: AcaraInput, pengecualian: number[] = []): Promise<string | null> {
  const performerIds = data.acara_jasa.flatMap((r) => r.acara_performer.map((p) => p.id_anggota)).filter((id): id is number => id !== null);
  const semua = [...new Set([...data.acara_pj, ...performerIds])].filter((id) => !pengecualian.includes(id));
  if (semua.length === 0) return null;

  const status = new Map((await acaraRepo.getStatusAnggota(semua)).map((s) => [s.id_anggota, s]));
  for (const id of data.acara_pj) {
    if (pengecualian.includes(id)) continue;
    const s = status.get(id);
    if (!s) return "PJ yang dipilih tidak ditemukan.";
    if (!s.is_aktif || BUKAN_PJ.includes(s.peran)) return "PJ harus anggota Kepengurusan yang aktif.";
  }
  for (const id of performerIds) {
    if (pengecualian.includes(id)) continue;
    const s = status.get(id);
    if (!s) return "Performer yang dipilih tidak ditemukan.";
    if (!s.is_aktif || BUKAN_PERFORMER.includes(s.peran)) return "Performer harus anggota aktif (Kepengurusan atau Alumni).";
  }
  return null;
}

function kirimErrorSimpan(res: Response, error: any, aksi: string): void {
  console.error(`Gagal ${aksi} event:`, error);
  if (error?.code === "23503") {
    res.status(400).json({ message: "Jasa atau anggota yang dipilih tidak ditemukan." });
  } else if (error?.code === "23514" || error?.code === "23505") {
    res.status(400).json({ message: "Data event tidak sesuai aturan database." });
  } else {
    res.status(500).json(ERROR_SERVER);
  }
}

export async function listAcara(req: Request, res: Response): Promise<void> {
  const rentang = bacaRentang(req);
  if (!rentang.ok) {
    res.status(400).json({ message: rentang.message });
    return;
  }
  try {
    res.json(await acaraRepo.listAcara(rentang.rentang));
  } catch (error) {
    console.error("Gagal mengambil daftar event:", error);
    res.status(500).json(ERROR_SERVER);
  }
}

export async function listJadwal(req: Request, res: Response): Promise<void> {
  const rentang = bacaRentang(req);
  if (!rentang.ok) {
    res.status(400).json({ message: rentang.message });
    return;
  }
  try {
    res.json(await acaraRepo.listJadwalPublik(rentang.rentang));
  } catch (error) {
    console.error("Gagal mengambil jadwal publik:", error);
    res.status(500).json(ERROR_SERVER);
  }
}

export async function getAcaraDetail(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(404).json(TIDAK_DITEMUKAN);
    return;
  }
  try {
    const acara = await acaraRepo.getAcaraById(id);
    if (!acara) {
      res.status(404).json(TIDAK_DITEMUKAN);
      return;
    }
    res.json(acara);
  } catch (error) {
    console.error("Gagal mengambil detail event:", error);
    res.status(500).json(ERROR_SERVER);
  }
}

export async function createAcara(req: Request, res: Response): Promise<void> {
  const validation = validateAcaraPayload(req.body);
  if (!validation.ok) {
    res.status(400).json({ message: validation.message });
    return;
  }
  try {
    const salahAnggota = await cekAnggota(validation.data);
    if (salahAnggota) {
      res.status(400).json({ message: salahAnggota });
      return;
    }
    res.status(201).json(await acaraRepo.createAcara(validation.data));
  } catch (error) {
    kirimErrorSimpan(res, error, "membuat");
  }
}

export async function updateAcara(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(404).json(TIDAK_DITEMUKAN);
    return;
  }
  const validation = validateAcaraPayload(req.body);
  if (!validation.ok) {
    res.status(400).json({ message: validation.message });
    return;
  }
  try {
    const salahAnggota = await cekAnggota(validation.data, await acaraRepo.getAnggotaTerlibat(id));
    if (salahAnggota) {
      res.status(400).json({ message: salahAnggota });
      return;
    }
    const updated = await acaraRepo.updateAcara(id, validation.data);
    if (!updated) {
      res.status(404).json(TIDAK_DITEMUKAN);
      return;
    }
    res.json(updated);
  } catch (error) {
    kirimErrorSimpan(res, error, "mengubah");
  }
}

export async function deleteAcara(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(404).json(TIDAK_DITEMUKAN);
    return;
  }
  try {
    if (!(await acaraRepo.deleteAcara(id))) {
      res.status(404).json(TIDAK_DITEMUKAN);
      return;
    }
    res.status(204).end();
  } catch (error) {
    console.error("Gagal menghapus event:", error);
    res.status(500).json(ERROR_SERVER);
  }
}
