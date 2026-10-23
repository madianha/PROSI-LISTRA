import { cleanup } from "@solidjs/testing-library";
import { afterEach } from "vitest";

// Hapus halaman yang di-render setelah tiap test agar tidak menumpuk
afterEach(cleanup);

// jsdom tidak punya window.scrollTo, padahal router memanggilnya setiap pindah
// halaman (scroll ke atas). Diganti fungsi kosong agar tidak muncul
// "Not implemented: Window's scrollTo() method" di output test.
window.scrollTo = () => {};
