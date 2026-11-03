import { fireEvent, render, screen } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import AnggotaTable from "./AnggotaTable";

const sampleData = [
  {
    id_anggota: 1,
    nama: "Alexander Haryanto",
    email: "alexander@unpar.ac.id",
    no_hp: "081234567890",
    npm: "6182101001",
    angkatan_unpar: 2021,
    peran: "Kepengurusan",
    jabatan: "Ketua Umum",
    is_aktif: true,
    spesialisasi: [
      { id_spesialisasi: 1, nama_spesialisasi: "Tari Saman", kategori: "TARI" },
      { id_spesialisasi: 2, nama_spesialisasi: "Gamelan Jawa", kategori: "MUSIK" },
    ],
  },
  {
    id_anggota: 2,
    nama: "Budi Santoso",
    email: "",
    no_hp: "",
    npm: null,
    angkatan_unpar: null,
    peran: "Anggota Biasa",
    jabatan: null,
    is_aktif: false,
    spesialisasi: [],
  },
];

describe("AnggotaTable Component", () => {
  it("merender tabel data anggota dengan rapi tanpa emoji pada pill spesialisasi", () => {
    const onToggleStatus = vi.fn();
    const onEdit = vi.fn();

    render(() => (
      <AnggotaTable
        data={sampleData}
        updatingStatusId={null}
        onToggleStatus={onToggleStatus}
        onEdit={onEdit}
      />
    ));

    expect(screen.getByText("Alexander Haryanto")).toBeDefined();
    expect(screen.getByText("Ketua Umum")).toBeDefined();
    expect(screen.getByText("Tari Saman")).toBeDefined();
    expect(screen.getByText("Gamelan Jawa")).toBeDefined();

    // Pastikan tidak ada emoji tersisa di pill spesialisasi
    expect(screen.queryByText(/💃/)).toBeNull();
    expect(screen.queryByText(/🎵/)).toBeNull();

    // Cek label status memiliki fixed width w-16
    const aktifLabel = screen.getByText("Aktif");
    expect(aktifLabel.className).toContain("w-16");
    expect(aktifLabel.className).toContain("inline-block");

    const nonAktifLabel = screen.getByText("Non-aktif");
    expect(nonAktifLabel.className).toContain("w-16");

    // Klik tombol ubah
    const ubahButtons = screen.getAllByRole("button", { name: /ubah/i });
    fireEvent.click(ubahButtons[0]);
    expect(onEdit).toHaveBeenCalledWith(sampleData[0]);

    // Klik toggle
    const toggleButtons = screen.getAllByRole("switch");
    fireEvent.click(toggleButtons[0]);
    expect(onToggleStatus).toHaveBeenCalledWith(sampleData[0]);
  });
});