import { describe, expect, it } from "vitest";
import { extractUnparEmail } from "./anggota";

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
