--
-- PostgreSQL database dump
--

\restrict siyrepILP9GS5LiRYQE7sSYV1mfb066gyDN5dYMuq0VW0OecKpmNnGfGBQbPRdL

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

-- Started on 2026-05-11 09:08:27

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
-- SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 219 (class 1259 OID 16390)
-- Name: chat; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat (
    id integer NOT NULL,
    proyecto_id integer NOT NULL
);


ALTER TABLE public.chat OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16395)
-- Name: chat_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.chat ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.chat_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 221 (class 1259 OID 16396)
-- Name: empresa; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.empresa (
    id smallint NOT NULL,
    nombre character varying(150) NOT NULL,
    descripcion character varying(250),
    num_empleados integer,
    portafolio character varying(250),
    documento_url text,
    logo_url text,
    fecha_registro date DEFAULT ('now'::text)::date NOT NULL,
    estado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    fecha_aprobacion date
);


ALTER TABLE public.empresa OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16407)
-- Name: empresa_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.empresa ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.empresa_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: empresa_imagen; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.empresa_imagen (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    url text NOT NULL
);


ALTER TABLE public.empresa_imagen OWNER TO postgres;

--
-- Name: empresa_imagen_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.empresa_imagen ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.empresa_imagen_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: empresa_enlace; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.empresa_enlace (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    url text NOT NULL,
    nombre character varying(100)
);


ALTER TABLE public.empresa_enlace OWNER TO postgres;

--
-- Name: empresa_enlace_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.empresa_enlace ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.empresa_enlace_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 223 (class 1259 OID 16408)
-- Name: kanban_columna; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kanban_columna (
    id integer NOT NULL,
    proyecto_id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    orden integer NOT NULL
);


ALTER TABLE public.kanban_columna OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16415)
-- Name: kanban_columna_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.kanban_columna ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.kanban_columna_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 225 (class 1259 OID 16416)
-- Name: mensaje; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mensaje (
    id integer NOT NULL,
    chat_id integer NOT NULL,
    usuario_id integer NOT NULL,
    contenido text,
    archivo_url text,
    fecha timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.mensaje OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16425)
-- Name: mensaje_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.mensaje ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.mensaje_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 227 (class 1259 OID 16426)
-- Name: proyecto; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.proyecto (
    id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    descripcion_corta character varying(250),
    descripcion_completa text,
    fecha_inicio date,
    fecha_fin date,
    financiamiento numeric(12,2),
    documento_url text,
    creador_id integer NOT NULL,
    categoria character varying(100) DEFAULT 'Tecnología'::character varying NOT NULL,
    estado character varying(20) DEFAULT 'en_curso'::character varying NOT NULL,
    suspendido boolean DEFAULT false
);


ALTER TABLE public.proyecto OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16433)
-- Name: proyecto_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.proyecto ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.proyecto_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 229 (class 1259 OID 16434)
-- Name: proyecto_imagen; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.proyecto_imagen (
    id integer NOT NULL,
    proyecto_id integer NOT NULL,
    url text NOT NULL
);


ALTER TABLE public.proyecto_imagen OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16442)
-- Name: proyecto_imagen_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.proyecto_imagen ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.proyecto_imagen_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 231 (class 1259 OID 16443)
-- Name: recurso; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recurso (
    id integer NOT NULL,
    proyecto_id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    tipo character varying(10) NOT NULL,
    url text,
    padre_id integer,
    fecha_creacion timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.recurso OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 16454)
-- Name: recurso_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.recurso ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.recurso_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 239 (class 1259 OID 16584)
-- Name: solicitud_membresia; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.solicitud_membresia (
    id integer NOT NULL,
    empresa_id smallint NOT NULL,
    usuario_id integer NOT NULL,
    documento_url text,
    estado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.solicitud_membresia OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 16583)
-- Name: solicitud_membresia_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.solicitud_membresia ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.solicitud_membresia_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 241 (class 1259 OID 16609)
-- Name: solicitud_proyecto; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.solicitud_proyecto (
    id integer NOT NULL,
    proyecto_id integer NOT NULL,
    usuario_id integer NOT NULL,
    mensaje text,
    estado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.solicitud_proyecto OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 16608)
