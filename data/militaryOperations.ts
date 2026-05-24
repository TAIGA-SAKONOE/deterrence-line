import type { MilitaryOperation } from "../lib/gameTypes";

export const militaryOperations: MilitaryOperation[] = [
  {
    id: "recover_warning_line",
    title: "警戒線回復作戦",
    description: "前線部隊への直接対応により、C地域周辺の警戒線を回復する。",
    stage: "deterrence",
    target: "frontline",
    militaryEffect: { localControl: 6, escalationRisk: 5, dailyWarCost: 120 },
    pressureEffect: { militaryPressure: 4, timePressure: 1 },
    politicalRisk: "限定行動であっても相手国の反応を招く可能性がある。",
    estimatedDuration: "1〜2ターン",
    exitCondition: "localControlが55以上に回復",
    fiscalCostPerTurn: 120,
  },
];
