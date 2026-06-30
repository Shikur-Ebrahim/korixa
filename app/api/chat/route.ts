import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth/verify-token";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // Verify user is authenticated
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

    // Add a system prompt to guide the AI's behavior
    const systemPrompt = {
      role: "system",
      content: "You are a helpful, professional AI support assistant for Korixa, a modern crypto exchange platform. Be concise, polite, and helpful. Format responses using markdown when appropriate."
    };

    const apiMessages = [systemPrompt, ...messages];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // Updated from decommissioned model
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1024,
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Groq API error:", errorData);
      return NextResponse.json({ 
        error: "Failed to communicate with AI provider", 
        details: errorData 
      }, { status: 502 });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't process your request.";

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("Chat API error:", error);
    if (error?.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
