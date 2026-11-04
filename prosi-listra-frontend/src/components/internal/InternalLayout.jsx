import { onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
import TopBar from "./TopBar";
import SideNav from "./SideNav";
import { isAuthenticated } from "../../api/auth";

export default function InternalLayout(props) {
  const navigate = useNavigate();

  onMount(() => {
    // Route guard: periksa token autentikasi
    if (!isAuthenticated()) {
      navigate("/loginInternal", { replace: true });
    }
  });

  return (
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
  );
}