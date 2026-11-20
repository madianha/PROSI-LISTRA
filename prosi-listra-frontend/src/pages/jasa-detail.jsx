import { A, useParams } from "@solidjs/router";
import { createResource, Match, Show, Switch } from "solid-js";
import { faArrowLeft, faCommentDots, faImage } from "@fortawesome/free-solid-svg-icons";
import { getJasa } from "../api/jasa";
import { getKontak, linkWhatsApp } from "../api/kontak";
import { namaTipeJasa, RentangHarga } from "../components/CatalogueCard";
import GambarSampul from "../components/GambarSampul";
import Icon from "../components/Icon";
import VideoJasa from "../components/VideoJasa";
import { useJudulHalaman } from "../utils/judulHalaman";

/** Satu baris keterangan jasa: label di kiri, isi di kanan. */
function Baris(props) {
  return (
    <div className="flex justify-between gap-4 py-3">
      <dt className="text-[#685856]">{props.label}</dt>
      <dd className="text-right font-semibold text-[#302929]">{props.children}</dd>
    </div>
  );
}

export default function JasaDetail() {
  const params = useParams();
  const [jasa] = createResource(() => params.id, getJasa);
  const [kontak] = createResource(getKontak);
  // judul tab = nama jasa; jasa() melempar error bila gagal dimuat, jadi hanya dibaca saat sudah siap.
  // Jasa tidak ada / gagal dimuat: judul umum, bukan judul situs saja
  useJudulHalaman(() => (jasa.state === "ready" ? jasa().nama : jasa.error ? "Detail Jasa" : ""));

  // link WhatsApp berisi nama jasa ini; null = nomor belum diisi atau kontak gagal dimuat
  const linkPesan = () =>
    jasa.state === "ready" && kontak.state === "ready" ? linkWhatsApp(kontak(), jasa().nama) : null;

  return (
    // jarak tepi di luar, lebar maksimal di dalam: tepi kiri sejajar dengan menu dan footer
    <div className="px-5 py-6 sm:px-8 sm:py-8">
    <div className="mx-auto w-full max-w-[1110px]">
      <A href="/jasa" class="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#54141d] hover:underline">
        <Icon icon={faArrowLeft} class="text-xs" /> Kembali ke Jasa
      </A>

      <Show when={jasa.loading}>
        <p className="py-16 text-center text-sm text-[#685856]">Memuat detail jasa...</p>
      </Show>
      <Show when={jasa.error}>
        <div className="mx-auto my-12 max-w-xl rounded-xl border border-[#f0dedf] bg-white p-6 text-center">
          <p className="text-sm text-[#685856]">{jasa.error.message}</p>
          <A href="/jasa" class="mt-3 inline-flex min-h-11 items-center font-semibold text-[#54141d] underline underline-offset-4">
            Lihat semua jasa
          </A>
        </div>
      </Show>

      <Show when={jasa.state === "ready" && jasa()}>
        {(item) => (
          // lg:grid-cols-[1.35fr_1fr] = di layar lebar foto/video sedikit lebih lebar dari keterangan
          <section className="mt-4 grid items-start gap-6 lg:grid-cols-[1.35fr_1fr] lg:gap-8">
            {/* foto jasa; bila ada video, tombol putar menutupi foto dan video diputar di tempat */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#ece4df]">
              <Show
                when={item().link_image}
                fallback={
                  <span className="flex h-full items-center justify-center text-3xl text-[#948280]">
                    <Icon icon={faImage} />
                  </span>
                }
              >
                <GambarSampul src={item().link_image} alt={item().nama} fetchpriority="high" class="h-full w-full object-cover" />
              </Show>
              <Show when={item().link_media}>
                <VideoJasa url={item().link_media} judul={item().nama} />
              </Show>
            </div>

            <article className="rounded-xl border border-[#f0dedf] bg-white p-5 sm:p-6">
              <p className="text-sm text-[#685856]">
                {namaTipeJasa(item().tipe_jasa)} <span aria-hidden="true">·</span> {item().nama_provinsi || "Nusantara"}
              </p>
              <h1 className="mt-1 font-serif text-3xl font-bold leading-tight text-[#39000a]">{item().nama}</h1>
              <Show when={item().deskripsi}>
                <p className="mt-3 text-base leading-7 text-[#4f4140]">{item().deskripsi}</p>
              </Show>

              {/* dl = daftar keterangan; divide-y = garis tipis di antara baris */}
              <dl className="mt-5 divide-y divide-[#f0dedf] border-y border-[#f0dedf] text-sm">
                <Baris label="Harga per penampilan">
                  <RentangHarga min={item().harga_minimum} max={item().harga_maximum} />
                </Baris>
                <Show when={item().min_performer != null}>
                  <Baris label="Jumlah penampil">Minimal {item().min_performer} orang</Baris>
                </Show>
                {/* durasi disimpan dalam menit (dikonfirmasi pengurus LISTRA) */}
                <Show when={item().durasi != null}>
                  <Baris label="Durasi">{item().durasi} menit</Baris>
                </Show>
                <Show when={item().kecocokan?.length > 0}>
                  <Baris label="Cocok untuk">{item().kecocokan.join(", ")}</Baris>
                </Show>
              </dl>

              {/* tombol pesan hanya tampil bila nomor WhatsApp Humas ada; tidak pernah mengarah ke wa.me kosong */}
              <Switch
                fallback={
                  <p role="status" className="mt-5 rounded-lg border border-[#f0dedf] bg-[#fff8f7] px-4 py-3 text-sm text-[#685856]">
                    Kontak WhatsApp Humas belum tersedia. Silakan coba lagi nanti.
                  </p>
                }
              >
                <Match when={kontak.loading}>
                  <p className="mt-5 flex min-h-12 items-center justify-center rounded-lg bg-[#f5efeb] text-sm text-[#685856]">
                    Memuat kontak WhatsApp...
                  </p>
                </Match>
                <Match when={linkPesan()}>
                  <a
                    href={linkPesan()}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#dfb83b] px-4 text-base font-semibold text-[#3d1017] hover:bg-[#edca5d] active:bg-[#d4a92c]"
                  >
                    <Icon icon={faCommentDots} /> Pesan via WhatsApp
                    <span className="sr-only">(membuka tab baru)</span>
                  </a>
                </Match>
              </Switch>
              <p className="mt-3 text-sm leading-6 text-[#685856]">
                Harga akhir, iringan musik live, dan jumlah penampil dibahas langsung dengan Humas LISTRA.
              </p>
            </article>
          </section>
        )}
      </Show>
    </div>
    </div>
  );
}
