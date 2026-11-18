import { A } from "@solidjs/router";
import { createResource, createSignal, For, Match, Show, Switch } from "solid-js";
import { faChevronLeft, faChevronRight, faLocationDot } from "@fortawesome/free-solid-svg-icons";
import CustomHeader from "../components/CustomHeader";
import Icon from "../components/Icon";
import { listJadwal } from "../api/acara";
import { bulanDari, formatBulan, formatJam, formatRentang, formatTanggal, geserBulan, hariIni, rentangBulan } from "../utils/kalender";

/**
 * Jadwal Acara publik (UC-04): event per bulan dengan tanggal dan jam per hari.
 * Data dari /api/jadwal: tanpa Nama Client, PJ, dan performer; acara privat sudah bernama "Acara privat".
 */
export default function Jadwal() {
  const [bulan, setBulan] = createSignal(bulanDari(hariIni()));
  const [jadwal, { refetch }] = createResource(() => rentangBulan(bulan()), (r) => listJadwal(r));

  return (
    <>
      <CustomHeader category="Agenda" pageName="Jadwal Acara" colorText="text-white">
        <p>Tanggal dan jam pertunjukan LISTRA. Acara pribadi klien ditampilkan sebagai "Acara privat".</p>
      </CustomHeader>

      <main className="mx-auto w-full max-w-4xl bg-[#fffafa] px-5 py-8 sm:px-8">
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            aria-label="Bulan sebelumnya"
            onClick={() => setBulan(geserBulan(bulan(), -1))}
            className="grid size-11 cursor-pointer place-items-center rounded-lg text-[#54141d] hover:bg-[#fff0f1]"
          >
            <Icon icon={faChevronLeft} />
          </button>
          <h2 className="min-w-44 text-center font-serif text-xl font-bold text-[#54141d]" aria-live="polite">
            {formatBulan(bulan())}
          </h2>
          <button
            type="button"
            aria-label="Bulan berikutnya"
            onClick={() => setBulan(geserBulan(bulan(), 1))}
            className="grid size-11 cursor-pointer place-items-center rounded-lg text-[#54141d] hover:bg-[#fff0f1]"
          >
            <Icon icon={faChevronRight} />
          </button>
        </div>

        <div className="mt-6">
          <Switch>
            <Match when={jadwal.loading}>
              <p className="text-center text-sm text-[#7d6966]">Memuat jadwal...</p>
            </Match>
            <Match when={jadwal.error}>
              <p className="text-center text-sm text-[#7d6966]">
                Jadwal belum bisa dimuat.{" "}
                <button type="button" onClick={refetch} className="min-h-11 cursor-pointer px-1 font-semibold text-[#54141d] underline">
                  Coba lagi
                </button>
              </p>
            </Match>
            <Match when={jadwal()?.length === 0}>
              <p className="rounded-xl border border-[#f0d9d8] bg-white p-8 text-center text-sm text-[#7d6966]">
                Belum ada acara terjadwal di {formatBulan(bulan())}. Coba lihat bulan lain.
              </p>
            </Match>
            <Match when={jadwal()}>
              <ul className="space-y-3">
                <For each={jadwal()}>
                  {(a) => {
                    const hari = a.acara_jasa.map((r) => r.tanggal).sort();
                    return (
                      <li className="rounded-xl border border-[#f0d9d8] bg-white p-4 sm:p-5">
                        <h3 className="font-serif text-lg font-bold text-[#54141d]">{a.nama_acara}</h3>
                        <p className="mt-1 text-sm text-[#7d6966]">
                          {formatRentang(hari[0], hari[hari.length - 1])}
                          <Show when={a.lokasi}>
                            {" · "}
                            <Icon icon={faLocationDot} class="text-xs" /> {a.lokasi}
                          </Show>
                        </p>
                        <ul className="mt-3 divide-y divide-[#f5e6e6] border-t border-[#f5e6e6]">
                          <For each={a.acara_jasa}>
                            {(r) => (
                              <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
                                <span className="w-32 text-[#302929]">{formatTanggal(r.tanggal)}</span>
                                <span className="w-28 font-semibold text-[#302929]">
                                  {formatJam(r.jam_mulai)}–{formatJam(r.jam_selesai)}
                                </span>
                                {/* jasa aktif bisa dibuka detailnya; jasa nonaktif hanya ditulis namanya */}
                                <Show when={r.jasa}>
                                  <Show when={r.jasa.is_aktif} fallback={<span className="text-[#7d6966]">{r.jasa.nama}</span>}>
                                    <A href={`/jasa/${r.jasa.id_jasa}`} className="font-medium text-[#54141d] underline-offset-2 hover:underline">
                                      {r.jasa.nama}
                                    </A>
                                  </Show>
                                </Show>
                              </li>
                            )}
                          </For>
                        </ul>
                      </li>
                    );
                  }}
                </For>
              </ul>
            </Match>
          </Switch>
        </div>
      </main>
    </>
  );
}
