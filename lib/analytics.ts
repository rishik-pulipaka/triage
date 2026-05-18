export interface AnalyticsEvent {
  event_name: string;
  timestamp: string;
  properties: Record<string, unknown>;
}

const STORAGE_KEY = "triage_analytics_events";
const MAX_EVENTS = 100;

export function trackEvent(
  name: string,
  properties: Record<string, unknown> = {}
): void {
  const event: AnalyticsEvent = {
    event_name: name,
    timestamp: new Date().toISOString(),
    properties,
  };
  console.log("📊 [Triage Analytics]", name, properties);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const events: AnalyticsEvent[] = raw ? (JSON.parse(raw) as AnalyticsEvent[]) : [];
    events.push(event);
    if (events.length > MAX_EVENTS) {
      events.splice(0, events.length - MAX_EVENTS);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // localStorage unavailable (SSR or private mode)
  }
}
