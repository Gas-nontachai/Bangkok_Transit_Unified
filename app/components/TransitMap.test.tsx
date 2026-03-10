import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { TransitMap } from "./TransitMap";
import type { Station, Line, StationLine } from "~/lib/types";
import type { PathStep } from "~/lib/dijkstra";

const createdMarkers: ReturnType<typeof createMockMarker>[] = [];

function createMockMarker() {
  return {
    addTo: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
    bindTooltip: vi.fn().mockReturnThis(),
    closePopup: vi.fn().mockReturnThis(),
    off: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    openPopup: vi.fn().mockReturnThis(),
  };
}

// Mock Leaflet since it requires DOM APIs not available in test env
vi.mock("leaflet", () => ({
  default: {
    map: vi.fn(() => ({
      setView: vi.fn().mockReturnThis(),
      remove: vi.fn(),
      fitBounds: vi.fn(),
      removeLayer: vi.fn(),
    })),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    circleMarker: vi.fn(() => {
      const marker = createMockMarker();
      createdMarkers.push(marker);
      return marker;
    }),
    polyline: vi.fn(() => ({
      addTo: vi.fn().mockReturnThis(),
      setStyle: vi.fn(),
    })),
    Icon: {
      Default: {
        prototype: {},
        mergeOptions: vi.fn(),
      },
    },
  },
}));

const mockStations: Station[] = [
  {
    id: "s1",
    name_th: "สยาม",
    name_en: "Siam",
    code: "CEN",
    lat: 13.7453,
    lng: 100.5342,
    is_interchange: true,
  },
];

const mockLines: Line[] = [
  {
    id: "L1",
    operator_id: "op1",
    name_th: "สุขุมวิท",
    name_en: "Sukhumvit",
    code: "SUK",
    color: "#00843D",
  },
];

const mockStationLines: StationLine[] = [
  { station_id: "s1", line_id: "L1", sequence_order: 1 },
];

const mockStations2: Station[] = [
  {
    id: "s1",
    name_th: "สยาม",
    name_en: "Siam",
    code: "CEN",
    lat: 13.7453,
    lng: 100.5342,
    is_interchange: true,
  },
  {
    id: "s2",
    name_th: "อโศก",
    name_en: "Asok",
    code: "E4",
    lat: 13.7362,
    lng: 100.5604,
    is_interchange: true,
  },
];

const mockStationLines2: StationLine[] = [
  { station_id: "s1", line_id: "L1", sequence_order: 1 },
  { station_id: "s2", line_id: "L1", sequence_order: 2 },
];

beforeEach(() => {
  createdMarkers.length = 0;
  vi.clearAllMocks();
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      media: "(hover: hover) and (pointer: fine)",
      onchange: null,
    })),
  });
});

