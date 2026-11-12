import { createEffect, onCleanup } from "solid-js";

/**
 * Mengganti judul tab browser selama halaman ini terbuka, lalu mengembalikannya.
 * judul = fungsi yang mengembalikan teks; kosong = judul tidak diubah.
 * Contoh: useJudulHalaman(() => "Berita") -> "Berita | LISTRA UNPAR"
 */
export function useJudulHalaman(judul) {
  const sebelumnya = document.title;
  createEffect(() => {
    const teks = judul();
    if (teks) document.title = `${teks} | LISTRA UNPAR`;
  });
  onCleanup(() => {
    document.title = sebelumnya;
  });
}
