import type {
  AllyAssessment,
  AllyEngagementStage,
  AllyObservation,
  Effect,
  GameState,
  NpcSituationAssessment,
  OpponentAction,
  OpponentObservation,
  PolicyClause,
  SituationPressure,
} from "./gameTypes";
import { clamp } from "./utils";
import { calculateWorldState } from "./worldEngine";

type NpcTurnResult = {
  effect: Effect;
  pressureEffect: Partial<SituationPressure>;
  opponentAction: OpponentAction;
  opponentObservation: OpponentObservation;
  opponentAssessment: NpcSituationAssessment;
  opponentMessage: string;
  opponentDelta: {
    domesticPressure: number;
    frontlineControl: number;
    escalationWill: number;
    selectedPolicyIds: string[];
  };
  allyObservation: AllyObservation;
  allyAssessment: AllyAssessment;
  allyEngagementStage: AllyEngagementStage;
  allyMessage: string;
  allyEffect: Effect;
  allyPressureEffect: Partial<SituationPressure>;
};

function resolveSignalScore(selectedPolicies: PolicyClause[]): number {
  return selectedPolicies.reduce((sum, p) => sum + p.resolveSignal, 0);
}

function buildOpponentObservation(game: GameState, selectedPolicies: PolicyClause[]): OpponentObservation {
  const world = game.worldState;
  const signal = resolveSignalScore(selectedPolicies);

  const currentResolveObservation = clamp(
    50 + signal * 12 + game.metrics.cabinetApproval * 0.5 - game.metrics.anxiety * 0.3,
    0,
    100,
  );

  const perceivedJapanResolve = clamp(
    game.opponentAssessment.japanResolveEstimate * 0.7 + currentResolveObservation * 0.3,
    0,
    100,
  );

  return {
    perceivedMilitaryBalance: clamp(world.militaryBalance + 4, -100, 100),
    perceivedJapanResolve,
    perceivedAllyCommitment: clamp(game.metrics.allySupportShips * 10 + game.metrics.allyCredit * 0.45 + game.allyEngagementStage * 5, 0, 100),
    perceivedDiplomaticOpening: world.diplomaticOpening,
  };
}

function buildOpponentAssessment(game: GameState, observation: OpponentObservation): NpcSituationAssessment {
  const localControlWeakness = clamp(100 - game.metrics.localControl, 0, 100);
  const phaseBias =
    game.situationPhase === "critical"
      ? 18
      : game.situationPhase === "crystallizing"
        ? 14
        : game.situationPhase === "dissolving"
          ? -12
          : 0;

  const opportunityScore = clamp(
    localControlWeakness * 0.36 +
      (100 - observation.perceivedAllyCommitment) * 0.22 +
      game.situationPressure.timePressure * 0.18 +
      phaseBias +
      (game.opponent.strategy === "expand_control" ? 12 : 0),
    0,
    100,
  );

  const riskScore = clamp(
    game.metrics.escalationRisk * 0.32 +
      observation.perceivedJapanResolve * 0.28 +
      observation.perceivedAllyCommitment * 0.25 +
      (game.opponent.strategy === "freeze_status_quo" ? 10 : 0),
    0,
    100,
  );

  return {
    opportunityScore,
    riskScore,
    japanResolveEstimate: observation.perceivedJapanResolve,
    allyInterventionRisk: clamp(observation.perceivedAllyCommitment + game.metrics.allySupportShips * 4, 0, 100),
    domesticConstraint: clamp(game.opponent.domesticPressure * 0.7 + (100 - game.opponent.frontlineControl) * 0.3, 0, 100),
    timeUrgency: clamp(game.situationPressure.timePressure * 0.55 + game.day * 2 + (100 - game.metrics.peaceWindow) * 0.22, 0, 100),
  };
}

function chooseOpponentAction(game: GameState, assessment: NpcSituationAssessment, observation: OpponentObservation): OpponentAction {
  if (assessment.domesticConstraint > 75 && game.opponent.frontlineControl < 45) return "frontline_escalate";
  if (game.worldState.diplomaticOpening > 55 && assessment.riskScore > 60) return "backchannel";
  if (assessment.riskScore > 70 && assessment.allyInterventionRisk > 70) return "retreat";
  if (assessment.opportunityScore > assessment.riskScore + assessment.allyInterventionRisk * 0.25 && assessment.timeUrgency > 50) return "advance";
  if (observation.perceivedJapanResolve < 40 && assessment.allyInterventionRisk < 40) return "public_statement";
  if (assessment.riskScore > assessment.opportunityScore && assessment.japanResolveEstimate > 65) return "hold";
  return "probe";
}

