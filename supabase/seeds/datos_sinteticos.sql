-- ============================================================================
-- datos_sinteticos.sql
--
-- Genera 3 ediciones del festival con datos sintéticos coherentes para
-- demostraciones y para validar la arquitectura multifestival + el workflow
-- de purgado.
--
-- Volúmenes (ajustables):
--   * 2024: 600 usuarios, ~3000 compras, ~900 recargas, estado=resumen_generado
--   * 2025: 900 usuarios, ~4500 compras, ~1350 recargas, estado=resumen_generado
--   * 2026: 1200 usuarios, ~6000 compras, ~1800 recargas, estado=en_curso (activo)
--
-- Patrones:
--   * Distribución por día: vie 35% / sáb 40% / dom 25%
--   * Distribución horaria: pico en 22:00-02:00 (curva nocturna típica)
--   * 1-3 líneas por compra (60/30/10)
--   * Crecimiento ~40-50% año a año en recaudación
--
-- IMPORTANTE: este script BORRA todos los datos operativos antes de generar.
-- Solo se conservan el esquema, índices y funciones SQL.
--
-- Ejecutar con: psql ... -f supabase/seeds/datos_sinteticos.sql
-- O vía Supabase MCP: dividir en los 3 bloques BEGIN/COMMIT (uno por paso).
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- PASO 1/3: Limpieza + festivales + estructura base
-- ────────────────────────────────────────────────────────────────────────────
BEGIN;

DELETE FROM public.lineas_transaccion;
DELETE FROM public.transacciones;
DELETE FROM public.incidencias_barra;
DELETE FROM public.asignaciones_camareros;
DELETE FROM public.productos;
UPDATE public.camareros SET id_barra_actual = NULL;
DELETE FROM public.camareros;
DELETE FROM public.wallet;
DELETE FROM public.usuario;
DELETE FROM public.barras;
DELETE FROM public.configuracion_festival;
DELETE FROM public.resumen_festival;
DELETE FROM public.festivales;

ALTER SEQUENCE festivales_id_festival_seq RESTART WITH 1;
ALTER SEQUENCE barras_id_barra_seq RESTART WITH 1;
ALTER SEQUENCE usuario_id_usuario_seq RESTART WITH 1;
ALTER SEQUENCE wallet_id_wallet_seq RESTART WITH 1;
ALTER SEQUENCE camareros_id_camarero_seq RESTART WITH 1;
ALTER SEQUENCE productos_id_producto_seq RESTART WITH 1;
ALTER SEQUENCE transacciones_id_transaccion_seq RESTART WITH 1;
ALTER SEQUENCE lineas_transaccion_id_linea_seq RESTART WITH 1;
ALTER SEQUENCE asignaciones_camareros_id_asignacion_seq RESTART WITH 1;
ALTER SEQUENCE incidencias_barra_id_incidencia_seq RESTART WITH 1;
ALTER SEQUENCE resumen_festival_id_resumen_seq RESTART WITH 1;

INSERT INTO public.festivales (id_festival, nombre, ubicacion, fecha_inicio, fecha_fin, activo, estado) VALUES
    (1, 'FestiApp Verano 2024', 'Alicante', '2024-08-02', '2024-08-04', FALSE, 'resumen_generado'),
    (2, 'FestiApp Verano 2025', 'Alicante', '2025-08-01', '2025-08-03', FALSE, 'resumen_generado'),
    (3, 'FestiApp Verano 2026', 'Alicante', '2026-07-31', '2026-08-02', TRUE,  'en_curso');

SELECT setval('festivales_id_festival_seq', 3, TRUE);

INSERT INTO public.configuracion_festival (id_festival, clave, valor)
SELECT f.id_festival, c.clave, c.valor
FROM public.festivales f
CROSS JOIN (VALUES
    ('genero_actual', 'pop'),
    ('aforo_maximo', '5000'),
    ('hora_apertura', '18:00'),
    ('hora_cierre', '04:00')
) AS c(clave, valor);

