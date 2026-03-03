import { useState, useMemo } from "react";
import type { Route } from "./+types/home";
import { supabase } from "~/lib/supabase.server";
import type {
  Operator,
  Line,
  Station,
  StationLine,
  Edge,
  FareMatrix,
  RouteResult,
  RouteStep,
  RouteSegment,
} from "~/lib/types";
import { buildAdjacencyList } from "~/lib/graph";
import { findAlternativePaths, extractSegments } from "~/lib/dijkstra";
import { calculateFare } from "~/lib/fare";
import { StationPicker } from "~/components/StationPicker";
import { RouteResultDisplay } from "~/components/RouteResult";
import type { FareResult } from "~/lib/fare";

export interface RouteOption {
  routeResult: RouteResult;
  fareResult: FareResult;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Bangkok Transit Unified" },
    {
      name: "description",
      content: "วางแผนเส้นทางรถไฟฟ้ากรุงเทพฯ ทุกระบบในที่เดียว",
    },
  ];
}

export async function loader({}: Route.LoaderArgs) {
  try {
    const [
      { data: operators, error: opErr },
      { data: lines, error: lineErr },
      { data: stations, error: stErr },
      { data: stationLines, error: slErr },
      { data: edges, error: edgeErr },
      { data: fareMatrix, error: fareErr },
    ] = await Promise.all([
      supabase.from("operators").select("*"),
      supabase.from("lines").select("*"),
      supabase.from("stations").select("*"),
      supabase.from("station_lines").select("*"),
      supabase.from("edges").select("*"),
      supabase.from("fare_matrix").select("*"),
    ]);

    if (opErr || lineErr || stErr || slErr || edgeErr || fareErr) {
      console.error("Loader errors:", { opErr, lineErr, stErr, slErr, edgeErr, fareErr });
    }

    return {
      operators: (operators as Operator[]) || [],
      lines: (lines as Line[]) || [],
      stations: (stations as Station[]) || [],
      stationLines: (stationLines as StationLine[]) || [],
      edges: (edges as Edge[]) || [],
      fareMatrix: (fareMatrix as FareMatrix[]) || [],
      error: null,
    };
  } catch (err) {
    console.error("Failed to load transit data:", err);
    return {
      operators: [],
      lines: [],
      stations: [],
      stationLines: [],
      edges: [],
      fareMatrix: [],
      error: "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
    };
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { operators, lines, stations, stationLines, edges, fareMatrix, error } =
    loaderData;

  const [origin, setOrigin] = useState<Station | null>(null);
  const [destination, setDestination] = useState<Station | null>(null);
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [pathSteps, setPathSteps] = useState<import("~/lib/dijkstra").PathStep[]>([]);

  // Build adjacency list once
  const graph = useMemo(() => buildAdjacencyList(edges), [edges]);

  const stationMap = useMemo(
    () => new Map(stations.map((s) => [s.id, s])),
    [stations]
  );
  const lineMap = useMemo(() => new Map(lines.map((l) => [l.id, l])), [lines]);

  const handleSwap = () => {
    setOrigin(destination);
    setDestination(origin);
    setRouteOptions([]);
    setSearchError(null);
  };

  const handleSearch = () => {
    if (!origin || !destination) return;
    setIsSearching(true);
    setSearchError(null);

    try {
      const results = findAlternativePaths(graph, origin.id, destination.id);

      if (results.length === 0) {
        setSearchError("ไม่พบเส้นทางที่เชื่อมสถานีนี้");
        setRouteOptions([]);
        setPathSteps([]);
        return;
      }

      // Use the first (fastest) result for map highlighting
      setPathSteps(results[0].steps);

      // Build RouteOption for each alternative
      const options: RouteOption[] = results.map((result) => {
        const steps: RouteStep[] = result.steps.map((step) => {
          const station = stationMap.get(step.stationId)!;
          const line = step.lineId ? lineMap.get(step.lineId) || null : null;
          return { station, line, is_transfer: step.isTransfer, travel_time_min: step.travelTimeMin };
        });

        const rawSegments = extractSegments(result.steps);
        const fare = calculateFare(rawSegments, fareMatrix, lines, operators);

        const segments: RouteSegment[] = rawSegments.map((seg) => {
          const line = lineMap.get(seg.lineId)!;
          const operator = operators.find((o) => o.id === line?.operator_id)!;
          const fareSeg = fare.segments.find((f) => f.lineId === seg.lineId);
          return {
            line,
            operator,
            stations: seg.stationIds.map((id) => stationMap.get(id)!).filter(Boolean),
            fare: fareSeg?.fare || 0,
          };
        });

        return {
          routeResult: { steps, segments, total_time_min: result.totalTimeMin, total_fare: fare.totalFare },
          fareResult: fare,
        };
      });

      // Sort by fare ascending (cheapest first)
      options.sort((a, b) => a.fareResult.totalFare - b.fareResult.totalFare);
      setRouteOptions(options);
    } catch (err) {
      console.error("Route search error:", err);
      setSearchError("เกิดข้อผิดพลาดในการค้นหาเส้นทาง");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50">
      {/* Side Panel */}
      <div className="w-full md:w-96 md:flex-shrink-0 bg-white shadow-lg overflow-y-auto z-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-4">
          <h1 className="text-lg font-bold">🚇 Bangkok Transit Unified</h1>
          <p className="text-xs text-blue-100 mt-0.5">
            วางแผนเส้นทางรถไฟฟ้ากรุงเทพฯ ทุกระบบ
          </p>
        </div>

        {error && (
          <div className="m-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* Station Pickers */}
        <div className="p-4 space-y-3">
          <StationPicker
            stations={stations}
            lines={lines}
            stationLines={stationLines}
            operators={operators}
            label="🟢 ต้นทาง"
            value={origin}
            onChange={setOrigin}
          />

          {/* Swap button */}
          <div className="flex justify-center">
            <button
              onClick={handleSwap}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              title="สลับสถานี"
            >
              ⇅
            </button>
          </div>

          <StationPicker
            stations={stations}
            lines={lines}
            stationLines={stationLines}
            operators={operators}
            label="🔴 ปลายทาง"
            value={destination}
            onChange={setDestination}
          />

          <button
            onClick={handleSearch}
            disabled={!origin || !destination || isSearching}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSearching ? "กำลังค้นหา..." : "🔍 ค้นหาเส้นทาง"}
          </button>
        </div>

        {/* Route Result */}
        <div className="px-4 pb-4">
          <RouteResultDisplay
            routeOptions={routeOptions}
            stations={stations}
            lines={lines}
            isLoading={isSearching}
            error={searchError}
          />
        </div>

        {/* Stats footer */}
        {stations.length > 0 && (
          <div className="px-4 pb-4 text-xs text-gray-400 text-center">
            {stations.length} สถานี · {lines.length} สาย · {operators.length} ระบบ
          </div>
        )}
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        <MapWrapper
          stations={stations}
          lines={lines}
          stationLines={stationLines}
          routeSteps={pathSteps}
        />
      </div>
    </div>
  );
}

// Lazy-load the map to avoid SSR issues with Leaflet
function MapWrapper({
  stations,
  lines,
  stationLines,
  routeSteps,
}: {
  stations: Station[];
  lines: Line[];
  stationLines: StationLine[];
  routeSteps: import("~/lib/dijkstra").PathStep[];
}) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<{
    stations: Station[];
    lines: Line[];
    stationLines: StationLine[];
    routeSteps?: import("~/lib/dijkstra").PathStep[];
  }> | null>(null);

  useMemo(() => {
    if (typeof window !== "undefined") {
      import("~/components/TransitMap").then((mod) => {
        setMapComponent(() => mod.TransitMap);
      });
    }
  }, []);

  if (!MapComponent) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <span className="text-gray-400">กำลังโหลดแผนที่...</span>
      </div>
    );
  }

  return (
    <MapComponent
      stations={stations}
      lines={lines}
      stationLines={stationLines}
      routeSteps={routeSteps.length > 0 ? routeSteps : undefined}
    />
  );
}

