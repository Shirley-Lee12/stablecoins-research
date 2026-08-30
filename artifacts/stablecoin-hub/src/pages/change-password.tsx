import { useState } from "react";
import { KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { authenticatedFetch, useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { useToast } from "@/hooks/use-toast";

function apiBase() { return (import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL).replace(/\/$/, ""); }

export default function ChangePasswordPage() {
  const { token, user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!token || newPassword !== confirmPassword) {
      toast({ title: t("Passwords do not match", "两次输入的新密码不一致"), variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const response = await authenticatedFetch(`${apiBase()}/api/auth/change-password`, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Update failed");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      toast({ title: t("Password updated", "密码已更新"), description: t("Use the new password the next time you sign in.", "下次登录时请使用新密码。") });
    } catch (error) {
      toast({ title: t("Could not update password", "密码更新失败"), description: error instanceof Error ? error.message : "Update failed", variant: "destructive" });
    } finally { setSaving(false); }
  }

  if (!user) return <div className="mx-auto max-w-xl py-20 text-center text-muted-foreground">{t("Sign in to change your password.", "请登录后修改密码。")}</div>;
  return <div className="mx-auto max-w-4xl pb-20">
    <header className="grid gap-8 border-b border-border pb-10 pt-4 lg:grid-cols-[0.8fr_1.2fr]">
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t("Account security", "账号安全")}</p><h1 className="mt-3 font-serif text-4xl font-semibold text-primary">{t("Change password", "修改密码")}</h1><p className="mt-4 max-w-md text-base leading-7 text-foreground/68">{t("Update your password without leaving the signed-in session.", "在当前登录状态下安全更新账号密码。")}</p></div>
      <div className="relative min-h-48 overflow-hidden bg-primary/[0.055] p-8"><ShieldCheck className="h-16 w-16 text-primary/30" /><div className="absolute bottom-8 left-8 right-8 flex items-center gap-3"><span className="h-1 flex-1 bg-primary/20" /><LockKeyhole className="h-6 w-6 text-primary" /><span className="h-1 flex-1 bg-primary/20" /></div></div>
    </header>
    <form onSubmit={submit} className="grid gap-10 py-12 lg:grid-cols-[0.8fr_1.2fr]">
      <div><KeyRound className="h-7 w-7 text-primary" /><h2 className="mt-3 text-xl font-semibold">{t("Set a new password", "设置新密码")}</h2><p className="mt-2 text-sm leading-6 text-foreground/65">{t("Use at least eight characters with uppercase, lowercase and a number.", "至少8位，并同时包含大写字母、小写字母和数字。")}</p></div>
      <div className="space-y-5">
        <label className="block text-sm font-medium">{t("Current password", "当前密码")}<input type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3" /></label>
        <label className="block text-sm font-medium">{t("New password", "新密码")}<input type="password" autoComplete="new-password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3" /></label>
        <label className="block text-sm font-medium">{t("Confirm new password", "再次输入新密码")}<input type="password" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3" /></label>
        <button disabled={saving} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-50"><ShieldCheck className="h-4 w-4" />{saving ? t("Updating...", "更新中...") : t("Update password", "更新密码")}</button>
      </div>
    </form>
  </div>;
}
