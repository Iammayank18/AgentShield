"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { ExecutionStep } from "@agent-shield/shared-types";
import { TrustBadge } from "./TrustBadge";
import { Terminal, Lock, Search, Brain, Wrench, CheckCircle, XCircle, Cpu } from "lucide-react";

const STEP_ICONS: Record<string, React.ReactNode> = {
  input:          <Terminal size={11} />,
  retrieval:      <Search size={11} />,
  planning:       <Brain size={11} />,
  security_check: <Lock size={11} />,
  tool_call:      <Wrench size={11} />,
  response:       <CheckCircle size={11} />,
};

const TRUST_ACCENT: Record<string, string> = {
  trusted:   "from-emerald-500/40 to-emerald-500/0",
  untrusted: "from-red-500/40 to-red-500/0",
  sensitive: "from-amber-500/40 to-amber-500/0",
};

const TRUST_CARD_BG: Record<string, string> = {
  trusted:   "bg-emerald-500/[0.03] border-emerald-500/10",
  untrusted: "bg-red-500/[0.04] border-red-500/15",
  sensitive: "bg-amber-500/[0.03] border-amber-500/10",
};

function StepItem({ step, index }: { step: ExecutionStep; index: number }) {
  const isBlocked = step.metadata?.blocked === true;
  const accent = TRUST_ACCENT[step.trustLevel] ?? TRUST_ACCENT.trusted;
  const cardBg = isBlocked ? "bg-red-500/[0.06] border-red-500/25" : (TRUST_CARD_BG[step.trustLevel] ?? TRUST_CARD_BG.trusted);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: "easeOut" }}
      className={`relative rounded-xl border mb-2.5 overflow-hidden ${cardBg}`}
    >
      {/* Left gradient accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b ${isBlocked ? "from-red-500/80 to-red-500/10" : accent}`} />

      <div className="pl-4 pr-3 py-3">
        <div className="flex items-center gap-2 mb-2">
          <div className={`flex items-center justify-center w-6 h-6 rounded-lg ${
            isBlocked ? "bg-red-500/15 text-red-400" : "bg-white/[0.04] text-slate-400"
          }`}>
            {STEP_ICONS[step.type] ?? <Cpu size={11} />}
          </div>

          <span className={`text-xs font-semibold flex-1 truncate ${isBlocked ? "text-red-300" : "text-slate-200"}`}>
            {step.label}
          </span>

          <TrustBadge level={step.trustLevel} />

          {step.taintedBy && step.taintedBy.length > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-[9px] font-mono text-red-400">
              ☣ {step.taintedBy.length}
            </span>
          )}
        </div>

        {step.content && (
          <div className="max-h-40 overflow-y-auto rounded-lg bg-black/20 border border-white/[0.03] px-3 py-2">
            <p className="text-[11px] text-slate-500 font-mono leading-relaxed whitespace-pre-wrap">
              {step.content}
            </p>
          </div>
        )}
      </div>

      {/* Blocked overlay flash */}
      {isBlocked && (
        <motion.div
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="absolute inset-0 bg-red-500/10 pointer-events-none"
        />
      )}
    </motion.div>
  );
}

interface AgentConsoleProps {
  steps: ExecutionStep[];
  streamStatus: string;
  isBlocked: boolean;
}

export function AgentConsole({ steps, streamStatus, isBlocked }: AgentConsoleProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/[0.04]">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Terminal size={13} className="text-blue-400" />
        </div>
        <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Agent Console</span>
        {streamStatus === "streaming" && (
          <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full dot-blink" />
            <span className="text-[10px] font-mono font-semibold text-blue-400 tracking-wider">LIVE</span>
          </div>
        )}
        {streamStatus === "completed" && (
          <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] font-mono font-semibold text-emerald-400 tracking-wider">{steps.length} steps</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-0.5">
        {steps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <Terminal size={16} className="text-slate-600" />
            </div>
            <span className="text-slate-600 text-xs font-mono">Waiting for execution...</span>
          </div>
        ) : (
          <AnimatePresence>
            {steps.map((step, i) => (
              <StepItem key={step.id} step={step} index={i} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {isBlocked && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="mt-3 p-3 bg-red-500/8 border border-red-500/25 rounded-xl flex items-center gap-3 shadow-[0_0_20px_rgba(239,68,68,0.08)]"
        >
          <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
            <XCircle size={14} className="text-red-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-red-300 tracking-wide">EXECUTION BLOCKED</p>
            <p className="text-[10px] text-slate-500 mt-0.5">AgentShield prevented privilege escalation</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
