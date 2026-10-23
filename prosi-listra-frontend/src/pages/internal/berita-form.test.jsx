import { fireEvent, screen, waitFor } from "@solidjs/testing-library";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderRoute } from "../../test/renderRoute";

vi.mock("../../api/berita", () => ({
  getBerita: vi.fn(),
  createBerita: vi.fn(),
  updateBerita: vi.fn(),
  uploadGambar: vi.fn(),
}));

// ambilKonten palsu; undefined = pakai isi textarea apa adanya
const editorPalsu = vi.hoisted(() => ({ ambilKonten: undefined }));

// TinyMCE tidak bisa jalan di jsdom, diganti textarea biasa
vi.mock("../../components/internal/RichTextEditor", () => ({
  default: (props) => {
    if (editorPalsu.ambilKonten) props.ref?.({ ambilKonten: editorPalsu.ambilKonten });
    return (
      <textarea
        aria-label="Konten artikel"
        value={props.value}
        onInput={(e) => props.onChange(e.currentTarget.value)}
      />
    );
  },
}));

import InternalBeritaForm from "./berita-form";
import { createBerita, getBerita, updateBerita, uploadGambar } from "../../api/berita";

beforeEach(() => {
  vi.resetAllMocks();
  editorPalsu.ambilKonten = undefined;
});

function renderBaru() {
  return renderRoute(InternalBeritaForm, { path: "/internal/berita/baru" });
}

function isi(label, nilai) {
  fireEvent.input(screen.getByLabelText(label), { target: { value: nilai } });
}

async function unggahSampul() {
  uploadGambar.mockResolvedValue("/uploads/sampul.jpg");
  const file = new File(["x"], "sampul.jpg", { type: "image/jpeg" });
  fireEvent.change(screen.getByLabelText(/Pilih gambar/), { target: { files: [file] } });
  await screen.findByAltText("Pratinjau sampul");
  return file;
}

/** Isi artikel minimal yang valid. */
async function isiArtikelValid() {
  isi("Judul", "Persiapan Gelar Karya");
  isi("Tanggal", "2026-10-10");
  isi("Konten artikel", "<p>Latihan dimulai.</p>");
  await unggahSampul();
}

