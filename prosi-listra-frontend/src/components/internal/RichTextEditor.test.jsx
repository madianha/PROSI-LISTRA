import { render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../api/berita", () => ({ uploadGambar: vi.fn() }));

import RichTextEditor from "./RichTextEditor";

afterEach(() => {
  delete window.tinymce;
});

describe("RichTextEditor", () => {
  it("menampilkan 'Memuat editor...' selama TinyMCE belum siap", () => {
    window.tinymce = { init: () => new Promise(() => {}) }; // tidak pernah selesai
    render(() => <RichTextEditor value="" onChange={() => {}} />);
    expect(screen.getByText("Memuat editor...")).toBeTruthy();
  });

  it("TinyMCE gagal dimuat: pesan jelas, tidak ada kotak ketik yang isinya hilang", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    window.tinymce = { init: () => Promise.reject(new Error("404")) };
    const ref = vi.fn();
    render(() => <RichTextEditor value="" onChange={() => {}} ref={ref} />);

    expect((await screen.findByRole("alert")).textContent).toContain("Editor gagal dimuat.");
    expect(screen.queryByText("Memuat editor...")).toBeNull();
    // form tidak menerima ambilKonten dari editor yang tidak ada
    expect(ref).not.toHaveBeenCalledWith(expect.objectContaining({ ambilKonten: expect.any(Function) }));
  });

  it("TinyMCE siap: pesan memuat hilang dan form menerima ambilKonten", async () => {
    const editor = { uploadImages: vi.fn(), getContent: () => "<p>isi</p>", remove: vi.fn() };
    window.tinymce = { init: vi.fn().mockResolvedValue([editor]) };
    const ref = vi.fn();
    render(() => <RichTextEditor value="" onChange={() => {}} ref={ref} />);

    await vi.waitFor(() => expect(ref).toHaveBeenCalled());
    expect(screen.queryByText("Memuat editor...")).toBeNull();
    expect(await ref.mock.calls[0][0].ambilKonten()).toBe("<p>isi</p>");
    expect(window.tinymce.init.mock.calls[0][0].iframe_aria_text).toBe("Konten artikel");
  });
});
