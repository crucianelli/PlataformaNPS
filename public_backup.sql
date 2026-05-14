--
-- PostgreSQL database dump
--

\restrict dNtoLnjia4OzzuGCBgg4cfTyqajhfbF4L84a3rC9dL9Uz78QRh8Utp8ooYY1xS9

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.9 (Debian 17.9-0+deb13u1)

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: generar_informe_semanal_automatico(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generar_informe_semanal_automatico() RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    fecha_desde TIMESTAMPTZ := now() - interval '7 days';
    fecha_hasta TIMESTAMPTZ := now();
    total_calls INT;
    atendidas_calls INT;
    eficiencia_val INT;
BEGIN
    -- 1. Calcular métricas
    SELECT count(*) INTO total_calls FROM llamadas WHERE fecha_llamada >= fecha_desde;
    SELECT count(*) INTO atendidas_calls FROM llamadas WHERE fecha_llamada >= fecha_desde AND estado = 'ATENDIDA';
    
    IF total_calls > 0 THEN
        eficiencia_val := (atendidas_calls * 100) / total_calls;
    ELSE
        eficiencia_val := 0;
    END IF;

    -- 2. Insertar el reporte en la tabla que ya creamos
    INSERT INTO reportes_generados (titulo, tipo, rango_inicio, rango_fin, metricas, resumen_escrito)
    VALUES (
        'REPORTE SEMANAL AUTOMÁTICO',
        'AUTOMATICO',
        fecha_desde,
        fecha_hasta,
        jsonb_build_object('total', total_calls, 'atendidas', atendidas_calls, 'eficiencia', eficiencia_val),
        'INFORME GENERADO POR SISTEMA. Resumen de actividad de los últimos 7 días de la red Crucianelli.'
    );
END;
$$;


--
-- Name: limpiar_historial_por_nuevo_numero(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.limpiar_historial_por_nuevo_numero() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Si agregamos un número a la agenda, pintamos todas las llamadas viejas
    UPDATE llamadas 
    SET concesionario_id = NEW.concesionario_id
    WHERE numero_telefono = NEW.numero_telefono;
    RETURN NEW;
END;
$$;


--
-- Name: log_terminal_status_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_terminal_status_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO terminal_status_history (terminal_id, status_previo, status_nuevo)
        VALUES (NEW.terminal_id, NULL, NEW.status);
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO terminal_status_history (terminal_id, status_previo, status_nuevo)
        VALUES (NEW.terminal_id, OLD.status, NEW.status);
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: notify_terminal_status_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_terminal_status_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  BEGIN
    PERFORM net.http_post(
      url     := 'https://sistema-llamadas.vercel.app/api/terminal-alert',
      body    := jsonb_build_object('record', row_to_json(NEW)),
      headers := jsonb_build_object(
        'Content-Type',     'application/json',
        'x-webhook-secret', 'ct-alerts-x9k2m7p4q1'
      ),
      timeout_milliseconds := 5000
    );
  EXCEPTION WHEN OTHERS THEN
    -- Loguear el error sin revertir la transacción principal
    RAISE WARNING 'notify_terminal_status_change: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;


--
-- Name: update_terminal_status_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_terminal_status_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


--
-- Name: vincular_concesionario_auto(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.vincular_concesionario_auto() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Busca el ID del concesionario en la tabla de múltiples teléfonos
    SELECT concesionario_id INTO NEW.concesionario_id 
    FROM concesionario_telefonos 
    WHERE numero_telefono = NEW.numero_telefono 
    LIMIT 1;
    
    RETURN NEW;
END;
$$;


--
-- Name: vincular_concesionario_por_numero(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.vincular_concesionario_por_numero() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Busca si existe un concesionario que tenga este número de teléfono
    -- y le asigna el ID automáticamente a la nueva llamada
    SELECT id INTO NEW.concesionario_id 
    FROM concesionarios 
    WHERE telefono_principal = NEW.numero_telefono 
    LIMIT 1;
    
    RETURN NEW;
END;
$$;


--
-- Name: vincular_llamada_automatica(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.vincular_llamada_automatica() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Busca si existe un concesionario con ese número de teléfono
    SELECT id INTO NEW.concesionario_id 
    FROM concesionarios 
    WHERE telefono_principal = NEW.numero_telefono 
    LIMIT 1;
    
    RETURN NEW;
END;
$$;


--
-- Name: vincular_llamadas_retroactivas(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.vincular_llamadas_retroactivas() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE llamadas
    SET concesionario_id = NEW.id
    WHERE numero_telefono = NEW.telefono_principal
    AND concesionario_id IS NULL;
    
    RETURN NEW;
END;
$$;


--
-- Name: vincular_por_agenda_completa(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.vincular_por_agenda_completa() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Busca quién es el dueño de este número en la tabla de múltiples teléfonos
    SELECT concesionario_id INTO NEW.concesionario_id 
    FROM concesionario_telefonos 
    WHERE numero_telefono = NEW.numero_telefono 
    LIMIT 1;
    
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: concesionario_telefonos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.concesionario_telefonos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    concesionario_id uuid,
    numero_telefono text NOT NULL,
    nombre_referencia text
);


--
-- Name: concesionarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.concesionarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre text NOT NULL,
    telefono_principal text NOT NULL,
    localidad text,
    created_at timestamp with time zone DEFAULT now(),
    latitud numeric(10,8),
    longitud numeric(11,8),
    ciudad text,
    provincia text
);


--
-- Name: dispositivo_alias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dispositivo_alias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    dispositivo_id text NOT NULL,
    alias text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: llamadas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.llamadas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero_telefono text,
    tipo_llamada text,
    duracion_segundos integer,
    estado text,
    dispositivo_id text,
    fecha_llamada timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    concesionario_id uuid
);


--
-- Name: reporte_semanal; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.reporte_semanal AS
 SELECT dispositivo_id,
    count(*) AS total_llamadas,
    count(*) FILTER (WHERE (estado = 'ATENDIDA'::text)) AS atendidas,
    round((((count(*) FILTER (WHERE (estado = 'ATENDIDA'::text)))::double precision / (count(*))::double precision) * (100)::double precision)) AS tasa_efectividad
   FROM public.llamadas
  WHERE (fecha_llamada >= (now() - '7 days'::interval))
  GROUP BY dispositivo_id;


--
-- Name: reportes_generados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reportes_generados (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo text NOT NULL,
    tipo text DEFAULT 'MANUAL'::text,
    rango_inicio timestamp with time zone NOT NULL,
    rango_fin timestamp with time zone NOT NULL,
    metricas jsonb,
    resumen_escrito text,
    creado_at timestamp with time zone DEFAULT now()
);


--
-- Name: terminal_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.terminal_status (
    terminal_id text NOT NULL,
    status text DEFAULT 'OFFLINE'::text NOT NULL,
    last_seen timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: terminal_status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.terminal_status_history (
    id bigint NOT NULL,
    terminal_id text NOT NULL,
    status_previo text,
    status_nuevo text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: terminal_status_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.terminal_status_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: terminal_status_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.terminal_status_history_id_seq OWNED BY public.terminal_status_history.id;


--
-- Name: terminal_status_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.terminal_status_history ALTER COLUMN id SET DEFAULT nextval('public.terminal_status_history_id_seq'::regclass);


--
-- Data for Name: concesionario_telefonos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.concesionario_telefonos (id, concesionario_id, numero_telefono, nombre_referencia) FROM stdin;
e54a6fd3-d635-4e32-9e7a-9bbf04af218a	3f4c8cb8-609d-4dc1-9dcc-8f7ade1fb4ea	543471256474	Principal
20a8f50e-0ef4-40a0-a3ba-c60360c6de94	90ca3fca-fcee-4b81-afa2-297ec36c386f	+543471343991	Principal
f851211b-0583-4765-8b92-c26ffcf1e74f	2a5ce776-cf19-49bb-9a8e-90c8ef099ef6	+543406427559	Principal
0aff756e-4ca1-46d9-9d63-0d7ffe04987b	a468272b-690a-4cc6-9c58-9733da81e0e4	+5493576653679	Principal
273f7614-de65-4b0c-a167-20227277e2ff	6e62ea42-6211-41ae-b52a-6ea3f97db292	3329539164	Principal
c5002188-7d24-492f-a1cc-cb4f66b78cba	5adf4dc0-7506-4df6-aa6f-0e0eefb7dd16	2494381811	Principal
6f2dd778-6455-40df-a41b-450941aa5769	065bfe96-c79a-4edf-862d-56e6ba24bd68	2478510469	Principal
c331cc85-86e5-499c-9f44-ef631d2f6e46	90ca3fca-fcee-4b81-afa2-297ec36c386f	+543471579415	Sucursal/Vendedor
7cbaa861-ed9f-4a2d-a7e4-2438aa130e35	90ca3fca-fcee-4b81-afa2-297ec36c386f	+543471685622	ADICIONAL
0184f340-3ce1-467e-9bd0-cdedef50fec9	90ca3fca-fcee-4b81-afa2-297ec36c386f	+543471526139	Vendedor / Sucursal
cd3571e9-094a-4f22-9661-a21f54ced14f	90ca3fca-fcee-4b81-afa2-297ec36c386f	+543471578488	Vendedor / Sucursal
46be1ff4-7e34-482b-9384-9be611458c62	90ca3fca-fcee-4b81-afa2-297ec36c386f	+543471572742	Vendedor / Sucursal
1e04699b-8d12-4264-b202-447168e7d11b	feffb7c2-c84e-47fc-82a6-c1d2e9e089a3	+543816620401	Principal
8e3149d4-47a2-46c7-a3d6-0cb0ec28aa9f	7490c9a8-783a-43b5-ab9b-1c89b6bfafaf	2355556399	Principal
81e78d8c-ce2a-476a-8ff6-0a69519f4ed9	2f1aefa2-4bd3-4829-a519-c8d8de49f4be	2345447208	Principal
07dbe114-17b5-4fb0-b8d0-cee754b8a191	80d243ab-1170-4d38-921d-96bab86811b6	+543468649932	Principal
8780107e-494d-4b61-bd6b-c67aa399132f	e22904c3-1b91-4f8d-96b2-988ce48e842e	2983565325	Principal
f705b363-ff5b-4075-a98c-f841b805f4f7	90ca3fca-fcee-4b81-afa2-297ec36c386f	+5493471592234	Vendedor / Sucursal
2e44aa85-f187-4d8a-b567-736dec023bee	7490c9a8-783a-43b5-ab9b-1c89b6bfafaf	2355507404	Vendedor / Sucursal
96a87019-c4cd-4a9a-a5ee-802fd20eccd3	80d243ab-1170-4d38-921d-96bab86811b6	+543468587360	Vendedor / Sucursal
7bcb72df-9618-4777-9f7c-1b9fab71cb86	44b91681-70a7-45aa-a0e9-64af35931ce6	+543465416267	Principal
25a200c5-c57a-41b2-9023-988b8e3a0a68	feffb7c2-c84e-47fc-82a6-c1d2e9e089a3	+543876616135	Vendedor / Sucursal
bf3190af-1562-49d5-9979-990242bb8f77	c6a82ab6-d86e-4799-ae75-db9814fe1b9c	+5492262511538	Principal
e60900aa-5b31-498a-883c-876714be9cd6	e22904c3-1b91-4f8d-96b2-988ce48e842e	3471343991	Vendedor / Sucursal
703e04aa-1250-4f5c-ae5b-9047b0244b01	b7493ce0-0ba7-4cc9-8536-40582e761954	3401645144	Principal
348a5f9d-958b-4fc6-9922-dc22d839d020	90ca3fca-fcee-4b81-afa2-297ec36c386f	+5493471593075	Vendedor / Sucursal
94e26415-e7e4-4b62-82d0-e7fea775b794	c1f56e58-e436-4aaf-8653-162da3bc89a1	2266536326	Principal
62f7d0e1-6af3-4cbf-8189-0d30a74c987a	90ca3fca-fcee-4b81-afa2-297ec36c386f	3471673363	Vendedor / Sucursal
f2c98013-dc43-4bf0-b838-7a2d9bd329bf	0d5da1b5-2fc0-4dd9-ac23-d40be697ce5f	+543584303367	Principal
5006032d-a6ef-4071-83d6-19101d2c90db	80d243ab-1170-4d38-921d-96bab86811b6	+543468649432	Vendedor / Sucursal
3a85121b-628c-4ee9-9142-6d7717af6cae	b7493ce0-0ba7-4cc9-8536-40582e761954	+543401645144	Vendedor / Sucursal
bd22d4f2-2714-4517-a2ae-84b2f23dd7fb	d63b04a4-92e8-4b87-88b0-8f197d35ad2f	3537596096	Principal
41ed206f-26d1-46b5-ac0b-ff05d3e2ee1e	84bc64c4-0692-4a2d-a81d-488097b5f7c5	+543388501042	Principal
03e3407b-acc8-49c2-8482-f05e7aa6713d	6c5ecf2e-2cdf-4fe9-94dd-a6b89669a45e	3462579258	Principal
192b863c-18e2-4c33-9608-aeaa636e893e	90ca3fca-fcee-4b81-afa2-297ec36c386f	+5493471621310	Vendedor / Sucursal
cffacaf6-aa8b-487d-96cc-702ab8bea2d1	76c755cd-96de-4417-97a1-6a3f87637d4d	2302458528	Principal
5c96230c-6c9d-4e2b-aa29-224fd2dceb8a	90ca3fca-fcee-4b81-afa2-297ec36c386f	3416749009	Vendedor / Sucursal
10334df1-a1bd-4dee-9c5c-abe3641ed7ef	0fd6bdfb-345c-48da-97d7-36810c82c168	+59895352907	Principal
3ee3d936-d302-462e-8b83-22b64d1afaff	2e182105-6ce2-4aae-bfb3-87385d2d5643	+5492346558219	Principal
1f9e9637-992f-446a-a85d-9815aad082ef	a52e26e7-df4b-45ed-97e4-7c3c9994070a	+543572436778	Principal
e99b179c-264e-47ee-a721-40f1d472dcf4	137c3ce9-e634-41df-97d3-20b85716a255	3564571124	Principal
cd0a0455-e70d-4b3a-8819-06f185274c8d	34030c8d-a164-441b-80ef-bce02efae2c5	+543585408279	Principal
6a5e322f-7e27-444c-b98f-1d45e61a656d	90ca3fca-fcee-4b81-afa2-297ec36c386f	+543471325009	Vendedor / Sucursal
8b0f5d1f-d1fd-446b-84f8-de0a6bdc268c	90ca3fca-fcee-4b81-afa2-297ec36c386f	+543471611264	Vendedor / Sucursal
824f7541-4334-4245-91a8-11ca0068f8f8	9e9a6abf-7987-4bda-8146-69bf24b6028d	2396615678	Principal
08bb6642-79ca-41c2-bf6b-92b11fdc8526	065bfe96-c79a-4edf-862d-56e6ba24bd68	+542478469577	Vendedor / Sucursal
86f08e18-6f54-4503-b5ba-c0820e3acda3	90ca3fca-fcee-4b81-afa2-297ec36c386f	+5493471324850	Vendedor / Sucursal
58550aad-549b-4b0e-83ef-113ee72ecd88	a42ebbbe-c30b-4e54-91ec-c668197ca1c2	+5493583457710	Principal
ce455db6-06fa-4afe-a9ef-be0fad8afe97	b0b48fcf-2d03-402f-90d5-2c1dae4115d7	+543493515557	Principal
1da65399-90cc-4ef6-8324-12005785b79d	3f4c8cb8-609d-4dc1-9dcc-8f7ade1fb4ea	+543492419329	Vendedor / Sucursal
b39d65b4-48e8-48d2-b270-409f3e68492e	14f6e344-8634-4cd3-b386-ebd16e90d11f	2923654443	Principal
902821bf-fc40-4a82-8de4-6b222760f710	666a8a9b-9067-409d-b500-3c955be51f1c	2364691644	Principal
1c099361-c56b-4a21-a419-849f2d504758	a52e26e7-df4b-45ed-97e4-7c3c9994070a	3572585409	Vendedor / Sucursal
688df1a8-24f6-4219-900a-a2222782ea60	90ca3fca-fcee-4b81-afa2-297ec36c386f	+543471325015	Vendedor / Sucursal
6dfd506a-b9cb-4eb4-9a13-e71a394da39e	90ca3fca-fcee-4b81-afa2-297ec36c386f	+5493471501886	Vendedor / Sucursal
15485a6f-ae36-4603-80e7-fd8b5790cca1	90ca3fca-fcee-4b81-afa2-297ec36c386f	+5493471579168	Vendedor / Sucursal
5530365a-7926-4abe-bab8-4d31f994dd26	d79f08ef-9a2a-4907-86a9-33bf3556ae53	+543584307989	Principal
47af1588-543e-444a-9d08-072ec8c6c57f	3f4c8cb8-609d-4dc1-9dcc-8f7ade1fb4ea	+543492250762	Vendedor / Sucursal
03397397-1d17-4d08-935f-1b3b3f1f76fa	71fd6f82-d726-4ffc-abfc-44c62b71cb1d	+543462417970	Principal
784d190d-90ef-4bd2-8c7b-5f37c2a6c0b8	c96fd791-45f4-4183-b6ae-956c53abeecb	+542923413490	Principal
545d2b50-7982-4a85-9bfa-e310da5bc137	a135ea9c-bbbd-4906-8604-8d638f6d8e5f	+543537588531	Principal
6521cfcf-97da-4b09-ac49-bb954e369af4	a135ea9c-bbbd-4906-8604-8d638f6d8e5f	+543425289516	Vendedor / Sucursal
40fff580-8e74-4f33-97e9-5a413256a5a2	a3c00e1e-765d-4910-80e2-68253faacc2e	+542281473228	Principal
5badc18f-de16-419e-b6ac-148de9d16880	a135ea9c-bbbd-4906-8604-8d638f6d8e5f	+543492681581	Vendedor / Sucursal
ee307fe8-6d72-43e6-ab3f-2a32c437d5c1	3f4c8cb8-609d-4dc1-9dcc-8f7ade1fb4ea	+543492250282	Vendedor / Sucursal
dc36f4c4-a440-42d2-8af1-71be2202577e	a135ea9c-bbbd-4906-8604-8d638f6d8e5f	+543417800086	Vendedor / Sucursal
7c3c01eb-fea1-4675-8e31-9cfae22e5048	a135ea9c-bbbd-4906-8604-8d638f6d8e5f	+543816452727	Vendedor / Sucursal
351cfaf0-706b-4ac2-ae83-ab3970d7d9a4	90ca3fca-fcee-4b81-afa2-297ec36c386f	+543471561162	Vendedor / Sucursal
40381b96-36a9-4e97-ba2f-ab1409a3f815	90ca3fca-fcee-4b81-afa2-297ec36c386f	+543471621310	Vendedor / Sucursal
dd42c77c-c4e0-4b89-b143-5a69a54b5e12	d63b04a4-92e8-4b87-88b0-8f197d35ad2f	+543816686464	Vendedor / Sucursal
1fc7347a-0493-458d-95c6-a2faf50b47c1	2a5ce776-cf19-49bb-9a8e-90c8ef099ef6	+543406401597	Vendedor / Sucursal
48c5ac57-9152-4169-88c0-4f940b363dfc	a42ebbbe-c30b-4e54-91ec-c668197ca1c2	3583457710	Vendedor / Sucursal
8ad17e4d-d6b1-4a11-89ce-1109db366200	90ca3fca-fcee-4b81-afa2-297ec36c386f	+5493471353706	Vendedor / Sucursal
4bb712d3-a936-4597-b9ed-3cc8a394a18b	d7483b9c-6e82-49eb-8a1d-aaca5736eb42	3564219537	Vendedor / Sucursal
20fceefd-6f03-4411-a24f-c44907798c44	d63b04a4-92e8-4b87-88b0-8f197d35ad2f	+543471687948	Vendedor / Sucursal
db4c0c26-c1af-413a-9417-e6719f6ae8e7	90ca3fca-fcee-4b81-afa2-297ec36c386f	3471563427	Vendedor / Sucursal
b528c51c-9a69-42b8-afb4-9d7f69cd3e11	a42ebbbe-c30b-4e54-91ec-c668197ca1c2	+5493583414932	Vendedor / Sucursal
5f9abffc-f499-4fb5-8434-e556d1f35f20	a468272b-690a-4cc6-9c58-9733da81e0e4	+543576653679	Vendedor / Sucursal
09ba8e0d-c6a1-42c0-a0b2-57e4d57f0fb7	2b2c7f5b-f516-4cb1-92ac-e5a165c8c65e	2302579817	Vendedor / Sucursal
678d10af-ab6d-402a-8eaa-ff6878fd0f6b	90ca3fca-fcee-4b81-afa2-297ec36c386f	3471325014	Vendedor / Sucursal
85c234c4-029e-4757-9e6e-d11c642c7b71	feffb7c2-c84e-47fc-82a6-c1d2e9e089a3	+543816447500	Vendedor / Sucursal
7f4e9397-5409-4783-8ab5-ba311af310e9	b9a3e1b1-82df-4a45-8e6b-1e27f4b01191	+5493877530604	Vendedor / Sucursal
4126c5d3-3c21-4428-bd82-0e2bad9f00e4	b9a3e1b1-82df-4a45-8e6b-1e27f4b01191	+5493877530612	Vendedor / Sucursal
a889a6b8-08e9-41df-9b36-0d815d98fd64	90ca3fca-fcee-4b81-afa2-297ec36c386f	3471325009	Vendedor / Sucursal
9ca91c7f-1c7c-4167-b0d4-46c60faabb4f	90ca3fca-fcee-4b81-afa2-297ec36c386f	3471572742	Vendedor / Sucursal
f2081189-bae6-494f-bf72-7bd349b9ef74	6e62ea42-6211-41ae-b52a-6ea3f97db292	+5493329621395	Vendedor / Sucursal
d306dca2-bbdd-42cd-a6dc-5eb76733b92c	5ca7bf9b-4eb6-4834-8d56-46da93dfc221	2392445225	Vendedor / Sucursal
af8b5895-b3c5-4e8c-8d24-6875db5e50a9	a42ebbbe-c30b-4e54-91ec-c668197ca1c2	3583414932	Vendedor / Sucursal
01971504-9aa2-4dff-b49f-75d4c32f0191	90ca3fca-fcee-4b81-afa2-297ec36c386f	3471571373	Vendedor / Sucursal
6e5bc995-5579-43eb-9913-a626ad1dd15b	90ca3fca-fcee-4b81-afa2-297ec36c386f	+543471571373	Vendedor / Sucursal
e174a5df-c487-4759-b2bd-742b1ab8819c	660ef190-3fc0-404e-8c38-a685371838f6	2923442814	Vendedor / Sucursal
85d37d4c-54c3-4eb7-a276-baf198645078	6e62ea42-6211-41ae-b52a-6ea3f97db292	3329621395	Vendedor / Sucursal
ab31090f-e74c-406c-9345-c4838e97df7b	90ca3fca-fcee-4b81-afa2-297ec36c386f	+543471592234	Vendedor / Sucursal
b3185922-5e1c-4e3f-9238-3e3ea00d5fb7	b7196a4e-021d-4077-92a8-708e237ab6d8	2302626635	Vendedor / Sucursal
a5585dfe-3c11-48e9-b882-ca4f374eaf1d	2b2c7f5b-f516-4cb1-92ac-e5a165c8c65e	+5492331401082	Vendedor / Sucursal
38143ee2-d78d-411a-b494-433961848362	90ca3fca-fcee-4b81-afa2-297ec36c386f	+543471621311	Vendedor / Sucursal
111439b9-2cbc-4087-9249-d3c84a1ed24b	137c3ce9-e634-41df-97d3-20b85716a255	3564607979	Vendedor / Sucursal
75b5bac6-a610-421d-9c56-55404de0f02b	5927aa4a-75d5-4b12-8e7d-3cccc796633f	2262412318	Principal
9288a2a0-5518-4d7b-bed5-bab255f655d8	33138a0a-2776-4292-ad3f-bf321795b99e	+542494585898	Vendedor / Sucursal
eb98cd6f-e703-443b-9d1b-f44fbbdf8220	bf8617ee-32ff-468c-bc50-8db74fe49d3f	+59176010028	Principal
a4ef1096-c09b-49d2-b0c9-3fe4e5cca0d9	bf8617ee-32ff-468c-bc50-8db74fe49d3f	+59171011347	Vendedor / Sucursal
a27a759b-abea-4b60-b398-4e43d5aa94fe	a42ebbbe-c30b-4e54-91ec-c668197ca1c2	+543583416033	Vendedor / Sucursal
80418e74-f02f-496a-8648-86607df039f2	43d689ed-919a-4e4d-964b-e757f77c5bfa	+5493471593078	Vendedor / Sucursal
fe987382-869e-4a54-871a-1b4b804c4e20	6a1490e2-0a9a-48a8-9b40-090f5e7463db	3534140355	Vendedor / Sucursal
ae0cf5ca-41b1-4f8a-b412-fa57f0987bd2	fc8d3fd6-fa7a-4132-b924-f0fd4c00b63d	+543444528221	Vendedor / Sucursal
37976ff3-d274-4046-b67d-f54af93ca87e	90ca3fca-fcee-4b81-afa2-297ec36c386f	+5493471353701	Vendedor / Sucursal
d066471a-edcf-470a-8285-bde08d020068	90ca3fca-fcee-4b81-afa2-297ec36c386f	3471579168	Vendedor / Sucursal
70a54afa-c27c-47d2-ad3d-857bbd7a240d	90ca3fca-fcee-4b81-afa2-297ec36c386f	3471337756	Vendedor / Sucursal
278506d7-ccf7-4d81-a408-6cb013889a6c	2b2c7f5b-f516-4cb1-92ac-e5a165c8c65e	2302455181	Vendedor / Sucursal
62d0c114-56c6-4616-bab4-7e7ad7e51f5a	fc8d3fd6-fa7a-4132-b924-f0fd4c00b63d	+543444620229	Vendedor / Sucursal
\.


--
-- Data for Name: concesionarios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.concesionarios (id, nombre, telefono_principal, localidad, created_at, latitud, longitud, ciudad, provincia) FROM stdin;
84bc64c4-0692-4a2d-a81d-488097b5f7c5	DEPETRIS	+543388501042	BUENOS AIRES	2026-03-17 10:46:27.139417+00	-35.03263427	-63.01502565	General Villegas	Buenos Aires
44b91681-70a7-45aa-a0e9-64af35931ce6	MULTIAGRO	+543465416267	PENDIENTE	2026-03-05 12:10:17.742347+00	\N	\N	\N	\N
d63b04a4-92e8-4b87-88b0-8f197d35ad2f	PICHI PAGNUCCO	3537596096	PENDIENTE	2026-03-17 10:45:27.514349+00	\N	\N	\N	\N
0fd6bdfb-345c-48da-97d7-36810c82c168	CORPORACION MAQUINARIAS	+59895352907	PENDIENTE	2026-03-17 10:50:55.563892+00	\N	\N	\N	\N
37774d91-afba-4eb0-8fa2-5d0aeded3b53	FERRARI MAQUINARIAS	+543533686174	CORDOBA	2026-04-13 12:50:26.91712+00	-31.87038479	-62.71966478	Las Varillas	Córdoba
e22904c3-1b91-4f8d-96b2-988ce48e842e	DISTRIBUIDORA Z	2983565325	BUENOS AIRES	2026-03-04 15:37:46.74671+00	-38.37719670	-60.27521507	Tres Arroyos	Buenos Aires
2a5ce776-cf19-49bb-9a8e-90c8ef099ef6	BOTTO	+543406427559	SANTA FE	2026-02-26 16:39:25.407598+00	-31.67560822	-61.75167950	María Juana	Santa Fe
90ca3fca-fcee-4b81-afa2-297ec36c386f	FABRICA	+543471343991	SANTA FE	2026-02-26 15:58:08.723337+00	-32.78528907	-61.60330991	Armstrong	Santa Fe
065bfe96-c79a-4edf-862d-56e6ba24bd68	AGRICOLA ARRECIFE	2478510469	BUENOS AIRES	2026-02-26 17:09:32.228668+00	-34.06751491	-60.10869159	Arrecifes	Buenos Aires
2e182105-6ce2-4aae-bfb3-87385d2d5643	AGROCOMERCIAL	+5492346558219	BUENOS AIRES	2026-03-17 10:52:01.002016+00	-34.89689583	-60.01909137	Chivilcoy	Buenos Aires
2f1aefa2-4bd3-4829-a519-c8d8de49f4be	AGROMAQ SALADILLO	2345447208	BUENOS AIRES	2026-03-03 17:13:48.020663+00	-35.43247108	-60.17155935	25 de Mayo	Buenos Aires
6e62ea42-6211-41ae-b52a-6ea3f97db292	COSECHAR	3329539164	BUENOS AIRES	2026-02-26 16:59:36.750673+00	-33.89110914	-60.57458619	Pergamino	Buenos Aires
a135ea9c-bbbd-4906-8604-8d638f6d8e5f	NUMERO SIN AGENDAR	+543537588531	PENDIENTE	2026-04-06 10:53:17.390707+00	\N	\N	\N	\N
a468272b-690a-4cc6-9c58-9733da81e0e4	PINTUCCI Y GUIZZO	+5493576653679	CORDOBA	2026-02-26 16:59:02.828316+00	-31.41922977	-63.05070259	Arroyito	Córdoba
5adf4dc0-7506-4df6-aa6f-0e0eefb7dd16	AGRICOLA NOROESTE	2494381811	BUENOS AIRES	2026-02-26 17:00:08.658986+00	-33.89712640	-61.09941636	Colón	Buenos Aires
3f4c8cb8-609d-4dc1-9dcc-8f7ade1fb4ea	AGRICOLA RAFAELA S.A.	543471256474	RAFAELA	2026-02-24 16:34:57.096551+00	-28.88809173	-62.26902527	Bandera	Santiago del Estero
948d3af7-023f-4f60-a763-794e6c470504	AGRO DE SOUZA	+542926412313	BUENOS AIRES	2026-04-10 10:35:50.920148+00	-37.45852892	-61.93289383	Coronel Suárez	Buenos Aires
bd310b0a-1cd6-4ccb-8771-cb4d61ccb071	AGRO SCHEIDEGGER	+543482620382	SANTA FE	2026-04-10 10:36:29.431844+00	-29.14451733	-59.64354790	Reconquista	Santa Fe
8f125a37-3feb-452e-b4cd-d59010a6dec3	AGRO SUR	+542215425456	BUENOS AIRES	2026-04-10 10:38:39.546042+00	-35.76567620	-58.49716327	General Belgrano	Buenos Aires
9e9a6abf-7987-4bda-8146-69bf24b6028d	ALONSO MAQUINARIAS	2396615678	BUENOS AIRES	2026-03-25 10:24:57.009304+00	-35.62247375	-61.36549513	Carlos Casares	Buenos Aires
71fd6f82-d726-4ffc-abfc-44c62b71cb1d	CRIOLANI	+543462417970	SANTA FE	2026-03-31 18:54:04.293794+00	-32.58427249	-61.16669974	Totoras	Santa Fe
666a8a9b-9067-409d-b500-3c955be51f1c	ALTAMIRANO MAQUINARIAS	2364691644	BUENOS AIRES	2026-03-30 12:45:08.820003+00	-34.59394174	-60.94643097	Junín	Buenos Aires
34030c8d-a164-441b-80ef-bce02efae2c5	ALVAREZ MAQUINARIAS	+543585408279	CORDOBA	2026-03-19 18:04:54.653498+00	-34.12863224	-63.39070171	Laboulaye	Córdoba
b9a3e1b1-82df-4a45-8e6b-1e27f4b01191	ANTA MAQUINARIAS	+543877530604	SALTA	2026-04-13 12:38:01.194997+00	-24.72740169	-64.19546598	Las Lajitas	Salta
80ab759c-57eb-4cf7-9d6e-a8f2344a1bcb	CAON MAQUINARIAS	+543534201218	CORDOBA	2026-04-13 12:39:37.271924+00	-31.65015276	-63.91186284	Río Segundo	Córdoba
d7483b9c-6e82-49eb-8a1d-aaca5736eb42	CALATRONI MAQUINARIAS	+543564584202	CORDOBA	2026-04-13 12:40:52.435117+00	-31.01404931	-62.06204453	Porteña	Córdoba
7490c9a8-783a-43b5-ab9b-1c89b6bfafaf	CAMINITI CAMINOS	2355556399	BUENOS AIRES	2026-03-03 15:20:36.362097+00	-34.99997083	-61.03874001	Los Toldos	Buenos Aires
de391a76-6096-418a-86b2-869a4fee0dd1	CARLOS ECHEVARRIA	+542262412318	BUENOS AIRES	2026-04-13 12:43:01.402941+00	-38.57122333	-58.72624202	Necochea	Buenos Aires
41759ff5-86a3-4f60-a55c-76b2770fb90a	CENTENO	+543584169269	CORDOBA	2026-04-13 12:44:19.371229+00	-34.84052061	-64.58710002	Villa Huidobro	Córdoba
14f6e344-8634-4cd3-b386-ebd16e90d11f	COMBES IMPLEMENTOS	2923654443	BUENOS AIRES	2026-03-26 16:55:30.575101+00	-37.60254871	-62.40836148	Pigüé	Buenos Aires
595b71bc-9b68-4fd6-81d3-535e8a54905e	CRI-MAG	+543735626119	CHACO	2026-04-13 12:45:42.070775+00	-27.68221341	-60.90434221	Coronel Du Graty	Chaco
b7196a4e-021d-4077-92a8-708e237ab6d8	EL MARRULLERO	+542302412950	LA PAMPA	2026-04-13 12:51:11.333+00	-35.65930043	-63.75787173	General Pico	La Pampa
b0b48fcf-2d03-402f-90d5-2c1dae4115d7	EQ MAQUINARIAS	+543493515557	SANTA FE	2026-03-26 16:54:29.042567+00	-30.84626530	-61.59174895	Tacural	Santa Fe
fc8d3fd6-fa7a-4132-b924-f0fd4c00b63d	FRARE	+543444620229	ENTRE RIOS	2026-04-13 12:52:01.887972+00	-33.15043008	-59.31057559	Gualeguay	Entre Ríos
72ebee38-3e53-4fec-85f0-067b40171878	GIRAUDO	+543572439971	CORDOBA	2026-04-13 12:53:59.91768+00	-31.68126524	-63.88239584	Pilar	Córdoba
a42ebbbe-c30b-4e54-91ec-c668197ca1c2	GONDRA	+5493583457710	CORDOBA	2026-03-26 16:53:45.730341+00	-33.91564167	-64.38985456	Vicuña Mackenna	Córdoba
c6a82ab6-d86e-4799-ae75-db9814fe1b9c	GUERRERO	+5492262511538	BUENOS AIRES	2026-03-09 10:47:04.811861+00	-38.16338493	-58.78184680	Lobería	Buenos Aires
80d243ab-1170-4d38-921d-96bab86811b6	QUADRI	+543468649932	CORDOBA	2026-03-04 15:36:30.615301+00	-33.28309285	-62.18654292	Corral de Bustos	Córdoba
76c755cd-96de-4417-97a1-6a3f87637d4d	LANZETTI	2302458528	LA PAMPA	2026-03-17 10:49:42.444601+00	-35.38847115	-64.46737057	Ingeniero Luiggi	La Pampa
09218c82-8140-468f-8d30-c068eae29762	LEMBO MAQUINARIAS	+542664406141	SAN LUIS	2026-04-13 13:01:01.199933+00	-33.29044705	-66.26553165	El Chorrillo	San Luis
43d689ed-919a-4e4d-964b-e757f77c5bfa	LITORAL MAQUINARIAS	+543471593078	ENTRE RIOS	2026-04-13 13:02:13.268802+00	-31.74016016	-60.52742605	Paraná	Entre Ríos
c1f56e58-e436-4aaf-8653-162da3bc89a1	JUAN LUCIANO BALCARCE	2266536326	BUENOS AIRES	2026-03-09 15:26:23.87138+00	-37.84638262	-58.25549117	Balcarce	Buenos Aires
feffb7c2-c84e-47fc-82a6-c1d2e9e089a3	FERRO	+543816620401	TUCUMAN	2026-03-03 15:18:39.600522+00	-26.83038876	-65.20377970	San Miguel de Tucumán	Tucumán
137c3ce9-e634-41df-97d3-20b85716a255	MAQUINAS DEL CENTRO	3564571124	CORDOBA	2026-03-18 18:48:13.082553+00	-31.42493894	-62.08387673	San Francisco	Córdoba
6a1490e2-0a9a-48a8-9b40-090f5e7463db	MARATA MAQUINARIAS	+543535080823	CORDOBA	2026-04-13 13:04:13.049482+00	-33.03144005	-63.50611989	Ucacha	Córdoba
c810a8c0-40fc-4f1b-93f5-c388a5a92a0e	MAURICIO SCHMIDT	+543436207826	ENTRE RIOS	2026-04-13 13:05:01.455897+00	-31.62496088	-58.50503201	San Salvador	Entre Ríos
b8a17ee0-2f7d-4109-91dd-3ae27e85b108	MFM RURAL SRL	+541161631647	BUENOS AIRES	2026-04-13 13:06:55.078337+00	-34.56684836	-59.11451180	Luján	Buenos Aires
5ca7bf9b-4eb6-4834-8d56-46da93dfc221	MAQUIAGRO QUENUMA (MORALEJO)	+542392522029	BUENOS AIRES	2026-04-13 13:08:24.225299+00	-35.97333590	-62.73274505	Trenque Lauquen	Buenos Aires
16ffb9f8-fcd4-4f36-a1f5-fe1ac136f6d4	NET MULTIAGRO	+543465660139	SANTA FE 	2026-04-13 13:09:11.528851+00	-33.34084312	-61.86209219	Beravebú	Santa Fe
33138a0a-2776-4292-ad3f-bf321795b99e	PAJIN	+542494582615	BUENOS AIRES 	2026-04-13 13:11:32.60054+00	-37.32869548	-59.13689756	Tandil	Buenos Aires
d79f08ef-9a2a-4907-86a9-33bf3556ae53	PALLOTI	+543584307989	CORDOBA	2026-03-30 12:49:25.052171+00	-33.12383693	-64.34900322	Río Cuarto	Córdoba
7c6f8219-f900-4bb8-9e95-530df7741a62	PERRACINO	+543562456920	SANTA FE	2026-04-13 13:12:40.56545+00	-30.21610844	-61.87709209	Villa Trinidad	Santa Fe
660ef190-3fc0-404e-8c38-a685371838f6	PERTICARINI	+542923442815	BUENOS AIRES	2026-04-13 13:13:19.069943+00	-36.59963294	-61.74754241	Daireaux	Buenos Aires
b7493ce0-0ba7-4cc9-8536-40582e761954	POZZI MAQUINARIAS	3401645144	SANTA FE	2026-03-09 15:24:35.349077+00	-32.05436829	-61.60185924	Cañada Rosquín	Santa Fe
a52e26e7-df4b-45ed-97e4-7c3c9994070a	QUEVEDO-CANAVESE	+543572436778	CORDOBA	2026-03-18 14:02:13.384625+00	-31.91343210	-63.68202140	Oncativo	Córdoba
2b2c7f5b-f516-4cb1-92ac-e5a165c8c65e	REALICO AGROSOLUCIONES SRL	+542331410270	LA PAMPA	2026-04-13 13:19:37.114077+00	-35.03821437	-64.24630752	Realicó	La Pampa
0d5da1b5-2fc0-4dd9-ac23-d40be697ce5f	TODOCAMPO  SALUM	+543584303367	CORDOBA	2026-03-16 15:17:07.582571+00	-33.28028234	-63.97537615	Las Acequias	Córdoba
c96fd791-45f4-4183-b6ae-956c53abeecb	WIRZ CARLOS	+542923413490	BUENOS AIRES 	2026-04-06 10:52:09.937307+00	-36.75770035	-62.50438246	Casbas	Buenos Aires
6c5ecf2e-2cdf-4fe9-94dd-a6b89669a45e	ZAPELLI	3462579258	SANTA FE	2026-03-17 10:47:03.251153+00	-34.00772564	-62.24154130	Sancti Spiritu	Santa Fe
5f7bae09-f01c-4862-8bf5-e44b9c4fdb0e	SABBIONE	+543498618081	SANTA FE	2026-04-13 13:20:14.847632+00	-30.78917115	-60.59330059	San Justo	Santa Fe
f6a6e057-3a47-4be2-a347-fe6de1b359ec	SILVIA LOMBARDI	+543469690514	SANTA FE	2026-04-13 13:21:01.005694+00	-33.24176396	-60.83648037	Acébal	Santa Fe
2f59f69f-32bb-499f-af5b-ab690e8380fb	TABORRO	+543415997792	CORDOBA	2026-04-13 13:22:44.815402+00	-32.69063629	-62.10112652	Marcos Juárez	Córdoba
a3c00e1e-765d-4910-80e2-68253faacc2e	SPITALE OSVALDO	+542281473228	BUENOS AIRES	2026-04-06 10:54:34.385271+00	-36.77744700	-59.86344305	Azul	Buenos Aires
b365a072-ceb9-4ce4-9a8a-67c6afc40d2a	SUR PAMPA MAQUINARIAS SA	+542923691289	BUENOS AIRES	2026-04-13 13:22:06.79519+00	-37.17948326	-62.75999039	Carhué	Buenos Aires
240cc471-7055-4784-970a-9003d142150d	TECNOMAC	+543584851047	CORDOBA	2026-04-13 13:23:11.990983+00	-32.75882923	-64.33403342	Alcira Gigena	Córdoba
8bcb9c59-ada4-4350-b713-cb343aea092c	VAGLIENGO MAQUINARIAS	+543572532159	CORDOBA	2026-04-13 13:25:32.544516+00	-32.63031428	-62.68879338	Bell Ville	Córdoba
e54be89d-e633-4f7e-9dfc-d936f1e9b057	WEINBAUR	+543434461003	ENTRE RIOS	2026-04-13 13:26:03.209438+00	-32.03075951	-60.30609205	Crespo	Entre Ríos
5927aa4a-75d5-4b12-8e7d-3cccc796633f	ECHEVERRIA MAQUINARIAS	2262412318	PENDIENTE	2026-04-28 10:11:01.445813+00	\N	\N	\N	\N
bf8617ee-32ff-468c-bc50-8db74fe49d3f	BOLIVIA	+59176010028	PENDIENTE	2026-04-29 10:23:22.448763+00	\N	\N	\N	\N
\.


--
-- Data for Name: dispositivo_alias; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dispositivo_alias (id, dispositivo_id, alias, created_at) FROM stdin;
efc058db-3533-43b9-b4de-1848527b818f	10	Renzo PRueba	2026-03-16 10:45:24.652362+00
82ffa148-e286-4191-be30-fe46431ddceb	2	STC-2	2026-03-16 10:45:24.652362+00
8d90b32b-c993-438e-883d-fa749b519ea1	3	stf-1	2026-03-16 10:49:24.633194+00
8bc04cd0-f5cb-404f-bd6e-7c642dc61982	6	stl-2	2026-03-16 10:49:42.331174+00
1f92d44d-b5da-424d-8767-413837618539	4	stf-2	2026-03-16 10:49:32.775752+00
c60e85f0-0673-4293-b43a-2773f39b8609	5	Stl-1 (ex santi)	2026-03-30 10:05:31.137362+00
81b7b251-5b5f-4d5c-9411-e11855edec8d	1	stc-1	2026-03-16 10:45:24.652362+00
d502cf99-3897-4171-ab6a-7c78789d45f7	DESCONOCIDO	desc	2026-04-07 17:02:31.764465+00
\.


--
-- Data for Name: llamadas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.llamadas (id, numero_telefono, tipo_llamada, duracion_segundos, estado, dispositivo_id, fecha_llamada, created_at, concesionario_id) FROM stdin;
a998d000-9bb8-4b1e-9860-8dea1430df03	+5493471592234	SALIENTE	15	ATENDIDA	1	2026-03-04 18:20:04.478+00	2026-03-04 18:20:06.20585+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
f033e2c9-8e4d-4b29-91a7-94be7be1f88f	+543406427559	ENTRANTE	258	ATENDIDA	2	2026-04-01 12:53:48.949+00	2026-04-01 12:53:49.611724+00	2a5ce776-cf19-49bb-9a8e-90c8ef099ef6
86ac04b9-999c-4e3b-a3db-6744dd9e8e08	+543462417970	SALIENTE	1016	ATENDIDA	1	2026-04-01 15:23:40.087+00	2026-04-01 15:23:40.769736+00	71fd6f82-d726-4ffc-abfc-44c62b71cb1d
f5d51ca0-a185-494b-b85b-8ee4a0131fe6	3472645405	SALIENTE	55	ATENDIDA	4	2026-04-01 15:38:12.903+00	2026-04-01 15:38:12.365672+00	\N
e3cbdffc-b216-47ee-bcfd-b35665f0d5cb	2355507404	ENTRANTE	0	PERDIDA	2	2026-03-04 19:34:51.356+00	2026-03-04 19:34:53.15704+00	7490c9a8-783a-43b5-ab9b-1c89b6bfafaf
2c466734-26be-4ccf-92d0-52d68913a059	+543468587360	ENTRANTE	0	PERDIDA	1	2026-03-05 12:00:36.206+00	2026-03-05 12:00:37.651007+00	80d243ab-1170-4d38-921d-96bab86811b6
1d70ed1a-7869-420c-b6e6-80f6add54026	+543468587360	ENTRANTE	0	PERDIDA	2	2026-03-05 12:00:37.441+00	2026-03-05 12:00:38.237337+00	80d243ab-1170-4d38-921d-96bab86811b6
fc33bae0-b3a9-4560-b8d8-cb6388f900c8	+543465416267	ENTRANTE	0	PERDIDA	2	2026-03-05 12:04:45.254+00	2026-03-05 12:04:46.208612+00	44b91681-70a7-45aa-a0e9-64af35931ce6
bf2b4e91-8c5d-474b-8aa7-b341f2500e54	2983565325	ENTRANTE	2	PERDIDA	1	2026-03-06 13:47:56.226+00	2026-03-06 13:47:58.341884+00	e22904c3-1b91-4f8d-96b2-988ce48e842e
bb818a9d-92ea-44b6-9df0-d924981d1d79	2983565325	ENTRANTE	234	ATENDIDA	2	2026-03-06 13:52:24.704+00	2026-03-06 13:52:25.985624+00	e22904c3-1b91-4f8d-96b2-988ce48e842e
4837204f-2dcd-400d-86fb-c7efae8dc830	+543471578488	ENTRANTE	0	PERDIDA	2	2026-02-27 18:29:34.851+00	2026-02-27 18:29:36.757774+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
391bb1e3-27be-41c0-8aa4-5a2c9bcdcd84	+543471578488	ENTRANTE	0	PERDIDA	2	2026-02-27 18:30:16.032+00	2026-02-27 18:30:17.411879+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
8bb5d9f2-a164-4757-94ea-2ecef2e452bf	+543471578488	ENTRANTE	0	PERDIDA	2	2026-02-27 18:31:43.177+00	2026-02-27 18:31:43.545181+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
6da0f4b6-e2c4-413c-9e8f-a5af51c47dc1	+543471578488	SALIENTE	0	PERDIDA	2	2026-02-27 18:34:46.683+00	2026-02-27 18:34:47.268355+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
c6c67712-1e47-4c88-8069-a3e8882bc8f8	+543471578488	SALIENTE	0	PERDIDA	2	2026-02-27 18:35:08.295+00	2026-02-27 18:35:08.444657+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
392eb799-6efc-42e5-bac1-656cbd505772	+543471578488	ENTRANTE	0	PERDIDA	2	2026-02-27 18:37:47.045+00	2026-02-27 18:37:47.400525+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
3aa51e95-08d7-4000-b7db-ae8c3443876b	+543471343991	ENTRANTE	23	ATENDIDA	10	2026-03-02 12:40:53.99+00	2026-03-02 12:40:56.19729+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
12c64052-3910-4139-8385-cb3528df1cfc	+543471572742	ENTRANTE	0	PERDIDA	2	2026-03-02 20:18:58.808+00	2026-03-02 20:19:00.676168+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
337046a9-6dbe-49bd-a206-fde1333f2f03	+543816452727	ENTRANTE	2101	ATENDIDA	6	2026-03-10 15:14:57.86+00	2026-03-10 15:15:01.554789+00	a135ea9c-bbbd-4906-8604-8d638f6d8e5f
b312547a-7c2b-49de-99e8-54be3653b383	+5493471353706	SALIENTE	172	ATENDIDA	1	2026-04-01 17:05:25.262+00	2026-04-01 17:05:26.720537+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
87369358-446b-478f-aae6-306617a2f61b	+543876616135	ENTRANTE	1	PERDIDA	1	2026-03-06 17:36:09.62+00	2026-03-06 17:36:11.741075+00	feffb7c2-c84e-47fc-82a6-c1d2e9e089a3
d1d652b8-dc5e-45d7-8881-1283fdf918dc	+543876616135	ENTRANTE	0	PERDIDA	2	2026-03-06 17:37:21.551+00	2026-03-06 17:37:22.213642+00	feffb7c2-c84e-47fc-82a6-c1d2e9e089a3
227471e0-dc45-4a4e-a9dc-a81c7aa6771f	2345447208	ENTRANTE	0	PERDIDA	2	2026-03-04 13:32:05.787+00	2026-03-04 13:32:06.01031+00	2f1aefa2-4bd3-4829-a519-c8d8de49f4be
0f6c4cda-04a2-4f1a-a2de-4420c1c355fb	+543876616135	ENTRANTE	1	PERDIDA	1	2026-03-06 17:46:11.178+00	2026-03-06 17:46:12.387166+00	feffb7c2-c84e-47fc-82a6-c1d2e9e089a3
06a7481d-e87e-4dab-ab87-3a5efdf509c7	+543816620401	ENTRANTE	0	PERDIDA	1	2026-03-03 13:57:55.43+00	2026-03-03 13:57:57.245124+00	feffb7c2-c84e-47fc-82a6-c1d2e9e089a3
6342db78-faf2-4bd9-8c0d-9f2b84718f03	+543816620401	ENTRANTE	0	PERDIDA	2	2026-03-03 14:08:38.644+00	2026-03-03 14:08:39.719758+00	feffb7c2-c84e-47fc-82a6-c1d2e9e089a3
859b3546-ab47-40c6-9a19-680785596e6c	2355556399	SALIENTE	287	ATENDIDA	1	2026-03-03 14:29:08.012+00	2026-03-03 14:29:09.18178+00	7490c9a8-783a-43b5-ab9b-1c89b6bfafaf
c04ccebb-92ce-4065-a02a-5aa7c307cafe	+5492262511538	SALIENTE	191	ATENDIDA	2	2026-03-06 21:52:35.582+00	2026-03-06 21:52:37.61206+00	c6a82ab6-d86e-4799-ae75-db9814fe1b9c
9912e77d-9edd-4589-bdaa-767050b55bac	2345447208	ENTRANTE	520	ATENDIDA	2	2026-03-03 13:07:26+00	2026-03-03 17:12:34.444617+00	2f1aefa2-4bd3-4829-a519-c8d8de49f4be
62368f50-f788-4832-827c-5fd470fd003d	3471343991	ENTRANTE	30	ATENDIDA	3	2026-03-06 16:01:34.348+00	2026-03-06 16:01:38.236091+00	e22904c3-1b91-4f8d-96b2-988ce48e842e
a61e38f0-7ac2-43ac-a6a5-52defc9164bc	3564219537	ENTRANTE	487	ATENDIDA	1	2026-03-31 19:53:12.76+00	2026-03-31 19:53:14.638434+00	d7483b9c-6e82-49eb-8a1d-aaca5736eb42
9d240439-7879-4d79-8663-a5f0b746aa9c	3583414932	ENTRANTE	96	ATENDIDA	2	2026-04-01 19:32:24.031+00	2026-04-01 19:32:25.321552+00	a42ebbbe-c30b-4e54-91ec-c668197ca1c2
3db97d70-fd6e-481a-ac99-c253f52bd9fd	2345447208	ENTRANTE	0	PERDIDA	2	2026-03-04 13:30:54.478+00	2026-03-04 13:30:56.233683+00	2f1aefa2-4bd3-4829-a519-c8d8de49f4be
33f848a5-9a3a-4e05-abd1-f31cb4dfd5e9	+543468649932	ENTRANTE	0	PERDIDA	2	2026-03-04 14:07:11.899+00	2026-03-04 14:07:13.398624+00	80d243ab-1170-4d38-921d-96bab86811b6
e12eeef3-6bc6-45cc-9a67-14fe0d3ce0c5	+543468649932	ENTRANTE	0	PERDIDA	2	2026-03-03 18:54:02.779+00	2026-03-03 18:54:04.375492+00	80d243ab-1170-4d38-921d-96bab86811b6
32871c2d-bc63-4542-a3bc-673de5a13800	+543468649932	ENTRANTE	0	PERDIDA	2	2026-03-03 19:32:23.568+00	2026-03-03 19:32:25.454925+00	80d243ab-1170-4d38-921d-96bab86811b6
76cc9b03-ced4-4eb0-a140-099752082ca8	+543468649932	ENTRANTE	1232	ATENDIDA	1	2026-03-04 14:28:21.074+00	2026-03-04 14:28:22.538316+00	80d243ab-1170-4d38-921d-96bab86811b6
be25937d-091f-4779-b9f1-ebc0ed7a8ad7	2983565325	ENTRANTE	0	PERDIDA	1	2026-03-04 12:07:28.738+00	2026-03-04 12:07:30.118924+00	e22904c3-1b91-4f8d-96b2-988ce48e842e
4289bba0-76df-43e9-829f-4d2f7cf0c50f	2983565325	ENTRANTE	0	PERDIDA	2	2026-03-04 12:07:58.142+00	2026-03-04 12:07:59.520834+00	e22904c3-1b91-4f8d-96b2-988ce48e842e
e175906e-2ddd-44cf-9fd9-f1bec31f1942	3401645144	SALIENTE	33	ATENDIDA	2	2026-03-09 15:23:50.002+00	2026-03-09 15:23:51.567795+00	b7493ce0-0ba7-4cc9-8536-40582e761954
a9f8aeff-cf1b-489b-a246-1df7df262ece	+5493471593075	SALIENTE	282	ATENDIDA	2	2026-03-09 13:26:25.218+00	2026-03-09 13:26:27.270738+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
c33a700a-ee11-4031-8f32-276ca2b65f1b	2266536326	ENTRANTE	0	PERDIDA	2	2026-03-09 11:04:29.082+00	2026-03-09 11:04:30.76164+00	c1f56e58-e436-4aaf-8653-162da3bc89a1
b0bac5a2-e7d6-4bd6-abdb-ff49230a3cac	2266536326	ENTRANTE	0	PERDIDA	2	2026-03-09 11:23:57.197+00	2026-03-09 11:23:57.462638+00	c1f56e58-e436-4aaf-8653-162da3bc89a1
c75bbd7e-efb1-4684-9810-447ef894c368	2266536326	ENTRANTE	0	PERDIDA	1	2026-03-09 11:24:38.708+00	2026-03-09 11:24:39.398077+00	c1f56e58-e436-4aaf-8653-162da3bc89a1
cfe1446b-ee88-46f8-bc70-14f2476bd99d	2266536326	SALIENTE	456	ATENDIDA	2	2026-03-09 11:37:31.912+00	2026-03-09 11:37:32.944075+00	c1f56e58-e436-4aaf-8653-162da3bc89a1
002e3fa9-121e-484b-bec4-8c06dd521527	3471673363	SALIENTE	62	ATENDIDA	2	2026-03-09 11:23:04.324+00	2026-03-09 11:23:05.868771+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
f50eb353-f690-4a5b-bf35-446b1783c55a	+543471587980	ENTRANTE	27	ATENDIDA	6	2026-03-09 18:29:23.667+00	2026-03-09 18:29:27.325295+00	\N
acbd34b7-567e-4ac7-a9ff-dc283fc7ccc6	+5492926464693	SALIENTE	0	PERDIDA	3	2026-03-12 15:46:26.008+00	2026-03-12 15:46:30.220018+00	\N
ff4a186d-bf16-4756-9202-0101d10538b9	+5492926464693	SALIENTE	0	PERDIDA	3	2026-03-12 17:56:55.174+00	2026-03-12 17:57:04.537475+00	\N
7f0415eb-f97d-4122-9736-a549871d37fe	2926451386	ENTRANTE	0	PERDIDA	4	2026-03-13 11:44:53.622+00	2026-03-13 11:44:54.870422+00	\N
f3f639af-06fe-4ba1-8f97-be0911c0cda2	+543471578488	SALIENTE	253	ATENDIDA	2	2026-03-13 13:58:13.936+00	2026-03-13 13:58:15.725333+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
89202abd-7c08-4f8c-a35b-79262fb41fb5	+543584303367	ENTRANTE	325	ATENDIDA	2	2026-03-16 14:51:19.404+00	2026-03-16 14:51:21.31412+00	0d5da1b5-2fc0-4dd9-ac23-d40be697ce5f
6f254307-a71a-4bd5-8072-e427d8571c55	+543468649432	ENTRANTE	87	ATENDIDA	1	2026-03-09 15:21:28.258+00	2026-03-09 15:21:30.796972+00	80d243ab-1170-4d38-921d-96bab86811b6
b4a752b4-cb95-4f53-b8d9-7698387dff65	+543401645144	ENTRANTE	0	PERDIDA	2	2026-03-09 15:38:05.233+00	2026-03-09 15:38:06.266194+00	b7493ce0-0ba7-4cc9-8536-40582e761954
cac598ca-3a65-4ea1-9de1-e8d2b1db7c5e	+543401645144	SALIENTE	23	ATENDIDA	2	2026-03-09 15:39:06.941+00	2026-03-09 15:39:07.159016+00	b7493ce0-0ba7-4cc9-8536-40582e761954
6f7d3214-002d-4e80-a227-0dab53089659	3537596096	ENTRANTE	430	ATENDIDA	2	2026-03-09 17:17:00.769+00	2026-03-09 17:17:02.204267+00	d63b04a4-92e8-4b87-88b0-8f197d35ad2f
1d1b2a05-5362-4bbf-aedd-e78fdc4318f7	+543388501042	ENTRANTE	0	PERDIDA	6	2026-03-11 16:18:21.896+00	2026-03-11 16:18:25.6601+00	84bc64c4-0692-4a2d-a81d-488097b5f7c5
5161efa6-a716-4c02-9f95-35092a8c85b3	3462579258	ENTRANTE	0	PERDIDA	2	2026-03-11 17:50:19.792+00	2026-03-11 17:50:21.66754+00	6c5ecf2e-2cdf-4fe9-94dd-a6b89669a45e
3d3f2b1c-3895-403f-b943-88eb91669c6c	3462579258	ENTRANTE	141	ATENDIDA	1	2026-03-11 17:53:18.988+00	2026-03-11 17:53:19.943481+00	6c5ecf2e-2cdf-4fe9-94dd-a6b89669a45e
295ccb69-0cf8-4ccb-8aaa-c6fe123c505a	3462579258	ENTRANTE	0	PERDIDA	1	2026-03-11 20:48:11.283+00	2026-03-11 20:48:14.832958+00	6c5ecf2e-2cdf-4fe9-94dd-a6b89669a45e
29dbaede-5ab5-40b6-b4c6-7977a83c57a8	3462579258	ENTRANTE	0	PERDIDA	1	2026-03-12 11:51:12.76+00	2026-03-12 11:51:14.673088+00	6c5ecf2e-2cdf-4fe9-94dd-a6b89669a45e
e4e79641-fdde-489a-ba7f-0e84e7238d92	+5493471621310	SALIENTE	66	ATENDIDA	2	2026-03-13 13:38:16.623+00	2026-03-13 13:38:17.510879+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
3b10c648-f281-4a47-857c-648e57b7447b	2302458528	ENTRANTE	281	ATENDIDA	1	2026-03-13 19:22:13.128+00	2026-03-13 19:22:15.204029+00	76c755cd-96de-4417-97a1-6a3f87637d4d
d035bfdc-24e5-4e01-9cf5-9b51da35d7cc	3416749009	ENTRANTE	227	ATENDIDA	4	2026-03-16 10:17:14.802+00	2026-03-16 10:17:15.284877+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
a9fc0742-a787-4601-95c0-ccd6463551f5	+59895352907	ENTRANTE	0	PERDIDA	1	2026-03-16 18:59:22.678+00	2026-03-16 18:59:24.620615+00	0fd6bdfb-345c-48da-97d7-36810c82c168
ec70abc5-9f4e-42fe-9bcb-9e389bb0796d	+59895352907	ENTRANTE	0	PERDIDA	1	2026-03-16 19:03:38.113+00	2026-03-16 19:03:38.743722+00	0fd6bdfb-345c-48da-97d7-36810c82c168
5962cc33-bcdb-4392-894d-f8503e003869	+5492346558219	ENTRANTE	127	ATENDIDA	3	2026-03-16 19:52:46.262+00	2026-03-16 19:52:47.158332+00	2e182105-6ce2-4aae-bfb3-87385d2d5643
e1914891-0cb2-41b7-ab7c-c4346f6808e6	+543471611264	ENTRANTE	63	ATENDIDA	1	2026-03-13 13:38:13.208+00	2026-03-13 13:38:14.21809+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
2b2f041b-4a9b-45a8-8289-435447927d7b	3462579258	SALIENTE	0	PERDIDA	1	2026-03-12 12:00:49.259+00	2026-03-12 12:00:50.374493+00	6c5ecf2e-2cdf-4fe9-94dd-a6b89669a45e
56a4500d-156c-4bdc-b069-5a20fcc884ba	3462579258	ENTRANTE	0	PERDIDA	1	2026-03-12 12:02:38.369+00	2026-03-12 12:02:38.657188+00	6c5ecf2e-2cdf-4fe9-94dd-a6b89669a45e
d3a70df3-0f7a-42e9-9e7b-2293efa56891	3462579258	SALIENTE	0	PERDIDA	1	2026-03-12 12:08:38.058+00	2026-03-12 12:08:38.503255+00	6c5ecf2e-2cdf-4fe9-94dd-a6b89669a45e
a71d7ab9-a698-4f1f-8186-3ed3ac8e570a	3462579258	ENTRANTE	0	PERDIDA	1	2026-03-12 12:12:41.393+00	2026-03-12 12:12:41.85775+00	6c5ecf2e-2cdf-4fe9-94dd-a6b89669a45e
79e7e0cc-24f6-4814-8a26-fa0e85e7f656	3462579258	SALIENTE	173	ATENDIDA	1	2026-03-12 12:39:17.081+00	2026-03-12 12:39:18.629328+00	6c5ecf2e-2cdf-4fe9-94dd-a6b89669a45e
d4f89782-6122-444b-ae5e-170397cd52fc	2921401962	ENTRANTE	0	PERDIDA	4	2026-03-17 10:53:56.247+00	2026-03-17 10:53:57.204804+00	\N
97f7dc05-1862-49cb-98c6-5fd38612c817	2921401962	ENTRANTE	0	PERDIDA	4	2026-03-17 10:53:56.259+00	2026-03-17 10:53:57.227026+00	\N
b9987e71-bdd5-485d-898c-dfeab554cbf1	3462579258	SALIENTE	176	ATENDIDA	1	2026-03-17 11:00:27.02+00	2026-03-17 11:00:28.357835+00	6c5ecf2e-2cdf-4fe9-94dd-a6b89669a45e
3fd58dba-da9d-4838-9d33-8c36841ca552	2921401962	ENTRANTE	342	ATENDIDA	4	2026-03-17 11:34:34.639+00	2026-03-17 11:34:36.485595+00	\N
3b345f21-af2d-4e81-9552-0697a2422f49	3462579258	SALIENTE	0	PERDIDA	1	2026-03-17 12:02:29.573+00	2026-03-17 12:02:31.357598+00	6c5ecf2e-2cdf-4fe9-94dd-a6b89669a45e
a517ab18-8341-4708-914e-5118aae67419	+543406427559	ENTRANTE	213	ATENDIDA	2	2026-03-17 12:07:28.9+00	2026-03-17 12:07:31.263663+00	2a5ce776-cf19-49bb-9a8e-90c8ef099ef6
4502737e-4c3d-442a-bf69-60ffb73671e2	+543465416267	ENTRANTE	0	PERDIDA	2	2026-03-17 14:49:26.821+00	2026-03-17 14:49:28.543335+00	44b91681-70a7-45aa-a0e9-64af35931ce6
2ebc55cd-0e14-4fa6-9423-b8875ebcafe7	+543465416267	ENTRANTE	0	PERDIDA	1	2026-03-17 14:50:06.966+00	2026-03-17 14:50:07.666651+00	44b91681-70a7-45aa-a0e9-64af35931ce6
cfe638b5-4e0f-48e1-bd6e-9cd7d8a65fa0	+543465416267	SALIENTE	251	ATENDIDA	1	2026-03-17 15:05:11.242+00	2026-03-17 15:05:11.745033+00	44b91681-70a7-45aa-a0e9-64af35931ce6
94f2bebc-b91a-4be5-9b1e-792df3fe425c	+543425289516	ENTRANTE	23	ATENDIDA	6	2026-03-31 20:08:03.069+00	2026-03-31 20:08:06.217367+00	a135ea9c-bbbd-4906-8604-8d638f6d8e5f
157a427b-4ed9-4662-a8b5-1eb068a8ab84	+543425289516	ENTRANTE	22	ATENDIDA	6	2026-03-31 20:08:33.916+00	2026-03-31 20:08:35.926836+00	a135ea9c-bbbd-4906-8604-8d638f6d8e5f
df706c25-bbf8-411f-b867-57166ce5db56	+543425289516	ENTRANTE	29	ATENDIDA	6	2026-03-25 16:20:56.52+00	2026-03-25 16:20:58.632845+00	a135ea9c-bbbd-4906-8604-8d638f6d8e5f
89aa09a4-a5f2-4ddd-9bae-9850629309d6	+543492250282	ENTRANTE	431	ATENDIDA	6	2026-03-25 16:36:52.459+00	2026-03-25 16:36:54.920386+00	3f4c8cb8-609d-4dc1-9dcc-8f7ade1fb4ea
fbc4ae9c-b8d9-437b-9d6a-14e3f21fb6a8	+543492250282	SALIENTE	2	PERDIDA	6	2026-03-25 16:41:28.499+00	2026-03-25 16:41:31.374141+00	3f4c8cb8-609d-4dc1-9dcc-8f7ade1fb4ea
b12a5737-94c1-41c9-8ec9-40edbf61131e	+543572436778	SALIENTE	20	ATENDIDA	2	2026-03-18 13:39:05.885+00	2026-03-18 13:39:07.397494+00	a52e26e7-df4b-45ed-97e4-7c3c9994070a
7238676b-4adc-4414-8767-a5916c643c57	+543572436778	SALIENTE	790	ATENDIDA	2	2026-03-18 13:52:33.28+00	2026-03-18 13:52:34.509234+00	a52e26e7-df4b-45ed-97e4-7c3c9994070a
076aba30-02be-428d-b015-3a823e26f3d8	3406430604	ENTRANTE	49	ATENDIDA	3	2026-03-18 15:25:26.181+00	2026-03-18 15:25:29.889137+00	\N
e255547b-e606-436d-9283-2544febb54f2	+543492250282	ENTRANTE	365	ATENDIDA	6	2026-03-25 17:02:05.64+00	2026-03-25 17:02:08.436858+00	3f4c8cb8-609d-4dc1-9dcc-8f7ade1fb4ea
5938ec99-e999-414d-b85b-3b7ad2ff23ef	3564571124	ENTRANTE	0	PERDIDA	1	2026-03-17 15:00:36.901+00	2026-03-17 15:00:37.962369+00	137c3ce9-e634-41df-97d3-20b85716a255
64623ad8-ba3c-4dcd-b74f-63a49ecf80a0	3564571124	ENTRANTE	0	PERDIDA	2	2026-03-17 18:45:02.602+00	2026-03-17 18:45:04.414606+00	137c3ce9-e634-41df-97d3-20b85716a255
4ce9d071-fa2d-4b5a-bcfc-961b5c0d38d5	3564571124	ENTRANTE	0	PERDIDA	1	2026-03-17 18:45:28.79+00	2026-03-17 18:45:29.46832+00	137c3ce9-e634-41df-97d3-20b85716a255
d3495abe-a776-4eed-bebe-0753844b6957	3564571124	SALIENTE	1	PERDIDA	2	2026-03-17 18:46:42.557+00	2026-03-17 18:46:42.828319+00	137c3ce9-e634-41df-97d3-20b85716a255
ec1a1da1-7401-4b69-ac1b-42c2af9e968b	3564571124	ENTRANTE	0	PERDIDA	2	2026-03-17 18:48:36.373+00	2026-03-17 18:48:37.025071+00	137c3ce9-e634-41df-97d3-20b85716a255
c259002e-6921-4834-a506-ca2e76490dd7	3564571124	ENTRANTE	198	ATENDIDA	2	2026-03-18 18:47:07.344+00	2026-03-18 18:47:09.434712+00	137c3ce9-e634-41df-97d3-20b85716a255
9f5c1082-ee2c-45af-9f5c-229a466d2f86	3564571124	ENTRANTE	0	PERDIDA	1	2026-03-19 12:00:33.963+00	2026-03-19 12:00:36.05432+00	137c3ce9-e634-41df-97d3-20b85716a255
bb1f6b1a-15a4-4012-b619-8c4019f15545	3564571124	ENTRANTE	371	ATENDIDA	2	2026-03-19 12:04:12.192+00	2026-03-19 12:04:13.553411+00	137c3ce9-e634-41df-97d3-20b85716a255
72a8da52-7cd6-449d-8744-15de2b0b118b	2233033998	ENTRANTE	665	ATENDIDA	4	2026-03-19 17:10:15.558+00	2026-03-19 17:10:15.606728+00	\N
cac63fd4-6be8-442d-8709-b98cb2bf6179	+543417800086	ENTRANTE	0	PERDIDA	6	2026-03-17 16:19:11.618+00	2026-03-17 16:19:15.205783+00	a135ea9c-bbbd-4906-8604-8d638f6d8e5f
1f6b449d-f4b8-404f-aef6-69a938c27879	+543585408279	ENTRANTE	510	ATENDIDA	2	2026-03-19 18:02:11.309+00	2026-03-19 18:02:12.692048+00	34030c8d-a164-441b-80ef-bce02efae2c5
12c63e30-7491-4031-8c7d-b1e717855126	3472645405	ENTRANTE	117	ATENDIDA	4	2026-03-20 09:32:06.255+00	2026-03-20 09:32:07.921669+00	\N
559fb0ab-2deb-4205-abeb-37c6accf245c	+543471325009	ENTRANTE	38	ATENDIDA	1	2026-03-20 17:36:52.394+00	2026-03-20 17:36:53.616107+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
e6ec0c12-a9e7-4c49-905f-b345fc64644c	+543471325009	ENTRANTE	28	ATENDIDA	1	2026-03-20 17:37:57.841+00	2026-03-20 17:37:58.197045+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
a1acbdb7-269f-44a4-a4f2-c437980f1c6d	+5493471621310	SALIENTE	59	ATENDIDA	2	2026-03-20 20:19:02.667+00	2026-03-20 20:19:04.662607+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
9a5bf7fb-23cd-46a8-8a02-7cc4dbf7ca8a	+543471584313	ENTRANTE	0	PERDIDA	6	2026-03-22 15:55:36.879+00	2026-03-22 15:55:41.32132+00	\N
80e77683-8821-4fe0-a366-bea92fb8ad2b	+543471584313	ENTRANTE	0	PERDIDA	6	2026-03-22 16:28:19.051+00	2026-03-22 16:28:22.680861+00	\N
1e7aa055-ca7c-442d-b1c9-8b710828c0d1	+543471584313	SALIENTE	26	ATENDIDA	6	2026-03-22 16:29:19.145+00	2026-03-22 16:29:21.227183+00	\N
3378fa8b-9eeb-43e5-9cad-ff8fe1137a57	3517146320	ENTRANTE	0	PERDIDA	4	2026-03-23 11:35:13.723+00	2026-03-23 11:35:14.859958+00	\N
fdf8d18a-2a32-41fa-8cd9-185ba7c8d559	2921401962	ENTRANTE	90	ATENDIDA	4	2026-03-23 12:08:31.993+00	2026-03-23 12:08:33.041249+00	\N
bd246298-3e1a-4af5-8edb-248fe46393e4	3517146320	SALIENTE	3	PERDIDA	4	2026-03-23 15:53:24.816+00	2026-03-23 15:53:25.117599+00	\N
dc72d285-879a-405f-9fe1-ea68bc3f1f3b	3467632637	ENTRANTE	162	ATENDIDA	4	2026-03-23 15:53:24.73+00	2026-03-23 15:53:25.109703+00	\N
c532c53b-0f28-49ff-b607-91538fc8e514	+543471611264	ENTRANTE	56	ATENDIDA	1	2026-03-20 20:19:08.016+00	2026-03-20 20:19:08.745692+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
aef05f53-8bc4-43c0-8c1c-e74f6638acd3	2396615678	ENTRANTE	107	ATENDIDA	1	2026-03-17 17:30:00.839+00	2026-03-17 17:30:02.905965+00	9e9a6abf-7987-4bda-8146-69bf24b6028d
2e3de370-d37a-4c43-8740-6fb8efaa060c	2396615678	SALIENTE	38	ATENDIDA	1	2026-03-17 17:33:10.748+00	2026-03-17 17:33:11.758996+00	9e9a6abf-7987-4bda-8146-69bf24b6028d
44020be3-10ed-4929-bdf8-a4a1734d8719	+542478469577	ENTRANTE	63	ATENDIDA	2	2026-03-20 18:14:08.255+00	2026-03-20 18:14:10.728801+00	065bfe96-c79a-4edf-862d-56e6ba24bd68
063fe5eb-0c4c-4c36-aab7-72c7c89bc96a	+542478469577	ENTRANTE	0	PERDIDA	2	2026-03-20 18:14:08.257+00	2026-03-20 18:14:10.769218+00	065bfe96-c79a-4edf-862d-56e6ba24bd68
0f9d1350-479a-47d9-bb88-697617676617	+542478469577	ENTRANTE	0	PERDIDA	2	2026-03-20 18:14:08.256+00	2026-03-20 18:14:10.779161+00	065bfe96-c79a-4edf-862d-56e6ba24bd68
0779d5b2-c1b3-4726-b81a-979c004e168d	+542478469577	ENTRANTE	0	PERDIDA	2	2026-03-20 18:14:08.254+00	2026-03-20 18:14:10.794159+00	065bfe96-c79a-4edf-862d-56e6ba24bd68
70f1f2be-fd18-4135-8a25-2724acb0dd43	+542478469577	ENTRANTE	0	PERDIDA	2	2026-03-20 18:14:08.254+00	2026-03-20 18:14:10.790489+00	065bfe96-c79a-4edf-862d-56e6ba24bd68
a92e89a3-21a2-48d5-9621-3cb7f5a3553b	+542478469577	ENTRANTE	0	PERDIDA	2	2026-03-20 18:26:20.648+00	2026-03-20 18:26:22.903774+00	065bfe96-c79a-4edf-862d-56e6ba24bd68
1c8aebd7-ab31-4023-a4aa-f53e7af0e9fd	+542478469577	ENTRANTE	0	PERDIDA	2	2026-03-20 18:42:37.847+00	2026-03-20 18:42:40.635239+00	065bfe96-c79a-4edf-862d-56e6ba24bd68
4ff10215-c478-44e2-b6e5-d4cf816b4a86	+542478469577	ENTRANTE	0	PERDIDA	2	2026-03-20 19:11:52.183+00	2026-03-20 19:11:55.206795+00	065bfe96-c79a-4edf-862d-56e6ba24bd68
8a25def0-ce3b-41d1-b9f2-8614b6862f76	+5493471324850	SALIENTE	46	ATENDIDA	2	2026-03-20 14:27:48.301+00	2026-03-20 14:27:49.581135+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
56c7d5bd-d37a-4208-97c9-a1cb600e6045	2478510469	ENTRANTE	315	ATENDIDA	2	2026-03-25 12:05:57.556+00	2026-03-25 12:05:58.251633+00	065bfe96-c79a-4edf-862d-56e6ba24bd68
9b5b1d38-3219-4682-bf3d-931d7b30e0cb	+542494251654	ENTRANTE	0	PERDIDA	2	2026-03-25 13:01:08.427+00	2026-03-25 13:01:09.312297+00	\N
9d8053ea-a339-471a-b54c-57e215df0e22	+542478469577	ENTRANTE	181	ATENDIDA	2	2026-03-25 13:16:06.795+00	2026-03-25 13:16:09.099417+00	065bfe96-c79a-4edf-862d-56e6ba24bd68
30899aee-85f3-4e04-b065-86c2d874517c	+542478469577	SALIENTE	93	ATENDIDA	2	2026-03-25 15:01:31.524+00	2026-03-25 15:01:33.898068+00	065bfe96-c79a-4edf-862d-56e6ba24bd68
eb82b14c-feb7-4ff7-826a-060b4ce817f0	+542478469577	SALIENTE	28	ATENDIDA	2	2026-03-25 16:17:33.124+00	2026-03-25 16:17:35.438505+00	065bfe96-c79a-4edf-862d-56e6ba24bd68
9271810f-a1a4-47d2-aaed-e90432e9a569	+543471598860	ENTRANTE	41	ATENDIDA	6	2026-03-25 16:19:39.731+00	2026-03-25 16:19:42.400314+00	\N
5ce86d45-8c38-4244-9a4b-45d6b645ef69	+543492250762	ENTRANTE	0	PERDIDA	1	2026-03-25 11:20:30.627+00	2026-03-25 11:20:31.665381+00	3f4c8cb8-609d-4dc1-9dcc-8f7ade1fb4ea
aca9e5cd-15b9-468b-8d81-cbe93bdb6903	+543492250762	SALIENTE	196	ATENDIDA	1	2026-03-25 12:33:31.761+00	2026-03-25 12:33:32.851598+00	3f4c8cb8-609d-4dc1-9dcc-8f7ade1fb4ea
56c63e43-61fb-4300-b24d-a75d7561b5a3	+543462417970	ENTRANTE	356	ATENDIDA	1	2026-04-01 12:14:34.51+00	2026-04-01 12:14:35.480148+00	71fd6f82-d726-4ffc-abfc-44c62b71cb1d
b3686f6e-82ad-4535-8ad0-4d1085dc2402	3472435819	SALIENTE	0	PERDIDA	4	2026-04-01 15:38:12.912+00	2026-04-01 15:38:12.36814+00	\N
f98a8fd2-a323-45a4-a318-73be2d0bed6e	3573400227	ENTRANTE	551	ATENDIDA	3	2026-04-01 17:11:38.458+00	2026-04-01 17:11:38.735077+00	\N
546b6eb4-3688-48f2-8c48-09766fe63325	+5493583457710	SALIENTE	1	PERDIDA	1	2026-03-26 14:43:07.57+00	2026-03-26 14:43:08.662418+00	a42ebbbe-c30b-4e54-91ec-c668197ca1c2
a14f220d-d600-409a-b615-09b70c66c426	+5493583457710	SALIENTE	102	ATENDIDA	1	2026-03-26 14:45:49.625+00	2026-03-26 14:45:49.777647+00	a42ebbbe-c30b-4e54-91ec-c668197ca1c2
71938cee-58cc-4d15-8a93-fd58ce9ebdd9	+543493515557	ENTRANTE	220	ATENDIDA	1	2026-03-26 14:06:09.111+00	2026-03-26 14:06:10.215642+00	b0b48fcf-2d03-402f-90d5-2c1dae4115d7
fbf55c3a-4207-43a8-a781-05fbed39511e	+543492419329	ENTRANTE	486	ATENDIDA	1	2026-03-26 12:12:54.493+00	2026-03-26 12:12:55.600836+00	3f4c8cb8-609d-4dc1-9dcc-8f7ade1fb4ea
1410189f-0588-42c3-a400-ca8d911698dd	+543492419329	ENTRANTE	163	ATENDIDA	1	2026-03-26 13:13:10.76+00	2026-03-26 13:13:11.791124+00	3f4c8cb8-609d-4dc1-9dcc-8f7ade1fb4ea
47825493-53d0-40dd-a844-5a7d2ac00822	+543492419329	SALIENTE	2	PERDIDA	1	2026-03-26 13:17:11.104+00	2026-03-26 13:17:11.317731+00	3f4c8cb8-609d-4dc1-9dcc-8f7ade1fb4ea
c3a10a6f-0fdb-4d5c-a8ba-21060eef46a6	+543492419329	ENTRANTE	324	ATENDIDA	1	2026-03-26 13:23:04.226+00	2026-03-26 13:23:04.425243+00	3f4c8cb8-609d-4dc1-9dcc-8f7ade1fb4ea
512a0a1b-7049-419d-aed0-cde456fbc379	2923654443	ENTRANTE	361	ATENDIDA	1	2026-03-26 13:40:49.644+00	2026-03-26 13:40:50.565682+00	14f6e344-8634-4cd3-b386-ebd16e90d11f
8ad759cd-b088-4662-b718-8065484f4203	+543425289516	ENTRANTE	21	ATENDIDA	5	2026-03-31 20:09:43.467+00	2026-03-31 20:09:45.931025+00	a135ea9c-bbbd-4906-8604-8d638f6d8e5f
9934282f-5975-475d-a481-18ca10f13f47	+543425289516	ENTRANTE	24	ATENDIDA	6	2026-03-26 18:55:04.269+00	2026-03-26 18:55:22.280401+00	a135ea9c-bbbd-4906-8604-8d638f6d8e5f
5dccfd4a-26b0-4eac-bd3c-f303688520a8	2478510469	ENTRANTE	45	ATENDIDA	2	2026-03-26 18:30:13.744+00	2026-03-26 18:30:17.638481+00	065bfe96-c79a-4edf-862d-56e6ba24bd68
326ccdb0-c0f7-4f26-9560-05ecafc03e9d	+542281473228	ENTRANTE	145	ATENDIDA	6	2026-03-26 20:14:42.096+00	2026-03-26 20:14:45.831738+00	a3c00e1e-765d-4910-80e2-68253faacc2e
164973bd-977e-4b7a-b82e-626e188b14c2	+543471598860	ENTRANTE	23	ATENDIDA	5	2026-03-26 20:51:42.179+00	2026-03-26 20:51:44.870558+00	\N
f8028c0f-0f0f-42cc-9267-4bc2bcf383be	+543471598860	ENTRANTE	21	ATENDIDA	5	2026-03-26 20:52:11.899+00	2026-03-26 20:52:13.2958+00	\N
04523529-1d04-4950-93b2-b2cc13aeeb0d	+5493471324850	SALIENTE	64	ATENDIDA	1	2026-03-27 10:31:04.433+00	2026-03-27 10:31:05.451206+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
8f6e8f96-ac7e-4a37-b51c-2e49b0bb8087	+542281473228	ENTRANTE	0	PERDIDA	5	2026-03-26 20:51:42.179+00	2026-03-26 20:51:44.870515+00	a3c00e1e-765d-4910-80e2-68253faacc2e
b4d90205-c4b2-4609-b76e-b1be97c9d5a0	2478510469	ENTRANTE	62	ATENDIDA	2	2026-03-27 11:18:12.369+00	2026-03-27 11:18:12.895282+00	065bfe96-c79a-4edf-862d-56e6ba24bd68
4f5d564d-3e11-4717-9d84-a0527b7e910c	+543492419329	ENTRANTE	38	ATENDIDA	1	2026-03-27 11:41:51.668+00	2026-03-27 11:41:52.722497+00	3f4c8cb8-609d-4dc1-9dcc-8f7ade1fb4ea
b2354757-40bb-41d0-aae0-cf2f89bea11a	2478510469	SALIENTE	313	ATENDIDA	2	2026-03-27 11:51:16.028+00	2026-03-27 11:51:16.675089+00	065bfe96-c79a-4edf-862d-56e6ba24bd68
7a96fdea-2c0e-4cd0-8cf9-6182432364b0	+543492419329	ENTRANTE	129	ATENDIDA	1	2026-03-27 12:37:02.816+00	2026-03-27 12:37:04.000043+00	3f4c8cb8-609d-4dc1-9dcc-8f7ade1fb4ea
3c71fe99-3641-4410-a4cd-5d7f6f86aa28	+542281473228	ENTRANTE	0	PERDIDA	6	2026-03-27 16:17:10.08+00	2026-03-27 16:17:13.782009+00	a3c00e1e-765d-4910-80e2-68253faacc2e
2dadc1bf-edd1-4ecb-8d53-7781aefda6df	+543471572742	ENTRANTE	61	ATENDIDA	2	2026-03-27 13:37:57.749+00	2026-03-27 13:37:58.456618+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
ff130ea1-b894-4567-ad84-ae27c03ccbb1	+543471572742	SALIENTE	0	PERDIDA	2	2026-03-27 14:01:47.376+00	2026-03-27 14:01:48.012642+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
36fdbe93-66fe-42f3-8685-a11f05f89cf6	+543471572742	ENTRANTE	58	ATENDIDA	2	2026-03-27 14:04:56.195+00	2026-03-27 14:04:56.385256+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
78672092-c679-4b9a-96a8-22988d3a9b01	3471594751	SALIENTE	80	ATENDIDA	2	2026-03-27 14:14:55.922+00	2026-03-27 14:14:58.135496+00	\N
086b5dbb-f45d-459a-83c9-8597bdc30ade	3329539164	ENTRANTE	159	ATENDIDA	1	2026-03-27 16:46:11.151+00	2026-03-27 16:46:11.590366+00	6e62ea42-6211-41ae-b52a-6ea3f97db292
ed449c88-4f57-4da3-9061-efb0eefa15cf	+542281473228	ENTRANTE	0	PERDIDA	6	2026-03-27 16:28:22.061+00	2026-03-27 16:28:25.261778+00	a3c00e1e-765d-4910-80e2-68253faacc2e
40b3361f-5411-44f3-8488-e500e5e4156c	+543492681581	ENTRANTE	195	ATENDIDA	6	2026-03-27 15:13:18.884+00	2026-03-27 15:13:22.626049+00	a135ea9c-bbbd-4906-8604-8d638f6d8e5f
934bf0f0-861c-4d27-b43e-1796d6bf76bf	2364691644	ENTRANTE	406	ATENDIDA	2	2026-03-30 12:17:11.929+00	2026-03-30 12:17:12.511998+00	666a8a9b-9067-409d-b500-3c955be51f1c
6c4c819f-fdf1-49c7-88c8-9c1c17591c24	3572585409	ENTRANTE	41	ATENDIDA	2	2026-03-27 11:03:23.396+00	2026-03-27 11:03:23.980437+00	a52e26e7-df4b-45ed-97e4-7c3c9994070a
4038e395-e359-4bab-89e4-5ba612144c94	+543471325015	ENTRANTE	752	ATENDIDA	2	2026-03-26 16:52:35.807+00	2026-03-26 16:52:38.066257+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
9e551c40-4929-4c9c-b0a5-d87b90046ff2	+543471325015	ENTRANTE	652	ATENDIDA	2	2026-03-26 17:22:14.318+00	2026-03-26 17:22:16.59881+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
dd61bc75-58fe-48a1-9b32-967d46cb7b3c	+543471325015	ENTRANTE	145	ATENDIDA	2	2026-03-26 17:39:46.587+00	2026-03-26 17:39:48.492875+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
da308511-f4cd-4ee8-8055-988466459646	+5493471501886	SALIENTE	1	PERDIDA	1	2026-03-30 11:38:34.189+00	2026-03-30 11:38:35.282311+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
62414c95-b89a-4b09-a93d-646bce175119	+5493471579168	SALIENTE	28	ATENDIDA	1	2026-03-27 12:41:53.946+00	2026-03-27 12:41:54.688234+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
2b7c403b-7163-4bba-9654-d4ef5ec0e018	+543584307989	ENTRANTE	140	ATENDIDA	1	2026-03-26 19:25:16.778+00	2026-03-26 19:25:18.081638+00	d79f08ef-9a2a-4907-86a9-33bf3556ae53
ebc1097e-239a-4d59-988b-721f4e9bdd1d	3416749009	ENTRANTE	48	ATENDIDA	4	2026-03-30 14:40:54.119+00	2026-03-30 14:40:54.763359+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
2904ee1f-5e01-4c8e-b5d7-47d5fa2c8db5	02316400384	SALIENTE	3	PERDIDA	4	2026-03-30 14:53:57.594+00	2026-03-30 14:53:58.720918+00	\N
1ec398fe-78ca-4b9c-bffe-c47f54b90b77	2355556399	SALIENTE	0	PERDIDA	2	2026-03-30 15:16:51.493+00	2026-03-30 15:16:52.090526+00	7490c9a8-783a-43b5-ab9b-1c89b6bfafaf
29838597-1a37-4da3-94d4-8c78da75ec9f	2355556399	SALIENTE	259	ATENDIDA	2	2026-03-30 15:21:35.333+00	2026-03-30 15:21:35.492807+00	7490c9a8-783a-43b5-ab9b-1c89b6bfafaf
0790d6d9-0318-4c8e-8ffa-965074a94cc2	02316400384	SALIENTE	33	ATENDIDA	4	2026-03-30 15:25:11.722+00	2026-03-30 15:25:12.149773+00	\N
58c5fcd1-2187-42a2-bd15-616345705c7f	3472645405	ENTRANTE	63	ATENDIDA	4	2026-03-30 15:25:11.715+00	2026-03-30 15:25:12.154798+00	\N
0a3ac5cf-5222-4342-b12e-01973d53e9f7	3472645405	ENTRANTE	32	ATENDIDA	4	2026-03-30 15:26:12.664+00	2026-03-30 15:26:13.098435+00	\N
192b52b0-efe5-4cbb-8957-c1c3ca6e01a4	3471605705	SALIENTE	180	ATENDIDA	4	2026-03-31 11:42:53.542+00	2026-03-31 11:42:54.794422+00	\N
bec0c6e8-e574-4b4e-92f3-17179b685e76	3471605705	ENTRANTE	0	PERDIDA	4	2026-03-31 11:42:53.537+00	2026-03-31 11:42:54.793763+00	\N
a4cf5769-4390-4357-a742-87b18cd93955	+543468649932	ENTRANTE	169	ATENDIDA	6	2026-03-31 12:44:14.951+00	2026-03-31 12:44:17.433706+00	80d243ab-1170-4d38-921d-96bab86811b6
79cecdee-1598-4ee9-a58b-50821aba2eea	3471587666	ENTRANTE	253	ATENDIDA	4	2026-03-31 13:19:13.156+00	2026-03-31 13:19:14.280601+00	\N
8b8fba21-0dc0-45b8-95d3-9e5981920fae	+543471621310	ENTRANTE	28	ATENDIDA	5	2026-03-27 12:41:51.69+00	2026-03-27 12:41:54.074673+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
3709a353-46e3-4a2c-9316-b02ef48622d6	3583457710	ENTRANTE	375	ATENDIDA	1	2026-04-01 14:28:34.868+00	2026-04-01 14:28:35.873028+00	a42ebbbe-c30b-4e54-91ec-c668197ca1c2
c4e0ab87-b0b2-45b6-90b4-a0b65ccb6e96	+543471687948	ENTRANTE	190	ATENDIDA	1	2026-03-27 13:08:41.097+00	2026-03-27 13:08:41.752554+00	d63b04a4-92e8-4b87-88b0-8f197d35ad2f
02f8ea9b-41ef-4a6a-9a4f-9e2c010be3a0	+543462417970	ENTRANTE	347	ATENDIDA	1	2026-03-31 14:38:03.239+00	2026-03-31 14:38:04.34704+00	71fd6f82-d726-4ffc-abfc-44c62b71cb1d
d91c9271-d11d-40de-a02e-91d240bc235c	+543462417970	ENTRANTE	298	ATENDIDA	1	2026-03-31 15:23:51.829+00	2026-03-31 15:23:52.866391+00	71fd6f82-d726-4ffc-abfc-44c62b71cb1d
cdf0d0af-ca96-4656-b7f6-d0628462c9c5	+543462417970	SALIENTE	52	ATENDIDA	1	2026-03-31 15:51:01.5+00	2026-03-31 15:51:02.443257+00	71fd6f82-d726-4ffc-abfc-44c62b71cb1d
0b4471ca-d981-4df6-8aed-0e840ba8d8e0	+543471572742	ENTRANTE	0	PERDIDA	1	2026-04-01 20:33:33.034+00	2026-04-01 20:33:34.198077+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
0a22e376-ae4f-4b2d-b3e8-fb067a989fc2	+543471572742	ENTRANTE	0	PERDIDA	1	2026-04-01 21:29:28.649+00	2026-04-01 21:29:29.841182+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
1526d4de-974e-428e-a18d-b5002f82e543		ENTRANTE	3	PERDIDA	3	2026-04-04 13:55:56.609+00	2026-04-04 13:55:57.83825+00	\N
2da48373-ea9c-46dc-a990-cd39fe419055	3471526139	SALIENTE	369	ATENDIDA	6	2026-04-05 17:30:24.837+00	2026-04-05 17:30:28.072761+00	\N
de61d57f-a275-4a1c-a6b8-bae5e7be34df	+542923413490	ENTRANTE	0	PERDIDA	6	2026-03-31 20:17:24.373+00	2026-03-31 20:17:28.014833+00	c96fd791-45f4-4183-b6ae-956c53abeecb
8458852f-b746-41c7-a505-3c530a229c0f	+542923413490	ENTRANTE	0	PERDIDA	6	2026-03-31 21:16:28.339+00	2026-03-31 21:16:32.164561+00	c96fd791-45f4-4183-b6ae-956c53abeecb
57e1e6fb-4096-44ce-bfd4-3bb33003736d	+542923413490	ENTRANTE	527	ATENDIDA	6	2026-04-01 14:12:36.223+00	2026-04-01 14:12:39.256789+00	c96fd791-45f4-4183-b6ae-956c53abeecb
d3ca1002-0397-41b6-b662-11e157b8ddc6	+542923413490	ENTRANTE	276	ATENDIDA	6	2026-03-18 18:11:16.079+00	2026-03-18 18:11:20.034606+00	c96fd791-45f4-4183-b6ae-956c53abeecb
24d73a6d-03c9-48bd-a901-f9cebe9f87a7	+542923413490	ENTRANTE	126	ATENDIDA	6	2026-03-18 19:24:29.562+00	2026-03-18 19:24:33.609598+00	c96fd791-45f4-4183-b6ae-956c53abeecb
8ca3f462-e4d2-41d8-92f9-1d181148f8d6	+542923413490	ENTRANTE	0	PERDIDA	6	2026-03-18 21:28:39.581+00	2026-03-18 21:28:43.787534+00	c96fd791-45f4-4183-b6ae-956c53abeecb
ef5b6c52-6424-44b9-b3f9-fa7ddc43547c	+542923413490	ENTRANTE	0	PERDIDA	6	2026-03-18 21:30:18.033+00	2026-03-18 21:30:20.157678+00	c96fd791-45f4-4183-b6ae-956c53abeecb
9d828629-23f3-4848-9a4d-0357b18e0f9e	+542923413490	SALIENTE	177	ATENDIDA	6	2026-03-31 17:06:29.813+00	2026-03-31 17:06:32.549271+00	c96fd791-45f4-4183-b6ae-956c53abeecb
c75928e9-2247-4915-9905-f1ff58713726	+542923413490	ENTRANTE	16	ATENDIDA	6	2026-03-31 17:15:42.499+00	2026-03-31 17:15:45.41205+00	c96fd791-45f4-4183-b6ae-956c53abeecb
4f553b7b-b2e7-457e-b32e-271ce917d269	+542923413490	ENTRANTE	0	PERDIDA	6	2026-04-02 19:37:36.528+00	2026-04-02 19:37:40.243841+00	c96fd791-45f4-4183-b6ae-956c53abeecb
6b923e90-ee2a-492d-b365-7f7808ba2f1e	+542923413490	ENTRANTE	0	PERDIDA	6	2026-04-02 21:45:17.865+00	2026-04-02 21:45:21.620134+00	c96fd791-45f4-4183-b6ae-956c53abeecb
7db0b87b-2aa8-4ca9-950a-4fc67579c4f9	+543537588531	ENTRANTE	0	PERDIDA	6	2026-04-02 13:45:36.904+00	2026-04-02 13:45:40.587769+00	a135ea9c-bbbd-4906-8604-8d638f6d8e5f
9dbc3d89-7e35-4f9e-933b-1a8c9e3947c6	+543425289516	ENTRANTE	24	ATENDIDA	5	2026-03-26 18:56:30.092+00	2026-03-26 18:56:32.628018+00	a135ea9c-bbbd-4906-8604-8d638f6d8e5f
a3dac17d-9403-415c-8468-cf80825cad7b	+543425289516	ENTRANTE	29	ATENDIDA	5	2026-03-26 20:53:10.235+00	2026-03-26 20:53:11.602525+00	a135ea9c-bbbd-4906-8604-8d638f6d8e5f
acfcab2d-3060-4d28-a92c-ce90eaf16928	+543425289516	ENTRANTE	25	ATENDIDA	5	2026-03-26 20:53:42.311+00	2026-03-26 20:53:43.688802+00	a135ea9c-bbbd-4906-8604-8d638f6d8e5f
26685275-5e4e-4e0c-b33e-eea31290e1a9	+543425289516	ENTRANTE	25	ATENDIDA	5	2026-03-26 21:59:03.813+00	2026-03-26 21:59:06.710288+00	a135ea9c-bbbd-4906-8604-8d638f6d8e5f
34c3bfa5-7d8e-4a33-acde-f4ed7ad7ac3e	+543425289516	ENTRANTE	0	PERDIDA	5	2026-03-27 16:44:28.425+00	2026-03-27 16:44:30.574262+00	a135ea9c-bbbd-4906-8604-8d638f6d8e5f
e40ef51e-f3d7-4dbf-99f2-779aae7c8f6d	+543425289516	ENTRANTE	0	PERDIDA	6	2026-03-27 16:45:10.687+00	2026-03-27 16:45:14.219276+00	a135ea9c-bbbd-4906-8604-8d638f6d8e5f
e5f93dd2-3f44-4312-b605-5056d2a5d877	+543425289516	ENTRANTE	0	PERDIDA	5	2026-03-27 16:48:04.663+00	2026-03-27 16:48:06.641234+00	a135ea9c-bbbd-4906-8604-8d638f6d8e5f
50782b71-dd5d-4c56-b3cb-3fb872fd48a5	+543425289516	SALIENTE	53	ATENDIDA	5	2026-03-27 16:48:04.663+00	2026-03-27 16:48:06.92789+00	a135ea9c-bbbd-4906-8604-8d638f6d8e5f
08899c0c-211b-419c-a144-0efa51be5973	+543425289516	ENTRANTE	65	ATENDIDA	5	2026-03-27 17:13:04.306+00	2026-03-27 17:13:06.608999+00	a135ea9c-bbbd-4906-8604-8d638f6d8e5f
261d6991-1142-4494-8f78-24ee2fe3d91b	+543425289516	ENTRANTE	20	ATENDIDA	6	2026-03-31 11:40:54.048+00	2026-03-31 11:40:56.845065+00	a135ea9c-bbbd-4906-8604-8d638f6d8e5f
f4b96c7c-3545-45f0-a13b-478400a30a91	+543425289516	ENTRANTE	0	PERDIDA	5	2026-03-31 12:54:46.521+00	2026-03-31 12:54:48.738695+00	a135ea9c-bbbd-4906-8604-8d638f6d8e5f
9a5c4f18-1d5e-4954-8cbd-ecdf72ae9a6e	+543425289516	ENTRANTE	0	PERDIDA	5	2026-03-31 12:54:46.52+00	2026-03-31 12:54:48.741373+00	a135ea9c-bbbd-4906-8604-8d638f6d8e5f
77c3c3d4-0914-4d4c-a5e9-175afa850b9a	+543425289516	ENTRANTE	0	PERDIDA	5	2026-03-31 12:54:46.52+00	2026-03-31 12:54:48.741204+00	a135ea9c-bbbd-4906-8604-8d638f6d8e5f
ab05ce09-aa12-4686-b459-108738b7946d	+543425289516	ENTRANTE	27	ATENDIDA	6	2026-03-31 12:55:11.326+00	2026-03-31 12:55:14.306389+00	a135ea9c-bbbd-4906-8604-8d638f6d8e5f
01509bc4-b6cd-460b-a40c-2c7974e5b03a	+543471561162	ENTRANTE	120	ATENDIDA	5	2026-04-02 13:52:35.806+00	2026-04-02 13:52:38.277283+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
6907f949-2877-4bb4-b915-ad35b6555226	3472645405	ENTRANTE	0	PERDIDA	4	2026-04-06 11:04:08.737+00	2026-04-06 11:04:08.417716+00	\N
8cb01b01-9518-48b8-b54d-f3c6c49d3283	3472435819	ENTRANTE	0	PERDIDA	4	2026-04-06 11:04:08.752+00	2026-04-06 11:04:09.442087+00	\N
97222856-7693-432d-afba-83cd228d7a6e	+543471343991	ENTRANTE	32	ATENDIDA	10	2026-04-06 11:10:21.056+00	2026-04-06 11:10:22.623208+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
bee24e8c-592f-452c-b775-3d381e00944f	3329539164	ENTRANTE	0	PERDIDA	1	2026-04-06 11:57:58.18+00	2026-04-06 11:57:59.583608+00	6e62ea42-6211-41ae-b52a-6ea3f97db292
0a1308e5-8190-4b7d-a830-d86f9ce29433	*555	SALIENTE	5	PERDIDA	1	2026-04-06 11:59:19.421+00	2026-04-06 11:59:20.558252+00	\N
961c24f2-ec2b-4ebb-84cc-b3fb2c26ab45	3329539164	SALIENTE	0	PERDIDA	1	2026-04-06 13:39:18.713+00	2026-04-06 13:39:19.747724+00	6e62ea42-6211-41ae-b52a-6ea3f97db292
fa9373e9-1463-40e6-9d79-ce023bdba59f	3329539164	ENTRANTE	0	PERDIDA	1	2026-04-06 13:39:44.282+00	2026-04-06 13:39:44.570827+00	6e62ea42-6211-41ae-b52a-6ea3f97db292
428205a9-3754-4468-8915-eb393438a870	3329539164	SALIENTE	0	PERDIDA	1	2026-04-06 13:39:47.762+00	2026-04-06 13:39:48.049896+00	6e62ea42-6211-41ae-b52a-6ea3f97db292
c5172528-6cdc-44b2-9382-93d221df292d	+543406427559	ENTRANTE	0	PERDIDA	2	2026-04-06 14:08:10.021+00	2026-04-06 14:08:10.572502+00	2a5ce776-cf19-49bb-9a8e-90c8ef099ef6
7f338ec0-86fe-4104-a1af-8b4312a3796d	+543406427559	ENTRANTE	0	PERDIDA	1	2026-04-06 14:12:02.232+00	2026-04-06 14:12:03.393775+00	2a5ce776-cf19-49bb-9a8e-90c8ef099ef6
68606958-156c-4874-9453-d4c03a56c948	+543406427559	SALIENTE	0	PERDIDA	1	2026-04-06 14:29:15.341+00	2026-04-06 14:29:16.439925+00	2a5ce776-cf19-49bb-9a8e-90c8ef099ef6
8aa7c073-86d4-4daf-a844-72e9a2f169e8	+543406427559	SALIENTE	0	PERDIDA	1	2026-04-06 14:29:24.029+00	2026-04-06 14:29:24.321835+00	2a5ce776-cf19-49bb-9a8e-90c8ef099ef6
9a73c903-08aa-4e45-91ef-e38ffb0629c8	+543406427559	ENTRANTE	220	ATENDIDA	1	2026-04-06 14:46:10.065+00	2026-04-06 14:46:11.120566+00	2a5ce776-cf19-49bb-9a8e-90c8ef099ef6
3a41d8b0-9d69-4f27-9069-e9442b4bd6f0	2355556399	ENTRANTE	665	ATENDIDA	2	2026-04-06 15:09:32.483+00	2026-04-06 15:09:33.148237+00	7490c9a8-783a-43b5-ab9b-1c89b6bfafaf
b034eb4f-5ac2-4db3-9ec1-55f3ec2b6015	3329539164	SALIENTE	0	PERDIDA	1	2026-04-06 17:15:17.8+00	2026-04-06 17:15:19.119757+00	6e62ea42-6211-41ae-b52a-6ea3f97db292
3154a1aa-1c77-477d-959d-5ad48a3532e7	3329539164	SALIENTE	0	PERDIDA	1	2026-04-06 17:15:21.298+00	2026-04-06 17:15:21.589355+00	6e62ea42-6211-41ae-b52a-6ea3f97db292
2a711fd1-7669-475f-ae00-d9be0284ebf2	3329539164	SALIENTE	0	PERDIDA	1	2026-04-06 17:15:24.872+00	2026-04-06 17:15:25.185738+00	6e62ea42-6211-41ae-b52a-6ea3f97db292
40b76e05-57ca-4f24-a11a-d59543a464b2	3329539164	ENTRANTE	239	ATENDIDA	1	2026-04-06 17:21:09.952+00	2026-04-06 17:21:10.909707+00	6e62ea42-6211-41ae-b52a-6ea3f97db292
06289137-137f-4d6d-bbb8-ffb7864a72ed	2921401962	ENTRANTE	292	ATENDIDA	4	2026-04-07 09:48:47.985+00	2026-04-07 09:48:48.338292+00	\N
bd298183-3490-4be3-8f8b-bfee86f14793	+543471325015	ENTRANTE	0	PERDIDA	2	2026-04-07 11:54:35.94+00	2026-04-07 11:54:36.494205+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
8c8003ec-a381-4895-afb9-f756d00fcd7c	+543471325015	SALIENTE	109	ATENDIDA	2	2026-04-07 12:25:41.628+00	2026-04-07 12:25:41.904661+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
b9b2d08e-08be-4196-a50f-34cb38585fb0	+543471325015	SALIENTE	0	PERDIDA	2	2026-04-07 14:27:22.269+00	2026-04-07 14:27:23.532613+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
050d4f1f-1691-4924-b2e4-06f04d0dec6b	+543468649932	ENTRANTE	247	ATENDIDA	1	2026-04-07 14:52:07.998+00	2026-04-07 14:52:09.537303+00	80d243ab-1170-4d38-921d-96bab86811b6
f5bbb3ec-6d8a-4ba7-bd70-09736471c3c0	+543471343991	ENTRANTE	42	ATENDIDA	1	2026-04-07 15:35:16.588+00	2026-04-07 15:35:18.059923+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
bb7d7c15-ddbe-4763-8dee-64e80a4be168	+543471343991	ENTRANTE	20	ATENDIDA	10	2026-04-07 15:59:16.249+00	2026-04-07 15:59:17.101837+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
dfe55951-59d7-4c8b-9b0d-ee49d52256f7	+543471343991	ENTRANTE	0	PERDIDA	10	2026-04-07 16:33:42.436+00	2026-04-07 16:33:43.883717+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
3a9edbc3-2a7d-4a23-a49a-84bd9bd0a2fc	+543471343991	ENTRANTE	22	ATENDIDA	1	2026-04-07 17:01:40.688+00	2026-04-07 17:01:41.556797+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
f8b956a1-0131-4336-9d39-adebdc2f18c3	+543816537761	ENTRANTE	307	ATENDIDA	2	2026-04-08 12:21:21.128+00	2026-04-08 12:21:21.765803+00	\N
3d560d04-e2aa-46c3-8364-732dc27a55fa	3329539164	ENTRANTE	0	PERDIDA	1	2026-04-08 12:23:10.037+00	2026-04-08 12:23:10.934924+00	6e62ea42-6211-41ae-b52a-6ea3f97db292
ddeacc41-289e-4713-ab6b-0c1e1c286754	3472526482	ENTRANTE	580	ATENDIDA	4	2026-04-08 15:41:52.117+00	2026-04-08 15:41:51.856413+00	\N
f65aa35c-2b12-4422-a2d8-e09210da26de	3471563427	SALIENTE	47	ATENDIDA	2	2026-04-06 10:55:01.73+00	2026-04-06 10:55:02.259951+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
caa63483-1ed5-48b8-8504-786ed1895890	3471572742	SALIENTE	55	ATENDIDA	2	2026-04-06 11:59:45.85+00	2026-04-06 11:59:46.122398+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
c71f7622-4d4b-4972-bea4-c7202ba64bd7	+5493329621395	SALIENTE	0	PERDIDA	2	2026-04-07 14:28:08.144+00	2026-04-07 14:28:08.306117+00	6e62ea42-6211-41ae-b52a-6ea3f97db292
20c5e7bb-4353-40e8-ba6a-42bccf116e67	2392445225	ENTRANTE	0	PERDIDA	2	2026-04-06 19:18:39.883+00	2026-04-06 19:18:41.116571+00	5ca7bf9b-4eb6-4834-8d56-46da93dfc221
50030bc0-e3a9-497b-a6f7-970fd89e700e	3583414932	SALIENTE	0	PERDIDA	2	2026-04-06 11:50:55.558+00	2026-04-06 11:50:56.101071+00	a42ebbbe-c30b-4e54-91ec-c668197ca1c2
6579b26d-67eb-4f3c-8a5f-1ba656882130	3471571373	SALIENTE	1	PERDIDA	2	2026-04-06 10:53:42.883+00	2026-04-06 10:53:43.516849+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
f29df7d1-f5e7-45ab-848c-ea52092a87f5	+543471571373	ENTRANTE	147	ATENDIDA	2	2026-04-06 11:10:04.459+00	2026-04-06 11:10:04.756889+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
1c0f0bcb-ba35-4199-9777-8ea51505619a	2266536326	ENTRANTE	51	ATENDIDA	2	2026-04-09 12:12:07.258+00	2026-04-09 12:12:07.724459+00	c1f56e58-e436-4aaf-8653-162da3bc89a1
967af1d8-f6b4-4d2c-9696-b85445987127	+5493471621310	SALIENTE	2	PERDIDA	2	2026-04-09 12:25:54.397+00	2026-04-09 12:25:54.580603+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
a07ec837-8e13-4027-ae78-dbe7169c0b75	+542281473228	ENTRANTE	0	PERDIDA	6	2026-04-09 12:48:19.955+00	2026-04-09 12:48:22.600328+00	a3c00e1e-765d-4910-80e2-68253faacc2e
a8d26367-3a8a-4539-8118-c6e930db7542	+543471611264	ENTRANTE	39	ATENDIDA	10	2026-04-09 12:49:52.925+00	2026-04-09 12:49:54.47715+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
72cd4122-dd5a-4c5d-96f2-259dbbff53ea	+542215127500	ENTRANTE	0	PERDIDA	5	2026-04-09 12:57:15.577+00	2026-04-09 12:57:18.005121+00	\N
cbd8585b-12eb-409e-8338-46a63ed699b5	+542345498983	ENTRANTE	317	ATENDIDA	5	2026-04-09 12:57:15.573+00	2026-04-09 12:57:18.11984+00	\N
58fdeac3-93b7-481f-9b28-449b3a2c3b9e	+542281473228	ENTRANTE	416	ATENDIDA	5	2026-04-09 12:57:15.57+00	2026-04-09 12:57:18.169125+00	a3c00e1e-765d-4910-80e2-68253faacc2e
d33ee078-4c75-4dfa-8658-7dced5c66efd	+542281473228	ENTRANTE	26	ATENDIDA	5	2026-04-09 13:35:12.434+00	2026-04-09 13:35:14.81999+00	a3c00e1e-765d-4910-80e2-68253faacc2e
65d215f3-f3d4-48b1-b72f-9dff16d03e34	+543471572742	ENTRANTE	53	ATENDIDA	2	2026-04-09 16:24:26.413+00	2026-04-09 16:24:26.96927+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
421f4161-6fc9-4321-bd83-b3b74003c2eb	3329539164	ENTRANTE	154	ATENDIDA	1	2026-04-10 11:48:34.051+00	2026-04-10 11:48:34.55316+00	6e62ea42-6211-41ae-b52a-6ea3f97db292
38d9d2ca-d93c-4750-a414-fd486ac50dcd	+543406427559	ENTRANTE	0	PERDIDA	2	2026-04-10 15:19:47.074+00	2026-04-10 15:19:47.208967+00	2a5ce776-cf19-49bb-9a8e-90c8ef099ef6
eaa43062-da2a-4b38-90cb-c7764d7d6c84	+543406427559	SALIENTE	101	ATENDIDA	2	2026-04-10 15:25:57.96+00	2026-04-10 15:25:58.099044+00	2a5ce776-cf19-49bb-9a8e-90c8ef099ef6
f6dfa7ea-7b60-4ff5-a28d-51e3f4f89bed	+543471343991	ENTRANTE	25	ATENDIDA	10	2026-04-13 13:39:27.189+00	2026-04-13 13:39:28.000962+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
e75548ac-8eb3-4ce7-be47-d1d13ade8b87		ENTRANTE	18	ATENDIDA	3	2026-04-13 13:46:30.838+00	2026-04-13 13:46:30.582643+00	\N
930823ca-09f0-4c93-8d4e-112a609fe033	+543877587323	ENTRANTE	283	ATENDIDA	2	2026-04-14 12:34:51.429+00	2026-04-14 12:34:51.582998+00	\N
1b3aaaee-eebf-4ddb-9a16-b3c952a07ba1	+543471325009	ENTRANTE	0	PERDIDA	2	2026-04-14 14:05:14.529+00	2026-04-14 14:05:14.663362+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
7e55ceb6-e48b-4dfa-8d68-d0496da9c4b0	2281370464	ENTRANTE	304	ATENDIDA	3	2026-04-14 16:50:58.845+00	2026-04-14 16:50:58.02072+00	\N
fdd0e00d-d2f2-44ef-a6cd-82ed6418df03	2281370464	ENTRANTE	147	ATENDIDA	3	2026-04-14 17:14:19.129+00	2026-04-14 17:14:18.819856+00	\N
126c3a42-b779-40a1-b685-270bf47b1254	+543406427559	ENTRANTE	87	ATENDIDA	2	2026-04-14 18:34:03.913+00	2026-04-14 18:34:04.046022+00	2a5ce776-cf19-49bb-9a8e-90c8ef099ef6
a532745b-8808-4a66-9ba8-7a33ced4cbba	+543406427559	ENTRANTE	0	PERDIDA	1	2026-04-14 18:35:23.958+00	2026-04-14 18:35:24.600878+00	2a5ce776-cf19-49bb-9a8e-90c8ef099ef6
1e69e4c4-7ee4-4503-8cd9-c2006940f8a6	+543406427559	ENTRANTE	0	PERDIDA	1	2026-04-14 18:36:15.858+00	2026-04-14 18:36:16.280363+00	2a5ce776-cf19-49bb-9a8e-90c8ef099ef6
b0c9dcef-8daa-45bc-8978-80389e9a7487	2266536326	ENTRANTE	0	PERDIDA	2	2026-04-14 19:19:27.342+00	2026-04-14 19:19:27.478883+00	c1f56e58-e436-4aaf-8653-162da3bc89a1
6f98e52e-f643-473f-a3ba-03c73014d22b	2266536326	ENTRANTE	0	PERDIDA	1	2026-04-14 19:19:48.37+00	2026-04-14 19:19:49.113074+00	c1f56e58-e436-4aaf-8653-162da3bc89a1
c0c80439-2151-4218-8cd5-9e78f55ee8fb	2266536326	ENTRANTE	0	PERDIDA	2	2026-04-14 19:21:15.97+00	2026-04-14 19:21:16.114923+00	c1f56e58-e436-4aaf-8653-162da3bc89a1
f0781136-cff3-482e-ac73-c6cbf4eacfca	2266536326	ENTRANTE	0	PERDIDA	1	2026-04-14 19:21:53.498+00	2026-04-14 19:21:53.976304+00	c1f56e58-e436-4aaf-8653-162da3bc89a1
c34789ed-4ad3-413a-be74-5e1cfc375885	2266536326	ENTRANTE	17	ATENDIDA	2	2026-04-14 19:24:39.87+00	2026-04-14 19:24:40.027107+00	c1f56e58-e436-4aaf-8653-162da3bc89a1
fce484e5-6d15-4e86-abba-2e08ae364581	2266536326	ENTRANTE	8	PERDIDA	2	2026-04-14 19:25:50.803+00	2026-04-14 19:25:50.943265+00	c1f56e58-e436-4aaf-8653-162da3bc89a1
f49ee697-7406-48e5-812e-ef97e7d9858b	2266536326	ENTRANTE	16	ATENDIDA	2	2026-04-14 19:30:56.453+00	2026-04-14 19:30:56.627532+00	c1f56e58-e436-4aaf-8653-162da3bc89a1
b2e68729-e1c3-4ee0-989a-427c7babb608	2266536326	SALIENTE	489	ATENDIDA	2	2026-04-14 19:44:36.372+00	2026-04-14 19:44:36.517305+00	c1f56e58-e436-4aaf-8653-162da3bc89a1
735c34d5-ceb7-4dbd-afc1-599b2d6305df	3572585409	ENTRANTE	191	ATENDIDA	2	2026-04-15 12:02:52.977+00	2026-04-15 12:02:53.127876+00	a52e26e7-df4b-45ed-97e4-7c3c9994070a
e8c86ce8-fc65-4b95-b8f6-1060b5e4be7f	+5492478510469	ENTRANTE	0	PERDIDA	3	2026-04-16 19:25:19.333+00	2026-04-16 19:25:20.202571+00	\N
ce2b67c6-a948-4380-88da-086452dc3adc	+5492478510469	SALIENTE	176	ATENDIDA	3	2026-04-16 19:28:46.302+00	2026-04-16 19:28:50.976485+00	\N
9161cdee-6d7b-487d-bc23-c1dc8ea081cd	+543816686464	ENTRANTE	0	PERDIDA	1	2026-04-11 20:49:43.652+00	2026-04-11 20:49:44.167487+00	d63b04a4-92e8-4b87-88b0-8f197d35ad2f
0ea49e93-64e6-42dc-a355-b144dfd286e7	+543816686464	ENTRANTE	0	PERDIDA	1	2026-04-11 20:49:45.871+00	2026-04-11 20:49:46.400735+00	d63b04a4-92e8-4b87-88b0-8f197d35ad2f
f184b6a0-fdbf-490b-b2ff-578e308692b8	+543816686464	ENTRANTE	0	PERDIDA	1	2026-04-11 20:52:29.529+00	2026-04-11 20:52:30.220889+00	d63b04a4-92e8-4b87-88b0-8f197d35ad2f
800e1907-c2a9-42b6-a032-bf513f7924ab	+543816686464	ENTRANTE	0	PERDIDA	1	2026-04-11 21:08:32.16+00	2026-04-11 21:08:33.806104+00	d63b04a4-92e8-4b87-88b0-8f197d35ad2f
10445901-4937-4b3d-a4ed-40fce29cdcd4	+543816686464	ENTRANTE	0	PERDIDA	1	2026-04-11 21:21:54.735+00	2026-04-11 21:21:55.282188+00	d63b04a4-92e8-4b87-88b0-8f197d35ad2f
b8561e2e-abb5-4d55-9c51-98e0a4c019af	+543816686464	ENTRANTE	0	PERDIDA	1	2026-04-11 21:26:42.321+00	2026-04-11 21:26:42.859826+00	d63b04a4-92e8-4b87-88b0-8f197d35ad2f
00ce7b09-8623-467e-8536-e78ac29cfd78	+543406401597	ENTRANTE	0	PERDIDA	1	2026-04-06 13:19:29.066+00	2026-04-06 13:19:30.379667+00	2a5ce776-cf19-49bb-9a8e-90c8ef099ef6
55747f42-0cdf-42a7-a9c7-4ac9f9412d1c	3583457710	SALIENTE	2	PERDIDA	1	2026-04-01 17:53:52.959+00	2026-04-01 17:53:54.106922+00	a42ebbbe-c30b-4e54-91ec-c668197ca1c2
c9cd798f-645b-4be0-8a3c-aad2698459cd	3471563427	SALIENTE	0	PERDIDA	2	2026-04-15 11:00:31.76+00	2026-04-15 11:00:31.92028+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
fb923479-8f3e-4dd5-88c8-f884a137a35d	+5493583414932	SALIENTE	113	ATENDIDA	2	2026-04-10 14:44:45.84+00	2026-04-10 14:44:45.988244+00	a42ebbbe-c30b-4e54-91ec-c668197ca1c2
31e5ee65-e1dc-4012-9ce7-c6d8eb02f2e0	+543576653679	ENTRANTE	316	ATENDIDA	2	2026-04-09 12:45:05.289+00	2026-04-09 12:45:05.761925+00	a468272b-690a-4cc6-9c58-9733da81e0e4
b6f4bf4a-90c8-4221-8f52-cf0c421cd1a6	+543576653679	SALIENTE	17	ATENDIDA	2	2026-04-09 14:16:57.311+00	2026-04-09 14:16:57.523872+00	a468272b-690a-4cc6-9c58-9733da81e0e4
15fe4aee-de54-4482-9177-b8c728bcbca9	+543576653679	SALIENTE	97	ATENDIDA	2	2026-04-09 14:22:36.811+00	2026-04-09 14:22:37.721882+00	a468272b-690a-4cc6-9c58-9733da81e0e4
fd572165-b3ab-4d4a-beb8-cb6bde5ffe2e	+543576653679	SALIENTE	2	PERDIDA	2	2026-04-09 14:46:16.74+00	2026-04-09 14:46:17.365957+00	a468272b-690a-4cc6-9c58-9733da81e0e4
226053bb-1bf9-43a9-a4d9-d1f89e3811f3	+543576653679	SALIENTE	284	ATENDIDA	2	2026-04-09 14:52:15.114+00	2026-04-09 14:52:16.013523+00	a468272b-690a-4cc6-9c58-9733da81e0e4
1cc4838c-003a-4890-ad4c-3d5d33c15cd3	+543576653679	SALIENTE	2	PERDIDA	2	2026-04-14 15:02:35.563+00	2026-04-14 15:02:35.726024+00	a468272b-690a-4cc6-9c58-9733da81e0e4
da65e9d8-9720-4a7b-abbf-8ad937c04381	2302579817	ENTRANTE	141	ATENDIDA	2	2026-04-09 13:11:51.834+00	2026-04-09 13:11:52.504556+00	2b2c7f5b-f516-4cb1-92ac-e5a165c8c65e
f0de5415-48e9-402a-8be1-91698ecccbd2	3471325014	SALIENTE	38	ATENDIDA	2	2026-04-09 12:49:52.527+00	2026-04-09 12:49:52.885917+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
557f131c-3597-41b3-81ae-5af41c3fd3a9	+543816447500	ENTRANTE	201	ATENDIDA	2	2026-04-08 18:38:54.072+00	2026-04-08 18:38:54.348369+00	feffb7c2-c84e-47fc-82a6-c1d2e9e089a3
4e6395f4-0b9f-4e95-a75b-d4d5855b061a	+5493877530604	SALIENTE	60	ATENDIDA	2	2026-04-08 17:48:21.032+00	2026-04-08 17:48:21.161452+00	b9a3e1b1-82df-4a45-8e6b-1e27f4b01191
360c1208-4540-423b-a966-a7b42f731722	+5493877530612	SALIENTE	2	PERDIDA	2	2026-04-08 17:47:05.778+00	2026-04-08 17:47:05.933924+00	b9a3e1b1-82df-4a45-8e6b-1e27f4b01191
b93a0a01-edb5-4c42-b7d2-01f56a58e318	3471325009	ENTRANTE	0	PERDIDA	2	2026-04-08 17:43:24.069+00	2026-04-08 17:43:24.202419+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
da7561f7-87f9-4aaa-acca-8c945c366354	3471572742	SALIENTE	0	PERDIDA	2	2026-04-06 12:06:23.266+00	2026-04-06 12:06:23.445368+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
5bc64f80-2ccd-45f2-a248-6519b508a2a7	3471572742	SALIENTE	55	ATENDIDA	2	2026-04-08 12:44:49.264+00	2026-04-08 12:44:49.608099+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
68681b72-d305-40b5-8067-e2a17c3b4c58	3471572742	SALIENTE	55	ATENDIDA	2	2026-04-08 17:42:47.36+00	2026-04-08 17:42:47.663124+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
bec09bdc-1c76-41d0-8ca2-b83a781e7490	2923442814	ENTRANTE	538	ATENDIDA	1	2026-04-15 14:01:38.607+00	2026-04-15 14:01:39.093922+00	660ef190-3fc0-404e-8c38-a685371838f6
2272152f-73dc-458a-abc6-392078353b86	3329539164	ENTRANTE	473	ATENDIDA	1	2026-04-20 18:35:53.28+00	2026-04-20 18:35:53.733698+00	6e62ea42-6211-41ae-b52a-6ea3f97db292
290eb97c-1fc3-4368-9abb-902763d98567	3329621395	ENTRANTE	506	ATENDIDA	2	2026-04-20 18:41:57.454+00	2026-04-20 18:41:57.5913+00	6e62ea42-6211-41ae-b52a-6ea3f97db292
00a99841-ca2e-455a-bd14-519966268fa6	2923442814	ENTRANTE	484	ATENDIDA	1	2026-04-21 12:22:08.415+00	2026-04-21 12:22:08.825081+00	660ef190-3fc0-404e-8c38-a685371838f6
69d303e2-6a54-4c4d-9653-2d14587f4ab2	+5493471324850	SALIENTE	37	ATENDIDA	2	2026-04-21 16:26:49.669+00	2026-04-21 16:26:50.080482+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
9efb9f5a-0862-4ead-9daf-9724a3b3af38	3471563427	SALIENTE	41	ATENDIDA	2	2026-04-21 16:44:21.583+00	2026-04-21 16:44:21.733149+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
d4667ab8-bf4e-4b14-90f4-46cfc4dfdfca	+5493471324850	SALIENTE	30	ATENDIDA	2	2026-04-21 16:50:14.157+00	2026-04-21 16:50:14.325208+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
1d79a49a-2551-4bc9-9493-4ff7b951c109	3329539164	ENTRANTE	298	ATENDIDA	1	2026-04-21 20:15:02.617+00	2026-04-21 20:15:03.098232+00	6e62ea42-6211-41ae-b52a-6ea3f97db292
30dd9157-2ec5-4f6e-9636-859652b10b26	*555	SALIENTE	14	PERDIDA	1	2026-04-22 09:17:11.096+00	2026-04-22 09:17:11.527103+00	\N
a4c29962-bbe4-4e10-8fcb-b845c32e2c35	*555	SALIENTE	3	PERDIDA	1	2026-04-22 09:17:31.288+00	2026-04-22 09:17:31.725037+00	\N
04d38038-d697-4aea-9bae-b790c5c9bafb	+543471572742	ENTRANTE	80	ATENDIDA	2	2026-04-22 17:04:36.688+00	2026-04-22 17:04:36.847252+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
cb3b2a54-df4e-4ebc-acdd-aca0d94bb6d7	+543471572742	ENTRANTE	85	ATENDIDA	2	2026-04-22 17:10:28.73+00	2026-04-22 17:10:39.212044+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
ac7d5640-e478-4263-b8c5-435e3f66cdbc	+543471572742	ENTRANTE	85	ATENDIDA	2	2026-04-22 17:12:31.772+00	2026-04-22 17:12:32.631642+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
102a7705-8c85-4470-a418-1aae720ead7b	+5493471593075	SALIENTE	191	ATENDIDA	2	2026-04-22 17:19:25.475+00	2026-04-22 17:19:30.308721+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
46a21e25-e597-4f8b-ba73-c71bc41b7e9a	3525641516	ENTRANTE	226	ATENDIDA	1	2026-04-22 17:25:04.611+00	2026-04-22 17:25:05.115197+00	\N
b3948cc3-0e1d-452f-b70c-16ce5d39b24f	+543471572742	ENTRANTE	0	PERDIDA	2	2026-04-22 17:45:11.495+00	2026-04-22 17:45:11.629631+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
2531905e-6053-4bed-97b0-0b6b2355067c	+543471572742	SALIENTE	62	ATENDIDA	2	2026-04-22 18:00:55.222+00	2026-04-22 18:00:55.358059+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
8c58c74d-b638-4cce-b880-f3d68c7a75b9	2478510469	ENTRANTE	0	PERDIDA	2	2026-04-23 15:58:24.613+00	2026-04-23 15:58:24.754785+00	065bfe96-c79a-4edf-862d-56e6ba24bd68
a6485327-6d9d-4a19-b69d-03b3c27bb4a5	2478510469	SALIENTE	214	ATENDIDA	2	2026-04-23 16:46:08.987+00	2026-04-23 16:46:09.143819+00	065bfe96-c79a-4edf-862d-56e6ba24bd68
e6b4d6bd-8c7c-497c-8a31-cfcc88a63802	2923442814	ENTRANTE	175	ATENDIDA	1	2026-04-27 10:52:46.242+00	2026-04-27 10:52:46.450678+00	660ef190-3fc0-404e-8c38-a685371838f6
570624b0-13a3-450a-888a-ead8c65cdc39	+5493471324850	SALIENTE	81	ATENDIDA	1	2026-04-27 10:55:09.304+00	2026-04-27 10:55:09.518092+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
0a7a1423-96b2-45ed-957e-c3c726c6036d	3564571124	ENTRANTE	112	ATENDIDA	2	2026-04-27 15:23:01.567+00	2026-04-27 15:23:01.700815+00	137c3ce9-e634-41df-97d3-20b85716a255
14614183-9050-41f5-837c-39fbcc254c9e	+5492478510469	SALIENTE	25	ATENDIDA	3	2026-04-27 20:54:52.071+00	2026-04-27 20:54:53.405821+00	\N
57e57784-f1da-4712-83c0-7efa6bf511ad	+543471592234	ENTRANTE	33	ATENDIDA	2	2026-04-27 17:56:32.41+00	2026-04-27 17:56:32.545161+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
d7db103d-3b64-41fd-880b-71afabdbaba7	2302626635	ENTRANTE	0	PERDIDA	2	2026-04-27 14:57:36.376+00	2026-04-27 14:57:36.511461+00	b7196a4e-021d-4077-92a8-708e237ab6d8
b3a9ef48-0c5c-4fa9-ab22-b0d17e12236a	2302626635	ENTRANTE	161	ATENDIDA	1	2026-04-27 15:00:50.433+00	2026-04-27 15:00:50.633853+00	b7196a4e-021d-4077-92a8-708e237ab6d8
d166b760-e26d-4ed3-ad56-5d2fbbd3288a	2302626635	SALIENTE	45	ATENDIDA	1	2026-04-27 15:05:42.262+00	2026-04-27 15:05:42.472072+00	b7196a4e-021d-4077-92a8-708e237ab6d8
5a9df9b0-cd8c-4592-bf0e-7d6dd58b1def	+5492331401082	SALIENTE	0	PERDIDA	1	2026-04-27 15:01:40.924+00	2026-04-27 15:01:41.115884+00	2b2c7f5b-f516-4cb1-92ac-e5a165c8c65e
53bb3fa1-3338-48bf-b79e-4a529199fa2b	+5492331401082	SALIENTE	141	ATENDIDA	1	2026-04-27 15:04:33.487+00	2026-04-27 15:04:33.766719+00	2b2c7f5b-f516-4cb1-92ac-e5a165c8c65e
a4219774-e1ba-487f-b149-79e77269468c	+543471621311	ENTRANTE	0	PERDIDA	1	2026-04-27 14:09:05.024+00	2026-04-27 14:09:05.244147+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
154d6933-978e-4a8a-a5bb-61904a02954f	+543471621311	SALIENTE	6	PERDIDA	1	2026-04-27 14:09:38.546+00	2026-04-27 14:09:38.746787+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
5fd66e14-eb68-46f0-b735-b58ebc430b4c	3564607979	ENTRANTE	205	ATENDIDA	1	2026-04-24 16:41:13.493+00	2026-04-24 16:41:13.988321+00	137c3ce9-e634-41df-97d3-20b85716a255
c6eb3d5f-39b7-4cd0-95aa-19b2aa54b305	3564607979	SALIENTE	74	ATENDIDA	1	2026-04-24 17:38:13.373+00	2026-04-24 17:38:13.784637+00	137c3ce9-e634-41df-97d3-20b85716a255
f848feb1-8dcb-4cff-93db-b6049f152a78	3564607979	ENTRANTE	0	PERDIDA	1	2026-04-24 19:02:58.943+00	2026-04-24 19:02:59.414824+00	137c3ce9-e634-41df-97d3-20b85716a255
f9de6a21-08ed-4808-b59a-d545f95f28eb	3564607979	SALIENTE	109	ATENDIDA	1	2026-04-24 19:11:26.802+00	2026-04-24 19:11:27.25119+00	137c3ce9-e634-41df-97d3-20b85716a255
eb624374-5165-447b-ac0a-d4819e39516a	2262412318	ENTRANTE	217	ATENDIDA	1	2026-04-24 13:51:06.715+00	2026-04-24 13:51:07.156096+00	5927aa4a-75d5-4b12-8e7d-3cccc796633f
45d427fe-870c-4bcd-82b7-53c8e78969ee	+542494585898	ENTRANTE	1103	ATENDIDA	2	2026-04-20 12:52:31.271+00	2026-04-20 12:52:31.442019+00	33138a0a-2776-4292-ad3f-bf321795b99e
36c9ef5b-1ba5-4734-a2ba-3162433c8b65	+542494585898	ENTRANTE	14	PERDIDA	1	2026-04-23 17:00:14.122+00	2026-04-23 17:00:14.562396+00	33138a0a-2776-4292-ad3f-bf321795b99e
14ed3546-76c7-4329-8983-7080d549803b	+542494585898	ENTRANTE	186	ATENDIDA	1	2026-04-23 17:03:11.499+00	2026-04-23 17:03:11.936954+00	33138a0a-2776-4292-ad3f-bf321795b99e
d577dd59-67fb-465a-a0a9-a7f6dd7a9ff3	3584300005	ENTRANTE	147	ATENDIDA	3	2026-04-28 12:25:08.493+00	2026-04-28 12:25:09.388036+00	\N
dbfde30b-a3da-4856-ae67-b49ce866a59c	+543471572742	ENTRANTE	1005	ATENDIDA	2	2026-04-28 18:37:31.154+00	2026-04-28 18:37:31.298104+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
dd558840-e98e-4861-864b-7713dc02c86e	+59176010028	SALIENTE	0	PERDIDA	2	2026-04-28 10:51:48.962+00	2026-04-28 10:51:49.122056+00	bf8617ee-32ff-468c-bc50-8db74fe49d3f
5038c8ca-7d2c-4f9c-bdaa-abe44fa69481	+59171011347	SALIENTE	8	PERDIDA	1	2026-04-28 10:49:20.947+00	2026-04-28 10:49:21.149121+00	bf8617ee-32ff-468c-bc50-8db74fe49d3f
0eefd021-8993-421e-9df4-c5a8d51b3555	+59171011347	SALIENTE	0	PERDIDA	2	2026-04-28 10:49:58.507+00	2026-04-28 10:49:58.648894+00	bf8617ee-32ff-468c-bc50-8db74fe49d3f
024059b6-dc71-4d89-b1de-09f58cbb6923	+5493525641516	SALIENTE	220	ATENDIDA	1	2026-04-29 11:40:09.147+00	2026-04-29 11:40:09.357773+00	\N
e613c467-d839-49f6-b0c5-3849a1e44376	+5493576653679	SALIENTE	309	ATENDIDA	1	2026-04-29 12:05:35.437+00	2026-04-29 12:05:35.670283+00	a468272b-690a-4cc6-9c58-9733da81e0e4
6698b0af-2731-47da-81ba-ad38f97301f1	+543468649932	ENTRANTE	523	ATENDIDA	1	2026-04-29 12:58:37.185+00	2026-04-29 12:58:37.656968+00	80d243ab-1170-4d38-921d-96bab86811b6
919351be-f30b-4e58-829a-a4a945fb90b7	+543471579415	SALIENTE	2	PERDIDA	1	2026-04-29 13:34:04.676+00	2026-04-29 13:34:04.876153+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
2388e02d-0f1b-479a-93c1-31daba61b4ac	+543471579415	SALIENTE	518	ATENDIDA	1	2026-04-29 13:42:59.591+00	2026-04-29 13:42:59.789838+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
4df369e9-ab3d-4397-9589-257544283b59	+543468649932	ENTRANTE	714	ATENDIDA	1	2026-04-29 14:17:34.308+00	2026-04-29 14:17:34.584138+00	80d243ab-1170-4d38-921d-96bab86811b6
65bf32ff-d834-4882-bdce-a3ef993ce8d1	+543468649932	ENTRANTE	522	ATENDIDA	1	2026-04-29 15:18:20.052+00	2026-04-29 15:18:20.261005+00	80d243ab-1170-4d38-921d-96bab86811b6
65420b51-a2be-498e-8400-e0c67d28df54	+543576653679	ENTRANTE	209	ATENDIDA	1	2026-04-29 17:12:46.2+00	2026-04-29 17:12:46.613013+00	a468272b-690a-4cc6-9c58-9733da81e0e4
4521e38b-c93c-4ff5-a106-e70e1630a74a	+543468649932	ENTRANTE	0	PERDIDA	5	2026-04-29 17:35:44.054+00	2026-04-29 17:35:48.21117+00	80d243ab-1170-4d38-921d-96bab86811b6
fc35027c-3892-4f73-b560-e5c35b475b74	+543534200042	ENTRANTE	223	ATENDIDA	5	2026-04-29 17:35:44.05+00	2026-04-29 17:35:48.209166+00	\N
3af60e14-820f-4ba1-bbd7-cb230ccd8b4d	+543468649932	ENTRANTE	0	PERDIDA	5	2026-04-29 17:35:44.097+00	2026-04-29 17:35:48.230651+00	80d243ab-1170-4d38-921d-96bab86811b6
d7d386d0-06e9-4493-b8b0-9be59bff97c4	+5493534200042	SALIENTE	170	ATENDIDA	5	2026-04-29 17:35:44.055+00	2026-04-29 17:35:48.39606+00	\N
3e884267-61a6-4e6b-b6e2-2021062468d8	+543471579415	ENTRANTE	498	ATENDIDA	1	2026-04-30 15:07:46.045+00	2026-04-30 15:07:46.296872+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
425a0727-5881-4a9c-b2e5-4fe0cb158811	+543583416033	ENTRANTE	497	ATENDIDA	2	2026-04-29 18:24:56.166+00	2026-04-29 18:24:56.325514+00	a42ebbbe-c30b-4e54-91ec-c668197ca1c2
4b935b83-0eee-4be3-b6af-3663c974d453	+543583416033	ENTRANTE	0	PERDIDA	2	2026-04-30 18:24:14.973+00	2026-04-30 18:24:15.118706+00	a42ebbbe-c30b-4e54-91ec-c668197ca1c2
57905ac7-6fb2-4138-b87e-ef023fc544d5	+543583416033	SALIENTE	703	ATENDIDA	2	2026-04-30 18:37:00.352+00	2026-04-30 18:37:00.492714+00	a42ebbbe-c30b-4e54-91ec-c668197ca1c2
71250e97-0bf8-482e-914c-20eedadcb544	+5493471593078	SALIENTE	504	ATENDIDA	1	2026-04-30 17:41:04.213+00	2026-04-30 17:41:04.424173+00	43d689ed-919a-4e4d-964b-e757f77c5bfa
10f1de1e-4838-45df-ad18-1f7a960c8e3e	3534140355	ENTRANTE	1155	ATENDIDA	1	2026-04-29 19:29:48.421+00	2026-04-29 19:29:48.629194+00	6a1490e2-0a9a-48a8-9b40-090f5e7463db
bc35f9cf-dbd4-433a-bdb3-646ff10ac953	+543444528221	ENTRANTE	202	ATENDIDA	1	2026-04-30 17:07:38.376+00	2026-04-30 17:07:38.595269+00	fc8d3fd6-fa7a-4132-b924-f0fd4c00b63d
66867e19-9fef-4ea9-8d23-35acd6119c8b	+5493471353701	SALIENTE	2	PERDIDA	2	2026-04-23 12:08:55.362+00	2026-04-23 12:08:55.502337+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
70fb286d-34dd-4081-b8c9-32782974ea8b	+5493471353701	SALIENTE	127	ATENDIDA	1	2026-04-29 17:15:31.19+00	2026-04-29 17:15:31.430718+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
8d583d20-6cb0-4ce2-9773-2057a2e0df07	+5493471353701	SALIENTE	224	ATENDIDA	1	2026-04-30 17:02:23.79+00	2026-04-30 17:02:24.001271+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
b8a1a427-9bae-43f1-b874-cefe3286e40a	+543583416033	ENTRANTE	0	PERDIDA	2	2026-04-30 20:29:04.242+00	2026-04-30 20:29:04.499918+00	a42ebbbe-c30b-4e54-91ec-c668197ca1c2
de23e458-8747-4357-8e79-30e2c38e6809	+543583416033	SALIENTE	4	PERDIDA	2	2026-04-30 20:29:49.843+00	2026-04-30 20:29:50.067171+00	a42ebbbe-c30b-4e54-91ec-c668197ca1c2
c12439e3-d966-4233-8154-8297e0f8637a	+543583416033	ENTRANTE	183	ATENDIDA	2	2026-04-30 20:33:16.089+00	2026-04-30 20:33:16.339908+00	a42ebbbe-c30b-4e54-91ec-c668197ca1c2
43e40936-73ca-412d-8aee-8c153b9aee87	2266536326	ENTRANTE	1141	ATENDIDA	1	2026-05-04 11:11:18.414+00	2026-05-04 11:11:18.652053+00	c1f56e58-e436-4aaf-8653-162da3bc89a1
df7adab3-159f-4412-9ef5-79da5795b7f2	3572585409	ENTRANTE	0	PERDIDA	2	2026-05-04 11:11:18.688+00	2026-05-04 11:11:18.821389+00	a52e26e7-df4b-45ed-97e4-7c3c9994070a
41e8762c-1bd1-42c0-a9a0-4b98c60956ab	3572585409	SALIENTE	11	PERDIDA	2	2026-05-04 11:11:52.342+00	2026-05-04 11:11:52.483918+00	a52e26e7-df4b-45ed-97e4-7c3c9994070a
97ae5dc3-9e5e-409b-977f-5ca6890cb313	3572585409	ENTRANTE	360	ATENDIDA	1	2026-05-04 11:18:04.4+00	2026-05-04 11:18:04.601906+00	a52e26e7-df4b-45ed-97e4-7c3c9994070a
d351cdb1-59e8-4a0f-b1ab-95eccc3494ec	+543471325009	ENTRANTE	52	ATENDIDA	1	2026-05-04 13:49:05.516+00	2026-05-04 13:49:05.8227+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
a7fa4a28-242f-4bc1-a0f6-e4111a22ea74	3329539164	ENTRANTE	0	PERDIDA	2	2026-05-05 14:56:01.145+00	2026-05-05 14:56:01.802934+00	6e62ea42-6211-41ae-b52a-6ea3f97db292
763a25b6-61ca-4f72-b74a-c65e35d51e62	3329539164	ENTRANTE	43	ATENDIDA	1	2026-05-05 14:57:27.304+00	2026-05-05 14:57:28.224237+00	6e62ea42-6211-41ae-b52a-6ea3f97db292
905d0ea3-2d27-499a-bc55-aec47732ac54	3329539164	SALIENTE	54	ATENDIDA	1	2026-05-05 15:19:14.909+00	2026-05-05 15:19:15.182744+00	6e62ea42-6211-41ae-b52a-6ea3f97db292
ba8c5427-46de-4b72-94b5-bae7939eb330	+543468649932	ENTRANTE	100	ATENDIDA	1	2026-05-08 13:36:51.88+00	2026-05-08 13:36:52.709769+00	80d243ab-1170-4d38-921d-96bab86811b6
3ef1f021-7880-4f4a-86d0-1fb5e7a8db4d	2302455181	ENTRANTE	3	PERDIDA	1	2026-05-07 14:52:08.639+00	2026-05-07 14:52:08.927028+00	2b2c7f5b-f516-4cb1-92ac-e5a165c8c65e
10c3d30d-5482-4110-97c1-85e3fd16a364	+543444620229	ENTRANTE	0	PERDIDA	1	2026-05-05 12:36:15.086+00	2026-05-05 12:36:15.715294+00	fc8d3fd6-fa7a-4132-b924-f0fd4c00b63d
00c552d2-911e-4dc9-b9ed-be2d9977281b	2364691644	ENTRANTE	374	ATENDIDA	2	2026-05-08 21:04:56.071+00	2026-05-08 21:04:56.606446+00	666a8a9b-9067-409d-b500-3c955be51f1c
4c6d978e-9d51-4a41-a459-ba93f2a5950a	+5493471353701	SALIENTE	1	PERDIDA	2	2026-05-08 21:05:05.776+00	2026-05-08 21:05:05.947685+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
7ee0dbbe-b7fe-44af-bb1b-321b1d983f69	2364691644	ENTRANTE	349	ATENDIDA	1	2026-05-10 20:45:09.688+00	2026-05-10 20:45:10.293398+00	666a8a9b-9067-409d-b500-3c955be51f1c
4d395b65-f65d-4f6e-82f6-e47aa6b3bf0b	3471579168	SALIENTE	43	ATENDIDA	2	2026-05-08 21:07:11.31+00	2026-05-08 21:07:11.501053+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
39c2d7fb-028e-4052-955e-17ddb0bee7f1	3471337756	SALIENTE	0	PERDIDA	2	2026-05-07 00:11:08.37+00	2026-05-07 00:11:08.557262+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
4041aaa6-c706-49c7-9817-e200507016b2	+543444620229	ENTRANTE	0	PERDIDA	1	2026-05-05 13:54:03.88+00	2026-05-05 13:54:04.112527+00	fc8d3fd6-fa7a-4132-b924-f0fd4c00b63d
fcae15a8-df8f-4a28-b5db-0f65f385099c	+543444620229	SALIENTE	152	ATENDIDA	1	2026-05-05 14:07:56.356+00	2026-05-05 14:07:56.625931+00	fc8d3fd6-fa7a-4132-b924-f0fd4c00b63d
dacc49f5-8b2d-4802-a779-d3cf585d54e0	3471671299	SALIENTE	304	ATENDIDA	1	2026-05-11 12:41:59.483+00	2026-05-11 12:41:59.689361+00	\N
61193808-7204-44e3-813d-6d19317d558e	+5493471353701	SALIENTE	0	PERDIDA	1	2026-05-11 12:46:42.636+00	2026-05-11 12:46:42.840913+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
0080aadc-e902-499c-a871-67100d6e53d5	+5493471579168	SALIENTE	7	PERDIDA	1	2026-05-11 12:47:07.439+00	2026-05-11 12:47:07.635828+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
0f91a15f-adc5-46dc-92c3-18e936634a47	+543471343991	ENTRANTE	20	ATENDIDA	5	2026-05-11 12:55:26.529+00	2026-05-11 12:55:27.398688+00	90ca3fca-fcee-4b81-afa2-297ec36c386f
71a46099-45b7-44ac-8375-a757516ff246	2364691644	SALIENTE	1414	ATENDIDA	1	2026-05-11 13:15:54.817+00	2026-05-11 13:15:55.044694+00	666a8a9b-9067-409d-b500-3c955be51f1c
37a9c4c2-9a3b-425c-a8d2-4f5b89b340ba	2364691644	SALIENTE	224	ATENDIDA	1	2026-05-11 13:54:09.882+00	2026-05-11 13:54:10.115534+00	666a8a9b-9067-409d-b500-3c955be51f1c
43fe1cdc-fc12-4a3f-a091-77b72a5c97bf	2364691644	ENTRANTE	90	ATENDIDA	1	2026-05-11 14:03:20.308+00	2026-05-11 14:03:20.547613+00	666a8a9b-9067-409d-b500-3c955be51f1c
f304ceb9-6401-4107-a58f-561cb6525290	+543406427559	ENTRANTE	47	ATENDIDA	2	2026-05-11 14:19:37.387+00	2026-05-11 14:19:37.442407+00	2a5ce776-cf19-49bb-9a8e-90c8ef099ef6
3ace9052-90cb-4ff8-b0c1-d2f4a64566b0	+543576653679	ENTRANTE	361	ATENDIDA	1	2026-05-11 14:23:10.296+00	2026-05-11 14:23:10.51806+00	a468272b-690a-4cc6-9c58-9733da81e0e4
\.


--
-- Data for Name: reportes_generados; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reportes_generados (id, titulo, tipo, rango_inicio, rango_fin, metricas, resumen_escrito, creado_at) FROM stdin;
3e58dfac-8a8d-4128-b56e-c6aea4e2c00d	Informe prueba	MANUAL	2026-03-26 00:00:00+00	2026-04-05 00:00:00+00	{"total": 72, "franjas": [{"fin": 10, "label": "07–10 hs", "total": 21, "inicio": 7, "perdidas": 5, "porcentaje": 24}, {"fin": 13, "label": "10–13 hs", "total": 32, "inicio": 10, "perdidas": 8, "porcentaje": 25}, {"fin": 16, "label": "13–16 hs", "total": 20, "inicio": 13, "perdidas": 6, "porcentaje": 30}, {"fin": 19, "label": "16–19 hs", "total": 19, "inicio": 16, "perdidas": 7, "porcentaje": 37}], "atendidas": 39, "entrantes": 50, "salientes": 22, "eficiencia": 85, "topConcesionarios": [{"total": 19, "nombre": "NUMERO SIN AGENDAR"}, {"total": 12, "nombre": "SIN VINCULAR"}, {"total": 10, "nombre": "FABRICA"}, {"total": 6, "nombre": "WIRZ CARLOS"}, {"total": 5, "nombre": "AGRICOLA RAFAELA S.A."}, {"total": 4, "nombre": "SPITALE OSVALDO"}, {"total": 3, "nombre": "CRIOLANI"}, {"total": 2, "nombre": "AGRICOLA ARRECIFE"}, {"total": 1, "nombre": "BOTTO"}, {"total": 1, "nombre": "EQ MAQUINARIAS"}]}	INFORME DE AUDITORÍA DE RED CRUCIANELLI\n---------------------------------------\nPERIODO ANALIZADO: 2026-03-26 HASTA 2026-04-05.\n\nRESULTADOS OPERATIVOS:\nSE HAN PROCESADO UN TOTAL DE 72 INTERACCIONES EN LA RED.\nDESGLOSE TÉCNICO: 50 LLAMADAS ENTRANTES Y 22 SALIENTES.\n\nEFICIENCIA DE ATENCIÓN:\nEL RATIO DE RESPUESTA ALCANZADO ES DEL 85%.\nESTADO ÓPTIMO: EL EQUIPO MANTIENE UN NIVEL DE RESPUESTA SATISFACTORIO PARA LOS ESTÁNDARES DE LA RED.\n\nANÁLISIS DE PÉRDIDAS POR FRANJA HORARIA:\n  · 07–10 hs: 5 PERDIDAS DE 21 LLAMADAS (24%)\n  · 10–13 hs: 8 PERDIDAS DE 32 LLAMADAS (25%)\n  · 13–16 hs: 6 PERDIDAS DE 20 LLAMADAS (30%)\n  · 16–19 hs: 7 PERDIDAS DE 19 LLAMADAS (37%)\nFRANJA CRÍTICA: 16–19 hs CON 37% DE PÉRDIDAS.	2026-04-10 15:09:13.654233+00
e6d91c79-bba3-4ae2-99f3-a11e5e9c2b46	REPORTE SEMANAL AUTOMÁTICO	AUTOMATICO	2026-04-03 19:00:00.12308+00	2026-04-10 19:00:00.12308+00	{"total": 67, "atendidas": 35, "eficiencia": 52}	INFORME GENERADO POR SISTEMA. Resumen de actividad de los últimos 7 días de la red Crucianelli.	2026-04-10 19:00:00.12308+00
f5e6fcc6-2b80-4069-a329-341b0bf7f1bc	REPORTE SEMANAL — SEMANA 14 2026	AUTOMATICO	2026-03-30 00:00:00+00	2026-04-05 00:00:00+00	{"total": 39, "franjas": [{"fin": 10, "label": "07–10 hs", "total": 0, "inicio": 7, "perdidas": 0, "porcentaje": 0}, {"fin": 13, "label": "10–13 hs", "total": 12, "inicio": 10, "perdidas": 5, "porcentaje": 42}, {"fin": 16, "label": "13–16 hs", "total": 19, "inicio": 13, "perdidas": 5, "porcentaje": 26}, {"fin": 19, "label": "16–19 hs", "total": 6, "inicio": 16, "perdidas": 1, "porcentaje": 17}], "atendidas": 17, "entrantes": 25, "salientes": 14, "eficiencia": 79, "topConcesionarios": [{"total": 9, "nombre": "SIN VINCULAR"}, {"total": 9, "nombre": "NUMERO SIN AGENDAR"}, {"total": 6, "nombre": "WIRZ CARLOS"}, {"total": 4, "nombre": "FABRICA"}, {"total": 3, "nombre": "CRIOLANI"}, {"total": 1, "nombre": "BOTTO"}, {"total": 1, "nombre": "ALTAMIRANO MAQUINARIAS"}, {"total": 1, "nombre": "QUADRI"}]}	INFORME DE AUDITORÍA DE RED CRUCIANELLI\n---------------------------------------\nPERIODO ANALIZADO: 2026-03-30 HASTA 2026-04-05.\n\nRESULTADOS OPERATIVOS:\nSE HAN PROCESADO UN TOTAL DE 39 INTERACCIONES EN LA RED.\nDESGLOSE TÉCNICO: 25 LLAMADAS ENTRANTES Y 14 SALIENTES.\n\nEFICIENCIA DE ATENCIÓN:\nEL RATIO DE RESPUESTA ALCANZADO ES DEL 79%.\nALERTA: SE DETECTA UN NIVEL DE PÉRDIDA DE LLAMADAS POR ENCIMA DEL UMBRAL PERMITIDO. SE RECOMIENDA REVISAR LA DISPONIBILIDAD DE LAS TERMINALES.\n\nANÁLISIS DE PÉRDIDAS POR FRANJA HORARIA:\n  · 10–13 hs: 5 PERDIDAS DE 12 LLAMADAS (42%)\n  · 13–16 hs: 5 PERDIDAS DE 19 LLAMADAS (26%)\n  · 16–19 hs: 1 PERDIDAS DE 6 LLAMADAS (17%)\nFRANJA CRÍTICA: 10–13 hs CON 42% DE PÉRDIDAS.	2026-04-10 22:04:09.720043+00
c68fafeb-6abe-43c3-a22f-33440fb6d9fe	REPORTE SEMANAL AUTOMÁTICO	AUTOMATICO	2026-04-10 19:00:00.189466+00	2026-04-17 19:00:00.189466+00	{"total": 29, "atendidas": 12, "eficiencia": 41}	INFORME GENERADO POR SISTEMA. Resumen de actividad de los últimos 7 días de la red Crucianelli.	2026-04-17 19:00:00.189466+00
0bc64b55-89f6-4751-b587-3036f390e000	REPORTE SEMANAL — SEMANA 15 2026	AUTOMATICO	2026-04-06 00:00:00+00	2026-04-12 00:00:00+00	{"total": 71, "franjas": [{"fin": 10, "label": "07–10 hs", "total": 1, "inicio": 7, "perdidas": 0, "porcentaje": 0}, {"fin": 13, "label": "10–13 hs", "total": 26, "inicio": 10, "perdidas": 12, "porcentaje": 46}, {"fin": 16, "label": "13–16 hs", "total": 25, "inicio": 13, "perdidas": 12, "porcentaje": 48}, {"fin": 19, "label": "16–19 hs", "total": 12, "inicio": 16, "perdidas": 6, "porcentaje": 50}], "atendidas": 22, "entrantes": 43, "salientes": 28, "eficiencia": 70, "topConcesionarios": [{"total": 20, "nombre": "SIN VINCULAR"}, {"total": 8, "nombre": "FABRICA"}, {"total": 5, "nombre": "COSECHAR"}, {"total": 4, "nombre": "BOTTO"}, {"total": 3, "nombre": "SPITALE OSVALDO"}, {"total": 1, "nombre": "CAMINITI CAMINOS"}, {"total": 1, "nombre": "QUADRI"}, {"total": 1, "nombre": "JUAN LUCIANO BALCARCE"}]}	INFORME DE AUDITORÍA DE RED CRUCIANELLI\n---------------------------------------\nPERIODO ANALIZADO: 2026-04-06 HASTA 2026-04-12.\n\nRESULTADOS OPERATIVOS:\nSE HAN PROCESADO UN TOTAL DE 71 INTERACCIONES EN LA RED.\nDESGLOSE TÉCNICO: 43 LLAMADAS ENTRANTES Y 28 SALIENTES.\n\nEFICIENCIA DE ATENCIÓN:\nEL RATIO DE RESPUESTA ALCANZADO ES DEL 70%.\nALERTA: SE DETECTA UN NIVEL DE PÉRDIDA DE LLAMADAS POR ENCIMA DEL UMBRAL PERMITIDO. SE RECOMIENDA REVISAR LA DISPONIBILIDAD DE LAS TERMINALES.\n\nANÁLISIS DE PÉRDIDAS POR FRANJA HORARIA:\n  · 07–10 hs: 0 PERDIDAS DE 1 LLAMADAS (0%)\n  · 10–13 hs: 12 PERDIDAS DE 26 LLAMADAS (46%)\n  · 13–16 hs: 12 PERDIDAS DE 25 LLAMADAS (48%)\n  · 16–19 hs: 6 PERDIDAS DE 12 LLAMADAS (50%)\nFRANJA CRÍTICA: 16–19 hs CON 50% DE PÉRDIDAS.	2026-04-17 22:04:10.689284+00
1645a5a6-5a4c-41bf-9265-bf986858bcce	REPORTE SEMANAL AUTOMÁTICO	AUTOMATICO	2026-04-17 19:00:00.204445+00	2026-04-24 19:00:00.204445+00	{"total": 25, "atendidas": 19, "eficiencia": 76}	INFORME GENERADO POR SISTEMA. Resumen de actividad de los últimos 7 días de la red Crucianelli.	2026-04-24 19:00:00.204445+00
a793f074-41de-41ac-829d-783c18eec456	REPORTE SEMANAL — SEMANA 16 2026	AUTOMATICO	2026-04-13 00:00:00+00	2026-04-19 00:00:00+00	{"total": 23, "franjas": [{"fin": 10, "label": "07–10 hs", "total": 0, "inicio": 7, "perdidas": 0, "porcentaje": 0}, {"fin": 13, "label": "10–13 hs", "total": 3, "inicio": 10, "perdidas": 1, "porcentaje": 33}, {"fin": 16, "label": "13–16 hs", "total": 5, "inicio": 13, "perdidas": 2, "porcentaje": 40}, {"fin": 19, "label": "16–19 hs", "total": 5, "inicio": 16, "perdidas": 2, "porcentaje": 40}], "atendidas": 10, "entrantes": 19, "salientes": 4, "eficiencia": 61, "topConcesionarios": [{"total": 7, "nombre": "JUAN LUCIANO BALCARCE"}, {"total": 5, "nombre": "SIN VINCULAR"}, {"total": 3, "nombre": "BOTTO"}, {"total": 2, "nombre": "FABRICA"}, {"total": 1, "nombre": "QUEVEDO-CANAVESE"}, {"total": 1, "nombre": "PERTICARINI"}]}	INFORME DE AUDITORÍA DE RED CRUCIANELLI\n---------------------------------------\nPERIODO ANALIZADO: 2026-04-13 HASTA 2026-04-19.\n\nRESULTADOS OPERATIVOS:\nSE HAN PROCESADO UN TOTAL DE 23 INTERACCIONES EN LA RED.\nDESGLOSE TÉCNICO: 19 LLAMADAS ENTRANTES Y 4 SALIENTES.\n\nEFICIENCIA DE ATENCIÓN:\nEL RATIO DE RESPUESTA ALCANZADO ES DEL 61%.\nALERTA: SE DETECTA UN NIVEL DE PÉRDIDA DE LLAMADAS POR ENCIMA DEL UMBRAL PERMITIDO. SE RECOMIENDA REVISAR LA DISPONIBILIDAD DE LAS TERMINALES.\n\nANÁLISIS DE PÉRDIDAS POR FRANJA HORARIA:\n  · 10–13 hs: 1 PERDIDAS DE 3 LLAMADAS (33%)\n  · 13–16 hs: 2 PERDIDAS DE 5 LLAMADAS (40%)\n  · 16–19 hs: 2 PERDIDAS DE 5 LLAMADAS (40%)\nFRANJA CRÍTICA: 13–16 hs CON 40% DE PÉRDIDAS.	2026-04-24 22:04:16.906657+00
b0de6116-1bfe-459e-82eb-06c8eabd9256	REPORTE MENSUAL — ABRIL 2026	AUTOMATICO	2026-04-01 00:00:00+00	2026-04-30 00:00:00+00	{"total": 180, "franjas": [{"fin": 10, "label": "07–10 hs", "total": 3, "inicio": 7, "perdidas": 2, "porcentaje": 67}, {"fin": 13, "label": "10–13 hs", "total": 43, "inicio": 10, "perdidas": 17, "porcentaje": 40}, {"fin": 16, "label": "13–16 hs", "total": 53, "inicio": 13, "perdidas": 23, "porcentaje": 43}, {"fin": 19, "label": "16–19 hs", "total": 52, "inicio": 16, "perdidas": 14, "porcentaje": 27}], "atendidas": 67, "entrantes": 112, "salientes": 68, "eficiencia": 75, "topConcesionarios": [{"total": 23, "nombre": "FABRICA"}, {"total": 17, "nombre": "SIN VINCULAR"}, {"total": 9, "nombre": "BOTTO"}, {"total": 8, "nombre": "COSECHAR"}, {"total": 8, "nombre": "JUAN LUCIANO BALCARCE"}, {"total": 6, "nombre": "GONDRA"}, {"total": 6, "nombre": "QUADRI"}, {"total": 6, "nombre": "PICHI PAGNUCCO"}, {"total": 3, "nombre": "WIRZ CARLOS"}, {"total": 3, "nombre": "SPITALE OSVALDO"}]}	INFORME DE AUDITORÍA DE RED CRUCIANELLI\n---------------------------------------\nPERIODO ANALIZADO: 2026-04-01 HASTA 2026-04-30.\n\nRESULTADOS OPERATIVOS:\nSE HAN PROCESADO UN TOTAL DE 180 INTERACCIONES EN LA RED.\nDESGLOSE TÉCNICO: 112 LLAMADAS ENTRANTES Y 68 SALIENTES.\n\nEFICIENCIA DE ATENCIÓN:\nEL RATIO DE RESPUESTA ALCANZADO ES DEL 75%.\nALERTA: SE DETECTA UN NIVEL DE PÉRDIDA DE LLAMADAS POR ENCIMA DEL UMBRAL PERMITIDO. SE RECOMIENDA REVISAR LA DISPONIBILIDAD DE LAS TERMINALES.\n\nANÁLISIS DE PÉRDIDAS POR FRANJA HORARIA:\n  · 07–10 hs: 2 PERDIDAS DE 3 LLAMADAS (67%)\n  · 10–13 hs: 17 PERDIDAS DE 43 LLAMADAS (40%)\n  · 13–16 hs: 23 PERDIDAS DE 53 LLAMADAS (43%)\n  · 16–19 hs: 14 PERDIDAS DE 52 LLAMADAS (27%)\nFRANJA CRÍTICA: 07–10 hs CON 67% DE PÉRDIDAS.	2026-05-01 03:43:31.067951+00
6900d4ca-fb2b-4dcf-9121-89b17d7b563e	REPORTE SEMANAL AUTOMÁTICO	AUTOMATICO	2026-04-24 19:00:00.184167+00	2026-05-01 19:00:00.184167+00	{"total": 43, "atendidas": 29, "eficiencia": 67}	INFORME GENERADO POR SISTEMA. Resumen de actividad de los últimos 7 días de la red Crucianelli.	2026-05-01 19:00:00.184167+00
0fd7423c-9ba9-41d4-bac7-552dd521a76e	REPORTE SEMANAL — SEMANA 17 2026	AUTOMATICO	2026-04-20 00:00:00+00	2026-04-26 00:00:00+00	{"total": 27, "franjas": [{"fin": 10, "label": "07–10 hs", "total": 2, "inicio": 7, "perdidas": 2, "porcentaje": 100}, {"fin": 13, "label": "10–13 hs", "total": 3, "inicio": 10, "perdidas": 1, "porcentaje": 33}, {"fin": 16, "label": "13–16 hs", "total": 2, "inicio": 13, "perdidas": 1, "porcentaje": 50}, {"fin": 19, "label": "16–19 hs", "total": 17, "inicio": 16, "perdidas": 2, "porcentaje": 12}], "atendidas": 12, "entrantes": 16, "salientes": 11, "eficiencia": 85, "topConcesionarios": [{"total": 4, "nombre": "FABRICA"}, {"total": 3, "nombre": "COSECHAR"}, {"total": 3, "nombre": "PAJIN"}, {"total": 2, "nombre": "MAQUINAS DEL CENTRO"}, {"total": 1, "nombre": "PERTICARINI"}, {"total": 1, "nombre": "SIN VINCULAR"}, {"total": 1, "nombre": "AGRICOLA ARRECIFE"}, {"total": 1, "nombre": "ECHEVERRIA MAQUINARIAS"}]}	INFORME DE AUDITORÍA DE RED CRUCIANELLI\n---------------------------------------\nPERIODO ANALIZADO: 2026-04-20 HASTA 2026-04-26.\n\nRESULTADOS OPERATIVOS:\nSE HAN PROCESADO UN TOTAL DE 27 INTERACCIONES EN LA RED.\nDESGLOSE TÉCNICO: 16 LLAMADAS ENTRANTES Y 11 SALIENTES.\n\nEFICIENCIA DE ATENCIÓN:\nEL RATIO DE RESPUESTA ALCANZADO ES DEL 85%.\nESTADO ÓPTIMO: EL EQUIPO MANTIENE UN NIVEL DE RESPUESTA SATISFACTORIO PARA LOS ESTÁNDARES DE LA RED.\n\nANÁLISIS DE PÉRDIDAS POR FRANJA HORARIA:\n  · 07–10 hs: 2 PERDIDAS DE 2 LLAMADAS (100%)\n  · 10–13 hs: 1 PERDIDAS DE 3 LLAMADAS (33%)\n  · 13–16 hs: 1 PERDIDAS DE 2 LLAMADAS (50%)\n  · 16–19 hs: 2 PERDIDAS DE 17 LLAMADAS (12%)\nFRANJA CRÍTICA: 07–10 hs CON 100% DE PÉRDIDAS.	2026-05-01 22:04:09.898636+00
10d78b2f-da21-4607-a77a-17d8dcc16d3f	REPORTE SEMANAL AUTOMÁTICO	AUTOMATICO	2026-05-01 19:00:00.191743+00	2026-05-08 19:00:00.191743+00	{"total": 14, "atendidas": 7, "eficiencia": 50}	INFORME GENERADO POR SISTEMA. Resumen de actividad de los últimos 7 días de la red Crucianelli.	2026-05-08 19:00:00.191743+00
0dba7bd8-e763-41d4-9ae1-0a8132a35559	REPORTE SEMANAL — SEMANA 18 2026	AUTOMATICO	2026-04-27 00:00:00+00	2026-05-03 00:00:00+00	{"total": 41, "franjas": [{"fin": 10, "label": "07–10 hs", "total": 0, "inicio": 7, "perdidas": 0, "porcentaje": 0}, {"fin": 13, "label": "10–13 hs", "total": 9, "inicio": 10, "perdidas": 3, "porcentaje": 33}, {"fin": 16, "label": "13–16 hs", "total": 13, "inicio": 13, "perdidas": 5, "porcentaje": 38}, {"fin": 19, "label": "16–19 hs", "total": 14, "inicio": 16, "perdidas": 3, "porcentaje": 21}], "atendidas": 16, "entrantes": 22, "salientes": 19, "eficiencia": 85, "topConcesionarios": [{"total": 5, "nombre": "QUADRI"}, {"total": 4, "nombre": "FABRICA"}, {"total": 4, "nombre": "GONDRA"}, {"total": 2, "nombre": "EL MARRULLERO"}, {"total": 2, "nombre": "SIN VINCULAR"}, {"total": 1, "nombre": "PERTICARINI"}, {"total": 1, "nombre": "MAQUINAS DEL CENTRO"}, {"total": 1, "nombre": "PINTUCCI Y GUIZZO"}, {"total": 1, "nombre": "MARATA MAQUINARIAS"}, {"total": 1, "nombre": "FRARE"}]}	INFORME DE AUDITORÍA DE RED CRUCIANELLI\n---------------------------------------\nPERIODO ANALIZADO: 2026-04-27 HASTA 2026-05-03.\n\nRESULTADOS OPERATIVOS:\nSE HAN PROCESADO UN TOTAL DE 41 INTERACCIONES EN LA RED.\nDESGLOSE TÉCNICO: 22 LLAMADAS ENTRANTES Y 19 SALIENTES.\n\nEFICIENCIA DE ATENCIÓN:\nEL RATIO DE RESPUESTA ALCANZADO ES DEL 85%.\nESTADO ÓPTIMO: EL EQUIPO MANTIENE UN NIVEL DE RESPUESTA SATISFACTORIO PARA LOS ESTÁNDARES DE LA RED.\n\nANÁLISIS DE PÉRDIDAS POR FRANJA HORARIA:\n  · 10–13 hs: 3 PERDIDAS DE 9 LLAMADAS (33%)\n  · 13–16 hs: 5 PERDIDAS DE 13 LLAMADAS (38%)\n  · 16–19 hs: 3 PERDIDAS DE 14 LLAMADAS (21%)\nFRANJA CRÍTICA: 13–16 hs CON 38% DE PÉRDIDAS.	2026-05-08 22:04:09.813475+00
\.


--
-- Data for Name: terminal_status; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.terminal_status (terminal_id, status, last_seen, updated_at) FROM stdin;
5	ONLINE	2026-05-11 14:51:46.134+00	2026-05-11 14:51:47.412716+00
2	ONLINE	2026-05-11 16:04:28.978+00	2026-05-11 16:04:29.608683+00
1	ONLINE	2026-05-11 16:36:48.5+00	2026-05-11 16:36:48.990935+00
3	ONLINE	2026-05-11 16:54:41.229+00	2026-05-11 16:54:41.713613+00
10	SIN_PERMISOS	2026-04-30 05:24:04.654+00	2026-04-30 05:24:06.899636+00
4	ONLINE	2026-04-08 15:41:52.16+00	2026-04-08 15:41:51.856004+00
\.


--
-- Data for Name: terminal_status_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.terminal_status_history (id, terminal_id, status_previo, status_nuevo, created_at) FROM stdin;
2	10	SIN_PERMISOS	ONLINE	2026-04-07 18:28:20.385242+00
3	10	ONLINE	SIN_PERMISOS	2026-04-07 18:28:22.842602+00
4	10	SIN_PERMISOS	ONLINE	2026-04-07 18:29:27.041138+00
5	1	\N	SIN_PERMISOS	2026-04-07 18:31:16.111156+00
6	1	SIN_PERMISOS	ONLINE	2026-04-07 18:31:18.023403+00
7	10	ONLINE	OFFLINE	2026-04-07 18:50:00.032864+00
8	10	OFFLINE	SIN_PERMISOS	2026-04-07 18:51:40.828968+00
9	10	SIN_PERMISOS	ONLINE	2026-04-07 18:51:43.222599+00
10	1	ONLINE	OFFLINE	2026-04-07 19:00:00.189591+00
11	10	ONLINE	OFFLINE	2026-04-07 19:20:00.115495+00
12	1	OFFLINE	ONLINE	2026-04-08 12:15:18.440349+00
13	1	ONLINE	OFFLINE	2026-04-08 12:45:00.23314+00
18	1	OFFLINE	ONLINE	2026-04-08 14:44:34.87684+00
19	10	OFFLINE	SIN_PERMISOS	2026-04-08 14:46:17.20966+00
20	10	SIN_PERMISOS	ONLINE	2026-04-08 14:51:09.653063+00
21	2	\N	SIN_PERMISOS	2026-04-08 14:53:01.211867+00
22	2	SIN_PERMISOS	ONLINE	2026-04-08 14:53:01.816283+00
23	3	\N	SIN_PERMISOS	2026-04-08 15:02:57.559048+00
24	3	SIN_PERMISOS	ONLINE	2026-04-08 15:02:57.7068+00
25	4	\N	ONLINE	2026-04-08 15:08:17.812752+00
26	10	ONLINE	SIN_PERMISOS	2026-04-08 15:12:34.27002+00
27	1	ONLINE	OFFLINE	2026-04-08 15:20:00.052682+00
28	1	OFFLINE	ONLINE	2026-04-08 15:46:09.106179+00
29	10	SIN_PERMISOS	ONLINE	2026-04-08 17:26:11.553+00
30	1	ONLINE	SIN_PERMISOS	2026-04-08 17:48:38.492329+00
31	10	ONLINE	SIN_PERMISOS	2026-04-09 14:43:00.843658+00
32	10	SIN_PERMISOS	ONLINE	2026-04-09 14:43:08.99468+00
33	10	ONLINE	SIN_PERMISOS	2026-04-09 15:51:59.54974+00
34	10	SIN_PERMISOS	ONLINE	2026-04-09 16:45:36.250767+00
35	10	ONLINE	SIN_PERMISOS	2026-04-09 17:04:48.92844+00
36	10	SIN_PERMISOS	ONLINE	2026-04-09 17:21:07.330348+00
37	10	ONLINE	SIN_PERMISOS	2026-04-09 17:48:51.24635+00
38	2	ONLINE	SIN_PERMISOS	2026-04-09 17:50:46.349727+00
39	2	SIN_PERMISOS	ONLINE	2026-04-09 17:50:57.813879+00
40	10	SIN_PERMISOS	ONLINE	2026-04-09 18:19:15.323899+00
41	1	SIN_PERMISOS	ONLINE	2026-04-10 10:17:06.730957+00
42	1	ONLINE	SIN_PERMISOS	2026-04-10 13:53:32.256383+00
43	1	SIN_PERMISOS	ONLINE	2026-04-10 14:43:28.179214+00
44	2	ONLINE	SIN_PERMISOS	2026-04-10 18:30:05.054193+00
45	2	SIN_PERMISOS	ONLINE	2026-04-13 10:15:21.136992+00
46	1	ONLINE	SIN_PERMISOS	2026-04-14 10:11:38.028502+00
47	1	SIN_PERMISOS	ONLINE	2026-04-14 17:40:14.041728+00
48	1	ONLINE	SIN_PERMISOS	2026-04-14 19:24:48.551576+00
49	1	SIN_PERMISOS	ONLINE	2026-04-15 11:15:37.575702+00
50	10	ONLINE	SIN_PERMISOS	2026-04-16 10:09:47.970249+00
51	10	SIN_PERMISOS	ONLINE	2026-04-16 10:28:44.112938+00
52	10	ONLINE	SIN_PERMISOS	2026-04-16 13:30:58.651975+00
53	5	\N	ONLINE	2026-05-11 12:54:47.357441+00
\.


--
-- Name: terminal_status_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.terminal_status_history_id_seq', 53, true);


--
-- Name: concesionario_telefonos concesionario_telefonos_numero_telefono_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.concesionario_telefonos
    ADD CONSTRAINT concesionario_telefonos_numero_telefono_key UNIQUE (numero_telefono);


--
-- Name: concesionario_telefonos concesionario_telefonos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.concesionario_telefonos
    ADD CONSTRAINT concesionario_telefonos_pkey PRIMARY KEY (id);


--
-- Name: concesionarios concesionarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.concesionarios
    ADD CONSTRAINT concesionarios_pkey PRIMARY KEY (id);


--
-- Name: concesionarios concesionarios_telefono_principal_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.concesionarios
    ADD CONSTRAINT concesionarios_telefono_principal_key UNIQUE (telefono_principal);


--
-- Name: dispositivo_alias dispositivo_alias_dispositivo_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispositivo_alias
    ADD CONSTRAINT dispositivo_alias_dispositivo_id_key UNIQUE (dispositivo_id);


--
-- Name: dispositivo_alias dispositivo_alias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispositivo_alias
    ADD CONSTRAINT dispositivo_alias_pkey PRIMARY KEY (id);


--
-- Name: llamadas llamadas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llamadas
    ADD CONSTRAINT llamadas_pkey PRIMARY KEY (id);


--
-- Name: reportes_generados reportes_generados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_generados
    ADD CONSTRAINT reportes_generados_pkey PRIMARY KEY (id);


--
-- Name: terminal_status_history terminal_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.terminal_status_history
    ADD CONSTRAINT terminal_status_history_pkey PRIMARY KEY (id);


--
-- Name: terminal_status terminal_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.terminal_status
    ADD CONSTRAINT terminal_status_pkey PRIMARY KEY (terminal_id);


--
-- Name: idx_llamadas_concesionario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_llamadas_concesionario ON public.llamadas USING btree (concesionario_id);


--
-- Name: idx_terminal_status_history_terminal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_terminal_status_history_terminal ON public.terminal_status_history USING btree (terminal_id, created_at DESC);


--
-- Name: concesionario_telefonos tr_limpiar_historial_numero; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_limpiar_historial_numero AFTER INSERT ON public.concesionario_telefonos FOR EACH ROW EXECUTE FUNCTION public.limpiar_historial_por_nuevo_numero();


--
-- Name: llamadas tr_vincular_llamada; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_vincular_llamada BEFORE INSERT ON public.llamadas FOR EACH ROW EXECUTE FUNCTION public.vincular_llamada_automatica();


--
-- Name: llamadas tr_vincular_llamada_nueva; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_vincular_llamada_nueva BEFORE INSERT ON public.llamadas FOR EACH ROW EXECUTE FUNCTION public.vincular_por_agenda_completa();


--
-- Name: terminal_status trg_log_terminal_status_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_terminal_status_change AFTER INSERT OR UPDATE ON public.terminal_status FOR EACH ROW EXECUTE FUNCTION public.log_terminal_status_change();


--
-- Name: terminal_status_history trg_notify_terminal_status_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_notify_terminal_status_change AFTER INSERT ON public.terminal_status_history FOR EACH ROW EXECUTE FUNCTION public.notify_terminal_status_change();


--
-- Name: terminal_status trg_terminal_status_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_terminal_status_updated_at BEFORE UPDATE ON public.terminal_status FOR EACH ROW EXECUTE FUNCTION public.update_terminal_status_timestamp();


--
-- Name: concesionario_telefonos concesionario_telefonos_concesionario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.concesionario_telefonos
    ADD CONSTRAINT concesionario_telefonos_concesionario_id_fkey FOREIGN KEY (concesionario_id) REFERENCES public.concesionarios(id) ON DELETE CASCADE;


--
-- Name: llamadas fk_concesionario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llamadas
    ADD CONSTRAINT fk_concesionario FOREIGN KEY (concesionario_id) REFERENCES public.concesionarios(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: llamadas Enable realtime for all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable realtime for all" ON public.llamadas FOR SELECT USING (true);


--
-- Name: llamadas Permitir Insercion Anonima; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir Insercion Anonima" ON public.llamadas FOR INSERT TO anon WITH CHECK (true);


--
-- Name: llamadas Permitir Lectura Anonima; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir Lectura Anonima" ON public.llamadas FOR SELECT TO anon USING (true);


--
-- Name: llamadas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.llamadas ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict dNtoLnjia4OzzuGCBgg4cfTyqajhfbF4L84a3rC9dL9Uz78QRh8Utp8ooYY1xS9

