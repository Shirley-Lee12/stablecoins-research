import { useLanguage } from "@/lib/language-context";
export function FridayDataNotice() {
 const {t}=useLanguage();
 return <p data-friday-data-notice className="mb-5 border border-border px-4 py-3 text-xs leading-7 text-muted-foreground">{t(
  "Restoration data snapshot: supply observed 19 Oct 2026; mechanism shares cover 50 returned top-50 USD-target candidates, not the whole market. Prices are collection-time observations. Macro and order books are 18 Oct snapshots, not live. Missing data is not zero.",
  "恢复版数据快照：供应观测于2026-10-19；机制占比仅覆盖前50名美元锚定候选中取得记录的50项，并非全市场。价格为采集时点；宏观及订单簿为10月18日快照，非实时。缺失值不记为零。"
 )}</p>;
}
