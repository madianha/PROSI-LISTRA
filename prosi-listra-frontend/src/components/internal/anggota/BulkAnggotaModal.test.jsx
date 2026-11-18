import { createEvent, fireEvent, render, screen, waitFor } from "@solidjs/testing-library";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../api/anggota", () => ({ createAnggotaBulk: vi.fn() }));

import BulkAnggotaModal from "./BulkAnggotaModal";
import { createAnggotaBulk } from "../../../api/anggota";

/** Tempel teks ke sebuah sel, seperti Ctrl+V dari spreadsheet. */
function tempel(sel, teks) {
  const e = createEvent.paste(sel, { clipboardData: { getData: () => teks } });
  fireEvent(sel, e);
}

const SALINAN_SHEETS =
  "Nama\tEmail\tNPM\tAngkatan\tJabatan\tPeran\tPenari\tPemusik\tAktif\n" +
  "Sari\tsari@student.unpar.ac.id\t6182301001\t2023\tAnggota\tAnggota\tYa\tTidak\tYa\n" +
  "Budi\tbudi@student.unpar.ac.id\t\t2022\t\tAlumni\tTidak\tYa\tYa\n";

beforeEach(() => vi.resetAllMocks());

describe("Tambah Massal Anggota", () => {
  it("tempel dari Google Sheets (dengan judul kolom) mengisi tabel lalu disimpan sekaligus", async () => {
    createAnggotaBulk.mockResolvedValue({ jumlah: 2 });
    const onSelesai = vi.fn();
    render(() => <BulkAnggotaModal onSelesai={onSelesai} onTutup={() => {}} />);

    tempel(screen.getByLabelText("Nama baris 1"), SALINAN_SHEETS);
    expect(screen.getByLabelText("Email baris 2").value).toBe("budi@student.unpar.ac.id");
    expect(screen.getByLabelText("Peran baris 2").value).toBe("Alumni");
    expect(screen.getByText("2 baris terisi")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Simpan 2 anggota" }));
    await waitFor(() => expect(onSelesai).toHaveBeenCalledWith(2));
    expect(createAnggotaBulk.mock.calls[0][0]).toEqual([
      { nama: "Sari", email: "sari@student.unpar.ac.id", npm: "6182301001", angkatan_unpar: "2023", jabatan: "Anggota", peran: "Anggota", is_penari: "Ya", is_pemusik: "Tidak", is_aktif: "Ya" },
      { nama: "Budi", email: "budi@student.unpar.ac.id", npm: "", angkatan_unpar: "2022", jabatan: "", peran: "Alumni", is_penari: "Tidak", is_pemusik: "Ya", is_aktif: "Ya" },
    ]);
  });

  it("tempel tanpa judul kolom mulai dari sel yang dipilih; tabel bertambah baris bila perlu", () => {
    render(() => <BulkAnggotaModal onSelesai={() => {}} onTutup={() => {}} />);
    const baris = Array.from({ length: 7 }, (_, i) => `Orang ${i + 1}\torang${i + 1}@x.id`).join("\n");
    tempel(screen.getByLabelText("Nama baris 1"), baris);
    expect(screen.getByLabelText("Nama baris 7").value).toBe("Orang 7");
    expect(screen.getByLabelText("Email baris 7").value).toBe("orang7@x.id");
  });

  it("kesalahan dari server ditandai di sel yang tepat dan didaftar; tidak ada yang tersimpan", async () => {
    const error = new Error("Ada 1 kesalahan. Tidak ada anggota yang disimpan.");
    error.kesalahan = [{ baris: 2, kolom: "email", pesan: "Email sudah terdaftar." }];
    createAnggotaBulk.mockRejectedValue(error);
    const onSelesai = vi.fn();
    render(() => <BulkAnggotaModal onSelesai={onSelesai} onTutup={() => {}} />);

    tempel(screen.getByLabelText("Nama baris 1"), SALINAN_SHEETS);
    fireEvent.click(screen.getByRole("button", { name: "Simpan 2 anggota" }));

    expect(await screen.findByText("Baris 2 · Email: Email sudah terdaftar.")).toBeTruthy();
    expect(screen.getByLabelText("Email baris 2").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByLabelText("Email baris 1").getAttribute("aria-invalid")).toBeNull();
    expect(onSelesai).not.toHaveBeenCalled();
  });

  it("tabel kosong tidak dikirim", () => {
    render(() => <BulkAnggotaModal onSelesai={() => {}} onTutup={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Simpan 0 anggota" }));
    expect(screen.getByRole("alert").textContent).toMatch(/Tabel masih kosong/);
    expect(createAnggotaBulk).not.toHaveBeenCalled();
  });
});
