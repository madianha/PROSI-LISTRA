import { pool } from "../db";
import type { BeritaInput } from "../validation/beritaValidation";

export interface Berita extends BeritaInput {
  id_berita: number;
  is_publik: boolean;
  dibuat_pada: string;
  diperbarui_pada: string;
}

/** semua = true: ikut draf (untuk Kelola Berita). false: hanya yang publik. */
export interface OpsiBaca {
  semua: boolean;
}

// tanggal dikirim sebagai teks YYYY-MM-DD agar tidak bergeser karena zona waktu
const KOLOM = `
  id_berita, judul, to_char(tanggal, 'YYYY-MM-DD') AS tanggal, url_gambar,
  konten, sumber, url_artikel, is_publik, dibuat_pada, diperbarui_pada
`;

export async function listBerita({ semua }: OpsiBaca): Promise<Berita[]> {
  const result = await pool.query<Berita>(
    `SELECT ${KOLOM} FROM berita
     WHERE $1 OR is_publik
     ORDER BY tanggal DESC, id_berita DESC`,
    [semua],
  );
  return result.rows;
}

export async function getBerita(id: number, { semua }: OpsiBaca): Promise<Berita | null> {
  const result = await pool.query<Berita>(
    `SELECT ${KOLOM} FROM berita WHERE id_berita = $1 AND ($2 OR is_publik)`,
    [id, semua],
  );
  return result.rows[0] ?? null;
}

export async function createBerita(data: BeritaInput, isPublik: boolean): Promise<Berita> {
  const result = await pool.query<Berita>(
    `INSERT INTO berita (judul, tanggal, url_gambar, konten, sumber, url_artikel, is_publik)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${KOLOM}`,
    [data.judul, data.tanggal, data.url_gambar, data.konten, data.sumber, data.url_artikel, isPublik],
  );
  return result.rows[0];
}

/** Mengubah isi berita. is_publik sengaja tidak disentuh (diubah lewat setPublik). */
export async function updateBerita(id: number, data: BeritaInput): Promise<Berita | null> {
  const result = await pool.query<Berita>(
    `UPDATE berita
     SET judul = $1, tanggal = $2, url_gambar = $3, konten = $4, sumber = $5,
         url_artikel = $6, diperbarui_pada = NOW()
     WHERE id_berita = $7
     RETURNING ${KOLOM}`,
    [data.judul, data.tanggal, data.url_gambar, data.konten, data.sumber, data.url_artikel, id],
  );
  return result.rows[0] ?? null;
}

export async function setPublik(id: number, isPublik: boolean): Promise<Berita | null> {
  const result = await pool.query<Berita>(
    `UPDATE berita SET is_publik = $1, diperbarui_pada = NOW()
     WHERE id_berita = $2
     RETURNING ${KOLOM}`,
    [isPublik, id],
  );
  return result.rows[0] ?? null;
}

export async function deleteBerita(id: number): Promise<boolean> {
  const result = await pool.query("DELETE FROM berita WHERE id_berita = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
