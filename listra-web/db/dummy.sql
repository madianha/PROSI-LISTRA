-- =========================================
-- dummy.sql: DATA CONTOH untuk development / demo. Jangan dijalankan di database produksi.
-- Urutan: master.sql -> junction.sql -> insert.sql -> dummy.sql
-- (butuh provinsi, kecocokan, dan akun anggota dari insert.sql)
--
-- Isi dan hubungannya:
--   jasa (+ jasa_kecocokan)          10 jasa: 7 tari (1 nonaktif), 3 musik
--   anggota                           12 anggota contoh (Ketua, Wakil Ketua, Koor Humas, Pelatih, Anggota, Alumni, 1 nonaktif)
--   spesialisasi                      setiap anggota contoh -> jasa yang dikuasai
--   acara (+ acara_pj, acara_jasa,    9 event Sep 2026 - Jan 2027; setiap anggota aktif menjadi PJ dan/atau performer,
--          acara_performer)           akun per peran dari insert.sql juga ikut (kecuali admin)
--   testimoni                         terhubung ke event lewat nama_acara; status Ditunggu / Diterima / Ditolak
--   berita, alat_musik                contoh untuk halaman Berita dan Alat Musik
--
-- Aman dijalankan berulang kali: data yang sudah ada (nama jasa, email anggota, nama event,
-- judul berita, testimoni yang sama) dilewati.
-- Semua kata sandi anggota contoh: password123
-- =========================================


-- =========================================
-- JASA
-- Musik tidak punya asal provinsi (NULL); posisi pentas boleh lebih dari satu.
-- =========================================

WITH dummy (
  tipe_jasa, nama, deskripsi, nama_provinsi, durasi,
  harga_minimum, harga_maximum, min_performer, link_media, link_image, is_aktif,
  kecocokan
) AS (
  VALUES
    ('tari', 'Tari Merak',
     'Tarian Sunda yang menggambarkan keindahan burung merak saat memikat pasangannya.',
     'Jawa Barat', 10, 2500000, 5000000, 4, NULL,
     'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?auto=format&fit=crop&w=900&q=85', TRUE, ARRAY['Opening']),
    ('tari', 'Tari Jaipong',
     'Tarian pergaulan khas Jawa Barat dengan gerakan dinamis dan energik.',
     'Jawa Barat', 15, 3000000, 6000000, 4, NULL,
     'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=900&q=85', TRUE, ARRAY['Middle', 'Closing']),
    ('tari', 'Tari Saman',
     'Tarian Aceh dengan formasi duduk berbaris dan tepukan tangan yang serempak.',
     'Aceh', 12, 4000000, 7500000, 8, NULL, NULL, TRUE, ARRAY['Opening', 'Closing']),
    ('tari', 'Tari Topeng Cirebon',
     'Tarian topeng khas Cirebon yang menampilkan perubahan karakter lewat pergantian topeng.',
     'Jawa Barat', 12, 3000000, 6000000, 3, NULL, NULL, TRUE, ARRAY['Middle']),
    ('tari', 'Tari Pendet',
     'Tarian penyambutan dari Bali dengan taburan bunga sebagai ucapan selamat datang.',
     'Bali', 8, 2500000, 5000000, 4, NULL, NULL, TRUE, ARRAY['Opening']),
    ('tari', 'Tari Piring',
     'Tarian Minangkabau yang memainkan piring di telapak tangan dengan gerakan cepat dan lincah.',
     'Sumatera Barat', 10, 3000000, 6000000, 5, NULL, NULL, TRUE, ARRAY['Middle', 'Closing']),
    ('tari', 'Tari Lenggang Nyai',
     'Tarian Betawi yang menggambarkan keceriaan perempuan muda. Sedang tidak ditawarkan.',
     'DKI Jakarta', 8, 2000000, 4000000, 4, NULL, NULL, FALSE, ARRAY['Closing']),
    ('musik', 'Gamelan Sunda',
     'Iringan musik tradisional Sunda untuk menyambut tamu atau mengisi suasana acara.',
     NULL, 60, 3500000, 7000000, 5, NULL,
     'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=85', TRUE, ARRAY['Opening']),
    ('musik', 'Angklung Kreasi',
     'Permainan angklung dengan aransemen lagu daerah dan lagu populer.',
     NULL, 20, 2500000, 5000000, 6, NULL, NULL, TRUE, ARRAY['Opening', 'Closing']),
    ('musik', 'Kecapi Suling',
     'Alunan kecapi dan suling Sunda untuk suasana santai, cocok mengiringi jamuan.',
     NULL, 45, 1500000, 3500000, 2, NULL, NULL, TRUE, ARRAY['Middle'])
), upserted AS (
  INSERT INTO jasa (
    tipe_jasa, nama, deskripsi, id_provinsi, durasi,
    harga_minimum, harga_maximum, min_performer, link_media, link_image, is_aktif
  )
  SELECT d.tipe_jasa, d.nama, d.deskripsi, p.id_provinsi, d.durasi,
         d.harga_minimum, d.harga_maximum, d.min_performer,
         d.link_media, d.link_image, d.is_aktif
  FROM dummy d
  LEFT JOIN provinsi p ON p.nama_provinsi = d.nama_provinsi  -- LEFT: jasa musik tanpa provinsi tetap masuk
  ON CONFLICT (nama) DO UPDATE SET
    tipe_jasa = EXCLUDED.tipe_jasa,
    deskripsi = EXCLUDED.deskripsi,
    id_provinsi = EXCLUDED.id_provinsi,
    durasi = EXCLUDED.durasi,
    harga_minimum = EXCLUDED.harga_minimum,
    harga_maximum = EXCLUDED.harga_maximum,
    min_performer = EXCLUDED.min_performer,
    link_media = EXCLUDED.link_media,
    link_image = EXCLUDED.link_image,
    is_aktif = EXCLUDED.is_aktif
  RETURNING id_jasa, nama
)
INSERT INTO jasa_kecocokan (id_jasa, id_kecocokan)
SELECT u.id_jasa, k.id_kecocokan
FROM upserted u
JOIN dummy d ON d.nama = u.nama
JOIN kecocokan k ON k.nama_kecocokan = ANY (d.kecocokan)
ON CONFLICT (id_jasa, id_kecocokan) DO NOTHING;


