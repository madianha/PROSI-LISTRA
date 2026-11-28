import { describe, expect, it } from "vitest";
import {
  daftarTanggal,
  formatBulan,
  formatJam,
  formatRentang,
  formatTanggal,
  geserBulan,
  gridBulan,
  parseJam,
  rentangBulan,
  selisihHari,
  teksKecukupan,
} from "./kalender";

describe("utils kalender", () => {
  it("rentangBulan: tanggal pertama dan terakhir, termasuk Februari kabisat", () => {
    expect(rentangBulan({ tahun: 2026, bulan: 12 })).toEqual({ dari: "2026-12-01", sampai: "2026-12-31" });
    expect(rentangBulan({ tahun: 2028, bulan: 2 })).toEqual({ dari: "2028-02-01", sampai: "2028-02-29" });
  });

  it("geserBulan melewati pergantian tahun", () => {
    expect(geserBulan({ tahun: 2026, bulan: 12 }, 1)).toEqual({ tahun: 2027, bulan: 1 });
    expect(geserBulan({ tahun: 2026, bulan: 1 }, -1)).toEqual({ tahun: 2025, bulan: 12 });
  });

  it("gridBulan: minggu dimulai Senin, lengkap 7 kolom", () => {
    const grid = gridBulan({ tahun: 2026, bulan: 12 }); // 1 Des 2026 = Selasa
    expect(grid[0]).toEqual({ tanggal: "2026-11-30", diBulanIni: false });
    expect(grid[1]).toEqual({ tanggal: "2026-12-01", diBulanIni: true });
    expect(grid.length % 7).toBe(0);
    expect(grid[grid.length - 1].tanggal).toBe("2027-01-03"); // Minggu setelah 31 Des
  });

  it("daftarTanggal & selisihHari menghitung hari secara inklusif tanpa bergeser zona waktu", () => {
    expect(daftarTanggal("2026-12-30", "2027-01-02")).toEqual(["2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02"]);
    expect(daftarTanggal("2026-12-12", "2026-12-12")).toEqual(["2026-12-12"]);
    expect(daftarTanggal("2026-12-13", "2026-12-12")).toEqual([]);
    expect(selisihHari("2026-12-01", "2026-12-14")).toBe(13);
  });

  it("format tanggal, bulan, rentang, dan jam dalam bahasa Indonesia", () => {
    expect(formatTanggal("2026-12-12")).toBe("Sab, 12 Des 2026");
    expect(formatBulan({ tahun: 2026, bulan: 12 })).toBe("Desember 2026");
    expect(formatRentang("2026-12-12", "2026-12-12")).toBe("12 Des 2026");
    expect(formatRentang("2026-12-12", "2026-12-13")).toBe("12–13 Des 2026");
    expect(formatRentang("2026-11-30", "2026-12-02")).toBe("30 Nov – 2 Des 2026");
    expect(formatRentang("2026-12-31", "2027-01-01")).toBe("31 Des 2026 – 1 Jan 2027");
    expect(formatJam("16:00")).toBe("16.00");
  });

  it("parseJam: ketikan jam 24 jam jadi HH:MM, selain jam yang sah jadi kosong", () => {
    for (const teks of ["16.00", "16:00", "1600", "16", " 16.00 "]) expect(parseJam(teks)).toBe("16:00");
    expect(parseJam("9.30")).toBe("09:30");
    expect(parseJam("930")).toBe("09:30");
    expect(parseJam("0")).toBe("00:00");
    expect(parseJam("23.59")).toBe("23:59");
    for (const teks of ["24.00", "7.75", "16.", "4 PM", "abc", "", null]) expect(parseJam(teks)).toBe("");
  });

  it("teksKecukupan: kurang, cukup, atau tidak perlu performer", () => {
    expect(teksKecukupan({ terisi: 3, dibutuhkan: 5 })).toBe("3 / 5 · kurang 2");
    expect(teksKecukupan({ terisi: 5, dibutuhkan: 5 })).toBe("5 / 5 · cukup");
    expect(teksKecukupan({ terisi: 0, dibutuhkan: 0 })).toBeNull();
  });
});
