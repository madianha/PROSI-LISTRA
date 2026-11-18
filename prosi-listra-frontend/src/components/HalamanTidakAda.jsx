import { A, useLocation } from "@solidjs/router";

/**
 * Halaman 404: alamat yang tidak ada, supaya tidak tampil layar kosong.
 * props.internal = di dalam panel internal (tautan kembali ke Kalender Event, bukan Beranda).
 */
export default function HalamanTidakAda(props) {
  const lokasi = useLocation();
  return (
    <section className="mx-auto max-w-xl px-5 py-16 text-center">
      <p className="font-serif text-5xl font-bold text-[#dfb83b]">404</p>
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