-- =========================================
-- ANGGOTA CONTOH
-- Email mahasiswa mengikuti format UNPAR: NPM@student.unpar.ac.id (NPM 618 + angkatan 2 digit + nomor).
-- Kata sandi: password123. Rizky Hidayat nonaktif (tidak bisa login, hanya ada di event lama).
-- =========================================

INSERT INTO anggota (email, password_hash, nama, npm, angkatan_unpar, jabatan, peran, is_penari, is_pemusik, is_aktif)
VALUES
    ('6182101001@student.unpar.ac.id', '$2b$10$y829.cM0UcUwmMsVkCACc.nsYugjI.w0h76aQKbq3nJnfQDBCgAra', 'Arya Mahendra',   '6182101001', 2021, 'Ketua',       'anggota', TRUE,  FALSE, TRUE),
    ('6182101002@student.unpar.ac.id', '$2b$10$y829.cM0UcUwmMsVkCACc.nsYugjI.w0h76aQKbq3nJnfQDBCgAra', 'Salsa Amelia',    '6182101002', 2021, 'Wakil Ketua', 'anggota', TRUE,  FALSE, TRUE),
    ('6182201003@student.unpar.ac.id', '$2b$10$y829.cM0UcUwmMsVkCACc.nsYugjI.w0h76aQKbq3nJnfQDBCgAra', 'Bagas Nugroho',   '6182201003', 2022, 'Koor Humas',  'humas',   FALSE, TRUE,  TRUE),
    ('sri.handayani@unpar.ac.id',      '$2b$10$y829.cM0UcUwmMsVkCACc.nsYugjI.w0h76aQKbq3nJnfQDBCgAra', 'Sri Handayani',   NULL,         NULL, 'Pelatih',     'pelatih', TRUE,  FALSE, TRUE),
    ('6182201005@student.unpar.ac.id', '$2b$10$y829.cM0UcUwmMsVkCACc.nsYugjI.w0h76aQKbq3nJnfQDBCgAra', 'Dewi Anggraini',  '6182201005', 2022, 'Anggota',     'anggota', TRUE,  FALSE, TRUE),
    ('6182301006@student.unpar.ac.id', '$2b$10$y829.cM0UcUwmMsVkCACc.nsYugjI.w0h76aQKbq3nJnfQDBCgAra', 'Yoga Pratama',    '6182301006', 2023, 'Anggota',     'anggota', FALSE, TRUE,  TRUE),
    ('6182301007@student.unpar.ac.id', '$2b$10$y829.cM0UcUwmMsVkCACc.nsYugjI.w0h76aQKbq3nJnfQDBCgAra', 'Nadia Putri',     '6182301007', 2023, 'Anggota',     'anggota', TRUE,  FALSE, TRUE),
    ('6182401008@student.unpar.ac.id', '$2b$10$y829.cM0UcUwmMsVkCACc.nsYugjI.w0h76aQKbq3nJnfQDBCgAra', 'Fajar Nugraha',   '6182401008', 2024, 'Anggota',     'anggota', FALSE, TRUE,  TRUE),
    ('6182401009@student.unpar.ac.id', '$2b$10$y829.cM0UcUwmMsVkCACc.nsYugjI.w0h76aQKbq3nJnfQDBCgAra', 'Rina Oktaviani',  '6182401009', 2024, 'Anggota',     'anggota', TRUE,  FALSE, TRUE),
    ('6182501010@student.unpar.ac.id', '$2b$10$y829.cM0UcUwmMsVkCACc.nsYugjI.w0h76aQKbq3nJnfQDBCgAra', 'Kevin Santoso',   '6182501010', 2025, 'Anggota',     'anggota', TRUE,  TRUE,  TRUE),
    ('6181901011@student.unpar.ac.id', '$2b$10$y829.cM0UcUwmMsVkCACc.nsYugjI.w0h76aQKbq3nJnfQDBCgAra', 'Maya Lestari',    '6181901011', 2019, 'Alumni',      'alumni',  TRUE,  FALSE, TRUE),
    ('6182001012@student.unpar.ac.id', '$2b$10$y829.cM0UcUwmMsVkCACc.nsYugjI.w0h76aQKbq3nJnfQDBCgAra', 'Rizky Hidayat',   '6182001012', 2020, 'Anggota',     'anggota', FALSE, TRUE,  FALSE)
