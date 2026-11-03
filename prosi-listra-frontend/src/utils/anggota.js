export function extractUnparEmail(email) {
  if (!email || typeof email !== "string") return null;
  const trimmed = email.trim();
  const match = trimmed.match(/^(\d+)@student\.unpar\.ac\.id$/i);
  if (!match) return null;

  const npm = match[1];
  // NPM Unpar standar: 10 digit, contoh: 6182301002
  // Digit 1-3 kode prodi (misal 618), digit 4-5 angkatan (misal 23)
  let angkatan = null;
  if (npm.length >= 5) {
    const rawAngkatan = npm.substring(3, 5);
    const parsed = parseInt(rawAngkatan, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      angkatan = parsed;
    }
  }

  return { npm, angkatan };
}
