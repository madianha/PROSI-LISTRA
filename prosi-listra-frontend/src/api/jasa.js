export async function listJasa() {
  let response;
  try {
    response = await fetch("/api/jasa");
  } catch {
    throw new Error("Tidak bisa terhubung ke server. Coba lagi nanti.");
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.message ?? "Gagal memuat data jasa.");
  }
  return body;
}
