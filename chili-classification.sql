--
-- PostgreSQL database dump
--

\restrict A7TBavUEWO79aylPcpzRf5o2LukLv8m7LAYDz0TwCE9SBgJQO9up0Ch5Gs689oC

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: pln_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO pln_user;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pln_user
--

COMMENT ON SCHEMA public IS '';


--
-- Name: CaptureType; Type: TYPE; Schema: public; Owner: pln_user
--

CREATE TYPE public."CaptureType" AS ENUM (
    'IMAGE_CAPTURE',
    'VIDEO'
);


ALTER TYPE public."CaptureType" OWNER TO pln_user;

--
-- Name: DatasetSessionStatus; Type: TYPE; Schema: public; Owner: pln_user
--

CREATE TYPE public."DatasetSessionStatus" AS ENUM (
    'PENDING',
    'RUNNING',
    'COMPLETED'
);


ALTER TYPE public."DatasetSessionStatus" OWNER TO pln_user;

--
-- Name: SessionStatus; Type: TYPE; Schema: public; Owner: pln_user
--

CREATE TYPE public."SessionStatus" AS ENUM (
    'PENDING',
    'RUNNING',
    'COMPLETED',
    'STOPPED',
    'ERROR'
);


ALTER TYPE public."SessionStatus" OWNER TO pln_user;

--
-- Name: SessionType; Type: TYPE; Schema: public; Owner: pln_user
--

CREATE TYPE public."SessionType" AS ENUM (
    'SCAN',
    'WATERING'
);


ALTER TYPE public."SessionType" OWNER TO pln_user;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: pln_user
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'GUEST'
);


ALTER TYPE public."UserRole" OWNER TO pln_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Bed; Type: TABLE; Schema: public; Owner: pln_user
--

