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

-- ── Week-aware content ────────────────────────────────────────────────────────
-- Global per-week content precomputed by seed script (one row per week, 1–42).
-- Public read, service-role write only.
CREATE TABLE IF NOT EXISTS weekly_content (
  week              integer PRIMARY KEY CHECK (week BETWEEN 1 AND 42),
  baby_size         jsonb,   -- {compare, cm, fact, icon, hand_mm, foot_mm, bpm}
  matri_moment      jsonb,   -- {question, pause}
  journal_prompt    text,
  wins_copy         jsonb,   -- {title_em, subtitle}
  education         jsonb,   -- {baby_card_text, faq[], partner_tip, key_quote}
  symptom_contexts  jsonb,   -- {cramping:{means,context}, nausea:{means,context}, …}
  nutrition         jsonb,   -- {iron_mg, folate_mcg, calcium_mg, note}
  checklist         jsonb,   -- [{id, text, pri, col}] — week-specific action items
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE weekly_content ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='weekly_content' AND policyname='public read weekly_content'
  ) THEN
    CREATE POLICY "public read weekly_content" ON weekly_content FOR SELECT USING (true);
  END IF;
END $$;

-- Add checklist column to existing weekly_content tables.
ALTER TABLE weekly_content
  ADD COLUMN IF NOT EXISTS checklist jsonb;

-- Store computed week on health_insights so the GET cache can return it.
ALTER TABLE health_insights
  ADD COLUMN IF NOT EXISTS current_week integer;
