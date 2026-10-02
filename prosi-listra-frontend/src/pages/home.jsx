import CatalogueCard from "../components/CatalogueCard";

export default function Home() {
  return (
    <>

      <main className="">

        <div id="" className=" flex w-100vw h-100vh">

        </div>

        <div id="tentang-kami">

        </div>
        <div id="katalog" className="grid w-full grid-cols-1 gap-6 p-5 sm:grid-cols-2 sm:p-8 xl:grid-cols-3">
          <CatalogueCard
            title="Tari Merak"
            category="TARI • JAWA BARAT"
            description="Tarian Sunda yang menggambarkan keindahan burung merak jantan saat memikat pasangannya."
            tag="BEST SELLER"
          />
          <CatalogueCard
            title="Tari Jaipong"
            category="TARI • JAWAB BARAT"
            description="Tarian pergaulan khas Jawa Barat dengan gerakan dinamis dan energik."
            tag="OPENING CEREMONY"
          />
          <CatalogueCard
            title="Tari Saman"
            category="TARI • ACEH"
            description="Tarian Aceh dengan formasi duduk berbaris dan tepukan tangan yang serempak."
            tag="ENERGETIK & CERIA"
          />
        </div>
        <div id="testimoni">

        </div>
        <div id="footer">

        </div>
      </main>
    </>

  );
}
