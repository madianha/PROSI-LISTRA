# PROSI-LISTRA Backend API

Backend Express.js + PostgreSQL untuk fitur Kontak WhatsApp.

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
   Copy-Item .env.example .env   # PowerShell
   ```

3. Jalankan SQL berikut di pgAdmin (jika tabel belum ada / belum ada data awal):

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

4. Jalankan server (development):

   ```bash
   npm run dev
   ```

   Server berjalan di `http://localhost:3001` (port dapat diubah lewat `PORT` di `.env`).

## Endpoint

| Method | Path          | Deskripsi                                    |
| ------ | ------------- | -------------------------------------------- |
| GET    | `/api/kontak` | Ambil data kontak WhatsApp (baris `id = 1`)  |
| PUT    | `/api/kontak` | Perbarui data kontak WhatsApp (baris `id = 1`) |

### Body PUT

```json
{
  "nomor_wa": "628123456789",
  "nama_humas": "Bagas Nugroho (Koor Humas)",
  "template_pesan": "Halo Humas LISTRA, saya tertarik dengan {jasa}."
}
```
