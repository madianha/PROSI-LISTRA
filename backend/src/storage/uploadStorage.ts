import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/*
 * SATU-SATUNYA tempat yang tahu di mana gambar disimpan.
 * Sekarang: folder backend/uploads (disajikan di /uploads).
 * Jika nanti deploy ke hosting yang disk-nya terhapus saat redeploy
 * (Render/Railway/Vercel), cukup ganti isi saveImage() agar mengunggah
 * ke Cloudinary/S3 dan mengembalikan URL dari sana.
 */

export const UPLOAD_DIR = path.resolve(
  process.env.UPLOAD_DIR ?? path.join(__dirname, "..", "..", "uploads"),
);

export const EKSTENSI_GAMBAR: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Simpan file gambar, kembalikan alamat yang disimpan di database. */
export async function saveImage(buffer: Buffer, mimetype: string): Promise<string> {
  const ekstensi = EKSTENSI_GAMBAR[mimetype];
  if (!ekstensi) throw new Error(`Tipe gambar tidak didukung: ${mimetype}`);

  const namaFile = `${randomUUID()}.${ekstensi}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, namaFile), buffer);
  return `/uploads/${namaFile}`;
}
