// Validasi body POST/PUT /api/acara.
// Nama field = nama kolom di listra-web/db/master.sql + junction.sql:
//   acara            -> tipe_acara, nama_acara, nama_klien, lokasi, is_privat
//   acara_pj         -> daftar id_anggota
//   acara_jasa       -> satu baris per jasa per hari (tanggal, jam_mulai, jam_selesai, id_jasa, is_tidak_spesifik)
//   acara_performer  -> id_anggota ATAU nama_performer
// Rentang tanggal event tidak disimpan; dihitung dari tanggal di acara_jasa.

export type TipeAcara = "job_external" | "listra";

export interface PerformerInput {
  id_anggota: number | null;
  nama_performer: string | null;
}

export interface AcaraJasaInput {
  tanggal: string; // YYYY-MM-DD
  jam_mulai: string; // HH:MM
  jam_selesai: string; // HH:MM
  id_jasa: number | null; // NULL = hari tanpa jasa
  is_tidak_spesifik: boolean;
  acara_performer: PerformerInput[];
}

export interface AcaraInput {
  tipe_acara: TipeAcara;
  nama_acara: string;
  nama_klien: string | null;
  lokasi: string | null;
  is_privat: boolean;
  acara_pj: number[]; // id_anggota; kosong = PJ Tidak Spesifik (hanya Acara LISTRA)
  acara_jasa: AcaraJasaInput[];
}

export type HasilValidasiAcara = { ok: true; data: AcaraInput } | { ok: false; message: string };

export const MAKS_HARI = 14;

