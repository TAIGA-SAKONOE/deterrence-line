import type { GameState } from "../lib/gameTypes";
import { createInitialState } from "../data/initialState";
import { endings } from "../data/endings";
import { Button, Panel } from "./ui";

export function EndScreen({ game, setGame }: { game: GameState; setGame: (game: GameState) => void }) {
  const ending = endings[game.endingId ?? "provisional_success"] ?? endings.provisional_success;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-4 border-slate-900 bg-white p-8 shadow-2xl">
        <div className="mb-2 text-5xl font-black tracking-widest">号外</div>
        <h2 className="font-serif text-4xl font-black">{ending.headline}</h2>
        <p className="mt-3 text-xl font-bold">{ending.subheadline}</p>
        <p className="mt-6 font-serif leading-8">{ending.body}</p>
      </div>
      <Panel title="防衛研究所注釈">
        <p className="font-serif leading-8">{ending.defenseInstituteNote}</p>
      </Panel>
      <Button onClick={() => setGame(createInitialState(game.difficulty))}>もう一度プレイする</Button>
    </div>
  );
}
