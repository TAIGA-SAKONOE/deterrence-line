export type RoutineStep =
  | "briefing"
  | "objective"
  | "pm"
  | "nsc"
  | "work"
  | "cabinet"
  | "press"
  | "meetings"
  | "end";

export type GamePhase = "initial" | "stalemate" | "turning" | "resolution";
export type GameDifficulty = "easy" | "normal" | "hard";

export type StrategicObjective =
  | "deterrent_settlement"
  | "prevent_fait_accompli"
  | "ceasefire_priority"
  | "punitive_victory"
  | "domestic_stability";

export type CrisisTag =
  | "coercive_probe"
  | "fait_accompli"
  | "frontline_drift"
  | "opponent_domestic_heat"
  | "ally_hesitation"
  | "logistics_strain"
  | "market_fragility"
  | "information_warfare"
  | "media_volatility"
  | "ceasefire_channel";

export type PolicyCategory = "軍事" | "外交" | "同盟" | "情報" | "国内" | "経済" | "兵站" | "講和";

export type InfoSource =
  | "defense"
  | "foreign"
  | "finance"
  | "economy"
  | "intelligence"
  | "media"
  | "ally"
  | "meeting";

export type CabinetMode = "none" | "persuade" | "compromise" | "force";
export type PressResponseType = "answer" | "decline" | "deny" | "redirect";
export type OpponentStrategy = "expand_control" | "freeze_status_quo" | "domestic_demonstration" | "test_resolve";
export type AllyPosture = "committed" | "cautious" | "opportunist";

export type SituationPhaseState = "latent" | "active" | "critical" | "crystallizing" | "dissolving";

export type MetricKey =
  | "cabinetApproval"
  | "anxiety"
  | "hawkishness"
  | "pacifism"
  | "governmentTrust"
  | "economicConcern"
  | "angerAtOpponent"
  | "fatigue"
  | "stockIndex"
  | "stockChangePct"
  | "bondYield10y"
  | "exchangeRateUsd"
  | "fuelReserveDays"
  | "foodReserveDays"
  | "shippingDelayPct"
  | "shippingInsuranceIndex"
  | "importCostIndex"
  | "emergencyBudget"
  | "dailyWarCost"
  | "cumulativeWarCost"
  | "ownReadyShips"
  | "ownDeployedShips"
  | "ammoStockDays"
  | "maintenanceRate"
  | "opponentDeployedShips"
  | "allySupportShips"
  | "localControl"
  | "escalationRisk"
  | "peaceWindow"
  | "politicalCapital"
  | "pmTrust"
  | "bureaucraticGrip"
  | "allyCredit";

export type Metrics = Record<MetricKey, number>;
export type Effect = Partial<Record<MetricKey, number>>;

export type SituationPressure = {
  militaryPressure: number;
  economicPressure: number;
  politicalPressure: number;
  informationPressure: number;
  timePressure: number;
};

export type SituationHistory = {
  phaseTransitions: {
    from: SituationPhaseState;
    to: SituationPhaseState;
    day: number;
    trigger: string;
  }[];
  pressureHistory: {
    day: number;
    pressure: SituationPressure;
  }[];
};

export type OpponentState = {
  strategy: OpponentStrategy;
  domesticPressure: number;
  frontlineControl: number;
  escalationWill: number;
  selectedPolicyIds: string[];
};

export type AllyState = {
  id: string;
  name: string;
  posture: AllyPosture;
  governmentStance: number;
  parliamentConstraint: number;
  economicExposure: number;
  selectedPolicyIds: string[];
};

export type SituationDynamicsResult = {
  effect: Effect;
  opponentEffect: Partial<OpponentState>;
  tagChanges: { add: CrisisTag[]; remove: CrisisTag[] };
  pressureChanges: Partial<SituationPressure>;
  nextPhaseState: SituationPhaseState;
  transitionOccurred: boolean;
  transitionTrigger?: string;
  report: string;
};

export type IntelState = {
  id: string;
  source: InfoSource;
  topic: string;
  knownToPlayer: boolean;
  accuracy: number;
  delay: number;
  revealedOnDay: number;
  content: string;
};

export type EventTrigger = {
  metric?: MetricKey;
  threshold?: number;
  operator?: ">=" | "<=" | ">" | "<";
  tag?: CrisisTag;
  probabilityBonus: number;
};

export type EventChoice = {
  id: string;
  label: string;
  effect: Effect;
  logNote: string;
};

