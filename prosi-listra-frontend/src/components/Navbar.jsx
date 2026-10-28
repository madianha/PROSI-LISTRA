import { A, useLocation } from "@solidjs/router";
import logoListra from "../img/logo-listra.png";
import logoUnpar from "../img/Logo-UNPAR.png";

export default function Navbar() {
  const location = useLocation();
  const linkClass = (path) => `relative p-1 transition-colors after:absolute after:bottom-[-3px] after:left-1 after:right-1 after:h-[2px] after:origin-left after:scale-x-0 after:bg-[#d4af37] after:transition-transform hover:text-[#54141d] ${location.pathname === path ? "font-bold text-[#54141d] after:scale-x-100" : "text-[#5f5152]"}`;
  return (
    <nav className="flex min-h-[58px] items-center justify-between bg-white px-5 py-3 text-[#3d1017] sm:min-h-[68px] sm:px-[8%] sm:py-4">
      <div className="flex items-center gap-1">
        <A href="/">
          <img src={logoListra} alt="Logo Listra" className="h-7 w-7 object-contain sm:h-8 sm:w-8" />
        </A>
        <A href="/">
          <img src={logoUnpar} alt="Logo UNPAR" className="h-7 w-7 object-contain sm:h-8 sm:w-8" />
        </A>
        <h1 className="ml-1 font-serif text-base font-bold sm:text-lg">LISTRA</h1>
      </div>
      <div className="flex items-center gap-1 text-[11px] sm:gap-3 sm:text-sm">
        <A href="/" className={linkClass("/")}>Beranda</A>
        {/* <A href="/tentang-kami" className="p-4">Tentang Kami</A> */}
        <A href="/jasa" className={linkClass("/jasa")}>Jasa</A>
        <A href="/jadwal" className={linkClass("/jadwal")}>Jadwal Acara</A>
        <A href="/berita" className={linkClass("/berita")}>Berita</A>
        <A href="/testimoni" className={linkClass("/testimoni")}>Testimoni</A>

      </div>

      {/* <div> */}
      {/* button */}
      {/* <CustomButton href="kontak" class="border-[#d4af37] border-2 text-[#d4af37]">
          Hubungi Kami
          </CustomButton> */}
      {/* </div> */}
    </nav>
  );
}
