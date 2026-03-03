import type { FareResult } from "~/lib/fare";
import type { Line } from "~/lib/types";

interface FareBreakdownProps {
  fareResult: FareResult;
  lines?: Line[];
}

export function FareBreakdown({ fareResult, lines }: FareBreakdownProps) {
  if (fareResult.segments.length === 0) return null;

  const lineColorMap = new Map(lines?.map((l) => [l.name_th, l.color]) ?? []);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-800 mb-3">💰 ค่าโดยสาร</h3>
      <div className="space-y-2">
        {fareResult.segments.map((seg, i) => {
          const color = lineColorMap.get(seg.lineName);
          return (
            <div
              key={i}
              className="flex justify-between items-center text-sm rounded-lg px-2 py-1.5"
              style={color ? { backgroundColor: color + "18", borderLeft: `3px solid ${color}` } : { paddingLeft: "8px" }}
            >
              <div className="flex items-center gap-2">
                {color && (
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {seg.operatorCode}
                  </span>
                )}
                <span className="font-medium text-gray-800">{seg.lineName}</span>
                {!color && (
                  <span className="text-xs text-gray-500">({seg.operatorCode})</span>
                )}
              </div>
              <span className="font-semibold text-gray-900">
                {seg.isEstimated ? `~฿${seg.fare}` : `฿${seg.fare}`}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
        <span className="font-semibold text-gray-800">รวม</span>
        <span className="text-lg font-bold text-blue-600">
          {fareResult.segments.some((s) => s.isEstimated) ? "~" : ""}฿
          {fareResult.totalFare}
        </span>
      </div>
    </div>
  );
}
