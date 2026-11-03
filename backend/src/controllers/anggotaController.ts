import type { Request, Response } from "express";
import * as anggotaRepo from "../repositories/anggotaRepository";

const TIDAK_DITEMUKAN = { message: "Anggota tidak ditemukan." };
const ERROR_SERVER = { message: "Terjadi kesalahan pada server." };

function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return id > 0 && Number.isSafeInteger(id) ? id : null;
}

export async function getSpesialisasiList(_req: Request, res: Response): Promise<void> {
  try {
    const list = await anggotaRepo.getSpesialisasiList();
    res.json(list);
  } catch (error) {
    console.error("Gagal mengambil data spesialisasi:", error);
    res.status(500).json(ERROR_SERVER);
  }
}

export async function listAnggota(req: Request, res: Response): Promise<void> {
  try {
    const { search, peran, angkatan } = req.query;
    const filters: anggotaRepo.FilterAnggota = {
      search: typeof search === "string" ? search : undefined,
      peran: typeof peran === "string" ? peran : undefined,
      angkatan: angkatan ? Number(angkatan) : undefined,
    };

    const anggota = await anggotaRepo.getAnggota(filters);
    res.json(anggota);
  } catch (error) {
    console.error("Gagal mengambil data anggota:", error);
    res.status(500).json(ERROR_SERVER);
  }
}

export async function getAnggotaDetail(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(404).json(TIDAK_DITEMUKAN);
    return;
  }
  try {
    const anggota = await anggotaRepo.getAnggotaById(id);
    if (!anggota) {
      res.status(404).json(TIDAK_DITEMUKAN);
      return;
    }
    res.json(anggota);
  } catch (error) {
    console.error("Gagal mengambil detail anggota:", error);
    res.status(500).json(ERROR_SERVER);
  }
}

function validateAnggotaPayload(body: any): { ok: boolean; message?: string; data?: anggotaRepo.AnggotaInput } {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "Data tidak valid." };
  }

  const nama = typeof body.nama === "string" ? body.nama.trim() : "";
  if (!nama) {
    return { ok: false, message: "Nama wajib diisi." };
  }

  const email = typeof body.email === "string" ? body.email.trim() : null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Format email tidak valid." };
  }

  const npm = typeof body.npm === "string" ? body.npm.trim() : null;
  const no_hp = typeof body.no_hp === "string" ? body.no_hp.trim() : null;
  const peran = typeof body.peran === "string" ? body.peran.trim() : "Kepengurusan";
  const jabatan = typeof body.jabatan === "string" ? body.jabatan.trim() : null;
  
  let angkatan_unpar: number | null = null;
  if (body.angkatan_unpar !== undefined && body.angkatan_unpar !== null && body.angkatan_unpar !== "") {
    const parsed = Number(body.angkatan_unpar);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return { ok: false, message: "Angkatan harus berupa bilangan positif." };
    }
    angkatan_unpar = parsed;
  }

  let is_aktif = true;
  if (typeof body.is_aktif === "boolean") {
    is_aktif = body.is_aktif;
  }

  let spesialisasi_ids: number[] = [];
  if (Array.isArray(body.spesialisasi_ids)) {
    spesialisasi_ids = (body.spesialisasi_ids as unknown[])
      .map((item) => Number(item))
      .filter((n: number) => Number.isSafeInteger(n) && n > 0);
  }

  return {
    ok: true,
    data: {
      nama,
      email: email || null,
      npm: npm || null,
      no_hp: no_hp || null,
      peran: peran || "Kepengurusan",
      jabatan: jabatan || null,
      angkatan_unpar,
      is_aktif,
      spesialisasi_ids,
    },
  };
}

export async function createAnggota(req: Request, res: Response): Promise<void> {
  const validation = validateAnggotaPayload(req.body);
  if (!validation.ok || !validation.data) {
    res.status(400).json({ message: validation.message });
    return;
  }

  try {
    const created = await anggotaRepo.createAnggota(validation.data);
    res.status(201).json(created);
  } catch (error: any) {
    console.error("Gagal menambahkan anggota:", error);
    if (error.code === "23505") {
      if (error.detail?.includes("email")) {
        res.status(400).json({ message: "Email sudah terdaftar." });
        return;
      }
      if (error.detail?.includes("npm")) {
        res.status(400).json({ message: "NPM sudah terdaftar." });
        return;
      }
    }
    res.status(500).json(ERROR_SERVER);
  }
}

export async function updateAnggota(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(404).json(TIDAK_DITEMUKAN);
    return;
  }

  const validation = validateAnggotaPayload(req.body);
  if (!validation.ok || !validation.data) {
    res.status(400).json({ message: validation.message });
    return;
  }

  try {
    const updated = await anggotaRepo.updateAnggota(id, validation.data);
    if (!updated) {
      res.status(404).json(TIDAK_DITEMUKAN);
      return;
    }
    res.json(updated);
  } catch (error: any) {
    console.error("Gagal memperbarui anggota:", error);
    if (error.code === "23505") {
      if (error.detail?.includes("email")) {
        res.status(400).json({ message: "Email sudah terdaftar." });
        return;
      }
      if (error.detail?.includes("npm")) {
        res.status(400).json({ message: "NPM sudah terdaftar." });
        return;
      }
    }
    res.status(500).json(ERROR_SERVER);
  }
}

export async function toggleStatusAktif(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(404).json(TIDAK_DITEMUKAN);
    return;
  }

  const { is_aktif } = req.body;
  if (typeof is_aktif !== "boolean") {
    res.status(400).json({ message: "is_aktif wajib bernilai boolean (true/false)." });
    return;
  }

  try {
    const updated = await anggotaRepo.toggleStatusAktif(id, is_aktif);
    if (!updated) {
      res.status(404).json(TIDAK_DITEMUKAN);
      return;
    }
    res.json(updated);
  } catch (error) {
    console.error("Gagal mengubah status aktif anggota:", error);
    res.status(500).json(ERROR_SERVER);
  }
}
