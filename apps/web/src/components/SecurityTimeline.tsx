"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { AgentEvent } from "@agent-shield/shared-types";
import { ShieldOff, CheckCircle, AlertTriangle, Activity, Fingerprint, Zap } from "lucide-react";

const EVENT_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  tool_call_blocked:         { color: "text-red-400",    bg: "bg-red-500/15 border-red-500/40",    icon: <ShieldOff size={12} />,   label: "Blocked" },
  violation_detected:        { color: "text-red-400",    bg: "bg-red-500/10 border-red-500/30",    icon: <AlertTriangle size={12} />, label: "Violation" },
  tool_call_approved:        { color: "text-emerald-400",bg: "bg-emerald-500/15 border-emerald-500/40", icon: <CheckCircle size={12} />, label: "Approved" },
  identity_spoofing_detected:{ color: "text-amber-400",  bg: "bg-amber-500/15 border-amber-500/40", icon: <Fingerprint size={12} />, label: "Spoofing" },
  tool_call_attempted:       { color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/30",  icon: <Zap size={12} />,         label: "Attempted" },
};

function EventNode({ event, index }: { event: AgentEvent; index: number }) {
  const cfg = EVENT_CONFIG[event.type];
  if (!cfg) return null;
  const isPulsing = event.type === "tool_call_blocked" || event.type === "identity_spoofing_detected" || event.type === "violation_detected";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25, delay: index * 0.04 }}
      className="flex flex-col items-center gap-1.5 shrink-0 cursor-default"
      title={event.type.replace(/_/g, " ")}
    >
      <div className={`relative w-9 h-9 rounded-xl border flex items-center justify-center ${cfg.bg} ${cfg.color}`}>
        {cfg.icon}
        {isPulsing && (
          <motion.div
            className={`absolute inset-0 rounded-xl border ${event.type === "identity_spoofing_detected" ? "border-amber-500" : "border-red-500"}`}
            animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}
      </div>
      <span className={`text-[9px] font-mono font-semibold tracking-wide ${cfg.color}`}>
        {cfg.label}
      </span>
    </motion.div>
  );
}

function TaintBreadcrumb({ taintChain }: { taintChain: string[] }) {
  if (taintChain.length === 0) return null;
  return (
    <div className="flex items-center gap-1 flex-wrap mt-1.5">
      <span className="text-[9px] text-red-500/70 font-mono font-semibold">taint chain:</span>
      {taintChain.map((id, i) => (
        <span key={id} className="flex items-center gap-0.5">
          <span className="text-[9px] text-red-400/50 font-mono bg-red-500/10 px-1 rounded">
            {id.substring(0, 8)}
          </span>
          {i < taintChain.length - 1 && <span className="text-red-500/40 text-[9px]">→</span>}
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
    Object.keys(EVENT_CONFIG).includes(e.type),
  );

  const spoofingCount = violations.filter((v) => v.type === "identity_spoofing").length;
  const blockCount = violations.filter((v) => v.type !== "identity_spoofing").length;

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/[0.04]">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertTriangle size={13} className="text-red-400" />
        </div>
        <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Security Timeline</span>
        <div className="ml-auto flex items-center gap-1.5">
          {blockCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-mono font-semibold text-red-400">
              {blockCount} blocked
            </span>
          )}
          {spoofingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono font-semibold text-amber-400">
              {spoofingCount} spoof
            </span>
          )}
        </div>
      </div>

      {/* Event nodes row */}
      <div className="flex items-start gap-2.5 overflow-x-auto pb-3 min-h-[72px]">
        {relevantEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center w-full h-16 gap-2">
            <Activity size={16} className="text-slate-700" />
            <span className="text-slate-700 text-[11px] font-mono">No security events yet</span>
          </div>
        ) : (
          <AnimatePresence>
            {relevantEvents.map((event, i) => (
              <EventNode key={`${event.type}-${event.timestamp}-${i}`} event={event} index={i} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Violations */}
      <div className="mt-2 flex-1 overflow-y-auto space-y-2">
        <AnimatePresence>
          {violations.map((v) => {
            const isSpoofing = v.type === "identity_spoofing";
            return (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className={`relative rounded-xl border overflow-hidden ${
                  isSpoofing
                    ? "bg-amber-500/[0.04] border-amber-500/20"
                    : "bg-red-500/[0.04] border-red-500/20"
                }`}
              >
                {/* Accent bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${isSpoofing ? "bg-amber-500/60" : "bg-red-500/60"}`} />

                <div className="pl-3.5 pr-3 py-2.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${isSpoofing ? "bg-amber-500/15" : "bg-red-500/15"}`}>
                      {isSpoofing
                        ? <Fingerprint size={10} className="text-amber-400" />
                        : <ShieldOff size={10} className="text-red-400" />
                      }
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isSpoofing ? "text-amber-300" : "text-red-300"}`}>
                      {v.type.replace(/_/g, " ")}
                    </span>
                    <span className={`ml-auto text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                      isSpoofing ? "bg-amber-500/15 text-amber-500" : "bg-red-500/15 text-red-500"
                    }`}>
                      {v.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{v.description}</p>
                  <TaintBreadcrumb taintChain={v.taintChain} />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
