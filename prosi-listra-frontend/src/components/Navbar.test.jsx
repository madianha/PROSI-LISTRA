import { fireEvent, screen, waitFor } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { renderRoute } from "../test/renderRoute";
import { aturGulir, gulirKe } from "../test/gulir";
import Navbar from "./Navbar";

const bar = () => screen.getByRole("banner");

afterEach(() => aturGulir(0));

describe("Navbar publik", () => {
  it("Beranda paling atas: tembus pandang", () => {
    renderRoute(Navbar, { path: "/" });
    expect(bar().dataset.tembus).toBe("true");
  });

  it("digulir 1px saja: marun; kembali ke atas: tembus lagi", () => {
    renderRoute(Navbar, { path: "/" });
    gulirKe(1);
    expect(bar().dataset.tembus).toBe("false");
    gulirKe(0);
    expect(bar().dataset.tembus).toBe("true");
  });

  it("dibuka saat sudah tergulir (mis. dimuat ulang di tengah halaman): langsung marun", () => {
    aturGulir(300);
    renderRoute(Navbar, { path: "/" });
    expect(bar().dataset.tembus).toBe("false");
  });

  it("halaman selain Beranda: selalu marun", () => {
    renderRoute(Navbar, { path: "/jasa" });
    expect(bar().dataset.tembus).toBe("false");
  });

  it("menu HP dibuka di atas Beranda: marun; ditutup: tembus lagi", () => {
    renderRoute(Navbar, { path: "/" });
    fireEvent.click(screen.getByRole("button", { name: "Buka menu" }));
    expect(bar().dataset.tembus).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "Tutup menu" }));
    expect(bar().dataset.tembus).toBe("true");
  });

  it("pindah halaman tanpa muat ulang: mengikuti halaman yang dibuka", async () => {
    renderRoute(Navbar, { path: "*", url: "/jasa" });
    expect(bar().dataset.tembus).toBe("false");
    // menu layar lebar dan menu HP sama-sama ada di DOM jsdom; [0] = menu layar lebar
    fireEvent.click(screen.getAllByRole("link", { name: "Beranda" })[0]);
    await waitFor(() => expect(bar().dataset.tembus).toBe("true"));
  });

  it("menu HP dibuka di Beranda lalu pilih Jasa: menu tertutup, tetap marun", async () => {
    renderRoute(Navbar, { path: "*", url: "/" });
    fireEvent.click(screen.getByRole("button", { name: "Buka menu" }));
    // [1] = tautan di menu HP
    fireEvent.click(screen.getAllByRole("link", { name: "Jasa" })[1]);
    await waitFor(() => expect(screen.getByRole("button", { name: "Buka menu" })).toBeTruthy());
    expect(bar().dataset.tembus).toBe("false");
  });
});
