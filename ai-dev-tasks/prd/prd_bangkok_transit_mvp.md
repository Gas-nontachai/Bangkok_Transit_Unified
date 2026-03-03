# PRD: Bangkok Transit Unified

## 1. Introduction / Overview

Bangkok Transit Unified เป็น web application สำหรับวางแผนเส้นทางระบบรถไฟฟ้าในกรุงเทพฯ แบบครบทุกระบบในที่เดียว ผู้ใช้สามารถเลือกสถานีต้นทางและปลายทาง แล้วระบบจะคำนวณเส้นทาง, จุดเปลี่ยนสาย, ค่าโดยสาร และเวลาเดินทางโดยประมาณ พร้อมแสดงผลบน interactive map

### ปัญหาที่แก้

ปัจจุบันผู้ใช้ต้องเปิดหลายเว็บไซต์เพื่อดูเส้นทางแต่ละระบบ (BTS, MRT, ARL, SRT Red) แยกกัน ไม่มีเครื่องมือที่คำนวณเส้นทางข้ามระบบได้ในที่เดียว

### เป้าหมาย

ผู้ใช้เปิดเว็บ → เลือกสถานีต้นทาง-ปลายทาง → เห็นเส้นทาง จุดเปลี่ยนสาย ค่าโดยสาร (แยกตามผู้ให้บริการ) → จบ ไม่ต้องออกจากเว็บ

- ไม่ต้อง login
- ไม่มี admin panel ใน MVP (จัดการ data ผ่าน Supabase dashboard)

---

## 2. Goals

1. รองรับระบบขนส่งทางรางทั้ง **5 ระบบ 11 สาย**:
   - **BTS**: สุขุมวิท (47 สถานี), สีลม (14 สถานี)
   - **BTS Gold Line**: สีทอง (3 สถานี)
   - **MRT**: สีน้ำเงิน (38), สีม่วง (16), สีเหลือง (23), สีชมพู (30)
   - **Airport Rail Link**: ARL (8 สถานี)
   - **SRT Red Line**: เข้ม (10), อ่อน (4)
   - **รวม ~144 สถานี** (ไม่นับซ้ำสถานีร่วม)
2. คำนวณเส้นทางข้ามระบบได้ (เช่น BTS → MRT → ARL)
3. แสดงค่าโดยสารแยกตามผู้ให้บริการอย่างถูกต้อง
4. แสดงเส้นทางบน interactive map
5. ทำงานได้บน free tier ทั้งหมด (cost = $0)

---

## 3. User Stories

1. **ในฐานะผู้ใช้ทั่วไป** ฉันต้องการเลือกสถานีต้นทางและปลายทางจากรายชื่อสถานีทั้งหมด เพื่อวางแผนเส้นทาง
2. **ในฐานะผู้ใช้ทั่วไป** ฉันต้องการเห็นเส้นทางที่สั้นที่สุดพร้อมจุดเปลี่ยนสาย เพื่อรู้ว่าต้องเปลี่ยนตรงไหน
3. **ในฐานะผู้ใช้ทั่วไป** ฉันต้องการเห็นค่าโดยสารรวม (แยกตามผู้ให้บริการ) เพื่อเตรียมเงินให้ถูกต้อง
4. **ในฐานะผู้ใช้ทั่วไป** ฉันต้องการเห็นเส้นทางบนแผนที่พร้อมสีของแต่ละสาย เพื่อเข้าใจตำแหน่งทางภูมิศาสตร์
5. **ในฐานะผู้ใช้ทั่วไป** ฉันต้องการค้นหาสถานีได้ทั้งชื่อไทยและอังกฤษ เพื่อความสะดวกในการใช้งาน
6. **ในฐานะผู้ใช้ทั่วไป** ฉันต้องการเห็นเวลาเดินทางโดยประมาณ เพื่อวางแผนได้แม่นยำขึ้น

---

## 4. Functional Requirements

### 4.1 Station Selection

1. ระบบต้องแสดงรายชื่อสถานีทั้งหมด (~144 สถานี) จากทุกระบบ
2. ระบบต้องรองรับการค้นหาสถานีแบบ autocomplete (ชื่อไทย / อังกฤษ / รหัสสถานี)
3. ระบบต้องแสดงสีของสายและชื่อสายกำกับแต่ละสถานี
4. สถานีร่วม (interchange) ต้องแสดงทุกสายที่ผ่าน

### 4.2 Route Calculation

