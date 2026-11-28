const URL_VERIFIKASI = "https://www.google.com/recaptcha/api/siteverify";

/** true bila token Google reCAPTCHA v2 sah. */
export async function verifikasiRecaptcha(token: unknown, ip?: string): Promise<boolean> {
  if (typeof token !== "string" || token === "") return false;

  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) throw new Error("RECAPTCHA_SECRET_KEY belum diisi di .env");

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.append("remoteip", ip);

  try {
    const response = await fetch(URL_VERIFIKASI, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const result = (await response.json()) as { success?: boolean };
    return response.ok && result.success === true;
  } catch (error) {
    console.error("Verifikasi reCAPTCHA gagal:", error);
    return false;
  }
}
