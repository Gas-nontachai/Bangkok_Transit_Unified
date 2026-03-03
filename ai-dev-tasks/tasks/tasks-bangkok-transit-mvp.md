# Tasks: Bangkok Transit Unified MVP

## Relevant Files

- `app/root.tsx` - Root layout component, จะต้องเพิ่ม global providers (e.g., map CSS)
- `app/routes.ts` - Route configuration, อาจต้องปรับ route structure
- `app/routes/home.tsx` - Homepage route, จะเป็นหน้าหลักแสดง map + station picker
- `app/app.css` - Global styles, เพิ่ม Leaflet CSS และ custom styles
- `app/lib/supabase.server.ts` - Supabase client สำหรับ server-side data fetching
- `app/lib/types.ts` - TypeScript types/interfaces สำหรับ database schema ทั้งหมด
- `app/lib/dijkstra.ts` - Dijkstra shortest path algorithm (client-side)
- `app/lib/dijkstra.test.ts` - Unit tests สำหรับ Dijkstra algorithm
- `app/lib/fare.ts` - Fare calculation logic แยกตาม operator segment
- `app/lib/fare.test.ts` - Unit tests สำหรับ fare calculation
- `app/lib/graph.ts` - Adjacency list builder จาก edges data
- `app/lib/graph.test.ts` - Unit tests สำหรับ graph builder
- `app/components/StationPicker.tsx` - Station autocomplete search component
- `app/components/StationPicker.test.tsx` - Unit tests สำหรับ StationPicker
- `app/components/RouteResult.tsx` - Route result display (steps, transfers, fare)
- `app/components/RouteResult.test.tsx` - Unit tests สำหรับ RouteResult
- `app/components/TransitMap.tsx` - Leaflet interactive map component
- `app/components/TransitMap.test.tsx` - Unit tests สำหรับ TransitMap
- `app/components/FareBreakdown.tsx` - Fare breakdown display แยกตาม operator
- `app/components/FareBreakdown.test.tsx` - Unit tests สำหรับ FareBreakdown
- `supabase/migrations/001_create_schema.sql` - Database schema migration (all tables)
- `supabase/migrations/002_rls_policies.sql` - Row Level Security policies
- `supabase/seed/seed_operators.sql` - Seed data สำหรับ operators table
- `supabase/seed/seed_lines.sql` - Seed data สำหรับ lines table
- `supabase/seed/seed_stations.sql` - Seed data สำหรับ stations table (~144 records)
- `supabase/seed/seed_station_lines.sql` - Seed data สำหรับ station_lines table (~155 records)
- `supabase/seed/seed_edges.sql` - Seed data สำหรับ edges table (~160+ records)
- `supabase/seed/seed_fare_matrix.sql` - Seed data สำหรับ fare_matrix table (~3,000+ records)
- `.env.example` - ตัวอย่าง environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `dijkstra.ts` and `dijkstra.test.ts` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
- ข้อมูลสถานีอ้างอิงจากไฟล์ใน `ai-dev-tasks/data/` ทั้ง 5 ไฟล์
- PRD อ้างอิงจาก `ai-dev-tasks/prd/prd_bangkok_transit_mvp.md`
- ค่าโดยสารบางสายต้อง interpolate จากช่วงราคา ยอมรับ error ±5 บาท
- lat/lng ของสถานีต้องหาเพิ่มจาก OpenStreetMap หรือ Google Maps
- travel_time_min ใช้ค่าประมาณ ~2–3 นาทีต่อสถานี, transfer ~5 นาที

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and checkout a new branch for this feature (`git checkout -b feature/bangkok-transit-mvp`)

