import { useEffect, useRef } from "react";
import type { Station, Line, StationLine } from "~/lib/types";
import type { PathStep } from "~/lib/dijkstra";

interface TransitMapProps {
  stations: Station[];
  lines: Line[];
  stationLines: StationLine[];
  routeSteps?: PathStep[];
  originStation?: Station | null;
  destinationStation?: Station | null;
}

type LatLngTuple = [number, number];

interface LeafletLayerLike {
  addTo(map: any): LeafletLayerLike;
  bindPopup(content: string): LeafletLayerLike;
  bindTooltip(content: string, options: object): LeafletLayerLike;
  closePopup(): LeafletLayerLike;
  off(event: string): LeafletLayerLike;
  on(event: string, handler: () => void): LeafletLayerLike;
  openPopup(): LeafletLayerLike;
  setStyle(style: { opacity?: number; weight?: number }): void;
}

interface BasePolylineEntry {
  polyline: LeafletLayerLike;
  lineId: string;
}

interface RouteStopMarker {
  station: Station;
  line: Line | null;
}

const DEFAULT_DESTINATION_COLOR = "#ef4444";
const DEFAULT_ORIGIN_COLOR = "#22c55e";

function getFirstRouteLineColor(routeSteps: PathStep[] | undefined, lines: Line[]): string {
  if (!routeSteps) return DEFAULT_ORIGIN_COLOR;

  for (const step of routeSteps) {
    if (step.isTransfer || !step.lineId) continue;
    return lines.find((line) => line.id === step.lineId)?.color || DEFAULT_ORIGIN_COLOR;
  }

  return DEFAULT_ORIGIN_COLOR;
}

function getLastRouteLineColor(routeSteps: PathStep[] | undefined, lines: Line[]): string {
  if (!routeSteps) return DEFAULT_DESTINATION_COLOR;

  for (let i = routeSteps.length - 1; i >= 0; i--) {
    const step = routeSteps[i];
    if (step.isTransfer || !step.lineId) continue;
    return lines.find((line) => line.id === step.lineId)?.color || DEFAULT_DESTINATION_COLOR;
  }

  return DEFAULT_DESTINATION_COLOR;
}

function getRouteStopMarkers(
  routeSteps: PathStep[] | undefined,
  stations: Station[],
  lines: Line[],
  stationLines: StationLine[],
): RouteStopMarker[] {
  if (!routeSteps) return [];

  const stationMap = new Map(stations.map((station) => [station.id, station]));
  const lineMap = new Map(lines.map((line) => [line.id, line]));
  const stationLineIds = new Map<string, Set<string>>();
  for (const stationLine of stationLines) {
    if (!stationLineIds.has(stationLine.station_id)) {
      stationLineIds.set(stationLine.station_id, new Set());
    }
    stationLineIds.get(stationLine.station_id)!.add(stationLine.line_id);
  }
  const seen = new Set<string>();
  const routeStops: RouteStopMarker[] = [];

  const resolveRouteStopLine = (stepIndex: number): Line | null => {
    const step = routeSteps[stepIndex];
    if (!step) return null;

    if (step.lineId) {
      return lineMap.get(step.lineId) ?? null;
    }

    const stationSupportedLines = stationLineIds.get(step.stationId) ?? new Set<string>();

    for (let i = stepIndex + 1; i < routeSteps.length; i++) {
      const nextStep = routeSteps[i];
      if (nextStep.lineId && stationSupportedLines.has(nextStep.lineId)) {
        return lineMap.get(nextStep.lineId) ?? null;
      }
    }

    for (let i = stepIndex - 1; i >= 0; i--) {
      const previousStep = routeSteps[i];
      if (previousStep.lineId && stationSupportedLines.has(previousStep.lineId)) {
        return lineMap.get(previousStep.lineId) ?? null;
      }
    }

    const firstStationLineId = [...stationSupportedLines][0];
    return firstStationLineId ? lineMap.get(firstStationLineId) ?? null : null;
  };

  for (let i = 0; i < routeSteps.length; i++) {
    const step = routeSteps[i];
    const station = stationMap.get(step.stationId);
    if (!station || seen.has(station.id)) continue;

    seen.add(station.id);
    routeStops.push({
      station,
      line: resolveRouteStopLine(i),
    });
  }

  return routeStops;
}

