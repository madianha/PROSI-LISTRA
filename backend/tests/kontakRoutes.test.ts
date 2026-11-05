import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import kontakRoutes from "../src/routes/kontakRoutes";
import * as kontakRepository from "../src/repositories/kontakRepository";

vi.mock("../src/repositories/kontakRepository", () => ({
  getKontak: vi.fn(),
  updateKontak: vi.fn(),
}));

describe("Kontak Routes with ERD v5 kontak_whatsapp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const app = express();
  app.use(express.json());
  app.use("/api/kontak", kontakRoutes);

  it("GET /api/kontak returns 200 and kontak data mapped to ERD v5 columns", async () => {
    vi.mocked(kontakRepository.getKontak).mockResolvedValue({
      id_kontak: 1,
      id: 1,
      nomor_tujuan: "6281234567890",
      nomor_wa: "6281234567890",
      no_telepon: "6281234567890",
      nomor_whatsapp: "6281234567890",
      template_pesan: "Halo Admin LISTRA",
    });

    const res = await request(app).get("/api/kontak");
    expect(res.status).toBe(200);
    expect(res.body.nomor_tujuan).toBe("6281234567890");
    expect(res.body.nomor_wa).toBe("6281234567890");
  });

  it("PUT /api/kontak updates successfully", async () => {
    vi.mocked(kontakRepository.updateKontak).mockResolvedValue({
      id_kontak: 1,
      id: 1,
      nomor_tujuan: "6289999999999",
      nomor_wa: "6289999999999",
      no_telepon: "6289999999999",
      nomor_whatsapp: "6289999999999",
      template_pesan: "Pesan baru",
    });

    const res = await request(app)
      .put("/api/kontak")
      .send({ nomor_wa: "6289999999999", template_pesan: "Pesan baru" });

    expect(res.status).toBe(200);
    expect(res.body.nomor_tujuan).toBe("6289999999999");
  });
});
