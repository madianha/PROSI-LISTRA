// Tempel data dari Google Sheets / Excel / file .csv ke tabel Tambah Massal Anggota.
// Menyalin sel dari spreadsheet menghasilkan teks dipisah tab; file .csv dipisah koma (atau titik koma).

/** Kolom tabel Tambah Massal = kolom tabel anggota (tanpa password_hash; kata sandi bawaan password123). */
export const KOLOM_BULK = [
  { kunci: "nama", label: "Nama", wajib: true },
  { kunci: "email", label: "Email", wajib: true },
  { kunci: "npm", label: "NPM" },
  { kunci: "angkatan_unpar", label: "Angkatan" },
  { kunci: "jabatan", label: "Jabatan" },
  { kunci: "peran", label: "Peran", wajib: true },
  { kunci: "is_penari", label: "Penari" },
  { kunci: "is_pemusik", label: "Pemusik" },
  { kunci: "is_aktif", label: "Aktif" },
];

/** Pecah teks tempelan menjadi baris & sel. Mendukung tanda kutip CSV ("a, b" dan "" di dalamnya). */
export function pecahTeks(teks) {
  const bersih = String(teks ?? "").replace(/\r\n?/g, "\n").replace(/\n+$/, "");
  if (!bersih) return [];
  const barisPertama = bersih.split("\n")[0];
  const pemisah = barisPertama.includes("\t") ? "\t" : barisPertama.includes(";") && !barisPertama.includes(",") ? ";" : ",";

  const hasil = [];
  let baris = [];
  let sel = "";
  let dalamKutip = false;
  for (let i = 0; i < bersih.length; i++) {
    const c = bersih[i];
    if (dalamKutip) {
      if (c === '"' && bersih[i + 1] === '"') {
        sel += '"';
        i++;
      } else if (c === '"') dalamKutip = false;
      else sel += c;
    } else if (c === '"' && sel === "") dalamKutip = true;
    else if (c === pemisah) {
      baris.push(sel.trim());
      sel = "";
    } else if (c === "\n") {
      baris.push(sel.trim());
      hasil.push(baris);
      baris = [];
      sel = "";
    } else sel += c;
  }
  baris.push(sel.trim());
  hasil.push(baris);
  return hasil;
}

const normal = (s) => String(s ?? "").trim().toLowerCase().replace(/[\s_*]+/g, "");

/**
 * Bila baris pertama adalah header (mis. "Nama, Email, Peran" atau "nama,email,npm"), kembalikan urutan kunci kolomnya.
 * null bila bukan header (tidak ada judul kolom yang dikenali).
 */
export function cocokkanHeader(sel) {
  const peta = new Map();
  for (const k of KOLOM_BULK) {
    peta.set(normal(k.kunci), k.kunci);
    peta.set(normal(k.label), k.kunci);
  }
  const kunci = sel.map((s) => peta.get(normal(s)) ?? null);
  return kunci.filter(Boolean).length >= 2 ? kunci : null;
}

/** Baris kosong = semua sel kosong (tidak ikut disimpan). */
export const barisKosong = (row) => KOLOM_BULK.every((k) => !String(row[k.kunci] ?? "").trim());

export const barisBaru = () => Object.fromEntries(KOLOM_BULK.map((k) => [k.kunci, ""]));

/** Isi template .csv untuk diunduh lalu diisi di spreadsheet. */
export const TEMPLATE_CSV = `${KOLOM_BULK.map((k) => k.kunci).join(",")}\nContoh Nama,nama@student.unpar.ac.id,6182301001,2023,Anggota,Anggota,Ya,Tidak,Ya\n`;
