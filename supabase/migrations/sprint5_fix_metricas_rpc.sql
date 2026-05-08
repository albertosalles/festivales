-- ============================================================================
-- sprint5_fix_metricas_rpc.sql
--
-- Bug fix crítico: las funciones de métricas del dashboard traían filas crudas
-- desde Supabase y agregaban en JS. Con el límite por defecto de 1000 filas
-- y >6000 transacciones por festival, los resultados eran incorrectos: la
-- primera barra recibía todas las filas y las demás aparecían con 0€.
--
-- Solución: mover la agregación a PostgreSQL mediante funciones RPC. Además
-- de corregir el bug, mejora el rendimiento (no se transfieren miles de filas
-- al servidor de aplicación).
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1) Métricas globales del festival
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.obtener_metricas_globales(p_id_festival INTEGER)
RETURNS TABLE (
    total_transacciones BIGINT,
    ingresos_totales NUMERIC,
    ticket_medio NUMERIC
) AS $$
    SELECT
        COUNT(*)::BIGINT AS total_transacciones,
        COALESCE(SUM(t.monto), 0)::NUMERIC AS ingresos_totales,
        COALESCE(AVG(t.monto), 0)::NUMERIC AS ticket_medio
    FROM public.transacciones t
    JOIN public.barras b ON t.id_barra = b.id_barra
    WHERE b.id_festival = p_id_festival
      AND t.tipo_movimiento != 'recarga';
$$ LANGUAGE sql STABLE;

-- ────────────────────────────────────────────────────────────────────────────
-- 2) Ingresos por barra (rendimiento)
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.obtener_ingresos_por_barra(p_id_festival INTEGER)
RETURNS TABLE (
    id_barra INTEGER,
    nombre_barra VARCHAR,
    ingresos NUMERIC,
    num_transacciones BIGINT
) AS $$
    SELECT
        b.id_barra,
        b.nombre_localizacion AS nombre_barra,
        COALESCE(SUM(t.monto) FILTER (WHERE t.tipo_movimiento != 'recarga'), 0)::NUMERIC AS ingresos,
        COUNT(t.id_transaccion) FILTER (WHERE t.tipo_movimiento != 'recarga')::BIGINT AS num_transacciones
    FROM public.barras b
    LEFT JOIN public.transacciones t ON t.id_barra = b.id_barra
    WHERE b.id_festival = p_id_festival
    GROUP BY b.id_barra, b.nombre_localizacion
    ORDER BY ingresos DESC;
$$ LANGUAGE sql STABLE;

-- ────────────────────────────────────────────────────────────────────────────
-- 3) Saldo retenido (suma de wallets de los usuarios del festival)
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.obtener_saldo_retenido(p_id_festival INTEGER)
RETURNS NUMERIC AS $$
    SELECT COALESCE(SUM(w.saldo), 0)::NUMERIC
    FROM public.wallet w
    JOIN public.usuario u ON w.id_usuario = u.id_usuario
    WHERE u.id_festival = p_id_festival;
$$ LANGUAGE sql STABLE;

-- ────────────────────────────────────────────────────────────────────────────
-- 4) Recarga media
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.obtener_recarga_media(p_id_festival INTEGER)
RETURNS NUMERIC AS $$
    SELECT COALESCE(AVG(t.monto), 0)::NUMERIC
    FROM public.transacciones t
    JOIN public.barras b ON t.id_barra = b.id_barra
    WHERE b.id_festival = p_id_festival
      AND t.tipo_movimiento = 'recarga';
$$ LANGUAGE sql STABLE;

-- ────────────────────────────────────────────────────────────────────────────
-- 5) Mapa de calor horario (volumen de compras por hora)
--    Ojo: agregamos por hora local Europe/Madrid para coincidir con el modo
--    en que se generan las transacciones.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.obtener_mapa_calor_horario(p_id_festival INTEGER)
RETURNS TABLE (
    hora TEXT,
    total BIGINT
) AS $$
    SELECT
        LPAD(EXTRACT(HOUR FROM (t.fecha AT TIME ZONE 'Europe/Madrid'))::TEXT, 2, '0') || ':00' AS hora,
        COUNT(*)::BIGINT AS total
    FROM public.transacciones t
    JOIN public.barras b ON t.id_barra = b.id_barra
    WHERE b.id_festival = p_id_festival
      AND t.tipo_movimiento != 'recarga'
    GROUP BY hora
    ORDER BY hora;
$$ LANGUAGE sql STABLE;

-- ────────────────────────────────────────────────────────────────────────────
-- 6) Eficiencia de barras (pedidos por hora activa)
--    Una "hora activa" = (año, mes, día, hora) con al menos una transacción.
--    pedidos_por_hora = total_pedidos / num_horas_activas
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.obtener_eficiencia_barras(p_id_festival INTEGER)
RETURNS TABLE (
    id_barra INTEGER,
    nombre VARCHAR,
    pedidos_por_hora NUMERIC
) AS $$
    WITH tx_barra AS (
        SELECT
            t.id_barra,
            t.id_transaccion,
            DATE_TRUNC('hour', t.fecha AT TIME ZONE 'Europe/Madrid') AS hora_activa
        FROM public.transacciones t
        JOIN public.barras b ON t.id_barra = b.id_barra
        WHERE b.id_festival = p_id_festival
          AND t.tipo_movimiento != 'recarga'
    ),
    agregado AS (
        SELECT
            id_barra,
            COUNT(*) AS total_pedidos,
            COUNT(DISTINCT hora_activa) AS horas_activas
        FROM tx_barra
        GROUP BY id_barra
    )
    SELECT
        b.id_barra,
        b.nombre_localizacion AS nombre,
        CASE
            WHEN COALESCE(a.horas_activas, 0) = 0 THEN 0
            ELSE ROUND(a.total_pedidos::NUMERIC / a.horas_activas, 2)
        END AS pedidos_por_hora
    FROM public.barras b
    LEFT JOIN agregado a ON a.id_barra = b.id_barra
    WHERE b.id_festival = p_id_festival
    ORDER BY pedidos_por_hora DESC;
$$ LANGUAGE sql STABLE;
