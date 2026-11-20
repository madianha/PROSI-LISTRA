import { describe, expect, it } from "vitest";
import { cocokkanHeader, pecahTeks } from "./tabelTempel";

describe("pecahTeks", () => {
  it("salinan dari Google Sheets / Excel (dipisah tab)", () => {
    expect(pecahTeks("Sari\tsari@x.id\t6182301001\nBudi\tbudi@x.id\t\n")).toEqual([
      ["Sari", "sari@x.id", "6182301001"],
      ["Budi", "budi@x.id", ""],
    ]);
  });

  it("CSV dengan tanda kutip, koma di dalam kutip, dan baris Windows", () => {
    expect(pecahTeks('nama,jabatan\r\n"Sari, S.Sn",Ketua\r\n"Budi ""B""",Anggota')).toEqual([
      ["nama", "jabatan"],
      ["Sari, S.Sn", "Ketua"],
      ['Budi "B"', "Anggota"],
    ]);
  });

  it("CSV dengan titik koma (Excel bahasa Indonesia)", () => {
    expect(pecahTeks("Sari;sari@x.id")).toEqual([["Sari", "sari@x.id"]]);
  });

  it("teks kosong = tidak ada baris", () => {
    expect(pecahTeks("")).toEqual([]);
  });
});

describe("cocokkanHeader", () => {
  it("mengenali judul kolom berupa label maupun nama kolom database, urutan bebas", () => {
    expect(cocokkanHeader(["Email", "Nama", "angkatan_unpar", "Lainnya"])).toEqual(["email", "nama", "angkatan_unpar", null]);
    expect(cocokkanHeader(["NAMA *", "Penari", "is_aktif"])).toEqual(["nama", "is_penari", "is_aktif"]);
  });

  it("baris data biasa bukan header", () => {
    expect(cocokkanHeader(["Sari", "sari@x.id", "6182301001"])).toBeNull();
  });
});
