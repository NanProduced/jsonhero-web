import type { ReactNode } from "react";

export function ExtraLargeTitle({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <h1 className={`font-sans font-bold text-6xl ${className}`}>{children}</h1>
  );
}
