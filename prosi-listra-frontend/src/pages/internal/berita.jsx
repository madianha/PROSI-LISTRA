import { A } from "@solidjs/router";
import { createResource, createSignal, For, Match, Show, Switch } from "solid-js";
import { faPen, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import Icon from "../../components/Icon";
import KonfirmasiModal from "../../components/internal/KonfirmasiModal";
import Toggle from "../../components/internal/Toggle";
import { deleteBerita, listBerita, setPublik } from "../../api/berita";
import { formatTanggal, jenisBerita } from "../../utils/berita";

/** Halaman Kelola Berita: daftar semua berita (termasuk draf) dengan Publik, Ubah, Hapus. */
export default function InternalBerita() {
  const [berita, { refetch, mutate }] = createResource(() => listBerita({ semua: true }));
  // id berita yang sedang menunggu konfirmasi hapus
  const [konfirmasiId, setKonfirmasiId] = createSignal(null);
  const [menghapus, setMenghapus] = createSignal(false);
  // id berita yang status publiknya sedang disimpan
  const [menyimpanPublik, setMenyimpanPublik] = createSignal(null);
  const [pesanError, setPesanError] = createSignal("");
  // { id, judul, nilai } yang menunggu konfirmasi; null = jendela tertutup
  const [konfirmasiPublik, setKonfirmasiPublik] = createSignal(null);

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
      setKonfirmasiId(null);
      await refetch();
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
          <h1 className="font-serif text-2xl font-bold text-[#39000a]">Kelola Berita</h1>
          <p className="mt-1 text-sm text-[#685856]">
            Hanya berita yang Publik-nya menyala yang tampil di halaman Berita.
          </p>
        </div>
        <A
          href="/internal/berita/baru"
          className="inline-flex items-center gap-2 rounded-lg bg-[#39000a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5a0c1a]"
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
              <button type="button" onClick={refetch} className="font-semibold text-[#54141d] underline">
                Coba lagi
              </button>
            </div>
          </Match>

          <Match when={berita()?.length === 0}>
            <p className="p-8 text-center text-sm text-[#685856]">Belum ada berita.</p>
          </Match>

          <Match when={berita()}>
            {/* overflow-x-auto = di layar kecil tabel bisa digeser ke samping */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-[#f0dedf] text-xs uppercase tracking-wider text-[#685856]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Sampul</th>
                    <th className="px-4 py-3 font-medium">Judul</th>
                    <th className="px-4 py-3 font-medium">Jenis</th>
                    <th className="px-4 py-3 font-medium">Tanggal</th>
                    <th className="px-4 py-3 font-medium">Publik</th>
                    <th className="px-4 py-3 font-medium">
                      <span className="sr-only">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <For each={berita()}>
                    {(item) => (
                      <tr className="border-b border-[#f7ecec] last:border-0">
                        <td className="px-4 py-3">
                          <img src={item.url_gambar} alt="" className="h-10 w-16 rounded object-cover" />
                        </td>
                        <td className="max-w-xs px-4 py-3 font-medium text-[#302929]">
                          <span className="line-clamp-2">{item.judul}</span>
                        </td>
                        <td className="px-4 py-3 text-[#685856]">
                          {jenisBerita(item) === "tautan" ? "Tautan" : "Artikel"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[#685856]">
                          {formatTanggal(item.tanggal)}
                        </td>
                        <td className="px-4 py-3">
                          <Toggle
                            label={`Publik: ${item.judul}`}
                            checked={item.is_publik}
                            disabled={menyimpanPublik() === item.id_berita}
                            // belum disimpan: tanya dulu lewat KonfirmasiModal
                            onChange={(nilai) =>
                              setKonfirmasiPublik({ id: item.id_berita, judul: item.judul, nilai })
                            }
                          />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <Show
                            when={konfirmasiId() === item.id_berita}
                            fallback={
                              <div className="flex justify-end gap-1">
                                <A
                                  href={`/internal/berita/${item.id_berita}/ubah`}
                                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[#54141d] hover:bg-[#fff7f6]"
                                >
                                  <Icon icon={faPen} class="text-xs" /> Ubah
                                </A>
                                <button
                                  type="button"
                                  onClick={() => setKonfirmasiId(item.id_berita)}
                                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-red-700 hover:bg-red-50"
                                >
                                  <Icon icon={faTrash} class="text-xs" /> Hapus
                                </button>
                              </div>
                            }
                          >
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-[#685856]">Hapus berita ini?</span>
                              <button
                                type="button"
                                onClick={() => setKonfirmasiId(null)}
                                className="rounded-md px-2.5 py-1.5 hover:bg-gray-100"
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                disabled={menghapus()}
                                onClick={() => hapus(item.id_berita)}
                                className="rounded-md bg-red-700 px-2.5 py-1.5 font-semibold text-white hover:bg-red-800 disabled:opacity-60"
                              >
                                Ya, hapus
                              </button>
                            </div>
                          </Show>
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
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
    </div>
  );
}