function opponentActionEffect(action: OpponentAction): {
  effect: Effect;
  pressureEffect: Partial<SituationPressure>;
  message: string;
  selectedPolicyIds: string[];
} {
  switch (action) {
    case "advance":
      return {
        effect: { localControl: -4, escalationRisk: 5, opponentDeployedShips: 1 },
        pressureEffect: { militaryPressure: 4, timePressure: 2 },
        message: "相手国前線は警戒線の外縁で活動を拡大している。中央政府の説明との距離が生じている可能性がある。",
        selectedPolicyIds: ["opponent_advance"],
      };
    case "frontline_escalate":
      return {
        effect: { localControl: -5, escalationRisk: 8, anxiety: 3 },
        pressureEffect: { militaryPressure: 6, informationPressure: 3 },
        message: "相手国前線部隊に中央の統制から逸脱した動きがある。現地指揮系統の緊張が高い。",
        selectedPolicyIds: ["opponent_frontline_escalate"],
      };
    case "backchannel":
      return {
        effect: { peaceWindow: 5, escalationRisk: -2, politicalCapital: 1 },
        pressureEffect: { militaryPressure: -2, timePressure: -3 },
        message: "相手国側から非公式接触を示唆する断片情報が入っている。確度は中。",
        selectedPolicyIds: ["opponent_backchannel"],
      };
    case "public_statement":
      return {
        effect: { governmentTrust: -2, angerAtOpponent: 4, politicalCapital: -1 },
        pressureEffect: { informationPressure: 4, politicalPressure: 3 },
        message: "相手国は公的声明で我が国の対応を批判した。情報空間での主導権争いが強まっている。",
        selectedPolicyIds: ["opponent_public_statement"],
      };
    case "retreat":
      return {
        effect: { localControl: 4, escalationRisk: -5, politicalCapital: 2 },
        pressureEffect: { militaryPressure: -6, timePressure: -4 },
        message: "相手国の一部部隊に後退の兆候がある。ただし意図的な再配置の可能性も残る。",
        selectedPolicyIds: ["opponent_retreat"],
      };
    case "hold":
      return {
        effect: { escalationRisk: -1 },
        pressureEffect: { timePressure: 1 },
        message: "相手国は現状維持を図っている。急激な軍事行動は確認されていない。",
        selectedPolicyIds: ["opponent_hold"],
      };
    case "probe":
    default:
      return {
        effect: { escalationRisk: 2 },
        pressureEffect: { militaryPressure: 2, informationPressure: 2 },
        message: "相手国は我が国の反応を試すような小規模行動を継続している。",
        selectedPolicyIds: ["opponent_probe"],
      };
  }
}

function buildAllyObservation(game: GameState): AllyObservation {
  return {
    perceivedThreatLevel: clamp(game.worldState.escalationMomentum * 0.5 + game.worldState.frontlineTension * 0.35, 0, 100),
    perceivedJapanDetermination: clamp(game.opponentAssessment.japanResolveEstimate * 0.45 + game.metrics.allyCredit * 0.4, 0, 100),
    perceivedEscalationRisk: game.worldState.escalationMomentum,
    perceivedOpponentIntention: clamp(game.opponentAssessment.opportunityScore * 0.55 + game.opponentAssessment.timeUrgency * 0.2, 0, 100),
  };
}

function buildAllyAssessment(game: GameState, observation: AllyObservation): AllyAssessment {
  const ally = game.allies[0];

  const engagementScore = clamp(
    observation.perceivedThreatLevel * 0.32 +
      game.worldState.allianceSolidity * 0.25 +
      observation.perceivedJapanDetermination * 0.25 +
      game.metrics.governmentTrust * 0.15,
    0,
    100,
  );

  const domesticFeasibility = clamp((100 - ally.parliamentConstraint) * (1 - ally.economicExposure / 100), 0, 100);

  const japanTrustScore = clamp(game.allyAssessment.japanTrustScore * 0.7 + (game.metrics.allyCredit + game.metrics.bureaucraticGrip * 0.25) * 0.3, 0, 100);

  return {
    engagementScore,
    domesticFeasibility,
    japanTrustScore,
    escalationConcern: clamp(observation.perceivedEscalationRisk * 0.5 + ally.economicExposure * 0.2 + game.worldState.urgency * 0.25, 0, 100),
    economicCostEstimate: clamp(ally.economicExposure * 0.55 + game.metrics.dailyWarCost * 0.12 + game.allyEngagementStage * 8, 0, 100),
  };
}

