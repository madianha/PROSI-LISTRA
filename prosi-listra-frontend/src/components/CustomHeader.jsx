import { Show } from "solid-js";

/**
 * Pita judul di atas halaman publik.
 * props.pageName = judul halaman (h1)
 * props.children = teks pengantar dan/atau tombol di bawah judul
 */
export default function CustomHeader(props) {
  return (
    <header className="bg-[#39000a] px-5 py-10 text-center sm:px-8 sm:py-12">
      <Show when={props.pageName}>
        {/* text-balance = baris judul dibagi rata, tidak menyisakan satu kata di baris terakhir */}
        <h1 className="mx-auto max-w-3xl text-balance font-serif text-3xl font-bold leading-tight text-white sm:text-4xl">
          {props.pageName}
        </h1>
      </Show>
      <div className="mx-auto mt-3 max-w-2xl space-y-2 text-sm leading-relaxed text-white/85 sm:text-base">
        {props.children}
      </div>
    </header>
  );
}
