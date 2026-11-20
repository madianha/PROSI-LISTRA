import { Router, Route, Navigate } from "@solidjs/router";
import PublicLayout from "./components/PublicLayout";
import Home from "./pages/home";
import TentangKami from "./pages/tetang-kami";
import Jasa from "./pages/jasa";
import JasaDetail from "./pages/jasa-detail";
import Jadwal from "./pages/jadwal"
import Testimoni from "./pages/testimoni";
import Berita from "./pages/berita";
import BeritaDetail from "./pages/berita-detail";
import LoginInternal from "./pages/internal/login";

import InternalLayout from "./components/internal/InternalLayout";
import HalamanTidakAda from "./components/HalamanTidakAda";
import InternalKalender from "./pages/internal/kalender";
import InternalAcaraDetail from "./pages/internal/acara-detail";
import InternalJasa from "./pages/internal/jasa";
import InternalKatalog from "./pages/internal/katalog";
import InternalAlatMusik from "./pages/internal/alat-musik";
import InternalAnggota from "./pages/internal/anggota";
import InternalPeriode from "./pages/internal/periode";
import InternalBerita from "./pages/internal/berita";
import InternalBeritaForm from "./pages/internal/berita-form";
import InternalTestimoni from "./pages/internal/testimoni";
import InternalKontak from "./pages/internal/kontak";
import InternalProfile from "./pages/internal/profile";

export default function App() {
  return (
    <Router>
      {/* Halaman publik: Navbar + isi + Footer (components/PublicLayout.jsx) */}
      <Route path="/" component={PublicLayout}>
        <Route path="/" component={Home} />
        {/* <Route path="/tentang-kami" component={TentangKami} /> */}
        <Route path="/jasa" component={Jasa} />
        <Route path="/jasa/:id" component={JasaDetail} />
        <Route path="/jadwal" component={Jadwal} />
        <Route path="/berita" component={Berita} />
        <Route path="/berita/:id" component={BeritaDetail} />
        <Route path="/testimoni" component={Testimoni} />
        {/* alamat publik yang tidak ada: halaman 404, bukan layar kosong */}
        <Route path="*" component={HalamanTidakAda} />
      </Route>

      <Route path="/internal/login" component={LoginInternal} />

      {/* /internal alone goes to the login page */}
      <Route path="/internal" component={() => <Navigate href="/internal/login" />} />

      {/* Internal pages: TopBar + SideNav */}
      <Route path="/internal" component={InternalLayout}>
        <Route path="/kalender" component={InternalKalender} />
        <Route path="/kalender/:id" component={InternalAcaraDetail} />
        <Route path="/jasa" component={InternalJasa} />
        <Route path="/katalog" component={InternalKatalog} />
        <Route path="/alat-musik" component={InternalAlatMusik} />
        <Route path="/anggota" component={InternalAnggota} />
        <Route path="/periode" component={InternalPeriode} />
        <Route path="/berita" component={InternalBerita} />
        <Route path="/berita/baru" component={InternalBeritaForm} />
        <Route path="/berita/:id/ubah" component={InternalBeritaForm} />
        <Route path="/testimoni" component={InternalTestimoni} />
        <Route path="/kontak" component={InternalKontak} />
        <Route path="/profile" component={InternalProfile} />
        {/* alamat internal yang tidak ada: tetap lewat InternalLayout, jadi yang belum login
            diarahkan ke /internal/login; yang sudah login melihat halaman 404 */}
        <Route path="*" component={() => <HalamanTidakAda internal />} />
      </Route>
    </Router>
  );
}