describe("TransitMap", () => {
  it("renders map container", () => {
    const { container } = render(
      <TransitMap
        stations={mockStations}
        lines={mockLines}
        stationLines={mockStationLines}
      />,
    );
    expect(container.querySelector(".min-h-\\[400px\\]")).toBeTruthy();
  });

  it("creates polylines for line data", async () => {
    const L = (await import("leaflet")).default;
    render(
      <TransitMap
        stations={mockStations2}
        lines={mockLines}
        stationLines={mockStationLines2}
      />,
    );
    // Wait for async initMap() to complete and call L.polyline
    await waitFor(() => {
      expect(L.polyline).toHaveBeenCalled();
    });
  });

  it("binds station popups to hover events on hover-capable devices", async () => {
    render(
      <TransitMap
        stations={mockStations}
        lines={mockLines}
        stationLines={mockStationLines}
      />,
    );

    await waitFor(() => {
      expect(createdMarkers).toHaveLength(1);
    });

    const marker = createdMarkers[0];
    expect(marker.bindPopup).toHaveBeenCalledWith(
      "<b>สยาม</b><br>Siam<br><small>สุขุมวิท</small>",
    );
    expect(marker.off).toHaveBeenCalledWith("click");
    expect(marker.off).toHaveBeenCalledWith("keypress");
    expect(marker.on).toHaveBeenCalledWith("mouseover", expect.any(Function));
    expect(marker.on).toHaveBeenCalledWith("mouseout", expect.any(Function));
  });

  it("keeps tap popup behavior on touch devices", async () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
        media: "(hover: hover) and (pointer: fine)",
        onchange: null,
      })),
    });

    render(
      <TransitMap
        stations={mockStations}
        lines={mockLines}
        stationLines={mockStationLines}
      />,
    );

    await waitFor(() => {
      expect(createdMarkers).toHaveLength(1);
    });

    const marker = createdMarkers[0];
    expect(marker.bindPopup).toHaveBeenCalled();
    expect(marker.off).not.toHaveBeenCalled();
    expect(marker.on).not.toHaveBeenCalled();
  });

  it("uses destination line color for the destination marker", async () => {
    const L = (await import("leaflet")).default;
    const routeSteps: PathStep[] = [
      { stationId: "s1", lineId: "L1", travelTimeMin: 0, isTransfer: false },
      { stationId: "s2", lineId: "L1", travelTimeMin: 5, isTransfer: false },
    ];

    render(
      <TransitMap
        stations={mockStations2}
        lines={mockLines}
        stationLines={mockStationLines2}
        routeSteps={routeSteps}
      />,
    );

    await waitFor(() => {
      expect(L.circleMarker).toHaveBeenCalledWith(
        [13.7362, 100.5604],
        expect.objectContaining({ fillColor: "#00843D" }),
      );
    });
  });

  it("uses origin line color for the origin marker", async () => {
    const L = (await import("leaflet")).default;
    const routeSteps: PathStep[] = [
      { stationId: "s1", lineId: "L1", travelTimeMin: 0, isTransfer: false },
      { stationId: "s2", lineId: "L1", travelTimeMin: 5, isTransfer: false },
    ];

    render(
      <TransitMap
        stations={mockStations2}
        lines={mockLines}
        stationLines={mockStationLines2}
        routeSteps={routeSteps}
      />,
    );

    await waitFor(() => {
      expect(L.circleMarker).toHaveBeenCalledWith(
        [13.7453, 100.5342],
        expect.objectContaining({ fillColor: "#00843D" }),
      );
    });
  });

  it("falls back to red destination marker when route has no destination line", async () => {
    const L = (await import("leaflet")).default;
    const routeSteps: PathStep[] = [
      { stationId: "s1", lineId: null, travelTimeMin: 0, isTransfer: false },
      { stationId: "s2", lineId: null, travelTimeMin: 5, isTransfer: false },
    ];

    render(
      <TransitMap
        stations={mockStations2}
        lines={mockLines}
        stationLines={mockStationLines2}
        routeSteps={routeSteps}
      />,
    );

    await waitFor(() => {
      expect(L.circleMarker).toHaveBeenCalledWith(
        [13.7362, 100.5604],
        expect.objectContaining({ fillColor: "#ef4444" }),
      );
    });
  });

  it("falls back to green origin marker when route has no origin line", async () => {
    const L = (await import("leaflet")).default;
    const routeSteps: PathStep[] = [
      { stationId: "s1", lineId: null, travelTimeMin: 0, isTransfer: false },
      { stationId: "s2", lineId: null, travelTimeMin: 5, isTransfer: false },
    ];

    render(
      <TransitMap
        stations={mockStations2}
        lines={mockLines}
        stationLines={mockStationLines2}
        routeSteps={routeSteps}
      />,
    );

    await waitFor(() => {
      expect(L.circleMarker).toHaveBeenCalledWith(
        [13.7453, 100.5342],
        expect.objectContaining({ fillColor: "#22c55e" }),
      );
    });
  });

  it("starts the next line polyline from the transfer arrival station", async () => {
    const L = (await import("leaflet")).default;
    const transferStations: Station[] = [
      {
        id: "s1",
        name_th: "หมอชิต",
        name_en: "Mo Chit",
        code: "N8",
        lat: 13.8,
        lng: 100.55,
        is_interchange: true,
      },
      {
        id: "s2",
        name_th: "อโศก",
        name_en: "Asok",
        code: "E4",
        lat: 13.79,
        lng: 100.551,
        is_interchange: true,
      },
      {
        id: "s3",
        name_th: "จตุจักร",
        name_en: "Chatuchak Park",
        code: "BL13",
        lat: 13.80232,
        lng: 100.55308,
        is_interchange: true,
      },
      {
        id: "s4",
        name_th: "กำแพงเพชร",
        name_en: "Kamphaeng Phet",
        code: "BL12",
        lat: 13.79775,
        lng: 100.54022,
        is_interchange: false,
      },
    ];
    const transferLines: Line[] = [
      mockLines[0],
      {
        id: "L2",
        operator_id: "op2",
        name_th: "สีน้ำเงิน",
        name_en: "Blue",
        code: "BLU",
        color: "#1e40af",
      },
    ];
    const transferStationLines: StationLine[] = [
      { station_id: "s1", line_id: "L1", sequence_order: 1 },
      { station_id: "s2", line_id: "L1", sequence_order: 2 },
      { station_id: "s3", line_id: "L2", sequence_order: 1 },
      { station_id: "s4", line_id: "L2", sequence_order: 2 },
    ];
    const routeSteps: PathStep[] = [
      { stationId: "s1", lineId: "L1", travelTimeMin: 0, isTransfer: false },
      { stationId: "s2", lineId: "L1", travelTimeMin: 3, isTransfer: false },
      { stationId: "s3", lineId: "L2", travelTimeMin: 5, isTransfer: true },
      { stationId: "s4", lineId: "L2", travelTimeMin: 2, isTransfer: false },
    ];

    render(
      <TransitMap
        stations={transferStations}
        lines={transferLines}
        stationLines={transferStationLines}
        routeSteps={routeSteps}
      />,
    );

    await waitFor(() => {
      expect(L.polyline).toHaveBeenCalledWith(
        [
          [13.80232, 100.55308],
          [13.79775, 100.54022],
        ],
        expect.objectContaining({ color: "#1e40af" }),
      );
    });
  });
});
