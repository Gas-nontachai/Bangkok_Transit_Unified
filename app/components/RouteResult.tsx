import type { RouteResult, Line, Station } from "~/lib/types";
import { FareBreakdown } from "./FareBreakdown";
import type { FareResult } from "~/lib/fare";

interface RouteResultProps {
  routeResult: RouteResult | null;
  fareResult: FareResult | null;
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

export function RouteResultDisplay({
  routeResult,
  fareResult,
  stations,
  lines,
  isLoading,
  error,
}: RouteResultProps) {
  const stationMap = new Map(stations.map((s) => [s.id, s]));
  const lineMap = new Map(lines.map((l) => [l.id, l]));

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

  if (!routeResult) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        <div className="text-4xl mb-2">🗺️</div>
        <p>เลือกสถานีต้นทางและปลายทาง</p>
        <p>แล้วกด "ค้นหาเส้นทาง"</p>
      </div>
    );
  }

  if (routeResult.steps.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700 text-sm">
        ⚠️ ไม่พบเส้นทางที่เชื่อมสถานีนี้
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-4 text-sm">
        <div className="text-center">
          <div className="font-bold text-blue-800 text-lg">
            {routeResult.total_time_min}
          </div>
          <div className="text-blue-600 text-xs">นาที</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-blue-800 text-lg">
            {routeResult.steps.length - 1}
          </div>
          <div className="text-blue-600 text-xs">สถานี</div>
        </div>
      </div>

      {/* Route Steps */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-2 text-sm">🚇 เส้นทาง</h3>
        <div className="space-y-1">
          {routeResult.steps.map((step, i) => {
            const station = stationMap.get(step.station.id) || step.station;
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
              <div key={i} className="flex items-center gap-2 py-1">
                {line && <LineColorDot color={line.color} />}
                {!line && <span className="w-3 h-3" />}
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-800">
                    {station.name_th}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">
                    {station.name_en}
                  </span>
                </div>
                {i === 0 && (
                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                    ต้นทาง
                  </span>
                )}
                {i === routeResult.steps.length - 1 && (
                  <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                    ปลายทาง
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fare Breakdown */}
      {fareResult && <FareBreakdown fareResult={fareResult} />}
    </div>
  );
}
