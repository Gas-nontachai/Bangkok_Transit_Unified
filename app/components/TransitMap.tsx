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

interface LeafletLayer {
  addTo(map: LeafletMapLike): LeafletLayer;
  bindTooltip(content: string, options: object): LeafletLayer;
}

interface LeafletMapLike {
  removeLayer(layer: unknown): void;
  fitBounds(
    bounds: LatLngTuple[],
    options: { padding: [number, number] },
  ): void;
}

interface LeafletFactoryLike {
  polyline(
    points: LatLngTuple[],
    options: { color: string; weight: number; opacity: number },
  ): LeafletLayer;
  circleMarker(
    point: LatLngTuple,
    options: {
      radius: number;
      fillColor: string;
      color: string;
      weight: number;
      fillOpacity: number;
    },
  ): LeafletLayer;
}

export function TransitMap({
  stations,
  lines,
  stationLines,
  routeSteps,
}: TransitMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);
  const polylineRef = useRef<unknown[]>([]);

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
        circleMarker.bindPopup(
          `<b>${station.name_th}</b><br>${station.name_en}<br><small>${lineNames}</small>`,
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        circleMarker.addTo(map as any);
        markersRef.current.push(circleMarker);
      }

      // Draw route polyline if available
      if (routeSteps && routeSteps.length > 1) {
        drawRoute(L, map);
      }
    };

    const drawRoute = (L: LeafletFactoryLike, mapInstance: LeafletMapLike) => {
      if (!routeSteps) return;

      // Clear existing polylines
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      polylineRef.current.forEach((p) => (mapInstance as any).removeLayer(p));
      polylineRef.current = [];

      const stationMap = new Map(stations.map((s) => [s.id, s]));

      // Group steps by line segment and draw colored polylines
      let currentLineId: string | null = null;
      let currentPoints: [number, number][] = [];

      const flushPolyline = () => {
        if (currentPoints.length > 1 && currentLineId) {
          const line = lines.find((l) => l.id === currentLineId);
          const color = line?.color || "#6B7280";
          const polyline = L.polyline(currentPoints, {
            color,
            weight: 5,
            opacity: 0.8,
          }).addTo(mapInstance);
          polylineRef.current.push(polyline);
        }
      };

      for (const step of routeSteps) {
        if (step.isTransfer) {
          flushPolyline();
          currentPoints = [];
          currentLineId = null;
          continue;
        }
        const station = stationMap.get(step.stationId);
        if (!station) continue;

        if (step.lineId !== currentLineId) {
          flushPolyline();
          const lastPoint = currentPoints[currentPoints.length - 1];
          currentPoints = lastPoint ? [lastPoint] : [];
          currentLineId = step.lineId;
        }
        currentPoints.push([station.lat, station.lng]);
      }
      flushPolyline();

      const originStation = stations.find(
        (s) => s.id === routeSteps[0].stationId,
      );
      const destStation = stations.find(
        (s) => s.id === routeSteps[routeSteps.length - 1].stationId,
      );

      if (originStation) {
        const m = L.circleMarker([originStation.lat, originStation.lng], {
          radius: 10,
          fillColor: "#22c55e",
          color: "#ffffff",
          weight: 2,
          fillOpacity: 1,
        })
          .addTo(mapInstance)
          .bindTooltip(`🟢 ${originStation.name_th}`, {
            permanent: true,
            direction: "top",
            offset: [0, -8],
          });
        polylineRef.current.push(m);
      }

      if (destStation) {
        const m = L.circleMarker([destStation.lat, destStation.lng], {
          radius: 10,
          fillColor: "#ef4444",
          color: "#ffffff",
          weight: 2,
          fillOpacity: 1,
        })
          .addTo(mapInstance)
          .bindTooltip(`🔴 ${destStation.name_th}`, {
            permanent: true,
            direction: "top",
            offset: [0, -8],
          });
        polylineRef.current.push(m);
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
