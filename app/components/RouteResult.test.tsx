import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RouteResultDisplay } from "./RouteResult";
import type { Station, Line } from "~/lib/types";
import type { RouteOption } from "~/routes/home";

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
    name_th: "นานา",
    name_en: "Nana",
    code: "E3",
    lat: 13.7405,
    lng: 100.5551,
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

const makeOption = (fare: number, timeMin: number, stationId2 = "s2"): RouteOption => ({
  routeResult: {
    steps: [
      {
        station: mockStations[0],
        line: mockLines[0],
        is_transfer: false,
        travel_time_min: 0,
      },
      {
        station: mockStations.find((s) => s.id === stationId2) ?? mockStations[1],
        line: mockLines[0],
        is_transfer: false,
        travel_time_min: timeMin,
      },
    ],
    segments: [],
    total_time_min: timeMin,
    total_fare: fare,
  },
  fareResult: {
    segments: [
      {
        lineId: "L1",
        lineName: "สุขุมวิท",
        operatorCode: "BTS",
        fare,
        isEstimated: false,
        fromStationId: "s1",
        toStationId: stationId2,
      },
    ],
    totalFare: fare,
  },
  pathSteps: [],
});

describe("RouteResultDisplay", () => {
  it("shows empty state when no options", () => {
    render(
      <RouteResultDisplay
        routeOptions={[]}
        activeIndex={0}
        onSelectRoute={() => {}}
        stations={mockStations}
        lines={mockLines}
      />,
    );
    expect(screen.getByText(/เลือกสถานีต้นทางและปลายทาง/)).toBeTruthy();
  });

  it("shows loading state", () => {
    render(
      <RouteResultDisplay
        routeOptions={[]}
        activeIndex={0}
        onSelectRoute={() => {}}
        stations={mockStations}
        lines={mockLines}
        isLoading={true}
      />,
    );
    expect(screen.getByText(/กำลังคำนวณเส้นทาง/)).toBeTruthy();
  });

  it("shows error state", () => {
    render(
      <RouteResultDisplay
        routeOptions={[]}
        activeIndex={0}
        onSelectRoute={() => {}}
        stations={mockStations}
        lines={mockLines}
        error="ไม่สามารถเชื่อมต่อได้"
      />,
    );
    expect(screen.getByText(/ไม่สามารถเชื่อมต่อได้/)).toBeTruthy();
  });

  it("shows route cards when options provided", () => {
    render(
      <RouteResultDisplay
        routeOptions={[makeOption(17, 5)]}
        activeIndex={0}
        onSelectRoute={() => {}}
        stations={mockStations}
        lines={mockLines}
      />,
    );
    expect(screen.getByText(/เส้นทาง/)).toBeTruthy();
    expect(screen.getAllByText(/฿17/).length).toBeGreaterThanOrEqual(1);
  });

  it("1 route: no badge shown", () => {
    render(
      <RouteResultDisplay
        routeOptions={[makeOption(17, 5)]}
        activeIndex={0}
        onSelectRoute={() => {}}
        stations={mockStations}
        lines={mockLines}
      />,
    );
    expect(screen.queryByText(/ถูกกว่า/)).toBeNull();
    expect(screen.queryByText(/เร็วกว่า/)).toBeNull();
    expect(screen.queryByText(/ถูก\+เร็วสุด/)).toBeNull();
  });

  it("2 routes: cheapest shows ถูกกว่า ฿X badge", () => {
    render(
      <RouteResultDisplay
        routeOptions={[makeOption(17, 10), makeOption(25, 5, "s3")]}
        activeIndex={0}
        onSelectRoute={() => {}}
        stations={mockStations}
        lines={mockLines}
      />,
    );
    expect(screen.getAllByText(/ถูกกว่า ฿8/).length).toBeGreaterThanOrEqual(1);
  });

  it("2 routes: fastest shows เร็วกว่า X นาที badge", () => {
    render(
      <RouteResultDisplay
        routeOptions={[makeOption(17, 10), makeOption(25, 5, "s3")]}
        activeIndex={0}
        onSelectRoute={() => {}}
        stations={mockStations}
        lines={mockLines}
      />,
    );
    expect(screen.getAllByText(/เร็วกว่า 5 นาที/).length).toBeGreaterThanOrEqual(1);
  });

  it("route that is both cheapest and fastest shows ถูก+เร็วสุด", () => {
    render(
      <RouteResultDisplay
        routeOptions={[makeOption(17, 5), makeOption(25, 10, "s3")]}
        activeIndex={0}
        onSelectRoute={() => {}}
        stations={mockStations}
        lines={mockLines}
      />,
    );
    expect(screen.getAllByText(/ถูก\+เร็วสุด/).length).toBeGreaterThanOrEqual(1);
  });
});
