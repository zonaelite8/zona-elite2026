--
-- PostgreSQL database dump
--

\restrict CF4KJdc1WEPsXH0V7oUvAlX4I1Wb0kF0asQVGSEj9k1VISxM4Bj3Y9YS0tD7Hbe

-- Dumped from database version 18.4 (Debian 18.4-1.pgdg12+1)
-- Dumped by pg_dump version 18.2

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

-- *not* creating schema, since initdb creates it


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id integer NOT NULL,
    user_id uuid,
    slot_id integer,
    evaluation jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    cancel_token character varying(255)
);


--
-- Name: bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bookings_id_seq OWNED BY public.bookings.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    message text NOT NULL,
    type character varying(50) DEFAULT 'info'::character varying,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plans (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    default_classes integer DEFAULT 0,
    price numeric(10,2) DEFAULT 0.00,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    description text,
    classes_per_week integer DEFAULT 0,
    sessions_per_month integer DEFAULT 0,
    modality_type character varying(50) DEFAULT 'funcional'::character varying
);


--
-- Name: plans_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.plans_id_seq OWNED BY public.plans.id;


--
-- Name: slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.slots (
    id integer NOT NULL,
    modality character varying(50) NOT NULL,
    date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    capacity integer NOT NULL,
    is_blocked boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT slots_modality_check CHECK (((modality)::text = ANY ((ARRAY['fuerza'::character varying, 'personalizado'::character varying])::text[])))
);


--
-- Name: slots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.slots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: slots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.slots_id_seq OWNED BY public.slots.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255),
    google_id character varying(255),
    phone character varying(20),
    cedula character varying(50),
    role character varying(20) DEFAULT 'client'::character varying,
    available_classes integer DEFAULT 0,
    plan_type character varying(100) DEFAULT 'Sin Plan'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_verified boolean DEFAULT false,
    verify_token character varying(255),
    payment_method character varying(20) DEFAULT 'efectivo'::character varying,
    payment_amount numeric(10,2) DEFAULT 0,
    payment_date date,
    expiration_date date,
    payment_status character varying(50) DEFAULT 'pendiente'::character varying,
    reset_token character varying(255),
    reset_token_expires timestamp with time zone,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['client'::character varying, 'admin'::character varying])::text[])))
);


