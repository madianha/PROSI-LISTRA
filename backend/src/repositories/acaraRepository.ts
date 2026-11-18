import { pool } from "../db";
import type { AcaraInput } from "../validation/acaraValidation";

// Tabel: acara, acara_pj, acara_jasa, acara_performer (listra-web/db/master.sql + junction.sql).
// Tanggal & jam dikirim sebagai teks (YYYY-MM-DD, HH:MM) agar tidak bergeser karena zona waktu.

export interface AcaraPerformer {
  id_acara_performer: number;
  id_anggota: number | null;
  nama_performer: string | null;
  anggota: { nama: string; jabatan: string | null; peran: string } | null;
}

export interface AcaraJasa {
  id_acara_jasa: number;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  is_tidak_spesifik: boolean;
  id_jasa: number | null;
  jasa: {
    id_jasa: number;
    nama: string;
    tipe_jasa: "tari" | "musik";
    min_performer: number;
    is_aktif: boolean;
    kecocokan: string[];
  } | null;
  acara_performer: AcaraPerformer[];
}

export interface Acara {
  id_acara: number;
  tipe_acara: "job_external" | "listra";
  nama_acara: string;
  nama_klien: string | null;
  lokasi: string | null;
  is_privat: boolean;
  acara_pj: { id_anggota: number; nama: string; jabatan: string | null }[];
  acara_jasa: AcaraJasa[];
  // turunan (tidak disimpan)
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  kecukupan: { terisi: number; dibutuhkan: number; kurang: number };
}

export interface JadwalPublik {
  id_acara: number;
  tipe_acara: "job_external" | "listra";
  nama_acara: string; // "Acara privat" bila is_privat
  lokasi: string | null; // NULL bila is_privat
  is_privat: boolean;
  acara_jasa: {
    id_acara_jasa: number;
    tanggal: string;
    jam_mulai: string;
    jam_selesai: string;
    jasa: { id_jasa: number; nama: string; tipe_jasa: "tari" | "musik"; is_aktif: boolean } | null;
  }[];
}

export interface RentangTanggal {
  dari?: string;
  sampai?: string;
}

type Queryable = { query: typeof pool.query };

const SELECT_ACARA = `
  SELECT
    a.id_acara, a.tipe_acara, a.nama_acara, a.nama_klien, a.lokasi, a.is_privat,
    COALESCE((
      SELECT json_agg(json_build_object('id_anggota', an.id_anggota, 'nama', an.nama, 'jabatan', an.jabatan)
                      ORDER BY an.nama)
      FROM acara_pj pj
      JOIN anggota an ON an.id_anggota = pj.id_anggota
      WHERE pj.id_acara = a.id_acara
    ), '[]') AS acara_pj,
    COALESCE((
      SELECT json_agg(json_build_object(
        'id_acara_jasa', aj.id_acara_jasa,
        'tanggal', to_char(aj.tanggal, 'YYYY-MM-DD'),
        'jam_mulai', to_char(aj.jam_mulai, 'HH24:MI'),
        'jam_selesai', to_char(aj.jam_selesai, 'HH24:MI'),
        'is_tidak_spesifik', aj.is_tidak_spesifik,
        'id_jasa', aj.id_jasa,
        'jasa', CASE WHEN j.id_jasa IS NULL THEN NULL ELSE json_build_object(
          'id_jasa', j.id_jasa,
          'nama', j.nama,
          'tipe_jasa', j.tipe_jasa,
          'min_performer', j.min_performer,
          'is_aktif', j.is_aktif,
          'kecocokan', COALESCE((
            SELECT json_agg(k.nama_kecocokan ORDER BY k.id_kecocokan)
            FROM jasa_kecocokan jk
            JOIN kecocokan k ON k.id_kecocokan = jk.id_kecocokan
            WHERE jk.id_jasa = j.id_jasa
          ), '[]')
        ) END,
        'acara_performer', COALESCE((
          SELECT json_agg(json_build_object(
            'id_acara_performer', ap.id_acara_performer,
            'id_anggota', ap.id_anggota,
            'nama_performer', ap.nama_performer,
            'anggota', CASE WHEN ag.id_anggota IS NULL THEN NULL
                       ELSE json_build_object('nama', ag.nama, 'jabatan', ag.jabatan, 'peran', ag.peran) END
          ) ORDER BY ap.id_acara_performer)
          FROM acara_performer ap
          LEFT JOIN anggota ag ON ag.id_anggota = ap.id_anggota
          WHERE ap.id_acara_jasa = aj.id_acara_jasa
        ), '[]')
      ) ORDER BY aj.tanggal, aj.jam_mulai, aj.id_acara_jasa)
      FROM acara_jasa aj
      LEFT JOIN jasa j ON j.id_jasa = aj.id_jasa
      WHERE aj.id_acara = a.id_acara
    ), '[]') AS acara_jasa
  FROM acara a
`;

