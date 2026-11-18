import type { Request, Response } from "express";
import * as repo from "../repositories/alatMusikRepository";

const TIDAK_DITEMUKAN = { message: "Alat musik tidak ditemukan." };
const ERROR_SERVER = { message: "Terjadi kesalahan pada server." };
const NAMA_SUDAH_ADA = { message: "Alat musik dengan nama tersebut sudah ada." };

function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return id > 0 && Number.isSafeInteger(id) ? id : null;
}

type Hasil<T> = { ok: true; value: T } | { ok: false; message: string };

// nama_alat_musik VARCHAR(50) NOT NULL
function validasiNama(raw: unknown): Hasil<string> {
  const nama = typeof raw === "string" ? raw.trim() : "";
  if (!nama) return { ok: false, message: "Nama alat musik wajib diisi." };
  if (nama.length > 50) return { ok: false, message: "Nama alat musik maksimal 50 karakter." };
  return { ok: true, value: nama };
}

// chk_alat_musik_jumlah: jumlah >= 1
function validasiJumlah(raw: unknown): Hasil<number> {
  const jumlah = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : raw;
  if (typeof jumlah !== "number" || !Number.isSafeInteger(jumlah) || jumlah < 1) {
    return { ok: false, message: "Jumlah alat musik minimal 1." };
  }
  return { ok: true, value: jumlah };
}

export async function listAlatMusik(_req: Request, res: Response): Promise<void> {
  try {
    res.json(await repo.listAlatMusik());
  } catch (error) {
    console.error("Gagal memuat alat musik:", error);
    res.status(500).json(ERROR_SERVER);
  }
}

export async function createAlatMusik(req: Request, res: Response): Promise<void> {
  const nama = validasiNama(req.body?.nama_alat_musik);
  if (!nama.ok) {
    res.status(400).json({ message: nama.message });
    return;
  }
  // kolom jumlah DEFAULT 1
  const rawJumlah = req.body?.jumlah;
  const jumlah: Hasil<number> =
    rawJumlah === undefined || rawJumlah === null || rawJumlah === "" ? { ok: true, value: 1 } : validasiJumlah(rawJumlah);
  if (!jumlah.ok) {
    res.status(400).json({ message: jumlah.message });
    return;
  }
  try {
    res.status(201).json(await repo.createAlatMusik({ nama_alat_musik: nama.value, jumlah: jumlah.value }));
  } catch (error: any) {
    if (error?.code === "23505") {
      res.status(409).json(NAMA_SUDAH_ADA);
      return;
    }
    console.error("Gagal menambahkan alat musik:", error);
    res.status(500).json(ERROR_SERVER);
  }
}

export async function updateAlatMusik(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(404).json(TIDAK_DITEMUKAN);
    return;
  }
  const data: { nama_alat_musik?: string; jumlah?: number } = {};
  if (req.body?.nama_alat_musik !== undefined) {
    const nama = validasiNama(req.body.nama_alat_musik);
    if (!nama.ok) {
      res.status(400).json({ message: nama.message });
      return;
    }
    data.nama_alat_musik = nama.value;
  }
  if (req.body?.jumlah !== undefined) {
    const jumlah = validasiJumlah(req.body.jumlah);
    if (!jumlah.ok) {
      res.status(400).json({ message: jumlah.message });
      return;
    }
    data.jumlah = jumlah.value;
  }
  if (data.nama_alat_musik === undefined && data.jumlah === undefined) {
    res.status(400).json({ message: "Tidak ada data yang diperbarui." });
    return;
  }
  try {
    const updated = await repo.updateAlatMusik(id, data);
    if (!updated) {
      res.status(404).json(TIDAK_DITEMUKAN);
      return;
    }
    res.json(updated);
  } catch (error: any) {
    if (error?.code === "23505") {
      res.status(409).json(NAMA_SUDAH_ADA);
      return;
    }
    console.error("Gagal memperbarui alat musik:", error);
    res.status(500).json(ERROR_SERVER);
  }
}

export async function deleteAlatMusik(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(404).json(TIDAK_DITEMUKAN);
    return;
  }
  try {
    if (!(await repo.deleteAlatMusik(id))) {
      res.status(404).json(TIDAK_DITEMUKAN);
      return;
    }
    res.status(204).end();
  } catch (error) {
    console.error("Gagal menghapus alat musik:", error);
    res.status(500).json(ERROR_SERVER);
  }
}
