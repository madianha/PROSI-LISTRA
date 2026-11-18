import { onCleanup, onMount } from "solid-js";

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const SCRIPT_ID = "cf-turnstile-script";

// Kunci uji resmi Cloudflare (selalu lolos), dipakai bila VITE_TURNSTILE_SITE_KEY tidak diisi.
// Production: isi VITE_TURNSTILE_SITE_KEY di .env dengan site key dari dashboard Cloudflare.
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

/** Muat script Turnstile sekali saja, walau komponen dipakai berkali-kali. */
function muatTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  return new Promise((resolve, reject) => {
    let script = document.getElementById(SCRIPT_ID);
    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_URL;
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", () => resolve(window.turnstile));
    script.addEventListener("error", reject);
  });
}

/**
 * Kotak centang Cloudflare Turnstile ("Apakah Anda manusia?").
 * props.onToken = dipanggil dengan token saat lolos, atau null saat kedaluwarsa / gagal
 * props.ref     = (opsional) menerima { reset } untuk meminta centang ulang
 *                 (token hanya bisa dipakai sekali, jadi reset setelah kiriman gagal)
 */
export default function Turnstile(props) {
  let kotak;
  let widgetId;
  let dilepas = false;

  onMount(async () => {
    let turnstile;
    try {
      turnstile = await muatTurnstile();
    } catch {
      props.onToken(null);
      return;
    }
    // komponen sudah ditutup sebelum script selesai dimuat
    if (dilepas) return;

    widgetId = turnstile.render(kotak, {
      sitekey: SITE_KEY,
      language: "id",
      // flexible = lebar mengikuti wadah, jadi tidak melebihi layar HP
      size: "flexible",
      callback: (token) => props.onToken(token),
      "expired-callback": () => props.onToken(null),
      "error-callback": () => props.onToken(null),
    });

    props.ref?.({
      reset: () => {
        props.onToken(null);
        window.turnstile?.reset(widgetId);
      },
    });
  });

  onCleanup(() => {
    dilepas = true;
    if (widgetId !== undefined) window.turnstile?.remove(widgetId);
  });

  // min-h = tempat widget sudah disiapkan agar form tidak "melompat" saat widget muncul
  return <div ref={kotak} className="min-h-[65px]" />;
}
