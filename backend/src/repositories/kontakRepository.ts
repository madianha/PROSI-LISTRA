import { pool } from "../db";

export interface KontakWhatsapp {
  id: number;
  nomor_wa: string;
  nama_humas: string;
  template_pesan: string;
}

export async function getKontak(): Promise<KontakWhatsapp | null> {
  const result = await pool.query<KontakWhatsapp>(
    "SELECT * FROM kontak_whatsapp WHERE id = 1",
  );
  return result.rows[0] ?? null;
}

export async function updateKontak(
  nomor: string,
  nama: string,
  template: string,
): Promise<KontakWhatsapp | null> {
  const result = await pool.query<KontakWhatsapp>(
    "UPDATE kontak_whatsapp SET nomor_wa = $1, nama_humas = $2, template_pesan = $3 WHERE id = 1 RETURNING *",
    [nomor, nama, template],
  );
  return result.rows[0] ?? null;
}
