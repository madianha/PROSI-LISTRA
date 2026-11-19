import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import UserAvatar from "../../components/internal/UserAvatar";

const MIN_PASSWORD = 8; // sama dengan aturan kata sandi di backend

const PERAN_LABEL = {
  admin: "Admin",
  listra: "Kepengurusan",
  humas: "Humas",
  pelatih: "Pelatih",
  anggota: "Anggota",
  alumni: "Alumni",
};

function formatPeran(peran) {
  if (!peran) return "—";
  const key = String(peran).toLowerCase();
  return PERAN_LABEL[key] ?? peran;
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem("listra_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const u = parsed?.user ?? parsed?.data ?? parsed;
    if (!u || typeof u !== "object") return null;
    if (!u.nama && !u.email) return null;
    return {
      id_anggota: u.id_anggota ?? null,
      nama: u.nama ?? "",
      email: u.email ?? null,
      npm: u.npm ?? null,
      angkatan_unpar: u.angkatan_unpar ?? null,
      peran: formatPeran(u.peran),
      jabatan: u.jabatan ?? null,
      is_aktif: u.is_aktif ?? true,
      spesialisasi: Array.isArray(u.spesialisasi) ? u.spesialisasi : [],
    };
  } catch {
    return null;
  }
}

function authHeaders() {
  const token = localStorage.getItem("listra_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const kosong = (v) => (v === null || v === undefined || v === "" ? "—" : v);

function Field(props) {
  return (
    <div>
      <dt class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6e5a5d]">{props.label}</dt>
      <dd class="mt-1 text-sm text-[#302929]">{props.children}</dd>
    </div>
  );
}

function PasswordField(props) {
  const [show, setShow] = createSignal(false);
  return (
    <label class="block w-full">
      <span class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6e5a5d]">
        {props.label}
      </span>
      <div class="relative w-full">
        <input
          type={show() ? "text" : "password"}
          name={props.name}
          aria-label={props.label}
          autocomplete={props.autocomplete}
          value={props.value}
          onInput={(e) => props.onInput(e.currentTarget.value)}
          class="h-11 w-full rounded-xl border border-[#e3d3d5] bg-white pl-3.5 pr-11 text-sm text-[#302929] transition focus:border-[#4a0e17] focus:outline-none focus:ring-4 focus:ring-[#4a0e17]/[0.07]"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={`${show() ? "Sembunyikan" : "Tampilkan"} ${props.label}`}
          class="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#8c7377] transition-all duration-150 hover:bg-[#f8eff0] hover:text-[#4a0e17] active:scale-95"
        >
          <Show
            when={show()}
            fallback={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            }
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
              <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
              <line x1="2" x2="22" y1="2" y2="22" />
            </svg>
          </Show>
        </button>
      </div>
      <Show when={props.hint}>
        <span class="mt-1.5 block text-xs text-[#6e5a5d]">{props.hint}</span>
      </Show>
    </label>
  );
}