--
-- Name: bookings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings ALTER COLUMN id SET DEFAULT nextval('public.bookings_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: plans id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans ALTER COLUMN id SET DEFAULT nextval('public.plans_id_seq'::regclass);


--
-- Name: slots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.slots ALTER COLUMN id SET DEFAULT nextval('public.slots_id_seq'::regclass);


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bookings (id, user_id, slot_id, evaluation, created_at, cancel_token) FROM stdin;
19	af7e0be5-0afc-42c2-ba9a-222fdc32a9dc	27	\N	2026-06-13 19:56:37.463932+00	762fb691-320d-47c5-a359-be21a6cf9e0b
24	3aabd89c-4942-4ec4-a90d-482970521a5c	29	\N	2026-06-16 11:39:21.625274+00	d13bea20-86f9-4665-b727-77edbe14a6ee
25	cde2ce39-789a-466f-bbc8-67b66df323dd	29	\N	2026-06-16 11:39:48.162262+00	2e085d63-5bb1-479b-9924-7e5b910632c9
26	e868096e-a913-44b1-b032-2a0e5c2e2c79	29	\N	2026-06-16 11:39:48.174738+00	fd5dd75f-075d-4168-b127-d2a9551ed364
27	5765cbc3-4e60-4c6e-a67a-7434a2eceaa2	29	\N	2026-06-16 11:39:48.233095+00	55a63baa-4d29-44e9-9609-737ee1a0614a
28	ab2a75bc-00e4-454d-b9b1-d36eb77810d4	55	\N	2026-06-16 11:41:09.819622+00	86374c78-fdcb-4f44-ba6a-9456cd68a4f7
29	0eba8b96-7ef9-4670-b5b7-e712fbba198e	39	\N	2026-06-16 11:41:18.160781+00	9ac0221c-5d00-4407-bfc4-75f10f68f02d
30	313aa7c4-9e4e-4688-ad46-03632eb7a1b7	33	\N	2026-06-16 12:41:13.405796+00	24b73e9c-23a3-44ac-9b9b-ab5459c3055b
31	2e9c070e-ca7e-46c6-8560-d1fff57f92b3	30	\N	2026-06-16 12:43:52.663779+00	38eb6c33-99ed-4e31-951a-38d3bc778340
32	2e9c070e-ca7e-46c6-8560-d1fff57f92b3	33	\N	2026-06-16 12:44:06.663502+00	44725a38-5373-4f5a-b355-7d924f6b92c8
33	f8615d54-0169-477c-bfe3-a3b73ff5d0c9	41	\N	2026-06-16 18:37:19.991752+00	dc674a9d-cf30-4e84-b181-32b757f320da
34	f8615d54-0169-477c-bfe3-a3b73ff5d0c9	30	\N	2026-06-16 18:38:30.747213+00	f36d1ee1-c890-4296-91e4-cae9aa654f99
35	eb4bb9df-45b1-40f5-bd05-1fa96f3eb34e	30	\N	2026-06-16 22:00:53.062742+00	b4726c47-559b-434f-a036-b2cf85c63316
36	7641a26e-39d0-402f-9285-55740a170fb8	30	\N	2026-06-16 23:03:11.979108+00	552c531b-c225-4e67-8a4c-e13d60c9349d
37	c4f8ad0c-62e8-4091-b409-fb9f18b9e401	45	\N	2026-06-17 00:48:49.924738+00	5dfa7e98-2fae-44e8-a191-2b7b870192ad
38	c4f8ad0c-62e8-4091-b409-fb9f18b9e401	49	\N	2026-06-17 00:49:10.834723+00	de45d962-6f95-440f-9764-c05c1e9a7d94
39	c4f8ad0c-62e8-4091-b409-fb9f18b9e401	53	\N	2026-06-17 00:49:23.934257+00	5dec4707-c539-4929-b690-7c42ad3645b6
40	48855b53-fa1a-4189-a559-1a95a30d5cea	45	\N	2026-06-17 00:49:36.314686+00	c2f5341b-8d2a-48c5-b299-9308d12a192e
48	7641a26e-39d0-402f-9285-55740a170fb8	33	\N	2026-06-17 13:43:59.06601+00	f6fe6d68-5fa7-48f6-95c1-d96e72b46d7d
49	0a45d5d5-235c-494b-a99e-374a3814195f	45	\N	2026-06-17 20:02:09.106113+00	b63e1169-a88b-4c22-9057-372e4e2d908e
50	62c055cb-7c14-4a25-a516-82e706af495e	69	\N	2026-06-17 20:02:45.772583+00	811533a5-d896-47e2-a7bd-1862a8041ace
52	397fd98f-5ade-4e16-985e-2b5a100a9e0a	70	\N	2026-06-17 20:03:10.47987+00	e9950275-2fcb-4675-acb8-71ec0f6a87a8
53	e868096e-a913-44b1-b032-2a0e5c2e2c79	43	\N	2026-06-17 20:05:25.43649+00	b383af50-716f-4f45-971f-c554fa19772e
54	8c432067-65ea-444e-8748-7395b64e189f	43	\N	2026-06-17 20:05:37.816103+00	c328aa5f-1b94-4887-a3c7-7e91e84a15dd
55	0eba8b96-7ef9-4670-b5b7-e712fbba198e	43	\N	2026-06-17 20:11:57.523094+00	0ff3627a-4c73-4aea-a78c-37c3c85fa95c
56	5765cbc3-4e60-4c6e-a67a-7434a2eceaa2	35	\N	2026-06-17 21:15:28.933444+00	6f9f19f3-4b6a-421d-8e33-f1eaae16bb69
57	42bc4308-d0cd-49ec-a089-6a4e4d8c83f3	35	\N	2026-06-17 21:18:00.483801+00	c0471081-c952-4ce3-b1f1-3cd7519de148
58	8c432067-65ea-444e-8748-7395b64e189f	33	\N	2026-06-17 21:23:07.689324+00	7fc4b498-3f55-43c3-8b36-4ac44040a07a
59	93fe1d9e-43b7-45d7-a8c3-90e1b8534d3b	45	\N	2026-06-17 23:03:51.660573+00	b77fdbce-777f-4f24-b1df-48d3ee1f2551
60	93fe1d9e-43b7-45d7-a8c3-90e1b8534d3b	49	\N	2026-06-17 23:04:17.331628+00	5282fd59-84e7-4326-8bcb-96c3c72b49a7
62	0eba8b96-7ef9-4670-b5b7-e712fbba198e	81	\N	2026-06-18 13:40:36.088954+00	f169b205-d75e-4757-a842-145306493dbf
64	5765cbc3-4e60-4c6e-a67a-7434a2eceaa2	77	\N	2026-06-18 15:00:14.972079+00	73d4dfb2-0121-407c-a68a-e2f62dca7cba
65	6674e02a-8f36-4f34-9fca-8f6ea2078391	77	\N	2026-06-18 17:52:46.756228+00	b65e9018-c4fd-4e3f-b83c-e0687ceb1ea7
66	313aa7c4-9e4e-4688-ad46-03632eb7a1b7	75	\N	2026-06-19 00:38:36.744669+00	7ee8c437-40cb-4661-aff3-639a957ab781
67	eb4bb9df-45b1-40f5-bd05-1fa96f3eb34e	53	\N	2026-06-19 01:56:47.201083+00	fee143ec-cd2f-4b7d-a32c-dec975a3c56b
68	62c055cb-7c14-4a25-a516-82e706af495e	85	\N	2026-06-19 22:20:04.563065+00	c98a32e0-3e23-4d4f-afc3-0a41d8bc640d
69	6a8bc3fb-629f-4865-b5b4-776eafc74538	80	\N	2026-06-20 01:56:58.725381+00	c80ba7a5-2b30-4320-b40e-fbd2c2de7dbd
71	f8615d54-0169-477c-bfe3-a3b73ff5d0c9	87	\N	2026-06-21 23:55:17.824737+00	43eaae24-c653-41f0-a95e-87611d9a1934
73	2e9c070e-ca7e-46c6-8560-d1fff57f92b3	91	\N	2026-06-22 00:00:16.142296+00	e040e744-62ba-45ec-9de6-0953779038ea
74	2e9c070e-ca7e-46c6-8560-d1fff57f92b3	93	\N	2026-06-22 00:00:24.179871+00	fb16ced5-8840-4d1f-8693-778e67374a2d
75	2e9c070e-ca7e-46c6-8560-d1fff57f92b3	89	\N	2026-06-22 00:27:05.511528+00	581168c7-7215-4786-abc0-f35b48fb3156
76	eb4bb9df-45b1-40f5-bd05-1fa96f3eb34e	87	\N	2026-06-22 00:34:23.592446+00	45cbb0b0-0777-48c3-b5c1-b9cbf5931e32
78	7641a26e-39d0-402f-9285-55740a170fb8	87	\N	2026-06-22 01:02:21.323997+00	ef0957f7-b99c-4c4a-be51-0910d7d5f6e4
79	c4f8ad0c-62e8-4091-b409-fb9f18b9e401	100	\N	2026-06-22 02:32:03.505081+00	1cd2868d-dae3-474f-b5c5-248261702df6
80	c4f8ad0c-62e8-4091-b409-fb9f18b9e401	104	\N	2026-06-22 02:32:23.967+00	263de3d4-541b-4ae6-8bf9-746d05a1c231
81	c4f8ad0c-62e8-4091-b409-fb9f18b9e401	108	\N	2026-06-22 02:32:34.314744+00	d8a056a5-0586-4124-ae9f-022861d52615
82	c4f8ad0c-62e8-4091-b409-fb9f18b9e401	150	\N	2026-06-22 02:32:48.118234+00	16acaf50-7adf-4b36-bbce-603d99b1ee12
83	c4f8ad0c-62e8-4091-b409-fb9f18b9e401	125	\N	2026-06-22 02:32:57.54425+00	13baa085-c22e-4e28-ab3a-4fc9fea4241d
87	313aa7c4-9e4e-4688-ad46-03632eb7a1b7	89	\N	2026-06-22 12:57:29.932317+00	8d42ad7e-046f-4217-a021-3c127980ed69
88	313aa7c4-9e4e-4688-ad46-03632eb7a1b7	91	\N	2026-06-22 12:57:42.400595+00	d492065f-bc5d-4bda-9f16-69cc2a93cf30
89	313aa7c4-9e4e-4688-ad46-03632eb7a1b7	93	\N	2026-06-22 12:57:56.273084+00	13ed0a7a-3ecd-4621-8b82-8f61f27bd6e5
90	8c432067-65ea-444e-8748-7395b64e189f	87	\N	2026-06-22 13:35:41.592299+00	26bf66b0-4b0d-47f3-b453-b5af64dd9cac
91	3aabd89c-4942-4ec4-a90d-482970521a5c	127	\N	2026-06-22 13:36:08.243618+00	045bd329-248c-4c49-a9c8-0c8bb186b547
92	6674e02a-8f36-4f34-9fca-8f6ea2078391	127	\N	2026-06-22 13:36:08.32581+00	59cbde21-84e2-43fb-8281-9735c61ee5fc
93	6f56d3eb-d9a7-4dc6-b21b-9e2d782f6279	156	\N	2026-06-22 13:37:16.223968+00	1bab986a-6ab7-49b2-9040-0137b09b50e6
94	93fe1d9e-43b7-45d7-a8c3-90e1b8534d3b	100	\N	2026-06-22 15:24:59.336179+00	df9ac40a-7a54-4220-a01a-fdf9535a6707
97	397fd98f-5ade-4e16-985e-2b5a100a9e0a	89	\N	2026-06-23 02:14:56.743173+00	1bd93ba4-ced6-4fd9-bd02-79df159cc652
98	868cfb27-8906-43e9-a0eb-ca379d0eda5c	132	\N	2026-06-23 02:15:37.423895+00	dd86bd25-ac4e-40b5-81aa-364a11f9ea58
99	59f44a8c-27b4-401c-9446-60589768e3f7	132	\N	2026-06-23 02:15:49.656922+00	837c98a8-4ac2-4119-9ea2-67d31e9caefd
100	5765cbc3-4e60-4c6e-a67a-7434a2eceaa2	119	\N	2026-06-23 02:18:13.349656+00	c7d94875-1120-4506-bb1b-ac24e56ac0d4
101	cde2ce39-789a-466f-bbc8-67b66df323dd	119	\N	2026-06-23 02:18:13.35623+00	a67d7ec5-e79c-4839-967f-573822a87c83
102	6674e02a-8f36-4f34-9fca-8f6ea2078391	119	\N	2026-06-23 02:18:13.432911+00	50a6f33b-d2d9-49fb-9241-c3a59ce6fe3f
103	ba77969c-0f4b-4ec0-b955-32f8371fe1e9	119	\N	2026-06-23 02:18:29.956932+00	394e0641-3f7e-4ec5-b3a5-552a7775ee8b
105	ba77969c-0f4b-4ec0-b955-32f8371fe1e9	120	\N	2026-06-23 14:45:57.272694+00	60d7054c-bcba-42ff-b8df-5c08694d1dfd
107	5765cbc3-4e60-4c6e-a67a-7434a2eceaa2	120	\N	2026-06-23 14:46:19.909786+00	12464e4e-e62d-49dd-ba6c-eaaff95e6f3f
108	52e12368-a73f-4a64-824c-c47972832fcf	140	\N	2026-06-23 14:47:21.909297+00	923a288a-3b44-472f-8797-2b8b0689687c
109	52e12368-a73f-4a64-824c-c47972832fcf	141	\N	2026-06-23 14:47:39.21278+00	e9be7265-6664-4510-9d94-8cddddedb27b
110	9b88cb7c-71ca-48ec-991f-5953c7dcecfe	157	\N	2026-06-23 14:58:09.767196+00	2f579fc5-d9ef-45a9-8da4-63f5223c607c
112	93fe1d9e-43b7-45d7-a8c3-90e1b8534d3b	104	\N	2026-06-23 20:55:14.336258+00	0a23bd8e-fc25-49b2-8300-2037ebc9d2a6
113	0eba8b96-7ef9-4670-b5b7-e712fbba198e	103	\N	2026-06-23 22:38:39.637112+00	56b21415-f545-4629-b412-b925959638fc
114	272b28c4-4fc4-40e6-a68c-36c9ea63a410	160	\N	2026-06-23 22:40:11.189454+00	cab6570c-2041-4ee1-bd92-b64a2b9d55e2
115	7641a26e-39d0-402f-9285-55740a170fb8	91	\N	2026-06-24 02:45:43.213895+00	9c4b1895-e7b1-4c6a-889a-3f924e75e7e4
116	102d75b5-621c-4374-8cb2-96815092211b	108	\N	2026-06-24 03:11:06.445795+00	f916e5f3-cfbc-40d0-8a49-02547e4c3800
117	62c055cb-7c14-4a25-a516-82e706af495e	143	\N	2026-06-24 13:38:36.233019+00	af91722a-1491-4b03-8f0b-6972355706ae
118	9b88cb7c-71ca-48ec-991f-5953c7dcecfe	93	\N	2026-06-24 18:25:38.025724+00	69d64e1a-c5a9-40c3-b723-b61ac29763ed
119	ac1767d9-3628-46b5-b206-b9b2379cdca1	93	\N	2026-06-24 18:26:22.381971+00	ff84d59f-9342-49b7-9949-21420fc293d6
120	868cfb27-8906-43e9-a0eb-ca379d0eda5c	141	\N	2026-06-24 18:51:44.513545+00	3cee1274-0ca3-4e8d-b2b2-ec7618ef9272
121	7641a26e-39d0-402f-9285-55740a170fb8	122	\N	2026-06-24 19:08:52.762016+00	6470a0e6-61fc-4d58-b538-6291411e5313
124	0305b175-e348-4c2a-8f75-0b78e7cba54f	155	\N	2026-06-25 01:47:23.635111+00	ea5e68d7-2b78-47ad-9b3e-792086da6646
126	9b88cb7c-71ca-48ec-991f-5953c7dcecfe	122	\N	2026-06-25 15:06:48.739061+00	ea49c989-8ecf-4cec-9002-9afaf8c1a2b7
130	272b28c4-4fc4-40e6-a68c-36c9ea63a410	161	\N	2026-06-25 18:45:00.877357+00	da0db827-7278-4ca7-b3c5-f007dbe7794d
131	9b88cb7c-71ca-48ec-991f-5953c7dcecfe	150	\N	2026-06-25 18:45:45.737642+00	9c7c2ac5-3d51-4917-ae20-73c8f2d8421f
134	d3d4d0e6-00ad-4034-aa71-630d16f974db	150	\N	2026-06-25 18:50:47.823087+00	1dfde822-c804-40da-868c-9700828f4028
136	eb4bb9df-45b1-40f5-bd05-1fa96f3eb34e	163	\N	2026-06-25 18:51:12.094869+00	f2156776-e41b-4f9c-85e1-516fd169ad6c
137	93fe1d9e-43b7-45d7-a8c3-90e1b8534d3b	125	\N	2026-06-25 19:31:57.646892+00	9ca312c6-388a-4802-8fec-644c18c740ee
139	6674e02a-8f36-4f34-9fca-8f6ea2078391	167	\N	2026-06-25 23:27:14.692343+00	beef746d-05ee-4fc7-87f2-5bc76653c9c0
140	ba77969c-0f4b-4ec0-b955-32f8371fe1e9	167	\N	2026-06-25 23:27:23.849074+00	8a55c439-3447-480d-8d54-4ee86d1280db
141	3aabd89c-4942-4ec4-a90d-482970521a5c	167	\N	2026-06-25 23:27:52.587542+00	87c425b0-ec55-4e09-b2ba-8c4c4ff0d1a8
142	9b88cb7c-71ca-48ec-991f-5953c7dcecfe	125	\N	2026-06-26 03:01:38.098707+00	e8fc650f-df28-455c-b413-1becaee02dc1
143	102d75b5-621c-4374-8cb2-96815092211b	122	\N	2026-06-26 03:46:39.611052+00	8218c5b5-0186-4f45-ae9e-0bd3ffd5768d
144	6674e02a-8f36-4f34-9fca-8f6ea2078391	125	\N	2026-06-26 19:49:12.467863+00	f03b32d1-a235-4142-9238-089fe12d2972
145	ac1767d9-3628-46b5-b206-b9b2379cdca1	125	\N	2026-06-26 19:49:12.680859+00	ddf3ff73-4d7f-474e-8f4a-0e654926e2b7
146	0305b175-e348-4c2a-8f75-0b78e7cba54f	169	\N	2026-06-26 19:51:25.355061+00	0a77ca7c-b8ca-43d0-8b95-6adfe50ba2bc
147	62c055cb-7c14-4a25-a516-82e706af495e	171	\N	2026-06-26 19:52:04.544569+00	da264e70-dea2-466d-ae11-02074f4849f8
148	2e9c070e-ca7e-46c6-8560-d1fff57f92b3	190	\N	2026-06-29 21:38:08.026551+00	c3654c0e-23b3-417e-aaff-d03f5d853d45
149	313aa7c4-9e4e-4688-ad46-03632eb7a1b7	190	\N	2026-06-29 21:39:29.001663+00	b4508dbc-5f81-4cfa-9cbc-f3687b1575a6
151	ac1767d9-3628-46b5-b206-b9b2379cdca1	190	\N	2026-06-30 00:06:06.96695+00	3599ed9d-5d2e-431f-b8d4-417121264aef
152	d3d4d0e6-00ad-4034-aa71-630d16f974db	174	\N	2026-06-30 00:09:01.450995+00	a6ceee96-bfa9-4012-98e3-7a7a428c4db1
155	f8615d54-0169-477c-bfe3-a3b73ff5d0c9	172	\N	2026-06-30 00:27:11.963155+00	1c412f5e-b51b-424c-8cdd-af241ee9ff74
156	eb4bb9df-45b1-40f5-bd05-1fa96f3eb34e	172	\N	2026-06-30 01:03:59.082932+00	26638b20-0dc3-46f5-8337-e78fbad8d779
157	52e12368-a73f-4a64-824c-c47972832fcf	199	\N	2026-06-30 17:40:41.616676+00	0ef71f2a-9a2e-44a7-b730-61b355bb67f1
158	a059cb8d-6ffd-472a-ac06-698937d3ce79	194	\N	2026-06-30 18:15:52.293994+00	d93fe0f7-4a72-47af-83d8-7dc5689d7fa3
159	2e9c070e-ca7e-46c6-8560-d1fff57f92b3	206	\N	2026-06-30 18:47:50.919482+00	76472a3f-c130-42a5-b7a0-c0e90777307e
160	2e9c070e-ca7e-46c6-8560-d1fff57f92b3	218	\N	2026-06-30 18:47:57.69479+00	039be24f-555d-49d7-99e1-238a2ee58ca0
161	313aa7c4-9e4e-4688-ad46-03632eb7a1b7	206	\N	2026-06-30 18:48:40.314293+00	f6e01575-4b5a-469b-9dc9-5734fcaf0a2c
162	313aa7c4-9e4e-4688-ad46-03632eb7a1b7	218	\N	2026-06-30 18:48:45.692878+00	8a56f012-151c-42bf-b1a5-bd7b3870ec3e
164	d3d4d0e6-00ad-4034-aa71-630d16f974db	194	\N	2026-07-01 03:52:00.586191+00	2a91bbcb-f071-47eb-a65e-6d2f9062b765
166	c4f8ad0c-62e8-4091-b409-fb9f18b9e401	204	\N	2026-07-01 13:34:38.449061+00	d9a5a86f-2989-493a-aff8-9af69f955a6a
167	48855b53-fa1a-4189-a559-1a95a30d5cea	204	\N	2026-07-01 15:08:50.783+00	93ce3be3-4133-4bb3-bff6-ab49d78f6b7c
170	f8615d54-0169-477c-bfe3-a3b73ff5d0c9	206	\N	2026-07-02 03:21:24.135606+00	d2725deb-ff0f-4e96-bccc-ab46d4fca20e
171	eb4bb9df-45b1-40f5-bd05-1fa96f3eb34e	206	\N	2026-07-02 11:12:19.424889+00	5fcde43a-7ee6-47c4-9cbb-518693e44f85
172	f0b3bb7f-95ee-41c4-ae91-193e4a91dab4	240	\N	2026-07-02 16:05:01.640549+00	4594a775-fd08-430c-907c-a550cbfd8055
173	5765cbc3-4e60-4c6e-a67a-7434a2eceaa2	240	\N	2026-07-02 20:51:12.238358+00	caf0031f-e8b0-4e11-9bed-3fff69ca2926
174	ba77969c-0f4b-4ec0-b955-32f8371fe1e9	240	\N	2026-07-02 20:51:12.642778+00	d8e8abad-3bd3-460e-8cb0-4c5f75325174
175	9b88cb7c-71ca-48ec-991f-5953c7dcecfe	240	\N	2026-07-02 20:51:20.225461+00	4843352b-7c3e-43d0-a179-8c9aef68b997
176	f51facd1-c0d2-44f6-a621-4659d556e9af	218	\N	2026-07-02 21:19:24.670178+00	63000cdf-834a-437e-8aae-9d59d4cfb38b
179	f8615d54-0169-477c-bfe3-a3b73ff5d0c9	218	\N	2026-07-03 02:27:09.118448+00	f3c7005c-23f7-449b-a0bb-53d7632cb489
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, message, type, read, created_at) FROM stdin;
42	📅 Juan Esteban Suarez Quintero reservó entrenamiento fuerza para el 2026-06-17 a las 6:30 PM.	new_booking	f	2026-06-17 00:48:49.929168+00
43	📅 Juan Esteban Suarez Quintero reservó entrenamiento fuerza para el 2026-06-18 a las 6:30 PM.	new_booking	f	2026-06-17 00:49:10.838765+00
44	📅 Juan Esteban Suarez Quintero reservó entrenamiento fuerza para el 2026-06-19 a las 6:30 PM.	new_booking	f	2026-06-17 00:49:23.938661+00
45	📅 Juan Sebastián Marín Giraldo  reservó entrenamiento fuerza para el 2026-06-17 a las 6:30 PM.	new_booking	f	2026-06-17 00:49:36.31869+00
46	📅 Camila zuluaga reservó entrenamiento fuerza para el 2026-06-17 a las 6:30 AM.	new_booking	f	2026-06-17 00:59:50.105337+00
47	❌ Camila zuluaga ha CANCELADO su reserva de entrenamiento fuerza para el 2026-06-17 a las 6:30 AM.	cancel_booking	f	2026-06-17 11:36:43.818369+00
48	📅 Camila zuluaga reservó entrenamiento fuerza para el 2026-06-18 a las 6:30 AM.	new_booking	f	2026-06-17 11:39:19.896656+00
49	📅 Camila zuluaga reservó entrenamiento fuerza para el 2026-06-19 a las 8:00 PM.	new_booking	f	2026-06-17 11:39:35.785225+00
50	El usuario Camila zuluaga ha cancelado su reserva de entrenamiento fuerza para el 2026-06-19 a las 8:00 PM.	cancelation	f	2026-06-17 11:41:31.23967+00
51	📅 Camila zuluaga reservó entrenamiento fuerza para el 2026-06-19 a las 8:00 PM.	new_booking	f	2026-06-17 11:41:45.545985+00
52	El usuario Camila zuluaga ha cancelado su reserva de entrenamiento fuerza para el 2026-06-18 a las 6:30 AM.	cancelation	f	2026-06-17 11:42:16.080081+00
53	El usuario Camila zuluaga ha cancelado su reserva de entrenamiento fuerza para el 2026-06-19 a las 8:00 PM.	cancelation	f	2026-06-17 11:42:17.824375+00
54	📅 Camila zuluaga reservó entrenamiento fuerza para el 2026-06-18 a las 6:30 AM.	new_booking	f	2026-06-17 11:42:35.393092+00
29	📅 Reserva manual (Admin) para Heidy suarez de fuerza para el 2026-06-16 a las 8:50 AM.	new_booking	f	2026-06-16 11:39:21.629357+00
30	📅 Reserva manual (Admin) para celmira Serna de fuerza para el 2026-06-16 a las 8:50 AM.	new_booking	f	2026-06-16 11:39:48.167932+00
31	📅 Reserva manual (Admin) para Viviana Botero de fuerza para el 2026-06-16 a las 8:50 AM.	new_booking	f	2026-06-16 11:39:48.180056+00
32	📅 Reserva manual (Admin) para Sindy Duque de fuerza para el 2026-06-16 a las 8:50 AM.	new_booking	f	2026-06-16 11:39:48.239506+00
33	📅 Reserva manual (Admin) para Tomas Morales  de personalizado para el 2026-06-16 a las 3:00 PM.	new_booking	f	2026-06-16 11:41:09.824404+00
34	📅 Reserva manual (Admin) para Santi Gómez  de fuerza para el 2026-06-16 a las 3:00 PM.	new_booking	f	2026-06-16 11:41:18.164208+00
35	📅 Erika Quintero reservó entrenamiento fuerza para el 2026-06-18 a las 6:30 AM.	new_booking	f	2026-06-16 12:41:13.410139+00
36	📅 Isabela Pareja reservó entrenamiento fuerza para el 2026-06-17 a las 6:30 AM.	new_booking	f	2026-06-16 12:43:52.667793+00
37	📅 Isabela Pareja reservó entrenamiento fuerza para el 2026-06-18 a las 6:30 AM.	new_booking	f	2026-06-16 12:44:06.668377+00
38	📅 Yazmin Morales reservó entrenamiento fuerza para el 2026-06-16 a las 6:30 PM.	new_booking	f	2026-06-16 18:37:19.996346+00
39	📅 Yazmin Morales reservó entrenamiento fuerza para el 2026-06-17 a las 6:30 AM.	new_booking	f	2026-06-16 18:38:30.753188+00
40	📅 Santiago Suarez Garcia reservó entrenamiento fuerza para el 2026-06-17 a las 6:30 AM.	new_booking	f	2026-06-16 22:00:53.066848+00
41	📅 Duverley Marin Gonzalez reservó entrenamiento fuerza para el 2026-06-17 a las 6:30 AM.	new_booking	f	2026-06-16 23:03:11.986148+00
55	📅 Camila zuluaga reservó entrenamiento fuerza para el 2026-06-19 a las 8:00 PM.	new_booking	f	2026-06-17 11:42:45.529066+00
56	📅 Santiago Suarez Garcia reservó entrenamiento fuerza para el 2026-06-18 a las 8:00 PM.	new_booking	f	2026-06-17 12:59:55.096074+00
57	📅 Duverley Marin Gonzalez reservó entrenamiento fuerza para el 2026-06-18 a las 6:30 AM.	new_booking	f	2026-06-17 13:43:59.070104+00
58	📅 Reserva manual (Admin) para Daniel Rincon  de fuerza para el 2026-06-17 a las 6:30 PM.	new_booking	f	2026-06-17 20:02:09.110987+00
59	📅 Reserva manual (Admin) para Lucho Carvajal  de personalizado para el 2026-06-17 a las 7:30 PM.	new_booking	f	2026-06-17 20:02:45.777045+00
60	📅 Reserva manual (Admin) para Camila zuluaga de fuerza para el 2026-06-17 a las 7:30 PM.	new_booking	f	2026-06-17 20:02:58.65143+00
61	📅 Reserva manual (Admin) para Mariana  Serna  de fuerza para el 2026-06-17 a las 7:30 PM.	new_booking	f	2026-06-17 20:03:10.484006+00
62	📅 Reserva manual (Admin) para Viviana Botero de fuerza para el 2026-06-17 a las 3:00 PM.	new_booking	f	2026-06-17 20:05:25.441404+00
63	📅 Reserva manual (Admin) para  Diana Gómez  de fuerza para el 2026-06-17 a las 3:00 PM.	new_booking	f	2026-06-17 20:05:37.822246+00
64	📅 Reserva manual (Admin) para Santi Gómez  de fuerza para el 2026-06-17 a las 3:00 PM.	new_booking	f	2026-06-17 20:11:57.528223+00
65	📅 Reserva manual (Admin) para Sindy Duque de fuerza para el 2026-06-18 a las 8:50 AM.	new_booking	f	2026-06-17 21:15:28.93884+00
66	📅 Viviana botero zuluaga reservó entrenamiento fuerza para el 2026-06-18 a las 8:50 AM.	new_booking	f	2026-06-17 21:18:00.487616+00
67	📅 Reserva manual (Admin) para  Diana Gómez  de fuerza para el 2026-06-18 a las 6:30 AM.	new_booking	f	2026-06-17 21:23:07.697627+00
68	📅 Daniel Rincon reservó entrenamiento fuerza para el 2026-06-17 a las 6:30 PM.	new_booking	f	2026-06-17 23:03:51.665479+00
69	📅 Daniel Rincon reservó entrenamiento fuerza para el 2026-06-18 a las 6:30 PM.	new_booking	f	2026-06-17 23:04:17.340342+00
70	El usuario Camila zuluaga ha cancelado su reserva de entrenamiento fuerza para el 2026-06-19 a las 8:00 PM.	cancelation	f	2026-06-18 00:26:22.838823+00
71	📅 Camila zuluaga reservó entrenamiento fuerza para el 2026-06-19 a las 6:30 AM.	new_booking	f	2026-06-18 00:26:50.786095+00
72	📅 Reserva manual (Admin) para Santi Gómez  de fuerza para el 2026-06-18 a las 5:30 PM.	new_booking	f	2026-06-18 13:40:36.093566+00
73	📅 Reserva manual (Admin) para Lucho Carvajal  de personalizado para el 2026-06-19 a las 8:00 PM.	new_booking	f	2026-06-18 13:42:58.518052+00
74	📅 Reserva manual (Admin) para Sindy Duque de fuerza para el 2026-06-20 a las 8:20 AM.	new_booking	f	2026-06-18 15:00:14.981056+00
75	📅 Sindy  reservó entrenamiento fuerza para el 2026-06-20 a las 8:20 AM.	new_booking	f	2026-06-18 17:52:46.760538+00
76	❌ Santiago Suarez Garcia ha CANCELADO su reserva de entrenamiento fuerza para el 2026-06-18 a las 8:00 PM.	cancel_booking	f	2026-06-19 00:11:55.925869+00
77	📅 Erika Quintero reservó entrenamiento fuerza para el 2026-06-20 a las 7:00 AM.	new_booking	f	2026-06-19 00:38:36.749141+00
78	📅 Santiago Suarez Garcia reservó entrenamiento fuerza para el 2026-06-19 a las 6:30 PM.	new_booking	f	2026-06-19 01:56:47.205095+00
79	📅 Reserva manual (Admin) para Lucho Carvajal  de personalizado para el 2026-06-19 a las 7:30 PM.	new_booking	f	2026-06-19 22:20:04.567777+00
80	📅 Yesica Milena Giraldo Gómez  reservó entrenamiento personalizado para el 2026-06-20 a las 9:40 AM.	new_booking	f	2026-06-20 01:56:58.729541+00
81	📅 Camila zuluaga reservó entrenamiento fuerza para el 2026-06-20 a las 7:00 AM.	new_booking	f	2026-06-20 02:25:20.647642+00
82	📅 Yazmin Morales reservó entrenamiento fuerza para el 2026-06-22 a las 6:30 AM.	new_booking	f	2026-06-21 23:55:17.922575+00
83	📅 Isabela Pareja reservó entrenamiento fuerza para el 2026-06-23 a las 6:30 AM.	new_booking	f	2026-06-22 00:00:09.454529+00
84	📅 Isabela Pareja reservó entrenamiento fuerza para el 2026-06-24 a las 6:30 AM.	new_booking	f	2026-06-22 00:00:16.146847+00
85	📅 Isabela Pareja reservó entrenamiento fuerza para el 2026-06-25 a las 6:30 AM.	new_booking	f	2026-06-22 00:00:24.183446+00
86	El usuario Isabela Pareja ha cancelado su reserva de entrenamiento fuerza para el 2026-06-23 a las 6:30 AM.	cancelation	f	2026-06-22 00:26:38.076486+00
87	📅 Isabela Pareja reservó entrenamiento fuerza para el 2026-06-23 a las 6:30 AM.	new_booking	f	2026-06-22 00:27:05.515733+00
88	📅 Santiago Suarez Garcia reservó entrenamiento fuerza para el 2026-06-22 a las 6:30 AM.	new_booking	f	2026-06-22 00:34:23.598467+00
89	📅 Reserva manual (Admin) para Diana Marcela Gómez  de fuerza para el 2026-06-22 a las 6:30 AM.	new_booking	f	2026-06-22 01:00:33.072051+00
90	📅 Duverley Marin Gonzalez reservó entrenamiento fuerza para el 2026-06-22 a las 6:30 AM.	new_booking	f	2026-06-22 01:02:21.329736+00
91	📅 Juan Esteban Suarez Quintero reservó entrenamiento fuerza para el 2026-06-22 a las 6:30 PM.	new_booking	f	2026-06-22 02:32:03.512054+00
92	📅 Juan Esteban Suarez Quintero reservó entrenamiento fuerza para el 2026-06-23 a las 6:30 PM.	new_booking	f	2026-06-22 02:32:23.970845+00
93	📅 Juan Esteban Suarez Quintero reservó entrenamiento fuerza para el 2026-06-24 a las 6:30 PM.	new_booking	f	2026-06-22 02:32:34.318525+00
94	📅 Juan Esteban Suarez Quintero reservó entrenamiento fuerza para el 2026-06-25 a las 6:50 PM.	new_booking	f	2026-06-22 02:32:48.121766+00
95	📅 Juan Esteban Suarez Quintero reservó entrenamiento fuerza para el 2026-06-26 a las 6:30 PM.	new_booking	f	2026-06-22 02:32:57.547931+00
96	📅 Reserva manual (Admin) para Erika Quintero de fuerza para el 2026-06-23 a las 6:30 AM.	new_booking	f	2026-06-22 12:57:29.936796+00
97	📅 Reserva manual (Admin) para Erika Quintero de fuerza para el 2026-06-24 a las 6:30 AM.	new_booking	f	2026-06-22 12:57:42.404742+00
98	📅 Reserva manual (Admin) para Erika Quintero de fuerza para el 2026-06-25 a las 6:30 AM.	new_booking	f	2026-06-22 12:57:56.276586+00
99	📅 Reserva manual (Admin) para  Diana Gómez  de fuerza para el 2026-06-22 a las 6:30 AM.	new_booking	f	2026-06-22 13:35:41.600367+00
100	📅 Reserva manual (Admin) para Heidy suarez de fuerza para el 2026-06-22 a las 7:30 PM.	new_booking	f	2026-06-22 13:36:08.247686+00
101	📅 Reserva manual (Admin) para Sindy  de fuerza para el 2026-06-22 a las 7:30 PM.	new_booking	f	2026-06-22 13:36:08.330261+00
102	📅 Reserva manual (Admin) para Steicy  de personalizado para el 2026-06-22 a las 8:30 AM.	new_booking	f	2026-06-22 13:37:16.231085+00
103	📅 Daniel Rincon reservó entrenamiento fuerza para el 2026-06-22 a las 6:30 PM.	new_booking	f	2026-06-22 15:24:59.342206+00
104	📅 Camila zuluaga reservó entrenamiento fuerza para el 2026-06-22 a las 7:30 PM.	new_booking	f	2026-06-22 21:26:50.202678+00
105	📅 Juan Sebastián Marín Giraldo  reservó entrenamiento fuerza para el 2026-06-23 a las 6:30 PM.	new_booking	f	2026-06-23 01:54:54.071835+00
106	📅 Reserva manual (Admin) para Mariana  Serna  de fuerza para el 2026-06-23 a las 6:30 AM.	new_booking	f	2026-06-23 02:14:56.74742+00
107	📅 Reserva manual (Admin) para MARTIN  de personalizado para el 2026-06-23 a las 10:00 AM.	new_booking	f	2026-06-23 02:15:37.427953+00
108	📅 Reserva manual (Admin) para MATIAS DUQUE  de personalizado para el 2026-06-23 a las 10:00 AM.	new_booking	f	2026-06-23 02:15:49.660716+00
109	📅 Reserva manual (Admin) para Sindy Duque de fuerza para el 2026-06-23 a las 8:30 AM.	new_booking	f	2026-06-23 02:18:13.354399+00
110	📅 Reserva manual (Admin) para celmira Serna de fuerza para el 2026-06-23 a las 8:30 AM.	new_booking	f	2026-06-23 02:18:13.364567+00
111	📅 Reserva manual (Admin) para Sindy  de fuerza para el 2026-06-23 a las 8:30 AM.	new_booking	f	2026-06-23 02:18:13.437683+00
112	📅 Reserva manual (Admin) para Guadulupe  de fuerza para el 2026-06-23 a las 8:30 AM.	new_booking	f	2026-06-23 02:18:29.962403+00
113	📅 Mariana Serna A reservó entrenamiento fuerza para el 2026-06-24 a las 6:30 AM.	new_booking	f	2026-06-23 02:38:17.477974+00
114	📅 Reserva manual (Admin) para Guadulupe  de fuerza para el 2026-06-24 a las 8:30 AM.	new_booking	f	2026-06-23 14:45:57.277064+00
115	📅 Reserva manual (Admin) para Heidy suarez de fuerza para el 2026-06-24 a las 8:30 AM.	new_booking	f	2026-06-23 14:46:19.909059+00
116	📅 Reserva manual (Admin) para Sindy Duque de fuerza para el 2026-06-24 a las 8:30 AM.	new_booking	f	2026-06-23 14:46:19.914908+00
117	📅 Reserva manual (Admin) para jeronimo  de personalizado para el 2026-06-24 a las 10:00 AM.	new_booking	f	2026-06-23 14:47:21.913219+00
118	📅 Reserva manual (Admin) para jeronimo  de personalizado para el 2026-06-26 a las 10:00 AM.	new_booking	f	2026-06-23 14:47:39.216459+00
119	📅 Reserva manual (Admin) para Administrador de fuerza para el 2026-06-26 a las 3:00 PM.	new_booking	f	2026-06-23 14:58:09.771531+00
120	El usuario Juan Sebastián Marín Giraldo  ha cancelado su reserva de entrenamiento fuerza para el 2026-06-23 a las 6:30 PM.	cancelation	f	2026-06-23 19:27:35.257824+00
121	📅 Reserva manual (Admin) para  Diana Gómez  de fuerza para el 2026-06-24 a las 6:30 AM.	new_booking	f	2026-06-23 20:54:55.749555+00
122	📅 Reserva manual (Admin) para Daniel Rincon de fuerza para el 2026-06-23 a las 6:30 PM.	new_booking	f	2026-06-23 20:55:14.340377+00
123	📅 Reserva manual (Admin) para Santi Gómez  de fuerza para el 2026-06-23 a las 4:10 PM.	new_booking	f	2026-06-23 22:38:39.641473+00
124	📅 Reserva manual (Admin) para Thomas  de personalizado para el 2026-06-23 a las 5:30 PM.	new_booking	f	2026-06-23 22:40:11.193602+00
125	📅 Duverley Marin Gonzalez reservó entrenamiento fuerza para el 2026-06-24 a las 6:30 AM.	new_booking	f	2026-06-24 02:45:43.218831+00
126	📅 Mariana Serna A reservó entrenamiento fuerza para el 2026-06-24 a las 6:30 PM.	new_booking	f	2026-06-24 03:11:06.450423+00
127	📅 Reserva manual (Admin) para Lucho Carvajal  de personalizado para el 2026-06-24 a las 7:30 PM.	new_booking	f	2026-06-24 13:38:36.237437+00
128	📅 Reserva manual (Admin) para Administrador de fuerza para el 2026-06-25 a las 6:30 AM.	new_booking	f	2026-06-24 18:25:38.030346+00
129	📅 Reserva manual (Admin) para Mam de fuerza para el 2026-06-25 a las 6:30 AM.	new_booking	f	2026-06-24 18:26:22.387366+00
130	📅 Reserva manual (Admin) para MARTIN  de personalizado para el 2026-06-26 a las 10:00 AM.	new_booking	f	2026-06-24 18:51:44.521395+00
131	📅 Duverley Marin Gonzalez reservó entrenamiento fuerza para el 2026-06-26 a las 6:30 AM.	new_booking	f	2026-06-24 19:08:52.76626+00
132	📅 Camila zuluaga reservó entrenamiento fuerza para el 2026-06-24 a las 7:30 PM.	new_booking	f	2026-06-24 21:28:58.04438+00
133	📅 Camila zuluaga reservó entrenamiento fuerza para el 2026-06-25 a las 6:30 AM.	new_booking	f	2026-06-25 01:07:48.931988+00
134	📅 Reserva manual (Admin) para Juan Sierra  de personalizado para el 2026-06-25 a las 5:40 PM.	new_booking	f	2026-06-25 01:47:23.640814+00
135	📅 Camila zuluaga reservó entrenamiento fuerza para el 2026-06-25 a las 6:50 PM.	new_booking	f	2026-06-25 12:34:32.158375+00
136	📅 Reserva manual (Admin) para Administrador de fuerza para el 2026-06-26 a las 6:30 AM.	new_booking	f	2026-06-25 15:06:48.743387+00
137	📅 Camila zuluaga reservó entrenamiento fuerza para el 2026-06-25 a las 7:30 PM.	new_booking	f	2026-06-25 17:24:01.474051+00
138	El usuario Camila zuluaga ha cancelado su reserva de entrenamiento fuerza para el 2026-06-25 a las 6:30 AM.	cancelation	f	2026-06-25 17:24:07.402391+00
139	El usuario Camila zuluaga ha cancelado su reserva de entrenamiento fuerza para el 2026-06-25 a las 6:50 PM.	cancelation	f	2026-06-25 17:24:08.984206+00
140	El usuario Camila zuluaga ha cancelado su reserva de entrenamiento fuerza para el 2026-06-25 a las 7:30 PM.	cancelation	f	2026-06-25 17:24:17.922465+00
141	El usuario Camila zuluaga ha cancelado su reserva de entrenamiento fuerza para el 2026-06-24 a las 7:30 PM.	cancelation	f	2026-06-25 17:24:20.372671+00
142	El usuario Camila zuluaga ha cancelado su reserva de entrenamiento fuerza para el 2026-06-22 a las 7:30 PM.	cancelation	f	2026-06-25 17:24:22.617295+00
143	El usuario Camila zuluaga ha cancelado su reserva de entrenamiento fuerza para el 2026-06-20 a las 7:00 AM.	cancelation	f	2026-06-25 17:24:23.724732+00
144	El usuario Camila zuluaga ha cancelado su reserva de entrenamiento fuerza para el 2026-06-19 a las 6:30 AM.	cancelation	f	2026-06-25 17:24:25.696633+00
145	El usuario Camila zuluaga ha cancelado su reserva de entrenamiento fuerza para el 2026-06-18 a las 6:30 AM.	cancelation	f	2026-06-25 17:24:27.697338+00
146	El usuario Camila zuluaga ha cancelado su reserva de entrenamiento fuerza para el 2026-06-17 a las 7:30 PM.	cancelation	f	2026-06-25 17:24:28.765876+00
147	📅 Camila zuluaga reservó entrenamiento fuerza para el 2026-06-25 a las 7:30 PM.	new_booking	f	2026-06-25 17:24:35.875487+00
148	El usuario Camila zuluaga ha cancelado su reserva de entrenamiento fuerza para el 2026-06-25 a las 7:30 PM.	cancelation	f	2026-06-25 17:24:46.830014+00
149	📅 Camila zuluaga reservó entrenamiento fuerza para el 2026-06-25 a las 6:50 PM.	new_booking	f	2026-06-25 17:24:52.66573+00
150	📅 Reserva manual (Admin) para Thomas  de personalizado para el 2026-06-25 a las 9:00 AM.	new_booking	f	2026-06-25 18:45:00.882262+00
151	📅 Reserva manual (Admin) para Administrador de fuerza para el 2026-06-25 a las 6:50 PM.	new_booking	f	2026-06-25 18:45:45.742854+00
152	📅 Reserva manual (Admin) para Santiago Suarez Garcia de fuerza para el 2026-06-25 a las 6:50 PM.	new_booking	f	2026-06-25 18:46:03.271851+00
153	📅 Reserva manual (Admin) para Yesica Milena Giraldo Gómez  de fuerza para el 2026-06-25 a las 6:50 PM.	new_booking	f	2026-06-25 18:49:56.081766+00
154	📅 Reserva manual (Admin) para Diana Gómez  de fuerza para el 2026-06-25 a las 6:50 PM.	new_booking	f	2026-06-25 18:50:47.919092+00
155	📅 Reserva manual (Admin) para Yesica Milena Giraldo Gómez  de fuerza para el 2026-06-25 a las 6:50 PM.	new_booking	f	2026-06-25 18:51:00.436439+00
156	📅 Reserva manual (Admin) para Santiago Suarez Garcia de fuerza para el 2026-06-25 a las 7:50 PM.	new_booking	f	2026-06-25 18:51:12.098716+00
157	📅 Daniel Rincon reservó entrenamiento fuerza para el 2026-06-26 a las 6:30 PM.	new_booking	f	2026-06-25 19:31:57.651165+00
158	📅 Yesica Milena Giraldo Gómez  reservó entrenamiento fuerza para el 2026-06-25 a las 7:50 PM.	new_booking	f	2026-06-25 20:46:26.074641+00
159	📅 Reserva manual (Admin) para Sindy  de fuerza para el 2026-06-26 a las 7:30 AM.	new_booking	f	2026-06-25 23:27:14.69672+00
160	📅 Reserva manual (Admin) para Guadulupe  de fuerza para el 2026-06-26 a las 7:30 AM.	new_booking	f	2026-06-25 23:27:23.932086+00
161	📅 Reserva manual (Admin) para Heidy suarez de fuerza para el 2026-06-26 a las 7:30 AM.	new_booking	f	2026-06-25 23:27:52.591918+00
162	El usuario Yesica Milena Giraldo Gómez  ha cancelado su reserva de entrenamiento fuerza para el 2026-06-25 a las 7:50 PM.	cancelation	f	2026-06-25 23:55:02.427862+00
163	📅 Reserva manual (Admin) para Administrador de fuerza para el 2026-06-26 a las 6:30 PM.	new_booking	f	2026-06-26 03:01:38.103286+00
164	📅 Mariana Serna A reservó entrenamiento fuerza para el 2026-06-26 a las 6:30 AM.	new_booking	f	2026-06-26 03:46:39.619475+00
165	📅 Reserva manual (Admin) para Sindy  de fuerza para el 2026-06-26 a las 6:30 PM.	new_booking	f	2026-06-26 19:49:12.473965+00
166	📅 Reserva manual (Admin) para Mam de fuerza para el 2026-06-26 a las 6:30 PM.	new_booking	f	2026-06-26 19:49:12.68474+00
167	📅 Reserva manual (Admin) para Juan Sierra  de personalizado para el 2026-06-26 a las 5:30 PM.	new_booking	f	2026-06-26 19:51:25.359241+00
168	📅 Reserva manual (Admin) para Lucho Carvajal  de personalizado para el 2026-06-26 a las 7:30 PM.	new_booking	f	2026-06-26 19:52:04.552055+00
169	📅 Isabela Pareja reservó entrenamiento fuerza para el 2026-06-30 a las 6:00 PM.	new_booking	f	2026-06-29 21:38:08.117808+00
170	📅 Erika Quintero reservó entrenamiento fuerza para el 2026-06-30 a las 6:00 PM.	new_booking	f	2026-06-29 21:39:29.008753+00
171	📅 Reserva manual (Admin) para Thomas  de personalizado para el 2026-06-30 a las 9:30 AM.	new_booking	f	2026-06-29 23:56:04.601568+00
172	📅 Reserva manual (Admin) para Mam de fuerza para el 2026-06-30 a las 6:00 PM.	new_booking	f	2026-06-30 00:06:06.971432+00
173	📅 Reserva manual (Admin) para Diana Gómez  de fuerza para el 2026-06-30 a las 8:30 AM.	new_booking	f	2026-06-30 00:09:01.45626+00
174	📅 Reserva manual (Admin) para Yazmin Morales de fuerza para el 2026-06-30 a las 6:30 AM.	new_booking	f	2026-06-30 00:14:01.447241+00
175	📅 Miguel Arcila reservó entrenamiento fuerza para el 2026-06-30 a las 6:30 AM.	new_booking	f	2026-06-30 00:19:26.856053+00
176	❌ Miguel Arcila ha CANCELADO su reserva de entrenamiento fuerza para el 2026-06-30 a las 6:30 AM.	cancel_booking	f	2026-06-30 00:21:46.211221+00
177	📅 Yazmin Morales reservó entrenamiento fuerza para el 2026-06-30 a las 6:30 AM.	new_booking	f	2026-06-30 00:27:11.968166+00
178	📅 Santiago Suarez Garcia reservó entrenamiento fuerza para el 2026-06-30 a las 6:30 AM.	new_booking	f	2026-06-30 01:03:59.087238+00
179	📅 Reserva manual (Admin) para jeronimo  de personalizado para el 2026-07-01 a las 9:40 AM.	new_booking	f	2026-06-30 17:40:41.62109+00
180	📅 Andrea Buitrago CastaÃ±o reservó entrenamiento fuerza para el 2026-07-01 a las 6:30 AM.	new_booking	f	2026-06-30 18:15:52.303109+00
181	📅 Isabela Pareja reservó entrenamiento fuerza para el 2026-07-02 a las 6:30 AM.	new_booking	f	2026-06-30 18:47:50.951087+00
182	📅 Isabela Pareja reservó entrenamiento fuerza para el 2026-07-03 a las 6:30 AM.	new_booking	f	2026-06-30 18:47:57.702067+00
183	📅 Erika Quintero reservó entrenamiento fuerza para el 2026-07-02 a las 6:30 AM.	new_booking	f	2026-06-30 18:48:40.319386+00
184	📅 Erika Quintero reservó entrenamiento fuerza para el 2026-07-03 a las 6:30 AM.	new_booking	f	2026-06-30 18:48:45.696578+00
185	📅 Camila zuluaga reservó entrenamiento fuerza para el 2026-07-01 a las 6:30 AM.	new_booking	f	2026-07-01 03:41:18.118731+00
186	📅 Reserva manual (Admin) para Diana Gómez  de fuerza para el 2026-07-01 a las 6:30 AM.	new_booking	f	2026-07-01 03:52:00.596596+00
187	El usuario Camila zuluaga ha cancelado su reserva de entrenamiento fuerza para el 2026-07-01 a las 6:30 AM.	cancelation	f	2026-07-01 11:19:38.920999+00
188	El usuario Camila zuluaga ha cancelado su reserva de entrenamiento fuerza para el 2026-06-25 a las 6:50 PM.	cancelation	f	2026-07-01 11:19:41.200938+00
189	📅 Camila zuluaga reservó entrenamiento fuerza para el 2026-07-01 a las 7:40 PM.	new_booking	f	2026-07-01 11:19:52.858776+00
190	📅 Juan Esteban Suarez Quintero reservó entrenamiento fuerza para el 2026-07-01 a las 6:30 PM.	new_booking	f	2026-07-01 13:34:38.454411+00
191	📅 Juan Sebastián Marín Giraldo  reservó entrenamiento fuerza para el 2026-07-01 a las 6:30 PM.	new_booking	f	2026-07-01 15:08:50.787457+00
192	📅 Yazmin Morales reservó entrenamiento fuerza para el 2026-07-01 a las 7:40 PM.	new_booking	f	2026-07-01 23:43:18.166505+00
193	📅 Santiago Suarez Garcia reservó entrenamiento fuerza para el 2026-07-02 a las 6:30 AM.	new_booking	f	2026-07-02 00:32:23.782771+00
194	📅 Yazmin Morales reservó entrenamiento fuerza para el 2026-07-02 a las 6:30 AM.	new_booking	f	2026-07-02 03:21:24.171528+00
195	❌ Yazmin Morales ha CANCELADO su reserva de entrenamiento fuerza para el 2026-07-01 a las 7:40 PM.	cancel_booking	f	2026-07-02 03:22:57.390408+00
196	El usuario Santiago Suarez Garcia ha cancelado su reserva de entrenamiento fuerza para el 2026-07-02 a las 6:30 AM.	cancelation	f	2026-07-02 11:10:04.254348+00
197	📅 Santiago Suarez Garcia reservó entrenamiento fuerza para el 2026-07-02 a las 6:30 AM.	new_booking	f	2026-07-02 11:12:19.522307+00
198	📅 Melisa Martínez  reservó entrenamiento fuerza para el 2026-07-03 a las 8:30 AM.	new_booking	f	2026-07-02 16:05:01.645491+00
199	📅 Reserva manual (Admin) para Sindy Duque de fuerza para el 2026-07-03 a las 8:30 AM.	new_booking	f	2026-07-02 20:51:12.247931+00
200	📅 Reserva manual (Admin) para Guadulupe  de fuerza para el 2026-07-03 a las 8:30 AM.	new_booking	f	2026-07-02 20:51:12.647118+00
201	📅 Reserva manual (Admin) para Administrador de fuerza para el 2026-07-03 a las 8:30 AM.	new_booking	f	2026-07-02 20:51:20.230598+00
202	📅 Camila zuluaga reservó entrenamiento fuerza para el 2026-07-03 a las 6:30 AM.	new_booking	f	2026-07-02 21:19:24.674687+00
203	El usuario Camila zuluaga ha cancelado su reserva de entrenamiento fuerza para el 2026-07-01 a las 7:40 PM.	cancelation	f	2026-07-02 21:19:43.877717+00
204	📅 Santiago Suarez Garcia reservó entrenamiento fuerza para el 2026-07-03 a las 6:30 AM.	new_booking	f	2026-07-02 21:44:31.525121+00
205	📅 Duverley Marin Gonzalez reservó entrenamiento fuerza para el 2026-07-03 a las 6:30 AM.	new_booking	f	2026-07-02 22:16:28.589874+00
206	📅 Yazmin Morales reservó entrenamiento fuerza para el 2026-07-03 a las 6:30 AM.	new_booking	f	2026-07-03 02:27:09.1255+00
207	El usuario Santiago Suarez Garcia ha cancelado su reserva de entrenamiento fuerza para el 2026-07-03 a las 6:30 AM.	cancelation	f	2026-07-03 04:27:33.973133+00
208	📅 Miguel Arcila reservó entrenamiento fuerza para el 2026-07-03 a las 6:30 AM.	new_booking	f	2026-07-03 15:44:59.140142+00
209	❌ Miguel Arcila ha CANCELADO su reserva de entrenamiento fuerza para el 2026-07-03 a las 6:30 AM.	cancel_booking	f	2026-07-03 15:45:21.305089+00
\.


