import { pool } from "../db";

// Semua kolom di sini mengikuti listra-web/db/master.sql + junction.sql apa adanya.
// Posisi pentas (Opening/Middle/Closing) tidak disimpan di tabel jasa,
// melainkan lewat junction jasa_kecocokan -> kecocokan.

export type NamaKecocokan = "Opening" | "Middle" | "Closing";
export const URUTAN_KECOCOKAN: NamaKecocokan[] = ["Opening", "Middle", "Closing"];

export interface Provinsi {
  id_provinsi: number;
  nama_provinsi: string;
  pulau: string;
}

export interface Jasa {
  id_jasa: number;
  tipe_jasa: "tari" | "musik";
  nama: string;
  deskripsi: string | null;
  id_provinsi: number | null;
  nama_provinsi: string | null; // dari tabel provinsi
  pulau: string | null; // dari tabel provinsi
  durasi: number | null;
  harga_minimum: number;
  harga_maximum: number;
  min_performer: number;
  link_media: string | null;
  link_image: string | null;
  is_aktif: boolean;
  kecocokan: NamaKecocokan[]; // dari jasa_kecocokan, urut Opening -> Closing
}

export type JasaInput = Omit<Jasa, "id_jasa" | "nama_provinsi" | "pulau">;

export interface FilterJasa {
  includeInactive?: boolean;
  tipe?: string;
  search?: string;
}

function mapJasaRow(row: any): Jasa {
  const kecocokan = Array.isArray(row.kecocokan) ? row.kecocokan : [];
  return {
    id_jasa: Number(row.id_jasa),
    tipe_jasa: row.tipe_jasa === "musik" ? "musik" : "tari",
    nama: row.nama,
    deskripsi: row.deskripsi ?? null,
    id_provinsi: row.id_provinsi != null ? Number(row.id_provinsi) : null,
    nama_provinsi: row.nama_provinsi ?? null,
    pulau: row.pulau ?? null,
    durasi: row.durasi != null ? Number(row.durasi) : null,
    // NUMERIC dikirim pg sebagai string
    harga_minimum: Number(row.harga_minimum),
    harga_maximum: Number(row.harga_maximum),
    min_performer: Number(row.min_performer),
    link_media: row.link_media ?? null,
    link_image: row.link_image ?? null,
    is_aktif: Boolean(row.is_aktif),
    kecocokan: URUTAN_KECOCOKAN.filter((k) => kecocokan.includes(k)),
  };
}

const SELECT_JASA = `
  SELECT
    j.id_jasa, j.tipe_jasa, j.nama, j.deskripsi, j.id_provinsi,
    p.nama_provinsi, p.pulau,
    j.durasi, j.harga_minimum, j.harga_maximum, j.min_performer,
    j.link_media, j.link_image, j.is_aktif,
    COALESCE(
      (SELECT ARRAY_AGG(k.nama_kecocokan ORDER BY k.id_kecocokan)
       FROM jasa_kecocokan jk
       JOIN kecocokan k ON k.id_kecocokan = jk.id_kecocokan
       WHERE jk.id_jasa = j.id_jasa),
      '{}'
    ) AS kecocokan
  FROM jasa j
  LEFT JOIN provinsi p ON p.id_provinsi = j.id_provinsi
`;

export async function getProvinsiList(): Promise<Provinsi[]> {
  const result = await pool.query<Provinsi>(
    `SELECT id_provinsi, nama_provinsi, pulau
     FROM provinsi
     ORDER BY
       CASE pulau
         WHEN 'Sumatera' THEN 1
         WHEN 'Jawa' THEN 2
         WHEN 'Bali & Nusa Tenggara' THEN 3
         WHEN 'Kalimantan' THEN 4
         WHEN 'Sulawesi' THEN 5
         WHEN 'Maluku' THEN 6
         WHEN 'Papua' THEN 7
         ELSE 8
       END ASC,
       id_provinsi ASC`
  );
  return result.rows.map((r) => ({
    id_provinsi: Number(r.id_provinsi),
    nama_provinsi: r.nama_provinsi,
    pulau: r.pulau,
  }));
}

