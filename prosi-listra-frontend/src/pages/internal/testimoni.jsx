import { createMemo, createResource, createSignal, For, Match, Show, Switch } from "solid-js";
import { faCheck, faPlus, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import Icon from "../../components/Icon";
import TestimoniForm from "../../components/TestimoniForm";
import KonfirmasiModal from "../../components/internal/KonfirmasiModal";
import Toggle from "../../components/internal/Toggle";
import {
  hapusTestimoni,
  kirimTestimoni,
  listSemuaTestimoni,
  setAktifTestimoni,
  setStatusTestimoni,
} from "../../api/testimoni";

const FILTER = [
  { nilai: "semua", label: "Semua" },
  { nilai: "menunggu", label: "Ditunggu" },
  { nilai: "disetujui", label: "Diterima" },
  { nilai: "ditolak", label: "Ditolak" },
];

// nilai di database tetap menunggu/disetujui/ditolak; yang tampil di layar:
const LABEL_STATUS = { menunggu: "Ditunggu", disetujui: "Diterima", ditolak: "Ditolak" };

// warna lencana status
const WARNA_STATUS = {
  menunggu: "bg-amber-50 text-amber-800 border-amber-200",
  disetujui: "bg-green-50 text-green-800 border-green-200",
  ditolak: "bg-stone-100 text-stone-600 border-stone-200",
};

function formatTanggal(iso) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Halaman Kelola Testimoni.
 * Tampil di website hanya bila status Disetujui DAN saklar Tampil menyala.
 */
export default function InternalTestimoni() {
  const [testimoni, { refetch, mutate }] = createResource(listSemuaTestimoni);
  const [filter, setFilter] = createSignal("semua");
  // id testimoni yang sedang disimpan (tombolnya dinonaktifkan)
  const [menyimpan, setMenyimpan] = createSignal(null);
  const [pesanError, setPesanError] = createSignal("");
  const [formTerbuka, setFormTerbuka] = createSignal(false);
  // { id, nama } menunggu konfirmasi hapus; null = jendela tertutup
  const [konfirmasiHapus, setKonfirmasiHapus] = createSignal(null);

  const jumlah = (status) => (testimoni() ?? []).filter((t) => status === "semua" || t.status === status).length;
  const tampil = createMemo(() => (testimoni() ?? []).filter((t) => filter() === "semua" || t.status === filter()));

  /** Jalankan aksi untuk satu testimoni lalu ganti baris itu saja di daftar. */
  const ubah = async (id, aksi) => {
    setMenyimpan(id);
    setPesanError("");
    try {
      const baru = await aksi();
      mutate((daftar) => daftar.map((t) => (t.id_testimoni === id ? baru : t)));
    } catch (error) {
      setPesanError(error.message);
    } finally {
      setMenyimpan(null);
    }
  };

  const hapus = async (id) => {
    setMenyimpan(id);
    setPesanError("");
    try {
      await hapusTestimoni(id);
      mutate((daftar) => daftar.filter((t) => t.id_testimoni !== id));
    } catch (error) {
      setPesanError(error.message);
    } finally {
      setMenyimpan(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#39000a]">Kelola Testimoni</h1>
          <p className="mt-1 text-sm text-[#685856]">
            Testimoni tampil di website bila sudah Diterima dan saklar Tampil menyala.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormTerbuka(true)}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-[#39000a] px-4 text-sm font-semibold text-white hover:bg-[#5a0c1a] active:bg-[#2a0007]"
        >
          <Icon icon={faPlus} class="text-xs" /> Tambah Testimoni
        </button>
      </div>

      {/* Filter status; overflow-x-auto = bisa digeser di HP bila tidak muat */}
      <div role="tablist" aria-label="Filter status" className="mt-5 flex gap-1 overflow-x-auto border-b border-[#f0dedf]">
        <For each={FILTER}>
          {(f) => (
            <button
              type="button"
              role="tab"
              aria-selected={filter() === f.nilai}
              onClick={() => setFilter(f.nilai)}
              className={`min-h-11 shrink-0 cursor-pointer border-b-2 px-3 text-sm font-semibold ${
                filter() === f.nilai
                  ? "border-[#39000a] text-[#39000a]"
                  : "border-transparent text-[#685856] hover:text-[#302929]"
              }`}
            >
              {f.label} <span className="font-normal">({jumlah(f.nilai)})</span>
            </button>
          )}
        </For>
      </div>

      <Show when={pesanError()}>
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {pesanError()}
        </p>
      </Show>

      <div className="mt-4">
        <Switch>
          <Match when={testimoni.loading}>
            <p className="p-8 text-center text-sm text-[#685856]">Memuat testimoni...</p>
          </Match>
          <Match when={testimoni.error}>
            <div className="p-8 text-center text-sm text-[#685856]">
              Testimoni belum bisa dimuat.{" "}
              <button type="button" onClick={refetch} className="min-h-11 cursor-pointer px-2 font-semibold text-[#54141d] underline">
                Coba lagi
              </button>
            </div>
          </Match>
          <Match when={tampil().length === 0}>
            <p className="rounded-xl border border-[#f0dedf] bg-white p-8 text-center text-sm text-[#685856]">
              Tidak ada testimoni di sini.
            </p>
          </Match>
          <Match when={tampil().length > 0}>
            <ul className="space-y-3">
              <For each={tampil()}>
                {(t) => (
                  <li className="rounded-xl border border-[#f0dedf] bg-white p-4">
                    {/* Baris atas: nama + instansi kiri, status + sumber + tanggal kanan */}
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[#302929]">{t.nama_klien}</p>
                        <p className="text-sm text-[#685856]">
                          {[t.instansi, t.nama_acara && `${t.nama_acara}${t.is_acara_privat ? " (privat)" : ""}`]
                            .filter(Boolean)
                            .join(" · ") || "-"}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={`rounded-full border px-2 py-0.5 font-semibold ${WARNA_STATUS[t.status]}`}>
                          {LABEL_STATUS[t.status]}
                        </span>
                        <span className="rounded-full border border-[#f0dedf] px-2 py-0.5 text-[#685856]">
                          {t.sumber === "whatsapp" ? "WhatsApp" : "Web"}
                        </span>
                        <span className="text-[#685856]">{formatTanggal(t.tanggal_input)}</span>
                      </div>
                    </div>

                    <Show when={t.rating}>
                      <p className="mt-2 text-sm text-[#2d2020]" aria-label={`Rating ${t.rating} dari 5`}>
                        <span aria-hidden="true">{"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}</span>
                      </p>
                    </Show>
                    {/* whitespace-pre-line = baris baru dari pengirim tetap terlihat */}
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#302929]">{t.isi_testimoni}</p>

                    {/* Aksi per status:
                        Ditunggu = Terima / Tolak (belum pernah diputuskan)
                        Diterima = saklar Tampil + Hapus
                        Ditolak  = hanya Hapus */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#f0dedf] pt-2">
                      <div className="flex items-center gap-2">
                        <Show when={t.status === "disetujui"}>
                          <span className="text-sm text-[#685856]">Tampil</span>
                          <Toggle
                            label={`Tampil: ${t.nama_klien}`}
                            checked={t.is_aktif}
                            disabled={menyimpan() === t.id_testimoni}
                            onChange={(nilai) => ubah(t.id_testimoni, () => setAktifTestimoni(t.id_testimoni, nilai))}
                          />
                        </Show>
                      </div>

                      <div className="flex flex-wrap justify-end gap-1">
                        <Show when={t.status === "menunggu"}>
                          <button
                            type="button"
                            disabled={menyimpan() === t.id_testimoni}
                            onClick={() => ubah(t.id_testimoni, () => setStatusTestimoni(t.id_testimoni, "disetujui"))}
                            className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-green-800 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Icon icon={faCheck} class="text-xs" /> Terima
                          </button>
                          <button
                            type="button"
                            disabled={menyimpan() === t.id_testimoni}
                            onClick={() => ubah(t.id_testimoni, () => setStatusTestimoni(t.id_testimoni, "ditolak"))}
                            className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md px-3 text-sm text-[#685856] hover:bg-[#f5efeb] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Icon icon={faXmark} class="text-xs" /> Tolak
                          </button>
                        </Show>
                        <Show when={t.status !== "menunggu"}>
                          <button
                            type="button"
                            disabled={menyimpan() === t.id_testimoni}
                            onClick={() => setKonfirmasiHapus({ id: t.id_testimoni, nama: t.nama_klien })}
                            className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md px-3 text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Icon icon={faTrash} class="text-xs" /> Hapus
                          </button>
                        </Show>
                      </div>
                    </div>
                  </li>
                )}
              </For>
            </ul>
          </Match>
        </Switch>
      </div>

      {/* Tambah testimoni yang diterima lewat WhatsApp / langsung; tersimpan sebagai Disetujui */}
      <Show when={formTerbuka()}>
        <TestimoniForm
          judul="Tambah Testimoni"
          internal
          onTutup={() => setFormTerbuka(false)}
          onKirim={async (data) => {
            const baru = await kirimTestimoni(data);
            mutate((daftar) => [baru, ...(daftar ?? [])]);
            setFormTerbuka(false);
          }}
        />
      </Show>

      <Show when={konfirmasiHapus()}>
        {(k) => (
          <KonfirmasiModal
            bahaya
            labelKonfirmasi="Ya, hapus"
            onBatal={() => setKonfirmasiHapus(null)}
            onKonfirmasi={() => {
              const { id } = k();
              setKonfirmasiHapus(null);
              hapus(id);
            }}
          >
            Hapus testimoni dari <strong>{k().nama}</strong>? Testimoni yang dihapus tidak bisa dikembalikan.
          </KonfirmasiModal>
        )}
      </Show>
    </div>
  );
}
