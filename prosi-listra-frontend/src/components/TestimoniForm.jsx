import { createSignal, createUniqueId, For, onCleanup, onMount, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { faStar, faTimes } from "@fortawesome/free-solid-svg-icons";
import Icon from "./Icon";

// kelas input yang sama untuk semua kolom
const INPUT =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-[#302929] focus:border-[#4a0e17] focus:outline-none focus:ring-1 focus:ring-[#4a0e17]";
const LABEL = "mb-1 block text-xs font-semibold text-[#302929]";

/**
 * Jendela form testimoni.
 * props.judul    = judul jendela
 * props.internal = (opsional) tampilkan pilihan Sumber dan Tampilkan, untuk pengurus
 * props.onKirim  = async (data) => ..., lempar Error bila gagal (pesannya ditampilkan)
 * props.onTutup  = dipanggil saat Batal, Esc, atau klik di luar jendela
 */
export default function TestimoniForm(props) {
  const idJudul = createUniqueId();
  const [data, setData] = createSignal({
    nama_klien: "",
    instansi: "",
    nama_acara: "",
    is_acara_privat: false,
    rating: null,
    isi_testimoni: "",
    sumber: "whatsapp",
    is_aktif: true,
  });
  const [mengirim, setMengirim] = createSignal(false);
  const [pesanError, setPesanError] = createSignal("");
  const ubah = (kolom, nilai) => setData((d) => ({ ...d, [kolom]: nilai }));
  let kolomPertama;

  const tekanEsc = (e) => e.key === "Escape" && props.onTutup();
  onMount(() => {
    kolomPertama.focus();
    document.addEventListener("keydown", tekanEsc);
  });
  onCleanup(() => document.removeEventListener("keydown", tekanEsc));

  const kirim = async (e) => {
    e.preventDefault();
    setPesanError("");
    setMengirim(true);
    try {
      const d = data();
      await props.onKirim({
        nama_klien: d.nama_klien,
        instansi: d.instansi,
        nama_acara: d.nama_acara,
        is_acara_privat: d.is_acara_privat,
        rating: d.rating,
        isi_testimoni: d.isi_testimoni,
        // sumber & is_aktif hanya dipakai backend bila pengirimnya login
        ...(props.internal ? { sumber: d.sumber, is_aktif: d.is_aktif } : {}),
      });
    } catch (error) {
      setPesanError(error.message);
    } finally {
      setMengirim(false);
    }
  };

  return (
    // Portal = dirender langsung di <body>, jadi tidak terpotong layout halaman
    <Portal>
      {/* fixed inset-0 = menutupi layar; items-end di HP = jendela muncul dari bawah */}
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
        onClick={(e) => e.target === e.currentTarget && props.onTutup()}
      >
        <form
          role="dialog"
          aria-modal="true"
          aria-labelledby={idJudul}
          onSubmit={kirim}
          // max-h + overflow-y-auto = isi bisa digulir di layar pendek
          className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 text-left shadow-xl sm:rounded-2xl sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <h2 id={idJudul} className="font-serif text-xl font-bold text-[#39000a]">
              {props.judul}
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

          <Show when={pesanError()}>
            <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {pesanError()}
            </p>
          </Show>

          <div className="mt-4 space-y-3.5">
            <div>
              <label className={LABEL} for="t-nama">
                Nama <span className="text-red-600">*</span>
              </label>
              <input
                id="t-nama"
                ref={kolomPertama}
                required
                maxLength={100}
                value={data().nama_klien}
                onInput={(e) => ubah("nama_klien", e.currentTarget.value)}
                className={INPUT}
              />
            </div>

            {/* sm:grid-cols-2 = instansi & acara berdampingan di layar lebar */}
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label className={LABEL} for="t-instansi">
                  Instansi
                </label>
                <input
                  id="t-instansi"
                  maxLength={150}
                  value={data().instansi}
                  onInput={(e) => ubah("instansi", e.currentTarget.value)}
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL} for="t-acara">
                  Nama Acara
                </label>
                <input
                  id="t-acara"
                  maxLength={150}
                  value={data().nama_acara}
                  onInput={(e) => ubah("nama_acara", e.currentTarget.value)}
                  className={INPUT}
                />
              </div>
            </div>

            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-[#302929]">
              <input
                type="checkbox"
                checked={data().is_acara_privat}
                onChange={(e) => ubah("is_acara_privat", e.currentTarget.checked)}
                className="size-4 accent-[#39000a]"
              />
              Acara privat (nama acara tidak ditampilkan di website)
            </label>

            {/* Rating: 5 bintang; klik bintang yang sama lagi untuk mengosongkan */}
            <fieldset>
              <legend className={LABEL}>Rating</legend>
              <div className="flex items-center gap-1">
                <For each={[1, 2, 3, 4, 5]}>
                  {(n) => (
                    <button
                      type="button"
                      aria-label={`${n} bintang`}
                      aria-pressed={data().rating === n}
                      onClick={() => ubah("rating", data().rating === n ? null : n)}
                      className={`grid size-11 cursor-pointer place-items-center rounded-lg text-xl hover:bg-[#fff7f6] ${
                        (data().rating ?? 0) >= n ? "text-[#c99a1a]" : "text-stone-300"
                      }`}
                    >
                      <Icon icon={faStar} />
                    </button>
                  )}
                </For>
                <span className="ml-2 text-sm text-[#685856]">
                  {data().rating ? `${data().rating} / 5` : "Tanpa rating"}
                </span>
              </div>
            </fieldset>

            <div>
              <label className={LABEL} for="t-isi">
                Testimoni <span className="text-red-600">*</span>
              </label>
              <textarea
                id="t-isi"
                required
                rows={4}
                value={data().isi_testimoni}
                onInput={(e) => ubah("isi_testimoni", e.currentTarget.value)}
                className={INPUT}
              />
            </div>

            {/* Khusus pengurus: dari mana testimoni ini, dan langsung tampil atau tidak */}
            <Show when={props.internal}>
              <div className="grid gap-3.5 border-t border-[#f0dedf] pt-3.5 sm:grid-cols-2">
                <div>
                  <label className={LABEL} for="t-sumber">
                    Sumber
                  </label>
                  <select
                    id="t-sumber"
                    value={data().sumber}
                    onChange={(e) => ubah("sumber", e.currentTarget.value)}
                    className={INPUT}
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="web">Web</option>
                  </select>
                </div>
                <label className="flex min-h-11 cursor-pointer items-center gap-2 self-end text-sm text-[#302929]">
                  <input
                    type="checkbox"
                    checked={data().is_aktif}
                    onChange={(e) => ubah("is_aktif", e.currentTarget.checked)}
                    className="size-4 accent-[#39000a]"
                  />
                  Langsung tampil di website
                </label>
              </div>
            </Show>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => props.onTutup()}
              className="min-h-11 cursor-pointer rounded-lg px-4 text-sm font-semibold text-[#685856] hover:bg-[#f5efeb]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={mengirim()}
              className="min-h-11 cursor-pointer rounded-lg bg-[#39000a] px-4 text-sm font-semibold text-white hover:bg-[#5a0c1a] active:bg-[#2a0007] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mengirim() ? "Mengirim..." : "Kirim"}
            </button>
          </div>
        </form>
      </div>
    </Portal>
  );
}
