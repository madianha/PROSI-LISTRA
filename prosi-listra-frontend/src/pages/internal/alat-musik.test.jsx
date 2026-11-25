import { fireEvent, screen, waitFor } from "@solidjs/testing-library";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderRoute } from "../../test/renderRoute";

vi.mock("../../api/alatMusik", () => ({
  listAlatMusik: vi.fn(),
  createAlatMusik: vi.fn(),
  updateAlatMusik: vi.fn(),
  deleteAlatMusik: vi.fn(),
}));

import InternalAlatMusik from "./alat-musik";
import { createAlatMusik, listAlatMusik, updateAlatMusik } from "../../api/alatMusik";

beforeEach(() => {
  vi.resetAllMocks();
  listAlatMusik.mockResolvedValue([
    { id_alat_musik: 1, nama_alat_musik: "Kendang", jumlah: 2 },
    { id_alat_musik: 2, nama_alat_musik: "Angklung", jumlah: 15 },
  ]);
});

describe("Internal Alat Musik", () => {
  it("menampilkan alat musik dari API backend", async () => {
    renderRoute(InternalAlatMusik);
    expect(await screen.findByText("Kendang")).toBeTruthy();
    expect(screen.getByText("Angklung")).toBeTruthy();
  });

  it("menambah alat musik lewat API lalu memuat ulang daftar", async () => {
    createAlatMusik.mockResolvedValue({ id_alat_musik: 3, nama_alat_musik: "Suling", jumlah: 3 });
    renderRoute(InternalAlatMusik);
    await screen.findByText("Kendang");

    fireEvent.click(screen.getByRole("button", { name: /Alat Musik/ }));
    fireEvent.input(screen.getByPlaceholderText(/Contoh: Kendang/), { target: { value: " Suling " } });
    fireEvent.input(screen.getByRole("spinbutton"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(createAlatMusik).toHaveBeenCalledWith({ nama_alat_musik: "Suling", jumlah: 3 }));
    await waitFor(() => expect(listAlatMusik).toHaveBeenCalledTimes(2));
  });

  it("pesan error dari server tampil di modal", async () => {
    createAlatMusik.mockRejectedValue(new Error("Alat musik dengan nama tersebut sudah ada."));
    renderRoute(InternalAlatMusik);
    await screen.findByText("Kendang");

    fireEvent.click(screen.getByRole("button", { name: /Alat Musik/ }));
    fireEvent.input(screen.getByPlaceholderText(/Contoh: Kendang/), { target: { value: "Kendang" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Alat musik dengan nama tersebut sudah ada.")).toBeTruthy();
  });

  it("membuka modal ubah dan memperbarui jumlah alat musik", async () => {
    updateAlatMusik.mockResolvedValue({ id_alat_musik: 1, nama_alat_musik: "Kendang", jumlah: 5 });
    renderRoute(InternalAlatMusik);
    await screen.findByText("Kendang");

    const ubahButtons = screen.getAllByRole("button", { name: "Ubah" });
    fireEvent.click(ubahButtons[0]);

    expect(screen.getByRole("heading", { name: "Ubah Alat Musik" })).toBeTruthy();

    const jumlahInput = screen.getByRole("spinbutton");
    expect(jumlahInput.value).toBe("2");
    fireEvent.input(jumlahInput, { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan Perubahan" }));

    await waitFor(() =>
      expect(updateAlatMusik).toHaveBeenCalledWith(1, { nama_alat_musik: "Kendang", jumlah: 5 })
    );
    await waitFor(() => expect(listAlatMusik).toHaveBeenCalledTimes(2));
  });

  it("pesan error server tampil di modal ubah bila gagal", async () => {
    updateAlatMusik.mockRejectedValue(new Error("Jumlah minimal 1."));
    renderRoute(InternalAlatMusik);
    await screen.findByText("Kendang");

    const ubahButtons = screen.getAllByRole("button", { name: "Ubah" });
    fireEvent.click(ubahButtons[0]);

    fireEvent.click(screen.getByRole("button", { name: "Simpan Perubahan" }));

    expect(await screen.findByText("Jumlah minimal 1.")).toBeTruthy();
  });
});
