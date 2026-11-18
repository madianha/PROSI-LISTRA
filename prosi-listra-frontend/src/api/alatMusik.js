// Panggilan backend untuk alat musik (tabel alat_musik: id_alat_musik, nama_alat_musik, jumlah).
// URL relatif: saat development, vite.config.js meneruskan /api ke backend (port 3001).

async function request(url, options = {}) {
  // token login ikut dikirim bila ada; tambah/ubah/hapus wajib login
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

export function listAlatMusik() {
  return request("/api/alat-musik");
}

export function createAlatMusik(data) {
  return request("/api/alat-musik", kirimJson("POST", data));
}

export function updateAlatMusik(id, data) {
  return request(`/api/alat-musik/${id}`, kirimJson("PUT", data));
}

export function deleteAlatMusik(id) {
  return request(`/api/alat-musik/${id}`, { method: "DELETE" });
}
