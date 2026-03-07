# Tasks: Bangkok Transit Unified — UX Improvements v2

> Generated from [prd-transit-ux-improvements.md](../prd/prd-transit-ux-improvements.md)

## Relevant Files

- `supabase/seed/seed_edges.sql` - Transfer edges + Blue Line loop edge data
- `supabase/seed/seed_stations.sql` - Station data (is_interchange flags, coordinates)
- `app/lib/graph.ts` - `buildAdjacencyList()` — builds bidirectional adjacency list from edges
- `app/lib/graph.test.ts` - Unit tests for graph building
- `app/lib/dijkstra.ts` - Route finding algorithm (Dijkstra with transfer penalties)
- `app/lib/dijkstra.test.ts` - Unit tests for route finding
- `app/lib/station-aliases.ts` - **(NEW)** Station alias map for fuzzy search
- `app/components/TransitMap.tsx` - Leaflet map component — add line polylines + highlight/dim
- `app/components/TransitMap.test.tsx` - Unit tests for TransitMap
- `app/components/StationPicker.tsx` - Station search/picker — integrate alias matching
- `app/components/StationPicker.test.tsx` - Unit tests for StationPicker
- `app/components/RouteResult.tsx` - Route result display — comparison bar + diff badges
- `app/components/RouteResult.test.tsx` - Unit tests for RouteResult
- `app/components/FareBreakdown.tsx` - Fare breakdown display
- `app/components/FareBreakdown.test.tsx` - Unit tests for FareBreakdown
- `app/routes/home.tsx` - Main page — ties all components together
- `e2e/transit.spec.ts` - End-to-end Playwright tests

### Notes

- Unit tests are placed alongside the code files they test (e.g., `TransitMap.tsx` and `TransitMap.test.tsx` in the same directory).
- Use `npx vitest run` to run unit tests. Use `npx playwright test` to run E2E tests.
- Seed data changes require re-seeding the database (`supabase db reset` or re-running seed SQL).
- `buildAdjacencyList()` in `graph.ts` already creates **bidirectional edges** — no fix needed for FR-4.6.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

---

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch: `git checkout -b feature/transit-ux-improvements`

- [x] 1.0 Fix seed data — Transfer edges, Blue Line loop, station corrections
  - [x] 1.1 Open `supabase/seed/seed_stations.sql` and fix station 083 (เพชรบุรี BL21) **coordinates**: change lat from `13.81199` → `13.7500` and lng from `100.56087` → `100.5413`
  - [x] 1.2 In the same file, change `is_interchange` to `true` for station 076 (พหลโยธิน BL14), station 162 (มักกะสัน ARL03), station 083 (เพชรบุรี BL21), and station 073 (บางซื่อ BL11)
  - [x] 1.3 Open `supabase/seed/seed_edges.sql` and add 3 new **transfer edges** (with `is_transfer = true`) at the end before the closing semicolon:
    - `('30000000-0000-0000-0000-000000000185', '10000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000076', '02000000-0000-0000-0000-000000000004', 5, true)` — ห้าแยกลาดพร้าว BTS ↔ พหลโยธิน MRT Blue
    - `('30000000-0000-0000-0000-000000000186', '10000000-0000-0000-0000-000000000162', '10000000-0000-0000-0000-000000000083', '02000000-0000-0000-0000-000000000004', 5, true)` — มักกะสัน ARL ↔ เพชรบุรี MRT Blue
    - `('30000000-0000-0000-0000-000000000187', '10000000-0000-0000-0000-000000000167', '10000000-0000-0000-0000-000000000073', '02000000-0000-0000-0000-000000000004', 5, true)` — กรุงเทพอภิวัฒน์ SRT ↔ บางซื่อ MRT Blue
  - [x] 1.4 In the same file, add 1 new **regular edge** (with `is_transfer = false`) to close the MRT Blue Line loop:
    - `('30000000-0000-0000-0000-000000000188', '10000000-0000-0000-0000-000000000095', '10000000-0000-0000-0000-000000000063', '02000000-0000-0000-0000-000000000004', 2, false)` — บางไผ่ → ท่าพระ (สาย BLU)
  - [x] 1.5 Verify `graph.ts` `buildAdjacencyList()` already creates **bidirectional edges** (forward + reverse for every edge) — confirm no code change needed (it already does: see lines 22-43 where both directions are pushed)
  - [x] 1.6 Run `npx vitest run app/lib/graph.test.ts` to confirm graph tests still pass after understanding the code

