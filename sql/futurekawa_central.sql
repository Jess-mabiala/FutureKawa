--
-- PostgreSQL database dump
--

\restrict AfeH9LzSPK3suZE47jzvTOtabD4FNBDzUSpFbLESY8rO8cj4HcA6ziU0NdAHTrh

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-06-15 16:39:18

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
-- TOC entry 2 (class 3079 OID 54746)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5122 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 881 (class 1247 OID 54766)
-- Name: alert_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.alert_type AS ENUM (
    'temperature',
    'humidity',
    'expiration'
);


ALTER TYPE public.alert_type OWNER TO postgres;

--
-- TOC entry 878 (class 1247 OID 54758)
-- Name: lot_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.lot_status AS ENUM (
    'compliant',
    'alert',
    'expired'
);


ALTER TYPE public.lot_status OWNER TO postgres;

--
-- TOC entry 884 (class 1247 OID 54774)
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'warehouse_manager',
    'quality',
    'supply_chain',
    'headquarters'
);


ALTER TYPE public.user_role OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 231 (class 1259 OID 54886)
-- Name: alert; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alert (
    id integer NOT NULL,
    warehouse_id integer NOT NULL,
    lot_id integer,
    type public.alert_type NOT NULL,
    details text,
    triggered_at timestamp with time zone NOT NULL,
    resolved_at timestamp with time zone,
    email_sent boolean DEFAULT false NOT NULL,
    remote_id integer NOT NULL,
    synced_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.alert OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 54885)
-- Name: alert_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.alert_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alert_id_seq OWNER TO postgres;

--
-- TOC entry 5123 (class 0 OID 0)
-- Dependencies: 230
-- Name: alert_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alert_id_seq OWNED BY public.alert.id;


--
-- TOC entry 233 (class 1259 OID 54914)
-- Name: app_user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.app_user (
    id integer NOT NULL,
    role public.user_role DEFAULT 'headquarters'::public.user_role NOT NULL,
    name character varying(150) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.app_user OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 54913)
-- Name: app_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.app_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.app_user_id_seq OWNER TO postgres;

--
-- TOC entry 5124 (class 0 OID 0)
-- Dependencies: 232
-- Name: app_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.app_user_id_seq OWNED BY public.app_user.id;


--
-- TOC entry 221 (class 1259 OID 54784)
-- Name: country; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.country (
    id integer NOT NULL,
    code character(2) NOT NULL,
    name character varying(100) NOT NULL,
    ideal_temp numeric(5,2) NOT NULL,
    ideal_humidity numeric(5,2) NOT NULL,
    temp_tolerance numeric(4,2) DEFAULT 3.00 NOT NULL,
    humidity_tolerance numeric(4,2) DEFAULT 2.00 NOT NULL,
    api_base_url character varying(255) NOT NULL
);


ALTER TABLE public.country OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 54783)
-- Name: country_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.country_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.country_id_seq OWNER TO postgres;

--
-- TOC entry 5125 (class 0 OID 0)
-- Dependencies: 220
-- Name: country_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.country_id_seq OWNED BY public.country.id;


--
-- TOC entry 223 (class 1259 OID 54803)
-- Name: exploitation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exploitation (
    id integer NOT NULL,
    country_id integer NOT NULL,
    name character varying(150) NOT NULL,
    location character varying(255),
    remote_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.exploitation OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 54802)
-- Name: exploitation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.exploitation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.exploitation_id_seq OWNER TO postgres;

--
-- TOC entry 5126 (class 0 OID 0)
-- Dependencies: 222
-- Name: exploitation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.exploitation_id_seq OWNED BY public.exploitation.id;


--
-- TOC entry 227 (class 1259 OID 54839)
-- Name: lot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lot (
    id integer NOT NULL,
    lot_code character varying(50) NOT NULL,
    warehouse_id integer NOT NULL,
    storage_date date NOT NULL,
    status public.lot_status DEFAULT 'compliant'::public.lot_status NOT NULL,
    notes text,
    remote_id integer NOT NULL,
    synced_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.lot OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 54838)
-- Name: lot_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lot_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lot_id_seq OWNER TO postgres;

--
-- TOC entry 5127 (class 0 OID 0)
-- Dependencies: 226
-- Name: lot_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lot_id_seq OWNED BY public.lot.id;


