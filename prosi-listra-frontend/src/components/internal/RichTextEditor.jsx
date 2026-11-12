import { createSignal, onCleanup, onMount, Show } from "solid-js";
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
  // "memuat" -> "siap", atau "gagal" bila file TinyMCE tidak bisa dimuat
  const [status, setStatus] = createSignal("memuat");

  onMount(async () => {
    let instance;
    try {
      const tinymce = await muatTinyMCE();
      [instance] = await tinymce.init({
        target: textarea,
        license_key: "gpl",
        base_url: "/tinymce",
        suffix: ".min",
        height: 480,
        iframe_aria_text: "Konten artikel",
        menubar: false,
        branding: false,
        promotion: false,
        plugins: "autolink link lists image table wordcount fullscreen",
        toolbar:
          "undo redo | blocks | bold italic underline | bullist numlist | " +
          "link image table | alignleft aligncenter alignright | removeformat | fullscreen",
        // di HP: tombol layar penuh paling depan, dan semua tombol tampil dalam satu baris
        // yang bisa digeser (bukan disembunyikan di menu "...")
        mobile: {
          toolbar_mode: "scrolling",
          toolbar:
            "fullscreen undo redo | blocks | bold italic underline | bullist numlist | " +
            "link image table | alignleft aligncenter alignright | removeformat",
        },
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
    } catch (error) {
      console.error("TinyMCE gagal dimuat:", error);
    }
    // tanpa editor, isi textarea tidak tersimpan; jangan biarkan pengguna mengetik di situ
    if (!instance) {
      setStatus("gagal");
      return;
    }
    editor = instance;
    setStatus("siap");

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

  return (
    <>
      <Show when={status() === "memuat"}>
        <p className="flex min-h-[480px] items-center justify-center text-sm text-[#685856]">Memuat editor...</p>
      </Show>
      <Show when={status() === "gagal"}>
        <p role="alert" className="flex min-h-[480px] items-center justify-center px-6 text-center text-sm text-red-800">
          Editor gagal dimuat. Muat ulang halaman ini; bila masih gagal, hubungi pengelola website.
        </p>
      </Show>
      {/* hidden = textarea tidak pernah tampil; TinyMCE memasang editornya sendiri di sebelahnya */}
      <textarea ref={textarea} aria-label="Konten artikel" className="hidden" />
    </>
  );
}
