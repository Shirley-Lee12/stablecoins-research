import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import {
  Search, ExternalLink, FileText, BookOpen, Building2, Newspaper,
  Tag, Users, ChevronRight, Loader2, Plus, X, Upload, AlertCircle,
  Check, ShieldCheck, Clock, XCircle, Pencil, List, LayoutGrid,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type SourceType = "Paper" | "Report" | "Gov Document" | "News" | "Experts & Scholars";
type ResourceStatus = "pending" | "approved" | "rejected";
type FilterType = SourceType | "Expert" | "All";

interface Resource {
  id: number;
  title: string;
  authors: string[];
  sourceType: SourceType;
  url: string | null;
  doi: string | null;
  abstract: string | null;
  tags: string[];
  status: ResourceStatus;
  createdBy: number | null;
  createdAt: string;
}

interface ImportedItem {
  url: string;
  title: string;
  authors: string[];
  abstract: string;
  tags: string[];
  sourceType: string;
  // per-item UI state
  status: "parsing" | "done" | "error";
  error?: string;
  selected: boolean;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_RESOURCES: Resource[] = [
  {
    id: 1, title: "Stablecoins: Growth Potential and Impact on Banking",
    authors: ["International Monetary Fund", "Tobias Adrian"],
    sourceType: "Report", url: "https://www.imf.org", doi: null,
    abstract: "Stablecoins could challenge existing monetary systems. Their success will depend on trust, regulation, and widespread adoption.",
    tags: ["Monetary Policy", "Financial Stability", "IMF", "Regulation"],
    status: "approved", createdBy: null, createdAt: "2024-11-01T00:00:00Z",
  },
  {
    id: 2, title: "Stablecoin Runs and the Centralization of Arbitrage",
    authors: ["Gary B. Gorton", "Jeffery Zhang"], sourceType: "Paper",
    url: null, doi: "10.2139/ssrn.3888752",
    abstract: "We analyze the stability of stablecoins by studying historical run episodes.",
    tags: ["Run Risk", "Algorithmic", "Regulation", "SSRN"],
    status: "approved", createdBy: null, createdAt: "2024-09-15T00:00:00Z",
  },
  {
    id: 3, title: "Responsible Financial Innovation Act — Stablecoin Provisions",
    authors: ["U.S. Senate Banking Committee"], sourceType: "Gov Document",
    url: "https://www.banking.senate.gov/", doi: null,
    abstract: "The RFIA establishes a comprehensive framework for digital asset regulation.",
    tags: ["U.S. Regulation", "RFIA", "Payment Stablecoin", "Licensing"],
    status: "approved", createdBy: null, createdAt: "2024-07-20T00:00:00Z",
  },
  {
    id: 4, title: "Circle Unveils USDC Cross-Chain Transfer Protocol",
    authors: ["Circle Internet Financial"], sourceType: "News",
    url: "https://www.circle.com/blog", doi: null,
    abstract: "Circle has launched a cross-chain transfer protocol enabling USDC to move natively across multiple chains.",
    tags: ["USDC", "Cross-Chain", "DeFi", "Circle"],
    status: "approved", createdBy: null, createdAt: "2024-12-05T00:00:00Z",
  },
  {
    id: 5, title: "The Economics of Stablecoins: Price Stabilization Mechanisms",
    authors: ["Ye Li", "Simon Mayer"], sourceType: "Paper",
    url: null, doi: "10.1093/rfs/hhad012",
    abstract: "We develop a model comparing collateralized and algorithmic stablecoins.",
    tags: ["Price Stability", "Collateral", "Algorithmic", "Economic Theory"],
    status: "approved", createdBy: null, createdAt: "2024-06-10T00:00:00Z",
  },
  {
    id: 6, title: "MiCA Regulation: Comprehensive Framework for Crypto-Asset Markets",
    authors: ["European Parliament", "European Council"], sourceType: "Gov Document",
    url: "https://eur-lex.europa.eu", doi: null,
    abstract: "MiCA provides a comprehensive EU regulatory framework for asset-referenced tokens.",
    tags: ["EU", "MiCA", "Regulation", "E-Money Token", "ART"],
    status: "approved", createdBy: null, createdAt: "2024-05-01T00:00:00Z",
  },
];

// ── Constants ─────────────────────────────────────────────────────────────────
const FILTER_TYPES: { value: FilterType; labelEn: string; labelZh: string; icon: React.ElementType }[] = [
  { value: "All",              labelEn: "All Types",          labelZh: "全部类型", icon: BookOpen  },
  { value: "Paper",            labelEn: "Paper",              labelZh: "学术论文", icon: FileText  },
  { value: "Report",           labelEn: "Report",             labelZh: "行业报告", icon: BookOpen  },
  { value: "Gov Document",     labelEn: "Gov Document",       labelZh: "监管法案", icon: Building2 },
  { value: "News",             labelEn: "News",               labelZh: "行业资讯", icon: Newspaper },
  { value: "Expert",           labelEn: "Experts & Scholars", labelZh: "专家学者", icon: Users     },
];

const SOURCE_TYPE_OPTIONS: SourceType[] = ["Paper", "Report", "Gov Document", "News", "Experts & Scholars"];

const BADGE_COLORS: Record<SourceType, string> = {
  Paper:                "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  Report:               "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  "Gov Document":       "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
  News:                 "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  "Experts & Scholars": "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
};

const BADGE_ICONS: Record<SourceType, React.ElementType> = {
  Paper: FileText, Report: BookOpen, "Gov Document": Building2,
  News: Newspaper, "Experts & Scholars": Users,
};

function apiBase() {
  return (import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL).replace(/\/$/, "");
}

// ── Resource Card ─────────────────────────────────────────────────────────────
function ResourceCard({
  r, language, currentUserId, isAdmin,
  onApprove, onReject, onEdit,
}: {
  r: Resource; language: string;
  currentUserId?: number; isAdmin?: boolean;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  onEdit?: (r: Resource) => void;
}) {
  const Icon  = BADGE_ICONS[r.sourceType] ?? FileText;
  const color = BADGE_COLORS[r.sourceType] ?? BADGE_COLORS["Paper"];
  const href  = r.url ?? (r.doi ? `https://doi.org/${r.doi}` : null);
  const date  = new Date(r.createdAt).toLocaleDateString(
    language === "zh" ? "zh-CN" : "en-US", { year: "numeric", month: "short" },
  );
  const canEdit = isAdmin || (currentUserId != null && r.createdBy === currentUserId);
  const isPending = r.status === "pending";
  const isRejected = r.status === "rejected";

  return (
    <div className={`group flex flex-col bg-card border rounded-xl overflow-hidden transition-all duration-200 ${
      isPending ? "border-amber-300 dark:border-amber-700" :
      isRejected ? "border-red-300 dark:border-red-800 opacity-70" :
      "border-border hover:border-primary/40 hover:shadow-md"
    }`}>
      <div className={`h-0.5 w-full bg-gradient-to-r ${
        isPending ? "from-amber-400 to-amber-200" :
        isRejected ? "from-red-400 to-red-200" :
        "from-primary/70 to-primary/10"
      }`} />

      <div className="flex flex-col flex-1 p-5 gap-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${color}`}>
            <Icon className="h-3 w-3" />{r.sourceType}
          </span>
          <div className="flex items-center gap-1.5">
            {isPending && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700">
                <Clock className="h-3 w-3" />
                {language === "zh" ? "待审核" : "Pending"}
              </span>
            )}
            {isRejected && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-700">
                <XCircle className="h-3 w-3" />
                {language === "zh" ? "已驳回" : "Rejected"}
              </span>
            )}
            <span className="text-xs text-muted-foreground tabular-nums">{date}</span>
          </div>
        </div>

        <h3 className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-3">
          {r.title}
        </h3>
        {r.authors.length > 0 && (
          <p className="text-xs text-muted-foreground line-clamp-1 font-medium">{r.authors.join("; ")}</p>
        )}
        {r.abstract && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1">{r.abstract}</p>
        )}
        {r.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {r.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground border border-border/60">{tag}</span>
            ))}
            {r.tags.length > 4 && <span className="text-xs px-2 py-0.5 text-muted-foreground">+{r.tags.length - 4}</span>}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`border-t border-border px-5 py-2.5 flex items-center justify-between gap-2 ${!href && !canEdit && !onApprove ? "hidden" : ""}`}>
        <div>
          {href && (
            <a href={href} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
              {r.doi ? `DOI: ${r.doi}` : language === "zh" ? "查看原文" : "View Source"}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {canEdit && onEdit && (
            <button onClick={() => onEdit(r)}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors">
              <Pencil className="h-3 w-3" />
              {language === "zh" ? "编辑" : "Edit"}
            </button>
          )}
          {onApprove && isPending && (
            <button onClick={() => onApprove(r.id)}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 transition-colors">
              <Check className="h-3 w-3" />
              {language === "zh" ? "通过" : "Approve"}
            </button>
          )}
          {onReject && isPending && (
            <button onClick={() => onReject(r.id)}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800 transition-colors">
              <XCircle className="h-3 w-3" />
              {language === "zh" ? "驳回" : "Reject"}
            </button>
          )}
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

// ── Tag chip editor (shared between Import and Edit modals) ───────────────────
function TagEditor({ tags, onChange, language }: { tags: string[]; onChange: (t: string[]) => void; language: string }) {
  const [newTag, setNewTag] = useState("");
  function add(raw: string) {
    const t = raw.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setNewTag("");
  }
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {language === "zh" ? "标签" : "Tags"}
      </label>
      <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            {tag}
            <button onClick={() => onChange(tags.filter((x) => x !== tag))} className="hover:text-red-500 transition-colors">
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input value={newTag} onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(newTag); } }}
          placeholder={language === "zh" ? "输入新标签，回车添加" : "New tag, press Enter"}
          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
        />
        <button onClick={() => add(newTag)} disabled={!newTag.trim()}
          className="px-3 py-1.5 text-xs rounded-lg border border-border bg-muted hover:bg-muted/80 disabled:opacity-40 transition-colors">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ resource, token, language, onClose, onSaved }: {
  resource: Resource; token: string; language: string;
  onClose: () => void; onSaved: () => void;
}) {
  const zh = language === "zh";
  const [title,    setTitle]    = useState(resource.title);
  const [authors,  setAuthors]  = useState(resource.authors.join(", "));
  const [abstract, setAbstract] = useState(resource.abstract ?? "");
  const [tags,     setTags]     = useState(resource.tags);
  const [sourceType, setSourceType] = useState<SourceType>(resource.sourceType);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`${apiBase()}/api/resources/${resource.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title.trim(), sourceType,
          authors: authors.split(",").map((a) => a.trim()).filter(Boolean),
          abstract: abstract.trim(), tags,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); setSaving(false); return; }
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
              {SOURCE_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "标题" : "Title"}</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "作者（逗号分隔）" : "Authors"}</label>
            <input value={authors} onChange={(e) => setAuthors(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "摘要" : "Abstract"}</label>
            <textarea value={abstract} onChange={(e) => setAbstract(e.target.value)} rows={4}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>
          <TagEditor tags={tags} onChange={setTags} language={language} />
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

// ── Single Import Modal ───────────────────────────────────────────────────────
type SingleStep = "input" | "parsing" | "review" | "saving" | "done" | "error";

function SingleImportModal({ token, language, onClose, onSaved }: {
  token: string; language: string; onClose: () => void; onSaved: () => void;
}) {
  const zh = language === "zh";
  const [step,       setStep]       = useState<SingleStep>("input");
  const [url,        setUrl]        = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("Paper");
  const [errorMsg,   setErrorMsg]   = useState("");
  const [title,      setTitle]      = useState("");
  const [authors,    setAuthors]    = useState("");
  const [abstract,   setAbstract]   = useState("");
  const [tags,       setTags]       = useState<string[]>([]);

  async function handleParse() {
    if (!url.startsWith("http")) { setErrorMsg(zh ? "请输入有效 URL" : "Enter a valid URL"); return; }
    setErrorMsg(""); setStep("parsing");
    try {
      const res = await fetch(`${apiBase()}/api/resources/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url, source_type: sourceType }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error ?? "Parsing failed"); setStep("error"); return; }
      setTitle(data.title); setAuthors(data.authors.join(", "));
      setAbstract(data.abstract); setTags(data.tags);
      if (data.sourceType) setSourceType(data.sourceType as SourceType);
      setStep("review");
    } catch { setErrorMsg(zh ? "网络请求失败" : "Network error"); setStep("error"); }
  }

  async function handleSave() {
    setStep("saving");
    try {
      const res = await fetch(`${apiBase()}/api/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title.trim(), sourceType, url,
          authors: authors.split(",").map((a) => a.trim()).filter(Boolean),
          abstract: abstract.trim(), tags,
        }),
      });
      if (!res.ok) { const d = await res.json(); setErrorMsg(d.error ?? "Save failed"); setStep("error"); return; }
      setStep("done");
      setTimeout(() => { onSaved(); onClose(); }, 1000);
    } catch { setErrorMsg(zh ? "网络请求失败" : "Network error"); setStep("error"); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">{zh ? "智能导入文献" : "Import Resource"}</h2>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {(step === "input" || step === "error") && (
            <>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "资源类型" : "Type"}</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {SOURCE_TYPE_OPTIONS.map((opt) => (
                      <button key={opt} onClick={() => setSourceType(opt)}
                        className={`text-xs px-2 py-1.5 rounded-lg border transition-colors text-center ${sourceType === opt ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 text-muted-foreground border-border hover:border-primary/40"}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "文献 URL" : "Source URL"}</label>
                  <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleParse()}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground" />
                </div>
                {errorMsg && (
                  <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />{errorMsg}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">{zh ? "取消" : "Cancel"}</button>
                <button onClick={handleParse} disabled={!url}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  <Upload className="h-3.5 w-3.5" />{zh ? "AI 解析" : "Parse with AI"}
                </button>
              </div>
            </>
          )}
          {step === "parsing" && (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm font-medium">{zh ? "AI 正在解析文献元数据…" : "AI is parsing the document…"}</p>
              <p className="text-xs text-muted-foreground">{zh ? "通常需要 5–15 秒" : "Usually 5–15 seconds"}</p>
            </div>
          )}
          {step === "review" && (
            <>
              <p className="text-xs text-muted-foreground">{zh ? "AI 已提取以下信息，可编辑后确认入库。" : "AI extracted the following. Edit as needed, then confirm."}</p>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "资源类型" : "Type"}</label>
                  <select value={sourceType} onChange={(e) => setSourceType(e.target.value as SourceType)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {SOURCE_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "标题" : "Title"}</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "作者（逗号分隔）" : "Authors"}</label>
                  <input value={authors} onChange={(e) => setAuthors(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "摘要" : "Abstract"}</label>
                  <textarea value={abstract} onChange={(e) => setAbstract(e.target.value)} rows={3}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                </div>
                <TagEditor tags={tags} onChange={setTags} language={language} />
              </div>
              <div className="flex justify-between gap-2 pt-1">
                <button onClick={() => { setStep("input"); setErrorMsg(""); }}
                  className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">{zh ? "重新输入" : "Back"}</button>
                <button onClick={handleSave} disabled={!title.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  <Check className="h-3.5 w-3.5" />{zh ? "确认入库" : "Confirm & Save"}
                </button>
              </div>
            </>
          )}
          {(step === "saving") && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">{zh ? "正在保存…" : "Saving…"}</p>
            </div>
          )}
          {step === "done" && (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                <Check className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm font-medium">{zh ? "文献已提交审核" : "Resource submitted for review"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Batch Import Modal ────────────────────────────────────────────────────────
function BatchImportModal({ token, language, onClose, onSaved }: {
  token: string; language: string; onClose: () => void; onSaved: () => void;
}) {
  const zh = language === "zh";
  type BatchStep = "input" | "parsing" | "review" | "saving" | "done";
  const [step,       setStep]       = useState<BatchStep>("input");
  const [urlsText,   setUrlsText]   = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("Paper");
  const [items,      setItems]      = useState<ImportedItem[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const esRef = useRef<boolean>(false);

  async function handleParse() {
    const raw = urlsText.split(/[\n,]+/).map((u) => u.trim()).filter((u) => u.startsWith("http"));
    if (raw.length === 0) return;
    const deduped = [...new Set(raw)].slice(0, 20);

    setItems(deduped.map((url) => ({ url, title: "", authors: [], abstract: "", tags: [], sourceType, status: "parsing" as const, selected: false })));
    setStep("parsing");
    esRef.current = true;

    // Use SSE batch endpoint
    const res = await fetch(`${apiBase()}/api/resources/import/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ urls: deduped, source_type: sourceType }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    while (esRef.current) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        const dataLine = line.split("\n").find((l) => l.startsWith("data:"));
        if (!dataLine) continue;
        try {
          const event = JSON.parse(dataLine.slice(5));
          if (event.done) { setStep("review"); break; }
          if (event.index != null) {
            setItems((prev) => {
              const next = [...prev];
              const it = next[event.index];
              if (!it) return next;
              if (event.status === "done" && event.data) {
                next[event.index] = { ...it, ...event.data, status: "done", selected: true };
              } else if (event.status === "error") {
                next[event.index] = { ...it, status: "error", error: event.error };
              }
              return next;
            });
          }
        } catch { /* ignore parse error */ }
      }
    }
  }

  function toggleItem(idx: number) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, selected: !it.selected } : it));
  }
  function updateItemTags(idx: number, tags: string[]) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, tags } : it));
  }

  async function handleSaveSelected() {
    const toSave = items.filter((it) => it.status === "done" && it.selected);
    if (toSave.length === 0) return;
    setStep("saving");
    let saved = 0;
    for (const it of toSave) {
      try {
        await fetch(`${apiBase()}/api/resources`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            title: it.title, sourceType: it.sourceType, url: it.url,
            authors: it.authors, abstract: it.abstract, tags: it.tags,
          }),
        });
        saved++;
      } catch { /* continue */ }
    }
    setSavedCount(saved);
    setStep("done");
    setTimeout(() => { onSaved(); onClose(); }, 1500);
  }

  const doneItems = items.filter((it) => it.status === "done");
  const errorItems = items.filter((it) => it.status === "error");
  const selectedCount = items.filter((it) => it.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <List className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">{zh ? "批量导入文献" : "Batch Import"}</h2>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {step === "input" && (
            <>
              <p className="text-xs text-muted-foreground">
                {zh ? "每行或逗号分隔粘贴多个 URL（最多 20 条），AI 将并行解析所有文献元数据。"
                  : "Paste multiple URLs (one per line or comma-separated, max 20). AI will parse all in parallel."}
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "资源类型（统一）" : "Default Source Type"}</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {SOURCE_TYPE_OPTIONS.map((opt) => (
                    <button key={opt} onClick={() => setSourceType(opt)}
                      className={`text-xs px-2 py-1.5 rounded-lg border transition-colors text-center ${sourceType === opt ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 text-muted-foreground border-border hover:border-primary/40"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">URLs</label>
                <textarea value={urlsText} onChange={(e) => setUrlsText(e.target.value)} rows={8}
                  placeholder={zh ? "https://example.com/paper1\nhttps://example.com/paper2\n..." : "https://example.com/paper1\nhttps://example.com/paper2\n..."}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none font-mono placeholder:text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {urlsText.split(/[\n,]+/).filter((u) => u.trim().startsWith("http")).length} {zh ? "条有效 URL" : "valid URLs"}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">{zh ? "取消" : "Cancel"}</button>
                <button onClick={handleParse}
                  disabled={urlsText.split(/[\n,]+/).filter((u) => u.trim().startsWith("http")).length === 0}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  <Upload className="h-3.5 w-3.5" />{zh ? "开始批量解析" : "Start Parsing"}
                </button>
              </div>
            </>
          )}

          {(step === "parsing" || step === "review") && (
            <>
              <div className="space-y-2">
                {step === "parsing" && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    {zh ? "AI 正在逐条解析，请稍候…" : "AI parsing each URL, please wait…"}
                  </div>
                )}
                {items.map((it, idx) => (
                  <div key={it.url} className={`rounded-lg border p-3 space-y-2 transition-colors ${
                    it.status === "error" ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20" :
                    it.selected ? "border-primary/40 bg-primary/5" : "border-border"
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {it.status === "parsing" && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />}
                        {it.status === "done"    && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                        {it.status === "error"   && <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                        <span className="text-xs font-medium truncate text-foreground">
                          {it.status === "done" ? it.title || it.url : it.url}
                        </span>
                      </div>
                      {it.status === "done" && (
                        <button onClick={() => toggleItem(idx)}
                          className={`shrink-0 text-xs px-2 py-0.5 rounded-full border transition-colors ${
                            it.selected ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                          }`}>
                          {it.selected ? (zh ? "已选" : "Selected") : (zh ? "选择" : "Select")}
                        </button>
                      )}
                    </div>
                    {it.status === "done" && it.selected && (
                      <div className="pl-5">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-xs text-muted-foreground">{zh ? "标签：" : "Tags:"}</span>
                          {it.tags.map((tag) => (
                            <span key={tag} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                              {tag}
                              <button onClick={() => updateItemTags(idx, it.tags.filter((t) => t !== tag))} className="hover:text-red-500">
                                <X className="h-2 w-2" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {it.status === "error" && (
                      <p className="pl-5 text-xs text-red-600 dark:text-red-400">{it.error ?? "Failed"}</p>
                    )}
                  </div>
                ))}
              </div>

              {step === "review" && (
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    {doneItems.length} {zh ? "条解析成功" : "parsed"}{errorItems.length > 0 && `，${errorItems.length} ${zh ? "条失败" : " failed"}`}
                  </p>
                  <button onClick={handleSaveSelected} disabled={selectedCount === 0}
                    className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                    <Check className="h-3.5 w-3.5" />
                    {zh ? `确认入库 (${selectedCount})` : `Save ${selectedCount} Selected`}
                  </button>
                </div>
              )}
            </>
          )}

          {step === "saving" && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">{zh ? "正在批量保存…" : "Saving…"}</p>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                <Check className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm font-medium">
                {zh ? `已提交 ${savedCount} 篇文献` : `${savedCount} resource${savedCount !== 1 ? "s" : ""} submitted`}
              </p>
            </div>
          )}
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
  const [selectedTags,  setSelectedTags]  = useState<Set<string>>(new Set());
  const [apiResources,  setApiResources]  = useState<Resource[] | null>(null);
  const [isLoading,     setIsLoading]     = useState(true);
  const [importMode,    setImportMode]    = useState<"none" | "single" | "batch">("none");
  const [editResource,  setEditResource]  = useState<Resource | null>(null);
  const [adminView,     setAdminView]     = useState(false);
  const [pendingCount,  setPendingCount]  = useState(0);

  const isAdmin = user?.role === "admin";

  const fetchResources = useCallback(() => {
    setIsLoading(true);
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    fetch(`${apiBase()}/api/resources`, { headers })
      .then((r) => r.json())
      .then((data: Resource[]) => {
        if (!Array.isArray(data)) { setApiResources(null); return; }
        if (isAdmin) setPendingCount(data.filter((r: Resource) => r.status === "pending").length);
        // Fall back to mock data only when unauthenticated AND DB is empty
        setApiResources(!user && data.length === 0 ? null : data);
      })
      .catch(() => setApiResources(null))
      .finally(() => setIsLoading(false));
  }, [token, isAdmin, user]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  async function handleApprove(id: number) {
    await fetch(`${apiBase()}/api/resources/${id}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token!}` },
      body: JSON.stringify({ status: "approved" }),
    });
    fetchResources();
  }

  async function handleReject(id: number) {
    await fetch(`${apiBase()}/api/resources/${id}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token!}` },
      body: JSON.stringify({ status: "rejected" }),
    });
    fetchResources();
  }

  const resources = apiResources ?? MOCK_RESOURCES;
  const usingMock = apiResources === null && !isLoading;

  const allTags = useMemo(
    () => Array.from(new Set(resources.filter((r) => r.status === "approved").flatMap((r) => r.tags))).sort(),
    [resources],
  );

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) => { const n = new Set(prev); n.has(tag) ? n.delete(tag) : n.add(tag); return n; });

  // Admin approval center: only pending items
  const pendingResources = useMemo(() => resources.filter((r) => r.status === "pending"), [resources]);

  // Normal filtered list
  const filtered = useMemo(() => {
    if (selectedType === "Expert") return [];
    const pool = adminView ? pendingResources : resources;
    return pool.filter((r) => {
      if (!adminView && r.status === "rejected") return false; // hide rejected from normal view unless owner/admin
      const matchType = selectedType === "All" || r.sourceType === selectedType;
      const matchTags = selectedTags.size === 0 || [...selectedTags].every((t) => r.tags.includes(t));
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q || r.title.toLowerCase().includes(q) ||
        (r.abstract ?? "").toLowerCase().includes(q) ||
        r.authors.some((a) => a.toLowerCase().includes(q)) ||
        r.tags.some((tg) => tg.toLowerCase().includes(q));
      return matchType && matchTags && matchSearch;
    });
  }, [resources, searchQuery, selectedType, selectedTags, adminView, pendingResources]);

  const showExperts = selectedType === "Expert";
  const hasActiveFilters = selectedType !== "All" || selectedTags.size > 0 || searchQuery;

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
              <button onClick={() => setImportMode("single")}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                <Upload className="h-4 w-4" />{zh ? "导入文献" : "Import"}
              </button>
              <button onClick={() => setImportMode("batch")}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                <List className="h-4 w-4" />{zh ? "批量导入" : "Batch Import"}
              </button>
            </div>
          )}
        </div>

        {/* Admin approval center toggle */}
        {isAdmin && pendingCount > 0 && (
          <button onClick={() => setAdminView((v) => !v)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
              adminView
                ? "bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300"
                : "border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            }`}>
            <ShieldCheck className="h-4 w-4" />
            {zh ? `审核中心（${pendingCount} 条待审核）` : `Approval Center (${pendingCount} Pending)`}
            {adminView && <X className="h-3.5 w-3.5" />}
          </button>
        )}

        {usingMock && (
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-1.5 inline-block">
            {t("Showing sample data — connect the database to display live content.", "当前显示示例数据，连接数据库后将展示真实内容。")}
          </p>
        )}
      </div>

      {/* ── Search ── */}
      {!adminView && (
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("Search by title, abstract, author or tag…", "按标题、摘要、作者或标签搜索…")}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors placeholder:text-muted-foreground" />
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── Sidebar (hidden in admin view) ── */}
        {!adminView && (
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
            {!showExperts && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t("Filter by Tags", "按标签筛选")}</p>
                  {selectedTags.size > 0 && (
                    <button onClick={() => setSelectedTags(new Set())} className="text-xs text-primary hover:underline">{t("Clear", "清除")}</button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map((tag) => (
                    <button key={tag} onClick={() => toggleTag(tag)}
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        selectedTags.has(tag) ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                      }`}>
                      <Tag className="h-2.5 w-2.5" />{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}

        {/* ── Results ── */}
        <div className="flex-1 min-w-0 space-y-4">
          {showExperts && !adminView && <ExpertPanel language={language} />}

          {(adminView || !showExperts) && (
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
                {!adminView && hasActiveFilters && (
                  <button onClick={() => { setSelectedType("All"); setSelectedTags(new Set()); setSearchQuery(""); }}
                    className="text-xs text-primary hover:underline">{t("Reset filters", "重置筛选")}</button>
                )}
              </div>

              {!isLoading && filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                  {adminView
                    ? <><ShieldCheck className="h-10 w-10 text-emerald-500/50" /><p className="font-medium text-muted-foreground">{zh ? "暂无待审核文献" : "No pending resources"}</p></>
                    : <><Search className="h-10 w-10 text-muted-foreground/30" /><p className="font-medium text-muted-foreground">{t("No resources found", "未找到相关资源")}</p></>
                  }
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map((r) => (
                    <ResourceCard key={r.id} r={r} language={language}
                      currentUserId={user?.id} isAdmin={isAdmin}
                      onApprove={isAdmin ? handleApprove : undefined}
                      onReject={isAdmin ? handleReject : undefined}
                      onEdit={setEditResource}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {importMode === "single" && token && (
        <SingleImportModal token={token} language={language} onClose={() => setImportMode("none")} onSaved={fetchResources} />
      )}
      {importMode === "batch" && token && (
        <BatchImportModal token={token} language={language} onClose={() => setImportMode("none")} onSaved={fetchResources} />
      )}
      {editResource && token && (
        <EditModal resource={editResource} token={token} language={language} onClose={() => setEditResource(null)} onSaved={fetchResources} />
      )}
    </div>
  );
}
