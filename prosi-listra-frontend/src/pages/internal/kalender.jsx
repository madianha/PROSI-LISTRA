import { A, useNavigate } from "@solidjs/router";
import { createMemo, createResource, createSignal, For, Match, Show, Switch } from "solid-js";
import { faChevronLeft, faChevronRight, faEyeSlash, faLocationDot, faPlus } from "@fortawesome/free-solid-svg-icons";
import Icon from "../../components/Icon";
import KalenderBulan, { KeteranganTipe, WARNA_TIPE } from "../../components/KalenderBulan";
import EventWizard from "../../components/internal/kalender/EventWizard";
import { createAcara, listAcara } from "../../api/acara";
import {
  bulanDari,
  formatBulan,
  formatRentang,
  geserBulan,
  gridBulan,
  hariIni,
  idPenggunaLogin,
  NAMA_TIPE,
  rentangBulan,
  teksKecukupan,
} from "../../utils/kalender";

const FILTER = [
  { nilai: "semua", label: "Semua" },
  { nilai: "job_external", label: "Acara Job External" },
  { nilai: "listra", label: "Acara LISTRA" },
  { nilai: "tugas", label: "Tugas saya" },
];

export { WARNA_TIPE };

export function WarnaKecukupan(props) {
  const teks = () => teksKecukupan(props.kecukupan);
  return (
    <Show when={teks()}>
      <span
        className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold ${
          props.kecukupan.kurang > 0 ? "border-red-200 bg-red-50 text-red-800" : "border-green-200 bg-green-50 text-green-800"
        }`}
      >
        {teks()}
      </span>
    </Show>
  );
}

/** Kalender Event internal (UC-09): kalender bulanan, filter, dan kartu event. */
export default function InternalKalender() {
  const navigate = useNavigate();
  const [bulan, setBulan] = createSignal(bulanDari(hariIni()));
  const [filter, setFilter] = createSignal("semua");
  const [dipilih, setDipilih] = createSignal(null);
  const [wizardTerbuka, setWizardTerbuka] = createSignal(false);
  const idSaya = idPenggunaLogin();

  const grid = createMemo(() => gridBulan(bulan()));
  // ambil semua event yang tampil di kotak kalender (termasuk hari bulan sebelah)
  const rentang = createMemo(() => ({ dari: grid()[0].tanggal, sampai: grid()[grid().length - 1].tanggal }));
  const [acara, { refetch }] = createResource(rentang, (r) => listAcara(r));
  const daftar = () => (acara.error ? [] : acara() ?? []);

  const bertugas = (a) => a.acara_jasa.some((r) => r.acara_performer.some((p) => p.id_anggota === idSaya));
  const cocok = (a, f) => (f === "semua" ? true : f === "tugas" ? bertugas(a) : a.tipe_acara === f);

  const terfilter = createMemo(() => daftar().filter((a) => cocok(a, filter())));
  // kartu: event yang punya minimal satu hari di bulan ini
  const kartu = createMemo(() => {
    const { dari, sampai } = rentangBulan(bulan());
    return terfilter().filter((a) => a.acara_jasa.some((r) => r.tanggal >= dari && r.tanggal <= sampai));
  });
  const jumlah = (f) => {
    const { dari, sampai } = rentangBulan(bulan());
    return daftar().filter((a) => cocok(a, f) && a.acara_jasa.some((r) => r.tanggal >= dari && r.tanggal <= sampai)).length;
  };

  const pilih = (id) => {
    setDipilih(id);
    document.getElementById(`acara-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const kosong = () => {
    const nama = formatBulan(bulan());
    if (filter() === "semua") return `Belum ada event di ${nama}. Tekan Buat Event Baru untuk mencatat event.`;
    if (filter() === "tugas") return `Anda tidak bertugas sebagai performer di ${nama}.`;
    return `Tidak ada ${FILTER.find((f) => f.nilai === filter()).label} di ${nama}.`;
  };

  const namaPj = (a) =>
    a.acara_pj.length > 0 ? a.acara_pj.map((p) => p.nama).join(", ") : a.tipe_acara === "listra" ? "PJ Tidak Spesifik" : "-";

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#39000a]">Kalender Event</h1>
          <p className="mt-1 text-sm text-[#685856]">Acara Job External dan Acara LISTRA per bulan, beserta kecukupan performernya.</p>
        </div>
        <button
          type="button"
          onClick={() => setWizardTerbuka(true)}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-[#39000a] px-4 text-sm font-semibold text-white hover:bg-[#5a0c1a] active:bg-[#2a0007]"
        >
          <Icon icon={faPlus} class="text-xs" /> Buat Event Baru
        </button>
      </div>

      {/* Pindah bulan */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-label="Bulan sebelumnya"
          onClick={() => setBulan(geserBulan(bulan(), -1))}
          className="grid size-11 cursor-pointer place-items-center rounded-lg text-[#39000a] hover:bg-white"
        >
          <Icon icon={faChevronLeft} />
        </button>
        <h2 className="min-w-40 text-center font-serif text-lg font-bold text-[#302929]" aria-live="polite">
          {formatBulan(bulan())}
        </h2>
        <button
          type="button"
          aria-label="Bulan berikutnya"
          onClick={() => setBulan(geserBulan(bulan(), 1))}
          className="grid size-11 cursor-pointer place-items-center rounded-lg text-[#39000a] hover:bg-white"
        >
          <Icon icon={faChevronRight} />
        </button>
        <button
          type="button"
          onClick={() => setBulan(bulanDari(hariIni()))}
          className="min-h-11 cursor-pointer rounded-lg px-3 text-sm font-semibold text-[#685856] hover:bg-white"
        >
          Bulan ini
        </button>
        {/* keterangan warna jenis acara */}
        <div className="ml-auto">
          <KeteranganTipe />
        </div>
      </div>

      {/* Filter; overflow-x-auto = bisa digeser di HP */}
      <div role="tablist" aria-label="Filter event" className="mt-3 flex gap-1 overflow-x-auto border-b border-[#f0dedf]">
        <For each={FILTER}>
          {(f) => (
            <button
              type="button"
              role="tab"
              aria-selected={filter() === f.nilai}
              onClick={() => setFilter(f.nilai)}
              className={`min-h-11 shrink-0 cursor-pointer border-b-2 px-3 text-sm font-semibold ${
                filter() === f.nilai ? "border-[#39000a] text-[#39000a]" : "border-transparent text-[#685856] hover:text-[#302929]"
              }`}
            >
              {f.label} <span className="font-normal">({jumlah(f.nilai)})</span>
            </button>
          )}
        </For>
      </div>

      <Switch>
        <Match when={acara.loading && !acara.latest}>
          <p className="p-8 text-center text-sm text-[#685856]">Memuat kalender...</p>
        </Match>
        <Match when={acara.error}>
          <div className="p-8 text-center text-sm text-[#685856]">
            Kalender belum bisa dimuat.{" "}
            <button type="button" onClick={refetch} className="min-h-11 cursor-pointer px-2 font-semibold text-[#54141d] underline">
              Coba lagi
            </button>
          </div>
        </Match>
        <Match when={true}>
          {/* Kalender bulanan: hanya di layar sm ke atas; di HP daftar kartu di bawah sudah cukup */}
          <div className="mt-4">
            <KalenderBulan bulan={bulan()} acara={terfilter()} onPilih={pilih} />
          </div>

          {/* Kartu event bulan ini */}
          <Show
            when={kartu().length > 0}
            fallback={<p className="mt-4 rounded-xl border border-[#f0dedf] bg-white p-8 text-center text-sm text-[#685856]">{kosong()}</p>}
          >
            <ul className="mt-4 space-y-3">
              <For each={kartu()}>
                {(a) => (
                  <li
                    id={`acara-${a.id_acara}`}
                    className={`rounded-xl border p-4 ${
                      a.status === "dibatalkan"
                        ? "border-[#e6d5d5] border-l-4 border-l-red-700 bg-[#faf7f6]"
                        : "border-[#f0dedf] bg-white"
                    } ${dipilih() === a.id_acara ? "border-[#39000a] ring-1 ring-[#39000a]" : ""}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className={`rounded px-2 py-0.5 ${WARNA_TIPE[a.tipe_acara]}`}>{NAMA_TIPE[a.tipe_acara]}</span>
                          <Show when={a.status === "dibatalkan"}>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 font-semibold text-red-800">
                              <span className="size-1.5 rounded-full bg-red-600" aria-hidden="true" />
                              Dibatalkan
                            </span>
                          </Show>
                          <Show when={a.is_privat}>
                            <span className="inline-flex items-center gap-1 text-[#685856]">
                              <Icon icon={faEyeSlash} /> Nama disembunyikan di publik
                            </span>
                          </Show>
                        </div>
                        <h3 className="mt-1.5 font-semibold text-[#302929]">{a.nama_acara}</h3>
                        <p className="text-sm text-[#685856]">
                          {formatRentang(a.tanggal_mulai, a.tanggal_selesai)}
                          <Show when={a.lokasi}>
                            {" · "}
                            <Icon icon={faLocationDot} class="text-xs" /> {a.lokasi}
                          </Show>
                        </p>
                        <p className="mt-1 text-sm text-[#685856]">PJ: {namaPj(a)}</p>
                        <Show when={a.status === "dibatalkan" && a.alasan_batal}>
                          <p className="mt-1.5 text-xs text-[#685856]">
                            <span className="font-semibold text-[#302929]">Alasan:</span> {a.alasan_batal}
                          </p>
                        </Show>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Show when={a.status !== "dibatalkan"}>
                          <WarnaKecukupan kecukupan={a.kecukupan} />
                        </Show>
                        <A
                          href={`/internal/kalender/${a.id_acara}`}
                          aria-label={`${a.status === "dibatalkan" ? "Lihat detail" : "Kelola acara"} ${a.nama_acara}`}
                          className="inline-flex min-h-11 items-center rounded-lg border border-[#e6cfcf] bg-white px-4 text-sm font-semibold text-[#54141d] hover:bg-[#fdf7f7]"
                        >
                          {a.status === "dibatalkan" ? "Lihat detail" : "Kelola acara"}
                        </A>
                      </div>
                    </div>
                  </li>
                )}
              </For>
            </ul>
          </Show>
        </Match>
      </Switch>

      <Show when={wizardTerbuka()}>
        <EventWizard
          onTutup={() => setWizardTerbuka(false)}
          onSimpan={async (data) => {
            const baru = await createAcara(data);
            setWizardTerbuka(false);
            // SRS UC-10: setelah disimpan, Detail Event terbuka
            navigate(`/internal/kalender/${baru.id_acara}`);
          }}
        />
      </Show>
    </div>
  );
}
