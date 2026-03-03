-- 001_create_schema.sql
-- Bangkok Transit Unified - Database Schema

-- Operators table
create table operators (
  id uuid primary key default gen_random_uuid(),
  name_th text not null,
  name_en text not null,
  code text unique not null -- BTS, MRT, ARL, SRT
);

-- Lines table
create table lines (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid references operators(id) on delete cascade,
  name_th text not null,
  name_en text not null,
  code text unique not null, -- SUK, SIL, GOLD, BLU, PUR, YEL, PNK, ARL, RDD, RDL
  color text not null          -- hex color
);

-- Stations table
create table stations (
  id uuid primary key default gen_random_uuid(),
  name_th text not null,
  name_en text not null,
  code text,                   -- station code e.g. N1, S12, BL01
  lat numeric(9,6) not null,
  lng numeric(9,6) not null,
  is_interchange boolean default false
);

-- Station Lines (many-to-many)
create table station_lines (
  station_id uuid references stations(id) on delete cascade,
  line_id uuid references lines(id) on delete cascade,
  sequence_order integer not null, -- station order in line
  primary key (station_id, line_id)
);

-- Edges (for Dijkstra graph)
create table edges (
  id uuid primary key default gen_random_uuid(),
  from_station_id uuid references stations(id) on delete cascade,
  to_station_id uuid references stations(id) on delete cascade,
  line_id uuid references lines(id) on delete cascade,
  travel_time_min integer not null,
  is_transfer boolean default false -- walking edge between interchange stations
);

-- Fare Matrix (station-to-station per line)
create table fare_matrix (
  id uuid primary key default gen_random_uuid(),
  line_id uuid references lines(id) on delete cascade,
  from_station_id uuid references stations(id) on delete cascade,
  to_station_id uuid references stations(id) on delete cascade,
  fare numeric(6,2) not null,
  unique(line_id, from_station_id, to_station_id)
);
