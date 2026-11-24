import { A } from "@solidjs/router";
import { createResource, createSignal, For, Match, Show, Switch } from "solid-js";
import { faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import Icon from "../components/Icon";
import CatalogueCard from "../components/CatalogueCard";
import BeritaCard from "../components/BeritaCard";
import TestimoniCard from "../components/TestimoniCard";
import { listBerita } from "../api/berita";
import { listTestimoni } from "../api/testimoni";
import { listJasa } from "../api/jasa";
// potongan 15 detik (tanpa suara) dan dua gambar diam dari video Tari Bajidor Kahot oleh LISTRA UNPAR
import videoTari from "../video/tari-bajidor-latar.mp4";
import posterTari from "../video/tari-bajidor-latar.jpg";
import fotoTari from "../video/tari-bajidor-foto.jpg";

// tombol tautan: utama (emas) dan kedua (bergaris)
const TOMBOL_UTAMA =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-[#dfb83b] px-5 text-sm font-semibold text-[#3d1017] hover:bg-[#edca5d] active:bg-[#d4a92c]";
const TOMBOL_KEDUA =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-[#d9c3c3] bg-white px-5 text-sm font-semibold text-[#54141d] hover:bg-[#fff0f1] active:bg-[#f9e3e4]";

/** Pembuka Beranda: video penampilan LISTRA di belakang judul, dengan tombol jeda. */
function Pembuka() {
  let video;
  // pengguna yang meminta gerakan dikurangi: video tidak berputar sendiri, cukup gambar diam
  const kurangiGerak = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  // diisi oleh event play/pause video, jadi selalu sesuai keadaan sebenarnya
  const [berputar, setBerputar] = createSignal(false);
  const ubahPutar = () => {
    if (video.paused) video.play()?.catch?.(() => {});
    else video.pause();
  };

  return (
    // isolate = lapisan video & warna (-z-20, -z-10) tetap di belakang teks, tidak bocor ke luar bagian ini.
    // -mt-16 = naik 64px ke balik menu yang tembus pandang (tinggi menu di Navbar.jsx; ubah keduanya bersamaan);
    // pt-32 dan +4rem = mengganti ruang yang tertutup menu
    <section
      aria-labelledby="judul-beranda"
      className="relative isolate -mt-16 flex min-h-[calc(72svh+4rem)] items-center justify-center overflow-hidden bg-[#39000a] px-5 pb-24 pt-32 text-center sm:px-8"
    >
      {/* object-cover = video memenuhi bagian ini tanpa gepeng; aria-hidden karena hanya latar */}
      <video
        ref={video}
        src={videoTari}
        poster={posterTari}
        autoplay={!kurangiGerak}
        muted
        loop
        playsinline
        preload={kurangiGerak ? "none" : "auto"}
        aria-hidden="true"
        tabIndex={-1}
        onPlay={() => setBerputar(true)}
        onPause={() => setBerputar(false)}
        className="absolute inset-0 -z-20 h-full w-full object-cover"
      />
      {/* lapisan marun 65% di atas video: teks putih tetap terbaca di bagian video yang terang */}
      <div className="absolute inset-0 -z-10 bg-[#39000a]/65" />

      <div className="max-w-3xl">
        <h1 id="judul-beranda" className="text-balance font-serif text-4xl font-bold leading-tight text-white sm:text-5xl">
          Tari dan Musik Tradisional untuk Acara Anda
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
          LISTRA (Lingkung Seni Tradisional UNPAR) menghadirkan tari dan musik Nusantara untuk acara kampus, korporat, dan
          perayaan keluarga.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <A href="/jasa" class={TOMBOL_UTAMA}>
            Lihat Jasa
          </A>
          <A
            href="/jadwal"
            class="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/60 px-5 text-sm font-semibold text-white hover:bg-white/10 active:bg-white/20"
          >
            Jadwal Acara
          </A>
        </div>
      </div>

      <p className="absolute bottom-6 left-5 max-w-[65%] text-left text-xs text-white/85 sm:left-8">
        Tari Bajidor Kahot, penampilan LISTRA UNPAR
      </p>
      <button
        type="button"
        onClick={ubahPutar}
        aria-label={berputar() ? "Jeda video" : "Putar video"}
        className="absolute bottom-4 right-5 grid size-11 cursor-pointer place-items-center rounded-full bg-black/45 text-white hover:bg-black/65 active:bg-black/75 sm:right-8"
      >
        <Icon icon={berputar() ? faPause : faPlay} />
      </button>
    </section>
  );
}

/** Judul bagian di Beranda: judul (h2) dan keterangan opsional. */
function JudulBagian(props) {
  return (
    <div className="text-center">
      <h2 className="font-serif text-3xl font-bold text-[#39000a]">{props.judul}</h2>
      <Show when={props.keterangan}>
        <p className="mt-2 text-sm text-[#685856]">{props.keterangan}</p>
      </Show>
    </div>
  );
}

/** Pesan keadaan (memuat, kosong) di tengah bagian. */
function Pesan(props) {
  return <p className="mt-6 text-center text-sm text-[#685856]">{props.children}</p>;
}

/** Pesan gagal dimuat + tombol "Coba lagi" (props.onCobaLagi = muat ulang data bagian itu). */
function PesanGagal(props) {
  return (
    <div className="mt-6 text-center">
      <p className="text-sm text-[#685856]">{props.children}</p>
      <button
        type="button"
        onClick={() => props.onCobaLagi()}
        className="mt-1 min-h-11 cursor-pointer px-3 text-sm font-semibold text-[#54141d] underline underline-offset-4 hover:text-[#39000a]"
      >
        Coba lagi
      </button>
    </div>
  );
}

export default function Home() {
  const [jasa, { refetch: muatUlangJasa }] = createResource(() => listJasa());
  // 3 berita publik terbaru dari backend (sudah urut tanggal terbaru)
  const [berita, { refetch: muatUlangBerita }] = createResource(() => listBerita());
  const [testimoni, { refetch: muatUlangTestimoni }] = createResource(listTestimoni);

  return (
    <div className="bg-white">
      <Pembuka />

      <section className="bg-[#fff8f7] px-5 py-14 sm:px-8">
        <div className="mx-auto grid max-w-[1110px] items-center gap-8 md:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="font-serif text-3xl font-bold text-[#39000a]">Lebih dari Sekadar Tarian</h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-[#4f4140]">
              LISTRA UNPAR mendedikasikan diri lebih dari satu dekade untuk melestarikan seni Nusantara di lingkungan kampus
              dan masyarakat.
            </p>
            {/* angka dari pengurus LISTRA (dikonfirmasi 20 Nov 2026).
                flex-col-reverse = angka tampil di atas label, tapi pembaca layar membaca label dulu */}
            <dl className="mt-6 flex gap-10">
              <div className="flex flex-col-reverse">
                <dt className="text-sm text-[#685856]">Tahun dedikasi</dt>
                <dd className="font-serif text-3xl font-bold text-[#39000a]">15+</dd>
              </div>
              <div className="flex flex-col-reverse">
                <dt className="text-sm text-[#685856]">Anggota aktif</dt>
                <dd className="font-serif text-3xl font-bold text-[#39000a]">10</dd>
              </div>
            </dl>
          </div>
          {/* aspect-[10/7] = ruang foto sudah disiapkan, halaman tidak bergeser saat foto selesai dimuat */}
          <img
            src={fotoTari}
            alt="Dua penari LISTRA membawakan Tari Bajidor Kahot dengan kipas merah"
            width="1000"
            height="700"
            loading="lazy"
            className="aspect-[10/7] w-full rounded-xl object-cover"
          />
        </div>
      </section>

      <section className="px-5 py-14 sm:px-8">
        <JudulBagian judul="Jasa Pilihan" keterangan="Satu rentang harga per jasa; rinciannya dibahas lewat WhatsApp." />
        {/* Switch = hanya satu keadaan yang tampil; error dicek dulu karena membaca jasa() yang gagal melempar error */}
        <Switch>
          <Match when={jasa.loading}>
            <Pesan>Memuat jasa...</Pesan>
          </Match>
          <Match when={jasa.error}>
            <PesanGagal onCobaLagi={muatUlangJasa}>Jasa belum bisa dimuat.</PesanGagal>
          </Match>
          <Match when={jasa()?.length === 0}>
            <Pesan>Belum ada jasa.</Pesan>
          </Match>
          <Match when={jasa()}>
            <div className="mx-auto mt-8 grid max-w-[1110px] gap-5 md:grid-cols-3">
              <For each={jasa().slice(0, 3)}>{(item) => <CatalogueCard {...item} />}</For>
            </div>
          </Match>
        </Switch>
        <div className="mt-8 text-center">
          <A href="/jasa" class={TOMBOL_KEDUA}>
            Lihat Semua Jasa
          </A>
        </div>
      </section>

      <section className="bg-[#fff8f7] px-5 py-14 sm:px-8">
        <JudulBagian judul="Testimoni" />
        {/* 3 testimoni terbaru yang disetujui */}
        <Switch>
          <Match when={testimoni.loading}>
            <Pesan>Memuat testimoni...</Pesan>
          </Match>
          <Match when={testimoni.error}>
            <PesanGagal onCobaLagi={muatUlangTestimoni}>Testimoni belum bisa dimuat.</PesanGagal>
          </Match>
          <Match when={testimoni()?.length === 0}>
            <Pesan>Belum ada testimoni.</Pesan>
          </Match>
          <Match when={testimoni()}>
            <div className="mx-auto mt-8 grid max-w-[1110px] gap-5 md:grid-cols-3">
              <For each={testimoni().slice(0, 3)}>{(row) => <TestimoniCard {...row} />}</For>
            </div>
          </Match>
        </Switch>
        <div className="mt-8 text-center">
          <A href="/testimoni" class={TOMBOL_KEDUA}>
            Semua Testimoni
          </A>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-8">
        <JudulBagian judul="Berita Terbaru" />
        <Switch>
          <Match when={berita.loading}>
            <Pesan>Memuat berita...</Pesan>
          </Match>
          <Match when={berita.error}>
            <PesanGagal onCobaLagi={muatUlangBerita}>Berita belum bisa dimuat.</PesanGagal>
          </Match>
          <Match when={berita()?.length === 0}>
            <Pesan>Belum ada berita.</Pesan>
          </Match>
          <Match when={berita()}>
            <div className="mx-auto mt-8 grid max-w-[1110px] gap-5 md:grid-cols-3">
              <For each={berita().slice(0, 3)}>{(item) => <BeritaCard berita={item} judulH3 />}</For>
            </div>
          </Match>
        </Switch>
        <div className="mt-8 text-center">
          <A href="/berita" class={TOMBOL_KEDUA}>
            Semua Berita
          </A>
        </div>
      </section>
    </div>
  );
}
