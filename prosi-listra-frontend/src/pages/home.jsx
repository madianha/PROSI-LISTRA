import { A } from "@solidjs/router";
import CustomHeader from "../components/CustomHeader";
import CatalogueCard from "../components/CatalogueCard";
import BeritaCard from "../components/BeritaCard";
import TestimoniCard from "../components/TestimoniCard";
import CustomButton from "../components/CustomButton";
import Footer from "../components/Footer";

const services = [
  { title: "Tari Merak", type: "Tari", region: "Jawa Barat", tag: "Opening", price: "Rp 2.500.000 – Rp 5.000.000", image: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?auto=format&fit=crop&w=900&q=85", description: "Tarian Sunda yang menggambarkan keindahan burung merak jantan saat memikat pasangannya." },
  { title: "Tari Jaipong", type: "Tari", region: "Jawa Barat", tag: "Middle", price: "Rp 3.000.000 – Rp 6.000.000", image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=900&q=85", description: "Tarian pergaulan khas Jawa Barat dengan gerakan dinamis dan energik." },
  { title: "Tari Saman", type: "Tari", region: "Aceh", tag: "Opening", price: "Rp 4.000.000 – Rp 7.500.000", image: "https://images.unsplash.com/photo-1524368730574-8b5c7e9e8f43?auto=format&fit=crop&w=900&q=85", description: "Tarian Aceh dengan formasi duduk berbaris dan tepukan tangan yang serempak." },
];

const news = [
  { date: "20 Sep 2026", category: "MEDIA DARING (CONTOH)", title: "(Contoh) Penampilan LISTRA di Festival Budaya Kota Bandung", href: "/berita" },
  { date: "27 Agu 2026", category: "UNPAR.AC.ID", title: "LISTRA UNPAR Harumkan Nama Indonesia Lewat Lomba Internasional di Hong Kong", href: "/berita" },
  { date: "23 Okt 2024", category: "UNPAR.AC.ID", title: "LISTRA UNPAR Kembali Ukir Prestasi Lewat Misi Budaya di Korea Selatan", href: "/berita" },
];

function SectionHeading(props) {
  return <div className="text-center"><p className="font-serif text-[11px] font-bold tracking-[.16em] text-[#967510]">{props.eyebrow}</p><h2 className="mt-2 font-serif text-3xl font-bold text-[#54141d]">{props.title}</h2>{props.description && <p className="mt-2 text-sm text-[#927f7d]">{props.description}</p>}</div>;
}

export default function Home() {
  return <main className="home-page bg-white text-[#342426]">
    <CustomHeader category="Lingkung Seni Tradisional UNPAR" pageName="Tari dan Musik Tradisional untuk Acara Anda" colorText="text-[#ffe088]">
      <p className="mx-auto max-w-xl text-sm sm:text-sm">LISTRA UNPAR menghadirkan tari dan musik Nusantara untuk acara kampus, korporat, dan perayaan keluarga.</p>
      <div className="mt-4 flex justify-center gap-3"><CustomButton href="/jasa" class="rounded-lg bg-[#dfb83b] px-4 py-2 text-xs font-bold text-[#4c151c]">Lihat Jasa</CustomButton><CustomButton href="/jadwal" class="rounded-lg border border-white/30 px-4 py-2 text-xs font-bold text-white">Jadwal Acara</CustomButton></div>
    </CustomHeader>

    <section className="bg-[#fff8f7] px-6 py-6 text-[#342426] sm:px-10"><div className="mx-auto grid max-w-[1110px] items-center gap-7 md:grid-cols-[1.5fr_1fr]"><div><h2 className="font-serif text-2xl font-bold text-[#54141d]">Lebih dari Sekadar Tarian</h2><p className="mt-2 max-w-xl text-sm leading-5 text-[#927f7d]">LISTRA UNPAR mendedikasikan diri lebih dari satu dekade untuk melestarikan seni Nusantara di lingkungan kampus dan masyarakat.</p><div className="mt-3 flex gap-7"><div><p className="font-serif text-xl font-bold">15+</p><p className="font-serif text-[10px] font-bold tracking-wide text-[#967510]">TAHUN DEDIKASI</p></div><div><p className="font-serif text-xl font-bold">10</p><p className="font-serif text-[10px] font-bold tracking-wide text-[#967510]">ANGGOTA AKTIF</p></div></div></div><img className="h-48 w-full object-cover md:h-[210px]" src={services[0].image} alt="Penari tradisional tampil di atas panggung" /></div></section>

    <section id="katalog" className="px-5 py-6 sm:px-8 sm:py-7"><SectionHeading eyebrow="KATALOG" title="Jasa Pilihan" description="Satu rentang harga per jasa; rinciannya dibahas lewat WhatsApp." /><div className="mx-auto mt-4 grid max-w-[1110px] gap-4 md:grid-cols-3">{services.map((service) => <CatalogueCard {...service} detailHref="/jasa" />)}</div><div className="mt-4 text-center"><CustomButton href="/jasa" class="rounded-lg border border-[#e6cfcf] px-4 py-2 text-xs font-semibold text-[#54141d]">Lihat Semua Jasa</CustomButton></div></section>

    <section className="bg-[#fff8f7] px-5 py-6 sm:px-8"><SectionHeading eyebrow="APA KATA MEREKA" title="Testimoni" /><div className="mx-auto mt-4 grid max-w-[1110px] gap-3 md:grid-cols-3"><TestimoniCard review="Penampilan LISTRA sangat memukau dan tepat waktu. Koordinasi dengan panitia berjalan lancar." name="Prof. Dr. Handoko Wijaya" organization="Rektorat UNPAR" event="Acara: Opening Ceremony Dies Natalis ke-71" /><TestimoniCard review="Tamu undangan sangat terkesan. Kostumnya rapi dan penarinya profesional." name="Ibu Ratna Sari" organization="PT Nusantara Jaya" event="Acara: Gala Dinner Perusahaan" /><TestimoniCard review="Terima kasih LISTRA, Tari Topeng-nya jadi momen paling berkesan di resepsi kami." name="Dinda Permatasari" organization="" event="Acara: Acara privat" /></div><div className="mt-4 text-center"><CustomButton href="/testimoni" class="rounded-lg border border-[#e6cfcf] bg-white px-4 py-2 text-xs font-semibold text-[#54141d]">Semua Testimoni</CustomButton></div></section>

    <section className="px-5 py-6 sm:px-8 sm:py-7"><SectionHeading eyebrow="KABAR" title="Berita Terbaru" /><div className="mx-auto mt-4 grid max-w-[1110px] gap-4 md:grid-cols-3">{news.map((item) => <BeritaCard {...item} />)}</div><div className="mt-4 text-center"><CustomButton href="/berita" class="rounded-lg border border-[#e6cfcf] px-4 py-2 text-xs font-semibold text-[#54141d]">Semua Berita</CustomButton></div></section>

    <A href="/jadwal" aria-label="Hubungi LISTRA" className="fixed bottom-5 right-5 z-20 rounded-full bg-[#dfb83b] px-4 py-3 text-xs font-bold text-[#3d1017] shadow-lg hover:bg-[#edca5d]">☏ &nbsp; Hubungi Kami</A>
    <Footer />
  </main>;
}