-- Name: solicitud_proyecto_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.solicitud_proyecto ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.solicitud_proyecto_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 233 (class 1259 OID 16455)
-- Name: tarea; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tarea (
    id integer NOT NULL,
    proyecto_id integer NOT NULL,
    columna_id integer NOT NULL,
    titulo character varying(150) NOT NULL,
    descripcion text,
    prioridad character varying(10) NOT NULL,
    fecha_limite date,
    orden integer NOT NULL
);


ALTER TABLE public.tarea OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 16634)
-- Name: tarea_comentario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tarea_comentario (
    id integer NOT NULL,
    tarea_id integer NOT NULL,
    usuario_id integer NOT NULL,
    texto text NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tarea_comentario OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 16633)
-- Name: tarea_comentario_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.tarea_comentario ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.tarea_comentario_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 234 (class 1259 OID 16467)
-- Name: tarea_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.tarea ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.tarea_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 244 (class 1259 OID 16738)
-- Name: tarea_usuario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tarea_usuario (
    tarea_id integer NOT NULL,
    usuario_id integer NOT NULL
);


ALTER TABLE public.tarea_usuario OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 16468)
-- Name: usuario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuario (
    id integer NOT NULL,
    nombre_completo character varying(150) NOT NULL,
    cargo character varying(100),
    correo character varying(150) NOT NULL,
    password text NOT NULL,
    documento_url text,
    foto_url text,
    rol character varying(20) NOT NULL,
    empresa_id smallint,
    fecha_registro date DEFAULT ('now'::text)::date NOT NULL,
    estado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL
);


ALTER TABLE public.usuario OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 16484)
-- Name: usuario_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.usuario ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.usuario_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 237 (class 1259 OID 16485)
-- Name: usuario_proyecto; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuario_proyecto (
    usuario_id integer NOT NULL,
    proyecto_id integer NOT NULL,
    rol character varying(20) NOT NULL
);


ALTER TABLE public.usuario_proyecto OWNER TO postgres;

--
-- TOC entry 5135 (class 0 OID 16390)
-- Dependencies: 219
-- Data for Name: chat; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5137 (class 0 OID 16396)
-- Dependencies: 221
-- Data for Name: empresa; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5139 (class 0 OID 16408)
-- Dependencies: 223
-- Data for Name: kanban_columna; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5141 (class 0 OID 16416)
-- Dependencies: 225
-- Data for Name: mensaje; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5143 (class 0 OID 16426)
-- Dependencies: 227
-- Data for Name: proyecto; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5145 (class 0 OID 16434)
-- Dependencies: 229
-- Data for Name: proyecto_imagen; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5147 (class 0 OID 16443)
-- Dependencies: 231
-- Data for Name: recurso; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5155 (class 0 OID 16584)
-- Dependencies: 239
-- Data for Name: solicitud_membresia; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5157 (class 0 OID 16609)
-- Dependencies: 241
-- Data for Name: solicitud_proyecto; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5149 (class 0 OID 16455)
-- Dependencies: 233
-- Data for Name: tarea; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5159 (class 0 OID 16634)
-- Dependencies: 243
-- Data for Name: tarea_comentario; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5160 (class 0 OID 16738)
-- Dependencies: 244
-- Data for Name: tarea_usuario; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5151 (class 0 OID 16468)
-- Dependencies: 235
-- Data for Name: usuario; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5153 (class 0 OID 16485)
-- Dependencies: 237
-- Data for Name: usuario_proyecto; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5166 (class 0 OID 0)
-- Dependencies: 220
-- Name: chat_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chat_id_seq', 16, true);


--
-- TOC entry 5167 (class 0 OID 0)
-- Dependencies: 222
-- Name: empresa_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.empresa_id_seq', 9, true);


--
-- TOC entry 5168 (class 0 OID 0)
-- Dependencies: 224
-- Name: kanban_columna_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.kanban_columna_id_seq', 48, true);


--
-- TOC entry 5169 (class 0 OID 0)
-- Dependencies: 226
-- Name: mensaje_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mensaje_id_seq', 12, true);


--
-- TOC entry 5170 (class 0 OID 0)
-- Dependencies: 228
-- Name: proyecto_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.proyecto_id_seq', 16, true);


--
-- TOC entry 5171 (class 0 OID 0)
-- Dependencies: 230
-- Name: proyecto_imagen_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.proyecto_imagen_id_seq', 19, true);


--
-- TOC entry 5172 (class 0 OID 0)
-- Dependencies: 232
-- Name: recurso_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recurso_id_seq', 54, true);


