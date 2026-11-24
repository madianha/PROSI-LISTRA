import { useLocation } from "@solidjs/router";
import { createResource, Show } from "solid-js";
import { faCommentDots } from "@fortawesome/free-solid-svg-icons";
import Footer from "./Footer";
import Icon from "./Icon";
import Navbar from "./Navbar";
import { getKontak, linkWhatsApp } from "../api/kontak";

/**
 * Kerangka semua halaman publik: Navbar, isi halaman (<main>), tombol WhatsApp melayang, Footer.
 * Pasangan dari components/internal/InternalLayout.jsx untuk halaman internal.
 */
export default function PublicLayout(props) {
  const lokasi = useLocation();
  // error dicek dulu karena membaca kontak() yang gagal melempar error
  const [kontak] = createResource(getKontak);
  const linkWa = () => (kontak.error ? null : linkWhatsApp(kontak()));
  // Detail Jasa sudah punya tombol "Pesan via WhatsApp" sendiri, jadi tombol melayang tidak perlu
  const tampilTombolWa = () => linkWa() && !lokasi.pathname.startsWith("/jasa/");

  let isi;
  // tautan lompat: fokus pindah ke isi halaman, melewati menu
  const lompatKeIsi = (e) => {
    e.preventDefault();
    isi.focus();
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fffafa] text-[#302929]">
      {/* sr-only = tersembunyi, hanya untuk keyboard & pembaca layar; muncul di pojok saat difokus dengan Tab */}
      <a
        href="#isi"
        onClick={lompatKeIsi}
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-[#39000a] focus:shadow-md"
      >
        Langsung ke isi halaman
      </a>

      <Navbar />

      {/* tabIndex -1 = bisa menerima fokus dari tautan lompat, tapi tidak masuk urutan Tab */}
      <main id="isi" ref={isi} tabIndex={-1} className="w-full flex-1 focus:outline-none">
        {props.children}
      </main>

      {/* fixed = tombol melayang di pojok kanan bawah; hanya tampil bila nomor WhatsApp sudah diisi.
          Di HP hanya ikon bulat (size-14) agar tidak menutupi isi halaman; teks "Hubungi Kami" muncul mulai layar sm */}
      <Show when={tampilTombolWa()}>
        <a
          href={linkWa()}
          target="_blank"
          rel="noreferrer"
          aria-label="Hubungi Humas LISTRA lewat WhatsApp (tab baru)"
          className="fixed bottom-4 right-4 z-20 inline-flex size-14 items-center justify-center gap-2 rounded-full bg-[#dfb83b] text-[#3d1017] shadow-lg hover:bg-[#edca5d] active:bg-[#d4a92c] sm:bottom-5 sm:right-5 sm:size-auto sm:min-h-12 sm:px-5"
        >
          <Icon icon={faCommentDots} class="text-xl sm:text-base" />
          <span className="hidden text-sm font-bold sm:inline">Hubungi Kami</span>
        </a>
      </Show>

      <Footer linkWa={linkWa()} ruangTombolWa={tampilTombolWa()} />
    </div>
  );
}
