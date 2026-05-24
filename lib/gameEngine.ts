import type { CrisisTag, Effect, GameState, RoutineStep } from "./gameTypes";
import {
  applyEffect,
  applyPressureEffect,
  calculateCriticalityScore,
  clamp,
  combineEffects,
  combinePressureEffects,
  sumFiscalCost,
  sumPoliticalCost,
} from "./utils";
import { policyClauses } from "../data/policyClauses";
import { pressClauses } from "../data/pressClauses";
import { situationDrift } from "./situationEngine";
import { calculateWorldState, worldSummary } from "./worldEngine";
import { runNpcTurn } from "./npcEngine";

export function goToStep(game: GameState, step: RoutineStep): GameState {
  return { ...game, step };
}

export function selectObjective(game: GameState, objective: GameState["objective"]): GameState {
  return { ...game, objective, step: "pm" };
}

export function togglePolicy(game: GameState, policyId: string): GameState {
  const exists = game.selectedPolicyIds.includes(policyId);
  const selectedPolicyIds = exists ? game.selectedPolicyIds.filter((id) => id !== policyId) : [...game.selectedPolicyIds, policyId];
  return { ...game, selectedPolicyIds };
}

export function togglePress(game: GameState, pressId: string): GameState {
  const exists = game.selectedPressIds.includes(pressId);
  const selectedPressIds = exists ? game.selectedPressIds.filter((id) => id !== pressId) : [...game.selectedPressIds, pressId];
  return { ...game, selectedPressIds };
}

function politicalCapitalRecovery(game: GameState): number {
  const difficultyBase = game.difficulty === "easy" ? 4 : game.difficulty === "hard" ? 2 : 3;
  const phaseModifier = game.phase === "stalemate" ? -1 : game.phase === "turning" ? 1 : 0;
  const situationModifier =
    game.situationPhase === "latent"
      ? 1
      : game.situationPhase === "critical"
        ? -2
        : game.situationPhase === "crystallizing"
          ? -1
          : game.situationPhase === "dissolving"
            ? 1
            : 0;
  return difficultyBase + phaseModifier + situationModifier;
}

function politicalCapitalCap(game: GameState): number {
  const base = game.difficulty === "easy" ? 15 : game.difficulty === "hard" ? 7 : 10;
  return game.metrics.pmTrust < 40 ? Math.max(3, base - 2) : base;
}

function objectiveFitEffect(game: GameState, policyEffect: Effect): Effect {
  if (!game.objective) return {};
  if (game.objective === "prevent_fait_accompli") {
    if ((policyEffect.localControl ?? 0) > 0) return { pmTrust: 2 };
    if ((policyEffect.localControl ?? 0) < -3) return { pmTrust: -2 };
  }
  if (game.objective === "ceasefire_priority") {
    if ((policyEffect.peaceWindow ?? 0) > 0) return { pmTrust: 2 };
    if ((policyEffect.escalationRisk ?? 0) > 6) return { pmTrust: -3 };
  }
  if (game.objective === "domestic_stability") {
    if ((policyEffect.economicConcern ?? 0) < 0 || (policyEffect.anxiety ?? 0) < 0) return { pmTrust: 2 };
    if ((policyEffect.dailyWarCost ?? 0) > 50) return { pmTrust: -2 };
  }
  if (game.objective === "deterrent_settlement") {
    if ((policyEffect.escalationRisk ?? 0) < 0 && (policyEffect.localControl ?? 0) >= 0) return { pmTrust: 2 };
  }
  if (game.objective === "punitive_victory") {
    if ((policyEffect.localControl ?? 0) > 6) return { cabinetApproval: 2 };
    if ((policyEffect.peaceWindow ?? 0) > 6 && (policyEffect.localControl ?? 0) <= 0) return { hawkishness: 4 };
  }
  return {};
}

