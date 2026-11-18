import { pool } from "../db";

// Tabel alat_musik (listra-web/db/master.sql): id_alat_musik, nama_alat_musik VARCHAR(50) UNIQUE, jumlah INT >= 1

export interface AlatMusik {
  id_alat_musik: number;
  nama_alat_musik: string;
  jumlah: number;
}

const KOLOM = "id_alat_musik, nama_alat_musik, jumlah";

export async function listAlatMusik(): Promise<AlatMusik[]> {
  const result = await pool.query<AlatMusik>(`SELECT ${KOLOM} FROM alat_musik ORDER BY id_alat_musik ASC`);
  return result.rows;
}

export async function createAlatMusik(data: { nama_alat_musik: string; jumlah: number }): Promise<AlatMusik> {
  const result = await pool.query<AlatMusik>(
    `INSERT INTO alat_musik (nama_alat_musik, jumlah) VALUES ($1, $2) RETURNING ${KOLOM}`,
    [data.nama_alat_musik, data.jumlah]
  );
  return result.rows[0];
}

/** Ubah sebagian kolom (nama dan/atau jumlah). null bila id tidak ada. */
export async function updateAlatMusik(
  id: number,
  data: { nama_alat_musik?: string; jumlah?: number }
): Promise<AlatMusik | null> {
  const set: string[] = [];
  const values: unknown[] = [];
  if (data.nama_alat_musik !== undefined) {
    values.push(data.nama_alat_musik);
    set.push(`nama_alat_musik = $${values.length}`);
  }
  if (data.jumlah !== undefined) {
    values.push(data.jumlah);
    set.push(`jumlah = $${values.length}`);
  }
  values.push(id);
  const result = await pool.query<AlatMusik>(
    `UPDATE alat_musik SET ${set.join(", ")} WHERE id_alat_musik = $${values.length} RETURNING ${KOLOM}`,
    values
  );
  return result.rows[0] ?? null;
}

export async function deleteAlatMusik(id: number): Promise<boolean> {
  const result = await pool.query("DELETE FROM alat_musik WHERE id_alat_musik = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
