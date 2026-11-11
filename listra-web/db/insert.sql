-- gw komenin dulu, nanti di benerin

-- -- =========================================
-- -- KECOCOKAN
-- -- Required first — jasa.id_kecocokan is a FK
-- -- IDs: 1=Opening, 2=Middle, 3=Closing
-- -- =========================================

-- INSERT INTO kecocokan (nama_kecocokan) VALUES
--     ('Opening'),
--     ('Middle'),
--     ('Closing');

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