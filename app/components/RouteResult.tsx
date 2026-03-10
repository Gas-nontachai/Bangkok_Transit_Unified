import { useState } from "react";
import type { Line, Station, RouteStep, RouteSegment, Operator } from "~/lib/types";
import type { FareResult } from "~/lib/fare";
import type { RouteOption } from "~/routes/home";

interface RouteResultProps {
  routeOptions: RouteOption[];
  activeIndex: number;
  onSelectRoute: (index: number) => void;
  stations: Station[];
  lines: Line[];
  isLoading?: boolean;
  error?: string | null;
}

const DEFAULT_DESTINATION_COLOR = "#ef4444";
const DEFAULT_ORIGIN_COLOR = "#22c55e";

function getFirstTransitLineColor(steps: RouteStep[]): string {
  for (const step of steps) {
    if (!step.is_transfer && step.line?.color) {
      return step.line.color;
    }
  }

  return DEFAULT_ORIGIN_COLOR;
}

function getLastTransitLineColor(steps: RouteStep[]): string {
  for (let i = steps.length - 1; i >= 0; i--) {
    const step = steps[i];
    if (!step.is_transfer && step.line?.color) {
      return step.line.color;
    }
  }

  return DEFAULT_DESTINATION_COLOR;
}

function LineColorDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-3 h-3 rounded-full flex-shrink-0"
      style={{ backgroundColor: color }}
    />
  );
}

function LineColorBar({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-1 rounded-full self-stretch min-h-[24px]"
      style={{ backgroundColor: color }}
    />
  );
}

// Derived type representing one item in the journey timeline
type JourneyItem =
  | {
      type: "segment";
      line: Line;
      operator: Operator | null;
      stations: Station[];
      time: number;
      fare: number;
    }
  | {
      type: "transfer";
      fromStation: Station;
      toStation: Station;
      toLine: Line;
      walkTime: number;
    };

function buildJourneyItems(
  steps: RouteStep[],
  operatorByLineId: Map<string, Operator>,
): JourneyItem[] {
  const items: JourneyItem[] = [];

  let currentLine: Line | null = null;
  let currentOperator: Operator | null = null;
  let currentStations: Station[] = [];
  let currentTime = 0;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    if (step.is_transfer) {
      // Flush current transit segment
      if (currentLine && currentStations.length > 0) {
        items.push({
          type: "segment",
          line: currentLine,
          operator: currentOperator!,
          stations: [...currentStations],
          time: currentTime,
          fare: 0, // fare shown in FareBreakdown below, not here
        });
      }
      // Add transfer item — step.line is the line we're switching TO
      const fromStation = steps[i - 1]?.station;
      if (fromStation && step.station && step.line) {
        items.push({
          type: "transfer",
          fromStation,
          toStation: step.station,
          toLine: step.line,
          walkTime: step.travel_time_min,
        });
      }
      currentLine = step.line ?? null;
      currentOperator = step.line
        ? operatorByLineId.get(step.line.id) ?? null
        : null;
      currentStations = step.station ? [step.station] : [];
      currentTime = 0;
    } else {
      // Detect line change at same station (e.g., Siam: Silom→Sukhumvit, Phaya Thai: Sukhumvit→ARL)
      if (step.line && currentLine && step.line.id !== currentLine.id) {
        // Flush current segment
        if (currentStations.length > 0) {
          items.push({
            type: "segment",
            line: currentLine,
            operator: currentOperator!,
            stations: [...currentStations],
            time: currentTime,
            fare: 0,
          });
        }
        // Start new segment — carry last station as the first of the new segment
        const lastStation = currentStations[currentStations.length - 1];
        currentStations = lastStation ? [lastStation] : [];
        currentTime = 0;
      }
      if (step.line) {
        currentLine = step.line;
        currentOperator = operatorByLineId.get(step.line.id) ?? null;
      }
      currentStations.push(step.station);
      currentTime += step.travel_time_min;
    }
  }

  // Flush last transit segment
  if (currentLine && currentStations.length > 0) {
    items.push({
      type: "segment",
      line: currentLine,
      operator: currentOperator!,
      stations: [...currentStations],
      time: currentTime,
      fare: 0,
    });
  }

  return items;
}

