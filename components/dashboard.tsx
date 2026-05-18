"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  Eye,
  Globe,
  Hash,
  Info,
  Inbox,
  Loader2,
  MessageCircle,
  Pencil,
  Phone,
  RotateCcw,
  SearchX,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AnalyticsCharts } from "@/components/analytics-charts";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { trackEvent, type AnalyticsEvent } from "@/lib/analytics";
import { sortByRICE } from "@/lib/data";
import type {
  CustomerSegment,
  FeedbackItem,
  FeedbackSource,
  FeedbackType,
  Sentiment,
  Theme,
} from "@/lib/types";
import {
  cn,
  formatRICEScore,
  getSegmentLabel,
  getSourceLabel,
  getThemeLabel,
  getTypeLabel,
} from "@/lib/utils";

// ─── Color maps ────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<FeedbackType, string> = {
  feature_request:
    "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  bug: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  churn_risk:
    "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  praise:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  question:
    "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
};

const THEME_COLORS: Record<Theme, string> = {
  integrations:
    "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
  performance:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  mobile_experience:
    "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20",
  collaboration:
    "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
  search_discovery:
    "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
  notifications:
    "bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border-yellow-500/20",
  pricing_billing:
    "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  onboarding:
    "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
  reporting_analytics:
    "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  ai_features:
    "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-500/20",
};

const SENTIMENT_DOT: Record<Sentiment, string> = {
  positive: "bg-emerald-500",
  negative: "bg-rose-500",
  neutral: "bg-slate-400 dark:bg-slate-500",
};

const SOURCE_ICONS: Record<FeedbackSource, LucideIcon> = {
  intercom: MessageCircle,
  slack: Hash,
  sales_call: Phone,
  twitter: Globe,
  internal: Users,
};

// ─── Static data ────────────────────────────────────────────────────────────

const ALL_THEMES: Theme[] = [
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

const ALL_SOURCES: FeedbackSource[] = [
  "intercom",
  "slack",
  "sales_call",
  "twitter",
  "internal",
];

const ALL_TYPES: FeedbackType[] = [
  "feature_request",
  "bug",
  "churn_risk",
  "praise",
  "question",
];

const ALL_SEGMENTS: CustomerSegment[] = [
  "enterprise",
  "mid_market",
  "smb",
  "startup",
];

const ALL_SENTIMENTS: Sentiment[] = ["positive", "neutral", "negative"];

// ─── Shared sub-components ─────────────────────────────────────────────────

function SimpleTooltip({
  text,
  children,
}: {
  text: string;
  children: React.ReactNode;
}) {
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded border border-border bg-popover px-2 py-1 text-[11px] text-popover-foreground shadow opacity-0 transition-opacity duration-150 group-hover/tip:opacity-100 z-50">
        {text}
      </span>
    </span>
  );
}

