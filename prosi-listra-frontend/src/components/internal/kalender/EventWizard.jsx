import { createMemo, createResource, createSignal, createUniqueId, For, onCleanup, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { Portal } from "solid-js/web";
import {
  faCheck,
  faChevronLeft,
  faChevronRight,
  faPlus,
  faTimes,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Icon from "../../Icon";
import { listAnggota } from "../../../api/anggota";
import { listJasa } from "../../../api/jasa";
import { daftarTanggal, formatJam, formatTanggal, NAMA_TIPE, selisihHari, teksKecukupan } from "../../../utils/kalender";

/*
 * Wizard Buat/Ubah Event: Jenis Acara -> Info -> Hari & Jasa -> Performer.
 * Isian mengikuti tabel acara, acara_pj, acara_jasa (satu baris per jasa per hari), acara_performer.
 *
 * props.acara       = (opsional) event yang diubah, bentuk sama dengan GET /api/acara/:id
 * props.langkahAwal = (opsional) langkah yang dibuka pertama, bawaan 1
 * props.onSimpan    = async (payload) => ..., lempar Error bila gagal (pesannya ditampilkan)
 * props.onTutup     = dipanggil saat Batal, Esc, atau klik di luar jendela
 */

const LANGKAH = ["Jenis Acara", "Info", "Hari & Jasa", "Performer"];
const MAKS_HARI = 7; // event paling lama 7 hari (backend memeriksa ulang)

const INPUT =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-[#302929] focus:border-[#4a0e17] focus:outline-none focus:ring-1 focus:ring-[#4a0e17]";
const LABEL = "mb-1 block text-xs font-semibold text-[#302929]";
const TOMBOL_KECIL =
  "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-[#54141d] hover:bg-[#f5efeb]";

// SRS 2.3.2: PJ = anggota aktif Kepengurusan (bukan Alumni, bukan akun Admin); performer = anggota aktif selain Admin
const bolehPj = (a) => a.is_aktif && !["Admin", "Alumni"].includes(a.peran);
const bolehPerformer = (a) => a.is_aktif && a.peran !== "Admin";
const labelAnggota = (a) => a?.jabatan || a?.peran || "";

let nomor = 0;
const kunciBaru = () => ++nomor; // kunci unik untuk baris di daftar

function barisBaru(tanggal, contoh) {
  return {
    kunci: kunciBaru(),
    tanggal,
    jam_mulai: contoh?.jam_mulai ?? "",
    jam_selesai: contoh?.jam_selesai ?? "",
    id_jasa: null,
    jasa: null,
    is_tidak_spesifik: false,
    performer: [],
  };
}

function dariAcara(a) {
  return {
    tipe_acara: a?.tipe_acara ?? "",
    nama_acara: a?.nama_acara ?? "",
    nama_klien: a?.nama_klien ?? "",
    lokasi: a?.lokasi ?? "",
    is_privat: a?.is_privat ?? false,
    acara_pj: a ? a.acara_pj.map((p) => p.id_anggota) : [],
    // PJ Tidak Spesifik tidak disimpan sebagai kolom: Acara LISTRA tanpa baris acara_pj
    pjTidakSpesifik: a ? a.tipe_acara === "listra" && a.acara_pj.length === 0 : false,
    tanggal_mulai: a?.tanggal_mulai ?? "",
    tanggal_selesai: a?.tanggal_selesai ?? "",
    baris: (a?.acara_jasa ?? []).map((r) => ({
      kunci: kunciBaru(),
      tanggal: r.tanggal,
      jam_mulai: r.jam_mulai,
      jam_selesai: r.jam_selesai,
      id_jasa: r.id_jasa,
      jasa: r.jasa,
      is_tidak_spesifik: r.is_tidak_spesifik,
      performer: r.acara_performer.map((p) => ({
        kunci: kunciBaru(),
        id_anggota: p.id_anggota,
        nama_performer: p.nama_performer,
        nama: p.anggota?.nama ?? null,
      })),
    })),
  };
}

export default function EventWizard(props) {
  const idJudul = createUniqueId();
  const [form, setForm] = createStore(dariAcara(props.acara));
  const [langkah, setLangkah] = createSignal(props.langkahAwal ?? 1);
  const [pesan, setPesan] = createSignal("");
  const [menyimpan, setMenyimpan] = createSignal(false);

  const [anggota, { refetch: muatAnggota }] = createResource(() => listAnggota());
  const [jasaAktif, { refetch: muatJasa }] = createResource(() => listJasa());

  // nama dari event yang diubah, dipakai bila anggotanya tidak ada di daftar (mis. sudah nonaktif)
  const namaAwal = new Map([
    ...(props.acara?.acara_pj ?? []).map((p) => [p.id_anggota, p.nama]),
    ...(props.acara?.acara_jasa ?? []).flatMap((r) =>
      r.acara_performer.filter((p) => p.id_anggota).map((p) => [p.id_anggota, p.anggota?.nama]),
    ),
  ]);
  const petaAnggota = createMemo(() => new Map((anggota.error ? [] : anggota() ?? []).map((a) => [a.id_anggota, a])));
  const namaAnggota = (id) => petaAnggota().get(id)?.nama ?? namaAwal.get(id) ?? `Anggota #${id}`;

  const tanggalHari = createMemo(() =>
    form.tanggal_mulai && form.tanggal_selesai ? daftarTanggal(form.tanggal_mulai, form.tanggal_selesai) : [],
  );
  const barisDalamRentang = () =>
    form.baris.filter((b) => b.tanggal >= form.tanggal_mulai && b.tanggal <= form.tanggal_selesai);
  const barisPerluPerformer = () => barisDalamRentang().filter((b) => b.id_jasa && !b.is_tidak_spesifik);

  // ---------- validasi per langkah (backend tetap memeriksa ulang) ----------
  function cekLangkah(n) {
    if (n === 1 && !form.tipe_acara) return "Pilih jenis acara terlebih dahulu.";
    if (n === 2) {
      if (!form.nama_acara.trim()) return "Nama event wajib diisi.";
      if (!form.tanggal_mulai || !form.tanggal_selesai) return "Tanggal mulai dan tanggal selesai wajib diisi.";
      if (form.tanggal_selesai < form.tanggal_mulai) return "Tanggal selesai tidak boleh sebelum tanggal mulai.";
      if (selisihHari(form.tanggal_mulai, form.tanggal_selesai) + 1 > MAKS_HARI) return `Rentang event paling lama ${MAKS_HARI} hari.`;
      if (form.tipe_acara === "job_external" && form.acara_pj.length === 0)
        return "Acara Job External wajib punya minimal satu PJ Kepengurusan.";
      if (form.tipe_acara === "listra" && !form.pjTidakSpesifik && form.acara_pj.length === 0)
        return "Pilih PJ, atau nyalakan PJ Tidak Spesifik.";
    }
    if (n === 3) {
      const baris = barisDalamRentang();
      if (baris.length === 0) return "Tambahkan minimal satu jam kegiatan.";
      for (const b of baris) {
        if (!b.jam_mulai || !b.jam_selesai) return `Isi jam mulai dan jam selesai pada ${formatTanggal(b.tanggal)}.`;
        if (b.jam_selesai <= b.jam_mulai) return `Jam selesai harus setelah jam mulai (${formatTanggal(b.tanggal)}).`;
      }
    }
    return "";
  }

  /** Pindah langkah; maju hanya bila semua langkah sebelumnya sudah benar. */
  function keLangkah(tujuan) {
    for (let n = 1; n < tujuan; n++) {
      const salah = cekLangkah(n);
      if (salah) {
        setLangkah(n);
        setPesan(salah);
        return;
      }
    }
    setPesan("");
    // pertama kali masuk Hari & Jasa: satu baris kosong untuk setiap hari
    if (tujuan === 3 && form.baris.length === 0) setForm("baris", tanggalHari().map((t) => barisBaru(t)));
    setLangkah(tujuan);
  }

  // ---------- ubah isian ----------
  const setTipe = (tipe) => setForm({ tipe_acara: tipe, ...(tipe === "job_external" ? { pjTidakSpesifik: false } : {}) });
  const togglePj = (id) =>
    setForm("acara_pj", (daftar) => (daftar.includes(id) ? daftar.filter((x) => x !== id) : [...daftar, id]));
  const ubahBaris = (kunci, perubahan) => setForm("baris", (b) => b.kunci === kunci, perubahan);
  const hapusBaris = (kunci) => setForm("baris", (daftar) => daftar.filter((b) => b.kunci !== kunci));
  const tambahBaris = (tanggal) => {
    // jam disalin dari baris terakhir hari itu (atau baris terakhir mana pun) agar cepat diisi
    const contoh = [...form.baris].reverse().find((b) => b.tanggal === tanggal) ?? form.baris[form.baris.length - 1];
    setForm("baris", (daftar) => [...daftar, barisBaru(tanggal, contoh)]);
  };
  const pilihJasa = (kunci, jasa) => {
    // SRS: pada Acara LISTRA, jasa baru otomatis bertanda Tidak Spesifik
    const tidakSpesifik = form.tipe_acara === "listra";
    ubahBaris(kunci, { id_jasa: jasa.id_jasa, jasa, is_tidak_spesifik: tidakSpesifik, ...(tidakSpesifik ? { performer: [] } : {}) });
  };
  const setTidakSpesifik = (kunci, nilai) =>
    ubahBaris(kunci, nilai ? { is_tidak_spesifik: true, performer: [] } : { is_tidak_spesifik: false });
  const tambahPerformer = (kunci, p) =>
    setForm("baris", (b) => b.kunci === kunci, "performer", (daftar) => [...daftar, { kunci: kunciBaru(), ...p }]);
  const lepasPerformer = (kunciBaris, kunciPerformer) =>
    setForm("baris", (b) => b.kunci === kunciBaris, "performer", (daftar) => daftar.filter((p) => p.kunci !== kunciPerformer));
  const togglePerformer = (baris, a) => {
    const ada = baris.performer.find((p) => p.id_anggota === a.id_anggota);
    if (ada) lepasPerformer(baris.kunci, ada.kunci);
    else tambahPerformer(baris.kunci, { id_anggota: a.id_anggota, nama_performer: null, nama: a.nama });
  };

  // ---------- simpan ----------
  function payload() {
    return {
      tipe_acara: form.tipe_acara,
      nama_acara: form.nama_acara.trim(),
      nama_klien: form.tipe_acara === "job_external" ? form.nama_klien.trim() || null : null,
      lokasi: form.lokasi.trim() || null,
      is_privat: form.is_privat,
      acara_pj: form.pjTidakSpesifik ? [] : [...form.acara_pj],
      // hari di luar rentang tanggal (setelah rentang diubah) tidak ikut disimpan
      acara_jasa: barisDalamRentang().map((b) => ({
        tanggal: b.tanggal,
        jam_mulai: b.jam_mulai,
        jam_selesai: b.jam_selesai,
        id_jasa: b.id_jasa,
        is_tidak_spesifik: b.id_jasa ? b.is_tidak_spesifik : false,
        acara_performer:
          b.id_jasa && !b.is_tidak_spesifik
            ? b.performer.map((p) => (p.id_anggota ? { id_anggota: p.id_anggota } : { nama_performer: p.nama_performer }))
            : [],
      })),
    };
  }

  async function simpan() {
    for (let n = 1; n <= 3; n++) {
      const salah = cekLangkah(n);
      if (salah) {
        setLangkah(n);
        setPesan(salah);
        return;
      }
    }
    setPesan("");
    setMenyimpan(true);
    try {
      await props.onSimpan(payload());
    } catch (error) {
      setPesan(error.message);
    } finally {
      setMenyimpan(false);
    }
  }

  const tekanEsc = (e) => e.key === "Escape" && props.onTutup();
  let judul;
  onMount(() => {
    judul.focus();
    document.addEventListener("keydown", tekanEsc);
  });
  onCleanup(() => document.removeEventListener("keydown", tekanEsc));

  return (
    <Portal>
      {/* fixed inset-0 = menutupi layar; items-end di HP = jendela muncul dari bawah */}
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
        onClick={(e) => e.target === e.currentTarget && props.onTutup()}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={idJudul}
          // max-h + overflow-y-auto = isi bisa digulir di layar pendek
          className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-white p-5 text-left shadow-xl sm:rounded-2xl sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <h2 id={idJudul} ref={judul} tabIndex={-1} className="font-serif text-xl font-bold text-[#39000a] outline-none">
              {props.acara ? "Ubah Event" : "Buat Event Baru"}
            </h2>
            <button
              type="button"
              aria-label="Tutup"
              onClick={() => props.onTutup()}
              className="-mr-2 -mt-1 grid size-11 cursor-pointer place-items-center rounded-lg text-[#685856] hover:bg-[#f5efeb]"
            >
              <Icon icon={faTimes} />
            </button>
          </div>

          {/* Stepper: langkah yang sudah lewat bisa diklik untuk kembali */}
          <ol className="mt-3 flex flex-wrap gap-1 border-b border-[#f0dedf] pb-3">
            <For each={LANGKAH}>
              {(nama, i) => (
                <li>
                  <button
                    type="button"
                    onClick={() => keLangkah(i() + 1)}
                    aria-current={langkah() === i() + 1 ? "step" : undefined}
                    className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-semibold ${
                      langkah() === i() + 1
                        ? "bg-[#39000a] text-white"
                        : langkah() > i() + 1
                          ? "text-[#39000a] hover:bg-[#f5efeb]"
                          : "text-[#9b8885] hover:bg-[#f5efeb]"
                    }`}
                  >
                    <span className="grid size-6 place-items-center rounded-full border border-current text-xs">
                      {langkah() > i() + 1 ? <Icon icon={faCheck} /> : i() + 1}
                    </span>
                    {nama}
                  </button>
                </li>
              )}
            </For>
          </ol>

          <Show when={pesan()}>
            <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {pesan()}
            </p>
          </Show>

          <div className="mt-4">
            {/* ===== Langkah 1: Jenis Acara ===== */}
            <Show when={langkah() === 1}>
              <fieldset>
                <legend className="text-sm text-[#685856]">Pilih jenis acara.</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <For
                    each={[
                      { nilai: "job_external", isi: "Pesanan pihak luar. Wajib punya minimal satu PJ; Nama Client boleh diisi." },
                      { nilai: "listra", isi: "Acara LISTRA sendiri, mis. latihan gabungan atau pagelaran. Tanpa Nama Client; PJ boleh Tidak Spesifik." },
                    ]}
                  >
                    {(p) => (
                      <label
                        className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${
                          form.tipe_acara === p.nilai ? "border-[#39000a] bg-[#fdf7f7] ring-1 ring-[#39000a]" : "border-[#e6d6d6] hover:bg-[#fbf6f3]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="tipe_acara"
                          value={p.nilai}
                          checked={form.tipe_acara === p.nilai}
                          onChange={() => setTipe(p.nilai)}
                          className="mt-1 size-4 accent-[#39000a]"
                        />
                        <span>
                          <span className="block font-semibold text-[#302929]">{NAMA_TIPE[p.nilai]}</span>
                          <span className="mt-1 block text-sm leading-relaxed text-[#685856]">{p.isi}</span>
                        </span>
                      </label>
                    )}
                  </For>
                </div>
              </fieldset>
            </Show>

            {/* ===== Langkah 2: Info ===== */}
            <Show when={langkah() === 2}>
              <div className="space-y-4">
                <div>
                  <label className={LABEL} for="w-nama">
                    Nama event <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="w-nama"
                    maxLength={150}
                    value={form.nama_acara}
                    onInput={(e) => setForm("nama_acara", e.currentTarget.value)}
                    className={INPUT}
                  />
                </div>

                {/* sm:grid-cols-3 = tanggal mulai, selesai, dan jumlah hari berdampingan */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className={LABEL} for="w-mulai">
                      Tanggal mulai <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="w-mulai"
                      type="date"
                      value={form.tanggal_mulai}
                      onInput={(e) => {
                        const nilai = e.currentTarget.value;
                        // tanggal selesai ikut bila belum diisi atau jadi sebelum tanggal mulai
                        setForm({ tanggal_mulai: nilai, ...(!form.tanggal_selesai || form.tanggal_selesai < nilai ? { tanggal_selesai: nilai } : {}) });
                      }}
                      className={INPUT}
                    />
                  </div>
                  <div>
                    <label className={LABEL} for="w-selesai">
                      Tanggal selesai <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="w-selesai"
                      type="date"
                      min={form.tanggal_mulai || undefined}
                      value={form.tanggal_selesai}
                      onInput={(e) => setForm("tanggal_selesai", e.currentTarget.value)}
                      className={INPUT}
                    />
                  </div>
                  <p className="self-end pb-2 text-sm text-[#685856]">
                    {tanggalHari().length > 0 ? `${tanggalHari().length} hari (maks. ${MAKS_HARI})` : `Maks. ${MAKS_HARI} hari`}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={LABEL} for="w-lokasi">
                      Lokasi
                    </label>
                    <input
                      id="w-lokasi"
                      maxLength={200}
                      value={form.lokasi}
                      onInput={(e) => setForm("lokasi", e.currentTarget.value)}
                      className={INPUT}
                    />
                  </div>
                  <Show when={form.tipe_acara === "job_external"}>
                    <div>
                      <label className={LABEL} for="w-klien">
                        Nama Client
                      </label>
                      <input
                        id="w-klien"
                        maxLength={100}
                        value={form.nama_klien}
                        onInput={(e) => setForm("nama_klien", e.currentTarget.value)}
                        className={INPUT}
                      />
                    </div>
                  </Show>
                </div>

                <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-[#302929]">
                  <input
                    type="checkbox"
                    checked={form.is_privat}
                    onChange={(e) => setForm("is_privat", e.currentTarget.checked)}
                    className="size-4 accent-[#39000a]"
                  />
                  Sembunyikan nama di jadwal publik
                  <span className="text-[#685856]">(publik melihat "Acara privat")</span>
                </label>

                <fieldset className="rounded-xl border border-[#f0dedf] p-4">
                  <legend className="px-1 text-xs font-semibold text-[#302929]">
                    Penanggung Jawab (PJ)
                    <Show when={form.tipe_acara === "job_external"}>
                      <span className="text-red-600"> *</span>
                    </Show>
                  </legend>

                  <Show when={form.tipe_acara === "listra"}>
                    <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-[#302929]">
                      <input
                        type="checkbox"
                        checked={form.pjTidakSpesifik}
                        onChange={(e) => setForm({ pjTidakSpesifik: e.currentTarget.checked, ...(e.currentTarget.checked ? { acara_pj: [] } : {}) })}
                        className="size-4 accent-[#39000a]"
                      />
                      PJ Tidak Spesifik (event ini tanpa PJ)
                    </label>
                  </Show>

                  <Show when={!form.pjTidakSpesifik}>
                    <Show when={form.acara_pj.length > 0}>
                      <ul className="mb-2 flex flex-wrap gap-2" aria-label="PJ terpilih">
                        <For each={form.acara_pj}>
                          {(id) => (
                            <li className="inline-flex items-center gap-1 rounded-full bg-[#39000a] py-0.5 pl-3 pr-0.5 text-sm text-white">
                              {namaAnggota(id)}
                              <button
                                type="button"
                                aria-label={`Hapus ${namaAnggota(id)} dari PJ`}
                                onClick={() => togglePj(id)}
                                className="grid size-8 cursor-pointer place-items-center rounded-full hover:bg-white/15"
                              >
                                <Icon icon={faXmark} class="text-xs" />
                              </button>
                            </li>
                          )}
                        </For>
                      </ul>
                    </Show>
                    <MuatAnggota anggota={anggota} muatUlang={muatAnggota}>
                      <PilihAnggota
                        label="Cari nama anggota Kepengurusan"
                        kandidat={(anggota() ?? []).filter(bolehPj).sort((x, y) => x.nama.localeCompare(y.nama))}
                        terpilih={form.acara_pj}
                        onToggle={(a) => togglePj(a.id_anggota)}
                      />
                    </MuatAnggota>
                  </Show>
                </fieldset>
              </div>
            </Show>

            {/* ===== Langkah 3: Hari & Jasa ===== */}
            <Show when={langkah() === 3}>
              <p className="text-sm text-[#685856]">
                Satu hari boleh berisi beberapa jasa, masing-masing dengan jamnya. Baris tanpa jasa dicatat sebagai hari tanpa jasa.
              </p>
              <Show when={jasaAktif.error}>
                <p role="alert" className="mt-3 text-sm text-red-800">
                  Daftar jasa belum bisa dimuat.{" "}
                  <button type="button" onClick={muatJasa} className="min-h-11 cursor-pointer px-1 font-semibold underline">
                    Coba lagi
                  </button>
                </p>
              </Show>
              <div className="mt-3 space-y-3">
                <For each={tanggalHari()}>
                  {(tanggal, i) => (
                    <section className="rounded-xl border border-[#f0dedf] p-4" aria-label={`Hari ${i() + 1}`}>
                      <h3 className="text-sm font-semibold text-[#39000a]">
                        Hari {i() + 1} · {formatTanggal(tanggal)}
                      </h3>
                      <div className="mt-2 space-y-2">
                        <For
                          each={form.baris.filter((b) => b.tanggal === tanggal)}
                          fallback={<p className="text-sm text-[#685856]">Tidak ada kegiatan. Hari ini tidak dicatat.</p>}
                        >
                          {(b) => (
                            <BarisJasa
                              baris={b}
                              jasa={jasaAktif.error ? [] : jasaAktif() ?? []}
                              onUbah={(perubahan) => ubahBaris(b.kunci, perubahan)}
                              onPilihJasa={(j) => pilihJasa(b.kunci, j)}
                              onTidakSpesifik={(nilai) => setTidakSpesifik(b.kunci, nilai)}
                              onHapus={() => hapusBaris(b.kunci)}
                            />
                          )}
                        </For>
                      </div>
                      <button type="button" onClick={() => tambahBaris(tanggal)} className={`mt-2 ${TOMBOL_KECIL}`}>
                        <Icon icon={faPlus} class="text-xs" /> Tambah jam & jasa
                      </button>
                    </section>
                  )}
                </For>
              </div>
            </Show>

            {/* ===== Langkah 4: Performer ===== */}
            <Show when={langkah() === 4}>
              <Show
                when={barisPerluPerformer().length > 0}
                fallback={
                  <p className="rounded-xl border border-[#f0dedf] p-6 text-center text-sm text-[#685856]">
                    Tidak ada jasa yang perlu performer. Jasa bertanda Tidak Spesifik dan hari tanpa jasa tidak mencatat performer.
                  </p>
                }
              >
                <div className="space-y-3">
                  <For each={barisPerluPerformer()}>
                    {(b) => (
                      <KartuPerformer
                        baris={b}
                        anggota={anggota}
                        muatUlang={muatAnggota}
                        namaAnggota={namaAnggota}
                        onToggle={(a) => togglePerformer(b, a)}
                        onTambahLuar={(nama) => tambahPerformer(b.kunci, { id_anggota: null, nama_performer: nama, nama: null })}
                        onLepas={(kunciPerformer) => lepasPerformer(b.kunci, kunciPerformer)}
                      />
                    )}
                  </For>
                </div>
              </Show>
            </Show>
          </div>

          {/* Tombol bawah */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-[#f0dedf] pt-4">
            <button
              type="button"
              onClick={() => (langkah() > 1 ? keLangkah(langkah() - 1) : props.onTutup())}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-4 text-sm font-semibold text-[#685856] hover:bg-[#f5efeb]"
            >
              <Show when={langkah() > 1} fallback="Batal">
                <Icon icon={faChevronLeft} class="text-xs" /> Kembali
              </Show>
            </button>
            <div className="flex flex-wrap gap-2">
              <Show when={langkah() < 4}>
                <button
                  type="button"
                  onClick={() => keLangkah(langkah() + 1)}
                  className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-4 text-sm font-semibold ${
                    props.acara ? "border border-[#39000a] text-[#39000a] hover:bg-[#fdf7f7]" : "bg-[#39000a] text-white hover:bg-[#5a0c1a]"
                  }`}
                >
                  Lanjut <Icon icon={faChevronRight} class="text-xs" />
                </button>
              </Show>
              {/* event baru disimpan di langkah terakhir; event yang diubah bisa disimpan dari langkah mana pun */}
              <Show when={langkah() === 4 || props.acara}>
                <button
                  type="button"
                  disabled={menyimpan()}
                  onClick={simpan}
                  className="inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-[#39000a] px-4 text-sm font-semibold text-white hover:bg-[#5a0c1a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {menyimpan() ? "Menyimpan..." : "Simpan event"}
                </button>
              </Show>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}

/** Keadaan muat daftar anggota: memuat / gagal (dengan Coba lagi) / isi. */
function MuatAnggota(props) {
  return (
    <Show
      when={!props.anggota.loading && !props.anggota.error}
      fallback={
        <Show when={props.anggota.error} fallback={<p className="text-sm text-[#685856]">Memuat daftar anggota...</p>}>
          <p role="alert" className="text-sm text-red-800">
            Daftar anggota belum bisa dimuat.{" "}
            <button type="button" onClick={props.muatUlang} className="min-h-11 cursor-pointer px-1 font-semibold underline">
              Coba lagi
            </button>
          </p>
        </Show>
      }
    >
      {props.children}
    </Show>
  );
}

/** Kotak cari + daftar centang anggota. */
function PilihAnggota(props) {
  const [cari, setCari] = createSignal("");
  const hasil = createMemo(() => {
    const q = cari().trim().toLowerCase();
    return props.kandidat.filter((a) => !q || a.nama.toLowerCase().includes(q));
  });
  return (
    <div>
      <input
        type="search"
        aria-label={props.label}
        placeholder={props.label}
        value={cari()}
        onInput={(e) => setCari(e.currentTarget.value)}
        className={INPUT}
      />
      {/* max-h-48 overflow-y-auto = daftar panjang bisa digulir */}
      <ul className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-[#ece2e0]">
        <For each={hasil()} fallback={<li className="px-3 py-2 text-sm text-[#685856]">Tidak ada anggota yang cocok.</li>}>
          {(a) => (
            <li>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 px-3 hover:bg-[#fbf6f3]">
                <input
                  type="checkbox"
                  checked={props.terpilih.includes(a.id_anggota)}
                  onChange={() => props.onToggle(a)}
                  className="size-4 accent-[#39000a]"
                />
                <span className="flex-1 text-sm text-[#302929]">{a.nama}</span>
                <Show when={a.menguasai}>
                  <span className="text-xs font-semibold text-[#7a5d08]">Menguasai jasa ini</span>
                </Show>
                <span className="text-xs text-[#685856]">{labelAnggota(a)}</span>
              </label>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}

/** Satu baris acara_jasa: jam, jasa (boleh kosong), Tidak spesifik, Hapus. */
function BarisJasa(props) {
  const [memilih, setMemilih] = createSignal(false);
  const [cari, setCari] = createSignal("");
  const id = createUniqueId();
  const hasil = createMemo(() => {
    const q = cari().trim().toLowerCase();
    return props.jasa.filter((j) => !q || j.nama.toLowerCase().includes(q) || (j.nama_provinsi ?? "").toLowerCase().includes(q));
  });
  const infoJasa = (j) =>
    [j.tipe_jasa === "musik" ? "Musik" : "Tari", j.kecocokan?.join(", "), `min. ${j.min_performer} performer`].filter(Boolean).join(" · ");

  return (
    <div className="rounded-lg bg-[#fbf8f6] p-3">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className={LABEL} for={`${id}-mulai`}>
            Jam mulai
          </label>
          <input
            id={`${id}-mulai`}
            type="time"
            value={props.baris.jam_mulai}
            onInput={(e) => props.onUbah({ jam_mulai: e.currentTarget.value })}
            className={`${INPUT} w-32`}
          />
        </div>
        <div>
          <label className={LABEL} for={`${id}-selesai`}>
            Jam selesai
          </label>
          <input
            id={`${id}-selesai`}
            type="time"
            value={props.baris.jam_selesai}
            onInput={(e) => props.onUbah({ jam_selesai: e.currentTarget.value })}
            className={`${INPUT} w-32`}
          />
        </div>
        <button
          type="button"
          onClick={props.onHapus}
          aria-label={`Hapus kegiatan ${props.baris.jam_mulai || ""} pada ${formatTanggal(props.baris.tanggal)}`}
          className="ml-auto inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md px-3 text-sm text-red-700 hover:bg-red-50"
        >
          <Icon icon={faTrash} class="text-xs" /> Hapus
        </button>
      </div>

      <div className="mt-3">
        <Show
          when={props.baris.jasa && !memilih()}
          fallback={
            <Show
              when={memilih()}
              fallback={
                <p className="flex flex-wrap items-center gap-2 text-sm text-[#685856]">
                  Tanpa jasa
                  <button type="button" onClick={() => setMemilih(true)} className={TOMBOL_KECIL}>
                    <Icon icon={faPlus} class="text-xs" /> Pilih jasa
                  </button>
                </p>
              }
            >
              <div>
                <div className="flex gap-2">
                  <input
                    type="search"
                    aria-label="Cari jasa"
                    placeholder="Cari jasa: nama atau asal provinsi"
                    value={cari()}
                    onInput={(e) => setCari(e.currentTarget.value)}
                    className={INPUT}
                  />
                  <button type="button" onClick={() => setMemilih(false)} className={TOMBOL_KECIL}>
                    Batal
                  </button>
                </div>
                <ul className="mt-1 max-h-56 overflow-y-auto rounded-lg border border-[#ece2e0] bg-white">
                  <For each={hasil()} fallback={<li className="px-3 py-2 text-sm text-[#685856]">Tidak ada jasa aktif yang cocok.</li>}>
                    {(j) => (
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            props.onPilihJasa(j);
                            setMemilih(false);
                            setCari("");
                          }}
                          className="flex min-h-11 w-full cursor-pointer flex-col items-start px-3 py-2 text-left hover:bg-[#fbf6f3]"
                        >
                          <span className="text-sm font-semibold text-[#302929]">{j.nama}</span>
                          <span className="text-xs text-[#685856]">{infoJasa(j)}</span>
                        </button>
                      </li>
                    )}
                  </For>
                </ul>
              </div>
            </Show>
          }
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-sm">
              <span className="font-semibold text-[#302929]">{props.baris.jasa.nama}</span>
              <Show when={props.baris.jasa.is_aktif === false}>
                <span className="text-[#685856]"> (nonaktif)</span>
              </Show>
              <span className="text-xs text-[#685856]"> · {infoJasa(props.baris.jasa)}</span>
            </p>
            <button type="button" onClick={() => setMemilih(true)} className={TOMBOL_KECIL}>
              Ganti
            </button>
          </div>
          <label className="mt-1 flex min-h-11 cursor-pointer items-center gap-2 text-sm text-[#302929]">
            <input
              type="checkbox"
              checked={props.baris.is_tidak_spesifik}
              onChange={(e) => props.onTidakSpesifik(e.currentTarget.checked)}
              className="size-4 accent-[#39000a]"
            />
            Tidak spesifik <span className="text-[#685856]">(performer tidak dicatat)</span>
          </label>
        </Show>
      </div>
    </div>
  );
}

/** Performer untuk satu jasa: daftar, + Performer (anggota), + Performer non-anggota. */
function KartuPerformer(props) {
  const [panel, setPanel] = createSignal(null); // null | "anggota" | "luar"
  const [namaLuar, setNamaLuar] = createSignal("");
  const [pesanLuar, setPesanLuar] = createSignal("");
  const b = () => props.baris;
  const kecukupan = () => ({ terisi: Math.min(b().performer.length, b().jasa.min_performer), dibutuhkan: b().jasa.min_performer });
  const kurang = () => b().performer.length < b().jasa.min_performer;
  // anggota yang menguasai jasa ini (tabel spesialisasi) tampil paling atas
  const kandidat = () =>
    (props.anggota() ?? [])
      .filter(bolehPerformer)
      .map((a) => ({ ...a, menguasai: (a.spesialisasi ?? []).some((s) => s.id_jasa === b().id_jasa) }))
      .sort((x, y) => Number(y.menguasai) - Number(x.menguasai) || x.nama.localeCompare(y.nama));

  const tambahLuar = () => {
    const nama = namaLuar().trim();
    if (!nama) return setPesanLuar("Nama performer non-anggota wajib diisi.");
    if (nama.length > 255) return setPesanLuar("Nama performer non-anggota maksimal 255 karakter.");
    props.onTambahLuar(nama);
    setNamaLuar("");
    setPesanLuar("");
  };

  return (
    <section className="rounded-xl border border-[#f0dedf] p-4" aria-label={`Performer ${b().jasa.nama}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-[#302929]">{b().jasa.nama}</h3>
          <p className="text-xs text-[#685856]">
            {formatTanggal(b().tanggal)} · {formatJam(b().jam_mulai)}–{formatJam(b().jam_selesai)}
          </p>
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
            kurang() ? "border-red-200 bg-red-50 text-red-800" : "border-green-200 bg-green-50 text-green-800"
          }`}
        >
          {teksKecukupan(kecukupan())}
        </span>
      </div>

      <ul className="mt-3 space-y-1">
        <For each={b().performer} fallback={<li className="text-sm text-[#685856]">Belum ada performer.</li>}>
          {(p) => (
            <li
              className={`flex items-center justify-between gap-2 rounded-lg px-3 py-1 ${
                p.id_anggota ? "bg-[#fbf8f6]" : "border border-dashed border-[#d9c4c4]"
              }`}
            >
              <span className="text-sm text-[#302929]">
                {p.id_anggota ? props.namaAnggota(p.id_anggota) : p.nama_performer}
                <Show when={!p.id_anggota}>
                  <span className="ml-2 text-[10px] font-semibold tracking-wider text-[#685856]">NON-ANGGOTA</span>
                </Show>
              </span>
              <button
                type="button"
                onClick={() => props.onLepas(p.kunci)}
                aria-label={`Lepas ${p.id_anggota ? props.namaAnggota(p.id_anggota) : p.nama_performer}`}
                className="inline-flex min-h-11 cursor-pointer items-center rounded-md px-3 text-sm text-[#685856] hover:bg-[#f5efeb]"
              >
                Lepas
              </button>
            </li>
          )}
        </For>
      </ul>

      <div className="mt-2 flex flex-wrap gap-1">
        <button
          type="button"
          aria-expanded={panel() === "anggota"}
          onClick={() => setPanel(panel() === "anggota" ? null : "anggota")}
          className={TOMBOL_KECIL}
        >
          <Icon icon={faPlus} class="text-xs" /> Performer
        </button>
        <button
          type="button"
          aria-expanded={panel() === "luar"}
          onClick={() => setPanel(panel() === "luar" ? null : "luar")}
          className={TOMBOL_KECIL}
        >
          <Icon icon={faPlus} class="text-xs" /> Performer non-anggota
        </button>
      </div>

      <Show when={panel() === "anggota"}>
        <div className="mt-2">
          <MuatAnggota anggota={props.anggota} muatUlang={props.muatUlang}>
            <PilihAnggota
              label="Cari nama anggota"
              kandidat={kandidat()}
              terpilih={b().performer.map((p) => p.id_anggota).filter(Boolean)}
              onToggle={props.onToggle}
            />
          </MuatAnggota>
        </div>
      </Show>

      <Show when={panel() === "luar"}>
        <div className="mt-2 flex flex-wrap items-start gap-2">
          <input
            aria-label="Nama performer non-anggota"
            placeholder="Nama performer non-anggota"
            maxLength={255}
            value={namaLuar()}
            onInput={(e) => setNamaLuar(e.currentTarget.value)}
            onKeyDown={(e) => e.key === "Enter" && tambahLuar()}
            className={`${INPUT} max-w-xs`}
          />
          <button
            type="button"
            onClick={tambahLuar}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-[#39000a] px-4 text-sm font-semibold text-white hover:bg-[#5a0c1a]"
          >
            Tambah
          </button>
          <Show when={pesanLuar()}>
            <p role="alert" className="w-full text-sm text-red-800">
              {pesanLuar()}
            </p>
          </Show>
        </div>
      </Show>
    </section>
  );
}
