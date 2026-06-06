"use client";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ShieldX, Zap } from "lucide-react";

interface PolicyDecisionBannerProps {
  isBlocked: boolean | null;
  streamStatus: string;
}

export function PolicyDecisionBanner({ isBlocked, streamStatus }: PolicyDecisionBannerProps) {
  const show = streamStatus === "completed" && isBlocked !== null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={`relative flex items-center gap-4 px-5 py-3.5 rounded-2xl border font-semibold text-sm overflow-hidden ${
            isBlocked
              ? "bg-emerald-500/8 border-emerald-500/25 text-emerald-300 shadow-[0_0_40px_rgba(34,197,94,0.12),inset_0_1px_0_rgba(52,211,153,0.08)]"
              : "bg-red-500/8 border-red-500/25 text-red-300 shadow-[0_0_40px_rgba(239,68,68,0.12),inset_0_1px_0_rgba(248,113,113,0.08)]"
          }`}
        >
          {/* Shimmer sweep */}
          <motion.div
            className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent`}
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 0.8, delay: 0.1 }}
          />

          <div className={`relative flex items-center justify-center w-9 h-9 rounded-xl ${
            isBlocked ? "bg-emerald-500/15" : "bg-red-500/15"
          }`}>
            {isBlocked
              ? <ShieldCheck size={18} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              : <ShieldX size={18} className="text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.6)]" />
            }
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-bold tracking-widest uppercase ${
                isBlocked ? "text-emerald-400" : "text-red-400"
              }`}>
                {isBlocked ? "Attack Blocked" : "Attack Succeeded"}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase ${
                isBlocked ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
              }`}>
                {isBlocked ? "PROTECTED" : "UNPROTECTED"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-normal">
              {isBlocked
                ? "IFC engine blocked the privileged tool call. No data was leaked. No action was taken."
                : "AgentShield was disabled. The agent complied with the injected instructions."}
            </p>
          </div>

          {isBlocked && (
            <div className="flex items-center gap-1 text-[10px] text-emerald-500/60 font-mono">
              <Zap size={10} />
              <span>deterministic</span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
