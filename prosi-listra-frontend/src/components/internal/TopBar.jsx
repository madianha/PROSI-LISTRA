import { createEffect, createSignal, onMount } from "solid-js";
import { useLocation, useNavigate } from "@solidjs/router";
import logoListra from "../../img/logo-listra.png";
import logoUnpar from "../../img/Logo-UNPAR.png";

function readUserName() {
  try {
    const raw = localStorage.getItem("listra_user");
    if (!raw) return "Nama Pengguna";
    const parsed = JSON.parse(raw);
    return parsed?.nama || parsed?.user?.nama || parsed?.data?.nama || "Nama Pengguna";
  } catch {
    return "Nama Pengguna";
  }
}

export default function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = createSignal(readUserName());

  onMount(() => {
    setUserName(readUserName());
  });

  createEffect(() => {
    void location.pathname;
    setUserName(readUserName());
  });

  const handleLogout = () => {
    localStorage.removeItem("listra_token");
    localStorage.removeItem("listra_user");
    navigate("/internal/login", { replace: true });
  };

  return (
    // sticky top-0 = bar stays at the top when the page scrolls
    <header className="sticky top-0 z-20 flex min-h-[54px] items-center gap-3 border-b border-[#f0dedf] bg-white px-4">
      <img src={logoListra} alt="Logo Listra" className="h-8 w-auto" />
      <img src={logoUnpar} alt="Logo UNPAR" className="h-8 w-auto" />
      <span className="font-serif text-lg text-[#39000a]">LISTRA · Panel Internal</span>

      {/* flex-1 = empty space that pushes the user info to the right */}
      <span className="flex-1" />

      {/* hidden sm:inline = hide the name on small phones */}
      <span className="hidden text-sm sm:inline">{userName()}</span>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-100"
      >
        Keluar
      </button>
    </header>
  );
}
