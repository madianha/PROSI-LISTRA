import { pool } from "../db";
import type { TestimoniInput } from "../validation/testimoniValidation";

export interface Testimoni extends TestimoniInput {
  id_testimoni: number;
  tanggal_input: string;
  status: string;
  sumber: string;
  is_aktif: boolean;
}

const KOLOM = `
  id_testimoni, nama_klien, instansi, nama_acara, is_acara_privat, isi_testimoni,
  rating, tanggal_input, status, sumber, is_aktif
`;

/**
 * Untuk halaman publik: hanya yang disetujui DAN aktif, terbaru dulu.
 * Nama acara privat tidak dikirim ke publik.
 */
export async function listPublik(): Promise<Testimoni[]> {
  const result = await pool.query<Testimoni>(
    `SELECT id_testimoni, nama_klien, instansi,
            CASE WHEN is_acara_privat THEN NULL ELSE nama_acara END AS nama_acara,
            is_acara_privat, isi_testimoni, rating, tanggal_input, status, sumber, is_aktif
     FROM testimoni
     WHERE status = 'disetujui' AND is_aktif
     ORDER BY tanggal_input DESC, id_testimoni DESC`,
  );
  return result.rows;
}

/** Untuk halaman internal: semua testimoni, yang menunggu di atas, lalu terbaru. */
export async function listSemua(): Promise<Testimoni[]> {
  const result = await pool.query<Testimoni>(
    `SELECT ${KOLOM} FROM testimoni
     ORDER BY (status = 'menunggu') DESC, tanggal_input DESC, id_testimoni DESC`,
  );
  return result.rows;
}

export async function createTestimoni(
  data: TestimoniInput,
  extra: { status: string; sumber: string; is_aktif: boolean },
): Promise<Testimoni> {
  const result = await pool.query<Testimoni>(
    `INSERT INTO testimoni
       (nama_klien, instansi, nama_acara, is_acara_privat, isi_testimoni, rating, status, sumber, is_aktif)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING ${KOLOM}`,
    [
      data.nama_klien,
      data.instansi,
      data.nama_acara,
      data.is_acara_privat,
      data.isi_testimoni,
      data.rating,
      extra.status,
      extra.sumber,
      extra.is_aktif,
    ],
  );
  return result.rows[0];
}

/** Selain "disetujui", testimoni otomatis disembunyikan (is_aktif false). */
export async function setStatus(id: number, status: string): Promise<Testimoni | null> {
  const result = await pool.query<Testimoni>(
    `UPDATE testimoni
     SET status = $1::varchar, is_aktif = CASE WHEN $1::varchar = 'disetujui' THEN is_aktif ELSE FALSE END
     WHERE id_testimoni = $2
     RETURNING ${KOLOM}`,
    [status, id],
  );
  return result.rows[0] ?? null;
}

/** Hanya testimoni yang sudah disetujui yang boleh ditampilkan. null = tidak ditemukan. */
export async function setAktif(id: number, isAktif: boolean): Promise<Testimoni | "belum_disetujui" | null> {
  const lama = await pool.query<{ status: string }>("SELECT status FROM testimoni WHERE id_testimoni = $1", [id]);
  if (!lama.rows[0]) return null;
  if (isAktif && lama.rows[0].status !== "disetujui") return "belum_disetujui";

  const result = await pool.query<Testimoni>(
    `UPDATE testimoni SET is_aktif = $1 WHERE id_testimoni = $2 RETURNING ${KOLOM}`,
    [isAktif, id],
  );
  return result.rows[0] ?? null;
}

export async function deleteTestimoni(id: number): Promise<boolean> {
  const result = await pool.query("DELETE FROM testimoni WHERE id_testimoni = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
