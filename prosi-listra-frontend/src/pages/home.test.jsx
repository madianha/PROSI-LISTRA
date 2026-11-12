import { screen } from "@solidjs/testing-library";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderRoute } from "../test/renderRoute";

vi.mock("../api/berita", () => ({ listBerita: vi.fn() }));

import Home from "./home";
import { listBerita } from "../api/berita";

const buatBerita = (id, judul, tanggal) => ({
  id_berita: id,
  judul,
  tanggal,
  url_gambar: `/uploads/sampul-${id}.jpg`,
  konten: "<p>isi</p>",
  sumber: null,
  url_artikel: null,
});

// urutan dari API: terbaru dulu
const daftar = [
  buatBerita(4, "Berita Keempat", "2026-10-23"),
  buatBerita(3, "Berita Ketiga", "2026-10-10"),
  buatBerita(2, "Berita Kedua", "2026-09-20"),
  buatBerita(1, "Berita Pertama", "2026-08-27"),
];

beforeEach(() => {
  vi.resetAllMocks();
});

describe("Halaman Home: Berita Terbaru", () => {
  it("menampilkan 3 berita terbaru dari API", async () => {
    listBerita.mockResolvedValue(daftar);
    renderRoute(Home);

    expect(await screen.findByText("Berita Keempat")).toBeTruthy();
    expect(screen.getByText("Berita Ketiga")).toBeTruthy();
    expect(screen.getByText("Berita Kedua")).toBeTruthy();
    expect(screen.queryByText("Berita Pertama")).toBeNull();
    // tanpa semua: true, jadi hanya berita publik
    expect(listBerita).toHaveBeenCalledWith();
  });

  it("menampilkan pesan bila belum ada berita", async () => {
    listBerita.mockResolvedValue([]);
    renderRoute(Home);
    expect(await screen.findByText("Belum ada berita.")).toBeTruthy();
  });

  it("halaman tetap tampil bila berita gagal dimuat", async () => {
    listBerita.mockRejectedValue(new Error("server mati"));
    renderRoute(Home);

    expect(await screen.findByText("Berita belum bisa dimuat.")).toBeTruthy();
    expect(screen.getByText("Jasa Pilihan")).toBeTruthy();
  });
});
