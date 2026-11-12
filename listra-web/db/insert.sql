-- =========================================
-- DATA ACUAN (aktif; isi tetap, wajib ada sebelum data jasa)
-- kecocokan: 1=Opening, 2=Middle, 3=Closing (dipakai jasa_kecocokan)
-- provinsi : kultur jasa (jasa.id_provinsi)
-- =========================================

INSERT INTO kecocokan (nama_kecocokan) VALUES
    ('Opening'),
    ('Middle'),
    ('Closing');

INSERT INTO provinsi (nama_provinsi, pulau) VALUES
    ('Aceh', 'Sumatera'), ('Sumatera Utara', 'Sumatera'), ('Sumatera Barat', 'Sumatera'),
    ('Riau', 'Sumatera'), ('Kepulauan Riau', 'Sumatera'), ('Jambi', 'Sumatera'),
    ('Bengkulu', 'Sumatera'), ('Sumatera Selatan', 'Sumatera'),
    ('Kepulauan Bangka Belitung', 'Sumatera'), ('Lampung', 'Sumatera'),
    ('Banten', 'Jawa'), ('DKI Jakarta', 'Jawa'), ('Jawa Barat', 'Jawa'), ('Jawa Tengah', 'Jawa'),
    ('DI Yogyakarta', 'Jawa'), ('Jawa Timur', 'Jawa'),
    ('Bali', 'Bali & Nusa Tenggara'), ('Nusa Tenggara Barat', 'Bali & Nusa Tenggara'),
    ('Nusa Tenggara Timur', 'Bali & Nusa Tenggara'),
    ('Kalimantan Barat', 'Kalimantan'), ('Kalimantan Tengah', 'Kalimantan'),
    ('Kalimantan Selatan', 'Kalimantan'), ('Kalimantan Timur', 'Kalimantan'),
    ('Kalimantan Utara', 'Kalimantan'),
    ('Sulawesi Utara', 'Sulawesi'), ('Gorontalo', 'Sulawesi'), ('Sulawesi Tengah', 'Sulawesi'),
    ('Sulawesi Barat', 'Sulawesi'), ('Sulawesi Selatan', 'Sulawesi'), ('Sulawesi Tenggara', 'Sulawesi'),
    ('Maluku', 'Maluku'), ('Maluku Utara', 'Maluku'),
    ('Papua', 'Papua'), ('Papua Barat', 'Papua'), ('Papua Barat Daya', 'Papua'),
    ('Papua Tengah', 'Papua'), ('Papua Pegunungan', 'Papua'), ('Papua Selatan', 'Papua');

-- gw komenin dulu, nanti di benerin

-- -- =========================================
-- -- JASA
-- -- =========================================

-- INSERT INTO jasa (tipe_jasa, nama, deskripsi, id_kecocokan, kultur, harga_minimum, harga_maximum, min_performer, link_image, is_aktif)
-- VALUES
--     -- Tari
--     ('tari',  'Tari Merak',
--      'Tarian Sunda yang menggambarkan keindahan burung merak jantan saat memikat pasangannya.',
--      1, 'Jawa', 2500000, 5000000, 3,
--      'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?auto=format&fit=crop&w=900&q=85',
--      TRUE),

--     ('tari',  'Tari Jaipong',
--      'Tarian pergaulan khas Jawa Barat dengan gerakan dinamis dan energik.',
--      2, 'Jawa', 3000000, 6000000, 4,
--      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=900&q=85',
--      TRUE),

--     ('tari',  'Tari Saman',
--      'Tarian Aceh dengan formasi duduk berbaris dan tepukan tangan yang serempak.',
--      1, 'Sumatera', 4000000, 7500000, 8,
--      'https://images.unsplash.com/photo-1524368730574-8b5c7e9e8f43?auto=format&fit=crop&w=900&q=85',
--      TRUE),

--     ('tari',  'Tari Topeng Cirebon',
--      'Tarian klasik Cirebon yang menggunakan topeng sebagai media ekspresi dan penceritaan.',
--      2, 'Jawa', 3500000, 6500000, 2,
--      NULL,
--      TRUE),

--     ('tari',  'Tari Kecak',
--      'Tarian ritual Bali yang terkenal dengan nyanyian kolektif "cak" tanpa iringan gamelan.',
--      3, 'Bali', 5000000, 9000000, 10,
--      NULL,
--      TRUE),

--     ('tari',  'Tari Pendet',
--      'Tarian penyambutan dari Bali, ditampilkan oleh penari yang membawa bokor berisi bunga.',
--      1, 'Bali', 2000000, 4500000, 4,
--      NULL,
--      TRUE),

