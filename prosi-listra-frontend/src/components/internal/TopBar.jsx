import { createEffect, createSignal, onMount } from "solid-js";
import { A, useLocation, useNavigate } from "@solidjs/router";
import UserAvatar from "./UserAvatar";
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

      <div className="flex items-center gap-3">
        <A
          href="/internal/profile"
          aria-label="Profil akun"
          class="inline-flex h-10 items-center gap-2 rounded-full border border-[#4a0e17]/30 bg-[#f6ecee] py-1 pl-3.5 pr-1.5 text-[#2b090e] transition-colors hover:bg-[#efe0e3]"
        >
          {/* hidden sm:inline = hide the name on small phones, avatar stays */}
          <span class="hidden max-w-[160px] truncate text-sm font-medium sm:inline">{userName()}</span>
          <UserAvatar class="h-8 w-8" tone="bg-[#e6d7da] text-[#5c3d42]" />
        </A>

        <span className="h-5 w-px bg-[#e6d7da]" aria-hidden="true" />

        <button
          type="button"
          onClick={handleLogout}
          className="group inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3.5 text-[13px] font-semibold text-neutral-900 transition-colors duration-150 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white active:scale-[0.98]"
        >
          <span>Keluar</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="h-4 w-4 stroke-[1.8] transition-transform duration-150 group-hover:translate-x-0.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </header>
  );
}
