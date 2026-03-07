# PRD: Bangkok Transit Unified — UX Improvements v2

## Introduction / Overview

Bangkok Transit Unified เป็นเว็บแอปวางแผนเส้นทางรถไฟฟ้ากรุงเทพฯ ครอบคลุม 4 ระบบ (BTS, MRT, ARL, SRT) 10 สาย 178 สถานี ปัจจุบันมีปัญหา UX หลัก 4 ด้าน ที่ทำให้ผู้ใช้งานจริงใช้งานยาก:

1. **แผนที่อ่านไม่ออก** — แสดงเป็นจุดสีแต่ละสถานี ไม่มีเส้นเชื่อมสาย ทำให้ไม่เห็นว่าสายไหนวิ่งไปไหน
2. **ค้นหาสถานีไม่เจอ** — พิมพ์ "สวนจตุจักร" ไม่เจอ เพราะข้อมูลเก็บเป็น "จตุจักร" และ search ใช้ exact substring match
3. **เส้นทางข้ามสายไม่ครบ** — Transfer edges ระหว่างระบบมีแค่ 4 จุด ขาดจุดเปลี่ยนสำคัญ (ลาดพร้าว, มักกะสัน, บางซื่อ) + MRT Blue วนรอบขาดที่ท่าพระ
4. **เปรียบเทียบเส้นทางดูไม่ออก** — Badge "ถูกสุด" / "เร็วสุด" ไม่บอกว่าต่างกันเท่าไหร่ ไม่มี comparison view

**เป้าหมาย**: ปรับปรุงทั้ง 4 ด้านเพื่อให้ผู้ใช้ (คนกรุงเทพ + นักท่องเที่ยว) วางแผนเส้นทางได้ง่ายและถูกต้องขึ้น ภายใน 1-2 สัปดาห์

---

## Goals

1. ผู้ใช้สามารถมองเห็นเส้นทางของทุกสายรถไฟฟ้าบนแผนที่ได้ชัดเจน คล้าย Google Maps แสดงเส้นทาง transit
2. ผู้ใช้สามารถค้นหาสถานีด้วยชื่อเรียกทั่วไปที่ต่างจากชื่อทางการได้ (เช่น "สวนจตุจักร", "หมอชิต MRT")
3. ระบบสามารถคำนวณเส้นทางข้ามระบบได้ครบถ้วนทุกจุดเชื่อมต่อจริง
4. ผู้ใช้สามารถเปรียบเทียบตัวเลือกเส้นทาง (ถูกสุด vs เร็วสุด) ได้อย่างชัดเจนในทันที

---

## User Stories

### US-1: แผนที่เส้นสาย
> ในฐานะ **ผู้ใช้ที่เปิดแอป** ฉันต้องการ **เห็นเส้นสีของทุกสายรถไฟฟ้าบนแผนที่** เพื่อที่ฉันจะ **เข้าใจได้ทันทีว่าสายไหนวิ่งเส้นไหน โดยไม่ต้องกดดูรายละเอียด**

### US-2: Highlight เส้นทางที่เลือก
> ในฐานะ **ผู้ใช้ที่ค้นหาเส้นทางแล้ว** ฉันต้องการ **เห็นเส้นทางที่เลือก highlight เด่นขึ้นมา และเส้นอื่นจางลง** เพื่อที่ฉันจะ **รู้ทันทีว่าต้องไปทางไหน โดยยังเห็น context ของสายอื่น**

### US-3: ค้นหาด้วยชื่อเรียกทั่วไป
> ในฐานะ **ผู้ใช้ที่พิมพ์ "สวนจตุจักร"** ฉันต้องการ **ให้ระบบเจอสถานี "จตุจักร (Chatuchak Park)"** เพื่อที่ฉันจะ **ไม่ต้องรู้ชื่อทางการของสถานี**

### US-4: เส้นทางข้ามระบบ
> ในฐานะ **ผู้ใช้ที่ต้องการเดินทางจาก ARL มักกะสัน ไปสถานี MRT** ฉันต้องการ **ให้ระบบแนะนำเส้นทางเปลี่ยนสายผ่านสถานีเพชรบุรีได้** เพื่อที่ฉันจะ **วางแผนได้ตามจริงที่ทำได้ในชีวิตจริง**

### US-5: เปรียบเทียบเส้นทาง
> ในฐานะ **ผู้ใช้ที่เห็นหลายเส้นทาง** ฉันต้องการ **เห็นตัวเลขส่วนต่าง (ถูกกว่ากี่บาท / เร็วกว่ากี่นาที) และ comparison summary** เพื่อที่ฉันจะ **ตัดสินใจได้เร็วว่าจะเลือกเส้นไหน**