--
-- TOC entry 5173 (class 0 OID 0)
-- Dependencies: 238
-- Name: solicitud_membresia_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.solicitud_membresia_id_seq', 4, true);


--
-- TOC entry 5174 (class 0 OID 0)
-- Dependencies: 240
-- Name: solicitud_proyecto_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.solicitud_proyecto_id_seq', 8, true);


--
-- TOC entry 5175 (class 0 OID 0)
-- Dependencies: 242
-- Name: tarea_comentario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tarea_comentario_id_seq', 2, true);


--
-- TOC entry 5176 (class 0 OID 0)
-- Dependencies: 234
-- Name: tarea_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tarea_id_seq', 7, true);


--
-- TOC entry 5177 (class 0 OID 0)
-- Dependencies: 236
-- Name: usuario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuario_id_seq', 14, true);


--
-- TOC entry 4934 (class 2606 OID 16493)
-- Name: chat chat_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat
    ADD CONSTRAINT chat_pkey PRIMARY KEY (id);


--
-- TOC entry 4936 (class 2606 OID 16495)
-- Name: chat chat_proyecto_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat
    ADD CONSTRAINT chat_proyecto_id_key UNIQUE (proyecto_id);


--
-- TOC entry 4938 (class 2606 OID 16497)
-- Name: empresa empresa_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresa
    ADD CONSTRAINT empresa_pkey PRIMARY KEY (id);


--
-- Name: empresa_imagen empresa_imagen_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresa_imagen
    ADD CONSTRAINT empresa_imagen_pkey PRIMARY KEY (id);


--
-- Name: empresa_enlace empresa_enlace_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresa_enlace
    ADD CONSTRAINT empresa_enlace_pkey PRIMARY KEY (id);


--
-- TOC entry 4940 (class 2606 OID 16499)
-- Name: kanban_columna kanban_columna_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kanban_columna
    ADD CONSTRAINT kanban_columna_pkey PRIMARY KEY (id);


--
-- TOC entry 4942 (class 2606 OID 16501)
-- Name: mensaje mensaje_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mensaje
    ADD CONSTRAINT mensaje_pkey PRIMARY KEY (id);


--
-- TOC entry 4946 (class 2606 OID 16503)
-- Name: proyecto_imagen proyecto_imagen_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyecto_imagen
    ADD CONSTRAINT proyecto_imagen_pkey PRIMARY KEY (id);


--
-- TOC entry 4944 (class 2606 OID 16505)
-- Name: proyecto proyecto_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyecto
    ADD CONSTRAINT proyecto_pkey PRIMARY KEY (id);


--
-- TOC entry 4948 (class 2606 OID 16507)
-- Name: recurso recurso_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurso
    ADD CONSTRAINT recurso_pkey PRIMARY KEY (id);


--
-- TOC entry 4958 (class 2606 OID 16597)
-- Name: solicitud_membresia solicitud_membresia_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud_membresia
    ADD CONSTRAINT solicitud_membresia_pkey PRIMARY KEY (id);


--
-- TOC entry 4960 (class 2606 OID 16622)
-- Name: solicitud_proyecto solicitud_proyecto_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud_proyecto
    ADD CONSTRAINT solicitud_proyecto_pkey PRIMARY KEY (id);


--
-- TOC entry 4962 (class 2606 OID 16645)
-- Name: tarea_comentario tarea_comentario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tarea_comentario
    ADD CONSTRAINT tarea_comentario_pkey PRIMARY KEY (id);


--
-- TOC entry 4950 (class 2606 OID 16509)
-- Name: tarea tarea_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tarea
    ADD CONSTRAINT tarea_pkey PRIMARY KEY (id);


--
-- TOC entry 4966 (class 2606 OID 16744)
-- Name: tarea_usuario tarea_usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tarea_usuario
    ADD CONSTRAINT tarea_usuario_pkey PRIMARY KEY (tarea_id, usuario_id);


--
-- TOC entry 4952 (class 2606 OID 16511)
-- Name: usuario usuario_correo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_correo_key UNIQUE (correo);


--
-- TOC entry 4954 (class 2606 OID 16513)
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (id);


--
-- TOC entry 4956 (class 2606 OID 16515)
-- Name: usuario_proyecto usuario_proyecto_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario_proyecto
    ADD CONSTRAINT usuario_proyecto_pkey PRIMARY KEY (usuario_id, proyecto_id);


