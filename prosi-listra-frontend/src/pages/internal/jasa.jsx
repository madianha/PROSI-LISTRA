import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  Match,
  on,
  onCleanup,
  Show,
  Switch,
} from "solid-js";
import {
  IconAlert,
  IconEye,
  IconEyeOff,
  IconPencil,
  IconPlay,
  IconPlus,
  IconSearch,
} from "../../components/internal/jasa/JasaIcons";
import JasaModal from "../../components/internal/jasa/JasaModal";
import NonaktifkanJasaModal from "../../components/internal/jasa/NonaktifkanJasaModal";
import {
  createJasa,
  getProvinsiList,
  listJasa,
  toggleStatusJasa,
  updateJasa,
  uploadSampulJasa,
} from "../../api/jasa";
import { useJudulHalaman } from "../../utils/judulHalaman";

const FILTER_CATEGORIES = ["Semua", "Tari", "Musik"];

const INITIAL_FORM = {
  tipe_jasa: "tari",
  nama: "",
  deskripsi: "",
  kecocokan: ["Opening"],
  id_provinsi: "",
  harga_minimum: "",
  harga_maximum: "",
  min_performer: "1",
  durasi: "",
  link_media: "",
  link_image: "",
  is_aktif: true,
};

const rupiahFormatter = new Intl.NumberFormat("id-ID");

export function formatRupiahRange(min, max) {
  const minVal = Number(min ?? 0);
  const maxVal = Number(max ?? 0);
  return `Rp ${rupiahFormatter.format(minVal)} – Rp ${rupiahFormatter.format(maxVal)}`;
}

export function formatEyebrowBudaya(item) {
  const tipe = String(item?.tipe_jasa || "tari").toLowerCase();
  const prov = (item?.nama_provinsi || "").trim();
  // jasa tanpa baris jasa_kecocokan tidak diberi posisi (dulu jatuh ke "Opening" yang tidak ada di database)
  const kecocokan = Array.isArray(item?.kecocokan) ? item.kecocokan : [];

  const parts = [tipe === "musik" ? "MUSIK" : "TARI"];
  if (tipe === "tari" && prov && prov.toLowerCase() !== "nusantara") {
    parts.push(prov.toUpperCase());
  }
  if (kecocokan.length > 0) parts.push(kecocokan.join(", ").toUpperCase());
  return parts.join(" · ");
}