- [ ] 1.0 Project Setup & Dependencies
  - [ ] 1.1 ติดตั้ง Supabase client library (`@supabase/supabase-js`)
  - [ ] 1.2 ติดตั้ง Leaflet และ react-leaflet (`leaflet`, `react-leaflet`, `@types/leaflet`)
  - [ ] 1.3 สร้างไฟล์ `.env.example` พร้อมตัวแปร `SUPABASE_URL` และ `SUPABASE_ANON_KEY`
  - [ ] 1.4 สร้างไฟล์ `.env` (local) พร้อมใส่ค่าจริงจาก Supabase project (ต้องสร้าง Supabase project ก่อน)
  - [ ] 1.5 เพิ่ม `.env` ใน `.gitignore` (ถ้ายังไม่มี)
  - [ ] 1.6 ตั้งค่า Jest หรือ Vitest สำหรับ unit testing (`vitest`, `@testing-library/react`, `@testing-library/jest-dom`)
  - [ ] 1.7 ตรวจสอบว่า `npm run dev` ยังทำงานได้ปกติหลังติดตั้ง dependencies ทั้งหมด

- [ ] 2.0 Database Schema & RLS Setup
  - [ ] 2.1 สร้างโฟลเดอร์ `supabase/migrations/` และ `supabase/seed/`
  - [ ] 2.2 สร้างไฟล์ `001_create_schema.sql` — สร้างตาราง `operators` (id, name_th, name_en, code)
  - [ ] 2.3 เพิ่มตาราง `lines` (id, operator_id FK, name_th, name_en, code, color) ใน migration file
  - [ ] 2.4 เพิ่มตาราง `stations` (id, name_th, name_en, code, lat, lng, is_interchange) ใน migration file
  - [ ] 2.5 เพิ่มตาราง `station_lines` (station_id FK, line_id FK, sequence_order, PK composite) ใน migration file
  - [ ] 2.6 เพิ่มตาราง `edges` (id, from_station_id FK, to_station_id FK, line_id FK, travel_time_min, is_transfer) ใน migration file
  - [ ] 2.7 เพิ่มตาราง `fare_matrix` (id, line_id FK, from_station_id FK, to_station_id FK, fare, unique constraint) ใน migration file
  - [ ] 2.8 สร้างไฟล์ `002_rls_policies.sql` — Enable RLS บนทุกตาราง + สร้าง public read-only policy สำหรับทุกตาราง
  - [ ] 2.9 รัน migration บน Supabase project (ผ่าน Supabase CLI หรือ Dashboard SQL Editor)
  - [ ] 2.10 ตรวจสอบว่าตารางทั้งหมดถูกสร้างสำเร็จและ RLS ทำงานถูกต้อง

