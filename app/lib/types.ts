// TypeScript interfaces for Bangkok Transit Unified database schema

export interface Operator {
  id: string;
  name_th: string;
  name_en: string;
  code: string; // BTS, MRT, ARL, SRT
}

export interface Line {
  id: string;
  operator_id: string;
  name_th: string;
  name_en: string;
  code: string; // SUK, SIL, GOLD, BLU, PUR, YEL, PNK, ARL, RDD, RDL
  color: string; // hex color
}

export interface Station {
  id: string;
  name_th: string;
  name_en: string;
  code: string | null;
  lat: number;
  lng: number;
  is_interchange: boolean;
}

export interface StationLine {
  station_id: string;
  line_id: string;
  sequence_order: number;
}

export interface Edge {
  id: string;
  from_station_id: string;
  to_station_id: string;
  line_id: string;
  travel_time_min: number;
  is_transfer: boolean;
}

export interface FareMatrix {
  id: string;
  line_id: string;
  from_station_id: string;
  to_station_id: string;
  fare: number;
}

// Enriched types for UI
export interface StationWithLines extends Station {
  lines: Line[];
}

export interface RouteStep {
  station: Station;
  line: Line | null; // null for transfer steps
  is_transfer: boolean;
  travel_time_min: number;
}

export interface RouteSegment {
  line: Line;
  operator: Operator;
  stations: Station[];
  fare: number;
}

export interface RouteResult {
  steps: RouteStep[];
  segments: RouteSegment[];
  total_time_min: number;
  total_fare: number;
}
