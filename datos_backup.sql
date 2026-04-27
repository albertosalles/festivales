SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict d4vKkoJjpfLyffdbGX31Goc80ibBIBSILM3hYOnK1epd0PBBh2dyLQUKSxu2Zmf

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: barras; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."barras" ("id_barra", "nombre_localizacion", "estado_cola") VALUES
	(3, 'Food Truck Hamburguesas', 'baja'),
	(2, 'Barra Escenario Indie', 'baja'),
	(4, 'Food Truck Vegano', 'baja'),
	(1, 'Barra Escenario Principal', 'alta'),
	(5, 'Barra Zona VIP', 'baja');


--
-- Data for Name: camareros; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."camareros" ("id_camarero", "nombre", "apellidos", "activo", "id_barra_actual") VALUES
	(1, 'Jorge', NULL, true, NULL),
	(2, 'Laura', NULL, true, NULL);


--
-- Data for Name: asignaciones_camareros; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."asignaciones_camareros" ("id_asignacion", "id_camarero", "id_barra", "fecha_inicio", "fecha_fin", "horas_imputadas") VALUES
	(21, 1, 2, '2026-04-21 17:49:16.769189+00', '2026-04-23 12:13:33.815+00', 42.4),
	(22, 1, 4, '2026-04-23 12:13:34.094908+00', '2026-04-23 12:22:39.493+00', 0.15),
	(23, 1, 4, '2026-04-23 12:22:39.662319+00', '2026-04-23 12:24:51.72+00', 0.04),
	(25, 2, 4, '2026-04-23 13:39:28.257205+00', '2026-04-23 13:42:51.252+00', 0.06),
	(27, 2, 3, '2026-04-23 13:42:51.486146+00', '2026-04-23 13:55:32.039+00', 0.21),
	(28, 2, 4, '2026-04-23 13:55:32.252653+00', '2026-04-23 13:56:04.376+00', 0.01),
	(26, 1, 3, '2026-04-23 13:42:08.974001+00', '2026-04-23 14:04:56.812+00', 0.38),
	(29, 1, 3, '2026-04-23 14:04:57.008947+00', '2026-04-23 14:14:03.405+00', 0.15),
	(30, 1, 4, '2026-04-23 14:14:03.587569+00', '2026-04-23 16:47:18.197+00', 2.55),
	(32, 1, 2, '2026-04-23 16:47:18.417996+00', '2026-04-23 16:47:51.091+00', 0.01),
	(31, 2, 3, '2026-04-23 14:19:58.853132+00', '2026-04-23 16:48:26.053+00', 2.47),
	(33, 2, 3, '2026-04-23 16:48:26.210537+00', '2026-04-23 16:48:28.994+00', 0),
	(34, 2, 2, '2026-04-24 07:34:25.893859+00', '2026-04-24 07:36:27.899+00', 0.03),
	(35, 2, 5, '2026-04-24 07:53:12.9243+00', '2026-04-24 07:54:00.141+00', 0.01),
	(38, 2, 3, '2026-04-24 07:58:45.685573+00', '2026-04-24 07:59:32.925+00', 0),
	(37, 1, 3, '2026-04-24 07:58:29.918636+00', '2026-04-24 07:59:34.134+00', 0),
	(40, 2, 4, '2026-04-25 19:29:25.634734+00', '2026-04-25 19:31:36.618+00', 0),
	(39, 1, 3, '2026-04-25 16:33:31.19771+00', '2026-04-25 19:31:38.38+00', 0),
	(41, 1, 1, '2026-04-27 07:17:17.14111+00', '2026-04-27 07:28:25.066+00', 0.19),
	(42, 1, 3, '2026-04-27 07:28:25.300599+00', '2026-04-27 07:34:27.891+00', 0.1),
	(43, 1, 1, '2026-04-27 07:34:28.170194+00', '2026-04-27 07:35:12.479+00', 0.01),
	(44, 2, 3, '2026-04-27 17:17:00.255657+00', '2026-04-27 18:37:55.551+00', 0),
	(1, 1, 1, '2026-03-31 20:06:24.192998+00', '2026-03-31 20:11:13.916+00', 0),
	(3, 1, 2, '2026-03-31 20:23:56.521909+00', '2026-03-31 20:29:09.795+00', 0),
	(2, 2, 1, '2026-03-31 20:07:46.164835+00', '2026-04-01 06:55:44.356+00', 0),
	(4, 1, 2, '2026-04-01 06:54:35.383198+00', '2026-04-01 06:56:08.509+00', 0),
	(5, 2, 5, '2026-04-01 06:55:44.548198+00', '2026-04-01 06:56:10.639+00', 0),
	(7, 2, 2, '2026-04-01 14:39:17.701748+00', '2026-04-01 14:40:10.041+00', 0),
	(6, 1, 2, '2026-04-01 14:33:53.308578+00', '2026-04-01 14:40:11.219+00', 0),
	(8, 1, 4, '2026-04-20 14:42:36.772609+00', '2026-04-20 14:42:37.277+00', 0),
	(9, 1, 4, '2026-04-20 14:43:17.094243+00', '2026-04-20 14:43:18.411+00', 0),
	(10, 1, 4, '2026-04-20 18:06:02.770852+00', '2026-04-20 18:06:03.107+00', 0);


