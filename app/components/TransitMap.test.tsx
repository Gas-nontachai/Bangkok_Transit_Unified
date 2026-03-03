import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { TransitMap } from "./TransitMap";
import type { Station, Line, StationLine } from "~/lib/types";

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
    circleMarker: vi.fn(() => ({
      bindPopup: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
    })),
    polyline: vi.fn(() => ({ addTo: vi.fn() })),
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
});
