import { pool } from "../db";

export interface KontakWhatsapp {
  id_kontak?: number;
  id?: number;
  nomor_tujuan?: string;
  nomor_wa?: string;
  no_telepon?: string;
  nomor_whatsapp?: string;
  nama_humas?: string;
  template_pesan: string;
}

export async function getKontak(): Promise<KontakWhatsapp | null> {
  const result = await pool.query<KontakWhatsapp>(
    `SELECT 
       id_kontak,
       id_kontak AS id,
       nomor_tujuan,
       nomor_tujuan AS nomor_wa,
       nomor_tujuan AS no_telepon,
       nomor_tujuan AS nomor_whatsapp,
       template_pesan
     FROM kontak_whatsapp
     ORDER BY id_kontak ASC
     LIMIT 1`
  );
  return result.rows[0] ?? null;
}

export async function updateKontak(
  nomor: string,
  nama: string,
  template: string,
): Promise<KontakWhatsapp | null> {
  const result = await pool.query<KontakWhatsapp>(
    `UPDATE kontak_whatsapp 
     SET nomor_tujuan = $1, template_pesan = $2 
     WHERE id_kontak = (SELECT id_kontak FROM kontak_whatsapp ORDER BY id_kontak ASC LIMIT 1)
     RETURNING 
       id_kontak,
       id_kontak AS id,
       nomor_tujuan,
       nomor_tujuan AS nomor_wa,
       nomor_tujuan AS no_telepon,
       nomor_tujuan AS nomor_whatsapp,
       template_pesan`,
    [nomor, template],
  );
  return result.rows[0] ?? null;
}
