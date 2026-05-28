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
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { file_url } = req.body;
  if (!file_url) return res.status(400).json({ error: "Missing file_url" });

  // Extract bucket and path from the stored public URL
  // Supports: /storage/v1/object/public/<bucket>/<path>
  //       and /storage/v1/object/<bucket>/<path>
  const match = file_url.match(/\/storage\/v1\/object\/(?:public\/)?([^/?]+)\/(.+?)(\?.*)?$/);
  if (!match) return res.status(400).json({ error: "Unrecognised file_url format" });

  const [, bucket, filePath] = match;

  // Security: verify the file path starts with the user's own id
  if (!filePath.startsWith(user.id + "/")) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, 3600); // 1 hour

  if (error || !data?.signedUrl) {
    return res.status(500).json({ error: error?.message || "Could not generate signed URL" });
  }

  return res.status(200).json({ signedUrl: data.signedUrl });
}
