"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { ExecutionStep } from "@agent-shield/shared-types";
import { TrustBadge } from "./TrustBadge";
import { Terminal, Lock, Search, Brain, Wrench, CheckCircle, XCircle } from "lucide-react";

const STEP_ICONS: Record<string, React.ReactNode> = {
  input: <Terminal size={12} />,
  retrieval: <Search size={12} />,
  planning: <Brain size={12} />,
  security_check: <Lock size={12} />,
  tool_call: <Wrench size={12} />,
  response: <CheckCircle size={12} />,
};

function StepItem({ step, index }: { step: ExecutionStep; index: number }) {
  const isBlocked = step.metadata?.blocked === true;
  const borderColor = isBlocked
    ? "border-red-500/60"
    : step.trustLevel === "trusted"
      ? "border-green-500/30"
      : step.trustLevel === "sensitive"
        ? "border-orange-500/30"
        : "border-red-500/40";

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`relative pl-4 border-l-2 ${borderColor} mb-3`}
    >
      {isBlocked && (
        <div className="absolute -left-1 top-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      )}
      <div className="flex items-center gap-2 mb-1">
        <span className={`${isBlocked ? "text-red-400" : "text-slate-400"}`}>
          {STEP_ICONS[step.type] ?? <Terminal size={12} />}
        </span>
        <span className="text-xs font-semibold text-slate-300">{step.label}</span>
        <TrustBadge level={step.trustLevel} />
        {step.taintedBy && step.taintedBy.length > 0 && (
          <span className="text-[10px] text-red-400/70 font-mono">
            ☣ tainted({step.taintedBy.length})
          </span>
        )}
      </div>
      <p className="text-[11px] text-slate-500 font-mono leading-relaxed line-clamp-3 whitespace-pre-wrap">
        {step.content}
      </p>
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
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#1e1e2e]">
        <Terminal size={14} className="text-slate-400" />
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Agent Console</span>
        {streamStatus === "streaming" && (
          <span className="ml-auto flex items-center gap-1 text-[10px] text-blue-400">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            LIVE
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {steps.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-slate-600 text-xs font-mono">
            Waiting for execution...
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
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-3 bg-red-500/10 border border-red-500/40 rounded-lg flex items-center gap-2"
        >
          <XCircle size={16} className="text-red-400 shrink-0" />
          <p className="text-xs text-red-300 font-semibold">
            EXECUTION BLOCKED — AgentShield prevented privilege escalation
          </p>
        </motion.div>
      )}
    </div>
  );
}
