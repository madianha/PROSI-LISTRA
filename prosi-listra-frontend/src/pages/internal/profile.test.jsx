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
  spesialisasi: [{ id_spesialisasi: 2, nama_spesialisasi: "Tari Merak", kategori: "tari", tipe_jasa: "tari" }],
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

  it("menautkan ke /internal/profile, hanya nama dan avatar siluet dengan styling pill seragam", () => {
    renderRoute(TopBar, { path: "/internal/kalender" });
    const link = screen.getByRole("link", { name: "Profil akun" });
    expect(link.getAttribute("href")).toBe("/internal/profile");
    expect(link.textContent.trim()).toBe("Budi Santoso");
    expect(link.className).toContain("bg-[#f6ecee]");
    expect(link.className).toContain("border-[#4a0e17]/30");
    expect(link.className).toContain("text-[#2b090e]");
    expect(link.querySelector('[data-testid="user-avatar"] svg')).not.toBeNull();
    expect(link.querySelector("img")).toBeNull();
    const logoutBtn = screen.getByRole("button", { name: "Keluar" });
    expect(logoutBtn).toBeTruthy();
    expect(logoutBtn.className).toContain("rounded-lg");
    expect(logoutBtn.className).toContain("text-neutral-900");
    expect(logoutBtn.querySelector("svg")).not.toBeNull();
  });

  it("menggunakan styling pill yang persis sama saat di /internal/profile", () => {
    renderRoute(TopBar, { path: "/internal/profile" });
    const link = screen.getByRole("link", { name: "Profil akun" });
    expect(link.className).toContain("bg-[#f6ecee]");
    expect(link.className).toContain("border-[#4a0e17]/30");
    expect(link.className).not.toContain("bg-[#ebd8dc]");
    expect(link.className).not.toContain("ring-1");
  });
});

describe("/internal/profile", () => {
  beforeEach(() => {
    localStorage.setItem("listra_token", "tok");
    globalThis.fetch = vi.fn(async (url) => (url === "/api/auth/me" ? json(me) : json({})));
  });
  afterEach(() => localStorage.clear());

  it("menampilkan data anggota tanpa informasi redundan dan tanda strip untuk nilai kosong", async () => {
    renderRoute(InternalProfile, { path: "/internal/profile" });
    expect(await screen.findByText("budi@student.unpar.ac.id")).toBeTruthy();
    expect(screen.getByText("Budi Santoso")).toBeTruthy();
    expect(screen.getByText("Kepengurusan")).toBeTruthy();
    expect(screen.getByText("6182101001")).toBeTruthy();
    expect(screen.getByText("2021")).toBeTruthy();
    expect(screen.getByText("Status Keanggotaan").nextElementSibling.textContent.trim()).toBe("Aktif");
    expect(screen.getAllByText("Aktif")).toHaveLength(1);
    expect(screen.getByText(/Spesialisasi Seni/i)).toBeTruthy();
    expect(screen.getByText("SPESIALISASI TARI")).toBeTruthy();
    expect(screen.getByText("SPESIALISASI MUSIK")).toBeTruthy();
    expect(screen.getByText("Tari Merak")).toBeTruthy();
    expect(screen.getByText("Jabatan Struktural").nextElementSibling.textContent).toBe("—");
    expect(screen.queryByText("Nama Lengkap")).toBeNull();
    expect(screen.queryByText("Email UNPAR")).toBeNull();
    expect(screen.queryByText("Peran")).toBeNull();
    expect(screen.queryByText("Lihat informasi keanggotaan dan kelola keamanan kata sandi Anda.")).toBeNull();
    expect(screen.queryByText("Gunakan kata sandi yang sulit ditebak dan tidak dipakai di tempat lain.")).toBeNull();
    expect(globalThis.fetch.mock.calls[0][1].headers.Authorization).toBe("Bearer tok");
  });

  it("memisahkan spesialisasi tari dan musik di dalam box bergaris batas", async () => {
    const meBoth = {
      ...me,
      spesialisasi: [
        { id_jasa: 2, nama: "Tari Merak", tipe_jasa: "tari" },
        { id_jasa: 5, nama: "Gamelan Degung", tipe_jasa: "musik" },
      ],
    };
    globalThis.fetch = vi.fn(async (url) => (url === "/api/auth/me" ? json(meBoth) : json({})));
    renderRoute(InternalProfile, { path: "/internal/profile" });
    expect(await screen.findByText("Tari Merak")).toBeTruthy();
    expect(screen.getByText("Gamelan Degung")).toBeTruthy();
    expect(screen.getByText("SPESIALISASI TARI")).toBeTruthy();
    expect(screen.getByText("SPESIALISASI MUSIK")).toBeTruthy();
  });

  it("tidak macet di Memuat profil saat /api/auth/me gagal dan memakai fallback localStorage", async () => {
    localStorage.setItem(
      "listra_user",
      JSON.stringify({ nama: "Budi Santoso", email: "budi@student.unpar.ac.id", peran: "listra", jabatan: "Ketua" })
    );
    globalThis.fetch = vi.fn(async () => json({ message: "Silakan login terlebih dahulu." }, false));
    renderRoute(InternalProfile, { path: "/internal/profile" });
    expect((await screen.findByRole("alert")).textContent).toContain("Silakan login terlebih dahulu.");
    expect(screen.queryByText(/Memuat profil/)).toBeNull();
    expect(screen.getAllByText("Budi Santoso").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Kepengurusan").length).toBeGreaterThan(0);
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
