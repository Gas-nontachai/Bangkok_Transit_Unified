-- 002_rls_policies.sql
-- Bangkok Transit Unified - Row Level Security Policies

-- Enable RLS on all tables
alter table operators enable row level security;
alter table lines enable row level security;
alter table stations enable row level security;
alter table station_lines enable row level security;
alter table edges enable row level security;
alter table fare_matrix enable row level security;

-- Public read-only policies for all tables
create policy "public read" on operators for select using (true);
create policy "public read" on lines for select using (true);
create policy "public read" on stations for select using (true);
create policy "public read" on station_lines for select using (true);
create policy "public read" on edges for select using (true);
create policy "public read" on fare_matrix for select using (true);
