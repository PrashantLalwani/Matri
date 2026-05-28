-- Run this once in Supabase SQL editor to support lab report uploads linked to test orders
ALTER TABLE test_orders
  ADD COLUMN IF NOT EXISTS file_url        text,
  ADD COLUMN IF NOT EXISTS report_summary  text,
  ADD COLUMN IF NOT EXISTS extracted_values jsonb;
