import type { TurnLog } from "../lib/gameTypes";

export function LogPanel({ logs }: { logs: TurnLog[] }) {
  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div key={log.day} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
          <div className="font-bold">第{log.day}日</div>
          <div>{log.reaction}</div>
        </div>
      ))}
    </div>
  );
}
