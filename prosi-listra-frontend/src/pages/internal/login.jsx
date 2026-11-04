import { createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import CustomButton from "../../components/CustomButton";
import { loginApi } from "../../api/auth";

export default function LoginInternal() {
  const navigate = useNavigate();
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
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
    <div className="flex justify-center px-4 py-16">
      <form
        onSubmit={masuk}
        className="flex w-full max-w-[420px] flex-col gap-4 rounded-2xl border border-[#f0dedf] bg-white p-7 shadow-lg"
      >
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#39000a]">Masuk Panel Internal</h1>
          <p className="mt-1 text-sm text-stone-500">Untuk akun LISTRA dan para anggota pengurus.</p>
        </div>

        {errorMessage() && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
            {errorMessage()}
          </div>
        )}

        <label className="flex flex-col gap-1.5 text-xs font-semibold text-stone-700">
          Email
          <input
            type="email"
            required
            placeholder="nama@student.unpar.ac.id"
            value={email()}
            onInput={(e) => setEmail(e.currentTarget.value)}
            disabled={isLoading()}
            className="rounded-lg border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:border-[#39000a] focus:outline-none focus:ring-1 focus:ring-[#39000a] disabled:bg-stone-100"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-semibold text-stone-700">
          Kata sandi
          <input
            type="password"
            required
            placeholder="••••••••"
            value={password()}
            onInput={(e) => setPassword(e.currentTarget.value)}
            disabled={isLoading()}
            className="rounded-lg border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:border-[#39000a] focus:outline-none focus:ring-1 focus:ring-[#39000a] disabled:bg-stone-100"
          />
        </label>

        <CustomButton
          type="submit"
          disabled={isLoading()}
          class="mt-2 bg-[#39000a] text-white hover:bg-[#5a0c1a] disabled:opacity-60"
        >
          {isLoading() ? "Memproses..." : "Masuk"}
        </CustomButton>
      </form>
    </div>
  );
}