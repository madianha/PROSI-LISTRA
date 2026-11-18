import { afterEach, describe, expect, it, vi } from "vitest";
import { getKontak, linkWhatsApp } from "./kontak";

afterEach(() => {
  vi.unstubAllGlobals();
});

const kontak = {
  nomor_wa: "+62 812-3456-789",
  nama_humas: "Humas",
  template_pesan: "Halo Humas LISTRA, saya tertarik dengan {jasa}.",
};

describe("linkWhatsApp", () => {
  it("nomor dibersihkan dan {jasa} diisi nama jasa", () => {
    expect(linkWhatsApp(kontak, "Tari Merak")).toBe(
      "https://wa.me/628123456789?text=Halo%20Humas%20LISTRA%2C%20saya%20tertarik%20dengan%20Tari%20Merak.",
    );
  });

  it("tanpa jasa (tombol Hubungi Kami): {jasa} diisi 'jasa LISTRA'", () => {
    expect(linkWhatsApp(kontak)).toBe(
      "https://wa.me/628123456789?text=Halo%20Humas%20LISTRA%2C%20saya%20tertarik%20dengan%20jasa%20LISTRA.",
    );
  });

  it("template kosong memakai pesan bawaan", () => {
    expect(linkWhatsApp({ nomor_wa: "628123456789", template_pesan: "" }, "Tari Saman")).toBe(
      `https://wa.me/628123456789?text=${encodeURIComponent("Halo Humas LISTRA, saya tertarik dengan Tari Saman. Boleh minta informasi lebih lanjut?")}`,
    );
  });

  it.each([null, undefined, {}, { nomor_wa: "" }, { nomor_wa: "-" }])("nomor belum diisi (%o) = null", (k) => {
    expect(linkWhatsApp(k)).toBeNull();
  });
});

describe("getKontak", () => {
  it("mengambil kontak dari /api/kontak", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(kontak), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(getKontak()).resolves.toEqual(kontak);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/kontak");
  });

  it("gagal = pesan bahasa Indonesia", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 404 })));
    await expect(getKontak()).rejects.toThrow("Kontak WhatsApp belum tersedia.");
  });
});
