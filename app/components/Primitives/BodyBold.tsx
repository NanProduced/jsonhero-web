import type { ReactNode } from "react";

export function BodyBold({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <p className={`font-sans text-base font-bold ${className}`}>{children}</p>
  );
}
