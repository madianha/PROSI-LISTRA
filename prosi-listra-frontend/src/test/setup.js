import { cleanup } from "@solidjs/testing-library";
import { afterEach } from "vitest";

// Hapus halaman yang di-render setelah tiap test agar tidak menumpuk
afterEach(cleanup);

// jsdom tidak punya window.scrollTo, padahal router memanggilnya setiap pindah
// halaman (scroll ke atas). Diganti fungsi kosong agar tidak muncul
// "Not implemented: Window's scrollTo() method" di output test.
window.scrollTo = () => {};

// Node 22+ punya localStorage bawaan yang menimpa milik jsdom, dan nilainya undefined
// bila Node tidak dijalankan dengan --localstorage-file. Diganti penyimpanan di memori
// agar test yang memakai localStorage asli tetap jalan; dikosongkan setelah tiap test.
function buatStorage() {
  const isi = new Map();
  return {
    get length() {
      return isi.size;
    },
    key: (i) => [...isi.keys()][i] ?? null,
    getItem: (k) => (isi.has(String(k)) ? isi.get(String(k)) : null),
    setItem: (k, v) => void isi.set(String(k), String(v)),
    removeItem: (k) => void isi.delete(String(k)),
    clear: () => isi.clear(),
  };
}

let storageBisaDipakai = false;
try {
  storageBisaDipakai = typeof globalThis.localStorage?.getItem === "function";
} catch {
  // akses localStorage melempar error: anggap tidak bisa dipakai
}
if (!storageBisaDipakai) {
  const storage = buatStorage();
  for (const target of [globalThis, window]) {
    Object.defineProperty(target, "localStorage", { value: storage, configurable: true, writable: true });
  }
}
afterEach(() => {
  try {
    globalThis.localStorage?.clear?.();
  } catch {
    // localStorage di-stub test tanpa clear(): biarkan
  }
});
