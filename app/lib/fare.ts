import type { FareMatrix, Line, Operator } from "./types";
import type { RouteSegmentRaw } from "./dijkstra";

export interface FareSegmentResult {
  lineId: string;
  lineName: string;
  operatorCode: string;
  fare: number;
  fromStationId: string;
  toStationId: string;
}

export interface FareResult {
  segments: FareSegmentResult[];
  totalFare: number;
}

/**
 * Calculate fare for a route by looking up fare_matrix for each segment.
 * Each segment is a contiguous journey on one line.
 */
export function calculateFare(
  segments: RouteSegmentRaw[],
  fareMatrix: FareMatrix[],
  lines: Line[],
  operators: Operator[]
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
    let fare = fareLookup.get(key) ?? 0;

    fareSegments.push({
      lineId: segment.lineId,
      lineName: line ? line.name_th : "Unknown",
      operatorCode: operator ? operator.code : "Unknown",
      fare,
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