INSERT INTO public.barras (id_festival, nombre_localizacion, estado_cola)
SELECT f.id_festival, b.nombre, 'baja'
FROM public.festivales f
CROSS JOIN (VALUES
    ('Barra Escenario Principal'),
    ('Barra Escenario Indie'),
    ('Food Truck Hamburguesas'),
    ('Food Truck Vegano'),
    ('Barra Zona VIP')
) AS b(nombre);

INSERT INTO public.camareros (id_festival, nombre, apellidos, activo)
SELECT f.id_festival, n.nombre, n.apellidos, f.activo
FROM public.festivales f
CROSS JOIN (VALUES
    ('Carlos', 'García López'),
    ('María', 'Rodríguez Ruiz'),
    ('Javier', 'Martínez Soto'),
    ('Lucía', 'Fernández Vega'),
    ('David', 'González Pérez'),
    ('Elena', 'Sánchez Ortega'),
    ('Pablo', 'Ramírez Castro'),
    ('Sara', 'Hernández Molina'),
    ('Adrián', 'Jiménez Romero'),
    ('Carmen', 'Díaz Navarro'),
    ('Iván', 'Torres Iglesias'),
    ('Andrea', 'Vázquez Cortés')
) AS n(nombre, apellidos);

-- Productos para barras de bebidas
INSERT INTO public.productos (id_barra, nombre, precio, categoria)
SELECT b.id_barra, p.nombre, p.precio, p.categoria
FROM public.barras b
CROSS JOIN (VALUES
    ('Cerveza Estrella', 4.00, 'bebida'),
    ('Cerveza IPA', 5.00, 'bebida'),
    ('Cerveza sin alcohol', 3.50, 'bebida'),
    ('Vino tinto', 5.00, 'bebida'),
    ('Vino blanco', 5.00, 'bebida'),
    ('Mojito', 8.00, 'bebida'),
    ('Gin Tonic', 9.00, 'bebida'),
    ('Ron Cola', 8.00, 'bebida'),
    ('Whisky Cola', 9.00, 'bebida'),
    ('Vodka Limón', 8.00, 'bebida'),
    ('Agua', 2.00, 'bebida'),
    ('Refresco', 3.00, 'bebida')
) AS p(nombre, precio, categoria)
WHERE b.nombre_localizacion IN (
    'Barra Escenario Principal', 'Barra Escenario Indie', 'Barra Zona VIP'
);

-- Productos del Food Truck Hamburguesas
INSERT INTO public.productos (id_barra, nombre, precio, categoria)
SELECT b.id_barra, p.nombre, p.precio, p.categoria
FROM public.barras b
CROSS JOIN (VALUES
    ('Hamburguesa Clásica', 8.00, 'comida'),
    ('Hamburguesa Doble', 11.00, 'comida'),
    ('Hamburguesa BBQ', 10.00, 'comida'),
    ('Hamburguesa con queso', 9.00, 'comida'),
    ('Patatas fritas', 4.00, 'comida'),
    ('Nachos con queso', 6.00, 'comida'),
    ('Refresco', 3.00, 'bebida'),
    ('Cerveza Estrella', 4.00, 'bebida')
) AS p(nombre, precio, categoria)
WHERE b.nombre_localizacion = 'Food Truck Hamburguesas';

-- Productos del Food Truck Vegano
INSERT INTO public.productos (id_barra, nombre, precio, categoria)
SELECT b.id_barra, p.nombre, p.precio, p.categoria
FROM public.barras b
CROSS JOIN (VALUES
    ('Burger vegana', 9.00, 'comida'),
    ('Tacos veganos', 7.00, 'comida'),
    ('Falafel wrap', 8.00, 'comida'),
    ('Bowl de quinoa', 9.50, 'comida'),
    ('Patatas fritas', 4.00, 'comida'),
    ('Smoothie de frutas', 5.00, 'bebida'),
    ('Agua', 2.00, 'bebida'),
    ('Refresco', 3.00, 'bebida')
) AS p(nombre, precio, categoria)
WHERE b.nombre_localizacion = 'Food Truck Vegano';

COMMIT;

-- ────────────────────────────────────────────────────────────────────────────
-- PASO 2/3: Usuarios + wallets + asignaciones + incidencias
-- ────────────────────────────────────────────────────────────────────────────
BEGIN;

