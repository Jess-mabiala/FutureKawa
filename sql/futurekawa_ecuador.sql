--
-- PostgreSQL database dump
--

\restrict NEkkNNyuiQEZfPERWcSu7iozvhMnrhQmsIZ0ffDjPfcwrY2bqb1ALoUHRqcqPpZ

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-06-15 16:40:16

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
-- TOC entry 2 (class 3079 OID 55180)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5126 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 883 (class 1247 OID 55200)
-- Name: alert_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.alert_type AS ENUM (
    'temperature',
    'humidity',
    'expiration'
);


ALTER TYPE public.alert_type OWNER TO postgres;

--
-- TOC entry 880 (class 1247 OID 55192)
-- Name: lot_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.lot_status AS ENUM (
    'compliant',
    'alert',
    'expired'
);


ALTER TYPE public.lot_status OWNER TO postgres;

--
-- TOC entry 886 (class 1247 OID 55208)
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'warehouse_manager',
    'quality',
    'supply_chain',
    'headquarters'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- TOC entry 247 (class 1255 OID 55396)
-- Name: check_sensor_anomaly(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_sensor_anomaly() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_ideal_temp        NUMERIC;
    v_ideal_humidity    NUMERIC;
    v_temp_tol          NUMERIC;
    v_humidity_tol      NUMERIC;
BEGIN
    SELECT c.ideal_temp, c.ideal_humidity, c.temp_tolerance, c.humidity_tolerance
    INTO v_ideal_temp, v_ideal_humidity, v_temp_tol, v_humidity_tol
    FROM country c LIMIT 1;

    IF ABS(NEW.temperature - v_ideal_temp) > v_temp_tol
    OR ABS(NEW.humidity - v_ideal_humidity) > v_humidity_tol THEN
        NEW.is_anomaly = TRUE;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.check_sensor_anomaly() OWNER TO postgres;

--
-- TOC entry 246 (class 1255 OID 55394)
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 233 (class 1259 OID 55341)
-- Name: alert; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alert (
    id integer NOT NULL,
    warehouse_id integer NOT NULL,
    lot_id integer,
    type public.alert_type NOT NULL,
    details text,
    triggered_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone,
    email_sent boolean DEFAULT false NOT NULL
);


ALTER TABLE public.alert OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 55340)
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
-- TOC entry 5127 (class 0 OID 0)
-- Dependencies: 232
-- Name: alert_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alert_id_seq OWNED BY public.alert.id;


--
-- TOC entry 235 (class 1259 OID 55367)
-- Name: app_user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.app_user (
    id integer NOT NULL,
    exploitation_id integer,
    role public.user_role NOT NULL,
    name character varying(150) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.app_user OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 55366)
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
-- TOC entry 5128 (class 0 OID 0)
-- Dependencies: 234
-- Name: app_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.app_user_id_seq OWNED BY public.app_user.id;


--
-- TOC entry 221 (class 1259 OID 55218)
-- Name: country; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.country (
    id integer NOT NULL,
    code character(2) NOT NULL,
    name character varying(100) NOT NULL,
    ideal_temp numeric(5,2) NOT NULL,
    ideal_humidity numeric(5,2) NOT NULL,
    temp_tolerance numeric(4,2) DEFAULT 3.00 NOT NULL,
    humidity_tolerance numeric(4,2) DEFAULT 2.00 NOT NULL
);


ALTER TABLE public.country OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 55217)
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
-- TOC entry 5129 (class 0 OID 0)
-- Dependencies: 220
-- Name: country_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.country_id_seq OWNED BY public.country.id;


--
-- TOC entry 223 (class 1259 OID 55236)
-- Name: exploitation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exploitation (
    id integer NOT NULL,
    country_id integer NOT NULL,
    name character varying(150) NOT NULL,
    location character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.exploitation OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 55235)
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
-- TOC entry 5130 (class 0 OID 0)
-- Dependencies: 222
-- Name: exploitation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.exploitation_id_seq OWNED BY public.exploitation.id;


--
-- TOC entry 229 (class 1259 OID 55296)
-- Name: iot_device; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.iot_device (
    id integer NOT NULL,
    warehouse_id integer NOT NULL,
    mac_address character varying(17) NOT NULL,
    firmware_version character varying(30),
    last_seen timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.iot_device OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 55295)
-- Name: iot_device_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.iot_device_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.iot_device_id_seq OWNER TO postgres;

--
-- TOC entry 5131 (class 0 OID 0)
-- Dependencies: 228
-- Name: iot_device_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.iot_device_id_seq OWNED BY public.iot_device.id;


