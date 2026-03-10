import { useState, useMemo, useEffect, useRef } from "react";
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
import { MapToggleFAB } from "~/components/MapToggleFAB";
import type { FareResult } from "~/lib/fare";

import type { PathStep } from "~/lib/dijkstra";

export interface RouteOption {
  routeResult: RouteResult;
  fareResult: FareResult;
  pathSteps: PathStep[];
}

const DEFAULT_ORIGIN_COLOR = "#22c55e";
const DEFAULT_DESTINATION_COLOR = "#ef4444";

function getFirstPathLineColor(pathSteps: PathStep[] | undefined, lines: Line[]): string {
  if (!pathSteps) return DEFAULT_ORIGIN_COLOR;

  for (const step of pathSteps) {
    if (!step.isTransfer && step.lineId) {
      return lines.find((line) => line.id === step.lineId)?.color || DEFAULT_ORIGIN_COLOR;
    }
  }

  return DEFAULT_ORIGIN_COLOR;
}

function getLastPathLineColor(pathSteps: PathStep[] | undefined, lines: Line[]): string {
  if (!pathSteps) return DEFAULT_DESTINATION_COLOR;

  for (let i = pathSteps.length - 1; i >= 0; i--) {
    const step = pathSteps[i];
    if (!step.isTransfer && step.lineId) {
      return lines.find((line) => line.id === step.lineId)?.color || DEFAULT_DESTINATION_COLOR;
    }
  }

  return DEFAULT_DESTINATION_COLOR;
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

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const initialFromId = url.searchParams.get("from") || null;
  const initialToId = url.searchParams.get("to") || null;
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
      console.error("Loader errors:", {
        opErr,
        lineErr,
        stErr,
        slErr,
        edgeErr,
        fareErr,
      });
    }

    return {
      operators: (operators as Operator[]) || [],
      lines: (lines as Line[]) || [],
      stations: (stations as Station[]) || [],
      stationLines: (stationLines as StationLine[]) || [],
      edges: (edges as Edge[]) || [],
      fareMatrix: (fareMatrix as FareMatrix[]) || [],
      initialFromId,
      initialToId,
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
      initialFromId: null,
      initialToId: null,
      error: "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
    };
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const {
    operators,
    lines,
    stations,
    stationLines,
    edges,
    fareMatrix,
    initialFromId,
    initialToId,
    error,
  } = loaderData;

  const [origin, setOrigin] = useState<Station | null>(null);
  const [destination, setDestination] = useState<Station | null>(null);
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [pathSteps, setPathSteps] = useState<PathStep[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(true);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const autoSearchedRef = useRef(false);

  // Build adjacency list once
  const graph = useMemo(() => buildAdjacencyList(edges), [edges]);

  const stationMap = useMemo(
    () => new Map(stations.map((s) => [s.id, s])),
    [stations],
  );
  const lineMap = useMemo(() => new Map(lines.map((l) => [l.id, l])), [lines]);
  const activePathSteps = routeOptions[activeRouteIndex]?.pathSteps;
  const originRouteColor = getFirstPathLineColor(activePathSteps, lines);
  const destinationRouteColor = getLastPathLineColor(activePathSteps, lines);

  // Initialise origin/destination from URL params and auto-search once
  useEffect(() => {
    if (!initialFromId || !initialToId || autoSearchedRef.current) return;
    const from = stationMap.get(initialFromId);
    const to = stationMap.get(initialToId);
    if (from && to) {
      setOrigin(from);
      setDestination(to);
      autoSearchedRef.current = true;
    }
  }, [initialFromId, initialToId, stationMap]);

  // Auto-search when both stations are set from URL params
  useEffect(() => {
    if (
      autoSearchedRef.current &&
      origin &&
      destination &&
      routeOptions.length === 0 &&
      !isSearching
    ) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination]);

  const updateUrl = (from: Station | null, to: Station | null) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (from) params.set("from", from.id);
    if (to) params.set("to", to.id);
    const search = params.toString();
    window.history.replaceState(null, "", search ? `?${search}` : "/");
  };

  const handleSwap = () => {
    const newOrigin = destination;
    const newDest = origin;
    setOrigin(newOrigin);
    setDestination(newDest);
    setRouteOptions([]);
    setActiveRouteIndex(0);
    setPathSteps([]);
    setSearchError(null);
    setSearchExpanded(true);
    setShowSharePanel(false);
    updateUrl(newOrigin, newDest);
  };

  const handleReset = () => {
    setOrigin(null);
    setDestination(null);
    setRouteOptions([]);
    setActiveRouteIndex(0);
    setPathSteps([]);
    setSearchError(null);
    setSearchExpanded(true);
    setShowSharePanel(false);
    setCopySuccess(false);
    updateUrl(null, null);
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
      setActiveRouteIndex(0);

      // Build RouteOption for each alternative
      const options: RouteOption[] = results.map((result) => {
        const steps: RouteStep[] = result.steps.map((step) => {
          const station = stationMap.get(step.stationId)!;
          const line = step.lineId ? lineMap.get(step.lineId) || null : null;
          return {
            station,
            line,
            is_transfer: step.isTransfer,
            travel_time_min: step.travelTimeMin,
          };
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
            stations: seg.stationIds
              .map((id) => stationMap.get(id)!)
              .filter(Boolean),
            fare: fareSeg?.fare || 0,
          };
        });

        return {
          routeResult: {
            steps,
            segments,
            total_time_min: result.totalTimeMin,
            total_fare: fare.totalFare,
          },
          fareResult: fare,
          pathSteps: result.steps,
        };
      });

      // Sort by fare ascending (cheapest first)
      options.sort((a, b) => a.fareResult.totalFare - b.fareResult.totalFare);
      setRouteOptions(options);
      // Map shows cheapest (first after sort) by default
      setPathSteps(options[0].pathSteps);
      // Collapse pickers to give more room to results
      setSearchExpanded(false);
      // Update URL for sharing
      updateUrl(origin, destination);
    } catch (err) {
      console.error("Route search error:", err);
      setSearchError("เกิดข้อผิดพลาดในการค้นหาเส้นทาง");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-gray-50">
      {/* Side Panel — full screen on mobile, fixed width on desktop */}
      <div className="w-full md:w-96 md:flex-shrink-0 bg-white md:shadow-lg overflow-y-auto z-10 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-4 flex-shrink-0">
          <h1 className="text-lg font-bold">🚇 Bangkok Transit Unified</h1>
          <p className="text-xs text-blue-100 mt-0.5">
            วางแผนเส้นทางรถไฟฟ้ากรุงเทพฯ ทุกระบบ
          </p>
        </div>

        {error && (
          <div className="m-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex-shrink-0">
            ⚠️ {error}
          </div>
        )}

        {/* Compact search bar — shown after search (mobile + desktop) */}
        {!searchExpanded && routeOptions.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50 flex-shrink-0">
            <div className="flex-1 flex items-center gap-1.5 text-sm min-w-0 overflow-hidden">
              <span
                className="font-semibold truncate max-w-[40%]"
                style={{ color: originRouteColor }}
              >
                ⬤ {origin?.name_th}
              </span>
              <span className="text-gray-400 flex-shrink-0">→</span>
              <span
                className="font-semibold truncate max-w-[40%]"
                style={{ color: destinationRouteColor }}
              >
                ⬤ {destination?.name_th}
              </span>
            </div>
            <button
              onClick={() => setSearchExpanded(true)}
              className="flex-shrink-0 px-3 py-1.5 text-xs text-blue-600 border border-blue-200 rounded-full hover:bg-blue-50 transition-colors"
              aria-label="เปลี่ยนสถานี"
            >
              ✏️ เปลี่ยน
            </button>
            <button
              onClick={handleReset}
              className="flex-shrink-0 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="รีเซ็ตเส้นทาง"
            >
              ↺ รีเซ็ต
            </button>
          </div>
        )}

        {/* Station Pickers — hidden when compact */}
        <div
          className={`p-4 space-y-3 flex-shrink-0 ${!searchExpanded && routeOptions.length > 0 ? "hidden" : ""}`}
        >
          <StationPicker
            stations={stations}
            lines={lines}
            stationLines={stationLines}
            label="🟢 ต้นทาง"
            value={origin}
            onChange={setOrigin}
            testId="picker-origin"
          />

          {/* Swap button */}
          <div className="flex justify-center">
            <button
              onClick={handleSwap}
              className="p-3 rounded-full hover:bg-gray-100 text-gray-500 transition-colors text-lg"
              title="สลับสถานี"
              aria-label="สลับสถานีต้นทางและปลายทาง"
            >
              ⇅
            </button>
          </div>

          <StationPicker
            stations={stations}
            lines={lines}
            stationLines={stationLines}
            label="🔴 ปลายทาง"
            value={destination}
            onChange={setDestination}
            testId="picker-destination"
          />

          {/* Search button */}
          <div className="md:block">
            <button
              onClick={handleSearch}
              disabled={!origin || !destination || isSearching}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base"
              data-testid="search-button"
            >
              {isSearching ? "กำลังค้นหา..." : "🔍 ค้นหาเส้นทาง"}
            </button>
          </div>
          {(origin || destination || routeOptions.length > 0) && (
            <button
              onClick={handleReset}
              className="w-full py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              aria-label="รีเซ็ตเส้นทาง"
            >
              ↺ รีเซ็ตการเลือก
            </button>
          )}
        </div>

        {/* Route Result — scrollable on mobile */}
        <div className="px-4 pb-24 md:pb-4 flex-1 overflow-y-auto">
          {/* Share button — shown when results are available */}
          {routeOptions.length > 0 && (
            <div className="mb-3">
              <button
                onClick={() => setShowSharePanel((v) => !v)}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                aria-label="แชร์เส้นทาง"
              >
                📤 แชร์เส้นทางนี้
              </button>
              {showSharePanel && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1.5">ลิงก์สำหรับแชร์</p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={
                        typeof window !== "undefined" ? window.location.href : ""
                      }
                      className="flex-1 text-xs bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-700 overflow-hidden text-ellipsis"
                      onFocus={(e) => e.target.select()}
                    />
                    <button
                      onClick={() => {
                        if (typeof navigator !== "undefined") {
                          navigator.clipboard
                            .writeText(window.location.href)
                            .then(() => {
                              setCopySuccess(true);
                              setTimeout(() => setCopySuccess(false), 2000);
                            });
                        }
                      }}
                      className={`flex-shrink-0 px-3 py-1.5 text-xs rounded font-medium transition-colors ${
                        copySuccess
                          ? "bg-green-500 text-white"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {copySuccess ? "✅ คัดลอกแล้ว!" : "📋 คัดลอก"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <RouteResultDisplay
            routeOptions={routeOptions}
            activeIndex={activeRouteIndex}
            onSelectRoute={(idx) => {
              setActiveRouteIndex(idx);
              setPathSteps(routeOptions[idx].pathSteps);
            }}
            stations={stations}
            lines={lines}
            isLoading={isSearching}
            error={searchError}
          />
        </div>

        {/* Stats footer */}
        {stations.length > 0 && (
          <div className="px-4 py-2 text-xs text-gray-400 text-center flex-shrink-0 border-t border-gray-100">
            {stations.length} สถานี · {lines.length} สาย · {operators.length}{" "}
            ระบบ
          </div>
        )}
      </div>

      {/* Map Area — hidden on mobile by default, shown as overlay when toggled */}
      {/* Desktop: normal flex-1 */}
      <div className="hidden md:flex flex-1 relative">
        <MapWrapper
          stations={stations}
          lines={lines}
          stationLines={stationLines}
          routeSteps={pathSteps}
        />
      </div>

      {/* Mobile map overlay */}
      {showMap && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-white flex flex-col"
          data-testid="map-overlay"
        >
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0">
            <span className="font-semibold text-gray-800">
              🗺️ แผนที่เส้นทาง
            </span>
            <button
              onClick={() => setShowMap(false)}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 text-lg font-bold"
              aria-label="ปิดแผนที่"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 relative">
            <MapWrapper
              stations={stations}
              lines={lines}
              stationLines={stationLines}
              routeSteps={pathSteps}
            />
          </div>
        </div>
      )}

      {/* FAB map toggle (mobile only) */}
      <MapToggleFAB
        showMap={showMap}
        onToggle={() => setShowMap((v) => !v)}
        hasRoute={routeOptions.length > 0}
      />
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
