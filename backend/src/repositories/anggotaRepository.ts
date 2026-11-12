import { pool } from "../db";

export interface Spesialisasi {
  id_spesialisasi: number;
  nama_spesialisasi: string;
  kategori: string;
  id_jasa?: number;
  nama_jasa?: string;
  tipe_jasa?: string;
}

export interface Anggota {
  id_anggota: number;
  nama: string;
  email: string | null;
  npm: string | null;
  peran: string;
  angkatan_unpar: number | null;
  jabatan: string | null;
  is_penari: boolean;
  is_pemusik: boolean;
  is_aktif: boolean;
  spesialisasi: Array<{
    id_spesialisasi: number;
    nama_spesialisasi: string;
    kategori: string;
  }>;
}

export interface AnggotaInput {
  nama: string;
  email?: string | null;
  npm?: string | null;
  peran?: string;
  angkatan_unpar?: number | null;
  jabatan?: string | null;
  is_penari?: boolean;
  is_pemusik?: boolean;
  is_aktif?: boolean;
  password_hash?: string;
  spesialisasi_ids?: number[];
}

export interface FilterAnggota {
  search?: string;
  peran?: string;
  angkatan?: number;
}

const DB_TO_PERAN_LABEL: Record<string, string> = {
  admin: "Admin",
  listra: "Kepengurusan",
  humas: "Humas",
  pelatih: "Pelatih",
  anggota: "Anggota",
  alumni: "Alumni",
};

function mapAnggotaRow(row: Anggota): Anggota {
  return {
    ...row,
    peran: DB_TO_PERAN_LABEL[row.peran] ?? row.peran,
  };
}

const DEFAULT_PASSWORD_HASH = "$2a$10$wT2v2sB4C6s0eY9IeB.yReM8x6yWv7jZ4M7g8Y5L5u9V1K1q3q7re";

