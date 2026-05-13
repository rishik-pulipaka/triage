"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSourceLabel, getThemeLabel } from "@/lib/utils";
import type { FeedbackItem, FeedbackSource, Theme } from "@/lib/types";

// ─── Color constants ───────────────────────────────────────────────────────

const BAR_ACCENT = "#3b82f6";

const SOURCE_COLORS: Record<FeedbackSource, string> = {
  intercom:   "#3b82f6",
  slack:      "#8b5cf6",
  sales_call: "#06b6d4",
  twitter:    "#f59e0b",
  internal:   "#10b981",
};

const SENTIMENT_COLORS = {
  positive: "#10b981",
  neutral:  "#94a3b8",
  negative: "#f43f5e",
} as const;

// ─── Ordered lists ─────────────────────────────────────────────────────────

const ALL_THEMES: Theme[] = [
  "integrations", "performance", "mobile_experience", "collaboration",
  "search_discovery", "notifications", "pricing_billing", "onboarding",
  "reporting_analytics", "ai_features",
];

const ALL_SOURCES: FeedbackSource[] = [
  "intercom", "slack", "sales_call", "twitter", "internal",
];

// ─── Recharts payload types ────────────────────────────────────────────────
// Named differently from recharts internals to avoid conflicts.

type ChartDatum = { name: string; count: number; pct?: number };

type ChartTooltipItem = {
  payload?: ChartDatum;
};

type ChartLegendEntry = {
  value?: string;
  color?: string;
  payload?: object;
};

// ─── Custom tooltips ───────────────────────────────────────────────────────
// recharts renders these as standard DOM nodes → Tailwind classes work fine

