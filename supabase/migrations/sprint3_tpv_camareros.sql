-- Nueva tabla para el registro de incidencias/alertas en las barras.

CREATE TABLE public.incidencias_barra (
  id_incidencia SERIAL,
  id_barra integer NOT NULL,
  id_camarero integer NOT NULL,
  tipo_incidencia character varying NOT NULL,
  descripcion character varying,
  fecha_reporte timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  estado character varying DEFAULT 'pendiente', -- pendiente, resuelta
  
  CONSTRAINT incidencias_barra_pkey PRIMARY KEY (id_incidencia),
  CONSTRAINT fk_incidencias_barra FOREIGN KEY (id_barra) REFERENCES public.barras(id_barra),
  CONSTRAINT fk_incidencias_camarero FOREIGN KEY (id_camarero) REFERENCES public.camareros(id_camarero)
);