---

## Functional Requirements

### FR-1: แผนที่ — วาดเส้นสายรถไฟฟ้า

| # | Requirement |
|---|---|
| FR-1.1 | ระบบต้องวาด polyline เชื่อมสถานีของแต่ละสาย (10 สาย) บนแผนที่ โดยใช้สีของสายนั้นๆ ตาม `line.color` |
| FR-1.2 | การเรียงลำดับสถานีที่จะต่อเส้น ต้องใช้ `sequence_order` จาก `station_lines` table |
| FR-1.3 | เส้นสาย (background polylines) ต้องแสดงด้วย `weight: 4`, `opacity: 0.5` เมื่อยังไม่ได้เลือกเส้นทาง |
| FR-1.4 | จุด `circleMarker` ของแต่ละสถานี ยังคงแสดงตามเดิม (interchange radius 6, ปกติ radius 4) |

**ไฟล์ที่เกี่ยวข้อง:** `app/components/TransitMap.tsx`

### FR-2: แผนที่ — Highlight เส้นทางที่เลือก

| # | Requirement |
|---|---|
| FR-2.1 | เมื่อผู้ใช้เลือกเส้นทาง (มี `routeSteps`) → เส้น background ทุกสายต้อง dim ลงเหลือ `opacity: 0.15` |
| FR-2.2 | เส้นทางที่เลือกต้อง highlight ด้วย `weight: 6`, `opacity: 1.0` ตามสีของสายที่ใช้ |
| FR-2.3 | สถานีต้นทางยังแสดง marker สีเขียว (radius 10), ปลายทางแสดง marker สีแดง (radius 10) + tooltip ชื่อสถานี (ตามที่ทำอยู่แล้ว) |
| FR-2.4 | เมื่อผู้ใช้ลบเส้นทาง (ไม่มี `routeSteps`) → เส้น background ทุกสายต้องกลับมา `opacity: 0.5` |

**ไฟล์ที่เกี่ยวข้อง:** `app/components/TransitMap.tsx`

### FR-3: ค้นหาสถานี — Alias / Fuzzy Matching

| # | Requirement |
|---|---|
| FR-3.1 | ระบบต้องมี alias map ที่เก็บชื่อเรียกอื่นๆ ของสถานี สร้างเป็นไฟล์ใหม่ `app/lib/station-aliases.ts` |
| FR-3.2 | Alias map ต้องครอบคลุมอย่างน้อย: `จตุจักร` → `สวนจตุจักร, Chatuchak Park, JJ`, `ห้าแยกลาดพร้าว` → `ลาดพร้าว BTS, Union Mall`, `กรุงเทพอภิวัฒน์` → `บางซื่อ กลาง, Krung Thep Aphiwat, Bang Sue Grand Station` |
| FR-3.3 | Search logic ต้องตรวจทั้ง `name_th`, `name_en`, `code` และ aliases |
| FR-3.4 | ระบบต้องทำ bidirectional includes — ถ้า query เป็น substring ของชื่อ **หรือ** ชื่อเป็น substring ของ query → match (เช่น "สวนจตุจักร".includes("จตุจักร") = true) |
| FR-3.5 | เมื่อค้นหา "สวนจตุจักร" ระบบต้องแสดงผลลัพธ์สถานี "จตุจักร (Chatuchak Park)" |

**ไฟล์ที่เกี่ยวข้อง:** `app/components/StationPicker.tsx`, `app/lib/station-aliases.ts` (สร้างใหม่)

### FR-4: Transfer Edges — เพิ่มจุดเชื่อมต่อระหว่างระบบ

| # | Requirement |
|---|---|
| FR-4.1 | เพิ่ม transfer edge: **ห้าแยกลาดพร้าว BTS (station 016)** ↔ **พหลโยธิน MRT Blue (station 076)** — เดิน 5 นาที |
| FR-4.2 | เพิ่ม transfer edge: **มักกะสัน ARL (station 162)** ↔ **เพชรบุรี MRT Blue (station 083)** — เดิน 5 นาที |
| FR-4.3 | เพิ่ม transfer edge: **กรุงเทพอภิวัฒน์ SRT (station 167)** ↔ **บางซื่อ MRT Blue (station 073)** — เดิน 5 นาที |
| FR-4.4 | แก้ `is_interchange` เป็น `true` สำหรับ station 076 (พหลโยธิน), 162 (มักกะสัน), 083 (เพชรบุรี), 073 (บางซื่อ) |
| FR-4.5 | แก้ **coordinate ผิด** ของ station 083 (เพชรบุรี BL21): lat จาก `13.81199` → `13.7500`, lng จาก `100.56087` → `100.5413` (ตำแหน่งจริงติดกับมักกะสัน ARL) |
| FR-4.6 | ตรวจสอบว่า `buildAdjacencyList()` ใน `graph.ts` สร้าง **bidirectional edges** สำหรับ transfer edges ด้วย (ถ้าไม่ → ต้องแก้ให้สร้างทั้งสองทิศทาง) |

