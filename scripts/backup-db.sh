#!/usr/bin/env bash
# Respaldo manual de la base de datos de Kalendaria (Supabase).
#
# Uso:   npm run db:backup
# Requiere: pg_dump (paquete postgresql-client) y la variable SUPABASE_DB_URL, que se lee
# del entorno o del archivo .env.backup.local (ignorado por git). Obtén la cadena en
# Supabase > Connect > "Session pooler" (compatible con IPv4).
#
# CONTRASEÑA: si contiene espacios, paréntesis u otros símbolos, NO la pongas dentro de la URL
# (habría que codificarla). Déjala fuera y pásala en PGPASSWORD, entre comillas simples:
#   SUPABASE_DB_URL=postgresql://postgres.<ref>@aws-0-<region>.pooler.supabase.com:5432/postgres
#   PGPASSWORD='tu contraseña (con espacios) 123'
# pg_dump lee PGPASSWORD tal cual, sin codificar nada.
#
# Genera en backups/ (ignorada por git):
#   kalendaria-public-FECHA.sql  esquema y datos de la app (profiles, activities, funciones, RLS)
#   kalendaria-auth-FECHA.sql    SOLO datos de auth.users y auth.identities (cuentas y hashes de
#                                contraseña). Es información sensible: no la compartas ni la subas.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -z "${SUPABASE_DB_URL:-}" ] && [ -f .env.backup.local ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env.backup.local
  set +a
fi

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "Falta SUPABASE_DB_URL. Defínela en tu terminal o en .env.backup.local (ver cabecera del script)." >&2
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "No se encontró pg_dump. Instala postgresql-client (p. ej.: sudo apt install postgresql-client)." >&2
  exit 1
fi

umask 077
mkdir -p backups
stamp="$(date +%F-%H%M)"
public_file="backups/kalendaria-public-${stamp}.sql"
auth_file="backups/kalendaria-auth-${stamp}.sql"

echo "Respaldando esquema y datos de public → ${public_file}"
pg_dump "$SUPABASE_DB_URL" --schema=public --no-owner --no-privileges --file "$public_file"

echo "Respaldando datos de auth (sensibles) → ${auth_file}"
pg_dump "$SUPABASE_DB_URL" --data-only --no-owner --no-privileges \
  --table=auth.users --table=auth.identities --file "$auth_file"

echo
echo "Listo:"
ls -lh "$public_file" "$auth_file"
echo "Guarda una copia fuera de este equipo. Los archivos de auth contienen hashes de contraseña."
