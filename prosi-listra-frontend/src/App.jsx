import { Router, Route } from "@solidjs/router";
import Navbar from "./components/Navbar";
import CatalogueCard from "./components/CatalogueCard";

export default function App() {
  return (
    <Router
      root={(props) => (
        <div>
          <Navbar />
          <div className="bg-[#f5efeb] w-full h-full flex">
            <CatalogueCard />
            <CatalogueCard />
            {props.children}
          </div>
        </div>
      )}
    >
      {/* Define your routes here */}
    </Router>
  );
}

