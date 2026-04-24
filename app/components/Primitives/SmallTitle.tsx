import type { ReactNode } from "react";

export function SmallTitle({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <h3 className={`font-sans font-bold text-lg ${className}`}>{children}</h3>
  );
}
