# ============================================================
# SCRIPT DE MIGRACIÓN: Render PostgreSQL → Neon
# Zona Elite DB Migration Script
# ============================================================

$PG_BIN = "C:\Program Files\PostgreSQL\18\bin"
$BACKUP_FILE = "$PSScriptRoot\zona_elite_neon_export.sql"

# ── ORIGEN (Render) ──────────────────────────────────────────
$SRC_HOST = "dpg-d8h4mva8pkls73bvm980-a.oregon-postgres.render.com"
$SRC_PORT = "5432"
$SRC_DB   = "zona_elite_db"
$SRC_USER = "zona_elite_db_user"
$SRC_PASS = "vPfshbil5t5ohFbQqPhptMeUFhPu83p9"

# ── DESTINO (Neon) ───────────────────────────────────────────
$DST_HOST = "ep-steep-snow-atiy8vue-pooler.c-9.us-east-1.aws.neon.tech"
$DST_PORT = "5432"
$DST_DB   = "neondb"
$DST_USER = "neondb_owner"
$DST_PASS = "npg_KAo4Uz7RlxdM"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   MIGRACION: Render PostgreSQL -> Neon (Zona Elite)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ── PASO 1: EXPORTAR DESDE RENDER ───────────────────────────
Write-Host "[PASO 1] Exportando base de datos desde Render..." -ForegroundColor Yellow
Write-Host "   Origen: $SRC_HOST/$SRC_DB" -ForegroundColor Gray

$env:PGPASSWORD = $SRC_PASS

$dumpArgs = @(
    "--host=$SRC_HOST",
    "--port=$SRC_PORT",
    "--username=$SRC_USER",
    "--dbname=$SRC_DB",
    "--no-owner",
    "--no-privileges",
    "--no-acl",
    "--format=plain",
    "--encoding=UTF8",
    "--file=$BACKUP_FILE"
)

& "$PG_BIN\pg_dump.exe" @dumpArgs

if ($LASTEXITCODE -ne 0) {
    Write-Host "Reintentando con SSL..." -ForegroundColor Yellow
    $env:PGSSLMODE = "require"
    & "$PG_BIN\pg_dump.exe" @dumpArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Fallo la exportacion. Revisa credenciales y conectividad." -ForegroundColor Red
        exit 1
    }
}

$fileSize = (Get-Item $BACKUP_FILE).Length / 1KB
Write-Host "OK: Exportacion completada. Archivo: $BACKUP_FILE ($([math]::Round($fileSize, 1)) KB)" -ForegroundColor Green

# ── PASO 2: LIMPIAR REFERENCIAS AL ROL ORIGEN ───────────────
Write-Host ""
Write-Host "[PASO 2] Limpiando referencias al rol origen..." -ForegroundColor Yellow

$content = Get-Content $BACKUP_FILE -Raw -Encoding UTF8

# Eliminar ALTER OWNER y GRANT/REVOKE
$content = $content -replace "(?m)^ALTER\s+(TABLE|SEQUENCE|VIEW|FUNCTION|PROCEDURE)\s+.*\s+OWNER\s+TO\s+\S+;\s*`r?`n", ""
$content = $content -replace "(?m)^(GRANT|REVOKE)\s+.*;\s*`r?`n", ""
$content = $content -replace "zona_elite_db_user", "neondb_owner"

$content | Set-Content $BACKUP_FILE -Encoding UTF8
Write-Host "OK: Limpieza completada." -ForegroundColor Green

# ── PASO 3: LIMPIAR BASE DESTINO Y RESTAURAR ─────────────────
Write-Host ""
Write-Host "[PASO 3] Importando en Neon..." -ForegroundColor Yellow
Write-Host "   Destino: $DST_HOST/$DST_DB" -ForegroundColor Gray

$env:PGPASSWORD = $DST_PASS
$env:PGSSLMODE  = "require"

# Eliminar tablas existentes para evitar conflictos de constraints
$dropScript = @"
DO `$`$ DECLARE r RECORD; BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
  END LOOP;
END `$`$;
"@

Write-Host "   Eliminando tablas existentes en Neon..." -ForegroundColor Gray
$dropScript | & "$PG_BIN\psql.exe" `
    --host=$DST_HOST --port=$DST_PORT `
    --username=$DST_USER --dbname=$DST_DB --no-password

# Restaurar
$restoreLog = "$PSScriptRoot\restore_log.txt"
Write-Host "   Restaurando datos..." -ForegroundColor Gray

& "$PG_BIN\psql.exe" `
    --host=$DST_HOST --port=$DST_PORT `
    --username=$DST_USER --dbname=$DST_DB `
    --no-password --echo-errors `
    --file=$BACKUP_FILE `
    2>&1 | Tee-Object -FilePath $restoreLog

Write-Host ""
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: Importacion completada." -ForegroundColor Green
} else {
    Write-Host "AVISO: Importacion con errores menores. Ver: $restoreLog" -ForegroundColor Yellow
}

# ── PASO 4: VERIFICACION ─────────────────────────────────────
Write-Host ""
Write-Host "[PASO 4] Verificando datos en Neon..." -ForegroundColor Yellow

$verifyScript = @"
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_name = t.table_name AND table_schema = 'public') AS columnas
FROM information_schema.tables t
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

SELECT 'users' AS tabla, COUNT(*) AS total FROM public.users
UNION ALL SELECT 'slots', COUNT(*) FROM public.slots
UNION ALL SELECT 'bookings', COUNT(*) FROM public.bookings;

SELECT id, name, email, role, available_classes, created_at
FROM public.users ORDER BY created_at LIMIT 5;
"@

$verifyScript | & "$PG_BIN\psql.exe" `
    --host=$DST_HOST --port=$DST_PORT `
    --username=$DST_USER --dbname=$DST_DB `
    --no-password --pset=format=aligned

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   MIGRACION COMPLETA" -ForegroundColor Green
Write-Host "   Backup: $BACKUP_FILE" -ForegroundColor Gray
Write-Host "   Log:    $restoreLog" -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan
