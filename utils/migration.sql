SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF-8';
SET standard_conforming_strings = on;

SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_with_oids = false;

SET SEARCH_PATH to players;

CREATE SEQUENCE IF NOT EXISTS country_id_seq
    START 1
    INCREMENT 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;


ALTER SEQUENCE country_id_seq OWNER TO ${flyway:user};

CREATE TABLE IF NOT EXISTS country (
    id bigint NOT NULL CONSTRAINT country_pkey PRIMARY KEY DEFAULT nextval('country_id_seq'::regclass),
	version integer NOT NULL,
    createdAt timestamp without time zone,
    created_by character varying(255) COLLATE pg_catalog."default",
    deleted boolean NOT NULL,
    updatedAt timestamp without time zone,
    updatedAt character varying(255) COLLATE pg_catalog."default",
    code character varying(255) NOT NULL COLLATE pg_catalog."default",
    name character varying(255) NOT NULL COLLATE pg_catalog."default",
    nationality character varying(255) NOT NULL COLLATE pg_catalog."default"
);


ALTER TABLE country OWNER TO ${flyway:user};

CREATE SEQUENCE IF NOT EXISTS player_id_seq
    START 1
    INCREMENT 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

ALTER SEQUENCE player_id_seq OWNER TO ${flyway:user};

CREATE TABLE IF NOT EXISTS player (
    id bigint NOT NULL CONSTRAINT player_pkey PRIMARY KEY DEFAULT nextval('player_id_seq'::regclass),
	version integer NOT NULL,
    createdAt timestamp without time zone,
    created_by character varying(255) COLLATE pg_catalog."default",
    deleted boolean NOT NULL,
    updatedAt timestamp without time zone,
    updatedAt character varying(255) COLLATE pg_catalog."default",
    nickname character varying(255) NOT NULL COLLATE pg_catalog."default",
    player_id bigint NOT NULL, /*legajo*/
	fullname character varying(255) NOT NULL COLLATE pg_catalog."default", /*El nombre completo no es obligatorio*/
	country_id bigint NOT NULL,
	birthday date,
	
	FOREIGN KEY (country_id) REFERENCES country(id)
);


ALTER TABLE player OWNER TO ${flyway:user};






CREATE SEQUENCE IF NOT EXISTS uma_id_seq
    START 1
    INCREMENT 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

ALTER SEQUENCE uma_id_seq OWNER TO ${flyway:user};

CREATE TABLE IF NOT EXISTS uma (
    id bigint NOT NULL CONSTRAINT uma_pkey PRIMARY KEY DEFAULT nextval('uma_id_seq'::regclass),
	version integer NOT NULL,
    createdAt timestamp without time zone,
    created_by character varying(255) COLLATE pg_catalog."default",
    deleted boolean NOT NULL,
    updatedAt timestamp without time zone,
    updatedAt character varying(255) COLLATE pg_catalog."default",
    first_place integer NOT NULL,
	second_place integer NOT NULL,
	third_place integer NOT NULL,
    fourth_place integer, /*sanma*/
    name character varying(255) NOT NULL COLLATE pg_catalog."default"    
);

ALTER TABLE uma OWNER TO ${flyway:user};



CREATE SEQUENCE IF NOT EXISTS ruleset_id_seq
    START 1
    INCREMENT 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;


ALTER SEQUENCE ruleset_id_seq OWNER TO ${flyway:user};

CREATE TABLE IF NOT EXISTS ruleset (
    id bigint NOT NULL CONSTRAINT ruleset_pkey PRIMARY KEY DEFAULT nextval('ruleset_id_seq'::regclass),
	version integer NOT NULL,
    createdAt timestamp without time zone,
    created_by character varying(255) COLLATE pg_catalog."default",
    deleted boolean NOT NULL,
    updatedAt timestamp without time zone,
    updatedAt character varying(255) COLLATE pg_catalog."default",
	name character varying(255) NOT NULL COLLATE pg_catalog."default",
	sanma boolean NOT NULL,
	uma_id bigint NOT NULL,
	oka integer NOT NULL,	
    chonbo integer NOT NULL, /*valor en puntos*/
    game_type character varying(255) NOT NULL COLLATE pg_catalog."default" NOT NULL, /*hanchan o tonpu**/
    in_points integer NOT NULL, 
    out_points integer NOT NULL,
	
	FOREIGN KEY (uma_id) REFERENCES uma(id)
);


ALTER TABLE ruleset OWNER TO ${flyway:user};




CREATE SEQUENCE IF NOT EXISTS season_id_seq
    START 1
    INCREMENT 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;


ALTER SEQUENCE season_id_seq OWNER TO ${flyway:user};