--
-- Data for Name: plans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.plans (id, name, default_classes, price, is_active, created_at, description, classes_per_week, sessions_per_month, modality_type) FROM stdin;
21	Entrenamiento Funcional - Plan Básico	12	170000.00	t	2026-06-13 19:46:01.807542+00	Entrenamiento semipersonalizado con máximo 5 personas.	3	12	funcional
22	Entrenamiento Funcional - Plan Avanzado	20	230000.00	t	2026-06-13 19:46:01.810151+00	Entrenamiento semipersonalizado con máximo 5 personas.	5	20	funcional
23	Plan Élite Básico (Deportistas)	4	160000.00	t	2026-06-13 19:46:01.812589+00	Entrenamiento 100% personalizado, enfocado a la necesidad específica de cada deportista.	1	4	personalizado
24	Plan Élite Avanzado	8	280000.00	t	2026-06-13 19:46:01.814809+00	Entrenamiento 100% personalizado, enfocado a la necesidad específica del deportista.	2	8	personalizado
31	Clase individual (fuerza-funcional)	1	20000.00	t	2026-06-13 19:53:31.544197+00	\N	0	0	funcional
\.


--
-- Data for Name: slots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.slots (id, modality, date, start_time, end_time, capacity, is_blocked, created_at) FROM stdin;
161	personalizado	2026-06-25	09:00:00	10:00:00	2	f	2026-06-25 01:46:14.977166+00
162	personalizado	2026-06-25	10:00:00	11:00:00	2	f	2026-06-25 01:46:14.981842+00
163	fuerza	2026-06-25	19:50:00	20:50:00	5	f	2026-06-25 18:47:57.467732+00
5	fuerza	2026-06-05	08:30:00	09:30:00	5	f	2026-06-05 06:06:30.476661+00
6	personalizado	2026-06-05	08:30:00	09:30:00	2	f	2026-06-05 06:06:30.480301+00
7	fuerza	2026-06-06	08:15:00	09:00:00	5	f	2026-06-05 19:01:57.257398+00
8	personalizado	2026-06-06	08:15:00	09:00:00	2	f	2026-06-05 19:01:57.261254+00
9	fuerza	2026-06-07	08:00:00	09:25:00	5	f	2026-06-07 17:06:37.918687+00
10	personalizado	2026-06-07	08:00:00	09:25:00	2	f	2026-06-07 17:06:38.01529+00
11	fuerza	2026-06-10	08:00:00	09:00:00	5	f	2026-06-10 23:01:16.02806+00
12	personalizado	2026-06-10	08:00:00	09:00:00	2	f	2026-06-10 23:01:16.034887+00
13	fuerza	2026-06-11	06:30:00	07:30:00	5	f	2026-06-11 13:05:27.585774+00
14	fuerza	2026-06-11	08:40:00	09:40:00	5	f	2026-06-11 13:06:09.291688+00
15	fuerza	2026-06-12	08:00:00	09:00:00	5	f	2026-06-13 00:40:34.060895+00
16	personalizado	2026-06-12	08:00:00	09:00:00	2	f	2026-06-13 00:40:34.065243+00
17	fuerza	2026-06-12	10:00:00	12:00:00	5	f	2026-06-13 00:41:35.801978+00
18	personalizado	2026-06-12	10:00:00	12:00:00	2	f	2026-06-13 00:41:35.806754+00
165	fuerza	2026-06-25	07:30:00	08:30:00	5	f	2026-06-25 23:22:57.467529+00
166	personalizado	2026-06-25	07:30:00	08:30:00	2	f	2026-06-25 23:22:57.472239+00
167	fuerza	2026-06-26	07:30:00	08:30:00	5	f	2026-06-25 23:26:25.273941+00
169	personalizado	2026-06-26	17:30:00	18:30:00	2	f	2026-06-26 19:50:43.760265+00
170	fuerza	2026-06-26	19:30:00	20:30:00	5	f	2026-06-26 19:50:43.763836+00
171	personalizado	2026-06-26	19:30:00	20:30:00	2	f	2026-06-26 19:50:43.767395+00
172	fuerza	2026-06-30	06:30:00	07:30:00	5	f	2026-06-29 20:06:10.7784+00
27	fuerza	2026-06-16	06:30:00	07:30:00	5	f	2026-06-13 17:26:55.829822+00
28	fuerza	2026-06-16	07:40:00	08:40:00	5	f	2026-06-13 17:26:55.834398+00
29	fuerza	2026-06-16	08:50:00	09:50:00	5	f	2026-06-13 17:26:55.838045+00
30	fuerza	2026-06-17	06:30:00	07:30:00	5	f	2026-06-13 17:26:55.841606+00
31	fuerza	2026-06-17	07:40:00	08:40:00	5	f	2026-06-13 17:26:55.846159+00
32	fuerza	2026-06-17	08:50:00	09:50:00	5	f	2026-06-13 17:26:55.851198+00
33	fuerza	2026-06-18	06:30:00	07:30:00	5	f	2026-06-13 17:26:55.856056+00
35	fuerza	2026-06-18	08:50:00	09:50:00	5	f	2026-06-13 17:26:55.921439+00
174	fuerza	2026-06-30	08:30:00	09:30:00	5	f	2026-06-29 20:06:10.788938+00
39	fuerza	2026-06-16	15:00:00	16:00:00	5	f	2026-06-13 17:35:26.60084+00
40	fuerza	2026-06-16	16:10:00	17:10:00	5	f	2026-06-13 17:35:26.604528+00
41	fuerza	2026-06-16	18:30:00	19:30:00	5	f	2026-06-13 17:35:26.607937+00
42	fuerza	2026-06-16	20:00:00	21:00:00	5	f	2026-06-13 17:35:26.611429+00
43	fuerza	2026-06-17	15:00:00	16:00:00	5	f	2026-06-13 17:35:26.614762+00
44	fuerza	2026-06-17	16:10:00	17:10:00	5	f	2026-06-13 17:35:26.618156+00
45	fuerza	2026-06-17	18:30:00	19:30:00	5	f	2026-06-13 17:35:26.622066+00
178	fuerza	2026-06-30	16:00:00	17:00:00	5	f	2026-06-29 20:06:10.817067+00
179	personalizado	2026-06-30	16:00:00	17:00:00	2	f	2026-06-29 20:06:10.823066+00
49	fuerza	2026-06-18	18:30:00	19:30:00	5	f	2026-06-13 17:35:26.6354+00
50	fuerza	2026-06-18	20:00:00	21:00:00	5	f	2026-06-13 17:35:26.638889+00
52	fuerza	2026-06-19	16:10:00	17:10:00	5	f	2026-06-13 17:35:26.646167+00
53	fuerza	2026-06-19	18:30:00	19:30:00	5	f	2026-06-13 17:35:26.649445+00
55	personalizado	2026-06-16	15:00:00	16:00:00	2	f	2026-06-13 17:50:30.122671+00
56	personalizado	2026-06-16	16:10:00	17:10:00	2	f	2026-06-13 17:51:00.424969+00
58	personalizado	2026-06-16	20:00:00	21:00:00	2	f	2026-06-13 17:52:04.003759+00
59	fuerza	2026-06-13	08:00:00	09:00:00	5	f	2026-06-13 20:01:19.520222+00
60	personalizado	2026-06-13	08:00:00	09:00:00	2	f	2026-06-13 20:01:19.524441+00
62	fuerza	2026-06-16	09:30:00	10:30:00	5	f	2026-06-16 11:42:33.312706+00
57	personalizado	2026-06-16	18:30:00	19:30:00	2	t	2026-06-13 17:51:29.36739+00
69	personalizado	2026-06-17	19:30:00	20:30:00	2	f	2026-06-17 12:53:09.045403+00
70	fuerza	2026-06-17	19:30:00	20:30:00	5	f	2026-06-17 20:02:51.04683+00
71	fuerza	2026-06-19	06:30:00	07:30:00	5	f	2026-06-17 20:21:06.142257+00
72	fuerza	2026-06-17	09:00:00	10:00:00	5	f	2026-06-18 02:53:41.727967+00
73	personalizado	2026-06-17	09:00:00	10:00:00	2	f	2026-06-18 02:53:41.733064+00
75	fuerza	2026-06-20	07:00:00	08:00:00	5	f	2026-06-18 13:35:45.913132+00
77	fuerza	2026-06-20	08:20:00	09:20:00	5	f	2026-06-18 13:35:45.9228+00
79	fuerza	2026-06-20	09:40:00	10:40:00	5	f	2026-06-18 13:35:45.931565+00
80	personalizado	2026-06-20	09:40:00	10:40:00	2	f	2026-06-18 13:35:45.935766+00
81	fuerza	2026-06-18	17:30:00	18:30:00	5	f	2026-06-18 13:39:16.146189+00
84	fuerza	2026-06-19	19:30:00	20:30:00	5	f	2026-06-19 02:16:47.537664+00
85	personalizado	2026-06-19	19:30:00	20:30:00	2	f	2026-06-19 02:16:47.542264+00
86	fuerza	2026-06-19	08:30:00	09:30:00	5	f	2026-06-21 23:49:31.094292+00
87	fuerza	2026-06-22	06:30:00	07:30:00	5	f	2026-06-21 23:49:31.100053+00
89	fuerza	2026-06-23	06:30:00	07:30:00	5	f	2026-06-21 23:49:31.108581+00
91	fuerza	2026-06-24	06:30:00	07:30:00	5	f	2026-06-21 23:49:31.119322+00
93	fuerza	2026-06-25	06:30:00	07:30:00	5	f	2026-06-21 23:49:31.128578+00
95	fuerza	2026-06-19	07:40:00	08:40:00	5	f	2026-06-22 00:27:58.153138+00
96	fuerza	2026-06-19	08:50:00	09:50:00	5	f	2026-06-22 00:27:58.156808+00
99	fuerza	2026-06-22	16:10:00	17:10:00	5	f	2026-06-22 00:27:58.169673+00
100	fuerza	2026-06-22	18:30:00	19:30:00	5	f	2026-06-22 00:27:58.172984+00
103	fuerza	2026-06-23	16:10:00	17:10:00	5	f	2026-06-22 00:27:58.184085+00
104	fuerza	2026-06-23	18:30:00	19:30:00	5	f	2026-06-22 00:27:58.187336+00
107	fuerza	2026-06-24	16:10:00	17:10:00	5	f	2026-06-22 00:27:58.198437+00
108	fuerza	2026-06-24	18:30:00	19:30:00	5	f	2026-06-22 00:27:58.201684+00
113	fuerza	2026-06-19	20:00:00	21:00:00	5	f	2026-06-22 00:29:38.611453+00
119	fuerza	2026-06-23	08:30:00	09:30:00	5	f	2026-06-22 00:30:22.337135+00
120	fuerza	2026-06-24	08:30:00	09:30:00	5	f	2026-06-22 00:30:22.347987+00
122	fuerza	2026-06-26	06:30:00	07:30:00	5	f	2026-06-22 00:33:03.714868+00
125	fuerza	2026-06-26	18:30:00	19:30:00	5	f	2026-06-22 00:33:03.725413+00
127	fuerza	2026-06-22	19:30:00	20:30:00	5	f	2026-06-22 00:35:39.291474+00
132	personalizado	2026-06-23	10:00:00	11:00:00	2	f	2026-06-22 00:38:22.372708+00
137	fuerza	2026-06-24	19:30:00	20:30:00	5	f	2026-06-22 00:40:14.257292+00
140	personalizado	2026-06-24	10:00:00	11:00:00	2	f	2026-06-22 00:40:32.703365+00
141	personalizado	2026-06-26	10:00:00	11:00:00	2	f	2026-06-22 00:40:45.553063+00
143	personalizado	2026-06-24	19:30:00	20:30:00	2	f	2026-06-22 00:41:38.650447+00
150	fuerza	2026-06-25	18:50:00	19:50:00	5	f	2026-06-22 00:48:05.85822+00
154	personalizado	2026-06-25	11:00:00	12:00:00	2	f	2026-06-22 00:51:54.462994+00
155	personalizado	2026-06-25	17:40:00	18:40:00	2	f	2026-06-22 00:52:38.323488+00
156	personalizado	2026-06-22	08:30:00	09:30:00	2	f	2026-06-22 13:36:29.115669+00
133	fuerza	2026-06-23	10:00:00	11:00:00	5	t	2026-06-22 00:39:15.209522+00
157	fuerza	2026-06-26	15:00:00	16:00:00	5	f	2026-06-23 14:57:32.782019+00
160	personalizado	2026-06-23	17:30:00	18:30:00	2	f	2026-06-23 22:39:36.89908+00
180	fuerza	2026-06-30	17:00:00	18:00:00	5	f	2026-06-29 20:06:10.828553+00
181	personalizado	2026-06-30	17:00:00	18:00:00	2	f	2026-06-29 20:06:10.834298+00
190	fuerza	2026-06-30	18:00:00	19:00:00	5	f	2026-06-29 20:34:51.651223+00
191	personalizado	2026-06-30	18:00:00	19:00:00	2	f	2026-06-29 20:34:51.654953+00
188	personalizado	2026-06-30	06:30:00	07:30:00	2	t	2026-06-29 20:34:51.636264+00
189	personalizado	2026-06-30	08:30:00	09:30:00	2	t	2026-06-29 20:34:51.64133+00
194	fuerza	2026-07-01	06:30:00	07:30:00	5	f	2026-06-30 17:39:28.165583+00
195	personalizado	2026-07-01	06:30:00	07:30:00	2	f	2026-06-30 17:39:28.169703+00
199	personalizado	2026-07-01	09:40:00	10:40:00	2	f	2026-06-30 17:39:28.184183+00
200	fuerza	2026-07-01	15:00:00	16:00:00	5	f	2026-06-30 17:39:28.187765+00
201	personalizado	2026-07-01	15:00:00	16:00:00	2	f	2026-06-30 17:39:28.191886+00
202	fuerza	2026-07-01	16:10:00	17:10:00	5	f	2026-06-30 17:39:28.196275+00
203	personalizado	2026-07-01	16:10:00	17:10:00	2	f	2026-06-30 17:39:28.199657+00
204	fuerza	2026-07-01	18:30:00	19:30:00	5	f	2026-06-30 17:39:28.202914+00
205	personalizado	2026-07-01	18:30:00	19:30:00	2	f	2026-06-30 17:39:28.2064+00
206	fuerza	2026-07-02	06:30:00	07:30:00	5	f	2026-06-30 17:39:28.210265+00
207	personalizado	2026-07-02	06:30:00	07:30:00	2	f	2026-06-30 17:39:28.213582+00
210	fuerza	2026-07-02	09:40:00	10:40:00	5	f	2026-06-30 17:39:28.224163+00
211	personalizado	2026-07-02	09:40:00	10:40:00	2	f	2026-06-30 17:39:28.227581+00
212	fuerza	2026-07-02	15:00:00	16:00:00	5	f	2026-06-30 17:39:28.23097+00
213	personalizado	2026-07-02	15:00:00	16:00:00	2	f	2026-06-30 17:39:28.264292+00
214	fuerza	2026-07-02	16:10:00	17:10:00	5	f	2026-06-30 17:39:28.267883+00
215	personalizado	2026-07-02	16:10:00	17:10:00	2	f	2026-06-30 17:39:28.271409+00
218	fuerza	2026-07-03	06:30:00	07:30:00	5	f	2026-06-30 17:39:28.282515+00
219	personalizado	2026-07-03	06:30:00	07:30:00	2	f	2026-06-30 17:39:28.287635+00
226	fuerza	2026-07-03	16:10:00	17:10:00	5	f	2026-06-30 17:39:28.324058+00
227	personalizado	2026-07-03	16:10:00	17:10:00	2	f	2026-06-30 17:39:28.329195+00
198	fuerza	2026-07-01	09:40:00	10:40:00	5	t	2026-06-30 17:39:28.180327+00
230	fuerza	2026-07-01	19:40:00	20:40:00	5	f	2026-06-30 17:47:50.754712+00
231	personalizado	2026-07-01	19:40:00	20:40:00	2	f	2026-06-30 17:47:50.758691+00
236	fuerza	2026-07-01	08:30:00	09:30:00	5	f	2026-06-30 17:49:19.770057+00
237	personalizado	2026-07-01	08:30:00	09:30:00	2	f	2026-06-30 17:49:19.78241+00
238	fuerza	2026-07-02	08:30:00	09:30:00	5	f	2026-06-30 17:49:19.80605+00
239	personalizado	2026-07-02	08:30:00	09:30:00	2	f	2026-06-30 17:49:19.81027+00
240	fuerza	2026-07-03	08:30:00	09:30:00	5	f	2026-06-30 17:49:19.837859+00
241	personalizado	2026-07-03	08:30:00	09:30:00	2	f	2026-06-30 17:49:19.846235+00
244	fuerza	2026-07-02	17:00:00	18:00:00	5	f	2026-07-01 12:22:00.661303+00
245	personalizado	2026-07-02	17:00:00	18:00:00	2	f	2026-07-01 12:22:00.66523+00
246	fuerza	2026-07-02	18:00:00	19:00:00	5	f	2026-07-01 12:22:21.402704+00
247	personalizado	2026-07-02	18:00:00	19:00:00	2	f	2026-07-01 12:22:21.407947+00
248	fuerza	2026-07-03	17:00:00	18:00:00	5	f	2026-07-01 12:23:25.075068+00
249	personalizado	2026-07-03	17:00:00	18:00:00	2	f	2026-07-01 12:23:25.078951+00
250	fuerza	2026-07-03	18:00:00	19:00:00	5	f	2026-07-01 12:23:25.083609+00
251	personalizado	2026-07-03	18:00:00	19:00:00	2	f	2026-07-01 12:23:25.087012+00
252	fuerza	2026-07-03	18:30:00	19:30:00	5	f	2026-07-01 12:29:40.482802+00
253	personalizado	2026-07-03	18:30:00	19:30:00	2	f	2026-07-01 12:29:40.487064+00
254	fuerza	2026-07-03	07:40:00	08:40:00	5	f	2026-07-02 23:32:14.28218+00
255	personalizado	2026-07-03	07:40:00	08:40:00	2	f	2026-07-02 23:32:14.286042+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password_hash, google_id, phone, cedula, role, available_classes, plan_type, created_at, is_verified, verify_token, payment_method, payment_amount, payment_date, expiration_date, payment_status, reset_token, reset_token_expires) FROM stdin;
397fd98f-5ade-4e16-985e-2b5a100a9e0a	Mariana  Serna 	cliente_1781376836368@zonaelite.local	\N	\N	3104069286		client	0	Entrenamiento Funcional - Plan Básico	2026-06-13 18:53:56.359434+00	t	\N	qr	0.00	\N	\N	pendiente	\N	\N
065839a0-aa75-48e4-848e-44932e3a719b	Camila Zuluaga 	cliente_1781376912277@zonaelite.local	\N	\N	3106827883		client	0	Entrenamiento de fuerza PLAN AVANZADO	2026-06-13 18:55:12.268791+00	t	\N	qr	0.00	\N	\N	pendiente	\N	\N
0305b175-e348-4c2a-8f75-0b78e7cba54f	Juan Sierra 	cliente_1781377628221@zonaelite.local	\N	\N	3112770221		client	0	Entrenamiento elite 	2026-06-13 19:07:08.235039+00	t	\N	qr	0.00	\N	\N	pendiente	\N	\N
313aa7c4-9e4e-4688-ad46-03632eb7a1b7	Erika Quintero	quinteroerika67@gmail.com	$2a$10$1g3noDbXcoV3H4l5W0x7n.KEcCgqjfRbd49m79f44QLi4SCIsudgO	\N	3162598285	1007437701	client	0	Entrenamiento Funcional - Plan Básico	2026-06-16 12:40:10.722778+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
eb4bb9df-45b1-40f5-bd05-1fa96f3eb34e	Santiago Suarez Garcia	santi98031554802@gmail.com	$2a$10$JD0ERqvcXTnoZgF83UPHhOMp7zhMrCyrdjW1mm3d7sphv31s5bnxy	\N	3115896420	1038417397	client	0	Entrenamiento Funcional - Plan Básico	2026-06-16 22:00:01.14935+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
f057d055-8128-4f4e-911b-f9246063836a	Santi Sierra 	cliente_1781377722537@zonaelite.local	\N	\N	3012757311		client	0	Entrenamiento Funcional - Plan Básico	2026-06-13 19:08:42.552176+00	t	\N	qr	0.00	\N	\N	pendiente	\N	\N
0a45d5d5-235c-494b-a99e-374a3814195f	Daniel Rincon 	cliente_1781377871921@zonaelite.local	\N	\N	3209751560		client	0	Entrenamiento Funcional - Plan Básico	2026-06-13 19:11:11.9338+00	t	\N	qr	0.00	\N	\N	pendiente	\N	\N
de5df234-9911-477a-850c-1535f8c83ba7	Sebastián sajas	cliente_1781377896186@zonaelite.local	\N	\N	3243169564		client	0	Entrenamiento Funcional - Plan Básico	2026-06-13 19:11:36.198875+00	t	\N	qr	0.00	\N	\N	pendiente	\N	\N
62c055cb-7c14-4a25-a516-82e706af495e	Lucho Carvajal 	cliente_1781377928215@zonaelite.local	\N	\N	3245409730		client	0	Entrenamiento elite 	2026-06-13 19:12:08.228061+00	t	\N	qr	0.00	\N	\N	pendiente	\N	\N
e868096e-a913-44b1-b032-2a0e5c2e2c79	Viviana Botero	cliente_1781377955823@zonaelite.local	\N	\N	3195470451		client	0	Entrenamiento Funcional - Plan Básico	2026-06-13 19:12:35.834703+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
a66df10c-e67c-4e6f-a94f-7b60c51e185d	Yazmín morales 	cliente_1781377984873@zonaelite.local	\N	\N	3153136555		client	0	Entrenamiento Funcional - Plan Básico	2026-06-13 19:13:04.885608+00	t	\N	qr	0.00	\N	\N	pendiente	\N	\N
af7e0be5-0afc-42c2-ba9a-222fdc32a9dc	Erika Quintero	cliente_1781378020250@zonaelite.local	\N	\N	3162598285		client	0	Entrenamiento Funcional - Plan Básico	2026-06-13 19:13:40.262442+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
cde2ce39-789a-466f-bbc8-67b66df323dd	celmira Serna	cliente_1781378081634@zonaelite.local	\N	\N			client	0	Entrenamiento Funcional - Plan Básico	2026-06-13 19:14:41.645937+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
3aabd89c-4942-4ec4-a90d-482970521a5c	Heidy suarez	cliente_1781378107510@zonaelite.local	\N	\N	3136385254		client	0	Entrenamiento Funcional - Plan Básico	2026-06-13 19:15:07.522516+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
f8543a9d-5848-454c-8513-ac2f26997ab6	Isabela Pareja	cliente_1781378123976@zonaelite.local	\N	\N	3113611001		client	0	Entrenamiento Funcional - Plan Básico	2026-06-13 19:15:23.987642+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
5765cbc3-4e60-4c6e-a67a-7434a2eceaa2	Sindy Duque	cliente_1781378141206@zonaelite.local	\N	\N			client	0	Entrenamiento Funcional - Plan Básico	2026-06-13 19:15:41.217613+00	t	\N	qr	0.00	\N	\N	pendiente	\N	\N
c87ef73c-3f1f-4a00-a4a7-1ef6fd41d75d	ismael  ramirez 	cliente_1781378172350@zonaelite.local	\N	\N			client	0	Entrenamiento elite 	2026-06-13 19:16:12.363072+00	t	\N	qr	0.00	\N	\N	pendiente	\N	\N
ab2a75bc-00e4-454d-b9b1-d36eb77810d4	Tomas Morales 	cliente_1781378251090@zonaelite.local	\N	\N			client	0	Entrenamiento elite 	2026-06-13 19:17:31.102597+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
b74fd356-535b-4186-8e1e-a9c1b5b89205	Juanes Suarez 	cliente_1781378272348@zonaelite.local	\N	\N	3195379438		client	0	Entrenamiento de fuerza PLAN AVANZADO	2026-06-13 19:17:52.621493+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
6310a38d-2ca0-443c-b5a5-4ff90398d13a	Jeronimo Salzar 	cliente_1781378305319@zonaelite.local	\N	\N	3137312391		client	0	Entrenamiento Funcional - Plan Básico	2026-06-13 19:18:25.331057+00	t	\N	efectivo	0.00	\N	\N	al_dia	\N	\N
e65fc0ec-54bd-4da6-a07f-ed2b74acd358	luisa ocampo 	cliente_1781376702054@zonaelite.local	\N	\N	3148239079		client	0	Entrenamiento Funcional - Plan Básico	2026-06-13 18:51:42.046108+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
8c432067-65ea-444e-8748-7395b64e189f	 Diana Gómez 	cliente_1781376726609@zonaelite.local	\N	\N	3107447808		client	0	Entrenamiento Funcional - Plan Básico	2026-06-13 18:52:06.601295+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
0eba8b96-7ef9-4670-b5b7-e712fbba198e	Santi Gómez 	cliente_1781376756661@zonaelite.local	\N	\N	3114332663		client	0	Entrenamiento Funcional - Plan Básico	2026-06-13 18:52:36.65327+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
2e9c070e-ca7e-46c6-8560-d1fff57f92b3	Isabela Pareja	isa.parejag18@gmail.com	$2a$10$rQ56KPplPd7NNpTNLEedeeVPHKGPz3Q941MK1pBDOIRktVtnwtLjG	\N	3113611001	1000207825	client	0	Entrenamiento Funcional - Plan Básico	2026-06-16 12:42:40.82109+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
f8615d54-0169-477c-bfe3-a3b73ff5d0c9	Yazmin Morales	yazmin0425@hotmail.com	$2a$10$gt78x.2njUz7Bg3gthkzm.M0kSq.WYacLX3o4D9dZXSz4X2NsW9d2	\N	3153136555	1038417449	client	0	Entrenamiento Funcional - Plan Básico	2026-06-16 18:34:45.081493+00	t	\N	efectivo	0.00	\N	\N	al_dia	\N	\N
88175ee9-1acd-4cd0-af90-552a90651e75	Emiliano Castañeda 	cliente_1781378204419@zonaelite.local	\N	\N	3127571724		client	0	Entrenamiento elite 	2026-06-13 19:16:44.43095+00	t	\N	efectivo	0.00	\N	\N	vencido	\N	\N
48855b53-fa1a-4189-a559-1a95a30d5cea	Juan Sebastián Marín Giraldo 	juansebastianmg40@gmail.com	$2a$10$IcaiMEnm6YAbpXcGEL8.8uGIb71rTf3lCybJwXdAvdo93Xz4fNXui	\N	3243169564	1038418425	client	0	Entrenamiento Funcional - Plan Básico	2026-06-17 00:48:17.790137+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
d435977f-d383-4a62-befd-5bc7586af816	Santi Suarez 	cliente_1781376873156@zonaelite.local	\N	\N	3115896420		client	0	Entrenamiento Funcional - Plan Básico	2026-06-13 18:54:33.147058+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
7641a26e-39d0-402f-9285-55740a170fb8	Duverley Marin Gonzalez	duverleymago@hotmail.com	$2a$10$ebLBkn5l3YeNaYVPD8hfF.sIpDhSkjR4w5q3ZSUi9Ac6DYlIPVRZO	\N	3127582898	70907679	client	0	Entrenamiento Funcional - Plan Básico	2026-06-16 22:52:00.511204+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
c4f8ad0c-62e8-4091-b409-fb9f18b9e401	Juan Esteban Suarez Quintero	estebannal9@gmail.com	$2a$10$q1m8mXCogtlOGc1anQ7K8OKYLW/eLx.voXwwgkbIpYJBvUHRUvFC2	\N	3195379438	1036967148	client	0	Entrenamiento Funcional - Plan Avanzado	2026-06-17 00:48:08.688096+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
9b88cb7c-71ca-48ec-991f-5953c7dcecfe	Administrador	zonaelite8@gmail.com	$2a$10$o5NeIfCLtVs9Y1HD.FhvduYyL2vrAQNfcQUHJ06lvp.HalhtPFjay	109163219038518181604	\N	\N	admin	0	Sin Plan	2026-06-05 04:16:40.796342+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
f51facd1-c0d2-44f6-a621-4659d556e9af	Camila zuluaga	camila99zuluaga@gmail.com	$2a$10$wY0Xvwa7BPgBXlds5UHP9OdzjusE/00B3ySm7Aph8ff.RktOnyxzS	\N	3106827883	1038418916	client	0	Entrenamiento Funcional - Plan Básico	2026-06-17 00:58:54.773735+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
2eb56ae2-857d-4e79-90be-a4707d1f5d02	Miguel Arcila	cliente_1781378234539@zonaelite.local	\N	\N	3147822970		client	0	Plan Élite Avanzado	2026-06-13 19:17:14.550583+00	t	\N	qr	0.00	\N	\N	al_dia	\N	\N
42bc4308-d0cd-49ec-a089-6a4e4d8c83f3	Viviana botero zuluaga	vivianabote17@gmail.com	$2a$10$IajArGiAhIXlKAZLdN5AVO4X7CE8hz.7TyWrdCULpsef9KI6ttvvq	\N	3195470451	1036402227	client	0	Entrenamiento Funcional - Plan Básico	2026-06-17 21:17:16.101135+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
ba77969c-0f4b-4ec0-b955-32f8371fe1e9	Guadulupe 	cliente_1782181109561@zonaelite.local	\N	\N			client	0	Entrenamiento Funcional - Plan Básico	2026-06-23 02:18:29.566543+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
93fe1d9e-43b7-45d7-a8c3-90e1b8534d3b	Daniel Rincon	danielrincon.0910@gmail.com	$2a$10$13Wqm02iqVyUO/n5L/RuQOT4KKwWnPlWg3orq4tBty0yYdjml1uqW	\N	3209751560	1038416937	client	0	Entrenamiento Funcional - Plan Básico	2026-06-17 23:03:04.519205+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
bbfc9463-f141-4d5a-b798-9ee998518241	Miguel Arcila	miguelarcila008@gmail.com	$2a$10$.0P2U0M6I5crMpkwQOqhae/MaiM46V4gqttMIxNdrZXxvisBliHDi	\N	3147822970	1034990060	client	0	Plan Élite Básico (Deportistas)	2026-06-22 15:26:46.495987+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
102d75b5-621c-4374-8cb2-96815092211b	Mariana Serna A	sernaatehortuamariana@gmail.com	$2a$10$s3J7cNkhGaQ2jxYkIPtg5eM5.aIU1kRsuSxzPT4UGYe4ytuOqRWR6	\N	3104069286	1001478075	client	0	Entrenamiento Funcional - Plan Básico	2026-06-23 02:37:00.811773+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
52e12368-a73f-4a64-824c-c47972832fcf	jeronimo 	cliente_1782226041570@zonaelite.local	\N	\N			client	0	Entrenamiento Funcional - Plan Básico	2026-06-23 14:47:21.573413+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
ac1767d9-3628-46b5-b206-b9b2379cdca1	Mam	cliente_1782325582012@zonaelite.local	\N	\N			client	0	Entrenamiento Funcional - Plan Básico	2026-06-24 18:26:22.014916+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
6674e02a-8f36-4f34-9fca-8f6ea2078391	Sindy 	henaolupe32@gmail.com	$2a$10$jQYOC61aL.Vqd0xDYaIRYe6jFZN660tUZEP5TSVIj.bRd85f18Xmi	\N	3207521645	1038385004	client	0	Entrenamiento Funcional - Plan Básico	2026-06-18 15:52:56.097016+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
6a8bc3fb-629f-4865-b5b4-776eafc74538	Yesica Milena Giraldo Gómez 	yekagiraldo-_@hotmail.com	$2a$10$XcCR3hAA3WHWSOmMzY4DcuymIh5HmbB1S0Mz4UCG51xqUXgHZMxPC	\N	3007908965	1038410147	client	0	Entrenamiento Funcional - Plan Básico	2026-06-20 01:55:52.136461+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
9ef54324-8b9b-49bd-94df-d244a75de2e9	Santiago	santigogomez194@gmail.com	$2a$10$vGjJA1HrKNaLlIBbm2PVA.vZMshP90/yn63WgNs.7fKWQEGTBR0yi	\N	\N	\N	client	0	Entrenamiento Funcional - Plan Básico	2026-06-22 13:04:40.232394+00	f	211117	efectivo	0.00	\N	\N	pendiente	\N	\N
6f56d3eb-d9a7-4dc6-b21b-9e2d782f6279	Steicy 	cliente_1782135435852@zonaelite.local	\N	\N			client	0	Plan Élite Básico (Deportistas)	2026-06-22 13:37:15.855015+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
272b28c4-4fc4-40e6-a68c-36c9ea63a410	Thomas 	cliente_1782254410864@zonaelite.local	\N	\N			client	4	Entrenamiento Funcional - Plan Avanzado	2026-06-23 22:40:10.867874+00	t	\N	efectivo	280.00	\N	\N	pendiente	\N	\N
a059cb8d-6ffd-472a-ac06-698937d3ce79	Andrea Buitrago CastaÃ±o	dabc13@hotmail.com	$2a$10$5xD2P0GUbsHyLGdbhqiFkuqxq.V.jKu6r3x6rak/bDY0YrbMohK4m	\N	3187253334	21492485	client	0	Entrenamiento Funcional - Plan Básico	2026-06-30 02:19:55.456367+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
868cfb27-8906-43e9-a0eb-ca379d0eda5c	MARTIN 	cliente_1782180937058@zonaelite.local	\N	\N			client	0	Entrenamiento Funcional - Plan Básico	2026-06-23 02:15:37.064084+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
59f44a8c-27b4-401c-9446-60589768e3f7	MATIAS DUQUE 	cliente_1782180949317@zonaelite.local	\N	\N			client	0	Entrenamiento Funcional - Plan Básico	2026-06-23 02:15:49.322889+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
f0b3bb7f-95ee-41c4-ae91-193e4a91dab4	Melisa Martínez 	melivale202223@gmail.com	$2a$10$mz0MkoG5Ubr3X5GHwWcUZuQOgE/ZT8vVoSxS3c2YBsE/S65t3sex6	\N	3197533609	1038413081	client	0	Entrenamiento Funcional - Plan Básico	2026-07-02 16:03:25.900275+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
fb63ac65-ccc8-423b-b2ef-3564ff9943fc	Miguel	miguel.angel.arcila07@gmail.com	$2a$10$ODaCvvqvG9Zpe9hADSKxYu7pgK5GatuBl6XVCk4oFlJWQAGdMty0i	\N	\N	\N	client	0	Plan Élite Avanzado	2026-06-29 03:44:29.923649+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
99b2d264-2c48-495c-897e-545677ffb1a1	Sofia Carmona Giraldo	sofiacarmonagiraldo9@gmail.com	$2a$10$I7rliovWtITlNCO.BhsBdO7jAgHiGSz7MjWZmiuF7RsGiOQIwNlDy	\N	\N	\N	client	0	Entrenamiento Funcional - Plan Básico	2026-07-04 16:06:55.55119+00	t	\N	efectivo	0.00	\N	\N	pendiente	\N	\N
d3d4d0e6-00ad-4034-aa71-630d16f974db	Diana Gómez 	dg758470@gmail.com	$2a$10$zWX/Fp0JHE2zQUoj44e86u6ajQ5M4TPFohyKBB3k.1XZlR7DU4kMy	\N	\N	\N	client	10	Entrenamiento Funcional - Plan Básico	2026-06-23 20:46:08.550785+00	f	656986	efectivo	0.00	2026-06-25	2026-06-24	pendiente	00fdb91cd386608794b62d46b0b69703	2026-06-29 23:14:05.759+00
\.


--
-- Name: bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.bookings_id_seq', 180, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 209, true);


--
-- Name: plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.plans_id_seq', 699, true);


--
-- Name: slots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.slots_id_seq', 255, true);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: plans plans_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_name_key UNIQUE (name);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: slots slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.slots
    ADD CONSTRAINT slots_pkey PRIMARY KEY (id);


--
-- Name: slots unique_slot_time; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.slots
    ADD CONSTRAINT unique_slot_time UNIQUE (modality, date, start_time);


--
-- Name: bookings unique_user_booking; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT unique_user_booking UNIQUE (user_id, slot_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_google_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_key UNIQUE (google_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_bookings_slot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_slot ON public.bookings USING btree (slot_id);


--
-- Name: idx_bookings_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_user ON public.bookings USING btree (user_id);


--
-- Name: idx_slots_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_slots_date ON public.slots USING btree (date);


--
-- Name: bookings bookings_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_slot_id_fkey FOREIGN KEY (slot_id) REFERENCES public.slots(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict CF4KJdc1WEPsXH0V7oUvAlX4I1Wb0kF0asQVGSEj9k1VISxM4Bj3Y9YS0tD7Hbe


