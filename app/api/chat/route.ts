import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth/verify-token";

export const dynamic = "force-dynamic";

// Priority-ordered list of preferred models.
// The API will try each in order and use the first one Groq currently supports.
const PREFERRED_MODELS = [
  "openai/gpt-oss-120b",   // Best GPT-class model on Groq (as of Aug 2026)
  "openai/gpt-oss-20b",    // Fallback GPT-class
  "llama-3.3-70b-versatile", // Best open Llama model
  "llama-3.1-70b-versatile",
  "llama-3.1-8b-instant",  // Fast fallback
  "gemma2-9b-it",          // Last resort
];

let cachedModel: string | null = null;
let cacheExpiry = 0;

async function getBestAvailableModel(apiKey: string): Promise<string> {
  const now = Date.now();
  // Cache for 10 minutes so we don't fetch model list on every request
  if (cachedModel && now < cacheExpiry) {
    return cachedModel;
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json() as { data?: { id: string }[] };
      const available = new Set((data.data ?? []).map((m) => m.id));

      // Find the first preferred model that Groq currently supports
      for (const model of PREFERRED_MODELS) {
        if (available.has(model)) {
          cachedModel = model;
          cacheExpiry = now + 10 * 60 * 1000; // 10 minutes
          console.log(`[AI] Selected model: ${model}`);
          return model;
        }
      }
    }
  } catch (e) {
    console.warn("[AI] Could not fetch Groq model list, using default:", e);
  }

  // Safe default if model list fetch fails
  return PREFERRED_MODELS[0];
}

export async function POST(request: Request) {
  try {
    await verifyAuthToken(request);

    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      console.error("Missing GROQ_API_KEY environment variable");
      return NextResponse.json({ error: "Server configuration error: Missing API Key" }, { status: 500 });
    }

    const model = await getBestAvailableModel(GROQ_API_KEY);

    // Fetch the support Telegram username from admin settings
    let telegramUsername = "@korixapay";
    try {
      const settingsRes = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || "https://korixapay.com"}/api/settings`,
        { signal: AbortSignal.timeout(3000) }
      );
      if (settingsRes.ok) {
        const settings = await settingsRes.json() as { telegramUsername?: string };
        if (settings.telegramUsername) telegramUsername = settings.telegramUsername;
      }
    } catch {
      // Use default if fetch fails
    }

    const systemPrompt = {
      role: "system",
      content: `You are a helpful, professional AI support assistant for Korixa, a modern crypto exchange and global payment platform. Be concise, polite, and helpful. Format responses using markdown when appropriate.

When a user asks to speak with a human, needs urgent help, or asks for human/live support or contact info, always tell them:
"For direct human support, please contact the Korixapay team on Telegram: **${telegramUsername}** — tap to open: https://t.me/${telegramUsername.replace("@", "")}"

Always include the Telegram link when recommending human assistance.`,
    };

    const apiMessages = [systemPrompt, ...messages];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Groq API error:", errorData);

      // If the selected model is no longer available, clear cache and retry with next model
      if (response.status === 400 || response.status === 404) {
        cachedModel = null;
        cacheExpiry = 0;
      }

      return NextResponse.json(
        { error: "Failed to communicate with AI provider", details: errorData },
        { status: 502 }
      );
    }

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content || "Sorry, I couldn't process your request.";

    return NextResponse.json({ reply, model });
  } catch (error: any) {
    console.error("Chat API error:", error);
    if (error?.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