- [ ] 3.0 Data Seeding
  - [ ] 3.1 สร้าง `seed_operators.sql` — Insert 4 operators: BTS, MRT (MRTA), ARL, SRT
  - [ ] 3.2 สร้าง `seed_lines.sql` — Insert 11 lines พร้อม operator_id, code, color hex ตาม PRD (SUK, SIL, GOLD, BLU, PUR, YEL, PNK, ARL, RDD, RDL)
  - [ ] 3.3 สร้าง `seed_stations.sql` — แปลงข้อมูลจาก `ai-dev-tasks/data/bts_line.md` เป็น INSERT statements สำหรับ BTS สุขุมวิท (47 สถานี) และ สีลม (14 สถานี)
  - [ ] 3.4 เพิ่ม INSERT statements สำหรับ BTS Gold Line (3 สถานี) จาก `bts_gold_line.md`
  - [ ] 3.5 เพิ่ม INSERT statements สำหรับ MRT ทุกสาย จาก `mrt_line.md` — สีน้ำเงิน (38), สีม่วง (16), สีเหลือง (23), สีชมพู (27 สถานีที่มีชื่อจริง)
  - [ ] 3.6 เพิ่ม INSERT statements สำหรับ ARL (8 สถานี) จาก `airport_rail_link_line.md`
  - [ ] 3.7 เพิ่ม INSERT statements สำหรับ SRT Red Line เข้ม (10) และ อ่อน (4) จาก `srt_red_line.md`
  - [ ] 3.8 หา lat/lng coordinates สำหรับทุกสถานี (จาก OpenStreetMap / Google Maps) และใส่ในแต่ละ INSERT
  - [ ] 3.9 ตั้งค่า `is_interchange = true` สำหรับสถานีร่วมตามรายการใน PRD Section 7.6
  - [ ] 3.10 สร้าง `seed_station_lines.sql` — Insert mapping station ↔ line พร้อม sequence_order สำหรับทุกสาย (~155 records)
  - [ ] 3.11 สร้าง `seed_edges.sql` — Insert adjacent station pairs (เชื่อมสถานีที่ติดกันในแต่ละสาย) พร้อม travel_time_min (ประมาณ 2-3 นาที/สถานี)
  - [ ] 3.12 เพิ่ม transfer walking edges สำหรับ interchange stations ทั้ง 15 จุดตาม PRD Section 7.6 (travel_time_min ~5 นาที, is_transfer = true)
  - [ ] 3.13 สร้าง `seed_fare_matrix.sql` — Generate fare matrix สำหรับ MRT สีน้ำเงิน ตาม step table (Appendix B)
  - [ ] 3.14 Generate fare matrix สำหรับ ARL ตาม step table (Appendix C)
  - [ ] 3.15 Generate fare matrix สำหรับ BTS Gold Line (flat 16 บาททุกคู่สถานี)
  - [ ] 3.16 Generate fare matrix สำหรับ BTS สุขุมวิท/สีลม (interpolate 17–65 บาทตามจำนวนสถานี)
  - [ ] 3.17 Generate fare matrix สำหรับ MRT สีม่วง (interpolate 17–42 บาท), สีเหลือง (15–45 บาท), สีชมพู (15–45 บาท)
  - [ ] 3.18 Generate fare matrix สำหรับ SRT Red Line เข้ม/อ่อน (interpolate 12–42 บาท)
  - [ ] 3.19 รัน seed SQL ทั้งหมดบน Supabase ตามลำดับ (operators → lines → stations → station_lines → edges → fare_matrix)
  - [ ] 3.20 ตรวจสอบจำนวน records ในแต่ละตารางว่าครบถ้วน

- [ ] 4.0 Data Layer & Server Loaders
  - [ ] 4.1 สร้างไฟล์ `app/lib/supabase.server.ts` — Initialize Supabase client ด้วย `SUPABASE_URL` และ `SUPABASE_ANON_KEY` จาก environment variables
  - [ ] 4.2 สร้างไฟล์ `app/lib/types.ts` — Define TypeScript interfaces สำหรับ Operator, Line, Station, StationLine, Edge, FareMatrix
  - [ ] 4.3 สร้าง loader function ใน `app/routes/home.tsx` ที่ fetch operators, lines, stations, station_lines, edges, fare_matrix จาก Supabase
  - [ ] 4.4 ตรวจสอบว่า loader return data ถูกต้อง (console.log หรือแสดงจำนวน records บนหน้าเว็บชั่วคราว)
  - [ ] 4.5 จัดการ error handling ใน loader (กรณี Supabase connection fail หรือ data ไม่ครบ)

- [ ] 5.0 Pathfinding Algorithm (Dijkstra)
  - [ ] 5.1 สร้างไฟล์ `app/lib/graph.ts` — Function `buildAdjacencyList(edges: Edge[])` ที่รับ edges array แล้ว return adjacency list (Map<stationId, Array<{neighbor, lineId, travelTime, isTransfer}>>)
  - [ ] 5.2 สร้างไฟล์ `app/lib/dijkstra.ts` — Function `findShortestPath(graph, fromStationId, toStationId)` ที่ return path array พร้อม total travel time
  - [ ] 5.3 Dijkstra ต้อง return route segments แยกตาม line (เพื่อใช้คำนวณ fare แยก operator)
  - [ ] 5.4 เพิ่ม transfer penalty time ใน edge weight สำหรับ interchange edges
  - [ ] 5.5 เขียน unit tests ใน `app/lib/graph.test.ts` — ทดสอบ buildAdjacencyList ด้วย mock edges data
  - [ ] 5.6 เขียน unit tests ใน `app/lib/dijkstra.test.ts` — ทดสอบ shortest path กรณี: สายเดียว, ข้ามสาย 1 ครั้ง, ข้ามสาย 2+ ครั้ง, ต้นทาง = ปลายทาง
  - [ ] 5.7 ทดสอบ edge cases: สถานีที่ไม่มี path ถึงกัน, interchange station with multiple lines

