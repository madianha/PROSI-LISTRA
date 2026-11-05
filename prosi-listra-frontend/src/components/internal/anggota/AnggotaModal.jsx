import { For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import Icon from "../../Icon";

export default function AnggotaModal(props) {
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
            {/* Header*/}
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

            {/* Content Body: Scrollable with clean scrollbar */}
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
                    placeholder="Contoh: Bagas Nugroho"
                    value={props.formData.nama}
                    onInput={(e) => props.setFormData("nama", e.currentTarget.value)}
                    class="w-full rounded-lg border border-[#d9cdca] px-3.5 py-2 text-sm text-[#302929] focus:border-[#39000a] focus:outline-none focus:ring-1 focus:ring-[#39000a]"
                  />
                </div>

                <div>
                  <label class="mb-1 block text-xs font-semibold text-[#302929]">
                    Email (Unpar / Pribadi)
                  </label>
                  <input
                    type="email"
                    placeholder="6182101050@student.unpar.ac.id"
                    value={props.formData.email}
                    onInput={(e) => props.onEmailChange(e.currentTarget.value)}
                    class="w-full rounded-lg border border-[#d9cdca] px-3.5 py-2 text-sm text-[#302929] focus:border-[#39000a] focus:outline-none focus:ring-1 focus:ring-[#39000a]"
                  />
                  <p class="mt-1 text-[11px] text-[#8a7977]">
                    Email unpar otomatis mengisi NPM & Angkatan.
                  </p>
                </div>
              </div>

              {/* Baris 2: NPM & Angkatan */}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label class="mb-1 block text-xs font-semibold text-[#302929]">NPM</label>
                  <input
                    type="text"
                    placeholder="6182101050"
                    value={props.formData.npm}
                    onInput={(e) => props.setFormData("npm", e.currentTarget.value)}
                    class="w-full rounded-lg border border-[#d9cdca] px-3.5 py-2 text-sm text-[#302929] focus:border-[#39000a] focus:outline-none focus:ring-1 focus:ring-[#39000a]"
                  />
                </div>

                <div>
                  <label class="mb-1 block text-xs font-semibold text-[#302929]">
                    Angkatan
                  </label>
                  <input
                    type="number"
                    placeholder="21"
                    value={props.formData.angkatan_unpar}
                    onInput={(e) => props.setFormData("angkatan_unpar", e.currentTarget.value)}
                    class="w-full rounded-lg border border-[#d9cdca] px-3.5 py-2 text-sm text-[#302929] focus:border-[#39000a] focus:outline-none focus:ring-1 focus:ring-[#39000a]"
                  />
                </div>
              </div>

              {/* Baris 3: Peran & Jabatan */}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label class="mb-1 block text-xs font-semibold text-[#302929]">
                    Peran <span class="text-red-500">*</span>
                  </label>
                  <select
                    value={props.formData.peran}
                    onChange={(e) => props.setFormData("peran", e.currentTarget.value)}
                    class="w-full rounded-lg border border-[#d9cdca] bg-white px-3.5 py-2 text-sm text-[#302929] focus:border-[#39000a] focus:outline-none focus:ring-1 focus:ring-[#39000a]"
                  >
                    <For each={props.peranOptions}>{(opt) => <option value={opt}>{opt}</option>}</For>
                  </select>
                </div>

                <div>
                  <label class="mb-1 block text-xs font-semibold text-[#302929]">
                    Jabatan / Posisi
                  </label>
                  {(() => {
                    const isRoleDisabled = () =>
                      props.formData.peran === "Anggota Biasa" || props.formData.peran === "Alumni";
                    const getPlaceholder = () => {
                      if (props.formData.peran === "Pelatih") {
                        return "Contoh: Pelatih Tari Tradisional, Pelatih Degung";
                      }
                      if (props.formData.peran === "Kepengurusan" || props.formData.peran === "Admin") {
                        return "Contoh: Ketua, Koor Humas, Bendahara";
                      }
                      return "Tidak berlaku untuk peran ini";
                    };

                    return (
                      <input
                        type="text"
                        placeholder={getPlaceholder()}
                        value={isRoleDisabled() ? "" : props.formData.jabatan}
                        disabled={isRoleDisabled()}
                        onInput={(e) => props.setFormData("jabatan", e.currentTarget.value)}
                        class="w-full rounded-lg border border-[#d9cdca] px-3.5 py-2 text-sm text-[#302929] placeholder:text-stone-400 focus:border-[#39000a] focus:outline-none focus:ring-1 focus:ring-[#39000a] disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed transition-colors"
                      />
                    );
                  })()}
                </div>
              </div>

              {/* Status Keanggotaan */}
              <div class="flex items-center justify-between p-3.5 rounded-xl border border-stone-300 bg-[#f9f7f5] shadow-xs transition-colors">
                <div>
                  <div class="text-xs font-semibold text-stone-900">Status Keanggotaan</div>
                  <div class="mt-0.5 text-xs text-stone-600">
                    Aktif (Dapat ditugaskan dalam kegiatan/event)
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="is_aktif"
                    checked={props.formData.is_aktif}
                    onChange={(e) => props.setFormData("is_aktif", e.currentTarget.checked)}
                    class="h-4 w-4 rounded border-stone-300 text-[#4a0e17] focus:ring-[#4a0e17] focus:ring-offset-0 cursor-pointer"
                  />
                  <span class="ml-2 text-xs font-semibold text-stone-700">
                    {props.formData.is_aktif ? "Aktif" : "Non-aktif"}
                  </span>
                </label>
              </div>

              {/* Spesialisasi Seni: High contrast box */}
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
                      <For each={props.spesialisasiTari}>
                        {(sp) => {
                          const isSelected = () =>
                            props.formData.spesialisasi_ids.includes(sp.id_spesialisasi);
                          return (
                            <button
                              type="button"
                              onClick={() => props.onToggleSpesialisasi(sp.id_spesialisasi)}
                              class={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                isSelected()
                                  ? "bg-[#4a0e17] text-white border border-[#4a0e17] shadow-xs"
                                  : "bg-white text-stone-800 border border-stone-300 shadow-2xs hover:border-stone-400 hover:bg-stone-50"
                              }`}
                            >
                              {sp.nama_spesialisasi}
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
                      <For each={props.spesialisasiMusik}>
                        {(sp) => {
                          const isSelected = () =>
                            props.formData.spesialisasi_ids.includes(sp.id_spesialisasi);
                          return (
                            <button
                              type="button"
                              onClick={() => props.onToggleSpesialisasi(sp.id_spesialisasi)}
                              class={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                isSelected()
                                  ? "bg-slate-700 text-white border border-slate-700 shadow-xs"
                                  : "bg-white text-stone-800 border border-stone-300 shadow-2xs hover:border-stone-400 hover:bg-stone-50"
                              }`}
                            >
                              {sp.nama_spesialisasi}
                            </button>
                          );
                        }}
                      </For>
                    </div>
                  </div>
                </div>
              </div>
            </form>

            {/* Footer: Sticky bottom action bar */}
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
                {props.isSubmitting ? "Menyimpan..." : "Simpan Data"}
              </button>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
}