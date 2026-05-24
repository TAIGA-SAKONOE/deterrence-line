import type { Effect, GameState, RoutineStep } from "./gameTypes";
import {
  applyEffect,
  applyPressureEffect,
  calculateCriticalityScore,
  combineEffects,
  combinePressureEffects,
  sumFiscalCost,
  sumPoliticalCost,
} from "./utils";
import { policyClauses } from "../data/policyClauses";
import { pressClauses } from "../data/pressClauses";
import { situationDrift } from "./situationEngine";

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
    game.situationPhase === "latent" ? 1 : game.situationPhase === "critical" ? -2 : game.situationPhase === "crystallizing" ? -1 : game.situationPhase === "dissolving" ? 1 : 0;
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

function updateHiddenTags(game: GameState, add: string[], remove: string[]) {
  const tags = new Set(game.hidden.tags);
  remove.forEach((tag) => tags.delete(tag as never));
  add.forEach((tag) => tags.add(tag as never));
  return { ...game.hidden, tags: Array.from(tags) as typeof game.hidden.tags };
}

function endingIdIfAny(game: GameState): string | null {
  if (game.metrics.pmTrust <= 0) return "cabinet_collapse";
  if (game.metrics.politicalCapital <= 0 && game.metrics.pmTrust < 40) return "cabinet_collapse";
  if (game.day >= 20) return "provisional_success";
  return null;
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

  const allEffects = combineEffects([
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

  let nextMetrics = applyEffect(game.metrics, allEffects);
  const cap = politicalCapitalCap({ ...game, metrics: nextMetrics });
  if (nextMetrics.politicalCapital > cap) {
    nextMetrics = { ...nextMetrics, politicalCapital: cap };
  }

  const pressureAfterPolicy = applyPressureEffect(game.situationPressure, pressureEffect);
  const nextPressure = applyPressureEffect(pressureAfterPolicy, drift.pressureChanges);

  const nextPhase = drift.nextPhaseState;
  const nextHidden = updateHiddenTags(game, drift.tagChanges.add, drift.tagChanges.remove);
  const nextCriticality = calculateCriticalityScore(nextMetrics, nextPressure);

  const nextLogs = [
    ...game.logs,
    {
      day: game.day,
      objective: game.objective ?? "未設定",
      submission: selectedPolicies.map((p) => p.phrase).join("。") || "上申なし",
      cabinet: "閣議は省益上の留保を残しつつ、官房長官案を了承した。",
      press: selectedPress.map((p) => p.phrase).join("。") || "会見での追加説明なし",
      reaction: drift.report,
      event: drift.transitionOccurred ? `事態相転移：${drift.transitionTrigger}` : undefined,
      phase: game.phase,
      situationPhaseAtDay: nextPhase,
      situationPressureAtDay: nextPressure,
      phaseTransitionOccurred: drift.transitionOccurred,
      phaseTransitionDetail: drift.transitionTrigger,
      defenseInstituteNote: "政策効果、会見効果、事態固有のドリフトが合成され、翌日の政治・軍事環境を形成した。",
      causalLinks: [
        `政策句 ${selectedPolicies.length}件、会見句 ${selectedPress.length}件を処理。`,
        `政治資本 ${-politicalCost}+回復、緊急予算 -${fiscalCost}億円。`,
        drift.report,
      ],
      hiddenStateAtDay: {
        opponent: { strategy: game.opponent.strategy, frontlineControl: game.opponent.frontlineControl },
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
    worldState: {
      ...game.worldState,
      frontlineTension: nextPressure.militaryPressure,
      escalationMomentum: nextMetrics.escalationRisk,
      diplomaticOpening: nextMetrics.peaceWindow,
      allianceSolidity: nextMetrics.allyCredit,
      situationPhase: nextPhase,
      situationPressure: nextPressure,
      urgency: nextCriticality,
    },
    criticalityScore: nextCriticality,
  };

  const endingId = endingIdIfAny(withNext);
  if (endingId) {
    return { ...withNext, ended: true, endingId, step: "end" };
  }
  return withNext;
}
