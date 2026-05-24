import type { GameState } from "../lib/gameTypes";
import { goToStep } from "../lib/gameEngine";
import { Button, Panel, Stamp } from "./ui";

export function BriefingScreen({ game, setGame }: { game: GameState; setGame: (game: GameState) => void }) {
  return (
    <div className="space-y-4">
      <Panel title="官房危機管理センター 初動報告">
        <div className="mb-3"><Stamp>未確認</Stamp></div>
        <p className="font-serif leading-8">
          C地域周辺において相手国艦艇の活動が活発化しています。現時点では限定的な危機として管理されていますが、前線部隊の統制状況には不透明な点があります。
        </p>
      </Panel>
      <Panel title="首相からの問い">
        <p className="font-serif leading-8">「この危機を、政府として何を守るための危機として扱うべきか。まず君の整理を聞きたい。」</p>
      </Panel>
      <Button onClick={() => setGame(goToStep(game, "objective"))}>政府目標を整理する</Button>
    </div>
  );
}
