/**
 * Seed script: generates and upserts weekly_content rows for weeks 1–40.
 *
 * Usage:
 *   node scripts/seed-weekly-content.mjs             # seed all missing weeks
 *   node scripts/seed-weekly-content.mjs --week 8    # (re)seed a single week
 *   node scripts/seed-weekly-content.mjs --force      # overwrite all weeks
 *   node scripts/seed-weekly-content.mjs --week 8 --force
 *
 * Env vars required (create a .env.local or export before running):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ANTHROPIC_API_KEY
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// ── Load .env.local if present ────────────────────────────────────────────────
try {
  const envPath = resolve(process.cwd(), ".env.local");
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
} catch { /* no .env.local, rely on exported vars */ }

// ── Validate env ──────────────────────────────────────────────────────────────
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ANTHROPIC_API_KEY) {
  console.error("Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const weekArg = args.includes("--week") ? parseInt(args[args.indexOf("--week") + 1]) : null;
const force   = args.includes("--force");

const WEEKS_TO_SEED = weekArg ? [weekArg] : Array.from({ length: 40 }, (_, i) => i + 1);

// ── Prompt builder ────────────────────────────────────────────────────────────
function buildPrompt(week) {
  const trimester = week <= 13 ? "First Trimester" : week <= 26 ? "Second Trimester" : "Third Trimester";
  return `You are generating week-specific pregnancy content for an Indian pregnancy companion app called Matri.
Generate content for week ${week} of pregnancy (${trimester}).

Return ONLY a valid JSON object with EXACTLY these keys. No extra commentary, no markdown fences.
{
  "baby_size": {
    "compare": "short poetic comparison (2-5 words, lowercase)",
    "cm": "size in cm as string e.g. '1.6cm'",
    "fact": "one most remarkable developmental fact this week (under 10 words)",
    "icon": "single emoji that matches the comparison",
    "hand_mm": number or null,
    "foot_mm": number or null,
    "bpm": number (approximate fetal heart rate) or null
  },
  "matri_moment": {
    "question": "a single deep, personal reflective question for the mother. Emotionally resonant, specific to this week's development. 1-2 sentences.",
    "pause": "a short gentle instruction like 'Take a breath.' or 'Sit with that for a moment.'"
  },
  "journal_prompt": "a reflective writing prompt specific to this week. 1 sentence. Emotionally honest, specific to what's happening at week ${week}.",
  "wins_copy": {
    "title_em": "you made it to week ${week}. Keep the celebratory tone. Under 8 words.",
    "subtitle": "one warm, specific acknowledgment of what the mother's body/baby has done this week. Under 15 words."
  },
  "education": {
    "baby_card_text": "1-2 sentences about the baby's development at week ${week}. Warm, specific, not clinical.",
    "faq": [
      { "q": "common question specific to week ${week}", "a": "clear answer, 1-2 sentences, reassuring" },
      { "q": "another common concern at week ${week}", "a": "clear answer, 1-2 sentences" },
      { "q": "a third question", "a": "clear answer" }
    ],
    "partner_tip": "one specific, actionable thing a partner should do or know this week. 1-2 sentences.",
    "key_quote": "a short, italic-worthy quote or observation about this week. 1-2 sentences. No attribution needed."
  },
  "symptom_contexts": {
    "cramping": {
      "means": "what cramping means specifically at week ${week}. 1-2 sentences.",
      "context": "medical context for cramping at week ${week} for AI system prompt. Key facts only. 2-3 sentences."
    },
    "nausea": {
      "means": "what nausea means at week ${week}. 1-2 sentences.",
      "context": "medical context for nausea at week ${week}. 2-3 sentences."
    },
    "spotting": {
      "means": "what spotting means at week ${week}. 1-2 sentences.",
      "context": "medical context for spotting at week ${week}. 2-3 sentences."
    },
    "headache": {
      "means": "what headaches mean at week ${week}. 1-2 sentences.",
      "context": "medical context for headaches at week ${week}. 2-3 sentences."
    },
    "no movement": {
      "means": "context on fetal movement expectations at week ${week}. 1-2 sentences.",
      "context": "medical context for movement at week ${week}. 2-3 sentences."
    },
    "acidity": {
      "means": "what acidity/heartburn means at week ${week}. 1-2 sentences.",
      "context": "medical context for acidity at week ${week}. 2-3 sentences."
    },
    "constipation": {
      "means": "what constipation means at week ${week}. 1-2 sentences.",
      "context": "medical context for constipation at week ${week}. 2-3 sentences."
    },
    "swelling": {
      "means": "what swelling/oedema means at week ${week}. 1-2 sentences.",
      "context": "medical context for swelling at week ${week}. 2-3 sentences."
    },
    "discharge": {
      "means": "what vaginal discharge means at week ${week}. 1-2 sentences.",
      "context": "medical context for discharge at week ${week}. 2-3 sentences."
    },
    "insomnia": {
      "means": "what sleep issues mean at week ${week}. 1-2 sentences.",
      "context": "medical context for sleep disturbance at week ${week}. 2-3 sentences."
    },
    "mood swings": {
      "means": "what mood swings mean at week ${week}. 1-2 sentences.",
      "context": "medical context for mood swings at week ${week}. 2-3 sentences."
    }
  },
  "nutrition": {
    "iron_mg": number (recommended daily iron intake mg),
    "folate_mcg": number (recommended daily folate/folic acid mcg),
    "calcium_mg": number (recommended daily calcium mg),
    "note": "one short, practical nutrition note specific to this trimester/week. Under 15 words."
  }
}`;
}

// ── Generate one week ─────────────────────────────────────────────────────────
async function generateWeek(week) {
  const msg = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 4096,
    messages: [{ role: "user", content: buildPrompt(week) }],
  });

  const text = msg.content[0].text.trim();
  // Strip any accidental markdown fences
  const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  return JSON.parse(clean);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Seeding weeks: ${WEEKS_TO_SEED.join(", ")} | force=${force}`);

  // Fetch existing weeks unless forcing
  let existingWeeks = new Set();
  if (!force) {
    const { data } = await supabase.from("weekly_content").select("week");
    existingWeeks = new Set((data || []).map((r) => r.week));
  }

  for (const week of WEEKS_TO_SEED) {
    if (!force && existingWeeks.has(week)) {
      console.log(`  Week ${week}: already exists, skipping (use --force to overwrite)`);
      continue;
    }

    process.stdout.write(`  Week ${week}: generating...`);
    try {
      const content = await generateWeek(week);
      const { error } = await supabase.from("weekly_content").upsert(
        { week, ...content, updated_at: new Date().toISOString() },
        { onConflict: "week" }
      );
      if (error) throw error;
      console.log(" ✓");
    } catch (err) {
      console.log(` ✗ ${err.message}`);
    }

    // Brief pause between calls to avoid rate limiting
    if (WEEKS_TO_SEED.length > 1) {
      await new Promise((r) => setTimeout(r, 800));
    }
  }

  console.log("Done.");
}

main().catch((err) => { console.error(err); process.exit(1); });
