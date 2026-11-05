import { createSignal } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import Icon from "../../components/Icon";
import { loginApi } from "../../api/auth";
import logoListra from "../../img/logo-listra.png";
import logoUnpar from "../../img/Logo-UNPAR.png";

export default function LoginInternal() {
  const navigate = useNavigate();
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [showPassword, setShowPassword] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(false);
  const [errorMessage, setErrorMessage] = createSignal("");

  const masuk = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      await loginApi(email().trim(), password());
      navigate("/internal/kalender", { replace: true });
    } catch (err) {
      setErrorMessage(err.message || "Gagal masuk. Periksa kembali email dan kata sandi Anda.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5efeb]">
      {/* Minimal Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200/70 px-8 py-3.5 flex items-center justify-between">
        <A href="/" className="flex items-center gap-2.5">
          <img src={logoListra} alt="Logo LISTRA" className="h-9 w-auto" />
          <img src={logoUnpar} alt="Logo UNPAR" className="h-9 w-auto" />
          <span className="font-serif text-xl font-bold tracking-tight text-[#4a0e17]">
            LISTRA
          </span>
        </A>
      </header>

      {/* Centering wrapper */}
      <main className="min-h-[calc(100vh-65px)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl shadow-stone-200/60 border border-stone-200/80 p-8 md:p-9 space-y-6">
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#4a0e17] tracking-tight">
              Masuk Panel Internal
            </h1>
            <p className="text-xs text-stone-500 font-normal mt-1.5 leading-relaxed">
              Untuk akun LISTRA dan para anggota pengurus.
            </p>
          </div>

          {errorMessage() && (
            <div className="rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-xs font-medium text-red-700">
              {errorMessage()}
            </div>
          )}

          <form onSubmit={masuk} className="space-y-4">
            <div>
              <label
                for="email"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="nama@student.unpar.ac.id"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
                disabled={isLoading()}
                className="w-full rounded-xl border border-stone-300 bg-stone-50/50 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-[#4a0e17] focus:ring-2 focus:ring-[#4a0e17]/15 focus:outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label
                for="password"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5"
              >
                Kata Sandi
              </label>
              <div className="relative flex items-center">
                <input
                  id="password"
                  type={showPassword() ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password()}
                  onInput={(e) => setPassword(e.currentTarget.value)}
                  disabled={isLoading()}
                  className="w-full rounded-xl border border-stone-300 bg-stone-50/50 px-4 pr-10 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-[#4a0e17] focus:ring-2 focus:ring-[#4a0e17]/15 focus:outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isLoading()}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon icon={showPassword() ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading()}
              className="w-full bg-[#4a0e17] hover:bg-[#380b12] text-white text-sm font-semibold py-2.5 px-4 rounded-xl shadow-xs hover:shadow-md transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading() ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}