import type { FareResult } from "~/lib/fare";

interface FareBreakdownProps {
  fareResult: FareResult;
}

export function FareBreakdown({ fareResult }: FareBreakdownProps) {
  if (fareResult.segments.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-800 mb-3">💰 ค่าโดยสาร</h3>
      <div className="space-y-2">
        {fareResult.segments.map((seg, i) => (
          <div key={i} className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">{seg.lineName}</span>
              <span className="text-xs text-gray-500">({seg.operatorCode})</span>
            </div>
            <span className="font-medium text-gray-900">
              {seg.fare > 0 ? `฿${seg.fare}` : "ไม่พบข้อมูล"}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
        <span className="font-semibold text-gray-800">รวม</span>
        <span className="text-lg font-bold text-blue-600">
          ฿{fareResult.totalFare}
        </span>
      </div>
    </div>
  );
}
