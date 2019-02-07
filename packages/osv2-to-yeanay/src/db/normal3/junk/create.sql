SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = ON;
SET check_function_bodies = FALSE;
SET client_min_messages = WARNING;
SET row_security = OFF;

--
-- SCHEMA -------------------------
--

DROP SCHEMA IF EXISTS normal2 CASCADE;
CREATE SCHEMA normal2;

ALTER SCHEMA normal2
OWNER TO yeanay1;

SET search_path = normal2, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = FALSE;

---
--- functions -----------------------------------
---

CREATE OR REPLACE FUNCTION update_update_time()
  RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = current_timestamp;
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

--
-- state_gov --------------------------------------
--

CREATE TABLE state_gov (
  state_id         VARCHAR(255)    NOT NULL UNIQUE,
  capitol_timezone VARCHAR(255)    NOT NULL,
  feature_flags    VARCHAR(255) [] NOT NULL,
  latest_json_date DATE,
  latest_json_url  VARCHAR(255),
  latest_update    DATE,
  legislature_name VARCHAR(255)    NOT NULL,
  legislature_url  VARCHAR(255)    NOT NULL,
  name             VARCHAR(255)    NOT NULL,
  id               SERIAL PRIMARY KEY,
  created_at       TIMESTAMP DEFAULT current_timestamp,
  updated_at       TIMESTAMP DEFAULT current_timestamp,

  first_vote_date  DATE,
  last_vote_date   DATE
);

CREATE TRIGGER update_state_gov_time
BEFORE UPDATE ON state_gov
FOR EACH ROW EXECUTE PROCEDURE update_update_time();


ALTER TABLE state_gov
  OWNER TO yeanay1;

--
-- state_term -----------------------------------------------
--

CREATE TABLE state_term (
  term_id    VARCHAR(255) NOT NULL,
  start_year INTEGER      NOT NULL,
  end_year   INTEGER      NOT NULL,
  id         SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT current_timestamp,
  updated_at TIMESTAMP DEFAULT current_timestamp,
  state_fk   INTEGER      NOT NULL REFERENCES state_gov ON DELETE CASCADE,
  UNIQUE (state_fk, start_year),
  UNIQUE (state_fk, term_id)
);

CREATE TRIGGER update_term_time
BEFORE UPDATE ON state_term
FOR EACH ROW EXECUTE PROCEDURE update_update_time();


ALTER TABLE state_term
  OWNER TO yeanay1;

--
-- state_session ------------------------------------
--

CREATE TABLE state_session (
  session_id      VARCHAR(255) NOT NULL,
  type            VARCHAR(255) NOT NULL,
  start_date      DATE,
  end_date        DATE,
  id              SERIAL PRIMARY KEY,
  created_at      TIMESTAMP DEFAULT current_timestamp,
  updated_at      TIMESTAMP DEFAULT current_timestamp,
  term_fk         INTEGER      NOT NULL REFERENCES state_term ON DELETE CASCADE,

  first_vote_date DATE,
  last_vote_date  DATE,

  UNIQUE (term_fk, session_id)
);

CREATE TRIGGER update_session_time
BEFORE UPDATE ON state_session
FOR EACH ROW EXECUTE PROCEDURE update_update_time();

ALTER TABLE state_session
  OWNER TO yeanay1;

--
-- district ---------------------------------------
--

CREATE TYPE DISTRICT_REGION_TYPE AS (
  center_lat DOUBLE PRECISION,
  center_lon DOUBLE PRECISION,
  lat_delta  DOUBLE PRECISION,
  lon_delta  DOUBLE PRECISION
);

CREATE TABLE district (
  district_id   VARCHAR(255) NOT NULL UNIQUE,
  district_name VARCHAR(255) NOT NULL,
  state_fk      INTEGER      NOT NULL REFERENCES state_gov ON DELETE CASCADE,
  chamber_id    CHAR(5)      NOT NULL CHECK (chamber_id IN ('upper', 'lower')),
  boundary_id   VARCHAR(255),
  num_seats     INTEGER      NOT NULL,
  bbox          JSONB,
  region        JSONB,
  geoid         VARCHAR(20),
  is_floterial  BOOLEAN   DEFAULT FALSE,
  floterial_fk  INTEGER REFERENCES district,
  id            SERIAL PRIMARY KEY,
  created_at    TIMESTAMP DEFAULT current_timestamp,
  updated_at    TIMESTAMP DEFAULT current_timestamp,
  UNIQUE (state_fk, chamber_id, district_id),
  UNIQUE (state_fk, chamber_id, geoid)
);

