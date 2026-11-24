import { createEffect, onCleanup } from "solid-js";

const AKHIRAN = " | LISTRA UNPAR";
const JUDUL_DASAR = "LISTRA UNPAR";

/**
 * Mengganti judul tab browser selama halaman ini terbuka, lalu mengembalikannya.
 * judul = fungsi yang mengembalikan teks; kosong = judul tidak diubah.
 * Contoh: useJudulHalaman(() => "Berita") -> "Berita | LISTRA UNPAR"
 */
export function useJudulHalaman(judul) {
  // judul sebelum halaman ini dibuka; bila itu judul halaman lain (saat pindah halaman,
  // halaman baru bisa dibuat sebelum yang lama ditutup), kembalinya ke judul dasar situs
  const sebelumnya = document.title.endsWith(AKHIRAN) ? JUDUL_DASAR : document.title;
  let judulHalamanIni = "";
  createEffect(() => {
    const teks = judul();
    if (teks) document.title = judulHalamanIni = `${teks}${AKHIRAN}`;
  });
  onCleanup(() => {
    // jangan menimpa judul yang sudah dipasang halaman berikutnya
    if (document.title === judulHalamanIni) document.title = sebelumnya;
  });
}
