import type { Request, Response } from "express";
import * as jasaRepo from "../repositories/jasaRepository";

const TIDAK_DITEMUKAN = { message: "Jasa tidak ditemukan." };
const ERROR_SERVER = { message: "Terjadi kesalahan pada server." };

function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return id > 0 && Number.isSafeInteger(id) ? id : null;
}

const POSISI_PENTAS_MAP: Record<string, "Opening" | "Middle" | "Closing"> = {
  opening: "Opening",
  middle: "Middle",
  closing: "Closing",
};

const POSISI_ORDER: ("Opening" | "Middle" | "Closing")[] = ["Opening", "Middle", "Closing"];

export function normalizePosisiPentasArray(raw: unknown): ("Opening" | "Middle" | "Closing")[] {
  let list: string[] = [];
  if (Array.isArray(raw)) {
    list = raw.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean);
  } else if (typeof raw === "string" && raw.trim()) {
    list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  }

  const matched = new Set<"Opening" | "Middle" | "Closing">();
  for (const s of list) {
    const norm = POSISI_PENTAS_MAP[s.toLowerCase()];
    if (norm) {
      matched.add(norm);
    }
  }

  return POSISI_ORDER.filter((pos) => matched.has(pos));
}

function normalizeTipeJasa(raw: unknown): "tari" | "musik" | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const lower = raw.trim().toLowerCase();
  if (lower === "tari" || lower === "musik") return lower;
  return null;
}

function isValidHttpUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateJasaPayload(
  body: any
): { ok: boolean; message?: string; data?: jasaRepo.JasaInput } {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "Data jasa tidak valid." };
  }

  const tipe_jasa = normalizeTipeJasa(body.tipe_jasa);
  if (!tipe_jasa) {
    return { ok: false, message: "Jenis jasa wajib dipilih (Tari atau Musik)." };
  }

  const nama = typeof body.nama === "string" ? body.nama.trim() : "";
  if (!nama) {
    return { ok: false, message: "Nama jasa wajib diisi." };
  }
  if (nama.length > 100) {
    return { ok: false, message: "Nama jasa maksimal 100 karakter." };
  }

  const deskripsi =
    typeof body.deskripsi === "string" ? body.deskripsi.trim() : "";

  const posisi_pentas = normalizePosisiPentasArray(
    body.posisi_pentas ?? body.nama_kecocokan
  );
  if (posisi_pentas.length === 0) {
    return {
      ok: false,
      message: "Posisi pentas wajib dipilih (Opening, Middle, atau Closing).",
    };
  }

  let id_provinsi: number | null = null;
  if (tipe_jasa === "tari") {
    const rawProv = body.id_provinsi;
    const parsedProv =
      rawProv !== undefined && rawProv !== null && rawProv !== ""
        ? Number(rawProv)
        : NaN;
    if (!Number.isSafeInteger(parsedProv) || parsedProv <= 0) {
      return {
        ok: false,
        message: "Asal provinsi wajib dipilih untuk jasa Tari.",
      };
    }
    id_provinsi = parsedProv;
  } else {
    id_provinsi = null;
  }

  const rawDurasi = body.durasi;
  const parsedDurasi =
    rawDurasi !== undefined && rawDurasi !== null && rawDurasi !== ""
      ? Number(rawDurasi)
      : NaN;
  if (!Number.isSafeInteger(parsedDurasi) || parsedDurasi <= 0) {
    return {
      ok: false,
      message: "Tolong isi durasi pertunjukan (menit) terlebih dahulu.",
    };
  }

  const rawHargaMin = body.harga_minimum;
  const rawHargaMax = body.harga_maximum;
  const hargaMin =
    rawHargaMin !== undefined && rawHargaMin !== null && rawHargaMin !== ""
      ? Number(rawHargaMin)
      : NaN;
  const hargaMax =
    rawHargaMax !== undefined && rawHargaMax !== null && rawHargaMax !== ""
      ? Number(rawHargaMax)
      : NaN;

  if (!Number.isFinite(hargaMin) || hargaMin < 0) {
    return {
      ok: false,
      message: "Tolong masukkan nominal harga minimum.",
    };
  }
  if (!Number.isFinite(hargaMax) || hargaMax < 0) {
    return {
      ok: false,
      message: "Tolong masukkan nominal harga maksimum.",
    };
  }
  if (hargaMax < hargaMin) {
    return {
      ok: false,
      message: "Harga maksimum tidak boleh lebih kecil dari harga minimum.",
    };
  }

  const rawMinPerformer = body.min_performer ?? 1;
  const minPerformer =
    rawMinPerformer !== "" && rawMinPerformer !== null
      ? Number(rawMinPerformer)
      : NaN;
  if (!Number.isSafeInteger(minPerformer) || minPerformer < 1) {
    return {
      ok: false,
      message: "Minimal performer harus minimal 1 orang.",
    };
  }

  const rawMedia =
    body.tautan_media ?? body.link_media ?? body.media_url ?? "";
  let tautan_media: string | null = null;
  if (typeof rawMedia === "string" && rawMedia.trim() !== "") {
    const trimmedMedia = rawMedia.trim();
    if (!isValidHttpUrl(trimmedMedia)) {
      return {
        ok: false,
        message: "Tautan media harus berupa URL yang valid (http:// atau https://).",
      };
    }
    tautan_media = trimmedMedia;
  }

  const rawFoto =
    body.foto_sampul ?? body.link_image ?? body.gambar_url ?? "";
  const foto_sampul =
    typeof rawFoto === "string" && rawFoto.trim() !== ""
      ? rawFoto.trim()
      : null;

  const is_aktif =
    typeof body.is_aktif === "boolean" ? body.is_aktif : true;

  return {
    ok: true,
    data: {
      tipe_jasa,
      nama,
      deskripsi,
      posisi_pentas,
      id_provinsi,
      durasi: parsedDurasi,
      harga_minimum: hargaMin,
      harga_maximum: hargaMax,
      min_performer: minPerformer,
      tautan_media,
      foto_sampul,
      is_aktif,
    },
  };
}

