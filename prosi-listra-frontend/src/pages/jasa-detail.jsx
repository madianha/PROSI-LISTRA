import { A, useParams } from "@solidjs/router";
import { createResource, Show } from "solid-js";

const formatRupiah = (amount) => `Rp ${Number(amount).toLocaleString("id-ID")}`;

async function fetchJasa(id) {
  const response = await fetch(`/api/jasa/${id}`);
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || "Detail jasa tidak dapat dimuat.");
  return body;
}

async function fetchKontak() {
  const response = await fetch("/api/kontak");
  if (!response.ok) throw new Error("Kontak tidak tersedia.");
  return response.json();
}

export default function JasaDetail() {
  const params = useParams();
  const [jasa] = createResource(() => params.id, fetchJasa);
  const [kontak] = createResource(fetchKontak);

  const whatsappHref = () => {
    const item = jasa();
    const contact = kontak();
    if (!item || !contact?.nomor_wa) return "https://wa.me/";
    const nomor = String(contact.nomor_wa).replace(/\D/g, "");
    const template = contact.template_pesan || "Halo Humas LISTRA, saya tertarik dengan {jasa}. Boleh minta informasi lebih lanjut?";
    return `https://wa.me/${nomor}?text=${encodeURIComponent(template.replace("{jasa}", item.nama))}`;
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
              <Show when={item().link_media}>
                <a href={item().link_media} target="_blank" rel="noreferrer" aria-label={`Putar video ${item().nama}`} className="absolute inset-0 flex items-center justify-center bg-black/10 transition hover:bg-black/25">
                  <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-black/45 pl-1 text-4xl text-white">▶</span>
                </a>
              </Show>
            </div>

            <article className="flex flex-col rounded-[18px] border border-[#f1dddd] bg-white p-4 shadow-[0_6px_18px_rgba(65,20,29,0.07)] sm:p-5">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full border border-[#f5d5d6] bg-[#fff0f1] px-3 py-1 font-medium text-[#54141d]">Kategori: {item().tipe_jasa?.charAt(0).toUpperCase() + item().tipe_jasa?.slice(1).toLowerCase()}</span>
                <span className="text-[#9b8885]">{item().kultur || "Nusantara"}</span>
              </div>

              <Show when={item().nama_kecocokan}>
                <p className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-[#9b8885]">Cocok untuk</span>
                  <span className="rounded-full border border-[#e6cfcf] bg-[#fffafa] px-3 py-1 text-[#6d5554]">{item().nama_kecocokan}</span>
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
