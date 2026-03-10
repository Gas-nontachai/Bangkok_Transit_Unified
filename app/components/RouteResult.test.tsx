import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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

const mockLines: Line[] = [
  {
    id: "L1",
    operator_id: "op1",
    name_th: "สุขุมวิท",
    name_en: "Sukhumvit",
    code: "SUK",
    color: "#00843D",
  },
  {
    id: "L2",
    operator_id: "op2",
    name_th: "สีน้ำเงิน",
    name_en: "Blue",
    code: "BLU",
    color: "#1e40af",
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

  it("uses destination line color for destination dot and badge", () => {
    render(
      <RouteResultDisplay
        routeOptions={[makeOption(17, 5)]}
        activeIndex={0}
        onSelectRoute={() => {}}
        stations={mockStations}
        lines={mockLines}
      />,
    );

    expect(screen.getByTestId("destination-dot")).toHaveStyle({
      backgroundColor: "rgb(0, 132, 61)",
    });
    expect(screen.getByTestId("destination-badge")).toHaveStyle({
      color: "rgb(0, 132, 61)",
    });
  });

  it("uses origin line color for origin dot and badge", () => {
    render(
      <RouteResultDisplay
        routeOptions={[makeOption(17, 5)]}
        activeIndex={0}
        onSelectRoute={() => {}}
        stations={mockStations}
        lines={mockLines}
      />,
    );

    expect(screen.getByTestId("origin-dot")).toHaveStyle({
      backgroundColor: "rgb(0, 132, 61)",
    });
    expect(screen.getByTestId("origin-badge")).toHaveStyle({
      color: "rgb(0, 132, 61)",
    });
  });

  it("falls back to red destination color when destination line is missing", () => {
    const optionWithoutDestinationLine: RouteOption = {
      routeResult: {
        steps: [
          {
            station: mockStations[0],
            line: null,
            is_transfer: false,
            travel_time_min: 0,
          },
          {
            station: mockStations[1],
            line: null,
            is_transfer: false,
            travel_time_min: 5,
          },
        ],
        segments: [],
        total_time_min: 5,
        total_fare: 17,
      },
      fareResult: {
        segments: [],
        totalFare: 17,
      },
      pathSteps: [],
    };

    render(
      <RouteResultDisplay
        routeOptions={[optionWithoutDestinationLine]}
        activeIndex={0}
        onSelectRoute={() => {}}
        stations={mockStations}
        lines={mockLines}
      />,
    );

    expect(screen.getByTestId("destination-dot")).toHaveStyle({
      backgroundColor: "rgb(239, 68, 68)",
    });
    expect(screen.getByTestId("destination-badge")).toHaveStyle({
      color: "rgb(239, 68, 68)",
    });
  });

  it("falls back to green origin color when origin line is missing", () => {
    const optionWithoutOriginLine: RouteOption = {
      routeResult: {
        steps: [
          {
            station: mockStations[0],
            line: null,
            is_transfer: false,
            travel_time_min: 0,
          },
          {
            station: mockStations[1],
            line: null,
            is_transfer: false,
            travel_time_min: 5,
          },
        ],
        segments: [],
        total_time_min: 5,
        total_fare: 17,
      },
      fareResult: {
        segments: [],
        totalFare: 17,
      },
      pathSteps: [],
    };

    render(
      <RouteResultDisplay
        routeOptions={[optionWithoutOriginLine]}
        activeIndex={0}
        onSelectRoute={() => {}}
        stations={mockStations}
        lines={mockLines}
      />,
    );

    expect(screen.getByTestId("origin-dot")).toHaveStyle({
      backgroundColor: "rgb(34, 197, 94)",
    });
    expect(screen.getByTestId("origin-badge")).toHaveStyle({
      color: "rgb(34, 197, 94)",
    });
  });

  it("shows transfer as from-to and includes transfer arrival station in all stations list", () => {
    const transferOption: RouteOption = {
      routeResult: {
        steps: [
          {
            station: mockStations[0],
            line: mockLines[0],
            is_transfer: false,
            travel_time_min: 0,
          },
          {
            station: mockStations[1],
            line: mockLines[0],
            is_transfer: false,
            travel_time_min: 3,
          },
          {
            station: mockStations[2],
            line: mockLines[1],
            is_transfer: true,
            travel_time_min: 5,
          },
          {
            station: mockStations[3],
            line: mockLines[1],
            is_transfer: false,
            travel_time_min: 2,
          },
        ],
        segments: [
          {
            line: mockLines[0],
            operator: {
              id: "op1",
              name_th: "BTS",
              name_en: "BTS",
              code: "BTS",
            },
            stations: [mockStations[0], mockStations[1]],
            fare: 17,
          },
          {
            line: mockLines[1],
            operator: {
              id: "op2",
              name_th: "MRT",
              name_en: "MRT",
              code: "MRT",
            },
            stations: [mockStations[2], mockStations[3]],
            fare: 20,
          },
        ],
        total_time_min: 10,
        total_fare: 37,
      },
      fareResult: {
        segments: [
          {
            lineId: "L1",
            lineName: "สุขุมวิท",
            operatorCode: "BTS",
            fare: 17,
            isEstimated: false,
            fromStationId: "s1",
            toStationId: "s2",
          },
          {
            lineId: "L2",
            lineName: "สีน้ำเงิน",
            operatorCode: "MRT",
            fare: 20,
            isEstimated: false,
            fromStationId: "s3",
            toStationId: "s4",
          },
        ],
        totalFare: 37,
      },
      pathSteps: [],
    };

    render(
      <RouteResultDisplay
        routeOptions={[transferOption]}
        activeIndex={0}
        onSelectRoute={() => {}}
        stations={mockStations}
        lines={mockLines}
      />,
    );

    expect(screen.getByText(/เดินจาก/)).toBeTruthy();
    expect(screen.getByText("อโศก")).toBeTruthy();
    expect(screen.getByText("ไป")).toBeTruthy();
    expect(screen.getByText("จตุจักร")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /ดูทุกสถานี/ }));

    const blueHeaders = screen.getAllByText("สีน้ำเงิน");
    expect(blueHeaders.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("จตุจักร").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("กำแพงเพชร").length).toBeGreaterThanOrEqual(1);
  });
});
