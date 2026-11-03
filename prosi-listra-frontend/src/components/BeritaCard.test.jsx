import { screen } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import BeritaCard from "./BeritaCard";
import { renderRoute } from "../test/renderRoute";

const tautan = {
  id_berita: 1,
  judul: "LISTRA Juara 1",
  tanggal: "2023-12-01",
  url_gambar: "https://unpar.ac.id/gambar.jpg",
  konten: null,
  sumber: "unpar.ac.id",
  url_artikel: "https://unpar.ac.id/listra-juara",
};

const artikel = {
  id_berita: 2,
  judul: "Persiapan Gelar Karya",
  tanggal: "2026-10-10",
  url_gambar: "/uploads/sampul.jpg",
  konten: "<p>isi</p>",
  sumber: null,
  url_artikel: null,
};

describe("BeritaCard", () => {
  it("tautan: menampilkan sumber dan membuka url_artikel di tab baru", () => {
    renderRoute(() => <BeritaCard berita={tautan} />);

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("https://unpar.ac.id/listra-juara");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    expect(link.textContent).toContain("unpar.ac.id");
    expect(link.textContent).toContain("1 Des 2023");
    expect(screen.getByRole("heading").textContent).toBe("LISTRA Juara 1");
  });

  it("artikel: tidak ada label sumber dan menuju /berita/:id", () => {
    renderRoute(() => <BeritaCard berita={artikel} />);

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/berita/2");
    expect(link.getAttribute("target")).toBeNull();
    expect(link.textContent).toContain("Baca artikel");
    expect(link.textContent).not.toContain("·");
  });

  it("menampilkan gambar sampul dari url_gambar", () => {
    const { container } = renderRoute(() => <BeritaCard berita={artikel} />);
    expect(container.querySelector("img").getAttribute("src")).toBe("/uploads/sampul.jpg");
  });
});
