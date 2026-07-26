\connect futurekawa_central


-- ═══════════════════════════════════════════════════════════
--  FutureKawa — Init base Centrale (Siège)
-- ═══════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE public.alert_type AS ENUM ('temperature', 'humidity', 'expiration');
CREATE TYPE public.lot_status AS ENUM ('compliant', 'alert', 'expired');
CREATE TYPE public.user_role AS ENUM ('warehouse_manager', 'quality', 'supply_chain', 'headquarters');

-- Tables

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
CREATE SEQUENCE public.country_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.country_id_seq OWNED BY public.country.id;
ALTER TABLE ONLY public.country ALTER COLUMN id SET DEFAULT nextval('public.country_id_seq'::regclass);
ALTER TABLE ONLY public.country ADD CONSTRAINT country_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.country ADD CONSTRAINT country_code_key UNIQUE (code);

CREATE TABLE public.exploitation (
    id integer NOT NULL,
    country_id integer NOT NULL,
    name character varying(150) NOT NULL,
    location character varying(255),
    remote_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE SEQUENCE public.exploitation_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.exploitation_id_seq OWNED BY public.exploitation.id;
ALTER TABLE ONLY public.exploitation ALTER COLUMN id SET DEFAULT nextval('public.exploitation_id_seq'::regclass);
ALTER TABLE ONLY public.exploitation ADD CONSTRAINT exploitation_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.exploitation ADD CONSTRAINT exploitation_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.country(id) ON DELETE RESTRICT;

CREATE TABLE public.warehouse (
    id integer NOT NULL,
    exploitation_id integer NOT NULL,
    name character varying(150) NOT NULL,
    address character varying(255),
    remote_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE SEQUENCE public.warehouse_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.warehouse_id_seq OWNED BY public.warehouse.id;
ALTER TABLE ONLY public.warehouse ALTER COLUMN id SET DEFAULT nextval('public.warehouse_id_seq'::regclass);
ALTER TABLE ONLY public.warehouse ADD CONSTRAINT warehouse_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.warehouse ADD CONSTRAINT warehouse_exploitation_id_fkey FOREIGN KEY (exploitation_id) REFERENCES public.exploitation(id) ON DELETE RESTRICT;

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
CREATE SEQUENCE public.lot_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.lot_id_seq OWNED BY public.lot.id;
ALTER TABLE ONLY public.lot ALTER COLUMN id SET DEFAULT nextval('public.lot_id_seq'::regclass);
ALTER TABLE ONLY public.lot ADD CONSTRAINT lot_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.lot ADD CONSTRAINT lot_lot_code_warehouse_id_key UNIQUE (lot_code, warehouse_id);
ALTER TABLE ONLY public.lot ADD CONSTRAINT lot_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouse(id) ON DELETE RESTRICT;
CREATE INDEX idx_lot_hq_warehouse_date ON public.lot USING btree (warehouse_id, storage_date);
CREATE INDEX idx_lot_hq_status ON public.lot USING btree (status);

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
CREATE SEQUENCE public.sensor_reading_summary_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.sensor_reading_summary_id_seq OWNED BY public.sensor_reading_summary.id;
ALTER TABLE ONLY public.sensor_reading_summary ALTER COLUMN id SET DEFAULT nextval('public.sensor_reading_summary_id_seq'::regclass);
ALTER TABLE ONLY public.sensor_reading_summary ADD CONSTRAINT sensor_reading_summary_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sensor_reading_summary ADD CONSTRAINT sensor_reading_summary_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouse(id) ON DELETE RESTRICT;
CREATE INDEX idx_summary_warehouse_period ON public.sensor_reading_summary USING btree (warehouse_id, period_start DESC);

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
CREATE SEQUENCE public.alert_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.alert_id_seq OWNED BY public.alert.id;
ALTER TABLE ONLY public.alert ALTER COLUMN id SET DEFAULT nextval('public.alert_id_seq'::regclass);
ALTER TABLE ONLY public.alert ADD CONSTRAINT alert_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.alert ADD CONSTRAINT alert_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouse(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.alert ADD CONSTRAINT alert_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.lot(id) ON DELETE SET NULL;
CREATE INDEX idx_alert_hq_active ON public.alert USING btree (warehouse_id) WHERE (resolved_at IS NULL);

CREATE TABLE public.app_user (
    id integer NOT NULL,
    role public.user_role DEFAULT 'headquarters'::public.user_role NOT NULL,
    name character varying(150) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE SEQUENCE public.app_user_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.app_user_id_seq OWNED BY public.app_user.id;
ALTER TABLE ONLY public.app_user ALTER COLUMN id SET DEFAULT nextval('public.app_user_id_seq'::regclass);
ALTER TABLE ONLY public.app_user ADD CONSTRAINT app_user_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.app_user ADD CONSTRAINT app_user_email_key UNIQUE (email);

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
CREATE SEQUENCE public.sync_log_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.sync_log_id_seq OWNED BY public.sync_log.id;
ALTER TABLE ONLY public.sync_log ALTER COLUMN id SET DEFAULT nextval('public.sync_log_id_seq'::regclass);
ALTER TABLE ONLY public.sync_log ADD CONSTRAINT sync_log_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sync_log ADD CONSTRAINT sync_log_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.country(id);
CREATE INDEX idx_sync_log_country ON public.sync_log USING btree (country_id, synced_at DESC);

-- ═══════════════════════════════════════════════════════════
--  DONNÉES DE RÉFÉRENCE — Base centrale
--  Les URLs pointent vers les noms de services Docker
-- ═══════════════════════════════════════════════════════════

INSERT INTO public.country (id, code, name, ideal_temp, ideal_humidity, temp_tolerance, humidity_tolerance, api_base_url)
VALUES
    (1, 'BR', 'Brésil',   29.00, 55.00, 3.00, 2.00, 'http://backend-brazil:8080'),
    (2, 'CO', 'Colombie', 26.00, 80.00, 3.00, 2.00, 'http://backend-colombia:8080'),
    (3, 'EC', 'Équateur', 31.00, 60.00, 3.00, 2.00, 'http://backend-ecuador:8080');

SELECT setval('public.country_id_seq', (SELECT MAX(id) FROM public.country));