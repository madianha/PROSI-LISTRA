import { fireEvent, screen, waitFor } from "@solidjs/testing-library";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderRoute } from "../../test/renderRoute";

vi.mock("../../api/berita", () => ({
  listBerita: vi.fn(),
  deleteBerita: vi.fn(),
  setPublik: vi.fn(),
}));

import InternalBerita from "./berita";
import { deleteBerita, listBerita, setPublik } from "../../api/berita";

const daftar = [
  {
    id_berita: 1,
    judul: "LISTRA Juara 1",
    tanggal: "2023-12-01",
    url_gambar: "https://unpar.ac.id/gambar.jpg",
    konten: null,
    sumber: "unpar.ac.id",
    url_artikel: "https://unpar.ac.id/listra-juara",
    is_publik: true,
  },
  {
    id_berita: 2,
    judul: "Persiapan Gelar Karya",
    tanggal: "2026-10-10",
    url_gambar: "/uploads/sampul.jpg",
    konten: "<p>isi</p>",
    sumber: null,
    url_artikel: null,
    is_publik: false,
  },
];

beforeEach(() => {
  vi.resetAllMocks();
});

function renderHalaman() {
  return renderRoute(InternalBerita, { path: "/internal/berita" });
}

const saklar = (judul) => screen.getByRole("switch", { name: `Publik: ${judul}` });

