import { createResource, createSignal, For, Match, Show, Switch } from "solid-js";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import CustomHeader from "../components/CustomHeader";
import Icon from "../components/Icon";
import TestimoniCard from "../components/TestimoniCard";
import TestimoniForm from "../components/TestimoniForm";
import { kirimTestimoni, listTestimoni } from "../api/testimoni";

/** Halaman Testimoni publik: daftar testimoni yang disetujui + form kirim testimoni. */
export default function Testimoni() {
  const [testimoni, { refetch }] = createResource(listTestimoni);
  const [formTerbuka, setFormTerbuka] = createSignal(false);
  // pesan setelah berhasil mengirim; testimoni baru belum tampil sampai disetujui
  const [terkirim, setTerkirim] = createSignal(false);

  return (
    <div>
      <CustomHeader category="Apa Kata Mereka" pageName="Testimoni Klien" colorText="text-white">
        <button
          type="button"
          onClick={() => {
            setTerkirim(false);
            setFormTerbuka(true);
          }}
          className="mt-2 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-[#dfb83b] px-4 text-sm font-semibold text-[#3d1017] hover:bg-[#edca5d]"
        >
          <Icon icon={faPlus} class="text-xs" /> Tulis Testimoni
        </button>
      </CustomHeader>

      <div className="px-6 py-7">
        <Show when={terkirim()}>
          <p role="status" className="mx-auto mb-5 max-w-[1100px] rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Terima kasih! Testimoni Anda akan tampil setelah disetujui pengurus LISTRA.
          </p>
        </Show>

        {/* Switch = hanya satu keadaan yang tampil; error dicek sebelum membaca testimoni() */}
        <Switch>
          <Match when={testimoni.loading}>
            <p className="text-center text-sm text-[#685856]">Memuat testimoni...</p>
          </Match>
          <Match when={testimoni.error}>
            <p className="text-center text-sm text-[#685856]">
              Testimoni belum bisa dimuat.{" "}
              <button type="button" onClick={refetch} className="min-h-11 cursor-pointer px-2 font-semibold text-[#54141d] underline">
                Coba lagi
              </button>
            </p>
          </Match>
          <Match when={testimoni()?.length === 0}>
            <p className="text-center text-sm text-[#685856]">Belum ada testimoni.</p>
          </Match>
          <Match when={testimoni()}>
            <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <For each={testimoni()}>{(row) => <TestimoniCard {...row} />}</For>
            </div>
          </Match>
        </Switch>
      </div>

      <Show when={formTerbuka()}>
        <TestimoniForm
          judul="Tulis Testimoni"
          onTutup={() => setFormTerbuka(false)}
          onKirim={async (data) => {
            await kirimTestimoni(data);
            setFormTerbuka(false);
            setTerkirim(true);
          }}
        />
      </Show>
    </div>
  );
}