ON CONFLICT DO NOTHING;

-- akun per peran dari insert.sql ikut punya spesialisasi di bawah
UPDATE anggota SET is_penari = TRUE
WHERE email IN ('pelatih@unpar.ac.id', 'anggota@unpar.ac.id', 'alumni@unpar.ac.id');


-- =========================================
-- SPESIALISASI (anggota -> jasa yang dikuasai)
-- Dipakai Buat Event Baru: anggota yang menguasai jasa tampil paling atas saat memilih performer.
-- =========================================

INSERT INTO spesialisasi (id_anggota, id_jasa)
SELECT a.id_anggota, j.id_jasa
FROM (VALUES
    ('6182101001@student.unpar.ac.id', 'Tari Jaipong'),
    ('6182101001@student.unpar.ac.id', 'Tari Saman'),
    ('6182101002@student.unpar.ac.id', 'Tari Merak'),
    ('6182101002@student.unpar.ac.id', 'Tari Pendet'),
    ('6182201003@student.unpar.ac.id', 'Angklung Kreasi'),
    ('6182201003@student.unpar.ac.id', 'Gamelan Sunda'),
    ('sri.handayani@unpar.ac.id',      'Tari Merak'),
    ('sri.handayani@unpar.ac.id',      'Tari Jaipong'),
    ('sri.handayani@unpar.ac.id',      'Tari Topeng Cirebon'),
    ('6182201005@student.unpar.ac.id', 'Tari Merak'),
    ('6182201005@student.unpar.ac.id', 'Tari Piring'),
    ('6182301006@student.unpar.ac.id', 'Gamelan Sunda'),
    ('6182301006@student.unpar.ac.id', 'Kecapi Suling'),
    ('6182301007@student.unpar.ac.id', 'Tari Saman'),
    ('6182301007@student.unpar.ac.id', 'Tari Pendet'),
    ('6182401008@student.unpar.ac.id', 'Angklung Kreasi'),
    ('6182401009@student.unpar.ac.id', 'Tari Jaipong'),
    ('6182401009@student.unpar.ac.id', 'Tari Lenggang Nyai'),
    ('6182501010@student.unpar.ac.id', 'Tari Saman'),
    ('6182501010@student.unpar.ac.id', 'Angklung Kreasi'),
    ('6181901011@student.unpar.ac.id', 'Tari Topeng Cirebon'),
    ('6181901011@student.unpar.ac.id', 'Tari Merak'),
    ('6182001012@student.unpar.ac.id', 'Gamelan Sunda'),
    ('pelatih@unpar.ac.id',            'Tari Topeng Cirebon'),
    ('anggota@unpar.ac.id',            'Tari Merak'),
    ('alumni@unpar.ac.id',             'Tari Jaipong')
) AS s(email, nama_jasa)
JOIN anggota a ON a.email = s.email
JOIN jasa j ON j.nama = s.nama_jasa
ON CONFLICT DO NOTHING;


-- =========================================
-- ALAT MUSIK (contoh, sesuai mockup)
-- =========================================

INSERT INTO alat_musik (nama_alat_musik, jumlah) VALUES
    ('Kendang', 2),
    ('Bonang', 2),
    ('Saron', 4),
    ('Suling', 5),
    ('Rebab', 2),
    ('Gong', 2),
    ('Kecapi', 3),
    ('Angklung', 15),
    ('Calung', 4),
    ('Gambang', 2),
    ('Kenong', 3),
    ('Kempul', 2),
    ('Peking', 2),
    ('Demung', 2),
    ('Jengglong', 2),
    ('Rapai', 4)
ON CONFLICT (nama_alat_musik) DO NOTHING;


