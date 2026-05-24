import type { CabinetMinister } from "../lib/gameTypes";

export const ministers: CabinetMinister[] = [
  { id: "defense", title: "防衛大臣", domain: ["軍事", "兵站"], priorityMetrics: ["ammoStockDays", "maintenanceRate"], objectionThreshold: 55 },
  { id: "foreign", title: "外務大臣", domain: ["外交", "同盟", "講和"], priorityMetrics: ["allyCredit", "peaceWindow"], objectionThreshold: 55 },
  { id: "finance", title: "財務大臣", domain: ["経済"], priorityMetrics: ["emergencyBudget", "bondYield10y"], objectionThreshold: 50 },
];
