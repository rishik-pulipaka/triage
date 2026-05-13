# Triage — Metrics & Success Framework

**Author:** Rishik Pulipaka
**Date:** May 2026
**Status:** v1
**Related:** [PRD](./PRD.md) · [Schema](./SCHEMA.md)

---

## TL;DR

Triage's success hinges on a single question: *Does Sarah replace her 6-hour Monday triage routine with a 30-minute Triage session?* This doc defines the metrics that answer that question, the framework used to prioritize what to build, and the post-launch learning plan.

---

## 1. North Star Metric

### Weekly Triage Time per PM

**Definition:** The total minutes Sarah (or any APM persona) spends from opening Triage on Monday to having a prioritized roadmap ready to discuss in Tuesday standups.

**Baseline (today):** 360 minutes (6 hours of manual sorting across Notion, Sheets, Intercom, Slack)

**Target (v1):** < 30 minutes (a 12x reduction)

**Why this is the right north star:**

1. **It's the user pain stated in plain language.** Sarah didn't ask for "AI categorization." She asked for her Monday morning back.
2. **It's directional and unambiguous.** Lower = better. No edge cases.
3. **It survives feature changes.** If we add new features or change the UI, this metric still tells us if we're winning.
4. **It connects to business value.** Time saved × number of PMs × loaded hourly cost = ROI story for selling Triage internally.

**What I rejected as north stars:**

- **"Items categorized per session"** → A vanity metric. More items doesn't mean better decisions.
- **"AI categorization accuracy %"** → Important, but a *means*, not an *end*. Sarah doesn't care if the AI is 95% accurate if she still spends 3 hours fixing the 5%.
- **"Roadmap items shipped"** → Outcome of good triage, but downstream of too many variables outside Triage's control.

---

## 2. Secondary Metrics

These diagnose *how* the north star is moving — they explain the why behind the what.

| Metric | Definition | Target |
|--------|-----------|--------|
| **AI Categorization Acceptance Rate** | % of AI-categorized items Sarah accepts without manual override | ≥ 80% |
| **Time-to-First-Insight** | Seconds from opening Triage to viewing the first ranked roadmap item | < 10s |
| **Roadmap Traceability** | % of roadmap items where source feedback can be surfaced in ≤ 1 click | 100% |
| **Theme Discovery Rate** | Number of distinct themes surfaced per session that Sarah didn't already track | ≥ 2 |
| **Session Completion Rate** | % of sessions where Sarah exports/shares a roadmap (vs abandoning mid-triage) | ≥ 70% |

### How each connects to the north star

- High **Acceptance Rate** → less time fixing AI mistakes → lower triage time
- Fast **Time-to-First-Insight** → less ramp-up friction → lower triage time
- Strong **Traceability** → less time hunting for "why is this prioritized?" → lower triage time
- High **Discovery Rate** → fewer blind spots → triage actually produces better roadmaps, not just faster ones
- High **Completion Rate** → users finish what they start → triage time stays under target

---

## 3. Guardrail Metrics

Guardrails are metrics that protect against **gaming the north star.** If we optimized only for "lower triage time," we could just auto-approve everything and call it done. Guardrails catch that failure mode.

| Guardrail | What It Catches | Target |
|-----------|-----------------|--------|
| **False High-Priority Rate** | % of items scored RICE > 100 that Sarah later marks as miscategorized | < 10% |
| **AI Confidence Calibration** | When AI says "high confidence," is it actually right ≥ 90% of the time? | ≥ 90% |
| **Override Reversal Rate** | % of manual overrides Sarah later reverts (signal: she over-edited the AI) | < 5% |
| **Item Skip Rate** | % of items in a session that Sarah didn't review at all | < 15% |

**Why guardrails matter:** If north star is improving but guardrails are degrading, we're shipping speed at the cost of quality. That's the exact failure mode this product is supposed to prevent.

---

## 4. RICE Framework — Why I Chose It

Triage uses RICE scoring as its primary prioritization framework. I evaluated three alternatives before committing:

### The frameworks I considered

