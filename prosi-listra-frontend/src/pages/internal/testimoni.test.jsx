import { fireEvent, screen, waitFor, within } from "@solidjs/testing-library";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderRoute } from "../../test/renderRoute";

vi.mock("../../api/testimoni", () => ({
  listSemuaTestimoni: vi.fn(),
  kirimTestimoni: vi.fn(),
  setStatusTestimoni: vi.fn(),
  setAktifTestimoni: vi.fn(),
  hapusTestimoni: vi.fn(),
}));

import InternalTestimoni from "./testimoni";
import {
  hapusTestimoni,
  kirimTestimoni,
  listSemuaTestimoni,
  setAktifTestimoni,
  setStatusTestimoni,
} from "../../api/testimoni";

const buat = (id, nama, status, is_aktif = false) => ({
  id_testimoni: id,
  nama_klien: nama,
  instansi: null,
  nama_acara: null,
  is_acara_privat: false,
  isi_testimoni: `Isi dari ${nama}`,
  rating: 5,
  tanggal_input: "2026-11-01T10:00:00.000Z",
  status,
  sumber: "web",
  is_aktif,
});

const daftar = [buat(1, "Ani", "menunggu"), buat(2, "Budi", "disetujui", true), buat(3, "Citra", "ditolak")];

beforeEach(() => {
  vi.resetAllMocks();
  listSemuaTestimoni.mockResolvedValue(daftar);
});

const kartu = (nama) => screen.getByText(nama).closest("li");

describe("Halaman Kelola Testimoni", () => {
  it("menampilkan semua testimoni dan jumlah per status", async () => {
    renderRoute(InternalTestimoni);
    expect(await screen.findByText("Ani")).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Semua \(3\)/ })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Menunggu \(1\)/ })).toBeTruthy();
  });

  it("filter status hanya menampilkan yang sesuai", async () => {
    renderRoute(InternalTestimoni);
    await screen.findByText("Ani");
    fireEvent.click(screen.getByRole("tab", { name: /Ditolak/ }));
    expect(screen.getByText("Citra")).toBeTruthy();
    expect(screen.queryByText("Ani")).toBeNull();
  });

  it("saklar Tampil terkunci untuk testimoni yang belum disetujui", async () => {
    renderRoute(InternalTestimoni);
    await screen.findByText("Ani");
    expect(within(kartu("Ani")).getByRole("switch").disabled).toBe(true);
    expect(within(kartu("Budi")).getByRole("switch").disabled).toBe(false);
  });

  it("Setujui mengubah status lalu memperbarui baris itu", async () => {
    setStatusTestimoni.mockResolvedValue(buat(1, "Ani", "disetujui"));
    renderRoute(InternalTestimoni);
    await screen.findByText("Ani");

    fireEvent.click(within(kartu("Ani")).getByText("Setujui"));
    await waitFor(() => expect(setStatusTestimoni).toHaveBeenCalledWith(1, "disetujui"));
    await waitFor(() => expect(within(kartu("Ani")).queryByText("Setujui")).toBeNull());
  });

  it("saklar Tampil memanggil API", async () => {
    setAktifTestimoni.mockResolvedValue(buat(2, "Budi", "disetujui", false));
    renderRoute(InternalTestimoni);
    await screen.findByText("Budi");

    fireEvent.click(within(kartu("Budi")).getByRole("switch"));
    await waitFor(() => expect(setAktifTestimoni).toHaveBeenCalledWith(2, false));
  });

  it("Hapus minta konfirmasi dulu", async () => {
    hapusTestimoni.mockResolvedValue(null);
    renderRoute(InternalTestimoni);
    await screen.findByText("Citra");

    fireEvent.click(within(kartu("Citra")).getByText("Hapus"));
    expect(hapusTestimoni).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByText("Ya, hapus"));

    await waitFor(() => expect(hapusTestimoni).toHaveBeenCalledWith(3));
    await waitFor(() => expect(screen.queryByText("Citra")).toBeNull());
  });

  it("Tambah Testimoni mengirim sumber dan tampil, lalu muncul di daftar", async () => {
    kirimTestimoni.mockResolvedValue(buat(4, "Dewi", "disetujui", true));
    renderRoute(InternalTestimoni);
    await screen.findByText("Ani");

    fireEvent.click(screen.getByText("Tambah Testimoni"));
    const form = await screen.findByRole("dialog");
    fireEvent.input(within(form).getByLabelText(/^Nama \*/), { target: { value: "Dewi" } });
    fireEvent.input(within(form).getByLabelText(/^Testimoni/), { target: { value: "Mantap" } });
    fireEvent.submit(form);

    await waitFor(() =>
      expect(kirimTestimoni).toHaveBeenCalledWith(expect.objectContaining({ sumber: "whatsapp", is_aktif: true })),
    );
    // pengurus sudah login: tanpa centang bukan robot
    expect(kirimTestimoni.mock.calls[0][0]).not.toHaveProperty("turnstile_token");
    expect(await screen.findByText("Dewi")).toBeTruthy();
  });
});
