# Nuke database `listra_db`

`nuke-db.sh` menghapus database `listra_db` lalu membuatnya lagi dari nol memakai
file SQL di `listra-web/db/`. Hasilnya sama persis dengan database yang baru di-setup.

> **Semua isi `listra_db` hilang**: data yang kamu tambah lewat aplikasi, akun yang
> kamu buat, kata sandi yang kamu ganti. Hanya untuk database development di laptop
> sendiri. Jangan jalankan di database produksi.

## Kapan dipakai

- Ada yang mengubah `master.sql` (tabel atau kolom baru). Contoh: `fix/acara` menambah
  kolom `status`, `alasan_batal`, dan `cancelled_at` di tabel `acara`; database lama
  belum punya kolom itu, jadi halaman acara error sampai database di-nuke.
- Data di database sudah berantakan setelah testing dan ingin mulai bersih.

## Cara pakai

Dari folder root repo (`PROSI-LISTRA/`):

```bash
./nuke-db.sh              # tanya konfirmasi, lalu nuke + isi data contoh
./nuke-db.sh --no-dummy   # tanpa data contoh, hanya data dasar
./nuke-db.sh -y           # tanpa konfirmasi (hati-hati)
./nuke-db.sh --help
```

Sebelum menghapus, script minta kamu mengetik `listra_db`. Jawaban lain = batal,
database tidak disentuh.

Opsi bisa digabung: `./nuke-db.sh -y --no-dummy`.

## Yang dilakukan script

1. Ambil koneksi PostgreSQL dari `backend/.env` (`PGHOST`, `PGPORT`, `PGUSER`,
   `PGPASSWORD`). Kalau tidak ada: `postgres@localhost:5432`.
2. `dropdb --if-exists --force listra_db`. `--force` memutus koneksi yang masih
   terbuka, jadi backend yang sedang jalan tidak perlu dimatikan dulu.
3. `createdb listra_db`.
4. Jalankan berurutan:

   | File           | Isi                                                        |
   | -------------- | ---------------------------------------------------------- |
   | `master.sql`   | semua tabel                                                |
   | `junction.sql` | tabel penghubung                                           |
   | `insert.sql`   | data dasar: kecocokan, provinsi, kontak WA, akun awal      |
   | `dummy.sql`    | data contoh: jasa, testimoni, berita, alat musik, acara (dilewati dengan `--no-dummy`) |

   Berhenti di error SQL pertama, tidak lanjut dengan database setengah jadi.

## Akun setelah nuke

Dari `insert.sql`, satu akun per peran, semua dengan kata sandi `password123`:

| Email                    | Peran   |
| ------------------------ | ------- |
| `admin@unpar.ac.id`      | admin   |
| `ukm_listra@unpar.ac.id` | listra  |
| `humas@unpar.ac.id`      | humas   |
| `pelatih@unpar.ac.id`    | pelatih |
| `anggota@unpar.ac.id`    | anggota |
| `alumni@unpar.ac.id`     | alumni  |

## Windows (PowerShell)

Script ini bash. Di Windows jalankan lewat Git Bash (`./nuke-db.sh`), atau ketik
manual di PowerShell dari folder root repo:

```powershell
dropdb -U postgres --if-exists --force listra_db
createdb -U postgres listra_db
cd listra-web/db
psql -U postgres -d listra_db -v ON_ERROR_STOP=1 -f master.sql
psql -U postgres -d listra_db -v ON_ERROR_STOP=1 -f junction.sql
psql -U postgres -d listra_db -v ON_ERROR_STOP=1 -f insert.sql
psql -U postgres -d listra_db -v ON_ERROR_STOP=1 -f dummy.sql   # opsional
cd ../..
```

## Kalau gagal

| Pesan                                         | Penyebab dan solusi |
| --------------------------------------------- | ------------------- |
| `Perintah 'psql' tidak ditemukan`             | PostgreSQL client belum terinstall atau belum ada di `PATH`. |
| `password authentication failed`              | `PGUSER` / `PGPASSWORD` di `backend/.env` tidak cocok dengan PostgreSQL kamu. |
| `connection refused`                          | PostgreSQL belum jalan. Linux: `sudo systemctl start postgresql`. |
| `option '--force' not recognized`             | PostgreSQL di bawah versi 13. Matikan backend dulu, lalu jalankan lagi tanpa `--force` (ubah baris `dropdb` di script). |
| `permission denied to create database`        | User di `PGUSER` tidak punya hak `CREATEDB`. Pakai user `postgres`. |
| Error di salah satu file `.sql`               | Ada kesalahan di file SQL itu (biasanya setelah merge). Database sudah terhapus dan terisi sebagian; perbaiki file SQL-nya lalu jalankan script lagi. |
