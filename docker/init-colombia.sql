\connect futurekawa_colombia


-- ═══════════════════════════════════════════════════════════
--  FutureKawa — Init base Colombie
-- ═══════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE public.alert_type AS ENUM ('temperature', 'humidity', 'expiration');
CREATE TYPE public.lot_status AS ENUM ('compliant', 'alert', 'expired');
CREATE TYPE public.user_role AS ENUM ('warehouse_manager', 'quality', 'supply_chain', 'headquarters');

CREATE FUNCTION public.check_sensor_anomaly() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_ideal_temp     NUMERIC;
    v_ideal_humidity NUMERIC;
    v_temp_tol       NUMERIC;
    v_humidity_tol   NUMERIC;
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

CREATE FUNCTION public.update_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TABLE public.country (
    id integer NOT NULL, code character(2) NOT NULL, name character varying(100) NOT NULL,
    ideal_temp numeric(5,2) NOT NULL, ideal_humidity numeric(5,2) NOT NULL,
    temp_tolerance numeric(4,2) DEFAULT 3.00 NOT NULL, humidity_tolerance numeric(4,2) DEFAULT 2.00 NOT NULL
);
CREATE SEQUENCE public.country_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.country_id_seq OWNED BY public.country.id;
ALTER TABLE ONLY public.country ALTER COLUMN id SET DEFAULT nextval('public.country_id_seq'::regclass);
ALTER TABLE ONLY public.country ADD CONSTRAINT country_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.country ADD CONSTRAINT country_code_key UNIQUE (code);