**ไฟล์ที่เกี่ยวข้อง:** `supabase/seed/seed_edges.sql`, `supabase/seed/seed_stations.sql`, `app/lib/graph.ts`

### FR-5: MRT Blue Line Loop — แก้วงแหวนขาด

| # | Requirement |
|---|---|
| FR-5.1 | เพิ่ม regular edge: **บางไผ่ (station 095)** → **ท่าพระ (station 063)** — สาย BLU, เวลา 2 นาที, `is_transfer = false` |
| FR-5.2 | ตรวจสอบว่าหลังเพิ่ม edge แล้ว สามารถค้นหาเส้นทางวนรอบ MRT Blue ได้ครบ (เช่น บางหว้า → อิสรภาพ → ท่าพระ → เพชรเกษม 48) |

**ไฟล์ที่เกี่ยวข้อง:** `supabase/seed/seed_edges.sql`

### FR-6: เปรียบเทียบเส้นทาง — Comparison Summary

| # | Requirement |
|---|---|
| FR-6.1 | เมื่อมีตัวเลือกเส้นทาง > 1 → แสดง **Comparison Summary Bar** ด้านบนก่อน route cards |
| FR-6.2 | Summary bar แสดงแต่ละเส้นทางเป็นการ์ดย่อแนวนอน (horizontal scroll บนมือถือ) ประกอบด้วย: หมายเลข (#1, #2, #3), line color dots, ราคา (฿), เวลา (นาที), badge ถูกสุด/เร็วสุด |
| FR-6.3 | กดที่การ์ดย่อใน summary bar → expand/highlight route card ด้านล่าง (sync กับ `activeIndex`) |
| FR-6.4 | การ์ดที่ active ใน summary bar ต้องมี visual indicator (เช่น border สีน้ำเงิน, background สี) |

**ไฟล์ที่เกี่ยวข้อง:** `app/components/RouteResult.tsx`

### FR-7: เปรียบเทียบเส้นทาง — Badge ข้อมูลส่วนต่าง

| # | Requirement |
|---|---|
| FR-7.1 | Badge "ถูกสุด" ต้องแสดงส่วนต่าง: `🏷️ ถูกกว่า ฿X` (โดย X = fare ของเส้นทางถัดไป - fare ของเส้นทางนี้) |
| FR-7.2 | Badge "เร็วสุด" ต้องแสดงส่วนต่าง: `⚡ เร็วกว่า X นาที` (โดย X = เวลาของเส้นทางช้าสุด - เวลาของเส้นทางนี้) |
| FR-7.3 | ถ้าเส้นทางเดียวเป็นทั้งถูกสุดและเร็วสุด → แสดง badge เดียว `🏷️ ถูก+เร็วสุด` |
| FR-7.4 | ส่วนต่างต้องคำนวณจากค่า `routeOptions[0].fareResult.totalFare` (cheapest, sorted by fare) และ `Math.min(...time)` (fastest) เทียบกับเส้นทางอื่น |
| FR-7.5 | ถ้ามีเส้นทางเดียว → ไม่แสดง badge ส่วนต่าง (ไม่มีอะไรเปรียบเทียบ) |

**ไฟล์ที่เกี่ยวข้อง:** `app/components/RouteResult.tsx`

---

## Non-Goals (Out of Scope)

1. **ไม่ทำ** real-time data (ข้อมูลรถไฟวิ่งอยู่ตอนไหน)
2. **ไม่ทำ** routing ของรถเมล์ / เรือ / อื่นๆ ที่ไม่ใช่ระบบราง
3. **ไม่เปลี่ยน** base map tile (ยังใช้ OpenStreetMap)
4. **ไม่ทำ** interactive line toggle (ปิด/เปิดสายแต่ละสาย) — เป็น future feature ได้
5. **ไม่เพิ่ม** dependency ใหม่สำหรับ fuzzy search (ใช้ alias map + bidirectional includes แทน)
6. **ไม่เปลี่ยน** database schema (ใช้ seed SQL + ข้อมูลเดิม เพิ่มเฉพาะ rows ใหม่)

---

## Design Considerations

### แผนที่ (TransitMap)
- เส้นสาย background ใช้สีสายนั้นๆ (`line.color`) ความหนา 4px, opacity 50%
- เมื่อ highlight เส้นทาง → เส้น background dim เหลือ 15%, เส้นที่เลือก 6px opacity 100%
- จุดสถานี `circleMarker` ยังแสดงเหมือนเดิม ไม่เปลี่ยน
- แสดง popup ชื่อสถานีเมื่อกดจุดเหมือนเดิม

### Comparison Summary Bar
- ใช้ horizontal scroll container (`flex overflow-x-auto gap-2`)
- การ์ดย่อแต่ละอันมี `min-width` คงที่ (เช่น 140px) เพื่อไม่ให้แคบเกินบนมือถือ
- Active card มี `border-blue-400` + `bg-blue-50`
- Badge ถูกสุด: `bg-green-100 text-green-700`, เร็วสุด: `bg-blue-100 text-blue-700`

### StationPicker
- ไม่เปลี่ยน UI ของ dropdown — เปลี่ยนเฉพาะ search logic
- ผลลัพธ์ที่ match จาก alias ให้แสดงเหมือนผลลัพธ์ปกติ (ไม่ต้องบอกว่า match จาก alias)

---

## Technical Considerations

### Dependencies
- **ไม่มี** dependency ใหม่ — ใช้ Leaflet ที่มีอยู่ + vanilla TS
- Alias map เป็น static object ไม่ต้อง query จาก database

### Data Layer
- Transfer edges เพิ่มใน `seed_edges.sql` — ต้อง re-seed database หลัง deploy
- `buildAdjacencyList()` ใน `graph.ts` **ต้องตรวจสอบ** ว่า push edges ทั้ง 2 ทิศทาง (from→to และ to→from) สำหรับ transfer edges ด้วย ถ้าไม่ → ต้องแก้ให้ bidirectional
- Coordinate fix (station 083) → ต้องอัพเดท seed data + อาจต้อง re-seed ใน production Supabase

### Performance
- polyline 10 สาย × ~20 สถานีต่อสาย = ~200 coordinates — ไม่มี performance concern
- Alias map ~30-50 entries — negligible memory

### Testing
- ต้องอัพเดท test ที่มีอยู่ใน `TransitMap.test.tsx`, `StationPicker.test.tsx`, `RouteResult.test.tsx`
- เพิ่ม test case สำหรับ alias search ("สวนจตุจักร" → match)
- เพิ่ม test case สำหรับ comparison badge (ส่วนต่าง)
- `dijkstra.test.ts` — เพิ่ม test case สำหรับ cross-system routing ผ่าน transfer edges ใหม่

---

## Success Metrics

| Metric | Target |
|--------|--------|
| แผนที่: ผู้ใช้สามารถระบุเส้นสายสีน้ำเงินบนแผนที่ได้ | มองเห็นเส้น polyline สี #1E3A8A ทุกสถานีสาย BLU |
| ค้นหา: พิมพ์ "สวนจตุจักร" | ผลลัพธ์แสดงสถานี "จตุจักร" BL13 |
| ค้นหา: พิมพ์ "มักกะสัน" | ผลลัพธ์แสดงสถานี "มักกะสัน" ARL03 |
| Routing: ค้นหามักกะสัน → หัวลำโพง | ต้องเจอเส้นทาง ARL→(เดิน)→MRT Blue |
| Routing: ค้นหาบางหว้า → อิสรภาพ via ท่าพระ | ต้องเจอเส้นทาง (ไม่ใช่ "ไม่พบเส้นทาง") |
| เปรียบเทียบ: เส้นทาง 2+ ตัวเลือก | แสดง comparison summary bar + badge "ถูกกว่า ฿X" / "เร็วกว่า X นาที" |
| Unit tests | ทุก test ที่มีอยู่ + test ใหม่ผ่าน (`npx vitest run`) |
| E2E tests | `npx playwright test` ผ่าน |

---

## Open Questions

1. **Alias map ครอบคลุมแค่ไหน?** — เริ่มจาก ~10-15 สถานีที่มีชื่อเรียกอื่นบ่อย แล้วค่อยเพิ่มทีหลังจาก feedback หรือเก็บครบตั้งแต่แรก?
2. **Re-seed strategy** — การ deploy transfer edges ใหม่ต้อง run `seed_edges.sql` ใหม่ทั้งหมด (drop + re-insert) หรือเพิ่มเป็น migration file แยก?
3. **MRT Blue loop edge ที่ท่าพระ** — ต้องเพิ่มทั้ง forward (095→063) และ reverse (063→095) ใน seed หรือ `buildAdjacencyList()` สร้าง bidirectional อัตโนมัติ?
