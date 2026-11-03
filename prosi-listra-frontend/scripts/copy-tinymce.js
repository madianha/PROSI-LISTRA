// Salin file TinyMCE dari node_modules ke public/tinymce agar editor bisa dimuat
// tanpa CDN. Ditulis dengan Node (bukan mkdir/cp) supaya jalan juga di Windows.
import { cpSync, mkdirSync } from "node:fs";

const asal = "node_modules/tinymce";
const tujuan = "public/tinymce";
const isi = ["tinymce.min.js", "models", "skins", "themes", "icons", "plugins"];

mkdirSync(tujuan, { recursive: true });
for (const nama of isi) {
  cpSync(`${asal}/${nama}`, `${tujuan}/${nama}`, { recursive: true });
}
console.log("TinyMCE disalin ke public/tinymce");
