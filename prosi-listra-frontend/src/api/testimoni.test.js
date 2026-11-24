import { afterEach, describe, expect, it, vi } from "vitest";
import { ubahTestimoni } from "./testimoni";

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("api testimoni", () => {
  it("ubahTestimoni mengirim PUT ke /api/testimoni/:id berisi data JSON dan token login", async () => {
    localStorage.setItem("listra_token", "tok-humas");
    const baris = { id_testimoni: 3, nama_klien: "Citra", status: "menunggu", is_aktif: false };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(baris), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const data = { nama_klien: "Citra", isi_testimoni: "Rapi sekali.", sumber: "web" };
    await expect(ubahTestimoni(3, data)).resolves.toEqual(baris);

    expect(fetchMock).toHaveBeenCalledWith("/api/testimoni/3", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: "Bearer tok-humas" },
      body: '{"nama_klien":"Citra","isi_testimoni":"Rapi sekali.","sumber":"web"}',
    });
  });
});
