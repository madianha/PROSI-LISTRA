-- =========================================
-- insert.sql: DATA DASAR yang dibutuhkan aplikasi.
-- Urutan menjalankan: master.sql -> junction.sql -> insert.sql -> (opsional) dummy.sql
-- Data contoh (jasa, testimoni, berita, alat musik, event kalender) ada di dummy.sql.
-- =========================================

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

-- =========================================
-- ANGGOTA PLACEHOLDER, SATU AKUN PER PERAN
-- Semua kata sandi: password123 (hash bcrypt), ganti sebelum dipakai sungguhan
-- =========================================

INSERT INTO anggota (email, password_hash, nama, peran)
VALUES
    ('admin@unpar.ac.id',   '$2b$10$y829.cM0UcUwmMsVkCACc.nsYugjI.w0h76aQKbq3nJnfQDBCgAra', 'Admin',   'admin'),
    ('ukm_listra@unpar.ac.id',  '$2b$10$y829.cM0UcUwmMsVkCACc.nsYugjI.w0h76aQKbq3nJnfQDBCgAra', 'LISTRA',  'listra'),
    ('humas@unpar.ac.id',   '$2b$10$y829.cM0UcUwmMsVkCACc.nsYugjI.w0h76aQKbq3nJnfQDBCgAra', 'Humas',   'humas'),
    ('pelatih@unpar.ac.id', '$2b$10$y829.cM0UcUwmMsVkCACc.nsYugjI.w0h76aQKbq3nJnfQDBCgAra', 'Pelatih', 'pelatih'),
    ('anggota@unpar.ac.id', '$2b$10$y829.cM0UcUwmMsVkCACc.nsYugjI.w0h76aQKbq3nJnfQDBCgAra', 'Anggota', 'anggota'),
    ('alumni@unpar.ac.id',  '$2b$10$y829.cM0UcUwmMsVkCACc.nsYugjI.w0h76aQKbq3nJnfQDBCgAra', 'Alumni',  'alumni')
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
