import TestimoniCard from "../components/TestimoniCard"
import CustomHeader from "../components/CustomHeader"

export default function Testimoni(){
  return(
    <div>
      <CustomHeader category="Apa Kata Mereka" pageName="Testimoni Klien" colorText="text-white">
        <button>+ Tulis Testimoni</button>
      </CustomHeader>

      <div className=" px-6 py-7">
        <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <TestimoniCard />
          <TestimoniCard
            review="Tamu undangan sangat terkesan. Kostumnya rapi dan penarinya profesional."
            name="Ibu Ratna Sari"
            organization="PT Nusantara Jaya"
            event="Acara: Gala Dinner Perusahaan"
          />
          <TestimoniCard
            review="Terima kasih LISTRA, Tari Topeng-nya jadi momen paling berkesan di resepsi kami."
            name="Dinda Permatasari"
            organization=""
            event="Acara: Acara privat"
          />
          <TestimoniCard
            rating={4}
            review="Seru dan menghibur. Mungkin durasinya bisa sedikit lebih panjang."
            name="Arif Budiman"
            organization="Ikatan Alumni TI"
            event="Acara: Gathering Alumni"
          />
        </div>
      </div>
      
    </div>
  )
}
