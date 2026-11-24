import { createResource, createSignal, createUniqueId, For, onCleanup, onMount, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import Icon from "../../components/Icon";
import { createAlatMusik, deleteAlatMusik, listAlatMusik, updateAlatMusik } from "../../api/alatMusik";

// Kolom daftar. HP: nama | jumlah, tombol Ubah dan Hapus di baris sendiri di bawahnya.
// sm ke atas: nama | jumlah | aksi dalam satu baris.
// minmax(0,1fr) = kolom nama mengisi sisa lebar dan boleh menyempit (nama panjang turun baris).
// Kolom lain lebarnya tetap (bukan auto) supaya header dan setiap baris selalu sejajar.
const KOLOM = "grid-cols-[minmax(0,1fr)_72px] sm:grid-cols-[minmax(0,1fr)_120px_168px]";

// Ubah dan Hapus berbentuk sama; min-h-11 = tinggi 44px, mudah diketuk di HP
const TOMBOL_AKSI =
  "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg border border-[#edd7d7] px-3 text-xs font-semibold text-[#39000a] transition hover:border-[#39000a] hover:bg-rose-50/50";

/**
 * Jendela ubah jumlah satu alat musik. Namanya tidak bisa diubah di sini.
 * props.alat     = baris yang diubah ({ id_alat_musik, nama_alat_musik, jumlah })
 * props.onSimpan = async (jumlah) => ..., lempar Error bila gagal (pesannya tampil di jendela)
 * props.onTutup  = dipanggil saat Batal, Esc, atau klik di luar jendela
 */
function UbahJumlahModal(props) {
  const idJudul = createUniqueId();
  const idKolom = createUniqueId();
  const [jumlah, setJumlah] = createSignal(props.alat.jumlah);
  const [menyimpan, setMenyimpan] = createSignal(false);
  const [pesanError, setPesanError] = createSignal("");
  let kolomJumlah;
  let tombolSimpan;

  const tekanTombol = (e) => {
    if (e.key === "Escape") return props.onTutup();
    // Tab berputar di dalam jendela, tidak lari ke halaman di belakangnya:
    // Tab di Simpan kembali ke kolom Jumlah, Shift+Tab di kolom Jumlah pindah ke Simpan
    if (e.key !== "Tab") return;
    if (e.shiftKey && document.activeElement === kolomJumlah) {
      e.preventDefault();
      tombolSimpan.focus();
    } else if (!e.shiftKey && document.activeElement === tombolSimpan) {
      e.preventDefault();
      kolomJumlah.focus();
    }
  };

  onMount(() => {
    kolomJumlah.focus(); // langsung bisa mengetik jumlah baru
    document.addEventListener("keydown", tekanTombol);
  });

  onCleanup(() => {
    document.removeEventListener("keydown", tekanTombol);
  });

  const simpan = async (e) => {
    e.preventDefault();
    setPesanError("");
    setMenyimpan(true);
    try {
      await props.onSimpan(Number(jumlah()));
    } catch (error) {
      setPesanError(error.message);
    } finally {
      setMenyimpan(false);
    }
  };

  return (
    // Portal = dirender langsung di <body>, jadi tidak terpotong layout halaman
    <Portal>
      {/* fixed inset-0 = menutupi seluruh layar; bg-black/40 = latar gelap transparan */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={(e) => e.target === e.currentTarget && props.onTutup()}
      >
        <form
          role="dialog"
          aria-modal="true"
          aria-labelledby={idJudul}
          onSubmit={simpan}
          className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
        >
          {/* wrap-break-word = nama panjang tanpa spasi tetap turun baris, tidak keluar dari jendela */}
          <h2 id={idJudul} className="font-serif text-xl font-bold wrap-break-word text-[#39000a]">
            {props.alat.nama_alat_musik}
          </h2>

          <label for={idKolom} className="mt-4 mb-1 block text-xs font-semibold text-[#302929]">
            Jumlah
          </label>
          <input
            id={idKolom}
            ref={kolomJumlah}
            type="number"
            min="1"
            required
            value={jumlah()}
            onInput={(e) => setJumlah(e.currentTarget.value)}
            className="min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-[#302929] focus:border-[#39000a] focus:ring-1 focus:ring-[#39000a] focus:outline-none"
          />

          <Show when={pesanError()}>
            <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {pesanError()}
            </p>
          </Show>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => props.onTutup()}
              className="min-h-11 cursor-pointer rounded-lg px-4 text-sm font-semibold text-[#685856] hover:bg-[#f5efeb] hover:text-[#302929] active:bg-[#ece4df]"
            >
              Batal
            </button>
            <button
              ref={tombolSimpan}
              type="submit"
              disabled={menyimpan()}
              className="min-h-11 cursor-pointer rounded-lg bg-[#39000a] px-4 text-sm font-semibold text-white hover:bg-[#5a0c1a] active:bg-[#2a0007] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {menyimpan() ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </Portal>
  );
}

export default function InternalAlatMusik() {
  const [modalOpen, setModalOpen] = createSignal(false);
  const [namaBaru, setNamaBaru] = createSignal("");
  const [jumlahBaru, setJumlahBaru] = createSignal(1);
  const [loadingAction, setLoadingAction] = createSignal(false);
  const [errorMsg, setErrorMsg] = createSignal("");

  // Pagination state (15 items per page matches the mockup list)
  // Pagination state (15 items per page)
  const [page, setPage] = createSignal(1);
  const pageSize = 15;

  const [alatMusikList, { refetch, mutate }] = createResource(listAlatMusik);
  // baris yang sedang diubah jumlahnya; null = jendela Ubah tertutup
  const [diubah, setDiubah] = createSignal(null);

  const totalPages = () => Math.max(1, Math.ceil((alatMusikList()?.length || 0) / pageSize));

  const paginatedList = () => {
    const list = alatMusikList() || [];
    const startIndex = (page() - 1) * pageSize;
    return list.slice(startIndex, startIndex + pageSize);
  };

  const nextPage = () => {
    if (page() < totalPages()) setPage(page() + 1);
  };

  const prevPage = () => {
    if (page() > 1) setPage(page() - 1);
  };

  const handleTambah = async (e) => {
    e.preventDefault();
    if (!namaBaru().trim()) return;

    setLoadingAction(true);
    setErrorMsg("");
    try {
      await createAlatMusik({
        nama_alat_musik: namaBaru().trim(),
        jumlah: Number(jumlahBaru()) || 1,
      });

      setNamaBaru("");
      setJumlahBaru(1);
      setModalOpen(false);
      await refetch();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleHapus = async (id, nama) => {
    if (!confirm(`Hapus alat musik "${nama}"?`)) return;

    try {
      await deleteAlatMusik(id);
      await refetch();
      if (page() > totalPages()) {
        setPage(totalPages());
      }
    } catch (err) {
      alert(err.message || "Gagal menghapus alat musik.");
    }
  };

  // Tutup jendela Ubah lalu kembalikan fokus ke tombol Ubah baris itu.
  // Tombolnya dicari ulang lewat id: setelah disimpan barisnya digambar ulang, tombol lamanya sudah hilang.
  const tutupUbah = () => {
    const id = diubah()?.id_alat_musik;
    setDiubah(null);
    document.getElementById(`ubah-alat-${id}`)?.focus();
  };

  const simpanJumlah = async (jumlah) => {
    const id = diubah().id_alat_musik;
    const baru = await updateAlatMusik(id, { jumlah });
    // ganti baris itu saja dengan data dari server, tanpa memuat ulang seluruh daftar
    mutate((daftar) => daftar.map((a) => (a.id_alat_musik === id ? baru : a)));
    tutupUbah();
  };

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#39000a]">
            Alat Musik
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Daftar alat musik yang dimiliki LISTRA.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg("");
            setModalOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-[#39000a] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#520914] active:scale-95"
        >
          <span>+</span>
          <span>Alat Musik</span>
        </button>
      </div>

      {/* Main Table / Container */}
      <section className="mt-6 rounded-2xl border border-[#f4e2e2] bg-white shadow-sm overflow-hidden">
        {/* Table Column Header */}
        {/* <div className="border-b border-[#f8eaea] px-6 py-4"> */}
        <div className={`grid items-center gap-x-3 border-b border-[#f8eaea] px-6 py-4 ${KOLOM}`}>
          <p className="font-serif text-[11px] font-bold uppercase tracking-[0.18em] text-[#a0822e]">
            Nama Alat Musik
          </p>
          <p className="font-serif text-[11px] font-bold uppercase tracking-[0.18em] text-[#a0822e] text-center">
            Jumlah
          </p>
          {/* hidden sm:block = judul Aksi hanya di layar sm ke atas; di HP tombolnya ada di baris sendiri */}
          <p className="hidden font-serif text-[11px] font-bold uppercase tracking-[0.18em] text-[#a0822e] text-right sm:block">
            Aksi
          </p>
        </div>

        {/* Loading State */}
        <Show when={alatMusikList.loading}>
          <div className="p-8 text-center text-sm text-gray-500">
            Memuat data alat musik...
          </div>
        </Show>

        {/* Error State */}
        <Show when={alatMusikList.error}>
          <div className="p-6 text-center text-sm text-red-600">
            Gagal memuat data alat musik. Pastikan backend sudah menyala.
          </div>
        </Show>

        {/* List of items */}
        <Show when={!alatMusikList.loading && !alatMusikList.error}>
          <div className="divide-y divide-[#f7eeee]">
            <For
              each={paginatedList()}
              fallback={
                <div className="p-8 text-center text-sm text-gray-500">
                  Belum ada alat musik. Klik "+ Alat Musik" untuk menambahkan.
                </div>
              }
            >
              {(item) => (
                <div className={`grid items-center gap-x-3 gap-y-1 px-6 py-2 transition-colors hover:bg-[#fdfaf9] ${KOLOM}`}>
                  {/* Nama Alat Musik; wrap-break-word = nama panjang turun baris, tidak mendorong kolom lain */}
                  <span className="text-[15px] font-semibold wrap-break-word text-gray-900">
                    {item.nama_alat_musik}
                  </span>

                  {/* Jumlah Column */}
                  <div className="flex justify-center">
                    <span className="inline-flex items-center justify-center rounded-full bg-[#fdf5f5] px-3 py-0.5 text-xs font-bold text-[#39000a] border border-[#f4dede]">
                      {item.jumlah ?? 1}
                    </span>
                  </div>

                  {/* Aksi Column. col-span-2 = di HP memakai lebar penuh di baris bawah; sm:col-span-1 = kembali jadi kolom ketiga */}
                  <div className="col-span-2 flex justify-end gap-2 sm:col-span-1">
                    <button
                      id={`ubah-alat-${item.id_alat_musik}`}
                      type="button"
                      onClick={() => setDiubah(item)}
                      className={TOMBOL_AKSI}
                    >
                      <Icon icon={faPen} /> Ubah
                    </button>
                    <button
                      onClick={() => handleHapus(item.id_alat_musik, item.nama_alat_musik)}
                      className={TOMBOL_AKSI}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </section>

      {/* Bottom Floating Navigation (matches image) */}
      <Show when={!alatMusikList.loading && (alatMusikList()?.length || 0) > 0}>
        <div className="mt-6 flex justify-center pb-8">
          <div className="inline-flex items-center gap-1 rounded-xl bg-[#282525] p-1.5 shadow-lg">
            <button
              onClick={prevPage}
              disabled={page() <= 1}
              aria-label="Previous Page"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={nextPage}
              disabled={page() >= totalPages()}
              aria-label="Next Page"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </Show>

      {/* Modal Tambah Alat Musik */}
      <Show when={modalOpen()}>
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#FDFBF9] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#eee0e0] pb-4">
              <h2 className="font-serif text-xl font-bold text-[#39000a]">
                Tambah Alat Musik
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTambah} className="mt-4 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#a0822e]">
                  Nama Alat Musik
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kendang, Bonang, Saron..."
                  value={namaBaru()}
                  onInput={(e) => setNamaBaru(e.currentTarget.value)}
                  className="mt-1.5 w-full rounded-lg border border-[#dbc0c0] bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#a0822e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#a0822e]">
                  Jumlah
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={jumlahBaru()}
                  onInput={(e) => setJumlahBaru(parseInt(e.currentTarget.value, 10) || 1)}
                  className="mt-1.5 w-full rounded-lg border border-[#dbc0c0] bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#a0822e]"
                />
              </div>

              <Show when={errorMsg()}>
                <p className="rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  {errorMsg()}
                </p>
              </Show>

              <div className="mt-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-[#39000a] px-4 py-2 text-sm font-semibold text-[#39000a] transition hover:bg-rose-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingAction()}
                  className="rounded-lg bg-[#39000a] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#520914] disabled:opacity-50"
                >
                  {loadingAction() ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Show>

      {/* Jendela Ubah jumlah, tampil selama diubah() berisi satu baris */}
      <Show when={diubah()}>
        {(alat) => <UbahJumlahModal alat={alat()} onSimpan={simpanJumlah} onTutup={tutupUbah} />}
      </Show>
    </div>
  );
}
