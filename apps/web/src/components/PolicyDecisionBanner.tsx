"use client";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ShieldX } from "lucide-react";

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
          initial={{ opacity: 0, y: -16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border font-semibold text-sm ${
            isBlocked
              ? "bg-blue-500/10 border-blue-500/40 text-blue-300 shadow-[0_0_24px_rgba(59,130,246,0.2)]"
              : "bg-red-500/10 border-red-500/40 text-red-300 shadow-[0_0_24px_rgba(239,68,68,0.2)]"
          }`}
        >
          {isBlocked ? (
            <>
              <ShieldCheck size={20} className="text-blue-400" />
              <span>ATTACK BLOCKED BY AGENTSHIELD — No data was leaked. No privileged action was taken.</span>
            </>
          ) : (
            <>
              <ShieldX size={20} className="text-red-400" />
              <span>ATTACK SUCCEEDED — AgentShield was disabled. Credentials were exfiltrated.</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
