import { Router, Route } from "@solidjs/router";
import Navbar from "./components/Navbar";
import TentangKami from "./pages/tetang-kami";
import Katalog from "./pages/katalog";
import Testimoni from "./pages/testimoni";

export default function App() {
  return (
    <Router
      root={(props) => (
        <div>
          <Navbar />
          <div className="bg-[#f5efeb] w-full h-full flex">
            {/* <CatalogueCard />
            <CatalogueCard />
            <CatalogueCard /> */}
            {props.children}
          </div>
        </div>
      )}
    >
      <Route path="/tentang-kami" component={TentangKami} />
      <Route path="/katalog" component={Katalog} />
      <Route path="/testimoni" component={Testimoni} />
    </Router>
  );
}