describe("Kelola Berita", () => {
  it("meminta semua berita termasuk draf", async () => {
    listBerita.mockResolvedValue(daftar);
    renderHalaman();
    await screen.findByText("LISTRA Juara 1");
    expect(listBerita).toHaveBeenCalledWith({ semua: true });
  });

  it("menampilkan baris dengan jenis, tanggal, dan link Ubah", async () => {
    listBerita.mockResolvedValue(daftar);
    renderHalaman();

    expect(await screen.findByText("LISTRA Juara 1")).toBeTruthy();
    expect(screen.getByText("Tautan")).toBeTruthy();
    expect(screen.getByText("Artikel")).toBeTruthy();
    expect(screen.getByText("10 Okt 2026")).toBeTruthy();

    const ubah = screen.getAllByRole("link", { name: /Ubah/ });
    expect(ubah.map((a) => a.getAttribute("href"))).toEqual([
      "/internal/berita/1/ubah",
      "/internal/berita/2/ubah",
    ]);
  });

  it("Hapus meminta konfirmasi dulu, Batal tidak menghapus", async () => {
    listBerita.mockResolvedValue(daftar);
    renderHalaman();

    const [hapusPertama] = await screen.findAllByRole("button", { name: /Hapus/ });
    fireEvent.click(hapusPertama);
    expect(screen.getByText("Hapus berita ini?")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Batal" }));
    expect(screen.queryByText("Hapus berita ini?")).toBeNull();
    expect(deleteBerita).not.toHaveBeenCalled();
  });

  it("Ya, hapus memanggil deleteBerita lalu memuat ulang daftar", async () => {
    listBerita.mockResolvedValueOnce(daftar).mockResolvedValueOnce([daftar[1]]);
    deleteBerita.mockResolvedValue(null);
    renderHalaman();

    const [hapusPertama] = await screen.findAllByRole("button", { name: /Hapus/ });
    fireEvent.click(hapusPertama);
    fireEvent.click(screen.getByRole("button", { name: "Ya, hapus" }));

    await waitFor(() => expect(screen.queryByText("LISTRA Juara 1")).toBeNull());
    expect(deleteBerita).toHaveBeenCalledWith(1);
    expect(listBerita).toHaveBeenCalledTimes(2);
  });

  it("menampilkan pesan bila gagal menghapus", async () => {
    listBerita.mockResolvedValue(daftar);
    deleteBerita.mockRejectedValue(new Error("Berita tidak ditemukan."));
    renderHalaman();

    const [hapusPertama] = await screen.findAllByRole("button", { name: /Hapus/ });
    fireEvent.click(hapusPertama);
    fireEvent.click(screen.getByRole("button", { name: "Ya, hapus" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Berita tidak ditemukan.");
  });

  it("menampilkan pesan bila belum ada berita", async () => {
    listBerita.mockResolvedValue([]);
    renderHalaman();
    expect(await screen.findByText("Belum ada berita.")).toBeTruthy();
  });
});

describe("Kelola Berita - toggle Publik", () => {
  const dialog = () => screen.queryByRole("dialog");

  async function bukaHalaman() {
    listBerita.mockResolvedValue(daftar);
    renderHalaman();
    await screen.findByText("LISTRA Juara 1");
  }

  it("menampilkan status publik tiap berita", async () => {
    await bukaHalaman();
    expect(saklar("LISTRA Juara 1").getAttribute("aria-checked")).toBe("true");
    expect(saklar("Persiapan Gelar Karya").getAttribute("aria-checked")).toBe("false");
  });

  it("klik saklar draf: muncul konfirmasi 'menjadi Publik', belum menyimpan", async () => {
    await bukaHalaman();
    fireEvent.click(saklar("Persiapan Gelar Karya"));

    expect(
      screen.getByRole("dialog", {
        name: "Apakah Anda yakin mengubah “Persiapan Gelar Karya” menjadi Publik?",
      }),
    ).toBeTruthy();
    expect(setPublik).not.toHaveBeenCalled();
    expect(saklar("Persiapan Gelar Karya").getAttribute("aria-checked")).toBe("false");
    // fokus ke Batal agar Enter tidak langsung mengubah
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Batal" }));
  });

  it("klik saklar publik: konfirmasi 'menjadi TIDAK Publik'", async () => {
    await bukaHalaman();
    fireEvent.click(saklar("LISTRA Juara 1"));

    expect(
      screen.getByRole("dialog", {
        name: "Apakah Anda yakin mengubah “LISTRA Juara 1” menjadi TIDAK Publik?",
      }),
    ).toBeTruthy();
  });

  it("Ya, ubah: memanggil setPublik lalu memperbarui saklar", async () => {
    setPublik.mockResolvedValue({ ...daftar[1], is_publik: true });
    await bukaHalaman();

    fireEvent.click(saklar("Persiapan Gelar Karya"));
    fireEvent.click(screen.getByRole("button", { name: "Ya, ubah" }));

    expect(dialog()).toBeNull();
    await waitFor(() =>
      expect(saklar("Persiapan Gelar Karya").getAttribute("aria-checked")).toBe("true"),
    );
    expect(setPublik).toHaveBeenCalledWith(2, true);
    // tidak memuat ulang seluruh daftar
    expect(listBerita).toHaveBeenCalledTimes(1);
  });

  it("Batal: jendela tertutup dan tidak ada yang berubah", async () => {
    await bukaHalaman();
    fireEvent.click(saklar("LISTRA Juara 1"));
    fireEvent.click(screen.getByRole("button", { name: "Batal" }));

    expect(dialog()).toBeNull();
    expect(setPublik).not.toHaveBeenCalled();
    expect(saklar("LISTRA Juara 1").getAttribute("aria-checked")).toBe("true");
  });

  it("tombol Esc juga membatalkan", async () => {
    await bukaHalaman();
    fireEvent.click(saklar("LISTRA Juara 1"));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(dialog()).toBeNull();
    expect(setPublik).not.toHaveBeenCalled();
  });

  it("klik di luar jendela juga membatalkan", async () => {
    await bukaHalaman();
    fireEvent.click(saklar("LISTRA Juara 1"));
    // latar gelap = elemen induk dari dialog
    fireEvent.click(dialog().parentElement);

    expect(dialog()).toBeNull();
    expect(setPublik).not.toHaveBeenCalled();
  });

  it("bila gagal disimpan, saklar tetap dan pesan error tampil", async () => {
    setPublik.mockRejectedValue(new Error("Terjadi kesalahan pada server."));
    await bukaHalaman();

    fireEvent.click(saklar("LISTRA Juara 1"));
    fireEvent.click(screen.getByRole("button", { name: "Ya, ubah" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Terjadi kesalahan pada server.");
    expect(saklar("LISTRA Juara 1").getAttribute("aria-checked")).toBe("true");
  });
});
