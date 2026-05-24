import type { StrategicObjective } from "../lib/gameTypes";

export const objectiveLabels: Record<StrategicObjective, string> = {
  deterrent_settlement: "抑止的収束",
  prevent_fait_accompli: "既成事実化阻止",
  ceasefire_priority: "早期停戦・講和",
  punitive_victory: "断固撃破・懲罰",
  domestic_stability: "国内安定優先",
};

export const objectiveDescriptions: Record<StrategicObjective, string> = {
  deterrent_settlement: "相手国に退路を残しつつ、現地の既成事実化は許さない。",
  prevent_fait_accompli: "現地支配を回復し、相手国の既成事実化を阻止する。",
  ceasefire_priority: "損害拡大を抑え、外交的収束を最優先する。",
  punitive_victory: "相手国の挑発に明確な代償を与え、抑止を再構築する。",
  domestic_stability: "市場・世論・国内政治の崩壊を防ぎ、国家運営を維持する。",
};
