import React from "react";
import { useLanguage } from "@/lib/language-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Activity, Database, Clock } from "lucide-react";

export default function MarketData() {
  const { t } = useLanguage();
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="border-b border-border pb-6">
        <h2 className="text-3xl font-serif font-bold text-primary tracking-tight">
          {t("Market Data", "市场数据")}
        </h2>
        <p className="mt-2 text-muted-foreground max-w-3xl">
          {t(
            "Live tracking and historical analysis of stablecoin market capitalization, trading volumes, and macroeconomic correlations.", 
            "实时跟踪和历史分析稳定币市值、交易量以及宏观经济相关性。"
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm opacity-80 border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-primary/10 rounded-md">
                <LineChart className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">{t("Stablecoin Market Data", "稳定币市场数据")}</CardTitle>
            </div>
            <CardDescription>
              {t("Market cap, daily volume, and supply distribution across chains.", "市值、日交易量和跨链供应分布。")}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-48 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 m-4 rounded-md border border-border/50">
            <Clock className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm font-medium">{t("Coming Soon", "敬请期待")}</p>
            <p className="text-xs mt-1 text-center px-4">Integrating with CoinGecko and CoinMarketCap APIs.</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm opacity-80 border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-primary/10 rounded-md">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">{t("Macroeconomic Data", "宏观经济数据")}</CardTitle>
            </div>
            <CardDescription>
              {t("Interest rates, inflation indexes, and central bank balance sheets.", "利率、通胀指数和央行资产负债表。")}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-48 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 m-4 rounded-md border border-border/50">
            <Clock className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm font-medium">{t("Coming Soon", "敬请期待")}</p>
            <p className="text-xs mt-1 text-center px-4">Integrating with FRED and World Bank datasets.</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm opacity-80 border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-primary/10 rounded-md">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">{t("Blockchain Data", "区块链数据")}</CardTitle>
            </div>
            <CardDescription>
              {t("On-chain velocity, active addresses, and smart contract interactions.", "链上流转率、活跃地址和智能合约交互。")}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-48 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 m-4 rounded-md border border-border/50">
            <Clock className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm font-medium">{t("Coming Soon", "敬请期待")}</p>
            <p className="text-xs mt-1 text-center px-4">Integrating with Glassnode and Dune Analytics.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