--
-- TOC entry 229 (class 1259 OID 54864)
-- Name: sensor_reading_summary; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sensor_reading_summary (
    id bigint NOT NULL,
    warehouse_id integer NOT NULL,
    avg_temp numeric(5,2) NOT NULL,
    avg_humidity numeric(5,2) NOT NULL,
    min_temp numeric(5,2),
    max_temp numeric(5,2),
    min_humidity numeric(5,2),
    max_humidity numeric(5,2),
    anomaly_count integer DEFAULT 0 NOT NULL,
    period_start timestamp with time zone NOT NULL,
    period_end timestamp with time zone NOT NULL,
    synced_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sensor_reading_summary OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 54863)
-- Name: sensor_reading_summary_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sensor_reading_summary_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sensor_reading_summary_id_seq OWNER TO postgres;

--
-- TOC entry 5128 (class 0 OID 0)
-- Dependencies: 228
-- Name: sensor_reading_summary_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sensor_reading_summary_id_seq OWNED BY public.sensor_reading_summary.id;


--
-- TOC entry 235 (class 1259 OID 54933)
-- Name: sync_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sync_log (
    id integer NOT NULL,
    country_id integer NOT NULL,
    synced_at timestamp with time zone DEFAULT now() NOT NULL,
    status character varying(20) NOT NULL,
    lots_synced integer DEFAULT 0 NOT NULL,
    alerts_synced integer DEFAULT 0 NOT NULL,
    readings_synced integer DEFAULT 0 NOT NULL,
    error_message text,
    CONSTRAINT sync_log_status_check CHECK (((status)::text = ANY ((ARRAY['success'::character varying, 'partial'::character varying, 'failed'::character varying])::text[])))
);


ALTER TABLE public.sync_log OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 54932)
-- Name: sync_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sync_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sync_log_id_seq OWNER TO postgres;

--
-- TOC entry 5129 (class 0 OID 0)
-- Dependencies: 234
-- Name: sync_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sync_log_id_seq OWNED BY public.sync_log.id;


--
-- TOC entry 225 (class 1259 OID 54821)
-- Name: warehouse; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warehouse (
    id integer NOT NULL,
    exploitation_id integer NOT NULL,
    name character varying(150) NOT NULL,
    address character varying(255),
    remote_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.warehouse OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 54820)
-- Name: warehouse_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.warehouse_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.warehouse_id_seq OWNER TO postgres;

--
-- TOC entry 5130 (class 0 OID 0)
-- Dependencies: 224
-- Name: warehouse_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.warehouse_id_seq OWNED BY public.warehouse.id;


--
-- TOC entry 4924 (class 2604 OID 54889)
-- Name: alert id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert ALTER COLUMN id SET DEFAULT nextval('public.alert_id_seq'::regclass);


--
-- TOC entry 4927 (class 2604 OID 54917)
-- Name: app_user id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_user ALTER COLUMN id SET DEFAULT nextval('public.app_user_id_seq'::regclass);


--
-- TOC entry 4911 (class 2604 OID 54787)
-- Name: country id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.country ALTER COLUMN id SET DEFAULT nextval('public.country_id_seq'::regclass);


--
-- TOC entry 4914 (class 2604 OID 54806)
-- Name: exploitation id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exploitation ALTER COLUMN id SET DEFAULT nextval('public.exploitation_id_seq'::regclass);


--
-- TOC entry 4918 (class 2604 OID 54842)
-- Name: lot id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lot ALTER COLUMN id SET DEFAULT nextval('public.lot_id_seq'::regclass);


--
-- TOC entry 4921 (class 2604 OID 54867)
-- Name: sensor_reading_summary id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sensor_reading_summary ALTER COLUMN id SET DEFAULT nextval('public.sensor_reading_summary_id_seq'::regclass);


--
-- TOC entry 4930 (class 2604 OID 54936)
-- Name: sync_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_log ALTER COLUMN id SET DEFAULT nextval('public.sync_log_id_seq'::regclass);


--
-- TOC entry 4916 (class 2604 OID 54824)
-- Name: warehouse id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse ALTER COLUMN id SET DEFAULT nextval('public.warehouse_id_seq'::regclass);


--
-- TOC entry 4954 (class 2606 OID 54902)
-- Name: alert alert_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert
    ADD CONSTRAINT alert_pkey PRIMARY KEY (id);


--
-- TOC entry 4957 (class 2606 OID 54931)
-- Name: app_user app_user_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_email_key UNIQUE (email);


