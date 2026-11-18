import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import * as anggotaRepo from "../repositories/anggotaRepository";
import { verifyJwt } from "./authController";

const TIDAK_DITEMUKAN = { message: "Anggota tidak ditemukan." };
const ERROR_SERVER = { message: "Terjadi kesalahan pada server." };

// hanya peran ini yang boleh mengatur kata sandi anggota lain
const PERAN_PENGATUR_PASSWORD = ["admin", "listra"];
const MIN_PANJANG_PASSWORD = 8;

/** true bila pengirim request login sebagai Admin atau LISTRA (dari header Authorization: Bearer <token>). */
function bolehAturPassword(req: Request): boolean {
  const header = req.headers.authorization ?? "";
  if (!header.startsWith("Bearer ")) return false;
  const payload = verifyJwt(header.slice(7));
  return typeof payload?.peran === "string" && PERAN_PENGATUR_PASSWORD.includes(payload.peran);
}

/**
 * Ubah body.password (teks biasa) menjadi password_hash di data.
 * Mengembalikan pesan error + status bila ditolak, atau null bila aman lanjut.
 */
async function siapkanPassword(
  req: Request,
  data: anggotaRepo.AnggotaInput & { password?: string },
): Promise<{ status: number; message: string } | null> {
  const password = data.password;
  delete data.password;
  if (password === undefined) return null;
  if (!bolehAturPassword(req)) {
    return { status: 403, message: "Hanya Admin atau LISTRA yang boleh mengatur kata sandi." };
  }
  data.password_hash = await bcrypt.hash(password, 10);
  return null;
}

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

const PERAN_TO_DB: Record<string, string> = {
  admin: "admin",
  kepengurusan: "listra",
  listra: "listra",
  humas: "humas",
  pelatih: "pelatih",
  "anggota biasa": "anggota",
  anggota: "anggota",
  alumni: "alumni",
};

function normalizePeranToDb(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.trim() === "") return "listra";
  return PERAN_TO_DB[raw.trim().toLowerCase()] ?? null;
}

export async function listAnggota(req: Request, res: Response): Promise<void> {
  try {
    const { search, peran, angkatan } = req.query;
    const peranStr = typeof peran === "string" && peran.trim() && peran !== "Semua"
      ? (normalizePeranToDb(peran) ?? peran.trim())
      : undefined;
    const filters: anggotaRepo.FilterAnggota = {
      search: typeof search === "string" ? search : undefined,
      peran: peranStr,
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

function validateAnggotaPayload(
  body: any,
  isCreate: boolean = false
): { ok: boolean; message?: string; data?: anggotaRepo.AnggotaInput & { password?: string } } {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "Data tidak valid." };
  }

  const nama = typeof body.nama === "string" ? body.nama.trim() : "";
  if (!nama) {
    return { ok: false, message: "Nama wajib diisi." };
  }

  const emailRaw = typeof body.email === "string" ? body.email.trim() : "";
  if (isCreate && !emailRaw) {
    return { ok: false, message: "Email wajib diisi." };
  }
  if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
    return { ok: false, message: "Format email tidak valid." };
  }
  const email = emailRaw || null;

  const npm = typeof body.npm === "string" && body.npm.trim() !== "" ? body.npm.trim() : null;
  const peran = normalizePeranToDb(body.peran);
  if (!peran) {
    return { ok: false, message: "Peran tidak valid." };
  }
  const jabatan = typeof body.jabatan === "string" && body.jabatan.trim() !== "" ? body.jabatan.trim() : null;

  let is_penari = false;
  if (typeof body.is_penari === "boolean") {
    is_penari = body.is_penari;
  }

  let is_pemusik = false;
  if (typeof body.is_pemusik === "boolean") {
    is_pemusik = body.is_pemusik;
  }

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

  // kata sandi dikirim sebagai teks biasa lalu di-hash di server; password_hash dari luar diabaikan
  let password: string | undefined;
  if (typeof body.password === "string" && body.password !== "") {
    if (body.password.length < MIN_PANJANG_PASSWORD) {
      return { ok: false, message: `Kata sandi minimal ${MIN_PANJANG_PASSWORD} karakter.` };
    }
    password = body.password;
  }

  return {
    ok: true,
    data: {
      nama,
      email,
      npm,
      peran,
      jabatan,
      angkatan_unpar,
      is_penari,
      is_pemusik,
      is_aktif,
      password,
      spesialisasi_ids,
    },
  };
}

