import { fireEvent, screen, waitFor, within } from "@solidjs/testing-library";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderRoute } from "../../test/renderRoute";

vi.mock("../../api/jasa", () => ({
  listJasa: vi.fn(),
  getProvinsiList: vi.fn(),
  createJasa: vi.fn(),
  updateJasa: vi.fn(),
  toggleStatusJasa: vi.fn(),
  uploadSampulJasa: vi.fn(),
}));

import InternalJasa from "./jasa";
import {
  createJasa,
  getProvinsiList,
  listJasa,
  toggleStatusJasa,
  updateJasa,
} from "../../api/jasa";

const mockProvinsiList = [
  { id_provinsi: 1, nama_provinsi: "Aceh", pulau: "Sumatera" },
  { id_provinsi: 13, nama_provinsi: "Jawa Barat", pulau: "Jawa" },
  { id_provinsi: 17, nama_provinsi: "Bali", pulau: "Bali & Nusa Tenggara" },
];

const mockJasaList = [
  {
    id_jasa: 1,
    tipe_jasa: "tari",
    nama: "Tari Merak",
    deskripsi: "Tarian Sunda yang menggambarkan keindahan burung merak.",
    posisi_pentas: ["Opening"],
    id_provinsi: 13,
    nama_provinsi: "Jawa Barat",
    pulau: "Jawa",
    durasi: 10,
    harga_minimum: 2500000,
    harga_maximum: 5000000,
    min_performer: 4,
    tautan_media: "https://youtube.com/watch?v=merak",
    foto_sampul: "/uploads/merak.jpg",
    is_aktif: true,
  },
  {
    id_jasa: 2,
    tipe_jasa: "musik",
    nama: "Gamelan Degung",
    deskripsi: "Ansambel gamelan Sunda untuk penyambutan tamu.",
    posisi_pentas: ["Middle"],
    id_provinsi: null,
    nama_provinsi: null,
    pulau: null,
    durasi: 30,
    harga_minimum: 3000000,
    harga_maximum: 5500000,
    min_performer: 6,
    tautan_media: null,
    foto_sampul: null,
    is_aktif: false,
  },
];

beforeEach(() => {
  vi.resetAllMocks();
  vi.useRealTimers();
  getProvinsiList.mockResolvedValue(mockProvinsiList);
  listJasa.mockResolvedValue(mockJasaList);
});

function renderHalaman() {
  return renderRoute(InternalJasa, { path: "/internal/jasa" });
}

