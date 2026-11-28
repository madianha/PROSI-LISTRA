import { createMemo, createResource, createSignal, For, Match, Show, Switch } from "solid-js";
import { faChevronDown, faSliders } from "@fortawesome/free-solid-svg-icons";
import CatalogueCard from "../components/CatalogueCard";
import CustomHeader from "../components/CustomHeader";
import FilterJasa from "../components/FilterJasa";
import Icon from "../components/Icon";
import { listJasa } from "../api/jasa";
import { useJudulHalaman } from "../utils/judulHalaman";

// nilai filter per jasa: type & culture satu nilai, position bisa lebih dari satu (jasa_kecocokan)
const fetchServices = async () => {
  const data = await listJasa();
  return data.map((item) => ({
    ...item,
    filter: {
      type: item.tipe_jasa === "musik" ? "Musik" : "Tari",
      culture: item.pulau || "Nusantara",
      position: item.kecocokan || [],
    },
  }));
};

const cocok = (service, key, value) => [service.filter[key]].flat().includes(value);
const TANPA_FILTER = { type: [], culture: [], position: [] };

export default function Katalog() {
  const [services, { refetch }] = createResource(fetchServices);
  const [selected, setSelected] = createSignal(TANPA_FILTER);
  // panel filter di HP: tertutup dulu agar daftar jasa langsung terlihat
  const [filterTerbuka, setFilterTerbuka] = createSignal(false);
  useJudulHalaman(() => "Jasa");

  const servicesList = () => (services.error ? [] : services() || []);

  const toggleFilter = (key, value) => {
    const current = selected()[key];
    setSelected({
      ...selected(),
      [key]: current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    });
  };

  const filteredServices = createMemo(() =>
    servicesList().filter((service) =>
      Object.entries(selected()).every(([key, values]) =>
        values.length === 0 || values.some((value) => cocok(service, key, value)),
      ),
    ),
  );

  const optionCount = (key, value) =>
    servicesList().filter((service) => cocok(service, key, value)).length;

  const jumlahFilter = () => Object.values(selected()).flat().length;

  return (
    <>
      <CustomHeader pageName="Jasa LISTRA">
        <p>Pertunjukan LISTRA sendiri dan penampilan di acara klien.</p>
        <p>Tari bisa diiringi live music, dan pemain musik juga bisa dipesan tanpa tari. Rincian dibahas lewat WhatsApp.</p>
      </CustomHeader>

      {/* lg:grid-cols-[300px_...] = di layar lebar filter di kiri (300px), daftar jasa mengisi sisanya; max-w-[1600px] = cukup lebar untuk 3 kartu sebaris */}
      <div className="px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div>
          {/* tombol buka/tutup filter: hanya di layar kecil (lg:hidden); di layar lebar filter selalu tampil */}
          <button
            type="button"
            aria-expanded={filterTerbuka()}
            aria-controls="filter-jasa"
            onClick={() => setFilterTerbuka(!filterTerbuka())}
            className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-[#e3d3d1] bg-white px-4 text-sm font-semibold text-[#39000a] hover:bg-[#fff8f7] active:bg-[#fff0f1] lg:hidden"
          >
            <span className="inline-flex items-center gap-2">
              <Icon icon={faSliders} /> Filter{jumlahFilter() > 0 ? ` (${jumlahFilter()} dipilih)` : ""}
            </span>
            <Icon icon={faChevronDown} class={filterTerbuka() ? "rotate-180" : ""} />
          </button>
          <div id="filter-jasa" className={`${filterTerbuka() ? "mt-3 block" : "hidden"} lg:mt-0 lg:block`}>
            <FilterJasa selected={selected} onToggle={toggleFilter} count={optionCount} />
          </div>
        </div>

        <section aria-labelledby="judul-daftar-jasa" className="min-w-0">
          <h2 id="judul-daftar-jasa" className="sr-only">
            Daftar jasa
          </h2>
          {/* Switch = hanya satu keadaan yang tampil; error dicek dulu karena membaca services() yang gagal melempar error */}
          <Switch>
            <Match when={services.loading}>
              <p className="py-12 text-center text-sm text-[#685856]">Memuat jasa...</p>
            </Match>
            <Match when={services.error}>
              <div className="py-12 text-center">
                <p className="text-sm text-[#685856]">Katalog jasa belum bisa dimuat.</p>
                <button
                  type="button"
                  onClick={refetch}
                  className="mt-2 min-h-11 cursor-pointer px-3 text-sm font-semibold text-[#54141d] underline underline-offset-4 hover:text-[#39000a]"
                >
                  Coba lagi
                </button>
              </div>
            </Match>
            <Match when={services()?.length === 0}>
              <p className="py-12 text-center text-sm text-[#685856]">Belum ada jasa.</p>
            </Match>
            <Match when={services()}>
              <div className="mb-3 flex min-h-11 items-center justify-between gap-3">
                {/* aria-live = pembaca layar membacakan jumlah baru setiap filter diubah */}
                <p className="text-sm text-[#685856]" aria-live="polite">
                  {filteredServices().length} jasa
                </p>
                <Show when={jumlahFilter() > 0}>
                  <button
                    type="button"
                    onClick={() => setSelected(TANPA_FILTER)}
                    className="min-h-11 cursor-pointer px-2 text-sm font-semibold text-[#54141d] underline underline-offset-4 hover:text-[#39000a]"
                  >
                    Hapus filter
                  </button>
                </Show>
              </div>
              <Show
                when={filteredServices().length > 0}
                fallback={
                  <p className="rounded-xl border border-[#f0dedf] bg-white p-6 text-center text-sm text-[#685856]">
                    Tidak ada jasa yang cocok dengan filter ini.
                  </p>
                }
              >
                {/* xl:grid-cols-3 = 3 kartu sebaris di desktop */}
                <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  <For each={filteredServices()}>{(service, i) => <CatalogueCard {...service} prioritas={i() < 3} />}</For>
                </div>
              </Show>
            </Match>
          </Switch>
        </section>
      </div>
      </div>
    </>
  );
}
