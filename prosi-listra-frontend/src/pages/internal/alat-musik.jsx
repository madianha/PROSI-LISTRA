import { createResource, createSignal, For, Show } from "solid-js";
import { createAlatMusik, deleteAlatMusik, listAlatMusik } from "../../api/alatMusik";

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

  const [alatMusikList, { refetch }] = createResource(listAlatMusik);

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
        <div className="grid grid-cols-[1fr_120px_100px] items-center border-b border-[#f8eaea] px-6 py-4">
          <p className="font-serif text-[11px] font-bold uppercase tracking-[0.18em] text-[#a0822e]">
            Nama Alat Musik
          </p>
          <p className="font-serif text-[11px] font-bold uppercase tracking-[0.18em] text-[#a0822e] text-center">
            Jumlah
          </p>
          <p className="font-serif text-[11px] font-bold uppercase tracking-[0.18em] text-[#a0822e] text-right">
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
                <div className="grid grid-cols-[1fr_120px_100px] items-center px-6 py-3.5 transition-colors hover:bg-[#fdfaf9]">
                  {/* Nama Alat Musik */}
                  <span className="text-[15px] font-semibold text-gray-900">
                    {item.nama_alat_musik}
                  </span>

                  {/* Jumlah Column */}
                  <div className="flex justify-center">
                    <span className="inline-flex items-center justify-center rounded-full bg-[#fdf5f5] px-3 py-0.5 text-xs font-bold text-[#39000a] border border-[#f4dede]">
                      {item.jumlah ?? 1}
                    </span>
                  </div>

                  {/* Aksi Column */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleHapus(item.id_alat_musik, item.nama_alat_musik)}
                      className="rounded-lg border border-[#edd7d7] px-4 py-1.5 text-xs font-semibold text-[#39000a] transition hover:border-[#39000a] hover:bg-rose-50/50"
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
    </div>
  );
}
