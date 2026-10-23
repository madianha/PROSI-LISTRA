import { A, useLocation } from "@solidjs/router";
import { For } from "solid-js";

// To add a menu: add a line here, then add its Route in App.jsx.
// `aktif` (optional) decides when the link is highlighted; by default it's
// highlighted on its own page and every page under it.
const MENU = [
  { href: "/internal/kalender", label: "Kalender Event" },
  { href: "/internal/katalog", label: "Katalog Jasa" },
  { href: "/internal/alat-musik", label: "Alat Musik" },
  { href: "/internal/anggota", label: "Anggota" },
  { href: "/internal/periode", label: "Periode & Peran" },
  {
    href: "/internal/berita",
    label: "Kelola Berita",
    // also highlighted on the edit page, but not on Berita Baru
    aktif: (path) => path === "/internal/berita" || /^\/internal\/berita\/\d+\/ubah$/.test(path),
  },
  { href: "/internal/berita/baru", label: "Berita Baru" },
  { href: "/internal/testimoni", label: "Testimoni" },
  { href: "/internal/kontak", label: "Kontak WhatsApp" },
];

export default function SideNav() {
  const location = useLocation();
  const isAktif = (item) =>
    item.aktif ? item.aktif(location.pathname) : location.pathname.startsWith(item.href);

  return (
    // Phone: a row you can swipe sideways (flex + overflow-x-auto).
    // md: (tablet and up): a column stuck below the top bar (md:flex-col md:sticky).
    <nav className="flex gap-1 overflow-x-auto bg-[#39000a] p-3 md:sticky md:top-[54px] md:flex-col md:overflow-visible">
      <For each={MENU}>
        {(item) => (
          <A
            href={item.href}
            // classList = add these classes only when the condition is true
            // shadow-[inset_3px_0_0_#d4af37] = gold bar on the left edge
            classList={{
              "bg-[#5a0c1a] text-white shadow-[inset_3px_0_0_#d4af37]": isAktif(item),
              "text-white/70 hover:text-white": !isAktif(item),
            }}
            className="whitespace-nowrap rounded px-3 py-2 text-sm font-medium transition-colors"
          >
            {item.label}
          </A>
        )}
      </For>
    </nav>
  );
}
