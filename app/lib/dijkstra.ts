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
  totalTime: number;
  lineId: string | null;
  path: PathStep[];
}

/**
 * Dijkstra's shortest path algorithm for transit routing.
 * Returns the path with minimum travel time (including transfer time).
 */
export function findShortestPath(
  graph: AdjacencyList,
  fromStationId: string,
  toStationId: string
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

  // Priority queue: [totalTime, stationId, lineId, path]
  const visited = new Map<string, number>(); // stationId -> best time
  const queue: QueueItem[] = [
    {
      stationId: fromStationId,
      totalTime: 0,
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
    // Get item with minimum total time (simple linear scan - sufficient for ~200 nodes)
    let minIdx = 0;
    for (let i = 1; i < queue.length; i++) {
      if (queue[i].totalTime < queue[minIdx].totalTime) {
        minIdx = i;
      }
    }
    const current = queue.splice(minIdx, 1)[0];

    if (current.stationId === toStationId) {
      return {
        steps: current.path,
        totalTimeMin: current.totalTime,
        found: true,
      };
    }

    const stateKey = current.stationId;
    if (visited.has(stateKey) && visited.get(stateKey)! <= current.totalTime) {
      continue;
    }
    visited.set(stateKey, current.totalTime);

    const neighbors = graph.get(current.stationId) || [];
    for (const neighbor of neighbors) {
      const neighborKey = neighbor.neighbor;
      const newTime = current.totalTime + neighbor.travelTimeMin;

      if (visited.has(neighborKey) && visited.get(neighborKey)! <= newTime) {
        continue;
      }

      const newPath: PathStep[] = [
        ...current.path,
        {
          stationId: neighbor.neighbor,
          lineId: neighbor.lineId,
          travelTimeMin: neighbor.travelTimeMin,
          isTransfer: neighbor.isTransfer,
        },
      ];

      queue.push({
        stationId: neighbor.neighbor,
        totalTime: newTime,
        lineId: neighbor.lineId,
        path: newPath,
      });
    }
  }

  return { steps: [], totalTimeMin: 0, found: false };
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
      // Transfer segment (walking between stations)
      segments.push({
        lineId: step.lineId || "",
        stationIds: [currentStations[currentStations.length - 1], step.stationId],
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
