import { For, Show } from "solid-js";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import Icon from "../../Icon";
import Toggle from "../Toggle";

export default function AnggotaTable(props) {
  return (
    <div class="overflow-x-auto">
      <table class="w-full min-w-[850px] text-left text-sm">
        <thead class="border-b border-[#f0dedf] bg-[#fffaf9] text-xs uppercase tracking-wider text-[#685856]">
          <tr>
            <th class="px-4 py-3.5 font-medium">Nama & Kontak</th>
            <th class="px-4 py-3.5 font-medium">NPM</th>
            <th class="px-4 py-3.5 font-medium">Angkatan</th>
            <th class="px-4 py-3.5 font-medium">Peran & Jabatan</th>
            <th class="px-4 py-3.5 font-medium">Spesialisasi</th>
            <th class="px-4 py-3.5 font-medium">Status</th>
            <th class="px-4 py-3.5 text-right font-medium">Aksi</th>
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
                    <div class="font-semibold text-[#302929]">{item.nama}</div>
                    <div class="mt-0.5 space-y-0.5 text-xs text-[#685856]">
                      <Show when={item.email}>
                        <div>{item.email}</div>
                      </Show>
                      <Show when={item.no_hp}>
                        <div>{item.no_hp}</div>
                      </Show>
                    </div>
                  </td>

                  <td class="px-4 py-3.5 text-[#302929]">
                    {item.npm ? (
                      <span class="font-mono text-xs">{item.npm}</span>
                    ) : (
                      <span class="text-xs text-[#a89a98]">-</span>
                    )}
                  </td>

                  <td class="whitespace-nowrap px-4 py-3.5 text-[#302929]">
                    {item.angkatan_unpar ? (
                      <span class="inline-flex rounded bg-[#f7ecec] px-2 py-0.5 text-xs font-semibold text-[#54141d]">
                        '{String(item.angkatan_unpar).padStart(2, "0")}
                      </span>
                    ) : (
                      <span class="text-xs text-[#a89a98]">-</span>
                    )}
                  </td>

                  <td class="px-4 py-3.5">
                    <span
                      class={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
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
                      <div class="mt-1 text-xs text-[#685856]">{item.jabatan}</div>
                    </Show>
                  </td>

                  <td class="max-w-[260px] px-4 py-3.5">
                    <div class="flex flex-wrap gap-1">
                      <For each={tariSp()}>
                        {(sp) => (
                          <span class="inline-block rounded-md border border-[#f0dedf] bg-[#fff5f5] px-2 py-0.5 text-[11px] font-medium text-[#7a1c2d]">
                            💃 {sp.nama_spesialisasi}
                          </span>
                        )}
                      </For>
                      <For each={musikSp()}>
                        {(sp) => (
                          <span class="inline-block rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-2 py-0.5 text-[11px] font-medium text-[#2d3748]">
                            🎵 {sp.nama_spesialisasi}
                          </span>
                        )}
                      </For>
                      <Show when={tariSp().length === 0 && musikSp().length === 0}>
                        <span class="text-xs text-[#a89a98]">-</span>
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
                        class={`text-xs font-semibold ${
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
                      class="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-[#54141d] hover:bg-[#fff7f6]"
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