-- Helper inline (3 bloques idénticos por festival, varía solo el id_festival,
-- el prefijo de email y el número de filas). Los pools de nombres se repiten
-- en cada CTE para mantener cada query autocontenida.
WITH nombres AS (
    SELECT unnest(ARRAY[
        'Alex','Andrea','Sergio','Laura','Daniel','Marta','Hugo','Paula','Mario','Sofía',
        'Diego','Claudia','Pablo','Alba','Lucas','Nuria','Adrián','Lara','Iván','Carla',
        'Marco','Inés','Bruno','Julia','Gonzalo','Eva','Rubén','Cristina','Álvaro','Patricia',
        'Víctor','Helena','Jorge','Beatriz','Alejandro','Rocío','Marcos','Silvia','Raúl','Ainhoa'
    ]) AS nombre
),
apellidos AS (
    SELECT unnest(ARRAY[
        'García López','Martínez Soto','Rodríguez Ruiz','Fernández Vega','Sánchez Ortega',
        'Ramírez Castro','Hernández Molina','Jiménez Romero','Díaz Navarro','Torres Iglesias',
        'Vázquez Cortés','Moreno Díaz','Romero Gil','Álvarez Marín','Muñoz León'
    ]) AS apellidos
),
generos AS (SELECT unnest(ARRAY['rock','pop','electronica','indie','hip-hop','reggaeton']) AS g),
comidas AS (SELECT unnest(ARRAY['vegetariano','vegano','sin_gluten','omnivoro']) AS c),
serie AS (SELECT generate_series(1, 600) AS i)
INSERT INTO public.usuario (id_festival, nombre, apellidos, edad, correo, telefono, token_pago, preferencia_musica, preferencia_comida)
SELECT
    1,
    (SELECT nombre FROM nombres ORDER BY random() LIMIT 1),
    (SELECT apellidos FROM apellidos ORDER BY random() LIMIT 1),
    (18 + floor(random() * 30))::int,
    'usuario2024.' || s.i || '@festiapp.local',
    '6' || lpad(floor(random() * 100000000)::text, 8, '0'),
    'tok-2024-' || lpad(s.i::text, 6, '0') || '-' || substring(md5(random()::text), 1, 8),
    (SELECT g FROM generos ORDER BY random() LIMIT 1),
    (SELECT c FROM comidas ORDER BY random() LIMIT 1)
FROM serie s;

WITH nombres AS (
    SELECT unnest(ARRAY[
        'Alex','Andrea','Sergio','Laura','Daniel','Marta','Hugo','Paula','Mario','Sofía',
        'Diego','Claudia','Pablo','Alba','Lucas','Nuria','Adrián','Lara','Iván','Carla',
        'Marco','Inés','Bruno','Julia','Gonzalo','Eva','Rubén','Cristina','Álvaro','Patricia',
        'Víctor','Helena','Jorge','Beatriz','Alejandro','Rocío','Marcos','Silvia','Raúl','Ainhoa'
    ]) AS nombre
),
apellidos AS (
    SELECT unnest(ARRAY[
        'García López','Martínez Soto','Rodríguez Ruiz','Fernández Vega','Sánchez Ortega',
        'Ramírez Castro','Hernández Molina','Jiménez Romero','Díaz Navarro','Torres Iglesias',
        'Vázquez Cortés','Moreno Díaz','Romero Gil','Álvarez Marín','Muñoz León'
    ]) AS apellidos
),
generos AS (SELECT unnest(ARRAY['rock','pop','electronica','indie','hip-hop','reggaeton']) AS g),
comidas AS (SELECT unnest(ARRAY['vegetariano','vegano','sin_gluten','omnivoro']) AS c),
serie AS (SELECT generate_series(1, 900) AS i)
INSERT INTO public.usuario (id_festival, nombre, apellidos, edad, correo, telefono, token_pago, preferencia_musica, preferencia_comida)
SELECT
    2,
    (SELECT nombre FROM nombres ORDER BY random() LIMIT 1),
    (SELECT apellidos FROM apellidos ORDER BY random() LIMIT 1),
    (18 + floor(random() * 30))::int,
    'usuario2025.' || s.i || '@festiapp.local',
    '6' || lpad(floor(random() * 100000000)::text, 8, '0'),
    'tok-2025-' || lpad(s.i::text, 6, '0') || '-' || substring(md5(random()::text), 1, 8),
    (SELECT g FROM generos ORDER BY random() LIMIT 1),
    (SELECT c FROM comidas ORDER BY random() LIMIT 1)
