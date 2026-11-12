import { fireEvent, screen, waitFor } from "@solidjs/testing-library";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderRoute } from "../../test/renderRoute";

vi.mock("../../api/anggota", () => ({
  listAnggota: vi.fn(),
  getSpesialisasiList: vi.fn(),
  createAnggota: vi.fn(),
  updateAnggota: vi.fn(),
  toggleStatusAktif: vi.fn(),
}));

import InternalAnggota from "./anggota";
import {
  getSpesialisasiList,
  listAnggota,
  toggleStatusAktif,
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
    peran: "Anggota Biasa",
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
        angkatan: "Semua",
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

    const resetButton = screen.getByTitle("Reset Filter");
    fireEvent.click(resetButton);

    expect(searchInput.value).toBe("");

    await vi.advanceTimersByTimeAsync(500);
    expect(listAnggota).toHaveBeenLastCalledWith(
      expect.objectContaining({
        search: "",
        peran: "Semua",
        angkatan: "Semua",
      })
    );

    vi.useRealTimers();
  });
});
