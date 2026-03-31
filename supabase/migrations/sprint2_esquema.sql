-- ==========================================
-- 1. PRODUCTOS Y VENTAS
-- ==========================================

-- Catálogo de productos asignados a cada barra
CREATE TABLE public.productos (
  id_producto SERIAL PRIMARY KEY,
  id_barra INTEGER NOT NULL REFERENCES public.barras(id_barra),
  nombre VARCHAR NOT NULL,
  precio NUMERIC NOT NULL,
  categoria VARCHAR -- ej: 'bebida', 'comida', 'merchandising'
);

-- Detalle de qué incluye cada transacción (Líneas de venta)
CREATE TABLE public.lineas_transaccion (
  id_linea SERIAL PRIMARY KEY,
  id_transaccion INTEGER NOT NULL REFERENCES public.transacciones(id_transaccion) ON DELETE CASCADE,
  id_producto INTEGER NOT NULL REFERENCES public.productos(id_producto),
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario NUMERIC NOT NULL -- Se guarda por si el precio cambia en el futuro
);


-- ==========================================
-- 2. CAMAREROS Y HORAS
-- ==========================================

-- Tabla maestra de trabajadores
CREATE TABLE public.camareros (
  id_camarero SERIAL PRIMARY KEY,
  nombre VARCHAR NOT NULL,
  apellidos VARCHAR,
  activo BOOLEAN DEFAULT false,
  id_barra_actual INTEGER REFERENCES public.barras(id_barra) -- Nulo si está descansando
);

-- Registro de horas trabajadas en cada barra
CREATE TABLE public.asignaciones_camareros (
  id_asignacion SERIAL PRIMARY KEY,
  id_camarero INTEGER NOT NULL REFERENCES public.camareros(id_camarero),
  id_barra INTEGER NOT NULL REFERENCES public.barras(id_barra),
  fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  fecha_fin TIMESTAMP WITH TIME ZONE, -- Se rellenará cuando se le quite de la barra
  horas_imputadas NUMERIC DEFAULT 0 -- Puedes usar esta columna para forzar "+1 hora" como decías en el PDF
);


-- ==========================================
-- 3. PREFERENCIAS Y CONFIGURACIÓN
-- ==========================================

-- Añadir preferencias a la tabla existente de usuarios
ALTER TABLE public.usuario 
ADD COLUMN preferencia_musica VARCHAR, -- ej: 'Indie', 'Rock', 'Electrónica'
ADD COLUMN preferencia_comida VARCHAR; -- ej: 'Hamburguesa', 'Vegano'

-- Tabla de valor único para el estado actual del festival
CREATE TABLE public.configuracion_festival (
  clave VARCHAR PRIMARY KEY, -- ej: 'musica_sonando_actualmente'
  valor VARCHAR              -- ej: 'Indie'
);