function SegmentRow({
  item,
  fare,
  isEstimated,
}: {
  item: Extract<JourneyItem, { type: "segment" }>;
  isLast: boolean;
  fare?: number;
  isEstimated?: boolean;
}) {
  const stationCount = item.stations.length;

  return (
    <div className="flex gap-3">
      {/* Left: color bar */}
      <div className="flex flex-col items-center pt-1">
        <LineColorBar color={item.line.color} />
      </div>

      {/* Right: content */}
      <div className="flex-1 pb-3">
        {/* Line pill + time + fare */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: item.line.color }}
            >
              {item.line.name_th}
            </span>
            {item.operator?.code && (
              <span className="text-xs text-gray-400">{item.operator.code}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {fare !== undefined && fare > 0 && (
              <span className="text-xs font-semibold text-gray-800">
                {isEstimated ? "~" : ""}฿{fare}
              </span>
            )}
            <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
              {item.time} นาที
            </span>
          </div>
        </div>
        {/* Station count */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-500">{stationCount} สถานี</span>
        </div>
      </div>
    </div>
  );
}

function FullJourneyStationList({ items }: { items: JourneyItem[] }) {
  return (
    <div className="mt-2 rounded-xl border border-gray-200 overflow-hidden bg-white">
      {items.map((item, idx) => {
        if (item.type === "transfer") {
          return (
            <div
              key={idx}
              className="flex items-center gap-3 px-3 py-2 bg-amber-50 border-y border-amber-100"
            >
              <span className="text-base leading-none">🚶</span>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-amber-800 font-semibold">
                  เดิน {item.walkTime} นาที
                </span>
                <span className="text-xs text-gray-400 mx-1">→ ขึ้นสาย</span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: item.toLine.color }}
                >
                  {item.toLine.name_th}
                </span>
              </div>
            </div>
          );
        }

        // segment
        return (
          <div key={idx}>
            {/* Line section header */}
            <div
              className="flex items-center gap-2 px-3 py-1.5"
              style={{ backgroundColor: item.line.color + "22" }}
            >
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0"
                style={{ backgroundColor: item.line.color }}
              >
                {item.line.name_th}
              </span>
              {item.operator?.code && (
                <span className="text-xs text-gray-500">{item.operator.code}</span>
              )}
              <span className="text-xs text-gray-500 ml-auto">{item.time} นาที · {item.stations.length} สถานี</span>
            </div>

            {/* Stations */}
            <div>
              {item.stations.map((st, i) => {
                const isFirst = i === 0;
                const isLast = i === item.stations.length - 1;
                const isEndpoint = isFirst || isLast;
                return (
                  <div
                    key={st.id}
                    className="flex gap-2.5 px-3"
                    style={isEndpoint ? { backgroundColor: item.line.color + "12" } : {}}
                  >
                    {/* Left: colored dot + connecting vertical line */}
                    <div className="flex flex-col items-center flex-shrink-0" style={{ width: 14 }}>
                      {/* Top connector line */}
                      {!isFirst && (
                        <div
                          className="w-[3px] flex-1"
                          style={{ backgroundColor: item.line.color, opacity: 0.5 }}
                        />
                      )}
                      {isFirst && <div className="flex-1" />}
                      {/* Dot */}
                      <span
                        className={`rounded-full flex-shrink-0 ${isEndpoint ? "w-3.5 h-3.5 ring-2" : "w-2.5 h-2.5"}`}
                        style={{
                          backgroundColor: item.line.color,
                          ...(isEndpoint
                            ? { boxShadow: `0 0 0 4px ${item.line.color}44` }
                            : {}),
                        }}
                      />
                      {/* Bottom connector line */}
                      {!isLast && (
                        <div
                          className="w-[3px] flex-1"
                          style={{ backgroundColor: item.line.color, opacity: 0.5 }}
                        />
                      )}
                      {isLast && <div className="flex-1" />}
                    </div>
                    {/* Right: station info */}
                    <div className={`flex items-center gap-1 flex-1 min-w-0 ${isEndpoint ? "py-2" : "py-1.5"}`}>
                      <span
                        className={`text-xs flex-1 min-w-0 ${isEndpoint ? "font-bold text-gray-900" : "text-gray-700"}`}
                      >
                        {st.name_th}
                      </span>
                      <span className="text-xs text-gray-400 truncate max-w-[80px]">
                        {st.name_en}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}


function TransferRow({
  item,
}: {
  item: Extract<JourneyItem, { type: "transfer" }>;
}) {
  return (
    <div className="flex gap-3 my-1">
      {/* Left: walk icon centered */}
      <div className="flex flex-col items-center justify-center w-4 flex-shrink-0">
        <div className="w-0.5 h-3 bg-gray-200" />
        <span className="text-sm leading-none">🚶</span>
        <div className="w-0.5 h-3 bg-gray-200" />
      </div>
      {/* Right: two-line transfer card */}
      <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
        {/* Line 1: station name */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">📍 เดินจาก</span>
          <span className="text-xs font-bold text-gray-900">
            {item.fromStation.name_th}
          </span>
          <span className="text-xs text-gray-400">
            {item.fromStation.name_en}
          </span>
          <span className="text-xs text-gray-400">→</span>
          <span className="text-xs text-gray-500">ไป</span>
          <span className="text-xs font-bold text-gray-900">
            {item.toStation.name_th}
          </span>
          <span className="text-xs text-gray-400">
            {item.toStation.name_en}
          </span>
        </div>
        {/* Line 2: walk time + destination line */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-amber-700 font-medium">
            🚶 เดินประมาณ {item.walkTime} นาที
          </span>
          <span className="text-xs text-gray-400">→ ขึ้นสาย</span>
          <span
            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: item.toLine.color }}
          />
          <span
            className="text-xs font-semibold"
            style={{ color: item.toLine.color }}
          >
            {item.toLine.name_th}
          </span>
        </div>
      </div>
    </div>
  );
}

function JourneyTimeline({
  steps,
  segments,
  totalTime,
  fareResult,
}: {
  steps: RouteStep[];
  segments: RouteSegment[];
  totalTime: number;
  fareResult?: FareResult;
}) {
  const [showAllStations, setShowAllStations] = useState(false);

  // Build lineId → operator lookup from all segments (including transfer segments)
  const operatorByLineId = new Map(
    segments.filter((s) => s.operator).map((s) => [s.line.id, s.operator]),
  );
  const items = buildJourneyItems(steps, operatorByLineId);

  // Build fare lookup by lineId for matching segments
  const fareByLineId = new Map<string, { fare: number; isEstimated: boolean }>();
  if (fareResult) {
    for (const fs of fareResult.segments) {
      fareByLineId.set(fs.lineId, { fare: fs.fare, isEstimated: fs.isEstimated });
    }
  }
  const origin = steps[0]?.station;
  const destination = steps[steps.length - 1]?.station;
  const originLineColor = getFirstTransitLineColor(steps);
  const destinationLineColor = getLastTransitLineColor(steps);

  return (
    <div className="space-y-1">
      {/* Origin */}
      {origin && (
        <div className="flex items-center gap-2 pb-2">
          <span
            data-testid="origin-dot"
            className="w-4 h-4 rounded-full flex-shrink-0 ring-2"
            style={{
              backgroundColor: originLineColor,
              boxShadow: `0 0 0 4px ${originLineColor}44`,
            }}
          />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-bold text-gray-900">
              {origin.name_th}
            </span>
            <span className="text-xs text-gray-400 ml-1">{origin.name_en}</span>
          </div>
          <span
            data-testid="origin-badge"
            className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
            style={{
              backgroundColor: `${originLineColor}22`,
              color: originLineColor,
            }}
          >
            ต้นทาง
          </span>
        </div>
      )}

      {/* Segments + transfers (summary) */}
      {items.map((item, i) => {
        if (item.type === "segment") {
          const fareInfo = fareByLineId.get(item.line.id);
          return (
            <SegmentRow
              key={i}
              item={item}
              isLast={i === items.length - 1}
              fare={fareInfo?.fare}
              isEstimated={fareInfo?.isEstimated}
            />
          );
        }
        return <TransferRow key={i} item={item} />;
      })}

      {/* Destination */}
      {destination && (
        <div className="flex items-center gap-2 pt-2">
          <span
            data-testid="destination-dot"
            className="w-4 h-4 rounded-full flex-shrink-0 ring-2"
            style={{
              backgroundColor: destinationLineColor,
              boxShadow: `0 0 0 4px ${destinationLineColor}44`,
            }}
          />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-bold text-gray-900">
              {destination.name_th}
            </span>
            <span className="text-xs text-gray-400 ml-1">
              {destination.name_en}
            </span>
          </div>
          <span
            data-testid="destination-badge"
            className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
            style={{
              backgroundColor: `${destinationLineColor}22`,
              color: destinationLineColor,
            }}
          >
            ปลายทาง
          </span>
        </div>
      )}

      {/* Total time + total fare summary */}
      <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">เวลาเดินทางรวม</span>
          <span className="text-sm font-bold text-blue-700">
            ⏱ {totalTime} นาที
          </span>
        </div>
        {fareResult && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">💰 ค่าโดยสารรวม</span>
            <span className="text-sm font-bold text-green-700">
              {fareResult.segments.some((s) => s.isEstimated) ? "~" : ""}฿{fareResult.totalFare}
            </span>
          </div>
        )}
      </div>

      {/* Unified station list toggle */}
      <button
        onClick={() => setShowAllStations((v) => !v)}
        className="w-full text-xs text-blue-500 hover:text-blue-700 transition-colors py-1 text-left"
      >
        {showAllStations ? "▲ ซ่อนสถานี" : "▼ ดูทุกสถานี (ทุกสาย)"}
      </button>

      {showAllStations && <FullJourneyStationList items={items} />}
    </div>
  );
}

interface RouteOptionCardProps {
  option: RouteOption;
  index: number;
  isActive: boolean;
  isCheapest: boolean;
  isFastest: boolean;
  lines: Line[];
  onSelect: () => void;
  fareSaving?: number;
  timeSaving?: number;
  routeCount: number;
}

function RouteOptionCard({
  option,
  index,
  isActive,
  isCheapest,
  isFastest,
  lines,
  onSelect,
  fareSaving,
  timeSaving,
  routeCount,
}: RouteOptionCardProps) {
  const { routeResult, fareResult } = option;
  const lineMap = new Map(lines.map((l) => [l.id, l]));

  // Get unique lines used (non-transfer steps only)
  const usedLineIds = [
    ...new Set(
      routeResult.steps
        .filter((s) => s.line && !s.is_transfer)
        .map((s) => s.line!.id),
    ),
  ];
  const transferCount = routeResult.steps.filter((s) => s.is_transfer).length;

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-colors ${isActive ? "border-blue-400 shadow-sm" : "border-gray-200"}`}
    >
      {/* Card Header (always visible) */}
      <button
        onClick={onSelect}
        className={`w-full flex items-center justify-between p-3 transition-colors text-left ${isActive ? "bg-blue-50 hover:bg-blue-100" : "bg-white hover:bg-gray-50"}`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Route number */}
          <span className="text-xs font-bold text-gray-500 w-5 flex-shrink-0">
            #{index + 1}
          </span>
          {/* Line dots */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {usedLineIds.map((lid) => {
              const line = lineMap.get(lid);
              return line ? (
                <LineColorDot key={lid} color={line.color} />
              ) : null;
            })}
          </div>
          {/* Fare + time */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-bold text-gray-900">
              {fareResult.segments.some((s) => s.isEstimated) ? "~" : ""}฿
              {fareResult.totalFare}
            </span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-600">
              {routeResult.total_time_min} นาที
            </span>
            {transferCount > 0 && (
              <>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500">🔄 {transferCount}</span>
              </>
            )}
          </div>
          {/* Badges */}
          <div className="flex gap-1">
            {routeCount > 1 && isCheapest && isFastest && (
              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                🏷️ ถูก+เร็วสุด
              </span>
            )}
            {routeCount > 1 && isCheapest && !isFastest && (
              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                🏷️ ถูกกว่า ฿{fareSaving}
              </span>
            )}
            {routeCount > 1 && isFastest && !isCheapest && (
              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                ⚡ เร็วกว่า {timeSaving} นาที
              </span>
            )}
          </div>
        </div>
        <span className="text-gray-400 text-xs ml-2">
          {isActive ? "▲" : "▼"}
        </span>
      </button>

      {/* Expandable detail */}
      {isActive && (
        <div className="border-t border-gray-100 p-3 space-y-3 bg-gray-50">
          {/* Journey Timeline (includes fare per segment) */}
          <JourneyTimeline
            steps={routeResult.steps}
            segments={routeResult.segments}
            totalTime={routeResult.total_time_min}
            fareResult={fareResult}
          />
        </div>
      )}
    </div>
  );
}

interface RouteComparisonBarProps {
  routeOptions: RouteOption[];
  activeIndex: number;
  onSelectRoute: (i: number) => void;
  lines: Line[];
  cheapestFare: number;
  mostExpensiveFare: number;
  fastestTime: number;
  slowestTime: number;
}

function RouteComparisonBar({
  routeOptions,
  activeIndex,
  onSelectRoute,
  lines,
  cheapestFare,
  mostExpensiveFare,
  fastestTime,
  slowestTime,
}: RouteComparisonBarProps) {
  const lineMap = new Map(lines.map((l) => [l.id, l]));
  const fareSaving = mostExpensiveFare - cheapestFare;
  const timeSaving = slowestTime - fastestTime;

  return (
    <div className="flex overflow-x-auto gap-2 pb-2">
      {routeOptions.map((option, i) => {
        const { routeResult, fareResult } = option;
        const isActive = i === activeIndex;
        const isCheapest = fareResult.totalFare === cheapestFare;
        const isFastest = routeResult.total_time_min === fastestTime;

        const usedLineIds = [
          ...new Set(
            routeResult.steps
              .filter((s) => s.line && !s.is_transfer)
              .map((s) => s.line!.id),
          ),
        ];

        return (
          <button
            key={i}
            onClick={() => onSelectRoute(i)}
            className={`min-w-[140px] border rounded-lg p-2 text-left transition-colors flex-shrink-0 ${
              isActive
                ? "border-blue-400 bg-blue-50"
                : "border-gray-200 bg-white hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs font-bold text-gray-500">#{i + 1}</span>
              <div className="flex gap-0.5">
                {usedLineIds.map((lid) => {
                  const line = lineMap.get(lid);
                  return line ? (
                    <LineColorDot key={lid} color={line.color} />
                  ) : null;
                })}
              </div>
            </div>
            <div className="text-sm font-bold text-gray-900">
              {fareResult.segments.some((s) => s.isEstimated) ? "~" : ""}฿{fareResult.totalFare}
            </div>
            <div className="text-xs text-gray-500">{routeResult.total_time_min} นาที</div>
            <div className="mt-1">
              {isCheapest && isFastest && (
                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                  🏷️ ถูก+เร็วสุด
                </span>
              )}
              {isCheapest && !isFastest && (
                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                  🏷️ ถูกกว่า ฿{fareSaving}
                </span>
              )}
              {isFastest && !isCheapest && (
                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                  ⚡ เร็วกว่า {timeSaving} นาที
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function RouteResultDisplay({
  routeOptions,
  activeIndex,
  onSelectRoute,
  lines,
  isLoading,
  error,
}: RouteResultProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-500">
        <span className="animate-spin mr-2">⏳</span>
        กำลังคำนวณเส้นทาง...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
        ❌ {error}
      </div>
    );
  }

  if (routeOptions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        <div className="text-4xl mb-2">🗺️</div>
        <p>เลือกสถานีต้นทางและปลายทาง</p>
        <p>แล้วกด "ค้นหาเส้นทาง"</p>
      </div>
    );
  }

  // Cheapest = first (sorted by fare), fastest = lowest time
  const cheapestFare = routeOptions[0].fareResult.totalFare;
  const mostExpensiveFare = Math.max(...routeOptions.map((o) => o.fareResult.totalFare));
  const fastestTime = Math.min(
    ...routeOptions.map((o) => o.routeResult.total_time_min),
  );
  const slowestTime = Math.max(...routeOptions.map((o) => o.routeResult.total_time_min));
  const fareSaving = mostExpensiveFare - cheapestFare;
  const timeSaving = slowestTime - fastestTime;

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-800 text-sm">
        🚇 เส้นทาง{" "}
        {routeOptions.length > 1 ? `(${routeOptions.length} ตัวเลือก)` : ""}
      </h3>
      {routeOptions.length > 1 && (
        <RouteComparisonBar
          routeOptions={routeOptions}
          activeIndex={activeIndex}
          onSelectRoute={onSelectRoute}
          lines={lines}
          cheapestFare={cheapestFare}
          mostExpensiveFare={mostExpensiveFare}
          fastestTime={fastestTime}
          slowestTime={slowestTime}
        />
      )}
      {routeOptions.map((option, i) => (
        <RouteOptionCard
          key={i}
          option={option}
          index={i}
          isActive={i === activeIndex}
          isCheapest={option.fareResult.totalFare === cheapestFare}
          isFastest={option.routeResult.total_time_min === fastestTime}
          lines={lines}
          onSelect={() => onSelectRoute(i)}
          fareSaving={fareSaving}
          timeSaving={timeSaving}
          routeCount={routeOptions.length}
        />
      ))}
    </div>
  );
}
