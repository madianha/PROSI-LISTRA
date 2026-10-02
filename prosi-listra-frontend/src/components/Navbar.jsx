import { A } from "@solidjs/router";
import CustomButton from "./CustomButton";
import logoListra from "../img/logo-listra.PNG";
import logoUnpar from "../img/Logo-UNPAR.PNG";

export default function Navbar() {
  return (
    <nav className="bg-white text-black p-4 flex items-center justify-between">
      <div className="flex gap-2  items-center">
        <A href="/">
          <img src={logoListra} alt="Logo Listra" className="h-10 w-auto" />
        </A>
        <A href="/">
          <img src={logoUnpar} alt="Logo Listra" className="h-10 w-auto" />
        </A>
        <h1 className="text-2xl font-serif">LISTRA</h1>
      </div>
      <div className="flex items-center">
        <A href="/" className="p-4">Beranda</A>
        <A href="/tentang-kami" className="p-4">Tentang Kami</A>
        <A href="/katalog" className="p-4">Katalog Kami</A>
        <A href="/testimoni" className="p-4">Testimoni</A>
        <A href="/login" className="p-4">Masuk</A>
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
