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
import {
  IconAlert,
  IconClose,
  IconDance,
  IconImage,
  IconLink,
  IconMusic,
} from "./JasaIcons";

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
const POSISI_ITEMS = POSISI_OPTIONS.map((p) => ({ value: p, label: p }));

const JENIS_OPTIONS = [
  { value: "tari", label: "Tari", icon: IconDance },
  { value: "musik", label: "Musik", icon: IconMusic },
];

const LABEL =
  "mb-1.5 block text-[13px] font-semibold text-[#2B1418]";
const HINT = "mt-1.5 text-xs leading-relaxed text-[#8A7F78]";
const FIELD =
  "w-full rounded-lg border border-[#E0D6CC] bg-white px-3.5 text-[13px] text-[#2B1418] transition-colors placeholder:text-[#A39890] hover:border-[#C9B8A8] focus:border-[#4A0E17] focus:outline-none focus:ring-2 focus:ring-[#4A0E17]/15";
const GROUP =
  "flex h-10 w-full items-stretch overflow-hidden rounded-lg border border-[#E0D6CC] bg-white transition-colors hover:border-[#C9B8A8] focus-within:border-[#4A0E17] focus-within:ring-2 focus-within:ring-[#4A0E17]/15";
const GROUP_INPUT =
  "min-w-0 flex-1 bg-transparent px-3 text-[13px] tabular-nums text-[#2B1418] placeholder:text-[#A39890] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
const ADDON =
  "flex shrink-0 items-center bg-[#FAF7F2] px-3 text-xs font-medium text-[#8A7F78] select-none";

function Segmented(props) {
  return (
    <div
      role="group"
      aria-labelledby={props.labelledBy}
      class="flex w-full gap-1 rounded-lg border border-[#E8E0D8] bg-[#FAF7F2] p-1"
    >
      <For each={props.options}>
        {(opt) => {
          const active = () => props.isActive(opt);
          const IconCmp = opt.icon;
          return (
            <button
              type="button"
              aria-pressed={active()}
              onClick={() => props.onSelect(opt)}
              class={`inline-flex h-8 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#4A0E17] ${
                active()
                  ? "bg-[#4A0E17] text-white"
                  : "text-[#6B5F58] hover:bg-white hover:text-[#4A0E17]"
              }`}
            >
              <Show when={IconCmp}>
                <IconCmp size={15} />
              </Show>
              <span>{opt.label}</span>
            </button>
          );
        }}
      </For>
    </div>
  );
}

