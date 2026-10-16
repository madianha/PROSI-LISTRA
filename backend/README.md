# PROSI-LISTRA Backend API

Backend Express.js + PostgreSQL untuk fitur **Kontak WhatsApp**, **Berita**, dan **upload gambar**.

## Prasyarat

- Node.js 18+
- PostgreSQL berjalan secara lokal

## Setup

1. Install dependensi:

   ```bash
   npm install
   ```

2. Salin `.env.example` menjadi `.env`, lalu sesuaikan kredensial PostgreSQL:

   ```bash
   cp .env.example .env          # Linux / macOS
   Copy-Item .env.example .env   # PowerShell
   ```

3. Buat tabel kontak WhatsApp dengan menjalankan SQL berikut di pgAdmin
   (jika tabel belum ada / belum ada data awal):

   ```sql
   CREATE TABLE kontak_whatsapp (
       id INT PRIMARY KEY DEFAULT 1,
       nomor_wa VARCHAR(50) NOT NULL,
       nama_humas VARCHAR(255) NOT NULL,
       template_pesan TEXT NOT NULL
   );

   INSERT INTO kontak_whatsapp (id, nomor_wa, nama_humas, template_pesan)
   VALUES (
       1,
       '628123456789',
       'Bagas Nugroho (Koor Humas)',
       'Halo Humas LISTRA, saya tertarik dengan {jasa}. Boleh minta informasi lebih lanjut?'
   )
   ON CONFLICT (id) DO NOTHING;
   ```

   Lalu buat tabel berita (dan data awal) dengan menjalankan file
   `listra-web/db/berita.sql` di pgAdmin, atau:

   ```bash
   psql -U postgres -d prosi_listra -f ../listra-web/db/berita.sql
   ```

4. Jalankan server (development):

   ```bash
   npm run dev
   ```

   Server berjalan di `http://localhost:3001`. Frontend (`npm run dev` di
   `prosi-listra-frontend`) meneruskan `/api` dan `/uploads` ke port ini.

5. Jalankan test (tidak butuh database, repository di-mock):

   ```bash
   npm test
   ```

## Endpoint Kontak WhatsApp

| Method | Path          | Deskripsi                                    |
| ------ | ------------- | -------------------------------------------- |
| GET    | `/api/kontak` | Ambil data kontak WhatsApp (baris `id = 1`)  |
| PUT    | `/api/kontak` | Perbarui data kontak WhatsApp (baris `id = 1`) |

Body PUT:

```json
{
  "nomor_wa": "628123456789",
  "nama_humas": "Bagas Nugroho (Koor Humas)",
  "template_pesan": "Halo Humas LISTRA, saya tertarik dengan {jasa}."
}
```

## Endpoint Berita

| Method | Path                      | Deskripsi                                            |
| ------ | ------------------------- | ---------------------------------------------------- |
| GET    | `/api/berita`             | Daftar berita **publik**, tanggal terbaru dulu       |
| GET    | `/api/berita?semua=1`     | Daftar semua berita termasuk draf (Kelola Berita)    |
| GET    | `/api/berita/:id`         | Satu berita publik (draf dijawab 404)                |
| GET    | `/api/berita/:id?semua=1` | Satu berita, termasuk draf (halaman Ubah Berita)     |
| POST   | `/api/berita`             | Tambah berita (201), wajib kirim `is_publik`         |
| PUT    | `/api/berita/:id`         | Ubah isi berita (`is_publik` diabaikan)              |
| PATCH  | `/api/berita/:id/publik`  | Ubah status publik, body `{ "is_publik": true }`     |
| DELETE | `/api/berita/:id`         | Hapus berita (204)                                   |

`is_publik`: `true` = tampil di halaman Berita, `false` = draf. Belum ada login,
jadi `?semua=1` masih bisa dibuka siapa pun yang tahu alamatnya; nanti beri
pengecekan login di `opsiBaca()` pada `src/controllers/beritaController.ts`.

Ada dua jenis berita, dibedakan dari `url_artikel` (tidak ada kolom jenis):

```json
// POST artikel (ditulis di TinyMCE): url_artikel dan sumber null
{
  "judul": "Persiapan Gelar Karya LISTRA",
  "tanggal": "2026-10-10",
  "url_gambar": "/uploads/a81f3c.jpg",
  "konten": "<p>Isi artikel...</p>",
  "sumber": null,
  "url_artikel": null,
  "is_publik": false
}

// POST tautan (berita di media lain): konten null
{
  "judul": "LISTRA UNPAR Juara 1 Lomba Tari Kreasi",
  "tanggal": "2023-12-01",
  "url_gambar": "/uploads/b92e1d.jpg",
  "konten": null,
  "sumber": "unpar.ac.id",
  "url_artikel": "https://unpar.ac.id/...",
  "is_publik": true
}
```

Body PUT sama tetapi tanpa `is_publik`.

Database yang sudah dibuat sebelum kolom `is_publik` ada bisa diperbarui dengan:

```sql
ALTER TABLE berita ADD COLUMN is_publik BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE berita SET is_publik = TRUE; -- berita lama tetap tampil seperti sebelumnya
```

`konten` dibersihkan dengan `sanitize-html` sebelum disimpan (script dan atribut
berbahaya dibuang), karena ditampilkan sebagai HTML di halaman publik.

## Upload Gambar

| Method | Path          | Deskripsi                                         |
| ------ | ------------- | ------------------------------------------------- |
| POST   | `/api/upload` | Kirim file di field `file`, balasan `{ location }` |

- Hanya JPG, PNG, WEBP, GIF, maksimal 5 MB.
- File disimpan di folder `backend/uploads/` (tidak ikut git) dan disajikan di
  `/uploads/<nama>`. Alamat itulah yang disimpan di database (`url_gambar`, dan
  `<img src>` di dalam `konten`), bukan file atau base64-nya.
- Lokasi folder bisa diganti lewat env `UPLOAD_DIR`.
- **Saat deploy:** bila hosting menghapus disk setiap redeploy (Render, Railway,
  Vercel), gambar akan hilang. Ganti isi `saveImage()` di
  `src/storage/uploadStorage.ts` agar mengunggah ke Cloudinary/S3. Bagian lain
  tidak perlu diubah.
