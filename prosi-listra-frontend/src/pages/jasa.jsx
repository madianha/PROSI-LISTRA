import { createMemo, createSignal, For } from "solid-js";
import CatalogueCard from "../components/CatalogueCard";
import CustomHeader from "../components/CustomHeader";
import FilterJasa from "../components/FilterJasa";


// nanti ambil dari Backend
const services = [
  {
    title: "Tari Merak",
    category: "TARI • JAWA BARAT",
    description: "Tarian Sunda yang menggambarkan keindahan burung merak jantan saat memikat pasangannya.",
    tag: "OPENING",
    type: "Tari",
    culture: "Jawa",
    position: "Opening",
    price: "Rp 2.500.000 – Rp 5.000.000",
  },
  {
    title: "Tari Jaipong",
    category: "TARI • JAWA BARAT",
    description: "Tarian pergaulan khas Jawa Barat dengan gerakan dinamis dan energik.",
    tag: "MIDDLE",
    type: "Tari",
    culture: "Jawa",
    position: "Middle",
    price: "Rp 3.000.000 – Rp 6.000.000",
  },
  {
    title: "Tari Saman",
    category: "TARI • ACEH",
    description: "Tarian Aceh dengan formasi duduk berbaris dan tepukan tangan yang serempak.",
    tag: "OPENING",
    type: "Tari",
    culture: "Sumatera",
    position: "Opening",
    price: "Rp 4.000.000 – Rp 7.500.000",
  },
];

export default function Katalog() {
  const [selected, setSelected] = createSignal({ type: [], culture: [], position: [] });

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
    services.filter((service) =>
      Object.entries(selected()).every(([key, values]) =>
        values.length === 0 || values.includes(service[key]),
      ),
    ),
  );

  const optionCount = (key, value) =>
    services.filter((service) => service[key] === value).length;

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
          <p className="mb-5 text-base text-[#9b8885]">{filteredServices().length} jasa</p>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
            <For each={filteredServices()}>
              {(service) => (
                <CatalogueCard
                  title={service.title}
                  category={service.category}
                  description={service.description}
                  tag={service.tag}
                  price={service.price}
                />
              )}
            </For>
            {filteredServices().length === 0 && (
              <p className="rounded-xl border border-[#f0d9d8] bg-white p-6 text-[#7d6966]">
                Tidak ada jasa yang cocok dengan filter ini.
              </p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
