// Semua panggilan ke backend untuk fitur testimoni.
// URL relatif: saat development, vite.config.js meneruskan /api ke backend (port 3001).

async function request(url, options = {}) {
  // token login ikut dikirim bila ada; route internal butuh ini, route publik mengabaikannya
  const token = localStorage.getItem("listra_token");
  const headers = { ...(options.headers ?? {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  let res;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    throw new Error("Tidak bisa terhubung ke server. Coba lagi nanti.");
  }
  if (res.status === 204) return null;

  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.message ?? "Terjadi kesalahan. Coba lagi.");
  return body;
}

function kirimJson(method, data) {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) };
}

/** Testimoni yang tampil di website (disetujui + aktif), terbaru dulu. */
export function listTestimoni() {
  return request("/api/testimoni");
}

/** Semua testimoni untuk halaman internal (wajib login). */
export function listSemuaTestimoni() {
  return request("/api/testimoni/semua");
}

/**
 * Kirim testimoni baru. Selalu masuk antrean "menunggu" (belum tampil) sampai diterima pengurus,
 * baik dari pengunjung maupun dari pengurus yang login.
 */
export function kirimTestimoni(data) {
  return request("/api/testimoni", kirimJson("POST", data));
}

/** Ubah testimoni yang ditolak (wajib login); setelah disimpan kembali menjadi "menunggu". */
export function ubahTestimoni(id, data) {
  return request(`/api/testimoni/${id}`, kirimJson("PUT", data));
}

export function setStatusTestimoni(id, status) {
  return request(`/api/testimoni/${id}/status`, kirimJson("PATCH", { status }));
}

export function setAktifTestimoni(id, is_aktif) {
  return request(`/api/testimoni/${id}/aktif`, kirimJson("PATCH", { is_aktif }));
}

export function hapusTestimoni(id) {
  return request(`/api/testimoni/${id}`, { method: "DELETE" });
}
