import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { authenticatedFetch, useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield, Users, CheckSquare, FileText, Settings as SettingsIcon,
  Clock, Check, X, Loader2, ChevronRight, Database, Mail, Sparkles, History, Pencil, RefreshCw, Tag,
  Bell, Play, Trash2, ExternalLink, Eye, ShieldCheck, TriangleAlert, ShieldAlert, ArrowLeft,
} from "lucide-react";
import {
  ResourceDetailModal, RejectDialog, EditModal, VerifyReportList,
  type Resource, type RejectionReason, type VerifyReport,
} from "@/pages/academic-resources";

// ── Types ─────────────────────────────────────────────────────────────────────
interface UserRow {
  id: number; email: string; name: string;
  role: "user" | "admin"; createdAt: string;
}
interface ReviewLogEntry {
  id: number; title: string; status: "approved" | "rejected";
  submitterEmail: string | null; createdAt: string; reviewedAt: string | null; reviewerEmail: string | null;
  rejectionReasonId: number | null; rejectionNote: string | null;
}
interface BackgroundTask {
  id: number;
  type: string;
  status: "queued" | "processing" | "waiting_external" | "completed" | "failed";
  total: number;
  processed: number;
  error: string | null;
  result?: {
    phase?: string;
    source?: string;
    found?: number;
    added?: number;
    sources?: Record<string, { found: number; error?: string }>;
  } | null;
  createdAt: string;
  completedAt: string | null;
}

function formatAuditTimestamp(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).format(date);
}
/** docs/planning/19 §19.3 */
interface DuplicateCandidateInfo {
  candidateResourceId: number;
  matchType: "exact_doi" | "exact_url" | "fuzzy_title";
  title: string;
  authors: string[];
  publishedDate: string | null;
}

function apiBase() {
  return (import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL).replace(/\/$/, "");
}

