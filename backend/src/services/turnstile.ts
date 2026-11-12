// Cek token Cloudflare Turnstile ("Apakah Anda manusia?") ke server Cloudflare.
// https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

const URL_VERIFIKASI = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Kunci uji resmi Cloudflare: selalu lolos. Hanya untuk development, jangan dipakai di production.
const SECRET_UJI = "1x0000000000000000000000000000000AA";

function secretKey(): string {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("TURNSTILE_SECRET_KEY belum diisi di .env");
  }
  return SECRET_UJI;
}

/** true bila token sah (pengirim lolos pemeriksaan bot). */
export async function verifikasiTurnstile(token: unknown, ip?: string): Promise<boolean> {
  if (typeof token !== "string" || token === "") return false;

  const body = new URLSearchParams({ secret: secretKey(), response: token });
  if (ip) body.append("remoteip", ip);

  try {
    const res = await fetch(URL_VERIFIKASI, { method: "POST", body });
    const hasil = (await res.json()) as { success?: boolean };
    return hasil.success === true;
  } catch (error) {
    // Cloudflare tidak bisa dihubungi: anggap gagal, pengunjung bisa mencoba lagi
    console.error("Verifikasi Turnstile gagal:", error);
    return false;
  }
}