- [ ] 6.0 Fare Calculation Logic
  - [ ] 6.1 สร้างไฟล์ `app/lib/fare.ts` — Function `calculateFare(routeSegments, fareMatrix)` ที่รับ route segments (แยกตาม line) และ fare_matrix แล้ว return fare breakdown per operator + total
  - [ ] 6.2 Implement logic ระบุ operator segments จาก path — เมื่อ line เปลี่ยน ให้แยกเป็น segment ใหม่
  - [ ] 6.3 Implement fare lookup จาก fare_matrix ตาม (line_id, from_station_id, to_station_id) สำหรับแต่ละ segment
  - [ ] 6.4 Implement fallback logic กรณี fare_matrix ไม่มีข้อมูลคู่สถานีที่ต้องการ (e.g., ใช้ interpolation หรือ return "ไม่พบข้อมูล")
  - [ ] 6.5 เขียน unit tests ใน `app/lib/fare.test.ts` — ทดสอบ: fare สายเดียว, fare ข้ามระบบ (BTS+MRT), fare ข้ามหลายระบบ
  - [ ] 6.6 ทดสอบว่าค่าโดยสารอยู่ในช่วงที่ถูกต้องตาม PRD (±5 บาท)

- [ ] 7.0 Station Selection UI
  - [ ] 7.1 สร้าง `app/components/StationPicker.tsx` — Component สำหรับเลือกสถานี "จาก" และ "ไป" พร้อม autocomplete
  - [ ] 7.2 Implement autocomplete search ที่รองรับค้นหาด้วยชื่อไทย, ชื่ออังกฤษ, และรหัสสถานี (e.g., "สยาม", "Siam", "CEN")
  - [ ] 7.3 แสดงรายการสถานีใน dropdown จัดกลุ่มตามสาย พร้อมสีของสายกำกับ
  - [ ] 7.4 สถานี interchange ต้องแสดงทุกสายที่ผ่าน (e.g., สยาม: สุขุมวิท + สีลม)
  - [ ] 7.5 เพิ่มปุ่ม "สลับสถานี" (swap origin ↔ destination)
  - [ ] 7.6 เพิ่มปุ่ม "ค้นหาเส้นทาง" ที่ trigger route calculation
  - [ ] 7.7 จัดการ state สำหรับ selectedOrigin และ selectedDestination
  - [ ] 7.8 เขียน unit tests ใน `app/components/StationPicker.test.tsx` — ทดสอบ rendering, search filtering, selection

- [ ] 8.0 Route Display UI
  - [ ] 8.1 สร้าง `app/components/RouteResult.tsx` — Component แสดงผลลัพธ์เส้นทาง
  - [ ] 8.2 แสดงรายชื่อสถานีตามลำดับเส้นทาง (route steps) พร้อม line color indicator แต่ละสถานี
  - [ ] 8.3 แสดง transfer points อย่างชัดเจน (icon/badge "เปลี่ยนสาย" + ชื่อสายใหม่)
  - [ ] 8.4 แสดงเวลาเดินทางโดยประมาณ (รวม transfer time) ในรูปแบบ "XX นาที"
  - [ ] 8.5 สร้าง `app/components/FareBreakdown.tsx` — แสดงค่าโดยสารแยกตาม operator (e.g., BTS: 35 บาท, MRT: 25 บาท) + ยอดรวม
  - [ ] 8.6 Integrate FareBreakdown เข้ากับ RouteResult
  - [ ] 8.7 แสดง empty state เมื่อยังไม่ได้ค้นหา และ error state เมื่อหาเส้นทางไม่ได้
  - [ ] 8.8 เขียน unit tests ใน `app/components/RouteResult.test.tsx` และ `app/components/FareBreakdown.test.tsx`

