import { Router, Route } from "@solidjs/router";
import Navbar from "./components/Navbar";

export default function App() {
  return (
    <Router
      root={(props) => (
        <>
          <Navbar />
          {props.children}
        </>
      )}
    >
      {/* Define your routes here */}
    </Router>
  );
}