FROM serie s;

WITH nombres AS (
    SELECT unnest(ARRAY[
        'Alex','Andrea','Sergio','Laura','Daniel','Marta','Hugo','Paula','Mario','Sofía',
        'Diego','Claudia','Pablo','Alba','Lucas','Nuria','Adrián','Lara','Iván','Carla',
        'Marco','Inés','Bruno','Julia','Gonzalo','Eva','Rubén','Cristina','Álvaro','Patricia',
        'Víctor','Helena','Jorge','Beatriz','Alejandro','Rocío','Marcos','Silvia','Raúl','Ainhoa'
    ]) AS nombre
),
apellidos AS (
    SELECT unnest(ARRAY[
        'García López','Martínez Soto','Rodríguez Ruiz','Fernández Vega','Sánchez Ortega',
        'Ramírez Castro','Hernández Molina','Jiménez Romero','Díaz Navarro','Torres Iglesias',
        'Vázquez Cortés','Moreno Díaz','Romero Gil','Álvarez Marín','Muñoz León'
    ]) AS apellidos
),
generos AS (SELECT unnest(ARRAY['rock','pop','electronica','indie','hip-hop','reggaeton']) AS g),
comidas AS (SELECT unnest(ARRAY['vegetariano','vegano','sin_gluten','omnivoro']) AS c),
serie AS (SELECT generate_series(1, 1200) AS i)
INSERT INTO public.usuario (id_festival, nombre, apellidos, edad, correo, telefono, token_pago, preferencia_musica, preferencia_comida)
SELECT
    3,
    (SELECT nombre FROM nombres ORDER BY random() LIMIT 1),
    (SELECT apellidos FROM apellidos ORDER BY random() LIMIT 1),
    (18 + floor(random() * 30))::int,
    'usuario2026.' || s.i || '@festiapp.local',
    '6' || lpad(floor(random() * 100000000)::text, 8, '0'),
    'tok-2026-' || lpad(s.i::text, 6, '0') || '-' || substring(md5(random()::text), 1, 8),
    (SELECT g FROM generos ORDER BY random() LIMIT 1),
    (SELECT c FROM comidas ORDER BY random() LIMIT 1)
FROM serie s;

INSERT INTO public.wallet (id_usuario, saldo)
SELECT u.id_usuario, ROUND((random() * 30)::numeric, 2) FROM public.usuario u;

WITH dias_2024 AS (SELECT * FROM (VALUES (DATE '2024-08-02'),(DATE '2024-08-03'),(DATE '2024-08-04')) d(dia)),
dias_2025 AS (SELECT * FROM (VALUES (DATE '2025-08-01'),(DATE '2025-08-02'),(DATE '2025-08-03')) d(dia)),
dias_2026 AS (SELECT * FROM (VALUES (DATE '2026-07-31'),(DATE '2026-08-01'),(DATE '2026-08-02')) d(dia)),
turnos AS (
    SELECT * FROM (VALUES
        ('18:00:00'::time, '23:30:00'::time, 5.5::numeric),
        ('22:00:00'::time, '04:00:00'::time, 6.0::numeric)
    ) t(hora_inicio, hora_fin, horas)
),
asign AS (
    SELECT c.id_camarero, b.id_barra, d.dia, t.hora_inicio, t.hora_fin, t.horas
    FROM public.camareros c
    CROSS JOIN dias_2024 d CROSS JOIN turnos t
    JOIN LATERAL (SELECT id_barra FROM public.barras WHERE id_festival = 1 ORDER BY random() LIMIT 1) b ON TRUE
    WHERE c.id_festival = 1 AND random() < 0.7
    UNION ALL
    SELECT c.id_camarero, b.id_barra, d.dia, t.hora_inicio, t.hora_fin, t.horas
    FROM public.camareros c
    CROSS JOIN dias_2025 d CROSS JOIN turnos t
    JOIN LATERAL (SELECT id_barra FROM public.barras WHERE id_festival = 2 ORDER BY random() LIMIT 1) b ON TRUE
    WHERE c.id_festival = 2 AND random() < 0.7
    UNION ALL
    SELECT c.id_camarero, b.id_barra, d.dia, t.hora_inicio, t.hora_fin, t.horas
    FROM public.camareros c
    CROSS JOIN dias_2026 d CROSS JOIN turnos t
    JOIN LATERAL (SELECT id_barra FROM public.barras WHERE id_festival = 3 ORDER BY random() LIMIT 1) b ON TRUE
    WHERE c.id_festival = 3 AND random() < 0.7
)
INSERT INTO public.asignaciones_camareros (id_camarero, id_barra, fecha_inicio, fecha_fin, horas_imputadas)
SELECT
    id_camarero, id_barra,
    (dia + hora_inicio)::timestamptz,
    CASE WHEN hora_fin < hora_inicio THEN ((dia + 1) + hora_fin)::timestamptz ELSE (dia + hora_fin)::timestamptz END,
    horas
