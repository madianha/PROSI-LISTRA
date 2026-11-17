import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../src/app";
import { pool } from "../src/db";

vi.mock("../src/db", () => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn(),
  },
}));

describe("Jasa & Provinsi Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/provinsi", () => {
    it("mengembalikan daftar provinsi terurut berdasarkan pulau dan nama provinsi", async () => {
      const mockProvinsi = [
        { id_provinsi: 1, nama_provinsi: "Aceh", pulau: "Sumatera" },
        { id_provinsi: 13, nama_provinsi: "Jawa Barat", pulau: "Jawa" },
        { id_provinsi: 17, nama_provinsi: "Bali", pulau: "Bali & Nusa Tenggara" },
      ];
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: mockProvinsi, rowCount: 3 } as any);

      const res = await request(app).get("/api/provinsi");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockProvinsi);
      const [calledQuery] = vi.mocked(pool.query).mock.calls[0];
      expect(calledQuery).toContain("FROM provinsi");
      expect(calledQuery).toContain("ORDER BY");
    });
  });

  describe("GET /api/jasa", () => {
    it("secara bawaan (publik) hanya mengambil jasa yang aktif (is_aktif = TRUE)", async () => {
      const mockRows = [
        {
          id_jasa: 1,
          tipe_jasa: "tari",
          nama: "Tari Merak",
          deskripsi: "Tarian Sunda klasik.",
          posisi_pentas: "Opening",
          id_provinsi: 13,
          nama_provinsi: "Jawa Barat",
          pulau: "Jawa",
          durasi: 10,
          harga_minimum: "2500000.00",
          harga_maximum: "5000000.00",
          min_performer: 4,
          tautan_media: "https://youtube.com/watch?v=merak",
          foto_sampul: "/uploads/merak.jpg",
          is_aktif: true,
        },
      ];
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: mockRows, rowCount: 1 } as any);

      const res = await request(app).get("/api/jasa");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        id_jasa: 1,
        tipe_jasa: "tari",
        nama: "Tari Merak",
        posisi_pentas: ["Opening"],
        nama_kecocokan: "Opening",
        id_provinsi: 13,
        nama_provinsi: "Jawa Barat",
        pulau: "Jawa",
        kultur: "Jawa Barat",
        harga_minimum: 2500000,
        harga_maximum: 5000000,
        min_performer: 4,
        tautan_media: "https://youtube.com/watch?v=merak",
        link_media: "https://youtube.com/watch?v=merak",
        foto_sampul: "/uploads/merak.jpg",
        link_image: "/uploads/merak.jpg",
        is_aktif: true,
      });

      const [calledQuery] = vi.mocked(pool.query).mock.calls[0];
      expect(calledQuery).toContain("j.is_aktif = TRUE");
    });

    it("dengan ?include_inactive=true mengembalikan semua jasa (aktif & nonaktif)", async () => {
      const mockRows = [
        {
          id_jasa: 1,
          tipe_jasa: "tari",
          nama: "Tari Merak",
          deskripsi: "Tarian Sunda.",
          posisi_pentas: "Opening",
          id_provinsi: 13,
          nama_provinsi: "Jawa Barat",
          pulau: "Jawa",
          durasi: 10,
          harga_minimum: 2500000,
          harga_maximum: 5000000,
          min_performer: 4,
          tautan_media: null,
          foto_sampul: null,
          is_aktif: true,
        },
        {
          id_jasa: 2,
          tipe_jasa: "musik",
          nama: "Gamelan Degung",
          deskripsi: "Musik Sunda.",
          posisi_pentas: "Middle",
          id_provinsi: null,
          nama_provinsi: null,
          pulau: null,
          durasi: 30,
          harga_minimum: 3000000,
          harga_maximum: 5500000,
          min_performer: 6,
          tautan_media: null,
          foto_sampul: null,
          is_aktif: false,
        },
      ];
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: mockRows, rowCount: 2 } as any);

      const res = await request(app).get("/api/jasa?include_inactive=true");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[1].is_aktif).toBe(false);

      const [calledQuery] = vi.mocked(pool.query).mock.calls[0];
      expect(calledQuery).not.toContain("j.is_aktif = TRUE");
    });
  });

  describe("POST /api/jasa", () => {
    it("berhasil membuat jasa Tari baru dengan id_provinsi", async () => {
      const createdRow = {
        id_jasa: 10,
        tipe_jasa: "tari",
        nama: "Tari Piring",
        deskripsi: "Tarian tradisional Sumatera Barat.",
        posisi_pentas: "Opening",
        id_provinsi: 3,
        nama_provinsi: "Sumatera Barat",
        pulau: "Sumatera",
        durasi: 12,
        harga_minimum: 3000000,
        harga_maximum: 6000000,
        min_performer: 5,
        tautan_media: "https://youtube.com/watch?v=piring",
        foto_sampul: "/uploads/piring.jpg",
        is_aktif: true,
      };
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [createdRow], rowCount: 1 } as any);

      const res = await request(app).post("/api/jasa").send({
        tipe_jasa: "Tari",
        nama: "Tari Piring",
        deskripsi: "Tarian tradisional Sumatera Barat.",
        posisi_pentas: "Opening",
        id_provinsi: 3,
        durasi: 12,
        harga_minimum: 3000000,
        harga_maximum: 6000000,
        min_performer: 5,
        tautan_media: "https://youtube.com/watch?v=piring",
        foto_sampul: "/uploads/piring.jpg",
        is_aktif: true,
      });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id_jasa: 10,
        tipe_jasa: "tari",
        nama: "Tari Piring",
        id_provinsi: 3,
        nama_provinsi: "Sumatera Barat",
        posisi_pentas: ["Opening"],
      });
    });

    it("mengosongkan id_provinsi menjadi null saat tipe_jasa adalah Musik", async () => {
      const createdRow = {
        id_jasa: 11,
        tipe_jasa: "musik",
        nama: "Gamelan Kreasi Nusantara",
        deskripsi: "Ansambel gamelan lintas tradisi.",
        posisi_pentas: "Middle",
        id_provinsi: null,
        nama_provinsi: null,
        pulau: null,
        durasi: 25,
        harga_minimum: 3500000,
        harga_maximum: 7000000,
        min_performer: 6,
        tautan_media: null,
        foto_sampul: null,
        is_aktif: true,
      };
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [createdRow], rowCount: 1 } as any);

      const res = await request(app).post("/api/jasa").send({
        tipe_jasa: "Musik",
        nama: "Gamelan Kreasi Nusantara",
        deskripsi: "Ansambel gamelan lintas tradisi.",
        posisi_pentas: "Middle",
        id_provinsi: 13,
        durasi: 25,
        harga_minimum: 3500000,
        harga_maximum: 7000000,
        min_performer: 6,
        is_aktif: true,
      });

      expect(res.status).toBe(201);
      expect(res.body.id_provinsi).toBeNull();
      const [, calledParams] = vi.mocked(pool.query).mock.calls[0];
      expect(calledParams?.[4]).toBeNull();
    });

    it("menolak jika harga_maximum lebih kecil dari harga_minimum", async () => {
      const res = await request(app).post("/api/jasa").send({
        tipe_jasa: "musik",
        nama: "Musik Uji",
        posisi_pentas: "Opening",
        durasi: 15,
        harga_minimum: 5000000,
        harga_maximum: 2500000,
        min_performer: 2,
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/harga maksimum/i);
      expect(pool.query).not.toHaveBeenCalled();
    });

    it("menolak dengan pesan yang sesuai jika harga_minimum, harga_maximum, atau durasi tidak valid", async () => {
      const resMin = await request(app).post("/api/jasa").send({
        tipe_jasa: "musik",
        nama: "Musik Uji Min",
        posisi_pentas: "Opening",
        durasi: 15,
        harga_minimum: -1,
        harga_maximum: 2500000,
        min_performer: 2,
      });
      expect(resMin.status).toBe(400);
      expect(resMin.body.message).toBe("Tolong masukkan nominal harga minimum.");

      const resMax = await request(app).post("/api/jasa").send({
        tipe_jasa: "musik",
        nama: "Musik Uji Max",
        posisi_pentas: "Opening",
        durasi: 15,
        harga_minimum: 1000000,
        harga_maximum: -1,
        min_performer: 2,
      });
      expect(resMax.status).toBe(400);
      expect(resMax.body.message).toBe("Tolong masukkan nominal harga maksimum.");

      const resDurasi = await request(app).post("/api/jasa").send({
        tipe_jasa: "musik",
        nama: "Musik Uji Durasi",
        posisi_pentas: "Opening",
        durasi: 0,
        harga_minimum: 1000000,
        harga_maximum: 2000000,
        min_performer: 2,
      });
      expect(resDurasi.status).toBe(400);
      expect(resDurasi.body.message).toBe("Tolong isi durasi pertunjukan (menit) terlebih dahulu.");
    });

    it("menolak jasa Tari tanpa id_provinsi", async () => {
      const res = await request(app).post("/api/jasa").send({
        tipe_jasa: "tari",
        nama: "Tari Tanpa Provinsi",
        posisi_pentas: "Opening",
        durasi: 10,
        harga_minimum: 2000000,
        harga_maximum: 4000000,
        min_performer: 3,
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/provinsi/i);
    });

    it("mengembalikan 409 jika nama jasa sudah terdaftar", async () => {
      vi.mocked(pool.query).mockRejectedValueOnce({ code: "23505" });

      const res = await request(app).post("/api/jasa").send({
        tipe_jasa: "musik",
        nama: "Gamelan Sunda",
        posisi_pentas: "Opening",
        durasi: 20,
        harga_minimum: 2000000,
        harga_maximum: 4000000,
        min_performer: 4,
      });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/sudah terdaftar/i);
    });

    it("berhasil membuat jasa dengan array multiple posisi_pentas", async () => {
      const createdRow = {
        id_jasa: 12,
        tipe_jasa: "musik",
        nama: "Kolaborasi Nusantara",
        deskripsi: "Musik pembuka dan penutup.",
        posisi_pentas: "Opening, Closing",
        posisi_pentas_list: ["Opening", "Closing"],
        id_provinsi: null,
        nama_provinsi: null,
        pulau: null,
        durasi: 20,
        harga_minimum: 4000000,
        harga_maximum: 8000000,
        min_performer: 5,
        tautan_media: null,
        foto_sampul: null,
        is_aktif: true,
      };
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [createdRow], rowCount: 1 } as any);

      const res = await request(app).post("/api/jasa").send({
        tipe_jasa: "Musik",
        nama: "Kolaborasi Nusantara",
        deskripsi: "Musik pembuka dan penutup.",
        posisi_pentas: ["Opening", "Closing"],
        durasi: 20,
        harga_minimum: 4000000,
        harga_maximum: 8000000,
        min_performer: 5,
        is_aktif: true,
      });

      expect(res.status).toBe(201);
      expect(res.body.posisi_pentas).toEqual(["Opening", "Closing"]);
      expect(res.body.nama_kecocokan).toBe("Opening, Closing");
    });

    it("menolak jika posisi_pentas kosong atau tidak ada yang valid", async () => {
      const res = await request(app).post("/api/jasa").send({
        tipe_jasa: "musik",
        nama: "Musik Tanpa Posisi",
        posisi_pentas: [],
        durasi: 15,
        harga_minimum: 1000000,
        harga_maximum: 2000000,
        min_performer: 2,
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/posisi pentas/i);
    });
  });

  describe("PUT /api/jasa/:id & PATCH /api/jasa/:id/status", () => {
    it("memperbarui data jasa yang ada", async () => {
      const updatedRow = {
        id_jasa: 1,
        tipe_jasa: "tari",
        nama: "Tari Merak Klasik",
        deskripsi: "Deskripsi baru.",
        posisi_pentas: "Closing",
        id_provinsi: 13,
        nama_provinsi: "Jawa Barat",
        pulau: "Jawa",
        durasi: 15,
        harga_minimum: 2750000,
        harga_maximum: 5500000,
        min_performer: 4,
        tautan_media: null,
        foto_sampul: null,
        is_aktif: true,
      };
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [updatedRow], rowCount: 1 } as any);

      const res = await request(app).put("/api/jasa/1").send({
        tipe_jasa: "tari",
        nama: "Tari Merak Klasik",
        deskripsi: "Deskripsi baru.",
        posisi_pentas: "Closing",
        id_provinsi: 13,
        durasi: 15,
        harga_minimum: 2750000,
        harga_maximum: 5500000,
        min_performer: 4,
        is_aktif: true,
      });

      expect(res.status).toBe(200);
      expect(res.body.nama).toBe("Tari Merak Klasik");
      expect(res.body.posisi_pentas).toEqual(["Closing"]);
    });

    it("mengubah status aktif jasa melalui PATCH /api/jasa/:id/status", async () => {
      const toggledRow = {
        id_jasa: 1,
        tipe_jasa: "tari",
        nama: "Tari Merak",
        deskripsi: "Tarian Sunda.",
        posisi_pentas: "Opening",
        id_provinsi: 13,
        nama_provinsi: "Jawa Barat",
        pulau: "Jawa",
        durasi: 10,
        harga_minimum: 2500000,
        harga_maximum: 5000000,
        min_performer: 4,
        tautan_media: null,
        foto_sampul: null,
        is_aktif: false,
      };
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [toggledRow], rowCount: 1 } as any);

      const res = await request(app)
        .patch("/api/jasa/1/status")
        .send({ is_aktif: false });

      expect(res.status).toBe(200);
      expect(res.body.is_aktif).toBe(false);
    });
  });
});
