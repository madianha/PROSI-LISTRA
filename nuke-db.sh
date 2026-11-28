#!/usr/bin/env bash
# Hapus database listra_db lalu buat ulang dari listra-web/db/*.sql.
# Cara pakai dan penjelasan lengkap: NUKE.md
#
#   ./nuke-db.sh              tanya dulu, lalu nuke + isi data contoh (dummy.sql)
#   ./nuke-db.sh --no-dummy   tanpa data contoh (hanya data dasar insert.sql)
#   ./nuke-db.sh -y           tanpa pertanyaan konfirmasi
set -euo pipefail

DB="${NUKE_DB_NAME:-listra_db}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_DIR="$ROOT/listra-web/db"
ENV_FILE="$ROOT/backend/.env"

PAKAI_DUMMY=1
TANPA_TANYA=0
for arg in "$@"; do
  case "$arg" in
    --no-dummy) PAKAI_DUMMY=0 ;;
    -y | --yes) TANPA_TANYA=1 ;;
    -h | --help) sed -n 2,7p "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Opsi tidak dikenal: $arg (lihat --help)" >&2; exit 1 ;;
  esac
done

# Koneksi diambil dari backend/.env (PGHOST, PGPORT, PGUSER, PGPASSWORD) bila belum di-set.
# File dibaca baris per baris, tidak di-source, jadi isi .env tidak dijalankan sebagai perintah.
if [[ -f "$ENV_FILE" ]]; then
  while IFS='=' read -r key value; do
    case "$key" in
      PGHOST | PGPORT | PGUSER | PGPASSWORD)
        value="${value%$'\r'}"          # .env yang disimpan di Windows (CRLF)
        value="${value%\"}"; value="${value#\"}"
        [[ -z "${!key:-}" ]] && export "$key=$value"
        ;;
    esac
  done < "$ENV_FILE"
fi
export PGHOST="${PGHOST:-localhost}" PGPORT="${PGPORT:-5432}" PGUSER="${PGUSER:-postgres}"

for cmd in psql dropdb createdb; do
  command -v "$cmd" > /dev/null || { echo "Perintah '$cmd' tidak ditemukan. Install PostgreSQL client dulu." >&2; exit 1; }
done

FILES=(master.sql junction.sql insert.sql)
[[ $PAKAI_DUMMY -eq 1 ]] && FILES+=(dummy.sql)
for f in "${FILES[@]}"; do
  [[ -f "$SQL_DIR/$f" ]] || { echo "File tidak ada: $SQL_DIR/$f" >&2; exit 1; }
done

echo "Database '$DB' di $PGUSER@$PGHOST:$PGPORT akan DIHAPUS beserta semua isinya,"
echo "lalu dibuat ulang dari: ${FILES[*]}"
if [[ $TANPA_TANYA -eq 0 ]]; then
  read -r -p "Ketik nama database ($DB) untuk lanjut: " jawab
  [[ "$jawab" == "$DB" ]] || { echo "Dibatalkan."; exit 1; }
fi

# --force = putuskan koneksi yang masih terbuka (misalnya backend yang sedang jalan)
dropdb --if-exists --force "$DB"
createdb "$DB"

for f in "${FILES[@]}"; do
  echo "-> $f"
  # ON_ERROR_STOP = berhenti di error pertama, jangan lanjut dengan database setengah jadi
  psql -q -X -v ON_ERROR_STOP=1 -d "$DB" -f "$SQL_DIR/$f" > /dev/null
done

echo "Selesai. Database '$DB' sudah bersih dan terisi ulang."
