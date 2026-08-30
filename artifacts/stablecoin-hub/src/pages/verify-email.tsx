import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { AlertCircle, CheckCircle2, Loader2, MailCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";

type VerificationState = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const { verifyEmail } = useAuth();
  const { t } = useLanguage();
  const started = useRef(false);
  const [state, setState] = useState<VerificationState>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email") ?? "";
    const code = params.get("code") ?? "";
    if (!email || !/^\d{6}$/.test(code)) {
      setState("error");
      setMessage(t("This verification link is incomplete.", "验证链接不完整。"));
      return;
    }
    void verifyEmail(email, code)
      .then(() => setState("success"))
      .catch((error: unknown) => {
        setState("error");
        setMessage(error instanceof Error ? error.message : t("Email verification failed.", "邮箱验证失败。"));
      });
  }, [t, verifyEmail]);

  return <div className="mx-auto flex min-h-[58vh] max-w-xl items-center justify-center py-16">
    <div className="w-full border-y border-border py-12 text-center">
      {state === "loading" && <><Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" /><h1 className="mt-5 font-serif text-3xl font-semibold text-primary">{t("Verifying email", "正在验证邮箱")}</h1><p className="mt-3 text-foreground/65">{t("Please wait a moment.", "请稍候。")}</p></>}
      {state === "success" && <><CheckCircle2 className="mx-auto h-11 w-11 text-emerald-600" /><h1 className="mt-5 font-serif text-3xl font-semibold text-primary">{t("Email verified", "邮箱验证成功")}</h1><p className="mt-3 text-foreground/70">{t("Your account is ready and you are now signed in.", "账号已启用，您现在已登录。")}</p><Link href="/profile" className="mt-7 inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground">{t("Open profile", "进入个人资料")}</Link></>}
      {state === "error" && <><AlertCircle className="mx-auto h-11 w-11 text-destructive" /><h1 className="mt-5 font-serif text-3xl font-semibold text-primary">{t("Verification unsuccessful", "验证未完成")}</h1><p className="mx-auto mt-3 max-w-md text-foreground/70">{message}</p><Link href="/" className="mt-7 inline-flex h-10 items-center rounded-md border border-border px-5 text-sm font-medium hover:bg-muted"><MailCheck className="mr-2 h-4 w-4" />{t("Return to sign in", "返回登录")}</Link></>}
    </div>
  </div>;
}
