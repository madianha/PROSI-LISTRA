import { screen } from "@solidjs/testing-library";
import { MemoryRouter, Route, createMemoryHistory } from "@solidjs/router";
import { render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import InternalLayout from "./InternalLayout";
import LoginInternal from "../../pages/internal/login";

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
const token = (exp) => `x.${btoa(JSON.stringify({ id_anggota: 2, exp })).replace(/=+$/, "")}.y`;

afterEach(() => vi.unstubAllGlobals());

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
