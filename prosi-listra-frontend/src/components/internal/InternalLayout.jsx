import { createEffect, createSignal, Match, onCleanup, onMount, Switch } from "solid-js";
import { Navigate, useLocation, useNavigate } from "@solidjs/router";
import TopBar from "./TopBar";
import { LOGIN_BELUM_LOGIN, sudahLogin } from "../../utils/sesiLogin";
import SideNav from "./SideNav";

function clearSession() {
  localStorage.removeItem("listra_token");
  localStorage.removeItem("listra_user");
}

export default function InternalLayout(props) {
  const navigate = useNavigate();
  const location = useLocation();

  // belum login / sesi kedaluwarsa: ke halaman login. Tanpa token, backend menganggap
  // pengguna sebagai pengunjung (mis. form testimoni minta verifikasi "bukan robot").
  // sudahLogin() juga membersihkan sesi yang kedaluwarsa.
  const [authStatus, setAuthStatus] = createSignal(sudahLogin() ? "checking" : "unauthenticated");

  onMount(() => {
    if (!sudahLogin()) {
      setAuthStatus("unauthenticated");
      return;
    }
    const token = localStorage.getItem("listra_token");

    const controller = new AbortController();
    onCleanup(() => controller.abort());

    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("UNAUTHORIZED");
        const data = await res.json().catch(() => null);
        if (!data || data.is_aktif === false) throw new Error("INACTIVE");
        setAuthStatus("authenticated");
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        clearSession();
        setAuthStatus("unauthenticated");
        navigate(LOGIN_BELUM_LOGIN, { replace: true });
      });
  });

  // Pastikan navigasi antar halaman internal langsung ditolak bila token dihapus manual / kedaluwarsa
  createEffect(() => {
    void location.pathname;
    if (!sudahLogin()) setAuthStatus("unauthenticated");
  });

  return (
    <Switch>
      <Match when={authStatus() === "unauthenticated"}>
        <Navigate href={LOGIN_BELUM_LOGIN} />
      </Match>
      <Match when={authStatus() === "checking"}>
        <div className="min-h-screen bg-[#f5efeb]" aria-busy="true" />
      </Match>
      <Match when={authStatus() === "authenticated"}>
        <div className="flex min-h-screen flex-col bg-[#f5efeb]">
          <TopBar />
          {/* HP: hanya isi halaman (menu ada di tombol menu TopBar). md: sidebar 232px di kiri, halaman di kanan. */}
          <div className="grid flex-1 grid-cols-1 md:grid-cols-[232px_1fr] md:grid-rows-1">
            {/* hidden md:block = sidebar baru tampil mulai md (768px);
                pembungkus marun membuat warna sidebar sampai ke bawah layar */}
            <div className="hidden bg-[#39000a] md:block">
              <SideNav />
            </div>
            {/* min-w-0 = stops wide content (tables) from pushing the layout wider */}
            <main className="min-w-0 p-6">{props.children}</main>
          </div>
        </div>
      </Match>
    </Switch>
  );
}
