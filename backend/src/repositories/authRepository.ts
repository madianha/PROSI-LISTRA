import { pool } from "../db";

export interface AuthUserRow {
  id_anggota: number;
  nama: string;
  email: string | null;
  npm: string | null;
  peran: string;
  jabatan: string | null;
  is_aktif: boolean;
  password_hash: string | null;
}

export interface AuthUserData {
  id_anggota: number;
  nama: string;
  email: string | null;
  peran: string;
  jabatan: string | null;
}

/**
 * Cari anggota berdasarkan email (case-insensitive) untuk keperluan autentikasi
 */
export async function findAnggotaByEmail(email: string): Promise<AuthUserRow | null> {
  const query = `
    SELECT id_anggota, nama, email, npm, peran, jabatan, is_aktif, password_hash
    FROM anggota
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1;
  `;
  const result = await pool.query<AuthUserRow>(query, [email.trim()]);
  return result.rows[0] || null;
}

/**
 * Cari anggota berdasarkan ID untuk keperluan session / me endpoint
 */
export async function findAnggotaById(id: number): Promise<AuthUserData | null> {
  const query = `
    SELECT id_anggota, nama, email, peran, jabatan
    FROM anggota
    WHERE id_anggota = $1 AND is_aktif = true
    LIMIT 1;
  `;
  const result = await pool.query<AuthUserData>(query, [id]);
  return result.rows[0] || null;
}