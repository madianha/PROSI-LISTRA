import { createSignal, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import CustomButton from "../../components/CustomButton";
import logoListra from "../../img/logo-listra.png";
import logoUnpar from "../../img/Logo-UNPAR.png";

export default function LoginInternal() {
  const navigate = useNavigate();
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [showPassword, setShowPassword] = createSignal(false);
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  const masuk = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email().trim(), password: password() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Email atau kata sandi salah.");
        return;
      }
      if (data?.token) {
        localStorage.setItem("listra_token", data.token);
      }
      if (data?.user) {
        localStorage.setItem("listra_user", JSON.stringify(data.user));
      }
      navigate("/internal/kalender");
    } catch {
      setError("Gagal terhubung ke server. Pastikan backend aktif.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="flex min-h-screen flex-col bg-[#fbf8f7]">
      <header className="sticky top-0 z-20 flex min-h-[54px] items-center gap-3 border-b border-[#f0dedf] bg-white px-4">
        <img src={logoListra} alt="Logo Listra" className="h-8 w-auto" />
        <img src={logoUnpar} alt="Logo UNPAR" className="h-8 w-auto" />
        <span className="font-serif text-lg text-[#39000a]">LISTRA · Panel Internal</span>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <form
          onSubmit={masuk}
          className="w-full max-w-[420px] rounded-2xl border border-[#ede0e2] bg-white p-8 shadow-[0_14px_40px_-14px_rgba(74,14,23,0.09)] sm:p-10"
        >
          <div className="mb-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8c686d]">
              PORTAL INTERNAL · LISTRA UNPAR
            </p>
            <h1 className="mt-2 font-serif text-[28px] font-bold leading-tight tracking-[-0.02em] text-[#2b090e]">
              Masuk ke Portal
            </h1>
            <p className="mt-1.5 text-[14px] leading-relaxed text-[#6e5a5d]">
              Kelola jadwal kegiatan, keanggotaan, dan informasi organisasi.
            </p>
          </div>

          <Show when={error()}>
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700"
            >
              {error()}
            </div>
          </Show>

          <div className="space-y-5">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6e5a5d]">
                EMAIL
              </span>
              <input
                type="email"
                required
                placeholder="Masukkan email"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
                className="h-11 w-full rounded-xl border border-[#e3d3d5] bg-white px-3.5 text-sm text-[#302929] placeholder:text-[#a89a98] transition focus:border-[#4a0e17] focus:outline-none focus:ring-4 focus:ring-[#4a0e17]/[0.07]"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6e5a5d]">
                KATA SANDI
              </span>
              <div className="relative">
                <input
                  type={showPassword() ? "text" : "password"}
                  required
                  placeholder="Masukkan kata sandi"
                  value={password()}
                  onInput={(e) => setPassword(e.currentTarget.value)}
                  className="h-11 w-full rounded-xl border border-[#e3d3d5] bg-white pl-3.5 pr-11 text-sm text-[#302929] placeholder:text-[#a89a98] transition focus:border-[#4a0e17] focus:outline-none focus:ring-4 focus:ring-[#4a0e17]/[0.07]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword() ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  title={showPassword() ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#8c7377] transition-all duration-150 hover:bg-[#f8eff0] hover:text-[#4a0e17] active:scale-95"
                >
                  <Show
                    when={showPassword()}
                    fallback={
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" className="h-5 w-5">
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    }
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" className="h-5 w-5">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" x2="22" y1="2" y2="22" />
                    </svg>
                  </Show>
                </button>
              </div>
            </label>
          </div>

          <div className="mt-7">
            <CustomButton
              type="submit"
              disabled={loading()}
              class="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#4a0e17] text-sm font-semibold text-white shadow-sm transition hover:bg-[#5d121d] disabled:opacity-60"
            >
              <Show when={loading()}>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
                </svg>
              </Show>
              {loading() ? "Memproses..." : "Masuk"}
            </CustomButton>
          </div>
        </form>
      </main>
    </div>
  );
}
