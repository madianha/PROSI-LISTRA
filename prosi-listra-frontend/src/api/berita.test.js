import { afterEach, describe, expect, it, vi } from "vitest";
import { getBerita, listBerita } from "./berita";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("api berita", () => {
  it("server mati: pesan bahasa Indonesia, bukan 'Failed to fetch'", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(listBerita()).rejects.toThrow("Tidak bisa terhubung ke server. Coba lagi nanti.");
  });

  it("memakai pesan dari server bila ada", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "Berita tidak ditemukan." }), { status: 404 })),
    );
    await expect(getBerita(99)).rejects.toThrow("Berita tidak ditemukan.");
  });

  it("balasan bukan JSON (mis. 502 dari proxy): pesan umum", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>Bad Gateway</html>", { status: 502 })));
    await expect(listBerita()).rejects.toThrow("Terjadi kesalahan. Coba lagi.");
  });
});
