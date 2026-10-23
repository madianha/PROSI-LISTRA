import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Repository di-mock agar test tidak butuh database
vi.mock("../src/repositories/beritaRepository", () => ({
  listBerita: vi.fn(),
  getBerita: vi.fn(),
  createBerita: vi.fn(),
  updateBerita: vi.fn(),
  setPublik: vi.fn(),
  deleteBerita: vi.fn(),
}));

import app from "../src/app";
import * as repo from "../src/repositories/beritaRepository";

const mocked = vi.mocked(repo);

const barisTautan = {
  id_berita: 1,
  judul: "LISTRA Juara 1",
  tanggal: "2023-12-01",
  url_gambar: "https://unpar.ac.id/gambar.jpg",
  konten: null,
  sumber: "unpar.ac.id",
  url_artikel: "https://unpar.ac.id/listra-juara",
  is_publik: true,
  dibuat_pada: "2026-10-23T10:00:00.000Z",
  diperbarui_pada: "2026-10-23T10:00:00.000Z",
};

const bodyArtikel = {
  judul: "Persiapan Gelar Karya",
  tanggal: "2026-10-10",
  url_gambar: "/uploads/sampul.jpg",
  konten: "<p>Latihan dimulai.</p>",
};

const isiArtikel = { ...bodyArtikel, sumber: null, url_artikel: null };

beforeEach(() => {
  vi.resetAllMocks();
});

describe("GET /api/berita", () => {
  it("tanpa ?semua hanya meminta berita publik", async () => {
    mocked.listBerita.mockResolvedValue([barisTautan]);
    const res = await request(app).get("/api/berita");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([barisTautan]);
    expect(mocked.listBerita).toHaveBeenCalledWith({ semua: false });
  });

  it("?semua=1 ikut meminta draf (Kelola Berita)", async () => {
    mocked.listBerita.mockResolvedValue([]);
    await request(app).get("/api/berita?semua=1");
    expect(mocked.listBerita).toHaveBeenCalledWith({ semua: true });
  });

  it("mengembalikan 500 saat database error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocked.listBerita.mockRejectedValue(new Error("db mati"));
    const res = await request(app).get("/api/berita");
    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Terjadi kesalahan pada server.");
  });
});

describe("GET /api/berita/:id", () => {
  it("mengembalikan satu berita publik", async () => {
    mocked.getBerita.mockResolvedValue(barisTautan);
    const res = await request(app).get("/api/berita/1");
    expect(res.status).toBe(200);
    expect(mocked.getBerita).toHaveBeenCalledWith(1, { semua: false });
  });

  it("?semua=1 boleh membuka draf (halaman Ubah Berita)", async () => {
    mocked.getBerita.mockResolvedValue({ ...barisTautan, is_publik: false });
    const res = await request(app).get("/api/berita/1?semua=1");
    expect(res.status).toBe(200);
    expect(mocked.getBerita).toHaveBeenCalledWith(1, { semua: true });
  });

  it("404 bila tidak ada atau bukan publik", async () => {
    mocked.getBerita.mockResolvedValue(null);
    const res = await request(app).get("/api/berita/99");
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Berita tidak ditemukan.");
  });

  it("404 untuk id bukan angka tanpa menyentuh database", async () => {
    const res = await request(app).get("/api/berita/abc");
    expect(res.status).toBe(404);
    expect(mocked.getBerita).not.toHaveBeenCalled();
  });
});

