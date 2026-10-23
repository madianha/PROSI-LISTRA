import { A } from "@solidjs/router";
import { Show } from "solid-js";
import { faArrowRight, faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import Icon from "./Icon";
import { formatTanggal, jenisBerita } from "../utils/berita";

/** Isi kartu, dipakai oleh versi tautan (<a>) maupun artikel (<A>). */
function IsiKartu(props) {
  const tautan = () => jenisBerita(props.berita) === "tautan";

  return (
    <>
      {/* aspect-[16/10] = tinggi gambar selalu proporsional dengan lebarnya */}
      <div className="aspect-[16/10] overflow-hidden bg-[#ece4df]">
        <img
          src={props.berita.url_gambar}
          alt=""
          loading="lazy"
          // group-hover = gambar sedikit membesar saat kartu di-hover
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs text-[#685856]">
          <time datetime={props.berita.tanggal}>{formatTanggal(props.berita.tanggal)}</time>
          <Show when={tautan()}>
            <span aria-hidden="true">·</span>
            <span className="font-semibold uppercase tracking-[0.12em] text-[#8a6500]">
              {props.berita.sumber}
            </span>
          </Show>
        </div>

        {/* line-clamp-3 = judul panjang dipotong di baris ke-3 */}
        <h2 className="mt-2 line-clamp-3 font-serif text-lg font-bold leading-snug text-[#302929]">
          {props.berita.judul}
        </h2>

        {/* mt-auto = baris ini selalu menempel di bawah kartu */}
        <span className="mt-auto flex items-center gap-2 pt-4 text-sm font-semibold text-[#54141d]">
          <Show
            when={tautan()}
            fallback={
              <>
                Baca artikel <Icon icon={faArrowRight} class="text-xs" />
              </>
            }
          >
            Buka di {props.berita.sumber} <Icon icon={faArrowUpRightFromSquare} class="text-xs" />
          </Show>
        </span>
      </div>
    </>
  );
}

export default function BeritaCard(props) {
  const kelas =
    "group flex h-full flex-col overflow-hidden rounded-xl border border-[#f0d9d8] bg-white transition-shadow hover:shadow-[0_8px_24px_rgba(84,20,29,0.08)]";

  return (
    <Show
      when={jenisBerita(props.berita) === "tautan"}
      fallback={
        <A href={`/berita/${props.berita.id_berita}`} className={kelas}>
          <IsiKartu berita={props.berita} />
        </A>
      }
    >
      <a href={props.berita.url_artikel} target="_blank" rel="noopener noreferrer" className={kelas}>
        <IsiKartu berita={props.berita} />
      </a>
    </Show>
  );
}