-- =========================================
-- BERITA (contoh)
-- Aman dijalankan berulang kali: berita dilewati bila judulnya sudah ada.
--   tautan  (dari media lain) -> url_artikel + sumber diisi, konten NULL
--   artikel (ditulis di TinyMCE) -> konten diisi, url_artikel + sumber NULL
-- =========================================

INSERT INTO berita (judul, tanggal, url_gambar, sumber, url_artikel, is_publik)
SELECT v.judul, v.tanggal::date, v.url_gambar, v.sumber, v.url_artikel, v.is_publik
FROM (VALUES
(
    'LISTRA UNPAR Harumkan Nama Indonesia Lewat Lomba Internasional di Hong Kong',
    '2026-08-27',
    'https://unpar.ac.id/wp-content/uploads/2026/08/LISTRA-UNPAR-Harumkan-Nama-Indonesia-di-Hong-Kong-400x250.jpeg',
    'unpar.ac.id',
    'https://unpar.ac.id/listra-unpar-harumkan-nama-indonesia-lewat-lomba-internasional-di-hong-kong/',
    TRUE
),
(
    'LISTRA UNPAR Kembali Ukir Prestasi Lewat Misi Budaya di Korea Selatan',
    '2024-10-23',
    'https://unpar.ac.id/wp-content/uploads/2024/10/Listra-Misi-Budaya-Korea-Selatan-400x250.jpg',
    'unpar.ac.id',
    'https://unpar.ac.id/listra-unpar-kembali-ukir-prestasi-lewat-misi-budaya-di-korea-selatan/',
    TRUE
),
(
    'LISTRA UNPAR Juara 1 Lomba Tari Kreasi Geotourism Festival 2023',
    '2023-12-01',
    'https://unpar.ac.id/wp-content/uploads/2024/01/Listra-Unpar-Juara-1-Lomba-Tari-Kreasi-Geotourism-Festival-2023-400x250.jpeg',
    'unpar.ac.id',
    'https://unpar.ac.id/listra-unpar-juara-1-lomba-tari-kreasi-geotourism-festival-2023/',
    TRUE
),
(
    'Misi Budaya LISTRA UNPAR dalam Festival Budaya Internasional di Yunani',
    '2023-10-03',
    'https://unpar.ac.id/wp-content/uploads/2023/10/LISTRA-UNPAR-Wakili-Indonesia-dan-Asia-Tenggara-dalam-Festival-Budaya-Internasional-di-Yunani-400x250.jpg',
    'unpar.ac.id',
    'https://unpar.ac.id/misi-budaya-listra-unpar-dalam-festival-budaya-internasional-di-yunani/',
    TRUE
),
(
    'Gelar Pamit Listra Jelang Misi Budaya',
    '2023-07-25',
    'https://unpar.ac.id/wp-content/uploads/2023/07/Gelar-Pamit-Listra-Jelang-Misi-Budaya-400x250.jpg',
    'unpar.ac.id',
    'https://unpar.ac.id/gelar-pamit-listra-jelang-misi-budaya/',
    TRUE
),
(
    'LISTRA UNPAR Juara Harapan 1 di Ajang The 17th National Folklore Festival',
    '2023-03-28',
    'https://unpar.ac.id/wp-content/uploads/2023/03/LISTRA-UNPAR-Juara-Harapan-1-di-Ajang-The-17th-National-Folklore-Festival-400x250.jpg',
    'unpar.ac.id',
    'https://unpar.ac.id/listra-unpar-juara-harapan-1-di-ajang-the-17th-national-folklore-festival/',
    TRUE
)
) AS v(judul, tanggal, url_gambar, sumber, url_artikel, is_publik)
WHERE NOT EXISTS (SELECT 1 FROM berita b WHERE b.judul = v.judul);

INSERT INTO berita (judul, tanggal, url_gambar, konten, is_publik)
SELECT v.judul, v.tanggal::date, v.url_gambar, v.konten, v.is_publik
FROM (VALUES
(
    '(Contoh) Persiapan Gelar Karya LISTRA 2026',
    '2026-11-01',
    'https://unpar.ac.id/wp-content/uploads/2023/07/Gelar-Pamit-Listra-Jelang-Misi-Budaya-400x250.jpg',
    '<p>Ini contoh artikel yang ditulis langsung di editor. Ganti atau hapus lewat halaman Kelola Berita.</p><p>LISTRA UNPAR sedang mempersiapkan <strong>Gelar Karya 2026</strong> dengan penampilan tari dan musik tradisional dari berbagai daerah.</p>',
    TRUE
)
) AS v(judul, tanggal, url_gambar, konten, is_publik)
WHERE NOT EXISTS (SELECT 1 FROM berita b WHERE b.judul = v.judul);


