// Semua panggilan ke backend untuk fitur berita.
// URL relatif: saat development, vite.config.js meneruskan /api ke backend (port 3001).

async function request(url, options) {
  const res = await fetch(url, options);
  if (res.status === 204) return null;

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.message ?? "Terjadi kesalahan. Coba lagi.");
  }
  return body;
}

function kirimJson(method, data) {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}

// semua: true = ikut draf (dipakai halaman internal). Halaman publik tidak mengirimnya.
const query = (semua) => (semua ? "?semua=1" : "");

export const listBerita = ({ semua = false } = {}) => request(`/api/berita${query(semua)}`);

export const getBerita = (id, { semua = false } = {}) => request(`/api/berita/${id}${query(semua)}`);

/** data = kolom isi berita + is_publik */
export const createBerita = (data) => request("/api/berita", kirimJson("POST", data));

/** Mengubah isi saja; status publik diubah lewat setPublik. */
export const updateBerita = (id, data) => request(`/api/berita/${id}`, kirimJson("PUT", data));

export const setPublik = (id, isPublik) =>
  request(`/api/berita/${id}/publik`, kirimJson("PATCH", { is_publik: isPublik }));

export const deleteBerita = (id) => request(`/api/berita/${id}`, { method: "DELETE" });

/** Unggah gambar, kembalikan alamatnya (mis. /uploads/a81f3c.jpg). */
export async function uploadGambar(file) {
  const form = new FormData();
  form.append("file", file);
  const { location } = await request("/api/upload", { method: "POST", body: form });
  return location;
}
