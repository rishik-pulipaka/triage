import feedbackData from "@/data/feedback.json";
import type {
  FeedbackItem,
  FeedbackSource,
  Theme,
  Sentiment,
  FeedbackType,
} from "./types";

const feedback = feedbackData as FeedbackItem[];

export function getAllFeedback(): FeedbackItem[] {
  return feedback;
}

export function getFeedbackById(id: string): FeedbackItem | undefined {
  return feedback.find((item) => item.id === id);
}

export function getFeedbackByTheme(theme: Theme): FeedbackItem[] {
  return feedback.filter((item) => item.theme === theme);
}

export function getFeedbackBySource(source: FeedbackSource): FeedbackItem[] {
  return feedback.filter((item) => item.source === source);
}

export function getFeedbackByType(type: FeedbackType): FeedbackItem[] {
  return feedback.filter((item) => item.feedback_type === type);
}

export function sortByRICE(
  items: FeedbackItem[],
  direction: "asc" | "desc"
): FeedbackItem[] {
  return [...items].sort((a, b) =>
    direction === "desc"
      ? b.rice.score - a.rice.score
      : a.rice.score - b.rice.score
  );
}

export function getThemeCounts(): Record<Theme, number> {
  const themes: Theme[] = [
    "integrations",
    "performance",
    "mobile_experience",
    "collaboration",
    "search_discovery",
    "notifications",
    "pricing_billing",
    "onboarding",
    "reporting_analytics",
    "ai_features",
  ];
  const counts = Object.fromEntries(themes.map((t) => [t, 0])) as Record<
    Theme,
    number
  >;
  feedback.forEach((item) => counts[item.theme]++);
  return counts;
}

export function getSourceCounts(): Record<FeedbackSource, number> {
  const sources: FeedbackSource[] = [
    "intercom",
    "slack",
    "sales_call",
    "twitter",
    "internal",
  ];
  const counts = Object.fromEntries(
    sources.map((s) => [s, 0])
  ) as Record<FeedbackSource, number>;
  feedback.forEach((item) => counts[item.source]++);
  return counts;
}

export function getSentimentCounts(): Record<Sentiment, number> {
  const sentiments: Sentiment[] = ["positive", "neutral", "negative"];
  const counts = Object.fromEntries(
    sentiments.map((s) => [s, 0])
  ) as Record<Sentiment, number>;
  feedback.forEach((item) => counts[item.sentiment]++);
  return counts;
}

export function getTopByRICE(limit: number): FeedbackItem[] {
  return sortByRICE(feedback, "desc").slice(0, limit);
}