export async function listProvinsi(_req: Request, res: Response): Promise<void> {
  try {
    const provinsi = await jasaRepo.getProvinsiList();
    res.json(provinsi);
  } catch (error) {
    console.error("Gagal mengambil daftar provinsi:", error);
    res.status(500).json(ERROR_SERVER);
  }
}

export async function listJasa(req: Request, res: Response): Promise<void> {
  try {
    const includeInactive =
      req.query.include_inactive === "true" ||
      req.query.include_inactive === "1" ||
      req.query.internal === "true" ||
      req.query.internal === "1" ||
      req.query.semua === "1" ||
      req.query.semua === "true";

    const tipe = typeof req.query.tipe === "string" ? req.query.tipe : undefined;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;

    const list = await jasaRepo.getJasaList({
      includeInactive,
      tipe,
      search,
    });
    res.json(list);
  } catch (error) {
    console.error("Gagal mengambil daftar jasa:", error);
    res.status(500).json(ERROR_SERVER);
  }
}

export async function getJasaDetail(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(404).json(TIDAK_DITEMUKAN);
    return;
  }
  try {
    const jasa = await jasaRepo.getJasaById(id);
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
  if (!validation.ok || !validation.data) {
    res.status(400).json({ message: validation.message });
    return;
  }

  try {
    const created = await jasaRepo.createJasa(validation.data);
    res.status(201).json(created);
  } catch (error: any) {
    console.error("Gagal menambahkan jasa:", error);
    if (error?.code === "23505") {
      res.status(409).json({ message: "Nama jasa sudah terdaftar. Gunakan nama lain." });
      return;
    }
    if (error?.code === "23503") {
      res.status(400).json({ message: "Provinsi yang dipilih tidak valid." });
      return;
    }
    res.status(500).json(ERROR_SERVER);
  }
}

export async function updateJasa(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(404).json(TIDAK_DITEMUKAN);
    return;
  }

  const validation = validateJasaPayload(req.body);
  if (!validation.ok || !validation.data) {
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
  } catch (error: any) {
    console.error("Gagal memperbarui jasa:", error);
    if (error?.code === "23505") {
      res.status(409).json({ message: "Nama jasa sudah terdaftar. Gunakan nama lain." });
      return;
    }
    if (error?.code === "23503") {
      res.status(400).json({ message: "Provinsi yang dipilih tidak valid." });
      return;
    }
    res.status(500).json(ERROR_SERVER);
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
    const updated = await jasaRepo.toggleStatusJasa(id, req.body.is_aktif);
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
