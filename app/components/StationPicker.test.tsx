import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StationPicker } from "./StationPicker";
import type { Station, Line, StationLine, Operator } from "~/lib/types";

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
  {
    id: "s2",
    name_th: "อโศก",
    name_en: "Asok",
    code: "E4",
    lat: 13.7362,
    lng: 100.5604,
    is_interchange: true,
  },
  {
    id: "s3",
    name_th: "หมอชิต",
    name_en: "Mo Chit",
    code: "N8",
    lat: 13.8027,
    lng: 100.5537,
    is_interchange: true,
  },
  {
    id: "s4",
    name_th: "จตุจักร",
    name_en: "Chatuchak Park",
    code: "BL13",
    lat: 13.8026,
    lng: 100.5534,
    is_interchange: false,
  },
  {
    id: "s5",
    name_th: "ห้าแยกลาดพร้าว",
    name_en: "Ha Yaek Lat Phrao",
    code: "N9",
    lat: 13.8152,
    lng: 100.5598,
    is_interchange: false,
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

const mockOperators: Operator[] = [
  {
    id: "op1",
    name_th: "รถไฟฟ้า BTS",
    name_en: "Bangkok Mass Transit System",
    code: "BTS",
  },
];

const mockStationLines: StationLine[] = [
  { station_id: "s1", line_id: "L1", sequence_order: 24 },
  { station_id: "s2", line_id: "L1", sequence_order: 28 },
  { station_id: "s3", line_id: "L1", sequence_order: 17 },
  { station_id: "s4", line_id: "L1", sequence_order: 13 },
  { station_id: "s5", line_id: "L1", sequence_order: 9 },
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
      />,
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
      />,
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
      />,
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
      />,
    );
    fireEvent.click(screen.getByText("ค้นหาสถานี..."));
    expect(
      screen.getByPlaceholderText("ชื่อไทย, English, หรือรหัส (เช่น E4)"),
    ).toBeTruthy();
  });

  const renderPicker = () =>
    render(
      <StationPicker
        stations={mockStations}
        lines={mockLines}
        stationLines={mockStationLines}
        operators={mockOperators}
        label="ต้นทาง"
        value={null}
        onChange={() => {}}
      />,
    );

  it("alias search: 'สวนจตุจักร' matches จตุจักร", () => {
    const { getByText, getByPlaceholderText } = renderPicker();
    fireEvent.click(getByText("ค้นหาสถานี..."));
    fireEvent.change(getByPlaceholderText("ชื่อไทย, English, หรือรหัส (เช่น E4)"), {
      target: { value: "สวนจตุจักร" },
    });
    expect(screen.getByText("จตุจักร")).toBeTruthy();
  });

  it("alias search: 'jj' matches จตุจักร", () => {
    const { getByText, getByPlaceholderText } = renderPicker();
    fireEvent.click(getByText("ค้นหาสถานี..."));
    fireEvent.change(getByPlaceholderText("ชื่อไทย, English, หรือรหัส (เช่น E4)"), {
      target: { value: "jj" },
    });
    expect(screen.getByText("จตุจักร")).toBeTruthy();
  });

  it("alias search: 'union mall' matches ห้าแยกลาดพร้าว", () => {
    const { getByText, getByPlaceholderText } = renderPicker();
    fireEvent.click(getByText("ค้นหาสถานี..."));
    fireEvent.change(getByPlaceholderText("ชื่อไทย, English, หรือรหัส (เช่น E4)"), {
      target: { value: "union mall" },
    });
    expect(screen.getByText("ห้าแยกลาดพร้าว")).toBeTruthy();
  });

  it("normal search: name_th still works", () => {
    const { getByText, getByPlaceholderText } = renderPicker();
    fireEvent.click(getByText("ค้นหาสถานี..."));
    fireEvent.change(getByPlaceholderText("ชื่อไทย, English, หรือรหัส (เช่น E4)"), {
      target: { value: "สยาม" },
    });
    expect(screen.getByText("สยาม")).toBeTruthy();
  });

  it("normal search: code still works", () => {
    const { getByText, getByPlaceholderText } = renderPicker();
    fireEvent.click(getByText("ค้นหาสถานี..."));
    fireEvent.change(getByPlaceholderText("ชื่อไทย, English, หรือรหัส (เช่น E4)"), {
      target: { value: "E4" },
    });
    expect(screen.getByText("อโศก")).toBeTruthy();
  });
});