5. ระบบต้องคำนวณเส้นทางที่สั้นที่สุด (shortest path) ด้วย Dijkstra algorithm
6. ระบบต้องรองรับการเดินทางข้ามระบบ (BTS ↔ MRT ↔ ARL ↔ SRT Red)
7. ระบบต้องรองรับ interchange (สถานีเปลี่ยนสาย) โดยเพิ่ม walking edge ระหว่างสถานีร่วม พร้อม transfer penalty time
8. ระบบต้อง build adjacency list จาก edges data
9. Algorithm ทำงานบน client-side (frontend)

### 4.3 Route Display

10. ระบบต้องแสดงรายชื่อสถานีตามลำดับเส้นทาง
11. ระบบต้องแสดงจุดเปลี่ยนสาย (transfer points) อย่างชัดเจน
12. ระบบต้องแสดงสีของแต่ละสาย (line color indicator)
13. ระบบต้องแสดงเวลาเดินทางโดยประมาณ (รวม transfer time)
14. ระบบต้องแสดงค่าโดยสารรวม แยกตามผู้ให้บริการ

### 4.4 Fare Calculation

15. ระบบต้องคำนวณค่าโดยสารจาก fare matrix (station-to-station) ที่เก็บใน DB
16. ค่าโดยสารต้องแยกตาม operator segment:

| ระบบ | ช่วงราคา |
|------|---------|
| BTS สุขุมวิท + สีลม | 17 – 65 บาท |
| BTS Gold Line | 16 บาท (flat) |
| MRT สีน้ำเงิน | 17 – 45 บาท (step table) |
| MRT สีม่วง | 17 – 42 บาท |
| MRT สีเหลือง | 15 – 45 บาท |
| MRT สีชมพู | 15 – 45 บาท |
| ARL | 15 – 45 บาท |
| SRT Red Line | 12 – 42 บาท |

17. เมื่อเดินทางข้ามระบบ ค่าโดยสารคิดแยกผู้ให้บริการ (ไม่รวมข้ามระบบ)
18. แสดงยอดรวมค่าโดยสารทั้งหมด

### 4.5 Map Display

19. ระบบต้องแสดง interactive map (Leaflet) พร้อม pan/zoom
20. ระบบต้องแสดง polyline route ตามเส้นทางที่คำนวณได้
21. ระบบต้องแสดง station markers บนแผนที่
22. Polyline ต้องใช้สีตามสายรถไฟฟ้า

### 4.6 Data Management

23. ข้อมูลสถานีทั้งหมดต้องอยู่ใน Supabase (Postgres)
24. Enable RLS สำหรับ public read-only access
25. ไม่มี insert/update/delete จาก client — จัดการผ่าน Supabase dashboard เท่านั้น

---

## 5. Non-Goals (Out of Scope)

- Realtime train positions / live tracking
- User accounts / authentication
- Admin dashboard UI
- Payment integration
- Historical trip tracking
- Multi-language UI (MVP ใช้ไทยเป็นหลัก แสดงชื่อสถานี 2 ภาษา)
- SRT Red daily cap policy calculation (MVP คิดเฉพาะค่าโดยสารต่อเที่ยว)
- Accessible route planning (สำหรับคนพิการ / ลิฟต์)
- Bus / boat integration

---

## 6. Design Considerations

### UI Layout

- **Homepage**: แสดง map เต็มจอ + panel ด้านซ้ายสำหรับ station picker
- **Station picker**: Dropdown search with autocomplete แบ่งกลุ่มตามสาย
- **Route result**: Panel แสดง route steps, transfer info, fare breakdown
- **Color scheme**: ใช้สีตามมาตรฐานของแต่ละสาย

### Line Colors (ใช้ใน UI + Map)

| สาย | สี | Hex |
|------|-----|-----|
| BTS สุขุมวิท | เขียวเข้ม | `#00843D` |
| BTS สีลม | เขียวเข้ม | `#00843D` |
| BTS สีทอง | ทอง | `#CFB53B` |
| MRT สีน้ำเงิน | น้ำเงิน | `#1E3A8A` |
| MRT สีม่วง | ม่วง | `#6B21A8` |
| MRT สีเหลือง | เหลือง | `#FFD700` |
| MRT สีชมพู | ชมพู | `#EC4899` |
| ARL | น้ำเงิน-แดง | `#1D4ED8` |
| SRT Red เข้ม | แดงเข้ม | `#DC2626` |
| SRT Red อ่อน | แดงอ่อน | `#F87171` |

### Responsive

- **Desktop**: map + side panel
- **Mobile**: map เต็มจอ + bottom sheet panel

---

