import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import rateLimit from "express-rate-limit";

const router = Router();

const client = new Anthropic();

const VALID_CATEGORIES = ["Environment", "Governance", "Conflict", "Misinformation", "All"];
const MAX_BASE64_SIZE = 5 * 1024 * 1024;

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many AI requests. Try again later." },
});

function parseAiResponse(text: string): { title: string; excerpt: string; location: string; category: string } {
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const parsed = JSON.parse(cleaned);

  const title = typeof parsed.title === "string" ? parsed.title.slice(0, 80) : "";
  const excerpt = typeof parsed.excerpt === "string" ? parsed.excerpt.slice(0, 200) : "";
  const location = typeof parsed.location === "string" ? parsed.location.slice(0, 100) : "Unknown";
  const rawCategory = typeof parsed.category === "string" ? parsed.category : "All";
  const category = VALID_CATEGORIES.includes(rawCategory) ? rawCategory : "All";

  return { title, excerpt, location, category };
}

router.post("/", aiLimiter, async (req, res) => {
  try {
    const { imageBase64, mimeType, filename } = req.body;

    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: "imageBase64 and mimeType required" });
    }

    if (typeof imageBase64 !== "string" || imageBase64.length > MAX_BASE64_SIZE) {
      return res.status(400).json({ error: "File too large for AI analysis (max ~4MB)" });
    }

    const safeName = typeof filename === "string" ? filename.slice(0, 200) : "file";
    const isImage = typeof mimeType === "string" && mimeType.startsWith("image/");

    const systemPrompt = `You are a journalist metadata generator for STELE, a decentralized journalism platform. Given evidence (image or file info), generate metadata in JSON format with these fields:
- title: A concise, journalistic headline (max 80 chars)
- excerpt: A 1-2 sentence summary describing what the evidence shows (max 200 chars)
- location: Best guess of location shown or "Unknown" (format: "City, Country")
- category: One of: Environment, Governance, Conflict, Misinformation, All

Respond ONLY with valid JSON, no markdown fences.`;

    let message;

    if (isImage) {
      const validMediaType = (mimeType === "image/jpeg" || mimeType === "image/png" || mimeType === "image/gif" || mimeType === "image/webp")
        ? mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp"
        : "image/jpeg";

      message = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: validMediaType,
                  data: imageBase64,
                },
              },
              {
                type: "text",
                text: `Analyze this image as journalistic evidence. Filename: ${safeName}. Generate metadata JSON with title, excerpt, location, category.`,
              },
            ],
          },
        ],
        system: systemPrompt,
      });
    } else {
      message = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `This is a non-image file submitted as journalistic evidence. Filename: ${safeName}, MIME type: ${mimeType}. Generate metadata JSON with title, excerpt, location, category based on the filename and type.`,
          },
        ],
        system: systemPrompt,
      });
    }

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return res.status(500).json({ error: "AI returned no text response" });
    }

    const result = parseAiResponse(textBlock.text);
    res.json({
      title: result.title || safeName,
      excerpt: result.excerpt,
      location: result.location,
      category: result.category,
    });
  } catch (err) {
    console.error("AI describe error:", err);
    res.status(500).json({ error: "AI analysis failed" });
  }
});

export { router as aiDescribeRouter };
