import { createSignal, onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
import logoListra from "../../img/logo-listra.png";
import logoUnpar from "../../img/Logo-UNPAR.png";
import { getStoredUser, logoutApi } from "../../api/auth";

export default function TopBar() {
  const navigate = useNavigate();
  const [userName, setUserName] = createSignal("Nama Pengguna");
  const [isLoggingOut, setIsLoggingOut] = createSignal(false);

  onMount(() => {
    const user = getStoredUser();
    if (user?.nama) {
      setUserName(user.nama);
    }
  });

  const handleLogout = async () => {
    if (isLoggingOut()) return;
    setIsLoggingOut(true);
    try {
      await logoutApi();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsLoggingOut(false);
      navigate("/loginInternal", { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-20 flex min-h-[54px] items-center gap-3 border-b border-[#f0dedf] bg-white px-4">
      <img src={logoListra} alt="Logo Listra" className="h-8 w-auto" />
      <img src={logoUnpar} alt="Logo UNPAR" className="h-8 w-auto" />
      <span className="font-serif text-lg text-[#39000a]">LISTRA · Panel Internal</span>

      <span className="flex-1" />

      {/* Menampilkan nama pengguna yang sedang aktif */}
      <span className="hidden text-sm font-medium text-stone-800 sm:inline">
        {userName()}
      </span>

      {/* Tombol Keluar / Logout */}
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut()}
        className="rounded border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 hover:text-stone-900 active:scale-95 disabled:opacity-50"
      >
        {isLoggingOut() ? "Keluar..." : "Keluar"}
      </button>
    </header>
  );
}