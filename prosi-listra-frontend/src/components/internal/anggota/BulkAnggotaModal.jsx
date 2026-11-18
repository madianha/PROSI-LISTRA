import { createMemo, createSignal, createUniqueId, For, Index, onCleanup, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { Portal } from "solid-js/web";
import { faDownload, faFileCsv, faPlus, faTimes, faTrash } from "@fortawesome/free-solid-svg-icons";
import Icon from "../../Icon";
import { createAnggotaBulk } from "../../../api/anggota";
import { barisBaru, barisKosong, cocokkanHeader, KOLOM_BULK, pecahTeks, TEMPLATE_CSV } from "../../../utils/tabelTempel";

const BARIS_AWAL = 5;
const PILIHAN_PERAN = ["Kepengurusan", "Humas", "Pelatih", "Anggota", "Alumni"];

/**
 * Tambah Massal Anggota: tabel seperti spreadsheet. Tempel (Ctrl+V) dari Google Sheets / Excel / .csv,
 * periksa, lalu simpan sekaligus. Ada baris salah = tidak ada yang disimpan; sel yang salah ditandai.
 * props.onSelesai(jumlah) = dipanggil setelah tersimpan; props.onTutup = Batal / Esc / klik di luar.
 */
export default function BulkAnggotaModal(props) {
  const idJudul = createUniqueId();
  const idPeran = createUniqueId();
  const [rows, setRows] = createStore(Array.from({ length: BARIS_AWAL }, barisBaru));
  // kesalahan dari server, per baris tabel (index 0) dan kolom: { "2:email": "Email sudah terdaftar." }
  const [salah, setSalah] = createSignal({});
  const [pesan, setPesan] = createSignal("");
  const [menyimpan, setMenyimpan] = createSignal(false);

  const terisi = createMemo(() => rows.filter((r) => !barisKosong(r)).length);
  const daftarSalah = createMemo(() =>
    Object.entries(salah()).map(([kunci, isi]) => {
      const [i, kolom] = kunci.split(":");
      return { baris: Number(i) + 1, label: KOLOM_BULK.find((k) => k.kunci === kolom)?.label ?? kolom, isi };
    }),
  );

  const ubahSel = (i, kunci, nilai) => {
    setRows(i, kunci, nilai);
    if (salah()[`${i}:${kunci}`]) {
      const sisa = { ...salah() };
      delete sisa[`${i}:${kunci}`];
      setSalah(sisa);
    }
  };

  /** Isi tabel dari teks (tempelan / isi file), mulai dari baris & kolom tertentu. Header di baris pertama dikenali. */
  function isiDariTeks(teks, mulaiBaris, mulaiKolom) {
    let data = pecahTeks(teks);
    if (data.length === 0) return;
    const header = cocokkanHeader(data[0]);
    let urutanKolom;
    if (header) {
      urutanKolom = header; // kolom dicocokkan lewat judulnya
      data = data.slice(1);
      mulaiKolom = 0;
    } else {
      urutanKolom = KOLOM_BULK.slice(mulaiKolom).map((k) => k.kunci);
    }
    // tambah baris bila tempelan lebih panjang dari tabel
    const perlu = mulaiBaris + data.length - rows.length;
    if (perlu > 0) setRows((r) => [...r, ...Array.from({ length: perlu }, barisBaru)]);
    data.forEach((sel, j) => {
      sel.forEach((nilai, c) => {
        const kunci = urutanKolom[c];
        if (kunci) setRows(mulaiBaris + j, kunci, nilai);
      });
    });
    setSalah({});
    setPesan("");
  }

  const tempel = (e, i, c) => {
    const teks = e.clipboardData?.getData("text/plain") ?? "";
    // satu nilai biasa: biarkan browser menempel ke sel ini saja
    if (!teks.includes("\t") && !teks.includes("\n") && !teks.includes(",")) return;
    e.preventDefault();
    isiDariTeks(teks, i, c);
  };

  const unggah = async (e) => {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = "";
    if (!file) return;
    // file baru menggantikan isi tabel
    setRows(Array.from({ length: 1 }, barisBaru));
    isiDariTeks(await file.text(), 0, 0);
  };

  const unduhTemplate = () => {
    const url = URL.createObjectURL(new Blob([TEMPLATE_CSV], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-anggota.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  async function simpan() {
    // baris kosong dilewati; ingat nomor baris aslinya untuk menandai kesalahan
    const asal = [];
    const kirim = [];
    rows.forEach((r, i) => {
      if (barisKosong(r)) return;
      asal.push(i);
      kirim.push({ ...r });
    });
    if (kirim.length === 0) {
      setPesan("Tabel masih kosong. Tempel data dari spreadsheet atau ketik langsung.");
      return;
    }
    setMenyimpan(true);
    setPesan("");
    setSalah({});
    try {
      const hasil = await createAnggotaBulk(kirim);
      props.onSelesai(hasil.jumlah);
    } catch (error) {
      setPesan(error.message);
      setSalah(Object.fromEntries((error.kesalahan ?? []).map((k) => [`${asal[k.baris - 1]}:${k.kolom}`, k.pesan])));
    } finally {
      setMenyimpan(false);
    }
  }

  const tekanEsc = (e) => e.key === "Escape" && props.onTutup();
  onMount(() => document.addEventListener("keydown", tekanEsc));
  onCleanup(() => document.removeEventListener("keydown", tekanEsc));

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
        onClick={(e) => e.target === e.currentTarget && props.onTutup()}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={idJudul}
          className="flex max-h-[94vh] w-full max-w-6xl flex-col rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id={idJudul} className="font-serif text-xl font-bold text-[#39000a]">
                Tambah Massal Anggota
              </h2>
              <p className="mt-1 text-sm text-[#685856]">
                Salin sel dari Google Sheets / Excel lalu tempel (Ctrl+V) di tabel, atau unggah file .csv. Baris pertama boleh
                berisi judul kolom. Kata sandi semua anggota baru: <strong>password123</strong>.
              </p>
            </div>
            <button
              type="button"
              aria-label="Tutup"
              onClick={() => props.onTutup()}
              className="-mr-2 -mt-1 grid size-11 shrink-0 cursor-pointer place-items-center rounded-lg text-[#685856] hover:bg-[#f5efeb]"
            >
              <Icon icon={faTimes} />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-[#e6cfcf] px-3 text-sm font-semibold text-[#54141d] hover:bg-[#fdf7f7] focus-within:ring-2 focus-within:ring-[#39000a]">
              <Icon icon={faFileCsv} /> Unggah .csv
              <input type="file" accept=".csv,text/csv" onChange={unggah} className="sr-only" />
            </label>
            <button
              type="button"
              onClick={unduhTemplate}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-semibold text-[#54141d] hover:bg-[#fdf7f7]"
            >
              <Icon icon={faDownload} class="text-xs" /> Unduh template .csv
            </button>
          </div>

          <Show when={pesan()}>
            <div role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              <p className="font-semibold">{pesan()}</p>
              <Show when={daftarSalah().length > 0}>
                {/* max-h-28 overflow-y-auto = daftar panjang bisa digulir */}
                <ul className="mt-1 max-h-28 list-disc overflow-y-auto pl-5">
                  <For each={daftarSalah()}>
                    {(k) => (
                      <li>
                        Baris {k.baris} · {k.label}: {k.isi}
                      </li>
                    )}
                  </For>
                </ul>
              </Show>
            </div>
          </Show>

          {/* overflow-auto = tabel lebar bisa digeser; min-h-0 agar bagian ini yang bergulir, bukan seluruh jendela */}
          <div className="mt-3 min-h-0 flex-1 overflow-auto rounded-lg border border-[#ece2e0]">
            <table className="w-full min-w-[960px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-[#f7f1ee] text-left text-xs font-semibold text-[#685856]">
                <tr>
                  <th scope="col" className="w-10 border-b border-[#ece2e0] px-2 py-2 text-center">
                    #
                  </th>
                  <For each={KOLOM_BULK}>
                    {(k) => (
                      <th scope="col" className="border-b border-l border-[#ece2e0] px-2 py-2">
                        {k.label}
                        <Show when={k.wajib}>
                          <span className="text-red-600"> *</span>
                        </Show>
                      </th>
                    )}
                  </For>
                  <th scope="col" className="w-12 border-b border-l border-[#ece2e0]">
                    <span className="sr-only">Hapus baris</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <Index each={rows}>
                  {(row, i) => (
                    <tr className="odd:bg-white even:bg-[#fcfaf9]">
                      <td className="border-b border-[#f3ebe8] px-2 text-center text-xs text-[#9b8885]">{i + 1}</td>
                      <For each={KOLOM_BULK}>
                        {(k, c) => {
                          const kunciSalah = () => salah()[`${i}:${k.kunci}`];
                          return (
                            <td className="border-b border-l border-[#f3ebe8] p-0">
                              <input
                                aria-label={`${k.label} baris ${i + 1}`}
                                aria-invalid={kunciSalah() ? "true" : undefined}
                                title={kunciSalah() ?? ""}
                                list={k.kunci === "peran" ? idPeran : undefined}
                                placeholder={k.kunci.startsWith("is_") ? "Ya / Tidak" : ""}
                                value={row()[k.kunci]}
                                onInput={(e) => ubahSel(i, k.kunci, e.currentTarget.value)}
                                onPaste={(e) => tempel(e, i, c())}
                                // sel salah: latar merah muda + garis merah di dalam sel
                                className={`h-9 w-full bg-transparent px-2 text-[#302929] outline-none focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#39000a] ${
                                  kunciSalah() ? "bg-red-50 ring-1 ring-inset ring-red-400" : ""
                                }`}
                              />
                            </td>
                          );
                        }}
                      </For>
                      <td className="border-b border-l border-[#f3ebe8] text-center">
                        <button
                          type="button"
                          aria-label={`Hapus baris ${i + 1}`}
                          onClick={() => {
                            setRows((r) => r.filter((_, j) => j !== i));
                            setSalah({});
                          }}
                          className="grid size-9 w-full cursor-pointer place-items-center text-[#9b8885] hover:text-red-700"
                        >
                          <Icon icon={faTrash} class="text-xs" />
                        </button>
                      </td>
                    </tr>
                  )}
                </Index>
              </tbody>
            </table>
            <datalist id={idPeran}>
              <For each={PILIHAN_PERAN}>{(p) => <option value={p} />}</For>
            </datalist>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setRows((r) => [...r, barisBaru()])}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-semibold text-[#54141d] hover:bg-[#fdf7f7]"
            >
              <Icon icon={faPlus} class="text-xs" /> Tambah baris
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#685856]">{terisi()} baris terisi</span>
              <button
                type="button"
                onClick={() => props.onTutup()}
                className="min-h-11 cursor-pointer rounded-lg px-4 text-sm font-semibold text-[#685856] hover:bg-[#f5efeb]"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={menyimpan()}
                onClick={simpan}
                className="min-h-11 cursor-pointer rounded-lg bg-[#39000a] px-4 text-sm font-semibold text-white hover:bg-[#5a0c1a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {menyimpan() ? "Menyimpan..." : `Simpan ${terisi()} anggota`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