## 7. Technical Considerations

### 7.1 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Router v7 (SSR mode) |
| UI Styling | Tailwind CSS v4 |
| Map | Leaflet + react-leaflet |
| Database | Supabase (Postgres) |
| State / Data Fetching | React Router loaders (server-side) |
| Algorithm | Dijkstra (client-side) |
| Language | TypeScript |
| Hosting | Vercel (free tier) |

**Estimated Cost: $0 for MVP**

### 7.2 Database Schema

#### Operators

```sql
create table operators (
  id uuid primary key default gen_random_uuid(),
  name_th text not null,
  name_en text not null,
  code text unique not null -- BTS, MRT, ARL, SRT
);
```

#### Lines

```sql
create table lines (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid references operators(id) on delete cascade,
  name_th text not null,
  name_en text not null,
  code text unique not null, -- SUK, SIL, GOLD, BLU, PUR, YEL, PNK, ARL, RDD, RDL
  color text not null          -- hex color
);
```

#### Stations

```sql
create table stations (
  id uuid primary key default gen_random_uuid(),
  name_th text not null,
  name_en text not null,
  code text,                   -- station code e.g. N1, S12, BL01
  lat numeric(9,6) not null,
  lng numeric(9,6) not null,
  is_interchange boolean default false
);
```

#### Station Lines (many-to-many)

```sql
create table station_lines (
  station_id uuid references stations(id) on delete cascade,
  line_id uuid references lines(id) on delete cascade,
  sequence_order integer not null, -- ลำดับสถานีในสาย
  primary key (station_id, line_id)
);
```

#### Edges (สำหรับ Dijkstra graph)

```sql
create table edges (
  id uuid primary key default gen_random_uuid(),
  from_station_id uuid references stations(id) on delete cascade,
  to_station_id uuid references stations(id) on delete cascade,
  line_id uuid references lines(id) on delete cascade,
  travel_time_min integer not null,
  is_transfer boolean default false -- walking edge ระหว่าง interchange
);
```

#### Fare Matrix (station-to-station per line)

```sql
create table fare_matrix (
  id uuid primary key default gen_random_uuid(),
  line_id uuid references lines(id) on delete cascade,
  from_station_id uuid references stations(id) on delete cascade,
  to_station_id uuid references stations(id) on delete cascade,
  fare numeric(6,2) not null,
  unique(line_id, from_station_id, to_station_id)
);
```

### 7.3 Database Design (ER Summary)

Entities:
- **operators** — ผู้ให้บริการ (BTS, MRT, ARL, SRT)
- **lines** — สายรถไฟฟ้า (11 สาย)
- **stations** — สถานี (~144 สถานี)
- **station_lines** — mapping station ↔ line (many-to-many) พร้อม sequence
- **edges** — เส้นเชื่อมระหว่างสถานี (adjacent + interchange transfer)
- **fare_matrix** — ค่าโดยสารรายคู่สถานีต่อสาย

Relationships:
- operators 1 → many lines
- lines many ↔ many stations (via station_lines)
- stations 1 → many edges (from_station / to_station)
- edges many → 1 line
- fare_matrix many → 1 line, many → 1 from_station, many → 1 to_station

### 7.4 Security (RLS)

```sql
-- Enable RLS on all tables
alter table operators enable row level security;
alter table lines enable row level security;
alter table stations enable row level security;
alter table station_lines enable row level security;
alter table edges enable row level security;
alter table fare_matrix enable row level security;

-- Public read-only for all tables
create policy "public read" on operators for select using (true);
create policy "public read" on lines for select using (true);
create policy "public read" on stations for select using (true);
create policy "public read" on station_lines for select using (true);
create policy "public read" on edges for select using (true);
create policy "public read" on fare_matrix for select using (true);
```

No insert/update/delete allowed publicly.

### 7.5 Architecture (Data Flow)

```
┌──────────────────────────────────────────────────────────┐
│  Server (React Router Loader)                            │
│  1. Fetch stations, lines, operators, edges, fare_matrix │
│     จาก Supabase                                         │
└──────────────┬───────────────────────────────────────────┘
               │ SSR / hydration
               ▼
┌──────────────────────────────────────────────────────────┐
│  Client (Browser)                                        │
│  2. รับ data จาก loader                                   │
│  3. Build adjacency list จาก edges                        │
│  4. User เลือกสถานีต้นทาง-ปลายทาง                         │
│  5. Run Dijkstra → shortest path                         │
│  6. ระบุ operator segments จาก path                       │
│  7. Lookup fare จาก fare_matrix ตาม segment               │
│  8. Render route list + polyline บน Leaflet map           │
└──────────────────────────────────────────────────────────┘
```

