// Sesi login panel internal (disimpan halaman login di localStorage: listra_token & listra_user).

/** true bila token ada dan belum lewat waktu exp-nya (token berlaku 24 jam, dibuat backend). */
export function tokenMasihBerlaku(token, sekarang = Date.now()) {
  if (!token) return false;
  try {
    const isi = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof isi.exp === "number" && isi.exp * 1000 > sekarang;
  } catch {
    return false;
  }
}

/** Cek sesi di browser; sesi lama yang kedaluwarsa dibersihkan. */
export function sudahLogin() {
  try {
    if (tokenMasihBerlaku(localStorage.getItem("listra_token"))) return true;
    localStorage.removeItem("listra_token");
    localStorage.removeItem("listra_user");
  } catch {
    // localStorage tidak tersedia: anggap belum login
  }
  return false;
}

/** Pesan di halaman login saat pengguna belum login / sesinya habis. */
export const PESAN_BELUM_LOGIN = "You haven't Login, please login to access /internal";
/** Alamat login dengan penanda alasan, supaya halaman login menampilkan PESAN_BELUM_LOGIN. */
export const LOGIN_BELUM_LOGIN = "/internal/login?alasan=belum-login";

function keluarkan(jendela) {
  try {
    localStorage.removeItem("listra_token");
    localStorage.removeItem("listra_user");
  } catch {
    // abaikan
  }
  jendela.location.assign(LOGIN_BELUM_LOGIN);
}

/**
 * Dipanggil sekali saat aplikasi dimulai: bila di halaman /internal ada balasan 401 dari /api
 * (token palsu / kedaluwarsa), sesi dibersihkan dan pengguna dibawa ke halaman login.
 * Satu tempat untuk semua pemanggilan API, jadi tiap halaman tidak perlu menangani 401 sendiri.
 */
export function pantauSesi(jendela = window) {
  const fetchAsli = jendela.fetch.bind(jendela);
  jendela.fetch = async (input, init) => {
    const res = await fetchAsli(input, init);
    const url = typeof input === "string" ? input : input?.url ?? "";
    const diInternal = jendela.location.pathname.startsWith("/internal") && jendela.location.pathname !== "/internal/login";
    if (res.status === 401 && url.includes("/api/") && !url.includes("/api/auth/login") && diInternal) keluarkan(jendela);
    return res;
  };
}

/** Header Authorization dari sesi login (kosong bila belum login). Dipakai setiap panggilan API internal. */
export function headerLogin() {
  try {
    const token = localStorage.getItem("listra_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}
