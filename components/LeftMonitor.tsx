import type { GameState, MetricKey, PreviewDelta } from "../lib/gameTypes";
import { criticalityLabel, metricLabels, pressureLabels } from "../lib/utils";

const watchedMetrics: MetricKey[] = [
  "politicalCapital",
  "pmTrust",
  "cabinetApproval",
  "governmentTrust",
  "anxiety",
  "localControl",
  "escalationRisk",
  "peaceWindow",
  "allyCredit",
  "stockChangePct",
  "bondYield10y",
  "fuelReserveDays",
  "ammoStockDays",
  "emergencyBudget",
];

export function LeftMonitor({ game, previewDelta }: { game: GameState; previewDelta: PreviewDelta }) {
  const criticality = criticalityLabel(game.criticalityScore);

  return (
    <aside className="h-full overflow-y-auto rounded-2xl border border-slate-300 bg-slate-950 p-4 text-slate-100 shadow-xl">
      <div className="mb-4">
        <div className="text-xs text-slate-400">内閣官房危機管理端末</div>
        <div className="text-2xl font-black tracking-tight">Monitor</div>
      </div>

      <div className="mb-4 rounded-xl border border-slate-700 bg-slate-900 p-3">
        <div className="text-xs text-slate-400">臨界度</div>
        <div className={`mt-1 text-xl font-black ${criticality === "危機" ? "text-red-300" : criticality === "緊張" ? "text-amber-200" : "text-emerald-200"}`}>
          {criticality}
        </div>
      </div>

      <div className="space-y-3">
        {watchedMetrics.map((key) => {
          const value = game.metrics[key];
          const delta = previewDelta.effect[key] ?? 0;
          return (
            <div key={key} className="rounded-lg bg-slate-900/80 p-3">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-300">{metricLabels[key]}</span>
                <span className="font-mono">
                  {value}
                  {delta !== 0 ? <span className={delta > 0 ? "ml-2 animate-pulse text-emerald-300" : "ml-2 animate-pulse text-red-300"}>{delta > 0 ? `+${delta}` : delta}</span> : null}
                </span>
              </div>
              {key !== "stockChangePct" && key !== "bondYield10y" && key !== "emergencyBudget" ? (
                <div className="mt-2 h-1.5 rounded-full bg-slate-700">
                  <div className="h-1.5 rounded-full bg-slate-200" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-5 border-t border-slate-800 pt-4">
        <div className="mb-2 text-xs font-bold text-slate-400">圧力変数</div>
        {Object.entries(game.situationPressure).map(([key, value]) => {
          const delta = previewDelta.pressureEffect[key as keyof typeof game.situationPressure] ?? 0;
          return (
            <div key={key} className="mb-2 flex justify-between text-xs">
              <span>{pressureLabels[key as keyof typeof game.situationPressure]}</span>
              <span className="font-mono">
                {value}
                {delta !== 0 ? <span className={delta > 0 ? "ml-2 text-red-300" : "ml-2 text-emerald-300"}>{delta > 0 ? `+${delta}` : delta}</span> : null}
              </span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
