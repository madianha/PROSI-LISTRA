import { describe, expect, it } from "vitest";
import { extractUnparEmail, normalizeYear } from "./anggota";

describe("normalizeYear", () => {
  it("mengembalikan null untuk nilai falsy atau kosong", () => {
    expect(normalizeYear(null)).toBeNull();
    expect(normalizeYear(undefined)).toBeNull();
    expect(normalizeYear("")).toBeNull();
  });

  it("menormalkan tahun 2 digit menjadi 4 digit (2000 + val)", () => {
    expect(normalizeYear(23)).toBe(2023);
    expect(normalizeYear("23")).toBe(2023);
    expect(normalizeYear("19")).toBe(2019);
  });

  it("mempertahankan tahun yang sudah 4 digit tanpa prefix ganda", () => {
    expect(normalizeYear(2023)).toBe(2023);
    expect(normalizeYear("2023")).toBe(2023);
    expect(normalizeYear(1998)).toBe(1998);
  });
});

describe("extractUnparEmail", () => {
  it("mengembalikan null untuk format email non-unpar", () => {
    expect(extractUnparEmail("budi@gmail.com")).toBeNull();
    expect(extractUnparEmail("")).toBeNull();
    expect(extractUnparEmail(null)).toBeNull();
    expect(extractUnparEmail("budi@student.unpar.ac.id")).toBeNull();
  });

  it("berhasil mengekstrak NPM dan Angkatan untuk student unpar", () => {
    const res = extractUnparEmail("6182301002@student.unpar.ac.id");
    expect(res).not.toBeNull();
    expect(res.npm).toBe("6182301002");
    expect(res.angkatan).toBe(23);
  });

  it("menangani case insensitive", () => {
    const res = extractUnparEmail("6182101050@STUDENT.UNPAR.AC.ID");
    expect(res).not.toBeNull();
    expect(res.npm).toBe("6182101050");
    expect(res.angkatan).toBe(21);
  });
});
