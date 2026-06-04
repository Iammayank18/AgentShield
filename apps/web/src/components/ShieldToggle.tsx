"use client";
import { motion } from "framer-motion";
import { Shield, ShieldOff } from "lucide-react";

interface ShieldToggleProps {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function ShieldToggle({ enabled, onToggle, disabled }: ShieldToggleProps) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-all duration-300 ${
        enabled
          ? "border-blue-500/50 bg-blue-500/10 text-blue-400 shadow-[0_0_16px_rgba(59,130,246,0.3)]"
          : "border-red-500/30 bg-red-500/5 text-red-400"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <motion.div
        animate={{ rotate: enabled ? 0 : 15, scale: enabled ? 1 : 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {enabled ? <Shield size={16} /> : <ShieldOff size={16} />}
      </motion.div>
      <span>AgentShield {enabled ? "ON" : "OFF"}</span>
      <motion.div
        className={`w-8 h-4 rounded-full relative ${enabled ? "bg-blue-500" : "bg-slate-600"}`}
        animate={{ backgroundColor: enabled ? "#3b82f6" : "#475569" }}
      >
        <motion.div
          className="absolute top-0.5 w-3 h-3 bg-white rounded-full shadow"
          animate={{ left: enabled ? "calc(100% - 14px)" : "2px" }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </motion.div>
    </button>
  );
}
