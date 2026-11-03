import { A, useParams } from "@solidjs/router";
import { createResource, Match, Switch } from "solid-js";
import { faArrowLeft, faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import Icon from "../components/Icon";
import { getBerita } from "../api/berita";
import { formatTanggal, jenisBerita } from "../utils/berita";

// Gaya untuk HTML dari TinyMCE. [&_p]:mb-4 = semua <p> di dalam div ini diberi margin bawah, dst.
const GAYA_KONTEN = [
  "text-[17px] leading-relaxed text-[#302929]",
  "[&_p]:mb-4",
  "[&_h1]:mb-3 [&_h1]:mt-8 [&_h1]:font-serif [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-[#39000a]",
  "[&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#39000a]",
  "[&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-semibold",
  "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6",
  "[&_a]:text-[#54141d] [&_a]:underline [&_a]:underline-offset-4",
  "[&_blockquote]:my-6 [&_blockquote]:border-l-2 [&_blockquote]:border-[#d4af37] [&_blockquote]:pl-4 [&_blockquote]:italic",
  "[&_img]:my-6 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg",
  "[&_table]:my-6 [&_table]:w-full [&_td]:border [&_td]:border-[#f0d9d8] [&_td]:p-2",
].join(" ");

export default function BeritaDetail() {
  const params = useParams();
  const [berita] = createResource(() => params.id, (id) => getBerita(id));

  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-10">
      <A
        href="/berita"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#54141d] hover:underline"
      >
        <Icon icon={faArrowLeft} class="text-xs" /> Kembali ke Berita
      </A>

      <Switch>
        <Match when={berita.loading}>
          <p className="py-16 text-center text-sm text-[#685856]">Memuat berita...</p>
        </Match>

        <Match when={berita.error}>
          <p className="py-16 text-center text-sm text-[#685856]">{berita.error.message}</p>
        </Match>

        <Match when={berita()}>
          <header className="mt-8">
            <time datetime={berita().tanggal} className="text-sm text-[#685856]">
              {formatTanggal(berita().tanggal)}
            </time>
            <h1 className="mt-2 font-serif text-3xl font-bold leading-tight text-[#39000a] sm:text-4xl">
              {berita().judul}
            </h1>
          </header>

          <img
            src={berita().url_gambar}
            alt=""
            className="mt-8 aspect-[16/9] w-full rounded-xl object-cover"
          />

          <Switch>
            <Match when={jenisBerita(berita()) === "tautan"}>
              <a
                href={berita().url_artikel}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 font-semibold text-[#54141d] underline underline-offset-4"
              >
                Baca selengkapnya di {berita().sumber}
                <Icon icon={faArrowUpRightFromSquare} class="text-xs" />
              </a>
            </Match>
            <Match when={jenisBerita(berita()) === "artikel"}>
              {/* konten sudah dibersihkan backend (sanitize-html) sebelum disimpan */}
              <div className={`mt-8 ${GAYA_KONTEN}`} innerHTML={berita().konten} />
            </Match>
          </Switch>
        </Match>
      </Switch>
    </article>
  );
}
