import { pool } from "../db";

export interface KontakWhatsapp {
  id_kontak?: number;
  id?: number;
  nomor_tujuan?: string;
  nomor_wa?: string;
  no_telepon?: string;
  nomor_whatsapp?: string;
  nama_humas?: string;
  nama?: string;
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
       COALESCE(nama_humas, 'Humas LISTRA') AS nama_humas,
       COALESCE(nama_humas, 'Humas LISTRA') AS nama,
       template_pesan
     FROM kontak_whatsapp
     ORDER BY id_kontak ASC
     LIMIT 1;`
  );
  return result.rows[0] ?? null;
}

export async function updateKontak(
  nomor?: string | null,
  nama?: string | null,
  template?: string | null,
  idKontak?: number,
): Promise<KontakWhatsapp | null> {
  const result = await pool.query<KontakWhatsapp>(
    `UPDATE kontak_whatsapp
     SET 
       nomor_tujuan = COALESCE($1, nomor_tujuan),
       template_pesan = COALESCE($2, template_pesan),
       nama_humas = COALESCE($3, nama_humas)
     WHERE id_kontak = COALESCE($4, (SELECT id_kontak FROM kontak_whatsapp ORDER BY id_kontak ASC LIMIT 1))
     RETURNING 
       id_kontak,
       id_kontak AS id,
       nomor_tujuan,
       nomor_tujuan AS nomor_wa,
       nomor_tujuan AS no_telepon,
       nomor_tujuan AS nomor_whatsapp,
       COALESCE(nama_humas, 'Humas LISTRA') AS nama_humas,
       COALESCE(nama_humas, 'Humas LISTRA') AS nama,
       template_pesan;`,
    [nomor ?? null, template ?? null, nama ?? null, idKontak ?? null],
  );
  return result.rows[0] ?? null;
}