CREATE TRIGGER update_district_time
BEFORE UPDATE ON district
FOR EACH ROW EXECUTE PROCEDURE update_update_time();


ALTER TABLE district
  OWNER TO yeanay1;

--
-- district ---------------------------------------
--

CREATE TABLE district_shape (
  district_fk INTEGER NOT NULL REFERENCES district ON DELETE CASCADE,
  state_fk    INTEGER NOT NULL REFERENCES state_gov ON DELETE CASCADE,
  shape       JSONB   NOT NULL,
  created_at  TIMESTAMP DEFAULT current_timestamp,
  updated_at  TIMESTAMP DEFAULT current_timestamp,
  UNIQUE (district_fk)
);

CREATE TRIGGER update_district_shape_time
BEFORE UPDATE ON district_shape
FOR EACH ROW EXECUTE PROCEDURE update_update_time();


ALTER TABLE district_shape
  OWNER TO yeanay1;

--
-- legi ------------------------------------------
--

CREATE TABLE legi (
  legi_id             VARCHAR(255)    NOT NULL UNIQUE,
  state_fk            INTEGER         NOT NULL REFERENCES state_gov ON DELETE CASCADE,
  active              BOOLEAN         NOT NULL,
  chamber_id          CHAR(5)         NOT NULL CHECK (chamber_id IN ('upper', 'lower')),
  district_fk         INTEGER         NOT NULL REFERENCES district,
  party_id            VARCHAR(255)    NOT NULL,
  email               VARCHAR(255),
  full_name           VARCHAR(255)    NOT NULL,
  first_name          VARCHAR(255)    NOT NULL,
  middle_name         VARCHAR(255)    NOT NULL,
  last_name           VARCHAR(255)    NOT NULL,
  suffixes            VARCHAR(255)    NOT NULL,
  ordinal             INTEGER         NOT NULL,
  photo_url           VARCHAR(255),
  url                 VARCHAR(255),
  all_ids             VARCHAR(255) [] NOT NULL,
  os_created_at       DATE            NOT NULL,
  os_updated_at       DATE            NOT NULL,
  id                  SERIAL PRIMARY KEY,
  created_at          TIMESTAMP DEFAULT current_timestamp,
  updated_at          TIMESTAMP DEFAULT current_timestamp,
  demi_party          CHAR,
  offices             JSONB,
  committees          JSONB,
  partisanity         REAL,
  activeness          REAL,
  effectiveness       REAL,
  weighted_activeness REAL,

  UNIQUE (state_fk, legi_id)
);
CREATE INDEX legi_state_name_idx
  ON legi (state_fk, last_name, first_name);
CREATE INDEX legi_state_chamber_idx
  ON legi (state_fk, chamber_id);

CREATE TRIGGER update_legi_time
BEFORE UPDATE ON legi
FOR EACH ROW EXECUTE PROCEDURE update_update_time();


ALTER TABLE legi
  OWNER TO yeanay1;

--
-- member_role ---------------------------------------------
--

CREATE TABLE member_role (
  legi_fk     INTEGER NOT NULL REFERENCES legi ON DELETE CASCADE,
  district_fk INTEGER NOT NULL REFERENCES district ON DELETE CASCADE,
  term_fk     INTEGER NOT NULL REFERENCES state_term ON DELETE CASCADE,
  active      BOOLEAN NOT NULL,
  chamber_id  CHAR(5) NOT NULL CHECK (chamber_id IN ('upper', 'lower')),
  start_date  DATE,
  end_date    DATE,
  party_id    VARCHAR(255),
  id          SERIAL PRIMARY KEY,
  created_at  TIMESTAMP DEFAULT current_timestamp,
  updated_at  TIMESTAMP DEFAULT current_timestamp,
  UNIQUE (term_fk, legi_fk, chamber_id)
);

CREATE TRIGGER update_member_role_time
BEFORE UPDATE ON member_role
FOR EACH ROW EXECUTE PROCEDURE update_update_time();


