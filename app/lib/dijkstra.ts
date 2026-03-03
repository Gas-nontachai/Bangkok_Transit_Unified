import type { AdjacencyList } from "./graph";

export interface PathStep {
  stationId: string;
  lineId: string | null; // null for starting station
  travelTimeMin: number;
  isTransfer: boolean;
}

export interface PathResult {
  steps: PathStep[];
  totalTimeMin: number;
  found: boolean;
}

interface QueueItem {
  stationId: string;
  totalTime: number; // penalized time — used only for priority queue ordering
  actualTime: number; // real travel time without penalties
  lineId: string | null;
  path: PathStep[];
}

/**
 * Dijkstra's shortest path algorithm for transit routing.
 * transferPenalty is added per line change to break ties in favor of fewer transfers.
 * The returned totalTimeMin is always the actual travel time, never including penalties.
 */
function dijkstra(
  graph: AdjacencyList,
  fromStationId: string,
  toStationId: string,
  transferPenalty: number,
): PathResult {
  if (fromStationId === toStationId) {
    return {
      steps: [
        {
          stationId: fromStationId,
          lineId: null,
          travelTimeMin: 0,
          isTransfer: false,
        },
      ],
      totalTimeMin: 0,
      found: true,
    };
  }

  const visited = new Map<string, number>();
  const queue: QueueItem[] = [
    {
      stationId: fromStationId,
      totalTime: 0,
      actualTime: 0,
      lineId: null,
      path: [
        {
          stationId: fromStationId,
          lineId: null,
          travelTimeMin: 0,
          isTransfer: false,
        },
      ],
    },
  ];

  while (queue.length > 0) {
    let minIdx = 0;
    for (let i = 1; i < queue.length; i++) {
      if (queue[i].totalTime < queue[minIdx].totalTime) minIdx = i;
    }
    const current = queue.splice(minIdx, 1)[0];

    if (current.stationId === toStationId) {
      return {
        steps: current.path,
        totalTimeMin: current.actualTime,
        found: true,
      };
    }

    const stateKey = current.stationId;
    if (visited.has(stateKey) && visited.get(stateKey)! <= current.totalTime)
      continue;
    visited.set(stateKey, current.totalTime);

    for (const neighbor of graph.get(current.stationId) || []) {
      const neighborKey = neighbor.neighbor;
      const isLineChange =
        neighbor.isTransfer ||
        (current.lineId !== null &&
          neighbor.lineId !== null &&
          neighbor.lineId !== current.lineId);
      const newTime =
        current.totalTime +
        neighbor.travelTimeMin +
        (isLineChange ? transferPenalty : 0);
      const newActualTime = current.actualTime + neighbor.travelTimeMin;

      if (visited.has(neighborKey) && visited.get(neighborKey)! <= newTime)
        continue;

      queue.push({
        stationId: neighborKey,
        totalTime: newTime,
        actualTime: newActualTime,
        lineId: neighbor.lineId,
        path: [
          ...current.path,
          {
            stationId: neighborKey,
            lineId: neighbor.lineId,
            travelTimeMin: neighbor.travelTimeMin,
            isTransfer: neighbor.isTransfer,
          },
        ],
      });
    }
  }

  return { steps: [], totalTimeMin: 0, found: false };
}

/** Get a deduplication key for a route: sorted unique line IDs used (ignoring transfers). */
function routeKey(steps: PathStep[]): string {
  const lines = new Set(
    steps
      .map((s) => s.lineId)
      .filter(
        (l): l is string =>
          l !== null && !steps.find((s) => s.lineId === l && s.isTransfer),
      ),
  );
  return [...lines].sort().join(",");
}

/**
 * Find up to 3 alternative routes by running Dijkstra with different transfer penalties.
 * Results are deduplicated (by line usage) and returned sorted by totalTimeMin ascending.
 */
export function findAlternativePaths(
  graph: AdjacencyList,
  fromStationId: string,
  toStationId: string,
): PathResult[] {
  // Three variants: fastest, fewest-transfers, balanced
  const penalties = [0.01, 1000, 0.5];
  const seen = new Set<string>();
  const results: PathResult[] = [];

  for (const penalty of penalties) {
    const result = dijkstra(graph, fromStationId, toStationId, penalty);
    if (!result.found) continue;
    const key = routeKey(result.steps);
    if (!seen.has(key)) {
      seen.add(key);
      results.push(result);
    }
  }

  // Sort by total time ascending
  results.sort((a, b) => a.totalTimeMin - b.totalTimeMin);
  return results;
}

/**
 * Dijkstra's shortest path algorithm for transit routing.
 * Returns the path with minimum travel time (including transfer time).
 */
export function findShortestPath(
  graph: AdjacencyList,
  fromStationId: string,
  toStationId: string,
): PathResult {
  return dijkstra(graph, fromStationId, toStationId, 0.01);
}

/**
 * Extract route segments grouped by line from path steps.
 * Returns array of { lineId, stationIds } for fare calculation.
 */
export interface RouteSegmentRaw {
  lineId: string;
  stationIds: string[];
  isTransfer: boolean;
}

export function extractSegments(steps: PathStep[]): RouteSegmentRaw[] {
  if (steps.length === 0) return [];

  const segments: RouteSegmentRaw[] = [];
  let currentLineId: string | null = null;
  let currentStations: string[] = [steps[0].stationId];

  for (let i = 1; i < steps.length; i++) {
    const step = steps[i];

    if (step.isTransfer) {
      // End current segment and add transfer
      if (currentLineId !== null) {
        segments.push({
          lineId: currentLineId,
          stationIds: [...currentStations],
          isTransfer: false,
        });
      }
      segments.push({
        lineId: step.lineId || "",
        stationIds: [
          currentStations[currentStations.length - 1],
          step.stationId,
        ],
        isTransfer: true,
      });
      currentStations = [step.stationId];
      currentLineId = null;
    } else if (step.lineId !== null && step.lineId !== currentLineId) {
      // Line change
      if (currentLineId !== null && currentStations.length > 1) {
        segments.push({
          lineId: currentLineId,
          stationIds: [...currentStations],
          isTransfer: false,
        });
        currentStations = [currentStations[currentStations.length - 1]];
      }
      currentLineId = step.lineId;
      currentStations.push(step.stationId);
    } else {
      if (step.lineId !== null) currentLineId = step.lineId;
      currentStations.push(step.stationId);
    }
  }

  if (currentLineId !== null && currentStations.length > 1) {
    segments.push({
      lineId: currentLineId,
      stationIds: [...currentStations],
      isTransfer: false,
    });
  }

  return segments.filter((s) => !s.isTransfer);
}