function teks(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function idPositif(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" && /^\d+$/.test(value) ? Number(value) : NaN;
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

export function isTanggalValid(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** "9:05", "09:05", "09:05:00" -> "09:05"; selain itu null. */
export function normalJam(value: unknown): string | null {
  const m = typeof value === "string" ? /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim()) : null;
  if (!m) return null;
  const jam = Number(m[1]);
  const menit = Number(m[2]);
  if (jam > 23 || menit > 59) return null;
  return `${String(jam).padStart(2, "0")}:${m[2]}`;
}

/** Selisih hari antara dua tanggal YYYY-MM-DD. */
export function selisihHari(dari: string, sampai: string): number {
  return Math.round((Date.parse(`${sampai}T00:00:00Z`) - Date.parse(`${dari}T00:00:00Z`)) / 86_400_000);
}

function validasiPerformer(raw: unknown, label: string): { ok: true; data: PerformerInput[] } | { ok: false; message: string } {
  if (raw === undefined || raw === null) return { ok: true, data: [] };
  if (!Array.isArray(raw)) return { ok: false, message: `Daftar performer ${label} tidak valid.` };

  const hasil: PerformerInput[] = [];
  const anggotaDipilih = new Set<number>();
  for (const item of raw) {
    const idAnggota = idPositif(item?.id_anggota);
    const nama = teks(item?.nama_performer);
    if (idAnggota !== null && nama) {
      return { ok: false, message: `Performer ${label} harus anggota atau non-anggota, bukan keduanya.` };
    }
    if (idAnggota !== null) {
      if (anggotaDipilih.has(idAnggota)) {
        return { ok: false, message: `Anggota yang sama tidak boleh dipilih dua kali untuk jasa yang sama (${label}).` };
      }
      anggotaDipilih.add(idAnggota);
      hasil.push({ id_anggota: idAnggota, nama_performer: null });
    } else {
      if (!nama) return { ok: false, message: `Nama performer non-anggota ${label} wajib diisi.` };
      if (nama.length > 255) return { ok: false, message: `Nama performer non-anggota ${label} maksimal 255 karakter.` };
      hasil.push({ id_anggota: null, nama_performer: nama });
    }
  }
  return { ok: true, data: hasil };
}

export function validateAcaraPayload(body: any): HasilValidasiAcara {
  if (!body || typeof body !== "object") return { ok: false, message: "Data event tidak valid." };

  const tipe = teks(body.tipe_acara);
  if (tipe !== "job_external" && tipe !== "listra") {
    return { ok: false, message: "Jenis acara wajib dipilih (Acara Job External atau Acara LISTRA)." };
  }

  const nama_acara = teks(body.nama_acara);
  if (!nama_acara) return { ok: false, message: "Nama event wajib diisi." };
  if (nama_acara.length > 150) return { ok: false, message: "Nama event maksimal 150 karakter." };

  // chk_acara_klien: Nama Client hanya untuk Acara Job External
  const klien = tipe === "job_external" ? teks(body.nama_klien) : "";
  if (klien.length > 100) return { ok: false, message: "Nama Client maksimal 100 karakter." };

  const lokasi = teks(body.lokasi);
  if (lokasi.length > 200) return { ok: false, message: "Lokasi maksimal 200 karakter." };

  // PJ: boleh dikirim sebagai [1, 2] atau [{ id_anggota: 1 }, ...]
  const rawPj = body.acara_pj ?? [];
  if (!Array.isArray(rawPj)) return { ok: false, message: "Daftar PJ tidak valid." };
  const acara_pj: number[] = [];
  for (const item of rawPj) {
    const id = idPositif(typeof item === "object" && item !== null ? item.id_anggota : item);
    if (id === null) return { ok: false, message: "Daftar PJ tidak valid." };
    if (!acara_pj.includes(id)) acara_pj.push(id);
  }
  if (tipe === "job_external" && acara_pj.length === 0) {
    return { ok: false, message: "Acara Job External wajib punya minimal satu PJ Kepengurusan." };
  }

  const rawJasa = body.acara_jasa;
  if (!Array.isArray(rawJasa) || rawJasa.length === 0) {
    return { ok: false, message: "Event wajib punya minimal satu hari dengan jam mulai dan jam selesai." };
  }

  const acara_jasa: AcaraJasaInput[] = [];
  for (const [i, item] of rawJasa.entries()) {
    const label = `baris ${i + 1}`;
    if (!isTanggalValid(item?.tanggal)) return { ok: false, message: `Tanggal pada ${label} tidak valid.` };
    const tanggal = item.tanggal as string;
    const jam_mulai = normalJam(item?.jam_mulai);
    const jam_selesai = normalJam(item?.jam_selesai);
    if (!jam_mulai || !jam_selesai) return { ok: false, message: `Jam mulai dan jam selesai pada ${tanggal} wajib diisi.` };
    // chk_acara_jasa_jam
    if (jam_selesai <= jam_mulai) return { ok: false, message: `Jam selesai harus setelah jam mulai (${tanggal}).` };

    let id_jasa: number | null = null;
    if (item?.id_jasa !== undefined && item?.id_jasa !== null && item?.id_jasa !== "") {
      id_jasa = idPositif(item.id_jasa);
      if (id_jasa === null) return { ok: false, message: `Jasa pada ${tanggal} tidak valid.` };
    }
    // hari tanpa jasa tidak punya arti "tidak spesifik"
    const is_tidak_spesifik = id_jasa !== null && item?.is_tidak_spesifik === true;

    const performer = validasiPerformer(item?.acara_performer, `pada ${tanggal}`);
    if (!performer.ok) return performer;
    if (performer.data.length > 0 && (id_jasa === null || is_tidak_spesifik)) {
      return {
        ok: false,
        message: `Performer hanya dicatat untuk jasa yang tidak bertanda Tidak Spesifik (${tanggal}).`,
      };
    }

    acara_jasa.push({ tanggal, jam_mulai, jam_selesai, id_jasa, is_tidak_spesifik, acara_performer: performer.data });
  }

  const daftarTanggal = acara_jasa.map((r) => r.tanggal).sort();
  if (selisihHari(daftarTanggal[0], daftarTanggal[daftarTanggal.length - 1]) + 1 > MAKS_HARI) {
    return { ok: false, message: `Rentang event paling lama ${MAKS_HARI} hari.` };
  }

  return {
    ok: true,
    data: {
      tipe_acara: tipe,
      nama_acara,
      nama_klien: klien || null,
      lokasi: lokasi || null,
      is_privat: body.is_privat === true,
      acara_pj,
      acara_jasa,
    },
  };
}
