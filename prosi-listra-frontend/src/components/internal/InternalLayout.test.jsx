import { MemoryRouter, Route, createMemoryHistory, useLocation } from "@solidjs/router";
import { render, screen, waitFor } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import InternalLayout from "./InternalLayout";

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
    localStorage.setItem("listra_token", "token-palsu");
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
        headers: { Authorization: "Bearer token-palsu" },
      }),
    );
    expect(localStorage.getItem("listra_token")).toBeNull();
    expect(localStorage.getItem("listra_user")).toBeNull();
    expect(screen.queryByRole("button", { name: "Ubah kontak" })).toBeNull();
  });

  it("gagal jaringan/diblokir saat memverifikasi /api/auth/me: fail-closed dan redirect ke /internal/login", async () => {
    localStorage.setItem("listra_token", "token-diblokir");
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
    localStorage.setItem("listra_token", "token-sah");
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
