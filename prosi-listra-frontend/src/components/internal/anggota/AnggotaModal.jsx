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
            class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div class="flex items-center justify-between border-b border-[#f0dedf] pb-3">
              <h2 class="font-serif text-xl font-bold text-[#39000a]">
                {props.editingId ? "Ubah Data Anggota" : "Tambah Anggota Baru"}
              </h2>
              <button
                type="button"
                onClick={props.onClose}
                class="rounded-lg p-1.5 text-[#685856] hover:bg-gray-100"
              >
                <Icon icon={faTimes} class="text-sm" />
              </button>
            </div>

            <Show when={props.formError}>
              <div class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {props.formError}
              </div>
            </Show>

            <form onSubmit={props.onSubmit} class="mt-4 space-y-4">
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
                  class="w-full rounded-lg border border-[#d9cdca] px-3 py-2 text-sm text-[#302929] focus:border-[#39000a] focus:outline-none focus:ring-1 focus:ring-[#39000a]"
                />
              </div>

              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-1 block text-xs font-semibold text-[#302929]">
                    Email (Unpar / Pribadi)
                  </label>
                  <input
                    type="email"
                    placeholder="6182101050@student.unpar.ac.id"
                    value={props.formData.email}
                    onInput={(e) => props.onEmailChange(e.currentTarget.value)}
                    class="w-full rounded-lg border border-[#d9cdca] px-3 py-2 text-sm text-[#302929] focus:border-[#39000a] focus:outline-none focus:ring-1 focus:ring-[#39000a]"
                  />
                  <p class="mt-1 text-[11px] text-[#8a7977]">
                    Email unpar otomatis mengisi NPM & Angkatan.
                  </p>
                </div>

                <div>
                  <label class="mb-1 block text-xs font-semibold text-[#302929]">
                    Nomor HP / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="081234567890"
                    value={props.formData.no_hp}
                    onInput={(e) => props.setFormData("no_hp", e.currentTarget.value)}
                    class="w-full rounded-lg border border-[#d9cdca] px-3 py-2 text-sm text-[#302929] focus:border-[#39000a] focus:outline-none focus:ring-1 focus:ring-[#39000a]"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-1 block text-xs font-semibold text-[#302929]">NPM</label>
                  <input
                    type="text"
                    placeholder="6182101050"
                    value={props.formData.npm}
                    onInput={(e) => props.setFormData("npm", e.currentTarget.value)}
                    class="w-full rounded-lg border border-[#d9cdca] px-3 py-2 text-sm text-[#302929] focus:border-[#39000a] focus:outline-none focus:ring-1 focus:ring-[#39000a]"
                  />
                </div>

                <div>
                  <label class="mb-1 block text-xs font-semibold text-[#302929]">
                    Angkatan (2 Digit)
                  </label>
                  <input
                    type="number"
                    placeholder="21"
                    value={props.formData.angkatan_unpar}
                    onInput={(e) => props.setFormData("angkatan_unpar", e.currentTarget.value)}
                    class="w-full rounded-lg border border-[#d9cdca] px-3 py-2 text-sm text-[#302929] focus:border-[#39000a] focus:outline-none focus:ring-1 focus:ring-[#39000a]"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-1 block text-xs font-semibold text-[#302929]">
                    Peran <span class="text-red-500">*</span>
                  </label>
                  <select
                    value={props.formData.peran}
                    onChange={(e) => props.setFormData("peran", e.currentTarget.value)}
                    class="w-full rounded-lg border border-[#d9cdca] bg-white px-3 py-2 text-sm text-[#302929] focus:border-[#39000a] focus:outline-none focus:ring-1 focus:ring-[#39000a]"
                  >
                    <For each={props.peranOptions}>{(opt) => <option value={opt}>{opt}</option>}</For>
                  </select>
                </div>

                <div>
                  <label class="mb-1 block text-xs font-semibold text-[#302929]">
                    Jabatan / Posisi
                  </label>
                  <input
                    type="text"
                    placeholder="Ketua, Koordinator Tari, Anggota..."
                    value={props.formData.jabatan}
                    onInput={(e) => props.setFormData("jabatan", e.currentTarget.value)}
                    class="w-full rounded-lg border border-[#d9cdca] px-3 py-2 text-sm text-[#302929] focus:border-[#39000a] focus:outline-none focus:ring-1 focus:ring-[#39000a]"
                  />
                </div>
              </div>

              <div class="pt-2">
                <label class="mb-1 block text-xs font-semibold text-[#302929]">
                  Spesialisasi Seni
                </label>
                <p class="mb-3 text-[11px] text-[#8a7977]">
                  Pilih keahlian tari atau alat musik tradisional yang dikuasai.
                </p>

                <div class="space-y-3 rounded-xl border border-[#f0dedf] bg-[#fdfbf9] p-3">
                  <div>
                    <div class="mb-1.5 text-xs font-bold text-[#54141d]">💃 Spesialisasi Tari</div>
                    <div class="flex flex-wrap gap-1.5">
                      <For each={props.spesialisasiTari}>
                        {(sp) => {
                          const isSelected = () =>
                            props.formData.spesialisasi_ids.includes(sp.id_spesialisasi);
                          return (
                            <button
                              type="button"
                              onClick={() => props.onToggleSpesialisasi(sp.id_spesialisasi)}
                              class={`rounded-full px-3 py-1 text-xs font-medium transition ${
                                isSelected()
                                  ? "bg-[#39000a] text-white shadow-sm"
                                  : "border border-[#d9cdca] bg-white text-[#54141d] hover:bg-[#fff0f0]"
                              }`}
                            >
                              {sp.nama_spesialisasi}
                            </button>
                          );
                        }}
                      </For>
                    </div>
                  </div>

                  <div class="border-t border-[#f0dedf] pt-2.5">
                    <div class="mb-1.5 text-xs font-bold text-[#2d3748]">🎵 Alat Musik Tradisional</div>
                    <div class="flex flex-wrap gap-1.5">
                      <For each={props.spesialisasiMusik}>
                        {(sp) => {
                          const isSelected = () =>
                            props.formData.spesialisasi_ids.includes(sp.id_spesialisasi);
                          return (
                            <button
                              type="button"
                              onClick={() => props.onToggleSpesialisasi(sp.id_spesialisasi)}
                              class={`rounded-full px-3 py-1 text-xs font-medium transition ${
                                isSelected()
                                  ? "bg-[#2d3748] text-white shadow-sm"
                                  : "border border-[#d9cdca] bg-white text-[#2d3748] hover:bg-slate-100"
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

              <div class="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="is_aktif"
                  checked={props.formData.is_aktif}
                  onChange={(e) => props.setFormData("is_aktif", e.currentTarget.checked)}
                  class="h-4 w-4 rounded border-[#d9cdca] text-[#39000a] focus:ring-[#39000a]"
                />
                <label for="is_aktif" class="text-sm font-medium text-[#302929]">
                  Anggota Aktif
                </label>
              </div>

              <div class="mt-6 flex justify-end gap-3 border-t border-[#f0dedf] pt-4">
                <button
                  type="button"
                  onClick={props.onClose}
                  class="rounded-lg px-4 py-2 text-sm font-semibold text-[#685856] hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={props.isSubmitting}
                  class="rounded-lg bg-[#39000a] px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-[#5a0c1a] disabled:opacity-50"
                >
                  {props.isSubmitting ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Portal>
    </Show>
  );
}