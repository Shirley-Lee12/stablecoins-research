import pack from "./conference-risk-framework-v02.generated.json";
export const CONFERENCE = pack;
export type FrameworkCopy = readonly [string, string];
export const TITLES: Record<string, FrameworkCopy> = {
  overview: ["Stablecoin Risk Framework", "稳定币风险框架"],
  lifecycle: ["Lifecycle Mapping (T0–T3)", "生命周期映射（T0–T3）"],
  amplification: [
    "Amplification & Transmission Mapping (L0–L3)",
    "放大与传导映射（L0–L3）",
  ],
};
const moduleZh = [
  "支撑资产与资产负债表",
  "发行人透明度、法律结构与托管",
  "法币结算、监管与赎回",
  "二级市场、代币持有人与信心",
  "技术基础设施、代码、密码学与信息",
  "治理与特权控制",
  "DeFi 集成、链上市场与内生机制",
];
const tZh = [
  ["基础、支撑与发行", "支撑资产、法律与技术基础及发行安排的形成位置。"],
  ["流通、交易与结算", "代币进行流通、交易和结算，尚不一定嵌入多层金融头寸。"],
  [
    "协议嵌入与多层金融",
    "稳定币在协议中成为抵押品、流动性头寸或其他嵌入式金融头寸。",
  ],
  ["赎回、去杠杆与清算", "头寸退出、赎回、去杠杆或清算的运行位置。"],
];
const lZh = [
  ["初始触发", "直接启动风险事件的冲击。"],
  ["结构脆弱性", "冲击发生前已经存在、影响系统易受冲击程度的结构性弱点。"],
  ["动态放大", "被激活的反应或反馈循环，使初始冲击进一步放大。"],
  [
    "跨系统传导 / 结果",
    "影响越过目标稳定币的边界，传向其他稳定币、DeFi、更广泛的加密市场或传统金融市场。",
  ],
];
const riskZh: Record<string, string> = {
  C1: "宏观利率冲击",
  C5: "资产负债期限错配",
  C10: "储备资产市场容量不足",
  C11: "资产负债表透明度的时间滞后",
  C13: "高度集中的治理权限",
  C14: "储备资产缺乏破产隔离",
  C16: "托管机构信用违约",
  C17: "法币清算时间错配",
  C22: "二级市场订单簿深度不足",
  C25: "信用基础侵蚀",
  C26: "不对称的赎回渠道",
  U1: "底层公链网络拥堵",
  U2: "二层网络排序器停机",
  U8: "智能合约漏洞",
  U15: "DAO 治理提案操纵",
  U18: "DeFi 嵌套抵押风险",
  U21: "高摩擦引发套利失灵",
  U24: "通过 AMO 算法过度扩张信用",
  U25: "缺乏缓冲的连锁清算",
};
export function representativeRisks(value: string) {
  return value.split(";").map((s) => {
    const [id, ...rest] = s.trim().split(" — ");
    const name = rest.join(" — ");
    return { id, name: [name, riskZh[id] || name] as FrameworkCopy };
  });
}
export const MODULES = pack.modules.map((m, i) => ({
  ...m,
  title: [m.name, moduleZh[i]] as FrameworkCopy,
  risks: representativeRisks(m.representative_risks),
}));
export const LIFECYCLE = pack.lifecycle.map((r, i) => ({
  ...r,
  title: [r.label, tZh[i][0]] as FrameworkCopy,
  description: [r.meaning, tZh[i][1]] as FrameworkCopy,
  risks: representativeRisks(r.representative_risks),
}));
export const AMPLIFICATION = pack.amplification.map((r, i) => ({
  ...r,
  title: [r.label, lZh[i][0]] as FrameworkCopy,
  description: [r.meaning, lZh[i][1]] as FrameworkCopy,
  risks: i === 3 ? [] : representativeRisks(r.representative_risks_or_outcomes),
}));
export const OUTCOMES: FrameworkCopy[] = [
  ["Other stablecoins", "其他稳定币"],
  ["DeFi protocols", "DeFi 协议"],
  ["Broader crypto markets", "更广泛的加密市场"],
  ["Traditional financial markets", "传统金融市场"],
];
const futureZh = [
  ["风险专属指标集合", "将 atomic risks 转化为预先明确的测量设计与专属指标。"],
  ["适用时构建综合度量", "仅在概念上合理时构建综合度量。"],
  ["量化传导与放大", "研究风险单元及市场状态之间的方向性传导与动态放大。"],
  ["动态监测与早期预警", "发展时变监测、压力识别与分层早期预警工具。"],
  ["监管覆盖映射", "把主要监管制度映射到已提交的 atomic-risk 框架。"],
  ["盲点识别", "研究风险维度与生命周期位置上的监管覆盖缺口。"],
  ["监管优化建议", "为完善监管框架提出有针对性的建议。"],
];
export const FUTURE = pack.future.map((r, i) => ({
  ...r,
  title: [r.topic, futureZh[i][0]] as FrameworkCopy,
  description: [r.description, futureZh[i][1]] as FrameworkCopy,
}));
export const CURRENT: FrameworkCopy[] = [
  [
    "55 atomic risks in the submitted framework",
    "已提交框架中的 55 个 atomic risks",
  ],
  ["Risk decomposition methodology", "风险拆解方法"],
  ["T0–T3 lifecycle mapping", "T0–T3 生命周期映射"],
  ["L0–L3 amplification & transmission mapping", "L0–L3 放大与传导映射"],
];
export const DISTINCTIONS: {
  id: string;
  left: FrameworkCopy;
  right: FrameworkCopy;
}[] = [
  {
    id: "L0 ≠ L1",
    left: ["Trigger event", "触发事件"],
    right: ["Pre-existing susceptibility", "预先存在的易受冲击性"],
  },
  {
    id: "L1 ≠ L2",
    left: ["Structural condition", "结构条件"],
    right: ["Activated amplification process", "被激活的放大过程"],
  },
  {
    id: "T0 ≠ L1",
    left: ["Lifecycle location", "生命周期位置"],
    right: ["Causal role", "因果角色"],
  },
  {
    id: "T3 ≠ L3",
    left: [
      "Redemption / deleveraging / liquidation / exit stage",
      "赎回 / 去杠杆 / 清算 / 退出阶段",
    ],
    right: ["Cross-system propagation", "跨系统传导"],
  },
];
