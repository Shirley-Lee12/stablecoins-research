import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import {
  ResourceDetailModal, EditModal, JobQueuePanel,
  SELF_SERVICE_STATUSES, SELF_SERVICE_LABELS,
  type Resource, type RejectionReason,
} from "@/pages/academic-resources";
import { Loader2, Inbox, ChevronRight, Shield } from "lucide-react";

function apiBase() {
  return (import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL).replace(/\/$/, "");
}

type FilterKey = "all" | "needs_action" | "pending" | "rejected" | "approved";

const STATUS_BADGE: Record<string, { zh: string; en: string; cls: string }> = {
  pending:  { zh: "待审核", en: "Pending",  cls: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700" },
  approved: { zh: "已通过", en: "Approved", cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" },
  rejected: { zh: "已拒绝", en: "Rejected", cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800" },
  incomplete: { zh: SELF_SERVICE_LABELS.incomplete.zh, en: SELF_SERVICE_LABELS.incomplete.en, cls: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700" },
  disputed:   { zh: SELF_SERVICE_LABELS.disputed.zh,   en: SELF_SERVICE_LABELS.disputed.en,   cls: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700" },
  off_topic:  { zh: SELF_SERVICE_LABELS.off_topic.zh,  en: SELF_SERVICE_LABELS.off_topic.en,   cls: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700" },
  duplicate:  { zh: SELF_SERVICE_LABELS.duplicate.zh,  en: SELF_SERVICE_LABELS.duplicate.en,   cls: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700" },
};

function StatChip({ label, count, active, color, onClick }: { label: string; count: number; active: boolean; color?: "amber"; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
        active
          ? color === "amber"
            ? "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-950/60 dark:border-amber-700 dark:text-amber-300"
            : "bg-primary/10 border-primary/30 text-primary"
          : "bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
      }`}>
      {label}
      <span className="tabular-nums">{count}</span>
    </button>
  );
}

export default function MyContributionsPage() {
  const { user, token } = useAuth();
  const { language } = useLanguage();
  const zh = language === "zh";

  const [resources, setResources] = useState<Resource[]>([]);
  const [rejectionReasons, setRejectionReasons] = useState<RejectionReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [viewing, setViewing] = useState<Resource | null>(null);
  const [editing, setEditing] = useState<Resource | null>(null);

  const fetchMine = useCallback(() => {
    if (!token || !user) return;
    setLoading(true);
    fetch(`${apiBase()}/api/resources`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data: Resource[]) => setResources(Array.isArray(data) ? data.filter((r) => r.createdBy === user.id) : []))
      .catch(() => setResources([]))
      .finally(() => setLoading(false));
  }, [token, user]);

  useEffect(() => { fetchMine(); }, [fetchMine]);
  useEffect(() => {
    fetch(`${apiBase()}/api/rejection-reasons`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setRejectionReasons(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of resources) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [resources]);
  const needsActionCount = SELF_SERVICE_STATUSES.reduce((sum, s) => sum + (counts[s] ?? 0), 0);

  const filtered = useMemo(() => {
    if (filter === "all") return resources;
    if (filter === "needs_action") return resources.filter((r) => SELF_SERVICE_STATUSES.includes(r.status));
    return resources.filter((r) => r.status === filter);
  }, [resources, filter]);

  if (!user || !token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <Shield className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-lg font-semibold text-muted-foreground">{zh ? "请先登录" : "Please sign in"}</p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-md mx-auto space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-serif font-bold text-primary">{zh ? "我的贡献" : "My Contributions"}</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {zh ? "追踪你提交的所有文献资源，包括正在处理、需要补充信息、审核中和已通过的。"
              : "Track every resource you've submitted — processing, needing your attention, under review, or already published."}
        </p>
      </div>

      {/* Summary stat bar (docs/planning/15 §2.1) */}
      <div className="flex flex-wrap gap-2">
        <StatChip label={zh ? "共" : "Total"} count={resources.length} active={filter === "all"} onClick={() => setFilter("all")} />
        <StatChip label={zh ? "需处理" : "Needs action"} count={needsActionCount} active={filter === "needs_action"} color="amber" onClick={() => setFilter("needs_action")} />
        <StatChip label={zh ? "待审核" : "Pending"} count={counts.pending ?? 0} active={filter === "pending"} onClick={() => setFilter("pending")} />
        <StatChip label={zh ? "已拒绝" : "Rejected"} count={counts.rejected ?? 0} active={filter === "rejected"} onClick={() => setFilter("rejected")} />
        <StatChip label={zh ? "已通过" : "Approved"} count={counts.approved ?? 0} active={filter === "approved"} onClick={() => setFilter("approved")} />
      </div>

      {/* Still-processing jobs (upload_jobs — not yet confirmed into a resources row) */}
      <JobQueuePanel token={token} language={language} onSaved={fetchMine} />

      {/* Confirmed resources, all statuses */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">{zh ? "加载中…" : "Loading…"}</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{zh ? "这里还没有内容" : "Nothing here yet"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const badge = STATUS_BADGE[r.status];
            const rejectionReason = r.rejectionReasonId != null ? rejectionReasons.find((x) => x.id === r.rejectionReasonId) : undefined;
            return (
              <button key={r.id} onClick={() => setViewing(r)}
                className="w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all text-left">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {badge && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${badge.cls}`}>
                        {zh ? badge.zh : badge.en}
                      </span>
                    )}
                    <span className="text-sm font-medium text-foreground line-clamp-1">{r.title}</span>
                  </div>
                  {r.status === "rejected" && (
                    <p className="text-xs text-red-600/80 dark:text-red-400/80">
                      {rejectionReason ? (zh ? rejectionReason.nameZh : rejectionReason.nameEn) : (zh ? "未说明理由" : "No reason specified")}
                      {r.rejectionNote && ` — ${r.rejectionNote}`}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {viewing && (
        <ResourceDetailModal
          resource={viewing}
          language={language}
          onClose={() => setViewing(null)}
          footer={
            (SELF_SERVICE_STATUSES.includes(viewing.status) || viewing.status === "rejected") ? (
              <div className="flex justify-end">
                <button onClick={() => setEditing(viewing)}
                  className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  {zh ? "修改并重新提交" : "Edit & Resubmit"}
                </button>
              </div>
            ) : undefined
          }
        />
      )}

      {editing && (
        <EditModal
          resource={editing}
          token={token}
          language={language}
          isAdmin={false}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); setViewing(null); fetchMine(); }}
        />
      )}
    </div>
  );
}