CREATE TABLE public."Bed" (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    "piUrl" text NOT NULL,
    rows integer DEFAULT 2 NOT NULL,
    cols integer DEFAULT 8 NOT NULL,
    "borderMm" double precision DEFAULT 650 NOT NULL,
    "spacingMm" double precision DEFAULT 700 NOT NULL,
    "lastUpdatedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Bed" OWNER TO pln_user;

--
-- Name: Bed_id_seq; Type: SEQUENCE; Schema: public; Owner: pln_user
--

CREATE SEQUENCE public."Bed_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Bed_id_seq" OWNER TO pln_user;

--
-- Name: Bed_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pln_user
--

ALTER SEQUENCE public."Bed_id_seq" OWNED BY public."Bed".id;


--
-- Name: Captures; Type: TABLE; Schema: public; Owner: pln_user
--

CREATE TABLE public."Captures" (
    id integer NOT NULL,
    title text,
    "sessionId" integer NOT NULL,
    "plantId" integer,
    "row" integer,
    col integer,
    "imageUrl" text NOT NULL,
    "heightCm" double precision,
    "moisturePct" double precision,
    "wateringReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "brokenCount" integer DEFAULT 0 NOT NULL,
    "lateSynced" boolean DEFAULT false NOT NULL,
    "plantIndex" integer,
    "ripeCount" integer DEFAULT 0 NOT NULL,
    "scannedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "totalFruits" integer DEFAULT 0 NOT NULL,
    "turningCount" integer DEFAULT 0 NOT NULL,
    "unripeCount" integer DEFAULT 0 NOT NULL,
    "valveDurationSec" double precision,
    "imageLocal" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."Captures" OWNER TO pln_user;

--
-- Name: Captures_id_seq; Type: SEQUENCE; Schema: public; Owner: pln_user
--

CREATE SEQUENCE public."Captures_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Captures_id_seq" OWNER TO pln_user;

--
-- Name: Captures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pln_user
--

ALTER SEQUENCE public."Captures_id_seq" OWNED BY public."Captures".id;


--
-- Name: Dataset; Type: TABLE; Schema: public; Owner: pln_user
--

CREATE TABLE public."Dataset" (
    id integer NOT NULL,
    title text NOT NULL,
    description text,
    "startedAt" timestamp(3) without time zone NOT NULL,
    "endedAt" timestamp(3) without time zone,
    location text,
    status public."DatasetSessionStatus" DEFAULT 'PENDING'::public."DatasetSessionStatus" NOT NULL,
    "captureType" public."CaptureType" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Dataset" OWNER TO pln_user;

--
-- Name: DatasetCaptures; Type: TABLE; Schema: public; Owner: pln_user
--

CREATE TABLE public."DatasetCaptures" (
    id integer NOT NULL,
    title text NOT NULL,
    "datasetSession" integer NOT NULL,
    "imageUrl" text NOT NULL,
    "heightCm" double precision,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DatasetCaptures" OWNER TO pln_user;

--
-- Name: DatasetCaptures_id_seq; Type: SEQUENCE; Schema: public; Owner: pln_user
--

CREATE SEQUENCE public."DatasetCaptures_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."DatasetCaptures_id_seq" OWNER TO pln_user;

--
-- Name: DatasetCaptures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pln_user
--

ALTER SEQUENCE public."DatasetCaptures_id_seq" OWNED BY public."DatasetCaptures".id;


--
-- Name: Dataset_id_seq; Type: SEQUENCE; Schema: public; Owner: pln_user
--

CREATE SEQUENCE public."Dataset_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Dataset_id_seq" OWNER TO pln_user;

--
-- Name: Dataset_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pln_user
--

ALTER SEQUENCE public."Dataset_id_seq" OWNED BY public."Dataset".id;


--
-- Name: Plant; Type: TABLE; Schema: public; Owner: pln_user
--

CREATE TABLE public."Plant" (
    id integer NOT NULL,
    "bedId" integer NOT NULL,
    "plantPos" integer NOT NULL,
    "row" integer NOT NULL,
    col integer NOT NULL,
    "xMm" double precision NOT NULL,
    "yMm" double precision NOT NULL,
    label text,
    "lastRipe" integer,
    "lastTurning" integer,
    "lastUnripe" integer,
    "lastDamaged" integer,
    "lastHeightCm" double precision,
    "lastMoisturePct" double precision,
    "lastScannedAt" timestamp(3) without time zone,
    "lastImageUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Plant" OWNER TO pln_user;

--
-- Name: Plant_id_seq; Type: SEQUENCE; Schema: public; Owner: pln_user
--

CREATE SEQUENCE public."Plant_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Plant_id_seq" OWNER TO pln_user;

--
-- Name: Plant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pln_user
--

ALTER SEQUENCE public."Plant_id_seq" OWNED BY public."Plant".id;


--
-- Name: ScanConfig; Type: TABLE; Schema: public; Owner: pln_user
--

CREATE TABLE public."ScanConfig" (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    "isDefault" boolean DEFAULT false NOT NULL,
    cols integer DEFAULT 8 NOT NULL,
    rows integer DEFAULT 2 NOT NULL,
    "gapXMm" double precision DEFAULT 750.0 NOT NULL,
    "gapYMm" double precision DEFAULT 1000.0 NOT NULL,
    "startXMm" double precision DEFAULT 0.0 CONSTRAINT "ScanConfig_paddingXMm_not_null" NOT NULL,
    "startYMm" double precision DEFAULT 0.0 CONSTRAINT "ScanConfig_paddingYMm_not_null" NOT NULL,
    "captureOffsets" jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ScanConfig" OWNER TO pln_user;

--
-- Name: ScanConfig_id_seq; Type: SEQUENCE; Schema: public; Owner: pln_user
--

CREATE SEQUENCE public."ScanConfig_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ScanConfig_id_seq" OWNER TO pln_user;

--
-- Name: ScanConfig_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pln_user
--

ALTER SEQUENCE public."ScanConfig_id_seq" OWNED BY public."ScanConfig".id;


--
-- Name: Session; Type: TABLE; Schema: public; Owner: pln_user
--

CREATE TABLE public."Session" (
    id integer NOT NULL,
    title text,
    "bedId" integer NOT NULL,
    status public."SessionStatus" DEFAULT 'PENDING'::public."SessionStatus" NOT NULL,
    "totalPlants" integer,
    "avgHeightCm" double precision,
    "avgMoisturePct" double precision,
    "totalWaterSec" double precision,
    "harvestReadyIds" text,
    "totalRipe" integer,
    "totalTurning" integer,
    "totalUnripe" integer,
    "totalDamaged" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "externalId" text,
    notes text,
    "startedAt" timestamp(3) without time zone,
    "scanConfigId" integer,
    "scanConfigSnapshot" jsonb,
    "fuzzyDurationSec" double precision,
    "maxHeightCm" double precision,
    "moistureAfterAvg" double precision,
    "moistureBeforeAvg" double precision,
    "sessionType" public."SessionType" DEFAULT 'SCAN'::public."SessionType" NOT NULL,
    "stopsWatered" integer,
    "wateringConfigId" integer,
    "wateringConfigSnapshot" jsonb
);


ALTER TABLE public."Session" OWNER TO pln_user;

--
-- Name: Session_id_seq; Type: SEQUENCE; Schema: public; Owner: pln_user
--

CREATE SEQUENCE public."Session_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Session_id_seq" OWNER TO pln_user;

--
-- Name: Session_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pln_user
--

ALTER SEQUENCE public."Session_id_seq" OWNED BY public."Session".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: pln_user
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    username text NOT NULL,
    role public."UserRole",
    name text NOT NULL
);


ALTER TABLE public."User" OWNER TO pln_user;

--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: pln_user
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."User_id_seq" OWNER TO pln_user;

--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pln_user
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: WateringConfig; Type: TABLE; Schema: public; Owner: pln_user
--

CREATE TABLE public."WateringConfig" (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    "isDefault" boolean DEFAULT false NOT NULL,
    cols integer DEFAULT 8 NOT NULL,
    rows integer DEFAULT 2 NOT NULL,
    "gapXMm" double precision DEFAULT 750.0 NOT NULL,
    "gapYMm" double precision DEFAULT 1000.0 NOT NULL,
    "startXMm" double precision DEFAULT 0.0 CONSTRAINT "WateringConfig_paddingXMm_not_null" NOT NULL,
    "startYMm" double precision DEFAULT 0.0 CONSTRAINT "WateringConfig_paddingYMm_not_null" NOT NULL,
    "zMaxMm" double precision DEFAULT 0.0 NOT NULL,
    "zWaterMm" double precision DEFAULT 50.0 NOT NULL,
    "tofSamples" integer DEFAULT 5 NOT NULL,
    "sweepSpeedMmSec" double precision DEFAULT 150.0 NOT NULL,
    "waterSpeedMmSec" double precision DEFAULT 100.0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."WateringConfig" OWNER TO pln_user;

--
-- Name: WateringConfig_id_seq; Type: SEQUENCE; Schema: public; Owner: pln_user
--

CREATE SEQUENCE public."WateringConfig_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."WateringConfig_id_seq" OWNER TO pln_user;

--
-- Name: WateringConfig_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pln_user
--

ALTER SEQUENCE public."WateringConfig_id_seq" OWNED BY public."WateringConfig".id;


--
-- Name: WateringStop; Type: TABLE; Schema: public; Owner: pln_user
--

CREATE TABLE public."WateringStop" (
    id integer NOT NULL,
    "sessionId" integer NOT NULL,
    "stopIndex" integer NOT NULL,
    "xMm" double precision NOT NULL,
    "yMm" double precision NOT NULL,
    "maxHeightCm" double precision,
    "valveDurationSec" double precision NOT NULL,
    "wateredAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."WateringStop" OWNER TO pln_user;

--
-- Name: WateringStop_id_seq; Type: SEQUENCE; Schema: public; Owner: pln_user
--

CREATE SEQUENCE public."WateringStop_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."WateringStop_id_seq" OWNER TO pln_user;

--
-- Name: WateringStop_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pln_user
--

ALTER SEQUENCE public."WateringStop_id_seq" OWNED BY public."WateringStop".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: pln_user
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO pln_user;

--
-- Name: Bed id; Type: DEFAULT; Schema: public; Owner: pln_user
--

ALTER TABLE ONLY public."Bed" ALTER COLUMN id SET DEFAULT nextval('public."Bed_id_seq"'::regclass);


--
-- Name: Captures id; Type: DEFAULT; Schema: public; Owner: pln_user
--

ALTER TABLE ONLY public."Captures" ALTER COLUMN id SET DEFAULT nextval('public."Captures_id_seq"'::regclass);


--
-- Name: Dataset id; Type: DEFAULT; Schema: public; Owner: pln_user
--

ALTER TABLE ONLY public."Dataset" ALTER COLUMN id SET DEFAULT nextval('public."Dataset_id_seq"'::regclass);


--
-- Name: DatasetCaptures id; Type: DEFAULT; Schema: public; Owner: pln_user
--

ALTER TABLE ONLY public."DatasetCaptures" ALTER COLUMN id SET DEFAULT nextval('public."DatasetCaptures_id_seq"'::regclass);


--
-- Name: Plant id; Type: DEFAULT; Schema: public; Owner: pln_user
--

ALTER TABLE ONLY public."Plant" ALTER COLUMN id SET DEFAULT nextval('public."Plant_id_seq"'::regclass);


--
-- Name: ScanConfig id; Type: DEFAULT; Schema: public; Owner: pln_user
--

ALTER TABLE ONLY public."ScanConfig" ALTER COLUMN id SET DEFAULT nextval('public."ScanConfig_id_seq"'::regclass);


--
-- Name: Session id; Type: DEFAULT; Schema: public; Owner: pln_user
--

ALTER TABLE ONLY public."Session" ALTER COLUMN id SET DEFAULT nextval('public."Session_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: pln_user
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Name: WateringConfig id; Type: DEFAULT; Schema: public; Owner: pln_user
--

ALTER TABLE ONLY public."WateringConfig" ALTER COLUMN id SET DEFAULT nextval('public."WateringConfig_id_seq"'::regclass);


--
-- Name: WateringStop id; Type: DEFAULT; Schema: public; Owner: pln_user
--

ALTER TABLE ONLY public."WateringStop" ALTER COLUMN id SET DEFAULT nextval('public."WateringStop_id_seq"'::regclass);


--
-- Data for Name: Bed; Type: TABLE DATA; Schema: public; Owner: pln_user
--

COPY public."Bed" (id, name, description, "piUrl", rows, cols, "borderMm", "spacingMm", "lastUpdatedAt", "createdAt", "updatedAt") FROM stdin;
1	UNSRI Greenhouse Bed 1	Main 2×8 chili planter bed (2×6m gantry)	http://100.127.114.61:8000	2	8	650	700	\N	2026-05-28 09:19:07.822	2026-05-28 09:19:07.824
\.


--
-- Data for Name: Captures; Type: TABLE DATA; Schema: public; Owner: pln_user
--

COPY public."Captures" (id, title, "sessionId", "plantId", "row", col, "imageUrl", "heightCm", "moisturePct", "wateringReason", "createdAt", "updatedAt", "brokenCount", "lateSynced", "plantIndex", "ripeCount", "scannedAt", "totalFruits", "turningCount", "unripeCount", "valveDurationSec", "imageLocal") FROM stdin;
\.


--
-- Data for Name: Dataset; Type: TABLE DATA; Schema: public; Owner: pln_user
--

COPY public."Dataset" (id, title, description, "startedAt", "endedAt", location, status, "captureType", "createdAt", "updatedAt") FROM stdin;
1	Pagi	asdadsad	2026-04-11 04:59:58.393	2026-04-16 00:00:00	sadsasdads	PENDING	IMAGE_CAPTURE	2026-04-11 05:00:37.818	2026-04-11 05:00:37.818
2	Sesi 11 April Pagi	Tes	2026-04-11 13:19:58.264	2026-04-11 00:00:00	Kebun Rumah	PENDING	IMAGE_CAPTURE	2026-04-11 13:20:39.737	2026-04-11 13:20:39.737
3	Koleksi Dataset	Koleksi Dataset	2026-04-24 11:22:57.062	2026-04-30 00:00:00	Koleksi Dataset	PENDING	IMAGE_CAPTURE	2026-04-24 11:23:28.162	2026-04-24 11:23:28.162
\.


--
-- Data for Name: DatasetCaptures; Type: TABLE DATA; Schema: public; Owner: pln_user
--

COPY public."DatasetCaptures" (id, title, "datasetSession", "imageUrl", "heightCm", "timestamp", "createdAt", "updatedAt") FROM stdin;
17	Capture 11/04/2026, 12.55.17	1	/api/uploads/capture_1775886917615.jpg	\N	2026-04-11 05:55:17.619	2026-04-11 05:55:17.62	2026-04-11 05:55:17.62
18	Capture 11/04/2026, 12.55.18	1	/api/uploads/capture_1775886918724.jpg	\N	2026-04-11 05:55:18.726	2026-04-11 05:55:18.727	2026-04-11 05:55:18.727
19	Capture 11/04/2026, 12.55.20	1	/api/uploads/capture_1775886920049.jpg	\N	2026-04-11 05:55:20.051	2026-04-11 05:55:20.053	2026-04-11 05:55:20.053
20	Capture 11/04/2026, 12.55.21	1	/api/uploads/capture_1775886921227.jpg	\N	2026-04-11 05:55:21.23	2026-04-11 05:55:21.231	2026-04-11 05:55:21.231
21	Capture 11/04/2026, 12.55.22	1	/api/uploads/capture_1775886922544.jpg	\N	2026-04-11 05:55:22.546	2026-04-11 05:55:22.548	2026-04-11 05:55:22.548
23	Capture 11/04/2026, 13.08.08	1	/api/uploads/capture_1775887688548.jpg	\N	2026-04-11 06:08:08.55	2026-04-11 06:08:08.552	2026-04-11 06:08:08.552
25	Capture 11/04/2026, 17.05.20	1	/api/uploads/capture_1775901920820.jpg	\N	2026-04-11 10:05:20.823	2026-04-11 10:05:20.845	2026-04-11 10:05:20.845
26	Capture 11/04/2026, 20.20.51	2	/api/uploads/capture_1775913651904.jpg	\N	2026-04-11 13:20:51.909	2026-04-11 13:20:51.998	2026-04-11 13:20:51.998
27	Capture 11/04/2026, 20.40.07	2	/api/uploads/capture_1775914807853.jpg	\N	2026-04-11 13:40:07.858	2026-04-11 13:40:07.863	2026-04-11 13:40:07.863
28	Capture 13/04/2026, 15.13.58	2	/api/uploads/capture_1776068037998.jpg	\N	2026-04-13 08:13:58	2026-04-13 08:13:58.012	2026-04-13 08:13:58.012
\.


--
-- Data for Name: Plant; Type: TABLE DATA; Schema: public; Owner: pln_user
--

COPY public."Plant" (id, "bedId", "plantPos", "row", col, "xMm", "yMm", label, "lastRipe", "lastTurning", "lastUnripe", "lastDamaged", "lastHeightCm", "lastMoisturePct", "lastScannedAt", "lastImageUrl", "createdAt", "updatedAt") FROM stdin;
1	1	1	0	0	0	0	Plant 1	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-28 09:19:07.839	2026-05-28 09:19:07.839
3	1	2	0	1	750	0	Plant 2	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-28 09:19:07.851	2026-05-28 09:19:07.851
4	1	3	0	2	1500	0	Plant 3	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-28 09:19:07.856	2026-05-28 09:19:07.856
5	1	4	0	3	2250	0	Plant 4	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-28 09:19:07.86	2026-05-28 09:19:07.86
6	1	5	0	4	3000	0	Plant 5	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-28 09:19:07.868	2026-05-28 09:19:07.868
7	1	6	0	5	3750	0	Plant 6	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-28 09:19:07.876	2026-05-28 09:19:07.876
8	1	7	0	6	4500	0	Plant 7	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-28 09:19:07.884	2026-05-28 09:19:07.884
9	1	8	0	7	5250	0	Plant 8	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-28 09:19:07.891	2026-05-28 09:19:07.891
10	1	9	1	0	0	1000	Plant 9	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-28 09:19:07.898	2026-05-28 09:19:07.898
11	1	10	1	1	750	1000	Plant 10	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-28 09:19:07.906	2026-05-28 09:19:07.906
12	1	11	1	2	1500	1000	Plant 11	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-28 09:19:07.916	2026-05-28 09:19:07.916
13	1	12	1	3	2250	1000	Plant 12	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-28 09:19:07.924	2026-05-28 09:19:07.924
14	1	13	1	4	3000	1000	Plant 13	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-28 09:19:07.93	2026-05-28 09:19:07.93
15	1	14	1	5	3750	1000	Plant 14	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-28 09:19:07.937	2026-05-28 09:19:07.937
16	1	15	1	6	4500	1000	Plant 15	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-28 09:19:07.943	2026-05-28 09:19:07.943
17	1	16	1	7	5250	1000	Plant 16	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-28 09:19:07.947	2026-05-28 09:19:07.947
\.


--
-- Data for Name: ScanConfig; Type: TABLE DATA; Schema: public; Owner: pln_user
--

COPY public."ScanConfig" (id, name, description, "isDefault", cols, rows, "gapXMm", "gapYMm", "startXMm", "startYMm", "captureOffsets", "createdAt", "updatedAt") FROM stdin;
1	Default	Default 3×9 grid — 700mm PLANT spacing	t	9	3	700	650	200	300	[]	2026-05-13 21:26:45.109	2026-06-17 15:58:01.135
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: pln_user
--

COPY public."Session" (id, title, "bedId", status, "totalPlants", "avgHeightCm", "avgMoisturePct", "totalWaterSec", "harvestReadyIds", "totalRipe", "totalTurning", "totalUnripe", "totalDamaged", "createdAt", "updatedAt", "completedAt", "externalId", notes, "startedAt", "scanConfigId", "scanConfigSnapshot", "fuzzyDurationSec", "maxHeightCm", "moistureAfterAvg", "moistureBeforeAvg", "sessionType", "stopsWatered", "wateringConfigId", "wateringConfigSnapshot") FROM stdin;
9	\N	1	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-28 09:21:33.016	2026-05-28 09:21:33.016	\N	\N	\N	\N	1	{"cols": 8, "rows": 2, "gap_x_mm": 750, "gap_y_mm": 1000, "padding_x_mm": 0, "padding_y_mm": 0, "capture_offsets": [{"z_mm": 50, "servo_pan": 90, "servo_tilt": 90, "x_offset_mm": 0, "y_offset_mm": 0}]}	\N	\N	\N	\N	SCAN	\N	\N	\N
10	\N	1	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-28 09:32:38.145	2026-05-28 09:32:38.145	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	WATERING	\N	\N	\N
11	\N	1	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-01 09:50:53.993	2026-06-01 09:50:53.993	\N	\N	\N	\N	1	{"cols": 8, "rows": 2, "gap_x_mm": 750, "gap_y_mm": 1000, "padding_x_mm": 0, "padding_y_mm": 0, "capture_offsets": [{"z_mm": 50, "servo_pan": 90, "servo_tilt": 90, "x_offset_mm": 0, "y_offset_mm": 0}]}	\N	\N	\N	\N	SCAN	\N	\N	\N
12	\N	1	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-02 11:38:59.933	2026-06-02 11:38:59.933	\N	\N	\N	\N	1	{"cols": 8, "rows": 2, "gap_x_mm": 750, "gap_y_mm": 1000, "padding_x_mm": 0, "padding_y_mm": 0, "capture_offsets": [{"z_mm": 50, "servo_pan": 90, "servo_tilt": 90, "x_offset_mm": 0, "y_offset_mm": 0}]}	\N	\N	\N	\N	SCAN	\N	\N	\N
13	\N	1	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-02 11:41:07.088	2026-06-02 11:41:07.088	\N	\N	\N	\N	1	{"cols": 8, "rows": 2, "gap_x_mm": 750, "gap_y_mm": 1000, "padding_x_mm": 0, "padding_y_mm": 0, "capture_offsets": [{"z_mm": 50, "servo_pan": 90, "servo_tilt": 90, "x_offset_mm": 0, "y_offset_mm": 0}]}	\N	\N	\N	\N	SCAN	\N	\N	\N
14	\N	1	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-04 17:54:39.713	2026-06-04 17:54:39.713	\N	\N	\N	\N	1	{"cols": 8, "rows": 2, "gap_x_mm": 750, "gap_y_mm": 1000, "padding_x_mm": 0, "padding_y_mm": 0, "capture_offsets": [{"z_mm": 50, "servo_pan": 90, "servo_tilt": 90, "x_offset_mm": 0, "y_offset_mm": 0}]}	\N	\N	\N	\N	SCAN	\N	\N	\N
15	\N	1	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-12 16:54:38.019	2026-06-12 16:54:38.019	\N	\N	\N	\N	1	{"cols": 8, "rows": 3, "gap_x_mm": 700, "gap_y_mm": 700, "padding_x_mm": 300, "padding_y_mm": 300, "capture_offsets": []}	\N	\N	\N	\N	SCAN	\N	\N	\N
16	\N	1	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-12 17:18:11.265	2026-06-12 17:18:11.265	\N	\N	\N	\N	1	{"cols": 8, "rows": 3, "gap_x_mm": 700, "gap_y_mm": 700, "padding_x_mm": 300, "padding_y_mm": 300, "capture_offsets": []}	\N	\N	\N	\N	SCAN	\N	\N	\N
17	\N	1	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-13 09:26:12.888	2026-06-13 09:26:12.888	\N	\N	\N	\N	1	{"cols": 8, "rows": 3, "gap_x_mm": 700, "gap_y_mm": 700, "padding_x_mm": 300, "padding_y_mm": 300, "capture_offsets": []}	\N	\N	\N	\N	SCAN	\N	\N	\N
18	\N	1	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-13 09:49:31.861	2026-06-13 09:49:31.861	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	WATERING	\N	1	{"cols": 8, "rows": 3, "gap_x_mm": 700, "gap_y_mm": 700, "z_max_mm": 0, "z_water_mm": 50, "tof_samples": 5, "padding_x_mm": 300, "padding_y_mm": 300, "sweep_speed_mm_sec": 150, "water_speed_mm_sec": 100}
19	\N	1	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-13 10:03:04.986	2026-06-13 10:03:04.986	\N	\N	\N	\N	1	{"cols": 8, "rows": 3, "gap_x_mm": 700, "gap_y_mm": 700, "padding_x_mm": 300, "padding_y_mm": 300, "capture_offsets": []}	\N	\N	\N	\N	SCAN	\N	\N	\N
20	\N	1	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-15 11:04:01.018	2026-06-15 11:04:01.018	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	WATERING	\N	1	{"cols": 8, "rows": 3, "gap_x_mm": 700, "gap_y_mm": 700, "z_max_mm": 0, "z_water_mm": 50, "tof_samples": 5, "padding_x_mm": 300, "padding_y_mm": 300, "sweep_speed_mm_sec": 150, "water_speed_mm_sec": 100}
21	\N	1	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-15 11:05:27.745	2026-06-15 11:05:27.745	\N	\N	\N	\N	1	{"cols": 8, "rows": 3, "gap_x_mm": 700, "gap_y_mm": 700, "padding_x_mm": 300, "padding_y_mm": 300, "capture_offsets": []}	\N	\N	\N	\N	SCAN	\N	\N	\N
22	\N	1	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-15 12:06:58.504	2026-06-15 12:06:58.504	\N	\N	\N	\N	1	{"cols": 8, "rows": 3, "gap_x_mm": 700, "gap_y_mm": 700, "padding_x_mm": 270, "padding_y_mm": 300, "capture_offsets": []}	\N	\N	\N	\N	SCAN	\N	\N	\N
23	\N	1	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-16 03:04:24.09	2026-06-16 03:04:24.09	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	WATERING	\N	1	{"cols": 9, "rows": 3, "gap_x_mm": 700, "gap_y_mm": 700, "z_max_mm": 0, "z_water_mm": 50, "tof_samples": 5, "padding_x_mm": 270, "padding_y_mm": 300, "sweep_speed_mm_sec": 150, "water_speed_mm_sec": 100}
24	\N	1	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-16 09:21:09.853	2026-06-16 09:21:09.853	\N	\N	\N	\N	1	{"cols": 9, "rows": 3, "gap_x_mm": 700, "gap_y_mm": 700, "padding_x_mm": 270, "padding_y_mm": 300, "capture_offsets": []}	\N	\N	\N	\N	SCAN	\N	\N	\N
25	\N	1	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-16 09:50:05.136	2026-06-16 09:50:05.136	\N	\N	\N	\N	1	{"cols": 9, "rows": 3, "gap_x_mm": 700, "gap_y_mm": 700, "padding_x_mm": 100, "padding_y_mm": 300, "capture_offsets": []}	\N	\N	\N	\N	SCAN	\N	\N	\N
26	\N	1	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-16 09:50:44.738	2026-06-16 09:50:44.738	\N	\N	\N	\N	1	{"cols": 9, "rows": 3, "gap_x_mm": 700, "gap_y_mm": 700, "padding_x_mm": 150, "padding_y_mm": 300, "capture_offsets": []}	\N	\N	\N	\N	SCAN	\N	\N	\N
27	\N	1	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-16 09:56:27.575	2026-06-16 09:56:27.575	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	WATERING	\N	1	{"cols": 9, "rows": 3, "gap_x_mm": 700, "gap_y_mm": 700, "z_max_mm": 0, "z_water_mm": 50, "tof_samples": 5, "padding_x_mm": 270, "padding_y_mm": 300, "sweep_speed_mm_sec": 150, "water_speed_mm_sec": 100}
28	\N	1	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-17 15:58:02.866	2026-06-17 15:58:02.866	\N	\N	\N	\N	1	{"cols": 9, "rows": 3, "gap_x_mm": 700, "gap_y_mm": 650, "start_x_mm": 200, "start_y_mm": 300, "capture_offsets": []}	\N	\N	\N	\N	SCAN	\N	\N	\N
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: pln_user
--

COPY public."User" (id, username, role, name) FROM stdin;
1	administrator	ADMIN	Administrator
\.


--
-- Data for Name: WateringConfig; Type: TABLE DATA; Schema: public; Owner: pln_user
--

COPY public."WateringConfig" (id, name, description, "isDefault", cols, rows, "gapXMm", "gapYMm", "startXMm", "startYMm", "zMaxMm", "zWaterMm", "tofSamples", "sweepSpeedMmSec", "waterSpeedMmSec", "createdAt", "updatedAt") FROM stdin;
1	Default Watering	Default Watering	f	9	3	700	700	270	300	0	50	5	150	100	2026-06-04 18:12:17.355	2026-06-16 03:04:22.691
\.


--
-- Data for Name: WateringStop; Type: TABLE DATA; Schema: public; Owner: pln_user
--

COPY public."WateringStop" (id, "sessionId", "stopIndex", "xMm", "yMm", "maxHeightCm", "valveDurationSec", "wateredAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: pln_user
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
4d52d04a-4d25-4b50-8c14-2dc81293cce9	e725afccc958a60b72e00d3e7c5fb5f131bc221d72faf3549e5e97bd8504687a	2026-03-17 13:20:20.240211+07	20260316051626_init	\N	\N	2026-03-17 13:20:20.148946+07	1
85fbbf15-cbde-46c5-8a24-a721f5f6f8f9	6853f42ae69239976b84d058430774c8faa83488545e84162844dab84b47294d	2026-03-17 13:20:37.549129+07	20260317062037_init	\N	\N	2026-03-17 13:20:37.502616+07	1
b822a934-20be-4acb-a235-5749a845991c	3cad77efbbb6c86ab409641f1fb4795b281a03e0a15150ac262342f662a0bbb7	2026-04-11 11:41:20.883884+07	20260411044120_add_dataset	\N	\N	2026-04-11 11:41:20.778371+07	1
8f44d8ca-2287-4dab-8577-756c803e08ed	514eb35b9522c7058f8cca744f80a826da548f3d0b12635c472c458317b2e658	2026-05-08 15:09:12.725617+07	20260508080912_add_session_capture_rpi_fields	\N	\N	2026-05-08 15:09:12.642616+07	1
26a9e064-74ff-4854-ac24-d78d2605bcf5	a29df06c059b1af3631cb74aa3327f38d20b58b5fe86e3b63752227648f5acef	2026-05-08 15:25:55.812393+07	20260508081000_add_external_id_unique	\N	\N	2026-05-08 15:25:55.786658+07	1
2babf407-5ddd-446b-be9d-d014c2de0dfe	e4891c8f1113c03429bc4da34e792db8771ed70d03d5c645588649a40e65798d	2026-05-08 15:28:31.749169+07	20260508082000_add_capture_image_local	\N	\N	2026-05-08 15:28:31.737181+07	1
0637ac22-b8b8-45b1-acea-da428361905b	54b2b68aee346dcb45021142deec605c6f72865effc5163382d13d1e68fba14e	2026-05-14 00:37:36.736297+07	20260513173736_add_scan_config	\N	\N	2026-05-14 00:37:36.626669+07	1
46e26ab8-86b3-404d-9fed-fc7cf5f84425	a73ce76b7f19343a32934a00938160feddfff38cd043bc18c6d53e1ec7b89484	2026-05-19 22:00:36.530285+07	20260519150036_add_session_type_watering	\N	\N	2026-05-19 22:00:36.424473+07	1
fafe7581-bc0c-4e77-8f64-e9b2516f354f	adfc535deafe4f6f4c3edad32413c8c5f6b0203a76f25b819ce556bb99a091e1	2026-06-16 18:31:03.973193+07	20260616000000_rename_padding_to_start	\N	\N	2026-06-16 18:31:03.963406+07	1
\.


--
-- Name: Bed_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pln_user
--

SELECT pg_catalog.setval('public."Bed_id_seq"', 1, false);


--
-- Name: Captures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pln_user
--

SELECT pg_catalog.setval('public."Captures_id_seq"', 1, false);


--
-- Name: DatasetCaptures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pln_user
--

SELECT pg_catalog.setval('public."DatasetCaptures_id_seq"', 28, true);


--
-- Name: Dataset_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pln_user
--

SELECT pg_catalog.setval('public."Dataset_id_seq"', 3, true);


--
-- Name: Plant_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pln_user
--

SELECT pg_catalog.setval('public."Plant_id_seq"', 17, true);


--
-- Name: ScanConfig_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pln_user
--

SELECT pg_catalog.setval('public."ScanConfig_id_seq"', 1, true);


--
-- Name: Session_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pln_user
--

SELECT pg_catalog.setval('public."Session_id_seq"', 28, true);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pln_user
--

SELECT pg_catalog.setval('public."User_id_seq"', 1, true);


--
-- Name: WateringConfig_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pln_user
--

SELECT pg_catalog.setval('public."WateringConfig_id_seq"', 1, true);


--
-- Name: WateringStop_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pln_user
--

SELECT pg_catalog.setval('public."WateringStop_id_seq"', 1, false);


--
-- Name: Bed Bed_pkey; Type: CONSTRAINT; Schema: public; Owner: pln_user
--

ALTER TABLE ONLY public."Bed"
    ADD CONSTRAINT "Bed_pkey" PRIMARY KEY (id);


--
-- Name: Captures Captures_pkey; Type: CONSTRAINT; Schema: public; Owner: pln_user
--

ALTER TABLE ONLY public."Captures"
    ADD CONSTRAINT "Captures_pkey" PRIMARY KEY (id);


--
-- Name: DatasetCaptures DatasetCaptures_pkey; Type: CONSTRAINT; Schema: public; Owner: pln_user
--

ALTER TABLE ONLY public."DatasetCaptures"
    ADD CONSTRAINT "DatasetCaptures_pkey" PRIMARY KEY (id);


--
-- Name: Dataset Dataset_pkey; Type: CONSTRAINT; Schema: public; Owner: pln_user
--

ALTER TABLE ONLY public."Dataset"
    ADD CONSTRAINT "Dataset_pkey" PRIMARY KEY (id);


--
-- Name: Plant Plant_pkey; Type: CONSTRAINT; Schema: public; Owner: pln_user
--

ALTER TABLE ONLY public."Plant"
    ADD CONSTRAINT "Plant_pkey" PRIMARY KEY (id);


--
-- Name: ScanConfig ScanConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: pln_user
--

ALTER TABLE ONLY public."ScanConfig"
    ADD CONSTRAINT "ScanConfig_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: pln_user
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: pln_user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: WateringConfig WateringConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: pln_user
--

ALTER TABLE ONLY public."WateringConfig"
    ADD CONSTRAINT "WateringConfig_pkey" PRIMARY KEY (id);


--
-- Name: WateringStop WateringStop_pkey; Type: CONSTRAINT; Schema: public; Owner: pln_user
--

ALTER TABLE ONLY public."WateringStop"
    ADD CONSTRAINT "WateringStop_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: pln_user
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Plant_bedId_plantPos_key; Type: INDEX; Schema: public; Owner: pln_user
--

CREATE UNIQUE INDEX "Plant_bedId_plantPos_key" ON public."Plant" USING btree ("bedId", "plantPos");


--
-- Name: Plant_bedId_row_col_key; Type: INDEX; Schema: public; Owner: pln_user
--

CREATE UNIQUE INDEX "Plant_bedId_row_col_key" ON public."Plant" USING btree ("bedId", "row", col);


--
-- Name: ScanConfig_isDefault_idx; Type: INDEX; Schema: public; Owner: pln_user
--

CREATE INDEX "ScanConfig_isDefault_idx" ON public."ScanConfig" USING btree ("isDefault");


--
-- Name: Session_bedId_idx; Type: INDEX; Schema: public; Owner: pln_user
--

CREATE INDEX "Session_bedId_idx" ON public."Session" USING btree ("bedId");


--
-- Name: Session_createdAt_idx; Type: INDEX; Schema: public; Owner: pln_user
--

CREATE INDEX "Session_createdAt_idx" ON public."Session" USING btree ("createdAt");


--
-- Name: Session_externalId_key; Type: INDEX; Schema: public; Owner: pln_user
--

CREATE UNIQUE INDEX "Session_externalId_key" ON public."Session" USING btree ("externalId");


--
-- Name: Session_sessionType_idx; Type: INDEX; Schema: public; Owner: pln_user
--

CREATE INDEX "Session_sessionType_idx" ON public."Session" USING btree ("sessionType");


--
-- Name: Session_status_idx; Type: INDEX; Schema: public; Owner: pln_user
--

CREATE INDEX "Session_status_idx" ON public."Session" USING btree (status);


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: pln_user
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: WateringConfig_isDefault_idx; Type: INDEX; Schema: public; Owner: pln_user
--

CREATE INDEX "WateringConfig_isDefault_idx" ON public."WateringConfig" USING btree ("isDefault");


--
-- Name: WateringStop_sessionId_idx; Type: INDEX; Schema: public; Owner: pln_user
--

CREATE INDEX "WateringStop_sessionId_idx" ON public."WateringStop" USING btree ("sessionId");


--
-- Name: Captures Captures_plantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pln_user
--

ALTER TABLE ONLY public."Captures"
    ADD CONSTRAINT "Captures_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES public."Plant"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Captures Captures_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pln_user
--

ALTER TABLE ONLY public."Captures"
    ADD CONSTRAINT "Captures_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."Session"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DatasetCaptures DatasetCaptures_datasetSession_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pln_user
--

ALTER TABLE ONLY public."DatasetCaptures"
    ADD CONSTRAINT "DatasetCaptures_datasetSession_fkey" FOREIGN KEY ("datasetSession") REFERENCES public."Dataset"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Plant Plant_bedId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pln_user
--

ALTER TABLE ONLY public."Plant"
    ADD CONSTRAINT "Plant_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES public."Bed"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Session Session_bedId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pln_user
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES public."Bed"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Session Session_scanConfigId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pln_user
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_scanConfigId_fkey" FOREIGN KEY ("scanConfigId") REFERENCES public."ScanConfig"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Session Session_wateringConfigId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pln_user
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_wateringConfigId_fkey" FOREIGN KEY ("wateringConfigId") REFERENCES public."WateringConfig"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: WateringStop WateringStop_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pln_user
--

ALTER TABLE ONLY public."WateringStop"
    ADD CONSTRAINT "WateringStop_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."Session"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pln_user
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict A7TBavUEWO79aylPcpzRf5o2LukLv8m7LAYDz0TwCE9SBgJQO9up0Ch5Gs689oC

