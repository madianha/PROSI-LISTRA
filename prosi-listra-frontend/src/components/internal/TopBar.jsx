import { createEffect, createSignal, on, onMount, Show } from "solid-js";
import { A, useLocation, useNavigate } from "@solidjs/router";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import Icon from "../Icon";
import SideNav from "./SideNav";
import UserAvatar from "./UserAvatar";
import logoListra from "../../img/logo-listra.png";

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
  const [menuTerbuka, setMenuTerbuka] = createSignal(false);
  let tombolMenu;

  onMount(() => {
    setUserName(readUserName());
  });

  createEffect(() => {
    void location.pathname;
    setUserName(readUserName());
  });

  // pindah halaman (mis. tautan di menu HP diketuk) = menu HP tertutup lagi
  createEffect(on(() => location.pathname, () => setMenuTerbuka(false), { defer: true }));

  // Esc menutup menu HP. Isi menu hilang dari halaman, jadi fokus dikembalikan ke tombol menu.
  const tutupDenganEsc = (e) => {
    if (e.key !== "Escape" || !menuTerbuka()) return;
    setMenuTerbuka(false);
    tombolMenu.focus();
  };

  // satu cara keluar untuk tombol Keluar di bar atas (md ke atas) dan di menu HP
  const handleLogout = () => {
    localStorage.removeItem("listra_token");
    localStorage.removeItem("listra_user");
    navigate("/internal/login", { replace: true });
  };

  return (
    // sticky top-0 = bar stays at the top when the page scrolls; menu HP ada di dalamnya, jadi ikut menempel
    <header onKeyDown={tutupDenganEsc} className="sticky top-0 z-20 bg-white">
      <div className="flex min-h-[54px] items-center gap-3 border-b border-[#f0dedf] px-4">
        <img src={logoListra} alt="Logo Listra" className="h-8 w-auto" />
        {/* HP: "LISTRA" saja; hidden sm:inline = sisa judul baru tampil mulai layar sm (640px) */}
        <span className="font-serif text-lg text-[#39000a]">
          LISTRA<span className="hidden sm:inline"> · Panel Internal</span>
        </span>

        {/* flex-1 = empty space that pushes the user info to the right */}
        <span className="flex-1" />

        <div className="flex items-center gap-3">
          <A
            href="/internal/profile"
            aria-label="Profil akun"
            // HP: lingkaran 44px berisi avatar saja (size-11 justify-center).
            // md ke atas: pil berisi nama + avatar seperti semula (md:h-10 md:w-auto md:py-1 md:pl-3.5 md:pr-1.5)
            class="inline-flex size-11 items-center justify-center gap-2 rounded-full border border-[#4a0e17]/30 bg-[#f6ecee] text-[#2b090e] transition-colors hover:bg-[#efe0e3] md:h-10 md:w-auto md:py-1 md:pl-3.5 md:pr-1.5"
          >
            {/* hidden md:inline = nama baru tampil mulai md; di HP avatar saja */}
            <span class="hidden max-w-[160px] truncate text-sm font-medium md:inline">{userName()}</span>
            <UserAvatar class="h-8 w-8" tone="bg-[#e6d7da] text-[#5c3d42]" />
          </A>

          {/* garis pemisah dan Keluar baru tampil mulai md (hidden md:...); di HP Keluar ada di dalam menu */}
          <span className="hidden h-5 w-px bg-[#e6d7da] md:block" aria-hidden="true" />

          <button
            type="button"
            onClick={handleLogout}
            className="group hidden h-9 items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3.5 text-[13px] font-semibold text-neutral-900 transition-colors duration-150 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white active:scale-[0.98] md:inline-flex"
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

          {/* tombol menu: hanya di HP (md:hidden); size-11 = 44px agar mudah diketuk */}
          <button
            ref={tombolMenu}
            type="button"
            aria-expanded={menuTerbuka()}
            aria-controls="menu-internal"
            aria-label={menuTerbuka() ? "Tutup menu" : "Buka menu"}
            onClick={() => setMenuTerbuka(!menuTerbuka())}
            className="grid size-11 cursor-pointer place-items-center rounded-lg text-lg text-[#39000a] hover:bg-[#f6ecee] active:bg-[#efe0e3] md:hidden"
          >
            <Icon icon={menuTerbuka() ? faXmark : faBars} />
          </button>
        </div>
      </div>

      {/* menu HP: tautan yang sama dengan sidebar (SideNav), lalu Keluar.
          max-h-[calc(100dvh-54px)] = paling tinggi setinggi layar dikurangi bar (54px);
          overflow-y-auto = bila lebih panjang, menu digulir di dalam;
          overscroll-contain = saat menu habis digulir, halaman di belakangnya tidak ikut bergeser */}
      <Show when={menuTerbuka()}>
        <div
          id="menu-internal"
          className="max-h-[calc(100dvh-54px)] overflow-y-auto overscroll-contain bg-[#39000a] md:hidden"
        >
          <SideNav />
          {/* border-t border-white/10 = garis tipis pemisah di atas Keluar */}
          <div className="mx-3 border-t border-white/10 py-3">
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-11 w-full cursor-pointer items-center rounded px-3 text-left text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              Keluar
            </button>
          </div>
        </div>
      </Show>
    </header>
  );
}