--
-- Data for Name: configuracion_festival; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."configuracion_festival" ("clave", "valor") VALUES
	('musica_sonando_actualmente', 'Techno');


--
-- Data for Name: incidencias_barra; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."incidencias_barra" ("id_incidencia", "id_barra", "id_camarero", "tipo_incidencia", "descripcion", "fecha_reporte", "estado") VALUES
	(1, 4, 1, 'stock', '', '2026-04-21 19:13:28.12944+00', 'pendiente'),
	(5, 4, 1, 'stock', '', '2026-04-23 12:13:41.474722+00', 'pendiente'),
	(6, 3, 2, 'limpieza', '', '2026-04-23 14:21:25.969918+00', 'pendiente'),
	(8, 5, 2, 'soporte', '', '2026-04-24 07:53:22.59604+00', 'pendiente'),
	(9, 4, 2, 'seguridad', '', '2026-04-25 19:31:12.919846+00', 'pendiente'),
	(7, 3, 2, 'seguridad', 'Dos chavales se están liando a palos', '2026-04-23 14:21:54.185413+00', 'pendiente'),
	(10, 1, 1, 'soporte', 'Aiuda (por favor)', '2026-04-27 07:35:06.666171+00', 'pendiente');


--
-- Data for Name: productos; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."productos" ("id_producto", "id_barra", "nombre", "precio", "categoria") VALUES
	(1, 1, 'Agua', 2.50, 'Bebida'),
	(2, 1, 'Coca-Cola', 3.50, 'Bebida'),
	(3, 1, 'Cerveza', 5.00, 'Bebida'),
	(4, 2, 'Agua', 2.50, 'Bebida'),
	(5, 2, 'Coca-Cola', 3.50, 'Bebida'),
	(6, 2, 'Cerveza', 5.00, 'Bebida'),
	(7, 5, 'Agua', 2.50, 'Bebida'),
	(8, 5, 'Coca-Cola', 3.50, 'Bebida'),
	(9, 5, 'Cerveza', 5.00, 'Bebida'),
	(10, 3, 'Doble', 9.50, 'Comida'),
	(11, 3, 'Triple', 12.50, 'Comida'),
	(12, 3, 'Patatas', 4.00, 'Comida'),
	(13, 4, 'Poke de frutas', 8.50, 'Comida'),
	(14, 4, 'Poke de verduras', 8.50, 'Comida');


--
-- Data for Name: usuario; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."usuario" ("id_usuario", "nombre", "apellidos", "edad", "correo", "telefono", "token_pago", "preferencia_musica", "preferencia_comida") VALUES
	(2, 'Carlos', 'López', 30, 'carlos@email.com', '600987654', 'tok_3C4D', NULL, NULL),
	(3, 'Lucía', 'Martínez', 22, 'lucia@email.com', '611222333', 'tok_5E6F', NULL, NULL),
	(4, 'Jorge', 'Díaz', 28, 'jorge@email.com', '622333444', NULL, NULL, NULL),
	(5, 'Marta', 'Sánchez', 19, 'marta@email.com', '633444555', 'tok_7G8H', NULL, NULL),
	(6, 'David', 'Pérez', 35, 'david@email.com', '644555666', 'tok_9I0J', NULL, NULL),
	(7, 'Elena', 'Gómez', 27, 'elena@email.com', '655666777', NULL, NULL, NULL),
	(8, 'Pablo', 'Ruiz', 24, 'pablo@email.com', '666777888', 'tok_1K2L', NULL, NULL),
	(9, 'Laura', 'Alonso', 21, 'laura@email.com', '677888999', 'tok_3M4N', NULL, NULL),
	(10, 'Mario', 'Torres', 29, 'mario@email.com', '688999000', 'tok_5O6P', NULL, NULL),
	(1, 'Ana', 'García', 25, 'ana@email.com', '600123456', 'tok_1A2B', 'Techno', 'Vegano');


