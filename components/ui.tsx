import type { ReactNode } from "react";

export function Panel({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-300 bg-white/85 shadow-sm ${className}`}>
      {title ? <div className="border-b border-slate-200 px-4 py-3 text-sm font-bold tracking-wide text-slate-700">{title}</div> : null}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Button({
  children,
  onClick,
  disabled = false,
  variant = "primary",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
}) {
  const base = "rounded-xl px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40";
  const styles = {
    primary: "bg-slate-900 text-white hover:bg-slate-700",
    secondary: "border border-slate-300 bg-white text-slate-900 hover:bg-slate-100",
    danger: "bg-red-900 text-white hover:bg-red-800",
  };
  return (
    <button className={`${base} ${styles[variant]}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function Stamp({ children }: { children: ReactNode }) {
  return <span className="inline-flex rotate-[-6deg] rounded border-2 border-red-800 px-2 py-1 text-xs font-black text-red-800 opacity-80">{children}</span>;
}
