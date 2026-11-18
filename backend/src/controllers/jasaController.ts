import type { Request, Response } from "express";
import { bacaPengguna } from "../middleware/wajibLogin";
import * as jasaRepo from "../repositories/jasaRepository";

const TIDAK_DITEMUKAN = { message: "Jasa tidak ditemukan." };
const ERROR_SERVER = { message: "Terjadi kesalahan pada server." };

function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return id > 0 && Number.isSafeInteger(id) ? id : null;
}

/** Terima array atau "Opening, Middle"; kembalikan nama kecocokan yang sah, urut Opening -> Closing. */
export function normalizeKecocokan(raw: unknown): jasaRepo.NamaKecocokan[] {
  const list = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(",") : [];
  const dipilih = new Set(list.map((s) => String(s ?? "").trim().toLowerCase()));
  return jasaRepo.URUTAN_KECOCOKAN.filter((k) => dipilih.has(k.toLowerCase()));
}

function isValidHttpUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** Angka dari body; undefined/null/"" dianggap kosong (NaN). */
function angka(raw: unknown): number {
  return raw === undefined || raw === null || raw === "" ? NaN : Number(raw);
}

function teksOpsional(raw: unknown): string | null {
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

type HasilValidasi = { ok: true; data: jasaRepo.JasaInput } | { ok: false; message: string };

/** Validasi body POST/PUT. Nama field = nama kolom tabel jasa + array kecocokan. */
export function validateJasaPayload(body: any): HasilValidasi {
  if (!body || typeof body !== "object") return { ok: false, message: "Data jasa tidak valid." };

  const tipe = typeof body.tipe_jasa === "string" ? body.tipe_jasa.trim().toLowerCase() : "";
  if (tipe !== "tari" && tipe !== "musik") {
    return { ok: false, message: "Jenis jasa wajib dipilih (Tari atau Musik)." };
  }

  const nama = typeof body.nama === "string" ? body.nama.trim() : "";
  if (!nama) return { ok: false, message: "Nama jasa wajib diisi." };
  if (nama.length > 100) return { ok: false, message: "Nama jasa maksimal 100 karakter." };

  const kecocokan = normalizeKecocokan(body.kecocokan);
  if (kecocokan.length === 0) {
    return { ok: false, message: "Posisi pentas wajib dipilih (Opening, Middle, atau Closing)." };
  }

  // chk_jasa_kultur_tari: tari wajib punya provinsi; musik selalu tanpa provinsi
  let id_provinsi: number | null = null;
  if (tipe === "tari") {
    const prov = angka(body.id_provinsi);
    if (!Number.isSafeInteger(prov) || prov <= 0) {
      return { ok: false, message: "Asal provinsi wajib dipilih untuk jasa Tari." };
    }
    id_provinsi = prov;
  }

  const durasi = angka(body.durasi);
  if (!Number.isSafeInteger(durasi) || durasi <= 0) {
    return { ok: false, message: "Tolong isi durasi pertunjukan (menit) terlebih dahulu." };
  }

  const hargaMin = angka(body.harga_minimum);
  const hargaMax = angka(body.harga_maximum);
  if (!Number.isFinite(hargaMin) || hargaMin < 0) return { ok: false, message: "Tolong masukkan nominal harga minimum." };
  if (!Number.isFinite(hargaMax) || hargaMax < 0) return { ok: false, message: "Tolong masukkan nominal harga maksimum." };
  if (hargaMax < hargaMin) {
    return { ok: false, message: "Harga maksimum tidak boleh lebih kecil dari harga minimum." };
  }

  const minPerformer = angka(body.min_performer ?? 1);
  if (!Number.isSafeInteger(minPerformer) || minPerformer < 1) {
    return { ok: false, message: "Minimal performer harus minimal 1 orang." };
  }

  const link_media = teksOpsional(body.link_media);
  if (link_media && !isValidHttpUrl(link_media)) {
    return { ok: false, message: "Tautan media harus berupa URL yang valid (http:// atau https://)." };
  }

  return {
    ok: true,
    data: {
      tipe_jasa: tipe,
      nama,
      deskripsi: teksOpsional(body.deskripsi),
      id_provinsi,
      durasi,
      harga_minimum: hargaMin,
      harga_maximum: hargaMax,
      min_performer: minPerformer,
      link_media,
      link_image: teksOpsional(body.link_image),
      is_aktif: typeof body.is_aktif === "boolean" ? body.is_aktif : true,
      kecocokan,
    },
  };
}

function kirimErrorSimpan(res: Response, error: any, aksi: string): void {
  console.error(`Gagal ${aksi} jasa:`, error);
  if (error?.code === "23505") {
    res.status(409).json({ message: "Nama jasa sudah terdaftar. Gunakan nama lain." });
  } else if (error?.code === "23503") {
    res.status(400).json({ message: "Provinsi yang dipilih tidak valid." });
  } else {
    res.status(500).json(ERROR_SERVER);
  }
}

export async function listProvinsi(_req: Request, res: Response): Promise<void> {
  try {
    res.json(await jasaRepo.getProvinsiList());
  } catch (error) {
    console.error("Gagal mengambil daftar provinsi:", error);
    res.status(500).json(ERROR_SERVER);
  }
}

/** Publik: hanya jasa aktif. ?include_inactive=true hanya berlaku untuk pengguna yang login. */
export async function listJasa(req: Request, res: Response): Promise<void> {
  const mintaSemua = req.query.include_inactive === "true" || req.query.include_inactive === "1";
  try {
    const list = await jasaRepo.getJasaList({
      includeInactive: mintaSemua && bacaPengguna(req) !== null,
      tipe: typeof req.query.tipe === "string" ? req.query.tipe : undefined,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
    });
    res.json(list);
  } catch (error) {
    console.error("Gagal mengambil daftar jasa:", error);
    res.status(500).json(ERROR_SERVER);
  }
}

/** Publik: jasa nonaktif = 404. Pengguna yang login tetap bisa membuka jasa nonaktif. */
export async function getJasaDetail(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(404).json(TIDAK_DITEMUKAN);
    return;
  }
  try {
    const jasa = await jasaRepo.getJasaById(id, bacaPengguna(req) !== null);
    if (!jasa) {
      res.status(404).json(TIDAK_DITEMUKAN);
      return;
    }
    res.json(jasa);
  } catch (error) {
    console.error("Gagal mengambil detail jasa:", error);
    res.status(500).json(ERROR_SERVER);
  }
}

