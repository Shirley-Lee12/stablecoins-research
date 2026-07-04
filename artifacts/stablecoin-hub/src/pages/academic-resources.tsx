import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import { SOURCE_TYPES, sourceTypeLabel, type SourceType } from "@/lib/source-types";
import {
  Search, ExternalLink, FileText, BookOpen, Newspaper,
  Tag, Users, ChevronRight, Loader2, Plus, X, Upload, AlertCircle,
  Check, Clock, XCircle, Pencil, List, LayoutGrid, Sparkles,
  Presentation, GraduationCap, ScrollText, Landmark,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
// docs/planning/15 §0.9 — replaces the old pending/approved/rejected/needs_review/failed set. The
// four self-service states (incomplete/disputed/off_topic/duplicate) only ever appear to their own
// submitter (never in the public list or the admin queue) — see docs/planning/15 §2.1 for the
// eventual My Contributions page; this file only wires the minimum needed to keep existing behavior
// (public list, admin approve/reject queue) correct against the new enum for now.
// docs/planning/19 §19.3 — 'withdrawn' added as an 8th value: the submitter's own explicit "yes,
// this is a duplicate" action on a 'duplicate' row. Deliberately NOT in SELF_SERVICE_STATUSES — it's
// a closed/terminal state (no Edit & Resubmit affordance), unlike the four that still need action.
export type ResourceStatus = "incomplete" | "disputed" | "off_topic" | "duplicate" | "pending" | "approved" | "rejected" | "withdrawn";
export const SELF_SERVICE_STATUSES: ResourceStatus[] = ["incomplete", "disputed", "off_topic", "duplicate"];
export const SELF_SERVICE_LABELS: Record<string, { zh: string; en: string }> = {
  incomplete: { zh: "待补充", en: "Incomplete" },
  disputed: { zh: "待核实", en: "Disputed" },
  off_topic: { zh: "与稳定币无关", en: "Off-topic" },
  duplicate: { zh: "疑似重复", en: "Possible duplicate" },
  withdrawn: { zh: "已撤回", en: "Withdrawn" },
};
// docs/planning/19 §19.2 — labels for missingSixElements()'s field keys, so an 'incomplete'
// resource can list exactly which fields still need filling in instead of just showing the badge.
export const MISSING_FIELD_LABELS: Record<string, { zh: string; en: string }> = {
  title: { zh: "标题", en: "Title" },
  authors: { zh: "作者", en: "Authors" },
  year: { zh: "年份", en: "Year" },
  abstract: { zh: "摘要", en: "Abstract" },
  url_doi: { zh: "URL 或 DOI", en: "URL or DOI" },
  keywords: { zh: "关键词", en: "Keywords" },
};
type FilterType = SourceType | "Expert" | "All";

// docs/planning/15 §5.2 — mirrors lib/db's KeywordsSource (frontend has no direct DB import, same
// hand-mirrored pattern as TagSummary below).
export type KeywordsSource = "extracted" | "generated" | "manual";

export interface Resource {
  id: number;
  title: string;
  authors: string[];
  sourceType: SourceType;
  url: string | null;
  doi: string | null;
  abstract: string | null;
  /** Structured theme/jurisdiction/asset tags (tags/resource_tags). Declared with `TagSummary` further down (shared with the Upload Center). */
  facetedTags?: TagSummary[];
  /** docs/planning/15 §5.2 — the document's own keywords, free text, distinct from the controlled `tags`/`facetedTags`. */
  keywords: string[];
  keywordsSource: KeywordsSource | null;
  publishedDate: string | null;
  status: ResourceStatus;
  createdBy: number | null;
  createdAt: string;
  rejectionReasonId: number | null;
  rejectionNote: string | null;
  reviewedAt: string | null;
  /** docs/planning/19 §19.2 — computed fresh on every GET, not a stored column; lets My Contributions show *which* six-elements fields are missing for an 'incomplete' resource. */
  missingFields?: string[];
  /** docs/planning/16 §16.1 — cached field-by-field check, reused by 19.2's disputed-reason display. */
  verificationReport?: VerifyReport | null;
  /** docs/planning/19 §19.2 — cached natural-language explanation, generated once when off_topic is first determined. */
  offTopicExplanation?: string | null;
  /** docs/planning/19 §19.3 — the submitter's own explanation when confirming a duplicate-flagged resource isn't actually one. */
  duplicateNote?: string | null;
}

export interface RejectionReason {
  id: number;
  slug: string;
  nameZh: string;
  nameEn: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
export const SOURCE_TYPE_ICONS: Record<SourceType, React.ElementType> = {
  journal_article: FileText,
  working_paper: BookOpen,
  conference_paper: Presentation,
  thesis: GraduationCap,
  report: ScrollText,
  gov_document: Landmark,
  news: Newspaper,
};

export const SOURCE_TYPE_COLORS: Record<SourceType, string> = {
  journal_article: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  working_paper: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800",
  conference_paper: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
  thesis: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
  report: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  gov_document: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
  news: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
};

const FILTER_TYPES: { value: FilterType; labelEn: string; labelZh: string; icon: React.ElementType }[] = [
  { value: "All", labelEn: "All Types", labelZh: "全部类型", icon: BookOpen },
  ...SOURCE_TYPES.map((t) => ({ value: t.value, labelEn: t.nameEn, labelZh: t.nameZh, icon: SOURCE_TYPE_ICONS[t.value] })),
  { value: "Expert", labelEn: "Experts & Scholars", labelZh: "专家学者", icon: Users },
];

const BADGE_COLORS = SOURCE_TYPE_COLORS;
const BADGE_ICONS = SOURCE_TYPE_ICONS;

export function apiBase() {
  return (import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL).replace(/\/$/, "");
}

// ── Resource Card ─────────────────────────────────────────────────────────────
// Minimal by design (docs/planning/15 §6.1) — only title/authors/year/one primary tag. Only ever
// rendered for status='approved' resources (the public Resources list, per §0.1's "approved is the
// only status that appears publicly" rule), so there's no status badge, edit, or approve/reject
// affordance here; those belong to My Contributions and /admin (AdminCenter) respectively. The
// direct-link button and the full tag set live on the detail page instead (§6.2/§6.3).
function ResourceCard({ r, language, onOpenDetail }: {
  r: Resource; language: string;
  onOpenDetail?: (r: Resource) => void;
}) {
  const zh = language === "zh";
  // Prefer the document's own publication year; fall back to when it was added to this library.
  const year = r.publishedDate?.match(/^\d{4}/)?.[0]
    ?? new Date(r.createdAt).toLocaleDateString(zh ? "zh-CN" : "en-US", { year: "numeric" });
  const primaryTag = pickPrimaryThemeTag(r.facetedTags);
  const primaryCategory = primaryTag?.category ? THEME_CATEGORY_LABELS[primaryTag.category] : undefined;

  return (
    <div className="group flex flex-col bg-card border border-border rounded-xl overflow-hidden transition-all duration-200 hover:border-primary/40 hover:shadow-md p-5 gap-2">
      <h3 onClick={() => onOpenDetail?.(r)}
        className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-3 cursor-pointer">
        {r.title}
      </h3>
      {r.authors.length > 0 && (
        <p className="text-xs text-muted-foreground line-clamp-1 font-medium">
          {r.authors.map((a, i) => (
            <React.Fragment key={a}>
              {i > 0 && "; "}
              <Link href={`/authors/${encodeURIComponent(a)}`}>
                <span className="hover:text-primary hover:underline cursor-pointer">{a}</span>
              </Link>
            </React.Fragment>
          ))}
        </p>
      )}
      <div className="flex items-center gap-2 pt-1">
        <span className="text-xs text-muted-foreground tabular-nums">{year}</span>
        {primaryCategory && (
          <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground border border-border/60">
            {zh ? primaryCategory.zh : primaryCategory.en}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Resource Detail Modal ───────────────────────────────────────────────────────
export function ResourceDetailModal({ resource, language, onClose, onFacetTagClick, extraSection, footer }: {
  resource: Resource; language: string; onClose: () => void; onFacetTagClick?: (slug: string) => void;
  /** Injected docs/planning/15 §2.2's admin review flow (live verify report) — reused as-is by the public detail view, which passes nothing here. */
  extraSection?: React.ReactNode;
  /** Injected by the admin review flow for Approve/Reject/Edit actions — omitted entirely for the public detail view. */
  footer?: React.ReactNode;
}) {
  const zh = language === "zh";
  const Icon  = BADGE_ICONS[resource.sourceType] ?? FileText;
  const color = BADGE_COLORS[resource.sourceType] ?? BADGE_COLORS["journal_article"];
  const href  = resource.url ?? (resource.doi ? `https://doi.org/${resource.doi}` : null);
  const date  = resource.publishedDate
    || new Date(resource.createdAt).toLocaleDateString(zh ? "zh-CN" : "en-US", { year: "numeric", month: "long", day: "numeric" });
  const dateLabel = resource.publishedDate ? (zh ? "发表于" : "Published") : (zh ? "添加于" : "Added");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${color}`}>
            <Icon className="h-3 w-3" />{sourceTypeLabel(resource.sourceType, zh)}
          </span>
          <button onClick={onClose} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <h2 className="text-lg font-serif font-bold text-foreground leading-snug">{resource.title}</h2>

          {resource.authors.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {resource.authors.map((a, i) => (
                <React.Fragment key={a}>
                  {i > 0 && "; "}
                  <Link href={`/authors/${encodeURIComponent(a)}`}>
                    <span className="font-medium text-foreground hover:text-primary hover:underline cursor-pointer">{a}</span>
                  </Link>
                </React.Fragment>
              ))}
            </p>
          )}

          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />{dateLabel}: {date}
          </p>

          {/* Body order per docs/planning/15 §6.2: abstract -> keywords -> direct link -> full tag set (tags last, unfolded). */}
          {resource.abstract && (
            <div className="space-y-1">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "摘要" : "Abstract"}</h3>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{resource.abstract}</p>
            </div>
          )}

          <KeywordsBlock keywords={resource.keywords} keywordsSource={resource.keywordsSource} language={language} />

          {(href || resource.doi) && (
            <div className="space-y-1">
              {href && (
                <a href={href} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                  {zh ? "查看原文" : "View Source"}<ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              {resource.doi && <p className="text-xs text-muted-foreground">DOI: {resource.doi}</p>}
            </div>
          )}

          {resource.facetedTags && resource.facetedTags.length > 0 && (
            <div className="pt-2 border-t border-border">
              <TagSummaryList tags={resource.facetedTags} language={language} onTagClick={onFacetTagClick} />
            </div>
          )}

          {extraSection}
        </div>
        {footer && <div className="px-6 py-4 border-t border-border shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

// ── Reject Dialog — admin picks a controlled reason (required) + optional free-text note ──────
export function RejectDialog({ resource, reasons, language, onClose, onSubmit }: {
  resource: Resource; reasons: RejectionReason[]; language: string;
  onClose: () => void; onSubmit: (reasonId: number, note: string) => Promise<void>;
}) {
  const zh = language === "zh";
  const [reasonId, setReasonId] = useState<number | "">("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (reasonId === "") { setError(zh ? "请选择拒绝理由" : "Please select a reason"); return; }
    setSubmitting(true); setError("");
    try {
      await onSubmit(reasonId, note.trim());
    } catch {
      setError(zh ? "提交失败" : "Failed to submit");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">{zh ? "驳回文献" : "Reject Resource"}</h2>
          <button onClick={onClose} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-foreground line-clamp-2">{resource.title}</p>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "拒绝理由" : "Reason"} *</label>
            <select value={reasonId} onChange={(e) => setReasonId(e.target.value ? Number(e.target.value) : "")}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">{zh ? "请选择…" : "Select…"}</option>
              {reasons.map((r) => <option key={r.id} value={r.id}>{zh ? r.nameZh : r.nameEn}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "补充说明（可选）" : "Note (optional)"}</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
              {zh ? "取消" : "Cancel"}
            </button>
            <button onClick={handleSubmit} disabled={submitting || reasonId === ""}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
              {zh ? "确认驳回" : "Confirm Reject"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Expert Redirect Panel ─────────────────────────────────────────────────────
function ExpertPanel({ language }: { language: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Users className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-1.5">
        <p className="font-semibold text-foreground">{language === "zh" ? "专家学者名录" : "Experts & Scholars Directory"}</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          {language === "zh" ? "访问专家学者数据库，浏览全球稳定币领域顶级研究人员的学术主页与研究方向。"
            : "Browse the directory of leading global stablecoin researchers, their profiles, and areas of expertise."}
        </p>
      </div>
      <Link href="/experts">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer">
          {language === "zh" ? "浏览专家学者" : "Browse Experts"}<ChevronRight className="h-4 w-4" />
        </span>
      </Link>
    </div>
  );
}

// ── Author picker (autocomplete existing authors, or create new on the fly) ───
interface AuthorSuggestion { name: string; institutionName: string | null }

export function AuthorPicker({ authors, onChange, language }: { authors: string[]; onChange: (a: string[]) => void; language: string }) {
  const zh = language === "zh";
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AuthorSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return; }
    const handle = setTimeout(() => {
      fetch(`${apiBase()}/api/authors?search=${encodeURIComponent(query.trim())}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((data: AuthorSuggestion[]) => setSuggestions(Array.isArray(data) ? data : []))
        .catch(() => setSuggestions([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  function add(name: string) {
    const t = name.trim();
    if (t && !authors.includes(t)) onChange([...authors, t]);
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
  }

  const unmatched = suggestions.filter((s) => !authors.includes(s.name));

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {zh ? "作者" : "Authors"}
      </label>
      <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
        {authors.map((name) => (
          <span key={name} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            {name}
            <button onClick={() => onChange(authors.filter((x) => x !== name))} className="hover:text-red-500 transition-colors">
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(query); } }}
          placeholder={zh ? "搜索现有作者，或输入新作者后回车" : "Search existing authors, or type a new name and press Enter"}
          className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
        />
        {isOpen && query.trim() && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-lg overflow-hidden">
            {unmatched.length > 0 && unmatched.map((s) => (
              <button key={s.name} onClick={() => add(s.name)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors flex items-center justify-between gap-2">
                <span className="font-medium text-foreground">{s.name}</span>
                {s.institutionName && <span className="text-muted-foreground truncate">{s.institutionName}</span>}
              </button>
            ))}
            <button onClick={() => add(query)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors text-primary border-t border-border">
              <Plus className="inline h-3 w-3 mr-1" />
              {zh ? `创建新作者 "${query.trim()}"` : `Create new author "${query.trim()}"`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
// ── Facet-tag picker (docs/planning/15 §2.4 — admin-only editing of the theme/jurisdiction/asset
// tag system). Checked tags are sent as `tagIds` and the backend marks every one `source: 'manual'`
// on save, per T.4's protection scheme.
// docs/planning/16 §16.2 — theme facet gets the same two-level folding tree as the sidebar
// (Group 3), so an admin fixing one wrong tag doesn't have to scan a flat wall of 37 buttons.
// Categories that already contain a selected tag start expanded, so current state is visible at a
// glance; everything else starts collapsed. jurisdiction/asset stay flat (same as the sidebar).
export function FacetTagPicker({ selectedIds, onChange, language }: { selectedIds: number[]; onChange: (ids: number[]) => void; language: string }) {
  const zh = language === "zh";
  const [vocab, setVocab] = useState<TagSummary[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const initializedExpansion = useRef(false);

  useEffect(() => {
    fetch(`${apiBase()}/api/tags`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: TagSummary[]) => setVocab(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (initializedExpansion.current || vocab.length === 0) return;
    initializedExpansion.current = true;
    const withSelection = new Set(
      vocab.filter((t) => t.facet === "theme" && t.category && selectedIds.includes(t.id)).map((t) => t.category as string),
    );
    if (withSelection.size > 0) setExpandedCategories(withSelection);
  }, [vocab, selectedIds]);

  function toggle(id: number) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  }

  function toggleCategory(cat: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  }

  const byFacet: Partial<Record<TagSummary["facet"], TagSummary[]>> = {};
  for (const t of vocab) (byFacet[t.facet] ??= []).push(t);

  const themeTags = byFacet.theme ?? [];
  const byCategory = new Map<string, TagSummary[]>();
  for (const t of themeTags) {
    const cat = t.category ?? "";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(t);
  }
  const categorySlugs = THEME_CATEGORY_ORDER.filter((c) => byCategory.has(c));

  function renderChip(t: TagSummary) {
    return (
      <button key={t.id} type="button" onClick={() => toggle(t.id)}
        className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
          selectedIds.includes(t.id)
            ? "bg-primary/10 text-primary border-primary/30"
            : "bg-muted/50 text-muted-foreground border-border/60 hover:border-primary/40"
        }`}>
        {zh ? t.nameZh : t.nameEn}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "分类标签" : "Facet Tags"}</label>
      <div className="space-y-2.5 max-h-64 overflow-y-auto rounded-lg border border-border p-3">
        {themeTags.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {zh ? FACET_LABELS.theme.zh : FACET_LABELS.theme.en}
            </p>
            <div className="space-y-0.5">
              {categorySlugs.map((cat) => {
                const expanded = expandedCategories.has(cat);
                const tagsInCategory = byCategory.get(cat)!;
                const selectedCount = tagsInCategory.filter((t) => selectedIds.includes(t.id)).length;
                return (
                  <div key={cat}>
                    <button type="button" onClick={() => toggleCategory(cat)}
                      className="flex items-center gap-1 w-full px-1 py-1 text-xs font-semibold text-foreground/85 hover:text-foreground text-left transition-colors">
                      <ChevronRight className={`h-3 w-3 shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`} />
                      {zh ? THEME_CATEGORY_LABELS[cat]?.zh ?? cat : THEME_CATEGORY_LABELS[cat]?.en ?? cat}
                      {selectedCount > 0 && <span className="text-primary font-normal">({selectedCount})</span>}
                    </button>
                    {expanded && (
                      <div className="flex flex-wrap gap-1.5 pl-4 pt-1 pb-1.5">
                        {tagsInCategory.map(renderChip)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {(["jurisdiction", "asset"] as const).filter((f) => byFacet[f]?.length).map((facet) => (
          <div key={facet} className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {zh ? FACET_LABELS[facet].zh : FACET_LABELS[facet].en}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {byFacet[facet]!.map(renderChip)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EditModal({ resource, token, language, isAdmin, onClose, onSaved }: {
  resource: Resource; token: string; language: string; isAdmin?: boolean;
  onClose: () => void; onSaved: () => void;
}) {
  const zh = language === "zh";
  const [title,    setTitle]    = useState(resource.title);
  const [authors,  setAuthors]  = useState(resource.authors);
  const [url,      setUrl]      = useState(resource.url ?? "");
  const [doi,      setDoi]      = useState(resource.doi ?? "");
  const [abstract, setAbstract] = useState(resource.abstract ?? "");
  const [keywords, setKeywords] = useState(resource.keywords);
  const [tagIds,   setTagIds]   = useState<number[]>((resource.facetedTags ?? []).map((t) => t.id));
  const [publishedDate, setPublishedDate] = useState(resource.publishedDate ?? "");
  const [sourceType, setSourceType] = useState<SourceType>(resource.sourceType);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  // docs/planning/16 §16.2 — the tag picker (37+16+22 tags) stays collapsed unless the admin
  // explicitly asks to edit tags, so opening this modal to fix a typo doesn't also dump the whole
  // vocabulary on screen.
  const [editingTags, setEditingTags] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`${apiBase()}/api/resources/${resource.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title.trim(), sourceType,
          authors,
          url: url.trim() || null, doi: doi.trim() || null,
          abstract: abstract.trim(), keywords,
          publishedDate: publishedDate.trim() || null,
          ...(isAdmin && { tagIds }),
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); setSaving(false); return; }
      // docs/planning/18 §18.4 — an admin edit can recompute this resource's status (e.g. an
      // unrelated pre-existing gap surfaces once anything triggers a recheck); never let that
      // happen silently to the admin who just clicked Save.
      const saved = await res.json();
      if (isAdmin && saved.statusChanged) {
        const missing = saved.statusChangeReason?.missingFields?.length
          ? (zh ? `缺少：${saved.statusChangeReason.missingFields.join("、")}` : `missing: ${saved.statusChangeReason.missingFields.join(", ")}`)
          : "";
        alert(zh
          ? `注意：资源状态已从「${saved.previousStatus}」变为「${saved.status}」。${missing}`
          : `Note: this resource's status changed from "${saved.previousStatus}" to "${saved.status}". ${missing}`);
      }
      onSaved(); onClose();
    } catch { setError(zh ? "网络请求失败" : "Network error"); setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">{zh ? "编辑文献" : "Edit Resource"}</h2>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "资源类型" : "Type"}</label>
            <select value={sourceType} onChange={(e) => setSourceType(e.target.value as SourceType)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
              {SOURCE_TYPES.map((o) => <option key={o.value} value={o.value}>{zh ? o.nameZh : o.nameEn}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "标题" : "Title"}</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <AuthorPicker authors={authors} onChange={setAuthors} language={language} />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">URL</label>
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..."
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">DOI</label>
              <input value={doi} onChange={(e) => setDoi(e.target.value)} placeholder="10.xxxx/xxxxx"
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "发表日期" : "Published Date"}</label>
            <input value={publishedDate} onChange={(e) => setPublishedDate(e.target.value)} placeholder="2021 or 2021-07-20"
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "摘要" : "Abstract"}</label>
            <textarea value={abstract} onChange={(e) => setAbstract(e.target.value)} rows={4}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "关键词" : "Keywords"}</label>
            <input value={keywords.join("；")}
              onChange={(e) => setKeywords(e.target.value.split(/[;；]/).map((k) => k.trim()).filter(Boolean))}
              placeholder={zh ? "多个关键词用分号（；）分隔" : "Semicolon (;) separated keywords"}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground" />
            <KeywordCountHint count={keywords.length} language={language} />
          </div>
          {isAdmin && (
            <>
              {editingTags ? (
                <FacetTagPicker selectedIds={tagIds} onChange={setTagIds} language={language} />
              ) : (
                <button type="button" onClick={() => setEditingTags(true)}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
                  <Tag className="h-3 w-3" />
                  {zh ? `编辑分类标签（管理员，当前 ${tagIds.length} 个）` : `Edit facet tags (admin, ${tagIds.length} selected)`}
                </button>
              )}
              <p className="text-xs text-muted-foreground">
                {zh
                  ? "管理员编辑不会自动触发核对 agent 重新核验；资源状态仍会按常规完整性规则更新。如需重新核验请使用「重新核验」按钮手动触发。"
                  : "Admin edits don't automatically trigger the verify agent to re-run — but the resource's status still updates per the normal completeness rules. Use the \"Re-verify\" button if you want to manually trigger a fresh check."}
              </p>
            </>
          )}
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
              {zh ? "取消" : "Cancel"}
            </button>
            <button onClick={handleSave} disabled={saving || !title.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {zh ? "保存" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tag/keyword edit suggestion (docs/planning/18 §18.4) — any logged-in user can propose a
// Theme/Jurisdiction/Asset tag change and a keyword change on an APPROVED resource. Unlike EditModal,
// this never writes directly: it lands in tag_keyword_edit_suggestions as status='pending' until an
// admin reviews it (see admin-center.tsx's Tag Suggestions tab). Kept as a separate modal rather than
// folded into EditModal's admin/owner-resubmission permission gate, so that well-tested flow stays
// untouched.
export function SuggestEditModal({ resource, token, language, onClose, onSubmitted }: {
  resource: Resource; token: string; language: string; onClose: () => void; onSubmitted: () => void;
}) {
  const zh = language === "zh";
  const [tagIds, setTagIds] = useState<number[]>((resource.facetedTags ?? []).map((t) => t.id));
  const [keywords, setKeywords] = useState(resource.keywords);
  const [vocab, setVocab] = useState<TagSummary[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${apiBase()}/api/tags`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: TagSummary[]) => setVocab(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  async function handleSubmit() {
    setSubmitting(true); setError("");
    try {
      const byId = new Map(vocab.map((t) => [t.id, t]));
      const themeTagIds = tagIds.filter((id) => byId.get(id)?.facet === "theme");
      const jurisdictionTagIds = tagIds.filter((id) => byId.get(id)?.facet === "jurisdiction");
      const assetTagIds = tagIds.filter((id) => byId.get(id)?.facet === "asset");
      const res = await fetch(`${apiBase()}/api/resources/${resource.id}/tag-keyword-suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ themeTagIds, jurisdictionTagIds, assetTagIds, keywords }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.error ?? (zh ? "提交失败" : "Failed to submit"));
        setSubmitting(false);
        return;
      }
      onSubmitted(); onClose();
    } catch { setError(zh ? "网络请求失败" : "Network error"); setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">{zh ? "建议修改标签/关键词" : "Suggest Tag/Keyword Edit"}</h2>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <p className="text-xs text-muted-foreground">
            {zh
              ? "你的修改建议将提交给管理员审核，通过后才会生效；审核期间该资源的公开展示内容不受影响。"
              : "Your suggestion goes to an admin for review and only takes effect once approved — the resource's public display is unaffected while it's pending."}
          </p>
          <FacetTagPicker selectedIds={tagIds} onChange={setTagIds} language={language} />
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "关键词" : "Keywords"}</label>
            <input value={keywords.join("；")}
              onChange={(e) => setKeywords(e.target.value.split(/[;；]/).map((k) => k.trim()).filter(Boolean))}
              placeholder={zh ? "多个关键词用分号（；）分隔" : "Semicolon (;) separated keywords"}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground" />
            <KeywordCountHint count={keywords.length} language={language} />
          </div>
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
              {zh ? "取消" : "Cancel"}
            </button>
            <button onClick={handleSubmit} disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {zh ? "提交建议" : "Submit Suggestion"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MyTagSuggestion { status: "pending" | "approved" | "rejected" }

/** docs/planning/18 §18.4 — "your edit is pending review" indicator, visible only to the submitter. */
export function MySuggestionBadge({ resourceId, token, language, refreshKey }: {
  resourceId: number; token: string; language: string;
  /** Bump this to force a refetch right after a new suggestion is submitted. */
  refreshKey?: number;
}) {
  const zh = language === "zh";
  const [suggestion, setSuggestion] = useState<MyTagSuggestion | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${apiBase()}/api/resources/${resourceId}/tag-keyword-suggestions/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (!cancelled) setSuggestion(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [resourceId, token, refreshKey]);

  if (!suggestion || suggestion.status !== "pending") return null;
  return (
    <div className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
      <Clock className="h-3.5 w-3.5 shrink-0" />
      {zh ? "你对该资源标签/关键词的修改建议正在等待管理员审核。" : "Your tag/keyword edit suggestion for this resource is pending admin review."}
    </div>
  );
}

// ── Upload Center shared types (mirror artifacts/api-server/src/routes/upload.ts) ─
export interface DraftData {
  title: string; authors: string[]; year: number | null; abstract: string;
  doi: string | null; url: string | null; sourceType: string;
  keywords: string[]; keywordsSource: KeywordsSource | null;
}
export interface TagSummary {
  id: number; slug: string; nameEn: string; nameZh: string;
  facet: "theme" | "jurisdiction" | "asset"; status: "active" | "candidate";
  /** Region grouping (facet='jurisdiction' only), e.g. "Americas" | "Europe" | "APAC". */
  region?: string | null;
  /** Top-level category slug for the theme facet's folding tree (docs/planning/15 §3.2) — null for jurisdiction/asset. */
  category?: string | null;
  /** Weighted title+abstract similarity (docs/planning/15 §3.5) — only meaningful for facet='theme'. */
  score?: number | null;
}
export interface FieldCheck { field: string; status: "✅" | "⚠️" | "❌"; detail: string }
export interface VerifyReport { checks: FieldCheck[]; hasFailure: boolean; hasWarning: boolean }
interface PipelineResultLike { draft: DraftData; tags: TagSummary[]; report: VerifyReport; foundInScholarlyDb: boolean; missingRequired: string[] }
export type UploadJobType = "pdf" | "url" | "citation" | "title";
export interface UploadJob {
  id: number; batchId: string | null; folderImportId?: string | null; type: UploadJobType; status: "queued" | "processing" | "ready_for_review" | "failed";
  input: { fileName?: string; url?: string; title?: string; sourceTypeHint?: string };
  result: PipelineResultLike | null; error: string | null; createdAt: string;
}

const FACET_LABELS: Record<TagSummary["facet"], { en: string; zh: string }> = {
  theme: { en: "Theme", zh: "主题" },
  jurisdiction: { en: "Jurisdiction", zh: "辖区" },
  asset: { en: "Asset", zh: "币种" },
};

// Six-group folding tree over the theme facet (docs/planning/15 §3.2/§3.3/§3.4).
const THEME_CATEGORY_ORDER = ["types_mechanisms", "stability_risk", "regulation_policy", "monetary_macro", "markets_adoption", "tech_infrastructure"] as const;
const THEME_CATEGORY_LABELS: Record<string, { en: string; zh: string }> = {
  types_mechanisms: { en: "Types & Mechanisms", zh: "类型与机制" },
  stability_risk: { en: "Stability & Risk", zh: "稳定性与风险" },
  regulation_policy: { en: "Regulation & Policy", zh: "监管与政策" },
  monetary_macro: { en: "Monetary & Macro", zh: "货币与宏观" },
  markets_adoption: { en: "Markets & Adoption", zh: "市场与应用" },
  tech_infrastructure: { en: "Tech & Infrastructure", zh: "技术与基础设施" },
};

/**
 * Picks the resource list page's single "primary" theme tag (docs/planning/15 §3.6) — the
 * highest-scoring matched theme tag, used to show one representative category badge instead of
 * the full tag set. Known information loss for resources spanning multiple distinct themes,
 * accepted per §3.6 — the complete tag list still shows in full on the detail page (§6.2).
 */
export function pickPrimaryThemeTag(facetedTags: TagSummary[] | undefined): TagSummary | null {
  const themeTags = (facetedTags ?? []).filter((t) => t.facet === "theme" && t.score != null);
  if (themeTags.length === 0) return null;
  return themeTags.reduce((best, t) => ((t.score ?? -Infinity) > (best.score ?? -Infinity) ? t : best));
}

/** Echoes the preview's per-tag scores back to /confirm so the server can persist resource_tags.score without re-embedding (docs/planning/15 §3.5) — see ConfirmInput.tagScores in upload.ts. */
function tagScoresPayload(tags: TagSummary[]): Record<number, number> {
  return Object.fromEntries(tags.filter((t) => t.score != null).map((t) => [t.id, t.score as number]));
}
const CHECK_FIELD_LABELS: Record<string, { en: string; zh: string }> = {
  title: { en: "Title", zh: "标题" }, doi: { en: "DOI", zh: "DOI" }, url: { en: "URL", zh: "链接" },
  authors: { en: "Authors", zh: "作者" }, year: { en: "Year", zh: "年份" }, abstract: { en: "Abstract", zh: "摘要" },
  keywords: { en: "Keywords", zh: "关键词" },
};
// docs/planning/16 §16.3 — soft target only, mirrors verify.ts's KEYWORD_COUNT_MIN/MAX.
const KEYWORD_COUNT_MIN = 3;
const KEYWORD_COUNT_MAX = 5;
/** Non-blocking hint shown under a keyword input when the count falls outside the suggested range — never disables submit. */
function KeywordCountHint({ count, language }: { count: number; language: string }) {
  const zh = language === "zh";
  if (count === 0 || (count >= KEYWORD_COUNT_MIN && count <= KEYWORD_COUNT_MAX)) return null;
  return (
    <p className="text-xs text-amber-600 dark:text-amber-400">
      {zh ? `当前 ${count} 个，建议 ${KEYWORD_COUNT_MIN}-${KEYWORD_COUNT_MAX} 个（不强制）` : `${count} keyword${count === 1 ? "" : "s"} — suggested range is ${KEYWORD_COUNT_MIN}-${KEYWORD_COUNT_MAX} (not required)`}
    </p>
  );
}

// ── Keywords display (docs/planning/15 §5.4, reworked per docs/planning/20 §20.0.6) — the
// document's own free-text keywords, deliberately styled distinctly from TagSummaryList below since
// `keywords` isn't the controlled tags/facetedTags vocabulary: plain semicolon-separated text (the
// CNKI/SSRN convention), not pills/badges, so it can't be visually mistaken for the tag system. A
// 'generated' source always shows the "AI生成" badge — this is an integrity requirement, not a
// nice-to-have, so it can't be suppressed or visually blended with extracted/manual keywords.
export function KeywordsBlock({ keywords, keywordsSource, language }: { keywords: string[]; keywordsSource: KeywordsSource | null; language: string }) {
  const zh = language === "zh";
  if (keywords.length === 0) return null;
  return (
    <div className="space-y-1">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        {zh ? "关键词" : "Keywords"}
        {keywordsSource === "generated" && (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800 normal-case tracking-normal">
            <Sparkles className="h-2.5 w-2.5" />{zh ? "AI生成" : "AI-generated"}
          </span>
        )}
      </h3>
      <p className="text-sm text-foreground/90">{keywords.join("；")}</p>
    </div>
  );
}

// ── Tag summary display (read-only — the facet-based theme/jurisdiction/asset tag system) ──
export function TagSummaryList({ tags, language, onTagClick }: { tags: TagSummary[]; language: string; onTagClick?: (slug: string) => void }) {
  const zh = language === "zh";
  if (tags.length === 0) return <p className="text-xs text-muted-foreground">{zh ? "未匹配到标签" : "No tags matched"}</p>;
  const byFacet: Partial<Record<TagSummary["facet"], TagSummary[]>> = {};
  for (const t of tags) (byFacet[t.facet] ??= []).push(t);
  return (
    <div className="space-y-1.5">
      {(["theme", "jurisdiction", "asset"] as const).filter((f) => byFacet[f]?.length).map((facet) => (
        <div key={facet} className="flex flex-wrap items-start gap-1.5">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide w-20 shrink-0 pt-0.5">
            {zh ? FACET_LABELS[facet].zh : FACET_LABELS[facet].en}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {byFacet[facet]!.map((t) => {
              const className = `inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors ${
                t.status === "candidate"
                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800"
                  : "bg-primary/10 text-primary border-primary/20"
              } ${onTagClick ? "hover:bg-primary/20 cursor-pointer" : ""}`;
              const content = <>{zh ? t.nameZh : t.nameEn}{t.status === "candidate" && <span className="opacity-70">{zh ? "（候选）" : "(candidate)"}</span>}</>;
              return onTagClick ? (
                <button key={t.id} onClick={() => onTagClick(t.slug)} className={className}>{content}</button>
              ) : (
                <span key={t.id} className={className}>{content}</span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function VerifyReportList({ report, language }: { report: VerifyReport; language: string }) {
  const zh = language === "zh";
  return (
    <div className="space-y-1">
      {report.checks.map((c) => (
        <div key={c.field} className="flex items-start gap-2 text-xs">
          <span className="shrink-0">{c.status}</span>
          <span className="font-medium text-foreground shrink-0 w-14">{zh ? (CHECK_FIELD_LABELS[c.field]?.zh ?? c.field) : (CHECK_FIELD_LABELS[c.field]?.en ?? c.field)}</span>
          <span className="text-muted-foreground">{c.detail}</span>
        </div>
      ))}
    </div>
  );
}

// docs/planning/19 §19.2 — a self-service-status resource used to show just a status badge in My
// Contributions ("incomplete"/"disputed"/etc), with no way to tell what to actually fix. Each of the
// four states gets its own concrete explanation here instead: incomplete lists the specific missing
// fields, disputed reuses the existing ✅/⚠️/❌ verify report, off_topic shows the cached
// LLM-generated explanation (never regenerated — see resources.offTopicExplanation). duplicate is
// deliberately NOT handled here — it needs the interactive candidate-comparison/withdraw/resubmit UI
// (DuplicateCandidatesPanel below), which needs a token and an onResolved callback this read-only
// component doesn't take; my-contributions.tsx branches to that component directly instead.
export function SelfServiceStatusDetail({ resource, language }: { resource: Resource; language: string }) {
  const zh = language === "zh";
  if (resource.status === "incomplete") {
    const fields = resource.missingFields ?? [];
    if (fields.length === 0) return null;
    return (
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "缺少以下信息" : "Missing"}</p>
        <div className="flex flex-wrap gap-1.5">
          {fields.map((f) => (
            <span key={f} className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
              {zh ? MISSING_FIELD_LABELS[f]?.zh ?? f : MISSING_FIELD_LABELS[f]?.en ?? f}
            </span>
          ))}
        </div>
      </div>
    );
  }
  if (resource.status === "disputed") {
    if (!resource.verificationReport) return null;
    return (
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "核对报告" : "Verification Report"}</p>
        <VerifyReportList report={resource.verificationReport} language={language} />
      </div>
    );
  }
  if (resource.status === "off_topic") {
    if (!resource.offTopicExplanation) return null;
    return (
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "判定原因" : "Why this was flagged"}</p>
        <p className="text-xs text-foreground/90 leading-relaxed">{resource.offTopicExplanation}</p>
      </div>
    );
  }
  return null;
}

interface DuplicateCandidate {
  candidateResourceId: number;
  matchType: "exact_doi" | "exact_url" | "fuzzy_title";
  title: string;
  authors: string[];
  publishedDate: string | null;
}

// docs/planning/19 §19.3 — the two explicit actions a submitter can take on a 'duplicate'-flagged
// resource: confirm it really is a duplicate (withdraw — a soft, reversible-in-spirit "never mind",
// not a physical delete) or confirm it's genuinely a different work (a short explanation, resubmitted
// through the existing 19.1 resubmission path so the admin sees the note next to the original
// matches). Deliberately its own component rather than folded into SelfServiceStatusDetail, since
// this is the one self-service status that needs live data (the matched candidates) and mutating
// actions, not just a read-only explanation.
export function DuplicateCandidatesPanel({ resource, token, language, onResolved }: {
  resource: Resource; token: string; language: string; onResolved: () => void;
}) {
  const zh = language === "zh";
  const [candidates, setCandidates] = useState<DuplicateCandidate[]>([]);
  const [viewingCandidate, setViewingCandidate] = useState<Resource | null>(null);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${apiBase()}/api/resources/${resource.id}/duplicate-candidates`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCandidates(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [resource.id, token]);

  async function openCandidate(id: number) {
    const res = await fetch(`${apiBase()}/api/resources/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setViewingCandidate(await res.json());
  }

  async function withdraw() {
    setBusy(true); setError("");
    try {
      const res = await fetch(`${apiBase()}/api/resources/${resource.id}/withdraw`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.error ?? (zh ? "操作失败" : "Failed"));
        setBusy(false);
        return;
      }
      onResolved();
    } catch { setError(zh ? "网络请求失败" : "Network error"); setBusy(false); }
  }

  async function confirmNotDuplicate() {
    if (!note.trim()) { setError(zh ? "请填写说明" : "Please explain why"); return; }
    setBusy(true); setError("");
    try {
      const res = await fetch(`${apiBase()}/api/resources/${resource.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ duplicateNote: note.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.error ?? (zh ? "提交失败" : "Failed to submit"));
        setBusy(false);
        return;
      }
      onResolved();
    } catch { setError(zh ? "网络请求失败" : "Network error"); setBusy(false); }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "疑似重复的资源" : "Possible duplicates"}</p>
        {candidates.map((c) => (
          <button key={c.candidateResourceId} type="button" onClick={() => openCandidate(c.candidateResourceId)}
            className="w-full text-left p-2.5 rounded-lg border border-border hover:border-primary/40 transition-colors">
            <p className="text-xs font-medium text-foreground line-clamp-2">{c.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {c.authors.join("; ")}{c.publishedDate && ` · ${c.publishedDate}`}
            </p>
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {!showNoteInput ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={withdraw} disabled={busy}
            className="px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50">
            {zh ? "确认是重复，撤回此提交" : "Confirm it's a duplicate — withdraw"}
          </button>
          <button type="button" onClick={() => setShowNoteInput(true)} disabled={busy}
            className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
            {zh ? "不是重复，说明后重新提交" : "Not a duplicate — explain & resubmit"}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
            placeholder={zh ? "简短说明为什么这不是重复资源" : "Briefly explain why this isn't a duplicate"}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-muted-foreground" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowNoteInput(false)} disabled={busy}
              className="px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
              {zh ? "取消" : "Cancel"}
            </button>
            <button type="button" onClick={confirmNotDuplicate} disabled={busy || !note.trim()}
              className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
              {zh ? "提交" : "Submit"}
            </button>
          </div>
        </div>
      )}
      {viewingCandidate && (
        <ResourceDetailModal resource={viewingCandidate} language={language} onClose={() => setViewingCandidate(null)} />
      )}
    </div>
  );
}

// ── Shared editable review/confirm step — used by all three upload tabs ───────
function ReviewForm({ draft, tags, report, language, saving, onChange, onConfirm, onCancel, onBack, missingRequired }: {
  draft: DraftData; tags: TagSummary[]; report: VerifyReport; language: string; saving: boolean;
  onChange: (d: DraftData) => void; onConfirm: () => void; onCancel: () => void; onBack?: () => void;
  /** Structured "which of title/authors/year/url_doi are absent" (docs/planning/12 §1) — informational, doesn't disable Confirm here (the server decides whether it's actually enforced for this entry kind). */
  missingRequired?: string[];
}) {
  const zh = language === "zh";
  const missingUrlDoi = missingRequired?.includes("url_doi") ?? false;
  return (
    <div className="space-y-4">
      {report.hasFailure && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          {zh ? "缺少必填信息（标题/作者/年份），提交后会标记为失败，建议先补全。" : "Missing required fields (title/authors/year) — submitting will mark this as failed. Fill them in first."}
        </div>
      )}
      {!report.hasFailure && report.hasWarning && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          {zh ? "存在待核实项，提交后将进入待审核队列。" : "Some fields need verification — this will go to the review queue."}
        </div>
      )}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "资源类型" : "Type"}</label>
        <select value={draft.sourceType} onChange={(e) => onChange({ ...draft, sourceType: e.target.value })}
          className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
          {SOURCE_TYPES.map((o) => <option key={o.value} value={o.value}>{zh ? o.nameZh : o.nameEn}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "标题" : "Title"}</label>
        <input value={draft.title} onChange={(e) => onChange({ ...draft, title: e.target.value })}
          className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>
      <AuthorPicker authors={draft.authors} onChange={(a) => onChange({ ...draft, authors: a })} language={language} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "年份" : "Year"}</label>
          <input type="number" value={draft.year ?? ""} onChange={(e) => onChange({ ...draft, year: e.target.value ? Number(e.target.value) : null })}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">DOI</label>
          <input value={draft.doi ?? ""} onChange={(e) => onChange({ ...draft, doi: e.target.value || null })} placeholder="10.xxxx/xxxxx"
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">URL</label>
        <input value={draft.url ?? ""} onChange={(e) => onChange({ ...draft, url: e.target.value || null })} placeholder="https://..."
          className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground" />
        {missingUrlDoi && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {zh ? "未找到 URL/DOI —— 仍可提交，会标记为「待补充」，之后可以自己补上再重新提交" : "No URL/DOI found — you can still submit; this will be marked \"Incomplete\" and you can add it later and resubmit"}
          </p>
        )}
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "摘要" : "Abstract"}</label>
        <textarea value={draft.abstract} onChange={(e) => onChange({ ...draft, abstract: e.target.value })} rows={4}
          className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          {zh ? "关键词" : "Keywords"}
          {draft.keywordsSource === "generated" && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800 normal-case tracking-normal">
              <Sparkles className="h-2.5 w-2.5" />{zh ? "AI生成，可编辑" : "AI-generated, editable"}
            </span>
          )}
        </label>
        <input value={(draft.keywords ?? []).join("；")}
          onChange={(e) => onChange({ ...draft, keywords: e.target.value.split(/[;；]/).map((k) => k.trim()).filter(Boolean), keywordsSource: "manual" })}
          placeholder={zh ? "多个关键词用分号（；）分隔（原文没有的话可以自己填，或留空由 AI 从摘要提炼）" : "Semicolon (;) separated — leave blank to let AI suggest some from the abstract"}
          className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground" />
        <KeywordCountHint count={(draft.keywords ?? []).length} language={language} />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "自动匹配的标签" : "Auto-matched tags"}</label>
        <TagSummaryList tags={tags} language={language} />
      </div>
      <div className="space-y-1.5 rounded-lg border border-border p-3 bg-muted/20">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "核对报告" : "Verification Report"}</p>
        <VerifyReportList report={report} language={language} />
      </div>
      <div className="flex justify-between gap-2 pt-1">
        {onBack ? (
          <button onClick={onBack} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
            {zh ? "返回" : "Back"}
          </button>
        ) : (
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
            {zh ? "取消" : "Cancel"}
          </button>
        )}
        <button onClick={onConfirm} disabled={saving || !draft.title.trim()}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          {zh ? "确认入库" : "Confirm & Save"}
        </button>
      </div>
    </div>
  );
}

// ── Manual tab (synchronous) ────────────────────────────────────────────────────
function ManualTab({ token, language, onClose, onSaved }: { token: string; language: string; onClose: () => void; onSaved: () => void }) {
  const zh = language === "zh";
  const [step, setStep] = useState<"input" | "checking" | "review" | "saving">("input");
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState<string[]>([]);
  const [year, setYear] = useState<number | null>(null);
  const [abstract, setAbstract] = useState("");
  const [url, setUrl] = useState("");
  const [doi, setDoi] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("journal_article");
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [tags, setTags] = useState<TagSummary[]>([]);
  const [report, setReport] = useState<VerifyReport | null>(null);
  const [missingRequired, setMissingRequired] = useState<string[]>([]);
  const [error, setError] = useState("");

  async function handleCheck() {
    setStep("checking"); setError("");
    try {
      const res = await fetch(`${apiBase()}/api/resources/upload/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim(), authors, year, abstract: abstract.trim(), url: url.trim() || undefined, doi: doi.trim() || undefined, sourceType }),
      });
      const data = await res.json();
      if (!res.ok) { setError((data.error ?? "Failed") + (data.detail ? ` (${data.detail})` : "")); setStep("input"); return; }
      setDraft(data.draft); setTags(data.tags); setReport(data.report); setMissingRequired(data.missingRequired ?? []); setStep("review");
    } catch { setError(zh ? "网络请求失败" : "Network error"); setStep("input"); }
  }

  async function handleConfirm() {
    if (!draft) return;
    setStep("saving"); setError("");
    try {
      const res = await fetch(`${apiBase()}/api/resources/upload/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...draft, tagIds: tags.map((t) => t.id), tagScores: tagScoresPayload(tags) }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); setStep("review"); return; }
      onSaved(); onClose();
    } catch { setError(zh ? "网络请求失败" : "Network error"); setStep("review"); }
  }

  if ((step === "review" || step === "saving") && draft && report) {
    return (
      <div className="space-y-2">
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        <ReviewForm draft={draft} tags={tags} report={report} language={language} saving={step === "saving"} missingRequired={missingRequired}
          onChange={setDraft} onConfirm={handleConfirm} onCancel={onClose} onBack={() => setStep("input")} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "资源类型" : "Type"}</label>
        <select value={sourceType} onChange={(e) => setSourceType(e.target.value as SourceType)}
          className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
          {SOURCE_TYPES.map((o) => <option key={o.value} value={o.value}>{zh ? o.nameZh : o.nameEn}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "标题" : "Title"} *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>
      <AuthorPicker authors={authors} onChange={setAuthors} language={language} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "年份" : "Year"}</label>
          <input type="number" value={year ?? ""} onChange={(e) => setYear(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">DOI</label>
          <input value={doi} onChange={(e) => setDoi(e.target.value)} placeholder="10.xxxx/xxxxx"
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">URL {!doi.trim() && "*"}</label>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..."
          className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground" />
        {!url.trim() && !doi.trim() && (
          <p className="text-xs text-muted-foreground">{zh ? "URL 或 DOI 至少填一项" : "At least one of URL or DOI is required"}</p>
        )}
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "摘要" : "Abstract"}</label>
        <textarea value={abstract} onChange={(e) => setAbstract(e.target.value)} rows={4}
          className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
          {zh ? "取消" : "Cancel"}
        </button>
        <button onClick={handleCheck} disabled={step === "checking" || !title.trim() || (!url.trim() && !doi.trim())}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {step === "checking" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          {zh ? "核对并预览" : "Check & Preview"}
        </button>
      </div>
    </div>
  );
}

// ── Job queue panel (shared by URL-batch/PDF/folder-import tabs — all are async/upload_jobs-backed) ──
// Filters either by a single job `type` (existing per-entry tabs) or by `folderImportId` (folder
// import's combined "this submission" progress view, docs/planning/14 §3.4) — exactly one of the
// two should be passed.
export function JobQueuePanel({ token, language, type, folderImportId, onSaved }: {
  token: string; language: string; type?: UploadJobType; folderImportId?: string; onSaved: () => void;
}) {
  const zh = language === "zh";
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [reviewDraft, setReviewDraft] = useState<DraftData | null>(null);
  const [reviewTags, setReviewTags] = useState<TagSummary[]>([]);
  const [confirming, setConfirming] = useState(false);

  const fetchJobs = useCallback(() => {
    const query = folderImportId ? `?folderImportId=${folderImportId}` : "";
    fetch(`${apiBase()}/api/resources/upload/jobs${query}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: UploadJob[]) => setJobs(Array.isArray(data) ? data.filter((j) => (type ? j.type === type : true)) : []))
      .catch(() => {});
  }, [token, type, folderImportId]);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  function openReview(job: UploadJob) {
    if (!job.result) return;
    setReviewingId(job.id);
    setReviewDraft(job.result.draft);
    setReviewTags(job.result.tags);
  }

  async function handleConfirmReview() {
    if (reviewingId == null || !reviewDraft) return;
    setConfirming(true);
    try {
      const res = await fetch(`${apiBase()}/api/resources/upload/jobs/${reviewingId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...reviewDraft, tagIds: reviewTags.map((t) => t.id), tagScores: tagScoresPayload(reviewTags) }),
      });
      if (res.ok) { setReviewingId(null); onSaved(); fetchJobs(); }
    } finally {
      setConfirming(false);
    }
  }

  async function handleDiscard(id: number) {
    await fetch(`${apiBase()}/api/resources/upload/jobs/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    fetchJobs();
  }

  const reviewingJob = jobs.find((j) => j.id === reviewingId);
  if (reviewingJob && reviewDraft) {
    const report = reviewingJob.result?.report ?? { checks: [], hasFailure: false, hasWarning: false };
    return (
      <ReviewForm draft={reviewDraft} tags={reviewTags} report={report} language={language} saving={confirming}
        missingRequired={reviewingJob.result?.missingRequired ?? []}
        onChange={setReviewDraft} onConfirm={handleConfirmReview} onCancel={() => setReviewingId(null)} onBack={() => setReviewingId(null)} />
    );
  }

  if (jobs.length === 0) return null;

  // Group by batchId (jobs from the same submission share one) so a multi-file/multi-URL
  // submission shows one "N/total done" progress line, surviving a closed/refreshed tab since
  // it's server data, not anything kept in page memory. Jobs without a batchId (shouldn't happen
  // going forward, but tolerate stale rows) each get their own solo group.
  const batches = new Map<string, UploadJob[]>();
  for (const job of jobs) {
    const key = job.batchId ?? `solo-${job.id}`;
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key)!.push(job);
  }

  return (
    <div className="space-y-3 pt-3 border-t border-border">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{zh ? "处理队列" : "Queue"}</p>
      {[...batches.values()].map((batchJobs) => {
        const doneCount = batchJobs.filter((j) => j.status === "ready_for_review" || j.status === "failed").length;
        return (
          <div key={batchJobs[0].batchId ?? batchJobs[0].id} className="space-y-1.5">
            {batchJobs.length > 1 && (
              <p className="text-xs text-muted-foreground px-0.5">
                {zh ? `批次进度：${doneCount}/${batchJobs.length}` : `Batch progress: ${doneCount}/${batchJobs.length}`}
              </p>
            )}
            {batchJobs.map((job) => {
              const label = job.input?.fileName ?? job.input?.url ?? job.input?.title ?? `#${job.id}`;
              return (
                <div key={job.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-border bg-card text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    {job.status === "queued" && <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                    {job.status === "processing" && <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />}
                    {job.status === "ready_for_review" && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                    {job.status === "failed" && <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                    <span className="truncate text-foreground">{job.result?.draft?.title || label}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {job.status === "ready_for_review" && (
                      <button onClick={() => openReview(job)} className="px-2.5 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                        {zh ? "核对" : "Review"}
                      </button>
                    )}
                    {job.status === "failed" && <span className="text-red-600 dark:text-red-400 max-w-[160px] truncate" title={job.error ?? ""}>{job.error}</span>}
                    <button onClick={() => handleDiscard(job.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ── DOI/URL tab — single entry is synchronous, batch is async (upload_jobs-backed) ──
function UrlTab({ token, language, onClose, onSaved }: { token: string; language: string; onClose: () => void; onSaved: () => void }) {
  const zh = language === "zh";
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [sourceType, setSourceType] = useState<SourceType>("journal_article");

  // single (synchronous)
  const [singleUrl, setSingleUrl] = useState("");
  const [step, setStep] = useState<"input" | "parsing" | "review" | "saving">("input");
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [tags, setTags] = useState<TagSummary[]>([]);
  const [report, setReport] = useState<VerifyReport | null>(null);
  const [missingRequired, setMissingRequired] = useState<string[]>([]);
  const [error, setError] = useState("");

  // batch (async/jobs)
  const [batchText, setBatchText] = useState("");
  const [submittingBatch, setSubmittingBatch] = useState(false);

  async function handleParseSingle() {
    if (!singleUrl.trim()) return;
    setStep("parsing"); setError("");
    try {
      const res = await fetch(`${apiBase()}/api/resources/upload/url`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: singleUrl.trim(), sourceType }),
      });
      const data = await res.json();
      if (!res.ok) { setError((data.error ?? "Failed") + (data.detail ? ` (${data.detail})` : "")); setStep("input"); return; }
      setDraft(data.draft); setTags(data.tags); setReport(data.report); setMissingRequired(data.missingRequired ?? []); setStep("review");
    } catch { setError(zh ? "网络请求失败" : "Network error"); setStep("input"); }
  }

  async function handleConfirmSingle() {
    if (!draft) return;
    setStep("saving"); setError("");
    try {
      const res = await fetch(`${apiBase()}/api/resources/upload/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...draft, tagIds: tags.map((t) => t.id), tagScores: tagScoresPayload(tags) }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); setStep("review"); return; }
      onSaved(); onClose();
    } catch { setError(zh ? "网络请求失败" : "Network error"); setStep("review"); }
  }

  async function handleSubmitBatch() {
    const urls = [...new Set(batchText.split("\n").map((u) => u.trim()).filter((u) => u.startsWith("http")))].slice(0, 20);
    if (urls.length === 0) return;
    setSubmittingBatch(true);
    try {
      await fetch(`${apiBase()}/api/resources/upload/jobs/url-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ urls, sourceType }),
      });
      setBatchText("");
    } finally {
      setSubmittingBatch(false);
    }
  }

  if ((step === "review" || step === "saving") && draft && report) {
    return (
      <div className="space-y-2">
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        <ReviewForm draft={draft} tags={tags} report={report} language={language} saving={step === "saving"} missingRequired={missingRequired}
          onChange={setDraft} onConfirm={handleConfirmSingle} onCancel={onClose} onBack={() => setStep("input")} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/30">
        <button onClick={() => setMode("single")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${mode === "single" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
          {zh ? "单条（同步）" : "Single (sync)"}
        </button>
        <button onClick={() => setMode("batch")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${mode === "batch" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
          {zh ? "批量（后台队列）" : "Batch (background queue)"}
        </button>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "资源类型提示" : "Type hint"}</label>
        <select value={sourceType} onChange={(e) => setSourceType(e.target.value as SourceType)}
          className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
          {SOURCE_TYPES.map((o) => <option key={o.value} value={o.value}>{zh ? o.nameZh : o.nameEn}</option>)}
        </select>
      </div>

      {mode === "single" ? (
        <>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">URL / DOI</label>
            <input value={singleUrl} onChange={(e) => setSingleUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleParseSingle()}
              placeholder="https://doi.org/10.xxxx/xxxxx"
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground" />
          </div>
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
              {zh ? "取消" : "Cancel"}
            </button>
            <button onClick={handleParseSingle} disabled={step === "parsing" || !singleUrl.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {step === "parsing" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              {zh ? "解析" : "Parse"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "URL 列表（每行一个，最多 20 条）" : "URLs (one per line, up to 20)"}</label>
            <textarea value={batchText} onChange={(e) => setBatchText(e.target.value)} rows={6}
              placeholder={"https://...\nhttps://..."}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none font-mono placeholder:text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">
            {zh ? "提交后将在后台逐条处理，可关闭此窗口，稍后在下方队列中查看进度与核对。" : "Submitted URLs process in the background — you can close this dialog and check progress in the queue below later."}
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={handleSubmitBatch} disabled={submittingBatch || !batchText.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {submittingBatch ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <List className="h-3.5 w-3.5" />}
              {zh ? "提交到队列" : "Submit to Queue"}
            </button>
          </div>
          <JobQueuePanel token={token} language={language} type="url" onSaved={onSaved} />
        </>
      )}
    </div>
  );
}

// ── PDF tab — always async (upload_jobs-backed), even for a single file ────────
const PDF_MAX_SIZE_MB = 50;

function PdfTab({ token, language, onSaved }: { token: string; language: string; onSaved: () => void }) {
  const zh = language === "zh";
  const [sourceType, setSourceType] = useState<SourceType>("journal_article");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  /** Rejects oversized files at selection time (matches the server's PDF_MAX_SIZE_MB) instead of letting the user wait through an upload that's guaranteed to fail. */
  function handleFilesSelected(selected: File[]) {
    const withinLimit = selected.filter((f) => f.size <= PDF_MAX_SIZE_MB * 1024 * 1024).slice(0, 20);
    const tooLarge = selected.filter((f) => f.size > PDF_MAX_SIZE_MB * 1024 * 1024);
    setFiles(withinLimit);
    setError(tooLarge.length > 0
      ? (zh ? `文件过大，单个文件上限 ${PDF_MAX_SIZE_MB}MB：${tooLarge.map((f) => f.name).join("、")}`
            : `File too large — the limit is ${PDF_MAX_SIZE_MB}MB per PDF: ${tooLarge.map((f) => f.name).join(", ")}`)
      : "");
  }

  async function handleSubmit() {
    if (files.length === 0) return;
    setSubmitting(true); setError("");
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      form.append("sourceType", sourceType);
      const res = await fetch(`${apiBase()}/api/resources/upload/jobs/pdf`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); return; }
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      setError(zh ? "网络请求失败" : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "资源类型提示" : "Type hint"}</label>
        <select value={sourceType} onChange={(e) => setSourceType(e.target.value as SourceType)}
          className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
          {SOURCE_TYPES.map((o) => <option key={o.value} value={o.value}>{zh ? o.nameZh : o.nameEn}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? `PDF 文件（可多选，单个最大 ${PDF_MAX_SIZE_MB}MB，最多 20 个）` : `PDF files (multi-select, ${PDF_MAX_SIZE_MB}MB max each, up to 20)`}</label>
        <input ref={inputRef} type="file" accept="application/pdf" multiple
          onChange={(e) => handleFilesSelected(Array.from(e.target.files ?? []))}
          className="w-full text-xs text-muted-foreground file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border file:border-border file:bg-muted file:text-foreground file:text-xs file:font-medium hover:file:bg-muted/80 file:cursor-pointer cursor-pointer" />
        {files.length > 0 && (
          <ul className="text-xs text-muted-foreground space-y-0.5 pt-1">
            {files.map((f) => <li key={f.name}>· {f.name}</li>)}
          </ul>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {zh ? "上传后将在后台逐个处理（先尝试本地文字提取，扫描件 OCR 暂未启用），可关闭此窗口，稍后在下方队列中查看进度与核对。"
            : "Uploaded files process in the background (text extraction first; OCR for scanned PDFs isn't enabled yet) — you can close this dialog and check progress in the queue below later."}
      </p>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <button onClick={handleSubmit} disabled={submitting || files.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {zh ? "提交到队列" : "Submit to Queue"}
        </button>
      </div>
      <JobQueuePanel token={token} language={language} type="pdf" onSaved={onSaved} />
    </div>
  );
}

// ── Folder import tab (docs/planning/14 §3) ─────────────────────────────────────
// select folder -> classify by extension -> (auto) decompose any unstructured reference-list files
// -> file-level summary/confirm (§3.4, gate 1) -> entry-level editable table for decomposed rows
// only (§3.3 point 3, gate 2) -> submit each bucket into its existing pipeline, all sharing one
// folderImportId -> combined progress view.

type FolderFileCategory = "pdf" | "citation" | "unstructured" | "ignored";
interface ClassifiedFile { file: File; relativePath: string; category: FolderFileCategory }

function classifyFolderFile(file: File): FolderFileCategory {
  const name = file.name.toLowerCase();
  const ext = name.includes(".") ? name.split(".").pop()! : "";
  if (ext === "pdf") return "pdf";
  if (["txt", "ent", "enw", "es6"].includes(ext)) return "citation";
  if (["md", "docx", "doc", "wps"].includes(ext)) return "unstructured";
  return "ignored";
}

interface UnstructuredEntry {
  id: string;
  title: string;
  authorsText: string; // edited as a single "; "-joined string, split on submit
  year: string; // edited as text, parsed on submit
  urlOrDoi: string;
  sourceFile: string;
  included: boolean;
}

function FolderImportTab({ token, language, onSaved }: { token: string; language: string; onSaved: () => void }) {
  const zh = language === "zh";
  const inputRef = useRef<HTMLInputElement>(null);
  // docs/planning/20 — a separate plain multi-file picker (no webkitdirectory), for when the user
  // just wants to grab a handful of loose files rather than build a whole folder for them.
  // handleFolderSelected() already tolerates this — relativePath falls back to the bare file name
  // when webkitRelativePath isn't present, which is exactly the case for a non-folder selection.
  const filesInputRef = useRef<HTMLInputElement>(null);
  const [webkitdirSupported] = useState(() => "webkitdirectory" in document.createElement("input"));
  const [stage, setStage] = useState<"select" | "extracting" | "summary" | "unstructuredReview" | "progress">("select");
  // Unset by default (not "journal_article") — this is only a fallback default for whichever files
  // a sub-pipeline genuinely can't determine a type for on its own (PDF/URL trust the LLM reading
  // the actual text; citation files trust their own RT/Reference Type field; title-search entries
  // trust resolveLink()'s News signal when present) — it must never look like it applies to
  // everything in the folder, since it doesn't.
  const [sourceType, setSourceType] = useState<SourceType | "">("");
  const [showStructureHint, setShowStructureHint] = useState(false);
  const [classified, setClassified] = useState<ClassifiedFile[]>([]);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [unstructuredEntries, setUnstructuredEntries] = useState<UnstructuredEntry[]>([]);
  const [unstructuredErrors, setUnstructuredErrors] = useState<string[]>([]);
  const [folderImportId, setFolderImportId] = useState<string | null>(null);
  // Bumped every time we return to the "select" stage — used as the <input>'s React `key` so a
  // brand-new DOM node (with no possible memory of a prior selection) is guaranteed on every
  // reselect, on top of the callback ref already reapplying webkitdirectory/directory to it.
  const [pickerGeneration, setPickerGeneration] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // webkitdirectory/directory aren't in React's DOM attribute typings (non-standard but
  // universally supported) — set them imperatively instead of fighting the JSX typing. Must be a
  // callback ref, not a `useEffect(..., [])`: the <input> only exists in the DOM while
  // stage === "select", so it unmounts on every other stage and a brand-new DOM node gets mounted
  // each time "Reselect" brings stage back to "select" — a mount-once effect would only ever touch
  // the very first node and silently miss every node after that, which is exactly what made
  // "Reselect" fall back to a plain (non-folder) file picker after the first successful selection.
  const setFolderInputRef = useCallback((node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (node) {
      node.setAttribute("webkitdirectory", "");
      node.setAttribute("directory", "");
    }
  }, []);

  async function handleFolderSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError("");
    const files = Array.from(fileList).map((f) => ({
      file: f,
      relativePath: (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name,
      category: classifyFolderFile(f),
    }));
    setClassified(files);
    setChecked(new Set(files.map((_, i) => i).filter((i) => files[i].category !== "ignored")));

    const unstructuredFiles = files.filter((f) => f.category === "unstructured");
    if (unstructuredFiles.length === 0) {
      setStage("summary");
      return;
    }

    setStage("extracting");
    const pooled: UnstructuredEntry[] = [];
    const errors: string[] = [];
    // Each call is a real ~15-25s LLM decomposition — running them sequentially with `for...await`
    // meant total wait time was the SUM across every unstructured file (over a minute with just 2-3
    // files), which looked indistinguishable from a genuine hang. Running them concurrently caps the
    // wait at roughly the slowest single file instead.
    await Promise.all(unstructuredFiles.map(async (f) => {
      try {
        const form = new FormData();
        form.append("file", f.file);
        const res = await fetch(`${apiBase()}/api/resources/upload/jobs/unstructured-list/preview`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        const data = await res.json();
        if (!res.ok) {
          // docs/planning/20 §20.0.1 — the backend already returns a specific `detail` (e.g. the
          // actual LLM/parsing error) alongside the generic `error` label; this used to drop it.
          const message = data.error ?? (zh ? "解析失败" : "failed");
          errors.push(`${f.relativePath}: ${message}${data.detail ? ` (${data.detail})` : ""}`);
          return;
        }
        (data.entries ?? []).forEach((e: { title?: string; authors?: string[]; year?: number | null; urlOrDoi?: string | null }, idx: number) => {
          pooled.push({
            id: `${f.relativePath}-${idx}`,
            title: e.title ?? "",
            authorsText: Array.isArray(e.authors) ? e.authors.join("; ") : "",
            year: e.year != null ? String(e.year) : "",
            urlOrDoi: e.urlOrDoi ?? "",
            sourceFile: f.relativePath,
            included: true,
          });
        });
      } catch {
        errors.push(`${f.relativePath}: ${zh ? "网络请求失败" : "network error"}`);
      }
    }));
    setUnstructuredEntries(pooled);
    setUnstructuredErrors(errors);
    setStage("summary");
  }

  const counts = useMemo(() => {
    const c = { pdf: 0, citation: 0, unstructured: 0, ignored: 0 };
    for (const f of classified) c[f.category]++;
    return c;
  }, [classified]);

  function toggleChecked(i: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  function toggleCategoryAll(category: FolderFileCategory, on: boolean) {
    setChecked((prev) => {
      const next = new Set(prev);
      classified.forEach((f, i) => { if (f.category === category) { if (on) next.add(i); else next.delete(i); } });
      return next;
    });
  }

  /** Bare DOI (e.g. "10.1016/j.frl.2020.101867") -> a fetchable URL, since the existing url-batch pipeline this reuses does fetch(url) and can't fetch a bare DOI string. Already a URL -> unchanged. */
  function normalizeUrlOrDoi(value: string): string {
    const v = value.trim();
    if (!v) return v;
    if (/^10\.\d{4,9}\//.test(v)) return `https://doi.org/${v}`;
    return v;
  }

  async function handleConfirmSummary() {
    setSubmitting(true);
    setError("");
    const newFolderImportId = crypto.randomUUID();
    try {
      const selectedFiles = classified.filter((_, i) => checked.has(i));
      const pdfFiles = selectedFiles.filter((f) => f.category === "pdf");
      const citationFiles = selectedFiles.filter((f) => f.category === "citation");
      // Files whose parsed entries came from an unchecked-at-summary-stage source file are dropped
      // from the pool here too — unchecking the file should un-pool its already-decomposed rows.
      const includedSourceFiles = new Set(selectedFiles.filter((f) => f.category === "unstructured").map((f) => f.relativePath));
      setUnstructuredEntries((prev) => prev.filter((e) => includedSourceFiles.has(e.sourceFile)));

      if (pdfFiles.length > 0) {
        const form = new FormData();
        pdfFiles.forEach((f) => form.append("files", f.file));
        if (sourceType) form.append("sourceType", sourceType);
        form.append("folderImportId", newFolderImportId);
        await fetch(`${apiBase()}/api/resources/upload/jobs/pdf`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
      }
      for (const f of citationFiles) {
        const form = new FormData();
        form.append("file", f.file);
        form.append("folderImportId", newFolderImportId);
        await fetch(`${apiBase()}/api/resources/upload/jobs/citation`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
      }

      setFolderImportId(newFolderImportId);
      const hasPooledEntries = unstructuredEntries.some((e) => includedSourceFiles.has(e.sourceFile));
      setStage(hasPooledEntries ? "unstructuredReview" : "progress");
    } catch {
      setError(zh ? "网络请求失败" : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  function updateEntry(id: string, patch: Partial<UnstructuredEntry>) {
    setUnstructuredEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }
  function removeEntry(id: string) {
    setUnstructuredEntries((prev) => prev.filter((e) => e.id !== id));
  }

  async function handleConfirmUnstructured() {
    if (!folderImportId) return;
    setSubmitting(true);
    setError("");
    try {
      const included = unstructuredEntries.filter((e) => e.included && e.title.trim());
      const withLink = included.filter((e) => e.urlOrDoi.trim());
      const withoutLink = included.filter((e) => !e.urlOrDoi.trim());

      if (withLink.length > 0) {
        await fetch(`${apiBase()}/api/resources/upload/jobs/url-batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ urls: withLink.map((e) => normalizeUrlOrDoi(e.urlOrDoi)), sourceType: sourceType || undefined, folderImportId }),
        });
      }
      if (withoutLink.length > 0) {
        await fetch(`${apiBase()}/api/resources/upload/jobs/title-batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            entries: withoutLink.map((e) => ({
              title: e.title,
              authors: e.authorsText.split(";").map((a) => a.trim()).filter(Boolean),
              year: e.year.trim() ? Number(e.year.trim()) : null,
            })),
            sourceType: sourceType || undefined,
            folderImportId,
          }),
        });
      }
      setStage("progress");
    } catch {
      setError(zh ? "网络请求失败" : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  function resetAll() {
    setStage("select"); setClassified([]); setChecked(new Set()); setUnstructuredEntries([]);
    setUnstructuredErrors([]); setFolderImportId(null); setError("");
    setPickerGeneration((g) => g + 1);
  }

  if (stage === "select") {
    return (
      <div className="space-y-5">
        {!webkitdirSupported && (
          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            {zh ? "你的浏览器不支持选择文件夹，请用下方“选择文件”按钮改为多选文件。" : "Your browser doesn't support folder selection — use the \"Select Files\" button below instead."}
          </p>
        )}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {zh ? "无法判断类型时的默认值（可选）" : "Default when a type can't be determined (optional)"}
          </label>
          <select value={sourceType} onChange={(e) => setSourceType(e.target.value as SourceType | "")}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">{zh ? "不设置（各文件按内容自动判断）" : "Unset (each file is judged from its own content)"}</option>
            {SOURCE_TYPES.map((o) => <option key={o.value} value={o.value}>{zh ? o.nameZh : o.nameEn}</option>)}
          </select>
          <p className="text-xs text-muted-foreground">
            {zh ? "PDF/参考文献列表条目由 AI 读取实际内容判断类型；题录文件的类型来自文件自带的字段。这里只在都判断不出来时才生效，不会覆盖已经判断出的结果。"
                : "PDF and reference-list entries have their type determined by AI reading the actual content; citation files get it from their own embedded field. This only applies when neither is available — it never overrides a type that's already been determined."}
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "选择要导入的内容" : "Select what to import"}</label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => inputRef.current?.click()} disabled={!webkitdirSupported}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {zh ? "选择文件夹" : "Select a Folder"}
            </button>
            <button type="button" onClick={() => filesInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors">
              {zh ? "选择文件" : "Select Files"}
            </button>
          </div>
          <input key={`folder-${pickerGeneration}`} ref={setFolderInputRef} type="file" multiple disabled={!webkitdirSupported}
            onChange={(e) => handleFolderSelected(e.target.files)} className="hidden" />
          <input key={`files-${pickerGeneration}`} ref={filesInputRef} type="file" multiple
            onChange={(e) => handleFolderSelected(e.target.files)} className="hidden" />
        </div>
        <div>
          <button onClick={() => setShowStructureHint((v) => !v)} className="text-xs text-primary hover:underline">
            {zh ? (showStructureHint ? "收起推荐目录结构 ▲" : "查看推荐目录结构 ▼") : (showStructureHint ? "Hide recommended structure ▲" : "View recommended structure ▼")}
          </button>
          {showStructureHint && (
            <pre className="mt-2 text-xs bg-muted/50 rounded-lg p-3 overflow-x-auto text-muted-foreground whitespace-pre">
{`materials/
├── reference-lists/
│   ├── list.md
│   └── references.docx
├── pdfs/                    ← PDF files
└── cnki-exports/            ← RefWorks / EndNote / NoteExpress / 知网研学
    ├── xxx.txt
    ├── xxx.ent / xxx.enw
    └── xxx.es6`}
            </pre>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {zh ? "仅供参考，不强制——分类只看文件扩展名，全部堆在一层也能正确识别，子文件夹也会被递归扫描。"
                : "Just a suggestion, not required — classification only looks at file extensions, so a flat folder works fine too, and subfolders are scanned recursively."}
          </p>
        </div>
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }

  if (stage === "extracting") {
    const n = classified.filter((f) => f.category === "unstructured").length;
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <p>{zh ? `正在解析 ${n} 份参考文献列表文件…` : `Parsing ${n} reference-list file(s)…`}</p>
        <p className="text-xs">{zh ? "每份文件的 AI 解析大约需要 15–25 秒，请耐心等待。" : "AI parsing takes roughly 15–25 seconds per file — this can take a bit."}</p>
      </div>
    );
  }

  if (stage === "summary") {
    const pooledCount = unstructuredEntries.length;
    const categories: { key: FolderFileCategory; labelZh: string; labelEn: string }[] = [
      { key: "pdf", labelZh: "PDF", labelEn: "PDF" },
      { key: "citation", labelZh: "题录文件", labelEn: "Citation files" },
      { key: "unstructured", labelZh: "参考文献列表", labelEn: "Reference lists" },
    ];
    return (
      <div className="space-y-5">
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
          {zh
            ? `识别到 ${counts.pdf} 个 PDF、${counts.citation} 个题录文件、${counts.unstructured} 份参考文献列表（共解析出 ${pooledCount} 条待人工确认）、已忽略 ${counts.ignored} 个不支持的文件。`
            : `Found ${counts.pdf} PDF(s), ${counts.citation} citation file(s), ${counts.unstructured} reference list(s) (${pooledCount} entries parsed, pending confirmation), ignored ${counts.ignored} unsupported file(s).`}
        </div>

        {unstructuredErrors.length > 0 && (
          <div className="text-xs text-amber-600 dark:text-amber-400 space-y-0.5">
            {unstructuredErrors.map((e, i) => <p key={i}>⚠️ {e}</p>)}
          </div>
        )}

        {categories.map(({ key, labelZh, labelEn }) => {
          const items = classified.map((f, i) => ({ f, i })).filter(({ f }) => f.category === key);
          if (items.length === 0) return null;
          const allChecked = items.every(({ i }) => checked.has(i));
          return (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{zh ? labelZh : labelEn} ({items.length})</p>
                <button onClick={() => toggleCategoryAll(key, !allChecked)} className="text-xs text-primary hover:underline">
                  {allChecked ? (zh ? "全部取消" : "Deselect all") : (zh ? "全部选中" : "Select all")}
                </button>
              </div>
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {items.map(({ f, i }) => (
                  <li key={i} className="flex items-center gap-2 text-xs px-2 py-1 rounded-md hover:bg-muted/50">
                    <input type="checkbox" checked={checked.has(i)} onChange={() => toggleChecked(i)} className="shrink-0" />
                    <span className="truncate text-foreground">{f.relativePath}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {counts.ignored > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{zh ? "已忽略（不支持的文件类型）" : "Ignored (unsupported file type)"} ({counts.ignored})</p>
            <ul className="space-y-0.5 max-h-24 overflow-y-auto">
              {classified.filter((f) => f.category === "ignored").map((f, i) => (
                <li key={i} className="text-xs text-muted-foreground px-2 truncate">{f.relativePath}</li>
              ))}
            </ul>
          </div>
        )}

        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={resetAll} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
            {zh ? "重新选择" : "Reselect"}
          </button>
          <button onClick={handleConfirmSummary} disabled={submitting || checked.size === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {zh ? "确认并开始处理" : "Confirm & Start"}
          </button>
        </div>
      </div>
    );
  }

  if (stage === "unstructuredReview") {
    return (
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">
          {zh ? "以下是从参考文献列表里自动拆解出的条目，AI 解析结果可能有误，请逐条核对/编辑后再提交——这一步是必须的，不会跳过。"
              : "These entries were auto-decomposed from the reference-list file(s). AI extraction can be wrong — review/edit each row before submitting; this step can't be skipped."}
        </p>
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {unstructuredEntries.map((entry) => (
            <div key={entry.id} className={`rounded-lg border p-2.5 space-y-1.5 ${entry.included ? "border-border bg-card" : "border-border/50 bg-muted/30 opacity-60"}`}>
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                  <input type="checkbox" checked={entry.included} onChange={(e) => updateEntry(entry.id, { included: e.target.checked })} />
                  <span className="truncate">{entry.sourceFile}</span>
                </label>
                <button onClick={() => removeEntry(entry.id)} className="text-muted-foreground hover:text-red-500 transition-colors shrink-0">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <input value={entry.title} onChange={(e) => updateEntry(entry.id, { title: e.target.value })}
                placeholder={zh ? "标题" : "Title"}
                className="w-full px-2 py-1 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <div className="grid grid-cols-3 gap-1.5">
                <input value={entry.authorsText} onChange={(e) => updateEntry(entry.id, { authorsText: e.target.value })}
                  placeholder={zh ? "作者（用；分隔）" : "Authors (; separated)"}
                  className="col-span-1 px-2 py-1 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <input value={entry.year} onChange={(e) => updateEntry(entry.id, { year: e.target.value })}
                  placeholder={zh ? "年份" : "Year"}
                  className="col-span-1 px-2 py-1 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <input value={entry.urlOrDoi} onChange={(e) => updateEntry(entry.id, { urlOrDoi: e.target.value })}
                  placeholder={zh ? "URL 或 DOI（可空）" : "URL or DOI (optional)"}
                  className="col-span-1 px-2 py-1 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
          ))}
          {unstructuredEntries.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">{zh ? "没有可确认的条目" : "No entries to confirm"}</p>
          )}
        </div>
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={resetAll} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
            {zh ? "取消" : "Cancel"}
          </button>
          <button onClick={handleConfirmUnstructured} disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {zh ? "确认提交" : "Confirm & Submit"}
          </button>
        </div>
      </div>
    );
  }

  // stage === "progress"
  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground">{zh ? "已提交，正在后台处理——可关闭此窗口，稍后回来查看进度与核对。" : "Submitted — processing in the background. You can close this dialog and check progress later."}</p>
      <button onClick={resetAll} className="text-xs text-primary hover:underline">{zh ? "导入另一个文件夹" : "Import another folder"}</button>
      {folderImportId && <JobQueuePanel token={token} language={language} folderImportId={folderImportId} onSaved={onSaved} />}
    </div>
  );
}

// ── Upload Center — three tabs: Manual (sync) / DOI·URL (sync single + async batch) / PDF (async) ──
function UploadCenterModal({ token, language, onClose, onSaved }: {
  token: string; language: string; onClose: () => void; onSaved: () => void;
}) {
  const zh = language === "zh";
  const [tab, setTab] = useState<"manual" | "url" | "pdf" | "folder">("manual");

  const TABS = [
    { key: "manual" as const, labelEn: "Manual", labelZh: "手动填写" },
    { key: "url" as const, labelEn: "DOI / URL", labelZh: "DOI·URL" },
    { key: "pdf" as const, labelEn: "PDF", labelZh: "PDF" },
    { key: "folder" as const, labelEn: "Batch Import", labelZh: "批量导入" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">{zh ? "上传文献" : "Upload Resource"}</h2>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex border-b border-border px-6 shrink-0">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {zh ? t.labelZh : t.labelEn}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto">
          {tab === "manual" && <ManualTab token={token} language={language} onClose={onClose} onSaved={onSaved} />}
          {tab === "url" && <UrlTab token={token} language={language} onClose={onClose} onSaved={onSaved} />}
          {tab === "pdf" && <PdfTab token={token} language={language} onSaved={onSaved} />}
          {tab === "folder" && <FolderImportTab token={token} language={language} onSaved={onSaved} />}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AcademicResources() {
  const { t, language } = useLanguage();
  const { user, token } = useAuth();
  const zh = language === "zh";

  const [searchQuery,   setSearchQuery]   = useState("");
  const [selectedType,  setSelectedType]  = useState<FilterType>("All");
  const [selectedFacetTag, setSelectedFacetTag] = useState<string | null>(() => new URLSearchParams(window.location.search).get("tag"));
  const [facetTagVocab, setFacetTagVocab] = useState<TagSummary[]>([]);
  const [apiResources,  setApiResources]  = useState<Resource[] | null>(null);
  const [isLoading,     setIsLoading]     = useState(true);
  const [uploadCenterOpen, setUploadCenterOpen] = useState(false);
  const [detailResource, setDetailResource] = useState<Resource | null>(null);
  // docs/planning/18 §18.4 — any logged-in user can propose a tag/keyword edit on an approved
  // resource; suggestionRefreshKey forces MySuggestionBadge to refetch right after a submission.
  const [suggestingResource, setSuggestingResource] = useState<Resource | null>(null);
  const [suggestionRefreshKey, setSuggestionRefreshKey] = useState(0);
  // docs/planning/20 §20.0.4 — an admin viewing an approved resource here previously had NO direct
  // edit path at all, only the non-admin "suggest edit" flow (which always queues for review) — so
  // an admin's own edit silently ended up as a pending suggestion instead of taking effect. This is
  // the actual admin-direct-edit modal, same one the admin review queue already uses.
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  // Theme facet's folding tree (docs/planning/15 §3.4) — all six categories start collapsed so the
  // sidebar doesn't open already full of dozens of tags.
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`${apiBase()}/api/tags`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: TagSummary[]) => setFacetTagVocab(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  function handleFacetTagClick(slug: string) {
    setSelectedFacetTag((prev) => {
      const next = prev === slug ? null : slug;
      const url = new URL(window.location.href);
      if (next) url.searchParams.set("tag", next); else url.searchParams.delete("tag");
      window.history.pushState({}, "", url);
      return next;
    });
  }

  const fetchResources = useCallback(() => {
    setIsLoading(true);
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    fetch(`${apiBase()}/api/resources`, { headers })
      .then((r) => r.json())
      .then((data: Resource[]) => {
        if (!Array.isArray(data)) { setApiResources([]); return; }
        setApiResources(data);
        const wantedId = new URLSearchParams(window.location.search).get("id");
        if (wantedId) {
          const match = data.find((r) => String(r.id) === wantedId);
          if (match) setDetailResource(match);
        }
      })
      .catch(() => setApiResources([]))
      .finally(() => setIsLoading(false));
  }, [token]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  const resources = apiResources ?? [];

  // Only 'approved' resources ever appear on this public browsing list (docs/planning/15 §0.1) — a
  // submitter's own pending/self-service-status resources live in My Contributions instead, and the
  // admin queue lives at /admin (AdminCenter). No adminView/own-resource carve-out here anymore.
  const filtered = useMemo(() => {
    if (selectedType === "Expert") return [];
    return resources.filter((r) => {
      if (r.status !== "approved") return false;
      const matchType = selectedType === "All" || r.sourceType === selectedType;
      const matchFacetTag = !selectedFacetTag || (r.facetedTags ?? []).some((t) => t.slug === selectedFacetTag);
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q || r.title.toLowerCase().includes(q) ||
        (r.abstract ?? "").toLowerCase().includes(q) ||
        r.authors.some((a) => a.toLowerCase().includes(q)) ||
        r.keywords.some((k) => k.toLowerCase().includes(q));
      return matchType && matchFacetTag && matchSearch;
    });
  }, [resources, searchQuery, selectedType, selectedFacetTag]);

  const showExperts = selectedType === "Expert";
  const hasActiveFilters = selectedType !== "All" || !!selectedFacetTag || searchQuery;

  return (
    <div className="max-w-screen-xl mx-auto space-y-6">

      {/* ── Page header ── */}
      <div className="space-y-1.5 border-b border-border pb-5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-widest">
          <ChevronRight className="h-3.5 w-3.5" />{t("Research Hub", "研究中心")}
        </div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1.5 flex-1">
            <h1 className="text-3xl font-serif font-bold text-primary tracking-tight">
              {t("Cutting-Edge Academic Research", "前沿学术资源库")}
            </h1>
            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
              {t(
                "A curated collection of global academic papers, industry reports, regulatory documents, and news on stablecoin research. Maintained continuously by the ZIBS research team.",
                "汇集全球顶级学术论文、行业研究报告、监管法案原文及行业资讯，由浙大国际商学院稳定币课题组持续维护更新。",
              )}
            </p>
          </div>
          {user && (
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button onClick={() => setUploadCenterOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                <Upload className="h-4 w-4" />{zh ? "上传文献" : "Upload"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("Search by title, abstract, author or tag…", "按标题、摘要、作者或标签搜索…")}
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors placeholder:text-muted-foreground" />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── Sidebar ── */}
        <aside className="w-full lg:w-52 shrink-0 space-y-6">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">
              {t("Resource Type", "资源类型")}
            </p>
            <div className="flex flex-col gap-0.5">
              {FILTER_TYPES.map(({ value, labelEn, labelZh, icon: Icon }) => (
                <button key={value} onClick={() => { setSelectedType(value); if (value !== "All") setSearchQuery(""); }}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left w-full ${
                    selectedType === value ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-muted hover:text-foreground"
                  }`}>
                  <Icon className="h-4 w-4 shrink-0" />{zh ? labelZh : labelEn}
                </button>
              ))}
            </div>
          </div>
          {!showExperts && facetTagVocab.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t("Filter by Tags", "按标签筛选")}</p>
                {selectedFacetTag && (
                  <button onClick={() => handleFacetTagClick(selectedFacetTag)} className="text-xs text-primary hover:underline">{t("Clear", "清除")}</button>
                )}
              </div>
              <div className="space-y-2.5">
                {(["theme", "jurisdiction", "asset"] as const).map((facet) => {
                  const tagsInFacet = facetTagVocab.filter((t) => t.facet === facet);
                  if (tagsInFacet.length === 0) return null;
                  // Theme facet gets a two-level folding tree (docs/planning/15 §3.4): category
                  // headers are the top level, individual tags only show once expanded.
                  // jurisdiction/asset stay flat pill lists, same as before.
                  if (facet === "theme") {
                    const byCategory = new Map<string, TagSummary[]>();
                    for (const tg of tagsInFacet) {
                      const cat = tg.category ?? "";
                      if (!byCategory.has(cat)) byCategory.set(cat, []);
                      byCategory.get(cat)!.push(tg);
                    }
                    const categorySlugs = THEME_CATEGORY_ORDER.filter((c) => byCategory.has(c));
                    return (
                      <div key={facet} className="space-y-1">
                        <p className="text-xs text-muted-foreground/70 px-1">{zh ? FACET_LABELS[facet].zh : FACET_LABELS[facet].en}</p>
                        <div className="space-y-0.5">
                          {categorySlugs.map((cat) => {
                            const expanded = expandedCategories.has(cat);
                            const tagsInCategory = byCategory.get(cat)!;
                            return (
                              <div key={cat}>
                                <button
                                  onClick={() => setExpandedCategories((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(cat)) next.delete(cat); else next.add(cat);
                                    return next;
                                  })}
                                  className="flex items-center gap-1 w-full px-1 py-1 text-sm font-semibold text-foreground/85 hover:text-foreground text-left transition-colors">
                                  <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`} />
                                  {zh ? THEME_CATEGORY_LABELS[cat]?.zh ?? cat : THEME_CATEGORY_LABELS[cat]?.en ?? cat}
                                </button>
                                {expanded && (
                                  <div className="flex flex-wrap gap-1.5 pl-4 pt-1 pb-1.5">
                                    {tagsInCategory.map((tg) => (
                                      <button key={tg.id} onClick={() => handleFacetTagClick(tg.slug)}
                                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                          selectedFacetTag === tg.slug ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                                        }`}>
                                        <Tag className="h-2.5 w-2.5" />{zh ? tg.nameZh : tg.nameEn}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={facet} className="space-y-1">
                      <p className="text-xs text-muted-foreground/70 px-1">{zh ? FACET_LABELS[facet].zh : FACET_LABELS[facet].en}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {tagsInFacet.map((tg) => (
                          <button key={tg.id} onClick={() => handleFacetTagClick(tg.slug)}
                            className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                              selectedFacetTag === tg.slug ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                            }`}>
                            <Tag className="h-2.5 w-2.5" />{zh ? tg.nameZh : tg.nameEn}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        {/* ── Results ── */}
        <div className="flex-1 min-w-0 space-y-4">
          {showExperts && <ExpertPanel language={language} />}

          {!showExperts && (
            <>
              <div className="flex items-center justify-between h-6">
                {isLoading ? (
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />{t("Loading…", "加载中…")}
                  </span>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {zh ? `共 ${filtered.length} 条结果` : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
                  </p>
                )}
                {hasActiveFilters && (
                  <button onClick={() => { setSelectedType("All"); setSearchQuery(""); if (selectedFacetTag) handleFacetTagClick(selectedFacetTag); }}
                    className="text-xs text-primary hover:underline">{t("Reset filters", "重置筛选")}</button>
                )}
              </div>

              {!isLoading && filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                  <Search className="h-10 w-10 text-muted-foreground/30" /><p className="font-medium text-muted-foreground">{t("No resources found", "未找到相关资源")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map((r) => (
                    <ResourceCard key={r.id} r={r} language={language} onOpenDetail={setDetailResource} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {uploadCenterOpen && token && (
        <UploadCenterModal token={token} language={language} onClose={() => setUploadCenterOpen(false)} onSaved={fetchResources} />
      )}
      {detailResource && (
        <ResourceDetailModal resource={detailResource} language={language} onClose={() => setDetailResource(null)}
          onFacetTagClick={(slug) => { handleFacetTagClick(slug); setDetailResource(null); }}
          extraSection={
            detailResource.status === "approved" && token ? (
              user?.role === "admin" ? (
                <div className="pt-2 border-t border-border">
                  <button type="button" onClick={() => setEditingResource(detailResource)}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
                    <Pencil className="h-3 w-3" />
                    {zh ? "编辑（管理员，立即生效）" : "Edit (admin, takes effect immediately)"}
                  </button>
                </div>
              ) : (
                <div className="pt-2 border-t border-border space-y-2">
                  <MySuggestionBadge resourceId={detailResource.id} token={token} language={language} refreshKey={suggestionRefreshKey} />
                  <button type="button" onClick={() => setSuggestingResource(detailResource)}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
                    <Tag className="h-3 w-3" />
                    {zh ? "建议修改标签/关键词" : "Suggest tag/keyword edit"}
                  </button>
                </div>
              )
            ) : undefined
          } />
      )}
      {suggestingResource && token && (
        <SuggestEditModal resource={suggestingResource} token={token} language={language}
          onClose={() => setSuggestingResource(null)}
          onSubmitted={() => setSuggestionRefreshKey((k) => k + 1)} />
      )}
      {editingResource && token && (
        <EditModal resource={editingResource} token={token} language={language} isAdmin
          onClose={() => setEditingResource(null)}
          onSaved={() => { setEditingResource(null); setDetailResource(null); fetchResources(); }} />
      )}
    </div>
  );
}
