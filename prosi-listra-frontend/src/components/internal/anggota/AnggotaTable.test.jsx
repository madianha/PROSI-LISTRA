import { render, screen } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import AnggotaTable from "./AnggotaTable";

describe("AnggotaTable Specializations Display", () => {
  const dummyAnggota = [
    {
      id_anggota: 1,
      nama: "Aditya",
      email: "aditya@student.unpar.ac.id",
      npm: "6182301001",
      angkatan_unpar: 2023,
      peran: "Admin",
      jabatan: "Ketua",
      is_aktif: true,
      spesialisasi: [
        {
          id_jasa: 1,
          id_spesialisasi: 1,
          nama_spesialisasi: "Tari Jaipong Rampak",
          nama_jasa: "Tari Jaipong Rampak",
          kategori: "Tari",
          tipe_jasa: "Tari",
        },
        {
          id_jasa: 4,
          id_spesialisasi: 4,
          nama_spesialisasi: "Gamelan Sunda Salendro",
          nama_jasa: "Gamelan Sunda Salendro",
          kategori: "Musik",
          tipe_jasa: "Musik",
        },
      ],
    },
    {
      id_anggota: 2,
      nama: "Budi Santoso",
      email: "budi@student.unpar.ac.id",
      npm: "6182101002",
      angkatan_unpar: 2021,
      peran: "Anggota Biasa",
      jabatan: null,
      is_aktif: true,
      spesialisasi: [],
    },
  ];

  it("renders specializations with case-insensitive matching and '-' for empty list", () => {
    render(() => (
      <AnggotaTable
        data={dummyAnggota}
        updatingStatusId={null}
        onToggleStatus={vi.fn()}
        onEdit={vi.fn()}
      />
    ));

    expect(screen.getByText("Tari Jaipong Rampak")).toBeDefined();
    expect(screen.getByText("Gamelan Sunda Salendro")).toBeDefined();
    expect(screen.getByText("-")).toBeDefined();
  });
});
