import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  Show,
} from "solid-js";

const JASA_CONTOH = "Tari Merak";

const API_URL = "http://localhost:3000/api/kontak";

// Normalisasi nomor telepon: buang semua non-digit, lalu "0" di awal -> "62".
// Contoh: "0813-8573-1538" / "+62 813-8573-1538" / "6281385731538" -> "6281385731538".
function normalizePhoneNumber(input) {
  const digits = String(input ?? "").replace(/\D/g, "");
  return digits.replace(/^0/, "62");
}

// Format tampilan: "6281385731538" -> "+62-813-8573-1538".
function formatPhoneNumberDisplay(normalized) {
  const digits = normalized.startsWith("62") ? normalized.slice(2) : normalized;
  if (!digits) return normalized;

  const parts = [digits.slice(0, 3)];
  if (digits.length > 3) parts.push(digits.slice(3, 7));
  if (digits.length > 7) parts.push(digits.slice(7));

  return `+62-${parts.join("-")}`;
}

const inputClass =
  "rounded-md border border-[#DBC0C0] bg-white px-3 py-2 text-[#4A0E17] focus:outline-none focus:ring-2 focus:ring-[#8C7A3E]";

const labelClass = "text-[#8C7A3E] font-bold text-xs uppercase tracking-widest";
const valueClass = "font-bold text-lg text-gray-900";
const helpClass = "text-[#8C7A3E] font-bold text-[10px] mt-1";

function Field(props) {
  return (
    <div>
      <p className={labelClass}>{props.label}</p>
      <p className={`mt-2 ${valueClass}`}>{props.value}</p>
    </div>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  );
}

