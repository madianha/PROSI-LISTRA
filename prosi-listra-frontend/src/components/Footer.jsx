export default function Footer() {
  return (
    <div className="bg-[#4A0E17] text-white p-8 pt-16">
      <div className="grid grid-cols-6 gap-2">
        <div className="col-span-3">
          <h2 className="text-[#dfae16]">LISTRA</h2>
          <h3>LINGKAR SENI TRADISIONAL UNPAR</h3>
          <p>Menghadirkan pesona mahakarya tradisional
            Indonesia dengan kemegahan tata panggung, kostum
            keraton otentik, dan integritas artistik tertinggi.</p>
        </div>
        <div>
          <h3 className="text-[#dfae16] font-bold">NAVIGASI UTAMA</h3>
          <p>Beranda</p>
          <p>Tetang Kami</p>
          <p>Katalog Harian</p>
          <p>Testimoni Klien</p>

        </div>
        <div className="col-span-2">
          <h3 className="text-[#dfae16] font-bold">KONTAK SEKRETARIAT</h3>
          <p>Gedung Rektorat UNPAR, Jl. Ciumbuleuit No. 94,
            Bandung
          </p>
          <p>
            listra@unpar.ac.id
          </p>

        </div>

      </div>
      <div className="flex justify-around">
        <p>© 2024 LISTRA UNPAR. Hak Cipta Dilindungi Undang-Undang.</p>
        <p>Royal Heritage & Curatorial Archival Selection</p>
      </div>
    </div>
  )
}
