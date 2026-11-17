import { createUniqueId, onCleanup, onMount, Show } from "solid-js";
import { Portal } from "solid-js/web";

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
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
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
              class="w-full max-w-md overflow-hidden rounded-2xl border border-[#ede0e2] bg-white shadow-xl"
            >
              {/* Modal Header */}
              <div class="flex items-center justify-between border-b border-[#ede0e2] px-6 py-4">
                <h2
                  id={titleId}
                  class="font-serif text-lg font-bold text-[#2b181a]"
                >
                  Nonaktifkan
                </h2>
                <button
                  type="button"
                  onClick={() => props.onBatal?.()}
                  disabled={props.isSubmitting}
                  aria-label="Tutup dialog"
                  class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-lg leading-none text-[#7a6668] transition-colors hover:bg-[#fbf2f3] hover:text-[#4a0e17] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a0e17] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ×
                </button>
              </div>

              {/* Modal Body */}
              <div class="px-6 py-5">
                <p id={bodyId} class="text-sm leading-relaxed text-[#463638]">
                  Sembunyikan{" "}
                  <strong class="font-semibold text-[#2b181a]">
                    {selectedJasa().nama}
                  </strong>{" "}
                  dari katalog publik?
                </p>
              </div>

              {/* Modal Footer */}
              <div class="flex items-center justify-end gap-2.5 border-t border-[#ede0e2] bg-[#fbf8f7] px-6 py-3.5">
                <button
                  type="button"
                  onClick={() => props.onBatal?.()}
                  disabled={props.isSubmitting}
                  class="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-[#d9c7ca] bg-white px-4 py-2 text-xs font-semibold text-[#4a0e17] transition-colors hover:bg-[#fbf2f3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a0e17] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => props.onKonfirmasi?.(selectedJasa())}
                  disabled={props.isSubmitting}
                  class="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg bg-[#4a0e17] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-[#58111a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a0e17] disabled:cursor-not-allowed disabled:opacity-60"
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
