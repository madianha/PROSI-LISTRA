import { A, useParams } from "@solidjs/router";
import { createMemo, createResource, createSignal, createUniqueId, For, Match, onCleanup, onMount, Show, Switch } from "solid-js";
import { Portal } from "solid-js/web";
import { faBan, faChevronLeft, faEyeSlash, faLocationDot, faPen, faTimes, faUsers } from "@fortawesome/free-solid-svg-icons";
import Icon from "../../components/Icon";
import EventWizard from "../../components/internal/kalender/EventWizard";
import { cancelAcara, getAcara, updateAcara } from "../../api/acara";
import { formatJam, formatRentang, formatTanggal, NAMA_TIPE, selisihHari } from "../../utils/kalender";
import { WARNA_TIPE, WarnaKecukupan } from "./kalender";

function formatWaktuBatal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Detail Event: hari, jam, jasa per hari, performer, dan kecukupan. */
export default function InternalAcaraDetail() {
  const params = useParams();
  const [acara, { mutate, refetch }] = createResource(() => params.id, (id) => getAcara(id));
  // null = wizard tertutup; angka = langkah yang dibuka (2 = Info, 4 = Performer)
  const [wizard, setWizard] = createSignal(null);
  const [konfirmasiBatal, setKonfirmasiBatal] = createSignal(false);
  const [alasanBatal, setAlasanBatal] = createSignal("");
  const [membatalkan, setMembatalkan] = createSignal(false);
  const [pesanError, setPesanError] = createSignal("");

  // baris acara_jasa dikelompokkan per tanggal
  const hari = createMemo(() => {
    const a = acara.error ? null : acara();
    if (!a) return [];
    const peta = new Map();
    for (const r of a.acara_jasa) peta.set(r.tanggal, [...(peta.get(r.tanggal) ?? []), r]);
    return [...peta.entries()].map(([tanggal, baris]) => ({ tanggal, baris }));
  });

  const tutupModalBatal = () => {
    setKonfirmasiBatal(false);
    setAlasanBatal("");
  };

  const batalkan = async () => {
    setMembatalkan(true);
    setPesanError("");
    try {
      const hasil = await cancelAcara(acara().id_acara, alasanBatal());
      mutate(hasil);
      tutupModalBatal();
    } catch (error) {
      setPesanError(error.message);
      tutupModalBatal();
    } finally {
      setMembatalkan(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <A href="/internal/kalender" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#685856] hover:text-[#39000a]">
        <Icon icon={faChevronLeft} class="text-xs" /> Kalender Event
      </A>

      <Switch>
        <Match when={acara.loading}>
          <p className="p-8 text-center text-sm text-[#685856]">Memuat event...</p>
        </Match>
        <Match when={acara.error}>
          <div className="p-8 text-center text-sm text-[#685856]">
            {acara.error.message}{" "}
            <button type="button" onClick={refetch} className="min-h-11 cursor-pointer px-2 font-semibold text-[#54141d] underline">
              Coba lagi
            </button>
          </div>
        </Match>
        <Match when={acara()}>
          {(a) => (
            <>
              <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded px-2 py-0.5 ${WARNA_TIPE[a().tipe_acara]}`}>{NAMA_TIPE[a().tipe_acara]}</span>
                    <Show when={a().status === "dibatalkan"}>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 font-semibold text-red-800">
                        <span className="size-1.5 rounded-full bg-red-600" aria-hidden="true" />
                        Dibatalkan
                      </span>
                      <span className="inline-flex items-center gap-1 text-[#685856]">
                        <Icon icon={faEyeSlash} /> Tidak tampil di jadwal publik
                      </span>
                    </Show>
                    <Show when={a().status !== "dibatalkan" && a().is_privat}>
                      <span className="inline-flex items-center gap-1 text-[#685856]">
                        <Icon icon={faEyeSlash} /> Nama disembunyikan di jadwal publik
                      </span>
                    </Show>
                  </div>
                  <h1 className="mt-2 font-serif text-2xl font-bold text-[#39000a]">{a().nama_acara}</h1>
                  <p className="mt-1 text-sm text-[#685856]">
                    {formatRentang(a().tanggal_mulai, a().tanggal_selesai)}
                    <Show when={a().lokasi}>
                      {" · "}
                      <Icon icon={faLocationDot} class="text-xs" /> {a().lokasi}
                    </Show>
                  </p>
                </div>
                <Show when={a().status !== "dibatalkan"}>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setWizard(2)}
                      className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-[#e6cfcf] bg-white px-4 text-sm font-semibold text-[#54141d] hover:bg-[#fdf7f7]"
                    >
                      <Icon icon={faPen} class="text-xs" /> Ubah event
                    </button>
                    <button
                      type="button"
                      onClick={() => setKonfirmasiBatal(true)}
                      className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-4 text-sm font-semibold text-red-700 hover:bg-red-50"
                    >
                      <Icon icon={faBan} class="text-xs" /> Batalkan event
                    </button>
                  </div>
                </Show>
              </div>

              <Show when={a().status === "dibatalkan"}>
                <div
                  role="status"
                  className="mt-4 rounded-xl border border-[#e9d5d6] border-l-4 border-l-red-700 bg-[#fdf8f8] px-4 py-3.5 text-sm text-[#302929]"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-red-100 text-red-700">
                      <Icon icon={faBan} class="text-xs" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-semibold text-[#39000a]">Acara Dibatalkan</p>
                        <Show when={formatWaktuBatal(a().cancelled_at)}>
                          <span className="text-xs text-[#685856]">
                            Dibatalkan pada {formatWaktuBatal(a().cancelled_at)}
                          </span>
                        </Show>
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-[#685856]">
                        Event ini tetap tersimpan sebagai arsip riwayat dan tidak dapat diubah lagi.
                      </p>
                      <Show when={a().alasan_batal}>
                        <p className="mt-2.5 border-t border-[#eedbdc] pt-2 text-sm text-[#302929]">
                          <span className="font-semibold text-[#54141d]">Alasan:</span> {a().alasan_batal}
                        </p>
                      </Show>
                    </div>
                  </div>
                </div>
              </Show>

              <Show when={pesanError()}>
                <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
                  {pesanError()}
                </p>
              </Show>

              {/* Info tim */}
              <dl className="mt-4 grid gap-3 rounded-xl border border-[#f0dedf] bg-white p-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs font-semibold text-[#685856]">Penanggung Jawab</dt>
                  <dd className="mt-0.5 text-[#302929]">
                    {a().acara_pj.length > 0 ? a().acara_pj.map((p) => p.nama).join(", ") : "PJ Tidak Spesifik"}
                  </dd>
                </div>
                <Show when={a().tipe_acara === "job_external"}>
                  <div>
                    <dt className="text-xs font-semibold text-[#685856]">Nama Client</dt>
                    <dd className="mt-0.5 text-[#302929]">{a().nama_klien || "-"}</dd>
                  </div>
                </Show>
                <div>
                  <dt className="text-xs font-semibold text-[#685856]">Kecukupan performer</dt>
                  <dd className="mt-0.5">
                    <Show when={a().kecukupan.dibutuhkan > 0} fallback={<span className="text-[#685856]">Tidak ada jasa yang perlu performer</span>}>
                      <WarnaKecukupan kecukupan={a().kecukupan} />
                    </Show>
                  </dd>
                </div>
              </dl>

              {/* Hari demi hari */}
              <div className="mt-4 space-y-3">
                <For each={hari()}>
                  {(h) => (
                    <section className="rounded-xl border border-[#f0dedf] bg-white p-4">
                      <h2 className="text-sm font-semibold text-[#39000a]">
                        Hari {selisihHari(a().tanggal_mulai, h.tanggal) + 1} · {formatTanggal(h.tanggal)}
                      </h2>
                      <ul className="mt-2 space-y-2">
                        <For each={h.baris}>
                          {(r) => (
                            <li className="rounded-lg bg-[#fbf8f6] p-3">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm text-[#302929]">
                                    <span className="font-semibold">
                                      {formatJam(r.jam_mulai)}–{formatJam(r.jam_selesai)}
                                    </span>
                                    {" · "}
                                    <Show when={r.jasa} fallback={<span className="text-[#685856]">Tanpa jasa</span>}>
                                      {r.jasa.nama}
                                      <span className="text-[#685856]">
                                        {" "}
                                        ({r.jasa.tipe_jasa === "musik" ? "Musik" : "Tari"}
                                        {r.jasa.is_aktif ? "" : ", nonaktif"})
                                      </span>
                                    </Show>
                                  </p>
                                  <Show when={r.jasa && r.is_tidak_spesifik}>
                                    <p className="text-xs text-[#685856]">Tidak spesifik: performer tidak dicatat.</p>
                                  </Show>
                                </div>
                                <Show when={r.jasa && !r.is_tidak_spesifik}>
                                  <WarnaKecukupan
                                    kecukupan={{
                                      terisi: Math.min(r.acara_performer.length, r.jasa.min_performer),
                                      dibutuhkan: r.jasa.min_performer,
                                      kurang: Math.max(0, r.jasa.min_performer - r.acara_performer.length),
                                    }}
                                  />
                                </Show>
                              </div>

                              <Show when={r.jasa && !r.is_tidak_spesifik}>
                                <ul className="mt-2 flex flex-wrap gap-2">
                                  <For each={r.acara_performer} fallback={<li className="text-xs text-[#685856]">Belum ada performer.</li>}>
                                    {(p) => (
                                      <li
                                        className={`rounded-full px-3 py-1 text-xs ${
                                          p.id_anggota ? "bg-white text-[#302929] ring-1 ring-[#ece2e0]" : "border border-dashed border-[#c9b3b3] text-[#302929]"
                                        }`}
                                      >
                                        {p.id_anggota ? p.anggota?.nama : p.nama_performer}
                                        <span className="ml-1 text-[#685856]">
                                          {p.id_anggota ? p.anggota?.jabatan || "" : "NON-ANGGOTA"}
                                        </span>
                                      </li>
                                    )}
                                  </For>
                                </ul>
                              </Show>
                            </li>
                          )}
                        </For>
                      </ul>
                    </section>
                  )}
                </For>
              </div>

              <Show when={a().status !== "dibatalkan"}>
                <button
                  type="button"
                  onClick={() => setWizard(4)}
                  className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-[#39000a] px-4 text-sm font-semibold text-white hover:bg-[#5a0c1a]"
                >
                  <Icon icon={faUsers} class="text-xs" /> Atur performer
                </button>
              </Show>

              <Show when={wizard() && a().status !== "dibatalkan"}>
                <EventWizard
                  acara={a()}
                  langkahAwal={wizard()}
                  onTutup={() => setWizard(null)}
                  onSimpan={async (data) => {
                    const baru = await updateAcara(a().id_acara, data);
                    mutate(baru);
                    setWizard(null);
                  }}
                />
              </Show>

              <Show when={konfirmasiBatal()}>
                <ModalBatalEvent
                  acara={a()}
                  hari={hari()}
                  alasan={alasanBatal()}
                  memproses={membatalkan()}
                  onUbahAlasan={setAlasanBatal}
                  onBatal={tutupModalBatal}
                  onKonfirmasi={batalkan}
                />
              </Show>
            </>
          )}
        </Match>
      </Switch>
    </div>
  );
}

/** Konfirmasi pembatalan event dengan ringkasan acara dan input opsional alasan pembatalan. */
function ModalBatalEvent(props) {
  const idJudul = createUniqueId();
  const idAlasan = createUniqueId();
  const fokusSebelumnya = document.activeElement;
  let tombolBatal;

  const tekanEsc = (e) => {
    if (e.key === "Escape" && !props.memproses) props.onBatal();
  };

  onMount(() => {
    tombolBatal.focus();
    document.addEventListener("keydown", tekanEsc);
  });

  onCleanup(() => {
    document.removeEventListener("keydown", tekanEsc);
    fokusSebelumnya?.focus?.();
  });

  const namaPj = () =>
    props.acara.acara_pj.length > 0
      ? props.acara.acara_pj.map((p) => p.nama).join(", ")
      : "PJ Tidak Spesifik";

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,10,13,0.45)] p-4"
        onClick={(e) => e.target === e.currentTarget && !props.memproses && props.onBatal()}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={idJudul}
          className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#e8e0d8] bg-white text-left shadow-[0_24px_48px_-16px_rgba(42,8,13,0.28)]"
        >
          <div className="overflow-y-auto p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-700 ring-1 ring-red-200">
                  <Icon icon={faBan} />
                </span>
                <h2 id={idJudul} className="font-serif text-lg font-bold text-[#39000a]">
                  Batalkan Event
                </h2>
              </div>
              <button
                type="button"
                aria-label="Tutup"
                disabled={props.memproses}
                onClick={() => props.onBatal()}
                className="-mr-1.5 -mt-1 grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-[#685856] hover:bg-[#f5efeb] hover:text-[#39000a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon icon={faTimes} />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-[#f0dedf] bg-[#fbf8f6] p-4">
              <span className={`inline-block rounded px-2 py-0.5 text-xs ${WARNA_TIPE[props.acara.tipe_acara]}`}>
                {NAMA_TIPE[props.acara.tipe_acara]}
              </span>
              <p className="mt-1.5 text-base font-bold text-[#39000a]">{props.acara.nama_acara}</p>
              <p className="mt-0.5 text-xs text-[#685856]">
                {formatRentang(props.acara.tanggal_mulai, props.acara.tanggal_selesai)}
                <Show when={props.acara.lokasi}>
                  {" · "}
                  <Icon icon={faLocationDot} class="text-[11px]" /> {props.acara.lokasi}
                </Show>
              </p>

              <dl className="mt-3 grid gap-3 border-t border-[#eedbdc] pt-3 text-xs sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-[#685856]">Penanggung Jawab (PJ)</dt>
                  <dd className="mt-0.5 text-[#302929]">{namaPj()}</dd>
                </div>
                <Show when={props.acara.tipe_acara === "job_external"}>
                  <div>
                    <dt className="font-semibold text-[#685856]">Nama Client</dt>
                    <dd className="mt-0.5 text-[#302929]">{props.acara.nama_klien || "-"}</dd>
                  </div>
                </Show>
              </dl>

              <Show when={props.hari.length > 0}>
                <div className="mt-3 border-t border-[#eedbdc] pt-3">
                  <p className="text-xs font-semibold text-[#685856]">Rincian Jadwal &amp; Jam</p>
                  <ul className="mt-1.5 divide-y divide-[#eedbdc]">
                    <For each={props.hari}>
                      {(h) => (
                        <li className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-1.5 text-xs first:pt-0 last:pb-0">
                          <span className="font-medium text-[#302929]">
                            Hari {selisihHari(props.acara.tanggal_mulai, h.tanggal) + 1} · {formatTanggal(h.tanggal)}
                          </span>
                          <div className="flex flex-col items-end gap-0.5 text-right">
                            <For each={h.baris}>
                              {(r) => (
                                <span className="tabular-nums">
                                  <span className="font-semibold text-[#302929]">
                                    {formatJam(r.jam_mulai)}–{formatJam(r.jam_selesai)} WIB
                                  </span>
                                  <Show when={r.jasa}>
                                    <span className="text-[#685856]"> · {r.jasa.nama}</span>
                                  </Show>
                                </span>
                              )}
                            </For>
                          </div>
                        </li>
                      )}
                    </For>
                  </ul>
                </div>
              </Show>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-[#5c534e]">
              Event ini tidak akan dihapus dan tetap tercatat di sistem sebagai riwayat dengan status{" "}
              <strong className="font-semibold text-[#302929]">Dibatalkan</strong>.
            </p>

            <div className="mt-4">
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <label for={idAlasan} className="text-xs font-semibold text-[#302929]">
                  Alasan pembatalan <span className="font-normal text-[#685856]">(Opsional)</span>
                </label>
                <span className="text-[11px] tabular-nums text-[#685856]">{props.alasan.length}/500</span>
              </div>
              <textarea
                id={idAlasan}
                rows={3}
                maxLength={500}
                value={props.alasan}
                onInput={(e) => props.onUbahAlasan(e.currentTarget.value)}
                placeholder="Mis. Klien menjadwal ulang atau kendala teknis"
                className="w-full rounded-lg border border-[#d9ccbf] bg-white px-3 py-2 text-sm text-[#302929] placeholder:text-[#9b8885] focus:border-[#4a0e17] focus:outline-none focus:ring-1 focus:ring-[#4a0e17]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-[#ede6df] bg-[#faf7f2] px-6 py-4">
            <button
              ref={tombolBatal}
              type="button"
              disabled={props.memproses}
              onClick={() => props.onBatal()}
              className="min-h-11 cursor-pointer rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={props.memproses}
              onClick={() => props.onKonfirmasi()}
              className="min-h-11 cursor-pointer rounded-lg bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800 active:bg-red-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {props.memproses ? "Membatalkan..." : "Ya, Batalkan Event"}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
