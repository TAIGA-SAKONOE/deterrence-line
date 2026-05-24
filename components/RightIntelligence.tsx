import type { GameState } from "../lib/gameTypes";

export function RightIntelligence({ game }: { game: GameState }) {
  const latest = game.logs.at(-1);

  return (
    <aside className="h-full overflow-y-auto rounded-2xl border border-slate-300 bg-white/90 p-4 shadow-xl">
      <div className="mb-4">
        <div className="text-xs text-slate-500">報告・速報・戦史ログ</div>
        <div className="text-2xl font-black tracking-tight text-slate-900">Intelligence</div>
      </div>

      {latest?.phaseTransitionOccurred ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3">
          <div className="text-xs font-black text-red-700">速報 / 事態評価変更</div>
          <p className="mt-2 text-sm leading-6 text-red-950">{latest.phaseTransitionDetail}</p>
        </div>
      ) : null}

      <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="text-xs font-bold text-slate-500">WorldState 観測断片</div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-700">
          <div>軍事均衡：{game.worldState.militaryBalance}</div>
          <div>前線緊張：{game.worldState.frontlineTension}</div>
          <div>外交開口：{game.worldState.diplomaticOpening}</div>
          <div>同盟結束：{game.worldState.allianceSolidity}</div>
          <div>情報主導：{game.worldState.narrativeControl}</div>
          <div>切迫度：{game.worldState.urgency}</div>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="text-xs font-bold text-slate-500">断片情報</div>
        <p className="mt-2 text-sm leading-6 text-slate-800">{game.hidden.opponentMessage}</p>
        <p className="mt-2 text-sm leading-6 text-slate-800">{game.hidden.allyMessage}</p>
        <div className="mt-3 flex flex-wrap gap-1">
          {game.hidden.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-700">{tag}</span>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {game.logs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">まだ戦史ログはありません。</div>
        ) : (
          [...game.logs].reverse().map((log) => (
            <article key={`${log.day}-${log.submission}`} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
              <div className="font-black">第{log.day}日 戦史ログ</div>
              <div className="mt-2 font-serif text-slate-800">{log.reaction}</div>
              {log.event ? <div className="mt-2 rounded bg-red-50 p-2 text-xs font-bold text-red-900">{log.event}</div> : null}
              <div className="mt-2 text-xs text-slate-500">{log.defenseInstituteNote}</div>
              {log.causalLinks.length > 0 ? (
                <ul className="mt-2 list-disc pl-4 text-xs text-slate-500">
                  {log.causalLinks.map((link) => <li key={link}>{link}</li>)}
                </ul>
              ) : null}
            </article>
          ))
        )}
      </div>
    </aside>
  );
}
