import { describe, expect, it } from "vitest";
import { validateBerita } from "../src/validation/beritaValidation";

const artikel = {
  judul: "Persiapan Gelar Karya",
  tanggal: "2026-10-10",
  url_gambar: "/uploads/sampul.jpg",
  konten: "<p>Latihan dimulai.</p>",
};

const tautan = {
  judul: "LISTRA Juara 1",
  tanggal: "2023-12-01",
  url_gambar: "https://unpar.ac.id/gambar.jpg",
  sumber: "unpar.ac.id",
  url_artikel: "https://unpar.ac.id/listra-juara",
};

function gagal(body: unknown): string {
  const hasil = validateBerita(body);
  if (hasil.ok) throw new Error("seharusnya gagal");
  return hasil.message;
}

describe("validateBerita - artikel", () => {
  it("menerima artikel valid dan mengosongkan sumber & url_artikel", () => {
    const hasil = validateBerita(artikel);
    expect(hasil).toEqual({
      ok: true,
      data: { ...artikel, sumber: null, url_artikel: null },
    });
  });

  it("menolak artikel tanpa konten", () => {
    expect(gagal({ ...artikel, konten: "" })).toBe("Konten artikel wajib diisi.");
  });

  it("menolak konten yang hanya berisi tag kosong", () => {
    expect(gagal({ ...artikel, konten: "<p>&nbsp;</p>" })).toBe("Konten artikel wajib diisi.");
  });

  it("menerima konten yang hanya berisi gambar", () => {
    const hasil = validateBerita({ ...artikel, konten: '<p><img src="/uploads/a.jpg"></p>' });
    expect(hasil.ok).toBe(true);
  });

  it("menolak artikel yang mengisi sumber", () => {
    expect(gagal({ ...artikel, sumber: "unpar.ac.id" })).toBe(
      "Sumber hanya diisi untuk berita tautan.",
    );
  });

  it("membuang script dari konten", () => {
    const hasil = validateBerita({
      ...artikel,
      konten: '<p>Halo</p><script>alert(1)</script><img src="x" onerror="alert(1)">',
    });
    expect(hasil.ok).toBe(true);
    if (hasil.ok) {
      expect(hasil.data.konten).not.toContain("script");
      expect(hasil.data.konten).not.toContain("onerror");
      expect(hasil.data.konten).toContain("<p>Halo</p>");
    }
  });
});

describe("validateBerita - tautan", () => {
  it("menerima tautan valid dan mengosongkan konten", () => {
    expect(validateBerita(tautan)).toEqual({ ok: true, data: { ...tautan, konten: null } });
  });

  it("menolak tautan tanpa sumber", () => {
    expect(gagal({ ...tautan, sumber: " " })).toBe("Sumber wajib diisi untuk berita tautan.");
  });

  it("menolak url_artikel yang bukan http(s)", () => {
    expect(gagal({ ...tautan, url_artikel: "javascript:alert(1)" })).toBe(
      "URL artikel harus diawali http:// atau https://.",
    );
  });

  it("menolak tautan yang juga berisi konten", () => {
    expect(gagal({ ...tautan, konten: "<p>isi</p>" })).toBe(
      "Berita tautan tidak boleh memiliki konten.",
    );
  });
});

describe("validateBerita - kolom umum", () => {
  it("menolak judul kosong", () => {
    expect(gagal({ ...artikel, judul: "  " })).toBe("Judul wajib diisi.");
  });

  it("menolak judul lebih dari 255 karakter", () => {
    expect(gagal({ ...artikel, judul: "a".repeat(256) })).toBe("Judul maksimal 255 karakter.");
  });

  it.each(["", "10-10-2026", "2026-02-30", "kemarin"])("menolak tanggal %j", (tanggal) => {
    expect(gagal({ ...artikel, tanggal })).toBe("Tanggal wajib diisi dengan format YYYY-MM-DD.");
  });

  it("menolak tanpa gambar sampul", () => {
    expect(gagal({ ...artikel, url_gambar: "" })).toBe("Gambar sampul wajib diisi.");
  });

  it("menolak alamat gambar yang bukan /uploads atau http(s)", () => {
    expect(gagal({ ...artikel, url_gambar: "data:image/png;base64,AAAA" })).toBe(
      "Alamat gambar sampul tidak valid.",
    );
  });

  it("mengabaikan kolom yang tidak dikenal", () => {
    const hasil = validateBerita({ ...artikel, kategori: "PRESTASI", id_berita: 99 });
    expect(hasil.ok && Object.keys(hasil.data).sort()).toEqual(
      ["judul", "konten", "sumber", "tanggal", "url_artikel", "url_gambar"],
    );
  });

  it("menolak body kosong", () => {
    expect(gagal(undefined)).toBe("Judul wajib diisi.");
  });
});
