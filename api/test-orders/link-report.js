import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getUser(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { order_ids, file_url, report_summary, extracted_values } = req.body;
  if (!Array.isArray(order_ids) || !order_ids.length) {
    return res.status(400).json({ error: "order_ids must be a non-empty array" });
  }

  // Step 1: mark completed — works even before migration
  const { error: statusErr } = await supabase
    .from("test_orders")
    .update({ status: "completed" })
    .in("id", order_ids)
    .eq("user_id", user.id);

  if (statusErr) {
    console.error("link-report status update failed:", statusErr.message);
    return res.status(500).json({ error: statusErr.message });
  }

  // Step 2: store report data — requires migration, fails gracefully if columns absent
  const { error: fieldsErr } = await supabase
    .from("test_orders")
    .update({
      file_url: file_url || null,
      report_summary: report_summary || null,
      extracted_values: extracted_values || null,
    })
    .in("id", order_ids)
    .eq("user_id", user.id);

  if (fieldsErr) {
    console.warn("link-report extended fields update failed (run supabase-migrations.sql):", fieldsErr.message);
  }

  return res.status(200).json({ success: true, linked: order_ids.length });
}
