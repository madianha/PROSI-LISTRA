import { describe, expect, it, vi, beforeEach } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import app from "../src/app";
import * as authRepo from "../src/repositories/authRepository";

describe("Auth Routes (/api/auth)", () => {
  const dummyPasswordHash = bcrypt.hashSync("password123", 10);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("POST /api/auth/login", () => {
    it("menolak jika email atau password kosong", async () => {
      const res1 = await request(app).post("/api/auth/login").send({});
      expect(res1.status).toBe(400);
      expect(res1.body.success).toBe(false);

      const res2 = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@unpar.ac.id" });
      expect(res2.status).toBe(400);
    });

    it("menolak jika email tidak ditemukan di database (401)", async () => {
      vi.spyOn(authRepo, "findAnggotaByEmail").mockResolvedValueOnce(null);

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "unknown@unpar.ac.id", password: "password123" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Email atau kata sandi tidak valid");
    });

    it("menolak jika anggota non-aktif (403)", async () => {
      vi.spyOn(authRepo, "findAnggotaByEmail").mockResolvedValueOnce({
        id_anggota: 2,
        nama: "Budi Santoso",
        email: "budi@unpar.ac.id",
        npm: "6182101002",
        peran: "Anggota Biasa",
        jabatan: null,
        is_aktif: false,
        password_hash: dummyPasswordHash,
      });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "budi@unpar.ac.id", password: "password123" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("non-aktif");
    });

    it("menolak jika password salah (401)", async () => {
      vi.spyOn(authRepo, "findAnggotaByEmail").mockResolvedValueOnce({
        id_anggota: 1,
        nama: "Alexander Haryanto",
        email: "alexander@unpar.ac.id",
        npm: "6182101001",
        peran: "Kepengurusan",
        jabatan: "Ketua Umum",
        is_aktif: true,
        password_hash: dummyPasswordHash,
      });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "alexander@unpar.ac.id", password: "wrongpassword" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Email atau kata sandi tidak valid");
    });

    it("berhasil login dengan kredensial benar dan menghasilkan JWT (200)", async () => {
      vi.spyOn(authRepo, "findAnggotaByEmail").mockResolvedValueOnce({
        id_anggota: 1,
        nama: "Alexander Haryanto",
        email: "alexander@unpar.ac.id",
        npm: "6182101001",
        peran: "Kepengurusan",
        jabatan: "Ketua Umum",
        is_aktif: true,
        password_hash: dummyPasswordHash,
      });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "alexander@unpar.ac.id", password: "password123" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toEqual({
        id_anggota: 1,
        nama: "Alexander Haryanto",
        email: "alexander@unpar.ac.id",
        peran: "Kepengurusan",
        jabatan: "Ketua Umum",
      });
    });
  });

  describe("GET /api/auth/me", () => {
    it("menolak tanpa token (401)", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });

    it("berhasil mengambil profil dengan token valid (200)", async () => {
      vi.spyOn(authRepo, "findAnggotaById").mockResolvedValueOnce({
        id_anggota: 1,
        nama: "Alexander Haryanto",
        email: "alexander@unpar.ac.id",
        peran: "Kepengurusan",
        jabatan: "Ketua Umum",
      });

      const token = jwt.sign(
        { id_anggota: 1, email: "alexander@unpar.ac.id", nama: "Alexander Haryanto", peran: "Kepengurusan" },
        process.env.JWT_SECRET || "listra-secret-key-prosi-2026"
      );

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.nama).toBe("Alexander Haryanto");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("mengembalikan status sukses (200)", async () => {
      const res = await request(app).post("/api/auth/logout");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});