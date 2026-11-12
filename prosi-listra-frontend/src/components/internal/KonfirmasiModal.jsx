import { createUniqueId, onCleanup, onMount } from "solid-js";
import { Portal } from "solid-js/web";

/**
 * Jendela konfirmasi di tengah layar.
 * props.children      = pesan (mis. "Apakah Anda yakin ...?")
 * props.onKonfirmasi  = dipanggil saat tombol konfirmasi diklik
 * props.onBatal       = dipanggil saat Batal, tombol Esc, atau klik di luar jendela
 * props.labelKonfirmasi (opsional) = teks tombol konfirmasi, bawaan "Ya, ubah"
 * props.bahaya          (opsional) = tombol konfirmasi merah, untuk aksi seperti hapus
 * Tampilkan dengan <Show when={...}>; jendela muncul saat komponen ini dirender.
 */
export default function KonfirmasiModal(props) {
  const idPesan = createUniqueId();
  // elemen yang sedang fokus sebelum jendela dibuka, dikembalikan saat ditutup
  const fokusSebelumnya = document.activeElement;
  let tombolBatal;
  let tombolKonfirmasi;

  const tekanTombol = (e) => {
    if (e.key === "Escape") props.onBatal();
    // Tab hanya berputar di antara Batal dan tombol konfirmasi, tidak ke halaman di belakang
    if (e.key === "Tab") {
      e.preventDefault();
      const ke = document.activeElement === tombolBatal ? tombolKonfirmasi : tombolBatal;
      ke.focus();
    }
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
              className="min-h-11 cursor-pointer rounded-lg px-4 text-sm font-semibold text-[#685856] hover:bg-[#f5efeb] hover:text-[#302929] active:bg-[#ece4df]"
            >
              Batal
            </button>
            <button
              ref={tombolKonfirmasi}
              type="button"
              onClick={() => props.onKonfirmasi()}
              className={`min-h-11 cursor-pointer rounded-lg px-4 text-sm font-semibold text-white ${
                props.bahaya
                  ? "bg-red-700 hover:bg-red-800 active:bg-red-900"
                  : "bg-[#39000a] hover:bg-[#5a0c1a] active:bg-[#2a0007]"
              }`}
            >
              {props.labelKonfirmasi ?? "Ya, ubah"}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
