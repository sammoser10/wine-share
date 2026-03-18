"use client";

import type { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
};

export function GlassCard({ children, className = "", onClick }: GlassCardProps) {
  return (
    <div
      className={`glass-card p-4 ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
