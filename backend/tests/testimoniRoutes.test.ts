import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Repository di-mock agar test tidak butuh database
vi.mock("../src/repositories/testimoniRepository", () => ({
  listPublik: vi.fn(),
  listSemua: vi.fn(),
  createTestimoni: vi.fn(),
  setStatus: vi.fn(),
  setAktif: vi.fn(),
  deleteTestimoni: vi.fn(),
}));

import app from "../src/app";
import { signJwt } from "../src/controllers/authController";
import * as repo from "../src/repositories/testimoniRepository";

const mocked = vi.mocked(repo);
const login = `Bearer ${signJwt({ id_anggota: 1, peran: "humas" }, "listra_dev_secret")}`;

const baris = {
  id_testimoni: 1,
  nama_klien: "Ibu Ratna",
  instansi: "PT Nusantara",
  nama_acara: "Gala Dinner",
  is_acara_privat: false,
  isi_testimoni: "Penampilannya memukau.",
  rating: 5,
  tanggal_input: "2026-11-01T10:00:00.000Z",
  status: "disetujui",
  sumber: "web",
  is_aktif: true,
};

const body = { nama_klien: "Ibu Ratna", isi_testimoni: "Penampilannya memukau.", rating: 5 };

beforeEach(() => vi.clearAllMocks());

describe("GET /api/testimoni (publik)", () => {
  it("mengembalikan testimoni yang tampil, tanpa login", async () => {
    mocked.listPublik.mockResolvedValue([baris]);
    const res = await request(app).get("/api/testimoni");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([baris]);
  });
});

describe("POST /api/testimoni", () => {
  it("pengunjung: selalu menunggu, sumber web, tidak tampil, walau body mencoba mengubahnya", async () => {
    mocked.createTestimoni.mockResolvedValue({ ...baris, status: "menunggu", is_aktif: false });
    const res = await request(app)
      .post("/api/testimoni")
      .send({ ...body, status: "disetujui", is_aktif: true, sumber: "whatsapp" });

    expect(res.status).toBe(201);
    expect(mocked.createTestimoni).toHaveBeenCalledWith(expect.objectContaining({ nama_klien: "Ibu Ratna" }), {
      status: "menunggu",
      sumber: "web",
      is_aktif: false,
    });
  });

  it("pengurus login: langsung disetujui dan boleh memilih sumber whatsapp", async () => {
    mocked.createTestimoni.mockResolvedValue(baris);
    const res = await request(app)
      .post("/api/testimoni")
      .set("Authorization", login)
      .send({ ...body, sumber: "whatsapp" });

    expect(res.status).toBe(201);
    expect(mocked.createTestimoni).toHaveBeenCalledWith(expect.anything(), {
      status: "disetujui",
      sumber: "whatsapp",
      is_aktif: true,
    });
  });

  it.each([
    [{ ...body, nama_klien: "  " }, "Nama wajib diisi."],
    [{ ...body, isi_testimoni: "" }, "Isi testimoni wajib diisi."],
    [{ ...body, rating: 6 }, "Rating harus 1 sampai 5."],
    [{ ...body, rating: 2.5 }, "Rating harus 1 sampai 5."],
    [{ ...body, nama_klien: "a".repeat(101) }, "Nama maksimal 100 karakter."],
  ])("menolak data tidak valid (%#)", async (kirim, pesan) => {
    const res = await request(app).post("/api/testimoni").send(kirim);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe(pesan);
    expect(mocked.createTestimoni).not.toHaveBeenCalled();
  });

  it("rating boleh kosong", async () => {
    mocked.createTestimoni.mockResolvedValue({ ...baris, rating: null });
    const res = await request(app).post("/api/testimoni").send({ ...body, rating: null });
    expect(res.status).toBe(201);
    expect(mocked.createTestimoni).toHaveBeenCalledWith(expect.objectContaining({ rating: null }), expect.anything());
  });
});

describe("route internal wajib login", () => {
  it.each([
    ["get", "/api/testimoni/semua"],
    ["patch", "/api/testimoni/1/status"],
    ["patch", "/api/testimoni/1/aktif"],
    ["delete", "/api/testimoni/1"],
  ] as const)("%s %s tanpa login = 401", async (method, url) => {
    const res = await request(app)[method](url).send({});
    expect(res.status).toBe(401);
  });

  it("token palsu = 401", async () => {
    const palsu = signJwt({ id_anggota: 1, peran: "admin" }, "bukan-rahasia-server");
    const res = await request(app).get("/api/testimoni/semua").set("Authorization", `Bearer ${palsu}`);
    expect(res.status).toBe(401);
  });

  it("GET /semua dengan login", async () => {
    mocked.listSemua.mockResolvedValue([baris]);
    const res = await request(app).get("/api/testimoni/semua").set("Authorization", login);
    expect(res.status).toBe(200);
  });
});

describe("PATCH status / aktif, DELETE", () => {
  it("mengubah status", async () => {
    mocked.setStatus.mockResolvedValue({ ...baris, status: "ditolak", is_aktif: false });
    const res = await request(app)
      .patch("/api/testimoni/1/status")
      .set("Authorization", login)
      .send({ status: "ditolak" });
    expect(res.status).toBe(200);
    expect(mocked.setStatus).toHaveBeenCalledWith(1, "ditolak");
  });

  it("menolak status yang tidak dikenal", async () => {
    const res = await request(app)
      .patch("/api/testimoni/1/status")
      .set("Authorization", login)
      .send({ status: "publik" });
    expect(res.status).toBe(400);
  });

  it("tidak bisa menampilkan testimoni yang belum disetujui", async () => {
    mocked.setAktif.mockResolvedValue("belum_disetujui");
    const res = await request(app)
      .patch("/api/testimoni/1/aktif")
      .set("Authorization", login)
      .send({ is_aktif: true });
    expect(res.status).toBe(400);
  });

  it("404 bila testimoni tidak ada", async () => {
    mocked.setAktif.mockResolvedValue(null);
    const res = await request(app)
      .patch("/api/testimoni/99/aktif")
      .set("Authorization", login)
      .send({ is_aktif: false });
    expect(res.status).toBe(404);
  });

  it("menghapus", async () => {
    mocked.deleteTestimoni.mockResolvedValue(true);
    const res = await request(app).delete("/api/testimoni/1").set("Authorization", login);
    expect(res.status).toBe(204);
  });
});
