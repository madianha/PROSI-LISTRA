import { Match, Show, Switch } from "solid-js";
import { faImage, faPlay } from "@fortawesome/free-solid-svg-icons";
import GambarSampul from "./GambarSampul";
import Icon from "./Icon";

export const formatRupiah = (angka) => `Rp ${Number(angka).toLocaleString("id-ID")}`;

/**
 * "Rp 3.000.000 – Rp 6.000.000"; satu sisi saja bila sisi lainnya kosong.
 * whitespace-nowrap = satu angka tidak terpotong ke baris berikutnya; pindah baris hanya di tanda "–".
 */
export function RentangHarga(props) {
  return (
    <Switch fallback="Hubungi untuk harga">
      <Match when={props.min != null && props.max != null}>
        <span className="whitespace-nowrap">{formatRupiah(props.min)}</span> –{" "}
        <span className="whitespace-nowrap">{formatRupiah(props.max)}</span>
      </Match>
      <Match when={props.min != null}>
        <span className="whitespace-nowrap">{formatRupiah(props.min)}</span>
      </Match>
      <Match when={props.max != null}>
        <span className="whitespace-nowrap">{formatRupiah(props.max)}</span>
      </Match>
    </Switch>
  );
}

/** "tari" -> "Tari" */
export const namaTipeJasa = (tipe) => (tipe ? tipe.charAt(0).toUpperCase() + tipe.slice(1).toLowerCase() : "Jasa");

/**
 * Kartu jasa di Beranda dan halaman Jasa. props = satu baris dari /api/jasa.
 * props.prioritas = (opsional) foto dimuat langsung, untuk kartu yang terlihat tanpa scroll
 */
export default function CatalogueCard(props) {
  const detailHref = () => props.detailHref || `/jasa/${props.id_jasa ?? ""}`;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-[#f0dedf] bg-white">
      {/* Foto = tautan ke detail jasa; video hanya diputar di halaman detail (/jasa/:id).
          tabIndex -1 + aria-hidden: pengguna keyboard & pembaca layar memakai tombol "Lihat Detail" di bawah.
          aspect-[16/10] = tinggi foto selalu proporsional dengan lebarnya */}
      <a
        href={detailHref()}
        tabIndex={-1}
        aria-hidden="true"
        className="relative block aspect-[16/10] overflow-hidden bg-[#ece4df]"
      >
        <Show
          when={props.link_image}
          fallback={
            <span className="flex h-full items-center justify-center text-2xl text-[#948280]">
              <Icon icon={faImage} />
            </span>
          }
        >
          <GambarSampul src={props.link_image} loading={props.prioritas ? "eager" : "lazy"} class="h-full w-full object-cover" />
        </Show>
        {/* penanda: jasa ini punya video (bukan tombol putar) */}
        <Show when={props.link_media}>
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-md bg-black/70 px-2 py-1 text-xs font-semibold text-white">
            <Icon icon={faPlay} class="text-[10px]" /> Video
          </span>
        </Show>
      </a>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm text-[#685856]">
          {namaTipeJasa(props.tipe_jasa)} <span aria-hidden="true">·</span> <span>{props.nama_provinsi || "Nusantara"}</span>
        </p>
        <h3 className="mt-1 font-serif text-xl font-bold leading-snug text-[#39000a]">{props.nama}</h3>
        <Show when={props.deskripsi}>
          {/* line-clamp-3 = deskripsi panjang dipotong di baris ke-3, kartu tetap sejajar */}
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#4f4140]">{props.deskripsi}</p>
        </Show>
        <Show when={props.kecocokan?.length > 0}>
          <p className="mt-3 text-sm text-[#685856]">
            Cocok untuk: <span className="text-[#302929]">{props.kecocokan.join(", ")}</span>
          </p>
        </Show>

        {/* mt-auto = harga dan tombol selalu menempel di bawah kartu */}
        <div className="mt-auto pt-5">
          <div className="border-t border-[#f0dedf] pt-4">
            <p className="font-serif text-lg font-bold text-[#39000a]">
              <RentangHarga min={props.harga_minimum} max={props.harga_maximum} />
            </p>
            <p className="text-sm text-[#685856]">per penampilan</p>
            <Show when={props.min_performer != null}>
              <p className="text-sm text-[#685856]">Minimal {props.min_performer} penampil</p>
            </Show>
            {/* durasi disimpan dalam menit (dikonfirmasi pengurus LISTRA) */}
            <Show when={props.durasi != null}>
              <p className="text-sm text-[#685856]">Durasi {props.durasi} menit</p>
            </Show>
          </div>
          <a
            href={detailHref()}
            // label untuk pembaca layar: nama jasa & ada/tidaknya video
            aria-label={`Lihat Detail ${props.nama}${props.link_media ? ", ada video" : ""}`}
            className="mt-4 flex min-h-11 items-center justify-center rounded-lg border border-[#d9c3c3] px-4 text-sm font-semibold text-[#54141d] transition-colors hover:bg-[#fff0f1] active:bg-[#f9e3e4]"
          >
            Lihat Detail
          </a>
        </div>
      </div>
    </article>
  );
}
