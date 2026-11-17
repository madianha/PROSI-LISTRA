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
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import Icon from "../../components/Icon";
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
  posisi_pentas: "Opening",
  id_provinsi: "",
  harga_minimum: "",
  harga_maximum: "",
  min_performer: "1",
  durasi: "",
  tautan_media: "",
  foto_sampul: "",
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
  const prov = (item?.nama_provinsi || item?.kultur || "").trim();
  const posisi = (
    item?.posisi_pentas ||
    item?.nama_kecocokan ||
    "Opening"
  )
    .trim()
    .toUpperCase();

  if (tipe === "tari" && prov && prov.toLowerCase() !== "nusantara") {
    return `TARI ${prov.toUpperCase()} · ${posisi}`;
  }
  return posisi;
}

function JasaThumbnail(props) {
  const [broken, setBroken] = createSignal(false);
  const src = () => props.item?.foto_sampul || props.item?.link_image || "";
  const mediaUrl = () =>
    props.item?.tautan_media || props.item?.link_media || "";

  createEffect(
    on(
      src,
      () => setBroken(false),
      { defer: true }
    )
  );

  const innerContent = () => (
    <>
      <Show
        when={src() && !broken()}
        fallback={
          <div class="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#4a0e17] via-[#340910] to-[#1d0408] text-center select-none">
            <span class="font-serif text-[9px] font-bold tracking-widest text-[#d4af37]">
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
          onError={() => setBroken(true)}
          class="h-full w-full object-cover"
        />
      </Show>
      <span
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30"
      >
        <span class="flex h-7 w-7 items-center justify-center rounded-full border border-white/60 bg-black/55 pl-0.5 text-[10px] text-white shadow-sm">
          ▶
        </span>
      </span>
    </>
  );

  return (
    <Show
      when={mediaUrl()}
      fallback={
        <div
          class="group relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#ede0e2] bg-[#2a070c]"
          title="Belum ada tautan media"
        >
          {innerContent()}
        </div>
      }
    >
      <a
        href={mediaUrl()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Putar media ${props.item?.nama || "jasa"}`}
        title={`Buka media ${props.item?.nama || ""}`}
        class="group relative block h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-[#ede0e2] bg-[#2a070c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a0e17]"
      >
        {innerContent()}
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
        const provMatch = String(item.nama_provinsi || item.kultur || "")
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
    setFormData({ ...INITIAL_FORM });
    setFormError("");
    setIsFormModalOpen(true);
  };

  const openEditModal = (item) => {
    const tipe = String(item.tipe_jasa || "tari").toLowerCase();
    setEditingItem(item);
    setFormData({
      tipe_jasa: tipe === "musik" ? "musik" : "tari",
      nama: item.nama || "",
      deskripsi: item.deskripsi || "",
      posisi_pentas: item.posisi_pentas || item.nama_kecocokan || "Opening",
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
      tautan_media: item.tautan_media || item.link_media || "",
      foto_sampul: item.foto_sampul || item.link_image || "",
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
      handleFieldChange("foto_sampul", uploadedLocation);
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
      setFormError("Harga minimum harus berupa angka non-negatif.");
      return;
    }
    if (
      data.harga_maximum === "" ||
      !Number.isFinite(hargaMax) ||
      hargaMax < 0
    ) {
      setFormError("Harga maksimum harus berupa angka non-negatif.");
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
      setFormError("Durasi harus berupa angka bulat positif (menit).");
      return;
    }

    const tautanMedia = String(data.tautan_media || "").trim();
    if (tautanMedia && !/^https?:\/\/.+/i.test(tautanMedia)) {
      setFormError("Tautan media harus berupa URL yang valid (http:// atau https://).");
      return;
    }

    const payload = {
      tipe_jasa,
      nama,
      deskripsi: String(data.deskripsi || "").trim(),
      posisi_pentas: data.posisi_pentas || "Opening",
      id_provinsi: tipe_jasa === "tari" ? Number(data.id_provinsi) : null,
      harga_minimum: hargaMin,
      harga_maximum: hargaMax,
      min_performer: minPerformer,
      durasi,
      tautan_media: tautanMedia || null,
      foto_sampul: String(data.foto_sampul || "").trim() || null,
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

  return (
    <div class="mx-auto max-w-6xl rounded-2xl bg-[#fbf8f7] p-1 sm:p-2">
      {/* Page Header */}
      <div class="flex flex-wrap items-center justify-between gap-4">
        <h1 class="font-serif text-2xl font-bold text-[#2b181a]">
          Katalog Jasa
        </h1>
        <button
          type="button"
          onClick={openAddModal}
          class="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl bg-[#4a0e17] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-[#58111a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a0e17]"
        >
          + Tambah Jasa Baru
        </button>
      </div>

      <Show when={globalError()}>
        <div
          role="alert"
          class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-800"
        >
          {globalError()}
        </div>
      </Show>

      {/* Search & Category Filter Bar */}
      <div class="mt-5 space-y-3">
        <div class="relative">
          <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9c898b]">
            <Icon icon={faSearch} class="text-xs" />
          </span>
          <input
            type="text"
            aria-label="Cari nama jasa atau asal provinsi"
            placeholder="Cari nama jasa atau asal provinsi.."
            value={search()}
            onInput={(e) => handleSearchInput(e.currentTarget.value)}
            class="w-full rounded-xl border border-[#ede0e2] bg-white py-2.5 pl-10 pr-4 text-xs text-[#2b181a] placeholder:text-[#9c898b] focus:border-[#4a0e17] focus:outline-none focus:ring-1 focus:ring-[#4a0e17]"
          />
        </div>

        <div
          role="group"
          aria-label="Filter kategori jasa"
          class="flex flex-wrap items-center gap-2"
        >
          <For each={FILTER_CATEGORIES}>
            {(cat) => {
              const isSelected = () => activeCategory() === cat;
              return (
                <button
                  type="button"
                  aria-pressed={isSelected()}
                  onClick={() => setActiveCategory(cat)}
                  class={`inline-flex min-h-9 cursor-pointer items-center justify-center rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a0e17] ${
                    isSelected()
                      ? "border-[#4a0e17] bg-[#4a0e17] text-white"
                      : "border-[#ede0e2] bg-white text-[#5c4a4c] hover:border-[#d9c7ca] hover:bg-[#fbf2f3] hover:text-[#4a0e17]"
                  }`}
                >
                  {cat}
                </button>
              );
            }}
          </For>
        </div>
      </div>

      {/* Registered Services List Card */}
      <div class="mt-5 overflow-hidden rounded-2xl border border-[#ede0e2] bg-white shadow-2xs">
        <div class="border-b border-[#ede0e2] bg-[#fcf9f9] px-5 py-3">
          <span class="text-[11px] font-bold uppercase tracking-[0.08em] text-[#7a6668]">
            JASA TERDAFTAR · {filteredJasa().length}
          </span>
        </div>

        <Switch>
          <Match when={jasaResource.loading && !jasaResource()}>
            <div class="p-10 text-center text-xs text-[#7a6668]">
              Memuat katalog jasa...
            </div>
          </Match>

          <Match when={jasaResource.error && !jasaResource()}>
            <div class="p-10 text-center text-xs text-[#7a6668]">
              <p>Gagal memuat katalog jasa dari server.</p>
              <button
                type="button"
                onClick={() => refetchJasa()}
                class="mt-2 inline-flex cursor-pointer font-semibold text-[#4a0e17] underline hover:text-[#58111a]"
              >
                Coba lagi
              </button>
            </div>
          </Match>

          <Match when={filteredJasa().length === 0}>
            <div class="p-10 text-center text-xs text-[#7a6668]">
              Tidak ada jasa yang cocok dengan pencarian atau filter.
            </div>
          </Match>

          <Match when={filteredJasa().length > 0}>
            <ul class="divide-y divide-[#ede0e2]">
              <For each={filteredJasa()}>
                {(item) => {
                  const kategoriLabel = () =>
                    String(item.tipe_jasa || "tari").toLowerCase() === "musik"
                      ? "Musik"
                      : "Tari";
                  const isBusy = () => updatingStatusId() === item.id_jasa;

                  return (
                    <li class="grid grid-cols-1 items-center gap-4 px-5 py-4 lg:grid-cols-[minmax(220px,1.15fr)_minmax(240px,1.5fr)_minmax(190px,1fr)_auto]">
                      {/* Column 1: Thumbnail + Primary Info */}
                      <div class="flex items-center gap-3.5 min-w-0">
                        <JasaThumbnail item={item} />

                        <div class="min-w-0 flex-1">
                          <div class="flex flex-wrap items-center gap-1.5">
                            <span class="inline-flex items-center rounded-md border border-[#ede0e2] bg-[#fbf8f7] px-2 py-0.5 text-[11px] font-semibold text-[#4a0e17]">
                              {kategoriLabel()}
                            </span>
                            <Show when={!item.is_aktif}>
                              <span class="inline-flex items-center rounded-md border border-[#f5c2c7] bg-[#fde8e9] px-2 py-0.5 text-[11px] font-semibold text-[#9e2a35]">
                                Nonaktif
                              </span>
                            </Show>
                          </div>

                          <h2 class="mt-1 truncate font-serif text-base font-bold text-[#2b181a]">
                            {item.nama}
                          </h2>
                          <p class="mt-0.5 text-xs text-[#7a6668]">
                            min. {item.min_performer ?? 1} performer ·{" "}
                            {item.durasi ?? 0} menit
                          </p>
                        </div>
                      </div>

                      {/* Column 2: Culture & Stage Position + Description */}
                      <div class="min-w-0">
                        <p class="text-[11px] font-bold uppercase tracking-[0.08em] text-[#7c6238]">
                          {formatEyebrowBudaya(item)}
                        </p>
                        <p class="mt-1 line-clamp-2 text-xs leading-relaxed text-[#5c4a4c]">
                          {item.deskripsi || "Belum ada deskripsi."}
                        </p>
                      </div>

                      {/* Column 3: Price Range Box */}
                      <div class="rounded-xl border border-[#f2dfe1] bg-[#fbf2f3] px-3.5 py-2.5">
                        <span class="block text-[10px] font-bold uppercase tracking-wider text-[#8c6f73]">
                          RANGE HARGA
                        </span>
                        <span class="mt-0.5 block font-serif text-xs font-bold text-[#4a0e17] sm:text-sm">
                          {formatRupiahRange(
                            item.harga_minimum,
                            item.harga_maximum
                          )}
                        </span>
                      </div>

                      {/* Column 4: Action Buttons */}
                      <div class="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          disabled={isBusy()}
                          class="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg bg-[#4a0e17] px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#58111a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a0e17] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Ubah info
                        </button>

                        <Show
                          when={item.is_aktif}
                          fallback={
                            <button
                              type="button"
                              onClick={() => handleAktifkanLangsung(item)}
                              disabled={isBusy()}
                              class="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-[#d9c7ca] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#4a0e17] transition-colors hover:bg-[#fbf2f3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a0e17] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Aktifkan
                            </button>
                          }
                        >
                          <button
                            type="button"
                            onClick={() => setNonaktifkanTarget(item)}
                            disabled={isBusy()}
                            class="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-[#d9c7ca] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#4a0e17] transition-colors hover:bg-[#fbf2f3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a0e17] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Nonaktifkan
                          </button>
                        </Show>
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
