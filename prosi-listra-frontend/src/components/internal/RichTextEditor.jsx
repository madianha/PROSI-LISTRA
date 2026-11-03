import { onCleanup, onMount } from "solid-js";
import { uploadGambar } from "../../api/berita";

const SCRIPT_ID = "tinymce-script";

/** Muat tinymce.min.js dari public/tinymce sekali saja. */
function muatTinyMCE() {
  if (window.tinymce) return Promise.resolve(window.tinymce);
  return new Promise((resolve, reject) => {
    let script = document.getElementById(SCRIPT_ID);
    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "/tinymce/tinymce.min.js";
      document.head.appendChild(script);
    }
    script.addEventListener("load", () => resolve(window.tinymce));
    script.addEventListener("error", reject);
  });
}

/**
 * Editor TinyMCE.
 * props.value    = isi awal (HTML)
 * props.onChange = dipanggil dengan HTML terbaru setiap kali isi berubah
 * props.ref      = (opsional) menerima { ambilKonten } untuk dipanggil saat menyimpan
 * Gambar di dalam artikel diunggah ke /api/upload, bukan disimpan sebagai base64.
 */
export default function RichTextEditor(props) {
  let textarea;
  let editor;

  onMount(async () => {
    const tinymce = await muatTinyMCE();
    const [instance] = await tinymce.init({
      target: textarea,
      license_key: "gpl",
      base_url: "/tinymce",
      suffix: ".min",
      height: 480,
      menubar: false,
      branding: false,
      promotion: false,
      plugins: "autolink link lists image table wordcount",
      toolbar:
        "undo redo | blocks | bold italic underline | bullist numlist | " +
        "link image table | alignleft aligncenter alignright | removeformat",
      // simpan alamat gambar apa adanya (/uploads/...), jangan diubah jadi ../../uploads
      relative_urls: false,
      remove_script_host: true,
      automatic_uploads: true,
      images_file_types: "jpg,jpeg,png,webp,gif",
      images_upload_handler: (blobInfo) =>
        uploadGambar(new File([blobInfo.blob()], blobInfo.filename(), { type: blobInfo.blob().type })),
      content_style:
        "body { font-family: system-ui, sans-serif; font-size: 16px; line-height: 1.6; color: #302929; }",
      setup: (ed) => {
        ed.on("init", () => ed.setContent(props.value ?? ""));
        ed.on("input change undo redo", () => props.onChange(ed.getContent()));
      },
    });
    editor = instance;

    // Tunggu gambar yang masih diunggah, lalu ambil HTML akhirnya.
    // Tanpa ini, gambar yang belum selesai diunggah saat "Terbitkan" ditekan akan hilang.
    props.ref?.({
      ambilKonten: async () => {
        await editor.uploadImages();
        return editor.getContent();
      },
    });
  });

  onCleanup(() => {
    props.ref?.(null);
    editor?.remove();
  });

  return <textarea ref={textarea} aria-label="Konten artikel" className="min-h-[480px] w-full" />;
}
