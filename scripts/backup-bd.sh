#!/usr/bin/env bash
# Backup de la BD de Supabase antes de la migración multifestival.
# Uso: DB_URL='postgresql://...' bash scripts/backup-bd.sh
#
# Cómo obtener la DB_URL:
#   Supabase Dashboard → Connect (botón arriba) → Connection string → URI
#   Recomendado: pestaña "Session pooler" (funciona con IPv4)
#   Reemplaza [YOUR-PASSWORD] por tu contraseña real.
set -euo pipefail

if [ -z "${DB_URL:-}" ]; then
    echo "Falta DB_URL."
    echo "Uso: DB_URL='postgresql://postgres.xxx:PASSWORD@host:5432/postgres' bash scripts/backup-bd.sh"
    exit 1
fi

TIMESTAMP=$(date +%Y%m%d_%H%M)
OUT="datos_backup_premultifestival_${TIMESTAMP}.sql"

echo "Ejecutando pg_dump..."
if pg_dump "$DB_URL" --no-owner --no-acl -f "$OUT"; then
    echo ""
    echo "Backup OK → $OUT"
    ls -lh "$OUT"
else
    echo "Backup falló. Revisa la connection string."
    exit 1
fi
