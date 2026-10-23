import { createResource, For, Match, Switch } from "solid-js";
import BeritaCard from "../components/BeritaCard";
import CustomHeader from "../components/CustomHeader";
import { listBerita } from "../api/berita";

export default function Berita() {
  // tanpa { semua: true }: hanya berita yang publik
  const [berita, { refetch }] = createResource(() => listBerita());

  return (
    <>
      <CustomHeader category="KABAR & PRESTASI" pageName="Berita LISTRA" colorText="text-white">
        <p>Liputan kegiatan dan prestasi LISTRA UNPAR</p>
      </CustomHeader>

      <div className="px-6 py-10">
        <div className="mx-auto w-full max-w-[1100px]">
          <Switch>
            <Match when={berita.loading}>
              <p className="py-16 text-center text-sm text-[#685856]">Memuat berita...</p>
            </Match>

            <Match when={berita.error}>
              <div className="py-16 text-center">
                <p className="text-sm text-[#685856]">Berita belum bisa dimuat.</p>
                <button
                  type="button"
                  onClick={refetch}
                  className="mt-3 text-sm font-semibold text-[#54141d] underline underline-offset-4"
                >
                  Coba lagi
                </button>
              </div>
            </Match>

            <Match when={berita()?.length === 0}>
              <p className="py-16 text-center text-sm text-[#685856]">Belum ada berita.</p>
            </Match>

            <Match when={berita()}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <For each={berita()}>{(item) => <BeritaCard berita={item} />}</For>
              </div>
            </Match>
          </Switch>
        </div>
      </div>
    </>
  );
}
