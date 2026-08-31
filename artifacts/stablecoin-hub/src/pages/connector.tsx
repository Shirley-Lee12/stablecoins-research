import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Chrome, Download, ExternalLink, Laptop, Loader2, Puzzle, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { authenticatedFetch, useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";

function apiBase() {
  return (import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL).replace(/\/$/, "");
}

const RELEASE = "0.3.0";
const DOWNLOAD_URL = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/downloads/zibs-stablecoin-research-connector-${RELEASE}.zip`;

type ConnectorSession = {
  id: number;
  clientName: string;
  tokenPrefix: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

type PairingInfo = { clientName: string; status: string; expiresAt: string };

export default function ConnectorPage() {
  const { user, token } = useAuth();
  const { language, t } = useLanguage();
  const [, navigate] = useLocation();
  const code = useMemo(() => new URLSearchParams(window.location.search).get("code")?.toUpperCase() ?? "", []);
  const isAuthorize = window.location.pathname.endsWith("/connector/authorize");
  const [sessions, setSessions] = useState<ConnectorSession[]>([]);
  const [pairing, setPairing] = useState<PairingInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");

  const loadSessions = useCallback(async () => {
    if (!token) { setSessions([]); return; }
    const response = await authenticatedFetch(`${apiBase()}/api/account/connector-sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) setSessions(await response.json());
  }, [token]);

  useEffect(() => { if (!isAuthorize) void loadSessions(); }, [isAuthorize, loadSessions]);

  useEffect(() => {
    if (!isAuthorize || !code) return;
    fetch(`${apiBase()}/api/connector/pairings/code/${encodeURIComponent(code)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Pairing code not found");
        setPairing(data);
        if (data.status === "authorized" || data.status === "consumed") setAuthorized(true);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : String(reason)));
  }, [code, isAuthorize]);

  function requestSignIn() {
    window.dispatchEvent(new CustomEvent("stablecoin:open-auth", { detail: { view: "login" } }));
  }

  async function authorize() {
    if (!token || !code) return;
    setBusy(true); setError("");
    try {
      const response = await authenticatedFetch(`${apiBase()}/api/connector/pairings/${encodeURIComponent(code)}/authorize`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Authorization failed");
      setAuthorized(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally { setBusy(false); }
  }

  async function revoke(id: number) {
    if (!token) return;
    setBusy(true);
    try {
      const response = await authenticatedFetch(`${apiBase()}/api/account/connector-sessions/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Could not revoke browser connection");
      await loadSessions();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally { setBusy(false); }
  }

  if (isAuthorize) {
    return (
      <div className="mx-auto max-w-3xl pb-20">
        <header className="border-b border-border pb-9">
          <p className="text-xs font-semibold uppercase text-primary">ZIBS Connector</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold text-primary">{t("Connect this browser", "连接此浏览器")}</h1>
          <p className="mt-3 max-w-2xl leading-7 text-foreground/65">{t("Review the requested permission before linking the connector to your account.", "请确认权限范围，再将浏览器采集工具连接到您的账号。")}</p>
        </header>
        <section className="py-10">
          {error ? <div className="border-l-4 border-destructive bg-destructive/5 px-5 py-4 text-sm text-destructive">{error}</div> : !pairing ? <div className="flex items-center gap-3 text-foreground/60"><Loader2 className="h-5 w-5 animate-spin" />{t("Checking pairing request...", "正在核对配对请求…")}</div> : authorized ? (
            <div className="border-y border-emerald-600/30 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"><Check className="h-6 w-6" /></div>
              <h2 className="mt-5 text-2xl font-semibold">{t("Browser connected", "浏览器已连接")}</h2>
              <p className="mt-2 text-foreground/60">{t("Return to the connector. It will keep this connection until you revoke it.", "请返回插件。连接将持续有效，直到您主动撤销。")}</p>
            </div>
          ) : (
            <div className="space-y-7">
              <div className="grid gap-5 border-y border-border py-6 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="flex items-start gap-4"><Laptop className="mt-1 h-6 w-6 text-primary" /><div><strong className="block">{pairing.clientName}</strong><span className="mt-1 block text-sm text-foreground/55">{t("Pairing code", "配对码")} · <span className="font-mono text-foreground">{code}</span></span></div></div>
                <span className="max-w-56 text-sm leading-6 text-foreground/55">{t("This one-time pairing code is valid for 10 minutes. The completed connection does not expire automatically.", "仅此一次性配对码在 10 分钟内有效；连接成功后不会自动失效。")}</span>
              </div>
              <div className="flex items-start gap-4"><ShieldCheck className="mt-1 h-6 w-6 text-primary" /><div><strong>{t("Requested permission", "申请的权限")}</strong><p className="mt-1 text-sm leading-6 text-foreground/60">{t("Submit the current page to your resource review queue. It cannot manage users, approve records, or read your account password.", "将当前网页提交到您的资源待确认队列。插件不能管理用户、审核通过资源，也不能读取账号密码。")}</p></div></div>
              {!user ? <button type="button" onClick={requestSignIn} className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground"><ExternalLink className="h-4 w-4" />{t("Sign in to continue", "登录后继续")}</button> : <button type="button" onClick={() => void authorize()} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}{t("Allow connection", "允许连接")}</button>}
            </div>
          )}
        </section>
      </div>
    );
  }

  const activeSessions = sessions.filter((session) => !session.revokedAt && (!session.expiresAt || new Date(session.expiresAt).getTime() > Date.now()));
  return (
    <div className="mx-auto max-w-6xl pb-20">
      <header className="grid gap-8 border-b border-border pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div><p className="text-xs font-semibold uppercase text-primary">ZIBS Stablecoin Research Connector</p><h1 className="mt-3 font-serif text-4xl font-semibold text-primary">{t("Browser capture tool", "浏览器采集工具")}</h1><p className="mt-3 max-w-3xl leading-7 text-foreground/65">{t("Capture bibliographic metadata from the paper, regulation, report, or dataset already open in your browser. Incomplete fields are prepared with AI and always return to the site for confirmation.", "从浏览器当前打开的论文、法规、报告或数据集页面提取题录；缺失字段由 AI 辅助补全，并始终回到网站人工确认。")}</p></div>
        <a href={DOWNLOAD_URL} download className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground"><Download className="h-4 w-4" />{t("Download connector", "下载插件")} <span className="opacity-70">v{RELEASE}</span></a>
      </header>

      <section className="grid gap-10 border-b border-border py-12 lg:grid-cols-[220px_1fr]">
        <div><Puzzle className="h-7 w-7 text-primary" /><h2 className="mt-3 text-xl font-semibold">{t("Install", "安装")}</h2><p className="mt-2 text-sm leading-6 text-foreground/60">Chrome · Microsoft Edge</p></div>
        <ol className="divide-y divide-border border-y border-border">
          {[
            t("Download the ZIP package and extract it to a folder you will keep.", "下载 ZIP 安装包，并解压到一个长期保留的文件夹。"),
            t("Open chrome://extensions or edge://extensions and enable Developer mode.", "打开 chrome://extensions 或 edge://extensions，开启“开发者模式”。"),
            t("Choose Load unpacked, then select the extracted folder containing manifest.json.", "点击“加载已解压的扩展程序”，选择包含 manifest.json 的解压文件夹。"),
            t("Pin ZIBS Connector to the toolbar, open it, and authorize your account.", "将 ZIBS Connector 固定到工具栏，打开插件并完成账号授权。"),
          ].map((text, index) => <li key={text} className="grid grid-cols-[36px_1fr] gap-3 py-4"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span><span className="pt-1 text-sm leading-6">{text}</span></li>)}
        </ol>
      </section>

      <section className="grid gap-10 border-b border-border py-12 lg:grid-cols-[220px_1fr]">
        <div><Chrome className="h-7 w-7 text-primary" /><h2 className="mt-3 text-xl font-semibold">{t("Capture flow", "采集流程")}</h2></div>
        <div className="grid gap-px border-y border-border bg-border sm:grid-cols-3">
          {[{n:"01",en:"Read trusted page metadata",zh:"读取网页可信题录"},{n:"02",en:"Fill only missing fields",zh:"仅补全缺失字段"},{n:"03",en:"Review before saving",zh:"确认后再入库"}].map((item) => <div key={item.n} className="bg-background px-5 py-6"><span className="font-mono text-xs text-primary">{item.n}</span><strong className="mt-3 block text-sm">{language === "zh" ? item.zh : item.en}</strong></div>)}
        </div>
      </section>

      <section className="grid gap-10 py-12 lg:grid-cols-[220px_1fr]">
        <div><ShieldCheck className="h-7 w-7 text-primary" /><h2 className="mt-3 text-xl font-semibold">{t("Connected browsers", "已连接浏览器")}</h2><p className="mt-2 text-sm leading-6 text-foreground/60">{t("Revoke a browser you no longer use.", "可随时撤销不再使用的浏览器。")}</p></div>
        {!user ? <div className="border-y border-border py-8"><p className="m-0 text-sm text-foreground/60">{t("Sign in to view and manage connected browsers.", "登录后可查看和管理已连接浏览器。")}</p><button type="button" onClick={requestSignIn} className="mt-4 inline-flex h-10 items-center rounded-md border border-primary px-4 text-sm font-medium text-primary">{t("Sign in", "登录")}</button></div> : activeSessions.length ? <div className="divide-y divide-border border-y border-border">{activeSessions.map((session) => <div key={session.id} className="flex flex-col justify-between gap-4 py-5 sm:flex-row sm:items-center"><div className="flex items-start gap-4"><Laptop className="mt-1 h-5 w-5 text-primary" /><div><strong className="block text-sm">{session.clientName}</strong><span className="mt-1 block text-xs text-foreground/55">{t("Last used", "最近使用")} · {session.lastUsedAt ? new Date(session.lastUsedAt).toLocaleString() : t("Not yet", "尚未使用")}</span><span className="mt-1 block text-xs text-emerald-700 dark:text-emerald-400">{t("Connected until revoked", "持续连接，直至主动撤销")}</span></div></div><button type="button" onClick={() => void revoke(session.id)} disabled={busy} className="inline-flex h-9 items-center gap-2 self-start rounded-md border border-destructive/40 px-3 text-xs font-medium text-destructive hover:bg-destructive/5 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" />{t("Revoke", "撤销")}</button></div>)}</div> : <div className="flex min-h-32 items-center justify-center border-y border-border text-sm text-foreground/55">{t("No browser is connected yet.", "尚未连接浏览器。")}</div>}
      </section>
      {error && <div className="border-l-4 border-destructive bg-destructive/5 px-5 py-4 text-sm text-destructive">{error}<button onClick={() => { setError(""); void loadSessions(); }} className="ml-3 inline-flex items-center gap-1 font-medium"><RefreshCw className="h-3.5 w-3.5" />{t("Retry", "重试")}</button></div>}
    </div>
  );
}
