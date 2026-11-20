import { headerLogin } from "../utils/sesiLogin";

// data anggota hanya untuk panel internal: semua permintaan membawa token login
async function request(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { ...(options.headers ?? {}), ...headerLogin() } });
  if (res.status === 204) return null;

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.message ?? "Terjadi kesalahan. Coba lagi.");
  }
  return body;
}

function kirimJson(method, data) {
  // token login ikut dikirim; backend memakainya untuk cek siapa yang boleh mengatur kata sandi
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

/** true bila pengguna yang login berperan Admin atau LISTRA (boleh mengatur kata sandi anggota). */
export function bolehAturPassword() {
  try {
    const user = JSON.parse(localStorage.getItem("listra_user") ?? "null");
    return ["admin", "listra"].includes(user?.peran);
  } catch {
    return false;
  }
}

export function listAnggota({ search = "", peran = "", angkatan = "", signal } = {}) {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (peran && peran !== "Semua") params.append("peran", peran);
  if (angkatan && angkatan !== "Semua") params.append("angkatan", angkatan);

  const qs = params.toString();
  return request(`/api/anggota${qs ? `?${qs}` : ""}`, { signal });
}

export function getAnggotaDetail(id) {
  return request(`/api/anggota/${id}`);
}

export async function getSpesialisasiList() {
  const res = await request("/api/anggota/spesialisasi");
  return Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
}

export function createAnggota(data) {
  return request("/api/anggota", kirimJson("POST", data));
}

export function updateAnggota(id, data) {
  return request(`/api/anggota/${id}`, kirimJson("PUT", data));
}

export function toggleStatusAktif(id, is_aktif) {
  return request(`/api/anggota/${id}/status`, kirimJson("PATCH", { is_aktif }));
}

/**
 * Tambah Massal: { anggota: [...] } dalam satu kali simpan (semua atau tidak sama sekali).
 * Gagal validasi: Error dengan .kesalahan = [{ baris, kolom, pesan }] (baris mulai 1, urutan array yang dikirim).
 */
export async function createAnggotaBulk(anggota) {
  let res;
  try {
    res = await fetch("/api/anggota/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headerLogin() },
      body: JSON.stringify({ anggota }),
    });
  } catch {
    throw new Error("Tidak bisa terhubung ke server. Coba lagi nanti.");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(body?.message ?? "Gagal menyimpan anggota.");
    error.kesalahan = body?.kesalahan ?? [];
    throw error;
  }
  return body;
}