-- =========================================
-- KALENDER EVENT
-- 4 tabel: acara (event), acara_pj (penanggung jawab), acara_jasa (satu baris per jasa per hari),
-- acara_performer (anggota lewat email, atau non-anggota lewat nama_performer).
-- Ditulis sebagai daftar di tabel sementara supaya mudah dibaca dan ditambah.
-- Event yang namanya sudah ada dilewati beserta seluruh isinya.
-- =========================================

CREATE TEMP TABLE c_acara (nama_acara text, tipe_acara text, nama_klien text, lokasi text, is_privat boolean);
INSERT INTO c_acara VALUES
    ('Gala Dinner Perusahaan',                  'job_external', 'PT Nusantara Jaya',              'Ballroom Hotel, Bandung',  FALSE),
    ('Resepsi Pernikahan Keluarga Permatasari', 'job_external', 'Keluarga Permatasari',           'Gedung Resepsi, Bandung',  TRUE),
    ('Gathering Alumni Teknik Informatika',     'job_external', 'Ikatan Alumni TI',               'Aula Pusat UNPAR',         FALSE),
    ('Dies Natalis UNPAR',                      'job_external', 'Rektorat UNPAR',                 'Kampus UNPAR Ciumbuleuit', FALSE),
    ('Pembukaan Seminar Nasional',              'job_external', 'Panitia Seminar Nasional',       'Aula Pusat UNPAR',         FALSE),
    ('Latihan Gabungan',                        'listra',       NULL,                             'Kampus UNPAR Ciumbuleuit', FALSE),
    ('Resepsi Pernikahan Keluarga Wijaya',      'job_external', 'Keluarga Wijaya',                'Gedung Resepsi, Bandung',  TRUE),
    ('Gelar Karya LISTRA 2026',                 'listra',       NULL,                             'Kampus UNPAR Ciumbuleuit', FALSE),
    ('Festival Budaya Kota Bandung',            'job_external', 'Dinas Kebudayaan Kota Bandung',  'Taman Budaya Jawa Barat',  FALSE);

-- PJ: anggota aktif selain Alumni/Admin. Latihan Gabungan tanpa PJ (PJ Tidak Spesifik).
CREATE TEMP TABLE c_pj (nama_acara text, email text);
INSERT INTO c_pj VALUES
    ('Gala Dinner Perusahaan',                  '6182101002@student.unpar.ac.id'),
    ('Gala Dinner Perusahaan',                  'humas@unpar.ac.id'),
    ('Resepsi Pernikahan Keluarga Permatasari', '6182201003@student.unpar.ac.id'),
    ('Gathering Alumni Teknik Informatika',     '6182101001@student.unpar.ac.id'),
    ('Dies Natalis UNPAR',                      'pelatih@unpar.ac.id'),
    ('Dies Natalis UNPAR',                      '6182101002@student.unpar.ac.id'),
    ('Pembukaan Seminar Nasional',              'humas@unpar.ac.id'),
    ('Resepsi Pernikahan Keluarga Wijaya',      '6182201003@student.unpar.ac.id'),
    ('Resepsi Pernikahan Keluarga Wijaya',      'sri.handayani@unpar.ac.id'),
    ('Gelar Karya LISTRA 2026',                 'ukm_listra@unpar.ac.id'),
    ('Gelar Karya LISTRA 2026',                 '6182101001@student.unpar.ac.id'),
    ('Festival Budaya Kota Bandung',            '6182201005@student.unpar.ac.id'),
    ('Festival Budaya Kota Bandung',            '6182201003@student.unpar.ac.id');

