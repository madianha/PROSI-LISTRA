import { describe, expect, it, vi } from "vitest";
import { pantauSesi, tokenMasihBerlaku } from "./sesiLogin";

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

describe("pantauSesi", () => {
  const jendelaPalsu = (pathname, status) => ({
    fetch: vi.fn().mockResolvedValue({ status }),
    location: { pathname, assign: vi.fn() },
  });

  it("401 dari /api di halaman /internal = sesi dibersihkan, pindah ke login dengan pesan", async () => {
    vi.stubGlobal("localStorage", { removeItem: vi.fn() });
    const w = jendelaPalsu("/internal/anggota", 401);
    pantauSesi(w);
    await w.fetch("/api/anggota");
    expect(localStorage.removeItem).toHaveBeenCalledWith("listra_token");
    expect(w.location.assign).toHaveBeenCalledWith("/internal/login?alasan=belum-login");
    vi.unstubAllGlobals();
  });

  it.each([
    ["halaman publik", "/testimoni", 401, "/api/testimoni"],
    ["login gagal (salah sandi)", "/internal/login", 401, "/api/auth/login"],
    ["balasan bukan 401", "/internal/anggota", 500, "/api/anggota"],
  ])("%s: tidak dipindahkan", async (_, path, status, url) => {
    const w = jendelaPalsu(path, status);
    pantauSesi(w);
    await w.fetch(url);
    expect(w.location.assign).not.toHaveBeenCalled();
  });
});
