import { fireEvent, screen, waitFor, within } from "@solidjs/testing-library";
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

// baris daftar = elemen induk dari nama alat musik
const baris = (nama) => screen.getByText(nama).parentElement;
const tombolUbah = (nama) => within(baris(nama)).getByRole("button", { name: "Ubah" });

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
});

describe("Internal Alat Musik - ubah jumlah", () => {
  it("Ubah membuka jendela berisi jumlah sekarang, Simpan menyimpan jumlah baru ke daftar", async () => {
    updateAlatMusik.mockResolvedValue({ id_alat_musik: 2, nama_alat_musik: "Angklung", jumlah: 20 });
    renderRoute(InternalAlatMusik);
    await screen.findByText("Angklung");

    fireEvent.click(tombolUbah("Angklung"));
    const jendela = screen.getByRole("dialog", { name: "Angklung" });
    const kolom = within(jendela).getByLabelText("Jumlah");
    expect(kolom.value).toBe("15");
    expect(document.activeElement).toBe(kolom);

    fireEvent.input(kolom, { target: { value: "20" } });
    fireEvent.click(within(jendela).getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(updateAlatMusik).toHaveBeenCalledWith(2, { jumlah: 20 });
    expect(within(baris("Angklung")).getByText("20")).toBeTruthy();
    // baris itu digambar ulang, fokus pindah ke tombol Ubah barunya
    expect(document.activeElement).toBe(tombolUbah("Angklung"));
  });

  it("pesan error dari server tampil di dalam jendela dan jendela tetap terbuka", async () => {
    updateAlatMusik.mockRejectedValue(new Error("Alat musik tidak ditemukan."));
    renderRoute(InternalAlatMusik);
    await screen.findByText("Angklung");

    fireEvent.click(tombolUbah("Angklung"));
    const jendela = screen.getByRole("dialog", { name: "Angklung" });
    fireEvent.input(within(jendela).getByLabelText("Jumlah"), { target: { value: "20" } });
    fireEvent.click(within(jendela).getByRole("button", { name: "Simpan" }));

    expect((await within(jendela).findByRole("alert")).textContent).toBe("Alat musik tidak ditemukan.");
    expect(screen.getByRole("dialog", { name: "Angklung" })).toBe(jendela);
  });

  it("Batal menutup jendela tanpa menyimpan", async () => {
    renderRoute(InternalAlatMusik);
    await screen.findByText("Angklung");
    const ubah = tombolUbah("Angklung");

    fireEvent.click(ubah);
    const jendela = screen.getByRole("dialog", { name: "Angklung" });
    fireEvent.input(within(jendela).getByLabelText("Jumlah"), { target: { value: "20" } });
    fireEvent.click(within(jendela).getByRole("button", { name: "Batal" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(updateAlatMusik).not.toHaveBeenCalled();
    expect(within(baris("Angklung")).getByText("15")).toBeTruthy();
    // fokus kembali ke tombol yang tadi membuka jendela
    expect(document.activeElement).toBe(ubah);
  });

  it("Esc dan klik di luar jendela juga menutup tanpa menyimpan", async () => {
    renderRoute(InternalAlatMusik);
    await screen.findByText("Angklung");

    fireEvent.click(tombolUbah("Angklung"));
    fireEvent.keyDown(document.activeElement, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(tombolUbah("Angklung"));
    // latar gelap = elemen induk dari jendela
    fireEvent.click(screen.getByRole("dialog").parentElement);
    expect(screen.queryByRole("dialog")).toBeNull();

    expect(updateAlatMusik).not.toHaveBeenCalled();
  });

  it("selama menyimpan, Esc, klik di luar, dan Batal tidak menutup jendela; error yang datang belakangan tetap terlihat", async () => {
    // simpanan yang belum selesai: baru gagal saat test memanggil gagal()
    let gagal;
    updateAlatMusik.mockReturnValue(new Promise((_, tolak) => (gagal = tolak)));
    renderRoute(InternalAlatMusik);
    await screen.findByText("Angklung");

    fireEvent.click(tombolUbah("Angklung"));
    const jendela = screen.getByRole("dialog", { name: "Angklung" });
    fireEvent.input(within(jendela).getByLabelText("Jumlah"), { target: { value: "20" } });
    fireEvent.click(within(jendela).getByRole("button", { name: "Simpan" }));
    await waitFor(() => expect(updateAlatMusik).toHaveBeenCalled());

    fireEvent.keyDown(document.activeElement, { key: "Escape" });
    fireEvent.click(jendela.parentElement);
    fireEvent.click(within(jendela).getByRole("button", { name: "Batal" }));
    expect(screen.getByRole("dialog", { name: "Angklung" })).toBe(jendela);

    gagal(new Error("Koneksi terputus."));
    expect((await within(jendela).findByRole("alert")).textContent).toBe("Koneksi terputus.");
  });

  it("Tab tetap di dalam jendela, tidak pindah ke halaman di belakang", async () => {
    renderRoute(InternalAlatMusik);
    await screen.findByText("Angklung");

    fireEvent.click(tombolUbah("Angklung"));
    const jendela = screen.getByRole("dialog", { name: "Angklung" });
    // kolom Nama = elemen pertama di jendela, Simpan = terakhir
    const kolomNama = within(jendela).getByLabelText("Nama");
    const simpan = within(jendela).getByRole("button", { name: "Simpan" });

    simpan.focus();
    fireEvent.keyDown(simpan, { key: "Tab" });
    expect(document.activeElement).toBe(kolomNama);
    fireEvent.keyDown(kolomNama, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(simpan);
  });

  it("nama bisa diganti bersama jumlah; nama baru tampil di daftar", async () => {
    updateAlatMusik.mockResolvedValue({ id_alat_musik: 1, nama_alat_musik: "Kendang Sunda", jumlah: 5 });
    renderRoute(InternalAlatMusik);
    await screen.findByText("Kendang");

    fireEvent.click(tombolUbah("Kendang"));
    const jendela = screen.getByRole("dialog", { name: "Kendang" });
    const kolomNama = within(jendela).getByLabelText("Nama");
    expect(kolomNama.value).toBe("Kendang");

    fireEvent.input(kolomNama, { target: { value: " Kendang Sunda " } });
    fireEvent.input(within(jendela).getByLabelText("Jumlah"), { target: { value: "5" } });
    fireEvent.click(within(jendela).getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(updateAlatMusik).toHaveBeenCalledWith(1, { nama_alat_musik: "Kendang Sunda", jumlah: 5 });
    expect(within(baris("Kendang Sunda")).getByText("5")).toBeTruthy();
  });

  it("nama yang sudah dipakai alat lain: pesan dari server tampil, jendela tetap terbuka", async () => {
    updateAlatMusik.mockRejectedValue(new Error("Alat musik dengan nama tersebut sudah ada."));
    renderRoute(InternalAlatMusik);
    await screen.findByText("Kendang");

    fireEvent.click(tombolUbah("Kendang"));
    const jendela = screen.getByRole("dialog", { name: "Kendang" });
    fireEvent.input(within(jendela).getByLabelText("Nama"), { target: { value: "Angklung" } });
    fireEvent.click(within(jendela).getByRole("button", { name: "Simpan" }));

    expect((await within(jendela).findByRole("alert")).textContent).toBe("Alat musik dengan nama tersebut sudah ada.");
    expect(updateAlatMusik).toHaveBeenCalledWith(1, { nama_alat_musik: "Angklung", jumlah: 2 });
  });
});
