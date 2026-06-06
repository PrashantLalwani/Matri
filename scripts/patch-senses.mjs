/**
 * Patch script: generates and upserts the `senses` block into education
 * for every week in weekly_content that doesn't have it yet.
 *
 * Usage:
 *   node scripts/patch-senses.mjs              # patch all missing weeks
 *   node scripts/patch-senses.mjs --week 4     # patch a single week
 *   node scripts/patch-senses.mjs --force      # overwrite all weeks
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// ── Load .env.local ───────────────────────────────────────────────────────────
try {
  const lines = readFileSync(resolve(process.cwd(), ".env.local"), "utf8").split("\n");
  for (const line of lines) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
} catch {}

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ANTHROPIC_API_KEY) {
  console.error("Missing: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY");
  process.exit(1);
}

const supabase  = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const args    = process.argv.slice(2);
const weekArg = args.includes("--week") ? parseInt(args[args.indexOf("--week") + 1]) : null;
const force   = args.includes("--force");

// ── Prompt ────────────────────────────────────────────────────────────────────
function buildPrompt(week) {
  const trimester = week <= 13 ? "First Trimester" : week <= 26 ? "Second Trimester" : "Third Trimester";
  return `You are generating medically accurate, warm content for a pregnancy app.
Generate the sensory development data for week ${week} of pregnancy (${trimester}).

Return ONLY valid JSON with exactly these keys. No markdown, no commentary.
{
  "intro": "1-2 sentences describing sensory development at week ${week}. Be specific and accurate to this exact week.",
  "touch":   { "status": "active|forming|not yet", "desc": "week-specific touch development, 1-2 sentences" },
  "sight":   { "status": "active|forming|not yet", "desc": "week-specific sight development, 1-2 sentences" },
  "hearing": { "status": "active|forming|not yet", "desc": "week-specific hearing development, 1-2 sentences" },
  "taste":   { "status": "active|forming|not yet", "desc": "week-specific taste development, 1-2 sentences" },
  "womb_quote": "intimate, poetic 1-2 sentence quote for a Womb Connection card. Warm and personal to the mother.",
  "cta": "a practical activity the mother can try this week related to the baby's senses — or null if not yet relevant"
}

Guidelines for accuracy:
- Week 1-7:   touch forming, sight/hearing/taste not yet
- Week 8-12:  touch active, sight forming, hearing forming, taste forming
- Week 13-17: touch active, sight forming, hearing forming, taste active (tasting amniotic fluid)
- Week 18-20: touch active, sight forming, hearing active (can hear!), taste active
- Week 21-26: touch active, sight forming (opening ~wk27), hearing active, taste active
- Week 27-32: touch active, sight active (eyes open), hearing active, taste active
- Week 33-40: all active and mature`;
}

// ── Generate senses for one week ──────────────────────────────────────────────
async function generateSenses(week) {
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [{ role: "user", content: buildPrompt(week) }],
  });
  const text = msg.content[0].text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  return JSON.parse(text);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // Fetch all existing rows
  const { data: rows, error } = await supabase
    .from("weekly_content")
    .select("week, education")
    .order("week");

  if (error) { console.error("Fetch error:", error); process.exit(1); }

  const existing = new Map(rows.map(r => [r.week, r]));

  const weeks = weekArg
    ? [weekArg]
    : Array.from({ length: 40 }, (_, i) => i + 1);

  const toProcess = weeks.filter(w => {
    const row = existing.get(w);
    if (!row) return true; // row doesn't exist — skip gracefully
    if (force) return true;
    return !row.education?.senses; // only patch if senses missing
  });

  if (toProcess.length === 0) {
    console.log("All weeks already have senses data. Use --force to overwrite.");
    return;
  }

  console.log(`Patching ${toProcess.length} weeks: ${toProcess.join(", ")}`);

  let ok = 0, fail = 0;
  for (const week of toProcess) {
    process.stdout.write(`  Week ${week}... `);
    try {
      const senses = await generateSenses(week);

      const row = existing.get(week);
      const updatedEducation = { ...(row?.education || {}), senses };

      const { error: upsertErr } = await supabase
        .from("weekly_content")
        .update({ education: updatedEducation })
        .eq("week", week);

      if (upsertErr) throw upsertErr;
      console.log("✓");
      ok++;
    } catch (e) {
      console.log(`✗ (${e.message})`);
      fail++;
    }
    // Gentle rate limit
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\nDone: ${ok} patched, ${fail} failed.`);
}

main();