--
-- Data for Name: wallet; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."wallet" ("id_wallet", "id_usuario", "saldo") VALUES
	(1, 1, 468.50),
	(2, 2, 5.00),
	(3, 3, 120.00),
	(4, 4, 0.00),
	(5, 5, 15.50),
	(6, 6, 60.00),
	(7, 7, 2.50),
	(8, 8, 30.00),
	(9, 9, 8.00),
	(10, 10, 55.00);


--
-- Data for Name: transacciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."transacciones" ("id_transaccion", "id_wallet", "id_barra", "tipo_movimiento", "monto", "fecha") VALUES
	(27, 1, 2, 'compra', 5.00, '2026-04-21 09:34:39.418876+00'),
	(33, 1, 3, 'compra', 16.50, '2026-04-23 13:36:08.003922+00'),
	(39, 1, 5, 'compra', 11.00, '2026-04-24 07:53:40.245365+00'),
	(28, 1, 2, 'compra', 7.50, '2026-04-21 09:36:39.114625+00'),
	(34, 1, 4, 'compra', 17.00, '2026-04-23 13:39:43.49744+00'),
	(40, 1, 5, 'compra', 7.50, '2026-04-25 16:32:52.582409+00'),
	(29, 1, 1, 'compra', 3.50, '2026-04-21 18:03:06.809249+00'),
	(35, 1, 3, 'compra', 22.00, '2026-04-23 13:42:59.546613+00'),
	(41, 1, 3, 'compra', 13.50, '2026-04-25 16:33:43.359146+00'),
	(30, 1, 4, 'compra', 17.00, '2026-04-21 19:13:16.411326+00'),
	(36, 1, 4, 'compra', 8.50, '2026-04-23 13:55:56.907803+00'),
	(42, 1, 3, 'compra', 13.50, '2026-04-25 19:14:33.564155+00'),
	(31, 1, 3, 'compra', 22.00, '2026-04-21 19:33:37.576056+00'),
	(37, 1, 4, 'compra', 8.50, '2026-04-23 14:04:10.862404+00'),
	(43, 1, 4, 'compra', 8.50, '2026-04-25 19:30:08.393377+00'),
	(1, 1, 1, 'pago_bebida', 8.50, '2026-02-28 16:30:36.729264+00'),
	(2, 1, 3, 'pago_comida', 12.00, '2026-02-28 16:30:36.729264+00'),
	(3, 3, 1, 'pago_bebida', 17.00, '2026-02-28 16:30:36.729264+00'),
	(4, 3, 5, 'pago_bebida', 10.00, '2026-02-28 16:30:36.729264+00'),
	(5, 5, 2, 'pago_bebida', 6.50, '2026-02-28 16:30:36.729264+00'),
	(6, 6, 4, 'pago_comida', 14.00, '2026-02-28 16:30:36.729264+00'),
	(7, 8, 1, 'pago_bebida', 8.50, '2026-02-28 16:30:36.729264+00'),
	(8, 10, 3, 'pago_comida', 15.00, '2026-02-28 16:30:36.729264+00'),
	(9, 2, 2, 'pago_bebida', 6.50, '2026-02-28 16:30:36.729264+00'),
	(10, 9, 2, 'pago_bebida', 6.50, '2026-02-28 16:30:36.729264+00'),
	(11, 7, 4, 'pago_comida', 12.50, '2026-02-28 16:30:36.729264+00'),
	(12, 1, 1, 'recarga', 50.00, '2026-02-28 16:30:36.729264+00'),
	(13, 3, 5, 'recarga', 100.00, '2026-02-28 16:30:36.729264+00'),
	(14, 6, 1, 'pago_bebida', 8.50, '2026-02-28 16:30:36.729264+00'),
	(15, 6, 1, 'pago_bebida', 8.50, '2026-02-28 16:30:36.729264+00'),
	(16, 1, 2, 'compra', 2.50, '2026-03-31 18:55:38.851672+00'),
	(17, 1, 1, 'compra', 10.00, '2026-03-31 18:57:01.660103+00'),
	(18, 1, 4, 'compra', 8.50, '2026-03-31 18:57:44.481104+00'),
	(19, 1, 1, 'compra', 5.00, '2026-03-31 20:08:57.66368+00'),
	(20, 1, 3, 'compra', 16.50, '2026-03-31 20:10:41.182701+00'),
	(21, 1, 4, 'compra', 8.50, '2026-03-31 20:41:21.282218+00'),
	(22, 1, 3, 'compra', 16.50, '2026-04-02 06:57:15.434726+00'),
	(23, 1, 3, 'compra', 13.50, '2026-04-16 17:45:35.533513+00'),
	(32, 1, 4, 'compra', 8.50, '2026-04-23 12:22:57.464992+00'),
	(38, 1, 2, 'compra', 8.50, '2026-04-24 07:35:15.870172+00'),
	(44, 1, 3, 'compra', 13.50, '2026-04-27 17:17:18.130381+00');