export async function getJasaList(filters: FilterJasa = {}): Promise<Jasa[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (!filters.includeInactive) conditions.push("j.is_aktif = TRUE");

  const tipe = filters.tipe?.trim().toLowerCase();
  if (tipe && tipe !== "semua") {
    values.push(tipe);
    conditions.push(`j.tipe_jasa = $${values.length}`);
  }

  const search = filters.search?.trim();
  if (search) {
    values.push(`%${search}%`);
    conditions.push(`(j.nama ILIKE $${values.length} OR COALESCE(p.nama_provinsi, '') ILIKE $${values.length})`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await pool.query(`${SELECT_JASA} ${where} ORDER BY j.id_jasa ASC`, values);
  return result.rows.map(mapJasaRow);
}

/** includeInactive = false: jasa nonaktif dianggap tidak ada (untuk halaman publik). */
export async function getJasaById(id: number, includeInactive = false): Promise<Jasa | null> {
  const where = includeInactive ? "WHERE j.id_jasa = $1" : "WHERE j.id_jasa = $1 AND j.is_aktif = TRUE";
  const result = await pool.query(`${SELECT_JASA} ${where}`, [id]);
  return result.rows[0] ? mapJasaRow(result.rows[0]) : null;
}

// Ganti seluruh isi jasa_kecocokan milik satu jasa.
async function simpanKecocokan(client: { query: typeof pool.query }, idJasa: number, kecocokan: NamaKecocokan[]) {
  await client.query("DELETE FROM jasa_kecocokan WHERE id_jasa = $1", [idJasa]);
  if (kecocokan.length === 0) return;
  await client.query(
    `INSERT INTO jasa_kecocokan (id_jasa, id_kecocokan)
     SELECT $1, id_kecocokan FROM kecocokan WHERE nama_kecocokan = ANY($2::text[])`,
    [idJasa, kecocokan]
  );
}

function nilaiKolom(data: JasaInput): unknown[] {
  return [
    data.tipe_jasa,
    data.nama,
    data.deskripsi,
    data.id_provinsi,
    data.durasi,
    data.harga_minimum,
    data.harga_maximum,
    data.min_performer,
    data.link_media,
    data.link_image,
    data.is_aktif,
  ];
}

export async function createJasa(data: JasaInput): Promise<Jasa> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const inserted = await client.query(
      `INSERT INTO jasa
         (tipe_jasa, nama, deskripsi, id_provinsi, durasi, harga_minimum, harga_maximum,
          min_performer, link_media, link_image, is_aktif)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id_jasa`,
      nilaiKolom(data)
    );
    const idJasa = Number(inserted.rows[0].id_jasa);
    await simpanKecocokan(client, idJasa, data.kecocokan);
    const row = await client.query(`${SELECT_JASA} WHERE j.id_jasa = $1`, [idJasa]);
    await client.query("COMMIT");
    return mapJasaRow(row.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function updateJasa(id: number, data: JasaInput): Promise<Jasa | null> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const updated = await client.query(
      `UPDATE jasa SET
         tipe_jasa = $1, nama = $2, deskripsi = $3, id_provinsi = $4, durasi = $5,
         harga_minimum = $6, harga_maximum = $7, min_performer = $8,
         link_media = $9, link_image = $10, is_aktif = $11
       WHERE id_jasa = $12
       RETURNING id_jasa`,
      [...nilaiKolom(data), id]
    );
    if (updated.rowCount === 0) {
      await client.query("ROLLBACK");
      return null;
    }
    await simpanKecocokan(client, id, data.kecocokan);
    const row = await client.query(`${SELECT_JASA} WHERE j.id_jasa = $1`, [id]);
    await client.query("COMMIT");
    return mapJasaRow(row.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function setAktifJasa(id: number, is_aktif: boolean): Promise<Jasa | null> {
  const updated = await pool.query("UPDATE jasa SET is_aktif = $1 WHERE id_jasa = $2", [is_aktif, id]);
  if (updated.rowCount === 0) return null;
  return getJasaById(id, true);
}
