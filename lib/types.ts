export type FeedbackSource =
  | "intercom"
  | "slack"
  | "sales_call"
  | "twitter"
  | "internal";

export type CustomerSegment =
  | "enterprise"
  | "mid_market"
  | "smb"
  | "startup";

export type Theme =
  | "integrations"
  | "performance"
  | "mobile_experience"
  | "collaboration"
  | "search_discovery"
  | "notifications"
  | "pricing_billing"
  | "onboarding"
  | "reporting_analytics"
  | "ai_features";

export type Sentiment = "positive" | "neutral" | "negative";

export type FeedbackType =
  | "feature_request"
  | "bug"
  | "churn_risk"
  | "praise"
  | "question";

export interface RICEScore {
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  score: number;
}

export interface FeedbackItem {
  // Identification
  id: string;
  created_at: string;

  // Source & raw content
  source: FeedbackSource;
  raw_text: string;
  customer_name: string;
  customer_segment: CustomerSegment;

  // AI categorization
  theme: Theme;
  sentiment: Sentiment;
  feedback_type: FeedbackType;
  ai_summary: string;
  ai_reasoning: string;
  ai_confidence: "high" | "medium" | "low";

  // RICE scoring
  rice: RICEScore;

  // User overrides
  user_edited: boolean;
  user_notes: string | null;
}
