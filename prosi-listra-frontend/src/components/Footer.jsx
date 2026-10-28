import { A } from "@solidjs/router";
import logoListra from "../img/logo-listra.png";
import logoUnpar from "../img/Logo-UNPAR.png";

export default function Footer() {
  return (
    <footer className="bg-[#39030c] px-6 py-5 text-[#bca9aa] sm:px-[8%]">
      <div className="mx-auto grid max-w-[1110px] gap-5 sm:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-1">
            <img src={logoListra} alt="Logo LISTRA" className="h-7 w-7 object-contain" />
            <img src={logoUnpar} alt="Logo UNPAR" className="h-7 w-7 object-contain" />
          </div>
          <h2 className="mt-1 font-serif text-base font-bold text-[#dfbd52]">LISTRA</h2>
          <p className="mt-1 text-xs">Lingkung Seni Tradisional UNPAR</p>
        </div>
        <div>
          <h3 className="font-serif text-xs font-bold tracking-widest text-[#c7a431]">NAVIGASI</h3>
          <div className="mt-1 flex flex-col text-xs leading-5">
            <A href="/">Beranda</A><A href="/jasa">Jasa</A><A href="/jadwal">Jadwal Acara</A><A href="/berita">Berita</A><A href="/testimoni">Testimoni</A>
          </div>
        </div>
        <div>
          <h3 className="font-serif text-xs font-bold tracking-widest text-[#c7a431]">KONTAK</h3>
          <div className="mt-1 flex flex-col text-xs leading-5"><a href="/jadwal">WhatsApp Humas</a><a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a></div>
        </div>
      </div>
      <div className="mx-auto mt-3 max-w-[1110px] border-t border-white/10 pt-2 text-center text-xs">© 2026 LISTRA – Lingkung Seni Tradisional UNPAR</div>
    </footer>
  );
}
