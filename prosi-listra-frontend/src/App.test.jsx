import { render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

// halaman yang ikut dimuat butuh data; cukup kosong untuk test rute
vi.mock("./api/jasa", () => ({ listJasa: vi.fn(async () => []), getJasa: vi.fn(), getProvinsiList: vi.fn(async () => []) }));
vi.mock("./api/berita", () => ({ listBerita: vi.fn(async () => []), getBerita: vi.fn() }));
vi.mock("./api/testimoni", () => ({ listTestimoni: vi.fn(async () => []), listSemuaTestimoni: vi.fn(async () => []) }));
vi.mock("./api/kontak", () => ({ getKontak: vi.fn(async () => null), linkWhatsApp: () => null }));

const storage = (isi = {}) => {
  const peta = new Map(Object.entries(isi));
  return { getItem: (k) => peta.get(k) ?? null, setItem: (k, v) => peta.set(k, v), removeItem: (k) => peta.delete(k) };
};
const token = () => `x.${btoa(JSON.stringify({ id_anggota: 2, exp: Date.now() / 1000 + 3600 })).replace(/=+$/, "")}.y`;
const buka = (url) => {
  window.history.replaceState({}, "", url);
  return render(() => <App />);
};

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});

describe("alamat yang tidak ada", () => {
  it("publik: halaman 404 dengan tautan ke Beranda", async () => {
    vi.stubGlobal("localStorage", storage());
    buka("/halaman-asal");
    expect(await screen.findByRole("heading", { name: "Halaman tidak ditemukan" })).toBeTruthy();
    expect(screen.getByText("/halaman-asal")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ke Beranda" }).getAttribute("href")).toBe("/");
  });

  it("internal tanpa login: diarahkan ke login dengan pesan (bukan layar kosong)", async () => {
    vi.stubGlobal("localStorage", storage());
    buka("/internal/berita/list");
    expect(await screen.findByText("You haven't Login, please login to access /internal")).toBeTruthy();
  });

  it("internal sudah login: halaman 404 dengan tautan ke Kalender Event", async () => {
    vi.stubGlobal("localStorage", storage({ listra_token: token(), listra_user: '{"nama":"Humas"}' }));
    buka("/internal/berita/list");
    expect(await screen.findByRole("heading", { name: "Halaman tidak ditemukan" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ke Kalender Event" }).getAttribute("href")).toBe("/internal/kalender");
  });

  it("alamat yang ada tetap normal (bukan 404)", async () => {
    vi.stubGlobal("localStorage", storage());
    buka("/internal/login");
    expect(await screen.findByRole("button", { name: "Masuk" })).toBeTruthy();
    expect(screen.queryByText("Halaman tidak ditemukan")).toBeNull();
  });
});
