import { createEffect, createSignal, on, Show } from "solid-js";
import { faImage } from "@fortawesome/free-solid-svg-icons";
import Icon from "./Icon";

/**
 * Gambar sampul berita. Bila gambar gagal dimuat (link rusak), tampil kotak polos
 * berukuran sama, bukan ikon gambar rusak bawaan browser.
 * props.src, props.alt, props.class   = seperti <img>
 * props.loading, props.fetchpriority  = (opsional) diteruskan ke <img>
 * props.sembunyikanBilaGagal          = (opsional) gambar gagal dimuat = tidak tampil sama sekali (bukan kotak polos)
 */
export default function GambarSampul(props) {
  const [gagal, setGagal] = createSignal(false);
  // gambar diganti (mis. "Ganti gambar" di form) = coba muat lagi
  createEffect(on(() => props.src, () => setGagal(false), { defer: true }));

  return (
    <Show
      when={!gagal()}
      fallback={
        props.sembunyikanBilaGagal ? null : (
          <div
            role={props.alt ? "img" : undefined}
            aria-label={props.alt || undefined}
            className={`flex items-center justify-center bg-[#ece4df] text-[#948280] ${props.class ?? ""}`}
          >
            <Icon icon={faImage} class="text-xl" />
          </div>
        )
      }
    >
      {/* referrerpolicy no-referrer: unpar.ac.id menolak gambar yang diminta dari situs lain
          (dengan Referer localhost/domain LISTRA gambar dialihkan, tanpa Referer gambar tampil) */}
      <img
        src={props.src}
        referrerpolicy="no-referrer"
        alt={props.alt ?? ""}
        loading={props.loading}
        fetchpriority={props.fetchpriority}
        onError={() => setGagal(true)}
        className={props.class}
      />
    </Show>
  );
}
