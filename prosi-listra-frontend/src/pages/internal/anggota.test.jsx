import { screen, waitFor } from "@solidjs/testing-library";
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
import { listAnggota, getSpesialisasiList } from "../../api/anggota";

const mockList = [
  {
    id_anggota: 1,
    nama: "Alexander Haryanto",
    email: "6182101001@student.unpar.ac.id",
    npm: "6182101001",
    no_hp: "081234567890",
    peran: "Kepengurusan",
    angkatan_unpar: 2021,
    jabatan: "Ketua Umum",
    is_aktif: true,
    spesialisasi: [],
  },
];

beforeEach(() => {
  vi.resetAllMocks();
  getSpesialisasiList.mockResolvedValue([]);
});

function renderHalaman() {
  return renderRoute(InternalAnggota, { path: "/internal/anggota" });
}

describe("Internal Anggota Page", () => {
  it("menampilkan teks memuat saat awal, lalu menampilkan data", async () => {
    listAnggota.mockResolvedValue(mockList);
    renderHalaman();
    expect(screen.getByText("Memuat data anggota...")).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText("Alexander Haryanto")).toBeDefined();
    });
  });

  it("menampilkan pesan kosong jika data kosong", async () => {
    listAnggota.mockResolvedValue([]);
    renderHalaman();

    await waitFor(() => {
      expect(screen.getByText("Tidak ada data anggota yang cocok dengan filter.")).toBeDefined();
    });
  });

  it("menampilkan pesan gagal jika fetch gagal (loading berhenti)", async () => {
    listAnggota.mockRejectedValue(new Error("Gagal mengambil data"));
    renderHalaman();

    await waitFor(() => {
      expect(screen.getByText(/Data anggota gagal dimuat/i)).toBeDefined();
    });
    expect(screen.queryByText("Memuat data anggota...")).toBeNull();
  });
});