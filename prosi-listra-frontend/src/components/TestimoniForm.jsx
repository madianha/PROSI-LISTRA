import { createSignal, createUniqueId, For, onCleanup, onMount, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { faStar, faTimes } from "@fortawesome/free-solid-svg-icons";
import Icon from "./Icon";
import Recaptcha from "./Recaptcha";

// kelas input yang sama untuk semua kolom
const INPUT =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-[#302929] focus:border-[#4a0e17] focus:outline-none focus:ring-1 focus:ring-[#4a0e17]";
const LABEL = "mb-1 block text-xs font-semibold text-[#302929]";

/**
 * Jendela form testimoni.
 * props.judul    = judul jendela
 * props.awal     = (opsional) baris testimoni yang diubah; isinya mengisi form
 * props.internal = (opsional) tampilkan pilihan Sumber, untuk pengurus.
 *                  Form publik (bukan internal) wajib lolos Google reCAPTCHA.
 * props.onKirim  = async (data) => ..., lempar Error bila gagal (pesannya ditampilkan)
 * props.onTutup  = dipanggil saat Batal, Esc, atau klik di luar jendela
 */
export default function TestimoniForm(props) {
  const idJudul = createUniqueId();
  // dibaca sekali saat jendela dibuka; tanpa props.awal = form kosong
  const awal = props.awal ?? {};
  const [data, setData] = createSignal({
    nama_klien: awal.nama_klien ?? "",
    instansi: awal.instansi ?? "",
    nama_acara: awal.nama_acara ?? "",
    is_acara_privat: awal.is_acara_privat ?? false,
    rating: awal.rating ?? null,
    isi_testimoni: awal.isi_testimoni ?? "",
    sumber: awal.sumber ?? "whatsapp",
  });
  const [mengirim, setMengirim] = createSignal(false);
  const [pesanError, setPesanError] = createSignal("");
  // token reCAPTCHA; null = belum dicentang / kedaluwarsa. Tidak dipakai di form internal.
  const [token, setToken] = createSignal(null);
  const [captchaError, setCaptchaError] = createSignal("");
  let recaptcha;
  const ubah = (kolom, nilai) => setData((d) => ({ ...d, [kolom]: nilai }));
  let kolomPertama;
  let jendela;
  let fokusSebelumnya;

  // Esc menutup jendela; Tab berputar di dalam jendela (tidak lari ke halaman di belakangnya)
  const tekanTombol = (e) => {
    if (e.key === "Escape") return props.onTutup();
    if (e.key !== "Tab" || !jendela) return;
    const bisaFokus = [
      ...jendela.querySelectorAll(
        "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex='-1'])",
      ),
    ];
    if (bisaFokus.length === 0) return;
    const pertama = bisaFokus[0];
    const terakhir = bisaFokus[bisaFokus.length - 1];
    if (!jendela.contains(document.activeElement)) {
      e.preventDefault();
      pertama.focus();
    } else if (e.shiftKey && document.activeElement === pertama) {
      e.preventDefault();
      terakhir.focus();
    } else if (!e.shiftKey && document.activeElement === terakhir) {
      e.preventDefault();
      pertama.focus();
    }
  };
  onMount(() => {
    fokusSebelumnya = document.activeElement;
    kolomPertama.focus();
    document.addEventListener("keydown", tekanTombol);
    // halaman di belakang jendela tidak ikut tergulir
    document.body.style.overflow = "hidden";
  });
  onCleanup(() => {
    document.removeEventListener("keydown", tekanTombol);
    document.body.style.overflow = "";
    // fokus kembali ke tombol yang tadi membuka jendela
    fokusSebelumnya?.focus?.();
  });

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
        // sumber hanya dipakai backend bila pengirimnya login
        ...(props.internal ? { sumber: d.sumber } : { captcha_token: token() }),
      });
    } catch (error) {
      setPesanError(error.message);
      // token sudah terpakai oleh kiriman yang gagal, jadi minta centang ulang
      recaptcha?.reset();
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
          ref={jendela}
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

            {/* Khusus pengurus: dari mana testimoni ini. Tampil atau tidak diatur setelah diterima.
                sm:grid-cols-2 = kolom Sumber selebar kolom Instansi di atasnya */}
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
              </div>
            </Show>
          </div>

          {/* Form publik: centang Google reCAPTCHA sebelum bisa mengirim */}
          <Show when={!props.internal}>
            <div className="mt-4">
              <Recaptcha onToken={setToken} onError={setCaptchaError} ref={(r) => (recaptcha = r)} />
              <Show when={captchaError()}>
                <p role="alert" className="mt-2 text-xs text-red-700">{captchaError()}</p>
              </Show>
            </div>
          </Show>

          <div className="mt-6 flex items-center justify-end gap-2">
            {/* form publik: jelaskan kenapa Kirim belum bisa ditekan; mr-auto = teks di kiri, tombol di kanan */}
            <Show when={!props.internal && !token()}>
              <p className="mr-auto text-xs text-[#685856]">Kirim aktif setelah verifikasi di atas selesai.</p>
            </Show>
            <button
              type="button"
              onClick={() => props.onTutup()}
              className="min-h-11 cursor-pointer rounded-lg px-4 text-sm font-semibold text-[#685856] hover:bg-[#f5efeb]"
            >
              Batal
            </button>
            <button
              type="submit"
              // form publik: Kirim baru aktif setelah lolos centang "bukan robot"
              disabled={mengirim() || (!props.internal && !token())}
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
