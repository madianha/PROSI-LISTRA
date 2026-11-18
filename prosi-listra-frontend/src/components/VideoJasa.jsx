import { createSignal, Match, Switch } from "solid-js";
import { faArrowUpRightFromSquare, faPlay } from "@fortawesome/free-solid-svg-icons";
import Icon from "./Icon";

/**
 * Ubah link_media menjadi sumber yang bisa diputar langsung di halaman.
 * YouTube, Vimeo, Google Drive -> { jenis: "iframe", src }; file .mp4/.webm/.ogg/.mov -> { jenis: "video", src }.
 * Selain itu null (tidak bisa diputar di halaman).
 * src iframe disusun dari ID videonya saja, bukan dari URL mentah.
 */
export function sumberVideo(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.replace(/^(www|m)\./, "");

  // ID video YouTube selalu 11 karakter
  let idYoutube = null;
  if (host === "youtu.be") idYoutube = u.pathname.slice(1);
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    idYoutube = u.searchParams.get("v") ?? u.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1] ?? null;
  }
  if (idYoutube) {
    return /^[A-Za-z0-9_-]{11}$/.test(idYoutube)
      ? { jenis: "iframe", src: `https://www.youtube-nocookie.com/embed/${idYoutube}?autoplay=1&rel=0` }
      : null;
  }

  const idVimeo = host === "vimeo.com" ? u.pathname.match(/^\/(\d+)/)?.[1] : null;
  if (idVimeo) return { jenis: "iframe", src: `https://player.vimeo.com/video/${idVimeo}?autoplay=1` };

  const idDrive = host === "drive.google.com" ? u.pathname.match(/^\/file\/d\/([A-Za-z0-9_-]+)/)?.[1] : null;
  if (idDrive) return { jenis: "iframe", src: `https://drive.google.com/file/d/${idDrive}/preview` };

  if (/\.(mp4|webm|ogg|mov)$/i.test(u.pathname)) return { jenis: "video", src: u.href };
  return null;
}

function namaSitus(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "situs lain";
  }
}

/**
 * Tombol putar di atas foto jasa. Diklik = video diputar di tempat foto itu, tanpa pindah halaman.
 * Letakkan di dalam wadah yang punya kelas `relative` (foto jasa).
 * props.url    = link_media jasa
 * props.judul  = nama jasa (untuk label tombol & judul pemutar)
 * props.kecil  = (opsional) tombol lebih kecil, untuk kartu katalog
 */
export default function VideoJasa(props) {
  const [diputar, setDiputar] = createSignal(false);
  const sumber = () => sumberVideo(props.url);

  // absolute inset-0 = menutupi seluruh foto
  const PENUH = "absolute inset-0 h-full w-full";

  return (
    <Switch>
      {/* Link yang tidak bisa diputar di halaman (mis. Instagram): tautan yang jelas, bukan tombol putar palsu */}
      <Match when={!sumber()}>
        <a
          href={props.url}
          target="_blank"
          rel="noreferrer"
          // label lengkap untuk pembaca layar; teks yang terlihat cukup "Tonton video"
          aria-label={`Tonton video ${props.judul} di ${namaSitus(props.url)} (tab baru)`}
          className="absolute bottom-3 right-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-black/60 px-3 text-sm font-semibold text-white hover:bg-black/75"
        >
          <Icon icon={faArrowUpRightFromSquare} class="text-xs" />
          Tonton video
        </a>
      </Match>

      <Match when={!diputar()}>
        <button
          type="button"
          aria-label={`Putar video ${props.judul}`}
          onClick={() => setDiputar(true)}
          // bg-black/10 = foto sedikit digelapkan agar tombol terlihat
          className={`${PENUH} group flex cursor-pointer items-center justify-center bg-black/10 transition hover:bg-black/25`}
        >
          {/* lingkaran tombol; pl-1 = segitiga play tampak di tengah secara visual */}
          <span
            className={`flex items-center justify-center rounded-full bg-black/55 pl-1 text-white transition group-hover:bg-black/70 ${
              props.kecil ? "size-14 text-xl" : "size-[72px] text-2xl"
            }`}
          >
            <Icon icon={faPlay} />
          </span>
        </button>
      </Match>

      <Match when={sumber().jenis === "iframe"}>
        <iframe
          src={sumber().src}
          title={`Video ${props.judul}`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          className={`${PENUH} border-0 bg-black`}
        />
      </Match>

      <Match when={sumber().jenis === "video"}>
        {/* object-contain = video utuh, tidak terpotong */}
        <video src={sumber().src} controls autoplay playsinline className={`${PENUH} bg-black object-contain`} />
      </Match>
    </Switch>
  );
}
