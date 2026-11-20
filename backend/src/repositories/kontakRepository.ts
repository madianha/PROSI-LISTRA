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
       nomor_wa AS nomor_tujuan,
       nomor_wa,
       nomor_wa AS no_telepon,
       nomor_wa AS nomor_whatsapp,
       COALESCE(nama_humas, 'Humas LISTRA') AS nama_humas,
       COALESCE(nama_humas, 'Humas LISTRA') AS nama,
       template_pesan
     FROM kontak_whatsapp
     ORDER BY id_kontak ASC
     LIMIT 1;`
  );
  return result.rows[0] ?? null;
}

/**
 * Simpan satu-satunya baris kontak (id_kontak selalu 1, lihat chk_kontak_satu_baris).
 * Belum ada = dibuat, sudah ada = diperbarui. Jadi tabel kosong pun bisa diisi dari panel internal.
 */
export async function simpanKontak(nomor: string, nama: string, template: string): Promise<KontakWhatsapp> {
  const result = await pool.query<KontakWhatsapp>(
    `INSERT INTO kontak_whatsapp (id_kontak, nomor_wa, nama_humas, template_pesan)
     VALUES (1, $1, $2, $3)
     ON CONFLICT (id_kontak) DO UPDATE
       SET nomor_wa = EXCLUDED.nomor_wa,
           nama_humas = EXCLUDED.nama_humas,
           template_pesan = EXCLUDED.template_pesan
     RETURNING
       id_kontak,
       id_kontak AS id,
       nomor_wa AS nomor_tujuan,
       nomor_wa,
       nomor_wa AS no_telepon,
       nomor_wa AS nomor_whatsapp,
       nama_humas,
       nama_humas AS nama,
       template_pesan;`,
    [nomor, nama, template],
  );
  return result.rows[0];
}
