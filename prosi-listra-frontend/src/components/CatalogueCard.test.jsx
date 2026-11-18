import { fireEvent, render, screen } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import CatalogueCard from "./CatalogueCard";

const tariMerak = {
  id_jasa: 4,
  nama: "Tari Merak",
  tipe_jasa: "tari",
  nama_provinsi: "Jawa Barat",
  kecocokan: ["Opening", "Closing"],
  harga_minimum: 100000,
  harga_maximum: 300000,
  min_performer: 1,
  link_image: "/uploads/merak.jpg",
  link_media: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
};

describe("CatalogueCard", () => {
  it("foto membuka detail jasa; video tidak diputar di kartu", () => {
    const { container } = render(() => <CatalogueCard {...tariMerak} />);

    const fotoLink = container.querySelector("img").closest("a");
    expect(fotoLink.getAttribute("href")).toBe("/jasa/4");
    expect(screen.queryByRole("button", { name: /Putar video/ })).toBeNull();

    fireEvent.click(fotoLink);
    expect(container.querySelector("iframe, video")).toBeNull();
  });

  it("jasa yang punya video diberi penanda, tanpa tombol putar", () => {
    const { container } = render(() => <CatalogueCard {...tariMerak} />);
    expect(container.querySelector("img").closest("a").textContent).toContain("Video");
    expect(screen.getByRole("link", { name: /Lihat Detail Tari Merak, ada video/ }).getAttribute("href")).toBe("/jasa/4");
  });

  it("jasa tanpa video tidak diberi penanda", () => {
    const { container } = render(() => <CatalogueCard {...tariMerak} link_media={null} />);
    expect(container.querySelector("img").closest("a").textContent).not.toContain("Video");
    expect(screen.getByRole("link", { name: /Lihat Detail Tari Merak$/ })).toBeTruthy();
  });
});