| Framework | How It Works | Pros | Cons |
|-----------|--------------|------|------|
| **RICE** | (Reach × Impact × Confidence) / Effort | Quantitative, defensible, balances cost vs value | Requires effort estimates that PMs often don't have |
| **MoSCoW** | Must / Should / Could / Won't buckets | Fast, easy to teach | Subjective, no math to defend choices |
| **Kano Model** | Maps features to user delight axes | Great for UX research | Doesn't help with technical scope or effort |
| **Weighted Scoring** | Custom criteria with weights | Maximum flexibility | Decision paralysis on what criteria to weight |

### Why RICE won

1. **Triage's user (Sarah) needs defensibility.** When Marcus asks "why is X higher priority than Y?" Sarah needs a number, not a vibe. RICE gives a calculated score.

2. **RICE forces effort estimation early.** That's a feature, not a bug. PMs who don't estimate effort end up with bloated roadmaps. Forcing the field surfaces unrealistic ideas before they get into a sprint.

3. **It's the industry standard at SaaS companies.** Intercom (where RICE was invented), Reforge curriculum, most YC-stage startups. Familiar = adoptable.

4. **It maps cleanly to a data schema.** Four numbers + one calculation. Easy to store, easy to chart, easy to override.

### How RICE is computed in Triage

```
RICE Score = (Reach × Impact × Confidence%) / Effort

Where:
- Reach: 1-10 scale (estimated # of affected users)
- Impact: 0.25 / 0.5 / 1 / 2 / 3 (RICE standard scale, minimal → massive)
- Confidence: 0-100% (how sure are we this is real?)
- Effort: person-weeks (engineering estimate)
```

### How AI assigns RICE inputs (and why)

The AI uses the feedback content + customer context to make initial estimates:

- **Reach** is inferred from: feedback type (bugs affecting common workflows = high), customer segment volume, and how often similar feedback appears in the dataset.
- **Impact** is inferred from: sentiment intensity, whether it's a churn signal, and whether the feature blocks adoption.
- **Confidence** is inferred from: how specific the feedback is (bug with repro steps = high; vague "make it better" = low), and whether it's reinforced by other items.
- **Effort** is the *weakest* AI estimate — these are placeholders meant to be overridden by eng. We surface this to Sarah explicitly: *"Effort is a guess. Confirm with your engineering lead."*

This is encoded in the PRD design principle: **AI is a copilot, not autopilot.** The model gives Sarah a starting point. She decides.

---

## 5. KPI Dashboard Plan (if this were a live product)

If Triage launched to real users tomorrow, here's what I'd instrument:

### Event tracking (analytics layer)

| Event | Why I'd Track It |
|-------|------------------|
| `session_started` | Baseline for time-on-task measurement |
| `feedback_item_viewed` | Engagement depth (are users actually reading vs. scanning?) |
| `filter_applied` (with filter type) | Which filters are useful? Which are noise? |
| `rice_override` (with which input changed) | Where does AI disagree with humans most? |
| `category_override` (theme/type/sentiment) | Categorization quality signal |
| `detail_dialog_opened` | Are users drilling into raw feedback? |
| `roadmap_exported` | Session completion proxy |
| `session_ended` (with duration) | North star measurement |

### Funnel I'd watch weekly

```
Open Triage → View first item → Apply at least one filter → Override or accept ≥1 item → Export roadmap
```

Each drop-off in this funnel is a potential UX issue. If users open Triage but never apply a filter, the filters are either invisible or unintuitive.

### Cohort views

