import logoListra from "../../img/logo-listra.png";
import logoUnpar from "../../img/Logo-UNPAR.png";

export default function TopBar() {
  return (
    // sticky top-0 = bar stays at the top when the page scrolls
    <header className="sticky top-0 z-20 flex min-h-[54px] items-center gap-3 border-b border-[#f0dedf] bg-white px-4">
      <img src={logoListra} alt="Logo Listra" className="h-8 w-auto" />
      <img src={logoUnpar} alt="Logo UNPAR" className="h-8 w-auto" />
      <span className="font-serif text-lg text-[#39000a]">LISTRA · Panel Internal</span>

      {/* flex-1 = empty space that pushes the user info to the right */}
      <span className="flex-1" />

      {/* TODO: replace with the logged-in user */}
      {/* hidden sm:inline = hide the name on small phones */}
      <span className="hidden text-sm sm:inline">Nama Pengguna</span>
      {/* TODO: logout */}
      <button className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-100">
        Keluar
      </button>
    </header>
  );
}
