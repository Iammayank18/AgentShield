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
      className={`relative flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden ${
        enabled
          ? "bg-blue-500/10 border border-blue-500/30 text-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.15),inset_0_1px_0_rgba(255,255,255,0.05)]"
          : "bg-red-500/8 border border-red-500/20 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.08)]"
      }`}
    >
      {/* Animated background shimmer when enabled */}
      {enabled && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        />
      )}

      <motion.div
        animate={{ rotate: enabled ? 0 : 12, scale: enabled ? 1 : 0.85 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="relative z-10"
      >
        {enabled
          ? <Shield size={15} className="drop-shadow-[0_0_6px_rgba(96,165,250,0.6)]" />
          : <ShieldOff size={15} />
        }
      </motion.div>

      <span className="relative z-10 tracking-wide">
        {enabled ? "Shield ON" : "Shield OFF"}
      </span>

      {/* Toggle pill */}
      <div className={`relative z-10 w-9 h-5 rounded-full transition-colors duration-300 ${enabled ? "bg-blue-500" : "bg-slate-700"}`}>
        <motion.div
          className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md"
          animate={{ left: enabled ? "calc(100% - 18px)" : "2px" }}
          transition={{ type: "spring", stiffness: 600, damping: 35 }}
        />
      </div>
    </button>
  );
}
