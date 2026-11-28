import { createEffect, createSignal, on, Show } from "solid-js";
import { formatJam, parseJam } from "../../../utils/kalender";

/**
 * Kolom jam format 24 jam ("16.00"). Pengganti <input type="time">, yang di browser
 * berbahasa Inggris tampil sebagai AM/PM dan tidak bisa dipaksa 24 jam oleh halaman.
 * Boleh diketik "16.00", "16:00", "1600", atau "16"; setelah keluar dari kolom ditulis rapi jadi "16.00".
 *
 * props.id      = id <input>, dipasangkan dengan <label for>
 * props.value   = "HH:MM" atau ""
 * props.onUbah  = (jam) => ..., jam = "HH:MM", atau "" selama ketikan belum jadi jam yang sah
 * props.class   = kelas tambahan untuk <input>
 */
export default function InputJam(props) {
  const [teks, setTeks] = createSignal(formatJam(props.value));
  const [salah, setSalah] = createSignal(false);
  let sedangDiketik = false;

  // nilai diganti dari luar (misalnya jam disalin dari baris sebelumnya): tampilkan,
  // kecuali sedang diketik, supaya ketikan setengah jadi ("16.") tidak tertimpa
  createEffect(
    on(
      () => props.value,
      (jam) => {
        if (!sedangDiketik) setTeks(formatJam(jam));
      },
      { defer: true }
    )
  );

  const ketik = (e) => {
    sedangDiketik = true;
    const jam = parseJam(e.currentTarget.value);
    setTeks(e.currentTarget.value);
    if (jam) setSalah(false);
    props.onUbah(jam);
  };

  // pesan salah baru muncul setelah keluar dari kolom, tidak di tengah mengetik
  const keluar = () => {
    sedangDiketik = false;
    const jam = parseJam(teks());
    if (jam) setTeks(formatJam(jam));
    setSalah(teks().trim() !== "" && !jam);
  };

  return (
    <>
      <input
        id={props.id}
        type="text"
        // decimal = keyboard angka di HP yang masih punya tanda titik
        inputMode="decimal"
        autocomplete="off"
        maxLength={5}
        placeholder="mis. 16.00"
        value={teks()}
        onInput={ketik}
        onBlur={keluar}
        aria-invalid={salah()}
        aria-describedby={salah() ? `${props.id}-salah` : undefined}
        // border-red-600! = menang dari border abu-abu di props.class
        className={`${props.class ?? ""} ${salah() ? "border-red-600!" : ""}`}
      />
      <Show when={salah()}>
        <p id={`${props.id}-salah`} className="mt-1 text-xs text-red-700">
          Jam 00.00–23.59
        </p>
      </Show>
    </>
  );
}
