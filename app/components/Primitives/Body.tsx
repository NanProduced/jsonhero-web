import type { ReactNode } from "react";

export function Body({ className, children }: { className?: string; children?: ReactNode }) {
  return <p className={`font-sans text-base ${className}`}>{children}</p>;
}
