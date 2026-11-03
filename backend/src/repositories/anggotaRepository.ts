import { pool } from "../db";

export interface Spesialisasi {
  id_spesialisasi: number;
  nama_spesialisasi: string;
  kategori: "TARI" | "MUSIK";
}

export interface Anggota {
  id_anggota: number;
  nama: string;
  email: string | null;
  npm: string | null;
  peran: string;
  angkatan_unpar: number | null;
  jabatan: string | null;
  is_aktif: boolean;
  spesialisasi: Array<{
    id_spesialisasi: number;
    nama_spesialisasi: string;
    kategori: "TARI" | "MUSIK";
  }>;
}

export interface AnggotaInput {
  nama: string;
  email?: string | null;
  npm?: string | null;
  peran?: string;
  angkatan_unpar?: number | null;
  jabatan?: string | null;
  is_aktif?: boolean;
  spesialisasi_ids?: number[];
}

export interface FilterAnggota {
  search?: string;
  peran?: string;
  angkatan?: number;
}

export async function getSpesialisasiList(): Promise<Spesialisasi[]> {
  const result = await pool.query<Spesialisasi>(
    `SELECT id_spesialisasi, nama_spesialisasi, kategori
     FROM spesialisasi
     ORDER BY kategori DESC, nama_spesialisasi ASC`
  );
  return result.rows;
}

export async function getAnggota(filters: FilterAnggota = {}): Promise<Anggota[]> {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  if (filters.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    conditions.push(
      `(a.nama ILIKE $${paramIdx} OR a.npm ILIKE $${paramIdx} OR a.email ILIKE $${paramIdx})`
    );
    values.push(term);
    paramIdx++;
  }

  if (filters.peran && filters.peran.trim() && filters.peran !== "Semua") {
    conditions.push(`a.peran = $${paramIdx}`);
    values.push(filters.peran.trim());
    paramIdx++;
  }

  if (filters.angkatan && !Number.isNaN(Number(filters.angkatan))) {
    conditions.push(`a.angkatan_unpar = $${paramIdx}`);
    values.push(Number(filters.angkatan));
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT
      a.id_anggota,
      a.nama,
      a.email,
      a.npm,
      a.peran,
      a.angkatan_unpar,
      a.jabatan,
      a.is_aktif,
      COALESCE(
        json_agg(
          json_build_object(
            'id_spesialisasi', s.id_spesialisasi,
            'nama_spesialisasi', s.nama_spesialisasi,
            'kategori', s.kategori
          )
        ) FILTER (WHERE s.id_spesialisasi IS NOT NULL),
        '[]'
      ) AS spesialisasi
    FROM anggota a
    LEFT JOIN anggota_spesialisasi ag ON a.id_anggota = ag.id_anggota
    LEFT JOIN spesialisasi s ON ag.id_spesialisasi = s.id_spesialisasi
    ${whereClause}
    GROUP BY a.id_anggota
    ORDER BY a.id_anggota DESC
  `;

  const result = await pool.query(query, values);
  return result.rows;
}

export async function getAnggotaById(id: number): Promise<Anggota | null> {
  const query = `
    SELECT
      a.id_anggota,
      a.nama,
      a.email,
      a.npm,
      a.peran,
      a.angkatan_unpar,
      a.jabatan,
      a.is_aktif,
      COALESCE(
        json_agg(
          json_build_object(
            'id_spesialisasi', s.id_spesialisasi,
            'nama_spesialisasi', s.nama_spesialisasi,
            'kategori', s.kategori
          )
        ) FILTER (WHERE s.id_spesialisasi IS NOT NULL),
        '[]'
      ) AS spesialisasi
    FROM anggota a
    LEFT JOIN anggota_spesialisasi ag ON a.id_anggota = ag.id_anggota
    LEFT JOIN spesialisasi s ON ag.id_spesialisasi = s.id_spesialisasi
    WHERE a.id_anggota = $1
    GROUP BY a.id_anggota
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0] ?? null;
}

export async function createAnggota(data: AnggotaInput): Promise<Anggota> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const insertAnggotaQuery = `
      INSERT INTO anggota (nama, email, npm, peran, angkatan_unpar, jabatan, is_aktif)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id_anggota
    `;
    const anggotaResult = await client.query(insertAnggotaQuery, [
      data.nama,
      data.email ?? null,
      data.npm ?? null,
      data.peran ?? "Kepengurusan",
      data.angkatan_unpar ?? null,
      data.jabatan ?? null,
      data.is_aktif ?? true,
    ]);

    const newId = anggotaResult.rows[0].id_anggota;

    if (data.spesialisasi_ids && data.spesialisasi_ids.length > 0) {
      for (const spId of data.spesialisasi_ids) {
        await client.query(
          `INSERT INTO anggota_spesialisasi (id_anggota, id_spesialisasi)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [newId, spId]
        );
      }
    }

    await client.query("COMMIT");

    const created = await getAnggotaById(newId);
    return created!;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateAnggota(id: number, data: AnggotaInput): Promise<Anggota | null> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const updateQuery = `
      UPDATE anggota
      SET nama = $1, email = $2, npm = $3, peran = $4,
          angkatan_unpar = $5, jabatan = $6, is_aktif = $7
      WHERE id_anggota = $8
      RETURNING id_anggota
    `;
    const result = await client.query(updateQuery, [
      data.nama,
      data.email ?? null,
      data.npm ?? null,
      data.peran ?? "Kepengurusan",
      data.angkatan_unpar ?? null,
      data.jabatan ?? null,
      data.is_aktif ?? true,
      id,
    ]);

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    if (data.spesialisasi_ids !== undefined) {
      await client.query(`DELETE FROM anggota_spesialisasi WHERE id_anggota = $1`, [id]);
      if (data.spesialisasi_ids.length > 0) {
        for (const spId of data.spesialisasi_ids) {
          await client.query(
            `INSERT INTO anggota_spesialisasi (id_anggota, id_spesialisasi)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [id, spId]
          );
        }
      }
    }

    await client.query("COMMIT");
    return await getAnggotaById(id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function toggleStatusAktif(id: number, is_aktif: boolean): Promise<Anggota | null> {
  const result = await pool.query(
    `UPDATE anggota SET is_aktif = $1 WHERE id_anggota = $2 RETURNING id_anggota`,
    [is_aktif, id]
  );
  if (result.rowCount === 0) {
    return null;
  }
  return await getAnggotaById(id);
}