import { fireEvent, screen, waitFor } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderRoute } from "../test/renderRoute";

vi.mock("../api/acara", () => ({ listJadwal: vi.fn() }));

import Jadwal from "./jadwal";
import { listJadwal } from "../api/acara";

const jadwal = [
  {
    id_acara: 3,
    tipe_acara: "job_external",
    nama_acara: "Acara privat",
    lokasi: null,
    is_privat: true,
    acara_jasa: [
      { id_acara_jasa: 1, tanggal: "2026-12-12", jam_mulai: "16:00", jam_selesai: "18:00", jasa: { id_jasa: 3, nama: "Tari Jaipong", tipe_jasa: "tari", is_aktif: true } },
      { id_acara_jasa: 2, tanggal: "2026-12-13", jam_mulai: "09:00", jam_selesai: "10:00", jasa: null },
    ],
  },
  {
    id_acara: 4,
    tipe_acara: "listra",
    nama_acara: "Gelar Karya LISTRA",
    lokasi: "Kampus UNPAR Ciumbuleuit",
    is_privat: false,
    acara_jasa: [{ id_acara_jasa: 3, tanggal: "2026-12-19", jam_mulai: "18:00", jam_selesai: "21:00", jasa: { id_jasa: 9, nama: "Tari Lama", tipe_jasa: "tari", is_aktif: false } }],
  },
];

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-12-01T10:00:00"));
  listJadwal.mockResolvedValue(jadwal);
});
afterEach(() => vi.useRealTimers());

describe("Jadwal Acara publik", () => {
  it("menampilkan event bulan ini dengan tanggal & jam per hari; acara privat tanpa nama dan lokasi", async () => {
    renderRoute(Jadwal);
    expect(await screen.findByRole("heading", { name: "Acara privat" })).toBeTruthy();
    // kotak kalender Desember 2026: Senin 30 Nov sampai Minggu 3 Jan
    expect(listJadwal).toHaveBeenCalledWith({ dari: "2026-11-30", sampai: "2027-01-03" });
    expect(screen.getByText("12–13 Des 2026")).toBeTruthy();
    expect(screen.getByText("16.00–18.00")).toBeTruthy();
    expect(screen.getByText(/Kampus UNPAR Ciumbuleuit/)).toBeTruthy();
  });

  it("jasa aktif menjadi tautan ke detail jasa, jasa nonaktif hanya nama", async () => {
    renderRoute(Jadwal);
    expect((await screen.findByRole("link", { name: "Tari Jaipong" })).getAttribute("href")).toBe("/jasa/3");
    expect(screen.getByText("Tari Lama").closest("a")).toBeNull();
  });

  it("bulan tanpa acara memberi petunjuk; tombol pindah bulan memuat bulan lain", async () => {
    renderRoute(Jadwal);
    await screen.findByRole("heading", { name: "Acara privat" });
    listJadwal.mockResolvedValue([]);
    fireEvent.click(screen.getByRole("button", { name: "Bulan berikutnya" }));
    await waitFor(() => expect(listJadwal).toHaveBeenLastCalledWith({ dari: "2026-12-28", sampai: "2027-01-31" }));
    expect(await screen.findByText(/Belum ada acara terjadwal di Januari 2027/)).toBeTruthy();
  });

  it("kalender bulanan: event tampil di setiap harinya; menekan nama event menandai kartunya", async () => {
    renderRoute(Jadwal);
    await screen.findByRole("heading", { name: "Acara privat" });
    // acara privat dua hari = dua tombol di kalender (12 dan 13 Des)
    const diKalender = screen.getAllByRole("button", { name: "Acara privat" });
    expect(diKalender).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Gelar Karya LISTRA" })).toHaveLength(1);
    expect(screen.getByText("Acara Job External")).toBeTruthy();

    Element.prototype.scrollIntoView = () => {};
    fireEvent.click(diKalender[0]);
    expect(screen.getByRole("heading", { name: "Acara privat" }).closest("li").className).toMatch(/ring-1/);
  });
});
