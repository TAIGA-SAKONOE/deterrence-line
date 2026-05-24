import type { PressClause } from "../lib/gameTypes";

export const pressClauses: PressClause[] = [
  {
    id: "calm_briefing",
    label: "冷静な説明",
    phrase: "政府として事態を冷静に把握し、関係機関と緊密に連携して対応している。",
    cost: 1,
    effect: { governmentTrust: 2, anxiety: -2 },
    risk: "具体性を欠くと追及を受ける。",
  },
  {
    id: "limited_comment",
    label: "差し控え",
    phrase: "作戦上の理由から詳細は差し控えるが、必要な対応は取っている。",
    cost: 1,
    effect: { escalationRisk: -1 },
    risk: "報道との乖離が蓄積する。",
  },
];
