import type { ReactNode } from "react";

export function SmallSubtitle({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <h3 className={`font-sans text-xl text-slate-300 ${className}`}>{children}</h3>
  );
}
