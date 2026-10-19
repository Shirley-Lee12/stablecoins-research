import React from "react";
import { useLanguage } from "@/lib/language-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Gauge, Percent, Sigma, Clock } from "lucide-react";

export default function Quantitative() {
  const { t } = useLanguage();
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="border-b border-border pb-6">
        <h2 className="text-3xl font-serif font-bold text-primary tracking-tight">
          {t("Quantitative Indicators", "量化指标")}
        </h2>
        <p className="mt-2 text-muted-foreground max-w-3xl">
          {t(
            "Proposed research directions. No operational index or validated predictive model is published here.",
            "拟开展的研究方向；此处没有已上线指数或已验证的预测模型。"
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-sm border-primary/20 bg-gradient-to-br from-background to-muted/30 overflow-hidden relative">
          <div className="absolute -right-10 -top-10 text-primary/5">
            <Gauge className="w-48 h-48" />
          </div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-xl font-serif flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-md">
                <Percent className="h-5 w-5 text-primary" />
              </div>
              {t("Stablecoin De-peg Risk Index", "稳定币脱锚风险指数")}
            </CardTitle>
            <CardDescription className="text-sm pt-2">
              {t(
                "A proposed research direction for studying peg stability and its relationship to liquidity, reserves and exchange conditions; not a real-time probability estimate.",
                "拟研究稳定币锚定稳定性的测量设计；不是实时脱锚概率或已验证指数。"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 mt-4">
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg bg-background/50 backdrop-blur-sm">
               <Clock className="h-8 w-8 mb-4 text-muted-foreground opacity-50" />
               <h3 className="text-lg font-medium text-foreground mb-1">{t("Future research direction", "未来研究方向")}</h3>
               <p className="text-sm text-muted-foreground text-center max-w-sm">
                 {t("No validated model, risk probability or confirmed release date is available.", "暂无经验证模型、风险概率或已确认发布日期。")}
               </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/20 bg-gradient-to-br from-background to-muted/30 overflow-hidden relative">
          <div className="absolute -right-10 -top-10 text-primary/5">
            <Sigma className="w-48 h-48" />
          </div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-xl font-serif flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-md">
                <BarChart className="h-5 w-5 text-primary" />
              </div>
              {t("Global Adoption Velocity", "全球采用流转率")}
            </CardTitle>
            <CardDescription className="text-sm pt-2">
              {t(
                "Tracking the speed of stablecoin integration into real-world payments, remittances, and institutional settlement layers across different economic regions.",
                "跟踪稳定币在不同经济区域融入现实世界支付、汇款和机构结算层的速度。"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 mt-4">
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg bg-background/50 backdrop-blur-sm">
               <Clock className="h-8 w-8 mb-4 text-muted-foreground opacity-50" />
               <h3 className="text-lg font-medium text-foreground mb-1">{t("Future research direction", "未来研究方向")}</h3>
               <p className="text-sm text-muted-foreground text-center max-w-sm">
                 {t("A proposed area of study; no payment-gateway collaboration or measured adoption index is claimed.", "拟研究领域；不声称已与支付网关合作或已完成采用指数。")}
               </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
