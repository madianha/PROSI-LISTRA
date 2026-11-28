import { fireEvent, render, screen, waitFor, within } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../api/anggota", () => ({ listAnggota: vi.fn() }));
vi.mock("../../../api/jasa", () => ({ listJasa: vi.fn() }));

import EventWizard from "./EventWizard";
import { listAnggota } from "../../../api/anggota";
import { listJasa } from "../../../api/jasa";

const anggota = [
  { id_anggota: 2, nama: "Humas", peran: "Humas", jabatan: null, is_aktif: true, spesialisasi: [] },
  { id_anggota: 5, nama: "Anggota", peran: "Anggota", jabatan: null, is_aktif: true, spesialisasi: [{ id_jasa: 3 }] },
  { id_anggota: 6, nama: "Alumni", peran: "Alumni", jabatan: null, is_aktif: true, spesialisasi: [] },
  { id_anggota: 1, nama: "Admin", peran: "Admin", jabatan: null, is_aktif: true, spesialisasi: [] },
];
const jasa = [{ id_jasa: 3, nama: "Tari Jaipong", tipe_jasa: "tari", min_performer: 4, is_aktif: true, kecocokan: ["Middle"], nama_provinsi: "Jawa Barat" }];

const isi = (label, nilai) => fireEvent.input(screen.getByLabelText(label), { target: { value: nilai } });
const klik = (nama) => fireEvent.click(screen.getByRole("button", { name: nama }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-28T10:00:00"));
  listAnggota.mockResolvedValue(anggota);
  listJasa.mockResolvedValue(jasa);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("EventWizard", () => {
  it("membuat Acara Job External lewat 4 langkah dan mengirim isian sesuai tabel", async () => {
    const onSimpan = vi.fn().mockResolvedValue();
    render(() => <EventWizard onSimpan={onSimpan} onTutup={() => {}} />);

    // 1. Jenis acara
    fireEvent.click(screen.getByLabelText(/Acara Job External/));
    klik(/Lanjut/);

    // 2. Info: tanpa PJ ditolak
    isi(/Nama event/, "Resepsi");
    isi(/Tanggal mulai/, "2026-12-12");
    isi(/Tanggal selesai/, "2026-12-13");
    isi("Nama Client", "Keluarga Wijaya");
    klik(/Lanjut/);
    expect(screen.getByRole("alert").textContent).toMatch(/minimal satu PJ/);
    // PJ: Alumni dan Admin tidak boleh jadi PJ, jadi tidak ada di daftar
    const daftarPj = await screen.findByLabelText(/^Humas/);
    expect(screen.queryByLabelText(/^Alumni/)).toBeNull();
    expect(screen.queryByLabelText(/^Admin/)).toBeNull();
    fireEvent.click(daftarPj);
    klik(/Lanjut/);

    // 3. Hari & Jasa: satu baris kosong per hari
    const hari1 = screen.getByRole("region", { name: "Hari 1" });
    fireEvent.input(within(hari1).getByLabelText("Jam mulai"), { target: { value: "16:00" } });
    fireEvent.input(within(hari1).getByLabelText("Jam selesai"), { target: { value: "18:00" } });
    fireEvent.click(within(hari1).getByRole("button", { name: /Pilih jasa/ }));
    fireEvent.click(await within(hari1).findByRole("button", { name: /Tari Jaipong/ }));
    // hari 2 dikosongkan = tidak dicatat
    const hari2 = screen.getByRole("region", { name: "Hari 2" });
    fireEvent.click(within(hari2).getByRole("button", { name: /Hapus kegiatan/ }));
    klik(/Lanjut/);

    // 4. Performer: yang menguasai jasa ditandai; non-anggota ditambah lewat nama
    const kartu = screen.getByRole("region", { name: "Performer Tari Jaipong" });
    fireEvent.click(within(kartu).getByRole("button", { name: /^Performer$/ }));
    expect(within(kartu).getByText("Menguasai jasa ini")).toBeTruthy();
    fireEvent.click(within(kartu).getByLabelText(/^Anggota/));
    fireEvent.click(within(kartu).getByRole("button", { name: /Performer non-anggota/ }));
    fireEvent.input(within(kartu).getByLabelText("Nama performer non-anggota"), { target: { value: "Rina" } });
    fireEvent.click(within(kartu).getByRole("button", { name: "Tambah" }));
    expect(within(kartu).getByText("2 / 4 · kurang 2")).toBeTruthy();

    klik("Simpan event");
    await waitFor(() => expect(onSimpan).toHaveBeenCalled());
    expect(onSimpan.mock.calls[0][0]).toEqual({
      tipe_acara: "job_external",
      nama_acara: "Resepsi",
      nama_klien: "Keluarga Wijaya",
      lokasi: null,
      is_privat: false,
      acara_pj: [2],
      acara_jasa: [
        {
          tanggal: "2026-12-12",
          jam_mulai: "16:00",
          jam_selesai: "18:00",
          id_jasa: 3,
          is_tidak_spesifik: false,
          acara_performer: [{ id_anggota: 5 }, { nama_performer: "Rina" }],
        },
      ],
    });
  });

  it("Acara LISTRA: PJ Tidak Spesifik, jasa baru otomatis Tidak Spesifik, Nama Client tidak dikirim", async () => {
    const onSimpan = vi.fn().mockResolvedValue();
    render(() => <EventWizard onSimpan={onSimpan} onTutup={() => {}} />);

    fireEvent.click(screen.getByLabelText(/Acara LISTRA/));
    klik(/Lanjut/);
    isi(/Nama event/, "Latihan Gabungan");
    isi(/Tanggal mulai/, "2026-11-28");
    expect(screen.queryByLabelText("Nama Client")).toBeNull();
    fireEvent.click(screen.getByLabelText(/PJ Tidak Spesifik/));
    klik(/Lanjut/);

    fireEvent.input(screen.getByLabelText("Jam mulai"), { target: { value: "10:00" } });
    fireEvent.input(screen.getByLabelText("Jam selesai"), { target: { value: "12:00" } });
    klik(/Pilih jasa/);
    fireEvent.click(await screen.findByRole("button", { name: /Tari Jaipong/ }));
    expect(screen.getByLabelText(/Tidak spesifik/).checked).toBe(true);
    klik(/Lanjut/);
    expect(screen.getByText(/Tidak ada jasa yang perlu performer/)).toBeTruthy();

    klik("Simpan event");
    await waitFor(() => expect(onSimpan).toHaveBeenCalled());
    expect(onSimpan.mock.calls[0][0]).toMatchObject({
      tipe_acara: "listra",
      nama_klien: null,
      acara_pj: [],
      acara_jasa: [{ tanggal: "2026-11-28", id_jasa: 3, is_tidak_spesifik: true, acara_performer: [] }],
    });
  });

  it("jam selesai sebelum jam mulai ditolak di langkah Hari & Jasa", async () => {
    render(() => <EventWizard onSimpan={vi.fn()} onTutup={() => {}} />);
    fireEvent.click(screen.getByLabelText(/Acara LISTRA/));
    klik(/Lanjut/);
    isi(/Nama event/, "Latihan");
    isi(/Tanggal mulai/, "2026-11-28");
    fireEvent.click(screen.getByLabelText(/PJ Tidak Spesifik/));
    klik(/Lanjut/);
    fireEvent.input(screen.getByLabelText("Jam mulai"), { target: { value: "12:00" } });
    fireEvent.input(screen.getByLabelText("Jam selesai"), { target: { value: "10:00" } });
    klik(/Lanjut/);
    expect(screen.getByRole("alert").textContent).toMatch(/Jam selesai harus setelah jam mulai/);
  });

  it("kolom jam format 24 jam: ketikan dirapikan jadi 16.30, jam yang tidak sah ditandai dan ditolak", async () => {
    render(() => <EventWizard onSimpan={vi.fn()} onTutup={() => {}} />);
    fireEvent.click(screen.getByLabelText(/Acara LISTRA/));
    klik(/Lanjut/);
    isi(/Nama event/, "Latihan");
    isi(/Tanggal mulai/, "2026-11-28");
    fireEvent.click(screen.getByLabelText(/PJ Tidak Spesifik/));
    klik(/Lanjut/);

    const mulai = screen.getByLabelText("Jam mulai");
    const selesai = screen.getByLabelText("Jam selesai");
    // bukan <input type="time">, yang di browser berbahasa Inggris tampil AM/PM
    expect(mulai.type).toBe("text");

    fireEvent.input(mulai, { target: { value: "1630" } });
    fireEvent.blur(mulai);
    expect(mulai.value).toBe("16.30");
    expect(mulai.getAttribute("aria-invalid")).toBe("false");

    fireEvent.input(selesai, { target: { value: "25.00" } });
    fireEvent.blur(selesai);
    expect(selesai.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("Jam 00.00–23.59")).toBeTruthy();
    klik(/Lanjut/);
    expect(screen.getByRole("alert").textContent).toMatch(/Isi jam mulai dan jam selesai/);

    fireEvent.input(selesai, { target: { value: "18.00" } });
    expect(screen.queryByText("Jam 00.00–23.59")).toBeNull();
  });

  it("mode ubah: terisi dari event, bisa disimpan langsung; pesan error server ditampilkan", async () => {
    const onSimpan = vi.fn().mockRejectedValue(new Error("PJ harus anggota Kepengurusan yang aktif."));
    const acara = {
      id_acara: 9,
      tipe_acara: "job_external",
      nama_acara: "Resepsi",
      nama_klien: null,
      lokasi: "Bandung",
      is_privat: true,
      tanggal_mulai: "2026-12-12",
      tanggal_selesai: "2026-12-12",
      acara_pj: [{ id_anggota: 2, nama: "Humas", jabatan: null }],
      acara_jasa: [
        { id_acara_jasa: 1, tanggal: "2026-12-12", jam_mulai: "16:00", jam_selesai: "18:00", is_tidak_spesifik: false, id_jasa: 3, jasa: jasa[0], acara_performer: [] },
      ],
    };
    render(() => <EventWizard acara={acara} langkahAwal={2} onSimpan={onSimpan} onTutup={() => {}} />);
    expect(screen.getByLabelText(/Nama event/).value).toBe("Resepsi");
    expect(screen.getByLabelText(/Sembunyikan nama/).checked).toBe(true);
    klik("Simpan event");
    expect(await screen.findByText("PJ harus anggota Kepengurusan yang aktif.")).toBeTruthy();
    expect(onSimpan.mock.calls[0][0].acara_jasa[0]).toMatchObject({ id_jasa: 3, jam_mulai: "16:00" });
  });

  it("event paling lama 7 hari: 8 hari ditolak, 7 hari boleh lanjut", async () => {
    render(() => <EventWizard onSimpan={vi.fn()} onTutup={() => {}} />);
    fireEvent.click(screen.getByLabelText(/Acara LISTRA/));
    klik(/Lanjut/);
    isi(/Nama event/, "Pekan Budaya");
    isi(/Tanggal mulai/, "2026-12-01");
    isi(/Tanggal selesai/, "2026-12-08");
    fireEvent.click(screen.getByLabelText(/PJ Tidak Spesifik/));
    expect(screen.getByText("8 hari (maks. 7)")).toBeTruthy();
    klik(/Lanjut/);
    expect(screen.getByRole("alert").textContent).toMatch(/paling lama 7 hari/);

    isi(/Tanggal selesai/, "2026-12-07");
    klik(/Lanjut/);
    expect(screen.getByRole("region", { name: "Hari 7" })).toBeTruthy();
  });

  it("Buat Event Baru: melarang tanggal masa lalu, mengatur batas min, dan menyesuaikan tanggal selesai", () => {
    render(() => <EventWizard onSimpan={vi.fn()} onTutup={() => {}} />);
    fireEvent.click(screen.getByLabelText(/Acara LISTRA/));
    klik(/Lanjut/);

    const mulai = screen.getByLabelText(/Tanggal mulai/);
    const selesai = screen.getByLabelText(/Tanggal selesai/);
    expect(mulai.getAttribute("min")).toBe("2026-11-28");
    expect(selesai.getAttribute("min")).toBe("2026-11-28");

    // Ketik tanggal masa lalu secara manual tetap ditolak validasi dan min selesai tetap hari ini
    isi(/Nama event/, "Latihan Kemarin");
    isi(/Tanggal mulai/, "2026-11-27");
    expect(selesai.getAttribute("min")).toBe("2026-11-28");
    fireEvent.click(screen.getByLabelText(/PJ Tidak Spesifik/));
    klik(/Lanjut/);
    expect(screen.getByRole("alert").textContent).toBe("Tanggal mulai tidak boleh di masa lalu.");

    // Tanggal mulai digeser melewati tanggal selesai: tanggal selesai ikut disesuaikan dan min mengikuti tanggal mulai
    isi(/Tanggal mulai/, "2026-12-02");
    isi(/Tanggal selesai/, "2026-12-04");
    expect(selesai.getAttribute("min")).toBe("2026-12-02");
    isi(/Tanggal mulai/, "2026-12-06");
    expect(selesai.value).toBe("2026-12-06");
    expect(selesai.getAttribute("min")).toBe("2026-12-06");

    // Hari ini boleh lanjut
    isi(/Tanggal mulai/, "2026-11-28");
    isi(/Tanggal selesai/, "2026-11-28");
    klik(/Lanjut/);
    expect(screen.getByRole("region", { name: "Hari 1" })).toBeTruthy();
  });

  it("mode ubah: event masa lalu tetap bisa disimpan tanpa terblokir batas hari ini", async () => {
    const onSimpan = vi.fn().mockResolvedValue();
    const acaraLama = {
      id_acara: 10,
      tipe_acara: "listra",
      nama_acara: "Latihan Lama",
      nama_klien: null,
      lokasi: "Studio",
      is_privat: false,
      tanggal_mulai: "2025-05-01",
      tanggal_selesai: "2025-05-01",
      acara_pj: [],
      acara_jasa: [
        { id_acara_jasa: 2, tanggal: "2025-05-01", jam_mulai: "10:00", jam_selesai: "12:00", is_tidak_spesifik: true, id_jasa: 3, jasa: jasa[0], acara_performer: [] },
      ],
    };
    render(() => <EventWizard acara={acaraLama} langkahAwal={2} onSimpan={onSimpan} onTutup={() => {}} />);

    expect(screen.getByLabelText(/Tanggal mulai/).getAttribute("min")).toBeNull();
    expect(screen.getByLabelText(/Tanggal selesai/).getAttribute("min")).toBe("2025-05-01");

    klik("Simpan event");
    await waitFor(() => expect(onSimpan).toHaveBeenCalled());
  });
});
