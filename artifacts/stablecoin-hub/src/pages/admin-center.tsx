import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield, Users, CheckSquare, FileText, Settings as SettingsIcon,
  Clock, Check, X, Loader2, ChevronRight, Eye, EyeOff,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Resource {
  id: number; title: string; sourceType: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string; createdBy: number | null;
}
interface UserRow {
  id: number; email: string; name: string;
  role: "user" | "admin"; createdAt: string;
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

// ── Settings Panel ────────────────────────────────────────────────────────────
interface SettingsData {
  SMTP_HOST?: string; SMTP_PORT?: string; SMTP_USER?: string;
  SMTP_PASS?: boolean; SMTP_FROM?: string; LLM_API_KEY?: boolean;
}

function SettingsPanel({ token, language }: { token: string; language: string }) {
  const zh = language === "zh";
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState(false);

  const [form, setForm] = useState({ smtpHost: "", smtpPort: "", smtpUser: "", smtpFrom: "", smtpPass: "", googleApiKey: "" });

  const load = () => {
    setLoading(true);
    fetch(`${apiBase()}/api/admin/settings`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: SettingsData | null) => {
        setSettings(data);
        if (data) {
          setForm((f) => ({
            ...f,
            smtpHost: data.SMTP_HOST ?? "",
            smtpPort: data.SMTP_PORT ?? "",
            smtpUser: data.SMTP_USER ?? "",
            smtpFrom: data.SMTP_FROM ?? "",
          }));
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const body: Record<string, string> = {
        SMTP_HOST: form.smtpHost, SMTP_PORT: form.smtpPort, SMTP_USER: form.smtpUser, SMTP_FROM: form.smtpFrom,
      };
      if (form.smtpPass.trim()) body.SMTP_PASS = form.smtpPass.trim();
      if (form.googleApiKey.trim()) body.LLM_API_KEY = form.googleApiKey.trim();

      const res = await fetch(`${apiBase()}/api/admin/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        setForm((f) => ({ ...f, smtpPass: "", googleApiKey: "" }));
        setMessage(zh ? "已保存" : "Saved");
      } else {
        setMessage(zh ? "保存失败" : "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">{zh ? "加载中…" : "Loading…"}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-base font-semibold">{zh ? "系统配置" : "System Settings"}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {zh ? "邮件发送与 AI 服务密钥。数据库连接地址不在此处管理，需在服务器环境变量中修改。"
              : "Email sending and AI service keys. The database connection string is not managed here — change it via server environment variables."}
        </p>
      </div>

      <div className="rounded-xl border border-border p-5 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <SettingsIcon className="h-4 w-4 text-primary" />
          {zh ? "邮件发送（SMTP）" : "Email Sending (SMTP)"}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">SMTP Host</label>
            <input value={form.smtpHost} onChange={(e) => setForm((f) => ({ ...f, smtpHost: e.target.value }))}
              placeholder="smtp.163.com"
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">SMTP Port</label>
            <input value={form.smtpPort} onChange={(e) => setForm((f) => ({ ...f, smtpPort: e.target.value }))}
              placeholder="465"
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{zh ? "发件邮箱" : "Sender Email"}</label>
          <input value={form.smtpUser} onChange={(e) => setForm((f) => ({ ...f, smtpUser: e.target.value, smtpFrom: e.target.value }))}
            placeholder="sc_zibs2026@163.com"
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {zh ? "授权码" : "Auth Code / Password"}
            {settings?.SMTP_PASS && <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-normal">{zh ? "（已设置）" : "(set)"}</span>}
          </label>
          <div className="relative">
            <input
              type={showSecrets ? "text" : "password"}
              value={form.smtpPass} onChange={(e) => setForm((f) => ({ ...f, smtpPass: e.target.value }))}
              placeholder={settings?.SMTP_PASS ? (zh ? "留空则不修改" : "Leave blank to keep current") : (zh ? "输入授权码" : "Enter auth code")}
              className="w-full px-3 py-1.5 pr-10 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <button type="button" onClick={() => setShowSecrets((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showSecrets ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border p-5 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <SettingsIcon className="h-4 w-4 text-primary" />
          {zh ? "AI 服务（Gemini）" : "AI Service (Gemini)"}
        </h3>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Google API Key
            {settings?.LLM_API_KEY && <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-normal">{zh ? "（已设置）" : "(set)"}</span>}
          </label>
          <div className="relative">
            <input
              type={showSecrets ? "text" : "password"}
              value={form.googleApiKey} onChange={(e) => setForm((f) => ({ ...f, googleApiKey: e.target.value }))}
              placeholder={settings?.LLM_API_KEY ? (zh ? "留空则不修改" : "Leave blank to keep current") : (zh ? "输入 API Key" : "Enter API key")}
              className="w-full px-3 py-1.5 pr-10 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <button type="button" onClick={() => setShowSecrets((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showSecrets ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          {zh ? "保存配置" : "Save Settings"}
        </button>
        {message && <span className="text-sm text-muted-foreground">{message}</span>}
      </div>
    </div>
  );
}

// ── Approvals Panel ───────────────────────────────────────────────────────────
function ApprovalsPanel({ token, language }: { token: string; language: string }) {
  const zh = language === "zh";
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Record<number, boolean>>({});

  const fetchPending = () => {
    setLoading(true);
    fetch(`${apiBase()}/api/resources?status=pending`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setResources(Array.isArray(data) ? data : []))
      .catch(() => setResources([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPending(); }, [token]);

  async function doApprove(id: number, status: "approved" | "rejected") {
    setBusy((p) => ({ ...p, [id]: true }));
    await fetch(`${apiBase()}/api/resources/${id}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    setBusy((p) => ({ ...p, [id]: false }));
    fetchPending();
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">{zh ? "待审核资源" : "Pending Approvals"}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {zh ? "审核用户提交的文献资源，通过或驳回。" : "Review user-submitted resources and approve or reject them."}
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
            <div key={r.id}
              className="flex items-center justify-between gap-4 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20">
              <div className="flex items-start gap-3 min-w-0">
                <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-1">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {r.sourceType} · {new Date(r.createdAt).toLocaleDateString(zh ? "zh-CN" : "en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  disabled={busy[r.id]}
                  onClick={() => doApprove(r.id, "approved")}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 transition-colors disabled:opacity-50">
                  {busy[r.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  {zh ? "通过" : "Approve"}
                </button>
                <button
                  disabled={busy[r.id]}
                  onClick={() => doApprove(r.id, "rejected")}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-950/70 transition-colors disabled:opacity-50">
                  <X className="h-3 w-3" />
                  {zh ? "驳回" : "Reject"}
                </button>
              </div>
            </div>
          ))}
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
        <TabsList className="h-9 bg-muted/50 border border-border p-0.5 rounded-lg">
          <TabsTrigger value="users" className="text-xs gap-1.5 h-8 px-3 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Users className="h-3.5 w-3.5" />
            {zh ? "用户管理" : "User Management"}
          </TabsTrigger>
          <TabsTrigger value="approvals" className="text-xs gap-1.5 h-8 px-3 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <CheckSquare className="h-3.5 w-3.5" />
            {zh ? "审核" : "Approvals"}
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
          <ApprovalsPanel token={token!} language={language} />
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
