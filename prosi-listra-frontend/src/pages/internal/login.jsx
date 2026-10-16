import { useNavigate } from "@solidjs/router";
import CustomButton from "../../components/CustomButton";

export default function LoginInternal() {
  const navigate = useNavigate();

  const masuk = (e) => {
    e.preventDefault(); // stop the browser from reloading the page
    // TODO: check email + password. For now it just opens the panel.
    navigate("/internal/kalender");
  };

  return (
    // py-16 = space above and below, flex justify-center = card in the middle
    <div className="flex justify-center px-4 py-16">
      {/* w-full max-w-[420px] = full width on phones, at most 420px on bigger screens */}
      <form
        onSubmit={masuk}
        className="flex w-full max-w-[420px] flex-col gap-4 rounded-lg border border-[#f0dedf] bg-white p-6 shadow-sm"
      >
        <div>
          <h1 className="font-serif text-2xl text-[#39000a]">Masuk Panel Internal</h1>
          <p className="mt-1 text-sm text-gray-500">Untuk akun LISTRA dan para anggota.</p>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Email
          <input type="email" required className="rounded border border-gray-300 px-3 py-2" />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Kata sandi
          <input type="password" required className="rounded border border-gray-300 px-3 py-2" />
        </label>

        <CustomButton type="submit" class="bg-[#39000a] text-white hover:bg-[#5a0c1a]">
          Masuk
        </CustomButton>
      </form>
    </div>
  );
}
