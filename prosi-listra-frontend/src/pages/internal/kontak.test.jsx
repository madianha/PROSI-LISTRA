import { fireEvent, screen, waitFor } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderRoute } from "../../test/renderRoute";
import InternalKontak from "./kontak";

const json = (body, status = 200) => new Response(body === null ? null : JSON.stringify(body), { status });
const kontak = { id_kontak: 1, nomor_wa: "628123456789", nama_humas: "Humas", template_pesan: "Halo, saya tertarik dengan {jasa}." };

beforeEach(() => {
  vi.stubGlobal("localStorage", { getItem: () => "token-uji", setItem: () => {}, removeItem: () => {} });
});
afterEach(() => vi.unstubAllGlobals());

const isiForm = (nomor) => {
  fireEvent.input(screen.getByLabelText("Nomor WhatsApp"), { target: { value: nomor } });
  fireEvent.input(screen.getByLabelText("Nama Humas"), { target: { value: "Humas" } });
  fireEvent.input(screen.getByLabelText("Template Pesan"), { target: { value: "Halo {jasa}" } });
  fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
};

describe("Kontak WhatsApp internal", () => {
  it("tabel kontak masih kosong (404): bukan error; Isi kontak menyimpan lewat POST dengan token", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json({ message: "Kontak WhatsApp tidak ditemukan." }, 404)).mockResolvedValueOnce(json(kontak, 201)).mockResolvedValue(json(kontak));
    vi.stubGlobal("fetch", fetchMock);
    renderRoute(InternalKontak);

    expect(await screen.findByText(/Kontak WhatsApp belum diisi/)).toBeTruthy();
    expect(screen.queryByText(/Gagal memuat/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Isi kontak" }));
    isiForm("628123456789");

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    const [url, opsi] = fetchMock.mock.calls[1];
    expect(url).toBe("/api/kontak");
    expect(opsi.method).toBe("POST");
    expect(opsi.headers.Authorization).toBe("Bearer token-uji");
    // tersimpan: kontak tampil, tombol berganti jadi Ubah kontak
    expect(await screen.findByRole("button", { name: "Ubah kontak" })).toBeTruthy();
  });

  it("kontak sudah ada: Ubah kontak menyimpan lewat PUT; pesan validasi server ditampilkan", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(kontak))
      .mockResolvedValueOnce(json({ message: "Nomor WhatsApp harus 8-15 angka, diawali kode negara (mis. 628123456789)." }, 400));
    vi.stubGlobal("fetch", fetchMock);
    renderRoute(InternalKontak);

    fireEvent.click(await screen.findByRole("button", { name: "Ubah kontak" }));
    isiForm("0812");

    expect(await screen.findByText(/harus 8-15 angka/)).toBeTruthy();
    expect(fetchMock.mock.calls[1][1].method).toBe("PUT");
  });
});
