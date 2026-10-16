import { A } from "@solidjs/router";
import { For } from "solid-js";

// To add a menu: add a line here, then add its Route in App.jsx
const MENU = [
  { href: "/internal/kalender", label: "Kalender Event" },
  { href: "/internal/katalog", label: "Katalog Jasa" },
  { href: "/internal/alat-musik", label: "Alat Musik" },
  { href: "/internal/anggota", label: "Anggota" },
  { href: "/internal/periode", label: "Periode & Peran" },
  { href: "/internal/berita", label: "Berita" },
  { href: "/internal/testimoni", label: "Testimoni" },
  { href: "/internal/kontak", label: "Kontak WhatsApp" },
];

export default function SideNav() {
  return (
    // Phone: a row you can swipe sideways (flex + overflow-x-auto).
    // md: (tablet and up): a column stuck below the top bar (md:flex-col md:sticky).
    <nav className="flex gap-1 overflow-x-auto bg-[#39000a] p-3 md:sticky md:top-[54px] md:flex-col md:overflow-visible">
      <For each={MENU}>
        {(item) => (
          <A
            href={item.href}
            // activeClass = classes used when this link is the current page
            // shadow-[inset_3px_0_0_#d4af37] = gold bar on the left edge
            activeClass="bg-[#5a0c1a] text-white shadow-[inset_3px_0_0_#d4af37]"
            inactiveClass="text-white/70 hover:text-white"
            className="whitespace-nowrap rounded px-3 py-2 text-sm font-medium"
          >
            {item.label}
          </A>
        )}
      </For>
    </nav>
  );
}