export async function createJasa(req: Request, res: Response): Promise<void> {
  const validation = validateJasaPayload(req.body);
  if (!validation.ok) {
    res.status(400).json({ message: validation.message });
    return;
  }
  try {
    res.status(201).json(await jasaRepo.createJasa(validation.data));
  } catch (error) {
    kirimErrorSimpan(res, error, "menambahkan");
  }
}

export async function updateJasa(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(404).json(TIDAK_DITEMUKAN);
    return;
  }
  const validation = validateJasaPayload(req.body);
  if (!validation.ok) {
    res.status(400).json({ message: validation.message });
    return;
  }
  try {
    const updated = await jasaRepo.updateJasa(id, validation.data);
    if (!updated) {
      res.status(404).json(TIDAK_DITEMUKAN);
      return;
    }
    res.json(updated);
  } catch (error) {
    kirimErrorSimpan(res, error, "memperbarui");
  }
}

export async function toggleStatusJasa(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(404).json(TIDAK_DITEMUKAN);
    return;
  }
  if (typeof req.body?.is_aktif !== "boolean") {
    res.status(400).json({ message: "Field is_aktif (boolean) wajib diisi." });
    return;
  }
  try {
    const updated = await jasaRepo.setAktifJasa(id, req.body.is_aktif);
    if (!updated) {
      res.status(404).json(TIDAK_DITEMUKAN);
      return;
    }
    res.json(updated);
  } catch (error) {
    console.error("Gagal mengubah status aktif jasa:", error);
    res.status(500).json(ERROR_SERVER);
  }
}
