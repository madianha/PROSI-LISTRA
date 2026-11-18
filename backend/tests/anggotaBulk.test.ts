import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/repositories/anggotaRepository", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/repositories/anggotaRepository")>()),
  cariTerdaftar: vi.fn(),
  createAnggotaBulk: vi.fn(),
}));

import app from "../src/app";
import { signJwt } from "../src/controllers/authController";
import * as repo from "../src/repositories/anggotaRepository";

const LOGIN = `Bearer ${signJwt({ id_anggota: 2, peran: "listra" }, "listra_dev_secret")}`;
const mocked = vi.mocked(repo);

const baris = (ubah: Record<string, unknown> = {}) => ({
  nama: "Sari",
  email: "sari@student.unpar.ac.id",
  npm: "6182301001",
  angkatan_unpar: "2023",
  jabatan: "Anggota",
  peran: "Anggota",
  is_penari: "ya",
  is_pemusik: "tidak",
  is_aktif: "",
  ...ubah,
});

const kirim = (anggota: unknown[]) => request(app).post("/api/anggota/bulk").set("Authorization", LOGIN).send({ anggota });

beforeEach(() => {
  vi.resetAllMocks();
  mocked.cariTerdaftar.mockResolvedValue({ emails: [], npms: [] });
  mocked.createAnggotaBulk.mockImplementation(async (list) => list.length);
});

describe("POST /api/anggota/bulk", () => {
  it("menyimpan semua baris valid dalam satu kali simpan; teks Ya/Tidak dan peran label dirapikan", async () => {
    const res = await kirim([baris(), baris({ nama: "Budi", email: "budi@x.id", npm: "", angkatan_unpar: "", peran: "alumni", is_penari: true })]);

    expect(res.status).toBe(201);
    expect(res.body.jumlah).toBe(2);
    expect(mocked.createAnggotaBulk).toHaveBeenCalledWith([
      { nama: "Sari", email: "sari@student.unpar.ac.id", npm: "6182301001", angkatan_unpar: 2023, jabatan: "Anggota", peran: "anggota", is_penari: true, is_pemusik: false, is_aktif: true },
      { nama: "Budi", email: "budi@x.id", npm: null, angkatan_unpar: null, jabatan: "Anggota", peran: "alumni", is_penari: true, is_pemusik: false, is_aktif: true },
    ]);
  });

  it("ada baris salah = tidak ada yang disimpan; kesalahan per baris & kolom", async () => {
    const res = await kirim([
      baris(),
      baris({ email: "bukan-email", npm: "12", angkatan_unpar: "23", peran: "Admin", is_aktif: "mungkin" }),
      baris({ nama: "", email: "lain@x.id", npm: "6182301002", peran: "" }),
    ]);

    expect(res.status).toBe(400);
    expect(mocked.createAnggotaBulk).not.toHaveBeenCalled();
    const ringkas = res.body.kesalahan.map((k: any) => `${k.baris}:${k.kolom}`);
    expect(ringkas).toEqual(expect.arrayContaining(["2:email", "2:npm", "2:angkatan_unpar", "2:peran", "2:is_aktif", "3:nama", "3:peran"]));
    expect(ringkas.some((r: string) => r.startsWith("1:"))).toBe(false);
  });

  it("email/NPM ganda di dalam tabel dan yang sudah terdaftar di database ditolak", async () => {
    mocked.cariTerdaftar.mockResolvedValue({ emails: ["lama@x.id"], npms: [] });
    const res = await kirim([baris(), baris({ email: "SARI@student.unpar.ac.id", npm: "6182301009" }), baris({ email: "lama@x.id", npm: "6182301001" })]);

    expect(res.status).toBe(400);
    expect(res.body.kesalahan).toEqual(
      expect.arrayContaining([
        { baris: 2, kolom: "email", pesan: "Email sama dengan baris 1." },
        { baris: 3, kolom: "npm", pesan: "NPM sama dengan baris 1." },
        { baris: 3, kolom: "email", pesan: "Email sudah terdaftar." },
      ]),
    );
    expect(mocked.createAnggotaBulk).not.toHaveBeenCalled();
  });

  it("tabel kosong atau terlalu banyak baris = 400", async () => {
    expect((await kirim([])).status).toBe(400);
    expect((await kirim(Array.from({ length: 501 }, (_, i) => baris({ email: `a${i}@x.id`, npm: "" })))).status).toBe(400);
  });

  it("tanpa login = 401", async () => {
    const res = await request(app).post("/api/anggota/bulk").send({ anggota: [baris()] });
    expect(res.status).toBe(401);
  });
});
