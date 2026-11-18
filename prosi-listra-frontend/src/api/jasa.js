// token login ikut dikirim bila ada: route tulis butuh ini, dan pengguna login boleh melihat jasa nonaktif
async function request(url, options = {}) {
  const token = localStorage.getItem("listra_token");
  const headers = { ...(options.headers ?? {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  let res;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    throw new Error("Tidak bisa terhubung ke server. Coba lagi nanti.");
  }
  if (res.status === 204) return null;

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.message ?? "Terjadi kesalahan. Coba lagi.");
  }
  return body;
}

function kirimJson(method, data) {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) };
}

/** Publik: hanya jasa aktif. includeInactive: true untuk halaman internal (butuh login). */
export function listJasa({ includeInactive = false, signal } = {}) {
  const qs = includeInactive ? "?include_inactive=true" : "";
  return request(`/api/jasa${qs}`, { signal });
}

export function getJasa(id) {
  return request(`/api/jasa/${id}`);
}

export async function getProvinsiList() {
  const res = await request("/api/provinsi");
  return Array.isArray(res) ? res : (res?.data || []);
}

export function createJasa(data) {
  return request("/api/jasa", kirimJson("POST", data));
}

export function updateJasa(id, data) {
  return request(`/api/jasa/${id}`, kirimJson("PUT", data));
}

export function toggleStatusJasa(id, is_aktif) {
  return request(`/api/jasa/${id}/status`, kirimJson("PATCH", { is_aktif }));
}

export async function uploadSampulJasa(file) {
  const form = new FormData();
  form.append("file", file);
  const { location } = await request("/api/upload", { method: "POST", body: form });
  return location;
}
