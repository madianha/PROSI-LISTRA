import { MemoryRouter, Route, createMemoryHistory, useLocation } from "@solidjs/router";
import { render } from "@solidjs/testing-library";

/** Menampilkan path saat ini, untuk mengecek navigasi di test. */
function LokasiSekarang() {
  const location = useLocation();
  return <p data-testid="lokasi">{location.pathname}</p>;
}

/**
 * Render komponen di dalam router (perlu untuk <A>, useParams, useNavigate).
 * path = pola route (mis. "/berita/:id"), url = alamat yang dibuka (mis. "/berita/3").
 */
export function renderRoute(Component, { path = "/", url = path } = {}) {
  const history = createMemoryHistory();
  history.set({ value: url, replace: true });

  return render(() => (
    <MemoryRouter history={history}>
      <Route path={path} component={Component} />
      <Route path="*" component={LokasiSekarang} />
    </MemoryRouter>
  ));
}
