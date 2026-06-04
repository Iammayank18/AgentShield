"use client";
import { useState } from "react";
import { useExecutionStore } from "@/stores/execution.store";
import { useExecutionStream } from "@/hooks/useExecutionStream";
import { ShieldToggle } from "@/components/ShieldToggle";
import { AgentConsole } from "@/components/AgentConsole";
import { SecurityTimeline } from "@/components/SecurityTimeline";
import { TrustGraph } from "@/components/TrustGraph";
import { PolicyDecisionBanner } from "@/components/PolicyDecisionBanner";
import { Shield, AlertTriangle, Play, RotateCcw } from "lucide-react";

export default function DemoPage() {
  const {
    steps,
    violations,
    eventLog,
    streamStatus,
    shieldEnabled,
    useAttackScenario,
    currentExecution,
    executionId,
    startExecution,
    toggleShield,
    toggleAttackScenario,
    resetExecution,
  } = useExecutionStore();

  const [isRunning, setIsRunning] = useState(false);

  useExecutionStream(executionId);

  const isBlocked = currentExecution?.status === "blocked" ?? null;

  async function runDemo() {
    if (isRunning) return;
    setIsRunning(true);
    resetExecution();

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
      const res = await fetch(`${apiUrl}/agent/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shieldEnabled,
          useAttackScenario,
        }),
      });
      const { executionId: id } = await res.json();
      startExecution(id);
    } finally {
      setIsRunning(false);
    }
  }

  const isStreaming = streamStatus === "streaming" || streamStatus === "connecting";

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#1e1e2e] px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-blue-400" />
          <span className="font-semibold text-slate-100">AgentShield</span>
          <span className="text-slate-600 text-xs font-mono">zero-trust runtime security</span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* Attack scenario toggle */}
          <button
            onClick={toggleAttackScenario}
            disabled={isStreaming}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors disabled:opacity-50 ${
              useAttackScenario
                ? "border-orange-500/40 bg-orange-500/10 text-orange-400"
                : "border-slate-700 bg-slate-800/50 text-slate-400 hover:text-slate-300"
            }`}
          >
            <AlertTriangle size={12} />
            {useAttackScenario ? "Attack Scenario" : "Normal Scenario"}
          </button>

          <ShieldToggle enabled={shieldEnabled} onToggle={toggleShield} disabled={isStreaming} />

          <button
            onClick={runDemo}
            disabled={isStreaming}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play size={12} />
            {isStreaming ? "Running..." : "Run Demo"}
          </button>

          {streamStatus === "completed" && (
            <button
              onClick={resetExecution}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-xs transition-colors"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          )}
        </div>
      </header>

      {/* Outcome banner */}
      {streamStatus === "completed" && (
        <div className="px-6 pt-3">
          <PolicyDecisionBanner
            isBlocked={useAttackScenario ? (isBlocked ?? false) : null}
            streamStatus={streamStatus}
          />
        </div>
      )}

      {/* Main 3-panel layout */}
      <div className="flex-1 grid grid-cols-3 gap-0 overflow-hidden">
        {/* Panel 1: Agent Console */}
        <div className="border-r border-[#1e1e2e] p-4 overflow-y-auto">
          <AgentConsole
            steps={steps}
            streamStatus={streamStatus}
            isBlocked={currentExecution?.status === "blocked"}
          />
        </div>

        {/* Panel 2: Security Timeline */}
        <div className="border-r border-[#1e1e2e] p-4 overflow-y-auto">
          <SecurityTimeline events={eventLog} violations={violations} />
        </div>

        {/* Panel 3: Trust Graph */}
        <div className="p-4">
          <TrustGraph steps={steps} />
        </div>
      </div>

      {/* Status bar */}
      <footer className="border-t border-[#1e1e2e] px-6 py-2 flex items-center gap-4 text-[11px] text-slate-600 font-mono">
        <span>
          status:{" "}
          <span className={streamStatus === "completed" ? "text-green-400" : streamStatus === "streaming" ? "text-blue-400" : "text-slate-500"}>
            {streamStatus}
          </span>
        </span>
        <span>steps: <span className="text-slate-400">{steps.length}</span></span>
        <span>violations: <span className={violations.length > 0 ? "text-red-400" : "text-slate-400"}>{violations.length}</span></span>
        <span>mode: <span className={shieldEnabled ? "text-blue-400" : "text-red-400"}>{shieldEnabled ? "protected" : "unprotected"}</span></span>
        {executionId && <span className="ml-auto">exec: {executionId.substring(0, 8)}</span>}
      </footer>
    </div>
  );
}
