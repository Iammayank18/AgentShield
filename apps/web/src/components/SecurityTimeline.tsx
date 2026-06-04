"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { AgentEvent } from "@agent-shield/shared-types";
import { ShieldOff, CheckCircle, AlertTriangle, Activity } from "lucide-react";

function EventNode({ event, index }: { event: AgentEvent; index: number }) {
  const isBlocked = event.type === "tool_call_blocked" || event.type === "violation_detected";
  const isApproved = event.type === "tool_call_approved";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="flex flex-col items-center gap-1 shrink-0"
    >
      <div className={`relative w-8 h-8 rounded-full flex items-center justify-center border
        ${isBlocked ? "border-red-500 bg-red-500/20" : isApproved ? "border-green-500 bg-green-500/20" : "border-slate-600 bg-slate-800"}
      `}>
        {isBlocked && (
          <>
            <ShieldOff size={14} className="text-red-400" />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-red-500"
              animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </>
        )}
        {isApproved && <CheckCircle size={14} className="text-green-400" />}
        {!isBlocked && !isApproved && <Activity size={14} className="text-slate-400" />}
      </div>
      <span className="text-[9px] text-slate-500 font-mono max-w-[64px] text-center leading-tight">
        {event.type.replace(/_/g, " ")}
      </span>
    </motion.div>
  );
}

function TaintBreadcrumb({ taintChain }: { taintChain: string[] }) {
  if (taintChain.length === 0) return null;
  return (
    <div className="flex items-center gap-1 flex-wrap mt-1">
      <span className="text-[10px] text-red-400 font-mono">taint:</span>
      {taintChain.map((id, i) => (
        <span key={id} className="flex items-center gap-0.5">
          <span className="text-[10px] text-red-400/60 font-mono">
            {id.substring(0, 8)}
          </span>
          {i < taintChain.length - 1 && <span className="text-red-500">→</span>}
        </span>
      ))}
    </div>
  );
}

interface SecurityTimelineProps {
  events: AgentEvent[];
  violations: import("@agent-shield/shared-types").SecurityViolation[];
}

export function SecurityTimeline({ events, violations }: SecurityTimelineProps) {
  const relevantEvents = events.filter((e) =>
    ["tool_call_attempted", "tool_call_blocked", "tool_call_approved", "violation_detected"].includes(e.type),
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#1e1e2e]">
        <AlertTriangle size={14} className="text-slate-400" />
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Security Timeline</span>
        {violations.length > 0 && (
          <span className="ml-auto px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded font-mono">
            {violations.length} violation{violations.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Event nodes */}
      <div className="flex items-start gap-3 overflow-x-auto pb-2 min-h-[64px]">
        {relevantEvents.length === 0 ? (
          <div className="text-slate-600 text-xs font-mono self-center">No security events yet</div>
        ) : (
          <AnimatePresence>
            {relevantEvents.map((event, i) => (
              <EventNode key={`${event.type}-${event.timestamp}`} event={event} index={i} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Violations list */}
      <div className="mt-3 flex-1 overflow-y-auto space-y-2">
        <AnimatePresence>
          {violations.map((v) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2 bg-red-500/5 border border-red-500/30 rounded-lg"
            >
              <div className="flex items-center gap-2 mb-1">
                <ShieldOff size={11} className="text-red-400" />
                <span className="text-[10px] font-semibold text-red-300 uppercase tracking-wider">
                  {v.type.replace(/_/g, " ")}
                </span>
                <span className="ml-auto text-[10px] text-red-500 font-mono uppercase">{v.severity}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">{v.description}</p>
              <TaintBreadcrumb taintChain={v.taintChain} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
