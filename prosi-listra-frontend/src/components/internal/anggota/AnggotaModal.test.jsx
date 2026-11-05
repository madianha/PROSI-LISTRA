import { createSignal } from "solid-js";
import { fireEvent, render, screen } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import AnggotaModal from "./AnggotaModal";

vi.mock("../../../api/anggota", () => ({
  getSpesialisasiList: vi.fn().mockResolvedValue([
    { id_jasa: 101, nama_jasa: "Tari Internal Jaipong", tipe_jasa: "Tari" },
    { id_jasa: 102, nama_jasa: "Internal Gamelan", tipe_jasa: "Musik" },
  ]),
}));

describe("AnggotaModal Specializations SolidJS Reactivity and Fallback", () => {
  const dummySpecializations = [
    { id_jasa: 1, nama_jasa: "Tari Jaipong", tipe_jasa: "Tari" },
    { id_spesialisasi: 2, nama_spesialisasi: "Tari Pendet", kategori: "Tari" },
    { id_jasa: 3, nama_jasa: "Tari Piring", tipe_jasa: "tari" },
    { id_spesialisasi: 4, nama_spesialisasi: "Gamelan Sunda", kategori: "Musik" },
    { id_jasa: 5, nama_jasa: "Sasando", tipe_jasa: "alat musik" },
  ];

  it("renders specializations reactively when loaded asynchronously via signal/accessor", async () => {
    const [spesialisasi, setSpesialisasi] = createSignal([]);

    const formData = {
      nama: "Budi Santoso",
      email: "budi@student.unpar.ac.id",
      npm: "6182101001",
      peran: "Kepengurusan",
      jabatan: "Ketua",
      angkatan_unpar: "2021",
      is_aktif: true,
      spesialisasi_ids: [1, 4],
    };

    const onToggle = vi.fn();

    render(() => (
      <AnggotaModal
        isOpen={true}
        editingId={10}
        formData={formData}
        formError=""
        isSubmitting={false}
        peranOptions={["Admin", "Kepengurusan"]}
        spesialisasiList={spesialisasi}
        onClose={vi.fn()}
        setFormData={vi.fn()}
        onEmailChange={vi.fn()}
        onToggleSpesialisasi={onToggle}
        onSubmit={vi.fn()}
      />
    ));

    // Data arrives asynchronously
    setSpesialisasi(dummySpecializations);

    // Now all 5 items appear
    expect(screen.getByText("Tari Jaipong")).toBeDefined();
    expect(screen.getByText("Tari Pendet")).toBeDefined();
    expect(screen.getByText("Tari Piring")).toBeDefined();
    expect(screen.getByText("Gamelan Sunda")).toBeDefined();
    expect(screen.getByText("Sasando")).toBeDefined();

    // Check pre-selected options
    const jaipongBtn = screen.getByText("Tari Jaipong");
    expect(jaipongBtn.className).toContain("bg-red-800");

    const gamelanBtn = screen.getByText("Gamelan Sunda");
    expect(gamelanBtn.className).toContain("bg-red-800");

    // Click Sasando and verify toggle
    fireEvent.click(screen.getByText("Sasando"));
    expect(onToggle).toHaveBeenCalledWith(5);
  });

  it("uses internal fallback resource when props.spesialisasiList is missing", async () => {
    const formData = {
      nama: "Siti",
      email: "siti@student.unpar.ac.id",
      npm: "6182101002",
      peran: "Anggota Biasa",
      jabatan: "",
      angkatan_unpar: "2022",
      is_aktif: true,
      spesialisasi_ids: [],
    };

    render(() => (
      <AnggotaModal
        isOpen={true}
        editingId={null}
        formData={formData}
        formError=""
        isSubmitting={false}
        peranOptions={["Admin", "Kepengurusan"]}
        onClose={vi.fn()}
        setFormData={vi.fn()}
        onEmailChange={vi.fn()}
        onToggleSpesialisasi={vi.fn()}
        onSubmit={vi.fn()}
      />
    ));

    // Wait for internal resource
    const tariInternal = await screen.findByText("Tari Internal Jaipong");
    expect(tariInternal).toBeDefined();
    expect(await screen.findByText("Internal Gamelan")).toBeDefined();
  });
});
