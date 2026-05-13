# Triage — Data Schema Design

**Author:** Rishik Pulipaka
**Date:** May 2026
**Status:** Draft v1
**Related:** [PRD](./PRD.md)

---

## Purpose

This document defines the data model for Triage. Every field has a purpose tied back to a user story in the PRD. If a field doesn't serve a user story, it doesn't exist.

---

## Core Entity: `FeedbackItem`

Every piece of incoming user feedback is normalized into a `FeedbackItem` object. This is the atomic unit of Triage.

```typescript
interface FeedbackItem {
  // === Identification ===
  id: string;                    // unique identifier (e.g., "fb_001")
  created_at: string;            // ISO timestamp of when feedback was received
  
  // === Source & Raw Content ===
  source: FeedbackSource;        // where it came from
  raw_text: string;              // the original feedback as written by the customer
  customer_name: string;         // who said it (synthetic names for demo)
  customer_segment: CustomerSegment;  // enterprise / mid-market / smb / startup
  
  // === AI Categorization (filled by Claude) ===
  theme: Theme;                  // primary theme (e.g., "Integrations", "Performance")
  sentiment: Sentiment;          // positive / neutral / negative
  feedback_type: FeedbackType;   // feature_request / bug / churn_risk / praise / question
  ai_summary: string;            // one-sentence AI summary of the feedback
  ai_reasoning: string;          // why the AI categorized it this way (for transparency)
  ai_confidence: 'high' | 'medium' | 'low';
  
  // === RICE Scoring ===
  rice: {
    reach: number;               // 1-10: how many users affected
    impact: number;              // 0.25, 0.5, 1, 2, 3 (RICE standard scale)
    confidence: number;          // 0-100 (percentage)
    effort: number;              // person-weeks estimated
    score: number;               // (reach * impact * confidence) / effort
  };
  
  // === User Overrides ===
  user_edited: boolean;          // did Sarah manually override anything?
  user_notes: string | null;     // Sarah's notes on this item
}
```

---

## Supporting Enums

```typescript
type FeedbackSource = 
  | 'intercom'       // support tickets
  | 'slack'          // customer success channel messages
  | 'sales_call'     // notes from Gong/Chorus calls
  | 'twitter'        // public mentions
  | 'internal';      // team-submitted feedback

type CustomerSegment =
  | 'enterprise'     // 500+ employees
  | 'mid_market'     // 50-500
  | 'smb'            // 10-50
  | 'startup';       // <10

type Theme =
  | 'integrations'         // Slack, GitHub, Linear, etc.
  | 'performance'          // speed, load times, reliability
  | 'mobile_experience'    // iOS/Android app issues
  | 'collaboration'        // real-time editing, sharing, permissions
  | 'search_discovery'     // finding content within the app
  | 'notifications'        // alerts, digests, mentions
  | 'pricing_billing'      // plan limits, invoice issues
  | 'onboarding'           // first-run experience, setup
  | 'reporting_analytics'  // dashboards, exports
  | 'ai_features';         // smart suggestions, summaries

type Sentiment = 'positive' | 'neutral' | 'negative';

type FeedbackType = 
  | 'feature_request'
  | 'bug'
  | 'churn_risk'
  | 'praise'
  | 'question';
```

---

## Field-by-Field Rationale

### Identification fields
- **`id`** — Every entity needs a stable ID. Format `fb_001` is human-readable for debugging.
- **`created_at`** — Enables time-based filtering ("show me last week's feedback") and trend charts.

### Source & raw content
- **`source`** — Critical for the "feedback breakdown by source" chart in the dashboard. Also lets Sarah filter ("just show Intercom tickets").
- **`raw_text`** — The original customer voice. **Never overwrite this.** The whole product depends on showing it on the detail page.
- **`customer_name`** — Humanizes feedback. "Sarah from Acme Corp said..." is more persuasive than anonymous data.
- **`customer_segment`** — Lets Sarah weight enterprise feedback differently from SMB. Strategic filter.

