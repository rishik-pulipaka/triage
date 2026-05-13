import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Theme, FeedbackSource, Sentiment, FeedbackType, CustomerSegment } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRICEScore(score: number): string {
  if (score === 0) return "0";
  if (score >= 100) return Math.round(score).toLocaleString();
  return score % 1 === 0 ? score.toString() : score.toFixed(1);
}

export function getThemeLabel(theme: Theme): string {
  const labels: Record<Theme, string> = {
    integrations: "Integrations",
    performance: "Performance",
    mobile_experience: "Mobile Experience",
    collaboration: "Collaboration",
    search_discovery: "Search & Discovery",
    notifications: "Notifications",
    pricing_billing: "Pricing & Billing",
    onboarding: "Onboarding",
    reporting_analytics: "Reporting & Analytics",
    ai_features: "AI Features",
  };
  return labels[theme];
}

export function getSourceLabel(source: FeedbackSource): string {
  const labels: Record<FeedbackSource, string> = {
    intercom: "Intercom",
    slack: "Slack",
    sales_call: "Sales Call",
    twitter: "Twitter",
    internal: "Internal",
  };
  return labels[source];
}

export function getSentimentColor(sentiment: Sentiment): string {
  switch (sentiment) {
    case "positive": return "text-emerald-500";
    case "negative": return "text-rose-500";
    case "neutral": return "text-amber-500";
  }
}

export function getTypeLabel(type: FeedbackType): string {
  const labels: Record<FeedbackType, string> = {
    feature_request: "Feature Request",
    bug: "Bug",
    churn_risk: "Churn Risk",
    praise: "Praise",
    question: "Question",
  };
  return labels[type];
}

export function getSegmentLabel(segment: CustomerSegment): string {
  const labels: Record<CustomerSegment, string> = {
    enterprise: "Enterprise",
    mid_market: "Mid-Market",
    smb: "SMB",
    startup: "Startup",
  };
  return labels[segment];
}
