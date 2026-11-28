// Bantuan tanggal untuk Kalender Event dan Jadwal Acara.
// Tanggal selalu berupa teks "YYYY-MM-DD" (sama seperti API) dan dihitung di UTC,
// supaya tidak bergeser satu hari karena zona waktu browser.

export const NAMA_TIPE = {
  job_external: "Acara Job External",
  listra: "Acara LISTRA",
};

export const NAMA_HARI = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const SEHARI = 86_400_000;

const keTanggal = (teks) => new Date(`${teks}T00:00:00Z`);
const keTeks = (date) => date.toISOString().slice(0, 10);

export function tambahHari(teks, n) {
  return keTeks(new Date(keTanggal(teks).getTime() + n * SEHARI));
}

/** Selisih hari: selisihHari("2026-12-01", "2026-12-03") = 2. */
export function selisihHari(dari, sampai) {
  return Math.round((keTanggal(sampai) - keTanggal(dari)) / SEHARI);
}

/** Semua tanggal dari mulai sampai selesai (inklusif). Kosong bila selesai sebelum mulai. */
export function daftarTanggal(mulai, selesai) {
  const jumlah = selisihHari(mulai, selesai);
  return jumlah < 0 ? [] : Array.from({ length: jumlah + 1 }, (_, i) => tambahHari(mulai, i));
}

/** Tanggal hari ini menurut jam pengguna. */
export function hariIni() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function bulanDari(teks) {
  return { tahun: Number(teks.slice(0, 4)), bulan: Number(teks.slice(5, 7)) };
}

export function geserBulan({ tahun, bulan }, n) {
  const indeks = tahun * 12 + (bulan - 1) + n;
  return { tahun: Math.floor(indeks / 12), bulan: (indeks % 12) + 1 };
}

export function rentangBulan({ tahun, bulan }) {
  const dari = `${tahun}-${String(bulan).padStart(2, "0")}-01`;
  const awalBerikut = geserBulan({ tahun, bulan }, 1);
  const sampai = tambahHari(`${awalBerikut.tahun}-${String(awalBerikut.bulan).padStart(2, "0")}-01`, -1);
  return { dari, sampai };
}

/** Kotak-kotak kalender bulanan: Senin sebelum tanggal 1 sampai Minggu setelah tanggal terakhir. */
export function gridBulan(bulan) {
  const { dari, sampai } = rentangBulan(bulan);
  // getUTCDay: 0 = Minggu, jadi (hari + 6) % 7 = jumlah hari sejak Senin
  const awal = tambahHari(dari, -((keTanggal(dari).getUTCDay() + 6) % 7));
  const akhir = tambahHari(sampai, (7 - keTanggal(sampai).getUTCDay()) % 7);
  return daftarTanggal(awal, akhir).map((tanggal) => ({ tanggal, diBulanIni: tanggal >= dari && tanggal <= sampai }));
}

function format(teks, opsi) {
  return keTanggal(teks).toLocaleDateString("id-ID", { ...opsi, timeZone: "UTC" });
}

/** "Sab, 12 Des 2026" */
export function formatTanggal(teks) {
  return format(teks, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

/** "Desember 2026" */
export function formatBulan({ tahun, bulan }) {
  return format(`${tahun}-${String(bulan).padStart(2, "0")}-01`, { month: "long", year: "numeric" });
}

/** "12 Des 2026", "12–13 Des 2026", "30 Nov – 2 Des 2026", "31 Des 2026 – 1 Jan 2027" */
export function formatRentang(mulai, selesai) {
  const lengkap = (t) => format(t, { day: "numeric", month: "short", year: "numeric" });
  if (!selesai || mulai === selesai) return lengkap(mulai);
  if (mulai.slice(0, 7) === selesai.slice(0, 7)) return `${Number(mulai.slice(8))}–${lengkap(selesai)}`;
  if (mulai.slice(0, 4) === selesai.slice(0, 4)) return `${format(mulai, { day: "numeric", month: "short" })} – ${lengkap(selesai)}`;
  return `${lengkap(mulai)} – ${lengkap(selesai)}`;
}

/** "16:00" -> "16.00" (penulisan jam di Indonesia) */
export function formatJam(jam) {
  return (jam ?? "").replace(":", ".");
}

/**
 * Ketikan jam 24 jam -> "HH:MM" (format yang disimpan backend), atau "" bila bukan jam yang sah.
 * "16.00", "16:00", "1600", "16" -> "16:00"; "930", "9.30" -> "09:30"; "24.00", "7.75" -> ""
 */
export function parseJam(teks) {
  const cocok = /^(\d{1,2})(?:[.:]?(\d{2}))?$/.exec((teks ?? "").replace(/\s/g, ""));
  if (!cocok) return "";
  const jam = Number(cocok[1]);
  const menit = Number(cocok[2] ?? 0);
  if (jam > 23 || menit > 59) return "";
  return `${String(jam).padStart(2, "0")}:${String(menit).padStart(2, "0")}`;
}

/** "3 / 5 · kurang 2", "5 / 5 · cukup"; null bila tidak ada jasa yang perlu performer. */
export function teksKecukupan({ terisi, dibutuhkan }) {
  if (!dibutuhkan) return null;
  const kurang = dibutuhkan - terisi;
  return `${terisi} / ${dibutuhkan} · ${kurang > 0 ? `kurang ${kurang}` : "cukup"}`;
}

/** id_anggota pengguna yang sedang login (dari halaman login), atau null. */
export function idPenggunaLogin() {
  try {
    return JSON.parse(localStorage.getItem("listra_user") ?? "null")?.id_anggota ?? null;
  } catch {
    return null;
  }
}
