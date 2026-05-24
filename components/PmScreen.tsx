import type { GameState } from "../lib/gameTypes";
import { goToStep } from "../lib/gameEngine";
import { Button, Panel } from "./ui";

export function PmScreen({ game, setGame }: { game: GameState; setGame: (game: GameState) => void }) {
  const trust = game.metrics.pmTrust;
  const lowCapital = game.metrics.politicalCapital <= 3;
  const hawk = game.factionState.factions.find((f) => f.id === "hawk")?.power ?? 0;
  const dove = game.factionState.factions.find((f) => f.id === "dove")?.power ?? 0;

  const tone = trust >= 70
    ? "君の整理に任せる。だが、政治の目的を見失わないでくれ。"
    : trust >= 40
      ? "状況は読みにくい。政府目標との整合をもう一度確認したい。"
      : "このまま進めてよいのか。官邸として持つのか、率直に聞きたい。";

  const factionLine = hawk >= 60
    ? "党内からは、ここで引けば政権が持たないという声が強い。"
    : dove >= 60
      ? "党内には、早期収束を求める声も増えている。"
      : "党内はまだ割れている。こちらで束ねる必要がある。";

  return (
    <div className="space-y-4">
      <Panel title={`第${game.day}日 首相打ち合わせ`}>
        <p className="font-serif text-lg leading-8">{tone}</p>
        <p className="mt-4 font-serif text-base leading-8 text-slate-700">{factionLine}</p>
        {lowCapital ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-900">
            首相は短く告げた。「残された政治的余力は多くない。今日のまとめ方を誤るな。」
          </div>
        ) : null}
      </Panel>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setGame({ ...game, metrics: { ...game.metrics, pmTrust: Math.min(100, game.metrics.pmTrust + 2) }, step: "nsc" })}>懸念を受け止め説明する</Button>
        <Button
          variant="secondary"
          disabled={game.metrics.pmTrust < 40}
          onClick={() => setGame({ ...game, metrics: { ...game.metrics, politicalCapital: Math.max(0, game.metrics.politicalCapital - 2) }, step: "nsc" })}
        >
          政府目標の維持を進言する
        </Button>
        <Button variant="secondary" onClick={() => setGame(goToStep(game, "nsc"))}>本日のNSCへ進む</Button>
      </div>
    </div>
  );
}
