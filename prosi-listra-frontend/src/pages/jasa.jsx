import { createMemo, createResource, createSignal, For, Show } from "solid-js";
import CatalogueCard from "../components/CatalogueCard";
import CustomHeader from "../components/CustomHeader";
import FilterJasa from "../components/FilterJasa";
import { listJasa } from "../api/jasa";

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

export default function Katalog() {
  const [services] = createResource(fetchServices);
  const [selected, setSelected] = createSignal({ type: [], culture: [], position: [] });

  const servicesList = () => services() || [];

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

  return (
    <>
      <CustomHeader category="Katalog" pageName="Jasa LISTRA" colorText="text-white">
        <p>Pertunjukan LISTRA sendiri dan penampilan di acara klien.</p>
        <p className="text-base sm:text-lg">
          Tari bisa diiringi live music, dan pemain musik juga bisa dipesan tanpa tari. Rincian dibahas lewat WhatsApp.
        </p>
      </CustomHeader>

      <main className="mx-auto grid w-full max-w-[1600px] grid-cols-1 items-start gap-6 bg-[#fffafa] px-5 py-8 sm:px-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-10">
        <FilterJasa selected={selected} onToggle={toggleFilter} count={optionCount} />

        <section className="min-w-0">
          <Show when={services.loading}>
            <p className="rounded-xl border border-[#f0d9d8] bg-white p-6 text-[#7d6966]">
              Memuat data jasa dari database...
            </p>
          </Show>

          <Show when={services.error}>
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
              <p className="font-semibold">Gagal memuat katalog jasa dari server.</p>
              <p className="mt-1 text-sm text-red-600">
                Pastikan backend di port 3000 berjalan dan terhubung ke PostgreSQL.
              </p>
            </div>
          </Show>

          <Show when={!services.loading && !services.error}>
            <p className="mb-5 text-base text-[#9b8885]">{filteredServices().length} jasa</p>
            <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <For each={filteredServices()}>
                {(service) => (
                  <CatalogueCard
                    {...service}
                  />
                )}
              </For>
              {filteredServices().length === 0 && (
                <p className="rounded-xl border border-[#f0d9d8] bg-white p-6 text-[#7d6966]">
                  Tidak ada jasa yang cocok dengan filter ini.
                </p>
              )}
            </div>
          </Show>
        </section>
      </main>
    </>
  );
}