CREATE TABLE public.exploitation (
    id integer NOT NULL, country_id integer NOT NULL, name character varying(150) NOT NULL,
    location character varying(255), created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE SEQUENCE public.exploitation_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.exploitation_id_seq OWNED BY public.exploitation.id;
ALTER TABLE ONLY public.exploitation ALTER COLUMN id SET DEFAULT nextval('public.exploitation_id_seq'::regclass);
ALTER TABLE ONLY public.exploitation ADD CONSTRAINT exploitation_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.exploitation ADD CONSTRAINT exploitation_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.country(id) ON DELETE RESTRICT;

CREATE TABLE public.warehouse (
    id integer NOT NULL, exploitation_id integer NOT NULL, name character varying(150) NOT NULL,
    address character varying(255), created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE SEQUENCE public.warehouse_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.warehouse_id_seq OWNED BY public.warehouse.id;
ALTER TABLE ONLY public.warehouse ALTER COLUMN id SET DEFAULT nextval('public.warehouse_id_seq'::regclass);
ALTER TABLE ONLY public.warehouse ADD CONSTRAINT warehouse_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.warehouse ADD CONSTRAINT warehouse_exploitation_id_fkey FOREIGN KEY (exploitation_id) REFERENCES public.exploitation(id) ON DELETE RESTRICT;

CREATE TABLE public.lot (
    id integer NOT NULL, lot_code character varying(50) NOT NULL, warehouse_id integer NOT NULL,
    storage_date date NOT NULL, status public.lot_status DEFAULT 'compliant'::public.lot_status NOT NULL,
    notes text, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE SEQUENCE public.lot_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.lot_id_seq OWNED BY public.lot.id;
ALTER TABLE ONLY public.lot ALTER COLUMN id SET DEFAULT nextval('public.lot_id_seq'::regclass);
ALTER TABLE ONLY public.lot ADD CONSTRAINT lot_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.lot ADD CONSTRAINT lot_lot_code_key UNIQUE (lot_code);
ALTER TABLE ONLY public.lot ADD CONSTRAINT lot_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouse(id) ON DELETE RESTRICT;
CREATE INDEX idx_lot_warehouse_date ON public.lot USING btree (warehouse_id, storage_date);
CREATE INDEX idx_lot_status ON public.lot USING btree (status);

CREATE TABLE public.iot_device (
    id integer NOT NULL, warehouse_id integer NOT NULL, mac_address character varying(17) NOT NULL,
    firmware_version character varying(30), last_seen timestamp with time zone, created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE SEQUENCE public.iot_device_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.iot_device_id_seq OWNED BY public.iot_device.id;
ALTER TABLE ONLY public.iot_device ALTER COLUMN id SET DEFAULT nextval('public.iot_device_id_seq'::regclass);
ALTER TABLE ONLY public.iot_device ADD CONSTRAINT iot_device_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.iot_device ADD CONSTRAINT iot_device_mac_address_key UNIQUE (mac_address);
ALTER TABLE ONLY public.iot_device ADD CONSTRAINT iot_device_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouse(id) ON DELETE RESTRICT;

CREATE TABLE public.sensor_reading (
    id bigint NOT NULL, device_id integer NOT NULL, warehouse_id integer NOT NULL,
    temperature numeric(5,2) NOT NULL, humidity numeric(5,2) NOT NULL,
    is_anomaly boolean DEFAULT false NOT NULL, recorded_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE SEQUENCE public.sensor_reading_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.sensor_reading_id_seq OWNED BY public.sensor_reading.id;
ALTER TABLE ONLY public.sensor_reading ALTER COLUMN id SET DEFAULT nextval('public.sensor_reading_id_seq'::regclass);
ALTER TABLE ONLY public.sensor_reading ADD CONSTRAINT sensor_reading_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sensor_reading ADD CONSTRAINT sensor_reading_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.iot_device(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.sensor_reading ADD CONSTRAINT sensor_reading_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouse(id) ON DELETE RESTRICT;
CREATE INDEX idx_sensor_reading_warehouse_time ON public.sensor_reading USING btree (warehouse_id, recorded_at DESC);
CREATE INDEX idx_sensor_reading_device_time ON public.sensor_reading USING btree (device_id, recorded_at DESC);

CREATE TABLE public.alert (
    id integer NOT NULL, warehouse_id integer NOT NULL, lot_id integer, type public.alert_type NOT NULL,
    details text, triggered_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone, email_sent boolean DEFAULT false NOT NULL
);
CREATE SEQUENCE public.alert_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.alert_id_seq OWNED BY public.alert.id;
ALTER TABLE ONLY public.alert ALTER COLUMN id SET DEFAULT nextval('public.alert_id_seq'::regclass);
ALTER TABLE ONLY public.alert ADD CONSTRAINT alert_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.alert ADD CONSTRAINT alert_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouse(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.alert ADD CONSTRAINT alert_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.lot(id) ON DELETE SET NULL;
CREATE INDEX idx_alert_warehouse_active ON public.alert USING btree (warehouse_id) WHERE (resolved_at IS NULL);

CREATE TABLE public.app_user (
    id integer NOT NULL, exploitation_id integer, role public.user_role NOT NULL,
    name character varying(150) NOT NULL, email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE SEQUENCE public.app_user_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.app_user_id_seq OWNED BY public.app_user.id;
ALTER TABLE ONLY public.app_user ALTER COLUMN id SET DEFAULT nextval('public.app_user_id_seq'::regclass);
ALTER TABLE ONLY public.app_user ADD CONSTRAINT app_user_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.app_user ADD CONSTRAINT app_user_email_key UNIQUE (email);
ALTER TABLE ONLY public.app_user ADD CONSTRAINT app_user_exploitation_id_fkey FOREIGN KEY (exploitation_id) REFERENCES public.exploitation(id) ON DELETE SET NULL;

CREATE TRIGGER trg_lot_updated_at BEFORE UPDATE ON public.lot FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_sensor_anomaly BEFORE INSERT ON public.sensor_reading FOR EACH ROW EXECUTE FUNCTION public.check_sensor_anomaly();

-- ═══════════════════════════════════════════════════════════
--  DONNÉES DE RÉFÉRENCE — Colombie
--  Temp idéale : 26°C ± 3°C | Humidité idéale : 80% ± 2%
-- ═══════════════════════════════════════════════════════════

INSERT INTO public.country (id, code, name, ideal_temp, ideal_humidity, temp_tolerance, humidity_tolerance)
VALUES (1, 'CO', 'Colombie', 26.00, 80.00, 3.00, 2.00);

INSERT INTO public.exploitation (id, country_id, name, location)
VALUES
    (1, 1, 'Exploitation Antioquia', 'Medellín, Antioquia'),
    (2, 1, 'Exploitation Huila', 'Neiva, Huila');

INSERT INTO public.warehouse (id, exploitation_id, name, address)
VALUES
    (1, 1, 'Entrepôt CO-1', 'Medellín, Antioquia'),
    (2, 1, 'Entrepôt CO-2', 'Medellín, Antioquia'),
    (3, 2, 'Entrepôt CO-3', 'Neiva, Huila');

INSERT INTO public.iot_device (id, warehouse_id, mac_address, firmware_version)
VALUES
    (1, 1, 'BB:CC:DD:EE:FF:01', 'v1.2.0'),
    (2, 2, 'BB:CC:DD:EE:FF:02', 'v1.2.0'),
    (3, 3, 'BB:CC:DD:EE:FF:03', 'v1.2.0');

INSERT INTO public.lot (id, lot_code, warehouse_id, storage_date, status)
VALUES
    (1, 'CO-LOT-2024-001', 1, '2024-05-20', 'compliant'),
    (2, 'CO-LOT-2024-002', 2, '2024-09-10', 'compliant'),
    (3, 'CO-LOT-2025-001', 3, '2025-02-05', 'compliant');

SELECT setval('public.country_id_seq', (SELECT MAX(id) FROM public.country));
SELECT setval('public.exploitation_id_seq', (SELECT MAX(id) FROM public.exploitation));
SELECT setval('public.warehouse_id_seq', (SELECT MAX(id) FROM public.warehouse));
SELECT setval('public.iot_device_id_seq', (SELECT MAX(id) FROM public.iot_device));
SELECT setval('public.lot_id_seq', (SELECT MAX(id) FROM public.lot));