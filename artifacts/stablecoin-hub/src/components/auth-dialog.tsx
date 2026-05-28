import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

type View = "login" | "register" | "forgot" | "reset-success";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialView?: View;
}

export function AuthDialog({ open, onOpenChange, initialView = "login" }: AuthDialogProps) {
  const { t } = useLanguage();
  const { login, register, forgotPassword } = useAuth();
  const [view, setView] = useState<View>(initialView);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resetInfo, setResetInfo] = useState<string | null>(null);

  const [form, setForm] = useState({ email: "", name: "", password: "", confirmPassword: "" });
  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const reset = () => { setError(null); setForm({ email: "", name: "", password: "", confirmPassword: "" }); };
  const switchTo = (v: View) => { reset(); setView(v); };

  const handleClose = (open: boolean) => {
    if (!open) { reset(); setView("login"); setResetInfo(null); }
    onOpenChange(open);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(form.email, form.password);
      handleClose(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      setError(t("Passwords do not match.", "两次输入的密码不一致。"));
      return;
    }
    if (form.password.length < 8) {
      setError(t("Password must be at least 8 characters.", "密码至少需要8个字符。"));
      return;
    }
    setIsLoading(true);
    try {
      await register(form.email, form.name, form.password);
      handleClose(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const result = await forgotPassword(form.email);
      setResetInfo(result.resetToken ?? null);
      setView("reset-success");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        {view === "login" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">{t("Sign In", "登录")}</DialogTitle>
              <DialogDescription>{t("Welcome back to ZIBS Stablecoins Research Hub.", "欢迎回到浙大ZIBS稳定币研究中心。")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleLogin} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="login-email">{t("Email", "邮箱")}</Label>
                <Input id="login-email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={update("email")} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">{t("Password", "密码")}</Label>
                <div className="relative">
                  <Input id="login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" value={form.password} onChange={update("password")} required className="pr-10" />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && <div className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Sign In", "登录")}
              </Button>
              <div className="flex flex-col gap-2 text-center text-sm">
                <button type="button" onClick={() => switchTo("forgot")} className="text-muted-foreground hover:text-primary transition-colors">
                  {t("Forgot password?", "忘记密码？")}
                </button>
                <div className="text-muted-foreground">
                  {t("No account?", "没有账号？")}{" "}
                  <button type="button" onClick={() => switchTo("register")} className="text-primary font-medium hover:underline">
                    {t("Register", "注册")}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}

        {view === "register" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">{t("Create Account", "注册账号")}</DialogTitle>
              <DialogDescription>{t("Join the ZIBS Stablecoins Research Hub.", "加入浙大ZIBS稳定币研究中心。")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRegister} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="reg-name">{t("Full Name", "姓名")}</Label>
                <Input id="reg-name" type="text" autoComplete="name" placeholder={t("Your Name", "您的姓名")} value={form.name} onChange={update("name")} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email">{t("Email", "邮箱")}</Label>
                <Input id="reg-email" type="email" autoComplete="email" placeholder="you@zju.edu.cn" value={form.email} onChange={update("email")} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">{t("Password", "密码")}</Label>
                <div className="relative">
                  <Input id="reg-password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder={t("Min. 8 characters", "至少8个字符")} value={form.password} onChange={update("password")} required className="pr-10" />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-confirm">{t("Confirm Password", "确认密码")}</Label>
                <Input id="reg-confirm" type="password" autoComplete="new-password" placeholder="••••••••" value={form.confirmPassword} onChange={update("confirmPassword")} required />
              </div>
              {error && <div className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Create Account", "创建账号")}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {t("Already have an account?", "已有账号？")}{" "}
                <button type="button" onClick={() => switchTo("login")} className="text-primary font-medium hover:underline">
                  {t("Sign In", "登录")}
                </button>
              </p>
            </form>
          </>
        )}

        {view === "forgot" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">{t("Reset Password", "重置密码")}</DialogTitle>
              <DialogDescription>{t("Enter your email to receive a password reset link.", "输入您的邮箱以获取密码重置链接。")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleForgotPassword} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">{t("Email", "邮箱")}</Label>
                <Input id="forgot-email" type="email" placeholder="you@example.com" value={form.email} onChange={update("email")} required />
              </div>
              {error && <div className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Send Reset Link", "发送重置链接")}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <button type="button" onClick={() => switchTo("login")} className="text-primary font-medium hover:underline">
                  {t("Back to Sign In", "返回登录")}
                </button>
              </p>
            </form>
          </>
        )}

        {view === "reset-success" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">{t("Reset Link Generated", "重置链接已生成")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <p className="text-sm text-green-800 dark:text-green-300">
                  {t("A reset token has been generated for this account.", "已为此账号生成重置令牌。")}
                </p>
              </div>
              {resetInfo && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("Reset Token (share securely):", "重置令牌（请安全分享）：")}</Label>
                  <div className="font-mono text-xs bg-muted rounded p-2 break-all select-all">{resetInfo}</div>
                  <p className="text-xs text-muted-foreground">{t("This token expires in 1 hour. Use it at /reset-password?token=...", "此令牌1小时后过期。使用 /reset-password?token=... 重置密码。")}</p>
                </div>
              )}
              <Button className="w-full" onClick={() => handleClose(false)}>{t("Done", "完成")}</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
