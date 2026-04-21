CREATE TABLE public.asignaciones_camareros (
  id_asignacion integer NOT NULL DEFAULT nextval('asignaciones_camareros_id_asignacion_seq'::regclass),
  id_camarero integer NOT NULL,
  id_barra integer NOT NULL,
  fecha_inicio timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_fin timestamp with time zone,
  horas_imputadas numeric DEFAULT 0,
  CONSTRAINT asignaciones_camareros_pkey PRIMARY KEY (id_asignacion),
  CONSTRAINT asignaciones_camareros_id_camarero_fkey FOREIGN KEY (id_camarero) REFERENCES public.camareros(id_camarero),
  CONSTRAINT asignaciones_camareros_id_barra_fkey FOREIGN KEY (id_barra) REFERENCES public.barras(id_barra)
);

CREATE TABLE public.barras (
  id_barra integer NOT NULL DEFAULT nextval('barras_id_barra_seq'::regclass),
  nombre_localizacion character varying,
  estado_cola character varying,
  CONSTRAINT barras_pkey PRIMARY KEY (id_barra)
);

CREATE TABLE public.camareros (
  id_camarero integer NOT NULL DEFAULT nextval('camareros_id_camarero_seq'::regclass),
  nombre character varying NOT NULL,
  apellidos character varying,
  activo boolean DEFAULT false,
  id_barra_actual integer,
  CONSTRAINT camareros_pkey PRIMARY KEY (id_camarero),
  CONSTRAINT camareros_id_barra_actual_fkey FOREIGN KEY (id_barra_actual) REFERENCES public.barras(id_barra)
);

CREATE TABLE public.configuracion_festival (
  clave character varying NOT NULL,
  valor character varying,
  CONSTRAINT configuracion_festival_pkey PRIMARY KEY (clave)
);

CREATE TABLE public.lineas_transaccion (
  id_linea integer NOT NULL DEFAULT nextval('lineas_transaccion_id_linea_seq'::regclass),
  id_transaccion integer NOT NULL,
  id_producto integer NOT NULL,
  cantidad integer NOT NULL DEFAULT 1,
  precio_unitario numeric NOT NULL,
  CONSTRAINT lineas_transaccion_pkey PRIMARY KEY (id_linea),
  CONSTRAINT lineas_transaccion_id_transaccion_fkey FOREIGN KEY (id_transaccion) REFERENCES public.transacciones(id_transaccion),
  CONSTRAINT lineas_transaccion_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id_producto)
);

CREATE TABLE public.productos (
  id_producto integer NOT NULL DEFAULT nextval('productos_id_producto_seq'::regclass),
  id_barra integer NOT NULL,
  nombre character varying NOT NULL,
  precio numeric NOT NULL,
  categoria character varying,
  CONSTRAINT productos_pkey PRIMARY KEY (id_producto),
  CONSTRAINT productos_id_barra_fkey FOREIGN KEY (id_barra) REFERENCES public.barras(id_barra)
);

CREATE TABLE public.transacciones (
  id_transaccion integer NOT NULL DEFAULT nextval('transacciones_id_transaccion_seq'::regclass),
  id_wallet integer NOT NULL,
  id_barra integer NOT NULL,
  tipo_movimiento character varying,
  monto numeric NOT NULL,
  fecha timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT transacciones_pkey PRIMARY KEY (id_transaccion),
  CONSTRAINT fk_trans_wallet FOREIGN KEY (id_wallet) REFERENCES public.wallet(id_wallet),
  CONSTRAINT fk_trans_barras FOREIGN KEY (id_barra) REFERENCES public.barras(id_barra)
);

CREATE TABLE public.usuario (
  id_usuario integer NOT NULL DEFAULT nextval('usuario_id_usuario_seq'::regclass),
  nombre character varying,
  apellidos character varying,
  edad integer,
  correo character varying NOT NULL UNIQUE,
  telefono character varying,
  token_pago character varying,
  preferencia_musica character varying,
  preferencia_comida character varying,
  CONSTRAINT usuario_pkey PRIMARY KEY (id_usuario)
);

CREATE TABLE public.wallet (
  id_wallet integer NOT NULL DEFAULT nextval('wallet_id_wallet_seq'::regclass),
  id_usuario integer NOT NULL UNIQUE,
  saldo numeric DEFAULT 0.00,
  CONSTRAINT wallet_pkey PRIMARY KEY (id_wallet),
  CONSTRAINT fk_wallet_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario)
);
