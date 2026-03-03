import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StationPicker } from "./StationPicker";
import type { Station, Line, StationLine, Operator } from "~/lib/types";

const mockStations: Station[] = [
  { id: "s1", name_th: "สยาม", name_en: "Siam", code: "CEN", lat: 13.7453, lng: 100.5342, is_interchange: true },
  { id: "s2", name_th: "อโศก", name_en: "Asok", code: "E4", lat: 13.7362, lng: 100.5604, is_interchange: true },
  { id: "s3", name_th: "หมอชิต", name_en: "Mo Chit", code: "N8", lat: 13.8027, lng: 100.5537, is_interchange: true },
];

const mockLines: Line[] = [
  { id: "L1", operator_id: "op1", name_th: "สุขุมวิท", name_en: "Sukhumvit", code: "SUK", color: "#00843D" },
];

const mockOperators: Operator[] = [
  { id: "op1", name_th: "รถไฟฟ้า BTS", name_en: "Bangkok Mass Transit System", code: "BTS" },
];

const mockStationLines: StationLine[] = [
  { station_id: "s1", line_id: "L1", sequence_order: 24 },
  { station_id: "s2", line_id: "L1", sequence_order: 28 },
  { station_id: "s3", line_id: "L1", sequence_order: 17 },
];

describe("StationPicker", () => {
  it("renders with label", () => {
    render(
      <StationPicker
        stations={mockStations}
        lines={mockLines}
        stationLines={mockStationLines}
        operators={mockOperators}
        label="ต้นทาง"
        value={null}
        onChange={() => {}}
      />
    );
    expect(screen.getByText("ต้นทาง")).toBeTruthy();
  });

  it("shows placeholder when no station selected", () => {
    render(
      <StationPicker
        stations={mockStations}
        lines={mockLines}
        stationLines={mockStationLines}
        operators={mockOperators}
        label="ต้นทาง"
        value={null}
        onChange={() => {}}
      />
    );
    expect(screen.getByText("ค้นหาสถานี...")).toBeTruthy();
  });

  it("shows selected station name", () => {
    render(
      <StationPicker
        stations={mockStations}
        lines={mockLines}
        stationLines={mockStationLines}
        operators={mockOperators}
        label="ต้นทาง"
        value={mockStations[0]}
        onChange={() => {}}
      />
    );
    expect(screen.getByText("สยาม")).toBeTruthy();
  });

  it("opens dropdown on click", () => {
    render(
      <StationPicker
        stations={mockStations}
        lines={mockLines}
        stationLines={mockStationLines}
        operators={mockOperators}
        label="ต้นทาง"
        value={null}
        onChange={() => {}}
      />
    );
    fireEvent.click(screen.getByText("ค้นหาสถานี..."));
    expect(screen.getByPlaceholderText("ชื่อไทย, English, หรือรหัส (เช่น E4)")).toBeTruthy();
  });
});