### 7.6 Interchange Stations (สถานีร่วม / จุดเปลี่ยนสาย)

สถานีร่วมสำคัญที่ต้องมี walking edge พร้อม transfer penalty time:

| สถานี | ระบบที่เชื่อม |
|--------|---------------|
| สยาม | BTS สุขุมวิท ↔ BTS สีลม |
| หมอชิต / จตุจักร / ห้าแยกลาดพร้าว | BTS สุขุมวิท ↔ MRT สีน้ำเงิน |
| อโศก / สุขุมวิท | BTS สุขุมวิท ↔ MRT สีน้ำเงิน |
| ศาลาแดง / สีลม | BTS สีลม ↔ MRT สีน้ำเงิน |
| เตาปูน | MRT สีน้ำเงิน ↔ MRT สีม่วง |
| บางหว้า | BTS สีลม ↔ MRT สีน้ำเงิน |
| พญาไท | BTS สุขุมวิท ↔ ARL |
| กรุงธนบุรี | BTS สีลม ↔ BTS Gold Line |
| ลาดพร้าว | MRT สีน้ำเงิน ↔ MRT สีเหลือง |
| หลักสี่ | MRT สีชมพู ↔ SRT Red เข้ม |
| วัดพระศรีมหาธาตุ | BTS สุขุมวิท ↔ MRT สีชมพู |
| หัวหมาก | ARL ↔ MRT สีเหลือง |
| สำโรง | BTS สุขุมวิท ↔ MRT สีเหลือง |
| บางซ่อน | MRT สีม่วง ↔ SRT Red อ่อน |
| ศูนย์ราชการนนทบุรี | MRT สีม่วง ↔ MRT สีชมพู |

### 7.7 Data Seeding

ข้อมูลสถานีจาก `ai-dev-tasks/data/*` ต้องถูกแปลงเป็น SQL seed:

| ข้อมูล | จำนวนโดยประมาณ | แหล่ง |
|--------|----------------|-------|
| Operators | 4 records | BTS, MRT (MRTA), ARL, SRT |
| Lines | 11 records | สุขุมวิท, สีลม, สีทอง, สีน้ำเงิน, สีม่วง, สีเหลือง, สีชมพู, ARL, สีแดงเข้ม, สีแดงอ่อน |
| Stations | ~144 records | จาก data files ทั้ง 5 ไฟล์ |
| Station Lines | ~155 records | mapping station ↔ line พร้อม sequence |
| Edges | ~160+ records | adjacent station pairs + interchange walking edges |
| Fare Matrix | ~3,000+ records | ค่าโดยสารรายคู่สถานีต่อสาย |

### 7.8 Fare Matrix Data Notes

| สาย | วิธี generate fare matrix |
|------|--------------------------|
| MRT สีน้ำเงิน | มี step table ชัดเจน (1 stn = 17฿, 2 = 20฿, … ≥12 = 45฿) — generate ได้ตรง |
| ARL | มีตาราง (1 stn = 15฿, 2 = 20฿, … 7 = 45฿) — generate ได้ตรง |
| BTS Gold Line | flat fare 16฿ ทุกคู่สถานี |
| BTS สุขุมวิท / สีลม | ใช้ช่วง 17–65฿ + interpolate ตามจำนวนสถานี |
| MRT สีม่วง | ใช้ช่วง 17–42฿ + interpolate ตามจำนวนสถานี |
| MRT สีเหลือง | ใช้ช่วง 15–45฿ + interpolate ตามจำนวนสถานี |
| MRT สีชมพู | ใช้ช่วง 15–45฿ + interpolate ตามจำนวนสถานี |
| SRT Red Line | ใช้ช่วง 12–42฿ + interpolate (ไม่รวม daily cap ใน MVP) |

---

## 8. User Flow

```
1. User เปิด homepage
2. เห็น interactive map แสดงสถานีทั้งหมด
3. เลือก "จาก" สถานี (autocomplete search)
4. เลือก "ไป" สถานี (autocomplete search)
5. กด "ค้นหาเส้นทาง"
6. System:
   ├─ Build adjacency list จาก edges
   ├─ Run Dijkstra (client-side)
   ├─ ระบุ operator segments
   └─ Lookup fare จาก fare_matrix
7. UI แสดง:
   ├─ Route steps (รายชื่อสถานีตามลำดับ)
   ├─ Transfer points (จุดเปลี่ยนสาย)
   ├─ Map polyline (สีตามสาย)
   ├─ เวลาเดินทางโดยประมาณ
   └─ ค่าโดยสาร (แยกตาม operator + รวม)
```

