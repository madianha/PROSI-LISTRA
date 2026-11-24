import { For, Show } from "solid-js";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import Icon from "./Icon";

/**
 * Kartu testimoni. props = satu baris dari tabel testimoni.
 * Rating kosong = bintang tidak ditampilkan. Acara privat = nama acara disembunyikan.
 */
export default function TestimoniCard(props) {
  const rating = () => Number(props.rating ?? 0);
  const date = () =>
    props.tanggal_input
      ? new Date(props.tanggal_input).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "";

  return (
    // figure + blockquote + figcaption = kutipan beserta siapa yang mengatakannya
    <figure className="flex h-full w-full flex-col rounded-xl border border-[#f0dedf] bg-white p-5">
      <Show when={rating() > 0}>
        {/* role="img" + aria-label = pembaca layar mendengar "Rating 4 dari 5", bukan lima ikon bintang */}
        <div role="img" aria-label={`Rating ${rating()} dari 5`} className="flex items-center gap-2">
          <span className="flex gap-0.5 text-sm">
            <For each={[1, 2, 3, 4, 5]}>
              {(n) => <Icon icon={faStar} class={n <= rating() ? "text-[#c99a1a]" : "text-[#e3d6d3]"} />}
            </For>
          </span>
          <span className="text-sm text-[#685856]">{rating()} / 5</span>
        </div>
      </Show>

      <blockquote className="mt-3 flex-1 text-sm leading-6 text-[#302929]">{props.isi_testimoni}</blockquote>

      <figcaption className="mt-4 border-t border-[#f0dedf] pt-3 text-sm leading-5">
        <p className="font-semibold text-[#302929]">{props.nama_klien}</p>
        <Show when={props.instansi}>
          <p className="text-[#685856]">{props.instansi}</p>
        </Show>
        <Show when={props.is_acara_privat || props.nama_acara}>
          <p className="text-[#685856]">Acara: {props.is_acara_privat ? "Acara privat" : props.nama_acara}</p>
        </Show>
        <Show when={date()}>
          <p className="mt-1 text-xs text-[#685856]">{date()}</p>
        </Show>
      </figcaption>
    </figure>
  );
}
