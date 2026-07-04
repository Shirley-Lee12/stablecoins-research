import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield, Users, CheckSquare, FileText, Settings as SettingsIcon,
  Clock, Check, X, Loader2, ChevronRight, Database, Mail, Sparkles, History, Pencil, RefreshCw, Tag,
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
    fetch(`${apiBase()}/api/admin/users`, {
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
      const res = await fetch(`${apiBase()}/api/admin/users/${u.id}`, {
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
// Mirrors the actual shape GET /api/admin/settings/status returns (artifacts/api-server/src/routes/
// admin.ts) — email is Brevo (HTTP API), not SMTP, since the SMTP->Brevo migration.
interface SettingsStatus {
  database: { configured: boolean };
  auth: { jwtSecret: string };
  llm: { provider: string; model: string; apiKey: string };
  email: { provider: string; from: string; apiKey: string };
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
    fetch(`${apiBase()}/api/admin/settings/status`, { headers: { Authorization: `Bearer ${token}` } })
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
          {zh ? "邮件发送（Brevo API）" : "Email Sending (Brevo API)"}
        </h3>
        <StatusRow label={zh ? "服务商" : "Provider"} value={status.email.provider} />
        <StatusRow label={zh ? "发件邮箱" : "Sender Email"} value={status.email.from} />
        <StatusRow label="API Key" value={status.email.apiKey} />
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
  // docs/planning/19 §19.3 — when a pending resource carries a duplicateNote, it got here via the
  // "confirm not a duplicate" resubmission path; show the admin the same original matches the
  // submitter saw, next to their explanation, so the final call isn't made blind.
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidateInfo[]>([]);

  const fetchPending = useCallback(() => {
    setLoading(true);
    fetch(`${apiBase()}/api/resources?status=pending`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setResources(Array.isArray(data) ? data : []))
      .catch(() => setResources([]))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { fetchPending(); }, [fetchPending]);
  useEffect(() => {
    fetch(`${apiBase()}/api/rejection-reasons`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setReasons(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  function fetchVerifyReport(id: number) {
    setVerifyReport(null);
    setVerifiedAt(null);
    setReportLoading(true);
    fetch(`${apiBase()}/api/admin/resources/${id}/verify-report`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { report: VerifyReport | null; verifiedAt: string | null } | null) => {
        setVerifyReport(data?.report ?? null);
        setVerifiedAt(data?.verifiedAt ?? null);
      })
      .finally(() => setReportLoading(false));
  }

  function openDetail(r: Resource) {
    setViewing(r);
    fetchVerifyReport(r.id);
    setDuplicateCandidates([]);
    if (r.duplicateNote) {
      fetch(`${apiBase()}/api/resources/${r.id}/duplicate-candidates`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setDuplicateCandidates(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }

  /** docs/planning/16 §16.1 — the only place this page re-runs the live DOI/URL network checks; everywhere else just reads the cached column. */
  async function doReverify() {
    if (!viewing) return;
    if (!confirm(zh ? "重新核验会调用外部 DOI/链接检查接口，确定要继续吗？" : "Re-verifying calls external DOI/link-check APIs — continue?")) return;
    setReverifying(true);
    try {
      const res = await fetch(`${apiBase()}/api/admin/resources/${viewing.id}/reverify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: { report: VerifyReport; verifiedAt: string } = await res.json();
        setVerifyReport(data.report);
        setVerifiedAt(data.verifiedAt);
      }
    } finally {
      setReverifying(false);
    }
  }

  async function doApprove(id: number) {
    setBusy(true);
    try {
      await fetch(`${apiBase()}/api/admin/resources/${id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "approve" }),
      });
      setViewing(null);
      fetchPending();
    } finally {
      setBusy(false);
    }
  }

  async function submitReject(reasonId: number, note: string) {
    if (!rejecting) return;
    const res = await fetch(`${apiBase()}/api/admin/resources/${rejecting.id}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "reject", rejectionReasonId: reasonId, rejectionNote: note || undefined }),
    });
    if (!res.ok) throw new Error("Reject failed");
    setRejecting(null);
    setViewing(null);
    fetchPending();
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">{zh ? "待审核资源" : "Pending Approvals"}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {zh ? "点击一条资源查看完整信息后再决定通过或驳回。" : "Click a resource to see its full details before approving or rejecting."}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">{zh ? "加载中…" : "Loading…"}</span>
        </div>
      ) : resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Check className="h-10 w-10 text-emerald-400/50" />
          <p className="text-sm font-medium text-muted-foreground">{zh ? "当前无待审核资源" : "No pending resources"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {resources.map((r) => (
            <button key={r.id} onClick={() => openDetail(r)}
              className="w-full flex items-center justify-between gap-4 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/50 dark:hover:bg-amber-950/40 transition-colors text-left">
              <div className="flex items-start gap-3 min-w-0">
                <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-1">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {r.sourceType} · {new Date(r.createdAt).toLocaleDateString(zh ? "zh-CN" : "en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      )}

      {viewing && (
        <ResourceDetailModal
          resource={viewing}
          language={language}
          onClose={() => setViewing(null)}
          extraSection={
            <div className="pt-2 border-t border-border space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "核对报告" : "Verification Report"}</h3>
                {!reportLoading && (
                  <button disabled={reverifying} onClick={doReverify}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary disabled:opacity-50 transition-colors">
                    {reverifying ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    {zh ? "重新核验" : "Re-verify"}
                  </button>
                )}
              </div>
              {reportLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {zh ? "加载中…" : "Loading…"}
                </div>
              ) : verifyReport ? (
                <>
                  <VerifyReportList report={verifyReport} language={language} />
                  {verifiedAt && (
                    <p className="text-xs text-muted-foreground/70">
                      {zh ? "核对时间：" : "Verified: "}{new Date(verifiedAt).toLocaleString(zh ? "zh-CN" : "en-US")}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground py-2">{zh ? "尚无核对报告——点击“重新核验”生成一份。" : "No verification report yet — click \"Re-verify\" to generate one."}</p>
              )}
              {viewing.duplicateNote && (
                <div className="pt-2 space-y-1.5">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "提交者说明（原判定为疑似重复）" : "Submitter's explanation (originally flagged as a possible duplicate)"}</h3>
                  <p className="text-xs text-foreground/90 leading-relaxed">{viewing.duplicateNote}</p>
                  {duplicateCandidates.length > 0 && (
                    <div className="space-y-1">
                      {duplicateCandidates.map((c) => (
                        <div key={c.candidateResourceId} className="p-2 rounded-lg border border-border">
                          <p className="text-xs font-medium text-foreground line-clamp-2">{c.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{c.authors.join("; ")}{c.publishedDate && ` · ${c.publishedDate}`}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          }
          footer={
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(viewing)}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
                <Pencil className="h-3 w-3" />
                {zh ? "编辑" : "Edit"}
              </button>
              <button disabled={busy} onClick={() => setRejecting(viewing)}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-950/70 transition-colors disabled:opacity-50">
                <X className="h-3 w-3" />
                {zh ? "驳回" : "Reject"}
              </button>
              <button disabled={busy} onClick={() => doApprove(viewing.id)}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 transition-colors disabled:opacity-50">
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                {zh ? "通过" : "Approve"}
              </button>
            </div>
          }
        />
      )}

      {rejecting && (
        <RejectDialog resource={rejecting} reasons={reasons} language={language}
          onClose={() => setRejecting(null)} onSubmit={submitReject} />
      )}

      {editing && (
        <EditModal resource={editing} token={token} language={language} isAdmin={isAdmin}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); setViewing(null); fetchPending(); }} />
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

  useEffect(() => {
    fetch(`${apiBase()}/api/rejection-reasons`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setReasons(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const qs = statusFilter ? `?status=${statusFilter}` : "";
    fetch(`${apiBase()}/api/admin/review-log${qs}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setEntries(Array.isArray(data) ? data : []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [token, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-semibold">{zh ? "审核记录" : "Review Log"}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {zh ? "所有已经过管理员处理的资源（通过或驳回）。" : "Every resource that's been through an admin decision (approved or rejected)."}
          </p>
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}
          className="text-xs px-3 py-1.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">{zh ? "全部结果" : "All results"}</option>
          <option value="approved">{zh ? "已通过" : "Approved"}</option>
          <option value="rejected">{zh ? "已拒绝" : "Rejected"}</option>
        </select>
      </div>

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
                      <a href={`/academic-resources?id=${e.id}`} className="font-medium text-foreground hover:text-primary hover:underline line-clamp-1">
                        {e.title}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{e.submitterEmail ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleDateString(zh ? "zh-CN" : "en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{e.reviewedAt ? new Date(e.reviewedAt).toLocaleDateString(zh ? "zh-CN" : "en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</td>
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
    </div>
  );
}

// ── Tag/Keyword Suggestions Panel (docs/planning/18 §18.4 step 2) ────────────
interface SuggestionTagRef { id: number; slug: string; nameEn: string; nameZh: string; facet: "theme" | "jurisdiction" | "asset" }
interface TagKeywordSuggestion {
  id: number; resourceId: number; resourceTitle: string;
  submittedBy: number; submitterEmail: string; submittedAt: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy: number | null; reviewedAt: string | null; reviewNote: string | null;
  current: { themeTags: SuggestionTagRef[]; jurisdictionTags: SuggestionTagRef[]; assetTags: SuggestionTagRef[]; keywords: string[] };
  proposed: { themeTags: SuggestionTagRef[]; jurisdictionTags: SuggestionTagRef[]; assetTags: SuggestionTagRef[]; keywords: string[] };
}

function TagChips({ tags, zh, emptyLabel }: { tags: SuggestionTagRef[]; zh: boolean; emptyLabel: string }) {
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

function KeywordChips({ keywords, zh, emptyLabel }: { keywords: string[]; zh: boolean; emptyLabel: string }) {
  if (keywords.length === 0) return <span className="text-xs text-muted-foreground/60">{emptyLabel}</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {keywords.map((k) => (
        <span key={k} className="text-xs px-2 py-0.5 bg-muted/60 rounded-full text-muted-foreground border border-border/60">{k}</span>
      ))}
    </div>
  );
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
  const [suggestions, setSuggestions] = useState<TagKeywordSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<TagKeywordSuggestion | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);

  const fetchPending = useCallback(() => {
    setLoading(true);
    fetch(`${apiBase()}/api/admin/tag-suggestions?status=pending`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setSuggestions(Array.isArray(data) ? data : []))
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  async function review(id: number, action: "approve" | "reject", reviewNote?: string) {
    setBusy(true);
    try {
      const res = await fetch(`${apiBase()}/api/admin/tag-suggestions/${id}/review`, {
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
        <h2 className="text-base font-semibold">{zh ? "标签/关键词修改建议" : "Tag/Keyword Suggestions"}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {zh ? "普通用户提交的标签与关键词修改建议，需要管理员审核后才会生效。" : "Non-admin tag/keyword edit proposals — reviewed here before they take effect."}
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
                  <DiffRow label={zh ? "主题" : "Theme"}><TagChips tags={viewing.current.themeTags} zh={zh} emptyLabel={zh ? "无" : "None"} /></DiffRow>
                  <DiffRow label={zh ? "辖区" : "Jurisdiction"}><TagChips tags={viewing.current.jurisdictionTags} zh={zh} emptyLabel={zh ? "无" : "None"} /></DiffRow>
                  <DiffRow label={zh ? "币种" : "Asset"}><TagChips tags={viewing.current.assetTags} zh={zh} emptyLabel={zh ? "无" : "None"} /></DiffRow>
                  <DiffRow label={zh ? "关键词" : "Keywords"}><KeywordChips keywords={viewing.current.keywords} zh={zh} emptyLabel={zh ? "无" : "None"} /></DiffRow>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">{zh ? "提议修改为" : "Proposed"}</p>
                <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <DiffRow label={zh ? "主题" : "Theme"}><TagChips tags={viewing.proposed.themeTags} zh={zh} emptyLabel={zh ? "无" : "None"} /></DiffRow>
                  <DiffRow label={zh ? "辖区" : "Jurisdiction"}><TagChips tags={viewing.proposed.jurisdictionTags} zh={zh} emptyLabel={zh ? "无" : "None"} /></DiffRow>
                  <DiffRow label={zh ? "币种" : "Asset"}><TagChips tags={viewing.proposed.assetTags} zh={zh} emptyLabel={zh ? "无" : "None"} /></DiffRow>
                  <DiffRow label={zh ? "关键词" : "Keywords"}><KeywordChips keywords={viewing.proposed.keywords} zh={zh} emptyLabel={zh ? "无" : "None"} /></DiffRow>
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

// ── Content CMS Panel ─────────────────────────────────────────────────────────
function ContentCMSPanel({ language }: { language: string }) {
  const zh = language === "zh";
  const sections = [
    { key: "hero",     labelEn: "Hero / Banner",      labelZh: "首页 Banner",     status: "live" },
    { key: "about",    labelEn: "About Introduction", labelZh: "关于简介",         status: "live" },
    { key: "research", labelEn: "Research Highlights", labelZh: "研究亮点",        status: "draft" },
    { key: "news",     labelEn: "News & Announcements",labelZh: "新闻公告",        status: "draft" },
  ];
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">{zh ? "静态内容管理" : "Content CMS"}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {zh ? "管理平台各版块的静态展示内容，发布或存草稿。" : "Manage static content sections across the platform."}
        </p>
      </div>
      <div className="space-y-2">
        {sections.map((s) => (
          <div key={s.key}
            className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium">{zh ? s.labelZh : s.labelEn}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                s.status === "live"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700"
              }`}>
                {s.status === "live" ? (zh ? "已发布" : "Live") : (zh ? "草稿" : "Draft")}
              </span>
              <button className="text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-0.5 rounded hover:bg-muted">
                {zh ? "编辑" : "Edit"}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border border-dashed p-6 text-center space-y-2">
        <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto" />
        <p className="text-sm font-medium text-muted-foreground">
          {zh ? "富文本编辑器即将上线" : "Rich-text editor coming soon"}
        </p>
        <p className="text-xs text-muted-foreground">
          {zh ? "将在此处在线编辑和发布各页面静态内容" : "Edit and publish static page content inline from this panel"}
        </p>
      </div>
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
        <TabsList className="h-9 bg-muted/50 border border-border p-0.5 rounded-lg flex-wrap h-auto">
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
            {zh ? "标签建议" : "Tag Suggestions"}
          </TabsTrigger>
          <TabsTrigger value="cms" className="text-xs gap-1.5 h-8 px-3 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <FileText className="h-3.5 w-3.5" />
            {zh ? "内容管理" : "Content CMS"}
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

        <TabsContent value="cms" className="mt-6">
          <ContentCMSPanel language={language} />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <SettingsPanel token={token!} language={language} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