function nextAllyStage(game: GameState, assessment: AllyAssessment): AllyEngagementStage {
  const ally = game.allies[0];
  const score = assessment.engagementScore * assessment.domesticFeasibility;
  const threshold = ally.posture === "committed" ? 2500 : ally.posture === "opportunist" ? 4000 : 5000;

  if (assessment.japanTrustScore < 40 && ally.posture === "opportunist") return 6;
  if (score > threshold && assessment.escalationConcern < 70) return Math.min(5, game.allyEngagementStage + 1) as AllyEngagementStage;
  if (assessment.economicCostEstimate > 75 && game.allyEngagementStage > 1) return Math.max(1, game.allyEngagementStage - 1) as AllyEngagementStage;
  return game.allyEngagementStage;
}

function allyStageEffect(previous: AllyEngagementStage, next: AllyEngagementStage): {
  effect: Effect;
  pressureEffect: Partial<SituationPressure>;
  message: string;
} {
  if (next === previous) {
    return {
      effect: {},
      pressureEffect: {},
      message: "同盟国は現段階で追加関与を見送っている。議会・世論の制約が残る。",
    };
  }

  if (next > previous) {
    if (next >= 4) {
      return {
        effect: { allySupportShips: 1, allyCredit: 3, localControl: 3 },
        pressureEffect: { militaryPressure: -4, politicalPressure: -2 },
        message: "同盟国は展開・プレゼンス強化へ一段踏み込んだ。抑止効果はあるが、相手国の警戒も高まる。",
      };
    }
    if (next === 3) {
      return {
        effect: { ammoStockDays: 3, fuelReserveDays: 2, allyCredit: 2 },
        pressureEffect: { militaryPressure: -2, economicPressure: -1 },
        message: "同盟国は後方支援・補給協力を開始した。兵站面の負担が一部緩和される。",
      };
    }
    return {
      effect: { allyCredit: 2, governmentTrust: 1 },
      pressureEffect: { politicalPressure: -2, informationPressure: -1 },
      message: "同盟国は共同声明・外交的支持に前向きな姿勢を示した。",
    };
  }

  return {
    effect: { allyCredit: -4, politicalCapital: -1 },
    pressureEffect: { politicalPressure: 3, informationPressure: 2 },
    message: "同盟国内で慎重論が強まり、関与段階が後退した。政府内では説明責任が重くなる。",
  };
}

export function runNpcTurn(game: GameState, selectedPolicies: PolicyClause[]): NpcTurnResult {
  const worldState = calculateWorldState(game);
  const withWorld = { ...game, worldState };

  const opponentObservation = buildOpponentObservation(withWorld, selectedPolicies);
  const opponentAssessment = buildOpponentAssessment(withWorld, opponentObservation);
  const opponentAction = chooseOpponentAction(withWorld, opponentAssessment, opponentObservation);
  const opponent = opponentActionEffect(opponentAction);

  const opponentDelta = {
    domesticPressure: opponentAction === "public_statement" ? 5 : opponentAction === "backchannel" ? -3 : 2,
    frontlineControl: opponentAction === "frontline_escalate" ? -6 : opponentAction === "backchannel" ? 2 : opponentAction === "advance" ? -3 : 0,
    escalationWill: opponentAction === "advance" || opponentAction === "frontline_escalate" ? 4 : opponentAction === "retreat" ? -6 : 0,
    selectedPolicyIds: opponent.selectedPolicyIds,
  };

  const allyObservation = buildAllyObservation({ ...withWorld, opponentObservation, opponentAssessment });
  const allyAssessment = buildAllyAssessment(withWorld, allyObservation);
  const allyEngagementStage = nextAllyStage(withWorld, allyAssessment);
  const ally = allyStageEffect(withWorld.allyEngagementStage, allyEngagementStage);

  return {
    effect: opponent.effect,
    pressureEffect: opponent.pressureEffect,
    opponentAction,
    opponentObservation,
    opponentAssessment,
    opponentMessage: opponent.message,
    opponentDelta,
    allyObservation,
    allyAssessment,
    allyEngagementStage,
    allyMessage: ally.message,
    allyEffect: ally.effect,
    allyPressureEffect: ally.pressureEffect,
  };
}