--
-- TOC entry 4959 (class 2606 OID 54929)
-- Name: app_user app_user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_pkey PRIMARY KEY (id);


--
-- TOC entry 4937 (class 2606 OID 54801)
-- Name: country country_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.country
    ADD CONSTRAINT country_code_key UNIQUE (code);


--
-- TOC entry 4939 (class 2606 OID 54799)
-- Name: country country_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.country
    ADD CONSTRAINT country_pkey PRIMARY KEY (id);


--
-- TOC entry 4941 (class 2606 OID 54814)
-- Name: exploitation exploitation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exploitation
    ADD CONSTRAINT exploitation_pkey PRIMARY KEY (id);


--
-- TOC entry 4947 (class 2606 OID 54857)
-- Name: lot lot_lot_code_warehouse_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lot
    ADD CONSTRAINT lot_lot_code_warehouse_id_key UNIQUE (lot_code, warehouse_id);


--
-- TOC entry 4949 (class 2606 OID 54855)
-- Name: lot lot_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lot
    ADD CONSTRAINT lot_pkey PRIMARY KEY (id);


--
-- TOC entry 4952 (class 2606 OID 54879)
-- Name: sensor_reading_summary sensor_reading_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sensor_reading_summary
    ADD CONSTRAINT sensor_reading_summary_pkey PRIMARY KEY (id);


--
-- TOC entry 4962 (class 2606 OID 54952)
-- Name: sync_log sync_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_log
    ADD CONSTRAINT sync_log_pkey PRIMARY KEY (id);


--
-- TOC entry 4943 (class 2606 OID 54832)
-- Name: warehouse warehouse_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse
    ADD CONSTRAINT warehouse_pkey PRIMARY KEY (id);


--
-- TOC entry 4955 (class 1259 OID 54960)
-- Name: idx_alert_hq_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alert_hq_active ON public.alert USING btree (warehouse_id) WHERE (resolved_at IS NULL);


--
-- TOC entry 4944 (class 1259 OID 54959)
-- Name: idx_lot_hq_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lot_hq_status ON public.lot USING btree (status);


--
-- TOC entry 4945 (class 1259 OID 54958)
-- Name: idx_lot_hq_warehouse_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lot_hq_warehouse_date ON public.lot USING btree (warehouse_id, storage_date);


--
-- TOC entry 4950 (class 1259 OID 54961)
-- Name: idx_summary_warehouse_period; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_summary_warehouse_period ON public.sensor_reading_summary USING btree (warehouse_id, period_start DESC);


--
-- TOC entry 4960 (class 1259 OID 54962)
-- Name: idx_sync_log_country; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sync_log_country ON public.sync_log USING btree (country_id, synced_at DESC);


--
-- TOC entry 4967 (class 2606 OID 54908)
-- Name: alert alert_lot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert
    ADD CONSTRAINT alert_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.lot(id) ON DELETE SET NULL;


--
-- TOC entry 4968 (class 2606 OID 54903)
-- Name: alert alert_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert
    ADD CONSTRAINT alert_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouse(id) ON DELETE RESTRICT;


--
-- TOC entry 4963 (class 2606 OID 54815)
-- Name: exploitation exploitation_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exploitation
    ADD CONSTRAINT exploitation_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.country(id) ON DELETE RESTRICT;


--
-- TOC entry 4965 (class 2606 OID 54858)
-- Name: lot lot_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lot
    ADD CONSTRAINT lot_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouse(id) ON DELETE RESTRICT;


--
-- TOC entry 4966 (class 2606 OID 54880)
-- Name: sensor_reading_summary sensor_reading_summary_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sensor_reading_summary
    ADD CONSTRAINT sensor_reading_summary_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouse(id) ON DELETE RESTRICT;


--
-- TOC entry 4969 (class 2606 OID 54953)
-- Name: sync_log sync_log_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_log
    ADD CONSTRAINT sync_log_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.country(id);


--
-- TOC entry 4964 (class 2606 OID 54833)
-- Name: warehouse warehouse_exploitation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse
    ADD CONSTRAINT warehouse_exploitation_id_fkey FOREIGN KEY (exploitation_id) REFERENCES public.exploitation(id) ON DELETE RESTRICT;


-- Completed on 2026-06-15 16:39:18

--
-- PostgreSQL database dump complete
--

\unrestrict AfeH9LzSPK3suZE47jzvTOtabD4FNBDzUSpFbLESY8rO8cj4HcA6ziU0NdAHTrh