function JasaThumbnail(props) {
  const [broken, setBroken] = createSignal(false);
  const src = () => props.item?.link_image || "";
  const mediaUrl = () => props.item?.link_media || "";

  createEffect(
    on(
      src,
      () => setBroken(false),
      { defer: true }
    )
  );

  const frameClass = () =>
    `relative block h-16 w-16 shrink-0 overflow-hidden rounded-[10px] border border-[#EAE2DA] bg-[#F3ECE4] ${
      props.muted ? "opacity-60 grayscale-[35%]" : ""
    }`;

  const image = () => (
    <Show
      when={src() && !broken()}
      fallback={
        <div class="flex h-full w-full items-center justify-center bg-[#4A0E17] select-none">
          <span class="font-serif text-[10px] font-bold tracking-[0.12em] text-[#D9BE94]">
            LISTRA
          </span>
        </div>
      }
    >
      <img
        src={src()}
        alt={props.item?.nama || "Foto sampul jasa"}
        width="64"
        height="64"
        loading="lazy"
        onError={() => setBroken(true)}
        class="h-full w-full object-cover"
      />
    </Show>
  );

  return (
    <Show
      when={mediaUrl()}
      fallback={<div class={frameClass()}>{image()}</div>}
    >
      <a
        href={mediaUrl()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Putar media ${props.item?.nama || "jasa"}`}
        title="Buka tautan media di tab baru"
        class={`group ${frameClass()} cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4A0E17]`}
      >
        {image()}
        <span
          aria-hidden="true"
          class="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <span class="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(42,8,13,0.72)] pl-px text-white ring-1 ring-white/25 backdrop-blur-[2px] transition-transform duration-150 group-hover:scale-110">
            <IconPlay size={11} />
          </span>
        </span>
      </a>
    </Show>
  );
}

export default function InternalJasa() {
  useJudulHalaman(() => "Katalog Jasa");

  const [search, setSearch] = createSignal("");
  const [debouncedSearch, setDebouncedSearch] = createSignal("");
  const [activeCategory, setActiveCategory] = createSignal("Semua");

  let searchTimeoutId = null;

  const handleSearchInput = (value) => {
    setSearch(value);
    if (searchTimeoutId) clearTimeout(searchTimeoutId);
    searchTimeoutId = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
  };

  onCleanup(() => {
    if (searchTimeoutId) clearTimeout(searchTimeoutId);
  });

  const [provinsiResource] = createResource(getProvinsiList);
  const [jasaResource, { refetch: refetchJasa, mutate: mutateJasa }] =
    createResource(() => listJasa({ includeInactive: true }));

  const [isFormModalOpen, setIsFormModalOpen] = createSignal(false);
  const [editingItem, setEditingItem] = createSignal(null);
  const [formData, setFormData] = createSignal({ ...INITIAL_FORM });
  const [formError, setFormError] = createSignal("");
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [isUploading, setIsUploading] = createSignal(false);

  const [nonaktifkanTarget, setNonaktifkanTarget] = createSignal(null);
  const [updatingStatusId, setUpdatingStatusId] = createSignal(null);
  const [globalError, setGlobalError] = createSignal("");

  const filteredJasa = createMemo(() => {
    const items = Array.isArray(jasaResource()) ? jasaResource() : [];
    const cat = activeCategory().toLowerCase();
    const q = debouncedSearch().trim().toLowerCase();

    return items.filter((item) => {
      const tipe = String(item.tipe_jasa || "").toLowerCase();
      if (cat !== "semua" && tipe !== cat) {
        return false;
      }
      if (q) {
        const namaMatch = String(item.nama || "")
          .toLowerCase()
          .includes(q);
        const provMatch = String(item.nama_provinsi || "")
          .toLowerCase()
          .includes(q);
        if (!namaMatch && !provMatch) {
          return false;
        }
      }
      return true;
    });
  });

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ ...INITIAL_FORM, kecocokan: ["Opening"] });
    setFormError("");
    setIsFormModalOpen(true);
  };

  const openEditModal = (item) => {
    const tipe = String(item.tipe_jasa || "tari").toLowerCase();
    const posisiList = item.kecocokan?.length ? [...item.kecocokan] : ["Opening"];

    setEditingItem(item);
    setFormData({
      tipe_jasa: tipe === "musik" ? "musik" : "tari",
      nama: item.nama || "",
      deskripsi: item.deskripsi || "",
      kecocokan: posisiList,
      id_provinsi:
        tipe === "tari" && item.id_provinsi != null
          ? String(item.id_provinsi)
          : "",
      harga_minimum:
        item.harga_minimum != null ? String(Number(item.harga_minimum)) : "",
      harga_maximum:
        item.harga_maximum != null ? String(Number(item.harga_maximum)) : "",
      min_performer:
        item.min_performer != null ? String(Number(item.min_performer)) : "1",
      durasi: item.durasi != null ? String(Number(item.durasi)) : "",
      link_media: item.link_media || "",
      link_image: item.link_image || "",
      is_aktif: item.is_aktif ?? true,
    });
    setFormError("");
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingItem(null);
    setFormData({ ...INITIAL_FORM });
    setFormError("");
  };

  const handleFieldChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleUploadFile = async (e) => {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = "";
    if (!file) return;

    setIsUploading(true);
    setFormError("");
    try {
      const uploadedLocation = await uploadSampulJasa(file);
      handleFieldChange("link_image", uploadedLocation);
    } catch (err) {
      setFormError(err?.message || "Gagal mengunggah foto sampul.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError("");

    const data = formData();
    const tipe_jasa = String(data.tipe_jasa || "tari").toLowerCase();
    const nama = String(data.nama || "").trim();

    if (!nama) {
      setFormError("Nama jasa wajib diisi.");
      return;
    }

    if (tipe_jasa === "tari" && !data.id_provinsi) {
      setFormError("Asal provinsi wajib dipilih untuk jasa Tari.");
      return;
    }

    const hargaMin = Number(data.harga_minimum);
    const hargaMax = Number(data.harga_maximum);
    if (
      data.harga_minimum === "" ||
      !Number.isFinite(hargaMin) ||
      hargaMin < 0
    ) {
      setFormError("Tolong masukkan nominal harga minimum.");
      return;
    }
    if (
      data.harga_maximum === "" ||
      !Number.isFinite(hargaMax) ||
      hargaMax < 0
    ) {
      setFormError("Tolong masukkan nominal harga maksimum.");
      return;
    }
    if (hargaMax < hargaMin) {
      setFormError("Harga maksimum tidak boleh lebih kecil dari harga minimum.");
      return;
    }

    const minPerformer = Number(data.min_performer);
    if (!Number.isInteger(minPerformer) || minPerformer < 1) {
      setFormError("Minimal performer harus minimal 1 orang.");
      return;
    }

    const durasi = Number(data.durasi);
    if (data.durasi === "" || !Number.isInteger(durasi) || durasi <= 0) {
      setFormError("Tolong isi durasi pertunjukan (menit) terlebih dahulu.");
      return;
    }

    const tautanMedia = String(data.link_media || "").trim();
    if (tautanMedia && !/^https?:\/\/.+/i.test(tautanMedia)) {
      setFormError("Tautan media harus berupa URL yang valid (http:// atau https://).");
      return;
    }

    const posisiPentas = Array.isArray(data.kecocokan) ? data.kecocokan : [];

    if (posisiPentas.length === 0) {
      setFormError("Pilih minimal satu posisi pentas.");
      return;
    }

    const payload = {
      tipe_jasa,
      nama,
      deskripsi: String(data.deskripsi || "").trim(),
      kecocokan: posisiPentas,
      id_provinsi: tipe_jasa === "tari" ? Number(data.id_provinsi) : null,
      harga_minimum: hargaMin,
      harga_maximum: hargaMax,
      min_performer: minPerformer,
      durasi,
      link_media: tautanMedia || null,
      link_image: String(data.link_image || "").trim() || null,
      is_aktif: Boolean(data.is_aktif),
    };

    setIsSubmitting(true);
    try {
      const currentEdit = editingItem();
      if (currentEdit) {
        const updated = await updateJasa(currentEdit.id_jasa, payload);
        mutateJasa((prev) =>
          Array.isArray(prev)
            ? prev.map((j) =>
                j.id_jasa === currentEdit.id_jasa ? updated : j
              )
            : [updated]
        );
      } else {
        const created = await createJasa(payload);
        mutateJasa((prev) =>
          Array.isArray(prev) ? [...prev, created] : [created]
        );
      }
      closeFormModal();
    } catch (err) {
      setFormError(err?.message || "Gagal menyimpan data jasa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmNonaktifkan = async (item) => {
    if (!item) return;
    setUpdatingStatusId(item.id_jasa);
    setGlobalError("");
    try {
      const updated = await toggleStatusJasa(item.id_jasa, false);
      mutateJasa((prev) =>
        Array.isArray(prev)
          ? prev.map((j) => (j.id_jasa === item.id_jasa ? updated : j))
          : []
      );
      setNonaktifkanTarget(null);
    } catch (err) {
      setGlobalError(err?.message || "Gagal menonaktifkan jasa.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleAktifkanLangsung = async (item) => {
    if (!item) return;
    setUpdatingStatusId(item.id_jasa);
    setGlobalError("");
    try {
      const updated = await toggleStatusJasa(item.id_jasa, true);
      mutateJasa((prev) =>
        Array.isArray(prev)
          ? prev.map((j) => (j.id_jasa === item.id_jasa ? updated : j))
          : []
      );
    } catch (err) {
      setGlobalError(err?.message || "Gagal mengaktifkan jasa.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const resetFilter = () => {
    if (searchTimeoutId) clearTimeout(searchTimeoutId);
    setSearch("");
    setDebouncedSearch("");
    setActiveCategory("Semua");
  };

  const secondaryBtn =
    "inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#D9CCBF] bg-white px-3.5 text-[13px] font-semibold text-[#4A0E17] transition-colors hover:border-[#C9B8A8] hover:bg-[#FAF7F2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4A0E17] disabled:cursor-not-allowed disabled:opacity-50";

  const editBtnClass =
    "inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#C8BCB0] bg-white px-3.5 text-[13px] font-semibold text-[#2A080D] transition-colors hover:border-[#8C6239] hover:bg-[#F7F3EE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4A0E17] disabled:cursor-not-allowed disabled:opacity-50";

  const deactivateBtnClass =
    "inline-flex h-10 w-[136px] cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#6E1B27] bg-[#6E1B27] px-3.5 text-[13px] font-semibold text-white transition-colors hover:border-[#58141E] hover:bg-[#58141E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4A0E17] disabled:cursor-not-allowed disabled:opacity-50";

  const activateBtnClass =
    "inline-flex h-10 w-[136px] cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#2D6A4F] bg-[#2D6A4F] px-3.5 text-[13px] font-semibold text-white transition-colors hover:border-[#23533E] hover:bg-[#23533E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4A0E17] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div class="mx-auto max-w-6xl rounded-2xl bg-[#FAF7F2] px-4 py-6 sm:px-8 sm:py-8">
      {/* Header */}
      <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div class="min-w-0">
          <h1 class="font-serif text-[28px] font-bold leading-tight text-[#4A0E17] sm:text-[32px]">
            Katalog Jasa
          </h1>
          <p class="mt-1.5 max-w-xl text-sm font-medium leading-relaxed text-[#4A433E]">
            Kelola daftar pertunjukan tari dan musik untuk katalog publik LISTRA
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          class="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 self-start rounded-lg bg-[#4A0E17] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#5E1520] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4A0E17] sm:self-auto"
        >
          <IconPlus size={16} />
          <span>Tambah Jasa Baru</span>
        </button>
      </header>

      <Show when={globalError()}>
        <div
          role="alert"
          class="mt-6 flex items-start gap-2.5 rounded-xl border border-[#EBC9C9] bg-[#FBF1F0] px-4 py-3 text-[13px] text-[#8A1F2B]"
        >
          <IconAlert size={16} class="mt-px shrink-0" />
          <span>{globalError()}</span>
        </div>
      </Show>

      {/* Toolbar */}
      <div class="mt-7 flex flex-col gap-3 border-y border-[#E8E0D8] py-4 md:flex-row md:items-center md:justify-between">
        <div class="relative w-full md:max-w-[420px] md:flex-1">
          <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9A8E86]">
            <IconSearch size={16} />
          </span>
          <input
            type="search"
            aria-label="Cari nama jasa atau asal provinsi"
            placeholder="Cari nama jasa atau asal provinsi..."
            value={search()}
            onInput={(e) => handleSearchInput(e.currentTarget.value)}
            class="h-10 w-full rounded-lg border border-[#E8E0D8] bg-white pl-10 pr-4 text-[13px] text-[#2B1418] transition-colors placeholder:text-[#9A8E86] hover:border-[#C9B8A8] focus:border-[#4A0E17] focus:outline-none focus:ring-2 focus:ring-[#4A0E17]/15"
          />
        </div>

        <div class="flex items-center justify-between gap-3 md:justify-end">
          <div
            role="group"
            aria-label="Filter kategori jasa"
            class="inline-flex items-center gap-0.5 rounded-lg border border-[#E8E0D8] bg-white p-1"
          >
            <For each={FILTER_CATEGORIES}>
              {(cat) => {
                const isSelected = () => activeCategory() === cat;
                return (
                  <button
                    type="button"
                    aria-pressed={isSelected()}
                    onClick={() => setActiveCategory(cat)}
                    class={`inline-flex h-8 cursor-pointer items-center justify-center rounded-md px-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#4A0E17] ${
                      isSelected()
                        ? "bg-[#4A0E17] text-white"
                        : "text-[#6B5F58] hover:bg-[#FAF7F2] hover:text-[#4A0E17]"
                    }`}
                  >
                    {cat}
                  </button>
                );
              }}
            </For>
          </div>
          <span
            aria-live="polite"
            class="inline-flex h-8 items-center whitespace-nowrap rounded-md border border-[#E8E0D8] bg-white px-3 text-xs font-semibold tabular-nums text-[#8C6239]"
          >
            {`${filteredJasa().length} Jasa`}
          </span>
        </div>
      </div>

      {/* Daftar jasa */}
      <div class="mt-5">
        <Switch>
          <Match when={jasaResource.loading && !jasaResource()}>
            <p class="rounded-xl border border-dashed border-[#E8E0D8] px-6 py-14 text-center text-[13px] text-[#6B5F58]">
              Memuat katalog jasa...
            </p>
          </Match>

          <Match when={jasaResource.error && !jasaResource()}>
            <div class="rounded-xl border border-dashed border-[#E8E0D8] px-6 py-14 text-center">
              <p class="text-[13px] text-[#6B5F58]">
                Gagal memuat katalog jasa dari server. Periksa koneksi lalu muat ulang.
              </p>
              <button
                type="button"
                onClick={() => refetchJasa()}
                class={`${secondaryBtn} mt-4`}
              >
                Coba lagi
              </button>
            </div>
          </Match>

          <Match when={filteredJasa().length === 0}>
            <div class="rounded-xl border border-dashed border-[#E8E0D8] px-6 py-14 text-center">
              <p class="text-[13px] text-[#6B5F58]">
                Tidak ada jasa yang cocok dengan pencarian atau filter.
              </p>
              <button type="button" onClick={resetFilter} class={`${secondaryBtn} mt-4`}>
                Tampilkan semua jasa
              </button>
            </div>
          </Match>

          <Match when={filteredJasa().length > 0}>
            <ul class="space-y-2.5">
              <For each={filteredJasa()}>
                {(item) => {
                  const isBusy = () => updatingStatusId() === item.id_jasa;

                  return (
                    <li class="flex flex-col gap-4 rounded-xl border border-[#EAE2DA] bg-white px-5 py-4 transition-colors duration-150 hover:border-[#C9B8A8] md:flex-row md:items-center md:gap-6">
                      {/* Kiri + tengah: thumbnail dan info */}
                      <div class="flex min-w-0 flex-1 items-start gap-4">
                        <JasaThumbnail item={item} muted={!item.is_aktif} />

                        <div class="min-w-0 flex-1">
                          <div class="flex min-h-[24px] items-center gap-2">
                            <p class="truncate text-[11px] font-bold uppercase tracking-[0.06em] text-[#7C532E]">
                              {formatEyebrowBudaya(item)}
                            </p>
                            <Show when={item.is_aktif === false}>
                              <span class="inline-flex items-center rounded border border-[#E2D9D0] bg-[#F4EFEA] px-1.5 py-0.5 text-[11px] font-medium leading-none text-[#7A6E66]">
                                Nonaktif
                              </span>
                            </Show>
                          </div>

                          <h2 class="mt-1 truncate font-serif text-[17px] font-bold leading-snug text-[#2A080D]">
                            {item.nama}
                          </h2>
                          <p class="mt-1 line-clamp-2 text-sm font-medium leading-[1.5] text-[#3D3734]">
                            {item.deskripsi || "Belum ada deskripsi."}
                          </p>
                          <p class="mt-1.5 text-xs font-medium tabular-nums text-[#574F4A]">
                            Min. {item.min_performer ?? 1} performer · {item.durasi ?? 0} menit
                          </p>
                        </div>
                      </div>

                      {/* Kanan: harga dan aksi */}
                      <div class="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-t border-[#F1EBE5] pt-3 md:shrink-0 md:flex-nowrap md:justify-end md:border-t-0 md:pt-0">
                        <div class="rounded-[10px] border border-[#DDD3C9] bg-[#FAF7F2] px-3.5 py-2 text-left md:text-right">
                          <span class="block text-[11px] font-semibold text-[#6B625C]">
                            Estimasi Harga
                          </span>
                          <span class="mt-0.5 block whitespace-nowrap text-sm font-bold tabular-nums text-[#2A080D]">
                            {formatRupiahRange(item.harga_minimum, item.harga_maximum)}
                          </span>
                        </div>

                        <div class="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            disabled={isBusy()}
                            class={editBtnClass}
                          >
                            <IconPencil size={14} />
                            <span>Ubah Info</span>
                          </button>

                          <Show
                            when={item.is_aktif}
                            fallback={
                              <button
                                type="button"
                                onClick={() => handleAktifkanLangsung(item)}
                                disabled={isBusy()}
                                class={activateBtnClass}
                              >
                                <IconEye size={14} />
                                <span>{isBusy() ? "Memproses..." : "Aktifkan"}</span>
                              </button>
                            }
                          >
                            <button
                              type="button"
                              onClick={() => setNonaktifkanTarget(item)}
                              disabled={isBusy()}
                              class={deactivateBtnClass}
                            >
                              <IconEyeOff size={14} />
                              <span>Nonaktifkan</span>
                            </button>
                          </Show>
                        </div>
                      </div>
                    </li>
                  );
                }}
              </For>
            </ul>
          </Match>
        </Switch>
      </div>

      {/* Add / Edit Service Modal (I5a & I5b) */}
      <JasaModal
        isOpen={isFormModalOpen()}
        editingItem={editingItem()}
        formData={formData()}
        formError={formError()}
        isSubmitting={isSubmitting()}
        isUploading={isUploading()}
        provinsiList={provinsiResource() || []}
        onClose={closeFormModal}
        onChangeField={handleFieldChange}
        onUploadFile={handleUploadFile}
        onSubmit={handleSubmitForm}
      />

      {/* Deactivate Confirmation Modal (I5c) */}
      <NonaktifkanJasaModal
        jasa={nonaktifkanTarget()}
        isSubmitting={Boolean(updatingStatusId())}
        onBatal={() => setNonaktifkanTarget(null)}
        onKonfirmasi={handleConfirmNonaktifkan}
      />
    </div>
  );
}
