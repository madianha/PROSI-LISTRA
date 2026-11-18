import { fireEvent, screen, waitFor, within } from "@solidjs/testing-library";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderRoute } from "../../test/renderRoute";

vi.mock("../../api/anggota", () => ({
  listAnggota: vi.fn(),
  getSpesialisasiList: vi.fn(),
  createAnggota: vi.fn(),
  updateAnggota: vi.fn(),
  toggleStatusAktif: vi.fn(),
  bolehAturPassword: vi.fn(() => false),
}));

import InternalAnggota from "./anggota";
import {
  bolehAturPassword,
  getSpesialisasiList,
  listAnggota,
  toggleStatusAktif,
  updateAnggota,
} from "../../api/anggota";

const mockAnggotaList = [
  {
    id_anggota: 1,
    nama: "Budi Santoso",
    email: "budi@unpar.ac.id",
    npm: "6182001001",
    peran: "Kepengurusan",
    jabatan: "Ketua",
    angkatan_unpar: 2020,
    is_aktif: true,
    spesialisasi: [{ id_jasa: 1, nama_jasa: "Tari Jaipong", tipe_jasa: "TARI" }],
  },
  {
    id_anggota: 2,
    nama: "Siti Rahma",
    email: "siti@unpar.ac.id",
    npm: "6182001002",
    peran: "Anggota",
    jabatan: "",
    angkatan_unpar: 2021,
    is_aktif: false,
    spesialisasi: [{ id_jasa: 2, nama_jasa: "Gamelan Degung", tipe_jasa: "MUSIK" }],
  },
];

beforeEach(() => {
  vi.resetAllMocks();
  vi.useRealTimers();
  getSpesialisasiList.mockResolvedValue([]);
});

function renderHalaman() {
  return renderRoute(InternalAnggota, { path: "/internal/anggota" });
}

