import { screen } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderRoute } from "../test/renderRoute";
import { aturGulir, gulirKe } from "../test/gulir";

// home juga memuat katalog jasa; cukup kosong untuk test ini
vi.mock("../api/jasa", () => ({ listJasa: vi.fn(async () => []) }));
vi.mock("../api/berita", () => ({ listBerita: vi.fn() }));
vi.mock("../api/testimoni", () => ({ listTestimoni: vi.fn() }));
// getKontak di-mock; linkWhatsApp tetap fungsi aslinya
vi.mock("../api/kontak", async (importOriginal) => ({ ...(await importOriginal()), getKontak: vi.fn() }));

import Home from "./home";
import PublicLayout from "../components/PublicLayout";
import { listBerita } from "../api/berita";
import { listTestimoni } from "../api/testimoni";
import { listJasa } from "../api/jasa";
import { getKontak } from "../api/kontak";

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
  listTestimoni.mockResolvedValue([]);
  getKontak.mockResolvedValue({ nomor_wa: "628123456789", template_pesan: "Halo Humas LISTRA, saya tertarik dengan {jasa}." });
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

describe("Halaman Home: Testimoni", () => {
  it("menampilkan 3 testimoni terbaru dari API", async () => {
    listBerita.mockResolvedValue([]);
    listTestimoni.mockResolvedValue(
      [1, 2, 3, 4].map((id) => ({ id_testimoni: id, nama_klien: `Klien ${id}`, isi_testimoni: "isi", rating: 5 })),
    );
    renderRoute(Home);

    expect(await screen.findByText("Klien 1")).toBeTruthy();
    expect(screen.getByText("Klien 3")).toBeTruthy();
    expect(screen.queryByText("Klien 4")).toBeNull();
  });
});

describe("Halaman Home: video & foto penampilan LISTRA", () => {
  it("pembuka memakai video Tari Bajidor dengan tombol jeda; foto profil dari penampilan LISTRA, bukan foto jasa", async () => {
    listBerita.mockResolvedValue([]);
    listJasa.mockResolvedValue([
      { id_jasa: 2, nama: "Gamelan Sunda", tipe_jasa: "musik", link_image: "/uploads/gamelan.jpg", kecocokan: [] },
    ]);
    const { container } = renderRoute(Home);

    expect(await screen.findByRole("heading", { level: 1, name: "Tari dan Musik Tradisional untuk Acara Anda" })).toBeTruthy();
    const video = container.querySelector("video");
    expect(video.getAttribute("src")).toMatch(/tari-bajidor-latar/);
    expect(video.getAttribute("poster")).toMatch(/tari-bajidor-latar/);
    // video bergerak lebih dari 5 detik, jadi wajib ada tombol jeda/putar
    expect(screen.getByRole("button", { name: /video/ })).toBeTruthy();
    expect(screen.getByAltText(/Tari Bajidor Kahot/).getAttribute("src")).toMatch(/tari-bajidor-foto/);
  });
});

describe("Halaman Home: Hubungi Kami", () => {
  const LINK_WA = "https://wa.me/628123456789?text=Halo%20Humas%20LISTRA%2C%20saya%20tertarik%20dengan%20jasa%20LISTRA.";

  // tombol Hubungi Kami dan footer ada di PublicLayout, jadi Beranda dirender di dalamnya
  it("tombol Hubungi Kami dan link WhatsApp Humas di footer membuka WhatsApp, bukan /jadwal", async () => {
    listBerita.mockResolvedValue([]);
    renderRoute(() => (
      <PublicLayout>
        <Home />
      </PublicLayout>
    ));

    const tombol = await screen.findByRole("link", { name: "Hubungi Humas LISTRA lewat WhatsApp (tab baru)" });
    expect(tombol.getAttribute("href")).toBe(LINK_WA);
    expect(tombol.getAttribute("target")).toBe("_blank");
    expect(tombol.textContent).not.toMatch(/☏/);
    expect(screen.getByRole("link", { name: "WhatsApp Humas" }).getAttribute("href")).toBe(LINK_WA);
  });

  it("kontak belum tersedia: tombol dan link WhatsApp tidak ditampilkan", async () => {
    listBerita.mockResolvedValue([]);
    getKontak.mockRejectedValue(new Error("Kontak WhatsApp belum tersedia."));
    renderRoute(() => (
      <PublicLayout>
        <Home />
      </PublicLayout>
    ));

    expect(await screen.findByText("Belum ada berita.")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /lewat WhatsApp/ })).toBeNull();
    expect(screen.queryByRole("link", { name: "WhatsApp Humas" })).toBeNull();
  });
});

describe("Pembuka Beranda: video layar penuh", () => {
  const pembuka = () => document.querySelector('section[aria-labelledby="judul-beranda"]');
  afterEach(() => aturGulir(0));

  it("paling atas: hanya video, tapi judul tetap ada untuk pembaca layar", () => {
    listBerita.mockResolvedValue([]);
    renderRoute(Home);
    expect(pembuka().dataset.terungkap).toBe("false");
    expect(screen.getByRole("heading", { level: 1, name: "Tari dan Musik Tradisional untuk Acara Anda" })).toBeTruthy();
  });

  it("digulir 1px: teks dan bayangan hitam muncul; kembali ke atas: video saja", () => {
    listBerita.mockResolvedValue([]);
    renderRoute(Home);
    gulirKe(1);
    expect(pembuka().dataset.terungkap).toBe("true");
    gulirKe(0);
    expect(pembuka().dataset.terungkap).toBe("false");
  });

  it("dimuat ulang di tengah halaman: teks langsung tampil", () => {
    listBerita.mockResolvedValue([]);
    aturGulir(300);
    renderRoute(Home);
    expect(pembuka().dataset.terungkap).toBe("true");
  });
});
