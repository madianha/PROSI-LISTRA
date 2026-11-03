import { For, Show } from "solid-js";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import Icon from "../../Icon";
import Toggle from "../Toggle";

export default function AnggotaTable(props) {
  return (
    <div class="overflow-x-auto">
      <table class="w-full min-w-[850px] text-left text-sm">
        <thead class="border-b border-stone-200 bg-[#fffaf9] text-[11px] font-semibold uppercase tracking-wider text-stone-500">
          <tr>
            <th class="px-4 py-3.5">Nama & Email</th>
            <th class="px-4 py-3.5">NPM</th>
            <th class="px-4 py-3.5">Angkatan</th>
            <th class="px-4 py-3.5 text-center">Peran & Jabatan</th>
            <th class="px-4 py-3.5">Spesialisasi</th>
            <th class="px-4 py-3.5">Status</th>
            <th class="px-4 py-3.5 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#f7ecec]">
          <For each={props.data}>
            {(item) => {
              const tariSp = () =>
                (item.spesialisasi || []).filter((s) => s.kategori === "TARI");
              const musikSp = () =>
                (item.spesialisasi || []).filter((s) => s.kategori === "MUSIK");

              return (
                <tr class="transition hover:bg-[#fffdfd]">
                  <td class="px-4 py-3.5">
                    <div class="text-sm font-bold tracking-tight text-stone-900">{item.nama}</div>
                    <Show when={item.email}>
                      <div class="mt-0.5 text-xs font-medium text-stone-700">{item.email}</div>
                    </Show>
                  </td>

                  <td class="px-4 py-3.5 text-stone-700">
                    {item.npm ? (
                      <span class="font-mono text-xs text-stone-600">{item.npm}</span>
                    ) : (
                      <span class="text-xs text-stone-400">-</span>
                    )}
                  </td>

                  <td class="whitespace-nowrap px-4 py-3.5">
                    {item.angkatan_unpar ? (
                      <span class="inline-flex rounded-md bg-[#f7ecec] px-2.5 py-0.5 text-xs font-semibold text-[#54141d]">
                        '{String(item.angkatan_unpar).padStart(2, "0")}
                      </span>
                    ) : (
                      <span class="text-xs text-stone-400">-</span>
                    )}
                  </td>

                  <td class="px-4 py-3.5">
                    <div class="flex flex-col items-center justify-center gap-1 text-center">
                      <span
                        class={`inline-flex min-w-[90px] items-center justify-center rounded-full px-3 py-0.5 text-xs font-medium ${
                          item.peran === "Kepengurusan"
                            ? "bg-[#39000a]/10 text-[#39000a]"
                            : item.peran === "Alumni"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {item.peran}
                      </span>
                      <Show when={item.jabatan}>
                        <span class="text-center text-xs font-medium text-stone-600">{item.jabatan}</span>
                      </Show>
                    </div>
                  </td>

                  <td class="max-w-[260px] px-4 py-3.5">
                    <div class="flex flex-wrap gap-1.5">
                      <For each={tariSp()}>
                        {(sp) => (
                          <span class="inline-block rounded-full border border-[#f3d3d9] bg-[#fbf2f4] px-2.5 py-0.5 text-xs font-medium text-[#4a0e17]">
                            {sp.nama_spesialisasi}
                          </span>
                        )}
                      </For>
                      <For each={musikSp()}>
                        {(sp) => (
                          <span class="inline-block rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                            {sp.nama_spesialisasi}
                          </span>
                        )}
                      </For>
                      <Show when={tariSp().length === 0 && musikSp().length === 0}>
                        <span class="text-xs text-stone-400">-</span>
                      </Show>
                    </div>
                  </td>

                  <td class="whitespace-nowrap px-4 py-3.5">
                    <div class="flex items-center gap-2">
                      <Toggle
                        label={`Status aktif: ${item.nama}`}
                        checked={item.is_aktif}
                        disabled={props.updatingStatusId === item.id_anggota}
                        onChange={() => props.onToggleStatus(item)}
                      />
                      <span
                        class={`inline-block w-16 text-left whitespace-nowrap text-xs font-semibold ${
                          item.is_aktif ? "text-emerald-700" : "text-[#8a7977]"
                        }`}
                      >
                        {item.is_aktif ? "Aktif" : "Non-aktif"}
                      </span>
                    </div>
                  </td>

                  <td class="whitespace-nowrap px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => props.onEdit(item)}
                      class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md border border-stone-300 bg-white text-stone-700 shadow-sm transition-all hover:bg-[#fbf2f4] hover:border-[#b86271] hover:text-[#4a0e17] active:scale-95"
                    >
                      <Icon icon={faPen} class="text-xs" /> Ubah
                    </button>
                  </td>
                </tr>
              );
            }}
          </For>
        </tbody>
      </table>
    </div>
  );
}