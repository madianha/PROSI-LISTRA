import CustomHeader from "../components/CustomHeader";

export default function Jadwal(){
  return(
    <>
    <CustomHeader category="Agenda" pageName="Jadwal LISTRA" colorText="text-white">
          <p>Tari dan musik tradisional Nusantara.</p>
          <p className="border-l-4 border-[#d4af37] text-base sm:text-lg">
            Tari bisa diiringi live music, dan pemain musik juga bisa dipesan tanpa tari. Rincian dibahas lewat WhatsApp.
          </p>
        </CustomHeader>
    </>
  )
}
