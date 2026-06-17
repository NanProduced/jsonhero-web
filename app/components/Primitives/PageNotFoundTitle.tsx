import type { ReactNode } from "react";

export function PageNotFoundTitle({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <h1 className={`font-sans font-bold text-8xl ${className}`}>{children}</h1>
  );
}
