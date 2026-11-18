// Panggilan backend untuk Kalender Event (internal) dan Jadwal Acara (publik).
// Field mengikuti tabel acara, acara_pj, acara_jasa, acara_performer.

async function request(url, options = {}) {
  // token login ikut dikirim bila ada; /api/acara wajib login, /api/jadwal publik
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
  if (!res.ok) throw new Error(body?.message ?? "Terjadi kesalahan. Coba lagi.");
  return body;
}

function kirimJson(method, data) {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) };
}

/** ?dari=YYYY-MM-DD&sampai=YYYY-MM-DD; event yang punya minimal satu hari di dalam rentang. */
function qsRentang({ dari, sampai } = {}) {
  const params = new URLSearchParams();
  if (dari) params.set("dari", dari);
  if (sampai) params.set("sampai", sampai);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Internal (wajib login): event lengkap dengan PJ, jasa per hari, dan performer. */
export function listAcara(rentang, { signal } = {}) {
  return request(`/api/acara${qsRentang(rentang)}`, { signal });
}

export function getAcara(id) {
  return request(`/api/acara/${id}`);
}

export function createAcara(data) {
  return request("/api/acara", kirimJson("POST", data));
}

export function updateAcara(id, data) {
  return request(`/api/acara/${id}`, kirimJson("PUT", data));
}

export function deleteAcara(id) {
  return request(`/api/acara/${id}`, { method: "DELETE" });
}

/** Publik: tanpa Nama Client, PJ, dan performer; acara privat tampil sebagai "Acara privat". */
export function listJadwal(rentang, { signal } = {}) {
  return request(`/api/jadwal${qsRentang(rentang)}`, { signal });
}
