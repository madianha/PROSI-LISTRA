import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../src/app";
import { pool } from "../src/db";
import { signJwt } from "../src/controllers/authController";

const client = { query: vi.fn(), release: vi.fn() };

vi.mock("../src/db", () => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn(),
  },
}));

const login = `Bearer ${signJwt({ id_anggota: 1, peran: "humas" }, "listra_dev_secret")}`;

// satu baris persis seperti hasil SELECT jasa (kolom master.sql + provinsi + array kecocokan)
const baris = (ubah: Record<string, unknown> = {}) => ({
  id_jasa: 1,
  tipe_jasa: "tari",
  nama: "Tari Merak",
  deskripsi: "Tarian Sunda klasik.",
  id_provinsi: 13,
  nama_provinsi: "Jawa Barat",
  pulau: "Jawa",
  durasi: 10,
  harga_minimum: "2500000.00",
  harga_maximum: "5000000.00",
  min_performer: 4,
  link_media: "https://youtube.com/watch?v=merak",
  link_image: "/uploads/merak.jpg",
  is_aktif: true,
  kecocokan: ["Opening"],
  ...ubah,
});

const bodyTari = {
  tipe_jasa: "Tari",
  nama: "Tari Piring",
  deskripsi: "Tarian tradisional Sumatera Barat.",
  kecocokan: ["Opening"],
  id_provinsi: 3,
  durasi: 12,
  harga_minimum: 3000000,
  harga_maximum: 6000000,
  min_performer: 5,
  link_media: "https://youtube.com/watch?v=piring",
  link_image: "/uploads/piring.jpg",
  is_aktif: true,
};

/** Atur jawaban client transaksi: urutan query = BEGIN, INSERT/UPDATE, DELETE jk, INSERT jk, SELECT, COMMIT. */
function transaksi(hasilUtama: { rows: any[]; rowCount: number }, hasilSelect: any[]) {
  client.query.mockImplementation(async (sql: string) => {
    if (/^\s*(INSERT INTO jasa\b|UPDATE jasa)/.test(sql)) return hasilUtama;
    if (/FROM jasa j/.test(sql)) return { rows: hasilSelect, rowCount: hasilSelect.length };
    return { rows: [], rowCount: 0 };
  });
  vi.mocked(pool.connect).mockResolvedValue(client as any);
}

const sqlDipanggil = () => client.query.mock.calls.map(([sql]) => String(sql).trim().split(/\s+/).slice(0, 3).join(" "));