-- Jadwal: nama_jasa NULL = hari tanpa jasa; tidak_spesifik TRUE = performer tidak dicatat. Event paling lama 7 hari.
CREATE TEMP TABLE c_jadwal (nama_acara text, tanggal date, jam_mulai time, jam_selesai time, nama_jasa text, tidak_spesifik boolean);
INSERT INTO c_jadwal VALUES
    ('Gala Dinner Perusahaan',                  '2026-09-18', '19:00', '19:15', 'Tari Merak',          FALSE),
    ('Gala Dinner Perusahaan',                  '2026-09-18', '19:30', '20:15', 'Kecapi Suling',       FALSE),
    ('Resepsi Pernikahan Keluarga Permatasari', '2026-09-19', '18:30', '18:45', 'Tari Topeng Cirebon', FALSE),
    ('Resepsi Pernikahan Keluarga Permatasari', '2026-09-19', '19:00', '21:00', 'Gamelan Sunda',       TRUE),
    ('Gathering Alumni Teknik Informatika',     '2026-10-03', '16:00', '16:20', 'Angklung Kreasi',     FALSE),
    ('Gathering Alumni Teknik Informatika',     '2026-10-03', '16:30', '16:45', 'Tari Jaipong',        FALSE),
    ('Dies Natalis UNPAR',                      '2026-11-07', '09:00', '09:15', 'Tari Pendet',         FALSE),
    ('Pembukaan Seminar Nasional',              '2026-11-24', '08:00', '09:00', 'Tari Merak',          FALSE),
    ('Latihan Gabungan',                        '2026-11-28', '10:00', '12:00', 'Tari Saman',          TRUE),
    ('Latihan Gabungan',                        '2026-11-28', '13:00', '15:00', 'Angklung Kreasi',     TRUE),
    ('Resepsi Pernikahan Keluarga Wijaya',      '2026-12-12', '16:00', '18:00', 'Tari Jaipong',        FALSE),
    ('Resepsi Pernikahan Keluarga Wijaya',      '2026-12-12', '19:00', '21:00', 'Gamelan Sunda',       TRUE),
    ('Resepsi Pernikahan Keluarga Wijaya',      '2026-12-13', '09:00', '10:00', NULL,                  FALSE),
    ('Gelar Karya LISTRA 2026',                 '2026-12-19', '18:00', '18:15', 'Tari Saman',          FALSE),
    ('Gelar Karya LISTRA 2026',                 '2026-12-19', '18:30', '18:45', 'Tari Topeng Cirebon', FALSE),
    ('Gelar Karya LISTRA 2026',                 '2026-12-20', '18:00', '18:30', 'Angklung Kreasi',     FALSE),
    ('Festival Budaya Kota Bandung',            '2027-01-15', '15:00', '15:20', 'Tari Piring',         FALSE),
    ('Festival Budaya Kota Bandung',            '2027-01-16', '15:00', '15:20', 'Tari Pendet',         FALSE),
    ('Festival Budaya Kota Bandung',            '2027-01-17', '19:00', '20:00', 'Kecapi Suling',       FALSE);

