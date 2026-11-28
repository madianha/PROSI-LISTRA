import { createMemo, For, Show } from "solid-js";
import { gridBulan, hariIni, NAMA_HARI, NAMA_TIPE } from "../utils/kalender";

// warna per jenis acara: dipakai di kotak kalender, kartu, dan keterangan (internal & publik)
export const WARNA_TIPE = {
  job_external: "bg-[#39000a] text-white",
  listra: "bg-[#f3e2a9] text-[#4c3a06]",
};

/** Keterangan warna jenis acara. */
export function KeteranganTipe() {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <span className={`rounded px-2 py-0.5 ${WARNA_TIPE.job_external}`}>{NAMA_TIPE.job_external}</span>
      <span className={`rounded px-2 py-0.5 ${WARNA_TIPE.listra}`}>{NAMA_TIPE.listra}</span>
    </div>
  );
}

/**
 * Kalender bulanan (Senin-Minggu). Setiap event tampil di setiap harinya.
 * props.bulan   = { tahun, bulan }
 * props.acara   = daftar event; tiap event punya id_acara, tipe_acara, nama_acara, acara_jasa[].tanggal
 * props.onPilih = (id_acara) => ..., dipanggil saat nama event di kotak ditekan
 * Hanya tampil di layar sm ke atas; di HP daftar kartu event di bawahnya sudah cukup.
 */
export default function KalenderBulan(props) {
  const grid = createMemo(() => gridBulan(props.bulan));
  const perTanggal = createMemo(() => {
    const peta = {};
    for (const a of props.acara ?? []) for (const t of new Set(a.acara_jasa.map((r) => r.tanggal))) (peta[t] ??= []).push(a);
    return peta;
  });

  return (
    <div className="hidden overflow-hidden rounded-xl border border-[#f0dedf] bg-white sm:block">
      <div className="grid grid-cols-7 border-b border-[#f0dedf] text-center text-xs font-semibold text-[#685856]">
        <For each={NAMA_HARI}>{(h) => <div className="py-2">{h}</div>}</For>
      </div>
      <div className="grid grid-cols-7">
        <For each={grid()}>
          {(sel) => (
            // [&:nth-child(7n)]:border-r-0 = kotak terakhir tiap baris tanpa garis kanan
            <div className={`min-h-24 border-b border-r border-[#f5ecea] p-1.5 [&:nth-child(7n)]:border-r-0 ${sel.diBulanIni ? "" : "bg-[#fbf8f6]"}`}>
              <p
                className={`text-xs ${
                  sel.tanggal === hariIni()
                    ? "inline-grid size-6 place-items-center rounded-full bg-[#39000a] font-bold text-white"
                    : sel.diBulanIni
                      ? "text-[#302929]"
                      : "text-[#7d6966]"
                }`}
              >
                {Number(sel.tanggal.slice(8))}
              </p>
              <div className="mt-1 space-y-1">
                <For each={(perTanggal()[sel.tanggal] ?? []).slice(0, 2)}>
                  {(a) => (
                    <button
                      type="button"
                      onClick={() => props.onPilih?.(a.id_acara)}
                      title={a.status === "dibatalkan" ? `${a.nama_acara} (Dibatalkan)` : a.nama_acara}
                      // truncate = nama panjang dipotong dengan "..."
                      className={`block w-full cursor-pointer truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium ${
                        a.status === "dibatalkan"
                          ? "border border-stone-300 bg-stone-100 text-stone-700"
                          : WARNA_TIPE[a.tipe_acara]
                      }`}
                    >
                      {a.nama_acara}
                    </button>
                  )}
                </For>
                <Show when={(perTanggal()[sel.tanggal] ?? []).length > 2}>
                  <p className="px-1 text-[11px] text-[#685856]">+{perTanggal()[sel.tanggal].length - 2} lagi</p>
                </Show>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
