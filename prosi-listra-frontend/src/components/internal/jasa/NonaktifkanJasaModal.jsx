import { createUniqueId, onCleanup, onMount, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { IconClose } from "./JasaIcons";

export default function NonaktifkanJasaModal(props) {
  const titleId = createUniqueId();
  const bodyId = createUniqueId();

  const handleKeyDown = (e) => {
    if (e.key === "Escape" && !props.isSubmitting) {
      props.onBatal?.();
    }
  };

  onMount(() => {
    document.addEventListener("keydown", handleKeyDown);
  });

  onCleanup(() => {
    document.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <Show when={props.jasa}>
      {(selectedJasa) => (
        <Portal>
          <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,10,13,0.45)] p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget && !props.isSubmitting) {
                props.onBatal?.();
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={bodyId}
              class="w-full max-w-[440px] overflow-hidden rounded-2xl border border-[#E8E0D8] bg-white shadow-[0_24px_48px_-16px_rgba(42,8,13,0.28)]"
            >
              <div class="p-6">
                <div class="flex items-start justify-between gap-4">
                  <h2
                    id={titleId}
                    class="font-serif text-xl font-bold text-[#2B1418]"
                  >
                    Nonaktifkan
                  </h2>
                  <button
                    type="button"
                    onClick={() => props.onBatal?.()}
                    disabled={props.isSubmitting}
                    aria-label="Tutup dialog"
                    class="-mr-1.5 -mt-1 inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#8A7F78] transition-colors hover:bg-[#F4EFEA] hover:text-[#4A0E17] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4A0E17] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <IconClose size={18} />
                  </button>
                </div>

                <p id={bodyId} class="mt-3 text-sm leading-relaxed text-[#5C534E]">
                  Sembunyikan{" "}
                  <strong class="font-semibold text-[#2B1418]">
                    {selectedJasa().nama}
                  </strong>{" "}
                  dari katalog publik?
                </p>
                <p class="mt-2 text-xs leading-relaxed text-[#8A7F78]">
                  Data jasa tetap tersimpan dan dapat diaktifkan kembali kapan saja.
                </p>
              </div>

              <div class="flex items-center justify-end gap-2.5 border-t border-[#EDE6DF] bg-[#FAF7F2] px-6 py-4">
                <button
                  type="button"
                  onClick={() => props.onBatal?.()}
                  disabled={props.isSubmitting}
                  class="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border border-[#D9CCBF] bg-white px-4 text-[13px] font-semibold text-[#4A0E17] transition-colors hover:border-[#C9B8A8] hover:bg-[#F4EFEA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4A0E17] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => props.onKonfirmasi?.(selectedJasa())}
                  disabled={props.isSubmitting}
                  class="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg bg-[#4A0E17] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#5E1520] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4A0E17] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {props.isSubmitting ? "Memproses..." : "Nonaktifkan"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </Show>
  );
}
