import type { RouteResult, Line, Station } from "~/lib/types";
import { FareBreakdown } from "./FareBreakdown";
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

function LineColorDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-3 h-3 rounded-full flex-shrink-0"
      style={{ backgroundColor: color }}
    />
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

function RouteOptionCard({ option, index, isActive, isCheapest, isFastest, lines, onSelect }: RouteOptionCardProps) {
  const { routeResult, fareResult } = option;
  const lineMap = new Map(lines.map((l) => [l.id, l]));

  // Get unique lines used (non-transfer steps only)
  const usedLineIds = [...new Set(
    routeResult.steps.filter((s) => s.line && !s.is_transfer).map((s) => s.line!.id)
  )];
  const transferCount = routeResult.steps.filter((s) => s.is_transfer).length;

  return (
    <div className={`border rounded-lg overflow-hidden transition-colors ${isActive ? "border-blue-400 shadow-sm" : "border-gray-200"}`}>
      {/* Card Header (always visible) */}
      <button
        onClick={onSelect}
        className={`w-full flex items-center justify-between p-3 transition-colors text-left ${isActive ? "bg-blue-50 hover:bg-blue-100" : "bg-white hover:bg-gray-50"}`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Route number */}
          <span className="text-xs font-bold text-gray-500 w-5 flex-shrink-0">#{index + 1}</span>
          {/* Line dots */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {usedLineIds.map((lid) => {
              const line = lineMap.get(lid);
              return line ? <LineColorDot key={lid} color={line.color} /> : null;
            })}
          </div>
          {/* Fare + time */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-bold text-gray-900">
              {fareResult.segments.some((s) => s.isEstimated) ? "~" : ""}฿{fareResult.totalFare}
            </span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-600">{routeResult.total_time_min} นาที</span>
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
        <span className="text-gray-400 text-xs ml-2">{isActive ? "▲" : "▼"}</span>
      </button>

      {/* Expandable detail */}
      {isActive && (
        <div className="border-t border-gray-100 p-3 space-y-3 bg-gray-50">
          {/* Route Steps */}
          <div className="space-y-1">
            {routeResult.steps.map((step, i) => {
              const line = step.line ? lineMap.get(step.line.id) || step.line : null;
              if (step.is_transfer) {
                return (
                  <div key={i} className="flex items-center gap-2 py-1 px-2 bg-orange-50 rounded text-xs text-orange-700">
                    <span>🔄</span>
                    <span>เปลี่ยนสาย → {line?.name_th}</span>
                  </div>
                );
              }
              return (
                <div key={i} className="flex items-center gap-2 py-0.5">
                  {line ? <LineColorDot color={line.color} /> : <span className="w-3 h-3" />}
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-800">{step.station.name_th}</span>
                    <span className="text-xs text-gray-400 ml-1">{step.station.name_en}</span>
                  </div>
                  {i === 0 && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">ต้นทาง</span>}
                  {i === routeResult.steps.length - 1 && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">ปลายทาง</span>}
                </div>
              );
            })}
          </div>
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
  const fastestTime = Math.min(...routeOptions.map((o) => o.routeResult.total_time_min));

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-800 text-sm">
        🚇 เส้นทาง {routeOptions.length > 1 ? `(${routeOptions.length} ตัวเลือก)` : ""}
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