ALTER TABLE member_role
  OWNER TO yeanay1;

--
-- bill -----------------------
--

CREATE TABLE bill (
  session_fk       INTEGER           NOT NULL REFERENCES state_session ON DELETE CASCADE,
  bill_id          VARCHAR(255)      NOT NULL UNIQUE,
  bill_name        VARCHAR(255)      NOT NULL,
  title            VARCHAR(20000)    NOT NULL,
  alternate_titles VARCHAR(20000) [] NOT NULL,
  chamber_id       CHAR(5)           NOT NULL CHECK (chamber_id IN ('upper', 'lower')),
  os_created_at    DATE              NOT NULL,
  os_updated_at    DATE              NOT NULL,
  scraped_subjects VARCHAR(1000) []  NOT NULL, --- todo determine reasonable max sizes for these
  subjects         VARCHAR(1000) []  NOT NULL,
  bill_types       VARCHAR(1000) []  NOT NULL,
  id               SERIAL PRIMARY KEY,
  created_at       TIMESTAMP DEFAULT current_timestamp,
  updated_at       TIMESTAMP DEFAULT current_timestamp
);
CREATE INDEX bill_session
  ON bill (session_fk);

CREATE TRIGGER update_bill_time
BEFORE UPDATE ON bill
FOR EACH ROW EXECUTE PROCEDURE update_update_time();

ALTER TABLE bill
  OWNER TO yeanay1;

--
-- vote ---------------------------------------------
--

CREATE TABLE vote (
  session_fk        INTEGER       NOT NULL REFERENCES state_session ON DELETE CASCADE,
  chamber_id        CHAR(5)       NOT NULL CHECK (chamber_id IN ('upper', 'lower')),
  date              DATE          NOT NULL,
  vote_id           VARCHAR(255)  NOT NULL UNIQUE,
  passed            BOOLEAN       NOT NULL,
  motion            VARCHAR(3000) NOT NULL, -- have seen >1600
  motion_type       VARCHAR(25) DEFAULT NULL NULL,
  bill_fk           INTEGER       NOT NULL REFERENCES bill ON DELETE CASCADE,
  yes_count         INTEGER       NOT NULL,
  no_count          INTEGER       NOT NULL,
  other_count       INTEGER       NOT NULL,
  id                SERIAL PRIMARY KEY,
  rollcall          BOOLEAN       NOT NULL,
  created_at        TIMESTAMP DEFAULT current_timestamp,
  updated_at        TIMESTAMP DEFAULT current_timestamp,

  partisanity       REAL,
  demi_party_counts JSONB,
  total_vote_count  INTEGER,
  margin            INTEGER,
  participation     INTEGER
);

CREATE INDEX vote_session_date_idx
  ON vote (session_fk, date DESC);

CREATE TRIGGER update_vote_time
BEFORE UPDATE ON vote
FOR EACH ROW EXECUTE PROCEDURE update_update_time();


ALTER TABLE vote
  OWNER TO yeanay1;

--
-- legi_vote ---------------------------------------------
--

CREATE TABLE legi_vote (
  legi_fk    INTEGER  NOT NULL REFERENCES legi ON DELETE CASCADE,
  vote_fk    INTEGER  NOT NULL REFERENCES vote ON DELETE CASCADE,
  vote_value SMALLINT NOT NULL,
  PRIMARY KEY (legi_fk, vote_fk)
);
CREATE INDEX legi_vote_vote_id_idx
  ON legi_vote (vote_fk);

ALTER TABLE legi_vote
  OWNER TO yeanay1;

CREATE VIEW legi_vote_view AS
  SELECT
    l.legi_id     AS legi_id,
    b.bill_id     AS bill_id,
    v.vote_id     AS vote_id,
    v.chamber_id  AS chamber_id,
    s.state_id    AS state_id,
    lv.vote_value AS vote_value
  FROM legi_vote AS lv
    JOIN vote AS v ON lv.vote_fk = v.id
    JOIN bill AS b ON v.bill_fk = b.id
    JOIN legi AS l ON lv.legi_fk = l.id
    JOIN state_gov AS s ON l.state_fk = s.id;

--- Views ---------------------

CREATE VIEW state_term_view AS
  SELECT
    state_gov.state_id,
    state_term.*
  FROM state_term
    JOIN state_gov ON state_term.state_fk = state_gov.id;

