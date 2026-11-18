import { fireEvent, screen, waitFor, within } from "@solidjs/testing-library";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderRoute } from "../test/renderRoute";

vi.mock("../api/testimoni", () => ({ listTestimoni: vi.fn(), kirimTestimoni: vi.fn() }));

// Widget Cloudflare diganti tombol palsu: klik = lolos, dapat token "tok-uji"
const turnstileReset = vi.fn();
vi.mock("../components/Turnstile", () => ({
  default: (props) => {
    props.ref?.({ reset: turnstileReset });
    return (
      <button type="button" onClick={() => props.onToken("tok-uji")}>
        Saya bukan robot
      </button>
    );
  },
}));

import Testimoni from "./testimoni";
import { kirimTestimoni, listTestimoni } from "../api/testimoni";

const baris = {
  id_testimoni: 1,
  nama_klien: "Ibu Ratna",
  instansi: "PT Nusantara",
  nama_acara: null,
  is_acara_privat: true,
  isi_testimoni: "Penampilannya memukau.",
  rating: null,
  tanggal_input: "2026-11-01T10:00:00.000Z",
};

beforeEach(() => vi.resetAllMocks());

describe("Halaman Testimoni publik", () => {
  it("menampilkan testimoni dari API; acara privat disamarkan, rating kosong tanpa bintang", async () => {
    listTestimoni.mockResolvedValue([baris]);
    renderRoute(Testimoni, { path: "/testimoni" });

    expect(await screen.findByText("Penampilannya memukau.")).toBeTruthy();
    expect(screen.getByText("Acara: Acara privat")).toBeTruthy();
    expect(screen.queryByLabelText(/Rating/)).toBeNull();
  });

  it("menampilkan pesan bila belum ada testimoni", async () => {
    listTestimoni.mockResolvedValue([]);
    renderRoute(Testimoni, { path: "/testimoni" });
    expect(await screen.findByText("Belum ada testimoni.")).toBeTruthy();
  });

  it("kirim testimoni lewat form, lalu tampil pesan menunggu persetujuan", async () => {
    listTestimoni.mockResolvedValue([]);
    kirimTestimoni.mockResolvedValue({ id_testimoni: 9 });
    renderRoute(Testimoni, { path: "/testimoni" });

    fireEvent.click(await screen.findByText("Tulis Testimoni"));
    const form = await screen.findByRole("dialog");
    fireEvent.input(within(form).getByLabelText(/^Nama \*/), { target: { value: "Budi" } });
    fireEvent.input(within(form).getByLabelText(/^Testimoni/), { target: { value: "Keren sekali" } });
    fireEvent.click(within(form).getByLabelText("4 bintang"));
    fireEvent.click(within(form).getByText("Saya bukan robot"));
    fireEvent.submit(form);

    await waitFor(() =>
      expect(kirimTestimoni).toHaveBeenCalledWith(
        expect.objectContaining({ nama_klien: "Budi", isi_testimoni: "Keren sekali", rating: 4, turnstile_token: "tok-uji" }),
      ),
    );
    // pengunjung tidak bisa memilih sumber / tampil
    expect(kirimTestimoni.mock.calls[0][0]).not.toHaveProperty("sumber");
    expect(await screen.findByText(/akan tampil setelah disetujui/)).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("pesan error dari server tampil di form", async () => {
    listTestimoni.mockResolvedValue([]);
    kirimTestimoni.mockRejectedValue(new Error("Isi testimoni wajib diisi."));
    renderRoute(Testimoni, { path: "/testimoni" });

    fireEvent.click(await screen.findByText("Tulis Testimoni"));
    const form = await screen.findByRole("dialog");
    fireEvent.click(within(form).getByText("Saya bukan robot"));
    fireEvent.submit(form);

    expect(await within(form).findByRole("alert")).toHaveProperty("textContent", "Isi testimoni wajib diisi.");
    // token sudah terpakai, jadi widget diminta centang ulang
    expect(turnstileReset).toHaveBeenCalled();
  });

  it("tombol Kirim terkunci sampai lolos centang bukan robot", async () => {
    listTestimoni.mockResolvedValue([]);
    renderRoute(Testimoni, { path: "/testimoni" });

    fireEvent.click(await screen.findByText("Tulis Testimoni"));
    const form = await screen.findByRole("dialog");
    expect(within(form).getByText("Kirim").disabled).toBe(true);
    fireEvent.click(within(form).getByText("Saya bukan robot"));
    expect(within(form).getByText("Kirim").disabled).toBe(false);
  });
});
