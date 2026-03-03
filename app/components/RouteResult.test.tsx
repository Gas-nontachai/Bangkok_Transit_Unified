import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RouteResultDisplay } from "./RouteResult";
import type { Station, Line, RouteResult } from "~/lib/types";

const mockStations: Station[] = [
  { id: "s1", name_th: "สยาม", name_en: "Siam", code: "CEN", lat: 13.7453, lng: 100.5342, is_interchange: true },
  { id: "s2", name_th: "อโศก", name_en: "Asok", code: "E4", lat: 13.7362, lng: 100.5604, is_interchange: true },
];

const mockLines: Line[] = [
  { id: "L1", operator_id: "op1", name_th: "สุขุมวิท", name_en: "Sukhumvit", code: "SUK", color: "#00843D" },
];

describe("RouteResultDisplay", () => {
  it("shows empty state when no result", () => {
    render(
      <RouteResultDisplay
        routeResult={null}
        fareResult={null}
        stations={mockStations}
        lines={mockLines}
      />
    );
    expect(screen.getByText(/เลือกสถานีต้นทางและปลายทาง/)).toBeTruthy();
  });

  it("shows loading state", () => {
    render(
      <RouteResultDisplay
        routeResult={null}
        fareResult={null}
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
        routeResult={null}
        fareResult={null}
        stations={mockStations}
        lines={mockLines}
        error="ไม่สามารถเชื่อมต่อได้"
      />
    );
    expect(screen.getByText(/ไม่สามารถเชื่อมต่อได้/)).toBeTruthy();
  });

  it("shows no-path state when steps is empty", () => {
    const emptyRoute: RouteResult = {
      steps: [],
      segments: [],
      total_time_min: 0,
      total_fare: 0,
    };
    render(
      <RouteResultDisplay
        routeResult={emptyRoute}
        fareResult={null}
        stations={mockStations}
        lines={mockLines}
      />
    );
    expect(screen.getByText(/ไม่พบเส้นทาง/)).toBeTruthy();
  });
});