--
-- TOC entry 4963 (class 1259 OID 16770)
-- Name: IDX_38812119d056a7b76ddeade2e5; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_38812119d056a7b76ddeade2e5" ON public.tarea_usuario USING btree (usuario_id);


--
-- TOC entry 4964 (class 1259 OID 16769)
-- Name: IDX_43da450f4230d23b655a2704e5; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_43da450f4230d23b655a2704e5" ON public.tarea_usuario USING btree (tarea_id);


--
-- TOC entry 4969 (class 2606 OID 16781)
-- Name: mensaje FK_07a3dfdc233017738e897c0f46e; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mensaje
    ADD CONSTRAINT "FK_07a3dfdc233017738e897c0f46e" FOREIGN KEY (usuario_id) REFERENCES public.usuario(id);


--
-- TOC entry 4975 (class 2606 OID 16801)
-- Name: tarea FK_219914b2833a4aeb847ace14f2b; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tarea
    ADD CONSTRAINT "FK_219914b2833a4aeb847ace14f2b" FOREIGN KEY (proyecto_id) REFERENCES public.proyecto(id) ON DELETE CASCADE;


--
-- TOC entry 4972 (class 2606 OID 16771)
-- Name: proyecto_imagen FK_28735ab707fdf5a41e2f1000d84; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyecto_imagen
    ADD CONSTRAINT "FK_28735ab707fdf5a41e2f1000d84" FOREIGN KEY (proyecto_id) REFERENCES public.proyecto(id) ON DELETE CASCADE;


--
-- Name: empresa_imagen empresa_imagen_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresa_imagen
    ADD CONSTRAINT empresa_imagen_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresa(id) ON DELETE CASCADE;


--
-- Name: empresa_enlace empresa_enlace_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresa_enlace
    ADD CONSTRAINT empresa_enlace_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresa(id) ON DELETE CASCADE;


