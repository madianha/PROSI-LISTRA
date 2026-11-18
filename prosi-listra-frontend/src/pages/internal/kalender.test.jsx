import { fireEvent, screen, waitFor } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderRoute } from "../../test/renderRoute";

vi.mock("../../api/acara", () => ({
  listAcara: vi.fn(),
  getAcara: vi.fn(),
  createAcara: vi.fn(),
  updateAcara: vi.fn(),
  deleteAcara: vi.fn(),
}));
vi.mock("../../api/anggota", () => ({ listAnggota: vi.fn(async () => []) }));
vi.mock("../../api/jasa", () => ({ listJasa: vi.fn(async () => []) }));

import InternalKalender from "./kalender";
import InternalAcaraDetail from "./acara-detail";
import { deleteAcara, getAcara, listAcara } from "../../api/acara";

const performer = (id_anggota, nama) => ({ id_acara_performer: id_anggota, id_anggota, nama_performer: null, anggota: { nama, jabatan: null, peran: "anggota" } });

const seminar = {
  id_acara: 1,
  tipe_acara: "job_external",
  nama_acara: "Pembukaan Seminar",
  nama_klien: "Panitia",
  lokasi: "Aula Pusat UNPAR",
  is_privat: false,
  tanggal_mulai: "2026-11-24",
  tanggal_selesai: "2026-11-24",
  acara_pj: [{ id_anggota: 3, nama: "Humas", jabatan: null }],
  acara_jasa: [
    {
      id_acara_jasa: 1, tanggal: "2026-11-24", jam_mulai: "08:00", jam_selesai: "09:00", is_tidak_spesifik: false, id_jasa: 4,
      jasa: { id_jasa: 4, nama: "Tari Merak", tipe_jasa: "tari", min_performer: 4, is_aktif: true, kecocokan: [] },
      acara_performer: [performer(5, "Anggota"), performer(6, "Alumni")],
    },
  ],
  kecukupan: { terisi: 2, dibutuhkan: 4, kurang: 2 },
};
const latihan = {
  ...seminar,
  id_acara: 2,
  tipe_acara: "listra",
  nama_acara: "Latihan Gabungan",
  nama_klien: null,
  acara_pj: [],
  tanggal_mulai: "2026-11-28",
  tanggal_selesai: "2026-11-28",
  acara_jasa: [{ ...seminar.acara_jasa[0], tanggal: "2026-11-28", is_tidak_spesifik: true, acara_performer: [] }],
  kecukupan: { terisi: 0, dibutuhkan: 0, kurang: 0 },
};

function storageMemori(isi = {}) {
  const peta = new Map(Object.entries(isi));
  return { getItem: (k) => peta.get(k) ?? null, setItem: (k, v) => peta.set(k, String(v)), removeItem: (k) => peta.delete(k) };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-18T10:00:00"));
  vi.stubGlobal("localStorage", storageMemori({ listra_user: JSON.stringify({ id_anggota: 5 }) }));
  listAcara.mockResolvedValue([seminar, latihan]);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Kalender Event", () => {
  it("memuat event bulan ini (rentang kotak kalender) dan menampilkan kartu dengan PJ & kecukupan", async () => {
    renderRoute(InternalKalender);
    expect(await screen.findByRole("heading", { name: "Pembukaan Seminar" })).toBeTruthy();
    // November 2026: kotak kalender dari Senin 26 Okt sampai Minggu 6 Des
    expect(listAcara).toHaveBeenCalledWith({ dari: "2026-10-26", sampai: "2026-12-06" });
    expect(screen.getByText("2 / 4 · kurang 2")).toBeTruthy();
    expect(screen.getByText("PJ: Humas")).toBeTruthy();
    expect(screen.getByText("PJ: PJ Tidak Spesifik")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Kelola acara Pembukaan Seminar" }).getAttribute("href")).toBe("/internal/kalender/1");
  });

  it("filter Acara LISTRA dan Tugas saya (performer = pengguna login)", async () => {
    renderRoute(InternalKalender);
    await screen.findByRole("heading", { name: "Pembukaan Seminar" });

    fireEvent.click(screen.getByRole("tab", { name: /Acara LISTRA/ }));
    expect(screen.queryByRole("heading", { name: "Pembukaan Seminar" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Latihan Gabungan" })).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: /Tugas saya/ }));
    expect(screen.getByRole("heading", { name: "Pembukaan Seminar" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Latihan Gabungan" })).toBeNull();
  });

  it("pindah bulan memuat rentang bulan berikutnya; bulan kosong memberi petunjuk", async () => {
    renderRoute(InternalKalender);
    await screen.findByRole("heading", { name: "Pembukaan Seminar" });
    listAcara.mockResolvedValue([]);
    fireEvent.click(screen.getByRole("button", { name: "Bulan berikutnya" }));
    await waitFor(() => expect(listAcara).toHaveBeenLastCalledWith({ dari: "2026-11-30", sampai: "2027-01-03" }));
    expect(await screen.findByText(/Belum ada event di Desember 2026/)).toBeTruthy();
  });

  it("gagal memuat: pesan dan tombol Coba lagi", async () => {
    listAcara.mockRejectedValue(new Error("server mati"));
    renderRoute(InternalKalender);
    expect(await screen.findByText(/Kalender belum bisa dimuat/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeTruthy();
  });
});

describe("Detail Event", () => {
  it("menampilkan hari, jasa, performer; hapus meminta konfirmasi lalu kembali ke kalender", async () => {
    getAcara.mockResolvedValue(seminar);
    deleteAcara.mockResolvedValue(null);
    renderRoute(InternalAcaraDetail, { path: "/internal/kalender/:id", url: "/internal/kalender/1" });

    expect(await screen.findByRole("heading", { name: "Pembukaan Seminar" })).toBeTruthy();
    expect(getAcara).toHaveBeenCalledWith("1");
    expect(screen.getByText(/Hari 1 · Sel, 24 Nov 2026/)).toBeTruthy();
    expect(screen.getByText(/Tari Merak/)).toBeTruthy();
    expect(screen.getByText("Alumni")).toBeTruthy();
    expect(screen.getByText("Panitia")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Hapus event/ }));
    expect(deleteAcara).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Ya, hapus" }));
    await waitFor(() => expect(deleteAcara).toHaveBeenCalledWith(1));
    expect(await screen.findByTestId("lokasi")).toHaveProperty("textContent", "/internal/kalender");
  });

  it("event tidak ditemukan: pesan dari server", async () => {
    getAcara.mockRejectedValue(new Error("Event tidak ditemukan."));
    renderRoute(InternalAcaraDetail, { path: "/internal/kalender/:id", url: "/internal/kalender/99" });
    expect(await screen.findByText("Event tidak ditemukan.")).toBeTruthy();
  });
});
