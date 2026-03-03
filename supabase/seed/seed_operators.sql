-- seed_operators.sql
-- 4 transit operators for Bangkok Transit Unified
INSERT INTO operators (id, name_th, name_en, code) VALUES
  ('01000000-0000-0000-0000-000000000001', 'รถไฟฟ้า BTS',       'Bangkok Mass Transit System',        'BTS'),
  ('01000000-0000-0000-0000-000000000002', 'รถไฟฟ้า MRT',       'Metropolitan Rapid Transit Authority','MRT'),
  ('01000000-0000-0000-0000-000000000003', 'แอร์พอร์ต เรล ลิงก์','Airport Rail Link',                  'ARL'),
  ('01000000-0000-0000-0000-000000000004', 'รถไฟฟ้าสายสีแดง',   'SRT Red Line',                       'SRT')
ON CONFLICT (id) DO NOTHING;
