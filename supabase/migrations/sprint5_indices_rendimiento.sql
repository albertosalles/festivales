-- ============================================================================
-- sprint5_indices_rendimiento.sql
-- Índices de rendimiento para queries existentes y comparativa diaria.
--
-- Antes de esta migración, transacciones y lineas_transaccion solo tenían
-- la PK, así que cualquier query con WHERE id_barra/id_wallet/fecha hacía
-- scan secuencial. Con datos sintéticos para varios festivales esto se
-- volvería lento rápidamente.
--
-- Todos los índices están justificados por queries que ya existen en el
-- código (servicios TypeScript + funciones PL/pgSQL).
-- ============================================================================

BEGIN;

-- transacciones: la tabla más consultada, con triple filtrado típico
-- WHERE t.id_barra IN (...)
--   AND t.tipo_movimiento IN ('compra','pago_bebida','pago_comida')
--   AND DATE(t.fecha) = ...
CREATE INDEX IF NOT EXISTS idx_transacciones_barra
    ON public.transacciones (id_barra);

-- Saldo medio final + total recargas hacen JOIN por id_wallet
CREATE INDEX IF NOT EXISTS idx_transacciones_wallet
    ON public.transacciones (id_wallet);

-- Desglose diario en datos_por_dia: GROUP BY DATE(fecha)
CREATE INDEX IF NOT EXISTS idx_transacciones_fecha
    ON public.transacciones (fecha);

-- Producto estrella (JOIN por id_transaccion) + DELETE en purga/anonimización
CREATE INDEX IF NOT EXISTS idx_lineas_transaccion_transaccion
    ON public.lineas_transaccion (id_transaccion);

-- Producto estrella (JOIN por id_producto)
CREATE INDEX IF NOT EXISTS idx_lineas_transaccion_producto
    ON public.lineas_transaccion (id_producto);

-- Listados de productos por barra + DELETE en purga
CREATE INDEX IF NOT EXISTS idx_productos_barra
    ON public.productos (id_barra);

-- Métricas de incidencias + DELETE en purga
CREATE INDEX IF NOT EXISTS idx_incidencias_barra_barra
    ON public.incidencias_barra (id_barra);

-- Cálculo de horas por barra (función generar_resumen_festival)
CREATE INDEX IF NOT EXISTS idx_asignaciones_barra
    ON public.asignaciones_camareros (id_barra);

-- Listado de asignaciones de un camarero
CREATE INDEX IF NOT EXISTS idx_asignaciones_camarero
    ON public.asignaciones_camareros (id_camarero);

COMMIT;
