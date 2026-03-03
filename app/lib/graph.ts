import type { Edge } from "./types";

export interface GraphNode {
  neighbor: string; // station id
  lineId: string;
  travelTimeMin: number;
  isTransfer: boolean;
}

export type AdjacencyList = Map<string, GraphNode[]>;

/**
 * Build an adjacency list from edges data for Dijkstra algorithm.
 * Edges are bidirectional (trains run both ways).
 */
export function buildAdjacencyList(edges: Edge[]): AdjacencyList {
  const graph: AdjacencyList = new Map();

  for (const edge of edges) {
    // Forward direction
    if (!graph.has(edge.from_station_id)) {
      graph.set(edge.from_station_id, []);
    }
    graph.get(edge.from_station_id)!.push({
      neighbor: edge.to_station_id,
      lineId: edge.line_id,
      travelTimeMin: edge.travel_time_min,
      isTransfer: edge.is_transfer,
    });

    // Reverse direction (trains run both ways)
    if (!graph.has(edge.to_station_id)) {
      graph.set(edge.to_station_id, []);
    }
    graph.get(edge.to_station_id)!.push({
      neighbor: edge.from_station_id,
      lineId: edge.line_id,
      travelTimeMin: edge.travel_time_min,
      isTransfer: edge.is_transfer,
    });
  }

  return graph;
}
