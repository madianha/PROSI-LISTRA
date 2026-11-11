
-- =============================================
-- JUNCTION TABLES
-- =============================================

-- Tabel jasa_kecocokan
CREATE TABLE jasa_kecocokan (
    id_jasa      INT NOT NULL REFERENCES jasa(id_jasa) ON DELETE CASCADE,
    id_kecocokan INT NOT NULL REFERENCES kecocokan(id_kecocokan) ON DELETE RESTRICT,
    PRIMARY KEY (id_jasa, id_kecocokan)
);

-- Tabel spesialisasi
CREATE TABLE spesialisasi (
    id_anggota INT NOT NULL REFERENCES anggota(id_anggota) ON DELETE CASCADE,
    id_jasa    INT NOT NULL REFERENCES jasa(id_jasa) ON DELETE CASCADE,
    PRIMARY KEY (id_anggota, id_jasa)
);

-- Tabel acara_pj
CREATE TABLE acara_pj (
    id_acara   INT NOT NULL REFERENCES acara(id_acara) ON DELETE CASCADE,
    id_anggota INT NOT NULL REFERENCES anggota(id_anggota) ON DELETE RESTRICT,
    PRIMARY KEY (id_acara, id_anggota)
);