describe("Internal Katalog Jasa (/internal/jasa)", () => {
  it("merender jasa aktif dan nonaktif beserta penghitung X Jasa", async () => {
    renderHalaman();

    expect(await screen.findByText("Tari Merak")).toBeTruthy();
    expect(screen.getByText("Gamelan Degung")).toBeTruthy();
    expect(screen.getByText("2 Jasa")).toBeTruthy();

    // Badge Nonaktif pada Gamelan Degung
    expect(screen.getByText("Nonaktif")).toBeTruthy();

    // Eyebrow budaya & posisi pentas
    expect(screen.getByText("TARI · JAWA BARAT · OPENING")).toBeTruthy();
    expect(screen.getByText("MUSIK · MIDDLE")).toBeTruthy();

    // Format harga Rupiah
    expect(screen.getByText("Rp 2.500.000 – Rp 5.000.000")).toBeTruthy();
    expect(screen.getByText("Rp 3.000.000 – Rp 5.500.000")).toBeTruthy();
  });

  it("memfilter daftar jasa berdasarkan kategori Semua, Tari, dan Musik serta pencarian 300ms", async () => {
    vi.useFakeTimers();
    renderHalaman();
    await vi.runAllTimersAsync();

    expect(screen.getByText("Tari Merak")).toBeTruthy();
    expect(screen.getByText("Gamelan Degung")).toBeTruthy();
    expect(screen.getByText("2 Jasa")).toBeTruthy();

    // Filter kategori Tari
    const filterGroup = screen.getByRole("group", { name: /Filter kategori jasa/i });
    fireEvent.click(within(filterGroup).getByText("Tari"));
    expect(screen.getByText("Tari Merak")).toBeTruthy();
    expect(screen.queryByText("Gamelan Degung")).toBeNull();
    expect(screen.getByText("1 Jasa")).toBeTruthy();

    // Filter kategori Musik
    fireEvent.click(within(filterGroup).getByText("Musik"));
    expect(screen.queryByText("Tari Merak")).toBeNull();
    expect(screen.getByText("Gamelan Degung")).toBeTruthy();
    expect(screen.getByText("1 Jasa")).toBeTruthy();

    // Kembali ke Semua
    fireEvent.click(within(filterGroup).getByText("Semua"));
    expect(screen.getByText("2 Jasa")).toBeTruthy();

    // Pencarian berdasarkan asal provinsi dengan debounce 300ms
    const searchInput = screen.getByPlaceholderText(
      "Cari nama jasa atau asal provinsi..."
    );
    fireEvent.input(searchInput, { target: { value: "Jawa Barat" } });

    // Sebelum 300ms belum memfilter
    await vi.advanceTimersByTimeAsync(200);
    expect(screen.getByText("2 Jasa")).toBeTruthy();

    // Setelah 300ms memfilter ke Tari Merak saja
    await vi.advanceTimersByTimeAsync(100);
    expect(screen.getByText("1 Jasa")).toBeTruthy();
    expect(screen.getByText("Tari Merak")).toBeTruthy();
    expect(screen.queryByText("Gamelan Degung")).toBeNull();

    vi.useRealTimers();
  });

  it("menampilkan Asal Provinsi (Kultur) hanya saat JENIS JASA adalah Tari pada modal", async () => {
    renderHalaman();
    expect(await screen.findByText("Tari Merak")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Tambah Jasa Baru" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Tambah Jasa Baru")).toBeTruthy();

    // Secara bawaan Tari terpilih -> Asal Provinsi (Kultur) tampil beserta optgroup pulau
    expect(within(dialog).getByLabelText("Asal Provinsi (Kultur)")).toBeTruthy();
    expect(dialog.querySelector('optgroup[label="Jawa"]')).toBeTruthy();

    // Pilih Musik -> Asal Provinsi (Kultur) disembunyikan
    fireEvent.click(within(dialog).getByRole("button", { name: /Musik/i }));
    expect(within(dialog).queryByLabelText("Asal Provinsi (Kultur)")).toBeNull();

    // Pilih kembali Tari -> Asal Provinsi (Kultur) tampil kembali
    fireEvent.click(within(dialog).getByRole("button", { name: /Tari/i }));
    expect(within(dialog).getByLabelText("Asal Provinsi (Kultur)")).toBeTruthy();
  });

  it("memvalidasi harga_maximum >= harga_minimum dan menyimpan jasa baru", async () => {
    const createdItem = {
      id_jasa: 3,
      tipe_jasa: "musik",
      nama: "Gamelan Kreasi Nusantara",
      deskripsi: "Musik kolaborasi kontemporer.",
      posisi_pentas: ["Opening", "Closing"],
      id_provinsi: null,
      nama_provinsi: null,
      pulau: null,
      durasi: 20,
      harga_minimum: 3500000,
      harga_maximum: 6000000,
      min_performer: 5,
      tautan_media: null,
      foto_sampul: null,
      is_aktif: true,
    };
    createJasa.mockResolvedValue(createdItem);

    renderHalaman();
    expect(await screen.findByText("Tari Merak")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Tambah Jasa Baru" }));
    const dialog = await screen.findByRole("dialog");

    fireEvent.click(within(dialog).getByRole("button", { name: /Musik/i }));
    fireEvent.input(within(dialog).getByLabelText("Nama Jasa"), {
      target: { value: "Gamelan Kreasi Nusantara" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: /Closing/i }));
    fireEvent.input(within(dialog).getByLabelText("Harga Minimum (Rp)"), {
      target: { value: "6000000" },
    });
    fireEvent.input(within(dialog).getByLabelText("Harga Maksimum (Rp)"), {
      target: { value: "3500000" },
    });
    fireEvent.input(within(dialog).getByLabelText("Minimal Performer"), {
      target: { value: "5" },
    });
    fireEvent.input(within(dialog).getByLabelText("Durasi Pertunjukan"), {
      target: { value: "20" },
    });

    fireEvent.click(within(dialog).getByText("Simpan Jasa"));
    expect(
      await within(dialog).findByText(
        /Harga maksimum tidak boleh lebih kecil dari harga minimum/i
      )
    ).toBeTruthy();
    expect(createJasa).not.toHaveBeenCalled();

    // Perbaiki harga lalu simpan
    fireEvent.input(within(dialog).getByLabelText("Harga Minimum (Rp)"), {
      target: { value: "3500000" },
    });
    fireEvent.input(within(dialog).getByLabelText("Harga Maksimum (Rp)"), {
      target: { value: "6000000" },
    });

    fireEvent.click(within(dialog).getByText("Simpan Jasa"));
    await waitFor(() =>
      expect(createJasa).toHaveBeenCalledWith(
        expect.objectContaining({
          tipe_jasa: "musik",
          nama: "Gamelan Kreasi Nusantara",
          posisi_pentas: ["Opening", "Closing"],
          id_provinsi: null,
          harga_minimum: 3500000,
          harga_maximum: 6000000,
          min_performer: 5,
          durasi: 20,
          is_aktif: true,
        })
      )
    );

    expect(await screen.findByText("Gamelan Kreasi Nusantara")).toBeTruthy();
    expect(screen.getByText("3 Jasa")).toBeTruthy();
  });

  it("menampilkan pesan validasi baru untuk nominal harga minimum, harga maksimum, dan durasi", async () => {
    renderHalaman();
    expect(await screen.findByText("Tari Merak")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Tambah Jasa Baru" }));
    const dialog = await screen.findByRole("dialog");

    fireEvent.click(within(dialog).getByRole("button", { name: /Musik/i }));
    fireEvent.input(within(dialog).getByLabelText("Nama Jasa"), {
      target: { value: "Ansambel Angklung" },
    });

    // 1. Validasi Harga Minimum kosong / tidak valid
    fireEvent.click(within(dialog).getByText("Simpan Jasa"));
    expect(
      within(dialog).getByText("Tolong masukkan nominal harga minimum.")
    ).toBeTruthy();

    // Isi harga minimum valid
    fireEvent.input(within(dialog).getByLabelText("Harga Minimum (Rp)"), {
      target: { value: "1000000" },
    });

    // 2. Validasi Harga Maksimum kosong / tidak valid
    fireEvent.click(within(dialog).getByText("Simpan Jasa"));
    expect(
      within(dialog).getByText("Tolong masukkan nominal harga maksimum.")
    ).toBeTruthy();

    // Isi harga maksimum valid
    fireEvent.input(within(dialog).getByLabelText("Harga Maksimum (Rp)"), {
      target: { value: "2000000" },
    });

    // 3. Validasi Durasi kosong / tidak valid
    fireEvent.click(within(dialog).getByText("Simpan Jasa"));
    expect(
      within(dialog).getByText(
        "Tolong isi durasi pertunjukan (menit) terlebih dahulu."
      )
    ).toBeTruthy();
  });

  it("mendukung pemilihan multi posisi pentas dan mencegah uncheck posisi terakhir", async () => {
    renderHalaman();
    expect(await screen.findByText("Tari Merak")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Tambah Jasa Baru" }));
    const dialog = await screen.findByRole("dialog");

    const btnOpening = within(dialog).getByRole("button", { name: "Opening" });
    const btnMiddle = within(dialog).getByRole("button", { name: "Middle" });
    const btnClosing = within(dialog).getByRole("button", { name: "Closing" });

    // Bawaan: Opening aktif (aria-pressed=true), Middle & Closing nonaktif
    expect(btnOpening.getAttribute("aria-pressed")).toBe("true");
    expect(btnMiddle.getAttribute("aria-pressed")).toBe("false");
    expect(btnClosing.getAttribute("aria-pressed")).toBe("false");

    // Klik Middle -> Opening & Middle aktif
    fireEvent.click(btnMiddle);
    expect(btnOpening.getAttribute("aria-pressed")).toBe("true");
    expect(btnMiddle.getAttribute("aria-pressed")).toBe("true");
    expect(btnClosing.getAttribute("aria-pressed")).toBe("false");

    // Klik Closing -> Opening, Middle, Closing aktif
    fireEvent.click(btnClosing);
    expect(btnOpening.getAttribute("aria-pressed")).toBe("true");
    expect(btnMiddle.getAttribute("aria-pressed")).toBe("true");
    expect(btnClosing.getAttribute("aria-pressed")).toBe("true");

    // Uncheck Opening & Middle -> hanya Closing aktif
    fireEvent.click(btnOpening);
    fireEvent.click(btnMiddle);
    expect(btnOpening.getAttribute("aria-pressed")).toBe("false");
    expect(btnMiddle.getAttribute("aria-pressed")).toBe("false");
    expect(btnClosing.getAttribute("aria-pressed")).toBe("true");

    // Coba uncheck Closing (posisi terakhir yang aktif) -> harus tetap aktif
    fireEvent.click(btnClosing);
    expect(btnClosing.getAttribute("aria-pressed")).toBe("true");
  });

  it("membuka modal Ubah Info · {nama} dan memperbarui jasa", async () => {
    updateJasa.mockResolvedValue({
      ...mockJasaList[0],
      nama: "Tari Merak Sunda",
    });

    renderHalaman();
    expect(await screen.findByText("Tari Merak")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "Ubah Info" })[0]);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Ubah Info · Tari Merak")).toBeTruthy();

    fireEvent.input(within(dialog).getByLabelText("Nama Jasa"), {
      target: { value: "Tari Merak Sunda" },
    });
    fireEvent.click(within(dialog).getByText("Simpan Jasa"));

    await waitFor(() =>
      expect(updateJasa).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ nama: "Tari Merak Sunda" })
      )
    );
    expect(await screen.findByText("Tari Merak Sunda")).toBeTruthy();
  });

  it("membuka modal konfirmasi Nonaktifkan ('Sembunyikan Tari Merak dari katalog publik?') dan mengubah status", async () => {
    toggleStatusJasa.mockResolvedValueOnce({
      ...mockJasaList[0],
      is_aktif: false,
    });

    renderHalaman();
    expect(await screen.findByText("Tari Merak")).toBeTruthy();

    // Klik Nonaktifkan pada baris Tari Merak
    fireEvent.click(screen.getByRole("button", { name: "Nonaktifkan" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Nonaktifkan", { selector: "h2" })).toBeTruthy();
    expect(dialog.textContent).toContain("Sembunyikan Tari Merak dari katalog publik?");

    // Konfirmasi Nonaktifkan di dalam modal
    const confirmBtn = within(dialog).getByRole("button", { name: "Nonaktifkan" });
    fireEvent.click(confirmBtn);

    await waitFor(() => expect(toggleStatusJasa).toHaveBeenCalledWith(1, false));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("mengaktifkan kembali jasa nonaktif secara langsung saat tombol Aktifkan ditekan", async () => {
    toggleStatusJasa.mockResolvedValueOnce({
      ...mockJasaList[1],
      is_aktif: true,
    });

    renderHalaman();
    expect(await screen.findByText("Gamelan Degung")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Aktifkan" }));

    await waitFor(() => expect(toggleStatusJasa).toHaveBeenCalledWith(2, true));
  });
});
