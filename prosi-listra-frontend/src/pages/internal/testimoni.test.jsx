import { fireEvent, screen, waitFor, within } from "@solidjs/testing-library";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderRoute } from "../../test/renderRoute";

vi.mock("../../api/testimoni", () => ({
  listSemuaTestimoni: vi.fn(),
  kirimTestimoni: vi.fn(),
  ubahTestimoni: vi.fn(),
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
  ubahTestimoni,
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

// testimoni Ditolak dengan semua kolom terisi dan berbeda dari isi form kosong
// (form Tambah memakai sumber "whatsapp"), untuk mengecek form Ubah benar-benar terisi
const citraLengkap = {
  ...buat(3, "Citra", "ditolak"),
  instansi: "PT Maju",
  nama_acara: "Wisuda",
  is_acara_privat: true,
  rating: 3,
  sumber: "web",
};

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
    expect(screen.getByRole("tab", { name: /Ditunggu \(1\)/ })).toBeTruthy();
  });

  it("filter status hanya menampilkan yang sesuai", async () => {
    renderRoute(InternalTestimoni);
    await screen.findByText("Ani");
    fireEvent.click(screen.getByRole("tab", { name: /Ditolak/ }));
    expect(screen.getByText("Citra")).toBeTruthy();
    expect(screen.queryByText("Ani")).toBeNull();
  });

  it("tombol per status: Ditunggu = Terima/Tolak, Diterima = hanya saklar Tampil, Ditolak = Ubah + Hapus", async () => {
    renderRoute(InternalTestimoni);
    await screen.findByText("Ani");
    const tombol = (nama) => within(kartu(nama)).queryAllByRole("button").map((b) => b.textContent.trim());

    // Ditunggu: belum pernah diterima/ditolak, belum ada saklar Tampil
    expect(within(kartu("Ani")).getByText("Ditunggu")).toBeTruthy();
    expect(tombol("Ani")).toEqual(["Terima", "Tolak"]);
    expect(within(kartu("Ani")).queryByRole("switch")).toBeNull();

    // Diterima: hanya saklar Tampil; bisa disembunyikan, tidak bisa dihapus
    expect(within(kartu("Budi")).getByText("Diterima")).toBeTruthy();
    expect(within(kartu("Budi")).getByRole("switch")).toBeTruthy();
    expect(tombol("Budi")).toEqual([]);

    // Ditolak: Ubah + Hapus, tanpa saklar
    expect(within(kartu("Citra")).getByText("Ditolak")).toBeTruthy();
    expect(within(kartu("Citra")).queryByRole("switch")).toBeNull();
    expect(tombol("Citra")).toEqual(["Ubah", "Hapus"]);
  });

  it("Ubah membuka form Ubah Testimoni yang terisi data testimoni itu", async () => {
    listSemuaTestimoni.mockResolvedValue([citraLengkap]);
    renderRoute(InternalTestimoni);
    await screen.findByText("Citra");

    fireEvent.click(within(kartu("Citra")).getByText("Ubah"));
    const form = await screen.findByRole("dialog", { name: "Ubah Testimoni" });
    expect(within(form).getByLabelText(/^Nama \*/).value).toBe("Citra");
    expect(within(form).getByLabelText("Instansi").value).toBe("PT Maju");
    expect(within(form).getByLabelText("Nama Acara").value).toBe("Wisuda");
    expect(within(form).getByLabelText(/^Acara privat/).checked).toBe(true);
    expect(within(form).getByLabelText("3 bintang").getAttribute("aria-pressed")).toBe("true");
    expect(within(form).getByLabelText(/^Testimoni/).value).toBe("Isi dari Citra");
    expect(within(form).getByLabelText("Sumber").value).toBe("web");
  });

  it("menyimpan Ubah mengirim data lewat ubahTestimoni, lalu baris itu menjadi Ditunggu", async () => {
    listSemuaTestimoni.mockResolvedValue([citraLengkap]);
    ubahTestimoni.mockResolvedValue({ ...citraLengkap, isi_testimoni: "Isi yang sudah diperbaiki", status: "menunggu" });
    renderRoute(InternalTestimoni);
    await screen.findByText("Citra");

    fireEvent.click(within(kartu("Citra")).getByText("Ubah"));
    const form = await screen.findByRole("dialog", { name: "Ubah Testimoni" });
    fireEvent.input(within(form).getByLabelText(/^Testimoni/), { target: { value: "Isi yang sudah diperbaiki" } });
    fireEvent.submit(form);

    await waitFor(() =>
      expect(ubahTestimoni).toHaveBeenCalledWith(3, {
        nama_klien: "Citra",
        instansi: "PT Maju",
        nama_acara: "Wisuda",
        is_acara_privat: true,
        rating: 3,
        isi_testimoni: "Isi yang sudah diperbaiki",
        sumber: "web",
      }),
    );
    // jendela tertutup; baris itu kembali ke antrean dengan isi baru
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(within(kartu("Citra")).getByText("Ditunggu")).toBeTruthy();
    expect(within(kartu("Citra")).getByText("Isi yang sudah diperbaiki")).toBeTruthy();
  });

  it("Terima mengubah status lalu memperbarui baris itu", async () => {
    setStatusTestimoni.mockResolvedValue(buat(1, "Ani", "disetujui"));
    renderRoute(InternalTestimoni);
    await screen.findByText("Ani");

    fireEvent.click(within(kartu("Ani")).getByText("Terima"));
    await waitFor(() => expect(setStatusTestimoni).toHaveBeenCalledWith(1, "disetujui"));
    await waitFor(() => expect(within(kartu("Ani")).queryByText("Terima")).toBeNull());
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

  it("Tambah Testimoni mengirim sumber tanpa is_aktif, lalu muncul di daftar sebagai Ditunggu", async () => {
    kirimTestimoni.mockResolvedValue(buat(4, "Dewi", "menunggu"));
    renderRoute(InternalTestimoni);
    await screen.findByText("Ani");

    fireEvent.click(screen.getByText("Tambah Testimoni"));
    const form = await screen.findByRole("dialog", { name: "Tambah Testimoni" });
    // testimoni baru selalu masuk antrean, jadi tidak ada pilihan langsung tampil
    expect(within(form).queryByLabelText(/Langsung tampil/)).toBeNull();
    fireEvent.input(within(form).getByLabelText(/^Nama \*/), { target: { value: "Dewi" } });
    fireEvent.input(within(form).getByLabelText(/^Testimoni/), { target: { value: "Mantap" } });
    fireEvent.submit(form);

    await waitFor(() =>
      expect(kirimTestimoni).toHaveBeenCalledWith(expect.objectContaining({ nama_klien: "Dewi", sumber: "whatsapp" })),
    );
    expect(kirimTestimoni.mock.calls[0][0]).not.toHaveProperty("is_aktif");
    // pengurus sudah login: tanpa centang bukan robot
    expect(kirimTestimoni.mock.calls[0][0]).not.toHaveProperty("turnstile_token");
    expect(await screen.findByText("Dewi")).toBeTruthy();
    expect(within(kartu("Dewi")).getByText("Ditunggu")).toBeTruthy();
  });
});
