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