export default function InternalProfile() {
  const [profile, setProfile] = createSignal(readStoredUser());
  const [loading, setLoading] = createSignal(!profile());
  const [loadError, setLoadError] = createSignal("");

  const [lama, setLama] = createSignal("");
  const [baru, setBaru] = createSignal("");
  const [konfirmasi, setKonfirmasi] = createSignal("");
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");
  const [saving, setSaving] = createSignal(false);

  let activeController = null;

  const loadProfile = async () => {
    if (activeController) activeController.abort();
    const controller = new AbortController();
    activeController = controller;
    const timeoutId = setTimeout(() => controller.abort(new DOMException("Timeout", "TimeoutError")), 10000);

    if (!profile()) setLoading(true);
    setLoadError("");

    try {
      const res = await fetch("/api/auth/me", {
        headers: authHeaders(),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Gagal memuat profil dari server.");
      }
      setProfile({
        ...data,
        peran: formatPeran(data.peran),
        is_aktif: data.is_aktif ?? true,
        spesialisasi: Array.isArray(data.spesialisasi) ? data.spesialisasi : [],
      });
    } catch (err) {
      if (err?.name === "AbortError") return;
      const msg =
        err?.name === "TimeoutError"
          ? "Koneksi ke server melebihi batas waktu. Pastikan backend aktif."
          : err?.message || "Gagal memuat profil dari server.";
      setLoadError(msg);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  onMount(() => {
    void loadProfile();
  });

  onCleanup(() => {
    if (activeController) activeController.abort();
  });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!lama() || !baru() || !konfirmasi()) {
      setError("Semua kolom kata sandi wajib diisi.");
      return;
    }
    if (baru().length < MIN_PASSWORD) {
      setError(`Kata sandi baru minimal ${MIN_PASSWORD} karakter.`);
      return;
    }
    if (baru() !== konfirmasi()) {
      setError("Konfirmasi kata sandi tidak sesuai.");
      return;
    }
    if (baru() === lama()) {
      setError("Kata sandi baru tidak boleh sama dengan kata sandi lama.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          kata_sandi_lama: lama(),
          kata_sandi_baru: baru(),
          konfirmasi_kata_sandi: konfirmasi(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Gagal memperbarui kata sandi.");
        return;
      }
      setSuccess(data?.message || "Kata sandi berhasil diperbarui.");
      setLama("");
      setBaru("");
      setKonfirmasi("");
    } catch {
      setError("Gagal terhubung ke server. Pastikan backend aktif.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div class="mx-auto max-w-6xl">
      <header>
        <h1 class="font-serif text-2xl font-bold text-[#39000a]">Profil Akun</h1>
        <p class="mt-1 text-sm text-[#6e5a5d]">
          Lihat informasi keanggotaan dan kelola keamanan kata sandi Anda.
        </p>
      </header>

      <div class="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <section
          aria-labelledby="judul-info"
          class="rounded-2xl border border-[#ede0e2] bg-white p-6 shadow-sm sm:p-8 lg:col-span-7"
        >
          <h2 id="judul-info" class="sr-only">Informasi Akun</h2>

          <Show when={loading() && !profile()}>
            <p class="text-sm text-[#6e5a5d]">Memuat profil…</p>
          </Show>

          <Show when={loadError()}>
            <div
              role="alert"
              class="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            >
              <span>{loadError()}</span>
              <button
                type="button"
                onClick={loadProfile}
                class="font-semibold underline underline-offset-2 hover:text-rose-950"
              >
                Coba lagi
              </button>
            </div>
          </Show>

          <Show when={profile()}>
            {(u) => (
              <>
                <div class="flex items-center gap-4 border-b border-[#ede0e2] pb-6">
                  <UserAvatar class="h-14 w-14" />
                  <div class="min-w-0">
                    <p class="truncate font-serif text-xl font-bold text-[#39000a]">{kosong(u().nama)}</p>
                    <p class="truncate text-sm text-[#6e5a5d]">{kosong(u().email)}</p>
                    <div class="mt-2 flex flex-wrap gap-2">
                      <span class="rounded-full bg-[#f8eff0] px-2.5 py-0.5 text-xs font-semibold text-[#4a0e17]">
                        {kosong(u().peran)}
                      </span>
                      <span
                        class={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          u().is_aktif ? "bg-emerald-50 text-emerald-800" : "bg-[#efe7e8] text-[#6e5a5d]"
                        }`}
                      >
                        {u().is_aktif ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                  </div>
                </div>

                <dl class="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                  <Field label="Nama Lengkap">{kosong(u().nama)}</Field>
                  <Field label="Email UNPAR">{kosong(u().email)}</Field>
                  <Field label="NPM">{kosong(u().npm)}</Field>
                  <Field label="Angkatan UNPAR">{kosong(u().angkatan_unpar)}</Field>
                  <Field label="Peran">{kosong(u().peran)}</Field>
                  <Field label="Jabatan Struktural">{kosong(u().jabatan)}</Field>
                  <Field label="Status Keanggotaan">
                    <span
                      class={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u().is_aktif ? "bg-emerald-50 text-emerald-800" : "bg-[#efe7e8] text-[#6e5a5d]"
                      }`}
                    >
                      {u().is_aktif ? "Aktif" : "Nonaktif"}
                    </span>
                  </Field>
                  <div class="sm:col-span-2">
                    <Field label="Spesialisasi Seni">
                      <Show
                        when={u().spesialisasi?.length}
                        fallback={<span>—</span>}
                      >
                        <ul class="flex flex-wrap gap-2">
                          <For each={u().spesialisasi}>
                            {(s) => (
                              <li class="rounded-full border border-[#ede0e2] bg-[#fbf8f7] px-3 py-1 text-xs text-[#4a0e17]">
                                {s.nama_spesialisasi}
                              </li>
                            )}
                          </For>
                        </ul>
                      </Show>
                    </Field>
                  </div>
                </dl>
              </>
            )}
          </Show>
        </section>

        <section
          aria-labelledby="judul-sandi"
          class="rounded-2xl border border-[#ede0e2] bg-white p-6 shadow-sm sm:p-8 lg:col-span-5"
        >
          <h2 id="judul-sandi" class="font-serif text-xl font-bold text-[#39000a]">Ganti Kata Sandi</h2>
          <p class="mt-1 text-sm text-[#6e5a5d]">
            Gunakan kata sandi yang sulit ditebak dan tidak dipakai di tempat lain.
          </p>

          <form onSubmit={submit} class="mt-6 w-full space-y-5" novalidate>
            <Show when={error()}>
              <p role="alert" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {error()}
              </p>
            </Show>
            <Show when={success()}>
              <p role="status" class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {success()}
              </p>
            </Show>

            <PasswordField
              label="Kata Sandi Lama"
              name="kata_sandi_lama"
              autocomplete="current-password"
              value={lama()}
              onInput={setLama}
            />
            <PasswordField
              label="Kata Sandi Baru"
              name="kata_sandi_baru"
              autocomplete="new-password"
              value={baru()}
              onInput={setBaru}
              hint={`Minimal ${MIN_PASSWORD} karakter.`}
            />
            <PasswordField
              label="Konfirmasi Kata Sandi Baru"
              name="konfirmasi_kata_sandi"
              autocomplete="new-password"
              value={konfirmasi()}
              onInput={setKonfirmasi}
            />

            <button
              type="submit"
              disabled={saving()}
              class="flex h-11 w-full items-center justify-center rounded-xl bg-[#4a0e17] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#58111a] disabled:opacity-60"
            >
              {saving() ? "Menyimpan..." : "Simpan Kata Sandi"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