--
-- Data for Name: lineas_transaccion; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."lineas_transaccion" ("id_linea", "id_transaccion", "id_producto", "cantidad", "precio_unitario") VALUES
	(12, 27, 6, 1, 5),
	(21, 33, 12, 1, 4),
	(22, 33, 11, 1, 12.5),
	(31, 39, 7, 1, 2.5),
	(32, 39, 9, 1, 5),
	(33, 39, 8, 1, 3.5),
	(13, 28, 4, 1, 2.5),
	(14, 28, 6, 1, 5),
	(23, 34, 13, 1, 8.5),
	(24, 34, 14, 1, 8.5),
	(34, 40, 7, 1, 2.5),
	(35, 40, 9, 1, 5),
	(15, 29, 2, 1, 3.5),
	(25, 35, 10, 1, 9.5),
	(26, 35, 11, 1, 12.5),
	(36, 41, 10, 1, 9.5),
	(37, 41, 12, 1, 4),
	(16, 30, 13, 1, 8.5),
	(17, 30, 14, 1, 8.5),
	(27, 36, 14, 1, 8.5),
	(38, 42, 10, 1, 9.5),
	(39, 42, 12, 1, 4),
	(18, 31, 10, 1, 9.5),
	(19, 31, 11, 1, 12.5),
	(28, 37, 14, 1, 8.5),
	(40, 43, 13, 1, 8.5),
	(20, 32, 13, 1, 8.5),
	(29, 38, 6, 1, 5),
	(30, 38, 5, 1, 3.5),
	(41, 44, 10, 1, 9.5),
	(42, 44, 12, 1, 4),
	(1, 16, 4, 1, 2.5),
	(2, 17, 3, 2, 5),
	(3, 18, 14, 1, 8.5),
	(4, 19, 1, 2, 2.5),
	(5, 20, 11, 1, 12.5),
	(6, 20, 12, 1, 4),
	(7, 21, 14, 1, 8.5),
	(8, 22, 11, 1, 12.5),
	(9, 22, 12, 1, 4),
	(10, 23, 10, 1, 9.5),
	(11, 23, 12, 1, 4);


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1, false);


--
-- Name: asignaciones_camareros_id_asignacion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."asignaciones_camareros_id_asignacion_seq"', 44, true);


--
-- Name: barras_id_barra_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."barras_id_barra_seq"', 5, true);


--
-- Name: camareros_id_camarero_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."camareros_id_camarero_seq"', 2, true);


--
-- Name: incidencias_barra_id_incidencia_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."incidencias_barra_id_incidencia_seq"', 10, true);


--
-- Name: lineas_transaccion_id_linea_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."lineas_transaccion_id_linea_seq"', 42, true);


--
-- Name: productos_id_producto_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."productos_id_producto_seq"', 14, true);


--
-- Name: transacciones_id_transaccion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."transacciones_id_transaccion_seq"', 44, true);


--
-- Name: usuario_id_usuario_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."usuario_id_usuario_seq"', 10, true);


--
-- Name: wallet_id_wallet_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."wallet_id_wallet_seq"', 10, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict d4vKkoJjpfLyffdbGX31Goc80ibBIBSILM3hYOnK1epd0PBBh2dyLQUKSxu2Zmf

RESET ALL;
