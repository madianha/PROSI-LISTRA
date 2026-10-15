import { Router, Route, Navigate } from "@solidjs/router";
import Navbar from "./components/Navbar";
import Home from "./pages/home";
import TentangKami from "./pages/tetang-kami";
import Jasa from "./pages/jasa";
import Jadwal from "./pages/jadwal"
import Testimoni from "./pages/testimoni";
import Footer from "./components/Footer";
import Berita from "./pages/berita";
import LoginInternal from "./pages/internal/login";

import InternalLayout from "./components/internal/InternalLayout";
import InternalKalender from "./pages/internal/kalender";
import InternalKatalog from "./pages/internal/katalog";
import InternalAlatMusik from "./pages/internal/alat-musik";
import InternalAnggota from "./pages/internal/anggota";
import InternalPeriode from "./pages/internal/periode";
import InternalBerita from "./pages/internal/berita";
import InternalTestimoni from "./pages/internal/testimoni";
import InternalKontak from "./pages/internal/kontak";

function PublicLayout(props) {
  return (
    <div>
      <Navbar />
      <div className="min-h-screen w-full bg-[#f5efeb]">
        {/* <CatalogueCard />
        <CatalogueCard />
        <CatalogueCard /> */}
        {props.children}
      </div>
      <Footer/>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      {/* Public pages: Navbar + Footer */}
      <Route path="/" component={PublicLayout}>
        <Route path="/" component={Home} />
        {/* <Route path="/tentang-kami" component={TentangKami} /> */}
        <Route path="/jasa" component={Jasa} />
        <Route path="/jadwal" component={Jadwal} />
        <Route path="/berita" component={Berita} />
        <Route path="/testimoni" component={Testimoni} />
        <Route path="/loginInternal" component={LoginInternal} />
      </Route>

      {/* /internal alone goes to the login page */}
      <Route path="/internal" component={() => <Navigate href="/loginInternal" />} />

      {/* Internal pages: TopBar + SideNav */}
      <Route path="/internal" component={InternalLayout}>
        <Route path="/kalender" component={InternalKalender} />
        <Route path="/katalog" component={InternalKatalog} />
        <Route path="/alat-musik" component={InternalAlatMusik} />
        <Route path="/anggota" component={InternalAnggota} />
        <Route path="/periode" component={InternalPeriode} />
        <Route path="/berita" component={InternalBerita} />
        <Route path="/testimoni" component={InternalTestimoni} />
        <Route path="/kontak" component={InternalKontak} />
      </Route>
    </Router>
  );
}
