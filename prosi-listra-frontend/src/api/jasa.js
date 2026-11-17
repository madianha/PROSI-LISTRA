async function request(url, options) {
  let res;
  try {
    res = await fetch(url, options);
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
  const token = localStorage.getItem("listra_token");
  return {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  };
}

export function listJasa({ includeInactive = true, signal } = {}) {
  const qs = includeInactive ? "?include_inactive=true" : "";
  return request(`/api/jasa${qs}`, { signal });
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