export default function JasaModal(props) {
  const titleId = createUniqueId();
  const jenisId = createUniqueId();
  const posisiId = createUniqueId();
  const sampulId = createUniqueId();
  const publikHintId = createUniqueId();
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

  const busy = () => props.isUploading || props.isSubmitting;

  return (
    <Show when={props.isOpen}>
      <Portal>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,10,13,0.45)] p-4"
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
            class="flex max-h-[90vh] w-full max-w-[680px] flex-col overflow-hidden rounded-2xl border border-[#E8E0D8] bg-white shadow-[0_24px_48px_-16px_rgba(42,8,13,0.28)]"
          >
            {/* Header */}
            <div class="flex shrink-0 items-center justify-between gap-4 border-b border-[#EDE6DF] bg-white px-6 py-4">
              <h2
                id={titleId}
                class="min-w-0 truncate font-serif text-xl font-bold text-[#2B1418]"
              >
                {props.editingItem
                  ? `Ubah Info · ${props.editingItem.nama}`
                  : "Tambah Jasa Baru"}
              </h2>
              <button
                type="button"
                onClick={() => props.onClose?.()}
                disabled={props.isSubmitting}
                aria-label="Tutup modal"
                class="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#8A7F78] transition-colors hover:bg-[#F4EFEA] hover:text-[#4A0E17] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4A0E17] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <IconClose size={18} />
              </button>
            </div>

            {/* Body */}
            <form
              id="jasa-form"
              onSubmit={(e) => props.onSubmit?.(e)}
              noValidate
              class="flex-1 space-y-5 overflow-y-auto p-6 [scrollbar-color:#DDD2C7_transparent] [scrollbar-width:thin]"
            >
              <Show when={props.formError}>
                <div
                  role="alert"
                  class="flex items-start gap-2.5 rounded-lg border border-[#EBC9C9] bg-[#FBF1F0] px-4 py-3 text-[13px] text-[#8A1F2B]"
                >
                  <IconAlert size={16} class="mt-px shrink-0" />
                  <span>{props.formError}</span>
                </div>
              </Show>

              {/* Row 1: Jenis & Posisi */}
              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <span id={jenisId} class={LABEL}>
                    Jenis Jasa
                  </span>
                  <Segmented
                    labelledBy={jenisId}
                    options={JENIS_OPTIONS}
                    isActive={(opt) =>
                      String(props.formData?.tipe_jasa || "tari").toLowerCase() ===
                      opt.value
                    }
                    onSelect={(opt) => handleSelectJenis(opt.value)}
                  />
                </div>
                <div>
                  <span id={posisiId} class={LABEL}>
                    Posisi Pentas
                  </span>
                  <Segmented
                    labelledBy={posisiId}
                    options={POSISI_ITEMS}
                    isActive={(opt) =>
                      String(props.formData?.posisi_pentas || "Opening").toLowerCase() ===
                      opt.value.toLowerCase()
                    }
                    onSelect={(opt) => props.onChangeField("posisi_pentas", opt.value)}
                  />
                </div>
              </div>

              {/* Row 2: Nama & Provinsi */}
              <div
                class={`grid grid-cols-1 gap-5 ${isTari() ? "sm:grid-cols-2" : ""}`}
              >
                <div>
                  <label for="jasa-nama" class={LABEL}>
                    Nama Jasa
                  </label>
                  <input
                    id="jasa-nama"
                    type="text"
                    placeholder="Contoh: Tari Merak"
                    value={props.formData?.nama || ""}
                    onInput={(e) =>
                      props.onChangeField("nama", e.currentTarget.value)
                    }
                    class={`${FIELD} h-10`}
                  />
                </div>

                <Show when={isTari()}>
                  <div>
                    <label for="jasa-provinsi" class={LABEL}>
                      Asal Provinsi (Kultur)
                    </label>
                    <div class="relative">
                      <select
                        id="jasa-provinsi"
                        aria-describedby="jasa-provinsi-hint"
                        value={
                          props.formData?.id_provinsi != null &&
                          props.formData?.id_provinsi !== ""
                            ? String(props.formData.id_provinsi)
                            : ""
                        }
                        onChange={(e) =>
                          props.onChangeField("id_provinsi", e.currentTarget.value)
                        }
                        class={`${FIELD} h-10 cursor-pointer appearance-none pr-9`}
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
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.75"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8A7F78]"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                    <p id="jasa-provinsi-hint" class={HINT}>
                      Dikelompokkan per pulau
                    </p>
                  </div>
                </Show>
              </div>

              {/* Row 3: Deskripsi */}
              <div>
                <label for="jasa-deskripsi" class={LABEL}>
                  Deskripsi Singkat
                </label>
                <textarea
                  id="jasa-deskripsi"
                  rows={3}
                  placeholder="Ceritakan singkat tentang tarian atau ansambel musik ini..."
                  value={props.formData?.deskripsi || ""}
                  onInput={(e) =>
                    props.onChangeField("deskripsi", e.currentTarget.value)
                  }
                  class={`${FIELD} resize-y py-2.5 leading-relaxed`}
                />
              </div>

              {/* Row 4: Harga */}
              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label for="jasa-harga-min" class={LABEL}>
                    Harga Minimum (Rp)
                  </label>
                  <div class={GROUP}>
                    <span aria-hidden="true" class={`${ADDON} border-r border-[#EDE6DF]`}>
                      Rp
                    </span>
                    <input
                      id="jasa-harga-min"
                      type="number"
                      inputmode="numeric"
                      min="0"
                      placeholder="2500000"
                      value={props.formData?.harga_minimum ?? ""}
                      onInput={(e) =>
                        props.onChangeField("harga_minimum", e.currentTarget.value)
                      }
                      class={GROUP_INPUT}
                    />
                  </div>
                </div>
                <div>
                  <label for="jasa-harga-max" class={LABEL}>
                    Harga Maksimum (Rp)
                  </label>
                  <div class={GROUP}>
                    <span aria-hidden="true" class={`${ADDON} border-r border-[#EDE6DF]`}>
                      Rp
                    </span>
                    <input
                      id="jasa-harga-max"
                      type="number"
                      inputmode="numeric"
                      min="0"
                      placeholder="5000000"
                      value={props.formData?.harga_maximum ?? ""}
                      onInput={(e) =>
                        props.onChangeField("harga_maximum", e.currentTarget.value)
                      }
                      class={GROUP_INPUT}
                    />
                  </div>
                </div>
              </div>

              {/* Row 5: Logistik */}
              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label for="jasa-min-performer" class={LABEL}>
                    Minimal Performer
                  </label>
                  <div class={GROUP}>
                    <input
                      id="jasa-min-performer"
                      type="number"
                      inputmode="numeric"
                      min="1"
                      placeholder="1"
                      aria-describedby="jasa-min-performer-hint"
                      value={props.formData?.min_performer ?? "1"}
                      onInput={(e) =>
                        props.onChangeField("min_performer", e.currentTarget.value)
                      }
                      class={GROUP_INPUT}
                    />
                    <span aria-hidden="true" class={`${ADDON} border-l border-[#EDE6DF]`}>
                      orang
                    </span>
                  </div>
                  <p id="jasa-min-performer-hint" class={HINT}>
                    Penari dan pemusik dihitung bersama
                  </p>
                </div>
                <div>
                  <label for="jasa-durasi" class={LABEL}>
                    Durasi Pertunjukan
                  </label>
                  <div class={GROUP}>
                    <input
                      id="jasa-durasi"
                      type="number"
                      inputmode="numeric"
                      min="1"
                      placeholder="15"
                      value={props.formData?.durasi ?? ""}
                      onInput={(e) =>
                        props.onChangeField("durasi", e.currentTarget.value)
                      }
                      class={GROUP_INPUT}
                    />
                    <span aria-hidden="true" class={`${ADDON} border-l border-[#EDE6DF]`}>
                      menit
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 6: Media & Sampul */}
              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label for="jasa-tautan-media" class={LABEL}>
                    Tautan Video / Media
                  </label>
                  <div class={GROUP}>
                    <span aria-hidden="true" class="flex shrink-0 items-center pl-3 text-[#A39890]">
                      <IconLink size={15} />
                    </span>
                    <input
                      id="jasa-tautan-media"
                      type="url"
                      placeholder="https://youtube.com/watch?v=..."
                      aria-describedby="jasa-tautan-media-hint"
                      value={props.formData?.tautan_media || ""}
                      onInput={(e) =>
                        props.onChangeField("tautan_media", e.currentTarget.value)
                      }
                      class={`${GROUP_INPUT} pl-2.5`}
                    />
                  </div>
                  <p id="jasa-tautan-media-hint" class={HINT}>
                    Satu tautan video atau audio penampilan
                  </p>
                </div>

                <div>
                  <span id={sampulId} class={LABEL}>
                    Foto Sampul
                  </span>
                  <div
                    role="group"
                    aria-labelledby={sampulId}
                    class="flex items-center gap-3 rounded-lg border border-[#E0D6CC] bg-white p-1.5 pr-3"
                  >
                    <div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#EDE6DF] bg-[#FAF7F2] text-[#B5A99F]">
                      <Show
                        when={props.formData?.foto_sampul && !imgError()}
                        fallback={<IconImage size={18} />}
                      >
                        <img
                          src={props.formData.foto_sampul}
                          alt="Pratinjau foto sampul"
                          width="48"
                          height="48"
                          onError={() => setImgError(true)}
                          class="h-full w-full object-cover"
                        />
                      </Show>
                    </div>
                    <div class="min-w-0 flex-1">
                      <label
                        for="jasa-foto-sampul"
                        class={`inline-flex h-8 items-center rounded-md border border-[#D9CCBF] bg-white px-3 text-xs font-semibold text-[#4A0E17] transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#4A0E17] ${
                          busy()
                            ? "cursor-not-allowed opacity-60"
                            : "cursor-pointer hover:border-[#C9B8A8] hover:bg-[#FAF7F2]"
                        }`}
                      >
                        <span>
                          {props.isUploading
                            ? "Mengunggah..."
                            : props.formData?.foto_sampul
                            ? "Ganti Gambar"
                            : "Pilih Gambar"}
                        </span>
                        <input
                          id="jasa-foto-sampul"
                          type="file"
                          accept="image/*"
                          disabled={busy()}
                          onChange={(e) => props.onUploadFile?.(e)}
                          class="sr-only"
                        />
                      </label>
                      <p class="mt-1 truncate text-[11px] text-[#8A7F78]">
                        Tampil di kartu katalog
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 7: Visibilitas publik */}
              <label class="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-[#E8E0D8] bg-[#FAF7F2] px-4 py-3 transition-colors select-none hover:border-[#C9B8A8]">
                <span class="min-w-0">
                  <span class="block text-[13px] font-semibold text-[#2B1418]">
                    Tampilkan di katalog publik
                  </span>
                  <span id={publikHintId} class="mt-0.5 block text-xs text-[#8A7F78]">
                    Jika dimatikan, jasa tetap tersimpan tetapi tidak terlihat pengunjung.
                  </span>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  aria-describedby={publikHintId}
                  checked={Boolean(props.formData?.is_aktif)}
                  onChange={(e) =>
                    props.onChangeField("is_aktif", e.currentTarget.checked)
                  }
                  class="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  class="relative inline-flex h-6 w-10 shrink-0 items-center rounded-full bg-[#D9CCBF] transition-colors peer-checked:bg-[#4A0E17] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#4A0E17] after:absolute after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-[0_1px_2px_rgba(42,8,13,0.25)] after:transition-transform peer-checked:after:translate-x-4"
                />
              </label>
            </form>

            {/* Footer */}
            <div class="flex shrink-0 items-center justify-end gap-2.5 border-t border-[#EDE6DF] bg-[#FAF7F2] px-6 py-4">
              <button
                type="button"
                onClick={() => props.onClose?.()}
                disabled={props.isSubmitting}
                class="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border border-[#D9CCBF] bg-white px-4 text-[13px] font-semibold text-[#4A0E17] transition-colors hover:border-[#C9B8A8] hover:bg-[#F4EFEA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4A0E17] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                form="jasa-form"
                disabled={busy()}
                class="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg bg-[#4A0E17] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#5E1520] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4A0E17] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {props.isSubmitting ? "Menyimpan..." : "Simpan Jasa"}
              </button>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
}
