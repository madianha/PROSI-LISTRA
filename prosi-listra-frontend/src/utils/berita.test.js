import { describe, expect, it } from "vitest";
import { formatTanggal, isKontenKosong, jenisBerita, toPayload, validateBeritaForm } from "./berita";

const artikel = {
  judul: "Persiapan Gelar Karya",
  tanggal: "2026-10-10",
  url_gambar: "/uploads/sampul.jpg",
  konten: "<p>Latihan dimulai.</p>",
  sumber: "",
  url_artikel: "",
};

const tautan = {
  judul: "LISTRA Juara 1",
  tanggal: "2023-12-01",
  url_gambar: "/uploads/sampul.jpg",
  konten: "",
  sumber: "unpar.ac.id",
  url_artikel: "https://unpar.ac.id/listra-juara",
};

describe("jenisBerita", () => {
  it("tautan bila url_artikel terisi", () => {
    expect(jenisBerita({ url_artikel: "https://unpar.ac.id" })).toBe("tautan");
  });

  it("artikel bila url_artikel null", () => {
    expect(jenisBerita({ url_artikel: null })).toBe("artikel");
  });
});

describe("formatTanggal", () => {
  it.each([
    ["2026-10-10", "10 Okt 2026"],
    ["2023-03-01", "1 Mar 2023"],
    ["2024-08-27", "27 Agu 2024"],
  ])("%s -> %s", (input, hasil) => {
    expect(formatTanggal(input)).toBe(hasil);
  });

  it("string kosong untuk input tidak valid", () => {
    expect(formatTanggal("")).toBe("");
    expect(formatTanggal(undefined)).toBe("");
  });
});

describe("isKontenKosong", () => {
  it.each(["", "<p></p>", "<p>&nbsp;</p>", "<p> <br></p>"])("kosong: %j", (html) => {
    expect(isKontenKosong(html)).toBe(true);
  });

  it("tidak kosong bila ada teks atau gambar", () => {
    expect(isKontenKosong("<p>Halo</p>")).toBe(false);
    expect(isKontenKosong('<p><img src="/uploads/a.jpg"></p>')).toBe(false);
  });
});

describe("validateBeritaForm", () => {
  it("artikel valid tidak punya error", () => {
    expect(validateBeritaForm(artikel, "artikel")).toEqual({});
  });

  it("tautan valid tidak punya error", () => {
    expect(validateBeritaForm(tautan, "tautan")).toEqual({});
  });

  it("menandai semua kolom wajib artikel yang kosong", () => {
    const errors = validateBeritaForm(
      { judul: " ", tanggal: "", url_gambar: "", konten: "<p></p>" },
      "artikel",
    );
    expect(Object.keys(errors).sort()).toEqual(["judul", "konten", "tanggal", "url_gambar"]);
  });

  it("artikel tidak mengecek sumber dan url_artikel", () => {
    const errors = validateBeritaForm({ ...artikel, sumber: "", url_artikel: "" }, "artikel");
    expect(errors).toEqual({});
  });

  it("menandai sumber dan url_artikel tautan yang kosong", () => {
    const errors = validateBeritaForm({ ...tautan, sumber: "", url_artikel: "" }, "tautan");
    expect(errors).toEqual({ sumber: "Sumber wajib diisi.", url_artikel: "URL artikel wajib diisi." });
  });

  it("menolak url_artikel tanpa http(s)", () => {
    const errors = validateBeritaForm({ ...tautan, url_artikel: "unpar.ac.id/listra" }, "tautan");
    expect(errors.url_artikel).toBe("URL harus diawali http:// atau https://.");
  });
});

describe("toPayload", () => {
  it("artikel: hanya kolom tabel, sumber & url_artikel null", () => {
    expect(toPayload({ ...artikel, judul: "  Judul  " }, "artikel")).toEqual({
      judul: "Judul",
      tanggal: "2026-10-10",
      url_gambar: "/uploads/sampul.jpg",
      konten: "<p>Latihan dimulai.</p>",
      sumber: null,
      url_artikel: null,
    });
  });

  it("tautan: konten null", () => {
    expect(toPayload({ ...tautan, konten: "<p>sisa ketikan</p>" }, "tautan")).toEqual({
      judul: "LISTRA Juara 1",
      tanggal: "2023-12-01",
      url_gambar: "/uploads/sampul.jpg",
      konten: null,
      sumber: "unpar.ac.id",
      url_artikel: "https://unpar.ac.id/listra-juara",
    });
  });
});
