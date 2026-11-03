// Aturan berita di sisi frontend. Harus sama dengan backend/src/validation/beritaValidation.ts

/** Jenis tidak disimpan di database: url_artikel terisi = tautan, kosong = artikel. */
export function jenisBerita(berita) {
  return berita?.url_artikel ? "tautan" : "artikel";
}

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** '2026-10-10' -> '10 Okt 2026' */
export function formatTanggal(tanggal) {
  const cocok = /^(\d{4})-(\d{2})-(\d{2})$/.exec(tanggal ?? "");
  if (!cocok) return "";
  const [, tahun, bulan, hari] = cocok;
  return `${Number(hari)} ${BULAN[Number(bulan) - 1]} ${tahun}`;
}

/** Tanggal hari ini dalam format input date (YYYY-MM-DD), waktu lokal. */
export function hariIni() {
  const d = new Date();
  const dua = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${dua(d.getMonth() + 1)}-${dua(d.getDate())}`;
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Konten TinyMCE dianggap kosong bila tidak ada teks dan tidak ada gambar. */
export function isKontenKosong(html) {
  if (/<img\b/i.test(html ?? "")) return false;
  const teks = (html ?? "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");
  return teks.trim() === "";
}

/**
 * Cek form sebelum dikirim. Mengembalikan { namaKolom: pesan }.
 * Objek kosong berarti form valid.
 */
export function validateBeritaForm(values, jenis) {
  const errors = {};
  const judul = (values.judul ?? "").trim();

  if (judul === "") errors.judul = "Judul wajib diisi.";
  else if (judul.length > 255) errors.judul = "Judul maksimal 255 karakter.";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.tanggal ?? "")) errors.tanggal = "Tanggal wajib diisi.";

  if (!values.url_gambar) errors.url_gambar = "Gambar sampul wajib diunggah.";

  if (jenis === "tautan") {
    const sumber = (values.sumber ?? "").trim();
    if (sumber === "") errors.sumber = "Sumber wajib diisi.";
    else if (sumber.length > 255) errors.sumber = "Sumber maksimal 255 karakter.";

    const url = (values.url_artikel ?? "").trim();
    if (url === "") errors.url_artikel = "URL artikel wajib diisi.";
    else if (!isHttpUrl(url)) errors.url_artikel = "URL harus diawali http:// atau https://.";
  } else if (isKontenKosong(values.konten)) {
    errors.konten = "Konten artikel wajib diisi.";
  }

  return errors;
}

/** Data yang dikirim ke API: persis kolom tabel berita yang bisa diisi. */
export function toPayload(values, jenis) {
  const umum = {
    judul: values.judul.trim(),
    tanggal: values.tanggal,
    url_gambar: values.url_gambar,
  };
  if (jenis === "tautan") {
    return { ...umum, konten: null, sumber: values.sumber.trim(), url_artikel: values.url_artikel.trim() };
  }
  return { ...umum, konten: values.konten, sumber: null, url_artikel: null };
}