--
-- TOC entry 227 (class 1259 OID 55270)
-- Name: lot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lot (
    id integer NOT NULL,
    lot_code character varying(50) NOT NULL,
    warehouse_id integer NOT NULL,
    storage_date date NOT NULL,
    status public.lot_status DEFAULT 'compliant'::public.lot_status NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.lot OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 55269)
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
-- TOC entry 5132 (class 0 OID 0)
-- Dependencies: 226
-- Name: lot_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lot_id_seq OWNED BY public.lot.id;


--
-- TOC entry 231 (class 1259 OID 55315)
-- Name: sensor_reading; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sensor_reading (
    id bigint NOT NULL,
    device_id integer NOT NULL,
    warehouse_id integer NOT NULL,
    temperature numeric(5,2) NOT NULL,
    humidity numeric(5,2) NOT NULL,
    is_anomaly boolean DEFAULT false NOT NULL,
    recorded_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sensor_reading OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 55314)
-- Name: sensor_reading_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sensor_reading_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sensor_reading_id_seq OWNER TO postgres;

--
-- TOC entry 5133 (class 0 OID 0)
-- Dependencies: 230
-- Name: sensor_reading_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sensor_reading_id_seq OWNED BY public.sensor_reading.id;


--
-- TOC entry 225 (class 1259 OID 55253)
-- Name: warehouse; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warehouse (
    id integer NOT NULL,
    exploitation_id integer NOT NULL,
    name character varying(150) NOT NULL,
    address character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.warehouse OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 55252)
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
-- TOC entry 5134 (class 0 OID 0)
-- Dependencies: 224
-- Name: warehouse_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.warehouse_id_seq OWNED BY public.warehouse.id;


--
-- TOC entry 4929 (class 2604 OID 55344)
-- Name: alert id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert ALTER COLUMN id SET DEFAULT nextval('public.alert_id_seq'::regclass);


--
-- TOC entry 4932 (class 2604 OID 55370)
-- Name: app_user id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_user ALTER COLUMN id SET DEFAULT nextval('public.app_user_id_seq'::regclass);


--
-- TOC entry 4913 (class 2604 OID 55221)
-- Name: country id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.country ALTER COLUMN id SET DEFAULT nextval('public.country_id_seq'::regclass);


--
-- TOC entry 4916 (class 2604 OID 55239)
-- Name: exploitation id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exploitation ALTER COLUMN id SET DEFAULT nextval('public.exploitation_id_seq'::regclass);


--
-- TOC entry 4924 (class 2604 OID 55299)
-- Name: iot_device id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.iot_device ALTER COLUMN id SET DEFAULT nextval('public.iot_device_id_seq'::regclass);


--
-- TOC entry 4920 (class 2604 OID 55273)
-- Name: lot id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lot ALTER COLUMN id SET DEFAULT nextval('public.lot_id_seq'::regclass);


--
-- TOC entry 4926 (class 2604 OID 55318)
-- Name: sensor_reading id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sensor_reading ALTER COLUMN id SET DEFAULT nextval('public.sensor_reading_id_seq'::regclass);


--
-- TOC entry 4918 (class 2604 OID 55256)
-- Name: warehouse id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse ALTER COLUMN id SET DEFAULT nextval('public.warehouse_id_seq'::regclass);


--
-- TOC entry 4957 (class 2606 OID 55355)
-- Name: alert alert_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert
    ADD CONSTRAINT alert_pkey PRIMARY KEY (id);


--
-- TOC entry 4960 (class 2606 OID 55383)
-- Name: app_user app_user_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_email_key UNIQUE (email);


--
-- TOC entry 4962 (class 2606 OID 55381)
-- Name: app_user app_user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_pkey PRIMARY KEY (id);


--
-- TOC entry 4935 (class 2606 OID 55234)
-- Name: country country_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.country
    ADD CONSTRAINT country_code_key UNIQUE (code);


--
-- TOC entry 4937 (class 2606 OID 55232)
-- Name: country country_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.country
    ADD CONSTRAINT country_pkey PRIMARY KEY (id);


--
-- TOC entry 4939 (class 2606 OID 55246)
-- Name: exploitation exploitation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exploitation
    ADD CONSTRAINT exploitation_pkey PRIMARY KEY (id);


--
-- TOC entry 4949 (class 2606 OID 55308)
-- Name: iot_device iot_device_mac_address_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.iot_device
    ADD CONSTRAINT iot_device_mac_address_key UNIQUE (mac_address);


--
-- TOC entry 4951 (class 2606 OID 55306)
-- Name: iot_device iot_device_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.iot_device
    ADD CONSTRAINT iot_device_pkey PRIMARY KEY (id);


