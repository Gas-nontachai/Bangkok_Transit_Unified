import { describe, it, expect } from "vitest";
import { calculateFare } from "./fare";
import type { FareMatrix, Line, Operator } from "./types";
import type { RouteSegmentRaw } from "./dijkstra";

const operators: Operator[] = [
  { id: "op1", name_th: "BTS", name_en: "BTS", code: "BTS" },
  { id: "op2", name_th: "MRT", name_en: "MRT", code: "MRT" },
];

const lines: Line[] = [
  { id: "L1", operator_id: "op1", name_th: "สุขุมวิท", name_en: "Sukhumvit", code: "SUK", color: "#00843D" },
  { id: "L2", operator_id: "op2", name_th: "สีน้ำเงิน", name_en: "Blue", code: "BLU", color: "#1E3A8A" },
];

const fareMatrix: FareMatrix[] = [
  { id: "f1", line_id: "L1", from_station_id: "A", to_station_id: "C", fare: 30 },
  { id: "f2", line_id: "L2", from_station_id: "D", to_station_id: "F", fare: 25 },
];

describe("calculateFare", () => {
  it("calculates fare for single line journey", () => {
    const segments: RouteSegmentRaw[] = [
      { lineId: "L1", stationIds: ["A", "B", "C"], isTransfer: false },
    ];
    const result = calculateFare(segments, fareMatrix, lines, operators);
    expect(result.totalFare).toBe(30);
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].operatorCode).toBe("BTS");
  });

  it("calculates fare for cross-system journey (BTS + MRT)", () => {
    const segments: RouteSegmentRaw[] = [
      { lineId: "L1", stationIds: ["A", "B", "C"], isTransfer: false },
      { lineId: "L2", stationIds: ["D", "E", "F"], isTransfer: false },
    ];
    const result = calculateFare(segments, fareMatrix, lines, operators);
    expect(result.totalFare).toBe(55); // 30 + 25
    expect(result.segments).toHaveLength(2);
    expect(result.segments[0].operatorCode).toBe("BTS");
    expect(result.segments[1].operatorCode).toBe("MRT");
  });

  it("returns estimated fare with isEstimated=true when fare matrix entry not found", () => {
    const segments: RouteSegmentRaw[] = [
      { lineId: "L1", stationIds: ["X", "Y", "Z"], isTransfer: false },
    ];
    const result = calculateFare(segments, fareMatrix, lines, operators);
    // SUK line, 2 stops: estimated = round(17 + 48 * 2/46) = round(17 + 2.09) = 19
    expect(result.segments[0].isEstimated).toBe(true);
    expect(result.totalFare).toBeGreaterThan(0); // uses estimate, not 0
  });

  it("handles reverse direction fare lookup", () => {
    const segments: RouteSegmentRaw[] = [
      { lineId: "L1", stationIds: ["C", "B", "A"], isTransfer: false },
    ];
    const result = calculateFare(segments, fareMatrix, lines, operators);
    // Should find fare for C->A using reverse of A->C
    expect(result.totalFare).toBe(30);
  });
});
