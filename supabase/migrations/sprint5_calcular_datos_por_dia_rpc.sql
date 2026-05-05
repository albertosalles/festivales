-- ============================================================================
-- sprint5_calcular_datos_por_dia_rpc.sql
-- RPC para calcular el desglose diario en vivo, sin escribir en
-- resumen_festival. Útil para el dashboard mientras el festival está en curso.
--
-- Comparte la lógica con generar_resumen_festival, así que los datos del
-- snapshot (ediciones cerradas) y los datos en vivo (festival activo)
-- siempre tendrán el mismo formato.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calcular_datos_por_dia(p_id_festival INTEGER)
RETURNS JSONB AS $$
DECLARE
    v_datos_dia JSONB;
    v_fecha_inicio DATE;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.festivales WHERE id_festival = p_id_festival) THEN
        RAISE EXCEPTION 'El festival % no existe', p_id_festival;
    END IF;

    SELECT fecha_inicio INTO v_fecha_inicio
    FROM public.festivales WHERE id_festival = p_id_festival;

    WITH ventas_dia AS (
        SELECT
            DATE(t.fecha) AS fecha_dia,
            t.id_barra,
            t.monto
        FROM public.transacciones t
        JOIN public.barras b ON t.id_barra = b.id_barra
        WHERE b.id_festival = p_id_festival
          AND t.tipo_movimiento IN ('compra','pago_bebida','pago_comida')
    ),
    dia_global AS (
        SELECT
            fecha_dia,
            ROUND(SUM(monto)::numeric, 2) AS ingresos,
            COUNT(*) AS num_transacciones,
            ROUND(AVG(monto)::numeric, 2) AS ticket_medio
        FROM ventas_dia
        GROUP BY fecha_dia
    ),
    dia_barra_agg AS (
        SELECT
            v.fecha_dia,
            v.id_barra,
            b.nombre_localizacion,
            ROUND(SUM(v.monto)::numeric, 2) AS ingresos,
            COUNT(*) AS num_transacciones
        FROM ventas_dia v
        JOIN public.barras b ON v.id_barra = b.id_barra
        GROUP BY v.fecha_dia, v.id_barra, b.nombre_localizacion
    ),
    dia_barras_agrupado AS (
        SELECT
            fecha_dia,
            jsonb_agg(jsonb_build_object(
                'id_barra', id_barra,
                'nombre', nombre_localizacion,
                'ingresos', ingresos,
                'num_transacciones', num_transacciones
            ) ORDER BY id_barra) AS barras_json
        FROM dia_barra_agg
        GROUP BY fecha_dia
    )
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'dia_relativo', CASE
                WHEN v_fecha_inicio IS NOT NULL
                    THEN (dg.fecha_dia - v_fecha_inicio + 1)
                ELSE CASE EXTRACT(ISODOW FROM dg.fecha_dia)::int
                    WHEN 5 THEN 1
                    WHEN 6 THEN 2
                    WHEN 7 THEN 3
                    ELSE NULL
                END
            END,
            'fecha', dg.fecha_dia,
            'dia_semana', CASE EXTRACT(ISODOW FROM dg.fecha_dia)::int
                WHEN 1 THEN 'lunes'
                WHEN 2 THEN 'martes'
                WHEN 3 THEN 'miércoles'
                WHEN 4 THEN 'jueves'
                WHEN 5 THEN 'viernes'
                WHEN 6 THEN 'sábado'
                WHEN 7 THEN 'domingo'
            END,
            'ingresos', dg.ingresos,
            'transacciones', dg.num_transacciones,
            'ticket_medio', dg.ticket_medio,
            'barras', COALESCE(db.barras_json, '[]'::jsonb)
        ) ORDER BY dg.fecha_dia
    ), '[]'::jsonb) INTO v_datos_dia
    FROM dia_global dg
    LEFT JOIN dia_barras_agrupado db ON db.fecha_dia = dg.fecha_dia;

    RETURN v_datos_dia;
END;
$$ LANGUAGE plpgsql STABLE;