export type GameEvent = {
  id: string;
  title: string;
  urgency: number;
  significance: number;
  govAwareness: number;
  triggerConditions: EventTrigger[];
  baseProbability: number;
  foreshadowing: string[];
  effect: Effect;
  playerChoices?: EventChoice[];
  logEntry: string;
  resolved: boolean;
};

export type CabinetMinister = {
  id: string;
  title: string;
  domain: PolicyCategory[];
  priorityMetrics: MetricKey[];
  objectionThreshold: number;
};

export type CabinetCompromise = {
  ministerId: string;
  effect: Effect;
  modifiedPhrase: string;
};

export type ObjectiveChangeRequest = {
  triggeredByPm: boolean;
  suggestedObjective: StrategicObjective;
  pmPressureText: string;
};

export type ConsistencyCheck = {
  day: number;
  contradictionDetected: boolean;
  contradictionType: string;
  effect: Effect;
};

export type PressQA = {
  question: string;
  questionSource: string;
  playerResponse: PressResponseType;
  effect: Effect;
};

export type ActorRequest = {
  id: string;
  description: string;
  effect: Effect;
  refusalEffect: Effect;
  expiresOnDay: number;
};

export type MeetingActor = {
  id: string;
  name: string;
  relationship: number;
  lastMeetingDay: number;
  pendingRequest: ActorRequest | null;
};

export type PendingObligation = {
  actorId: string;
  obligationType: string;
  createdOnDay: number;
  expiresOnDay: number;
  fulfilledByPolicyId?: string;
};

export type TurnLog = {
  day: number;
  objective: string;
  submission: string;
  cabinet: string;
  press: string;
  reaction: string;
  event?: string;
  phase: GamePhase;
  situationPhaseAtDay: SituationPhaseState;
  situationPressureAtDay: SituationPressure;
  phaseTransitionOccurred: boolean;
  phaseTransitionDetail?: string;
  defenseInstituteNote: string;
  causalLinks: string[];
  compromiseDetails?: CabinetCompromise[];
  pressQA?: PressQA[];
  hiddenStateAtDay: {
    opponent: Partial<OpponentState>;
    situationPhase: SituationPhaseState;
    pressure: SituationPressure;
  };
};

export type PolicyClause = {
  id: string;
  category: PolicyCategory;
  label: string;
  phrase: string;
  cost: number;
  fiscalCost: number;
  effect: Effect;
  risk: string;
  pressureEffect?: Partial<SituationPressure>;
  resolveSignal: number;
  unlock?: (game: GameState) => boolean;
};

export type PressClause = {
  id: string;
  label: string;
  phrase: string;
  cost: number;
  effect: Effect;
  risk: string;
};

export type HiddenCrisis = {
  tags: CrisisTag[];
  opponentMessage: string;
  allyMessage: string;
};

export type ActorId = "japan" | "opponent" | "ally";
export type DiplomaticChannelStatus = "open" | "mediated" | "severed";

export type DiplomaticChannel = {
  actorPair: [ActorId, ActorId];
  status: DiplomaticChannelStatus;
  mediator?: string;
  openedOnDay: number;
  lastContactDay: number;
  trustLevel: number;
};

export type DiplomaticMessageType =
  | "formal_protest"
  | "demand"
  | "proposal"
  | "reassurance"
  | "backchannel"
  | "summit"
  | "ultimatum"
  | "joint_statement";

export type DiplomaticMessage = {
  id: string;
  from: ActorId;
  to: ActorId;
  type: DiplomaticMessageType;
  content: string;
  requiresResponse: boolean;
  responseDeadline: number;
  sentOnDay: number;
};

export type DiplomaticResponseType = "accept" | "reject" | "counter" | "ignore";

export type AssessmentEffect = {
  japanResolveEstimateChange?: number;
  opportunityScoreChange?: number;
  riskScoreChange?: number;
};

export type DiplomaticResponse = {
  messageId: string;
  from: ActorId;
  responseType: DiplomaticResponseType;
  effect: Effect;
  assessmentEffect: AssessmentEffect;
  sentOnDay: number;
};

export type MediatorInterest = "stability" | "economic" | "influence" | "neutral";

export type MediatorState = {
  id: string;
  name: string;
  credibilityWithOpponent: number;
  credibilityWithJapan: number;
  ownInterest: MediatorInterest;
  available: boolean;
};

export type WorldState = {
  militaryBalance: number;
  frontlineTension: number;
  escalationMomentum: number;
  diplomaticOpening: number;
  allianceSolidity: number;
  internationalLegitimacy: number;
  narrativeControl: number;
  urgency: number;
  situationPhase: SituationPhaseState;
  situationPressure: SituationPressure;
};

