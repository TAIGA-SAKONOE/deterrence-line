import type { GameState, PreviewDelta } from "../lib/gameTypes";
import { BriefingScreen } from "./BriefingScreen";
import { ObjectiveScreen } from "./ObjectiveScreen";
import { PmScreen } from "./PmScreen";
import { NscScreen } from "./NscScreen";
import { WorkScreen } from "./WorkScreen";
import { CabinetScreen } from "./CabinetScreen";
import { PressScreen } from "./PressScreen";
import { MeetingsScreen } from "./MeetingsScreen";
import { EndScreen } from "./EndScreen";

export function CenterWorkspace({
  game,
  setGame,
  setPreviewDelta,
}: {
  game: GameState;
  setGame: (game: GameState) => void;
  setPreviewDelta: (delta: PreviewDelta) => void;
}) {
  return (
    <section className="min-h-[calc(100vh-2rem)] rounded-2xl border border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,.96),rgba(248,250,252,.96))] p-5 shadow-xl transition-all duration-300">
      <header className="mb-5 border-b border-slate-200 pb-4">
        <div className="text-xs font-bold tracking-[.2em] text-slate-500">島嶼国家A 内閣官房長官シミュレーター</div>
        <h1 className="mt-1 text-4xl font-black tracking-tight">抑止線：Crisis Cabinet</h1>
        <div className="mt-2 text-sm text-slate-600">第{game.day}日 / {game.step}</div>
      </header>

      {game.step === "briefing" && <BriefingScreen game={game} setGame={setGame} />}
      {game.step === "objective" && <ObjectiveScreen game={game} setGame={setGame} />}
      {game.step === "pm" && <PmScreen game={game} setGame={setGame} />}
      {game.step === "nsc" && <NscScreen game={game} setGame={setGame} />}
      {game.step === "work" && <WorkScreen game={game} setGame={setGame} setPreviewDelta={setPreviewDelta} />}
      {game.step === "cabinet" && <CabinetScreen game={game} setGame={setGame} />}
      {game.step === "press" && <PressScreen game={game} setGame={setGame} setPreviewDelta={setPreviewDelta} />}
      {game.step === "meetings" && <MeetingsScreen game={game} setGame={setGame} />}
      {game.step === "end" && <EndScreen game={game} setGame={setGame} />}
    </section>
  );
}
