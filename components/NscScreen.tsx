import type { GameState } from "../lib/gameTypes";
import { goToStep } from "../lib/gameEngine";
import { Button, Panel, Stamp } from "./ui";

function phaseTone(game: GameState): string {
  switch (game.situationPhase) {
    case "latent":
      return "現時点で顕著な変化は観測されていないが、各指標は静かに変化している。";
    case "active":
      return "状況は流動的である。各アクターの動きが活発化している。";
    case "critical":
      return "予断を許さない状況が続いている。小さな誤算が大きな影響をもたらしかねない。";
    case "crystallizing":
      return "現地では既成事実化の動きが進み、外交的反転の余地が縮小している。";
    case "dissolving":
      return "事態は収束方向に向かいつつある。ただし不安定要素は残存している。";
  }
}

export function NscScreen({ game, setGame }: { game: GameState; setGame: (game: GameState) => void }) {
  const latestTransition = game.situationHistory.phaseTransitions.at(-1);

  return (
    <div className="space-y-4">
      <Panel title={`第${game.day}日 国家安全保障会議 報告`}>
        <div className="mb-3 flex gap-2"><Stamp>極秘</Stamp><Stamp>確度：中</Stamp></div>
        <div className="mb-4 rounded-xl bg-slate-50 p-3 font-serif leading-7">
          {phaseTone(game)}
          {latestTransition && latestTransition.day === game.day - 1 ? (
            <p className="mt-2 text-red-900">
              （情報機関）：事態の構造的変化を示す複数の指標が確認されている。評価改訂が必要である可能性がある。
            </p>
          ) : null}
        </div>
        <div className="space-y-3 font-serif leading-8">
          <p><b>防衛省：</b> C地域周辺の相手国展開艦艇は推定{game.metrics.opponentDeployedShips}隻。現地制御度は{game.metrics.localControl}。</p>
          <p><b>外務省：</b> 相手国中央政府は通常訓練との説明を維持。外交チャンネルの開閉状況は断片的に確認されている。</p>
          <p><b>財務省：</b> 株価前日比{game.metrics.stockChangePct}%、10年国債金利{game.metrics.bondYield10y}%、緊急予算残{game.metrics.emergencyBudget}億円。</p>
          <p><b>経産省：</b> 燃料備蓄{game.metrics.fuelReserveDays}日、物流遅延率{game.metrics.shippingDelayPct}%。</p>
        </div>
      </Panel>
      <Button onClick={() => setGame(goToStep(game, "work"))}>執務室へ戻る</Button>
    </div>
  );
}
