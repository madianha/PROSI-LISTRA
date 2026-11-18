import { A, useParams } from "@solidjs/router";
import { createResource, Show } from "solid-js";
import { getJasa } from "../api/jasa";
import { getKontak, linkWhatsApp } from "../api/kontak";
import VideoJasa from "../components/VideoJasa";

const formatRupiah = (amount) => `Rp ${Number(amount).toLocaleString("id-ID")}`;

export default function JasaDetail() {
  const params = useParams();
  const [jasa] = createResource(() => params.id, getJasa);
  const [kontak] = createResource(getKontak);

  // pesan WhatsApp berisi nama jasa ini; error dicek dulu karena membaca resource yang gagal melempar error
  const whatsappHref = () => {
    if (jasa.error || kontak.error || !jasa()) return "https://wa.me/";
    return linkWhatsApp(kontak(), jasa().nama) ?? "https://wa.me/";
  };

  return (
    <main className="bg-[#fffafa] px-5 py-8 sm:px-[7%] sm:py-7">
      <A href="/jasa" className="text-sm text-[#9b8885] transition hover:text-[#54141d]">‹ Kembali ke jasa</A>

      <Show when={jasa.loading}>
        <p className="py-16 text-center text-[#7d6966]">Memuat detail jasa...</p>
      </Show>
      <Show when={jasa.error}>
        <div className="mx-auto my-12 max-w-xl rounded-xl border border-[#f0d9d8] bg-white p-6 text-center text-[#7d6966]">
          <p>{jasa.error.message}</p>
          <A href="/jasa" className="mt-4 inline-block font-semibold text-[#54141d]">Kembali ke katalog jasa</A>
        </div>
      </Show>

      <Show when={jasa()}>
        {(item) => (
          <section className="mx-auto mt-4 grid max-w-[1110px] items-stretch gap-5 lg:grid-cols-[1.55fr_1fr]">
            <div className="relative min-h-[300px] overflow-hidden bg-[#26080d] sm:min-h-[420px]">
              <Show when={item().link_image} fallback={<div className="flex h-full min-h-[300px] items-center justify-center font-serif text-2xl text-white/70">LISTRA</div>}>
                <img src={item().link_image} alt={item().nama} className="absolute inset-0 h-full w-full object-cover" />
              </Show>
              {/* video diputar di tempat foto, tidak membuka tab baru */}
              <Show when={item().link_media}>
                <VideoJasa url={item().link_media} judul={item().nama} />
              </Show>
            </div>

            <article className="flex flex-col rounded-[18px] border border-[#f1dddd] bg-white p-4 shadow-[0_6px_18px_rgba(65,20,29,0.07)] sm:p-5">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full border border-[#f5d5d6] bg-[#fff0f1] px-3 py-1 font-medium text-[#54141d]">Kategori: {item().tipe_jasa?.charAt(0).toUpperCase() + item().tipe_jasa?.slice(1).toLowerCase()}</span>
                <span className="text-[#9b8885]">{item().nama_provinsi || "Nusantara"}</span>
              </div>

              <Show when={item().kecocokan?.length > 0}>
                <p className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-[#9b8885]">Cocok untuk</span>
                  <span className="rounded-full border border-[#e6cfcf] bg-[#fffafa] px-3 py-1 text-[#6d5554]">{item().kecocokan.join(", ")}</span>
                </p>
              </Show>

              <h1 className="mt-4 font-serif text-2xl font-bold leading-tight text-[#54141d] sm:text-3xl">{item().nama}</h1>
              <p className="mt-3 border-b border-[#f1dddd] pb-3 text-sm leading-6 text-[#9b8885]">{item().deskripsi || ""}</p>

              <div className="mt-3 rounded-lg border border-[#f5e0e1] bg-[#fff0f1] px-3 py-3">
                <p className="font-serif text-lg font-bold leading-relaxed text-[#54141d] sm:text-xl">
                  {formatRupiah(item().harga_minimum)} – {formatRupiah(item().harga_maximum)} <span className="font-sans text-sm font-normal text-[#9b8885]">/ penampilan</span>
                </p>
              </div>

              <div className="mt-3 border-l-2 border-[#dfb83b] pl-3 text-sm leading-5 text-[#6d5554]">
                Tari bisa diiringi live music, dan pemain musik juga bisa dipesan tanpa tari. Rincian dibahas lewat WhatsApp.
              </div>
              <a href={whatsappHref()} target="_blank" rel="noreferrer" className="mt-3 flex min-h-10 items-center justify-center rounded-lg bg-[#dfb83b] px-4 text-sm font-semibold text-[#3d1017] shadow-md transition hover:bg-[#edca5d]">Pesan via WhatsApp</a>
              <p className="mt-3 text-sm leading-5 text-[#9b8885]">Harga, live / non-live music, dan jumlah penampil dibahas langsung dengan Humas.</p>
            </article>
          </section>
        )}
      </Show>
    </main>
  );
}