export async function getSpesialisasiList(): Promise<Spesialisasi[]> {
  const result = await pool.query<Spesialisasi>(
    `SELECT 
       id_jasa AS id_spesialisasi,
       nama AS nama_spesialisasi,
       tipe_jasa AS kategori,
       id_jasa,
       nama AS nama_jasa,
       tipe_jasa
     FROM jasa
     WHERE is_aktif = TRUE
     ORDER BY tipe_jasa ASC, nama ASC;`
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

  const angkatanStr = filters.angkatan !== undefined && filters.angkatan !== null ? String(filters.angkatan).trim() : "";
  if (angkatanStr && angkatanStr !== "Semua") {
    conditions.push(`CAST(a.angkatan_unpar AS TEXT) ILIKE $${paramIdx}`);
    values.push(`%${angkatanStr}%`);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT 
      a.id_anggota, 
      a.email, 
      a.nama, 
      a.npm, 
      a.angkatan_unpar, 
      a.jabatan, 
      a.peran, 
      a.is_penari, 
      a.is_pemusik, 
      a.is_aktif,
      COALESCE(
        json_agg(
          json_build_object(
            'id_jasa', j.id_jasa,
            'id_spesialisasi', j.id_jasa,
            'nama_spesialisasi', j.nama,
            'nama_jasa', j.nama,
            'kategori', j.tipe_jasa,
            'tipe_jasa', j.tipe_jasa
          ) ORDER BY j.tipe_jasa ASC, j.nama ASC
        ) FILTER (WHERE j.id_jasa IS NOT NULL),
        '[]'
      ) AS spesialisasi
    FROM anggota a
    LEFT JOIN spesialisasi s ON a.id_anggota = s.id_anggota
    LEFT JOIN jasa j ON s.id_jasa = j.id_jasa
    ${whereClause}
    GROUP BY a.id_anggota
    ORDER BY a.id_anggota ASC
  `;

  const result = await pool.query(query, values);
  return result.rows.map(mapAnggotaRow);
}

export async function getAnggotaById(id: number): Promise<Anggota | null> {
  const query = `
    SELECT 
      a.id_anggota, 
      a.email, 
      a.nama, 
      a.npm, 
      a.angkatan_unpar, 
      a.jabatan, 
      a.peran, 
      a.is_penari, 
      a.is_pemusik, 
      a.is_aktif,
      COALESCE(
        json_agg(
          json_build_object(
            'id_jasa', j.id_jasa,
            'id_spesialisasi', j.id_jasa,
            'nama_spesialisasi', j.nama,
            'nama_jasa', j.nama,
            'kategori', j.tipe_jasa,
            'tipe_jasa', j.tipe_jasa
          ) ORDER BY j.tipe_jasa ASC, j.nama ASC
        ) FILTER (WHERE j.id_jasa IS NOT NULL),
        '[]'
      ) AS spesialisasi
    FROM anggota a
    LEFT JOIN spesialisasi s ON a.id_anggota = s.id_anggota
    LEFT JOIN jasa j ON s.id_jasa = j.id_jasa
    WHERE a.id_anggota = $1
    GROUP BY a.id_anggota
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0] ? mapAnggotaRow(result.rows[0]) : null;
}

export async function createAnggota(data: AnggotaInput): Promise<Anggota> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let isPenari = Boolean(data.is_penari);
    let isPemusik = Boolean(data.is_pemusik);

    const spIds = data.spesialisasi_ids ?? [];
    if (spIds.length > 0) {
      const jasaCheck = await client.query<{ tipe_jasa: string }>(
        `SELECT DISTINCT tipe_jasa FROM jasa WHERE id_jasa = ANY($1::int[])`,
        [spIds]
      );
      for (const row of jasaCheck.rows) {
        const tipe = String(row.tipe_jasa || "").toLowerCase();
        if (tipe === "tari" || tipe.includes("tari")) isPenari = true;
        if (tipe === "musik" || tipe.includes("musik")) isPemusik = true;
      }
    }

    const passwordHash = data.password_hash || DEFAULT_PASSWORD_HASH;

    const insertAnggotaQuery = `
      INSERT INTO anggota (
        email, password_hash, nama, npm, angkatan_unpar, jabatan, peran, is_penari, is_pemusik, is_aktif
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id_anggota
    `;
    const anggotaResult = await client.query(insertAnggotaQuery, [
      data.email ?? "",
      passwordHash,
      data.nama,
      data.npm ?? null,
      data.angkatan_unpar ?? null,
      data.jabatan ?? null,
      data.peran ?? "listra",
      isPenari,
      isPemusik,
      data.is_aktif ?? true,
    ]);

    const newId = anggotaResult.rows[0].id_anggota;

    if (spIds.length > 0) {
      for (const spId of spIds) {
        await client.query(
          `INSERT INTO spesialisasi (id_anggota, id_jasa)
           VALUES ($1, $2)
           ON CONFLICT (id_anggota, id_jasa) DO NOTHING`,
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

    let isPenari = Boolean(data.is_penari);
    let isPemusik = Boolean(data.is_pemusik);

    const spIds = data.spesialisasi_ids;
    if (spIds && spIds.length > 0) {
      const jasaCheck = await client.query<{ tipe_jasa: string }>(
        `SELECT DISTINCT tipe_jasa FROM jasa WHERE id_jasa = ANY($1::int[])`,
        [spIds]
      );
      for (const row of jasaCheck.rows) {
        const tipe = String(row.tipe_jasa || "").toLowerCase();
        if (tipe === "tari" || tipe.includes("tari")) isPenari = true;
        if (tipe === "musik" || tipe.includes("musik")) isPemusik = true;
      }
    }

    const updateQuery = `
      UPDATE anggota
      SET nama = $1, email = $2, npm = $3, peran = $4,
          angkatan_unpar = $5, jabatan = $6, is_penari = $7, is_pemusik = $8, is_aktif = $9
      WHERE id_anggota = $10
      RETURNING id_anggota
    `;
    const result = await client.query(updateQuery, [
      data.nama,
      data.email ?? null,
      data.npm ?? null,
      data.peran ?? "listra",
      data.angkatan_unpar ?? null,
      data.jabatan ?? null,
      isPenari,
      isPemusik,
      data.is_aktif ?? true,
      id,
    ]);

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    if (spIds !== undefined) {
      await client.query(`DELETE FROM spesialisasi WHERE id_anggota = $1`, [id]);
      if (spIds.length > 0) {
        for (const spId of spIds) {
          await client.query(
            `INSERT INTO spesialisasi (id_anggota, id_jasa)
             VALUES ($1, $2)
             ON CONFLICT (id_anggota, id_jasa) DO NOTHING`,
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