const URUT_TANGGAL = `
  ORDER BY (SELECT MIN(x.tanggal) FROM acara_jasa x WHERE x.id_acara = a.id_acara) NULLS LAST, a.id_acara
`;

/** WHERE untuk event yang punya minimal satu baris acara_jasa di dalam rentang. */
function filterRentang(rentang: RentangTanggal, values: unknown[]): string {
  const syarat: string[] = [];
  if (rentang.dari) {
    values.push(rentang.dari);
    syarat.push(`r.tanggal >= $${values.length}`);
  }
  if (rentang.sampai) {
    values.push(rentang.sampai);
    syarat.push(`r.tanggal <= $${values.length}`);
  }
  if (syarat.length === 0) return "";
  return `WHERE EXISTS (SELECT 1 FROM acara_jasa r WHERE r.id_acara = a.id_acara AND ${syarat.join(" AND ")})`;
}

/** Tambah field turunan: rentang tanggal & kecukupan performer (jasa Tidak Spesifik tidak dihitung). */
export function lengkapiAcara(row: any): Acara {
  const acaraJasa: AcaraJasa[] = row.acara_jasa ?? [];
  const tanggal = acaraJasa.map((r) => r.tanggal).sort();
  let terisi = 0;
  let dibutuhkan = 0;
  for (const r of acaraJasa) {
    if (!r.jasa || r.is_tidak_spesifik) continue;
    dibutuhkan += r.jasa.min_performer;
    terisi += Math.min(r.acara_performer.length, r.jasa.min_performer);
  }
  return {
    id_acara: Number(row.id_acara),
    tipe_acara: row.tipe_acara,
    nama_acara: row.nama_acara,
    nama_klien: row.nama_klien ?? null,
    lokasi: row.lokasi ?? null,
    is_privat: Boolean(row.is_privat),
    acara_pj: row.acara_pj ?? [],
    acara_jasa: acaraJasa,
    tanggal_mulai: tanggal[0] ?? null,
    tanggal_selesai: tanggal[tanggal.length - 1] ?? null,
    kecukupan: { terisi, dibutuhkan, kurang: dibutuhkan - terisi },
  };
}

export async function listAcara(rentang: RentangTanggal = {}): Promise<Acara[]> {
  const values: unknown[] = [];
  const where = filterRentang(rentang, values);
  const result = await pool.query(`${SELECT_ACARA} ${where} ${URUT_TANGGAL}`, values);
  return result.rows.map(lengkapiAcara);
}

export async function getAcaraById(id: number, db: Queryable = pool): Promise<Acara | null> {
  const result = await db.query(`${SELECT_ACARA} WHERE a.id_acara = $1`, [id]);
  return result.rows[0] ? lengkapiAcara(result.rows[0]) : null;
}

/** Jadwal publik: tanpa Nama Client, PJ, dan performer; nama & lokasi acara privat disamarkan di SQL. */
export async function listJadwalPublik(rentang: RentangTanggal = {}): Promise<JadwalPublik[]> {
  const values: unknown[] = [];
  const where = filterRentang(rentang, values);
  const result = await pool.query(
    `SELECT
       a.id_acara, a.tipe_acara, a.is_privat,
       CASE WHEN a.is_privat THEN 'Acara privat' ELSE a.nama_acara END AS nama_acara,
       CASE WHEN a.is_privat THEN NULL ELSE a.lokasi END AS lokasi,
       COALESCE((
         SELECT json_agg(json_build_object(
           'id_acara_jasa', aj.id_acara_jasa,
           'tanggal', to_char(aj.tanggal, 'YYYY-MM-DD'),
           'jam_mulai', to_char(aj.jam_mulai, 'HH24:MI'),
           'jam_selesai', to_char(aj.jam_selesai, 'HH24:MI'),
           'jasa', CASE WHEN j.id_jasa IS NULL THEN NULL ELSE json_build_object(
             'id_jasa', j.id_jasa, 'nama', j.nama, 'tipe_jasa', j.tipe_jasa, 'is_aktif', j.is_aktif
           ) END
         ) ORDER BY aj.tanggal, aj.jam_mulai, aj.id_acara_jasa)
         FROM acara_jasa aj
         LEFT JOIN jasa j ON j.id_jasa = aj.id_jasa
         WHERE aj.id_acara = a.id_acara
       ), '[]') AS acara_jasa
     FROM acara a
     ${where}
     ${URUT_TANGGAL}`,
    values
  );
  return result.rows.map((row) => ({
    id_acara: Number(row.id_acara),
    tipe_acara: row.tipe_acara,
    nama_acara: row.nama_acara,
    lokasi: row.lokasi ?? null,
    is_privat: Boolean(row.is_privat),
    acara_jasa: row.acara_jasa ?? [],
  }));
}

