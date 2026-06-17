import type { ReactNode } from "react";

export function SmallBody({ className, children }: { className?: string; children?: ReactNode }) {
  return <p className={`font-sans text-sm ${className}`}>{children}</p>;
}
