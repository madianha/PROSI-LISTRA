import { createMemo, createResource, For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import Icon from "../../Icon";
import { getSpesialisasiList } from "../../../api/anggota";

export default function AnggotaModal(props) {
  const [internalSpesialisasi] = createResource(getSpesialisasiList);

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

  const selectedIds = () => {
    const ids = props.formData?.spesialisasi_ids || props.selectedSpesialisasi || [];
    return Array.isArray(ids) ? ids.map((id) => Number(id)) : [];
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
                    Angkatan
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
                    onChange={(e) => props.setFormData("peran", e.currentTarget.value)}
                    class="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-[#302929] shadow-2xs focus:border-[#4a0e17] focus:ring-1 focus:ring-[#4a0e17] focus:outline-none"
                  >
                    <For each={props.peranOptions}>
                      {(p) => <option value={p}>{p}</option>}
                    </For>
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
                      props.formData?.peran === "Anggota Biasa" ||
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

                <div class="rounded-xl border border-stone-300 bg-[#f9f7f5] p-4 space-y-3.5 shadow-inner">
                  <div>
                    <div class="mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-700">
                      SPESIALISASI TARI
                    </div>
                    <div class="flex flex-wrap gap-2 pt-0.5">
                      <For
                        each={tariOptions()}
                        fallback={
                          <span class="text-xs text-gray-400 italic">
                            Memuat atau belum ada pilihan tari...
                          </span>
                        }
                      >
                        {(sp) => {
                          const id = Number(sp.id_spesialisasi ?? sp.id_jasa ?? sp.id);
                          const label = sp.nama_spesialisasi || sp.nama_jasa || sp.nama;
                          const isSelected = () => selectedIds().includes(id);
                          return (
                            <button
                              type="button"
                              onClick={() => props.onToggleSpesialisasi(id)}
                              class={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                                isSelected()
                                  ? "bg-red-800 text-white border-red-800"
                                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        }}
                      </For>
                    </div>
                  </div>

                  <div class="border-t border-stone-200/90 pt-3">
                    <div class="mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-700">
                      ALAT MUSIK TRADISIONAL
                    </div>
                    <div class="flex flex-wrap gap-2 pt-0.5">
                      <For
                        each={musikOptions()}
                        fallback={
                          <span class="text-xs text-gray-400 italic">
                            Memuat atau belum ada pilihan musik...
                          </span>
                        }
                      >
                        {(sp) => {
                          const id = Number(sp.id_spesialisasi ?? sp.id_jasa ?? sp.id);
                          const label = sp.nama_spesialisasi || sp.nama_jasa || sp.nama;
                          const isSelected = () => selectedIds().includes(id);
                          return (
                            <button
                              type="button"
                              onClick={() => props.onToggleSpesialisasi(id)}
                              class={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                                isSelected()
                                  ? "bg-red-800 text-white border-red-800"
                                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        }}
                      </For>
                    </div>
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
