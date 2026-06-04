"use client";
import type { TrustLevel } from "@agent-shield/shared-types";
import { Shield, ShieldAlert, ShieldOff } from "lucide-react";

const CONFIG: Record<TrustLevel, { label: string; icon: React.ReactNode; className: string }> = {
  trusted: {
    label: "TRUSTED",
    icon: <Shield size={10} />,
    className: "bg-green-500/10 text-green-400 border border-green-500/30",
  },
  untrusted: {
    label: "UNTRUSTED",
    icon: <ShieldOff size={10} />,
    className: "bg-red-500/10 text-red-400 border border-red-500/30",
  },
  sensitive: {
    label: "SENSITIVE",
    icon: <ShieldAlert size={10} />,
    className: "bg-orange-500/10 text-orange-400 border border-orange-500/30",
  },
};

export function TrustBadge({ level }: { level: TrustLevel }) {
  const { label, icon, className } = CONFIG[level];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold tracking-wider ${className}`}>
      {icon}
      {label}
    </span>
  );
}