export interface StatusAnggota {
  id_anggota: number;
  peran: string;
  is_aktif: boolean;
}

export async function getStatusAnggota(ids: number[]): Promise<StatusAnggota[]> {
  if (ids.length === 0) return [];
  const result = await pool.query(
    "SELECT id_anggota, peran, is_aktif FROM anggota WHERE id_anggota = ANY($1::int[])",
    [ids]
  );
  return result.rows.map((r) => ({ id_anggota: Number(r.id_anggota), peran: r.peran, is_aktif: Boolean(r.is_aktif) }));
}

/** id_anggota yang sudah tercatat di event ini (PJ maupun performer). */
export async function getAnggotaTerlibat(idAcara: number): Promise<number[]> {
  const result = await pool.query(
    `SELECT id_anggota FROM acara_pj WHERE id_acara = $1
     UNION
     SELECT ap.id_anggota FROM acara_performer ap
     JOIN acara_jasa aj ON aj.id_acara_jasa = ap.id_acara_jasa
     WHERE aj.id_acara = $1 AND ap.id_anggota IS NOT NULL`,
    [idAcara]
  );
  return result.rows.map((r) => Number(r.id_anggota));
}

/** Tulis ulang seluruh PJ, jasa per hari, dan performer milik satu event. */
async function simpanIsiAcara(client: Queryable, idAcara: number, data: AcaraInput): Promise<void> {
  await client.query("DELETE FROM acara_pj WHERE id_acara = $1", [idAcara]);
  // acara_performer ikut terhapus (ON DELETE CASCADE)
  await client.query("DELETE FROM acara_jasa WHERE id_acara = $1", [idAcara]);

  if (data.acara_pj.length > 0) {
    await client.query(
      "INSERT INTO acara_pj (id_acara, id_anggota) SELECT $1, UNNEST($2::int[])",
      [idAcara, data.acara_pj]
    );
  }

  for (const baris of data.acara_jasa) {
    const inserted = await client.query(
      `INSERT INTO acara_jasa (id_acara, id_jasa, tanggal, jam_mulai, jam_selesai, is_tidak_spesifik)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id_acara_jasa`,
      [idAcara, baris.id_jasa, baris.tanggal, baris.jam_mulai, baris.jam_selesai, baris.is_tidak_spesifik]
    );
    if (baris.acara_performer.length === 0) continue;
    await client.query(
      `INSERT INTO acara_performer (id_acara_jasa, id_anggota, nama_performer)
       SELECT $1, p.id_anggota, p.nama_performer
       FROM UNNEST($2::int[], $3::varchar[]) AS p(id_anggota, nama_performer)`,
      [
        inserted.rows[0].id_acara_jasa,
        baris.acara_performer.map((p) => p.id_anggota),
        baris.acara_performer.map((p) => p.nama_performer),
      ]
    );
  }
}

export async function createAcara(data: AcaraInput): Promise<Acara> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const inserted = await client.query(
      `INSERT INTO acara (tipe_acara, nama_acara, nama_klien, lokasi, is_privat)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_acara`,
      [data.tipe_acara, data.nama_acara, data.nama_klien, data.lokasi, data.is_privat]
    );
    const idAcara = Number(inserted.rows[0].id_acara);
    await simpanIsiAcara(client, idAcara, data);
    const acara = await getAcaraById(idAcara, client);
    await client.query("COMMIT");
    return acara as Acara;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function updateAcara(id: number, data: AcaraInput): Promise<Acara | null> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const updated = await client.query(
      `UPDATE acara SET tipe_acara = $1, nama_acara = $2, nama_klien = $3, lokasi = $4, is_privat = $5
       WHERE id_acara = $6`,
      [data.tipe_acara, data.nama_acara, data.nama_klien, data.lokasi, data.is_privat, id]
    );
    if (updated.rowCount === 0) {
      await client.query("ROLLBACK");
      return null;
    }
    await simpanIsiAcara(client, id, data);
    const acara = await getAcaraById(id, client);
    await client.query("COMMIT");
    return acara;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** acara_pj, acara_jasa, dan acara_performer ikut terhapus (ON DELETE CASCADE). */
export async function deleteAcara(id: number): Promise<boolean> {
  const result = await pool.query("DELETE FROM acara WHERE id_acara = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
