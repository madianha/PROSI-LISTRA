import { Router, Route } from "@solidjs/router";
import Navbar from "./components/Navbar";
import Home from "./pages/home";
import TentangKami from "./pages/tetang-kami";
import Jasa from "./pages/jasa";
import Jadwal from "./pages/jadwal"
import Testimoni from "./pages/testimoni";
import Footer from "./components/Footer";
import Berita from "./pages/berita";

export default function App() {
  return (
    <Router
      root={(props) => (
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
      )}
    >
      <Route path="/" component={Home} />
      {/* <Route path="/tentang-kami" component={TentangKami} /> */}
      <Route path="/jasa" component={Jasa} />
      <Route path="/jadwal" component={Jadwal} />
      <Route path="/berita" component={Berita} />
      <Route path="/testimoni" component={Testimoni} />
    </Router>
  );
}