export function TransitMap({
  stations,
  lines,
  stationLines,
  routeSteps,
}: TransitMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const backgroundMarkersRef = useRef<unknown[]>([]);
  const routeOverlayRef = useRef<unknown[]>([]);
  const basePolylinesRef = useRef<BasePolylineEntry[]>([]);
  const supportsHover =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Build station -> lines lookup
  const stationLineMap = new Map<string, Line[]>();
  for (const sl of stationLines) {
    const line = lines.find((l) => l.id === sl.line_id);
    if (!line) continue;
    if (!stationLineMap.has(sl.station_id))
      stationLineMap.set(sl.station_id, []);
    stationLineMap.get(sl.station_id)!.push(line);
  }

  useEffect(() => {
    // Leaflet requires client-side rendering only
    if (typeof window === "undefined" || !mapRef.current) return;

    let map: unknown;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      // Fix default marker icon path issue with bundlers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapInstanceRef.current as any).remove();
        mapInstanceRef.current = null;
      }

      map = L.map(mapRef.current!).setView([13.7563, 100.5018], 12);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }).addTo(map as any);

      // Build line -> ordered lat/lng coordinates and draw base polylines
      const stationMap = new Map(stations.map((s) => [s.id, s]));
      basePolylinesRef.current = [];
      for (const line of lines) {
        const orderedStationLines = stationLines
          .filter((sl) => sl.line_id === line.id)
          .sort((a, b) => a.sequence_order - b.sequence_order);
        const coords: LatLngTuple[] = orderedStationLines
          .map((sl) => stationMap.get(sl.station_id))
          .filter(Boolean)
          .map((s) => [s!.lat, s!.lng]);
        if (coords.length > 1) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pl = L.polyline(coords, { color: line.color, weight: 4, opacity: 0.5 }).addTo(map as any);
          basePolylinesRef.current.push({ polyline: pl, lineId: line.id });
        }
      }

      // Add station markers
      for (const station of stations) {
        const stLines = stationLineMap.get(station.id) || [];
        const primaryColor = stLines[0]?.color || "#6B7280";

        const circleMarker = L.circleMarker([station.lat, station.lng], {
          radius: station.is_interchange ? 6 : 4,
          fillColor: primaryColor,
          color: "#ffffff",
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.9,
        });

        const lineNames = stLines.map((l) => l.name_th).join(", ");
        const popupContent = `<b>${station.name_th}</b><br>${station.name_en}<br><small>${lineNames}</small>`;
        circleMarker.bindPopup(popupContent);

        if (supportsHover) {
          circleMarker
            .off("click")
            .off("keypress")
            .on("mouseover", () => {
              circleMarker.openPopup();
            })
            .on("mouseout", () => {
              circleMarker.closePopup();
            });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        circleMarker.addTo(map as any);
        backgroundMarkersRef.current.push(circleMarker);
      }

      // Draw route polyline if available
      if (routeSteps && routeSteps.length > 1) {
        drawRoute(L, map);
      }
    };

    const drawRoute = (L: any, mapInstance: any) => {
      if (!routeSteps) return;

      // Dim background lines when route is shown
      basePolylinesRef.current.forEach(({ polyline }) => polyline.setStyle({ opacity: 0.15 }));

      // Clear existing route overlays
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      routeOverlayRef.current.forEach((layer) => (mapInstance as any).removeLayer(layer));
      routeOverlayRef.current = [];

      const stationMap = new Map(stations.map((s) => [s.id, s]));
      const routeStops = getRouteStopMarkers(routeSteps, stations, lines, stationLines);

      // Group steps by line segment and draw colored polylines
      let currentLineId: string | null = null;
      let currentPoints: [number, number][] = [];
      let pendingTransferPoint: [number, number] | null = null;

      const flushPolyline = () => {
        if (currentPoints.length > 1 && currentLineId) {
          const line = lines.find((l) => l.id === currentLineId);
          const color = line?.color || "#6B7280";
          const polyline = L.polyline(currentPoints, {
            color,
            weight: 6,
            opacity: 1.0,
          }).addTo(mapInstance);
          routeOverlayRef.current.push(polyline);
        }
      };

      for (const step of routeSteps) {
        if (step.isTransfer) {
          flushPolyline();
          const transferStation = stationMap.get(step.stationId);
          pendingTransferPoint = transferStation
            ? [transferStation.lat, transferStation.lng]
            : null;
          currentPoints = pendingTransferPoint ? [pendingTransferPoint] : [];
          currentLineId = null;
          continue;
        }
        const station = stationMap.get(step.stationId);
        if (!station) continue;

        if (step.lineId !== currentLineId) {
          flushPolyline();
          const lastPoint =
            pendingTransferPoint ?? currentPoints[currentPoints.length - 1];
          currentPoints = lastPoint ? [lastPoint] : [];
          currentLineId = step.lineId;
        }
        currentPoints.push([station.lat, station.lng]);
        pendingTransferPoint = null;
      }
      flushPolyline();

      for (const routeStop of routeStops) {
        const markerColor = routeStop.line?.color || "#6B7280";
        const lineName = routeStop.line?.name_th || "ไม่ทราบสาย";
        const routeStopMarker = L.circleMarker(
          [routeStop.station.lat, routeStop.station.lng],
          {
            radius: routeStop.station.is_interchange ? 8 : 6,
            fillColor: markerColor,
            color: "#ffffff",
            weight: 2.5,
            opacity: 1,
            fillOpacity: 1,
          },
        );

        routeStopMarker.bindPopup(
          `<b>${routeStop.station.name_th}</b><br>${routeStop.station.name_en}<br><small>${lineName}</small>`,
        );

        if (supportsHover) {
          routeStopMarker
            .off("click")
            .off("keypress")
            .on("mouseover", () => {
              routeStopMarker.openPopup();
            })
            .on("mouseout", () => {
              routeStopMarker.closePopup();
            });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        routeStopMarker.addTo(mapInstance as any);
        routeOverlayRef.current.push(routeStopMarker);
      }

      const originStation = stations.find(
        (s) => s.id === routeSteps[0].stationId,
      );
      const destStation = stations.find(
        (s) => s.id === routeSteps[routeSteps.length - 1].stationId,
      );
      const originLineColor = getFirstRouteLineColor(routeSteps, lines);
      const destinationLineColor = getLastRouteLineColor(routeSteps, lines);

      if (originStation) {
        const m = L.circleMarker([originStation.lat, originStation.lng], {
          radius: 10,
          fillColor: originLineColor,
          color: "#ffffff",
          weight: 2,
          fillOpacity: 1,
        })
          .addTo(mapInstance)
          .bindTooltip(
            `<span style="color: ${originLineColor}; font-weight: 600;">⬤ ${originStation.name_th}</span>`,
            {
              permanent: true,
              direction: "top",
              offset: [0, -8],
              className: "origin-tooltip",
            },
          );
        routeOverlayRef.current.push(m);
      }

      if (destStation) {
        const m = L.circleMarker([destStation.lat, destStation.lng], {
          radius: 10,
          fillColor: destinationLineColor,
          color: "#ffffff",
          weight: 2,
          fillOpacity: 1,
        })
          .addTo(mapInstance)
          .bindTooltip(
            `<span style="color: ${destinationLineColor}; font-weight: 600;">⬤ ${destStation.name_th}</span>`,
            {
              permanent: true,
              direction: "top",
              offset: [0, -8],
              className: "destination-tooltip",
            },
          );
        routeOverlayRef.current.push(m);
      }

      // Fit bounds to route
      const routeCoords = routeSteps
        .filter((s) => !s.isTransfer)
        .map((s) => stationMap.get(s.stationId))
        .filter(Boolean)
        .map((s) => [s!.lat, s!.lng] as [number, number]);

      if (routeCoords.length > 1) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapInstance as any).fitBounds(routeCoords, { padding: [40, 40] });
      } else {
        basePolylinesRef.current.forEach(({ polyline }) =>
          polyline.setStyle({ opacity: 0.5 }),
        );
      }
    };

    initMap().catch(console.error);

    return () => {
      if (mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapInstanceRef.current as any).remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stations, lines, stationLines, routeSteps]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full min-h-[400px] rounded-lg"
      style={{ zIndex: 0 }}
    />
  );
}
