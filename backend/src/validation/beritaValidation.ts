import sanitizeHtml from "sanitize-html";

/** Kolom berita yang boleh dikirim client (sama persis dengan tabel berita). */
export interface BeritaInput {
  judul: string;
  tanggal: string;
  url_gambar: string;
  konten: string | null;
  sumber: string | null;
  url_artikel: string | null;
}

export type ValidationResult =
  | { ok: true; data: BeritaInput }
  | { ok: false; message: string };

const MAX_VARCHAR = 255;

function teks(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isTanggalValid(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Gambar boleh hasil upload (/uploads/...) atau URL http(s). */
function isUrlGambarValid(value: string): boolean {
  return value.startsWith("/uploads/") || isHttpUrl(value);
}

/** Membersihkan HTML dari TinyMCE sebelum disimpan (mencegah script/XSS). */
export function sanitizeKonten(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "figure", "figcaption"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "width", "height"],
      "*": ["style"],
    },
    allowedStyles: {
      "*": { "text-align": [/^(left|right|center|justify)$/] },
    },
    allowedSchemes: ["http", "https", "mailto"],
  });
}

/** Konten dianggap kosong bila tidak ada teks dan tidak ada gambar. */
function isKontenKosong(html: string): boolean {
  if (/<img\b/i.test(html)) return false;
  const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} });
  return text.replace(/&nbsp;/g, " ").trim() === "";
}

/**
 * Validasi body POST/PUT berita.
 * Jenis ditentukan dari url_artikel: kosong = artikel, terisi = tautan.
 */
export function validateBerita(body: unknown): ValidationResult {
  const input = (body ?? {}) as Record<string, unknown>;

  const judul = teks(input.judul);
  const tanggal = teks(input.tanggal);
  const url_gambar = teks(input.url_gambar);
  const konten = typeof input.konten === "string" ? input.konten : "";
  const sumber = teks(input.sumber);
  const url_artikel = teks(input.url_artikel);

  if (judul === "") return { ok: false, message: "Judul wajib diisi." };
  if (judul.length > MAX_VARCHAR) {
    return { ok: false, message: `Judul maksimal ${MAX_VARCHAR} karakter.` };
  }
  if (!isTanggalValid(tanggal)) {
    return { ok: false, message: "Tanggal wajib diisi dengan format YYYY-MM-DD." };
  }
  if (url_gambar === "") return { ok: false, message: "Gambar sampul wajib diisi." };
  if (!isUrlGambarValid(url_gambar)) {
    return { ok: false, message: "Alamat gambar sampul tidak valid." };
  }

  // Tautan
  if (url_artikel !== "") {
    if (konten.trim() !== "") {
      return { ok: false, message: "Berita tautan tidak boleh memiliki konten." };
    }
    if (!isHttpUrl(url_artikel)) {
      return { ok: false, message: "URL artikel harus diawali http:// atau https://." };
    }
    if (sumber === "") return { ok: false, message: "Sumber wajib diisi untuk berita tautan." };
    if (sumber.length > MAX_VARCHAR) {
      return { ok: false, message: `Sumber maksimal ${MAX_VARCHAR} karakter.` };
    }
    return {
      ok: true,
      data: { judul, tanggal, url_gambar, konten: null, sumber, url_artikel },
    };
  }

  // Artikel
  if (sumber !== "") {
    return { ok: false, message: "Sumber hanya diisi untuk berita tautan." };
  }
  const kontenBersih = sanitizeKonten(konten);
  if (isKontenKosong(kontenBersih)) {
    return { ok: false, message: "Konten artikel wajib diisi." };
  }
  return {
    ok: true,
    data: { judul, tanggal, url_gambar, konten: kontenBersih, sumber: null, url_artikel: null },
  };
}
