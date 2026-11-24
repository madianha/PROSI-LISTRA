import { createSignal, onCleanup, onMount } from "solid-js";

/**
 * true bila halaman sudah digulir ke bawah, walau hanya 1px.
 * Dipakai menu publik (Navbar) dan video pembuka Beranda, supaya keduanya berganti di titik yang sama.
 * Pakai di dalam komponen: const digulir = useDigulir(); lalu baca digulir().
 */
export function useDigulir() {
  // nilai awal dari posisi sekarang: halaman yang dimuat ulang di tengah langsung dianggap tergulir
  const [digulir, setDigulir] = createSignal(window.scrollY > 0);
  onMount(() => {
    const cek = () => setDigulir(window.scrollY > 0);
    // passive = pendengar ini tidak pernah menahan guliran, jadi menggulir tetap mulus
    window.addEventListener("scroll", cek, { passive: true });
    onCleanup(() => window.removeEventListener("scroll", cek));
  });
  return digulir;
}
