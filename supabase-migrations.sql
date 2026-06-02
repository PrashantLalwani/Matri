-- Run this once in Supabase SQL editor to support lab report uploads linked to test orders
ALTER TABLE test_orders
  ADD COLUMN IF NOT EXISTS file_url        text,
  ADD COLUMN IF NOT EXISTS report_summary  text,
  ADD COLUMN IF NOT EXISTS extracted_values jsonb;

-- All scan columns (safe to re-run — IF NOT EXISTS on each)
ALTER TABLE scans
  ADD COLUMN IF NOT EXISTS findings        jsonb,
  ADD COLUMN IF NOT EXISTS ai_summary      text,
  ADD COLUMN IF NOT EXISTS image_url       text,
  ADD COLUMN IF NOT EXISTS prescription_id uuid REFERENCES prescriptions(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS scan_name       text,
  ADD COLUMN IF NOT EXISTS status          text DEFAULT 'scheduled',
  ADD COLUMN IF NOT EXISTS report_date     date;

-- Count columns on prescriptions (populated by infer.js fan-out)
ALTER TABLE prescriptions
  ADD COLUMN IF NOT EXISTS medicine_count int,
  ADD COLUMN IF NOT EXISTS test_count     int,
  ADD COLUMN IF NOT EXISTS scan_count     int;

-- Track ran-out status on medicines
ALTER TABLE medicines
  ADD COLUMN IF NOT EXISTS ran_out boolean DEFAULT false;
