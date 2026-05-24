import type { GameState, PreviewDelta } from "../lib/gameTypes";
import { LeftMonitor } from "./LeftMonitor";
import { CenterWorkspace } from "./CenterWorkspace";
import { RightIntelligence } from "./RightIntelligence";

export function AppShell({
  game,
  setGame,
  previewDelta,
  setPreviewDelta,
}: {
  game: GameState;
  setGame: (game: GameState) => void;
  previewDelta: PreviewDelta;
  setPreviewDelta: (delta: PreviewDelta) => void;
}) {
  const dangerTone = game.situationPhase === "critical" || game.hidden.tags.includes("frontline_drift");

  return (
    <main className={`min-h-screen bg-slate-100 p-4 text-slate-950 ${dangerTone ? "bg-red-50" : ""}`}>
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)_360px]">
        <LeftMonitor game={game} previewDelta={previewDelta} />
        <CenterWorkspace game={game} setGame={setGame} setPreviewDelta={setPreviewDelta} />
        <RightIntelligence game={game} />
      </div>
    </main>
  );
}
