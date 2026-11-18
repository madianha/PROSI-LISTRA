import { A, useNavigate } from "@solidjs/router";
import { createMemo, createResource, createSignal, For, Match, Show, Switch } from "solid-js";
import { faChevronLeft, faChevronRight, faEyeSlash, faLocationDot, faPlus } from "@fortawesome/free-solid-svg-icons";
import Icon from "../../components/Icon";
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
  NAMA_HARI,
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

// warna per jenis acara: dipakai di kotak kalender, kartu, dan keterangan
export const WARNA_TIPE = {
  job_external: "bg-[#39000a] text-white",
  listra: "bg-[#f3e2a9] text-[#4c3a06]",
};

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
  const perTanggal = createMemo(() => {
    const peta = {};
    for (const a of terfilter()) for (const t of new Set(a.acara_jasa.map((r) => r.tanggal))) (peta[t] ??= []).push(a);
    return peta;
  });

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
        <div className="ml-auto flex flex-wrap gap-2 text-xs">
          <span className={`rounded px-2 py-0.5 ${WARNA_TIPE.job_external}`}>{NAMA_TIPE.job_external}</span>
          <span className={`rounded px-2 py-0.5 ${WARNA_TIPE.listra}`}>{NAMA_TIPE.listra}</span>
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
          <div className="mt-4 hidden overflow-hidden rounded-xl border border-[#f0dedf] bg-white sm:block">
            <div className="grid grid-cols-7 border-b border-[#f0dedf] text-center text-xs font-semibold text-[#685856]">
              <For each={NAMA_HARI}>{(h) => <div className="py-2">{h}</div>}</For>
            </div>
            <div className="grid grid-cols-7">
              <For each={grid()}>
                {(sel) => (
                  <div
                    className={`min-h-24 border-b border-r border-[#f5ecea] p-1.5 [&:nth-child(7n)]:border-r-0 ${
                      sel.diBulanIni ? "" : "bg-[#fbf8f6]"
                    }`}
                  >
                    <p
                      className={`text-xs ${
                        sel.tanggal === hariIni()
                          ? "inline-grid size-6 place-items-center rounded-full bg-[#39000a] font-bold text-white"
                          : sel.diBulanIni
                            ? "text-[#302929]"
                            : "text-[#b8a7a5]"
                      }`}
                    >
                      {Number(sel.tanggal.slice(8))}
                    </p>
                    <div className="mt-1 space-y-1">
                      <For each={(perTanggal()[sel.tanggal] ?? []).slice(0, 2)}>
                        {(a) => (
                          <button
                            type="button"
                            onClick={() => pilih(a.id_acara)}
                            title={a.nama_acara}
                            // truncate = nama panjang dipotong dengan "..."
                            className={`block w-full cursor-pointer truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium ${WARNA_TIPE[a.tipe_acara]}`}
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
                    className={`rounded-xl border bg-white p-4 ${dipilih() === a.id_acara ? "border-[#39000a] ring-1 ring-[#39000a]" : "border-[#f0dedf]"}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className={`rounded px-2 py-0.5 ${WARNA_TIPE[a.tipe_acara]}`}>{NAMA_TIPE[a.tipe_acara]}</span>
                          <Show when={a.is_privat}>
                            <span className="inline-flex items-center gap-1 text-[#685856]">
                              <Icon icon={faEyeSlash} /> Nama disembunyikan di publik
                            </span>
                          </Show>
                        </div>
                        <h3 className="mt-1 font-semibold text-[#302929]">{a.nama_acara}</h3>
                        <p className="text-sm text-[#685856]">
                          {formatRentang(a.tanggal_mulai, a.tanggal_selesai)}
                          <Show when={a.lokasi}>
                            {" · "}
                            <Icon icon={faLocationDot} class="text-xs" /> {a.lokasi}
                          </Show>
                        </p>
                        <p className="mt-1 text-sm text-[#685856]">PJ: {namaPj(a)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <WarnaKecukupan kecukupan={a.kecukupan} />
                        <A
                          href={`/internal/kalender/${a.id_acara}`}
                          aria-label={`Kelola acara ${a.nama_acara}`}
                          className="inline-flex min-h-11 items-center rounded-lg border border-[#e6cfcf] px-4 text-sm font-semibold text-[#54141d] hover:bg-[#fdf7f7]"
                        >
                          Kelola acara
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
