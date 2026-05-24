import type { GameState, WorldState } from "./gameTypes";
import { calculateCriticalityScore, clamp } from "./utils";

export function calculateWorldState(game: GameState): WorldState {
  const m = game.metrics;
  const p = game.situationPressure;

  const ownPower =
    m.ownReadyShips * 4 +
    m.ownDeployedShips * 7 +
    m.allySupportShips * 8 +
    (m.maintenanceRate - 50) * 0.25;

  const opponentPower =
    m.opponentDeployedShips * 7 +
    game.opponent.escalationWill * 0.18 +
    (100 - game.opponent.frontlineControl) * 0.12;

  const militaryBalance = clamp(Math.round(ownPower - opponentPower), -100, 100);

  const frontlineTension = clamp(
    Math.round(
      p.militaryPressure * 0.45 +
        m.escalationRisk * 0.25 +
        (100 - game.opponent.frontlineControl) * 0.2 +
        m.opponentDeployedShips * 2,
    ),
    0,
    100,
  );

  const escalationMomentum = clamp(
    Math.round(
      m.escalationRisk * 0.45 +
        p.militaryPressure * 0.3 +
        p.informationPressure * 0.15 +
        p.timePressure * 0.1,
    ),
    0,
    100,
  );

  const diplomaticOpening = clamp(
    Math.round(
      m.peaceWindow * 0.55 +
        m.allyCredit * 0.2 +
        game.diplomaticChannels.length * 4 -
        m.escalationRisk * 0.18,
    ),
    0,
    100,
  );

  const allianceSolidity = clamp(
    Math.round(
      m.allyCredit * 0.65 +
        m.allySupportShips * 5 +
        game.allyEngagementStage * 4 -
        game.allies[0].parliamentConstraint * 0.15,
    ),
    0,
    100,
  );

  const internationalLegitimacy = clamp(
    Math.round(
      m.governmentTrust * 0.45 +
        allianceSolidity * 0.25 +
        m.peaceWindow * 0.15 -
        game.mediaGovGap * 0.15,
    ),
    0,
    100,
  );

  const narrativeControl = clamp(
    Math.round(
      m.governmentTrust -
        game.mediaGovGap * 0.9 -
        m.anxiety * 0.25 +
        game.metrics.bureaucraticGrip * 0.25,
    ),
    -100,
    100,
  );

  const urgency = Math.round(calculateCriticalityScore(m, p));

  return {
    militaryBalance,
    frontlineTension,
    escalationMomentum,
    diplomaticOpening,
    allianceSolidity,
    internationalLegitimacy,
    narrativeControl,
    urgency,
    situationPhase: game.situationPhase,
    situationPressure: p,
  };
}

export function worldSummary(world: WorldState): string {
  if (world.urgency >= 70) {
    return "複数指標が危機水準に接近しており、軍事・情報・市場が相互に増幅している。";
  }

  if (world.frontlineTension >= 65) {
    return "前線緊張が高く、相手国の意図と中央統制の乖離に注意を要する。";
  }

  if (world.diplomaticOpening >= 60) {
    return "外交的収束の余地が確認される。ただし現地の軍事的圧力は残っている。";
  }

  return "状況はなお流動的であり、各アクターの判断は確定していない。";
}
