import { createUniqueId, onCleanup, onMount } from "solid-js";
import { Portal } from "solid-js/web";

/**
 * Jendela konfirmasi di tengah layar.
 * props.children      = pesan (mis. "Apakah Anda yakin ...?")
 * props.onKonfirmasi  = dipanggil saat tombol konfirmasi diklik
 * props.onBatal       = dipanggil saat Batal, tombol Esc, atau klik di luar jendela
 * props.labelKonfirmasi (opsional) = teks tombol konfirmasi, bawaan "Ya, ubah"
 * Tampilkan dengan <Show when={...}>; jendela muncul saat komponen ini dirender.
 */
export default function KonfirmasiModal(props) {
  const idPesan = createUniqueId();
  // elemen yang sedang fokus sebelum jendela dibuka, dikembalikan saat ditutup
  const fokusSebelumnya = document.activeElement;
  let tombolBatal;

  const tekanTombol = (e) => {
    if (e.key === "Escape") props.onBatal();
  };

  onMount(() => {
    tombolBatal.focus(); // fokus ke Batal agar Enter tidak langsung mengubah
    document.addEventListener("keydown", tekanTombol);
  });

  onCleanup(() => {
    document.removeEventListener("keydown", tekanTombol);
    fokusSebelumnya?.focus?.();
  });

  return (
    // Portal = dirender langsung di <body>, jadi tidak terpotong tabel atau layout
    <Portal>
      {/* fixed inset-0 = menutupi seluruh layar; bg-black/40 = latar gelap transparan */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={(e) => e.target === e.currentTarget && props.onBatal()}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={idPesan}
          className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
        >
          <p id={idPesan} className="text-sm leading-relaxed text-[#302929]">
            {props.children}
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button
              ref={tombolBatal}
              type="button"
              onClick={() => props.onBatal()}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-[#685856] hover:bg-gray-100"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => props.onKonfirmasi()}
              className="rounded-lg bg-[#39000a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5a0c1a]"
            >
              {props.labelKonfirmasi ?? "Ya, ubah"}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
