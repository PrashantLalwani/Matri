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
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("test_orders")
      .select("*")
      .eq("user_id", user.id)
      .order("due_date", { ascending: true, nullsFirst: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ orders: data || [] });
  }

  if (req.method === "DELETE") {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "Missing id" });

    const { error } = await supabase
      .from("test_orders")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
