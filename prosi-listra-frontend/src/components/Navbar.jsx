import { A } from "@solidjs/router";
import CustomButton from "./CustomButton";
import logoListra from "../img/logo-listra.PNG";

export default function Navbar() {
  return (
    <nav className="bg-[#130205] text-white p-4 flex items-center justify-around">
      <div>
        <A href="/">
          <img src={logoListra} alt="Logo Listra" className="h-15 w-auto" />
        </A>
      </div>
      <div className="flex items-center">
        <A href="/" className="p-4">Beranda</A>
        <A href="/tentang-kami" className="p-4">Tentang Kami</A>
        <A href="/katalog" className="p-4">Katalog Kami</A>
        <A href="/testimoni" className="p-4">Testimoni</A>
      </div>
      <div>
        {/* button */}
        <CustomButton href="kontak" class="border-[#d4af37] border-2 text-[#d4af37]">
          Hubungi Kami
          </CustomButton>
      </div>
    </nav>
  );
}
