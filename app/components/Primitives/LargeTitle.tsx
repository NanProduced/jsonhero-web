import type { ReactNode } from "react";

export function LargeTitle({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <h1 className={`font-sans font-bold text-2xl ${className}`}>{children}</h1>
  );
}
