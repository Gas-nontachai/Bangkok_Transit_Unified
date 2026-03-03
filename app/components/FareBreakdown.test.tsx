import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FareBreakdown } from "./FareBreakdown";
import type { FareResult } from "~/lib/fare";

describe("FareBreakdown", () => {
  it("renders nothing when no segments", () => {
    const { container } = render(
      <FareBreakdown fareResult={{ segments: [], totalFare: 0 }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders fare breakdown for single line", () => {
    const fareResult: FareResult = {
      segments: [
        {
          lineId: "L1",
          lineName: "สุขุมวิท",
          operatorCode: "BTS",
          fare: 35,
          isEstimated: false,
          fromStationId: "s1",
          toStationId: "s2",
        },
      ],
      totalFare: 35,
    };
    render(<FareBreakdown fareResult={fareResult} />);
    expect(screen.getByText("สุขุมวิท")).toBeTruthy();
    expect(screen.getAllByText(/฿35/).length).toBeGreaterThanOrEqual(1);
  });

  it("shows total fare", () => {
    const fareResult: FareResult = {
      segments: [
        { lineId: "L1", lineName: "สุขุมวิท", operatorCode: "BTS", fare: 35, isEstimated: false, fromStationId: "s1", toStationId: "s2" },
        { lineId: "L2", lineName: "สีน้ำเงิน", operatorCode: "MRT", fare: 25, isEstimated: false, fromStationId: "s3", toStationId: "s4" },
      ],
      totalFare: 60,
    };
    render(<FareBreakdown fareResult={fareResult} />);
    expect(screen.getByText("฿60")).toBeTruthy();
  });

  it("shows ~ prefix for estimated fares", () => {
    const fareResult: FareResult = {
      segments: [
        { lineId: "L1", lineName: "สุขุมวิท", operatorCode: "BTS", fare: 19, isEstimated: true, fromStationId: "s1", toStationId: "s2" },
      ],
      totalFare: 19,
    };
    render(<FareBreakdown fareResult={fareResult} />);
    expect(screen.getAllByText("~฿19").length).toBeGreaterThanOrEqual(1);
  });
});

describe("FareBreakdown", () => {
  it("renders nothing when no segments", () => {
    const { container } = render(
      <FareBreakdown fareResult={{ segments: [], totalFare: 0 }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders fare breakdown for single line", () => {
    const fareResult: FareResult = {
      segments: [
        {
          lineId: "L1",
          lineName: "สุขุมวิท",
          operatorCode: "BTS",
          fare: 35,
          fromStationId: "s1",
          toStationId: "s2",
        },
      ],
      totalFare: 35,
    };
    render(<FareBreakdown fareResult={fareResult} />);
    expect(screen.getByText("สุขุมวิท")).toBeTruthy();
    expect(screen.getAllByText(/฿35/).length).toBeGreaterThanOrEqual(1);
  });

  it("shows total fare", () => {
    const fareResult: FareResult = {
      segments: [
        { lineId: "L1", lineName: "สุขุมวิท", operatorCode: "BTS", fare: 35, fromStationId: "s1", toStationId: "s2" },
        { lineId: "L2", lineName: "สีน้ำเงิน", operatorCode: "MRT", fare: 25, fromStationId: "s3", toStationId: "s4" },
      ],
      totalFare: 60,
    };
    render(<FareBreakdown fareResult={fareResult} />);
    expect(screen.getByText("฿60")).toBeTruthy();
  });
});
