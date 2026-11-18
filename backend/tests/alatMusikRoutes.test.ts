import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Repository di-mock agar test tidak butuh database
vi.mock("../src/repositories/alatMusikRepository", () => ({
  listAlatMusik: vi.fn(),
  createAlatMusik: vi.fn(),
  updateAlatMusik: vi.fn(),
  deleteAlatMusik: vi.fn(),
}));

import app from "../src/app";
import { signJwt } from "../src/controllers/authController";
import * as repo from "../src/repositories/alatMusikRepository";

const mocked = vi.mocked(repo);
const login = `Bearer ${signJwt({ id_anggota: 2, peran: "listra" }, "listra_dev_secret")}`;
const kendang = { id_alat_musik: 1, nama_alat_musik: "Kendang", jumlah: 2 };

beforeEach(() => {
  vi.resetAllMocks();
});

describe("GET /api/alat-musik", () => {
  it("publik: daftar alat musik sesuai kolom tabel", async () => {
    mocked.listAlatMusik.mockResolvedValue([kendang]);
    const res = await request(app).get("/api/alat-musik");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([kendang]);
  });
});

describe("tulis tanpa login = 401", () => {
  it.each([
    ["post", "/api/alat-musik"],
    ["put", "/api/alat-musik/1"],
    ["delete", "/api/alat-musik/1"],
  ])("%s %s", async (method, url) => {
    const res = await (request(app) as any)[method](url).send({ nama_alat_musik: "Suling", jumlah: 1 });
    expect(res.status).toBe(401);
    expect(mocked.createAlatMusik).not.toHaveBeenCalled();
    expect(mocked.updateAlatMusik).not.toHaveBeenCalled();
    expect(mocked.deleteAlatMusik).not.toHaveBeenCalled();
  });
});

describe("POST /api/alat-musik", () => {
  it("menyimpan nama yang sudah dirapikan; jumlah kosong = 1 (DEFAULT kolom)", async () => {
    mocked.createAlatMusik.mockResolvedValue({ id_alat_musik: 9, nama_alat_musik: "Suling", jumlah: 1 });
    const res = await request(app).post("/api/alat-musik").set("Authorization", login).send({ nama_alat_musik: "  Suling " });
    expect(res.status).toBe(201);
    expect(mocked.createAlatMusik).toHaveBeenCalledWith({ nama_alat_musik: "Suling", jumlah: 1 });
  });

  it("jumlah berupa teks angka diterima", async () => {
    mocked.createAlatMusik.mockResolvedValue(kendang);
    await request(app).post("/api/alat-musik").set("Authorization", login).send({ nama_alat_musik: "Kendang", jumlah: "2" });
    expect(mocked.createAlatMusik).toHaveBeenCalledWith({ nama_alat_musik: "Kendang", jumlah: 2 });
  });

  it.each([
    [{ nama_alat_musik: " " }, /wajib diisi/],
    [{ nama_alat_musik: "x".repeat(51) }, /50 karakter/],
    [{ nama_alat_musik: "Gong", jumlah: 0 }, /minimal 1/],
    [{ nama_alat_musik: "Gong", jumlah: 1.5 }, /minimal 1/],
    [{ nama_alat_musik: "Gong", jumlah: "dua" }, /minimal 1/],
  ])("menolak %o", async (body, pesan) => {
    const res = await request(app).post("/api/alat-musik").set("Authorization", login).send(body);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(pesan);
    expect(mocked.createAlatMusik).not.toHaveBeenCalled();
  });

  it("nama sudah ada = 409", async () => {
    mocked.createAlatMusik.mockRejectedValue({ code: "23505" });
    const res = await request(app).post("/api/alat-musik").set("Authorization", login).send({ nama_alat_musik: "Kendang" });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/sudah ada/);
  });
});

describe("PUT /api/alat-musik/:id", () => {
  it("boleh hanya mengubah jumlah", async () => {
    mocked.updateAlatMusik.mockResolvedValue({ ...kendang, jumlah: 5 });
    const res = await request(app).put("/api/alat-musik/1").set("Authorization", login).send({ jumlah: 5 });
    expect(res.status).toBe(200);
    expect(mocked.updateAlatMusik).toHaveBeenCalledWith(1, { jumlah: 5 });
  });

  it("tanpa field yang diubah = 400", async () => {
    const res = await request(app).put("/api/alat-musik/1").set("Authorization", login).send({});
    expect(res.status).toBe(400);
    expect(mocked.updateAlatMusik).not.toHaveBeenCalled();
  });

  it("id tidak ada = 404", async () => {
    mocked.updateAlatMusik.mockResolvedValue(null);
    const res = await request(app).put("/api/alat-musik/99").set("Authorization", login).send({ jumlah: 2 });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/alat-musik/:id", () => {
  it("terhapus = 204, tidak ada = 404, id bukan angka = 404 tanpa query", async () => {
    mocked.deleteAlatMusik.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    expect((await request(app).delete("/api/alat-musik/1").set("Authorization", login)).status).toBe(204);
    expect((await request(app).delete("/api/alat-musik/1").set("Authorization", login)).status).toBe(404);
    expect((await request(app).delete("/api/alat-musik/abc").set("Authorization", login)).status).toBe(404);
    expect(mocked.deleteAlatMusik).toHaveBeenCalledTimes(2);
  });
});
