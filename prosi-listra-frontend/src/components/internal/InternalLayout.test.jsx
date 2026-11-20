import { MemoryRouter, Route, createMemoryHistory, useLocation } from "@solidjs/router";
import { render, screen, waitFor } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import InternalLayout from "./InternalLayout";
import LoginInternal from "../../pages/internal/login";

// token berbentuk JWT (belum kedaluwarsa) supaya lolos cek sudahLogin() di browser
const token = (exp) => `x.${btoa(JSON.stringify({ id_anggota: 2, exp })).replace(/=+$/, "")}.y`;
const EXP_BERLAKU = Math.floor(Date.now() / 1000) + 3600;
const tokenBerlaku = (nama) => token(EXP_BERLAKU) + nama;

function LokasiSekarang() {
  const location = useLocation();
  return <p data-testid="lokasi">{location.pathname}</p>;
}

function HalamanRahasia() {
  return (
    <div>
      <h1>Kontak WhatsApp</h1>
      <button type="button">Ubah kontak</button>
    </div>
  );
}

function renderInternal(url = "/internal/kontak") {
  const history = createMemoryHistory();
  history.set({ value: url, replace: true });

  return render(() => (
    <MemoryRouter history={history}>
      <Route path="/internal/login" component={LokasiSekarang} />
      <Route path="/internal" component={InternalLayout}>
        <Route path="/kontak" component={HalamanRahasia} />
      </Route>
      <Route path="*" component={LokasiSekarang} />
    </MemoryRouter>
  ));
}

describe("InternalLayout auth guard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("tanpa token: langsung mengarahkan ke /internal/login tanpa merender UI internal", async () => {
    localStorage.setItem("listra_user", JSON.stringify({ nama: "Budi" }));
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    renderInternal("/internal/kontak");

    await waitFor(() => {
      expect(screen.getByTestId("lokasi").textContent).toBe("/internal/login");
    });
    expect(screen.queryByText("LISTRA · Panel Internal")).toBeNull();
    expect(screen.queryByRole("button", { name: "Ubah kontak" })).toBeNull();
    expect(localStorage.getItem("listra_user")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("token palsu atau kedaluwarsa (401 dari /api/auth/me): menghapus localStorage dan mengarahkan ke /internal/login", async () => {
    localStorage.setItem("listra_token", tokenBerlaku("token-palsu"));
    localStorage.setItem("listra_user", JSON.stringify({ nama: "Palsu" }));
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: "Silakan login terlebih dahulu." }),
    });
    vi.stubGlobal("fetch", fetchMock);

    renderInternal("/internal/kontak");

    // Selama verifikasi berjalan, UI internal tidak boleh tampil
    expect(screen.queryByText("LISTRA · Panel Internal")).toBeNull();
    expect(screen.queryByRole("button", { name: "Ubah kontak" })).toBeNull();

    await waitFor(() => {
      expect(screen.getByTestId("lokasi").textContent).toBe("/internal/login");
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/me",
      expect.objectContaining({
        headers: { Authorization: `Bearer ${tokenBerlaku("token-palsu")}` },
      }),
    );
    expect(localStorage.getItem("listra_token")).toBeNull();
    expect(localStorage.getItem("listra_user")).toBeNull();
    expect(screen.queryByRole("button", { name: "Ubah kontak" })).toBeNull();
  });

  it("gagal jaringan/diblokir saat memverifikasi /api/auth/me: fail-closed dan redirect ke /internal/login", async () => {
    localStorage.setItem("listra_token", tokenBerlaku("token-diblokir"));
    localStorage.setItem("listra_user", JSON.stringify({ nama: "User" }));
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    renderInternal("/internal/kontak");

    await waitFor(() => {
      expect(screen.getByTestId("lokasi").textContent).toBe("/internal/login");
    });
    expect(localStorage.getItem("listra_token")).toBeNull();
    expect(localStorage.getItem("listra_user")).toBeNull();
    expect(screen.queryByRole("button", { name: "Ubah kontak" })).toBeNull();
  });

  it("token valid (200 dari /api/auth/me): merender TopBar, SideNav, dan konten halaman internal", async () => {
    localStorage.setItem("listra_token", tokenBerlaku("token-sah"));
    localStorage.setItem("listra_user", JSON.stringify({ nama: "Admin LISTRA", peran: "admin" }));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id_anggota: 1, nama: "Admin LISTRA", peran: "Admin", is_aktif: true }),
      }),
    );

    renderInternal("/internal/kontak");

    expect(await screen.findByText("LISTRA · Panel Internal")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Profil akun" }).textContent.trim()).toBe("Admin LISTRA");
    expect(screen.getByRole("link", { name: "Kalender Event" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ubah kontak" })).toBeTruthy();
  });
});

function buka(url) {
  const history = createMemoryHistory();
  history.set({ value: url, replace: true });
  return render(() => (
    <MemoryRouter history={history}>
      <Route path="/internal/login" component={LoginInternal} />
      <Route path="/internal" component={InternalLayout}>
        <Route path="/testimoni" component={() => <p>Isi halaman internal</p>} />
      </Route>
    </MemoryRouter>
  ));
}

const storage = (isi) => {
  const peta = new Map(Object.entries(isi));
  return { getItem: (k) => peta.get(k) ?? null, setItem: (k, v) => peta.set(k, v), removeItem: (k) => peta.delete(k) };
};

describe("Panel internal wajib login", () => {
  it("belum login: dibawa ke /internal/login dengan pesan", async () => {
    vi.stubGlobal("localStorage", storage({}));
    buka("/internal/testimoni");
    expect(await screen.findByText("You haven't Login, please login to access /internal")).toBeTruthy();
    expect(screen.queryByText("Isi halaman internal")).toBeNull();
  });

  it("token kedaluwarsa: sama seperti belum login", async () => {
    vi.stubGlobal("localStorage", storage({ listra_token: token(Date.now() / 1000 - 60) }));
    buka("/internal/testimoni");
    expect(await screen.findByText("You haven't Login, please login to access /internal")).toBeTruthy();
  });

  it("sudah login: halaman internal tampil", async () => {
    vi.stubGlobal("localStorage", storage({ listra_token: token(Date.now() / 1000 + 3600), listra_user: '{"nama":"Humas"}' }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ nama: "Humas", is_aktif: true }) }));
    buka("/internal/testimoni");
    expect(await screen.findByText("Isi halaman internal")).toBeTruthy();
  });

  it("membuka halaman login biasa tidak menampilkan pesan", async () => {
    vi.stubGlobal("localStorage", storage({}));
    buka("/internal/login");
    expect(await screen.findByRole("button", { name: "Masuk" })).toBeTruthy();
    expect(screen.queryByText(/You haven't Login/)).toBeNull();
  });
});