- **By tenure:** Do users get faster over weeks 1, 2, 3, 4? (Learning curve signal)
- **By company size:** Do enterprise PMs use Triage differently from SMB PMs? (Persona validation)
- **By volume:** Do high-feedback-volume orgs see bigger time savings? (Where's the most value?)

---

## 6. Post-Launch Measurement Plan

Real PMs don't ship and forget. Here's the learning plan I'd run after a hypothetical launch.

### Week 1: Activation & First Impressions
- **What I'm checking:** Did users finish their first session? Is time-to-first-insight under 10s?
- **Success signal:** ≥ 70% of new users complete a session in week 1.
- **Red flag:** > 30% of new users open Triage once and never return → onboarding broken.

### Month 1: Habit Formation
- **What I'm checking:** Are users returning weekly? Is north star (triage time) actually decreasing as they get familiar?
- **Success signal:** Median weekly triage time drops below 60 minutes (halfway to target).
- **Red flag:** Users open Triage but still fall back to spreadsheets for the "real" decisions.

### Quarter 1: Validation & Pivot Decisions
- **What I'm checking:** Are the secondary metrics moving in the right direction together? Is acceptance rate above 80%?
- **Success signal:** North star at or below 30 min target, with ≥ 80% acceptance.
- **What would trigger a pivot:**
  - Acceptance rate stuck below 60% → AI quality is the bottleneck, invest in better categorization models
  - Sessions completed but no roadmap exported → product is being used as a viewer, not a decision tool. Rethink output.
  - High discovery rate but flat triage time → users are learning more but not getting faster. Possibly too much UI.

---

## 7. v2 Roadmap — What I'd Build Next

Each item below is justified by a specific signal from the dataset or an anticipated post-launch insight.

### Tier 1: Highest-leverage v2 features

**1. Live integrations with Intercom, Slack, and Gong**
- **Why:** The synthetic dataset is the biggest "demo crutch" in v1. Real value unlock requires real-time ingestion.
- **Signal:** PRD non-goal already flags this as the natural v2 step.
- **Estimated RICE:** 9 × 3 × 95% / 8 = 320

**2. Multi-user collaboration and assignments**
- **Why:** Triage is currently a single-PM tool. Real product teams have multiple PMs who need to divide and conquer feedback.
- **Signal:** Marcus (secondary persona) needs visibility into Sarah's decisions; collaboration unlocks his use case.
- **Estimated RICE:** 7 × 2 × 80% / 6 = 187

**3. Custom RICE weights per organization**
- **Why:** Different companies value impact differently. Enterprise SaaS weights churn risk heavier; consumer startups weight reach heavier.
- **Signal:** Synthetic data variety shows segment-specific feedback patterns; one-size scoring won't fit all.
- **Estimated RICE:** 6 × 2 × 70% / 4 = 210

### Tier 2: Quality-of-life improvements

**4. Bulk operations** — multi-select items for category re-assignment or RICE re-scoring.
- **Signal:** Sarah's session pattern (75 items in 30 min) implies bulk actions would save real time.

**5. Auto-clustering of duplicate feedback** — group near-identical items into a single roadmap entry.
- **Signal:** Items like fb_010, fb_023, fb_026 (notification complaints from different sources) should cluster.

**6. Email digest mode** — daily summary email instead of opening the app.
- **Signal:** Sarah opens Triage on Mondays; rest of the week she'd benefit from passive updates.

### Tier 3: Premium / enterprise features (revenue plays)

**7. SSO and SAML support** — unlocks enterprise sales.
**8. Audit logs** — required for SOC 2 customers.
**9. Custom themes** — let orgs define their own categorization taxonomy.

---

## 8. Anti-Goals: What I'd Refuse to Build

Equally important to v2 ideas is what I'd *push back on* if leadership asked:

- **AI-generated PRDs from feedback.** Tempting, but undermines the whole "AI as copilot" principle. PMs need to write PRDs to think clearly. Generating them removes the thinking.
- **Public-facing customer roadmap.** Different product entirely; Triage is internal.
- **Sentiment-only triage.** Sentiment is a signal, not a strategy. Optimizing for happy customers ignores high-impact silent users.
- **Gamification of triage.** No streaks, no points. Sarah is a professional. Treat her like one.

---

## 9. What Success Looks Like — One-Line Summary

> **Sarah closes her laptop on Tuesday morning, confident in her roadmap, having spent less than half an hour with Triage on Monday. Marcus reviews her work and can trace every decision back to evidence. The Notion database and the Google Sheet are gone.**

That's the picture. Every metric in this doc exists to measure how close we are to that scene.

---

*End of metrics doc.*
