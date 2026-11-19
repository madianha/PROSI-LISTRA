import { fireEvent, screen, waitFor } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderRoute } from "../../test/renderRoute";
import InternalProfile from "./profile";
import TopBar from "../../components/internal/TopBar";

const me = {
  id_anggota: 7,
  nama: "Budi Santoso",
  email: "budi@student.unpar.ac.id",
  npm: "6182101001",
  angkatan_unpar: 2021,
  peran: "Kepengurusan",
  jabatan: null,
  is_aktif: true,
  spesialisasi: [{ id_spesialisasi: 2, nama_spesialisasi: "Tari Merak", kategori: "tari" }],
};

const json = (body, ok = true) => ({ ok, json: async () => body });

function isi(label, value) {
  fireEvent.input(screen.getByLabelText(label, { selector: "input" }), { target: { value } });
}

describe("TopBar profil", () => {
  beforeEach(() => {
    localStorage.setItem("listra_user", JSON.stringify({ nama: "Budi Santoso", email: "budi@student.unpar.ac.id" }));
  });
  afterEach(() => localStorage.clear());

  it("menautkan ke /internal/profile, hanya nama dan avatar siluet", () => {
    renderRoute(TopBar, { path: "/internal/kalender" });
    const link = screen.getByRole("link", { name: "Profil akun" });
    expect(link.getAttribute("href")).toBe("/internal/profile");
    expect(link.textContent.trim()).toBe("Budi Santoso");
    expect(link.querySelector('[data-testid="user-avatar"] svg')).not.toBeNull();
    expect(link.querySelector("img")).toBeNull();
    expect(screen.getByRole("button", { name: "Keluar" })).toBeTruthy();
  });

  it("menandai aktif saat di /internal/profile", () => {
    renderRoute(TopBar, { path: "/internal/profile" });
    expect(screen.getByRole("link", { name: "Profil akun" }).getAttribute("aria-current")).toBe("page");
  });
});

describe("/internal/profile", () => {
  beforeEach(() => {
    localStorage.setItem("listra_token", "tok");
    globalThis.fetch = vi.fn(async (url) => (url === "/api/auth/me" ? json(me) : json({})));
  });
  afterEach(() => localStorage.clear());

  it("menampilkan data anggota dan tanda strip untuk nilai kosong", async () => {
    renderRoute(InternalProfile, { path: "/internal/profile" });
    expect(await screen.findAllByText("budi@student.unpar.ac.id")).not.toHaveLength(0);
    expect(screen.getByText("6182101001")).toBeTruthy();
    expect(screen.getByText("2021")).toBeTruthy();
    expect(screen.getByText("Aktif")).toBeTruthy();
    expect(screen.getByText("Tari Merak")).toBeTruthy();
    expect(screen.getByText("Jabatan Struktural").nextElementSibling.textContent).toBe("—");
    expect(globalThis.fetch.mock.calls[0][1].headers.Authorization).toBe("Bearer tok");
  });

  it("validasi sisi klien tanpa memanggil API", async () => {
    renderRoute(InternalProfile, { path: "/internal/profile" });
    await screen.findByText("Budi Santoso", { selector: "p" });
    const submit = () => fireEvent.click(screen.getByRole("button", { name: "Simpan Kata Sandi" }));

    submit();
    expect((await screen.findByRole("alert")).textContent).toContain("wajib diisi");

    isi("Kata Sandi Lama", "lama12345");
    isi("Kata Sandi Baru", "abc");
    isi("Konfirmasi Kata Sandi Baru", "abc");
    submit();
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("minimal 8"));

    isi("Kata Sandi Baru", "baru12345");
    submit();
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("tidak sesuai"));

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("menampilkan pesan error dari server", async () => {
    globalThis.fetch = vi.fn(async (url) =>
      url === "/api/auth/me" ? json(me) : json({ message: "Kata sandi lama tidak sesuai." }, false)
    );
    renderRoute(InternalProfile, { path: "/internal/profile" });
    await screen.findByText("Budi Santoso", { selector: "p" });
    isi("Kata Sandi Lama", "salah12345");
    isi("Kata Sandi Baru", "baru12345");
    isi("Konfirmasi Kata Sandi Baru", "baru12345");
    fireEvent.click(screen.getByRole("button", { name: "Simpan Kata Sandi" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Kata sandi lama tidak sesuai.");
  });

  it("mengirim kolom yang benar, lalu mengosongkan form saat berhasil", async () => {
    globalThis.fetch = vi.fn(async (url) =>
      url === "/api/auth/me" ? json(me) : json({ message: "Kata sandi berhasil diperbarui." })
    );
    renderRoute(InternalProfile, { path: "/internal/profile" });
    await screen.findByText("Budi Santoso", { selector: "p" });
    isi("Kata Sandi Lama", "lama12345");
    isi("Kata Sandi Baru", "baru12345");
    isi("Konfirmasi Kata Sandi Baru", "baru12345");
    fireEvent.click(screen.getByRole("button", { name: "Simpan Kata Sandi" }));

    expect((await screen.findByRole("status")).textContent).toBe("Kata sandi berhasil diperbarui.");
    const [url, opts] = globalThis.fetch.mock.calls[1];
    expect(url).toBe("/api/auth/change-password");
    expect(opts.method).toBe("PUT");
    expect(JSON.parse(opts.body)).toEqual({
      kata_sandi_lama: "lama12345",
      kata_sandi_baru: "baru12345",
      konfirmasi_kata_sandi: "baru12345",
    });
    for (const l of ["Kata Sandi Lama", "Kata Sandi Baru", "Konfirmasi Kata Sandi Baru"]) {
      expect(screen.getByLabelText(l, { selector: "input" }).value).toBe("");
    }
  });

  it("tombol mata mengubah tampilan kolom", async () => {
    renderRoute(InternalProfile, { path: "/internal/profile" });
    const input = screen.getByLabelText("Kata Sandi Lama", { selector: "input" });
    expect(input.type).toBe("password");
    fireEvent.click(screen.getByRole("button", { name: "Tampilkan Kata Sandi Lama" }));
    expect(input.type).toBe("text");
  });
});
