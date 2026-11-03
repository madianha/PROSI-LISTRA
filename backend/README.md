# PROSI-LISTRA Backend API

Backend Express.js + PostgreSQL untuk fitur **Kontak WhatsApp**, **Manajemen Anggota**, **Berita**, dan **Upload Gambar**.

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

3. Setup Database di PostgreSQL / pgAdmin:
   - **Tabel Kontak WhatsApp**:
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

   - **Tabel Berita & Master Data**:
     Jalankan skrip SQL di `listra-web/db/berita.sql` dan `listra-web/db/master.sql`.

4. Jalankan server (development):

   ```bash
   npm run dev
   ```

   Server berjalan di `http://localhost:3001` (port dapat diubah lewat `PORT` di `.env`). Frontend (`npm run dev` di `prosi-listra-frontend`) meneruskan `/api` dan `/uploads` ke port ini.

5. Jalankan test:

   ```bash
   npm test
   ```

## Endpoint Kontak WhatsApp

| Method | Path          | Deskripsi                                      |
| ------ | ------------- | ---------------------------------------------- |
| GET    | `/api/kontak` | Ambil data kontak WhatsApp (baris `id = 1`)    |
| PUT    | `/api/kontak` | Perbarui data kontak WhatsApp (baris `id = 1`) |

### Body PUT Kontak WhatsApp

```json
{
  "nomor_wa": "628123456789",
  "nama_humas": "Bagas Nugroho (Koor Humas)",
  "template_pesan": "Halo Humas LISTRA, saya tertarik dengan {jasa}."
}
```

## Endpoint Anggota

| Method | Path                     | Deskripsi                                             |
| ------ | ------------------------ | ----------------------------------------------------- |
| GET    | `/api/anggota`           | Daftar anggota dengan filter query search, peran, dll |
| GET    | `/api/anggota/spesialisasi` | Master data seluruh spesialisasi (Tari & Musik)     |
| GET    | `/api/anggota/:id`       | Detail satu anggota                                   |
| POST   | `/api/anggota`           | Tambah anggota baru                                   |
| PUT    | `/api/anggota/:id`       | Ubah data profil dan spesialisasi anggota             |
| PATCH  | `/api/anggota/:id/status`| Ubah status keaktifan anggota (`is_aktif`)            |

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

## Upload Gambar

| Method | Path          | Deskripsi                                         |
| ------ | ------------- | ------------------------------------------------- |
| POST   | `/api/upload` | Kirim file di field `file`, balasan `{ location }` |

- Hanya JPG, PNG, WEBP, GIF, maksimal 5 MB.
- File disimpan di folder `backend/uploads/` (tidak ikut git) dan disajikan di `/uploads/<nama>`.

