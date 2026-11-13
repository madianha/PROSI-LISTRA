import { createEffect, createResource, For, Show, createSignal, onCleanup, onMount } from "solid-js";
import TestimoniCard from "../components/TestimoniCard";
import CustomHeader from "../components/CustomHeader";
import { listTestimoni, submitTestimoni } from "../api/testimoni";

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";

export default function Testimoni() {
  const [testimoni, { refetch }] = createResource(listTestimoni);
  const [tahap, setTahap] = createSignal("daftar");
  const [captchaToken, setCaptchaToken] = createSignal("");
  const [captchaSiap, setCaptchaSiap] = createSignal(false);
  const [captchaError, setCaptchaError] = createSignal("");
  const [errorKirim, setErrorKirim] = createSignal("");
  const [mengirim, setMengirim] = createSignal(false);
  const [nama, setNama] = createSignal("");
  const [instansi, setInstansi] = createSignal("");
  const [acara, setAcara] = createSignal("");
  const [privat, setPrivat] = createSignal(false);
  const [isi, setIsi] = createSignal("");
  const [rating, setRating] = createSignal(5);
  let captchaContainer;
  let captchaWidget;
  let captchaScript;

  const renderCaptcha = () => {
    if (tahap() !== "captcha" || !captchaSiap() || !captchaContainer || captchaWidget !== undefined) return;
    if (!window.grecaptcha?.render) return;
    captchaWidget = window.grecaptcha.render(captchaContainer, {
      sitekey: SITE_KEY,
      callback: (token) => {
        setCaptchaToken(token);
        setCaptchaError("");
      },
      "expired-callback": () => setCaptchaToken(""),
      "error-callback": () => setCaptchaError("CAPTCHA gagal dimuat. Periksa koneksi lalu coba lagi."),
    });
  };

  onMount(() => {
    if (!SITE_KEY) {
      setCaptchaError("CAPTCHA belum dikonfigurasi. Silakan hubungi pengelola situs.");
      return;
    }
    if (window.grecaptcha?.render) {
      setCaptchaSiap(true);
      return;
    }

    window.onListraCaptchaLoaded = () => setCaptchaSiap(true);
    captchaScript = document.createElement("script");
    captchaScript.src = "https://www.google.com/recaptcha/api.js?onload=onListraCaptchaLoaded&render=explicit";
    captchaScript.async = true;
    captchaScript.defer = true;
    captchaScript.onerror = () => setCaptchaError("CAPTCHA gagal dimuat. Periksa koneksi lalu coba lagi.");
    document.head.appendChild(captchaScript);
  });

  createEffect(renderCaptcha);
  onCleanup(() => {
    if (captchaWidget !== undefined) window.grecaptcha?.reset?.(captchaWidget);
    if (captchaScript?.parentNode) captchaScript.parentNode.removeChild(captchaScript);
    delete window.onListraCaptchaLoaded;
  });

  const mulaiMenulis = () => {
    setCaptchaError("");
    setCaptchaToken("");
    if (captchaWidget !== undefined) window.grecaptcha?.reset?.(captchaWidget);
    setTahap("captcha");
  };

  const lanjutKeForm = () => {
    if (!captchaToken()) {
      setCaptchaError("Centang reCAPTCHA terlebih dahulu untuk melanjutkan.");
      return;
    }
    setTahap("form");
  };

  const kirim = async (event) => {
    event.preventDefault();
    setErrorKirim("");
    setMengirim(true);
    try {
      await submitTestimoni({
        nama_klien: nama(),
        instansi: instansi(),
        nama_acara: acara(),
        is_acara_privat: privat(),
        isi_testimoni: isi(),
        rating: Number(rating()),
        captcha_token: captchaToken(),
      });
      setTahap("sukses");
      refetch();
    } catch (error) {
      setErrorKirim(error.message || "Testimoni gagal dikirim. Silakan coba lagi.");
      setCaptchaToken("");
      if (captchaWidget !== undefined) window.grecaptcha?.reset?.(captchaWidget);
      setTahap("captcha");
    } finally {
      setMengirim(false);
    }
  };

  return (
    <div>
      <CustomHeader category="Apa Kata Mereka" pageName="Testimoni Klien" colorText="text-white">
        <button
          type="button"
          onClick={mulaiMenulis}
          className="mt-2 rounded-lg bg-[#dfb83b] px-5 py-2.5 text-sm font-semibold text-[#3d1017] shadow transition hover:bg-[#edca5d]"
        >
          + Tulis Testimoni
        </button>
      </CustomHeader>

      <Show when={tahap() === "captcha"}>
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4" role="presentation" onClick={(event) => event.target === event.currentTarget && setTahap("daftar")}>
          <section role="dialog" aria-modal="true" aria-labelledby="captcha-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <h2 id="captcha-title" className="font-serif text-2xl font-bold text-[#54141d]">Verifikasi keamanan</h2>
            <p className="mt-2 text-sm leading-6 text-[#7d6966]">Selesaikan verifikasi berikut sebelum menulis testimoni.</p>
            <Show when={SITE_KEY}>
              <div ref={captchaContainer} className="mt-5 min-h-[78px]" />
            </Show>
            <Show when={captchaError()}><p role="alert" className="mt-2 text-sm text-red-700">{captchaError()}</p></Show>
            <Show when={errorKirim()}><p role="alert" className="mt-2 text-sm text-red-700">{errorKirim()}</p></Show>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setTahap("daftar")} className="min-h-11 rounded-lg px-4 text-sm font-semibold text-[#685856] hover:bg-[#f5efeb]">Batal</button>
              <button type="button" onClick={lanjutKeForm} disabled={!captchaToken()} className="min-h-11 rounded-lg bg-[#dfb83b] px-5 text-sm font-semibold text-[#3d1017] enabled:hover:bg-[#edca5d] disabled:cursor-not-allowed disabled:opacity-50">Lanjut</button>
            </div>
          </section>
        </div>
      </Show>

      <Show when={tahap() === "form"}>
        <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-black/45 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="form-title" className="my-auto w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <h2 id="form-title" className="font-serif text-2xl font-bold text-[#54141d]">Tulis Testimoni</h2>
            <p className="mt-2 text-sm text-[#7d6966]">Ceritakan pengalaman Anda bersama LISTRA.</p>
            <form className="mt-5 space-y-4" onSubmit={kirim}>
              <label className="block text-sm font-medium text-[#54141d]">Nama <span className="text-red-600">*</span>
                <input required maxLength="100" value={nama()} onInput={(event) => setNama(event.currentTarget.value)} className="mt-1 min-h-11 w-full rounded-lg border border-[#e6cfcf] px-3 font-normal text-[#302929] outline-none focus:border-[#967510] focus:ring-2 focus:ring-[#dfb83b]/30" />
              </label>
              <label className="block text-sm font-medium text-[#54141d]">Instansi <span className="font-normal text-[#9b8885]">(opsional)</span>
                <input maxLength="150" value={instansi()} onInput={(event) => setInstansi(event.currentTarget.value)} className="mt-1 min-h-11 w-full rounded-lg border border-[#e6cfcf] px-3 font-normal text-[#302929] outline-none focus:border-[#967510] focus:ring-2 focus:ring-[#dfb83b]/30" />
              </label>
              <label className="block text-sm font-medium text-[#54141d]">Nama acara <span className="font-normal text-[#9b8885]">(opsional)</span>
                <input maxLength="150" value={acara()} onInput={(event) => setAcara(event.currentTarget.value)} className="mt-1 min-h-11 w-full rounded-lg border border-[#e6cfcf] px-3 font-normal text-[#302929] outline-none focus:border-[#967510] focus:ring-2 focus:ring-[#dfb83b]/30" />
              </label>
              <label className="flex items-center gap-2 text-sm text-[#6d5554]">
                <input type="checkbox" checked={privat()} onChange={(event) => setPrivat(event.currentTarget.checked)} className="h-4 w-4 accent-[#8a1423]" /> Acara bersifat privat
              </label>
              <label className="block text-sm font-medium text-[#54141d]">Rating
                <select value={rating()} onChange={(event) => setRating(event.currentTarget.value)} className="mt-1 min-h-11 w-full rounded-lg border border-[#e6cfcf] bg-white px-3 font-normal text-[#302929] outline-none focus:border-[#967510]">
                  <option value="5">★★★★★ — Sangat puas</option>
                  <option value="4">★★★★☆ — Puas</option>
                  <option value="3">★★★☆☆ — Cukup</option>
                  <option value="2">★★☆☆☆ — Kurang</option>
                  <option value="1">★☆☆☆☆ — Tidak puas</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-[#54141d]">Testimoni <span className="text-red-600">*</span>
                <textarea required maxLength="3000" rows="4" value={isi()} onInput={(event) => setIsi(event.currentTarget.value)} className="mt-1 w-full rounded-lg border border-[#e6cfcf] p-3 font-normal leading-5 text-[#302929] outline-none focus:border-[#967510] focus:ring-2 focus:ring-[#dfb83b]/30" />
                <span className="mt-1 block text-right text-xs font-normal text-[#9b8885]">{isi().length}/3000</span>
              </label>
              <Show when={errorKirim()}><p role="alert" className="text-sm text-red-700">{errorKirim()}</p></Show>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" disabled={mengirim()} onClick={() => setTahap("daftar")} className="min-h-11 rounded-lg px-4 text-sm font-semibold text-[#685856] hover:bg-[#f5efeb]">Batal</button>
                <button type="submit" disabled={mengirim()} className="min-h-11 rounded-lg bg-[#dfb83b] px-5 text-sm font-semibold text-[#3d1017] hover:bg-[#edca5d] disabled:opacity-60">{mengirim() ? "Mengirim..." : "Kirim Testimoni"}</button>
              </div>
            </form>
          </section>
        </div>
      </Show>

      <Show when={tahap() === "sukses"}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="success-title" className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-2xl sm:p-9">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#edf7ed] text-3xl text-[#318044]" aria-hidden="true">✓</div>
            <h2 id="success-title" className="mt-4 font-serif text-2xl font-bold text-[#54141d]">Testimoni terkirim</h2>
            <p className="mt-3 text-sm leading-6 text-[#7d6966]">Terima kasih telah berbagi pengalaman bersama LISTRA. Testimoni Anda akan ditinjau sebelum ditampilkan.</p>
            <button type="button" onClick={() => setTahap("daftar")} className="mt-6 min-h-11 rounded-lg bg-[#dfb83b] px-6 text-sm font-semibold text-[#3d1017] hover:bg-[#edca5d]">Kembali ke testimoni</button>
          </section>
        </div>
      </Show>

      <div className="px-6 py-7">
        <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Show when={testimoni.loading}><p className="text-sm text-[#7d6966]">Memuat testimoni...</p></Show>
          <Show when={testimoni.error}><p className="text-sm text-red-700">Testimoni belum bisa dimuat. Coba lagi nanti.</p></Show>
          <Show when={!testimoni.loading && !testimoni.error && testimoni()?.length === 0}><p className="text-sm text-[#7d6966]">Belum ada testimoni yang ditampilkan.</p></Show>
          <For each={testimoni() || []}>{(row) => <TestimoniCard {...row} />}</For>
        </div>
      </div>
    </div>
  );
}
