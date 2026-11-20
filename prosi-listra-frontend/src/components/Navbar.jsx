import { A, useLocation } from "@solidjs/router";
import { createEffect, createSignal, For, on } from "solid-js";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import Icon from "./Icon";
import logoListra from "../img/logo-listra.png";
import logoUnpar from "../img/Logo-UNPAR.png";

// end = Beranda hanya aktif di alamat "/" persis; menu lain tetap aktif di halaman detailnya (mis. /jasa/5)
const MENU = [
  { href: "/", label: "Beranda", end: true },
  { href: "/jasa", label: "Jasa" },
  { href: "/jadwal", label: "Jadwal Acara" },
  { href: "/berita", label: "Berita" },
  { href: "/testimoni", label: "Testimoni" },
];

export default function Navbar() {
  const lokasi = useLocation();
  const [menuTerbuka, setMenuTerbuka] = createSignal(false);
  // pindah halaman = menu HP tertutup lagi
  createEffect(on(() => lokasi.pathname, () => setMenuTerbuka(false), { defer: true }));

  return (
    <header className="border-b border-[#f0dedf] bg-white text-[#39000a]">
      <nav
        aria-label="Menu utama"
        onKeyDown={(e) => e.key === "Escape" && setMenuTerbuka(false)}
        className="px-5 sm:px-8"
      >
        {/* jarak tepi di luar, lebar maksimal di dalam: sama dengan isi halaman dan footer, jadi tepi kirinya sejajar */}
        <div className="mx-auto max-w-[1110px]">
        <div className="flex min-h-16 items-center justify-between gap-4">
          {/* logo + nama = satu tautan ke Beranda; gambar alt="" karena namanya sudah ada di label */}
          <A href="/" end aria-label="LISTRA UNPAR, ke Beranda" class="flex min-h-11 items-center gap-1.5">
            <img src={logoListra} alt="" width="32" height="32" className="size-8 object-contain" />
            <img src={logoUnpar} alt="" width="32" height="32" className="size-8 object-contain" />
            <span className="ml-1 font-serif text-lg font-bold">LISTRA</span>
          </A>

          {/* menu layar sm ke atas; after: = garis emas di bawah menu halaman yang sedang dibuka */}
          <ul className="hidden items-center gap-1 sm:flex">
            <For each={MENU}>
              {(menu) => (
                <li>
                  <A
                    href={menu.href}
                    end={menu.end}
                    class="relative inline-flex min-h-11 items-center px-3 text-sm transition-colors after:absolute after:inset-x-3 after:bottom-1.5 after:h-0.5 after:bg-[#d4af37] hover:text-[#39000a]"
                    activeClass="font-semibold text-[#54141d] after:opacity-100"
                    inactiveClass="text-[#5f5152] after:opacity-0"
                  >
                    {menu.label}
                  </A>
                </li>
              )}
            </For>
          </ul>

          {/* tombol menu: hanya di HP (sm:hidden) */}
          <button
            type="button"
            aria-expanded={menuTerbuka()}
            aria-controls="menu-hp"
            aria-label={menuTerbuka() ? "Tutup menu" : "Buka menu"}
            onClick={() => setMenuTerbuka(!menuTerbuka())}
            className="grid size-11 cursor-pointer place-items-center rounded-lg text-lg hover:bg-[#fff0f1] active:bg-[#f9e3e4] sm:hidden"
          >
            <Icon icon={menuTerbuka() ? faXmark : faBars} />
          </button>
        </div>

        {/* menu HP: daftar bersusun, tampil saat tombol menu ditekan */}
        <ul id="menu-hp" className={`${menuTerbuka() ? "block" : "hidden"} border-t border-[#f0dedf] py-2 sm:hidden`}>
          <For each={MENU}>
            {(menu) => (
              <li>
                <A
                  href={menu.href}
                  end={menu.end}
                  class="flex min-h-11 items-center rounded-lg px-3 text-base"
                  activeClass="bg-[#fff0f1] font-semibold text-[#54141d]"
                  inactiveClass="text-[#302929] hover:bg-[#fff8f7]"
                >
                  {menu.label}
                </A>
              </li>
            )}
          </For>
        </ul>
        </div>
      </nav>
    </header>
  );
}
