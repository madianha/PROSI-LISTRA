import { fireEvent, screen } from "@solidjs/testing-library";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderRoute } from "../test/renderRoute";

vi.mock("../api/berita", () => ({ listBerita: vi.fn(), getBerita: vi.fn() }));

import Berita from "./berita";
import BeritaDetail from "./berita-detail";
import { getBerita, listBerita } from "../api/berita";

const daftar = [
  {
    id_berita: 1,
    judul: "LISTRA Juara 1",
    tanggal: "2023-12-01",
    url_gambar: "https://unpar.ac.id/gambar.jpg",
    konten: null,
    sumber: "unpar.ac.id",
    url_artikel: "https://unpar.ac.id/listra-juara",
  },
  {
    id_berita: 2,
    judul: "Persiapan Gelar Karya",
    tanggal: "2026-10-10",
    url_gambar: "/uploads/sampul.jpg",
    konten: "<p>Latihan dimulai.</p><script>bukan dari server</script>",
    sumber: null,
    url_artikel: null,
  },
];

beforeEach(() => {
  vi.resetAllMocks();
});

describe("Halaman Berita publik", () => {
  it("menampilkan kartu dari API", async () => {
    listBerita.mockResolvedValue(daftar);
    renderRoute(Berita, { path: "/berita" });

    expect(await screen.findByText("LISTRA Juara 1")).toBeTruthy();
    expect(screen.getByText("Persiapan Gelar Karya")).toBeTruthy();
  });

  it("hanya meminta berita publik (tanpa semua: true)", async () => {
    listBerita.mockResolvedValue(daftar);
    renderRoute(Berita, { path: "/berita" });
    await screen.findByText("LISTRA Juara 1");
    expect(listBerita).toHaveBeenCalledWith();
  });

  it("menampilkan pesan bila belum ada berita", async () => {
    listBerita.mockResolvedValue([]);
    renderRoute(Berita, { path: "/berita" });
    expect(await screen.findByText("Belum ada berita.")).toBeTruthy();
  });

  it("menampilkan error dan bisa mencoba lagi", async () => {
    listBerita.mockRejectedValueOnce(new Error("server mati")).mockResolvedValueOnce(daftar);
    renderRoute(Berita, { path: "/berita" });

    fireEvent.click(await screen.findByRole("button", { name: "Coba lagi" }));
    expect(await screen.findByText("LISTRA Juara 1")).toBeTruthy();
    expect(listBerita).toHaveBeenCalledTimes(2);
  });
});

describe("Halaman detail berita", () => {
  it("menampilkan judul, tanggal, dan konten artikel", async () => {
    getBerita.mockResolvedValue(daftar[1]);
    const { container } = renderRoute(BeritaDetail, { path: "/berita/:id", url: "/berita/2" });

    expect(await screen.findByRole("heading", { name: "Persiapan Gelar Karya" })).toBeTruthy();
    // tanpa semua: true, jadi draf dijawab 404 oleh server
    expect(getBerita).toHaveBeenCalledWith("2");
    expect(screen.getByText("10 Okt 2026")).toBeTruthy();
    expect(screen.getByText("Latihan dimulai.")).toBeTruthy();
    expect(container.querySelector("img").getAttribute("src")).toBe("/uploads/sampul.jpg");
  });

  it("untuk tautan menampilkan link ke sumber", async () => {
    getBerita.mockResolvedValue(daftar[0]);
    renderRoute(BeritaDetail, { path: "/berita/:id", url: "/berita/1" });

    const link = await screen.findByRole("link", { name: /Baca selengkapnya di unpar.ac.id/ });
    expect(link.getAttribute("href")).toBe("https://unpar.ac.id/listra-juara");
  });

  it("menampilkan pesan dari server bila tidak ditemukan", async () => {
    getBerita.mockRejectedValue(new Error("Berita tidak ditemukan."));
    renderRoute(BeritaDetail, { path: "/berita/:id", url: "/berita/99" });
    expect(await screen.findByText("Berita tidak ditemukan.")).toBeTruthy();
  });
});