--
-- TOC entry 4986 (class 2606 OID 16871)
-- Name: tarea_usuario FK_38812119d056a7b76ddeade2e56; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tarea_usuario
    ADD CONSTRAINT "FK_38812119d056a7b76ddeade2e56" FOREIGN KEY (usuario_id) REFERENCES public.usuario(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4978 (class 2606 OID 16831)
-- Name: usuario_proyecto FK_40d78b7745706189303e5e3f2cb; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario_proyecto
    ADD CONSTRAINT "FK_40d78b7745706189303e5e3f2cb" FOREIGN KEY (usuario_id) REFERENCES public.usuario(id) ON DELETE CASCADE;


--
-- TOC entry 4987 (class 2606 OID 16866)
-- Name: tarea_usuario FK_43da450f4230d23b655a2704e5e; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tarea_usuario
    ADD CONSTRAINT "FK_43da450f4230d23b655a2704e5e" FOREIGN KEY (tarea_id) REFERENCES public.tarea(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4980 (class 2606 OID 16846)
-- Name: solicitud_membresia FK_52f47c4eb6d30c3dbd250ccc76f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud_membresia
    ADD CONSTRAINT "FK_52f47c4eb6d30c3dbd250ccc76f" FOREIGN KEY (empresa_id) REFERENCES public.empresa(id) ON DELETE CASCADE;


--
-- TOC entry 4967 (class 2606 OID 16786)
-- Name: chat FK_56e8b52a46f525be014150aff0e; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat
    ADD CONSTRAINT "FK_56e8b52a46f525be014150aff0e" FOREIGN KEY (proyecto_id) REFERENCES public.proyecto(id) ON DELETE CASCADE;


--
-- TOC entry 4973 (class 2606 OID 16821)
-- Name: recurso FK_7b214a1eac7048b2198ac3642e0; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurso
    ADD CONSTRAINT "FK_7b214a1eac7048b2198ac3642e0" FOREIGN KEY (padre_id) REFERENCES public.recurso(id) ON DELETE CASCADE;


--
-- TOC entry 4976 (class 2606 OID 16806)
-- Name: tarea FK_7ba99d8612143649b7682857750; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tarea
    ADD CONSTRAINT "FK_7ba99d8612143649b7682857750" FOREIGN KEY (columna_id) REFERENCES public.kanban_columna(id) ON DELETE CASCADE;


--
-- TOC entry 4968 (class 2606 OID 16811)
-- Name: kanban_columna FK_84b4013903e4f5bb8e5cae57387; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kanban_columna
    ADD CONSTRAINT "FK_84b4013903e4f5bb8e5cae57387" FOREIGN KEY (proyecto_id) REFERENCES public.proyecto(id) ON DELETE CASCADE;


--
-- TOC entry 4981 (class 2606 OID 16851)
-- Name: solicitud_membresia FK_a3c1e223b2d93a883a6a6add3b3; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud_membresia
    ADD CONSTRAINT "FK_a3c1e223b2d93a883a6a6add3b3" FOREIGN KEY (usuario_id) REFERENCES public.usuario(id) ON DELETE CASCADE;


--
-- TOC entry 4974 (class 2606 OID 16816)
-- Name: recurso FK_ad5aae651e2d47788c2dbcd1b7e; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurso
    ADD CONSTRAINT "FK_ad5aae651e2d47788c2dbcd1b7e" FOREIGN KEY (proyecto_id) REFERENCES public.proyecto(id) ON DELETE CASCADE;


--
-- TOC entry 4984 (class 2606 OID 16791)
-- Name: tarea_comentario FK_c01f49dc1536ce65bfc820ede25; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tarea_comentario
    ADD CONSTRAINT "FK_c01f49dc1536ce65bfc820ede25" FOREIGN KEY (tarea_id) REFERENCES public.tarea(id) ON DELETE CASCADE;


--
-- TOC entry 4979 (class 2606 OID 16836)
-- Name: usuario_proyecto FK_c49f3a8591e6589d43097eb4c0a; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario_proyecto
    ADD CONSTRAINT "FK_c49f3a8591e6589d43097eb4c0a" FOREIGN KEY (proyecto_id) REFERENCES public.proyecto(id) ON DELETE CASCADE;


--
-- TOC entry 4971 (class 2606 OID 16826)
-- Name: proyecto FK_ca5061501d5f11ede2a60bb65cd; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyecto
    ADD CONSTRAINT "FK_ca5061501d5f11ede2a60bb65cd" FOREIGN KEY (creador_id) REFERENCES public.usuario(id);


--
-- TOC entry 4982 (class 2606 OID 16861)
-- Name: solicitud_proyecto FK_e3e7fc45d0f69640137b8deb29c; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud_proyecto
    ADD CONSTRAINT "FK_e3e7fc45d0f69640137b8deb29c" FOREIGN KEY (usuario_id) REFERENCES public.usuario(id) ON DELETE CASCADE;


--
-- TOC entry 4970 (class 2606 OID 16776)
-- Name: mensaje FK_e5ae16e19a899181e1bb81c532a; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mensaje
    ADD CONSTRAINT "FK_e5ae16e19a899181e1bb81c532a" FOREIGN KEY (chat_id) REFERENCES public.chat(id) ON DELETE CASCADE;


--
-- TOC entry 4985 (class 2606 OID 16796)
-- Name: tarea_comentario FK_ea37f247b74b82c46c4e5ee4d27; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tarea_comentario
    ADD CONSTRAINT "FK_ea37f247b74b82c46c4e5ee4d27" FOREIGN KEY (usuario_id) REFERENCES public.usuario(id);


--
-- TOC entry 4983 (class 2606 OID 16856)
-- Name: solicitud_proyecto FK_f2260b60e74c05b1eb3048f364e; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud_proyecto
    ADD CONSTRAINT "FK_f2260b60e74c05b1eb3048f364e" FOREIGN KEY (proyecto_id) REFERENCES public.proyecto(id) ON DELETE CASCADE;


--
-- TOC entry 4977 (class 2606 OID 16841)
-- Name: usuario FK_f3ec4943ff70f8567cf5e63182c; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT "FK_f3ec4943ff70f8567cf5e63182c" FOREIGN KEY (empresa_id) REFERENCES public.empresa(id);


-- Completed on 2026-05-11 09:08:28

--
-- PostgreSQL database dump complete
--

\unrestrict siyrepILP9GS5LiRYQE7sSYV1mfb066gyDN5dYMuq0VW0OecKpmNnGfGBQbPRdL


--
-- Seed Superadmin User
--
INSERT INTO public.usuario (nombre_completo, cargo, correo, password, rol, estado, fecha_registro) 
VALUES (
  'Super Administrador', 
  'Director de Plataforma', 
  'admin@platform.com', 
  '$2a$10$vBrGp1CU3MiI7Jlx5KzNCuDYwnUOsPrvZ8Ftg.YmBqRljDBgG6enC', 
  'superadmin', 
  'activo', 
  CURRENT_DATE
);

