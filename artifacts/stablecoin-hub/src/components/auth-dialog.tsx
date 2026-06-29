import React, { useState } from "react";
import { useAuth, VerificationRequiredError } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2, Mail } from "lucide-react";

type View = "login" | "register" | "verify" | "forgot" | "forgot-sent";

function isValidPassword(password: string): boolean {
  return password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password);
}

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialView?: View;
}

export function AuthDialog({ open, onOpenChange, initialView = "login" }: AuthDialogProps) {
  const { t } = useLanguage();
  const { login, register, verifyEmail, resendVerification, forgotPassword } = useAuth();
  const [view, setView] = useState<View>(initialView);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const [form, setForm] = useState({ email: "", name: "", password: "", confirmPassword: "", code: "" });
  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const reset = () => { setError(null); setResendMessage(null); setForm({ email: "", name: "", password: "", confirmPassword: "", code: "" }); };
  const switchTo = (v: View) => { reset(); setView(v); };

  const handleClose = (open: boolean) => {
    if (!open) { reset(); setView("login"); setPendingEmail(""); }
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
      if (err instanceof VerificationRequiredError) {
        setPendingEmail(err.email);
        setForm(f => ({ ...f, email: err.email }));
        setView("verify");
      } else {
        setError(err.message);
      }
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
    if (!isValidPassword(form.password)) {
      setError(t(
        "Password must be at least 8 characters and include both an uppercase and a lowercase letter.",
        "密码至少需要8个字符，且必须包含至少一个大写字母和一个小写字母。",
      ));
      return;
    }
    setIsLoading(true);
    try {
      const result = await register(form.email, form.name, form.password);
      setPendingEmail(result.email);
      setView("verify");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await verifyEmail(pendingEmail, form.code);
      handleClose(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResendMessage(null);
    setIsLoading(true);
    try {
      const result = await resendVerification(pendingEmail);
      setResendMessage(result.message);
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
      await forgotPassword(form.email);
      setView("forgot-sent");
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
                  <Input id="reg-password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder={t("Min. 8 chars, upper + lower", "至少8位，含大小写字母")} value={form.password} onChange={update("password")} required className="pr-10" />
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

        {view === "verify" && (
          <>
            <DialogHeader>
              <Mail className="h-8 w-8 text-primary mb-1" />
              <DialogTitle className="font-serif text-xl">{t("Verify Your Email", "验证邮箱")}</DialogTitle>
              <DialogDescription>
                {t(
                  `We sent a 6-digit code to ${pendingEmail}. Enter it below to continue.`,
                  `我们已向 ${pendingEmail} 发送了一个6位验证码，请在下方输入以继续。`,
                )}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleVerify} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="verify-code">{t("Verification Code", "验证码")}</Label>
                <Input
                  id="verify-code" type="text" inputMode="numeric" maxLength={6}
                  placeholder="123456" value={form.code} onChange={update("code")}
                  className="text-center text-lg tracking-[0.3em] font-mono" required
                />
              </div>
              {error && <div className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
              {resendMessage && <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400"><CheckCircle2 className="h-4 w-4 shrink-0" />{resendMessage}</div>}
              <Button type="submit" className="w-full" disabled={isLoading || form.code.length !== 6}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Verify & Continue", "验证并继续")}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {t("Didn't get a code?", "没收到验证码？")}{" "}
                <button type="button" onClick={handleResend} disabled={isLoading} className="text-primary font-medium hover:underline disabled:opacity-50">
                  {t("Resend", "重新发送")}
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

        {view === "forgot-sent" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">{t("Check Your Email", "请查看邮箱")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <p className="text-sm text-green-800 dark:text-green-300">
                  {t(
                    "If an account exists for this email, a password reset link has been sent. The link expires in 1 hour.",
                    "如果该邮箱已注册，重置密码的链接已发送至您的邮箱。链接1小时内有效。",
                  )}
                </p>
              </div>
              <Button className="w-full" onClick={() => handleClose(false)}>{t("Done", "完成")}</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