User ไม่ต้องออกจากเว็บ

---

## 9. Success Metrics

1. ผู้ใช้สามารถคำนวณเส้นทางข้ามระบบได้ (BTS ↔ MRT ↔ ARL ↔ SRT Red)
2. เส้นทางแสดงจุดเปลี่ยนสายอย่างชัดเจน
3. ค่าโดยสารอยู่ในช่วงที่ถูกต้อง (±5 บาทจากค่าจริง)
4. ผู้ใช้ไม่ต้องใช้ Google Maps เพื่อวางแผนเส้นทางรถไฟฟ้า
5. ระบบทำงานบน free tier ทั้งหมด (Vercel + Supabase free)
6. หน้าเว็บโหลดภายใน 3 วินาที
7. ครอบคลุมทั้ง 5 ระบบ 11 สาย ~144 สถานี

---

## 10. Open Questions

1. **Fare data ที่ไม่มี official table** — BTS สุขุมวิท/สีลม, MRT ม่วง/เหลือง/ชมพู, SRT Red ไม่มี public fare table แบบ station-to-station → ต้องใช้วิธี interpolate จากช่วงราคา ยอมรับ error ±5 บาทได้หรือไม่?
2. **ข้อมูล lat/lng ของสถานี** — data files ปัจจุบันไม่มี coordinate → ต้องหาเพิ่มจาก OpenStreetMap หรือ Google Maps
3. **ข้อมูล travel_time_min ระหว่างสถานี** — data files ไม่มี → ประมาณการ (เฉลี่ย ~2–3 นาทีต่อสถานี, transfer ~5 นาที) หรือหาจากแหล่งอื่น
4. **MRT สีชมพู สถานี 28–30** — data file ระบุว่าเป็น "ส่วนต่อขยาย" ยังไม่มีชื่อ → ใน MVP ใส่แค่ 27 สถานีที่มีชื่อจริง

---

## Appendix A: Transit Data Summary (จาก `ai-dev-tasks/data/`)

| ระบบ | สาย | จำนวนสถานี | ช่วงราคา (บาท) | ประเภทค่าโดยสาร |
|------|------|-----------|----------------|-----------------|
| BTS | สุขุมวิท | 47 | 17 – 65 | ระยะทาง + ส่วนต่อขยาย |
| BTS | สีลม | 14 | 17 – 65 | ระยะทาง + ส่วนต่อขยาย |
| BTS | สีทอง (Gold) | 3 | 16 (flat) | ราคาเดียวตลอดสาย |
| MRT | สีน้ำเงิน (Blue) | 38 | 17 – 45 | Step table ตามจำนวนสถานี |
| MRT | สีม่วง (Purple) | 16 | 17 – 42 | ระยะทางจริง |
| MRT | สีเหลือง (Yellow) | 23 | 15 – 45 | ระยะทางจริง |
| MRT | สีชมพู (Pink) | 30* | 15 – 45 | ระยะทางจริง |
| ARL | Airport Rail Link | 8 | 15 – 45 | Step table ตามจำนวนสถานี |
| SRT | สีแดงเข้ม (Dark Red) | 10 | 12 – 42 | ระยะทางจริง |
| SRT | สีแดงอ่อน (Light Red) | 4 | 12 – 42 | ระยะทางจริง |

*\*MRT สีชมพู: 27 สถานีที่มีชื่อจริง + 3 ส่วนต่อขยาย (ยังไม่ระบุชื่อ)*

---

## Appendix B: MRT Blue Line Fare Step Table

| จำนวนสถานีที่เดินทาง | ค่าโดยสาร (บาท) |
|----------------------|-----------------|
| 1 | 17 |
| 2 | 20 |
| 3 | 22 |
| 4 | 25 |
| 5 | 27 |
| 6 | 30 |
| 7 | 32 |
| 8 | 35 |
| 9 | 37 |
| 10 | 40 |
| 11 | 42 |
| ≥12 | 45 (เพดานสูงสุด) |

---

## Appendix C: ARL Fare Step Table

| จำนวนสถานีที่เดินทาง | ค่าโดยสาร (บาท) |
|----------------------|-----------------|
| 1 | 15 |
| 2 | 20 |
| 3 | 25 |
| 4 | 30 |
| 5 | 35 |
| 6 | 40 |
| 7 | 45 |

---

End of PRD

