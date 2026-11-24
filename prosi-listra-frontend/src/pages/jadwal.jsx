import { A } from "@solidjs/router";
import { createEffect, createMemo, createResource, createSignal, For, Match, Show, Switch } from "solid-js";
import { faChevronLeft, faChevronRight, faLocationDot } from "@fortawesome/free-solid-svg-icons";
import CustomHeader from "../components/CustomHeader";
import Icon from "../components/Icon";
import KalenderBulan, { KeteranganTipe, WARNA_TIPE } from "../components/KalenderBulan";
import { listJadwal } from "../api/acara";
import { bulanDari, formatBulan, formatJam, formatRentang, formatTanggal, geserBulan, gridBulan, hariIni, NAMA_TIPE, rentangBulan } from "../utils/kalender";
import { useJudulHalaman } from "../utils/judulHalaman";

/**
 * Jadwal Acara publik (UC-04): event per bulan dengan tanggal dan jam per hari.
 * Data dari /api/jadwal: tanpa Nama Client, PJ, dan performer; acara privat sudah bernama "Acara privat".
 */
export default function Jadwal() {
  const [bulan, setBulan] = createSignal(bulanDari(hariIni()));
  const [dipilih, setDipilih] = createSignal(null);
  useJudulHalaman(() => "Jadwal Acara");
  // ambil semua event yang tampil di kotak kalender (termasuk hari bulan sebelah)
  const rentangGrid = createMemo(() => {
    const grid = gridBulan(bulan());
    return { dari: grid[0].tanggal, sampai: grid[grid.length - 1].tanggal };
  });
  const [jadwal, { refetch }] = createResource(rentangGrid, (r) => listJadwal(r));
  const semua = () => (jadwal.error ? [] : jadwal() ?? []);
  // daftar di bawah kalender: event yang punya minimal satu hari di bulan ini
  const bulanIni = createMemo(() => {
    const { dari, sampai } = rentangBulan(bulan());
    return semua().filter((a) => a.acara_jasa.some((r) => r.tanggal >= dari && r.tanggal <= sampai));
  });
  // gulir ke kartu acara; halus, kecuali pengguna meminta gerakan dikurangi (pengaturan sistem)
  const gulirKe = (kartu) => {
    const kurangiGerak = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    kartu.scrollIntoView({ behavior: kurangiGerak ? "auto" : "smooth", block: "center" });
  };
  // acara dari bulan sebelah (kotak abu-abu di kalender) belum punya kartu di daftar bulan ini:
  // pindah ke bulan acara itu dulu, lalu gulir setelah daftarnya tampil
  const [menungguGulir, setMenungguGulir] = createSignal(null);
  const pilih = (id) => {
    setDipilih(id);
    const kartu = document.getElementById(`jadwal-${id}`);
    if (kartu) return gulirKe(kartu);
    const tanggalPertama = semua()
      .find((a) => a.id_acara === id)
      ?.acara_jasa.map((r) => r.tanggal)
      .sort()[0];
    if (!tanggalPertama) return;
    setMenungguGulir(id);
    setBulan(bulanDari(tanggalPertama));
  };
  createEffect(() => {
    const id = menungguGulir();
    if (id == null || jadwal.loading) return;
    const kartu = document.getElementById(`jadwal-${id}`);
    if (kartu) {
      setMenungguGulir(null);
      gulirKe(kartu);
    }
  });

  return (
    <>
      <CustomHeader pageName="Jadwal Acara">
        <p>Tanggal dan jam pertunjukan LISTRA. Acara pribadi klien ditampilkan sebagai "Acara privat".</p>
      </CustomHeader>

      <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8">
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
            <Match when={jadwal.loading && !jadwal.latest}>
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
            <Match when={jadwal()}>
              <div className="mb-2 flex justify-end">
                <KeteranganTipe />
              </div>
              <KalenderBulan bulan={bulan()} acara={semua()} onPilih={pilih} />

              <Show
                when={bulanIni().length > 0}
                fallback={
                  <p className="mt-4 rounded-xl border border-[#f0d9d8] bg-white p-8 text-center text-sm text-[#7d6966]">
                    Belum ada acara terjadwal di {formatBulan(bulan())}. Coba lihat bulan lain.
                  </p>
                }
              >
              <ul className="mt-4 space-y-3">
                <For each={bulanIni()}>
                  {(a) => {
                    const hari = a.acara_jasa.map((r) => r.tanggal).sort();
                    return (
                      <li
                        id={`jadwal-${a.id_acara}`}
                        className={`rounded-xl border bg-white p-4 sm:p-5 ${dipilih() === a.id_acara ? "border-[#54141d] ring-1 ring-[#54141d]" : "border-[#f0d9d8]"}`}
                      >
                        {/* label jenis acara memakai warna yang sama dengan kalender dan keterangannya */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h3 className="font-serif text-lg font-bold text-[#54141d]">{a.nama_acara}</h3>
                          <span className={`rounded px-2 py-0.5 text-xs ${WARNA_TIPE[a.tipe_acara]}`}>{NAMA_TIPE[a.tipe_acara]}</span>
                        </div>
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
                                    {/* selalu bergaris bawah: tautan tidak dibedakan dari teks lain hanya lewat warna */}
                                    <A href={`/jasa/${r.jasa.id_jasa}`} className="font-medium text-[#54141d] underline underline-offset-2 hover:decoration-2">
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
              </Show>
            </Match>
          </Switch>
        </div>
      </div>
    </>
  );
}
