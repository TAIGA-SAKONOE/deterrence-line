import type { MediatorState } from "../lib/gameTypes";

export const mediators: MediatorState[] = [
  {
    id: "neutral_state",
    name: "中立国代表",
    credibilityWithOpponent: 55,
    credibilityWithJapan: 60,
    ownInterest: "stability",
    available: true,
  },
];
