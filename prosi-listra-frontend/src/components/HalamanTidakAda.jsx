import { A, useLocation } from "@solidjs/router";
import { useJudulHalaman } from "../utils/judulHalaman";

/**
 * Halaman 404: alamat yang tidak ada, supaya tidak tampil layar kosong.
 * props.internal = di dalam panel internal (tautan kembali ke Kalender Event, bukan Beranda).
 */
export default function HalamanTidakAda(props) {
  const lokasi = useLocation();
  useJudulHalaman(() => "Halaman tidak ditemukan");
  return (
    <section className="mx-auto max-w-xl px-5 py-16 text-center">
      {/* emas tua #8a6500: tetap aksen emas, tapi kontrasnya cukup di latar terang */}
      <p className="font-serif text-5xl font-bold text-[#8a6500]">404</p>
      <h1 className="mt-3 font-serif text-2xl font-bold text-[#39000a]">Halaman tidak ditemukan</h1>
      <p className="mt-2 text-sm leading-relaxed text-[#685856]">
        Alamat <code className="rounded bg-[#f5efeb] px-1.5 py-0.5 text-[#302929]">{lokasi.pathname}</code> tidak ada. Periksa
        kembali alamatnya atau kembali ke halaman utama.
      </p>
      <A
        href={props.internal ? "/internal/kalender" : "/"}
        className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-[#39000a] px-4 text-sm font-semibold text-white hover:bg-[#5a0c1a]"
      >
        {props.internal ? "Ke Kalender Event" : "Ke Beranda"}
      </A>
    </section>
  );
}
