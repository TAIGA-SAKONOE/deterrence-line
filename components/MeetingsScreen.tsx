import type { GameState } from "../lib/gameTypes";
import { resolveDay } from "../lib/gameEngine";
import { Button, Panel } from "./ui";

export function MeetingsScreen({ game, setGame }: { game: GameState; setGame: (game: GameState) => void }) {
  return (
    <div className="space-y-4">
      <Panel title="各種面談・非公式情報">
        <div className="grid gap-3 md:grid-cols-2">
          {game.meetingActors.map((actor) => (
            <div key={actor.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="font-black">{actor.name}</div>
              <p className="mt-2 font-serif text-sm leading-6">「表には出せない話ですが、明日の判断材料にはなるはずです。」</p>
              <div className="mt-2 text-xs text-slate-500">関係値 {actor.relationship}</div>
            </div>
          ))}
        </div>
      </Panel>
      <Button variant="danger" onClick={() => setGame(resolveDay(game))}>本日の処理を確定し、翌日へ</Button>
    </div>
  );
}
