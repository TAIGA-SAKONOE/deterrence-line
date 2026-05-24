import type { GameEvent } from "../lib/gameTypes";

export const gameEvents: GameEvent[] = [
  {
    id: "warning_shot",
    title: "相手国前線部隊が警告射撃",
    urgency: 85,
    significance: 82,
    govAwareness: 70,
    triggerConditions: [{ metric: "escalationRisk", operator: ">", threshold: 60, probabilityBonus: 25 }],
    baseProbability: 10,
    foreshadowing: ["前線部隊の通信量が増加している。"],
    effect: { politicalCapital: -1, pmTrust: -2, anxiety: 6, escalationRisk: 8 },
    logEntry: "相手国前線部隊による警告射撃が確認された。",
    resolved: false,
  },
];