function ThemeTooltip({ active, payload }: { active?: boolean; payload?: readonly ChartTooltipItem[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (!d) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md">
      <p className="text-[11px] font-semibold text-card-foreground">{d.name}</p>
      <p className="mt-0.5 text-sm font-bold text-card-foreground">
        {d.count}
        <span className="ml-1 text-xs font-normal text-muted-foreground">
          items
        </span>
      </p>
    </div>
  );
}

function SourceTooltip({ active, payload }: { active?: boolean; payload?: readonly ChartTooltipItem[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (!d) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md">
      <p className="text-[11px] font-semibold text-card-foreground">{d.name}</p>
      <p className="mt-0.5 text-sm font-bold text-card-foreground">
        {d.count}
        <span className="ml-1 text-xs font-normal text-muted-foreground">
          items · {d.pct}%
        </span>
      </p>
    </div>
  );
}

function SentimentTooltip({ active, payload }: { active?: boolean; payload?: readonly ChartTooltipItem[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (!d) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md">
      <p className="text-[11px] font-semibold text-card-foreground">{d.name}</p>
      <p className="mt-0.5 text-sm font-bold text-card-foreground">
        {d.count}
        <span className="ml-1 text-xs font-normal text-muted-foreground">
          items · {d.pct}%
        </span>
      </p>
    </div>
  );
}

// ─── Custom donut legend ───────────────────────────────────────────────────

function DonutLegend({ payload }: { payload?: readonly ChartLegendEntry[] }) {
  if (!payload?.length) return null;
  return (
    <div className="flex flex-col justify-center gap-2.5 pl-2">
      {payload.map((entry: ChartLegendEntry, i: number) => (
        <div key={entry.value ?? i} className="flex items-center gap-2">
          <div
            className="h-2 w-2 flex-shrink-0 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="flex-1 text-[11px] leading-none text-muted-foreground">
            {entry.value}
          </span>
          <span className="tabular-nums text-[11px] font-semibold text-foreground">
            {(entry.payload as { count?: number } | undefined)?.count}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Empty placeholder ─────────────────────────────────────────────────────

function EmptyChart({ height = 260 }: { height?: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-muted-foreground/40"
      style={{ height }}
    >
      <svg
        className="mb-2 h-8 w-8"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="3" y="12" width="4" height="8" rx="1" />
        <rect x="10" y="7" width="4" height="13" rx="1" />
        <rect x="17" y="3" width="4" height="17" rx="1" />
      </svg>
      <p className="text-xs">No data for current filters</p>
    </div>
  );
}

// ─── Loading skeleton ──────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Card key={i} className="border-border/60">
          <CardHeader className="px-4 pb-1 pt-4">
            <div className="h-4 w-36 animate-pulse rounded bg-muted" />
            <div className="mt-1.5 h-3 w-48 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="h-[260px] animate-pulse rounded-lg bg-muted/40" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export function AnalyticsCharts({ items }: { items: FeedbackItem[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // SVG-compatible colors that adapt to the active theme
  const mutedColor = isDark ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.42)";
  const gridColor  = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const cursorFill = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";

  const { themeData, sourceData, sentimentData } = useMemo(() => {
    const total = items.length;

    // Only include themes with at least 1 item, sorted descending
    const themeData = ALL_THEMES
      .map((theme) => ({
        name: getThemeLabel(theme),
        theme,
        count: items.filter((i) => i.theme === theme).length,
      }))
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count);

    // Only include sources with at least 1 item
    const sourceData = ALL_SOURCES.map((source) => {
      const count = items.filter((i) => i.source === source).length;
      return {
        name: getSourceLabel(source),
        source,
        count,
        value: count,   // Pie uses 'value' by default
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    }).filter((d) => d.count > 0);

    const pos  = items.filter((i) => i.sentiment === "positive").length;
    const neut = items.filter((i) => i.sentiment === "neutral").length;
    const neg  = items.filter((i) => i.sentiment === "negative").length;

    const sentimentData = [
      { name: "Positive", sentiment: "positive" as const, count: pos,  pct: total > 0 ? Math.round((pos  / total) * 100) : 0 },
      { name: "Neutral",  sentiment: "neutral"  as const, count: neut, pct: total > 0 ? Math.round((neut / total) * 100) : 0 },
      { name: "Negative", sentiment: "negative" as const, count: neg,  pct: total > 0 ? Math.round((neg  / total) * 100) : 0 },
    ];

    return { themeData, sourceData, sentimentData };
  }, [items]);

  if (!mounted) return <ChartSkeleton />;

  const CHART_HEIGHT = 260;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

      {/* ── 1. Feedback by Theme — horizontal bar ─────────────────── */}
      <Card className="border-border/60">
        <CardHeader className="px-4 pb-1 pt-4">
          <CardTitle className="text-sm font-semibold">Feedback by Theme</CardTitle>
          <CardDescription className="text-xs">Volume sorted by most frequent</CardDescription>
        </CardHeader>
        <CardContent className="px-1 pb-3 pt-1">
          {themeData.length === 0 ? (
            <EmptyChart height={CHART_HEIGHT} />
          ) : (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <BarChart
                data={themeData}
                layout="vertical"
                margin={{ top: 4, right: 20, left: 0, bottom: 4 }}
              >
                <CartesianGrid
                  horizontal={false}
                  strokeDasharray="3 3"
                  stroke={gridColor}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: mutedColor }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={136}
                  tick={{ fontSize: 11, fill: mutedColor }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={(p) => <ThemeTooltip active={p.active} payload={p.payload} />}
                  cursor={{ fill: cursorFill }}
                />
                <Bar
                  dataKey="count"
                  fill={BAR_ACCENT}
                  radius={[0, 4, 4, 0]}
                  maxBarSize={18}
                  animationBegin={0}
                  animationDuration={500}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── 2. Feedback by Source — donut ─────────────────────────── */}
      <Card className="border-border/60">
        <CardHeader className="px-4 pb-1 pt-4">
          <CardTitle className="text-sm font-semibold">Feedback by Source</CardTitle>
          <CardDescription className="text-xs">Distribution across channels</CardDescription>
        </CardHeader>
        <CardContent className="px-1 pb-3 pt-1">
          {sourceData.length === 0 ? (
            <EmptyChart height={CHART_HEIGHT} />
          ) : (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="38%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={500}
                >
                  {sourceData.map((entry) => (
                    <Cell
                      key={entry.source}
                      fill={SOURCE_COLORS[entry.source as FeedbackSource]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={(p) => <SourceTooltip active={p.active} payload={p.payload} />}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconSize={0}
                  content={(p) => <DonutLegend payload={p.payload} />}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── 3. Sentiment Distribution — vertical bars ─────────────── */}
      <Card className="border-border/60">
        <CardHeader className="px-4 pb-1 pt-4">
          <CardTitle className="text-sm font-semibold">Sentiment Distribution</CardTitle>
          <CardDescription className="text-xs">Breakdown by customer tone</CardDescription>
        </CardHeader>
        <CardContent className="px-1 pb-3 pt-1">
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart
              data={sentimentData}
              margin={{ top: 28, right: 20, left: -16, bottom: 4 }}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke={gridColor}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: mutedColor }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: mutedColor }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={(p) => <SentimentTooltip active={p.active} payload={p.payload} />}
                cursor={{ fill: cursorFill }}
              />
              <Bar
                dataKey="count"
                radius={[4, 4, 0, 0]}
                maxBarSize={72}
                animationBegin={0}
                animationDuration={500}
              >
                {sentimentData.map((entry) => (
                  <Cell
                    key={entry.sentiment}
                    fill={SENTIMENT_COLORS[entry.sentiment]}
                  />
                ))}
                <LabelList
                  dataKey="pct"
                  position="top"
                  formatter={(v: unknown) =>
                    typeof v === "number" && v > 0 ? `${v}%` : ""
                  }
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    fill: mutedColor,
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

    </div>
  );
}
