import { describe, it, expect } from "vitest";
import { buildAdjacencyList } from "./graph";
import type { Edge } from "./types";

const mockEdges: Edge[] = [
  {
    id: "e1",
    from_station_id: "A",
    to_station_id: "B",
    line_id: "L1",
    travel_time_min: 2,
    is_transfer: false,
  },
  {
    id: "e2",
    from_station_id: "B",
    to_station_id: "C",
    line_id: "L1",
    travel_time_min: 3,
    is_transfer: false,
  },
  {
    id: "e3",
    from_station_id: "C",
    to_station_id: "D",
    line_id: "L2",
    travel_time_min: 5,
    is_transfer: true,
  },
];

describe("buildAdjacencyList", () => {
  it("builds bidirectional edges", () => {
    const graph = buildAdjacencyList(mockEdges);

    expect(graph.has("A")).toBe(true);
    expect(graph.has("B")).toBe(true);
    expect(graph.has("C")).toBe(true);

    // A -> B
    const aNeighbors = graph.get("A")!;
    expect(aNeighbors).toHaveLength(1);
    expect(aNeighbors[0].neighbor).toBe("B");
    expect(aNeighbors[0].lineId).toBe("L1");
    expect(aNeighbors[0].travelTimeMin).toBe(2);

    // B -> A and B -> C (bidirectional)
    const bNeighbors = graph.get("B")!;
    expect(bNeighbors).toHaveLength(2);
    const bNeighborIds = bNeighbors.map((n) => n.neighbor);
    expect(bNeighborIds).toContain("A");
    expect(bNeighborIds).toContain("C");
  });

  it("marks transfer edges correctly", () => {
    const graph = buildAdjacencyList(mockEdges);
    const cNeighbors = graph.get("C")!;
    const dEdge = cNeighbors.find((n) => n.neighbor === "D");
    expect(dEdge?.isTransfer).toBe(true);
  });

  it("returns empty map for no edges", () => {
    const graph = buildAdjacencyList([]);
    expect(graph.size).toBe(0);
  });
});
