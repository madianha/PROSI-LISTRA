import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  For,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { Portal } from "solid-js/web";

const ISLAND_ORDER = [
  "Sumatera",
  "Jawa",
  "Bali & Nusa Tenggara",
  "Kalimantan",
  "Sulawesi",
  "Maluku",
  "Papua",
];

const POSISI_OPTIONS = ["Opening", "Middle", "Closing"];

export default function JasaModal(props) {
  const titleId = createUniqueId();
  const [imgError, setImgError] = createSignal(false);

  createEffect(
    on(
      () => props.formData?.foto_sampul,
      () => setImgError(false),
      { defer: true }
    )
  );

  const handleKeyDown = (e) => {
    if (e.key === "Escape" && props.isOpen && !props.isSubmitting) {
      props.onClose?.();
    }
  };

  onMount(() => {
    document.addEventListener("keydown", handleKeyDown);
  });

  onCleanup(() => {
    document.removeEventListener("keydown", handleKeyDown);
  });

  const groupedProvinsi = createMemo(() => {
    const raw =
      typeof props.provinsiList === "function"
        ? props.provinsiList()
        : props.provinsiList;
    const list = Array.isArray(raw) ? raw : [];
    const groupsMap = new Map();

    for (const item of list) {
      const pulau = item.pulau || "Lainnya";
      if (!groupsMap.has(pulau)) {
        groupsMap.set(pulau, []);
      }
      groupsMap.get(pulau).push(item);
    }

    const ordered = [];
    for (const island of ISLAND_ORDER) {
      if (groupsMap.has(island)) {
        ordered.push({ pulau: island, items: groupsMap.get(island) });
        groupsMap.delete(island);
      }
    }
    for (const [pulau, items] of groupsMap.entries()) {
      ordered.push({ pulau, items });
    }
    return ordered;
  });

  const isTari = () =>
    String(props.formData?.tipe_jasa || "tari").toLowerCase() === "tari";

  const handleSelectJenis = (jenis) => {
    const normalized = jenis.toLowerCase();
    props.onChangeField("tipe_jasa", normalized);
    if (normalized === "musik") {
      props.onChangeField("id_provinsi", "");
    }
  };

  return (
    <Show when={props.isOpen}>
      <Portal>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !props.isSubmitting) {
              props.onClose?.();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            class="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#ede0e2] bg-white shadow-2xl"
          >
            {/* Header */}
            <div class="flex shrink-0 items-center justify-between border-b border-[#ede0e2] bg-white px-6 py-4">
              <h2
                id={titleId}
                class="font-serif text-lg font-bold text-[#2b181a]"
              >
                {props.editingItem
                  ? `Ubah info · ${props.editingItem.nama}`
                  : "Tambah jasa baru"}
              </h2>
              <button
                type="button"
                onClick={() => props.onClose?.()}
                disabled={props.isSubmitting}
                aria-label="Tutup modal"
                class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-lg leading-none text-[#7a6668] transition-colors hover:bg-[#fbf2f3] hover:text-[#4a0e17] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a0e17] disabled:cursor-not-allowed disabled:opacity-50"
              >
                ×
              </button>
            </div>

            {/* Form Body */}
            <form
              id="jasa-form"
              onSubmit={(e) => props.onSubmit?.(e)}
              noValidate
              class="flex-1 space-y-4 overflow-y-auto px-6 py-5"
            >
              <Show when={props.formError}>
                <div
                  role="alert"
                  class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-800"
                >
                  {props.formError}
                </div>
              </Show>

              {/* JENIS JASA */}
              <div>
                <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6e5a5c]">
                  JENIS JASA
                </span>
                <div class="inline-flex rounded-xl border border-[#ede0e2] bg-[#fbf8f7] p-1 gap-1">
                  <For
                    each={[
                      { value: "tari", label: "Tari" },
                      { value: "musik", label: "Musik" },
                    ]}
                  >
                    {(opt) => {
                      const active = () =>
                        String(props.formData?.tipe_jasa || "tari").toLowerCase() ===
                        opt.value;
                      return (
                        <button
                          type="button"
                          aria-pressed={active()}
                          onClick={() => handleSelectJenis(opt.value)}
                          class={`inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a0e17] ${
                            active()
                              ? "bg-[#4a0e17] text-white shadow-2xs"
                              : "bg-transparent text-[#4a0e17] hover:bg-white"
                          }`}
                        >
                          <Show when={active()}>
                            <span aria-hidden="true" class="mr-1.5">
                              ✓
                            </span>
                          </Show>
                          <span>{opt.label}</span>
                        </button>
                      );
                    }}
                  </For>
                </div>
              </div>

              {/* Nama jasa */}
              <div>
                <label
                  for="jasa-nama"
                  class="mb-1 block text-xs font-semibold text-[#2b181a]"
                >
                  Nama jasa
                </label>
                <input
                  id="jasa-nama"
                  type="text"
                  placeholder="Gamelan Kreasi Nusantara"
                  value={props.formData?.nama || ""}
                  onInput={(e) =>
                    props.onChangeField("nama", e.currentTarget.value)
                  }
                  class="w-full rounded-xl border border-[#decbcf] bg-white px-3.5 py-2 text-xs text-[#2b181a] placeholder:text-[#9c898b] focus:border-[#4a0e17] focus:outline-none focus:ring-1 focus:ring-[#4a0e17]"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label
                  for="jasa-deskripsi"
                  class="mb-1 block text-xs font-semibold text-[#2b181a]"
                >
                  Deskripsi
                </label>
                <textarea
                  id="jasa-deskripsi"
                  rows={3}
                  placeholder="Deskripsi singkat tarian atau ansambel musik..."
                  value={props.formData?.deskripsi || ""}
                  onInput={(e) =>
                    props.onChangeField("deskripsi", e.currentTarget.value)
                  }
                  class="w-full rounded-xl border border-[#decbcf] bg-white px-3.5 py-2 text-xs leading-relaxed text-[#2b181a] placeholder:text-[#9c898b] focus:border-[#4a0e17] focus:outline-none focus:ring-1 focus:ring-[#4a0e17]"
                />
              </div>

              {/* COCOK UNTUK POSISI PENTAS (PILIH SATU) */}
              <div>
                <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6e5a5c]">
                  COCOK UNTUK POSISI PENTAS (PILIH SATU)
                </span>
                <div class="inline-flex flex-wrap gap-1.5 rounded-xl border border-[#ede0e2] bg-[#fbf8f7] p-1">
                  <For each={POSISI_OPTIONS}>
                    {(pos) => {
                      const active = () =>
                        String(props.formData?.posisi_pentas || "Opening").toLowerCase() ===
                        pos.toLowerCase();
                      return (
                        <button
                          type="button"
                          aria-pressed={active()}
                          onClick={() => props.onChangeField("posisi_pentas", pos)}
                          class={`inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a0e17] ${
                            active()
                              ? "bg-[#4a0e17] text-white shadow-2xs"
                              : "bg-transparent text-[#4a0e17] hover:bg-white"
                          }`}
                        >
                          <Show when={active()}>
                            <span aria-hidden="true" class="mr-1.5">
                              ✓
                            </span>
                          </Show>
                          <span>{pos}</span>
                        </button>
                      );
                    }}
                  </For>
                </div>
              </div>

              {/* Asal provinsi (kultur) - Conditional: ONLY when JENIS JASA is Tari */}
              <Show when={isTari()}>
                <div>
                  <label
                    for="jasa-provinsi"
                    class="mb-1 block text-xs font-semibold text-[#2b181a]"
                  >
                    Asal provinsi (kultur)
                  </label>
                  <select
                    id="jasa-provinsi"
                    value={
                      props.formData?.id_provinsi != null &&
                      props.formData?.id_provinsi !== ""
                        ? String(props.formData.id_provinsi)
                        : ""
                    }
                    onChange={(e) =>
                      props.onChangeField("id_provinsi", e.currentTarget.value)
                    }
                    class="w-full rounded-xl border border-[#decbcf] bg-white px-3.5 py-2 text-xs text-[#2b181a] focus:border-[#4a0e17] focus:outline-none focus:ring-1 focus:ring-[#4a0e17]"
                  >
                    <option value="">Pilih provinsi...</option>
                    <For each={groupedProvinsi()}>
                      {(group) => (
                        <optgroup label={group.pulau}>
                          <For each={group.items}>
                            {(prov) => (
                              <option value={String(prov.id_provinsi)}>
                                {prov.nama_provinsi}
                              </option>
                            )}
                          </For>
                        </optgroup>
                      )}
                    </For>
                  </select>
                  <p class="mt-1 text-[11px] text-[#7a6668]">
                    Dari daftar Provinsi, dikelompokkan per pulau
                  </p>
                </div>
              </Show>

              {/* Pricing & Performer Row (3 columns) */}
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label
                    for="jasa-harga-min"
                    class="mb-1 block text-xs font-semibold text-[#2b181a]"
                  >
                    Harga minimum (Rp)
                  </label>
                  <input
                    id="jasa-harga-min"
                    type="number"
                    min="0"
                    placeholder="2500000"
                    value={props.formData?.harga_minimum ?? ""}
                    onInput={(e) =>
                      props.onChangeField("harga_minimum", e.currentTarget.value)
                    }
                    class="w-full rounded-xl border border-[#decbcf] bg-white px-3.5 py-2 text-xs text-[#2b181a] placeholder:text-[#9c898b] focus:border-[#4a0e17] focus:outline-none focus:ring-1 focus:ring-[#4a0e17]"
                  />
                </div>

                <div>
                  <label
                    for="jasa-harga-max"
                    class="mb-1 block text-xs font-semibold text-[#2b181a]"
                  >
                    Harga maksimum (Rp)
                  </label>
                  <input
                    id="jasa-harga-max"
                    type="number"
                    min="0"
                    placeholder="5000000"
                    value={props.formData?.harga_maximum ?? ""}
                    onInput={(e) =>
                      props.onChangeField("harga_maximum", e.currentTarget.value)
                    }
                    class="w-full rounded-xl border border-[#decbcf] bg-white px-3.5 py-2 text-xs text-[#2b181a] placeholder:text-[#9c898b] focus:border-[#4a0e17] focus:outline-none focus:ring-1 focus:ring-[#4a0e17]"
                  />
                </div>

                <div>
                  <label
                    for="jasa-min-performer"
                    class="mb-1 block text-xs font-semibold text-[#2b181a]"
                  >
                    Minimal performer
                  </label>
                  <input
                    id="jasa-min-performer"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={props.formData?.min_performer ?? "1"}
                    onInput={(e) =>
                      props.onChangeField("min_performer", e.currentTarget.value)
                    }
                    class="w-full rounded-xl border border-[#decbcf] bg-white px-3.5 py-2 text-xs text-[#2b181a] placeholder:text-[#9c898b] focus:border-[#4a0e17] focus:outline-none focus:ring-1 focus:ring-[#4a0e17]"
                  />
                  <p class="mt-1 text-[11px] text-[#7a6668]">
                    Penari dan pemusik dihitung bersama
                  </p>
                </div>
              </div>

              {/* Durasi (menit) */}
              <div>
                <label
                  for="jasa-durasi"
                  class="mb-1 block text-xs font-semibold text-[#2b181a]"
                >
                  Durasi (menit)
                </label>
                <input
                  id="jasa-durasi"
                  type="number"
                  min="1"
                  placeholder="15"
                  value={props.formData?.durasi ?? ""}
                  onInput={(e) =>
                    props.onChangeField("durasi", e.currentTarget.value)
                  }
                  class="w-full rounded-xl border border-[#decbcf] bg-white px-3.5 py-2 text-xs text-[#2b181a] placeholder:text-[#9c898b] focus:border-[#4a0e17] focus:outline-none focus:ring-1 focus:ring-[#4a0e17]"
                />
              </div>

              {/* Tautan media */}
              <div>
                <label
                  for="jasa-tautan-media"
                  class="mb-1 block text-xs font-semibold text-[#2b181a]"
                >
                  Tautan media
                </label>
                <input
                  id="jasa-tautan-media"
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={props.formData?.tautan_media || ""}
                  onInput={(e) =>
                    props.onChangeField("tautan_media", e.currentTarget.value)
                  }
                  class="w-full rounded-xl border border-[#decbcf] bg-white px-3.5 py-2 text-xs text-[#2b181a] placeholder:text-[#9c898b] focus:border-[#4a0e17] focus:outline-none focus:ring-1 focus:ring-[#4a0e17]"
                />
                <p class="mt-1 text-[11px] text-[#7a6668]">
                  Satu tautan saja: video atau audio penampilan. Kartu publik memberi tombol putar.
                </p>
              </div>

              {/* FOTO SAMPUL */}
              <div>
                <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6e5a5c]">
                  FOTO SAMPUL
                </span>
                <div class="flex items-center gap-4 rounded-xl border border-[#ede0e2] bg-[#fbf8f7] p-3">
                  {/* Left: 64x64 preview box */}
                  <div class="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#6e222e]/30 bg-gradient-to-br from-[#4a0e17] via-[#340910] to-[#1d0408]">
                    <Show
                      when={props.formData?.foto_sampul && !imgError()}
                      fallback={
                        <div class="flex h-full w-full flex-col items-center justify-center text-center select-none">
                          <span class="font-serif text-[10px] font-bold tracking-widest text-[#d4af37]">
                            LISTRA
                          </span>
                          <span class="mt-0.5 text-[8px] uppercase tracking-wider text-[#f3e3b2]/70">
                            UNPAR
                          </span>
                        </div>
                      }
                    >
                      <img
                        src={props.formData.foto_sampul}
                        alt="Pratinjau foto sampul"
                        width="64"
                        height="64"
                        onError={() => setImgError(true)}
                        class="h-full w-full object-cover"
                      />
                    </Show>
                  </div>

                  {/* Right: File upload picker */}
                  <div class="min-w-0 flex-1">
                    <label
                      for="jasa-foto-sampul"
                      class="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-[#d9c7ca] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#4a0e17] transition-colors hover:bg-[#fbf2f3] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#4a0e17]"
                    >
                      <span>
                        {props.isUploading
                          ? "Mengunggah..."
                          : props.formData?.foto_sampul
                          ? "Ganti foto sampul"
                          : "Pilih file gambar"}
                      </span>
                      <input
                        id="jasa-foto-sampul"
                        type="file"
                        accept="image/*"
                        disabled={props.isUploading || props.isSubmitting}
                        onChange={(e) => props.onUploadFile?.(e)}
                        class="sr-only"
                      />
                    </label>
                    <p class="mt-1.5 text-[11px] text-[#7a6668]">
                      Diunggah (bukan tautan); tampil di kartu katalog.
                    </p>
                  </div>
                </div>
              </div>

              {/* Checkbox: Tampil di katalog publik */}
              <div class="pt-1">
                <label class="inline-flex cursor-pointer items-center gap-2.5 select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(props.formData?.is_aktif)}
                    onChange={(e) =>
                      props.onChangeField("is_aktif", e.currentTarget.checked)
                    }
                    class="h-4 w-4 cursor-pointer rounded border-[#decbcf] accent-[#4a0e17] focus:ring-[#4a0e17]"
                  />
                  <span class="text-xs font-medium text-[#2b181a]">
                    Tampil di katalog publik
                  </span>
                </label>
              </div>
            </form>

            {/* Footer */}
            <div class="flex shrink-0 items-center justify-end gap-2.5 border-t border-[#ede0e2] bg-[#fbf8f7] px-6 py-3.5">
              <button
                type="button"
                onClick={() => props.onClose?.()}
                disabled={props.isSubmitting}
                class="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-[#d9c7ca] bg-white px-4 py-2 text-xs font-semibold text-[#4a0e17] transition-colors hover:bg-[#fbf2f3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a0e17] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                form="jasa-form"
                disabled={props.isSubmitting || props.isUploading}
                class="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg bg-[#4a0e17] px-5 py-2 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-[#58111a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a0e17] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {props.isSubmitting ? "Menyimpan..." : "Simpan jasa"}
              </button>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
}
