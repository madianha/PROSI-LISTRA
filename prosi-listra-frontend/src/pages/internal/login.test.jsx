import { fireEvent, screen, waitFor } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { renderRoute } from "../../test/renderRoute";
import LoginInternal from "./login";

describe("Halaman login internal", () => {
  it("logo dan judul di bar atas adalah tautan ke Beranda publik", async () => {
    renderRoute(LoginInternal, { path: "/internal/login" });
    const tautan = screen.getByRole("link", { name: "LISTRA UNPAR, ke Beranda" });
    expect(tautan.getAttribute("href")).toBe("/");
    // isinya tetap: kedua logo (LISTRA dan UNPAR) dan judul
    expect(tautan.querySelectorAll("img")).toHaveLength(2);
    expect(tautan.textContent).toContain("LISTRA · Panel Internal");

    fireEvent.click(tautan);
    await waitFor(() => expect(screen.getByTestId("lokasi").textContent).toBe("/"));
  });
});
