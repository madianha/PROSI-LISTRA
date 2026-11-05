import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app";
import { pool } from "../src/db";

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
      expect(calledQuery).toContain("nama_jasa AS nama_spesialisasi");
      expect(calledQuery).toContain("tipe_jasa AS kategori");
      expect(calledQuery).toContain("tipe_jasa ASC, nama_jasa ASC");
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
      // Default bcrypt password hash '$2a$10$wT2v2sB4C6s0eY9IeB.yReM8x6yWv7jZ4M7g8Y5L5u9V1K1q3q7re'
      expect(insertAnggotaCall?.[1]?.[1]).toBe("$2a$10$wT2v2sB4C6s0eY9IeB.yReM8x6yWv7jZ4M7g8Y5L5u9V1K1q3q7re");
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
});
