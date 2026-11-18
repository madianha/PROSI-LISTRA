import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Repository di-mock agar test tidak butuh database (SQL-nya diuji langsung ke PostgreSQL)
vi.mock("../src/repositories/acaraRepository", async (importOriginal) => {
  const asli = await importOriginal<typeof import("../src/repositories/acaraRepository")>();
  return {
    lengkapiAcara: asli.lengkapiAcara,
    listAcara: vi.fn(),
    listJadwalPublik: vi.fn(),
    getAcaraById: vi.fn(),
    createAcara: vi.fn(),
    updateAcara: vi.fn(),
    deleteAcara: vi.fn(),
    getStatusAnggota: vi.fn(),
    getAnggotaTerlibat: vi.fn(),
  };
});

import app from "../src/app";
import { signJwt } from "../src/controllers/authController";
import * as repo from "../src/repositories/acaraRepository";

const mocked = vi.mocked(repo);
const login = `Bearer ${signJwt({ id_anggota: 1, peran: "listra" }, "listra_dev_secret")}`;

const body = {
  tipe_acara: "job_external",
  nama_acara: "Resepsi Keluarga Wijaya",
  nama_klien: "Bapak Wijaya",
  lokasi: "Hotel Savoy Homann",
  is_privat: true,
  acara_pj: [2],
  acara_jasa: [
    { tanggal: "2026-12-12", jam_mulai: "16:00", jam_selesai: "18:00", id_jasa: 3, acara_performer: [{ id_anggota: 7 }, { nama_performer: "Rina" }] },
  ],
};

const aktif = (id_anggota: number, peran = "anggota", is_aktif = true) => ({ id_anggota, peran, is_aktif });

const acaraJadi = repo.lengkapiAcara({
  id_acara: 9,
  tipe_acara: "job_external",
  nama_acara: "Resepsi Keluarga Wijaya",
  nama_klien: "Bapak Wijaya",
  lokasi: "Hotel Savoy Homann",
  is_privat: true,
  acara_pj: [{ id_anggota: 2, nama: "Bagas", jabatan: "Koor Humas" }],
  acara_jasa: [],
});

beforeEach(() => {
  vi.resetAllMocks();
  mocked.getStatusAnggota.mockResolvedValue([aktif(2, "humas"), aktif(7, "alumni")]);
  mocked.getAnggotaTerlibat.mockResolvedValue([]);
});

describe("lengkapiAcara (field turunan)", () => {
  it("menghitung rentang tanggal dan kecukupan; jasa Tidak Spesifik & hari tanpa jasa tidak dihitung", () => {
    const performer = (n: number) => Array.from({ length: n }, (_, i) => ({ id_acara_performer: i, id_anggota: i, nama_performer: null, anggota: null }));
    const jasa = (min: number) => ({ id_jasa: 1, nama: "Tari", tipe_jasa: "tari", min_performer: min, is_aktif: true, kecocokan: [] });
    const a = repo.lengkapiAcara({
      id_acara: 1,
      tipe_acara: "listra",
      nama_acara: "Pagelaran",
      acara_pj: [],
      acara_jasa: [
        { tanggal: "2026-12-13", jasa: jasa(5), is_tidak_spesifik: false, acara_performer: performer(3) },
        { tanggal: "2026-12-12", jasa: jasa(2), is_tidak_spesifik: false, acara_performer: performer(4) }, // lebih tidak menutup kekurangan lain
        { tanggal: "2026-12-14", jasa: jasa(8), is_tidak_spesifik: true, acara_performer: [] },
        { tanggal: "2026-12-15", jasa: null, is_tidak_spesifik: false, acara_performer: [] },
      ],
    });
    expect(a.tanggal_mulai).toBe("2026-12-12");
    expect(a.tanggal_selesai).toBe("2026-12-15");
    expect(a.kecukupan).toEqual({ terisi: 5, dibutuhkan: 7, kurang: 2 });
  });
});

describe("/api/acara wajib login", () => {
  it.each([
    ["get", "/api/acara"],
    ["get", "/api/acara/1"],
    ["post", "/api/acara"],
    ["put", "/api/acara/1"],
    ["delete", "/api/acara/1"],
  ])("%s %s tanpa token = 401", async (method, url) => {
    const res = await (request(app) as any)[method](url).send(body);
    expect(res.status).toBe(401);
    expect(mocked.listAcara).not.toHaveBeenCalled();
    expect(mocked.createAcara).not.toHaveBeenCalled();
  });
});

describe("GET /api/acara", () => {
  it("meneruskan rentang dari/sampai ke repository", async () => {
    mocked.listAcara.mockResolvedValue([acaraJadi]);
    const res = await request(app).get("/api/acara?dari=2026-11-30&sampai=2027-01-10").set("Authorization", login);
    expect(res.status).toBe(200);
    expect(res.body[0].nama_klien).toBe("Bapak Wijaya");
    expect(mocked.listAcara).toHaveBeenCalledWith({ dari: "2026-11-30", sampai: "2027-01-10" });
  });

  it.each(["dari=2026-13-01", "dari=2026-12-10&sampai=2026-12-01"])("rentang salah (%s) = 400", async (qs) => {
    const res = await request(app).get(`/api/acara?${qs}`).set("Authorization", login);
    expect(res.status).toBe(400);
    expect(mocked.listAcara).not.toHaveBeenCalled();
  });
});