function EditableBadge<T extends string>({
  value,
  options,
  colorMap,
  getLabelFn,
  onChange,
}: {
  value: T;
  options: readonly T[];
  colorMap: Record<string, string>;
  getLabelFn: (v: T) => string;
  onChange: (v: T) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "group/badge inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium cursor-pointer transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            colorMap[value]
          )}
        >
          {getLabelFn(value)}
          <Pencil className="h-2 w-2 flex-shrink-0 opacity-0 transition-opacity group-hover/badge:opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt}
            onClick={() => onChange(opt)}
            className={cn(
              "text-sm",
              opt === value && "font-semibold bg-accent/50"
            )}
          >
            {getLabelFn(opt)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EditableSentiment({
  value,
  onChange,
}: {
  value: Sentiment;
  onChange: (v: Sentiment) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group/sent flex items-center gap-1.5 cursor-pointer focus:outline-none"
        >
          <div
            className={cn(
              "h-2 w-2 rounded-full transition-colors",
              SENTIMENT_DOT[value]
            )}
          />
          <span className="text-xs text-muted-foreground capitalize">
            {value}
          </span>
          <Pencil className="h-2 w-2 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/sent:opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-36">
        {ALL_SENTIMENTS.map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={() => onChange(s)}
            className={cn(
              "gap-2 text-sm capitalize",
              s === value && "font-semibold bg-accent/50"
            )}
          >
            <div
              className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                SENTIMENT_DOT[s]
              )}
            />
            {s}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FilterDropdown<T extends string>({
  label,
  options,
  selected,
  onToggle,
  getLabel,
}: {
  label: string;
  options: readonly T[];
  selected: Set<T>;
  onToggle: (v: T) => void;
  getLabel: (v: T) => string;
}) {
  const isActive = selected.size > 0;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isActive ? "secondary" : "outline"}
          size="sm"
          className={cn(
            "h-8 gap-1.5 text-xs font-medium transition-colors",
            isActive &&
              "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 dark:text-primary"
          )}
        >
          {label}
          {isActive && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground leading-none">
              {selected.size}
            </span>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {options.map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt}
            checked={selected.has(opt)}
            onCheckedChange={() => onToggle(opt)}
            className="text-sm"
          >
            {getLabel(opt)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RiceScoreCell({ score }: { score: number }) {
  if (score === 0) {
    return (
      <span className="font-mono text-sm text-muted-foreground/40">—</span>
    );
  }
  const colorClass =
    score >= 1000
      ? "text-amber-500 dark:text-amber-400"
      : score >= 500
        ? "text-blue-500 dark:text-blue-400"
        : score >= 200
          ? "text-foreground"
          : "text-muted-foreground";
  return (
    <span
      className={cn("font-mono text-sm font-semibold tabular-nums", colorClass)}
    >
      {formatRICEScore(score)}
    </span>
  );
}

function SourceCell({ source }: { source: FeedbackSource }) {
  const Icon = SOURCE_ICONS[source];
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      <span>{getSourceLabel(source)}</span>
    </div>
  );
}

function ConfidenceBadge({ level }: { level: "high" | "medium" | "low" }) {
  const config: Record<
    "high" | "medium" | "low",
    { label: string; className: string }
  > = {
    high: {
      label: "High Confidence",
      className:
        "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    },
    medium: {
      label: "Medium Confidence",
      className:
        "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    },
    low: {
      label: "Low Confidence",
      className:
        "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
    },
  };
  const { label, className } = config[level];
  return (
    <Badge variant="outline" className={cn("text-[11px] font-medium", className)}>
      {label}
    </Badge>
  );
}

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub: string;
  iconBg: string;
  iconColor: string;
  highlight?: boolean;
}

function StatsCard({
  icon: Icon,
  label,
  value,
  sub,
  iconBg,
  iconColor,
  highlight,
}: StatsCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-border/60 transition-all duration-200 hover:shadow-md hover:-translate-y-px",
        highlight &&
          "border-amber-500/30 bg-amber-500/[0.02] dark:border-amber-400/25 dark:bg-amber-400/[0.02]"
      )}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {label}
            </p>
            <p className="mt-1.5 text-2xl font-bold leading-none tracking-tight truncate">
              {value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
          </div>
          <div
            className={cn(
              "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
              iconBg
            )}
          >
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Analytics Dev Panel ────────────────────────────────────────────────────

function AnalyticsDevPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);

  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem("triage_analytics_events");
      const all: AnalyticsEvent[] = raw ? (JSON.parse(raw) as AnalyticsEvent[]) : [];
      setEvents(all.slice(-50).reverse());
    } catch {
      setEvents([]);
    }
  }, [open]);

  function clearEvents() {
    try {
      localStorage.removeItem("triage_analytics_events");
    } catch {
      // ignore
    }
    setEvents([]);
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl p-0 flex flex-col overflow-hidden"
      >
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border/60 shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base flex items-center gap-2">
              <span>📊</span>
              Analytics Dev Panel
            </SheetTitle>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={clearEvents}
            >
              Clear Events
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {events.length} event{events.length !== 1 ? "s" : ""} · Ctrl+Shift+A to toggle
          </p>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-6">
              <p className="text-sm text-muted-foreground">No events yet.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Interact with the dashboard to generate events.
              </p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-background border-b border-border/60">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground whitespace-nowrap w-[92px]">
                    Time
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground whitespace-nowrap w-[180px]">
                    Event
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">
                    Properties
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev, i) => {
                  const props = JSON.stringify(ev.properties);
                  const truncated =
                    props.length > 80 ? props.slice(0, 80) + "…" : props;
                  const time = new Date(ev.timestamp).toLocaleTimeString(
                    "en-US",
                    { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }
                  );
                  return (
                    <tr
                      key={i}
                      className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-2.5 font-mono text-muted-foreground">
                        {time}
                      </td>
                      <td className="px-4 py-2.5 font-medium">{ev.event_name}</td>
                      <td className="px-4 py-2.5 font-mono text-muted-foreground break-all">
                        {truncated}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Feedback Detail Dialog ─────────────────────────────────────────────────

type AiSnapshot = Pick<
  FeedbackItem,
  "theme" | "sentiment" | "feedback_type" | "ai_summary" | "ai_reasoning" | "ai_confidence"
>;

function FeedbackDetailDialog({
  item,
  onClose,
  onUpdateItem,
}: {
  item: FeedbackItem | null;
  onClose: () => void;
  onUpdateItem: (updated: FeedbackItem) => void;
}) {
  const [currentItem, setCurrentItem] = useState<FeedbackItem | null>(item);
  const [originalAiValues, setOriginalAiValues] = useState<AiSnapshot | null>(null);
  const [originalRice, setOriginalRice] = useState<FeedbackItem["rice"] | null>(null);
  const [sessionEdited, setSessionEdited] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingField, setEditingField] = useState<"summary" | "reasoning" | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCurrentItem(item);
    setSessionEdited(false);
    setEditingField(null);
    setDraftValue("");
    if (item) {
      setOriginalAiValues({
        theme: item.theme,
        sentiment: item.sentiment,
        feedback_type: item.feedback_type,
        ai_summary: item.ai_summary,
        ai_reasoning: item.ai_reasoning,
        ai_confidence: item.ai_confidence,
      });
      setOriginalRice({ ...item.rice });
    }
  }, [item]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function showToast(msg: string) {
    setToastMessage(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 4000);
  }

  function applyUpdate(updated: FeedbackItem) {
    setCurrentItem(updated);
    onUpdateItem(updated);
  }

  function handleBadgeChange<K extends "theme" | "sentiment" | "feedback_type">(
    field: K,
    value: FeedbackItem[K]
  ) {
    if (!currentItem) return;
    trackEvent("category_override", {
      field,
      old_value: currentItem[field] as string,
      new_value: value as string,
      item_id: currentItem.id,
    });
    const updated: FeedbackItem = { ...currentItem, [field]: value, user_edited: true };
    setSessionEdited(true);
    applyUpdate(updated);
  }

  function handleFieldSave(field: "ai_summary" | "ai_reasoning") {
    if (!currentItem) return;
    const updated: FeedbackItem = {
      ...currentItem,
      [field]: draftValue,
      user_edited: true,
    };
    setSessionEdited(true);
    applyUpdate(updated);
    setEditingField(null);
  }

  function handleRevert() {
    if (!currentItem || !originalAiValues) return;
    const reverted: FeedbackItem = { ...currentItem, ...originalAiValues, user_edited: false };
    setSessionEdited(false);
    setEditingField(null);
    applyUpdate(reverted);
  }

  function handleRiceChange(
    field: "reach" | "impact" | "confidence" | "effort",
    rawValue: string
  ) {
    if (!currentItem) return;
    const parsed = parseFloat(rawValue);
    if (isNaN(parsed) || parsed < 0) return;
    const oldValue = currentItem.rice[field];
    const newRice = { ...currentItem.rice, [field]: parsed };
    newRice.score =
      newRice.effort > 0
        ? Math.round(
            (newRice.reach * newRice.impact * newRice.confidence) / newRice.effort
          )
        : 0;
    trackEvent("rice_override", {
      field,
      old_value: oldValue,
      new_value: parsed,
      item_id: currentItem.id,
      new_rice_score: newRice.score,
    });
    setSessionEdited(true);
    applyUpdate({ ...currentItem, rice: newRice, user_edited: true });
  }

  function handleRiceReset() {
    if (!currentItem || !originalRice) return;
    applyUpdate({ ...currentItem, rice: { ...originalRice } });
  }

  async function handleReanalyze() {
    if (!currentItem) return;
    setIsAnalyzing(true);
    setEditingField(null);
    try {
      const res = await fetch("/api/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_text: currentItem.raw_text,
          customer_name: currentItem.customer_name,
          customer_segment: currentItem.customer_segment,
          source: currentItem.source,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const snap: AiSnapshot = {
        theme: data.theme,
        sentiment: data.sentiment,
        feedback_type: data.feedback_type,
        ai_summary: data.ai_summary,
        ai_reasoning: data.ai_reasoning,
        ai_confidence: data.ai_confidence,
      };
      const updated: FeedbackItem = { ...currentItem, ...snap, user_edited: false };
      setOriginalAiValues(snap);
      setSessionEdited(false);
      applyUpdate(updated);
    } catch {
      showToast("Couldn't reach AI service. Try again in a moment.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  const riceScoreColor = currentItem
    ? currentItem.rice.score >= 1000
      ? "text-amber-500 dark:text-amber-400"
      : currentItem.rice.score >= 500
        ? "text-blue-500 dark:text-blue-400"
        : currentItem.rice.score >= 200
          ? "text-foreground"
          : "text-muted-foreground"
    : "";

  const showLowConfidenceBanner =
    currentItem?.ai_confidence === "low" && !currentItem.user_edited;

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh]">
        {currentItem && (
          <>
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="px-5 sm:px-6 pt-6 pb-4 border-b border-border/60 shrink-0">
              <div className="flex items-start gap-3 pr-8">
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Editable type + theme badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <EditableBadge
                      value={currentItem.feedback_type}
                      options={ALL_TYPES}
                      colorMap={TYPE_COLORS}
                      getLabelFn={getTypeLabel}
                      onChange={(v) => handleBadgeChange("feedback_type", v)}
                    />
                    <EditableBadge
                      value={currentItem.theme}
                      options={ALL_THEMES}
                      colorMap={THEME_COLORS}
                      getLabelFn={getThemeLabel}
                      onChange={(v) => handleBadgeChange("theme", v)}
                    />
                  </div>
                  {/* Customer name */}
                  <DialogTitle className="text-lg font-bold leading-snug">
                    {currentItem.customer_name}
                  </DialogTitle>
                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    {(() => {
                      const SourceIcon = SOURCE_ICONS[currentItem.source];
                      return (
                        <Badge
                          variant="secondary"
                          className="gap-1.5 text-[11px] font-medium"
                        >
                          <SourceIcon className="h-3 w-3" />
                          {getSourceLabel(currentItem.source)}
                        </Badge>
                      );
                    })()}
                    <span className="text-xs text-muted-foreground">
                      {new Date(currentItem.created_at).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" }
                      )}
                    </span>
                    {/* Editable sentiment */}
                    <EditableSentiment
                      value={currentItem.sentiment}
                      onChange={(v) => handleBadgeChange("sentiment", v)}
                    />
                    <Badge
                      variant="outline"
                      className="text-[11px] text-muted-foreground border-border/60"
                    >
                      {getSegmentLabel(currentItem.customer_segment)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Scrollable body ──────────────────────────────────────── */}
            <div className="overflow-y-auto flex-1 min-h-0">
              {/* Raw text */}
              <div className="px-5 sm:px-6 py-5 border-b border-border/40">
                <blockquote className="border-l-[3px] border-primary/30 pl-4 py-0.5">
                  <p className="text-base italic leading-relaxed text-foreground/80">
                    &#8220;{currentItem.raw_text}&#8221;
                  </p>
                </blockquote>
              </div>

              {/* AI Analysis */}
              <div className="px-5 sm:px-6 py-5 space-y-4 border-b border-border/40">
                {/* Section header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5" />
                      AI Analysis
                    </h3>
                    {currentItem.user_edited && (
                      <Badge
                        variant="outline"
                        className="text-[11px] font-medium text-muted-foreground border-border/60 gap-1"
                      >
                        <Pencil className="h-2.5 w-2.5" />
                        Edited
                      </Badge>
                    )}
                    {sessionEdited && (
                      <button
                        type="button"
                        onClick={handleRevert}
                        className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <RotateCcw className="h-2.5 w-2.5" />
                        Revert to AI suggestion
                      </button>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isAnalyzing}
                    onClick={handleReanalyze}
                    className="h-7 gap-1.5 text-[11px] font-medium shrink-0"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    {isAnalyzing ? "Analyzing…" : "Re-analyze with AI"}
                  </Button>
                </div>

                {/* Low-confidence callout */}
                {showLowConfidenceBanner && (
                  <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 dark:border-amber-400/20 dark:bg-amber-400/[0.06] px-4 py-3">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500 dark:text-amber-400" />
                      <p className="text-xs leading-relaxed text-foreground/80">
                        This categorization has low confidence. Review the AI
                        reasoning and adjust if needed.
                      </p>
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Summary
                    </p>
                    {editingField !== "summary" && (
                      <button
                        type="button"
                        onClick={() => {
                          setDraftValue(currentItem.ai_summary);
                          setEditingField("summary");
                        }}
                        className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {editingField === "summary" ? (
                    <div className="space-y-2">
                      <Input
                        value={draftValue}
                        onChange={(e) => setDraftValue(e.target.value)}
                        className="h-9 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleFieldSave("ai_summary");
                          if (e.key === "Escape") setEditingField(null);
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleFieldSave("ai_summary")}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => setEditingField(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{currentItem.ai_summary}</p>
                  )}
                </div>

                {/* Reasoning */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Reasoning
                    </p>
                    {editingField !== "reasoning" && (
                      <button
                        type="button"
                        onClick={() => {
                          setDraftValue(currentItem.ai_reasoning);
                          setEditingField("reasoning");
                        }}
                        className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  <div className="rounded-lg border border-blue-500/25 bg-blue-500/5 dark:border-blue-400/20 dark:bg-blue-400/[0.06] p-4">
                    {editingField === "reasoning" ? (
                      <div className="space-y-2">
                        <textarea
                          value={draftValue}
                          onChange={(e) => setDraftValue(e.target.value)}
                          rows={4}
                          autoFocus
                          className="flex w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          onKeyDown={(e) => {
                            if (e.key === "Escape") setEditingField(null);
                          }}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleFieldSave("ai_reasoning")}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => setEditingField(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500 dark:text-blue-400" />
                        <p className="text-sm leading-relaxed text-foreground/85">
                          {currentItem.ai_reasoning}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Confidence */}
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    AI Confidence
                  </span>
                  <ConfidenceBadge level={currentItem.ai_confidence} />
                </div>
              </div>

              {/* RICE Breakdown */}
              <div className="px-5 sm:px-6 py-5">
                <h3 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  <BarChart3 className="h-3.5 w-3.5" />
                  RICE Breakdown
                </h3>
                <div className="overflow-hidden rounded-lg border border-border/60">
                  <table className="w-full text-sm">
                    <tbody>
                      {/* Reach */}
                      <tr className="border-b border-border/40">
                        <td className="w-28 whitespace-nowrap px-4 py-2.5 font-medium text-muted-foreground">
                          Reach
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={1}
                              max={10}
                              step={1}
                              value={currentItem.rice.reach}
                              onChange={(e) => handleRiceChange("reach", e.target.value)}
                              className="w-10 bg-transparent border-b border-transparent font-mono font-semibold tabular-nums text-sm focus:border-primary focus:outline-none hover:border-border/60 transition-colors text-foreground"
                            />
                            <span className="text-xs text-muted-foreground font-mono">/ 10</span>
                          </div>
                        </td>
                        <td className="hidden px-4 py-2.5 text-xs text-muted-foreground sm:table-cell">
                          users affected per quarter
                        </td>
                      </tr>
                      {/* Impact */}
                      <tr className="border-b border-border/40">
                        <td className="w-28 whitespace-nowrap px-4 py-2.5 font-medium text-muted-foreground">
                          Impact
                        </td>
                        <td className="px-4 py-2.5">
                          <Select
                            value={String(currentItem.rice.impact)}
                            onValueChange={(v) => handleRiceChange("impact", v)}
                          >
                            <SelectTrigger className="h-auto w-auto min-w-0 rounded-none border-0 border-b border-transparent bg-transparent px-0 py-0 font-mono font-semibold text-sm text-foreground hover:border-border/60 focus:ring-0 focus:border-primary transition-colors gap-1 [&>span]:line-clamp-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[0.25, 0.5, 1, 2, 3].map((v) => (
                                <SelectItem key={v} value={String(v)}>
                                  {v}×
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="hidden px-4 py-2.5 text-xs text-muted-foreground sm:table-cell">
                          0.25 → 3.0 scale
                        </td>
                      </tr>
                      {/* Confidence */}
                      <tr className="border-b border-border/40">
                        <td className="w-28 whitespace-nowrap px-4 py-2.5 font-medium text-muted-foreground">
                          Confidence
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-0.5">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={5}
                              value={currentItem.rice.confidence}
                              onChange={(e) => handleRiceChange("confidence", e.target.value)}
                              className="w-12 bg-transparent border-b border-transparent font-mono font-semibold tabular-nums text-sm focus:border-primary focus:outline-none hover:border-border/60 transition-colors text-foreground"
                            />
                            <span className="text-xs text-muted-foreground font-mono">%</span>
                          </div>
                        </td>
                        <td className="hidden px-4 py-2.5 text-xs text-muted-foreground sm:table-cell">
                          certainty of estimates
                        </td>
                      </tr>
                      {/* Effort */}
                      <tr>
                        <td className="w-28 whitespace-nowrap px-4 py-2.5 font-medium text-muted-foreground">
                          Effort
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0.5}
                              step={0.5}
                              value={currentItem.rice.effort || ""}
                              onChange={(e) => handleRiceChange("effort", e.target.value)}
                              className="w-12 bg-transparent border-b border-transparent font-mono font-semibold tabular-nums text-sm focus:border-primary focus:outline-none hover:border-border/60 transition-colors text-foreground"
                            />
                            <span className="text-xs text-muted-foreground">wk</span>
                          </div>
                        </td>
                        <td className="hidden px-4 py-2.5 text-xs text-muted-foreground sm:table-cell">
                          person-weeks to build
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="flex items-center justify-between border-t border-border/60 bg-muted/40 px-4 py-3.5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Final RICE Score
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                        (Reach × Impact × Confidence) ÷ Effort
                      </p>
                    </div>
                    <span
                      className={cn(
                        "font-mono text-3xl font-bold tabular-nums transition-colors duration-150",
                        riceScoreColor
                      )}
                    >
                      {currentItem.rice.score === 0
                        ? "—"
                        : formatRICEScore(currentItem.rice.score)}
                    </span>
                  </div>
                </div>
                {/* Reset RICE */}
                <button
                  type="button"
                  onClick={handleRiceReset}
                  className="mt-2.5 flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  <RotateCcw className="h-2.5 w-2.5" />
                  Reset RICE to AI suggestion
                </button>
              </div>
            </div>

            {/* ── Footer ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-end border-t border-border/60 bg-muted/20 px-5 py-4 sm:px-6 shrink-0">
              <DialogClose asChild>
                <Button size="sm">Close</Button>
              </DialogClose>
            </div>

            {/* ── Toast ────────────────────────────────────────────────── */}
            {toastMessage && (
              <div className="absolute bottom-16 left-1/2 z-50 -translate-x-1/2 pointer-events-none">
                <div className="animate-in fade-in slide-in-from-bottom-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-lg duration-200">
                  {toastMessage}
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── About Dialog ───────────────────────────────────────────────────────────

function AboutDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <DialogTitle className="text-lg">About Triage</DialogTitle>
          </div>
          <DialogDescription>
            AI-powered feedback triage for early-stage SaaS product teams.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Triage ingests raw user feedback from multiple sources,
            auto-categorizes it by theme and sentiment using Claude AI, and
            surfaces a RICE-scored priority list — turning hours of manual
            sorting into minutes of decision-making.
          </p>

          <div className="space-y-3">
            <a
              href="/docs/PRD.md"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium text-primary hover:underline underline-offset-4 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              Read the Product Requirements Doc
            </a>

            <div className="pt-1">
              <Badge variant="secondary" className="gap-1.5 text-xs py-1">
                <Sparkles className="h-3 w-3" />
                Built with Claude Code
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────

interface DashboardProps {
  items: FeedbackItem[];
}

export function Dashboard({ items: initialItems }: DashboardProps) {
  const [items, setItems] = useState<FeedbackItem[]>(initialItems);
  const [selectedThemes, setSelectedThemes] = useState<Set<Theme>>(new Set());
  const [selectedSources, setSelectedSources] = useState<Set<FeedbackSource>>(
    new Set()
  );
  const [selectedTypes, setSelectedTypes] = useState<Set<FeedbackType>>(
    new Set()
  );
  const [selectedSegments, setSelectedSegments] = useState<Set<CustomerSegment>>(
    new Set()
  );
  const [needsReview, setNeedsReview] = useState(false);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [showAbout, setShowAbout] = useState(false);
  const [devPanelOpen, setDevPanelOpen] = useState(false);
  const [exportToast, setExportToast] = useState<string | null>(null);
  const exportToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionStartTime = useRef<number>(Date.now());

  // Only update items array — dialog manages its own state via currentItem
  function handleUpdateItem(updated: FeedbackItem) {
    setItems((prev) =>
      prev.map((it) => (it.id === updated.id ? updated : it))
    );
  }

  useEffect(() => {
    sessionStartTime.current = Date.now();
    trackEvent("session_started");

    const handleBeforeUnload = () => {
      const duration = Math.round((Date.now() - sessionStartTime.current) / 1000);
      trackEvent("session_ended", { duration_seconds: duration });
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "A") {
        e.preventDefault();
        setDevPanelOpen((v) => !v);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("keydown", handleKeyDown);
      if (exportToastTimer.current) clearTimeout(exportToastTimer.current);
    };
  }, []);

  function openDetail(item: FeedbackItem) {
    trackEvent("detail_dialog_opened", { item_id: item.id });
    trackEvent("feedback_item_viewed", {
      item_id: item.id,
      theme: item.theme,
      ai_confidence: item.ai_confidence,
    });
    setSelectedItem(item);
  }

  function handleExportRoadmap() {
    const headers = [
      "id", "theme", "type", "sentiment",
      "customer_name", "customer_segment", "rice_score", "raw_text",
    ];
    function q(val: string | number): string {
      if (typeof val === "number") return String(val);
      return `"${String(val).replace(/"/g, '""')}"`;
    }
    const rows = visibleItems.map((item) =>
      [
        q(item.id),
        q(item.theme),
        q(item.feedback_type),
        q(item.sentiment),
        q(item.customer_name),
        q(item.customer_segment),
        q(item.rice.score),
        q(item.raw_text),
      ].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    navigator.clipboard.writeText(csv).then(() => {
      trackEvent("roadmap_exported", { item_count: visibleItems.length });
      setExportToast("Roadmap copied to clipboard ✓");
      if (exportToastTimer.current) clearTimeout(exportToastTimer.current);
      exportToastTimer.current = setTimeout(() => setExportToast(null), 3000);
    }).catch(() => {
      setExportToast("Export failed — clipboard access denied");
      if (exportToastTimer.current) clearTimeout(exportToastTimer.current);
      exportToastTimer.current = setTimeout(() => setExportToast(null), 3000);
    });
  }

  const stats = useMemo(() => {
    const total = items.length;
    const avgRice = Math.round(
      items.reduce((sum, i) => sum + i.rice.score, 0) / total
    );
    const churnCount = items.filter(
      (i) => i.feedback_type === "churn_risk"
    ).length;
    const needsReviewCount = items.filter(
      (i) => i.ai_confidence === "low" && !i.user_edited
    ).length;
    return { total, avgRice, churnCount, needsReviewCount };
  }, [items]);

  const visibleItems = useMemo(() => {
    let result = items;
    if (selectedThemes.size > 0)
      result = result.filter((i) => selectedThemes.has(i.theme));
    if (selectedSources.size > 0)
      result = result.filter((i) => selectedSources.has(i.source));
    if (selectedTypes.size > 0)
      result = result.filter((i) => selectedTypes.has(i.feedback_type));
    if (selectedSegments.size > 0)
      result = result.filter((i) => selectedSegments.has(i.customer_segment));
    if (needsReview)
      result = result.filter(
        (i) => i.ai_confidence === "low" && !i.user_edited
      );
    return sortByRICE(result, sortDir);
  }, [
    items,
    selectedThemes,
    selectedSources,
    selectedTypes,
    selectedSegments,
    needsReview,
    sortDir,
  ]);

  const activeFilterCount =
    selectedThemes.size +
    selectedSources.size +
    selectedTypes.size +
    selectedSegments.size +
    (needsReview ? 1 : 0);

  function clearFilters() {
    setSelectedThemes(new Set());
    setSelectedSources(new Set());
    setSelectedTypes(new Set());
    setSelectedSegments(new Set());
    setNeedsReview(false);
  }

  function toggleTheme(v: Theme) {
    trackEvent("filter_applied", { filter_type: "theme", filter_value: v });
    setSelectedThemes((prev) => {
      const n = new Set(prev);
      if (n.has(v)) { n.delete(v); } else { n.add(v); }
      return n;
    });
  }
  function toggleSource(v: FeedbackSource) {
    trackEvent("filter_applied", { filter_type: "source", filter_value: v });
    setSelectedSources((prev) => {
      const n = new Set(prev);
      if (n.has(v)) { n.delete(v); } else { n.add(v); }
      return n;
    });
  }
  function toggleType(v: FeedbackType) {
    trackEvent("filter_applied", { filter_type: "type", filter_value: v });
    setSelectedTypes((prev) => {
      const n = new Set(prev);
      if (n.has(v)) { n.delete(v); } else { n.add(v); }
      return n;
    });
  }
  function toggleSegment(v: CustomerSegment) {
    trackEvent("filter_applied", { filter_type: "segment", filter_value: v });
    setSelectedSegments((prev) => {
      const n = new Set(prev);
      if (n.has(v)) { n.delete(v); } else { n.add(v); }
      return n;
    });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-bold tracking-tight">Triage</span>
              <span className="hidden text-[11px] text-muted-foreground sm:block">
                AI-powered feedback triage for product teams
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground h-8 px-2.5 sm:px-3"
              onClick={() => setShowAbout(true)}
            >
              About
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs font-medium"
              onClick={handleExportRoadmap}
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export Roadmap</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-screen-xl flex-1 space-y-6 px-4 sm:px-6 py-6">
        {/* ── Stats row ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 animate-fade-in">
          <StatsCard
            icon={Inbox}
            label="Total Feedback"
            value={stats.total}
            sub="items this week"
            iconBg="bg-blue-500/10"
            iconColor="text-blue-500"
          />
          <StatsCard
            icon={BarChart3}
            label="Avg RICE Score"
            value={stats.avgRice.toLocaleString()}
            sub="across all items"
            iconBg="bg-amber-500/10"
            iconColor="text-amber-500"
          />
          <StatsCard
            icon={AlertTriangle}
            label="Churn Risks"
            value={stats.churnCount}
            sub="need immediate action"
            iconBg="bg-rose-500/10"
            iconColor="text-rose-500"
          />
          <StatsCard
            icon={AlertCircle}
            label="Needs Review"
            value={stats.needsReviewCount}
            sub="low confidence, unreviewed"
            iconBg="bg-amber-500/10"
            iconColor="text-amber-500"
            highlight
          />
        </div>

        {/* ── Analytics section ──────────────────────────────────────────── */}
        <div className="space-y-3 animate-fade-in-delay-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-semibold">Analytics</h2>
              {activeFilterCount > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  · Charts reflect current filters
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowAnalytics((v) => !v)}
            >
              {showAnalytics ? "Hide" : "Show"} Analytics
              <ChevronUp
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  !showAnalytics && "rotate-180"
                )}
              />
            </Button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateRows: showAnalytics ? "1fr" : "0fr",
              transition:
                "grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <div className="overflow-hidden">
              <AnalyticsCharts items={visibleItems} />
            </div>
          </div>
        </div>

        {/* ── Roadmap card ──────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border/60 bg-card shadow-sm animate-fade-in-delay-2">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-3 sm:px-4 py-3">
            <FilterDropdown
              label="Theme"
              options={ALL_THEMES}
              selected={selectedThemes}
              onToggle={toggleTheme}
              getLabel={getThemeLabel}
            />
            <FilterDropdown
              label="Source"
              options={ALL_SOURCES}
              selected={selectedSources}
              onToggle={toggleSource}
              getLabel={getSourceLabel}
            />
            <FilterDropdown
              label="Type"
              options={ALL_TYPES}
              selected={selectedTypes}
              onToggle={toggleType}
              getLabel={getTypeLabel}
            />
            <FilterDropdown
              label="Segment"
              options={ALL_SEGMENTS}
              selected={selectedSegments}
              onToggle={toggleSegment}
              getLabel={getSegmentLabel}
            />

            {/* Needs Review toggle */}
            <Button
              variant={needsReview ? "secondary" : "outline"}
              size="sm"
              className={cn(
                "h-8 gap-1.5 text-xs font-medium transition-colors",
                needsReview &&
                  "border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400"
              )}
              onClick={() => {
                trackEvent("filter_applied", {
                  filter_type: "needs_review",
                  filter_value: !needsReview,
                });
                setNeedsReview((v) => !v);
              }}
            >
              <AlertCircle className="h-3 w-3" />
              Needs Review
            </Button>

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={clearFilters}
              >
                <X className="h-3 w-3" />
                Clear all ({activeFilterCount})
              </Button>
            )}

            <p className="ml-auto text-xs text-muted-foreground tabular-nums">
              {activeFilterCount > 0
                ? `${visibleItems.length} of ${items.length} items`
                : `${items.length} items`}
            </p>
          </div>

          {/* Table or empty state */}
          {visibleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <SearchX className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-semibold">No feedback found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your filters to see more results.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={clearFilters}
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <>
              {/* ── Desktop table (md+) ────────────────────────────────── */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/60">
                      <TableHead
                        className="w-[88px] cursor-pointer select-none whitespace-nowrap pl-4 font-semibold text-foreground transition-colors hover:text-primary"
                        onClick={() =>
                          setSortDir((d) => (d === "desc" ? "asc" : "desc"))
                        }
                      >
                        <div className="flex items-center gap-1">
                          RICE
                          {sortDir === "desc" ? (
                            <ChevronDown className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <ChevronUp className="h-3.5 w-3.5 text-primary" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-[140px] font-semibold text-foreground">
                        Type
                      </TableHead>
                      <TableHead className="w-[160px] font-semibold text-foreground">
                        Theme
                      </TableHead>
                      <TableHead className="w-[120px] font-semibold text-foreground">
                        Source
                      </TableHead>
                      <TableHead className="w-[108px] font-semibold text-foreground">
                        Segment
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        Summary
                      </TableHead>
                      <TableHead className="w-[100px] font-semibold text-foreground">
                        Sentiment
                      </TableHead>
                      <TableHead className="w-[72px] pr-4" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleItems.map((item) => (
                      <TableRow
                        key={item.id}
                        className="group cursor-pointer border-b border-border/40 transition-colors hover:bg-muted/40 focus-within:bg-muted/40 outline-none"
                        onClick={() => openDetail(item)}
                        tabIndex={0}
                        onKeyDown={(e) =>
                          e.key === "Enter" && openDetail(item)
                        }
                      >
                        <TableCell className="pl-4">
                          <RiceScoreCell score={item.rice.score} />
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "whitespace-nowrap text-[11px] font-medium",
                              TYPE_COLORS[item.feedback_type]
                            )}
                          >
                            {getTypeLabel(item.feedback_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "whitespace-nowrap text-[11px] font-medium",
                              THEME_COLORS[item.theme]
                            )}
                          >
                            {getThemeLabel(item.theme)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <SourceCell source={item.source} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {getSegmentLabel(item.customer_segment)}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="flex items-center gap-1.5">
                            {item.ai_confidence === "low" && (
                              <SimpleTooltip text="Low confidence — review recommended">
                                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-amber-500 dark:text-amber-400" />
                              </SimpleTooltip>
                            )}
                            <p className="truncate text-sm text-foreground/80">
                              {item.ai_summary.length > 80
                                ? item.ai_summary.slice(0, 80) + "…"
                                : item.ai_summary}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "h-2 w-2 flex-shrink-0 rounded-full",
                                SENTIMENT_DOT[item.sentiment]
                              )}
                            />
                            <span className="text-xs capitalize text-muted-foreground">
                              {item.sentiment}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="pr-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 px-2 text-[11px] opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetail(item);
                            }}
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* ── Mobile card list (< md) ────────────────────────────── */}
              <div className="md:hidden divide-y divide-border/40">
                {visibleItems.map((item) => (
                  <button
                    key={item.id}
                    className="w-full text-left p-4 hover:bg-muted/40 focus:bg-muted/40 focus:outline-none active:bg-muted/60 transition-colors"
                    onClick={() => openDetail(item)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Type + Theme badges */}
                        <div className="flex flex-wrap gap-1.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-medium",
                              TYPE_COLORS[item.feedback_type]
                            )}
                          >
                            {getTypeLabel(item.feedback_type)}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-medium",
                              THEME_COLORS[item.theme]
                            )}
                          >
                            {getThemeLabel(item.theme)}
                          </Badge>
                        </div>
                        {/* Summary with low-confidence indicator */}
                        <div className="flex items-start gap-1.5">
                          {item.ai_confidence === "low" && (
                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500 dark:text-amber-400" />
                          )}
                          <p className="text-sm font-medium leading-snug line-clamp-2">
                            {item.ai_summary}
                          </p>
                        </div>
                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <SourceCell source={item.source} />
                          <div className="flex items-center gap-1.5">
                            <div
                              className={cn(
                                "h-2 w-2 rounded-full",
                                SENTIMENT_DOT[item.sentiment]
                              )}
                            />
                            <span className="text-xs capitalize text-muted-foreground">
                              {item.sentiment}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {getSegmentLabel(item.customer_segment)}
                          </span>
                        </div>
                      </div>
                      {/* RICE score */}
                      <div className="flex flex-col items-end gap-0.5 shrink-0 pt-1">
                        <RiceScoreCell score={item.rice.score} />
                        <span className="text-[10px] text-muted-foreground/60 font-mono">
                          RICE
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 py-5 mt-2">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
          <p className="text-center text-xs text-muted-foreground/70">
            Built by{" "}
            <span className="font-medium text-foreground/60">
              Rishik Pulipaka
            </span>{" "}
            &bull;{" "}
            Built with{" "}
            <span className="font-medium text-foreground/60">Claude Code</span>
          </p>
        </div>
      </footer>

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}
      <FeedbackDetailDialog
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onUpdateItem={handleUpdateItem}
      />
      <AboutDialog open={showAbout} onClose={() => setShowAbout(false)} />
      <AnalyticsDevPanel
        open={devPanelOpen}
        onClose={() => setDevPanelOpen(false)}
      />

      {/* Export toast */}
      {exportToast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 pointer-events-none">
          <div className="animate-in fade-in slide-in-from-bottom-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-lg duration-200">
            {exportToast}
          </div>
        </div>
      )}
    </div>
  );
}
