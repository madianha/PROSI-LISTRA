import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cancelAcara, createAcara, listAcara, listJadwal } from "./acara";

const ok = (body, status = 200) => new Response(body === null ? null : JSON.stringify(body), { status });

// Node 22+ punya localStorage global sendiri (kosong tanpa --localstorage-file) yang menutupi milik jsdom
function storageMemori() {
  const isi = new Map();
  return {
    getItem: (k) => (isi.has(k) ? isi.get(k) : null),
    setItem: (k, v) => isi.set(k, String(v)),
    removeItem: (k) => isi.delete(k),
    clear: () => isi.clear(),
  };
}

beforeEach(() => {
  vi.stubGlobal("localStorage", storageMemori());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("api acara", () => {
  it("listAcara mengirim rentang tanggal dan token login", async () => {
    localStorage.setItem("listra_token", "tok-1");
    const fetchMock = vi.fn().mockResolvedValue(ok([]));
    vi.stubGlobal("fetch", fetchMock);

    await listAcara({ dari: "2026-11-30", sampai: "2027-01-10" });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/acara?dari=2026-11-30&sampai=2027-01-10");
    expect(options.headers.Authorization).toBe("Bearer tok-1");
  });

  it("listJadwal publik tanpa token dan tanpa rentang", async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok([]));
    vi.stubGlobal("fetch", fetchMock);

    await listJadwal();

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/jadwal");
    expect(options.headers.Authorization).toBeUndefined();
  });

  it("createAcara mengirim JSON; pesan validasi server diteruskan", async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok({ message: "Nama event wajib diisi." }, 400));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createAcara({ nama_acara: "" })).rejects.toThrow("Nama event wajib diisi.");
    const [, options] = fetchMock.mock.calls[0];
    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(options.body)).toEqual({ nama_acara: "" });
  });

  it("cancelAcara mengirim PATCH /cancel dengan alasan opsional", async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok({ id_acara: 9, status: "dibatalkan", alasan_batal: "Jadwal berubah" }));
    vi.stubGlobal("fetch", fetchMock);

    const hasil = await cancelAcara(9, "  Jadwal berubah  ");
    expect(hasil.status).toBe("dibatalkan");
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/acara/9/cancel");
    expect(options.method).toBe("PATCH");
    expect(JSON.parse(options.body)).toEqual({ alasan_batal: "Jadwal berubah" });
  });

  it("server mati: pesan bahasa Indonesia", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(listJadwal()).rejects.toThrow("Tidak bisa terhubung ke server. Coba lagi nanti.");
  });
});