describe("GET /api/acara/:id", () => {
  it("event tidak ada = 404", async () => {
    mocked.getAcaraById.mockResolvedValue(null);
    const res = await request(app).get("/api/acara/99").set("Authorization", login);
    expect(res.status).toBe(404);
  });

  it("id bukan angka = 404 tanpa query", async () => {
    const res = await request(app).get("/api/acara/abc").set("Authorization", login);
    expect(res.status).toBe(404);
    expect(mocked.getAcaraById).not.toHaveBeenCalled();
  });
});

describe("POST /api/acara", () => {
  it("menyimpan event yang valid", async () => {
    mocked.createAcara.mockResolvedValue(acaraJadi);
    const res = await request(app).post("/api/acara").set("Authorization", login).send(body);
    expect(res.status).toBe(201);
    expect(res.body.id_acara).toBe(9);
    expect(mocked.getStatusAnggota).toHaveBeenCalledWith([2, 7]);
    expect(mocked.createAcara.mock.calls[0][0].acara_jasa[0].acara_performer).toEqual([
      { id_anggota: 7, nama_performer: null },
      { id_anggota: null, nama_performer: "Rina" },
    ]);
  });

  it("payload salah = 400 tanpa menyentuh database", async () => {
    const res = await request(app).post("/api/acara").set("Authorization", login).send({ ...body, acara_pj: [] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/minimal satu PJ/);
    expect(mocked.getStatusAnggota).not.toHaveBeenCalled();
    expect(mocked.createAcara).not.toHaveBeenCalled();
  });

  it.each([
    [[aktif(2, "alumni"), aktif(7)], /PJ harus anggota Kepengurusan/],
    [[aktif(2, "admin"), aktif(7)], /PJ harus anggota Kepengurusan/],
    [[aktif(2, "humas", false), aktif(7)], /PJ harus anggota Kepengurusan/],
    [[aktif(7)], /PJ yang dipilih tidak ditemukan/],
    [[aktif(2, "humas"), aktif(7, "anggota", false)], /Performer harus anggota aktif/],
    [[aktif(2, "humas"), aktif(7, "admin")], /Performer harus anggota aktif/],
    [[aktif(2, "humas")], /Performer yang dipilih tidak ditemukan/],
  ])("anggota tidak memenuhi syarat (%o) = 400", async (status, pesan) => {
    mocked.getStatusAnggota.mockResolvedValue(status);
    const res = await request(app).post("/api/acara").set("Authorization", login).send(body);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(pesan);
    expect(mocked.createAcara).not.toHaveBeenCalled();
  });

  it("jasa tidak ada (FK) = 400", async () => {
    mocked.createAcara.mockRejectedValue({ code: "23503" });
    const res = await request(app).post("/api/acara").set("Authorization", login).send(body);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/tidak ditemukan/);
  });
});

describe("PUT /api/acara/:id", () => {
  it("anggota yang sudah tercatat di event ini tidak dicek ulang (boleh sudah nonaktif)", async () => {
    mocked.getAnggotaTerlibat.mockResolvedValue([7]);
    mocked.getStatusAnggota.mockResolvedValue([aktif(2, "humas")]);
    mocked.updateAcara.mockResolvedValue(acaraJadi);

    const res = await request(app).put("/api/acara/9").set("Authorization", login).send(body);

    expect(res.status).toBe(200);
    expect(mocked.getAnggotaTerlibat).toHaveBeenCalledWith(9);
    expect(mocked.getStatusAnggota).toHaveBeenCalledWith([2]);
  });

  it("event tidak ada = 404", async () => {
    mocked.updateAcara.mockResolvedValue(null);
    const res = await request(app).put("/api/acara/99").set("Authorization", login).send(body);
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/acara/:id", () => {
  it("terhapus = 204, tidak ada = 404", async () => {
    mocked.deleteAcara.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    expect((await request(app).delete("/api/acara/9").set("Authorization", login)).status).toBe(204);
    expect((await request(app).delete("/api/acara/9").set("Authorization", login)).status).toBe(404);
  });
});

describe("GET /api/jadwal (publik)", () => {
  it("tanpa login, memakai query publik (bukan listAcara)", async () => {
    mocked.listJadwalPublik.mockResolvedValue([]);
    const res = await request(app).get("/api/jadwal?dari=2026-12-01&sampai=2026-12-31");
    expect(res.status).toBe(200);
    expect(mocked.listJadwalPublik).toHaveBeenCalledWith({ dari: "2026-12-01", sampai: "2026-12-31" });
    expect(mocked.listAcara).not.toHaveBeenCalled();
  });
});
