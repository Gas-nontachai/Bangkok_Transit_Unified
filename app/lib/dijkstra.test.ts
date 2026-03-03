import { describe, it, expect } from "vitest";
import { findShortestPath, extractSegments } from "./dijkstra";
import { buildAdjacencyList } from "./graph";
import type { Edge } from "./types";

// Mock edges: A-B-C on L1, C-D (transfer), D-E-F on L2
const mockEdges: Edge[] = [
  { id: "e1", from_station_id: "A", to_station_id: "B", line_id: "L1", travel_time_min: 2, is_transfer: false },
  { id: "e2", from_station_id: "B", to_station_id: "C", line_id: "L1", travel_time_min: 3, is_transfer: false },
  { id: "e3", from_station_id: "C", to_station_id: "D", line_id: "TRANSFER", travel_time_min: 5, is_transfer: true },
  { id: "e4", from_station_id: "D", to_station_id: "E", line_id: "L2", travel_time_min: 2, is_transfer: false },
  { id: "e5", from_station_id: "E", to_station_id: "F", line_id: "L2", travel_time_min: 4, is_transfer: false },
];

describe("findShortestPath", () => {
  it("returns same station when origin equals destination", () => {
    const graph = buildAdjacencyList(mockEdges);
    const result = findShortestPath(graph, "A", "A");
    expect(result.found).toBe(true);
    expect(result.totalTimeMin).toBe(0);
    expect(result.steps).toHaveLength(1);
  });

  it("finds path on a single line", () => {
    const graph = buildAdjacencyList(mockEdges);
    const result = findShortestPath(graph, "A", "C");
    expect(result.found).toBe(true);
    expect(result.totalTimeMin).toBe(5); // 2 + 3
    expect(result.steps.map((s) => s.stationId)).toEqual(["A", "B", "C"]);
  });

  it("finds path crossing lines with transfer", () => {
    const graph = buildAdjacencyList(mockEdges);
    const result = findShortestPath(graph, "A", "F");
    expect(result.found).toBe(true);
    expect(result.totalTimeMin).toBe(16); // 2+3+5+2+4
    const stationIds = result.steps.map((s) => s.stationId);
    expect(stationIds).toEqual(["A", "B", "C", "D", "E", "F"]);
  });

  it("returns found=false when no path exists", () => {
    const graph = buildAdjacencyList(mockEdges);
    const result = findShortestPath(graph, "A", "UNKNOWN");
    expect(result.found).toBe(false);
  });

  it("finds shortest path when multiple routes exist", () => {
    const extraEdges: Edge[] = [
      ...mockEdges,
      // Shortcut A -> D directly with higher time
      { id: "e6", from_station_id: "A", to_station_id: "D", line_id: "L3", travel_time_min: 20, is_transfer: true },
    ];
    const graph = buildAdjacencyList(extraEdges);
    const result = findShortestPath(graph, "A", "F");
    // Via A->B->C->D->E->F = 16 min, should prefer this over A->D->E->F = 26 min
    expect(result.totalTimeMin).toBe(16);
  });
});

describe("extractSegments", () => {
  it("extracts single line segment", () => {
    const graph = buildAdjacencyList(mockEdges);
    const result = findShortestPath(graph, "A", "C");
    const segments = extractSegments(result.steps);
    expect(segments).toHaveLength(1);
    expect(segments[0].lineId).toBe("L1");
    expect(segments[0].stationIds).toEqual(["A", "B", "C"]);
  });

  it("extracts multiple segments for cross-line journey", () => {
    const graph = buildAdjacencyList(mockEdges);
    const result = findShortestPath(graph, "A", "F");
    const segments = extractSegments(result.steps);
    expect(segments.length).toBeGreaterThan(0);
    const lineIds = segments.map((s) => s.lineId);
    expect(lineIds).toContain("L1");
    expect(lineIds).toContain("L2");
  });
});
