import { useState } from "react";
import type { Line, Station, RouteStep, RouteSegment, Operator } from "~/lib/types";
import { FareBreakdown } from "./FareBreakdown";
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
      if (fromStation && step.line) {
        items.push({
          type: "transfer",
          fromStation,
          toLine: step.line,
          walkTime: step.travel_time_min,
        });
      }
      currentLine = null;
      currentOperator = null;
      currentStations = [];
      currentTime = 0;
    } else {
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
  isLast,
}: {
  item: Extract<JourneyItem, { type: "segment" }>;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const stationCount = item.stations.length;

  return (
    <div className="flex gap-2">
      {/* Left: color bar */}
      <div className="flex flex-col items-center">
        <LineColorBar color={item.line.color} />
      </div>

      {/* Right: content */}
      <div className={`flex-1 pb-2 ${isLast ? "" : ""}`}>
        {/* Line name + time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <LineColorDot color={item.line.color} />
            <span className="text-sm font-semibold text-gray-800">
              {item.line.name_th}
            </span>
            <span className="text-xs text-gray-400">{item.operator?.code}</span>
          </div>
          <span className="text-xs font-semibold text-blue-700">
            {item.time} นาที
          </span>
        </div>
        {/* Station count + expand */}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-500">{stationCount} สถานี</span>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
          >
            {expanded ? "▲ ซ่อน" : "▼ ดูทุกสถานี"}
          </button>
        </div>
        {/* Expanded station list */}
        {expanded && (
          <div className="mt-1.5 ml-1 space-y-0.5">
            {item.stations.map((st, i) => (
              <div key={st.id} className="flex items-center gap-1.5 py-0.5">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.line.color }}
                />
                <span className="text-xs text-gray-700">{st.name_th}</span>
                <span className="text-xs text-gray-400">{st.name_en}</span>
                {i === 0 && (
                  <span className="text-xs text-green-600 font-medium">
                    ↑
                  </span>
                )}
                {i === item.stations.length - 1 && (
                  <span className="text-xs text-red-600 font-medium">↓</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TransferRow({
  item,
}: {
  item: Extract<JourneyItem, { type: "transfer" }>;
}) {
  return (
    <div className="flex gap-2 my-1">
      {/* Left: icon */}
      <div className="flex flex-col items-center w-1">
        <span className="text-base">🚶</span>
      </div>
      {/* Right */}
      <div className="flex-1 flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-2.5 py-1.5 ml-1">
        <div className="text-xs text-orange-800">
          <span className="font-semibold">{item.fromStation.name_th}</span>
          <span className="text-orange-600 mx-1">→</span>
          <span>เปลี่ยน</span>
          <span
            className="inline-block w-2.5 h-2.5 rounded-full mx-1 align-middle"
            style={{ backgroundColor: item.toLine.color }}
          />
          <span className="font-semibold">{item.toLine.name_th}</span>
        </div>
        <span className="text-xs font-semibold text-orange-700 flex-shrink-0 ml-2">
          🚶 ~{item.walkTime} นาที
        </span>
      </div>
    </div>
  );
}

function JourneyTimeline({
  steps,
  segments,
  totalTime,
}: {
  steps: RouteStep[];
  segments: RouteSegment[];
  totalTime: number;
}) {
  // Build lineId → operator lookup from all segments (including transfer segments)
  const operatorByLineId = new Map(
    segments.filter((s) => s.operator).map((s) => [s.line.id, s.operator]),
  );
  const items = buildJourneyItems(steps, operatorByLineId);
  const origin = steps[0]?.station;
  const destination = steps[steps.length - 1]?.station;

  return (
    <div className="space-y-1">
      {/* Origin */}
      {origin && (
        <div className="flex items-center gap-2 pb-1">
          <span className="text-green-600 text-base">🟢</span>
          <div>
            <span className="text-sm font-bold text-gray-900">
              {origin.name_th}
            </span>
            <span className="text-xs text-gray-400 ml-1">{origin.name_en}</span>
          </div>
          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded ml-auto">
            ต้นทาง
          </span>
        </div>
      )}

      {/* Segments + transfers */}
      {items.map((item, i) => {
        if (item.type === "segment") {
          const isLastSeg =
            i === items.length - 1 ||
            (i === items.length - 2 && items[i + 1]?.type !== "segment");
          return (
            <SegmentRow
              key={i}
              item={item}
              isLast={isLastSeg}
            />
          );
        }
        return <TransferRow key={i} item={item} />;
      })}

      {/* Destination */}
      {destination && (
        <div className="flex items-center gap-2 pt-1">
          <span className="text-red-600 text-base">🔴</span>
          <div>
            <span className="text-sm font-bold text-gray-900">
              {destination.name_th}
            </span>
            <span className="text-xs text-gray-400 ml-1">
              {destination.name_en}
            </span>
          </div>
          <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded ml-auto">
            ปลายทาง
          </span>
        </div>
      )}

      {/* Total time summary */}
      <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between">
        <span className="text-xs text-gray-500">เวลาเดินทางรวม</span>
        <span className="text-sm font-bold text-blue-700">
          ⏱ {totalTime} นาที
        </span>
      </div>
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
}

function RouteOptionCard({
  option,
  index,
  isActive,
  isCheapest,
  isFastest,
  lines,
  onSelect,
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
            {isCheapest && (
              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                🏷️ ถูกสุด
              </span>
            )}
            {isFastest && !isCheapest && (
              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                ⚡ เร็วสุด
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
          {/* Journey Timeline */}
          <JourneyTimeline
            steps={routeResult.steps}
            segments={routeResult.segments}
            totalTime={routeResult.total_time_min}
          />
          {/* Fare Breakdown */}
          <FareBreakdown fareResult={fareResult} />
        </div>
      )}
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
  const fastestTime = Math.min(
    ...routeOptions.map((o) => o.routeResult.total_time_min),
  );

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-800 text-sm">
        🚇 เส้นทาง{" "}
        {routeOptions.length > 1 ? `(${routeOptions.length} ตัวเลือก)` : ""}
      </h3>
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
        />
      ))}
    </div>
  );
}