--     -- Musik
--     ('musik', 'Angklung Ensemble',
--      'Pertunjukan ansambel angklung khas Sunda yang merdu dan bisa melibatkan partisipasi tamu.',
--      1, 'Jawa', 2000000, 4000000, 5,
--      NULL,
--      TRUE),

--     ('musik', 'Gamelan Sunda',
--      'Pertunjukan gamelan degung khas Sunda, cocok untuk latar suasana formal dan perayaan adat.',
--      2, 'Jawa', 3000000, 5500000, 6,
--      NULL,
--      TRUE),

--     ('musik', 'Gamelan Bali',
--      'Pertunjukan gamelan Bali dengan ritme cepat dan dinamis, membawa nuansa upacara Pulau Dewata.',
--      2, 'Bali', 3500000, 6000000, 6,
--      NULL,
--      TRUE);

-- -- =========================================
-- -- ANGGOTA
-- -- Admin accounts only; personal fields left NULL
-- -- =========================================

-- INSERT INTO anggota (nama, email, npm, angkatan_unpar, jabatan, is_aktif)
-- VALUES
--     ('Admin',  NULL, NULL, NULL, NULL, TRUE),
--     ('LISTRA', NULL, NULL, NULL, NULL, TRUE),
--     ('Kang Rizal', NULL, NULL, NULL, Pelatih, TRUE);

-- =========================================
-- ANGGOTA PLACEHOLDER, SATU AKUN PER PERAN
-- Semua kata sandi: password123 (hash bcrypt), ganti sebelum dipakai sungguhan
-- =========================================

INSERT INTO anggota (email, password_hash, nama, peran)
VALUES
    ('admin@gmail.com',   '$2b$10$y829.cM0UcUwmMsVkCACc.nsYugjI.w0h76aQKbq3nJnfQDBCgAra', 'Admin',   'admin'),
    ('listra@gmail.com',  '$2b$10$y829.cM0UcUwmMsVkCACc.nsYugjI.w0h76aQKbq3nJnfQDBCgAra', 'LISTRA',  'listra'),
    ('humas@gmail.com',   '$2b$10$y829.cM0UcUwmMsVkCACc.nsYugjI.w0h76aQKbq3nJnfQDBCgAra', 'Humas',   'humas'),
    ('pelatih@gmail.com', '$2b$10$y829.cM0UcUwmMsVkCACc.nsYugjI.w0h76aQKbq3nJnfQDBCgAra', 'Pelatih', 'pelatih'),
    ('anggota@gmail.com', '$2b$10$y829.cM0UcUwmMsVkCACc.nsYugjI.w0h76aQKbq3nJnfQDBCgAra', 'Anggota', 'anggota'),
    ('alumni@gmail.com',  '$2b$10$y829.cM0UcUwmMsVkCACc.nsYugjI.w0h76aQKbq3nJnfQDBCgAra', 'Alumni',  'alumni')
ON CONFLICT (email) DO NOTHING;


-- =========================================
-- KONTAK WHATSAPP (satu baris, id_kontak selalu 1)
-- =========================================

INSERT INTO kontak_whatsapp (id_kontak, nomor_wa, nama_humas, template_pesan)
VALUES (
    1,
    '628123456789',
    'Bagas Nugroho (Koor Humas)',
    'Halo Humas LISTRA, saya tertarik dengan {jasa}. Boleh minta informasi lebih lanjut?'
)
ON CONFLICT (id_kontak) DO NOTHING;


-- =========================================
-- BERITA PLACEHOLDER
--   tautan  (dari media lain) -> url_artikel + sumber diisi, konten NULL
--   artikel (ditulis di TinyMCE) -> konten diisi, url_artikel + sumber NULL
-- =========================================

INSERT INTO berita (judul, tanggal, url_gambar, sumber, url_artikel, is_publik) VALUES
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
);

INSERT INTO berita (judul, tanggal, url_gambar, konten, is_publik) VALUES
(
    '(Contoh) Persiapan Gelar Karya LISTRA 2026',
    '2026-11-01',
    'https://unpar.ac.id/wp-content/uploads/2023/07/Gelar-Pamit-Listra-Jelang-Misi-Budaya-400x250.jpg',
    '<p>Ini contoh artikel yang ditulis langsung di editor. Ganti atau hapus lewat halaman Kelola Berita.</p><p>LISTRA UNPAR sedang mempersiapkan <strong>Gelar Karya 2026</strong> dengan penampilan tari dan musik tradisional dari berbagai daerah.</p>',
    TRUE
);