CREATE VIEW state_session_view AS
  SELECT
    state_term_view.id       AS term_pk,
    state_term_view.state_fk AS state_pk,
    state_term_view.state_id AS state_id,
    state_term_view.term_id  AS term_id,
    state_session.*
  FROM state_session
    JOIN state_term_view ON state_session.term_fk = state_term_view.id;

CREATE VIEW bill_view AS
  SELECT
    state_session_view.state_id,
    state_session_view.term_id,
    state_session_view.session_id,
    bill.*
  FROM bill
    JOIN state_session_view ON bill.session_fk = state_session_view.id;

CREATE VIEW legi_view AS
  SELECT
    state_gov.state_id,
    district.district_id,
    legi.*
  FROM legi
    JOIN state_gov ON legi.state_fk = state_gov.id
    JOIN district ON legi.district_fk = district.id;

CREATE VIEW member_role_view AS
  SELECT
    legi_view.legi_id,
    legi_view.state_id,
    member_role.*
  FROM member_role
    JOIN legi_view ON member_role.legi_fk = legi_view.id;

CREATE VIEW vote_view AS
  SELECT
    bill_view.state_id,
    bill_view.bill_name,
    bill_view.bill_id,
    vote.*
  FROM vote
    JOIN bill_view ON vote.bill_fk = bill_view.id;

CREATE VIEW district_view AS
  SELECT
    state_gov.state_id,
    state_gov.name AS state_name,
    district.*
  FROM district
    JOIN state_gov ON district.state_fk = state_gov.id;

-- Full-text search support

CREATE MATERIALIZED VIEW vote_search AS
SELECT
  vote.id,
  setweight(to_tsvector(vote.motion), 'B') ||
  setweight(to_tsvector(coalesce(vote.motion_type, '')), 'B') ||
  setweight(to_tsvector(to_char(vote.date, 'FMDD FMMonth YYYY')), 'B') ||

    setweight(to_tsvector(bill.bill_name), 'A') ||
  setweight(to_tsvector(bill.title), 'B') ||
  setweight(to_tsvector(array_to_string(bill.alternate_titles,',')), 'C') ||
  setweight(to_tsvector(array_to_string(bill.subjects, ',')), 'B') ||
  setweight(to_tsvector(array_to_string(bill.scraped_subjects, ',')), 'B') ||
  setweight(to_tsvector(bill.title), 'B') ||

  setweight(to_tsvector(state_gov.legislature_name), 'B') ||
  setweight(to_tsvector(state_gov.name), 'B') ||
  setweight(to_tsvector(state_gov.state_id), 'B')
    AS document
FROM vote
  -- todo need chamber to join to to get name of chamber
  JOIN bill ON vote.bill_fk = bill.id
  JOIN state_session ON (bill.session_fk = state_session.id)
  JOIN state_term ON (state_session.term_fk = state_term.id)
  JOIN state_gov ON (state_term.state_fk = state_gov.id);

CREATE INDEX vote_search_idx ON vote_search USING gin(document);

-- EXAMPLE QUERY:
-- select vote_view.* from vote_search join vote_view on (vote_search.id = vote_view.id)
-- where vote_search.document @@ plainto_tsquery('english', 'gender')


CREATE MATERIALIZED VIEW legi_search AS
  SELECT
    legi.id,
    legi.offices,
    setweight(to_tsvector(legi.full_name), 'A') ||
    setweight(to_tsvector(array_to_string(array_agg(committee_rec.committee || ' committee'), ',')), 'C') ||
    setweight(to_tsvector('district ' || district.district_name), 'B')
      AS document
  FROM legi,
        jsonb_to_recordset(legi.committees) AS committee_rec(committee TEXT),
    -- todo need chamber to join to to get name of chamber
    -- todo more geographical data, like towns, county, etc.
    state_gov,
    district
  where legi.state_fk = state_gov.id
        and legi.district_fk = district.id
  group by legi.id, district.district_name;

CREATE INDEX legi_search_idx ON legi_search USING gin(document);

-- EXAMPLE QUERY:
-- SELECT legi_view.* FROM legi_search
--   JOIN legi_view ON (legi_search.id = legi_view.id)
-- WHERE legi_search.document @@ plainto_tsquery('english', 'budget');
