import type { GameState, PreviewDelta } from "../lib/gameTypes";
import { goToStep, togglePress } from "../lib/gameEngine";
import { emptyPreviewDelta } from "../lib/utils";
import { pressClauses } from "../data/pressClauses";
import { Button, Panel } from "./ui";

export function PressScreen({
  game,
  setGame,
  setPreviewDelta,
}: {
  game: GameState;
  setGame: (game: GameState) => void;
  setPreviewDelta: (delta: PreviewDelta) => void;
}) {
  return (
    <div className="space-y-4">
      <Panel title="定例記者会見">
        <p className="mb-4 text-sm text-slate-600">真実の完全開示ではなく、どこまで説明するかを管理します。</p>
        <div className="grid gap-3">
          {pressClauses.map((clause) => {
            const isSelected = game.selectedPressIds.includes(clause.id);
            return (
              <button
                key={clause.id}
                onMouseEnter={() => setPreviewDelta({ effect: clause.effect, pressureEffect: {} })}
                onMouseLeave={() => setPreviewDelta(emptyPreviewDelta())}
                onClick={() => setGame(togglePress(game, clause.id))}
                className={`rounded-xl border p-4 text-left ${isSelected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white"}`}
              >
                <div className="font-black">{clause.label}</div>
                <div className="mt-2 font-serif text-sm leading-6">{clause.phrase}</div>
              </button>
            );
          })}
        </div>
      </Panel>
      <Button onClick={() => { setPreviewDelta(emptyPreviewDelta()); setGame(goToStep(game, "meetings")); }}>面談へ進む</Button>
    </div>
  );
}