export async function createAnggota(req: Request, res: Response): Promise<void> {
  const validation = validateAnggotaPayload(req.body, true);
  if (!validation.ok || !validation.data) {
    res.status(400).json({ message: validation.message });
    return;
  }

  if (validation.data.peran === "admin") {
    res.status(400).json({ message: "Peran Admin hanya dapat ditambahkan langsung melalui database." });
    return;
  }

  try {
    const ditolak = await siapkanPassword(req, validation.data);
    if (ditolak) {
      res.status(ditolak.status).json({ message: ditolak.message });
      return;
    }
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

  const validation = validateAnggotaPayload(req.body, false);
  if (!validation.ok || !validation.data) {
    res.status(400).json({ message: validation.message });
    return;
  }

  try {
    if (validation.data.peran === "admin") {
      const existing = await anggotaRepo.getAnggotaById(id);
      if (existing && existing.peran !== "Admin") {
        res.status(400).json({ message: "Peran Admin hanya dapat ditambahkan langsung melalui database." });
        return;
      }
    }
    const ditolak = await siapkanPassword(req, validation.data);
    if (ditolak) {
      res.status(ditolak.status).json({ message: ditolak.message });
      return;
    }
    const updated = await anggotaRepo.updateAnggota(id, validation.data);
    if (!updated) {
      res.status(404).json(TIDAK_DITEMUKAN);
      return;
    }
    res.json(updated);
  } catch (error: any) {
    console.error("Gagal memperbarui data anggota:", error);
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

export async function toggleStatus(req: Request, res: Response): Promise<void> {
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
    const updated = await anggotaRepo.toggleStatusAktif(id, req.body.is_aktif);
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
export async function toggleStatusAktif(req: Request, res: Response): Promise<void> {
  return toggleStatus(req, res);
}

// ================= Tambah Massal (Bulk Add) =================

export const MAKS_BARIS_BULK = 500;

export interface KesalahanBulk {
  baris: number; // nomor baris di tabel, mulai 1
  kolom: string; // nama kolom tabel anggota
  pesan: string;
}

/** "ya", "y", "true", "1", "x" = true; "tidak", "t", "false", "0", kosong = false. */
function bacaBoolean(raw: unknown, bawaan: boolean): boolean | null {
  if (typeof raw === "boolean") return raw;
  const teks = String(raw ?? "").trim().toLowerCase();
  if (teks === "") return bawaan;
  if (["ya", "y", "true", "1", "x", "aktif"].includes(teks)) return true;
  if (["tidak", "t", "n", "false", "0", "nonaktif"].includes(teks)) return false;
  return null;
}

const teksBulk = (v: unknown) => (typeof v === "string" || typeof v === "number" ? String(v).trim() : "");

/** Validasi satu baris; kolom & batas sesuai tabel anggota (master.sql). */
export function validasiBarisBulk(row: any, baris: number): { data: anggotaRepo.AnggotaBulkInput | null; salah: KesalahanBulk[] } {
  const salah: KesalahanBulk[] = [];
  const catat = (kolom: string, pesan: string) => salah.push({ baris, kolom, pesan });

  const nama = teksBulk(row?.nama);
  if (!nama) catat("nama", "Nama wajib diisi.");
  else if (nama.length > 100) catat("nama", "Nama maksimal 100 karakter.");

  const email = teksBulk(row?.email);
  if (!email) catat("email", "Email wajib diisi.");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) catat("email", "Format email tidak valid.");

  const npm = teksBulk(row?.npm);
  if (npm && !/^[0-9]{6,12}$/.test(npm)) catat("npm", "NPM harus 6-12 angka.");

  const angkatanTeks = teksBulk(row?.angkatan_unpar);
  if (angkatanTeks && !/^[0-9]{4}$/.test(angkatanTeks)) catat("angkatan_unpar", "Angkatan harus tahun 4 angka, mis. 2023.");

  const jabatan = teksBulk(row?.jabatan);
  if (jabatan.length > 50) catat("jabatan", "Jabatan maksimal 50 karakter.");

  const peranTeks = teksBulk(row?.peran);
  const peran = peranTeks ? PERAN_TO_DB[peranTeks.toLowerCase()] ?? null : null;
  if (!peranTeks) catat("peran", "Peran wajib diisi.");
  else if (!peran) catat("peran", "Peran tidak dikenal (Kepengurusan, Humas, Pelatih, Anggota, Alumni).");
  else if (peran === "admin") catat("peran", "Peran Admin hanya dapat ditambahkan langsung melalui database.");

  const is_penari = bacaBoolean(row?.is_penari, false);
  const is_pemusik = bacaBoolean(row?.is_pemusik, false);
  const is_aktif = bacaBoolean(row?.is_aktif, true);
  if (is_penari === null) catat("is_penari", "Isi Ya atau Tidak.");
  if (is_pemusik === null) catat("is_pemusik", "Isi Ya atau Tidak.");
  if (is_aktif === null) catat("is_aktif", "Isi Ya atau Tidak.");

  if (salah.length > 0) return { data: null, salah };
  return {
    data: {
      nama,
      email,
      npm: npm || null,
      angkatan_unpar: angkatanTeks ? Number(angkatanTeks) : null,
      jabatan: jabatan || null,
      peran: peran as string,
      is_penari: is_penari as boolean,
      is_pemusik: is_pemusik as boolean,
      is_aktif: is_aktif as boolean,
    },
    salah,
  };
}

/**
 * POST /api/anggota/bulk  body: { anggota: [ {nama, email, npm, angkatan_unpar, jabatan, peran, is_penari, is_pemusik, is_aktif}, ... ] }
 * Semua atau tidak sama sekali: ada satu baris salah = tidak ada yang disimpan, balasan 400 berisi daftar kesalahan per baris.
 * Kata sandi semua anggota baru = kata sandi bawaan (password123), sama seperti Tambah Anggota tanpa kata sandi.
 */
export async function createAnggotaBulk(req: Request, res: Response): Promise<void> {
  const rows = req.body?.anggota;
  if (!Array.isArray(rows) || rows.length === 0) {
    res.status(400).json({ message: "Tidak ada baris anggota untuk disimpan.", kesalahan: [] });
    return;
  }
  if (rows.length > MAKS_BARIS_BULK) {
    res.status(400).json({ message: `Maksimal ${MAKS_BARIS_BULK} baris sekali simpan.`, kesalahan: [] });
    return;
  }

  const kesalahan: KesalahanBulk[] = [];
  const data: anggotaRepo.AnggotaBulkInput[] = [];
  rows.forEach((row, i) => {
    const hasil = validasiBarisBulk(row, i + 1);
    kesalahan.push(...hasil.salah);
    if (hasil.data) data.push({ ...hasil.data, baris: i + 1 } as any);
  });

  // email / NPM ganda di dalam tabel itu sendiri
  const pertamaEmail = new Map<string, number>();
  const pertamaNpm = new Map<string, number>();
  for (const d of data as any[]) {
    const e = String(d.email).toLowerCase();
    if (pertamaEmail.has(e)) kesalahan.push({ baris: d.baris, kolom: "email", pesan: `Email sama dengan baris ${pertamaEmail.get(e)}.` });
    else pertamaEmail.set(e, d.baris);
    if (d.npm) {
      if (pertamaNpm.has(d.npm)) kesalahan.push({ baris: d.baris, kolom: "npm", pesan: `NPM sama dengan baris ${pertamaNpm.get(d.npm)}.` });
      else pertamaNpm.set(d.npm, d.baris);
    }
  }

  try {
    if (data.length > 0) {
      const terdaftar = await anggotaRepo.cariTerdaftar(
        data.map((d) => String(d.email)),
        data.map((d) => d.npm).filter((n): n is string => Boolean(n))
      );
      for (const d of data as any[]) {
        if (terdaftar.emails.includes(String(d.email).toLowerCase()))
          kesalahan.push({ baris: d.baris, kolom: "email", pesan: "Email sudah terdaftar." });
        if (d.npm && terdaftar.npms.includes(d.npm)) kesalahan.push({ baris: d.baris, kolom: "npm", pesan: "NPM sudah terdaftar." });
      }
    }

    if (kesalahan.length > 0) {
      kesalahan.sort((a, b) => a.baris - b.baris);
      res.status(400).json({ message: `Ada ${kesalahan.length} kesalahan. Tidak ada anggota yang disimpan.`, kesalahan });
      return;
    }

    const jumlah = await anggotaRepo.createAnggotaBulk(data.map(({ baris, ...d }: any) => d));
    res.status(201).json({ message: `${jumlah} anggota ditambahkan.`, jumlah });
  } catch (error: any) {
    console.error("Gagal menambah anggota massal:", error);
    if (error?.code === "23505") {
      res.status(409).json({ message: "Ada email atau NPM yang baru saja terdaftar. Muat ulang lalu coba lagi.", kesalahan: [] });
      return;
    }
    res.status(500).json(ERROR_SERVER);
  }
}
