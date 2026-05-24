import type {
  CrisisTag,
  Effect,
  GameState,
  SituationDynamicsResult,
  SituationPhaseState,
  SituationPressure,
} from "./gameTypes";
import { applyPressureEffect } from "./utils";

function phaseDrift(phase: SituationPhaseState, game: GameState): { effect: Effect; pressure: Partial<SituationPressure>; report: string } {
  switch (phase) {
    case "latent":
      return {
        effect: { escalationRisk: 1, fuelReserveDays: -0.5, shippingInsuranceIndex: 1 },
        pressure: { timePressure: 3, militaryPressure: 2 },
        report: "表面上は小康状態だが、時間圧力と軍事圧力が静かに蓄積している。",
      };
    case "active":
      return {
        effect: {
          escalationRisk: 3,
          ammoStockDays: game.metrics.ownDeployedShips >= 1 ? -1 : 0,
          maintenanceRate: game.metrics.ownDeployedShips >= 1 ? -1 : 0,
          fuelReserveDays: -1,
          anxiety: 1,
          shippingInsuranceIndex: 2,
          peaceWindow: -1,
        },
        pressure: { timePressure: 5, militaryPressure: 3, economicPressure: 3 },
        report: "状況は流動的であり、前線・市場・世論が同時に反応している。",
      };
    case "critical":
      return {
        effect: { escalationRisk: 1, anxiety: 3 },
        pressure: { timePressure: 8, militaryPressure: 5, informationPressure: 4 },
        report: "小さな誤算が大きな影響をもたらしかねない臨界的な状態である。",
      };
    case "crystallizing":
      return {
        effect: { escalationRisk: -1, localControl: -3, peaceWindow: -4, opponentDeployedShips: 1 },
        pressure: { timePressure: 6, politicalPressure: 2 },
        report: "現地では既成事実化が進み、外交的反転の余地が狭まりつつある。",
      };
    case "dissolving":
      return {
        effect: { escalationRisk: -3, peaceWindow: 3, anxiety: -2 },
        pressure: { militaryPressure: -4, economicPressure: -2, timePressure: -2 },
        report: "事態は収束方向に向かっているが、不安定要素は残存している。",
      };
  }
}

function nextPhase(game: GameState, pressure: SituationPressure): { phase: SituationPhaseState; occurred: boolean; trigger?: string } {
  const m = game.metrics;
  const current = game.situationPhase;

  if (current === "latent" && (pressure.militaryPressure >= 35 || m.escalationRisk >= 55 || game.day >= 4)) {
    return { phase: "active", occurred: true, trigger: "軍事圧力と時間圧力の蓄積" };
  }

  if (
    current === "active" &&
    (pressure.militaryPressure >= 68 || pressure.informationPressure >= 72 || m.escalationRisk >= 78)
  ) {
    return { phase: "critical", occurred: true, trigger: "軍事・情報圧力の臨界化" };
  }

  if (current === "active" && m.localControl < 45 && m.peaceWindow < 40) {
    return { phase: "crystallizing", occurred: true, trigger: "現地制御度の低下と講和余地の縮小" };
  }

  if ((current === "active" || current === "critical") && m.peaceWindow >= 60 && m.escalationRisk < 50) {
    return { phase: "dissolving", occurred: true, trigger: "講和余地の拡大と戦争拡大リスクの低下" };
  }

  if (current === "dissolving" && m.peaceWindow >= 68 && m.escalationRisk < 35) {
    return { phase: "latent", occurred: true, trigger: "危機圧力の沈静化" };
  }

  return { phase: current, occurred: false };
}

function updateTags(game: GameState, pressure: SituationPressure): { add: CrisisTag[]; remove: CrisisTag[] } {
  const add: CrisisTag[] = [];
  const remove: CrisisTag[] = [];
  const tags = new Set(game.hidden.tags);

  if (game.opponent.frontlineControl < 40 && !tags.has("frontline_drift")) add.push("frontline_drift");
  if ((game.metrics.ammoStockDays < 10 || game.metrics.fuelReserveDays < 25) && !tags.has("logistics_strain")) add.push("logistics_strain");
  if (game.metrics.governmentTrust < 40 && game.metrics.anxiety > 65 && !tags.has("media_volatility")) add.push("media_volatility");
  if (game.metrics.peaceWindow >= 55 && game.day >= 5 && !tags.has("ceasefire_channel")) add.push("ceasefire_channel");

  if (game.metrics.allyCredit >= 65 && tags.has("ally_hesitation")) remove.push("ally_hesitation");
  if (game.metrics.stockChangePct >= 0 && game.metrics.bondYield10y < 1.3 && tags.has("market_fragility")) remove.push("market_fragility");
  if (game.metrics.governmentTrust >= 65 && tags.has("information_warfare")) remove.push("information_warfare");
  if (game.metrics.escalationRisk < 30 && pressure.militaryPressure < 40 && tags.has("frontline_drift")) remove.push("frontline_drift");

  return { add, remove };
}

export function situationDrift(game: GameState): SituationDynamicsResult {
  const drift = phaseDrift(game.situationPhase, game);
  const pressureAfterDrift = applyPressureEffect(game.situationPressure, drift.pressure);

  const acceleratedPressure = applyPressureEffect(pressureAfterDrift, {
    militaryPressure: pressureAfterDrift.militaryPressure >= 70 ? 3 : 0,
    timePressure: pressureAfterDrift.economicPressure >= 70 ? 3 : 0,
    politicalPressure: pressureAfterDrift.informationPressure >= 70 ? 2 : 0,
  });

  const transition = nextPhase(game, acceleratedPressure);
  const tagChanges = updateTags(game, acceleratedPressure);

  return {
    effect: drift.effect,
    opponentEffect: {},
    tagChanges,
    pressureChanges: {
      militaryPressure: acceleratedPressure.militaryPressure - game.situationPressure.militaryPressure,
      economicPressure: acceleratedPressure.economicPressure - game.situationPressure.economicPressure,
      politicalPressure: acceleratedPressure.politicalPressure - game.situationPressure.politicalPressure,
      informationPressure: acceleratedPressure.informationPressure - game.situationPressure.informationPressure,
      timePressure: acceleratedPressure.timePressure - game.situationPressure.timePressure,
    },
    nextPhaseState: transition.phase,
    transitionOccurred: transition.occurred,
    transitionTrigger: transition.trigger,
    report: transition.occurred
      ? `${drift.report} 事態評価は「${game.situationPhase}」から「${transition.phase}」へ移行した。`
      : drift.report,
  };
}
