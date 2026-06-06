"use client";
import type { TrustLevel } from "@agent-shield/shared-types";
import { Shield, ShieldAlert, ShieldOff } from "lucide-react";

const CONFIG: Record<TrustLevel, { label: string; icon: React.ReactNode; className: string }> = {
  trusted: {
    label: "TRUSTED",
    icon: <Shield size={9} />,
    className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-[0_0_8px_rgba(52,211,153,0.1)]",
  },
  untrusted: {
    label: "UNTRUSTED",
    icon: <ShieldOff size={9} />,
    className: "bg-red-500/10 text-red-400 border border-red-500/25 shadow-[0_0_8px_rgba(248,113,113,0.1)]",
  },
  sensitive: {
    label: "SENSITIVE",
    icon: <ShieldAlert size={9} />,
    className: "bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-[0_0_8px_rgba(251,191,36,0.1)]",
  },
};

export function TrustBadge({ level }: { level: TrustLevel }) {
  const { label, icon, className } = CONFIG[level];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold tracking-widest ${className}`}>
      {icon}
      {label}
    </span>
  );
}