describe("Berita Baru - toggle Publik", () => {
  it("ada di paling atas form dan mulai mati (draf)", () => {
    renderBaru();
    const saklar = screen.getByRole("switch", { name: "Publik" });
    const jenis = screen.getByRole("button", { name: /Artikel/ });

    expect(saklar.getAttribute("aria-checked")).toBe("false");
    // DOCUMENT_POSITION_FOLLOWING: Jenis muncul setelah saklar Publik
    expect(saklar.compareDocumentPosition(jenis) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText("Disimpan sebagai draf, belum tampil di halaman Berita.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Simpan draf" })).toBeTruthy();
  });

  it("dinyalakan: keterangan dan tombol berubah menjadi Terbitkan", () => {
    renderBaru();
    fireEvent.click(screen.getByRole("switch", { name: "Publik" }));

    expect(screen.getByRole("switch", { name: "Publik" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByText("Langsung tampil di halaman Berita setelah disimpan.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Terbitkan" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Simpan draf" })).toBeNull();
  });

  it("mati: mengirim is_publik false", async () => {
    createBerita.mockResolvedValue({});
    renderBaru();
    await isiArtikelValid();
    fireEvent.click(screen.getByRole("button", { name: "Simpan draf" }));

    await waitFor(() => expect(createBerita).toHaveBeenCalled());
    expect(createBerita.mock.calls[0][0].is_publik).toBe(false);
  });

  it("nyala: mengirim is_publik true", async () => {
    createBerita.mockResolvedValue({});
    renderBaru();
    await isiArtikelValid();
    fireEvent.click(screen.getByRole("switch", { name: "Publik" }));
    fireEvent.click(screen.getByRole("button", { name: "Terbitkan" }));

    await waitFor(() => expect(createBerita).toHaveBeenCalled());
    expect(createBerita.mock.calls[0][0].is_publik).toBe(true);
  });
});

describe("Berita Baru", () => {
  it("Artikel adalah pilihan awal dan menampilkan editor konten", () => {
    renderBaru();
    expect(screen.getByRole("button", { name: /Artikel/ }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByLabelText("Konten artikel")).toBeTruthy();
    expect(screen.queryByLabelText("Sumber")).toBeNull();
  });

  it("memilih Tautan mengganti editor dengan Sumber dan URL artikel", () => {
    renderBaru();
    fireEvent.click(screen.getByRole("button", { name: /Tautan/ }));
    expect(screen.getByLabelText("Sumber")).toBeTruthy();
    expect(screen.getByLabelText("URL artikel")).toBeTruthy();
    expect(screen.queryByLabelText("Konten artikel")).toBeNull();
  });

  it("tidak mengirim bila kolom wajib kosong dan menampilkan pesannya", () => {
    renderBaru();
    fireEvent.click(screen.getByRole("button", { name: "Simpan draf" }));

    expect(screen.getByText("Judul wajib diisi.")).toBeTruthy();
    expect(screen.getByText("Gambar sampul wajib diunggah.")).toBeTruthy();
    expect(screen.getByText("Konten artikel wajib diisi.")).toBeTruthy();
    expect(createBerita).not.toHaveBeenCalled();
  });

  it("mengunggah sampul lewat uploadGambar dan menampilkan pratinjau", async () => {
    renderBaru();
    const file = await unggahSampul();
    expect(uploadGambar).toHaveBeenCalledWith(file);
    expect(screen.getByAltText("Pratinjau sampul").getAttribute("src")).toBe("/uploads/sampul.jpg");
  });

  it("menampilkan pesan bila unggah gagal", async () => {
    uploadGambar.mockRejectedValue(new Error("Ukuran gambar maksimal 5 MB."));
    renderBaru();
    const file = new File(["x"], "besar.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText(/Pilih gambar/), { target: { files: [file] } });
    expect(await screen.findByText("Ukuran gambar maksimal 5 MB.")).toBeTruthy();
  });

  it("artikel: mengirim persis kolom yang disepakati lalu kembali ke Kelola Berita", async () => {
    createBerita.mockResolvedValue({});
    renderBaru();
    await isiArtikelValid();
    fireEvent.click(screen.getByRole("button", { name: "Simpan draf" }));

    await waitFor(() => expect(createBerita).toHaveBeenCalled());
    expect(createBerita).toHaveBeenCalledWith({
      judul: "Persiapan Gelar Karya",
      tanggal: "2026-10-10",
      url_gambar: "/uploads/sampul.jpg",
      konten: "<p>Latihan dimulai.</p>",
      sumber: null,
      url_artikel: null,
      is_publik: false,
    });
    expect((await screen.findByTestId("lokasi")).textContent).toBe("/internal/berita");
  });

  it("tautan: mengirim sumber dan url_artikel, konten null", async () => {
    createBerita.mockResolvedValue({});
    renderBaru();

    fireEvent.click(screen.getByRole("switch", { name: "Publik" }));
    fireEvent.click(screen.getByRole("button", { name: /Tautan/ }));
    isi("Judul", "LISTRA Juara 1");
    isi("Tanggal", "2023-12-01");
    isi("Sumber", "unpar.ac.id");
    isi("URL artikel", "https://unpar.ac.id/listra-juara");
    await unggahSampul();
    fireEvent.click(screen.getByRole("button", { name: "Terbitkan" }));

    await waitFor(() =>
      expect(createBerita).toHaveBeenCalledWith({
        judul: "LISTRA Juara 1",
        tanggal: "2023-12-01",
        url_gambar: "/uploads/sampul.jpg",
        konten: null,
        sumber: "unpar.ac.id",
        url_artikel: "https://unpar.ac.id/listra-juara",
        is_publik: true,
      }),
    );
  });

  it("menunggu unggahan gambar di konten selesai sebelum menyimpan", async () => {
    // isi akhir dari editor: gambar blob sudah diganti alamat /uploads
    editorPalsu.ambilKonten = vi.fn().mockResolvedValue('<p><img src="/uploads/isi.png"></p>');
    createBerita.mockResolvedValue({});
    renderBaru();

    isi("Judul", "Judul");
    isi("Konten artikel", '<p><img src="blob:http://localhost/123"></p>');
    await unggahSampul();
    fireEvent.click(screen.getByRole("button", { name: "Simpan draf" }));

    await waitFor(() => expect(createBerita).toHaveBeenCalled());
    expect(editorPalsu.ambilKonten).toHaveBeenCalled();
    expect(createBerita.mock.calls[0][0].konten).toBe('<p><img src="/uploads/isi.png"></p>');
  });

  it("tidak menyimpan bila gambar di konten gagal diunggah", async () => {
    editorPalsu.ambilKonten = vi.fn().mockRejectedValue(new Error("upload gagal"));
    renderBaru();

    isi("Judul", "Judul");
    isi("Konten artikel", "<p>isi</p>");
    await unggahSampul();
    fireEvent.click(screen.getByRole("button", { name: "Simpan draf" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Ada gambar di konten yang gagal diunggah. Hapus atau unggah ulang gambar itu.",
    );
    expect(createBerita).not.toHaveBeenCalled();
  });

  it("menampilkan pesan dari server bila gagal menyimpan", async () => {
    createBerita.mockRejectedValue(new Error("Judul maksimal 255 karakter."));
    renderBaru();

    isi("Judul", "Judul");
    isi("Konten artikel", "<p>isi</p>");
    await unggahSampul();
    fireEvent.click(screen.getByRole("button", { name: "Simpan draf" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Judul maksimal 255 karakter.");
  });
});

describe("Ubah Berita", () => {
  const tautan = {
    id_berita: 7,
    judul: "LISTRA Juara 1",
    tanggal: "2023-12-01",
    url_gambar: "https://unpar.ac.id/gambar.jpg",
    konten: null,
    sumber: "unpar.ac.id",
    url_artikel: "https://unpar.ac.id/listra-juara",
    is_publik: false,
  };

  function renderUbah() {
    return renderRoute(InternalBeritaForm, {
      path: "/internal/berita/:id/ubah",
      url: "/internal/berita/7/ubah",
    });
  }

  it("membuka draf juga (semua: true) dan tidak ada toggle Publik maupun pilihan jenis", async () => {
    getBerita.mockResolvedValue(tautan);
    renderUbah();

    expect(await screen.findByDisplayValue("LISTRA Juara 1")).toBeTruthy();
    expect(getBerita).toHaveBeenCalledWith("7", { semua: true });
    expect(screen.queryByRole("switch")).toBeNull();
    expect(screen.queryByRole("button", { name: /Artikel/ })).toBeNull();
    expect(screen.getByLabelText("Sumber").value).toBe("unpar.ac.id");
  });

  it("menyimpan isi lewat updateBerita tanpa mengirim is_publik", async () => {
    getBerita.mockResolvedValue(tautan);
    updateBerita.mockResolvedValue({});
    renderUbah();

    await screen.findByDisplayValue("LISTRA Juara 1");
    isi("Judul", "LISTRA Juara 1 Nasional");
    fireEvent.click(screen.getByRole("button", { name: "Simpan perubahan" }));

    await waitFor(() =>
      expect(updateBerita).toHaveBeenCalledWith(7, {
        judul: "LISTRA Juara 1 Nasional",
        tanggal: "2023-12-01",
        url_gambar: "https://unpar.ac.id/gambar.jpg",
        konten: null,
        sumber: "unpar.ac.id",
        url_artikel: "https://unpar.ac.id/listra-juara",
      }),
    );
  });
});
