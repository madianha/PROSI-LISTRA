import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import app from "../src/app";
import { pool } from "../src/db";
import { signJwt } from "../src/controllers/authController";

vi.mock("../src/db", () => ({ pool: { query: vi.fn(), connect: vi.fn() } }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(pool.query).mockResolvedValue({ rows: [], rowCount: 0 } as any);
});

const palsu = `Bearer ${signJwt({ id_anggota: 1, peran: "admin" }, "bukan-rahasia-server")}`;

// Semua route panel internal: tanpa login = 401 dan database tidak disentuh
const INTERNAL: [string, string][] = [
  ["get", "/api/anggota"],
  ["get", "/api/anggota/1"],
  ["get", "/api/anggota/spesialisasi"],
  ["post", "/api/anggota"],
  ["put", "/api/anggota/1"],
  ["patch", "/api/anggota/1/status"],
  ["post", "/api/berita"],
  ["put", "/api/berita/1"],
  ["patch", "/api/berita/1/publik"],
  ["delete", "/api/berita/1"],
  ["put", "/api/kontak"],
  ["post", "/api/upload"],
  ["get", "/api/acara"],
  ["post", "/api/acara"],
  ["post", "/api/jasa"],
  ["patch", "/api/jasa/1/status"],
  ["post", "/api/alat-musik"],
  ["get", "/api/testimoni/semua"],
  ["patch", "/api/testimoni/1/status"],
];

describe("route panel internal wajib login", () => {
  it.each(INTERNAL)("%s %s tanpa token = 401", async (method, url) => {
    const res = await (request(app) as any)[method](url).send({});
    expect(res.status).toBe(401);
    expect(pool.query).not.toHaveBeenCalled();
    expect(pool.connect).not.toHaveBeenCalled();
  });

  it("token palsu = 401", async () => {
    const res = await request(app).get("/api/anggota").set("Authorization", palsu);
    expect(res.status).toBe(401);
  });

  it("token kedaluwarsa (berlaku 24 jam) = 401", async () => {
    const token = `Bearer ${signJwt({ id_anggota: 1, peran: "admin" }, "listra_dev_secret")}`;
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + 2 * 24 * 60 * 60 * 1000);
    try {
      const res = await request(app).get("/api/anggota").set("Authorization", token);
      expect(res.status).toBe(401);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("halaman publik tetap terbuka tanpa login", () => {
  it.each(["/api/jasa", "/api/provinsi", "/api/berita", "/api/testimoni", "/api/kontak", "/api/jadwal", "/api/alat-musik"])(
    "GET %s bukan 401",
    async (url) => {
      const res = await request(app).get(url);
      expect(res.status).not.toBe(401);
    },
  );

  it("GET /api/berita?semua=1 tanpa login tidak menampilkan draf", async () => {
    await request(app).get("/api/berita?semua=1");
    const [sql] = vi.mocked(pool.query).mock.calls[0];
    expect(String(sql)).toMatch(/is_publik/);
  });
});