FROM asign;

INSERT INTO public.incidencias_barra (id_barra, id_camarero, tipo_incidencia, descripcion, fecha_reporte, estado)
SELECT
    (SELECT id_barra FROM public.barras WHERE id_festival = f.id_festival ORDER BY random() LIMIT 1),
    (SELECT id_camarero FROM public.camareros WHERE id_festival = f.id_festival ORDER BY random() LIMIT 1),
    inc.tipo,
    inc.descripcion,
    f.fecha_inicio + (random() * 2 || ' days')::interval + (interval '20 hours' + random() * interval '6 hours'),
    CASE WHEN f.activo THEN 'pendiente' ELSE 'resuelta' END
FROM public.festivales f
CROSS JOIN (VALUES
    ('rotura', 'Vaso roto en zona de paso'),
    ('agotamiento_stock', 'Se acabó la cerveza Estrella'),
    ('falta_personal', 'Cola excesiva, refuerzo solicitado'),
    ('avería_tpv', 'TPV reiniciado tras error de conexión')
) AS inc(tipo, descripcion);

COMMIT;

-- ────────────────────────────────────────────────────────────────────────────
-- PASO 3/3: Transacciones (recargas + compras) + líneas
-- ────────────────────────────────────────────────────────────────────────────
BEGIN;

-- Recargas (1 por usuario + 50% adicional)
WITH festivales_dia AS (
    SELECT id_festival, fecha_inicio FROM public.festivales
),
recargas_primarias AS (
    SELECT u.id_usuario, w.id_wallet, f.id_festival,
        ROUND((20 + random() * 30)::numeric, 2) AS monto,
        f.fecha_inicio + INTERVAL '18 hours' + (random() * INTERVAL '4 hours') AS fecha
    FROM public.usuario u
    JOIN public.wallet w ON w.id_usuario = u.id_usuario
    JOIN festivales_dia f ON f.id_festival = u.id_festival
),
recargas_secundarias AS (
    SELECT u.id_usuario, w.id_wallet, f.id_festival,
        ROUND((10 + random() * 20)::numeric, 2) AS monto,
        f.fecha_inicio +
            CASE WHEN random() < 0.6 THEN INTERVAL '1 day' ELSE INTERVAL '0 days' END +
            INTERVAL '21 hours' + (random() * INTERVAL '5 hours') AS fecha
    FROM public.usuario u
    JOIN public.wallet w ON w.id_usuario = u.id_usuario
    JOIN festivales_dia f ON f.id_festival = u.id_festival
    WHERE random() < 0.5
),
todas AS (SELECT * FROM recargas_primarias UNION ALL SELECT * FROM recargas_secundarias)
INSERT INTO public.transacciones (id_wallet, id_barra, tipo_movimiento, monto, fecha)
SELECT r.id_wallet,
    (SELECT id_barra FROM public.barras WHERE id_festival = r.id_festival ORDER BY random() LIMIT 1),
    'recarga', r.monto, r.fecha