// ── User Management Panel ─────────────────────────────────────────────────────
function UserManagementPanel({ token, language, currentUserId }: { token: string; language: string; currentUserId?: number }) {
  const zh = language === "zh";
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadUsers = () => {
    setLoading(true);
    authenticatedFetch(`${apiBase()}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(loadUsers, [token]);

  async function toggleRole(u: UserRow) {
    const nextRole = u.role === "admin" ? "user" : "admin";
    setUpdatingId(u.id);
    try {
      const res = await authenticatedFetch(`${apiBase()}/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: nextRole }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
      }
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">{zh ? "用户权限管理" : "User Management"}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {zh ? "查看所有注册用户，管理角色权限。" : "View all registered users and manage their roles."}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">{zh ? "加载中…" : "Loading…"}</span>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Users className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {zh ? "暂无用户数据" : "No users found"}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{zh ? "用户" : "User"}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{zh ? "邮箱" : "Email"}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{zh ? "角色" : "Role"}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{zh ? "注册时间" : "Joined"}</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">{zh ? "操作" : "Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                      u.role === "admin"
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}>
                      {u.role === "admin" ? (zh ? "管理员" : "Admin") : (zh ? "普通用户" : "User")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString(zh ? "zh-CN" : "en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleRole(u)}
                      disabled={updatingId === u.id || u.id === currentUserId}
                      title={u.id === currentUserId ? (zh ? "不能修改自己的角色" : "You cannot change your own role") : undefined}
                      className="text-xs px-2.5 py-1 rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {updatingId === u.id
                        ? <Loader2 className="h-3 w-3 animate-spin inline" />
                        : u.role === "admin"
                          ? (zh ? "降为普通用户" : "Demote to User")
                          : (zh ? "升为管理员" : "Promote to Admin")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Settings Panel (read-only — all configuration lives in server .env) ───────
// Mirrors the actual shape returned by GET /api/admin/settings/status.
interface SettingsStatus {
  database: { configured: boolean };
  auth: { jwtSecret: string };
  llm: { provider: string; model: string; apiKey: string };
  email: { provider: string; from: string; credential: string };
  frontendUrl: string;
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-sm font-mono text-foreground truncate max-w-[60%] text-right">{value}</span>
    </div>
  );
}

function SettingsPanel({ token, language }: { token: string; language: string }) {
  const zh = language === "zh";
  const [status, setStatus] = useState<SettingsStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    authenticatedFetch(`${apiBase()}/api/admin/settings/status`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then(setStatus)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">{zh ? "加载中…" : "Loading…"}</span>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <SettingsIcon className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">{zh ? "无法加载配置状态" : "Failed to load configuration status"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-base font-semibold">{zh ? "系统配置状态" : "System Configuration Status"}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {zh ? "所有配置项均通过服务器环境变量（.env）管理，此处仅供只读查看，无法在线修改。"
              : "All configuration is managed via server environment variables (.env). This view is read-only and cannot be edited here."}
        </p>
      </div>

      <div className="rounded-xl border border-border p-5 space-y-1">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
          <Database className="h-4 w-4 text-primary" />
          {zh ? "数据库" : "Database"}
        </h3>
        <StatusRow label={zh ? "连接状态" : "Connection"} value={status.database.configured ? (zh ? "已连接" : "Connected") : (zh ? "未连接" : "Not connected")} />
      </div>

      <div className="rounded-xl border border-border p-5 space-y-1">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
          <Mail className="h-4 w-4 text-primary" />
          {zh ? "邮件发送（HTTPS API）" : "Email Sending (HTTPS API)"}
        </h3>
        <StatusRow label={zh ? "服务商" : "Provider"} value={status.email.provider} />
        <StatusRow label={zh ? "发件邮箱" : "Sender Email"} value={status.email.from} />
        <StatusRow label={zh ? "凭据" : "Credential"} value={status.email.credential} />
      </div>

      <div className="rounded-xl border border-border p-5 space-y-1">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {zh ? "AI 服务" : "AI Service"}
        </h3>
        <StatusRow label={zh ? "提供商" : "Provider"} value={status.llm.provider} />
        <StatusRow label={zh ? "模型" : "Model"} value={status.llm.model} />
        <StatusRow label="API Key" value={status.llm.apiKey} />
      </div>

      <div className="rounded-xl border border-border p-5 space-y-1">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
          <Shield className="h-4 w-4 text-primary" />
          {zh ? "鉴权" : "Auth"}
        </h3>
        <StatusRow label="JWT Secret" value={status.auth.jwtSecret} />
        <StatusRow label="Frontend URL" value={status.frontendUrl} />
      </div>
    </div>
  );
}

// ── Approvals Panel (docs/planning/15 §2.2) ───────────────────────────────────
// Full flow: click a queued resource -> full detail view (reused ResourceDetailModal, extended
// with a live verify report + Approve/Reject/Edit actions) -> Reject requires a controlled reason
// (reused RejectDialog) -> Edit reuses EditModal in admin mode (facet tags, no re-verification).
function ApprovalsPanel({ token, language, isAdmin }: { token: string; language: string; isAdmin: boolean }) {
  const zh = language === "zh";
  const [resources, setResources] = useState<Resource[]>([]);
  const [reasons, setReasons] = useState<RejectionReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Resource | null>(null);
  const [verifyReport, setVerifyReport] = useState<VerifyReport | null>(null);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reverifying, setReverifying] = useState(false);
  const [rejecting, setRejecting] = useState<Resource | null>(null);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [aiFilter, setAiFilter] = useState("all");
  const [bulkRejecting, setBulkRejecting] = useState(false);
  const [bulkReasonId, setBulkReasonId] = useState("");
  const [bulkNote, setBulkNote] = useState("");
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidateInfo[]>([]);
  const requestedAiIds = useRef<Set<number>>(new Set());

  const queueAiReview = useCallback(async (ids: number[], force = false) => {
    if (ids.length === 0) return;
    ids.forEach((id) => requestedAiIds.current.add(id));
    setResources((current) => current.map((resource) => ids.includes(resource.id)
      ? { ...resource, aiReviewStatus: "processing", aiReviewSummary: null }
      : resource));
    const response = await authenticatedFetch(`${apiBase()}/api/admin/resources/pre-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ resourceIds: ids, force }),
    });
    if (!response.ok) {
      ids.forEach((id) => requestedAiIds.current.delete(id));
      throw new Error("Failed to queue AI review");
    }
  }, [token]);

  const fetchPending = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await authenticatedFetch(`${apiBase()}/api/resources?status=pending`, { headers: { Authorization: `Bearer ${token}` } });
      const data = response.ok ? await response.json() : [];
      const rows: Resource[] = Array.isArray(data) ? data : [];
      rows.filter((row) => row.aiReviewStatus && !["not_started", "processing"].includes(row.aiReviewStatus)).forEach((row) => requestedAiIds.current.delete(row.id));
      setResources(rows);
      setSelectedIds((current) => new Set([...current].filter((id) => rows.some((row) => row.id === id))));
      const unreviewedIds = rows.filter((row) => (!row.aiReviewStatus || row.aiReviewStatus === "not_started") && !requestedAiIds.current.has(row.id)).map((row) => row.id);
      if (unreviewedIds.length > 0) void queueAiReview(unreviewedIds).catch(() => undefined);
    } catch {
      setResources([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [queueAiReview, token]);

  useEffect(() => { void fetchPending(); }, [fetchPending]);
  useEffect(() => {
    authenticatedFetch(`${apiBase()}/api/rejection-reasons`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setReasons(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!resources.some((resource) => resource.aiReviewStatus === "processing" || resource.aiReviewStatus === "not_started" || !resource.aiReviewStatus)) return;
    const timer = window.setTimeout(() => { void fetchPending(false); }, 2500);
    return () => window.clearTimeout(timer);
  }, [fetchPending, resources]);

  const filteredResources = useMemo(() => resources.filter((resource) => {
    if (aiFilter === "all") return true;
    if (aiFilter === "processing") return !resource.aiReviewStatus || resource.aiReviewStatus === "not_started" || resource.aiReviewStatus === "processing";
    return resource.aiReviewStatus === aiFilter;
  }), [aiFilter, resources]);
  const visibleSelected = filteredResources.filter((resource) => selectedIds.has(resource.id));
  const allVisibleSelected = filteredResources.length > 0 && visibleSelected.length === filteredResources.length;

  function fetchVerifyReport(id: number) {
    setVerifyReport(null);
    setVerifiedAt(null);
    setReportLoading(true);
    authenticatedFetch(`${apiBase()}/api/admin/resources/${id}/verify-report`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { report: VerifyReport | null; verifiedAt: string | null } | null) => {
        setVerifyReport(data?.report ?? null);
        setVerifiedAt(data?.verifiedAt ?? null);
      })
      .finally(() => setReportLoading(false));
  }

  function openDetail(resource: Resource) {
    setViewing(resource);
    fetchVerifyReport(resource.id);
    setDuplicateCandidates([]);
    if (resource.duplicateNote) {
      authenticatedFetch(`${apiBase()}/api/resources/${resource.id}/duplicate-candidates`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setDuplicateCandidates(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }

  async function doReverify() {
    if (!viewing) return;
    if (!confirm(zh ? "重新核验会调用外部 DOI/链接检查接口，确定要继续吗？" : "Re-verifying calls external DOI/link-check APIs. Continue?")) return;
    setReverifying(true);
    try {
      const res = await authenticatedFetch(`${apiBase()}/api/admin/resources/${viewing.id}/reverify`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data: { report: VerifyReport; verifiedAt: string } = await res.json();
        setVerifyReport(data.report);
        setVerifiedAt(data.verifiedAt);
      }
    } finally { setReverifying(false); }
  }

  async function doApprove(id: number) {
    setBusy(true);
    try {
      const response = await authenticatedFetch(`${apiBase()}/api/admin/resources/${id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "approve" }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        alert(body.error ?? (zh ? "通过失败" : "Approval failed"));
        return;
      }
      setViewing(null);
      await fetchPending(false);
    } finally { setBusy(false); }
  }

  async function submitReject(reasonId: number, note: string) {
    if (!rejecting) return;
    const res = await authenticatedFetch(`${apiBase()}/api/admin/resources/${rejecting.id}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "reject", rejectionReasonId: reasonId, rejectionNote: note || undefined }),
    });
    if (!res.ok) throw new Error("Reject failed");
    setRejecting(null);
    setViewing(null);
    await fetchPending(false);
  }

  async function bulkReview(action: "approve" | "reject") {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (action === "approve" && !confirm(zh ? `确定批量通过选中的 ${ids.length} 条资源吗？` : `Approve ${ids.length} selected resources?`)) return;
    if (action === "reject" && !bulkReasonId) return;
    setBusy(true);
    try {
      const response = await authenticatedFetch(`${apiBase()}/api/admin/resources/bulk-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          resourceIds: ids,
          action,
          ...(action === "reject" && { rejectionReasonId: Number(bulkReasonId), rejectionNote: bulkNote.trim() || undefined }),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Bulk review failed");
      if (data.skippedIds?.length) alert(zh ? `${data.skippedIds.length} 条因状态已变化或 AI 尚未完成而跳过。` : `${data.skippedIds.length} items were skipped because their state changed or AI review is unfinished.`);
      setSelectedIds(new Set());
      setBulkRejecting(false);
      setBulkReasonId("");
      setBulkNote("");
      await fetchPending(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : (zh ? "批量操作失败" : "Bulk action failed"));
    } finally { setBusy(false); }
  }

  function toggleSelected(id: number) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function aiBadge(resource: Resource) {
    const status = resource.aiReviewStatus ?? "not_started";
    if (status === "safe") return <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300"><ShieldCheck className="h-3.5 w-3.5" />{zh ? "可快速审核" : "Likely safe"}</span>;
    if (status === "needs_verification") return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300"><TriangleAlert className="h-3.5 w-3.5" />{zh ? "需进一步核验" : "Verify further"}</span>;
    if (status === "high_risk") return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-300"><ShieldAlert className="h-3.5 w-3.5" />{zh ? "不建议直接通过" : "High risk"}</span>;
    if (status === "failed") return <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><TriangleAlert className="h-3.5 w-3.5" />{zh ? "AI 审核失败" : "AI review failed"}</span>;
    return <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />{zh ? "AI 审核中" : "AI reviewing"}</span>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{zh ? "待审核资源" : "Pending Approvals"}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{zh ? "先查看链接访问和 AI 简报，再进行单条或批量审核。" : "Review link evidence and the AI brief before individual or bulk decisions."}</p>
        </div>
        <select value={aiFilter} onChange={(event) => setAiFilter(event.target.value)} className="h-9 rounded-md border border-border bg-background px-3 text-xs">
          <option value="all">{zh ? `全部（${resources.length}）` : `All (${resources.length})`}</option>
          <option value="safe">{zh ? "可快速审核" : "Likely safe"}</option>
          <option value="needs_verification">{zh ? "需进一步核验" : "Verify further"}</option>
          <option value="high_risk">{zh ? "不建议直接通过" : "High risk"}</option>
          <option value="processing">{zh ? "AI 审核中" : "AI reviewing"}</option>
          <option value="failed">{zh ? "AI 审核失败" : "AI failed"}</option>
        </select>
      </div>

      {resources.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-y border-border py-3">
          <span className="text-xs text-muted-foreground mr-1">{zh ? `已选 ${selectedIds.size} 条` : `${selectedIds.size} selected`}</span>
          <button onClick={() => setSelectedIds(new Set(resources.filter((resource) => resource.aiReviewStatus === "safe").map((resource) => resource.id)))} className="h-8 px-3 rounded-md border border-border text-xs hover:bg-muted">
            {zh ? "选择可快速审核" : "Select likely safe"}
          </button>
          <button disabled={selectedIds.size === 0 || busy} onClick={() => void queueAiReview([...selectedIds], true)} className="h-8 inline-flex items-center gap-1.5 px-3 rounded-md border border-border text-xs hover:bg-muted disabled:opacity-40">
            <RefreshCw className="h-3.5 w-3.5" />{zh ? "重新 AI 核验" : "Run AI again"}
          </button>
          <button disabled={selectedIds.size === 0 || busy} onClick={() => void bulkReview("approve")} className="h-8 inline-flex items-center gap-1.5 px-3 rounded-md bg-emerald-700 text-white text-xs hover:bg-emerald-800 disabled:opacity-40">
            <Check className="h-3.5 w-3.5" />{zh ? "批量通过" : "Approve selected"}
          </button>
          <button disabled={selectedIds.size === 0 || busy} onClick={() => setBulkRejecting(true)} className="h-8 inline-flex items-center gap-1.5 px-3 rounded-md border border-red-300 text-red-700 dark:text-red-300 text-xs hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-40">
            <X className="h-3.5 w-3.5" />{zh ? "批量退回" : "Reject selected"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">{zh ? "加载中…" : "Loading…"}</span></div>
      ) : resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center"><Check className="h-10 w-10 text-emerald-400/50" /><p className="text-sm font-medium text-muted-foreground">{zh ? "当前无待审核资源" : "No pending resources"}</p></div>
      ) : filteredResources.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">{zh ? "当前筛选条件下没有资源" : "No resources match this filter"}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-0 md:min-w-[720px] xl:min-w-[900px] text-sm table-fixed">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="w-11 px-3 py-3 text-center"><input type="checkbox" checked={allVisibleSelected} onChange={() => setSelectedIds((current) => {
                  const next = new Set(current);
                  if (allVisibleSelected) filteredResources.forEach((resource) => next.delete(resource.id)); else filteredResources.forEach((resource) => next.add(resource.id));
                  return next;
                })} aria-label={zh ? "选择当前列表" : "Select visible rows"} /></th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground md:w-[34%] xl:w-[30%]">{zh ? "资源" : "Resource"}</th>
                <th className="hidden w-[16%] px-3 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">{zh ? "链接" : "Link"}</th>
                <th className="hidden w-[17%] px-3 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">{zh ? "AI 结论" : "AI result"}</th>
                <th className="hidden px-3 py-3 text-left text-xs font-medium text-muted-foreground xl:table-cell">{zh ? "简要依据" : "Brief evidence"}</th>
                <th className="w-36 px-3 py-3 text-right text-xs font-medium text-muted-foreground sm:w-44">{zh ? "操作" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredResources.map((resource) => {
                const href = resource.url ?? (resource.doi ? `https://doi.org/${resource.doi}` : null);
                const details = resource.aiReviewDetails;
                const summary = zh ? details?.summaryZh : details?.summaryEn;
                return (
                  <tr key={resource.id} className="hover:bg-muted/30 align-top">
                    <td className="px-3 py-3 text-center"><input type="checkbox" checked={selectedIds.has(resource.id)} onChange={() => toggleSelected(resource.id)} aria-label={zh ? `选择 ${resource.title}` : `Select ${resource.title}`} /></td>
                    <td className="px-3 py-3">
                      <button onClick={() => openDetail(resource)} className="block w-full text-left font-medium leading-snug hover:text-primary line-clamp-2">{resource.title}</button>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{resource.authors.join("; ") || (zh ? "作者未知" : "Unknown author")} · {resource.publishedDate ?? resource.sourceType}</p>
                      <div className="mt-2 space-y-1 md:hidden">
                        {aiBadge(resource)}
                        <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">{summary ?? resource.aiReviewSummary ?? (zh ? "等待 AI 生成简报" : "Waiting for AI brief")}</p>
                        {href && <a href={href} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 text-xs text-primary"><ExternalLink className="h-3 w-3 shrink-0" /><span className="truncate">{details?.link?.hostname ?? resource.doi ?? resource.url}</span></a>}
                      </div>
                    </td>
                    <td className="hidden px-3 py-3 md:table-cell">
                      {href ? <a href={href} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 text-xs text-primary hover:underline"><ExternalLink className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{details?.link?.hostname ?? resource.doi ?? resource.url}</span></a> : <span className="text-xs text-muted-foreground">{zh ? "无链接" : "No link"}</span>}
                      {details?.link?.httpStatus && <p className="mt-1 text-xs text-muted-foreground">HTTP {details.link.httpStatus}</p>}
                    </td>
                    <td className="hidden px-3 py-3 md:table-cell">{aiBadge(resource)}{resource.aiReviewedAt && <p className="mt-1 text-xs text-muted-foreground">{new Date(resource.aiReviewedAt).toLocaleString(zh ? "zh-CN" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>}</td>
                    <td className="hidden px-3 py-3 xl:table-cell"><p className="text-xs leading-relaxed text-foreground/80 line-clamp-3">{summary ?? resource.aiReviewSummary ?? (zh ? "等待 AI 生成简报" : "Waiting for AI brief")}</p></td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-0.5 sm:gap-1">
                        <button onClick={() => openDetail(resource)} title={zh ? "查看详情" : "View details"} className="h-7 w-7 sm:h-8 sm:w-8 inline-flex items-center justify-center rounded-md border border-border hover:bg-muted"><Eye className="h-3.5 w-3.5" /></button>
                        <button disabled={resource.aiReviewStatus === "processing" || resource.aiReviewStatus === "not_started"} onClick={() => void queueAiReview([resource.id], true)} title={zh ? "重新 AI 核验" : "Run AI again"} className="h-7 w-7 sm:h-8 sm:w-8 inline-flex items-center justify-center rounded-md border border-border hover:bg-muted disabled:opacity-35"><RefreshCw className="h-3.5 w-3.5" /></button>
                        <button disabled={resource.aiReviewStatus === "processing" || resource.aiReviewStatus === "not_started"} onClick={() => void doApprove(resource.id)} title={zh ? "通过" : "Approve"} className="h-7 w-7 sm:h-8 sm:w-8 inline-flex items-center justify-center rounded-md border border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:opacity-35"><Check className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setRejecting(resource)} title={zh ? "退回" : "Reject"} className="h-7 w-7 sm:h-8 sm:w-8 inline-flex items-center justify-center rounded-md border border-red-300 text-red-700 hover:bg-red-50"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {viewing && (
        <ResourceDetailModal resource={viewing} language={language} onClose={() => setViewing(null)} extraSection={
          <div className="pt-2 border-t border-border space-y-3">
            <div>
              <div className="flex items-center justify-between gap-2"><h3 className="text-xs font-medium text-muted-foreground uppercase">{zh ? "AI 审核简报" : "AI review brief"}</h3><button onClick={() => void queueAiReview([viewing.id], true)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"><RefreshCw className="h-3 w-3" />{zh ? "重新运行" : "Run again"}</button></div>
              <div className="mt-2">{aiBadge(viewing)}</div>
              <p className="mt-1.5 text-sm leading-relaxed">{zh ? viewing.aiReviewDetails?.summaryZh : viewing.aiReviewDetails?.summaryEn}</p>
              {(zh ? viewing.aiReviewDetails?.reasonsZh : viewing.aiReviewDetails?.reasonsEn)?.map((reason, index) => <p key={index} className="mt-1 text-xs text-muted-foreground">• {reason}</p>)}
            </div>
            <div className="border-t border-border pt-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2"><h3 className="text-xs font-medium text-muted-foreground uppercase">{zh ? "字段核对报告" : "Field verification"}</h3>{!reportLoading && <button disabled={reverifying} onClick={doReverify} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary disabled:opacity-50">{reverifying ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}{zh ? "重新核验" : "Re-verify"}</button>}</div>
              {reportLoading ? <div className="flex items-center gap-2 text-xs text-muted-foreground py-2"><Loader2 className="h-3.5 w-3.5 animate-spin" />{zh ? "加载中…" : "Loading…"}</div> : verifyReport ? <><VerifyReportList report={verifyReport} language={language} />{verifiedAt && <p className="text-xs text-muted-foreground/70">{zh ? "核对时间：" : "Verified: "}{new Date(verifiedAt).toLocaleString(zh ? "zh-CN" : "en-US")}</p>}</> : <p className="text-xs text-muted-foreground py-2">{zh ? "尚无核对报告" : "No verification report"}</p>}
            </div>
            {viewing.duplicateNote && <div className="pt-2 space-y-1.5"><h3 className="text-xs font-medium text-muted-foreground uppercase">{zh ? "提交者的重复项说明" : "Duplicate explanation"}</h3><p className="text-xs">{viewing.duplicateNote}</p>{duplicateCandidates.map((candidate) => <div key={candidate.candidateResourceId} className="p-2 rounded-md border border-border"><p className="text-xs font-medium">{candidate.title}</p><p className="text-xs text-muted-foreground">{candidate.authors.join("; ")}{candidate.publishedDate && ` · ${candidate.publishedDate}`}</p></div>)}</div>}
          </div>
        } footer={<div className="flex justify-end gap-2"><button onClick={() => setEditing(viewing)} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border"><Pencil className="h-3 w-3" />{zh ? "编辑" : "Edit"}</button><button disabled={busy} onClick={() => setRejecting(viewing)} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-red-300 text-red-700"><X className="h-3 w-3" />{zh ? "退回" : "Reject"}</button><button disabled={busy || viewing.aiReviewStatus === "processing" || viewing.aiReviewStatus === "not_started"} onClick={() => void doApprove(viewing.id)} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-emerald-700 text-white disabled:opacity-40">{busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}{zh ? "通过" : "Approve"}</button></div>} />
      )}

      {rejecting && <RejectDialog resource={rejecting} reasons={reasons} language={language} onClose={() => setRejecting(null)} onSubmit={submitReject} />}
      {editing && <EditModal resource={editing} token={token} language={language} isAdmin={isAdmin} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setViewing(null); void fetchPending(); }} />}

      {bulkRejecting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-xl">
            <h3 className="text-base font-semibold">{zh ? `批量退回 ${selectedIds.size} 条资源` : `Reject ${selectedIds.size} resources`}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{zh ? "所选资源将使用同一个退回原因，提交者仍可看到各自记录。" : "The same reason will be applied to every selected resource."}</p>
            <label className="mt-4 block text-xs font-medium">{zh ? "退回原因" : "Reason"}</label>
            <select value={bulkReasonId} onChange={(event) => setBulkReasonId(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"><option value="">{zh ? "请选择" : "Select a reason"}</option>{reasons.map((reason) => <option key={reason.id} value={reason.id}>{zh ? reason.nameZh : reason.nameEn}</option>)}</select>
            <label className="mt-3 block text-xs font-medium">{zh ? "补充说明（可选）" : "Note (optional)"}</label>
            <textarea value={bulkNote} onChange={(event) => setBulkNote(event.target.value)} rows={3} maxLength={2000} className="mt-1 w-full resize-y rounded-md border border-border bg-background p-3 text-sm" />
            <div className="mt-4 flex justify-end gap-2"><button onClick={() => setBulkRejecting(false)} className="h-9 px-3 rounded-md border border-border text-sm">{zh ? "取消" : "Cancel"}</button><button disabled={!bulkReasonId || busy} onClick={() => void bulkReview("reject")} className="h-9 px-3 rounded-md bg-red-700 text-white text-sm disabled:opacity-40">{busy ? (zh ? "处理中…" : "Working…") : (zh ? "确认批量退回" : "Reject selected")}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Review Log Panel (docs/planning/15 §2.3) ──────────────────────────────────
function ReviewLogPanel({ token, language }: { token: string; language: string }) {
  const zh = language === "zh";
  const [entries, setEntries] = useState<ReviewLogEntry[]>([]);
  const [reasons, setReasons] = useState<RejectionReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"" | "approved" | "rejected">("");
  const [timeOrder, setTimeOrder] = useState<"desc" | "asc">("desc");
  const [viewing, setViewing] = useState<Resource | null>(null);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [openingId, setOpeningId] = useState<number | null>(null);
  const [openError, setOpenError] = useState("");

  useEffect(() => {
    authenticatedFetch(`${apiBase()}/api/rejection-reasons`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setReasons(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ order: timeOrder });
    if (statusFilter) params.set("status", statusFilter);
    const qs = `?${params.toString()}`;
    authenticatedFetch(`${apiBase()}/api/admin/review-log${qs}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setEntries(Array.isArray(data) ? data : []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [token, statusFilter, timeOrder]);

  async function fetchResource(id: number): Promise<Resource | null> {
    const response = await authenticatedFetch(`${apiBase()}/api/resources/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.ok ? response.json() : null;
  }

  async function openResource(id: number) {
    setOpeningId(id);
    setOpenError("");
    try {
      const resource = await fetchResource(id);
      if (!resource) {
        setOpenError(zh ? "无法打开该资源条目" : "This resource could not be opened");
        return;
      }
      setViewing(resource);
    } catch {
      setOpenError(zh ? "加载资源失败，请稍后重试" : "Failed to load resource. Please try again.");
    } finally {
      setOpeningId(null);
    }
  }

  async function handleEditSaved() {
    if (!editing) return;
    const id = editing.id;
    setEditing(null);
    const refreshed = await fetchResource(id).catch(() => null);
    if (refreshed) {
      setViewing(refreshed);
      setEntries((current) => current.map((entry) => entry.id === id ? { ...entry, title: refreshed.title } : entry));
    } else {
      setViewing(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-semibold">{zh ? "审核记录" : "Review Log"}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {zh ? "所有已经过管理员处理的资源（通过或驳回）。" : "Every resource that's been through an admin decision (approved or rejected)."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}
            aria-label={zh ? "按审核结果筛选" : "Filter by review result"}
            className="text-xs px-3 py-1.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">{zh ? "全部结果" : "All results"}</option>
            <option value="approved">{zh ? "已通过" : "Approved"}</option>
            <option value="rejected">{zh ? "已拒绝" : "Rejected"}</option>
          </select>
          <select value={timeOrder} onChange={(e) => setTimeOrder(e.target.value as "desc" | "asc")}
            aria-label={zh ? "按审核时间排序" : "Sort by review time"}
            className="text-xs px-3 py-1.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="desc">{zh ? "审查时间：从新到旧" : "Review time: newest first"}</option>
            <option value="asc">{zh ? "审查时间：从旧到新" : "Review time: oldest first"}</option>
          </select>
        </div>
      </div>

      {openError && <p className="text-xs text-red-600 dark:text-red-400">{openError}</p>}

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">{zh ? "加载中…" : "Loading…"}</span>
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <History className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{zh ? "暂无审核记录" : "No review history yet"}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{zh ? "资源标题" : "Resource"}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{zh ? "提交者" : "Submitter"}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{zh ? "提交时间" : "Submitted"}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{zh ? "处理时间" : "Reviewed"}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{zh ? "处理人" : "Reviewer"}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{zh ? "结果" : "Result"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((e) => {
                const reason = e.rejectionReasonId != null ? reasons.find((x) => x.id === e.rejectionReasonId) : undefined;
                return (
                  <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 max-w-xs">
                      <button onClick={() => void openResource(e.id)} disabled={openingId === e.id}
                        className="w-full text-left font-medium text-foreground hover:text-primary hover:underline line-clamp-1 disabled:opacity-50">
                        {openingId === e.id && <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />}
                        {e.title}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{e.submitterEmail ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleDateString(zh ? "zh-CN" : "en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatAuditTimestamp(e.reviewedAt)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{e.reviewerEmail ?? "—"}</td>
                    <td className="px-4 py-3">
                      {e.status === "approved" ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                          <Check className="h-3 w-3" />{zh ? "已通过" : "Approved"}
                        </span>
                      ) : (
                        <span className="inline-flex flex-col items-start gap-0.5">
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
                            <X className="h-3 w-3" />{zh ? "已拒绝" : "Rejected"}
                          </span>
                          {reason && <span className="text-xs text-muted-foreground">{zh ? reason.nameZh : reason.nameEn}</span>}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {viewing && (
        <ResourceDetailModal resource={viewing} language={language} onClose={() => setViewing(null)}
          footer={
            <div className="flex w-full items-center justify-between gap-2">
              <button onClick={() => setViewing(null)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" />
                {zh ? "返回审查日志" : "Back to Review Log"}
              </button>
              <button onClick={() => setEditing(viewing)}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 transition-colors">
                <Pencil className="h-3.5 w-3.5" />
                {zh ? "编辑" : "Edit"}
              </button>
            </div>
          } />
      )}
      {editing && (
        <EditModal resource={editing} token={token} language={language} isAdmin
          onClose={() => setEditing(null)} onSaved={() => void handleEditSaved()} />
      )}
    </div>
  );
}

// ── Tag/Keyword Suggestions Panel (docs/planning/18 §18.4 step 2) ────────────
// docs/planning/20 §20.1 — generalized from tags/keywords-only to any suggestible field
// (title/authors/publishedDate/abstract/url/doi/keywords/theme·jurisdiction·asset tags). `current`
// and `proposed` only ever contain the keys that were actually part of a given suggestion — a
// title-only suggestion's diff has nothing to show for tags/keywords at all.
interface EditSuggestionTagRef { id: number; slug: string; nameEn: string; nameZh: string; facet: "theme" | "jurisdiction" | "asset" }
interface EditSuggestionFieldSet {
  title?: string; authors?: string[]; publishedDate?: string | null; abstract?: string | null;
  url?: string | null; doi?: string | null; keywords?: string[];
  themeTagRefs?: EditSuggestionTagRef[]; jurisdictionTagRefs?: EditSuggestionTagRef[]; assetTagRefs?: EditSuggestionTagRef[];
}
interface ResourceEditSuggestion {
  id: number; resourceId: number; resourceTitle: string;
  submittedBy: number; submitterEmail: string; submittedAt: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy: number | null; reviewedAt: string | null; reviewNote: string | null;
  current: EditSuggestionFieldSet;
  proposed: EditSuggestionFieldSet;
}

const SUGGESTION_FIELD_LABELS: Record<string, { en: string; zh: string }> = {
  title: { en: "Title", zh: "标题" },
  authors: { en: "Authors", zh: "作者" },
  publishedDate: { en: "Published Date", zh: "发表日期" },
  abstract: { en: "Abstract", zh: "摘要" },
  url: { en: "URL", zh: "URL" },
  doi: { en: "DOI", zh: "DOI" },
  keywords: { en: "Keywords", zh: "关键词" },
  themeTagRefs: { en: "Theme", zh: "主题" },
  jurisdictionTagRefs: { en: "Jurisdiction", zh: "辖区" },
  assetTagRefs: { en: "Asset", zh: "币种" },
};
const SUGGESTION_FIELD_ORDER = ["title", "authors", "publishedDate", "abstract", "url", "doi", "keywords", "themeTagRefs", "jurisdictionTagRefs", "assetTagRefs"];

function TagChips({ tags, zh, emptyLabel }: { tags: EditSuggestionTagRef[]; zh: boolean; emptyLabel: string }) {
  if (tags.length === 0) return <span className="text-xs text-muted-foreground/60">{emptyLabel}</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((t) => (
        <span key={t.id} className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground border border-border/60">
          {zh ? t.nameZh : t.nameEn}
        </span>
      ))}
    </div>
  );
}

/** docs/planning/20 §20.0.6 — plain text, not pills, so it isn't visually confused with the tag system. */
function KeywordText({ keywords, zh, emptyLabel }: { keywords: string[]; zh: boolean; emptyLabel: string }) {
  if (keywords.length === 0) return <span className="text-xs text-muted-foreground/60">{emptyLabel}</span>;
  return <span className="text-xs text-foreground/90">{keywords.join("；")}</span>;
}

/** Renders one field's value in the diff view, dispatching by field key since the value shapes differ (tag refs / string array / plain scalar). */
function SuggestionFieldValue({ fieldKey, value, zh }: { fieldKey: string; value: unknown; zh: boolean }) {
  const emptyLabel = zh ? "无" : "None";
  if (fieldKey === "themeTagRefs" || fieldKey === "jurisdictionTagRefs" || fieldKey === "assetTagRefs") {
    return <TagChips tags={(value as EditSuggestionTagRef[] | undefined) ?? []} zh={zh} emptyLabel={emptyLabel} />;
  }
  if (fieldKey === "keywords") {
    return <KeywordText keywords={(value as string[] | undefined) ?? []} zh={zh} emptyLabel={emptyLabel} />;
  }
  if (fieldKey === "authors") {
    const authors = value as string[] | undefined;
    return authors && authors.length > 0
      ? <span className="text-xs text-foreground/90">{authors.join("; ")}</span>
      : <span className="text-xs text-muted-foreground/60">{emptyLabel}</span>;
  }
  const text = value as string | null | undefined;
  return text
    ? <span className="text-xs text-foreground/90 whitespace-pre-wrap">{text}</span>
    : <span className="text-xs text-muted-foreground/60">{emptyLabel}</span>;
}

/** One "current vs proposed" row inside the diff view — shared across theme/jurisdiction/asset/keywords. */
function DiffRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[80px_1fr] gap-2 items-start">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-0.5">{label}</span>
      {children}
    </div>
  );
}

function TagSuggestionsPanel({ token, language }: { token: string; language: string }) {
  const zh = language === "zh";
  const [suggestions, setSuggestions] = useState<ResourceEditSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<ResourceEditSuggestion | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);

  const fetchPending = useCallback(() => {
    setLoading(true);
    authenticatedFetch(`${apiBase()}/api/admin/edit-suggestions?status=pending`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setSuggestions(Array.isArray(data) ? data : []))
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  async function review(id: number, action: "approve" | "reject", reviewNote?: string) {
    setBusy(true);
    try {
      const res = await authenticatedFetch(`${apiBase()}/api/admin/edit-suggestions/${id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, reviewNote }),
      });
      // docs/planning/18 §18.4 — approving a proposal can move the resource's status (a pre-existing
      // gap can surface, or this fix satisfies one) — never let that happen silently.
      const data = await res.json().catch(() => null);
      if (data?.resourceStatusChanged) {
        const missing = data.resourceStatusChangeReason?.missingFields?.length
          ? (zh ? `缺少：${data.resourceStatusChangeReason.missingFields.join("、")}` : `missing: ${data.resourceStatusChangeReason.missingFields.join(", ")}`)
          : "";
        alert(zh
          ? `注意：该资源状态已从「${data.previousResourceStatus}」变为「${data.newResourceStatus}」。${missing}`
          : `Note: this resource's status changed from "${data.previousResourceStatus}" to "${data.newResourceStatus}". ${missing}`);
      }
      setViewing(null);
      setRejecting(false);
      setRejectNote("");
      fetchPending();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">{zh ? "编辑建议" : "Edit Suggestions"}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {zh ? "普通用户提交的资源修改建议（任意字段），需要管理员审核后才会生效。" : "Non-admin edit proposals for any resource field — reviewed here before they take effect."}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">{zh ? "加载中…" : "Loading…"}</span>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Check className="h-10 w-10 text-emerald-400/50" />
          <p className="text-sm font-medium text-muted-foreground">{zh ? "当前无待审核建议" : "No pending suggestions"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s) => (
            <button key={s.id} onClick={() => setViewing(s)}
              className="w-full flex items-center justify-between gap-4 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/50 dark:hover:bg-amber-950/40 transition-colors text-left">
              <div className="flex items-start gap-3 min-w-0">
                <Tag className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-1">{s.resourceTitle}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.submitterEmail} · {new Date(s.submittedAt).toLocaleDateString(zh ? "zh-CN" : "en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setViewing(null); }}>
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h3 className="text-sm font-semibold line-clamp-1">{viewing.resourceTitle}</h3>
              <button onClick={() => setViewing(null)} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <p className="text-xs text-muted-foreground">
                {zh ? "提交人：" : "Submitted by: "}{viewing.submitterEmail}
                {" · "}{new Date(viewing.submittedAt).toLocaleString(zh ? "zh-CN" : "en-US")}
              </p>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{zh ? "当前" : "Current"}</p>
                <div className="space-y-2 rounded-lg border border-border p-3">
                  {SUGGESTION_FIELD_ORDER.filter((k) => k in viewing.proposed).map((k) => (
                    <DiffRow key={k} label={zh ? SUGGESTION_FIELD_LABELS[k].zh : SUGGESTION_FIELD_LABELS[k].en}>
                      <SuggestionFieldValue fieldKey={k} value={(viewing.current as Record<string, unknown>)[k]} zh={zh} />
                    </DiffRow>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">{zh ? "提议修改为" : "Proposed"}</p>
                <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                  {SUGGESTION_FIELD_ORDER.filter((k) => k in viewing.proposed).map((k) => (
                    <DiffRow key={k} label={zh ? SUGGESTION_FIELD_LABELS[k].zh : SUGGESTION_FIELD_LABELS[k].en}>
                      <SuggestionFieldValue fieldKey={k} value={(viewing.proposed as Record<string, unknown>)[k]} zh={zh} />
                    </DiffRow>
                  ))}
                </div>
              </div>

              {rejecting && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "驳回理由（可选）" : "Reject note (optional)"}</label>
                  <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} rows={2}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end gap-2">
              {rejecting ? (
                <>
                  <button onClick={() => { setRejecting(false); setRejectNote(""); }}
                    className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
                    {zh ? "取消" : "Cancel"}
                  </button>
                  <button disabled={busy} onClick={() => review(viewing.id, "reject", rejectNote.trim() || undefined)}
                    className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                    {zh ? "确认驳回" : "Confirm Reject"}
                  </button>
                </>
              ) : (
                <>
                  <button disabled={busy} onClick={() => setRejecting(true)}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-950/70 transition-colors disabled:opacity-50">
                    <X className="h-3 w-3" />
                    {zh ? "驳回" : "Reject"}
                  </button>
                  <button disabled={busy} onClick={() => review(viewing.id, "approve")}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 transition-colors disabled:opacity-50">
                    {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    {zh ? "通过" : "Approve"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ResourceSubscriptionRow {
  id: number; name: string; query: string; frequency: "daily" | "weekly"; active: boolean;
  sources: string[]; lastCheckedAt: string | null; nextRunAt: string; lastError: string | null;
}

interface ManagedTagRow {
  id: number;
  slug: string;
  nameEn: string;
  nameZh: string;
  facet: "theme" | "jurisdiction" | "asset";
  definition: string | null;
  region: string | null;
  category: string | null;
  status: "active" | "candidate";
  usageCount: number;
}

const MANAGED_TAG_FACETS = {
  theme: { zh: "主题", en: "Theme" },
  jurisdiction: { zh: "辖区", en: "Jurisdiction" },
  asset: { zh: "币种", en: "Asset" },
} as const;
const MANAGED_THEME_CATEGORIES = [
  ["types_mechanisms", "类型与机制", "Types & Mechanisms"],
  ["stability_risk", "稳定性与风险", "Stability & Risk"],
  ["regulation_policy", "监管与政策", "Regulation & Policy"],
  ["monetary_macro", "货币与宏观", "Monetary & Macro"],
  ["markets_adoption", "市场与应用", "Markets & Adoption"],
  ["tech_infrastructure", "技术与基础设施", "Tech & Infrastructure"],
] as const;

function TagManagementPanel({ token, language }: { token: string; language: string }) {
  const zh = language === "zh";
  const [tags, setTags] = useState<ManagedTagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [facet, setFacet] = useState<"all" | ManagedTagRow["facet"]>("all");
  const [editing, setEditing] = useState<ManagedTagRow | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [saving, setSaving] = useState(false);
  const [merging, setMerging] = useState(false);
  const [retagging, setRetagging] = useState(false);
  const [retagTask, setRetagTask] = useState<BackgroundTask | null>(null);
  const [message, setMessage] = useState("");

  const loadTags = useCallback(() => {
    setLoading(true);
    authenticatedFetch(`${apiBase()}/api/admin/tags`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.ok ? response.json() : Promise.reject(response.status))
      .then((data) => setTags(Array.isArray(data) ? data : []))
      .catch(() => setTags([]))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { loadTags(); }, [loadTags]);

  const loadRetagTask = useCallback(async () => {
    const response = await authenticatedFetch(`${apiBase()}/api/admin/background-tasks?type=retag_resources&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const rows = response.ok ? await response.json() : [];
    setRetagTask(Array.isArray(rows) ? rows[0] ?? null : null);
  }, [token]);
  useEffect(() => { void loadRetagTask(); }, [loadRetagTask]);
  useEffect(() => {
    if (!retagTask || !["queued", "processing"].includes(retagTask.status)) {
      if (retagTask?.status === "completed") loadTags();
      return;
    }
    const timer = window.setTimeout(() => { void loadRetagTask(); }, 2500);
    return () => window.clearTimeout(timer);
  }, [loadRetagTask, loadTags, retagTask]);

  const filteredTags = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return tags.filter((tag) => (facet === "all" || tag.facet === facet)
      && (!normalizedQuery || [tag.nameZh, tag.nameEn, tag.slug].some((value) => value.toLowerCase().includes(normalizedQuery))));
  }, [facet, query, tags]);

  async function saveTag() {
    if (!editing || !editing.nameZh.trim() || !editing.nameEn.trim()) return;
    setSaving(true); setMessage("");
    try {
      const response = await authenticatedFetch(`${apiBase()}/api/admin/tags/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nameZh: editing.nameZh,
          nameEn: editing.nameEn,
          definition: editing.definition?.trim() || null,
          region: editing.region?.trim() || null,
          category: editing.facet === "theme" ? editing.category : null,
          status: editing.status,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? (zh ? "保存失败" : "Save failed"));
      setTags((current) => current.map((tag) => tag.id === editing.id ? { ...tag, ...data } : tag));
      setEditing(null);
      setMessage(zh ? "标签已更新，所有已关联资源会统一显示新名称。" : "Tag updated across all linked resources.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (zh ? "保存失败" : "Save failed"));
    } finally { setSaving(false); }
  }

  async function retagAll() {
    if (!confirm(zh
      ? "确定根据当前标签定义重新分类全部资源吗？这会调用 AI，可能需要数分钟；人工指定的标签会保留。"
      : "Reclassify the full library with the current vocabulary? This uses AI and can take several minutes. Manual tags are preserved.")) return;
    setRetagging(true); setMessage(zh ? "正在创建后台分类任务…" : "Creating the background reclassification task…");
    try {
      const response = await authenticatedFetch(`${apiBase()}/api/admin/tags/retag`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? (zh ? "重新分类失败" : "Reclassification failed"));
      setRetagTask(data.task ?? null);
      setMessage(zh
        ? `${data.reused ? "已有全库分类任务正在运行" : `已创建 ${data.task?.total ?? 0} 条资源的后台任务`}，现在可以离开此页面。`
        : `${data.reused ? "A library reclassification is already running" : `A background task was created for ${data.task?.total ?? 0} resources`}. You can leave this page.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (zh ? "重新分类失败" : "Reclassification failed"));
    } finally { setRetagging(false); }
  }

  async function mergeTag() {
    if (!editing || !mergeTargetId) return;
    const target = tags.find((tag) => tag.id === Number(mergeTargetId));
    if (!target || !confirm(zh
      ? `确定把“${editing.nameZh}”合并到“${target.nameZh}”吗？原标签会删除，关联资源会保留。`
      : `Merge “${editing.nameEn}” into “${target.nameEn}”? The source tag will be deleted and resource links preserved.`)) return;
    setMerging(true); setMessage("");
    try {
      const response = await authenticatedFetch(`${apiBase()}/api/admin/tags/${editing.id}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetTagId: target.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? (zh ? "合并失败" : "Merge failed"));
      setEditing(null); setMergeTargetId("");
      setMessage(zh ? `标签已合并，已迁移 ${data.resourceLinksMoved} 条资源关联。` : `Tags merged; ${data.resourceLinksMoved} resource links moved.`);
      loadTags();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (zh ? "合并失败" : "Merge failed"));
    } finally { setMerging(false); }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="text-base font-semibold">{zh ? "标签管理" : "Tag Management"}</h2>
          <p className="mt-0.5 max-w-2xl text-xs leading-5 text-muted-foreground">
            {zh ? "修改标签名称会立即同步到所有已关联资源；修改标签定义后，可重新分类全库。候选标签启用后才会出现在公共筛选栏。" : "Renaming a tag updates every linked resource immediately. After changing definitions, reclassify the library. Candidate tags appear in public filters only after activation."}
          </p>
        </div>
        <button type="button" onClick={retagAll} disabled={retagging || !!retagTask && ["queued", "processing"].includes(retagTask.status)}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50">
          {retagging ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {zh ? "重新分类全库" : "Reclassify library"}
        </button>
      </div>

      {retagTask && (
        <div className="rounded-md border border-border bg-muted/25 px-3 py-2.5 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span>{retagTask.status === "completed" ? (zh ? "全库重新分类已完成" : "Library reclassification completed")
              : retagTask.status === "failed" ? (zh ? "全库重新分类失败" : "Library reclassification failed")
                : retagTask.status === "waiting_external" ? (zh ? "任务暂停，等待外部 AI 服务" : "Task paused for the external AI service")
                  : (zh ? "正在后台重新分类" : "Reclassifying in the background")}</span>
            <span className="tabular-nums text-muted-foreground">{retagTask.processed}/{retagTask.total}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-[width]" style={{ width: `${retagTask.total ? Math.round(retagTask.processed / retagTask.total * 100) : 0}%` }} />
          </div>
          {retagTask.error && <p className="mt-2 text-red-600 dark:text-red-300">{retagTask.error}</p>}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <input value={query} onChange={(event) => setQuery(event.target.value)}
          placeholder={zh ? "搜索标签名称" : "Search tag names"}
          className="h-9 min-w-56 flex-1 rounded-md border border-border bg-background px-3 text-sm" />
        <select value={facet} onChange={(event) => setFacet(event.target.value as typeof facet)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm">
          <option value="all">{zh ? "全部类别" : "All facets"}</option>
          {Object.entries(MANAGED_TAG_FACETS).map(([value, label]) => <option key={value} value={value}>{zh ? label.zh : label.en}</option>)}
        </select>
      </div>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{zh ? "加载中…" : "Loading…"}</div>
      ) : (
        <div className="overflow-hidden rounded-md border border-border">
          <div className="hidden grid-cols-[minmax(180px,1.2fr)_110px_110px_70px_44px] gap-3 border-b border-border bg-muted/60 px-3 py-2.5 text-xs font-semibold text-muted-foreground md:grid">
            <span>{zh ? "标签" : "Tag"}</span><span>{zh ? "类别" : "Facet"}</span><span>{zh ? "状态" : "Status"}</span><span>{zh ? "资源数" : "Used"}</span><span />
          </div>
          {filteredTags.map((tag) => (
            <div key={tag.id} className="border-b border-border last:border-b-0">
              <div className="grid gap-2 px-3 py-3 text-sm md:grid-cols-[minmax(180px,1.2fr)_110px_110px_70px_44px] md:items-center md:gap-3">
                <div className="min-w-0"><p className="font-medium truncate">{zh ? tag.nameZh : tag.nameEn}</p><p className="text-xs text-muted-foreground truncate">{zh ? tag.nameEn : tag.nameZh}</p></div>
                <span className="text-xs text-muted-foreground">{zh ? MANAGED_TAG_FACETS[tag.facet].zh : MANAGED_TAG_FACETS[tag.facet].en}</span>
                <span className={`text-xs ${tag.status === "active" ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>{tag.status === "active" ? (zh ? "已启用" : "Active") : (zh ? "候选" : "Candidate")}</span>
                <span className="text-xs tabular-nums text-muted-foreground">{tag.usageCount}</span>
                <button type="button" onClick={() => { setEditing({ ...tag }); setMergeTargetId(""); }} title={zh ? "编辑标签" : "Edit tag"}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
              </div>
              {editing?.id === tag.id && (
                <div className="grid gap-3 border-t border-border bg-muted/25 px-3 py-4 md:grid-cols-2">
                  <label className="space-y-1"><span className="text-xs text-muted-foreground">中文名称</span><input value={editing.nameZh} onChange={(event) => setEditing({ ...editing, nameZh: event.target.value })} className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm" /></label>
                  <label className="space-y-1"><span className="text-xs text-muted-foreground">English name</span><input value={editing.nameEn} onChange={(event) => setEditing({ ...editing, nameEn: event.target.value })} className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm" /></label>
                  {editing.facet === "theme" && <label className="space-y-1"><span className="text-xs text-muted-foreground">{zh ? "主题分类" : "Theme category"}</span><select value={editing.category ?? ""} onChange={(event) => setEditing({ ...editing, category: event.target.value || null })} className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"><option value="">—</option>{MANAGED_THEME_CATEGORIES.map(([value, labelZh, labelEn]) => <option key={value} value={value}>{zh ? labelZh : labelEn}</option>)}</select></label>}
                  <label className="space-y-1"><span className="text-xs text-muted-foreground">{zh ? "状态" : "Status"}</span><select value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value as ManagedTagRow["status"] })} className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"><option value="active">{zh ? "已启用" : "Active"}</option><option value="candidate">{zh ? "候选" : "Candidate"}</option></select></label>
                  {editing.facet === "theme" && <label className="space-y-1 md:col-span-2"><span className="text-xs text-muted-foreground">{zh ? "AI 分类定义" : "AI classification definition"}</span><textarea rows={3} value={editing.definition ?? ""} onChange={(event) => setEditing({ ...editing, definition: event.target.value })} className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm" /></label>}
                  <div className="space-y-1 border-t border-border pt-3 md:col-span-2">
                    <span className="text-xs text-muted-foreground">{zh ? "合并重复或同义标签" : "Merge a duplicate or synonym"}</span>
                    <div className="flex gap-2">
                      <select value={mergeTargetId} onChange={(event) => setMergeTargetId(event.target.value)} className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm">
                        <option value="">{zh ? "选择保留的目标标签" : "Choose the tag to keep"}</option>
                        {tags.filter((candidate) => candidate.facet === editing.facet && candidate.id !== editing.id)
                          .sort((a, b) => a.nameEn.localeCompare(b.nameEn))
                          .map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.nameZh} / {candidate.nameEn}</option>)}
                      </select>
                      <button type="button" onClick={mergeTag} disabled={merging || !mergeTargetId}
                        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-red-200 px-3 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30">
                        {merging ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Tag className="h-3.5 w-3.5" />}{zh ? "合并" : "Merge"}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 md:col-span-2"><button type="button" onClick={() => setEditing(null)} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs"><X className="h-3.5 w-3.5" />{zh ? "取消" : "Cancel"}</button><button type="button" onClick={saveTag} disabled={saving} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs text-primary-foreground disabled:opacity-50">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}{zh ? "保存" : "Save"}</button></div>
                </div>
              )}
            </div>
          ))}
          {filteredTags.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">{zh ? "没有匹配的标签" : "No matching tags"}</p>}
        </div>
      )}
    </div>
  );
}

interface SubscriptionCandidateRow {
  id: number; title: string; authors: string[]; year: number | null; doi: string | null;
  url: string | null; source: string; discoveredAt: string;
}

function subscriptionSourceWarning(error: string, zh: boolean): string {
  if (/semanticscholar.*(?:429|rate.?limit)/i.test(error)) {
    return zh
      ? "Semantic Scholar 暂时达到访问频率限制；Crossref 与 OpenAlex 已完成，本次候选结果已保留。"
      : "Semantic Scholar is temporarily rate-limited; Crossref and OpenAlex completed, and this run's candidates were kept.";
  }
  return zh ? `部分资料来源暂未完成：${error}` : `Some discovery sources did not complete: ${error}`;
}

function ResourceSubscriptionsPanel({ token, language }: { token: string; language: string }) {
  const zh = language === "zh";
  const [subscriptions, setSubscriptions] = useState<ResourceSubscriptionRow[]>([]);
  const [candidates, setCandidates] = useState<SubscriptionCandidateRow[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("weekly");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [subscriptionTask, setSubscriptionTask] = useState<BackgroundTask | null>(null);
  const [taskPanelOpen, setTaskPanelOpen] = useState(false);
  const [runningSubscriptionId, setRunningSubscriptionId] = useState<number | null>(null);
  const [runningSubscriptionName, setRunningSubscriptionName] = useState("");

  const load = useCallback(async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const [subscriptionsRes, candidatesRes] = await Promise.all([
      authenticatedFetch(`${apiBase()}/api/admin/resource-subscriptions`, { headers }),
      authenticatedFetch(`${apiBase()}/api/admin/subscription-candidates?status=new`, { headers }),
    ]);
    setSubscriptions(subscriptionsRes.ok ? await subscriptionsRes.json() : []);
    const nextCandidates: SubscriptionCandidateRow[] = candidatesRes.ok ? await candidatesRes.json() : [];
    setCandidates(nextCandidates);
    const candidateIds = new Set(nextCandidates.map((candidate) => candidate.id));
    setSelected((previous) => new Set([...previous].filter((id) => candidateIds.has(id))));
  }, [token]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!subscriptionTask || !["queued", "processing"].includes(subscriptionTask.status)) return;
    const timer = window.setTimeout(async () => {
      const response = await authenticatedFetch(`${apiBase()}/api/admin/background-tasks?type=resource_subscription&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rows: BackgroundTask[] = response.ok ? await response.json() : [];
      const current = rows.find((task) => task.id === subscriptionTask.id);
      if (!current) return;
      setSubscriptionTask(current);
      if (["completed", "failed", "waiting_external"].includes(current.status)) {
        setRunningSubscriptionId(null);
        await load();
        if (current.status === "completed") {
          setMessage(zh
            ? `资料更新完成：发现 ${current.result?.found ?? 0} 条，新增 ${current.result?.added ?? 0} 条候选`
            : `Discovery complete: found ${current.result?.found ?? 0}; added ${current.result?.added ?? 0} candidates`);
        }
      }
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [load, subscriptionTask, token, zh]);

  async function createSubscription() {
    if (!name.trim() || !query.trim()) return;
    setBusy(true); setMessage("");
    try {
      const res = await authenticatedFetch(`${apiBase()}/api/admin/resource-subscriptions`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, query, frequency, active: true }),
      });
      if (!res.ok) throw new Error(zh ? "创建失败" : "Could not create subscription");
      setName(""); setQuery(""); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : (zh ? "创建失败" : "Create failed")); }
    finally { setBusy(false); }
  }

  async function updateSubscription(id: number, patch: Record<string, unknown>) {
    await authenticatedFetch(`${apiBase()}/api/admin/resource-subscriptions/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(patch),
    });
    await load();
  }
  async function runSubscription(item: ResourceSubscriptionRow) {
    setRunningSubscriptionId(item.id); setRunningSubscriptionName(item.name); setMessage(""); setTaskPanelOpen(true);
    try {
      const res = await authenticatedFetch(`${apiBase()}/api/admin/resource-subscriptions/${item.id}/run`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? (zh ? "检查失败" : "Check failed"));
      setSubscriptionTask(data.task);
    } catch (error) {
      setRunningSubscriptionId(null);
      setMessage(error instanceof Error ? error.message : (zh ? "检查失败" : "Check failed"));
    }
  }
  async function deleteSubscription(id: number) {
    await authenticatedFetch(`${apiBase()}/api/admin/resource-subscriptions/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    await load();
  }
  async function importSelected() {
    if (selected.size === 0) return;
    setBusy(true); setMessage("");
    try {
      const res = await authenticatedFetch(`${apiBase()}/api/admin/subscription-candidates/import`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ candidateIds: [...selected] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? (zh ? "导入失败" : "Import failed"));
      const skipped = data.skippedDuplicates?.length ?? 0;
      setMessage(zh ? `已将 ${data.queued.length} 条送入 AI 导入队列${skipped ? `；另有 ${skipped} 条已存在，已跳过` : ""}` : `${data.queued.length} items sent to the AI import queue${skipped ? `; ${skipped} existing items skipped` : ""}`);
      setSelected(new Set()); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : (zh ? "导入失败" : "Import failed")); }
    finally { setBusy(false); }
  }
  async function dismissCandidate(id: number) {
    await authenticatedFetch(`${apiBase()}/api/admin/subscription-candidates/${id}/dismiss`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    await load();
  }
  const allCandidatesSelected = candidates.length > 0 && candidates.every((candidate) => selected.has(candidate.id));
  function toggleAllCandidates() {
    setSelected(allCandidatesSelected ? new Set() : new Set(candidates.map((candidate) => candidate.id)));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">{zh ? "资料订阅" : "Resource Subscriptions"}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{zh ? "定期发现新文献，先进入候选箱，再由管理员送审。" : "Discover new literature on a schedule, then review candidates before importing."}</p>
      </div>
      <div className="flex flex-wrap gap-3 items-end border-b border-border pb-5">
        <label className="space-y-1 min-w-[180px] flex-1"><span className="text-xs text-muted-foreground">{zh ? "订阅名称" : "Name"}</span><input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-9 px-3 text-sm border border-border rounded-md bg-background" /></label>
        <label className="space-y-1 min-w-[220px] flex-[1.5]"><span className="text-xs text-muted-foreground">{zh ? "检索词" : "Search query"}</span><input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full h-9 px-3 text-sm border border-border rounded-md bg-background" /></label>
        <label className="space-y-1"><span className="text-xs text-muted-foreground">{zh ? "频率" : "Frequency"}</span><select value={frequency} onChange={(e) => setFrequency(e.target.value as "daily" | "weekly")} className="h-9 px-3 text-sm border border-border rounded-md bg-background"><option value="daily">{zh ? "每日" : "Daily"}</option><option value="weekly">{zh ? "每周" : "Weekly"}</option></select></label>
        <button onClick={createSubscription} disabled={busy || !name.trim() || !query.trim()} className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50">{zh ? "新增" : "Add"}</button>
      </div>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
      <div className="space-y-2">
        {subscriptions.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5 border border-border rounded-md bg-card">
            <button title={item.active ? (zh ? "暂停" : "Pause") : (zh ? "启用" : "Enable")} onClick={() => updateSubscription(item.id, { active: !item.active })} className={`h-5 w-9 rounded-full p-0.5 transition-colors ${item.active ? "bg-emerald-500" : "bg-muted"}`}><span className={`block h-4 w-4 rounded-full bg-white transition-transform ${item.active ? "translate-x-4" : ""}`} /></button>
            <div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{item.name}</p><p className="text-xs text-muted-foreground truncate">{item.query} · {item.frequency === "daily" ? (zh ? "每日" : "Daily") : (zh ? "每周" : "Weekly")} · {(item.sources ?? []).map((source) => source === "semanticscholar" ? "Semantic Scholar" : source === "openalex" ? "OpenAlex" : "Crossref").join(" + ")}</p></div>
            {item.lastError && (
              <span
                className="inline-flex max-w-sm items-center gap-1.5 text-xs text-amber-700"
                title={item.lastError}
              >
                <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-2">{subscriptionSourceWarning(item.lastError, zh)}</span>
              </span>
            )}
            <button title={zh ? "立即检查" : "Run now"} onClick={() => runSubscription(item)} disabled={runningSubscriptionId === item.id} className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border hover:bg-muted disabled:opacity-50">{runningSubscriptionId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}</button>
            <button title={zh ? "删除" : "Delete"} onClick={() => deleteSubscription(item.id)} className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
      <div className="border-t border-border pt-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-semibold">{zh ? `新资料候选（${candidates.length}）` : `New candidates (${candidates.length})`}</h3><div className="flex items-center gap-2"><button onClick={toggleAllCandidates} disabled={candidates.length === 0} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"><CheckSquare className="h-3.5 w-3.5" />{allCandidatesSelected ? (zh ? "取消全选" : "Clear all") : (zh ? "全选" : "Select all")}</button><button onClick={importSelected} disabled={busy || selected.size === 0} className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50">{zh ? `送入导入队列（${selected.size}）` : `Import selected (${selected.size})`}</button></div></div>
        <div className="divide-y divide-border border-y border-border">
          {candidates.map((candidate) => (
            <div key={candidate.id} className="flex items-start gap-3 py-3">
              <input type="checkbox" checked={selected.has(candidate.id)} onChange={() => setSelected((prev) => { const next = new Set(prev); if (next.has(candidate.id)) next.delete(candidate.id); else next.add(candidate.id); return next; })} className="mt-1" />
              <div className="min-w-0 flex-1"><p className="text-sm font-medium line-clamp-2">{candidate.title}</p><p className="text-xs text-muted-foreground mt-0.5">{candidate.authors.slice(0, 3).join(", ")}{candidate.year ? ` · ${candidate.year}` : ""}{candidate.doi ? ` · ${candidate.doi}` : ""} · {candidate.source === "semanticscholar" ? "Semantic Scholar" : candidate.source === "openalex" ? "OpenAlex" : "Crossref"}</p></div>
              <button onClick={() => dismissCandidate(candidate.id)} className="text-xs text-muted-foreground hover:text-foreground">{zh ? "忽略" : "Dismiss"}</button>
            </div>
          ))}
          {candidates.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">{zh ? "暂无新候选" : "No new candidates"}</p>}
        </div>
      </div>
      {taskPanelOpen && subscriptionTask && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setTaskPanelOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-label={zh ? "资料更新进度" : "Discovery progress"} className="w-full max-w-lg rounded-lg border border-border bg-background p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">{zh ? "资料更新" : "Resource discovery"}</p>
                <h3 className="mt-1 text-lg font-semibold">{runningSubscriptionName}</h3>
              </div>
              <button onClick={() => setTaskPanelOpen(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted" aria-label={zh ? "关闭" : "Close"}><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-5 flex items-center justify-between text-sm">
              <span>{subscriptionTask.status === "queued" ? (zh ? "等待后台开始" : "Waiting to start")
                : subscriptionTask.status === "processing" ? (subscriptionTask.result?.phase === "deduplicating" ? (zh ? "正在跨来源去重" : "Deduplicating across sources")
                  : subscriptionTask.result?.phase === "saving" ? (zh ? "正在写入候选箱" : "Saving candidates")
                    : (zh ? `正在查询 ${subscriptionTask.result?.source ?? "学术数据源"}` : `Searching ${subscriptionTask.result?.source ?? "scholarly sources"}`))
                  : subscriptionTask.status === "completed" ? (zh ? "更新完成" : "Completed")
                    : (zh ? "更新未完成" : "Could not complete")}</span>
              <span className="tabular-nums text-muted-foreground">{subscriptionTask.processed}/{subscriptionTask.total}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full transition-[width] duration-500 ${subscriptionTask.status === "failed" ? "bg-red-500" : "bg-primary"}`} style={{ width: `${Math.max(4, Math.round(subscriptionTask.processed / Math.max(subscriptionTask.total, 1) * 100))}%` }} /></div>
            {subscriptionTask.status === "completed" && <p className="mt-4 text-sm text-foreground">{zh ? `发现 ${subscriptionTask.result?.found ?? 0} 条，新增 ${subscriptionTask.result?.added ?? 0} 条候选。` : `Found ${subscriptionTask.result?.found ?? 0}; added ${subscriptionTask.result?.added ?? 0} candidates.`}</p>}
            {subscriptionTask.status === "completed" && Object.entries(subscriptionTask.result?.sources ?? {}).some(([, source]) => source.error) && (
              <div className="mt-3 flex items-start gap-2 border-l-2 border-amber-500 pl-3 text-xs leading-5 text-amber-800">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{subscriptionSourceWarning(
                  Object.entries(subscriptionTask.result?.sources ?? {})
                    .filter(([, source]) => source.error)
                    .map(([source, detail]) => `${source}: ${detail.error}`)
                    .join("; "),
                  zh,
                )}</span>
              </div>
            )}
            {subscriptionTask.error && <p className="mt-4 text-sm text-red-600">{subscriptionTask.error}</p>}
            <p className="mt-4 text-xs text-muted-foreground">{zh ? "任务在服务器后台运行，关闭此窗口或离开页面不会中断。" : "This task runs on the server. Closing this window or leaving the page will not interrupt it."}</p>
          </section>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminCenter() {
  const { user, token } = useAuth();
  const { language } = useLanguage();
  const [, navigate] = useLocation();
  const zh = language === "zh";

  // Auth guard
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <Shield className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-lg font-semibold text-muted-foreground">{zh ? "请先登录" : "Please sign in"}</p>
      </div>
    );
  }
  if (user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <Shield className="h-12 w-12 text-red-400/50" />
        <p className="text-lg font-semibold">{zh ? "访问受限" : "Access Denied"}</p>
        <p className="text-sm text-muted-foreground">{zh ? "此页面仅供管理员访问。" : "This page is for admins only."}</p>
        <button onClick={() => navigate("/")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors">
          <ChevronRight className="h-4 w-4 rotate-180" />
          {zh ? "返回首页" : "Back to Home"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-screen-lg mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-5 space-y-1">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-primary">{zh ? "管理中心" : "Admin Center"}</h1>
            <p className="text-xs text-muted-foreground">{zh ? "仅管理员可见" : "Administrator access only"}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="approvals">
        <TabsList className="h-auto w-full justify-start bg-muted/50 border border-border p-0.5 rounded-lg flex flex-wrap">
          <TabsTrigger value="users" className="text-xs gap-1.5 h-8 px-3 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Users className="h-3.5 w-3.5" />
            {zh ? "用户管理" : "User Management"}
          </TabsTrigger>
          <TabsTrigger value="approvals" className="text-xs gap-1.5 h-8 px-3 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <CheckSquare className="h-3.5 w-3.5" />
            {zh ? "审核" : "Approvals"}
          </TabsTrigger>
          <TabsTrigger value="review-log" className="text-xs gap-1.5 h-8 px-3 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <History className="h-3.5 w-3.5" />
            {zh ? "审核记录" : "Review Log"}
          </TabsTrigger>
          <TabsTrigger value="tag-suggestions" className="text-xs gap-1.5 h-8 px-3 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Tag className="h-3.5 w-3.5" />
            {zh ? "编辑建议" : "Edit Suggestions"}
          </TabsTrigger>
          <TabsTrigger value="tag-management" className="text-xs gap-1.5 h-8 px-3 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Tag className="h-3.5 w-3.5" />
            {zh ? "标签管理" : "Tag Management"}
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="text-xs gap-1.5 h-8 px-3 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Bell className="h-3.5 w-3.5" />
            {zh ? "资料订阅" : "Subscriptions"}
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs gap-1.5 h-8 px-3 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <SettingsIcon className="h-3.5 w-3.5" />
            {zh ? "系统配置" : "Settings"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <UserManagementPanel token={token!} language={language} currentUserId={user?.id} />
        </TabsContent>

        <TabsContent value="approvals" className="mt-6">
          <ApprovalsPanel token={token!} language={language} isAdmin />
        </TabsContent>

        <TabsContent value="review-log" className="mt-6">
          <ReviewLogPanel token={token!} language={language} />
        </TabsContent>

        <TabsContent value="tag-suggestions" className="mt-6">
          <TagSuggestionsPanel token={token!} language={language} />
        </TabsContent>

        <TabsContent value="tag-management" className="mt-6">
          <TagManagementPanel token={token!} language={language} />
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-6">
          <ResourceSubscriptionsPanel token={token!} language={language} />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <SettingsPanel token={token!} language={language} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
