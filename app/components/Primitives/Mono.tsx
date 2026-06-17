import type { ReactNode } from "react";

export function Mono({ className, children }: { className?: string; children?: ReactNode }) {
  return <p className={`font-mono text-sm ${className}`}>{children}</p>;
}
