import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { messages, system, max_tokens } = req.body;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: max_tokens || 600,
      system,
      messages,
    });

    return res.status(200).json(response);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message,
    });
  }
}