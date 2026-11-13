export async function listTestimoni() {
  let response;
  try {
    response = await fetch("/api/testimoni");
  } catch {
    throw new Error("Tidak bisa terhubung ke server. Coba lagi nanti.");
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.message ?? "Gagal memuat data testimoni.");
  }
  return body;
}

export async function submitTestimoni(data) {
  let response;
  try {
    response = await fetch("/api/testimoni", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error("Tidak bisa terhubung ke server. Coba lagi nanti.");
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message ?? "Testimoni gagal dikirim.");
  return body;
}
