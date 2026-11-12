import { createMemo, createResource, createSignal, For, Show } from "solid-js";
import CatalogueCard from "../components/CatalogueCard";
import CustomHeader from "../components/CustomHeader";
import FilterJasa from "../components/FilterJasa";
import { jasa as sampleJasa } from "../data/jasa";

const API_URL = "http://localhost:3000/api/jasa";

const fetchServices = async () => {
  let data;
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`Gagal memuat data jasa (status ${response.status})`);
    data = await response.json();
  } catch {
    // Keep the catalogue visible for local UI review when the API is offline.
    data = sampleJasa;
  }

  return data.filter((item) => item.is_aktif !== false).map((item) => {
    // Normalisasi kapital (tari -> Tari, musik -> Musik)
    // Normalisasi kultur agar selaras dengan filter options di FilterJasa
    let culture = item.kultur || "";

    // Nusa Tenggara
    if (culture === "Bali") culture = "Bali & Nusa Tenggara";
    if (culture === "Nusa Tenggara Timur") culture = "Bali & Nusa Tenggara";
    if (culture === "Nusa Tenggara Barat") culture = "Bali & Nusa Tenggara";

    // Jawa
    if (culture === "Jawa Barat") culture = "Jawa";
    if (culture === "Jawa Tengah") culture = "Jawa";
    if (culture === "Banten") culture = "Jawa";
    if (culture === "Jawa Timur") culture = "Jawa";
    // Sumatera
    if (culture === "Aceh") culture = "Sumatera";
    if (culture === "Batak") culture = "Sumatera";

    const position = item.nama_kecocokan || "";
    const type = item.tipe_jasa
      ? item.tipe_jasa.charAt(0).toUpperCase() + item.tipe_jasa.slice(1).toLowerCase()
      : "Tari";

    return {
      ...item,
      kultur: item.kultur || "Nusantara",
      culture,
      nama_kecocokan: position,
      type,
      position,
    };
  });
};

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
        values.length === 0 || values.includes(service[key]),
      ),
    ),
  );

  const optionCount = (key, value) =>
    servicesList().filter((service) => service[key] === value).length;

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
