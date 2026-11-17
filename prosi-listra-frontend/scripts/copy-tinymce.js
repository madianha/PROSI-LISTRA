// Salin file TinyMCE dari node_modules ke public/tinymce agar editor bisa dimuat
// tanpa CDN. Menggunakan import.meta.url agar path absolut selalu tepat terlepas dari cwd.
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const asal = resolve(rootDir, "node_modules/tinymce");
const tujuan = resolve(rootDir, "public/tinymce");
const isi = ["tinymce.min.js", "models", "skins", "themes", "icons", "plugins"];

if (!existsSync(asal)) {
  console.warn("Folder node_modules/tinymce tidak ditemukan. Lewati salin aset TinyMCE.");
  process.exit(0);
}

mkdirSync(tujuan, { recursive: true });
for (const nama of isi) {
  const sumber = resolve(asal, nama);
  if (existsSync(sumber)) {
    cpSync(sumber, resolve(tujuan, nama), { recursive: true });
  }
}
console.log("TinyMCE disalin ke public/tinymce");

