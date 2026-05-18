import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  CATEGORIZATION_SYSTEM_PROMPT,
  buildUserPrompt,
  type CategorizationResponse,
} from "@/lib/anthropic";

const REQUIRED_FIELDS: (keyof CategorizationResponse)[] = [
  "theme",
  "sentiment",
  "feedback_type",
  "ai_summary",
  "ai_reasoning",
  "ai_confidence",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { raw_text, customer_name, customer_segment, source } = body;

    if (!raw_text || !customer_name || !customer_segment || !source) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("[categorize] ANTHROPIC_API_KEY is not set");
      return NextResponse.json(
        { error: "AI service temporarily unavailable" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      system: CATEGORIZATION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildUserPrompt({ raw_text, customer_name, customer_segment, source }),
        },
      ],
    });

    const rawContent = message.content[0];
    if (rawContent.type !== "text") {
      throw new Error("Unexpected non-text response from AI");
    }

    // Strip accidental markdown fences
    const cleaned = rawContent.text
      .replace(/^```(?:json)?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned) as CategorizationResponse;

    for (const field of REQUIRED_FIELDS) {
      if (parsed[field] === undefined || parsed[field] === null) {
        throw new Error(`AI response missing required field: ${field}`);
      }
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[categorize] Error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "AI service temporarily unavailable" },
      { status: 500 }
    );
  }
}