CREATE TABLE IF NOT EXISTS season (
    id bigint NOT NULL CONSTRAINT season_pkey PRIMARY KEY DEFAULT nextval('season_id_seq'::regclass),
	version integer NOT NULL,
    createdAt timestamp without time zone,
    created_by character varying(255) COLLATE pg_catalog."default",
    deleted boolean NOT NULL,
    updatedAt timestamp without time zone,
    updatedAt character varying(255) COLLATE pg_catalog."default",
	start_date date NOT NULL,
    end_date date,
    season_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
);

ALTER TABLE season OWNER TO ${flyway:user};


CREATE SEQUENCE IF NOT EXISTS season_ruleset_id_seq
    START 1
    INCREMENT 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;


ALTER SEQUENCE season_ruleset_id_seq OWNER TO ${flyway:user};


/*Si tenemos sanma podemos tener varios ruleset*/
CREATE TABLE IF NOT EXISTS season_ruleset (
    id bigint NOT NULL CONSTRAINT season_pkey PRIMARY KEY DEFAULT nextval('season_id_seq'::regclass),
	version integer NOT NULL,
    createdAt timestamp without time zone,
    created_by character varying(255) COLLATE pg_catalog."default",
    deleted boolean NOT NULL,
    updatedAt timestamp without time zone,
    updatedAt character varying(255) COLLATE pg_catalog."default",
	season_id bigint NOT NULL,
	ruleset_id bigint NOT NULL,
	
	FOREIGN KEY (season_id) REFERENCES season(id),
	FOREIGN KEY (ruleset_id) REFERENCES ruleset(id)
);

ALTER TABLE season_ruleset OWNER TO ${flyway:user};



CREATE SEQUENCE IF NOT EXISTS location_id_seq
    START 1
    INCREMENT 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;



ALTER SEQUENCE location_id_seq OWNER TO ${flyway:user};

CREATE TABLE IF NOT EXISTS location (
    id bigint NOT NULL CONSTRAINT location_pkey PRIMARY KEY DEFAULT nextval('location_id_seq'::regclass),
	version integer NOT NULL,
    createdAt timestamp without time zone,
    created_by character varying(255) COLLATE pg_catalog."default",
    deleted boolean NOT NULL,
    updatedAt timestamp without time zone,
    updatedAt character varying(255) COLLATE pg_catalog."default",
    address character varying(255) COLLATE pg_catalog."default",
    name character varying(255) NOT NULL COLLATE pg_catalog."default" NOT NULL, /*biblioteca sudestada, msoul, etc*/
    online_platform character varying(255) COLLATE pg_catalog."default" /*tenhou, msoul etc*/
);


ALTER TABLE location OWNER TO ${flyway:user};


CREATE SEQUENCE IF NOT EXISTS tournament_id_seq
    START 1
    INCREMENT 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;


ALTER SEQUENCE tournament_id_seq OWNER TO ${flyway:user};

CREATE TABLE IF NOT EXISTS tournament (
    id bigint NOT NULL CONSTRAINT tournament_pkey PRIMARY KEY DEFAULT nextval('tournament_id_seq'::regclass),
	version integer NOT NULL,
    createdAt timestamp without time zone,
    created_by character varying(255) COLLATE pg_catalog."default",
    deleted boolean NOT NULL,
    updatedAt timestamp without time zone,
    updatedAt character varying(255) COLLATE pg_catalog."default",
	start_date date NOT NULL,
    end_date date,
    description character varying(255) COLLATE pg_catalog."default",
	tournament_type character varying(255) COLLATE pg_catalog."default", /*Evento o torneo normal etc, para poder identificar si eventualmente tenemos tablas de puntos de torneo, evento y juegos no harcodeadas*/
	season_ruleset_id bigint NOT NULL,
	location_id bigint NOT NULL,
 	
	FOREIGN KEY (season_ruleset_id) REFERENCES season_ruleset(id),
	FOREIGN KEY (location_id) REFERENCES location(id)
	
);

ALTER TABLE tournament OWNER TO ${flyway:user};

CREATE SEQUENCE IF NOT EXISTS game_id_seq
    START 1
    INCREMENT 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;


ALTER SEQUENCE game_id_seq OWNER TO ${flyway:user};

CREATE TABLE IF NOT EXISTS game (
    id bigint NOT NULL CONSTRAINT game_pkey PRIMARY KEY DEFAULT nextval('game_id_seq'::regclass),
	version integer NOT NULL,
    createdAt timestamp without time zone,
    created_by character varying(255) COLLATE pg_catalog."default",
    deleted boolean NOT NULL,
    updatedAt timestamp without time zone,
    updatedAt character varying(255) COLLATE pg_catalog."default",
    date_ date NOT NULL,
	location_id bigint NOT NULL,	
    ruleset_id bigint NOT NULL,
    season_id bigint, /*separados season y ruleset xq puede ser un juego casual que no rankea*/
    tournament_id bigint, /*puede ser juego de torneo o no*/
	
	FOREIGN KEY (tournament_id) REFERENCES tournament(id),
	FOREIGN KEY (season_id) REFERENCES season(id),
	FOREIGN KEY (ruleset_id) REFERENCES ruleset(id)
);