function updateHiddenTags(game: GameState, add: CrisisTag[], remove: CrisisTag[]) {
  const tags = new Set(game.hidden.tags);
  remove.forEach((tag) => tags.delete(tag));
  add.forEach((tag) => tags.add(tag));
  return { ...game.hidden, tags: Array.from(tags) };
}

function endingIdIfAny(game: GameState): string | null {
  if (game.metrics.pmTrust <= 0) return "cabinet_collapse";
  if (game.metrics.politicalCapital <= 0 && game.metrics.pmTrust < 40) return "cabinet_collapse";
  if (game.day >= 20) return "provisional_success";
  return null;
}

function clampNpcState(value: number): number {
  return clamp(Math.round(value), 0, 100);
}

export function resolveDay(game: GameState): GameState {
  const selectedPolicies = policyClauses.filter((clause) => game.selectedPolicyIds.includes(clause.id));
  const selectedPress = pressClauses.filter((clause) => game.selectedPressIds.includes(clause.id));

  const policyEffect = combineEffects(selectedPolicies.map((p) => p.effect));
  const pressEffect = combineEffects(selectedPress.map((p) => p.effect));
  const pressureEffect = combinePressureEffects(selectedPolicies.map((p) => p.pressureEffect ?? {}));
  const fiscalCost = sumFiscalCost(selectedPolicies);
  const politicalCost = sumPoliticalCost(selectedPolicies) + sumPoliticalCost(selectedPress);

  const drift = situationDrift(game);

  const baseEffects = combineEffects([
    policyEffect,
    pressEffect,
    drift.effect,
    objectiveFitEffect(game, policyEffect),
    {
      politicalCapital: -politicalCost + politicalCapitalRecovery(game),
      emergencyBudget: -fiscalCost,
      cumulativeWarCost: fiscalCost,
    },
  ]);

  let nextMetrics = applyEffect(game.metrics, baseEffects);
  const cap = politicalCapitalCap({ ...game, metrics: nextMetrics });
  if (nextMetrics.politicalCapital > cap) nextMetrics = { ...nextMetrics, politicalCapital: cap };

  let nextPressure = applyPressureEffect(applyPressureEffect(game.situationPressure, pressureEffect), drift.pressureChanges);
  const nextPhase = drift.nextPhaseState;
  let nextHidden = updateHiddenTags(game, drift.tagChanges.add, drift.tagChanges.remove);

  const preliminaryCriticality = calculateCriticalityScore(nextMetrics, nextPressure);
  const preliminaryState: GameState = {
    ...game,
    metrics: nextMetrics,
    situationPressure: nextPressure,
    situationPhase: nextPhase,
    hidden: nextHidden,
    criticalityScore: preliminaryCriticality,
  };
  const preliminaryWorld = calculateWorldState(preliminaryState);
  const npc = runNpcTurn({ ...preliminaryState, worldState: preliminaryWorld }, selectedPolicies);

  nextMetrics = applyEffect(nextMetrics, combineEffects([npc.effect, npc.allyEffect]));
  nextPressure = applyPressureEffect(applyPressureEffect(nextPressure, npc.pressureEffect), npc.allyPressureEffect);
  const nextCriticality = calculateCriticalityScore(nextMetrics, nextPressure);

  const nextOpponent = {
    ...game.opponent,
    domesticPressure: clampNpcState(game.opponent.domesticPressure + npc.opponentDelta.domesticPressure),
    frontlineControl: clampNpcState(game.opponent.frontlineControl + npc.opponentDelta.frontlineControl),
    escalationWill: clampNpcState(game.opponent.escalationWill + npc.opponentDelta.escalationWill),
    selectedPolicyIds: npc.opponentDelta.selectedPolicyIds,
  };

  const nextAllies = game.allies.map((ally, index) => {
    if (index !== 0) return ally;
    return {
      ...ally,
      selectedPolicyIds: npc.allyEngagementStage > game.allyEngagementStage ? [`ally_stage_${npc.allyEngagementStage}`] : [],
      parliamentConstraint: clampNpcState(
        ally.parliamentConstraint +
          (selectedPolicies.filter((p) => p.category === "軍事").length >= 1 ? 2 : 0) -
          (npc.allyEngagementStage > game.allyEngagementStage ? 2 : 0),
      ),
    };
  });

  const finalWorld = calculateWorldState({
    ...preliminaryState,
    metrics: nextMetrics,
    situationPressure: nextPressure,
    situationPhase: nextPhase,
    opponent: nextOpponent,
    allies: nextAllies,
    allyEngagementStage: npc.allyEngagementStage,
    criticalityScore: nextCriticality,
  });

  nextHidden = {
    ...nextHidden,
    opponentMessage: npc.opponentMessage,
    allyMessage: npc.allyMessage,
  };

  const nextLogs = [
    ...game.logs,
    {
      day: game.day,
      objective: game.objective ?? "未設定",
      submission: selectedPolicies.map((p) => p.phrase).join("。") || "上申なし",
      cabinet: "閣議は省益上の留保を残しつつ、官房長官案を了承した。",
      press: selectedPress.map((p) => p.phrase).join("。") || "会見での追加説明なし",
      reaction: `${drift.report} ${worldSummary(finalWorld)} ${npc.opponentMessage} ${npc.allyMessage}`,
      event: drift.transitionOccurred ? `事態相転移：${drift.transitionTrigger}` : undefined,
      phase: game.phase,
      situationPhaseAtDay: nextPhase,
      situationPressureAtDay: nextPressure,
      phaseTransitionOccurred: drift.transitionOccurred,
      phaseTransitionDetail: drift.transitionTrigger,
      defenseInstituteNote: "プレイヤーの上申、会見、事態固有の自律運動、相手国・同盟国NPCの判断が合成され、翌日の政治・軍事環境を形成した。",
      causalLinks: [
        `政策句 ${selectedPolicies.length}件、会見句 ${selectedPress.length}件を処理。`,
        `政治資本 ${-politicalCost}+回復、緊急予算 -${fiscalCost}億円。`,
        `相手国NPC行動：${npc.opponentAction}`,
        `同盟国関与段階：${game.allyEngagementStage} → ${npc.allyEngagementStage}`,
        drift.report,
      ],
      hiddenStateAtDay: {
        opponent: {
          strategy: nextOpponent.strategy,
          frontlineControl: nextOpponent.frontlineControl,
          escalationWill: nextOpponent.escalationWill,
        },
        situationPhase: nextPhase,
        pressure: nextPressure,
      },
    },
  ];

  const withNext: GameState = {
    ...game,
    day: game.day + 1,
    step: "pm",
    metrics: nextMetrics,
    logs: nextLogs,
    selectedPolicyIds: [],
    selectedPressIds: [],
    lastPolicyIds: game.selectedPolicyIds,
    lastPressIds: game.selectedPressIds,
    meetingUsed: false,
    situationPhase: nextPhase,
    situationPressure: nextPressure,
    situationHistory: {
      phaseTransitions: drift.transitionOccurred
        ? [
            ...game.situationHistory.phaseTransitions,
            { from: game.situationPhase, to: nextPhase, day: game.day, trigger: drift.transitionTrigger ?? "事態構造の変化" },
          ]
        : game.situationHistory.phaseTransitions,
      pressureHistory: [...game.situationHistory.pressureHistory, { day: game.day + 1, pressure: nextPressure }],
    },
    hidden: nextHidden,
    worldState: finalWorld,
    opponent: nextOpponent,
    opponentObservation: npc.opponentObservation,
    opponentAssessment: npc.opponentAssessment,
    allies: nextAllies,
    allyObservation: npc.allyObservation,
    allyAssessment: npc.allyAssessment,
    allyEngagementStage: npc.allyEngagementStage,
    criticalityScore: nextCriticality,
  };

  const endingId = endingIdIfAny(withNext);
  if (endingId) return { ...withNext, ended: true, endingId, step: "end" };
  return withNext;
}
