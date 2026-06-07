// Vercel serverless function: /api/tutor
// Holds your Anthropic API key securely on the server (never exposed to the browser).
// The browser posts { system, messages }; this forwards to Anthropic and returns the reply.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ noKey: true, content: [{ type: "text", text: "The live tutor isn't switched on yet. It needs an Anthropic API key added in the site's settings. Everything else in the app works without it." }] });
  }

  try {
    const { system, messages } = req.body || {};
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Bad request: messages array required." });
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: system || "",
        messages,
      }),
    });

    const data = await anthropicRes.json();
    if (!anthropicRes.ok) {
      return res.status(anthropicRes.status).json({ error: data?.error?.message || "Anthropic API error" });
    }
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: "Tutor request failed on the server." });
  }
}
