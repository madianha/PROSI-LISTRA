import { fireEvent, render, screen } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import GambarSampul from "./GambarSampul";

describe("GambarSampul", () => {
  it("gambar gagal dimuat: diganti kotak polos, bukan ikon gambar rusak", () => {
    const { container } = render(() => <GambarSampul src="/rusak.jpg" alt="Pratinjau sampul" class="h-10 w-16" />);
    fireEvent.error(container.querySelector("img"));

    expect(container.querySelector("img")).toBeNull();
    // nama tetap ada untuk pembaca layar, ukuran tetap sama
    const kotak = screen.getByRole("img", { name: "Pratinjau sampul" });
    expect(kotak.className).toContain("h-10 w-16");
  });

  it("gambar diganti setelah gagal: dicoba dimuat lagi", () => {
    const [src, setSrc] = createSignal("/rusak.jpg");
    const { container } = render(() => <GambarSampul src={src()} />);
    fireEvent.error(container.querySelector("img"));
    expect(container.querySelector("img")).toBeNull();

    setSrc("/uploads/baru.jpg");
    expect(container.querySelector("img").getAttribute("src")).toBe("/uploads/baru.jpg");
  });
});