-- Performer per jasa (dicocokkan lewat event + tanggal + jam mulai): email = anggota, nama_performer = non-anggota.
CREATE TEMP TABLE c_performer (nama_acara text, tanggal date, jam_mulai time, email text, nama_performer text);
INSERT INTO c_performer VALUES
    -- Gala Dinner: Tari Merak 4/4, Kecapi Suling 2/2
    ('Gala Dinner Perusahaan', '2026-09-18', '19:00', '6182101002@student.unpar.ac.id', NULL),
    ('Gala Dinner Perusahaan', '2026-09-18', '19:00', '6182201005@student.unpar.ac.id', NULL),
    ('Gala Dinner Perusahaan', '2026-09-18', '19:00', '6181901011@student.unpar.ac.id', NULL),
    ('Gala Dinner Perusahaan', '2026-09-18', '19:00', 'anggota@unpar.ac.id', NULL),
    ('Gala Dinner Perusahaan', '2026-09-18', '19:30', '6182301006@student.unpar.ac.id', NULL),
    ('Gala Dinner Perusahaan', '2026-09-18', '19:30', '6182001012@student.unpar.ac.id', NULL),
    -- Resepsi Permatasari: Tari Topeng Cirebon 3/3
    ('Resepsi Pernikahan Keluarga Permatasari', '2026-09-19', '18:30', 'sri.handayani@unpar.ac.id', NULL),
    ('Resepsi Pernikahan Keluarga Permatasari', '2026-09-19', '18:30', '6181901011@student.unpar.ac.id', NULL),
    ('Resepsi Pernikahan Keluarga Permatasari', '2026-09-19', '18:30', '6182401009@student.unpar.ac.id', NULL),
    -- Gathering Alumni: Angklung Kreasi 6/6 (2 non-anggota), Tari Jaipong 4/4
    ('Gathering Alumni Teknik Informatika', '2026-10-03', '16:00', '6182201003@student.unpar.ac.id', NULL),
    ('Gathering Alumni Teknik Informatika', '2026-10-03', '16:00', '6182401008@student.unpar.ac.id', NULL),
    ('Gathering Alumni Teknik Informatika', '2026-10-03', '16:00', '6182501010@student.unpar.ac.id', NULL),
    ('Gathering Alumni Teknik Informatika', '2026-10-03', '16:00', '6182301006@student.unpar.ac.id', NULL),
    ('Gathering Alumni Teknik Informatika', '2026-10-03', '16:00', NULL, 'Raka Pratama'),
    ('Gathering Alumni Teknik Informatika', '2026-10-03', '16:00', NULL, 'Lala Safitri'),
    ('Gathering Alumni Teknik Informatika', '2026-10-03', '16:30', '6182101001@student.unpar.ac.id', NULL),
    ('Gathering Alumni Teknik Informatika', '2026-10-03', '16:30', '6182401009@student.unpar.ac.id', NULL),
    ('Gathering Alumni Teknik Informatika', '2026-10-03', '16:30', '6182201005@student.unpar.ac.id', NULL),
    ('Gathering Alumni Teknik Informatika', '2026-10-03', '16:30', 'alumni@unpar.ac.id', NULL),
    -- Dies Natalis: Tari Pendet 4/4
    ('Dies Natalis UNPAR', '2026-11-07', '09:00', '6182101002@student.unpar.ac.id', NULL),
    ('Dies Natalis UNPAR', '2026-11-07', '09:00', '6182301007@student.unpar.ac.id', NULL),
    ('Dies Natalis UNPAR', '2026-11-07', '09:00', '6182201005@student.unpar.ac.id', NULL),
    ('Dies Natalis UNPAR', '2026-11-07', '09:00', '6182401009@student.unpar.ac.id', NULL),
    -- Seminar Nasional: Tari Merak 2/4 (kurang 2)
    ('Pembukaan Seminar Nasional', '2026-11-24', '08:00', 'anggota@unpar.ac.id', NULL),
    ('Pembukaan Seminar Nasional', '2026-11-24', '08:00', 'alumni@unpar.ac.id', NULL),
    -- Resepsi Wijaya: Tari Jaipong 4/4 (1 non-anggota)
    ('Resepsi Pernikahan Keluarga Wijaya', '2026-12-12', '16:00', '6182101001@student.unpar.ac.id', NULL),
    ('Resepsi Pernikahan Keluarga Wijaya', '2026-12-12', '16:00', '6182401009@student.unpar.ac.id', NULL),
    ('Resepsi Pernikahan Keluarga Wijaya', '2026-12-12', '16:00', '6182501010@student.unpar.ac.id', NULL),
    ('Resepsi Pernikahan Keluarga Wijaya', '2026-12-12', '16:00', NULL, 'Dimas Saputra'),
    -- Gelar Karya: Tari Saman 8/8, Tari Topeng Cirebon 3/3, Angklung Kreasi 4/6 (kurang 2)
    ('Gelar Karya LISTRA 2026', '2026-12-19', '18:00', '6182101001@student.unpar.ac.id', NULL),
    ('Gelar Karya LISTRA 2026', '2026-12-19', '18:00', '6182301007@student.unpar.ac.id', NULL),
    ('Gelar Karya LISTRA 2026', '2026-12-19', '18:00', '6182501010@student.unpar.ac.id', NULL),
    ('Gelar Karya LISTRA 2026', '2026-12-19', '18:00', '6182201005@student.unpar.ac.id', NULL),
    ('Gelar Karya LISTRA 2026', '2026-12-19', '18:00', '6182101002@student.unpar.ac.id', NULL),
    ('Gelar Karya LISTRA 2026', '2026-12-19', '18:00', '6182401009@student.unpar.ac.id', NULL),
    ('Gelar Karya LISTRA 2026', '2026-12-19', '18:00', '6181901011@student.unpar.ac.id', NULL),
    ('Gelar Karya LISTRA 2026', '2026-12-19', '18:00', 'sri.handayani@unpar.ac.id', NULL),
    ('Gelar Karya LISTRA 2026', '2026-12-19', '18:30', 'sri.handayani@unpar.ac.id', NULL),
    ('Gelar Karya LISTRA 2026', '2026-12-19', '18:30', '6181901011@student.unpar.ac.id', NULL),
    ('Gelar Karya LISTRA 2026', '2026-12-19', '18:30', 'pelatih@unpar.ac.id', NULL),
    ('Gelar Karya LISTRA 2026', '2026-12-20', '18:00', '6182201003@student.unpar.ac.id', NULL),
    ('Gelar Karya LISTRA 2026', '2026-12-20', '18:00', '6182401008@student.unpar.ac.id', NULL),
    ('Gelar Karya LISTRA 2026', '2026-12-20', '18:00', '6182501010@student.unpar.ac.id', NULL),
    ('Gelar Karya LISTRA 2026', '2026-12-20', '18:00', '6182301006@student.unpar.ac.id', NULL),
    -- Festival Budaya: Tari Piring 3/5, Tari Pendet 2/4, Kecapi Suling 2/2
    ('Festival Budaya Kota Bandung', '2027-01-15', '15:00', '6182201005@student.unpar.ac.id', NULL),
    ('Festival Budaya Kota Bandung', '2027-01-15', '15:00', '6182301007@student.unpar.ac.id', NULL),
    ('Festival Budaya Kota Bandung', '2027-01-15', '15:00', '6182401009@student.unpar.ac.id', NULL),
    ('Festival Budaya Kota Bandung', '2027-01-16', '15:00', '6182101002@student.unpar.ac.id', NULL),
    ('Festival Budaya Kota Bandung', '2027-01-16', '15:00', '6182301007@student.unpar.ac.id', NULL),
    ('Festival Budaya Kota Bandung', '2027-01-17', '19:00', '6182301006@student.unpar.ac.id', NULL),
    ('Festival Budaya Kota Bandung', '2027-01-17', '19:00', '6182401008@student.unpar.ac.id', NULL);

