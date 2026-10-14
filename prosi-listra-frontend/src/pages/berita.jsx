import BeritaCard from "../components/BeritaCard"
import CustomHeader from "../components/CustomHeader"

export default function Berita() {
  return (
    <>
      <CustomHeader category="KABAR & PRESTASI" pageName="Berita LISTRA" colorText="text-white">
        <p>Liputan LISTRA dari unpar.ac.id dan media lain</p>
      </CustomHeader>

      <div className=" px-6 py-7">
        <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <BeritaCard href="https://unpar.ac.id/"/>
          <BeritaCard href="https://unpar.ac.id/"/>
          <BeritaCard href="https://unpar.ac.id/"/>
          <BeritaCard href="https://unpar.ac.id/"/>
        </div>
      </div>
    </>
  )
}
