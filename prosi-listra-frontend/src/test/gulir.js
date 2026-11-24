import { fireEvent } from "@solidjs/testing-library";

// jsdom tidak benar-benar menggulir: posisi diatur langsung lalu event scroll dikirim.
// Kembalikan ke 0 setelah tiap test: afterEach(() => aturGulir(0))

/** Atur posisi gulir tanpa mengirim event (mis. halaman dimuat ulang di tengah). */
export function aturGulir(y) {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true, writable: true });
}

/** Gulir ke posisi y, seperti pengunjung menggulir halaman. */
export function gulirKe(y) {
  aturGulir(y);
  fireEvent.scroll(window);
}