describe("Internal Anggota Management", () => {
  it("merender daftar anggota dari API saat inisialisasi", async () => {
    listAnggota.mockResolvedValue(mockAnggotaList);
    renderHalaman();

    expect(await screen.findByText("Budi Santoso")).toBeTruthy();
    expect(screen.getByText("Siti Rahma")).toBeTruthy();
    expect(screen.getByText("6182001001")).toBeTruthy();
  });

  it("menerapkan debounce pada pencarian anggota (300ms)", async () => {
    vi.useFakeTimers();
    listAnggota.mockResolvedValue(mockAnggotaList);
    renderHalaman();

    // Tunggu render awal
    await vi.runAllTimersAsync();
    expect(listAnggota).toHaveBeenCalledTimes(1); // initial query

    const searchInput = screen.getByPlaceholderText("Cari nama, NPM, atau email...");
    fireEvent.input(searchInput, { target: { value: "B" } });
    fireEvent.input(searchInput, { target: { value: "Bu" } });
    fireEvent.input(searchInput, { target: { value: "Budi" } });

    // Belum lewat 300ms, API pencarian belum terpanggil lagi
    expect(listAnggota).toHaveBeenCalledTimes(1);

    // Majukan 299ms
    await vi.advanceTimersByTimeAsync(299);
    expect(listAnggota).toHaveBeenCalledTimes(1);

    // Majukan 1ms lagi (total 300ms)
    await vi.advanceTimersByTimeAsync(1);
    expect(listAnggota).toHaveBeenCalledTimes(2);
    expect(listAnggota).toHaveBeenLastCalledWith(
      expect.objectContaining({
        search: "Budi",
        peran: "Semua",
        angkatan: "",
      })
    );

    vi.useRealTimers();
  });

  it("mempertahankan baris tabel saat proses pencarian baru berjalan (tidak unmount)", async () => {
    vi.useFakeTimers();
    let resolveSearch;
    listAnggota
      .mockResolvedValueOnce(mockAnggotaList) // initial list
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSearch = resolve;
          })
      );

    renderHalaman();
    await vi.runAllTimersAsync();

    expect(screen.getByText("Budi Santoso")).toBeTruthy();

    const searchInput = screen.getByPlaceholderText("Cari nama, NPM, atau email...");
    fireEvent.input(searchInput, { target: { value: "Siti" } });

    // Lewati 300ms debounce
    await vi.advanceTimersByTimeAsync(300);

    // Query in-flight: data tabel tetap harus ada di DOM (tidak di-unmount jadi 'Memuat data...')
    expect(screen.getByText("Budi Santoso")).toBeTruthy();

    // Selesaikan request dengan hasil filtered
    resolveSearch([mockAnggotaList[1]]);
    await vi.runAllTimersAsync();

    expect(screen.getByText("Siti Rahma")).toBeTruthy();
    expect(screen.queryByText("Budi Santoso")).toBeNull();

    vi.useRealTimers();
  });

  it("menampilkan status kosong jika pencarian selesai tanpa hasil", async () => {
    vi.useFakeTimers();
    listAnggota
      .mockResolvedValueOnce(mockAnggotaList)
      .mockResolvedValueOnce([]); // hasil pencarian kosong

    renderHalaman();
    await vi.runAllTimersAsync();

    const searchInput = screen.getByPlaceholderText("Cari nama, NPM, atau email...");
    fireEvent.input(searchInput, { target: { value: "TidakAda" } });

    await vi.advanceTimersByTimeAsync(300);
    await vi.runAllTimersAsync();

    expect(
      screen.getByText("Tidak ada data anggota yang cocok dengan filter.")
    ).toBeTruthy();

    vi.useRealTimers();
  });

  it("mereset pencarian dan membatalkan debounce saat tombol reset ditekan", async () => {
    vi.useFakeTimers();
    listAnggota.mockResolvedValue(mockAnggotaList);
    renderHalaman();
    await vi.runAllTimersAsync();

    const searchInput = screen.getByPlaceholderText("Cari nama, NPM, atau email...");
    fireEvent.input(searchInput, { target: { value: "Budi" } });
    expect(searchInput.value).toBe("Budi");

    const angkatanInput = screen.getByPlaceholderText(/Cari tahun/i);
    fireEvent.input(angkatanInput, { target: { value: "1999" } });
    expect(angkatanInput.value).toBe("1999");

    const resetButton = screen.getByTitle("Reset Filter");
    fireEvent.click(resetButton);

    expect(searchInput.value).toBe("");
    expect(angkatanInput.value).toBe("");

    await vi.advanceTimersByTimeAsync(500);
    expect(listAnggota).toHaveBeenLastCalledWith(
      expect.objectContaining({
        search: "",
        peran: "Semua",
        angkatan: "",
      })
    );

    vi.useRealTimers();
  });

  it("tidak menampilkan opsi peran Admin pada modal Tambah Anggota Baru", async () => {
    listAnggota.mockResolvedValue(mockAnggotaList);
    renderHalaman();

    expect(await screen.findByText("Budi Santoso")).toBeTruthy();

    fireEvent.click(screen.getByText("Tambah Anggota"));

    const dialog = await screen.findByRole("dialog");
    const roleSelect = dialog.querySelector("select");
    const options = Array.from(roleSelect.querySelectorAll("option")).map((o) => o.value);
    expect(options).not.toContain("Admin");
    expect(options).toEqual(["Kepengurusan", "Pelatih", "Anggota", "Alumni"]);
  });

  it("kolom kata sandi tampil untuk Admin/LISTRA", async () => {
    bolehAturPassword.mockReturnValue(true);
    listAnggota.mockResolvedValue(mockAnggotaList);
    renderHalaman();

    expect(await screen.findByText("Budi Santoso")).toBeTruthy();
    fireEvent.click(screen.getByText("Tambah Anggota"));

    const dialog = await screen.findByRole("dialog");
    expect(dialog.querySelector('input[type="password"]')).toBeTruthy();
  });

  it("kolom kata sandi tidak tampil untuk peran lain", async () => {
    bolehAturPassword.mockReturnValue(false);
    listAnggota.mockResolvedValue(mockAnggotaList);
    renderHalaman();

    expect(await screen.findByText("Budi Santoso")).toBeTruthy();
    fireEvent.click(screen.getByText("Tambah Anggota"));

    const dialog = await screen.findByRole("dialog");
    expect(dialog.querySelector('input[type="password"]')).toBeNull();
  });

  it("menyimpan perubahan anggota lalu menutup modal tanpa error", async () => {
    listAnggota.mockResolvedValue(mockAnggotaList);
    updateAnggota.mockResolvedValue({ ...mockAnggotaList[0], nama: "Budi Baru" });
    renderHalaman();

    expect(await screen.findByText("Budi Santoso")).toBeTruthy();
    fireEvent.click(screen.getAllByText("Ubah")[0]);

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByText("Simpan Perubahan"));

    await waitFor(() => expect(updateAnggota).toHaveBeenCalledWith(1, expect.any(Object)));
    expect(await screen.findByText("Budi Baru")).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("mendukung pencarian spesialisasi seni, strip terpilih, reset, dan filter kategori secara real-time", async () => {
    const mockSpesialisasi = [
      { id_jasa: 1, nama_jasa: "Tari Jaipong", tipe_jasa: "TARI", kategori: "TARI" },
      { id_jasa: 2, nama_jasa: "Tari Saman", tipe_jasa: "TARI", kategori: "TARI" },
      { id_jasa: 3, nama_jasa: "Gamelan Degung", tipe_jasa: "MUSIK", kategori: "MUSIK" },
      { id_jasa: 4, nama_jasa: "Angklung", tipe_jasa: "MUSIK", kategori: "MUSIK" },
    ];
    getSpesialisasiList.mockResolvedValue(mockSpesialisasi);
    listAnggota.mockResolvedValue(mockAnggotaList);
    renderHalaman();

    expect(await screen.findByText("Budi Santoso")).toBeTruthy();
    fireEvent.click(screen.getByText("Tambah Anggota"));

    const dialog = await screen.findByRole("dialog");

    // Pastikan header kategori menampilkan hitungan awal (2 Tari, 2 Musik)
    expect(await within(dialog).findByText("SPESIALISASI TARI (2)")).toBeTruthy();
    expect(within(dialog).getByText("SPESIALISASI MUSIK (2)")).toBeTruthy();

    const searchInput = within(dialog).getByPlaceholderText("Cari nama tari atau alat musik...");

    // 1. Pilih Tari Jaipong (id: 1)
    const jaipongPill = within(dialog).getByRole("button", { name: "Tari Jaipong" });
    fireEvent.click(jaipongPill);

    // Strip terpilih tampil
    expect(within(dialog).getByText(/Terpilih \(1\):/i)).toBeTruthy();
    expect(within(dialog).getByTitle("Hapus Tari Jaipong")).toBeTruthy();

    // 2. Filter pencarian: "angklung"
    fireEvent.input(searchInput, { target: { value: "angklung" } });

    // Tari tidak cocok -> disembunyikan; Musik hanya tampil Angklung (1)
    expect(within(dialog).queryByText(/SPESIALISASI TARI/i)).toBeNull();
    expect(within(dialog).getByText("SPESIALISASI MUSIK (1)")).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: "Angklung" })).toBeTruthy();
    expect(within(dialog).queryByRole("button", { name: "Gamelan Degung" })).toBeNull();

    // Di strip terpilih, Tari Jaipong tetap terlihat dan bisa dihapus
    expect(within(dialog).getByTitle("Hapus Tari Jaipong")).toBeTruthy();

    // Pilih juga Angklung (id: 4)
    fireEvent.click(within(dialog).getByRole("button", { name: "Angklung" }));
    expect(within(dialog).getByText(/Terpilih \(2\):/i)).toBeTruthy();

    // 3. Tombol clear (×) pada search bar
    const clearSearchBtn = within(dialog).getByLabelText("Hapus pencarian");
    fireEvent.click(clearSearchBtn);
    expect(searchInput.value).toBe("");

    // Kedua kategori tampil kembali penuh
    expect(within(dialog).getByText("SPESIALISASI TARI (2)")).toBeTruthy();
    expect(within(dialog).getByText("SPESIALISASI MUSIK (2)")).toBeTruthy();

    // 4. Hapus Tari Jaipong lewat tombol pill di strip terpilih
    fireEvent.click(within(dialog).getByTitle("Hapus Tari Jaipong"));
    expect(within(dialog).getByText(/Terpilih \(1\):/i)).toBeTruthy();
    expect(within(dialog).queryByTitle("Hapus Tari Jaipong")).toBeNull();
    expect(within(dialog).getByTitle("Hapus Angklung")).toBeTruthy();

    // 5. Tombol Reset untuk mengosongkan semua pilihan
    const resetBtn = within(dialog).getByRole("button", { name: "Reset" });
    fireEvent.click(resetBtn);
    expect(within(dialog).queryByText(/Terpilih \(/i)).toBeNull();

    // 6. Pencarian tanpa hasil -> pesan status kosong
    fireEvent.input(searchInput, { target: { value: "xyz123" } });
    expect(within(dialog).queryByText(/SPESIALISASI TARI/i)).toBeNull();
    expect(within(dialog).queryByText(/SPESIALISASI MUSIK/i)).toBeNull();
    expect(
      within(dialog).getByText('Tidak ada spesialisasi yang cocok dengan "xyz123".')
    ).toBeTruthy();
  });
});
