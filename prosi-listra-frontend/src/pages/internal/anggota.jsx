import {
  createResource,
  createSignal,
  createMemo,
  For,
  Match,
  onCleanup,
  Show,
  Switch,
} from "solid-js";
import { faCircleNotch, faPlus, faRotateLeft, faSearch } from "@fortawesome/free-solid-svg-icons";
import Icon from "../../components/Icon";
import KonfirmasiModal from "../../components/internal/KonfirmasiModal";
import AnggotaTable from "../../components/internal/anggota/AnggotaTable";
import AnggotaModal from "../../components/internal/anggota/AnggotaModal";
import {
  createAnggota,
  getSpesialisasiList,
  listAnggota,
  toggleStatusAktif,
  updateAnggota,
} from "../../api/anggota";
import { extractUnparEmail, normalizeYear } from "../../utils/anggota";

const PERAN_OPTIONS = ["Admin", "Kepengurusan", "Pelatih", "Anggota Biasa", "Alumni"];

const INITIAL_FORM = {
  nama: "",
  email: "",
  npm: "",
  peran: "Kepengurusan",
  jabatan: "",
  angkatan_unpar: "",
  is_aktif: true,
  spesialisasi_ids: [],
};

export default function InternalAnggota() {
  const [search, setSearch] = createSignal("");
  const [debouncedSearch, setDebouncedSearch] = createSignal("");
  const [filterPeran, setFilterPeran] = createSignal("Semua");
  const [filterAngkatan, setFilterAngkatan] = createSignal("Semua");

  let searchTimeoutId = null;
  let activeAbortController = null;

  const handleSearchInput = (value) => {
    setSearch(value);
    if (searchTimeoutId) clearTimeout(searchTimeoutId);
    searchTimeoutId = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
  };

  onCleanup(() => {
    if (searchTimeoutId) clearTimeout(searchTimeoutId);
    if (activeAbortController) activeAbortController.abort();
  });

  const [masterAnggotaResource, { refetch: refetchMasterAnggota, mutate: mutateMasterAnggota }] =
    createResource(() => listAnggota());

  const [spesialisasiList] = createResource(getSpesialisasiList);
  const [anggotaResource, { refetch: refetchAnggota, mutate: mutateAnggota }] = createResource(
    () => ({
      search: debouncedSearch(),
      peran: filterPeran(),
      angkatan: filterAngkatan(),
    }),
    async (params) => {
      if (activeAbortController) {
        activeAbortController.abort();
      }
      activeAbortController = new AbortController();
      try {
        const result = await listAnggota({ ...params, signal: activeAbortController.signal });
        return result;
      } catch (err) {
        if (err.name === "AbortError") {
          // If aborted, retain current data instead of throwing error state
          return anggotaResource() || [];
        }
        throw err;
      }
    }
  );

  const [konfirmasiStatus, setKonfirmasiStatus] = createSignal(null);
  const [updatingStatusId, setUpdatingStatusId] = createSignal(null);

  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [editingId, setEditingId] = createSignal(null);
  const [formData, setFormData] = createSignal({ ...INITIAL_FORM });
  const [formError, setFormError] = createSignal("");
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [globalError, setGlobalError] = createSignal("");

  const spesialisasiTari = createMemo(() => {
    return (spesialisasiList() || []).filter((s) => s.kategori === "TARI");
  });

  const spesialisasiMusik = createMemo(() => {
    return (spesialisasiList() || []).filter((s) => s.kategori === "MUSIK");
  });

  const availableAngkatan = createMemo(() => {
    if (masterAnggotaResource.error) return [];
    let list = [];
    try {
      list = masterAnggotaResource() || [];
    } catch {
      return [];
    }
    const years = list
      .map((m) => m.angkatan_unpar || m.angkatan)
      .filter(Boolean)
      .map(normalizeYear);
    return Array.from(new Set(years.filter((y) => y !== null && y !== undefined))).sort(
      (a, b) => b - a
    );
  });

  const resetFilter = () => {
    if (searchTimeoutId) clearTimeout(searchTimeoutId);
    setSearch("");
    setDebouncedSearch("");
    setFilterPeran("Semua");
    setFilterAngkatan("Semua");
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ ...INITIAL_FORM, spesialisasi_ids: [] });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id_anggota);
    setFormData({
      nama: item.nama || "",
      email: item.email || "",
      npm: item.npm || "",
      peran: item.peran || "Kepengurusan",
      jabatan: item.jabatan || "",
      angkatan_unpar:
        item.angkatan_unpar != null
          ? String(normalizeYear(item.angkatan_unpar) ?? item.angkatan_unpar)
          : "",
      is_aktif: item.is_aktif ?? true,
      spesialisasi_ids: (item.spesialisasi || []).map((s) => s.id_spesialisasi),
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ ...INITIAL_FORM });
    setFormError("");
  };

  const updateFormField = (key, val) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: val };
      if (key === "peran" && (val === "Anggota Biasa" || val === "Alumni")) {
        next.jabatan = "";
      }
      return next;
    });
  };

  const handleEmailChange = (val) => {
    const current = { ...formData(), email: val };
    const extracted = extractUnparEmail(val);
    if (extracted) {
      if (extracted.npm && !current.npm) {
        current.npm = extracted.npm;
      }
      if (extracted.angkatan && !current.angkatan_unpar) {
        const normalized = normalizeYear(extracted.angkatan);
        current.angkatan_unpar = normalized ? String(normalized) : String(extracted.angkatan);
      }
    }
    setFormData(current);
  };

  const toggleSpesialisasi = (id) => {
    const current = formData().spesialisasi_ids || [];
    if (current.includes(id)) {
      setFormData({
        ...formData(),
        spesialisasi_ids: current.filter((x) => x !== id),
      });
    } else {
      setFormData({
        ...formData(),
        spesialisasi_ids: [...current, id],
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const data = formData();
    if (!data.nama.trim()) {
      setFormError("Nama anggota wajib diisi.");
      return;
    }

    const payload = {
      nama: data.nama.trim(),
      email: data.email.trim() || null,
      npm: data.npm.trim() || null,
      peran: data.peran,
      jabatan: data.jabatan.trim() || null,
      angkatan_unpar: data.angkatan_unpar ? Number(data.angkatan_unpar) : null,
      is_aktif: data.is_aktif,
      spesialisasi_ids: data.spesialisasi_ids,
    };

    setIsSubmitting(true);
    try {
      if (editingId()) {
        const updated = await updateAnggota(editingId(), payload);
        mutateAnggota((prev) =>
          prev ? prev.map((a) => (a.id_anggota === editingId() ? updated : a)) : [updated]
        );
        mutateMasterAnggota((prev) =>
          prev ? prev.map((a) => (a.id_anggota === editingId() ? updated : a)) : [updated]
        );
      } else {
        const created = await createAnggota(payload);
        mutateAnggota((prev) => (prev ? [created, ...prev] : [created]));
        mutateMasterAnggota((prev) => (prev ? [created, ...prev] : [created]));
      }
      closeModal();
    } catch (err) {
      setFormError(err.message || "Gagal menyimpan data anggota.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAktif = async (id, currentVal) => {
    const nextVal = !currentVal;
    setUpdatingStatusId(id);
    setGlobalError("");
    try {
      const updated = await toggleStatusAktif(id, nextVal);
      mutateAnggota((prev) =>
        prev ? prev.map((a) => (a.id_anggota === id ? updated : a)) : []
      );
      mutateMasterAnggota((prev) =>
        prev ? prev.map((a) => (a.id_anggota === id ? updated : a)) : []
      );
    } catch (err) {
      setGlobalError(err.message || "Gagal mengubah status aktif.");
    } finally {
      setUpdatingStatusId(null);
      setKonfirmasiStatus(null);
    }
  };

  return (
    <div class="mx-auto max-w-6xl">
      {/* Header */}
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="font-serif text-2xl font-bold text-[#39000a]">Manajemen Anggota</h1>
          <p class="mt-1 text-sm text-[#685856]">
            Kelola profil anggota LISTRA, peran, angkatan, keaktifan, dan spesialisasi seni.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          class="inline-flex items-center gap-2 rounded-lg bg-[#39000a] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5a0c1a]"
        >
          <Icon icon={faPlus} class="text-xs" /> Tambah Anggota
        </button>
      </div>

      <Show when={globalError()}>
        <div role="alert" class="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {globalError()}
        </div>
      </Show>

      {/* Filter Bar */}
      <div class="mt-6 rounded-xl border border-[#f0dedf] bg-white p-4 shadow-sm">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div class="md:col-span-2">
            <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#685856]">
              Cari Anggota
            </label>
            <div class="relative">
              <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#a89a98]">
                <Icon icon={faSearch} class="text-xs" />
              </span>
              <input
                type="text"
                placeholder="Cari nama, NPM, atau email..."
                value={search()}
                onInput={(e) => handleSearchInput(e.currentTarget.value)}
                class="w-full rounded-lg border border-[#d9cdca] py-2 pl-9 pr-8 text-sm text-[#302929] focus:border-[#39000a] focus:outline-none focus:ring-1 focus:ring-[#39000a]"
              />
              <Show when={anggotaResource.loading && Boolean(anggotaResource())}>
                <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#39000a]/70">
                  <Icon icon={faCircleNotch} class="animate-spin text-xs" />
                </span>
              </Show>
            </div>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#685856]">
              Peran
            </label>
            <select
              value={filterPeran()}
              onChange={(e) => setFilterPeran(e.currentTarget.value)}
              class="w-full rounded-lg border border-[#d9cdca] bg-white px-3 py-2 text-sm text-[#302929] focus:border-[#39000a] focus:outline-none focus:ring-1 focus:ring-[#39000a]"
            >
              <option value="Semua">Semua Peran</option>
              <For each={PERAN_OPTIONS}>{(opt) => <option value={opt}>{opt}</option>}</For>
            </select>
          </div>

          <div class="flex items-end gap-2">
            <div class="flex-1">
              <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#685856]">
                Angkatan
              </label>
              <select
                value={filterAngkatan()}
                onChange={(e) => setFilterAngkatan(e.currentTarget.value)}
                class="w-full rounded-lg border border-[#d9cdca] bg-white px-3 py-2 text-sm text-[#302929] focus:border-[#39000a] focus:outline-none focus:ring-1 focus:ring-[#39000a]"
              >
                <option value="Semua">Semua Angkatan</option>
                <For each={availableAngkatan()}>
                  {(akt) => <option value={akt}>{akt}</option>}
                </For>
              </select>
            </div>
            <button
              type="button"
              onClick={resetFilter}
              title="Reset Filter"
              class="inline-flex h-[38px] items-center justify-center rounded-lg border border-[#d9cdca] px-3 text-sm text-[#685856] transition hover:bg-[#fff7f6] hover:text-[#39000a]"
            >
              <Icon icon={faRotateLeft} class="text-xs" />
            </button>
          </div>
        </div>
      </div>

      {/* Member Table */}
      <div class="relative mt-6 min-h-[420px] overflow-hidden rounded-xl border border-[#f0dedf] bg-white shadow-sm">
        <Switch>
          <Match when={anggotaResource.loading && !anggotaResource()}>
            <div class="flex min-h-[420px] flex-col items-center justify-center gap-2 p-8 text-center text-sm text-[#685856]">
              <Icon icon={faCircleNotch} class="animate-spin text-lg text-[#39000a]" />
              <p>Memuat data anggota...</p>
            </div>
          </Match>

          <Match when={anggotaResource.error && !anggotaResource()}>
            <div class="flex min-h-[420px] flex-col items-center justify-center gap-2 p-8 text-center text-sm text-[#685856]">
              <p>Data anggota gagal dimuat.</p>
              <button
                type="button"
                onClick={() => {
                  refetchAnggota();
                  refetchMasterAnggota();
                }}
                class="font-semibold text-[#54141d] underline hover:text-[#39000a]"
              >
                Coba lagi
              </button>
            </div>
          </Match>

          <Match when={!anggotaResource.loading && anggotaResource()?.length === 0}>
            <div class="flex min-h-[420px] items-center justify-center p-8 text-center text-sm text-[#685856]">
              Tidak ada data anggota yang cocok dengan filter.
            </div>
          </Match>

          <Match when={anggotaResource()}>
            <div
              class={`transition-opacity duration-200 ${
                anggotaResource.loading ? "pointer-events-none opacity-60" : ""
              }`}
            >
              <AnggotaTable
                data={anggotaResource() || []}
                updatingStatusId={updatingStatusId()}
                onEdit={openEditModal}
                onToggleStatus={(item) =>
                  setKonfirmasiStatus({
                    id: item.id_anggota,
                    nama: item.nama,
                    currentStatus: item.is_aktif,
                  })
                }
              />
            </div>
          </Match>
        </Switch>
      </div>

      {/* Confirmation Modal untuk Toggle Status */}
      <Show when={konfirmasiStatus()}>
        {(item) => (
          <KonfirmasiModal
            labelKonfirmasi={item().currentStatus ? "Ya, Nonaktifkan" : "Ya, Aktifkan"}
            onBatal={() => setKonfirmasiStatus(null)}
            onKonfirmasi={() => handleToggleAktif(item().id, item().currentStatus)}
          >
            Apakah Anda yakin ingin {item().currentStatus ? "menonaktifkan" : "mengaktifkan"}{" "}
            <strong>{item().nama}</strong>?
          </KonfirmasiModal>
        )}
      </Show>

      {/* Edit Anggota Modal */}
      <AnggotaModal
        isOpen={isModalOpen()}
        editingId={editingId()}
        formData={formData()}
        formError={formError()}
        isSubmitting={isSubmitting()}
        peranOptions={PERAN_OPTIONS}
        spesialisasiTari={spesialisasiTari()}
        spesialisasiMusik={spesialisasiMusik()}
        onClose={closeModal}
        setFormData={updateFormField}
        onEmailChange={handleEmailChange}
        onToggleSpesialisasi={toggleSpesialisasi}
        onSubmit={handleSubmit}
      />
    </div>
  );
}