ALTER TABLE game OWNER TO ${flyway:user};




CREATE SEQUENCE IF NOT EXISTS points_id_seq
    START 1
    INCREMENT 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;


ALTER SEQUENCE points_id_seq OWNER TO ${flyway:user};

 /*tabla que persiste todos los puntos, dan, rate y temporada, para evitar crear varias tablas, tiene un discriminador que es el points_type*/
CREATE TABLE IF NOT EXISTS points (
    id bigint NOT NULL CONSTRAINT points_pkey PRIMARY KEY DEFAULT nextval('points_id_seq'::regclass),
	version integer NOT NULL,
    createdAt timestamp without time zone,
    created_by character varying(255) COLLATE pg_catalog."default",
    deleted boolean NOT NULL,
    updatedAt timestamp without time zone,
    updatedAt character varying(255) COLLATE pg_catalog."default",
    player_id bigint NOT NULL,
	game_id bigint,
	season_id bigint,
	tournament_id bigint,
	value real NOT NULL,
	points_type character varying(255) COLLATE pg_catalog."default" NOT NULL, /*Dan, Rate, Temporada*/
	
	FOREIGN KEY (player_id) REFERENCES player(id),
	FOREIGN KEY (game_id) REFERENCES game(id)
);


ALTER TABLE points OWNER TO ${flyway:user};









CREATE SEQUENCE IF NOT EXISTS account_id_seq
    START 1
    INCREMENT 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;


ALTER SEQUENCE account_id_seq OWNER TO ${flyway:user};

CREATE TABLE IF NOT EXISTS account (
    id bigint NOT NULL CONSTRAINT account_pkey PRIMARY KEY DEFAULT nextval('account_id_seq'::regclass),
	version integer NOT NULL,
    createdAt timestamp without time zone,
    created_by character varying(255) COLLATE pg_catalog."default",
    deleted boolean NOT NULL,
    updatedAt timestamp without time zone,
    updatedAt character varying(255) COLLATE pg_catalog."default",
    account_id character varying(255) NOT NULL COLLATE pg_catalog."default", /*ej id de msoul*/
    game_account character varying(255) NOT NULL COLLATE pg_catalog."default", /*plataforma*/
	nickname character varying(255) NOT NULL COLLATE pg_catalog."default",
    player_id bigint,
	
	FOREIGN KEY (player_id) REFERENCES player(id)
);


ALTER TABLE player_account OWNER TO ${flyway:user};




CREATE SEQUENCE IF NOT EXISTS game_result_id_seq
    START 1
    INCREMENT 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;


ALTER SEQUENCE game_result_id_seq OWNER TO ${flyway:user};

CREATE TABLE IF NOT EXISTS game_result (
    id bigint NOT NULL CONSTRAINT game_result_pkey PRIMARY KEY DEFAULT nextval('game_result_id_seq'::regclass),
	version integer NOT NULL,
    createdAt timestamp without time zone,
    created_by character varying(255) COLLATE pg_catalog."default",
    deleted boolean NOT NULL,
    updatedAt timestamp without time zone,
    updatedAt character varying(255) COLLATE pg_catalog."default",
	score integer, /*Si no le pasamos el score ya tiene que venir, si le pasamos que calcule el score final de acuerdo al uma y oka del game*/
	final_score integer NOT NULL,
    chonbo integer, /* cantidad */
    final_position integer,   
    game_id bigint,
    player_id bigint,
	
	FOREIGN KEY (player_id) REFERENCES player(id),
	FOREIGN KEY (game_id) REFERENCES game(id)
);


ALTER TABLE game_result OWNER TO ${flyway:user};




CREATE SEQUENCE IF NOT EXISTS tournament_result_id_seq
    START 1
    INCREMENT 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

ALTER SEQUENCE tournament_result_id_seq OWNER TO ${flyway:user};

CREATE TABLE IF NOT EXISTS tournament_result (
    id bigint NOT NULL CONSTRAINT tournament_result_pkey PRIMARY KEY DEFAULT nextval('tournament_result_id_seq'::regclass),
	version integer NOT NULL,
    createdAt timestamp without time zone,
    created_by character varying(255) COLLATE pg_catalog."default",
    deleted boolean NOT NULL,
    updatedAt timestamp without time zone,
    updatedAt character varying(255) COLLATE pg_catalog."default",
    final_placement integer,
    points integer,
    player_id bigint NOT NULL,
    season_id bigint NOT NULL,
    tournament_id bigint NOT NULL,
	
	FOREIGN KEY (tournament_id) REFERENCES tournament(id),
	FOREIGN KEY (player_id) REFERENCES player(id)
);

ALTER TABLE tournament_result OWNER TO ${flyway:user};