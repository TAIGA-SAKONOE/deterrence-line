import type { GameState, PreviewDelta } from "../lib/gameTypes";
import { goToStep, togglePolicy } from "../lib/gameEngine";
import { emptyPreviewDelta } from "../lib/utils";
import { policyClauses } from "../data/policyClauses";
import { Button, Panel } from "./ui";

export function WorkScreen({
  game,
  setGame,
  setPreviewDelta,
}: {
  game: GameState;
  setGame: (game: GameState) => void;
  setPreviewDelta: (delta: PreviewDelta) => void;
}) {
  const availableClauses = policyClauses.filter((p) => !p.unlock || p.unlock(game));
  const selected = policyClauses.filter((p) => game.selectedPolicyIds.includes(p.id));
  const totalCost = selected.reduce((sum, p) => sum + p.cost, 0);
  const totalFiscal = selected.reduce((sum, p) => sum + p.fiscalCost, 0);

  return (
    <div className="space-y-4">
      <Panel title={`第${game.day}日 官房長官執務：上申文作成`}>
        <div className="mb-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>選択済み政策句スロット</span>
            <span>政治資本 {totalCost} / 財政負荷 {totalFiscal}億円</span>
          </div>
          {selected.length === 0 ? <div className="text-sm text-slate-500">政策句が未選択です。</div> : selected.map((p) => <div key={p.id} className="mb-2 rounded-lg bg-white p-3 text-sm shadow-sm">{p.phrase}</div>)}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {availableClauses.map((clause) => {
            const isSelected = game.selectedPolicyIds.includes(clause.id);
            return (
              <button
                key={clause.id}
                onMouseEnter={() => setPreviewDelta({ effect: clause.effect, pressureEffect: clause.pressureEffect ?? {} })}
                onMouseLeave={() => setPreviewDelta(emptyPreviewDelta())}
                onFocus={() => setPreviewDelta({ effect: clause.effect, pressureEffect: clause.pressureEffect ?? {} })}
                onBlur={() => setPreviewDelta(emptyPreviewDelta())}
                onClick={() => setGame(togglePolicy(game, clause.id))}
                className={`rounded-xl border p-4 text-left transition ${isSelected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white hover:border-slate-900"}`}
              >
                <div className="text-xs font-bold opacity-70">{clause.category}</div>
                <div className="mt-1 font-black">{clause.label}</div>
                <div className="mt-2 text-sm opacity-80">{clause.phrase}</div>
                <div className="mt-3 text-xs opacity-70">政治資本 {clause.cost} / 財政負荷 {clause.fiscalCost}億円</div>
                <div className="mt-2 text-xs opacity-70">リスク：{clause.risk}</div>
              </button>
            );
          })}
        </div>
      </Panel>

      {game.militaryPhase.active ? (
        <Panel title="統幕上申パネル">
          <p className="font-serif">統幕より作戦案が上申されています。Phase 2では表示枠のみ実装しています。</p>
        </Panel>
      ) : null}

      <Button onClick={() => { setPreviewDelta(emptyPreviewDelta()); setGame(goToStep(game, "cabinet")); }} disabled={game.selectedPolicyIds.length === 0}>
        閣議へ上げる
      </Button>
    </div>
  );
}
