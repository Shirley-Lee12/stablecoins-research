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
            "Proprietary indices and risk assessment models developed by the ZIBS Stablecoins Research Hub.", 
            "浙江大学ZIBS稳定币研究中心开发的专有指数和风险评估模型。"
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
              {t("ZIBS Stablecoin De-peg Risk Index", "ZIBS稳定币脱锚风险指数")}
            </CardTitle>
            <CardDescription className="text-sm pt-2">
              {t(
                "A real-time gauge measuring the probability of major fiat-backed stablecoins losing their peg, factoring in market liquidity, on-chain reserves, and exchange imbalances.",
                "实时衡量主要法币支持稳定币脱锚概率的指标，综合考虑市场流动性、链上储备和交易所失衡因素。"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 mt-4">
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg bg-background/50 backdrop-blur-sm">
               <Clock className="h-8 w-8 mb-4 text-muted-foreground opacity-50" />
               <h3 className="text-lg font-medium text-foreground mb-1">{t("Model under calibration", "模型校准中")}</h3>
               <p className="text-sm text-muted-foreground text-center max-w-sm">
                 {t("Our quantitative team is finalizing the risk parameters. Expected release: Q3 2024.", "我们的量化团队正在最终确定风险参数。预计发布时间：2024年第三季度。")}
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
               <h3 className="text-lg font-medium text-foreground mb-1">{t("Data aggregation in progress", "数据汇总中")}</h3>
               <p className="text-sm text-muted-foreground text-center max-w-sm">
                 {t("Collaborating with international payment gateways to source anonymized velocity metrics.", "正在与国际支付网关合作获取匿名的流转率指标。")}
               </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
