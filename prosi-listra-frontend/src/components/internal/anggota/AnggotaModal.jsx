import { createEffect, createMemo, createResource, createSignal, For, on, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import Icon from "../../Icon";
import { getSpesialisasiList } from "../../../api/anggota";

export default function AnggotaModal(props) {
  const [internalSpesialisasi] = createResource(getSpesialisasiList);
  const [searchQuery, setSearchQuery] = createSignal("");

  createEffect(
    on(
      () => props.isOpen,
      () => setSearchQuery("")
    )
  );

  const allSpesialisasi = createMemo(() => {
    const fromProps = typeof props.spesialisasiList === "function"
      ? props.spesialisasiList()
      : typeof props.spesialisasi === "function"
      ? props.spesialisasi()
      : (props.spesialisasiList || props.spesialisasi);

    const raw = fromProps && Array.isArray(fromProps) && fromProps.length > 0
      ? fromProps
      : internalSpesialisasi();

    if (!raw) return [];
    const items = Array.isArray(raw) ? raw : (raw?.data || []);
    return Array.isArray(items) ? items : [];
  });

  const tariOptions = createMemo(() => {
    const directTari = typeof props.spesialisasiTari === "function"
      ? props.spesialisasiTari()
      : props.spesialisasiTari;

    if (Array.isArray(directTari) && directTari.length > 0) {
      return directTari;
    }

    return allSpesialisasi().filter((item) => {
      const cat = String(item.kategori || item.tipe_jasa || "").toLowerCase();
      return cat === "tari" || cat.includes("tari");
    });
  });

  const musikOptions = createMemo(() => {
    const directMusik = typeof props.spesialisasiMusik === "function"
      ? props.spesialisasiMusik()
      : props.spesialisasiMusik;

    if (Array.isArray(directMusik) && directMusik.length > 0) {
      return directMusik;
    }

    return allSpesialisasi().filter((item) => {
      const cat = String(item.kategori || item.tipe_jasa || "").toLowerCase();
      return cat === "musik" || cat.includes("musik") || cat.includes("alat musik");
    });
  });

  const getItemId = (sp) => Number(sp?.id_spesialisasi ?? sp?.id_jasa ?? sp?.id);
  const getItemLabel = (sp) => String(sp?.nama_spesialisasi || sp?.nama_jasa || sp?.nama || "");

  const filteredTari = createMemo(() => {
    const q = searchQuery().trim().toLowerCase();
    const list = tariOptions();
    if (!q) return list;
    return list.filter((sp) => getItemLabel(sp).toLowerCase().includes(q));
  });

  const filteredMusik = createMemo(() => {
    const q = searchQuery().trim().toLowerCase();
    const list = musikOptions();
    if (!q) return list;
    return list.filter((sp) => getItemLabel(sp).toLowerCase().includes(q));
  });

  const isSearching = () => searchQuery().trim() !== "";
  const hasAnyMatches = () => filteredTari().length > 0 || filteredMusik().length > 0;

  const selectedIds = () => {
    const ids = props.formData?.spesialisasi_ids || props.selectedSpesialisasi || [];
    return Array.isArray(ids) ? ids.map((id) => Number(id)) : [];
  };

  const selectedItems = createMemo(() => {
    const ids = selectedIds();
    if (ids.length === 0) return [];

    const map = new Map();
    for (const sp of [...tariOptions(), ...musikOptions(), ...allSpesialisasi()]) {
      const id = getItemId(sp);
      if (!map.has(id)) {
        map.set(id, sp);
      }
    }

    return ids.map((id) => {
      const sp = map.get(id);
      const label = sp ? getItemLabel(sp) : `Spesialisasi #${id}`;
      return { id, label };
    });
  });

  const handleReset = () => {
    if (typeof props.setFormData === "function") {
      props.setFormData("spesialisasi_ids", []);
    } else {
      selectedIds().forEach((id) => props.onToggleSpesialisasi?.(id));
    }
  };

  return (
    <Show when={props.isOpen}>
      <Portal>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && props.onClose()}
        >
          <div
            role="dialog"
            aria-modal="true"
            class="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden"
          >
            {/* Header */}
            <div class="px-6 py-4 border-b border-stone-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h2 class="font-serif text-xl font-bold text-[#39000a]">
                  {props.editingId ? "Ubah Data Anggota" : "Tambah Anggota Baru"}
                </h2>
                <p class="mt-0.5 text-xs text-stone-500">
                  {props.editingId
                    ? "Perbarui informasi profil dan spesialisasi anggota sanggar."
                    : "Lengkapi data diri dan spesialisasi kesenian anggota baru."}
                </p>
              </div>
              <button
                type="button"
                onClick={props.onClose}
                class="rounded-lg p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <Icon icon={faTimes} class="text-base" />
              </button>
            </div>

            <form
              id="anggota-form"
              onSubmit={props.onSubmit}
              class="flex-1 overflow-y-auto px-6 py-5 space-y-4 scrollbar-thin scrollbar-thumb-stone-200"
            >
              <Show when={props.formError}>
                <div class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {props.formError}
                </div>
              </Show>

              {/* Baris 1: Nama Lengkap & Email */}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label class="mb-1 block text-xs font-semibold text-[#302929]">
                    Nama Lengkap <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap anggota"
                    value={props.formData?.nama || ""}
                    onInput={(e) => props.setFormData("nama", e.currentTarget.value)}
                    class="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-[#302929] shadow-2xs focus:border-[#4a0e17] focus:ring-1 focus:ring-[#4a0e17] focus:outline-none"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-xs font-semibold text-[#302929]">
                    Email UNPAR
                  </label>
                  <input
                    type="email"
                    placeholder="6182101050@student.unpar.ac.id"
                    value={props.formData?.email || ""}
                    onInput={(e) => props.onEmailChange(e.currentTarget.value)}
                    class="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-[#302929] shadow-2xs focus:border-[#4a0e17] focus:ring-1 focus:ring-[#4a0e17] focus:outline-none"
                  />
                </div>
              </div>

              {/* Kata sandi: hanya tampil pada mode Tambah Anggota (bukan Ubah Data) bila yang login Admin atau LISTRA */}
              <Show when={props.bolehAturPassword && !props.editingId}>
                <div>
                  <label class="mb-1 block text-xs font-semibold text-[#302929]">
                    Kata Sandi
                  </label>
                  {/* minLength 8 = sama dengan aturan di backend */}
                  <input
                    type="password"
                    minLength={8}
                    autocomplete="new-password"
                    placeholder="Kosongkan untuk memakai password123"
                    value={props.formData?.password || ""}
                    onInput={(e) => props.setFormData("password", e.currentTarget.value)}
                    class="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-[#302929] shadow-2xs focus:border-[#4a0e17] focus:ring-1 focus:ring-[#4a0e17] focus:outline-none"
                  />
                </div>
              </Show>

              {/* Baris 2: NPM & Angkatan */}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label class="mb-1 block text-xs font-semibold text-[#302929]">NPM</label>
                  <input
                    type="text"
                    placeholder="6182101050"
                    value={props.formData?.npm || ""}
                    onInput={(e) => props.setFormData("npm", e.currentTarget.value)}
                    class="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-[#302929] shadow-2xs focus:border-[#4a0e17] focus:ring-1 focus:ring-[#4a0e17] focus:outline-none"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-xs font-semibold text-[#302929]">
                    Angkatan Unpar
                  </label>
                  <input
                    type="number"
                    placeholder="Contoh: 2021"
                    value={props.formData?.angkatan_unpar || ""}
                    onInput={(e) => props.setFormData("angkatan_unpar", e.currentTarget.value)}
                    class="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-[#302929] shadow-2xs focus:border-[#4a0e17] focus:ring-1 focus:ring-[#4a0e17] focus:outline-none"
                  />
                </div>
              </div>

              {/* Baris 3: Peran & Jabatan */}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label class="mb-1 block text-xs font-semibold text-[#302929]">Peran</label>
                  <select
                    value={props.formData?.peran || ""}
                    disabled={props.editingId && props.formData?.peran === "Admin"}
                    onChange={(e) => props.setFormData("peran", e.currentTarget.value)}
                    class="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-[#302929] shadow-2xs focus:border-[#4a0e17] focus:ring-1 focus:ring-[#4a0e17] focus:outline-none disabled:bg-stone-100 disabled:cursor-not-allowed"
                  >
                    <Show
                      when={props.editingId && props.formData?.peran === "Admin"}
                      fallback={
                        <For each={(props.peranOptions || []).filter((p) => p !== "Admin")}>
                          {(p) => <option value={p}>{p}</option>}
                        </For>
                      }
                    >
                      <option value="Admin">Admin</option>
                    </Show>
                  </select>
                </div>
                <div>
                  <label class="mb-1 block text-xs font-semibold text-[#302929]">
                    Jabatan Struktural
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Ketua, Koor Humas (opsional)"
                    value={props.formData?.jabatan || ""}
                    disabled={
                      props.formData?.peran === "Anggota" ||
                      props.formData?.peran === "Alumni"
                    }
                    onInput={(e) => props.setFormData("jabatan", e.currentTarget.value)}
                    class="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-[#302929] shadow-2xs focus:border-[#4a0e17] focus:ring-1 focus:ring-[#4a0e17] focus:outline-none disabled:bg-stone-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Status Keanggotaan */}
              <div class="flex items-center justify-between rounded-xl border border-stone-200/80 bg-stone-50/50 px-4 py-2.5">
                <div>
                  <div class="text-xs font-bold text-stone-800">Status Keanggotaan</div>
                  <div class="text-[11px] text-stone-500">
                    Anggota aktif dapat dipilih dalam penugasan acara
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="is_aktif"
                    checked={props.formData?.is_aktif || false}
                    onChange={(e) => props.setFormData("is_aktif", e.currentTarget.checked)}
                    class="h-4 w-4 rounded border-stone-300 text-[#4a0e17] focus:ring-[#4a0e17] focus:ring-offset-0 cursor-pointer"
                  />
                  <span class="ml-2 text-xs font-semibold text-stone-700">
                    {props.formData?.is_aktif ? "Aktif" : "Non-aktif"}
                  </span>
                </label>
              </div>

              {/* Spesialisasi Seni */}
              <div class="pt-0.5">
                <label class="mb-1 block text-xs font-semibold text-[#302929]">
                  Spesialisasi Seni
                </label>
                <p class="mb-2.5 text-[11px] text-[#8a7977]">
                  Pilih keahlian tari atau alat musik tradisional yang dikuasai.
                </p>

                <div class="rounded-xl border border-[#ede0e2] bg-[#fbf8f7] p-3.5 space-y-3 shadow-2xs">
                  {/* Search Input Bar */}
                  <div class="relative flex items-center">
                    <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                      <svg
                        aria-hidden="true"
                        fill="none"
                        height="14"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        viewBox="0 0 24 24"
                        width="14"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle cx="11" cy="11" r="7" />
                        <path d="m20 20-3.5-3.5" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Cari nama tari atau alat musik..."
                      value={searchQuery()}
                      onInput={(e) => setSearchQuery(e.currentTarget.value)}
                      class="w-full rounded-lg border border-[#ede0e2] bg-white pl-8 pr-8 py-1.5 text-xs text-[#302929] placeholder:text-[#a19290] focus:border-[#4a0e17] focus:ring-1 focus:ring-[#4a0e17] focus:outline-none transition-colors"
                    />
                    <Show when={searchQuery().trim() !== ""}>
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        aria-label="Hapus pencarian"
                        class="absolute inset-y-0 right-0 flex items-center pr-2.5 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer text-sm font-bold"
                      >
                        ×
                      </button>
                    </Show>
                  </div>

                  {/* Selected Items Summary Strip */}
                  <Show when={selectedIds().length > 0}>
                    <div class="flex items-start justify-between gap-2 rounded-lg bg-white/80 p-2 border border-[#ede0e2]">
                      <div class="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
                        <span class="text-[11px] font-bold text-[#4a0e17] shrink-0 select-none">
                          Terpilih ({selectedIds().length}):
                        </span>
                        <For each={selectedItems()}>
                          {(item) => (
                            <button
                              type="button"
                              onClick={() => props.onToggleSpesialisasi?.(item.id)}
                              title={`Hapus ${item.label}`}
                              class="inline-flex items-center gap-1 rounded-full bg-[#4a0e17] px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-2xs hover:bg-[#641420] transition-colors cursor-pointer select-none"
                            >
                              <span>✓</span>
                              <span class="truncate max-w-[160px]">{item.label}</span>
                              <span class="text-xs font-bold leading-none opacity-80 hover:opacity-100">×</span>
                            </button>
                          )}
                        </For>
                      </div>
                      <button
                        type="button"
                        onClick={handleReset}
                        class="shrink-0 text-[11px] font-semibold text-[#8a7977] hover:text-[#4a0e17] transition-colors underline cursor-pointer pt-0.5"
                      >
                        Reset
                      </button>
                    </div>
                  </Show>

                  {/* Scrollable Categorized Pill Area */}
                  <div class="max-h-[220px] overflow-y-auto pr-1 space-y-3 [scrollbar-width:thin] [scrollbar-color:#d5c2c5_transparent]">
                    <Show
                      when={!isSearching() || hasAnyMatches()}
                      fallback={
                        <div class="py-6 text-center text-xs text-[#8a7977]">
                          Tidak ada spesialisasi yang cocok dengan "{searchQuery()}".
                        </div>
                      }
                    >
                      {/* SPESIALISASI TARI */}
                      <Show when={!isSearching() || filteredTari().length > 0}>
                        <div>
                          <div class="mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-700">
                            SPESIALISASI TARI ({filteredTari().length})
                          </div>
                          <div class="flex flex-wrap gap-2 pt-0.5">
                            <For
                              each={filteredTari()}
                              fallback={
                                <span class="text-xs text-gray-400 italic">
                                  Memuat atau belum ada pilihan tari...
                                </span>
                              }
                            >
                              {(sp) => {
                                const id = getItemId(sp);
                                const label = getItemLabel(sp);
                                const isSelected = () => selectedIds().includes(id);
                                return (
                                  <button
                                    type="button"
                                    onClick={() => props.onToggleSpesialisasi?.(id)}
                                    class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer select-none ${
                                      isSelected()
                                        ? "bg-[#4a0e17] text-white border-[#4a0e17] shadow-xs"
                                        : "bg-white text-stone-700 border-[#ede0e2] hover:bg-stone-50 hover:border-stone-400"
                                    }`}
                                  >
                                    <Show when={isSelected()}>
                                      <span class="text-[11px] leading-none">✓</span>
                                    </Show>
                                    <span>{label}</span>
                                  </button>
                                );
                              }}
                            </For>
                          </div>
                        </div>
                      </Show>

                      {/* SPESIALISASI MUSIK */}
                      <Show when={!isSearching() || filteredMusik().length > 0}>
                        <div class={(!isSearching() || filteredTari().length > 0) ? "border-t border-[#ede0e2] pt-3" : ""}>
                          <div class="mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-700">
                            SPESIALISASI MUSIK ({filteredMusik().length})
                          </div>
                          <div class="flex flex-wrap gap-2 pt-0.5">
                            <For
                              each={filteredMusik()}
                              fallback={
                                <span class="text-xs text-gray-400 italic">
                                  Memuat atau belum ada pilihan musik...
                                </span>
                              }
                            >
                              {(sp) => {
                                const id = getItemId(sp);
                                const label = getItemLabel(sp);
                                const isSelected = () => selectedIds().includes(id);
                                return (
                                  <button
                                    type="button"
                                    onClick={() => props.onToggleSpesialisasi?.(id)}
                                    class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer select-none ${
                                      isSelected()
                                        ? "bg-[#4a0e17] text-white border-[#4a0e17] shadow-xs"
                                        : "bg-white text-stone-700 border-[#ede0e2] hover:bg-stone-50 hover:border-stone-400"
                                    }`}
                                  >
                                    <Show when={isSelected()}>
                                      <span class="text-[11px] leading-none">✓</span>
                                    </Show>
                                    <span>{label}</span>
                                  </button>
                                );
                              }}
                            </For>
                          </div>
                        </div>
                      </Show>
                    </Show>
                  </div>
                </div>
              </div>
            </form>

            {/* Footer */}
            <div class="px-6 py-3.5 bg-stone-50/90 backdrop-blur-sm border-t border-stone-100 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={props.onClose}
                class="rounded-lg px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-200/60 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                form="anggota-form"
                disabled={props.isSubmitting}
                class="rounded-lg bg-[#39000a] px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-[#5a0c1a] disabled:opacity-50"
              >
                {props.isSubmitting
                  ? "Menyimpan..."
                  : props.editingId
                  ? "Simpan Perubahan"
                  : "Tambah Anggota"}
              </button>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
}
