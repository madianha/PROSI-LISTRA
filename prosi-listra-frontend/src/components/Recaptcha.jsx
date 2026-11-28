import { onCleanup, onMount } from "solid-js";

const SCRIPT_ID = "google-recaptcha-script";
const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";
let scriptPromise;

function muatRecaptcha() {
  if (window.grecaptcha?.render) return Promise.resolve(window.grecaptcha);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      let script = document.getElementById(SCRIPT_ID);
      if (!script) {
        script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", () => resolve(window.grecaptcha), { once: true });
      script.addEventListener("error", reject, { once: true });
    });
  }
  return scriptPromise;
}

/** Google reCAPTCHA v2 checkbox. props.ref menerima { reset } untuk token yang kedaluwarsa/gagal. */
export default function Recaptcha(props) {
  let kotak;
  let widgetId;
  let dilepas = false;

  onMount(async () => {
    if (!SITE_KEY) {
      props.onToken(null);
      props.onError?.("reCAPTCHA belum dikonfigurasi. Silakan hubungi pengelola situs.");
      return;
    }
    try {
      const recaptcha = await muatRecaptcha();
      if (dilepas) return;
      recaptcha.ready(() => {
        if (dilepas || !kotak) return;
        widgetId = recaptcha.render(kotak, {
          sitekey: SITE_KEY,
          callback: (token) => {
            props.onToken(token);
            props.onError?.("");
          },
          "expired-callback": () => props.onToken(null),
          "error-callback": () => {
            props.onToken(null);
            props.onError?.("reCAPTCHA gagal dimuat. Periksa koneksi lalu coba lagi.");
          },
        });
        props.ref?.({
          reset: () => {
            props.onToken(null);
            recaptcha.reset(widgetId);
          },
        });
      });
    } catch {
      scriptPromise = undefined;
      props.onToken(null);
      props.onError?.("reCAPTCHA gagal dimuat. Periksa koneksi lalu coba lagi.");
    }
  });

  onCleanup(() => {
    dilepas = true;
    if (widgetId !== undefined) window.grecaptcha?.reset?.(widgetId);
  });

  return <div ref={kotak} className="min-h-[78px]" />;
}
