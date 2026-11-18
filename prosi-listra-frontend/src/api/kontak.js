// Kontak WhatsApp Humas (tabel kontak_whatsapp: nomor_wa, nama_humas, template_pesan).
// Dipakai tombol "Hubungi Kami" di Beranda, Footer, dan "Pesan via WhatsApp" di Detail Jasa.

const TEMPLATE_BAWAAN = "Halo Humas LISTRA, saya tertarik dengan {jasa}. Boleh minta informasi lebih lanjut?";

export async function getKontak() {
  let res;
  try {
    res = await fetch("/api/kontak");
  } catch {
    throw new Error("Tidak bisa terhubung ke server. Coba lagi nanti.");
  }
  if (!res.ok) throw new Error("Kontak WhatsApp belum tersedia.");
  return res.json();
}

/**
 * Link wa.me ke Humas dengan pesan dari template_pesan.
 * jasa = isi untuk {jasa} di template; tombol umum (tanpa jasa tertentu) memakai "jasa LISTRA".
 * null bila nomor WhatsApp belum diisi.
 */
export function linkWhatsApp(kontak, jasa = "jasa LISTRA") {
  const nomor = String(kontak?.nomor_wa ?? "").replace(/\D/g, "");
  if (!nomor) return null;
  const template = kontak.template_pesan || TEMPLATE_BAWAAN;
  return `https://wa.me/${nomor}?text=${encodeURIComponent(template.replace("{jasa}", jasa))}`;
}
