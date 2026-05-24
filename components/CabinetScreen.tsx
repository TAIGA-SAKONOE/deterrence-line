import type { GameState } from "../lib/gameTypes";
import { goToStep } from "../lib/gameEngine";
import { ministers } from "../data/ministers";
import { Button, Panel, Stamp } from "./ui";

export function CabinetScreen({ game, setGame }: { game: GameState; setGame: (game: GameState) => void }) {
  return (
    <div className="space-y-4">
      <Panel title="閣議：政策調整">
        <div className="grid gap-3 md:grid-cols-3">
          {ministers.map((m) => (
            <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-2 font-black">{m.title}</div>
              <p className="font-serif text-sm leading-6">所管事項への影響を確認したうえで、条件付きで了承します。</p>
              <div className="mt-3"><Stamp>APPROVED</Stamp></div>
            </div>
          ))}
        </div>
      </Panel>
      <Button onClick={() => setGame(goToStep(game, "press"))}>閣議決定（決裁）</Button>
    </div>
  );
}
