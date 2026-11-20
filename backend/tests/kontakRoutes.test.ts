import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import kontakRoutes from "../src/routes/kontakRoutes";
import { signJwt } from "../src/controllers/authController";
import * as kontakRepository from "../src/repositories/kontakRepository";

// semua route di file ini butuh login, kecuali yang menguji 401
const LOGIN = `Bearer ${signJwt({ id_anggota: 2, peran: "listra" }, "listra_dev_secret")}`;

vi.mock("../src/repositories/kontakRepository", () => ({
  getKontak: vi.fn(),
  simpanKontak: vi.fn(),
}));

describe("Kontak Routes with nama_humas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const app = express();
  app.use(express.json());
  app.use("/api/kontak", kontakRoutes);

  it("GET /api/kontak returns 200 and nama_humas", async () => {
    vi.mocked(kontakRepository.getKontak).mockResolvedValue({
      id_kontak: 1,
      id: 1,
      nomor_tujuan: "6281234567890",
      nomor_wa: "6281234567890",
      no_telepon: "6281234567890",
      nomor_whatsapp: "6281234567890",
      nama_humas: "Bagas Nugroho",
      nama: "Bagas Nugroho",
      template_pesan: "Halo Admin LISTRA",
    });

    const res = await request(app).get("/api/kontak").set("Authorization", LOGIN);
    expect(res.status).toBe(200);
    expect(res.body.nomor_tujuan).toBe("6281234567890");
    expect(res.body.nama_humas).toBe("Bagas Nugroho");
    expect(res.body.nama).toBe("Bagas Nugroho");
  });

  const baris = {
    id_kontak: 1,
    id: 1,
    nomor_tujuan: "6289999999999",
    nomor_wa: "6289999999999",
    no_telepon: "6289999999999",
    nomor_whatsapp: "6289999999999",
    nama_humas: "Siti Rahma",
    nama: "Siti Rahma",
    template_pesan: "Halo, saya tertarik dengan {jasa}.",
  };
  const body = { nomor_wa: "+62 899-9999-9999", nama_humas: " Siti Rahma ", template_pesan: "Halo, saya tertarik dengan {jasa}." };

  it("PUT /api/kontak menyimpan kontak (nomor dirapikan jadi angka saja)", async () => {
    vi.mocked(kontakRepository.simpanKontak).mockResolvedValue(baris);
    const res = await request(app).put("/api/kontak").set("Authorization", LOGIN).send(body);
    expect(res.status).toBe(200);
    expect(res.body.nama_humas).toBe("Siti Rahma");
    expect(kontakRepository.simpanKontak).toHaveBeenCalledWith("6289999999999", "Siti Rahma", "Halo, saya tertarik dengan {jasa}.");
  });

  it("POST /api/kontak membuat kontak saat tabel masih kosong (201)", async () => {
    vi.mocked(kontakRepository.simpanKontak).mockResolvedValue(baris);
    const res = await request(app).post("/api/kontak").set("Authorization", LOGIN).send(body);
    expect(res.status).toBe(201);
    expect(res.body.nomor_wa).toBe("6289999999999");
  });

  it.each([
    [{ nomor_wa: "0812" }, /8-15 angka/],
    [{ nomor_wa: "62812abc4567" }, /8-15 angka/],
    [{ nama_humas: "  " }, /Nama Humas wajib/],
    [{ nama_humas: "x".repeat(101) }, /maksimal 100/],
    [{ template_pesan: "" }, /Template pesan wajib/],
  ])("menolak %o dengan pesan jelas, tanpa menyentuh database", async (ubah, pesan) => {
    const res = await request(app).post("/api/kontak").set("Authorization", LOGIN).send({ ...body, ...ubah });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(pesan);
    expect(kontakRepository.simpanKontak).not.toHaveBeenCalled();
  });

  it.each(["post", "put"])("%s tanpa login = 401", async (method) => {
    const res = await (request(app) as any)[method]("/api/kontak").send(body);
    expect(res.status).toBe(401);
  });
});
