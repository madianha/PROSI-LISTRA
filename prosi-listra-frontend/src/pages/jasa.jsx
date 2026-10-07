// title, categoru, desc, masih hardcoded, blm fetch data kmana"

import CatalogueCard from "../components/CatalogueCard";
import CustomHeader from "../components/CustomHeader";

export default function Katalog() {
  return (

    <>
    <CustomHeader category="Katalog" pageName="Jasa LISTRA" colorText="text-white">
      <p>Pertunjukan LISTRA sendiri dan penampilan di acara klien.</p>
      
    </CustomHeader>
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
    </main>
    </>
  )
}
