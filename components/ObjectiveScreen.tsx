import type { GameState, StrategicObjective } from "../lib/gameTypes";
import { selectObjective } from "../lib/gameEngine";
import { objectiveDescriptions, objectiveLabels } from "../data/objectives";
import { Button, Panel } from "./ui";

const objectives = Object.keys(objectiveLabels) as StrategicObjective[];

export function ObjectiveScreen({ game, setGame }: { game: GameState; setGame: (game: GameState) => void }) {
  return (
    <div className="space-y-4">
      <Panel title="政府目標の設定">
        <p className="mb-4 text-sm text-slate-600">官房長官として首相に上げる政府目標を整理してください。</p>
        <div className="grid gap-3">
          {objectives.map((objective) => (
            <button
              key={objective}
              onClick={() => setGame(selectObjective(game, objective))}
              className="rounded-xl border border-slate-300 bg-white p-4 text-left transition hover:border-slate-900 hover:bg-slate-50"
            >
              <div className="font-black">{objectiveLabels[objective]}</div>
              <div className="mt-1 text-sm text-slate-600">{objectiveDescriptions[objective]}</div>
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}
