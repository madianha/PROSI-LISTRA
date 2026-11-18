import { describe, expect, it } from "vitest";
import { tokenMasihBerlaku } from "./sesiLogin";

// token palsu berbentuk JWT; tanda tangannya tidak dicek di browser (backend yang memeriksa)
const token = (isi) => `x.${btoa(JSON.stringify(isi)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_")}.y`;
const sekarang = Date.parse("2026-11-18T10:00:00Z");

describe("tokenMasihBerlaku", () => {
  it("token yang belum kedaluwarsa = berlaku", () => {
    expect(tokenMasihBerlaku(token({ id_anggota: 2, exp: sekarang / 1000 + 3600 }), sekarang)).toBe(true);
  });

  it.each([
    ["tidak ada token", null],
    ["kosong", ""],
    ["kedaluwarsa", token({ id_anggota: 2, exp: sekarang / 1000 - 1 })],
    ["tanpa exp", token({ id_anggota: 2 })],
    ["bukan JWT", "acak"],
  ])("%s = tidak berlaku", (_, t) => {
    expect(tokenMasihBerlaku(t, sekarang)).toBe(false);
  });
});
