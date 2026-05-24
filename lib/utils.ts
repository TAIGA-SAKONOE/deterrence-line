import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Effect, MetricKey, Metrics, PreviewDelta, SituationPressure } from "./gameTypes";

export const metricLabels: Record<MetricKey, string> = {
  cabinetApproval: "内閣支持",
  anxiety: "国民不安",
  hawkishness: "強硬世論",
  pacifism: "慎重世論",
  governmentTrust: "政府信頼",
  economicConcern: "経済懸念",
  angerAtOpponent: "相手国反感",
  fatigue: "疲労",
  stockIndex: "株価指数",
  stockChangePct: "株価前日比",
  bondYield10y: "10年国債金利",
  exchangeRateUsd: "為替 USD/JPY",
  fuelReserveDays: "燃料備蓄日数",
  foodReserveDays: "食料備蓄日数",
  shippingDelayPct: "物流遅延率",
  shippingInsuranceIndex: "海上保険指数",
  importCostIndex: "輸入コスト指数",
  emergencyBudget: "緊急予算",
  dailyWarCost: "日次戦費",
  cumulativeWarCost: "累積戦費",
  ownReadyShips: "即応艦艇",
  ownDeployedShips: "展開艦艇",
  ammoStockDays: "弾薬在庫日数",
  maintenanceRate: "整備率",
  opponentDeployedShips: "相手国展開艦艇",
  allySupportShips: "同盟国支援艦艇",
  localControl: "現地制御度",
  escalationRisk: "戦争拡大リスク",
  peaceWindow: "停戦余地",
  politicalCapital: "政治資本",
  pmTrust: "首相信任",
  bureaucraticGrip: "省庁統制",
  allyCredit: "同盟信頼",
};

export const pressureLabels: Record<keyof SituationPressure, string> = {
  militaryPressure: "軍事圧力",
  economicPressure: "経済圧力",
  politicalPressure: "政治圧力",
  informationPressure: "情報圧力",
  timePressure: "時間圧力",
};

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function clampMetric(key: MetricKey, value: number): number {
  if (key === "stockChangePct") return clamp(Number(value.toFixed(1)), -15, 15);
  if (key === "bondYield10y") return clamp(Number(value.toFixed(2)), 0, 5);
  if (key === "exchangeRateUsd") return clamp(Number(value.toFixed(1)), 80, 250);
  if (key === "stockIndex") return clamp(Math.round(value), 0, 100000);
  if (key === "emergencyBudget" || key === "dailyWarCost" || key === "cumulativeWarCost") {
    return Math.max(0, Math.round(value));
  }
  return clamp(Math.round(value), 0, 100);
}

export function clampPressure(value: number): number {
  return clamp(Math.round(value), 0, 100);
}

export function applyEffect(metrics: Metrics, effect: Effect): Metrics {
  const next = { ...metrics };
  for (const [key, value] of Object.entries(effect) as [MetricKey, number][]) {
    next[key] = clampMetric(key, (next[key] ?? 0) + value);
  }
  return next;
}

export function applyPressureEffect(pressure: SituationPressure, effect: Partial<SituationPressure>): SituationPressure {
  return {
    militaryPressure: clampPressure(pressure.militaryPressure + (effect.militaryPressure ?? 0)),
    economicPressure: clampPressure(pressure.economicPressure + (effect.economicPressure ?? 0)),
    politicalPressure: clampPressure(pressure.politicalPressure + (effect.politicalPressure ?? 0)),
    informationPressure: clampPressure(pressure.informationPressure + (effect.informationPressure ?? 0)),
    timePressure: clampPressure(pressure.timePressure + (effect.timePressure ?? 0)),
  };
}

export function combineEffects(effects: Effect[]): Effect {
  const result: Effect = {};
  for (const effect of effects) {
    for (const [key, value] of Object.entries(effect) as [MetricKey, number][]) {
      result[key] = (result[key] ?? 0) + value;
    }
  }
  return result;
}

export function combinePressureEffects(effects: Partial<SituationPressure>[]): Partial<SituationPressure> {
  const result: Partial<SituationPressure> = {};
  for (const effect of effects) {
    for (const [key, value] of Object.entries(effect) as [keyof SituationPressure, number][]) {
      result[key] = (result[key] ?? 0) + value;
    }
  }
  return result;
}

export function emptyPreviewDelta(): PreviewDelta {
  return { effect: {}, pressureEffect: {} };
}

export function criticalityLabel(score: number): "平常" | "緊張" | "危機" {
  if (score >= 70) return "危機";
  if (score >= 40) return "緊張";
  return "平常";
}

export function calculateCriticalityScore(metrics: Metrics, pressure: SituationPressure): number {
  return clamp(
    metrics.escalationRisk * 0.3 +
      pressure.militaryPressure * 0.25 +
      (100 - metrics.peaceWindow) * 0.2 +
      pressure.timePressure * 0.15 +
      pressure.informationPressure * 0.1,
    0,
    100,
  );
}

export function sumFiscalCost(items: { fiscalCost?: number }[]): number {
  return items.reduce((sum, item) => sum + (item.fiscalCost ?? 0), 0);
}

export function sumPoliticalCost(items: { cost?: number }[]): number {
  return items.reduce((sum, item) => sum + (item.cost ?? 0), 0);
}


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
