import { A } from "@solidjs/router";
import { For, Show } from "solid-js";
import logoListra from "../img/logo-listra.png";
import logoUnpar from "../img/Logo-UNPAR.png";

const NAVIGASI = [
  { href: "/", label: "Beranda" },
  { href: "/jasa", label: "Jasa" },
  { href: "/jadwal", label: "Jadwal Acara" },
  { href: "/berita", label: "Berita" },
  { href: "/testimoni", label: "Testimoni" },
];

// min-h-11 = mudah disentuh di HP; di layar sm ke atas lebih rapat
const TAUTAN = "flex min-h-11 items-center hover:text-white hover:underline sm:min-h-8";

/**
 * Footer halaman publik.
 * props.linkWa        = link WhatsApp Humas; null = nomor belum diisi, tautan WhatsApp tidak ditampilkan
 * props.ruangTombolWa = tombol WhatsApp melayang sedang tampil; di HP footer diberi ruang di bawah agar tidak tertutup
 */
export default function Footer(props) {
  return (
    <footer
      className={`bg-[#39000a] px-5 pt-8 text-sm text-[#e0cfd0] sm:px-8 sm:pb-8 ${props.ruangTombolWa ? "pb-24" : "pb-8"}`}
    >
      <div className="mx-auto grid max-w-[1110px] gap-8 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-1.5">
            <img src={logoListra} alt="" width="32" height="32" className="size-8 object-contain" />
            <img src={logoUnpar} alt="" width="32" height="32" className="size-8 object-contain" />
          </div>
          <p className="mt-2 font-serif text-lg font-bold text-[#dfbd52]">LISTRA</p>
          <p className="mt-1">Lingkung Seni Tradisional UNPAR</p>
        </div>

        <nav aria-label="Navigasi footer">
          <h2 className="font-serif text-base font-bold text-[#dfbd52]">Navigasi</h2>
          <ul className="mt-2">
            <For each={NAVIGASI}>
              {(menu) => (
                <li>
                  <A href={menu.href} class={TAUTAN}>
                    {menu.label}
                  </A>
                </li>
              )}
            </For>
          </ul>
        </nav>

        <div>
          <h2 className="font-serif text-base font-bold text-[#dfbd52]">Kontak</h2>
          <ul className="mt-2">
            {/* WhatsApp hanya tampil bila nomor Humas sudah diisi */}
            <Show when={props.linkWa}>
              <li>
                <a href={props.linkWa} target="_blank" rel="noreferrer" className={TAUTAN}>
                  WhatsApp Humas
                </a>
              </li>
            </Show>
            <li>
              <a href="https://www.instagram.com/listraunpar/" target="_blank" rel="noreferrer" className={TAUTAN}>
                Instagram @listraunpar
              </a>
            </li>
          </ul>
        </div>
      </div>

      <p className="mx-auto mt-8 max-w-[1110px] border-t border-white/10 pt-4 text-center text-xs">
        © 2026 LISTRA – Lingkung Seni Tradisional UNPAR
      </p>
    </footer>
  );
}
