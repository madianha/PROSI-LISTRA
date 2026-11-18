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
  updateKontak: vi.fn(),
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

  it("PUT /api/kontak updates nama_humas successfully", async () => {
    vi.mocked(kontakRepository.updateKontak).mockResolvedValue({
      id_kontak: 1,
      id: 1,
      nomor_tujuan: "6289999999999",
      nomor_wa: "6289999999999",
      no_telepon: "6289999999999",
      nomor_whatsapp: "6289999999999",
      nama_humas: "Siti Rahma",
      nama: "Siti Rahma",
      template_pesan: "Pesan baru",
    });

    const res = await request(app)
      .put("/api/kontak").set("Authorization", LOGIN)
      .send({
        nomor_wa: "6289999999999",
        nama_humas: "Siti Rahma",
        template_pesan: "Pesan baru",
      });

    expect(res.status).toBe(200);
    expect(res.body.nama_humas).toBe("Siti Rahma");
    expect(kontakRepository.updateKontak).toHaveBeenCalledWith(
      "6289999999999",
      "Siti Rahma",
      "Pesan baru",
    );
  });
});
