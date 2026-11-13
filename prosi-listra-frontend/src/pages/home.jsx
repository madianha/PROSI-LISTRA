import { A } from "@solidjs/router";
import { createResource, For, Match, Show, Switch } from "solid-js";
import CustomHeader from "../components/CustomHeader";
import CatalogueCard from "../components/CatalogueCard";
import BeritaCard from "../components/BeritaCard";
import TestimoniCard from "../components/TestimoniCard";
import CustomButton from "../components/CustomButton";
import Footer from "../components/Footer";
import { listBerita } from "../api/berita";
import { testimoni } from "../data/testimoni";
import { listJasa } from "../api/jasa";

const services = () => listJasa();

function SectionHeading(props) {
  return <div className="text-center"><p className="font-serif text-[11px] font-bold tracking-[.16em] text-[#967510]">{props.eyebrow}</p><h2 className="mt-2 font-serif text-3xl font-bold text-[#54141d]">{props.title}</h2>{props.description && <p className="mt-2 text-sm text-[#927f7d]">{props.description}</p>}</div>;
}

export default function Home() {
  const [jasa] = createResource(services);
  // 3 berita publik terbaru dari backend (sudah urut tanggal terbaru)
  const [berita] = createResource(() => listBerita());

  return <main className="home-page bg-white text-[#342426]">
    <CustomHeader category="Lingkung Seni Tradisional UNPAR" pageName="Tari dan Musik Tradisional untuk Acara Anda" colorText="text-[#ffe088]">
      <p className="mx-auto max-w-xl text-sm sm:text-sm">LISTRA UNPAR menghadirkan tari dan musik Nusantara untuk acara kampus, korporat, dan perayaan keluarga.</p>
      <div className="mt-4 flex justify-center gap-3"><CustomButton href="/jasa" class="rounded-lg bg-[#dfb83b] px-4 py-2 text-xs font-bold text-[#4c151c]">Lihat Jasa</CustomButton><CustomButton href="/jadwal" class="rounded-lg border border-white/30 px-4 py-2 text-xs font-bold text-white">Jadwal Acara</CustomButton></div>
    </CustomHeader>

    <section className="bg-[#fff8f7] px-6 py-6 text-[#342426] sm:px-10"><div className="mx-auto grid max-w-[1110px] items-center gap-7 md:grid-cols-[1.5fr_1fr]"><div><h2 className="font-serif text-2xl font-bold text-[#54141d]">Lebih dari Sekadar Tarian</h2><p className="mt-2 max-w-xl text-sm leading-5 text-[#927f7d]">LISTRA UNPAR mendedikasikan diri lebih dari satu dekade untuk melestarikan seni Nusantara di lingkungan kampus dan masyarakat.</p><div className="mt-3 flex gap-7"><div><p className="font-serif text-xl font-bold">15+</p><p className="font-serif text-[10px] font-bold tracking-wide text-[#967510]">TAHUN DEDIKASI</p></div><div><p className="font-serif text-xl font-bold">10</p><p className="font-serif text-[10px] font-bold tracking-wide text-[#967510]">ANGGOTA AKTIF</p></div></div></div><Show when={jasa()?.[0]?.link_image}><img className="h-48 w-full object-cover md:h-[210px]" src={jasa()[0].link_image} alt="Penampilan seni tradisional LISTRA" /></Show></div></section>

    <section id="katalog" className="px-5 py-6 sm:px-8 sm:py-7"><SectionHeading eyebrow="KATALOG" title="Jasa Pilihan" description="Satu rentang harga per jasa; rinciannya dibahas lewat WhatsApp." /><Show when={jasa.loading}><p className="mt-4 text-center text-sm text-[#685856]">Memuat katalog jasa...</p></Show><Show when={jasa.error}><p className="mt-4 text-center text-sm text-[#685856]">Katalog jasa belum bisa dimuat.</p></Show><div className="mx-auto mt-4 grid max-w-[1110px] gap-4 md:grid-cols-3"><For each={jasa()?.slice(0, 3) || []}>{(service) => <CatalogueCard {...service} />}</For></div><div className="mt-4 text-center"><CustomButton href="/jasa" class="rounded-lg border border-[#e6cfcf] px-4 py-2 text-xs font-semibold text-[#54141d]">Lihat Semua Jasa</CustomButton></div></section>

    <section className="bg-[#fff8f7] px-5 py-6 sm:px-8"><SectionHeading eyebrow="APA KATA MEREKA" title="Testimoni" /><div className="mx-auto mt-4 grid max-w-[1110px] gap-3 md:grid-cols-3">{testimoni.filter((row) => row.is_aktif).slice(0, 3).map((row) => <TestimoniCard key={row.id_testimoni} {...row} />)}</div><div className="mt-4 text-center"><CustomButton href="/testimoni" class="rounded-lg border border-[#e6cfcf] bg-white px-4 py-2 text-xs font-semibold text-[#54141d]">Semua Testimoni</CustomButton></div></section>

    <section className="px-5 py-6 sm:px-8 sm:py-7"><SectionHeading eyebrow="KABAR" title="Berita Terbaru" />
      {/* Switch = hanya satu keadaan yang tampil; error dicek dulu karena membaca berita() yang gagal akan melempar error */}
      <Switch>
        <Match when={berita.loading}><p className="mt-4 text-center text-sm text-[#685856]">Memuat berita...</p></Match>
        <Match when={berita.error}><p className="mt-4 text-center text-sm text-[#685856]">Berita belum bisa dimuat.</p></Match>
        <Match when={berita()?.length === 0}><p className="mt-4 text-center text-sm text-[#685856]">Belum ada berita.</p></Match>
        <Match when={berita()}>
          <div className="mx-auto mt-4 grid max-w-[1110px] gap-4 md:grid-cols-3"><For each={berita().slice(0, 3)}>{(item) => <BeritaCard berita={item} />}</For></div>
        </Match>
      </Switch>
      <div className="mt-4 text-center"><CustomButton href="/berita" class="rounded-lg border border-[#e6cfcf] px-4 py-2 text-xs font-semibold text-[#54141d]">Semua Berita</CustomButton></div></section>

    <A href="/jadwal" aria-label="Hubungi LISTRA" className="fixed bottom-5 right-5 z-20 rounded-full bg-[#dfb83b] px-4 py-3 text-xs font-bold text-[#3d1017] shadow-lg hover:bg-[#edca5d]">☏ &nbsp; Hubungi Kami</A>
    <Footer />
  </main>;
}
