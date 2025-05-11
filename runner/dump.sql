--
-- PostgreSQL database dump
--

-- Dumped from database version 16.3 (Debian 16.3-1.pgdg120+1)
-- Dumped by pg_dump version 16.3 (Debian 16.3-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: equipment_groups_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.equipment_groups_type_enum AS ENUM (
    'free_weight',
    'machines',
    'cable_machines',
    'body_weight',
    'benches_and_racks'
);


--
-- Name: equipments_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.equipments_type_enum AS ENUM (
    'dumbbells',
    'barbell',
    'ez_bar',
    'v_bar',
    'trap_bar',
    'rope',
    'straight_bar',
    'cord_handles',
    'wide_grip_handle',
    'close_grip_handle',
    'ab_machines',
    'butterfly',
    'butterfly_reverse',
    'leg_extension_machines',
    'leg_curl_machines',
    'chest_press_machines',
    'biceps_machines',
    'smith_machines',
    'hack_squat_machines',
    'deadlift_machines',
    'shoulder_press_machines',
    'lateral_raise_machines',
    'triceps_machines',
    'calf_raise_machines',
    'glute_machines',
    'abductor_machine',
    'adductor_machine',
    'leg_press_machine',
    'lat_pulldown',
    'cable',
    'cable_crossover',
    'row_cable',
    'pull_up_bar',
    'dip_bars',
    'romain_chair',
    'glute_ham_raise_bench',
    'flat_bench',
    'adjustable_bench',
    'decline_bench',
    'flat_bench_with_rack',
    'incline_bench_with_rack',
    'decline_bench_with_rack',
    'squat_rack',
    'preacher_curl_bench',
    'row_bench'
);


--
-- Name: exercise_examples_category_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.exercise_examples_category_enum AS ENUM (
    'compound',
    'isolation'
);


--
-- Name: exercise_examples_experience_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.exercise_examples_experience_enum AS ENUM (
    'beginner',
    'intermediate',
    'advanced',
    'pro'
);


--
-- Name: exercise_examples_force_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.exercise_examples_force_type_enum AS ENUM (
    'push',
    'pull',
    'hinge'
);


--
-- Name: exercise_examples_tutorials_resource_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.exercise_examples_tutorials_resource_type_enum AS ENUM (
    'youtube_video',
    'video',
    'text'
);


--
-- Name: exercise_examples_weight_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.exercise_examples_weight_type_enum AS ENUM (
    'free',
    'fixed',
    'body_weight'
);


--
-- Name: muscle_groups_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.muscle_groups_type_enum AS ENUM (
    'chest_muscles',
    'back_muscles',
    'abdominal_muscles',
    'legs',
    'arms_and_forearms',
    'shoulder_muscles'
);


--
-- Name: muscles_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.muscles_type_enum AS ENUM (
    'pectoralis_major_clavicular',
    'pectoralis_major_sternocostal',
    'pectoralis_major_abdominal',
    'trapezius',
    'latissimus_dorsi',
    'rhomboids',
    'teres_major',
    'rectus_abdominis',
    'obliques',
    'calf',
    'gluteal',
    'hamstrings',
    'quadriceps',
    'adductors',
    'abductors',
    'anterior_deltoid',
    'lateral_deltoid',
    'posterior_deltoid',
    'biceps',
    'triceps',
    'forearm'
);


--
-- Name: users_experience_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.users_experience_enum AS ENUM (
    'beginner',
    'intermediate',
    'advanced',
    'pro'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: equipment_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipment_groups (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying,
    type public.equipment_groups_type_enum,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: equipments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying,
    equipment_group_id uuid,
    type public.equipments_type_enum,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: excluded_equipments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.excluded_equipments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    equipment_id uuid,
    user_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: excluded_muscles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.excluded_muscles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    muscle_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id uuid,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: exercise_example_bundles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exercise_example_bundles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    percentage integer,
    exercise_example_id uuid,
    muscle_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: exercise_examples; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exercise_examples (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    image_url character varying,
    description character varying,
    category public.exercise_examples_category_enum,
    weight_type public.exercise_examples_weight_type_enum,
    force_type public.exercise_examples_force_type_enum,
    experience public.exercise_examples_experience_enum
);


--
-- Name: exercise_examples_equipments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exercise_examples_equipments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    equipment_id uuid,
    exercise_example_id uuid
);


--
-- Name: exercise_examples_tutorials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exercise_examples_tutorials (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    exercise_example_id uuid,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    title character varying,
    value character varying,
    language character varying,
    author character varying,
    resource_type public.exercise_examples_tutorials_resource_type_enum
);


--
-- Name: exercises; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exercises (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying,
    volume double precision,
    repetitions integer,
    intensity double precision,
    training_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    exercise_example_id uuid
);


--
-- Name: iterations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.iterations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    weight double precision,
    repetitions integer,
    exercise_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: muscle_exercise_bundles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.muscle_exercise_bundles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    percentage integer,
    exercise_example_id uuid,
    muscle_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: muscle_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.muscle_groups (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying,
    name_ua character varying,
    name_ru character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    type public.muscle_groups_type_enum
);


--
-- Name: muscles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.muscles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying,
    muscle_group_id uuid,
    name_ua character varying,
    name_ru character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    type public.muscles_type_enum,
    recovery_time_hours integer
);


--
-- Name: trainings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trainings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    duration integer,
    volume double precision,
    repetitions integer,
    intensity double precision,
    user_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    name character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    height double precision NOT NULL,
    experience public.users_experience_enum
);


--
-- Name: weight_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.weight_history (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    weight double precision NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Data for Name: equipment_groups; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.equipment_groups VALUES ('56550c17-dd77-40c2-8737-fde011dcbbaa', 'Free Weight', 'free_weight', '2024-07-26 15:20:13.307246', '2024-07-26 15:20:13.307246');
INSERT INTO public.equipment_groups VALUES ('fcfa00b0-820c-494a-ac9e-ff4cf4e69489', 'Machines', 'machines', '2024-07-26 15:21:01.438902', '2024-07-26 15:21:01.438902');
INSERT INTO public.equipment_groups VALUES ('7f343be4-0ec8-458a-a45b-d5ab7c1973de', 'Cable Machines', 'cable_machines', '2024-07-26 15:22:38.32104', '2024-07-26 15:22:38.32104');
INSERT INTO public.equipment_groups VALUES ('3670c91d-010e-4e58-b1c6-282fb5fe12c6', 'Body Weight', 'body_weight', '2024-07-26 15:23:05.785405', '2024-07-26 15:23:05.785405');
INSERT INTO public.equipment_groups VALUES ('9f7ba689-6791-4c1e-8ad7-da558a028fac', 'Benches & Racks', 'benches_and_racks', '2024-07-26 15:23:43.201296', '2024-07-26 15:23:43.201296');


--
-- Data for Name: equipments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.equipments VALUES ('9d66ac93-3a48-429d-aeaa-54302856e204', 'Dumbbells', '56550c17-dd77-40c2-8737-fde011dcbbaa', 'dumbbells', '2024-07-26 15:27:07.977174', '2024-07-26 15:27:07.977174');
INSERT INTO public.equipments VALUES ('b17ae8af-2d78-4e77-b45b-39253c28247a', 'Barbell', '56550c17-dd77-40c2-8737-fde011dcbbaa', 'barbell', '2024-07-26 15:27:53.397531', '2024-07-26 15:27:53.397531');
INSERT INTO public.equipments VALUES ('ad130932-4b2f-4e7b-b3a4-c20b4a6b85ae', 'EZ Bar', '56550c17-dd77-40c2-8737-fde011dcbbaa', 'ez_bar', '2024-07-26 15:27:53.397531', '2024-07-26 15:27:53.397531');
INSERT INTO public.equipments VALUES ('21aad68b-b21b-4452-9ebf-7407be8e613d', 'Trap Bar', '56550c17-dd77-40c2-8737-fde011dcbbaa', 'trap_bar', '2024-07-26 15:27:53.397531', '2024-07-26 15:27:53.397531');
INSERT INTO public.equipments VALUES ('15495639-2adb-41b8-899c-493ac0172f57', 'Straight Bar', '56550c17-dd77-40c2-8737-fde011dcbbaa', 'straight_bar', '2024-07-26 15:30:17.071839', '2024-07-26 15:30:17.071839');
INSERT INTO public.equipments VALUES ('331a0c35-f5a5-478d-ba7c-9f14ba2ee0fa', 'Cord Handles', '56550c17-dd77-40c2-8737-fde011dcbbaa', 'cord_handles', '2024-07-26 15:30:34.728288', '2024-07-26 15:30:34.728288');
INSERT INTO public.equipments VALUES ('527227fe-8182-4aec-949a-66335c5ce25e', 'AB Machines', 'fcfa00b0-820c-494a-ac9e-ff4cf4e69489', 'ab_machines', '2024-07-27 09:01:03.349338', '2024-07-27 09:01:03.349338');
INSERT INTO public.equipments VALUES ('3f2fb6e0-df68-4881-a735-f07ea083aaa7', 'Butterfly', 'fcfa00b0-820c-494a-ac9e-ff4cf4e69489', 'butterfly', '2024-07-27 09:01:03.349338', '2024-07-27 09:01:03.349338');
INSERT INTO public.equipments VALUES ('526347a3-ee32-473d-9b5d-049f526ae48e', 'Butterfly Reverse', 'fcfa00b0-820c-494a-ac9e-ff4cf4e69489', 'butterfly_reverse', '2024-07-27 09:01:03.349338', '2024-07-27 09:01:03.349338');
INSERT INTO public.equipments VALUES ('c74a2236-739f-476b-96d9-a11487d4049f', 'Leg Extension Machines', 'fcfa00b0-820c-494a-ac9e-ff4cf4e69489', 'leg_extension_machines', '2024-07-27 09:01:03.349338', '2024-07-27 09:01:03.349338');
INSERT INTO public.equipments VALUES ('a8a80e95-9165-4200-af80-cd7608099307', 'Leg Curl Machines', 'fcfa00b0-820c-494a-ac9e-ff4cf4e69489', 'leg_curl_machines', '2024-07-27 09:03:40.163591', '2024-07-27 09:03:40.163591');
INSERT INTO public.equipments VALUES ('79e4532a-afda-421f-9b5f-8c2de5f63ec0', 'Chest Press Machines', 'fcfa00b0-820c-494a-ac9e-ff4cf4e69489', 'chest_press_machines', '2024-07-27 09:03:40.163591', '2024-07-27 09:03:40.163591');
INSERT INTO public.equipments VALUES ('0d0f8242-be68-4086-b665-0a11ff6a0dcd', 'Biceps Machines', 'fcfa00b0-820c-494a-ac9e-ff4cf4e69489', 'biceps_machines', '2024-07-27 09:03:40.163591', '2024-07-27 09:03:40.163591');
INSERT INTO public.equipments VALUES ('623e0be7-870a-4bca-b053-76e99c9ea7e0', 'Smith Machines', 'fcfa00b0-820c-494a-ac9e-ff4cf4e69489', 'smith_machines', '2024-07-27 09:03:40.163591', '2024-07-27 09:03:40.163591');
INSERT INTO public.equipments VALUES ('20e225dd-68d7-409b-9b7d-5ef6d4224d02', 'Hack Squat Machines', 'fcfa00b0-820c-494a-ac9e-ff4cf4e69489', 'hack_squat_machines', '2024-07-27 09:03:40.163591', '2024-07-27 09:03:40.163591');
INSERT INTO public.equipments VALUES ('6ba064c9-68b3-4b76-af61-6a81eee230c8', 'Deadlift Machines', 'fcfa00b0-820c-494a-ac9e-ff4cf4e69489', 'deadlift_machines', '2024-07-27 09:03:40.163591', '2024-07-27 09:03:40.163591');
INSERT INTO public.equipments VALUES ('6c587294-e384-4941-b90d-e6ec64b8731d', 'Shoulder Press Machines', 'fcfa00b0-820c-494a-ac9e-ff4cf4e69489', 'shoulder_press_machines', '2024-07-27 09:03:40.163591', '2024-07-27 09:03:40.163591');
INSERT INTO public.equipments VALUES ('0268b0d7-f8e4-47ea-b9da-969427b43adf', 'Lateral Raise Machines', 'fcfa00b0-820c-494a-ac9e-ff4cf4e69489', 'lateral_raise_machines', '2024-07-27 09:03:40.163591', '2024-07-27 09:03:40.163591');
INSERT INTO public.equipments VALUES ('f3166b1f-125f-4fb9-a443-e1fc2b1c0f8f', 'Triceps Machines', 'fcfa00b0-820c-494a-ac9e-ff4cf4e69489', 'triceps_machines', '2024-07-27 09:03:40.163591', '2024-07-27 09:03:40.163591');
INSERT INTO public.equipments VALUES ('7752a881-139d-4cf4-98b2-e92e9de0e2e5', 'Calf Raise Machines', 'fcfa00b0-820c-494a-ac9e-ff4cf4e69489', 'calf_raise_machines', '2024-07-27 09:03:40.163591', '2024-07-27 09:03:40.163591');
INSERT INTO public.equipments VALUES ('f3dadde9-6213-4a90-8fc0-12bd7bf7ea6b', 'Glute Machines', 'fcfa00b0-820c-494a-ac9e-ff4cf4e69489', 'glute_machines', '2024-07-27 09:03:40.163591', '2024-07-27 09:03:40.163591');
INSERT INTO public.equipments VALUES ('18995b62-6971-4750-84fe-0c2bc712f352', 'Lat Pulldown', '7f343be4-0ec8-458a-a45b-d5ab7c1973de', 'lat_pulldown', '2024-07-27 09:04:50.495', '2024-07-27 09:04:50.495');
INSERT INTO public.equipments VALUES ('752ee7ba-ae88-46f0-95fb-e0a316212f16', 'Cable', '7f343be4-0ec8-458a-a45b-d5ab7c1973de', 'cable', '2024-07-27 09:04:50.495', '2024-07-27 09:04:50.495');
INSERT INTO public.equipments VALUES ('a6628e7c-1488-4268-82ee-5174f3a5a2a5', 'Cable Crossover', '7f343be4-0ec8-458a-a45b-d5ab7c1973de', 'cable_crossover', '2024-07-27 09:04:50.495', '2024-07-27 09:04:50.495');
INSERT INTO public.equipments VALUES ('373d04ea-8079-439a-82a3-d118da6253b1', 'Row Cable', '7f343be4-0ec8-458a-a45b-d5ab7c1973de', 'row_cable', '2024-07-27 09:04:50.495', '2024-07-27 09:04:50.495');
INSERT INTO public.equipments VALUES ('ddf4299a-fc48-47bd-9bdf-7e3d7692b09f', 'Pull Up Bar', '3670c91d-010e-4e58-b1c6-282fb5fe12c6', 'pull_up_bar', '2024-07-27 09:05:48.252957', '2024-07-27 09:05:48.252957');
INSERT INTO public.equipments VALUES ('c01e10b9-4ef6-4f23-9b41-7f6d5d4d1e85', 'Dip Bars', '3670c91d-010e-4e58-b1c6-282fb5fe12c6', 'dip_bars', '2024-07-27 09:05:48.252957', '2024-07-27 09:05:48.252957');
INSERT INTO public.equipments VALUES ('afe516f8-6dc9-45ca-b95e-81142c336878', 'Romain Chair', '3670c91d-010e-4e58-b1c6-282fb5fe12c6', 'romain_chair', '2024-07-27 09:05:48.252957', '2024-07-27 09:05:48.252957');
INSERT INTO public.equipments VALUES ('306270ba-834e-461e-81ce-45fd5a77c99f', 'Glute Ham Raise Bench', '3670c91d-010e-4e58-b1c6-282fb5fe12c6', 'glute_ham_raise_bench', '2024-07-27 09:05:48.252957', '2024-07-27 09:05:48.252957');
INSERT INTO public.equipments VALUES ('85dbccf6-454e-4440-8905-50a90d91dbcc', 'Flat Bench', '9f7ba689-6791-4c1e-8ad7-da558a028fac', 'flat_bench', '2024-07-27 09:07:42.088418', '2024-07-27 09:07:42.088418');
INSERT INTO public.equipments VALUES ('6215cbaf-6065-4534-a9d5-a588c1b3dc28', 'Adjustable Bench', '9f7ba689-6791-4c1e-8ad7-da558a028fac', 'adjustable_bench', '2024-07-27 09:07:42.088418', '2024-07-27 09:07:42.088418');
INSERT INTO public.equipments VALUES ('c4d5e6fe-30fd-4f16-8646-634102d1bf1b', 'Decline Bench', '9f7ba689-6791-4c1e-8ad7-da558a028fac', 'decline_bench', '2024-07-27 09:07:42.088418', '2024-07-27 09:07:42.088418');
INSERT INTO public.equipments VALUES ('e7fc1da0-48df-4338-b03f-1cea01cd12d5', 'Flat Bench with Rack', '9f7ba689-6791-4c1e-8ad7-da558a028fac', 'flat_bench_with_rack', '2024-07-27 09:07:42.088418', '2024-07-27 09:07:42.088418');
INSERT INTO public.equipments VALUES ('6345b70f-6e3f-46e2-9d51-3be51250ed99', 'Incline Bench with Rack', '9f7ba689-6791-4c1e-8ad7-da558a028fac', 'incline_bench_with_rack', '2024-07-27 09:07:42.088418', '2024-07-27 09:07:42.088418');
INSERT INTO public.equipments VALUES ('9677e942-8a9b-4754-a27f-7e4d945681a1', 'Decline Bench with Rack', '9f7ba689-6791-4c1e-8ad7-da558a028fac', 'decline_bench_with_rack', '2024-07-27 09:07:42.088418', '2024-07-27 09:07:42.088418');
INSERT INTO public.equipments VALUES ('a025ec57-670e-45ea-962e-9c9430786666', 'Squat Rack', '9f7ba689-6791-4c1e-8ad7-da558a028fac', 'squat_rack', '2024-07-27 09:07:42.088418', '2024-07-27 09:07:42.088418');
INSERT INTO public.equipments VALUES ('061ad8e2-77aa-4ba8-9a41-51788e7803c7', 'Preacher Curl Bench', '9f7ba689-6791-4c1e-8ad7-da558a028fac', 'preacher_curl_bench', '2024-07-27 09:07:42.088418', '2024-07-27 09:07:42.088418');
INSERT INTO public.equipments VALUES ('0eda801d-e31d-4943-8a73-68c702f3d3d2', 'Row Bench', '9f7ba689-6791-4c1e-8ad7-da558a028fac', 'row_bench', '2024-07-27 09:07:42.088418', '2024-07-27 09:07:42.088418');
INSERT INTO public.equipments VALUES ('af38ec0a-1465-45a8-99ba-a394224530dc', 'Rope', '56550c17-dd77-40c2-8737-fde011dcbbaa', 'rope', '2024-08-23 14:52:12.166064', '2024-08-23 14:52:12.166064');
INSERT INTO public.equipments VALUES ('524da8cf-0303-4c53-8761-832a5fdb54ed', 'V Bar', '56550c17-dd77-40c2-8737-fde011dcbbaa', 'v_bar', '2024-08-26 14:04:38.569404', '2024-08-26 14:04:38.569404');
INSERT INTO public.equipments VALUES ('9a4df37b-9fdb-4c19-93b3-d99393d9e605', 'Adductor Machine', 'fcfa00b0-820c-494a-ac9e-ff4cf4e69489', 'adductor_machine', '2024-08-31 21:32:21.683976', '2024-08-31 21:32:21.683976');
INSERT INTO public.equipments VALUES ('32bed80a-1512-4945-9654-8d710618ef81', 'Abductor Machine', 'fcfa00b0-820c-494a-ac9e-ff4cf4e69489', 'abductor_machine', '2024-08-31 21:32:21.683976', '2024-08-31 21:32:21.683976');
INSERT INTO public.equipments VALUES ('1959d942-75fb-4ece-b501-b7cf8884d479', 'Leg Press Machine', 'fcfa00b0-820c-494a-ac9e-ff4cf4e69489', 'leg_press_machine', '2024-09-01 13:12:20.206731', '2024-09-01 13:12:20.206731');
INSERT INTO public.equipments VALUES ('c7c51826-c595-4ae8-9ac4-4421b2afc4ad', 'Close Grip Handle', '56550c17-dd77-40c2-8737-fde011dcbbaa', 'close_grip_handle', '2024-09-05 20:34:47.669664', '2024-09-05 20:34:47.669664');
INSERT INTO public.equipments VALUES ('dec9f53a-7dac-4199-b4ff-ab0624090b8b', 'Wide Grip Handle', '56550c17-dd77-40c2-8737-fde011dcbbaa', 'wide_grip_handle', '2024-09-05 20:34:47.669664', '2024-09-05 20:34:47.669664');


--
-- Data for Name: excluded_equipments; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: excluded_muscles; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: exercise_example_bundles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.exercise_example_bundles VALUES ('88a227ca-81cf-463f-94f0-b75d6cc75d35', 7, '11644e17-247a-46b0-a391-b3b2a2a6bba8', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-08-26 14:15:00.637773', '2024-08-26 14:15:00.637773');
INSERT INTO public.exercise_example_bundles VALUES ('e29c077b-a6a5-4b93-9680-ba40bcfc5345', 3, '11644e17-247a-46b0-a391-b3b2a2a6bba8', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-08-26 14:15:00.637773', '2024-08-26 14:15:00.637773');
INSERT INTO public.exercise_example_bundles VALUES ('5f8e03d7-7651-4cba-8bd5-b70776118cd2', 10, '11644e17-247a-46b0-a391-b3b2a2a6bba8', '97136fa7-622a-49d6-9d09-403a631d253d', '2024-08-26 14:15:00.637773', '2024-08-26 14:15:00.637773');
INSERT INTO public.exercise_example_bundles VALUES ('20ca0e99-8e9a-4313-8b35-21555c94f268', 70, '11644e17-247a-46b0-a391-b3b2a2a6bba8', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-26 14:15:00.637773', '2024-08-26 14:15:00.637773');
INSERT INTO public.exercise_example_bundles VALUES ('e28949e2-b238-43e1-98db-b5969877e4f5', 10, '11644e17-247a-46b0-a391-b3b2a2a6bba8', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-26 14:15:00.637773', '2024-08-26 14:15:00.637773');
INSERT INTO public.exercise_example_bundles VALUES ('6782aa22-6e1a-4f3a-b8d3-f49cb5f11527', 80, '6cb225d2-be00-461d-9bf0-7f0c87cfea0b', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-23 13:51:17.104274', '2024-08-23 13:51:17.104274');
INSERT INTO public.exercise_example_bundles VALUES ('7a781077-e89b-42bb-95e6-4bf7c887cc29', 20, '6cb225d2-be00-461d-9bf0-7f0c87cfea0b', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-23 13:51:17.104274', '2024-08-23 13:51:17.104274');
INSERT INTO public.exercise_example_bundles VALUES ('6999837a-f658-4cc1-9845-75f0227aaab0', 80, 'b790c6a6-ecd1-4b3a-afbc-22cd82e55658', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-23 14:29:51.275739', '2024-08-23 14:29:51.275739');
INSERT INTO public.exercise_example_bundles VALUES ('2e9c4465-b20f-4e59-99f7-350ed659af26', 20, 'b790c6a6-ecd1-4b3a-afbc-22cd82e55658', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-23 14:29:51.275739', '2024-08-23 14:29:51.275739');
INSERT INTO public.exercise_example_bundles VALUES ('76b8152c-3971-4713-888f-4c412c5107f1', 85, '4d3a89ab-70ae-4311-8b40-a058b2f3057b', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-23 14:41:48.917167', '2024-08-23 14:41:48.917167');
INSERT INTO public.exercise_example_bundles VALUES ('9ca41f6a-2cf1-4b4c-a280-28858703f3c9', 15, '4d3a89ab-70ae-4311-8b40-a058b2f3057b', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-23 14:41:48.917167', '2024-08-23 14:41:48.917167');
INSERT INTO public.exercise_example_bundles VALUES ('cf554580-e8a2-4485-99c9-ca9069b84603', 80, '0e2fe1e8-f8f1-48e6-b360-8c9d4d9991a6', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-23 14:53:43.913741', '2024-08-23 14:53:43.913741');
INSERT INTO public.exercise_example_bundles VALUES ('4897d4d8-17c7-4cf0-9ee5-41160d8f1f42', 20, '0e2fe1e8-f8f1-48e6-b360-8c9d4d9991a6', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-23 14:53:43.913741', '2024-08-23 14:53:43.913741');
INSERT INTO public.exercise_example_bundles VALUES ('d630120e-c17f-461e-8e47-c238101bbbea', 5, 'ab0d7384-444e-446a-911d-f64ac31db8ef', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-08-23 15:30:18.889592', '2024-08-23 15:30:18.889592');
INSERT INTO public.exercise_example_bundles VALUES ('71b829f5-c42e-427a-86a1-2b0c9959e9cf', 30, 'ab0d7384-444e-446a-911d-f64ac31db8ef', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-23 15:30:18.889592', '2024-08-23 15:30:18.889592');
INSERT INTO public.exercise_example_bundles VALUES ('87dc02f1-1516-4fca-93ac-6f2b5e7312b9', 15, 'ab0d7384-444e-446a-911d-f64ac31db8ef', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-23 15:30:18.889592', '2024-08-23 15:30:18.889592');
INSERT INTO public.exercise_example_bundles VALUES ('dcebd1df-e9b5-4cb8-ac2f-d6f169fe4b58', 45, 'ab0d7384-444e-446a-911d-f64ac31db8ef', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-23 15:30:18.889592', '2024-08-23 15:30:18.889592');
INSERT INTO public.exercise_example_bundles VALUES ('9b49ec23-4c23-4b11-bdd5-8226abc7b0a0', 5, 'ab0d7384-444e-446a-911d-f64ac31db8ef', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-23 15:30:18.889592', '2024-08-23 15:30:18.889592');
INSERT INTO public.exercise_example_bundles VALUES ('e67acbe6-3752-4843-9000-d87f877b8849', 5, '650e9725-d36c-4688-bcab-adf93dfe9e5d', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-08-23 15:44:41.332965', '2024-08-23 15:44:41.332965');
INSERT INTO public.exercise_example_bundles VALUES ('652efe63-0e4b-4830-a0d2-9443672da215', 25, '650e9725-d36c-4688-bcab-adf93dfe9e5d', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-23 15:44:41.332965', '2024-08-23 15:44:41.332965');
INSERT INTO public.exercise_example_bundles VALUES ('2a0e87be-8d27-47ad-a4d1-1011e9298693', 15, '650e9725-d36c-4688-bcab-adf93dfe9e5d', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-23 15:44:41.332965', '2024-08-23 15:44:41.332965');
INSERT INTO public.exercise_example_bundles VALUES ('6e92c283-f0bb-4161-a291-eb46bafdd40e', 50, '650e9725-d36c-4688-bcab-adf93dfe9e5d', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-23 15:44:41.332965', '2024-08-23 15:44:41.332965');
INSERT INTO public.exercise_example_bundles VALUES ('cc503015-28c3-4090-b072-53d7dbf43b16', 5, '650e9725-d36c-4688-bcab-adf93dfe9e5d', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-23 15:44:41.332965', '2024-08-23 15:44:41.332965');
INSERT INTO public.exercise_example_bundles VALUES ('39313a9e-b4b3-47e4-842e-208bb338e74a', 5, '3b828d2f-797f-4a45-9d1d-1d3efe38fb54', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-08-23 15:50:27.647239', '2024-08-23 15:50:27.647239');
INSERT INTO public.exercise_example_bundles VALUES ('a4ff9fe6-5923-4888-9ad8-bc3caff0c3ce', 25, '3b828d2f-797f-4a45-9d1d-1d3efe38fb54', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-23 15:50:27.647239', '2024-08-23 15:50:27.647239');
INSERT INTO public.exercise_example_bundles VALUES ('30f2a505-55c2-4bd0-b74f-cfa6bdbeed17', 15, '3b828d2f-797f-4a45-9d1d-1d3efe38fb54', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-23 15:50:27.647239', '2024-08-23 15:50:27.647239');
INSERT INTO public.exercise_example_bundles VALUES ('c4eef49f-0b04-44de-90b0-148484007fa4', 50, '3b828d2f-797f-4a45-9d1d-1d3efe38fb54', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-23 15:50:27.647239', '2024-08-23 15:50:27.647239');
INSERT INTO public.exercise_example_bundles VALUES ('ac6025bc-b4cb-4775-8d78-82ae1634df2d', 5, '3b828d2f-797f-4a45-9d1d-1d3efe38fb54', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-23 15:50:27.647239', '2024-08-23 15:50:27.647239');
INSERT INTO public.exercise_example_bundles VALUES ('e5d05435-4c49-4900-987e-0be1fed5df55', 10, '7517ae2f-c198-4a33-8a1d-1dc7327d1430', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-23 20:29:25.1916', '2024-08-23 20:29:25.1916');
INSERT INTO public.exercise_example_bundles VALUES ('15793138-fe56-4263-be2f-6df2b9b8eed6', 15, '7517ae2f-c198-4a33-8a1d-1dc7327d1430', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-23 20:29:25.1916', '2024-08-23 20:29:25.1916');
INSERT INTO public.exercise_example_bundles VALUES ('e05517be-f96e-4c2e-955e-51026b7fad31', 70, '7517ae2f-c198-4a33-8a1d-1dc7327d1430', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-23 20:29:25.1916', '2024-08-23 20:29:25.1916');
INSERT INTO public.exercise_example_bundles VALUES ('9aa0603b-61eb-4f10-9e48-13f176ec547b', 5, '7517ae2f-c198-4a33-8a1d-1dc7327d1430', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-23 20:29:25.1916', '2024-08-23 20:29:25.1916');
INSERT INTO public.exercise_example_bundles VALUES ('cd6fc1f9-fc65-40f9-b6a3-0dc66104ce4e', 10, '4aafe702-f2fc-4fa2-a7fb-c31c279adeda', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-23 20:36:43.355792', '2024-08-23 20:36:43.355792');
INSERT INTO public.exercise_example_bundles VALUES ('94df2963-cd52-40e6-8acc-6a7bce910a77', 15, '4aafe702-f2fc-4fa2-a7fb-c31c279adeda', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-23 20:36:43.355792', '2024-08-23 20:36:43.355792');
INSERT INTO public.exercise_example_bundles VALUES ('2a64ad71-1bc3-41eb-b583-c82a795e5ca1', 65, '4aafe702-f2fc-4fa2-a7fb-c31c279adeda', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-23 20:36:43.355792', '2024-08-23 20:36:43.355792');
INSERT INTO public.exercise_example_bundles VALUES ('0be804c3-aa15-4ba1-ab73-1fa05ab89781', 10, '4aafe702-f2fc-4fa2-a7fb-c31c279adeda', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-23 20:36:43.355792', '2024-08-23 20:36:43.355792');
INSERT INTO public.exercise_example_bundles VALUES ('296368ee-2357-4884-843b-001815eb58eb', 5, 'faf6674c-2a2a-4b03-ab8b-7a033052b572', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-08-24 13:49:36.256733', '2024-08-24 13:49:36.256733');
INSERT INTO public.exercise_example_bundles VALUES ('4f8dead0-6147-4e91-9471-ed0cc16a55e2', 15, 'faf6674c-2a2a-4b03-ab8b-7a033052b572', '97136fa7-622a-49d6-9d09-403a631d253d', '2024-08-24 13:49:36.256733', '2024-08-24 13:49:36.256733');
INSERT INTO public.exercise_example_bundles VALUES ('6ef6e9e6-7c76-4e9a-8175-50c156ab6a5f', 70, 'faf6674c-2a2a-4b03-ab8b-7a033052b572', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-24 13:49:36.256733', '2024-08-24 13:49:36.256733');
INSERT INTO public.exercise_example_bundles VALUES ('0de77642-bf82-42ba-a9d4-20a07baedd16', 10, 'faf6674c-2a2a-4b03-ab8b-7a033052b572', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-24 13:49:36.256733', '2024-08-24 13:49:36.256733');
INSERT INTO public.exercise_example_bundles VALUES ('113dc604-3006-4bc6-be1b-37224b7d22fe', 50, '93e6b1c4-0510-41d4-983c-a1fde003881f', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-24 13:55:14.342158', '2024-08-24 13:55:14.342158');
INSERT INTO public.exercise_example_bundles VALUES ('a51e0538-ad97-4c59-9b1f-5b309afbbc51', 15, '93e6b1c4-0510-41d4-983c-a1fde003881f', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-24 13:55:14.342158', '2024-08-24 13:55:14.342158');
INSERT INTO public.exercise_example_bundles VALUES ('3aebaec1-6632-4c73-ba8c-6952dba05975', 30, '93e6b1c4-0510-41d4-983c-a1fde003881f', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-24 13:55:14.342158', '2024-08-24 13:55:14.342158');
INSERT INTO public.exercise_example_bundles VALUES ('064356e6-5f00-447c-be92-417544cafb0f', 5, '93e6b1c4-0510-41d4-983c-a1fde003881f', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-24 13:55:14.342158', '2024-08-24 13:55:14.342158');
INSERT INTO public.exercise_example_bundles VALUES ('14388af7-5dec-40f2-93f9-251203ac087f', 5, '0eaa8980-e29e-4f33-88b0-915db5cf309a', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-24 15:00:28.261712', '2024-08-24 15:00:28.261712');
INSERT INTO public.exercise_example_bundles VALUES ('03e7efda-d175-45ce-9424-e35e1694177b', 20, '0eaa8980-e29e-4f33-88b0-915db5cf309a', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-24 15:00:28.261712', '2024-08-24 15:00:28.261712');
INSERT INTO public.exercise_example_bundles VALUES ('e462d49b-8854-4d9c-a2b4-7e613438fe8d', 70, '0eaa8980-e29e-4f33-88b0-915db5cf309a', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-24 15:00:28.261712', '2024-08-24 15:00:28.261712');
INSERT INTO public.exercise_example_bundles VALUES ('f5cdbe03-ce9d-447f-9c6a-c199db0346cf', 5, '0eaa8980-e29e-4f33-88b0-915db5cf309a', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-24 15:00:28.261712', '2024-08-24 15:00:28.261712');
INSERT INTO public.exercise_example_bundles VALUES ('cb83ce2d-8aee-47ea-9b4e-a71f4b618d8a', 15, '9f0c8916-a08b-4fe5-9f24-e1680ef627a8', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-24 15:05:24.066839', '2024-08-24 15:05:24.066839');
INSERT INTO public.exercise_example_bundles VALUES ('eb65b18d-1ecc-4bc4-b9f1-920c31315722', 15, '9f0c8916-a08b-4fe5-9f24-e1680ef627a8', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-24 15:05:24.066839', '2024-08-24 15:05:24.066839');
INSERT INTO public.exercise_example_bundles VALUES ('03d7628e-87b2-40b7-95db-da120ea3cf9e', 65, '9f0c8916-a08b-4fe5-9f24-e1680ef627a8', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-24 15:05:24.066839', '2024-08-24 15:05:24.066839');
INSERT INTO public.exercise_example_bundles VALUES ('996f10ba-b0a0-445b-81e7-29b390dd755d', 5, '9f0c8916-a08b-4fe5-9f24-e1680ef627a8', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-24 15:05:24.066839', '2024-08-24 15:05:24.066839');
INSERT INTO public.exercise_example_bundles VALUES ('337b2432-790c-4da6-89bb-e9d3494fc6db', 5, '547f1f7e-3ee1-4b39-99eb-3462b1ec13af', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-08-24 15:14:04.496892', '2024-08-24 15:14:04.496892');
INSERT INTO public.exercise_example_bundles VALUES ('46745aee-08e8-4f56-b1b4-5aec7ff13476', 15, '547f1f7e-3ee1-4b39-99eb-3462b1ec13af', '97136fa7-622a-49d6-9d09-403a631d253d', '2024-08-24 15:14:04.496892', '2024-08-24 15:14:04.496892');
INSERT INTO public.exercise_example_bundles VALUES ('abd6d56d-1d25-422f-b795-f278139c9572', 70, '547f1f7e-3ee1-4b39-99eb-3462b1ec13af', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-24 15:14:04.496892', '2024-08-24 15:14:04.496892');
INSERT INTO public.exercise_example_bundles VALUES ('8c76f415-184d-4cd4-8e31-8776f8594f67', 10, '547f1f7e-3ee1-4b39-99eb-3462b1ec13af', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-24 15:14:04.496892', '2024-08-24 15:14:04.496892');
INSERT INTO public.exercise_example_bundles VALUES ('ac8a1331-b694-4383-883d-1303ae5bf228', 3, '275097d4-3c8d-4040-9b2e-5f294919df04', '1ddbb748-37a6-4d66-a7d4-4957bdbc647f', '2024-08-24 15:21:25.320698', '2024-08-24 15:21:25.320698');
INSERT INTO public.exercise_example_bundles VALUES ('2d9192aa-8c25-4b78-b6da-6111d54f0d10', 3, '275097d4-3c8d-4040-9b2e-5f294919df04', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-08-24 15:21:25.320698', '2024-08-24 15:21:25.320698');
INSERT INTO public.exercise_example_bundles VALUES ('1bf5346d-a25e-44e9-987b-16018d0a9d33', 5, '275097d4-3c8d-4040-9b2e-5f294919df04', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-24 15:21:25.320698', '2024-08-24 15:21:25.320698');
INSERT INTO public.exercise_example_bundles VALUES ('663ac7b2-0efa-4af8-8e68-5b3743275b36', 5, '275097d4-3c8d-4040-9b2e-5f294919df04', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-24 15:21:25.320698', '2024-08-24 15:21:25.320698');
INSERT INTO public.exercise_example_bundles VALUES ('9dd4593f-1740-4bb6-9b42-ac12612b60c2', 74, '275097d4-3c8d-4040-9b2e-5f294919df04', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-24 15:21:25.320698', '2024-08-24 15:21:25.320698');
INSERT INTO public.exercise_example_bundles VALUES ('d6378421-7dd2-4e30-8e29-e9b54007c407', 10, '275097d4-3c8d-4040-9b2e-5f294919df04', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-24 15:21:25.320698', '2024-08-24 15:21:25.320698');
INSERT INTO public.exercise_example_bundles VALUES ('499e865a-3135-4ba7-b234-ad2829a7a45f', 3, '5985d847-0473-444e-8fe0-9da5341ef986', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-08-26 14:10:38.4213', '2024-08-26 14:10:38.4213');
INSERT INTO public.exercise_example_bundles VALUES ('7e8e06b7-05da-4185-ada7-5fe66e050ee1', 5, '5985d847-0473-444e-8fe0-9da5341ef986', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-26 14:10:38.4213', '2024-08-26 14:10:38.4213');
INSERT INTO public.exercise_example_bundles VALUES ('1a6610cb-266c-4631-b48a-f7cb7fac9d87', 7, '5985d847-0473-444e-8fe0-9da5341ef986', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-26 14:10:38.4213', '2024-08-26 14:10:38.4213');
INSERT INTO public.exercise_example_bundles VALUES ('0db79f53-e4a4-444a-8634-08b66cf9235f', 75, '5985d847-0473-444e-8fe0-9da5341ef986', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-26 14:10:38.4213', '2024-08-26 14:10:38.4213');
INSERT INTO public.exercise_example_bundles VALUES ('a91744b3-2a6a-4c0f-a493-db486500377d', 10, '5985d847-0473-444e-8fe0-9da5341ef986', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-26 14:10:38.4213', '2024-08-26 14:10:38.4213');
INSERT INTO public.exercise_example_bundles VALUES ('7bd3907b-eacc-46dd-842f-47941c61279f', 10, '50774526-c91f-4d71-82a8-456526b0fbd0', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-08-26 14:21:24.517126', '2024-08-26 14:21:24.517126');
INSERT INTO public.exercise_example_bundles VALUES ('a757a9c8-94b8-4890-9c45-b4fc096f1a28', 3, '50774526-c91f-4d71-82a8-456526b0fbd0', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-08-26 14:21:24.517126', '2024-08-26 14:21:24.517126');
INSERT INTO public.exercise_example_bundles VALUES ('d6d66074-2ad3-4169-9948-05cc659e74f0', 7, '50774526-c91f-4d71-82a8-456526b0fbd0', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-26 14:21:24.517126', '2024-08-26 14:21:24.517126');
INSERT INTO public.exercise_example_bundles VALUES ('235a838e-41db-4402-ada9-6919697d8852', 5, '50774526-c91f-4d71-82a8-456526b0fbd0', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-26 14:21:24.517126', '2024-08-26 14:21:24.517126');
INSERT INTO public.exercise_example_bundles VALUES ('08df3ca9-1e6b-46ee-8cc5-dff2ef9989fe', 75, '50774526-c91f-4d71-82a8-456526b0fbd0', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-26 14:21:24.517126', '2024-08-26 14:21:24.517126');
INSERT INTO public.exercise_example_bundles VALUES ('dbbd9f85-c19f-4775-a1d8-0117a3fdb8c0', 3, '385fb192-7c2c-405a-b483-f36e32e241c8', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-08-26 14:31:15.925866', '2024-08-26 14:31:15.925866');
INSERT INTO public.exercise_example_bundles VALUES ('ead15f95-2373-4ae3-93c2-4b25a299c691', 30, '385fb192-7c2c-405a-b483-f36e32e241c8', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-26 14:31:15.925866', '2024-08-26 14:31:15.925866');
INSERT INTO public.exercise_example_bundles VALUES ('3bce6cda-6a21-4139-a1b1-61242b994c35', 7, '385fb192-7c2c-405a-b483-f36e32e241c8', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-26 14:31:15.925866', '2024-08-26 14:31:15.925866');
INSERT INTO public.exercise_example_bundles VALUES ('3c16442f-55c3-44a6-aaee-227ffe547d1b', 60, '385fb192-7c2c-405a-b483-f36e32e241c8', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-26 14:31:15.925866', '2024-08-26 14:31:15.925866');
INSERT INTO public.exercise_example_bundles VALUES ('c9e17142-9f8e-4aee-a248-23c3b8f81e1b', 33, 'c21d3b0f-c8a8-4b7f-92ea-90dc567a1183', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-26 14:36:25.64298', '2024-08-26 14:36:25.64298');
INSERT INTO public.exercise_example_bundles VALUES ('a1ae109e-f6d9-4875-83a0-8271fabf798b', 10, 'c21d3b0f-c8a8-4b7f-92ea-90dc567a1183', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-26 14:36:25.64298', '2024-08-26 14:36:25.64298');
INSERT INTO public.exercise_example_bundles VALUES ('abd1f4e9-2c21-48fa-9183-54a67d26b8c0', 57, 'c21d3b0f-c8a8-4b7f-92ea-90dc567a1183', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-26 14:36:25.64298', '2024-08-26 14:36:25.64298');
INSERT INTO public.exercise_example_bundles VALUES ('21e181ac-103a-4976-83ef-bf7d79bf373d', 3, '04d275d8-71df-4695-ace9-899ce6e41b29', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-26 14:39:55.631326', '2024-08-26 14:39:55.631326');
INSERT INTO public.exercise_example_bundles VALUES ('cdfc0623-dfef-4ddc-a118-d027ee0efacb', 7, '04d275d8-71df-4695-ace9-899ce6e41b29', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-26 14:39:55.631326', '2024-08-26 14:39:55.631326');
INSERT INTO public.exercise_example_bundles VALUES ('4ef797d6-9579-4c34-bb18-eef1a7b5cf5b', 90, '04d275d8-71df-4695-ace9-899ce6e41b29', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-26 14:39:55.631326', '2024-08-26 14:39:55.631326');
INSERT INTO public.exercise_example_bundles VALUES ('73d55224-e0cc-4625-a0f6-2c13f2c02a86', 5, '1b4402c2-2459-45c1-8d24-356322c71d20', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-08-26 14:46:34.082451', '2024-08-26 14:46:34.082451');
INSERT INTO public.exercise_example_bundles VALUES ('293f3ce5-ca84-4ce2-8d4a-d25e088c1272', 5, '1b4402c2-2459-45c1-8d24-356322c71d20', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-26 14:46:34.082451', '2024-08-26 14:46:34.082451');
INSERT INTO public.exercise_example_bundles VALUES ('e9e55355-5a3e-4a26-8605-82e056734465', 90, '1b4402c2-2459-45c1-8d24-356322c71d20', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-26 14:46:34.082451', '2024-08-26 14:46:34.082451');
INSERT INTO public.exercise_example_bundles VALUES ('68ce91fd-05a6-49e2-a3a7-47c2bde7f3a0', 5, '4f9bdd10-28bc-447e-8cf5-fbf47cd9af79', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-08-26 14:52:11.244098', '2024-08-26 14:52:11.244098');
INSERT INTO public.exercise_example_bundles VALUES ('609d1d59-52b1-4a47-9274-795756d11360', 5, '4f9bdd10-28bc-447e-8cf5-fbf47cd9af79', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-26 14:52:11.244098', '2024-08-26 14:52:11.244098');
INSERT INTO public.exercise_example_bundles VALUES ('111cdf18-c08f-4133-8e95-8aa4549ef28c', 90, '4f9bdd10-28bc-447e-8cf5-fbf47cd9af79', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-26 14:52:11.244098', '2024-08-26 14:52:11.244098');
INSERT INTO public.exercise_example_bundles VALUES ('1aea43fc-04d5-4c68-a744-6da969b4e0ec', 5, '6a312bde-cc33-450b-8f1d-6091ccffe9cc', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-08-26 15:16:20.199318', '2024-08-26 15:16:20.199318');
INSERT INTO public.exercise_example_bundles VALUES ('c5a1bbba-5a08-45ef-b15e-bbd8e1ec03ea', 5, '6a312bde-cc33-450b-8f1d-6091ccffe9cc', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-08-26 15:16:20.199318', '2024-08-26 15:16:20.199318');
INSERT INTO public.exercise_example_bundles VALUES ('3a96266d-7ef7-4e52-9506-20a930f7941a', 5, '6a312bde-cc33-450b-8f1d-6091ccffe9cc', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-26 15:16:20.199318', '2024-08-26 15:16:20.199318');
INSERT INTO public.exercise_example_bundles VALUES ('eafb9352-ecfd-40d0-a070-02526d31c373', 85, '6a312bde-cc33-450b-8f1d-6091ccffe9cc', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-26 15:16:20.199318', '2024-08-26 15:16:20.199318');
INSERT INTO public.exercise_example_bundles VALUES ('90ad90a5-335d-4ff0-9e11-4b201a07a6ba', 4, '21e7460d-aa00-448b-8c82-994a73e0164c', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-08-26 15:20:51.083182', '2024-08-26 15:20:51.083182');
INSERT INTO public.exercise_example_bundles VALUES ('76982849-abc8-464e-afb0-447a8131dbd2', 4, '21e7460d-aa00-448b-8c82-994a73e0164c', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-26 15:20:51.083182', '2024-08-26 15:20:51.083182');
INSERT INTO public.exercise_example_bundles VALUES ('e7bf4936-7256-470e-bbe7-7e0cc9fb3417', 7, '21e7460d-aa00-448b-8c82-994a73e0164c', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-26 15:20:51.083182', '2024-08-26 15:20:51.083182');
INSERT INTO public.exercise_example_bundles VALUES ('ae3dd37f-9fa3-4f6b-b55e-6b5b602a2eb0', 85, '21e7460d-aa00-448b-8c82-994a73e0164c', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-26 15:20:51.083182', '2024-08-26 15:20:51.083182');
INSERT INTO public.exercise_example_bundles VALUES ('0bcb7511-93a0-44d3-84f9-069817c301b9', 3, 'ee8cc366-d33b-45a6-84b0-4ab416585ad1', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-08-27 16:05:54.978989', '2024-08-27 16:05:54.978989');
INSERT INTO public.exercise_example_bundles VALUES ('184b87a1-9a62-4c30-84af-1d41ee495921', 5, 'ee8cc366-d33b-45a6-84b0-4ab416585ad1', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-08-27 16:05:54.978989', '2024-08-27 16:05:54.978989');
INSERT INTO public.exercise_example_bundles VALUES ('9d8bb8b1-eaaa-45fd-bd2a-793ffdf705bb', 7, 'ee8cc366-d33b-45a6-84b0-4ab416585ad1', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-27 16:05:54.978989', '2024-08-27 16:05:54.978989');
INSERT INTO public.exercise_example_bundles VALUES ('5d6a57a3-3484-4157-8e13-704b6fc2b01f', 20, 'ee8cc366-d33b-45a6-84b0-4ab416585ad1', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-27 16:05:54.978989', '2024-08-27 16:05:54.978989');
INSERT INTO public.exercise_example_bundles VALUES ('228def8d-0219-4b5f-b953-77558ab99b01', 65, 'ee8cc366-d33b-45a6-84b0-4ab416585ad1', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-27 16:05:54.978989', '2024-08-27 16:05:54.978989');
INSERT INTO public.exercise_example_bundles VALUES ('0c6a8197-d0c6-4436-b902-0e06b20f08ac', 85, '490df80e-d34c-42cf-bfe5-c27ddd2cd734', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-27 17:08:58.77674', '2024-08-27 17:08:58.77674');
INSERT INTO public.exercise_example_bundles VALUES ('9f643fad-c319-409f-996f-f73ed0be2be5', 7, '490df80e-d34c-42cf-bfe5-c27ddd2cd734', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-27 17:08:58.77674', '2024-08-27 17:08:58.77674');
INSERT INTO public.exercise_example_bundles VALUES ('e73950e2-a50a-43af-921c-511a7bf30eae', 5, '490df80e-d34c-42cf-bfe5-c27ddd2cd734', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-08-27 17:08:58.77674', '2024-08-27 17:08:58.77674');
INSERT INTO public.exercise_example_bundles VALUES ('4a711708-1db5-4d8a-b0b4-9b7a0de9ed8b', 3, '490df80e-d34c-42cf-bfe5-c27ddd2cd734', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-08-27 17:08:58.77674', '2024-08-27 17:08:58.77674');
INSERT INTO public.exercise_example_bundles VALUES ('dc847242-4679-44c9-b745-7b297eac4c01', 55, 'e21344ff-b825-4a99-bf8b-a778bf1964d1', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-27 17:14:24.429554', '2024-08-27 17:14:24.429554');
INSERT INTO public.exercise_example_bundles VALUES ('0600b519-6d37-4fde-b790-79ea0d48112f', 25, 'e21344ff-b825-4a99-bf8b-a778bf1964d1', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-27 17:14:24.429554', '2024-08-27 17:14:24.429554');
INSERT INTO public.exercise_example_bundles VALUES ('328de5b9-70a8-4eb9-b08f-9520e3cbb86e', 15, 'e21344ff-b825-4a99-bf8b-a778bf1964d1', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-27 17:14:24.429554', '2024-08-27 17:14:24.429554');
INSERT INTO public.exercise_example_bundles VALUES ('223035aa-6c8e-418b-8285-f93ab5950ef2', 5, 'e21344ff-b825-4a99-bf8b-a778bf1964d1', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-08-27 17:14:24.429554', '2024-08-27 17:14:24.429554');
INSERT INTO public.exercise_example_bundles VALUES ('d75b33f1-1a5d-4443-8165-207c728f97de', 85, 'd6743870-0d5a-4180-9671-181b8f65e03e', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-27 17:17:13.843181', '2024-08-27 17:17:13.843181');
INSERT INTO public.exercise_example_bundles VALUES ('09b6b03b-1f0a-411f-b4a9-65e0e3dd6251', 10, 'd6743870-0d5a-4180-9671-181b8f65e03e', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-27 17:17:13.843181', '2024-08-27 17:17:13.843181');
INSERT INTO public.exercise_example_bundles VALUES ('194b2a4e-0e5b-4ce2-9eba-ad5f6ed14e28', 5, 'd6743870-0d5a-4180-9671-181b8f65e03e', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-08-27 17:17:13.843181', '2024-08-27 17:17:13.843181');
INSERT INTO public.exercise_example_bundles VALUES ('95ad4d7e-324f-40cc-9d49-45db44ea0f1f', 90, '855bd9e5-3546-4cfd-b048-e8017f01bfeb', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-27 17:37:27.246315', '2024-08-27 17:37:27.246315');
INSERT INTO public.exercise_example_bundles VALUES ('e7f23007-ba25-4d73-843e-511f4cfd5737', 7, '855bd9e5-3546-4cfd-b048-e8017f01bfeb', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-27 17:37:27.246315', '2024-08-27 17:37:27.246315');
INSERT INTO public.exercise_example_bundles VALUES ('ca071223-d031-49f3-8998-0a4e9c43ac04', 3, '855bd9e5-3546-4cfd-b048-e8017f01bfeb', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-27 17:37:27.246315', '2024-08-27 17:37:27.246315');
INSERT INTO public.exercise_example_bundles VALUES ('fe5a7d39-3e3a-4a5c-94bb-c2c3a9f41bd7', 85, '53defdc5-bfec-4af4-bfba-60440e3493cc', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-27 17:40:04.038365', '2024-08-27 17:40:04.038365');
INSERT INTO public.exercise_example_bundles VALUES ('dc55bf23-a1e2-439a-a330-313276f65c49', 10, '53defdc5-bfec-4af4-bfba-60440e3493cc', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-27 17:40:04.038365', '2024-08-27 17:40:04.038365');
INSERT INTO public.exercise_example_bundles VALUES ('4b4553ac-4060-4f3e-88db-7366cde47744', 5, '53defdc5-bfec-4af4-bfba-60440e3493cc', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-08-27 17:40:04.038365', '2024-08-27 17:40:04.038365');
INSERT INTO public.exercise_example_bundles VALUES ('43b6f73e-fbbb-4174-86d0-ffdca377721d', 85, '748e0a60-9429-4a9d-8a6b-3ba76a7fc4b2', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-27 17:41:21.150235', '2024-08-27 17:41:21.150235');
INSERT INTO public.exercise_example_bundles VALUES ('33498eb0-fac1-4a2e-84c5-ad04089181ab', 10, '748e0a60-9429-4a9d-8a6b-3ba76a7fc4b2', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-08-27 17:41:21.150235', '2024-08-27 17:41:21.150235');
INSERT INTO public.exercise_example_bundles VALUES ('86d04a02-0f80-4f1e-88b9-df9a92e05310', 5, '748e0a60-9429-4a9d-8a6b-3ba76a7fc4b2', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-27 17:41:21.150235', '2024-08-27 17:41:21.150235');
INSERT INTO public.exercise_example_bundles VALUES ('4250a8bb-f09e-40be-b305-8a58e486319c', 90, 'a90f4822-63c5-42b9-943c-ff0ceacad1eb', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-27 17:44:25.493574', '2024-08-27 17:44:25.493574');
INSERT INTO public.exercise_example_bundles VALUES ('e85c86b2-941a-41d7-a060-ae9efcc440ef', 7, 'a90f4822-63c5-42b9-943c-ff0ceacad1eb', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-27 17:44:25.493574', '2024-08-27 17:44:25.493574');
INSERT INTO public.exercise_example_bundles VALUES ('8c5fc4c7-284f-47b1-b3d3-667369204674', 3, 'a90f4822-63c5-42b9-943c-ff0ceacad1eb', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-27 17:44:25.493574', '2024-08-27 17:44:25.493574');
INSERT INTO public.exercise_example_bundles VALUES ('6a155359-0805-4787-a022-ce3812bcf05c', 85, 'ddc2e877-7197-42fa-ae1e-59706d209774', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-27 19:58:20.496346', '2024-08-27 19:58:20.496346');
INSERT INTO public.exercise_example_bundles VALUES ('fefc9491-3df3-4e18-9f17-2746e3989075', 10, 'ddc2e877-7197-42fa-ae1e-59706d209774', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-27 19:58:20.496346', '2024-08-27 19:58:20.496346');
INSERT INTO public.exercise_example_bundles VALUES ('9ef3dd63-ae20-4b40-9f0e-ff3d9390c73b', 5, 'ddc2e877-7197-42fa-ae1e-59706d209774', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-27 19:58:20.496346', '2024-08-27 19:58:20.496346');
INSERT INTO public.exercise_example_bundles VALUES ('7687354a-a9e4-4eea-8a55-9515da80328a', 70, '8324ae75-08e9-48de-a00b-55d229085712', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-27 20:02:25.698074', '2024-08-27 20:02:25.698074');
INSERT INTO public.exercise_example_bundles VALUES ('9cf926d9-80bd-444c-8f6c-0ff9c558e8e2', 25, '8324ae75-08e9-48de-a00b-55d229085712', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-27 20:02:25.698074', '2024-08-27 20:02:25.698074');
INSERT INTO public.exercise_example_bundles VALUES ('75d3423c-38d0-4260-a912-4eeacbe4fc1a', 5, '8324ae75-08e9-48de-a00b-55d229085712', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-27 20:02:25.698074', '2024-08-27 20:02:25.698074');
INSERT INTO public.exercise_example_bundles VALUES ('e24cd5ac-96e4-4955-9357-8cef40f6b2cf', 85, 'bbfbcfe2-1f56-492e-afa6-75e595b84fde', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-27 20:04:23.484123', '2024-08-27 20:04:23.484123');
INSERT INTO public.exercise_example_bundles VALUES ('800b2a70-816c-49f0-a8b9-870aff6088b8', 10, 'bbfbcfe2-1f56-492e-afa6-75e595b84fde', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-27 20:04:23.484123', '2024-08-27 20:04:23.484123');
INSERT INTO public.exercise_example_bundles VALUES ('479ce6bc-3090-41f5-ae9a-f07004aa44b2', 5, 'bbfbcfe2-1f56-492e-afa6-75e595b84fde', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-27 20:04:23.484123', '2024-08-27 20:04:23.484123');
INSERT INTO public.exercise_example_bundles VALUES ('6f734756-9c48-4dcd-bee2-6bed69665219', 80, '09386394-e4e1-4a6d-adce-d5f5a518485c', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-27 20:09:12.659219', '2024-08-27 20:09:12.659219');
INSERT INTO public.exercise_example_bundles VALUES ('3d22c4c2-ebc1-4aea-a9e0-6e35b6b50cb4', 15, '09386394-e4e1-4a6d-adce-d5f5a518485c', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-27 20:09:12.659219', '2024-08-27 20:09:12.659219');
INSERT INTO public.exercise_example_bundles VALUES ('f760f86f-5b69-469e-a4ba-393f949e1a8c', 5, '09386394-e4e1-4a6d-adce-d5f5a518485c', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-27 20:09:12.659219', '2024-08-27 20:09:12.659219');
INSERT INTO public.exercise_example_bundles VALUES ('afb55144-4d6a-4132-bbda-a5dc1583f964', 85, 'cfb2d83a-b3dc-44e9-ab08-53f9269752d6', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-27 20:11:42.127843', '2024-08-27 20:11:42.127843');
INSERT INTO public.exercise_example_bundles VALUES ('a6857925-338c-491e-8808-e1996bf2e9b7', 10, 'cfb2d83a-b3dc-44e9-ab08-53f9269752d6', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-27 20:11:42.127843', '2024-08-27 20:11:42.127843');
INSERT INTO public.exercise_example_bundles VALUES ('2ee74b2f-791d-4c57-8048-ccafdb6aa5c4', 5, 'cfb2d83a-b3dc-44e9-ab08-53f9269752d6', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-27 20:11:42.127843', '2024-08-27 20:11:42.127843');
INSERT INTO public.exercise_example_bundles VALUES ('c4f5967c-315d-44a5-808c-c1611f1290e6', 85, '2522a61a-2190-43e9-ae52-ca6bb023815e', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-27 20:13:52.515436', '2024-08-27 20:13:52.515436');
INSERT INTO public.exercise_example_bundles VALUES ('df2bdb42-b9d5-4495-a53a-db3378a362ce', 10, '2522a61a-2190-43e9-ae52-ca6bb023815e', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-27 20:13:52.515436', '2024-08-27 20:13:52.515436');
INSERT INTO public.exercise_example_bundles VALUES ('6cba3937-9806-42a5-bf8b-e14a0db50c5d', 5, '2522a61a-2190-43e9-ae52-ca6bb023815e', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-27 20:13:52.515436', '2024-08-27 20:13:52.515436');
INSERT INTO public.exercise_example_bundles VALUES ('c36a9453-2ebb-4e48-8645-d707664d9a14', 85, '9fc5ae4d-2868-4576-bb67-9c83663fc005', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-27 20:15:21.120047', '2024-08-27 20:15:21.120047');
INSERT INTO public.exercise_example_bundles VALUES ('125a37fd-101e-4192-9ad7-795e39eed73d', 10, '9fc5ae4d-2868-4576-bb67-9c83663fc005', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-27 20:15:21.120047', '2024-08-27 20:15:21.120047');
INSERT INTO public.exercise_example_bundles VALUES ('cfb15031-a060-42e0-aaf0-bd4407588e80', 5, '9fc5ae4d-2868-4576-bb67-9c83663fc005', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-27 20:15:21.120047', '2024-08-27 20:15:21.120047');
INSERT INTO public.exercise_example_bundles VALUES ('212ec793-103d-485e-a0fb-78bcf7e69244', 70, '89f423d0-315f-4d93-b346-dcb468a97045', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-27 20:17:28.420295', '2024-08-27 20:17:28.420295');
INSERT INTO public.exercise_example_bundles VALUES ('c578ca42-13db-478c-bd7a-4968bc7fceb7', 25, '89f423d0-315f-4d93-b346-dcb468a97045', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-27 20:17:28.420295', '2024-08-27 20:17:28.420295');
INSERT INTO public.exercise_example_bundles VALUES ('1d693839-4b53-4a99-b42c-c73816b5161e', 5, '89f423d0-315f-4d93-b346-dcb468a97045', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-27 20:17:28.420295', '2024-08-27 20:17:28.420295');
INSERT INTO public.exercise_example_bundles VALUES ('c1a35037-a4fa-4a0d-b014-8a123c7e5371', 85, '194fa2ee-7f92-4982-903e-3db80293d773', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-27 20:20:16.525543', '2024-08-27 20:20:16.525543');
INSERT INTO public.exercise_example_bundles VALUES ('1ba42609-7d2e-4934-8452-1cdebdef5545', 10, '194fa2ee-7f92-4982-903e-3db80293d773', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-27 20:20:16.525543', '2024-08-27 20:20:16.525543');
INSERT INTO public.exercise_example_bundles VALUES ('f500643c-e69d-4f80-a477-0ffcc4b35c03', 5, '194fa2ee-7f92-4982-903e-3db80293d773', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-27 20:20:16.525543', '2024-08-27 20:20:16.525543');
INSERT INTO public.exercise_example_bundles VALUES ('e006cd44-daa3-4fa0-af65-7fe2e178bc65', 85, 'f2fb31f0-7f6b-42b6-9a79-c22453ac6a63', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-27 20:24:43.755434', '2024-08-27 20:24:43.755434');
INSERT INTO public.exercise_example_bundles VALUES ('77ef457c-da51-4cdf-93ad-b6640f250f6d', 10, 'f2fb31f0-7f6b-42b6-9a79-c22453ac6a63', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-27 20:24:43.755434', '2024-08-27 20:24:43.755434');
INSERT INTO public.exercise_example_bundles VALUES ('220ad7dc-5334-486c-a6c6-9504ed2865ee', 5, 'f2fb31f0-7f6b-42b6-9a79-c22453ac6a63', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-27 20:24:43.755434', '2024-08-27 20:24:43.755434');
INSERT INTO public.exercise_example_bundles VALUES ('359c0953-b4ef-491e-b221-327ebb8b4332', 70, '5e3c933f-7511-463e-88b1-a139c8276e69', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-27 20:27:54.267144', '2024-08-27 20:27:54.267144');
INSERT INTO public.exercise_example_bundles VALUES ('802888ae-b322-4b39-a632-7637af500f7f', 25, '5e3c933f-7511-463e-88b1-a139c8276e69', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-27 20:27:54.267144', '2024-08-27 20:27:54.267144');
INSERT INTO public.exercise_example_bundles VALUES ('0aea0f3c-3a35-481c-bf47-0c67621a3190', 5, '5e3c933f-7511-463e-88b1-a139c8276e69', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-27 20:27:54.267144', '2024-08-27 20:27:54.267144');
INSERT INTO public.exercise_example_bundles VALUES ('286f93a5-488c-445c-a83b-9f7f594e1a9f', 80, 'e7f390fd-7435-44e1-b354-c62073934c66', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-27 20:29:12.669187', '2024-08-27 20:29:12.669187');
INSERT INTO public.exercise_example_bundles VALUES ('65cd8ab4-5fb8-47ef-ab4c-69ee14f6b74b', 15, 'e7f390fd-7435-44e1-b354-c62073934c66', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-27 20:29:12.669187', '2024-08-27 20:29:12.669187');
INSERT INTO public.exercise_example_bundles VALUES ('396c6aeb-d8a3-4e2d-93bb-a232a59e1eb9', 5, 'e7f390fd-7435-44e1-b354-c62073934c66', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-27 20:29:12.669187', '2024-08-27 20:29:12.669187');
INSERT INTO public.exercise_example_bundles VALUES ('35506cbe-e3e9-40dc-b9ea-f4860277ae16', 80, '7e0566c6-eefb-4992-a673-d19902933c26', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-28 20:36:41.156018', '2024-08-28 20:36:41.156018');
INSERT INTO public.exercise_example_bundles VALUES ('9f0a3f11-df67-4c5b-8cad-0d27c7f88515', 15, '7e0566c6-eefb-4992-a673-d19902933c26', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-28 20:36:41.156018', '2024-08-28 20:36:41.156018');
INSERT INTO public.exercise_example_bundles VALUES ('8032cadc-a816-463a-b641-8c9a1a9b7e7f', 5, '7e0566c6-eefb-4992-a673-d19902933c26', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-28 20:36:41.156018', '2024-08-28 20:36:41.156018');
INSERT INTO public.exercise_example_bundles VALUES ('04ce1d65-c38b-41d6-b147-8443ac574a39', 90, '7fd82f79-1f5f-4bae-8f2d-b94ecae595d5', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-28 20:38:26.227275', '2024-08-28 20:38:26.227275');
INSERT INTO public.exercise_example_bundles VALUES ('9181bc7c-a816-4a6c-a98f-dd3546ac088e', 7, '7fd82f79-1f5f-4bae-8f2d-b94ecae595d5', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-28 20:38:26.227275', '2024-08-28 20:38:26.227275');
INSERT INTO public.exercise_example_bundles VALUES ('81ac49ef-d773-45d0-b49c-8dfabb43b04a', 3, '7fd82f79-1f5f-4bae-8f2d-b94ecae595d5', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-28 20:38:26.227275', '2024-08-28 20:38:26.227275');
INSERT INTO public.exercise_example_bundles VALUES ('22bffc78-de7c-42c1-8961-1e4d90d0fbc5', 80, '908341ec-de1f-44bd-b84d-74ff8a7162a0', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-28 20:40:22.165845', '2024-08-28 20:40:22.165845');
INSERT INTO public.exercise_example_bundles VALUES ('571a48fc-5925-4f15-8dfc-e213be2f1f10', 15, '908341ec-de1f-44bd-b84d-74ff8a7162a0', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-28 20:40:22.165845', '2024-08-28 20:40:22.165845');
INSERT INTO public.exercise_example_bundles VALUES ('56d11ef9-22f5-47a2-8f76-d4726626535c', 5, '908341ec-de1f-44bd-b84d-74ff8a7162a0', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-28 20:40:22.165845', '2024-08-28 20:40:22.165845');
INSERT INTO public.exercise_example_bundles VALUES ('fae3fbba-87c1-48b9-a1f5-c413c4f8199d', 85, 'a2736a56-04b3-4437-835e-1e2dc8029c9e', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-28 20:42:25.590465', '2024-08-28 20:42:25.590465');
INSERT INTO public.exercise_example_bundles VALUES ('72b533bf-7ecc-44ef-a3d6-8341e89a57f4', 10, 'a2736a56-04b3-4437-835e-1e2dc8029c9e', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-28 20:42:25.590465', '2024-08-28 20:42:25.590465');
INSERT INTO public.exercise_example_bundles VALUES ('5bbfac84-4013-45a8-9b99-9f2c4bdc9f2a', 5, 'a2736a56-04b3-4437-835e-1e2dc8029c9e', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-28 20:42:25.590465', '2024-08-28 20:42:25.590465');
INSERT INTO public.exercise_example_bundles VALUES ('d6ea6f0f-7ebd-4227-b328-5163f5d3b37c', 85, 'da809d98-950b-4ca0-a71b-c67d21fd66da', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-28 20:44:17.61958', '2024-08-28 20:44:17.61958');
INSERT INTO public.exercise_example_bundles VALUES ('26369c9c-9bd0-480b-aa2d-99d56c2ba5ce', 10, 'da809d98-950b-4ca0-a71b-c67d21fd66da', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-28 20:44:17.61958', '2024-08-28 20:44:17.61958');
INSERT INTO public.exercise_example_bundles VALUES ('8019eac5-d12c-4517-9543-d75c3533648d', 5, 'da809d98-950b-4ca0-a71b-c67d21fd66da', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-28 20:44:17.61958', '2024-08-28 20:44:17.61958');
INSERT INTO public.exercise_example_bundles VALUES ('8ae65297-68ee-407b-a342-29011a79f740', 70, '4de0744d-0a78-4052-aa1b-e5340959d9fe', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-28 20:45:27.519854', '2024-08-28 20:45:27.519854');
INSERT INTO public.exercise_example_bundles VALUES ('8f96b5ae-66e8-43ab-9829-1d3eb4fd2b6c', 25, '4de0744d-0a78-4052-aa1b-e5340959d9fe', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-28 20:45:27.519854', '2024-08-28 20:45:27.519854');
INSERT INTO public.exercise_example_bundles VALUES ('d6255721-a7b1-40f7-9da5-eacf0d50ea55', 5, '4de0744d-0a78-4052-aa1b-e5340959d9fe', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-28 20:45:27.519854', '2024-08-28 20:45:27.519854');
INSERT INTO public.exercise_example_bundles VALUES ('02c75169-d17d-4fda-9966-41f95f97b71a', 85, 'd7abed66-3c4a-490b-91cc-8e714336f9fa', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-28 20:47:16.406993', '2024-08-28 20:47:16.406993');
INSERT INTO public.exercise_example_bundles VALUES ('b8b6c1e7-2ca5-4cda-b338-77aa5f06a990', 10, 'd7abed66-3c4a-490b-91cc-8e714336f9fa', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-28 20:47:16.406993', '2024-08-28 20:47:16.406993');
INSERT INTO public.exercise_example_bundles VALUES ('72814fea-17fb-4f97-b4d4-cd75406e06b6', 5, 'd7abed66-3c4a-490b-91cc-8e714336f9fa', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-28 20:47:16.406993', '2024-08-28 20:47:16.406993');
INSERT INTO public.exercise_example_bundles VALUES ('2da5ef47-51fc-47f2-9581-c3359b7bb7a2', 80, 'cfd086be-f452-4f1d-b0cc-3988d677a8b4', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-28 20:48:17.215743', '2024-08-28 20:48:17.215743');
INSERT INTO public.exercise_example_bundles VALUES ('c4156439-cf72-4c0e-913a-c1c301963353', 15, 'cfd086be-f452-4f1d-b0cc-3988d677a8b4', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-28 20:48:17.215743', '2024-08-28 20:48:17.215743');
INSERT INTO public.exercise_example_bundles VALUES ('bdf0c0fd-f77e-4dc9-9ae6-9c232684de1f', 5, 'cfd086be-f452-4f1d-b0cc-3988d677a8b4', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-28 20:48:17.215743', '2024-08-28 20:48:17.215743');
INSERT INTO public.exercise_example_bundles VALUES ('59f803eb-ec03-4710-b533-2f85e4a6a304', 80, '8508cffc-1df6-4db2-9447-3bafd74a1325', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-28 20:50:28.799487', '2024-08-28 20:50:28.799487');
INSERT INTO public.exercise_example_bundles VALUES ('8491b0e5-ef25-4e6c-a0e0-3e83a666b5cb', 15, '8508cffc-1df6-4db2-9447-3bafd74a1325', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-28 20:50:28.799487', '2024-08-28 20:50:28.799487');
INSERT INTO public.exercise_example_bundles VALUES ('eaf9958f-405d-4f53-b955-0cbc5eaa3a31', 5, '8508cffc-1df6-4db2-9447-3bafd74a1325', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-28 20:50:28.799487', '2024-08-28 20:50:28.799487');
INSERT INTO public.exercise_example_bundles VALUES ('7690f0ab-a01d-4d0a-b69d-362d8f09649d', 85, '4f1c3655-21e7-4225-a39e-944774f59f76', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-28 20:51:35.460372', '2024-08-28 20:51:35.460372');
INSERT INTO public.exercise_example_bundles VALUES ('e246a056-0fd4-4125-b4ca-344ffb2563bf', 10, '4f1c3655-21e7-4225-a39e-944774f59f76', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-28 20:51:35.460372', '2024-08-28 20:51:35.460372');
INSERT INTO public.exercise_example_bundles VALUES ('8e0973e3-0225-435d-a3da-af33ab7caf6a', 5, '4f1c3655-21e7-4225-a39e-944774f59f76', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-28 20:51:35.460372', '2024-08-28 20:51:35.460372');
INSERT INTO public.exercise_example_bundles VALUES ('8c8d6212-2996-468e-b70c-b3cdfd8283ac', 85, '6d5dc164-3c35-4719-85f1-5c75558f0125', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-28 20:53:42.341484', '2024-08-28 20:53:42.341484');
INSERT INTO public.exercise_example_bundles VALUES ('32048a96-d0f0-4e0d-96c9-75d8250e936e', 10, '6d5dc164-3c35-4719-85f1-5c75558f0125', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-28 20:53:42.341484', '2024-08-28 20:53:42.341484');
INSERT INTO public.exercise_example_bundles VALUES ('d801e688-0f42-4ada-93ac-7c66dc1cdc5f', 5, '6d5dc164-3c35-4719-85f1-5c75558f0125', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-28 20:53:42.341484', '2024-08-28 20:53:42.341484');
INSERT INTO public.exercise_example_bundles VALUES ('9d64ae39-0a2d-4a36-b25b-c0491ef07f09', 85, 'cebf4622-c0a9-4759-a070-48c7556da67d', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-28 20:55:59.978276', '2024-08-28 20:55:59.978276');
INSERT INTO public.exercise_example_bundles VALUES ('f66eca64-85ac-480c-859c-a7a202f80c40', 10, 'cebf4622-c0a9-4759-a070-48c7556da67d', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-28 20:55:59.978276', '2024-08-28 20:55:59.978276');
INSERT INTO public.exercise_example_bundles VALUES ('3e6d0801-0f61-4122-a443-f63a54d96c95', 5, 'cebf4622-c0a9-4759-a070-48c7556da67d', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-28 20:55:59.978276', '2024-08-28 20:55:59.978276');
INSERT INTO public.exercise_example_bundles VALUES ('7ddb43ad-2bf4-4ee9-9d26-64e8ca647021', 85, '4d72c2f1-2c10-45a3-9f5e-1f04012c0681', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-28 20:59:16.612181', '2024-08-28 20:59:16.612181');
INSERT INTO public.exercise_example_bundles VALUES ('0f34d7e9-633f-4e54-bc21-578803be3f6c', 10, '4d72c2f1-2c10-45a3-9f5e-1f04012c0681', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-28 20:59:16.612181', '2024-08-28 20:59:16.612181');
INSERT INTO public.exercise_example_bundles VALUES ('e94558cd-0108-4393-9138-cc6ca0e91980', 5, '4d72c2f1-2c10-45a3-9f5e-1f04012c0681', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-28 20:59:16.612181', '2024-08-28 20:59:16.612181');
INSERT INTO public.exercise_example_bundles VALUES ('0a92235f-d91e-4199-aa57-5cef5fc3aa44', 85, 'af39600b-6fc5-435a-a5f8-a1d0a9994030', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-28 21:00:57.792071', '2024-08-28 21:00:57.792071');
INSERT INTO public.exercise_example_bundles VALUES ('1bf2ea8e-a838-4bf6-9eb5-3eb4c517da3c', 10, 'af39600b-6fc5-435a-a5f8-a1d0a9994030', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-28 21:00:57.792071', '2024-08-28 21:00:57.792071');
INSERT INTO public.exercise_example_bundles VALUES ('8c8bacba-acf6-4e00-ab5b-a25cc233ca17', 5, 'af39600b-6fc5-435a-a5f8-a1d0a9994030', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-28 21:00:57.792071', '2024-08-28 21:00:57.792071');
INSERT INTO public.exercise_example_bundles VALUES ('9788a05d-36bf-4d3c-af1d-782a0eb747c8', 80, '101f365e-5c84-438a-84b4-c8e798bd0aff', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-28 21:02:48.210751', '2024-08-28 21:02:48.210751');
INSERT INTO public.exercise_example_bundles VALUES ('f2ccb77e-cb64-4aec-abd2-84ecc00b7ab5', 15, '101f365e-5c84-438a-84b4-c8e798bd0aff', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-28 21:02:48.210751', '2024-08-28 21:02:48.210751');
INSERT INTO public.exercise_example_bundles VALUES ('f1576c2f-d0c8-4ab3-a11c-99543570cf1c', 5, '101f365e-5c84-438a-84b4-c8e798bd0aff', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-28 21:02:48.210751', '2024-08-28 21:02:48.210751');
INSERT INTO public.exercise_example_bundles VALUES ('ddc0e6cb-ee1f-44fe-81dc-35410fc4c0d6', 80, '1f28edb2-29ae-467c-ad11-310c3f656fe2', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-28 21:04:44.322521', '2024-08-28 21:04:44.322521');
INSERT INTO public.exercise_example_bundles VALUES ('effbbeea-0fd3-4f82-a987-adc1ffc43554', 15, '1f28edb2-29ae-467c-ad11-310c3f656fe2', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-28 21:04:44.322521', '2024-08-28 21:04:44.322521');
INSERT INTO public.exercise_example_bundles VALUES ('f2b36da1-f603-4a55-af44-f6b39032b5f0', 5, '1f28edb2-29ae-467c-ad11-310c3f656fe2', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-28 21:04:44.322521', '2024-08-28 21:04:44.322521');
INSERT INTO public.exercise_example_bundles VALUES ('9540c901-4f6e-47a6-88c9-8ea560256cd2', 85, '04a13a1c-de2b-46f4-be62-3fa6b4655d0d', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-28 21:07:18.65042', '2024-08-28 21:07:18.65042');
INSERT INTO public.exercise_example_bundles VALUES ('8c9bf94b-f741-457a-aeac-bf818fd5f718', 10, '04a13a1c-de2b-46f4-be62-3fa6b4655d0d', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-28 21:07:18.65042', '2024-08-28 21:07:18.65042');
INSERT INTO public.exercise_example_bundles VALUES ('631957e2-6c5f-49a5-83d5-09d6f86ec463', 5, '04a13a1c-de2b-46f4-be62-3fa6b4655d0d', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-28 21:07:18.65042', '2024-08-28 21:07:18.65042');
INSERT INTO public.exercise_example_bundles VALUES ('4cc17443-d7c3-4c36-8d9e-ecd3dc543382', 85, 'a9545ccb-3ec7-4646-95c9-f3a708d0d968', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-28 21:08:56.496251', '2024-08-28 21:08:56.496251');
INSERT INTO public.exercise_example_bundles VALUES ('74095fef-97e6-4916-bf1e-d703ea4cb8e9', 10, 'a9545ccb-3ec7-4646-95c9-f3a708d0d968', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-28 21:08:56.496251', '2024-08-28 21:08:56.496251');
INSERT INTO public.exercise_example_bundles VALUES ('059e32e7-5719-460b-bcb6-38aa5024e8d9', 5, 'a9545ccb-3ec7-4646-95c9-f3a708d0d968', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-28 21:08:56.496251', '2024-08-28 21:08:56.496251');
INSERT INTO public.exercise_example_bundles VALUES ('de8d2675-d4b6-4bb0-a1d1-890af84cdb6e', 85, 'b99df7e8-eb44-4be1-be81-701347580781', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-28 21:11:35.040483', '2024-08-28 21:11:35.040483');
INSERT INTO public.exercise_example_bundles VALUES ('01ce0a2c-8cb9-4542-9240-1e901564e901', 10, 'b99df7e8-eb44-4be1-be81-701347580781', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-28 21:11:35.040483', '2024-08-28 21:11:35.040483');
INSERT INTO public.exercise_example_bundles VALUES ('bdbb9c39-070c-4847-a2ab-977959c11119', 5, 'b99df7e8-eb44-4be1-be81-701347580781', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-28 21:11:35.040483', '2024-08-28 21:11:35.040483');
INSERT INTO public.exercise_example_bundles VALUES ('7f67c08f-1397-41d3-b294-6f306aed2f30', 85, '8d2a9df4-af32-4943-b74b-ae901e866b32', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-28 21:12:39.510696', '2024-08-28 21:12:39.510696');
INSERT INTO public.exercise_example_bundles VALUES ('2e6b5842-c52d-43d2-acda-67fe18055829', 10, '8d2a9df4-af32-4943-b74b-ae901e866b32', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-28 21:12:39.510696', '2024-08-28 21:12:39.510696');
INSERT INTO public.exercise_example_bundles VALUES ('3bf2065d-b91a-436f-90fa-0ba57755cbb3', 5, '8d2a9df4-af32-4943-b74b-ae901e866b32', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-28 21:12:39.510696', '2024-08-28 21:12:39.510696');
INSERT INTO public.exercise_example_bundles VALUES ('52a0e7d8-4962-4192-9dfb-9f0f5b48ac59', 85, '8ca7bf65-0ddb-4c64-ba64-f71f25c85d7c', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-08-28 21:13:34.07981', '2024-08-28 21:13:34.07981');
INSERT INTO public.exercise_example_bundles VALUES ('121f3152-c07b-44cc-b7f3-ef38e2b31c5d', 10, '8ca7bf65-0ddb-4c64-ba64-f71f25c85d7c', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-08-28 21:13:34.07981', '2024-08-28 21:13:34.07981');
INSERT INTO public.exercise_example_bundles VALUES ('8ae3652b-8d1e-4eac-9b91-9026dbf38473', 5, '8ca7bf65-0ddb-4c64-ba64-f71f25c85d7c', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-28 21:13:34.07981', '2024-08-28 21:13:34.07981');
INSERT INTO public.exercise_example_bundles VALUES ('35d1707b-aa87-43b3-a320-752801d2a79e', 85, '12221e5c-0208-48fc-8c56-62c266932f74', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-08-29 15:15:51.730675', '2024-08-29 15:15:51.730675');
INSERT INTO public.exercise_example_bundles VALUES ('46c80286-6bff-4f69-851b-910d2369a1d6', 10, '12221e5c-0208-48fc-8c56-62c266932f74', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-29 15:15:51.730675', '2024-08-29 15:15:51.730675');
INSERT INTO public.exercise_example_bundles VALUES ('50486b86-ebd4-4b4c-9280-8411cdc4715e', 5, '12221e5c-0208-48fc-8c56-62c266932f74', '97136fa7-622a-49d6-9d09-403a631d253d', '2024-08-29 15:15:51.730675', '2024-08-29 15:15:51.730675');
INSERT INTO public.exercise_example_bundles VALUES ('0da7deec-6af4-4e4a-a41d-110faa0c4576', 65, '1959abd3-4ab1-42d4-b7e2-45693b899d51', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-08-29 15:18:06.541035', '2024-08-29 15:18:06.541035');
INSERT INTO public.exercise_example_bundles VALUES ('67e88933-f17e-4044-bf29-07ce3bff2a16', 15, '1959abd3-4ab1-42d4-b7e2-45693b899d51', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-29 15:18:06.541035', '2024-08-29 15:18:06.541035');
INSERT INTO public.exercise_example_bundles VALUES ('298c95e6-0f7b-49a3-a70f-183a2e983c62', 10, '1959abd3-4ab1-42d4-b7e2-45693b899d51', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-29 15:18:06.541035', '2024-08-29 15:18:06.541035');
INSERT INTO public.exercise_example_bundles VALUES ('16e8e5fe-f74b-49aa-ba6b-f882b6404f90', 65, '4a2c7160-6cf2-456d-8ef4-80040b720420', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-06 11:18:17.204717', '2024-09-06 11:18:17.204717');
INSERT INTO public.exercise_example_bundles VALUES ('033d08b2-7d9d-42e2-aaf1-0bfe73fe9645', 5, '1959abd3-4ab1-42d4-b7e2-45693b899d51', '57559b71-b757-468a-983d-a1b3cec4acef', '2024-08-29 15:18:06.541035', '2024-08-29 15:18:06.541035');
INSERT INTO public.exercise_example_bundles VALUES ('e9794145-8423-4dc7-9582-24fc055ce404', 65, '48191b99-06fa-4218-b61b-c9b9abd73278', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-08-29 15:20:32.339592', '2024-08-29 15:20:32.339592');
INSERT INTO public.exercise_example_bundles VALUES ('2de49805-defb-4a66-9797-b3988ab9598a', 15, '48191b99-06fa-4218-b61b-c9b9abd73278', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-29 15:20:32.339592', '2024-08-29 15:20:32.339592');
INSERT INTO public.exercise_example_bundles VALUES ('705d2863-3dc4-4bfd-ab14-ad96b598c0ee', 15, '48191b99-06fa-4218-b61b-c9b9abd73278', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-29 15:20:32.339592', '2024-08-29 15:20:32.339592');
INSERT INTO public.exercise_example_bundles VALUES ('0e984e66-44a9-4e21-8b0e-0040f3558121', 15, '4a2c7160-6cf2-456d-8ef4-80040b720420', 'be38dcef-1bc8-487b-a44f-96df1ab9e68c', '2024-09-06 11:18:17.204717', '2024-09-06 11:18:17.204717');
INSERT INTO public.exercise_example_bundles VALUES ('4e86593f-e6d9-435f-8f86-8383d4a953c9', 70, '92d77415-1f9a-430b-ba52-0a09ec07b3a1', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-08-29 15:21:42.163608', '2024-08-29 15:21:42.163608');
INSERT INTO public.exercise_example_bundles VALUES ('f24f55d1-01e8-4e27-a61f-c4097fb3c8cb', 15, '92d77415-1f9a-430b-ba52-0a09ec07b3a1', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-29 15:21:42.163608', '2024-08-29 15:21:42.163608');
INSERT INTO public.exercise_example_bundles VALUES ('2509772e-d8c9-475b-9fdc-d59578f9b428', 15, '92d77415-1f9a-430b-ba52-0a09ec07b3a1', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-29 15:21:42.163608', '2024-08-29 15:21:42.163608');
INSERT INTO public.exercise_example_bundles VALUES ('996ebef3-4e0e-4b2b-ac23-9b83dd52c1c4', 70, '816440ad-f8f2-4ef7-a11f-b6a2bd63fcef', '97136fa7-622a-49d6-9d09-403a631d253d', '2024-08-29 15:23:10.34105', '2024-08-29 15:23:10.34105');
INSERT INTO public.exercise_example_bundles VALUES ('ad8b3548-69ec-4f2a-8d80-a26ea452258e', 10, '4a2c7160-6cf2-456d-8ef4-80040b720420', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-06 11:18:17.204717', '2024-09-06 11:18:17.204717');
INSERT INTO public.exercise_example_bundles VALUES ('f240102b-68d2-4f97-98ba-dec59ac1d7b2', 10, '816440ad-f8f2-4ef7-a11f-b6a2bd63fcef', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-29 15:23:10.34105', '2024-08-29 15:23:10.34105');
INSERT INTO public.exercise_example_bundles VALUES ('9c005217-ecae-4588-bc94-a17b6d256e16', 70, '506d1cc7-529a-42af-b5bf-4c4d0a9aa409', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-08-29 15:24:22.337443', '2024-08-29 15:24:22.337443');
INSERT INTO public.exercise_example_bundles VALUES ('a05478f7-9b9b-4514-b8f7-473a3a3753fd', 15, '506d1cc7-529a-42af-b5bf-4c4d0a9aa409', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-29 15:24:22.337443', '2024-08-29 15:24:22.337443');
INSERT INTO public.exercise_example_bundles VALUES ('39701760-5842-4e25-a670-9de44f4d7bf1', 15, '506d1cc7-529a-42af-b5bf-4c4d0a9aa409', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-29 15:24:22.337443', '2024-08-29 15:24:22.337443');
INSERT INTO public.exercise_example_bundles VALUES ('78474d36-735e-4cfe-935d-216162d59fbe', 70, '9ab8fe00-58de-48c4-942d-b10e8d16f1c1', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-08-29 15:26:45.186356', '2024-08-29 15:26:45.186356');
INSERT INTO public.exercise_example_bundles VALUES ('f8fb1559-f946-4f2e-b8c6-10d92bd45719', 15, '9ab8fe00-58de-48c4-942d-b10e8d16f1c1', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-29 15:26:45.186356', '2024-08-29 15:26:45.186356');
INSERT INTO public.exercise_example_bundles VALUES ('e6f4ebc5-0b4b-4a73-b430-cf6654c97450', 10, '9ab8fe00-58de-48c4-942d-b10e8d16f1c1', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-29 15:26:45.186356', '2024-08-29 15:26:45.186356');
INSERT INTO public.exercise_example_bundles VALUES ('8baba903-12c2-4d7f-8f0b-7e29c710dfdf', 70, '3d6e76b5-b409-4f5b-bba4-c22cb10cfbd4', '97136fa7-622a-49d6-9d09-403a631d253d', '2024-08-29 15:28:20.98104', '2024-08-29 15:28:20.98104');
INSERT INTO public.exercise_example_bundles VALUES ('5d3f7ec4-0cea-43e2-9759-3541ff71716d', 10, '3d6e76b5-b409-4f5b-bba4-c22cb10cfbd4', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-29 15:28:20.98104', '2024-08-29 15:28:20.98104');
INSERT INTO public.exercise_example_bundles VALUES ('a0d71ab1-ffc9-44a9-b058-bed5d2c3a18e', 85, '77aa5752-a586-4dfe-b69d-4da16fff0b79', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-08-29 15:30:57.606742', '2024-08-29 15:30:57.606742');
INSERT INTO public.exercise_example_bundles VALUES ('186ba70a-7eac-43e4-8dbd-aaefeefa2921', 10, '77aa5752-a586-4dfe-b69d-4da16fff0b79', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-29 15:30:57.606742', '2024-08-29 15:30:57.606742');
INSERT INTO public.exercise_example_bundles VALUES ('f834bc81-45b6-47fd-bb54-2a6435dc400e', 5, '77aa5752-a586-4dfe-b69d-4da16fff0b79', '97136fa7-622a-49d6-9d09-403a631d253d', '2024-08-29 15:30:57.606742', '2024-08-29 15:30:57.606742');
INSERT INTO public.exercise_example_bundles VALUES ('8bbcb4b4-a8b1-492f-bdb6-d4674bea4ff5', 70, '4035dfef-3cc6-4a15-a97f-c167bd274d02', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-08-29 15:34:32.570508', '2024-08-29 15:34:32.570508');
INSERT INTO public.exercise_example_bundles VALUES ('1624cc25-90f3-463c-8f09-e6abe7b598fd', 15, '4035dfef-3cc6-4a15-a97f-c167bd274d02', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-29 15:34:32.570508', '2024-08-29 15:34:32.570508');
INSERT INTO public.exercise_example_bundles VALUES ('f5f95f04-8afc-4bf4-95d2-e37b6bc9c254', 10, '4035dfef-3cc6-4a15-a97f-c167bd274d02', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-29 15:34:32.570508', '2024-08-29 15:34:32.570508');
INSERT INTO public.exercise_example_bundles VALUES ('baf0c79a-5c3a-4f8c-816a-eed36d2b6722', 60, 'aada0f37-1f30-4d61-a284-8003027bc871', '97136fa7-622a-49d6-9d09-403a631d253d', '2024-08-29 20:14:43.144259', '2024-08-29 20:14:43.144259');
INSERT INTO public.exercise_example_bundles VALUES ('cbf0c97b-87f3-4e43-bd24-1eab52a07b09', 15, 'aada0f37-1f30-4d61-a284-8003027bc871', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-08-29 20:14:43.144259', '2024-08-29 20:14:43.144259');
INSERT INTO public.exercise_example_bundles VALUES ('c4cd69f4-952e-4252-a230-40c898157d69', 60, 'afd7f719-5789-48a0-a5d9-77e9cb1669bb', '97136fa7-622a-49d6-9d09-403a631d253d', '2024-08-29 20:16:07.195713', '2024-08-29 20:16:07.195713');
INSERT INTO public.exercise_example_bundles VALUES ('35f7b0bc-cd7a-4212-8711-34d59cec57a7', 15, 'afd7f719-5789-48a0-a5d9-77e9cb1669bb', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-08-29 20:16:07.195713', '2024-08-29 20:16:07.195713');
INSERT INTO public.exercise_example_bundles VALUES ('08cfc3f2-c523-4530-9b62-978405f4d186', 70, '16ba69dc-e99d-4a71-bbcb-0f3ce096a9d9', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-08-29 20:17:41.63891', '2024-08-29 20:17:41.63891');
INSERT INTO public.exercise_example_bundles VALUES ('c05764b0-06cb-45c8-b1e6-45a7e028eec1', 15, '16ba69dc-e99d-4a71-bbcb-0f3ce096a9d9', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-29 20:17:41.63891', '2024-08-29 20:17:41.63891');
INSERT INTO public.exercise_example_bundles VALUES ('24bcb630-9149-45f6-9672-5ab33892d7b5', 10, '16ba69dc-e99d-4a71-bbcb-0f3ce096a9d9', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-29 20:17:41.63891', '2024-08-29 20:17:41.63891');
INSERT INTO public.exercise_example_bundles VALUES ('1da6f04d-13df-4d65-a7fd-281a50c0e732', 75, '3a70ce9c-b1f0-43a7-8775-7d3e7c109c5d', '97136fa7-622a-49d6-9d09-403a631d253d', '2024-08-29 20:18:52.139204', '2024-08-29 20:18:52.139204');
INSERT INTO public.exercise_example_bundles VALUES ('e5ab98fc-3b8d-46c6-a3f0-716e5bb5bcc3', 85, '4353173b-93b2-4fb1-b462-fc8330b15ce5', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-08-29 20:20:58.538331', '2024-08-29 20:20:58.538331');
INSERT INTO public.exercise_example_bundles VALUES ('8b66e798-34af-4619-ac4c-2f92c35fcbf5', 15, '4353173b-93b2-4fb1-b462-fc8330b15ce5', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-29 20:20:58.538331', '2024-08-29 20:20:58.538331');
INSERT INTO public.exercise_example_bundles VALUES ('19642115-011c-498a-9c16-929cf39df0b4', 80, '1b8fe6fc-9ede-4f28-b4a0-30504db61fed', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-08-29 20:26:45.600818', '2024-08-29 20:26:45.600818');
INSERT INTO public.exercise_example_bundles VALUES ('4e34e6e0-acb2-4693-9523-09ecac106c8d', 10, '1b8fe6fc-9ede-4f28-b4a0-30504db61fed', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-29 20:26:45.600818', '2024-08-29 20:26:45.600818');
INSERT INTO public.exercise_example_bundles VALUES ('c2a59210-7416-489f-8b30-ce4642d41e19', 65, '90b8d661-a9ef-47e5-8c98-b0599874a972', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-08-29 20:28:36.088381', '2024-08-29 20:28:36.088381');
INSERT INTO public.exercise_example_bundles VALUES ('2abfee71-b506-41ea-b502-e32795d0d3e5', 20, '90b8d661-a9ef-47e5-8c98-b0599874a972', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-29 20:28:36.088381', '2024-08-29 20:28:36.088381');
INSERT INTO public.exercise_example_bundles VALUES ('65043464-547a-457f-ac99-90035c81e778', 10, '90b8d661-a9ef-47e5-8c98-b0599874a972', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-29 20:28:36.088381', '2024-08-29 20:28:36.088381');
INSERT INTO public.exercise_example_bundles VALUES ('e7f81e4e-2e60-4ba4-8a30-850735b416ff', 85, 'ac45c513-55f3-437f-a10f-ba3c0763a746', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-29 20:31:23.026096', '2024-08-29 20:31:23.026096');
INSERT INTO public.exercise_example_bundles VALUES ('69cfa607-cddb-4635-bb1c-f4a39bf7baa6', 15, 'ac45c513-55f3-437f-a10f-ba3c0763a746', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-08-29 20:31:23.026096', '2024-08-29 20:31:23.026096');
INSERT INTO public.exercise_example_bundles VALUES ('0ca31014-7d80-4f94-974c-8907ab49cd66', 25, '3a70ce9c-b1f0-43a7-8775-7d3e7c109c5d', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-08-29 20:18:52.139204', '2024-08-29 20:18:52.139204');
INSERT INTO public.exercise_example_bundles VALUES ('14390b19-58d5-4baa-bfe1-1545a83dcee6', 25, 'aada0f37-1f30-4d61-a284-8003027bc871', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-08-29 20:14:43.144259', '2024-08-29 20:14:43.144259');
INSERT INTO public.exercise_example_bundles VALUES ('c2f13f0a-8685-405e-a687-8f88f9c67358', 10, '1b8fe6fc-9ede-4f28-b4a0-30504db61fed', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-08-29 20:26:45.600818', '2024-08-29 20:26:45.600818');
INSERT INTO public.exercise_example_bundles VALUES ('c84d35b2-b004-4603-b40f-c10fa3f6f34e', 5, '16ba69dc-e99d-4a71-bbcb-0f3ce096a9d9', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-08-29 20:17:41.63891', '2024-08-29 20:17:41.63891');
INSERT INTO public.exercise_example_bundles VALUES ('9c7f4c7e-622b-4780-b9fb-d63085f63e01', 20, '816440ad-f8f2-4ef7-a11f-b6a2bd63fcef', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-08-29 15:23:10.34105', '2024-08-29 15:23:10.34105');
INSERT INTO public.exercise_example_bundles VALUES ('5a0929d3-3ca3-4199-8650-733c33edff75', 20, '3d6e76b5-b409-4f5b-bba4-c22cb10cfbd4', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-08-29 15:28:20.98104', '2024-08-29 15:28:20.98104');
INSERT INTO public.exercise_example_bundles VALUES ('2e773854-1c03-4979-990e-5f99034b712f', 25, 'afd7f719-5789-48a0-a5d9-77e9cb1669bb', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-08-29 20:16:07.195713', '2024-08-29 20:16:07.195713');
INSERT INTO public.exercise_example_bundles VALUES ('7d31886d-671b-435c-911c-0a7eeb1b06ae', 5, '9ab8fe00-58de-48c4-942d-b10e8d16f1c1', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-08-29 15:26:45.186356', '2024-08-29 15:26:45.186356');
INSERT INTO public.exercise_example_bundles VALUES ('d788b68a-eb98-4bc0-b79f-8b6453326295', 5, '1959abd3-4ab1-42d4-b7e2-45693b899d51', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-08-29 15:18:06.541035', '2024-08-29 15:18:06.541035');
INSERT INTO public.exercise_example_bundles VALUES ('f9378064-767c-4923-91f7-9e262029841b', 5, '90b8d661-a9ef-47e5-8c98-b0599874a972', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-08-29 20:28:36.088381', '2024-08-29 20:28:36.088381');
INSERT INTO public.exercise_example_bundles VALUES ('70288cb4-32bf-49ac-b370-c8a11609ee49', 5, '4035dfef-3cc6-4a15-a97f-c167bd274d02', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-08-29 15:34:32.570508', '2024-08-29 15:34:32.570508');
INSERT INTO public.exercise_example_bundles VALUES ('1dd0c1ca-e7bb-4806-ac66-e924c4bd41c1', 5, '48191b99-06fa-4218-b61b-c9b9abd73278', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-08-29 15:20:32.339592', '2024-08-29 15:20:32.339592');
INSERT INTO public.exercise_example_bundles VALUES ('d30434cf-f748-4299-af46-65f7300e4390', 90, '3a41edcb-2c19-4d06-9585-8fe745aba723', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-08-29 20:34:53.748206', '2024-08-29 20:34:53.748206');
INSERT INTO public.exercise_example_bundles VALUES ('7300f52e-1789-4649-8f38-d8c8006be688', 10, '3a41edcb-2c19-4d06-9585-8fe745aba723', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-29 20:34:53.748206', '2024-08-29 20:34:53.748206');
INSERT INTO public.exercise_example_bundles VALUES ('e86dab08-8334-4690-8652-1c6fe128cf5f', 80, 'b8fa1238-0f58-4daa-ade8-0f8c6fa2d1b1', '97136fa7-622a-49d6-9d09-403a631d253d', '2024-08-29 20:37:21.061386', '2024-08-29 20:37:21.061386');
INSERT INTO public.exercise_example_bundles VALUES ('89ef302e-7b77-49e8-be04-0e3062b5c166', 10, 'b8fa1238-0f58-4daa-ade8-0f8c6fa2d1b1', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-08-29 20:37:21.061386', '2024-08-29 20:37:21.061386');
INSERT INTO public.exercise_example_bundles VALUES ('89a7929f-d43e-4ecc-8b29-ef6f8688304d', 10, 'b8fa1238-0f58-4daa-ade8-0f8c6fa2d1b1', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-29 20:37:21.061386', '2024-08-29 20:37:21.061386');
INSERT INTO public.exercise_example_bundles VALUES ('e08096ec-27f0-4478-bb9e-853bf4b7b07e', 70, 'ed5db0ac-4343-4e68-a884-d5f84e4020c1', '97136fa7-622a-49d6-9d09-403a631d253d', '2024-08-29 20:46:11.388752', '2024-08-29 20:46:11.388752');
INSERT INTO public.exercise_example_bundles VALUES ('70ff85e6-3839-408c-b9c5-d0860f1a8bf0', 30, 'ed5db0ac-4343-4e68-a884-d5f84e4020c1', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-08-29 20:46:11.388752', '2024-08-29 20:46:11.388752');
INSERT INTO public.exercise_example_bundles VALUES ('b435bc67-d0b8-402f-a16f-95460d4555ca', 60, 'd20646b6-efd1-49fc-8ffa-180461aea5ab', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-08-29 20:48:13.154841', '2024-08-29 20:48:13.154841');
INSERT INTO public.exercise_example_bundles VALUES ('c2864939-77db-47b7-b077-3b3a34d53ef3', 40, 'd20646b6-efd1-49fc-8ffa-180461aea5ab', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-08-29 20:48:13.154841', '2024-08-29 20:48:13.154841');
INSERT INTO public.exercise_example_bundles VALUES ('40f232e4-b484-4a7b-8d16-42e8e8ed9883', 50, '1f8abb63-8024-46ca-ac1e-2574a839eed6', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-08-29 20:49:40.17922', '2024-08-29 20:49:40.17922');
INSERT INTO public.exercise_example_bundles VALUES ('25c4d749-d403-4741-8783-ab5664b044d8', 20, '1f8abb63-8024-46ca-ac1e-2574a839eed6', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-08-29 20:49:40.17922', '2024-08-29 20:49:40.17922');
INSERT INTO public.exercise_example_bundles VALUES ('4abedc47-6928-4e31-a8f8-0bb31b217230', 20, '1f8abb63-8024-46ca-ac1e-2574a839eed6', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-29 20:49:40.17922', '2024-08-29 20:49:40.17922');
INSERT INTO public.exercise_example_bundles VALUES ('66fb7482-1a5f-4bbc-9249-25270b1c0a91', 10, '1f8abb63-8024-46ca-ac1e-2574a839eed6', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-08-29 20:49:40.17922', '2024-08-29 20:49:40.17922');
INSERT INTO public.exercise_example_bundles VALUES ('501f29fb-afeb-4544-8562-bb19cc2c958b', 60, 'b22e5ada-86c1-4104-828b-b7e06a7f5d16', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-08-29 20:52:10.207849', '2024-08-29 20:52:10.207849');
INSERT INTO public.exercise_example_bundles VALUES ('9d034650-7110-4fae-8c78-238edf390402', 20, 'b22e5ada-86c1-4104-828b-b7e06a7f5d16', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-08-29 20:52:10.207849', '2024-08-29 20:52:10.207849');
INSERT INTO public.exercise_example_bundles VALUES ('dda329ff-1aee-42bf-9006-70d3155e9505', 20, 'b22e5ada-86c1-4104-828b-b7e06a7f5d16', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-29 20:52:10.207849', '2024-08-29 20:52:10.207849');
INSERT INTO public.exercise_example_bundles VALUES ('85059bcb-312a-45ea-a5c0-1bbeb200af13', 85, '7a933584-128c-4b82-8e5b-5e7312cadfdf', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-29 20:55:27.355761', '2024-08-29 20:55:27.355761');
INSERT INTO public.exercise_example_bundles VALUES ('d71c0a45-f49c-41cf-9782-adc7229b97ed', 15, '7a933584-128c-4b82-8e5b-5e7312cadfdf', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-08-29 20:55:27.355761', '2024-08-29 20:55:27.355761');
INSERT INTO public.exercise_example_bundles VALUES ('0ebfceaa-eddc-40b6-9b56-808df984e027', 80, '984e5dac-f3a8-4980-bfc9-da370cf45e46', '97136fa7-622a-49d6-9d09-403a631d253d', '2024-08-29 20:58:25.071017', '2024-08-29 20:58:25.071017');
INSERT INTO public.exercise_example_bundles VALUES ('e50f6ac0-717d-46bd-9131-ee0f408ff106', 15, '984e5dac-f3a8-4980-bfc9-da370cf45e46', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-08-29 20:58:25.071017', '2024-08-29 20:58:25.071017');
INSERT INTO public.exercise_example_bundles VALUES ('110189dd-0cb4-4230-be89-48b44bdc9b1f', 5, '984e5dac-f3a8-4980-bfc9-da370cf45e46', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-08-29 20:58:25.071017', '2024-08-29 20:58:25.071017');
INSERT INTO public.exercise_example_bundles VALUES ('2fa55741-9045-4328-b9e1-2e165aa86388', 80, 'ff188494-a871-4721-9d1e-26742539080c', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-29 21:01:10.94488', '2024-08-29 21:01:10.94488');
INSERT INTO public.exercise_example_bundles VALUES ('39ef207e-5b1f-4225-b2ba-cdd05ec9b599', 20, 'ff188494-a871-4721-9d1e-26742539080c', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-08-29 21:01:10.94488', '2024-08-29 21:01:10.94488');
INSERT INTO public.exercise_example_bundles VALUES ('35979c85-f21c-4888-aa66-77d1b8dd64e5', 90, '68381c41-b015-4218-93cb-2bcb64bee255', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-08-29 21:09:08.316316', '2024-08-29 21:09:08.316316');
INSERT INTO public.exercise_example_bundles VALUES ('2e7a9a9f-ba5c-4125-9672-e4215bf74fd9', 10, '68381c41-b015-4218-93cb-2bcb64bee255', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-08-29 21:09:08.316316', '2024-08-29 21:09:08.316316');
INSERT INTO public.exercise_example_bundles VALUES ('665193ee-22d3-4acb-aad1-b1fae2c92e8b', 60, '1fdffa53-d9cb-4aa1-9999-5c83fdb9be80', 'ab1dbd50-83a4-42c7-a3cd-da1784818ec8', '2024-08-31 21:55:50.622209', '2024-08-31 21:55:50.622209');
INSERT INTO public.exercise_example_bundles VALUES ('5f289087-6c8e-46c5-a9ac-d4fb7008a3d9', 20, '1fdffa53-d9cb-4aa1-9999-5c83fdb9be80', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-08-31 21:55:50.622209', '2024-08-31 21:55:50.622209');
INSERT INTO public.exercise_example_bundles VALUES ('293682af-45cb-43e1-815c-3c5f1f8906bc', 10, '1fdffa53-d9cb-4aa1-9999-5c83fdb9be80', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-08-31 21:55:50.622209', '2024-08-31 21:55:50.622209');
INSERT INTO public.exercise_example_bundles VALUES ('3a4ad59f-8a2f-4fae-a118-67c7083b714c', 10, '1fdffa53-d9cb-4aa1-9999-5c83fdb9be80', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-08-31 21:55:50.622209', '2024-08-31 21:55:50.622209');
INSERT INTO public.exercise_example_bundles VALUES ('9609ba95-2643-41ac-8351-8d5785904940', 60, 'a8f9abc7-4515-4f5e-a4f5-095b1b17b9e1', 'fa8025e6-e106-475c-8b9d-77831132fb47', '2024-08-31 22:01:53.336411', '2024-08-31 22:01:53.336411');
INSERT INTO public.exercise_example_bundles VALUES ('42b3c5ca-b989-4eb6-8d1e-b902adc93ca9', 20, 'a8f9abc7-4515-4f5e-a4f5-095b1b17b9e1', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-08-31 22:01:53.336411', '2024-08-31 22:01:53.336411');
INSERT INTO public.exercise_example_bundles VALUES ('294f3cb7-4c44-44f7-9ed8-dd47342964ec', 10, 'a8f9abc7-4515-4f5e-a4f5-095b1b17b9e1', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-08-31 22:01:53.336411', '2024-08-31 22:01:53.336411');
INSERT INTO public.exercise_example_bundles VALUES ('ce0e8cfc-5814-439c-9148-d28e077e7364', 10, 'a8f9abc7-4515-4f5e-a4f5-095b1b17b9e1', '57559b71-b757-468a-983d-a1b3cec4acef', '2024-08-31 22:01:53.336411', '2024-08-31 22:01:53.336411');
INSERT INTO public.exercise_example_bundles VALUES ('1fe65199-035b-45e9-a8cc-4f9277202974', 80, 'e1361643-e92a-419b-8eb8-fe2a188016e0', '1ddbb748-37a6-4d66-a7d4-4957bdbc647f', '2024-09-01 09:37:56.271231', '2024-09-01 09:37:56.271231');
INSERT INTO public.exercise_example_bundles VALUES ('b6dd1801-a5e0-459f-bc9b-cbeb020ce49b', 20, 'e1361643-e92a-419b-8eb8-fe2a188016e0', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-01 09:37:56.271231', '2024-09-01 09:37:56.271231');
INSERT INTO public.exercise_example_bundles VALUES ('36dd63dc-8238-4308-a189-9b485c28f17d', 80, 'f2cf498f-d991-4b85-b08e-58c5f9ff563e', '1ddbb748-37a6-4d66-a7d4-4957bdbc647f', '2024-09-01 12:11:44.138777', '2024-09-01 12:11:44.138777');
INSERT INTO public.exercise_example_bundles VALUES ('2bb7a1bc-41ee-45c6-8444-19c6b648ba00', 20, 'f2cf498f-d991-4b85-b08e-58c5f9ff563e', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-01 12:11:44.138777', '2024-09-01 12:11:44.138777');
INSERT INTO public.exercise_example_bundles VALUES ('ffe226af-142e-4425-b2d5-3ac97aa42f6c', 100, '7e80becf-491c-4b48-a98a-a36fff26e29c', '1ddbb748-37a6-4d66-a7d4-4957bdbc647f', '2024-09-01 12:13:55.743989', '2024-09-01 12:13:55.743989');
INSERT INTO public.exercise_example_bundles VALUES ('12d800cd-2cd9-4535-8f5b-3dd88276bf5e', 100, '2f49a8e8-6f42-422c-aa6f-c23e215620e2', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-01 12:14:59.685387', '2024-09-01 12:14:59.685387');
INSERT INTO public.exercise_example_bundles VALUES ('548259c5-5325-41ca-9f65-a21ac6f06a4c', 100, 'f2868e11-6e1d-4ce4-a1a8-eb0384a60b71', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-01 12:24:23.20744', '2024-09-01 12:24:23.20744');
INSERT INTO public.exercise_example_bundles VALUES ('5088eca0-7009-4472-a1bd-3d571e47d6d7', 50, '38af9c0d-b19f-433d-bcda-0b974b5475cf', '1ddbb748-37a6-4d66-a7d4-4957bdbc647f', '2024-09-01 12:25:43.164947', '2024-09-01 12:25:43.164947');
INSERT INTO public.exercise_example_bundles VALUES ('927d6f98-b24e-4c02-8506-c5db7e0c5f25', 50, '38af9c0d-b19f-433d-bcda-0b974b5475cf', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-01 12:25:43.164947', '2024-09-01 12:25:43.164947');
INSERT INTO public.exercise_example_bundles VALUES ('77d077c9-aa8f-4b73-b0e3-3e12da245b16', 70, 'c5901a9a-580c-411b-85bd-2ec738123e14', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-01 12:26:49.234868', '2024-09-01 12:26:49.234868');
INSERT INTO public.exercise_example_bundles VALUES ('2d0e3632-b9f6-447b-94c2-6668e08a7a76', 30, 'c5901a9a-580c-411b-85bd-2ec738123e14', '1ddbb748-37a6-4d66-a7d4-4957bdbc647f', '2024-09-01 12:26:49.234868', '2024-09-01 12:26:49.234868');
INSERT INTO public.exercise_example_bundles VALUES ('d2a75a7d-bdc9-4fa0-ac98-6ae9ea2035f5', 100, '6e4bc8b2-33ab-46da-9b79-9fff2266cd27', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-01 12:41:05.649426', '2024-09-01 12:41:05.649426');
INSERT INTO public.exercise_example_bundles VALUES ('bfaefd8c-4a65-46cf-bfd9-2177ab48751b', 100, '01dff88c-893b-4410-8d54-1e36013b9fdb', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-01 12:43:01.528705', '2024-09-01 12:43:01.528705');
INSERT INTO public.exercise_example_bundles VALUES ('24ccb353-afba-48d6-9bc7-6c8543779030', 100, 'd2f28afc-e84c-467c-90d9-c6c2cb63acbc', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-01 12:47:02.024108', '2024-09-01 12:47:02.024108');
INSERT INTO public.exercise_example_bundles VALUES ('a2e80949-83f0-41d4-a092-150735f815c9', 100, 'de4e9652-b068-4558-9fd3-38d45e5aa0d9', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-01 12:49:37.146266', '2024-09-01 12:49:37.146266');
INSERT INTO public.exercise_example_bundles VALUES ('f58132c7-9c38-49e3-b6fa-b43eed443366', 100, '7227c8f6-cf65-4134-97de-d5e64cb5ff1b', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-01 12:51:11.824332', '2024-09-01 12:51:11.824332');
INSERT INTO public.exercise_example_bundles VALUES ('d86c0354-1173-4398-908c-3003125195a1', 100, '46b1efa3-a4f8-4492-a81c-9e48c650dd3d', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-01 12:52:29.683458', '2024-09-01 12:52:29.683458');
INSERT INTO public.exercise_example_bundles VALUES ('1e4d063b-6208-4f84-a757-ac3e792b9744', 100, '89ffca84-73f0-4a69-871f-9d9c96521a05', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-01 12:54:31.266577', '2024-09-01 12:54:31.266577');
INSERT INTO public.exercise_example_bundles VALUES ('217a09cd-b8f8-400e-821f-f5d1f2a7125a', 100, 'f11c8751-e5ca-413e-b30d-2b387ec14733', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-01 12:56:50.697125', '2024-09-01 12:56:50.697125');
INSERT INTO public.exercise_example_bundles VALUES ('ceae5d19-af46-45cb-80f4-75128753a8cf', 100, '9e348a26-e5d0-4ee0-b3e6-fe58563ac698', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-01 13:30:53.579257', '2024-09-01 13:30:53.579257');
INSERT INTO public.exercise_example_bundles VALUES ('cae38e00-b9bc-4d32-9471-8c71d0615c51', 50, '548b3de6-0980-4795-ab86-763c20dbc325', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-09-02 14:01:43.614947', '2024-09-02 14:01:43.614947');
INSERT INTO public.exercise_example_bundles VALUES ('298cdde5-97d3-41d5-8c6a-7dc4412161c3', 10, '548b3de6-0980-4795-ab86-763c20dbc325', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-09-02 14:01:43.614947', '2024-09-02 14:01:43.614947');
INSERT INTO public.exercise_example_bundles VALUES ('3f96732d-12fd-436f-a1d8-7ae09719ae48', 20, '548b3de6-0980-4795-ab86-763c20dbc325', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 14:01:43.614947', '2024-09-02 14:01:43.614947');
INSERT INTO public.exercise_example_bundles VALUES ('a0702d6d-7932-4d63-8fdc-4210d47f35fc', 15, '548b3de6-0980-4795-ab86-763c20dbc325', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-02 14:01:43.614947', '2024-09-02 14:01:43.614947');
INSERT INTO public.exercise_example_bundles VALUES ('1bee524e-4e17-4cde-94bc-e64eb6cf5e6a', 5, '548b3de6-0980-4795-ab86-763c20dbc325', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-09-02 14:01:43.614947', '2024-09-02 14:01:43.614947');
INSERT INTO public.exercise_example_bundles VALUES ('aa5ad2cf-51e5-47ad-9f0d-b461f55de040', 50, '47f00a63-05df-4db7-b2c7-68000c72be9b', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-09-02 14:03:25.455092', '2024-09-02 14:03:25.455092');
INSERT INTO public.exercise_example_bundles VALUES ('c3c18d61-c73d-4994-bc85-806fc28347ea', 20, '47f00a63-05df-4db7-b2c7-68000c72be9b', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-09-02 14:03:25.455092', '2024-09-02 14:03:25.455092');
INSERT INTO public.exercise_example_bundles VALUES ('751e5e28-a612-4f2c-9b87-afa94faae500', 15, '47f00a63-05df-4db7-b2c7-68000c72be9b', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 14:03:25.455092', '2024-09-02 14:03:25.455092');
INSERT INTO public.exercise_example_bundles VALUES ('7cd9c8cf-281b-45d5-bc21-baeee0b34c62', 10, '47f00a63-05df-4db7-b2c7-68000c72be9b', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-02 14:03:25.455092', '2024-09-02 14:03:25.455092');
INSERT INTO public.exercise_example_bundles VALUES ('d452fdb2-8103-49f6-b033-f813c5b7dbe0', 5, '47f00a63-05df-4db7-b2c7-68000c72be9b', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-09-02 14:03:25.455092', '2024-09-02 14:03:25.455092');
INSERT INTO public.exercise_example_bundles VALUES ('495e63ea-ebbc-4063-866b-565281dfe9ce', 40, 'c0a055b2-daf6-4ecc-b97b-cfedfce6a42a', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-09-02 14:05:57.418333', '2024-09-02 14:05:57.418333');
INSERT INTO public.exercise_example_bundles VALUES ('fcce8382-442e-44a3-890a-e43e69aa3751', 30, 'c0a055b2-daf6-4ecc-b97b-cfedfce6a42a', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-02 14:05:57.418333', '2024-09-02 14:05:57.418333');
INSERT INTO public.exercise_example_bundles VALUES ('55031ce1-4991-405c-99d4-12c776be5cb6', 15, 'c0a055b2-daf6-4ecc-b97b-cfedfce6a42a', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 14:05:57.418333', '2024-09-02 14:05:57.418333');
INSERT INTO public.exercise_example_bundles VALUES ('d1e4fabc-fa09-4ec7-b60c-67dd58c61631', 10, 'c0a055b2-daf6-4ecc-b97b-cfedfce6a42a', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-02 14:05:57.418333', '2024-09-02 14:05:57.418333');
INSERT INTO public.exercise_example_bundles VALUES ('e7414533-17d6-488d-97e6-7d94c55ce581', 5, 'c0a055b2-daf6-4ecc-b97b-cfedfce6a42a', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-09-02 14:05:57.418333', '2024-09-02 14:05:57.418333');
INSERT INTO public.exercise_example_bundles VALUES ('92ec36bf-a04b-4d90-b98e-cdf1451f38d7', 40, '2bc37dec-7b06-404c-af63-99bf3f60fb68', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-09-02 14:06:48.387808', '2024-09-02 14:06:48.387808');
INSERT INTO public.exercise_example_bundles VALUES ('f7aa3b0c-5d05-4797-b27c-62d75762b001', 30, '2bc37dec-7b06-404c-af63-99bf3f60fb68', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-02 14:06:48.387808', '2024-09-02 14:06:48.387808');
INSERT INTO public.exercise_example_bundles VALUES ('d98250e4-4f3c-451a-95f2-7bbc89d6baae', 15, '2bc37dec-7b06-404c-af63-99bf3f60fb68', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 14:06:48.387808', '2024-09-02 14:06:48.387808');
INSERT INTO public.exercise_example_bundles VALUES ('8df965c5-f7b9-4c50-96e9-2f4c73387ce2', 10, '2bc37dec-7b06-404c-af63-99bf3f60fb68', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-02 14:06:48.387808', '2024-09-02 14:06:48.387808');
INSERT INTO public.exercise_example_bundles VALUES ('d95e981b-2b22-4dd5-bdbb-1e5cdbcbaafc', 5, '2bc37dec-7b06-404c-af63-99bf3f60fb68', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-09-02 14:06:48.387808', '2024-09-02 14:06:48.387808');
INSERT INTO public.exercise_example_bundles VALUES ('2ca1ca06-e68e-4f9e-8b49-5ac5639d469b', 70, '3488eaaa-a999-43c5-acd6-b177b8a3df8a', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-09-02 14:08:08.354736', '2024-09-02 14:08:08.354736');
INSERT INTO public.exercise_example_bundles VALUES ('eaa10bef-fa54-4361-99df-2eeed63a0a54', 15, '3488eaaa-a999-43c5-acd6-b177b8a3df8a', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 14:08:08.354736', '2024-09-02 14:08:08.354736');
INSERT INTO public.exercise_example_bundles VALUES ('6cc12c43-6468-497d-be7f-f3d8de8c9ee2', 10, '3488eaaa-a999-43c5-acd6-b177b8a3df8a', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-02 14:08:08.354736', '2024-09-02 14:08:08.354736');
INSERT INTO public.exercise_example_bundles VALUES ('7441231e-a3cc-4e8e-8278-de32ad2d6ae7', 5, '3488eaaa-a999-43c5-acd6-b177b8a3df8a', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-09-02 14:08:08.354736', '2024-09-02 14:08:08.354736');
INSERT INTO public.exercise_example_bundles VALUES ('419e9e46-bbc0-4234-9f83-95a9dff57b47', 50, 'b2e39ab6-118d-46bd-ad8c-8acf9864af6c', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-09-02 14:57:19.332077', '2024-09-02 14:57:19.332077');
INSERT INTO public.exercise_example_bundles VALUES ('62a9dca5-bd02-4672-a6df-d95c47a7f961', 10, 'b2e39ab6-118d-46bd-ad8c-8acf9864af6c', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-09-02 14:57:19.332077', '2024-09-02 14:57:19.332077');
INSERT INTO public.exercise_example_bundles VALUES ('49a9ba5d-f661-4584-88be-150897229240', 20, 'b2e39ab6-118d-46bd-ad8c-8acf9864af6c', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 14:57:19.332077', '2024-09-02 14:57:19.332077');
INSERT INTO public.exercise_example_bundles VALUES ('3913bd58-9eb0-4468-bc37-7a7e6c63558a', 15, 'b2e39ab6-118d-46bd-ad8c-8acf9864af6c', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-02 14:57:19.332077', '2024-09-02 14:57:19.332077');
INSERT INTO public.exercise_example_bundles VALUES ('e8bea5ac-21f7-416f-ac3f-37d44ff5399d', 5, 'b2e39ab6-118d-46bd-ad8c-8acf9864af6c', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-09-02 14:57:19.332077', '2024-09-02 14:57:19.332077');
INSERT INTO public.exercise_example_bundles VALUES ('297188aa-acf9-40e7-8db9-fbfdbfbf95aa', 50, '885918a3-5c64-4f15-982e-1b9a91cb3743', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-09-02 14:58:44.037254', '2024-09-02 14:58:44.037254');
INSERT INTO public.exercise_example_bundles VALUES ('f23c4989-d0fc-4ca7-b93b-8757a1d7df6b', 20, '885918a3-5c64-4f15-982e-1b9a91cb3743', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-09-02 14:58:44.037254', '2024-09-02 14:58:44.037254');
INSERT INTO public.exercise_example_bundles VALUES ('4906b524-f12c-4510-ad19-c29256085a72', 20, '885918a3-5c64-4f15-982e-1b9a91cb3743', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 14:58:44.037254', '2024-09-02 14:58:44.037254');
INSERT INTO public.exercise_example_bundles VALUES ('1076a963-dc36-45a6-b341-36348b9f5ff4', 7, '885918a3-5c64-4f15-982e-1b9a91cb3743', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-02 14:58:44.037254', '2024-09-02 14:58:44.037254');
INSERT INTO public.exercise_example_bundles VALUES ('2e76da48-3774-47cf-a676-ccf2dab879e5', 3, '885918a3-5c64-4f15-982e-1b9a91cb3743', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-09-02 14:58:44.037254', '2024-09-02 14:58:44.037254');
INSERT INTO public.exercise_example_bundles VALUES ('b02df0b5-2857-4b96-939d-2b111dabf3ee', 70, '21370a0a-b01b-4e32-8f43-8648a54cd35c', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-09-02 15:01:10.960968', '2024-09-02 15:01:10.960968');
INSERT INTO public.exercise_example_bundles VALUES ('94341571-3f9d-4cdb-9f24-08df35da9fe2', 20, '21370a0a-b01b-4e32-8f43-8648a54cd35c', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 15:01:10.960968', '2024-09-02 15:01:10.960968');
INSERT INTO public.exercise_example_bundles VALUES ('bb25eb75-eef2-41ee-b905-1adb5010cc85', 10, '21370a0a-b01b-4e32-8f43-8648a54cd35c', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-09-02 15:01:10.960968', '2024-09-02 15:01:10.960968');
INSERT INTO public.exercise_example_bundles VALUES ('26c68744-752a-4590-9fff-e67b6cf08e04', 65, 'e1511aa4-1d34-4984-aa54-88f88029a96e', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-09-02 15:03:16.608102', '2024-09-02 15:03:16.608102');
INSERT INTO public.exercise_example_bundles VALUES ('fe75416b-31f8-4b38-b389-d3e0cba09589', 20, 'e1511aa4-1d34-4984-aa54-88f88029a96e', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 15:03:16.608102', '2024-09-02 15:03:16.608102');
INSERT INTO public.exercise_example_bundles VALUES ('a91a64db-1e3f-4101-8cd9-c564699859c6', 10, 'e1511aa4-1d34-4984-aa54-88f88029a96e', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-02 15:03:16.608102', '2024-09-02 15:03:16.608102');
INSERT INTO public.exercise_example_bundles VALUES ('2f3f8480-78b5-449c-b03a-04e4b0d871cd', 5, 'e1511aa4-1d34-4984-aa54-88f88029a96e', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-09-02 15:03:16.608102', '2024-09-02 15:03:16.608102');
INSERT INTO public.exercise_example_bundles VALUES ('53d550d4-d50a-4b9b-9ff0-6669b0c4c187', 50, 'fff561d6-3738-4360-a110-f93dcb3c8c10', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-09-02 15:21:42.995922', '2024-09-02 15:21:42.995922');
INSERT INTO public.exercise_example_bundles VALUES ('7528112d-c76e-4f02-bbf8-c91284a55f7c', 10, 'fff561d6-3738-4360-a110-f93dcb3c8c10', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-09-02 15:21:42.995922', '2024-09-02 15:21:42.995922');
INSERT INTO public.exercise_example_bundles VALUES ('e7e55952-fcb5-4551-be22-c1827b7e81b7', 20, 'fff561d6-3738-4360-a110-f93dcb3c8c10', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 15:21:42.995922', '2024-09-02 15:21:42.995922');
INSERT INTO public.exercise_example_bundles VALUES ('e9284740-1b91-4f66-a167-4fa2052408eb', 15, 'fff561d6-3738-4360-a110-f93dcb3c8c10', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-02 15:21:42.995922', '2024-09-02 15:21:42.995922');
INSERT INTO public.exercise_example_bundles VALUES ('69f3b9cc-12db-4080-b4a6-a5ca5a9c9408', 5, 'fff561d6-3738-4360-a110-f93dcb3c8c10', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-09-02 15:21:42.995922', '2024-09-02 15:21:42.995922');
INSERT INTO public.exercise_example_bundles VALUES ('a8274f57-afb0-45e9-ac77-377ec352a183', 50, 'db9ff44c-2e27-42df-8f6a-1b64429999e1', 'a3a8eae0-6315-4435-8974-f2c07ec3567f', '2024-09-02 15:26:06.638726', '2024-09-02 15:26:06.638726');
INSERT INTO public.exercise_example_bundles VALUES ('fb115ce3-c75c-4bbf-8ba8-ca55dfed5279', 20, 'db9ff44c-2e27-42df-8f6a-1b64429999e1', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-09-02 15:26:06.638726', '2024-09-02 15:26:06.638726');
INSERT INTO public.exercise_example_bundles VALUES ('43b83832-f1ba-47b0-9aa4-3d7af621bf26', 15, 'db9ff44c-2e27-42df-8f6a-1b64429999e1', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 15:26:06.638726', '2024-09-02 15:26:06.638726');
INSERT INTO public.exercise_example_bundles VALUES ('2a8fe0c8-3cb8-4645-bb01-8f0530e5538e', 10, 'db9ff44c-2e27-42df-8f6a-1b64429999e1', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-02 15:26:06.638726', '2024-09-02 15:26:06.638726');
INSERT INTO public.exercise_example_bundles VALUES ('61895bae-1f6f-4125-823b-55f720102811', 5, 'db9ff44c-2e27-42df-8f6a-1b64429999e1', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-09-02 15:26:06.638726', '2024-09-02 15:26:06.638726');
INSERT INTO public.exercise_example_bundles VALUES ('585617ca-f3f8-45ae-ad24-d8c1f50eb16c', 50, 'ec09f8c7-04cf-4219-8033-3dd17ea5c1d9', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-09-02 20:16:40.188859', '2024-09-02 20:16:40.188859');
INSERT INTO public.exercise_example_bundles VALUES ('cca3b598-fbbd-4058-b4f2-f6c4ba366308', 20, 'ec09f8c7-04cf-4219-8033-3dd17ea5c1d9', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-09-02 20:16:40.188859', '2024-09-02 20:16:40.188859');
INSERT INTO public.exercise_example_bundles VALUES ('6db1bbad-9ced-46fb-90c7-0fd944b522a3', 15, 'ec09f8c7-04cf-4219-8033-3dd17ea5c1d9', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 20:16:40.188859', '2024-09-02 20:16:40.188859');
INSERT INTO public.exercise_example_bundles VALUES ('57690f4b-6cbe-44d8-a2aa-076e52c985f4', 10, 'ec09f8c7-04cf-4219-8033-3dd17ea5c1d9', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-02 20:16:40.188859', '2024-09-02 20:16:40.188859');
INSERT INTO public.exercise_example_bundles VALUES ('718fb62d-a9cc-4205-8f51-02fcfba1dfde', 5, 'ec09f8c7-04cf-4219-8033-3dd17ea5c1d9', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-09-02 20:16:40.188859', '2024-09-02 20:16:40.188859');
INSERT INTO public.exercise_example_bundles VALUES ('dd40df1d-73ad-4ec9-b03e-3004ed9fcee8', 50, '9be8d3a0-574b-40dc-a42c-06ab42af7e66', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-09-02 20:18:44.740889', '2024-09-02 20:18:44.740889');
INSERT INTO public.exercise_example_bundles VALUES ('19a88fe3-7aa8-49be-a81b-6028e6015e9f', 10, '9be8d3a0-574b-40dc-a42c-06ab42af7e66', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-09-02 20:18:44.740889', '2024-09-02 20:18:44.740889');
INSERT INTO public.exercise_example_bundles VALUES ('cf5ef5c8-a27c-4bed-985e-1fdab92a7db1', 20, '9be8d3a0-574b-40dc-a42c-06ab42af7e66', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 20:18:44.740889', '2024-09-02 20:18:44.740889');
INSERT INTO public.exercise_example_bundles VALUES ('33407ad5-cb99-4dd8-a8ca-cc578d5dc241', 15, '9be8d3a0-574b-40dc-a42c-06ab42af7e66', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-02 20:18:44.740889', '2024-09-02 20:18:44.740889');
INSERT INTO public.exercise_example_bundles VALUES ('02dbfc42-55f0-407e-817b-00f40daa3a6d', 5, '9be8d3a0-574b-40dc-a42c-06ab42af7e66', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-09-02 20:18:44.740889', '2024-09-02 20:18:44.740889');
INSERT INTO public.exercise_example_bundles VALUES ('d8c004ad-05db-4a62-8883-2e3816ba2b45', 65, '82890348-a566-4762-b9b4-f89e52534936', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-09-02 20:20:26.754243', '2024-09-02 20:20:26.754243');
INSERT INTO public.exercise_example_bundles VALUES ('a58ba6fe-c4c5-4762-ba71-a647b333d202', 20, '82890348-a566-4762-b9b4-f89e52534936', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 20:20:26.754243', '2024-09-02 20:20:26.754243');
INSERT INTO public.exercise_example_bundles VALUES ('bcaaa94c-b612-40e8-aa90-eaa5ca0fc762', 10, '82890348-a566-4762-b9b4-f89e52534936', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-09-02 20:20:26.754243', '2024-09-02 20:20:26.754243');
INSERT INTO public.exercise_example_bundles VALUES ('3d9b9983-ae6e-4b41-992b-e46e3acc639e', 5, '82890348-a566-4762-b9b4-f89e52534936', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-02 20:20:26.754243', '2024-09-02 20:20:26.754243');
INSERT INTO public.exercise_example_bundles VALUES ('f57d7100-401f-4976-8f7b-f93aba2e6685', 55, '13fcd794-54fb-413f-8bbf-44353cd29869', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-09-02 20:22:38.713564', '2024-09-02 20:22:38.713564');
INSERT INTO public.exercise_example_bundles VALUES ('a4581426-d2e8-410e-9e33-0b72c83f8eac', 15, '13fcd794-54fb-413f-8bbf-44353cd29869', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-09-02 20:22:38.713564', '2024-09-02 20:22:38.713564');
INSERT INTO public.exercise_example_bundles VALUES ('c4652306-0e22-4de9-9948-69a984c30a09', 15, '13fcd794-54fb-413f-8bbf-44353cd29869', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 20:22:38.713564', '2024-09-02 20:22:38.713564');
INSERT INTO public.exercise_example_bundles VALUES ('67f4b8a5-7280-40f0-a7cd-75c6122e0ab0', 10, '13fcd794-54fb-413f-8bbf-44353cd29869', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-02 20:22:38.713564', '2024-09-02 20:22:38.713564');
INSERT INTO public.exercise_example_bundles VALUES ('f6c8f319-5667-4a57-a57b-30b426699965', 5, '13fcd794-54fb-413f-8bbf-44353cd29869', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-09-02 20:22:38.713564', '2024-09-02 20:22:38.713564');
INSERT INTO public.exercise_example_bundles VALUES ('cdb03dea-6933-472c-b5ed-f24b4de92334', 50, '3d0c8e76-37a9-4f4c-84fa-47a6a07aaacc', 'a3a8eae0-6315-4435-8974-f2c07ec3567f', '2024-09-02 20:26:26.27422', '2024-09-02 20:26:26.27422');
INSERT INTO public.exercise_example_bundles VALUES ('61ef331e-7cae-4d79-afba-511428b91a58', 20, '3d0c8e76-37a9-4f4c-84fa-47a6a07aaacc', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-09-02 20:26:26.27422', '2024-09-02 20:26:26.27422');
INSERT INTO public.exercise_example_bundles VALUES ('31fb098f-5eab-4eb1-9dab-6d3320967294', 15, '3d0c8e76-37a9-4f4c-84fa-47a6a07aaacc', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 20:26:26.27422', '2024-09-02 20:26:26.27422');
INSERT INTO public.exercise_example_bundles VALUES ('2874e58c-64a2-4160-bff6-a58fe9704e42', 10, '3d0c8e76-37a9-4f4c-84fa-47a6a07aaacc', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-02 20:26:26.27422', '2024-09-02 20:26:26.27422');
INSERT INTO public.exercise_example_bundles VALUES ('e287f583-4a06-42c1-bf14-4f0b20b0fc5e', 5, '3d0c8e76-37a9-4f4c-84fa-47a6a07aaacc', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-09-02 20:26:26.27422', '2024-09-02 20:26:26.27422');
INSERT INTO public.exercise_example_bundles VALUES ('71b7d499-9546-4606-a415-a34013b50cc0', 50, '8a39b1e7-986c-41e7-a0b9-44a4efb46360', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-09-02 20:27:53.781159', '2024-09-02 20:27:53.781159');
INSERT INTO public.exercise_example_bundles VALUES ('a78d7055-c8e9-4788-98e9-f6bddd6145a8', 20, '8a39b1e7-986c-41e7-a0b9-44a4efb46360', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-09-02 20:27:53.781159', '2024-09-02 20:27:53.781159');
INSERT INTO public.exercise_example_bundles VALUES ('34e394d2-6a46-413e-821a-1ed15ea687c3', 15, '8a39b1e7-986c-41e7-a0b9-44a4efb46360', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 20:27:53.781159', '2024-09-02 20:27:53.781159');
INSERT INTO public.exercise_example_bundles VALUES ('e328a42d-1375-4879-ab9d-efb182483fde', 10, '8a39b1e7-986c-41e7-a0b9-44a4efb46360', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-02 20:27:53.781159', '2024-09-02 20:27:53.781159');
INSERT INTO public.exercise_example_bundles VALUES ('4cc8f8dc-780d-4faa-8bc8-daf7029f0bb5', 5, '8a39b1e7-986c-41e7-a0b9-44a4efb46360', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-09-02 20:27:53.781159', '2024-09-02 20:27:53.781159');
INSERT INTO public.exercise_example_bundles VALUES ('578cdc91-1e88-4efa-a8ae-a6c850368e0b', 50, 'ff20bd08-57ae-465f-aa54-d1ba0f7862a9', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-09-02 20:29:17.390484', '2024-09-02 20:29:17.390484');
INSERT INTO public.exercise_example_bundles VALUES ('eca0e00f-69c4-40aa-bd36-5a0d4d5ebd47', 20, 'ff20bd08-57ae-465f-aa54-d1ba0f7862a9', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-09-02 20:29:17.390484', '2024-09-02 20:29:17.390484');
INSERT INTO public.exercise_example_bundles VALUES ('80ce00b7-9848-49fb-ac0a-0d31e0849c3b', 15, 'ff20bd08-57ae-465f-aa54-d1ba0f7862a9', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 20:29:17.390484', '2024-09-02 20:29:17.390484');
INSERT INTO public.exercise_example_bundles VALUES ('798f3a94-9ab3-46a8-a2fe-87c4f7594237', 10, 'ff20bd08-57ae-465f-aa54-d1ba0f7862a9', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-02 20:29:17.390484', '2024-09-02 20:29:17.390484');
INSERT INTO public.exercise_example_bundles VALUES ('7ce4f7f5-08d5-4308-925d-4a66822f86ec', 5, 'ff20bd08-57ae-465f-aa54-d1ba0f7862a9', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-02 20:29:17.390484', '2024-09-02 20:29:17.390484');
INSERT INTO public.exercise_example_bundles VALUES ('a958f328-24f6-4850-aa40-b214bd37ac20', 50, '8a73b841-1d4e-4808-8ed7-58c4931e0e96', 'a3a8eae0-6315-4435-8974-f2c07ec3567f', '2024-09-02 20:31:29.279768', '2024-09-02 20:31:29.279768');
INSERT INTO public.exercise_example_bundles VALUES ('5f6c2edb-8dab-4f84-b752-3e4c6c249199', 20, '8a73b841-1d4e-4808-8ed7-58c4931e0e96', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-09-02 20:31:29.279768', '2024-09-02 20:31:29.279768');
INSERT INTO public.exercise_example_bundles VALUES ('efc023d6-d593-4d92-877c-a4a4b0ac0934', 15, '8a73b841-1d4e-4808-8ed7-58c4931e0e96', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 20:31:29.279768', '2024-09-02 20:31:29.279768');
INSERT INTO public.exercise_example_bundles VALUES ('64ddbe87-1c8d-4bf5-a12b-a888e5e942b3', 10, '8a73b841-1d4e-4808-8ed7-58c4931e0e96', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-02 20:31:29.279768', '2024-09-02 20:31:29.279768');
INSERT INTO public.exercise_example_bundles VALUES ('d2c1cb12-bd43-45ba-8af5-4ff56d8e88f8', 5, '8a73b841-1d4e-4808-8ed7-58c4931e0e96', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-09-02 20:31:29.279768', '2024-09-02 20:31:29.279768');
INSERT INTO public.exercise_example_bundles VALUES ('3623f72c-4253-46f2-bd45-ec5f2f982d49', 50, 'b720265e-a3ce-48d3-8e8e-87e05c07b8a3', 'a3a8eae0-6315-4435-8974-f2c07ec3567f', '2024-09-02 20:35:21.726471', '2024-09-02 20:35:21.726471');
INSERT INTO public.exercise_example_bundles VALUES ('bf2f5fc0-2e8e-4fa0-b62d-002eb9461a25', 25, 'b720265e-a3ce-48d3-8e8e-87e05c07b8a3', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-09-02 20:35:21.726471', '2024-09-02 20:35:21.726471');
INSERT INTO public.exercise_example_bundles VALUES ('8bfa2f10-24cc-4cd9-aaa4-b60f228c5feb', 15, 'b720265e-a3ce-48d3-8e8e-87e05c07b8a3', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 20:35:21.726471', '2024-09-02 20:35:21.726471');
INSERT INTO public.exercise_example_bundles VALUES ('868e3eb0-599b-4539-9341-16aa8e671b4d', 5, 'b720265e-a3ce-48d3-8e8e-87e05c07b8a3', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-02 20:35:21.726471', '2024-09-02 20:35:21.726471');
INSERT INTO public.exercise_example_bundles VALUES ('808ba929-d9c3-45d2-8604-277eb7c891a1', 5, 'b720265e-a3ce-48d3-8e8e-87e05c07b8a3', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-09-02 20:35:21.726471', '2024-09-02 20:35:21.726471');
INSERT INTO public.exercise_example_bundles VALUES ('a9794a20-79d4-4bb2-9a0a-69c6887cd232', 50, 'f6dd98f1-ad1d-4ea2-ba97-9939ce0fc028', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-09-02 20:38:34.928917', '2024-09-02 20:38:34.928917');
INSERT INTO public.exercise_example_bundles VALUES ('b8c03846-a25a-42f6-b229-fed2e8e3f651', 20, 'f6dd98f1-ad1d-4ea2-ba97-9939ce0fc028', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-09-02 20:38:34.928917', '2024-09-02 20:38:34.928917');
INSERT INTO public.exercise_example_bundles VALUES ('260afdf5-1f7a-437d-8cbf-d57aa977d547', 15, 'f6dd98f1-ad1d-4ea2-ba97-9939ce0fc028', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 20:38:34.928917', '2024-09-02 20:38:34.928917');
INSERT INTO public.exercise_example_bundles VALUES ('c2254db1-b4bd-4f10-8841-170021f900c7', 10, 'f6dd98f1-ad1d-4ea2-ba97-9939ce0fc028', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-02 20:38:34.928917', '2024-09-02 20:38:34.928917');
INSERT INTO public.exercise_example_bundles VALUES ('dd1eaf23-6781-47fd-b324-e494f1f55ea8', 5, 'f6dd98f1-ad1d-4ea2-ba97-9939ce0fc028', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-09-02 20:38:34.928917', '2024-09-02 20:38:34.928917');
INSERT INTO public.exercise_example_bundles VALUES ('598fb070-45b0-45a3-8b6b-6cabd3fefe3b', 55, 'f467d244-5568-40f6-bd7a-b3bdcad82398', 'a3a8eae0-6315-4435-8974-f2c07ec3567f', '2024-09-02 20:40:09.534173', '2024-09-02 20:40:09.534173');
INSERT INTO public.exercise_example_bundles VALUES ('4c259132-0608-4fb3-9e7c-ecf887e9dff7', 25, 'f467d244-5568-40f6-bd7a-b3bdcad82398', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-09-02 20:40:09.534173', '2024-09-02 20:40:09.534173');
INSERT INTO public.exercise_example_bundles VALUES ('32ea1579-f69a-4a8e-95de-e7e1634f4f40', 10, 'f467d244-5568-40f6-bd7a-b3bdcad82398', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 20:40:09.534173', '2024-09-02 20:40:09.534173');
INSERT INTO public.exercise_example_bundles VALUES ('d521c8a8-d258-4f9a-857d-5d4cd68a8f5a', 5, 'f467d244-5568-40f6-bd7a-b3bdcad82398', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-02 20:40:09.534173', '2024-09-02 20:40:09.534173');
INSERT INTO public.exercise_example_bundles VALUES ('9a0ceb2b-d429-4741-b6cf-6cdfc0c29751', 5, 'f467d244-5568-40f6-bd7a-b3bdcad82398', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-09-02 20:40:09.534173', '2024-09-02 20:40:09.534173');
INSERT INTO public.exercise_example_bundles VALUES ('1893f253-4b41-492b-95f0-8c091d6e2569', 55, '2780e6d9-a86f-4038-b96f-ef59f961cb4b', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-09-02 20:42:00.051897', '2024-09-02 20:42:00.051897');
INSERT INTO public.exercise_example_bundles VALUES ('49d522fb-2005-42da-9e69-b089262ad289', 15, '2780e6d9-a86f-4038-b96f-ef59f961cb4b', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-09-02 20:42:00.051897', '2024-09-02 20:42:00.051897');
INSERT INTO public.exercise_example_bundles VALUES ('46238992-0fea-4fa8-8064-c96238d0058d', 15, '2780e6d9-a86f-4038-b96f-ef59f961cb4b', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 20:42:00.051897', '2024-09-02 20:42:00.051897');
INSERT INTO public.exercise_example_bundles VALUES ('62d5b1fd-5c27-4fc3-ab24-b69e087e03a4', 10, '2780e6d9-a86f-4038-b96f-ef59f961cb4b', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-02 20:42:00.051897', '2024-09-02 20:42:00.051897');
INSERT INTO public.exercise_example_bundles VALUES ('71b7678d-f504-4019-bc24-5b6ad68deaa0', 5, '2780e6d9-a86f-4038-b96f-ef59f961cb4b', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-09-02 20:42:00.051897', '2024-09-02 20:42:00.051897');
INSERT INTO public.exercise_example_bundles VALUES ('069263f6-0c7e-4020-95b5-43764e32cc4e', 50, 'e68781f2-7021-4907-af54-de18b80d181a', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-09-02 20:59:37.528935', '2024-09-02 20:59:37.528935');
INSERT INTO public.exercise_example_bundles VALUES ('a9ca38cd-9531-41b9-97c8-0990a5016fb6', 20, 'e68781f2-7021-4907-af54-de18b80d181a', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-09-02 20:59:37.528935', '2024-09-02 20:59:37.528935');
INSERT INTO public.exercise_example_bundles VALUES ('5c49d817-38fc-4b3f-9619-161630e6e215', 15, 'e68781f2-7021-4907-af54-de18b80d181a', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 20:59:37.528935', '2024-09-02 20:59:37.528935');
INSERT INTO public.exercise_example_bundles VALUES ('ad953d94-05eb-47ef-9197-3e26f61eb796', 10, 'e68781f2-7021-4907-af54-de18b80d181a', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-02 20:59:37.528935', '2024-09-02 20:59:37.528935');
INSERT INTO public.exercise_example_bundles VALUES ('3b99d4e8-0b7d-432b-9e4b-e60757b62ee6', 5, 'e68781f2-7021-4907-af54-de18b80d181a', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-02 20:59:37.528935', '2024-09-02 20:59:37.528935');
INSERT INTO public.exercise_example_bundles VALUES ('9817ae7f-071d-40b4-aa50-c348fc7ccf3f', 60, '5b7d739c-d130-466c-a5ac-9e8b318b77ad', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-09-02 21:01:10.560238', '2024-09-02 21:01:10.560238');
INSERT INTO public.exercise_example_bundles VALUES ('c5e806f0-6b91-41e8-9503-086ddba0e8c4', 15, '5b7d739c-d130-466c-a5ac-9e8b318b77ad', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-09-02 21:01:10.560238', '2024-09-02 21:01:10.560238');
INSERT INTO public.exercise_example_bundles VALUES ('d90e98e8-dec2-4d25-9357-1524b8e28e15', 15, '5b7d739c-d130-466c-a5ac-9e8b318b77ad', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 21:01:10.560238', '2024-09-02 21:01:10.560238');
INSERT INTO public.exercise_example_bundles VALUES ('c5cc4238-8ba4-4f55-9e0e-8ece2e3bdb4d', 10, '5b7d739c-d130-466c-a5ac-9e8b318b77ad', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-02 21:01:10.560238', '2024-09-02 21:01:10.560238');
INSERT INTO public.exercise_example_bundles VALUES ('183cff6e-92e5-4a05-93b6-a4d1a5a6b545', 55, '3edb750e-4725-4338-a079-d48dc8797917', 'a3a8eae0-6315-4435-8974-f2c07ec3567f', '2024-09-02 21:02:37.709949', '2024-09-02 21:02:37.709949');
INSERT INTO public.exercise_example_bundles VALUES ('4f0d755b-3118-4a40-9827-89d364a5856a', 25, '3edb750e-4725-4338-a079-d48dc8797917', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-09-02 21:02:37.709949', '2024-09-02 21:02:37.709949');
INSERT INTO public.exercise_example_bundles VALUES ('f87a5c3e-69ca-4998-bc35-f65148348624', 10, '3edb750e-4725-4338-a079-d48dc8797917', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 21:02:37.709949', '2024-09-02 21:02:37.709949');
INSERT INTO public.exercise_example_bundles VALUES ('f41a92e7-999e-4ee0-92ba-652e03cea5f6', 5, '3edb750e-4725-4338-a079-d48dc8797917', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-02 21:02:37.709949', '2024-09-02 21:02:37.709949');
INSERT INTO public.exercise_example_bundles VALUES ('501e9b90-6ca2-4526-9c86-d6e045c87bcd', 5, '3edb750e-4725-4338-a079-d48dc8797917', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-09-02 21:02:37.709949', '2024-09-02 21:02:37.709949');
INSERT INTO public.exercise_example_bundles VALUES ('d93ec391-190c-47b3-a1f3-dd5f7375d0c3', 55, 'ff2d84fc-ff6d-4637-8128-91c1495c98e8', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-09-02 21:04:38.434026', '2024-09-02 21:04:38.434026');
INSERT INTO public.exercise_example_bundles VALUES ('3d1f0782-2a0b-40ec-84af-9b1f24dfd3df', 25, 'ff2d84fc-ff6d-4637-8128-91c1495c98e8', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-09-02 21:04:38.434026', '2024-09-02 21:04:38.434026');
INSERT INTO public.exercise_example_bundles VALUES ('5373add3-ec9d-450c-a564-dd44b1e1389e', 10, 'ff2d84fc-ff6d-4637-8128-91c1495c98e8', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 21:04:38.434026', '2024-09-02 21:04:38.434026');
INSERT INTO public.exercise_example_bundles VALUES ('82e6479f-3d65-4914-b9fd-1b674a85eea5', 5, 'ff2d84fc-ff6d-4637-8128-91c1495c98e8', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-02 21:04:38.434026', '2024-09-02 21:04:38.434026');
INSERT INTO public.exercise_example_bundles VALUES ('d6ccf972-3f11-4c93-8296-7186a31c0b8b', 5, 'ff2d84fc-ff6d-4637-8128-91c1495c98e8', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-09-02 21:04:38.434026', '2024-09-02 21:04:38.434026');
INSERT INTO public.exercise_example_bundles VALUES ('68047e9a-a15c-4c5d-8d11-dc7b11ac7109', 55, 'c2059aab-d7b5-4532-a8a7-ad15a4054b33', 'a3a8eae0-6315-4435-8974-f2c07ec3567f', '2024-09-02 21:07:15.402214', '2024-09-02 21:07:15.402214');
INSERT INTO public.exercise_example_bundles VALUES ('149f0854-768d-43e8-9c09-a19efc85240b', 25, 'c2059aab-d7b5-4532-a8a7-ad15a4054b33', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-09-02 21:07:15.402214', '2024-09-02 21:07:15.402214');
INSERT INTO public.exercise_example_bundles VALUES ('a708760b-daab-4ab9-b998-1dc94209f916', 10, 'c2059aab-d7b5-4532-a8a7-ad15a4054b33', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 21:07:15.402214', '2024-09-02 21:07:15.402214');
INSERT INTO public.exercise_example_bundles VALUES ('58256fcd-9913-4fe0-b218-32a52ff843e2', 5, 'c2059aab-d7b5-4532-a8a7-ad15a4054b33', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-02 21:07:15.402214', '2024-09-02 21:07:15.402214');
INSERT INTO public.exercise_example_bundles VALUES ('131f61c2-cb27-4472-88a7-c16b45e23bc8', 5, 'c2059aab-d7b5-4532-a8a7-ad15a4054b33', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-09-02 21:07:15.402214', '2024-09-02 21:07:15.402214');
INSERT INTO public.exercise_example_bundles VALUES ('b3546a7f-e024-4115-b7ed-5087cd8f844f', 55, '118eab6d-cae9-4c0b-b8e6-57f3e5541f1a', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-09-02 21:09:41.736088', '2024-09-02 21:09:41.736088');
INSERT INTO public.exercise_example_bundles VALUES ('8006aca8-856a-494e-8688-3e31b2d55cf6', 25, '118eab6d-cae9-4c0b-b8e6-57f3e5541f1a', 'c57aa60c-61ea-4498-b01f-fedcafe8a32a', '2024-09-02 21:09:41.736088', '2024-09-02 21:09:41.736088');
INSERT INTO public.exercise_example_bundles VALUES ('763c57f9-2fe9-4e5d-b264-468cbbbedb1f', 10, '118eab6d-cae9-4c0b-b8e6-57f3e5541f1a', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 21:09:41.736088', '2024-09-02 21:09:41.736088');
INSERT INTO public.exercise_example_bundles VALUES ('288d9741-02a9-4496-b33c-01d6310ec876', 5, '118eab6d-cae9-4c0b-b8e6-57f3e5541f1a', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-02 21:09:41.736088', '2024-09-02 21:09:41.736088');
INSERT INTO public.exercise_example_bundles VALUES ('08de4265-a66d-46c8-910a-e6fbfbce38bb', 5, '118eab6d-cae9-4c0b-b8e6-57f3e5541f1a', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-09-02 21:09:41.736088', '2024-09-02 21:09:41.736088');
INSERT INTO public.exercise_example_bundles VALUES ('32d93875-6dc1-4a8f-af7a-d8ef6dc1c781', 55, '9a4eec3b-3f0b-4b36-a2b5-0f544376cf78', 'a3a8eae0-6315-4435-8974-f2c07ec3567f', '2024-09-02 21:11:10.380693', '2024-09-02 21:11:10.380693');
INSERT INTO public.exercise_example_bundles VALUES ('e07f52d1-31cc-404a-b460-ef4738712c37', 25, '9a4eec3b-3f0b-4b36-a2b5-0f544376cf78', 'b4658891-9713-48c4-864c-8dd907da19b0', '2024-09-02 21:11:10.380693', '2024-09-02 21:11:10.380693');
INSERT INTO public.exercise_example_bundles VALUES ('897b7e98-d545-4ec3-b3c4-1e47c75690b0', 10, '9a4eec3b-3f0b-4b36-a2b5-0f544376cf78', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-02 21:11:10.380693', '2024-09-02 21:11:10.380693');
INSERT INTO public.exercise_example_bundles VALUES ('206240ac-efde-463d-8584-7d01f8bad56f', 5, '9a4eec3b-3f0b-4b36-a2b5-0f544376cf78', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-02 21:11:10.380693', '2024-09-02 21:11:10.380693');
INSERT INTO public.exercise_example_bundles VALUES ('b374b24d-b8b0-4684-8deb-4eb9dc78dc3f', 5, '9a4eec3b-3f0b-4b36-a2b5-0f544376cf78', '2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', '2024-09-02 21:11:10.380693', '2024-09-02 21:11:10.380693');
INSERT INTO public.exercise_example_bundles VALUES ('77fe7821-f4f7-4b15-839f-68516846d623', 100, '61a31a0d-a736-48b5-b03e-44aa1ad7f3eb', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-03 08:30:59.474466', '2024-09-03 08:30:59.474466');
INSERT INTO public.exercise_example_bundles VALUES ('d8a25b8f-5332-4992-abbd-9386a563eb8a', 70, 'c5864272-ae27-4363-add6-7ead1b7b3379', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-03 08:32:01.591329', '2024-09-03 08:32:01.591329');
INSERT INTO public.exercise_example_bundles VALUES ('2144643d-d3e8-4183-9601-b9e08ed6ad3a', 30, 'c5864272-ae27-4363-add6-7ead1b7b3379', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-03 08:32:01.591329', '2024-09-03 08:32:01.591329');
INSERT INTO public.exercise_example_bundles VALUES ('79796c30-3a78-4d0a-a24b-aa69aa0b08ea', 100, 'ddaf509f-3c99-437c-b872-a4651a91601f', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-03 08:33:21.458375', '2024-09-03 08:33:21.458375');
INSERT INTO public.exercise_example_bundles VALUES ('08f1397f-6ca5-40d5-9b6b-c5ba65df6d4b', 70, 'd3f54e1c-6333-4a15-b09b-0264ec0b68fe', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-03 08:35:16.713569', '2024-09-03 08:35:16.713569');
INSERT INTO public.exercise_example_bundles VALUES ('d59ccf5a-6d28-42f4-87e6-e3b0508b24df', 30, 'd3f54e1c-6333-4a15-b09b-0264ec0b68fe', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-03 08:35:16.713569', '2024-09-03 08:35:16.713569');
INSERT INTO public.exercise_example_bundles VALUES ('9cea8943-3eb8-4585-a8b8-170e3a8bc076', 100, '414a1891-1a28-4dbe-84e3-a992c6e879bc', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-03 08:56:48.834366', '2024-09-03 08:56:48.834366');
INSERT INTO public.exercise_example_bundles VALUES ('72ec03cb-99b7-4f20-884f-6cb58d58b365', 100, 'd59d340d-774d-4c81-8b3d-251175936221', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-03 09:26:50.093766', '2024-09-03 09:26:50.093766');
INSERT INTO public.exercise_example_bundles VALUES ('2ff28181-5f74-4519-9cf5-43f9adec8b57', 100, '10870aab-3086-462e-a64e-14710e3fbffe', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-03 09:28:24.998072', '2024-09-03 09:28:24.998072');
INSERT INTO public.exercise_example_bundles VALUES ('e87880da-349b-494a-b3a4-4b656071c566', 100, 'bb9c756b-0c9e-4e87-826f-bb2cbd16d86b', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-03 09:30:01.946161', '2024-09-03 09:30:01.946161');
INSERT INTO public.exercise_example_bundles VALUES ('46c1a824-0332-4ec6-83d2-8f552ddf0fce', 100, '7545289f-f7c8-456b-98e9-f7b15600254c', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-03 09:32:06.552156', '2024-09-03 09:32:06.552156');
INSERT INTO public.exercise_example_bundles VALUES ('b3709a19-39e6-4169-8069-ae367dd202c2', 70, 'b35c5710-3c80-4f48-8ee4-295e5a15999f', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-03 09:34:29.276295', '2024-09-03 09:34:29.276295');
INSERT INTO public.exercise_example_bundles VALUES ('0d52854b-e27e-4782-adcb-bf8da1d3e177', 30, 'b35c5710-3c80-4f48-8ee4-295e5a15999f', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-03 09:34:29.276295', '2024-09-03 09:34:29.276295');
INSERT INTO public.exercise_example_bundles VALUES ('ba1413d9-afef-46ac-8584-3f42c11bd477', 100, 'd7871e0c-5e1b-4ffd-a9ab-951028246a01', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-03 09:37:05.55708', '2024-09-03 09:37:05.55708');
INSERT INTO public.exercise_example_bundles VALUES ('acba4525-01c1-410c-841e-b991866ab3e4', 100, 'b53daf0a-c7b6-4be8-9230-b33695eb5340', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-03 09:38:26.924716', '2024-09-03 09:38:26.924716');
INSERT INTO public.exercise_example_bundles VALUES ('47f6a25f-37aa-4064-9e7c-af061f2d405c', 60, '60bd8dbc-6bb8-4be0-9ee7-f4c5a295c5b4', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-03 09:39:30.851233', '2024-09-03 09:39:30.851233');
INSERT INTO public.exercise_example_bundles VALUES ('d5539c2a-5c50-4e2e-aed5-1fa1a52d0567', 40, '60bd8dbc-6bb8-4be0-9ee7-f4c5a295c5b4', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-03 09:39:30.851233', '2024-09-03 09:39:30.851233');
INSERT INTO public.exercise_example_bundles VALUES ('8313a784-75c0-4c85-ab10-f6a627db3137', 100, 'a2f8dd49-606e-4d86-ae04-8af61c0b40e9', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-03 09:42:04.640407', '2024-09-03 09:42:04.640407');
INSERT INTO public.exercise_example_bundles VALUES ('f85cb30f-b0da-46b6-ac77-eac8f628923d', 100, 'b515dd55-701a-45f4-938f-fdb26d2d5cba', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-03 09:43:17.736414', '2024-09-03 09:43:17.736414');
INSERT INTO public.exercise_example_bundles VALUES ('21d7eec5-d0bf-4913-8b61-240221f32039', 100, 'f5f03cc7-c2bc-4367-9042-107114d634ce', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-03 09:44:32.014646', '2024-09-03 09:44:32.014646');
INSERT INTO public.exercise_example_bundles VALUES ('c69c04cf-f711-4866-a3c8-8a60aaf3dd31', 60, '7d823dc8-8303-4ddd-a25d-935569c662b7', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-03 11:04:13.308425', '2024-09-03 11:04:13.308425');
INSERT INTO public.exercise_example_bundles VALUES ('a4644e43-c978-495b-b5e4-63d2fcdd1bab', 25, '7d823dc8-8303-4ddd-a25d-935569c662b7', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-03 11:04:13.308425', '2024-09-03 11:04:13.308425');
INSERT INTO public.exercise_example_bundles VALUES ('eff2f1a3-de83-4e03-b0f4-fee02f852193', 15, '7d823dc8-8303-4ddd-a25d-935569c662b7', 'af854064-078a-4f50-af1d-8744e866751e', '2024-09-03 11:04:13.308425', '2024-09-03 11:04:13.308425');
INSERT INTO public.exercise_example_bundles VALUES ('f8b8172b-586a-4841-9d16-72d8756422c3', 70, '78b3c689-0222-46de-a7b3-9bd6c75b920c', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-03 11:07:53.755464', '2024-09-03 11:07:53.755464');
INSERT INTO public.exercise_example_bundles VALUES ('73426df6-c10d-4f95-b90d-cb19cfa7fbd7', 30, '78b3c689-0222-46de-a7b3-9bd6c75b920c', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-03 11:07:53.755464', '2024-09-03 11:07:53.755464');
INSERT INTO public.exercise_example_bundles VALUES ('5fe31cd2-1b87-4890-8363-1067dac89d72', 40, 'b39cc5b5-8335-4918-a504-f9cdfb85ceba', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-03 11:13:27.419115', '2024-09-03 11:13:27.419115');
INSERT INTO public.exercise_example_bundles VALUES ('add03f52-05bf-4a2a-a417-3e5754a5085f', 25, 'b39cc5b5-8335-4918-a504-f9cdfb85ceba', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-03 11:13:27.419115', '2024-09-03 11:13:27.419115');
INSERT INTO public.exercise_example_bundles VALUES ('2bbe774b-e917-4c3d-9dca-eedae6a604bc', 15, 'b39cc5b5-8335-4918-a504-f9cdfb85ceba', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-03 11:13:27.419115', '2024-09-03 11:13:27.419115');
INSERT INTO public.exercise_example_bundles VALUES ('b59d4d6e-68ee-4183-ba80-77bc8c82c73a', 10, 'b39cc5b5-8335-4918-a504-f9cdfb85ceba', 'af854064-078a-4f50-af1d-8744e866751e', '2024-09-03 11:13:27.419115', '2024-09-03 11:13:27.419115');
INSERT INTO public.exercise_example_bundles VALUES ('39e2a981-65dc-4f85-b55d-fcbfa65f9f54', 10, 'b39cc5b5-8335-4918-a504-f9cdfb85ceba', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-03 11:13:27.419115', '2024-09-03 11:13:27.419115');
INSERT INTO public.exercise_example_bundles VALUES ('b800cf88-63c7-496a-a592-ed8406423c77', 70, 'd806b4f1-399c-4ceb-bb91-663ec0350e6d', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-03 11:21:01.347013', '2024-09-03 11:21:01.347013');
INSERT INTO public.exercise_example_bundles VALUES ('e30561d3-fc9b-4c3e-b22b-fdecc4614bec', 20, 'd806b4f1-399c-4ceb-bb91-663ec0350e6d', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-03 11:21:01.347013', '2024-09-03 11:21:01.347013');
INSERT INTO public.exercise_example_bundles VALUES ('c7cd7641-e004-476b-bfa4-c6453e756c21', 10, 'd806b4f1-399c-4ceb-bb91-663ec0350e6d', 'af854064-078a-4f50-af1d-8744e866751e', '2024-09-03 11:21:01.347013', '2024-09-03 11:21:01.347013');
INSERT INTO public.exercise_example_bundles VALUES ('a6b6b8b5-f7d2-49b3-8fca-a6dde4d4a178', 40, '3a39a222-7b4d-4e0e-9e7e-034d78b5d6bf', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-05 12:48:41.924678', '2024-09-05 12:48:41.924678');
INSERT INTO public.exercise_example_bundles VALUES ('842d4be9-1e0a-4650-8eac-6a53e7d35caa', 25, '3a39a222-7b4d-4e0e-9e7e-034d78b5d6bf', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-05 12:48:41.924678', '2024-09-05 12:48:41.924678');
INSERT INTO public.exercise_example_bundles VALUES ('60a05bbe-7c57-41d5-98b1-c10791059097', 15, '3a39a222-7b4d-4e0e-9e7e-034d78b5d6bf', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-05 12:48:41.924678', '2024-09-05 12:48:41.924678');
INSERT INTO public.exercise_example_bundles VALUES ('aa91246b-a32c-416d-8e06-2385770a2c80', 10, '3a39a222-7b4d-4e0e-9e7e-034d78b5d6bf', 'af854064-078a-4f50-af1d-8744e866751e', '2024-09-05 12:48:41.924678', '2024-09-05 12:48:41.924678');
INSERT INTO public.exercise_example_bundles VALUES ('2b8b74d8-210e-470e-a416-f67fea243d7b', 10, '3a39a222-7b4d-4e0e-9e7e-034d78b5d6bf', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-05 12:48:41.924678', '2024-09-05 12:48:41.924678');
INSERT INTO public.exercise_example_bundles VALUES ('3f04cd37-a1f7-470c-ac9a-9397e7791061', 60, 'be3c01a7-3bd0-448c-844b-583bd824c90b', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-05 12:54:46.787474', '2024-09-05 12:54:46.787474');
INSERT INTO public.exercise_example_bundles VALUES ('2edbdadf-b0db-4b2d-b687-28b0d264c3c5', 25, 'be3c01a7-3bd0-448c-844b-583bd824c90b', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-05 12:54:46.787474', '2024-09-05 12:54:46.787474');
INSERT INTO public.exercise_example_bundles VALUES ('37373366-c75a-4a20-b2c6-0bb4d73f9ec8', 15, 'be3c01a7-3bd0-448c-844b-583bd824c90b', 'af854064-078a-4f50-af1d-8744e866751e', '2024-09-05 12:54:46.787474', '2024-09-05 12:54:46.787474');
INSERT INTO public.exercise_example_bundles VALUES ('e1cb1276-8fa3-4f65-9d56-bd930006b3ed', 40, '1dcd59ab-674e-49d8-9a06-9c17c2a05730', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-05 12:56:19.204431', '2024-09-05 12:56:19.204431');
INSERT INTO public.exercise_example_bundles VALUES ('5bd268c8-7ccf-4059-94a9-349445e724fd', 20, '1dcd59ab-674e-49d8-9a06-9c17c2a05730', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-05 12:56:19.204431', '2024-09-05 12:56:19.204431');
INSERT INTO public.exercise_example_bundles VALUES ('272762c2-0aee-4198-84e9-58f9b99a1fdc', 10, '1dcd59ab-674e-49d8-9a06-9c17c2a05730', 'af854064-078a-4f50-af1d-8744e866751e', '2024-09-05 12:56:19.204431', '2024-09-05 12:56:19.204431');
INSERT INTO public.exercise_example_bundles VALUES ('d7676ecb-cdef-4441-8479-3d1a42acecad', 10, '1dcd59ab-674e-49d8-9a06-9c17c2a05730', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-05 12:56:19.204431', '2024-09-05 12:56:19.204431');
INSERT INTO public.exercise_example_bundles VALUES ('f4c18b16-3563-46d5-8062-56af109acd74', 10, '1dcd59ab-674e-49d8-9a06-9c17c2a05730', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-05 12:56:19.204431', '2024-09-05 12:56:19.204431');
INSERT INTO public.exercise_example_bundles VALUES ('5817e3d5-ffd4-4543-a12e-237d876f1339', 5, '1dcd59ab-674e-49d8-9a06-9c17c2a05730', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-05 12:56:19.204431', '2024-09-05 12:56:19.204431');
INSERT INTO public.exercise_example_bundles VALUES ('3f44efad-9c7d-4110-976b-144eb6029d60', 5, '1dcd59ab-674e-49d8-9a06-9c17c2a05730', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-05 12:56:19.204431', '2024-09-05 12:56:19.204431');
INSERT INTO public.exercise_example_bundles VALUES ('2f390946-0d11-4488-b65a-60a3169fdb1d', 100, '05b3842c-2a19-484e-bae3-a12e86c2fa4c', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-05 12:59:02.107348', '2024-09-05 12:59:02.107348');
INSERT INTO public.exercise_example_bundles VALUES ('bc31176a-f375-4478-80c6-f79ab1be7128', 45, 'ad98534e-b2d9-4fef-9983-578ef12b28f7', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-05 13:05:01.297358', '2024-09-05 13:05:01.297358');
INSERT INTO public.exercise_example_bundles VALUES ('72059e17-0f4e-4509-8c61-87fd6cc970ab', 15, 'ad98534e-b2d9-4fef-9983-578ef12b28f7', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-05 13:05:01.297358', '2024-09-05 13:05:01.297358');
INSERT INTO public.exercise_example_bundles VALUES ('f5e048f1-610b-4e8b-bd50-ba69149702e2', 10, 'ad98534e-b2d9-4fef-9983-578ef12b28f7', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-05 13:05:01.297358', '2024-09-05 13:05:01.297358');
INSERT INTO public.exercise_example_bundles VALUES ('7ec3e174-07a2-4b61-bb7b-c5153eeaf639', 10, 'ad98534e-b2d9-4fef-9983-578ef12b28f7', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-05 13:05:01.297358', '2024-09-05 13:05:01.297358');
INSERT INTO public.exercise_example_bundles VALUES ('dcdcd2b2-9fed-46ee-9777-aab8aa9ec6dd', 7, 'ad98534e-b2d9-4fef-9983-578ef12b28f7', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-05 13:05:01.297358', '2024-09-05 13:05:01.297358');
INSERT INTO public.exercise_example_bundles VALUES ('94e52c10-6026-4e84-81d6-20d125dfd0bc', 5, 'ad98534e-b2d9-4fef-9983-578ef12b28f7', 'fa8025e6-e106-475c-8b9d-77831132fb47', '2024-09-05 13:05:01.297358', '2024-09-05 13:05:01.297358');
INSERT INTO public.exercise_example_bundles VALUES ('6edb3c8c-38bf-4022-80e4-577de7362360', 5, 'ad98534e-b2d9-4fef-9983-578ef12b28f7', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-05 13:05:01.297358', '2024-09-05 13:05:01.297358');
INSERT INTO public.exercise_example_bundles VALUES ('f4840fe0-6586-48a6-bed7-afacceeb8242', 3, 'ad98534e-b2d9-4fef-9983-578ef12b28f7', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-05 13:05:01.297358', '2024-09-05 13:05:01.297358');
INSERT INTO public.exercise_example_bundles VALUES ('9d59ae3c-a960-4905-91be-12bc650b2612', 50, 'b5c6e6a6-6eec-422c-ad4a-8dca82287312', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-05 13:06:37.166724', '2024-09-05 13:06:37.166724');
INSERT INTO public.exercise_example_bundles VALUES ('6a2e5043-8903-4113-8a02-f9994811602d', 20, 'b5c6e6a6-6eec-422c-ad4a-8dca82287312', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-05 13:06:37.166724', '2024-09-05 13:06:37.166724');
INSERT INTO public.exercise_example_bundles VALUES ('bba26f13-e47c-4151-af35-eb5ee59c0805', 10, 'b5c6e6a6-6eec-422c-ad4a-8dca82287312', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-05 13:06:37.166724', '2024-09-05 13:06:37.166724');
INSERT INTO public.exercise_example_bundles VALUES ('e8f4405f-65e1-495b-9a48-34c5f73f21b2', 8, 'b5c6e6a6-6eec-422c-ad4a-8dca82287312', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-05 13:06:37.166724', '2024-09-05 13:06:37.166724');
INSERT INTO public.exercise_example_bundles VALUES ('12299097-0fe2-4bfa-92dd-0306811e0c43', 5, 'b5c6e6a6-6eec-422c-ad4a-8dca82287312', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-05 13:06:37.166724', '2024-09-05 13:06:37.166724');
INSERT INTO public.exercise_example_bundles VALUES ('d0aa9220-4a4c-4d00-82d0-5ae7f5daa45d', 4, 'b5c6e6a6-6eec-422c-ad4a-8dca82287312', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-05 13:06:37.166724', '2024-09-05 13:06:37.166724');
INSERT INTO public.exercise_example_bundles VALUES ('9500c7da-8e02-4c92-ab20-95a09baf0dce', 3, 'b5c6e6a6-6eec-422c-ad4a-8dca82287312', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-05 13:06:37.166724', '2024-09-05 13:06:37.166724');
INSERT INTO public.exercise_example_bundles VALUES ('7f71d91d-375e-438b-9750-cd754633912b', 100, '9b3f9b20-544d-49e1-880e-879e24e81581', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-05 13:08:00.585569', '2024-09-05 13:08:00.585569');
INSERT INTO public.exercise_example_bundles VALUES ('447e297b-fe5a-4d05-b707-0cb3d31ace56', 40, '12070323-971e-421a-9eaf-bdce4f8e0464', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-05 13:10:41.481258', '2024-09-05 13:10:41.481258');
INSERT INTO public.exercise_example_bundles VALUES ('319abf7d-062b-452d-894a-b9654e4c9ee3', 15, '12070323-971e-421a-9eaf-bdce4f8e0464', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-05 13:10:41.481258', '2024-09-05 13:10:41.481258');
INSERT INTO public.exercise_example_bundles VALUES ('d1686678-da2d-4c22-a8c6-67b46cea3dc3', 10, '12070323-971e-421a-9eaf-bdce4f8e0464', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-05 13:10:41.481258', '2024-09-05 13:10:41.481258');
INSERT INTO public.exercise_example_bundles VALUES ('143018a5-7f18-4962-b553-6ba01a1d2c32', 10, '12070323-971e-421a-9eaf-bdce4f8e0464', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-05 13:10:41.481258', '2024-09-05 13:10:41.481258');
INSERT INTO public.exercise_example_bundles VALUES ('6a5b282f-37cc-4487-a745-30788a1a554b', 5, '12070323-971e-421a-9eaf-bdce4f8e0464', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-05 13:10:41.481258', '2024-09-05 13:10:41.481258');
INSERT INTO public.exercise_example_bundles VALUES ('b2b18c0b-f6b1-495f-9e7c-7bcee8dd26ec', 5, '12070323-971e-421a-9eaf-bdce4f8e0464', 'fa8025e6-e106-475c-8b9d-77831132fb47', '2024-09-05 13:10:41.481258', '2024-09-05 13:10:41.481258');
INSERT INTO public.exercise_example_bundles VALUES ('7f637036-e75b-4f95-a576-df4e6a4a45c5', 5, '12070323-971e-421a-9eaf-bdce4f8e0464', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-05 13:10:41.481258', '2024-09-05 13:10:41.481258');
INSERT INTO public.exercise_example_bundles VALUES ('6e483253-db76-4ff5-99df-710b4e9e7577', 5, '12070323-971e-421a-9eaf-bdce4f8e0464', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-05 13:10:41.481258', '2024-09-05 13:10:41.481258');
INSERT INTO public.exercise_example_bundles VALUES ('ad0a2f1b-b30a-4b2b-a9e7-321cecbac09d', 5, '12070323-971e-421a-9eaf-bdce4f8e0464', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-05 13:10:41.481258', '2024-09-05 13:10:41.481258');
INSERT INTO public.exercise_example_bundles VALUES ('4588e1ee-71e6-49d3-a675-d5e2657009e4', 40, '379d64cd-24bf-4a81-9b97-936c9a088e17', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-05 13:12:38.910309', '2024-09-05 13:12:38.910309');
INSERT INTO public.exercise_example_bundles VALUES ('468c3db9-3af7-4d62-9f15-a756663f3411', 15, '379d64cd-24bf-4a81-9b97-936c9a088e17', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-05 13:12:38.910309', '2024-09-05 13:12:38.910309');
INSERT INTO public.exercise_example_bundles VALUES ('68d5c2f0-1cb8-40cb-afe4-6a2a32bee1c2', 10, '379d64cd-24bf-4a81-9b97-936c9a088e17', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-05 13:12:38.910309', '2024-09-05 13:12:38.910309');
INSERT INTO public.exercise_example_bundles VALUES ('3fa4e33a-3dcc-4524-8c01-d79cc019a712', 7, '379d64cd-24bf-4a81-9b97-936c9a088e17', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-05 13:12:38.910309', '2024-09-05 13:12:38.910309');
INSERT INTO public.exercise_example_bundles VALUES ('48eca50d-76a6-47e9-a78a-38348474e689', 8, '379d64cd-24bf-4a81-9b97-936c9a088e17', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-05 13:12:38.910309', '2024-09-05 13:12:38.910309');
INSERT INTO public.exercise_example_bundles VALUES ('ba8c3a56-d44c-499c-93a9-97c87734ebb4', 5, '379d64cd-24bf-4a81-9b97-936c9a088e17', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-05 13:12:38.910309', '2024-09-05 13:12:38.910309');
INSERT INTO public.exercise_example_bundles VALUES ('4365efab-34bc-4673-9f65-0466844939c6', 5, '379d64cd-24bf-4a81-9b97-936c9a088e17', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-05 13:12:38.910309', '2024-09-05 13:12:38.910309');
INSERT INTO public.exercise_example_bundles VALUES ('988238b3-fec8-4889-a426-b03477dcc36a', 5, '379d64cd-24bf-4a81-9b97-936c9a088e17', 'fa8025e6-e106-475c-8b9d-77831132fb47', '2024-09-05 13:12:38.910309', '2024-09-05 13:12:38.910309');
INSERT INTO public.exercise_example_bundles VALUES ('cdb08ccc-75b5-43f5-bf41-a79a38a7cbf4', 5, '379d64cd-24bf-4a81-9b97-936c9a088e17', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-05 13:12:38.910309', '2024-09-05 13:12:38.910309');
INSERT INTO public.exercise_example_bundles VALUES ('a3626612-00a0-4f73-ac78-f51cb8fbd346', 45, '04d3e242-807d-4cba-9be4-e3d11a8efbc4', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-05 13:33:56.327812', '2024-09-05 13:33:56.327812');
INSERT INTO public.exercise_example_bundles VALUES ('59bfe0db-76dc-4c29-853a-f48e13cd301d', 20, '04d3e242-807d-4cba-9be4-e3d11a8efbc4', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-05 13:33:56.327812', '2024-09-05 13:33:56.327812');
INSERT INTO public.exercise_example_bundles VALUES ('e75dde46-83c5-4c9a-a625-f95f80aa1c30', 15, '04d3e242-807d-4cba-9be4-e3d11a8efbc4', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-05 13:33:56.327812', '2024-09-05 13:33:56.327812');
INSERT INTO public.exercise_example_bundles VALUES ('cbae1be5-9872-46c8-b20b-0a5c6c7f75f4', 10, '04d3e242-807d-4cba-9be4-e3d11a8efbc4', '57559b71-b757-468a-983d-a1b3cec4acef', '2024-09-05 13:33:56.327812', '2024-09-05 13:33:56.327812');
INSERT INTO public.exercise_example_bundles VALUES ('a19faf4e-0695-4235-af9a-2aadbef4f657', 5, '04d3e242-807d-4cba-9be4-e3d11a8efbc4', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-05 13:33:56.327812', '2024-09-05 13:33:56.327812');
INSERT INTO public.exercise_example_bundles VALUES ('a78eeaf2-da99-41aa-af19-e1b3f51b276a', 5, '04d3e242-807d-4cba-9be4-e3d11a8efbc4', 'fa8025e6-e106-475c-8b9d-77831132fb47', '2024-09-05 13:33:56.327812', '2024-09-05 13:33:56.327812');
INSERT INTO public.exercise_example_bundles VALUES ('e8793fda-b9b5-4591-9a1e-932fb3a8b4d0', 35, 'ca38bcba-658f-4c7a-be54-b2c3f845fbe0', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-05 13:37:08.612465', '2024-09-05 13:37:08.612465');
INSERT INTO public.exercise_example_bundles VALUES ('a68eaaf1-8ebe-484d-89a8-6578f1d1a043', 20, 'ca38bcba-658f-4c7a-be54-b2c3f845fbe0', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-05 13:37:08.612465', '2024-09-05 13:37:08.612465');
INSERT INTO public.exercise_example_bundles VALUES ('fb83eccf-c0ab-41a6-84c0-a7bc2ad35dd2', 10, 'ca38bcba-658f-4c7a-be54-b2c3f845fbe0', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-05 13:37:08.612465', '2024-09-05 13:37:08.612465');
INSERT INTO public.exercise_example_bundles VALUES ('aa549ad5-916b-4d80-8b9e-6fe464682741', 10, 'ca38bcba-658f-4c7a-be54-b2c3f845fbe0', 'fa8025e6-e106-475c-8b9d-77831132fb47', '2024-09-05 13:37:08.612465', '2024-09-05 13:37:08.612465');
INSERT INTO public.exercise_example_bundles VALUES ('2ae9267f-035d-47af-bdd3-5ff29d1b2f93', 8, 'ca38bcba-658f-4c7a-be54-b2c3f845fbe0', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-05 13:37:08.612465', '2024-09-05 13:37:08.612465');
INSERT INTO public.exercise_example_bundles VALUES ('7984788e-00a5-4a8c-8296-84dce0215644', 7, 'ca38bcba-658f-4c7a-be54-b2c3f845fbe0', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-05 13:37:08.612465', '2024-09-05 13:37:08.612465');
INSERT INTO public.exercise_example_bundles VALUES ('12bee044-c9db-4696-a7b8-0cd7b3829af5', 5, 'ca38bcba-658f-4c7a-be54-b2c3f845fbe0', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-05 13:37:08.612465', '2024-09-05 13:37:08.612465');
INSERT INTO public.exercise_example_bundles VALUES ('4ef43474-2e7d-45f6-9738-e4ef20a0531a', 5, 'ca38bcba-658f-4c7a-be54-b2c3f845fbe0', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-05 13:37:08.612465', '2024-09-05 13:37:08.612465');
INSERT INTO public.exercise_example_bundles VALUES ('573f26e3-4b64-4bc2-b24d-71f93851f779', 60, 'f11ef4dd-cc6b-42ad-844d-0e94cef691f0', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-05 13:38:49.27546', '2024-09-05 13:38:49.27546');
INSERT INTO public.exercise_example_bundles VALUES ('a1b482fd-16a1-4881-aa94-63c8cf09ee9b', 20, 'f11ef4dd-cc6b-42ad-844d-0e94cef691f0', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-05 13:38:49.27546', '2024-09-05 13:38:49.27546');
INSERT INTO public.exercise_example_bundles VALUES ('52cc8414-03dc-4088-8307-cb46f5d5582b', 10, 'f11ef4dd-cc6b-42ad-844d-0e94cef691f0', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-05 13:38:49.27546', '2024-09-05 13:38:49.27546');
INSERT INTO public.exercise_example_bundles VALUES ('9c3d9abc-bc57-4d47-8ced-bfecc08e6f0f', 5, 'f11ef4dd-cc6b-42ad-844d-0e94cef691f0', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-05 13:38:49.27546', '2024-09-05 13:38:49.27546');
INSERT INTO public.exercise_example_bundles VALUES ('0507da20-e4ba-46c0-9125-ac3721998498', 5, 'f11ef4dd-cc6b-42ad-844d-0e94cef691f0', 'fa8025e6-e106-475c-8b9d-77831132fb47', '2024-09-05 13:38:49.27546', '2024-09-05 13:38:49.27546');
INSERT INTO public.exercise_example_bundles VALUES ('8dfc7666-e826-41b8-a14c-3d68480c0e67', 5, '4a2c7160-6cf2-456d-8ef4-80040b720420', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-06 11:18:17.204717', '2024-09-06 11:18:17.204717');
INSERT INTO public.exercise_example_bundles VALUES ('3edf6550-61ba-4a11-8a1c-5bae1fd52fdf', 5, '4a2c7160-6cf2-456d-8ef4-80040b720420', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-06 11:18:17.204717', '2024-09-06 11:18:17.204717');
INSERT INTO public.exercise_example_bundles VALUES ('6f37f1c9-1a67-4a39-bce5-24099deeb3d7', 65, '93c687ff-68f2-44d0-9f3a-8c4c15c960e8', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-06 11:21:03.166194', '2024-09-06 11:21:03.166194');
INSERT INTO public.exercise_example_bundles VALUES ('f722506d-066d-4a04-b940-0ee70a63d430', 15, '93c687ff-68f2-44d0-9f3a-8c4c15c960e8', 'be38dcef-1bc8-487b-a44f-96df1ab9e68c', '2024-09-06 11:21:03.166194', '2024-09-06 11:21:03.166194');
INSERT INTO public.exercise_example_bundles VALUES ('28c87efa-199b-45d7-89c5-da28dd60826e', 10, '93c687ff-68f2-44d0-9f3a-8c4c15c960e8', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-06 11:21:03.166194', '2024-09-06 11:21:03.166194');
INSERT INTO public.exercise_example_bundles VALUES ('4a9cc7c5-3094-43ae-9c6a-822da6bd7fc4', 5, '93c687ff-68f2-44d0-9f3a-8c4c15c960e8', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-06 11:21:03.166194', '2024-09-06 11:21:03.166194');
INSERT INTO public.exercise_example_bundles VALUES ('6a0923e7-8571-4f93-8783-732f62353310', 5, '93c687ff-68f2-44d0-9f3a-8c4c15c960e8', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-06 11:21:03.166194', '2024-09-06 11:21:03.166194');
INSERT INTO public.exercise_example_bundles VALUES ('c3252c5a-9d70-4a95-bcd9-33ead66ec1d0', 50, '676f21e5-7b5a-4c11-a505-4545822673de', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-05 13:42:24.38038', '2024-09-05 13:42:24.38038');
INSERT INTO public.exercise_example_bundles VALUES ('f786ba22-3c42-4a77-bf4e-dd30600e207a', 15, '676f21e5-7b5a-4c11-a505-4545822673de', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-05 13:42:24.38038', '2024-09-05 13:42:24.38038');
INSERT INTO public.exercise_example_bundles VALUES ('000b177a-6079-40d2-a8a6-611b6c8c6b59', 10, '676f21e5-7b5a-4c11-a505-4545822673de', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-05 13:42:24.38038', '2024-09-05 13:42:24.38038');
INSERT INTO public.exercise_example_bundles VALUES ('3201207c-8b2b-4756-b568-7150774e9ce9', 8, '676f21e5-7b5a-4c11-a505-4545822673de', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-05 13:42:24.38038', '2024-09-05 13:42:24.38038');
INSERT INTO public.exercise_example_bundles VALUES ('4c83d473-aac3-40dd-bc3f-43222a9d47af', 5, '676f21e5-7b5a-4c11-a505-4545822673de', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-05 13:42:24.38038', '2024-09-05 13:42:24.38038');
INSERT INTO public.exercise_example_bundles VALUES ('369774ae-3fa5-49ba-8fe4-efbf2a96caaf', 5, '676f21e5-7b5a-4c11-a505-4545822673de', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-05 13:42:24.38038', '2024-09-05 13:42:24.38038');
INSERT INTO public.exercise_example_bundles VALUES ('7fd9da8d-9d60-4727-a482-bf535b081879', 4, '676f21e5-7b5a-4c11-a505-4545822673de', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-05 13:42:24.38038', '2024-09-05 13:42:24.38038');
INSERT INTO public.exercise_example_bundles VALUES ('092058c5-ce41-44a2-9096-594578eafeab', 3, '676f21e5-7b5a-4c11-a505-4545822673de', 'fa8025e6-e106-475c-8b9d-77831132fb47', '2024-09-05 13:42:24.38038', '2024-09-05 13:42:24.38038');
INSERT INTO public.exercise_example_bundles VALUES ('40dd069b-411c-47bd-927e-acb092e8f8a4', 50, 'c18b086c-b0c3-4d1c-a6a3-2653e36c5dff', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-05 13:44:20.961447', '2024-09-05 13:44:20.961447');
INSERT INTO public.exercise_example_bundles VALUES ('11b0a348-8fb1-43d3-96e3-954724791249', 15, 'c18b086c-b0c3-4d1c-a6a3-2653e36c5dff', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-05 13:44:20.961447', '2024-09-05 13:44:20.961447');
INSERT INTO public.exercise_example_bundles VALUES ('0c2f2725-ba0d-4863-b9e9-d2c4690849c8', 10, 'c18b086c-b0c3-4d1c-a6a3-2653e36c5dff', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-05 13:44:20.961447', '2024-09-05 13:44:20.961447');
INSERT INTO public.exercise_example_bundles VALUES ('ec3ab52c-48ac-4054-8184-d3e97cc629b3', 8, 'c18b086c-b0c3-4d1c-a6a3-2653e36c5dff', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-05 13:44:20.961447', '2024-09-05 13:44:20.961447');
INSERT INTO public.exercise_example_bundles VALUES ('74008a11-0824-4a11-b5ee-6f55972c6f25', 5, 'c18b086c-b0c3-4d1c-a6a3-2653e36c5dff', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-05 13:44:20.961447', '2024-09-05 13:44:20.961447');
INSERT INTO public.exercise_example_bundles VALUES ('e565a702-d85f-4402-9ebd-daf0ee67af5b', 5, 'c18b086c-b0c3-4d1c-a6a3-2653e36c5dff', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-05 13:44:20.961447', '2024-09-05 13:44:20.961447');
INSERT INTO public.exercise_example_bundles VALUES ('93e28c5e-936c-43a7-b5b2-5de9169c5585', 4, 'c18b086c-b0c3-4d1c-a6a3-2653e36c5dff', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-05 13:44:20.961447', '2024-09-05 13:44:20.961447');
INSERT INTO public.exercise_example_bundles VALUES ('b8394291-cd16-408e-9c0f-d1e81557dec9', 3, 'c18b086c-b0c3-4d1c-a6a3-2653e36c5dff', 'fa8025e6-e106-475c-8b9d-77831132fb47', '2024-09-05 13:44:20.961447', '2024-09-05 13:44:20.961447');
INSERT INTO public.exercise_example_bundles VALUES ('1b50bce5-dddc-4205-a9af-a7b0978ff5f7', 55, '738d7264-00af-48dd-a475-3c4d12e28188', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-06 21:19:43.236977', '2024-09-06 21:19:43.236977');
INSERT INTO public.exercise_example_bundles VALUES ('5eb93ce4-b597-4553-9961-a071ca7cd75c', 10, '738d7264-00af-48dd-a475-3c4d12e28188', 'be38dcef-1bc8-487b-a44f-96df1ab9e68c', '2024-09-06 21:19:43.236977', '2024-09-06 21:19:43.236977');
INSERT INTO public.exercise_example_bundles VALUES ('be6dda29-d6e5-4012-8796-131b8a4fffd6', 15, '738d7264-00af-48dd-a475-3c4d12e28188', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-06 21:19:43.236977', '2024-09-06 21:19:43.236977');
INSERT INTO public.exercise_example_bundles VALUES ('95790dff-e412-4d24-b17a-79b42de69b79', 10, '738d7264-00af-48dd-a475-3c4d12e28188', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-06 21:19:43.236977', '2024-09-06 21:19:43.236977');
INSERT INTO public.exercise_example_bundles VALUES ('0762b8ba-4468-443c-a2d8-5579b7bbf3eb', 5, '738d7264-00af-48dd-a475-3c4d12e28188', 'af854064-078a-4f50-af1d-8744e866751e', '2024-09-06 21:19:43.236977', '2024-09-06 21:19:43.236977');
INSERT INTO public.exercise_example_bundles VALUES ('622b8031-1c1b-49c9-9e63-f3762df8d02e', 60, '6115df45-ddad-4fa6-bfb0-1c0cd72de766', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-05 13:49:52.432525', '2024-09-05 13:49:52.432525');
INSERT INTO public.exercise_example_bundles VALUES ('a8594500-ecb4-46fe-b22f-4e379f6ae596', 20, '6115df45-ddad-4fa6-bfb0-1c0cd72de766', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-05 13:49:52.432525', '2024-09-05 13:49:52.432525');
INSERT INTO public.exercise_example_bundles VALUES ('363bed68-7c64-466b-849a-ad66e8845ef9', 10, '6115df45-ddad-4fa6-bfb0-1c0cd72de766', 'af854064-078a-4f50-af1d-8744e866751e', '2024-09-05 13:49:52.432525', '2024-09-05 13:49:52.432525');
INSERT INTO public.exercise_example_bundles VALUES ('5151da34-47fc-4816-896a-1ec8007d3588', 10, '6115df45-ddad-4fa6-bfb0-1c0cd72de766', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-05 13:49:52.432525', '2024-09-05 13:49:52.432525');
INSERT INTO public.exercise_example_bundles VALUES ('0416a5e7-c3b1-4d20-9063-b1256253676a', 5, '738d7264-00af-48dd-a475-3c4d12e28188', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-06 21:19:43.236977', '2024-09-06 21:19:43.236977');
INSERT INTO public.exercise_example_bundles VALUES ('7668a9ca-f5cb-4aba-a902-f36a2367ccfd', 65, 'e84c6031-9d71-41a1-ae2c-6c9901ea1d6b', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-06 21:22:25.310157', '2024-09-06 21:22:25.310157');
INSERT INTO public.exercise_example_bundles VALUES ('7c5536a5-7f46-44ef-9832-f22c868a623d', 15, 'e84c6031-9d71-41a1-ae2c-6c9901ea1d6b', 'be38dcef-1bc8-487b-a44f-96df1ab9e68c', '2024-09-06 21:22:25.310157', '2024-09-06 21:22:25.310157');
INSERT INTO public.exercise_example_bundles VALUES ('61ed68e2-b998-4448-bf83-8b01c97bd882', 10, 'e84c6031-9d71-41a1-ae2c-6c9901ea1d6b', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-06 21:22:25.310157', '2024-09-06 21:22:25.310157');
INSERT INTO public.exercise_example_bundles VALUES ('0064cdf1-41c9-48b7-a1c2-98e2264764b9', 5, 'e84c6031-9d71-41a1-ae2c-6c9901ea1d6b', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-06 21:22:25.310157', '2024-09-06 21:22:25.310157');
INSERT INTO public.exercise_example_bundles VALUES ('2b814e64-5335-4973-bc6a-1d53c120325d', 5, 'e84c6031-9d71-41a1-ae2c-6c9901ea1d6b', 'af854064-078a-4f50-af1d-8744e866751e', '2024-09-06 21:22:25.310157', '2024-09-06 21:22:25.310157');
INSERT INTO public.exercise_example_bundles VALUES ('febfc0ca-ed9c-42d9-9791-a5c966716037', 55, 'bd3338ee-1841-4686-a98c-3493ab9cfa7e', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-06 21:26:46.662273', '2024-09-06 21:26:46.662273');
INSERT INTO public.exercise_example_bundles VALUES ('38f8df08-24dd-41db-b825-0f44d862b8d8', 15, 'bd3338ee-1841-4686-a98c-3493ab9cfa7e', 'be38dcef-1bc8-487b-a44f-96df1ab9e68c', '2024-09-06 21:26:46.662273', '2024-09-06 21:26:46.662273');
INSERT INTO public.exercise_example_bundles VALUES ('f2983c8c-d27f-4350-bdf3-0a819679320b', 20, 'bd3338ee-1841-4686-a98c-3493ab9cfa7e', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-06 21:26:46.662273', '2024-09-06 21:26:46.662273');
INSERT INTO public.exercise_example_bundles VALUES ('b5b2a3b7-dc7b-44e0-9094-e8b7265ceead', 5, 'bd3338ee-1841-4686-a98c-3493ab9cfa7e', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-06 21:26:46.662273', '2024-09-06 21:26:46.662273');
INSERT INTO public.exercise_example_bundles VALUES ('aef507f6-100d-464c-b91b-b131cadf73f7', 5, 'bd3338ee-1841-4686-a98c-3493ab9cfa7e', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-06 21:26:46.662273', '2024-09-06 21:26:46.662273');
INSERT INTO public.exercise_example_bundles VALUES ('3b7afe47-0b45-4f4f-b3d0-255a5a0c1a91', 65, 'eaf575b3-2cb6-45a3-914f-81838c4c7e4d', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-06 21:28:12.845416', '2024-09-06 21:28:12.845416');
INSERT INTO public.exercise_example_bundles VALUES ('473b0af2-29f4-4a99-ae36-b8680a3ad5ca', 10, 'eaf575b3-2cb6-45a3-914f-81838c4c7e4d', 'be38dcef-1bc8-487b-a44f-96df1ab9e68c', '2024-09-06 21:28:12.845416', '2024-09-06 21:28:12.845416');
INSERT INTO public.exercise_example_bundles VALUES ('2fde2f4b-7bed-4ca6-a0bc-0a367ea24ea3', 55, 'f4041256-a9ac-430d-b611-d8a957e2aeb0', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-06 11:10:17.46328', '2024-09-06 11:10:17.46328');
INSERT INTO public.exercise_example_bundles VALUES ('dec0afde-24ac-4bcb-8453-0aebaea468da', 10, 'f4041256-a9ac-430d-b611-d8a957e2aeb0', 'be38dcef-1bc8-487b-a44f-96df1ab9e68c', '2024-09-06 11:10:17.46328', '2024-09-06 11:10:17.46328');
INSERT INTO public.exercise_example_bundles VALUES ('db53724b-0547-4883-9300-a0813b2af5a6', 10, 'f4041256-a9ac-430d-b611-d8a957e2aeb0', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-06 11:10:17.46328', '2024-09-06 11:10:17.46328');
INSERT INTO public.exercise_example_bundles VALUES ('52623943-4364-4c71-b207-bd8b4c1c5d2d', 10, 'f4041256-a9ac-430d-b611-d8a957e2aeb0', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-06 11:10:17.46328', '2024-09-06 11:10:17.46328');
INSERT INTO public.exercise_example_bundles VALUES ('33052402-98d2-4901-bb32-4224484099e1', 10, 'f4041256-a9ac-430d-b611-d8a957e2aeb0', 'af854064-078a-4f50-af1d-8744e866751e', '2024-09-06 11:10:17.46328', '2024-09-06 11:10:17.46328');
INSERT INTO public.exercise_example_bundles VALUES ('2d55299e-1d67-4aa7-af6c-baf457a301c1', 5, 'f4041256-a9ac-430d-b611-d8a957e2aeb0', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-06 11:10:17.46328', '2024-09-06 11:10:17.46328');
INSERT INTO public.exercise_example_bundles VALUES ('b626e61f-1aea-4cb7-a8e8-240205284164', 10, 'eaf575b3-2cb6-45a3-914f-81838c4c7e4d', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-06 21:28:12.845416', '2024-09-06 21:28:12.845416');
INSERT INTO public.exercise_example_bundles VALUES ('152cebdd-9694-4d20-9efc-39d81a79b890', 5, 'eaf575b3-2cb6-45a3-914f-81838c4c7e4d', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-06 21:28:12.845416', '2024-09-06 21:28:12.845416');
INSERT INTO public.exercise_example_bundles VALUES ('f17b7ae4-b9dc-4dd5-9881-7fed29e08042', 5, 'eaf575b3-2cb6-45a3-914f-81838c4c7e4d', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-06 21:28:12.845416', '2024-09-06 21:28:12.845416');
INSERT INTO public.exercise_example_bundles VALUES ('8e5f25c5-346c-42a2-855b-16b25b7f8702', 5, 'eaf575b3-2cb6-45a3-914f-81838c4c7e4d', 'af854064-078a-4f50-af1d-8744e866751e', '2024-09-06 21:28:12.845416', '2024-09-06 21:28:12.845416');
INSERT INTO public.exercise_example_bundles VALUES ('1999c5e5-1b9a-452f-8752-7a75751b780f', 60, '8e687b8b-0142-49f7-92e9-4d5df9aa86c9', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-06 11:15:01.146699', '2024-09-06 11:15:01.146699');
INSERT INTO public.exercise_example_bundles VALUES ('196ff6e4-96fb-4da5-9813-cfe47dd945f9', 15, '8e687b8b-0142-49f7-92e9-4d5df9aa86c9', 'be38dcef-1bc8-487b-a44f-96df1ab9e68c', '2024-09-06 11:15:01.146699', '2024-09-06 11:15:01.146699');
INSERT INTO public.exercise_example_bundles VALUES ('36f17b19-f223-4500-b307-49380b1d73a6', 10, '8e687b8b-0142-49f7-92e9-4d5df9aa86c9', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-06 11:15:01.146699', '2024-09-06 11:15:01.146699');
INSERT INTO public.exercise_example_bundles VALUES ('6a2666d4-7422-4da4-971c-4a6101fd074d', 10, '8e687b8b-0142-49f7-92e9-4d5df9aa86c9', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-06 11:15:01.146699', '2024-09-06 11:15:01.146699');
INSERT INTO public.exercise_example_bundles VALUES ('d276fa03-ab01-4860-aba8-5a4f6b574de1', 5, '8e687b8b-0142-49f7-92e9-4d5df9aa86c9', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-06 11:15:01.146699', '2024-09-06 11:15:01.146699');
INSERT INTO public.exercise_example_bundles VALUES ('2369c753-f2cf-4539-bdbe-8d9b99c6cae7', 65, 'c25a5f07-d65f-4ba9-9b0d-cb4d5b426455', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-06 21:31:44.430901', '2024-09-06 21:31:44.430901');
INSERT INTO public.exercise_example_bundles VALUES ('9e31db73-25cc-4119-9ea5-973d0859e61e', 10, 'c25a5f07-d65f-4ba9-9b0d-cb4d5b426455', 'be38dcef-1bc8-487b-a44f-96df1ab9e68c', '2024-09-06 21:31:44.430901', '2024-09-06 21:31:44.430901');
INSERT INTO public.exercise_example_bundles VALUES ('5d30d318-cbd7-49dc-9733-06a8509c1ed8', 15, 'c25a5f07-d65f-4ba9-9b0d-cb4d5b426455', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-06 21:31:44.430901', '2024-09-06 21:31:44.430901');
INSERT INTO public.exercise_example_bundles VALUES ('ef99c481-5701-4b35-a39d-90512d95e0c3', 5, 'c25a5f07-d65f-4ba9-9b0d-cb4d5b426455', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-06 21:31:44.430901', '2024-09-06 21:31:44.430901');
INSERT INTO public.exercise_example_bundles VALUES ('e8c11793-76d5-4948-84cb-1778f9df30d9', 5, 'c25a5f07-d65f-4ba9-9b0d-cb4d5b426455', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-06 21:31:44.430901', '2024-09-06 21:31:44.430901');
INSERT INTO public.exercise_example_bundles VALUES ('c18174dd-a173-4c90-84cf-466ab02c15e2', 65, '85a317d2-6cf2-4155-a6ea-a271afc4a803', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-06 21:35:46.031644', '2024-09-06 21:35:46.031644');
INSERT INTO public.exercise_example_bundles VALUES ('de586e58-2983-41fd-9649-8e31a08af7aa', 10, '85a317d2-6cf2-4155-a6ea-a271afc4a803', 'be38dcef-1bc8-487b-a44f-96df1ab9e68c', '2024-09-06 21:35:46.031644', '2024-09-06 21:35:46.031644');
INSERT INTO public.exercise_example_bundles VALUES ('11c00366-7ac8-4555-8f50-1cbe326933e7', 15, '85a317d2-6cf2-4155-a6ea-a271afc4a803', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-06 21:35:46.031644', '2024-09-06 21:35:46.031644');
INSERT INTO public.exercise_example_bundles VALUES ('8b485101-9e96-4ba3-ae06-d1a0d89e8465', 5, '85a317d2-6cf2-4155-a6ea-a271afc4a803', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-06 21:35:46.031644', '2024-09-06 21:35:46.031644');
INSERT INTO public.exercise_example_bundles VALUES ('b6fb6228-dedd-471d-a310-036d09afdf6a', 5, '85a317d2-6cf2-4155-a6ea-a271afc4a803', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-06 21:35:46.031644', '2024-09-06 21:35:46.031644');
INSERT INTO public.exercise_example_bundles VALUES ('04596653-eec9-4275-916b-6bc78bed79cd', 50, 'c1ca2c25-9148-4977-99fe-3acda0b4ad33', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-07 14:58:48.647073', '2024-09-07 14:58:48.647073');
INSERT INTO public.exercise_example_bundles VALUES ('df2f485c-e733-4556-8a28-b45cd0bcb795', 20, 'c1ca2c25-9148-4977-99fe-3acda0b4ad33', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-07 14:58:48.647073', '2024-09-07 14:58:48.647073');
INSERT INTO public.exercise_example_bundles VALUES ('0b2014c3-e8dc-4d18-bb78-004b599509e7', 10, 'c1ca2c25-9148-4977-99fe-3acda0b4ad33', 'be38dcef-1bc8-487b-a44f-96df1ab9e68c', '2024-09-07 14:58:48.647073', '2024-09-07 14:58:48.647073');
INSERT INTO public.exercise_example_bundles VALUES ('5f39b604-3f04-4d76-9f37-58075277a902', 10, 'c1ca2c25-9148-4977-99fe-3acda0b4ad33', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-07 14:58:48.647073', '2024-09-07 14:58:48.647073');
INSERT INTO public.exercise_example_bundles VALUES ('09cdada1-e4c0-412c-8cdd-7a002a9e1559', 5, 'c1ca2c25-9148-4977-99fe-3acda0b4ad33', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-07 14:58:48.647073', '2024-09-07 14:58:48.647073');
INSERT INTO public.exercise_example_bundles VALUES ('3f8c2b7c-4415-4876-9571-7150f1873cd2', 5, 'c1ca2c25-9148-4977-99fe-3acda0b4ad33', 'af854064-078a-4f50-af1d-8744e866751e', '2024-09-07 14:58:48.647073', '2024-09-07 14:58:48.647073');
INSERT INTO public.exercise_example_bundles VALUES ('0da5b130-2131-46e8-8e97-f74214341c9d', 45, '950cd0cd-fc3b-442f-aba9-3c48bfc6cda9', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-07 15:00:25.341203', '2024-09-07 15:00:25.341203');
INSERT INTO public.exercise_example_bundles VALUES ('4a5c0218-e1a6-4f70-b8bd-60203215b73b', 20, '950cd0cd-fc3b-442f-aba9-3c48bfc6cda9', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-07 15:00:25.341203', '2024-09-07 15:00:25.341203');
INSERT INTO public.exercise_example_bundles VALUES ('811e6032-c4b0-42e0-882f-998dea9f1302', 10, '950cd0cd-fc3b-442f-aba9-3c48bfc6cda9', 'be38dcef-1bc8-487b-a44f-96df1ab9e68c', '2024-09-07 15:00:25.341203', '2024-09-07 15:00:25.341203');
INSERT INTO public.exercise_example_bundles VALUES ('b4cba538-86b9-4c75-83a4-cfef1155ede2', 10, '950cd0cd-fc3b-442f-aba9-3c48bfc6cda9', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-07 15:00:25.341203', '2024-09-07 15:00:25.341203');
INSERT INTO public.exercise_example_bundles VALUES ('17fe6d62-9675-42ad-b51c-21c6c1afe600', 5, '950cd0cd-fc3b-442f-aba9-3c48bfc6cda9', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-07 15:00:25.341203', '2024-09-07 15:00:25.341203');
INSERT INTO public.exercise_example_bundles VALUES ('13d58d88-77fc-44a2-b3b3-4a0064e2b733', 5, '950cd0cd-fc3b-442f-aba9-3c48bfc6cda9', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-07 15:00:25.341203', '2024-09-07 15:00:25.341203');
INSERT INTO public.exercise_example_bundles VALUES ('ed2ca883-c717-445c-9f82-b4ae63296f13', 5, '950cd0cd-fc3b-442f-aba9-3c48bfc6cda9', 'af854064-078a-4f50-af1d-8744e866751e', '2024-09-07 15:00:25.341203', '2024-09-07 15:00:25.341203');
INSERT INTO public.exercise_example_bundles VALUES ('cff5f88c-0f99-474d-9f77-c39852770bd8', 45, '9c029423-aa52-4b90-97c0-f5d4b4574f12', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-07 15:02:05.995356', '2024-09-07 15:02:05.995356');
INSERT INTO public.exercise_example_bundles VALUES ('c9f95058-7ce7-4685-af59-4751a40fb825', 20, '9c029423-aa52-4b90-97c0-f5d4b4574f12', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-07 15:02:05.995356', '2024-09-07 15:02:05.995356');
INSERT INTO public.exercise_example_bundles VALUES ('babaa6a8-b402-4af0-9f3c-bf6e2187a279', 10, '9c029423-aa52-4b90-97c0-f5d4b4574f12', 'be38dcef-1bc8-487b-a44f-96df1ab9e68c', '2024-09-07 15:02:05.995356', '2024-09-07 15:02:05.995356');
INSERT INTO public.exercise_example_bundles VALUES ('cc176078-2705-4aeb-83ef-a630f7e0a50a', 10, '9c029423-aa52-4b90-97c0-f5d4b4574f12', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-07 15:02:05.995356', '2024-09-07 15:02:05.995356');
INSERT INTO public.exercise_example_bundles VALUES ('9a5f7be1-b516-455f-b4c4-2acde1e03a6c', 5, '9c029423-aa52-4b90-97c0-f5d4b4574f12', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-07 15:02:05.995356', '2024-09-07 15:02:05.995356');
INSERT INTO public.exercise_example_bundles VALUES ('70fe8445-b9ee-4d83-9a5f-9bfc0c49eed3', 5, '9c029423-aa52-4b90-97c0-f5d4b4574f12', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-07 15:02:05.995356', '2024-09-07 15:02:05.995356');
INSERT INTO public.exercise_example_bundles VALUES ('898eaf49-1cfc-4870-8daa-33e94b1d2d0c', 5, '9c029423-aa52-4b90-97c0-f5d4b4574f12', 'af854064-078a-4f50-af1d-8744e866751e', '2024-09-07 15:02:05.995356', '2024-09-07 15:02:05.995356');
INSERT INTO public.exercise_example_bundles VALUES ('931ce218-aa1c-4a4d-8108-f26316ba7358', 45, 'baa3f656-0ad7-422b-ba8b-e5e9f5d4cd63', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-07 15:06:50.267036', '2024-09-07 15:06:50.267036');
INSERT INTO public.exercise_example_bundles VALUES ('c6b38ff6-41ee-46df-ad51-43150d627569', 20, 'baa3f656-0ad7-422b-ba8b-e5e9f5d4cd63', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-07 15:06:50.267036', '2024-09-07 15:06:50.267036');
INSERT INTO public.exercise_example_bundles VALUES ('7ee1d9c4-da73-4837-9b65-9e83112815f5', 10, 'baa3f656-0ad7-422b-ba8b-e5e9f5d4cd63', 'be38dcef-1bc8-487b-a44f-96df1ab9e68c', '2024-09-07 15:06:50.267036', '2024-09-07 15:06:50.267036');
INSERT INTO public.exercise_example_bundles VALUES ('325eab79-9031-41c0-9cf7-71cedd59106b', 10, 'baa3f656-0ad7-422b-ba8b-e5e9f5d4cd63', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-07 15:06:50.267036', '2024-09-07 15:06:50.267036');
INSERT INTO public.exercise_example_bundles VALUES ('a4194639-4174-4bdd-a078-9b1d38eb6a46', 5, 'baa3f656-0ad7-422b-ba8b-e5e9f5d4cd63', 'af854064-078a-4f50-af1d-8744e866751e', '2024-09-07 15:06:50.267036', '2024-09-07 15:06:50.267036');
INSERT INTO public.exercise_example_bundles VALUES ('86974d77-0a14-44fd-bea2-7e9360f628ad', 5, 'baa3f656-0ad7-422b-ba8b-e5e9f5d4cd63', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-07 15:06:50.267036', '2024-09-07 15:06:50.267036');
INSERT INTO public.exercise_example_bundles VALUES ('e43c89c1-e7a6-48bd-a88b-3f7089906601', 50, '6389ce45-7d30-4372-8c29-e5816d893b1a', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-07 15:09:04.680336', '2024-09-07 15:09:04.680336');
INSERT INTO public.exercise_example_bundles VALUES ('a1e0ea08-9bee-42d7-9a39-447330f4b571', 25, '6389ce45-7d30-4372-8c29-e5816d893b1a', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-07 15:09:04.680336', '2024-09-07 15:09:04.680336');
INSERT INTO public.exercise_example_bundles VALUES ('d40ca442-e40b-4b0f-929f-805fe6fa491e', 10, '6389ce45-7d30-4372-8c29-e5816d893b1a', 'be38dcef-1bc8-487b-a44f-96df1ab9e68c', '2024-09-07 15:09:04.680336', '2024-09-07 15:09:04.680336');
INSERT INTO public.exercise_example_bundles VALUES ('4974131e-8cf4-4868-af44-ac0bb0fade14', 10, '6389ce45-7d30-4372-8c29-e5816d893b1a', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-07 15:09:04.680336', '2024-09-07 15:09:04.680336');
INSERT INTO public.exercise_example_bundles VALUES ('e6151c51-414d-4fb2-8e1e-63536ffb7c43', 5, '6389ce45-7d30-4372-8c29-e5816d893b1a', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-07 15:09:04.680336', '2024-09-07 15:09:04.680336');
INSERT INTO public.exercise_example_bundles VALUES ('16570ebf-21fc-432f-9fbe-739b3d09b190', 50, '31b8aa6a-448d-4e4c-bd1e-6386060b526e', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-07 15:12:48.568175', '2024-09-07 15:12:48.568175');
INSERT INTO public.exercise_example_bundles VALUES ('5dddf6a4-c55d-4fee-8fe0-6fbb53d0157c', 25, '31b8aa6a-448d-4e4c-bd1e-6386060b526e', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-07 15:12:48.568175', '2024-09-07 15:12:48.568175');
INSERT INTO public.exercise_example_bundles VALUES ('de809322-eb20-4328-ab2e-feb86176adb0', 10, '31b8aa6a-448d-4e4c-bd1e-6386060b526e', 'be38dcef-1bc8-487b-a44f-96df1ab9e68c', '2024-09-07 15:12:48.568175', '2024-09-07 15:12:48.568175');
INSERT INTO public.exercise_example_bundles VALUES ('b2906212-0664-4395-bb19-efa719e12453', 10, '31b8aa6a-448d-4e4c-bd1e-6386060b526e', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-07 15:12:48.568175', '2024-09-07 15:12:48.568175');
INSERT INTO public.exercise_example_bundles VALUES ('d18892d3-e778-43c4-a05f-7e80a3b660d2', 5, '31b8aa6a-448d-4e4c-bd1e-6386060b526e', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-07 15:12:48.568175', '2024-09-07 15:12:48.568175');
INSERT INTO public.exercise_example_bundles VALUES ('920a925e-69aa-4934-bc71-f8704ce94711', 45, '13826a3e-6b12-464c-95c8-5790f0e13947', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-07 15:16:24.608904', '2024-09-07 15:16:24.608904');
INSERT INTO public.exercise_example_bundles VALUES ('f64f99e2-5440-4122-b679-21dcb53ee9d4', 25, '13826a3e-6b12-464c-95c8-5790f0e13947', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-07 15:16:24.608904', '2024-09-07 15:16:24.608904');
INSERT INTO public.exercise_example_bundles VALUES ('8524bee1-b0cf-41d0-b17a-2489194041d0', 10, '13826a3e-6b12-464c-95c8-5790f0e13947', 'be38dcef-1bc8-487b-a44f-96df1ab9e68c', '2024-09-07 15:16:24.608904', '2024-09-07 15:16:24.608904');
INSERT INTO public.exercise_example_bundles VALUES ('b70ca8f2-d63e-4a4d-8ce7-e7f7cd912f73', 5, '13826a3e-6b12-464c-95c8-5790f0e13947', 'af854064-078a-4f50-af1d-8744e866751e', '2024-09-07 15:16:24.608904', '2024-09-07 15:16:24.608904');
INSERT INTO public.exercise_example_bundles VALUES ('d3c49568-4071-42de-9dbd-3abe5b2eabc4', 10, '13826a3e-6b12-464c-95c8-5790f0e13947', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-07 15:16:24.608904', '2024-09-07 15:16:24.608904');
INSERT INTO public.exercise_example_bundles VALUES ('dd9ff26f-e73d-44b4-84e4-9edda9748e6b', 5, '13826a3e-6b12-464c-95c8-5790f0e13947', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-07 15:16:24.608904', '2024-09-07 15:16:24.608904');
INSERT INTO public.exercise_example_bundles VALUES ('4ac63c29-f2f4-4934-ac64-c9176f9aa1d9', 50, '91f6781b-915e-4bb4-8d8c-e345aa66e42d', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-07 15:18:31.434096', '2024-09-07 15:18:31.434096');
INSERT INTO public.exercise_example_bundles VALUES ('1a89f13f-87ed-4aa4-b77a-8fb943eafd9b', 20, '91f6781b-915e-4bb4-8d8c-e345aa66e42d', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-07 15:18:31.434096', '2024-09-07 15:18:31.434096');
INSERT INTO public.exercise_example_bundles VALUES ('7ea3abc8-7fb1-4c6d-9794-c31d2c2e37f4', 10, '91f6781b-915e-4bb4-8d8c-e345aa66e42d', 'be38dcef-1bc8-487b-a44f-96df1ab9e68c', '2024-09-07 15:18:31.434096', '2024-09-07 15:18:31.434096');
INSERT INTO public.exercise_example_bundles VALUES ('5e01189f-946c-4ccf-b578-cbac38ebf909', 10, '91f6781b-915e-4bb4-8d8c-e345aa66e42d', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-07 15:18:31.434096', '2024-09-07 15:18:31.434096');
INSERT INTO public.exercise_example_bundles VALUES ('5fd33866-b3ef-4e1f-940e-285834e06adf', 5, '91f6781b-915e-4bb4-8d8c-e345aa66e42d', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-07 15:18:31.434096', '2024-09-07 15:18:31.434096');
INSERT INTO public.exercise_example_bundles VALUES ('323c5b2d-7cca-4826-a914-73756f585a0d', 5, '91f6781b-915e-4bb4-8d8c-e345aa66e42d', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-07 15:18:31.434096', '2024-09-07 15:18:31.434096');
INSERT INTO public.exercise_example_bundles VALUES ('f023984f-8be8-4ed7-b9d0-c6196790cf4d', 50, 'cbb152c0-ba9c-47ea-a8a3-28ad88f56eb6', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-07 15:29:18.465228', '2024-09-07 15:29:18.465228');
INSERT INTO public.exercise_example_bundles VALUES ('ee35a8f2-6720-4b6b-a1b8-c4fc21e45a52', 20, 'cbb152c0-ba9c-47ea-a8a3-28ad88f56eb6', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-07 15:29:18.465228', '2024-09-07 15:29:18.465228');
INSERT INTO public.exercise_example_bundles VALUES ('978e0673-772a-42f5-83d0-a0122f4a403b', 10, 'cbb152c0-ba9c-47ea-a8a3-28ad88f56eb6', 'be38dcef-1bc8-487b-a44f-96df1ab9e68c', '2024-09-07 15:29:18.465228', '2024-09-07 15:29:18.465228');
INSERT INTO public.exercise_example_bundles VALUES ('da69f56a-f402-4723-861e-56face3b8e46', 10, 'cbb152c0-ba9c-47ea-a8a3-28ad88f56eb6', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-07 15:29:18.465228', '2024-09-07 15:29:18.465228');
INSERT INTO public.exercise_example_bundles VALUES ('16f64440-dd6f-41cd-b527-8e67adefec95', 5, 'cbb152c0-ba9c-47ea-a8a3-28ad88f56eb6', 'af854064-078a-4f50-af1d-8744e866751e', '2024-09-07 15:29:18.465228', '2024-09-07 15:29:18.465228');
INSERT INTO public.exercise_example_bundles VALUES ('f0523dee-943b-4af5-80fb-12b760f279d1', 5, 'cbb152c0-ba9c-47ea-a8a3-28ad88f56eb6', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-07 15:29:18.465228', '2024-09-07 15:29:18.465228');
INSERT INTO public.exercise_example_bundles VALUES ('c43f2da6-54d9-4fc5-8601-5d7db179c894', 40, '0be1c49c-d742-4881-b014-360bc297af34', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-07 19:52:35.870322', '2024-09-07 19:52:35.870322');
INSERT INTO public.exercise_example_bundles VALUES ('bc8d7884-f6c6-40a1-bcc9-a462236736fd', 25, '0be1c49c-d742-4881-b014-360bc297af34', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-07 19:52:35.870322', '2024-09-07 19:52:35.870322');
INSERT INTO public.exercise_example_bundles VALUES ('9716a3aa-79ac-486d-b275-7ed98c0c4ac0', 10, '0be1c49c-d742-4881-b014-360bc297af34', 'be38dcef-1bc8-487b-a44f-96df1ab9e68c', '2024-09-07 19:52:35.870322', '2024-09-07 19:52:35.870322');
INSERT INTO public.exercise_example_bundles VALUES ('df471f0d-ecd5-438c-9e40-0feedd44dfc0', 15, '0be1c49c-d742-4881-b014-360bc297af34', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-07 19:52:35.870322', '2024-09-07 19:52:35.870322');
INSERT INTO public.exercise_example_bundles VALUES ('dfd92cee-9c81-43aa-9e87-d65c24369cc3', 5, '0be1c49c-d742-4881-b014-360bc297af34', 'af854064-078a-4f50-af1d-8744e866751e', '2024-09-07 19:52:35.870322', '2024-09-07 19:52:35.870322');
INSERT INTO public.exercise_example_bundles VALUES ('edf52bfc-d41c-4219-985e-27d0d4703e70', 5, '0be1c49c-d742-4881-b014-360bc297af34', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-07 19:52:35.870322', '2024-09-07 19:52:35.870322');
INSERT INTO public.exercise_example_bundles VALUES ('62d9110e-aa57-4c3a-9947-fcef8a37d6b3', 35, '8cccb149-8553-494d-bcb5-ffa9b06e7c0f', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-07 19:54:36.126896', '2024-09-07 19:54:36.126896');
INSERT INTO public.exercise_example_bundles VALUES ('f54a726c-1b88-4eaf-ac59-ce1063a8b9b6', 30, '8cccb149-8553-494d-bcb5-ffa9b06e7c0f', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-07 19:54:36.126896', '2024-09-07 19:54:36.126896');
INSERT INTO public.exercise_example_bundles VALUES ('bf542745-2401-4669-af05-4a8c380e728f', 10, '8cccb149-8553-494d-bcb5-ffa9b06e7c0f', 'be38dcef-1bc8-487b-a44f-96df1ab9e68c', '2024-09-07 19:54:36.126896', '2024-09-07 19:54:36.126896');
INSERT INTO public.exercise_example_bundles VALUES ('d02f2579-f3ec-4ad5-a234-7336f60f6d37', 15, '8cccb149-8553-494d-bcb5-ffa9b06e7c0f', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-07 19:54:36.126896', '2024-09-07 19:54:36.126896');
INSERT INTO public.exercise_example_bundles VALUES ('f3117807-fb8c-442d-b038-ceb037decd57', 5, '8cccb149-8553-494d-bcb5-ffa9b06e7c0f', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-07 19:54:36.126896', '2024-09-07 19:54:36.126896');
INSERT INTO public.exercise_example_bundles VALUES ('7aef49f0-2588-4a5a-be95-88389e961df6', 5, '8cccb149-8553-494d-bcb5-ffa9b06e7c0f', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-07 19:54:36.126896', '2024-09-07 19:54:36.126896');
INSERT INTO public.exercise_example_bundles VALUES ('cfff2662-0b53-499b-a21e-844feb5b845a', 35, '7470e789-9509-4e22-9078-67857074867d', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-07 19:56:54.237455', '2024-09-07 19:56:54.237455');
INSERT INTO public.exercise_example_bundles VALUES ('a11b891d-d55c-4934-bc12-1488bddfa9e9', 30, '7470e789-9509-4e22-9078-67857074867d', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-07 19:56:54.237455', '2024-09-07 19:56:54.237455');
INSERT INTO public.exercise_example_bundles VALUES ('3bb58d65-d91f-4d2a-b65a-bda55e3f19cb', 10, '7470e789-9509-4e22-9078-67857074867d', 'be38dcef-1bc8-487b-a44f-96df1ab9e68c', '2024-09-07 19:56:54.237455', '2024-09-07 19:56:54.237455');
INSERT INTO public.exercise_example_bundles VALUES ('304f458b-3945-41aa-a266-2c150fe3377e', 10, '7470e789-9509-4e22-9078-67857074867d', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-07 19:56:54.237455', '2024-09-07 19:56:54.237455');
INSERT INTO public.exercise_example_bundles VALUES ('b2c81681-e828-42d3-9b49-68f84d4ac1ad', 5, '7470e789-9509-4e22-9078-67857074867d', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-07 19:56:54.237455', '2024-09-07 19:56:54.237455');
INSERT INTO public.exercise_example_bundles VALUES ('1c45117c-eb4a-4759-b2b0-8713fbaf5dd6', 5, '7470e789-9509-4e22-9078-67857074867d', 'af854064-078a-4f50-af1d-8744e866751e', '2024-09-07 19:56:54.237455', '2024-09-07 19:56:54.237455');
INSERT INTO public.exercise_example_bundles VALUES ('7c8f53bd-bfc5-4a56-afa6-fd67b6495e9a', 5, '7470e789-9509-4e22-9078-67857074867d', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-07 19:56:54.237455', '2024-09-07 19:56:54.237455');
INSERT INTO public.exercise_example_bundles VALUES ('b566eca9-1aae-4cd4-a080-01ba6b2fa715', 35, '7976a83a-f4db-4cc5-9cac-7f16f2bc430f', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-07 19:58:28.342184', '2024-09-07 19:58:28.342184');
INSERT INTO public.exercise_example_bundles VALUES ('6e2ddd0d-c37c-4f9c-8d7c-285901101e2f', 30, '7976a83a-f4db-4cc5-9cac-7f16f2bc430f', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-07 19:58:28.342184', '2024-09-07 19:58:28.342184');
INSERT INTO public.exercise_example_bundles VALUES ('84c78846-89df-49e2-b923-652fe07dd433', 10, '7976a83a-f4db-4cc5-9cac-7f16f2bc430f', 'be38dcef-1bc8-487b-a44f-96df1ab9e68c', '2024-09-07 19:58:28.342184', '2024-09-07 19:58:28.342184');
INSERT INTO public.exercise_example_bundles VALUES ('3ce9e59e-30ca-47cc-8e54-3edd1c3bf95a', 10, '7976a83a-f4db-4cc5-9cac-7f16f2bc430f', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-07 19:58:28.342184', '2024-09-07 19:58:28.342184');
INSERT INTO public.exercise_example_bundles VALUES ('f6f39160-cfbf-461a-8225-9bf1ef231bc6', 5, '7976a83a-f4db-4cc5-9cac-7f16f2bc430f', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-07 19:58:28.342184', '2024-09-07 19:58:28.342184');
INSERT INTO public.exercise_example_bundles VALUES ('3d95cf7b-2bb7-41fa-abd8-30d0d643f274', 5, '7976a83a-f4db-4cc5-9cac-7f16f2bc430f', 'af854064-078a-4f50-af1d-8744e866751e', '2024-09-07 19:58:28.342184', '2024-09-07 19:58:28.342184');
INSERT INTO public.exercise_example_bundles VALUES ('9f9da2f0-fefd-42ff-9842-b6c6c2428f78', 5, '7976a83a-f4db-4cc5-9cac-7f16f2bc430f', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-07 19:58:28.342184', '2024-09-07 19:58:28.342184');
INSERT INTO public.exercise_example_bundles VALUES ('eac78cee-51e1-4a27-a832-62559a1448d0', 40, '6da53baf-d357-4392-927f-7da1bf7449dc', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-07 20:02:52.943146', '2024-09-07 20:02:52.943146');
INSERT INTO public.exercise_example_bundles VALUES ('55658ed4-29b8-4485-8728-3f3910f9b702', 35, '6da53baf-d357-4392-927f-7da1bf7449dc', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-07 20:02:52.943146', '2024-09-07 20:02:52.943146');
INSERT INTO public.exercise_example_bundles VALUES ('40845ab1-f237-4914-b632-af04c9571c01', 10, '6da53baf-d357-4392-927f-7da1bf7449dc', 'be38dcef-1bc8-487b-a44f-96df1ab9e68c', '2024-09-07 20:02:52.943146', '2024-09-07 20:02:52.943146');
INSERT INTO public.exercise_example_bundles VALUES ('2f233433-b9c2-46d0-81eb-1ed1a2695b34', 15, '6da53baf-d357-4392-927f-7da1bf7449dc', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-07 20:02:52.943146', '2024-09-07 20:02:52.943146');
INSERT INTO public.exercise_example_bundles VALUES ('ff330dd6-ab2a-4b74-9462-0e24969dac48', 35, '6bb0675d-eba0-496c-bd20-5fd11a4a0282', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-07 20:04:30.72297', '2024-09-07 20:04:30.72297');
INSERT INTO public.exercise_example_bundles VALUES ('aabb6dc5-a123-4083-9921-a16245de0fb4', 30, '6bb0675d-eba0-496c-bd20-5fd11a4a0282', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-07 20:04:30.72297', '2024-09-07 20:04:30.72297');
INSERT INTO public.exercise_example_bundles VALUES ('a7d61b05-b0d6-4fc7-8c9e-8fb2bac040e6', 10, '6bb0675d-eba0-496c-bd20-5fd11a4a0282', 'be38dcef-1bc8-487b-a44f-96df1ab9e68c', '2024-09-07 20:04:30.72297', '2024-09-07 20:04:30.72297');
INSERT INTO public.exercise_example_bundles VALUES ('5eac08d8-2126-4619-9060-79e4e3e46a92', 15, '6bb0675d-eba0-496c-bd20-5fd11a4a0282', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-07 20:04:30.72297', '2024-09-07 20:04:30.72297');
INSERT INTO public.exercise_example_bundles VALUES ('642b9c59-6a25-4ef4-bff8-9ea148b478ec', 10, '6bb0675d-eba0-496c-bd20-5fd11a4a0282', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-07 20:04:30.72297', '2024-09-07 20:04:30.72297');
INSERT INTO public.exercise_example_bundles VALUES ('3884f935-ed47-4fbc-a29b-17819f0476d8', 60, '5de5124e-8ebb-4477-b4b3-e1122cc80496', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-07 20:10:41.925041', '2024-09-07 20:10:41.925041');
INSERT INTO public.exercise_example_bundles VALUES ('a1205580-6024-4d08-837f-5c3880d0d401', 15, '5de5124e-8ebb-4477-b4b3-e1122cc80496', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-07 20:10:41.925041', '2024-09-07 20:10:41.925041');
INSERT INTO public.exercise_example_bundles VALUES ('bdf670db-b6e6-49ae-a2aa-b48274140080', 10, '5de5124e-8ebb-4477-b4b3-e1122cc80496', '97136fa7-622a-49d6-9d09-403a631d253d', '2024-09-07 20:10:41.925041', '2024-09-07 20:10:41.925041');
INSERT INTO public.exercise_example_bundles VALUES ('bc25ec75-3de0-4b73-82b4-99836e20163c', 10, '5de5124e-8ebb-4477-b4b3-e1122cc80496', 'be38dcef-1bc8-487b-a44f-96df1ab9e68c', '2024-09-07 20:10:41.925041', '2024-09-07 20:10:41.925041');
INSERT INTO public.exercise_example_bundles VALUES ('2b306687-a369-49c7-97ac-d3ad5f8955c6', 5, '5de5124e-8ebb-4477-b4b3-e1122cc80496', 'af854064-078a-4f50-af1d-8744e866751e', '2024-09-07 20:10:41.925041', '2024-09-07 20:10:41.925041');
INSERT INTO public.exercise_example_bundles VALUES ('735ac3f8-9efe-486d-9866-c479121bcead', 40, 'd180a698-a12e-4731-8234-b96e8f3ca7d9', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-07 20:15:00.943224', '2024-09-07 20:15:00.943224');
INSERT INTO public.exercise_example_bundles VALUES ('fb4640b6-b796-478e-b224-78d82f33f05c', 20, 'd180a698-a12e-4731-8234-b96e8f3ca7d9', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-07 20:15:00.943224', '2024-09-07 20:15:00.943224');
INSERT INTO public.exercise_example_bundles VALUES ('eb2b7f66-8ac3-4091-9e21-7cce0de95383', 15, 'd180a698-a12e-4731-8234-b96e8f3ca7d9', '97136fa7-622a-49d6-9d09-403a631d253d', '2024-09-07 20:15:00.943224', '2024-09-07 20:15:00.943224');
INSERT INTO public.exercise_example_bundles VALUES ('3c49e28d-a6fe-4f38-877f-d48ad5ea9358', 15, 'd180a698-a12e-4731-8234-b96e8f3ca7d9', '0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', '2024-09-07 20:15:00.943224', '2024-09-07 20:15:00.943224');
INSERT INTO public.exercise_example_bundles VALUES ('21bf1c29-d4bf-4923-a287-727384c935f8', 10, 'd180a698-a12e-4731-8234-b96e8f3ca7d9', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-07 20:15:00.943224', '2024-09-07 20:15:00.943224');
INSERT INTO public.exercise_example_bundles VALUES ('cf9e5e55-7b64-47d4-a802-dacb9143830e', 75, '49ef1d62-a375-485a-84bd-289a5548e81b', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-07 20:17:27.649577', '2024-09-07 20:17:27.649577');
INSERT INTO public.exercise_example_bundles VALUES ('d3dbe92e-2530-41ed-9334-3c54c30c031f', 15, '49ef1d62-a375-485a-84bd-289a5548e81b', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-07 20:17:27.649577', '2024-09-07 20:17:27.649577');
INSERT INTO public.exercise_example_bundles VALUES ('1e566253-18c1-42f3-84d3-49c279772349', 10, '49ef1d62-a375-485a-84bd-289a5548e81b', '97136fa7-622a-49d6-9d09-403a631d253d', '2024-09-07 20:17:27.649577', '2024-09-07 20:17:27.649577');
INSERT INTO public.exercise_example_bundles VALUES ('d617a7a4-abc6-4a98-b9c1-d8da53c90a1d', 90, 'abe543c6-ec69-49ad-b9ca-ef959ffa10f2', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-07 20:18:56.613425', '2024-09-07 20:18:56.613425');
INSERT INTO public.exercise_example_bundles VALUES ('66794ab8-14ad-4045-9a17-012ecf75ac9b', 10, 'abe543c6-ec69-49ad-b9ca-ef959ffa10f2', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-07 20:18:56.613425', '2024-09-07 20:18:56.613425');
INSERT INTO public.exercise_example_bundles VALUES ('402ef2ca-01e2-46d1-9b08-04b138ee617e', 90, 'cae7b841-a7f8-4973-baf0-4aadbbdcd0ca', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-07 20:20:03.755164', '2024-09-07 20:20:03.755164');
INSERT INTO public.exercise_example_bundles VALUES ('b69df3db-beff-4445-987b-2f66ef913bce', 10, 'cae7b841-a7f8-4973-baf0-4aadbbdcd0ca', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-07 20:20:03.755164', '2024-09-07 20:20:03.755164');
INSERT INTO public.exercise_example_bundles VALUES ('01ed8156-fa48-4ca5-af38-db7f94126131', 85, 'ad76d69c-5e90-4643-b507-9e9226d8b5cd', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-07 20:21:09.849007', '2024-09-07 20:21:09.849007');
INSERT INTO public.exercise_example_bundles VALUES ('e25f65d3-ab3a-45e4-80e1-6bc9629721b8', 15, 'ad76d69c-5e90-4643-b507-9e9226d8b5cd', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-07 20:21:09.849007', '2024-09-07 20:21:09.849007');
INSERT INTO public.exercise_example_bundles VALUES ('31754844-e40a-4144-8145-fce5e864d6ca', 85, 'f451289a-6d35-4926-981d-8ebae71741a2', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-07 20:22:58.472372', '2024-09-07 20:22:58.472372');
INSERT INTO public.exercise_example_bundles VALUES ('85c06814-73c9-4971-b219-4039f1ab2585', 15, 'f451289a-6d35-4926-981d-8ebae71741a2', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-07 20:22:58.472372', '2024-09-07 20:22:58.472372');
INSERT INTO public.exercise_example_bundles VALUES ('383206de-d0af-4659-b7ae-fbac8d1e6bb4', 60, '98791e1d-6029-4cb2-bcaf-611a337208ef', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-07 20:24:09.675744', '2024-09-07 20:24:09.675744');
INSERT INTO public.exercise_example_bundles VALUES ('470ed192-4f82-4963-898a-e91414d710f1', 20, '98791e1d-6029-4cb2-bcaf-611a337208ef', '831f39bd-80a8-4d11-9964-bde1788abae1', '2024-09-07 20:24:09.675744', '2024-09-07 20:24:09.675744');
INSERT INTO public.exercise_example_bundles VALUES ('1bfd0477-3207-40fa-bb18-1a48177acf00', 10, '98791e1d-6029-4cb2-bcaf-611a337208ef', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-07 20:24:09.675744', '2024-09-07 20:24:09.675744');
INSERT INTO public.exercise_example_bundles VALUES ('e75d5d14-ca6f-4d25-a538-9e0df26af7c6', 10, '98791e1d-6029-4cb2-bcaf-611a337208ef', '97136fa7-622a-49d6-9d09-403a631d253d', '2024-09-07 20:24:09.675744', '2024-09-07 20:24:09.675744');
INSERT INTO public.exercise_example_bundles VALUES ('6aae4415-bbc3-44a4-8b95-d907e67c8bcd', 40, '22df24eb-6bb7-45bc-ab46-9d6022eec774', '57559b71-b757-468a-983d-a1b3cec4acef', '2024-09-07 20:34:58.045285', '2024-09-07 20:34:58.045285');
INSERT INTO public.exercise_example_bundles VALUES ('5e750acc-b9c4-4c06-8ebc-c8ad2b7a9241', 20, '22df24eb-6bb7-45bc-ab46-9d6022eec774', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-07 20:34:58.045285', '2024-09-07 20:34:58.045285');
INSERT INTO public.exercise_example_bundles VALUES ('d945bc7e-d784-4402-9e54-103a92e9d11f', 15, '22df24eb-6bb7-45bc-ab46-9d6022eec774', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-07 20:34:58.045285', '2024-09-07 20:34:58.045285');
INSERT INTO public.exercise_example_bundles VALUES ('cf106642-d0d6-42ce-bb7e-63be5402e3ba', 10, '22df24eb-6bb7-45bc-ab46-9d6022eec774', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-07 20:34:58.045285', '2024-09-07 20:34:58.045285');
INSERT INTO public.exercise_example_bundles VALUES ('7b888edc-3b9d-4eea-8a85-52e7858a5884', 5, '22df24eb-6bb7-45bc-ab46-9d6022eec774', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-07 20:34:58.045285', '2024-09-07 20:34:58.045285');
INSERT INTO public.exercise_example_bundles VALUES ('8515e7fa-2d20-4f97-b361-2f0bb188dbdb', 45, '978f906a-8584-4cdf-9d7f-f96d60865e3b', '57559b71-b757-468a-983d-a1b3cec4acef', '2024-09-07 20:36:12.352776', '2024-09-07 20:36:12.352776');
INSERT INTO public.exercise_example_bundles VALUES ('dc586d63-cc0c-41c2-8992-37e009aa393c', 20, '978f906a-8584-4cdf-9d7f-f96d60865e3b', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-07 20:36:12.352776', '2024-09-07 20:36:12.352776');
INSERT INTO public.exercise_example_bundles VALUES ('cdae357d-4da7-4182-a5bd-ad0181a53dd0', 15, '978f906a-8584-4cdf-9d7f-f96d60865e3b', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-07 20:36:12.352776', '2024-09-07 20:36:12.352776');
INSERT INTO public.exercise_example_bundles VALUES ('8f267974-5388-4218-8506-bafab9a5f640', 10, '978f906a-8584-4cdf-9d7f-f96d60865e3b', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-07 20:36:12.352776', '2024-09-07 20:36:12.352776');
INSERT INTO public.exercise_example_bundles VALUES ('0a86f131-e562-41ea-967e-835b5ccbb846', 5, '978f906a-8584-4cdf-9d7f-f96d60865e3b', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-07 20:36:12.352776', '2024-09-07 20:36:12.352776');
INSERT INTO public.exercise_example_bundles VALUES ('3bd23c16-cf64-4dfa-b77e-4f68d8efe436', 45, '4da455c2-c154-4da7-b9c5-6195bd137eec', '57559b71-b757-468a-983d-a1b3cec4acef', '2024-09-07 20:38:40.69634', '2024-09-07 20:38:40.69634');
INSERT INTO public.exercise_example_bundles VALUES ('f6f28133-7980-48b7-b970-78c88564f813', 20, '4da455c2-c154-4da7-b9c5-6195bd137eec', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-07 20:38:40.69634', '2024-09-07 20:38:40.69634');
INSERT INTO public.exercise_example_bundles VALUES ('3dcdf064-66c5-4eed-8594-08df3f1a781e', 15, '4da455c2-c154-4da7-b9c5-6195bd137eec', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-07 20:38:40.69634', '2024-09-07 20:38:40.69634');
INSERT INTO public.exercise_example_bundles VALUES ('729ad4b5-d746-489b-9fde-5af2b394c398', 5, '4da455c2-c154-4da7-b9c5-6195bd137eec', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-07 20:38:40.69634', '2024-09-07 20:38:40.69634');
INSERT INTO public.exercise_example_bundles VALUES ('3afac987-6f49-4148-b2cf-907c5f43d8da', 10, '4da455c2-c154-4da7-b9c5-6195bd137eec', 'fa8025e6-e106-475c-8b9d-77831132fb47', '2024-09-07 20:38:40.69634', '2024-09-07 20:38:40.69634');
INSERT INTO public.exercise_example_bundles VALUES ('20f356f2-fb0d-4efa-8a81-fae31f7b04d6', 5, '4da455c2-c154-4da7-b9c5-6195bd137eec', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-07 20:38:40.69634', '2024-09-07 20:38:40.69634');
INSERT INTO public.exercise_example_bundles VALUES ('a160038f-5d6d-417a-9491-80c8bfb40aa8', 40, '945bdcdb-6aee-42df-a974-3fedc0b76846', '57559b71-b757-468a-983d-a1b3cec4acef', '2024-09-07 20:40:09.752009', '2024-09-07 20:40:09.752009');
INSERT INTO public.exercise_example_bundles VALUES ('fb25b94b-5031-4bf7-8d77-a6406e85820e', 20, '945bdcdb-6aee-42df-a974-3fedc0b76846', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-07 20:40:09.752009', '2024-09-07 20:40:09.752009');
INSERT INTO public.exercise_example_bundles VALUES ('2c78e894-1bc4-4986-bbc9-980d9ab3a1df', 15, '945bdcdb-6aee-42df-a974-3fedc0b76846', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-07 20:40:09.752009', '2024-09-07 20:40:09.752009');
INSERT INTO public.exercise_example_bundles VALUES ('e7631dcd-4bad-4fc2-8f0e-03da67de5480', 5, '945bdcdb-6aee-42df-a974-3fedc0b76846', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-07 20:40:09.752009', '2024-09-07 20:40:09.752009');
INSERT INTO public.exercise_example_bundles VALUES ('1b5193b1-abc7-431d-a1eb-d5738af912f0', 10, '945bdcdb-6aee-42df-a974-3fedc0b76846', 'fa8025e6-e106-475c-8b9d-77831132fb47', '2024-09-07 20:40:09.752009', '2024-09-07 20:40:09.752009');
INSERT INTO public.exercise_example_bundles VALUES ('60e6f623-5f8d-4411-9b00-c96f64f0abc9', 5, '945bdcdb-6aee-42df-a974-3fedc0b76846', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-07 20:40:09.752009', '2024-09-07 20:40:09.752009');
INSERT INTO public.exercise_example_bundles VALUES ('04cea34f-dc3e-4503-9854-756f56387c34', 5, '945bdcdb-6aee-42df-a974-3fedc0b76846', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-07 20:40:09.752009', '2024-09-07 20:40:09.752009');
INSERT INTO public.exercise_example_bundles VALUES ('dee2ae2d-cfa6-4127-b010-a4bb0bb1efb0', 45, '64406a09-56a6-43da-9329-ff0fb0d83e4f', '57559b71-b757-468a-983d-a1b3cec4acef', '2024-09-07 20:41:37.055327', '2024-09-07 20:41:37.055327');
INSERT INTO public.exercise_example_bundles VALUES ('41e3e2e0-bac9-4150-97ca-d31d89432494', 25, '64406a09-56a6-43da-9329-ff0fb0d83e4f', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-07 20:41:37.055327', '2024-09-07 20:41:37.055327');
INSERT INTO public.exercise_example_bundles VALUES ('ee2d9495-8e7a-46c4-b2c1-dd8a3a549b60', 15, '64406a09-56a6-43da-9329-ff0fb0d83e4f', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-07 20:41:37.055327', '2024-09-07 20:41:37.055327');
INSERT INTO public.exercise_example_bundles VALUES ('e09ec1cb-1490-4515-951a-aa1d9bfed29c', 10, '64406a09-56a6-43da-9329-ff0fb0d83e4f', 'fa8025e6-e106-475c-8b9d-77831132fb47', '2024-09-07 20:41:37.055327', '2024-09-07 20:41:37.055327');
INSERT INTO public.exercise_example_bundles VALUES ('172746a4-6770-4107-8a74-c31dfd4c1405', 5, '64406a09-56a6-43da-9329-ff0fb0d83e4f', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-07 20:41:37.055327', '2024-09-07 20:41:37.055327');
INSERT INTO public.exercise_example_bundles VALUES ('13d7c1cc-db93-4a66-b9da-3f778c1bf3b7', 100, '10f8ff0e-38c6-465d-b99a-26c4026d22c6', '57559b71-b757-468a-983d-a1b3cec4acef', '2024-09-07 20:42:37.458041', '2024-09-07 20:42:37.458041');
INSERT INTO public.exercise_example_bundles VALUES ('c5f257c3-ca5f-4989-aff9-ae45611c2527', 40, '88baf661-c550-4ecd-b15a-0d1ca4d41116', '57559b71-b757-468a-983d-a1b3cec4acef', '2024-09-07 20:44:02.286561', '2024-09-07 20:44:02.286561');
INSERT INTO public.exercise_example_bundles VALUES ('5e19c4ac-598e-48ca-aaf3-c8998934188b', 20, '88baf661-c550-4ecd-b15a-0d1ca4d41116', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-07 20:44:02.286561', '2024-09-07 20:44:02.286561');
INSERT INTO public.exercise_example_bundles VALUES ('ed522320-13ea-4cd6-911d-1ecef87d38ab', 10, '88baf661-c550-4ecd-b15a-0d1ca4d41116', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-07 20:44:02.286561', '2024-09-07 20:44:02.286561');
INSERT INTO public.exercise_example_bundles VALUES ('4ff8b084-3ecd-47b6-ba07-cc125e7ed43f', 10, '88baf661-c550-4ecd-b15a-0d1ca4d41116', 'fa8025e6-e106-475c-8b9d-77831132fb47', '2024-09-07 20:44:02.286561', '2024-09-07 20:44:02.286561');
INSERT INTO public.exercise_example_bundles VALUES ('3aeae9c4-0cb4-47c3-8fd8-59fafa6f596d', 5, '88baf661-c550-4ecd-b15a-0d1ca4d41116', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-07 20:44:02.286561', '2024-09-07 20:44:02.286561');
INSERT INTO public.exercise_example_bundles VALUES ('7d4736e7-93c1-4c48-800a-8621bc98450c', 5, '88baf661-c550-4ecd-b15a-0d1ca4d41116', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-07 20:44:02.286561', '2024-09-07 20:44:02.286561');
INSERT INTO public.exercise_example_bundles VALUES ('83cd0ae0-7bd3-4f4b-85cd-9afa912bd2a3', 5, '88baf661-c550-4ecd-b15a-0d1ca4d41116', 'af854064-078a-4f50-af1d-8744e866751e', '2024-09-07 20:44:02.286561', '2024-09-07 20:44:02.286561');
INSERT INTO public.exercise_example_bundles VALUES ('a5078f66-8605-4994-8551-6342615025af', 5, '88baf661-c550-4ecd-b15a-0d1ca4d41116', 'd736a513-9d73-47a3-bffc-c14911662ea2', '2024-09-07 20:44:02.286561', '2024-09-07 20:44:02.286561');
INSERT INTO public.exercise_example_bundles VALUES ('8dd4ad2f-d16b-4936-be37-2fc3ea8564b8', 60, '4dc80274-2d3e-482e-a736-9f9399330c76', '57559b71-b757-468a-983d-a1b3cec4acef', '2024-09-07 20:50:37.235521', '2024-09-07 20:50:37.235521');
INSERT INTO public.exercise_example_bundles VALUES ('41ac9156-023e-4c6a-8035-10b576258bd6', 15, '4dc80274-2d3e-482e-a736-9f9399330c76', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-07 20:50:37.235521', '2024-09-07 20:50:37.235521');
INSERT INTO public.exercise_example_bundles VALUES ('6ce5f934-0b86-47c0-a533-bd2672ef4d82', 10, '4dc80274-2d3e-482e-a736-9f9399330c76', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-07 20:50:37.235521', '2024-09-07 20:50:37.235521');
INSERT INTO public.exercise_example_bundles VALUES ('0dcd8867-f106-481d-ab44-c828e928acdc', 5, '4dc80274-2d3e-482e-a736-9f9399330c76', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-07 20:50:37.235521', '2024-09-07 20:50:37.235521');
INSERT INTO public.exercise_example_bundles VALUES ('587c4651-7672-47af-9684-e9b2c82b0982', 5, '4dc80274-2d3e-482e-a736-9f9399330c76', 'fa8025e6-e106-475c-8b9d-77831132fb47', '2024-09-07 20:50:37.235521', '2024-09-07 20:50:37.235521');
INSERT INTO public.exercise_example_bundles VALUES ('a2a49d26-2e2c-457a-9d44-95c9ac080a08', 5, '4dc80274-2d3e-482e-a736-9f9399330c76', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-07 20:50:37.235521', '2024-09-07 20:50:37.235521');
INSERT INTO public.exercise_example_bundles VALUES ('ab601233-5efd-427f-932e-3a8de1fb064e', 50, '14dbd276-30fe-4558-9cf0-104751b58f2d', '57559b71-b757-468a-983d-a1b3cec4acef', '2024-09-07 20:51:46.766406', '2024-09-07 20:51:46.766406');
INSERT INTO public.exercise_example_bundles VALUES ('3692e200-0d04-44ca-bff3-e82ba4daef3e', 20, '14dbd276-30fe-4558-9cf0-104751b58f2d', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-07 20:51:46.766406', '2024-09-07 20:51:46.766406');
INSERT INTO public.exercise_example_bundles VALUES ('48691026-7a07-4c02-a155-62434655abe2', 15, '14dbd276-30fe-4558-9cf0-104751b58f2d', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-07 20:51:46.766406', '2024-09-07 20:51:46.766406');
INSERT INTO public.exercise_example_bundles VALUES ('db8c2b19-f357-422b-95c5-1f117af66bb1', 10, '14dbd276-30fe-4558-9cf0-104751b58f2d', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-07 20:51:46.766406', '2024-09-07 20:51:46.766406');
INSERT INTO public.exercise_example_bundles VALUES ('2927bee2-a622-4ea3-b64b-80fb248f7e62', 5, '14dbd276-30fe-4558-9cf0-104751b58f2d', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-07 20:51:46.766406', '2024-09-07 20:51:46.766406');
INSERT INTO public.exercise_example_bundles VALUES ('b0172753-b565-45eb-826b-678e57df25e8', 50, '2fd70951-2d44-407e-a7ee-daa94bf6af87', '57559b71-b757-468a-983d-a1b3cec4acef', '2024-09-07 20:53:13.268137', '2024-09-07 20:53:13.268137');
INSERT INTO public.exercise_example_bundles VALUES ('b29b647a-184b-4a5b-918e-f462325b7234', 10, '2fd70951-2d44-407e-a7ee-daa94bf6af87', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-07 20:53:13.268137', '2024-09-07 20:53:13.268137');
INSERT INTO public.exercise_example_bundles VALUES ('62f2e1bb-4ee5-4623-a3df-dc16e4f3d230', 10, '2fd70951-2d44-407e-a7ee-daa94bf6af87', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-07 20:53:13.268137', '2024-09-07 20:53:13.268137');
INSERT INTO public.exercise_example_bundles VALUES ('ca24fb50-cb82-4f6a-9554-1a98c0c5047d', 5, '2fd70951-2d44-407e-a7ee-daa94bf6af87', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-07 20:53:13.268137', '2024-09-07 20:53:13.268137');
INSERT INTO public.exercise_example_bundles VALUES ('fe3704ca-0334-4ddb-ac38-939265ecfecc', 5, '2fd70951-2d44-407e-a7ee-daa94bf6af87', 'fa8025e6-e106-475c-8b9d-77831132fb47', '2024-09-07 20:53:13.268137', '2024-09-07 20:53:13.268137');
INSERT INTO public.exercise_example_bundles VALUES ('145dc20e-ffef-406d-8029-56708d4f2a5f', 5, '2fd70951-2d44-407e-a7ee-daa94bf6af87', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-07 20:53:13.268137', '2024-09-07 20:53:13.268137');
INSERT INTO public.exercise_example_bundles VALUES ('d31ff3b9-981b-492d-828e-749585958a2c', 5, '2fd70951-2d44-407e-a7ee-daa94bf6af87', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-07 20:53:13.268137', '2024-09-07 20:53:13.268137');
INSERT INTO public.exercise_example_bundles VALUES ('a600fa27-3c11-40d7-a5f3-a1eba8a306b0', 5, '2fd70951-2d44-407e-a7ee-daa94bf6af87', 'af854064-078a-4f50-af1d-8744e866751e', '2024-09-07 20:53:13.268137', '2024-09-07 20:53:13.268137');
INSERT INTO public.exercise_example_bundles VALUES ('acbf23ca-f849-4be5-96d6-069b396df944', 5, '2fd70951-2d44-407e-a7ee-daa94bf6af87', '97136fa7-622a-49d6-9d09-403a631d253d', '2024-09-07 20:53:13.268137', '2024-09-07 20:53:13.268137');
INSERT INTO public.exercise_example_bundles VALUES ('3dddf20c-58a0-484e-82c5-941989022716', 50, '24c43903-d3a7-4a39-9231-5bc7d5cec5da', '57559b71-b757-468a-983d-a1b3cec4acef', '2024-09-07 20:54:24.87991', '2024-09-07 20:54:24.87991');
INSERT INTO public.exercise_example_bundles VALUES ('28a82488-e53a-444b-b791-d9ef74c855c5', 15, '24c43903-d3a7-4a39-9231-5bc7d5cec5da', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-07 20:54:24.87991', '2024-09-07 20:54:24.87991');
INSERT INTO public.exercise_example_bundles VALUES ('43996194-de24-41b9-92f0-a4cdd639e565', 10, '24c43903-d3a7-4a39-9231-5bc7d5cec5da', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-07 20:54:24.87991', '2024-09-07 20:54:24.87991');
INSERT INTO public.exercise_example_bundles VALUES ('a0ac67f2-86a0-4510-b004-36a49909d293', 10, '24c43903-d3a7-4a39-9231-5bc7d5cec5da', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-07 20:54:24.87991', '2024-09-07 20:54:24.87991');
INSERT INTO public.exercise_example_bundles VALUES ('c1b8e757-2495-4d92-9661-9333085a87d0', 5, '24c43903-d3a7-4a39-9231-5bc7d5cec5da', 'fa8025e6-e106-475c-8b9d-77831132fb47', '2024-09-07 20:54:24.87991', '2024-09-07 20:54:24.87991');
INSERT INTO public.exercise_example_bundles VALUES ('172dafd4-e015-40e4-93c6-c0f0b4732e05', 5, '24c43903-d3a7-4a39-9231-5bc7d5cec5da', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-07 20:54:24.87991', '2024-09-07 20:54:24.87991');
INSERT INTO public.exercise_example_bundles VALUES ('7c7f3959-3a8f-425a-994f-41e61565c6dd', 5, '24c43903-d3a7-4a39-9231-5bc7d5cec5da', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-07 20:54:24.87991', '2024-09-07 20:54:24.87991');
INSERT INTO public.exercise_example_bundles VALUES ('324dc943-29ae-4955-8217-47367a7fa497', 45, 'de763854-d06d-43e9-9973-f4ca8839201b', '57559b71-b757-468a-983d-a1b3cec4acef', '2024-09-07 20:55:27.305656', '2024-09-07 20:55:27.305656');
INSERT INTO public.exercise_example_bundles VALUES ('23b68a42-301f-46db-805d-0a640e63973a', 15, 'de763854-d06d-43e9-9973-f4ca8839201b', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-07 20:55:27.305656', '2024-09-07 20:55:27.305656');
INSERT INTO public.exercise_example_bundles VALUES ('fe6f410d-22d3-4e1a-bcce-1b761c7a8184', 10, 'de763854-d06d-43e9-9973-f4ca8839201b', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-07 20:55:27.305656', '2024-09-07 20:55:27.305656');
INSERT INTO public.exercise_example_bundles VALUES ('14171eae-5b21-4d75-bd46-d1ef9ad66e0a', 10, 'de763854-d06d-43e9-9973-f4ca8839201b', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-07 20:55:27.305656', '2024-09-07 20:55:27.305656');
INSERT INTO public.exercise_example_bundles VALUES ('3f825a76-3910-4633-87b2-06dc445af286', 5, 'de763854-d06d-43e9-9973-f4ca8839201b', 'fa8025e6-e106-475c-8b9d-77831132fb47', '2024-09-07 20:55:27.305656', '2024-09-07 20:55:27.305656');
INSERT INTO public.exercise_example_bundles VALUES ('2b400ce0-ac45-4f7a-bccc-6fb4c73f17c7', 5, 'de763854-d06d-43e9-9973-f4ca8839201b', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-07 20:55:27.305656', '2024-09-07 20:55:27.305656');
INSERT INTO public.exercise_example_bundles VALUES ('737b0420-e917-4774-8d69-85395952f220', 5, 'de763854-d06d-43e9-9973-f4ca8839201b', '2e0faf2b-31a5-4c63-ac15-454be132796f', '2024-09-07 20:55:27.305656', '2024-09-07 20:55:27.305656');
INSERT INTO public.exercise_example_bundles VALUES ('8a45a417-bee1-462d-916d-e3fd92eaf5e4', 5, 'de763854-d06d-43e9-9973-f4ca8839201b', 'af854064-078a-4f50-af1d-8744e866751e', '2024-09-07 20:55:27.305656', '2024-09-07 20:55:27.305656');
INSERT INTO public.exercise_example_bundles VALUES ('5334e195-9c2e-4202-a1ac-399bdf30f18e', 50, '5ab252b3-204d-4846-80e8-a7629f2d2e25', '57559b71-b757-468a-983d-a1b3cec4acef', '2024-09-07 20:56:42.185416', '2024-09-07 20:56:42.185416');
INSERT INTO public.exercise_example_bundles VALUES ('cd3d799b-134a-43db-a252-45561d639151', 10, '5ab252b3-204d-4846-80e8-a7629f2d2e25', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-07 20:56:42.185416', '2024-09-07 20:56:42.185416');
INSERT INTO public.exercise_example_bundles VALUES ('8e6f6a81-e376-4ffc-8fec-96f433035410', 10, '5ab252b3-204d-4846-80e8-a7629f2d2e25', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-07 20:56:42.185416', '2024-09-07 20:56:42.185416');
INSERT INTO public.exercise_example_bundles VALUES ('b8f3d4df-103d-41f3-8170-efa183558376', 10, '5ab252b3-204d-4846-80e8-a7629f2d2e25', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-07 20:56:42.185416', '2024-09-07 20:56:42.185416');
INSERT INTO public.exercise_example_bundles VALUES ('b4b0d204-40c4-4208-9fd6-25a828bafca2', 10, '5ab252b3-204d-4846-80e8-a7629f2d2e25', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-07 20:56:42.185416', '2024-09-07 20:56:42.185416');
INSERT INTO public.exercise_example_bundles VALUES ('2fc95643-cf06-45fd-ae08-6a61c472b195', 5, '5ab252b3-204d-4846-80e8-a7629f2d2e25', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-07 20:56:42.185416', '2024-09-07 20:56:42.185416');
INSERT INTO public.exercise_example_bundles VALUES ('7cb49257-4e49-4b11-bc58-dc63cd674967', 5, '5ab252b3-204d-4846-80e8-a7629f2d2e25', 'fa8025e6-e106-475c-8b9d-77831132fb47', '2024-09-07 20:56:42.185416', '2024-09-07 20:56:42.185416');
INSERT INTO public.exercise_example_bundles VALUES ('cd6047f8-ecb8-4b9c-99dd-d3fdf31bf213', 50, '7b006564-2c61-4661-ab8c-d4cf60fdb3ed', '57559b71-b757-468a-983d-a1b3cec4acef', '2024-09-07 21:00:33.460953', '2024-09-07 21:00:33.460953');
INSERT INTO public.exercise_example_bundles VALUES ('48ea7153-7431-49af-9895-331328a1a212', 10, '7b006564-2c61-4661-ab8c-d4cf60fdb3ed', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-07 21:00:33.460953', '2024-09-07 21:00:33.460953');
INSERT INTO public.exercise_example_bundles VALUES ('9395b3b8-67e1-49c3-8716-cd24136d02fe', 10, '7b006564-2c61-4661-ab8c-d4cf60fdb3ed', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-07 21:00:33.460953', '2024-09-07 21:00:33.460953');
INSERT INTO public.exercise_example_bundles VALUES ('37005c08-0c7a-46ca-ba1c-70acc61f09a3', 10, '7b006564-2c61-4661-ab8c-d4cf60fdb3ed', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-07 21:00:33.460953', '2024-09-07 21:00:33.460953');
INSERT INTO public.exercise_example_bundles VALUES ('e6f0d90e-0590-4770-9f13-8802f3591f17', 5, '7b006564-2c61-4661-ab8c-d4cf60fdb3ed', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-07 21:00:33.460953', '2024-09-07 21:00:33.460953');
INSERT INTO public.exercise_example_bundles VALUES ('4483cf87-35c1-4815-a6d4-ef21877baa87', 5, '7b006564-2c61-4661-ab8c-d4cf60fdb3ed', 'fa8025e6-e106-475c-8b9d-77831132fb47', '2024-09-07 21:00:33.460953', '2024-09-07 21:00:33.460953');
INSERT INTO public.exercise_example_bundles VALUES ('91a86f6b-0ba4-4162-afff-3eba211a8b8f', 5, '7b006564-2c61-4661-ab8c-d4cf60fdb3ed', 'af854064-078a-4f50-af1d-8744e866751e', '2024-09-07 21:00:33.460953', '2024-09-07 21:00:33.460953');
INSERT INTO public.exercise_example_bundles VALUES ('8a9060fd-c91a-44b5-b92c-9eb898bb663c', 50, '1e51b837-215d-4069-9d14-c9510c1b1b61', '57559b71-b757-468a-983d-a1b3cec4acef', '2024-09-07 21:02:58.930421', '2024-09-07 21:02:58.930421');
INSERT INTO public.exercise_example_bundles VALUES ('20a7dd55-31e9-4588-8550-f2fe21cd500d', 15, '1e51b837-215d-4069-9d14-c9510c1b1b61', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-07 21:02:58.930421', '2024-09-07 21:02:58.930421');
INSERT INTO public.exercise_example_bundles VALUES ('d9e09c88-3718-49c5-8e7d-65eb6442dbd4', 10, '1e51b837-215d-4069-9d14-c9510c1b1b61', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-07 21:02:58.930421', '2024-09-07 21:02:58.930421');
INSERT INTO public.exercise_example_bundles VALUES ('0de8621e-7220-4e35-955a-792f60a01ac4', 10, '1e51b837-215d-4069-9d14-c9510c1b1b61', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-07 21:02:58.930421', '2024-09-07 21:02:58.930421');
INSERT INTO public.exercise_example_bundles VALUES ('5760020d-058c-4dfd-84e8-623821a039a8', 5, '1e51b837-215d-4069-9d14-c9510c1b1b61', 'fa8025e6-e106-475c-8b9d-77831132fb47', '2024-09-07 21:02:58.930421', '2024-09-07 21:02:58.930421');
INSERT INTO public.exercise_example_bundles VALUES ('365dcf98-65cb-458f-8fd2-184dc100bded', 5, '1e51b837-215d-4069-9d14-c9510c1b1b61', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-07 21:02:58.930421', '2024-09-07 21:02:58.930421');
INSERT INTO public.exercise_example_bundles VALUES ('2dd8dbf8-9866-40a7-9bac-c3d72065744b', 50, '4ef87c39-b004-4c4c-82a8-ddd0338de8c8', '57559b71-b757-468a-983d-a1b3cec4acef', '2024-09-08 11:38:55.964892', '2024-09-08 11:38:55.964892');
INSERT INTO public.exercise_example_bundles VALUES ('1c57ea00-537e-4635-86a7-20585566856c', 10, '4ef87c39-b004-4c4c-82a8-ddd0338de8c8', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-08 11:38:55.964892', '2024-09-08 11:38:55.964892');
INSERT INTO public.exercise_example_bundles VALUES ('6d1b20e6-53f6-4aed-89d0-d47d90ccbc91', 10, '4ef87c39-b004-4c4c-82a8-ddd0338de8c8', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-08 11:38:55.964892', '2024-09-08 11:38:55.964892');
INSERT INTO public.exercise_example_bundles VALUES ('e85465ca-9d47-4084-b6b1-f23e84c72ee7', 10, '4ef87c39-b004-4c4c-82a8-ddd0338de8c8', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-08 11:38:55.964892', '2024-09-08 11:38:55.964892');
INSERT INTO public.exercise_example_bundles VALUES ('3a4ff004-8b9b-48b4-b1c5-7ef54dd610f3', 5, '4ef87c39-b004-4c4c-82a8-ddd0338de8c8', 'fa8025e6-e106-475c-8b9d-77831132fb47', '2024-09-08 11:38:55.964892', '2024-09-08 11:38:55.964892');
INSERT INTO public.exercise_example_bundles VALUES ('f0ce2d1e-7f53-4da9-a3bd-35d8422656c2', 5, '4ef87c39-b004-4c4c-82a8-ddd0338de8c8', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-08 11:38:55.964892', '2024-09-08 11:38:55.964892');
INSERT INTO public.exercise_example_bundles VALUES ('03e669a3-20c1-46ce-b95f-af1348ecd05a', 5, '4ef87c39-b004-4c4c-82a8-ddd0338de8c8', 'af854064-078a-4f50-af1d-8744e866751e', '2024-09-08 11:38:55.964892', '2024-09-08 11:38:55.964892');
INSERT INTO public.exercise_example_bundles VALUES ('a0529af5-c9fa-4d78-b7a5-af79b7552e3e', 60, 'ea89fe55-c50f-4bbf-acc1-96e7df46101a', '57559b71-b757-468a-983d-a1b3cec4acef', '2024-09-08 11:42:23.518364', '2024-09-08 11:42:23.518364');
INSERT INTO public.exercise_example_bundles VALUES ('9b4141b4-556d-42bf-b20e-1d49eb75f2bd', 15, 'ea89fe55-c50f-4bbf-acc1-96e7df46101a', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-08 11:42:23.518364', '2024-09-08 11:42:23.518364');
INSERT INTO public.exercise_example_bundles VALUES ('373e90da-d8ca-4ef3-b7b2-67c5084b5e34', 15, 'ea89fe55-c50f-4bbf-acc1-96e7df46101a', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-08 11:42:23.518364', '2024-09-08 11:42:23.518364');
INSERT INTO public.exercise_example_bundles VALUES ('9a934b68-08ca-42c6-b2c1-e32dd761821f', 10, 'ea89fe55-c50f-4bbf-acc1-96e7df46101a', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-08 11:42:23.518364', '2024-09-08 11:42:23.518364');
INSERT INTO public.exercise_example_bundles VALUES ('73732593-c4a5-41a4-82fe-3446512de353', 60, '395bb56a-d4af-4f4a-abb3-51a9ef1dc686', '57559b71-b757-468a-983d-a1b3cec4acef', '2024-09-08 11:47:42.81733', '2024-09-08 11:47:42.81733');
INSERT INTO public.exercise_example_bundles VALUES ('9f0452c8-98ab-46b1-a3ec-a98dd546ef60', 15, '395bb56a-d4af-4f4a-abb3-51a9ef1dc686', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-08 11:47:42.81733', '2024-09-08 11:47:42.81733');
INSERT INTO public.exercise_example_bundles VALUES ('334fad35-9b90-4225-ac11-1e7f66e84bdc', 15, '395bb56a-d4af-4f4a-abb3-51a9ef1dc686', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-08 11:47:42.81733', '2024-09-08 11:47:42.81733');
INSERT INTO public.exercise_example_bundles VALUES ('ab30edbf-7dff-49b4-bfeb-13c6a5b550e1', 10, '395bb56a-d4af-4f4a-abb3-51a9ef1dc686', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-08 11:47:42.81733', '2024-09-08 11:47:42.81733');
INSERT INTO public.exercise_example_bundles VALUES ('764b1774-ca25-4a14-b39b-0271f07408a6', 60, 'a40b23bf-bd6d-41d0-adbe-254bce002c2d', '57559b71-b757-468a-983d-a1b3cec4acef', '2024-09-08 11:48:44.503582', '2024-09-08 11:48:44.503582');
INSERT INTO public.exercise_example_bundles VALUES ('01fe2468-45c4-4e68-9c95-e94ef327e231', 15, 'a40b23bf-bd6d-41d0-adbe-254bce002c2d', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-08 11:48:44.503582', '2024-09-08 11:48:44.503582');
INSERT INTO public.exercise_example_bundles VALUES ('fe432bdc-f8a3-4077-af60-c168bea664f8', 15, 'a40b23bf-bd6d-41d0-adbe-254bce002c2d', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-08 11:48:44.503582', '2024-09-08 11:48:44.503582');
INSERT INTO public.exercise_example_bundles VALUES ('4801b33f-b858-4498-baf8-c823b4b17323', 10, 'a40b23bf-bd6d-41d0-adbe-254bce002c2d', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-08 11:48:44.503582', '2024-09-08 11:48:44.503582');
INSERT INTO public.exercise_example_bundles VALUES ('4d7d999a-7e92-4164-95c7-055befe45e61', 50, 'a4bf88ee-8865-4b1f-88a3-28cf59d28739', '57559b71-b757-468a-983d-a1b3cec4acef', '2024-09-08 11:51:56.637589', '2024-09-08 11:51:56.637589');
INSERT INTO public.exercise_example_bundles VALUES ('b6be382e-a4e1-4a30-8a8f-c6bdfa710e64', 10, 'a4bf88ee-8865-4b1f-88a3-28cf59d28739', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-08 11:51:56.637589', '2024-09-08 11:51:56.637589');
INSERT INTO public.exercise_example_bundles VALUES ('e3e91ff8-4db2-47b8-9515-495b814f8aa8', 10, 'a4bf88ee-8865-4b1f-88a3-28cf59d28739', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-08 11:51:56.637589', '2024-09-08 11:51:56.637589');
INSERT INTO public.exercise_example_bundles VALUES ('4960b897-73f1-49eb-9263-8505ea3825bc', 10, 'a4bf88ee-8865-4b1f-88a3-28cf59d28739', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-08 11:51:56.637589', '2024-09-08 11:51:56.637589');
INSERT INTO public.exercise_example_bundles VALUES ('ef6fb8c4-2ee5-4bde-986f-fb9a3c39cedf', 5, 'a4bf88ee-8865-4b1f-88a3-28cf59d28739', 'fa8025e6-e106-475c-8b9d-77831132fb47', '2024-09-08 11:51:56.637589', '2024-09-08 11:51:56.637589');
INSERT INTO public.exercise_example_bundles VALUES ('737f60c4-0799-47b3-9116-e04704c06592', 5, 'a4bf88ee-8865-4b1f-88a3-28cf59d28739', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-08 11:51:56.637589', '2024-09-08 11:51:56.637589');
INSERT INTO public.exercise_example_bundles VALUES ('4654978d-5878-486e-8cc5-f72130671469', 5, 'a4bf88ee-8865-4b1f-88a3-28cf59d28739', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-08 11:51:56.637589', '2024-09-08 11:51:56.637589');
INSERT INTO public.exercise_example_bundles VALUES ('014bebf3-485e-43d2-abe7-59a8ab511287', 5, 'a4bf88ee-8865-4b1f-88a3-28cf59d28739', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-08 11:51:56.637589', '2024-09-08 11:51:56.637589');
INSERT INTO public.exercise_example_bundles VALUES ('5794748a-de4a-4dc9-95b2-394bdde1d892', 60, '9572d666-227a-4639-9ea3-defd67123fbc', '57559b71-b757-468a-983d-a1b3cec4acef', '2024-09-08 11:54:36.176918', '2024-09-08 11:54:36.176918');
INSERT INTO public.exercise_example_bundles VALUES ('388cbd08-6ca8-492c-be84-fddf802144c5', 10, '9572d666-227a-4639-9ea3-defd67123fbc', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-08 11:54:36.176918', '2024-09-08 11:54:36.176918');
INSERT INTO public.exercise_example_bundles VALUES ('f856f7f8-5b2e-455e-be5d-cfa1df893c28', 10, '9572d666-227a-4639-9ea3-defd67123fbc', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-08 11:54:36.176918', '2024-09-08 11:54:36.176918');
INSERT INTO public.exercise_example_bundles VALUES ('022cef2f-834b-4f7a-94c3-02c56e8822eb', 10, '9572d666-227a-4639-9ea3-defd67123fbc', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-08 11:54:36.176918', '2024-09-08 11:54:36.176918');
INSERT INTO public.exercise_example_bundles VALUES ('3f10952d-c4d0-45a8-8b2e-b4aec7b08d8c', 5, '9572d666-227a-4639-9ea3-defd67123fbc', '9a8024fe-c721-4bea-969c-db88674b5ece', '2024-09-08 11:54:36.176918', '2024-09-08 11:54:36.176918');
INSERT INTO public.exercise_example_bundles VALUES ('49c18583-e5eb-41e3-bbda-d6c8f5899618', 5, '9572d666-227a-4639-9ea3-defd67123fbc', '97a87b01-35e8-490a-94b9-9bdae9c2f965', '2024-09-08 11:54:36.176918', '2024-09-08 11:54:36.176918');
INSERT INTO public.exercise_example_bundles VALUES ('2122a6ac-dd78-49b9-8aa0-71505f91949c', 50, '21d5ce50-6ffa-44d9-869f-abcfeb518018', '57559b71-b757-468a-983d-a1b3cec4acef', '2024-09-08 11:56:12.849106', '2024-09-08 11:56:12.849106');
INSERT INTO public.exercise_example_bundles VALUES ('df27bd5c-b3e3-453f-8bad-9a197695907f', 15, '21d5ce50-6ffa-44d9-869f-abcfeb518018', '3eeaa9fa-0847-4780-9d01-185f91252794', '2024-09-08 11:56:12.849106', '2024-09-08 11:56:12.849106');
INSERT INTO public.exercise_example_bundles VALUES ('a1027c66-226d-4d7e-a027-a240ad069c87', 10, '21d5ce50-6ffa-44d9-869f-abcfeb518018', 'f6e65bfe-0746-4a8f-8210-0e9bf88d9886', '2024-09-08 11:56:12.849106', '2024-09-08 11:56:12.849106');
INSERT INTO public.exercise_example_bundles VALUES ('561c762b-dc1e-4c70-b0fb-8a1508b4c1f4', 10, '21d5ce50-6ffa-44d9-869f-abcfeb518018', 'bba5b66d-9a9c-4b44-8dd6-9574760038ee', '2024-09-08 11:56:12.849106', '2024-09-08 11:56:12.849106');
INSERT INTO public.exercise_example_bundles VALUES ('0f3bdcec-a804-4d39-9eba-8a96f4392310', 5, '21d5ce50-6ffa-44d9-869f-abcfeb518018', 'fa8025e6-e106-475c-8b9d-77831132fb47', '2024-09-08 11:56:12.849106', '2024-09-08 11:56:12.849106');
INSERT INTO public.exercise_example_bundles VALUES ('a77b6bdd-7785-4654-9ba4-6671fbe6c394', 5, '21d5ce50-6ffa-44d9-869f-abcfeb518018', '9e69205f-6c6e-44a7-8ee6-89215e28a28e', '2024-09-08 11:56:12.849106', '2024-09-08 11:56:12.849106');
INSERT INTO public.exercise_example_bundles VALUES ('611aae5e-da1f-46b4-84a7-0fc169b22217', 5, '21d5ce50-6ffa-44d9-869f-abcfeb518018', 'af854064-078a-4f50-af1d-8744e866751e', '2024-09-08 11:56:12.849106', '2024-09-08 11:56:12.849106');


--
-- Data for Name: exercise_examples; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.exercise_examples VALUES ('650e9725-d36c-4688-bcab-adf93dfe9e5d', 'EZ Bar Skullcrusher', '2024-08-23 15:44:41.300424', '2024-08-23 15:44:41.300424', 'https://www.mensjournal.com/.image/t_share/MTk2OTg4MTk1NjA1MzI1NDUy/barbellskullcrusher.jpg', 'Select your desired weight and sit on the edge of a flat bench.


To get into position, lay back and keep the bar close to your chest. Once you are supine, press the weight to lockout.


Lower the weights towards your head by unlocking the elbows and allowing the ez bar to drop toward your forehead or just above.


Once your forearms reach parallel or just below, reverse the movement by extending the elbows while flexing the triceps to lockout the weight.


Repeat for the desired number of repetitions.', 'isolation', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('3b828d2f-797f-4a45-9d1d-1d3efe38fb54', 'Weighted Tricep Dips', '2024-08-23 15:50:27.637943', '2024-08-23 15:50:27.637943', 'https://steelsupplements.com/cdn/shop/articles/shutterstock_566901937_2000x.jpg?v=1599047555', 'Step up onto the dip station (if possible) and position your hands with a neutral grip.


Initiate the dip by unlocking the elbows and slowly lowering the body until the forearms are almost parallel with the floor.


Control the descent to parallel and then drive back to the starting position by pushing through the palms.


Repeat for the desired number of repetitions.', 'compound', 'free', 'push', 'advanced');
INSERT INTO public.exercise_examples VALUES ('b790c6a6-ecd1-4b3a-afbc-22cd82e55658', 'Lying Dumbbell Extension', '2024-08-23 14:29:51.253789', '2024-08-23 14:29:51.253789', 'https://weighttrainingexercises4you.com/wp-content/uploads/Lying-Dumbbell-Triceps-Extension.jpg', 'Grab a pair of dumbbells and sit on the end of a flat bench with the dumbbells resting on your thighs.


Lie back on the bench and extend the dumbbells above your head. The dumbbells should not be touching and you should be using a neutral grip (palms facing each other).


Bending at the elbows only, keeping your elbows fixed and pointing at your hips, slowly lower the dumbbells down beside your head until they are about level with your ears.


Pause and squeeze the triceps. Then raise the dumbbells back to the starting position.


Do not lock the elbows out, and then repeat for desired reps.', 'isolation', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('6cb225d2-be00-461d-9bf0-7f0c87cfea0b', 'Straight Bar Tricep Extension', '2024-08-23 13:51:17.085276', '2024-08-23 13:51:17.085276', 'https://miro.medium.com/v2/resize:fit:683/0*WTHf_Xa35BeFOEAl.jpg', 'Attach a straight bar to a cable stack as high as possible and assume a standing position.


Grasp the straight bar with a pronated grip (palms facing down) and lean forward slightly by hinging at the hips.


Initiate the movement by extending the elbows and flexing the triceps.


Pull the handle downward until the elbows are almost locked out and then slowly lower under control back to the starting position.


Repeat for the desired number of repetitions.', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('0e2fe1e8-f8f1-48e6-b360-8c9d4d9991a6', 'Rope Tricep Extension', '2024-08-23 14:53:43.902288', '2024-08-23 14:53:43.902288', 'https://www.dmoose.com/cdn/shop/articles/1_6a24d912-5f74-43d4-bc20-578944bd99f7.jpg?v=1648734107', 'Attach a rope to a cable stack as high as possible and assume a standing position.


Grasp the rope with a neutral grip (palms facing in) and lean forward slightly by hinging at the hips.


Initiate the movement by extending the elbows and flexing the triceps.


Pull the rope downward until the elbows are almost locked out and then slowly lower under control back to the starting position.


Repeat for the desired number of repetitions.', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('ab0d7384-444e-446a-911d-f64ac31db8ef', 'Close Grip Bench Press', '2024-08-23 15:30:18.860564', '2024-08-23 15:30:18.860564', 'https://steelsupplements.com/cdn/shop/articles/shutterstock_69079681_2000x.jpg?v=1599316230', 'Lie flat on a bench and set your hands at shoulder width.


Set your shoulder blades by pinching them together and driving them into the bench.


Take a deep breath and allow your spotter to help you with the lift off in order to maintain tightness through your upper back.


Let the weight settle and ensure your upper back remains tight after lift off.


Inhale and allow the bar to descend slowly by unlocking the elbows.


Lower the bar in a straight line to the base of the sternum (breastbone) and touch the chest.


Push the bar back up in a straight line by pressing yourself into the bench, driving your feet into the floor for leg drive, and extending the elbows.


Repeat for the desired number of repetitions.', 'compound', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('7517ae2f-c198-4a33-8a1d-1dc7327d1430', '45 Degree Lying Tricep Extension (EZ Bar)', '2024-08-23 20:29:25.181737', '2024-08-23 20:29:25.181737', 'https://i0.wp.com/www.muscleandfitness.com/wp-content/uploads/2015/10/triceps-article-social.jpg?quality=86&strip=all', 'Sit on the end of a flat bench width a barbell on your thighs.


Grip the EZ-bar on the inner grips. Bring the bar up to your chest and lay down on your back.


Extend your arms straight up above your chest.


Keeping your arms straight move the bar back so it is angled out past your head.


Keeping your elbows fixed in place and not pointing out, slowly lower the bar until it is almost touching the top of your head or bench behind your head.


Pause, and then slowly extend your arms back to the starting position.


Do not lock your elbows out, and then repeat for desired reps.', 'isolation', 'free', 'push', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('4aafe702-f2fc-4fa2-a7fb-c31c279adeda', '45 Degree Lying Tricep Extension', '2024-08-23 20:36:43.346849', '2024-08-23 20:36:43.346849', 'https://www.bodybuilding.com/fun/images/2015/your-complete-guide-to-skullcrushers-graphics-45-degree-skullcrusher-700xh.jpg', 'Sit on the end of a flat bench with a barbell on your thighs.


Grip the barbell with an overhand (palms facing down) with your hands about shoulder width apart.


Bring the bar up to your chest and lay down on your back.


Extend your arms straight up above your chest.


Keeping your arms straight, move the bar back to the position shown in the video above.


Keeping your elbows fixed in place and not pointing out, slowly lower the bar until it is almost touching the top of your head or bench behind your head.


Pause, and then slowly extend your arms back to the starting position.


Do not lock your elbows out, and then repeat for desired reps.', 'isolation', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('faf6674c-2a2a-4b03-ab8b-7a033052b572', 'Alternating Bent-Over Dumbbell Kickback ', '2024-08-24 13:49:36.23273', '2024-08-24 13:49:36.23273', 'https://hips.hearstapps.com/hmg-prod/images/young-man-working-out-with-dumbbell-at-gym-royalty-free-image-1667582833.jpg?crop=1xw:0.84415xh;center,top', 'Select the appropriate dumbbells and place them on the floor in front of you.


Bending at the knees and keeping your back straight, squat down and pick up the dumbbells with a neutral grip (palms facing inward). Your feet should be around shoulder-width apart.


Get into the starting position by keeping your back straight, bending slightly at the knees, and bending over at the waist. Your torso should almost be parallel to the floor.


Tuck your upper arms close to your torso and bend at the elbows, forming a 90-degree angle with your upper arms and forearms. This is the starting position.


Beginning with your left arm and moving only at the elbow, raise the dumbbell behind you until your arm is fully extended.


Pause, and then lower the dumbbell back to the starting position.


Repeat this movement with your right arm and then repeat for desired reps.', 'isolation', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('c21d3b0f-c8a8-4b7f-92ea-90dc567a1183', 'Close Grip EZ Bar Press', '2024-08-26 14:36:25.633347', '2024-08-26 14:36:25.633347', 'https://s3assets.skimble.com/assets/1141234/image_iphone.jpg', 'Select your desired weight and sit on the edge of a flat bench.


To get into position, lay back and keep the bar close to your chest using a neutral grip. Once you are supine, press the weight to lockout.


Unlock the elbows and extend the shoulders to lower the weight to your chest.


Once the bar touches your chest, reverse the movement by extending the elbows while flexing the triceps to lockout the weight.


Repeat for the desired number of repetitions.', 'isolation', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('93e6b1c4-0510-41d4-983c-a1fde003881f', 'Alternating Dumbbell Floor Press', '2024-08-24 13:55:14.325068', '2024-08-24 13:55:14.325068', 'https://cdn.shopify.com/s/files/1/2623/4904/files/Dumbbell_Floor_Press_b2da358c-6c1e-4ab5-98a6-98e24bfa6d52_600x600.png?v=1659337818', 'Begin sitting on the floor in an upright position with your legs straight and the dumbbells vertically balanced on the floor.


Pick up each dumbbell and set it high in your hip crease while maintaining a tight grip.


Slowly lay back while keeping the dumbbells close to your chest and bend your knees to roughly 45 degrees and move your feet up slightly.


Press the weights to full extension by contracting your triceps and chest.


Slowly lower one dumbbell under control as far as comfortably possible (the handle should be about level with your chest) while keeping the other locked out at the top.


Contract the chest and triceps to push the dumbbell back to the starting position.


Slowly lower the other dumbbell under control until your elbow touches the floor while keeping the other locked out at the top.


To complete the exercise, simply lower the weights to the ground in “controlled drop” fashion. It should be a smooth motion but not one requiring excessive effort or one that puts the shoulder under unnecessary risk.', 'compound', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('0eaa8980-e29e-4f33-88b0-915db5cf309a', 'Alternating Lying Dumbbell Extension', '2024-08-24 15:00:28.238965', '2024-08-24 15:00:28.238965', 'https://weighttrainingexercises4you.com/wp-content/uploads/Alternating-Lying-Dumbbell-Triceps-Extension.jpg', 'Set up for the exercise by setting a pair of dumbbells at the end of a flat bench.


Pick up the dumbbells off the floor using a neutral grip (palms facing in), position the ends of the dumbbells on your thighs, and sit down on the bench.


To get in position you need to rock back pushing the dumbbells back with your thighs and only slightly bending at the elbows.


Now you should be in a position to start the set, laying back on the bench and holding the dumbbells straight up above your chest with a neutral grip.


Slowly lower the left dumbbell down by bending only at the elbow. You will be moving in a semi-circular motion until the dumbbell is about even with your left ear. Continue to hold the right dumbbell in place.


Pause, and then raise the dumbbell back to the starting position.


Repeat the movement with your right arm and then repeat for desired reps.', 'isolation', 'free', 'push', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('9f0c8916-a08b-4fe5-9f24-e1680ef627a8', 'Bench Dip', '2024-08-24 15:05:24.055319', '2024-08-24 15:05:24.055319', 'https://steelsupplements.com/cdn/shop/articles/shutterstock_1526664821_1000x.jpg?v=1644523346', 'Set up for the bench dip by placing 2 flat benches parallel to one another to around 4-5 feet apart (you may need to adjust the width to suit your height).


Put your heels on the edge of one bench around shoulder-width apart.


Place your hands on the edge of the other bench. This is the starting position for the exercise.


Keeping your body close to the bench, slowly dip down until your elbows are at the same height as your shoulders.


Slowly push back up, squeezing through the triceps.


Do not lock the elbows out at the top of the exercise, and repeat.', 'compound', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('547f1f7e-3ee1-4b39-99eb-3462b1ec13af', 'Bent Over Dumbbell Tricep Kickback', '2024-08-24 15:14:04.484126', '2024-08-24 15:14:04.484126', 'https://hips.hearstapps.com/hmg-prod/images/triceps-kickback-1551296273.jpg', 'Select the desired weight from the rack and stand in an open area.


Hinge forward, row the dumbbells into position, then extend the elbows while flexing the triceps.


Slowly lower the dumbbells back to the starting position and repeat for the desired number of repetitions.', 'isolation', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('275097d4-3c8d-4040-9b2e-5f294919df04', 'Cable Concentration Tricep Extension', '2024-08-24 15:21:25.308798', '2024-08-24 15:21:25.308798', 'https://www.bodybuilding.com/images/2016/june/7-best-triceps-exercises-youre-not-doing-v2-7-700xh.jpg', 'Set up for the exercise by attaching a single grip handle to a high pulley cable machine and selecting the weight you want to use on the stack.


Grab the handle with an underhand grip (palm facing up) with your right hand.


Turn so your left side is facing the cable machine and drop your left knee to the floor.


Your right thigh should be parallel to the floor, as it will be used as a support during the exercise.


Position the back of your elbow (bottom of the tricep) against your inner right thigh. This is the starting position for the exercise.


Keeping your body fixed, slowly extend the arm as far as possible.


Squeeze the tricep, and then slowly lower the weight back to the starting position.


Repeat for desired reps.', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('5985d847-0473-444e-8fe0-9da5341ef986', 'Cable Tricep Extension With V-Bar', '2024-08-26 14:10:38.408306', '2024-08-26 14:10:38.408306', 'https://atletiq.com/content/exercises/243/male_1.jpg', 'Attach a v-bar to a cable stack as high as possible and assume a standing position.


Grasp the v-bar with a semi pronated grip (palms slightly facing) and lean forward slightly by hinging at the hips.


Initiate the movement by extending the elbows and flexing the triceps.


Pull the handle downward until the elbows are almost locked out and then slowly lower under control back to the starting position.


Repeat for the desired number of repetitions.', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('11644e17-247a-46b0-a391-b3b2a2a6bba8', 'Cable Tricep Kickback', '2024-08-26 14:15:00.627444', '2024-08-26 14:15:00.627444', 'https://bodybuilding-wizard.com/wp-content/uploads/2015/02/cable-tricep-kickback-2.jpg', 'Set up for the cable tricep kickback by attaching a single grip handle to a low pulley cable machine and selecting the weight you want to use.


Grab the handle using your left hand with an overhand grip and take a step back from the cable machine.


Keeping your feet together and knees slightly bent, bend down until your body is around parallel to the floor.


Use your free right hand to stabilize yourself.


Bring the elbow up as far as possible and keep it tight by your side. This is the starting position for the exercise.


Keeping your elbow in place and your body fixed, extend your arm out as far as possible.


Squeeze the tricep, and then slowly lower the weight back to the starting position.


Repeat for desired reps.', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('50774526-c91f-4d71-82a8-456526b0fbd0', 'California Skullcrusher', '2024-08-26 14:21:24.510891', '2024-08-26 14:21:24.510891', 'https://www.bodybuilding.com/fun/images/2015/your-complete-guide-to-skullcrushers-desktop-2-960x540.jpg', 'Select your desired weight and sit on the edge of a flat bench.


To get into position, lay back and keep the bar close to your chest using a neutral grip. Once you are supine, press the weight to lockout.


Unlock the elbows and allow the ez bar to drop toward your forehead or just above.


Once your forearms reach parallel or just below, allow the upper arms to extend overhead (similar to a pullover).


As the arms reach full extension, pull the elbows back to the starting position and then extend the elbows while flexing the triceps to lockout the weight.


Repeat for the desired number of repetitions.', 'isolation', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('385fb192-7c2c-405a-b483-f36e32e241c8', 'Close Grip Chest Press', '2024-08-26 14:31:15.917591', '2024-08-26 14:31:15.917591', 'https://www.dmoose.com/cdn/shop/articles/1_155d781f-a698-40e7-bdb6-f0de019f9b89.jpg?v=1648738774', 'Set up for the close grip chest press by adjusting the rack height (if adjustable) and loading the weight you want to use on the barbell.


Lay back on the bench with your feet firmly on the floor.


Grab the bar with an overhand grip (palms facing your feet) with your hands around 12 inches apart.


Take the barbell off the rack and hold it straight above your chest. Bend the elbows slightly to take the weight onto your chest/triceps.


Slowly lower the bar to your middle chest.


Pause, then slowly push the bar back to the starting position. Don''t lock your elbows out!


Repeat for desired reps.', 'compound', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('04d275d8-71df-4695-ace9-899ce6e41b29', 'Seated Dumbbell Tricep Extension', '2024-08-26 14:39:55.622736', '2024-08-26 14:39:55.622736', 'https://www.dmoose.com/cdn/shop/articles/1_f16231a6-e9e2-4ff0-b3f1-b1ccdfbac2dc.jpg?v=1658323250', 'Select the desired weight from the rack and position an adjustable bench at 90 degrees.


To get into position, sit in an upright position and lift the dumbbell to the top of your shoulder. Take a deep breath, overlap your hands around the dumbbell, then press it into position overhead.


Maintain an overlapping grip and slowly lower the dumbbell behind your head by unlocking your elbows.


Once your forearms reach parallel or just below, drive the dumbbell back to the starting point by extending the elbows and flexing the triceps.


Repeat for the desired number of repetitions.', 'isolation', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('1b4402c2-2459-45c1-8d24-356322c71d20', 'Two Arm Standing Dumbbell Extension', '2024-08-26 14:46:34.072768', '2024-08-26 14:46:34.072768', 'https://media.post.rvohealth.io/wp-content/uploads/2021/10/overhead-tricep-extension-dumbbell-732x549-thumbnail.jpg', 'Select the desired weight from the rack and stand in an open area.


To get into position, lift the dumbbell to the top of your shoulder, take a deep breath, overlap your hands around the dumbbell, then press it into position overhead.


Maintain an overlapped grip and slowly lower the dumbbell behind your head by unlocking your elbows.


Once your forearms reach parallel or just below, drive the dumbbell back to the starting point by extending the elbows and flexing the triceps.


Repeat for the desired number of repetitions.', 'isolation', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('4f9bdd10-28bc-447e-8cf5-fbf47cd9af79', 'French Press', '2024-08-26 14:52:11.233011', '2024-08-26 14:52:11.233011', 'https://www.guinnessworldrecords.com/world-records/images/619083-most-weight-lifted-by-ez-bar-french-press-french-curl-in-one-minute-header.jpg', 'Set up for the french press by loading a barbell or EZ-bar with the appropriate amount of weight and placing it on the floor in front of you.


Bend only at the knees and grasp the barbell with an overhand grip (palms facing down) with your hands about 8-12 inches apart.


Stand up straight with the bar with your feet around shoulder-width apart and a slight bend in your knees.


Lift the bar above your head and bend at your elbows slightly to take the tension onto your triceps. Your palms are now facing upward. This is the starting position for the exercise.


Keeping your elbows fixed and pointing straight up toward the ceiling, slowly lower the bar down behind your head as far as comfortably possible.


Pause, and then slowly raise the bar back to the starting position.


Don''t lock your elbows out, and then repeat the movement. ', 'isolation', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('6a312bde-cc33-450b-8f1d-6091ccffe9cc', 'Reverse Grip Cable Tricep Extension', '2024-08-26 15:16:20.191397', '2024-08-26 15:16:20.191397', 'https://ignorelimits.com/wp-content/uploads/2017/08/how-to-reverse-grip-cable-triceps-pushdown-Copy.jpg', 'Attach a straight bar to a cable stack as high as possible and assume a standing position.


Grasp the straight bar with a supinated grip (palms facing up) and lean forward slightly by hinging at the hips.


Initiate the movement by extending the elbows and flexing the triceps.


Pull the handle downward until the elbows are almost locked out and then slowly lower under control back to the starting position.


Repeat for the desired number of repetitions.', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('21e7460d-aa00-448b-8c82-994a73e0164c', 'Dumbbell Tate Press', '2024-08-26 15:20:51.07074', '2024-08-26 15:20:51.07074', 'https://i0.wp.com/www.muscleandfitness.com/wp-content/uploads/2017/06/600-tate-press.jpg?quality=86&strip=all', 'Select the desired weight from the rack and sit down on a flat bench.


To get into position, lay back and keep the weights close to your chest. Once you are in position, take a deep breath, then press the dumbbells to lockout at the top.


Maintain a pronated grip (thumbs pointing towards each other) and allow the elbows to bend while lowering the inner portion of the dumbbells to the chest.


Once the ends of the dumbbells touch your chest, reverse the movement and flex the triceps to lockout the elbows.


Repeat for the desired number of repetitions.', 'isolation', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('ee8cc366-d33b-45a6-84b0-4ab416585ad1', 'Close Grip Press Behind-The-Neck', '2024-08-27 16:05:54.962719', '2024-08-27 16:05:54.962719', 'https://assets.myworkouts.io/exercises-media/b6KbXDksgkfbm3TtY/close_grip_press_behind_neck_male_v5_thumb100Poster_capoff.jpg', 'Set up for the close grip behind the neck press by loading the appropriate weight onto an EZ bar or barbell and sitting on the end of a flat bench or a bench with a back rest.


Grasp the bar with a close grip (just inside shoulder width) using an overhand grip (palms facing forward).


Raise the bar straight above your head until your arms are nearly fully extended (keep a slight bend in your elbows). This is the starting position.


Slowly lower the bar down behind your neck by bending at the elbows. The bar should come down as far as comfortably possible or when your forearms are around parallel to the floor.


Slowly raise the bar back to the starting position. This is one rep.


Repeat for desired reps.', 'isolation', 'free', 'push', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('490df80e-d34c-42cf-bfe5-c27ddd2cd734', 'Decline Lying Dumbbell Extension', '2024-08-27 17:08:58.772907', '2024-08-27 17:08:58.772907', '', 'Select the desired weight from the rack and position an adjustable bench on a slight decline of 15-30 degrees.


Lay back keeping the weights close to your chest. Once your back is flat against the pad, press the weights to lockout using a neutral grip.


Lower the weights towards your shoulders by unlocking the elbows while maintaining a neutral grip.


Once your forearms reach parallel or just below, drive the dumbbell back to the starting point by extending the elbows and flexing the triceps.


Repeat for the desired number of repetitions.', 'isolation', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('e21344ff-b825-4a99-bf8b-a778bf1964d1', 'Decline Close Grip Bench Press', '2024-08-27 17:14:24.425351', '2024-08-27 17:14:24.425351', '', 'Lie flat on an decline bench, set your hands at shoulder width, and hook your feet underneath the pad.


Set your shoulder blades by pinching them together and driving them into the bench.


Take a deep breath and allow your spotter to help you with the lift off in order to maintain tightness through your upper back.


Let the weight settle and ensure your upper back remains tight after lift off.


Inhale and allow the bar to descend slowly by unlocking the elbows.


Lower the bar in a straight line to just below your sternum (breastbone) and touch the chest.


Push the bar back up in a straight line by pressing yourself into the bench and extending the elbows.


Repeat for the desired number of repetitions.', 'compound', 'free', 'push', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('d6743870-0d5a-4180-9671-181b8f65e03e', 'Decline Lying Tricep Extension (Skullcrusher)', '2024-08-27 17:17:13.831319', '2024-08-27 17:17:13.831319', '', 'Select your desired weight and sit on the edge of an decline bench at roughly 20-30 degrees.


To get into position, lay back and keep the bar close to your chest. Once you are supine, press the weight to lockout.


Unlock the elbows and allow the ez bar to drop toward your forehead or just above.


Once your forearms reach parallel or just below, reverse the movement by extending the elbows while flexing the triceps to lockout the weight.


Repeat for the desired number of repetitions.', 'isolation', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('855bd9e5-3546-4cfd-b048-e8017f01bfeb', 'Dumbbell Tricep Kickback', '2024-08-27 17:37:27.234715', '2024-08-27 17:37:27.234715', '', 'Set up for the dumbbell tricep kickback by grabbing a flat bench and sitting a dumbbell on the left-hand side at one end.


Position yourself on the left side of the bench with your right knee and right hand resting on the bench.


Using a neutral grip, pick up the dumbbell with your left hand. Keep your back straight and look forward.


Tuck your left upper arm close to your torso and bend at the elbow, forming a 90-degree angle with your upper arm and forearm. This is the starting position.


Moving only at the elbow, raise the dumbbell behind you until your arm is fully extended.


Pause, and then lower the dumbbell back to the starting position.


Repeat this movement for desired reps and then repeat using your right arm.', 'isolation', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('53defdc5-bfec-4af4-bfba-60440e3493cc', 'EZ Bar Incline Skullcrusher', '2024-08-27 17:40:04.03333', '2024-08-27 17:40:04.03333', '', 'Select your desired weight and sit on the edge of an adjustable bench set at 20-30 degrees.


To get into position, lay back and keep the bar close to your chest. Once you are supine, press the weight to lockout.


Unlock the elbows and allow the ez bar to drop toward your forehead or just above.


Once your forearms reach parallel or just below, reverse the movement by extending the elbows while flexing the triceps to lockout the weight.


Repeat for the desired number of repetitions.', 'isolation', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('748e0a60-9429-4a9d-8a6b-3ba76a7fc4b2', 'High Pulley Overhead Tricep Extension (Rope Extension)', '2024-08-27 17:41:21.141757', '2024-08-27 17:41:21.141757', '', 'Attach a rope to a cable stack as high as possible and assume a standing position.


Utilize a split stance, grasp the rope overhead with a neutral grip (palms facing), and lean forward by hinging at the hips.


Initiate the movement by extending the elbows and flexing the triceps.


Pull the rope downward until the elbows are almost locked out and then slowly lower under control back to the starting position.


Repeat for the desired number of repetitions.', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('a90f4822-63c5-42b9-943c-ff0ceacad1eb', 'High Pulley Overhead Tricep Extension', '2024-08-27 17:44:25.490434', '2024-08-27 17:44:25.490434', '', 'Set up for the high pulley tricep extension by attaching a straight bar to a high pulley and selecting the weight you want to use on the stack.


Facing away from the pulley, grab the bar behind your neck with an overhand grip at shoulder width apart.


Bend over at the waist until your torso is almost parallel to the floor. This will lift the weight slightly from the stack.


You can stagger your feet and bend slightly at the knees to help with balance.


Your upper arms should be parallel to the floor at this point and you should be grabbing the bar behind your head. You are now in the starting position.


Moving only at your elbow joints, slowly push the bar out in from of your body until your arms are fully extended.


Pause, and then slowly bring the bar back to the starting position.


Repeat this movement for desired reps.', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('bbfbcfe2-1f56-492e-afa6-75e595b84fde', 'Standing Barbell Curl', '2024-08-27 20:04:23.470927', '2024-08-27 20:04:23.470927', '', 'The standing barbell curl is the cornerstone of many bicep building routines. Grasp a barbell or Olympic bar at around shoulder width apart using an underhand grip (palms facing up).
Stand straight up, feet together (you may be more comfortable putting one foot back for stability), back straight, and with your arms fully extended.
The bar should not be touching your body.
Keeping your eyes facing forwards, elbows tucked in at your sides, and your body completely still, slowly curl the bar up.
Squeeze your biceps hard at the top of the movement, and then slowly lower it back to the starting position.
Repeat for desired reps.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('ddc2e877-7197-42fa-ae1e-59706d209774', 'Standing Dumbbell Curl', '2024-08-27 19:58:20.484787', '2024-08-27 19:58:20.484787', '', 'Assume the starting position for the standing dumbbell curl by grasping a pair of dumbbells and standing straight up, feet together, and dumbbells by your side. The dumbbells should not be touching your body.
Your palms should face upwards.
Take up the slack by bending the elbows slightly. Tension should be on the biceps.
Slowly curl the dumbbells up as far as possible.
Squeeze the biceps hard, and then slowly lower the dumbbells back down to the starting position.
Repeat for desired reps.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('8324ae75-08e9-48de-a00b-55d229085712', 'Standing Hammer Curl', '2024-08-27 20:02:25.685377', '2024-08-27 20:02:25.685377', '', 'Grab a pair of dumbbells and stand up with the dumbbells by your sides.
With a neutral grip, bend your arms slightly to keep the tension on the biceps.
With your palms still facing your body, slowly curl the dumbbells up as far as possible.
Squeeze the biceps at the top of the movement, and then slowly lower the weight back to the starting position.
Repeat for desired reps.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('09386394-e4e1-4a6d-adce-d5f5a518485c', 'Incline Dumbbell Curl', '2024-08-27 20:09:12.651079', '2024-08-27 20:09:12.651079', '', 'Position an incline bench at roughly 55-65 degrees, select the desired weight from the rack, and sit upright with your back flat against the pad. Using a supinated (palms up) grip, take a deep breath and curl both dumbbells towards your shoulders. Once the biceps are fully shortened, slowly lower the weights back to the starting position. Repeat for the desired number of repetitions.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('cfb2d83a-b3dc-44e9-ab08-53f9269752d6', 'Concentration Curl', '2024-08-27 20:11:42.117375', '2024-08-27 20:11:42.117375', '', 'Select the desired weight from the rack, and sit in an upright position on a flat bench. Hinge forward and position your elbow near the base of your knee. Place your free hand on the other knee to stabilize yourself. Using a supinated (palms facing up) grip, take a deep breath and curl the dumbbell towards your shoulder. Once the bicep is fully shortened, slowly lower the weight back to the starting position. Repeat for the desired number of repetitions on both sides.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('2522a61a-2190-43e9-ae52-ca6bb023815e', 'Cable Curl', '2024-08-27 20:13:52.504713', '2024-08-27 20:13:52.504713', '', 'Set up for this type of cable curl by attaching a straight bar to the low pulley cable and selecting the weight you want to use on the stack. Stand facing the cable machine with your legs shoulder-width apart. Grasp the rope extension with a neutral grip (thumbs facing the body). With your elbows tucked in by your sides, slowly curl the rope up as far as possible. Squeeze the biceps at the top of the movement, and then slowly lower the weight back to the starting position. This is one rep. Repeat for desired reps.', 'isolation', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('9fc5ae4d-2868-4576-bb67-9c83663fc005', 'EZ Bar Preacher Curl', '2024-08-27 20:15:21.110573', '2024-08-27 20:15:21.110573', '', 'The EZ bar preacher curl is a great exercise to isolate the biceps while minimizing the strain on your wrists. Adjust the seat on the preacher bench so that your upper arms sit comfortably on the padding when seated. Load the desired weight on the barbell. Sit on the preacher bench and grip the EZ bar with your hands shoulder-width apart using an underhand (palms facing up) grip. (note: You can use a wide or narrow grip on this exercise) Keeping your back straight and eyes facing forward, take the weight off the rack to support it with your arms slightly bent. This is the starting position. Slowly bring the weight up until your forearms are at a right angle to the floor. Squeeze the bicep at the top of the movement and slowly lower it back to the starting position. Repeat for desired reps.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('89f423d0-315f-4d93-b346-dcb468a97045', 'Zottman Curl', '2024-08-27 20:17:28.409294', '2024-08-27 20:17:28.409294', '', 'Select the desired weight from the rack and assume a shoulder width stance. Using a supinated grip, take a deep breath and curl the dumbbells towards your shoulders. Once the biceps are fully shortened, rotate the forearms to a pronated position (palms down) and slowly lower the weight back to the starting position. Repeat for the desired number of repetitions.', 'isolation', 'free', 'pull', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('194fa2ee-7f92-4982-903e-3db80293d773', 'Barbell Preacher Curl', '2024-08-27 20:20:16.517741', '2024-08-27 20:20:16.517741', '', 'Load the desired weight on the barbell, and sit in an upright position with your chest flat against the preacher bench. Keep your upper arm pressed into the pad and use a supinated grip (palms facing up). Extend your arms until your biceps are fully lengthened. This is the starting position. Take a deep breath and curl the weight by bending at the elbows until the bar is at shoulder height. Squeeze the biceps at the top of the movement and slowly lower the bar back to the starting position. Repeat for the desired number of repetitions.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('16ba69dc-e99d-4a71-bbcb-0f3ce096a9d9', 'Machine Shoulder Press', '2024-08-29 20:17:41.629601', '2024-08-29 20:17:41.629601', '', 'Assume a seated position in the machine with the handles set at roughly shoulder height. Grab the handles with a pronated or neutral grip. Inhale and press directly overhead. Slowly lower the handles back to the starting position. Repeat for the desired number of repetitions.', 'compound', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('f2fb31f0-7f6b-42b6-9a79-c22453ac6a63', 'Alternating Seated Dumbbell Curl', '2024-08-27 20:24:43.747305', '2024-08-27 20:24:43.747305', '', 'Set up for the alternating seated dumbbell curl by grabbing a flat bench and placing a set of dumbbells at one end. Sit on the end of the bench with your feet out in front of you and your knees together. Pick up the dumbbells from the floor and let them hang by your sides with your palms facing up. Bend the arms slightly to take the tension into the biceps. This is the starting position for the exercise. With your back straight and your elbows tucked in at your sides, slowly curl the dumbbell up with one arm. Squeeze the bicep hard, then slowly lower the weight back to the starting position. Repeat for the other arm, and then repeat for desired reps.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('5e3c933f-7511-463e-88b1-a139c8276e69', 'Cross Body Hammer Curl (Pinwheel Curls)', '2024-08-27 20:27:54.259424', '2024-08-27 20:27:54.259424', '', 'Set up for the cross body hammer curl by grasping a pair of dumbbells and holding them at your sides. You should be using a neutral grip (palms facing the body) and have a slight bend in your arms. This is the starting position for the exercise. Beginning with one arm, slowly curl the dumbbell up across the front of your body. Squeeze the bicep at the top of the movement, and then slowly lower the weight back to the starting position. Repeat this movement for your other arm. This is one rep. Now repeat to complete your set.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('e7f390fd-7435-44e1-b354-c62073934c66', 'Alternating Standing Dumbbell Curl', '2024-08-27 20:29:12.662559', '2024-08-27 20:29:12.662559', '', 'The standing dumbbell curl is a good way to correct any strength and size imbalances in the biceps as it works each muscle individually. Set up for the exercise by grasping a set of dumbbells and standing straight up with the dumbbells by your side. Your palms should be facing up, and the dumbbells should not touch your body. Before starting the set, take up the slack by lifting the weight slightly so the tension is on your bicep muscles. Starting with your weakest arm (usually the left), curl the dumbbell up as far as possible. Squeeze the bicep at the top of the exercise, and then slowly lower the weight down without it touching your body or taking the tension off your bicep. Repeat for the other arm. That''s one rep. Now repeat for the desired amount of reps to complete the set.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('7e0566c6-eefb-4992-a673-d19902933c26', 'Cable Curl (Rope Extension)', '2024-08-28 20:36:41.142025', '2024-08-28 20:36:41.142025', '', 'Set up for this type of cable curl by attaching a rope extension to the low pulley cable and selecting the weight you want to use on the stack. Stand facing the cable machine with your legs shoulder-width apart. Grasp the rope extension with a neutral grip (thumbs facing the body). With your elbows tucked in by your sides, slowly curl the rope up as far as possible. Squeeze the biceps at the top of the movement, and then slowly lower the weight back to the starting position. This is one rep. Repeat for desired reps.', 'isolation', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('7fd82f79-1f5f-4bae-8f2d-b94ecae595d5', 'Machine Bicep Curl', '2024-08-28 20:38:26.215597', '2024-08-28 20:38:26.215597', '', 'Set up for the machine bicep curl by setting the seat height and selecting the weight you want to use on the stack. Adjust the seat height so your upper arms rest comfortably on the padding. Grasp the bar with an underhand grip around shoulder width apart. Bend the elbows slightly to take the weight up and place tension on the biceps. Slowly curl the weight up as far as possible, squeezing the biceps at the top of the movement. Pause, and then slowly lower the weight. Repeat for desired reps.', 'isolation', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('908341ec-de1f-44bd-b84d-74ff8a7162a0', 'Alternating Standing Dumbbell Curl', '2024-08-28 20:40:22.148816', '2024-08-28 20:40:22.148816', '', 'Set up for the exercise by grasping a set of dumbbells and standing straight up with the dumbbells by your side. Your palms should be facing up, and the dumbbells should not touch your body. Before starting the set, take up the slack by lifting the weight slightly so the tension is on your bicep muscles. Starting with your weakest arm (usually the left), curl the dumbbell up as far as possible. Squeeze the bicep at the top of the exercise, and then slowly lower the weight down without it touching your body or taking the tension off your bicep. Repeat for the other arm. That''s one rep. Now repeat for the desired amount of reps to complete the set.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('a2736a56-04b3-4437-835e-1e2dc8029c9e', 'Spider Curl', '2024-08-28 20:42:25.582502', '2024-08-28 20:42:25.582502', '', 'To set up for the spider curl you need to either turn the arm padding around 180 degrees or position yourself at the front of the bench facing the seat. Grab an EZ Bar and hold it with an underhand grip around shoulder width apart. Position yourself with your stomach on the padding and arms hanging off the high side. Keep your eyes facing forward and slowly curl the weight up as far as possible. Squeeze the biceps, pause, and then slowly lower the weight back to the bottom. Repeat for desired reps.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('da809d98-950b-4ca0-a71b-c67d21fd66da', 'Seated Dumbbell Curl', '2024-08-28 20:44:17.593336', '2024-08-28 20:44:17.593336', '', 'Set up for the seated dumbbell curl by grabbing a flat bench and placing a set of dumbbells at one end. Sit on the end of the bench with your feet out in front of you and your knees together. Pick the dumbbells up off the floor and let them hang by your sides with your palms facing up. Bend the arms slightly to take up the tension in the biceps. This is the starting position for the exercise. With your back straight and your elbows tucked in at your sides, slowly curl both dumbbells up as far as possible. Squeeze the biceps hard, and then slowly lower the weight back to the starting position. Repeat for desired reps.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('4de0744d-0a78-4052-aa1b-e5340959d9fe', 'Standing Dumbbell Reverse Curl', '2024-08-28 20:45:27.508894', '2024-08-28 20:45:27.508894', '', 'Select the desired weight from the rack and assume a shoulder width stance. Using a pronated (palms down) grip, take a deep breath and curl the dumbbells towards your shoulders. Once the biceps are fully shortened, slowly lower the weight back to the starting position. Repeat for the desired number of repetitions.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('d7abed66-3c4a-490b-91cc-8e714336f9fa', 'Dumbbell Preacher Curl', '2024-08-28 20:47:16.396698', '2024-08-28 20:47:16.396698', '', 'Select the desired weight from the rack, and sit in an upright position with your chest flat against the preacher bench. Keep your upper arm pressed into the pad and use a supinated (palms facing up) grip. Take a deep breath and slowly lower the dumbbell away from your shoulder. Once the bicep is fully lengthened, curl the weight back to the starting position. Repeat for the desired number of repetitions on both sides.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('cfd086be-f452-4f1d-b0cc-3988d677a8b4', 'Dumbbell Hammer Preacher Curl', '2024-08-28 20:48:17.207982', '2024-08-28 20:48:17.207982', '', 'Select the desired weight from the rack, and sit in an upright position with your chest flat against the preacher bench. Keep your upper arm pressed into the pad and use a neutral (palms facing up) grip. Take a deep breath and slowly lower the dumbbell away from your shoulder. Once the bicep is fully lengthened, curl the weight back to the starting position. Repeat for the desired number of repetitions on both sides.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('8508cffc-1df6-4db2-9447-3bafd74a1325', 'Seated Hammer Curl', '2024-08-28 20:50:28.789635', '2024-08-28 20:50:28.789635', '', 'Set up for the seated hammer curl by grabbing a flat bench and placing a set of dumbbells at one end. Sit on the end of the bench with your feet out in front of you and your knees together. Pick the dumbbells up off the floor and let them hang by your sides with a neutral grip. Bend the arms slightly to keep tension on the biceps. This is the starting position for the exercise. With your back straight and your elbows tucked in at your sides, slowly curl up the dumbbells up as far as possible. Squeeze the biceps and slowly lower the dumbbells back to the starting position. Repeat for desired reps.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('4f1c3655-21e7-4225-a39e-944774f59f76', 'Wide Grip Standing Barbell Curl', '2024-08-28 20:51:35.44937', '2024-08-28 20:51:35.44937', '', 'Grasp a barbell with your hands at a wider than shoulder width, using an underhand grip (palms facing up). Your feet should be firmly on the floor, about shoulder width apart. If you prefer, you can place one foot back. This is the starting position. Keeping your body fixed (do not swing!), slowly curl the weight up as far as possible. Squeeze the biceps, and then slowly lower the weight back to the starting position. Repeat for desired reps.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('6d5dc164-3c35-4719-85f1-5c75558f0125', 'Wide Grip Cable Curl', '2024-08-28 20:53:42.332689', '2024-08-28 20:53:42.332689', '', 'Set up for this type of cable curl by attaching a straight bar to the low pulley cable and selecting the weight you want to use on the stack. Stand facing the cable machine with your legs shoulder-width apart. Grasp the rope extension with a neutral grip (thumbs facing the body), and hands wider than shoulder width apart. With your elbows tucked in by your sides, slowly curl the rope up as far as possible. Squeeze the biceps at the top of the movement, and then slowly lower the weight back to the starting position. This is one rep. Repeat for desired reps.', 'isolation', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('cebf4622-c0a9-4759-a070-48c7556da67d', 'Squatting Cable Curl', '2024-08-28 20:55:59.966001', '2024-08-28 20:55:59.966001', '', 'The squatting cable curl is a great exercise that allows you to isolate the biceps. Set up for the exercise by attaching a straight bar to the low pulley cable and selecting the weight you want to use on the stack. Stand facing the cable machine and grasp the bar using an underhand grip (palms facing up) with your hands around shoulder width apart. Squat down and rest the back of your arms (just behind the elbows) on your knees. Your knees will act as padding to isolate the biceps. Slowly curl the bar up towards your body as far as possible. Squeeze the biceps, and then slowly lower the weight back to the starting position. Repeat for desired reps.', 'isolation', 'fixed', 'pull', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('4d72c2f1-2c10-45a3-9f5e-1f04012c0681', 'Alternating Incline Dumbbell Curl', '2024-08-28 20:59:16.602427', '2024-08-28 20:59:16.602427', '', 'Set up for the alternating incline dumbbell curl by setting the bench at a 30-45 degree incline and sitting a pair of dumbbells at the end. The lower the incline, the more challenging the exercise will be so 30 degrees is preferred. Sit on the bench, pick up the dumbbells, and lay back with your back flat on the padding. You should be holding the dumbbells with an underhand grip, palms facing up. Take up the slack in your arms by slightly bending them. This will put tension on the biceps. This is the starting position for the exercise. Keeping your elbows fixed, slowly curl up the dumbbell in your weakest arm. Squeeze the bicep at the top of the movement, then slowly lower back to the starting position. Repeat for your other arm, and then repeat for desired reps.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('af39600b-6fc5-435a-a5f8-a1d0a9994030', 'Incline Bench Dumbbell Curl', '2024-08-28 21:00:57.784199', '2024-08-28 21:00:57.784199', '', 'The incline bench dumbbell curl is a good exercise to isolate the bicep muscle. Set an adjustable bench to an angle of around 45 degrees. Grab a dumbbell and position yourself at the highest end of the bench. Rest the back of your upper arm on the bench padding and allow your arm to fully extend until the dumbbell is almost touching the bench. You should be holding the dumbbell using an underhand grip, palm facing up. Use your other arm for support by holding the bench. Contract your bicep and slowly curl it up as far as possible. Squeeze the muscle, and then slowly lower back to the starting position. Repeat for desired reps, and then repeat for the other arm.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('101f365e-5c84-438a-84b4-c8e798bd0aff', 'Incline Bench Hammer Curl', '2024-08-28 21:02:48.198286', '2024-08-28 21:02:48.198286', '', 'The incline bench dumbbell hammer curl is a good exercise to isolate the bicep muscle while also hitting the forearms. Set an adjustable bench to an angle of around 45 degrees. Grab a dumbbell and position yourself at the highest end of the bench. Rest the back of your upper arm on the bench padding and allow your arm to fully extend until the dumbbell is almost touching the bench. You should be holding the dumbbell using a neutral grip, thumb facing towards you. Use your other arm for support by holding the bench. Tense your bicep and slowly curl it up as far as possible. Squeeze the muscle, and then slowly lower the weight back to the starting position. Repeat for desired reps, and then repeat for the other arm.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('1f28edb2-29ae-467c-ad11-310c3f656fe2', 'Alternating Seated Hammer Curl', '2024-08-28 21:04:44.306578', '2024-08-28 21:04:44.306578', '', 'Set up for the alternating seated hammer curl by grabbing a flat bench and placing a set of dumbbells at one end. Sit on the end of the bench with your feet out in front of you and your knees together. Pick the dumbbells up off the floor and let them hang by your sides with a neutral grip. Bend the arms slightly to keep tension on the biceps. This is the starting position for the exercise. With your back straight and your elbows tucked in at your sides, slowly curl the dumbbell up with one arm. Squeeze the bicep hard, and then slowly lower the dumbbell back to the starting position. Repeat this for your other arm, and then repeat for desired reps.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('04a13a1c-de2b-46f4-be62-3fa6b4655d0d', 'Barbell Concentration Curl', '2024-08-28 21:07:18.63992', '2024-08-28 21:07:18.63992', '', 'The barbell concentration curl is a great exercise for isolating the biceps. Grab a flat bench and sit the barbell you want to use at one end. Sit on the end of the bench with your feet slightly wider than shoulder width apart. Grasp the barbell with an underhand grip (palms facing up), with your hands about 6-8 inches apart. Lean forward until your upper arms are touching the inside of your thighs. Use your thighs to hold your arms in position throughout the exercise. Keeping your head up, eyes facing forward, slowly curl the barbell up as far as possible. Squeeze the biceps and then slowly lower the bar back to the starting position. Repeat for desired reps.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('a9545ccb-3ec7-4646-95c9-f3a708d0d968', 'Two-Arm Low Pulley Cable Curl', '2024-08-28 21:08:56.485198', '2024-08-28 21:08:56.485198', '', 'For this exercise, you will need a cable machine with two low pulley extensions. Set up by attaching a single handle to each of the two low pulley cables and selecting the weight you want to use. Grab each handle with an underhand grip. Standing in the center of the two pulleys, take a step forward. Your arms should be fully extended and slightly behind your body. With your elbows fixed in position, slowly curl your arms up as far as possible. Squeeze the biceps at the top of the movement, and then slowly lower the weight back to the starting position. Repeat for desired reps.', 'isolation', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('b99df7e8-eb44-4be1-be81-701347580781', 'Lying Incline Bench Barbell Curl', '2024-08-28 21:11:35.028903', '2024-08-28 21:11:35.028903', '', 'Set an incline bench at a 30-degree angle (If you do not have access to an incline bench you can prop up a straight bench). Grab an EZ bar and place it at the end of the incline bench. Lay on the bench with your chest against the padding. Your chest should be at the end of the bench. Grasp the EZ bar with an underhand grip (palms facing up), with your hands about shoulder-width apart. Keeping your eyes up and bending at the elbows, slowly curl the bar up as far as possible. Squeeze the biceps at the top of the movement, and then slowly lower the weight back to the starting position. Repeat for desired reps.', 'isolation', 'free', 'pull', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('afd7f719-5789-48a0-a5d9-77e9cb1669bb', 'Standing Cable Reverse Fly', '2024-08-29 20:16:07.188606', '2024-08-29 20:16:07.188606', '', 'Position two cables at chest height and attach a handle. Reach across your body and grab one handle with a neutral grip. Repeat for the opposite arm. Position the arms straight ahead holding onto each handle and keep a soft bend in the knees. Keep the elbows slightly bent and pull the handles laterally without squeezing the shoulder blades together excessively. Slowly lower the handles back to the starting position under control. Repeat for the desired number of repetitions.', 'isolation', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('8d2a9df4-af32-4943-b74b-ae901e866b32', 'Close Grip EZ Bar Curl', '2024-08-28 21:12:39.501074', '2024-08-28 21:12:39.501074', '', 'Using a close grip on the EZ Bar works the outer parts of the biceps more. Grasp an EZ Bar with an underhand grip (palms facing up). Your hands should be about 6-8 inches apart. Stand straight up, with your feet firmly on the floor at around shoulder width apart. You may find it more comfortable to take one foot back. Keeping your body completely still and eyes facing forward, slowly curl the bar up as far as possible. Squeeze your biceps at the top of the movement, and then slowly lower the weight back down. Repeat for desired reps.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('8ca7bf65-0ddb-4c64-ba64-f71f25c85d7c', 'Wide Grip EZ Bar Curl', '2024-08-28 21:13:34.072785', '2024-08-28 21:13:34.072785', '', 'The wide-grip EZ Bar curl is a good exercise for training the inner part of the biceps. Grasp an EZ Bar with your hands at a wider than shoulder width using an underhand grip (palms facing up). Your feet should be firmly on the floor, about shoulder-width apart. If you prefer, you can place one foot back. This is the starting position. Keeping your body fixed (do not swing!), slowly curl the weight up as far as possible. Squeeze the biceps, and then slowly lower the weight back to the starting position. Repeat for desired reps.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('12221e5c-0208-48fc-8c56-62c266932f74', 'Dumbbell Lateral Raise', '2024-08-29 15:15:51.70192', '2024-08-29 15:15:51.70192', '', 'Select the desired weight from the rack, then take a few steps back into an open area. Take a deep breath and raise the dumbbells to shoulder height using a neutral grip (palms facing in) while keeping the elbows slightly bent. Slowly lower the dumbbells back to the starting position under control. Repeat for the desired number of repetitions.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('1959abd3-4ab1-42d4-b7e2-45693b899d51', 'Military Press (AKA Overhead Press)', '2024-08-29 15:18:06.528089', '2024-08-29 15:18:06.528089', '', 'Adjust the barbell to just below shoulder height then load the desired weight onto the bar. Assume a shoulder width stance and place your hands at (or just outside of) shoulder width with a pronated grip on the bar. Step underneath the bar and unrack it while keeping the spine in a neutral position. Take two steps back, inhale, brace, tuck the chin, then press the bar to lockout overhead. Exhale once the bar gets to lockout and reverse the movement slowly while controlling the bar back to your chest. Repeat for the desired number of repetitions.', 'compound', 'free', 'push', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('48191b99-06fa-4218-b61b-c9b9abd73278', 'Seated Dumbbell Press', '2024-08-29 15:20:32.329274', '2024-08-29 15:20:32.329274', '', 'Set up an adjustable angle bench to 90 degrees and select the desired weight from the rack. Pick up the dumbbells from the floor using a neutral grip (palms facing in). Position the end of the dumbbells on your knees and sit down on the bench. Using a safe and controlled motion, kick your knees up one at a time in order to get each dumbbell into place. Once the dumbbells are in place, rotate your palms so they are facing forward. Take a deep breath then press the dumbbells overhead by extending the elbows and contracting the deltoids. Slowly lower the dumbbells back to the starting position (the arms should be roughly 90 degrees or slightly lower depending upon limb lengths). Repeat for the desired number of repetitions.', 'compound', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('92d77415-1f9a-430b-ba52-0a09ec07b3a1', 'Standing Dumbbell Shoulder Press', '2024-08-29 15:21:42.152136', '2024-08-29 15:21:42.152136', '', 'Set up for the exercise by grabbing a pair of dumbbells and standing up with your feet around shoulder width apart. Raise the dumbbells to shoulder height on each side, and rotate your palms so they are facing forward. This is the starting position for the exercise. Take a deep breath then press the dumbbells overhead by extending the elbows and contracting the deltoids. Slowly lower the dumbbells back to the starting position (the arms should be roughly 90 degrees or slightly lower depending upon limb lengths). Repeat for the desired number of repetitions.', 'compound', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('816440ad-f8f2-4ef7-a11f-b6a2bd63fcef', 'Bent Over Dumbbell Reverse Fly', '2024-08-29 15:23:10.33151', '2024-08-29 15:23:10.33151', '', 'Select the desired weight from the rack then take a few steps back into an open area. Hinge from the hips until your body is almost parallel to the floor and allow the arms to hang straight down from the shoulders with a neutral grip. Take a deep breath and pull the dumbbells towards the ceiling using the rear deltoids. Slowly lower the dumbbells back to the starting position under control. Repeat for the desired number of repetitions.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('506d1cc7-529a-42af-b5bf-4c4d0a9aa409', 'Smith Machine Shoulder Press', '2024-08-29 15:24:22.323538', '2024-08-29 15:24:22.323538', '', 'Place an adjustable bench in the Smith machine and adjust the back to a 90-degree angle. Adjust the bar to around eye level and load the desired weight on the bar. Position your hands around shoulder-width apart and unrack the bar using a pronated grip. This is the starting position for the movement. Press the bar overhead by extending the elbows and contracting the deltoids. Slowly lower the bar back to the starting position (the arms should be roughly 90 degrees or slightly lower depending on limb lengths). Repeat for the desired number of repetitions.', 'compound', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('9ab8fe00-58de-48c4-942d-b10e8d16f1c1', 'Seated Arnold Press', '2024-08-29 15:26:45.175874', '2024-08-29 15:26:45.175874', '', 'Set up an adjustable angle bench to 90 degrees and select the desired weight from the rack. Pick up the dumbbells from the floor using a neutral grip (palms facing in). Position the end of the dumbbells on your knees and sit down on the bench. Using a safe and controlled motion, kick your knees up one at a time in order to get each dumbbell into place. Once the dumbbells are in place, rotate your palms so they are facing you. Take a deep breath then press the dumbbells overhead by extending the elbows and contracting the deltoids. As you press, rotate the dumbbells until your palms are facing forward. Slowly lower the dumbbells back to the starting position (the arms should be roughly 90 degrees or slightly lower depending upon limb lengths). Repeat for the desired number of repetitions.', 'compound', 'free', 'push', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('3d6e76b5-b409-4f5b-bba4-c22cb10cfbd4', 'Seated Bent Over Dumbbell Reverse Fly', '2024-08-29 15:28:20.973087', '2024-08-29 15:28:20.973087', '', 'Secure a flat bench and select the desired weight from the rack. Sit in an upright position and then hinge forward from the hips. Allow the arms to hang straight down from the shoulders with a neutral grip and dumbbells behind your calves. Take a deep breath and pull the dumbbells towards the ceiling using the rear deltoids. Slowly lower the dumbbells back to the starting position under control. Repeat for the desired number of repetitions.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('77aa5752-a586-4dfe-b69d-4da16fff0b79', 'Seated Dumbbell Lateral Raise', '2024-08-29 15:30:57.598844', '2024-08-29 15:30:57.598844', '', 'Grab a pair of dumbbells with a neutral grip and sit on the edge of a flat bench with your feet around shoulder width apart. This is the starting position for the exercise. Slowly raise the dumbbells to around shoulder height. Pause and slowly lower the dumbbell back to the starting position. Repeat for desired reps.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('4035dfef-3cc6-4a15-a97f-c167bd274d02', 'Seated Barbell Shoulder Press', '2024-08-29 15:34:32.562958', '2024-08-29 15:34:32.562958', '', 'Adjust the barbell to just below shoulder height while standing then load the desired weight onto the bar. Place an adjustable bench beneath the bar in an upright position. Sit down on the bench and unrack the bar using a pronated grip. Inhale, brace, tuck the chin, then lower the bar to the top of your chest. Exhale and press the bar back to lockout. Repeat for the desired number of repetitions.', 'compound', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('aada0f37-1f30-4d61-a284-8003027bc871', 'Cable Face Pull', '2024-08-29 20:14:43.135772', '2024-08-29 20:14:43.135772', '', 'Assume a split stance with the arms straight out in front of you utilizing a pronated grip. Inhale and pull the rope towards your face with the elbows high. Slowly lower the rope back to the starting position and repeat for the desired number of repetitions on both sides.', 'compound', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('3a70ce9c-b1f0-43a7-8775-7d3e7c109c5d', 'Machine Reverse Fly', '2024-08-29 20:18:52.12644', '2024-08-29 20:18:52.12644', '', 'Face the fly machine while seated with your chest against the pad and the handles positioned in front of your torso. Reach forward and grasp each handle with a pronated or neutral grip. Contract the rear delts while keeping the elbows bent and open the arms in a reverse fly motion. Slowly lower the handles back to the starting position and repeat for the desired number of repetitions.', 'isolation', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('4353173b-93b2-4fb1-b462-fc8330b15ce5', 'Cable Lateral Raise', '2024-08-29 20:20:58.523546', '2024-08-29 20:20:58.523546', '', 'Set the pulleys of a dual cable machine to the low setting and select the weight you wish to use. Stand facing away from the machine and grasp opposite handles with opposite hands. Stand straight up with your arms in front of you (crossed over). The weight should be slightly off the stack. This is the starting position for the movement. Keeping your elbows high, extend your arms out in a semi-circle motion. Once your hands get to around shoulder height, pause and slowly lower the weight back to the starting position. Repeat for desired reps.', 'isolation', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('1b8fe6fc-9ede-4f28-b4a0-30504db61fed', 'Single Arm Cable Lateral Raise (Crossbody)', '2024-08-29 20:26:45.591795', '2024-08-29 20:26:45.591795', '', 'Position a cable at the lowest position possible and attach a single handle. Reach across your body and grab the handle with a neutral grip. Keep the elbow slightly bent and pull the handle across your body and raise laterally. Slowly lower the handle back to the starting position under control. Repeat for the desired number of repetitions.', 'isolation', 'fixed', 'pull', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('90b8d661-a9ef-47e5-8c98-b0599874a972', 'Seated Behind the Neck Shoulder Press', '2024-08-29 20:28:36.062554', '2024-08-29 20:28:36.062554', '', 'Adjust the barbell to just below shoulder height while standing then load the desired weight onto the bar. Place an adjustable bench beneath the bar in an upright position. Sit down on the bench and unrack the bar using a pronated grip. Inhale, brace, tuck the chin, then lower the bar to the back of your neck. Exhale and press the bar back to lockout. Repeat for the desired number of repetitions.', 'compound', 'fixed', 'push', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('ac45c513-55f3-437f-a10f-ba3c0763a746', 'Standing Dumbbell Front Raise', '2024-08-29 20:31:23.01677', '2024-08-29 20:31:23.01677', '', 'Choose a pair of dumbbells with a pronated grip and assume a shoulder-width stance. Inhale, brace your abs and raise your arms vertically while keeping a slight bend in your elbow. Once your arms are parallel with the floor, slowly lower the dumbbells back to the starting position. Repeat for the desired number of repetitions.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('3a41edcb-2c19-4d06-9585-8fe745aba723', 'Machine Lateral Raise', '2024-08-29 20:34:53.7379', '2024-08-29 20:34:53.7379', '', 'Begin by selecting the weight you wish to use on the stack of a lateral raise machine. Adjust the seat height and sit facing the machine with your feet flat on the floor around shoulder width apart. Secure your arms in the padding and grip the handles. Look straight ahead. You are now ready to begin the exercise. With a bend in the elbows and moving only at the shoulders, begin pushing the weight up until your forearms are just above parallel. Contract your shoulders at the height of the movement and begin slowly lowering the weight using the same semicircle motion you used raise it. Repeat this movement for desired reps.', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('b8fa1238-0f58-4daa-ade8-0f8c6fa2d1b1', 'Bent Over Rear Delt Fly (Head on Bench)', '2024-08-29 20:37:21.051883', '2024-08-29 20:37:21.051883', '', 'Position an incline bench at roughly 70-80 degrees and select the desired weight from the rack. Hinge from the hips until your head is resting comfortably on the incline bench and allow the arms to hang straight down from the shoulders with a neutral grip. Take a deep breath and pull the dumbbells towards the ceiling using the rear deltoids. Slowly lower the dumbbells back to the starting position under control. Repeat for the desired number of repetitions.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('ed5db0ac-4343-4e68-a884-d5f84e4020c1', 'Bent Over Low Pulley Rear Delt Fly', '2024-08-29 20:46:11.377576', '2024-08-29 20:46:11.377576', '', 'Position two cables at the bottom of the cable pulley machine and attach a handle. Hinge forward, reach across your body, and grab the handle with a neutral grip. Repeat for the opposite arm. Allow the arms to hang straight down and keep a soft bend in the knees. Keep the elbows slightly bent and pull the handles laterally without squeezing the shoulder blades together excessively. Slowly lower the handle back to the starting position under control. Repeat for the desired number of repetitions.', 'isolation', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('d20646b6-efd1-49fc-8ffa-180461aea5ab', 'Smith Machine Upright Row', '2024-08-29 20:48:13.145019', '2024-08-29 20:48:13.145019', '', 'Select the desired weight and load it onto a barbell. Unrack the bar by rotating the safety latches off the j-hooks. Inhale, brace your abs, and then lead the movement by driving the elbows high as you pull the bar to chest height. When the bar has reached its peak, reverse the movement slowly while controlling the bar back to the starting position. Repeat for the desired number of repetitions.', 'compound', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('1f8abb63-8024-46ca-ac1e-2574a839eed6', 'Push Press', '2024-08-29 20:49:40.170706', '2024-08-29 20:49:40.170706', '', 'Adjust the barbell to just below shoulder height then load the desired weight onto the bar. Assume a shoulder width stance and place your hands at (or just outside of) shoulder width with a pronated grip on the bar. Step underneath the bar and unrack it while keeping the spine in a neutral position. Take two steps back, inhale, brace, and tuck the chin to prepare to go overhead. Dip slightly at the knees and hips, then press the bar to lockout overhead by extending your legs and arms simultaneously. Exhale once the bar gets to lockout and reverse the movement slowly while controlling the bar back to your chest. Repeat for the desired number of repetitions.', 'compound', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('b22e5ada-86c1-4104-828b-b7e06a7f5d16', 'Seated Neutral Grip Dumbbell Shoulder Press', '2024-08-29 20:52:10.197207', '2024-08-29 20:52:10.197207', '', 'Set up an adjustable angle bench to 90 degrees and select the desired weight from the rack. Pick up the dumbbells from the floor using a neutral grip (palms facing in). Position the end of the dumbbells on your knees and sit down on the bench. Using a safe and controlled motion, kick your knees up one at a time in order to get each dumbbell into place. Take a deep breath then press the dumbbells overhead by extending the elbows and contracting the deltoids. Slowly lower the dumbbells back to the starting position (the arms should be roughly 90 degrees or slightly lower depending upon limb lengths). Maintain a neutral grip throughout the duration of the exercise and repeat for the desired number of repetitions.', 'compound', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('7a933584-128c-4b82-8e5b-5e7312cadfdf', 'One-Arm Cable Front Raise', '2024-08-29 20:55:27.345366', '2024-08-29 20:55:27.345366', '', 'Set up for the exercise by attaching a single grip handle to a low pulley cable machine and selecting the weight you want to use. Stand facing away from the machine and grip the handle with one hand using an overhand grip (palm facing down). Stand up and hold the handle just off your thighs pulling weight off the stack. This is the starting position. To execute, slowly raise the handle to around shoulder height while keeping your arm straight and your body fixed. Pause, and then slowly lower the weight to the starting position. Do not allow the stack to drop or the handle to touch your body. Repeat for desired reps and then repeat using your right arm.', 'isolation', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('984e5dac-f3a8-4980-bfc9-da370cf45e46', 'Incline Rear Delt Fly', '2024-08-29 20:58:25.061062', '2024-08-29 20:58:25.061062', '', 'Set up for the exercise by setting an adjustable back bench to an angle of around 30-40 degrees. Grab a set of dumbbells and position yourself with your chest on the back of the bench (prone position). Plant your feet on the floor for stability and hold the dumbbells with a neutral grip. Take a deep breath and pull the dumbbells towards the ceiling using the rear deltoids. Slowly lower the dumbbells back to the starting position under control. Repeat for the desired number of repetitions.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('ff188494-a871-4721-9d1e-26742539080c', 'Cable Front Raise (Bilateral)', '2024-08-29 21:01:10.936876', '2024-08-29 21:01:10.936876', '', 'Assume a shoulder width stance with the cable running between your legs and grasp the handle with both hands using a pronated grip. Inhale, brace your abs, and raise the arms vertically while keeping the elbows slightly bent. Once the arms are parallel with the floor, slowly lower the handle back to the starting position. Repeat for the desired number of repetitions.', 'compound', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('68381c41-b015-4218-93cb-2bcb64bee255', 'One-Arm Standing Dumbbell Front Raise', '2024-08-29 21:09:08.306005', '2024-08-29 21:09:08.306005', '', 'Grab a dumbbell with a pronated grip and assume a shoulder-width stance. This is the starting position.
Inhale, brace your core and raise your arm vertically while keeping a slight bend in your elbow.
Moving only at the shoulder, continue raising the dumbbell until your arm is just above parallel to the floor.
Pause for a brief moment at the top of the movement, and slowly lower the dumbbell back to the starting position.
Repeat for desired reps, and then repeat the movement with your other arm.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('1fdffa53-d9cb-4aa1-9999-5c83fdb9be80', 'Hip Abduction Machine', '2024-08-31 21:55:50.613451', '2024-08-31 21:55:50.613451', '', 'Setup in an upright position with your back against the pad and your spine neutral. Exhale and push the legs apart as you open the pads. Once your hips are fully externally rotated, slowly return to the starting position. Repeat for the desired number of repetitions.', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('a8f9abc7-4515-4f5e-a4f5-095b1b17b9e1', 'Hip Adduction Machine', '2024-08-31 22:01:53.328901', '2024-08-31 22:01:53.328901', '', 'Setup in an upright position with your back against the pad and your spine neutral. Exhale and pull the legs together as you squeeze the pads inward. Once the pads touch, slowly return to the starting position. Repeat for the desired number of repetitions.', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('e1361643-e92a-419b-8eb8-fe2a188016e0', 'Cable Crunch', '2024-09-01 09:37:56.256671', '2024-09-01 09:37:56.256671', '', 'Attach the rope attachment to a high pulley cable and set the appropriate weight on the stack.
Stand directly in front of the cable machine, facing away from it.
Grasp the rope from behind your head with your palms facing inward and drop to your knees.
Your buttocks should be resting on top of your feet. Keeping your elbows bent and hands at either head height or shoulder height, crunch down as far as possible.
Pause, then slowly lower yourself back to the starting position.
Cable Crunch Tips:
This exercise works best when done slowly with perfect form.
Your buttocks should stay touching your heels at all times.
Focus on crunching the abs in, not pivoting at the hips.
As you increase weight it may be more comfortable to rest the rope on your shoulders.
Don''t choose a weight so heavy that your lower back handles most of the resistance.', 'isolation', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('7e80becf-491c-4b48-a98a-a36fff26e29c', 'Dumbbell Side Bends', '2024-09-01 12:13:55.734978', '2024-09-01 12:13:55.734978', '', 'This exercise works the obliques. Grasp a set of dumbbells. Stand straight up with one dumbbell in each hand, palms facing in.
Keep your feet firmly on the floor with a shoulder width stance.
Keeping your back straight and your eyes facing forwards, bend down to the right as far as you can, then back up again.
Without pausing at the top, bend down to the left.
Repeat for desired reps.
Side Bend Tips:
Always keep your back straight, eyes facing forwards, and bend at the torso only.
Concentrate on the stretch and contraction of the oblique muscles (down the side of your body).
Keep the dumbbells close to your body.
This exercise can also be performed while seated on the end of a bench.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('6e4bc8b2-33ab-46da-9b79-9fff2266cd27', 'Seated Calf Raise', '2024-09-01 12:41:05.640161', '2024-09-01 12:41:05.640161', '', 'Take a seat on the machine and place the balls of your feet on the platform with your toes pointed forward - your heels will naturally hang off. Position the base of your quads under the knee pad and allow your hands to rest on top. Extend your ankles and release the safety bar. Lower the heels by dorsiflexing the ankles until the calves are fully stretched. Extend the ankles and exhale as you flex the calves. Repeat for the assigned number of repetitions.

Tips:
- Keep the repetitions slow and controlled. Limit momentum and pause at the top to emphasize the contraction.
- Limit the depth of the heels if you feel any sort of stretch through the bottom of the foot during the exercise.
- Try to move through the ball of the foot rather than the base of the toes.', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('01dff88c-893b-4410-8d54-1e36013b9fdb', 'Seated Dumbbell Calf Raise', '2024-09-01 12:43:01.520267', '2024-09-01 12:43:01.520267', '', 'Set up by placing a step or block at the end of a flat bench. Next, grasp a pair of dumbbells and sit on the end of the bench. Put the balls of your feet on the edge of the step/block and rest the ends of the dumbbells on your thighs close to your knees. Let your heels drop as far as possible without hitting the floor. Slowly raise your heels off the floor as far as possible. Squeeze the calves and pause, and then slowly lower your heels back to the starting position. Repeat for desired reps.

Tips:
- Don''t let your heels touch the floor at any time throughout the exercise.
- Pause and squeeze the calves for a count of 1-2 at the top of the movement to add intensity.', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('d2f28afc-e84c-467c-90d9-c6c2cb63acbc', '45 Degree Leg Press Calf Raise', '2024-09-01 12:47:02.01513', '2024-09-01 12:47:02.01513', '', 'Load the machine with the desired weight and take a seat.
Sit down and position your feet on the sled with a shoulder width stance.
Take a deep breath, extend your legs, but keep the safeties locked (if possible).
Position your feet at the base of the platform and allow the heels to hang off.
Lower the heels by dorsiflexing the ankles until the calves are fully stretched.
Drive the weight back to the starting position by extending the ankles and flexing the calves.
Repeat for the desired number of repetitions.
SAFETY NOTE: Be extremely careful when re-positioning the feet at the base of the platform. If the safeties are not in place and you lose control of the platform, this could result in very serious injury.
Keep the repetitions slow and controlled. Limit momentum and pause at the top to emphasize the contraction.
If you experience any sort of pain or pressure in the back of the knee joint, keep a slight bend in the knee and avoid complete lockout.
If the knee isn’t entirely locked out then ensure the position doesn’t change during the duration of the repetition.
Limit depth of the heels if you feel any sort of stretch through the bottom of the foot during the exercise.
Try to move through the ball of the foot rather than the base of the toes.', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('de4e9652-b068-4558-9fd3-38d45e5aa0d9', 'Toes In Seated Calf Raise', '2024-09-01 12:49:37.135904', '2024-09-01 12:49:37.135904', '', 'Take a seat on the machine and place the balls of your feet on the platform with your toes pointed in - your heels will naturally hang off. Position the base of quads under the knee pad and allow your hands to rest on top.
Extend your ankles and release the safety bar.
Lower the heels by dorsiflexing the ankles until the calves are fully stretched.
Extend the ankles and exhale as you flex the calves.
Repeat for the assigned number of repetitions.
Keep the repetitions slow and controlled. Limit momentum and pause at the top to emphasize the contraction.
Limit depth of the heels if you feel any sort of stretch through the bottom of the foot during the exercise.
Try to move through the ball of the foot rather than the base of the toes.', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('7227c8f6-cf65-4134-97de-d5e64cb5ff1b', 'Toes Out 45 Degree Calf Raise', '2024-09-01 12:51:11.813368', '2024-09-01 12:51:11.813368', '', 'Load the desired weight on a 45-degree leg press and sit down on the seat.
Place the balls of your feet on the bottom edge of the foot plate and twist your ankles so that your heels come together and your toes point out.
Push the weight up and disengage the weight platform from the safety using the handles by your sides.
Slowly allow your toes to come back as far as possible. This is the starting position for the exercise.
Keeping your legs straight, slowly push your toes up as far as possible.
Squeeze the calf muscles, and then slowly lower the weight back to the starting position.
Repeat for desired reps.
The reason you point your toes out for this exercise is to emphasize the inner calf. Whether this technique is effective for inner calf training is still being debated amongst lifters.
Make sure the balls of your feet are right on the edge of the footplate. If you position them further in, the exercise becomes easier.
Use a full range of motion by allowing your toes to come right back and then raising them as far as possible.
Keep the rep timing slow and control the weight - don''t bounce!', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('46b1efa3-a4f8-4492-a81c-9e48c650dd3d', 'Toes In Smith Machine Calf Raise', '2024-09-01 12:52:29.675', '2024-09-01 12:52:29.675', '', 'Set the bar on the smith machine to around shoulder height and rack up the weight you want to use.
Grab a step, calf block, or weight plate and put it below the bar.
Step up on the block and position the balls of your feet on the edge.
Twist your feet so that your toes are pointing in at each other.
Grasp the smith bar with a wide grip and position it across the top of your back muscles (not across the back of your neck).
Push up to take the weight off the rack and slowly let your heels drop down as far as possible. This is the starting position.
Slowly raise your heels as far as you can off the floor.
Squeeze the calf muscles, and then slowly lower your heels back to the starting position.
Repeat for desired reps.
The idea behind pointing your toes in for the smith machine calf raise is to emphasize the outer part of the calf muscle. This theory is still debated amongst lifters.
Don''t let your heels touch the floor throughout the set.
The balls of your feet should be right on the edge of the block. Do not allow them to come forward as it makes the exercise less challenging.
Use the maximum range of motion by allowing your heels to drop as far as possible and then raising them as high as possible.
Focus on not allowing your knees to bend.', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('89ffca84-73f0-4a69-871f-9d9c96521a05', 'Toes Out Smith Machine Calf Raise', '2024-09-01 12:54:31.257041', '2024-09-01 12:54:31.257041', '', 'Set the bar on the smith machine to around shoulder height and rack up the weight you want to use.
Grab a step, calf block, or weight plate and put it below the bar.
Step up on the block and position the balls of your feet on the edge.
Twist your feet so that your toes are pointing away from each other. Your heels should be almost touching, in a ''V'' format.
Grasp the smith bar with a wide grip and position it across the top of your back muscles (not across the back of your neck).
Push up to take the weight off the rack and slowly let your heels drop down as far as possible. This is the starting position.
Slowly raise your heels as far as you can off the floor.
Squeeze the calf muscles, and then slowly lower your heels back to the starting position.
Repeat for desired reps.
The idea behind pointing your toes out for the smith machine calf raise is to emphasize the inner part of the calf muscle. This theory is still debated amongst lifters.
Don''t let your heels touch the floor throughout the set.
The balls of your feet should be right on the edge of the block. Do not allow them to come forward as it makes the exercise less challenging.
Use the maximum range of motion by allowing your heels to drop as far as possible and then raising them as high as possible.
Focus on not allowing your knees to bend.', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('f11c8751-e5ca-413e-b30d-2b387ec14733', 'Toes Out Seated Calf Raise', '2024-09-01 12:56:50.688111', '2024-09-01 12:56:50.688111', '', 'Take a seat on the machine and place the balls of your feet on the platform with your toes pointed out - your heels will naturally hang off. Position the base of quads under the knee pad and allow your hands to rest on top.
Extend your ankles and release the safety bar.
Lower the heels by dorsiflexing the ankles until the calves are fully stretched.
Extend the ankles and exhale as you flex the calves.
Repeat for the assigned number of repetitions.
Keep the repetitions slow and controlled. Limit momentum and pause at the top to emphasize the contraction.
Limit depth of the heels if you feel any sort of stretch through the bottom of the foot during the exercise.
Try to move through the ball of the foot rather than the base of the toes.', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('9e348a26-e5d0-4ee0-b3e6-fe58563ac698', 'Hack Squat Calf Raise', '2024-09-01 13:30:53.56497', '2024-09-01 13:30:53.56497', '', 'Load the weight you want to use on a hack squat machine.
Stand on the foot plate facing the machine with your chest on the back pad and shoulders under the shoulder pads.
If you have a block available, put it on the foot plate and use it to stand on for extra range of motion.
Push up and take the weight off the rack by releasing the safety.
Keeping your legs straight, slowly raise your heels off the floor as far as possible.
Pause, and then slowly lower back to the starting position without letting your heels fully rest on the foot plate.
Squeeze the calf muscles and hold for a count of two at the top of the movement for added intensity.
Don''t let your heels fully rest on the footplate at the bottom of the movement.
Keep your back straight, and chest against the padding throughout the set.', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('548b3de6-0980-4795-ab86-763c20dbc325', 'Dumbbell Bench Press', '2024-09-02 14:01:43.604308', '2024-09-02 14:01:43.604308', '', 'The dumbbell bench press is a variation of the barbell bench press and an exercise used to build the muscles of the chest. It is recommended after reaching a certain point of strength on the barbell bench press to avoid pec and shoulder injuries. The exercise requires maintaining shoulder stability throughout, making it a great test of strength and control.', 'compound', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('47f00a63-05df-4db7-b2c7-68000c72be9b', 'Incline Dumbbell Bench Press', '2024-09-02 14:03:25.447382', '2024-09-02 14:03:25.447382', '', 'The incline dumbbell bench press is a variation of the incline bench press and an exercise used to build the muscles of the chest, with a focus on the upper chest. The shoulders and triceps are also engaged, making it a great compound movement for upper body strength. The use of dumbbells ensures balanced strength and can help prevent injuries.', 'compound', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('c0a055b2-daf6-4ecc-b97b-cfedfce6a42a', 'Dumbbell Pullover', '2024-09-02 14:05:57.412015', '2024-09-02 14:05:57.412015', '', 'The dumbbell pullover is a compound exercise that primarily targets the chest, with significant involvement of the lats, shoulders, and triceps. This movement helps build upper body strength and can be incorporated into chest, upper body, and full-body workouts. Maintaining proper form is crucial to maximize benefits and avoid injury.', 'compound', 'free', 'push', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('2bc37dec-7b06-404c-af63-99bf3f60fb68', 'Dumbbell Pullover', '2024-09-02 14:06:48.380733', '2024-09-02 14:06:48.380733', '', 'The dumbbell pullover is a compound exercise that primarily targets the chest, with significant involvement of the lats, shoulders, and triceps. This movement helps build upper body strength and can be incorporated into chest, upper body, and full-body workouts. Maintaining proper form is crucial to maximize benefits and avoid injury.', 'compound', 'free', 'push', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('3488eaaa-a999-43c5-acd6-b177b8a3df8a', 'Dumbbell Flys', '2024-09-02 14:08:08.34696', '2024-09-02 14:08:08.34696', '', 'The dumbbell fly is a classic bodybuilding movement designed to isolate the chest muscles, promoting growth and strength. This exercise is ideal for aesthetic-focused chest workouts, often used to build a stronger bench press. Maintaining proper form is key to effectively targeting the chest and avoiding unnecessary strain on the shoulders.', 'isolation', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('b2e39ab6-118d-46bd-ad8c-8acf9864af6c', 'Barbell Bench Press', '2024-09-02 14:57:19.319304', '2024-09-02 14:57:19.319304', '', 'The barbell bench press is a fundamental compound exercise that primarily targets the chest, with significant involvement of the shoulders and triceps. As a key lift in powerlifting, bodybuilding, and athletic training, it is essential for upper body strength development. Proper technique is crucial to maximize effectiveness and prevent injury.', 'compound', 'free', 'push', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('885918a3-5c64-4f15-982e-1b9a91cb3743', 'Incline Bench Press', '2024-09-02 14:58:44.028336', '2024-09-02 14:58:44.028336', '', 'The incline bench press is a variation of the bench press designed to target the upper chest, with additional engagement of the shoulders and triceps. This compound exercise is essential for building upper body strength and is commonly included in chest, upper body, and full-body workouts.', 'compound', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('21370a0a-b01b-4e32-8f43-8648a54cd35c', 'Pec Dec (Butterfly)', '2024-09-02 15:01:10.954626', '2024-09-02 15:01:10.954626', '', 'The Pec Dec (Butterfly) machine is an excellent tool for isolating the chest muscles, making it ideal for beginners and those looking to focus on chest development. The exercise primarily targets the pectoralis muscles while also engaging the shoulders. Proper form is essential to maximize the benefits of this isolation movement.', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('e1511aa4-1d34-4984-aa54-88f88029a96e', 'Cable Crossovers (Mid Chest)', '2024-09-02 15:03:16.600447', '2024-09-02 15:03:16.600447', '', 'Cable crossovers (mid chest) are a variation of the chest fly that target the chest, shoulders, and triceps. This isolation exercise is ideal for those looking to increase chest muscle mass and can be included in chest, push, upper body, or full-body workouts.', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('fff561d6-3738-4360-a110-f93dcb3c8c10', 'Hammer Strength Bench Press', '2024-09-02 15:21:42.987341', '2024-09-02 15:21:42.987341', '', 'The Hammer Strength Bench Press is a machine-based variation of the traditional bench press that targets the chest, shoulders, and triceps. The fixed movement pattern allows for greater isolation of the chest muscles, making it an ideal exercise for hypertrophy-focused workouts. It''s best used towards the end of your chest workout after more compound variations.', 'compound', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('db9ff44c-2e27-42df-8f6a-1b64429999e1', 'Chest Dip', '2024-09-02 15:26:06.627831', '2024-09-02 15:26:06.627831', '', 'The chest dip is a powerful exercise for targeting the lower region of the chest, with additional engagement of the triceps, shoulders, and abs. This compound movement is particularly effective for building chest strength and size, providing a unique vertical pressing pattern. It''s best mastered with bodyweight before progressing to weighted variations.', 'compound', 'body_weight', 'push', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('4d3a89ab-70ae-4311-8b40-a058b2f3057b', 'Seated Dumbbell Tricep Extension', '2024-08-23 14:41:48.900488', '2024-08-23 14:41:48.900488', 'https://www.dmoose.com/cdn/shop/articles/1_f16231a6-e9e2-4ff0-b3f1-b1ccdfbac2dc.jpg?v=1658323250', 'Select the desired weight from the rack and position an adjustable bench at 90 degrees.
To get into position, sit in an upright position and lift the dumbbell to the top of your shoulder. Take a deep breath, overlap your hands around the dumbbell, then press it into position overhead.
Maintain an overlapping grip and slowly lower the dumbbell behind your head by unlocking your elbows.
Once your forearms reach parallel or just below, drive the dumbbell back to the starting point by extending the elbows and flexing the triceps.
Repeat for the desired number of repetitions.', 'isolation', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('c5901a9a-580c-411b-85bd-2ec738123e14', 'Hanging Knee Raise', '2024-09-01 12:26:49.231068', '2024-09-01 12:26:49.231068', '', 'The hanging knee raise hits your lower abs. You can hang from literally anything to do this exercise, but the most popular method is hanging from a pull up bar.
Grip the bar with hands around shoulder width apart. Increase the width if you''re tall and your feet touch the floor.
Once you''re hanging with your feet slightly off the floor, slowly pull your knees up keeping your legs together.
Pause for a second, and slowly lower your knees back to the starting position.
Repeat for desired reps.
Knee Raise Tips:
You must do this exercise slowly. If you want to get the most benefit out of the hanging knee raise, slow it down.
As you become more advanced, you can place a dumbbell between your feet.
Avoid swinging your body, keeping your torso as still as possible.', 'compound', 'body_weight', 'pull', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('f2cf498f-d991-4b85-b08e-58c5f9ff563e', 'Hanging Leg Raise', '2024-09-01 12:11:44.128319', '2024-09-01 12:11:44.128319', '', 'The hanging leg raise is an awesome exercise for building the lower abs. All you need for this exercise is somewhere to hang from. It could be a chinup bar or it could be a tree.
Once you''re hanging, tense up the midsection. While keeping your legs straight, raise them up slowly. You should raise your legs as high as possible.
Pause for a second, and slowly lower your legs back to the starting position.
Repeat for desired reps.
Leg Raise Tips:
Speed is so important with the hanging leg raise. If you swing your legs, you''re using momentum and your abs will not benefit much from the exercise.
Do not allow your body to swing. Keep your torso as still and controlled as possible.
Advanced lifters can add weight by holding a dumbbell between the feet.', 'isolation', 'body_weight', 'pull', 'advanced');
INSERT INTO public.exercise_examples VALUES ('2f49a8e8-6f42-422c-aa6f-c23e215620e2', 'Decline Sit-Up', '2024-09-01 12:14:59.677632', '2024-09-01 12:14:59.677632', '', 'Set the decline bench to an angle of between 30 and 45 degrees (the more the angle, the harder the sit-ups will be).
Sit on the bench with your legs resting through the pads.
Cross your arms across your chest and lean back until your back almost touches the bench.
Raise yourself back up until your upper body is vertical, then lower again.
Sit Up Tips:
Don''t go too far down or up. Your back should never touch the bench and you only need to pull up until your upper body is vertical.
You can add a twist to work your obliques harder if you like.
Hold a weight plate or dumbbell in your arms for added resistance and intensity.', 'isolation', 'body_weight', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('f2868e11-6e1d-4ce4-a1a8-eb0384a60b71', 'Floor Crunch (Legs on Bench)', '2024-09-01 12:24:23.199368', '2024-09-01 12:24:23.199368', '', 'Set up for the floor crunch by laying a mat down on the floor and positioning a flat bench at the end of the mat to form a T shape.
Lay down on the mat and put your legs up on the bench. Your calves should be resting on the top of the bench and your legs should be bent at right angles.
Touch the side of your head with your fingertips (do not put your arms behind your neck!).
Lift your shoulder blades slightly off the mat to start the exercise, then crunch your abs bringing your elbows in towards your waist.
Pause for 1 second at the top, and slowly lower back down to the start position.
Crunch Tips:
Keep your shoulder blades just off the mat for the entire set.
Pause for longer at the top of the movement to add extra intensity.', 'isolation', 'body_weight', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('38af9c0d-b19f-433d-bcda-0b974b5475cf', 'Twisting Hanging Knee Raise', '2024-09-01 12:25:43.155571', '2024-09-01 12:25:43.155571', '', 'The twisting hanging knee raise hits the lower abs and obliques. You can hang off literally anything that will hold your weight for this exercise. Most people will hang from a pull up bar. Hang off the bar with a slightly wider than shoulder width grip.
Once you''re hanging with your feet slightly off the floor, pull your knees up and across to the left side of your body.
Pause, then slowly lower them back down.
Now raise your knees up and across to the right side of your body.
Lower back to start position. This is one rep.
Repeat for desired reps.
Exercise Tips:
Hold at the top of the movement (with your knees up) to increase the intensity of the twisting knee raise.
Advanced athletes can add weight by holding a dumbbell between the feet.', 'compound', 'body_weight', 'pull', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('ec09f8c7-04cf-4219-8033-3dd17ea5c1d9', 'Incline Dumbbell Flys', '2024-09-02 20:16:40.175747', '2024-09-02 20:16:40.175747', '', 'Incline dumbbell flys are an isolation exercise used to target the upper chest. This exercise is ideal for lifters focusing on aesthetics and can be included in hypertrophy-focused chest or upper body workouts. The incline angle places extra emphasis on the upper portion of the chest, making it a valuable addition to any chest routine.', 'isolation', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('9be8d3a0-574b-40dc-a42c-06ab42af7e66', 'Close Grip Dumbbell Press (Crush Press)', '2024-09-02 20:18:44.729356', '2024-09-02 20:18:44.729356', '', 'The Close Grip Dumbbell Press, also known as the Crush Press, is a variation of the dumbbell bench press that focuses on the chest and triceps. By pressing the dumbbells together throughout the movement, this exercise maximizes chest activation and increases tricep involvement, making it ideal for those looking to build a stronger chest and triceps.', 'compound', 'free', 'push', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('82890348-a566-4762-b9b4-f89e52534936', 'Cable Crossovers (Upper Chest)', '2024-09-02 20:20:26.742528', '2024-09-02 20:20:26.742528', '', 'Cable Crossovers (Upper Chest) are an isolation exercise focused on targeting the upper chest. This movement is particularly effective for emphasizing the clavicular head of the pectoralis major, making it a valuable addition to upper chest and push workouts.', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('13fcd794-54fb-413f-8bbf-44353cd29869', 'Cable Iron Cross', '2024-09-02 20:22:38.703372', '2024-09-02 20:22:38.703372', '', 'The Cable Iron Cross is an isolation exercise that targets the chest, with significant activation of the shoulders and triceps. This movement is effective for building chest muscle mass and is commonly included in chest, push, upper body, or full-body workouts.', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('3d0c8e76-37a9-4f4c-84fa-47a6a07aaacc', 'Decline Bench Press', '2024-09-02 20:26:26.267059', '2024-09-02 20:26:26.267059', '', 'The Decline Bench Press is a variation of the bench press that primarily targets the lower chest, with additional activation of the shoulders and triceps. This compound exercise is effective for developing overall chest strength, with a particular emphasis on the lower pectoral region. It is commonly included in chest, push, upper body, and full-body workouts.', 'compound', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('8a39b1e7-986c-41e7-a0b9-44a4efb46360', 'Reverse Grip Dumbbell Bench Press', '2024-09-02 20:27:53.772919', '2024-09-02 20:27:53.772919', '', 'The Reverse Grip Dumbbell Bench Press is a variation of the traditional dumbbell bench press that targets the upper chest, shoulders, and triceps. By using a reverse grip, this exercise places a greater emphasis on the upper portion of the chest, making it an effective movement for developing upper body strength and definition.', 'compound', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('ff20bd08-57ae-465f-aa54-d1ba0f7862a9', 'Push Up', '2024-09-02 20:29:17.383422', '2024-09-02 20:29:17.383422', '', 'The push up is a classic bodyweight exercise that targets the chest, with significant engagement of the shoulders, triceps, and core. This movement is fundamental for building upper body strength and promoting shoulder stability, making it a staple in various workout routines.', 'compound', 'body_weight', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('8a73b841-1d4e-4808-8ed7-58c4931e0e96', 'Decline Dumbbell Bench Press', '2024-09-02 20:31:29.272118', '2024-09-02 20:31:29.272118', '', 'The Decline Dumbbell Bench Press is a variation of the decline bench press that uses dumbbells, allowing for a greater range of motion and increased shoulder stability. This exercise primarily targets the lower chest while also engaging the shoulders, triceps, and core, making it a highly effective movement for developing the lower pectoral muscles.', 'compound', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('b720265e-a3ce-48d3-8e8e-87e05c07b8a3', 'Standing Low to High Cable Fly', '2024-09-02 20:35:21.719463', '2024-09-02 20:35:21.719463', '', 'The Standing Low to High Cable Fly is an isolation exercise targeting the lower chest. This movement is ideal for those looking to increase chest muscle mass and is typically included in chest, push, upper body, or full-body workouts.', 'isolation', 'fixed', 'push', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('f6dd98f1-ad1d-4ea2-ba97-9939ce0fc028', 'Smith Machine Incline Bench Press', '2024-09-02 20:38:34.922216', '2024-09-02 20:38:34.922216', '', 'The Smith Machine Incline Bench Press is a compound exercise that targets the upper chest, with additional involvement of the shoulders and triceps. The Smith machine provides a safe and controlled environment for pressing movements, making it a great option for beginners or those lifting heavier weights without a spotter.', 'compound', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('f467d244-5568-40f6-bd7a-b3bdcad82398', 'Standing High to Low Cable Fly', '2024-09-02 20:40:09.521144', '2024-09-02 20:40:09.521144', '', 'The Standing High to Low Cable Fly is an isolation exercise that targets the lower chest, with additional activation of the middle chest, shoulders, and triceps. This exercise is ideal for those looking to increase muscle mass and is commonly included in chest, push, upper body, or full-body workouts.', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('2780e6d9-a86f-4038-b96f-ef59f961cb4b', 'Cable Chest Press', '2024-09-02 20:42:00.04352', '2024-09-02 20:42:00.04352', '', 'The Cable Chest Press is a compound exercise that targets the chest, with significant involvement of the shoulders and triceps. This movement is ideal for those looking to increase muscle mass and can be included in chest, push, upper body, or full-body workouts. It requires core stability and is best used as an accessory exercise to build the pushing muscles of the body.', 'compound', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('e68781f2-7021-4907-af54-de18b80d181a', 'Decline Push Up', '2024-09-02 20:59:37.517802', '2024-09-02 20:59:37.517802', '', 'The Decline Push Up is a bodyweight exercise that targets the upper chest, mimicking the movement pattern of an incline bench press. This exercise also engages the shoulders, triceps, and core, making it an excellent progression for those looking to increase the challenge of their push up routine.', 'compound', 'body_weight', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('5b7d739c-d130-466c-a5ac-9e8b318b77ad', 'Smith Machine Bench Press', '2024-09-02 21:01:10.551319', '2024-09-02 21:01:10.551319', '', 'The Smith Machine Bench Press is a compound exercise that primarily targets the chest, with additional activation of the shoulders and triceps. This exercise offers a safer and more controlled alternative to the traditional bench press, making it an excellent choice for beginners or those lifting heavier weights without a spotter.', 'compound', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('3edb750e-4725-4338-a079-d48dc8797917', 'Decline Dumbbell Flys', '2024-09-02 21:02:37.703332', '2024-09-02 21:02:37.703332', '', 'The Decline Dumbbell Flys are an isolation exercise that targets the lower chest. This exercise is particularly effective for isolating the lower pectoral muscles due to the decline angle, making it an excellent addition to chest-focused workout routines.', 'isolation', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('ff2d84fc-ff6d-4637-8128-91c1495c98e8', 'Incline Cable Flys', '2024-09-02 21:04:38.427162', '2024-09-02 21:04:38.427162', '', 'The Incline Cable Flys are an isolation exercise that primarily targets the upper chest. This exercise is especially effective for targeting the upper portion of the pec muscles, making it a valuable accessory movement in chest-focused workouts.', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('c2059aab-d7b5-4532-a8a7-ad15a4054b33', 'Standing High to Low Cable Fly', '2024-09-02 21:07:15.394991', '2024-09-02 21:07:15.394991', '', 'The Standing High to Low Cable Fly is an isolation exercise that primarily targets the lower chest, while also engaging the middle chest, shoulders, and triceps. This exercise is effective for building muscle mass and is commonly included in chest, push, upper body, or full-body workouts.', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('118eab6d-cae9-4c0b-b8e6-57f3e5541f1a', 'Flat Bench Cable Flys', '2024-09-02 21:09:41.728008', '2024-09-02 21:09:41.728008', '', 'The Flat Bench Cable Flys are an isolation exercise that primarily targets the chest, with additional engagement of the shoulders and triceps. This movement is effective for building chest muscle mass and is commonly included in chest, push, upper body, or full-body workouts.', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('9a4eec3b-3f0b-4b36-a2b5-0f544376cf78', 'Decline Cable Chest Press', '2024-09-02 21:11:10.373493', '2024-09-02 21:11:10.373493', '', 'The Decline Cable Chest Press is an isolation exercise that targets the lower chest, with additional activation of the shoulders and triceps. Using cables allows for constant tension on the muscle groups, making it an effective movement for building chest muscle mass.', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('61a31a0d-a736-48b5-b03e-44aa1ad7f3eb', 'Seated Barbell Wrist Curl', '2024-09-03 08:30:59.451731', '2024-09-03 08:30:59.451731', '', 'The Seated Barbell Wrist Curl is an isolation exercise that targets the forearm muscles. This movement is particularly effective for strengthening grip and improving forearm size, making it a valuable addition to any strength training routine.', 'isolation', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('c5864272-ae27-4363-add6-7ead1b7b3379', 'Reverse Grip Barbell Curl', '2024-09-03 08:32:01.580419', '2024-09-03 08:32:01.580419', '', 'The Reverse Grip Barbell Curl is an isolation exercise that targets the forearms and biceps. The pronated grip emphasizes the forearm muscles, making this a great addition to bicep or upper body workouts.', 'isolation', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('ddaf509f-3c99-437c-b872-a4651a91601f', 'Behind-The-Back Barbell Wrist Curl', '2024-09-03 08:33:21.446664', '2024-09-03 08:33:21.446664', '', 'The Behind-The-Back Barbell Wrist Curl is an isolation exercise that specifically targets the forearm muscles. It is a highly effective movement for building grip strength and increasing forearm size. Focus on controlled movements and a full range of motion for the best results.', 'isolation', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('d3f54e1c-6333-4a15-b09b-0264ec0b68fe', 'Reverse Grip Barbell Curl (EZ Bar)', '2024-09-03 08:35:16.704123', '2024-09-03 08:35:16.704123', '', 'The Reverse Grip Barbell Curl with an EZ Bar is an isolation exercise that targets the forearms and biceps. The pronated grip emphasizes the forearm muscles, making this a great addition to bicep or upper body workouts.', 'isolation', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('414a1891-1a28-4dbe-84e3-a992c6e879bc', 'Seated Neutral Grip Dumbbell Wrist Curl', '2024-09-03 08:56:48.824003', '2024-09-03 08:56:48.824003', '', 'The Seated Neutral Grip Dumbbell Wrist Curl is an isolation exercise that targets the forearm muscles. This movement is highly effective for building grip strength and increasing forearm size. It can be included in various upper body or forearm-specific workout routines.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('d59d340d-774d-4c81-8b3d-251175936221', 'Reverse Grip Barbell Wrist Curl (Over Bench)', '2024-09-03 09:26:50.08384', '2024-09-03 09:26:50.08384', '', 'The Reverse Grip Barbell Wrist Curl (Over Bench) is an isolation exercise that targets the forearm muscles. Utilizing a bench provides extra stability, allowing for focused movement and greater muscle engagement, making it an effective exercise for building forearm strength and size.', 'isolation', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('10870aab-3086-462e-a64e-14710e3fbffe', 'One-Arm Seated Dumbbell Wrist Curl', '2024-09-03 09:28:24.986138', '2024-09-03 09:28:24.986138', '', 'The One-Arm Seated Dumbbell Wrist Curl is an isolation exercise that targets the forearm muscles. This unilateral movement is effective for correcting imbalances and enhancing grip strength, making it a valuable addition to any strength training routine.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('bb9c756b-0c9e-4e87-826f-bb2cbd16d86b', 'Dumbbell Wrist Curl (Over Bench)', '2024-09-03 09:30:01.935018', '2024-09-03 09:30:01.935018', '', 'The Dumbbell Wrist Curl (Over Bench) is an isolation exercise that targets the forearm muscles. Using a bench for support allows for focused movement and greater muscle engagement, making it an effective exercise for building forearm strength and size.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('7545289f-f7c8-456b-98e9-f7b15600254c', 'Seated Reverse Dumbbell Wrist Curl', '2024-09-03 09:32:06.540342', '2024-09-03 09:32:06.540342', '', 'The Seated Reverse Dumbbell Wrist Curl is an isolation exercise that targets the forearm muscles, particularly focusing on improving grip strength and forearm size. This exercise is ideal for building strong forearms and can be incorporated into upper body or forearm-specific workouts.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('b35c5710-3c80-4f48-8ee4-295e5a15999f', 'Reverse Grip Cable Curl', '2024-09-03 09:34:29.268873', '2024-09-03 09:34:29.268873', '', 'The Reverse Grip Cable Curl is an isolation exercise that targets the forearms and biceps. This movement is ideal for building forearm strength while also engaging the biceps, making it a great addition to upper body or arm-specific workouts.', 'isolation', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('d7871e0c-5e1b-4ffd-a9ab-951028246a01', 'Behind-The-Back Cable Wrist Curl', '2024-09-03 09:37:05.548408', '2024-09-03 09:37:05.548408', '', 'The Behind-The-Back Cable Wrist Curl is an isolation exercise that targets the forearm muscles. Using a cable machine allows for continuous tension, making it a highly effective exercise for building forearm strength and size.', 'isolation', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('b53daf0a-c7b6-4be8-9230-b33695eb5340', 'Seated Reverse Barbell Wrist Curl', '2024-09-03 09:38:26.916652', '2024-09-03 09:38:26.916652', '', 'The Seated Reverse Barbell Wrist Curl is an isolation exercise that targets the forearm muscles. This movement is particularly effective for building forearm strength and improving grip, making it a great addition to upper body or forearm-specific workouts.', 'isolation', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('60bd8dbc-6bb8-4be0-9ee7-f4c5a295c5b4', 'Reverse Grip Preacher Curl (EZ Bar)', '2024-09-03 09:39:30.846405', '2024-09-03 09:39:30.846405', '', 'The Reverse Grip Preacher Curl with an EZ Bar is an isolation exercise that targets the forearms and biceps. The preacher bench provides a focused angle that emphasizes the biceps while the reverse grip ensures the forearms are heavily engaged.', 'isolation', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('a2f8dd49-606e-4d86-ae04-8af61c0b40e9', 'Seated Reverse Grip Cable Wrist Curl', '2024-09-03 09:42:04.632581', '2024-09-03 09:42:04.632581', '', 'The Seated Reverse Grip Cable Wrist Curl is an isolation exercise that targets the forearm muscles. Using a cable machine with a reverse grip allows for continuous tension, making it an effective movement for building forearm strength and size.', 'isolation', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('b515dd55-701a-45f4-938f-fdb26d2d5cba', 'Seated Cable Wrist Curl', '2024-09-03 09:43:17.728797', '2024-09-03 09:43:17.728797', '', 'The Seated Cable Wrist Curl is an isolation exercise that targets the forearm muscles. Utilizing a cable machine with a straight bar, this exercise provides continuous tension, making it effective for building forearm strength and improving grip.', 'isolation', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('f5f03cc7-c2bc-4367-9042-107114d634ce', 'Barbell Wrist Curl (Over Bench)', '2024-09-03 09:44:32.006932', '2024-09-03 09:44:32.006932', '', 'The Barbell Wrist Curl (Over Bench) is an isolation exercise that targets the forearm muscles. Using a bench for support enhances stability and focus, making it effective for building forearm strength and improving grip.', 'isolation', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('78b3c689-0222-46de-a7b3-9bd6c75b920c', 'Barbell Hip Thrust', '2024-09-03 11:07:53.745619', '2024-09-03 11:07:53.745619', '', 'The Barbell Hip Thrust is an isolation exercise targeting the glutes, with secondary emphasis on the hamstrings. It is highly effective for building glute strength and size, with carryover benefits to other lower body exercises like squats and deadlifts.', 'isolation', 'fixed', 'push', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('7d823dc8-8303-4ddd-a25d-935569c662b7', 'Hyperextension', '2024-09-03 11:04:13.299536', '2024-09-03 11:04:13.299536', '', 'The Hyperextension is an isolation exercise targeting the glutes, with secondary emphasis on the hamstrings and rhomboids. This exercise is effective for enhancing gluteal strength and can be integrated into leg workouts or full body routines.', 'isolation', 'body_weight', 'hinge', 'beginner');
INSERT INTO public.exercise_examples VALUES ('b39cc5b5-8335-4918-a504-f9cdfb85ceba', 'Good Mornings', '2024-09-03 11:13:27.408276', '2024-09-03 11:13:27.408276', '', 'Good Mornings are a compound exercise targeting the glutes, with significant engagement of the hamstrings, lower back, and upper back. This exercise can be highly effective for strengthening the posterior chain and improving hip hinge mechanics.', 'compound', 'fixed', 'hinge', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('d806b4f1-399c-4ceb-bb91-663ec0350e6d', 'Reverse Hyperextension', '2024-09-03 11:21:01.336163', '2024-09-03 11:21:01.336163', '', 'The Reverse Hyperextension is an isolation exercise targeting the glutes, with secondary emphasis on the hamstrings and rhomboids. It helps improve glute strength and can enhance performance in deadlifts and squats.', 'isolation', 'body_weight', 'hinge', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('3a39a222-7b4d-4e0e-9e7e-034d78b5d6bf', 'Good Mornings Off Pins', '2024-09-05 12:48:41.905041', '2024-09-05 12:48:41.905041', '', 'Good Mornings Off Pins are a variation of the good morning exercise, primarily targeting the glutes, hamstrings, lower back, and upper back. This version forces the lifter to reset form after every rep, eliminating momentum and ensuring full engagement of the target muscles.', 'compound', 'fixed', 'hinge', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('be3c01a7-3bd0-448c-844b-583bd824c90b', 'Dumbbell Stiff Leg Deadlift', '2024-09-05 12:54:46.778198', '2024-09-05 12:54:46.778198', '', 'The Dumbbell Stiff Leg Deadlift primarily targets the hamstrings, with secondary emphasis on the glutes and rhomboids. It is a compound exercise performed by hinging at the hips while keeping the back straight, focusing on stretching the hamstrings and contracting them during the ascent.', 'compound', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('1dcd59ab-674e-49d8-9a06-9c17c2a05730', 'Conventional Deadlift', '2024-09-05 12:56:19.187681', '2024-09-05 12:56:19.187681', '', 'The deadlift primarily targets the hamstrings but also requires muscle activation from the back, glutes, arms, and core. It’s a hip-hinge movement where the weight is lifted from the ground to hip level, engaging multiple muscle groups.', 'compound', 'free', 'hinge', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('05b3842c-2a19-484e-bae3-a12e86c2fa4c', 'Leg Curl', '2024-09-05 12:59:02.097116', '2024-09-05 12:59:02.097116', '', 'The leg curl isolates the hamstrings. Set up the machine, adjust the padding to your leg length, and curl the weight up by contracting the hamstrings. Lower it slowly for a full range of motion.', 'isolation', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('ad98534e-b2d9-4fef-9983-578ef12b28f7', 'Stiff Leg Deadlift', '2024-09-05 13:05:01.285262', '2024-09-05 13:05:01.285262', '', 'Position the bar over the top of your shoelaces and assume a hip width stance. Push your hips back and hinge forward until your torso is nearly parallel with the floor. Reach down and grasp the bar using a shoulder width, double overhand grip. Ensure your spine is neutral, shin is vertical, and your hips are roughly the same height as your shoulders. Drive through the whole foot and focus on pushing the floor away. Ensure the bar tracks in a straight line as you extend the knees and hips. Once you have locked out the hips, reverse the movement by pushing the hips back and hinging forward. Return the bar to the floor, reset, and repeat for the desired number of repetitions.', 'compound', 'free', 'hinge', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('b5c6e6a6-6eec-422c-ad4a-8dca82287312', 'Romanian Deadlift (RDL)', '2024-09-05 13:06:37.160782', '2024-09-05 13:06:37.160782', '', 'Position the bar over the top of your shoelaces and assume a hip width stance. Assume a double overhand grip just outside of hip width and deadlift the weight into position at the top with the hips and knees locked out. Begin the RDL by pushing your hips back and hinging forward until the bar is just below knee height. Drive through the whole foot and focus on pushing the floor away. Return to the starting position and repeat for the desired number of repetitions.', 'compound', 'free', 'hinge', 'beginner');
INSERT INTO public.exercise_examples VALUES ('9b3f9b20-544d-49e1-880e-879e24e81581', 'Dumbbell Hamstring Curl', '2024-09-05 13:08:00.578297', '2024-09-05 13:08:00.578297', '', 'Set up for the dumbbell hamstring curl by elevating a flat bench on a block or step. You can use a grounded flat bench, but elevating it gives you a better range of motion and more efficiently recruits the hamstrings. Lie face down on the bench and position yourself so that your knees are at the edge of the bench. Pick up the dumbbell from the floor with your feet, securing it between the arches of your two feet. Bend at the knees only, slowly curl the dumbbell up towards your buttocks, then lower it in a controlled manner back to the starting position.', 'isolation', 'free', 'pull', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('12070323-971e-421a-9eaf-bdce4f8e0464', 'Trap Bar Rack Pull', '2024-09-05 13:10:41.470821', '2024-09-05 13:10:41.470821', '', 'Set up the bar at just below knee height on the safety pins in a rack. Stand inside of the trap bar with a hip width stance. Push your hips back and hinge forward. Reach down and grasp the handles using a neutral grip outside of shoulder width. Inhale and pull up slightly on the bar while allowing your hips to drop in a seesaw fashion. Drive through the whole foot and focus on pushing the floor away. Ensure the bar tracks in a straight line as you extend the knees and hips.', 'compound', 'free', 'hinge', 'beginner');
INSERT INTO public.exercise_examples VALUES ('379d64cd-24bf-4a81-9b97-936c9a088e17', 'Trap Bar Deadlift', '2024-09-05 13:12:38.899013', '2024-09-05 13:12:38.899013', '', 'Stand inside of the trap bar with a hip width stance. Push your hips back and hinge forward until your torso is nearly parallel with the floor. Reach down and grasp the handles using a neutral grip outside of shoulder width. Inhale and pull up slightly on the bar while allowing your hips to drop in a seesaw fashion. Drive through the whole foot and focus on pushing the floor away. Ensure the bar tracks in a straight line as you extend the knees and hips. Reverse the movement and repeat for desired reps.', 'compound', 'free', 'hinge', 'beginner');
INSERT INTO public.exercise_examples VALUES ('04d3e242-807d-4cba-9be4-e3d11a8efbc4', 'Reverse Hack Squat', '2024-09-05 13:33:56.320983', '2024-09-05 13:33:56.320983', '', 'Set up the reverse hack machine by loading the weight you want to use. Position yourself with your chest flat on the pad and shoulders up against the shoulder pads. Position your feet at around shoulder width apart on the bottom of the platform. Push up to take the weight off the stack, place your arms on the side handles of the machine and disengage the safety bars. Slowly lower the weight down until your thighs are at approximately right angles with your calves. Push the weight back up without locking your knees at the top.', 'compound', 'fixed', 'push', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('ca38bcba-658f-4c7a-be54-b2c3f845fbe0', 'Sumo Deadlift', '2024-09-05 13:37:08.596231', '2024-09-05 13:37:08.596231', '', 'Position the bar over the top of your shoelaces and assume a wide stance. Push your hips back and hinge forward until your torso is nearly parallel with the floor. Reach down and grasp the bar using a shoulder width, double overhand grip. Inhale and pull up on the bar while allowing your hips to drop. Drive through the whole foot and focus on pushing the floor away. Ensure the bar tracks in a straight line as you extend the knees and hips.', 'compound', 'free', 'hinge', 'beginner');
INSERT INTO public.exercise_examples VALUES ('f11ef4dd-cc6b-42ad-844d-0e94cef691f0', 'Glute Ham Raise', '2024-09-05 13:38:49.26673', '2024-09-05 13:38:49.26673', '', 'Set up in a GHD with your knees bent, hips extended, and torso upright. Straighten your legs while keeping your hips extended. Continue until your body is in a straight line and parallel to the floor. Pull yourself back to the starting position using your hamstrings. Repeat for the desired number of repetitions.', 'isolation', 'body_weight', 'pull', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('676f21e5-7b5a-4c11-a505-4545822673de', 'Trap Bar Romanian Deadlift', '2024-09-05 13:42:24.371375', '2024-09-05 13:42:24.371375', '', 'Stand inside of the trap bar with a hip width stance. Assume a neutral grip on the handles and deadlift the weight into position at the top with the hips and knees locked out. Begin the RDL by pushing your hips back and hinging forward until the bar is just below knee height. Drive through the whole foot and focus on pushing the floor away. Return to the starting position and repeat for the desired reps.', 'compound', 'free', 'hinge', 'beginner');
INSERT INTO public.exercise_examples VALUES ('c18b086c-b0c3-4d1c-a6a3-2653e36c5dff', 'Straight Leg Deadlift', '2024-09-05 13:44:20.952287', '2024-09-05 13:44:20.952287', '', 'Set a bar at just below hip height and load your desired weight. Hinge forward slightly and grasp the bar with a double overhand, shoulder width grip. Stand up by extending your hips and knees and take two steps back from the rack. Keeping the knees extended, push your hips back and hinge forward until the bar is just below your knee cap. Drive through the whole foot and focus on pushing the floor away. Finish the movement by squeezing the glutes and tilting the pelvis.', 'compound', 'free', 'hinge', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('6115df45-ddad-4fa6-bfb0-1c0cd72de766', 'Smith Machine Stiff Leg Deadlift', '2024-09-05 13:49:52.421936', '2024-09-05 13:49:52.421936', '', 'Set up for the exercise by loading a smith machine with the weight you want to use. Stand with your feet shoulder-width apart and grasp the bar with an overhand grip. Keeping your back straight, lower the bar while bending at the hips, stretching your hamstrings. Engage the hamstrings and glutes to raise the bar back up while keeping it close to your body.', 'compound', 'fixed', 'pull', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('f4041256-a9ac-430d-b611-d8a957e2aeb0', 'Straight Arm Lat Pulldown', '2024-09-06 11:10:17.447399', '2024-09-06 11:10:17.447399', '', 'Attach a straight bar to a cable stack and assume a standing position. Grasp the bar with a pronated grip (double overhand) at roughly shoulder width and lean forward slightly by hinging at the hips. Keep the elbow slightly flexed and initiate the movement by depressing the shoulder blades and extending the shoulders. Pull the bar to your thigh until the lats are fully contracted and then slowly lower under control.', 'compound', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('8e687b8b-0142-49f7-92e9-4d5df9aa86c9', 'Wide Grip Pull Up', '2024-09-06 11:15:01.132837', '2024-09-06 11:15:01.132837', '', 'Using a pronated grip, grasp the pull bar with a wider than shoulder width grip. Take a deep breath, squeeze your glutes and brace your abs. Depress the shoulder blades and drive the elbows straight down to the floor while activating the lats. Pull your chin towards the bar until the lats are fully contracted, then slowly lower yourself back to the start position.', 'compound', 'body_weight', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('4a2c7160-6cf2-456d-8ef4-80040b720420', 'Lat Pulldown', '2024-09-06 11:18:17.192491', '2024-09-06 11:18:17.192491', '', 'Attach a wide grip handle to the lat pulldown machine and assume a seated position. Grasp the handle with a pronated grip (double overhand) and initiate the movement by depressing the shoulder blade and then flexing the elbow while extending the shoulder. Pull the handle towards your body until the elbows are in line with your torso and then slowly lower the handle back to the starting position under control.', 'compound', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('93c687ff-68f2-44d0-9f3a-8c4c15c960e8', 'Wide Grip Lat Pulldown', '2024-09-06 11:21:03.156284', '2024-09-06 11:21:03.156284', '', 'Attach a wide grip handle to the lat pulldown machine and assume a seated position. Grasp the handle with a pronated grip (double overhand) at shoulder width. Depress the shoulder blades, flex the elbows, and extend the shoulder to pull the handle towards your body. Lower the handle back to the starting position under control.', 'compound', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('738d7264-00af-48dd-a475-3c4d12e28188', 'Chin Up', '2024-09-06 21:19:43.22155', '2024-09-06 21:19:43.22155', '', 'Using a supinated grip, grasp the bar with a shoulder width grip. Take a deep breath, squeeze your glutes and brace your abs. Depress the shoulder blades and drive the elbows straight down while activating the lats. Pull your chin towards the bar until the lats are fully contracted, then slowly lower yourself back to the start position.', 'compound', 'body_weight', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('e84c6031-9d71-41a1-ae2c-6c9901ea1d6b', 'Wide Grip Lat Pulldown', '2024-09-06 21:22:25.300036', '2024-09-06 21:22:25.300036', '', 'Attach a wide grip handle to the lat pulldown machine and assume a seated position. Grasp the handle with a pronated grip (double overhand) as wide as possible. Depress the shoulder blades, flex the elbows, and extend the shoulder to pull the handle towards your body. Lower the handle back to the starting position under control.', 'compound', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('bd3338ee-1841-4686-a98c-3493ab9cfa7e', 'Reverse Grip Lat Pulldown', '2024-09-06 21:26:46.655349', '2024-09-06 21:26:46.655349', '', 'Attach a wide grip handle to the lat pulldown machine and assume a seated position. Grasp the handle with a supinated grip (double underhand) just inside of shoulder width. Depress the shoulder blades, flex the elbows, and extend the shoulder to pull the handle towards your body. Lower the handle back to the starting position under control.', 'compound', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('eaf575b3-2cb6-45a3-914f-81838c4c7e4d', 'Rope Straight Arm Pulldown', '2024-09-06 21:28:12.837801', '2024-09-06 21:28:12.837801', '', 'Attach a rope to a cable stack and assume a standing position. Grasp the rope with a neutral grip (palms facing) and lean forward slightly by hinging at the hips. Depress the shoulder blades and extend the shoulders to pull the rope towards your thighs. Lower the rope back to the starting position under control.', 'compound', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('c25a5f07-d65f-4ba9-9b0d-cb4d5b426455', 'V-Bar Pulldown', '2024-09-06 21:31:44.423014', '2024-09-06 21:31:44.423014', '', 'Attach a V-bar to the lat pulldown machine and assume a seated position. Grasp the handle with a neutral grip and initiate the movement by depressing the shoulder blades and flexing the elbows. Pull the handle towards your body until your elbows are in line with your torso, then slowly lower the handle back to the starting position.', 'compound', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('85a317d2-6cf2-4155-a6ea-a271afc4a803', 'Behind Neck Lat Pulldown', '2024-09-06 21:35:46.021334', '2024-09-06 21:35:46.021334', '', 'Attach a wide grip handle to the lat pulldown machine and assume a seated position. Grasp the handle with a pronated grip (double overhand). Depress the shoulder blades, flex the elbows, and pull the handle behind your neck until it nearly touches the base of your traps. Slowly lower the handle back to the starting position under control.', 'compound', 'fixed', 'pull', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('c1ca2c25-9148-4977-99fe-3acda0b4ad33', 'One Arm Dumbbell Row', '2024-09-07 14:58:48.633749', '2024-09-07 14:58:48.633749', '', 'Assume a standing position while holding a dumbbell in one hand with a neutral grip. Hinge forward until your torso is roughly parallel with the floor and drive the elbow behind the body while retracting the shoulder blade. Pull the dumbbell towards your body and then slowly lower the dumbbell back to the starting position under control. Repeat for the desired number of repetitions on both sides.', 'compound', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('950cd0cd-fc3b-442f-aba9-3c48bfc6cda9', 'Bent Over Barbell Row', '2024-09-07 15:00:25.3268', '2024-09-07 15:00:25.3268', '', 'Assume a standing position while holding the bar using a double overhand grip. Hinge forward until your torso is roughly parallel with the floor and drive the elbows behind the body while retracting the shoulder blades. Pull the bar towards your belly button and then slowly lower it back to the starting position under control. Repeat for the desired number of repetitions.', 'compound', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('9c029423-aa52-4b90-97c0-f5d4b4574f12', 'Bent Over Dumbbell Row', '2024-09-07 15:02:05.982322', '2024-09-07 15:02:05.982322', '', 'Assume a standing position while holding a dumbbell in each hand with a neutral grip. Hinge forward until your torso is roughly parallel with the floor and drive the elbows behind the body while retracting the shoulder blades. Pull the dumbbells towards your body and then slowly lower them back to the starting position under control. Repeat for the desired number of repetitions.', 'compound', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('baa3f656-0ad7-422b-ba8b-e5e9f5d4cd63', 'Seated Cable Row', '2024-09-07 15:06:50.255195', '2024-09-07 15:06:50.255195', '', 'Set the appropriate weight on the stack and attach a close-grip handle. Grasp the bar with a neutral grip. Sit upright with your back straight, slightly bent legs, and pull the handle into your stomach. Retract your shoulder blades, squeeze, and return to the starting position under control. Repeat for the desired reps.', 'compound', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('6389ce45-7d30-4372-8c29-e5816d893b1a', 'Chest Supported Dumbbell Row', '2024-09-07 15:09:04.672927', '2024-09-07 15:09:04.672927', '', 'Position an adjustable incline bench at 45 degrees and lie prone on the bench. Grab a dumbbell in each hand utilizing a neutral grip and begin the movement by driving the elbows behind the body while retracting the shoulder blades. Pull the dumbbells towards your body until the elbows are at (or just past) the midline and then slowly lower the dumbbells back to the starting position under control. Repeat for the desired number of repetitions.', 'compound', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('ad76d69c-5e90-4643-b507-9e9226d8b5cd', 'Trap Bar Shrug', '2024-09-07 20:21:09.839764', '2024-09-07 20:21:09.839764', '', 'The trap bar shrug is a variation of the barbell shrug that targets the traps with a neutral hand placement, allowing better posture and reducing shoulder impingement risks. Stand inside the trap bar, grip the handles, and elevate your shoulders by contracting the traps. Lower slowly for controlled reps.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('31b8aa6a-448d-4e4c-bd1e-6386060b526e', 'Tripod Dumbbell Row', '2024-09-07 15:12:48.559544', '2024-09-07 15:12:48.559544', '', 'Assume a kneeling position on the bench with your ipsilateral hand braced against the bench. Hold a dumbbell in the opposite hand with a neutral grip. Begin the movement by driving the elbow behind the body while retracting the shoulder blade. Pull the dumbbell towards your body until the elbow is at (or just past) the midline and then slowly lower the dumbbell back to the starting position under control. Repeat for the desired number of repetitions on both sides.', 'compound', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('13826a3e-6b12-464c-95c8-5790f0e13947', 'Reverse Grip Bent-Over Dumbbell Row', '2024-09-07 15:16:24.597402', '2024-09-07 15:16:24.597402', '', 'Select the appropriate dumbbells and place them on the floor in front of you. Bending at the knees and keeping your back straight, squat down and pick up the dumbbells with an underhand grip (palms facing up). Get into the starting position by keeping your back straight and bending at the knees. Let the dumbbells slide down your thighs until they''re just below knee height. Execute by pulling the dumbbells up under your chest as far as possible. Pause, and then slowly lower the dumbbells back to the starting position. Repeat for desired reps.', 'compound', 'free', 'pull', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('91f6781b-915e-4bb4-8d8c-e345aa66e42d', 'Incline Bench Two Arm Dumbbell Row', '2024-09-07 15:18:31.425724', '2024-09-07 15:18:31.425724', '', 'Position an adjustable incline bench at 45 degrees and lie prone on the bench. Grab a dumbbell in each hand utilizing a pronated grip and begin the movement by driving the elbows behind the body while retracting the shoulder blades. Pull the dumbbells towards your body until the elbows are at (or just past) the midline, and then slowly lower the dumbbells back to the starting position under control. Repeat for the desired number of repetitions.', 'compound', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('cbb152c0-ba9c-47ea-a8a3-28ad88f56eb6', 'Smith Machine Bent-Over Row', '2024-09-07 15:29:18.453486', '2024-09-07 15:29:18.453486', '', 'Set up for the smith machine bent-over row by lowering the bar on the smith machine all the way and adding the weight you want to use. Stand facing the bar and grip the bar with an overhand grip, with your hands wider than shoulder-width apart. Stand straight up to take the weight off the machine. Straighten your back, bend at the knees slightly, and slowly let the weight down until it''s just below your knees. Keeping your body fixed, pull the weight up until it almost hits your body. Pause, and then slowly lower the bar back to the starting position. Repeat for desired reps.', 'compound', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('0be1c49c-d742-4881-b014-360bc297af34', 'Reverse Grip Bent Over Row', '2024-09-07 19:52:35.860933', '2024-09-07 19:52:35.860933', '', 'Grab a barbell, load some weight on, and place the barbell down in front of you. Stand with your feet at around shoulder width, bend at the knees, squat down to grip the bar with a reverse grip and your hands wider than shoulder width apart. Keeping your back straight, stand straight up so you''re holding the bar in front of you against your waist. To get into the starting position bend your knees slightly, and while keeping your back straight, let the barbell slide down your thighs until it drops just below knee level. Now pull the bar up to just below your chest, squeeze your shoulder blades together at the top of the movement, and slowly lower the bar back to the starting position.', 'compound', 'free', 'pull', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('8cccb149-8553-494d-bcb5-ffa9b06e7c0f', 'Pendlay Row', '2024-09-07 19:54:36.108775', '2024-09-07 19:54:36.108775', '', 'The Pendlay row is a variation of the bent over row and an exercise used to build strength in the muscles of the upper back. The main difference between a Pendlay row and other rowing variations is the Pendlay row involves coming to a complete dead stop during the movement. This dead stop allows the lifter to train power and explosiveness as s/he contracts the back to bring the weight to their body. Grasp the bar with a double overhand grip, drive the elbows explosively behind the body while retracting the shoulder blades, and pull the bar towards your belly button.', 'compound', 'free', 'pull', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('7470e789-9509-4e22-9078-67857074867d', 'One-Arm Seated Cable Row', '2024-09-07 19:56:54.223291', '2024-09-07 19:56:54.223291', '', 'The one-arm seated cable row is a great way to bring up a lagging side of the body and create symmetry. Attach a single handle to the low pulley cable machine and set the amount of weight you want to use. Sit down facing the cable with your knees slightly bent. Grab the handle using an overhand grip and take the weight off the stack. Keep your back straight and shoulders back. Pull the weight as far as possible, and squeeze your shoulder blade at the top of the movement. Pause, and then slowly lower the weight back to the starting position.', 'compound', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('7976a83a-f4db-4cc5-9cac-7f16f2bc430f', 'Seated Row (Rope Extension)', '2024-09-07 19:58:28.333853', '2024-09-07 19:58:28.333853', '', 'Attach the rope extension to the low pulley cable. Adjust the weight. Sit down in front of the cable machine facing the cable with your legs shoulder-width apart and knees slightly bent. Grasp the rope from the bottom with your thumbs in. Lean back, keeping your back straight to take the weight off the stack. Pull the rope in towards your stomach while squeezing your shoulder blades together at the top of the movement. Pause, and then slowly lower the weight back to the starting position.', 'compound', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('6da53baf-d357-4392-927f-7da1bf7449dc', 'Incline Bench Barbell Row', '2024-09-07 20:02:52.933304', '2024-09-07 20:02:52.933304', '', 'Set up an incline bench at around a 30-degree angle. Grab a barbell and place it at the end of the incline bench. Lay down in a prone position with legs at the lower end of the bench. Grip the barbell with a wide overhand grip, keeping your head up and eyes forward. Slowly raise the bar up towards your chest, squeeze your shoulder blades together at the top, and lower it back down.', 'compound', 'fixed', 'pull', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('6bb0675d-eba0-496c-bd20-5fd11a4a0282', 'Reverse Grip Incline Bench Barbell Row', '2024-09-07 20:04:30.711798', '2024-09-07 20:04:30.711798', '', 'Set up an incline bench at around a 30-degree angle. Grab a barbell with an underhand grip and place it at the end of the incline bench. Lay down in a prone position with legs at the lower end of the bench. Slowly raise the bar towards your chest, keeping your elbows tucked in, and lower it back down.', 'compound', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('5de5124e-8ebb-4477-b4b3-e1122cc80496', 'Dumbbell Shrugs', '2024-09-07 20:10:41.915207', '2024-09-07 20:10:41.915207', '', 'Assume a standing position with the dumbbells on both sides of your body. Contract the traps to elevate the shoulders. Squeeze hard at the top and slowly lower the dumbbells back to the starting position. Repeat for desired reps.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('d180a698-a12e-4731-8234-b96e8f3ca7d9', 'Barbell Upright Row', '2024-09-07 20:15:00.934798', '2024-09-07 20:15:00.934798', '', 'The barbell upright row is an effective exercise targeting the upper traps and shoulders. To perform, load a barbell with an overhand grip, hands slightly closer than shoulder-width apart, and stand with feet at shoulder width. Keep your back straight as you lift the bar, pulling it close to your body, up to chest height. Pause and slowly lower the bar, keeping the motion controlled.', 'compound', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('49ef1d62-a375-485a-84bd-289a5548e81b', 'Barbell Shrug', '2024-09-07 20:17:27.639092', '2024-09-07 20:17:27.639092', '', 'The barbell shrug targets the trapezius muscles. Stand with the bar in front, grab it with a double overhand grip, and lift by shrugging the shoulders. Squeeze at the top, then lower back down slowly.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('abe543c6-ec69-49ad-b9ca-ef959ffa10f2', 'Seated Dumbbell Shrug', '2024-09-07 20:18:56.606676', '2024-09-07 20:18:56.606676', '', 'The seated dumbbell shrug is an isolation exercise focused on building the traps. Sit on a flat bench with dumbbells at your sides, and shrug your shoulders up as far as possible, then slowly lower them back to the starting position.', 'isolation', 'free', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('cae7b841-a7f8-4973-baf0-4aadbbdcd0ca', 'Smith Machine Shrug', '2024-09-07 20:20:03.750749', '2024-09-07 20:20:03.750749', '', 'The Smith Machine Shrug is an isolation exercise focusing on the trapezius muscles. Stand facing the bar, grasp it with an overhand grip, lift the bar by shrugging your shoulders, then slowly lower it back down. Pause at the top for increased difficulty.', 'isolation', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('f451289a-6d35-4926-981d-8ebae71741a2', 'Cable Shrug', '2024-09-07 20:22:58.464988', '2024-09-07 20:22:58.464988', '', 'The cable shrug is a variation that focuses on constant tension during the movement. Set the cable handles low, stand with one handle in each hand, and elevate your shoulders by contracting the traps. Slowly lower the handles back to the starting position, maintaining tension throughout the exercise.', 'isolation', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('98791e1d-6029-4cb2-bcaf-611a337208ef', 'Cable Row to Neck', '2024-09-07 20:24:09.667421', '2024-09-07 20:24:09.667421', '', 'The Cable Row to Neck is a compound movement that targets the traps, lats, and shoulders. Using a rope attachment, pull the rope towards your neck, spreading the handles apart as you near your neck. Pause, squeeze, and then return to the starting position.', 'compound', 'fixed', 'pull', 'beginner');
INSERT INTO public.exercise_examples VALUES ('22df24eb-6bb7-45bc-ab46-9d6022eec774', 'Barbell Back Squat', '2024-09-07 20:34:58.039052', '2024-09-07 20:34:58.039052', '', 'Set up for the exercise by setting the barbell to just below shoulder height and loading the weight you want to use. Stand under the bar with your feet at about shoulder width apart. Position the bar so that it is resting on the muscles on the top of your back, not on the back of your neck. The bar should feel comfortable. If it doesn''t, try adding some padding to the bar. Now take your hands over the back and grip the bar with a wide grip for stability. Keeping your eyes facing forward slowly lower your body down until your thighs are parallel with the floor, and then slowly raise your body back up by pushing through your heels.', 'compound', 'free', 'push', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('978f906a-8584-4cdf-9d7f-f96d60865e3b', 'Dumbbell Squat', '2024-09-07 20:36:12.342466', '2024-09-07 20:36:12.342466', '', 'Set up for the dumbbell squat by choosing a pair of dumbbells and holding them down by your sides. Stand with a slight bend in your knees and your feet around shoulder width apart. Keeping your eyes facing forward, slowly lower your body down until your thighs are parallel with the floor, and then push back up through your heels.', 'compound', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('4da455c2-c154-4da7-b9c5-6195bd137eec', 'Dumbbell Goblet Squat', '2024-09-07 20:38:40.685439', '2024-09-07 20:38:40.685439', '', 'Select a dumbbell and position it at chest height with one hand under each edge of the dumbbell. Take a deep breath and descend by simultaneously pushing the hips back and bending the knees. Once your thighs reach parallel with the floor, begin to reverse the movement while keeping your abs braced and driving your feet through the floor.', 'compound', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('945bdcdb-6aee-42df-a974-3fedc0b76846', 'Dumbbell Goblet Squat', '2024-09-07 20:40:09.742885', '2024-09-07 20:40:09.742885', '', 'Select a dumbbell and position it at chest height with one hand under each edge of the dumbbell. Take a deep breath and descend by simultaneously pushing the hips back and bending the knees. Once your thighs reach parallel with the floor, begin to reverse the movement while keeping your abs braced and driving your feet through the floor.', 'compound', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('64406a09-56a6-43da-9329-ff0fb0d83e4f', '45-Degree Leg Press', '2024-09-07 20:41:37.047377', '2024-09-07 20:41:37.047377', '', 'Sit down and position your feet on the sled with a shoulder-width stance. Take a deep breath, extend your legs, and unlock the safeties. Lower the weight under control until your legs reach roughly 45 degrees or slightly below. Drive the weight back up by extending your knees but avoid forceful lockout.', 'compound', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('10f8ff0e-38c6-465d-b99a-26c4026d22c6', 'Leg Extension', '2024-09-07 20:42:37.44943', '2024-09-07 20:42:37.44943', '', 'Select the desired resistance on the weight stack and insert the pin. Adjust the seat so that the knees are directly in line with the axis of the machine. Sit down and position your shins behind the pad at the base of the machine. Take a deep breath and extend your legs as you flex your quadriceps. Slowly lower your feet back to the starting position.', 'isolation', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('88baf661-c550-4ecd-b15a-0d1ca4d41116', 'One Leg Dumbbell Squat (AKA Dumbbell Bulgarian Split Squat)', '2024-09-07 20:44:02.278455', '2024-09-07 20:44:02.278455', '', 'Set up in a split stance while holding dumbbells at your side with a neutral grip. Place the back foot on a bench or pad to increase the range of motion. Descend by flexing the front knee until the back knee touches the ground, then drive through the front foot to extend the knee and return to the starting position.', 'compound', 'free', 'push', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('4dc80274-2d3e-482e-a736-9f9399330c76', 'Machine Hack Squat', '2024-09-07 20:50:37.219599', '2024-09-07 20:50:37.219599', '', 'The machine hack squat is a leg exercise primarily targeting the quads, with secondary emphasis on hamstrings, glutes, calves, and stabilizing muscles like abs and lower back. It’s ideal for leg or full-body workouts, helping build strength and leg mass.', 'compound', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('14dbd276-30fe-4558-9cf0-104751b58f2d', 'Dumbbell Rear Lunge', '2024-09-07 20:51:46.750556', '2024-09-07 20:51:46.750556', '', 'The dumbbell rear lunge is a lunge variation that primarily targets the quads with secondary emphasis on the hamstrings, glutes, and calves. This unilateral leg exercise is beneficial for building leg strength and stability.', 'compound', 'free', 'push', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('2fd70951-2d44-407e-a7ee-daa94bf6af87', 'Front Squat', '2024-09-07 20:53:13.256272', '2024-09-07 20:53:13.256272', '', 'The front squat is a compound exercise that focuses primarily on the quads, with secondary emphasis on hamstrings, glutes, calves, hip flexors, abs, upper back, and adductors. It is an essential movement for leg strength and stability, suitable for intermediate lifters.', 'compound', 'free', 'push', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('24c43903-d3a7-4a39-9231-5bc7d5cec5da', 'Dumbbell Split Squat', '2024-09-07 20:54:24.859554', '2024-09-07 20:54:24.859554', '', 'The dumbbell split squat is a compound exercise primarily targeting the quads, with secondary emphasis on hamstrings, glutes, calves, abs, and adductors. It is ideal for beginners looking to improve leg strength and balance.', 'compound', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('de763854-d06d-43e9-9973-f4ca8839201b', 'Dumbbell Walking Lunge', '2024-09-07 20:55:27.29392', '2024-09-07 20:55:27.29392', '', 'The dumbbell walking lunge is an advanced compound leg exercise focusing on the quads, with secondary involvement from hamstrings, glutes, calves, abs, and upper body muscles like traps and upper back. It is effective for building leg strength and balance.', 'compound', 'free', 'push', 'advanced');
INSERT INTO public.exercise_examples VALUES ('5ab252b3-204d-4846-80e8-a7629f2d2e25', 'Frog Squat', '2024-09-07 20:56:42.175068', '2024-09-07 20:56:42.175068', '', 'The frog squat is a beginner-level leg exercise focusing primarily on the quads, with secondary involvement from the glutes, hamstrings, calves, and abs. It emphasizes form and control, ideal for building leg strength and stability.', 'compound', 'free', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('7b006564-2c61-4661-ab8c-d4cf60fdb3ed', 'Smith Machine Squat', '2024-09-07 21:00:33.453044', '2024-09-07 21:00:33.453044', '', 'The Smith machine squat is a compound leg exercise that primarily targets the quads with secondary involvement from the hamstrings, glutes, calves, abs, adductors, and rhomboids. It is a great beginner exercise for learning squat form and building leg strength.', 'compound', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('1e51b837-215d-4069-9d14-c9510c1b1b61', 'Smith Machine Lunge', '2024-09-07 21:02:58.920827', '2024-09-07 21:02:58.920827', '', 'The Smith machine lunge is a compound leg exercise primarily targeting the quads, with secondary involvement from the hamstrings, glutes, calves, abs, and adductors. It is a good variation for isolating leg muscles in a controlled environment using a machine.', 'compound', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('4ef87c39-b004-4c4c-82a8-ddd0338de8c8', 'Smith Machine Front Squat', '2024-09-08 11:38:55.940763', '2024-09-08 11:38:55.940763', '', 'The Smith machine front squat is a compound leg exercise primarily targeting the quads, with secondary involvement from the hamstrings, glutes, calves, abs, adductors, and rhomboids. It is ideal for learning front squat mechanics in a controlled environment.', 'compound', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('ea89fe55-c50f-4bbf-acc1-96e7df46101a', 'One Leg 45 Degree Leg Press', '2024-09-08 11:42:23.510138', '2024-09-08 11:42:23.510138', '', 'The one leg 45-degree leg press is a compound leg exercise primarily targeting the quads, with secondary involvement from the hamstrings, glutes, and calves. It helps improve unilateral leg strength and symmetry.', 'compound', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('395bb56a-d4af-4f4a-abb3-51a9ef1dc686', 'Wide Stance 45 Degree Leg Press', '2024-09-08 11:47:42.803848', '2024-09-08 11:47:42.803848', '', 'The wide stance 45-degree leg press is a compound leg exercise primarily targeting the quads, with secondary involvement from the hamstrings, glutes, and calves. It places additional tension on the inner legs due to the wide stance.', 'compound', 'fixed', 'push', 'beginner');
INSERT INTO public.exercise_examples VALUES ('a40b23bf-bd6d-41d0-adbe-254bce002c2d', 'Wide Hack Squat', '2024-09-08 11:48:44.494903', '2024-09-08 11:48:44.494903', '', 'The wide stance machine hack squat is a compound leg exercise that primarily targets the quads, with secondary involvement from the hamstrings, glutes, and calves. The wide stance increases tension in the inner quads, hamstrings, and glutes.', 'compound', 'fixed', 'push', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('a4bf88ee-8865-4b1f-88a3-28cf59d28739', 'Zercher Squat', '2024-09-08 11:51:56.624377', '2024-09-08 11:51:56.624377', '', 'The Zercher squat is a compound leg exercise primarily targeting the quads, with secondary involvement from the hamstrings, glutes, calves, abs, biceps, forearms, and adductors. It requires holding the barbell in the crook of your elbows and is useful for improving leg and upper body strength.', 'compound', 'free', 'push', 'advanced');
INSERT INTO public.exercise_examples VALUES ('9572d666-227a-4639-9ea3-defd67123fbc', 'Smith Machine Zercher Squat', '2024-09-08 11:54:36.16859', '2024-09-08 11:54:36.16859', '', 'The Smith machine Zercher squat is a compound leg exercise primarily targeting the quads, with secondary involvement from the hamstrings, glutes, calves, and forearms. It allows for controlled leg development with less need for stabilization.', 'compound', 'fixed', 'push', 'intermediate');
INSERT INTO public.exercise_examples VALUES ('21d5ce50-6ffa-44d9-869f-abcfeb518018', 'Dumbbell Goblet Split Squat', '2024-09-08 11:56:12.840633', '2024-09-08 11:56:12.840633', '', 'The dumbbell goblet split squat is a compound leg exercise primarily targeting the quads, with secondary involvement from the hamstrings, glutes, calves, abs, adductors, and upper body stabilizers such as the shoulders and traps. It helps improve leg strength and stability while maintaining an upright posture.', 'compound', 'free', 'push', 'beginner');


--
-- Data for Name: exercise_examples_equipments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.exercise_examples_equipments VALUES ('18eac9b2-be10-4878-a7ad-cc7a56f4c846', '2024-08-23 13:51:17.110081', '2024-08-23 13:51:17.110081', '752ee7ba-ae88-46f0-95fb-e0a316212f16', '6cb225d2-be00-461d-9bf0-7f0c87cfea0b');
INSERT INTO public.exercise_examples_equipments VALUES ('30d229f2-dbe0-4c88-ae9e-f194a7a8d323', '2024-08-23 13:51:17.110081', '2024-08-23 13:51:17.110081', '15495639-2adb-41b8-899c-493ac0172f57', '6cb225d2-be00-461d-9bf0-7f0c87cfea0b');
INSERT INTO public.exercise_examples_equipments VALUES ('3878ca87-c414-4a75-b59f-29a12f24c9ee', '2024-08-23 14:29:51.284754', '2024-08-23 14:29:51.284754', '9d66ac93-3a48-429d-aeaa-54302856e204', 'b790c6a6-ecd1-4b3a-afbc-22cd82e55658');
INSERT INTO public.exercise_examples_equipments VALUES ('042477ef-e59a-434d-a0e1-11b576345a4e', '2024-08-23 14:29:51.284754', '2024-08-23 14:29:51.284754', '85dbccf6-454e-4440-8905-50a90d91dbcc', 'b790c6a6-ecd1-4b3a-afbc-22cd82e55658');
INSERT INTO public.exercise_examples_equipments VALUES ('89bed541-8da6-4559-808e-e34b2dde6345', '2024-08-23 14:41:48.924103', '2024-08-23 14:41:48.924103', '9d66ac93-3a48-429d-aeaa-54302856e204', '4d3a89ab-70ae-4311-8b40-a058b2f3057b');
INSERT INTO public.exercise_examples_equipments VALUES ('69d34b8c-9bb3-4ed7-bb21-8c3a803c7eca', '2024-08-23 14:41:48.924103', '2024-08-23 14:41:48.924103', '85dbccf6-454e-4440-8905-50a90d91dbcc', '4d3a89ab-70ae-4311-8b40-a058b2f3057b');
INSERT INTO public.exercise_examples_equipments VALUES ('38b56251-60a5-408c-83af-c5d33d61c7da', '2024-08-23 14:53:43.92338', '2024-08-23 14:53:43.92338', '752ee7ba-ae88-46f0-95fb-e0a316212f16', '0e2fe1e8-f8f1-48e6-b360-8c9d4d9991a6');
INSERT INTO public.exercise_examples_equipments VALUES ('4c3e2a94-a011-4e8e-beed-1e0348721c85', '2024-08-23 14:53:43.92338', '2024-08-23 14:53:43.92338', 'af38ec0a-1465-45a8-99ba-a394224530dc', '0e2fe1e8-f8f1-48e6-b360-8c9d4d9991a6');
INSERT INTO public.exercise_examples_equipments VALUES ('49782b9d-fbf1-4930-8b1e-39f5f4b17d58', '2024-08-23 15:30:18.903829', '2024-08-23 15:30:18.903829', 'b17ae8af-2d78-4e77-b45b-39253c28247a', 'ab0d7384-444e-446a-911d-f64ac31db8ef');
INSERT INTO public.exercise_examples_equipments VALUES ('bbdbe4a6-a6eb-4755-b30e-3a03daef2393', '2024-08-23 15:30:18.903829', '2024-08-23 15:30:18.903829', 'e7fc1da0-48df-4338-b03f-1cea01cd12d5', 'ab0d7384-444e-446a-911d-f64ac31db8ef');
INSERT INTO public.exercise_examples_equipments VALUES ('f02409fc-7bce-4fcc-85d4-e158dd891e8f', '2024-08-23 15:44:41.339864', '2024-08-23 15:44:41.339864', 'ad130932-4b2f-4e7b-b3a4-c20b4a6b85ae', '650e9725-d36c-4688-bcab-adf93dfe9e5d');
INSERT INTO public.exercise_examples_equipments VALUES ('10eacba8-7484-47ea-9d09-3d702f319c2b', '2024-08-23 15:44:41.339864', '2024-08-23 15:44:41.339864', '85dbccf6-454e-4440-8905-50a90d91dbcc', '650e9725-d36c-4688-bcab-adf93dfe9e5d');
INSERT INTO public.exercise_examples_equipments VALUES ('d1fade6c-1e1b-4bdb-80e2-c5be66f92913', '2024-08-23 15:50:27.656054', '2024-08-23 15:50:27.656054', 'c01e10b9-4ef6-4f23-9b41-7f6d5d4d1e85', '3b828d2f-797f-4a45-9d1d-1d3efe38fb54');
INSERT INTO public.exercise_examples_equipments VALUES ('bd1362af-1dd6-4e05-b7e4-98c642ea54d2', '2024-08-23 20:29:25.198434', '2024-08-23 20:29:25.198434', 'ad130932-4b2f-4e7b-b3a4-c20b4a6b85ae', '7517ae2f-c198-4a33-8a1d-1dc7327d1430');
INSERT INTO public.exercise_examples_equipments VALUES ('ab80f98c-307e-4a28-a7b0-0ea95ab0885d', '2024-08-23 20:29:25.198434', '2024-08-23 20:29:25.198434', '85dbccf6-454e-4440-8905-50a90d91dbcc', '7517ae2f-c198-4a33-8a1d-1dc7327d1430');
INSERT INTO public.exercise_examples_equipments VALUES ('13f22fa8-9d47-4d81-874b-fbea62ed7a20', '2024-08-23 20:36:43.361959', '2024-08-23 20:36:43.361959', 'b17ae8af-2d78-4e77-b45b-39253c28247a', '4aafe702-f2fc-4fa2-a7fb-c31c279adeda');
INSERT INTO public.exercise_examples_equipments VALUES ('d254e8c0-5208-4d9d-b4ed-963e13b7cc16', '2024-08-23 20:36:43.361959', '2024-08-23 20:36:43.361959', '85dbccf6-454e-4440-8905-50a90d91dbcc', '4aafe702-f2fc-4fa2-a7fb-c31c279adeda');
INSERT INTO public.exercise_examples_equipments VALUES ('69f86c20-a30e-42e2-a53e-ed84621e1c9d', '2024-08-24 13:49:36.268549', '2024-08-24 13:49:36.268549', '9d66ac93-3a48-429d-aeaa-54302856e204', 'faf6674c-2a2a-4b03-ab8b-7a033052b572');
INSERT INTO public.exercise_examples_equipments VALUES ('2d770bea-fe04-4786-932e-bc15dd64e6ff', '2024-08-24 13:55:14.353429', '2024-08-24 13:55:14.353429', '9d66ac93-3a48-429d-aeaa-54302856e204', '93e6b1c4-0510-41d4-983c-a1fde003881f');
INSERT INTO public.exercise_examples_equipments VALUES ('be1b632c-b299-4966-a8dc-2edbc2f0a1bb', '2024-08-24 15:00:28.276311', '2024-08-24 15:00:28.276311', '9d66ac93-3a48-429d-aeaa-54302856e204', '0eaa8980-e29e-4f33-88b0-915db5cf309a');
INSERT INTO public.exercise_examples_equipments VALUES ('268c38c2-ca53-4c01-8cf3-84d04c8b6ba2', '2024-08-24 15:00:28.276311', '2024-08-24 15:00:28.276311', '85dbccf6-454e-4440-8905-50a90d91dbcc', '0eaa8980-e29e-4f33-88b0-915db5cf309a');
INSERT INTO public.exercise_examples_equipments VALUES ('1d820e1c-d5b4-4508-be3d-40bed6caf5cf', '2024-08-24 15:05:24.076016', '2024-08-24 15:05:24.076016', '85dbccf6-454e-4440-8905-50a90d91dbcc', '9f0c8916-a08b-4fe5-9f24-e1680ef627a8');
INSERT INTO public.exercise_examples_equipments VALUES ('1c6d7cc2-ad98-4caf-a03a-8f718de298e1', '2024-08-24 15:14:04.506549', '2024-08-24 15:14:04.506549', '9d66ac93-3a48-429d-aeaa-54302856e204', '547f1f7e-3ee1-4b39-99eb-3462b1ec13af');
INSERT INTO public.exercise_examples_equipments VALUES ('d72c94d3-3ede-4a1d-9976-fcc1afcfe9e9', '2024-08-24 15:21:25.329077', '2024-08-24 15:21:25.329077', '752ee7ba-ae88-46f0-95fb-e0a316212f16', '275097d4-3c8d-4040-9b2e-5f294919df04');
INSERT INTO public.exercise_examples_equipments VALUES ('1ea89282-bb1f-4180-be24-3204e4b018cc', '2024-08-24 15:21:25.329077', '2024-08-24 15:21:25.329077', '331a0c35-f5a5-478d-ba7c-9f14ba2ee0fa', '275097d4-3c8d-4040-9b2e-5f294919df04');
INSERT INTO public.exercise_examples_equipments VALUES ('82b1cf49-36bb-4782-b791-c412629e44a3', '2024-08-26 14:10:38.427023', '2024-08-26 14:10:38.427023', '752ee7ba-ae88-46f0-95fb-e0a316212f16', '5985d847-0473-444e-8fe0-9da5341ef986');
INSERT INTO public.exercise_examples_equipments VALUES ('26d6be34-ab58-483c-973b-2b6b44ae32fb', '2024-08-26 14:10:38.427023', '2024-08-26 14:10:38.427023', '524da8cf-0303-4c53-8761-832a5fdb54ed', '5985d847-0473-444e-8fe0-9da5341ef986');
INSERT INTO public.exercise_examples_equipments VALUES ('9df444cb-f6ec-46e6-be44-382e92bf1f74', '2024-08-26 14:15:00.646836', '2024-08-26 14:15:00.646836', '752ee7ba-ae88-46f0-95fb-e0a316212f16', '11644e17-247a-46b0-a391-b3b2a2a6bba8');
INSERT INTO public.exercise_examples_equipments VALUES ('3c8c831c-be6b-4c40-8342-f0d954a5a051', '2024-08-26 14:21:24.526649', '2024-08-26 14:21:24.526649', 'ad130932-4b2f-4e7b-b3a4-c20b4a6b85ae', '50774526-c91f-4d71-82a8-456526b0fbd0');
INSERT INTO public.exercise_examples_equipments VALUES ('26fc3b65-5f07-4ff9-ab98-ba3a95cd56b4', '2024-08-26 14:21:24.526649', '2024-08-26 14:21:24.526649', '85dbccf6-454e-4440-8905-50a90d91dbcc', '50774526-c91f-4d71-82a8-456526b0fbd0');
INSERT INTO public.exercise_examples_equipments VALUES ('670cce16-0591-4106-9a96-b0e051bd88a3', '2024-08-26 14:31:15.934013', '2024-08-26 14:31:15.934013', 'b17ae8af-2d78-4e77-b45b-39253c28247a', '385fb192-7c2c-405a-b483-f36e32e241c8');
INSERT INTO public.exercise_examples_equipments VALUES ('327c5b0f-436f-471e-bb85-d3cca3304ccc', '2024-08-26 14:31:15.934013', '2024-08-26 14:31:15.934013', 'e7fc1da0-48df-4338-b03f-1cea01cd12d5', '385fb192-7c2c-405a-b483-f36e32e241c8');
INSERT INTO public.exercise_examples_equipments VALUES ('500f112d-a47a-42d7-a51e-c109c0e55241', '2024-08-26 14:36:25.650101', '2024-08-26 14:36:25.650101', 'ad130932-4b2f-4e7b-b3a4-c20b4a6b85ae', 'c21d3b0f-c8a8-4b7f-92ea-90dc567a1183');
INSERT INTO public.exercise_examples_equipments VALUES ('eb7d7dc5-4b50-45a2-bbbb-143af87dbf29', '2024-08-26 14:36:25.650101', '2024-08-26 14:36:25.650101', '85dbccf6-454e-4440-8905-50a90d91dbcc', 'c21d3b0f-c8a8-4b7f-92ea-90dc567a1183');
INSERT INTO public.exercise_examples_equipments VALUES ('654dbcff-51cc-4663-be9c-8a32ca26b0a5', '2024-08-26 14:39:55.639589', '2024-08-26 14:39:55.639589', '9d66ac93-3a48-429d-aeaa-54302856e204', '04d275d8-71df-4695-ace9-899ce6e41b29');
INSERT INTO public.exercise_examples_equipments VALUES ('7b0c1dff-bb12-4286-b798-a4cf1c930d0a', '2024-08-26 14:39:55.639589', '2024-08-26 14:39:55.639589', '85dbccf6-454e-4440-8905-50a90d91dbcc', '04d275d8-71df-4695-ace9-899ce6e41b29');
INSERT INTO public.exercise_examples_equipments VALUES ('c09e37f5-af2f-4713-8689-9afb65465850', '2024-08-26 14:46:34.09067', '2024-08-26 14:46:34.09067', '9d66ac93-3a48-429d-aeaa-54302856e204', '1b4402c2-2459-45c1-8d24-356322c71d20');
INSERT INTO public.exercise_examples_equipments VALUES ('48cffaea-2b3b-4f81-9ae9-c273cca655f2', '2024-08-26 14:52:11.254518', '2024-08-26 14:52:11.254518', 'b17ae8af-2d78-4e77-b45b-39253c28247a', '4f9bdd10-28bc-447e-8cf5-fbf47cd9af79');
INSERT INTO public.exercise_examples_equipments VALUES ('9a73cd1f-c0b6-428c-b244-29cb35215685', '2024-08-26 15:16:20.205226', '2024-08-26 15:16:20.205226', '752ee7ba-ae88-46f0-95fb-e0a316212f16', '6a312bde-cc33-450b-8f1d-6091ccffe9cc');
INSERT INTO public.exercise_examples_equipments VALUES ('03882ba0-6533-4556-bd5f-52c3e40b3a68', '2024-08-26 15:16:20.205226', '2024-08-26 15:16:20.205226', '15495639-2adb-41b8-899c-493ac0172f57', '6a312bde-cc33-450b-8f1d-6091ccffe9cc');
INSERT INTO public.exercise_examples_equipments VALUES ('28bbaf0c-aba8-4da2-a0cf-c8578b7b9da9', '2024-08-26 15:20:51.090958', '2024-08-26 15:20:51.090958', '9d66ac93-3a48-429d-aeaa-54302856e204', '21e7460d-aa00-448b-8c82-994a73e0164c');
INSERT INTO public.exercise_examples_equipments VALUES ('0692ecf0-4068-49a7-b6db-be6c49ea7568', '2024-08-26 15:20:51.090958', '2024-08-26 15:20:51.090958', '85dbccf6-454e-4440-8905-50a90d91dbcc', '21e7460d-aa00-448b-8c82-994a73e0164c');
INSERT INTO public.exercise_examples_equipments VALUES ('f67de955-3f11-4582-b4ae-b7f7cadf152d', '2024-08-27 16:05:54.993335', '2024-08-27 16:05:54.993335', 'ad130932-4b2f-4e7b-b3a4-c20b4a6b85ae', 'ee8cc366-d33b-45a6-84b0-4ab416585ad1');
INSERT INTO public.exercise_examples_equipments VALUES ('ab289319-cdfb-4cd8-af2c-f098fd619382', '2024-08-27 16:05:54.993335', '2024-08-27 16:05:54.993335', '85dbccf6-454e-4440-8905-50a90d91dbcc', 'ee8cc366-d33b-45a6-84b0-4ab416585ad1');
INSERT INTO public.exercise_examples_equipments VALUES ('e97ffe69-97ee-4a11-bd73-a6a8ecf924f9', '2024-08-27 17:08:58.779312', '2024-08-27 17:08:58.779312', '9d66ac93-3a48-429d-aeaa-54302856e204', '490df80e-d34c-42cf-bfe5-c27ddd2cd734');
INSERT INTO public.exercise_examples_equipments VALUES ('6f55bf0d-3bee-4ddd-9141-08e368809a62', '2024-08-27 17:08:58.779312', '2024-08-27 17:08:58.779312', 'c4d5e6fe-30fd-4f16-8646-634102d1bf1b', '490df80e-d34c-42cf-bfe5-c27ddd2cd734');
INSERT INTO public.exercise_examples_equipments VALUES ('4c6b53f9-7fc1-4682-b98d-8f429afa4f1b', '2024-08-27 17:14:24.432331', '2024-08-27 17:14:24.432331', 'b17ae8af-2d78-4e77-b45b-39253c28247a', 'e21344ff-b825-4a99-bf8b-a778bf1964d1');
INSERT INTO public.exercise_examples_equipments VALUES ('10331756-3ad0-430e-88a0-c189e5c83d47', '2024-08-27 17:14:24.432331', '2024-08-27 17:14:24.432331', '9677e942-8a9b-4754-a27f-7e4d945681a1', 'e21344ff-b825-4a99-bf8b-a778bf1964d1');
INSERT INTO public.exercise_examples_equipments VALUES ('50d919a7-85d0-4214-8741-348e907a78b5', '2024-08-27 17:17:13.853581', '2024-08-27 17:17:13.853581', 'ad130932-4b2f-4e7b-b3a4-c20b4a6b85ae', 'd6743870-0d5a-4180-9671-181b8f65e03e');
INSERT INTO public.exercise_examples_equipments VALUES ('7425c787-5ca8-4fc8-bb4d-565d5fe0cd0c', '2024-08-27 17:17:13.853581', '2024-08-27 17:17:13.853581', 'c4d5e6fe-30fd-4f16-8646-634102d1bf1b', 'd6743870-0d5a-4180-9671-181b8f65e03e');
INSERT INTO public.exercise_examples_equipments VALUES ('92373663-669a-4b32-96b9-69573292388f', '2024-08-27 17:37:27.255281', '2024-08-27 17:37:27.255281', '9d66ac93-3a48-429d-aeaa-54302856e204', '855bd9e5-3546-4cfd-b048-e8017f01bfeb');
INSERT INTO public.exercise_examples_equipments VALUES ('e9854721-7de4-4d5c-848a-84a8128b807a', '2024-08-27 17:37:27.255281', '2024-08-27 17:37:27.255281', '85dbccf6-454e-4440-8905-50a90d91dbcc', '855bd9e5-3546-4cfd-b048-e8017f01bfeb');
INSERT INTO public.exercise_examples_equipments VALUES ('65cc3832-31d3-4318-97de-77f2ed80c959', '2024-08-27 17:40:04.041202', '2024-08-27 17:40:04.041202', 'ad130932-4b2f-4e7b-b3a4-c20b4a6b85ae', '53defdc5-bfec-4af4-bfba-60440e3493cc');
INSERT INTO public.exercise_examples_equipments VALUES ('284d2351-a82b-4c2c-8034-6389c8289553', '2024-08-27 17:40:04.041202', '2024-08-27 17:40:04.041202', '6215cbaf-6065-4534-a9d5-a588c1b3dc28', '53defdc5-bfec-4af4-bfba-60440e3493cc');
INSERT INTO public.exercise_examples_equipments VALUES ('a7265729-e2e4-4256-a60f-8be6e5244aee', '2024-08-27 17:41:21.156137', '2024-08-27 17:41:21.156137', '752ee7ba-ae88-46f0-95fb-e0a316212f16', '748e0a60-9429-4a9d-8a6b-3ba76a7fc4b2');
INSERT INTO public.exercise_examples_equipments VALUES ('0c085ba8-854c-448c-bf29-887e0da8d3de', '2024-08-27 17:41:21.156137', '2024-08-27 17:41:21.156137', 'af38ec0a-1465-45a8-99ba-a394224530dc', '748e0a60-9429-4a9d-8a6b-3ba76a7fc4b2');
INSERT INTO public.exercise_examples_equipments VALUES ('4064f615-ed61-463c-b3ff-7922b7df32d5', '2024-08-27 17:44:25.496539', '2024-08-27 17:44:25.496539', '752ee7ba-ae88-46f0-95fb-e0a316212f16', 'a90f4822-63c5-42b9-943c-ff0ceacad1eb');
INSERT INTO public.exercise_examples_equipments VALUES ('6a0ee9fe-90e0-4578-b4d7-6cfe9add1c1f', '2024-08-27 17:44:25.496539', '2024-08-27 17:44:25.496539', '15495639-2adb-41b8-899c-493ac0172f57', 'a90f4822-63c5-42b9-943c-ff0ceacad1eb');
INSERT INTO public.exercise_examples_equipments VALUES ('919bf994-abf9-4f5c-884f-46da3cd3f80c', '2024-08-27 19:58:20.501476', '2024-08-27 19:58:20.501476', '9d66ac93-3a48-429d-aeaa-54302856e204', 'ddc2e877-7197-42fa-ae1e-59706d209774');
INSERT INTO public.exercise_examples_equipments VALUES ('c89b9ddc-1549-4d80-a57f-d856172457fe', '2024-08-27 20:02:25.708679', '2024-08-27 20:02:25.708679', '9d66ac93-3a48-429d-aeaa-54302856e204', '8324ae75-08e9-48de-a00b-55d229085712');
INSERT INTO public.exercise_examples_equipments VALUES ('40670a4f-b5e7-433e-8389-2ec8f1b7a989', '2024-08-27 20:04:23.492626', '2024-08-27 20:04:23.492626', 'b17ae8af-2d78-4e77-b45b-39253c28247a', 'bbfbcfe2-1f56-492e-afa6-75e595b84fde');
INSERT INTO public.exercise_examples_equipments VALUES ('09167929-b842-45c2-8f88-3807cac125be', '2024-08-27 20:09:12.665161', '2024-08-27 20:09:12.665161', '9d66ac93-3a48-429d-aeaa-54302856e204', '09386394-e4e1-4a6d-adce-d5f5a518485c');
INSERT INTO public.exercise_examples_equipments VALUES ('f98fce80-3602-436c-b8ef-2377e96e8ff1', '2024-08-27 20:09:12.665161', '2024-08-27 20:09:12.665161', '6215cbaf-6065-4534-a9d5-a588c1b3dc28', '09386394-e4e1-4a6d-adce-d5f5a518485c');
INSERT INTO public.exercise_examples_equipments VALUES ('32d62846-1c9f-4aa4-9187-2db8864bac0c', '2024-08-27 20:11:42.135236', '2024-08-27 20:11:42.135236', '9d66ac93-3a48-429d-aeaa-54302856e204', 'cfb2d83a-b3dc-44e9-ab08-53f9269752d6');
INSERT INTO public.exercise_examples_equipments VALUES ('d1778c89-8b8c-4250-951f-1bc07cd8ba74', '2024-08-27 20:11:42.135236', '2024-08-27 20:11:42.135236', '85dbccf6-454e-4440-8905-50a90d91dbcc', 'cfb2d83a-b3dc-44e9-ab08-53f9269752d6');
INSERT INTO public.exercise_examples_equipments VALUES ('626336cb-099c-4327-ae2a-8af1fd311592', '2024-08-27 20:13:52.521551', '2024-08-27 20:13:52.521551', '752ee7ba-ae88-46f0-95fb-e0a316212f16', '2522a61a-2190-43e9-ae52-ca6bb023815e');
INSERT INTO public.exercise_examples_equipments VALUES ('0cd72b5b-7997-42ee-8352-c7bbac6d7ef6', '2024-08-27 20:13:52.521551', '2024-08-27 20:13:52.521551', '15495639-2adb-41b8-899c-493ac0172f57', '2522a61a-2190-43e9-ae52-ca6bb023815e');
INSERT INTO public.exercise_examples_equipments VALUES ('a8bdaf61-efd4-4969-94bc-e53ef45ff4e1', '2024-08-27 20:15:21.126869', '2024-08-27 20:15:21.126869', 'ad130932-4b2f-4e7b-b3a4-c20b4a6b85ae', '9fc5ae4d-2868-4576-bb67-9c83663fc005');
INSERT INTO public.exercise_examples_equipments VALUES ('42498a55-2fa1-4abc-943a-91ca3f049118', '2024-08-27 20:15:21.126869', '2024-08-27 20:15:21.126869', '061ad8e2-77aa-4ba8-9a41-51788e7803c7', '9fc5ae4d-2868-4576-bb67-9c83663fc005');
INSERT INTO public.exercise_examples_equipments VALUES ('caed2850-ef60-4ea3-adf3-8b6becc18356', '2024-08-27 20:17:28.427593', '2024-08-27 20:17:28.427593', '9d66ac93-3a48-429d-aeaa-54302856e204', '89f423d0-315f-4d93-b346-dcb468a97045');
INSERT INTO public.exercise_examples_equipments VALUES ('435c0462-ab6a-48bb-83ad-17280c97ad7f', '2024-08-27 20:20:16.532749', '2024-08-27 20:20:16.532749', 'b17ae8af-2d78-4e77-b45b-39253c28247a', '194fa2ee-7f92-4982-903e-3db80293d773');
INSERT INTO public.exercise_examples_equipments VALUES ('6f4e4021-6766-4963-931c-3d3713bd57ce', '2024-08-27 20:20:16.532749', '2024-08-27 20:20:16.532749', '061ad8e2-77aa-4ba8-9a41-51788e7803c7', '194fa2ee-7f92-4982-903e-3db80293d773');
INSERT INTO public.exercise_examples_equipments VALUES ('cbce280d-286e-434a-86fd-e9341139d0c6', '2024-08-27 20:24:43.761365', '2024-08-27 20:24:43.761365', '9d66ac93-3a48-429d-aeaa-54302856e204', 'f2fb31f0-7f6b-42b6-9a79-c22453ac6a63');
INSERT INTO public.exercise_examples_equipments VALUES ('b4f00c95-f019-4e9c-ac6c-62c305550718', '2024-08-27 20:24:43.761365', '2024-08-27 20:24:43.761365', '85dbccf6-454e-4440-8905-50a90d91dbcc', 'f2fb31f0-7f6b-42b6-9a79-c22453ac6a63');
INSERT INTO public.exercise_examples_equipments VALUES ('c01dad93-88d8-424f-b87b-920bfd26194f', '2024-08-27 20:27:54.270257', '2024-08-27 20:27:54.270257', '9d66ac93-3a48-429d-aeaa-54302856e204', '5e3c933f-7511-463e-88b1-a139c8276e69');
INSERT INTO public.exercise_examples_equipments VALUES ('6c0ed978-3e4c-4a8f-bcdf-743eae8e1e8e', '2024-08-27 20:29:12.674065', '2024-08-27 20:29:12.674065', '9d66ac93-3a48-429d-aeaa-54302856e204', 'e7f390fd-7435-44e1-b354-c62073934c66');
INSERT INTO public.exercise_examples_equipments VALUES ('51ad2af3-e4ba-401d-a774-418630a8f725', '2024-08-28 20:36:41.160119', '2024-08-28 20:36:41.160119', '752ee7ba-ae88-46f0-95fb-e0a316212f16', '7e0566c6-eefb-4992-a673-d19902933c26');
INSERT INTO public.exercise_examples_equipments VALUES ('71a2cdd4-6c01-4dde-acde-b63102f23727', '2024-08-28 20:36:41.160119', '2024-08-28 20:36:41.160119', 'af38ec0a-1465-45a8-99ba-a394224530dc', '7e0566c6-eefb-4992-a673-d19902933c26');
INSERT INTO public.exercise_examples_equipments VALUES ('742219cd-68b7-4125-b2f8-b084840f3fe5', '2024-08-28 20:38:26.235987', '2024-08-28 20:38:26.235987', '0d0f8242-be68-4086-b665-0a11ff6a0dcd', '7fd82f79-1f5f-4bae-8f2d-b94ecae595d5');
INSERT INTO public.exercise_examples_equipments VALUES ('28f116e4-d3ad-43f1-9a41-68721e7390bb', '2024-08-28 20:40:22.177236', '2024-08-28 20:40:22.177236', '9d66ac93-3a48-429d-aeaa-54302856e204', '908341ec-de1f-44bd-b84d-74ff8a7162a0');
INSERT INTO public.exercise_examples_equipments VALUES ('7fe61f2a-fa43-45ce-b5a4-6232e94ca7e7', '2024-08-28 20:42:25.596199', '2024-08-28 20:42:25.596199', 'ad130932-4b2f-4e7b-b3a4-c20b4a6b85ae', 'a2736a56-04b3-4437-835e-1e2dc8029c9e');
INSERT INTO public.exercise_examples_equipments VALUES ('a2f639d5-a744-4b90-8a4e-ff82d1d85120', '2024-08-28 20:42:25.596199', '2024-08-28 20:42:25.596199', '061ad8e2-77aa-4ba8-9a41-51788e7803c7', 'a2736a56-04b3-4437-835e-1e2dc8029c9e');
INSERT INTO public.exercise_examples_equipments VALUES ('d721c23f-f0d8-4b71-bd8a-5352f76e3386', '2024-08-28 20:44:17.626931', '2024-08-28 20:44:17.626931', '9d66ac93-3a48-429d-aeaa-54302856e204', 'da809d98-950b-4ca0-a71b-c67d21fd66da');
INSERT INTO public.exercise_examples_equipments VALUES ('ee825b0f-bde3-4a9d-a09c-d5c852191aa6', '2024-08-28 20:44:17.626931', '2024-08-28 20:44:17.626931', '85dbccf6-454e-4440-8905-50a90d91dbcc', 'da809d98-950b-4ca0-a71b-c67d21fd66da');
INSERT INTO public.exercise_examples_equipments VALUES ('5ab6ca83-5ae3-4aa0-a814-be1dbc79fa26', '2024-08-28 20:45:27.526977', '2024-08-28 20:45:27.526977', '9d66ac93-3a48-429d-aeaa-54302856e204', '4de0744d-0a78-4052-aa1b-e5340959d9fe');
INSERT INTO public.exercise_examples_equipments VALUES ('a1f64ee7-9236-41e1-9112-e11077db7892', '2024-08-28 20:47:16.414029', '2024-08-28 20:47:16.414029', '9d66ac93-3a48-429d-aeaa-54302856e204', 'd7abed66-3c4a-490b-91cc-8e714336f9fa');
INSERT INTO public.exercise_examples_equipments VALUES ('d8654edb-8d03-45f1-8581-d946b232df09', '2024-08-28 20:47:16.414029', '2024-08-28 20:47:16.414029', '061ad8e2-77aa-4ba8-9a41-51788e7803c7', 'd7abed66-3c4a-490b-91cc-8e714336f9fa');
INSERT INTO public.exercise_examples_equipments VALUES ('3703bf88-1b47-425e-82f7-457aba871579', '2024-08-28 20:48:17.220792', '2024-08-28 20:48:17.220792', '9d66ac93-3a48-429d-aeaa-54302856e204', 'cfd086be-f452-4f1d-b0cc-3988d677a8b4');
INSERT INTO public.exercise_examples_equipments VALUES ('d925c831-38d4-4fc5-867f-c75a2e87d057', '2024-08-28 20:48:17.220792', '2024-08-28 20:48:17.220792', '061ad8e2-77aa-4ba8-9a41-51788e7803c7', 'cfd086be-f452-4f1d-b0cc-3988d677a8b4');
INSERT INTO public.exercise_examples_equipments VALUES ('da90a877-7897-431f-9189-604e28eb6eec', '2024-08-28 20:50:28.807559', '2024-08-28 20:50:28.807559', '9d66ac93-3a48-429d-aeaa-54302856e204', '8508cffc-1df6-4db2-9447-3bafd74a1325');
INSERT INTO public.exercise_examples_equipments VALUES ('6abbd704-6b0d-4d1c-9ea8-01b1446aa88d', '2024-08-28 20:50:28.807559', '2024-08-28 20:50:28.807559', '85dbccf6-454e-4440-8905-50a90d91dbcc', '8508cffc-1df6-4db2-9447-3bafd74a1325');
INSERT INTO public.exercise_examples_equipments VALUES ('ce5d2d10-6c3f-49dd-80d9-5e524a71adfb', '2024-08-28 20:51:35.466127', '2024-08-28 20:51:35.466127', 'b17ae8af-2d78-4e77-b45b-39253c28247a', '4f1c3655-21e7-4225-a39e-944774f59f76');
INSERT INTO public.exercise_examples_equipments VALUES ('2ac37880-db07-447a-95a5-26f2132aac39', '2024-08-28 20:53:42.347893', '2024-08-28 20:53:42.347893', '752ee7ba-ae88-46f0-95fb-e0a316212f16', '6d5dc164-3c35-4719-85f1-5c75558f0125');
INSERT INTO public.exercise_examples_equipments VALUES ('2d2ead25-67dc-44a2-8a23-98d577699335', '2024-08-28 20:53:42.347893', '2024-08-28 20:53:42.347893', '15495639-2adb-41b8-899c-493ac0172f57', '6d5dc164-3c35-4719-85f1-5c75558f0125');
INSERT INTO public.exercise_examples_equipments VALUES ('c6ddacaf-c3e1-4b95-9f77-89ca21c40d1b', '2024-08-28 20:55:59.983829', '2024-08-28 20:55:59.983829', '752ee7ba-ae88-46f0-95fb-e0a316212f16', 'cebf4622-c0a9-4759-a070-48c7556da67d');
INSERT INTO public.exercise_examples_equipments VALUES ('803c7970-45b1-49a7-8ead-092a88d77f0f', '2024-08-28 20:55:59.983829', '2024-08-28 20:55:59.983829', '15495639-2adb-41b8-899c-493ac0172f57', 'cebf4622-c0a9-4759-a070-48c7556da67d');
INSERT INTO public.exercise_examples_equipments VALUES ('509d67c8-9a10-44dd-b89f-5f642d11e423', '2024-08-28 20:59:16.619963', '2024-08-28 20:59:16.619963', '9d66ac93-3a48-429d-aeaa-54302856e204', '4d72c2f1-2c10-45a3-9f5e-1f04012c0681');
INSERT INTO public.exercise_examples_equipments VALUES ('ea1de13e-c07f-460b-8291-2c552c993ceb', '2024-08-28 20:59:16.619963', '2024-08-28 20:59:16.619963', '6215cbaf-6065-4534-a9d5-a588c1b3dc28', '4d72c2f1-2c10-45a3-9f5e-1f04012c0681');
INSERT INTO public.exercise_examples_equipments VALUES ('c839c5f1-2827-45f6-8e4d-3e3c0a1d01cf', '2024-08-28 21:00:57.798104', '2024-08-28 21:00:57.798104', '9d66ac93-3a48-429d-aeaa-54302856e204', 'af39600b-6fc5-435a-a5f8-a1d0a9994030');
INSERT INTO public.exercise_examples_equipments VALUES ('7d0a7413-8e8b-49ca-b1e4-55565c4f8085', '2024-08-28 21:00:57.798104', '2024-08-28 21:00:57.798104', '6215cbaf-6065-4534-a9d5-a588c1b3dc28', 'af39600b-6fc5-435a-a5f8-a1d0a9994030');
INSERT INTO public.exercise_examples_equipments VALUES ('ad6cd9b9-23aa-4fcd-ab6b-629d7dc1578f', '2024-08-28 21:02:48.219979', '2024-08-28 21:02:48.219979', '9d66ac93-3a48-429d-aeaa-54302856e204', '101f365e-5c84-438a-84b4-c8e798bd0aff');
INSERT INTO public.exercise_examples_equipments VALUES ('23e62232-997b-45b6-bbdc-ec912214531b', '2024-08-28 21:02:48.219979', '2024-08-28 21:02:48.219979', '6215cbaf-6065-4534-a9d5-a588c1b3dc28', '101f365e-5c84-438a-84b4-c8e798bd0aff');
INSERT INTO public.exercise_examples_equipments VALUES ('0e3d31f7-f75c-4fac-9d86-c77b7098cd10', '2024-08-28 21:04:44.328641', '2024-08-28 21:04:44.328641', '9d66ac93-3a48-429d-aeaa-54302856e204', '1f28edb2-29ae-467c-ad11-310c3f656fe2');
INSERT INTO public.exercise_examples_equipments VALUES ('bcba2cc7-ab4a-4f1a-9759-57ac35ef4b8c', '2024-08-28 21:04:44.328641', '2024-08-28 21:04:44.328641', '85dbccf6-454e-4440-8905-50a90d91dbcc', '1f28edb2-29ae-467c-ad11-310c3f656fe2');
INSERT INTO public.exercise_examples_equipments VALUES ('c3a45345-3d3e-445d-9cc7-838f34452f2b', '2024-08-28 21:07:18.658519', '2024-08-28 21:07:18.658519', 'b17ae8af-2d78-4e77-b45b-39253c28247a', '04a13a1c-de2b-46f4-be62-3fa6b4655d0d');
INSERT INTO public.exercise_examples_equipments VALUES ('47f07a62-9c4b-475a-9d26-e646f82e6e4f', '2024-08-28 21:07:18.658519', '2024-08-28 21:07:18.658519', '85dbccf6-454e-4440-8905-50a90d91dbcc', '04a13a1c-de2b-46f4-be62-3fa6b4655d0d');
INSERT INTO public.exercise_examples_equipments VALUES ('51805a34-b706-4493-a65d-f470397e7f5a', '2024-08-28 21:08:56.505989', '2024-08-28 21:08:56.505989', '752ee7ba-ae88-46f0-95fb-e0a316212f16', 'a9545ccb-3ec7-4646-95c9-f3a708d0d968');
INSERT INTO public.exercise_examples_equipments VALUES ('73574159-3fc4-413f-ae56-beb39d6e90a5', '2024-08-28 21:08:56.505989', '2024-08-28 21:08:56.505989', '331a0c35-f5a5-478d-ba7c-9f14ba2ee0fa', 'a9545ccb-3ec7-4646-95c9-f3a708d0d968');
INSERT INTO public.exercise_examples_equipments VALUES ('8cd074c5-a535-4b77-a2df-127416314513', '2024-08-28 21:11:35.048465', '2024-08-28 21:11:35.048465', 'ad130932-4b2f-4e7b-b3a4-c20b4a6b85ae', 'b99df7e8-eb44-4be1-be81-701347580781');
INSERT INTO public.exercise_examples_equipments VALUES ('39f6d8eb-19c7-4fe7-973a-cb44d2ae153b', '2024-08-28 21:11:35.048465', '2024-08-28 21:11:35.048465', '6215cbaf-6065-4534-a9d5-a588c1b3dc28', 'b99df7e8-eb44-4be1-be81-701347580781');
INSERT INTO public.exercise_examples_equipments VALUES ('4ff03dac-9429-45b7-990a-98f44b743764', '2024-08-28 21:12:39.517028', '2024-08-28 21:12:39.517028', 'ad130932-4b2f-4e7b-b3a4-c20b4a6b85ae', '8d2a9df4-af32-4943-b74b-ae901e866b32');
INSERT INTO public.exercise_examples_equipments VALUES ('e76166c7-4e73-4c1c-b2aa-f111389a9545', '2024-08-28 21:13:34.085593', '2024-08-28 21:13:34.085593', 'ad130932-4b2f-4e7b-b3a4-c20b4a6b85ae', '8ca7bf65-0ddb-4c64-ba64-f71f25c85d7c');
INSERT INTO public.exercise_examples_equipments VALUES ('16ea2d9b-2c74-4f90-8d9c-6861101331aa', '2024-08-29 15:15:51.74105', '2024-08-29 15:15:51.74105', '9d66ac93-3a48-429d-aeaa-54302856e204', '12221e5c-0208-48fc-8c56-62c266932f74');
INSERT INTO public.exercise_examples_equipments VALUES ('c8101224-bac1-4806-84b3-9dacd70412fa', '2024-08-29 15:18:06.552249', '2024-08-29 15:18:06.552249', 'b17ae8af-2d78-4e77-b45b-39253c28247a', '1959abd3-4ab1-42d4-b7e2-45693b899d51');
INSERT INTO public.exercise_examples_equipments VALUES ('83e06a51-6b84-4f0b-b9a8-3a2d13e1288e', '2024-08-29 15:20:32.345462', '2024-08-29 15:20:32.345462', '9d66ac93-3a48-429d-aeaa-54302856e204', '48191b99-06fa-4218-b61b-c9b9abd73278');
INSERT INTO public.exercise_examples_equipments VALUES ('807dbb10-eb51-4e7d-ad22-5b44ac9a124a', '2024-08-29 15:20:32.345462', '2024-08-29 15:20:32.345462', '6215cbaf-6065-4534-a9d5-a588c1b3dc28', '48191b99-06fa-4218-b61b-c9b9abd73278');
INSERT INTO public.exercise_examples_equipments VALUES ('04f0ea3f-6d9a-49e4-9be3-68ca12c15e76', '2024-08-29 15:21:42.17181', '2024-08-29 15:21:42.17181', '9d66ac93-3a48-429d-aeaa-54302856e204', '92d77415-1f9a-430b-ba52-0a09ec07b3a1');
INSERT INTO public.exercise_examples_equipments VALUES ('edebb1f2-1fa5-419d-a3c0-32924c31c27d', '2024-08-29 15:23:10.34832', '2024-08-29 15:23:10.34832', '9d66ac93-3a48-429d-aeaa-54302856e204', '816440ad-f8f2-4ef7-a11f-b6a2bd63fcef');
INSERT INTO public.exercise_examples_equipments VALUES ('4e5220bc-a955-46f6-acf1-d8a3728219bc', '2024-08-29 15:24:22.345392', '2024-08-29 15:24:22.345392', '623e0be7-870a-4bca-b053-76e99c9ea7e0', '506d1cc7-529a-42af-b5bf-4c4d0a9aa409');
INSERT INTO public.exercise_examples_equipments VALUES ('dc57c652-3894-4e49-b37e-c826f461e309', '2024-08-29 15:24:22.345392', '2024-08-29 15:24:22.345392', '6215cbaf-6065-4534-a9d5-a588c1b3dc28', '506d1cc7-529a-42af-b5bf-4c4d0a9aa409');
INSERT INTO public.exercise_examples_equipments VALUES ('124a1851-bdeb-432a-bb2f-6ef4dffba346', '2024-08-29 15:26:45.193381', '2024-08-29 15:26:45.193381', '9d66ac93-3a48-429d-aeaa-54302856e204', '9ab8fe00-58de-48c4-942d-b10e8d16f1c1');
INSERT INTO public.exercise_examples_equipments VALUES ('26c840b4-3fa1-43fd-86b8-c45f5aeafd56', '2024-08-29 15:26:45.193381', '2024-08-29 15:26:45.193381', '6215cbaf-6065-4534-a9d5-a588c1b3dc28', '9ab8fe00-58de-48c4-942d-b10e8d16f1c1');
INSERT INTO public.exercise_examples_equipments VALUES ('a0f9048e-b208-43be-9fdc-fa7d8f847b2c', '2024-08-29 15:28:20.987723', '2024-08-29 15:28:20.987723', '9d66ac93-3a48-429d-aeaa-54302856e204', '3d6e76b5-b409-4f5b-bba4-c22cb10cfbd4');
INSERT INTO public.exercise_examples_equipments VALUES ('2ea0be10-8a19-45fb-9790-6b7080eda7af', '2024-08-29 15:28:20.987723', '2024-08-29 15:28:20.987723', '85dbccf6-454e-4440-8905-50a90d91dbcc', '3d6e76b5-b409-4f5b-bba4-c22cb10cfbd4');
INSERT INTO public.exercise_examples_equipments VALUES ('86bd6604-76d9-4e67-b8db-e22499270425', '2024-08-29 15:30:57.610887', '2024-08-29 15:30:57.610887', '9d66ac93-3a48-429d-aeaa-54302856e204', '77aa5752-a586-4dfe-b69d-4da16fff0b79');
INSERT INTO public.exercise_examples_equipments VALUES ('82a6ea43-4dd4-4a5b-b083-1c423977e9b4', '2024-08-29 15:30:57.610887', '2024-08-29 15:30:57.610887', '85dbccf6-454e-4440-8905-50a90d91dbcc', '77aa5752-a586-4dfe-b69d-4da16fff0b79');
INSERT INTO public.exercise_examples_equipments VALUES ('06e0fb66-fd04-42a4-83c5-68c3fea2a620', '2024-08-29 15:34:32.577527', '2024-08-29 15:34:32.577527', 'b17ae8af-2d78-4e77-b45b-39253c28247a', '4035dfef-3cc6-4a15-a97f-c167bd274d02');
INSERT INTO public.exercise_examples_equipments VALUES ('3027b509-5f77-4ae5-998f-7757492ca6d8', '2024-08-29 15:34:32.577527', '2024-08-29 15:34:32.577527', '6215cbaf-6065-4534-a9d5-a588c1b3dc28', '4035dfef-3cc6-4a15-a97f-c167bd274d02');
INSERT INTO public.exercise_examples_equipments VALUES ('b577535e-0ce1-43e5-9b60-de4ec07c3078', '2024-08-29 20:14:43.148532', '2024-08-29 20:14:43.148532', '752ee7ba-ae88-46f0-95fb-e0a316212f16', 'aada0f37-1f30-4d61-a284-8003027bc871');
INSERT INTO public.exercise_examples_equipments VALUES ('d1ce8d63-ec75-4de0-9ee1-4fc7728f5e84', '2024-08-29 20:14:43.148532', '2024-08-29 20:14:43.148532', 'af38ec0a-1465-45a8-99ba-a394224530dc', 'aada0f37-1f30-4d61-a284-8003027bc871');
INSERT INTO public.exercise_examples_equipments VALUES ('2efb1622-d211-4150-be80-c3dd4037ce18', '2024-08-29 20:16:07.202411', '2024-08-29 20:16:07.202411', '752ee7ba-ae88-46f0-95fb-e0a316212f16', 'afd7f719-5789-48a0-a5d9-77e9cb1669bb');
INSERT INTO public.exercise_examples_equipments VALUES ('7bb99942-9023-470a-b175-9905edb19ad6', '2024-08-29 20:16:07.202411', '2024-08-29 20:16:07.202411', '373d04ea-8079-439a-82a3-d118da6253b1', 'afd7f719-5789-48a0-a5d9-77e9cb1669bb');
INSERT INTO public.exercise_examples_equipments VALUES ('bd152d98-e1c6-4139-af62-d47ec4c49be0', '2024-08-29 20:17:41.643146', '2024-08-29 20:17:41.643146', '6c587294-e384-4941-b90d-e6ec64b8731d', '16ba69dc-e99d-4a71-bbcb-0f3ce096a9d9');
INSERT INTO public.exercise_examples_equipments VALUES ('252ce762-35c3-4e0c-a69f-b00ed415e607', '2024-08-29 20:18:52.142987', '2024-08-29 20:18:52.142987', '526347a3-ee32-473d-9b5d-049f526ae48e', '3a70ce9c-b1f0-43a7-8775-7d3e7c109c5d');
INSERT INTO public.exercise_examples_equipments VALUES ('d5cf5dfc-fbb9-4665-9e19-e23c98fbf5d1', '2024-08-29 20:20:58.542902', '2024-08-29 20:20:58.542902', 'a6628e7c-1488-4268-82ee-5174f3a5a2a5', '4353173b-93b2-4fb1-b462-fc8330b15ce5');
INSERT INTO public.exercise_examples_equipments VALUES ('dd7903c9-c39c-467c-b1e9-a09da60b3993', '2024-08-29 20:20:58.542902', '2024-08-29 20:20:58.542902', '373d04ea-8079-439a-82a3-d118da6253b1', '4353173b-93b2-4fb1-b462-fc8330b15ce5');
INSERT INTO public.exercise_examples_equipments VALUES ('1ae81a2e-bc2c-4b26-8265-6cbaae1ddbdd', '2024-08-29 20:26:45.608525', '2024-08-29 20:26:45.608525', '752ee7ba-ae88-46f0-95fb-e0a316212f16', '1b8fe6fc-9ede-4f28-b4a0-30504db61fed');
INSERT INTO public.exercise_examples_equipments VALUES ('bca20113-bc6c-4f5d-a2de-ac2d2569b544', '2024-08-29 20:26:45.608525', '2024-08-29 20:26:45.608525', '331a0c35-f5a5-478d-ba7c-9f14ba2ee0fa', '1b8fe6fc-9ede-4f28-b4a0-30504db61fed');
INSERT INTO public.exercise_examples_equipments VALUES ('9a555a4d-cbf5-4162-a204-45ce474e98b9', '2024-08-29 20:28:36.098732', '2024-08-29 20:28:36.098732', 'b17ae8af-2d78-4e77-b45b-39253c28247a', '90b8d661-a9ef-47e5-8c98-b0599874a972');
INSERT INTO public.exercise_examples_equipments VALUES ('f31fdd69-b646-4bd9-af1d-6c51063cb038', '2024-08-29 20:28:36.098732', '2024-08-29 20:28:36.098732', '6345b70f-6e3f-46e2-9d51-3be51250ed99', '90b8d661-a9ef-47e5-8c98-b0599874a972');
INSERT INTO public.exercise_examples_equipments VALUES ('0ba39240-7331-42e3-b240-cdd72a7f06eb', '2024-08-29 20:31:23.033752', '2024-08-29 20:31:23.033752', '9d66ac93-3a48-429d-aeaa-54302856e204', 'ac45c513-55f3-437f-a10f-ba3c0763a746');
INSERT INTO public.exercise_examples_equipments VALUES ('4239d23f-aa2d-47b5-b59b-63f90e49b0b3', '2024-08-29 20:34:53.754866', '2024-08-29 20:34:53.754866', '0268b0d7-f8e4-47ea-b9da-969427b43adf', '3a41edcb-2c19-4d06-9585-8fe745aba723');
INSERT INTO public.exercise_examples_equipments VALUES ('710586e7-bf4e-407f-82bb-60e5337a9a1f', '2024-08-29 20:37:21.068102', '2024-08-29 20:37:21.068102', '9d66ac93-3a48-429d-aeaa-54302856e204', 'b8fa1238-0f58-4daa-ade8-0f8c6fa2d1b1');
INSERT INTO public.exercise_examples_equipments VALUES ('1eadea08-5f24-48e8-b9e6-b97e88edba3f', '2024-08-29 20:37:21.068102', '2024-08-29 20:37:21.068102', '6215cbaf-6065-4534-a9d5-a588c1b3dc28', 'b8fa1238-0f58-4daa-ade8-0f8c6fa2d1b1');
INSERT INTO public.exercise_examples_equipments VALUES ('4399522d-7aad-4eb3-afce-36f03020478c', '2024-08-29 20:46:11.394407', '2024-08-29 20:46:11.394407', 'a6628e7c-1488-4268-82ee-5174f3a5a2a5', 'ed5db0ac-4343-4e68-a884-d5f84e4020c1');
INSERT INTO public.exercise_examples_equipments VALUES ('f9d45502-5c8c-4963-a147-885233e3bf4c', '2024-08-29 20:46:11.394407', '2024-08-29 20:46:11.394407', '331a0c35-f5a5-478d-ba7c-9f14ba2ee0fa', 'ed5db0ac-4343-4e68-a884-d5f84e4020c1');
INSERT INTO public.exercise_examples_equipments VALUES ('f72e14a6-5683-4f7d-a0e6-e5012b4ca59c', '2024-08-29 20:48:13.159828', '2024-08-29 20:48:13.159828', '623e0be7-870a-4bca-b053-76e99c9ea7e0', 'd20646b6-efd1-49fc-8ffa-180461aea5ab');
INSERT INTO public.exercise_examples_equipments VALUES ('063c63b4-153c-4ddc-93ec-e5c28fac3095', '2024-08-29 20:49:40.184734', '2024-08-29 20:49:40.184734', 'b17ae8af-2d78-4e77-b45b-39253c28247a', '1f8abb63-8024-46ca-ac1e-2574a839eed6');
INSERT INTO public.exercise_examples_equipments VALUES ('0f3ebc8e-b4cd-447d-9799-5558e2b585c4', '2024-08-29 20:52:10.214663', '2024-08-29 20:52:10.214663', '9d66ac93-3a48-429d-aeaa-54302856e204', 'b22e5ada-86c1-4104-828b-b7e06a7f5d16');
INSERT INTO public.exercise_examples_equipments VALUES ('ef2cd1df-932f-41ec-b154-08d471d4ac36', '2024-08-29 20:52:10.214663', '2024-08-29 20:52:10.214663', '6215cbaf-6065-4534-a9d5-a588c1b3dc28', 'b22e5ada-86c1-4104-828b-b7e06a7f5d16');
INSERT INTO public.exercise_examples_equipments VALUES ('6b3c6a02-ea89-4410-b7e5-9520f1b79e13', '2024-08-29 20:55:27.361136', '2024-08-29 20:55:27.361136', '752ee7ba-ae88-46f0-95fb-e0a316212f16', '7a933584-128c-4b82-8e5b-5e7312cadfdf');
INSERT INTO public.exercise_examples_equipments VALUES ('dbd25a48-bfb0-4845-9327-f6e455c7ba20', '2024-08-29 20:55:27.361136', '2024-08-29 20:55:27.361136', '331a0c35-f5a5-478d-ba7c-9f14ba2ee0fa', '7a933584-128c-4b82-8e5b-5e7312cadfdf');
INSERT INTO public.exercise_examples_equipments VALUES ('ef1abdcc-386b-42bb-865e-e36307434f47', '2024-08-29 20:58:25.076692', '2024-08-29 20:58:25.076692', '9d66ac93-3a48-429d-aeaa-54302856e204', '984e5dac-f3a8-4980-bfc9-da370cf45e46');
INSERT INTO public.exercise_examples_equipments VALUES ('3d2f7c53-f1c5-4303-9479-965d5be0ab8e', '2024-08-29 20:58:25.076692', '2024-08-29 20:58:25.076692', '6215cbaf-6065-4534-a9d5-a588c1b3dc28', '984e5dac-f3a8-4980-bfc9-da370cf45e46');
INSERT INTO public.exercise_examples_equipments VALUES ('125d4f99-0e82-40c1-ac09-6a354c5669a9', '2024-08-29 21:01:10.950406', '2024-08-29 21:01:10.950406', '752ee7ba-ae88-46f0-95fb-e0a316212f16', 'ff188494-a871-4721-9d1e-26742539080c');
INSERT INTO public.exercise_examples_equipments VALUES ('792c6603-c86f-4fe8-b9a6-e96cf74247c2', '2024-08-29 21:01:10.950406', '2024-08-29 21:01:10.950406', '15495639-2adb-41b8-899c-493ac0172f57', 'ff188494-a871-4721-9d1e-26742539080c');
INSERT INTO public.exercise_examples_equipments VALUES ('6a9ab4bb-d478-4077-8e89-6a205a5c3a7f', '2024-08-29 21:09:08.322752', '2024-08-29 21:09:08.322752', '9d66ac93-3a48-429d-aeaa-54302856e204', '68381c41-b015-4218-93cb-2bcb64bee255');
INSERT INTO public.exercise_examples_equipments VALUES ('8f61f0e0-bb61-43f3-8d27-4f5edc1da12f', '2024-08-31 21:55:50.627691', '2024-08-31 21:55:50.627691', '32bed80a-1512-4945-9654-8d710618ef81', '1fdffa53-d9cb-4aa1-9999-5c83fdb9be80');
INSERT INTO public.exercise_examples_equipments VALUES ('79ce4ce3-9af7-4610-940e-3c6bd46796da', '2024-08-31 22:01:53.342028', '2024-08-31 22:01:53.342028', '9a4df37b-9fdb-4c19-93b3-d99393d9e605', 'a8f9abc7-4515-4f5e-a4f5-095b1b17b9e1');
INSERT INTO public.exercise_examples_equipments VALUES ('418ee62d-bae1-40a4-87dc-f5600e8ec0ca', '2024-09-01 09:37:56.278637', '2024-09-01 09:37:56.278637', '752ee7ba-ae88-46f0-95fb-e0a316212f16', 'e1361643-e92a-419b-8eb8-fe2a188016e0');
INSERT INTO public.exercise_examples_equipments VALUES ('d4ead82a-db97-4beb-b2e9-9f4bd11a8f86', '2024-09-01 09:37:56.278637', '2024-09-01 09:37:56.278637', 'af38ec0a-1465-45a8-99ba-a394224530dc', 'e1361643-e92a-419b-8eb8-fe2a188016e0');
INSERT INTO public.exercise_examples_equipments VALUES ('a9e0063f-d896-48ce-80b3-56677f4e3bd4', '2024-09-01 12:11:44.14147', '2024-09-01 12:11:44.14147', 'ddf4299a-fc48-47bd-9bdf-7e3d7692b09f', 'f2cf498f-d991-4b85-b08e-58c5f9ff563e');
INSERT INTO public.exercise_examples_equipments VALUES ('621f2bb2-94b6-48a0-aa90-83fd1bc05243', '2024-09-01 12:13:55.750094', '2024-09-01 12:13:55.750094', '9d66ac93-3a48-429d-aeaa-54302856e204', '7e80becf-491c-4b48-a98a-a36fff26e29c');
INSERT INTO public.exercise_examples_equipments VALUES ('148699e0-bd1e-4d1d-a4a8-5d62bde8bfb1', '2024-09-01 12:14:59.692189', '2024-09-01 12:14:59.692189', 'c4d5e6fe-30fd-4f16-8646-634102d1bf1b', '2f49a8e8-6f42-422c-aa6f-c23e215620e2');
INSERT INTO public.exercise_examples_equipments VALUES ('fd262b33-6e2f-4bb9-9bf6-3eed7b52a0b7', '2024-09-01 12:24:23.213877', '2024-09-01 12:24:23.213877', '85dbccf6-454e-4440-8905-50a90d91dbcc', 'f2868e11-6e1d-4ce4-a1a8-eb0384a60b71');
INSERT INTO public.exercise_examples_equipments VALUES ('75b87f45-37ce-4e44-956b-28ed4373b4cf', '2024-09-01 12:25:43.172492', '2024-09-01 12:25:43.172492', 'ddf4299a-fc48-47bd-9bdf-7e3d7692b09f', '38af9c0d-b19f-433d-bcda-0b974b5475cf');
INSERT INTO public.exercise_examples_equipments VALUES ('ad0a8479-1442-43c4-8438-0985114c04a4', '2024-09-01 12:26:49.236953', '2024-09-01 12:26:49.236953', 'ddf4299a-fc48-47bd-9bdf-7e3d7692b09f', 'c5901a9a-580c-411b-85bd-2ec738123e14');
INSERT INTO public.exercise_examples_equipments VALUES ('78e04b3c-02a4-4663-ace1-fc700a32f559', '2024-09-01 12:41:05.655011', '2024-09-01 12:41:05.655011', '7752a881-139d-4cf4-98b2-e92e9de0e2e5', '6e4bc8b2-33ab-46da-9b79-9fff2266cd27');
INSERT INTO public.exercise_examples_equipments VALUES ('63bdc4bb-0001-40e8-bd4c-972ab4789f5a', '2024-09-01 12:43:01.53445', '2024-09-01 12:43:01.53445', '85dbccf6-454e-4440-8905-50a90d91dbcc', '01dff88c-893b-4410-8d54-1e36013b9fdb');
INSERT INTO public.exercise_examples_equipments VALUES ('9d614bbd-016b-48d0-b03b-918b5fa99d3d', '2024-09-01 12:43:01.53445', '2024-09-01 12:43:01.53445', '9d66ac93-3a48-429d-aeaa-54302856e204', '01dff88c-893b-4410-8d54-1e36013b9fdb');
INSERT INTO public.exercise_examples_equipments VALUES ('011edf8a-a8b4-45b8-8825-568519dd71b7', '2024-09-01 12:49:37.152666', '2024-09-01 12:49:37.152666', '7752a881-139d-4cf4-98b2-e92e9de0e2e5', 'de4e9652-b068-4558-9fd3-38d45e5aa0d9');
INSERT INTO public.exercise_examples_equipments VALUES ('100900e0-67b3-4c61-9108-a8cc18d83298', '2024-09-01 12:52:29.690195', '2024-09-01 12:52:29.690195', '623e0be7-870a-4bca-b053-76e99c9ea7e0', '46b1efa3-a4f8-4492-a81c-9e48c650dd3d');
INSERT INTO public.exercise_examples_equipments VALUES ('9030787b-f6eb-4611-89ac-083e8655b5f4', '2024-09-01 12:54:31.27172', '2024-09-01 12:54:31.27172', '623e0be7-870a-4bca-b053-76e99c9ea7e0', '89ffca84-73f0-4a69-871f-9d9c96521a05');
INSERT INTO public.exercise_examples_equipments VALUES ('cd336569-8d94-4f32-880d-4aacef19c47d', '2024-09-01 12:56:50.703307', '2024-09-01 12:56:50.703307', '7752a881-139d-4cf4-98b2-e92e9de0e2e5', 'f11c8751-e5ca-413e-b30d-2b387ec14733');
INSERT INTO public.exercise_examples_equipments VALUES ('e79d44da-2255-4445-bf81-07bfde8ac4f3', '2024-09-01 12:51:11.829723', '2024-09-01 12:51:11.829723', '1959d942-75fb-4ece-b501-b7cf8884d479', '7227c8f6-cf65-4134-97de-d5e64cb5ff1b');
INSERT INTO public.exercise_examples_equipments VALUES ('d0c8768e-08bc-46da-8ec0-6b6ccde3cce2', '2024-09-01 12:47:02.029745', '2024-09-01 12:47:02.029745', '1959d942-75fb-4ece-b501-b7cf8884d479', 'd2f28afc-e84c-467c-90d9-c6c2cb63acbc');
INSERT INTO public.exercise_examples_equipments VALUES ('6e15b634-3eb9-4021-9621-2c6c2f817ff3', '2024-09-01 13:30:53.583243', '2024-09-01 13:30:53.583243', '20e225dd-68d7-409b-9b7d-5ef6d4224d02', '9e348a26-e5d0-4ee0-b3e6-fe58563ac698');
INSERT INTO public.exercise_examples_equipments VALUES ('b7a0ec3b-b5f0-41f2-b23c-3d325f8f978b', '2024-09-02 14:01:43.622797', '2024-09-02 14:01:43.622797', '9d66ac93-3a48-429d-aeaa-54302856e204', '548b3de6-0980-4795-ab86-763c20dbc325');
INSERT INTO public.exercise_examples_equipments VALUES ('6564ac53-1d75-421f-ac0a-23035fb471b5', '2024-09-02 14:01:43.622797', '2024-09-02 14:01:43.622797', '85dbccf6-454e-4440-8905-50a90d91dbcc', '548b3de6-0980-4795-ab86-763c20dbc325');
INSERT INTO public.exercise_examples_equipments VALUES ('2aaae5bb-5701-4917-ad85-1a07cc8265ea', '2024-09-02 14:03:25.461134', '2024-09-02 14:03:25.461134', '9d66ac93-3a48-429d-aeaa-54302856e204', '47f00a63-05df-4db7-b2c7-68000c72be9b');
INSERT INTO public.exercise_examples_equipments VALUES ('8a50bdfc-f5e9-42d0-9847-66452c64737f', '2024-09-02 14:03:25.461134', '2024-09-02 14:03:25.461134', '6215cbaf-6065-4534-a9d5-a588c1b3dc28', '47f00a63-05df-4db7-b2c7-68000c72be9b');
INSERT INTO public.exercise_examples_equipments VALUES ('b0db3fb6-d244-4b69-85ae-9b4ae5411988', '2024-09-02 14:05:57.423919', '2024-09-02 14:05:57.423919', '9d66ac93-3a48-429d-aeaa-54302856e204', 'c0a055b2-daf6-4ecc-b97b-cfedfce6a42a');
INSERT INTO public.exercise_examples_equipments VALUES ('2f5f2aa4-ce7e-4dce-881a-d61e5e9361ca', '2024-09-02 14:05:57.423919', '2024-09-02 14:05:57.423919', '85dbccf6-454e-4440-8905-50a90d91dbcc', 'c0a055b2-daf6-4ecc-b97b-cfedfce6a42a');
INSERT INTO public.exercise_examples_equipments VALUES ('582ce50e-a9ad-478e-b249-e2775c9f07d9', '2024-09-02 14:06:48.393095', '2024-09-02 14:06:48.393095', '9d66ac93-3a48-429d-aeaa-54302856e204', '2bc37dec-7b06-404c-af63-99bf3f60fb68');
INSERT INTO public.exercise_examples_equipments VALUES ('a5b131e8-8b29-471e-83c2-2db6efbffb84', '2024-09-02 14:06:48.393095', '2024-09-02 14:06:48.393095', '85dbccf6-454e-4440-8905-50a90d91dbcc', '2bc37dec-7b06-404c-af63-99bf3f60fb68');
INSERT INTO public.exercise_examples_equipments VALUES ('fe418a73-bcef-45fe-9709-3893bdce5c12', '2024-09-02 14:08:08.360773', '2024-09-02 14:08:08.360773', '9d66ac93-3a48-429d-aeaa-54302856e204', '3488eaaa-a999-43c5-acd6-b177b8a3df8a');
INSERT INTO public.exercise_examples_equipments VALUES ('7ac6a2c0-5cd2-45d0-9ce5-1dcf470ccae6', '2024-09-02 14:08:08.360773', '2024-09-02 14:08:08.360773', '85dbccf6-454e-4440-8905-50a90d91dbcc', '3488eaaa-a999-43c5-acd6-b177b8a3df8a');
INSERT INTO public.exercise_examples_equipments VALUES ('482f8e5e-016e-4697-bd1b-c72ad285416a', '2024-09-02 14:57:19.339855', '2024-09-02 14:57:19.339855', 'b17ae8af-2d78-4e77-b45b-39253c28247a', 'b2e39ab6-118d-46bd-ad8c-8acf9864af6c');
INSERT INTO public.exercise_examples_equipments VALUES ('6ca06222-c80c-44a3-bba6-22ffdafe13b0', '2024-09-02 14:57:19.339855', '2024-09-02 14:57:19.339855', 'e7fc1da0-48df-4338-b03f-1cea01cd12d5', 'b2e39ab6-118d-46bd-ad8c-8acf9864af6c');
INSERT INTO public.exercise_examples_equipments VALUES ('d36b5b67-cae7-42bf-bd19-1cf01a7f87cf', '2024-09-02 14:58:44.043645', '2024-09-02 14:58:44.043645', 'b17ae8af-2d78-4e77-b45b-39253c28247a', '885918a3-5c64-4f15-982e-1b9a91cb3743');
INSERT INTO public.exercise_examples_equipments VALUES ('dcd95394-a179-4893-a4bb-c9b7be8308a9', '2024-09-02 14:58:44.043645', '2024-09-02 14:58:44.043645', '6345b70f-6e3f-46e2-9d51-3be51250ed99', '885918a3-5c64-4f15-982e-1b9a91cb3743');
INSERT INTO public.exercise_examples_equipments VALUES ('73544ee5-882a-4b11-ab6b-78b0edd64b7b', '2024-09-02 15:01:10.965681', '2024-09-02 15:01:10.965681', '3f2fb6e0-df68-4881-a735-f07ea083aaa7', '21370a0a-b01b-4e32-8f43-8648a54cd35c');
INSERT INTO public.exercise_examples_equipments VALUES ('1a1dca59-d321-47ec-ba1a-638daf38dc89', '2024-09-02 15:03:16.614054', '2024-09-02 15:03:16.614054', 'a6628e7c-1488-4268-82ee-5174f3a5a2a5', 'e1511aa4-1d34-4984-aa54-88f88029a96e');
INSERT INTO public.exercise_examples_equipments VALUES ('aa01d7c8-29b1-4547-8a31-67cb3ecce949', '2024-09-02 15:03:16.614054', '2024-09-02 15:03:16.614054', '331a0c35-f5a5-478d-ba7c-9f14ba2ee0fa', 'e1511aa4-1d34-4984-aa54-88f88029a96e');
INSERT INTO public.exercise_examples_equipments VALUES ('32bc63f0-faa1-4ab2-880a-9c6dffec7624', '2024-09-02 15:21:43.003281', '2024-09-02 15:21:43.003281', '79e4532a-afda-421f-9b5f-8c2de5f63ec0', 'fff561d6-3738-4360-a110-f93dcb3c8c10');
INSERT INTO public.exercise_examples_equipments VALUES ('463e354c-4669-45e5-9ae3-390b8798f239', '2024-09-02 15:26:06.643932', '2024-09-02 15:26:06.643932', 'c01e10b9-4ef6-4f23-9b41-7f6d5d4d1e85', 'db9ff44c-2e27-42df-8f6a-1b64429999e1');
INSERT INTO public.exercise_examples_equipments VALUES ('685611f6-baea-4051-801e-2d504f4daa9b', '2024-09-02 20:16:40.198699', '2024-09-02 20:16:40.198699', '9d66ac93-3a48-429d-aeaa-54302856e204', 'ec09f8c7-04cf-4219-8033-3dd17ea5c1d9');
INSERT INTO public.exercise_examples_equipments VALUES ('793ef5fa-73cf-4252-a149-7a7f39e765c3', '2024-09-02 20:16:40.198699', '2024-09-02 20:16:40.198699', '6215cbaf-6065-4534-a9d5-a588c1b3dc28', 'ec09f8c7-04cf-4219-8033-3dd17ea5c1d9');
INSERT INTO public.exercise_examples_equipments VALUES ('89944416-0434-4646-8ecc-4d83fc21afb1', '2024-09-02 20:18:44.753169', '2024-09-02 20:18:44.753169', '9d66ac93-3a48-429d-aeaa-54302856e204', '9be8d3a0-574b-40dc-a42c-06ab42af7e66');
INSERT INTO public.exercise_examples_equipments VALUES ('e053b7a5-1780-410e-ae60-a40c2fc51ad4', '2024-09-02 20:18:44.753169', '2024-09-02 20:18:44.753169', '85dbccf6-454e-4440-8905-50a90d91dbcc', '9be8d3a0-574b-40dc-a42c-06ab42af7e66');
INSERT INTO public.exercise_examples_equipments VALUES ('95807c3a-0548-403e-b30e-a2c9f506a036', '2024-09-02 20:20:26.764029', '2024-09-02 20:20:26.764029', 'a6628e7c-1488-4268-82ee-5174f3a5a2a5', '82890348-a566-4762-b9b4-f89e52534936');
INSERT INTO public.exercise_examples_equipments VALUES ('d209f2be-5779-4c36-abe2-9cd079376f68', '2024-09-02 20:20:26.764029', '2024-09-02 20:20:26.764029', '331a0c35-f5a5-478d-ba7c-9f14ba2ee0fa', '82890348-a566-4762-b9b4-f89e52534936');
INSERT INTO public.exercise_examples_equipments VALUES ('1195f1ea-397b-4a23-ada1-04e106d218c0', '2024-09-02 20:22:38.722144', '2024-09-02 20:22:38.722144', 'a6628e7c-1488-4268-82ee-5174f3a5a2a5', '13fcd794-54fb-413f-8bbf-44353cd29869');
INSERT INTO public.exercise_examples_equipments VALUES ('a51e6dce-5e08-4ab5-b52a-59353268a89d', '2024-09-02 20:22:38.722144', '2024-09-02 20:22:38.722144', '331a0c35-f5a5-478d-ba7c-9f14ba2ee0fa', '13fcd794-54fb-413f-8bbf-44353cd29869');
INSERT INTO public.exercise_examples_equipments VALUES ('935552b7-0eab-44fe-9e96-1b7e2641816b', '2024-09-02 20:26:26.28052', '2024-09-02 20:26:26.28052', 'b17ae8af-2d78-4e77-b45b-39253c28247a', '3d0c8e76-37a9-4f4c-84fa-47a6a07aaacc');
INSERT INTO public.exercise_examples_equipments VALUES ('660f8da1-e831-42dd-99b9-fc3ed30fbb2f', '2024-09-02 20:26:26.28052', '2024-09-02 20:26:26.28052', '9677e942-8a9b-4754-a27f-7e4d945681a1', '3d0c8e76-37a9-4f4c-84fa-47a6a07aaacc');
INSERT INTO public.exercise_examples_equipments VALUES ('e0cc1762-c021-458a-914b-c3fc4f63bdd7', '2024-09-02 20:27:53.788571', '2024-09-02 20:27:53.788571', '9d66ac93-3a48-429d-aeaa-54302856e204', '8a39b1e7-986c-41e7-a0b9-44a4efb46360');
INSERT INTO public.exercise_examples_equipments VALUES ('4d903c0c-abb5-4faf-acc8-205bf0a6c9b0', '2024-09-02 20:27:53.788571', '2024-09-02 20:27:53.788571', '85dbccf6-454e-4440-8905-50a90d91dbcc', '8a39b1e7-986c-41e7-a0b9-44a4efb46360');
INSERT INTO public.exercise_examples_equipments VALUES ('d027208d-9de2-49b0-bebb-8cb6dfc22ab6', '2024-09-02 20:31:29.288147', '2024-09-02 20:31:29.288147', '9d66ac93-3a48-429d-aeaa-54302856e204', '8a73b841-1d4e-4808-8ed7-58c4931e0e96');
INSERT INTO public.exercise_examples_equipments VALUES ('9ef3b9a6-c4eb-4e8f-89a8-eaa4a48fe599', '2024-09-02 20:31:29.288147', '2024-09-02 20:31:29.288147', 'c4d5e6fe-30fd-4f16-8646-634102d1bf1b', '8a73b841-1d4e-4808-8ed7-58c4931e0e96');
INSERT INTO public.exercise_examples_equipments VALUES ('59d295ae-bc27-43dd-a654-79e2cd90c320', '2024-09-02 20:35:21.734912', '2024-09-02 20:35:21.734912', 'a6628e7c-1488-4268-82ee-5174f3a5a2a5', 'b720265e-a3ce-48d3-8e8e-87e05c07b8a3');
INSERT INTO public.exercise_examples_equipments VALUES ('a1df1e71-c461-4826-9c37-8250744e5b9e', '2024-09-02 20:35:21.734912', '2024-09-02 20:35:21.734912', '331a0c35-f5a5-478d-ba7c-9f14ba2ee0fa', 'b720265e-a3ce-48d3-8e8e-87e05c07b8a3');
INSERT INTO public.exercise_examples_equipments VALUES ('59d88f5c-4450-4e93-8c8c-c963773d87ea', '2024-09-02 20:38:34.936709', '2024-09-02 20:38:34.936709', '623e0be7-870a-4bca-b053-76e99c9ea7e0', 'f6dd98f1-ad1d-4ea2-ba97-9939ce0fc028');
INSERT INTO public.exercise_examples_equipments VALUES ('7f799ac5-2b4a-4257-83a7-3068fe5d3a32', '2024-09-02 20:38:34.936709', '2024-09-02 20:38:34.936709', '6215cbaf-6065-4534-a9d5-a588c1b3dc28', 'f6dd98f1-ad1d-4ea2-ba97-9939ce0fc028');
INSERT INTO public.exercise_examples_equipments VALUES ('d1bce429-c0d6-4308-a292-40120be47d3e', '2024-09-02 20:40:09.543442', '2024-09-02 20:40:09.543442', 'a6628e7c-1488-4268-82ee-5174f3a5a2a5', 'f467d244-5568-40f6-bd7a-b3bdcad82398');
INSERT INTO public.exercise_examples_equipments VALUES ('e26ceaf2-6046-4faa-917a-db947b662694', '2024-09-02 20:40:09.543442', '2024-09-02 20:40:09.543442', '331a0c35-f5a5-478d-ba7c-9f14ba2ee0fa', 'f467d244-5568-40f6-bd7a-b3bdcad82398');
INSERT INTO public.exercise_examples_equipments VALUES ('cfa0a39a-0e58-42ab-8582-2ea000dac05a', '2024-09-02 20:42:00.05867', '2024-09-02 20:42:00.05867', 'a6628e7c-1488-4268-82ee-5174f3a5a2a5', '2780e6d9-a86f-4038-b96f-ef59f961cb4b');
INSERT INTO public.exercise_examples_equipments VALUES ('ad329922-bbd7-4e66-80cf-6ed9566689b0', '2024-09-02 20:42:00.05867', '2024-09-02 20:42:00.05867', '331a0c35-f5a5-478d-ba7c-9f14ba2ee0fa', '2780e6d9-a86f-4038-b96f-ef59f961cb4b');
INSERT INTO public.exercise_examples_equipments VALUES ('f0463996-b24d-4466-9c10-ceb9bfa80452', '2024-09-02 20:59:37.535624', '2024-09-02 20:59:37.535624', '85dbccf6-454e-4440-8905-50a90d91dbcc', 'e68781f2-7021-4907-af54-de18b80d181a');
INSERT INTO public.exercise_examples_equipments VALUES ('e693bf01-4167-474e-8a7d-9b5e7355058a', '2024-09-02 21:01:10.568064', '2024-09-02 21:01:10.568064', '623e0be7-870a-4bca-b053-76e99c9ea7e0', '5b7d739c-d130-466c-a5ac-9e8b318b77ad');
INSERT INTO public.exercise_examples_equipments VALUES ('ed67c329-ea65-43c3-b62e-021076b0f820', '2024-09-02 21:01:10.568064', '2024-09-02 21:01:10.568064', '85dbccf6-454e-4440-8905-50a90d91dbcc', '5b7d739c-d130-466c-a5ac-9e8b318b77ad');
INSERT INTO public.exercise_examples_equipments VALUES ('4b1c8ae8-e90c-43f8-b1a6-dc33b328990d', '2024-09-02 21:02:37.715664', '2024-09-02 21:02:37.715664', '9d66ac93-3a48-429d-aeaa-54302856e204', '3edb750e-4725-4338-a079-d48dc8797917');
INSERT INTO public.exercise_examples_equipments VALUES ('1807502e-73ab-414c-aa97-47b60808d2c8', '2024-09-02 21:02:37.715664', '2024-09-02 21:02:37.715664', 'c4d5e6fe-30fd-4f16-8646-634102d1bf1b', '3edb750e-4725-4338-a079-d48dc8797917');
INSERT INTO public.exercise_examples_equipments VALUES ('adbe7f9c-e1ed-4d2b-91a2-a44fe8241823', '2024-09-02 21:04:38.441037', '2024-09-02 21:04:38.441037', 'a6628e7c-1488-4268-82ee-5174f3a5a2a5', 'ff2d84fc-ff6d-4637-8128-91c1495c98e8');
INSERT INTO public.exercise_examples_equipments VALUES ('b4efbf2b-7f8a-464f-ab6e-4cef025f504b', '2024-09-02 21:04:38.441037', '2024-09-02 21:04:38.441037', '6215cbaf-6065-4534-a9d5-a588c1b3dc28', 'ff2d84fc-ff6d-4637-8128-91c1495c98e8');
INSERT INTO public.exercise_examples_equipments VALUES ('1911bc53-884c-40bb-bbb6-f14cec766d1c', '2024-09-02 21:04:38.441037', '2024-09-02 21:04:38.441037', '331a0c35-f5a5-478d-ba7c-9f14ba2ee0fa', 'ff2d84fc-ff6d-4637-8128-91c1495c98e8');
INSERT INTO public.exercise_examples_equipments VALUES ('8a382c0a-3cef-482e-8309-1d2e72cc924f', '2024-09-02 21:07:15.408038', '2024-09-02 21:07:15.408038', 'a6628e7c-1488-4268-82ee-5174f3a5a2a5', 'c2059aab-d7b5-4532-a8a7-ad15a4054b33');
INSERT INTO public.exercise_examples_equipments VALUES ('c7d9f039-2931-431b-a543-5d8706bb36c7', '2024-09-02 21:07:15.408038', '2024-09-02 21:07:15.408038', '331a0c35-f5a5-478d-ba7c-9f14ba2ee0fa', 'c2059aab-d7b5-4532-a8a7-ad15a4054b33');
INSERT INTO public.exercise_examples_equipments VALUES ('5f375732-d54f-4681-b122-ed319091db0f', '2024-09-02 21:09:41.744759', '2024-09-02 21:09:41.744759', 'a6628e7c-1488-4268-82ee-5174f3a5a2a5', '118eab6d-cae9-4c0b-b8e6-57f3e5541f1a');
INSERT INTO public.exercise_examples_equipments VALUES ('68335921-70b3-44a2-991e-e76dc536d429', '2024-09-02 21:09:41.744759', '2024-09-02 21:09:41.744759', '85dbccf6-454e-4440-8905-50a90d91dbcc', '118eab6d-cae9-4c0b-b8e6-57f3e5541f1a');
INSERT INTO public.exercise_examples_equipments VALUES ('f97709e1-9000-41e3-9279-750122b92f74', '2024-09-02 21:09:41.744759', '2024-09-02 21:09:41.744759', '331a0c35-f5a5-478d-ba7c-9f14ba2ee0fa', '118eab6d-cae9-4c0b-b8e6-57f3e5541f1a');
INSERT INTO public.exercise_examples_equipments VALUES ('e0dce1e0-d11d-444c-b72b-6b07b0f58e00', '2024-09-02 21:11:10.388136', '2024-09-02 21:11:10.388136', 'a6628e7c-1488-4268-82ee-5174f3a5a2a5', '9a4eec3b-3f0b-4b36-a2b5-0f544376cf78');
INSERT INTO public.exercise_examples_equipments VALUES ('c26fbcda-bd1f-4a76-8ded-4873864d5465', '2024-09-02 21:11:10.388136', '2024-09-02 21:11:10.388136', 'c4d5e6fe-30fd-4f16-8646-634102d1bf1b', '9a4eec3b-3f0b-4b36-a2b5-0f544376cf78');
INSERT INTO public.exercise_examples_equipments VALUES ('660071a1-8860-45bf-b7c5-c3299edfeff0', '2024-09-02 21:11:10.388136', '2024-09-02 21:11:10.388136', '331a0c35-f5a5-478d-ba7c-9f14ba2ee0fa', '9a4eec3b-3f0b-4b36-a2b5-0f544376cf78');
INSERT INTO public.exercise_examples_equipments VALUES ('9ac9d5cb-384a-4d98-96f7-5198b1af8751', '2024-09-03 08:30:59.481053', '2024-09-03 08:30:59.481053', 'b17ae8af-2d78-4e77-b45b-39253c28247a', '61a31a0d-a736-48b5-b03e-44aa1ad7f3eb');
INSERT INTO public.exercise_examples_equipments VALUES ('17729009-9154-44b6-b1bd-3a24f6e58eb1', '2024-09-03 08:30:59.481053', '2024-09-03 08:30:59.481053', '85dbccf6-454e-4440-8905-50a90d91dbcc', '61a31a0d-a736-48b5-b03e-44aa1ad7f3eb');
INSERT INTO public.exercise_examples_equipments VALUES ('ea239ef0-fddf-45d7-a91e-b325f2ace924', '2024-09-03 08:32:01.600557', '2024-09-03 08:32:01.600557', 'b17ae8af-2d78-4e77-b45b-39253c28247a', 'c5864272-ae27-4363-add6-7ead1b7b3379');
INSERT INTO public.exercise_examples_equipments VALUES ('e0667892-bc85-4c76-90c4-9dff62282d11', '2024-09-03 08:33:21.461537', '2024-09-03 08:33:21.461537', 'b17ae8af-2d78-4e77-b45b-39253c28247a', 'ddaf509f-3c99-437c-b872-a4651a91601f');
INSERT INTO public.exercise_examples_equipments VALUES ('609fd1e1-519d-41ec-85ac-4448b46c3f4f', '2024-09-03 08:35:16.719492', '2024-09-03 08:35:16.719492', 'ad130932-4b2f-4e7b-b3a4-c20b4a6b85ae', 'd3f54e1c-6333-4a15-b09b-0264ec0b68fe');
INSERT INTO public.exercise_examples_equipments VALUES ('7d1e0f4a-ec9f-44d7-a0ff-77adfe3a5b02', '2024-09-03 08:56:48.840824', '2024-09-03 08:56:48.840824', '9d66ac93-3a48-429d-aeaa-54302856e204', '414a1891-1a28-4dbe-84e3-a992c6e879bc');
INSERT INTO public.exercise_examples_equipments VALUES ('76a839d5-a121-4ae9-8498-8c100ae6833b', '2024-09-03 08:56:48.840824', '2024-09-03 08:56:48.840824', '85dbccf6-454e-4440-8905-50a90d91dbcc', '414a1891-1a28-4dbe-84e3-a992c6e879bc');
INSERT INTO public.exercise_examples_equipments VALUES ('925c629c-aff6-4ea7-a355-9d1d5314dea9', '2024-09-03 09:26:50.102291', '2024-09-03 09:26:50.102291', 'b17ae8af-2d78-4e77-b45b-39253c28247a', 'd59d340d-774d-4c81-8b3d-251175936221');
INSERT INTO public.exercise_examples_equipments VALUES ('2bd6edbc-65c2-46c7-9a56-f62e1713d27c', '2024-09-03 09:26:50.102291', '2024-09-03 09:26:50.102291', '85dbccf6-454e-4440-8905-50a90d91dbcc', 'd59d340d-774d-4c81-8b3d-251175936221');
INSERT INTO public.exercise_examples_equipments VALUES ('1b51ecf3-d12d-402d-b8e9-5e44a6207f7e', '2024-09-03 09:28:25.004652', '2024-09-03 09:28:25.004652', '9d66ac93-3a48-429d-aeaa-54302856e204', '10870aab-3086-462e-a64e-14710e3fbffe');
INSERT INTO public.exercise_examples_equipments VALUES ('80e7fdb9-c640-4ff6-a353-27b080372ec7', '2024-09-03 09:28:25.004652', '2024-09-03 09:28:25.004652', '85dbccf6-454e-4440-8905-50a90d91dbcc', '10870aab-3086-462e-a64e-14710e3fbffe');
INSERT INTO public.exercise_examples_equipments VALUES ('5a0fba38-a683-47fa-bda8-8f3e373d748b', '2024-09-03 09:30:01.952859', '2024-09-03 09:30:01.952859', '9d66ac93-3a48-429d-aeaa-54302856e204', 'bb9c756b-0c9e-4e87-826f-bb2cbd16d86b');
INSERT INTO public.exercise_examples_equipments VALUES ('96828f4a-2361-45f7-a9eb-40b9a378c0c8', '2024-09-03 09:30:01.952859', '2024-09-03 09:30:01.952859', '85dbccf6-454e-4440-8905-50a90d91dbcc', 'bb9c756b-0c9e-4e87-826f-bb2cbd16d86b');
INSERT INTO public.exercise_examples_equipments VALUES ('58c4f7b3-2aec-4daa-991c-1aa14947cf6e', '2024-09-03 09:32:06.561414', '2024-09-03 09:32:06.561414', '9d66ac93-3a48-429d-aeaa-54302856e204', '7545289f-f7c8-456b-98e9-f7b15600254c');
INSERT INTO public.exercise_examples_equipments VALUES ('f99fbb76-6a27-42cd-98e9-b48b87632ce7', '2024-09-03 09:32:06.561414', '2024-09-03 09:32:06.561414', '85dbccf6-454e-4440-8905-50a90d91dbcc', '7545289f-f7c8-456b-98e9-f7b15600254c');
INSERT INTO public.exercise_examples_equipments VALUES ('8be3ccfc-28c5-4d23-bf02-2cf14ee28473', '2024-09-03 09:34:29.282248', '2024-09-03 09:34:29.282248', '752ee7ba-ae88-46f0-95fb-e0a316212f16', 'b35c5710-3c80-4f48-8ee4-295e5a15999f');
INSERT INTO public.exercise_examples_equipments VALUES ('fdec77fa-9b93-4245-b799-e33f28c1ddb1', '2024-09-03 09:34:29.282248', '2024-09-03 09:34:29.282248', '15495639-2adb-41b8-899c-493ac0172f57', 'b35c5710-3c80-4f48-8ee4-295e5a15999f');
INSERT INTO public.exercise_examples_equipments VALUES ('1ec253bd-d0f3-4566-bacd-6395b870a862', '2024-09-03 09:37:05.564711', '2024-09-03 09:37:05.564711', '752ee7ba-ae88-46f0-95fb-e0a316212f16', 'd7871e0c-5e1b-4ffd-a9ab-951028246a01');
INSERT INTO public.exercise_examples_equipments VALUES ('568fe738-c7e6-4f85-9f4c-0ac5f8b663f5', '2024-09-03 09:37:05.564711', '2024-09-03 09:37:05.564711', '15495639-2adb-41b8-899c-493ac0172f57', 'd7871e0c-5e1b-4ffd-a9ab-951028246a01');
INSERT INTO public.exercise_examples_equipments VALUES ('fa9f57ba-4129-4df1-8e1e-224b11304a97', '2024-09-03 09:38:26.932631', '2024-09-03 09:38:26.932631', 'b17ae8af-2d78-4e77-b45b-39253c28247a', 'b53daf0a-c7b6-4be8-9230-b33695eb5340');
INSERT INTO public.exercise_examples_equipments VALUES ('d9e9bd1b-a5f4-4829-bc8c-bad5be22320b', '2024-09-03 09:38:26.932631', '2024-09-03 09:38:26.932631', '85dbccf6-454e-4440-8905-50a90d91dbcc', 'b53daf0a-c7b6-4be8-9230-b33695eb5340');
INSERT INTO public.exercise_examples_equipments VALUES ('62da9cf8-d10d-466f-bc36-7f9f733d5610', '2024-09-03 09:39:30.853833', '2024-09-03 09:39:30.853833', 'ad130932-4b2f-4e7b-b3a4-c20b4a6b85ae', '60bd8dbc-6bb8-4be0-9ee7-f4c5a295c5b4');
INSERT INTO public.exercise_examples_equipments VALUES ('e7c1d243-8054-41b8-b357-bdf260344065', '2024-09-03 09:39:30.853833', '2024-09-03 09:39:30.853833', '061ad8e2-77aa-4ba8-9a41-51788e7803c7', '60bd8dbc-6bb8-4be0-9ee7-f4c5a295c5b4');
INSERT INTO public.exercise_examples_equipments VALUES ('e1b9123a-3de8-4529-b71b-37f36f7584ae', '2024-09-03 09:42:04.645342', '2024-09-03 09:42:04.645342', '752ee7ba-ae88-46f0-95fb-e0a316212f16', 'a2f8dd49-606e-4d86-ae04-8af61c0b40e9');
INSERT INTO public.exercise_examples_equipments VALUES ('bd98bc90-e3b7-48d8-9138-4706ad67c139', '2024-09-03 09:42:04.645342', '2024-09-03 09:42:04.645342', '15495639-2adb-41b8-899c-493ac0172f57', 'a2f8dd49-606e-4d86-ae04-8af61c0b40e9');
INSERT INTO public.exercise_examples_equipments VALUES ('08e98012-595a-4b8c-89c9-b4e6c7df9cff', '2024-09-03 09:42:04.645342', '2024-09-03 09:42:04.645342', '85dbccf6-454e-4440-8905-50a90d91dbcc', 'a2f8dd49-606e-4d86-ae04-8af61c0b40e9');
INSERT INTO public.exercise_examples_equipments VALUES ('fb233b4f-a40a-40d9-8af4-645ca106bc9b', '2024-09-03 09:43:17.740343', '2024-09-03 09:43:17.740343', '752ee7ba-ae88-46f0-95fb-e0a316212f16', 'b515dd55-701a-45f4-938f-fdb26d2d5cba');
INSERT INTO public.exercise_examples_equipments VALUES ('788ae371-9468-40de-8a0c-e30fa5de86fa', '2024-09-03 09:43:17.740343', '2024-09-03 09:43:17.740343', '15495639-2adb-41b8-899c-493ac0172f57', 'b515dd55-701a-45f4-938f-fdb26d2d5cba');
INSERT INTO public.exercise_examples_equipments VALUES ('83d283ec-9646-457d-8872-aea9f8e3634a', '2024-09-03 09:43:17.740343', '2024-09-03 09:43:17.740343', '85dbccf6-454e-4440-8905-50a90d91dbcc', 'b515dd55-701a-45f4-938f-fdb26d2d5cba');
INSERT INTO public.exercise_examples_equipments VALUES ('9320ca6b-51a1-4112-8452-fed9ef76b84e', '2024-09-03 09:44:32.019479', '2024-09-03 09:44:32.019479', 'b17ae8af-2d78-4e77-b45b-39253c28247a', 'f5f03cc7-c2bc-4367-9042-107114d634ce');
INSERT INTO public.exercise_examples_equipments VALUES ('c33098e4-4368-4864-aed8-48d5da8c7daf', '2024-09-03 09:44:32.019479', '2024-09-03 09:44:32.019479', '85dbccf6-454e-4440-8905-50a90d91dbcc', 'f5f03cc7-c2bc-4367-9042-107114d634ce');
INSERT INTO public.exercise_examples_equipments VALUES ('2cbafca1-ebe8-4984-9801-9d5dd01731d3', '2024-09-03 11:04:13.316126', '2024-09-03 11:04:13.316126', 'afe516f8-6dc9-45ca-b95e-81142c336878', '7d823dc8-8303-4ddd-a25d-935569c662b7');
INSERT INTO public.exercise_examples_equipments VALUES ('aa95424c-4171-45e2-be12-2e3cf849dedb', '2024-09-03 11:07:53.761481', '2024-09-03 11:07:53.761481', 'b17ae8af-2d78-4e77-b45b-39253c28247a', '78b3c689-0222-46de-a7b3-9bd6c75b920c');
INSERT INTO public.exercise_examples_equipments VALUES ('997a16d9-0040-4dc7-9cf0-2fa47540a418', '2024-09-03 11:07:53.761481', '2024-09-03 11:07:53.761481', '85dbccf6-454e-4440-8905-50a90d91dbcc', '78b3c689-0222-46de-a7b3-9bd6c75b920c');
INSERT INTO public.exercise_examples_equipments VALUES ('4ac67982-b31e-4cde-9d14-81ba2877a864', '2024-09-03 11:13:27.424853', '2024-09-03 11:13:27.424853', 'b17ae8af-2d78-4e77-b45b-39253c28247a', 'b39cc5b5-8335-4918-a504-f9cdfb85ceba');
INSERT INTO public.exercise_examples_equipments VALUES ('d52ef106-78de-460e-97fd-783660f9e36a', '2024-09-03 11:13:27.424853', '2024-09-03 11:13:27.424853', 'a025ec57-670e-45ea-962e-9c9430786666', 'b39cc5b5-8335-4918-a504-f9cdfb85ceba');
INSERT INTO public.exercise_examples_equipments VALUES ('6497b854-ddb6-438d-a8ff-c03704c7710d', '2024-09-03 11:21:01.353043', '2024-09-03 11:21:01.353043', '306270ba-834e-461e-81ce-45fd5a77c99f', 'd806b4f1-399c-4ceb-bb91-663ec0350e6d');
INSERT INTO public.exercise_examples_equipments VALUES ('7463a8dd-3405-466e-ae7b-e8b161af011c', '2024-09-05 12:48:41.935518', '2024-09-05 12:48:41.935518', 'b17ae8af-2d78-4e77-b45b-39253c28247a', '3a39a222-7b4d-4e0e-9e7e-034d78b5d6bf');
INSERT INTO public.exercise_examples_equipments VALUES ('73c30b3e-8292-43bc-bf6a-a4bd82b4b009', '2024-09-05 12:48:41.935518', '2024-09-05 12:48:41.935518', 'a025ec57-670e-45ea-962e-9c9430786666', '3a39a222-7b4d-4e0e-9e7e-034d78b5d6bf');
INSERT INTO public.exercise_examples_equipments VALUES ('da66c6f8-af5d-49a9-8532-53d6728dcaee', '2024-09-05 12:54:46.798949', '2024-09-05 12:54:46.798949', '9d66ac93-3a48-429d-aeaa-54302856e204', 'be3c01a7-3bd0-448c-844b-583bd824c90b');
INSERT INTO public.exercise_examples_equipments VALUES ('915d3dde-452a-4065-97b4-f43a7166122d', '2024-09-05 12:56:19.222297', '2024-09-05 12:56:19.222297', 'b17ae8af-2d78-4e77-b45b-39253c28247a', '1dcd59ab-674e-49d8-9a06-9c17c2a05730');
INSERT INTO public.exercise_examples_equipments VALUES ('ec70b268-dcba-4f29-bc22-09f39a8b0b96', '2024-09-05 12:59:02.114543', '2024-09-05 12:59:02.114543', 'a8a80e95-9165-4200-af80-cd7608099307', '05b3842c-2a19-484e-bae3-a12e86c2fa4c');
INSERT INTO public.exercise_examples_equipments VALUES ('42590ebc-3389-4499-afdd-db24a48c1869', '2024-09-05 13:05:01.304619', '2024-09-05 13:05:01.304619', 'b17ae8af-2d78-4e77-b45b-39253c28247a', 'ad98534e-b2d9-4fef-9983-578ef12b28f7');
INSERT INTO public.exercise_examples_equipments VALUES ('71f9d832-3a06-46ba-92c5-3717ccbed4d1', '2024-09-05 13:06:37.171303', '2024-09-05 13:06:37.171303', 'b17ae8af-2d78-4e77-b45b-39253c28247a', 'b5c6e6a6-6eec-422c-ad4a-8dca82287312');
INSERT INTO public.exercise_examples_equipments VALUES ('667970b6-07ea-4cc1-b1e4-a41a6677c952', '2024-09-05 13:08:00.590087', '2024-09-05 13:08:00.590087', '9d66ac93-3a48-429d-aeaa-54302856e204', '9b3f9b20-544d-49e1-880e-879e24e81581');
INSERT INTO public.exercise_examples_equipments VALUES ('a0be2bf4-1bd4-4f0f-a6b8-80d3de3ca5d0', '2024-09-05 13:10:41.491381', '2024-09-05 13:10:41.491381', '21aad68b-b21b-4452-9ebf-7407be8e613d', '12070323-971e-421a-9eaf-bdce4f8e0464');
INSERT INTO public.exercise_examples_equipments VALUES ('2c7089c4-a615-4daa-8e1b-9d8e967742a3', '2024-09-05 13:12:38.919761', '2024-09-05 13:12:38.919761', '21aad68b-b21b-4452-9ebf-7407be8e613d', '379d64cd-24bf-4a81-9b97-936c9a088e17');
INSERT INTO public.exercise_examples_equipments VALUES ('5a24fbe6-d301-4475-a925-a4cb667fa81d', '2024-09-05 13:33:56.333513', '2024-09-05 13:33:56.333513', '20e225dd-68d7-409b-9b7d-5ef6d4224d02', '04d3e242-807d-4cba-9be4-e3d11a8efbc4');
INSERT INTO public.exercise_examples_equipments VALUES ('f9649482-4f82-4937-a846-7726941fb15a', '2024-09-05 13:37:08.624602', '2024-09-05 13:37:08.624602', 'b17ae8af-2d78-4e77-b45b-39253c28247a', 'ca38bcba-658f-4c7a-be54-b2c3f845fbe0');
INSERT INTO public.exercise_examples_equipments VALUES ('9baa4575-bcc5-463e-872f-3a3bf5656c3c', '2024-09-05 13:38:49.282638', '2024-09-05 13:38:49.282638', '306270ba-834e-461e-81ce-45fd5a77c99f', 'f11ef4dd-cc6b-42ad-844d-0e94cef691f0');
INSERT INTO public.exercise_examples_equipments VALUES ('71a9cf3d-d7fd-41b1-a325-4cda9f4c5b3b', '2024-09-05 13:42:24.387105', '2024-09-05 13:42:24.387105', '21aad68b-b21b-4452-9ebf-7407be8e613d', '676f21e5-7b5a-4c11-a505-4545822673de');
INSERT INTO public.exercise_examples_equipments VALUES ('5dea08ec-3e97-4605-b52e-979db427994b', '2024-09-05 13:44:20.967667', '2024-09-05 13:44:20.967667', 'b17ae8af-2d78-4e77-b45b-39253c28247a', 'c18b086c-b0c3-4d1c-a6a3-2653e36c5dff');
INSERT INTO public.exercise_examples_equipments VALUES ('38307eb7-35ad-4571-bc17-845ad48d0de2', '2024-09-05 13:49:52.440143', '2024-09-05 13:49:52.440143', '623e0be7-870a-4bca-b053-76e99c9ea7e0', '6115df45-ddad-4fa6-bfb0-1c0cd72de766');
INSERT INTO public.exercise_examples_equipments VALUES ('e781fc4f-bc1c-436c-80dc-19158f3e09e4', '2024-09-06 11:10:17.468218', '2024-09-06 11:10:17.468218', '752ee7ba-ae88-46f0-95fb-e0a316212f16', 'f4041256-a9ac-430d-b611-d8a957e2aeb0');
INSERT INTO public.exercise_examples_equipments VALUES ('22271295-2abe-4f44-91f5-d6e6f564f427', '2024-09-06 11:10:17.468218', '2024-09-06 11:10:17.468218', '15495639-2adb-41b8-899c-493ac0172f57', 'f4041256-a9ac-430d-b611-d8a957e2aeb0');
INSERT INTO public.exercise_examples_equipments VALUES ('3b026b6e-3232-418a-a7e7-c83a0da499d0', '2024-09-06 11:15:01.154775', '2024-09-06 11:15:01.154775', 'ddf4299a-fc48-47bd-9bdf-7e3d7692b09f', '8e687b8b-0142-49f7-92e9-4d5df9aa86c9');
INSERT INTO public.exercise_examples_equipments VALUES ('4de92f49-2970-4403-92f1-ba221b788b4e', '2024-09-06 11:18:17.212483', '2024-09-06 11:18:17.212483', '18995b62-6971-4750-84fe-0c2bc712f352', '4a2c7160-6cf2-456d-8ef4-80040b720420');
INSERT INTO public.exercise_examples_equipments VALUES ('8a50ccab-f036-4f86-a21d-914ab1ab90e1', '2024-09-06 11:18:17.212483', '2024-09-06 11:18:17.212483', 'dec9f53a-7dac-4199-b4ff-ab0624090b8b', '4a2c7160-6cf2-456d-8ef4-80040b720420');
INSERT INTO public.exercise_examples_equipments VALUES ('7cc2b9e8-a397-4098-a17c-eef53ad40e84', '2024-09-06 11:21:03.174118', '2024-09-06 11:21:03.174118', '18995b62-6971-4750-84fe-0c2bc712f352', '93c687ff-68f2-44d0-9f3a-8c4c15c960e8');
INSERT INTO public.exercise_examples_equipments VALUES ('7665c3a5-196d-4c99-a91d-ae4d77b27070', '2024-09-06 11:21:03.174118', '2024-09-06 11:21:03.174118', 'dec9f53a-7dac-4199-b4ff-ab0624090b8b', '93c687ff-68f2-44d0-9f3a-8c4c15c960e8');
INSERT INTO public.exercise_examples_equipments VALUES ('3c74b271-2336-4b44-9d30-34ea6428edd3', '2024-09-06 21:19:43.241244', '2024-09-06 21:19:43.241244', 'ddf4299a-fc48-47bd-9bdf-7e3d7692b09f', '738d7264-00af-48dd-a475-3c4d12e28188');
INSERT INTO public.exercise_examples_equipments VALUES ('072e8596-6607-404a-9b5f-f3c8724988f7', '2024-09-06 21:22:25.314861', '2024-09-06 21:22:25.314861', '18995b62-6971-4750-84fe-0c2bc712f352', 'e84c6031-9d71-41a1-ae2c-6c9901ea1d6b');
INSERT INTO public.exercise_examples_equipments VALUES ('de9b55c8-a4bc-4b2a-9d96-0dcf21757611', '2024-09-06 21:22:25.314861', '2024-09-06 21:22:25.314861', 'dec9f53a-7dac-4199-b4ff-ab0624090b8b', 'e84c6031-9d71-41a1-ae2c-6c9901ea1d6b');
INSERT INTO public.exercise_examples_equipments VALUES ('9d3cecc1-1d78-43f8-934a-1ff66f8f2892', '2024-09-06 21:26:46.66858', '2024-09-06 21:26:46.66858', '18995b62-6971-4750-84fe-0c2bc712f352', 'bd3338ee-1841-4686-a98c-3493ab9cfa7e');
INSERT INTO public.exercise_examples_equipments VALUES ('f3f8c438-e1ab-45c1-85a1-cd0e67635995', '2024-09-06 21:26:46.66858', '2024-09-06 21:26:46.66858', 'dec9f53a-7dac-4199-b4ff-ab0624090b8b', 'bd3338ee-1841-4686-a98c-3493ab9cfa7e');
INSERT INTO public.exercise_examples_equipments VALUES ('008710a1-c34b-42ea-9ce8-4b0fd7a6703a', '2024-09-06 21:28:12.854436', '2024-09-06 21:28:12.854436', '752ee7ba-ae88-46f0-95fb-e0a316212f16', 'eaf575b3-2cb6-45a3-914f-81838c4c7e4d');
INSERT INTO public.exercise_examples_equipments VALUES ('c9095b39-8405-4cea-9890-aa5ca1fc51a6', '2024-09-06 21:28:12.854436', '2024-09-06 21:28:12.854436', 'af38ec0a-1465-45a8-99ba-a394224530dc', 'eaf575b3-2cb6-45a3-914f-81838c4c7e4d');
INSERT INTO public.exercise_examples_equipments VALUES ('22010d0b-8136-45c5-a6a4-b7959fcf96bc', '2024-09-06 21:31:44.43865', '2024-09-06 21:31:44.43865', '18995b62-6971-4750-84fe-0c2bc712f352', 'c25a5f07-d65f-4ba9-9b0d-cb4d5b426455');
INSERT INTO public.exercise_examples_equipments VALUES ('eaa57672-d999-4161-934d-77ba359b62b0', '2024-09-06 21:31:44.43865', '2024-09-06 21:31:44.43865', 'c7c51826-c595-4ae8-9ac4-4421b2afc4ad', 'c25a5f07-d65f-4ba9-9b0d-cb4d5b426455');
INSERT INTO public.exercise_examples_equipments VALUES ('bb8bc214-6882-4484-b744-5785a5dbf8bb', '2024-09-06 21:35:46.040378', '2024-09-06 21:35:46.040378', '18995b62-6971-4750-84fe-0c2bc712f352', '85a317d2-6cf2-4155-a6ea-a271afc4a803');
INSERT INTO public.exercise_examples_equipments VALUES ('376a3be5-69d8-4a5d-a3a0-ce9203b986e4', '2024-09-06 21:35:46.040378', '2024-09-06 21:35:46.040378', 'dec9f53a-7dac-4199-b4ff-ab0624090b8b', '85a317d2-6cf2-4155-a6ea-a271afc4a803');
INSERT INTO public.exercise_examples_equipments VALUES ('720273a9-4d13-42e2-a9ad-100bd3df183e', '2024-09-07 14:58:48.654447', '2024-09-07 14:58:48.654447', '9d66ac93-3a48-429d-aeaa-54302856e204', 'c1ca2c25-9148-4977-99fe-3acda0b4ad33');
INSERT INTO public.exercise_examples_equipments VALUES ('93b388fb-6d1f-4f50-86f1-7bfcf0caf757', '2024-09-07 15:00:25.353525', '2024-09-07 15:00:25.353525', 'b17ae8af-2d78-4e77-b45b-39253c28247a', '950cd0cd-fc3b-442f-aba9-3c48bfc6cda9');
INSERT INTO public.exercise_examples_equipments VALUES ('d22c14b4-8a02-4272-9cef-59d3efe547bb', '2024-09-07 15:02:06.009523', '2024-09-07 15:02:06.009523', '9d66ac93-3a48-429d-aeaa-54302856e204', '9c029423-aa52-4b90-97c0-f5d4b4574f12');
INSERT INTO public.exercise_examples_equipments VALUES ('5cdf4f97-3991-4482-a131-d10228dd4a0c', '2024-09-07 15:06:50.272715', '2024-09-07 15:06:50.272715', '373d04ea-8079-439a-82a3-d118da6253b1', 'baa3f656-0ad7-422b-ba8b-e5e9f5d4cd63');
INSERT INTO public.exercise_examples_equipments VALUES ('bf36717d-52ec-491c-8626-a60e602b5a99', '2024-09-07 15:06:50.272715', '2024-09-07 15:06:50.272715', 'c7c51826-c595-4ae8-9ac4-4421b2afc4ad', 'baa3f656-0ad7-422b-ba8b-e5e9f5d4cd63');
INSERT INTO public.exercise_examples_equipments VALUES ('a1ddbf01-c4ec-471a-a600-6abef35c4b8b', '2024-09-07 15:09:04.687328', '2024-09-07 15:09:04.687328', '9d66ac93-3a48-429d-aeaa-54302856e204', '6389ce45-7d30-4372-8c29-e5816d893b1a');
INSERT INTO public.exercise_examples_equipments VALUES ('03ce2623-f3d3-4f74-9756-52315e8ef4f6', '2024-09-07 15:09:04.687328', '2024-09-07 15:09:04.687328', '6215cbaf-6065-4534-a9d5-a588c1b3dc28', '6389ce45-7d30-4372-8c29-e5816d893b1a');
INSERT INTO public.exercise_examples_equipments VALUES ('970bc41e-42ca-4885-9c45-59300f0cc715', '2024-09-07 15:12:48.574203', '2024-09-07 15:12:48.574203', '9d66ac93-3a48-429d-aeaa-54302856e204', '31b8aa6a-448d-4e4c-bd1e-6386060b526e');
INSERT INTO public.exercise_examples_equipments VALUES ('752e2f2d-35af-4c97-a1f6-c188e6235b82', '2024-09-07 15:12:48.574203', '2024-09-07 15:12:48.574203', '85dbccf6-454e-4440-8905-50a90d91dbcc', '31b8aa6a-448d-4e4c-bd1e-6386060b526e');
INSERT INTO public.exercise_examples_equipments VALUES ('08db552c-b8ad-46a8-8f48-8db87c1716cb', '2024-09-07 15:16:24.621301', '2024-09-07 15:16:24.621301', '9d66ac93-3a48-429d-aeaa-54302856e204', '13826a3e-6b12-464c-95c8-5790f0e13947');
INSERT INTO public.exercise_examples_equipments VALUES ('04770e78-6e61-4b32-9552-f9cf4f9ee3f7', '2024-09-07 15:18:31.441789', '2024-09-07 15:18:31.441789', '9d66ac93-3a48-429d-aeaa-54302856e204', '91f6781b-915e-4bb4-8d8c-e345aa66e42d');
INSERT INTO public.exercise_examples_equipments VALUES ('3a74fcc8-9fd0-4d05-9359-2e133d19dce1', '2024-09-07 15:18:31.441789', '2024-09-07 15:18:31.441789', '6215cbaf-6065-4534-a9d5-a588c1b3dc28', '91f6781b-915e-4bb4-8d8c-e345aa66e42d');
INSERT INTO public.exercise_examples_equipments VALUES ('00fe0f44-2150-4b30-a81d-bab6f8d4a1c3', '2024-09-07 15:29:18.472763', '2024-09-07 15:29:18.472763', '623e0be7-870a-4bca-b053-76e99c9ea7e0', 'cbb152c0-ba9c-47ea-a8a3-28ad88f56eb6');
INSERT INTO public.exercise_examples_equipments VALUES ('28b62420-3418-4d37-9a2c-c9701cac7262', '2024-09-07 19:52:35.874631', '2024-09-07 19:52:35.874631', 'b17ae8af-2d78-4e77-b45b-39253c28247a', '0be1c49c-d742-4881-b014-360bc297af34');
INSERT INTO public.exercise_examples_equipments VALUES ('4748c3ed-2e6f-4afb-8503-ee2de41ae99c', '2024-09-07 19:54:36.140536', '2024-09-07 19:54:36.140536', 'b17ae8af-2d78-4e77-b45b-39253c28247a', '8cccb149-8553-494d-bcb5-ffa9b06e7c0f');
INSERT INTO public.exercise_examples_equipments VALUES ('7513d817-b2ac-466c-8451-c13327ffb6bb', '2024-09-07 19:56:54.242266', '2024-09-07 19:56:54.242266', '373d04ea-8079-439a-82a3-d118da6253b1', '7470e789-9509-4e22-9078-67857074867d');
INSERT INTO public.exercise_examples_equipments VALUES ('8b3b6380-4e0d-485e-86c9-f2c91899b25e', '2024-09-07 19:56:54.242266', '2024-09-07 19:56:54.242266', '331a0c35-f5a5-478d-ba7c-9f14ba2ee0fa', '7470e789-9509-4e22-9078-67857074867d');
INSERT INTO public.exercise_examples_equipments VALUES ('149f454c-9c42-4c28-97e5-4430097de67f', '2024-09-07 19:58:28.351619', '2024-09-07 19:58:28.351619', '373d04ea-8079-439a-82a3-d118da6253b1', '7976a83a-f4db-4cc5-9cac-7f16f2bc430f');
INSERT INTO public.exercise_examples_equipments VALUES ('482ea4fd-886d-466f-8828-ce22f78e453f', '2024-09-07 19:58:28.351619', '2024-09-07 19:58:28.351619', 'af38ec0a-1465-45a8-99ba-a394224530dc', '7976a83a-f4db-4cc5-9cac-7f16f2bc430f');
INSERT INTO public.exercise_examples_equipments VALUES ('2f6e93ac-c618-4d63-ae52-7217d94d5ec3', '2024-09-07 20:02:52.951001', '2024-09-07 20:02:52.951001', 'b17ae8af-2d78-4e77-b45b-39253c28247a', '6da53baf-d357-4392-927f-7da1bf7449dc');
INSERT INTO public.exercise_examples_equipments VALUES ('deb481ed-3145-45be-87ac-0a7456ea08bf', '2024-09-07 20:02:52.951001', '2024-09-07 20:02:52.951001', '6215cbaf-6065-4534-a9d5-a588c1b3dc28', '6da53baf-d357-4392-927f-7da1bf7449dc');
INSERT INTO public.exercise_examples_equipments VALUES ('17cf51e3-ceca-4c72-88fb-5885d41c5fa1', '2024-09-07 20:04:30.73186', '2024-09-07 20:04:30.73186', 'b17ae8af-2d78-4e77-b45b-39253c28247a', '6bb0675d-eba0-496c-bd20-5fd11a4a0282');
INSERT INTO public.exercise_examples_equipments VALUES ('bd1306a1-7bc6-4903-82c2-83d9c968d3ba', '2024-09-07 20:04:30.73186', '2024-09-07 20:04:30.73186', '6215cbaf-6065-4534-a9d5-a588c1b3dc28', '6bb0675d-eba0-496c-bd20-5fd11a4a0282');
INSERT INTO public.exercise_examples_equipments VALUES ('6a9a7699-e872-413e-9fcc-6245b135942b', '2024-09-07 20:10:41.933722', '2024-09-07 20:10:41.933722', '9d66ac93-3a48-429d-aeaa-54302856e204', '5de5124e-8ebb-4477-b4b3-e1122cc80496');
INSERT INTO public.exercise_examples_equipments VALUES ('61d2c27b-ab9d-47b4-85b6-a7c68639a155', '2024-09-07 20:15:00.952432', '2024-09-07 20:15:00.952432', 'b17ae8af-2d78-4e77-b45b-39253c28247a', 'd180a698-a12e-4731-8234-b96e8f3ca7d9');
INSERT INTO public.exercise_examples_equipments VALUES ('618e8937-5890-42b2-ae7a-df1991a718f0', '2024-09-07 20:17:27.656857', '2024-09-07 20:17:27.656857', 'b17ae8af-2d78-4e77-b45b-39253c28247a', '49ef1d62-a375-485a-84bd-289a5548e81b');
INSERT INTO public.exercise_examples_equipments VALUES ('0e0a44ae-2ee1-430b-8ffe-3aa3aad184b9', '2024-09-07 20:18:56.62261', '2024-09-07 20:18:56.62261', '9d66ac93-3a48-429d-aeaa-54302856e204', 'abe543c6-ec69-49ad-b9ca-ef959ffa10f2');
INSERT INTO public.exercise_examples_equipments VALUES ('f2188482-cd86-408c-8bd6-88499940c73c', '2024-09-07 20:18:56.62261', '2024-09-07 20:18:56.62261', '85dbccf6-454e-4440-8905-50a90d91dbcc', 'abe543c6-ec69-49ad-b9ca-ef959ffa10f2');
INSERT INTO public.exercise_examples_equipments VALUES ('045928ce-80fb-4924-aae3-117a0912fb60', '2024-09-07 20:20:03.758785', '2024-09-07 20:20:03.758785', '623e0be7-870a-4bca-b053-76e99c9ea7e0', 'cae7b841-a7f8-4973-baf0-4aadbbdcd0ca');
INSERT INTO public.exercise_examples_equipments VALUES ('b6990ea3-8bdb-4f9c-a3c7-5584a7bbdd92', '2024-09-07 20:21:09.874228', '2024-09-07 20:21:09.874228', '21aad68b-b21b-4452-9ebf-7407be8e613d', 'ad76d69c-5e90-4643-b507-9e9226d8b5cd');
INSERT INTO public.exercise_examples_equipments VALUES ('a78cbc66-b0fd-495a-be14-68b8589716ad', '2024-09-07 20:22:58.475906', '2024-09-07 20:22:58.475906', 'a6628e7c-1488-4268-82ee-5174f3a5a2a5', 'f451289a-6d35-4926-981d-8ebae71741a2');
INSERT INTO public.exercise_examples_equipments VALUES ('c8ca821f-37b3-4a77-8920-e765545b226c', '2024-09-07 20:22:58.475906', '2024-09-07 20:22:58.475906', '331a0c35-f5a5-478d-ba7c-9f14ba2ee0fa', 'f451289a-6d35-4926-981d-8ebae71741a2');
INSERT INTO public.exercise_examples_equipments VALUES ('0c8da05d-5326-4135-8adf-51ecc6f96f85', '2024-09-07 20:24:09.682872', '2024-09-07 20:24:09.682872', '752ee7ba-ae88-46f0-95fb-e0a316212f16', '98791e1d-6029-4cb2-bcaf-611a337208ef');
INSERT INTO public.exercise_examples_equipments VALUES ('0a2e0c1b-21ad-417a-84fc-7bf84c9db584', '2024-09-07 20:24:09.682872', '2024-09-07 20:24:09.682872', 'af38ec0a-1465-45a8-99ba-a394224530dc', '98791e1d-6029-4cb2-bcaf-611a337208ef');
INSERT INTO public.exercise_examples_equipments VALUES ('cf534b18-abff-4d06-a5c8-505d6a0f1eff', '2024-09-07 20:34:58.050348', '2024-09-07 20:34:58.050348', 'b17ae8af-2d78-4e77-b45b-39253c28247a', '22df24eb-6bb7-45bc-ab46-9d6022eec774');
INSERT INTO public.exercise_examples_equipments VALUES ('47dedfa5-1147-47c0-b9f4-6dcd4f649736', '2024-09-07 20:34:58.050348', '2024-09-07 20:34:58.050348', 'a025ec57-670e-45ea-962e-9c9430786666', '22df24eb-6bb7-45bc-ab46-9d6022eec774');
INSERT INTO public.exercise_examples_equipments VALUES ('28ab49d8-a697-41d4-973e-9ea70910ba9e', '2024-09-07 20:36:12.360253', '2024-09-07 20:36:12.360253', '9d66ac93-3a48-429d-aeaa-54302856e204', '978f906a-8584-4cdf-9d7f-f96d60865e3b');
INSERT INTO public.exercise_examples_equipments VALUES ('1a6fb40b-fadb-4c9a-86e8-66372918ed31', '2024-09-07 20:38:40.703598', '2024-09-07 20:38:40.703598', '9d66ac93-3a48-429d-aeaa-54302856e204', '4da455c2-c154-4da7-b9c5-6195bd137eec');
INSERT INTO public.exercise_examples_equipments VALUES ('ab827755-8db2-4e8e-b245-44da52c20975', '2024-09-07 20:40:09.759616', '2024-09-07 20:40:09.759616', '9d66ac93-3a48-429d-aeaa-54302856e204', '945bdcdb-6aee-42df-a974-3fedc0b76846');
INSERT INTO public.exercise_examples_equipments VALUES ('782c3ba3-91a7-4db6-9eda-4c53b3a90a51', '2024-09-07 20:41:37.064387', '2024-09-07 20:41:37.064387', '1959d942-75fb-4ece-b501-b7cf8884d479', '64406a09-56a6-43da-9329-ff0fb0d83e4f');
INSERT INTO public.exercise_examples_equipments VALUES ('90145c25-7358-4f61-95b6-4e9d0302b056', '2024-09-07 20:42:37.464957', '2024-09-07 20:42:37.464957', 'c74a2236-739f-476b-96d9-a11487d4049f', '10f8ff0e-38c6-465d-b99a-26c4026d22c6');
INSERT INTO public.exercise_examples_equipments VALUES ('ffb29e82-ad9a-4ac1-88e7-1ca1eca9ebdb', '2024-09-07 20:44:02.296095', '2024-09-07 20:44:02.296095', '9d66ac93-3a48-429d-aeaa-54302856e204', '88baf661-c550-4ecd-b15a-0d1ca4d41116');
INSERT INTO public.exercise_examples_equipments VALUES ('634e3875-64a6-4c80-811b-2d8867c88f74', '2024-09-07 20:44:02.296095', '2024-09-07 20:44:02.296095', '85dbccf6-454e-4440-8905-50a90d91dbcc', '88baf661-c550-4ecd-b15a-0d1ca4d41116');
INSERT INTO public.exercise_examples_equipments VALUES ('b3c7f483-ec9a-4981-bf86-8f5f5999bfee', '2024-09-07 20:50:37.24265', '2024-09-07 20:50:37.24265', '20e225dd-68d7-409b-9b7d-5ef6d4224d02', '4dc80274-2d3e-482e-a736-9f9399330c76');
INSERT INTO public.exercise_examples_equipments VALUES ('931ed3b9-aa20-407a-8ae8-a40b5ec56c61', '2024-09-07 20:51:46.77683', '2024-09-07 20:51:46.77683', '9d66ac93-3a48-429d-aeaa-54302856e204', '14dbd276-30fe-4558-9cf0-104751b58f2d');
INSERT INTO public.exercise_examples_equipments VALUES ('c64765d7-fa51-47f5-bb3f-76c97a36b7d6', '2024-09-07 20:53:13.278016', '2024-09-07 20:53:13.278016', 'b17ae8af-2d78-4e77-b45b-39253c28247a', '2fd70951-2d44-407e-a7ee-daa94bf6af87');
INSERT INTO public.exercise_examples_equipments VALUES ('981c3a79-8a15-4cb0-9bb8-67590cad4b8d', '2024-09-07 20:53:13.278016', '2024-09-07 20:53:13.278016', 'a025ec57-670e-45ea-962e-9c9430786666', '2fd70951-2d44-407e-a7ee-daa94bf6af87');
INSERT INTO public.exercise_examples_equipments VALUES ('2cf7f272-31cd-429c-9f5b-7e42650ac398', '2024-09-07 20:54:24.889757', '2024-09-07 20:54:24.889757', '9d66ac93-3a48-429d-aeaa-54302856e204', '24c43903-d3a7-4a39-9231-5bc7d5cec5da');
INSERT INTO public.exercise_examples_equipments VALUES ('12888867-de03-45ba-904a-86db9163bf00', '2024-09-07 20:55:27.31679', '2024-09-07 20:55:27.31679', '9d66ac93-3a48-429d-aeaa-54302856e204', 'de763854-d06d-43e9-9973-f4ca8839201b');
INSERT INTO public.exercise_examples_equipments VALUES ('87d03941-7721-4ae4-bc0e-9754baa76784', '2024-09-07 20:56:42.196785', '2024-09-07 20:56:42.196785', '9d66ac93-3a48-429d-aeaa-54302856e204', '5ab252b3-204d-4846-80e8-a7629f2d2e25');
INSERT INTO public.exercise_examples_equipments VALUES ('c0f5558e-4650-4dd1-8d33-564b1e915f72', '2024-09-07 21:00:33.469294', '2024-09-07 21:00:33.469294', '623e0be7-870a-4bca-b053-76e99c9ea7e0', '7b006564-2c61-4661-ab8c-d4cf60fdb3ed');
INSERT INTO public.exercise_examples_equipments VALUES ('dc25e6ce-b255-4dda-821d-717c0631410b', '2024-09-07 21:02:58.937636', '2024-09-07 21:02:58.937636', '623e0be7-870a-4bca-b053-76e99c9ea7e0', '1e51b837-215d-4069-9d14-c9510c1b1b61');
INSERT INTO public.exercise_examples_equipments VALUES ('6c1c9b03-ace2-45d8-81d8-e6d3bf207549', '2024-09-08 11:38:55.97306', '2024-09-08 11:38:55.97306', '623e0be7-870a-4bca-b053-76e99c9ea7e0', '4ef87c39-b004-4c4c-82a8-ddd0338de8c8');
INSERT INTO public.exercise_examples_equipments VALUES ('eb6546ae-ea12-4dfa-857b-de4bbe4e65ca', '2024-09-08 11:42:23.523464', '2024-09-08 11:42:23.523464', '1959d942-75fb-4ece-b501-b7cf8884d479', 'ea89fe55-c50f-4bbf-acc1-96e7df46101a');
INSERT INTO public.exercise_examples_equipments VALUES ('00d40c39-b402-4f76-a21c-d17c60ddc429', '2024-09-08 11:47:42.824531', '2024-09-08 11:47:42.824531', '1959d942-75fb-4ece-b501-b7cf8884d479', '395bb56a-d4af-4f4a-abb3-51a9ef1dc686');
INSERT INTO public.exercise_examples_equipments VALUES ('b0be49fb-d604-4dbe-8e31-0ac1b30bd780', '2024-09-08 11:48:44.510721', '2024-09-08 11:48:44.510721', '20e225dd-68d7-409b-9b7d-5ef6d4224d02', 'a40b23bf-bd6d-41d0-adbe-254bce002c2d');
INSERT INTO public.exercise_examples_equipments VALUES ('ee35ea63-3dc3-41bd-bc8c-10198b13fe19', '2024-09-08 11:51:56.651231', '2024-09-08 11:51:56.651231', 'b17ae8af-2d78-4e77-b45b-39253c28247a', 'a4bf88ee-8865-4b1f-88a3-28cf59d28739');
INSERT INTO public.exercise_examples_equipments VALUES ('6ff7a64c-3387-4add-8da7-4bb1c283c88b', '2024-09-08 11:51:56.651231', '2024-09-08 11:51:56.651231', 'a025ec57-670e-45ea-962e-9c9430786666', 'a4bf88ee-8865-4b1f-88a3-28cf59d28739');
INSERT INTO public.exercise_examples_equipments VALUES ('476e08af-6936-4cfc-9a35-abbc1b76ef0c', '2024-09-08 11:54:36.184609', '2024-09-08 11:54:36.184609', '623e0be7-870a-4bca-b053-76e99c9ea7e0', '9572d666-227a-4639-9ea3-defd67123fbc');
INSERT INTO public.exercise_examples_equipments VALUES ('4f31706f-2ff2-4d48-bdc8-ea7a7401e734', '2024-09-08 11:56:12.857504', '2024-09-08 11:56:12.857504', '9d66ac93-3a48-429d-aeaa-54302856e204', '21d5ce50-6ffa-44d9-869f-abcfeb518018');


--
-- Data for Name: exercise_examples_tutorials; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.exercise_examples_tutorials VALUES ('0a7a066f-3204-4610-8fd2-85c353db0bf5', '2024-08-23 13:51:17.120552', '6cb225d2-be00-461d-9bf0-7f0c87cfea0b', '2024-08-23 13:51:17.120552', 'Tutorial Straight Bar Tricep Extension', 'https://www.youtube.com/watch?v=mpZ9VRisAyw', 'en', 'https://www.muscleandstrength.com', 'youtube_video');
INSERT INTO public.exercise_examples_tutorials VALUES ('60491dcd-c34d-494b-855b-7d574c7c2c0c', '2024-08-23 14:29:51.296687', 'b790c6a6-ecd1-4b3a-afbc-22cd82e55658', '2024-08-23 14:29:51.296687', 'Straight Bar Tricep Extension', 'https://www.youtube.com/watch?v=mpZ9VRisAyw', 'en', NULL, 'youtube_video');
INSERT INTO public.exercise_examples_tutorials VALUES ('c33f6813-abc9-41cb-bb27-cff2db6f24e7', '2024-08-23 14:41:48.931538', '4d3a89ab-70ae-4311-8b40-a058b2f3057b', '2024-08-23 14:41:48.931538', 'Seated Overhead Dumbbell Tricep Extension


', 'https://www.youtube.com/watch?v=LlCFtWCQc5s', 'en', NULL, 'youtube_video');
INSERT INTO public.exercise_examples_tutorials VALUES ('c0dbd0ad-661d-4ced-a393-183e6f058753', '2024-08-23 14:53:43.932664', '0e2fe1e8-f8f1-48e6-b360-8c9d4d9991a6', '2024-08-23 14:53:43.932664', 'Rope Tricep Extension


', 'https://www.youtube.com/watch?v=LzwgB15UdO8', 'en', NULL, 'youtube_video');
INSERT INTO public.exercise_examples_tutorials VALUES ('460c09cc-8701-45ad-9491-8588b6e0f3e0', '2024-08-23 15:30:18.909949', 'ab0d7384-444e-446a-911d-f64ac31db8ef', '2024-08-23 15:30:18.909949', 'Bench Press (Close Grip)


', 'https://www.youtube.com/watch?v=j-NhORwJDb4', 'en', NULL, 'youtube_video');
INSERT INTO public.exercise_examples_tutorials VALUES ('90d26987-58eb-4756-8a5c-cf76f791a849', '2024-08-23 15:44:41.345481', '650e9725-d36c-4688-bcab-adf93dfe9e5d', '2024-08-23 15:44:41.345481', 'EZ Bar Skullcrusher


', 'https://www.youtube.com/watch?v=K6MSN4hCDM4', 'en', NULL, 'youtube_video');
INSERT INTO public.exercise_examples_tutorials VALUES ('a5bbf4db-4be8-482b-b77f-52d3cb3c3bb7', '2024-08-23 15:50:27.665106', '3b828d2f-797f-4a45-9d1d-1d3efe38fb54', '2024-08-23 15:50:27.665106', 'Dip (Weighted)


', 'https://www.youtube.com/watch?v=ZQnPQG5d67E', 'en', NULL, 'youtube_video');
INSERT INTO public.exercise_examples_tutorials VALUES ('8dc32419-56a2-44c0-9d39-898d48394a9d', '2024-08-23 20:29:25.204889', '7517ae2f-c198-4a33-8a1d-1dc7327d1430', '2024-08-23 20:29:25.204889', 'Instruction', 'https://www.muscleandstrength.com/exercises/ez-bar-back-of-the-head-lying-tricep-extension.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('d646bbfa-cf3e-411c-92e5-daaa4568d474', '2024-08-23 20:36:43.368496', '4aafe702-f2fc-4fa2-a7fb-c31c279adeda', '2024-08-23 20:36:43.368496', 'Instruction', 'https://www.muscleandstrength.com/exercises/ez-bar-back-of-the-head-lying-tricep-extension.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('96fb5621-dc90-464a-961b-eba8f93074e9', '2024-08-24 13:49:36.279978', 'faf6674c-2a2a-4b03-ab8b-7a033052b572', '2024-08-24 13:49:36.279978', 'Instruction', 'https://www.muscleandstrength.com/exercises/alternate-bent-over-dumbbell-kickback.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('47c395ce-d0ba-4e8a-ae57-9e0d28f42752', '2024-08-24 13:55:14.363423', '93e6b1c4-0510-41d4-983c-a1fde003881f', '2024-08-24 13:55:14.363423', 'Instruction', 'https://www.youtube.com/watch?v=fP12p0k2YL8', 'en', NULL, 'youtube_video');
INSERT INTO public.exercise_examples_tutorials VALUES ('95cf2e06-cafd-4753-b995-1c6acb5baa7e', '2024-08-24 15:00:28.288128', '0eaa8980-e29e-4f33-88b0-915db5cf309a', '2024-08-24 15:00:28.288128', 'Instruction', 'https://www.muscleandstrength.com/exercises/alternate-lying-dumbbell-extension.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('9e563b8f-55d2-441f-8533-3534ba2d3d86', '2024-08-24 15:05:24.082217', '9f0c8916-a08b-4fe5-9f24-e1680ef627a8', '2024-08-24 15:05:24.082217', 'Instruction', 'https://www.muscleandstrength.com/exercises/tricep-bench-dip.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('820512e8-f42e-46e9-99af-a7270c126966', '2024-08-24 15:14:04.512657', '547f1f7e-3ee1-4b39-99eb-3462b1ec13af', '2024-08-24 15:14:04.512657', 'Instruction', 'https://www.youtube.com/watch?v=BL9CzOQZDrs', 'en', NULL, 'youtube_video');
INSERT INTO public.exercise_examples_tutorials VALUES ('7175c8f6-a736-44af-96f2-261b90f5755f', '2024-08-24 15:21:25.334711', '275097d4-3c8d-4040-9b2e-5f294919df04', '2024-08-24 15:21:25.334711', 'Instruction', 'https://www.muscleandstrength.com/exercises/cable-concentration-tricep-extension.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('6bceba7d-538e-40e6-974d-6b7d8e58ad6c', '2024-08-26 14:10:38.433204', '5985d847-0473-444e-8fe0-9da5341ef986', '2024-08-26 14:10:38.433204', 'Instruction', 'https://www.youtube.com/watch?v=KYGarkmUqvk', 'en', NULL, 'youtube_video');
INSERT INTO public.exercise_examples_tutorials VALUES ('809e8e23-1a2f-4c49-bcea-11149138ecac', '2024-08-26 14:15:00.653682', '11644e17-247a-46b0-a391-b3b2a2a6bba8', '2024-08-26 14:15:00.653682', 'Instruction', 'https://www.muscleandstrength.com/exercises/cable-tricep-kickback.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('4b9617f2-1455-4bdd-9257-3e6754b56839', '2024-08-26 14:21:24.531486', '50774526-c91f-4d71-82a8-456526b0fbd0', '2024-08-26 14:21:24.531486', 'Instruction', 'https://www.youtube.com/watch?v=iYd36-rreNU', 'en', NULL, 'youtube_video');
INSERT INTO public.exercise_examples_tutorials VALUES ('35cbbf52-bdd8-4be6-8580-997d48ac4f93', '2024-08-26 14:31:15.942235', '385fb192-7c2c-405a-b483-f36e32e241c8', '2024-08-26 14:31:15.942235', 'Instruction', 'https://www.muscleandstrength.com/exercises/close-grip-chest-press.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('0bd88f33-fdd3-4017-bc2b-b4d1d1b44ec1', '2024-08-26 14:36:25.659867', 'c21d3b0f-c8a8-4b7f-92ea-90dc567a1183', '2024-08-26 14:36:25.659867', 'Instruction', 'https://www.youtube.com/watch?v=LduzOtuJ3uA', 'en', NULL, 'youtube_video');
INSERT INTO public.exercise_examples_tutorials VALUES ('6f274c78-173c-4a0c-9c6d-1e972067562e', '2024-08-26 14:39:55.647713', '04d275d8-71df-4695-ace9-899ce6e41b29', '2024-08-26 14:39:55.647713', 'Instruction', 'https://www.youtube.com/watch?v=LlCFtWCQc5s', 'en', NULL, 'youtube_video');
INSERT INTO public.exercise_examples_tutorials VALUES ('ea1fcb81-1b7d-466c-b337-de877bfe7d94', '2024-08-26 14:46:34.099504', '1b4402c2-2459-45c1-8d24-356322c71d20', '2024-08-26 14:46:34.099504', 'Instruction', 'https://www.youtube.com/watch?v=VjmgzEmODnI', 'en', NULL, 'youtube_video');
INSERT INTO public.exercise_examples_tutorials VALUES ('309552c9-6af5-419d-9226-d837c7979399', '2024-08-26 14:52:11.262224', '4f9bdd10-28bc-447e-8cf5-fbf47cd9af79', '2024-08-26 14:52:11.262224', 'Instruction', 'https://www.muscleandstrength.com/exercises/french-press.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('c1f7ad6f-b0eb-4a8e-9c1d-fb77559baac1', '2024-08-26 15:16:20.211697', '6a312bde-cc33-450b-8f1d-6091ccffe9cc', '2024-08-26 15:16:20.211697', 'Instruction', 'https://www.youtube.com/watch?v=mNDpEivaal8', 'en', NULL, 'youtube_video');
INSERT INTO public.exercise_examples_tutorials VALUES ('6aa84096-0208-4f8c-9170-6eb2e5f92ab7', '2024-08-26 15:20:51.099335', '21e7460d-aa00-448b-8c82-994a73e0164c', '2024-08-26 15:20:51.099335', 'Instruction', 'https://www.youtube.com/watch?v=0BsOmGkxMCI', 'en', NULL, 'youtube_video');
INSERT INTO public.exercise_examples_tutorials VALUES ('4a7f64f5-82bc-45ba-90bc-3321d7853277', '2024-08-27 16:05:55.002649', 'ee8cc366-d33b-45a6-84b0-4ab416585ad1', '2024-08-27 16:05:55.002649', 'Instruction', 'https://www.muscleandstrength.com/exercises/close-grip-press-behind-neck.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('7de73397-fec6-48e7-ad84-f183e1960f69', '2024-08-27 17:08:58.78312', '490df80e-d34c-42cf-bfe5-c27ddd2cd734', '2024-08-27 17:08:58.78312', 'Instruction', 'https://www.muscleandstrength.com/exercises/decline-lying-dumbbell-extension.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('e9fd4344-6cc6-44fb-92c7-ad815b44a660', '2024-08-27 17:14:24.435235', 'e21344ff-b825-4a99-bf8b-a778bf1964d1', '2024-08-27 17:14:24.435235', 'Instruction', 'https://www.muscleandstrength.com/exercises/decline-close-grip-bench-press.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('a40473a0-96e0-4732-b8f0-4dc64dc35781', '2024-08-27 17:17:13.868725', 'd6743870-0d5a-4180-9671-181b8f65e03e', '2024-08-27 17:17:13.868725', 'Instruction', 'https://www.muscleandstrength.com/exercises/decline-lying-tricep-extension-skullcrusher.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('bf41d941-f0ad-4821-b5f0-d75040fc1170', '2024-08-27 17:37:27.262147', '855bd9e5-3546-4cfd-b048-e8017f01bfeb', '2024-08-27 17:37:27.262147', 'Instruction', 'https://www.muscleandstrength.com/exercises/tricep-kickback.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('2165daa5-a0a0-4a0e-a364-df6e6564bc77', '2024-08-27 17:40:04.044618', '53defdc5-bfec-4af4-bfba-60440e3493cc', '2024-08-27 17:40:04.044618', 'Instruction', 'https://www.muscleandstrength.com/exercises/ez-bar-incline-skullcrusher.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('51293886-f321-47fc-a1a3-b71cee4a67f7', '2024-08-27 17:41:21.163974', '748e0a60-9429-4a9d-8a6b-3ba76a7fc4b2', '2024-08-27 17:41:21.163974', 'Instruction', 'https://www.muscleandstrength.com/exercises/overhead-tricep-extension.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('95111d60-4fc0-4cc4-8162-ac50d32b0629', '2024-08-27 17:44:25.499546', 'a90f4822-63c5-42b9-943c-ff0ceacad1eb', '2024-08-27 17:44:25.499546', 'Instruction', 'https://www.muscleandstrength.com/exercises/high-pulley-overhead-tricep-extension.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('cab82808-aaa4-477b-b746-2a64f1d5465e', '2024-08-27 19:58:20.505585', 'ddc2e877-7197-42fa-ae1e-59706d209774', '2024-08-27 19:58:20.505585', 'Instruction', 'https://www.muscleandstrength.com/exercises/standing-dumbbell-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('0b79c08d-185f-4cba-be67-447c3d2bca6e', '2024-08-27 20:02:25.72501', '8324ae75-08e9-48de-a00b-55d229085712', '2024-08-27 20:02:25.72501', 'Instruction', 'https://www.muscleandstrength.com/exercises/standing-hammer-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('27a001b1-ea70-42f8-b15a-4109dc6390f1', '2024-08-27 20:04:23.501329', 'bbfbcfe2-1f56-492e-afa6-75e595b84fde', '2024-08-27 20:04:23.501329', 'Instruction', 'https://www.muscleandstrength.com/exercises/standing-barbell-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('b3567c80-fa31-4ded-ad30-4f2d93a58f94', '2024-08-27 20:09:12.671498', '09386394-e4e1-4a6d-adce-d5f5a518485c', '2024-08-27 20:09:12.671498', 'Instruction', 'https://www.muscleandstrength.com/exercises/incline-dumbbell-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('73eb4400-1ca8-43f4-a1a7-7a0f4d0c0987', '2024-08-27 20:11:42.146264', 'cfb2d83a-b3dc-44e9-ab08-53f9269752d6', '2024-08-27 20:11:42.146264', 'Instruction', 'https://www.muscleandstrength.com/exercises/concentration-cur.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('4a28cb49-a9ac-4984-956c-3a808ed9e100', '2024-08-27 20:13:52.5284', '2522a61a-2190-43e9-ae52-ca6bb023815e', '2024-08-27 20:13:52.5284', 'Instruction', 'https://www.muscleandstrength.com/exercises/cable-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('5a5fee97-12d2-49d3-a5c7-44d5c18d4e60', '2024-08-27 20:15:21.134177', '9fc5ae4d-2868-4576-bb67-9c83663fc005', '2024-08-27 20:15:21.134177', 'Instruction', 'https://www.muscleandstrength.com/exercises/ez-bar-preacher-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('438050ee-234c-4749-9973-2b1e1395c2a3', '2024-08-27 20:17:28.436328', '89f423d0-315f-4d93-b346-dcb468a97045', '2024-08-27 20:17:28.436328', 'Instruction', 'https://www.muscleandstrength.com/exercises/zottman-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('8032afa2-ecdc-40ce-b74a-b4b81833109b', '2024-08-27 20:20:16.539538', '194fa2ee-7f92-4982-903e-3db80293d773', '2024-08-27 20:20:16.539538', 'Instruction', 'https://www.muscleandstrength.com/exercises/preacher-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('b4556a80-c740-400f-9416-5d51e8bd1a7c', '2024-08-27 20:24:43.768139', 'f2fb31f0-7f6b-42b6-9a79-c22453ac6a63', '2024-08-27 20:24:43.768139', 'Instruction', 'https://www.muscleandstrength.com/exercises/alternate-seated-dumbbell-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('1e463850-3679-4640-ac82-43b432cd4354', '2024-08-27 20:27:54.273105', '5e3c933f-7511-463e-88b1-a139c8276e69', '2024-08-27 20:27:54.273105', 'Instruction', 'https://www.muscleandstrength.com/exercises/hammer-curl-across-the-body.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('534c7357-af8c-4acc-9e8b-1957e1c7b391', '2024-08-27 20:29:12.679687', 'e7f390fd-7435-44e1-b354-c62073934c66', '2024-08-27 20:29:12.679687', 'Instruction', 'https://www.muscleandstrength.com/exercises/alternating-standing-dumbbell-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('062d002b-2520-4509-b564-f42680c2f112', '2024-08-28 20:36:41.167373', '7e0566c6-eefb-4992-a673-d19902933c26', '2024-08-28 20:36:41.167373', 'Instruction', 'https://www.muscleandstrength.com/exercises/rope-cable-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('a2ed2a18-dbf3-4511-8375-bcd29ad5c5f1', '2024-08-28 20:38:26.243951', '7fd82f79-1f5f-4bae-8f2d-b94ecae595d5', '2024-08-28 20:38:26.243951', 'Instruction', 'https://www.muscleandstrength.com/exercises/bicep-machine-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('2813175a-73ce-4878-8688-855e6b96f45b', '2024-08-28 20:40:22.184956', '908341ec-de1f-44bd-b84d-74ff8a7162a0', '2024-08-28 20:40:22.184956', 'Instruction', 'https://www.muscleandstrength.com/exercises/alternating-standing-dumbbell-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('93d89743-7f31-467e-9139-3a51287b90b8', '2024-08-28 20:42:25.599982', 'a2736a56-04b3-4437-835e-1e2dc8029c9e', '2024-08-28 20:42:25.599982', 'Instruction', 'https://www.muscleandstrength.com/exercises/spider-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('086c5202-03af-4ddd-b1b3-1489cd2f1092', '2024-08-28 20:44:17.631408', 'da809d98-950b-4ca0-a71b-c67d21fd66da', '2024-08-28 20:44:17.631408', 'Instruction', 'https://www.muscleandstrength.com/exercises/seated-dumbbell-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('54865527-573e-4886-b4fb-0423bb84a112', '2024-08-28 20:45:27.532554', '4de0744d-0a78-4052-aa1b-e5340959d9fe', '2024-08-28 20:45:27.532554', 'Instruction', 'https://www.muscleandstrength.com/exercises/standing-dumbbell-reverse-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('92eb9e05-1d0c-4c5c-b017-2173ebde679e', '2024-08-28 20:47:16.420991', 'd7abed66-3c4a-490b-91cc-8e714336f9fa', '2024-08-28 20:47:16.420991', 'Instruction', 'https://www.muscleandstrength.com/exercises/dumbbell-preacher-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('a0c4a3df-21f6-4b15-8e3f-f97a1a6988b4', '2024-08-28 20:48:17.224854', 'cfd086be-f452-4f1d-b0cc-3988d677a8b4', '2024-08-28 20:48:17.224854', 'Instruction', 'https://www.muscleandstrength.com/exercises/dumbbell-hammer-preacher-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('d91dab50-4010-4d77-a31f-426f9b6876e6', '2024-08-28 20:50:28.816209', '8508cffc-1df6-4db2-9447-3bafd74a1325', '2024-08-28 20:50:28.816209', 'Instruction', 'https://www.muscleandstrength.com/exercises/seated-hammer-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('88f8bd38-3aa9-4993-95b5-2c99a4513d6a', '2024-08-28 20:51:35.474625', '4f1c3655-21e7-4225-a39e-944774f59f76', '2024-08-28 20:51:35.474625', 'Instruction', 'https://www.muscleandstrength.com/exercises/wide-grip-standing-barbell-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('207c3f9e-7897-433b-a2d4-62c7babf9807', '2024-08-28 20:53:42.35421', '6d5dc164-3c35-4719-85f1-5c75558f0125', '2024-08-28 20:53:42.35421', 'Instruction', 'https://www.muscleandstrength.com/exercises/wide-grip-cable-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('3e1338c6-7035-4eff-9e35-e4c9fd2ec5c0', '2024-08-28 20:55:59.99147', 'cebf4622-c0a9-4759-a070-48c7556da67d', '2024-08-28 20:55:59.99147', 'Instruction', 'https://www.muscleandstrength.com/exercises/squatting-cable-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('7de9f083-5f63-414e-a55d-8d65fad04831', '2024-08-28 20:59:16.626936', '4d72c2f1-2c10-45a3-9f5e-1f04012c0681', '2024-08-28 20:59:16.626936', 'Instruction', 'https://www.muscleandstrength.com/exercises/alternate-incline-dumbbell-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('d861e407-cd88-4a1a-a309-f4cb6d79efe6', '2024-08-28 21:00:57.80593', 'af39600b-6fc5-435a-a5f8-a1d0a9994030', '2024-08-28 21:00:57.80593', 'Instruction', 'https://www.muscleandstrength.com/exercises/incline-bench-dumbbell-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('566cfa52-4b88-4cf2-9d3e-97a49b5d6f90', '2024-08-28 21:02:48.226469', '101f365e-5c84-438a-84b4-c8e798bd0aff', '2024-08-28 21:02:48.226469', 'Instruction', 'https://www.muscleandstrength.com/exercises/incline-bench-hammer-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('b417033b-7404-41d7-8120-535014e906b0', '2024-08-28 21:04:44.332303', '1f28edb2-29ae-467c-ad11-310c3f656fe2', '2024-08-28 21:04:44.332303', 'Instruction', 'https://www.muscleandstrength.com/exercises/alternate-seated-hammer-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('b71af520-afaf-4129-8064-fab15b6fe00e', '2024-08-28 21:07:18.66717', '04a13a1c-de2b-46f4-be62-3fa6b4655d0d', '2024-08-28 21:07:18.66717', 'Instruction', 'https://www.muscleandstrength.com/exercises/barbell-concentration-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('2e8c2616-d762-47f4-b699-1e8b66d5ee22', '2024-08-28 21:08:56.511181', 'a9545ccb-3ec7-4646-95c9-f3a708d0d968', '2024-08-28 21:08:56.511181', 'Instruction', 'https://www.muscleandstrength.com/exercises/two-arm-cable-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('99a6d50e-24c8-4a9e-b1b2-d8f2095bc699', '2024-08-28 21:11:35.05554', 'b99df7e8-eb44-4be1-be81-701347580781', '2024-08-28 21:11:35.05554', 'Instruction', 'https://www.muscleandstrength.com/exercises/lying-barbell-curl-on-incline-bench.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('c724a5ad-bced-490b-8d84-3d21afce1e99', '2024-08-28 21:12:39.522477', '8d2a9df4-af32-4943-b74b-ae901e866b32', '2024-08-28 21:12:39.522477', 'Instruction', 'https://www.muscleandstrength.com/exercises/close-grip-ez-bar-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('8c5b611e-f0c3-44c6-b9e6-6f6f22f6fff3', '2024-08-28 21:13:34.093099', '8ca7bf65-0ddb-4c64-ba64-f71f25c85d7c', '2024-08-28 21:13:34.093099', 'Instruction', 'https://www.muscleandstrength.com/exercises/wide-grip-ez-bar-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('700767d7-3653-4b86-8a5c-055c7e6b8939', '2024-08-29 15:15:51.748742', '12221e5c-0208-48fc-8c56-62c266932f74', '2024-08-29 15:15:51.748742', 'Instruction', 'https://www.muscleandstrength.com/exercises/dumbbell-lateral-raise.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('bc2b63b6-6d93-4268-9ca2-5152fe9e18ce', '2024-08-29 15:18:06.560396', '1959abd3-4ab1-42d4-b7e2-45693b899d51', '2024-08-29 15:18:06.560396', 'Instruction', 'https://www.muscleandstrength.com/exercises/military-press.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('df44e89b-067c-4c6f-8e5a-2f89e5f4c147', '2024-08-29 15:20:32.35161', '48191b99-06fa-4218-b61b-c9b9abd73278', '2024-08-29 15:20:32.35161', 'Instruction', 'https://www.muscleandstrength.com/exercises/seated-dumbbell-press.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('37c26228-ad3a-4c15-aeeb-d1deaf8e2760', '2024-08-29 15:21:42.175515', '92d77415-1f9a-430b-ba52-0a09ec07b3a1', '2024-08-29 15:21:42.175515', 'Instruction', 'https://www.muscleandstrength.com/exercises/standing-dumbbell-press.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('eac64ab8-63b2-4f2f-a6e1-8d4c7d1efea9', '2024-08-29 15:23:10.354831', '816440ad-f8f2-4ef7-a11f-b6a2bd63fcef', '2024-08-29 15:23:10.354831', 'Instruction', 'https://www.muscleandstrength.com/exercises/bent-over-dumbbell-reverse-fly.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('4c396eb9-f737-4365-bbf1-827f44d17578', '2024-08-29 15:24:22.354872', '506d1cc7-529a-42af-b5bf-4c4d0a9aa409', '2024-08-29 15:24:22.354872', 'Instruction', 'https://www.muscleandstrength.com/exercises/smith-machine-shoulder-press.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('9e882e14-cf5d-452f-9c43-c9215088f6a6', '2024-08-29 15:26:45.200647', '9ab8fe00-58de-48c4-942d-b10e8d16f1c1', '2024-08-29 15:26:45.200647', 'Instruction', 'https://www.muscleandstrength.com/exercises/seated-arnold-press.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('cb933468-f577-4d7b-a522-5e75cad2e082', '2024-08-29 15:28:20.99358', '3d6e76b5-b409-4f5b-bba4-c22cb10cfbd4', '2024-08-29 15:28:20.99358', 'Instruction', 'https://www.muscleandstrength.com/exercises/dumbbell-reverse-fly.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('b4dbebd0-6e0f-4724-aee9-8ba920f32f7a', '2024-08-29 15:30:57.613763', '77aa5752-a586-4dfe-b69d-4da16fff0b79', '2024-08-29 15:30:57.613763', 'Instruction', 'https://www.muscleandstrength.com/exercises/seated-dumbbell-lateral-raise.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('0c2553fb-24c1-4080-a0a1-de15b951afe5', '2024-08-29 15:34:32.581279', '4035dfef-3cc6-4a15-a97f-c167bd274d02', '2024-08-29 15:34:32.581279', 'Instruction', 'https://www.muscleandstrength.com/exercises/seated-shoulder-press.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('3d9b5f36-ebf9-411c-9993-d8631941805e', '2024-08-29 20:14:43.152232', 'aada0f37-1f30-4d61-a284-8003027bc871', '2024-08-29 20:14:43.152232', 'Instruction', 'https://www.muscleandstrength.com/exercises/cable-face-pull', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('33b3c57a-1d97-4deb-a378-0f90df0305dc', '2024-08-29 20:16:07.209522', 'afd7f719-5789-48a0-a5d9-77e9cb1669bb', '2024-08-29 20:16:07.209522', 'Instruction', 'https://www.muscleandstrength.com/exercises/standing-cable-flys.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('89209fa2-dc4a-436d-8f93-a7e758943ad4', '2024-08-29 20:17:41.647658', '16ba69dc-e99d-4a71-bbcb-0f3ce096a9d9', '2024-08-29 20:17:41.647658', 'Instruction', 'https://www.muscleandstrength.com/exercises/machine-shoulder-press', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('985789eb-ea87-4683-850c-fcc21ee8d30a', '2024-08-29 20:18:52.146299', '3a70ce9c-b1f0-43a7-8775-7d3e7c109c5d', '2024-08-29 20:18:52.146299', 'Instruction', 'https://www.muscleandstrength.com/exercises/machine-reverse-fly', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('361dfc42-797d-4bad-b031-c6ebaee7a250', '2024-08-29 20:20:58.546255', '4353173b-93b2-4fb1-b462-fc8330b15ce5', '2024-08-29 20:20:58.546255', 'Instruction', 'https://www.muscleandstrength.com/exercises/two-arm-cable-lateral-raise.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('11886edc-a99d-42fe-92b5-af177e0871a0', '2024-08-29 20:26:45.613024', '1b8fe6fc-9ede-4f28-b4a0-30504db61fed', '2024-08-29 20:26:45.613024', 'Instruction', 'https://www.muscleandstrength.com/exercises/one-arm-cable-lateral-raise.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('5e7f8f5d-66bb-4dfc-9439-edc59aca8e17', '2024-08-29 20:28:36.106864', '90b8d661-a9ef-47e5-8c98-b0599874a972', '2024-08-29 20:28:36.106864', 'Instruction', 'https://www.muscleandstrength.com/exercises/seated-barbell-press-behind-neck.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('35de8743-24f5-42ee-a9b0-9f683fa0dc93', '2024-08-29 20:31:23.040025', 'ac45c513-55f3-437f-a10f-ba3c0763a746', '2024-08-29 20:31:23.040025', 'Instruction', 'https://www.muscleandstrength.com/exercises/dumbbell-front-raise.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('693d5eb9-4412-4074-94df-3ed7e2419213', '2024-08-29 20:34:53.760936', '3a41edcb-2c19-4d06-9585-8fe745aba723', '2024-08-29 20:34:53.760936', 'Instruction', 'https://www.muscleandstrength.com/exercises/machine-lateral-raise.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('b8beb312-2939-4809-aec5-f09fad8057b4', '2024-08-29 20:37:21.073228', 'b8fa1238-0f58-4daa-ade8-0f8c6fa2d1b1', '2024-08-29 20:37:21.073228', 'Instruction', 'https://www.muscleandstrength.com/exercises/bent-over-rear-delt-fly-head-on-bench', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('f13b9116-341d-4508-bde6-f2cd2accc271', '2024-08-29 20:46:11.400277', 'ed5db0ac-4343-4e68-a884-d5f84e4020c1', '2024-08-29 20:46:11.400277', 'Instruction', 'https://www.muscleandstrength.com/exercises/bent-over-cable-rear-delt-fly', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('e7666271-2b3f-4f4b-9f1d-d066dc7904b6', '2024-08-29 20:48:13.1669', 'd20646b6-efd1-49fc-8ffa-180461aea5ab', '2024-08-29 20:48:13.1669', 'Instruction', 'https://www.muscleandstrength.com/exercises/smith-machine-upright-row.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('dd17b5b6-e6fc-4983-a3d7-b26353eaa8f7', '2024-08-29 20:49:40.190105', '1f8abb63-8024-46ca-ac1e-2574a839eed6', '2024-08-29 20:49:40.190105', 'Instruction', 'https://www.muscleandstrength.com/exercises/push-press', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('d87539f2-d946-4e2a-aad0-7d9d62d7d453', '2024-08-29 20:52:10.220788', 'b22e5ada-86c1-4104-828b-b7e06a7f5d16', '2024-08-29 20:52:10.220788', 'Instruction', 'https://www.muscleandstrength.com/exercises/seated-palms-in-dumbbell-press.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('13149a05-c177-4345-bfdb-f896a9afddbd', '2024-08-29 20:55:27.364256', '7a933584-128c-4b82-8e5b-5e7312cadfdf', '2024-08-29 20:55:27.364256', 'Instruction', 'https://www.muscleandstrength.com/exercises/one-arm-cable-front-raise.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('a0a31a37-35a3-4131-9eb1-1eba4af6f12c', '2024-08-29 20:58:25.082319', '984e5dac-f3a8-4980-bfc9-da370cf45e46', '2024-08-29 20:58:25.082319', 'Instruction', 'https://www.muscleandstrength.com/exercises/dumbbell-reverse-fly-on-incline-bench.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('07d80744-6325-4258-9a9f-fd3b5efc98af', '2024-08-29 21:01:10.956917', 'ff188494-a871-4721-9d1e-26742539080c', '2024-08-29 21:01:10.956917', 'Instruction', 'https://www.muscleandstrength.com/exercises/cable-front-raise.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('ed29c229-bac4-466a-b9e2-021040b2d112', '2024-08-29 21:09:08.329319', '68381c41-b015-4218-93cb-2bcb64bee255', '2024-08-29 21:09:08.329319', 'Instruction', 'https://www.muscleandstrength.com/exercises/one-arm-standing-dumbbell-front-raise.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('e660c465-a467-4889-905c-41e8587846c8', '2024-08-31 21:55:50.631673', '1fdffa53-d9cb-4aa1-9999-5c83fdb9be80', '2024-08-31 21:55:50.631673', 'Instruction', 'https://www.muscleandstrength.com/exercises/hip-abduction-machine.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('b1a1b9cd-8366-40d9-ad17-0084001e9c99', '2024-08-31 22:01:53.348285', 'a8f9abc7-4515-4f5e-a4f5-095b1b17b9e1', '2024-08-31 22:01:53.348285', 'Instruction', 'https://www.muscleandstrength.com/exercises/hip-adduction-machine.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('da9c5a8e-c292-4b30-a6e7-c6fa667b6dea', '2024-09-01 09:37:56.286411', 'e1361643-e92a-419b-8eb8-fe2a188016e0', '2024-09-01 09:37:56.286411', 'Cable Crunch Instructions', 'https://www.muscleandstrength.com/exercises/cable-crunch.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('97307d48-8193-4887-81fa-f2f94ae38fe1', '2024-09-01 12:11:44.144292', 'f2cf498f-d991-4b85-b08e-58c5f9ff563e', '2024-09-01 12:11:44.144292', 'Hanging Leg Raise Instructions', 'https://www.muscleandstrength.com/exercises/hanging-leg-raise.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('a35c2eaa-ca3e-4227-a533-7e237a2fd6f4', '2024-09-01 12:13:55.753377', '7e80becf-491c-4b48-a98a-a36fff26e29c', '2024-09-01 12:13:55.753377', 'Dumbbell Side Bends Instructions', 'https://www.muscleandstrength.com/exercises/dumbbell-side-bends.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('bcca2cbf-dfd1-4e8a-95ae-bfd61febf033', '2024-09-01 12:14:59.698088', '2f49a8e8-6f42-422c-aa6f-c23e215620e2', '2024-09-01 12:14:59.698088', 'Decline Sit-Up Instructions', 'https://www.muscleandstrength.com/exercises/decline-situp.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('2e8b65ca-3879-4200-aaac-52ff784c218c', '2024-09-01 12:24:23.221021', 'f2868e11-6e1d-4ce4-a1a8-eb0384a60b71', '2024-09-01 12:24:23.221021', 'Floor Crunch (Legs on Bench) Instructions', 'https://www.muscleandstrength.com/exercises/floor-crunch-legs-on-bench.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('8320cb3c-0d28-42ec-a4e7-14a21f5ac75c', '2024-09-01 12:25:43.182175', '38af9c0d-b19f-433d-bcda-0b974b5475cf', '2024-09-01 12:25:43.182175', 'Twisting Hanging Knee Raise Instructions', 'https://www.muscleandstrength.com/exercises/twisting-hanging-knee-raise.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('f8294893-d061-4f4a-8742-d8c4e30bdb45', '2024-09-01 12:26:49.240082', 'c5901a9a-580c-411b-85bd-2ec738123e14', '2024-09-01 12:26:49.240082', 'Hanging Knee Raise Instructions', 'https://www.muscleandstrength.com/exercises/hanging-knee-raise.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('8a988795-1281-4ae2-8c92-15a38cd4d736', '2024-09-01 12:41:05.660993', '6e4bc8b2-33ab-46da-9b79-9fff2266cd27', '2024-09-01 12:41:05.660993', 'Seated Calf Raise', 'https://www.muscleandstrength.com/exercises/seated-calf-raise.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('08f9c70b-61a1-401a-b4e4-d1d4e382caac', '2024-09-01 12:43:01.541438', '01dff88c-893b-4410-8d54-1e36013b9fdb', '2024-09-01 12:43:01.541438', 'Seated Dumbbell Calf Raise', 'https://www.muscleandstrength.com/exercises/seated-dumbbell-calf-raise.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('32b77a0b-bbe6-444f-ab45-9696dc6aeb0d', '2024-09-01 12:47:02.03533', 'd2f28afc-e84c-467c-90d9-c6c2cb63acbc', '2024-09-01 12:47:02.03533', '45 Degree Leg Press Calf Raise', 'https://www.muscleandstrength.com/exercises/45-degress-calf-press.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('34fde96e-74bb-4579-894b-af1dcee97f40', '2024-09-01 12:49:37.159057', 'de4e9652-b068-4558-9fd3-38d45e5aa0d9', '2024-09-01 12:49:37.159057', 'Toes In Seated Calf Raise', 'https://www.muscleandstrength.com/exercises/toes-in-seated-calf-raise.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('5e029193-33b0-4000-8505-d140ca6c1b1a', '2024-09-01 12:51:11.83489', '7227c8f6-cf65-4134-97de-d5e64cb5ff1b', '2024-09-01 12:51:11.83489', 'Toes Out 45 Degree Calf Raise', 'https://www.muscleandstrength.com/exercises/toes-out-45-degree-calf-raise.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('a19029d4-4989-43d5-9477-65c6a3303154', '2024-09-01 12:52:29.697143', '46b1efa3-a4f8-4492-a81c-9e48c650dd3d', '2024-09-01 12:52:29.697143', 'Toes In Smith Machine Calf Raise', 'https://www.muscleandstrength.com/exercises/toes-in-smith-machine-calf-raise.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('b55b93bc-5cf2-4276-8c9c-4ed7eb7385bb', '2024-09-01 12:54:31.278042', '89ffca84-73f0-4a69-871f-9d9c96521a05', '2024-09-01 12:54:31.278042', 'Toes Out Smith Machine Calf Raise', 'https://www.muscleandstrength.com/exercises/toes-out-smith-machine-calf-raise.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('96c0e0df-856f-41bb-958c-b03d16f270f3', '2024-09-01 12:56:50.70875', 'f11c8751-e5ca-413e-b30d-2b387ec14733', '2024-09-01 12:56:50.70875', 'Toes Out Seated Calf Raise', 'https://www.muscleandstrength.com/exercises/toes-out-seated-calf-raise.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('b6e3e346-ccb9-4e1c-b5c7-efa6f282d2d3', '2024-09-01 13:30:53.588865', '9e348a26-e5d0-4ee0-b3e6-fe58563ac698', '2024-09-01 13:30:53.588865', 'Hack Squat Calf Raise', 'https://www.muscleandstrength.com/exercises/hack-calf-raise.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('7bed0641-ef8c-4d6c-af05-515d90864d6b', '2024-09-02 14:01:43.632067', '548b3de6-0980-4795-ab86-763c20dbc325', '2024-09-02 14:01:43.632067', 'Instruction', 'https://www.muscleandstrength.com/exercises/dumbbell-bench-press.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('cdc0eff5-8069-4814-a371-11bcd247f2d4', '2024-09-02 14:03:25.466809', '47f00a63-05df-4db7-b2c7-68000c72be9b', '2024-09-02 14:03:25.466809', 'Instruction', 'https://www.muscleandstrength.com/exercises/incline-dumbbell-bench-press.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('7a446694-8f21-44a3-b98b-388913d3fd96', '2024-09-02 14:05:57.431081', 'c0a055b2-daf6-4ecc-b97b-cfedfce6a42a', '2024-09-02 14:05:57.431081', 'Instruction', 'https://www.muscleandstrength.com/exercises/dumbbell-pullover.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('7b5076b9-7cf1-433b-81b4-3b3603926eb3', '2024-09-02 14:06:48.398345', '2bc37dec-7b06-404c-af63-99bf3f60fb68', '2024-09-02 14:06:48.398345', 'Instruction', 'https://www.muscleandstrength.com/exercises/dumbbell-pullover.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('c407b92f-d30c-418a-aa27-e1b76f4ecb9e', '2024-09-02 14:08:08.36724', '3488eaaa-a999-43c5-acd6-b177b8a3df8a', '2024-09-02 14:08:08.36724', 'Instruction', 'https://www.muscleandstrength.com/exercises/dumbbell-flys.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('0ef86cf1-d308-4cd2-aad7-7b1ec8ada9cc', '2024-09-02 14:57:19.347608', 'b2e39ab6-118d-46bd-ad8c-8acf9864af6c', '2024-09-02 14:57:19.347608', 'Instruction', 'https://www.muscleandstrength.com/exercises/barbell-bench-press.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('8524a390-8bc8-4f9c-b278-892848dc6fa5', '2024-09-02 14:58:44.049164', '885918a3-5c64-4f15-982e-1b9a91cb3743', '2024-09-02 14:58:44.049164', 'Instruction', 'https://www.muscleandstrength.com/exercises/incline-bench-press.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('503741c4-b1ec-4b7c-adfc-5b5ccd1d473b', '2024-09-02 15:01:10.970324', '21370a0a-b01b-4e32-8f43-8648a54cd35c', '2024-09-02 15:01:10.970324', 'Instruction', 'https://www.muscleandstrength.com/exercises/pec-dec.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('c68f5795-a082-4dd2-91f7-3079af5ab1ab', '2024-09-02 15:03:16.619938', 'e1511aa4-1d34-4984-aa54-88f88029a96e', '2024-09-02 15:03:16.619938', 'Instruction', 'https://www.muscleandstrength.com/exercises/cable-crossovers-(mid-chest).html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('daa240ae-f1ae-470a-9b1a-52dc9006af2f', '2024-09-02 15:21:43.007883', 'fff561d6-3738-4360-a110-f93dcb3c8c10', '2024-09-02 15:21:43.007883', 'Instruction', 'https://www.muscleandstrength.com/exercises/hammer-strength-bench-press.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('f4480389-8b66-436d-845c-127e6a033dda', '2024-09-02 15:26:06.649902', 'db9ff44c-2e27-42df-8f6a-1b64429999e1', '2024-09-02 15:26:06.649902', 'Instruction', 'https://www.muscleandstrength.com/exercises/chest-dip.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('f0b80f06-92f1-405d-9088-fc0e1dc76e0c', '2024-09-02 20:16:40.210874', 'ec09f8c7-04cf-4219-8033-3dd17ea5c1d9', '2024-09-02 20:16:40.210874', 'Instruction', 'https://www.muscleandstrength.com/exercises/incline-dumbbell-flys.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('437f0d1a-c698-47a8-9940-7cd337faa496', '2024-09-02 20:18:44.760696', '9be8d3a0-574b-40dc-a42c-06ab42af7e66', '2024-09-02 20:18:44.760696', 'Instruction', 'https://www.muscleandstrength.com/exercises/close-grip-dumbbell-press.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('e51a852c-7a16-4654-80ba-6dfc52ca76f9', '2024-09-02 20:20:26.773369', '82890348-a566-4762-b9b4-f89e52534936', '2024-09-02 20:20:26.773369', 'Instruction', 'https://www.muscleandstrength.com/exercises/cable-crossovers-(upper-chest).html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('7b5be389-abe2-4f0f-a545-1c356e4a56e5', '2024-09-02 20:22:38.725844', '13fcd794-54fb-413f-8bbf-44353cd29869', '2024-09-02 20:22:38.725844', 'Instruction', 'https://www.muscleandstrength.com/exercises/cable-crossovers.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('0d47ebc1-e93e-4cb6-960c-50226df9df5e', '2024-09-02 20:26:26.28885', '3d0c8e76-37a9-4f4c-84fa-47a6a07aaacc', '2024-09-02 20:26:26.28885', 'Instruction', 'https://www.muscleandstrength.com/exercises/decline-bench-press.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('54825736-1433-4cb3-bd73-3532c4d9c632', '2024-09-02 20:27:53.795137', '8a39b1e7-986c-41e7-a0b9-44a4efb46360', '2024-09-02 20:27:53.795137', 'Instruction', 'https://www.muscleandstrength.com/exercises/reverse-dumbbell-bench-press.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('eac7e213-b1e3-42b0-8249-0916cfd3d1c9', '2024-09-02 20:29:17.39884', 'ff20bd08-57ae-465f-aa54-d1ba0f7862a9', '2024-09-02 20:29:17.39884', 'Instruction', 'https://www.muscleandstrength.com/exercises/push-up.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('402f35c9-8087-4853-9acb-0c84b86d7261', '2024-09-02 20:31:29.294488', '8a73b841-1d4e-4808-8ed7-58c4931e0e96', '2024-09-02 20:31:29.294488', 'Instruction', 'https://www.muscleandstrength.com/exercises/decline-dumbbell-bench-press.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('d01e0c1f-5769-47ff-b5a3-64e18577ef32', '2024-09-02 20:35:21.742918', 'b720265e-a3ce-48d3-8e8e-87e05c07b8a3', '2024-09-02 20:35:21.742918', 'Instruction', 'https://www.muscleandstrength.com/exercises/cable-lower-chest-raise.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('1b5f00d1-9ade-46c7-a534-c7393bd633cc', '2024-09-02 20:38:34.944544', 'f6dd98f1-ad1d-4ea2-ba97-9939ce0fc028', '2024-09-02 20:38:34.944544', 'Instruction', 'https://www.muscleandstrength.com/exercises/incline-smith-machine-bench-press.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('48aa41ae-0176-40be-9cec-b57e3316d597', '2024-09-02 20:40:09.550717', 'f467d244-5568-40f6-bd7a-b3bdcad82398', '2024-09-02 20:40:09.550717', 'Instruction', 'https://www.muscleandstrength.com/exercises/cable-crossovers-bent-over.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('40518276-fdc6-42d2-be2b-156b5d3ebc56', '2024-09-02 20:42:00.065021', '2780e6d9-a86f-4038-b96f-ef59f961cb4b', '2024-09-02 20:42:00.065021', 'Instruction', 'https://www.muscleandstrength.com/exercises/cable-chest-press.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('3f332d88-fe23-4615-b68e-4c2080bd6780', '2024-09-02 20:59:37.541714', 'e68781f2-7021-4907-af54-de18b80d181a', '2024-09-02 20:59:37.541714', 'Instruction', 'https://www.muscleandstrength.com/exercises/decline-push-up', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('6ec9823d-6a65-43d3-8d5d-12cf112e8ed7', '2024-09-02 21:01:10.577833', '5b7d739c-d130-466c-a5ac-9e8b318b77ad', '2024-09-02 21:01:10.577833', 'Instruction', 'https://www.muscleandstrength.com/exercises/smith-machine-bench-press.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('a06ee4f3-1da3-446b-b75d-e01e7b744f21', '2024-09-02 21:02:37.721748', '3edb750e-4725-4338-a079-d48dc8797917', '2024-09-02 21:02:37.721748', 'Instruction', 'https://www.muscleandstrength.com/exercises/decline-dumbbell-flys.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('f7830ef2-652a-4a80-a604-685ce29e614c', '2024-09-02 21:04:38.449135', 'ff2d84fc-ff6d-4637-8128-91c1495c98e8', '2024-09-02 21:04:38.449135', 'Instruction', 'https://www.muscleandstrength.com/exercises/incline-cable-flys.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('9884e610-5f1b-422c-9f1e-98d51a4554bc', '2024-09-02 21:07:15.415834', 'c2059aab-d7b5-4532-a8a7-ad15a4054b33', '2024-09-02 21:07:15.415834', 'Instruction', 'https://www.muscleandstrength.com/exercises/cable-crossovers-bent-over.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('030a1313-a915-43cb-add1-816005b0376e', '2024-09-02 21:09:41.752271', '118eab6d-cae9-4c0b-b8e6-57f3e5541f1a', '2024-09-02 21:09:41.752271', 'Instruction', 'https://www.muscleandstrength.com/exercises/flat-bench-cable-flys.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('9078c933-9f4a-4a65-b15e-00f9c84d09ab', '2024-09-02 21:11:10.395227', '9a4eec3b-3f0b-4b36-a2b5-0f544376cf78', '2024-09-02 21:11:10.395227', 'Instruction', 'https://www.muscleandstrength.com/exercises/decline-cable-chest-press', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('7c0985db-1e67-4e0d-b0ee-7d79acfe56aa', '2024-09-03 08:30:59.488319', '61a31a0d-a736-48b5-b03e-44aa1ad7f3eb', '2024-09-03 08:30:59.488319', 'Instruction', 'https://www.muscleandstrength.com/exercises/barbell-wrist-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('31e036e3-b756-40d8-8ddf-394161eb5384', '2024-09-03 08:32:01.610343', 'c5864272-ae27-4363-add6-7ead1b7b3379', '2024-09-03 08:32:01.610343', 'Instruction', 'https://www.muscleandstrength.com/exercises/reverse-barbell-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('78f23500-644d-4b11-a33e-08c382867413', '2024-09-03 08:33:21.464534', 'ddaf509f-3c99-437c-b872-a4651a91601f', '2024-09-03 08:33:21.464534', 'Instruction', 'https://www.muscleandstrength.com/exercises/standing-wrist-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('7ca6e591-72a7-4974-8333-b13453bbdc62', '2024-09-03 08:35:16.728008', 'd3f54e1c-6333-4a15-b09b-0264ec0b68fe', '2024-09-03 08:35:16.728008', 'Instruction', 'https://www.muscleandstrength.com/exercises/ez-bar-reverse-grip-barbell-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('21bf8527-f0f4-4b93-b05a-99b52fd1d760', '2024-09-03 08:56:48.847179', '414a1891-1a28-4dbe-84e3-a992c6e879bc', '2024-09-03 08:56:48.847179', 'Instruction', 'https://www.muscleandstrength.com/exercises/seated-neutral-dumbbell-wrist-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('667b5be3-a69b-44c9-9ae0-20b000a23d9b', '2024-09-03 09:26:50.109226', 'd59d340d-774d-4c81-8b3d-251175936221', '2024-09-03 09:26:50.109226', 'Instruction', 'https://www.muscleandstrength.com/exercises/reverse-barbell-wrist-curl-over-bench.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('353dc34d-44e9-4bd6-9680-28a59d66c7af', '2024-09-03 09:28:25.011359', '10870aab-3086-462e-a64e-14710e3fbffe', '2024-09-03 09:28:25.011359', 'Instruction', 'https://www.muscleandstrength.com/exercises/one-arm-seated-dumbbell-wrist-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('c40959f4-4172-4686-aab7-218efc45cf44', '2024-09-03 09:30:01.960574', 'bb9c756b-0c9e-4e87-826f-bb2cbd16d86b', '2024-09-03 09:30:01.960574', 'Instruction', 'https://www.muscleandstrength.com/exercises/dumbbell-wrist-curl-over-bench.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('f4914c40-a2e1-44f7-918a-38b695e3fba3', '2024-09-03 09:32:06.568621', '7545289f-f7c8-456b-98e9-f7b15600254c', '2024-09-03 09:32:06.568621', 'Instruction', 'https://www.muscleandstrength.com/exercises/reverse-dumbbell-wrist-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('402c459d-563f-46db-96ee-b8875da6639d', '2024-09-03 09:34:29.288533', 'b35c5710-3c80-4f48-8ee4-295e5a15999f', '2024-09-03 09:34:29.288533', 'Instruction', 'https://www.muscleandstrength.com/exercises/reverse-cable-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('f658fb8b-7c99-4b28-aa18-b88a7ae86d4e', '2024-09-03 09:37:05.571957', 'd7871e0c-5e1b-4ffd-a9ab-951028246a01', '2024-09-03 09:37:05.571957', 'Instruction', 'https://www.muscleandstrength.com/exercises/standing-cable-wrist-curl-(behind-back).html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('4abd5ff5-c70e-49f9-8284-2c090bf52340', '2024-09-03 09:38:26.940218', 'b53daf0a-c7b6-4be8-9230-b33695eb5340', '2024-09-03 09:38:26.940218', 'Instruction', 'https://www.muscleandstrength.com/exercises/reverse-barbell-wrist-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('b88e4ef6-d37a-45db-8a5c-ea543f1af0d6', '2024-09-03 09:39:30.856608', '60bd8dbc-6bb8-4be0-9ee7-f4c5a295c5b4', '2024-09-03 09:39:30.856608', 'Instruction', 'https://www.muscleandstrength.com/exercises/ez-bar-reverse-grip-preacher-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('bcdef34a-a724-42c7-a86a-a48ccfa34da5', '2024-09-03 09:42:04.652526', 'a2f8dd49-606e-4d86-ae04-8af61c0b40e9', '2024-09-03 09:42:04.652526', 'Instruction', 'https://www.muscleandstrength.com/exercises/reverse-grip-seated-cable-wrist-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('22a7f767-6c7b-4e68-ba2e-8ee2d99598ad', '2024-09-03 09:43:17.747097', 'b515dd55-701a-45f4-938f-fdb26d2d5cba', '2024-09-03 09:43:17.747097', 'Instruction', 'https://www.muscleandstrength.com/exercises/seated-cable-wrist-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('05d47948-76a3-41d5-a23d-cc2952235a91', '2024-09-03 09:44:32.027043', 'f5f03cc7-c2bc-4367-9042-107114d634ce', '2024-09-03 09:44:32.027043', 'Instruction', 'https://www.muscleandstrength.com/exercises/barbell-wrist-curl-over-bench.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('ac84ea6a-1f9c-42fd-bd42-708c37fdec3e', '2024-09-03 11:04:13.319787', '7d823dc8-8303-4ddd-a25d-935569c662b7', '2024-09-03 11:04:13.319787', 'Instruction', 'https://www.muscleandstrength.com/exercises/hyperextension.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('39d17f74-72b4-40dc-8f1f-0a503b4c0454', '2024-09-03 11:07:53.769212', '78b3c689-0222-46de-a7b3-9bd6c75b920c', '2024-09-03 11:07:53.769212', 'Instruction', 'https://www.muscleandstrength.com/exercises/barbell-hip-thrust', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('151154e0-c826-4a62-beed-71a76f46cf10', '2024-09-03 11:13:27.430368', 'b39cc5b5-8335-4918-a504-f9cdfb85ceba', '2024-09-03 11:13:27.430368', 'Instruction', 'https://www.muscleandstrength.com/exercises/good-mornings.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('563af0ca-8891-49eb-854e-9f0b9a292f7e', '2024-09-03 11:21:01.356587', 'd806b4f1-399c-4ceb-bb91-663ec0350e6d', '2024-09-03 11:21:01.356587', 'Instruction', 'https://www.muscleandstrength.com/exercises/reverse-hyperextension', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('350f62a0-ca98-4300-950b-70bc22993e26', '2024-09-05 12:48:41.945099', '3a39a222-7b4d-4e0e-9e7e-034d78b5d6bf', '2024-09-05 12:48:41.945099', 'Instruction', 'https://www.muscleandstrength.com/exercises/good-morning-off-pins', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('63e1e4cb-f1ee-4fce-a961-9f0286b9ef63', '2024-09-05 12:54:46.802364', 'be3c01a7-3bd0-448c-844b-583bd824c90b', '2024-09-05 12:54:46.802364', 'Instruction', 'https://www.muscleandstrength.com/exercises/dumbbell-stiff-leg-deadlift.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('2ae5b635-fe19-40c5-9890-cfe3ef9934cf', '2024-09-05 12:56:19.229593', '1dcd59ab-674e-49d8-9a06-9c17c2a05730', '2024-09-05 12:56:19.229593', 'Instruction', 'https://www.muscleandstrength.com/exercises/deadlifts.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('e27c1bbf-cd0a-4722-b4d8-a1ae6ab6bf0a', '2024-09-05 12:59:02.12284', '05b3842c-2a19-484e-bae3-a12e86c2fa4c', '2024-09-05 12:59:02.12284', 'Instruction', 'https://www.muscleandstrength.com/exercises/leg-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('07d4d036-d7f9-4b6b-988a-03186e1b4f39', '2024-09-05 13:05:01.308312', 'ad98534e-b2d9-4fef-9983-578ef12b28f7', '2024-09-05 13:05:01.308312', 'Instruction', 'https://www.muscleandstrength.com/exercises/stiff-leg-deadlift-aka-romanian-deadlift.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('99b7fe00-1db4-4bd1-8fde-f48d469f5d95', '2024-09-05 13:06:37.174133', 'b5c6e6a6-6eec-422c-ad4a-8dca82287312', '2024-09-05 13:06:37.174133', 'Instruction', 'https://www.muscleandstrength.com/exercises/romanian-deadlift', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('be552486-c4e2-41af-8074-57eab93a0fce', '2024-09-05 13:08:00.597113', '9b3f9b20-544d-49e1-880e-879e24e81581', '2024-09-05 13:08:00.597113', 'Instruction', 'https://www.muscleandstrength.com/exercises/dumbbell-hamstring-curl.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('cce83c61-bcff-402d-b4f6-5f6ca409b79c', '2024-09-05 13:10:41.502122', '12070323-971e-421a-9eaf-bdce4f8e0464', '2024-09-05 13:10:41.502122', 'Instruction', 'https://www.muscleandstrength.com/exercises/trap-bar-rack-pull', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('dc1af24a-1966-48b4-8bbf-52d4e37ce1c9', '2024-09-05 13:12:38.926408', '379d64cd-24bf-4a81-9b97-936c9a088e17', '2024-09-05 13:12:38.926408', 'Instruction', 'https://www.muscleandstrength.com/exercises/trap-bar-deadlift', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('497b1aa8-813b-4553-b5e2-96db82480a2f', '2024-09-05 13:33:56.33765', '04d3e242-807d-4cba-9be4-e3d11a8efbc4', '2024-09-05 13:33:56.33765', 'Instruction', 'https://www.muscleandstrength.com/exercises/reverse-hack-squat.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('57a107b0-0aeb-4052-b296-62713acbf9e6', '2024-09-05 13:37:08.633462', 'ca38bcba-658f-4c7a-be54-b2c3f845fbe0', '2024-09-05 13:37:08.633462', 'Instruction', 'https://www.muscleandstrength.com/exercises/sumo-deadlift', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('2b0b1b65-99a2-4b0d-96f3-be49e1e2599f', '2024-09-05 13:38:49.289078', 'f11ef4dd-cc6b-42ad-844d-0e94cef691f0', '2024-09-05 13:38:49.289078', 'Instruction', 'https://www.muscleandstrength.com/exercises/glute-ham-raise', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('73a88ce2-32c6-4c66-9ba2-3c9778fa2fe0', '2024-09-05 13:42:24.39072', '676f21e5-7b5a-4c11-a505-4545822673de', '2024-09-05 13:42:24.39072', 'Instruction', 'https://www.muscleandstrength.com/content/trap-bar-romanian-deadlift', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('4b37432a-eda0-4ff5-8686-90cd0ca5f042', '2024-09-05 13:44:20.972936', 'c18b086c-b0c3-4d1c-a6a3-2653e36c5dff', '2024-09-05 13:44:20.972936', 'Instruction', 'https://www.muscleandstrength.com/exercises/straight-leg-deadlift', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('48303f5a-0546-4e91-830f-c3d72fe7466a', '2024-09-05 13:49:52.445019', '6115df45-ddad-4fa6-bfb0-1c0cd72de766', '2024-09-05 13:49:52.445019', 'Instruction', 'https://www.muscleandstrength.com/exercises/smith-machine-stiff-leg-deadlift.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('155183e0-1366-4c24-8b7c-9056671f6183', '2024-09-06 11:10:17.4717', 'f4041256-a9ac-430d-b611-d8a957e2aeb0', '2024-09-06 11:10:17.4717', 'Instruction', 'https://www.muscleandstrength.com/exercises/straight-arm-lat-pull-down.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('ea6397ff-0415-4f3c-b307-edc2c78dc3b8', '2024-09-06 11:15:01.159584', '8e687b8b-0142-49f7-92e9-4d5df9aa86c9', '2024-09-06 11:15:01.159584', 'Instruction', 'https://www.muscleandstrength.com/exercises/wide-grip-pull-up.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('30398c2d-822e-486e-8d7f-1fac8a98873f', '2024-09-06 11:18:17.220443', '4a2c7160-6cf2-456d-8ef4-80040b720420', '2024-09-06 11:18:17.220443', 'Instruction', 'https://www.muscleandstrength.com/exercises/lat-pull-down.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('bf18868c-23d3-48bd-aa14-f6a652d64500', '2024-09-06 11:21:03.182583', '93c687ff-68f2-44d0-9f3a-8c4c15c960e8', '2024-09-06 11:21:03.182583', 'Instruction', 'https://www.muscleandstrength.com/exercises/close-grip-pull-down.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('a929a0ed-ba5f-40f4-9b61-bd3c36fbc4fa', '2024-09-06 21:19:43.244416', '738d7264-00af-48dd-a475-3c4d12e28188', '2024-09-06 21:19:43.244416', 'Instruction', 'https://www.muscleandstrength.com/exercises/chin-up.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('cae2380a-ad64-4934-9a8c-8a7221e77154', '2024-09-06 21:22:25.318272', 'e84c6031-9d71-41a1-ae2c-6c9901ea1d6b', '2024-09-06 21:22:25.318272', 'Instruction', 'https://www.muscleandstrength.com/exercises/wide-grip-pull-down', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('3ff09ba6-9431-43a1-ad9f-636f78aff52a', '2024-09-06 21:26:46.673999', 'bd3338ee-1841-4686-a98c-3493ab9cfa7e', '2024-09-06 21:26:46.673999', 'Instruction', 'https://www.muscleandstrength.com/exercises/reverse-grip-lat-pull-down.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('0fac8675-e30c-4439-a1e7-4ff57b369d42', '2024-09-06 21:28:12.860921', 'eaf575b3-2cb6-45a3-914f-81838c4c7e4d', '2024-09-06 21:28:12.860921', 'Instruction', 'https://www.muscleandstrength.com/exercises/rope-straight-arm-pull-down', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('ccb08fd7-ee63-4522-8ed0-8f8c0d561c37', '2024-09-06 21:31:44.444814', 'c25a5f07-d65f-4ba9-9b0d-cb4d5b426455', '2024-09-06 21:31:44.444814', 'Instruction', 'https://www.muscleandstrength.com/exercises/v-bar-pull-down', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('97776dc6-e2b0-493f-bbc8-acdae1a74b98', '2024-09-06 21:35:46.04486', '85a317d2-6cf2-4155-a6ea-a271afc4a803', '2024-09-06 21:35:46.04486', 'Instruction', 'https://www.muscleandstrength.com/exercises/behind-neck-lat-pull-down.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('74e04c6d-94ea-4cc4-b29d-55b0371a3900', '2024-09-07 14:58:48.660908', 'c1ca2c25-9148-4977-99fe-3acda0b4ad33', '2024-09-07 14:58:48.660908', 'Instruction', 'https://www.muscleandstrength.com/exercises/one-arm-dumbbell-row.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('0b0d5f8d-e7d1-4aae-9d5e-c358111bb4a5', '2024-09-07 15:00:25.362016', '950cd0cd-fc3b-442f-aba9-3c48bfc6cda9', '2024-09-07 15:00:25.362016', 'Instruction', 'https://www.muscleandstrength.com/exercises/bent-over-barbell-row.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('37500032-8a66-4b7d-b596-9aaf2d9761c8', '2024-09-07 15:02:06.013896', '9c029423-aa52-4b90-97c0-f5d4b4574f12', '2024-09-07 15:02:06.013896', 'Instruction', 'https://www.muscleandstrength.com/exercises/bent-over-dumbbell-row.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('2ab0b8cd-a66f-417a-a85a-a0ed30d91947', '2024-09-07 15:06:50.2758', 'baa3f656-0ad7-422b-ba8b-e5e9f5d4cd63', '2024-09-07 15:06:50.2758', 'Instruction', 'https://www.muscleandstrength.com/exercises/seated-row.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('3a4148a5-8ed1-4ae2-9cfb-42df071232d4', '2024-09-07 15:09:04.692592', '6389ce45-7d30-4372-8c29-e5816d893b1a', '2024-09-07 15:09:04.692592', 'Instruction', 'https://www.muscleandstrength.com/exercises/chest-supported-dumbbell-row', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('5a10d301-5eaf-48f3-8e45-c28930243492', '2024-09-07 15:12:48.581427', '31b8aa6a-448d-4e4c-bd1e-6386060b526e', '2024-09-07 15:12:48.581427', 'Instruction', 'https://www.muscleandstrength.com/exercises/tripod-dumbbell-row', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('1c57cbcc-74a4-4a2b-b167-600460b3b7c7', '2024-09-07 15:16:24.625328', '13826a3e-6b12-464c-95c8-5790f0e13947', '2024-09-07 15:16:24.625328', 'Instruction', 'https://www.muscleandstrength.com/exercises/reverse-grip-bent-over-dumbbell-row.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('b1bd8496-b587-42a0-8395-270fdfe59667', '2024-09-07 15:18:31.448857', '91f6781b-915e-4bb4-8d8c-e345aa66e42d', '2024-09-07 15:18:31.448857', 'Instruction', 'https://www.muscleandstrength.com/exercises/incline-bench-two-arm-dumbbell-row.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('3ab00bde-7875-41fc-9b56-f10a71ac4fe4', '2024-09-07 15:29:18.480169', 'cbb152c0-ba9c-47ea-a8a3-28ad88f56eb6', '2024-09-07 15:29:18.480169', 'Instruction', 'https://www.muscleandstrength.com/exercises/smith-machine-bent-over-row.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('4fcfb895-9207-4fdc-afa6-a8a1ac4700ba', '2024-09-07 19:52:35.877911', '0be1c49c-d742-4881-b014-360bc297af34', '2024-09-07 19:52:35.877911', 'Instruction', 'https://www.muscleandstrength.com/exercises/reverse-grip-bent-over-row.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('c4e60049-8b2c-4f35-9fdc-be4f78e6ae90', '2024-09-07 19:54:36.15692', '8cccb149-8553-494d-bcb5-ffa9b06e7c0f', '2024-09-07 19:54:36.15692', 'Instruction', 'https://www.muscleandstrength.com/exercises/pendlay-row', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('5d9d60e3-d8dd-44a7-b5a0-86e5ddcdc1f0', '2024-09-07 19:56:54.246375', '7470e789-9509-4e22-9078-67857074867d', '2024-09-07 19:56:54.246375', 'Instruction', 'https://www.muscleandstrength.com/exercises/one-arm-cable-row.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('a567a930-b84c-49f4-8eec-9f347c01d203', '2024-09-07 19:58:28.359222', '7976a83a-f4db-4cc5-9cac-7f16f2bc430f', '2024-09-07 19:58:28.359222', 'Instruction', 'https://www.muscleandstrength.com/exercises/seated-row-using-rope.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('5c50040c-50a8-4c09-8859-45947b5d43b1', '2024-09-07 20:02:52.956426', '6da53baf-d357-4392-927f-7da1bf7449dc', '2024-09-07 20:02:52.956426', 'Instruction', 'https://www.muscleandstrength.com/exercises/incline-bench-barbell-row.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('df32b1c3-2823-480d-897b-8b19ea2389b2', '2024-09-07 20:04:30.738677', '6bb0675d-eba0-496c-bd20-5fd11a4a0282', '2024-09-07 20:04:30.738677', 'Instruction', 'https://www.muscleandstrength.com/exercises/reverse-grip-incline-bench-barbell-row.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('5feea640-03fb-4722-980e-ba18d4fd6df0', '2024-09-07 20:10:41.93914', '5de5124e-8ebb-4477-b4b3-e1122cc80496', '2024-09-07 20:10:41.93914', 'Instruction', 'https://www.muscleandstrength.com/exercises/dumbbell-shrugs.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('fd434694-9e91-4131-b15f-b1eec934f978', '2024-09-07 20:15:00.959728', 'd180a698-a12e-4731-8234-b96e8f3ca7d9', '2024-09-07 20:15:00.959728', 'Instruction', 'https://www.muscleandstrength.com/exercises/upright-row.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('cad795b2-79fc-42d5-9fc2-f3b4ef7f7026', '2024-09-07 20:17:27.664032', '49ef1d62-a375-485a-84bd-289a5548e81b', '2024-09-07 20:17:27.664032', 'Instruction', 'https://www.muscleandstrength.com/exercises/barbell-shrug.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('979836f6-b65e-47a6-82ec-249f2bd672d6', '2024-09-07 20:18:56.632853', 'abe543c6-ec69-49ad-b9ca-ef959ffa10f2', '2024-09-07 20:18:56.632853', 'Instruction', 'https://www.muscleandstrength.com/exercises/seated-dumbbell-shrug.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('6dfd98b5-6b42-4fed-97d6-ae40180505e5', '2024-09-07 20:20:03.761387', 'cae7b841-a7f8-4973-baf0-4aadbbdcd0ca', '2024-09-07 20:20:03.761387', 'Instruction', 'https://www.muscleandstrength.com/exercises/smith-machine-shrug.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('16e131cf-7b6a-4330-b4ca-643e48190c4b', '2024-09-07 20:21:09.881221', 'ad76d69c-5e90-4643-b507-9e9226d8b5cd', '2024-09-07 20:21:09.881221', 'Instruction', 'https://www.muscleandstrength.com/exercises/trap-bar-shrug', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('155a2003-0abb-4e64-8b0f-8f05d83b15fb', '2024-09-07 20:22:58.478733', 'f451289a-6d35-4926-981d-8ebae71741a2', '2024-09-07 20:22:58.478733', 'Instruction', 'https://www.muscleandstrength.com/exercises/cable-shrug.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('caa89e00-f37b-4604-8491-b21dbfb4089e', '2024-09-07 20:24:09.690683', '98791e1d-6029-4cb2-bcaf-611a337208ef', '2024-09-07 20:24:09.690683', 'Instruction', 'https://www.muscleandstrength.com/exercises/cable-row-to-neck.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('f84db319-8ef3-4099-91a4-98c9b58fae6a', '2024-09-07 20:34:58.05813', '22df24eb-6bb7-45bc-ab46-9d6022eec774', '2024-09-07 20:34:58.05813', 'Instruction', 'https://www.muscleandstrength.com/exercises/squat.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('a2538f73-7b80-41d7-93a5-7b172a640b76', '2024-09-07 20:36:12.364896', '978f906a-8584-4cdf-9d7f-f96d60865e3b', '2024-09-07 20:36:12.364896', 'Instruction', 'https://www.muscleandstrength.com/exercises/dumbbell-squat.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('1c9a8bbf-5765-42ff-9129-719bfbfdf90c', '2024-09-07 20:38:40.706871', '4da455c2-c154-4da7-b9c5-6195bd137eec', '2024-09-07 20:38:40.706871', 'Instruction', 'https://www.muscleandstrength.com/exercises/dumbbell-goblet-squat', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('c8dc0bea-348a-4a40-a600-85ae9d1d0abf', '2024-09-07 20:40:09.764309', '945bdcdb-6aee-42df-a974-3fedc0b76846', '2024-09-07 20:40:09.764309', 'Instruction', 'https://www.muscleandstrength.com/exercises/dumbbell-goblet-squat', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('e065a6b4-f264-45d4-ac62-bb6d57ad92e7', '2024-09-07 20:41:37.07042', '64406a09-56a6-43da-9329-ff0fb0d83e4f', '2024-09-07 20:41:37.07042', 'Instruction', 'https://www.muscleandstrength.com/exercises/45-degree-leg-press.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('0a8274dc-6555-41d0-81de-da6d6140b7a9', '2024-09-07 20:42:37.471828', '10f8ff0e-38c6-465d-b99a-26c4026d22c6', '2024-09-07 20:42:37.471828', 'Instruction', 'https://www.muscleandstrength.com/exercises/leg-extension.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('95f0b935-3af5-48ce-9610-c7f817782b7f', '2024-09-07 20:44:02.303747', '88baf661-c550-4ecd-b15a-0d1ca4d41116', '2024-09-07 20:44:02.303747', 'Instruction', 'https://www.muscleandstrength.com/exercises/one-leg-dumbbell-squat-aka-bulgarian-squat.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('a91681a6-2cc7-4681-a965-41145a8a139a', '2024-09-07 20:50:37.247184', '4dc80274-2d3e-482e-a736-9f9399330c76', '2024-09-07 20:50:37.247184', 'Instruction', 'https://www.muscleandstrength.com/exercises/hack-squat.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('54ef6fa8-6618-4d10-b976-417f4b1e0dd3', '2024-09-07 20:51:46.786968', '14dbd276-30fe-4558-9cf0-104751b58f2d', '2024-09-07 20:51:46.786968', 'Instruction', 'https://www.muscleandstrength.com/exercises/dumbbell-rear-lunge.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('ae50fd08-3836-49d2-a820-e7d3bfe6ddff', '2024-09-07 20:53:13.286326', '2fd70951-2d44-407e-a7ee-daa94bf6af87', '2024-09-07 20:53:13.286326', 'Instruction', 'https://www.muscleandstrength.com/exercises/front-squat.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('3f4730d4-b1d7-4ebb-b65a-ef08c69867b5', '2024-09-07 20:54:24.89704', '24c43903-d3a7-4a39-9231-5bc7d5cec5da', '2024-09-07 20:54:24.89704', 'Instruction', 'https://www.muscleandstrength.com/exercises/dumbbell-split-squat', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('a31864d8-f215-4609-b7ba-c2f31fd88f45', '2024-09-07 20:55:27.324604', 'de763854-d06d-43e9-9973-f4ca8839201b', '2024-09-07 20:55:27.324604', 'Instruction', 'https://www.muscleandstrength.com/exercises/dumbbell-walking-lunge.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('6eea3002-623c-4cae-a8a0-4f3a50451163', '2024-09-07 20:56:42.203214', '5ab252b3-204d-4846-80e8-a7629f2d2e25', '2024-09-07 20:56:42.203214', 'Instruction', 'https://www.muscleandstrength.com/exercises/frog-squat.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('7df4db08-e2f9-47cd-90f7-092636a01820', '2024-09-07 21:00:33.474131', '7b006564-2c61-4661-ab8c-d4cf60fdb3ed', '2024-09-07 21:00:33.474131', 'Instruction', 'https://www.muscleandstrength.com/exercises/smith-machine-squat.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('b197ed83-429b-4818-b59e-561dc2043aea', '2024-09-07 21:02:58.942809', '1e51b837-215d-4069-9d14-c9510c1b1b61', '2024-09-07 21:02:58.942809', 'Instruction', 'https://www.muscleandstrength.com/exercises/smith-machine-lunge.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('7ecae356-990e-4e5d-a974-b68919abbdb9', '2024-09-08 11:38:55.980392', '4ef87c39-b004-4c4c-82a8-ddd0338de8c8', '2024-09-08 11:38:55.980392', 'Instruction', 'https://www.muscleandstrength.com/exercises/smith-machine-front-squat.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('e825890a-3f44-4dee-a2b3-40fc4fb15c34', '2024-09-08 11:42:23.52877', 'ea89fe55-c50f-4bbf-acc1-96e7df46101a', '2024-09-08 11:42:23.52877', 'Instruction', 'https://www.muscleandstrength.com/exercises/one-leg-45-degree-leg-press.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('7d365f96-6d98-424c-bc19-2630799844ac', '2024-09-08 11:47:42.832519', '395bb56a-d4af-4f4a-abb3-51a9ef1dc686', '2024-09-08 11:47:42.832519', 'Instruction', 'https://www.muscleandstrength.com/exercises/wide-stance-45-degree-leg-press.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('7248f4ab-d0b6-4871-8e13-0dc574923c80', '2024-09-08 11:48:44.520777', 'a40b23bf-bd6d-41d0-adbe-254bce002c2d', '2024-09-08 11:48:44.520777', 'Instruction', 'https://www.muscleandstrength.com/exercises/wide-hack-squat.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('b8ec332f-51b7-49b6-9734-007405dc79c2', '2024-09-08 11:51:56.658222', 'a4bf88ee-8865-4b1f-88a3-28cf59d28739', '2024-09-08 11:51:56.658222', 'Instruction', 'https://www.muscleandstrength.com/exercises/zerchers-squat.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('265cbbf2-e6c1-4858-a83e-e2560cbbba64', '2024-09-08 11:54:36.192363', '9572d666-227a-4639-9ea3-defd67123fbc', '2024-09-08 11:54:36.192363', 'Instruction', 'https://www.muscleandstrength.com/exercises/smith-machine-zercher-squat.html', 'en', NULL, 'video');
INSERT INTO public.exercise_examples_tutorials VALUES ('8613817f-8da1-4c0b-b0e3-871a7426667c', '2024-09-08 11:56:12.867871', '21d5ce50-6ffa-44d9-869f-abcfeb518018', '2024-09-08 11:56:12.867871', 'Instruction', 'https://www.muscleandstrength.com/exercises/dumbbell-goblet-split-squat', 'en', NULL, 'video');


--
-- Data for Name: exercises; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: iterations; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: muscle_exercise_bundles; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: muscle_groups; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.muscle_groups VALUES ('e1f1e456-3f8d-46f6-b7ba-75bb4b8c3802', 'Abdominal Muscles', 'Черевні М''язи', 'Брюшные Мышцы', '2023-11-12 00:38:32.665553', '2023-11-12 00:38:32.665553', 'abdominal_muscles');
INSERT INTO public.muscle_groups VALUES ('2043a22c-c547-42c2-81bb-81f85693d9cd', 'Arms and Forearms', 'Руки і передпліччя', 'Руки и предплечья', '2023-11-12 00:38:32.665553', '2023-11-12 00:38:32.665553', 'arms_and_forearms');
INSERT INTO public.muscle_groups VALUES ('4289bf91-51d8-40b0-9aca-66780584a4eb', 'Back Muscles', 'Спинні М''язи', 'Спинные Мышцы', '2023-11-12 00:38:32.665553', '2023-11-12 00:38:32.665553', 'back_muscles');
INSERT INTO public.muscle_groups VALUES ('255efc07-6c7e-42ab-97e5-01c06d60b5a3', 'Legs', 'Ноги', 'Ноги', '2023-11-12 00:38:32.665553', '2023-11-12 00:38:32.665553', 'legs');
INSERT INTO public.muscle_groups VALUES ('5fd8ccc9-8630-4357-a234-c2f278d905db', 'Chest Muscles', 'Грудні М''язи', 'Грудные Мышцы', '2023-11-12 00:38:32.665553', '2023-11-12 00:38:32.665553', 'chest_muscles');
INSERT INTO public.muscle_groups VALUES ('e1117068-06cd-4330-a4f9-93b485165805', 'Shoulder Muscles', 'Плечові М''язи', 'Плечевые Мышцы', '2023-11-12 00:38:32.665553', '2023-11-12 00:38:32.665553', 'shoulder_muscles');


--
-- Data for Name: muscles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.muscles VALUES ('2e0faf2b-31a5-4c63-ac15-454be132796f', 'Trapezius', '4289bf91-51d8-40b0-9aca-66780584a4eb', 'Трапецієподібні м''язи', 'Трапециевидные мышцы', '2023-11-12 00:44:51.190921', '2023-11-12 00:44:51.190921', 'trapezius', 48);
INSERT INTO public.muscles VALUES ('af854064-078a-4f50-af1d-8744e866751e', 'Rhomboids', '4289bf91-51d8-40b0-9aca-66780584a4eb', 'Ромбовидні м''язи', 'Ромбовидные мышцы', '2023-11-12 00:44:51.190921', '2023-11-12 00:44:51.190921', 'rhomboids', 48);
INSERT INTO public.muscles VALUES ('1ddbb748-37a6-4d66-a7d4-4957bdbc647f', 'Obliques', 'e1f1e456-3f8d-46f6-b7ba-75bb4b8c3802', 'Бічні м''язи черева', 'Боковые мышцы живота', '2023-11-12 00:49:49.921299', '2023-11-12 00:49:49.921299', 'obliques', 48);
INSERT INTO public.muscles VALUES ('9e69205f-6c6e-44a7-8ee6-89215e28a28e', 'Rectus Abdominis', 'e1f1e456-3f8d-46f6-b7ba-75bb4b8c3802', 'Пряма м''язи черева', 'Прямая мышца живота', '2023-11-12 00:49:49.921299', '2023-11-12 00:49:49.921299', 'rectus_abdominis', 48);
INSERT INTO public.muscles VALUES ('57559b71-b757-468a-983d-a1b3cec4acef', 'Quadriceps', '255efc07-6c7e-42ab-97e5-01c06d60b5a3', 'Квадрицепси', 'Квадрицепсы', '2023-11-12 00:51:12.539967', '2023-11-12 00:51:12.539967', 'quadriceps', 48);
INSERT INTO public.muscles VALUES ('831f39bd-80a8-4d11-9964-bde1788abae1', 'Latissimus Dorsi', '4289bf91-51d8-40b0-9aca-66780584a4eb', 'Широкі м''язи спини', 'Широчайшие мышцы спины', '2023-11-12 00:44:51.190921', '2023-11-12 00:44:51.190921', 'latissimus_dorsi', 48);
INSERT INTO public.muscles VALUES ('2da3d8f2-6a28-45ff-90a2-ea3a6bb2afe8', 'Lateral Deltoid', 'e1117068-06cd-4330-a4f9-93b485165805', 'Середня дельтовидна', 'Средний делтовидный ', '2023-11-13 21:03:29.671135', '2023-11-13 21:03:29.671135', 'lateral_deltoid', 48);
INSERT INTO public.muscles VALUES ('d736a513-9d73-47a3-bffc-c14911662ea2', 'Anterior Deltoid', 'e1117068-06cd-4330-a4f9-93b485165805', 'Передня дельтовидна ', 'Передний делтовидный', '2023-11-13 21:03:29.671135', '2023-11-13 21:03:29.671135', 'anterior_deltoid', 48);
INSERT INTO public.muscles VALUES ('97136fa7-622a-49d6-9d09-403a631d253d', 'Posterior Deltoid', 'e1117068-06cd-4330-a4f9-93b485165805', 'Задня дельтовидна', 'Задний делтовидный', '2023-11-13 21:03:29.671135', '2023-11-13 21:03:29.671135', 'posterior_deltoid', 48);
INSERT INTO public.muscles VALUES ('bba5b66d-9a9c-4b44-8dd6-9574760038ee', 'Calf Muscles', '255efc07-6c7e-42ab-97e5-01c06d60b5a3', 'Задні стегнові м''язи', 'Мышцы голени', '2023-11-12 00:51:12.539967', '2023-11-12 00:51:12.539967', 'calf', 48);
INSERT INTO public.muscles VALUES ('f6e65bfe-0746-4a8f-8210-0e9bf88d9886', 'Gluteal Muscles', '255efc07-6c7e-42ab-97e5-01c06d60b5a3', 'Сідничні м''язи', 'Ягодичные мышцы', '2023-11-15 21:31:45.933229', '2023-11-15 21:31:45.933229', 'gluteal', 48);
INSERT INTO public.muscles VALUES ('3eeaa9fa-0847-4780-9d01-185f91252794', 'Hamstrings', '255efc07-6c7e-42ab-97e5-01c06d60b5a3', 'Підколінні м''язи', 'Бедренные мышцы', '2023-11-12 00:51:12.539967', '2023-11-12 00:51:12.539967', 'hamstrings', 48);
INSERT INTO public.muscles VALUES ('9a8024fe-c721-4bea-969c-db88674b5ece', 'Forearm Muscles', '2043a22c-c547-42c2-81bb-81f85693d9cd', 'М''язи передпліччя', 'Мышцы предплечья', '2023-11-13 21:01:37.624512', '2023-11-13 21:01:37.624512', 'forearm', 36);
INSERT INTO public.muscles VALUES ('97a87b01-35e8-490a-94b9-9bdae9c2f965', 'Biceps Brachii', '2043a22c-c547-42c2-81bb-81f85693d9cd', 'Біцепси', 'Бицепсы', '2023-11-12 00:47:55.131334', '2023-11-12 00:47:55.131334', 'biceps', 36);
INSERT INTO public.muscles VALUES ('0fd0be35-f933-43b8-a0d7-a4b6adaa9c1a', 'Triceps Brachii', '2043a22c-c547-42c2-81bb-81f85693d9cd', 'Трицепси', 'Трицепсы', '2023-11-13 21:01:37.624512', '2023-11-13 21:01:37.624512', 'triceps', 36);
INSERT INTO public.muscles VALUES ('be38dcef-1bc8-487b-a44f-96df1ab9e68c', 'Teres Major', '4289bf91-51d8-40b0-9aca-66780584a4eb', 'Терес мажор', 'Терес мажор', '2024-07-30 19:46:35.870695', '2024-07-30 19:46:35.870695', 'teres_major', 36);
INSERT INTO public.muscles VALUES ('fa8025e6-e106-475c-8b9d-77831132fb47', 'Adductors', '255efc07-6c7e-42ab-97e5-01c06d60b5a3', 'Приводні м’язи', 'Приводящие мышцы', '2024-08-31 13:39:50.77308', '2024-08-31 13:39:50.77308', 'adductors', 48);
INSERT INTO public.muscles VALUES ('ab1dbd50-83a4-42c7-a3cd-da1784818ec8', 'Abductors', '255efc07-6c7e-42ab-97e5-01c06d60b5a3', 'Відводні м’язи', 'Отводящие мышцы', '2024-08-31 13:39:50.77308', '2024-08-31 13:39:50.77308', 'abductors', 48);
INSERT INTO public.muscles VALUES ('b4658891-9713-48c4-864c-8dd907da19b0', 'Pectoralis (sternocostal)', '5fd8ccc9-8630-4357-a234-c2f278d905db', 'Грудні м''язи (грудинно-реберна)', 'Грудные мышцы (грудинно-рёберная)', '2023-11-12 00:44:51.190921', '2023-11-12 00:44:51.190921', 'pectoralis_major_sternocostal', 48);
INSERT INTO public.muscles VALUES ('c57aa60c-61ea-4498-b01f-fedcafe8a32a', 'Pectoralis (clavicular)', '5fd8ccc9-8630-4357-a234-c2f278d905db', 'Грудні м''язи (ключична)', 'Грудные мышцы (клавикулярная)', '2023-11-12 00:44:51.190921', '2023-11-12 00:44:51.190921', 'pectoralis_major_clavicular', 48);
INSERT INTO public.muscles VALUES ('a3a8eae0-6315-4435-8974-f2c07ec3567f', 'Pectoralis (abdominal)', '5fd8ccc9-8630-4357-a234-c2f278d905db', 'Грудні м''язи (черевна)', 'Грудные мышцы (брюшная)', '2024-09-02 11:45:52.106331', '2024-09-02 11:45:52.106331', 'pectoralis_major_abdominal', 48);


--
-- Data for Name: trainings; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES ('5e2eab59-bccb-4679-997a-398e18bc254c', 'grippo@admin.panel', '$2a$10$qiW50vCNFhj.A02Gozd3mOGozaY.JHwPXC3oK/wJ2kq8MHoS64aiS', 'Admin User', '2024-08-23 10:23:20.828239', '2024-08-23 10:23:20.828239', 1.65, 'advanced');


--
-- Data for Name: weight_history; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.weight_history VALUES ('59fe6576-cc7d-41ad-9094-d94527eb0472', '5e2eab59-bccb-4679-997a-398e18bc254c', 65, '2024-08-23 10:23:20.841272', '2024-08-23 10:23:20.841272');


--
-- Name: muscle_exercise_bundles PK_228cbcce883be9a79735d6de922; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.muscle_exercise_bundles
    ADD CONSTRAINT "PK_228cbcce883be9a79735d6de922" PRIMARY KEY (id);


--
-- Name: equipments PK_250348d5d9ae4946bcd634f3e61; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipments
    ADD CONSTRAINT "PK_250348d5d9ae4946bcd634f3e61" PRIMARY KEY (id);


--
-- Name: excluded_equipments PK_6833f08aa872b23c33a2b207073; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.excluded_equipments
    ADD CONSTRAINT "PK_6833f08aa872b23c33a2b207073" PRIMARY KEY (id);


--
-- Name: exercise_examples PK_6ec4db5d5601a567816d4de278b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_examples
    ADD CONSTRAINT "PK_6ec4db5d5601a567816d4de278b" PRIMARY KEY (id);


--
-- Name: excluded_muscles PK_9557dfb4752d43a0520eaf71ddd; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.excluded_muscles
    ADD CONSTRAINT "PK_9557dfb4752d43a0520eaf71ddd" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: weight_history PK_a5697ac8bfdda68bc5e37d25297; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weight_history
    ADD CONSTRAINT "PK_a5697ac8bfdda68bc5e37d25297" PRIMARY KEY (id);


--
-- Name: exercise_examples_equipments PK_aa80c21af8dbad5c0146c09e43c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_examples_equipments
    ADD CONSTRAINT "PK_aa80c21af8dbad5c0146c09e43c" PRIMARY KEY (id);


--
-- Name: trainings PK_b67237502b175163e47dc85018d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainings
    ADD CONSTRAINT "PK_b67237502b175163e47dc85018d" PRIMARY KEY (id);


--
-- Name: exercise_example_bundles PK_c2cc4b67be9e9d112e21443a32a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_example_bundles
    ADD CONSTRAINT "PK_c2cc4b67be9e9d112e21443a32a" PRIMARY KEY (id);


--
-- Name: exercises PK_c4c46f5fa89a58ba7c2d894e3c3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT "PK_c4c46f5fa89a58ba7c2d894e3c3" PRIMARY KEY (id);


--
-- Name: muscle_groups PK_c992270adab7acafcedcf3e4428; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.muscle_groups
    ADD CONSTRAINT "PK_c992270adab7acafcedcf3e4428" PRIMARY KEY (id);


--
-- Name: muscles PK_d447d24f0750ae71b1ec5ae9668; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.muscles
    ADD CONSTRAINT "PK_d447d24f0750ae71b1ec5ae9668" PRIMARY KEY (id);


--
-- Name: iterations PK_d62c93eaa6fc8129cb942633d12; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iterations
    ADD CONSTRAINT "PK_d62c93eaa6fc8129cb942633d12" PRIMARY KEY (id);


--
-- Name: exercise_examples_tutorials PK_de469132881b9b76e0b37fad6ea; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_examples_tutorials
    ADD CONSTRAINT "PK_de469132881b9b76e0b37fad6ea" PRIMARY KEY (id);


--
-- Name: equipment_groups PK_f2248d363b3cd233ec04be2cfac; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_groups
    ADD CONSTRAINT "PK_f2248d363b3cd233ec04be2cfac" PRIMARY KEY (id);


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: IDX_b43dd7bd8917f9fca521d49232; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_b43dd7bd8917f9fca521d49232" ON public.trainings USING btree (created_at);


--
-- Name: trainings FK_0a6488e45e7e8ed7d5f69e0dead; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainings
    ADD CONSTRAINT "FK_0a6488e45e7e8ed7d5f69e0dead" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: muscle_exercise_bundles FK_183fdb588e33d2d612dc4998e95; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.muscle_exercise_bundles
    ADD CONSTRAINT "FK_183fdb588e33d2d612dc4998e95" FOREIGN KEY (exercise_example_id) REFERENCES public.exercise_examples(id) ON DELETE CASCADE;


--
-- Name: exercise_example_bundles FK_2d9baa79828c7180ebf28ff5065; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_example_bundles
    ADD CONSTRAINT "FK_2d9baa79828c7180ebf28ff5065" FOREIGN KEY (muscle_id) REFERENCES public.muscles(id) ON DELETE CASCADE;


--
-- Name: excluded_equipments b17ae8af-2d78-4e77-b45b-39253c28247a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.excluded_equipments
    ADD CONSTRAINT "b17ae8af-2d78-4e77-b45b-39253c28247a" FOREIGN KEY (equipment_id) REFERENCES public.equipments(id) ON DELETE CASCADE;


--
-- Name: excluded_muscles FK_487dfe271837b6e15ee40561fc7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.excluded_muscles
    ADD CONSTRAINT "FK_487dfe271837b6e15ee40561fc7" FOREIGN KEY (muscle_id) REFERENCES public.muscles(id) ON DELETE CASCADE;


--
-- Name: muscle_exercise_bundles FK_5b415788262521c5bfe20147ddc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.muscle_exercise_bundles
    ADD CONSTRAINT "FK_5b415788262521c5bfe20147ddc" FOREIGN KEY (muscle_id) REFERENCES public.muscles(id) ON DELETE CASCADE;


--
-- Name: exercise_example_bundles FK_600bedaa30ff58235320ef11133; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_example_bundles
    ADD CONSTRAINT "FK_600bedaa30ff58235320ef11133" FOREIGN KEY (exercise_example_id) REFERENCES public.exercise_examples(id) ON DELETE CASCADE;


--
-- Name: excluded_equipments FK_67d0ce866c36449a91e2b5e7296; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.excluded_equipments
    ADD CONSTRAINT "FK_67d0ce866c36449a91e2b5e7296" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: iterations FK_83c23650e879d2d07e375574069; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iterations
    ADD CONSTRAINT "FK_83c23650e879d2d07e375574069" FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE CASCADE;


--
-- Name: weight_history FK_90d01effa2fdd927e738e232f0e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weight_history
    ADD CONSTRAINT "FK_90d01effa2fdd927e738e232f0e" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: muscles FK_97c14a3154bde81534490d92186; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.muscles
    ADD CONSTRAINT "FK_97c14a3154bde81534490d92186" FOREIGN KEY (muscle_group_id) REFERENCES public.muscle_groups(id) ON DELETE CASCADE;


--
-- Name: exercise_examples_equipments FK_a97b574c6a2ddefc48ce4e34f80; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_examples_equipments
    ADD CONSTRAINT "FK_a97b574c6a2ddefc48ce4e34f80" FOREIGN KEY (exercise_example_id) REFERENCES public.exercise_examples(id) ON DELETE CASCADE;


--
-- Name: exercises FK_b0947cc4c27363a5d4525d103dd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT "FK_b0947cc4c27363a5d4525d103dd" FOREIGN KEY (training_id) REFERENCES public.trainings(id) ON DELETE CASCADE;


--
-- Name: exercise_examples_tutorials FK_c37eef836efb07dc487deb27fca; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_examples_tutorials
    ADD CONSTRAINT "FK_c37eef836efb07dc487deb27fca" FOREIGN KEY (exercise_example_id) REFERENCES public.exercise_examples(id) ON DELETE CASCADE;


--
-- Name: exercise_examples_equipments FK_ca612324a3e3a31b91989cac790; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_examples_equipments
    ADD CONSTRAINT "FK_ca612324a3e3a31b91989cac790" FOREIGN KEY (equipment_id) REFERENCES public.equipments(id) ON DELETE CASCADE;


--
-- Name: equipments FK_dbe5cf6e8bfb13366defd7706ab; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipments
    ADD CONSTRAINT "FK_dbe5cf6e8bfb13366defd7706ab" FOREIGN KEY (equipment_group_id) REFERENCES public.equipment_groups(id) ON DELETE CASCADE;


--
-- Name: exercises FK_f2cff4897a8c9ce4a3511086e1e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT "FK_f2cff4897a8c9ce4a3511086e1e" FOREIGN KEY (exercise_example_id) REFERENCES public.exercise_examples(id) ON DELETE SET NULL;


--
-- Name: excluded_muscles FK_fb5bf30c118024b483e9e2d88c8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.excluded_muscles
    ADD CONSTRAINT "FK_fb5bf30c118024b483e9e2d88c8" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

