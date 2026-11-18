import { Navigate } from "@solidjs/router";
import { Show } from "solid-js";
import TopBar from "./TopBar";
import { LOGIN_BELUM_LOGIN, sudahLogin } from "../../utils/sesiLogin";
import SideNav from "./SideNav";

export default function InternalLayout(props) {
  // belum login / sesi kedaluwarsa: ke halaman login. Tanpa token, backend menganggap
  // pengguna sebagai pengunjung (mis. form testimoni minta verifikasi "bukan robot").
  return (
    <Show when={sudahLogin()} fallback={<Navigate href={LOGIN_BELUM_LOGIN} />}>
    <div className="flex min-h-screen flex-col bg-[#f5efeb]">
      <TopBar />
      {/* Phone: sidebar on top of the page. md: 232px sidebar on the left, page on the right. */}
      {/* grid-rows-[auto_1fr] = on phones the sidebar row is only as tall as its links */}
      <div className="grid flex-1 grid-cols-1 grid-rows-[auto_1fr] md:grid-cols-[232px_1fr] md:grid-rows-1">
        {/* the maroon wrapper makes the sidebar color reach the bottom of the screen */}
        <div className="bg-[#39000a]">
          <SideNav />
        </div>
        {/* min-w-0 = stops wide content (tables) from pushing the layout wider */}
        <main className="min-w-0 p-6">{props.children}</main>
      </div>
    </div>
    </Show>
  );
}
