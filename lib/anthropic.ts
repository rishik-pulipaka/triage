import type { FeedbackItem } from "./types";
import type { Theme, Sentiment, FeedbackType } from "./types";

export const CATEGORIZATION_SYSTEM_PROMPT =
  "You are a product feedback analyst. Analyze the feedback and return ONLY valid JSON — no markdown fences, no preamble, no explanation. Your response must be a single JSON object and nothing else.";

export interface CategorizationResponse {
  theme: Theme;
  sentiment: Sentiment;
  feedback_type: FeedbackType;
  ai_summary: string;
  ai_reasoning: string;
  ai_confidence: "high" | "medium" | "low";
}

export function buildUserPrompt(
  feedback: Pick<
    FeedbackItem,
    "raw_text" | "customer_name" | "customer_segment" | "source"
  >
): string {
  return `Analyze this product feedback and return a JSON object with exactly these 6 keys:
- theme: one of: integrations, performance, mobile_experience, collaboration, search_discovery, notifications, pricing_billing, onboarding, reporting_analytics, ai_features
- sentiment: one of: positive, neutral, negative
- feedback_type: one of: feature_request, bug, churn_risk, praise, question
- ai_summary: one sentence plain string summarizing the feedback
- ai_reasoning: 1-2 sentences explaining why this categorization makes sense
- ai_confidence: one of: high, medium, low — must be "low" if the feedback is vague, subjective, or ambiguous

Feedback details:
Customer: ${feedback.customer_name}
Segment: ${feedback.customer_segment}
Source: ${feedback.source}
Feedback: "${feedback.raw_text}"

Return only the JSON object.`;
}