- [ ] 9.0 Interactive Map (Leaflet)
  - [ ] 9.1 สร้าง `app/components/TransitMap.tsx` — Leaflet map component พร้อม OpenStreetMap tile layer
  - [ ] 9.2 Import Leaflet CSS ใน `app/root.tsx` หรือ `app/app.css`
  - [ ] 9.3 แสดง station markers บนแผนที่สำหรับทุกสถานี (~144 จุด) พร้อม popup แสดงชื่อสถานี + สายที่ผ่าน
  - [ ] 9.4 ตั้งค่า default center ที่กรุงเทพฯ (lat: 13.7563, lng: 100.5018) และ zoom level ที่เหมาะสม
  - [ ] 9.5 Implement route polyline — เมื่อมี route result ให้วาด polyline เชื่อมสถานีตามเส้นทาง
  - [ ] 9.6 Polyline ต้องใช้สีตามสายรถไฟฟ้า (เปลี่ยนสีเมื่อเปลี่ยนสาย)
  - [ ] 9.7 Highlight สถานีต้นทาง (marker สีเขียว) และปลายทาง (marker สีแดง) ให้ต่างจาก marker ปกติ
  - [ ] 9.8 เมื่อมี route result ให้ fitBounds ให้เห็นเส้นทางทั้งหมด
  - [ ] 9.9 Handle SSR — Leaflet ไม่รองรับ SSR ต้องใช้ dynamic import หรือ `clientOnly` pattern
  - [ ] 9.10 เขียน unit tests ใน `app/components/TransitMap.test.tsx` (ทดสอบ rendering, markers)

- [ ] 10.0 Responsive Layout & Polish
  - [ ] 10.1 สร้าง layout หน้า homepage — Desktop: map ด้านขวา + side panel ด้านซ้าย (station picker + route result)
  - [ ] 10.2 Mobile layout: map เต็มจอ + bottom sheet panel สำหรับ station picker + route result
  - [ ] 10.3 ใช้ Tailwind CSS responsive utilities (sm:, md:, lg:) สำหรับ breakpoints
  - [ ] 10.4 ตรวจสอบ line colors ทั้งหมดตรงกับ Design Spec ใน PRD Section 6 (10 สี)
  - [ ] 10.5 เพิ่ม loading state ระหว่างโหลดข้อมูลจาก loader
  - [ ] 10.6 ปรับ typography และ spacing ให้อ่านง่าย (ชื่อสถานีไทย + อังกฤษ)
  - [ ] 10.7 ทดสอบ responsive บน Chrome DevTools (iPhone SE, iPhone 14, iPad, Desktop)

- [ ] 11.0 Testing & Verification
  - [ ] 11.1 ทดสอบ route calculation ข้ามระบบ: BTS → MRT (e.g., สยาม → สีลม → ศาลาแดง/สีลม MRT)
  - [ ] 11.2 ทดสอบ route calculation ข้ามหลายระบบ: BTS → MRT → ARL (e.g., อโศก → มักกะสัน → สุวรรณภูมิ)
  - [ ] 11.3 ทดสอบ route calculation สายเดียว: BTS สุขุมวิท (e.g., หมอชิต → อ่อนนุช)
  - [ ] 11.4 ตรวจสอบ fare accuracy — เทียบกับค่าจริงจากเว็บทางการ (ยอมรับ ±5 บาท)
  - [ ] 11.5 ตรวจสอบว่า map แสดง polyline สีถูกต้องตามสาย
  - [ ] 11.6 ตรวจสอบ autocomplete search ด้วยชื่อไทย, อังกฤษ, และรหัสสถานี
  - [ ] 11.7 ตรวจสอบ responsive layout บน mobile และ desktop
  - [ ] 11.8 ตรวจสอบ page load time < 3 วินาที
  - [ ] 11.9 รัน unit tests ทั้งหมดผ่าน (`npx vitest run`)
  - [ ] 11.10 ทดสอบ deploy บน Vercel (free tier) ว่าทำงานได้ปกติ