describe("POST /api/berita", () => {
  it("201 dan menyimpan hanya kolom yang disepakati beserta is_publik", async () => {
    mocked.createBerita.mockImplementation(async (data, isPublik) => ({
      ...data,
      is_publik: isPublik,
      id_berita: 2,
      dibuat_pada: "",
      diperbarui_pada: "",
    }));
    const res = await request(app)
      .post("/api/berita")
      .send({ ...bodyArtikel, is_publik: false, kategori: "tidak ada di tabel" });

    expect(res.status).toBe(201);
    expect(mocked.createBerita).toHaveBeenCalledWith(isiArtikel, false);
  });

  it("is_publik true diteruskan apa adanya", async () => {
    mocked.createBerita.mockResolvedValue({ ...barisTautan });
    await request(app).post("/api/berita").send({ ...bodyArtikel, is_publik: true });
    expect(mocked.createBerita).toHaveBeenCalledWith(isiArtikel, true);
  });

  it.each([
    ["tidak dikirim", undefined],
    ["berupa teks", "true"],
    ["berupa angka", 1],
  ])("400 bila is_publik %s", async (_label, nilai) => {
    const res = await request(app).post("/api/berita").send({ ...bodyArtikel, is_publik: nilai });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("is_publik wajib bernilai true atau false.");
    expect(mocked.createBerita).not.toHaveBeenCalled();
  });

  it("400 dengan pesan bila isi tidak valid", async () => {
    const res = await request(app)
      .post("/api/berita")
      .send({ ...bodyArtikel, judul: "", is_publik: false });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Judul wajib diisi.");
    expect(mocked.createBerita).not.toHaveBeenCalled();
  });
});

describe("PUT /api/berita/:id", () => {
  it("memperbarui isi berita", async () => {
    mocked.updateBerita.mockResolvedValue({ ...barisTautan, judul: "Baru" });
    const res = await request(app)
      .put("/api/berita/1")
      .send({ ...barisTautan, judul: "Baru" });
    expect(res.status).toBe(200);
    expect(mocked.updateBerita).toHaveBeenCalledWith(1, expect.objectContaining({ judul: "Baru" }));
  });

  it("mengabaikan is_publik (status publik hanya lewat PATCH)", async () => {
    mocked.updateBerita.mockResolvedValue(barisTautan);
    await request(app).put("/api/berita/1").send({ ...bodyArtikel, is_publik: true });
    expect(mocked.updateBerita).toHaveBeenCalledWith(1, isiArtikel);
    expect(mocked.setPublik).not.toHaveBeenCalled();
  });

  it("404 bila berita tidak ada", async () => {
    mocked.updateBerita.mockResolvedValue(null);
    const res = await request(app).put("/api/berita/99").send(bodyArtikel);
    expect(res.status).toBe(404);
  });

  it("400 bila tidak valid", async () => {
    const res = await request(app).put("/api/berita/1").send({ ...bodyArtikel, konten: "" });
    expect(res.status).toBe(400);
    expect(mocked.updateBerita).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/berita/:id/publik", () => {
  it("mengubah status publik dan mengembalikan berita", async () => {
    mocked.setPublik.mockResolvedValue({ ...barisTautan, is_publik: false });
    const res = await request(app).patch("/api/berita/1/publik").send({ is_publik: false });
    expect(res.status).toBe(200);
    expect(res.body.is_publik).toBe(false);
    expect(mocked.setPublik).toHaveBeenCalledWith(1, false);
  });

  it("400 bila is_publik bukan boolean", async () => {
    const res = await request(app).patch("/api/berita/1/publik").send({ is_publik: "ya" });
    expect(res.status).toBe(400);
    expect(mocked.setPublik).not.toHaveBeenCalled();
  });

  it("404 bila berita tidak ada", async () => {
    mocked.setPublik.mockResolvedValue(null);
    const res = await request(app).patch("/api/berita/99/publik").send({ is_publik: true });
    expect(res.status).toBe(404);
  });

  it("404 untuk id bukan angka", async () => {
    const res = await request(app).patch("/api/berita/abc/publik").send({ is_publik: true });
    expect(res.status).toBe(404);
    expect(mocked.setPublik).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/berita/:id", () => {
  it("204 setelah terhapus", async () => {
    mocked.deleteBerita.mockResolvedValue(true);
    const res = await request(app).delete("/api/berita/1");
    expect(res.status).toBe(204);
  });

  it("404 bila tidak ada", async () => {
    mocked.deleteBerita.mockResolvedValue(false);
    const res = await request(app).delete("/api/berita/99");
    expect(res.status).toBe(404);
  });
});
