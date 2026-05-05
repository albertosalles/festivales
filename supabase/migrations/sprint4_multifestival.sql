-- ============================================================================
-- sprint4_multifestival.sql
-- Soporte multifestival + funciones de purgado manual.
--
-- Crea las tablas `festivales` y `resumen_festival`, añade `id_festival` a las
-- tablas raíz (barras, usuario, camareros), reestructura la PK de
-- `configuracion_festival` y crea 3 funciones de gestión de ciclo de vida:
-- generar_resumen, anonimizar y purgar_completo.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Tabla festivales
-- ----------------------------------------------------------------------------
CREATE TABLE public.festivales (
    id_festival   SERIAL PRIMARY KEY,
    nombre        VARCHAR NOT NULL UNIQUE,
    ubicacion     VARCHAR,
    fecha_inicio  DATE,
    fecha_fin     DATE,
    activo        BOOLEAN NOT NULL DEFAULT FALSE,
    estado        VARCHAR NOT NULL DEFAULT 'en_curso'
                  CHECK (estado IN ('en_curso','finalizado','resumen_generado','anonimizado','purgado')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Garantía a nivel BD: solo puede haber un festival activo simultáneamente
CREATE UNIQUE INDEX un_solo_festival_activo
    ON public.festivales (activo) WHERE activo = TRUE;

-- ----------------------------------------------------------------------------
-- 2. Tabla resumen_festival
-- ----------------------------------------------------------------------------
CREATE TABLE public.resumen_festival (
    id_resumen              SERIAL PRIMARY KEY,
    id_festival             INTEGER NOT NULL UNIQUE
                            REFERENCES public.festivales(id_festival)
                            ON DELETE CASCADE,
    total_asistentes        INTEGER NOT NULL DEFAULT 0,
    total_transacciones     INTEGER NOT NULL DEFAULT 0,
    recaudacion_total       NUMERIC(12,2) NOT NULL DEFAULT 0,
    ticket_medio            NUMERIC(12,2) NOT NULL DEFAULT 0,
    saldo_medio_final       NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_recargas          NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_camareros         INTEGER NOT NULL DEFAULT 0,
    total_incidencias       INTEGER NOT NULL DEFAULT 0,
    horas_totales_servicio  NUMERIC(10,2) NOT NULL DEFAULT 0,
    eficiencia_euros_hora   NUMERIC(10,2) NOT NULL DEFAULT 0,
    producto_estrella       VARCHAR,
    datos_por_barra         JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. Festival inaugural
-- ----------------------------------------------------------------------------
INSERT INTO public.festivales (nombre, ubicacion, fecha_inicio, fecha_fin, activo, estado)
VALUES ('FestiApp Verano', 'Alicante', NULL, NULL, TRUE, 'en_curso');

-- ----------------------------------------------------------------------------
-- 4. Añadir id_festival a tablas raíz (nullable → backfill → NOT NULL)
-- ----------------------------------------------------------------------------
ALTER TABLE public.barras
    ADD COLUMN id_festival INTEGER REFERENCES public.festivales(id_festival);
ALTER TABLE public.usuario
    ADD COLUMN id_festival INTEGER REFERENCES public.festivales(id_festival);
ALTER TABLE public.camareros
    ADD COLUMN id_festival INTEGER REFERENCES public.festivales(id_festival);

UPDATE public.barras    SET id_festival = 1 WHERE id_festival IS NULL;
UPDATE public.usuario   SET id_festival = 1 WHERE id_festival IS NULL;
UPDATE public.camareros SET id_festival = 1 WHERE id_festival IS NULL;

ALTER TABLE public.barras    ALTER COLUMN id_festival SET NOT NULL;
ALTER TABLE public.usuario   ALTER COLUMN id_festival SET NOT NULL;
ALTER TABLE public.camareros ALTER COLUMN id_festival SET NOT NULL;

CREATE INDEX idx_barras_festival    ON public.barras(id_festival);
CREATE INDEX idx_usuario_festival   ON public.usuario(id_festival);
CREATE INDEX idx_camareros_festival ON public.camareros(id_festival);

-- ----------------------------------------------------------------------------
-- 5. configuracion_festival → PK compuesta (id_festival, clave)
-- ----------------------------------------------------------------------------
ALTER TABLE public.configuracion_festival
    ADD COLUMN id_festival INTEGER REFERENCES public.festivales(id_festival);
UPDATE public.configuracion_festival SET id_festival = 1 WHERE id_festival IS NULL;
ALTER TABLE public.configuracion_festival
    ALTER COLUMN id_festival SET NOT NULL;
ALTER TABLE public.configuracion_festival
    DROP CONSTRAINT configuracion_festival_pkey;
ALTER TABLE public.configuracion_festival
    ADD PRIMARY KEY (id_festival, clave);

-- ----------------------------------------------------------------------------
-- 6. Función: generar_resumen_festival
-- Calcula y guarda métricas agregadas. Idempotente (ON CONFLICT).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generar_resumen_festival(p_id_festival INTEGER)
RETURNS public.resumen_festival AS $$
DECLARE
    v_resumen public.resumen_festival;
    v_recaudacion NUMERIC;
    v_horas NUMERIC;
    v_producto_estrella VARCHAR;
    v_datos_barras JSONB;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.festivales WHERE id_festival = p_id_festival) THEN
        RAISE EXCEPTION 'El festival % no existe', p_id_festival;
    END IF;

    -- Recaudación total del festival
    SELECT COALESCE(SUM(t.monto), 0) INTO v_recaudacion
    FROM public.transacciones t
    JOIN public.barras b ON t.id_barra = b.id_barra
    WHERE b.id_festival = p_id_festival
      AND t.tipo_movimiento IN ('compra','pago_bebida','pago_comida');

    -- Horas totales de servicio
    SELECT COALESCE(SUM(a.horas_imputadas), 0) INTO v_horas
    FROM public.asignaciones_camareros a
    JOIN public.barras b ON a.id_barra = b.id_barra
    WHERE b.id_festival = p_id_festival;

    -- Producto estrella global
    SELECT p.nombre INTO v_producto_estrella
    FROM public.lineas_transaccion lt
    JOIN public.productos p ON lt.id_producto = p.id_producto
    JOIN public.transacciones t ON lt.id_transaccion = t.id_transaccion
    JOIN public.barras b ON t.id_barra = b.id_barra
    WHERE b.id_festival = p_id_festival
    GROUP BY p.nombre
    ORDER BY SUM(lt.cantidad) DESC NULLS LAST
    LIMIT 1;

    -- Datos por barra (JSONB con eficiencia €/h por barra)
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

    -- Insert/update del resumen
    INSERT INTO public.resumen_festival (
        id_festival, total_asistentes, total_transacciones, recaudacion_total,
        ticket_medio, saldo_medio_final, total_recargas, total_camareros,
        total_incidencias, horas_totales_servicio, eficiencia_euros_hora,
        producto_estrella, datos_por_barra
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
        v_datos_barras
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
        created_at              = CURRENT_TIMESTAMP
    RETURNING * INTO v_resumen;

    -- Solo progresar el estado si veníamos de 'finalizado' (cierre real del festival).
    -- Esto permite generar resumenes "preview" durante el festival sin alterar su ciclo de vida.
    UPDATE public.festivales SET estado = 'resumen_generado'
    WHERE id_festival = p_id_festival AND estado = 'finalizado';

    RETURN v_resumen;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 7. Función: anonimizar_datos_festival
-- Anonimiza usuarios y elimina líneas de transacción detalladas.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.anonimizar_datos_festival(p_id_festival INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_usuarios_afectados INTEGER;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.resumen_festival WHERE id_festival = p_id_festival) THEN
        RAISE EXCEPTION 'No se puede anonimizar el festival %: genera primero el resumen', p_id_festival;
    END IF;

    UPDATE public.usuario SET
        nombre              = 'Anon',
        apellidos           = NULL,
        correo              = 'anon-' || id_usuario || '@purged.local',
        telefono            = NULL,
        token_pago          = NULL,
        preferencia_musica  = NULL,
        preferencia_comida  = NULL
    WHERE id_festival = p_id_festival;

    GET DIAGNOSTICS v_usuarios_afectados = ROW_COUNT;

    DELETE FROM public.lineas_transaccion lt
    USING public.transacciones t, public.barras b
    WHERE lt.id_transaccion = t.id_transaccion
      AND t.id_barra = b.id_barra
      AND b.id_festival = p_id_festival;

    UPDATE public.festivales SET estado = 'anonimizado'
    WHERE id_festival = p_id_festival;

    RETURN v_usuarios_afectados;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 8. Función: purgar_festival_completo
-- Elimina todos los datos operativos. Mantiene festivales + resumen_festival.
-- Requiere resumen previo y festival no activo.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.purgar_festival_completo(p_id_festival INTEGER)
RETURNS TEXT AS $$
DECLARE
    v_log TEXT := '';
    v_count INTEGER;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.resumen_festival WHERE id_festival = p_id_festival) THEN
        RAISE EXCEPTION 'No se puede purgar el festival %: genera primero el resumen', p_id_festival;
    END IF;

    IF EXISTS (SELECT 1 FROM public.festivales WHERE id_festival = p_id_festival AND activo = TRUE) THEN
        RAISE EXCEPTION 'No se puede purgar un festival activo. Desactívalo primero.';
    END IF;

    DELETE FROM public.lineas_transaccion lt
    USING public.transacciones t, public.barras b
    WHERE lt.id_transaccion = t.id_transaccion
      AND t.id_barra = b.id_barra AND b.id_festival = p_id_festival;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_log := v_log || v_count || ' líneas, ';

    DELETE FROM public.transacciones t USING public.barras b
    WHERE t.id_barra = b.id_barra AND b.id_festival = p_id_festival;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_log := v_log || v_count || ' transacciones, ';

    DELETE FROM public.incidencias_barra i USING public.barras b
    WHERE i.id_barra = b.id_barra AND b.id_festival = p_id_festival;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_log := v_log || v_count || ' incidencias, ';

    DELETE FROM public.asignaciones_camareros a USING public.barras b
    WHERE a.id_barra = b.id_barra AND b.id_festival = p_id_festival;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_log := v_log || v_count || ' asignaciones, ';

    UPDATE public.camareros SET id_barra_actual = NULL
    WHERE id_festival = p_id_festival;

    DELETE FROM public.productos p USING public.barras b
    WHERE p.id_barra = b.id_barra AND b.id_festival = p_id_festival;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_log := v_log || v_count || ' productos, ';

    DELETE FROM public.camareros WHERE id_festival = p_id_festival;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_log := v_log || v_count || ' camareros, ';

    DELETE FROM public.wallet w USING public.usuario u
    WHERE w.id_usuario = u.id_usuario AND u.id_festival = p_id_festival;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_log := v_log || v_count || ' wallets, ';

    DELETE FROM public.usuario WHERE id_festival = p_id_festival;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_log := v_log || v_count || ' usuarios, ';

    DELETE FROM public.barras WHERE id_festival = p_id_festival;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_log := v_log || v_count || ' barras, ';

    DELETE FROM public.configuracion_festival WHERE id_festival = p_id_festival;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_log := v_log || v_count || ' config';

    UPDATE public.festivales SET estado = 'purgado'
    WHERE id_festival = p_id_festival;

    RETURN 'Purgado: ' || v_log;
END;
$$ LANGUAGE plpgsql;

COMMIT;
