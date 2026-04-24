import type { ReactNode } from "react";

export function Title({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <h2 className={`font-sans font-bold text-xl ${className}`}>{children}</h2>
  );
}