export type OpponentObservation = {
  perceivedMilitaryBalance: number;
  perceivedJapanResolve: number;
  perceivedAllyCommitment: number;
  perceivedDiplomaticOpening: number;
};

export type NpcSituationAssessment = {
  opportunityScore: number;
  riskScore: number;
  japanResolveEstimate: number;
  allyInterventionRisk: number;
  domesticConstraint: number;
  timeUrgency: number;
};

export type OpponentAction =
  | "advance"
  | "hold"
  | "probe"
  | "retreat"
  | "backchannel"
  | "public_statement"
  | "frontline_escalate";

export type AllyObservation = {
  perceivedThreatLevel: number;
  perceivedJapanDetermination: number;
  perceivedEscalationRisk: number;
  perceivedOpponentIntention: number;
};

export type AllyAssessment = {
  engagementScore: number;
  domesticFeasibility: number;
  japanTrustScore: number;
  escalationConcern: number;
  economicCostEstimate: number;
};

export type AllyEngagementStage = 1 | 2 | 3 | 4 | 5 | 6;
export type MilitaryStage = "deterrence" | "intimidation" | "limited_combat" | "joint_operation";
export type OperationTarget = "frontline" | "logistics" | "command" | "domestic";

export type MilitaryOperation = {
  id: string;
  title: string;
  description: string;
  stage: MilitaryStage;
  target: OperationTarget;
  militaryEffect: Effect;
  pressureEffect: Partial<SituationPressure>;
  politicalRisk: string;
  allianceRequirement?: string;
  internationalLawNote?: string;
  estimatedDuration: string;
  exitCondition: string;
  fiscalCostPerTurn: number;
};

export type MilitaryPhaseState = {
  active: boolean;
  currentStage: MilitaryStage | null;
  pendingOperations: MilitaryOperation[];
  approvedOperations: MilitaryOperation[];
  ongoingOperations: MilitaryOperation[];
};

export type PoliticalLegacy = {
  hardlineActions: number;
  diplomaticActions: number;
  domesticStabilityActions: number;
  allianceInvestments: number;
  ethicalCompromises: number;
};

export type FactionId = "hawk" | "dove" | "fiscal" | "diplomat";

export type FactionState = {
  factions: {
    id: FactionId;
    name: string;
    power: number;
  }[];
};

export type PreviewDelta = {
  effect: Effect;
  pressureEffect: Partial<SituationPressure>;
};

export type GameState = {
  day: number;
  step: RoutineStep;
  objective: StrategicObjective | null;
  metrics: Metrics;
  hidden: HiddenCrisis;
  logs: TurnLog[];
  ended: boolean;
  endingId: string | null;

  phase: GamePhase;
  phaseDay: number;
  difficulty: GameDifficulty;

  worldState: WorldState;

  situationPhase: SituationPhaseState;
  situationPressure: SituationPressure;
  situationHistory: SituationHistory;
  crystallizingStreak: number;

  opponent: OpponentState;
  opponentObservation: OpponentObservation;
  opponentAssessment: NpcSituationAssessment;

  allies: AllyState[];
  allyObservation: AllyObservation;
  allyAssessment: AllyAssessment;
  allyEngagementStage: AllyEngagementStage;

  diplomaticChannels: DiplomaticChannel[];
  pendingDiplomacy: DiplomaticMessage[];
  diplomaticHistory: DiplomaticResponse[];
  mediators: MediatorState[];

  militaryPhase: MilitaryPhaseState;

  intel: IntelState[];
  mediaGovGap: number;
  mediaGovGapHighStreak: number;

  pendingEvents: GameEvent[];
  resolvedEvents: GameEvent[];

  objectiveChangeRequest: ObjectiveChangeRequest | null;

  cabinetMode: CabinetMode;
  cabinetCompromises: CabinetCompromise[];

  selectedPressIds: string[];
  pressQA: PressQA[];
  consistencyChecks: ConsistencyCheck[];
  lastPressIds: string[];

  meetingActors: MeetingActor[];
  meetingUsed: boolean;
  pendingObligations: PendingObligation[];
  expiredRequests: string[];
  withdrawnRequests: string[];

  selectedPolicyIds: string[];
  lastPolicyIds: string[];

  nscQuestionsLeft: number;
  extraBriefings: string[];

  localControlHighStreak: number;

  pressFriction: number;
  cabinetCohesion: number;

  politicalLegacy: PoliticalLegacy;
  factionState: FactionState;

  criticalityScore: number;
};

export type EndingData = {
  id: string;
  headline: string;
  subheadline: string;
  body: string;
  defenseInstituteNote: string;
};
