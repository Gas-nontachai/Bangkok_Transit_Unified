interface MapToggleFABProps {
  showMap: boolean;
  onToggle: () => void;
  hasRoute: boolean;
}

export function MapToggleFAB({ showMap, onToggle, hasRoute }: MapToggleFABProps) {
  return (
    <button
      onClick={onToggle}
      className={`
        md:hidden fixed bottom-6 right-4 z-40
        flex items-center gap-2 px-4 py-3 rounded-full shadow-lg
        font-semibold text-sm text-white
        transition-all duration-200 active:scale-95
        ${showMap
          ? "bg-gray-700 hover:bg-gray-800"
          : hasRoute
          ? "bg-blue-600 hover:bg-blue-700"
          : "bg-gray-500 hover:bg-gray-600"}
      `}
      aria-label={showMap ? "ปิดแผนที่" : "เปิดแผนที่"}
    >
      <span className="text-base">{showMap ? "✕" : "🗺️"}</span>
      <span>{showMap ? "ปิดแผนที่" : "แผนที่"}</span>
      {hasRoute && !showMap && (
        <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
      )}
    </button>
  );
}