function KontakModal(props) {
  const pratinjauPesan = () =>
    props.draftTemplatePesan().replace("{jasa}", JASA_CONTOH);

  return (
    <Show when={props.open()}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={props.onClose}
      >
        <div
          className="w-full max-w-lg rounded-xl bg-[#FDFBF9] p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-serif text-xl font-bold text-[#4A0E17]">
              Ubah kontak WhatsApp
            </h2>
            <button
              type="button"
              onClick={props.onClose}
              aria-label="Tutup"
              className="text-[#4A0E17] transition-colors hover:opacity-60"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              props.onSave();
            }}
            className="mt-5 flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <label for="field-nomor" className={labelClass}>
                Nomor WhatsApp
              </label>
              <input
                id="field-nomor"
                type="tel"
                value={props.draftNomor()}
                onInput={(e) => props.setDraftNomor(e.currentTarget.value)}
                class={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label for="field-humas" className={labelClass}>
                Nama Humas
              </label>
              <input
                id="field-humas"
                type="text"
                value={props.draftNamaHumas()}
                onInput={(e) => props.setDraftNamaHumas(e.currentTarget.value)}
                class={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label for="field-template" className={labelClass}>
                Template Pesan
              </label>
              <textarea
                id="field-template"
                rows="4"
                value={props.draftTemplatePesan()}
                onInput={(e) => props.setDraftTemplatePesan(e.currentTarget.value)}
                class={`${inputClass} resize-none`}
              />
              <div className="mt-3 rounded-lg border border-rose-100 bg-rose-50/50 p-3">
                <p className={labelClass}>Pratinjau</p>
                <p className="mt-1.5 text-sm text-gray-900">{pratinjauPesan()}</p>
              </div>
            </div>

            <Show when={props.error()}>
              <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-[#4A0E17]">
                {props.error()}
              </p>
            </Show>

            <div className="mt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={props.onClose}
                className="rounded-md border border-[#4A0E17] px-4 py-2 text-sm font-medium text-[#4A0E17] transition-colors hover:bg-rose-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={props.saving()}
                className="rounded-md bg-[#4A0E17] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5a0c1a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {props.saving() ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Show>
  );
}

export default function InternalKontak() {
  const [nomor, setNomor] = createSignal("");
  const [namaHumas, setNamaHumas] = createSignal("");
  const [templatePesan, setTemplatePesan] = createSignal("");

  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [draftNomor, setDraftNomor] = createSignal("");
  const [draftNamaHumas, setDraftNamaHumas] = createSignal("");
  const [draftTemplatePesan, setDraftTemplatePesan] = createSignal("");

  const [isSaving, setIsSaving] = createSignal(false);
  const [saveError, setSaveError] = createSignal("");

  const fetchKontak = async () => {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Gagal memuat data kontak (status ${response.status})`);
    }
    return await response.json();
  };

  const [kontak, { refetch }] = createResource(fetchKontak);

  // Sinkronkan data dari backend ke sinyal lokal agar UI mengikuti database.
  createEffect(() => {
    const data = kontak();
    if (!data) return;
    setNomor(normalizePhoneNumber(data.nomor_wa));
    setNamaHumas(data.nama_humas);
    setTemplatePesan(data.template_pesan);
  });

  const whatsappLink = createMemo(() => {
    const pesan = templatePesan().replace("{jasa}", JASA_CONTOH);
    return `https://wa.me/${normalizePhoneNumber(nomor())}?text=${encodeURIComponent(pesan)}`;
  });

  const bukaModal = () => {
    setSaveError("");
    setDraftNomor(nomor());
    setDraftNamaHumas(namaHumas());
    setDraftTemplatePesan(templatePesan());
    setIsModalOpen(true);
  };

  const tutupModal = () => setIsModalOpen(false);

  const simpan = async () => {
    setIsSaving(true);
    setSaveError("");
    try {
      const response = await fetch(API_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomor_wa: normalizePhoneNumber(draftNomor()),
          nama_humas: draftNamaHumas(),
          template_pesan: draftTemplatePesan(),
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Gagal menyimpan data kontak (status ${response.status})`,
        );
      }

      const data = await response.json();

      setNomor(data.nomor_wa);
      setNamaHumas(data.nama_humas);
      setTemplatePesan(data.template_pesan);

      await refetch();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Gagal menyimpan kontak WhatsApp:", error);
      setSaveError("Gagal menyimpan perubahan. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#4A0E17]">
            Kontak WhatsApp
          </h1>
        </div>

        <button
          onClick={bukaModal}
          disabled={kontak.loading || Boolean(kontak.error)}
          className="shrink-0 rounded-md bg-[#4A0E17] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#5a0c1a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Ubah kontak
        </button>
      </div>

      <Show
        when={!kontak.loading && !kontak.error}
        fallback={
          <section className="mt-6 rounded-xl border border-[#EEE3DC] bg-[#FDFBF9] p-6 text-sm text-gray-600 shadow-[0_2px_10px_rgba(84,20,29,0.06)] sm:p-8">
            <Show
              when={!kontak.error}
              fallback={
                <div className="flex flex-col items-start gap-3">
                  <p className="font-medium text-[#4A0E17]">
                    Gagal memuat data kontak WhatsApp.
                  </p>
                  <button
                    onClick={() => refetch()}
                    className="rounded-md bg-[#4A0E17] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#5a0c1a]"
                  >
                    Coba lagi
                  </button>
                </div>
              }
            >
              <p>Memuat data kontak…</p>
            </Show>
          </section>
        }
      >
        <section className="mt-6 rounded-xl border border-[#EEE3DC] bg-[#FDFBF9] p-6 shadow-[0_2px_10px_rgba(84,20,29,0.06)] sm:p-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <Field label="Nomor" value={formatPhoneNumberDisplay(nomor())} />
            <Field label="Humas" value={namaHumas()} />
          </div>

          <div className="mt-8">
            <Field label="Template Pesan" value={templatePesan()} />
          </div>

          <div className="mt-8">
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-[#DBC0C0] px-4 py-2 text-sm font-semibold text-[#4A0E17] transition-colors hover:bg-[#FAF7F5]"
            >
              Coba tautan WhatsApp
              <ArrowUpRightIcon />
            </a>
          </div>
        </section>
      </Show>

      <KontakModal
        open={isModalOpen}
        onClose={tutupModal}
        onSave={simpan}
        saving={isSaving}
        error={saveError}
        draftNomor={draftNomor}
        setDraftNomor={setDraftNomor}
        draftNamaHumas={draftNamaHumas}
        setDraftNamaHumas={setDraftNamaHumas}
        draftTemplatePesan={draftTemplatePesan}
        setDraftTemplatePesan={setDraftTemplatePesan}
      />
    </>
  );
}

