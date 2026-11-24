import { createUniqueId, For } from "solid-js";

const filterGroups = [
  { title: "Jenis", key: "type", options: ["Tari", "Musik"] },
  {
    title: "Kultur",
    key: "culture",
    subtitle: "Asal tari, per pulau",
    options: ["Sumatera", "Jawa", "Bali & Nusa Tenggara"],
  },
  {
    title: "Posisi pentas",
    key: "position",
    subtitle: "Urutan tampil dalam susunan acara",
    options: ["Opening", "Middle", "Closing"],
  },
];

/**
 * Panel filter katalog jasa.
 * props.selected = signal { type: [], culture: [], position: [] }
 * props.onToggle = (key, value) => ..., props.count = (key, value) => jumlah jasa yang cocok
 */
export default function FilterJasa(props) {
  return (
    <div className="rounded-xl border border-[#f0dedf] bg-white">
      {/* hidden lg:block = di HP tombol "Filter" di atas panel sudah jadi judulnya, jadi tidak ditulis dua kali */}
      <h2 className="hidden border-b border-[#f0dedf] px-5 py-4 font-serif text-xl font-bold text-[#39000a] lg:block">Filter</h2>

      <For each={filterGroups}>
        {(group) => {
          const idJudul = createUniqueId();
          return (
            <section className="border-b border-[#f0dedf] px-5 py-4 last:border-b-0">
              <h3 id={idJudul} className="font-serif text-base font-bold text-[#39000a]">
                {group.title}
              </h3>
              {group.subtitle && <p className="mt-1 text-sm text-[#685856]">{group.subtitle}</p>}
              {/* role="group" = pembaca layar tahu kotak centang ini satu kelompok (judulnya di atas) */}
              <div role="group" aria-labelledby={idJudul} className="mt-2">
                <For each={group.options}>
                  {(option) => (
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-[#302929]">
                      <input
                        type="checkbox"
                        checked={props.selected()[group.key].includes(option)}
                        onChange={() => props.onToggle(group.key, option)}
                        className="size-4 cursor-pointer accent-[#54141d]"
                      />
                      <span className="flex-1">{option}</span>
                      <span className="text-[#685856]">{props.count(group.key, option)}</span>
                    </label>
                  )}
                </For>
              </div>
            </section>
          );
        }}
      </For>
    </div>
  );
}
