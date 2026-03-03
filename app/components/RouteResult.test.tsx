import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RouteResultDisplay } from "./RouteResult";
import type { Station, Line, RouteResult } from "~/lib/types";
import type { RouteOption } from "~/routes/home";

const mockStations: Station[] = [
  { id: "s1", name_th: "สยาม", name_en: "Siam", code: "CEN", lat: 13.7453, lng: 100.5342, is_interchange: true },
  { id: "s2", name_th: "อโศก", name_en: "Asok", code: "E4", lat: 13.7362, lng: 100.5604, is_interchange: true },
];

const mockLines: Line[] = [
  { id: "L1", operator_id: "op1", name_th: "สุขุมวิท", name_en: "Sukhumvit", code: "SUK", color: "#00843D" },
];

describe("RouteResultDisplay", () => {
  it("shows empty state when no options", () => {
    render(
      <RouteResultDisplay
        routeOptions={[]}
        activeIndex={0}
        onSelectRoute={() => {}}
        stations={mockStations}
        lines={mockLines}
      />
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
      />
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
      />
    );
    expect(screen.getByText(/ไม่สามารถเชื่อมต่อได้/)).toBeTruthy();
  });

  it("shows route cards when options provided", () => {
    const mockOption: RouteOption = {
      routeResult: {
        steps: [
          { station: mockStations[0], line: mockLines[0], is_transfer: false, travel_time_min: 0 },
          { station: mockStations[1], line: mockLines[0], is_transfer: false, travel_time_min: 5 },
        ],
        segments: [],
        total_time_min: 5,
        total_fare: 17,
      },
      fareResult: {
        segments: [{ lineId: "L1", lineName: "สุขุมวิท", operatorCode: "BTS", fare: 17, isEstimated: false, fromStationId: "s1", toStationId: "s2" }],
        totalFare: 17,
      },
      pathSteps: [],
    };
    render(
      <RouteResultDisplay
        routeOptions={[mockOption]}
        activeIndex={0}
        onSelectRoute={() => {}}
        stations={mockStations}
        lines={mockLines}
      />
    );
    expect(screen.getByText(/เส้นทาง/)).toBeTruthy();
    expect(screen.getAllByText(/฿17/).length).toBeGreaterThanOrEqual(1);
  });
});

