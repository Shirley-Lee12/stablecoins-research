import { useEffect, useMemo, useState } from "react";
import { Bell, Building2, Check, CircleUserRound, Eye, Languages, Moon, Save, Sun, UserRoundCheck, X } from "lucide-react";
import { useAuth, authenticatedFetch } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { useTheme } from "@/lib/theme-context";
import { useToast } from "@/hooks/use-toast";

function apiBase() {
  return (import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL).replace(/\/$/, "");
}

type Profile = {
  id: number; email: string; name: string; role: "user" | "admin";
  institution: string | null; title: string | null; bio: string | null;
  locale: "zh" | "en"; themePreference: "light" | "dark" | "system";
  fontScale: "small" | "medium" | "large"; notificationInApp: boolean; notificationEmail: boolean;
  notificationDigest: "instant" | "daily" | "weekly" | "off";
};

type Follow = { id: number; targetType: "author" | "institution"; targetKey: string; targetLabel: string };

export default function ProfilePage() {
  const { user, token, updateUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { setTheme } = useTheme();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [follows, setFollows] = useState<Follow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      authenticatedFetch(`${apiBase()}/api/account/profile`, { headers }).then((res) => res.ok ? res.json() : null),
      authenticatedFetch(`${apiBase()}/api/account/follows`, { headers }).then((res) => res.ok ? res.json() : []),
    ]).then(([nextProfile, nextFollows]) => { setProfile(nextProfile); setFollows(nextFollows); });
  }, [token]);

  const initials = useMemo(() => (profile?.name || user?.name || "U").slice(0, 2).toUpperCase(), [profile?.name, user?.name]);

  async function save() {
    if (!profile || !token) return;
    setSaving(true);
    try {
      const response = await authenticatedFetch(`${apiBase()}/api/account/profile`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Save failed");
      setProfile(data);
      updateUser({ id: data.id, email: data.email, name: data.name, role: data.role });
      setLanguage(data.locale);
      const resolvedTheme = data.themePreference === "system"
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : data.themePreference;
      setTheme(resolvedTheme);
      document.documentElement.style.fontSize = data.fontScale === "small" ? "15px" : data.fontScale === "large" ? "18px" : "16px";
      localStorage.setItem("app-font-scale", data.fontScale);
      toast({ title: t("Profile saved", "个人资料已保存"), description: t("Your account and display preferences are now active.", "账号信息和界面偏好已生效。") });
    } catch (error) {
      toast({ title: t("Could not save", "保存失败"), description: error instanceof Error ? error.message : "Save failed", variant: "destructive" });
    } finally { setSaving(false); }
  }

  async function unfollow(follow: Follow) {
    if (!token) return;
    const response = await authenticatedFetch(`${apiBase()}/api/account/follows/${follow.targetType}/${encodeURIComponent(follow.targetKey)}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) setFollows((items) => items.filter((item) => item.id !== follow.id));
  }

  if (!user) return <div className="mx-auto max-w-2xl py-20 text-center text-muted-foreground">{t("Sign in to manage your profile.", "请登录后管理个人资料。")}</div>;
  if (!profile) return <div className="mx-auto max-w-4xl py-20 text-center text-muted-foreground">{t("Loading profile...", "正在加载个人资料...")}</div>;

  return (
    <div className="mx-auto max-w-5xl pb-20">
      <header className="grid items-end gap-7 border-b border-border pb-10 lg:grid-cols-[1fr_auto]">
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">{initials}</div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t("Account and preferences", "账号与偏好")}</p><h1 className="mt-2 font-serif text-4xl font-semibold text-primary">{profile.name}</h1><p className="mt-1 text-foreground/65">{profile.email}</p></div>
        </div>
        <button onClick={() => void save()} disabled={saving} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-50"><Save className="h-4 w-4" />{saving ? t("Saving...", "保存中...") : t("Save changes", "保存更改")}</button>
      </header>

      <section className="grid gap-12 border-b border-border py-12 lg:grid-cols-[220px_1fr]">
        <div><CircleUserRound className="h-7 w-7 text-primary" /><h2 className="mt-3 text-xl font-semibold">{t("Profile", "个人资料")}</h2><p className="mt-2 text-sm leading-6 text-foreground/65">{t("Information shown with your contributions and account.", "用于账号及贡献记录的个人信息。")}</p></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-medium">{t("Name", "用户名")}<input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 font-normal" /></label>
          <label className="text-sm font-medium">{t("Email", "邮箱")}<input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 font-normal" /></label>
          <label className="text-sm font-medium">{t("Institution", "机构")}<input value={profile.institution ?? ""} onChange={(e) => setProfile({ ...profile, institution: e.target.value })} className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 font-normal" /></label>
          <label className="text-sm font-medium">{t("Role or title", "职务或身份")}<input value={profile.title ?? ""} onChange={(e) => setProfile({ ...profile, title: e.target.value })} className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 font-normal" /></label>
          <label className="text-sm font-medium sm:col-span-2">{t("Short bio", "个人简介")}<textarea rows={4} value={profile.bio ?? ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} className="mt-2 w-full rounded-md border border-border bg-background p-3 font-normal leading-6" /></label>
        </div>
      </section>

      <section className="grid gap-12 border-b border-border py-12 lg:grid-cols-[220px_1fr]">
        <div><Eye className="h-7 w-7 text-primary" /><h2 className="mt-3 text-xl font-semibold">{t("Display", "界面偏好")}</h2><p className="mt-2 text-sm leading-6 text-foreground/65">{t("Choose a comfortable reading setup.", "选择更舒适的阅读设置。")}</p></div>
        <div className="space-y-7">
          <PreferenceRow icon={Languages} label={t("Language", "语言")}>
            <Segment options={[{value:"zh",label:"中文"},{value:"en",label:"English"}]} value={profile.locale} onChange={(value) => setProfile({ ...profile, locale: value as "zh" | "en" })} />
          </PreferenceRow>
          <PreferenceRow icon={profile.themePreference === "dark" ? Moon : Sun} label={t("Theme", "主题")}>
            <Segment options={[{value:"system",label:t("System", "跟随系统")},{value:"light",label:t("Light", "浅色")},{value:"dark",label:t("Dark", "深色")}]} value={profile.themePreference} onChange={(value) => setProfile({ ...profile, themePreference: value as Profile["themePreference"] })} />
          </PreferenceRow>
          <PreferenceRow icon={Eye} label={t("Text size", "字体大小")}>
            <Segment options={[{value:"small",label:t("Small", "较小")},{value:"medium",label:t("Standard", "标准")},{value:"large",label:t("Large", "较大")}]} value={profile.fontScale} onChange={(value) => setProfile({ ...profile, fontScale: value as Profile["fontScale"] })} />
          </PreferenceRow>
        </div>
      </section>

      <section className="grid gap-12 border-b border-border py-12 lg:grid-cols-[220px_1fr]">
        <div><Bell className="h-7 w-7 text-primary" /><h2 className="mt-3 text-xl font-semibold">{t("Notifications", "消息通知")}</h2><p className="mt-2 text-sm leading-6 text-foreground/65">{t("Control followed-author update emails.", "设置关注作者与机构的更新提醒。")}</p></div>
        <div className="space-y-5">
          <label className="flex items-center justify-between gap-5 border-b border-border pb-5"><span><strong className="block text-sm">{t("In-site notifications", "站内消息提醒")}</strong><span className="mt-1 block text-sm text-foreground/60">{t("Show followed-author and institution updates in the message center.", "在网站消息中心接收关注专家与机构的更新。")}</span></span><button type="button" onClick={() => setProfile({ ...profile, notificationInApp: !profile.notificationInApp })} className={`relative h-7 w-12 rounded-full transition-colors ${profile.notificationInApp ? "bg-emerald-600" : "bg-muted"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${profile.notificationInApp ? "translate-x-6" : "translate-x-1"}`} /></button></label>
          <label className="flex items-center justify-between gap-5 border-b border-border pb-5"><span><strong className="block text-sm">{t("Email notifications", "邮件提醒")}</strong><span className="mt-1 block text-sm text-foreground/60">{t("Receive publication updates outside the site.", "在站外接收新资源提醒。")}</span></span><button type="button" onClick={() => setProfile({ ...profile, notificationEmail: !profile.notificationEmail })} className={`relative h-7 w-12 rounded-full transition-colors ${profile.notificationEmail ? "bg-emerald-600" : "bg-muted"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${profile.notificationEmail ? "translate-x-6" : "translate-x-1"}`} /></button></label>
          <label className={`block text-sm font-medium ${profile.notificationEmail ? "" : "opacity-50"}`}>{t("Email frequency", "邮件频率")}<select disabled={!profile.notificationEmail} value={profile.notificationDigest} onChange={(e) => setProfile({ ...profile, notificationDigest: e.target.value as Profile["notificationDigest"] })} className="mt-2 h-11 w-full max-w-sm rounded-md border border-border bg-background px-3 font-normal disabled:cursor-not-allowed"><option value="instant">{t("Instant", "即时")}</option><option value="daily">{t("Daily digest", "每日汇总")}</option><option value="weekly">{t("Weekly digest", "每周汇总")}</option><option value="off">{t("No email", "不发邮件")}</option></select></label>
        </div>
      </section>

      <section className="grid gap-12 py-12 lg:grid-cols-[220px_1fr]">
        <div><UserRoundCheck className="h-7 w-7 text-primary" /><h2 className="mt-3 text-xl font-semibold">{t("Following", "我的关注")}</h2><p className="mt-2 text-sm leading-6 text-foreground/65">{t("Experts and institutions whose new work appears in your messages.", "新成果会进入站内消息的专家和机构。")}</p></div>
        {follows.length ? <div className="divide-y divide-border border-y border-border">{follows.map((follow) => <div key={follow.id} className="flex items-center justify-between gap-4 py-4"><span className="inline-flex items-center gap-3"><Building2 className="h-4 w-4 text-primary" /><span><strong className="block text-sm">{follow.targetLabel}</strong><span className="text-xs text-foreground/55">{follow.targetType === "author" ? t("Expert", "专家学者") : t("Institution", "机构")}</span></span></span><button onClick={() => void unfollow(follow)} className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-3 text-xs hover:bg-muted"><X className="h-3.5 w-3.5" />{t("Unfollow", "取消关注")}</button></div>)}</div> : <div className="flex min-h-36 items-center justify-center border-y border-border text-sm text-foreground/60">{t("Follow experts or institutions from their profile pages.", "可在专家学者详情页关注专家或机构。")}</div>}
      </section>
    </div>
  );
}

function PreferenceRow({ icon: Icon, label, children }: { icon: typeof Check; label: string; children: React.ReactNode }) {
  return <div className="flex flex-col justify-between gap-3 border-b border-border pb-6 sm:flex-row sm:items-center"><span className="inline-flex items-center gap-2 text-sm font-medium"><Icon className="h-4 w-4 text-primary" />{label}</span>{children}</div>;
}

function Segment({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (value: string) => void }) {
  return <div className="inline-flex overflow-hidden rounded-md border border-border bg-background">{options.map((option) => <button key={option.value} type="button" onClick={() => onChange(option.value)} className={`h-9 px-3 text-xs font-medium ${value === option.value ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{option.label}</button>)}</div>;
}
