# Triage — Product Requirements Document

**Author:** Rishik Pulipaka
**Date:** May 2026
**Status:** Draft v1
**Reviewers:** Engineering Lead, Design Lead, Head of Product

---

## TL;DR

Triage is an AI-powered feedback triage dashboard for early-stage SaaS product teams. It ingests raw user feedback from multiple sources, auto-categorizes it by theme and sentiment using LLMs, and surfaces a RICE-scored roadmap that turns hours of manual sorting into minutes of decision-making.

**MVP target:** Reduce weekly feedback triage time from 6 hours to under 30 minutes for a single PM at a 20-50 person SaaS startup.

---

## 1. Problem Statement

Early-stage SaaS PMs are buried in unstructured user feedback. A typical APM at a Series A startup receives feedback from 5+ disconnected sources every week:

- Intercom support tickets (200-500/week)
- Customer success Slack channels (50-100 messages/week)
- Sales call notes from Gong/Chorus (10-20 calls/week)
- Twitter and community mentions (variable)
- Internal team requests (10-30/week)

There is no shared system for capturing, categorizing, and prioritizing this signal. PMs spend 4-8 hours every Monday morning manually copy-pasting feedback into spreadsheets, tagging it by hand, and trying to spot patterns. By the time they finish, the week is already half-spent reacting to whoever was loudest rather than what was most valuable.

**The cost:** Roadmaps get built on gut feel and recency bias instead of evidence. High-impact feature requests get buried. Customer churn signals get missed.

---

## 2. Target User

### Primary Persona: Sarah Chen, Associate Product Manager at Lumen

- **Role:** APM, 18 months into her first PM job
- **Company:** Lumen, a 35-person B2B SaaS collaboration tool, Series A
- **Daily reality:** Owns 2 product areas, reports to a Head of Product, works with 4 engineers and 1 designer
- **Pain point:** Spends every Monday morning (6+ hours) doing manual feedback triage in a Notion database and a Google Sheet
- **Goal:** Walk into Tuesday roadmap meetings with confidence about what to build next, backed by evidence not vibes
- **Tools she lives in:** Notion, Linear, Slack, Intercom, Figma
- **Quote:** *"I know the data is in there somewhere. I just don't have time to find it before someone in leadership asks me what we're shipping next quarter."*

### Secondary Persona: Marcus, Head of Product at Lumen

- Reviews Sarah's prioritization, wants traceability from feedback → roadmap
- Needs to defend roadmap decisions to the CEO and board with data

---

## 3. Goals

1. Reduce Sarah's weekly triage time from 6 hours to under 30 minutes
2. Surface a RICE-scored, filterable roadmap in under 60 seconds
3. Make every prioritization decision traceable back to source feedback
4. Give Marcus a defensible "why we built this" answer for every roadmap item

---

## 4. Non-Goals (Explicitly Out of Scope)

- **Not a CRM** — we don't manage customer relationships or contact data
- **Not a support tool** — we don't help Sarah *respond* to feedback, only triage it
- **Not multi-tenant** — single-user MVP; team collaboration is v2
- **No live integrations in MVP** — we use uploaded/synthetic data, not live Intercom/Slack APIs (v2 scope)
- **No authentication in MVP** — single-user demo experience
- **No writeback to source systems** — triage decisions stay in Triage

---

## 5. User Stories

1. **As Sarah,** I want to see all incoming feedback in one place so I stop tab-switching between Intercom, Slack, and Sheets.
2. **As Sarah,** I want feedback auto-categorized by theme and sentiment so I can spot patterns without reading every entry.
3. **As Sarah,** I want each feedback item scored using RICE so I can defend my prioritization to leadership.
4. **As Sarah,** I want to filter and sort the roadmap view by theme, score, or source so I can answer specific questions from my team in seconds.
5. **As Sarah,** I want to see visual summaries (charts) of feedback volume and themes so I can present trends in roadmap meetings without building slides.
6. **As Marcus,** I want to click any roadmap item and see the raw feedback that drove its score so I can trust the prioritization.

