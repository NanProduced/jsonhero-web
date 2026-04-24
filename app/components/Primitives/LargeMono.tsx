import type { ReactNode } from "react";

export function LargeMono({ className, children }: { className?: string; children?: ReactNode }) {
  return <p className={`font-mono text-md ${className}`}>{children}</p>;
}
