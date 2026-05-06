-- ============================================================================
-- sprint5_fix_dia_festivo_4am.sql
--
-- Fix conceptual: las transacciones entre 00:00 y 04:00 deben contarse como
-- el día festivo anterior, no el siguiente civil.
--
-- Heurística estándar en hostelería nocturna: "el día empieza a las 04:00".
-- Una venta a las 02:00 del sábado civil es realmente del festival-viernes
-- (es la noche del viernes que se prolonga hasta la madrugada).
--
-- Cambio: DATE(t.fecha) → DATE(t.fecha - INTERVAL '4 hours') en las dos
-- funciones que calculan el desglose diario:
--   * generar_resumen_festival (snapshot)
--   * calcular_datos_por_dia   (RPC en vivo)
--
-- Sin esto, los festivales mostrarían 4 días con ventas (vie+sáb+dom+lun)
-- en lugar de 3, y el 'lunes' tendría dia_relativo=NULL al no caer en el
-- patrón viernes/sábado/domingo.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generar_resumen_festival(p_id_festival INTEGER)
RETURNS public.resumen_festival AS $$
DECLARE
    v_resumen public.resumen_festival;
    v_recaudacion NUMERIC;
    v_horas NUMERIC;
    v_producto_estrella VARCHAR;
    v_datos_barras JSONB;
    v_datos_dia JSONB;
    v_fecha_inicio DATE;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.festivales WHERE id_festival = p_id_festival) THEN
        RAISE EXCEPTION 'El festival % no existe', p_id_festival;
    END IF;

    SELECT fecha_inicio INTO v_fecha_inicio
    FROM public.festivales WHERE id_festival = p_id_festival;

    SELECT COALESCE(SUM(t.monto), 0) INTO v_recaudacion
    FROM public.transacciones t
    JOIN public.barras b ON t.id_barra = b.id_barra
    WHERE b.id_festival = p_id_festival
      AND t.tipo_movimiento IN ('compra','pago_bebida','pago_comida');

    SELECT COALESCE(SUM(a.horas_imputadas), 0) INTO v_horas
    FROM public.asignaciones_camareros a
    JOIN public.barras b ON a.id_barra = b.id_barra
    WHERE b.id_festival = p_id_festival;

    SELECT p.nombre INTO v_producto_estrella
    FROM public.lineas_transaccion lt
    JOIN public.productos p ON lt.id_producto = p.id_producto
    JOIN public.transacciones t ON lt.id_transaccion = t.id_transaccion
    JOIN public.barras b ON t.id_barra = b.id_barra
    WHERE b.id_festival = p_id_festival
    GROUP BY p.nombre
    ORDER BY SUM(lt.cantidad) DESC NULLS LAST
    LIMIT 1;

    SELECT COALESCE(jsonb_agg(barra_data ORDER BY (barra_data->>'id_barra')::int), '[]'::jsonb)
    INTO v_datos_barras
    FROM (
        SELECT jsonb_build_object(
            'id_barra', b.id_barra,
            'nombre', b.nombre_localizacion,
            'ingresos', COALESCE(SUM(t.monto) FILTER (
                WHERE t.tipo_movimiento IN ('compra','pago_bebida','pago_comida')
            ), 0),
            'num_transacciones', COUNT(t.id_transaccion) FILTER (
                WHERE t.tipo_movimiento IN ('compra','pago_bebida','pago_comida')
            ),
            'horas_servicio', COALESCE((
                SELECT SUM(a.horas_imputadas)
                FROM public.asignaciones_camareros a
                WHERE a.id_barra = b.id_barra
            ), 0),
            'eficiencia_euros_hora', CASE
                WHEN COALESCE((SELECT SUM(a.horas_imputadas)
                               FROM public.asignaciones_camareros a
                               WHERE a.id_barra = b.id_barra), 0) > 0
                THEN ROUND(
                    COALESCE(SUM(t.monto) FILTER (
                        WHERE t.tipo_movimiento IN ('compra','pago_bebida','pago_comida')
                    ), 0) /
                    (SELECT SUM(a.horas_imputadas)
                     FROM public.asignaciones_camareros a
                     WHERE a.id_barra = b.id_barra),
                    2
                )
                ELSE 0
            END
        ) AS barra_data
        FROM public.barras b
        LEFT JOIN public.transacciones t ON t.id_barra = b.id_barra
        WHERE b.id_festival = p_id_festival
        GROUP BY b.id_barra, b.nombre_localizacion
    ) sub;

    -- Desglose diario con corrección de madrugada (-4h):
    WITH ventas_dia AS (
        SELECT
            DATE(t.fecha - INTERVAL '4 hours') AS fecha_dia,
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

    INSERT INTO public.resumen_festival (
        id_festival, total_asistentes, total_transacciones, recaudacion_total,
        ticket_medio, saldo_medio_final, total_recargas, total_camareros,
        total_incidencias, horas_totales_servicio, eficiencia_euros_hora,
        producto_estrella, datos_por_barra, datos_por_dia
    )
    SELECT
        p_id_festival,
        (SELECT COUNT(*) FROM public.usuario WHERE id_festival = p_id_festival),
        (SELECT COUNT(*) FROM public.transacciones t
            JOIN public.barras b ON t.id_barra = b.id_barra
            WHERE b.id_festival = p_id_festival
              AND t.tipo_movimiento IN ('compra','pago_bebida','pago_comida')),
        v_recaudacion,
        COALESCE((SELECT AVG(t.monto) FROM public.transacciones t
            JOIN public.barras b ON t.id_barra = b.id_barra
            WHERE b.id_festival = p_id_festival
              AND t.tipo_movimiento IN ('compra','pago_bebida','pago_comida')), 0),
        COALESCE((SELECT AVG(w.saldo) FROM public.wallet w
            JOIN public.usuario u ON w.id_usuario = u.id_usuario
            WHERE u.id_festival = p_id_festival), 0),
        COALESCE((SELECT SUM(t.monto) FROM public.transacciones t
            JOIN public.wallet w ON t.id_wallet = w.id_wallet
            JOIN public.usuario u ON w.id_usuario = u.id_usuario
            WHERE u.id_festival = p_id_festival
              AND t.tipo_movimiento = 'recarga'), 0),
        (SELECT COUNT(*) FROM public.camareros WHERE id_festival = p_id_festival),
        (SELECT COUNT(*) FROM public.incidencias_barra i
            JOIN public.barras b ON i.id_barra = b.id_barra
            WHERE b.id_festival = p_id_festival),
        v_horas,
        CASE WHEN v_horas > 0 THEN ROUND(v_recaudacion / v_horas, 2) ELSE 0 END,
        v_producto_estrella,
        v_datos_barras,
        v_datos_dia
    ON CONFLICT (id_festival) DO UPDATE SET
        total_asistentes        = EXCLUDED.total_asistentes,
        total_transacciones     = EXCLUDED.total_transacciones,
        recaudacion_total       = EXCLUDED.recaudacion_total,
        ticket_medio            = EXCLUDED.ticket_medio,
        saldo_medio_final       = EXCLUDED.saldo_medio_final,
        total_recargas          = EXCLUDED.total_recargas,
        total_camareros         = EXCLUDED.total_camareros,
        total_incidencias       = EXCLUDED.total_incidencias,
        horas_totales_servicio  = EXCLUDED.horas_totales_servicio,
        eficiencia_euros_hora   = EXCLUDED.eficiencia_euros_hora,
        producto_estrella       = EXCLUDED.producto_estrella,
        datos_por_barra         = EXCLUDED.datos_por_barra,
        datos_por_dia           = EXCLUDED.datos_por_dia,
        created_at              = CURRENT_TIMESTAMP
    RETURNING * INTO v_resumen;

    UPDATE public.festivales SET estado = 'resumen_generado'
    WHERE id_festival = p_id_festival AND estado = 'finalizado';

    RETURN v_resumen;
END;
$$ LANGUAGE plpgsql;

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
            DATE(t.fecha - INTERVAL '4 hours') AS fecha_dia,
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
