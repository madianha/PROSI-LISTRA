import { describe, expect, it } from "vitest";
import { normalJam, validateAcaraPayload } from "../src/validation/acaraValidation";

const hari = (tanggal: string, ubah: Record<string, unknown> = {}) => ({
  tanggal,
  jam_mulai: "16:00",
  jam_selesai: "18:00",
  id_jasa: 3,
  is_tidak_spesifik: false,
  acara_performer: [],
  ...ubah,
});

const job = (ubah: Record<string, unknown> = {}) => ({
  tipe_acara: "job_external",
  nama_acara: "Resepsi Keluarga Wijaya",
  nama_klien: "Bapak Wijaya",
  lokasi: "Hotel Savoy Homann",
  is_privat: true,
  acara_pj: [2],
  acara_jasa: [hari("2026-12-12")],
  ...ubah,
});

const gagal = (body: unknown) => {
  const r = validateAcaraPayload(body);
  if (r.ok) throw new Error("seharusnya gagal");
  return r.message;
};

describe("validateAcaraPayload", () => {
  it("menerima Acara Job External lengkap dan menormalkan isinya", () => {
    const r = validateAcaraPayload(
      job({
        nama_acara: "  Resepsi  ",
        acara_pj: [2, { id_anggota: 5 }, "2"],
        acara_jasa: [
          hari("2026-12-12", { jam_mulai: "9:00", jam_selesai: "10:30:00", acara_performer: [{ id_anggota: 7 }, { nama_performer: " Rina " }] }),
          hari("2026-12-12", { id_jasa: 4, jam_mulai: "19:00", jam_selesai: "21:00" }),
        ],
      })
    );
    expect(r).toEqual({
      ok: true,
      data: {
        tipe_acara: "job_external",
        nama_acara: "Resepsi",
        nama_klien: "Bapak Wijaya",
        lokasi: "Hotel Savoy Homann",
        is_privat: true,
        acara_pj: [2, 5],
        acara_jasa: [
          {
            tanggal: "2026-12-12",
            jam_mulai: "09:00",
            jam_selesai: "10:30",
            id_jasa: 3,
            is_tidak_spesifik: false,
            acara_performer: [
              { id_anggota: 7, nama_performer: null },
              { id_anggota: null, nama_performer: "Rina" },
            ],
          },
          { tanggal: "2026-12-12", jam_mulai: "19:00", jam_selesai: "21:00", id_jasa: 4, is_tidak_spesifik: false, acara_performer: [] },
        ],
      },
    });
  });

  it("Acara LISTRA: Nama Client selalu NULL dan PJ boleh kosong (PJ Tidak Spesifik)", () => {
    const r = validateAcaraPayload(job({ tipe_acara: "listra", nama_klien: "Tidak dipakai", acara_pj: [] }));
    expect(r.ok && r.data.nama_klien).toBeNull();
    expect(r.ok && r.data.acara_pj).toEqual([]);
  });

  it("hari tanpa jasa (id_jasa NULL) tidak pernah bertanda Tidak Spesifik", () => {
    const r = validateAcaraPayload(job({ acara_jasa: [hari("2026-12-12", { id_jasa: null, is_tidak_spesifik: true })] }));
    expect(r.ok && r.data.acara_jasa[0]).toMatchObject({ id_jasa: null, is_tidak_spesifik: false });
  });

  it.each([
    [{ tipe_acara: "rapat" }, /jenis acara/i],
    [{ nama_acara: " " }, /nama event wajib/i],
    [{ nama_acara: "x".repeat(151) }, /150 karakter/],
    [{ nama_klien: "x".repeat(101) }, /100 karakter/],
    [{ lokasi: "x".repeat(201) }, /200 karakter/],
    [{ acara_pj: [] }, /wajib punya minimal satu PJ/],
    [{ acara_pj: [0] }, /PJ tidak valid/],
    [{ acara_jasa: [] }, /minimal satu hari/],
    [{ acara_jasa: [hari("2026-02-30")] }, /tanggal/i],
    [{ acara_jasa: [hari("2026-12-12", { jam_mulai: "" })] }, /wajib diisi/],
    [{ acara_jasa: [hari("2026-12-12", { jam_mulai: "18:00", jam_selesai: "18:00" })] }, /setelah jam mulai/],
    [{ acara_jasa: [hari("2026-12-12", { jam_selesai: "25:00" })] }, /wajib diisi/],
    [{ acara_jasa: [hari("2026-12-01"), hari("2026-12-08")] }, /7 hari/],
    [{ acara_jasa: [hari("2026-12-12", { id_jasa: "abc" })] }, /jasa pada/i],
    [{ acara_jasa: [hari("2026-12-12", { acara_performer: [{ id_anggota: 7 }, { id_anggota: 7 }] })] }, /dua kali/],
    [{ acara_jasa: [hari("2026-12-12", { acara_performer: [{ nama_performer: "" }] })] }, /non-anggota .* wajib/],
    [{ acara_jasa: [hari("2026-12-12", { acara_performer: [{ id_anggota: 7, nama_performer: "Rina" }] })] }, /bukan keduanya/],
    [{ acara_jasa: [hari("2026-12-12", { is_tidak_spesifik: true, acara_performer: [{ id_anggota: 7 }] })] }, /Tidak Spesifik/],
    [{ acara_jasa: [hari("2026-12-12", { id_jasa: null, acara_performer: [{ id_anggota: 7 }] })] }, /Tidak Spesifik/],
  ])("menolak %o", (ubah, pesan) => {
    expect(gagal(job(ubah))).toMatch(pesan);
  });

  it("rentang tepat 7 hari masih diterima", () => {
    expect(validateAcaraPayload(job({ acara_jasa: [hari("2026-12-01"), hari("2026-12-07")] })).ok).toBe(true);
  });
});

describe("normalJam", () => {
  it.each([
    ["9:05", "09:05"],
    ["09:05:00", "09:05"],
    ["23:59", "23:59"],
    ["24:00", null],
    ["12:60", null],
    ["siang", null],
  ])("%s -> %s", (input, hasil) => {
    expect(normalJam(input)).toBe(hasil);
  });
});