---

## 6. Success Metrics

### Primary Metric (North Star)
**Weekly triage time:** Average time Sarah spends from opening Triage on Monday to having a prioritized roadmap ready for Tuesday's standup.
- **Target:** < 30 minutes (down from 6 hours baseline)
- **Measurement:** Self-reported via in-app session timer

### Secondary Metrics
- **Categorization accuracy:** % of AI-categorized items Sarah accepts without manual override
  - **Target:** ≥ 80%
- **Roadmap traceability:** % of roadmap items where the source feedback can be surfaced in one click
  - **Target:** 100%
- **Feature discovery rate:** Number of feature themes surfaced that Sarah didn't already know about
  - **Target:** ≥ 2 per week

### Guardrail Metrics
- **False high-priority rate:** % of items scored RICE > 100 that Sarah marks as miscategorized
  - **Target:** < 10%
- **Time to first insight:** Time from upload to first usable categorized view
  - **Target:** < 10 seconds

---

## 7. MVP Scope

### In Scope (v1)

| Feature | Description |
|---------|-------------|
| Feedback ingestion | Pre-loaded synthetic dataset of 75 realistic Lumen feedback items across 5 sources |
| AI categorization | Each item auto-tagged with theme, sentiment, and customer segment via Claude API |
| RICE scoring | Each item scored on Reach, Impact, Confidence, Effort with calculated RICE score |
| Roadmap view | Sortable, filterable table of all feedback with score-based ordering |
| Theme dashboard | Charts: feedback volume by theme, sentiment breakdown, source breakdown |
| Item detail view | Click any item to see raw feedback, AI reasoning, and edit RICE inputs |
| Dark/light mode | Theme toggle, dark default |

### Out of Scope (deferred to v2+)

- Live integrations with Intercom / Slack / Gong
- Multi-user collaboration and assignments
- Authentication and user accounts
- Custom RICE weights per organization
- Export to Linear / Jira / Notion
- Email digests and notifications
- Bulk re-categorization workflows

---

## 8. Key Design Principles

1. **Speed over completeness.** Sarah needs the 80% answer in 60 seconds, not the 100% answer in an hour.
2. **AI is a copilot, not autopilot.** Every AI decision is editable and the reasoning is shown.
3. **Defensible by default.** Every roadmap item links back to its source feedback.
4. **Visual first.** Charts and color coding before tables and text.

---

## 9. Open Questions & Assumptions

### Open Questions
- How do we handle conflicting feedback (e.g., "we love feature X" vs "feature X is broken")?
- What's the right default RICE confidence value for AI-scored items?
- Should we show AI confidence as a number or just qualitative (high/med/low)?

### Assumptions to Validate
- Sarah trusts AI categorization enough to use it as the starting point (not start from scratch)
- 75 synthetic feedback items is enough volume to demonstrate value without overwhelming demo viewers
- RICE is more intuitive than other frameworks (MoSCoW, Kano) for early-stage SaaS PMs

---

## 10. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| AI miscategorization undermines trust | Medium | High | Show reasoning, make every tag editable, surface confidence |
| Demo dataset feels unrealistic | Medium | Medium | Generate variety: bugs, feature requests, churn signals, enterprise asks |
| Dashboard feels overwhelming on first load | Low | High | Default to "Top 10 by RICE" view; let users drill down |
| RICE math feels arbitrary | Medium | Medium | Show the formula and inputs clearly; allow override |

---

## 11. Launch Plan (Demo Context)

This is a portfolio project, so "launch" means: live URL, recorded Loom walkthrough, and a polished README. The "user feedback" loop is the hiring manager reviewing it.

**v1 launch checklist:**
- Deployed to Vercel
- Mobile-responsive
- Dark/light mode working
- 75 synthetic items loaded
- Loom recorded
- README with PRD + metrics doc linked

---

*End of PRD.*