describe("Jasa & Provinsi Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.query.mockReset();
  });

  describe("GET /api/provinsi", () => {
    it("mengembalikan daftar provinsi terurut berdasarkan pulau", async () => {
      const mockProvinsi = [
        { id_provinsi: 1, nama_provinsi: "Aceh", pulau: "Sumatera" },
        { id_provinsi: 13, nama_provinsi: "Jawa Barat", pulau: "Jawa" },
      ];
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: mockProvinsi, rowCount: 2 } as any);

      const res = await request(app).get("/api/provinsi");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockProvinsi);
      expect(vi.mocked(pool.query).mock.calls[0][0]).toContain("FROM provinsi");
    });
  });

  describe("GET /api/jasa", () => {
    it("publik: hanya jasa aktif, field sesuai kolom tabel jasa", async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [baris()], rowCount: 1 } as any);

      const res = await request(app).get("/api/jasa");

      expect(res.status).toBe(200);
      expect(res.body[0]).toEqual({
        id_jasa: 1,
        tipe_jasa: "tari",
        nama: "Tari Merak",
        deskripsi: "Tarian Sunda klasik.",
        id_provinsi: 13,
        nama_provinsi: "Jawa Barat",
        pulau: "Jawa",
        durasi: 10,
        harga_minimum: 2500000,
        harga_maximum: 5000000,
        min_performer: 4,
        link_media: "https://youtube.com/watch?v=merak",
        link_image: "/uploads/merak.jpg",
        is_aktif: true,
        kecocokan: ["Opening"],
      });
      const [sql] = vi.mocked(pool.query).mock.calls[0];
      expect(sql).toContain("j.is_aktif = TRUE");
      expect(sql).toContain("jasa_kecocokan");
    });

    it("query hanya memakai kolom yang ada di master.sql", async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
      await request(app).get("/api/jasa");
      const [sql] = vi.mocked(pool.query).mock.calls[0];
      expect(sql).not.toMatch(/posisi_pentas|tautan_media|foto_sampul|ALTER TABLE/);
    });

    it("publik: ?include_inactive=true tanpa login tetap hanya jasa aktif", async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
      await request(app).get("/api/jasa?include_inactive=true");
      expect(vi.mocked(pool.query).mock.calls[0][0]).toContain("j.is_aktif = TRUE");
    });

    it("login: ?include_inactive=true mengembalikan jasa aktif & nonaktif", async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [baris(), baris({ id_jasa: 2, tipe_jasa: "musik", id_provinsi: null, nama_provinsi: null, pulau: null, is_aktif: false, kecocokan: ["Middle"] })],
        rowCount: 2,
      } as any);

      const res = await request(app).get("/api/jasa?include_inactive=true").set("Authorization", login);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[1].is_aktif).toBe(false);
      expect(vi.mocked(pool.query).mock.calls[0][0]).not.toContain("j.is_aktif = TRUE");
    });
  });

  describe("GET /api/jasa/:id", () => {
    it("publik: jasa nonaktif dianggap tidak ada (404)", async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
      const res = await request(app).get("/api/jasa/5");
      expect(res.status).toBe(404);
      expect(vi.mocked(pool.query).mock.calls[0][0]).toContain("j.is_aktif = TRUE");
    });

    it("login: boleh membuka jasa nonaktif", async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [baris({ is_aktif: false })], rowCount: 1 } as any);
      const res = await request(app).get("/api/jasa/1").set("Authorization", login);
      expect(res.status).toBe(200);
      expect(vi.mocked(pool.query).mock.calls[0][0]).not.toContain("j.is_aktif = TRUE");
    });

    it("id bukan angka = 404 tanpa query", async () => {
      const res = await request(app).get("/api/jasa/abc");
      expect(res.status).toBe(404);
      expect(pool.query).not.toHaveBeenCalled();
    });
  });

  describe("tulis tanpa login = 401", () => {
    it.each([
      ["post", "/api/jasa"],
      ["put", "/api/jasa/1"],
      ["patch", "/api/jasa/1/status"],
    ])("%s %s", async (method, url) => {
      const res = await (request(app) as any)[method](url).send(bodyTari);
      expect(res.status).toBe(401);
      expect(pool.query).not.toHaveBeenCalled();
      expect(pool.connect).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/jasa", () => {
    it("membuat jasa Tari dalam satu transaksi dan menyimpan kecocokan ke jasa_kecocokan", async () => {
      transaksi(
        { rows: [{ id_jasa: 10 }], rowCount: 1 },
        [baris({ id_jasa: 10, nama: "Tari Piring", id_provinsi: 3, nama_provinsi: "Sumatera Barat", pulau: "Sumatera" })]
      );

      const res = await request(app).post("/api/jasa").set("Authorization", login).send(bodyTari);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ id_jasa: 10, tipe_jasa: "tari", nama: "Tari Piring", id_provinsi: 3 });
      expect(sqlDipanggil()).toEqual([
        "BEGIN",
        "INSERT INTO jasa",
        "DELETE FROM jasa_kecocokan",
        "INSERT INTO jasa_kecocokan",
        "SELECT j.id_jasa, j.tipe_jasa,",
        "COMMIT",
      ]);
      const insertJasa = client.query.mock.calls[1];
      expect(insertJasa[0]).toContain("link_media, link_image, is_aktif");
      expect(insertJasa[1]).toEqual([
        "tari", "Tari Piring", "Tarian tradisional Sumatera Barat.", 3, 12, 3000000, 6000000, 5,
        "https://youtube.com/watch?v=piring", "/uploads/piring.jpg", true,
      ]);
      expect(client.query.mock.calls[3][1]).toEqual([10, ["Opening"]]);
      expect(client.release).toHaveBeenCalled();
    });

    it("Musik selalu tanpa provinsi walau id_provinsi dikirim", async () => {
      transaksi({ rows: [{ id_jasa: 11 }], rowCount: 1 }, [baris({ id_jasa: 11, tipe_jasa: "musik", id_provinsi: null })]);

      const res = await request(app).post("/api/jasa").set("Authorization", login)
        .send({ ...bodyTari, tipe_jasa: "Musik", nama: "Gamelan", id_provinsi: 13 });

      expect(res.status).toBe(201);
      expect(client.query.mock.calls[1][1][3]).toBeNull();
    });

    it("banyak posisi pentas disimpan urut Opening -> Closing", async () => {
      transaksi({ rows: [{ id_jasa: 12 }], rowCount: 1 }, [baris({ id_jasa: 12, kecocokan: ["Opening", "Closing"] })]);

      const res = await request(app).post("/api/jasa").set("Authorization", login)
        .send({ ...bodyTari, kecocokan: ["closing", "Opening", "bukan-posisi"] });

      expect(res.status).toBe(201);
      expect(client.query.mock.calls[3][1]).toEqual([12, ["Opening", "Closing"]]);
      expect(res.body.kecocokan).toEqual(["Opening", "Closing"]);
    });

    it("gagal di tengah = ROLLBACK", async () => {
      client.query.mockImplementation(async (sql: string) => {
        if (/^\s*INSERT INTO jasa\b/.test(sql)) throw { code: "23505" };
        return { rows: [], rowCount: 0 };
      });
      vi.mocked(pool.connect).mockResolvedValue(client as any);

      const res = await request(app).post("/api/jasa").set("Authorization", login).send(bodyTari);

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/sudah terdaftar/i);
      expect(sqlDipanggil()).toContain("ROLLBACK");
      expect(client.release).toHaveBeenCalled();
    });

    it.each([
      [{ harga_minimum: 5000000, harga_maximum: 2500000 }, /harga maksimum tidak boleh/i],
      [{ harga_minimum: -1 }, /harga minimum/i],
      [{ harga_maximum: -1 }, /harga maksimum/i],
      [{ durasi: 0 }, /durasi/i],
      [{ id_provinsi: null }, /provinsi/i],
      [{ kecocokan: [] }, /posisi pentas/i],
      [{ link_media: "bukan-url" }, /URL/i],
      [{ nama: "x".repeat(101) }, /100 karakter/i],
      [{ tipe_jasa: "drama" }, /jenis jasa/i],
    ])("menolak %o", async (ubah, pesan) => {
      const res = await request(app).post("/api/jasa").set("Authorization", login).send({ ...bodyTari, ...ubah });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(pesan);
      expect(pool.connect).not.toHaveBeenCalled();
    });
  });

  describe("PUT /api/jasa/:id & PATCH /api/jasa/:id/status", () => {
    it("memperbarui jasa dan mengganti isi jasa_kecocokan", async () => {
      transaksi({ rows: [{ id_jasa: 1 }], rowCount: 1 }, [baris({ nama: "Tari Merak Klasik", kecocokan: ["Closing"] })]);

      const res = await request(app).put("/api/jasa/1").set("Authorization", login)
        .send({ ...bodyTari, nama: "Tari Merak Klasik", kecocokan: ["Closing"] });

      expect(res.status).toBe(200);
      expect(res.body.kecocokan).toEqual(["Closing"]);
      expect(sqlDipanggil()).toEqual([
        "BEGIN",
        "UPDATE jasa SET",
        "DELETE FROM jasa_kecocokan",
        "INSERT INTO jasa_kecocokan",
        "SELECT j.id_jasa, j.tipe_jasa,",
        "COMMIT",
      ]);
    });

    it("jasa tidak ada = 404 dan ROLLBACK", async () => {
      transaksi({ rows: [], rowCount: 0 }, []);
      const res = await request(app).put("/api/jasa/99").set("Authorization", login).send(bodyTari);
      expect(res.status).toBe(404);
      expect(sqlDipanggil()).toContain("ROLLBACK");
    });

    it("mengubah status aktif", async () => {
      vi.mocked(pool.query)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [baris({ is_aktif: false })], rowCount: 1 } as any);

      const res = await request(app).patch("/api/jasa/1/status").set("Authorization", login).send({ is_aktif: false });

      expect(res.status).toBe(200);
      expect(res.body.is_aktif).toBe(false);
      expect(vi.mocked(pool.query).mock.calls[0][1]).toEqual([false, 1]);
    });

    it("is_aktif bukan boolean = 400", async () => {
      const res = await request(app).patch("/api/jasa/1/status").set("Authorization", login).send({ is_aktif: "ya" });
      expect(res.status).toBe(400);
    });
  });
});
