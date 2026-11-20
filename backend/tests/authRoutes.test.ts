import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import request from "supertest";
import app from "../src/app";
import { pool } from "../src/db";
import { signJwt } from "../src/controllers/authController";

vi.mock("../src/db", () => ({
  pool: { query: vi.fn(), connect: vi.fn() },
}));

const token = signJwt({ id_anggota: 7, email: "a@student.unpar.ac.id", peran: "anggota" }, "listra_dev_secret");
const auth = { Authorization: `Bearer ${token}` };

const body = {
  kata_sandi_lama: "lama12345",
  kata_sandi_baru: "baru12345",
  konfirmasi_kata_sandi: "baru12345",
};

describe("Auth self-service", () => {
  beforeEach(() => vi.resetAllMocks());

  describe("GET /api/auth/me", () => {
    it("menolak tanpa token", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });

    it("memakai id dari token dan tidak mengembalikan hash", async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [{ id_anggota: 7, nama: "Budi", email: "a@student.unpar.ac.id", peran: "anggota", is_aktif: true, spesialisasi: [] }],
      } as any);
      const res = await request(app).get("/api/auth/me").set(auth);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id_anggota: 7, nama: "Budi", peran: "Anggota" });
      expect(JSON.stringify(res.body)).not.toContain("password");
      expect(vi.mocked(pool.query).mock.calls[0][1]).toEqual([7]);
      expect(vi.mocked(pool.query).mock.calls[0][0]).not.toContain("password_hash");
    });

    it("menolak akun nonaktif dengan 401", async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [{ id_anggota: 7, nama: "Budi", email: "a@student.unpar.ac.id", peran: "anggota", is_aktif: false, spesialisasi: [] }],
      } as any);
      const res = await request(app).get("/api/auth/me").set(auth);
      expect(res.status).toBe(401);
    });

    it("fallback mencari lewat email bila token tidak punya id_anggota", async () => {
      const emailOnlyToken = signJwt({ email: "a@student.unpar.ac.id", peran: "anggota" }, "listra_dev_secret");
      vi.mocked(pool.query)
        .mockResolvedValueOnce({ rows: [{ id_anggota: 7 }] } as any)
        .mockResolvedValueOnce({
          rows: [{ id_anggota: 7, nama: "Budi", email: "a@student.unpar.ac.id", peran: "anggota", is_aktif: true, spesialisasi: [] }],
        } as any);
      const res = await request(app).get("/api/auth/me").set({ Authorization: `Bearer ${emailOnlyToken}` });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id_anggota: 7, nama: "Budi", peran: "Anggota" });
    });

    it("mengembalikan spesialisasi beserta nama dan tipe_jasa / kategori (tari vs musik)", async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [
          {
            id_anggota: 7,
            nama: "Budi",
            email: "a@student.unpar.ac.id",
            peran: "anggota",
            is_aktif: true,
            spesialisasi: [
              { id_jasa: 2, id_spesialisasi: 2, nama: "Tari Merak", nama_spesialisasi: "Tari Merak", tipe_jasa: "tari", kategori: "tari" },
              { id_jasa: 5, id_spesialisasi: 5, nama: "Gamelan", nama_spesialisasi: "Gamelan", tipe_jasa: "musik", kategori: "musik" },
            ],
          },
        ],
      } as any);
      const res = await request(app).get("/api/auth/me").set(auth);
      expect(res.status).toBe(200);
      expect(res.body.spesialisasi).toHaveLength(2);
      expect(res.body.spesialisasi[0]).toMatchObject({ nama: "Tari Merak", tipe_jasa: "tari" });
      expect(res.body.spesialisasi[1]).toMatchObject({ nama: "Gamelan", tipe_jasa: "musik" });
    });
  });

  describe("PUT /api/auth/change-password", () => {
    it("menolak tanpa token", async () => {
      const res = await request(app).put("/api/auth/change-password").send(body);
      expect(res.status).toBe(401);
    });

    it("menolak kolom kosong", async () => {
      const res = await request(app).put("/api/auth/change-password").set(auth).send({});
      expect(res.status).toBe(400);
    });

    it("menolak kata sandi baru terlalu pendek", async () => {
      const res = await request(app)
        .put("/api/auth/change-password")
        .set(auth)
        .send({ ...body, kata_sandi_baru: "abc", konfirmasi_kata_sandi: "abc" });
      expect(res.status).toBe(400);
      expect(pool.query).not.toHaveBeenCalled();
    });

    it("menolak konfirmasi tidak cocok", async () => {
      const res = await request(app)
        .put("/api/auth/change-password")
        .set(auth)
        .send({ ...body, konfirmasi_kata_sandi: "beda12345" });
      expect(res.status).toBe(400);
      expect(pool.query).not.toHaveBeenCalled();
    });

    it("menolak kata sandi lama yang salah", async () => {
      const hash = await bcrypt.hash("lama12345", 4);
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [{ password_hash: hash }] } as any);
      const res = await request(app)
        .put("/api/auth/change-password")
        .set(auth)
        .send({ ...body, kata_sandi_lama: "salah12345" });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Kata sandi lama tidak sesuai.");
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it("menolak kata sandi baru sama dengan lama", async () => {
      const hash = await bcrypt.hash("lama12345", 4);
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [{ password_hash: hash }] } as any);
      const res = await request(app)
        .put("/api/auth/change-password")
        .set(auth)
        .send({ ...body, kata_sandi_baru: "lama12345", konfirmasi_kata_sandi: "lama12345" });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Kata sandi baru tidak boleh sama dengan kata sandi lama.");
    });

    it("menyimpan hash bcrypt baru untuk id dari token", async () => {
      const hash = await bcrypt.hash("lama12345", 4);
      vi.mocked(pool.query)
        .mockResolvedValueOnce({ rows: [{ password_hash: hash }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);
      const res = await request(app).put("/api/auth/change-password").set(auth).send(body);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "Kata sandi berhasil diperbarui." });
      const [sql, params] = vi.mocked(pool.query).mock.calls[1] as [string, any[]];
      expect(sql).toContain("UPDATE anggota SET password_hash");
      expect(params[1]).toBe(7);
      expect(params[0]).not.toBe("baru12345");
      expect(await bcrypt.compare("baru12345", params[0])).toBe(true);
    });
  });
});
