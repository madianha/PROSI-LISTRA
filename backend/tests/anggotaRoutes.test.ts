import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import request from "supertest";
import app from "../src/app";
import { pool } from "../src/db";
import { signJwt } from "../src/controllers/authController";

vi.mock("../src/db", () => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn(),
  },
}));

describe("Anggota Routes with ERD v5 Schema", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/anggota/spesialisasi", () => {
    it("queries the jasa table according to ERD v5", async () => {
      const mockJasa = [
        { id_spesialisasi: 1, nama_spesialisasi: "Gamelan", kategori: "Musik" },
        { id_spesialisasi: 2, nama_spesialisasi: "Tari Merak", kategori: "Tari" },
      ];
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: mockJasa } as any);

      const res = await request(app).get("/api/anggota/spesialisasi");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockJasa);

      const [calledQuery] = vi.mocked(pool.query).mock.calls[0];
      expect(calledQuery).toContain("FROM jasa");
      expect(calledQuery).toContain("id_jasa AS id_spesialisasi");
      expect(calledQuery).toContain("nama AS nama_spesialisasi");
      expect(calledQuery).toContain("tipe_jasa AS kategori");
      expect(calledQuery).toContain("tipe_jasa ASC, nama ASC");
    });
  });

  describe("GET /api/anggota", () => {
    it("queries anggota joined with spesialisasi and jasa", async () => {
      const mockAnggota = [
        {
          id_anggota: 1,
          nama: "Budi",
          email: "budi@student.unpar.ac.id",
          npm: "6182101001",
          peran: "Kepengurusan",
          angkatan_unpar: 2021,
          jabatan: "Ketua",
          is_penari: true,
          is_pemusik: false,
          is_aktif: true,
          spesialisasi: [
            { id_spesialisasi: 2, nama_spesialisasi: "Tari Merak", kategori: "Tari" },
          ],
        },
      ];
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: mockAnggota } as any);

      const res = await request(app).get("/api/anggota");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockAnggota);

      const [calledQuery] = vi.mocked(pool.query).mock.calls[0];
      expect(calledQuery).toContain("FROM anggota a");
      expect(calledQuery).toContain("LEFT JOIN spesialisasi s ON a.id_anggota = s.id_anggota");
      expect(calledQuery).toContain("LEFT JOIN jasa j ON s.id_jasa = j.id_jasa");
      expect(calledQuery).toContain("a.is_penari");
      expect(calledQuery).toContain("a.is_pemusik");
    });
  });

  describe("POST /api/anggota", () => {
    it("creates anggota with password_hash default and spesialisasi junction table", async () => {
      const mockClient = {
        query: vi.fn(),
        release: vi.fn(),
      };
      vi.mocked(pool.connect).mockResolvedValueOnce(mockClient as any);

      // BEGIN
      mockClient.query.mockResolvedValueOnce({} as any);
      // SELECT DISTINCT tipe_jasa FROM jasa WHERE id_jasa = ANY(...)
      mockClient.query.mockResolvedValueOnce({ rows: [{ tipe_jasa: "Tari" }] } as any);
      // INSERT anggota RETURNING id_anggota
      mockClient.query.mockResolvedValueOnce({ rows: [{ id_anggota: 10 }] } as any);
      // INSERT spesialisasi
      mockClient.query.mockResolvedValueOnce({} as any);
      // COMMIT
      mockClient.query.mockResolvedValueOnce({} as any);

      // getAnggotaById query
      const createdAnggota = {
        id_anggota: 10,
        nama: "Dewi",
        email: "dewi@student.unpar.ac.id",
        npm: "6182101002",
        peran: "Kepengurusan",
        angkatan_unpar: 2021,
        jabatan: null,
        is_penari: true,
        is_pemusik: false,
        is_aktif: true,
        spesialisasi: [{ id_spesialisasi: 1, nama_spesialisasi: "Tari Merak", kategori: "Tari" }],
      };
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [createdAnggota] } as any);

      const res = await request(app)
        .post("/api/anggota")
        .send({
          nama: "Dewi",
          email: "dewi@student.unpar.ac.id",
          npm: "6182101002",
          peran: "Kepengurusan",
          angkatan_unpar: 2021,
          is_penari: false,
          is_pemusik: false,
          is_aktif: true,
          spesialisasi_ids: [1],
        });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(createdAnggota);

      // Verify INSERT INTO anggota includes password_hash
      const insertAnggotaCall = mockClient.query.mock.calls.find((call) =>
        typeof call[0] === "string" && call[0].includes("INSERT INTO anggota")
      );
      expect(insertAnggotaCall).toBeDefined();
      expect(insertAnggotaCall?.[0]).toContain("password_hash");
      // tanpa kata sandi: dipakai hash bawaan, yang harus cocok dengan "password123"
      expect(bcrypt.compareSync("password123", insertAnggotaCall?.[1]?.[1])).toBe(true);
      // Verify is_penari inferred from tipe_jasa "Tari"
      expect(insertAnggotaCall?.[1]?.[7]).toBe(true);

      // Verify INSERT spesialisasi table query
      const insertSpesialisasiCall = mockClient.query.mock.calls.find((call) =>
        typeof call[0] === "string" && call[0].includes("INSERT INTO spesialisasi")
      );
      expect(insertSpesialisasiCall).toBeDefined();
      expect(insertSpesialisasiCall?.[0]).toContain("(id_anggota, id_jasa)");
    });
  });

  describe("kata sandi anggota", () => {
    const body = { nama: "Sari", email: "sari@student.unpar.ac.id", peran: "Anggota", password: "rahasia123" };
    const token = (peran: string) => `Bearer ${signJwt({ id_anggota: 1, peran }, "listra_dev_secret")}`;

    it("menolak kata sandi tanpa login", async () => {
      const res = await request(app).post("/api/anggota").send(body);
      expect(res.status).toBe(403);
      expect(pool.connect).not.toHaveBeenCalled();
    });

    it("menolak kata sandi dari peran selain Admin/LISTRA", async () => {
      const res = await request(app).post("/api/anggota").set("Authorization", token("humas")).send(body);
      expect(res.status).toBe(403);
    });

    it("menolak token palsu", async () => {
      const palsu = signJwt({ id_anggota: 1, peran: "admin" }, "bukan-rahasia-server");
      const res = await request(app).post("/api/anggota").set("Authorization", `Bearer ${palsu}`).send(body);
      expect(res.status).toBe(403);
    });

    it("menolak kata sandi kurang dari 8 karakter", async () => {
      const res = await request(app)
        .post("/api/anggota")
        .set("Authorization", token("admin"))
        .send({ ...body, password: "pendek" });
      expect(res.status).toBe(400);
    });

    it("Admin: kata sandi disimpan sebagai hash bcrypt, bukan teks biasa", async () => {
      const mockClient = { query: vi.fn().mockResolvedValue({ rows: [{ id_anggota: 11 }] }), release: vi.fn() };
      vi.mocked(pool.connect).mockResolvedValueOnce(mockClient as any);
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [{ id_anggota: 11, nama: "Sari" }] } as any);

      const res = await request(app).post("/api/anggota").set("Authorization", token("listra")).send(body);

      expect(res.status).toBe(201);
      const insert = mockClient.query.mock.calls.find((c) => String(c[0]).includes("INSERT INTO anggota"));
      const disimpan = insert?.[1]?.[1];
      expect(disimpan).not.toBe("rahasia123");
      expect(bcrypt.compareSync("rahasia123", disimpan)).toBe(true);
    });
  });
});