- [x] 2.0 Draw transit line polylines on map (FR-1)
  - [x] 2.1 Open `app/components/TransitMap.tsx`. Add a new `useRef` called `basePolylinesRef` (type `unknown[]`) to store background line polylines, similar to the existing `polylineRef`
  - [x] 2.2 Inside `initMap()`, **before** the station marker loop, build a `lineStationsOrdered` map: for each line, sort its `stationLines` by `sequence_order`, then map to lat/lng coordinates from `stations`
  - [x] 2.3 For each line, create a Leaflet `L.polyline()` with the ordered coordinates, using `{ color: line.color, weight: 4, opacity: 0.5 }`. Add each polyline to the map and push to `basePolylinesRef.current`
  - [x] 2.4 Store the Leaflet polyline objects so their opacity can be changed later (e.g., store as `{ polyline, lineId }` tuples in the ref)
  - [x] 2.5 Verify: open the app in browser — all 10 transit lines should appear as colored lines on the map

- [x] 3.0 Highlight selected route and dim background lines (FR-2)
  - [x] 3.1 In `TransitMap.tsx`, modify the `drawRoute()` function: at the start, iterate `basePolylinesRef.current` and set each polyline's opacity to `0.15` using `.setStyle({ opacity: 0.15 })`
  - [x] 3.2 Change the route highlight polylines from `weight: 5, opacity: 0.8` to `weight: 6, opacity: 1.0`
  - [x] 3.3 Add a cleanup/reset behavior: when `routeSteps` is empty or undefined, iterate `basePolylinesRef.current` and restore opacity to `0.5`
  - [x] 3.4 Make sure the useEffect dependency array includes the necessary state so that when route is cleared, background lines restore to normal opacity
  - [x] 3.5 Verify: search a route → background lines should dim, selected route should be bold. Clear route → background lines restore
  - [x] 3.6 Update `app/components/TransitMap.test.tsx` — add test that verifies polylines are created for lines data

- [x] 4.0 Add station alias search (FR-3)
  - [x] 4.1 Create new file `app/lib/station-aliases.ts` with a `STATION_ALIASES` map: keys are `name_th` values from `seed_stations.sql`, values are arrays of alias strings. Include at minimum:
    - `"จตุจักร"` → `["สวนจตุจักร", "chatuchak park", "jj", "jj market"]`
    - `"ห้าแยกลาดพร้าว"` → `["ลาดพร้าว bts", "union mall", "ลาดพร้าว intersection"]`
    - `"กรุงเทพอภิวัฒน์"` → `["บางซื่อ กลาง", "bang sue grand", "krung thep aphiwat", "สถานีกลาง"]`
    - `"พญาไท"` → `["phaya thai", "airport link พญาไท"]`
    - `"มักกะสัน"` → `["makkasan", "airport link มักกะสัน"]`
    - `"สยาม"` → `["siam", "siam paragon", "สยามพารากอน"]`
    - `"อโศก"` → `["asok", "asoke", "terminal 21"]`
    - `"หมอชิต"` → `["mo chit", "หมอชิต bts", "สถานีขนส่งหมอชิต"]`
    - `"สำโรง"` → `["samrong", "สำโรง bts"]`
    - `"เพชรบุรี"` → `["phetchaburi", "มักกะสัน mrt"]`
  - [x] 4.2 Export a helper function `getAliases(nameTh: string): string[]` that returns aliases for a given Thai name, or empty array if none
  - [x] 4.3 Open `app/components/StationPicker.tsx`. In the `searchResults` useMemo, modify the filter logic to:
    - Keep existing match: `name_th.includes(q)`, `name_en.includes(q)`, `code.includes(q)`
    - Add **reverse match**: `q.includes(name_th.toLowerCase())` (bidirectional includes — if query contains the station name)
    - Add **alias match**: check if any alias from `getAliases(s.name_th)` includes `q` or `q` includes alias
  - [x] 4.4 Import `getAliases` from `~/lib/station-aliases` at the top of `StationPicker.tsx`
  - [x] 4.5 Verify: type "สวนจตุจักร" → should show "จตุจักร (Chatuchak Park) BL13". Type "jj" → should also match
  - [x] 4.6 Update `app/components/StationPicker.test.tsx` — add test cases:
    - Search "สวนจตุจักร" → matches station "จตุจักร"
    - Search "jj" → matches station "จตุจักร"
    - Search "union mall" → matches station "ห้าแยกลาดพร้าว"
    - Existing searches still work (name_th, name_en, code)

