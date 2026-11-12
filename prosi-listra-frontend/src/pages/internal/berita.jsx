import { A } from "@solidjs/router";
import { createResource, createSignal, For, Match, Show, Switch } from "solid-js";
import { faPen, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import GambarSampul from "../../components/GambarSampul";
import Icon from "../../components/Icon";
import KonfirmasiModal from "../../components/internal/KonfirmasiModal";
import Toggle from "../../components/internal/Toggle";
import { deleteBerita, listBerita, setPublik } from "../../api/berita";
import { formatTanggal, jenisBerita } from "../../utils/berita";

// Kolom daftar di layar sm ke atas: sampul | judul | jenis | tanggal | publik | aksi.
// Header dan setiap baris memakai template yang sama agar kolomnya lurus.
const KOLOM = "sm:grid-cols-[64px_minmax(0,1fr)_80px_104px_56px_auto]";

/** Halaman Kelola Berita: daftar semua berita (termasuk draf) dengan Publik, Ubah, Hapus. */
export default function InternalBerita() {
  const [berita, { refetch, mutate }] = createResource(() => listBerita({ semua: true }));
  const [menghapus, setMenghapus] = createSignal(false);
  // id berita yang status publiknya sedang disimpan
  const [menyimpanPublik, setMenyimpanPublik] = createSignal(null);
  const [pesanError, setPesanError] = createSignal("");
  // { id, judul, nilai } yang menunggu konfirmasi; null = jendela tertutup
  const [konfirmasiPublik, setKonfirmasiPublik] = createSignal(null);
  // { id, judul } yang menunggu konfirmasi hapus; null = jendela tertutup
  const [konfirmasiHapus, setKonfirmasiHapus] = createSignal(null);
  let judulHalaman;

  const ubahPublik = async (id, isPublik) => {
    setMenyimpanPublik(id);
    setPesanError("");
    try {
      const baru = await setPublik(id, isPublik);
      // ganti baris itu saja, tanpa memuat ulang seluruh daftar
      mutate((daftar) => daftar.map((b) => (b.id_berita === id ? baru : b)));
    } catch (error) {
      setPesanError(error.message);
    } finally {
      setMenyimpanPublik(null);
    }
  };

  const hapus = async (id) => {
    setMenghapus(true);
    setPesanError("");
    try {
      await deleteBerita(id);
      await refetch();
      // tombol Hapus yang tadi difokus sudah hilang, jadi fokus dipindah ke judul halaman
      judulHalaman.focus();
    } catch (error) {
      setPesanError(error.message);
    } finally {
      setMenghapus(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {/* tabIndex -1 = bisa difokus lewat kode (setelah menghapus), tapi tidak lewat Tab */}
          <h1 ref={judulHalaman} tabIndex={-1} className="font-serif text-2xl font-bold text-[#39000a] focus:outline-none">
            Kelola Berita
          </h1>
          <p className="mt-1 text-sm text-[#685856]">
            Hanya berita yang Publik-nya menyala yang tampil di halaman Berita.
          </p>
        </div>
        <A
          href="/internal/berita/baru"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#39000a] px-4 text-sm font-semibold text-white hover:bg-[#5a0c1a] active:bg-[#2a0007]"
        >
          <Icon icon={faPlus} class="text-xs" /> Berita Baru
        </A>
      </div>

      <Show when={pesanError()}>
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {pesanError()}
        </p>
      </Show>

      <div className="mt-6 overflow-hidden rounded-xl border border-[#f0dedf] bg-white">
        <Switch>
          <Match when={berita.loading}>
            <p className="p-8 text-center text-sm text-[#685856]">Memuat berita...</p>
          </Match>

          <Match when={berita.error}>
            <div className="p-8 text-center text-sm text-[#685856]">
              Berita belum bisa dimuat.{" "}
              <button
                type="button"
                onClick={refetch}
                className="min-h-11 cursor-pointer px-2 font-semibold text-[#54141d] underline hover:decoration-2"
              >
                Coba lagi
              </button>
            </div>
          </Match>

          <Match when={berita()?.length === 0}>
            <p className="p-8 text-center text-sm text-[#685856]">Belum ada berita.</p>
          </Match>

          <Match when={berita()}>
            {/* header kolom, hanya di layar sm ke atas; di HP tiap baris sudah menjelaskan dirinya */}
            <div
              aria-hidden="true"
              className={`hidden gap-x-4 border-b border-[#f0dedf] px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#685856] sm:grid ${KOLOM}`}
            >
              <span>Sampul</span>
              <span>Judul</span>
              <span>Jenis</span>
              <span>Tanggal</span>
              <span>Publik</span>
              <span />
            </div>

            <ul>
              <For each={berita()}>
                {(item) => (
                  // HP: sampul kiri, judul + jenis/tanggal kanan, lalu Publik dan aksi di baris bawah.
                  // sm: semua dalam satu baris mengikuti KOLOM.
                  <li
                    className={`grid grid-cols-[64px_minmax(0,1fr)] items-center gap-x-4 gap-y-1 border-b border-[#f0dedf] px-4 py-3 last:border-0 ${KOLOM}`}
                  >
                    <GambarSampul src={item.url_gambar} class="row-span-2 h-10 w-16 rounded object-cover sm:row-span-1" />

                    <p className="line-clamp-2 text-sm font-medium text-[#302929]">{item.judul}</p>

                    {/* sm:contents = pembungkus ini "hilang" di sm, jadi jenis & tanggal jadi kolom sendiri */}
                    <div className="col-start-2 flex gap-2 text-xs text-[#685856] sm:contents sm:text-sm">
                      <span>{jenisBerita(item) === "tautan" ? "Tautan" : "Artikel"}</span>
                      <span aria-hidden="true" className="sm:hidden">
                        ·
                      </span>
                      <span className="whitespace-nowrap">{formatTanggal(item.tanggal)}</span>
                    </div>

                    <div className="col-span-2 mt-1 flex items-center justify-between border-t border-[#f0dedf] pt-1 sm:contents">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-[#685856] sm:hidden" aria-hidden="true">
                          Publik
                        </span>
                        <Toggle
                          label={`Publik: ${item.judul}`}
                          checked={item.is_publik}
                          disabled={menyimpanPublik() === item.id_berita}
                          // belum disimpan: tanya dulu lewat KonfirmasiModal
                          onChange={(nilai) =>
                            setKonfirmasiPublik({ id: item.id_berita, judul: item.judul, nilai })
                          }
                        />
                      </div>

                      <div className="flex justify-end gap-1">
                        <A
                          href={`/internal/berita/${item.id_berita}/ubah`}
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-sm text-[#54141d] hover:bg-[#fff7f6] hover:underline active:bg-[#f5efeb]"
                        >
                          <Icon icon={faPen} class="text-xs" /> Ubah
                        </A>
                        <button
                          type="button"
                          disabled={menghapus()}
                          onClick={() => setKonfirmasiHapus({ id: item.id_berita, judul: item.judul })}
                          className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md px-3 text-sm text-red-700 hover:bg-red-50 hover:underline active:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Icon icon={faTrash} class="text-xs" /> Hapus
                        </button>
                      </div>
                    </div>
                  </li>
                )}
              </For>
            </ul>
          </Match>
        </Switch>
      </div>

      {/* Konfirmasi sebelum status Publik benar-benar diubah */}
      <Show when={konfirmasiPublik()}>
        {(k) => (
          <KonfirmasiModal
            onBatal={() => setKonfirmasiPublik(null)}
            onKonfirmasi={() => {
              const { id, nilai } = k();
              setKonfirmasiPublik(null);
              ubahPublik(id, nilai);
            }}
          >
            Apakah Anda yakin mengubah <strong>“{k().judul}”</strong> menjadi{" "}
            {k().nilai ? "Publik" : "TIDAK Publik"}?
          </KonfirmasiModal>
        )}
      </Show>

      {/* Konfirmasi sebelum berita dihapus */}
      <Show when={konfirmasiHapus()}>
        {(k) => (
          <KonfirmasiModal
            bahaya
            labelKonfirmasi="Ya, hapus"
            onBatal={() => setKonfirmasiHapus(null)}
            onKonfirmasi={() => {
              const { id } = k();
              setKonfirmasiHapus(null);
              hapus(id);
            }}
          >
            Hapus berita <strong>“{k().judul}”</strong>? Berita yang dihapus tidak bisa dikembalikan.
          </KonfirmasiModal>
        )}
      </Show>
    </div>
  );
}