-- Simpan hanya event yang belum ada, lalu isinya
CREATE TEMP TABLE c_baru (id_acara int, nama_acara text);
WITH ins AS (
  INSERT INTO acara (tipe_acara, nama_acara, nama_klien, lokasi, is_privat)
  SELECT c.tipe_acara, c.nama_acara, c.nama_klien, c.lokasi, c.is_privat
  FROM c_acara c
  WHERE NOT EXISTS (SELECT 1 FROM acara a WHERE a.nama_acara = c.nama_acara)
  RETURNING id_acara, nama_acara
)
INSERT INTO c_baru SELECT id_acara, nama_acara FROM ins;

INSERT INTO acara_pj (id_acara, id_anggota)
SELECT b.id_acara, a.id_anggota
FROM c_pj p
JOIN c_baru b USING (nama_acara)
JOIN anggota a ON a.email = p.email;

INSERT INTO acara_jasa (id_acara, id_jasa, tanggal, jam_mulai, jam_selesai, is_tidak_spesifik)
SELECT b.id_acara, j.id_jasa, d.tanggal, d.jam_mulai, d.jam_selesai, d.tidak_spesifik
FROM c_jadwal d
JOIN c_baru b USING (nama_acara)
LEFT JOIN jasa j ON j.nama = d.nama_jasa;

-- email yang salah ketik membuat id_anggota dan nama_performer sama-sama NULL -> ditolak chk_performer_satu
INSERT INTO acara_performer (id_acara_jasa, id_anggota, nama_performer)
SELECT aj.id_acara_jasa, a.id_anggota, CASE WHEN p.email IS NULL THEN p.nama_performer END
FROM c_performer p
JOIN c_baru b USING (nama_acara)
JOIN acara_jasa aj ON aj.id_acara = b.id_acara AND aj.tanggal = p.tanggal AND aj.jam_mulai = p.jam_mulai
LEFT JOIN anggota a ON a.email = p.email;

DROP TABLE c_acara, c_pj, c_jadwal, c_performer, c_baru;


-- =========================================
-- TESTIMONI
-- Terhubung ke event di atas lewat nama_acara (dan instansi = Nama Client).
-- Status: disetujui (Diterima) tampil bila is_aktif; menunggu (Ditunggu); ditolak (Ditolak).
-- =========================================

INSERT INTO testimoni
    (nama_klien, instansi, nama_acara, is_acara_privat, isi_testimoni, rating, tanggal_input, status, sumber, is_aktif)
SELECT t.nama_klien, t.instansi, t.nama_acara, t.is_acara_privat, t.isi_testimoni, t.rating,
       t.tanggal_input::timestamp, t.status, t.sumber, t.is_aktif
FROM (VALUES
    ('Ibu Ratna Sari', 'PT Nusantara Jaya', 'Gala Dinner Perusahaan', FALSE,
     'Tamu undangan sangat terkesan. Kostumnya rapi dan penarinya profesional.',
     5, '2026-09-20 10:00:00', 'disetujui', 'web', TRUE),
    ('Dinda Permatasari', NULL, 'Resepsi Pernikahan Keluarga Permatasari', TRUE,
     'Terima kasih LISTRA, Tari Topeng-nya jadi momen paling berkesan di resepsi kami.',
     5, '2026-09-21 13:30:00', 'disetujui', 'whatsapp', TRUE),
    ('Arif Budiman', 'Ikatan Alumni TI', 'Gathering Alumni Teknik Informatika', FALSE,
     'Seru dan menghibur. Mungkin durasinya bisa sedikit lebih panjang.',
     4, '2026-10-05 09:15:00', 'disetujui', 'web', TRUE),
    ('Sinta Maharani', 'Ikatan Alumni TI', 'Gathering Alumni Teknik Informatika', FALSE,
     'Angklungnya bikin suasana jadi hangat, semua alumni ikut bernyanyi.',
     5, '2026-10-06 19:00:00', 'disetujui', 'whatsapp', FALSE),
    ('Panitia Dies Natalis', 'Rektorat UNPAR', 'Dies Natalis UNPAR', FALSE,
     'Tari Pendet membuka acara dengan sangat baik. Terima kasih LISTRA.',
     NULL, '2026-11-10 08:00:00', 'menunggu', 'web', FALSE),
    ('Andi', NULL, NULL, FALSE,
     'Jual jasa dekorasi murah, hubungi nomor kami.',
     NULL, '2026-11-12 22:41:00', 'ditolak', 'web', FALSE)
) AS t(nama_klien, instansi, nama_acara, is_acara_privat, isi_testimoni, rating, tanggal_input, status, sumber, is_aktif)
WHERE NOT EXISTS (
  SELECT 1 FROM testimoni x WHERE x.nama_klien = t.nama_klien AND x.isi_testimoni = t.isi_testimoni
);
