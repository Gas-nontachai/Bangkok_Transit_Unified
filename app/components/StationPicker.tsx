import { useState, useMemo, useEffect, useRef } from "react";
import type { Station, Line, StationLine } from "~/lib/types";
import { getAliases } from "~/lib/station-aliases";

interface StationPickerProps {
  stations: Station[];
  lines: Line[];
  stationLines: StationLine[];
  label: string;
  value: Station | null;
  onChange: (station: Station | null) => void;
  testId?: string;
}

export function StationPicker({
  stations,
  lines,
  stationLines,
  label,
  value,
  onChange,
  testId,
}: StationPickerProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLineCode, setSelectedLineCode] = useState<string | null>(null);
  const [lineHeaderTop, setLineHeaderTop] = useState(88);
  const stickyControlsRef = useRef<HTMLDivElement | null>(null);

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

  // Build line -> ordered stations map (by sequence_order)
  const lineStationsMap = useMemo(() => {
    const map = new Map<string, Station[]>();
    for (const line of lines) {
      const ordered = stationLines
        .filter((sl) => sl.line_id === line.id)
        .sort((a, b) => a.sequence_order - b.sequence_order)
        .map((sl) => stations.find((s) => s.id === sl.station_id))
        .filter(Boolean) as Station[];
      map.set(line.id, ordered);
    }
    return map;
  }, [lines, stationLines, stations]);

  const lineFilterChips = useMemo(() => {
    const usedLineIds = new Set(stationLines.map((sl) => sl.line_id));
    return lines
      .filter((line) => usedLineIds.has(line.id))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [lines, stationLines]);

  // Filter lines by selected line chip
  const visibleLines = useMemo(() => {
    if (!selectedLineCode) return lines;
    return lines.filter((line) => line.code === selectedLineCode);
  }, [selectedLineCode, lines]);

  // Grouped result (no query): sections per visible line
  const groupedSections = useMemo(() => {
    if (query.trim()) return null;
    return visibleLines
      .map((line) => ({
        line,
        stations: lineStationsMap.get(line.id) || [],
      }))
      .filter((s) => s.stations.length > 0);
  }, [query, visibleLines, lineStationsMap]);

  // Flat search result (with query)
  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    const candidates = selectedLineCode
      ? stations.filter((s) => {
          const sLines = stationLineMap.get(s.id) || [];
          return sLines.some((l) => l.code === selectedLineCode);
        })
      : stations;
    return candidates.filter((s) => {
      const nameTh = s.name_th.toLowerCase();
      const nameEn = s.name_en.toLowerCase();
      const code = s.code?.toLowerCase() ?? "";
      const aliases = getAliases(s.name_th).map((a) => a.toLowerCase());

      return (
        nameTh.includes(q) ||
        nameEn.includes(q) ||
        code.includes(q) ||
        q.includes(nameTh) ||
        aliases.some((alias) => alias.includes(q) || q.includes(alias))
      );
    });
  }, [query, stations, selectedLineCode, stationLineMap]);

  const stationLines_ = (station: Station) =>
    stationLineMap.get(station.id) || [];

  const close = () => {
    setIsOpen(false);
    setQuery("");
  };

  useEffect(() => {
    if (!isOpen) return;
    if (!stickyControlsRef.current) return;

    const controlsEl = stickyControlsRef.current;
    const updateTop = () => setLineHeaderTop(controlsEl.offsetHeight);
    updateTop();

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateTop)
        : null;
    observer?.observe(controlsEl);
    window.addEventListener("resize", updateTop);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateTop);
    };
  }, [isOpen]);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div
        className="flex items-center border border-gray-300 rounded-lg bg-white cursor-pointer"
        onClick={() => setIsOpen(true)}
        data-testid={testId}
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
          <span className="flex-1 px-3 py-2 text-gray-400">ค้นหาสถานี...</span>
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
          <div className="fixed inset-0 z-10" onClick={close} />
          {/* Dropdown */}
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
            {/* Search input */}
            <div
              ref={stickyControlsRef}
              className="sticky top-0 z-30 bg-white border-b border-gray-100 p-2 space-y-2"
            >
              <input
                type="text"
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ชื่อไทย, English, หรือรหัส (เช่น E4)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {/* Line filter chips */}
              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => setSelectedLineCode(null)}
                  className={`text-xs px-2 py-0.5 rounded-full border font-medium transition-colors ${
                    !selectedLineCode
                      ? "bg-gray-800 text-white border-gray-800"
                      : "text-gray-600 border-gray-300 hover:border-gray-500"
                  }`}
                >
                  ทั้งหมด
                </button>
                {lineFilterChips.map((line) => (
                  <button
                    key={line.id}
                    onClick={() =>
                      setSelectedLineCode(
                        selectedLineCode === line.code ? null : line.code,
                      )
                    }
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium transition-colors ${
                      selectedLineCode === line.code
                        ? "bg-gray-800 text-white border-gray-800"
                        : "text-gray-600 border-gray-300 hover:border-gray-500"
                    }`}
                  >
                    {line.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Station list */}
            {searchResults !== null ? (
              /* Flat search results */
              searchResults.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">
                  ไม่พบสถานีที่ค้นหา
                </div>
              ) : (
                searchResults.map((station) => (
                  <StationRow
                    key={station.id}
                    station={station}
                    lines={stationLines_(station)}
                    onClick={() => {
                      onChange(station);
                      close();
                    }}
                  />
                ))
              )
            ) : (
              /* Grouped by line */
              groupedSections?.map(({ line, stations: lineStations }) => (
                <div key={line.id}>
                  {/* Line header */}
                  <div
                    className="sticky z-10 flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: line.color, top: lineHeaderTop }}
                  >
                    <span>{line.code}</span>
                    <span>{line.name_th}</span>
                  </div>
                  {lineStations.map((station) => (
                    <StationRow
                      key={`${line.id}-${station.id}`}
                      station={station}
                      lines={stationLines_(station)}
                      onClick={() => {
                        onChange(station);
                        close();
                      }}
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StationRow({
  station,
  lines,
  onClick,
}: {
  station: Station;
  lines: Line[];
  onClick: () => void;
}) {
  return (
    <button
      className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-50 last:border-0"
      onClick={onClick}
    >
      <div className="font-medium text-gray-900 text-sm">{station.name_th}</div>
      <div className="text-xs text-gray-500">{station.name_en}</div>
      <div className="flex gap-1 mt-0.5 flex-wrap">
        {lines.map((line) => (
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
}