FROM todas r;

-- Compras: precalcular IDs explícitos para asociar con líneas
CREATE TEMP TABLE _compras_intenciones AS
WITH festivales_volumen AS (
    SELECT id_festival, fecha_inicio, num_compras FROM (VALUES
        (1, DATE '2024-08-02', 3000),
        (2, DATE '2025-08-01', 4500),
        (3, DATE '2026-07-31', 6000)
    ) AS f(id_festival, fecha_inicio, num_compras)
),
randomizado AS (
    SELECT
        nextval('transacciones_id_transaccion_seq') AS id_transaccion,
        f.id_festival, f.fecha_inicio,
        random() AS r_dia, random() AS r_hora, random() AS r_minuto, random() AS r_lineas
    FROM festivales_volumen f
    CROSS JOIN LATERAL generate_series(1, f.num_compras) AS gs
),
con_dia AS (
    SELECT id_transaccion, id_festival, fecha_inicio, r_lineas,
        CASE WHEN r_dia < 0.35 THEN 0 WHEN r_dia < 0.75 THEN 1 ELSE 2 END AS dia_offset,
        (CASE
            WHEN r_hora < 0.05 THEN 0
            WHEN r_hora < 0.20 THEN 120
            WHEN r_hora < 0.50 THEN 240
            WHEN r_hora < 0.85 THEN 360
            ELSE 480
        END + r_minuto * 120) AS minutos_desde_18h
    FROM randomizado
),
con_seleccion AS (
    SELECT c.id_transaccion, c.id_festival, c.r_lineas,
        (c.fecha_inicio + c.dia_offset)::timestamptz +
            INTERVAL '18 hours' +
            make_interval(mins => floor(c.minutos_desde_18h)::int) AS fecha,
        b.id_barra
    FROM con_dia c
    JOIN LATERAL (SELECT id_barra FROM public.barras WHERE id_festival = c.id_festival ORDER BY random() LIMIT 1) b ON TRUE
)
SELECT id_transaccion, id_festival, id_barra, fecha,
    CASE WHEN r_lineas < 0.60 THEN 1 WHEN r_lineas < 0.90 THEN 2 ELSE 3 END AS num_lineas
FROM con_seleccion;

CREATE TEMP TABLE _compras_lineas AS
SELECT i.id_transaccion, p.id_producto, p.precio AS precio_unitario, 1 AS cantidad
FROM _compras_intenciones i
CROSS JOIN LATERAL generate_series(1, i.num_lineas) AS ln
JOIN LATERAL (
    SELECT id_producto, precio FROM public.productos
    WHERE id_barra = i.id_barra ORDER BY random() LIMIT 1
) p ON TRUE;

INSERT INTO public.transacciones (id_transaccion, id_wallet, id_barra, tipo_movimiento, monto, fecha)
SELECT i.id_transaccion, w.id_wallet, i.id_barra, 'compra',
    (SELECT SUM(precio_unitario * cantidad) FROM _compras_lineas l WHERE l.id_transaccion = i.id_transaccion),
    i.fecha
FROM _compras_intenciones i
JOIN LATERAL (
    SELECT w.id_wallet
    FROM public.wallet w JOIN public.usuario u ON u.id_usuario = w.id_usuario
    WHERE u.id_festival = i.id_festival ORDER BY random() LIMIT 1
) w ON TRUE;

INSERT INTO public.lineas_transaccion (id_transaccion, id_producto, cantidad, precio_unitario)
SELECT id_transaccion, id_producto, cantidad, precio_unitario FROM _compras_lineas;

DROP TABLE _compras_intenciones;
DROP TABLE _compras_lineas;

SELECT setval('transacciones_id_transaccion_seq', (SELECT MAX(id_transaccion) FROM public.transacciones));

COMMIT;

-- ────────────────────────────────────────────────────────────────────────────
-- POST: Generar resumenes de festivales cerrados (2024 + 2025)
-- 2026 queda activo y sin resumen para demostrar el flujo en vivo.
-- ────────────────────────────────────────────────────────────────────────────
SELECT generar_resumen_festival(1);
SELECT generar_resumen_festival(2);