--
-- TOC entry 4945 (class 2606 OID 55289)
-- Name: lot lot_lot_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lot
    ADD CONSTRAINT lot_lot_code_key UNIQUE (lot_code);


--
-- TOC entry 4947 (class 2606 OID 55287)
-- Name: lot lot_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lot
    ADD CONSTRAINT lot_pkey PRIMARY KEY (id);


--
-- TOC entry 4955 (class 2606 OID 55329)
-- Name: sensor_reading sensor_reading_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sensor_reading
    ADD CONSTRAINT sensor_reading_pkey PRIMARY KEY (id);


--
-- TOC entry 4941 (class 2606 OID 55263)
-- Name: warehouse warehouse_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse
    ADD CONSTRAINT warehouse_pkey PRIMARY KEY (id);


--
-- TOC entry 4958 (class 1259 OID 55393)
-- Name: idx_alert_warehouse_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alert_warehouse_active ON public.alert USING btree (warehouse_id) WHERE (resolved_at IS NULL);


--
-- TOC entry 4942 (class 1259 OID 55392)
-- Name: idx_lot_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lot_status ON public.lot USING btree (status);


--
-- TOC entry 4943 (class 1259 OID 55391)
-- Name: idx_lot_warehouse_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lot_warehouse_date ON public.lot USING btree (warehouse_id, storage_date);


--
-- TOC entry 4952 (class 1259 OID 55390)
-- Name: idx_sensor_reading_device_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sensor_reading_device_time ON public.sensor_reading USING btree (device_id, recorded_at DESC);


--
-- TOC entry 4953 (class 1259 OID 55389)
-- Name: idx_sensor_reading_warehouse_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sensor_reading_warehouse_time ON public.sensor_reading USING btree (warehouse_id, recorded_at DESC);


--
-- TOC entry 4972 (class 2620 OID 55395)
-- Name: lot trg_lot_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_lot_updated_at BEFORE UPDATE ON public.lot FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- TOC entry 4973 (class 2620 OID 55397)
-- Name: sensor_reading trg_sensor_anomaly; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_sensor_anomaly BEFORE INSERT ON public.sensor_reading FOR EACH ROW EXECUTE FUNCTION public.check_sensor_anomaly();


--
-- TOC entry 4969 (class 2606 OID 55361)
-- Name: alert alert_lot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert
    ADD CONSTRAINT alert_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.lot(id) ON DELETE SET NULL;


--
-- TOC entry 4970 (class 2606 OID 55356)
-- Name: alert alert_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert
    ADD CONSTRAINT alert_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouse(id) ON DELETE RESTRICT;


--
-- TOC entry 4971 (class 2606 OID 55384)
-- Name: app_user app_user_exploitation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_exploitation_id_fkey FOREIGN KEY (exploitation_id) REFERENCES public.exploitation(id) ON DELETE SET NULL;


--
-- TOC entry 4963 (class 2606 OID 55247)
-- Name: exploitation exploitation_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exploitation
    ADD CONSTRAINT exploitation_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.country(id) ON DELETE RESTRICT;


--
-- TOC entry 4966 (class 2606 OID 55309)
-- Name: iot_device iot_device_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.iot_device
    ADD CONSTRAINT iot_device_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouse(id) ON DELETE RESTRICT;


--
-- TOC entry 4965 (class 2606 OID 55290)
-- Name: lot lot_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lot
    ADD CONSTRAINT lot_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouse(id) ON DELETE RESTRICT;


--
-- TOC entry 4967 (class 2606 OID 55330)
-- Name: sensor_reading sensor_reading_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sensor_reading
    ADD CONSTRAINT sensor_reading_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.iot_device(id) ON DELETE RESTRICT;


--
-- TOC entry 4968 (class 2606 OID 55335)
-- Name: sensor_reading sensor_reading_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sensor_reading
    ADD CONSTRAINT sensor_reading_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouse(id) ON DELETE RESTRICT;


--
-- TOC entry 4964 (class 2606 OID 55264)
-- Name: warehouse warehouse_exploitation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse
    ADD CONSTRAINT warehouse_exploitation_id_fkey FOREIGN KEY (exploitation_id) REFERENCES public.exploitation(id) ON DELETE RESTRICT;


-- Completed on 2026-06-15 16:40:16

--
-- PostgreSQL database dump complete
--

\unrestrict NEkkNNyuiQEZfPERWcSu7iozvhMnrhQmsIZ0ffDjPfcwrY2bqb1ALoUHRqcqPpZ