### AI Categorization fields
- **`theme`** — Primary axis for grouping. Drives the theme dashboard chart.
- **`sentiment`** — Lets Sarah surface churn risk fast (negative sentiment + enterprise = red flag).
- **`feedback_type`** — Different types need different roadmap treatment. Bugs go to engineering. Feature requests go to roadmap. Churn risks go to CS.
- **`ai_summary`** — A one-line summary so Sarah doesn't have to read full raw text in the table view.
- **`ai_reasoning`** — Transparency. **This is the trust feature.** Without seeing reasoning, Sarah won't trust AI categorization. Per PRD design principle #2: "AI is a copilot, not autopilot."
- **`ai_confidence`** — Lets Sarah focus her review time on low-confidence items first.

### RICE scoring
RICE = (Reach × Impact × Confidence) / Effort

- **`reach`** (1-10) — How many users affected. AI estimates from segment + theme volume.
- **`impact`** (0.25/0.5/1/2/3) — RICE standard scale. AI assigns based on feedback type and sentiment.
- **`confidence`** (0-100%) — How sure are we this is real? Lower for vague feedback, higher for concrete bugs with repro steps.
- **`effort`** (person-weeks) — Engineering estimate. AI makes a guess; PM overrides.
- **`score`** — Computed field. The single number that orders the roadmap.

### User Overrides
- **`user_edited`** — Lets us measure the "categorization accuracy" metric from the PRD (% of items Sarah accepted without editing).
- **`user_notes`** — Sarah's private notes ("follow up with this customer", "discussed in Tuesday standup").

---

## Schema Stress Tests

Before generating synthetic data, every schema should be stress-tested against edge cases.

| Edge Case | Does the schema handle it? |
|-----------|---------------------------|
| Customer says "I love feature X but it's broken" | ✅ Two `FeedbackItems` with same raw_text, different `feedback_type` |
| Vague feedback like "make it faster" | ✅ Falls under theme=performance, confidence=low |
| Feedback in another language | ⚠️ MVP: English-only. Flag in v2. |
| Anonymous feedback (no customer name) | ✅ `customer_name` can be "Anonymous" string |
| Feedback spanning multiple themes | ⚠️ MVP: assign the dominant theme only. Multi-theme is v2. |
| Same feedback from 5 different customers | ✅ 5 separate items; clustering happens at chart level |

The two ⚠️ items are documented limitations — not bugs. **A senior PM names limitations explicitly** rather than pretending the system handles everything.

---

## Synthetic Data Strategy

We'll generate **75 feedback items** distributed across:

| Distribution Axis | Breakdown |
|-------------------|-----------|
| **Source** | Intercom 30%, Slack 25%, Sales Call 20%, Twitter 15%, Internal 10% |
| **Sentiment** | Negative 40%, Neutral 30%, Positive 30% |
| **Feedback Type** | Feature Request 40%, Bug 30%, Churn Risk 15%, Praise 10%, Question 5% |
| **Customer Segment** | SMB 35%, Mid-market 30%, Enterprise 20%, Startup 15% |
| **Theme** | Spread roughly evenly across 10 themes, with 3 "hot" themes (Integrations, Performance, Collaboration) getting double weight |

**Why this distribution?**
- More negative than positive (real products get complaints louder than compliments)
- Feature requests dominate (this is the largest bucket for any growing SaaS)
- Mid-market and SMB skew because that's Lumen's actual customer base
- "Hot themes" create patterns Sarah can spot — which is what makes the demo compelling

**Why 75?**
- Enough volume for the dashboard charts to look populated
- Not so much that the page becomes slow or overwhelming
- Round number that's defensible in interviews ("I scoped a realistic week of feedback")

---

## How This Schema Maps to PRD User Stories

| User Story | Fields Used |
|-----------|-------------|
| US1: See feedback in one place | All items, all sources |
| US2: Auto-categorize | `theme`, `sentiment`, `feedback_type`, `ai_summary` |
| US3: RICE scoring | `rice` object |
| US4: Filter and sort | `source`, `customer_segment`, `theme`, `rice.score` |
| US5: Visual summaries | `theme` (volume chart), `source` (source breakdown), `sentiment` (sentiment chart) |
| US6: Click for raw feedback | `raw_text`, `ai_reasoning`, `customer_name` |

**Every field in the schema serves at least one user story.** If we found a field that didn't, we'd cut it.

---

*End of schema doc.*
