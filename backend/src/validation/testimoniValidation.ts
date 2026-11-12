// Aturan mengikuti tabel testimoni di listra-web/db/master.sql

export interface TestimoniInput {
  nama_klien: string;
  instansi: string | null;
  nama_acara: string | null;
  is_acara_privat: boolean;
  isi_testimoni: string;
  rating: number | null;
}

export const STATUS_TESTIMONI = ["menunggu", "disetujui", "ditolak"] as const;
export const SUMBER_TESTIMONI = ["web", "whatsapp"] as const;

type Hasil = { ok: true; data: TestimoniInput } | { ok: false; message: string };

/** Teks opsional: kosong / hanya spasi = null. */
function teksOpsional(nilai: unknown): string | null {
  return typeof nilai === "string" && nilai.trim() !== "" ? nilai.trim() : null;
}

export function validateTestimoni(body: unknown): Hasil {
  if (!body || typeof body !== "object") return { ok: false, message: "Data tidak valid." };
  const b = body as Record<string, unknown>;

  const nama_klien = teksOpsional(b.nama_klien);
  if (!nama_klien) return { ok: false, message: "Nama wajib diisi." };
  if (nama_klien.length > 100) return { ok: false, message: "Nama maksimal 100 karakter." };

  const instansi = teksOpsional(b.instansi);
  if (instansi && instansi.length > 150) return { ok: false, message: "Instansi maksimal 150 karakter." };

  const nama_acara = teksOpsional(b.nama_acara);
  if (nama_acara && nama_acara.length > 150) return { ok: false, message: "Nama acara maksimal 150 karakter." };

  const isi_testimoni = teksOpsional(b.isi_testimoni);
  if (!isi_testimoni) return { ok: false, message: "Isi testimoni wajib diisi." };

  // rating boleh kosong; bila diisi harus bilangan bulat 1 sampai 5
  let rating: number | null = null;
  if (b.rating !== undefined && b.rating !== null && b.rating !== "") {
    const angka = Number(b.rating);
    if (!Number.isInteger(angka) || angka < 1 || angka > 5) {
      return { ok: false, message: "Rating harus 1 sampai 5." };
    }
    rating = angka;
  }

  return {
    ok: true,
    data: {
      nama_klien,
      instansi,
      nama_acara,
      is_acara_privat: b.is_acara_privat === true,
      isi_testimoni,
      rating,
    },
  };
}
