import CatalogueCard from "../components/CatalogueCard";

export default function Home() {
  return (
    <main className="grid w-full grid-cols-1 gap-6 p-5 sm:grid-cols-2 sm:p-8 xl:grid-cols-3">
      <CatalogueCard
              title="Tari Saman"
              category="ACEH • SINKRONISASI TEPUKAN PERKUSI"
              description="Tarian seribu tangan yang memukau dengan
      kekompakan ritme cepat tanpa jeda,
      menciptakan suasana spektakuler dan
      membangkitkan semangat audiens."
              tag="BEST SELLER"
            />
      <CatalogueCard
        title="Tari Merak"
        category="JAWA BARAT • ANGGUN & MEGAH"
        description="Menggambarkan pesona burung merak yang membentang anggun, ideal untuk penyambutan tamu kehormatan dan seremoni pembuka."
        tag="OPENING CEREMONY"
      />
      <CatalogueCard
        title="Tari Bajidor Kahot"
        category="SUNDA KREASI • KIPAS & SELENDANG"
        description="Kombinasi dinamis kendang Jaipongan dan Ketuk Tilu yang memberikan kegembiraan untuk pesta pernikahan dan gathering."
        tag="ENERGETIK & CERIA"
      />
    </main>
  );
}
