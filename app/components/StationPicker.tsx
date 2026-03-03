import { useState, useMemo } from "react";
import type { Station, Line, StationLine } from "~/lib/types";

interface StationPickerProps {
  stations: Station[];
  lines: Line[];
  stationLines: StationLine[];
  label: string;
  value: Station | null;
  onChange: (station: Station | null) => void;
}

export function StationPicker({
  stations,
  lines,
  stationLines,
  label,
  value,
  onChange,
}: StationPickerProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Build station -> lines map
  const stationLineMap = useMemo(() => {
    const map = new Map<string, Line[]>();
    for (const sl of stationLines) {
      const line = lines.find((l) => l.id === sl.line_id);
      if (!line) continue;
      if (!map.has(sl.station_id)) map.set(sl.station_id, []);
      map.get(sl.station_id)!.push(line);
    }
    return map;
  }, [stationLines, lines]);

  const filtered = useMemo(() => {
    if (!query.trim()) return stations.slice(0, 50);
    const q = query.toLowerCase();
    return stations.filter(
      (s) =>
        s.name_th.toLowerCase().includes(q) ||
        s.name_en.toLowerCase().includes(q) ||
        (s.code && s.code.toLowerCase().includes(q))
    );
  }, [query, stations]);

  const stationLines_ = (station: Station) =>
    stationLineMap.get(station.id) || [];

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div
        className="flex items-center border border-gray-300 rounded-lg bg-white cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        {value ? (
          <div className="flex-1 px-3 py-2">
            <div className="font-medium text-gray-900">{value.name_th}</div>
            <div className="text-xs text-gray-500">{value.name_en}</div>
            <div className="flex gap-1 mt-1 flex-wrap">
              {stationLines_(value).map((line) => (
                <span
                  key={line.id}
                  className="text-xs px-1.5 py-0.5 rounded text-white font-medium"
                  style={{ backgroundColor: line.color }}
                >
                  {line.code}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <span className="flex-1 px-3 py-2 text-gray-400">
            ค้นหาสถานี...
          </span>
        )}
        {value && (
          <button
            className="px-3 py-2 text-gray-400 hover:text-gray-600"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
              setQuery("");
            }}
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setIsOpen(false);
              setQuery("");
            }}
          />
          {/* Dropdown */}
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-2">
              <input
                type="text"
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ชื่อไทย, English, หรือรหัส (เช่น E4)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                ไม่พบสถานีที่ค้นหา
              </div>
            ) : (
              filtered.map((station) => {
                const sLines = stationLines_(station);
                return (
                  <button
                    key={station.id}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                    onClick={() => {
                      onChange(station);
                      setIsOpen(false);
                      setQuery("");
                    }}
                  >
                    <div className="font-medium text-gray-900 text-sm">
                      {station.name_th}
                    </div>
                    <div className="text-xs text-gray-500">{station.name_en}</div>
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {sLines.map((line) => (
                        <span
                          key={line.id}
                          className="text-xs px-1.5 py-0.5 rounded text-white font-medium"
                          style={{ backgroundColor: line.color }}
                        >
                          {line.code}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
