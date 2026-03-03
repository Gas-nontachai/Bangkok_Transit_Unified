import type { FareMatrix, Line, Operator } from "./types";
import type { RouteSegmentRaw } from "./dijkstra";

export interface FareSegmentResult {
  lineId: string;
  lineName: string;
  operatorCode: string;
  fare: number;
  isEstimated: boolean;
  fromStationId: string;
  toStationId: string;
}

export interface FareResult {
  segments: FareSegmentResult[];
  totalFare: number;
}

/**
 * Estimate fare when exact fare matrix lookup fails.
 * Uses per-line interpolation based on known min/max fares and total stops.
 */
function estimateFare(lineCode: string, stops: number): number {
  if (stops <= 0) return 0;
  switch (lineCode) {
    case "SUK":
      return Math.min(65, Math.round(17 + (48 * stops) / 46));
    case "SIL":
      return Math.min(65, Math.round(17 + (48 * stops) / 13));
    case "GOLD":
      return 16;
    case "BLU": {
      const tbl = [0, 17, 20, 23, 26, 29, 32, 35, 38, 41, 42];
      return stops < tbl.length ? tbl[stops] : 42;
    }
    case "PUR":
      return Math.min(42, Math.round(17 + (25 * stops) / 15));
    case "YEL":
      return Math.min(45, Math.round(15 + (30 * stops) / 22));
    case "PNK":
      return Math.min(45, Math.round(15 + (30 * stops) / 26));
    case "ARL": {
      const tbl = [0, 15, 20, 25, 30, 35, 40, 45];
      return stops < tbl.length ? tbl[stops] : 45;
    }
    case "RDD":
      return Math.min(42, Math.round(12 + (30 * stops) / 9));
    case "RDL":
      return Math.min(42, Math.round(12 + (30 * stops) / 3));
    default:
      return Math.round(15 + stops * 2);
  }
}

/**
 * Calculate fare for a route by looking up fare_matrix for each segment.
 * Each segment is a contiguous journey on one line.
 */
export function calculateFare(
  segments: RouteSegmentRaw[],
  fareMatrix: FareMatrix[],
  lines: Line[],
  operators: Operator[],
): FareResult {
  const lineMap = new Map(lines.map((l) => [l.id, l]));
  const operatorMap = new Map(operators.map((o) => [o.id, o]));

  // Build fare lookup: line_id:from_id:to_id -> fare
  const fareLookup = new Map<string, number>();
  for (const fm of fareMatrix) {
    const key = `${fm.line_id}:${fm.from_station_id}:${fm.to_station_id}`;
    fareLookup.set(key, fm.fare);
    // Also reverse direction
    const reverseKey = `${fm.line_id}:${fm.to_station_id}:${fm.from_station_id}`;
    if (!fareLookup.has(reverseKey)) {
      fareLookup.set(reverseKey, fm.fare);
    }
  }

  const fareSegments: FareSegmentResult[] = [];
  let totalFare = 0;

  for (const segment of segments) {
    if (segment.stationIds.length < 2) continue;

    const fromStationId = segment.stationIds[0];
    const toStationId = segment.stationIds[segment.stationIds.length - 1];
    const line = lineMap.get(segment.lineId);
    const operator = line ? operatorMap.get(line.operator_id) : undefined;

    const key = `${segment.lineId}:${fromStationId}:${toStationId}`;
    const exactFare = fareLookup.get(key);
    const stops = segment.stationIds.length - 1;
    const isEstimated = exactFare === undefined;
    const fare = exactFare ?? estimateFare(line?.code ?? "", stops);

    fareSegments.push({
      lineId: segment.lineId,
      lineName: line ? line.name_th : "Unknown",
      operatorCode: operator ? operator.code : "Unknown",
      fare,
      isEstimated,
      fromStationId,
      toStationId,
    });

    totalFare += fare;
  }

  return {
    segments: fareSegments,
    totalFare,
  };
}
