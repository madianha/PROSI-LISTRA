import TestimoniCard from "../components/TestimoniCard"
import CustomHeader from "../components/CustomHeader"
import { testimoni } from "../data/testimoni"

export default function Testimoni(){
  return(
    <div>
      <CustomHeader category="Apa Kata Mereka" pageName="Testimoni Klien" colorText="text-white">
        <button>+ Tulis Testimoni</button>
      </CustomHeader>

      <div className=" px-6 py-7">
        <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          
          {testimoni.filter((row) => row.is_aktif).map((row) => (
            <TestimoniCard key={row.id_testimoni} {...row} />
          ))}
        </div>
      </div>
      
    </div>
  )
}
