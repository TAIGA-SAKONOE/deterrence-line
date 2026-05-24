import type { GameDifficulty, GameState, Metrics, SituationPressure } from "../lib/gameTypes";
import { calculateCriticalityScore } from "../lib/utils";
import { mediators } from "./mediators";
import { meetingActors } from "./meetingActors";

const baseMetrics: Metrics = {
  cabinetApproval: 52,
  anxiety: 45,
  hawkishness: 42,
  pacifism: 44,
  governmentTrust: 55,
  economicConcern: 40,
  angerAtOpponent: 45,
  fatigue: 20,
  stockIndex: 38000,
  stockChangePct: -0.8,
  bondYield10y: 1.1,
  exchangeRateUsd: 155,
  fuelReserveDays: 35,
  foodReserveDays: 60,
  shippingDelayPct: 10,
  shippingInsuranceIndex: 100,
  importCostIndex: 100,
  emergencyBudget: 5000,
  dailyWarCost: 0,
  cumulativeWarCost: 0,
  ownReadyShips: 8,
  ownDeployedShips: 2,
  ammoStockDays: 18,
  maintenanceRate: 78,
  opponentDeployedShips: 4,
  allySupportShips: 0,
  localControl: 55,
  escalationRisk: 48,
  peaceWindow: 45,
  politicalCapital: 8,
  pmTrust: 60,
  bureaucraticGrip: 60,
  allyCredit: 55,
};

const difficultySettings = {
  easy: {
    politicalCapital: 12,
    situationPhase: "latent" as const,
    pressure: { militaryPressure: 20, economicPressure: 15, politicalPressure: 20, informationPressure: 25, timePressure: 0 },
    frontlineControl: 80,
    domesticPressure: 30,
    tags: ["coercive_probe", "market_fragility"] as const,
    opponentStrategy: "domestic_demonstration" as const,
  },
  normal: {
    politicalCapital: 8,
    situationPhase: "active" as const,
    pressure: { militaryPressure: 40, economicPressure: 35, politicalPressure: 35, informationPressure: 45, timePressure: 0 },
    frontlineControl: 65,
    domesticPressure: 45,
    tags: ["fait_accompli", "frontline_drift", "ally_hesitation", "market_fragility"] as const,
    opponentStrategy: "freeze_status_quo" as const,
  },
  hard: {
    politicalCapital: 5,
    situationPhase: "active" as const,
    pressure: { militaryPressure: 60, economicPressure: 50, politicalPressure: 50, informationPressure: 60, timePressure: 0 },
    frontlineControl: 50,
    domesticPressure: 60,
    tags: ["fait_accompli", "frontline_drift", "ally_hesitation", "market_fragility", "information_warfare", "media_volatility"] as const,
    opponentStrategy: "expand_control" as const,
  },
};

export function createInitialState(difficulty: GameDifficulty = "normal"): GameState {
  const setting = difficultySettings[difficulty];
  const metrics: Metrics = {
    ...baseMetrics,
    politicalCapital: setting.politicalCapital,
  };
  const pressure: SituationPressure = setting.pressure;

  return {
    day: 1,
    step: "briefing",
    objective: null,
    metrics,
    hidden: {
      tags: [...setting.tags],
      opponentMessage: "相手国は通常訓練との説明を維持している。",
      allyMessage: "同盟国は情報共有には応じているが、公的関与には慎重である。",
    },
    logs: [],
    ended: false,
    endingId: null,

    phase: "initial",
    phaseDay: 1,
    difficulty,

    worldState: {
      militaryBalance: 0,
      frontlineTension: pressure.militaryPressure,
      escalationMomentum: metrics.escalationRisk,
      diplomaticOpening: metrics.peaceWindow,
      allianceSolidity: metrics.allyCredit,
      internationalLegitimacy: metrics.governmentTrust,
      narrativeControl: 0,
      urgency: 45,
      situationPhase: setting.situationPhase,
      situationPressure: pressure,
    },

    situationPhase: setting.situationPhase,
    situationPressure: pressure,
    situationHistory: { phaseTransitions: [], pressureHistory: [{ day: 1, pressure }] },
    crystallizingStreak: 0,

    opponent: {
      strategy: setting.opponentStrategy,
      domesticPressure: setting.domesticPressure,
      frontlineControl: setting.frontlineControl,
      escalationWill: 45,
      selectedPolicyIds: [],
    },
    opponentObservation: {
      perceivedMilitaryBalance: 0,
      perceivedJapanResolve: 50,
      perceivedAllyCommitment: 35,
      perceivedDiplomaticOpening: metrics.peaceWindow,
    },
    opponentAssessment: {
      opportunityScore: 45,
      riskScore: 45,
      japanResolveEstimate: 50,
      allyInterventionRisk: 35,
      domesticConstraint: setting.domesticPressure,
      timeUrgency: 30,
    },

    allies: [{ id: "main_ally", name: "主要同盟国", posture: "cautious", governmentStance: 55, parliamentConstraint: 50, economicExposure: 55, selectedPolicyIds: [] }],
    allyObservation: {
      perceivedThreatLevel: 45,
      perceivedJapanDetermination: 50,
      perceivedEscalationRisk: metrics.escalationRisk,
      perceivedOpponentIntention: 45,
    },
    allyAssessment: {
      engagementScore: 40,
      domesticFeasibility: 45,
      japanTrustScore: 55,
      escalationConcern: 50,
      economicCostEstimate: 40,
    },
    allyEngagementStage: 1,

    diplomaticChannels: [{ actorPair: ["japan", "opponent"], status: "open", openedOnDay: 1, lastContactDay: 1, trustLevel: 45 }],
    pendingDiplomacy: [],
    diplomaticHistory: [],
    mediators,

    militaryPhase: { active: false, currentStage: null, pendingOperations: [], approvedOperations: [], ongoingOperations: [] },

    intel: [],
    mediaGovGap: 20,
    mediaGovGapHighStreak: 0,

    pendingEvents: [],
    resolvedEvents: [],

    objectiveChangeRequest: null,

    cabinetMode: "none",
    cabinetCompromises: [],

    selectedPressIds: [],
    pressQA: [],
    consistencyChecks: [],
    lastPressIds: [],

    meetingActors,
    meetingUsed: false,
    pendingObligations: [],
    expiredRequests: [],
    withdrawnRequests: [],

    selectedPolicyIds: [],
    lastPolicyIds: [],

    nscQuestionsLeft: 2,
    extraBriefings: [],

    localControlHighStreak: 0,

    pressFriction: 0,
    cabinetCohesion: 0,

    politicalLegacy: {
      hardlineActions: 0,
      diplomaticActions: 0,
      domesticStabilityActions: 0,
      allianceInvestments: 0,
      ethicalCompromises: 0,
    },

    factionState: {
      factions: [
        { id: "hawk", name: "強硬派", power: 45 },
        { id: "dove", name: "慎重派", power: 45 },
        { id: "fiscal", name: "財政派", power: 45 },
        { id: "diplomat", name: "外交派", power: 45 },
      ],
    },

    criticalityScore: calculateCriticalityScore(metrics, pressure),
  };
}