- [x] 5.0 Add route comparison summary bar (FR-6)
  - [x] 5.1 Open `app/components/RouteResult.tsx`. Create a new component `RouteComparisonBar` that receives `routeOptions: RouteOption[]`, `activeIndex: number`, `onSelectRoute: (i: number) => void`, and `lines: Line[]`
  - [x] 5.2 `RouteComparisonBar` renders a horizontal scroll container (`flex overflow-x-auto gap-2 pb-2`) with a mini card for each route option showing:
    - Route number (`#1`, `#2`, `#3`)
    - Line color dots (same logic as `RouteOptionCard` header)
    - Fare (`฿34`)
    - Time (`32 นาที`)
    - Badge: `🏷️ ถูกสุด` (green) or `⚡ เร็วสุด` (blue) where applicable
  - [x] 5.3 Each mini card should be clickable, calling `onSelectRoute(index)` on click
  - [x] 5.4 Active card styling: `border-blue-400 bg-blue-50`, inactive: `border-gray-200 bg-white`
  - [x] 5.5 Mini cards should have `min-w-[140px]` to prevent being too narrow on mobile
  - [x] 5.6 In `RouteResultDisplay`, render `RouteComparisonBar` **above** the route cards list, only when `routeOptions.length > 1`
  - [x] 5.7 Verify: search a route with multiple options → comparison bar appears above with clickable cards; clicking a card expands the corresponding detail card below

- [x] 6.0 Add diff info to route badges (FR-7)
  - [x] 6.1 In `RouteResultDisplay`, compute:
    - `cheapestFare` = `routeOptions[0].fareResult.totalFare` (already sorted by fare)
    - `mostExpensiveFare` = `Math.max(...routeOptions.map(o => o.fareResult.totalFare))`
    - `fastestTime` = `Math.min(...routeOptions.map(o => o.routeResult.total_time_min))`
    - `slowestTime` = `Math.max(...routeOptions.map(o => o.routeResult.total_time_min))`
  - [x] 6.2 Pass `fareDiff` and `timeDiff` values to `RouteOptionCard` as new props:
    - `fareSaving`: for the cheapest route = `mostExpensiveFare - cheapestFare` (how much cheaper vs most expensive)
    - `timeSaving`: for the fastest route = `slowestTime - fastestTime` (how much faster vs slowest)
  - [x] 6.3 In `RouteOptionCard`, update badge rendering:
    - If only 1 route → no badge at all
    - If `isCheapest && isFastest` → show single badge: `🏷️ ถูก+เร็วสุด` (green)
    - If `isCheapest && !isFastest` → show: `🏷️ ถูกกว่า ฿{fareSaving}` (green)
    - If `isFastest && !isCheapest` → show: `⚡ เร็วกว่า {timeSaving} นาที` (blue)
  - [x] 6.4 Also update the `RouteComparisonBar` mini cards badges with the same diff info
  - [x] 6.5 Verify: with 2+ routes, badge shows "ถูกกว่า ฿8" instead of just "ถูกสุด"; single route shows no badge
  - [x] 6.6 Update `app/components/RouteResult.test.tsx` — add test cases:
    - 2 routes: cheapest shows "ถูกกว่า ฿X" badge
    - 2 routes: fastest shows "เร็วกว่า X นาที" badge
    - 1 route: no badge shown
    - Route is both cheapest and fastest: shows "ถูก+เร็วสุด"

- [x] 7.0 Update tests and final verification
  - [x] 7.1 Run all unit tests: `npx vitest run` — fix any failures
  - [ ] 7.2 Run E2E tests: `npx playwright test` — fix any failures
  - [ ] 7.3 Manual smoke test checklist:
    - [ ] Open app → 10 colored transit lines visible on map
    - [ ] Search route → selected route highlighted, other lines dimmed
    - [ ] Clear route → all lines restore to normal
    - [ ] Type "สวนจตุจักร" in station picker → "จตุจักร" appears
    - [ ] Search route: มักกะสัน → หัวลำโพง → finds ARL→(walk)→MRT Blue
    - [ ] Search route: บางหว้า → อิสรภาพ → finds route via ท่าพระ (Blue loop)
    - [ ] Search route with 2+ options → comparison bar shows, badges show diff values
  - [ ] 7.4 Commit all changes with descriptive message: `git add . && git commit -m "feat: transit UX improvements - map lines, alias search, transfer edges, route comparison"`
