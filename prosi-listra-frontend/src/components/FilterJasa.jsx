import { For } from "solid-js";

const filterGroups = [
  { title: "Jenis", key: "type", options: ["Tari", "Musik"] },
  {
    title: "Kultur",
    key: "culture",
    subtitle: "Asal tari, per pulau",
    options: ["Sumatera", "Jawa", "Bali & Nusa Tenggara"],
  },
  { title: "Posisi pentas", key: "position", options: ["Opening", "Middle", "Closing"] },
];

export default function FilterJasa(props) {
  return (
    <aside className="overflow-hidden rounded-[18px] border border-[#f0d9d8] bg-white shadow-[0_4px_14px_rgba(84,20,29,0.06)]">
      <h2 className="border-b border-[#f0d9d8] px-5 py-5 font-serif text-2xl font-bold text-[#54141d]">
        Filter
      </h2>

      <For each={filterGroups}>
        {(group) => (
          <section className="border-b border-[#f0d9d8] px-5 py-4 last:border-b-0">
            <h3 className="font-serif text-lg font-bold text-[#54141d]">{group.title}</h3>
            {group.subtitle && <p className="mt-3 text-sm text-[#9b8885]">{group.subtitle}</p>}
            <div className="mt-3 space-y-1">
              <For each={group.options}>
                {(option) => (
                  <label className="flex min-h-10 cursor-pointer items-center gap-3 text-base text-[#302929]">
                    <input
                      type="checkbox"
                      checked={props.selected()[group.key].includes(option)}
                      onChange={() => props.onToggle(group.key, option)}
                      className="h-4 w-4 accent-[#54141d]"
                    />
                    <span className="flex-1">{option}</span>
                    <span className="text-sm text-[#9b8885]">{props.count(group.key, option)}</span>
                  </label>
                )}
              </For>
            </div>
          </section>
        )}
      </For>
    </aside>
  );
}
